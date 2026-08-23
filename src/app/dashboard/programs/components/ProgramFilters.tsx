"use client";

import { RotateCcw, SlidersHorizontal } from "lucide-react";

import {
  PROGRAM_CATEGORIES,
  PROGRAM_PRIORITIES,
  PROGRAM_STATUSES,
} from "../data";
import { ProgramFilters as ProgramFiltersType } from "../types";

interface ProgramFiltersProps {
  filters: ProgramFiltersType;
  onChange: (filters: ProgramFiltersType) => void;
}

export default function ProgramFilters({
  filters,
  onChange,
}: ProgramFiltersProps) {
  const hasActiveFilters =
    filters.status !== "All" ||
    filters.category !== "All" ||
    filters.priority !== "All";

  function updateFilter(field: keyof ProgramFiltersType, value: string) {
    onChange({ ...filters, [field]: value });
  }

  function resetFilters() {
    onChange({
      ...filters,
      status: "All",
      category: "All",
      priority: "All",
    });
  }

  return (
    <section className="pn-panel mt-6 p-5 sm:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <div className="pn-icon-emerald">
            <SlidersHorizontal size={18} />
          </div>
          <div>
            <h2 className="font-semibold text-[#112e24]">Portfolio Filters</h2>
            <p className="mt-1 text-sm text-[#607269]">
              Refine programs by status, category, and priority.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
          <select
            aria-label="Filter by status"
            value={filters.status}
            onChange={(event) => updateFilter("status", event.target.value)}
            className="pn-select h-12 min-w-[170px] px-4 text-sm"
          >
            <option value="All">All Statuses</option>
            {PROGRAM_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by category"
            value={filters.category}
            onChange={(event) => updateFilter("category", event.target.value)}
            className="pn-select h-12 min-w-[170px] px-4 text-sm"
          >
            <option value="All">All Categories</option>
            {PROGRAM_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by priority"
            value={filters.priority}
            onChange={(event) => updateFilter("priority", event.target.value)}
            className="pn-select h-12 min-w-[170px] px-4 text-sm"
          >
            <option value="All">All Priorities</option>
            {PROGRAM_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={resetFilters}
            disabled={!hasActiveFilters}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#e4dac6] bg-[#fffdfa] px-5 text-sm font-semibold text-[#334b41] transition hover:border-[#0d5f44]/30 hover:bg-[#f4fbf7] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw size={17} />
            Reset
          </button>
        </div>
      </div>
    </section>
  );
}
