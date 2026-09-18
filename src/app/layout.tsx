import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../providers/AuthProvider";
import { OrganizationProvider } from "../providers/OrganizationProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HopeBridge",
  description: "Nonprofit intelligence and management platform",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "HopeBridge",
  },
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
        <AuthProvider>
          <OrganizationProvider>{children}</OrganizationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}