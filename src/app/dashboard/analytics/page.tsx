"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CircleDollarSign,
  HandHeart,
  Home,
  Megaphone,
  Target,
  Users,
} from "lucide-react";

import HopeBridgeSidebar from "../components/HopeBridgeSidebar";
import {
  fetchOrganizationSnapshot,
  formatCurrency,
  type OrganizationSnapshot,
} from "@/services/organizationMetrics";

export default function AnalyticsPage() {
  const [snapshot, setSnapshot] = useState<OrganizationSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrganizationSnapshot()
      .then(setSnapshot)
      .catch(() => setSnapshot(null))
      .finally(() => setLoading(false));
  }, []);

  const hasData = useMemo(() => {
    if (!snapshot) return false;
    return (
      snapshot.activeCampaigns > 0 ||
      snapshot.activePrograms > 0 ||
      snapshot.beneficiaryCount > 0 ||
      snapshot.volunteerCount > 0 ||
      snapshot.fundsRaised > 0
    );
  }, [snapshot]);

  const kpis = [
    {
      label: "Beneficiaries Served",
      value: loading ? "—" : String(snapshot?.beneficiaryCount ?? 0),
      icon: HandHeart,
    },
    {
      label: "Programs On Target",
      value: loading ? "—" : String(snapshot?.programsOnTrack ?? 0),
      icon: Target,
    },
    {
      label: "Funds Deployed",
      value: loading ? "—" : formatCurrency(snapshot?.totalProgramSpent ?? 0),
      icon: CircleDollarSign,
    },
    {
      label: "Volunteer Hours",
      value: loading ? "—" : String(snapshot?.volunteerHours ?? 0),
      icon: Users,
    },
    {
      label: "Active Campaigns",
      value: loading ? "—" : String(snapshot?.activeCampaigns ?? 0),
      icon: Megaphone,
    },
    {
      label: "Funds Raised",
      value: loading ? "—" : formatCurrency(snapshot?.fundsRaised ?? 0),
      icon: BarChart3,
    },
  ];

  return (
    <div className="hb-app">
      <HopeBridgeSidebar activePath="/dashboard/analytics" />

      <main className="hb-module-main">
        <div className="mx-auto max-w-[1600px]">
          <nav className="mb-6 flex items-center gap-2 text-sm text-[#607269]">
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 hover:text-[#0d5f44]">
              <Home size={14} className="text-[#0d5f44]" />
              HopeBridge Foundation
            </Link>
            <span>/</span>
            <strong className="text-[#112e24]">Impact Analytics</strong>
          </nav>

          <header className="mb-8">
            <p className="text-[10px] font-extrabold tracking-[0.16em] text-[#9f7b24]">
              IMPACT INTELLIGENCE
            </p>
            <h1 className="mt-2 font-serif text-4xl font-bold text-[#112e24]">
              Impact <em className="text-[#0d5f44] not-italic">Analytics</em>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#607269]">
              Organization-wide outcome measurement derived from campaigns, programs,
              donors, volunteers, and beneficiaries.
            </p>
          </header>

          {!hasData && !loading ? (
            <div className="rounded-[20px] border border-[#ebe3d2] bg-white/90 p-12 text-center">
              <p className="font-serif text-xl font-bold text-[#112e24]">
                No analytics available yet.
              </p>
              <p className="mt-3 text-sm text-[#607269]">
                Impact analytics will appear as operational data is recorded across
                HopeBridge modules.
              </p>
            </div>
          ) : (
            <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {kpis.map((kpi) => {
                const Icon = kpi.icon;
                return (
                  <article
                    key={kpi.label}
                    className="rounded-[18px] border border-[#ebe3d2] bg-white/95 p-6 shadow-[0_8px_24px_rgba(0,45,35,0.04)]"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-[#607269]">{kpi.label}</p>
                        <p className="mt-3 font-serif text-3xl font-bold text-[#112e24]">
                          {kpi.value}
                        </p>
                      </div>
                      <div className="rounded-[12px] border border-[#ebe3d2] bg-[#f7f4eb] p-3 text-[#0d5f44]">
                        <Icon size={20} />
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
