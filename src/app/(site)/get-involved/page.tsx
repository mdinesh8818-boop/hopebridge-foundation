import type { Metadata } from "next";
import { CtaLink, PageHero, SectionHeading } from "@/components/public/PageChrome";

export const metadata: Metadata = {
  title: "Get Involved",
  description: "Donate, volunteer, fundraise, partner, and join HopeBridge events.",
};

const pathways = [
  {
    title: "Donate",
    summary: "Make a one-time or monthly charitable gift toward programs and community priorities.",
    href: "/donate",
  },
  {
    title: "Volunteer",
    summary: "Share time and skills across tutoring, food support, and outreach logistics.",
    href: "/get-involved/volunteer",
  },
  {
    title: "Fundraise",
    summary: "Start a peer campaign or workplace drive in support of HopeBridge causes.",
    href: "/get-involved/fundraise",
  },
  {
    title: "Partner With Us",
    summary: "Explore civic, corporate, and nonprofit collaborations.",
    href: "/get-involved/partner",
  },
  {
    title: "Events",
    summary: "See upcoming community gatherings and sample event pathways.",
    href: "/get-involved/events",
  },
];

export default function GetInvolvedPage() {
  return (
    <>
      <PageHero
        kicker="Get Involved"
        title="Choose how you will help"
        summary="Every pathway has an intentional next step. Where an external integration is not configured yet, the experience says so clearly."
        imageSrc="/hopebridge/volunteers/hero-volunteer-community.png"
        imageAlt="HopeBridge volunteer community visual"
        actions={<CtaLink href="/donate">Donate now</CtaLink>}
      />

      <section className="pub-section">
        <div className="pub-container">
          <SectionHeading
            kicker="Pathways"
            title="Meaningful ways to participate"
            summary="Volunteer interest is structured for future sync with the Volunteers module. Donations are provider-ready without collecting card data."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {pathways.map((item) => (
              <article key={item.href} className="border border-[#e8decb] bg-white p-6">
                <h2 className="pub-serif text-2xl text-[#18392e]">{item.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-[#4d6359]">{item.summary}</p>
                <div className="mt-5">
                  <CtaLink href={item.href} variant="emerald">
                    Continue
                  </CtaLink>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
