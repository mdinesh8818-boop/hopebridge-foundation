import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../providers/AuthProvider";
import { OrganizationProvider } from "../providers/OrganizationProvider";
import { NativeAppProviders } from "@/components/NativeAppProviders";
import { buildPageMetadata } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const googleVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim();

export const metadata: Metadata = {
  ...buildPageMetadata({ path: "/", index: true }),
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "HopeBridge | Nonprofit Management & Intelligence Platform",
    template: "%s | HopeBridge",
  },
  description:
    "HopeBridge helps nonprofit organizations manage campaigns, programs, donors, volunteers, beneficiaries, teams, reporting, impact analytics, and organizational insights in one connected platform.",
  applicationName: "HopeBridge",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "HopeBridge",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg" }],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  ...(googleVerification
    ? { verification: { google: googleVerification } }
    : {}),
};

export const viewport: Viewport = {
  themeColor: "#0d5f44",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <OrganizationProvider>
            <NativeAppProviders>{children}</NativeAppProviders>
          </OrganizationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
