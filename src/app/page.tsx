import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CircleDollarSign,
  FileBarChart,
  HandHeart,
  Megaphone,
  Shield,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

const features = [
  {
    icon: Megaphone,
    title: "Campaign Management",
    description:
      "Plan, launch, and monitor fundraising campaigns with clear goals, timelines, and progress tracking.",
  },
  {
    icon: Target,
    title: "Program Management",
    description:
      "Coordinate community programs, budgets, beneficiaries, and outcomes in one connected workspace.",
  },
  {
    icon: CircleDollarSign,
    title: "Donor Relationships",
    description:
      "Understand giving patterns, retention, and stewardship opportunities across your supporter base.",
  },
  {
    icon: Users,
    title: "Volunteer Coordination",
    description:
      "Recruit, schedule, and recognize volunteers while aligning skills with high-impact initiatives.",
  },
  {
    icon: HandHeart,
    title: "Beneficiary Management",
    description:
      "Track the people and communities your programs serve with structured records and impact context.",
  },
  {
    icon: BarChart3,
    title: "Impact Analytics",
    description:
      "Review performance trends and evidence that help leadership make informed decisions.",
  },
  {
    icon: BrainCircuit,
    title: "AI Assistant",
    description:
      "Get strategic recommendations for campaigns, programs, reporting, and operational priorities.",
  },
  {
    icon: FileBarChart,
    title: "Reports & Insights",
    description:
      "Prepare executive summaries, board updates, and operational reports from connected foundation data.",
  },
];

const pricingTiers = [
  {
    name: "Starter",
    price: "Contact us",
    detail: "For growing nonprofits beginning to centralize operations.",
  },
  {
    name: "Professional",
    price: "Contact us",
    detail: "For teams managing campaigns, programs, and multi-module reporting.",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Contact us",
    detail: "For larger organizations needing advanced coordination and governance.",
  },
];

