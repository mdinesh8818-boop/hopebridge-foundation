"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  Lightbulb,
  ShieldCheck,
} from "lucide-react";

import { computeProgramInsights } from "../../../../services/impactAnalytics";
import type { Program } from "../types";

type ProgramInsightsProps = {
  programs: Program[];
};

export default function ProgramInsights({ programs }: ProgramInsightsProps) {
  const insights = computeProgramInsights(programs);
  function getInsightIcon(severity: string) {
    if (severity === "High") return AlertTriangle;
    if (severity === "Medium") return Lightbulb;
    return ShieldCheck;
  }

  function getInsightCardClass(severity: string) {
    if (severity === "High") return "pn-insight-burgundy";
    if (severity === "Medium") return "pn-insight-amber";
    return "pn-insight-emerald";
  }

  function getInsightIconClass(severity: string) {
    if (severity === "High") return "pn-insight-icon-red";
    if (severity === "Medium") return "pn-insight-icon-gold";
    return "pn-insight-icon-emerald";
  }

  function getSeverityLabel(severity: string) {
    return `${severity.toUpperCase()} SEVERITY`;
  }

  function getSeverityColor(severity: string) {
    if (severity === "High") return "text-[#fca5a5]";
    if (severity === "Medium") return "text-[#fcd34d]";
    return "text-[#6ee7b7]";
  }

  return (
    <section className="pn-insights-panel p-6 sm:p-7">
      <div>
        <p className="pn-insights-kicker">PORTFOLIO INTELLIGENCE</p>
        <h2 className="pn-insights-title mt-2">Program Insights</h2>
        <p className="pn-insights-subtitle mt-2 text-sm leading-6">
          Key risks, opportunities, and recommendations across the current
          program portfolio.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {insights.length === 0 ? (
          <p className="text-sm text-[rgba(247,243,232,0.68)]">
            No AI insights available yet. Insights will appear as program data is recorded.
          </p>
        ) : (
          insights.map((insight) => {
            const Icon = getInsightIcon(insight.severity);

            return (
              <article
                key={insight.id}
                className={`pn-insight-card ${getInsightCardClass(insight.severity)}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`shrink-0 ${getInsightIconClass(insight.severity)}`}>
                    <Icon size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="font-semibold text-[#f7f3e8]">{insight.title}</h3>
                      <span
                        className={`text-[10px] font-extrabold tracking-[0.12em] ${getSeverityColor(insight.severity)}`}
                      >
                        {getSeverityLabel(insight.severity)}
                      </span>
                    </div>

                    <p className="mt-2 text-sm leading-6 text-[rgba(247,243,232,0.68)]">
                      {insight.description}
                    </p>

                    <div className="pn-insight-rec-box">
                      <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#e4bf4f]">
                        RECOMMENDATION
                      </p>
                      <p className="mt-1.5 text-sm leading-6 text-[rgba(247,243,232,0.82)]">
                        {insight.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          document.getElementById("program-portfolio-table")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }}
        className="pn-insights-action-btn"
      >
        Review Portfolio Recommendations
        <ArrowUpRight size={17} />
      </button>
    </section>
  );
}
