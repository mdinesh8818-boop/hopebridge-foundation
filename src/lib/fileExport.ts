/**
 * File export helpers that work on web downloads and Capacitor Share.
 * Avoids embedding native-only permissions; no Filesystem plugin yet.
 */

import { isNativePlatform } from "@/lib/nativeApp";

export async function downloadOrShareTextFile(
  filename: string,
  contents: string,
  mimeType = "text/csv;charset=utf-8;",
): Promise<void> {
  const native = await isNativePlatform();

  if (native) {
    try {
      const { Share } = await import("@capacitor/share");
      await Share.share({
        title: filename,
        text: contents,
        dialogTitle: `Export ${filename}`,
      });
      return;
    } catch {
      // Fall through to anchor download (may be limited inside WebView).
    }
  }

  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
