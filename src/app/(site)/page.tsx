import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CtaLink, SectionHeading } from "@/components/public/PageChrome";
import { NewsletterSignup } from "@/components/public/NewsletterSignup";
import { ProgressBar } from "@/components/public/ProgressBar";
import {
  IMPACT_HIGHLIGHTS,
  PUBLIC_GOALS,
  PUBLIC_PROGRAMS,
  PUBLIC_STORIES,
  VOLUNTEER_OPPORTUNITIES,
} from "@/data/public-content";

export default function HomePage() {
  const featuredPrograms = PUBLIC_PROGRAMS.slice(0, 3);
  const featuredGoals = PUBLIC_GOALS.slice(0, 3);
  const featuredStory = PUBLIC_STORIES[0];

  return (
    <>
      <section className="pub-hero">
        <div className="pub-hero-media">
          <Image
            src="/hopebridge/mission/hero-golden-path-cinematic.png"
            alt="Cinematic HopeBridge pathway visual representing community progress"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="pub-hero-shade" />
        </div>
        <div className="pub-container pub-hero-content">
          <p className="pub-animate-rise text-xs font-bold tracking-[0.18em] text-[#f1ce55] uppercase">
            HopeBridge Foundation
          </p>
          <h1 className="pub-serif pub-animate-rise-delay mt-4 max-w-3xl text-4xl leading-[1.08] sm:text-5xl lg:text-6xl">
            Building bridges of hope in every community
          </h1>
          <p className="pub-animate-rise-delay-2 mt-5 max-w-xl text-base leading-relaxed text-[#d7e4dc] sm:text-lg">
            We help communities expand learning, health, food security, and resilience — and we
            operate with clarity through the HopeBridge platform.
          </p>
          <div className="pub-animate-rise-delay-2 mt-8 flex flex-wrap gap-3">
            <CtaLink href="/donate">Donate</CtaLink>
            <CtaLink href="/get-involved" variant="light">
              Get Involved
            </CtaLink>
          </div>
        </div>
      </section>

      <section className="pub-section">
        <div className="pub-container pub-split">
          <div>
            <SectionHeading
              kicker="Our mission"
              title="Why HopeBridge exists"
              summary="Too many communities face fragmented support. HopeBridge exists to connect compassionate action with accountable delivery — so programs, volunteers, and partners move in the same direction."
            />
            <div className="mt-8 flex flex-wrap gap-3">
              <CtaLink href="/mission" variant="emerald">
                Read our mission
              </CtaLink>
              <CtaLink href="/what-we-do" variant="secondary">
                See what we do
              </CtaLink>
            </div>
          </div>
          <div className="pub-media-frame rounded-none">
            <Image
              src="/mission-vision/hero-sunrise-path.png"
              alt="Sunrise pathway visual representing HopeBridge mission and vision"
              fill
              sizes="(max-width: 900px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <hr className="pub-rule pub-container" />

      <section className="pub-section">
        <div className="pub-container">
          <SectionHeading
            kicker="Areas of work"
            title="Where we focus"
            summary="HopeBridge is designed for many nonprofit categories. This demo organization highlights education, healthcare, environment, and community food support."
          />
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            {PUBLIC_PROGRAMS.map((program, index) => (
              <article
                key={program.slug}
                className={`border-t border-[#e8decb] pt-6 ${index > 1 ? "md:border-t md:pt-6" : ""}`}
              >
                <p className="text-xs font-bold tracking-[0.14em] text-[#c28a17] uppercase">
                  {program.category}
                </p>
                <h3 className="pub-serif mt-2 text-2xl text-[#18392e]">{program.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#4d6359]">{program.purpose}</p>
                <Link
                  href={`/programs/${program.slug}`}
                  className="pub-focus-ring mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#0d5f44]"
                >
                  Explore program <ArrowRight size={16} />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="pub-section bg-[#12362c] text-[#e7efe9]">
        <div className="pub-container">
          <SectionHeading
            kicker="Featured programs"
            title="Programs with purpose"
            summary="Each public program page can later sync from the same organization data managed in the HopeBridge workspace."
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {featuredPrograms.map((program) => (
              <article key={program.slug} className="overflow-hidden border border-white/10 bg-[#0f2f27]">
                <div className="relative h-48">
                  <Image
                    src={program.image}
                    alt={program.imageAlt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-5">
                  <p className="text-xs font-bold tracking-[0.14em] text-[#f1ce55] uppercase">
                    {program.status} · {program.location}
                  </p>
                  <h3 className="pub-serif mt-2 text-xl text-[#fffdf6]">{program.name}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#b7c9bf]">{program.purpose}</p>
                  <Link
                    href={`/programs/${program.slug}`}
                    className="pub-focus-ring mt-4 inline-flex text-sm font-semibold text-[#f1ce55]"
                  >
                    View details
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="pub-section">
        <div className="pub-container">
          <SectionHeading
            kicker="Impact"
            title="Progress toward shared goals"
            summary="An elegant goals experience inspired by leading nonprofit storytelling — powered here by clearly marked sample progress."
          />
          <div className="mt-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="grid grid-cols-2 gap-4">
              {IMPACT_HIGHLIGHTS.map((item) => (
                <div key={item.label} className="border border-[#e8decb] bg-white p-5">
                  <p className="pub-serif text-3xl text-[#0d5f44]">{item.value}</p>
                  <p className="mt-2 text-sm font-semibold text-[#18392e]">{item.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#65766e]">{item.detail}</p>
                </div>
              ))}
            </div>
            <div className="space-y-6">
              {featuredGoals.map((goal) => (
                <div key={goal.id} className="border-b border-[#e8decb] pb-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-lg font-semibold text-[#18392e]">{goal.title}</h3>
                    <span className="text-xs font-medium text-[#65766e]">{goal.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-[#4d6359]">{goal.description}</p>
                  <div className="mt-4">
                    <ProgressBar value={goal.progressPercent} label={goal.category} />
                  </div>
                </div>
              ))}
              <CtaLink href="/impact" variant="secondary">
                View full impact
              </CtaLink>
            </div>
          </div>
        </div>
      </section>

      <section className="pub-section bg-[#fffdf6]">
        <div className="pub-container pub-split">
          <div className="pub-media-frame min-h-[360px]">
            <Image
              src={featuredStory.image}
              alt={featuredStory.imageAlt}
              fill
              sizes="(max-width: 900px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div>
            <SectionHeading
              kicker="Community stories"
              title={featuredStory.title}
              summary={featuredStory.summary}
            />
            <p className="mt-4 text-xs font-semibold tracking-[0.12em] text-[#c28a17] uppercase">
              Sample story · {featuredStory.category}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <CtaLink href={`/stories/${featuredStory.slug}`} variant="emerald">
                Read the story
              </CtaLink>
              <CtaLink href="/stories" variant="secondary">
                All stories
              </CtaLink>
            </div>
          </div>
        </div>
      </section>

      <section className="pub-section">
        <div className="pub-container grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <SectionHeading
              kicker="Get involved"
              title="There is a place for you here"
              summary="Donate, volunteer, fundraise, or partner. Every pathway is designed to connect with HopeBridge operations without fake success states."
            />
            <ul className="mt-8 space-y-4">
              {VOLUNTEER_OPPORTUNITIES.map((item) => (
                <li key={item.id} className="border-l-2 border-[#d4a228] pl-4">
                  <p className="font-semibold text-[#18392e]">{item.title}</p>
                  <p className="mt-1 text-sm text-[#4d6359]">{item.summary}</p>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <CtaLink href="/get-involved/volunteer">Volunteer</CtaLink>
              <CtaLink href="/donate" variant="secondary">
                Donate
              </CtaLink>
            </div>
          </div>
          <div className="border border-[#e8decb] bg-white p-6 sm:p-8">
            <h3 className="pub-serif text-2xl text-[#18392e]">Make a gift today</h3>
            <p className="mt-3 text-sm leading-relaxed text-[#4d6359]">
              Charitable donations support community programs. Payment processing will connect through
              an approved provider — this experience is already structured for that step.
            </p>
            <Link
              href="/donate"
              className="hb-gold-btn pub-focus-ring mt-6 inline-flex rounded-xl px-5 py-3 text-sm font-bold"
            >
              Go to donation page
            </Link>
            <p className="mt-4 text-xs text-[#65766e]">
              SaaS subscription billing for the HopeBridge platform is separate from charitable giving.
            </p>
          </div>
        </div>
      </section>

      <section className="pub-section-tight">
        <div className="pub-container grid gap-8 border border-[#e8decb] bg-white p-6 sm:p-8 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <SectionHeading
              kicker="Resources & updates"
              title="Stay close to the work"
              summary="Browse resources, contact the team, or explore the HopeBridge operating platform for staff."
            />
            <div className="mt-6 flex flex-wrap gap-3">
              <CtaLink href="/resources" variant="secondary">
                Resource hub
              </CtaLink>
              <CtaLink href="/platform" variant="emerald">
                Platform for nonprofits
              </CtaLink>
            </div>
          </div>
          <NewsletterSignup />
        </div>
      </section>

      <section className="pub-cta-band pub-section-tight">
        <div className="pub-container flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="pub-serif text-3xl text-[#fffdf6] sm:text-4xl">
              Ready to support the mission?
            </h2>
            <p className="mt-3 text-[#d7e4dc]">
              Give, volunteer, or sign in to the HopeBridge workspace to manage programs and impact.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <CtaLink href="/donate">Donate</CtaLink>
            <CtaLink href="/auth/login" variant="light">
              Sign In
            </CtaLink>
          </div>
        </div>
      </section>
    </>
  );
}
