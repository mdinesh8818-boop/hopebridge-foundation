import {
  BarChart3,
  CheckCircle2,
  Clock3,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

type StatCard = {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  accent: {
    icon: string;
    border: string;
    background: string;
    hoverBorder: string;
  };
};

/** Legacy component — stats derive from parent page when wired. Defaults to empty state. */
const stats: StatCard[] = [
  {
    label: "Active Campaigns",
    value: "0",
    detail: "No campaigns yet",
    icon: BarChart3,
    accent: {
      icon: "text-amber-300",
      border: "border-amber-300/20",
      background: "bg-amber-300/10",
      hoverBorder: "hover:border-amber-300/30",
    },
  },
  {
    label: "Completed",
    value: "0",
    detail: "No completed campaigns",
    icon: CheckCircle2,
    accent: {
      icon: "text-emerald-400",
      border: "border-emerald-400/20",
      background: "bg-emerald-400/10",
      hoverBorder: "hover:border-emerald-400/30",
    },
  },
  {
    label: "In Progress",
    value: "0",
    detail: "No campaigns in progress",
    icon: Clock3,
    accent: {
      icon: "text-sky-400",
      border: "border-sky-400/20",
      background: "bg-sky-400/10",
      hoverBorder: "hover:border-sky-400/30",
    },
  },
  {
    label: "Needs Attention",
    value: "0",
    detail: "Nothing flagged",
    icon: TrendingUp,
    accent: {
      icon: "text-violet-400",
      border: "border-violet-400/20",
      background: "bg-violet-400/10",
      hoverBorder: "hover:border-violet-400/30",
    },
  },
];

export default function CampaignStats() {
  return (
    <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <article
            key={stat.label}
            className={`rounded-xl border border-white/10 bg-white/[0.04] p-6 shadow-xl backdrop-blur-xl transition duration-300 hover:-translate-y-1 ${stat.accent.hoverBorder}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-zinc-400">{stat.label}</p>
                <p className="mt-3 text-4xl font-bold tracking-tight text-white">
                  {stat.value}
                </p>
              </div>

              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${stat.accent.border} ${stat.accent.background}`}
              >
                <Icon size={20} className={stat.accent.icon} />
              </div>
            </div>

            <p className="mt-5 text-sm text-zinc-500">{stat.detail}</p>
          </article>
        );
      })}
    </section>
  );
}
