import { getDocuments } from "./firestore";

export type CalendarEventType = "campaign" | "program" | "meeting" | "deadline";

export type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  type: CalendarEventType;
  href: string;
  detail: string;
};

function toText(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function normalizeDate(value: unknown): string {
  const text = toText(value);
  if (!text) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const parsed = Date.parse(text);
  if (Number.isNaN(parsed)) return "";
  return new Date(parsed).toISOString().slice(0, 10);
}

function addEvent(
  events: CalendarEvent[],
  seen: Set<string>,
  event: Omit<CalendarEvent, "id"> & { id: string },
) {
  if (!event.date || seen.has(event.id)) return;
  seen.add(event.id);
  events.push(event);
}

export async function fetchCalendarEvents(): Promise<CalendarEvent[]> {
  const [campaigns, programs, meetings] = await Promise.all([
    getDocuments("campaigns"),
    getDocuments("programs"),
    getDocuments("teamMeetings"),
  ]);

  const events: CalendarEvent[] = [];
  const seen = new Set<string>();

  for (const record of campaigns) {
    const name = toText(record.name) || "Campaign";
    const start = normalizeDate(record.startDate);
    const end = normalizeDate(record.endDate);
    const status = toText(record.status);

    if (start) {
      addEvent(events, seen, {
        id: `campaign-start-${record.id}`,
        title: `${name} starts`,
        date: start,
        type: "campaign",
        href: "/dashboard/campaigns",
        detail: status ? `Campaign · ${status}` : "Campaign milestone",
      });
    }

    if (end) {
      addEvent(events, seen, {
        id: `campaign-end-${record.id}`,
        title: `${name} ends`,
        date: end,
        type: "deadline",
        href: "/dashboard/campaigns",
        detail: "Campaign end date",
      });
    }
  }

  for (const record of programs) {
    const name = toText(record.name) || "Program";
    const start = normalizeDate(record.startDate);
    const end = normalizeDate(record.endDate);
    const status = toText(record.status);

    if (start) {
      addEvent(events, seen, {
        id: `program-start-${record.id}`,
        title: `${name} starts`,
        date: start,
        type: "program",
        href: "/dashboard/programs",
        detail: status ? `Program · ${status}` : "Program timeline",
      });
    }

    if (end) {
      addEvent(events, seen, {
        id: `program-end-${record.id}`,
        title: `${name} target end`,
        date: end,
        type: "deadline",
        href: "/dashboard/programs",
        detail: "Program end date",
      });
    }
  }

  for (const record of meetings) {
    const title = toText(record.title) || "Team meeting";
    const date = normalizeDate(record.scheduledAt ?? record.date ?? record.startDate);
    const teamName = toText(record.teamName);

    if (date) {
      addEvent(events, seen, {
        id: `meeting-${record.id}`,
        title,
        date,
        type: "meeting",
        href: "/dashboard/teams",
        detail: teamName ? `Team meeting · ${teamName}` : "Team meeting",
      });
    }
  }

  return events.sort((a, b) => a.date.localeCompare(b.date));
}

export function groupEventsByMonth(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const grouped = new Map<string, CalendarEvent[]>();

  for (const event of events) {
    const monthKey = event.date.slice(0, 7);
    const bucket = grouped.get(monthKey) ?? [];
    bucket.push(event);
    grouped.set(monthKey, bucket);
  }

  return grouped;
}
