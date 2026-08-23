"use client";

import { X } from "lucide-react";
import type { RebalanceSuggestion } from "../types";

type Props = {
  teamName: string;
  suggestions: RebalanceSuggestion[];
  onClose: () => void;
  onConfirm: (suggestion: RebalanceSuggestion) => void;
};

export default function RebalancePanel({ teamName, suggestions, onClose, onConfirm }: Props) {
  return (
    <>
      <div className="tm-overlay" onClick={onClose} aria-hidden="true" />
      <div className="tm-modal" role="dialog">
        <div className="flex items-center justify-between border-b border-[#e4dac6] px-6 py-4">
          <h2 className="font-serif text-xl font-bold text-[#022c22]">
            Rebalance Recommendations — {teamName}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4 px-6 py-5">
          {suggestions.length === 0 ? (
            <p className="text-sm text-[#65766e]">No rebalancing recommendations at this time.</p>
          ) : (
            suggestions.map((s) => (
              <div key={s.assignmentId} className="rounded-xl border border-[#e4dac6] p-4">
                <p className="font-semibold text-[#18392e]">{s.assignmentTitle}</p>
                <p className="mt-2 text-sm text-[#65766e]">{s.reason}</p>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg bg-[#fff1f2] p-3">
                    <p className="font-bold text-[#be123c]">Current</p>
                    <p>{s.currentOwnerName}</p>
                    <p>{s.currentCapacity}% capacity</p>
                  </div>
                  <div className="rounded-lg bg-[#ecfdf5] p-3">
                    <p className="font-bold text-[#0d5f44]">Suggested</p>
                    <p>{s.suggestedOwnerName}</p>
                    <p>{s.suggestedCapacity}% capacity</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="tm-gold-btn mt-3 text-sm"
                  onClick={() => onConfirm(s)}
                >
                  Confirm reassignment
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
