"use client";

import { useState } from "react";
import {
  CalendarPlus,
  MessageSquarePlus,
  Plus,
  UserPlus,
  X,
} from "lucide-react";
import type {
  Team,
  TeamAssignment,
  TeamDetailTab,
  TeamDiscussion,
  TeamMeeting,
  TeamMember,
} from "../types";
import { formatDate, getCapacityClass, getInitials, getTeamAssignmentCount } from "../utils";

type Props = {
  team: Team;
  members: TeamMember[];
  assignments: TeamAssignment[];
  discussions: TeamDiscussion[];
  meetings: TeamMeeting[];
  onClose: () => void;
  onAddMember: () => void;
  onCreateAssignment: () => void;
  onScheduleMeeting: () => void;
  onStartDiscussion: () => void;
  onEditTeam: () => void;
  onOpenMember: (member: TeamMember) => void;
  onOpenDiscussion: (discussion: TeamDiscussion) => void;
};

const TABS: { id: TeamDetailTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "members", label: "Members" },
  { id: "assignments", label: "Assignments" },
  { id: "discussions", label: "Discussions" },
  { id: "meetings", label: "Meetings" },
  { id: "files", label: "Files" },
  { id: "activity", label: "Activity" },
];

export default function TeamDetailDrawer({
  team,
  members,
  assignments,
  discussions,
  meetings,
  onClose,
  onAddMember,
  onCreateAssignment,
  onScheduleMeeting,
  onStartDiscussion,
  onEditTeam,
  onOpenMember,
  onOpenDiscussion,
}: Props) {
  const [tab, setTab] = useState<TeamDetailTab>("overview");
  const teamMembers = members.filter((m) => team.memberIds.includes(m.id));
  const teamAssignments = assignments.filter((a) => a.teamId === team.id);
  const teamDiscussions = discussions.filter((d) => d.teamId === team.id);
  const teamMeetings = meetings.filter((m) => m.teamId === team.id);
  const activeCount = getTeamAssignmentCount(team.id, assignments);

  return (
    <>
      <div className="tm-overlay" onClick={onClose} aria-hidden="true" />
      <div className="tm-drawer" role="dialog" aria-label={`${team.name} workspace`}>
        <div className="border-b border-[#e4dac6] bg-[#fffef9] px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#9f7b24]">
                {team.department.toUpperCase()}
              </p>
              <h2 className="font-serif text-2xl font-bold text-[#022c22]">{team.name}</h2>
              <p className="mt-1 text-sm text-[#65766e]">
                Lead: {team.leadName} · {teamMembers.length} members · {activeCount} active assignments
              </p>
            </div>
            <button type="button" onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="tm-secondary-btn text-xs" onClick={onAddMember}>
              <UserPlus size={14} /> Add Member
            </button>
            <button type="button" className="tm-secondary-btn text-xs" onClick={onCreateAssignment}>
              <Plus size={14} /> Create Assignment
            </button>
            <button type="button" className="tm-secondary-btn text-xs" onClick={onScheduleMeeting}>
              <CalendarPlus size={14} /> Schedule Meeting
            </button>
            <button type="button" className="tm-secondary-btn text-xs" onClick={onStartDiscussion}>
              <MessageSquarePlus size={14} /> Start Discussion
            </button>
            <button type="button" className="tm-secondary-btn text-xs" onClick={onEditTeam}>
              Edit Team
            </button>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-[#65766e]">
              <span>Workload</span>
              <span>{team.capacity}%</span>
            </div>
            <div className={`tm-capacity-bar mt-1 ${getCapacityClass(team.capacity)}`}>
              <div className="tm-capacity-fill" style={{ width: `${team.capacity}%` }} />
            </div>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto border-b border-[#e4dac6] px-4 py-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`tm-detail-tab ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="px-6 py-5">
          {tab === "overview" && (
            <div className="space-y-4 text-sm text-[#334b41]">
              <p>{team.description}</p>
              <p><strong>Status:</strong> {team.status}</p>
              <p><strong>Next deadline:</strong> {formatDate(team.nextDeadline ?? "")}</p>
              <p><strong>Default permission:</strong> {team.defaultPermission}</p>
            </div>
          )}

          {tab === "members" && (
            <div className="space-y-2">
              {teamMembers.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className="tm-member-row"
                  onClick={() => onOpenMember(m)}
                >
                  <span className="tm-avatar">{getInitials(m.name)}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-[#18392e]">{m.name}</p>
                    <p className="text-xs text-[#65766e]">{m.role} · {m.workload}% workload</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {tab === "assignments" && (
            <div className="space-y-3">
              {teamAssignments.map((a) => (
                <div key={a.id} className="tm-assignment-card">
                  <p className="font-semibold text-[#18392e]">{a.title}</p>
                  <p className="mt-1 text-xs text-[#65766e]">{a.ownerName} · Due {formatDate(a.dueDate)}</p>
                  <span className={`tm-status-pill mt-2 tm-status-${a.status.replace(/\s/g, "").toLowerCase()}`}>
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {tab === "discussions" && (
            <div className="space-y-2">
              {teamDiscussions.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className="w-full rounded-xl border border-[#e4dac6] px-4 py-3 text-left hover:border-[#d4af37]/40"
                  onClick={() => onOpenDiscussion(d)}
                >
                  <p className="font-semibold text-[#18392e]">{d.title}</p>
                  <p className="mt-1 text-xs text-[#65766e]">{d.lastMessage}</p>
                </button>
              ))}
            </div>
          )}

          {tab === "meetings" && (
            <div className="space-y-2">
              {teamMeetings.map((m) => (
                <div key={m.id} className="rounded-xl border border-[#e4dac6] px-4 py-3">
                  <p className="font-semibold text-[#18392e]">{m.title}</p>
                  <p className="text-xs text-[#65766e]">{formatDate(m.date)} · {m.time}</p>
                </div>
              ))}
            </div>
          )}

          {tab === "files" && (
            <p className="text-sm text-[#65766e]">
              Shared team resources and planning documents are organized here. Upload integration coming soon.
            </p>
          )}

          {tab === "activity" && (
            <p className="text-sm text-[#65766e]">
              Team-specific activity stream appears in the main Recent Team Activity panel.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
