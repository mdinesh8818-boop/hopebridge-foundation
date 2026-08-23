import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Home,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react";

type ModulePageProps = {
  eyebrow: string;
  title: string;
  titleAccent?: string;
  description: string;
  primaryAction: string;
  primaryActionHref?: string;
  modulePath?: string;
  stats?: {
    label: string;
    value: string;
    detail: string;
  }[];
};

const defaultStats = [
  {
    label: "Active Records",
    value: "0",
    detail: "No records yet",
  },
  {
    label: "Completed",
    value: "0",
    detail: "No completed items",
  },
  {
    label: "In Progress",
    value: "0",
    detail: "No items in progress",
  },
  {
    label: "Needs Attention",
    value: "0",
    detail: "Nothing flagged",
  },
];

const iconStyles = [
  "border-[#efd786] bg-[#fff4d0] text-[#8b6005]",
  "border-[#c4e8d4] bg-[#e8f8ef] text-[#08734f]",
  "border-[#cae8ed] bg-[#eaf8fb] text-[#0a728d]",
  "border-[#fecdd3] bg-[#fff1f2] text-[#be123c]",
];

const statIcons = [BarChart3, CheckCircle2, Clock3, TrendingUp];

export default function ModulePage({
  eyebrow,
  title,
  titleAccent,
  description,
  primaryAction,
  primaryActionHref = "#",
  modulePath,
  stats = defaultStats,
}: ModulePageProps) {
  const titleParts = titleAccent ? null : title.split(" ");
  const accentWord = titleAccent ?? (titleParts && titleParts.length > 1 ? titleParts.slice(-1)[0] : null);
  const titleLead =
    titleAccent && title.includes(" ")
      ? title.replace(new RegExp(`\\s*${titleAccent}$`), "")
      : titleParts && titleParts.length > 1
        ? titleParts.slice(0, -1).join(" ")
        : title;

  return (
    <main className="hb-page min-h-screen px-5 py-7 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1500px]">
        <nav className="flex flex-wrap items-center gap-2 text-xs text-[#65766e]">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 transition hover:text-[#0d5f44]"
          >
            <Home size={14} className="text-[#0d5f44]" />
            HopeBridge Foundation
          </Link>
          {modulePath && (
            <>
              <span className="text-[#c2cbc6]">/</span>
              <span className="font-medium text-[#18392e]">{modulePath}</span>
            </>
          )}
        </nav>

        <Link
          href="/dashboard"
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[#e4dac6] bg-white px-4 py-2.5 text-sm font-medium text-[#2d493e] shadow-sm transition hover:border-[#d1a627]/40 hover:shadow-md"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        <section className="hb-hero relative mt-6 overflow-hidden rounded-[22px] border border-[#ceb223]/45 shadow-[0_18px_46px_rgba(22,66,47,.12)]">
          <div className="hb-hero-arc hb-hero-arc-one" aria-hidden="true" />
          <div className="hb-hero-arc hb-hero-arc-two" aria-hidden="true" />

          <div className="relative z-[2] flex flex-col gap-6 px-6 py-8 sm:px-9 sm:py-10 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className="hb-pill inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-extrabold tracking-[1.6px] text-[#f4d35c]">
                <Sparkles size={14} />
                {eyebrow.toUpperCase()}
              </div>

              <h1 className="hb-serif mt-5 text-4xl font-bold leading-[1.02] tracking-tight text-white sm:text-5xl">
                {accentWord && titleLead !== title ? (
                  <>
                    <span className="block">{titleLead.trim()}</span>
                    <span className="hb-gold-text">{accentWord}</span>
                  </>
                ) : (
                  title
                )}
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75 sm:text-[15px]">
                {description}
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/15"
              >
                <Search size={17} />
                Search
              </button>

              <Link
                href={primaryActionHref}
                className="hb-gold-btn inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold"
              >
                <Plus size={18} />
                {primaryAction}
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = statIcons[index] ?? BarChart3;

            return (
              <article
                key={stat.label}
                className="hb-card hb-kpi group relative overflow-hidden rounded-[18px] border border-[#e9dfcc] bg-white p-6 shadow-[0_10px_26px_rgba(49,52,42,.055)] transition duration-300 hover:-translate-y-1 hover:border-[#d1a627]/50 hover:shadow-[0_18px_34px_rgba(44,53,46,.09)]"
              >
                <div className="hb-card-shine" aria-hidden="true" />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-[#607269]">{stat.label}</p>
                    <p className="mt-3 text-4xl font-bold tracking-tight text-[#112e24]">
                      {stat.value}
                    </p>
                  </div>

                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] border ${iconStyles[index]}`}
                  >
                    <Icon size={20} />
                  </div>
                </div>

                <p className="mt-5 text-sm text-[#65766e]">{stat.detail}</p>
              </article>
            );
          })}
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <article className="hb-panel rounded-[18px] p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-extrabold tracking-[1.3px] text-[#9f7b24]">
                  PERFORMANCE OVERVIEW
                </p>
                <h2 className="hb-serif mt-2 text-2xl font-bold text-[#18392e]">
                  Module Progress
                </h2>
              </div>

              <button
                type="button"
                className="hb-secondary-btn inline-flex items-center gap-2 self-start rounded-xl px-4 py-2 text-sm"
              >
                <CalendarDays size={16} />
                Last 12 months
              </button>
            </div>

            <div className="mt-8 space-y-6">
              {[
                ["Planning", 86],
                ["Execution", 72],
                ["Review", 64],
                ["Optimization", 91],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#334b41]">{label}</span>
                    <span className="text-[#929d97]">{value}%</span>
                  </div>
                  <div className="hb-progress-bar mt-2">
                    <div
                      className="hb-progress-fill"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[18px] border border-[#efd786]/55 bg-gradient-to-br from-[#fffaf0] to-[#f4fbf7] p-6 shadow-[0_10px_26px_rgba(49,52,42,.05)] sm:p-8">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-[10px] font-extrabold tracking-[1.3px] text-[#9f7b24]">
                  HOPEBRIDGE AI
                </p>
                <h2 className="hb-serif mt-2 text-2xl font-bold text-[#18392e]">
                  Intelligent Recommendation
                </h2>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-[13px] border border-[#c4e8d4] bg-[#e8f8ef] text-[#08734f]">
                <Sparkles size={21} />
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-[#ebe3d2] bg-white p-5">
              <p className="font-medium text-[#18392e]">
                Improvement opportunity detected
              </p>
              <p className="mt-3 text-sm leading-6 text-[#607269]">
                Current module performance can improve by prioritizing delayed
                activities, assigning clear ownership, and reviewing outcomes
                weekly.
              </p>
            </div>

            <Link
              href="/dashboard/ai-assistant"
              className="hb-emerald-btn mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold"
            >
              View Recommendation
              <ArrowRight size={17} />
            </Link>
          </article>
        </section>

        <section className="hb-panel mt-8 rounded-[18px] p-6 sm:p-8">
          <div>
            <p className="text-[10px] font-extrabold tracking-[1.3px] text-[#9f7b24]">
              LATEST UPDATES
            </p>
            <h2 className="hb-serif mt-2 text-2xl font-bold text-[#18392e]">
              Recent Activity
            </h2>
          </div>

          <div className="mt-6 space-y-3">
            {[
              {
                title: "New record created",
                detail: "A new module record was added by Dinesh.",
                time: "18 minutes ago",
              },
              {
                title: "Performance target updated",
                detail: "The quarterly performance target was increased.",
                time: "1 hour ago",
              },
              {
                title: "Review completed",
                detail: "The leadership review was completed successfully.",
                time: "3 hours ago",
              },
            ].map((activity) => (
              <div
                key={activity.title}
                className="flex flex-col gap-4 rounded-2xl border border-[#f0eadf] bg-[#fffdfa] p-5 sm:flex-row sm:items-center"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#c4e8d4] bg-[#e8f8ef] text-[#08734f]">
                  <CheckCircle2 size={17} />
                </div>

                <div className="flex-1">
                  <p className="font-medium text-[#18382e]">{activity.title}</p>
                  <p className="mt-1 text-sm text-[#929d97]">{activity.detail}</p>
                </div>

                <span className="text-xs text-[#c2cbc6]">{activity.time}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
