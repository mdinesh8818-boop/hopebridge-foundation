import type { CapacitorConfig } from "@capacitor/cli";
import { KeyboardResize } from "@capacitor/keyboard";

/**
 * Capacitor uses a remote-hosted Next.js backend (not static export).
 *
 * Why: HopeBridge depends on Next.js API routes (AI Assistant), dynamic
 * server behavior, Firebase Auth session cookies, and live Firestore.
 * `output: 'export'` would break those capabilities.
 *
 * Native shells load the deployed web app URL. Secrets (OPENAI_API_KEY)
 * remain server-side only.
 *
 * Override the launch URL with CAPACITOR_SERVER_URL or NEXT_PUBLIC_APP_URL.
 * Bundle ID `com.hopebridge.app` is a temporary development identifier —
 * confirm the final commercial Bundle ID / applicationId before store submit.
 */
const serverUrl = (
  process.env.CAPACITOR_SERVER_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://hopebridge-foundation.vercel.app"
).replace(/\/$/, "");

const config: CapacitorConfig = {
  appId: "com.hopebridge.app",
  appName: "HopeBridge",
  webDir: "mobile/www",
  server: {
    url: serverUrl,
    cleartext: false,
    androidScheme: "https",
    allowNavigation: [
      "hopebridge-foundation.vercel.app",
      "*.vercel.app",
      "*.googleapis.com",
      "*.gstatic.com",
      "*.firebaseapp.com",
      "*.firebaseio.com",
      "identitytoolkit.googleapis.com",
      "securetoken.googleapis.com",
      "firestore.googleapis.com",
    ],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: "#0d5f44",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0d5f44",
    },
    Keyboard: {
      resize: KeyboardResize.Body,
      resizeOnFullScreen: true,
    },
  },
  ios: {
    contentInset: "automatic",
    preferredContentMode: "mobile",
    backgroundColor: "#0d5f44",
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#0d5f44",
  },
};

export default config;
