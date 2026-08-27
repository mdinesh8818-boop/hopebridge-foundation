"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  CircleDollarSign,
  Filter,
  Globe2,
  HandHeart,
  HeartHandshake,
  Home,
  MapPin,
  Megaphone,
  RefreshCw,
  RotateCcw,
  Target,
  TrendingUp,
  Users,
  UsersRound,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import HopeBridgeSidebar from "../components/HopeBridgeSidebar";
import GeographicReachMap from "../programs/components/GeographicReachMap";
import type { GeographicLocation } from "../programs/types";
import {
  DEFAULT_FILTERS,
  fetchImpactIntelligence,
  formatAnalyticsCurrency,
  formatAnalyticsNumber,
} from "@/services/impactIntelligence";
import type {
  AnalyticsFilters,
  AnalyticsPeriodId,
  ImpactIntelligenceBundle,
  ProgramHealth,
  ProgramPerformanceRow,
} from "./types";
import { AnalyticsEmptyState } from "./components/AnalyticsEmptyState";
import "./analytics.css";

const PERIOD_OPTIONS: { id: AnalyticsPeriodId; label: string }[] = [
  { id: "30d", label: "Last 30 Days" },
  { id: "90d", label: "Last 90 Days" },
  { id: "6m", label: "6 Months" },
  { id: "1y", label: "1 Year" },
];

function healthClass(health: ProgramHealth) {
  switch (health) {
    case "On Track":
      return "ia-health on-track";
    case "Needs Attention":
      return "ia-health needs-attention";
    case "Critical":
      return "ia-health critical";
    case "Completed":
      return "ia-health completed";
  }
}

