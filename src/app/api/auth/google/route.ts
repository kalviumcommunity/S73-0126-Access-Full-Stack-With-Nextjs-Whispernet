// app/api/auth/google/route.ts
import { createRemoteJWKSet, jwtVerify } from "jose";
import { prisma } from "@/lib/db/prisma";
import { ok, handleRouteError, fieldErrors } from "@/lib/http/responses";
import { AppError } from "@/lib/http/errors";
import { signSession } from "@/lib/auth/jwt";
import { rateLimit, clientIp } from "@/lib/auth/rateLimit";
import { googleAuthSchema } from "@/lib/validation/auth";
import { invalidate, cacheTags } from "@/lib/cache";
import { logger } from "@/lib/utils/logger";

const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

// Google's public signing keys. `createRemoteJWKSet` caches them and refreshes
// on rotation, so verification is local instead of a round trip to Google's
// tokeninfo endpoint on every sign-in.
const googleKeys = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs")
);

interface GoogleClaims {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

function googleClientId(): string {
  const clientId =
    process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new AppError(
      "Google Sign-In is not configured on this server",
      "INTERNAL_ERROR",
      503
    );
  }

  return clientId;
}

/**
 * Verifies the ID token's signature, issuer, audience and expiry against
 * Google's JWKS. Anything less would let a caller hand us a token minted for a
 * different application.
 */
async function verifyGoogleIdToken(idToken: string): Promise<GoogleClaims> {
  try {
    const { payload } = await jwtVerify(idToken, googleKeys, {
      issuer: GOOGLE_ISSUERS,
      audience: googleClientId(),
    });

    return payload as unknown as GoogleClaims;
  } catch (error) {
    logger.warn("Google ID token rejected", {
      message: error instanceof Error ? error.message : String(error),
    });
    throw new AppError(
      "That Google sign-in could not be verified. Please try again.",
      "UNAUTHORIZED",
      401
    );
  }
}

export async function POST(request: Request) {
  try {
    await rateLimit(`google:${clientIp(request)}`, 60, 60);

    const parsed = googleAuthSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw AppError.badRequest("Validation failed", fieldErrors(parsed.error));
    }

    const { credential, action } = parsed.data;
    const claims = await verifyGoogleIdToken(credential);

    if (!claims.email || claims.email_verified === false) {
      throw new AppError(
        "Your Google account does not have a verified email address",
        "UNAUTHORIZED",
        401
      );
    }

    const email = claims.email.toLowerCase();
    const googleId = claims.sub;

    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId }, { email }] },
    });

    if (!user) {
      if (action === "login") {
        throw new AppError(
          "No account found for this Google address. Create an account first.",
          "UNAUTHORIZED",
          401
        );
      }

      user = await prisma.user.create({
        data: {
          email,
          name: claims.name ?? email.split("@")[0],
          googleId,
          avatar: claims.picture,
          authProvider: "google",
          password: "",
          role: "TEACHER",
        },
      });

      await invalidate(cacheTags.users);
      logger.info("Account created via Google", { userId: user.id });
    } else if (!user.googleId) {
      // Existing email account signing in with Google for the first time:
      // link the identities rather than creating a duplicate record.
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId, avatar: claims.picture ?? user.avatar },
      });
    }

    const token = await signSession({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      avatar: user.avatar,
    });

    return ok(
      {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
        },
      },
      action === "signup"
        ? "Account created successfully"
        : "Signed in successfully"
    );
  } catch (error) {
    return handleRouteError(error, "POST /api/auth/google");
  }
}
