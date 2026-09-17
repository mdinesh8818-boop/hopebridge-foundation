"use client";

import type { ElementType } from "react";
import {
  Activity,
  BarChart3,
  BrainCircuit,
  CalendarDays,
  CircleDollarSign,
  FileBarChart,
  FolderKanban,
  HandHeart,
  HelpCircle,
  Home,
  LayoutDashboard,
  Megaphone,
  Settings,
  ShieldCheck,
  Target,
  UserRound,
  Users,
} from "lucide-react";
import {
  canManageUserAccess,
  type UserProfile,
} from "@/lib/accessControl";

export type HopeBridgeNavItem = {
  label: string;
  href: string;
  icon: ElementType;
};

export type HopeBridgeNavGroup = {
  title: string;
  items: HopeBridgeNavItem[];
};

const FOUNDATION_ITEMS: HopeBridgeNavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Mission & Vision", href: "/dashboard/mission-vision", icon: Target },
  { label: "Campaigns", href: "/dashboard/campaigns", icon: Megaphone },
  { label: "Programs", href: "/dashboard/programs", icon: FolderKanban },
];

const OPERATIONS_ITEMS: HopeBridgeNavItem[] = [
  { label: "Donors", href: "/dashboard/donors", icon: CircleDollarSign },
  { label: "Volunteers", href: "/dashboard/volunteers", icon: Users },
  { label: "Beneficiaries", href: "/dashboard/beneficiaries", icon: HandHeart },
  { label: "Teams", href: "/dashboard/teams", icon: UserRound },
];

const INTELLIGENCE_ITEMS: HopeBridgeNavItem[] = [
  { label: "Impact Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "AI Assistant", href: "/dashboard/ai-assistant", icon: BrainCircuit },
  { label: "Reports", href: "/dashboard/reports", icon: FileBarChart },
  { label: "Calendar", href: "/dashboard/calendar", icon: CalendarDays },
  { label: "Activity", href: "/dashboard/activity", icon: Activity },
];

const ADMINISTRATION_BASE_ITEMS: HopeBridgeNavItem[] = [
  { label: "Organization", href: "/dashboard/organization", icon: Home },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
  { label: "Help Center", href: "/dashboard/help", icon: HelpCircle },
];

export const USER_ACCESS_NAV_ITEM: HopeBridgeNavItem = {
  label: "User Access",
  href: "/dashboard/access",
  icon: ShieldCheck,
};

/** True only for active HopeBridge admins — drives User Access sidebar visibility. */
export function shouldShowUserAccessNav(
  profile: Pick<UserProfile, "status" | "organizationId" | "role"> | null | undefined,
): boolean {
  return canManageUserAccess(profile);
}

export function buildAdministrationNavItems(
  profile: Pick<UserProfile, "status" | "organizationId" | "role"> | null | undefined,
): HopeBridgeNavItem[] {
  if (!shouldShowUserAccessNav(profile)) {
    return ADMINISTRATION_BASE_ITEMS;
  }
  return [
    ADMINISTRATION_BASE_ITEMS[0],
    USER_ACCESS_NAV_ITEM,
    ...ADMINISTRATION_BASE_ITEMS.slice(1),
  ];
}

/**
 * Canonical HopeBridge sidebar groups.
 * User Access appears under ADMINISTRATION only for active admins.
 */
export function buildHopeBridgeNavGroups(
  profile: Pick<UserProfile, "status" | "organizationId" | "role"> | null | undefined,
  options?: { includeDashboardInFoundation?: boolean },
): HopeBridgeNavGroup[] {
  const includeDashboard = options?.includeDashboardInFoundation !== false;
  return [
    {
      title: "FOUNDATION",
      items: includeDashboard
        ? FOUNDATION_ITEMS
        : FOUNDATION_ITEMS.filter((item) => item.href !== "/dashboard"),
    },
    { title: "OPERATIONS", items: OPERATIONS_ITEMS },
    { title: "INTELLIGENCE", items: INTELLIGENCE_ITEMS },
    {
      title: "ADMINISTRATION",
      items: buildAdministrationNavItems(profile),
    },
  ];
}
