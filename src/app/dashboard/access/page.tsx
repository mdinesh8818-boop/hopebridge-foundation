"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, UserRoundCheck } from "lucide-react";

import HopeBridgeSidebar from "../components/HopeBridgeSidebar";
import "../module-pages.css";
import { useAuth } from "@/providers/AuthProvider";
import {
  canManageUserAccess,
  type UserAccessStatus,
  type UserProfile,
  type UserRole,
} from "@/lib/accessControl";
import {
  adminSetUserAccess,
  listUserProfiles,
} from "@/services/userProfile";

export default function AccessManagementPage() {
  const router = useRouter();
  const { profile, user, refreshProfile, loading, profileLoading } = useAuth();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState("");
  const [savingUid, setSavingUid] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const allowed = canManageUserAccess(profile);
  const authReady = !loading && !profileLoading;

  useEffect(() => {
    if (!authReady) return;
    if (!allowed) {
      router.replace("/dashboard");
    }
  }, [allowed, authReady, router]);

  const load = useCallback(async () => {
    if (!allowed) {
      setLoadingList(false);
      return;
    }
    setLoadingList(true);
    setError("");
    try {
      const rows = await listUserProfiles();
      setProfiles(rows);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load user access records.",
      );
      setProfiles([]);
    } finally {
      setLoadingList(false);
    }
  }, [allowed]);

  useEffect(() => {
    // Async profile list load for admins; mirrors other dashboard modules.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional async fetch on allow flag
    void load();
  }, [load]);

  async function updateAccess(
    target: UserProfile,
    status: UserAccessStatus,
    role?: UserRole,
  ) {
    if (!profile) return;
    setSavingUid(target.uid);
    setNotice("");
    setError("");
    try {
      await adminSetUserAccess({
        actor: profile,
        targetUid: target.uid,
        status,
        role,
      });
      setNotice(
        status === "active"
          ? `${target.email} is now active.`
          : status === "disabled"
            ? `${target.email} has been disabled.`
            : `${target.email} set to pending.`,
      );
      await load();
      if (target.uid === user?.uid) {
        await refreshProfile();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update user access.",
      );
    } finally {
      setSavingUid(null);
    }
  }

  if (!authReady || !allowed) {
    return (
      <div className="hb-app op-page">
        <HopeBridgeSidebar activePath="/dashboard/access" />
        <main className="hb-module-main">
          <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-[#5f7268]">
            <Loader2 size={16} className="animate-spin" />
            Checking administrator access…
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="hb-app op-page">
      <HopeBridgeSidebar activePath="/dashboard/access" />
      <main className="hb-module-main">
        <div className="mx-auto max-w-[960px] space-y-6 pb-10">
          <nav className="mb-2 flex items-center gap-2 text-sm text-[#607269]">
            <Link href="/dashboard" className="hover:text-[#0d5f44]">
              Dashboard
            </Link>
            <span>/</span>
            <strong className="text-[#112e24]">User Access</strong>
          </nav>

          <header className="op-hero">
            <p className="op-kicker">ADMINISTRATION</p>
            <h1>User access</h1>
            <p>
              Approve pending registrations, assign roles, or disable access.
              Only HopeBridge administrators can change authorization fields.
            </p>
          </header>

          {error ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          {notice ? (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {notice}
            </div>
          ) : null}

          <section className="rounded-2xl border border-[#ebe3d2] bg-white">
            <div className="flex items-center justify-between border-b border-[#ebe3d2] px-5 py-4">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#0d5f44]" />
                <h2 className="text-sm font-semibold text-[#112e24]">
                  Organization accounts
                </h2>
              </div>
              <button
                type="button"
                className="text-xs font-semibold text-[#0d5f44] hover:underline"
                onClick={() => void load()}
                disabled={loadingList}
              >
                Refresh
              </button>
            </div>

            {loadingList ? (
              <div className="flex items-center gap-2 px-5 py-8 text-sm text-[#5f7268]">
                <Loader2 size={16} className="animate-spin" />
                Loading accounts…
              </div>
            ) : profiles.length === 0 ? (
              <div className="px-5 py-8 text-sm text-[#5f7268]">
                No user profiles found yet. New registrations appear here as
                pending.
              </div>
            ) : (
              <ul className="divide-y divide-[#f0e9dc]">
                {profiles.map((row) => (
                  <li
                    key={row.uid}
                    className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#112e24]">
                        {row.displayName || row.email || "Unnamed account"}
                      </p>
                      <p className="mt-1 text-xs text-[#5f7268]">
                        {row.email} · {row.role} · {row.status}
                        {row.legacyBackfill ? " · legacy" : ""}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {row.status !== "active" ? (
                        <button
                          type="button"
                          disabled={savingUid === row.uid}
                          onClick={() =>
                            void updateAccess(row, "active", row.role)
                          }
                          className="inline-flex items-center gap-1 rounded-lg bg-[#0d5f44] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          <UserRoundCheck size={14} />
                          Activate
                        </button>
                      ) : null}

                      {row.status !== "disabled" ? (
                        <button
                          type="button"
                          disabled={
                            savingUid === row.uid || row.uid === user?.uid
                          }
                          onClick={() => void updateAccess(row, "disabled")}
                          className="rounded-lg border border-[#ebe3d2] px-3 py-2 text-xs font-semibold text-[#5f7268] hover:bg-[#fcfbf8] disabled:opacity-50"
                        >
                          Disable
                        </button>
                      ) : null}

                      <label className="text-xs text-[#5f7268]">
                        Role
                        <select
                          className="ml-2 rounded-lg border border-[#ebe3d2] bg-white px-2 py-1.5 text-xs text-[#112e24]"
                          value={row.role}
                          disabled={savingUid === row.uid}
                          onChange={(event) =>
                            void updateAccess(
                              row,
                              row.status,
                              event.target.value as UserRole,
                            )
                          }
                        >
                          <option value="member">member</option>
                          <option value="manager">manager</option>
                          <option value="admin">admin</option>
                        </select>
                      </label>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
