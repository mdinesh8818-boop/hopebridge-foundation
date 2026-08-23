"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { Team, TeamMeeting, TeamMember } from "../types";

type Props = {
  teams: Team[];
  members: TeamMember[];
  meeting?: TeamMeeting | null;
  defaultTeamId?: string;
  onClose: () => void;
  onSave: (data: Omit<TeamMeeting, "id"> & { id?: string }) => void;
  onComplete?: (id: string) => void;
};

export default function MeetingModal({
  teams,
  members,
  meeting,
  defaultTeamId,
  onClose,
  onSave,
  onComplete,
}: Props) {
  const [title, setTitle] = useState(meeting?.title ?? "");
  const [teamId, setTeamId] = useState(meeting?.teamId ?? defaultTeamId ?? teams[0]?.id ?? "");
  const [date, setDate] = useState(meeting?.date ?? "");
  const [time, setTime] = useState(meeting?.time ?? "");
  const [agenda, setAgenda] = useState(meeting?.agenda ?? "");
  const [notes, setNotes] = useState(meeting?.notes ?? "");

  const team = teams.find((t) => t.id === teamId);
  const attendeeIds = team?.memberIds ?? [];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = teams.find((x) => x.id === teamId);
    if (!t || !title.trim()) return;
    onSave({
      id: meeting?.id,
      title: title.trim(),
      teamId,
      teamName: t.name,
      date,
      time,
      attendeeIds,
      agenda,
      notes,
      actionItems: meeting?.actionItems,
      completed: meeting?.completed ?? false,
    });
  }

  return (
    <>
      <div className="tm-overlay" onClick={onClose} aria-hidden="true" />
      <form className="tm-modal" onSubmit={handleSubmit}>
        <div className="flex items-center justify-between border-b border-[#e4dac6] px-6 py-4">
          <h2 className="font-serif text-xl font-bold text-[#022c22]">
            {meeting ? "Meeting Details" : "Schedule Meeting"}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4 px-6 py-5">
          <label className="block text-sm font-medium">
            Title
            <input required className="mt-1 w-full rounded-xl border border-[#e4dac6] px-4 py-3" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="block text-sm font-medium">
            Team
            <select className="mt-1 w-full rounded-xl border border-[#e4dac6] px-4 py-3" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm font-medium">
              Date
              <input type="date" required className="mt-1 w-full rounded-xl border border-[#e4dac6] px-4 py-3" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label className="block text-sm font-medium">
              Time
              <input required className="mt-1 w-full rounded-xl border border-[#e4dac6] px-4 py-3" value={time} onChange={(e) => setTime(e.target.value)} placeholder="2:00 PM" />
            </label>
          </div>
          <label className="block text-sm font-medium">
            Agenda
            <textarea className="mt-1 w-full rounded-xl border border-[#e4dac6] px-4 py-3" rows={3} value={agenda} onChange={(e) => setAgenda(e.target.value)} />
          </label>
          {meeting && (
            <label className="block text-sm font-medium">
              Notes
              <textarea className="mt-1 w-full rounded-xl border border-[#e4dac6] px-4 py-3" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
          )}
          {meeting && onComplete && !meeting.completed && (
            <button type="button" className="tm-secondary-btn" onClick={() => onComplete(meeting.id)}>
              Mark meeting complete
            </button>
          )}
        </div>
        <div className="flex justify-end gap-3 border-t border-[#e4dac6] px-6 py-4">
          <button type="button" className="tm-secondary-btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="tm-gold-btn">Save Meeting</button>
        </div>
      </form>
    </>
  );
}
