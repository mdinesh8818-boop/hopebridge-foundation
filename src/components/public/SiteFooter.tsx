import Link from "next/link";
import { NewsletterSignup } from "./NewsletterSignup";
import { ORG_CONTACT } from "@/data/public-content";

const explore = [
  { label: "Our Mission", href: "/mission" },
  { label: "What We Do", href: "/what-we-do" },
  { label: "Programs", href: "/programs" },
  { label: "Impact", href: "/impact" },
  { label: "Stories", href: "/stories" },
];

const getInvolved = [
  { label: "Donate", href: "/donate" },
  { label: "Volunteer", href: "/get-involved/volunteer" },
  { label: "Fundraise", href: "/get-involved/fundraise" },
  { label: "Partner", href: "/get-involved/partner" },
  { label: "Events", href: "/get-involved/events" },
];

const about = [
  { label: "Who We Are", href: "/about" },
  { label: "Leadership", href: "/about/leadership" },
  { label: "Organization", href: "/about/organization" },
  { label: "Resources", href: "/resources" },
  { label: "Contact", href: "/contact" },
  { label: "Platform", href: "/platform" },
];

const legal = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Accessibility", href: "/accessibility" },
];

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-xs font-bold tracking-[0.14em] text-[#0d5f44] uppercase">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="pub-focus-ring text-sm text-[#3f564c] hover:text-[#0d5f44]">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-[#e8decb] bg-[#12362c] text-[#e7efe9]">
      <div className="pub-container-wide py-14">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_repeat(3,0.7fr)]">
          <div>
            <p className="pub-serif text-2xl text-[#fffdf6]">HopeBridge Foundation</p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#b7c9bf]">
              {ORG_CONTACT.tagline}. A demo nonprofit public experience connected to the HopeBridge
              operating platform.
            </p>
            <div className="mt-6 max-w-md">
              <p className="mb-2 text-xs font-semibold tracking-[0.12em] text-[#d4a228] uppercase">
                Stay informed
              </p>
              <NewsletterSignup compact />
            </div>
            <p className="mt-4 text-xs text-[#8aa194]">{ORG_CONTACT.note}</p>
          </div>

          <FooterColumn title="Explore" links={explore} />
          <FooterColumn title="Get Involved" links={getInvolved} />
          <FooterColumn title="About" links={about} />
        </div>

        <div className="mt-12 grid gap-6 border-t border-white/10 pt-8 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-1 text-sm text-[#b7c9bf]">
            <p>{ORG_CONTACT.email}</p>
            <p>{ORG_CONTACT.phone}</p>
            {ORG_CONTACT.addressLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
            <p className="pt-2 text-xs text-[#8aa194]">
              Social profiles are omitted until verified organization URLs are available.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            {legal.map((link) => (
              <Link key={link.href} href={link.href} className="pub-focus-ring text-[#d7e4dc] hover:text-white">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <p className="mt-8 text-xs text-[#7f968a]">
          © {new Date().getFullYear()} HopeBridge Foundation. Charitable donations and HopeBridge SaaS
          subscription billing are separate concepts.
        </p>
      </div>
    </footer>
  );
}
