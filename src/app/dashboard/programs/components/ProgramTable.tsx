"use client";

import { useEffect, useRef, useState } from "react";
import {
  Eye,
  FolderOpen,
  MoreVertical,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";

import { Program } from "../types";
import { formatCurrency, priorityColor, statusColor } from "../utils";

interface ProgramTableProps {
  programs: Program[];
  onView: (program: Program) => void;
  onEdit: (program: Program) => void;
  onDelete: (program: Program) => void;
}

export default function ProgramTable({
  programs,
  onView,
  onEdit,
  onDelete,
}: ProgramTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  if (programs.length === 0) {
    return (
      <section
        id="program-portfolio-table"
        className="pn-panel mt-6 border-dashed px-6 py-16 text-center"
      >
        <div className="pn-icon-emerald mx-auto">
          <FolderOpen size={28} />
        </div>
        <h2 className="pn-section-title mt-5">No programs found</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-[#607269]">
          No programs match the current search or filter settings. Adjust the
          filters or create a new program.
        </p>
      </section>
    );
  }

  return (
    <section id="program-portfolio-table" className="pn-panel mt-6 overflow-visible">
      <div className="flex flex-col gap-3 border-b border-[#f0eadf] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="pn-kicker">PROGRAM PORTFOLIO</p>
          <h2 className="pn-section-title mt-1">Program Portfolio</h2>
          <p className="mt-1 text-sm text-[#607269]">
            Review performance, ownership, budgets, and delivery progress.
          </p>
        </div>
        <div className="rounded-full border border-[#e4dac6] bg-[#fffdfa] px-4 py-1.5 text-sm text-[#607269]">
          {programs.length} {programs.length === 1 ? "program" : "programs"}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1150px] w-full">
          <thead>
            <tr className="border-b border-[#f0eadf] bg-[#fffdfa] text-left text-xs font-semibold uppercase tracking-wider text-[#65766e]">
              <th className="px-6 py-4">Program</th>
              <th className="px-5 py-4">Manager</th>
              <th className="px-5 py-4">Reach</th>
              <th className="px-5 py-4">Budget</th>
              <th className="px-5 py-4">Progress</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Priority</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {programs.map((program) => {
              const budgetUsed =
                program.budget > 0
                  ? Math.min(Math.round((program.spent / program.budget) * 100), 100)
                  : 0;

              return (
                <tr
                  key={program.id}
                  className="border-b border-[#f0eadf] transition hover:bg-[#fffdfa]"
                >
                  <td className="px-6 py-5">
                    <button type="button" onClick={() => onView(program)} className="text-left">
                      <h3 className="font-semibold text-[#112e24] hover:text-[#0d5f44]">
                        {program.name}
                      </h3>
                    </button>
                    <p className="mt-1 text-sm text-[#929d97]">
                      {program.category} · {program.location}
                    </p>
                    <p className="mt-1 line-clamp-1 text-xs text-[#b0bab4]">
                      {program.description}
                    </p>
                  </td>

                  <td className="px-5 py-5">
                    <p className="font-medium text-[#334b41]">{program.manager}</p>
                    <p className="mt-1 text-xs text-[#929d97]">Program owner</p>
                  </td>

                  <td className="px-5 py-5">
                    <div className="flex items-center gap-2 text-[#334b41]">
                      <Users size={16} className="text-[#0d5f44]" />
                      <span className="font-medium">
                        {program.beneficiaries.toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#929d97]">Beneficiaries</p>
                  </td>

                  <td className="px-5 py-5">
                    <p className="font-semibold text-[#0d5f44]">
                      {formatCurrency(program.budget)}
                    </p>
                    <p className="mt-1 text-xs text-[#929d97]">
                      {formatCurrency(program.spent)} spent
                    </p>
                    <div className="mt-2 h-1.5 w-28 overflow-hidden rounded-full bg-[#eee6d7]">
                      <div className="pn-progress-fill" style={{ width: `${budgetUsed}%` }} />
                    </div>
                  </td>

                  <td className="w-[170px] px-5 py-5">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#112e24]">
                        {program.progress}%
                      </span>
                      <span className="text-xs text-[#929d97]">Complete</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#eee6d7]">
                      <div
                        className="pn-progress-fill"
                        style={{ width: `${Math.min(program.progress, 100)}%` }}
                      />
                    </div>
                  </td>

                  <td className="px-5 py-5">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusColor(program.status)}`}
                    >
                      {program.status}
                    </span>
                  </td>

                  <td className="px-5 py-5">
                    <span className={priorityColor(program.priority)}>
                      {program.priority}
                    </span>
                  </td>

                  <td className="relative px-5 py-5 text-right">
                    <button
                      type="button"
                      aria-label={`Open actions for ${program.name}`}
                      onClick={() =>
                        setOpenMenuId((current) =>
                          current === program.id ? null : program.id
                        )
                      }
                      className="rounded-lg border border-[#e4dac6] bg-white p-2 text-[#65766e] transition hover:border-[#d1a627]/40"
                    >
                      <MoreVertical size={18} />
                    </button>

                    {openMenuId === program.id && (
                      <div
                        ref={menuRef}
                        className="absolute right-5 top-14 z-50 w-44 overflow-hidden rounded-xl border border-[#e4dac6] bg-white p-1 shadow-[0_18px_40px_rgba(34,53,45,.14)]"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            onView(program);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#334b41] hover:bg-[#f4fbf7]"
                        >
                          <Eye size={16} className="text-[#0a728d]" />
                          View details
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            onEdit(program);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#334b41] hover:bg-[#f4fbf7]"
                        >
                          <Pencil size={16} className="text-[#8b6914]" />
                          Edit program
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            onDelete(program);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#be123c] hover:bg-[#fff0f4]"
                        >
                          <Trash2 size={16} />
                          Delete program
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
