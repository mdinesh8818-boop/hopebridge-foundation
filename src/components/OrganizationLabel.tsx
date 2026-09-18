"use client";

import { useOrganizationOptional } from "@/providers/OrganizationProvider";
import { HOPEBRIDGE_ORGANIZATION_NAME } from "@/lib/organization";

/** Active workspace organization display name for authenticated chrome. */
export function OrganizationLabel({
  fallback = HOPEBRIDGE_ORGANIZATION_NAME,
  className,
}: {
  fallback?: string;
  className?: string;
}) {
  const org = useOrganizationOptional();
  const label = org?.displayName || fallback;
  if (className) {
    return <span className={className}>{label}</span>;
  }
  return <>{label}</>;
}
