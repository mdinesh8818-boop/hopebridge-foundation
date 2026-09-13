"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { accessRedirectPath } from "@/lib/accessControl";
import {
  NATIVE_AUTHENTICATED_ENTRY,
  NATIVE_UNAUTHENTICATED_ENTRY,
  isNativePlatform,
  isProbablyNativeShell,
} from "@/lib/nativeApp";

/**
 * When HopeBridge runs inside the Capacitor shell, skip the public marketing
 * homepage and route into the product auth/workspace flow.
 */
export function NativeLaunchRedirect() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading, profileLoading } = useAuth();
  const [native, setNative] = useState(isProbablyNativeShell());

  useEffect(() => {
    let cancelled = false;
    void isNativePlatform().then((value) => {
      if (!cancelled) setNative(value || isProbablyNativeShell());
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!native) return;
    if (loading || profileLoading) return;
    if (pathname !== "/") return;

    if (!user) {
      router.replace(NATIVE_UNAUTHENTICATED_ENTRY);
      return;
    }

    const destination = accessRedirectPath(profile);
    router.replace(
      destination === "/dashboard" ? NATIVE_AUTHENTICATED_ENTRY : destination,
    );
  }, [loading, native, pathname, profile, profileLoading, router, user]);

  return null;
}
