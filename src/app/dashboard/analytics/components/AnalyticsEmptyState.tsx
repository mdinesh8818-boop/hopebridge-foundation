"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function AnalyticsEmptyState({
  title,
  description,
  actionHref,
  actionLabel,
  icon: Icon,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="ia-empty" role="status">
      {Icon ? (
        <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl border border-[#ebe3d2] bg-white text-[#0d5f44]">
          <Icon size={20} />
        </div>
      ) : null}
      <h3>{title}</h3>
      <p>{description}</p>
      {actionHref && actionLabel ? (
        <div className="ia-empty-actions">
          <Link href={actionHref} className="ia-gold-btn">
            {actionLabel}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
