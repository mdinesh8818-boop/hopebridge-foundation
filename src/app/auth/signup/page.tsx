"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getAuthErrorMessage, getSafeDashboardPath, redirectAfterAuth } from "@/lib/auth";
import { useAuth } from "@/providers/AuthProvider";

export default function SignupPage() {
  const searchParams = useSearchParams();
  const { signup } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const nextPath = getSafeDashboardPath(searchParams.get("next"));
  const loginHref =
    nextPath === "/dashboard"
      ? "/auth/login"
      : `/auth/login?next=${encodeURIComponent(nextPath)}`;

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await signup(email, password);
      redirectAfterAuth(searchParams.get("next"));
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#faf7ef] px-6 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(13,95,68,0.10),transparent_34%),radial-gradient(circle_at_88%_12%,rgba(212,162,40,0.12),transparent_30%),linear-gradient(180deg,#fffdf6,#faf7ef)]" />

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
          <h1 className="pub-serif text-3xl text-[#18392e]">Create account</h1>
          <p className="mt-2 text-sm text-[#4d6359]">
            Create your nonprofit workspace account. Authentication continues to use Firebase.
          </p>

          <form onSubmit={handleSignup} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm text-[#4d6359]" htmlFor="signup-email">
                Email
              </label>
              <input
                id="signup-email"
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
              <label className="mb-2 block text-sm text-[#4d6359]" htmlFor="signup-password">
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                minLength={6}
                required
                className="hb-input pub-focus-ring w-full rounded-xl px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-[#4d6359]" htmlFor="signup-confirm-password">
                Confirm password
              </label>
              <input
                id="signup-confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="••••••••"
                minLength={6}
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
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#4d6359]">
            Already have an account?{" "}
            <Link href={loginHref} className="font-semibold text-[#0d5f44] hover:underline">
              Sign in
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
