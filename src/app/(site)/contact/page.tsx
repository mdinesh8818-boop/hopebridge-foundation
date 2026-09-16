import type { Metadata } from "next";
import { PageHero, SectionHeading } from "@/components/public/PageChrome";
import { ContactInquiryForm } from "@/components/public/ContactInquiryForm";
import { ORG_CONTACT } from "@/data/public-content";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact HopeBridge Foundation.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        kicker="Contact"
        title="We are here to help"
        summary="Reach out about volunteering, partnerships, press, or general questions. Sample contact details are shown for the demo organization."
      />

      <section className="pub-section">
        <div className="pub-container grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <SectionHeading kicker="Reach us" title={ORG_CONTACT.name} />
            <div className="mt-6 space-y-2 text-sm text-[#4d6359]">
              <p>{ORG_CONTACT.email}</p>
              <p>{ORG_CONTACT.phone}</p>
              {ORG_CONTACT.addressLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
              <p className="pt-3 text-xs text-[#65766e]">{ORG_CONTACT.note}</p>
            </div>
          </div>
          <ContactInquiryForm />
        </div>
      </section>
    </>
  );
}
