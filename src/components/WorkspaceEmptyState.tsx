"use client";

import Link from "next/link";
import { EMPTY_WORKSPACE_COPY, type EmptyWorkspaceModule } from "@/lib/emptyWorkspace";

export function WorkspaceEmptyState({
  module,
  actionLabel,
  actionHref,
}: {
  module: EmptyWorkspaceModule;
  actionLabel?: string;
  actionHref?: string;
}) {
  const copy = EMPTY_WORKSPACE_COPY[module];

  return (
    <div className="rounded-2xl border border-[#e4dac6] bg-white px-6 py-10 text-center shadow-sm">
      <h3 className="text-lg font-semibold text-[#18392e]">{copy.title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#65766e]">
        {copy.body}
      </p>
      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#0d5f44] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0a4d37]"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
