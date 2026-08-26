"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { DEPARTMENTS, ROLES } from "../data";
import type { CreateTeamForm, Team, TeamMember } from "../types";

type Props = {
  members: TeamMember[];
  team?: Team | null;
  onClose: () => void;
  onCreate: (form: CreateTeamForm) => void;
  onUpdate?: (teamId: string, form: CreateTeamForm) => void;
  onDelete?: (teamId: string) => void;
};

const STEPS = ["Team Details", "Leadership", "Members", "Permissions", "Review"];

function teamToForm(team: Team): CreateTeamForm {
  return {
    name: team.name,
    department: team.department,
    description: team.description,
    leadId: team.leadId,
    secondaryLeadId: team.secondaryLeadId ?? "",
    memberIds: team.memberIds.filter((id) => id !== team.leadId),
    defaultPermission: team.defaultPermission,
  };
}

export default function CreateTeamModal({
  members,
  team,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: Props) {
  const isEditing = Boolean(team);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<CreateTeamForm>(
    team
      ? teamToForm(team)
      : {
          name: "",
          department: DEPARTMENTS[0],
          description: "",
          leadId: "",
          secondaryLeadId: "",
          memberIds: [],
          defaultPermission: "Team Lead",
        },
  );
  const [memberSearch, setMemberSearch] = useState("");

  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q) ||
        m.department.toLowerCase().includes(q),
    );
  }, [members, memberSearch]);

  function toggleMember(id: string) {
    setForm((f) => ({
      ...f,
      memberIds: f.memberIds.includes(id)
        ? f.memberIds.filter((m) => m !== id)
        : [...f.memberIds, id],
    }));
  }

  function canNext() {
    if (step === 0) return form.name.trim().length > 0 && form.department;
    if (step === 1) return form.leadId.length > 0;
    if (step === 2) return form.memberIds.length > 0;
    return true;
  }

  function handleSubmit() {
    const lead = members.find((m) => m.id === form.leadId);
    const ids = new Set([form.leadId, ...form.memberIds]);
    if (form.secondaryLeadId) ids.add(form.secondaryLeadId);
    const payload = {
      ...form,
      memberIds: Array.from(ids),
      leadId: form.leadId,
    };
    if (!lead) return;
    if (isEditing && team && onUpdate) {
      onUpdate(team.id, payload);
      return;
    }
    onCreate(payload);
  }

  function handleDeleteTeam() {
    if (!team || !onDelete) return;
    if (!window.confirm(`Delete team "${team.name}" and all related assignments, discussions, and meetings?`)) {
      return;
    }
    onDelete(team.id);
  }

  return (
    <>
      <div className="tm-overlay" onClick={onClose} aria-hidden="true" />
      <div className="tm-modal" role="dialog" aria-labelledby="create-team-title">
        <div className="flex items-center justify-between border-b border-[#e4dac6] px-6 py-4">
          <div>
            <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#9f7b24]">
              STEP {step + 1} OF {STEPS.length}
            </p>
            <h2 id="create-team-title" className="font-serif text-xl font-bold text-[#022c22]">
              {isEditing ? "Edit Team" : "Create Team"} — {STEPS[step]}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5">
          {step === 0 && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-[#334b41]">
                Team Name
                <input
                  className="mt-1 w-full rounded-xl border border-[#e4dac6] px-4 py-3"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Community Outreach"
                />
              </label>
              <label className="block text-sm font-medium text-[#334b41]">
                Department
                <select
                  className="mt-1 w-full rounded-xl border border-[#e4dac6] px-4 py-3"
                  value={form.department}
                  onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-[#334b41]">
                Description
                <textarea
                  className="mt-1 w-full rounded-xl border border-[#e4dac6] px-4 py-3"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </label>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-[#334b41]">
                Team Lead
                <select
                  className="mt-1 w-full rounded-xl border border-[#e4dac6] px-4 py-3"
                  value={form.leadId}
                  onChange={(e) => setForm((f) => ({ ...f, leadId: e.target.value }))}
                >
                  <option value="">Select lead</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {m.role}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-[#334b41]">
                Secondary Lead (optional)
                <select
                  className="mt-1 w-full rounded-xl border border-[#e4dac6] px-4 py-3"
                  value={form.secondaryLeadId}
                  onChange={(e) => setForm((f) => ({ ...f, secondaryLeadId: e.target.value }))}
                >
                  <option value="">None</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {step === 2 && (
            <div>
              <input
                className="mb-3 w-full rounded-xl border border-[#e4dac6] px-4 py-2.5 text-sm"
                placeholder="Search members..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
              />
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {filteredMembers.map((m) => (
                  <label
                    key={m.id}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#e4dac6] px-3 py-2.5"
                  >
                    <input
                      type="checkbox"
                      checked={form.memberIds.includes(m.id) || form.leadId === m.id}
                      disabled={form.leadId === m.id}
                      onChange={() => toggleMember(m.id)}
                    />
                    <span className="text-sm font-medium text-[#18392e]">{m.name}</span>
                    <span className="text-xs text-[#65766e]">{m.role}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <label className="block text-sm font-medium text-[#334b41]">
              Default access level
              <select
                className="mt-1 w-full rounded-xl border border-[#e4dac6] px-4 py-3"
                value={form.defaultPermission}
                onChange={(e) => setForm((f) => ({ ...f, defaultPermission: e.target.value }))}
              >
                {ROLES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
          )}

          {step === 4 && (
            <div className="space-y-2 text-sm text-[#334b41]">
              <p><strong>Team:</strong> {form.name}</p>
              <p><strong>Department:</strong> {form.department}</p>
              <p><strong>Lead:</strong> {members.find((m) => m.id === form.leadId)?.name}</p>
              <p><strong>Members:</strong> {form.memberIds.length + (form.leadId ? 1 : 0)}</p>
              <p><strong>Permission:</strong> {form.defaultPermission}</p>
            </div>
          )}
        </div>

        <div className="flex justify-between border-t border-[#e4dac6] px-6 py-4">
          <div className="flex gap-2">
            <button
              type="button"
              className="tm-secondary-btn"
              disabled={step === 0}
              onClick={() => setStep((s) => s - 1)}
            >
              <ChevronLeft size={16} /> Back
            </button>
            {isEditing && onDelete && (
              <button type="button" className="tm-secondary-btn text-[#be123c]" onClick={handleDeleteTeam}>
                Delete Team
              </button>
            )}
          </div>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              className="tm-gold-btn"
              disabled={!canNext()}
              onClick={() => setStep((s) => s + 1)}
            >
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button type="button" className="tm-gold-btn" onClick={handleSubmit}>
              {isEditing ? "Save Team" : "Create Team"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
