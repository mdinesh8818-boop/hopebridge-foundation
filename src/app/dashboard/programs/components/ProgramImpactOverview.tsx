"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Baby,
  ChevronDown,
  HeartHandshake,
  MapPin,
  TrendingUp,
  Users,
  UsersRound,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getImpactSnapshot, IMPACT_PERIOD_OPTIONS } from "../impact-data";
import { ImpactPeriodId, ImpactStory, Program } from "../types";
import GeographicReachMap from "./GeographicReachMap";
import ImpactStoriesModal, {
  ImpactStoryDetailModal,
  StoryCard,
} from "./ImpactStoriesModal";

const MONTH_LABELS: Record<string, string> = {
  Jan: "January",
  Feb: "February",
  Mar: "March",
  Apr: "April",
  May: "May",
  Jun: "June",
  Jul: "July",
  Aug: "August",
  Sep: "September",
  Oct: "October",
  Nov: "November",
  Dec: "December",
};

function TrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; payload?: { changePercent?: number } }>;
  label?: string;
}) {
  if (!active || !payload?.[0]) return null;

  const value = payload[0].value ?? 0;
  const change = payload[0].payload?.changePercent ?? 0;
  const monthLabel = label ? (MONTH_LABELS[label] ?? label) : "";

  return (
    <div className="pn-impact-tooltip">
      <p className="font-semibold text-[#112e24]">{monthLabel}</p>
      <p className="mt-1 text-sm text-[#0d5f44]">
        {value.toLocaleString()} beneficiaries
      </p>
      <p className="mt-0.5 text-xs font-semibold text-[#9a7720]">
        +{change.toFixed(1)}% from previous period
      </p>
    </div>
  );
}

function DonutTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; payload?: { beneficiaries?: number } }>;
}) {
  if (!active || !payload?.[0]) return null;

  return (
    <div className="pn-impact-tooltip">
      <p className="font-semibold text-[#112e24]">{payload[0].name}</p>
      <p className="mt-1 text-sm text-[#0d5f44]">{payload[0].value}%</p>
      <p className="mt-0.5 text-xs text-[#607269]">
        {(payload[0].payload?.beneficiaries ?? 0).toLocaleString()} beneficiaries
      </p>
    </div>
  );
}

