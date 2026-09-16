import type { Metadata } from "next";
import { DemoContentNotice } from "@/components/public/DemoContentNotice";
import { SiteFooter } from "@/components/public/SiteFooter";
import { SiteHeader } from "@/components/public/SiteHeader";

export const metadata: Metadata = {
  title: {
    default: "HopeBridge Foundation",
    template: "%s · HopeBridge Foundation",
  },
  description:
    "HopeBridge Foundation — a demo nonprofit public website connected to the HopeBridge operating platform for programs, impact, giving, and community involvement.",
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pub-page flex min-h-screen flex-col">
      <DemoContentNotice />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
