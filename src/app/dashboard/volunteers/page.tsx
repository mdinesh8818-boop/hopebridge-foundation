"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  Eye,
  Filter,
  Home,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import HopeBridgeSidebar from "../components/HopeBridgeSidebar";
import {
  createDocument,
  deleteDocument,
  getDocuments,
  updateDocument,
} from "../../../services/firestore";
import {
  formatActivityTime,
  getActivities,
  logActivity,
} from "../../../services/activity";
import type { ActivityRecord } from "../../../types/activity";
import { useModuleCreateAction } from "@/hooks/useModuleCreateAction";
import "./volunteers.css";

type VolunteerStatus =
  | "Active"
  | "Completed"
  | "In Progress"
  | "Needs Attention";

type Volunteer = {
  id: string;
  name: string;
  email: string;
  role: string;
  initiative: string;
  availability: string;
  hours: number;
  status: VolunteerStatus;
  lastActivity: string;
};

type VolunteerFormData = {
  name: string;
  email: string;
  role: string;
  initiative: string;
  availability: string;
  hours: string;
  status: VolunteerStatus;
  lastActivity: string;
};

const ROLES = [
  "Community Coordinator",
  "Event Support",
  "Mentor",
  "Outreach Lead",
  "Program Assistant",
  "Logistics Support",
];

const INITIATIVES = [
  "Education Access",
  "Community Health",
  "Clean Water Program",
  "Emergency Relief",
  "Youth Development",
  "Food Distribution",
];

const AVAILABILITY_OPTIONS = [
  "Weekdays",
  "Weekends",
  "Evenings",
  "Flexible",
  "Seasonal",
];

const STATUSES: VolunteerStatus[] = [
  "Active",
  "In Progress",
  "Completed",
  "Needs Attention",
];

const emptyForm: VolunteerFormData = {
  name: "",
  email: "",
  role: "",
  initiative: "",
  availability: "",
  hours: "0",
  status: "Active",
  lastActivity: new Date().toISOString().slice(0, 10),
};

