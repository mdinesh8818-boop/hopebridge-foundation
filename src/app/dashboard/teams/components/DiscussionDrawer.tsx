"use client";

import { useState } from "react";
import { Send, X } from "lucide-react";
import type { TeamDiscussion, TeamMember } from "../types";
import { formatRelativeTime } from "../utils";

type Props = {
  discussion: TeamDiscussion;
  members: TeamMember[];
  onClose: () => void;
  onReply: (discussionId: string, body: string) => void;
  onResolve: (discussionId: string) => void;
};

export default function DiscussionDrawer({ discussion, members, onClose, onReply, onResolve }: Props) {
  const [reply, setReply] = useState("");

  function submitReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    onReply(discussion.id, reply.trim());
    setReply("");
  }

  return (
    <>
      <div className="tm-overlay" onClick={onClose} aria-hidden="true" />
      <div className="tm-drawer" role="dialog">
        <div className="flex items-start justify-between border-b border-[#e4dac6] px-6 py-5">
          <div>
            <p className="text-xs text-[#65766e]">{discussion.teamName}</p>
            <h2 className="font-serif text-xl font-bold text-[#022c22]">{discussion.title}</h2>
            <p className="text-xs text-[#65766e]">{discussion.participantIds.length} participants</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4 px-6 py-5">
          {discussion.messages.map((msg) => (
            <div key={msg.id} className="rounded-xl border border-[#e4dac6] bg-white px-4 py-3">
              <p className="text-xs font-bold text-[#0d5f44]">{msg.authorName}</p>
              <p className="mt-1 text-sm text-[#334b41]">{msg.body}</p>
              <p className="mt-1 text-[11px] text-[#65766e]">{formatRelativeTime(msg.createdAt)}</p>
            </div>
          ))}
        </div>
        {!discussion.resolved && (
          <form onSubmit={submitReply} className="border-t border-[#e4dac6] px-6 py-4">
            <textarea
              className="w-full rounded-xl border border-[#e4dac6] px-4 py-3 text-sm"
              rows={3}
              placeholder="Reply to discussion..."
              value={reply}
              onChange={(e) => setReply(e.target.value)}
            />
            <div className="mt-3 flex gap-2">
              <button type="submit" className="tm-gold-btn text-sm">
                <Send size={14} /> Reply
              </button>
              <button
                type="button"
                className="tm-secondary-btn text-sm"
                onClick={() => onResolve(discussion.id)}
              >
                Mark resolved
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