function displayValue(
  loading: boolean,
  value: number | null | undefined,
  formatter: (n: number) => string = formatAnalyticsNumber,
) {
  if (loading) return "—";
  if (value == null) return "—";
  return formatter(value);
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [draftFilters, setDraftFilters] = useState<AnalyticsFilters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<AnalyticsFilters>(DEFAULT_FILTERS);
  const [bundle, setBundle] = useState<ImpactIntelligenceBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [programSort, setProgramSort] = useState<"name" | "progress" | "health">(
    "progress",
  );
  const [programHealthFilter, setProgramHealthFilter] = useState<string>("all");
  const [hoveredLocationId, setHoveredLocationId] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadAnalytics() {
      setLoading(true);
      setError("");
      try {
        const data = await fetchImpactIntelligence(appliedFilters);
        if (!cancelled) setBundle(data);
      } catch (err) {
        console.error("Unable to load impact analytics.", err);
        if (!cancelled) {
          setError("Unable to load impact analytics. Please try again.");
          setBundle(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadAnalytics();
    return () => {
      cancelled = true;
    };
  }, [appliedFilters, refreshToken]);

  const applyFilters = () => setAppliedFilters({ ...draftFilters });
  const resetFilters = () => {
    setDraftFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setProgramHealthFilter("all");
    setProgramSort("progress");
  };

  const setPeriod = (period: AnalyticsPeriodId) => {
    const next = { ...draftFilters, period };
    setDraftFilters(next);
    setAppliedFilters(next);
  };

  const kpis = useMemo(() => {
    const snapshot = bundle?.kpis;
    return [
      {
        label: "Beneficiaries Served",
        value: displayValue(loading, snapshot?.beneficiariesServed),
        icon: HandHeart,
      },
      {
        label: "Active Programs",
        value: displayValue(loading, snapshot?.activePrograms),
        icon: Target,
      },
      {
        label: "Programs On Target",
        value: displayValue(loading, snapshot?.programsOnTarget),
        icon: TrendingUp,
      },
      {
        label: "Active Campaigns",
        value: displayValue(loading, snapshot?.activeCampaigns),
        icon: Megaphone,
      },
      {
        label: "Funds Raised",
        value: displayValue(loading, snapshot?.fundsRaised, formatAnalyticsCurrency),
        icon: CircleDollarSign,
      },
      {
        label: "Funds Deployed",
        value: displayValue(loading, snapshot?.fundsDeployed, formatAnalyticsCurrency),
        icon: BarChart3,
      },
      {
        label: "Volunteer Hours",
        value: displayValue(loading, snapshot?.volunteerHours),
        icon: Users,
      },
      {
        label: "Cost Per Beneficiary",
        value:
          loading
            ? "—"
            : snapshot?.costPerBeneficiary == null
              ? "—"
              : formatAnalyticsCurrency(snapshot.costPerBeneficiary),
        icon: HeartHandshake,
      },
      {
        label: "Goal Achievement Rate",
        value:
          loading
            ? "—"
            : snapshot?.goalAchievementRate == null
              ? "—"
              : `${snapshot.goalAchievementRate}%`,
        icon: Target,
      },
      {
        label: "Geographic Reach",
        value: displayValue(loading, snapshot?.geographicReach),
        icon: Globe2,
      },
    ];
  }, [bundle, loading]);

  const sortedPrograms = useMemo(() => {
    const rows = [...(bundle?.programs ?? [])];
    const filtered =
      programHealthFilter === "all"
        ? rows
        : rows.filter((row) => row.health === programHealthFilter);

    const healthRank: Record<ProgramHealth, number> = {
      Critical: 0,
      "Needs Attention": 1,
      "On Track": 2,
      Completed: 3,
    };

    filtered.sort((a, b) => {
      if (programSort === "name") return a.name.localeCompare(b.name);
      if (programSort === "health") {
        return healthRank[a.health] - healthRank[b.health] || a.name.localeCompare(b.name);
      }
      return b.progress - a.progress || a.name.localeCompare(b.name);
    });
    return filtered;
  }, [bundle?.programs, programHealthFilter, programSort]);

  const mapLocations: GeographicLocation[] = useMemo(
    () =>
      (bundle?.geography.locations ?? []).map((location) => ({
        id: location.id,
        name: location.name,
        country: location.country,
        x: location.x,
        y: location.y,
        activePrograms: location.activePrograms,
        beneficiaries: location.beneficiaries,
        impactLevel: location.impactLevel,
        lon: location.lon,
        lat: location.lat,
      })),
    [bundle?.geography.locations],
  );

  const hasAnyOrgData = useMemo(() => {
    if (!bundle) return false;
    return (
      bundle.kpis.beneficiariesServed > 0 ||
      bundle.kpis.activePrograms > 0 ||
      bundle.kpis.activeCampaigns > 0 ||
      bundle.kpis.fundsRaised > 0 ||
      bundle.kpis.volunteerHours > 0 ||
      bundle.programs.length > 0
    );
  }, [bundle]);

  return (
    <div className="hb-app ia-page">
      <HopeBridgeSidebar activePath="/dashboard/analytics" />

      <main className="hb-module-main">
        <div className="mx-auto max-w-[1680px] space-y-6 pb-10">
          <nav className="flex items-center gap-2 text-sm text-[#607269]">
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 hover:text-[#0d5f44]">
              <Home size={14} className="text-[#0d5f44]" />
              HopeBridge Foundation
            </Link>
            <span>/</span>
            <strong className="text-[#112e24]">Impact Analytics</strong>
          </nav>

          <header className="ia-hero">
            <p className="ia-hero-kicker">IMPACT INTELLIGENCE WORKSPACE</p>
            <h1>
              Nonprofit Impact <em className="not-italic text-[#efd062]">Analytics</em>
            </h1>
            <p>
              Measure beneficiaries served, program performance, funding efficiency,
              volunteer contribution, and geographic reach using live HopeBridge
              operational data.
            </p>
            <div className="ia-hero-actions">
              <button type="button" className="ia-gold-btn" onClick={() => router.push("/dashboard/programs")}>
                <Target size={15} /> View Programs
              </button>
              <button type="button" className="ia-secondary-btn" onClick={() => router.push("/dashboard/beneficiaries")}>
                <HandHeart size={15} /> View Beneficiaries
              </button>
              <button type="button" className="ia-secondary-btn" onClick={() => router.push("/dashboard/volunteers")}>
                <UsersRound size={15} /> View Volunteers
              </button>
              <button type="button" className="ia-secondary-btn" onClick={() => router.push("/dashboard/campaigns")}>
                <Megaphone size={15} /> Review Campaigns
              </button>
              <button
                type="button"
                className="ia-secondary-btn"
                onClick={() => setRefreshToken((token) => token + 1)}
                aria-label="Refresh analytics"
              >
                <RefreshCw size={15} /> Refresh
              </button>
            </div>
          </header>

          {error ? (
            <div className="ia-panel p-6 text-center text-sm text-[#8b3a3a]">{error}</div>
          ) : null}

          {/* Filters */}
          <section className="ia-panel" aria-label="Analytics filters">
            <div className="ia-panel-header">
              <div>
                <p className="ia-kicker">FILTERS</p>
                <h2>Refine Impact View</h2>
                <p>Filters update KPIs, program performance, trends, and risk panels.</p>
              </div>
              <div className="ia-period-tabs" role="tablist" aria-label="Date range">
                {PERIOD_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    role="tab"
                    aria-selected={draftFilters.period === option.id}
                    className={draftFilters.period === option.id ? "is-active" : ""}
                    onClick={() => setPeriod(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="ia-filters">
              <div className="ia-field">
                <label htmlFor="ia-program">Program</label>
                <select
                  id="ia-program"
                  value={draftFilters.programId}
                  onChange={(e) =>
                    setDraftFilters((current) => ({
                      ...current,
                      programId: e.target.value,
                    }))
                  }
                >
                  <option value="all">All programs</option>
                  {(bundle?.filterOptions.programs ?? []).map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ia-field">
                <label htmlFor="ia-campaign">Campaign</label>
                <select
                  id="ia-campaign"
                  value={draftFilters.campaignId}
                  onChange={(e) =>
                    setDraftFilters((current) => ({
                      ...current,
                      campaignId: e.target.value,
                    }))
                  }
                >
                  <option value="all">All campaigns</option>
                  {(bundle?.filterOptions.campaigns ?? []).map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ia-field">
                <label htmlFor="ia-category">Program Category</label>
                <select
                  id="ia-category"
                  value={draftFilters.category}
                  onChange={(e) =>
                    setDraftFilters((current) => ({
                      ...current,
                      category: e.target.value,
                    }))
                  }
                >
                  <option value="all">All categories</option>
                  {(bundle?.filterOptions.categories ?? []).map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ia-field">
                <label htmlFor="ia-status">Status</label>
                <select
                  id="ia-status"
                  value={draftFilters.status}
                  onChange={(e) =>
                    setDraftFilters((current) => ({
                      ...current,
                      status: e.target.value,
                    }))
                  }
                >
                  <option value="all">All statuses</option>
                  {(bundle?.filterOptions.statuses ?? []).map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ia-field">
                <label htmlFor="ia-location">Geographic Location</label>
                <select
                  id="ia-location"
                  value={draftFilters.location}
                  onChange={(e) =>
                    setDraftFilters((current) => ({
                      ...current,
                      location: e.target.value,
                    }))
                  }
                >
                  <option value="all">All locations</option>
                  {(bundle?.filterOptions.locations ?? []).map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ia-field">
                <label htmlFor="ia-date-range">Date Range</label>
                <select
                  id="ia-date-range"
                  value={draftFilters.period}
                  onChange={(e) =>
                    setDraftFilters((current) => ({
                      ...current,
                      period: e.target.value as AnalyticsPeriodId,
                    }))
                  }
                >
                  {PERIOD_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="ia-filter-actions">
              <button type="button" className="ia-gold-btn" onClick={applyFilters}>
                <Filter size={15} /> Apply Filters
              </button>
              <button type="button" className="ia-ghost-btn" onClick={resetFilters}>
                <RotateCcw size={15} /> Reset Filters
              </button>
            </div>
          </section>

          {!loading && !hasAnyOrgData ? (
            <AnalyticsEmptyState
              title="No analytics available yet"
              description="Impact analytics will appear as campaigns, programs, beneficiaries, donors, and volunteers are recorded across HopeBridge."
              actionHref="/dashboard/programs"
              actionLabel="Create Program"
              icon={BarChart3}
            />
          ) : (
            <>
              {/* Executive Impact Overview */}
              <section aria-label="Executive impact overview">
                <div className="mb-4">
                  <p className="ia-kicker">EXECUTIVE IMPACT OVERVIEW</p>
                  <h2 className="mt-1 font-serif text-2xl font-bold text-[#112e24]">
                    Organization Scorecard
                  </h2>
                </div>
                <div className="ia-kpi-grid">
                  {kpis.map((kpi) => {
                    const Icon = kpi.icon;
                    return (
                      <article key={kpi.label} className="ia-kpi">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="ia-kpi-label">{kpi.label}</p>
                            <p className="ia-kpi-value">{kpi.value}</p>
                          </div>
                          <div className="ia-kpi-icon">
                            <Icon size={18} />
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>

              {/* Impact Over Time */}
              <section className="ia-panel" aria-label="Impact over time">
                <div className="ia-panel-header">
                  <div>
                    <p className="ia-kicker">IMPACT OVER TIME</p>
                    <h2>Organization Trend</h2>
                    <p>
                      Beneficiaries enrolled, funds raised, and volunteer activity across
                      the selected period.
                    </p>
                  </div>
                </div>
                {!loading && bundle && !bundle.trendHasHistory ? (
                  <AnalyticsEmptyState
                    title="No historical trend data yet"
                    description="No beneficiary enrollments, donations, or volunteer activity dates were found in this period. Record dated outcomes to begin measuring growth."
                    actionHref="/dashboard/beneficiaries"
                    actionLabel="View Beneficiaries"
                    icon={TrendingUp}
                  />
                ) : (
                  <div className="ia-chart-wrap">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={bundle?.trend ?? []}>
                        <defs>
                          <linearGradient id="iaBeneficiaries" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0d5f44" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#0d5f44" stopOpacity={0.02} />
                          </linearGradient>
                          <linearGradient id="iaFunds" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#d4af37" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#d4af37" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#efe8da" strokeDasharray="3 3" />
                        <XAxis dataKey="label" tick={{ fill: "#607269", fontSize: 12 }} />
                        <YAxis tick={{ fill: "#607269", fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            borderRadius: 12,
                            border: "1px solid #ebe3d2",
                            background: "#fff",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="beneficiaries"
                          name="Beneficiaries"
                          stroke="#0d5f44"
                          fill="url(#iaBeneficiaries)"
                          strokeWidth={2}
                        />
                        <Area
                          type="monotone"
                          dataKey="fundsRaised"
                          name="Funds Raised"
                          stroke="#d4af37"
                          fill="url(#iaFunds)"
                          strokeWidth={2}
                        />
                        <Area
                          type="monotone"
                          dataKey="volunteerHours"
                          name="Volunteer Activity"
                          stroke="#6b8f71"
                          fill="transparent"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </section>

              {/* Program Performance */}
              <section className="ia-panel" aria-label="Program performance">
                <div className="ia-panel-header">
                  <div>
                    <p className="ia-kicker">PROGRAM PERFORMANCE</p>
                    <h2>Comparative Program Health</h2>
                    <p>
                      Progress, beneficiaries, budget deployment, and health status by
                      program.
                    </p>
                  </div>
                </div>

                <div className="ia-chip-row">
                  {(["all", "On Track", "Needs Attention", "Critical", "Completed"] as const).map(
                    (value) => (
                      <button
                        key={value}
                        type="button"
                        className={`ia-chip ${programHealthFilter === value ? "is-active" : ""}`}
                        onClick={() => setProgramHealthFilter(value)}
                      >
                        {value === "all" ? "All Health" : value}
                      </button>
                    ),
                  )}
                  <button
                    type="button"
                    className={`ia-chip ${programSort === "progress" ? "is-active" : ""}`}
                    onClick={() => setProgramSort("progress")}
                  >
                    Sort: Progress
                  </button>
                  <button
                    type="button"
                    className={`ia-chip ${programSort === "health" ? "is-active" : ""}`}
                    onClick={() => setProgramSort("health")}
                  >
                    Sort: Health
                  </button>
                  <button
                    type="button"
                    className={`ia-chip ${programSort === "name" ? "is-active" : ""}`}
                    onClick={() => setProgramSort("name")}
                  >
                    Sort: Name
                  </button>
                </div>

                {sortedPrograms.length === 0 ? (
                  <AnalyticsEmptyState
                    title="No programs match this view"
                    description="Create programs or adjust filters to compare performance, beneficiary reach, and budget deployment."
                    actionHref="/dashboard/programs"
                    actionLabel="View Programs"
                    icon={Target}
                  />
                ) : (
                  <div className="ia-table-wrap">
                    <table className="ia-table">
                      <thead>
                        <tr>
                          <th>Program</th>
                          <th>Status</th>
                          <th>Progress</th>
                          <th>Beneficiaries</th>
                          <th>Budget</th>
                          <th>Funds Deployed</th>
                          <th>Goal Achievement</th>
                          <th>Health</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedPrograms.map((program: ProgramPerformanceRow) => (
                          <tr key={program.id}>
                            <td>
                              <div className="font-semibold">{program.name}</div>
                              <div className="text-xs text-[#607269]">
                                {program.category}
                                {program.location ? ` · ${program.location}` : ""}
                              </div>
                            </td>
                            <td>{program.status}</td>
                            <td style={{ minWidth: 120 }}>
                              <div className="mb-1 text-xs font-semibold text-[#0d5f44]">
                                {program.progress}%
                              </div>
                              <div className="ia-progress">
                                <span style={{ width: `${program.progress}%` }} />
                              </div>
                            </td>
                            <td>
                              {formatAnalyticsNumber(program.beneficiariesReached)}
                              <div className="text-xs text-[#607269]">
                                {program.beneficiaryTarget == null
                                  ? "No separate target field"
                                  : `Target ${formatAnalyticsNumber(program.beneficiaryTarget)}`}
                              </div>
                            </td>
                            <td>{formatAnalyticsCurrency(program.budget)}</td>
                            <td>{formatAnalyticsCurrency(program.fundsDeployed)}</td>
                            <td>
                              {program.goalAchievement == null
                                ? "—"
                                : `${program.goalAchievement}%`}
                            </td>
                            <td>
                              <span className={healthClass(program.health)}>
                                {program.health}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="ia-link-btn"
                                onClick={() => router.push("/dashboard/programs")}
                              >
                                View Program
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <div className="ia-grid-2">
                {/* Beneficiary Outcomes */}
                <section className="ia-panel" aria-label="Beneficiary outcomes">
                  <div className="ia-panel-header">
                    <div>
                      <p className="ia-kicker">BENEFICIARY OUTCOMES</p>
                      <h2>People Impact</h2>
                      <p>Reach and growth from beneficiary records.</p>
                    </div>
                    <button
                      type="button"
                      className="ia-ghost-btn"
                      onClick={() => router.push("/dashboard/beneficiaries")}
                    >
                      View Beneficiaries
                    </button>
                  </div>

                  <div className="grid gap-3 px-[22px] pt-4 sm:grid-cols-2">
                    <div className="ia-stat-row">
                      <span>Total Beneficiaries</span>
                      <strong>
                        {displayValue(loading, bundle?.beneficiaries.total)}
                      </strong>
                    </div>
                    <div className="ia-stat-row">
                      <span>New Beneficiaries</span>
                      <strong>
                        {displayValue(loading, bundle?.beneficiaries.newInPeriod)}
                      </strong>
                    </div>
                    <div className="ia-stat-row">
                      <span>Communities Reached</span>
                      <strong>
                        {displayValue(loading, bundle?.beneficiaries.communitiesReached)}
                      </strong>
                    </div>
                    <div className="ia-stat-row">
                      <span>Children / Women / Families</span>
                      <strong>—</strong>
                    </div>
                  </div>

                  <AnalyticsEmptyState
                    title="Demographic breakdown unavailable"
                    description="Children reached, women impacted, and families supported are not stored on beneficiary records yet. Totals above use actual enrollments and locations only."
                    icon={Users}
                  />

                  {(bundle?.beneficiaries.byProgram.length ?? 0) > 0 ? (
                    <div className="ia-stat-list">
                      <p className="px-1 text-xs font-bold uppercase tracking-[0.08em] text-[#9f7b24]">
                        Beneficiaries by Program
                      </p>
                      {bundle!.beneficiaries.byProgram.slice(0, 8).map((row) => (
                        <div key={row.program} className="ia-stat-row">
                          <span>{row.program}</span>
                          <strong>{formatAnalyticsNumber(row.count)}</strong>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {(bundle?.beneficiaries.growthTrend.some((p) => p.count > 0) ?? false) ? (
                    <div className="ia-chart-wrap">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={bundle?.beneficiaries.growthTrend ?? []}>
                          <CartesianGrid stroke="#efe8da" strokeDasharray="3 3" />
                          <XAxis dataKey="label" tick={{ fill: "#607269", fontSize: 12 }} />
                          <YAxis tick={{ fill: "#607269", fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="count" name="New Beneficiaries" fill="#0d5f44" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <AnalyticsEmptyState
                      title="No beneficiary trend data yet"
                      description="Create programs and record beneficiary enrollment dates to begin measuring growth over time."
                      actionHref="/dashboard/beneficiaries"
                      actionLabel="View Beneficiaries"
                    />
                  )}
                </section>

                {/* Funding vs Impact */}
                <section className="ia-panel" aria-label="Funding versus impact">
                  <div className="ia-panel-header">
                    <div>
                      <p className="ia-kicker">FUNDING VS IMPACT</p>
                      <h2>Efficiency Analysis</h2>
                      <p>Compare funds raised, deployment, and cost per beneficiary.</p>
                    </div>
                    <button
                      type="button"
                      className="ia-ghost-btn"
                      onClick={() => router.push("/dashboard/campaigns")}
                    >
                      Review Campaigns
                    </button>
                  </div>

                  {bundle &&
                  bundle.funding.fundsRaised === 0 &&
                  bundle.funding.fundsDeployed === 0 ? (
                    <AnalyticsEmptyState
                      title="No funding or deployment data yet"
                      description="Record donations or campaign totals and program spend to evaluate whether fundraising is translating into impact."
                      actionHref="/dashboard/donors"
                      actionLabel="View Donors"
                      icon={CircleDollarSign}
                    />
                  ) : (
                    <>
                      <div className="ia-stat-list">
                        <div className="ia-stat-row">
                          <span>Funds Raised</span>
                          <strong>
                            {formatAnalyticsCurrency(bundle?.funding.fundsRaised ?? 0)}
                          </strong>
                        </div>
                        <div className="ia-stat-row">
                          <span>Funds Deployed</span>
                          <strong>
                            {formatAnalyticsCurrency(bundle?.funding.fundsDeployed ?? 0)}
                          </strong>
                        </div>
                        <div className="ia-stat-row">
                          <span>Deployment Rate</span>
                          <strong>
                            {bundle?.funding.deploymentRate == null
                              ? "—"
                              : `${bundle.funding.deploymentRate}%`}
                          </strong>
                        </div>
                        <div className="ia-stat-row">
                          <span>Cost Per Beneficiary</span>
                          <strong>
                            {bundle?.funding.costPerBeneficiary == null
                              ? "—"
                              : formatAnalyticsCurrency(bundle.funding.costPerBeneficiary)}
                          </strong>
                        </div>
                      </div>

                      {(bundle?.funding.byProgram.length ?? 0) > 0 ? (
                        <div className="ia-chart-wrap">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={(bundle?.funding.byProgram ?? []).slice(0, 6)}
                              layout="vertical"
                              margin={{ left: 24, right: 12 }}
                            >
                              <CartesianGrid stroke="#efe8da" strokeDasharray="3 3" />
                              <XAxis type="number" tick={{ fill: "#607269", fontSize: 12 }} />
                              <YAxis
                                type="category"
                                dataKey="name"
                                width={110}
                                tick={{ fill: "#607269", fontSize: 11 }}
                              />
                              <Tooltip />
                              <Bar dataKey="spent" name="Funds Deployed" fill="#d4af37" radius={[0, 8, 8, 0]} />
                              <Bar dataKey="beneficiaries" name="Beneficiaries" fill="#0d5f44" radius={[0, 8, 8, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : null}
                    </>
                  )}
                </section>
              </div>

              <div className="ia-grid-2">
                {/* Volunteer Contribution */}
                <section className="ia-panel" aria-label="Volunteer contribution">
                  <div className="ia-panel-header">
                    <div>
                      <p className="ia-kicker">VOLUNTEER CONTRIBUTION</p>
                      <h2>Volunteer Impact</h2>
                      <p>Active volunteers, hours, and initiative participation.</p>
                    </div>
                    <button
                      type="button"
                      className="ia-ghost-btn"
                      onClick={() => router.push("/dashboard/volunteers")}
                    >
                      View Volunteers
                    </button>
                  </div>

                  <div className="ia-stat-list">
                    <div className="ia-stat-row">
                      <span>Active Volunteers</span>
                      <strong>
                        {displayValue(loading, bundle?.volunteers.activeVolunteers)}
                      </strong>
                    </div>
                    <div className="ia-stat-row">
                      <span>Volunteer Hours</span>
                      <strong>
                        {displayValue(loading, bundle?.volunteers.totalHours)}
                      </strong>
                    </div>
                    <div className="ia-stat-row">
                      <span>Volunteer Activities Logged</span>
                      <strong>
                        {displayValue(loading, bundle?.volunteers.activitiesLogged)}
                      </strong>
                    </div>
                  </div>

                  {!loading && bundle && !bundle.volunteers.hoursTracked ? (
                    <AnalyticsEmptyState
                      title="Volunteer hours not recorded yet"
                      description="Volunteers may be registered, but hour totals are empty. Update volunteer records with hours to measure contribution."
                      actionHref="/dashboard/volunteers"
                      actionLabel="View Volunteers"
                      icon={UsersRound}
                    />
                  ) : null}

                  {(bundle?.volunteers.byProgram.length ?? 0) > 0 ? (
                    <div className="ia-stat-list">
                      <p className="px-1 text-xs font-bold uppercase tracking-[0.08em] text-[#9f7b24]">
                        Contribution by Program / Initiative
                      </p>
                      {bundle!.volunteers.byProgram.slice(0, 8).map((row) => (
                        <div key={row.program} className="ia-stat-row">
                          <span>
                            {row.program}
                            <div className="text-xs font-normal text-[#607269]">
                              {row.volunteers} volunteer{row.volunteers === 1 ? "" : "s"}
                            </div>
                          </span>
                          <strong>{formatAnalyticsNumber(row.hours)} hrs</strong>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <AnalyticsEmptyState
                      title="No volunteer participation yet"
                      description="Add volunteers and assign initiatives to see contribution by program."
                      actionHref="/dashboard/volunteers"
                      actionLabel="View Volunteers"
                    />
                  )}
                </section>

                {/* Geographic Impact */}
                <section className="ia-panel" aria-label="Geographic impact">
                  <div className="ia-panel-header">
                    <div>
                      <p className="ia-kicker">GEOGRAPHIC IMPACT</p>
                      <h2>Reach by Location</h2>
                      <p>
                        Countries {bundle?.geography.countries ?? 0} · Regions{" "}
                        {bundle?.geography.regions ?? 0} · Communities{" "}
                        {bundle?.geography.communities ?? 0}
                      </p>
                    </div>
                  </div>

                  {mapLocations.length === 0 ? (
                    <AnalyticsEmptyState
                      title="No geographic reach data yet"
                      description="Add location fields on programs and beneficiaries to map communities served."
                      actionHref="/dashboard/programs"
                      actionLabel="View Programs"
                      icon={MapPin}
                    />
                  ) : (
                    <>
                      <div className="ia-map-panel">
                        <GeographicReachMap
                          locations={mapLocations}
                          hoveredId={hoveredLocationId}
                          onHover={(location) =>
                            setHoveredLocationId(location?.id ?? null)
                          }
                        />
                      </div>
                      <div className="ia-stat-list">
                        {mapLocations.slice(0, 6).map((location) => (
                          <div key={location.id} className="ia-stat-row">
                            <span>
                              {location.name}
                              <div className="text-xs font-normal text-[#607269]">
                                {location.activePrograms} program
                                {location.activePrograms === 1 ? "" : "s"}
                              </div>
                            </span>
                            <strong>
                              {formatAnalyticsNumber(location.beneficiaries)} people
                            </strong>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </section>
              </div>

              {/* Impact Distribution */}
              <section className="ia-panel" aria-label="Impact distribution">
                <div className="ia-panel-header">
                  <div>
                    <p className="ia-kicker">IMPACT DISTRIBUTION</p>
                    <h2>Categories in Your Portfolio</h2>
                    <p>
                      Distribution uses your existing program categories only — no
                      invented taxonomy.
                    </p>
                  </div>
                </div>

                {(bundle?.distribution.length ?? 0) === 0 ? (
                  <AnalyticsEmptyState
                    title="No category distribution yet"
                    description="Create programs with categories such as Education, Healthcare, Community, or Environment to populate this view."
                    actionHref="/dashboard/programs"
                    actionLabel="View Programs"
                  />
                ) : (
                  <div className="ia-grid-2 px-[22px] pb-5">
                    <div className="ia-chart-wrap">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={bundle?.distribution ?? []}
                            dataKey="percent"
                            nameKey="category"
                            innerRadius={55}
                            outerRadius={95}
                            paddingAngle={3}
                          >
                            {(bundle?.distribution ?? []).map((slice) => (
                              <Cell key={slice.category} fill={slice.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="ia-stat-list !pt-4">
                      {(bundle?.distribution ?? []).map((slice) => (
                        <div key={slice.category} className="ia-stat-row">
                          <span className="inline-flex items-center gap-2">
                            <i
                              className="inline-block h-2.5 w-2.5 rounded-full"
                              style={{ background: slice.color }}
                            />
                            {slice.category}
                            <span className="text-xs font-normal">
                              · {slice.programs} program{slice.programs === 1 ? "" : "s"}
                            </span>
                          </span>
                          <strong>
                            {slice.percent}% · {formatAnalyticsNumber(slice.beneficiaries)}
                          </strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* Risk & Attention */}
              <section className="ia-panel" aria-label="Risk and attention">
                <div className="ia-panel-header">
                  <div>
                    <p className="ia-kicker">RISK & ATTENTION</p>
                    <h2>Leadership Alerts</h2>
                    <p>
                      Calculated from program schedules, campaign goals, budgets, and
                      beneficiary follow-ups.
                    </p>
                  </div>
                </div>

                {(bundle?.risks.length ?? 0) === 0 ? (
                  <AnalyticsEmptyState
                    title="No attention items right now"
                    description="Programs and campaigns currently show no behind-schedule, under-goal, or budget-pressure signals based on available records."
                    icon={AlertTriangle}
                  />
                ) : (
                  <div className="ia-risk">
                    {bundle!.risks.map((risk) => (
                      <article key={risk.id} className="ia-risk-item">
                        <div>
                          <span className={`ia-severity ${risk.severity}`}>
                            {risk.severity}
                          </span>
                          <h3 className="mt-2">{risk.title}</h3>
                          <p>{risk.detail}</p>
                        </div>
                        <button
                          type="button"
                          className="ia-ghost-btn"
                          onClick={() => router.push(risk.href)}
                        >
                          {risk.actionLabel}
                        </button>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              {/* Impact Insights */}
              <section className="ia-panel" aria-label="Impact insights">
                <div className="ia-panel-header">
                  <div>
                    <p className="ia-kicker">IMPACT INSIGHTS</p>
                    <h2>Data-Driven Observations</h2>
                    <p>
                      Rule-based insights from live records — not generative AI.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="ia-ghost-btn"
                    onClick={() => {
                      document
                        .querySelector('[aria-label="Program performance"]')
                        ?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                  >
                    View Detailed Analytics
                  </button>
                </div>

                {(bundle?.insights.length ?? 0) === 0 ? (
                  <AnalyticsEmptyState
                    title="Insights will appear as data grows"
                    description="Add programs, beneficiaries, campaigns, and volunteers to unlock portfolio observations."
                  />
                ) : (
                  <div className="ia-insight-grid">
                    {bundle!.insights.map((insight) => (
                      <article key={insight.id} className={`ia-insight ${insight.tone}`}>
                        <h3>{insight.title}</h3>
                        <p>{insight.description}</p>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