function formatDate(value: string) {
  if (!value) return "Not set";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getStatusClass(status: VolunteerStatus) {
  switch (status) {
    case "Active":
      return "border-[#c4e8d4] bg-[#e8f8ef] text-[#08734f]";
    case "Completed":
      return "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]";
    case "In Progress":
      return "border-[#bae6fd] bg-[#eaf8fb] text-[#0a728d]";
    case "Needs Attention":
      return "border-[#fecdd3] bg-[#fff1f2] text-[#be123c]";
    default:
      return "border-[#e4dac6] bg-white text-[#607269]";
  }
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function VolunteersPage() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<VolunteerStatus | "All">("All");
  const [initiativeFilter, setInitiativeFilter] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVolunteerId, setEditingVolunteerId] = useState<string | null>(null);
  const [viewingVolunteer, setViewingVolunteer] = useState<Volunteer | null>(null);
  const [volunteerToDelete, setVolunteerToDelete] = useState<Volunteer | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [formData, setFormData] = useState<VolunteerFormData>(emptyForm);
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);
  const [periodLabel, setPeriodLabel] = useState("Last 12 months");
  const [moduleActivities, setModuleActivities] = useState<ActivityRecord[]>([]);

  const filterRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  async function refreshActivities() {
    const acts = await getActivities({ module: "volunteers", limit: 5 });
    setModuleActivities(acts);
  }

  useEffect(() => {
    async function loadVolunteers() {
      try {
        const firestoreVolunteers = (await getDocuments("volunteers")) as Volunteer[];
        setVolunteers(firestoreVolunteers);
        await refreshActivities();
      } catch (error) {
        console.error("Unable to load volunteers from Firestore.", error);
        setVolunteers([]);
        setModuleActivities([]);
      }
    }

    loadVolunteers();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenId(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredVolunteers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return volunteers.filter((volunteer) => {
      const matchesSearch =
        query === "" ||
        volunteer.name.toLowerCase().includes(query) ||
        volunteer.email.toLowerCase().includes(query) ||
        volunteer.role.toLowerCase().includes(query) ||
        volunteer.initiative.toLowerCase().includes(query) ||
        volunteer.availability.toLowerCase().includes(query) ||
        volunteer.status.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" || volunteer.status === statusFilter;

      const matchesInitiative =
        initiativeFilter === "All" || volunteer.initiative === initiativeFilter;

      return matchesSearch && matchesStatus && matchesInitiative;
    });
  }, [volunteers, searchQuery, statusFilter, initiativeFilter]);

  const activeFilterCount =
    Number(statusFilter !== "All") + Number(initiativeFilter !== "All");

  const kpiStats = useMemo(() => {
    const active = volunteers.filter((v) => v.status === "Active").length;
    const completed = volunteers.filter((v) => v.status === "Completed").length;
    const inProgress = volunteers.filter((v) => v.status === "In Progress").length;
    const needsAttention = volunteers.filter((v) => v.status === "Needs Attention").length;
    const initiatives = new Set(volunteers.map((v) => v.initiative).filter(Boolean)).size;
    const total = volunteers.length;

    return [
      {
        label: "Active Volunteers",
        value: String(active),
        detail: total === 0 ? "No volunteers yet" : `${total} total registered`,
        icon: Users,
      },
      {
        label: "Completed Assignments",
        value: String(completed),
        detail:
          total === 0
            ? "—"
            : `${Math.round((completed / total) * 100)}% completion rate`,
        icon: CheckCircle2,
      },
      {
        label: "Active Assignments",
        value: String(inProgress),
        detail:
          total === 0
            ? "—"
            : `Across ${initiatives} initiative${initiatives === 1 ? "" : "s"}`,
        icon: Clock3,
      },
      {
        label: "Needs Attention",
        value: String(needsAttention),
        detail: needsAttention > 0 ? "Review recommended" : "All volunteers on track",
        icon: TrendingUp,
      },
    ];
  }, [volunteers]);

  const performanceMetrics = useMemo(() => {
    if (volunteers.length === 0) {
      return [
        { label: "Active", value: 0, detail: "No volunteer data yet" },
        { label: "Completed", value: 0, detail: "No volunteer data yet" },
        { label: "In Progress", value: 0, detail: "No volunteer data yet" },
        { label: "Needs Attention", value: 0, detail: "No volunteer data yet" },
      ];
    }

    const total = volunteers.length;
    const active = volunteers.filter((v) => v.status === "Active").length;
    const completed = volunteers.filter((v) => v.status === "Completed").length;
    const inProgress = volunteers.filter((v) => v.status === "In Progress").length;
    const needsAttention = volunteers.filter((v) => v.status === "Needs Attention").length;

    return [
      {
        label: "Active",
        value: Math.round((active / total) * 100),
        detail: `${active} active volunteer${active === 1 ? "" : "s"}`,
      },
      {
        label: "Completed",
        value: Math.round((completed / total) * 100),
        detail: `${completed} completed assignment${completed === 1 ? "" : "s"}`,
      },
      {
        label: "In Progress",
        value: Math.round((inProgress / total) * 100),
        detail: `${inProgress} assignment${inProgress === 1 ? "" : "s"} in progress`,
      },
      {
        label: "Needs Attention",
        value: Math.round((needsAttention / total) * 100),
        detail: `${needsAttention} volunteer${needsAttention === 1 ? "" : "s"} need review`,
      },
    ];
  }, [volunteers]);

  const aiInsight = useMemo(() => {
    if (volunteers.length === 0) {
      return {
        title: "More data is required",
        body: "Add volunteers before insights can be generated.",
        recommendation: null as string | null,
      };
    }

    const needsAttention = volunteers.filter((v) => v.status === "Needs Attention").length;
    if (needsAttention > 0) {
      return {
        title: "Volunteers need attention",
        body: `${needsAttention} volunteer${needsAttention === 1 ? "" : "s"} flagged for review.`,
        recommendation:
          "Review volunteers marked as Needs Attention and update assignments or availability.",
      };
    }

    const inProgress = volunteers.filter((v) => v.status === "In Progress").length;
    if (inProgress > 0) {
      return {
        title: "Assignments in progress",
        body: `${inProgress} volunteer assignment${inProgress === 1 ? "" : "s"} currently underway.`,
        recommendation:
          "Confirm shift coverage and milestone dates for in-progress assignments.",
      };
    }

    return {
      title: "Volunteer roster healthy",
      body: `${volunteers.length} volunteer${volunteers.length === 1 ? "" : "s"} registered with no urgent flags.`,
      recommendation: "Consider recruiting for initiatives with upcoming delivery periods.",
    };
  }, [volunteers]);

  function closeForm() {
    setIsFormOpen(false);
    setEditingVolunteerId(null);
    setFormData(emptyForm);
  }

  function openAddVolunteer() {
    setEditingVolunteerId(null);
    setFormData({
      ...emptyForm,
      lastActivity: new Date().toISOString().slice(0, 10),
    });
    setIsFormOpen(true);
  }

  useModuleCreateAction(useCallback(() => openAddVolunteer(), []));

  function openEditVolunteer(volunteer: Volunteer) {
    setEditingVolunteerId(volunteer.id);
    setFormData({
      name: volunteer.name,
      email: volunteer.email,
      role: volunteer.role,
      initiative: volunteer.initiative,
      availability: volunteer.availability,
      hours: String(volunteer.hours),
      status: volunteer.status,
      lastActivity: volunteer.lastActivity,
    });
    setIsFormOpen(true);
    setMenuOpenId(null);
  }

  function updateFormField<K extends keyof VolunteerFormData>(
    field: K,
    value: VolunteerFormData[K],
  ) {
    setFormData((current) => ({ ...current, [field]: value }));
  }

  async function saveVolunteer() {
    const name = formData.name.trim();
    const email = formData.email.trim();
    const role = formData.role.trim();
    const initiative = formData.initiative.trim();
    const availability = formData.availability.trim();
    const hours = Number(formData.hours);

    if (!name) {
      alert("Please enter the volunteer name.");
      return;
    }

    if (!email || !email.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }

    if (!role) {
      alert("Please select a volunteer role.");
      return;
    }

    if (!initiative) {
      alert("Please select an initiative.");
      return;
    }

    if (!availability) {
      alert("Please select availability.");
      return;
    }

    if (!Number.isFinite(hours) || hours < 0) {
      alert("Hours contributed cannot be negative.");
      return;
    }

    if (!formData.lastActivity) {
      alert("Please enter the last activity date.");
      return;
    }

    const volunteerData: Volunteer = {
      id: editingVolunteerId ?? `volunteer-${Date.now()}`,
      name,
      email,
      role,
      initiative,
      availability,
      hours,
      status: formData.status,
      lastActivity: formData.lastActivity,
    };

    try {
      if (editingVolunteerId) {
        await updateDocument("volunteers", editingVolunteerId, volunteerData);
        setVolunteers((current) =>
          current.map((v) => (v.id === editingVolunteerId ? volunteerData : v)),
        );
        await logActivity({
          module: "volunteers",
          action: "updated",
          entityType: "volunteer",
          entityId: editingVolunteerId,
          entityName: name,
          description: `Volunteer "${name}" updated`,
        });
      } else {
        const firestoreId = await createDocument("volunteers", volunteerData);
        setVolunteers((current) => [
          { ...volunteerData, id: firestoreId },
          ...current,
        ]);
        await logActivity({
          module: "volunteers",
          action: "created",
          entityType: "volunteer",
          entityId: firestoreId,
          entityName: name,
          description: `Volunteer "${name}" added`,
        });
      }

      await refreshActivities();
      closeForm();
    } catch (error) {
      console.error("Unable to save volunteer.", error);
      alert("Unable to save volunteer. Please try again.");
    }
  }

  async function confirmDelete() {
    if (!volunteerToDelete) return;

    try {
      await deleteDocument("volunteers", volunteerToDelete.id);
      setVolunteers((current) =>
        current.filter((v) => v.id !== volunteerToDelete.id),
      );
      await logActivity({
        module: "volunteers",
        action: "deleted",
        entityType: "volunteer",
        entityId: volunteerToDelete.id,
        entityName: volunteerToDelete.name,
        description: `Volunteer "${volunteerToDelete.name}" removed`,
      });
      await refreshActivities();
      setVolunteerToDelete(null);
    } catch (error) {
      console.error("Unable to delete volunteer.", error);
      alert("Unable to delete volunteer. Please try again.");
    }
  }

  function cyclePeriodLabel() {
    setPeriodLabel((current) =>
      current === "Last 12 months" ? "Last 6 months" : "Last 12 months",
    );
  }

  return (
    <div className="hb-app vl-page">
      <HopeBridgeSidebar activePath="/dashboard/volunteers" />

      <main className="hb-module-main">
        <div className="mx-auto max-w-[1600px]">
          <nav className="hb-breadcrumb">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 hover:text-[#0d5f44]"
            >
              <Home size={14} className="text-[#0d5f44]" />
              HopeBridge Foundation
            </Link>
            <span className="text-[#c2cbc6]">/</span>
            <strong>Volunteers</strong>
          </nav>

          <header className="vl-hero" aria-label="Volunteer Operations">
            <div className="vl-hero-scene" aria-hidden="true" />

            <div className="vl-hero-emblem-wrap" aria-hidden="true">
              <svg className="vl-hero-emblem" viewBox="0 0 100 100" aria-hidden="true">
                <defs>
                  <radialGradient id="vlEmblemAura" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(255, 232, 156, 0.4)" />
                    <stop offset="68%" stopColor="rgba(241, 206, 85, 0.12)" />
                    <stop offset="100%" stopColor="rgba(212, 169, 40, 0)" />
                  </radialGradient>
                  <linearGradient id="vlEmblemGold" x1="30%" y1="15%" x2="70%" y2="85%">
                    <stop offset="0%" stopColor="#fff0c2" />
                    <stop offset="45%" stopColor="#f1ce55" />
                    <stop offset="100%" stopColor="#c99a1f" />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="47" fill="url(#vlEmblemAura)" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="rgba(255, 232, 156, 0.5)"
                  strokeWidth="1.2"
                />
                <g>
                  <path
                    d="M21 63 C19 54 24 46 32 44 C36 43 40 45 43 47 C46 44 50 42 54 44 C62 46 67 54 65 63 C57 69 50 70 43 69 C35 68 27 66 21 63 Z"
                    fill="rgba(255, 232, 156, 0.11)"
                    stroke="url(#vlEmblemGold)"
                    strokeWidth="1.9"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M28 61 Q50 52 72 61"
                    fill="none"
                    stroke="rgba(255, 232, 156, 0.55)"
                    strokeWidth="1.1"
                    strokeLinecap="round"
                  />
                  <circle cx="50" cy="35" r="4.3" fill="url(#vlEmblemGold)" />
                  <path
                    d="M50 39.3 L50 57"
                    stroke="url(#vlEmblemGold)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M50 45.5 L44.5 51.5 M50 45.5 L55.5 51.5"
                    stroke="url(#vlEmblemGold)"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </g>
              </svg>
            </div>

            <div className="vl-hero-readability" aria-hidden="true" />

            <div className="vl-hero-actions">
              <div className="vl-hero-search">
                <Search size={17} />
                <input
                  type="text"
                  placeholder="Search volunteers..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  aria-label="Search volunteers"
                />
              </div>

              <button type="button" className="vl-gold-btn" onClick={openAddVolunteer}>
                <UserPlus size={18} />
                Add Volunteer
              </button>
            </div>

            <div className="vl-hero-content">
              <div className="vl-hero-copy">
                <div className="vl-hero-pill">
                  <Sparkles size={13} strokeWidth={2} />
                  VOLUNTEER OPERATIONS
                </div>

                <h1 className="vl-hero-title">
                  Volunteer
                  <span className="vl-hero-title-gold">Management</span>
                </h1>

                <p className="vl-hero-desc">
                  Organize volunteers, assign responsibilities, monitor participation,
                  and track community engagement.
                </p>
              </div>
            </div>
          </header>

          <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {kpiStats.map((stat) => {
              const Icon = stat.icon;

              return (
                <article key={stat.label} className="vl-kpi-card">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-[#607269]">{stat.label}</p>
                      <p className="mt-3 font-serif text-4xl font-bold tracking-tight text-[#022c22]">
                        {stat.value}
                      </p>
                    </div>
                    <div className="vl-kpi-icon">
                      <Icon size={20} />
                    </div>
                  </div>
                  <p className="mt-5 text-sm text-[#65766e]">{stat.detail}</p>
                </article>
              );
            })}
          </section>

          <section className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <article className="vl-performance-panel">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#9f7b24]">
                    VOLUNTEER PERFORMANCE
                  </p>
                  <h2 className="mt-2 font-serif text-2xl font-bold text-[#18392e]">
                    Volunteer Engagement Performance
                  </h2>
                </div>

                <button type="button" className="vl-period-btn" onClick={cyclePeriodLabel}>
                  <CalendarDays size={16} />
                  {periodLabel}
                </button>
              </div>

              <div className="mt-8 space-y-6">
                {performanceMetrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="vl-metric-row"
                    onMouseEnter={() => setHoveredMetric(metric.label)}
                    onMouseLeave={() => setHoveredMetric(null)}
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-[#334b41]">{metric.label}</span>
                      <span className="font-semibold text-[#0d5f44]">{metric.value}%</span>
                    </div>
                    <div className="vl-progress-track mt-2">
                      <div
                        className="vl-progress-fill"
                        style={{ width: `${metric.value}%` }}
                      />
                    </div>
                    {hoveredMetric === metric.label && (
                      <p className="vl-metric-tooltip">{metric.detail}</p>
                    )}
                  </div>
                ))}
              </div>
            </article>

            <article className="vl-ai-panel">
              <div className="relative z-[1] flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#e4bf4f]">
                      HOPEBRIDGE AI
                    </p>
                    <span className="vl-ai-pulse" aria-hidden="true" />
                  </div>
                  <h2 className="mt-2 font-serif text-xl font-bold text-[#f7f3e8]">
                    Intelligent Recommendation
                  </h2>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-[13px] border border-[rgba(212,175,55,0.35)] bg-[rgba(212,175,55,0.12)] text-[#f3e5ab]">
                  <Sparkles size={21} />
                </div>
              </div>

              <div className="vl-ai-inner">
                <p className="font-medium text-[#f7f3e8]">{aiInsight.title}</p>
                <p className="mt-3 text-sm leading-6 text-[rgba(247,243,232,0.68)]">
                  {aiInsight.body}
                </p>
                {aiInsight.recommendation && (
                  <p className="mt-4 text-sm leading-6 text-[rgba(247,243,232,0.78)]">
                    <span className="font-semibold text-[#f3e5ab]">Recommendation:</span>{" "}
                    {aiInsight.recommendation}
                  </p>
                )}
              </div>

              <Link href="/dashboard/ai-assistant" className="vl-ai-link">
                View Recommendation
                <ArrowRight size={17} />
              </Link>
            </article>
          </section>

          <section className="vl-activity-panel mt-8">
            <div>
              <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#e4bf4f]">
                LATEST UPDATES
              </p>
              <h2 className="mt-2 font-serif text-xl font-bold text-[#f7f3e8]">
                Recent Activity
              </h2>
            </div>

            <div className="vl-timeline">
              {moduleActivities.length === 0 ? (
                <p className="text-sm text-[rgba(247,243,232,0.58)]">No activity yet.</p>
              ) : (
                moduleActivities.map((activity) => (
                  <div key={activity.id} className="vl-timeline-item">
                    <span className="vl-timeline-node" aria-hidden="true" />
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-[#f7f3e8]">{activity.description}</p>
                        {activity.entityName && (
                          <p className="mt-1 text-xs leading-5 text-[rgba(247,243,232,0.58)]">
                            {activity.entityName}
                          </p>
                        )}
                      </div>
                      <span className="mt-1 shrink-0 text-[11px] text-[rgba(247,243,232,0.42)] sm:mt-0">
                        {formatActivityTime(activity.createdAt)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="vl-table-panel mt-8">
            <div className="vl-table-toolbar">
              <div>
                <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#9f7b24]">
                  VOLUNTEER OPERATIONS
                </p>
                <h2 className="mt-2 font-serif text-xl font-bold text-[#18392e]">
                  Volunteer Management
                </h2>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative" ref={filterRef}>
                  <button
                    type="button"
                    className="vl-secondary-btn"
                    onClick={() => setIsFilterOpen((open) => !open)}
                  >
                    <Filter size={17} />
                    Filter
                    {activeFilterCount > 0 && (
                      <span className="rounded-full bg-[#0d5f44] px-2 py-0.5 text-xs text-white">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>

                  {isFilterOpen && (
                    <div className="vl-filter-panel">
                      <label htmlFor="vl-status-filter" className="text-xs font-bold uppercase tracking-wide text-[#65766e]">
                        Status
                      </label>
                      <select
                        id="vl-status-filter"
                        value={statusFilter}
                        onChange={(event) =>
                          setStatusFilter(event.target.value as VolunteerStatus | "All")
                        }
                        className="vl-input mb-4 mt-1 w-full rounded-xl px-3 py-2.5 text-sm"
                      >
                        <option value="All">All</option>
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>

                      <label htmlFor="vl-initiative-filter" className="text-xs font-bold uppercase tracking-wide text-[#65766e]">
                        Initiative
                      </label>
                      <select
                        id="vl-initiative-filter"
                        value={initiativeFilter}
                        onChange={(event) => setInitiativeFilter(event.target.value)}
                        className="vl-input mb-4 mt-1 w-full rounded-xl px-3 py-2.5 text-sm"
                      >
                        <option value="All">All</option>
                        {INITIATIVES.map((initiative) => (
                          <option key={initiative} value={initiative}>
                            {initiative}
                          </option>
                        ))}
                      </select>

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="vl-secondary-btn"
                          onClick={() => {
                            setStatusFilter("All");
                            setInitiativeFilter("All");
                          }}
                        >
                          Reset
                        </button>
                        <button
                          type="button"
                          className="vl-gold-btn"
                          onClick={() => setIsFilterOpen(false)}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button type="button" className="vl-gold-btn" onClick={openAddVolunteer}>
                  <Plus size={17} />
                  New Volunteer
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="vl-table w-full min-w-[1050px] text-left">
                <thead>
                  <tr>
                    <th>Volunteer</th>
                    <th>Role</th>
                    <th>Initiative</th>
                    <th>Availability</th>
                    <th>Hours</th>
                    <th>Status</th>
                    <th>Last Activity</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVolunteers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-14 text-center text-[#65766e]">
                        <Search size={32} className="mx-auto text-[#c2cbc6]" />
                        <p className="mt-3 font-medium text-[#18392e]">No volunteers found</p>
                        <p className="mt-1 text-sm">Adjust your search or filters.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredVolunteers.map((volunteer) => (
                      <tr key={volunteer.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(212,175,55,0.28)] bg-gradient-to-br from-[rgba(13,95,68,0.08)] to-[rgba(243,229,171,0.14)] text-sm font-bold text-[#022c22]">
                              {getInitials(volunteer.name)}
                            </div>
                            <div>
                              <p className="font-medium text-[#112e24]">{volunteer.name}</p>
                              <p className="mt-0.5 text-xs text-[#65766e]">{volunteer.email}</p>
                            </div>
                          </div>
                        </td>
                        <td>{volunteer.role}</td>
                        <td>{volunteer.initiative}</td>
                        <td className="text-[#65766e]">{volunteer.availability}</td>
                        <td className="font-semibold text-[#0d5f44]">{volunteer.hours}</td>
                        <td>
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(volunteer.status)}`}
                          >
                            {volunteer.status}
                          </span>
                        </td>
                        <td className="text-[#65766e]">{formatDate(volunteer.lastActivity)}</td>
                        <td>
                          <div
                            className="relative flex items-center gap-1.5"
                            ref={menuOpenId === volunteer.id ? menuRef : undefined}
                          >
                            <button
                              type="button"
                              className="vl-view-btn"
                              aria-label={`View ${volunteer.name}`}
                              onClick={() => {
                                setViewingVolunteer(volunteer);
                                setMenuOpenId(null);
                              }}
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              type="button"
                              className="vl-edit-btn"
                              aria-label={`Edit ${volunteer.name}`}
                              onClick={() => openEditVolunteer(volunteer)}
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              type="button"
                              className="vl-delete-btn"
                              aria-label={`Delete ${volunteer.name}`}
                              onClick={() => setVolunteerToDelete(volunteer)}
                            >
                              <Trash2 size={16} />
                            </button>
                            <button
                              type="button"
                              className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] border border-transparent text-[#65766e] transition hover:border-[rgba(212,175,55,0.3)] hover:bg-[rgba(243,229,171,0.18)]"
                              aria-label={`More actions for ${volunteer.name}`}
                              onClick={() =>
                                setMenuOpenId((current) =>
                                  current === volunteer.id ? null : volunteer.id,
                                )
                              }
                            >
                              <MoreHorizontal size={16} />
                            </button>

                            {menuOpenId === volunteer.id && (
                              <div className="vl-action-menu">
                                <button type="button" onClick={() => setViewingVolunteer(volunteer)}>
                                  <Eye size={15} />
                                  View
                                </button>
                                <button type="button" onClick={() => openEditVolunteer(volunteer)}>
                                  <Edit3 size={15} />
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="danger"
                                  onClick={() => setVolunteerToDelete(volunteer)}
                                >
                                  <Trash2 size={15} />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>

      {isFormOpen && (
        <div className="vl-overlay fixed inset-0 z-[100] flex items-center justify-center px-4 py-6">
          <div className="hb-modal relative max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-[22px] p-6 sm:p-8">
            <button
              type="button"
              onClick={closeForm}
              className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-xl border border-[#e4dac6] bg-[#fffdfa] text-[#65766e] transition hover:bg-[#f4f7f4]"
              aria-label="Close volunteer form"
            >
              <X size={19} />
            </button>

            <div className="vl-modal-dark-header mb-6">
              <p className="flex items-center gap-2 text-[10px] font-extrabold tracking-[0.14em] text-[#e4bf4f]">
                <Sparkles size={15} />
                VOLUNTEER OPERATIONS
              </p>
              <h2 className="mt-2 font-serif text-2xl font-bold text-[#f7f3e8]">
                {editingVolunteerId ? "Edit Volunteer" : "Add Volunteer"}
              </h2>
              <p className="mt-2 text-sm text-[rgba(247,243,232,0.62)]">
                {editingVolunteerId
                  ? "Update volunteer details and save changes to the roster."
                  : "Register a new volunteer, assign their role, and track participation."}
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-[#334b41]">Full name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(event) => updateFormField("name", event.target.value)}
                  className="vl-input mt-2 w-full rounded-xl px-4 py-3 text-sm"
                  placeholder="Enter volunteer name"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-[#334b41]">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(event) => updateFormField("email", event.target.value)}
                  className="vl-input mt-2 w-full rounded-xl px-4 py-3 text-sm"
                  placeholder="volunteer@example.com"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[#334b41]">Role</label>
                <select
                  value={formData.role}
                  onChange={(event) => updateFormField("role", event.target.value)}
                  className="vl-input mt-2 w-full rounded-xl px-4 py-3 text-sm"
                >
                  <option value="">Select role</option>
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-[#334b41]">Initiative</label>
                <select
                  value={formData.initiative}
                  onChange={(event) => updateFormField("initiative", event.target.value)}
                  className="vl-input mt-2 w-full rounded-xl px-4 py-3 text-sm"
                >
                  <option value="">Select initiative</option>
                  {INITIATIVES.map((initiative) => (
                    <option key={initiative} value={initiative}>
                      {initiative}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-[#334b41]">Availability</label>
                <select
                  value={formData.availability}
                  onChange={(event) => updateFormField("availability", event.target.value)}
                  className="vl-input mt-2 w-full rounded-xl px-4 py-3 text-sm"
                >
                  <option value="">Select availability</option>
                  {AVAILABILITY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-[#334b41]">Hours contributed</label>
                <input
                  type="number"
                  min="0"
                  value={formData.hours}
                  onChange={(event) => updateFormField("hours", event.target.value)}
                  className="vl-input mt-2 w-full rounded-xl px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[#334b41]">Status</label>
                <select
                  value={formData.status}
                  onChange={(event) =>
                    updateFormField("status", event.target.value as VolunteerStatus)
                  }
                  className="vl-input mt-2 w-full rounded-xl px-4 py-3 text-sm"
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-[#334b41]">Last activity</label>
                <input
                  type="date"
                  value={formData.lastActivity}
                  onChange={(event) => updateFormField("lastActivity", event.target.value)}
                  className="vl-input mt-2 w-full rounded-xl px-4 py-3 text-sm"
                />
              </div>
            </div>

            <div className="mt-8 flex flex-wrap justify-end gap-3">
              <button type="button" className="vl-secondary-btn" onClick={closeForm}>
                Cancel
              </button>
              <button type="button" className="vl-gold-btn" onClick={saveVolunteer}>
                {editingVolunteerId ? "Save Changes" : "Create Volunteer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingVolunteer && (
        <div
          className="vl-overlay fixed inset-0 z-[100] flex items-center justify-center px-4 py-6"
          onClick={() => setViewingVolunteer(null)}
        >
          <div
            className="hb-modal w-full max-w-lg rounded-[22px] p-6 sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#9f7b24]">
                  VOLUNTEER PROFILE
                </p>
                <h2 className="mt-2 font-serif text-2xl font-bold text-[#18392e]">
                  {viewingVolunteer.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setViewingVolunteer(null)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e4dac6] bg-[#fffdfa] text-[#65766e]"
                aria-label="Close volunteer details"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 space-y-3 text-sm text-[#607269]">
              <p><strong className="text-[#18392e]">Email:</strong> {viewingVolunteer.email}</p>
              <p><strong className="text-[#18392e]">Role:</strong> {viewingVolunteer.role}</p>
              <p><strong className="text-[#18392e]">Initiative:</strong> {viewingVolunteer.initiative}</p>
              <p><strong className="text-[#18392e]">Availability:</strong> {viewingVolunteer.availability}</p>
              <p><strong className="text-[#18392e]">Hours:</strong> {viewingVolunteer.hours}</p>
              <p><strong className="text-[#18392e]">Status:</strong> {viewingVolunteer.status}</p>
              <p><strong className="text-[#18392e]">Last Activity:</strong> {formatDate(viewingVolunteer.lastActivity)}</p>
            </div>

            <div className="mt-8 flex flex-wrap justify-end gap-3">
              <button type="button" className="vl-secondary-btn" onClick={() => setViewingVolunteer(null)}>
                Close
              </button>
              <button
                type="button"
                className="vl-gold-btn"
                onClick={() => {
                  openEditVolunteer(viewingVolunteer);
                  setViewingVolunteer(null);
                }}
              >
                Edit Volunteer
              </button>
            </div>
          </div>
        </div>
      )}

      {volunteerToDelete && (
        <div className="vl-overlay fixed inset-0 z-[100] flex items-center justify-center px-4 py-6">
          <div className="hb-modal w-full max-w-md rounded-[22px] p-6 sm:p-8">
            <h2 className="font-serif text-xl font-bold text-[#18392e]">Delete Volunteer</h2>
            <p className="mt-3 text-sm leading-6 text-[#607269]">
              Are you sure you want to remove{" "}
              <strong className="text-[#18392e]">{volunteerToDelete.name}</strong> from the
              volunteer roster? This action cannot be undone.
            </p>

            <div className="mt-8 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                className="vl-secondary-btn"
                onClick={() => setVolunteerToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-[#fecdd3] bg-[#fff1f2] px-5 py-3 text-sm font-semibold text-[#be123c] transition hover:bg-[#ffe4e6]"
                onClick={confirmDelete}
              >
                <Trash2 size={16} />
                Delete Volunteer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
