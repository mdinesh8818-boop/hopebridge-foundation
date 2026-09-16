import type { Metadata } from "next";
import { CtaLink, PageHero, SectionHeading } from "@/components/public/PageChrome";

export const metadata: Metadata = {
  title: "Organization",
  description: "HopeBridge Foundation organizational structure and accountability.",
};

export default function OrganizationAboutPage() {
  return (
    <>
      <PageHero
        kicker="Organization"
        title="Structure with accountability"
        summary="Public organization pages share governance posture without exposing private administration tools or sensitive records."
        actions={
          <CtaLink href="/auth/login?next=%2Fdashboard%2Forganization" variant="light">
            Staff: Organization module
          </CtaLink>
        }
      />

      <section className="pub-section">
        <div className="pub-container max-w-3xl space-y-8">
          <SectionHeading
            kicker="Accountability"
            title="Public clarity, private operations"
            summary="Legal profile details, EIN handling, and internal administration remain in the authenticated Organization module. The public site only presents intentionally safe information."
          />
          <ul className="space-y-3 text-sm text-[#4d6359]">
            <li>Public storytelling and giving pathways</li>
            <li>Authenticated workspace for campaigns, programs, donors, volunteers, and reporting</li>
            <li>Clear separation between charitable gifts and SaaS subscription billing</li>
            <li>No fabricated accreditations or partner badges</li>
          </ul>
          <CtaLink href="/privacy" variant="secondary">
            Privacy overview
          </CtaLink>
        </div>
      </section>
    </>
  );
}
