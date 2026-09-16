import type { Metadata } from "next";
import { PageHero, SectionHeading } from "@/components/public/PageChrome";
import { ContactInquiryForm } from "@/components/public/ContactInquiryForm";

export const metadata: Metadata = {
  title: "Partner With Us",
  description: "Corporate, civic, and nonprofit partnership inquiries for HopeBridge.",
};

export default function PartnerPage() {
  return (
    <>
      <PageHero
        kicker="Partner With Us"
        title="Build impact together"
        summary="HopeBridge welcomes partnerships that strengthen local delivery — civic institutions, corporations, foundations, and peer nonprofits."
      />

      <section className="pub-section">
        <div className="pub-container grid gap-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <SectionHeading
              kicker="Partnership types"
              title="Collaboration with clear boundaries"
              summary="We do not invent accreditation badges or partner logos. Share your organization and goals, and we will follow up through the inquiry channel."
            />
            <ul className="mt-8 space-y-3 text-sm text-[#4d6359]">
              <li>Program co-delivery and referrals</li>
              <li>Volunteer workforce partnerships</li>
              <li>Sponsored community events</li>
              <li>In-kind and capacity-building support</li>
            </ul>
          </div>
          <ContactInquiryForm defaultKind="partner" submitLabel="Submit partnership inquiry" />
        </div>
      </section>
    </>
  );
}
