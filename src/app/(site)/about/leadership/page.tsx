import type { Metadata } from "next";
import { PageHero, SectionHeading } from "@/components/public/PageChrome";

export const metadata: Metadata = {
  title: "Leadership",
  description: "Sample leadership roles for the HopeBridge Foundation demo organization.",
};

const roles = [
  {
    title: "Executive Director (sample role)",
    summary: "Guides strategy, partnerships, and organizational stewardship.",
  },
  {
    title: "Programs Director (sample role)",
    summary: "Coordinates education, health, environment, and community initiatives.",
  },
  {
    title: "Development Lead (sample role)",
    summary: "Supports donor relationships and fundraising readiness.",
  },
];

export default function LeadershipPage() {
  return (
    <>
      <PageHero
        kicker="Leadership"
        title="People who steward the mission"
        summary="Names and biographies of real leaders are omitted until verified. These sample roles show how a nonprofit leadership page can be structured."
      />

      <section className="pub-section">
        <div className="pub-container">
          <SectionHeading
            kicker="Sample roles"
            title="Leadership structure"
            summary="Do not treat these as real people. Replace with approved leadership profiles before production launch."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {roles.map((role) => (
              <article key={role.title} className="border border-[#e8decb] bg-white p-6">
                <div className="mb-5 h-28 bg-gradient-to-br from-[#003f2f] to-[#0d5f44]" aria-hidden />
                <h2 className="pub-serif text-xl text-[#18392e]">{role.title}</h2>
                <p className="mt-3 text-sm text-[#4d6359]">{role.summary}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
