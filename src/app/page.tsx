import {
  ArrowRight,
  BarChart3,
  Eye,
  HeartHandshake,
  LayoutDashboard,
  Megaphone,
  Play,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";

const features = [
  {
    icon: HeartHandshake,
    title: "Donor Management",
    description:
      "Build lasting relationships with intelligent donor profiles, automated outreach, and personalized engagement tracking.",
    gradient: "from-emerald-500/20 to-teal-500/5",
    iconColor: "text-emerald-400",
  },
  {
    icon: Users,
    title: "Volunteer Management",
    description:
      "Coordinate volunteers effortlessly with smart scheduling, skill matching, and real-time availability dashboards.",
    gradient: "from-blue-500/20 to-cyan-500/5",
    iconColor: "text-blue-400",
  },
  {
    icon: Megaphone,
    title: "Campaign Management",
    description:
      "Launch, monitor, and optimize fundraising campaigns with multi-channel tools and performance insights.",
    gradient: "from-violet-500/20 to-purple-500/5",
    iconColor: "text-violet-400",
  },
  {
    icon: Sparkles,
    title: "AI Analytics",
    description:
      "Unlock predictive insights with machine learning models that forecast trends and recommend actions.",
    gradient: "from-amber-500/20 to-orange-500/5",
    iconColor: "text-amber-400",
  },
  {
    icon: Eye,
    title: "Financial Transparency",
    description:
      "Maintain complete accountability with auditable ledgers, real-time fund tracking, and public dashboards.",
    gradient: "from-rose-500/20 to-pink-500/5",
    iconColor: "text-rose-400",
  },
  {
    icon: LayoutDashboard,
    title: "Reports Dashboard",
    description:
      "Generate comprehensive reports instantly with customizable widgets and export-ready visualizations.",
    gradient: "from-indigo-500/20 to-blue-500/5",
    iconColor: "text-indigo-400",
  },
];

const stats = [
  { value: "$2.5M", label: "Donations", icon: BarChart3 },
  { value: "120K", label: "Beneficiaries", icon: HeartHandshake },
  { value: "800", label: "Volunteers", icon: Users },
  { value: "98%", label: "Transparency", icon: Shield },
];

const footerLinks = {
  Product: ["Features", "Pricing", "Integrations", "Changelog"],
  Company: ["About", "Careers", "Blog", "Press"],
  Resources: ["Documentation", "Help Center", "API", "Status"],
  Legal: ["Privacy", "Terms", "Security", "Compliance"],
};

export default function Home() {
  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100 font-sans">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute top-1/3 -right-32 h-[400px] w-[400px] rounded-full bg-violet-500/8 blur-[100px]" />
        <div className="absolute bottom-0 -left-32 h-[350px] w-[350px] rounded-full bg-blue-500/8 blur-[100px]" />
      </div>

      <div className="relative">
        {/* Hero */}
        <section className="relative px-6 pt-24 pb-20 sm:px-8 lg:px-12 lg:pt-32 lg:pb-28">
          <div className="mx-auto max-w-5xl text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-400 animate-[fadeIn_0.6s_ease-out]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Trusted by 500+ nonprofits worldwide</span>
            </div>

            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-7xl animate-[fadeIn_0.6s_ease-out_0.1s_both]">
              <span className="bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                HopeBridge Foundation
              </span>
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-lg text-zinc-400 sm:text-xl lg:text-2xl animate-[fadeIn_0.6s_ease-out_0.2s_both]">
              AI-Powered Charity Management Platform
            </p>

            <p className="mx-auto mb-12 max-w-xl text-base leading-relaxed text-zinc-500 animate-[fadeIn_0.6s_ease-out_0.3s_both]">
              Streamline operations, maximize impact, and build trust with the
              most intelligent platform built for modern charitable
              organizations.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row animate-[fadeIn_0.6s_ease-out_0.4s_both]">
              <button
                type="button"
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-8 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:shadow-emerald-500/40 hover:brightness-110 sm:w-auto"
              >
                Get Started
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
              <button
                type="button"
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/50 px-8 text-sm font-semibold text-zinc-200 backdrop-blur-sm transition-all duration-300 hover:border-zinc-600 hover:bg-zinc-800/80 sm:w-auto"
              >
                <Play className="h-4 w-4 fill-current text-emerald-400" />
                Watch Demo
              </button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="px-6 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Everything you need to{" "}
                <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  drive impact
                </span>
              </h2>
              <p className="mx-auto max-w-2xl text-zinc-400">
                A comprehensive suite of tools designed for enterprise-grade
                charity management, powered by cutting-edge AI.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className="group relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-8 shadow-xl shadow-black/20 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:border-zinc-700 hover:shadow-2xl hover:shadow-emerald-500/5"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
                  />
                  <div className="relative">
                    <div className="mb-5 inline-flex rounded-xl border border-zinc-700/50 bg-zinc-800/80 p-3 transition-transform duration-300 group-hover:scale-110">
                      <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
                    </div>
                    <h3 className="mb-3 text-lg font-semibold text-white">
                      {feature.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-zinc-400">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section className="px-6 py-20 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-7xl">
            <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-950 p-8 shadow-2xl shadow-black/40 sm:p-12 lg:p-16">
              <div className="mb-12 text-center">
                <h2 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
                  Impact at scale
                </h2>
                <p className="text-zinc-400">
                  Real numbers from organizations transforming giving with
                  HopeBridge.
                </p>
              </div>

              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="group flex flex-col items-center rounded-2xl border border-zinc-800/60 bg-zinc-950/50 p-8 text-center transition-all duration-300 hover:border-emerald-500/30 hover:bg-zinc-950/80"
                  >
                    <stat.icon className="mb-4 h-8 w-8 text-emerald-400/70 transition-colors duration-300 group-hover:text-emerald-400" />
                    <span className="mb-2 bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
                      {stat.value}
                    </span>
                    <span className="text-sm font-medium uppercase tracking-wider text-zinc-500">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-4xl">
            <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/80 via-zinc-900 to-zinc-950 px-8 py-16 text-center shadow-2xl shadow-emerald-500/10 sm:px-16 sm:py-20">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.15),transparent_60%)]" />
              <div className="relative">
                <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                  Transform the Future of Giving
                </h2>
                <p className="mx-auto mb-10 max-w-xl text-zinc-400">
                  Join leading nonprofits who are redefining charitable impact
                  with intelligent, transparent, and scalable management tools.
                </p>
                <button
                  type="button"
                  className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-8 text-sm font-semibold text-zinc-950 shadow-lg transition-all duration-300 hover:bg-zinc-100 hover:shadow-xl"
                >
                  Start Your Free Trial
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-zinc-800/80 px-6 py-16 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
              <div className="lg:col-span-1">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                    <HeartHandshake className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-lg font-bold text-white">
                    HopeBridge
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-zinc-500">
                  Empowering charities with AI-driven tools for a more
                  transparent and impactful future.
                </p>
              </div>

              {Object.entries(footerLinks).map(([category, links]) => (
                <div key={category}>
                  <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-300">
                    {category}
                  </h4>
                  <ul className="space-y-3">
                    {links.map((link) => (
                      <li key={link}>
                        <a
                          href="#"
                          className="text-sm text-zinc-500 transition-colors duration-200 hover:text-emerald-400"
                        >
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-center justify-between gap-4 border-t border-zinc-800/80 pt-8 sm:flex-row">
              <p className="text-sm text-zinc-600">
                &copy; {new Date().getFullYear()} HopeBridge Foundation. All
                rights reserved.
              </p>
              <div className="flex gap-6">
                {["Twitter", "LinkedIn", "GitHub"].map((social) => (
                  <a
                    key={social}
                    href="#"
                    className="text-sm text-zinc-500 transition-colors duration-200 hover:text-emerald-400"
                  >
                    {social}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
