// lib/auth/jwt.ts
// JWT signing/verification via `jose` so the exact same code runs in Node
// route handlers and in Edge middleware.

import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import type { Role } from "@prisma/client";

export interface SessionClaims extends JWTPayload {
  userId: number;
  email: string;
  role: Role;
  name?: string | null;
  avatar?: string | null;
}

export const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

/**
 * Reads the signing secret at call time (not module load) so a misconfigured
 * deployment fails loudly on the first request instead of silently signing
 * tokens with a default value.
 */
function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET is missing or too short. Set a random value of at least 32 characters."
    );
  }

  return new TextEncoder().encode(secret);
}

export async function signSession(
  claims: Omit<SessionClaims, keyof JWTPayload>
): Promise<string> {
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setIssuer("ruraledu")
    .setAudience("ruraledu-client")
    .setExpirationTime(`${TOKEN_TTL_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionClaims> {
  const { payload } = await jwtVerify(token, getSecret(), {
    algorithms: ["HS256"],
    issuer: "ruraledu",
    audience: "ruraledu-client",
    clockTolerance: 5,
  });

  return payload as SessionClaims;
}

/** Pulls the bearer token out of an `Authorization` header, if present. */
export function bearerToken(header: string | null): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token.trim() || null;
}
