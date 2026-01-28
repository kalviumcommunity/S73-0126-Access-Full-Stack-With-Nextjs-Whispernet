// app/api/auth/google/route.ts
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { sendSuccess, sendError } from "@/lib/responseHandler";
import { ERROR_CODES } from "@/lib/errorCodes";

const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

interface GoogleTokenPayload {
  iss: string;
  azp: string;
  aud: string;
  sub: string; // Google user ID
  email: string;
  email_verified: boolean;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  iat: number;
  exp: number;
}

// Verify Google ID token
async function verifyGoogleToken(
  idToken: string
): Promise<GoogleTokenPayload | null> {
  try {
    // Verify with Google's tokeninfo endpoint
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
    );

    if (!response.ok) {
      console.error("Google token verification failed:", response.status);
      return null;
    }

    const payload = (await response.json()) as GoogleTokenPayload;

    // Verify the token is for our app
    if (payload.aud !== GOOGLE_CLIENT_ID) {
      console.error("Token audience mismatch");
      return null;
    }

    // Verify email is verified
    if (!payload.email_verified) {
      console.error("Email not verified");
      return null;
    }

    return payload;
  } catch (error) {
    console.error("Error verifying Google token:", error);
    return null;
  }
}

export async function POST(req: Request) {
  // Check environment variables
  if (!JWT_SECRET) {
    console.error("CRITICAL: JWT_SECRET is not defined");
    return sendError(
      "Internal server configuration error",
      ERROR_CODES.INTERNAL_ERROR,
      500
    );
  }

  if (!GOOGLE_CLIENT_ID) {
    console.error("CRITICAL: GOOGLE_CLIENT_ID is not defined");
    return sendError(
      "Google Sign-In is not configured",
      ERROR_CODES.INTERNAL_ERROR,
      500
    );
  }

  try {
    const { credential, action } = await req.json();

    if (!credential) {
      return sendError(
        "Google credential is required",
        ERROR_CODES.VALIDATION_ERROR,
        400
      );
    }

    // Verify the Google token
    const googlePayload = await verifyGoogleToken(credential);

    if (!googlePayload) {
      return sendError(
        "Invalid Google credential",
        ERROR_CODES.AUTH_ERROR,
        401
      );
    }

    const { sub: googleId, email, name, picture } = googlePayload;

    // Check if user exists
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId }, { email }],
      },
    });

    if (action === "signup") {
      // For signup: Create new user if doesn't exist
      if (user) {
        // User already exists - either by Google or email
        if (user.authProvider === "email" && !user.googleId) {
          // User signed up with email before, link Google account
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              googleId,
              avatar: picture || user.avatar,
              name: name || user.name,
            },
          });
        }
        // If already has Google linked, just proceed to login
      } else {
        // Create new user with Google
        user = await prisma.user.create({
          data: {
            email,
            name,
            googleId,
            avatar: picture,
            authProvider: "google",
            password: "", // No password for Google users
            role: "TEACHER", // Default role
          },
        });
      }
    } else {
      // For login: User must exist
      if (!user) {
        return sendError(
          "No account found with this Google account. Please sign up first.",
          ERROR_CODES.AUTH_ERROR,
          401
        );
      }

      // If user exists but signed up with email and hasn't linked Google
      if (user.authProvider === "email" && !user.googleId) {
        // Link Google account to existing email account
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId,
            avatar: picture || user.avatar,
          },
        });
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        avatar: user.avatar,
      },
      JWT_SECRET,
      { expiresIn: "7d" } // Longer expiry for OAuth users
    );

    return sendSuccess(
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
      action === "signup" ? "Account created successfully" : "Login successful"
    );
  } catch (error) {
    console.error("Google auth failed:", error);
    return sendError("Authentication failed", ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
