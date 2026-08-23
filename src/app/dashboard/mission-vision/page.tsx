"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import HopeBridgeSidebar from "../components/HopeBridgeSidebar";
import "./mission-vision.css";
import {
  Compass,
  Eye,
  Flag,
  Home,
  MoreVertical,
  Pencil,
  Plus,
  CheckCircle2,
  Save,
  Sparkles,
  Target,
  TrendingUp,
  X,
} from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import type {
  CoreValueInput,
  CoreValueRecord,
  MissionVisionBundle,
  MissionVisionInput,
  StrategicGoalInput,
  StrategicGoalRecord,
} from "@/types/missionVision";
import {
  computeStrategicGoalSummary,
  createCoreValue,
  createStrategicGoal,
  deleteCoreValue,
  deleteStrategicGoal,
  fetchMissionVisionBundle,
  formatGoalDueDate,
  getGoalStatusClassName,
  missionVisionToInput,
  resolveGoalProgressPercent,
  resolveLinkedNames,
  saveMissionVision,
  updateCoreValue,
  updateStrategicGoal,
} from "@/services/missionVision";
import {
  CORE_VALUE_ACCENT_OPTIONS,
  CORE_VALUE_ICON_MAP,
  CORE_VALUE_ICON_OPTIONS,
  getValueMedallionClass,
  STRATEGIC_GOAL_CATEGORIES,
  STRATEGIC_GOAL_STATUSES,
} from "./constants";

function emptyGoalInput(): StrategicGoalInput {
  return {
    title: "",
    description: "",
    owner: "",
    targetOutcome: "",
    currentValue: null,
    targetValue: null,
    progressPercent: null,
    status: "Not Started",
    startDate: "",
    dueDate: "",
    category: "",
    linkedProgramIds: [],
    linkedCampaignIds: [],
    linkedTeamIds: [],
  };
}

function emptyValueInput(displayOrder: number): CoreValueInput {
  return {
    name: "",
    description: "",
    iconKey: "heart",
    accent: "gold",
    displayOrder,
  };
}

function goalToInput(goal: StrategicGoalRecord): StrategicGoalInput {
  return {
    title: goal.title,
    description: goal.description,
    owner: goal.owner,
    targetOutcome: goal.targetOutcome,
    currentValue: goal.currentValue ?? null,
    targetValue: goal.targetValue ?? null,
    progressPercent: goal.progressPercent ?? null,
    status: goal.status,
    startDate: goal.startDate,
    dueDate: goal.dueDate,
    category: goal.category,
    linkedProgramIds: [...goal.linkedProgramIds],
    linkedCampaignIds: [...goal.linkedCampaignIds],
    linkedTeamIds: [...goal.linkedTeamIds],
  };
}

function GoalContext({
  goal,
  programs,
  campaigns,
}: {
  goal: StrategicGoalRecord;
  programs: MissionVisionBundle["programs"];
  campaigns: MissionVisionBundle["campaigns"];
}) {
  const progress = resolveGoalProgressPercent(goal);
  const linkedPrograms = resolveLinkedNames(goal.linkedProgramIds, programs);
  const linkedCampaigns = resolveLinkedNames(goal.linkedCampaignIds, campaigns);

  return (
    <div className="mv2-goal-context">
      {progress != null && (
        <p className="mv2-goal-context-line">
          <strong>Progress:</strong> {progress}%
        </p>
      )}
      {goal.targetOutcome && (
        <p className="mv2-goal-context-line">
          <strong>Target outcome:</strong> {goal.targetOutcome}
        </p>
      )}
      {goal.targetValue != null && (
        <p className="mv2-goal-context-line">
          <strong>Target:</strong> {goal.targetValue.toLocaleString()}
          {goal.currentValue != null && (
            <>
              {" "}
              · <strong>Current:</strong> {goal.currentValue.toLocaleString()}
            </>
          )}
        </p>
      )}
      {goal.owner && (
        <p className="mv2-goal-context-line">
          <strong>Owner:</strong> {goal.owner}
        </p>
      )}
      {goal.dueDate && (
        <p className="mv2-goal-context-line">
          <strong>Due:</strong> {formatGoalDueDate(goal.dueDate)}
        </p>
      )}
      {goal.category && (
        <p className="mv2-goal-context-line">
          <strong>Domain:</strong> {goal.category}
        </p>
      )}
      <div className="mv2-goal-links">
        <p className="mv2-goal-context-line">
          <strong>Connected programs:</strong>{" "}
          {linkedPrograms.length > 0 ? (
            linkedPrograms.map((program, index) => (
              <span key={program.id}>
                {index > 0 ? ", " : ""}
                <Link href="/dashboard/programs" className="mv2-inline-link">
                  {program.name}
                </Link>
              </span>
            ))
          ) : (
            "No programs linked yet."
          )}
        </p>
        <p className="mv2-goal-context-line">
          <strong>Connected campaigns:</strong>{" "}
          {linkedCampaigns.length > 0 ? (
            linkedCampaigns.map((campaign, index) => (
              <span key={campaign.id}>
                {index > 0 ? ", " : ""}
                <Link href="/dashboard/campaigns" className="mv2-inline-link">
                  {campaign.name}
                </Link>
              </span>
            ))
          ) : (
            "No campaigns linked yet."
          )}
        </p>
      </div>
    </div>
  );
}

