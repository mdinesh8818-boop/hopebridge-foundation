import type { Metadata } from "next";
import Image from "next/image";
import { CtaLink, PageHero, SectionHeading } from "@/components/public/PageChrome";
import { ProgressBar } from "@/components/public/ProgressBar";
import { IMPACT_HIGHLIGHTS, PUBLIC_GOALS, PUBLIC_STORIES } from "@/data/public-content";

export const metadata: Metadata = {
  title: "Impact",
  description: "HopeBridge Foundation goals, progress, and program outcomes.",
};

export default function ImpactPage() {
  return (
    <>
      <PageHero
        kicker="Impact"
        title="Progress you can understand"
        summary="Strategic goals, community outcomes, and operational excellence — presented with honest sample progress until live public metrics are connected."
        imageSrc="/hopebridge/campaigns/hero-earth-globe.png"
        imageAlt="HopeBridge impact globe visual"
        actions={<CtaLink href="/stories">Read stories</CtaLink>}
      />

      <section className="pub-section">
        <div className="pub-container grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {IMPACT_HIGHLIGHTS.map((item) => (
            <div key={item.label} className="border border-[#e8decb] bg-white p-5">
              <p className="pub-serif text-3xl text-[#0d5f44]">{item.value}</p>
              <p className="mt-2 text-sm font-semibold text-[#18392e]">{item.label}</p>
              <p className="mt-1 text-xs text-[#65766e]">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="goals" className="pub-section bg-[#fffdf6]">
        <div className="pub-container">
          <SectionHeading
            kicker="Goals & progress"
            title="Strategic priorities"
            summary="Inspired by immersive nonprofit goal storytelling — implemented with HopeBridge emerald/gold progress visualization and sample statuses."
          />
          <div className="mt-10 space-y-10">
            {PUBLIC_GOALS.map((goal, index) => (
              <article
                key={goal.id}
                className={`pub-split ${index % 2 === 1 ? "pub-split-reverse" : ""}`}
              >
                <div className="pub-media-frame min-h-[240px]">
                  <Image
                    src={
                      index % 2 === 0
                        ? "/hopebridge/mission/hero-golden-path-cinematic.png"
                        : "/hopebridge/volunteers/hero-volunteer-community.png"
                    }
                    alt=""
                    fill
                    sizes="(max-width: 900px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="pub-kicker">{goal.category}</p>
                  <h3 className="pub-serif mt-2 text-3xl text-[#18392e]">{goal.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#4d6359]">{goal.description}</p>
                  <p className="mt-3 text-sm text-[#65766e]">Target: {goal.targetOutcome}</p>
                  <div className="mt-5">
                    <ProgressBar value={goal.progressPercent} label={goal.status} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="results" className="pub-section">
        <div className="pub-container grid gap-10 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <SectionHeading
              kicker="Results"
              title="Learning from program outcomes"
              summary="Outcome narratives stay public-safe. Private beneficiary and donor records are never exposed on these pages."
            />
            <ul className="mt-8 space-y-4">
              {PUBLIC_STORIES.map((story) => (
                <li key={story.slug} className="border-b border-[#e8decb] pb-4">
                  <p className="text-xs font-semibold tracking-[0.12em] text-[#c28a17] uppercase">
                    {story.category} · Sample
                  </p>
                  <p className="mt-1 font-semibold text-[#18392e]">{story.title}</p>
                  <p className="mt-1 text-sm text-[#4d6359]">{story.summary}</p>
                  <CtaLink href={`/stories/${story.slug}`} variant="secondary">
                    Open story
                  </CtaLink>
                </li>
              ))}
            </ul>
          </div>
          <div className="border border-[#e8decb] bg-white p-6 sm:p-8">
            <h3 className="pub-serif text-2xl text-[#18392e]">Workspace analytics</h3>
            <p className="mt-3 text-sm leading-relaxed text-[#4d6359]">
              Authenticated Impact Analytics, Reports, and AI Assistant modules remain inside the
              HopeBridge platform for staff. Sign in to work with organization data securely.
            </p>
            <div className="mt-6">
              <CtaLink href="/auth/login" variant="emerald">
                Sign in to platform
              </CtaLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
