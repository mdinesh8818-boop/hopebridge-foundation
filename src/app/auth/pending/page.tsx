"use client";

import Link from "next/link";
import { AccessStatusRoute, useAuth } from "@/components/AuthGuard";
import { isAwaitingOrganizationInvite } from "@/lib/accessControl";

export default function PendingAccessPage() {
  const { logout, profile, user } = useAuth();
  const awaitingInvite = isAwaitingOrganizationInvite(profile);

  return (
    <AccessStatusRoute expected="pending">
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#134e3a_0%,_#0a0a0a_45%,_#000_100%)] p-6">
        <div className="w-full max-w-lg rounded-3xl border border-amber-400/20 bg-zinc-950/90 p-8 shadow-2xl backdrop-blur-xl">
          <p className="text-xs font-semibold tracking-[0.18em] text-amber-300">
            HOPEBRIDGE ACCESS
          </p>
          <h1 className="mt-3 font-serif text-3xl text-white">
            Waiting for organization access
          </h1>
          <p className="mt-4 text-sm leading-6 text-zinc-300">
            {awaitingInvite
              ? "Your request to join an existing organization is pending. An organization administrator must activate your account before you can open a workspace."
              : "Your HopeBridge account is signed in and waiting for an organization administrator to activate you into their workspace."}
          </p>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            You are signed in as{" "}
            <span className="text-zinc-200">
              {profile?.email || user?.email || "your account"}
            </span>
            .
          </p>
          {awaitingInvite ? (
            <p className="mt-3 text-sm leading-6 text-zinc-500">
              You cannot create a new nonprofit workspace while this membership
              request is pending. Contact your organization administrator or
              sign out if you used the wrong account.
            </p>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-xl border border-white/15 px-5 py-3 text-sm font-medium text-zinc-200 transition hover:bg-white/5"
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
