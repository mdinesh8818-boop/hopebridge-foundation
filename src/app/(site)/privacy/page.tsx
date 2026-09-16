import type { Metadata } from "next";
import { PageHero } from "@/components/public/PageChrome";

export const metadata: Metadata = {
  title: "Privacy",
  description: "HopeBridge Foundation privacy overview.",
};

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        kicker="Privacy"
        title="Respecting personal information"
        summary="A concise overview for the demo site. Replace with counsel-reviewed policy text before production launch."
      />
      <section className="pub-section">
        <div className="pub-container max-w-3xl space-y-4 text-sm leading-relaxed text-[#4d6359]">
          <p>
            Public pages only display intentionally public content. Private donor, beneficiary,
            volunteer, report, and administration data remain behind authentication.
          </p>
          <p>
            Forms on this site may store demo interest locally in your browser until email, CRM, or
            payment providers are connected. Do not submit sensitive personal data you would not want
            stored on a demo device.
          </p>
          <p>
            Firebase authentication and Firestore operational data are governed by project security
            rules. Public pages do not weaken those controls.
          </p>
        </div>
      </section>
    </>
  );
}
