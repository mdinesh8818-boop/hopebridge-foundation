"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ExternalLink, Home, Loader2, Save } from "lucide-react";

import HopeBridgeSidebar from "../components/HopeBridgeSidebar";
import { useAuth } from "@/providers/AuthProvider";
import { useOrganization } from "@/providers/OrganizationProvider";
import { isOrganizationAdmin } from "@/lib/accessControl";
import {
  EMPTY_ORGANIZATION_PROFILE,
  describeOrganizationSaveError,
  fetchOrganizationProfile,
  isResourcesUrlConfigured,
  saveOrganizationProfile,
  type OrganizationProfile,
} from "@/services/organizationProfile";
import { updateOrganization } from "@/services/organizationService";
import "../module-pages.css";
import { OrganizationLabel } from "@/components/OrganizationLabel";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function OrganizationPage() {
  const { user, profile: accessProfile } = useAuth();
  const {
    organization,
    organizationId,
    displayName,
    refreshOrganization,
  } = useOrganization();
  const canEdit = isOrganizationAdmin(accessProfile);
  const [profile, setProfile] = useState<OrganizationProfile>(EMPTY_ORGANIZATION_PROFILE);
  const [mission, setMission] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [tagline, setTagline] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#0d5f44");
  const [secondaryColor, setSecondaryColor] = useState("#112e24");
  const [accentColor, setAccentColor] = useState("#d4af37");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);
      setError("");
      try {
        const next = await fetchOrganizationProfile();
        if (cancelled) return;
        const merged: OrganizationProfile = {
          ...next,
          organizationName:
            next.organizationName ||
            organization?.displayName ||
            organization?.name ||
            displayName ||
            "",
          website: next.website || organization?.website || "",
          email: next.email || organization?.contactEmail || "",
          phone: next.phone || organization?.phone || "",
          primaryContactName:
            next.primaryContactName || organization?.primaryContact || "",
          country: next.country || organization?.country || next.country,
          state: next.state || organization?.stateRegion || next.state,
        };
        setProfile(merged);
        setMission(organization?.mission || "");
        setLogoUrl(
          organization?.branding?.logoUrl || organization?.logoUrl || "",
        );
        setTagline(organization?.branding?.tagline || "");
        setPrimaryColor(
          organization?.branding?.primaryColor || "#0d5f44",
        );
        setSecondaryColor(
          organization?.branding?.secondaryColor || "#112e24",
        );
        setAccentColor(organization?.branding?.accentColor || "#d4af37");
      } catch (loadError) {
        console.error(loadError);
        if (!cancelled) setError("Unable to load organization profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [organization, displayName]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!user || saving) return;
    if (!canEdit) {
      setError("Only organization administrators can update organization settings.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const confirmed = await saveOrganizationProfile(profile);
      setProfile(confirmed);

      if (organizationId && user.uid) {
        await updateOrganization(
          organizationId,
          {
            name: profile.organizationName.trim() || displayName,
            displayName: profile.organizationName.trim() || displayName,
            mission: mission.trim(),
            website: profile.website.trim(),
            primaryContact: profile.primaryContactName.trim(),
            contactEmail: profile.email.trim(),
            phone: profile.phone.trim(),
            country: profile.country.trim(),
            stateRegion: profile.state.trim(),
            logoUrl: logoUrl.trim(),
            tagline: tagline.trim(),
            primaryColor: primaryColor.trim(),
            secondaryColor: secondaryColor.trim(),
            accentColor: accentColor.trim(),
          },
          user.uid,
        );
        await refreshOrganization();
      }

      setSuccess(
        "Organization profile saved successfully. Workspace branding and contact details remain after refresh.",
      );
    } catch (saveError) {
      console.error("Organization profile save failed:", saveError);
      setSuccess("");
      setError(describeOrganizationSaveError(saveError));
    } finally {
      setSaving(false);
    }
  }

  const resourcesConfigured = isResourcesUrlConfigured(profile);
  const fieldDisabled = !canEdit || saving;

  return (
    <div className="hb-app op-page">
      <HopeBridgeSidebar activePath="/dashboard/organization" />

      <main className="hb-module-main">
        <div className="mx-auto max-w-[960px] space-y-6 pb-10">
          <nav className="flex items-center gap-2 text-sm text-[#607269]">
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 hover:text-[#0d5f44]">
              <Home size={14} className="text-[#0d5f44]" />
              <OrganizationLabel />
            </Link>
            <span>/</span>
            <strong className="text-[#112e24]">Organization</strong>
          </nav>

          <header className="op-hero">
            <p className="op-kicker">ADMINISTRATION</p>
            <h1>Organization Profile</h1>
            <p>
              Workspace details for <OrganizationLabel />. Program-level mission
              content can also be managed in{" "}
              <Link href="/dashboard/mission-vision" className="underline text-[#efd062]">
                Mission &amp; Vision
              </Link>
              .
            </p>
          </header>

          {!canEdit ? (
            <div className="op-panel text-sm text-[#607269]" role="status">
              You can view organization details. Only organization administrators
              can edit these settings.
            </div>
          ) : null}

          {loading ? (
            <div className="op-panel flex items-center gap-2 text-sm text-[#607269]">
              <Loader2 size={16} className="animate-spin text-[#0d5f44]" />
              Loading organization profile…
            </div>
          ) : (
            <form
              onSubmit={(event) => void handleSubmit(event)}
              onInput={() => setSuccess("")}
              className="space-y-5"
            >
              {error ? (
                <div className="op-error" role="alert">
                  {error}
                </div>
              ) : null}
              {success ? (
                <div className="op-success" role="status" aria-live="polite">
                  {success}
                </div>
              ) : null}

              <section className="op-panel space-y-4">
                <h2>Organization details</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label>
                    <span className="op-label">Organization name</span>
                    <input
                      className="op-field"
                      disabled={fieldDisabled}
                      value={profile.organizationName}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, organizationName: e.target.value }))
                      }
                    />
                  </label>
                  <label>
                    <span className="op-label">Legal name</span>
                    <input
                      className="op-field"
                      disabled={fieldDisabled}
                      value={profile.legalName}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, legalName: e.target.value }))
                      }
                    />
                  </label>
                  <label className="sm:col-span-2">
                    <span className="op-label">Mission</span>
                    <textarea
                      className="op-field min-h-[88px]"
                      disabled={fieldDisabled}
                      value={mission}
                      onChange={(e) => setMission(e.target.value)}
                      placeholder="What does your organization exist to do?"
                    />
                  </label>
                  <label>
                    <span className="op-label">EIN (optional)</span>
                    <input
                      className="op-field"
                      disabled={fieldDisabled}
                      value={profile.ein}
                      onChange={(e) => setProfile((p) => ({ ...p, ein: e.target.value }))}
                    />
                  </label>
                  <label>
                    <span className="op-label">Website</span>
                    <input
                      className="op-field"
                      type="url"
                      disabled={fieldDisabled}
                      placeholder="https://"
                      value={profile.website}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, website: e.target.value }))
                      }
                    />
                  </label>
                </div>
              </section>

              <section className="op-panel space-y-4">
                <h2>Contact &amp; location</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="sm:col-span-2">
                    <span className="op-label">Address line 1</span>
                    <input
                      className="op-field"
                      disabled={fieldDisabled}
                      value={profile.addressLine1}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, addressLine1: e.target.value }))
                      }
                    />
                  </label>
                  <label className="sm:col-span-2">
                    <span className="op-label">Address line 2</span>
                    <input
                      className="op-field"
                      disabled={fieldDisabled}
                      value={profile.addressLine2}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, addressLine2: e.target.value }))
                      }
                    />
                  </label>
                  <label>
                    <span className="op-label">City</span>
                    <input
                      className="op-field"
                      disabled={fieldDisabled}
                      value={profile.city}
                      onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))}
                    />
                  </label>
                  <label>
                    <span className="op-label">State / Province</span>
                    <input
                      className="op-field"
                      disabled={fieldDisabled}
                      value={profile.state}
                      onChange={(e) => setProfile((p) => ({ ...p, state: e.target.value }))}
                    />
                  </label>
                  <label>
                    <span className="op-label">Postal code</span>
                    <input
                      className="op-field"
                      disabled={fieldDisabled}
                      value={profile.postalCode}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, postalCode: e.target.value }))
                      }
                    />
                  </label>
                  <label>
                    <span className="op-label">Country</span>
                    <input
                      className="op-field"
                      disabled={fieldDisabled}
                      value={profile.country}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, country: e.target.value }))
                      }
                    />
                  </label>
                  <label>
                    <span className="op-label">Phone</span>
                    <input
                      className="op-field"
                      disabled={fieldDisabled}
                      value={profile.phone}
                      onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                    />
                  </label>
                  <label>
                    <span className="op-label">Email</span>
                    <input
                      className="op-field"
                      type="email"
                      disabled={fieldDisabled}
                      value={profile.email}
                      onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                    />
                  </label>
                  <label>
                    <span className="op-label">Primary contact</span>
                    <input
                      className="op-field"
                      disabled={fieldDisabled}
                      value={profile.primaryContactName}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, primaryContactName: e.target.value }))
                      }
                    />
                  </label>
                  <label>
                    <span className="op-label">Contact title</span>
                    <input
                      className="op-field"
                      disabled={fieldDisabled}
                      value={profile.primaryContactTitle}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, primaryContactTitle: e.target.value }))
                      }
                    />
                  </label>
                </div>
              </section>

              <section className="op-panel space-y-4">
                <h2>Workspace branding</h2>
                <p className="text-sm text-[#607269]">
                  Optional logo, tagline, and accent colors for this organization.
                  Full white-label chrome arrives in a later phase.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="sm:col-span-2">
                    <span className="op-label">Logo URL</span>
                    <input
                      className="op-field"
                      type="url"
                      disabled={fieldDisabled}
                      placeholder="https://"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                    />
                  </label>
                  <label className="sm:col-span-2">
                    <span className="op-label">Tagline</span>
                    <input
                      className="op-field"
                      disabled={fieldDisabled}
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="Short phrase for your workspace"
                    />
                  </label>
                  <label>
                    <span className="op-label">Primary color</span>
                    <input
                      className="op-field"
                      type="color"
                      disabled={fieldDisabled}
                      value={primaryColor || "#0d5f44"}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                    />
                  </label>
                  <label>
                    <span className="op-label">Secondary color</span>
                    <input
                      className="op-field"
                      type="color"
                      disabled={fieldDisabled}
                      value={secondaryColor || "#112e24"}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                    />
                  </label>
                  <label>
                    <span className="op-label">Accent color</span>
                    <input
                      className="op-field"
                      type="color"
                      disabled={fieldDisabled}
                      value={accentColor || "#d4af37"}
                      onChange={(e) => setAccentColor(e.target.value)}
                    />
                  </label>
                </div>
              </section>

              <section className="op-panel space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2>Core Strategy — Resources</h2>
                  <span
                    className={`op-badge ${resourcesConfigured ? "ready" : "pending"}`}
                  >
                    {resourcesConfigured ? "Link configured" : "Requires configuration"}
                  </span>
                </div>
                <p>
                  External strategy or resource library for leadership. Enter the approved
                  URL below — HopeBridge will not invent a destination.
                </p>
                <label>
                  <span className="op-label">Resource link label</span>
                  <input
                    className="op-field"
                    disabled={fieldDisabled}
                    value={profile.resourcesLabel}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, resourcesLabel: e.target.value }))
                    }
                  />
                </label>
                <label>
                  <span className="op-label">Resource URL</span>
                  <input
                    className="op-field"
                    type="url"
                    disabled={fieldDisabled}
                    placeholder="https://your-approved-resource-site.org"
                    value={profile.resourcesUrl}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, resourcesUrl: e.target.value }))
                    }
                  />
                </label>
                {resourcesConfigured ? (
                  <a
                    href={profile.resourcesUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="op-btn op-btn-secondary inline-flex"
                  >
                    <ExternalLink size={15} />
                    Open {profile.resourcesLabel}
                  </a>
                ) : (
                  <p className="text-sm text-[#9a6700]">
                    No resource URL is configured yet. Save a valid http(s) URL to enable
                    the Core Strategy Resources link on Mission &amp; Vision.
                  </p>
                )}
              </section>

              <section className="op-panel space-y-4">
                <h2>Operating preferences</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label>
                    <span className="op-label">Fiscal year starts</span>
                    <select
                      className="op-field"
                      disabled={fieldDisabled}
                      value={profile.fiscalYearStartMonth}
                      onChange={(e) =>
                        setProfile((p) => ({
                          ...p,
                          fiscalYearStartMonth: Number(e.target.value),
                        }))
                      }
                    >
                      {MONTHS.map((month, index) => (
                        <option key={month} value={index + 1}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="op-label">Timezone</span>
                    <input
                      className="op-field"
                      disabled={fieldDisabled}
                      value={profile.timezone}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, timezone: e.target.value }))
                      }
                    />
                  </label>
                </div>
              </section>

              {canEdit ? (
                <button
                  type="submit"
                  className="op-btn op-btn-gold"
                  disabled={saving || !user}
                >
                  <Save size={15} />
                  {saving ? "Saving…" : "Save organization profile"}
                </button>
              ) : null}
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
