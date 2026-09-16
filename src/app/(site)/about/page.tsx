import type { Metadata } from "next";
import { CtaLink, PageHero, SectionHeading } from "@/components/public/PageChrome";
import { ORG_CONTACT } from "@/data/public-content";

export const metadata: Metadata = {
  title: "About",
  description: "About HopeBridge Foundation — who we are and how we work.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        kicker="About"
        title="A foundation built for community progress"
        summary="HopeBridge Foundation is the demo public face of a complete nonprofit digital platform: storytelling and giving on the outside, operations and intelligence after sign-in."
        actions={
          <>
            <CtaLink href="/mission">Mission & vision</CtaLink>
            <CtaLink href="/about/leadership" variant="light">
              Leadership
            </CtaLink>
          </>
        }
      />

      <section className="pub-section">
        <div className="pub-container grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading
              kicker="Who we are"
              title="HopeBridge Foundation"
              summary="We present a premium nonprofit public experience while staff manage programs, donors, volunteers, beneficiaries, teams, analytics, and AI-assisted insights inside the authenticated workspace."
            />
          </div>
          <div className="border border-[#e8decb] bg-white p-6">
            <h2 className="text-sm font-bold tracking-[0.14em] text-[#0d5f44] uppercase">
              Organization contact
            </h2>
            <p className="mt-4 text-sm text-[#18392e]">{ORG_CONTACT.name}</p>
            <p className="mt-2 text-sm text-[#4d6359]">{ORG_CONTACT.email}</p>
            <p className="text-sm text-[#4d6359]">{ORG_CONTACT.phone}</p>
            {ORG_CONTACT.addressLines.map((line) => (
              <p key={line} className="text-sm text-[#4d6359]">
                {line}
              </p>
            ))}
            <p className="mt-4 text-xs text-[#65766e]">{ORG_CONTACT.note}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <CtaLink href="/contact" variant="emerald">
                Contact
              </CtaLink>
              <CtaLink href="/about/organization" variant="secondary">
                Organization
              </CtaLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
