"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type {
  AssignmentPriority,
  AssignmentStatus,
  Team,
  TeamAssignment,
  TeamMember,
} from "../types";

type Props = {
  teams: Team[];
  members: TeamMember[];
  assignment?: TeamAssignment | null;
  defaultTeamId?: string;
  onClose: () => void;
  onSave: (data: Omit<TeamAssignment, "id"> & { id?: string }) => void;
};

const STATUSES: AssignmentStatus[] = ["To Do", "In Progress", "In Review", "Completed"];
const PRIORITIES: AssignmentPriority[] = ["Low", "Medium", "High", "Critical"];

export default function AssignmentModal({
  teams,
  members,
  assignment,
  defaultTeamId,
  onClose,
  onSave,
}: Props) {
  const [title, setTitle] = useState(assignment?.title ?? "");
  const [teamId, setTeamId] = useState(assignment?.teamId ?? defaultTeamId ?? teams[0]?.id ?? "");
  const [ownerId, setOwnerId] = useState(assignment?.ownerId ?? "");
  const [priority, setPriority] = useState<AssignmentPriority>(assignment?.priority ?? "Medium");
  const [dueDate, setDueDate] = useState(assignment?.dueDate ?? "");
  const [status, setStatus] = useState<AssignmentStatus>(assignment?.status ?? "To Do");

  const team = teams.find((t) => t.id === teamId);
  const teamMembers = members.filter((m) => team?.memberIds.includes(m.id));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const owner = members.find((m) => m.id === ownerId);
    const t = teams.find((x) => x.id === teamId);
    if (!owner || !t || !title.trim()) return;
    onSave({
      id: assignment?.id,
      title: title.trim(),
      ownerId,
      ownerName: owner.name,
      teamId,
      teamName: t.name,
      priority,
      dueDate,
      status,
    });
  }

  return (
    <>
      <div className="tm-overlay" onClick={onClose} aria-hidden="true" />
      <form className="tm-modal" onSubmit={handleSubmit} role="dialog">
        <div className="flex items-center justify-between border-b border-[#e4dac6] px-6 py-4">
          <h2 className="font-serif text-xl font-bold text-[#022c22]">
            {assignment ? "Edit Assignment" : "Create Assignment"}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4 px-6 py-5">
          <label className="block text-sm font-medium">
            Title
            <input
              required
              className="mt-1 w-full rounded-xl border border-[#e4dac6] px-4 py-3"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium">
            Team
            <select
              className="mt-1 w-full rounded-xl border border-[#e4dac6] px-4 py-3"
              value={teamId}
              onChange={(e) => { setTeamId(e.target.value); setOwnerId(""); }}
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium">
            Owner
            <select
              required
              className="mt-1 w-full rounded-xl border border-[#e4dac6] px-4 py-3"
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
            >
              <option value="">Select owner</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm font-medium">
              Priority
              <select
                className="mt-1 w-full rounded-xl border border-[#e4dac6] px-4 py-3"
                value={priority}
                onChange={(e) => setPriority(e.target.value as AssignmentPriority)}
              >
                {PRIORITIES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium">
              Status
              <select
                className="mt-1 w-full rounded-xl border border-[#e4dac6] px-4 py-3"
                value={status}
                onChange={(e) => setStatus(e.target.value as AssignmentStatus)}
              >
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-sm font-medium">
            Due date
            <input
              type="date"
              required
              className="mt-1 w-full rounded-xl border border-[#e4dac6] px-4 py-3"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </label>
        </div>
        <div className="flex justify-end gap-3 border-t border-[#e4dac6] px-6 py-4">
          <button type="button" className="tm-secondary-btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="tm-gold-btn">Save Assignment</button>
        </div>
      </form>
    </>
  );
}