export default function MissionVisionPage() {
  const { user } = useAuth();
  const canManage = Boolean(user);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [bundle, setBundle] = useState<MissionVisionBundle | null>(null);

  const [isEditingMission, setIsEditingMission] = useState(false);
  const [missionForm, setMissionForm] = useState<MissionVisionInput>({
    missionStatement: "",
    missionDescription: "",
    visionStatement: "",
    visionDescription: "",
  });

  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false);
  const [goalForm, setGoalForm] = useState<StrategicGoalInput>(emptyGoalInput());
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [viewingGoalId, setViewingGoalId] = useState<string | null>(null);
  const [openGoalMenu, setOpenGoalMenu] = useState<string | null>(null);

  const [isValueFormOpen, setIsValueFormOpen] = useState(false);
  const [valueForm, setValueForm] = useState<CoreValueInput>(emptyValueInput(0));
  const [editingValueId, setEditingValueId] = useState<string | null>(null);

  const [showSavedMessage, setShowSavedMessage] = useState(false);
  const [missionSaveError, setMissionSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchMissionVisionBundle();
      setBundle(data);
    } catch (error) {
      console.error("Unable to load Mission & Vision data.", error);
      setLoadError("Unable to load organizational strategy data.");
      setBundle(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    function handleClick() {
      setOpenGoalMenu(null);
    }
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    if (!isEditingMission || !bundle?.missionVision) return;
    setMissionForm(missionVisionToInput(bundle.missionVision));
    setMissionSaveError(null);
  }, [isEditingMission, bundle?.missionVision]);

  const missionVision = bundle?.missionVision;
  const coreValues = bundle?.coreValues ?? [];
  const strategicGoals = bundle?.strategicGoals ?? [];
  const summary = useMemo(
    () => bundle?.summary ?? computeStrategicGoalSummary([]),
    [bundle],
  );

  const viewingGoal = strategicGoals.find((goal) => goal.id === viewingGoalId) ?? null;

  function flashSaved() {
    setShowSavedMessage(true);
    window.setTimeout(() => setShowSavedMessage(false), 3000);
  }

  async function handleSaveMissionVision() {
    if (!canManage || saving) return;

    const missionStatement = missionForm.missionStatement.trim();
    const visionStatement = missionForm.visionStatement.trim();

    if (!missionStatement || !visionStatement) {
      setMissionSaveError("Mission statement and vision statement are required.");
      return;
    }

    setMissionSaveError(null);
    setSaving(true);
    try {
      await saveMissionVision({
        missionStatement,
        missionDescription: missionForm.missionDescription.trim(),
        visionStatement,
        visionDescription: missionForm.visionDescription.trim(),
      });
      await loadData();
      setIsEditingMission(false);
      flashSaved();
    } catch (error) {
      console.error("Unable to save mission and vision.", error);
      setMissionSaveError(
        "Unable to save mission and vision. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveGoal() {
    if (!canManage) return;
    const title = goalForm.title.trim();
    const description = goalForm.description.trim();
    if (!title || !description) {
      alert("Please enter the goal title and description.");
      return;
    }

    setSaving(true);
    try {
      const payload: StrategicGoalInput = {
        ...goalForm,
        title,
        description,
        owner: goalForm.owner.trim(),
        targetOutcome: goalForm.targetOutcome.trim(),
        category: goalForm.category.trim(),
      };

      if (editingGoalId) {
        await updateStrategicGoal(editingGoalId, payload);
      } else {
        await createStrategicGoal(payload);
      }

      await loadData();
      setIsGoalFormOpen(false);
      setEditingGoalId(null);
      setGoalForm(emptyGoalInput());
      flashSaved();
    } catch (error) {
      console.error(error);
      alert("Unable to save strategic goal. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteGoal(goal: StrategicGoalRecord) {
    if (!canManage) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete "${goal.title}"?`,
    );
    if (!confirmed) return;

    setSaving(true);
    try {
      await deleteStrategicGoal(goal.id, goal.title);
      await loadData();
      setOpenGoalMenu(null);
      setViewingGoalId(null);
      flashSaved();
    } catch (error) {
      console.error(error);
      alert("Unable to delete strategic goal. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveValue() {
    if (!canManage) return;
    const name = valueForm.name.trim();
    const description = valueForm.description.trim();
    if (!name || !description) {
      alert("Please enter the value name and description.");
      return;
    }

    setSaving(true);
    try {
      const payload = { ...valueForm, name, description };
      if (editingValueId) {
        await updateCoreValue(editingValueId, payload);
      } else {
        await createCoreValue(payload);
      }
      await loadData();
      setIsValueFormOpen(false);
      setEditingValueId(null);
      setValueForm(emptyValueInput(coreValues.length));
      flashSaved();
    } catch (error) {
      console.error(error);
      alert("Unable to save core value. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteValue(value: CoreValueRecord) {
    if (!canManage) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete "${value.name}"?`,
    );
    if (!confirmed) return;

    setSaving(true);
    try {
      await deleteCoreValue(value.id, value.name);
      await loadData();
      flashSaved();
    } catch (error) {
      console.error(error);
      alert("Unable to delete core value. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function openMissionEditor() {
    if (!bundle?.missionVision || loading) return;
    setMissionForm(missionVisionToInput(bundle.missionVision));
    setMissionSaveError(null);
    setIsEditingMission(true);
  }

  function closeMissionEditor() {
    setIsEditingMission(false);
    setMissionSaveError(null);
  }

  function openCreateGoal() {
    setEditingGoalId(null);
    setGoalForm(emptyGoalInput());
    setIsGoalFormOpen(true);
  }

  function openEditGoal(goal: StrategicGoalRecord) {
    setEditingGoalId(goal.id);
    setGoalForm(goalToInput(goal));
    setIsGoalFormOpen(true);
    setOpenGoalMenu(null);
  }

  function openCreateValue() {
    setEditingValueId(null);
    setValueForm(emptyValueInput(coreValues.length));
    setIsValueFormOpen(true);
  }

  function openEditValue(value: CoreValueRecord) {
    setEditingValueId(value.id);
    setValueForm({
      name: value.name,
      description: value.description,
      iconKey: value.iconKey,
      accent: value.accent,
      displayOrder: value.displayOrder,
    });
    setIsValueFormOpen(true);
  }

  function renderGoalForm() {
    return (
      <div className="mv2-form-surface">
        <h3 className="mv-serif text-xl font-semibold text-[#18392e]">
          {editingGoalId ? "Edit Strategic Goal" : "Add Strategic Goal"}
        </h3>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <input
            type="text"
            value={goalForm.title}
            onChange={(event) =>
              setGoalForm((current) => ({ ...current, title: event.target.value }))
            }
            placeholder="Goal title"
            className="mv-input w-full rounded-xl px-4 py-3 text-sm outline-none md:col-span-2"
          />

          <textarea
            value={goalForm.description}
            onChange={(event) =>
              setGoalForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            placeholder="Goal description"
            rows={4}
            className="mv-input w-full resize-none rounded-xl px-4 py-3 text-sm outline-none md:col-span-2"
          />

          <input
            type="text"
            value={goalForm.owner}
            onChange={(event) =>
              setGoalForm((current) => ({ ...current, owner: event.target.value }))
            }
            placeholder="Owner / team"
            className="mv-input w-full rounded-xl px-4 py-3 text-sm outline-none"
          />

          <select
            value={goalForm.category}
            onChange={(event) =>
              setGoalForm((current) => ({ ...current, category: event.target.value }))
            }
            className="mv-input w-full rounded-xl px-4 py-3 text-sm outline-none"
          >
            <option value="">Select domain / category</option>
            {STRATEGIC_GOAL_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={goalForm.targetOutcome}
            onChange={(event) =>
              setGoalForm((current) => ({
                ...current,
                targetOutcome: event.target.value,
              }))
            }
            placeholder="Target or desired outcome"
            className="mv-input w-full rounded-xl px-4 py-3 text-sm outline-none md:col-span-2"
          />

          <input
            type="number"
            value={goalForm.targetValue ?? ""}
            onChange={(event) =>
              setGoalForm((current) => ({
                ...current,
                targetValue:
                  event.target.value === "" ? null : Number(event.target.value),
              }))
            }
            placeholder="Target metric (optional)"
            className="mv-input w-full rounded-xl px-4 py-3 text-sm outline-none"
          />

          <input
            type="number"
            value={goalForm.currentValue ?? ""}
            onChange={(event) =>
              setGoalForm((current) => ({
                ...current,
                currentValue:
                  event.target.value === "" ? null : Number(event.target.value),
              }))
            }
            placeholder="Current metric (optional)"
            className="mv-input w-full rounded-xl px-4 py-3 text-sm outline-none"
          />

          <input
            type="number"
            value={goalForm.progressPercent ?? ""}
            onChange={(event) =>
              setGoalForm((current) => ({
                ...current,
                progressPercent:
                  event.target.value === "" ? null : Number(event.target.value),
              }))
            }
            min="0"
            max="100"
            placeholder="Progress % (optional if metrics provided)"
            className="mv-input w-full rounded-xl px-4 py-3 text-sm outline-none"
          />

          <select
            value={goalForm.status}
            onChange={(event) =>
              setGoalForm((current) => ({
                ...current,
                status: event.target.value as StrategicGoalInput["status"],
              }))
            }
            className="mv-input w-full rounded-xl px-4 py-3 text-sm outline-none"
          >
            {STRATEGIC_GOAL_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={goalForm.startDate}
            onChange={(event) =>
              setGoalForm((current) => ({
                ...current,
                startDate: event.target.value,
              }))
            }
            className="mv-input w-full rounded-xl px-4 py-3 text-sm outline-none"
          />

          <input
            type="date"
            value={goalForm.dueDate}
            onChange={(event) =>
              setGoalForm((current) => ({
                ...current,
                dueDate: event.target.value,
              }))
            }
            className="mv-input w-full rounded-xl px-4 py-3 text-sm outline-none"
          />

          <div className="md:col-span-2">
            <label className="text-sm font-medium text-[#334b41]">
              Connected programs
            </label>
            <select
              multiple
              value={goalForm.linkedProgramIds}
              onChange={(event) =>
                setGoalForm((current) => ({
                  ...current,
                  linkedProgramIds: Array.from(
                    event.target.selectedOptions,
                    (option) => option.value,
                  ),
                }))
              }
              className="mv-input mt-2 min-h-[96px] w-full rounded-xl px-4 py-3 text-sm outline-none"
            >
              {(bundle?.programs ?? []).map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium text-[#334b41]">
              Connected campaigns
            </label>
            <select
              multiple
              value={goalForm.linkedCampaignIds}
              onChange={(event) =>
                setGoalForm((current) => ({
                  ...current,
                  linkedCampaignIds: Array.from(
                    event.target.selectedOptions,
                    (option) => option.value,
                  ),
                }))
              }
              className="mv-input mt-2 min-h-[96px] w-full rounded-xl px-4 py-3 text-sm outline-none"
            >
              {(bundle?.campaigns ?? []).map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setIsGoalFormOpen(false);
              setEditingGoalId(null);
              setGoalForm(emptyGoalInput());
            }}
            className="mv-secondary-btn rounded-xl px-5 py-2.5 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSaveGoal()}
            className="mv-gold-btn rounded-xl px-5 py-2.5 text-sm font-bold"
          >
            {editingGoalId ? "Save Changes" : "Save Goal"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="hb-app mv2-page">
      <HopeBridgeSidebar activePath="/dashboard/mission-vision" />

      <main className="hb-module-main">
        <div className="mx-auto max-w-[1500px]">
          <nav className="hb-breadcrumb">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 hover:text-[#0d5f44]"
            >
              <Home size={14} className="text-[#0d5f44]" />
              HopeBridge Foundation
            </Link>
            <span className="text-[#c2cbc6]">/</span>
            <strong>Mission & Vision</strong>
          </nav>

          <section className="mv2-hero" aria-label="Mission and Vision hero">
            <div className="mv2-hero-image-wrap">
              <Image
                src="/hopebridge/mission/hero-golden-path-cinematic.png"
                alt=""
                fill
                priority
                sizes="(max-width: 1500px) 100vw, 1500px"
              />
            </div>
            <div className="mv2-hero-overlay" aria-hidden="true" />
            <div className="mv2-hero-rays" aria-hidden="true" />
            <div className="mv2-hero-glow" aria-hidden="true" />
            <div className="mv2-hero-particles" aria-hidden="true" />

            <div className="mv2-hero-content">
              <div className="max-w-2xl">
                <div className="mv2-pill">
                  <Sparkles size={13} strokeWidth={2} />
                  STRATEGIC FOUNDATION
                </div>

                <h1 className="mv2-title">
                  <span className="mv2-title-white">Mission &</span>
                  <span className="mv2-title-gold">Vision</span>
                </h1>

                <p className="mv2-tagline">
                  Our purpose. Our future. Our promise.
                </p>

                <p className="mv2-hero-desc">
                  Define why HopeBridge exists, what future it is working toward,
                  and the strategic priorities that guide every program, campaign,
                  partnership, and investment.
                </p>
              </div>

              {canManage && (
                <button
                  type="button"
                  onClick={openMissionEditor}
                  disabled={loading || !bundle?.missionVision}
                  className="mv2-gold-btn disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Pencil size={17} />
                  Update Mission & Vision
                </button>
              )}
            </div>
          </section>

          {loadError && (
            <div className="mv2-empty-banner">{loadError}</div>
          )}

          {loading ? (
            <div className="mv2-empty-banner">Loading organizational strategy…</div>
          ) : (
            <>
              <section
                className="mv2-feature-grid"
                aria-label="Mission and Vision statements"
              >
                <article className="mv2-feature-card mv2-feature-card-mission group">
                  <div className="mv2-card-shine" aria-hidden="true" />
                  <div className="mv2-medallion mv2-medallion-gold">
                    <Flag size={30} strokeWidth={1.6} />
                  </div>
                  <p className="mv2-label-gold">OUR MISSION</p>
                  <h2 className="mv2-feature-heading">
                    {missionVision?.missionStatement ||
                      "No mission statement defined yet."}
                  </h2>
                  <p className="mv2-feature-body">
                    {missionVision?.missionDescription ||
                      "Use Update Mission & Vision to define your organization’s purpose."}
                  </p>
                </article>

                <article className="mv2-feature-card mv2-feature-card-vision group">
                  <div className="mv2-card-shine" aria-hidden="true" />
                  <div className="mv2-medallion mv2-medallion-emerald">
                    <Eye size={30} strokeWidth={1.6} />
                  </div>
                  <p className="mv2-label-emerald">OUR VISION</p>
                  <h2 className="mv2-feature-heading">
                    {missionVision?.visionStatement ||
                      "No vision statement defined yet."}
                  </h2>
                  <p className="mv2-feature-body">
                    {missionVision?.visionDescription ||
                      "Use Update Mission & Vision to define your organization’s future direction."}
                  </p>
                </article>
              </section>

              <section className="mv2-section" aria-label="Core values">
                <div className="mv2-goals-header">
                  <div>
                    <div className="mv2-section-head">
                      <span className="mv2-diamond" aria-hidden="true" />
                      <p className="mv2-section-kicker">CORE VALUES</p>
                    </div>
                    <h2 className="mv2-section-title">Core Values</h2>
                  </div>
                  {canManage && coreValues.length > 0 && (
                    <button
                      type="button"
                      onClick={openCreateValue}
                      className="mv2-add-btn"
                    >
                      <Plus size={17} />
                      Add Value
                    </button>
                  )}
                </div>

                {isValueFormOpen && canManage && (
                  <div className="mv2-form-surface">
                    <h3 className="mv-serif text-xl font-semibold text-[#18392e]">
                      {editingValueId ? "Edit Core Value" : "Add Core Value"}
                    </h3>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <input
                        type="text"
                        value={valueForm.name}
                        onChange={(event) =>
                          setValueForm((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                        placeholder="Value name"
                        className="mv-input w-full rounded-xl px-4 py-3 text-sm outline-none"
                      />
                      <select
                        value={valueForm.iconKey}
                        onChange={(event) =>
                          setValueForm((current) => ({
                            ...current,
                            iconKey: event.target.value as CoreValueInput["iconKey"],
                          }))
                        }
                        className="mv-input w-full rounded-xl px-4 py-3 text-sm outline-none"
                      >
                        {CORE_VALUE_ICON_OPTIONS.map((option) => (
                          <option key={option.key} value={option.key}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <textarea
                        value={valueForm.description}
                        onChange={(event) =>
                          setValueForm((current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                        placeholder="Value description"
                        rows={4}
                        className="mv-input w-full resize-none rounded-xl px-4 py-3 text-sm outline-none md:col-span-2"
                      />
                      <select
                        value={valueForm.accent}
                        onChange={(event) =>
                          setValueForm((current) => ({
                            ...current,
                            accent: event.target.value as CoreValueInput["accent"],
                          }))
                        }
                        className="mv-input w-full rounded-xl px-4 py-3 text-sm outline-none"
                      >
                        {CORE_VALUE_ACCENT_OPTIONS.map((option) => (
                          <option key={option.key} value={option.key}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={valueForm.displayOrder}
                        onChange={(event) =>
                          setValueForm((current) => ({
                            ...current,
                            displayOrder: Number(event.target.value) || 0,
                          }))
                        }
                        placeholder="Display order"
                        className="mv-input w-full rounded-xl px-4 py-3 text-sm outline-none"
                      />
                    </div>
                    <div className="mt-5 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIsValueFormOpen(false);
                          setEditingValueId(null);
                        }}
                        className="mv-secondary-btn rounded-xl px-5 py-2.5 text-sm font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void handleSaveValue()}
                        className="mv-gold-btn rounded-xl px-5 py-2.5 text-sm font-bold"
                      >
                        Save Value
                      </button>
                    </div>
                  </div>
                )}

                {coreValues.length === 0 ? (
                  <div className="mv2-values-empty">
                    <div className="mv2-values-empty-icon" aria-hidden="true">
                      <Sparkles size={22} strokeWidth={1.6} />
                    </div>
                    <h3 className="mv2-values-empty-title">
                      Define your foundation&apos;s core values
                    </h3>
                    <p className="mv2-values-empty-desc">
                      Add the principles that guide your organization&apos;s
                      decisions, culture, and community work.
                    </p>
                    {canManage && (
                      <button
                        type="button"
                        onClick={openCreateValue}
                        className="mv2-values-empty-btn"
                      >
                        <Plus size={17} />
                        Add Core Value
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="mv2-values-grid">
                    {coreValues.map((value) => {
                      const Icon = CORE_VALUE_ICON_MAP[value.iconKey] ?? Target;
                      return (
                        <article key={value.id} className="mv2-value-card group">
                          <div className="mv2-card-shine" aria-hidden="true" />
                          <div className={getValueMedallionClass(value.accent)}>
                            <Icon size={26} strokeWidth={1.7} />
                          </div>
                          <h3 className="mv2-value-title">{value.name}</h3>
                          <p className="mv2-value-desc">{value.description}</p>
                          {canManage && (
                            <div className="mv2-value-actions">
                              <button
                                type="button"
                                onClick={() => openEditValue(value)}
                                className="mv2-value-action-btn"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeleteValue(value)}
                                className="mv2-value-action-btn mv2-value-action-delete"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="mv2-goals-panel" aria-label="Strategic goals">
                <div className="mv2-goals-header">
                  <div>
                    <div className="mv2-section-head">
                      <span className="mv2-diamond" aria-hidden="true" />
                      <p className="mv2-section-kicker">STRATEGIC GOALS</p>
                    </div>
                    <h2 className="mv2-section-title">Strategic Goals</h2>
                    <p className="mv2-section-sub">
                      Execution priorities that guide our work forward.
                    </p>
                  </div>

                  {canManage && (
                    <button
                      type="button"
                      onClick={openCreateGoal}
                      className="mv2-add-btn"
                    >
                      <Plus size={17} />
                      Add Strategic Goal
                    </button>
                  )}
                </div>

                {isGoalFormOpen && canManage && renderGoalForm()}

                <div className="mt-4">
                  {strategicGoals.length === 0 ? (
                    <p className="mv2-empty-copy">
                      No strategic goals yet. Add a goal to connect your mission
                      with measurable organizational priorities.
                    </p>
                  ) : (
                    strategicGoals.map((goal) => {
                      const progress = resolveGoalProgressPercent(goal);
                      return (
                        <article key={goal.id} className="mv2-goal-row group">
                          <div className="mv2-goal-top">
                            <div>
                              <h3 className="mv2-goal-title">{goal.title}</h3>
                              <p className="mv2-goal-desc">{goal.description}</p>
                              <GoalContext
                                goal={goal}
                                programs={bundle?.programs ?? []}
                                campaigns={bundle?.campaigns ?? []}
                              />
                            </div>

                            <div className="mv2-goal-meta">
                              {progress != null && (
                                <span className="mv2-goal-pct">{progress}%</span>
                              )}
                              <span className={getGoalStatusClassName(goal.status)}>
                                {goal.status}
                              </span>

                              {canManage && (
                                <div
                                  className="relative"
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setOpenGoalMenu(
                                        openGoalMenu === goal.id ? null : goal.id,
                                      );
                                    }}
                                    className="mv2-menu-btn"
                                    aria-label={`Open actions for ${goal.title}`}
                                  >
                                    <MoreVertical size={18} />
                                  </button>

                                  {openGoalMenu === goal.id && (
                                    <div className="mv2-dropdown">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setViewingGoalId(goal.id);
                                          setOpenGoalMenu(null);
                                        }}
                                      >
                                        View Details
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => openEditGoal(goal)}
                                      >
                                        Edit Goal
                                      </button>
                                      <button
                                        type="button"
                                        className="mv2-dropdown-delete"
                                        onClick={() => void handleDeleteGoal(goal)}
                                      >
                                        Delete Goal
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {progress != null && (
                            <div className="mv2-progress-track">
                              <div
                                className="mv2-progress-fill"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          )}
                        </article>
                      );
                    })
                  )}
                </div>

                <div className="mv2-impact-strip">
                  <div className="mv2-impact-item">
                    <span className="mv2-impact-icon">
                      <Target size={16} />
                    </span>
                    <span className="mv2-impact-label">Active Goals</span>
                    <strong className="mv2-impact-value">{summary.activeGoals}</strong>
                  </div>
                  <div className="mv2-impact-item">
                    <span className="mv2-impact-icon">
                      <TrendingUp size={16} />
                    </span>
                    <span className="mv2-impact-label">Avg Completion</span>
                    <strong className="mv2-impact-value">
                      {summary.averageCompletion}%
                    </strong>
                  </div>
                  <div className="mv2-impact-item">
                    <span className="mv2-impact-icon">
                      <CheckCircle2 size={16} />
                    </span>
                    <span className="mv2-impact-label">On Track</span>
                    <strong className="mv2-impact-value">{summary.onTrack}</strong>
                  </div>
                  <div className="mv2-impact-item">
                    <span className="mv2-impact-icon">
                      <Compass size={16} />
                    </span>
                    <span className="mv2-impact-label">Needs Focus / At Risk</span>
                    <strong className="mv2-impact-value">
                      {summary.needsFocusOrAtRisk}
                    </strong>
                  </div>
                </div>
              </section>

              <section className="mv2-alignment" aria-label="Strategic alignment">
                <div className="mv2-section-head">
                  <span className="mv2-diamond" aria-hidden="true" />
                  <p className="mv2-section-kicker">STRATEGIC ALIGNMENT</p>
                </div>
                <h2 className="mv2-section-title">How Our Foundation Connects</h2>
                <p className="mv2-section-sub">
                  See how mission, vision, values, and goals work together — derived
                  entirely from your current organizational foundation data.
                </p>

                <div className="mv2-alignment-flow">
                  <div className="mv2-alignment-step">
                    <p className="mv2-alignment-label">Mission</p>
                    <p className="mv2-alignment-text">
                      {missionVision?.missionStatement ||
                        "No mission statement defined yet."}
                    </p>
                  </div>

                  <div className="mv2-alignment-step">
                    <p className="mv2-alignment-label">Vision</p>
                    <p className="mv2-alignment-text">
                      {missionVision?.visionStatement ||
                        "No vision statement defined yet."}
                    </p>
                  </div>

                  <div className="mv2-alignment-step">
                    <p className="mv2-alignment-label">Core Values</p>
                    {coreValues.length === 0 ? (
                      <p className="mv2-alignment-text text-sm font-normal text-[#5f7268]">
                        No core values have been defined yet.
                      </p>
                    ) : (
                      <div className="mv2-alignment-pills">
                        {coreValues.map((value) => (
                          <span key={value.id} className="mv2-alignment-pill">
                            {value.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mv2-alignment-step">
                    <p className="mv2-alignment-label">Strategic Goals</p>
                    {strategicGoals.length === 0 ? (
                      <p className="mv2-alignment-text text-sm font-normal text-[#5f7268]">
                        No strategic goals defined yet. Add goals to connect daily
                        execution to your mission.
                      </p>
                    ) : (
                      <div className="mv2-alignment-goals">
                        {strategicGoals.map((goal) => {
                          const progress = resolveGoalProgressPercent(goal);
                          return (
                            <div key={goal.id} className="mv2-alignment-goal">
                              <span>{goal.title}</span>
                              <span>
                                {progress != null ? `${progress}% · ` : ""}
                                {goal.status}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="mv2-alignment-step">
                    <p className="mv2-alignment-label">Outcomes / Impact Connections</p>
                    {strategicGoals.some(
                      (goal) =>
                        goal.linkedProgramIds.length > 0 ||
                        goal.linkedCampaignIds.length > 0,
                    ) ? (
                      <div className="mv2-alignment-goals">
                        {strategicGoals.flatMap((goal) => {
                          const programs = resolveLinkedNames(
                            goal.linkedProgramIds,
                            bundle?.programs ?? [],
                          );
                          const campaigns = resolveLinkedNames(
                            goal.linkedCampaignIds,
                            bundle?.campaigns ?? [],
                          );
                          if (programs.length === 0 && campaigns.length === 0) {
                            return [];
                          }
                          return (
                            <div key={goal.id} className="mv2-alignment-goal">
                              <span>{goal.title}</span>
                              <span>
                                {programs.length > 0
                                  ? `${programs.length} program${programs.length === 1 ? "" : "s"}`
                                  : ""}
                                {programs.length > 0 && campaigns.length > 0
                                  ? " · "
                                  : ""}
                                {campaigns.length > 0
                                  ? `${campaigns.length} campaign${campaigns.length === 1 ? "" : "s"}`
                                  : ""}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="mv2-alignment-text text-sm font-normal text-[#5f7268]">
                        No programs or campaigns linked yet.
                      </p>
                    )}
                  </div>
                </div>
              </section>
            </>
          )}
        </div>

        {viewingGoal && (
          <div className="mv-overlay fixed inset-0 z-[100] flex items-center justify-center px-4 backdrop-blur-sm">
            <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[22px] border border-[#e4dac6] bg-white p-6 shadow-[0_24px_60px_rgba(34,53,45,.16)] sm:p-8">
              <button
                type="button"
                onClick={() => setViewingGoalId(null)}
                className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-xl border border-[#e4dac6] bg-[#fffdfa] text-[#65766e]"
                aria-label="Close details"
              >
                <X size={19} />
              </button>
              <p className="text-[10px] font-extrabold tracking-[1.3px] text-[#08734f]">
                STRATEGIC GOAL
              </p>
              <h3 className="mv-serif mt-2 pr-12 text-2xl font-bold text-[#18392e]">
                {viewingGoal.title}
              </h3>
              <p className="mt-3 text-[15px] leading-7 text-[#607269]">
                {viewingGoal.description}
              </p>
              <GoalContext
                goal={viewingGoal}
                programs={bundle?.programs ?? []}
                campaigns={bundle?.campaigns ?? []}
              />
            </div>
          </div>
        )}

        {isEditingMission && canManage && (
          <div className="mv-overlay fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[22px] border border-[#e4dac6] bg-white p-6 shadow-[0_24px_60px_rgba(34,53,45,.16)] sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-extrabold tracking-[1.3px] text-[#9f7b24]">
                    STRATEGIC FOUNDATION
                  </p>
                  <h2 className="mv-serif mt-2 text-2xl font-bold text-[#18392e]">
                    Update Mission & Vision
                  </h2>
                  <p className="mt-2 text-sm text-[#607269]">
                    Edit the organization&apos;s mission and vision information.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeMissionEditor}
                  disabled={saving}
                  className="rounded-xl border border-[#e4dac6] bg-[#fffdfa] p-2 text-[#65766e]"
                  aria-label="Close mission and vision editor"
                >
                  <X size={19} />
                </button>
              </div>

              {missionSaveError && (
                <p className="mt-5 rounded-xl border border-[#fecdd3] bg-[#fff1f2] px-4 py-3 text-sm text-[#be123c]">
                  {missionSaveError}
                </p>
              )}

              <div className="mt-8 space-y-7">
                <section className="rounded-2xl border border-[#efd786]/55 bg-[#fffaf0] p-5">
                  <h3 className="font-semibold text-[#9e7b24]">Mission</h3>
                  <label className="mt-5 block text-sm text-[#334b41]">
                    Mission statement
                  </label>
                  <input
                    type="text"
                    value={missionForm.missionStatement}
                    onChange={(event) =>
                      setMissionForm((current) => ({
                        ...current,
                        missionStatement: event.target.value,
                      }))
                    }
                    className="mv-input mt-2 w-full rounded-xl px-4 py-3 text-sm outline-none"
                  />
                  <label className="mt-5 block text-sm text-[#334b41]">
                    Supporting description (optional)
                  </label>
                  <textarea
                    value={missionForm.missionDescription}
                    onChange={(event) =>
                      setMissionForm((current) => ({
                        ...current,
                        missionDescription: event.target.value,
                      }))
                    }
                    rows={4}
                    className="mv-input mt-2 w-full resize-none rounded-xl px-4 py-3 text-sm outline-none"
                  />
                </section>

                <section className="rounded-2xl border border-[#c4e8d4] bg-[#f4fbf7] p-5">
                  <h3 className="font-semibold text-[#08734f]">Vision</h3>
                  <label className="mt-5 block text-sm text-[#334b41]">
                    Vision statement
                  </label>
                  <input
                    type="text"
                    value={missionForm.visionStatement}
                    onChange={(event) =>
                      setMissionForm((current) => ({
                        ...current,
                        visionStatement: event.target.value,
                      }))
                    }
                    className="mv-input mt-2 w-full rounded-xl px-4 py-3 text-sm outline-none"
                  />
                  <label className="mt-5 block text-sm text-[#334b41]">
                    Supporting description (optional)
                  </label>
                  <textarea
                    value={missionForm.visionDescription}
                    onChange={(event) =>
                      setMissionForm((current) => ({
                        ...current,
                        visionDescription: event.target.value,
                      }))
                    }
                    rows={4}
                    className="mv-input mt-2 w-full resize-none rounded-xl px-4 py-3 text-sm outline-none"
                  />
                </section>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeMissionEditor}
                  disabled={saving}
                  className="mv-secondary-btn rounded-xl px-5 py-3 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSaveMissionVision()}
                  className="mv-gold-btn inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={17} />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showSavedMessage && (
          <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-3 rounded-2xl border border-[#c4e8d4] bg-white px-5 py-4 text-sm font-medium text-[#18392e] shadow-[0_18px_40px_rgba(34,53,45,.13)]">
            <CheckCircle2 size={19} className="text-[#08734f]" />
            Changes saved successfully
          </div>
        )}
      </main>
    </div>
  );
}
