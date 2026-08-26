"use client";

import { useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  Target,
  Users,
  Wallet,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PERFORMANCE_DATA } from "../data";
import { Program } from "../types";
import {
  calculateHealthMatrix,
  getPortfolioSignals,
} from "../utils";
import ProgramEmptyState from "./ProgramEmptyState";

const SERIES = {
  planning: { label: "Planning", color: "#22d3ee" },
  execution: { label: "Execution", color: "#34d399" },
  review: { label: "Review", color: "#fb923c" },
  optimization: { label: "Optimization", color: "#a78bfa" },
} as const;

type SeriesKey = keyof typeof SERIES;

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string; value?: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const orderedKeys: SeriesKey[] = [
    "execution",
    "optimization",
    "planning",
    "review",
  ];

  return (
    <div
      className="rounded-[14px] border border-[rgba(212,175,55,0.35)] px-4 py-3 shadow-[0_12px_32px_rgba(7,29,23,0.55)]"
      style={{ background: "linear-gradient(165deg, #071d17, #002f25)" }}
    >
      <p className="mb-2 text-sm font-semibold text-[#f7f3e8]">{label}</p>
      <div className="space-y-1.5">
        {orderedKeys.map((key) => {
          const entry = payload.find((item) => item.dataKey === key);
          if (!entry) return null;

          return (
            <div key={key} className="flex items-center justify-between gap-6 text-sm">
              <span style={{ color: SERIES[key].color }}>{SERIES[key].label}</span>
              <span className="font-semibold tabular-nums text-[#f7f3e8]">
                {entry.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ProgramChartProps {
  programs: Program[];
  onCreateProgram?: () => void;
}

export default function ProgramChart({ programs, onCreateProgram }: ProgramChartProps) {
  const health = useMemo(() => calculateHealthMatrix(programs), [programs]);
  const signals = useMemo(() => getPortfolioSignals(programs), [programs]);
  const hasPrograms = programs.length > 0;

  const signalIconClass = {
    up: "pn-signal-up",
    check: "pn-signal-check",
    warn: "pn-signal-warn",
    delay: "pn-signal-delay",
  } as const;

  const signalPrefix = {
    up: "↑",
    check: "✓",
    warn: "⚠",
    delay: "→",
  } as const;

  return (
    <section className="pn-panel-emerald pn-analytics-panel p-5 sm:p-6">
      <div className="relative z-[1] mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="pn-analytics-kicker">PERFORMANCE ANALYTICS</p>
          <h2 className="pn-analytics-title mt-2">
            Program Performance Analytics
          </h2>
          <p className="mt-2 text-sm text-[rgba(247,243,232,0.62)]">
            Monitor planning, execution, review and optimization across all
            HopeBridge programs.
          </p>
        </div>

        <div className="rounded-xl border border-[rgba(212,175,55,0.28)] bg-[rgba(7,29,23,0.55)] px-4 py-2 backdrop-blur-sm">
          <span className="text-xs font-semibold text-[#e4bf4f]">
            Last 7 Months
          </span>
        </div>
      </div>

      <div className="relative z-[1] pn-analytics-chart">
        {hasPrograms ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={PERFORMANCE_DATA} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
              <defs>
                {(Object.keys(SERIES) as SeriesKey[]).map((key) => (
                  <filter key={key} id={`pn-glow-${key}`} height="200%" width="200%">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                ))}
              </defs>
              <CartesianGrid stroke="rgba(247,243,232,0.07)" strokeDasharray="4 4" />
              <XAxis
                dataKey="month"
                stroke="rgba(247,243,232,0.45)"
                tick={{ fill: "rgba(247,243,232,0.55)", fontSize: 12 }}
                axisLine={{ stroke: "rgba(247,243,232,0.12)" }}
              />
              <YAxis
                stroke="rgba(247,243,232,0.45)"
                tick={{ fill: "rgba(247,243,232,0.55)", fontSize: 12 }}
                axisLine={{ stroke: "rgba(247,243,232,0.12)" }}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(212,175,55,0.25)" }} />
              <Legend
                wrapperStyle={{ color: "#f7f3e8", fontSize: 12, paddingTop: 8 }}
                iconType="circle"
              />
              {(Object.keys(SERIES) as SeriesKey[]).map((key) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={SERIES[key].label}
                  stroke={SERIES[key].color}
                  strokeWidth={2.75}
                  dot={{
                    r: 4,
                    fill: SERIES[key].color,
                    stroke: "#071d17",
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 7,
                    fill: SERIES[key].color,
                    stroke: "#f7f3e8",
                    strokeWidth: 2,
                    filter: `url(#pn-glow-${key})`,
                  }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center p-4">
            <ProgramEmptyState
              tone="emerald"
              icon={Activity}
              title="No performance analytics yet"
              description="Planning, execution, review, and optimization trends appear once programs are created and begin recording delivery progress."
              onCreate={onCreateProgram}
            />
          </div>
        )}
      </div>

      <div className="pn-health-section">
        <h3 className="pn-health-title">Program Health Matrix</h3>
        <p className="pn-health-subtitle">
          {hasPrograms
            ? "Real-time portfolio signals across delivery, funding and community impact."
            : "Health scores stay at zero until the portfolio has at least one program."}
        </p>

        {hasPrograms ? (
          <>
            <div className="pn-health-grid">
              <article className="pn-health-metric">
                <div className="flex items-center gap-2">
                  <Target size={14} className="text-[#34d399]" />
                  <p className="pn-health-metric-label">DELIVERY HEALTH</p>
                </div>
                <p className="pn-health-metric-value">{health.deliveryHealth}%</p>
                <p className="pn-health-metric-sub">{health.deliveryLabel}</p>
                <div className="pn-health-progress">
                  <div
                    className="pn-health-progress-fill"
                    style={{ width: `${health.deliveryHealth}%` }}
                  />
                </div>
              </article>

              <article className="pn-health-metric">
                <div className="flex items-center gap-2">
                  <Wallet size={14} className="text-[#e4bf4f]" />
                  <p className="pn-health-metric-label">BUDGET UTILIZATION</p>
                </div>
                <p className="pn-health-metric-value">{health.budgetUtilization}%</p>
                <p className="pn-health-metric-sub">{health.budgetLabel}</p>
                <div className="pn-health-progress">
                  <div
                    className="pn-health-progress-fill"
                    style={{ width: `${health.budgetUtilization}%` }}
                  />
                </div>
              </article>

              <article className="pn-health-metric">
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-[#22d3ee]" />
                  <p className="pn-health-metric-label">BENEFICIARY REACH</p>
                </div>
                <p className="pn-health-metric-value">
                  {health.beneficiaryReach.toLocaleString()}
                </p>
                <p className="pn-health-metric-sub">{health.reachGrowth}</p>
              </article>

              <article className="pn-health-metric">
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-[#a78bfa]" />
                  <p className="pn-health-metric-label">MILESTONE COMPLETION</p>
                </div>
                <p className="pn-health-metric-value">{health.milestoneCompletion}%</p>
                <p className="pn-health-metric-sub">
                  {health.milestonesCompleted} of {health.milestonesTotal} milestones
                </p>
                <div className="pn-health-progress">
                  <div
                    className="pn-health-progress-fill"
                    style={{ width: `${health.milestoneCompletion}%` }}
                  />
                </div>
              </article>

              <article className="pn-health-metric">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className="text-[#fca5a5]" />
                  <p className="pn-health-metric-label">RISK EXPOSURE</p>
                </div>
                <p className="pn-health-metric-value">{health.riskExposure}</p>
                <p className="pn-health-metric-sub">
                  {health.criticalCount} Critical · {health.moderateCount} Moderate
                </p>
              </article>
            </div>

            {signals.length > 0 && (
              <div className="pn-signals-strip">
                <p className="pn-signals-kicker">PORTFOLIO SIGNALS</p>
                <div className="pn-signals-list">
                  {signals.map((signal) => (
                    <div key={signal.id} className="pn-signal-item">
                      <span>
                        {signalPrefix[signal.icon]} {signal.text}
                      </span>
                      <span
                        className={`pn-signal-value ${signalIconClass[signal.icon]}`}
                      >
                        {signal.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="mt-4">
            <ProgramEmptyState
              tone="emerald"
              icon={Target}
              title="Program health matrix is waiting on portfolio data"
              description="Delivery, budget, reach, milestones, and risk metrics calculate automatically from live program records."
              onCreate={onCreateProgram}
              compact
            />
          </div>
        )}
      </div>
    </section>
  );
}
