/**
 * Canonical identifiers for records created by demo/seed data files.
 * Used ONLY by opt-in cleanup (NEXT_PUBLIC_ENABLE_DEMO_CLEANUP=true).
 * Does not include user-created test records (e.g. "Test Campaign Updated").
 */

import { DEMO_CAMPAIGNS, DEMO_VOLUNTEERS } from "./demo-seed";

export const DEMO_CAMPAIGN_NAMES = new Set(
  DEMO_CAMPAIGNS.map((c) => c.name),
);

export const DEMO_VOLUNTEER_EMAILS = new Set(
  DEMO_VOLUNTEERS.map((v) => v.email.toLowerCase()),
);

export const DEMO_VOLUNTEER_NAMES = new Set(
  DEMO_VOLUNTEERS.map((v) => v.name),
);

/** beneficiaryId values from beneficiaries/data.ts INITIAL_BENEFICIARIES */
export const DEMO_BENEFICIARY_IDS = new Set([
  "BNF-2026-0142", // Amina Hassan
  "BNF-2026-0087", // Carlos Mendez
  "BNF-2026-0201", // The Nguyen Family
  "BNF-2026-0033", // Eleanor Price
  "BNF-2026-0178", // Marcus Johnson
  "BNF-2026-0056", // Sofia Ramirez
  "BNF-2025-0440", // David Chen
  "BNF-2026-0119", // Grace Okafor
]);

export const DEMO_BENEFICIARY_NAMES = new Set([
  "Amina Hassan",
  "Carlos Mendez",
  "The Nguyen Family",
  "Eleanor Price",
  "Marcus Johnson",
  "Sofia Ramirez",
  "David Chen",
  "Grace Okafor",
]);

/** programs/data.ts DEMO_PROGRAMS */
export const DEMO_PROGRAM_NAMES = new Set([
  "Education For Every Child",
  "Healthcare Outreach",
  "Clean Water Initiative",
  "Food Distribution",
]);

export const DEMO_PROGRAM_IDS = new Set(["PG001", "PG002", "PG003", "PG004"]);

/** beneficiaryActivity ids from INITIAL_ACTIVITY */
export const DEMO_BENEFICIARY_ACTIVITY_IDS = new Set([
  "act-001",
  "act-002",
  "act-003",
  "act-004",
  "act-005",
]);

/** Known demo volunteer names that may appear in global activities */
export const DEMO_ACTIVITY_NAME_PATTERNS = [
  ...DEMO_VOLUNTEER_NAMES,
  ...DEMO_BENEFICIARY_NAMES,
  ...DEMO_CAMPAIGNS.map((c) => c.name),
];

export function isKnownDemoCampaign(record: { name?: string }): boolean {
  return Boolean(record.name && DEMO_CAMPAIGN_NAMES.has(record.name));
}

export function isKnownDemoVolunteer(record: {
  name?: string;
  email?: string;
}): boolean {
  if (record.email && DEMO_VOLUNTEER_EMAILS.has(record.email.toLowerCase())) {
    return true;
  }
  return Boolean(record.name && DEMO_VOLUNTEER_NAMES.has(record.name));
}

export function isKnownDemoBeneficiary(record: {
  name?: string;
  beneficiaryId?: string;
}): boolean {
  if (
    record.beneficiaryId &&
    DEMO_BENEFICIARY_IDS.has(record.beneficiaryId)
  ) {
    return true;
  }
  return Boolean(record.name && DEMO_BENEFICIARY_NAMES.has(record.name));
}

export function isKnownDemoProgram(record: {
  id?: string;
  name?: string;
}): boolean {
  if (record.id && DEMO_PROGRAM_IDS.has(record.id)) return true;
  return Boolean(record.name && DEMO_PROGRAM_NAMES.has(record.name));
}

export function isKnownDemoActivityDescription(description?: string): boolean {
  if (!description) return false;
  return DEMO_ACTIVITY_NAME_PATTERNS.some((name) =>
    description.includes(name),
  );
}
