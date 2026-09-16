import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CtaLink, PageHero } from "@/components/public/PageChrome";
import { getProgramBySlug, getStoryBySlug, PUBLIC_STORIES } from "@/data/public-content";

type Params = { slug: string };

export function generateStaticParams() {
  return PUBLIC_STORIES.map((story) => ({ slug: story.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const story = getStoryBySlug(slug);
  if (!story) return { title: "Story" };
  return { title: story.title, description: story.summary };
}

export default async function StoryDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const story = getStoryBySlug(slug);
  if (!story) notFound();

  const program = story.programSlug ? getProgramBySlug(story.programSlug) : undefined;

  return (
    <>
      <PageHero
        kicker={`${story.category} · Sample story`}
        title={story.title}
        summary={story.summary}
        imageSrc={story.image}
        imageAlt={story.imageAlt}
        actions={
          program ? (
            <CtaLink href={`/programs/${program.slug}`} variant="light">
              Related program
            </CtaLink>
          ) : undefined
        }
      />

      <article className="pub-section">
        <div className="pub-container grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="pub-media-frame min-h-[320px]">
            <Image
              src={story.image}
              alt={story.imageAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover"
            />
          </div>
          <div className="max-w-2xl space-y-5 text-base leading-relaxed text-[#3f564c]">
            <p className="rounded-xl border border-[#efd786] bg-[#fff8e8] px-4 py-3 text-sm text-[#5c4a1f]">
              Sample / demo narrative. This story does not identify real beneficiaries or claim verified
              case-study status.
            </p>
            {story.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <div className="flex flex-wrap gap-3 pt-4">
              <CtaLink href="/stories" variant="secondary">
                All stories
              </CtaLink>
              <CtaLink href="/donate">Support the mission</CtaLink>
            </div>
          </div>
        </div>
      </article>
    </>
  );
}
