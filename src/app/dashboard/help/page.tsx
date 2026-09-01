"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  FileBarChart,
  HandHeart,
  HelpCircle,
  Home,
  Megaphone,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

import HopeBridgeSidebar from "../components/HopeBridgeSidebar";
import "../styles/hopebridge.css";

type HelpTopic = {
  id: string;
  title: string;
  section: string;
  icon: React.ElementType;
  summary: string;
  steps: string[];
  tips?: string[];
};

const helpTopics: HelpTopic[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    section: "Getting Started",
    icon: Sparkles,
    summary: "Learn the HopeBridge workspace and how modules connect.",
    steps: [
      "Sign in through the HopeBridge login page.",
      "Review the Dashboard for organization-wide metrics and quick actions.",
      "Use the left navigation to move between Foundation, Operations, Intelligence, and Administration modules.",
      "Open Mission & Vision to confirm your organization's strategic direction.",
    ],
    tips: ["Bookmark the Dashboard for daily operational check-ins."],
  },
  {
    id: "dashboard",
    title: "Dashboard Overview",
    section: "Dashboard Overview",
    icon: Home,
    summary: "Understand KPI cards, performance charts, and activity feeds.",
    steps: [
      "Review foundation performance metrics at the top of the Dashboard.",
      "Use metric cards to jump directly into Campaigns, Programs, Donors, and other modules.",
      "Monitor recent activity and upcoming deadlines in the lower panels.",
      "Use the global search bar to locate modules and records quickly.",
    ],
  },
  {
    id: "mission-vision",
    title: "Mission & Vision",
    section: "Mission & Vision",
    icon: Target,
    summary: "Maintain your organization's mission, vision, values, and strategic goals.",
    steps: [
      "Open Mission & Vision from the Foundation group.",
      "Select Update Mission & Vision to edit mission and vision statements.",
      "Review Core Values that guide organizational decisions.",
      "Add or update Strategic Goals and track progress percentages.",
    ],
  },
  {
    id: "create-campaign",
    title: "Creating a Campaign",
    section: "Creating a Campaign",
    icon: Megaphone,
    summary: "Launch a new fundraising campaign with goals, dates, and ownership.",
    steps: [
      "Navigate to Campaigns and select Create Campaign.",
      "Enter the campaign name, category, target amount, and dates.",
      "Assign an owner or responsible team and select a campaign channel.",
      "Save the campaign to add it to your campaign portfolio.",
    ],
  },
  {
    id: "manage-campaigns",
    title: "Managing Campaigns",
    section: "Managing Campaigns",
    icon: Megaphone,
    summary: "Search, filter, edit, view, and delete campaign records.",
    steps: [
      "Use the search bar to find campaigns by name, category, owner, or status.",
      "Apply Campaign Filters to narrow by status or category.",
      "Select View to inspect campaign details and fundraising progress.",
      "Use Edit or Delete actions from the campaign records table as needed.",
    ],
  },
  {
    id: "programs",
    title: "Creating and Managing Programs",
    section: "Creating and Managing Programs",
    icon: BookOpen,
    summary: "Manage community programs, budgets, timelines, and outcomes.",
    steps: [
      "Open Programs from the Foundation navigation group.",
      "Create a new program with category, budget, timeline, and leadership details.",
      "Track program status, beneficiaries served, and funding progress.",
      "Use filters and search to manage active and completed programs.",
    ],
  },
  {
    id: "donors",
    title: "Donor Management",
    section: "Donor Management",
    icon: CircleDollarSign,
    summary: "Steward donor relationships and monitor giving activity.",
    steps: [
      "Open Donors to review donor profiles and recent contributions.",
      "Track retention, average gift size, and campaign attribution.",
      "Use donor records to support outreach and stewardship planning.",
    ],
  },
  {
    id: "volunteers",
    title: "Volunteer Management",
    section: "Volunteer Management",
    icon: Users,
    summary: "Coordinate volunteers, hours, and engagement.",
    steps: [
      "Open Volunteers to review participation and assignments.",
      "Track hours contributed and team engagement over time.",
      "Use volunteer insights to improve recruitment and retention.",
    ],
  },
  {
    id: "beneficiaries",
    title: "Beneficiary Management",
    section: "Beneficiary Management",
    icon: HandHeart,
    summary: "Monitor people and communities served by your programs.",
    steps: [
      "Open Beneficiaries to review service history and program enrollment.",
      "Track impact metrics connected to beneficiary outcomes.",
    ],
  },
  {
    id: "teams",
    title: "Teams",
    section: "Teams",
    icon: Users,
    summary: "Organize staff and volunteer teams across the foundation.",
    steps: [
      "Open Teams to review team structure and assignments.",
      "Use team records to coordinate responsibilities across modules.",
    ],
  },
  {
    id: "analytics",
    title: "Impact Analytics",
    section: "Impact Analytics",
    icon: FileBarChart,
    summary: "Review evidence-based performance across the organization.",
    steps: [
      "Open Impact Analytics for KPI trends and module performance.",
      "Use analytics insights to inform leadership and board reporting.",
    ],
  },
  {
    id: "ai-assistant",
    title: "AI Assistant",
    section: "AI Assistant",
    icon: BrainCircuit,
    summary: "Use HopeBridge AI for strategic recommendations and operational guidance.",
    steps: [
      "Open AI Assistant from the Intelligence group.",
      "Review the executive briefing and organizational alerts from live records.",
      "Ask questions in Strategic Conversation — responses stay grounded in HopeBridge data.",
      "Use connected data source chips to jump to Campaigns, Programs, Donors, and other modules.",
    ],
  },
  {
    id: "activity",
    title: "Organization Activity",
    section: "Organization Activity",
    icon: Activity,
    summary: "Review a chronological feed of changes across HopeBridge modules.",
    steps: [
      "Open Activity from the Intelligence navigation group or Dashboard.",
      "Scan recent creates, updates, and deletions logged by operational modules.",
      "Use module links on the Dashboard to return to the record that triggered an event.",
    ],
  },
  {
    id: "reports",
    title: "Reports",
    section: "Reports",
    icon: FileBarChart,
    summary: "Export executive summaries built from connected organizational records.",
    steps: [
      "Open Reports to view executive, program delivery, and attention summaries.",
      "Select Export CSV to download a spreadsheet for board or leadership review.",
      "Use Refresh report after updating campaigns, programs, or donor records.",
    ],
  },
  {
    id: "calendar",
    title: "Calendar",
    section: "Calendar",
    icon: CalendarDays,
    summary: "See campaign dates, program timelines, and team meetings in one list.",
    steps: [
      "Open Calendar to review dates pulled from campaigns, programs, and team meetings.",
      "Filter by event type when coordinating fundraising, delivery, or meeting schedules.",
      "Update source records in Campaigns, Programs, or Teams to change calendar entries.",
    ],
  },
  {
    id: "organization",
    title: "Organization Profile",
    section: "Organization Profile",
    icon: ShieldCheck,
    summary: "Maintain foundation contact details and the Core Strategy Resources link.",
    steps: [
      "Open Organization under Administration.",
      "Update legal name, contact information, and operating preferences.",
      "Configure the approved Core Strategy Resources URL — HopeBridge will not invent a destination.",
    ],
  },
  {
    id: "settings",
    title: "Account Settings",
    section: "Account Settings",
    icon: Settings,
    summary: "Manage notifications, workspace defaults, and payment readiness status.",
    steps: [
      "Open Settings to save notification and workspace preferences per user.",
      "Review payment readiness sections for donation processing and SaaS billing status.",
    ],
  },
  {
    id: "security",
    title: "Security & Data",
    section: "Security & Data",
    icon: ShieldCheck,
    summary: "Understand how HopeBridge handles authentication and data persistence.",
    steps: [
      "Sign in using your organization credentials through Firebase Authentication.",
      "Operational records — campaigns, programs, donors, volunteers, beneficiaries, teams, and mission data — are stored in Firestore.",
      "HopeBridge requires a signed-in account to read or write organizational records.",
      "Contact your administrator for access control and account recovery.",
    ],
    tips: [
      "Do not share login credentials. Sign out on shared devices.",
    ],
  },
];

