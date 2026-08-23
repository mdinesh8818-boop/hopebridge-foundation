"use client";

import { Sparkles, X } from "lucide-react";

import { COORDINATORS, PROGRAMS, REGIONS, SUPPORT_TYPES } from "../data";
import type { BeneficiaryFormData, JourneyStage, ServiceStatus } from "../types";

type BeneficiaryFormModalProps = {
  isOpen: boolean;
  isEditing: boolean;
  formData: BeneficiaryFormData;
  onClose: () => void;
  onSave: () => void;
  onSaveAndAddAnother?: () => void;
  onChange: <K extends keyof BeneficiaryFormData>(
    field: K,
    value: BeneficiaryFormData[K],
  ) => void;
};

const STATUSES: ServiceStatus[] = [
  "Enrolled",
  "Active",
  "Under Review",
  "Follow-Up Required",
  "Completed",
  "Inactive",
];

const JOURNEY: JourneyStage[] = [
  "Enrolled",
  "Needs Assessed",
  "Support Assigned",
  "Service Active",
  "Outcome Review",
  "Follow-Up",
];

const FOLLOW_UP = ["None", "Required", "Overdue", "Scheduled", "Completed"] as const;
const OUTCOMES = ["Pending", "Positive", "In Progress", "Review Due"] as const;

export default function BeneficiaryFormModal({
  isOpen,
  isEditing,
  formData,
  onClose,
  onSave,
  onSaveAndAddAnother,
  onChange,
}: BeneficiaryFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="bf-overlay fixed inset-0 z-[100] flex items-center justify-center px-4 py-6">
      <div className="hb-modal relative max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-[22px] p-6 sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-xl border border-[#e4dac6] bg-[#fffdfa] text-[#65766e]"
          aria-label="Close beneficiary form"
        >
          <X size={19} />
        </button>

        <div className="bf-panel-dark mb-6 p-5">
          <p className="relative z-[1] flex items-center gap-2 text-[10px] font-extrabold tracking-[0.14em] text-[#e4bf4f]">
            <Sparkles size={15} />
            BENEFICIARY SERVICES
          </p>
          <h2 className="relative z-[1] mt-2 font-serif text-2xl font-bold text-[#f7f3e8]">
            {isEditing ? "Edit Beneficiary" : "Add Beneficiary"}
          </h2>
          <p className="relative z-[1] mt-2 text-sm text-[rgba(247,243,232,0.62)]">
            Register community members receiving HopeBridge support. Collect only
            information needed for service administration.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.12em] text-[#9f7b24]">
              Basic Information
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-[#334b41]">Full name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => onChange("name", e.target.value)}
                  className="bf-input mt-2 w-full rounded-xl px-4 py-3 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#334b41]">Beneficiary ID</label>
                <input
                  type="text"
                  value={formData.beneficiaryId}
                  onChange={(e) => onChange("beneficiaryId", e.target.value)}
                  className="bf-input mt-2 w-full rounded-xl px-4 py-3 text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.12em] text-[#9f7b24]">
              Location
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-[#334b41]">City / Community</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => onChange("location", e.target.value)}
                  className="bf-input mt-2 w-full rounded-xl px-4 py-3 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#334b41]">Region</label>
                <select
                  value={formData.region}
                  onChange={(e) => onChange("region", e.target.value)}
                  className="bf-input mt-2 w-full rounded-xl px-4 py-3 text-sm"
                >
                  <option value="">Select region</option>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.12em] text-[#9f7b24]">
              Program Enrollment
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-[#334b41]">HopeBridge program</label>
                <select
                  value={formData.program}
                  onChange={(e) => onChange("program", e.target.value)}
                  className="bf-input mt-2 w-full rounded-xl px-4 py-3 text-sm"
                >
                  <option value="">Select program</option>
                  {PROGRAMS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[#334b41]">Support / service type</label>
                <select
                  value={formData.supportType}
                  onChange={(e) => onChange("supportType", e.target.value)}
                  className="bf-input mt-2 w-full rounded-xl px-4 py-3 text-sm"
                >
                  <option value="">Select support type</option>
                  {SUPPORT_TYPES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.12em] text-[#9f7b24]">
              Support Information
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-[#334b41]">Service status</label>
                <select
                  value={formData.status}
                  onChange={(e) => onChange("status", e.target.value as ServiceStatus)}
                  className="bf-input mt-2 w-full rounded-xl px-4 py-3 text-sm"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[#334b41]">Journey stage</label>
                <select
                  value={formData.journeyStage}
                  onChange={(e) => onChange("journeyStage", e.target.value as JourneyStage)}
                  className="bf-input mt-2 w-full rounded-xl px-4 py-3 text-sm"
                >
                  {JOURNEY.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[#334b41]">Enrollment date</label>
                <input
                  type="date"
                  value={formData.enrollmentDate}
                  onChange={(e) => onChange("enrollmentDate", e.target.value)}
                  className="bf-input mt-2 w-full rounded-xl px-4 py-3 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#334b41]">Last support date</label>
                <input
                  type="date"
                  value={formData.lastSupportDate}
                  onChange={(e) => onChange("lastSupportDate", e.target.value)}
                  className="bf-input mt-2 w-full rounded-xl px-4 py-3 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#334b41]">Follow-up status</label>
                <select
                  value={formData.followUpStatus}
                  onChange={(e) => onChange("followUpStatus", e.target.value as typeof formData.followUpStatus)}
                  className="bf-input mt-2 w-full rounded-xl px-4 py-3 text-sm"
                >
                  {FOLLOW_UP.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[#334b41]">Next follow-up</label>
                <input
                  type="date"
                  value={formData.nextFollowUp}
                  onChange={(e) => onChange("nextFollowUp", e.target.value)}
                  className="bf-input mt-2 w-full rounded-xl px-4 py-3 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#334b41]">Outcome status</label>
                <select
                  value={formData.outcomeStatus}
                  onChange={(e) => onChange("outcomeStatus", e.target.value as typeof formData.outcomeStatus)}
                  className="bf-input mt-2 w-full rounded-xl px-4 py-3 text-sm"
                >
                  {OUTCOMES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.12em] text-[#9f7b24]">
              Assignment
            </p>
            <label className="text-sm font-medium text-[#334b41]">Case coordinator</label>
            <select
              value={formData.coordinator}
              onChange={(e) => onChange("coordinator", e.target.value)}
              className="bf-input mt-2 w-full rounded-xl px-4 py-3 text-sm"
            >
              <option value="">Select coordinator</option>
              {COORDINATORS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.12em] text-[#9f7b24]">
              Notes
            </p>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => onChange("notes", e.target.value)}
              className="bf-input w-full rounded-xl px-4 py-3 text-sm"
              placeholder="Administrative notes (non-sensitive)"
            />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-end gap-3">
          <button type="button" className="bf-secondary-btn" onClick={onClose}>
            Cancel
          </button>
          {!isEditing && onSaveAndAddAnother && (
            <button type="button" className="bf-secondary-btn" onClick={onSaveAndAddAnother}>
              Save & Add Another
            </button>
          )}
          <button type="button" className="bf-gold-btn" onClick={onSave}>
            {isEditing ? "Save Changes" : "Save Beneficiary"}
          </button>
        </div>
      </div>
    </div>
  );
}
