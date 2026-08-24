"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CircleDollarSign,
  Download,
  Edit3,
  Eye,
  Filter,
  HeartHandshake,
  Home,
  Mail,
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
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import HopeBridgeSidebar from "../components/HopeBridgeSidebar";
import {
  createDocument,
  deleteDocument,
  subscribeDocuments,
  updateDocument,
} from "../../../services/firestore";
import { logActivity } from "../../../services/activity";
import { useModuleCreateAction } from "@/hooks/useModuleCreateAction";
import { useAuth } from "@/providers/AuthProvider";
import {
  deleteDonationsForDonor,
  recordDonation,
  syncDonorGift,
} from "../../../services/donations";
import {
  computeAiInsight,
  computeCampaignPerformance,
  computeDonorKpis,
  computeDonorSegments,
  computeMonthlyDonations,
  formatCurrencyFull,
  getInitials,
  matchesDonorDateRange,
  normalizeDonorRecord,
  type DonorRecord,
} from "./utils";
import "./donors.css";

type Donor = DonorRecord;

type DonorFilters = {
  donorType: string;
  status: string;
  campaign: string;
  giftRange: string;
  dateRange: string;
};

type SegmentKey = "all" | "major" | "recurring" | "one-time";

type ModalMode = "add" | "edit" | "view" | "email" | "reengage" | null;

const STATUS_OPTIONS = ["Major donor", "Recurring", "New donor", "Lapsed"];

const INITIAL_FILTERS: DonorFilters = {
  donorType: "All",
  status: "All",
  campaign: "All",
  giftRange: "All",
  dateRange: "All",
};

function formatCurrency(value: number) {
  return formatCurrencyFull(value);
}

function matchesSegment(donor: Donor, segment: SegmentKey) {
  if (segment === "all") return true;
  if (segment === "major") return (donor.status || "").toLowerCase().includes("major");
  if (segment === "recurring") return donor.status === "Recurring";
  if (segment === "one-time") return donor.status === "New donor";
  return true;
}

function matchesGiftRange(amount: number, range: string) {
  if (range === "All") return true;
  if (range === "Under $1K") return amount < 1000;
  if (range === "$1K – $5K") return amount >= 1000 && amount <= 5000;
  if (range === "Over $5K") return amount > 5000;
  return true;
}

function getStatusClass(status: string) {
  if ((status || "").toLowerCase().includes("major")) return "dn-status-pill dn-status-major";
  if (status === "Recurring") return "dn-status-pill dn-status-recurring";
  return "dn-status-pill dn-status-new";
}

function toCampaignWriteShape(record: Record<string, unknown> & { id: string }) {
  return {
    id: record.id,
    name: typeof record.name === "string" ? record.name : String(record.name ?? ""),
    goal: Number(record.goal) || 0,
    raised: Number(record.raised) || 0,
  };
}

function toDonorWriteData(donor: Omit<Donor, "id">) {
  return {
    name: donor.name,
    email: donor.email,
    amount: donor.amount,
    amountNum: donor.amountNum,
    campaign: donor.campaign,
    date: donor.date,
    status: donor.status,
    initials: donor.initials,
  };
}

function DonationTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload: { month: string; raised: number; changePct: number; contributions: number } }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;
  const positive = data.changePct >= 0;

  return (
    <div className="dn-chart-tooltip">
      <p className="dn-chart-tooltip-month">{label}</p>
      <p className="dn-chart-tooltip-raised">{formatCurrency(data.raised)} raised</p>
      <p className={`dn-chart-tooltip-meta ${positive ? "positive" : "negative"}`}>
        {positive ? "+" : ""}
        {data.changePct}% vs prior month
      </p>
      <p className="dn-chart-tooltip-meta">
        {data.contributions.toLocaleString()} contributions
      </p>
    </div>
  );
}