const faqs = [
  {
    q: "How do I return to the Dashboard from any module?",
    a: "Use Back to Dashboard at the top of module pages or select Dashboard in the sidebar navigation.",
  },
  {
    q: "Where are my campaign records stored?",
    a: "Campaigns and other operational modules save to Firestore. You must be signed in to view or edit records.",
  },
  {
    q: "Can I edit Mission & Vision after initial setup?",
    a: "Yes. Open Mission & Vision and select Update Mission & Vision to revise statements at any time.",
  },
  {
    q: "How do I filter campaigns?",
    a: "On the Campaigns page, use Campaign Filters to narrow results by status or category.",
  },
];

export default function HelpCenterPage() {
  const [query, setQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeTopic, setActiveTopic] = useState<string>("getting-started");

  const filteredTopics = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return helpTopics;
    return helpTopics.filter(
      (topic) =>
        topic.title.toLowerCase().includes(q) ||
        topic.section.toLowerCase().includes(q) ||
        topic.summary.toLowerCase().includes(q) ||
        topic.steps.some((step) => step.toLowerCase().includes(q))
    );
  }, [query]);

  const selected =
    filteredTopics.find((topic) => topic.id === activeTopic) ??
    filteredTopics[0] ??
    helpTopics[0];

  const SelectedIcon = selected.icon;

  return (
    <div className="hb-app">
      <HopeBridgeSidebar activePath="/dashboard/help" />
      <main className="hb-module-main px-5 py-7 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1500px]">
        <nav className="flex flex-wrap items-center gap-2 text-xs text-[#65766e]">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 hover:text-[#0d5f44]">
            <Home size={14} className="text-[#0d5f44]" />
            HopeBridge Foundation
          </Link>
          <span className="text-[#c2cbc6]">/</span>
          <span className="font-medium text-[#18392e]">Help Center</span>
        </nav>

        <Link
          href="/dashboard"
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[#e4dac6] bg-white px-4 py-2.5 text-sm font-medium text-[#2d493e] shadow-sm"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        <section className="hb-hero relative mt-6 overflow-hidden rounded-[22px] border border-[#ceb223]/45 shadow-[0_18px_46px_rgba(22,66,47,.12)]">
          <div className="hb-hero-arc hb-hero-arc-one" aria-hidden="true" />
          <div className="relative z-[2] px-6 py-8 sm:px-9 sm:py-10">
            <div className="hb-pill inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-extrabold tracking-[1.6px] text-[#f4d35c]">
              <HelpCircle size={14} />
              PRODUCT GUIDANCE
            </div>
            <h1 className="hb-serif mt-5 text-4xl font-bold text-white sm:text-5xl">
              HopeBridge <span className="hb-gold-text">Help Center</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75 sm:text-[15px]">
              Search guides, follow step-by-step instructions, and learn how to
              use every HopeBridge module with confidence.
            </p>

            <div className="relative mt-6 max-w-xl">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#f4d35c]" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search help topics..."
                className="w-full rounded-xl border border-white/20 bg-white/10 py-3 pl-12 pr-4 text-sm text-white outline-none placeholder:text-white/50 backdrop-blur-sm focus:border-[#f4d35c]/50"
              />
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-6 xl:grid-cols-[320px_1fr]">
          <aside className="hb-panel rounded-[18px] p-4">
            <p className="text-[10px] font-extrabold tracking-[1.3px] text-[#9f7b24]">
              TOPICS
            </p>
            <div className="mt-3 max-h-[520px] space-y-1 overflow-y-auto">
              {filteredTopics.map((topic) => {
                const Icon = topic.icon;
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => setActiveTopic(topic.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                      selected.id === topic.id
                        ? "border border-[#efd786] bg-[#fffaf0] text-[#18382e]"
                        : "border border-transparent text-[#65766e] hover:bg-[#fffdfa]"
                    }`}
                  >
                    <Icon size={16} className="shrink-0 text-[#0d5f44]" />
                    {topic.title}
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="space-y-6">
            <article className="hb-panel rounded-[18px] p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-[#efd786] bg-[#fff4d0] text-[#8b6005]">
                  <SelectedIcon size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-extrabold tracking-[1.3px] text-[#9f7b24]">
                    {selected.section.toUpperCase()}
                  </p>
                  <h2 className="hb-serif mt-1 text-3xl font-bold text-[#18392e]">
                    {selected.title}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-[#607269]">
                    {selected.summary}
                  </p>
                </div>
              </div>

              <ol className="mt-8 space-y-4">
                {selected.steps.map((step, index) => (
                  <li key={step} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#efd786] bg-[#fffaf0] text-sm font-bold text-[#9e7b24]">
                      {index + 1}
                    </span>
                    <p className="pt-1 text-sm leading-7 text-[#334b41]">{step}</p>
                  </li>
                ))}
              </ol>

              {selected.tips && (
                <div className="mt-8 rounded-2xl border border-[#c4e8d4] bg-[#f4fbf7] p-5">
                  <p className="text-sm font-semibold text-[#08734f]">Tip</p>
                  {selected.tips.map((tip) => (
                    <p key={tip} className="mt-2 text-sm leading-6 text-[#607269]">
                      {tip}
                    </p>
                  ))}
                </div>
              )}
            </article>

            <section className="hb-panel rounded-[18px] p-6 sm:p-8">
              <p className="text-[10px] font-extrabold tracking-[1.3px] text-[#9f7b24]">
                FREQUENTLY ASKED QUESTIONS
              </p>
              <h3 className="hb-serif mt-2 text-2xl font-bold text-[#18392e]">
                Common questions
              </h3>
              <div className="mt-5 space-y-3">
                {faqs.map((faq, index) => (
                  <div key={faq.q} className="rounded-xl border border-[#ebe3d2] bg-[#fffdfa]">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(openFaq === index ? null : index)}
                      className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
                    >
                      <span className="font-medium text-[#18382e]">{faq.q}</span>
                      <ChevronDown
                        size={18}
                        className={`shrink-0 text-[#929d97] transition ${openFaq === index ? "rotate-180" : ""}`}
                      />
                    </button>
                    {openFaq === index && (
                      <p className="border-t border-[#f0eadf] px-4 pb-4 pt-3 text-sm leading-7 text-[#607269]">
                        {faq.a}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[18px] border border-[#ceb223]/45 bg-gradient-to-br from-[#003f2f] to-[#005b40] p-6 text-white sm:p-8">
              <h3 className="hb-serif text-2xl font-bold">Contact / Support</h3>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75">
                Need additional assistance? Contact your HopeBridge administrator or
                foundation operations team for account, access, and workflow support.
              </p>
              <Link
                href="/dashboard/settings"
                className="hb-gold-btn mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold"
              >
                Open Settings
              </Link>
            </section>
          </div>
        </div>
      </div>
      </main>
    </div>
  );
}
