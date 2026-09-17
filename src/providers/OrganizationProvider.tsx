"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/providers/AuthProvider";
import {
  DEFAULT_ORGANIZATION_BRANDING,
  HOPEBRIDGE_ORGANIZATION_ID,
  HOPEBRIDGE_ORGANIZATION_NAME,
  type OrganizationRecord,
} from "@/lib/organization";
import {
  getOrganizationById,
  ensureHopeBridgeOrganization,
  organizationDisplayName,
} from "@/services/organizationService";
import { setFirestoreOrganizationContext } from "@/services/firestore";

type OrganizationContextType = {
  organization: OrganizationRecord | null;
  organizationId: string;
  displayName: string;
  loading: boolean;
  refreshOrganization: () => Promise<OrganizationRecord | null>;
};

const OrganizationContext = createContext<OrganizationContextType | null>(null);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { profile, loading: authLoading, profileLoading } = useAuth();
  const [organization, setOrganization] = useState<OrganizationRecord | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  const organizationId = profile?.organizationId?.trim() || "";

  const refreshOrganization = useCallback(async () => {
    if (!organizationId) {
      setFirestoreOrganizationContext(null);
      setOrganization(null);
      return null;
    }

    setFirestoreOrganizationContext(organizationId);
    try {
      const next = await getOrganizationById(organizationId);
      setOrganization(next);
      return next;
    } catch {
      if (organizationId === HOPEBRIDGE_ORGANIZATION_ID) {
        const fallback: OrganizationRecord = {
          id: HOPEBRIDGE_ORGANIZATION_ID,
          name: HOPEBRIDGE_ORGANIZATION_NAME,
          displayName: HOPEBRIDGE_ORGANIZATION_NAME,
          organizationType: "foundation",
          mission: "",
          website: "",
          primaryContact: "",
          contactEmail: "",
          phone: "",
          country: "",
          stateRegion: "",
          logoUrl: "",
          primaryAccent: "emerald",
          branding: { ...DEFAULT_ORGANIZATION_BRANDING },
          createdBy: "system",
          onboardingComplete: true,
        };
        setOrganization(fallback);
        return fallback;
      }
      setOrganization(null);
      return null;
    }
  }, [organizationId]);

  useEffect(() => {
    if (authLoading || profileLoading) return;

    let cancelled = false;

    void (async () => {
      if (!organizationId) {
        setFirestoreOrganizationContext(null);
        if (!cancelled) {
          setOrganization(null);
          setLoading(false);
        }
        return;
      }

      if (!cancelled) setLoading(true);
      try {
        if (organizationId === HOPEBRIDGE_ORGANIZATION_ID) {
          await ensureHopeBridgeOrganization().catch(() => null);
        }
        if (!cancelled) {
          await refreshOrganization();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, organizationId, profileLoading, refreshOrganization]);

  const value = useMemo<OrganizationContextType>(
    () => ({
      organization,
      organizationId,
      displayName: organizationDisplayName(organization),
      loading,
      refreshOrganization,
    }),
    [organization, organizationId, loading, refreshOrganization],
  );

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error("useOrganization must be used within OrganizationProvider");
  }
  return context;
}

/** Safe optional hook for components that may render outside provider. */
export function useOrganizationOptional() {
  return useContext(OrganizationContext);
}
