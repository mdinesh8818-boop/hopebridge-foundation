import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CtaLink, PageHero, SectionHeading } from "@/components/public/PageChrome";
import { PUBLIC_PROGRAMS } from "@/data/public-content";

export const metadata: Metadata = {
  title: "What We Do",
  description: "HopeBridge programs, community support, initiatives, and approach.",
};

export default function WhatWeDoPage() {
  return (
    <>
      <PageHero
        kicker="What We Do"
        title="Programs that meet real community needs"
        summary="From learning and healthcare to clean water and food security, HopeBridge presents cause areas clearly while keeping private operational data inside the authenticated platform."
        imageSrc="/hopebridge/programs/hero-program-nexus.png"
        imageAlt="HopeBridge programs visual"
        actions={<CtaLink href="/programs">Browse programs</CtaLink>}
      />

      <section id="community" className="pub-section">
        <div className="pub-container pub-split">
          <div>
            <SectionHeading
              kicker="Community support"
              title="Local partnerships, practical help"
              summary="We work alongside schools, clinics, pantries, civic groups, and neighborhood leaders. Public pages share the purpose; the HopeBridge workspace coordinates the delivery."
            />
          </div>
          <div className="pub-media-frame min-h-[300px]">
            <Image
              src="/hopebridge/teams/hero-team-collaboration.png"
              alt="HopeBridge collaboration visual"
              fill
              sizes="(max-width: 900px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section id="initiatives" className="pub-section bg-[#12362c] text-[#e7efe9]">
        <div className="pub-container">
          <SectionHeading
            kicker="Current initiatives"
            title="Focus areas this year"
            summary="Sample initiatives illustrating how a multi-cause foundation can highlight priorities without fabricating verified production metrics."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {PUBLIC_PROGRAMS.map((program) => (
              <article key={program.slug} className="border border-white/10 p-6">
                <p className="text-xs font-bold tracking-[0.14em] text-[#f1ce55] uppercase">
                  {program.category}
                </p>
                <h3 className="pub-serif mt-2 text-2xl text-[#fffdf6]">{program.name}</h3>
                <p className="mt-3 text-sm text-[#b7c9bf]">{program.purpose}</p>
                <Link
                  href={`/programs/${program.slug}`}
                  className="pub-focus-ring mt-4 inline-flex text-sm font-semibold text-[#f1ce55]"
                >
                  Program details
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="approach" className="pub-section">
        <div className="pub-container max-w-3xl">
          <SectionHeading
            kicker="Our approach"
            title="Community-led, evidence-informed, operationally clear"
            summary="Listen first. Design with partners. Deliver with accountability. Communicate with honesty. HopeBridge is built so many nonprofit categories — hunger, housing, humanitarian response, conservation, education, youth, foundations, and community NGOs — can present their work without copying another brand’s identity."
          />
          <div className="mt-8 flex flex-wrap gap-3">
            <CtaLink href="/impact" variant="emerald">
              Goals & impact
            </CtaLink>
            <CtaLink href="/get-involved" variant="secondary">
              Get involved
            </CtaLink>
          </div>
        </div>
      </section>
    </>
  );
}