export default function ProgramImpactOverview({ programs }: { programs: Program[] }) {
  const [period, setPeriod] = useState<ImpactPeriodId>("12m");
  const [periodOpen, setPeriodOpen] = useState(false);
  const [storiesOpen, setStoriesOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState<ImpactStory | null>(null);
  const [hoveredLocationId, setHoveredLocationId] = useState<string | null>(null);
  const [hoveredProgram, setHoveredProgram] = useState<string | null>(null);
  const [activeDonutIndex, setActiveDonutIndex] = useState<number | null>(null);

  const snapshot = useMemo(
    () => getImpactSnapshot(period, programs),
    [period, programs],
  );
  const periodLabel =
    IMPACT_PERIOD_OPTIONS.find((option) => option.id === period)?.label ??
    "Last 12 Months";

  const donutData = snapshot.distribution.map((slice) => ({
    name: slice.category,
    value: slice.percent,
    beneficiaries: slice.beneficiaries,
    color: slice.color,
  }));

  return (
    <section className="pn-impact-section mt-8" aria-label="Program Impact Overview">
      <div className="pn-impact-header">
        <div>
          <p className="pn-kicker">PROGRAM IMPACT INTELLIGENCE</p>
          <h2 className="pn-impact-section-title mt-2">Program Impact Overview</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#607269]">
            Track and measure the measurable impact of HopeBridge programs across
            communities, beneficiaries, regions, and initiatives.
          </p>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setPeriodOpen((open) => !open)}
            className="pn-impact-period-btn"
            aria-expanded={periodOpen}
            aria-haspopup="listbox"
          >
            {periodLabel}
            <ChevronDown size={16} className={periodOpen ? "rotate-180" : ""} />
          </button>

          {periodOpen && (
            <ul className="pn-impact-period-menu" role="listbox">
              {IMPACT_PERIOD_OPTIONS.map((option) => (
                <li key={option.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={period === option.id}
                    onClick={() => {
                      setPeriod(option.id);
                      setPeriodOpen(false);
                    }}
                    className={period === option.id ? "is-active" : ""}
                  >
                    {option.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="pn-impact-kpi-grid">
        <ImpactKPICard
          icon={<Users size={20} />}
          label="TOTAL BENEFICIARIES"
          value={snapshot.kpis.totalBeneficiaries.toLocaleString()}
          sub={`↑ ${snapshot.kpis.beneficiaryGrowth}% vs last period`}
          subAccent
        />
        <ImpactKPICard
          icon={<Baby size={20} />}
          label="CHILDREN REACHED"
          value={snapshot.kpis.childrenReached.toLocaleString()}
          sub={`${snapshot.kpis.childrenPercent}% of total`}
        />
        <ImpactKPICard
          icon={<UsersRound size={20} />}
          label="WOMEN IMPACTED"
          value={snapshot.kpis.womenImpacted.toLocaleString()}
          sub={`${snapshot.kpis.womenPercent}% of total`}
        />
        <ImpactKPICard
          icon={<HeartHandshake size={20} />}
          label="FAMILIES SUPPORTED"
          value={snapshot.kpis.familiesSupported.toLocaleString()}
          sub={`${snapshot.kpis.familiesPercent}% of total`}
        />
      </div>

      <div className="pn-impact-analytics-grid mt-6">
        <article className="pn-impact-panel pn-impact-panel-wide">
          <h3 className="pn-impact-panel-title">Beneficiaries Over Time</h3>
          <div className="mt-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={snapshot.beneficiaryTrend} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="pnImpactAreaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0d5f44" stopOpacity={0.35} />
                    <stop offset="55%" stopColor="#d4af37" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#f7f3e8" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#607269", fontSize: 11 }}
                  axisLine={{ stroke: "#e4dac6" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#607269", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${Math.round(Number(value) / 1000)}K`}
                />
                <Tooltip content={<TrendTooltip />} />
                <Area
                  type="monotone"
                  dataKey="beneficiaries"
                  stroke="#0d5f44"
                  strokeWidth={2.5}
                  fill="url(#pnImpactAreaFill)"
                  dot={{ r: 4, fill: "#d4af37", stroke: "#0d5f44", strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: "#d4af37", stroke: "#112e24", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="pn-impact-panel">
          <h3 className="pn-impact-panel-title">Impact by Program</h3>
          <ul className="mt-5 space-y-4">
            {snapshot.programImpact.map((program) => (
              <li
                key={program.name}
                onMouseEnter={() => setHoveredProgram(program.name)}
                onMouseLeave={() => setHoveredProgram(null)}
              >
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-medium text-[#334b41]">{program.name}</span>
                  <span className="shrink-0 font-semibold text-[#0d5f44]">
                    {program.impactPercent}%
                  </span>
                </div>
                <div className="pn-impact-bar-track mt-2">
                  <div
                    className="pn-impact-bar-fill"
                    style={{ width: `${program.impactPercent}%` }}
                  />
                </div>
                {hoveredProgram === program.name && (
                  <p className="mt-1.5 text-xs text-[#607269]">
                    {program.beneficiaries.toLocaleString()} beneficiaries reached
                  </p>
                )}
              </li>
            ))}
          </ul>
        </article>
      </div>

      <div className="pn-impact-bottom-grid mt-6">
        <article className="pn-impact-panel">
          <h3 className="pn-impact-panel-title">Impact Distribution</h3>
          <div className="mt-2 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={2}
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {donutData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={entry.color}
                      opacity={
                        activeDonutIndex === null || activeDonutIndex === index
                          ? 1
                          : 0.42
                      }
                      stroke={activeDonutIndex === index ? "#d4af37" : "#fff"}
                      strokeWidth={activeDonutIndex === index ? 3 : 2}
                      onMouseEnter={() => setActiveDonutIndex(index)}
                      onMouseLeave={() => setActiveDonutIndex(null)}
                    />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-1 space-y-1.5">
            {snapshot.distribution.map((slice) => (
              <li key={slice.category} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-[#607269]">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ background: slice.color }}
                  />
                  {slice.category}
                </span>
                <span className="font-semibold text-[#112e24]">{slice.percent}%</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="pn-impact-panel">
          <h3 className="pn-impact-panel-title">Geographic Reach</h3>
          <div className="mt-3">
            <GeographicReachMap
              locations={snapshot.geography}
              hoveredId={hoveredLocationId}
              onHover={(location) => setHoveredLocationId(location?.id ?? null)}
            />
          </div>

          <div className="pn-impact-geo-stats">
            <div>
              <p className="pn-impact-geo-value">{snapshot.geographicSummary.countries}</p>
              <p className="pn-impact-geo-label">Countries</p>
            </div>
            <div>
              <p className="pn-impact-geo-value">{snapshot.geographicSummary.regions}</p>
              <p className="pn-impact-geo-label">Regions</p>
            </div>
            <div>
              <p className="pn-impact-geo-value">{snapshot.geographicSummary.communities}</p>
              <p className="pn-impact-geo-label">Communities</p>
            </div>
          </div>
        </article>

        <article className="pn-impact-panel">
          <h3 className="pn-impact-panel-title">Impact Stories</h3>
          <ul className="mt-4 space-y-3">
            {snapshot.stories.slice(0, 2).map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                onClick={() => setSelectedStory(story)}
              />
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setStoriesOpen(true)}
            className="pn-impact-stories-btn mt-4"
          >
            View All Stories →
          </button>
        </article>
      </div>

      <article className="pn-impact-efficiency mt-6">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-[#d4af37]" />
          <h3 className="pn-impact-efficiency-title">Impact Efficiency</h3>
        </div>
        <div className="pn-impact-efficiency-grid">
          <EfficiencyItem
            label="Cost per Beneficiary"
            value={`$${snapshot.efficiency.costPerBeneficiary.toFixed(2)}`}
          />
          <EfficiencyItem
            label="Programs Improving"
            value={`${snapshot.efficiency.programsImproving} of ${snapshot.efficiency.programsTotal}`}
          />
          <EfficiencyItem
            label="Highest Impact Program"
            value={snapshot.efficiency.highestImpactProgram}
          />
          <EfficiencyItem
            label="Fastest Growing Reach"
            value={`${snapshot.efficiency.fastestGrowingProgram} +${snapshot.efficiency.fastestGrowthPercent}%`}
          />
          <EfficiencyItem
            label="Communities Reached"
            value={snapshot.efficiency.communitiesReached.toString()}
            icon={<MapPin size={14} />}
          />
        </div>
      </article>

      <ImpactStoriesModal
        isOpen={storiesOpen}
        onClose={() => setStoriesOpen(false)}
        onSelectStory={(story) => {
          setStoriesOpen(false);
          setSelectedStory(story);
        }}
      />
      <ImpactStoryDetailModal
        story={selectedStory}
        onClose={() => setSelectedStory(null)}
      />
    </section>
  );
}

function ImpactKPICard({
  icon,
  label,
  value,
  sub,
  subAccent = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub: string;
  subAccent?: boolean;
}) {
  return (
    <article className="pn-impact-kpi-card">
      <div className="pn-impact-kpi-icon">{icon}</div>
      <p className="pn-impact-kpi-label">{label}</p>
      <p className="pn-impact-kpi-value">{value}</p>
      <p className={`pn-impact-kpi-sub ${subAccent ? "is-accent" : ""}`}>{sub}</p>
    </article>
  );
}

function EfficiencyItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="pn-impact-efficiency-item">
      <p className="pn-impact-efficiency-label">{label}</p>
      <p className="pn-impact-efficiency-value">
        {icon}
        {value}
      </p>
    </div>
  );
}
