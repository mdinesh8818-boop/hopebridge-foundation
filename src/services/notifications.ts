import type { AttentionItem } from "./organizationMetrics";
import type { UpcomingDeadline } from "./organizationSnapshot";

export type DashboardNotification = {
  id: string;
  title: string;
  detail: string;
  href: string;
  priority: "high" | "medium" | "low";
  category: "attention" | "deadline";
};

function notificationEntityKey(title: string): string {
  return title
    .replace(/ ends soon$/i, "")
    .replace(/ campaign ends$/i, "")
    .replace(/ deadline passed$/i, "")
    .replace(/ below fundraising target$/i, "")
    .replace(/^Follow-up due: /i, "")
    .replace(/^Follow-up: /i, "")
    .trim()
    .toLowerCase();
}

export function buildDashboardNotifications(
  attentionItems: AttentionItem[],
  upcomingDeadlines: UpcomingDeadline[],
): DashboardNotification[] {
  const fromAttention: DashboardNotification[] = attentionItems.map(
    (item) => ({
      id: item.id,
      title: item.title,
      detail: item.detail,
      href: item.href,
      priority: item.priority,
      category: "attention",
    }),
  );

  const attentionEntityKeys = new Set(
    fromAttention.map((item) => notificationEntityKey(item.title)),
  );

  const fromDeadlines: DashboardNotification[] = upcomingDeadlines
    .slice(0, 4)
    .filter(
      (deadline) =>
        !attentionEntityKeys.has(notificationEntityKey(deadline.title)),
    )
    .map((d, index) => ({
      id: `deadline-${index}-${d.title}`,
      title: d.title,
      detail: d.meta,
      href: d.href,
      priority: "medium" as const,
      category: "deadline" as const,
    }));

  return [...fromAttention, ...fromDeadlines].slice(0, 8);
}
