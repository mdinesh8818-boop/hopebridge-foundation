import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../providers/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "HopeBridge Foundation",
    template: "%s · HopeBridge Foundation",
  },
  description:
    "HopeBridge Foundation — public nonprofit website and authenticated operating platform for campaigns, programs, donors, volunteers, impact, and AI-assisted insights.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "HopeBridge",
    statusBarStyle: "default",
  },
  applicationName: "HopeBridge Foundation",
};

export const viewport: Viewport = {
  themeColor: "#0d5f44",
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
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}