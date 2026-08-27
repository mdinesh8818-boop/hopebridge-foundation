"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { redirectAfterAuth } from "@/lib/auth";

export function AuthLoading({ message = "Loading your workspace..." }: { message?: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black p-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white">HopeBridge</h1>
        <p className="mt-3 text-gray-400">{message}</p>
      </div>
    </main>
  );
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading || user) return;

    const next = pathname.startsWith("/dashboard") ? pathname : "/dashboard";
    router.replace(`/auth/login?next=${encodeURIComponent(next)}`);
  }, [loading, pathname, router, user]);

  if (loading || !user || !profile) {
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

  if (loading || user) {
    return <AuthLoading message="Redirecting to your workspace..." />;
  }

  return <>{children}</>;
}
