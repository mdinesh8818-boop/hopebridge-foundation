"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Activity, ArrowLeft, Home } from "lucide-react";

import HopeBridgeSidebar from "../components/HopeBridgeSidebar";
import { formatActivityTime, getActivities } from "@/services/activity";
import type { ActivityRecord } from "@/types/activity";

export default function OrganizationActivityPage() {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActivities()
      .then(setActivities)
      .catch((error) => {
        console.error("Unable to load organization activity.", error);
        setActivities([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen bg-[#f8f6ef]">
      <HopeBridgeSidebar activePath="/dashboard/activity" />
      <main className="flex-1 p-6 md:p-8 md:ml-[284px]">
        <div className="mb-6 flex items-center gap-3 text-sm text-[#6a7a72]">
          <Home size={16} className="text-[#0b7754]" />
          <Link href="/dashboard" className="hover:text-[#1e3d32]">
            Dashboard
          </Link>
          <span>/</span>
          <strong className="text-[#1e3d32]">Organization Activity</strong>
        </div>

        <div className="rounded-2xl border border-[#e8decb] bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-[#af8520]" />
              <h1 className="text-xl font-semibold text-[#19382e]">
                Organization Activity
              </h1>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm text-[#65766e] hover:text-[#1e3d32]"
            >
              <ArrowLeft size={14} />
              Back to Dashboard
            </Link>
          </div>

          {loading ? (
            <p className="text-sm text-[#7d8b85]">Loading activity…</p>
          ) : activities.length === 0 ? (
            <p className="text-sm leading-relaxed text-[#7d8b85]">
              No activity yet.
              <br />
              Organization updates will appear here.
            </p>
          ) : (
            <ul className="divide-y divide-[#f0eadf]">
              {activities.map((activity) => (
                <li
                  key={activity.id}
                  className="flex flex-col gap-1 py-4 first:pt-0 last:pb-0"
                >
                  <strong className="text-sm text-[#334b41]">
                    {activity.description}
                  </strong>
                  <span className="text-xs text-[#929d97]">
                    {formatActivityTime(activity.createdAt)} · {activity.module}
                    {activity.entityName ? ` · ${activity.entityName}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
