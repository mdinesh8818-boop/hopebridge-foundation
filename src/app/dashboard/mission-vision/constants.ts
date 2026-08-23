import type { LucideIcon } from "lucide-react";
import {
  Compass,
  HandHeart,
  Heart,
  Leaf,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import type { CoreValueAccent, CoreValueIconKey } from "@/types/missionVision";

export const CORE_VALUE_ICON_MAP: Record<CoreValueIconKey, LucideIcon> = {
  heart: Heart,
  shield: ShieldCheck,
  target: Target,
  compass: Compass,
  sparkles: Sparkles,
  "hand-heart": HandHeart,
  leaf: Leaf,
  users: Users,
};

export const CORE_VALUE_ICON_OPTIONS: { key: CoreValueIconKey; label: string }[] = [
  { key: "heart", label: "Compassion" },
  { key: "shield", label: "Integrity" },
  { key: "target", label: "Impact" },
  { key: "compass", label: "Direction" },
  { key: "sparkles", label: "Innovation" },
  { key: "hand-heart", label: "Service" },
  { key: "leaf", label: "Sustainability" },
  { key: "users", label: "Community" },
];

export const CORE_VALUE_ACCENT_OPTIONS: { key: CoreValueAccent; label: string }[] = [
  { key: "rose", label: "Rose" },
  { key: "emerald", label: "Emerald" },
  { key: "gold", label: "Gold" },
];

export const STRATEGIC_GOAL_STATUSES = [
  "Not Started",
  "On Track",
  "At Risk",
  "Needs Focus",
  "Completed",
] as const;

export const STRATEGIC_GOAL_CATEGORIES = [
  "Education",
  "Food Assistance",
  "Healthcare",
  "Youth Development",
  "Environment",
  "Community Development",
  "Awareness",
  "Emergency Relief",
  "General",
] as const;

export function getValueMedallionClass(accent: CoreValueAccent): string {
  if (accent === "rose") return "mv2-value-medallion mv2-value-rose";
  if (accent === "emerald") return "mv2-value-medallion mv2-value-emerald";
  return "mv2-value-medallion mv2-value-champagne";
}
