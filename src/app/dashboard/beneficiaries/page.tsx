"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  ClipboardList,
  Download,
  Filter,
  HandHeart,
  Home,
  MapPin,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import HopeBridgeSidebar from "../components/HopeBridgeSidebar";
import {
  createDocument,
  deleteDocument,
  getDocuments,
  updateDocument,
} from "../../../services/firestore";
import { logActivity } from "../../../services/activity";
import { useModuleCreateAction } from "@/hooks/useModuleCreateAction";
import BeneficiaryFormModal from "./components/BeneficiaryFormModal";
import BeneficiaryProfileDrawer from "./components/BeneficiaryProfileDrawer";
import CommunityReachMap from "./components/CommunityReachMap";
import type {
  ActivityEvent,
  Beneficiary,
  BeneficiaryFilters,
  BeneficiaryFormData,
  ProfileTab,
} from "./types";
import {
  calculateJourneyProgress,
  calculateKpis,
  calculateOutcomes,
  calculateRegionReach,
  calculateSupportDistribution,
  filterBeneficiaries,
  formatDate,
  formatRelativeTime,
  generateBeneficiaryId,
  getActiveFilterChips,
  getFollowUpCases,
  getFollowUpClass,
  getInitials,
  getStatusClass,
  sortActivity,
} from "./utils";
import "./beneficiaries.css";

const INITIAL_FILTERS: BeneficiaryFilters = {
  search: "",
  program: "All",
  supportType: "All",
  status: "All",
  location: "All",
  followUpStatus: "All",
  coordinator: "All",
};

const EMPTY_FORM: BeneficiaryFormData = {
  name: "",
  beneficiaryId: "",
  location: "",
  region: "",
  program: "",
  supportType: "",
  status: "Enrolled",
  journeyStage: "Enrolled",
  followUpStatus: "None",
  coordinator: "",
  enrollmentDate: new Date().toISOString().slice(0, 10),
  lastSupportDate: "",
  nextFollowUp: "",
  outcomeStatus: "Pending",
  notes: "",
};

const PIE_COLORS = ["#0d5f44", "#d4af37", "#022c22", "#6ee7b7", "#c9a227", "#34d399"];

type KpiFocus = "all" | "served" | "new" | "followup";

