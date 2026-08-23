import { Filter, Search } from "lucide-react";

export default function CampaignSearch() {
  return (
    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 transition focus-within:border-amber-300/30 focus-within:ring-2 focus-within:ring-amber-300/10">
        <Search size={17} className="shrink-0 text-zinc-500" />

        <input
          type="text"
          placeholder="Search campaigns..."
          className="w-full min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
        />
      </div>

      <button
        type="button"
        className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.07]"
      >
        <Filter size={17} />
        Filter
      </button>
    </div>
  );
}