export default function DonorsPage() {
  const { user } = useAuth();
  const [donors, setDonors] = useState<Donor[]>([]);
  const [campaignRecords, setCampaignRecords] = useState<
    { id: string; name: string; goal?: number; raised?: number }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<DonorFilters>(INITIAL_FILTERS);
  const [activeSegment, setActiveSegment] = useState<SegmentKey>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [hoveredCampaign, setHoveredCampaign] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    amount: "",
    campaign: "General Fund",
    status: STATUS_OPTIONS[0],
    date: new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
  });
  const [emailForm, setEmailForm] = useState({
    subject: "",
    message: "",
  });

  const filterRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    let donorsReady = false;
    let campaignsReady = false;

    function markReady(source: "donors" | "campaigns") {
      if (source === "donors") donorsReady = true;
      if (source === "campaigns") campaignsReady = true;
      if (donorsReady && campaignsReady) setIsLoading(false);
    }

    const unsubscribeDonors = subscribeDocuments(
      "donors",
      (docs) => {
        setDonors(docs.map((doc) => normalizeDonorRecord(doc)));
        markReady("donors");
      },
      (error) => {
        console.error("Unable to load donors.", error);
        setDonors([]);
        markReady("donors");
      },
    );

    const unsubscribeCampaigns = subscribeDocuments(
      "campaigns",
      (docs) => {
        setCampaignRecords(docs.map((doc) => toCampaignWriteShape(doc)));
        markReady("campaigns");
      },
      (error) => {
        console.error("Unable to load campaigns for donors.", error);
        setCampaignRecords([]);
        markReady("campaigns");
      },
    );

    return () => {
      unsubscribeDonors();
      unsubscribeCampaigns();
    };
  }, [user]);

  const campaignOptions = useMemo(() => {
    const names = campaignRecords.map((c) => c.name).filter(Boolean);
    return names.length > 0 ? names : ["General Fund"];
  }, [campaignRecords]);

  const donorStats = useMemo(
    () =>
      computeDonorKpis(donors).map((kpi, index) => ({
        ...kpi,
        icon: [CircleDollarSign, Users, HeartHandshake, TrendingUp][index],
      })),
    [donors],
  );

  const monthlyDonations = useMemo(
    () => computeMonthlyDonations(donors),
    [donors],
  );

  const campaigns = useMemo(
    () => computeCampaignPerformance(donors, campaignRecords),
    [donors, campaignRecords],
  );

  const donorSegments = useMemo(() => computeDonorSegments(donors), [donors]);

  const aiInsight = useMemo(() => computeAiInsight(donors), [donors]);

  const activeFilterCount =
    Number(filters.donorType !== "All") +
    Number(filters.status !== "All") +
    Number(filters.campaign !== "All") +
    Number(filters.giftRange !== "All") +
    Number(filters.dateRange !== "All");

  const filteredDonors = useMemo(() => {
    const query = search.trim().toLowerCase();

    return donors.filter((donor) => {
      const matchesSearch =
        !query ||
        (donor.name || "").toLowerCase().includes(query) ||
        (donor.email || "").toLowerCase().includes(query) ||
        (donor.campaign || "").toLowerCase().includes(query);

      const matchesStatus =
        filters.status === "All" || donor.status === filters.status;

      const matchesCampaign =
        filters.campaign === "All" || donor.campaign === filters.campaign;

      const matchesType =
        filters.donorType === "All" ||
        (filters.donorType === "Major" &&
          (donor.status || "").toLowerCase().includes("major")) ||
        (filters.donorType === "Recurring" && donor.status === "Recurring") ||
        (filters.donorType === "One-Time" && donor.status === "New donor");

      const matchesGift = matchesGiftRange(donor.amountNum, filters.giftRange);

      const matchesDate = matchesDonorDateRange(donor.date, filters.dateRange);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCampaign &&
        matchesType &&
        matchesGift &&
        matchesDate &&
        matchesSegment(donor, activeSegment)
      );
    });
  }, [donors, search, filters, activeSegment]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setFilterOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenId(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function openAddDonor() {
    setSelectedDonor(null);
    setForm({
      name: "",
      email: "",
      amount: "",
      campaign: campaignOptions[0] ?? "General Fund",
      status: STATUS_OPTIONS[0],
      date: new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    });
    setModalMode("add");
  }

  useModuleCreateAction(useCallback(() => openAddDonor(), []));

  function openEditDonor(donor: Donor) {
    setSelectedDonor(donor);
    setForm({
      name: donor.name,
      email: donor.email,
      amount: String(donor.amountNum),
      campaign: donor.campaign,
      status: donor.status,
      date: donor.date,
    });
    setModalMode("edit");
    setMenuOpenId(null);
  }

  function openViewDonor(donor: Donor) {
    setSelectedDonor(donor);
    setModalMode("view");
    setMenuOpenId(null);
  }

  async function deleteDonorRecord(donor: Donor) {
    try {
      await deleteDonationsForDonor(donor.id);
      await deleteDocument("donors", donor.id);
      setDonors((current) => current.filter((item) => item.id !== donor.id));
      await logActivity({
        module: "donors",
        action: "deleted",
        entityType: "donor",
        entityId: donor.id,
        entityName: donor.name,
        description: `Donor "${donor.name}" removed`,
      });
    } catch (error) {
      console.error("Unable to delete donor.", error);
      alert("Unable to delete donor. Please try again.");
    }
    setMenuOpenId(null);
  }

  async function saveDonor() {
    const amountNum = Number(form.amount.replace(/[^0-9.]/g, "")) || 0;

    if (!form.name.trim()) {
      alert("Please enter a donor name.");
      return;
    }

    if (!form.email.trim()) {
      alert("Please enter a donor email.");
      return;
    }

    const donorPayload: Omit<Donor, "id"> = {
      name: form.name.trim(),
      email: form.email.trim(),
      amount: formatCurrency(amountNum),
      amountNum,
      campaign: form.campaign,
      date: form.date,
      status: form.status,
      initials: getInitials(form.name),
    };

    const linkedCampaign = campaignRecords.find((c) => c.name === form.campaign);
    const giftType = form.status === "Recurring" ? "Recurring" : "One-Time";

    setSaving(true);
    try {
      if (modalMode === "add") {
        const firestoreId = await createDocument(
          "donors",
          toDonorWriteData(donorPayload),
        );
        setDonors((current) => [
          { ...donorPayload, id: firestoreId },
          ...current.filter((donor) => donor.id !== firestoreId),
        ]);
        await logActivity({
          module: "donors",
          action: "created",
          entityType: "donor",
          entityId: firestoreId,
          entityName: donorPayload.name,
          description: `Donor "${donorPayload.name}" added`,
        });

        if (amountNum > 0) {
          await recordDonation({
            donorId: firestoreId,
            donorName: donorPayload.name,
            amount: amountNum,
            campaignId: linkedCampaign?.id,
            campaignName: form.campaign,
            date: form.date,
            giftType,
          });
        }
      }

      if (modalMode === "edit" && selectedDonor) {
        await updateDocument(
          "donors",
          selectedDonor.id,
          toDonorWriteData(donorPayload),
        );
        setDonors((current) =>
          current.map((donor) =>
            donor.id === selectedDonor.id
              ? { ...donorPayload, id: selectedDonor.id }
              : donor,
          ),
        );
        await syncDonorGift({
          donorId: selectedDonor.id,
          donorName: donorPayload.name,
          amount: amountNum,
          campaignId: linkedCampaign?.id,
          campaignName: form.campaign,
          date: form.date,
          giftType,
        });
        await logActivity({
          module: "donors",
          action: "updated",
          entityType: "donor",
          entityId: selectedDonor.id,
          entityName: donorPayload.name,
          description: `Donor "${donorPayload.name}" updated`,
        });
      }

      setModalMode(null);
    } catch (error) {
      console.error("Unable to save donor.", error);
      alert("Unable to save donor. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function exportDonors() {
    const rows = [
      ["Name", "Email", "Amount", "Campaign", "Date", "Status"],
      ...filteredDonors.map((donor) => [
        donor.name,
        donor.email,
        donor.amount,
        donor.campaign,
        donor.date,
        donor.status,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "hopebridge-donors.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function openEmailDonors() {
    setEmailForm({
      subject: "Thank you for supporting HopeBridge Foundation",
      message:
        "Dear donor,\n\nWe appreciate your continued support and wanted to share an update on the impact your generosity is making across our campaigns.\n\nWarm regards,\nHopeBridge Foundation Team",
    });
    setModalMode("email");
  }

  function openReengagement() {
    const lapsed = donors.filter((d) =>
      (d.status || "").toLowerCase().includes("lapsed"),
    ).length;
    setEmailForm({
      subject: "We miss you — rejoin our mission today",
      message:
        lapsed > 0
          ? `Dear valued supporter,\n\nWe would love to welcome you back. ${lapsed} lapsed donor${lapsed === 1 ? "" : "s"} may be ready for re-engagement.\n\nThank you,\nHopeBridge Foundation`
          : "Dear valued supporter,\n\nWe appreciate your past support and wanted to share an update on our current initiatives.\n\nThank you,\nHopeBridge Foundation",
    });
    setModalMode("reengage");
  }

  function toggleSegment(key: SegmentKey) {
    setActiveSegment((current) => (current === key ? "all" : key));
  }

  return (
    <div className="hb-app dn-page">
      <HopeBridgeSidebar activePath="/dashboard/donors" />

      <main className="hb-module-main">
        <div className="mx-auto max-w-[1700px]">
          <nav className="hb-breadcrumb">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 hover:text-[#0d5f44]"
            >
              <Home size={14} className="text-[#0d5f44]" />
              HopeBridge Foundation
            </Link>
            <span className="text-[#c2cbc6]">/</span>
            <strong>Donors</strong>
          </nav>

          <header className="mt-6 mb-8 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="dn-header-kicker">
                <HeartHandshake size={16} />
                Donor Management
              </div>

              <h1 className="dn-header-title">
                Donor <em>Intelligence</em>
              </h1>

              <p className="dn-header-desc">
                Track contributions, strengthen donor relationships, and improve
                fundraising performance across every campaign.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="button" className="dn-secondary-btn" onClick={exportDonors}>
                <Download size={17} />
                Export
              </button>

              <button type="button" className="dn-secondary-btn" onClick={openEmailDonors}>
                <Mail size={17} />
                Email Donors
              </button>

              <button type="button" className="dn-gold-btn" onClick={openAddDonor}>
                <UserPlus size={17} />
                Add Donor
              </button>
            </div>
          </header>

          <section className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {donorStats.map((stat) => {
              const Icon = stat.icon;

              return (
                <article key={stat.title} className="dn-kpi-card">
                  <div className="mb-5 flex items-start justify-between">
                    <div>
                      <p className="dn-kpi-label">{stat.title}</p>
                      <p className="dn-kpi-value">{isLoading ? "—" : stat.value}</p>
                    </div>

                    <div className="dn-kpi-icon">
                      <Icon size={22} />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    {stat.change !== "—" && (
                      <span
                        className={
                          stat.positive
                            ? "dn-kpi-change-positive"
                            : "dn-kpi-change-negative"
                        }
                      >
                        <span className="inline-flex items-center gap-1">
                          {stat.positive ? (
                            <ArrowUpRight size={15} />
                          ) : (
                            <ArrowDownRight size={15} />
                          )}
                          {stat.change}
                        </span>
                      </span>
                    )}
                    <span className="dn-kpi-detail">{stat.detail}</span>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="mb-8 grid gap-6 xl:grid-cols-[1.55fr_1fr]">
            <article className="dn-panel">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="dn-panel-kicker">Monthly donation performance</p>
                  <h2 className="dn-panel-title">Donation Trends</h2>
                </div>

                <button type="button" className="dn-period-btn">
                  <CalendarDays size={16} />
                  Last 12 months
                </button>
              </div>

              <div className="h-72">
                {monthlyDonations.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-[#607269]">
                    Not enough data to display this chart.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyDonations} barCategoryGap="18%">
                    <defs>
                      <linearGradient id="dnBarEmerald" x1="0" y1="1" x2="0" y2="0">
                        <stop offset="0%" stopColor="#022c22" />
                        <stop offset="55%" stopColor="#0d5f44" />
                        <stop offset="100%" stopColor="#d4af37" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(234,216,177,0.35)" vertical={false} />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#5f7268", fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#5f7268", fontSize: 12 }}
                      tickFormatter={(value) => `$${Math.round(value / 1000)}K`}
                    />
                    <Tooltip
                      content={<DonationTooltip />}
                      cursor={{ fill: "rgba(234,216,177,0.18)" }}
                    />
                    <Bar
                      dataKey="raised"
                      radius={[8, 8, 0, 0]}
                      animationDuration={600}
                    >
                      {monthlyDonations.map((entry) => (
                        <Cell
                          key={entry.month}
                          fill="url(#dnBarEmerald)"
                          opacity={entry.month === "Nov" ? 1 : 0.88}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                )}
              </div>
            </article>

            <article className="dn-intelligence-panel">
              <div className="relative z-[1] flex items-start justify-between">
                <div>
                  <p className="dn-intelligence-kicker">AI Fundraising Advisor</p>
                  <h2 className="dn-intelligence-title">Donor Opportunity</h2>
                </div>

                <div className="dn-intelligence-icon">
                  <Sparkles size={22} />
                </div>
              </div>

              <div className="dn-intelligence-inner">
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

              <button
                type="button"
                className="dn-gold-btn relative z-[1] mt-5 w-full"
                onClick={openReengagement}
              >
                Launch Re-engagement Campaign
                <ArrowUpRight size={16} />
              </button>
            </article>
          </section>

          <section className="mb-8 grid gap-6 xl:grid-cols-[1.2fr_1fr]">
            <article className="dn-panel">
              <div className="mb-6">
                <p className="dn-panel-kicker">Fundraising allocation by campaign</p>
                <h2 className="dn-panel-title">Campaign Performance</h2>
              </div>

              <div className="space-y-6">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign.name}
                    className="dn-campaign-row"
                    onMouseEnter={() => setHoveredCampaign(campaign.name)}
                    onMouseLeave={() => setHoveredCampaign(null)}
                  >
                    <div className="mb-2 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-[#112e24]">
                          {campaign.name}
                        </p>
                        <p className="mt-1 text-xs text-[#5f7268]">
                          {campaign.raised} raised of {campaign.target}
                        </p>
                      </div>

                      <span className="dn-campaign-pct">{campaign.percentage}%</span>
                    </div>

                    <div className="dn-progress-track">
                      <div
                        className="dn-progress-fill"
                        style={{ width: `${campaign.percentage}%` }}
                      />
                    </div>

                    {hoveredCampaign === campaign.name && (
                      <div className="dn-campaign-tooltip">
                        <strong>{campaign.name}</strong>
                        <br />
                        {formatCurrency(campaign.raisedNum)} raised · {campaign.percentage}%
                        funded
                        <br />
                        {campaign.donors.toLocaleString()} donors ·{" "}
                        {formatCurrency(campaign.remaining)} remaining
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </article>

            <article className="dn-panel">
              <div className="mb-6">
                <p className="dn-panel-kicker">Contribution distribution</p>
                <h2 className="dn-panel-title">Donor Segments</h2>
              </div>

              <div className="space-y-4">
                {donorSegments.map((segment) => (
                  <button
                    key={segment.name}
                    type="button"
                    className={`dn-segment-row w-full text-left ${
                      activeSegment === segment.key ? "active" : ""
                    }`}
                    onClick={() => toggleSegment(segment.key)}
                  >
                    <div className="dn-segment-pct">{segment.percentage}</div>

                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[#112e24]">{segment.name}</p>
                      <p className="mt-1 text-sm text-[#5f7268]">{segment.donors}</p>
                    </div>

                    <p className="font-semibold text-[#022c22]">{segment.amount}</p>
                  </button>
                ))}
              </div>
            </article>
          </section>

          <section className="dn-table-panel">
            <div className="dn-table-toolbar">
              <div>
                <p className="dn-panel-kicker">Latest donor activity</p>
                <h2 className="dn-panel-title">Recent Donors</h2>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="dn-search">
                  <Search size={17} />
                  <input
                    type="text"
                    placeholder="Search donors..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>

                <div className="relative" ref={filterRef}>
                  <button
                    type="button"
                    className="dn-secondary-btn"
                    onClick={() => setFilterOpen((open) => !open)}
                  >
                    <Filter size={17} />
                    Filter
                    {activeFilterCount > 0 && (
                      <span className="rounded-full bg-[#0d5f44] px-2 py-0.5 text-xs text-white">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>

                  {filterOpen && (
                    <div className="dn-filter-panel">
                      <label htmlFor="donor-type">Donor Type</label>
                      <select
                        id="donor-type"
                        value={filters.donorType}
                        onChange={(event) =>
                          setFilters((current) => ({
                            ...current,
                            donorType: event.target.value,
                          }))
                        }
                      >
                        <option>All</option>
                        <option>Major</option>
                        <option>Recurring</option>
                        <option>One-Time</option>
                      </select>

                      <label htmlFor="donor-status">Donation Status</label>
                      <select
                        id="donor-status"
                        value={filters.status}
                        onChange={(event) =>
                          setFilters((current) => ({
                            ...current,
                            status: event.target.value,
                          }))
                        }
                      >
                        <option>All</option>
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>

                      <label htmlFor="donor-campaign">Campaign</label>
                      <select
                        id="donor-campaign"
                        value={filters.campaign}
                        onChange={(event) =>
                          setFilters((current) => ({
                            ...current,
                            campaign: event.target.value,
                          }))
                        }
                      >
                        <option>All</option>
                        {campaignOptions.map((campaign) => (
                          <option key={campaign}>{campaign}</option>
                        ))}
                      </select>

                      <label htmlFor="gift-range">Gift Range</label>
                      <select
                        id="gift-range"
                        value={filters.giftRange}
                        onChange={(event) =>
                          setFilters((current) => ({
                            ...current,
                            giftRange: event.target.value,
                          }))
                        }
                      >
                        <option>All</option>
                        <option>Under $1K</option>
                        <option>$1K – $5K</option>
                        <option>Over $5K</option>
                      </select>

                      <label htmlFor="date-range">Date Range</label>
                      <select
                        id="date-range"
                        value={filters.dateRange}
                        onChange={(event) =>
                          setFilters((current) => ({
                            ...current,
                            dateRange: event.target.value,
                          }))
                        }
                      >
                        <option>All</option>
                        <option>Last 7 days</option>
                        <option>Last 30 days</option>
                      </select>

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="dn-secondary-btn"
                          onClick={() => setFilters(INITIAL_FILTERS)}
                        >
                          Reset
                        </button>
                        <button
                          type="button"
                          className="dn-gold-btn"
                          onClick={() => setFilterOpen(false)}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button type="button" className="dn-gold-btn" onClick={openAddDonor}>
                  <Plus size={17} />
                  New Donor
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="dn-table w-full min-w-[950px] text-left">
                <thead>
                  <tr>
                    <th>Donor</th>
                    <th>Amount</th>
                    <th>Campaign</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>

                <tbody>
                  {filteredDonors.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-[#5f7268]">
                        No donors match your current search or filters.
                      </td>
                    </tr>
                  ) : (
                    filteredDonors.map((donor) => (
                      <tr key={donor.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="dn-avatar">{donor.initials}</div>
                            <div>
                              <p className="font-medium text-[#112e24]">{donor.name}</p>
                              <p className="mt-1 text-xs text-[#5f7268]">{donor.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="dn-amount">{donor.amount}</td>
                        <td>{donor.campaign}</td>
                        <td className="text-[#5f7268]">{donor.date}</td>
                        <td>
                          <span className={getStatusClass(donor.status)}>
                            {donor.status}
                          </span>
                        </td>
                        <td>
                          <div className="relative" ref={menuOpenId === donor.id ? menuRef : undefined}>
                            <button
                              type="button"
                              className="dn-action-btn"
                              aria-label={`Actions for ${donor.name}`}
                              onClick={() =>
                                setMenuOpenId((current) =>
                                  current === donor.id ? null : donor.id,
                                )
                              }
                            >
                              <MoreHorizontal size={18} />
                            </button>

                            {menuOpenId === donor.id && (
                              <div className="dn-action-menu">
                                <button type="button" onClick={() => openViewDonor(donor)}>
                                  <Eye size={15} />
                                  View
                                </button>
                                <button type="button" onClick={() => openEditDonor(donor)}>
                                  <Edit3 size={15} />
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="danger"
                                  onClick={() => deleteDonorRecord(donor)}
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

      {modalMode === "view" && selectedDonor && (
        <div className="dn-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="dn-modal" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <h3 className="dn-modal-title">Donor Profile</h3>
              <button type="button" className="dn-action-btn" onClick={() => setModalMode(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-3 text-sm text-[#5f7268]">
              <p>
                <strong className="text-[#112e24]">Name:</strong> {selectedDonor.name}
              </p>
              <p>
                <strong className="text-[#112e24]">Email:</strong> {selectedDonor.email}
              </p>
              <p>
                <strong className="text-[#112e24]">Amount:</strong> {selectedDonor.amount}
              </p>
              <p>
                <strong className="text-[#112e24]">Campaign:</strong>{" "}
                {selectedDonor.campaign}
              </p>
              <p>
                <strong className="text-[#112e24]">Date:</strong> {selectedDonor.date}
              </p>
              <p>
                <strong className="text-[#112e24]">Status:</strong> {selectedDonor.status}
              </p>
            </div>

            <div className="dn-modal-actions">
              <button type="button" className="dn-secondary-btn" onClick={() => setModalMode(null)}>
                Close
              </button>
              <button
                type="button"
                className="dn-gold-btn"
                onClick={() => openEditDonor(selectedDonor)}
              >
                Edit Donor
              </button>
            </div>
          </div>
        </div>
      )}

      {(modalMode === "add" || modalMode === "edit") && (
        <div className="dn-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="dn-modal" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <h3 className="dn-modal-title">
                {modalMode === "add" ? "Add Donor" : "Edit Donor"}
              </h3>
              <button type="button" className="dn-action-btn" onClick={() => setModalMode(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="dn-modal-field">
              <label htmlFor="donor-name">Full Name</label>
              <input
                id="donor-name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
            </div>

            <div className="dn-modal-field">
              <label htmlFor="donor-email">Email</label>
              <input
                id="donor-email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              />
            </div>

            <div className="dn-modal-field">
              <label htmlFor="donor-amount">Gift Amount</label>
              <input
                id="donor-amount"
                value={form.amount}
                onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
              />
            </div>

            <div className="dn-modal-field">
              <label htmlFor="donor-campaign-input">Campaign</label>
              <select
                id="donor-campaign-input"
                value={form.campaign}
                onChange={(event) =>
                  setForm((current) => ({ ...current, campaign: event.target.value }))
                }
              >
                {campaignOptions.map((campaign) => (
                  <option key={campaign}>{campaign}</option>
                ))}
              </select>
            </div>

            <div className="dn-modal-field">
              <label htmlFor="donor-status-input">Status</label>
              <select
                id="donor-status-input"
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({ ...current, status: event.target.value }))
                }
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </div>

            <div className="dn-modal-field">
              <label htmlFor="donor-date">Date</label>
              <input
                id="donor-date"
                value={form.date}
                onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
              />
            </div>

            <div className="dn-modal-actions">
              <button type="button" className="dn-secondary-btn" onClick={() => setModalMode(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="dn-gold-btn"
                onClick={saveDonor}
                disabled={saving || !form.name.trim() || !form.email.trim()}
              >
                {saving
                  ? "Saving..."
                  : modalMode === "add"
                    ? "Create Donor"
                    : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {(modalMode === "email" || modalMode === "reengage") && (
        <div className="dn-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="dn-modal" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <h3 className="dn-modal-title">
                {modalMode === "reengage"
                  ? "Launch Re-engagement Campaign"
                  : "Email Donors"}
              </h3>
              <button type="button" className="dn-action-btn" onClick={() => setModalMode(null)}>
                <X size={18} />
              </button>
            </div>

            <p className="mt-3 text-sm text-[#5f7268]">
              Compose your message below. Email delivery integration is not configured —
              this prepares your outreach draft for review.
            </p>

            <div className="dn-modal-field">
              <label htmlFor="email-subject">Subject</label>
              <input
                id="email-subject"
                value={emailForm.subject}
                onChange={(event) =>
                  setEmailForm((current) => ({ ...current, subject: event.target.value }))
                }
              />
            </div>

            <div className="dn-modal-field">
              <label htmlFor="email-message">Message</label>
              <textarea
                id="email-message"
                rows={8}
                value={emailForm.message}
                onChange={(event) =>
                  setEmailForm((current) => ({ ...current, message: event.target.value }))
                }
              />
            </div>

            <div className="dn-modal-actions">
              <button type="button" className="dn-secondary-btn" onClick={() => setModalMode(null)}>
                Cancel
              </button>
              <button type="button" className="dn-gold-btn" onClick={() => setModalMode(null)}>
                Save Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
