"use client";

import { useState } from "react";

type CampaignFormValues = {
  name: string;
  category: string;
  targetAmount: string;
  startDate: string;
  endDate: string;
  description: string;
  status: "Draft" | "Active" | "Completed";
};

const initialValues: CampaignFormValues = {
  name: "",
  category: "",
  targetAmount: "",
  startDate: "",
  endDate: "",
  description: "",
  status: "Draft",
};

const categories = [
  "Education",
  "Healthcare",
  "Emergency Relief",
  "Community Development",
  "Environmental",
  "Youth Programs",
  "Other",
];

const inputClassName =
  "w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-amber-300/40 focus:ring-2 focus:ring-amber-300/10";

const labelClassName = "mb-2 block text-sm font-medium text-zinc-300";

export default function CampaignForm() {
  const [form, setForm] = useState<CampaignFormValues>(initialValues);

  function updateField<K extends keyof CampaignFormValues>(
    field: K,
    value: CampaignFormValues[K],
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleCancel() {
    setForm(initialValues);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-white">Campaign Details</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Fill in the information below to create or update a fundraising
          campaign.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="campaign-name" className={labelClassName}>
              Campaign Name
            </label>
            <input
              id="campaign-name"
              type="text"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Enter campaign name"
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="campaign-category" className={labelClassName}>
              Category
            </label>
            <select
              id="campaign-category"
              value={form.category}
              onChange={(event) => updateField("category", event.target.value)}
              className={`${inputClassName} cursor-pointer`}
            >
              <option value="" disabled>
                Select a category
              </option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="campaign-target" className={labelClassName}>
              Target Amount
            </label>
            <input
              id="campaign-target"
              type="number"
              min="0"
              step="0.01"
              value={form.targetAmount}
              onChange={(event) =>
                updateField("targetAmount", event.target.value)
              }
              placeholder="0.00"
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="campaign-start-date" className={labelClassName}>
              Start Date
            </label>
            <input
              id="campaign-start-date"
              type="date"
              value={form.startDate}
              onChange={(event) => updateField("startDate", event.target.value)}
              className={`${inputClassName} [color-scheme:dark]`}
            />
          </div>

          <div>
            <label htmlFor="campaign-end-date" className={labelClassName}>
              End Date
            </label>
            <input
              id="campaign-end-date"
              type="date"
              value={form.endDate}
              onChange={(event) => updateField("endDate", event.target.value)}
              className={`${inputClassName} [color-scheme:dark]`}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="campaign-description" className={labelClassName}>
              Description
            </label>
            <textarea
              id="campaign-description"
              rows={4}
              value={form.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              placeholder="Describe the campaign goals, audience, and impact..."
              className={`${inputClassName} resize-y min-h-[120px]`}
            />
          </div>

          <div>
            <label htmlFor="campaign-status" className={labelClassName}>
              Status
            </label>
            <select
              id="campaign-status"
              value={form.status}
              onChange={(event) =>
                updateField(
                  "status",
                  event.target.value as CampaignFormValues["status"],
                )
              }
              className={`${inputClassName} cursor-pointer`}
            >
              <option value="Draft">Draft</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.07]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-xl bg-gradient-to-r from-amber-300 to-orange-500 px-5 py-3 text-sm font-bold text-zinc-950 shadow-[0_0_28px_rgba(251,191,36,0.16)] transition hover:scale-[1.02]"
          >
            Save Campaign
          </button>
        </div>
      </form>
    </div>
  );
}
