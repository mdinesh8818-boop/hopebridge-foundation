import type { Metadata } from "next";
import { PageHero } from "@/components/public/PageChrome";

export const metadata: Metadata = {
  title: "Accessibility",
  description: "HopeBridge Foundation accessibility commitment.",
};

export default function AccessibilityPage() {
  return (
    <>
      <PageHero
        kicker="Accessibility"
        title="Building an inclusive experience"
        summary="HopeBridge aims for semantic structure, keyboard access, focus visibility, and readable contrast across public and authenticated experiences."
      />
      <section className="pub-section">
        <div className="pub-container max-w-3xl space-y-4 text-sm leading-relaxed text-[#4d6359]">
          <p>
            Navigation supports keyboard interaction and Escape-to-close for menus. Forms include
            labels and validation messages. Decorative imagery uses empty alt text where appropriate;
            informative images include descriptive alt text.
          </p>
          <p>
            Motion is intentionally limited and respects reduced-motion preferences for key entrance
            animations.
          </p>
          <p>
            If you encounter an accessibility barrier, contact us through the Contact page so we can
            improve the experience.
          </p>
        </div>
      </section>
    </>
  );
}
