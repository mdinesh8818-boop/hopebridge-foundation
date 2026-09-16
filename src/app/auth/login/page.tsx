"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getAuthErrorMessage, getSafeDashboardPath, redirectAfterAuth } from "@/lib/auth";
import { useAuth } from "@/providers/AuthProvider";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const nextPath = getSafeDashboardPath(searchParams.get("next"));
  const signupHref =
    nextPath === "/dashboard"
      ? "/auth/signup"
      : `/auth/signup?next=${encodeURIComponent(nextPath)}`;

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await login(email, password);
      redirectAfterAuth(searchParams.get("next"));
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#faf7ef] px-6 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(13,95,68,0.10),transparent_34%),radial-gradient(circle_at_85%_10%,rgba(212,162,40,0.12),transparent_30%),linear-gradient(180deg,#fffdf6,#faf7ef)]" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="pub-focus-ring inline-flex items-center gap-3 rounded-xl">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#efd786] bg-gradient-to-br from-[#fff1a3] to-[#c28a17] text-sm font-black text-[#073b2f]">
              H
            </span>
            <span className="text-left">
              <span className="block text-lg font-bold text-[#18392e]">HopeBridge</span>
              <span className="block text-xs text-[#65766e]">Foundation Platform</span>
            </span>
          </Link>
        </div>

        <div className="rounded-3xl border border-[#e8decb] bg-white/90 p-8 shadow-[0_20px_50px_rgba(24,57,46,0.08)] backdrop-blur">
          <h1 className="pub-serif text-3xl text-[#18392e]">Sign in</h1>
          <p className="mt-2 text-sm text-[#4d6359]">
            Access your nonprofit workspace. Existing access-control behavior is unchanged.
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm text-[#4d6359]" htmlFor="login-email">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                className="hb-input pub-focus-ring w-full rounded-xl px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-[#4d6359]" htmlFor="login-password">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
                className="hb-input pub-focus-ring w-full rounded-xl px-4 py-3"
              />
            </div>

            {error ? (
              <p
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="hb-gold-btn pub-focus-ring w-full rounded-xl py-3 font-bold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#4d6359]">
            Need an account?{" "}
            <Link href={signupHref} className="font-semibold text-[#0d5f44] hover:underline">
              Create one
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-[#65766e]">
          <Link href="/" className="hover:text-[#0d5f44]">
            ← Back to HopeBridge Foundation
          </Link>
        </p>
      </div>
    </main>
  );
}
