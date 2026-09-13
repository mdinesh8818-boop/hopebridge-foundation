"use client";

import { NativeLaunchRedirect } from "@/components/NativeLaunchRedirect";
import { NativeRuntimeBootstrap } from "@/components/NativeRuntimeBootstrap";
import { NetworkStatusBanner } from "@/components/NetworkStatusBanner";

export function NativeAppProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NativeRuntimeBootstrap />
      <NativeLaunchRedirect />
      <NetworkStatusBanner />
      {children}
    </>
  );
}
