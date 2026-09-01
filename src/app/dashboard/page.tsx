"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "../../services/dashboardMetrics";
import { formatActivityTime } from "../../services/activity";
import type { AttentionItem, OrganizationSnapshot } from "@/services/organizationMetrics";
import {
  buildChartPaths,
  fetchDashboardOrganizationData,
  type DashboardInsight,
  type FundraisingPerformance,
  type UpcomingDeadline,
} from "@/services/organizationSnapshot";
import { searchOrganizationRecords, type SearchResult } from "@/services/dashboardData";
import type { DashboardNotification } from "@/services/notifications";
import { useAuth } from "@/providers/AuthProvider";
import type { ActivityRecord } from "../../types/activity";
import {
  LogOut,
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  BrainCircuit,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  FileBarChart,
  HandHeart,
  Handshake,
  Heart,
  Home,
  LayoutDashboard,
  Leaf,
  Megaphone,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  Users,
  HelpCircle,
  X,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

const groups: { title: string; items: NavItem[] }[] = [
  {
    title: "FOUNDATION",
    items: [
      { label: "Mission & Vision", href: "/dashboard/mission-vision", icon: Target },
      { label: "Campaigns", href: "/dashboard/campaigns", icon: Megaphone },
      { label: "Programs", href: "/dashboard/programs", icon: BarChart3 },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      { label: "Donors", href: "/dashboard/donors", icon: CircleDollarSign },
      { label: "Volunteers", href: "/dashboard/volunteers", icon: Users },
      { label: "Beneficiaries", href: "/dashboard/beneficiaries", icon: HandHeart },
      { label: "Teams", href: "/dashboard/teams", icon: UserRound },
    ],
  },
  {
    title: "INTELLIGENCE",
    items: [
      { label: "Impact Analytics", href: "/dashboard/analytics", icon: BarChart3 },
      { label: "AI Assistant", href: "/dashboard/ai-assistant", icon: BrainCircuit },
      { label: "Reports", href: "/dashboard/reports", icon: FileBarChart },
      { label: "Calendar", href: "/dashboard/calendar", icon: CalendarDays },
    ],
  },
  {
    title: "ADMINISTRATION",
    items: [
      { label: "Organization", href: "/dashboard/organization", icon: Home },
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
      { label: "Help", href: "/dashboard/help", icon: HelpCircle },
    ],
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [fundraising, setFundraising] = useState<FundraisingPerformance | null>(null);
  const [insights, setInsights] = useState<DashboardInsight[]>([]);
  const [orgSnapshot, setOrgSnapshot] = useState<OrganizationSnapshot | null>(null);
  const [recentActivities, setRecentActivities] = useState<ActivityRecord[]>([]);
  const [deadlines, setDeadlines] = useState<UpcomingDeadline[]>([]);
  const [attentionItems, setAttentionItems] = useState<AttentionItem[]>([]);
  const [liveModuleCount, setLiveModuleCount] = useState(0);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const userRole =
    (user?.email?.includes("@") && user.email.split("@")[1]) ||
    "Foundation Administrator";

  const loadDashboardData = useCallback(async () => {
    setMetricsLoading(true);
    setLoadError(null);
    try {
      const data = await fetchDashboardOrganizationData();
      setOrgSnapshot(data.snapshot);
      setRecentActivities(data.recentActivities);
      setDeadlines(data.upcomingDeadlines);
      setAttentionItems(data.attentionItems);
      setFundraising(data.fundraising);
      setInsights(data.insights);
      setNotifications(data.notifications);
      setLiveModuleCount(data.liveModuleCount);
      if (data.cleanupReport?.ran) {
        console.info("[HopeBridge] Demo cleanup ran:", data.cleanupReport.deleted);
      }
    } catch (error) {
      console.error("Unable to load dashboard data.", error);
      setLoadError("Unable to load organization data.");
      setOrgSnapshot(null);
      setRecentActivities([]);
      setDeadlines([]);
      setAttentionItems([]);
      setFundraising(null);
      setInsights([]);
      setNotifications([]);
      setLiveModuleCount(0);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    const onFocus = () => {
      loadDashboardData();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadDashboardData]);

  const displayName =
    user?.displayName?.trim() ||
    user?.email?.split("@")[0] ||
    "Foundation Admin";
  const avatarInitial = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    const q = search.trim();
    if (!q) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const results = await searchOrganizationRecords(q);
        setSearchResults(results);
      } catch (error) {
        console.error("Search failed.", error);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [search]);

  const goalProgress = useMemo(() => {
    if (fundraising) return fundraising.goalProgress;
    if (!orgSnapshot || orgSnapshot.totalCampaignGoal <= 0) return 0;
    return Math.min(
      100,
      Math.round(
        (orgSnapshot.fundsRaised / orgSnapshot.totalCampaignGoal) * 100,
      ),
    );
  }, [orgSnapshot, fundraising]);

  const metrics = useMemo(() => {
    const m = orgSnapshot;
    const fundsDetail =
      m && m.totalCampaignGoal > 0
        ? `${goalProgress}% of campaign goals`
        : "Across all campaigns";
    const volunteerDetail =
      m && m.volunteerCount > 0
        ? m.volunteerHours > 0
          ? `${m.volunteerHours.toLocaleString()} hours contributed`
          : "Registered volunteers"
        : "No volunteers yet";

    return [
      {
        title: "Active Campaigns",
        value: metricsLoading ? "—" : String(m?.activeCampaigns ?? 0),
        detail: m?.activeCampaigns ? "Live fundraising initiatives" : "No active campaigns yet",
        sub: "Fundraising initiatives",
        icon: Megaphone,
        tone: "gold",
        href: "/dashboard/campaigns",
      },
      {
        title: "Active Programs",
        value: metricsLoading ? "—" : String(m?.activePrograms ?? 0),
        detail: m?.activePrograms ? "Service delivery programs" : "No active programs yet",
        sub: "Community initiatives",
        icon: Target,
        tone: "green",
        href: "/dashboard/programs",
      },
      {
        title: "Funds Raised",
        value: metricsLoading ? "—" : formatCurrency(m?.fundsRaised ?? 0),
        detail: fundsDetail,
        sub: "Across all campaigns",
        icon: CircleDollarSign,
        tone: "emerald",
        href: "/dashboard/analytics",
      },
      {
        title: "Beneficiaries",
        value: metricsLoading ? "—" : String(m?.beneficiaryCount ?? 0),
        detail: m?.beneficiaryCount ? "People receiving services" : "No beneficiaries yet",
        sub: "People impacted",
        icon: HandHeart,
        tone: "pink",
        href: "/dashboard/beneficiaries",
      },
      {
        title: "Active Donors",
        value: metricsLoading ? "—" : String(m?.activeDonors ?? 0),
        detail: m?.activeDonors ? "Supporting our mission" : "No donors yet",
        sub: "Supporting our mission",
        icon: Handshake,
        tone: "gold",
        href: "/dashboard/donors",
      },
      {
        title: "Volunteers",
        value: metricsLoading ? "—" : String(m?.volunteerCount ?? 0),
        detail: volunteerDetail,
        sub: "Active volunteer profiles",
        icon: Users,
        tone: "blue",
        href: "/dashboard/volunteers",
      },
    ];
  }, [orgSnapshot, metricsLoading, goalProgress]);

  const chartPoints = fundraising?.monthlyHistory ?? [];
  const hasChartData = fundraising?.displayMode === "chart";
  const performanceSummary = fundraising?.summaryMessage ?? "";

  const chartPaths = useMemo(
    () => buildChartPaths(chartPoints, 720, 245),
    [chartPoints],
  );

  const goalLabel =
    orgSnapshot && orgSnapshot.totalCampaignGoal > 0
      ? `${goalProgress}%`
      : "No goal data";

  const go = (href: string) => {
    setMobileOpen(false);
    setSearch("");
    setSearchResults([]);
    setProfileOpen(false);
    setNotifOpen(false);
    router.push(href);
  };

  const handleSignOut = async () => {
    setProfileOpen(false);
    await logout();
    router.push("/auth/login");
  };

  const Sidebar = () => (
    <>
      <div className="hb-brand">
        <div className="hb-logo">
          <Handshake size={30} strokeWidth={1.8} />
          <span className="hb-logo-shine" />
        </div>
        <div>
          <div className="hb-brand-name">HOPEBRIDGE</div>
          <div className="hb-brand-sub">FOUNDATION</div>
          <div className="hb-brand-tag">Foundation Intelligence</div>
        </div>
        <button className="hb-mobile-close" onClick={() => setMobileOpen(false)} type="button">
          <X size={19} />
        </button>
      </div>

      <div className="hb-side-divider" />

      <button className="hb-dashboard-active" onClick={() => go("/dashboard")} type="button">
        <span className="hb-active-icon"><LayoutDashboard size={20} /></span>
        <span>Dashboard</span>
        <span className="hb-active-spark" />
      </button>

      <div className="hb-nav-scroll">
        {groups.map((group) => (
          <div className="hb-nav-group" key={group.title}>
            <div className="hb-nav-title">{group.title}</div>
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.href} type="button" className="hb-nav-item" onClick={() => go(item.href)}>
                  <span className="hb-nav-icon"><Icon size={16} /></span>
                  <span>{item.label}</span>
                  <ChevronRight size={14} className="hb-nav-arrow" />
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="hb-side-bottom">
        <button type="button" className="hb-ai-side" onClick={() => go("/dashboard/ai-assistant")}>
          <span className="hb-ai-side-icon"><BrainCircuit size={22} /></span>
          <span>
            <strong>HopeBridge AI</strong>
            <small>Grounded insights available</small>
          </span>
          <i />
        </button>
        <div className="hb-motto">Together We Create Impact</div>
      </div>
    </>
  );

  return (
    <>
      <div className="hb-app">
        <aside className="hb-sidebar desktop"><Sidebar /></aside>

        {mobileOpen && (
          <div className="hb-mobile-layer">
            <button className="hb-mobile-overlay" onClick={() => setMobileOpen(false)} type="button" aria-label="Close menu" />
            <aside className="hb-sidebar mobile"><Sidebar /></aside>
          </div>
        )}

        <main className="hb-main">
          <header className="hb-topbar">
            <div className="hb-breadcrumbs">
              <button type="button" className="hb-menu-btn" onClick={() => setMobileOpen(true)}>
                <Menu size={19} />
              </button>
              <Home size={16} className="hb-home-icon" />
              <span>HopeBridge Foundation</span>
              <b>/</b>
              <strong>Dashboard</strong>
            </div>

            <div className="hb-top-actions">
              <div className="hb-search">
                <Search size={17} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search campaigns, programs, donors..."
                  aria-label="Search organization records"
                />
                {search && (
                  <button type="button" onClick={() => setSearch("")}>
                    <X size={14} />
                  </button>
                )}
                {search && (
                  <div className="hb-search-results">
                    {searchLoading ? (
                      <div className="hb-empty">Searching…</div>
                    ) : searchResults.length ? (
                      searchResults.map((item) => (
                        <button key={`${item.module}-${item.id}`} type="button" onClick={() => go(item.href)}>
                          <span>{item.module.charAt(0)}</span>
                          <span className="hb-search-result-copy">
                            <strong>{item.label}</strong>
                            <small>{item.module}{item.sublabel ? ` · ${item.sublabel}` : ""}</small>
                          </span>
                          <ChevronRight size={14} />
                        </button>
                      ))
                    ) : (
                      <div className="hb-empty">No matching records</div>
                    )}
                  </div>
                )}
              </div>

              <div className="hb-bell-wrap">
                <button
                  className="hb-bell"
                  type="button"
                  aria-label="Notifications"
                  onClick={() => {
                    setNotifOpen((v) => !v);
                    setProfileOpen(false);
                  }}
                >
                  <Bell size={18} />
                  {notifications.length > 0 && (
                    <span>{notifications.length > 9 ? "9+" : notifications.length}</span>
                  )}
                </button>
                {notifOpen && (
                  <div className="hb-notif-menu">
                    {notifications.length === 0 ? (
                      <div className="hb-empty">No new notifications</div>
                    ) : (
                      notifications.map((n) => (
                        <button key={n.id} type="button" onClick={() => go(n.href)}>
                          <strong>{n.title}</strong>
                          <small>{n.detail}</small>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="hb-profile-wrap">
                <button
                  className="hb-profile"
                  type="button"
                  onClick={() => {
                    setProfileOpen((v) => !v);
                    setNotifOpen(false);
                  }}
                >
                  <span className="hb-avatar">{avatarInitial}</span>
                  <span className="hb-profile-copy">
                    <strong>{displayName}</strong>
                    <small>{user?.email ?? userRole}</small>
                  </span>
                  <ChevronDown size={14} />
                </button>

                {profileOpen && (
                  <div className="hb-profile-menu">
                    <button type="button" onClick={() => go("/dashboard/organization")}><UserRound size={15}/> Profile / Account</button>
                    <button type="button" onClick={() => go("/dashboard/settings")}><Settings size={15}/> Organization Settings</button>
                    <button type="button" onClick={handleSignOut}><LogOut size={15}/> Sign Out</button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {loadError && (
            <div className="hb-empty" style={{ marginTop: 12, textAlign: "center" }}>
              {loadError}
            </div>
          )}

          {/* HERO */}
          <section className="hb-hero">
            <div className="hb-hero-photo" />
            <div className="hb-hero-left-fade" />
            <div className="hb-hero-gold-arc arc-one" />
            <div className="hb-hero-gold-arc arc-two" />

            <div className="hb-hero-quote" aria-hidden="true">
              <span className="hb-quote-mark hb-quote-open">&ldquo;</span>
              <p>
                Small actions.
                <br />
                Big impact.
              </p>
              <span className="hb-quote-mark hb-quote-close">&rdquo;</span>
            </div>

            <div className="hb-hero-content">
              <div className="hb-intelligence-pill">
                <Sparkles size={13} />
                NONPROFIT INTELLIGENCE PLATFORM
              </div>

              <h1 
                   className="hb-main-heading">
                <span className="hb-welcome">Welcome to</span>
                <span className="hb-gold-title">HopeBridge Foundation</span>
              </h1>

              <p>
                Together we create lasting change. Manage campaigns, programs, donors,
                volunteers and measure real impact — all in one place.
              </p>

              <div className="hb-hero-buttons">
                <button className="hb-gold-btn" type="button" onClick={() => go("/dashboard/campaigns?action=create")}>
                  <Megaphone size={16} />
                  Create Campaign
                </button>

                <button className="hb-dark-btn" type="button" onClick={() => go("/dashboard/programs?action=create")}>
                  <Target size={16} />
                  Create Program
                </button>

                <button className="hb-dark-btn" type="button" onClick={() => go("/dashboard/donors?action=create")}>
                  <Handshake size={16} />
                  Add Donor
                </button>

                <button className="hb-dark-btn" type="button" onClick={() => go("/dashboard/volunteers?action=create")}>
                  <Users size={16} />
                  Add Volunteer
                </button>

                <button className="hb-dark-btn" type="button" onClick={() => go("/dashboard/beneficiaries?action=create")}>
                  <HandHeart size={16} />
                  Add Beneficiary
                </button>

                <button className="hb-dark-btn" type="button" onClick={() => go("/dashboard/teams?action=create")}>
                  <UserRound size={16} />
                  Create Team
                </button>

                <button className="hb-dark-btn" type="button" onClick={() => go("/dashboard/analytics")}>
                  <FileBarChart size={16} />
                  View Analytics
                </button>
              </div>

              <div className="hb-hero-values">
                <span><Target size={13}/> Community Impact</span>
                <span><Leaf size={13}/> Sustainable Growth</span>
                <span><Heart size={13}/> Human-Centered</span>
                <span><ShieldCheck size={13}/> Transparent & Trusted</span>
              </div>
            </div>

            <div className="hb-hero-mini">
              <div>
                <strong>
                  {metricsLoading
                    ? "—"
                    : orgSnapshot?.impactScore != null
                      ? `${orgSnapshot.impactScore}%`
                      : "—"}
                </strong>
                <span>{orgSnapshot?.impactScore != null ? "Impact Score" : "Not enough data"}</span>
              </div>
              <div><strong>{liveModuleCount}</strong><span>Live Modules</span></div>
              <div><strong>{metricsLoading ? "—" : insights.length}</strong><span>AI Insights</span></div>
            </div>
          </section>

          {/* KPI CARDS */}
          <section className="hb-section">
            <div className="hb-section-head">
              <div>
                <span className="hb-eyebrow">ORGANIZATION OVERVIEW</span>
                <h2>Foundation performance</h2>
              </div>
              <button type="button" onClick={() => go("/dashboard/analytics")}>
                View analytics <ArrowRight size={14}/>
              </button>
            </div>

            <div className="hb-metrics">
              {metrics.map((metric) => {
                const Icon = metric.icon;
                return (
                  <button type="button" key={metric.title} className="hb-metric-card" onClick={() => go(metric.href)}>
                    <div className="hb-card-shine" />
                    <div className="hb-metric-top">
                      <span className={`hb-metric-icon ${metric.tone}`}><Icon size={20}/></span>
                      <ArrowRight size={15}/>
                    </div>
                    <span className="hb-metric-label">{metric.title}</span>
                    <strong>{metric.value}</strong>
                    <em>{metric.detail}</em>
                    <small>{metric.sub}</small>
                  </button>
                );
              })}
            </div>
          </section>

          {/* PERFORMANCE + AI */}
          <section className="hb-grid-two">
            <div className="hb-panel hb-performance">
              <div className="hb-panel-head">
                <div>
                  <span className="hb-panel-kicker">ORGANIZATION OVERVIEW</span>
                  <h3>Foundation performance</h3>
                </div>
                <button type="button" onClick={() => go("/dashboard/analytics")}>View analytics <ArrowRight size={13}/></button>
              </div>

              <div className="hb-performance-inner">
                {hasChartData ? (
                  <>
                    <div className="hb-chart">
                      <div className="hb-chart-legend">
                        <span><i className="green"/> Funds Raised</span>
                        <span><i className="gold"/> Goal (monthly share)</span>
                      </div>

                      <svg viewBox="0 0 720 245" className="hb-chart-svg" role="img" aria-label="Fundraising performance chart">
                        <defs>
                          <linearGradient id="areaGreen" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#0b835a" stopOpacity=".18"/>
                            <stop offset="100%" stopColor="#0b835a" stopOpacity="0"/>
                          </linearGradient>
                        </defs>

                        {[35,80,125,170,215].map((y)=><line key={y} x1="30" x2="700" y1={y} y2={y} stroke="#ece5d8" strokeWidth="1"/>)}

                        {chartPaths.areaPath && (
                          <path d={chartPaths.areaPath} fill="url(#areaGreen)"/>
                        )}
                        {chartPaths.raisedPath && (
                          <path d={chartPaths.raisedPath} fill="none" stroke="#078056" strokeWidth="4" strokeLinecap="round"/>
                        )}
                        {chartPaths.goalPath && chartPoints.some((p) => p.goal > 0) && (
                          <path d={chartPaths.goalPath} fill="none" stroke="#d7aa2f" strokeWidth="3" strokeLinecap="round"/>
                        )}
                      </svg>

                      <div
                        className="hb-months"
                        style={{
                          gridTemplateColumns: `repeat(${Math.max(chartPoints.length, 1)}, 1fr)`,
                        }}
                      >
                        {chartPoints.map((p) => (
                          <span key={p.month}>{p.monthLabel}</span>
                        ))}
                      </div>
                    </div>

                    <div className="hb-goal">
                      <div
                        className="hb-ring"
                        style={{
                          background: orgSnapshot && orgSnapshot.totalCampaignGoal > 0
                            ? `conic-gradient(#087b53 0 ${goalProgress}%, #ecede9 ${goalProgress}% 100%)`
                            : "conic-gradient(#ecede9 0 100%)",
                        }}
                      >
                        <div className="hb-ring-inner">
                          <strong>{goalLabel}</strong>
                          <span>Campaign Goal</span>
                        </div>
                      </div>
                      <b>{formatCurrency(orgSnapshot?.fundsRaised ?? 0)}</b>
                      <small>/ {formatCurrency(orgSnapshot?.totalCampaignGoal ?? 0)}</small>
                    </div>
                  </>
                ) : fundraising?.displayMode === "summary_only" ? (
                  <>
                    <div className="hb-empty hb-empty-chart">{performanceSummary}</div>
                    <div className="hb-goal">
                      <div
                        className="hb-ring"
                        style={{
                          background: orgSnapshot && orgSnapshot.totalCampaignGoal > 0
                            ? `conic-gradient(#087b53 0 ${goalProgress}%, #ecede9 ${goalProgress}% 100%)`
                            : "conic-gradient(#ecede9 0 100%)",
                        }}
                      >
                        <div className="hb-ring-inner">
                          <strong>{goalLabel}</strong>
                          <span>Campaign Goal</span>
                        </div>
                      </div>
                      <b>{formatCurrency(orgSnapshot?.fundsRaised ?? 0)}</b>
                      <small>/ {formatCurrency(orgSnapshot?.totalCampaignGoal ?? 0)}</small>
                    </div>
                  </>
                ) : (
                  <div className="hb-empty hb-empty-chart">
                    {performanceSummary ||
                      "No fundraising performance data yet. Create a campaign or record donations to begin tracking performance."}
                  </div>
                )}
              </div>
            </div>

            <div className="hb-panel">
              <div className="hb-panel-head">
                <div>
                  <span className="hb-panel-kicker">HOPEBRIDGE INTELLIGENCE</span>
                  <h3>AI Insights</h3>
                </div>
                <button type="button" onClick={() => go("/dashboard/ai-assistant")}>View all <ArrowRight size={13}/></button>
              </div>

              <div className="hb-insights">
                {metricsLoading ? (
                  <div className="hb-empty">Loading insights…</div>
                ) : insights.length === 0 ? (
                  <div className="hb-empty hb-empty-insights">
                    No AI insights yet.
                    <br />
                    HopeBridge AI will surface insights as organization data becomes available.
                  </div>
                ) : (
                  insights.map((item, index) => {
                    const Icon = index === 0 ? TrendingUp : index === 1 ? Heart : Users;
                    return (
                      <button key={item.id} type="button" onClick={() => go("/dashboard/ai-assistant")}>
                        <span className={`hb-insight-icon insight-${index}`}><Icon size={18}/></span>
                        <span>
                          <strong>{item.title}</strong>
                          <small>{item.description}</small>
                        </span>
                        <ChevronRight size={15}/>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </section>

          {/* ATTENTION CENTER */}
          <section className="hb-section">
            <div className="hb-section-head">
              <div>
                <span className="hb-eyebrow">ATTENTION CENTER</span>
                <h2>Needs attention</h2>
              </div>
            </div>
            <div className="hb-panel compact">
              {attentionItems.length === 0 ? (
                <div className="hb-empty">
                  Everything looks clear.
                  <br />
                  No items currently need attention.
                </div>
              ) : (
                <div className="hb-activity-list">
                  {attentionItems.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      className="hb-activity-row"
                      style={{ width: "100%", textAlign: "left", background: "none", border: "none" }}
                      onClick={() => go(item.href)}
                    >
                      <span className={`hb-activity-dot d${index % 4}`} />
                      <div>
                        <strong>{item.title}</strong>
                        <small>{item.detail}</small>
                      </div>
                      <ChevronRight size={14} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ACTIVITY / DEADLINES / SUPPORT */}
          <section className="hb-grid-three">
            <div className="hb-panel compact">
              <div className="hb-compact-head">
                <div><Activity size={16}/><h3>Recent Activity</h3></div>
                <button type="button" onClick={() => go("/dashboard/activity")}>View all <ArrowRight size={12}/></button>
              </div>
              <div className="hb-activity-list">
                {recentActivities.length === 0 ? (
                  <div className="hb-empty">
                    No activity yet.
                    <br />
                    Organization updates will appear here.
                  </div>
                ) : (
                  recentActivities.map((activity, index) => (
                    <div className="hb-activity-row" key={activity.id}>
                      <span className={`hb-activity-dot d${index % 4}`} />
                      <div>
                        <strong>{activity.description}</strong>
                        <small>
                          {formatActivityTime(activity.createdAt)} · {activity.module}
                        </small>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="hb-panel compact">
              <div className="hb-compact-head">
                <div><CalendarDays size={16}/><h3>Upcoming Deadlines</h3></div>
                <button type="button" onClick={() => go("/dashboard/calendar")}>View calendar <ArrowRight size={12}/></button>
              </div>
              <div className="hb-deadlines">
                {deadlines.length === 0 ? (
                  <div className="hb-empty">No upcoming deadlines.</div>
                ) : (
                  deadlines.map((item) => (
                    <button
                      type="button"
                      className="hb-deadline"
                      key={`${item.title}-${item.day}-${item.month}`}
                      onClick={() => go(item.href)}
                    >
                      <span className="hb-date"><small>{item.month}</small><strong>{item.day}</strong></span>
                      <div><strong>{item.title}</strong><small>{item.meta}</small></div>
                      <ChevronRight size={14}/>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="hb-support">
              <div className="hb-support-overlay" />
              <div className="hb-support-copy">
                <span>COMMUNITY IMPACT</span>
                <h3>Your support<br/>changes lives.</h3>
                <p>Help build stronger communities and create a brighter future.</p>
                <button type="button" onClick={() => go("/dashboard/donors")}><Heart size={14}/> Donor Management <ArrowRight size={13}/></button>
              </div>
            </div>
          </section>

          <footer className="hb-footer">
            <span>HopeBridge Foundation Platform</span>
            <span>Nonprofit Intelligence · Prototype Version 1.0</span>
          </footer>
        </main>
      </div>

      <style jsx global>{`
        *{box-sizing:border-box}
        body{margin:0;background:#f7f4eb;color:#17352b}
        button,input{font:inherit}
        button{cursor:pointer}
        button:focus-visible,input:focus-visible{outline:2px solid #0b7653;outline-offset:2px}
        .hb-app{
          --g0:#002f25;
          --g1:#003b2e;
          --g2:#07523b;
          --g3:#0b744f;
          --gold:#e6bf49;
          --gold2:#f7d862;
          --gold3:#b57c13;
          --ivory:#fbf8f0;
          min-height:100vh;
          background:
            radial-gradient(circle at 86% 6%,rgba(226,188,74,.10),transparent 22%),
            #f8f6ef;
        }

        .hb-sidebar{
          width:284px;
          height:100vh;
          position:fixed;
          inset:0 auto 0 0;
          z-index:60;
          display:flex;
          flex-direction:column;
          overflow:hidden;
          color:#fff;
          background:
            radial-gradient(circle at 12% 0%,rgba(245,212,94,.10),transparent 20%),
            radial-gradient(circle at 96% 72%,rgba(21,131,91,.10),transparent 27%),
            linear-gradient(180deg,#00392d 0%,#003126 45%,#00271f 100%);
          border-right:1px solid rgba(230,191,66,.35);
          box-shadow:18px 0 45px rgba(0,45,35,.10);
        }
        .hb-sidebar.mobile{display:flex;transform:none}
        .hb-brand{display:flex;align-items:center;gap:13px;padding:20px 16px 15px}
        .hb-logo{
          position:relative;width:58px;height:58px;flex:0 0 auto;
          display:grid;place-items:center;border-radius:18px;
          color:#f6d86d;border:1px solid rgba(239,199,66,.55);
          background:linear-gradient(145deg,#0c6046,#04372b 72%);
          box-shadow:inset 0 0 0 3px rgba(0,43,34,.55),0 0 18px rgba(235,195,62,.12);
        }
        .hb-logo:before{content:"";position:absolute;inset:5px;border:1px solid rgba(255,227,123,.23);border-radius:13px}
        .hb-logo-shine{
          position:absolute;right:-3px;top:-3px;width:11px;height:11px;border-radius:50%;
          background:#ffe272;box-shadow:0 0 5px #ffe272,0 0 15px rgba(255,226,114,.8)
        }
        .hb-brand-name{font-weight:800;font-size:18px;letter-spacing:.5px;color:#fff5d4}
        .hb-brand-sub{margin-top:4px;font-size:8px;letter-spacing:3px;font-weight:800;color:#ddbb4b}
        .hb-brand-tag{margin-top:6px;font-size:9px;color:rgba(255,255,255,.43)}
        .hb-side-divider{height:1px;background:linear-gradient(90deg,transparent,rgba(229,190,61,.42),transparent)}
        .hb-dashboard-active{
          margin:15px;width:calc(100% - 30px);min-height:61px;padding:9px 12px;
          display:flex;align-items:center;gap:12px;border-radius:15px;color:#fff;font-weight:700;
          border:1px solid rgba(231,194,63,.62);
          background:radial-gradient(circle at 91% 50%,rgba(255,225,94,.18),transparent 24%),rgba(255,255,255,.04);
          box-shadow:inset 0 0 20px rgba(255,217,80,.04)
        }
        .hb-active-icon{
          width:41px;height:41px;display:grid;place-items:center;border-radius:11px;color:#08382d;
          background:linear-gradient(135deg,#fff2a0,#f0cc53 28%,#c48b19 63%,#f6d75f);
          box-shadow:inset 0 1px rgba(255,255,255,.75),0 4px 11px rgba(210,165,39,.25)
        }
        .hb-active-spark{
          margin-left:auto;width:8px;height:8px;border-radius:50%;background:#ffe474;
          box-shadow:0 0 6px #ffe474,0 0 14px rgba(255,228,116,.75)
        }
        .hb-nav-scroll{flex:1;overflow-y:auto;padding:0 14px 170px}
        .hb-nav-group{padding:9px 0}
        .hb-nav-title{padding:0 9px 6px;font-size:9px;font-weight:800;letter-spacing:1.8px;color:rgba(225,187,62,.76)}
        .hb-nav-item{
          width:100%;min-height:44px;display:flex;align-items:center;gap:11px;padding:5px 8px;
          border:1px solid transparent;border-radius:10px;color:rgba(255,255,255,.68);background:transparent;text-align:left;
          transition:.18s ease
        }
        .hb-nav-item:hover{
          color:#fff;transform:translateX(3px);border-color:rgba(231,194,61,.24);
          background:radial-gradient(circle at 90% 50%,rgba(255,219,77,.11),transparent 24%),rgba(255,255,255,.035)
        }
        .hb-nav-icon{
          width:34px;height:34px;display:grid;place-items:center;border-radius:10px;color:#e3c34e;
          border:1px solid rgba(229,190,58,.30);background:rgba(255,255,255,.03)
        }
        .hb-nav-arrow{margin-left:auto;opacity:.35;color:#d8b64b}
        .hb-side-bottom{
          position:absolute;left:0;right:0;bottom:0;padding:14px;
          background:linear-gradient(180deg,rgba(0,49,39,0),rgba(0,49,39,.97) 22%,#003127 58%)
        }
        .hb-ai-side{
          width:100%;min-height:64px;display:flex;align-items:center;gap:10px;padding:9px;border-radius:14px;color:white;text-align:left;
          border:1px solid rgba(230,191,62,.47);background:rgba(255,255,255,.04)
        }
        .hb-ai-side-icon{
          width:42px;height:42px;display:grid;place-items:center;border-radius:12px;color:#07392d;
          background:linear-gradient(135deg,#fff0a1,#e0b43d 45%,#ad7711)
        }
        .hb-ai-side>span:nth-child(2){display:flex;flex-direction:column;gap:3px}
        .hb-ai-side strong{font-size:12px}.hb-ai-side small{font-size:8px;color:rgba(255,255,255,.48)}
        .hb-ai-side i{margin-left:auto;width:8px;height:8px;border-radius:50%;background:#38df91;box-shadow:0 0 8px #38df91}
        .hb-motto{text-align:center;margin-top:9px;color:#dfbe4d;font:italic 10px Georgia,serif}
        .hb-mobile-close{display:none;margin-left:auto;border:0;background:transparent;color:white}

        .hb-main{margin-left:284px;padding:15px 22px 28px;min-height:100vh}
        .hb-topbar{
          position:relative;z-index:30;min-height:68px;display:flex;align-items:center;justify-content:space-between;gap:15px;
          padding:10px 12px 10px 16px;border-radius:18px;border:1px solid #e6d9bc;background:rgba(255,255,255,.97);
          box-shadow:0 7px 22px rgba(62,55,38,.055)
        }
        .hb-breadcrumbs,.hb-top-actions{display:flex;align-items:center}
        .hb-breadcrumbs{gap:9px;color:#6a7a72;font-size:12px}.hb-breadcrumbs b{color:#c3b69d}.hb-breadcrumbs strong{color:#1e3d32}
        .hb-home-icon{color:#0b7754}.hb-top-actions{flex:1;justify-content:flex-end;gap:8px}
        .hb-menu-btn{display:none;width:38px;height:38px;place-items:center;border-radius:10px;border:1px solid #e5dbc6;background:#fff;color:#17473a}
        .hb-search{
          position:relative;width:min(465px,46vw);height:43px;display:flex;align-items:center;gap:9px;padding:0 13px;
          border:1px solid #e4dac6;border-radius:12px;background:#fbfaf6;color:#87958f
        }
        .hb-search input{width:100%;border:0;outline:0;background:transparent;font-size:14px;color:#20382f}
        .hb-search>button{border:0;background:transparent;color:#8b9892;padding:0}
        .hb-search-results{
          position:absolute;left:0;right:0;top:50px;z-index:90;padding:6px;border-radius:12px;border:1px solid #e4dbc8;
          background:#fff;box-shadow:0 18px 40px rgba(34,53,45,.14)
        }
        .hb-search-results button{
          width:100%;display:flex;align-items:center;gap:9px;padding:10px;border:0;border-radius:8px;background:transparent;color:#29463b;text-align:left
        }
        .hb-search-results button:hover{background:#f4f7f4}.hb-search-results button>span:first-child{
          width:28px;height:28px;display:grid;place-items:center;border-radius:8px;background:#edf7f2;color:#0b7653;font-size:12px;font-weight:700
        }
        .hb-search-result-copy{display:flex;flex:1;flex-direction:column;align-items:flex-start;gap:2px}
        .hb-search-result-copy strong{font-size:14px;color:#1e3d32}.hb-search-result-copy small{font-size:12px;color:#7d8b85}
        .hb-search-results button>svg{margin-left:auto}.hb-empty{padding:14px;font-size:14px;line-height:1.55;color:#7d8b85}
        .hb-empty-chart,.hb-empty-insights{padding:48px 24px;text-align:center;max-width:420px;margin:0 auto}
        .hb-bell-wrap{position:relative}
        .hb-bell{position:relative;width:43px;height:43px;display:grid;place-items:center;border-radius:12px;border:1px solid #e4dac6;background:#fff;color:#315348}
        .hb-bell span{
          position:absolute;right:5px;top:4px;min-width:16px;height:16px;display:grid;place-items:center;border-radius:99px;
          background:#d5aa2e;color:#073b2f;font-size:10px;font-weight:800;border:2px solid #fff;padding:0 3px
        }
        .hb-notif-menu{
          position:absolute;right:0;top:49px;width:min(320px,80vw);max-height:320px;overflow-y:auto;padding:6px;border-radius:11px;border:1px solid #e4dbc8;background:#fff;box-shadow:0 18px 40px rgba(34,53,45,.13);z-index:95
        }
        .hb-notif-menu button{width:100%;display:flex;flex-direction:column;align-items:flex-start;gap:4px;padding:10px;border:0;border-radius:8px;background:transparent;color:#2d493e;text-align:left}
        .hb-notif-menu button:hover{background:#f4f7f4}.hb-notif-menu strong{font-size:14px;color:#1e3d32}.hb-notif-menu small{font-size:13px;color:#7d8b85;line-height:1.45}
        .hb-profile-wrap{position:relative}
        .hb-profile{
          min-width:185px;height:43px;display:flex;align-items:center;gap:9px;padding:5px 8px;border-radius:12px;border:1px solid #e4dac6;background:#fff;color:#223d33
        }
        .hb-avatar{width:32px;height:32px;display:grid;place-items:center;border-radius:9px;background:linear-gradient(145deg,#0d5f44,#053b2d);color:#efd062;font-size:13px;font-weight:800}
        .hb-profile-copy{display:flex;flex:1;flex-direction:column;align-items:flex-start}.hb-profile-copy strong{font-size:14px}.hb-profile-copy small{font-size:12px;color:#849188;margin-top:2px}
        .hb-profile-menu{
          position:absolute;right:0;top:49px;width:210px;padding:6px;border-radius:11px;border:1px solid #e4dbc8;background:#fff;box-shadow:0 18px 40px rgba(34,53,45,.13);z-index:95
        }
        .hb-profile-menu button{width:100%;display:flex;align-items:center;gap:8px;padding:10px;border:0;border-radius:8px;background:transparent;color:#2d493e;text-align:left;font-size:14px}
        .hb-profile-menu button:hover{background:#f4f7f4}

        .hb-hero{
          position:relative;min-height:405px;margin-top:16px;overflow:hidden;border-radius:25px;border:1px solid rgba(203,159,33,.66);
          background:#021912;box-shadow:0 18px 46px rgba(22,66,47,.14)
        }
        .hb-hero-photo{
          position:absolute;inset:0;width:100%;height:100%;
          background-image:url("/hopebridge-hero-visual.png");
          background-size:cover;background-position:center center;background-repeat:no-repeat;
          filter:saturate(1.08) contrast(1.03)
        }
        .hb-hero-left-fade{
          position:absolute;inset:0;z-index:2;pointer-events:none;
          background:
            linear-gradient(90deg,rgba(0,38,28,.72) 0%,rgba(0,42,31,.42) 28%,rgba(0,36,27,.18) 46%,rgba(0,28,21,.06) 62%,transparent 78%),
            linear-gradient(180deg,rgba(0,20,15,.18) 0%,transparent 38%,rgba(0,18,14,.22) 100%),
            radial-gradient(circle at 72% 24%,rgba(255,224,121,.08),transparent 34%)
        }
        .hb-hero-quote{
          position:absolute;z-index:7;top:34px;right:7%;max-width:220px;display:flex;align-items:flex-start;gap:2px;pointer-events:none
        }
        .hb-quote-mark{
          font:700 56px/0.72 Georgia,"Times New Roman",serif;color:#e6c244;text-shadow:0 2px 18px rgba(214,165,33,.28)
        }
        .hb-quote-open{margin-top:8px;margin-right:-4px}
        .hb-quote-close{align-self:flex-end;margin-left:-6px;margin-bottom:2px;font-size:48px;color:#d4a82a}
        .hb-hero-quote p{
          margin:18px 0 0;padding:0;font:italic 500 clamp(17px,1.55vw,22px)/1.28 Georgia,"Times New Roman",serif;color:rgba(255,255,255,.94);letter-spacing:.2px;text-shadow:0 2px 16px rgba(0,0,0,.45)
        }
        .hb-hero:after{
          content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;
          box-shadow:inset 0 0 0 1px rgba(255,239,168,.07),inset 0 -55px 90px rgba(0,38,27,.09)
        }
        .hb-hero-gold-arc{
          position:absolute;right:-60px;width:420px;height:160px;border:1px solid rgba(255,219,87,.34);border-left-color:transparent;border-bottom-color:transparent;border-radius:50%;transform:rotate(-10deg)
        }
        .arc-one{top:-5px}.arc-two{top:42px;opacity:.52}
        .hb-hero-content{position:relative;z-index:6;width:min(54%,620px);padding:32px 0 75px 40px}
        .hb-intelligence-pill{
          width:max-content;display:flex;align-items:center;gap:8px;padding:7px 12px;border-radius:999px;
          border:1px solid rgba(236,196,57,.45);background:rgba(0,52,39,.44);color:#f4d35b;
          font-size:9px;font-weight:800;letter-spacing:1.7px;backdrop-filter:blur(6px)
        }
        .hb-hero h1{margin:21px 0 15px;display:flex;flex-direction:column;gap:2px;line-height:.97;letter-spacing:-2.4px}
        .hb-welcome{font:700 clamp(39px,4vw,58px) Georgia,"Times New Roman",serif;color:#fff}
        .hb-gold-title{
  display:block;
  width:max-content;
  max-width:none;
  white-space:nowrap;
  font:700 clamp(38px,3.8vw,56px) Georgia,"Times New Roman",serif;
  line-height:1.02;
  letter-spacing:-1.5px;
  background:linear-gradient(
    110deg,
    #fff2a9 0%,
    #f6d76c 18%,
    #d4a228 42%,
    #fff0a0 58%,
    #d49b20 78%,
    #ffe786 100%
  );
  -webkit-background-clip:text;
  background-clip:text;
  color:transparent;
  text-shadow:
    0 1px 0 rgba(255,255,255,.18),
    0 3px 12px rgba(218,165,32,.20);
}
        .hb-hero-content>p{max-width:520px;margin:0;color:rgba(255,255,255,.73);font-size:12px;line-height:1.72}
        .hb-hero-buttons{display:flex;flex-wrap:wrap;gap:9px;margin-top:21px}
        .hb-gold-btn,.hb-dark-btn{
          min-height:42px;display:flex;align-items:center;gap:8px;padding:0 15px;border-radius:10px;font-size:11px;font-weight:750
        }
        .hb-gold-btn{
          color:#073b2f;border:1px solid #f1ce55;background:linear-gradient(135deg,#fff1a3,#ebc34a 33%,#c28a17 66%,#f1cf55);
          box-shadow:inset 0 1px rgba(255,255,255,.7),0 7px 18px rgba(214,165,33,.18)
        }
        .hb-dark-btn{color:white;border:1px solid rgba(231,194,59,.48);background:rgba(0,51,39,.55);backdrop-filter:blur(7px)}
        .hb-hero-values{position:absolute;left:40px;bottom:24px;display:flex;flex-wrap:wrap;gap:17px}
        .hb-hero-values span{display:flex;align-items:center;gap:5px;color:rgba(255,255,255,.56);font-size:9px}.hb-hero-values svg{color:#e6c244}
        .hb-hero-mini{position:absolute;z-index:9;right:20px;bottom:16px;display:grid;grid-template-columns:repeat(3,110px);gap:8px}
        .hb-hero-mini>div{
          min-height:76px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:14px;
          border:1px solid rgba(235,198,65,.30);background:rgba(0,54,41,.75);backdrop-filter:blur(9px)
        }
        .hb-hero-mini strong{font-size:22px;color:#f4d35c}.hb-hero-mini span{margin-top:6px;font-size:12px;color:rgba(255,255,255,.72)}

        .hb-section{margin-top:22px}.hb-section-head{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:12px}
        .hb-eyebrow{display:block;margin-bottom:5px;font-size:12px;font-weight:800;letter-spacing:1.5px;color:#9e7b24}
        .hb-section-head h2{margin:0;font-size:22px;color:#18392e}.hb-section-head button,.hb-panel-head button,.hb-compact-head button{
          display:flex;align-items:center;gap:6px;border:0;background:transparent;color:#65766e;font-size:13px
        }
        .hb-metrics{display:grid;grid-template-columns:repeat(6,1fr);gap:10px}
        .hb-metric-card{
          position:relative;overflow:hidden;min-height:165px;padding:14px;border-radius:16px;border:1px solid #e9dfcc;background:#fff;text-align:left;
          box-shadow:0 10px 26px rgba(49,52,42,.055);transition:.18s ease;color:#19382e
        }
        .hb-metric-card:hover{transform:translateY(-4px);border-color:rgba(209,166,39,.50);box-shadow:0 18px 34px rgba(44,53,46,.09)}
        .hb-card-shine{position:absolute;top:-70px;left:-85px;width:65px;height:230px;transform:rotate(25deg);background:linear-gradient(90deg,transparent,rgba(255,255,255,.86),transparent);opacity:0}
        .hb-metric-card:hover .hb-card-shine{left:125%;opacity:.55;transition:left .65s ease,opacity .2s}
        .hb-metric-top{display:flex;align-items:center;justify-content:space-between}.hb-metric-top>svg{color:#c2cbc6}
        .hb-metric-icon{width:42px;height:42px;display:grid;place-items:center;border-radius:13px}
        .hb-metric-icon.gold{color:#8b6005;background:#fff4d0;border:1px solid #efd786}
        .hb-metric-icon.green,.hb-metric-icon.emerald{color:#08734f;background:#e8f8ef;border:1px solid #c4e8d4}
        .hb-metric-icon.pink{color:#a33c75;background:#fff0f7;border:1px solid #f1d1e1}
        .hb-metric-icon.blue{color:#0a728d;background:#eaf8fb;border:1px solid #cae8ed}
        .hb-metric-label{display:block;margin-top:13px;font-size:13px;color:#607269}.hb-metric-card>strong{display:block;margin-top:4px;font-size:23px;color:#112e24}
        .hb-metric-card>em{display:block;margin-top:7px;font-style:normal;font-size:13px;font-weight:700;color:#0a7a53}.hb-metric-card>small{display:block;margin-top:3px;color:#98a39d;font-size:12px;line-height:1.45}

        .hb-grid-two{display:grid;grid-template-columns:1.55fr .72fr;gap:12px;margin-top:14px}
        .hb-panel{border:1px solid #e8decb;border-radius:17px;background:#fff;box-shadow:0 10px 26px rgba(49,52,42,.05);padding:16px}
        .hb-panel-head,.hb-compact-head{display:flex;align-items:center;justify-content:space-between;gap:10px}
        .hb-panel-kicker{display:block;margin-bottom:4px;font-size:12px;font-weight:800;letter-spacing:1.2px;color:#9f7b24}.hb-panel-head h3,.hb-compact-head h3{margin:0;color:#19382e}
        .hb-panel-head h3{font-size:16px}.hb-performance-inner{display:grid;grid-template-columns:1fr 165px;gap:10px;margin-top:14px;align-items:center}
        .hb-chart{min-width:0}.hb-chart-legend{display:flex;justify-content:flex-end;gap:13px;font-size:12px;color:#77877f}
        .hb-chart-legend span{display:flex;align-items:center;gap:4px}.hb-chart-legend i{width:6px;height:6px;border-radius:50%}.hb-chart-legend .green{background:#087b53}.hb-chart-legend .gold{background:#d7aa2f}
        .hb-chart-svg{width:100%;height:205px}.hb-months{display:grid;margin-top:-8px;font-size:12px;color:#929d97;text-align:center}
        .hb-goal{display:flex;flex-direction:column;align-items:center;border-left:1px solid #eee6d7;padding-left:10px}
        .hb-ring{width:112px;height:112px;border-radius:50%;display:grid;place-items:center}
        .hb-ring-inner{width:83px;height:83px;border-radius:50%;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:inset 0 0 12px rgba(0,0,0,.03)}
        .hb-ring-inner strong{font-size:20px}.hb-ring-inner span{margin-top:2px;font-size:12px;color:#89958f}.hb-goal>b{margin-top:9px;font-size:14px;color:#0b6a4d}.hb-goal>small{margin-top:2px;font-size:12px;color:#929d97}
        .hb-insights{display:flex;flex-direction:column;gap:8px;margin-top:13px}.hb-insights button{
          width:100%;min-height:70px;display:flex;align-items:center;gap:9px;padding:10px;border-radius:12px;border:1px solid #ebe3d2;background:#fffdfa;text-align:left;color:#213d32
        }
        .hb-insight-icon{width:38px;height:38px;display:grid;place-items:center;border-radius:11px}.insight-0{color:#f0ce56;background:linear-gradient(145deg,#075942,#003d30)}.insight-1{color:#805706;background:#fff1c3}.insight-2{color:#68458d;background:#f0e8f7}
        .hb-insights button>span:nth-child(2){display:flex;flex:1;flex-direction:column}.hb-insights strong{font-size:14px}.hb-insights small{margin-top:4px;font-size:13px;line-height:1.5;color:#7d8a84}.hb-insights button>svg{color:#c0c9c4}

        .hb-grid-three{display:grid;grid-template-columns:1fr 1fr .82fr;gap:12px;margin-top:12px}.hb-panel.compact{min-height:270px}.hb-compact-head>div{display:flex;align-items:center;gap:7px}.hb-compact-head>div>svg{color:#af8520}.hb-compact-head h3{font-size:15px}
        .hb-activity-list,.hb-deadlines{margin-top:12px}.hb-activity-row{min-height:52px;display:flex;align-items:center;gap:9px;border-top:1px solid #f0eadf}.hb-activity-row:first-child{border-top:0}
        .hb-activity-dot{width:8px;height:8px;border-radius:50%}.hb-activity-dot.d0{background:#d7a72c}.hb-activity-dot.d1{background:#7a59b0}.hb-activity-dot.d2{background:#2387a0}.hb-activity-dot.d3{background:#0e9565}
        .hb-activity-row>div{display:flex;flex-direction:column}.hb-activity-row strong,.hb-deadline>div strong{font-size:14px;color:#334b41;line-height:1.4}.hb-activity-row small,.hb-deadline>div small{margin-top:4px;font-size:12px;color:#929d97;line-height:1.45}
        .hb-deadline{width:100%;min-height:64px;display:flex;align-items:center;gap:9px;border-top:1px solid #f0eadf;border-left:0;border-right:0;border-bottom:0;background:transparent;text-align:left;color:inherit;padding:0;cursor:pointer}
        .hb-deadline:first-child{border-top:0}.hb-deadline:hover{background:#faf8f3}.hb-date{
          width:40px;height:45px;flex:0 0 auto;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:9px;border:1px solid #e7dcc6;background:#fffaf0
        }
        .hb-date small{font-size:10px;font-weight:800;color:#9a782a}.hb-date strong{font-size:14px;color:#28453b}.hb-deadline>div{flex:1;display:flex;flex-direction:column}.hb-deadline>svg{color:#c2cac5}
        .hb-support{
          position:relative;min-height:270px;overflow:hidden;border-radius:17px;border:1px solid rgba(206,162,35,.48);
          background-image:linear-gradient(90deg,rgba(0,48,36,.88),rgba(0,50,37,.35)),url("/hopebridge-hero-visual.png");
          background-size:cover;background-position:center right;box-shadow:0 10px 26px rgba(49,52,42,.05)
        }
        .hb-support-overlay{position:absolute;inset:0;background:radial-gradient(circle at 85% 20%,rgba(255,224,107,.14),transparent 28%)}
        .hb-support-copy{position:relative;z-index:2;width:66%;padding:24px 0 20px 20px}.hb-support-copy>span{font-size:12px;font-weight:800;letter-spacing:1.5px;color:#dfbd4d}.hb-support h3{margin:9px 0 8px;font:700 26px/1.03 Georgia,serif;color:#fff}.hb-support p{margin:0;font-size:13px;line-height:1.55;color:rgba(255,255,255,.72)}
        .hb-support button{margin-top:14px;min-height:36px;display:flex;align-items:center;gap:6px;padding:0 11px;border-radius:9px;border:1px solid #efd15b;background:linear-gradient(135deg,#fff0a0,#d8a72c);color:#073a2e;font-size:13px;font-weight:800}
        .hb-footer{display:flex;justify-content:space-between;gap:12px;padding:18px 4px 0;color:#959f99;font-size:12px;line-height:1.5}

        .hb-mobile-layer{display:none}
        @media(max-width:1400px){
          .hb-metrics{grid-template-columns:repeat(3,1fr)}
          .hb-hero-content{width:min(58%,640px)}.hb-hero-quote{right:5%;max-width:200px}
        }
        @media(max-width:1120px){
          .hb-sidebar{width:250px}.hb-main{margin-left:250px}.hb-grid-two{grid-template-columns:1fr}.hb-grid-three{grid-template-columns:1fr 1fr}.hb-support{grid-column:1/-1}
          .hb-hero-content{width:min(62%,560px)}.hb-hero-quote{top:28px;right:4%;max-width:180px}.hb-quote-mark{font-size:46px}.hb-quote-close{font-size:40px}
        }
        @media(max-width:900px){
          .hb-sidebar.desktop{display:none}.hb-main{margin-left:0}.hb-menu-btn{display:grid}
          .hb-mobile-layer{display:block}.hb-mobile-overlay{position:fixed;inset:0;z-index:55;border:0;background:rgba(0,34,26,.45);backdrop-filter:blur(3px)}
          .hb-sidebar.mobile{z-index:60}.hb-mobile-close{display:block}.hb-breadcrumbs>span,.hb-breadcrumbs>b,.hb-breadcrumbs>strong,.hb-home-icon{display:none}
          .hb-profile{min-width:44px;width:44px;padding:5px}.hb-profile-copy,.hb-profile>svg{display:none}
          .hb-hero-content{width:min(68%,520px)}.hb-hero-quote{top:22px;right:3%;max-width:160px}.hb-hero-quote p{font-size:16px}
        }
        @media(max-width:720px){
          .hb-main{padding:10px}.hb-topbar{border-radius:15px}.hb-search{width:100%}.hb-bell{display:none}
          .hb-hero{min-height:590px}
          .hb-hero-left-fade{background:linear-gradient(180deg,rgba(0,38,28,.78) 0%,rgba(0,36,27,.52) 42%,rgba(0,28,21,.22) 68%,rgba(0,18,14,.08) 100%),radial-gradient(circle at 50% 85%,rgba(255,224,121,.06),transparent 42%)}
          .hb-hero-content{width:100%;padding:27px 20px 185px}.hb-welcome{font-size:42px}.hb-gold-title{font-size:48px}
          .hb-hero-quote{top:18px;right:16px;left:auto;max-width:145px}.hb-quote-mark{font-size:38px}.hb-quote-close{font-size:32px}.hb-hero-quote p{margin-top:12px;font-size:15px}
          .hb-hero-values{display:none}.hb-hero-mini{left:15px;right:15px;grid-template-columns:repeat(3,1fr)}
          .hb-metrics{grid-template-columns:repeat(2,1fr)}.hb-performance-inner{grid-template-columns:1fr}.hb-goal{border-left:0;border-top:1px solid #eee6d7;padding-top:14px}
          .hb-grid-three{grid-template-columns:1fr}.hb-support{grid-column:auto}
        }
        @media(max-width:500px){
          .hb-metrics{grid-template-columns:1fr}.hb-hero-buttons{display:grid;grid-template-columns:1fr 1fr}.hb-gold-btn{grid-column:1/-1}
          .hb-section-head h2{font-size:20px}.hb-footer{flex-direction:column}
        }
      `}</style>
    </>
  );
}