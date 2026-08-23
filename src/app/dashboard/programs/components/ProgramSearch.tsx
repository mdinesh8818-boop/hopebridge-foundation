"use client";

import { Search } from "lucide-react";

interface ProgramSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export default function ProgramSearch({ value, onChange }: ProgramSearchProps) {
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#0d5f44]"
        size={18}
      />

      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search programs, managers, categories, or locations..."
        className="pn-input h-14 w-full pl-12 pr-4 text-sm shadow-[0_8px_20px_rgba(49,52,42,.04)]"
      />
    </div>
  );
}
