"use client";

import { Eye, Pencil, Trash2 } from "lucide-react";

type CampaignRow = {
  id: string | number;
  name: string;
  category: string;
  goal: string;
  raised: string;
  progress: number;
  start: string;
  end: string;
  status: string;
};

type CampaignTableProps = {
  campaigns?: CampaignRow[];
};

export default function CampaignTable({ campaigns = [] }: CampaignTableProps) {
  if (campaigns.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-8 text-center text-sm text-zinc-400">
        No campaigns yet. Create your first fundraising campaign to begin tracking
        goals, donations, and progress.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <table className="w-full text-left text-sm text-zinc-300">
        <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3">Campaign</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Goal</th>
            <th className="px-4 py-3">Raised</th>
            <th className="px-4 py-3">Progress</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((campaign) => (
            <tr key={campaign.id} className="border-t border-white/10">
              <td className="px-4 py-3 font-medium text-white">{campaign.name}</td>
              <td className="px-4 py-3">{campaign.category}</td>
              <td className="px-4 py-3">{campaign.goal}</td>
              <td className="px-4 py-3">{campaign.raised}</td>
              <td className="px-4 py-3">{campaign.progress}%</td>
              <td className="px-4 py-3">{campaign.status}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <button type="button" aria-label="View">
                    <Eye size={16} />
                  </button>
                  <button type="button" aria-label="Edit">
                    <Pencil size={16} />
                  </button>
                  <button type="button" aria-label="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
