import type { Metadata } from "next";
import { CtaLink, PageHero, SectionHeading } from "@/components/public/PageChrome";
import { RESOURCE_ITEMS } from "@/data/public-content";

export const metadata: Metadata = {
  title: "Resources",
  description: "HopeBridge Foundation resources, guides, and support links.",
};

export default function ResourcesPage() {
  return (
    <>
      <PageHero
        kicker="Resources"
        title="Guides, support, and platform access"
        summary="A practical resource hub for community visitors and nonprofit teams exploring HopeBridge."
      />

      <section className="pub-section">
        <div className="pub-container">
          <SectionHeading kicker="Resource hub" title="Find the right next step" />
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {RESOURCE_ITEMS.map((item) => (
              <article key={item.href + item.title} className="border border-[#e8decb] bg-white p-6">
                <p className="text-xs font-bold tracking-[0.14em] text-[#c28a17] uppercase">
                  {item.type}
                </p>
                <h2 className="mt-2 text-xl font-semibold text-[#18392e]">{item.title}</h2>
                <p className="mt-3 text-sm text-[#4d6359]">{item.summary}</p>
                <div className="mt-5">
                  <CtaLink href={item.href} variant="secondary">
                    Open
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
