import type { User } from "firebase/auth";

/**
 * Establish an httpOnly session cookie by verifying the Firebase ID token
 * on the server. Does not expose private credentials to the client.
 */
export async function establishSession(user: User): Promise<void> {
  const idToken = await user.getIdToken(/* forceRefresh */ true);
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error("Unable to establish a secure session.");
  }
}

export async function destroySession(): Promise<void> {
  try {
    await fetch("/api/auth/session", {
      method: "DELETE",
      credentials: "same-origin",
    });
  } catch {
    // Best-effort; client Firebase sign-out still proceeds.
  }
}
