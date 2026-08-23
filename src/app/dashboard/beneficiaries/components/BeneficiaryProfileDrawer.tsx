"use client";

import { Edit3, Trash2, X } from "lucide-react";

import type { ActivityEvent, Beneficiary, ProfileTab } from "../types";
import { formatDate, formatRelativeTime, getInitials, getStatusClass } from "../utils";

type BeneficiaryProfileDrawerProps = {
  beneficiary: Beneficiary | null;
  activity: ActivityEvent[];
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  onClose: () => void;
  onEdit: (beneficiary: Beneficiary) => void;
  onDelete: (beneficiary: Beneficiary) => void;
};

const TABS: { id: ProfileTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "services", label: "Services" },
  { id: "programs", label: "Programs" },
  { id: "outcomes", label: "Outcomes" },
  { id: "followups", label: "Follow-Ups" },
  { id: "history", label: "History" },
];

export default function BeneficiaryProfileDrawer({
  beneficiary,
  activity,
  activeTab,
  onTabChange,
  onClose,
  onEdit,
  onDelete,
}: BeneficiaryProfileDrawerProps) {
  if (!beneficiary) return null;

  const history = activity.filter((a) => a.beneficiaryId === beneficiary.id);

  return (
    <div className="bf-profile-drawer">
      <button
        type="button"
        className="bf-filter-drawer-overlay"
        onClick={onClose}
        aria-label="Close profile"
      />

      <aside className="bf-profile-panel">
        <div className="bf-panel-dark m-0 rounded-none border-0 border-b border-[rgba(212,175,55,0.24)] p-5">
          <div className="relative z-[1] flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[rgba(212,175,55,0.35)] bg-[rgba(212,175,55,0.12)] text-sm font-bold text-[#f3e5ab]">
                {getInitials(beneficiary.name)}
              </div>
              <div>
                <p className="text-[10px] font-extrabold tracking-[0.12em] text-[#e4bf4f]">
                  {beneficiary.beneficiaryId}
                </p>
                <h2 className="font-serif text-xl font-bold text-[#f7f3e8]">
                  {beneficiary.name}
                </h2>
                <span className={`mt-1 inline-flex ${getStatusClass(beneficiary.status)}`}>
                  {beneficiary.status}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[rgba(212,175,55,0.25)] text-[#f7f3e8]"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="bf-profile-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`bf-profile-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === "overview" && (
            <div className="space-y-3 text-sm text-[#607269]">
              <Row label="Location" value={`${beneficiary.location} · ${beneficiary.region}`} />
              <Row label="Program" value={beneficiary.program} />
              <Row label="Coordinator" value={beneficiary.coordinator} />
              <Row label="Enrollment" value={formatDate(beneficiary.enrollmentDate)} />
              <Row label="Journey stage" value={beneficiary.journeyStage} />
              {beneficiary.notes && (
                <div className="mt-4 rounded-xl border border-[#ebe3d2] bg-[#fffdfa] p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#9f7b24]">Notes</p>
                  <p className="mt-2 leading-6">{beneficiary.notes}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "services" && (
            <div className="space-y-3 text-sm text-[#607269]">
              <Row label="Support type" value={beneficiary.supportType} />
              <Row label="Service status" value={beneficiary.status} />
              <Row label="Last support" value={formatDate(beneficiary.lastSupportDate)} />
            </div>
          )}

          {activeTab === "programs" && (
            <div className="space-y-3 text-sm text-[#607269]">
              <Row label="Enrolled program" value={beneficiary.program} />
              <Row label="Support category" value={beneficiary.supportType} />
              <Row label="Enrollment date" value={formatDate(beneficiary.enrollmentDate)} />
            </div>
          )}

          {activeTab === "outcomes" && (
            <div className="space-y-3 text-sm text-[#607269]">
              <Row label="Outcome status" value={beneficiary.outcomeStatus} />
              <Row label="Journey stage" value={beneficiary.journeyStage} />
              <Row label="Last support" value={formatDate(beneficiary.lastSupportDate)} />
            </div>
          )}

          {activeTab === "followups" && (
            <div className="space-y-3 text-sm text-[#607269]">
              <Row label="Follow-up status" value={beneficiary.followUpStatus} />
              <Row label="Next follow-up" value={formatDate(beneficiary.nextFollowUp)} />
              <Row label="Assigned coordinator" value={beneficiary.coordinator} />
            </div>
          )}

          {activeTab === "history" && (
            <div className="bf-timeline">
              {history.length === 0 ? (
                <p className="text-sm text-[#929d97]">No recorded activity for this beneficiary.</p>
              ) : (
                history.map((event) => (
                  <div key={event.id} className="bf-timeline-item">
                    <span className="bf-timeline-node" />
                    <p className="text-sm font-medium text-[#18392e]">{event.type}</p>
                    <p className="mt-1 text-xs leading-5 text-[#929d97]">{event.detail}</p>
                    <p className="mt-1 text-[11px] text-[#c2cbc6]">
                      {formatRelativeTime(event.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 flex gap-3 border-t border-[#ebe3d2] bg-[#fffef9] p-5">
          <button type="button" className="bf-secondary-btn flex-1" onClick={() => onEdit(beneficiary)}>
            <Edit3 size={16} />
            Edit
          </button>
          <button type="button" className="bf-delete-btn" onClick={() => onDelete(beneficiary)}>
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </aside>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <strong className="text-[#18392e]">{label}:</strong> {value}
    </p>
  );
}
