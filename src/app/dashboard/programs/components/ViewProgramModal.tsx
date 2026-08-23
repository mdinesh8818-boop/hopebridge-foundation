"use client";

import { useState } from "react";
import {
  CalendarDays,
  DollarSign,
  MapPin,
  Target,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { Program } from "../types";
import { formatCurrency, priorityColor, statusColor } from "../utils";

interface ViewProgramModalProps {
  isOpen: boolean;
  program: Program | null;
  onClose: () => void;
}

const TABS = [
  "Overview",
  "Budget & Finance",
  "Activities",
  "Beneficiaries",
  "Documents",
  "Team",
  "Reports",
] as const;

type Tab = (typeof TABS)[number];

export default function ViewProgramModal({
  isOpen,
  program,
  onClose,
}: ViewProgramModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  if (!isOpen || !program) return null;

  const budgetUsed =
    program.budget > 0
      ? Math.min(Math.round((program.spent / program.budget) * 100), 100)
      : 0;

  return (
    <div
      className="pn-modal-overlay fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="pn-modal max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[22px]">
        <div className="border-b border-[#f0eadf] px-6 py-5 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="pn-kicker">PROGRAM DETAILS</p>
              <h2 className="pn-section-title mt-1">{program.name}</h2>
              <p className="mt-1 text-sm text-[#607269]">
                {program.category} · {program.location}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close program details"
              className="rounded-xl border border-[#e4dac6] bg-[#fffdfa] p-2.5 text-[#65766e] hover:bg-[#f4fbf7]"
            >
              <X size={19} />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusColor(program.status)}`}
            >
              {program.status}
            </span>
            <span
              className={`rounded-full border border-[#e4dac6] bg-[#fffdfa] px-3 py-1 text-xs font-semibold ${priorityColor(program.priority)}`}
            >
              {program.priority} priority
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 border-b border-[#f0eadf] pb-1">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={
                  activeTab === tab
                    ? "rounded-t-lg border border-b-0 border-[#e4dac6] bg-[#fffdfa] px-3 py-2 text-xs font-semibold text-[#0d5f44]"
                    : "rounded-t-lg px-3 py-2 text-xs font-medium text-[#929d97] hover:text-[#334b41]"
                }
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {activeTab === "Overview" && (
            <>
              <div className="rounded-2xl border border-[#ebe3d2] bg-[#fffdfa] p-5">
                <h3 className="font-semibold text-[#112e24]">Program Overview</h3>
                <p className="mt-3 leading-7 text-[#607269]">{program.description}</p>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <DetailCard icon={UserRound} label="Program Manager" value={program.manager} />
                <DetailCard icon={MapPin} label="Location" value={program.location} />
                <DetailCard icon={Users} label="Beneficiaries" value={program.beneficiaries.toLocaleString()} />
                <DetailCard icon={DollarSign} label="Total Budget" value={formatCurrency(program.budget)} />
                <DetailCard icon={CalendarDays} label="Start Date" value={program.startDate} />
                <DetailCard icon={CalendarDays} label="End Date" value={program.endDate} />
              </div>
            </>
          )}

          {activeTab === "Budget & Finance" && (
            <div className="grid gap-5 lg:grid-cols-2">
              <ProgressCard
                title="Program Progress"
                value={`${program.progress}%`}
                percent={program.progress}
                icon={Target}
              />
              <ProgressCard
                title="Budget Utilization"
                value={`${budgetUsed}%`}
                percent={budgetUsed}
                icon={DollarSign}
                subtitle={`${formatCurrency(program.spent)} spent of ${formatCurrency(program.budget)}`}
              />
            </div>
          )}

          {activeTab === "Activities" && (
            <div className="rounded-2xl border border-[#ebe3d2] bg-[#fffdfa] p-5">
              <h3 className="font-semibold text-[#112e24]">Program Activities</h3>
              <p className="mt-3 text-sm leading-7 text-[#607269]">{program.description}</p>
              <p className="mt-4 text-sm text-[#929d97]">
                Active period: {program.startDate} — {program.endDate}
              </p>
            </div>
          )}

          {activeTab === "Beneficiaries" && (
            <div className="rounded-2xl border border-[#ebe3d2] bg-[#fffdfa] p-5">
              <h3 className="font-semibold text-[#112e24]">Beneficiary Reach</h3>
              <p className="mt-3 font-serif text-3xl font-bold text-[#0d5f44]">
                {program.beneficiaries.toLocaleString()}
              </p>
              <p className="mt-2 text-sm text-[#607269]">
                Total beneficiaries supported through this program in {program.location}.
              </p>
            </div>
          )}

          {activeTab === "Documents" && (
            <EmptyTab message="No documents have been uploaded for this program yet." />
          )}

          {activeTab === "Team" && (
            <div className="rounded-2xl border border-[#ebe3d2] bg-[#fffdfa] p-5">
              <h3 className="font-semibold text-[#112e24]">Program Team</h3>
              <DetailCard icon={UserRound} label="Program Manager" value={program.manager} />
            </div>
          )}

          {activeTab === "Reports" && (
            <div className="grid gap-4 sm:grid-cols-3">
              <Metric label="Progress" value={`${program.progress}%`} />
              <Metric label="Budget Used" value={`${budgetUsed}%`} />
              <Metric label="Status" value={program.status} />
            </div>
          )}

          <div className="mt-8 flex justify-end border-t border-[#f0eadf] pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#e4dac6] bg-[#fffdfa] px-5 py-2.5 text-sm font-semibold text-[#334b41] hover:bg-[#f4fbf7]"
            >
              Close
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function DetailCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#ebe3d2] bg-[#fffdfa] p-4">
      <div className="pn-icon-emerald">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs text-[#929d97]">{label}</p>
        <p className="mt-0.5 font-semibold text-[#112e24]">{value}</p>
      </div>
    </div>
  );
}

function ProgressCard({
  title,
  value,
  percent,
  icon: Icon,
  subtitle,
}: {
  title: string;
  value: string;
  percent: number;
  icon: typeof Target;
  subtitle?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#ebe3d2] bg-[#fffdfa] p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#607269]">{title}</p>
          <h3 className="mt-1 font-serif text-2xl font-bold text-[#112e24]">{value}</h3>
        </div>
        <Icon className="text-[#0d5f44]" size={22} />
      </div>
      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#eee6d7]">
        <div className="pn-progress-fill" style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
      {subtitle && <p className="mt-3 text-sm text-[#929d97]">{subtitle}</p>}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#ebe3d2] bg-[#fffdfa] p-4 text-center">
      <p className="text-xs uppercase tracking-wider text-[#929d97]">{label}</p>
      <p className="mt-2 font-serif text-xl font-bold text-[#112e24]">{value}</p>
    </div>
  );
}

function EmptyTab({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#e4dac6] bg-[#fffdfa] p-8 text-center">
      <p className="text-sm text-[#607269]">{message}</p>
    </div>
  );
}
