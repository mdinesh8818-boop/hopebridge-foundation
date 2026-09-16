"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { redirectAfterAuth } from "@/lib/auth";

export function AuthLoading({ message = "Loading your workspace..." }: { message?: string }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#faf7ef] p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(13,95,68,0.10),transparent_34%),radial-gradient(circle_at_85%_10%,rgba(212,162,40,0.12),transparent_30%)]" />
      <div className="relative text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#efd786] bg-gradient-to-br from-[#fff1a3] to-[#c28a17] text-sm font-black text-[#073b2f]">
          H
        </div>
        <h1 className="pub-serif mt-4 text-3xl text-[#18392e]">HopeBridge</h1>
        <p className="mt-3 text-[#4d6359]">{message}</p>
      </div>
    </main>
  );
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading || user) return;

    const next = pathname.startsWith("/dashboard") ? pathname : "/dashboard";
    router.replace(`/auth/login?next=${encodeURIComponent(next)}`);
  }, [loading, pathname, router, user]);

  if (loading || !user) {
    return <AuthLoading />;
  }

  return <>{children}</>;
}

export function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (loading || !user) return;

    redirectAfterAuth(searchParams.get("next"));
  }, [loading, searchParams, user]);

  if (loading) {
    return <AuthLoading message="Preparing secure sign-in..." />;
  }

  if (user) {
    return <AuthLoading message="Redirecting to your workspace..." />;
  }

  return <>{children}</>;
}
