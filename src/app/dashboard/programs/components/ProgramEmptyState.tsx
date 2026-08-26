"use client";

import { FolderKanban, type LucideIcon } from "lucide-react";

type ProgramEmptyStateProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
  onCreate?: () => void;
  createLabel?: string;
  tone?: "light" | "emerald";
  compact?: boolean;
};

export default function ProgramEmptyState({
  title,
  description,
  icon: Icon = FolderKanban,
  onCreate,
  createLabel = "Create Program",
  tone = "light",
  compact = false,
}: ProgramEmptyStateProps) {
  const isEmerald = tone === "emerald";

  return (
    <div
      className={`pn-empty-state ${isEmerald ? "is-emerald" : ""} ${compact ? "is-compact" : ""}`}
      role="status"
    >
      <div className="pn-empty-state-icon" aria-hidden="true">
        <Icon size={compact ? 18 : 22} />
      </div>
      <h4 className="pn-empty-state-title">{title}</h4>
      <p className="pn-empty-state-copy">{description}</p>
      {onCreate && (
        <button type="button" className="pn-empty-state-cta" onClick={onCreate}>
          {createLabel}
        </button>
      )}
    </div>
  );
}
