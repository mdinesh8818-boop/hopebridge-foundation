"use client";

import { useEffect } from "react";

/**
 * Opens a module create workflow when navigated with ?action=create
 * (e.g. from Dashboard hero quick actions).
 */
export function useModuleCreateAction(onCreate: () => void) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") === "create") {
      onCreate();
    }
  }, [onCreate]);
}
