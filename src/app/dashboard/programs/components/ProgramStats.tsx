"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  DollarSign,
  Layers3,
  Users,
} from "lucide-react";
import { ProgramStatistics } from "../types";
import { formatCurrency } from "../utils";

interface ProgramStatsProps {
  statistics: ProgramStatistics;
}

export default function ProgramStats({ statistics }: ProgramStatsProps) {
  const cards = [
    {
      title: "Active Programs",
      value: statistics.active,
      subtitle: "Currently running",
      icon: Layers3,
      iconClass: "pn-icon-gold",
    },
    {
      title: "Completed",
      value: statistics.completed,
      subtitle: "Successfully finished",
      icon: CheckCircle2,
      iconClass: "pn-icon-emerald",
    },
    {
      title: "In Progress",
      value: statistics.inProgress,
      subtitle: "Currently progressing",
      icon: Clock3,
      iconClass: "pn-icon-blue",
    },
    {
      title: "Needs Action",
      value: statistics.attention,
      subtitle: "Critical priority",
      icon: AlertTriangle,
      iconClass: "pn-icon-red",
    },
    {
      title: "Total Budget",
      value: formatCurrency(statistics.totalBudget),
      subtitle: "Across all programs",
      icon: DollarSign,
      iconClass: "pn-icon-gold",
    },
    {
      title: "Beneficiaries",
      value: statistics.totalBeneficiaries.toLocaleString(),
      subtitle: "People supported",
      icon: Users,
      iconClass: "pn-icon-emerald",
    },
  ];

  return (
    <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <article key={card.title} className="pn-stat-card group">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-[#607269]">{card.title}</p>
                <h2 className="mt-2 font-serif text-2xl font-bold text-[#112e24]">
                  {card.value}
                </h2>
                <p className="mt-2 text-xs text-[#929d97]">{card.subtitle}</p>
              </div>
              <div className={card.iconClass}>
                <Icon size={22} />
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
