"use client";

import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";
import { formatActivityTime, getActivities } from "../../../../services/activity";
import type { ActivityRecord } from "../../../../types/activity";

export default function ActivityTimeline() {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);

  useEffect(() => {
    getActivities({ module: "programs", limit: 6 }).then(setActivities);
  }, []);

  return (
    <section className="pn-panel p-6 sm:p-7">
      <div className="flex items-center gap-3">
        <div className="pn-icon-emerald">
          <Clock3 size={20} />
        </div>
        <div>
          <h2 className="font-semibold text-[#112e24]">Recent Activity</h2>
          <p className="text-sm text-[#607269]">Latest updates across all programs</p>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {activities.length === 0 ? (
          <p className="text-sm text-[#607269]">
            No activity yet. Activity will appear when your team starts working.
          </p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex gap-3">
              <div className="mt-1 flex flex-col items-center">
                <div className="h-2.5 w-2.5 rounded-full bg-[#d4af37]" />
                <div className="mt-2 h-full w-px bg-[#ebe3d2]" />
              </div>
              <div className="flex-1 pb-2">
                <h3 className="font-semibold text-[#112e24]">{activity.description}</h3>
                {activity.entityName && (
                  <p className="mt-1 text-sm leading-6 text-[#607269]">
                    {activity.entityName}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-2 text-xs text-[#929d97]">
                  <span>{formatActivityTime(activity.createdAt)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
