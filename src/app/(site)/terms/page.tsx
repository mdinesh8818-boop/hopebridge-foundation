import type { Metadata } from "next";
import { PageHero } from "@/components/public/PageChrome";

export const metadata: Metadata = {
  title: "Terms",
  description: "HopeBridge Foundation terms overview.",
};

export default function TermsPage() {
  return (
    <>
      <PageHero
        kicker="Terms"
        title="Using HopeBridge digital experiences"
        summary="Summary terms for the demo public website and platform access. Replace with reviewed legal terms before production."
      />
      <section className="pub-section">
        <div className="pub-container max-w-3xl space-y-4 text-sm leading-relaxed text-[#4d6359]">
          <p>
            The public website provides information, sample storytelling, and intake forms. The
            authenticated HopeBridge platform provides operational tools for nonprofit teams.
          </p>
          <p>
            Charitable donation flows and SaaS subscription billing are separate. Live payments are
            not processed until an approved provider is configured.
          </p>
          <p>
            Sample content is illustrative. It should not be interpreted as independently verified
            production statistics or real beneficiary case studies.
          </p>
        </div>
      </section>
    </>
  );
}