export default function BeneficiariesPage() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [filters, setFilters] = useState<BeneficiaryFilters>(INITIAL_FILTERS);
  const [draftFilters, setDraftFilters] = useState<BeneficiaryFilters>(INITIAL_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [kpiFocus, setKpiFocus] = useState<KpiFocus>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<BeneficiaryFormData>(EMPTY_FORM);
  const [profileBeneficiary, setProfileBeneficiary] = useState<Beneficiary | null>(null);
  const [profileTab, setProfileTab] = useState<ProfileTab>("overview");
  const [deleteTarget, setDeleteTarget] = useState<Beneficiary | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [searchFocus, setSearchFocus] = useState(false);
  const directoryRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const [firestoreBeneficiaries, firestoreActivity] = await Promise.all([
          getDocuments("beneficiaries") as Promise<Beneficiary[]>,
          getDocuments("beneficiaryActivity") as Promise<ActivityEvent[]>,
        ]);

        setBeneficiaries(firestoreBeneficiaries);
        setActivity(sortActivity(firestoreActivity));
      } catch (error) {
        console.error("Unable to load beneficiaries.", error);
        setLoadError("Unable to load beneficiary records.");
        setBeneficiaries([]);
        setActivity([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const kpis = useMemo(() => calculateKpis(beneficiaries), [beneficiaries]);
  const journey = useMemo(() => calculateJourneyProgress(beneficiaries), [beneficiaries]);
  const supportDistribution = useMemo(
    () => calculateSupportDistribution(beneficiaries),
    [beneficiaries],
  );
  const regionReach = useMemo(() => calculateRegionReach(beneficiaries), [beneficiaries]);
  const outcomes = useMemo(() => calculateOutcomes(beneficiaries), [beneficiaries]);
  const followUpCases = useMemo(() => getFollowUpCases(beneficiaries), [beneficiaries]);

  const filteredBeneficiaries = useMemo(() => {
    let list = filterBeneficiaries(beneficiaries, filters);

    if (kpiFocus === "served") {
      list = list.filter(
        (b) => b.status === "Active" || b.journeyStage === "Service Active",
      );
    } else if (kpiFocus === "new") {
      list = list.filter((b) => {
        const d = new Date(`${b.enrollmentDate}T00:00:00`);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30);
        return d >= cutoff;
      });
    } else if (kpiFocus === "followup") {
      list = list.filter(
        (b) =>
          b.followUpStatus === "Required" ||
          b.followUpStatus === "Overdue" ||
          b.status === "Follow-Up Required",
      );
    }

    return list;
  }, [beneficiaries, filters, kpiFocus]);

  const filterChips = useMemo(() => getActiveFilterChips(filters), [filters]);
  const visibleActivity = showAllActivity ? activity : activity.slice(0, 5);

  const appendActivity = useCallback(
    async (event: Omit<ActivityEvent, "id">) => {
      try {
        const id = await createDocument("beneficiaryActivity", event);
        const full = { ...event, id };
        setActivity((current) => sortActivity([full, ...current]));
      } catch {
        const full = { ...event, id: `act-${Date.now()}` };
        setActivity((current) => sortActivity([full, ...current]));
      }
    },
    [],
  );

  function scrollToDirectory() {
    directoryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function openAddForm() {
    setEditingId(null);
    setFormData({
      ...EMPTY_FORM,
      beneficiaryId: generateBeneficiaryId(beneficiaries),
      enrollmentDate: new Date().toISOString().slice(0, 10),
    });
    setIsFormOpen(true);
  }

  useModuleCreateAction(useCallback(() => openAddForm(), [beneficiaries]));

  function openEditForm(beneficiary: Beneficiary) {
    setEditingId(beneficiary.id);
    setFormData({
      name: beneficiary.name,
      beneficiaryId: beneficiary.beneficiaryId,
      location: beneficiary.location,
      region: beneficiary.region,
      program: beneficiary.program,
      supportType: beneficiary.supportType,
      status: beneficiary.status,
      journeyStage: beneficiary.journeyStage,
      followUpStatus: beneficiary.followUpStatus,
      coordinator: beneficiary.coordinator,
      enrollmentDate: beneficiary.enrollmentDate,
      lastSupportDate: beneficiary.lastSupportDate,
      nextFollowUp: beneficiary.nextFollowUp,
      outcomeStatus: beneficiary.outcomeStatus,
      notes: beneficiary.notes,
    });
    setIsFormOpen(true);
    setProfileBeneficiary(null);
  }

  function updateFormField<K extends keyof BeneficiaryFormData>(
    field: K,
    value: BeneficiaryFormData[K],
  ) {
    setFormData((current) => ({ ...current, [field]: value }));
  }

  async function saveBeneficiary(andAddAnother = false) {
    const name = formData.name.trim();
    if (!name) {
      alert("Please enter the beneficiary name.");
      return;
    }
    if (!formData.beneficiaryId.trim()) {
      alert("Please enter a beneficiary ID.");
      return;
    }
    if (!formData.region || !formData.program || !formData.supportType) {
      alert("Please complete location, program, and support information.");
      return;
    }
    if (!formData.coordinator) {
      alert("Please assign a case coordinator.");
      return;
    }

    const data: Beneficiary = {
      id: editingId ?? `ben-${Date.now()}`,
      name,
      beneficiaryId: formData.beneficiaryId.trim(),
      location: formData.location.trim(),
      region: formData.region,
      program: formData.program,
      supportType: formData.supportType,
      status: formData.status,
      journeyStage: formData.journeyStage,
      followUpStatus: formData.followUpStatus,
      coordinator: formData.coordinator,
      enrollmentDate: formData.enrollmentDate,
      lastSupportDate: formData.lastSupportDate,
      nextFollowUp: formData.nextFollowUp,
      outcomeStatus: formData.outcomeStatus,
      notes: formData.notes.trim(),
    };

    try {
      if (editingId) {
        await updateDocument("beneficiaries", editingId, data);
        setBeneficiaries((current) =>
          current.map((b) => (b.id === editingId ? data : b)),
        );
        await appendActivity({
          beneficiaryId: data.id,
          beneficiaryName: data.name,
          type: "Status Updated",
          detail: `Beneficiary profile updated for ${data.program}.`,
          createdAt: new Date().toISOString(),
        });
      } else {
        const firestoreId = await createDocument("beneficiaries", data);
        const saved = { ...data, id: firestoreId };
        setBeneficiaries((current) => [saved, ...current]);
        await logActivity({
          module: "beneficiaries",
          action: "created",
          entityType: "beneficiary",
          entityId: firestoreId,
          entityName: saved.name,
          description: `Beneficiary "${saved.name}" enrolled in ${saved.program}.`,
        });
        await appendActivity({
          beneficiaryId: saved.id,
          beneficiaryName: saved.name,
          type: "Beneficiary Enrolled",
          detail: `Enrolled in ${saved.program} — ${saved.supportType}.`,
          createdAt: new Date().toISOString(),
        });
      }

      if (andAddAnother) {
        setFormData({
          ...EMPTY_FORM,
          beneficiaryId: generateBeneficiaryId([...beneficiaries, data]),
          enrollmentDate: new Date().toISOString().slice(0, 10),
        });
        setEditingId(null);
      } else {
        setIsFormOpen(false);
        setEditingId(null);
        setFormData(EMPTY_FORM);
      }
    } catch (error) {
      console.error("Save failed", error);
      alert("Unable to save beneficiary. Please try again.");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteDocument("beneficiaries", deleteTarget.id);
      setBeneficiaries((current) => current.filter((b) => b.id !== deleteTarget.id));
      await logActivity({
        module: "beneficiaries",
        action: "deleted",
        entityType: "beneficiary",
        entityId: deleteTarget.id,
        entityName: deleteTarget.name,
        description: `Beneficiary "${deleteTarget.name}" removed.`,
      });
      setDeleteTarget(null);
      setProfileBeneficiary(null);
    } catch (error) {
      console.error("Delete failed", error);
      alert("Unable to delete beneficiary.");
    }
  }

  function applyFilters() {
    setFilters(draftFilters);
    setIsFilterOpen(false);
    scrollToDirectory();
  }

  function clearFilters() {
    setFilters(INITIAL_FILTERS);
    setDraftFilters(INITIAL_FILTERS);
    setKpiFocus("all");
  }

  function removeFilterChip(key: keyof BeneficiaryFilters) {
    const next = { ...filters, [key]: "All" as never };
    setFilters(next);
    setDraftFilters(next);
  }

  function exportReport() {
    const rows = [
      ["ID", "Name", "Program", "Region", "Support", "Status", "Coordinator"],
      ...filteredBeneficiaries.map((b) => [
        b.beneficiaryId,
        b.name,
        b.program,
        b.region,
        b.supportType,
        b.status,
        b.coordinator,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "hopebridge-beneficiaries.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function focusFollowUps() {
    setKpiFocus("followup");
    setFilters((f) => ({ ...f, followUpStatus: "All" }));
    scrollToDirectory();
  }

  return (
    <div className="hb-app bf-page">
      <HopeBridgeSidebar activePath="/dashboard/beneficiaries" />

      <main className="hb-module-main">
        <div className="mx-auto max-w-[1680px]">
          <nav className="hb-breadcrumb">
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 hover:text-[#0d5f44]">
              <Home size={14} className="text-[#0d5f44]" />
              HopeBridge Foundation
            </Link>
            <span className="text-[#c2cbc6]">/</span>
            <strong>Beneficiaries</strong>
          </nav>

          {loadError && (
            <div className="mt-4 rounded-xl border border-[#fecdd3] bg-[#fff1f2] px-4 py-3 text-sm text-[#be123c]">
              {loadError}
            </div>
          )}

          {/* Hero */}
          <header className="bf-hero" aria-label="Beneficiary Intelligence">
            <div className="bf-hero-scene" aria-hidden="true">
              <img
                src="/hopebridge/beneficiaries/hero-beneficiary-outreach.png"
                alt=""
                className="bf-hero-scene-img"
                draggable={false}
              />
            </div>
            <div className="bf-hero-readability" aria-hidden="true" />
            <div className="bf-hero-glow" aria-hidden="true" />

            <div className="bf-hero-content">
              <div className="bf-hero-copy">
                <div className="bf-hero-eyebrow">
                  COMMUNITY IMPACT <span>•</span> BENEFICIARY SERVICES
                </div>
                <h1 className="bf-hero-title">
                  Beneficiary <em>Intelligence</em>
                </h1>
                <p className="bf-hero-desc">
                  Understand every person and community HopeBridge serves — from enrollment
                  and support delivery to outcomes, follow-ups and long-term impact.
                </p>
                <div className="bf-hero-actions">
                  <button type="button" className="bf-gold-btn" onClick={openAddForm}>
                    <Plus size={18} />
                    Add Beneficiary
                  </button>
                  <button
                    type="button"
                    className="bf-glass-btn"
                    onClick={() => {
                      setSearchFocus(true);
                      scrollToDirectory();
                    }}
                  >
                    <Search size={17} />
                    Find Beneficiary
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* KPIs */}
          <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { key: "all" as KpiFocus, label: "Total Beneficiaries", value: kpis.total, detail: "People represented in the system", icon: Users },
              { key: "served" as KpiFocus, label: "Currently Served", value: kpis.currentlyServed, detail: "Receiving active support", icon: HandHeart },
              { key: "new" as KpiFocus, label: "New This Period", value: kpis.newThisPeriod, detail: "Enrolled in the last 30 days", icon: UserPlus },
              { key: "followup" as KpiFocus, label: "Needs Follow-Up", value: kpis.needsFollowUp, detail: "Pending service requirements", icon: AlertTriangle },
            ].map((kpi) => {
              const Icon = kpi.icon;
              return (
                <button
                  key={kpi.key}
                  type="button"
                  className={`bf-kpi-card ${kpiFocus === kpi.key ? "active" : ""}`}
                  onClick={() => {
                    setKpiFocus(kpi.key);
                    scrollToDirectory();
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-[#607269]">{kpi.label}</p>
                      <p className="mt-3 font-serif text-4xl font-bold text-[#022c22]">
                        {isLoading ? "—" : kpi.value}
                      </p>
                    </div>
                    <div className="bf-kpi-icon"><Icon size={20} /></div>
                  </div>
                  <p className="mt-5 text-sm text-[#65766e]">{kpi.detail}</p>
                </button>
              );
            })}
          </section>

          {/* Directory */}
          <section ref={directoryRef} className="bf-panel-light mt-8 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[rgba(234,216,177,0.45)] p-6">
              <div>
                <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#9f7b24]">BENEFICIARY DIRECTORY</p>
                <h2 className="mt-2 font-serif text-xl font-bold text-[#18392e]">People & Households</h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className={`bf-search-input min-w-[220px] ${searchFocus ? "ring-2 ring-[rgba(212,175,55,0.2)]" : ""}`}>
                  <Search size={16} className="text-[#0d5f44]" />
                  <input
                    placeholder="Search beneficiaries..."
                    value={filters.search}
                    onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                    onFocus={() => setSearchFocus(true)}
                    onBlur={() => setSearchFocus(false)}
                  />
                </div>
                <button type="button" className="bf-secondary-btn" onClick={() => { setDraftFilters(filters); setIsFilterOpen(true); }}>
                  <Filter size={16} /> Filters
                </button>
                <button type="button" className="bf-gold-btn" onClick={openAddForm}>
                  <Plus size={16} /> Add Beneficiary
                </button>
              </div>
            </div>

            {filterChips.length > 0 && (
              <div className="flex flex-wrap gap-2 px-6 py-3">
                {filterChips.map((chip) => (
                  <span key={chip.key} className="bf-filter-chip">
                    {chip.label}: {chip.value}
                    <button type="button" onClick={() => removeFilterChip(chip.key)} aria-label={`Remove ${chip.label} filter`}>
                      <X size={14} />
                    </button>
                  </span>
                ))}
                <button type="button" className="text-xs font-semibold text-[#0d5f44]" onClick={clearFilters}>
                  Clear all
                </button>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="bf-table w-full min-w-[1100px]">
                <thead>
                  <tr>
                    <th>Beneficiary</th>
                    <th>ID</th>
                    <th>Program</th>
                    <th>Location</th>
                    <th>Support</th>
                    <th>Status</th>
                    <th>Last Support</th>
                    <th>Next Follow-Up</th>
                    <th>Coordinator</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={10} className="px-6 py-12 text-center text-[#65766e]">Loading beneficiary records…</td></tr>
                  ) : filteredBeneficiaries.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-14 text-center">
                        <p className="font-medium text-[#18392e]">No beneficiaries match these filters.</p>
                        <div className="mt-4 flex justify-center gap-3">
                          <button type="button" className="bf-secondary-btn" onClick={clearFilters}>Clear Filters</button>
                          <button type="button" className="bf-gold-btn" onClick={openAddForm}>Add Beneficiary</button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredBeneficiaries.map((b) => (
                      <tr key={b.id} onClick={() => { setProfileBeneficiary(b); setProfileTab("overview"); }}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[rgba(212,175,55,0.28)] bg-gradient-to-br from-[rgba(13,95,68,0.08)] to-[rgba(243,229,171,0.14)] text-xs font-bold text-[#022c22]">
                              {getInitials(b.name)}
                            </div>
                            <span className="font-medium">{b.name}</span>
                          </div>
                        </td>
                        <td className="text-xs text-[#65766e]">{b.beneficiaryId}</td>
                        <td>{b.program}</td>
                        <td className="text-[#65766e]">{b.location}</td>
                        <td>{b.supportType}</td>
                        <td><span className={getStatusClass(b.status)}>{b.status}</span></td>
                        <td className="text-[#65766e]">{formatDate(b.lastSupportDate)}</td>
                        <td className={getFollowUpClass(b.followUpStatus)}>{formatDate(b.nextFollowUp) || "—"}</td>
                        <td className="text-[#65766e]">{b.coordinator}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="relative" ref={menuOpenId === b.id ? menuRef : undefined}>
                            <button type="button" className="rounded-lg p-2 text-[#65766e] hover:bg-[rgba(243,229,171,0.2)]" onClick={() => setMenuOpenId(menuOpenId === b.id ? null : b.id)}>
                              <MoreHorizontal size={16} />
                            </button>
                            {menuOpenId === b.id && (
                              <div className="absolute right-0 top-full z-20 min-w-[160px] rounded-xl border border-[#e4dac6] bg-white p-1 shadow-lg">
                                <button type="button" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-[rgba(234,216,177,0.2)]" onClick={() => { setProfileBeneficiary(b); setMenuOpenId(null); }}>View Profile</button>
                                <button type="button" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-[rgba(234,216,177,0.2)]" onClick={() => openEditForm(b)}>Edit</button>
                                <button type="button" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#be123c] hover:bg-[#fff1f2]" onClick={() => { setDeleteTarget(b); setMenuOpenId(null); }}>Delete</button>
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

          {/* Journey + Support + Outcomes row */}
          <section className="mt-8 grid gap-6 xl:grid-cols-3">
            <article className="bf-panel-dark p-6 xl:col-span-1">
              <div className="relative z-[1]">
                <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#e4bf4f]">BENEFICIARY JOURNEY</p>
                <h2 className="mt-2 font-serif text-lg font-bold text-[#f7f3e8]">Service Journey Stages</h2>
                <div className="bf-journey-track mt-6">
                  {journey.map((step) => (
                    <div key={step.stage} className="bf-journey-node">
                      <div className="bf-journey-dot">{step.count}</div>
                      <p className="bf-journey-label">{step.stage}</p>
                      <p className="bf-journey-count">{step.percentage}%</p>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <article className="bf-panel-light p-6">
              <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#9f7b24]">SUPPORT & SERVICES</p>
              <h2 className="mt-2 font-serif text-lg font-bold text-[#18392e]">Service Distribution</h2>
              <div className="mt-4 h-52">
                {supportDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={supportDistribution}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={72}
                        paddingAngle={3}
                        onClick={(_, index) => {
                          const entry = supportDistribution[index];
                          if (!entry) return;
                          setFilters((f) => ({
                            ...f,
                            supportType: f.supportType === entry.name ? "All" : entry.name,
                          }));
                          scrollToDirectory();
                        }}
                      >
                        {supportDistribution.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="rgba(255,255,255,0.8)" />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value} beneficiaries`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="flex h-full items-center justify-center text-sm text-[#65766e]">No service data yet.</p>
                )}
              </div>
            </article>

            <article className="bf-panel-light p-6">
              <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#9f7b24]">OUTCOME TRACKING</p>
              <h2 className="mt-2 font-serif text-lg font-bold text-[#18392e]">Measuring Change</h2>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  { label: "Services Delivered", value: outcomes.servicesDelivered },
                  { label: "Positive Outcomes", value: outcomes.positiveOutcomes },
                  { label: "Follow-Ups Completed", value: outcomes.followUpsCompleted },
                  { label: "Reviews Pending", value: outcomes.reviewsPending },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-[rgba(228,218,198,0.75)] bg-[#fffef9] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#65766e]">{item.label}</p>
                    <p className="mt-1 font-serif text-2xl font-bold text-[#022c22]">{item.value}</p>
                  </div>
                ))}
              </div>
            </article>
          </section>

          {/* Community Reach + Needs + AI + Quick Actions */}
          <section className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_1fr]">
            <article className="bf-panel-dark p-6">
              <div className="relative z-[1] mb-4">
                <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#e4bf4f]">COMMUNITY REACH</p>
                <h2 className="mt-2 font-serif text-lg font-bold text-[#f7f3e8]">Geographic Service Coverage</h2>
              </div>
              <CommunityReachMap
                regions={regionReach}
                activeRegion={filters.location}
                onSelectRegion={(region) => {
                  setFilters((f) => ({ ...f, location: region }));
                  scrollToDirectory();
                }}
              />
            </article>

            <div className="space-y-6">
              <article className="bf-panel-light p-5">
                <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#9f7b24]">QUICK ACTIONS</p>
                <div className="mt-4 space-y-2">
                  <button type="button" className="bf-quick-action" onClick={openAddForm}><UserPlus size={16} /> Add Beneficiary</button>
                  <button type="button" className="bf-quick-action" onClick={() => { setSearchFocus(true); scrollToDirectory(); }}><Search size={16} /> Find Beneficiary</button>
                  <button type="button" className="bf-quick-action" onClick={focusFollowUps}><CalendarCheck size={16} /> Review Follow-Ups</button>
                  <button type="button" className="bf-quick-action" onClick={focusFollowUps}><ClipboardList size={16} /> View Service Needs</button>
                  <button type="button" className="bf-quick-action" onClick={exportReport}><Download size={16} /> Export Beneficiary Report</button>
                </div>
              </article>

              <article className="bf-panel-light p-5">
                <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#9f7b24]">COMMUNITY SEGMENTS</p>
                <div className="mt-3 space-y-2">
                  {regionReach.slice(0, 4).map((r) => (
                    <button key={r.region} type="button" className={`bf-segment-btn ${filters.location === r.region ? "active" : ""}`} onClick={() => { setFilters((f) => ({ ...f, location: f.location === r.region ? "All" : r.region })); scrollToDirectory(); }}>
                      <span><MapPin size={14} className="mr-2 inline text-[#0d5f44]" />{r.region}</span>
                      <span className="font-semibold text-[#022c22]">{r.count}</span>
                    </button>
                  ))}
                </div>
              </article>
            </div>
          </section>

          <section className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_1fr]">
            <article className="bf-panel-light p-6">
              <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#9f7b24]">NEEDS & FOLLOW-UP</p>
              <h2 className="mt-2 font-serif text-lg font-bold text-[#18392e]">Actionable Cases</h2>
              <div className="mt-4 space-y-3">
                {followUpCases.length === 0 ? (
                  <p className="rounded-xl border border-[#c4e8d4] bg-[#e8f8ef] px-4 py-3 text-sm text-[#08734f]">
                    No follow-ups currently require attention.
                  </p>
                ) : (
                  followUpCases.slice(0, 5).map((b) => (
                    <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[rgba(228,218,198,0.75)] bg-[#fffef9] p-4">
                      <div>
                        <p className="font-medium text-[#18392e]">{b.name}</p>
                        <p className="mt-1 text-xs text-[#65766e]">
                          {b.followUpStatus === "Overdue" ? "Follow-up overdue" : b.outcomeStatus === "Review Due" ? "Outcome review due" : "Service follow-up required"} · {b.program}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" className="bf-secondary-btn text-xs" onClick={() => setProfileBeneficiary(b)}>View</button>
                        <button type="button" className="bf-gold-btn px-3 py-2 text-xs" onClick={() => { openEditForm(b); setProfileTab("followups"); }}>Open Follow-Up</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className="bf-panel-dark p-6">
              <div className="relative z-[1]">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#e4bf4f]">HOPEBRIDGE AI</p>
                  <span className="bf-ai-pulse" />
                </div>
                <h2 className="mt-2 font-serif text-lg font-bold text-[#f7f3e8]">Community Support Intelligence</h2>
                <div className="mt-4 rounded-xl border border-[rgba(212,175,55,0.16)] bg-[rgba(4,12,10,0.65)] p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#fcd34d]">Follow-Up Priority</p>
                  <p className="mt-2 text-sm leading-6 text-[rgba(247,243,232,0.72)]">
                    Beneficiaries receiving support have upcoming follow-up requirements across active programs.
                  </p>
                  <p className="mt-3 text-sm text-[rgba(247,243,232,0.78)]">
                    <strong className="text-[#f3e5ab]">Suggested action:</strong> Review pending follow-ups and assign available coordinators.
                  </p>
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button type="button" className="bf-gold-btn flex-1 text-sm" onClick={focusFollowUps}>Review Cases</button>
                  <Link href="/dashboard/ai-assistant" className="bf-secondary-btn flex-1 justify-center bg-[rgba(255,255,255,0.06)] text-[#f3e5ab] border-[rgba(212,175,55,0.3)]">
                    View Recommendation <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </article>
          </section>

          {/* Activity */}
          <section className="bf-panel-dark mt-8 p-6">
            <div className="relative z-[1] flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#e4bf4f]">BENEFICIARY ACTIVITY</p>
                <h2 className="mt-2 font-serif text-lg font-bold text-[#f7f3e8]">Recent Service & Outcome Events</h2>
              </div>
              {activity.length > 5 && (
                <button type="button" className="bf-glass-btn text-sm" onClick={() => setShowAllActivity((v) => !v)}>
                  {showAllActivity ? "Show Less" : "View All Activity"}
                </button>
              )}
            </div>
            <div className="relative z-[1] mt-5 bf-timeline">
              {visibleActivity.length === 0 ? (
                <p className="text-sm text-[rgba(247,243,232,0.52)]">No beneficiary activity recorded yet.</p>
              ) : (
                visibleActivity.map((event) => (
                  <div key={event.id} className="bf-timeline-item">
                    <span className="bf-timeline-node" />
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-[#f7f3e8]">{event.type}</p>
                        <p className="mt-1 text-xs text-[rgba(247,243,232,0.58)]">{event.detail}</p>
                        <p className="mt-1 text-[11px] text-[#e4bf4f]">{event.beneficiaryName}</p>
                      </div>
                      <span className="text-[11px] text-[rgba(247,243,232,0.42)]">{formatRelativeTime(event.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Filter drawer */}
      {isFilterOpen && (
        <div className="bf-filter-drawer">
          <button type="button" className="bf-filter-drawer-overlay" onClick={() => setIsFilterOpen(false)} aria-label="Close filters" />
          <div className="bf-filter-drawer-panel">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-[#18392e]">Filter Beneficiaries</h3>
              <button type="button" onClick={() => setIsFilterOpen(false)}><X size={20} /></button>
            </div>
            <label className="text-xs font-bold uppercase text-[#65766e]">Program</label>
            <select value={draftFilters.program} onChange={(e) => setDraftFilters((f) => ({ ...f, program: e.target.value }))}>
              <option value="All">All</option>
              {Array.from(new Set(beneficiaries.map((b) => b.program))).map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <label className="text-xs font-bold uppercase text-[#65766e]">Support Type</label>
            <select value={draftFilters.supportType} onChange={(e) => setDraftFilters((f) => ({ ...f, supportType: e.target.value }))}>
              <option value="All">All</option>
              {Array.from(new Set(beneficiaries.map((b) => b.supportType))).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <label className="text-xs font-bold uppercase text-[#65766e]">Status</label>
            <select value={draftFilters.status} onChange={(e) => setDraftFilters((f) => ({ ...f, status: e.target.value }))}>
              <option value="All">All</option>
              {Array.from(new Set(beneficiaries.map((b) => b.status))).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <label className="text-xs font-bold uppercase text-[#65766e]">Location</label>
            <select value={draftFilters.location} onChange={(e) => setDraftFilters((f) => ({ ...f, location: e.target.value }))}>
              <option value="All">All</option>
              {Array.from(new Set(beneficiaries.map((b) => b.region))).map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <label className="text-xs font-bold uppercase text-[#65766e]">Follow-Up Status</label>
            <select value={draftFilters.followUpStatus} onChange={(e) => setDraftFilters((f) => ({ ...f, followUpStatus: e.target.value }))}>
              <option value="All">All</option>
              {["None", "Required", "Overdue", "Scheduled", "Completed"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <label className="text-xs font-bold uppercase text-[#65766e]">Coordinator</label>
            <select value={draftFilters.coordinator} onChange={(e) => setDraftFilters((f) => ({ ...f, coordinator: e.target.value }))}>
              <option value="All">All</option>
              {Array.from(new Set(beneficiaries.map((b) => b.coordinator))).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="mt-4 flex gap-2">
              <button type="button" className="bf-secondary-btn flex-1" onClick={() => { setDraftFilters(INITIAL_FILTERS); clearFilters(); setIsFilterOpen(false); }}>Clear Filters</button>
              <button type="button" className="bf-gold-btn flex-1" onClick={applyFilters}>Apply Filters</button>
            </div>
          </div>
        </div>
      )}

      <BeneficiaryFormModal
        isOpen={isFormOpen}
        isEditing={Boolean(editingId)}
        formData={formData}
        onClose={() => { setIsFormOpen(false); setEditingId(null); setFormData(EMPTY_FORM); }}
        onSave={() => saveBeneficiary(false)}
        onSaveAndAddAnother={() => saveBeneficiary(true)}
        onChange={updateFormField}
      />

      <BeneficiaryProfileDrawer
        beneficiary={profileBeneficiary}
        activity={activity}
        activeTab={profileTab}
        onTabChange={setProfileTab}
        onClose={() => setProfileBeneficiary(null)}
        onEdit={openEditForm}
        onDelete={(b) => { setDeleteTarget(b); setProfileBeneficiary(null); }}
      />

      {deleteTarget && (
        <div className="bf-overlay fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="hb-modal w-full max-w-md rounded-[22px] p-6">
            <h2 className="font-serif text-xl font-bold text-[#18392e]">Delete Beneficiary</h2>
            <p className="mt-3 text-sm text-[#607269]">
              Remove <strong>{deleteTarget.name}</strong> ({deleteTarget.beneficiaryId}) from the beneficiary registry? This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className="bf-secondary-btn" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button type="button" className="bf-delete-btn" onClick={confirmDelete}><Trash2 size={16} /> Delete Beneficiary</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
