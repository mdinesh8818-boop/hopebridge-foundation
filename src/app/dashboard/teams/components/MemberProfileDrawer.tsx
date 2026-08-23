"use client";

import { X } from "lucide-react";
import type { TeamAssignment, TeamMember } from "../types";
import { formatDate, getInitials } from "../utils";

type Props = {
  member: TeamMember;
  assignments: TeamAssignment[];
  teamNames: string[];
  onClose: () => void;
};

export default function MemberProfileDrawer({ member, assignments, teamNames, onClose }: Props) {
  const memberAssignments = assignments.filter((a) => a.ownerId === member.id);

  return (
    <>
      <div className="tm-overlay" onClick={onClose} aria-hidden="true" />
      <div className="tm-drawer" role="dialog" aria-label={`${member.name} profile`}>
        <div className="flex items-start justify-between border-b border-[#e4dac6] px-6 py-5">
          <div className="flex gap-4">
            <span className="tm-avatar h-14 w-14 text-base">{getInitials(member.name)}</span>
            <div>
              <h2 className="font-serif text-xl font-bold text-[#022c22]">{member.name}</h2>
              <p className="text-sm text-[#65766e]">{member.role} · {member.department}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-5 px-6 py-5 text-sm text-[#334b41]">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#9f7b24]">Contact</p>
            <p className="mt-1">{member.email}</p>
            {member.phone && <p>{member.phone}</p>}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#9f7b24]">Teams</p>
            <p className="mt-1">{teamNames.join(", ") || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#9f7b24]">Availability</p>
            <p className="mt-1">{member.availability} · {member.workload}% workload</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#9f7b24]">Current Assignments</p>
            <ul className="mt-2 space-y-2">
              {memberAssignments.length === 0 ? (
                <li className="text-[#65766e]">No active assignments</li>
              ) : (
                memberAssignments.map((a) => (
                  <li key={a.id} className="rounded-lg border border-[#e4dac6] px-3 py-2">
                    {a.title} — {a.status} · Due {formatDate(a.dueDate)}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
