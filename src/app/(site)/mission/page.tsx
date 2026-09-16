import type { Metadata } from "next";
import { CtaLink, PageHero, SectionHeading } from "@/components/public/PageChrome";

export const metadata: Metadata = {
  title: "Our Mission",
  description: "HopeBridge Foundation mission, vision, and approach to community impact.",
};

export default function MissionPage() {
  return (
    <>
      <PageHero
        kicker="Our Mission"
        title="Dignity, opportunity, and accountable care"
        summary="HopeBridge exists to help communities move from fragmented assistance to coordinated, measurable progress — across education, health, food security, environment, and local resilience."
        imageSrc="/hopebridge/mission/hero-golden-path-cinematic.png"
        imageAlt="HopeBridge cinematic mission pathway"
        actions={
          <>
            <CtaLink href="/what-we-do">What we do</CtaLink>
            <CtaLink href="/impact" variant="light">
              View impact
            </CtaLink>
          </>
        }
      />

      <section className="pub-section">
        <div className="pub-container grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              kicker="Mission"
              title="Connect compassion with delivery"
              summary="We partner with communities to design programs that meet urgent needs and build lasting capacity — while operating with clarity through shared goals, transparent progress, and respectful storytelling."
            />
          </div>
          <div>
            <SectionHeading
              kicker="Vision"
              title="Every community can bridge from need to opportunity"
              summary="We envision a world where nonprofit teams, volunteers, donors, and local partners work from the same trusted picture of impact — so resources reach people with dignity and results."
            />
          </div>
        </div>
      </section>

      <section className="pub-section bg-[#fffdf6]">
        <div className="pub-container">
          <SectionHeading
            kicker="Values"
            title="How we show up"
            summary="Sample values for the HopeBridge demo organization — replace with your authenticated Mission & Vision records when publishing for a live nonprofit."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Dignity first",
                body: "People and communities are partners, not case numbers.",
              },
              {
                title: "Evidence with empathy",
                body: "We measure what matters and listen to what numbers cannot say.",
              },
              {
                title: "Stewardship",
                body: "Gifts, time, and trust are handled with care and clear boundaries.",
              },
            ].map((value) => (
              <article key={value.title} className="border-t-2 border-[#d4a228] pt-5">
                <h3 className="pub-serif text-2xl text-[#18392e]">{value.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#4d6359]">{value.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
