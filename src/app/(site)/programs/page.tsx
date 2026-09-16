import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CtaLink, PageHero, SectionHeading } from "@/components/public/PageChrome";
import { PUBLIC_PROGRAMS } from "@/data/public-content";

export const metadata: Metadata = {
  title: "Programs",
  description: "Explore HopeBridge Foundation programs and causes.",
};

export default function ProgramsPage() {
  return (
    <>
      <PageHero
        kicker="Programs"
        title="Causes with clarity and care"
        summary="Public program pages communicate purpose, location, goals, and status. Operational records remain private in the HopeBridge workspace."
        actions={<CtaLink href="/donate">Support a program</CtaLink>}
      />

      <section className="pub-section">
        <div className="pub-container space-y-14">
          {PUBLIC_PROGRAMS.map((program, index) => (
            <article
              key={program.slug}
              className={`pub-split ${index % 2 === 1 ? "pub-split-reverse" : ""}`}
            >
              <div className="pub-media-frame min-h-[280px]">
                <Image
                  src={program.image}
                  alt={program.imageAlt}
                  fill
                  sizes="(max-width: 900px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div>
                <p className="pub-kicker">
                  {program.category} · {program.status}
                </p>
                <h2 className="pub-serif mt-3 text-3xl text-[#18392e]">{program.name}</h2>
                <p className="mt-4 text-base leading-relaxed text-[#4d6359]">{program.description}</p>
                <p className="mt-3 text-sm text-[#65766e]">Location: {program.location}</p>
                <Link
                  href={`/programs/${program.slug}`}
                  className="hb-emerald-btn pub-focus-ring mt-6 inline-flex rounded-xl px-5 py-3 text-sm font-semibold"
                >
                  View program
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="pub-section-tight">
        <div className="pub-container">
          <SectionHeading
            kicker="For many nonprofit types"
            title="Reusable program presentation"
            summary="These layouts are intentionally category-agnostic so hunger, housing, healthcare, conservation, education, youth, and international NGO programs can all be presented with the same HopeBridge identity system."
          />
        </div>
      </section>
    </>
  );
}