const footerLinkMap: Record<string, string> = {
  Features: "#features",
  Solutions: "#product",
  Impact: "#impact",
  Pricing: "#pricing",
  "Help Center": "/auth/login?next=%2Fdashboard%2Fhelp",
  "Getting Started": "/auth/signup",
  "Product Guide": "/auth/login?next=%2Fdashboard%2Fhelp",
  About: "#product",
  Contact: "/auth/signup",
  Careers: "#product",
  Privacy: "#security",
  Terms: "#security",
  Support: "/auth/login?next=%2Fdashboard%2Fhelp",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-[#faf7ef] text-[#18392e]">
      <header className="sticky top-0 z-50 border-b border-[#e8decb] bg-[#fffdf6]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#efd786] bg-gradient-to-br from-[#fff1a3] to-[#c28a17] text-sm font-black text-[#073b2f]">
              H
            </div>
            <div>
              <p className="text-sm font-bold tracking-wide">HopeBridge</p>
              <p className="text-[10px] text-[#65766e]">Foundation</p>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm text-[#65766e] md:flex">
            <a href="#product" className="hover:text-[#0d5f44]">Product</a>
            <a href="#features" className="hover:text-[#0d5f44]">Features</a>
            <a href="#impact" className="hover:text-[#0d5f44]">Impact</a>
            <a href="#security" className="hover:text-[#0d5f44]">Security</a>
            <a href="#pricing" className="hover:text-[#0d5f44]">Pricing</a>
            <Link href="/auth/login?next=%2Fdashboard%2Fhelp" className="hover:text-[#0d5f44]">Resources</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="hidden rounded-xl border border-[#e4dac6] bg-white px-4 py-2 text-sm font-medium text-[#2d493e] sm:inline-flex"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-[#073b2f]"
              style={{
                background:
                  "linear-gradient(135deg, #fff1a3, #ebc34a 33%, #c28a17 66%, #f1cf55)",
                border: "1px solid #f1ce55",
              }}
            >
              Get Started
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden px-6 py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,95,68,0.08),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(212,162,40,0.10),transparent_30%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#efd786] bg-[#fffaf0] px-4 py-1.5 text-xs font-bold tracking-[0.14em] text-[#9e7b24]">
              <Sparkles size={14} />
              NONPROFIT INTELLIGENCE PLATFORM
            </div>
            <h1
              className="mt-6 text-5xl font-bold leading-[1.02] sm:text-6xl"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              Technology for good.
              <br />
              <span
                style={{
                  background:
                    "linear-gradient(110deg, #fff2a9, #f6d76c 18%, #d4a228 42%, #fff0a0 58%, #d49b20 78%, #ffe786)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                Built for greater impact.
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#607269]">
              Bring campaigns, programs, donors, volunteers, reporting, and
              nonprofit intelligence together in one connected platform designed
              to help organizations turn resources into measurable impact.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-[#073b2f]"
                style={{
                  background:
                    "linear-gradient(135deg, #fff1a3, #ebc34a 33%, #c28a17 66%, #f1cf55)",
                  border: "1px solid #f1ce55",
                }}
              >
                Get Started
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#0d5f44]/25 bg-white px-6 py-3 text-sm font-semibold text-[#0d5f44]"
              >
                Sign in to explore
              </Link>
            </div>
          </div>

          <div className="rounded-[24px] border border-[#ceb223]/45 bg-gradient-to-br from-[#003f2f] via-[#004b36] to-[#005b40] p-8 shadow-[0_24px_60px_rgba(22,66,47,.18)]">
            <p className="text-xs font-bold tracking-[0.18em] text-[#f4d35c]">
              HOPEBRIDGE OVERVIEW
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                ["Campaigns", "Plan and monitor fundraising"],
                ["Programs", "Deliver community impact"],
                ["Donors", "Steward relationships"],
                ["Analytics", "Measure outcomes"],
              ].map(([title, copy]) => (
                <div
                  key={title}
                  className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                >
                  <p className="font-semibold text-white">{title}</p>
                  <p className="mt-2 text-sm text-white/70">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="product" className="border-y border-[#ebe3d2] bg-white px-6 py-20">
        <div className="mx-auto max-w-7xl text-center">
          <p className="text-xs font-bold tracking-[0.18em] text-[#9e7b24]">
            PRODUCT STORY
          </p>
          <h2
            className="mt-4 text-4xl font-bold"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            One platform.
            <br />
            Every part of your mission.
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-[#607269]">
            HopeBridge connects the operational work of nonprofit teams with the
            evidence leaders need to communicate progress, build trust, and
            direct resources responsibly.
          </p>
        </div>
      </section>

      <section id="features" className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <p className="text-xs font-bold tracking-[0.18em] text-[#9e7b24]">
              FEATURE AREAS
            </p>
            <h2
              className="mt-4 text-4xl font-bold"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              Built for nonprofit operations
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className="rounded-[18px] border border-[#e9dfcc] bg-white p-6 shadow-[0_10px_26px_rgba(49,52,42,.05)] transition hover:-translate-y-1 hover:border-[#d1a627]/45"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-[13px] border border-[#efd786] bg-[#fff4d0] text-[#8b6005]">
                    <Icon size={20} />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#607269]">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="impact" className="border-y border-[#ebe3d2] bg-[#f4fbf7] px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-bold tracking-[0.18em] text-[#08734f]">
            IMPACT
          </p>
          <h2
            className="mt-4 text-4xl font-bold italic"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            From good intentions
            <br />
            to measurable outcomes.
          </h2>
          <p className="mt-6 text-lg leading-8 text-[#607269]">
            Track campaign progress, program delivery, donor engagement, and
            beneficiary reach so your team can report with clarity and improve
            with purpose.
          </p>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-[#9e7b24]">
              AI SECTION
            </p>
            <h2
              className="mt-4 text-4xl font-bold"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              Intelligence built
              <br />
              <span className="italic">for nonprofit work.</span>
            </h2>
            <p className="mt-6 text-lg leading-8 text-[#607269]">
              HopeBridge AI supports strategic questions across campaigns,
              programs, reporting, and daily operations — helping teams move
              from information to action.
            </p>
          </div>
          <div className="rounded-[18px] border border-[#c4e8d4] bg-white p-8 shadow-[0_10px_26px_rgba(49,52,42,.05)]">
            <div className="flex items-center gap-3">
              <BrainCircuit className="text-[#08734f]" size={24} />
              <p className="font-semibold">HopeBridge AI Assistant</p>
            </div>
            <p className="mt-4 text-sm leading-7 text-[#607269]">
              Ask about donor retention, campaign performance, volunteer
              engagement, or reporting priorities and receive guidance aligned
              to nonprofit operations.
            </p>
          </div>
        </div>
      </section>

      <section id="security" className="border-y border-[#ebe3d2] bg-white px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <Shield className="mx-auto text-[#08734f]" size={32} />
          <h2
            className="mt-6 text-4xl font-bold"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            Your mission matters.
            <br />
            So does your data.
          </h2>
          <p className="mt-6 text-lg leading-8 text-[#607269]">
            HopeBridge uses Firebase Authentication for sign-in and Firestore for
            operational records across campaigns, programs, donors, volunteers,
            beneficiaries, teams, and mission data. Access requires an authenticated
            HopeBridge account.
          </p>
        </div>
      </section>

      <section id="pricing" className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-xs font-bold tracking-[0.18em] text-[#9e7b24]">
              PRICING
            </p>
            <h2
              className="mt-4 text-4xl font-bold"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              Plans for every stage of growth
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-[#65766e]">
              Commercial pricing is under evaluation. Request early access while plans are finalized.
            </p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {pricingTiers.map((tier) => (
              <article
                key={tier.name}
                className={`rounded-[18px] border p-8 ${
                  tier.featured
                    ? "border-[#d1a627] bg-[#fffaf0] shadow-[0_18px_34px_rgba(44,53,46,.09)]"
                    : "border-[#e9dfcc] bg-white"
                }`}
              >
                <h3 className="text-xl font-semibold">{tier.name}</h3>
                <p className="mt-4 text-3xl font-bold text-[#112e24]">{tier.price}</p>
                <p className="mt-4 text-sm leading-6 text-[#607269]">{tier.detail}</p>
                <Link
                  href="/auth/signup"
                  className="mt-6 inline-flex items-center justify-center rounded-xl border border-[#0d5f44]/20 bg-white px-4 py-2.5 text-sm font-semibold text-[#0d5f44] hover:border-[#0d5f44]/40"
                >
                  Request early access
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="resources" className="border-y border-[#ebe3d2] bg-[#fffdf6] px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-bold tracking-[0.18em] text-[#9e7b24]">RESOURCES</p>
          <h2
            className="mt-4 text-3xl font-bold"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            Guides for your HopeBridge workspace
          </h2>
          <p className="mt-4 text-sm leading-7 text-[#607269]">
            The in-product Help Center covers every module — campaigns, programs, donors,
            analytics, AI Assistant, reports, and administration. Sign in to access guides
            and workflows tailored to your organization.
          </p>
          <Link
            href="/auth/login?next=%2Fdashboard%2Fhelp"
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[#0d5f44]/25 bg-white px-5 py-2.5 text-sm font-semibold text-[#0d5f44]"
          >
            Open Help Center
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-5xl rounded-[24px] border border-[#ceb223]/45 bg-gradient-to-br from-[#003f2f] to-[#005b40] px-8 py-14 text-center text-white">
          <h2
            className="text-4xl font-bold"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            Build more impact with less operational friction.
          </h2>
          <Link
            href="/auth/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-[#073b2f]"
            style={{
              background:
                "linear-gradient(135deg, #fff1a3, #ebc34a 33%, #c28a17 66%, #f1cf55)",
              border: "1px solid #f1ce55",
            }}
          >
            Get Started
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#ebe3d2] bg-[#fffdf6] px-6 py-12">
        <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Product", ["Features", "Solutions", "Impact", "Pricing"]],
            ["Resources", ["Help Center", "Getting Started", "Product Guide"]],
            ["Company", ["About", "Contact", "Careers"]],
            ["Legal", ["Privacy", "Terms", "Support"]],
          ].map(([title, links]) => (
            <div key={title as string}>
              <p className="text-sm font-semibold text-[#18382e]">{title}</p>
              <ul className="mt-4 space-y-2">
                {(links as string[]).map((link) => (
                  <li key={link}>
                    <Link
                      href={footerLinkMap[link] ?? "#product"}
                      className="text-sm text-[#65766e] hover:text-[#0d5f44]"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-10 max-w-7xl text-sm text-[#929d97]">
          © {new Date().getFullYear()} HopeBridge Foundation. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
