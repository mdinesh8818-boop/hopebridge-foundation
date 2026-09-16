import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CtaLink, PageHero, SectionHeading } from "@/components/public/PageChrome";
import {
  getProgramBySlug,
  getStoriesForProgram,
  PUBLIC_PROGRAMS,
} from "@/data/public-content";

type Params = { slug: string };

export function generateStaticParams() {
  return PUBLIC_PROGRAMS.map((program) => ({ slug: program.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const program = getProgramBySlug(slug);
  if (!program) return { title: "Program" };
  return {
    title: program.name,
    description: program.purpose,
  };
}

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const program = getProgramBySlug(slug);
  if (!program) notFound();

  const relatedStories = getStoriesForProgram(program.slug);

  return (
    <>
      <PageHero
        kicker={program.category}
        title={program.name}
        summary={program.purpose}
        imageSrc={program.image}
        imageAlt={program.imageAlt}
        actions={
          <>
            <CtaLink href={program.ctaHref}>{program.ctaLabel}</CtaLink>
            <CtaLink href="/get-involved/volunteer" variant="light">
              Volunteer
            </CtaLink>
          </>
        }
      />

      <section className="pub-section">
        <div className="pub-container pub-split">
          <div>
            <SectionHeading
              kicker="About this program"
              title="Purpose & community"
              summary={program.description}
            />
            <dl className="mt-8 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-bold tracking-[0.12em] text-[#65766e] uppercase">
                  Location
                </dt>
                <dd className="mt-1 text-sm text-[#18392e]">{program.location}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold tracking-[0.12em] text-[#65766e] uppercase">
                  Status
                </dt>
                <dd className="mt-1 text-sm text-[#18392e]">{program.status}</dd>
              </div>
            </dl>
          </div>
          <div className="pub-media-frame min-h-[300px]">
            <Image
              src={program.image}
              alt={program.imageAlt}
              fill
              sizes="(max-width: 900px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="pub-section bg-[#fffdf6]">
        <div className="pub-container grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="pub-serif text-3xl text-[#18392e]">Goals</h2>
            <ul className="mt-5 space-y-3">
              {program.goals.map((goal) => (
                <li key={goal} className="border-l-2 border-[#0d5f44] pl-4 text-sm text-[#4d6359]">
                  {goal}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="pub-serif text-3xl text-[#18392e]">Impact & outcomes</h2>
            <ul className="mt-5 space-y-3">
              {program.outcomes.map((outcome) => (
                <li key={outcome} className="border-l-2 border-[#d4a228] pl-4 text-sm text-[#4d6359]">
                  {outcome}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {relatedStories.length > 0 ? (
        <section className="pub-section">
          <div className="pub-container">
            <SectionHeading kicker="Related stories" title="From this cause area" />
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {relatedStories.map((story) => (
                <article key={story.slug} className="border border-[#e8decb] bg-white p-5">
                  <p className="text-xs font-semibold tracking-[0.12em] text-[#c28a17] uppercase">
                    Sample story
                  </p>
                  <h3 className="pub-serif mt-2 text-2xl text-[#18392e]">{story.title}</h3>
                  <p className="mt-3 text-sm text-[#4d6359]">{story.summary}</p>
                  <CtaLink href={`/stories/${story.slug}`} variant="secondary">
                    Read story
                  </CtaLink>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
