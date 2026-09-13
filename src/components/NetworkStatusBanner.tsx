"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { isNativePlatform, isProbablyNativeShell } from "@/lib/nativeApp";

/**
 * Lightweight connectivity banner for native + web. Does not claim offline mode.
 */
export function NetworkStatusBanner() {
  const [offline, setOffline] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let removeNativeListener: (() => void) | undefined;

    async function setup() {
      const native = (await isNativePlatform()) || isProbablyNativeShell();
      if (cancelled) return;
      setVisible(true);

      const syncBrowser = () => {
        setOffline(typeof navigator !== "undefined" ? !navigator.onLine : false);
      };
      syncBrowser();
      window.addEventListener("online", syncBrowser);
      window.addEventListener("offline", syncBrowser);

      if (native) {
        try {
          const { Network } = await import("@capacitor/network");
          const status = await Network.getStatus();
          if (!cancelled) setOffline(!status.connected);
          const handle = await Network.addListener(
            "networkStatusChange",
            (next) => {
              setOffline(!next.connected);
            },
          );
          removeNativeListener = () => {
            void handle.remove();
          };
        } catch {
          // Plugin unavailable in plain browser — browser events are enough.
        }
      }

      return () => {
        window.removeEventListener("online", syncBrowser);
        window.removeEventListener("offline", syncBrowser);
      };
    }

    let browserCleanup: (() => void) | undefined;
    void setup().then((cleanup) => {
      browserCleanup = cleanup;
    });

    return () => {
      cancelled = true;
      browserCleanup?.();
      removeNativeListener?.();
    };
  }, []);

  if (!visible || !offline) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-[100] border-b border-amber-700/30 bg-amber-50 px-4 py-2 text-center text-sm text-amber-950"
      style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
    >
      <span className="inline-flex items-center gap-2 font-medium">
        <WifiOff size={16} aria-hidden />
        No internet connection. Some HopeBridge features are unavailable until
        you reconnect.
      </span>
    </div>
  );
}
