"use client";

import { useEffect } from "react";
import {
  isExternalHttpUrl,
  isNativePlatform,
  isProbablyNativeShell,
} from "@/lib/nativeApp";

/**
 * Boots Capacitor plugins and routes external http(s) links through the system browser.
 */
export function NativeRuntimeBootstrap() {
  useEffect(() => {
    let cancelled = false;
    let removeClick: (() => void) | undefined;
    let removeAppUrlOpen: (() => void) | undefined;

    async function boot() {
      const native = (await isNativePlatform()) || isProbablyNativeShell();
      if (!native || cancelled) return;

      document.documentElement.classList.add("hb-native-app");
      document.body.classList.add("hb-native-app");

      try {
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        // Dark icons for HopeBridge ivory surfaces after splash.
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: "#faf7ef" });
      } catch {
        // Optional on web.
      }

      try {
        const { SplashScreen } = await import("@capacitor/splash-screen");
        await SplashScreen.hide();
      } catch {
        // Optional on web.
      }

      try {
        const { Keyboard, KeyboardResize } = await import("@capacitor/keyboard");
        await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
      } catch {
        // Optional.
      }

      const onClick = (event: MouseEvent) => {
        const target = event.target as HTMLElement | null;
        const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
        if (!anchor) return;
        const href = anchor.getAttribute("href");
        if (!href || href.startsWith("#") || href.startsWith("/")) return;
        if (!/^https?:\/\//i.test(href)) return;
        if (!isExternalHttpUrl(href)) return;
        event.preventDefault();
        void import("@capacitor/browser")
          .then(({ Browser }) => Browser.open({ url: href }))
          .catch(() => {
            window.open(href, "_blank", "noopener,noreferrer");
          });
      };
      document.addEventListener("click", onClick);
      removeClick = () => document.removeEventListener("click", onClick);

      try {
        const { App } = await import("@capacitor/app");
        const handle = await App.addListener("appUrlOpen", () => {
          // Deep links can be expanded later; keep listener registered for lifecycle readiness.
        });
        removeAppUrlOpen = () => {
          void handle.remove();
        };
      } catch {
        // Optional.
      }
    }

    void boot();
    return () => {
      cancelled = true;
      removeClick?.();
      removeAppUrlOpen?.();
      document.documentElement.classList.remove("hb-native-app");
      document.body.classList.remove("hb-native-app");
    };
  }, []);

  return null;
}
