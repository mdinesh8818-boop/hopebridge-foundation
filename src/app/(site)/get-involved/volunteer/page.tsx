import type { Metadata } from "next";
import { PageHero, SectionHeading } from "@/components/public/PageChrome";
import { VolunteerInterestForm } from "@/components/public/VolunteerInterestForm";
import { VOLUNTEER_OPPORTUNITIES } from "@/data/public-content";

export const metadata: Metadata = {
  title: "Volunteer",
  description: "Volunteer opportunities and interest form for HopeBridge Foundation.",
};

export default function VolunteerPage() {
  return (
    <>
      <PageHero
        kicker="Volunteer"
        title="Share your time with purpose"
        summary="Browse sample opportunities and submit interest. Responses are structured for eventual integration with the HopeBridge Volunteers module."
        imageSrc="/hopebridge/volunteers/hero-volunteer-community.png"
        imageAlt="HopeBridge volunteers visual"
      />

      <section className="pub-section">
        <div className="pub-container grid gap-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <SectionHeading
              kicker="Opportunities"
              title="Where help is needed"
              summary="These roles are sample pathways for the demo organization."
            />
            <ul className="mt-8 space-y-5">
              {VOLUNTEER_OPPORTUNITIES.map((item) => (
                <li key={item.id} className="border-b border-[#e8decb] pb-5">
                  <h3 className="text-lg font-semibold text-[#18392e]">{item.title}</h3>
                  <p className="mt-2 text-sm text-[#4d6359]">{item.summary}</p>
                  <p className="mt-2 text-xs text-[#65766e]">
                    {item.commitment} · {item.location}
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="pub-serif text-2xl text-[#18392e]">Volunteer interest</h2>
            <p className="mt-2 mb-5 text-sm text-[#4d6359]">
              Submissions are stored locally for this demo until the Volunteers intake integration is
              connected. No fake “you’re approved” workflow.
            </p>
            <VolunteerInterestForm />
          </div>
        </div>
      </section>
    </>
  );
}
