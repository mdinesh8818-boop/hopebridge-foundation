"use client";

import Link from "next/link";
import { AccessStatusRoute, useAuth } from "@/components/AuthGuard";

export default function DisabledAccessPage() {
  const { logout, profile, user } = useAuth();

  return (
    <AccessStatusRoute expected="disabled">
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#3f1d1d_0%,_#0a0a0a_45%,_#000_100%)] p-6">
        <div className="w-full max-w-lg rounded-3xl border border-red-400/20 bg-zinc-950/90 p-8 shadow-2xl backdrop-blur-xl">
          <p className="text-xs font-semibold tracking-[0.18em] text-red-300">
            HOPEBRIDGE ACCESS
          </p>
          <h1 className="mt-3 font-serif text-3xl text-white">
            Access disabled
          </h1>
          <p className="mt-4 text-sm leading-6 text-zinc-300">
            This HopeBridge account does not currently have access to the
            organization workspace.
          </p>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Signed in as{" "}
            <span className="text-zinc-200">
              {profile?.email || user?.email || "your account"}
            </span>
            . Contact a HopeBridge administrator if you believe this is a
            mistake.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
            >
              Sign out
            </button>
            <Link
              href="/"
              className="rounded-xl border border-white/15 px-5 py-3 text-center text-sm font-medium text-zinc-200 transition hover:bg-white/5"
            >
              Back to home
            </Link>
          </div>
        </div>
      </main>
    </AccessStatusRoute>
  );
}
