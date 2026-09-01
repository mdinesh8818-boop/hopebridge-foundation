"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Home,
  Loader2,
  Megaphone,
  RefreshCw,
  Users,
} from "lucide-react";

import HopeBridgeSidebar from "../components/HopeBridgeSidebar";
import {
  fetchCalendarEvents,
  groupEventsByMonth,
  type CalendarEvent,
} from "@/services/calendarEvents";
import "../module-pages.css";

const TYPE_LABELS: Record<CalendarEvent["type"], string> = {
  campaign: "Campaign",
  program: "Program",
  meeting: "Meeting",
  deadline: "Deadline",
};

function EventIcon({ type }: { type: CalendarEvent["type"] }) {
  if (type === "meeting") return <Users size={15} />;
  if (type === "program") return <CalendarDays size={15} />;
  return <Megaphone size={15} />;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | CalendarEvent["type"]>("all");
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadEvents() {
      setLoading(true);
      setError("");
      try {
        const next = await fetchCalendarEvents();
        if (!cancelled) setEvents(next);
      } catch (loadError) {
        console.error(loadError);
        if (!cancelled) {
          setError("Unable to load calendar events. Try refreshing.");
          setEvents([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadEvents();
    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  const filteredEvents = useMemo(() => {
    if (filter === "all") return events;
    return events.filter((event) => event.type === filter);
  }, [events, filter]);

  const grouped = useMemo(
    () => groupEventsByMonth(filteredEvents),
    [filteredEvents],
  );

  const monthKeys = useMemo(
    () => Array.from(grouped.keys()).sort(),
    [grouped],
  );

  return (
    <div className="hb-app op-page">
      <HopeBridgeSidebar activePath="/dashboard/calendar" />

      <main className="hb-module-main">
        <div className="mx-auto max-w-[1200px] space-y-6 pb-10">
          <nav className="flex items-center gap-2 text-sm text-[#607269]">
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 hover:text-[#0d5f44]">
              <Home size={14} className="text-[#0d5f44]" />
              HopeBridge Foundation
            </Link>
            <span>/</span>
            <strong className="text-[#112e24]">Calendar</strong>
          </nav>

          <header className="op-hero">
            <p className="op-kicker">SCHEDULING</p>
            <h1>Organization Calendar</h1>
            <p>
              Campaign dates, program timelines, and team meetings from your HopeBridge
              records. Add or edit dates in the source modules to update this view.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                className="op-btn op-btn-secondary"
                onClick={() => setRefreshToken((value) => value + 1)}
                disabled={loading}
              >
                <RefreshCw size={15} className={loading ? "animate-spin" : undefined} />
                Refresh calendar
              </button>
              <Link href="/dashboard/campaigns" className="op-btn op-btn-secondary">
                Manage campaigns
              </Link>
              <Link href="/dashboard/teams" className="op-btn op-btn-secondary">
                Team meetings
              </Link>
            </div>
          </header>

          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Event filters">
            {(["all", "campaign", "program", "meeting", "deadline"] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={filter === value}
                className={`op-btn op-btn-secondary ${filter === value ? "border-[#0d5f44] text-[#0d5f44]" : ""}`}
                onClick={() => setFilter(value)}
              >
                {value === "all" ? "All events" : TYPE_LABELS[value]}
              </button>
            ))}
          </div>

          {error ? <div className="op-error" role="alert">{error}</div> : null}

          {loading ? (
            <div className="op-panel flex items-center gap-2 text-sm text-[#607269]">
              <Loader2 size={16} className="animate-spin text-[#0d5f44]" />
              Loading events from connected modules…
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="op-empty">
              No upcoming dates found in your records.
              <br />
              <span className="mt-2 block">
                Add campaign or program start/end dates, or schedule a team meeting, to
                populate the calendar.
              </span>
            </div>
          ) : (
            <div className="space-y-5">
              {monthKeys.map((monthKey) => {
                const monthEvents = grouped.get(monthKey) ?? [];
                const label = new Date(`${monthKey}-01T12:00:00`).toLocaleDateString(
                  undefined,
                  { month: "long", year: "numeric" },
                );

                return (
                  <section key={monthKey} className="op-panel">
                    <h2>{label}</h2>
                    <div className="mt-2">
                      {monthEvents.map((event) => (
                        <div key={event.id} className="op-event-row">
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 text-[#0d5f44]">
                              <EventIcon type={event.type} />
                            </span>
                            <div>
                              <Link
                                href={event.href}
                                className="font-semibold text-[#18392e] hover:text-[#0d5f44]"
                              >
                                {event.title}
                              </Link>
                              <p className="mt-1 text-sm text-[#65766e]">{event.detail}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="op-badge">{TYPE_LABELS[event.type]}</span>
                            <p className="mt-2 text-sm font-semibold text-[#334b41]">
                              {new Date(`${event.date}T12:00:00`).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
