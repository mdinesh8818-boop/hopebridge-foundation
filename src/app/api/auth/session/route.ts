import { NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  getSessionCookieMaxAgeSeconds,
} from "@/lib/auth";
import { verifyFirebaseIdToken } from "@/lib/session-token";

type SessionBody = {
  idToken?: unknown;
};

function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function POST(request: Request) {
  let body: SessionBody;

  try {
    body = (await request.json()) as SessionBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const idToken = typeof body.idToken === "string" ? body.idToken.trim() : "";
  if (!idToken) {
    return NextResponse.json({ error: "idToken is required." }, { status: 400 });
  }

  try {
    const verified = await verifyFirebaseIdToken(idToken);
    const exp = verified.payload.exp;
    const expiresAtMs = typeof exp === "number" ? exp * 1000 : undefined;
    const maxAge = getSessionCookieMaxAgeSeconds(expiresAtMs);

    const response = NextResponse.json({
      ok: true,
      uid: verified.uid,
    });

    response.cookies.set(AUTH_COOKIE_NAME, idToken, sessionCookieOptions(maxAge));
    return response;
  } catch {
    return NextResponse.json(
      { error: "Invalid or expired Firebase ID token." },
      { status: 401 },
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE_NAME, "", sessionCookieOptions(0));
  return response;
}
