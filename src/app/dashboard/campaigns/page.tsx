"use client";

import Link from "next/link";
import HopeBridgeSidebar from "../components/HopeBridgeSidebar";
import "./campaigns.css";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Eye,
  Filter,
  Home,
  Megaphone,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";

import {
  createDocument,
  getDocuments,
  updateDocument,
  deleteDocument,
} from "../../../services/firestore";
import { logActivity } from "../../../services/activity";
import { useModuleCreateAction } from "@/hooks/useModuleCreateAction";

type CampaignStatus =
  | "Active"
  | "In Progress"
  | "Completed"
  | "Draft"
  | "Paused"
  | "Needs Attention";

type Campaign = {
  id: string;
  name: string;
  category: string;
  goal: number;
  raised: number;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  description: string;
  owner: string;
  channel: string;
};

type CampaignFormData = {
  name: string;
  category: string;
  goal: string;
  raised: string;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  description: string;
  owner: string;
  channel: string;
};

const categories = [
  "Education",
  "Healthcare",
  "Disaster Relief",
  "Community Development",
  "Environment",
  "Food Assistance",
  "Housing",
  "Youth Development",
  "Animal Welfare",
  "Humanitarian Aid",
];

const channels = [
  "Fundraising Page",
  "Donation Form",
  "Community Event",
  "Peer-to-Peer",
  "Email Campaign",
  "Social Media",
  "Corporate Partnership",
  "Emergency Appeal",
];

const statuses: CampaignStatus[] = [
  "Draft",
  "Active",
  "In Progress",
  "Completed",
  "Paused",
  "Needs Attention",
];

