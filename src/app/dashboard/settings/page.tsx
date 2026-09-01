"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { CreditCard, Home, Loader2, Save, Shield } from "lucide-react";

import HopeBridgeSidebar from "../components/HopeBridgeSidebar";
import { useAuth } from "@/providers/AuthProvider";
import {
  DEFAULT_USER_SETTINGS,
  fetchUserSettings,
  saveUserSettings,
  type UserSettings,
} from "@/services/userSettings";
import "../module-pages.css";

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!user) return;
    const userId = user.uid;
    let cancelled = false;

    async function loadSettings() {
      setLoading(true);
      setError("");
      try {
        const next = await fetchUserSettings(userId);
        if (!cancelled) setSettings(next);
      } catch (loadError) {
        console.error(loadError);
        if (!cancelled) setError("Unable to load your settings.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadSettings();
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!user) return;

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await saveUserSettings(user.uid, settings);
      setSuccess("Settings saved.");
    } catch (saveError) {
      console.error(saveError);
      setError("Unable to save settings. Check permissions and try again.");
    } finally {
      setSaving(false);
    }
  }

  const displayName =
    user?.displayName?.trim() ||
    (user?.email ? user.email.split("@")[0] : "HopeBridge user");

  return (
    <div className="hb-app op-page">
      <HopeBridgeSidebar activePath="/dashboard/settings" />

      <main className="hb-module-main">
        <div className="mx-auto max-w-[840px] space-y-6 pb-10">
          <nav className="flex items-center gap-2 text-sm text-[#607269]">
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 hover:text-[#0d5f44]">
              <Home size={14} className="text-[#0d5f44]" />
              HopeBridge Foundation
            </Link>
            <span>/</span>
            <strong className="text-[#112e24]">Settings</strong>
          </nav>

          <header className="op-hero">
            <p className="op-kicker">PREFERENCES</p>
            <h1>Settings</h1>
            <p>
              Account preferences for {displayName}
              {user?.email ? ` (${user.email})` : ""}.
            </p>
          </header>

          {loading ? (
            <div className="op-panel flex items-center gap-2 text-sm text-[#607269]">
              <Loader2 size={16} className="animate-spin text-[#0d5f44]" />
              Loading settings…
            </div>
          ) : (
            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
              {error ? <div className="op-error" role="alert">{error}</div> : null}
              {success ? <div className="op-success" role="status">{success}</div> : null}

              <section className="op-panel space-y-3">
                <h2>Notifications</h2>
                <label className="op-toggle">
                  <span>
                    <strong className="block text-sm text-[#18392e]">Email notifications</strong>
                    <span className="text-sm text-[#65766e]">
                      Operational alerts for campaigns, programs, and follow-ups.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        emailNotifications: e.target.checked,
                      }))
                    }
                  />
                </label>
                <label className="op-toggle">
                  <span>
                    <strong className="block text-sm text-[#18392e]">Weekly digest</strong>
                    <span className="text-sm text-[#65766e]">
                      Summary of organizational activity and metrics.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.weeklyDigest}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, weeklyDigest: e.target.checked }))
                    }
                  />
                </label>
              </section>

              <section className="op-panel space-y-4">
                <h2>Workspace</h2>
                <label>
                  <span className="op-label">Default landing page after sign-in</span>
                  <select
                    className="op-field"
                    value={settings.defaultLandingModule}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        defaultLandingModule: e.target.value,
                      }))
                    }
                  >
                    <option value="/dashboard">Dashboard</option>
                    <option value="/dashboard/campaigns">Campaigns</option>
                    <option value="/dashboard/programs">Programs</option>
                    <option value="/dashboard/analytics">Impact Analytics</option>
                    <option value="/dashboard/ai-assistant">AI Assistant</option>
                  </select>
                </label>
                <label>
                  <span className="op-label">Timezone</span>
                  <input
                    className="op-field"
                    value={settings.timezone}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, timezone: e.target.value }))
                    }
                  />
                </label>
                <label className="op-toggle">
                  <span>
                    <strong className="block text-sm text-[#18392e]">Compact tables</strong>
                    <span className="text-sm text-[#65766e]">
                      Use denser row spacing in module tables where supported.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.compactTables}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, compactTables: e.target.checked }))
                    }
                  />
                </label>
              </section>

              <section className="op-panel space-y-3">
                <div className="flex items-center gap-2">
                  <CreditCard size={18} className="text-[#0d5f44]" />
                  <h2>Payment readiness</h2>
                </div>
                <p>
                  HopeBridge separates nonprofit donation processing from SaaS subscription
                  billing. Neither flow is activated in this environment.
                </p>
                <div className="space-y-2">
                  <div className="op-toggle">
                    <span>
                      <strong className="block text-sm text-[#18392e]">
                        Donation processing (PayPal / gateway)
                      </strong>
                      <span className="text-sm text-[#65766e]">
                        For gifts made to your nonprofit — requires approved merchant
                        configuration.
                      </span>
                    </span>
                    <span className="op-badge pending">Pending setup</span>
                  </div>
                  <div className="op-toggle">
                    <span>
                      <strong className="block text-sm text-[#18392e]">
                        HopeBridge SaaS billing
                      </strong>
                      <span className="text-sm text-[#65766e]">
                        Subscription pricing is under evaluation. Contact leadership for early
                        access.
                      </span>
                    </span>
                    <span className="op-badge pending">Under evaluation</span>
                  </div>
                </div>
              </section>

              <section className="op-panel space-y-2">
                <div className="flex items-center gap-2">
                  <Shield size={18} className="text-[#0d5f44]" />
                  <h2>Security</h2>
                </div>
                <p>
                  Authentication is managed through Firebase. Operational records are stored
                  in Firestore and require a signed-in HopeBridge account.
                </p>
                <Link href="/dashboard/help" className="op-btn op-btn-secondary inline-flex">
                  Open Help Center
                </Link>
              </section>

              <button type="submit" className="op-btn op-btn-gold" disabled={saving || !user}>
                <Save size={15} />
                {saving ? "Saving…" : "Save settings"}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
