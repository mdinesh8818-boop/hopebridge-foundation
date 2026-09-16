import type { Metadata } from "next";
import { CtaLink, PageHero, SectionHeading } from "@/components/public/PageChrome";
import { ContactInquiryForm } from "@/components/public/ContactInquiryForm";

export const metadata: Metadata = {
  title: "Fundraise",
  description: "Start a fundraising effort in support of HopeBridge Foundation.",
};

export default function FundraisePage() {
  return (
    <>
      <PageHero
        kicker="Fundraise"
        title="Rally supporters around a cause"
        summary="Peer fundraising, workplace drives, and community campaigns can eventually connect to HopeBridge campaigns. Tell us what you want to launch."
        actions={<CtaLink href="/donate">Make a direct gift</CtaLink>}
      />

      <section className="pub-section">
        <div className="pub-container grid gap-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <SectionHeading
              kicker="How it works"
              title="Provider-ready fundraising pathways"
              summary="Live peer-to-peer checkout is not enabled until a payment provider and campaign tooling are configured. Your inquiry helps the team prepare a real follow-up."
            />
            <ul className="mt-8 space-y-3 text-sm text-[#4d6359]">
              <li>Choose a program or general fund focus.</li>
              <li>Share your audience and fundraising goal.</li>
              <li>HopeBridge staff follow up when campaign tooling is connected.</li>
            </ul>
          </div>
          <ContactInquiryForm defaultKind="fundraise" submitLabel="Submit fundraising inquiry" />
        </div>
      </section>
    </>
  );
}
