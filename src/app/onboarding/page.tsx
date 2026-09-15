"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingRoute, useAuth } from "@/components/AuthGuard";
import { createDocument } from "@/services/firestore";
import { setFirestoreOrganizationContext } from "@/services/firestore";
import { createOrganization } from "@/services/organizationService";
import {
  completeOrganizationOnboarding,
  markAwaitingOrganizationInvite,
} from "@/services/userProfile";
import type { OrganizationType } from "@/lib/organization";

const ORG_TYPES: { value: OrganizationType; label: string }[] = [
  { value: "foundation", label: "Foundation" },
  { value: "charity", label: "Charity" },
  { value: "ngo", label: "NGO" },
  { value: "community", label: "Community organization" },
  { value: "other", label: "Other nonprofit" },
];

type Step = 1 | 2 | 3 | 4 | 5;

export default function OnboardingPage() {
  return (
    <OnboardingRoute>
      <OnboardingFlow />
    </OnboardingRoute>
  );
}

function OnboardingFlow() {
  const router = useRouter();
  const { user, profile, refreshProfile, logout } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [organizationType, setOrganizationType] =
    useState<OrganizationType>("other");
  const [mission, setMission] = useState("");
  const [website, setWebsite] = useState("");
  const [primaryContact, setPrimaryContact] = useState(
    profile?.displayName || "",
  );
  const [contactEmail, setContactEmail] = useState(
    profile?.email || user?.email || "",
  );
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("United States");
  const [stateRegion, setStateRegion] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [primaryAccent, setPrimaryAccent] = useState("emerald");

  const [firstCampaign, setFirstCampaign] = useState("");
  const [firstProgram, setFirstProgram] = useState("");
  const [firstTeam, setFirstTeam] = useState("");

  const [createdOrgId, setCreatedOrgId] = useState<string | null>(null);

  const resolvedDisplayName = useMemo(
    () => (displayName.trim() || name.trim()),
    [displayName, name],
  );

  async function handleJoinExisting() {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      await markAwaitingOrganizationInvite(user.uid);
      await refreshProfile();
      router.replace("/auth/pending");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to continue. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  function validateStep2(): string | null {
    if (!name.trim()) return "Organization name is required.";
    if (!mission.trim()) return "A short mission statement helps set up your workspace.";
    if (!primaryContact.trim()) return "Primary contact is required.";
    if (!contactEmail.trim()) return "Contact email is required.";
    if (!country.trim()) return "Country is required.";
    return null;
  }

  async function finishOnboarding(options: {
    skipOptionalSetup: boolean;
  }) {
    if (!user) return;
    const validation = validateStep2();
    if (validation) {
      setError(validation);
      setStep(2);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const organization = await createOrganization({
        name: name.trim(),
        displayName: resolvedDisplayName,
        organizationType,
        mission: mission.trim(),
        website: website.trim(),
        primaryContact: primaryContact.trim(),
        contactEmail: contactEmail.trim(),
        phone: phone.trim(),
        country: country.trim(),
        stateRegion: stateRegion.trim(),
        primaryAccent,
        createdBy: user.uid,
        onboardingComplete: true,
      });

      await completeOrganizationOnboarding({
        uid: user.uid,
        organizationId: organization.id,
        displayName: primaryContact.trim() || profile?.displayName,
      });

      setFirestoreOrganizationContext(organization.id);

      if (!options.skipOptionalSetup) {
        if (firstCampaign.trim()) {
          await createDocument("campaigns", {
            name: firstCampaign.trim(),
            title: firstCampaign.trim(),
            status: "Planning",
            goal: 0,
            raised: 0,
            description: "",
          });
        }
        if (firstProgram.trim()) {
          await createDocument("programs", {
            name: firstProgram.trim(),
            title: firstProgram.trim(),
            status: "Planning",
            description: "",
          });
        }
        if (firstTeam.trim()) {
          await createDocument("teams", {
            name: firstTeam.trim(),
            title: firstTeam.trim(),
            status: "Active",
            description: "",
          });
        }
      }

      setCreatedOrgId(organization.id);
      await refreshProfile();
      setStep(5);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create your organization. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#134e3a_0%,_#0b1220_42%,_#050505_100%)] px-4 py-10 text-white">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-amber-300">
              HOPEBRIDGE
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              Nonprofit workspace setup
            </p>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-300 transition hover:bg-white/5"
          >
            Sign out
          </button>
        </div>

        <div className="mb-6 flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              className={`h-1.5 flex-1 rounded-full ${
                n <= step ? "bg-emerald-400" : "bg-white/10"
              }`}
            />
          ))}
        </div>

        <section className="rounded-3xl border border-white/10 bg-zinc-950/80 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          {error ? (
            <p className="mb-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </p>
          ) : null}

          {step === 1 && (
            <div>
              <h1 className="font-serif text-3xl text-white">
                Welcome to HopeBridge
              </h1>
              <p className="mt-3 text-sm leading-6 text-zinc-300">
                Let’s set up your nonprofit workspace. HopeBridge is the
                platform — your organization keeps its own identity, users, and
                data.
              </p>
              <div className="mt-8 flex flex-col gap-3">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setError(null);
                    setStep(2);
                  }}
                  className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
                >
                  Create my nonprofit workspace
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleJoinExisting()}
                  className="rounded-xl border border-white/15 px-5 py-3 text-sm font-medium text-zinc-200 transition hover:bg-white/5"
                >
                  Request access to an existing organization
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Organization details
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                Enter the practical information for your nonprofit.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2 block text-sm">
                  <span className="text-zinc-300">Organization name</span>
                  <input
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-white outline-none focus:border-emerald-400/50"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!displayName) setDisplayName(e.target.value);
                    }}
                    placeholder="Helping Hands Foundation"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-zinc-300">Organization type</span>
                  <select
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-white outline-none focus:border-emerald-400/50"
                    value={organizationType}
                    onChange={(e) =>
                      setOrganizationType(e.target.value as OrganizationType)
                    }
                  >
                    {ORG_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="text-zinc-300">Website (optional)</span>
                  <input
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-white outline-none focus:border-emerald-400/50"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://"
                  />
                </label>
                <label className="sm:col-span-2 block text-sm">
                  <span className="text-zinc-300">Mission</span>
                  <textarea
                    className="mt-1.5 min-h-[88px] w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-white outline-none focus:border-emerald-400/50"
                    value={mission}
                    onChange={(e) => setMission(e.target.value)}
                    placeholder="What does your organization exist to do?"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-zinc-300">Primary contact</span>
                  <input
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-white outline-none focus:border-emerald-400/50"
                    value={primaryContact}
                    onChange={(e) => setPrimaryContact(e.target.value)}
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-zinc-300">Contact email</span>
                  <input
                    type="email"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-white outline-none focus:border-emerald-400/50"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-zinc-300">Phone (optional)</span>
                  <input
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-white outline-none focus:border-emerald-400/50"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-zinc-300">Country</span>
                  <input
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-white outline-none focus:border-emerald-400/50"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                </label>
                <label className="sm:col-span-2 block text-sm">
                  <span className="text-zinc-300">State / region (optional)</span>
                  <input
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-white outline-none focus:border-emerald-400/50"
                    value={stateRegion}
                    onChange={(e) => setStateRegion(e.target.value)}
                  />
                </label>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-xl border border-white/15 px-5 py-3 text-sm text-zinc-200"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const message = validateStep2();
                    if (message) {
                      setError(message);
                      return;
                    }
                    setError(null);
                    setStep(3);
                  }}
                  className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-zinc-950"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Organization branding
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                The HopeBridge product design stays emerald, ivory, and gold.
                Set how your nonprofit appears inside the workspace.
              </p>
              <div className="mt-6 space-y-4">
                <label className="block text-sm">
                  <span className="text-zinc-300">Display name</span>
                  <input
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-white outline-none focus:border-emerald-400/50"
                    value={displayName || name}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </label>
                <fieldset>
                  <legend className="text-sm text-zinc-300">
                    Accent preference
                  </legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[
                      { id: "emerald", label: "Emerald" },
                      { id: "gold", label: "Gold" },
                      { id: "ivory", label: "Ivory" },
                    ].map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setPrimaryAccent(option.id)}
                        className={`rounded-full border px-4 py-2 text-xs font-semibold ${
                          primaryAccent === option.id
                            ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-200"
                            : "border-white/10 text-zinc-400"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <p className="text-xs text-zinc-500">
                  Logo uploads can be added later when storage is configured for
                  your deployment. You can update branding anytime in
                  Organization settings.
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="rounded-xl border border-white/15 px-5 py-3 text-sm text-zinc-200"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-zinc-950"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Initial setup
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                Optional. You can skip and add these later from the workspace.
              </p>
              <div className="mt-6 space-y-4">
                <label className="block text-sm">
                  <span className="text-zinc-300">First campaign (optional)</span>
                  <input
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-white outline-none focus:border-emerald-400/50"
                    value={firstCampaign}
                    onChange={(e) => setFirstCampaign(e.target.value)}
                    placeholder="Annual fundraising campaign"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-zinc-300">First program (optional)</span>
                  <input
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-white outline-none focus:border-emerald-400/50"
                    value={firstProgram}
                    onChange={(e) => setFirstProgram(e.target.value)}
                    placeholder="Community outreach program"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-zinc-300">First team (optional)</span>
                  <input
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-white outline-none focus:border-emerald-400/50"
                    value={firstTeam}
                    onChange={(e) => setFirstTeam(e.target.value)}
                    placeholder="Leadership team"
                  />
                </label>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="rounded-xl border border-white/15 px-5 py-3 text-sm text-zinc-200"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    void finishOnboarding({ skipOptionalSetup: true })
                  }
                  className="rounded-xl border border-white/15 px-5 py-3 text-sm text-zinc-200"
                >
                  Skip for now
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    void finishOnboarding({ skipOptionalSetup: false })
                  }
                  className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-zinc-950 disabled:opacity-60"
                >
                  {saving ? "Creating workspace..." : "Create workspace"}
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Your workspace is ready
              </h2>
              <p className="mt-3 text-sm leading-6 text-zinc-300">
                <span className="text-white font-medium">
                  {resolvedDisplayName}
                </span>{" "}
                is set up on HopeBridge. Your operational modules start empty —
                no sample data from other organizations.
              </p>
              {createdOrgId ? (
                <p className="mt-2 text-xs text-zinc-500">
                  Workspace id: {createdOrgId}
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => router.replace("/dashboard")}
                className="mt-8 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-zinc-950"
              >
                Enter Dashboard
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
