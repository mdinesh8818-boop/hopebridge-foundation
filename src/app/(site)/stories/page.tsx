import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CtaLink, PageHero, SectionHeading } from "@/components/public/PageChrome";
import { PUBLIC_STORIES } from "@/data/public-content";

export const metadata: Metadata = {
  title: "Stories",
  description: "Editorial sample stories from HopeBridge Foundation programs.",
};

export default function StoriesPage() {
  return (
    <>
      <PageHero
        kicker="Stories"
        title="Human-centered storytelling"
        summary="Editorial stories help communities understand the work. Every story here is clearly marked as sample content — not a claim about real beneficiaries."
        actions={<CtaLink href="/get-involved">Get involved</CtaLink>}
      />

      <section className="pub-section">
        <div className="pub-container">
          <SectionHeading
            kicker="Editorial"
            title="From cause areas to community voice"
            summary="Replace these samples with approved public narratives from your organization when ready."
          />
          <div className="mt-10 grid gap-8 lg:grid-cols-3">
            {PUBLIC_STORIES.map((story) => (
              <article key={story.slug} className="flex flex-col border border-[#e8decb] bg-white">
                <div className="relative h-48">
                  <Image
                    src={story.image}
                    alt={story.imageAlt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-xs font-bold tracking-[0.14em] text-[#c28a17] uppercase">
                    {story.category} · Sample
                  </p>
                  <h2 className="pub-serif mt-2 text-2xl text-[#18392e]">{story.title}</h2>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-[#4d6359]">{story.summary}</p>
                  <Link
                    href={`/stories/${story.slug}`}
                    className="pub-focus-ring mt-5 inline-flex text-sm font-semibold text-[#0d5f44]"
                  >
                    Read full story
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