const emptyForm: CampaignFormData = {
  name: "",
  category: "",
  goal: "",
  raised: "0",
  startDate: "",
  endDate: "",
  status: "Draft",
  description: "",
  owner: "",
  channel: "",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

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

function calculateProgress(campaign: Campaign) {
  if (campaign.goal <= 0) return 0;

  return Math.min(
    100,
    Math.max(0, Math.round((campaign.raised / campaign.goal) * 100))
  );
}

function generateId() {
  return `campaign-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function getStatusClasses(status: CampaignStatus) {
  switch (status) {
    case "Active":
      return "border-[#c4e8d4] bg-[#e8f8ef] text-[#08734f]";

    case "Completed":
      return "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]";

    case "In Progress":
      return "border-[#bae6fd] bg-[#eaf8fb] text-[#0a728d]";

    case "Needs Attention":
      return "border-[#fecdd3] bg-[#fff1f2] text-[#be123c]";

    case "Paused":
      return "border-[#ddd6fe] bg-[#f5f3ff] text-[#6d28d9]";

    default:
      return "border-[#fde68a] bg-[#fffaf0] text-[#92400e]";
  }
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    CampaignStatus | "All"
  >("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCampaignFormOpen, setIsCampaignFormOpen] = useState(false);

  const [editingCampaignId, setEditingCampaignId] = useState<
    string | null
  >(null);

  const [viewingCampaign, setViewingCampaign] =
    useState<Campaign | null>(null);

  const [campaignToDelete, setCampaignToDelete] =
    useState<Campaign | null>(null);

  const [formData, setFormData] =
    useState<CampaignFormData>(emptyForm);

  useEffect(() => {
    async function loadCampaigns() {
      try {
        const firestoreCampaigns =
          (await getDocuments("campaigns")) as Campaign[];

        setCampaigns(firestoreCampaigns);
      } catch (error) {
        console.error(
          "Unable to load campaigns from Firestore.",
          error
        );

        setCampaigns([]);
      }
    }

    loadCampaigns();
  }, []);

  const filteredCampaigns = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return campaigns.filter((campaign) => {
      const matchesSearch =
        normalizedQuery === "" ||
        campaign.name.toLowerCase().includes(normalizedQuery) ||
        campaign.category.toLowerCase().includes(normalizedQuery) ||
        campaign.description.toLowerCase().includes(normalizedQuery) ||
        campaign.owner.toLowerCase().includes(normalizedQuery) ||
        campaign.channel.toLowerCase().includes(normalizedQuery) ||
        campaign.status.toLowerCase().includes(normalizedQuery);

      const matchesStatus =
        statusFilter === "All" || campaign.status === statusFilter;

      const matchesCategory =
        categoryFilter === "All" ||
        campaign.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [campaigns, searchQuery, statusFilter, categoryFilter]);

  const statistics = useMemo(() => {
    const now = new Date();

    const active = campaigns.filter(
      (campaign) => campaign.status === "Active"
    ).length;

    const completed = campaigns.filter(
      (campaign) => campaign.status === "Completed"
    ).length;

    const inProgress = campaigns.filter(
      (campaign) => campaign.status === "In Progress"
    ).length;

    const needsAttention = campaigns.filter((campaign) => {
      const progress = calculateProgress(campaign);
      const endDate = new Date(`${campaign.endDate}T23:59:59`);

      const isOverdue =
        campaign.endDate !== "" &&
        endDate < now &&
        campaign.status !== "Completed";

      const isLowProgress =
        progress < 30 &&
        campaign.status !== "Draft" &&
        campaign.status !== "Completed";

      return (
        campaign.status === "Needs Attention" ||
        isOverdue ||
        isLowProgress
      );
    }).length;

    const totalRaised = campaigns.reduce(
      (sum, campaign) => sum + campaign.raised,
      0
    );

    const totalGoal = campaigns.reduce(
      (sum, campaign) => sum + campaign.goal,
      0
    );

    const overallProgress =
      totalGoal > 0 ? Math.round((totalRaised / totalGoal) * 100) : 0;

    return {
      active,
      completed,
      inProgress,
      needsAttention,
      totalRaised,
      totalGoal,
      overallProgress,
    };
  }, [campaigns]);

  function closeCampaignForm() {
    setIsCampaignFormOpen(false);
    setEditingCampaignId(null);
    setFormData(emptyForm);
  }

  function openCreateCampaign() {
    setEditingCampaignId(null);
    setFormData(emptyForm);
    setIsCampaignFormOpen(true);
  }

  const handleCreateFromQuery = useCallback(() => {
    openCreateCampaign();
  }, []);

  useModuleCreateAction(handleCreateFromQuery);

  function openEditCampaign(campaign: Campaign) {
    setEditingCampaignId(campaign.id);

    setFormData({
      name: campaign.name,
      category: campaign.category,
      goal: String(campaign.goal),
      raised: String(campaign.raised),
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      status: campaign.status,
      description: campaign.description,
      owner: campaign.owner,
      channel: campaign.channel,
    });

    setIsCampaignFormOpen(true);
  }

  function updateFormField<K extends keyof CampaignFormData>(
    field: K,
    value: CampaignFormData[K]
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveCampaign() {
    const name = formData.name.trim();
    const category = formData.category.trim();
    const description = formData.description.trim();
    const owner = formData.owner.trim();
    const channel = formData.channel.trim();

    const goal = Number(formData.goal);
    const raised = Number(formData.raised);

    if (!name) {
      alert("Please enter a campaign name.");
      return;
    }

    if (!category) {
      alert("Please select a campaign category.");
      return;
    }

    if (!channel) {
      alert("Please select a campaign channel.");
      return;
    }

    if (!Number.isFinite(goal) || goal <= 0) {
      alert("The target amount must be greater than $0.");
      return;
    }

    if (!Number.isFinite(raised) || raised < 0) {
      alert("The raised amount cannot be negative.");
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      alert("Please select both the start date and end date.");
      return;
    }

    if (
      new Date(formData.endDate) < new Date(formData.startDate)
    ) {
      alert("The end date cannot be earlier than the start date.");
      return;
    }

    if (!description) {
      alert("Please enter a campaign description.");
      return;
    }

    if (!owner) {
      alert("Please enter the campaign owner or responsible team.");
      return;
    }

    const campaignData: Campaign = {
      id: editingCampaignId ?? generateId(),
      name,
      category,
      goal,
      raised,
      startDate: formData.startDate,
      endDate: formData.endDate,
      status: formData.status,
      description,
      owner,
      channel,
    };

    try {
      if (editingCampaignId) {
        await updateDocument("campaigns", editingCampaignId, campaignData);
    
        setCampaigns((currentCampaigns) =>
          currentCampaigns.map((campaign) =>
            campaign.id === editingCampaignId
              ? campaignData
              : campaign
          )
        );

        await logActivity({
          module: "campaigns",
          action: "updated",
          entityType: "campaign",
          entityId: editingCampaignId,
          entityName: name,
          description: `Campaign "${name}" updated`,
        });
      } else {
        const firestoreId = await createDocument("campaigns", campaignData);
    
        const newCampaign: Campaign = {
          ...campaignData,
          id: firestoreId,
        };
    
        setCampaigns((currentCampaigns) => [
          newCampaign,
          ...currentCampaigns,
        ]);

        await logActivity({
          module: "campaigns",
          action: "created",
          entityType: "campaign",
          entityId: firestoreId,
          entityName: name,
          description: `Campaign "${name}" created`,
        });
      }
    
      closeCampaignForm();
    } catch (error) {
      console.error("Unable to save campaign to Firestore.", error);
      alert("Unable to save campaign. Please try again.");
    }

    closeCampaignForm();
  }

  async function confirmDeleteCampaign() {
    if (!campaignToDelete) return;
  
    try {
      await deleteDocument("campaigns", campaignToDelete.id);
  
      setCampaigns((currentCampaigns) =>
        currentCampaigns.filter(
          (campaign) => campaign.id !== campaignToDelete.id
        )
      );

      await logActivity({
        module: "campaigns",
        action: "deleted",
        entityType: "campaign",
        entityId: campaignToDelete.id,
        entityName: campaignToDelete.name,
        description: `Campaign "${campaignToDelete.name}" deleted`,
      });
  
      setCampaignToDelete(null);
    } catch (error) {
      console.error("Unable to delete campaign from Firestore.", error);
      alert("Unable to delete campaign. Please try again.");
    }
  }

  function resetFilters() {
    setStatusFilter("All");
    setCategoryFilter("All");
  }

  const activeFilterCount =
    Number(statusFilter !== "All") +
    Number(categoryFilter !== "All");

  return (
    <div className="hb-app">
      <HopeBridgeSidebar activePath="/dashboard/campaigns" />

      <main className="hb-module-main">
        <div className="relative z-10 mx-auto max-w-[1600px]">
          <nav className="hb-breadcrumb">
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 hover:text-[#0d5f44]">
              <Home size={14} className="text-[#0d5f44]" />
              HopeBridge Foundation
            </Link>
            <span className="text-[#c2cbc6]">/</span>
            <strong>Campaigns</strong>
          </nav>

          <header className="cp2-hero" aria-label="Campaign Intelligence Center">
            <div className="cp2-hero-earth-bg" aria-hidden="true" />
            <div className="cp2-hero-earth-vignette" aria-hidden="true" />
            <div className="cp2-hero-readability" aria-hidden="true" />
            <div className="cp2-hero-node-glow" aria-hidden="true" />
            <div className="cp2-hero-atmosphere" aria-hidden="true" />
            <div className="cp2-hero-particles" aria-hidden="true" />
            <div className="cp2-hero-texture" aria-hidden="true" />

            <svg className="cp2-network-overlay" viewBox="0 0 200 200" aria-hidden="true">
              <path className="cp2-arc" d="M40 90 Q100 40 160 85" />
              <path className="cp2-arc" d="M55 130 Q100 70 145 120" style={{ animationDelay: "1.2s" }} />
              <path className="cp2-arc" d="M70 60 Q100 100 130 55" style={{ animationDelay: "2s" }} />
              <circle className="cp2-node" cx="40" cy="90" r="2.5" />
              <circle className="cp2-node" cx="160" cy="85" r="2.5" />
              <circle className="cp2-node" cx="100" cy="45" r="2.5" />
              <circle className="cp2-node" cx="145" cy="120" r="2.5" />
            </svg>

            <button
              type="button"
              onClick={openCreateCampaign}
              className="cp2-hero-action cp2-gold-btn"
            >
              <Plus size={20} />
              Create Campaign
            </button>

            <div className="cp2-hero-content">
              <div className="cp2-pill">
                <Megaphone size={13} strokeWidth={2} />
                FUNDRAISING OPERATIONS
              </div>

              <h1 className="cp2-title">
                <span className="cp2-title-white">Campaign</span>
                <span className="cp2-title-gold">Intelligence Center</span>
              </h1>

              <p className="cp2-hero-desc">
                Plan, launch, track, and optimize fundraising campaigns
                through one intelligent operational workspace.
              </p>

              <div className="cp2-glass-stats">
                <div className="cp2-glass-stat">
                  <span className="cp2-glass-stat-label">Total Raised</span>
                  <strong className="cp2-glass-stat-value">
                    {formatCurrency(statistics.totalRaised)}
                  </strong>
                </div>

                <div className="cp2-glass-stat">
                  <span className="cp2-glass-stat-label">Portfolio Progress</span>
                  <strong className="cp2-glass-stat-value cp2-glass-stat-value-light">
                    {statistics.overallProgress}%
                  </strong>
                </div>
              </div>
            </div>
          </header>

          <section className="mt-7 flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search
                size={19}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#0d5f44]"
              />

              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search campaigns, category, owner, status..."
                className="cp-search cp2-search h-14 w-full rounded-2xl border border-[#e4dac6] bg-white pl-12 pr-12 text-sm text-[#18392e] shadow-[0_8px_20px_rgba(49,52,42,.04)] outline-none transition placeholder:text-[#929d97] focus:border-[#d1a627]/45"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#929d97] transition hover:text-[#18392e]"
                  aria-label="Clear campaign search"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsFilterOpen(true)}
              className="cp-filter-btn cp2-filter-btn relative flex h-14 items-center justify-center gap-2 rounded-2xl border border-[#c4e8d4] bg-white px-6 text-sm font-medium text-[#08734f] shadow-[0_8px_20px_rgba(49,52,42,.04)] transition hover:border-[#08734f]/35 hover:bg-[#f4fbf7]"
            >
              <Filter size={18} />
              Filters

              {activeFilterCount > 0 && (
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#08734f] px-1.5 text-xs font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </section>

          <section className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <article className="cp-kpi cp2-kpi group relative overflow-hidden rounded-[18px] border border-[#e9dfcc] bg-white p-6 shadow-[0_10px_26px_rgba(49,52,42,.055)] transition duration-300 hover:-translate-y-1 hover:border-[#d1a627]/50 hover:shadow-[0_18px_34px_rgba(44,53,46,.09)]">
              <div className="cp-card-shine" aria-hidden="true" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[#607269]">Active Campaigns</p>
                  <p className="mt-3 text-4xl font-bold text-[#112e24]">
                    {statistics.active}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-[13px] border border-[#efd786] bg-[#fff4d0] text-[#8b6005]">
                  <BarChart3 size={22} />
                </div>
              </div>
              <p className="mt-5 text-sm text-[#9e7b24]">
                Currently accepting support
              </p>
            </article>

            <article className="cp-kpi cp2-kpi group relative overflow-hidden rounded-[18px] border border-[#e9dfcc] bg-white p-6 shadow-[0_10px_26px_rgba(49,52,42,.055)] transition duration-300 hover:-translate-y-1 hover:border-[#08734f]/30 hover:shadow-[0_18px_34px_rgba(44,53,46,.09)]">
              <div className="cp-card-shine" aria-hidden="true" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[#607269]">Completed</p>
                  <p className="mt-3 text-4xl font-bold text-[#112e24]">
                    {statistics.completed}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-[13px] border border-[#c4e8d4] bg-[#e8f8ef] text-[#08734f]">
                  <CheckCircle2 size={22} />
                </div>
              </div>
              <p className="mt-5 text-sm text-[#08734f]">Goals successfully closed</p>
            </article>

            <article className="cp-kpi cp2-kpi group relative overflow-hidden rounded-[18px] border border-[#e9dfcc] bg-white p-6 shadow-[0_10px_26px_rgba(49,52,42,.055)] transition duration-300 hover:-translate-y-1 hover:border-[#0a728d]/30 hover:shadow-[0_18px_34px_rgba(44,53,46,.09)]">
              <div className="cp-card-shine" aria-hidden="true" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[#607269]">In Progress</p>
                  <p className="mt-3 text-4xl font-bold text-[#112e24]">
                    {statistics.inProgress}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-[13px] border border-[#cae8ed] bg-[#eaf8fb] text-[#0a728d]">
                  <Clock3 size={22} />
                </div>
              </div>
              <p className="mt-5 text-sm text-[#0a728d]">
                Campaign execution underway
              </p>
            </article>

            <article className="cp-kpi cp2-kpi group relative overflow-hidden rounded-[18px] border border-[#e9dfcc] bg-white p-6 shadow-[0_10px_26px_rgba(49,52,42,.055)] transition duration-300 hover:-translate-y-1 hover:border-[#be123c]/25 hover:shadow-[0_18px_34px_rgba(44,53,46,.09)]">
              <div className="cp-card-shine" aria-hidden="true" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[#607269]">Needs Attention</p>
                  <p className="mt-3 text-4xl font-bold text-[#112e24]">
                    {statistics.needsAttention}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-[13px] border border-[#fecdd3] bg-[#fff1f2] text-[#be123c]">
                  <AlertTriangle size={22} />
                </div>
              </div>
              <p className="mt-5 text-sm text-[#be123c]">
                Overdue, low-progress, or flagged
              </p>
            </article>
          </section>

          <section className="cp-panel mt-7 overflow-hidden rounded-[18px] border border-[#e8decb] bg-white shadow-[0_10px_26px_rgba(49,52,42,.05)]">
            <div className="flex flex-col gap-4 border-b border-[#f0eadf] px-6 py-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[10px] font-extrabold tracking-[1.3px] text-[#9f7b24]">
                  CAMPAIGN PORTFOLIO
                </p>

                <h2 className="cp-serif mt-2 text-2xl font-bold text-[#18392e]">
                  Campaign Portfolio
                </h2>

                <p className="mt-2 text-sm text-[#607269]">
                  Showing {filteredCampaigns.length} of {campaigns.length}{" "}
                  campaigns
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm text-[#65766e]">
                <TrendingUp size={17} className="text-[#08734f]" />
                Automatically calculated from campaign records
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[1250px] w-full">
                <thead>
                  <tr className="border-b border-[#f0eadf] bg-[#fffdfa] text-left text-xs font-semibold uppercase tracking-wider text-[#65766e]">
                    <th className="px-6 py-5 font-semibold sm:px-8">Campaign</th>
                    <th className="px-5 py-5 font-semibold">Category</th>
                    <th className="px-5 py-5 font-semibold">Goal</th>
                    <th className="px-5 py-5 font-semibold">Raised</th>
                    <th className="px-5 py-5 font-semibold">Progress</th>
                    <th className="px-5 py-5 font-semibold">Start</th>
                    <th className="px-5 py-5 font-semibold">End</th>
                    <th className="px-5 py-5 font-semibold">Status</th>
                    <th className="px-5 py-5 font-semibold">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCampaigns.map((campaign) => {
                    const progress = calculateProgress(campaign);

                    return (
                      <tr
                        key={campaign.id}
                        className="border-b border-[#f0eadf] transition hover:bg-[#fffdfa]"
                      >
                        <td className="px-6 py-5 sm:px-8">
                          <p className="font-medium text-[#18392e]">
                            {campaign.name}
                          </p>
                          <p className="mt-1 max-w-xs truncate text-xs text-[#929d97]">
                            {campaign.owner}
                          </p>
                        </td>

                        <td className="px-5 py-5 text-sm text-[#334b41]">
                          {campaign.category}
                        </td>

                        <td className="px-5 py-5 text-sm text-[#334b41]">
                          {formatCurrency(campaign.goal)}
                        </td>

                        <td className="px-5 py-5 text-sm text-[#334b41]">
                          {formatCurrency(campaign.raised)}
                        </td>

                        <td className="px-5 py-5">
                          <div className="w-48">
                            <div className="h-2 overflow-hidden rounded-full bg-[#eee6d7]">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-[#087b53] via-[#d7aa2f] to-[#0a9565]"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <p className="mt-2 text-xs text-[#929d97]">
                              {progress}%
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-5 text-sm text-[#334b41]">
                          {formatDate(campaign.startDate)}
                        </td>

                        <td className="px-5 py-5 text-sm text-[#334b41]">
                          {formatDate(campaign.endDate)}
                        </td>

                        <td className="px-5 py-5">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getStatusClasses(
                              campaign.status
                            )}`}
                          >
                            {campaign.status}
                          </span>
                        </td>

                        <td className="px-5 py-5">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setViewingCampaign(campaign)}
                              className="cp-action cp2-action cp-action-view flex h-9 w-9 items-center justify-center rounded-xl border transition"
                              aria-label={`View ${campaign.name}`}
                            >
                              <Eye size={17} />
                            </button>

                            <button
                              type="button"
                              onClick={() => openEditCampaign(campaign)}
                              className="cp-action cp2-action cp-action-edit flex h-9 w-9 items-center justify-center rounded-xl border transition"
                              aria-label={`Edit ${campaign.name}`}
                            >
                              <Pencil size={17} />
                            </button>

                            <button
                              type="button"
                              onClick={() => setCampaignToDelete(campaign)}
                              className="cp-action cp2-action cp-action-delete flex h-9 w-9 items-center justify-center rounded-xl border transition"
                              aria-label={`Delete ${campaign.name}`}
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredCampaigns.length === 0 && (
                <div className="px-6 py-16 text-center sm:px-8">
                  <Search size={34} className="mx-auto text-[#c2cbc6]" />
                  <h3 className="cp-serif mt-4 text-lg font-semibold text-[#18392e]">
                    No campaigns found
                  </h3>
                  <p className="mt-2 text-sm text-[#607269]">
                    Change your search or campaign filters.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

      {isCampaignFormOpen && (
        <div className="cp-overlay fixed inset-0 z-[100] flex items-center justify-center px-4 py-6 backdrop-blur-sm">
          <div className="hb-modal cp-modal relative max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-[22px] p-6 sm:p-8">
            <button
              type="button"
              onClick={closeCampaignForm}
              className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-xl border border-[#e4dac6] bg-[#fffdfa] text-[#65766e] transition hover:bg-[#f4f7f4]"
              aria-label="Close campaign form"
            >
              <X size={19} />
            </button>

            <div className="pr-14">
              <p className="flex items-center gap-2 text-[10px] font-extrabold tracking-[1.3px] text-[#9f7b24]">
                <Sparkles size={16} />
                CAMPAIGN OPERATIONS
              </p>

              <h2 className="cp-serif mt-2 text-3xl font-bold text-[#18392e]">
                {editingCampaignId ? "Edit Campaign" : "Create Campaign"}
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#607269]">
                {editingCampaignId
                  ? "Update the selected campaign record and save the changes."
                  : "Configure a new fundraising campaign, assign ownership, and establish its fundraising goal."}
              </p>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-[#334b41]">
                  Campaign name
                </label>

                <input
                  type="text"
                  value={formData.name}
                  onChange={(event) =>
                    updateFormField("name", event.target.value)
                  }
                  placeholder="Enter campaign name"
                  className="cp-input mt-2 w-full rounded-xl px-4 py-3 text-sm outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[#334b41]">
                  Category
                </label>

                <select
                  value={formData.category}
                  onChange={(event) =>
                    updateFormField("category", event.target.value)
                  }
                  className="cp-input mt-2 w-full rounded-xl px-4 py-3 text-sm outline-none"
                >
                  <option value="">Select a category</option>

                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-[#334b41]">
                  Campaign channel
                </label>

                <select
                  value={formData.channel}
                  onChange={(event) =>
                    updateFormField(
                      "channel",
                      event.target.value
                    )
                  }
                  className="cp-input mt-2 w-full rounded-xl px-4 py-3 text-sm outline-none"
                >
                  <option value="">Select a campaign channel</option>

                  {channels.map((channel) => (
                    <option key={channel} value={channel}>
                      {channel}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-[#334b41]">
                  Target amount
                </label>

                <div className="relative mt-2">
                  <CircleDollarSign
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                  />

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={formData.goal}
                    onChange={(event) =>
                      updateFormField(
                        "goal",
                        event.target.value
                      )
                    }
                    placeholder="50000"
                    className="cp-input w-full rounded-xl py-3 pl-12 pr-4 text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-[#334b41]">
                  Amount raised
                </label>

                <div className="relative mt-2">
                  <TrendingUp
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                  />

                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.raised}
                    onChange={(event) =>
                      updateFormField(
                        "raised",
                        event.target.value
                      )
                    }
                    placeholder="0"
                    className="cp-input w-full rounded-xl py-3 pl-12 pr-4 text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-[#334b41]">
                  Start date
                </label>

                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(event) =>
                    updateFormField(
                      "startDate",
                      event.target.value
                    )
                  }
                  className="cp-input mt-2 w-full rounded-xl px-4 py-3 text-sm outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[#334b41]">
                  End date
                </label>

                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(event) =>
                    updateFormField(
                      "endDate",
                      event.target.value
                    )
                  }
                  className="cp-input mt-2 w-full rounded-xl px-4 py-3 text-sm outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[#334b41]">
                  Campaign owner
                </label>

                <div className="relative mt-2">
                  <Users
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                  />

                  <input
                    type="text"
                    value={formData.owner}
                    onChange={(event) =>
                      updateFormField(
                        "owner",
                        event.target.value
                      )
                    }
                    placeholder="Team or responsible person"
                    className="cp-input w-full rounded-xl py-3 pl-12 pr-4 text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-[#334b41]">
                  Status
                </label>

                <select
                  value={formData.status}
                  onChange={(event) =>
                    updateFormField(
                      "status",
                      event.target.value as CampaignStatus
                    )
                  }
                  className="cp-input mt-2 w-full rounded-xl px-4 py-3 text-sm outline-none"
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-[#334b41]">
                  Campaign description
                </label>

                <textarea
                  value={formData.description}
                  onChange={(event) =>
                    updateFormField(
                      "description",
                      event.target.value
                    )
                  }
                  rows={5}
                  placeholder="Describe the campaign purpose, audience, fundraising strategy, and expected impact..."
                  className="cp-input mt-2 w-full resize-none rounded-xl px-4 py-3 text-sm outline-none"
                />
              </div>
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#f0eadf] pt-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeCampaignForm}
                className="hb-secondary-btn rounded-xl px-6 py-3 text-sm font-medium"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveCampaign}
                className="cp-gold-btn rounded-xl px-6 py-3 text-sm font-bold"
              >
                {editingCampaignId
                  ? "Save Changes"
                  : "Save Campaign"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isFilterOpen && (
        <div className="cp-overlay fixed inset-0 z-[110] flex items-center justify-center px-4 backdrop-blur-sm">
          <div className="hb-modal cp-modal relative w-full max-w-lg rounded-[22px] p-6 sm:p-8">
            <button
              type="button"
              onClick={() => setIsFilterOpen(false)}
              className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-xl border border-[#e4dac6] bg-[#fffdfa] text-[#65766e] transition hover:bg-[#f4f7f4]"
            >
              <X size={19} />
            </button>

            <p className="text-[10px] font-extrabold tracking-[1.3px] text-[#08734f]">
              CAMPAIGN FILTERS
            </p>

            <h2 className="cp-serif mt-2 text-2xl font-bold text-[#18392e]">
              Filter Campaign Records
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#607269]">
              Narrow the campaign portfolio by operational status and fundraising
              category.
            </p>

            <div className="mt-7 space-y-5">
              <div>
                <label className="text-sm font-medium text-[#334b41]">
                  Campaign status
                </label>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as CampaignStatus | "All"
                    )
                  }
                  className="cp-input mt-2 w-full rounded-xl px-4 py-3 text-sm outline-none"
                >
                  <option value="All">All statuses</option>

                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-[#334b41]">
                  Campaign category
                </label>

                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="cp-input mt-2 w-full rounded-xl px-4 py-3 text-sm outline-none"
                >
                  <option value="All">All categories</option>

                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={resetFilters}
                className="hb-secondary-btn rounded-xl px-5 py-2.5 text-sm font-medium"
              >
                Reset
              </button>

              <button
                type="button"
                onClick={() => setIsFilterOpen(false)}
                className="hb-emerald-btn rounded-xl px-5 py-2.5 text-sm font-bold"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingCampaign && (
        <div className="cp-overlay fixed inset-0 z-[120] flex items-center justify-center px-4 py-6 backdrop-blur-sm">
          <div className="hb-modal cp-modal relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[22px] p-6 sm:p-8">
            <button
              type="button"
              onClick={() => setViewingCampaign(null)}
              className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-xl border border-[#e4dac6] bg-[#fffdfa] text-[#65766e] transition hover:bg-[#f4f7f4]"
            >
              <X size={19} />
            </button>

            <p className="text-[10px] font-extrabold tracking-[1.3px] text-[#08734f]">
              CAMPAIGN RECORD
            </p>

            <h2 className="cp-serif mt-2 pr-12 text-3xl font-bold text-[#18392e]">
              {viewingCampaign.name}
            </h2>

            <p className="mt-4 leading-7 text-[#607269]">
              {viewingCampaign.description}
            </p>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {[
                ["Category", viewingCampaign.category],
                ["Channel", viewingCampaign.channel],
                ["Owner", viewingCampaign.owner],
                ["Status", viewingCampaign.status],
                ["Target", formatCurrency(viewingCampaign.goal)],
                ["Raised", formatCurrency(viewingCampaign.raised)],
                ["Start date", formatDate(viewingCampaign.startDate)],
                ["End date", formatDate(viewingCampaign.endDate)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-[#ebe3d2] bg-[#fffdfa] p-4"
                >
                  <p className="text-xs uppercase tracking-wider text-[#929d97]">
                    {label}
                  </p>
                  <p className="mt-2 font-medium text-[#18382e]">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-[#ebe3d2] bg-[#fffdfa] p-5">
              <div className="flex items-center justify-between">
                <p className="font-medium text-[#18382e]">Fundraising progress</p>
                <p className="font-semibold text-[#08734f]">
                  {calculateProgress(viewingCampaign)}%
                </p>
              </div>
              <div className="hb-progress-bar mt-4 h-3">
                <div
                  className="hb-progress-fill"
                  style={{
                    width: `${calculateProgress(viewingCampaign)}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  const selectedCampaign = viewingCampaign;
                  setViewingCampaign(null);
                  openEditCampaign(selectedCampaign);
                }}
                className="cp-gold-btn inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold"
              >
                <Pencil size={17} />
                Edit Campaign
              </button>
            </div>
          </div>
        </div>
      )}

      {campaignToDelete && (
        <div className="cp-overlay fixed inset-0 z-[130] flex items-center justify-center px-4 backdrop-blur-sm">
          <div className="hb-modal w-full max-w-md rounded-[22px] border border-[#fecdd3] p-6 sm:p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#fecdd3] bg-[#fff1f2] text-[#be123c]">
              <Trash2 size={24} />
            </div>

            <h2 className="cp-serif mt-6 text-2xl font-bold text-[#18392e]">
              Delete Campaign
            </h2>

            <p className="mt-3 leading-7 text-[#607269]">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-[#18382e]">
                &ldquo;{campaignToDelete.name}&rdquo;
              </span>
              ? This action cannot be undone.
            </p>

            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCampaignToDelete(null)}
                className="hb-secondary-btn rounded-xl px-5 py-2.5 text-sm font-medium"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDeleteCampaign}
                className="rounded-xl border border-[#fecdd3] bg-[#be123c] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#9f1239]"
              >
                Delete Campaign
              </button>
            </div>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}