import type { Metadata } from "next";
import { CtaLink, PageHero, SectionHeading } from "@/components/public/PageChrome";
import { PUBLIC_EVENTS } from "@/data/public-content";

export const metadata: Metadata = {
  title: "Events",
  description: "HopeBridge Foundation community events and gatherings.",
};

export default function EventsPage() {
  return (
    <>
      <PageHero
        kicker="Events"
        title="Gather, learn, and act"
        summary="Sample event listings for the demo organization. Dates remain TBD until a live calendar feed is connected."
        actions={<CtaLink href="/get-involved/volunteer">Volunteer at events</CtaLink>}
      />

      <section className="pub-section">
        <div className="pub-container">
          <SectionHeading
            kicker="Upcoming"
            title="Community calendar"
            summary="Authenticated Calendar events stay in the workspace. Public listings below are intentionally marked as samples."
          />
          <div className="mt-10 space-y-6">
            {PUBLIC_EVENTS.map((event) => (
              <article key={event.id} className="border border-[#e8decb] bg-white p-6">
                <p className="text-xs font-bold tracking-[0.14em] text-[#c28a17] uppercase">
                  {event.dateLabel}
                </p>
                <h2 className="pub-serif mt-2 text-2xl text-[#18392e]">{event.title}</h2>
                <p className="mt-3 text-sm text-[#4d6359]">{event.summary}</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <CtaLink href="/get-involved/volunteer" variant="emerald">
                    Express interest
                  </CtaLink>
                  <CtaLink href="/contact" variant="secondary">
                    Ask a question
                  </CtaLink>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
