"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { accessRedirectPath } from "@/lib/accessControl";
import { getSafeDashboardPath } from "@/lib/auth";

export function AuthLoading({
  message = "Loading your workspace...",
}: {
  message?: string;
}) {
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
  const { user, profile, loading, profileLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading || profileLoading) return;

    if (!user) {
      const next = pathname.startsWith("/dashboard") ? pathname : "/dashboard";
      router.replace(`/auth/login?next=${encodeURIComponent(next)}`);
      return;
    }

    const destination = accessRedirectPath(profile);
    if (destination !== "/dashboard") {
      router.replace(destination);
    }
  }, [loading, pathname, profile, profileLoading, router, user]);

  if (loading || profileLoading || !user) {
    return <AuthLoading />;
  }

  if (!profile || profile.status !== "active") {
    return <AuthLoading message="Checking organization access..." />;
  }

  return <>{children}</>;
}

/** Login/signup only — redirects authenticated users based on access status. */
export function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, profileLoading } = useAuth();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (loading || profileLoading || !user) return;

    const next = getSafeDashboardPath(searchParams.get("next"));
    const statusPath = accessRedirectPath(profile);
    if (statusPath === "/dashboard") {
      window.location.assign(next);
      return;
    }
    window.location.assign(statusPath);
  }, [loading, profile, profileLoading, searchParams, user]);

  if (loading || profileLoading || user) {
    return <AuthLoading message="Redirecting..." />;
  }

  return <>{children}</>;
}

/** Pending / disabled screens — require auth, block dashboard. */
export function AccessStatusRoute({
  children,
  expected,
}: {
  children: React.ReactNode;
  expected: "pending" | "disabled";
}) {
  const { user, profile, loading, profileLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || profileLoading) return;

    if (!user) {
      router.replace("/auth/login");
      return;
    }

    if (profile?.status === "active") {
      router.replace("/dashboard");
      return;
    }

    if (expected === "pending" && profile?.status === "disabled") {
      router.replace("/auth/disabled");
    }
    if (expected === "disabled" && profile?.status === "pending") {
      router.replace("/auth/pending");
    }
  }, [expected, loading, profile, profileLoading, router, user]);

  if (loading || profileLoading || !user) {
    return <AuthLoading />;
  }

  if (profile?.status === "active") {
    return <AuthLoading message="Opening your workspace..." />;
  }

  return <>{children}</>;
}

export { useAuth };
