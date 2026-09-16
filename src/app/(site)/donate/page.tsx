import type { Metadata } from "next";
import { PageHero, SectionHeading } from "@/components/public/PageChrome";
import { DonationForm } from "@/components/public/DonationForm";
import { PUBLIC_PROGRAMS } from "@/data/public-content";

export const metadata: Metadata = {
  title: "Donate",
  description: "Support HopeBridge Foundation programs with a charitable gift.",
};

export default async function DonatePage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string }>;
}) {
  const params = await searchParams;
  const initialProgram =
    PUBLIC_PROGRAMS.find((program) => program.slug === params.program)?.slug ?? undefined;

  return (
    <>
      <PageHero
        kicker="Donate"
        title="Your gift fuels community programs"
        summary="Choose one-time or monthly support, select an amount, and designate a program if you wish. Live payment processing is not enabled until an approved provider is connected."
      />

      <section className="pub-section">
        <div className="pub-container grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <SectionHeading
              kicker="Charitable giving"
              title="Transparent, provider-ready donations"
              summary="HopeBridge does not collect card numbers on this page. Donation intent is captured so a future Stripe, PayPal, or approved gateway integration can complete checkout securely."
            />
            <div className="mt-8 space-y-4 text-sm leading-relaxed text-[#4d6359]">
              <p>
                <strong className="text-[#18392e]">Charitable donations</strong> support HopeBridge
                Foundation programs and community work.
              </p>
              <p>
                <strong className="text-[#18392e]">HopeBridge SaaS subscription billing</strong> is a
                separate product payment concept for organizations using the operating platform. It is
                not processed through this donation form.
              </p>
              <p>
                Suggested amounts and designations are examples for the demo organization. Replace with
                verified campaign goals when publishing for a live nonprofit.
              </p>
            </div>
          </div>
          <DonationForm initialProgramSlug={initialProgram} />
        </div>
      </section>
    </>
  );
}
