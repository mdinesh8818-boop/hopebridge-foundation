import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { FIREBASE_PROJECT_ID } from "./firebase-project";

const FIREBASE_SESSION_JWKS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
  ),
);

export type VerifiedFirebaseSession = {
  uid: string;
  email?: string;
  payload: JWTPayload;
};

/**
 * Verifies a Firebase Auth ID token (JWT) via Google's JWKS.
 * Safe for Edge (proxy) and Node (API routes). Does not use service-account secrets.
 */
export async function verifyFirebaseIdToken(
  token: string,
): Promise<VerifiedFirebaseSession> {
  const { payload } = await jwtVerify(token, FIREBASE_SESSION_JWKS, {
    issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
    audience: FIREBASE_PROJECT_ID,
  });

  const uid = typeof payload.sub === "string" ? payload.sub : "";
  if (!uid) {
    throw new Error("Firebase ID token is missing subject.");
  }

  return {
    uid,
    email: typeof payload.email === "string" ? payload.email : undefined,
    payload,
  };
}
