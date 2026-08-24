"use client";

import { FormEvent, useEffect, useState } from "react";
import { Pencil, X } from "lucide-react";

import {
  PROGRAM_CATEGORIES,
  PROGRAM_PRIORITIES,
  PROGRAM_STATUSES,
} from "../data";

import {
  Program,
  ProgramPriority,
  ProgramStatus,
} from "../types";

import { today } from "../utils";

interface EditProgramModalProps {
  isOpen: boolean;
  program: Program | null;
  onClose: () => void;
  onSave: (program: Program) => void | Promise<void>;
}

interface ProgramFormState {
  name: string;
  category: string;
  description: string;
  manager: string;
  beneficiaries: string;
  budget: string;
  spent: string;
  progress: string;
  startDate: string;
  endDate: string;
  status: ProgramStatus;
  priority: ProgramPriority;
  location: string;
}

function createFormState(program: Program): ProgramFormState {
  return {
    name: program.name,
    category: program.category,
    description: program.description,
    manager: program.manager,
    beneficiaries: String(program.beneficiaries),
    budget: String(program.budget),
    spent: String(program.spent),
    progress: String(program.progress),
    startDate: program.startDate,
    endDate: program.endDate,
    status: program.status,
    priority: program.priority,
    location: program.location,
  };
}

export default function EditProgramModal({
  isOpen,
  program,
  onClose,
  onSave,
}: EditProgramModalProps) {
  const [form, setForm] = useState<ProgramFormState | null>(
    program ? createFormState(program) : null,
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !program || !form) {
    return null;
  }

  function updateField(
    field: keyof ProgramFormState,
    value: string
  ) {
    setForm((current) =>
      current
        ? {
            ...current,
            [field]: value,
          }
        : current
    );

    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  
    const currentForm = form;
    const currentProgram = program;
  
    if (!currentForm || !currentProgram) {
      return;
    }
  
    if (
      !currentForm.name.trim() ||
      !currentForm.manager.trim() ||
      !currentForm.description.trim() ||
      !currentForm.location.trim() ||
      !currentForm.endDate
    ) {
      setError("Please complete all required fields.");
      return;
    }
  
    if (currentForm.endDate < currentForm.startDate) {
      setError("End date must be after the start date.");
      return;
    }
  
    const updatedProgram: Program = {
      ...currentProgram,
      name: currentForm.name.trim(),
      category: currentForm.category,
      description: currentForm.description.trim(),
      manager: currentForm.manager.trim(),
      beneficiaries: Math.max(
        Number(currentForm.beneficiaries) || 0,
        0
      ),
      budget: Math.max(Number(currentForm.budget) || 0, 0),
      spent: Math.max(Number(currentForm.spent) || 0, 0),
      progress: Math.min(
        Math.max(Number(currentForm.progress) || 0, 0),
        100
      ),
      startDate: currentForm.startDate,
      endDate: currentForm.endDate,
      status: currentForm.status,
      priority: currentForm.priority,
      location: currentForm.location.trim(),
      updatedAt: today(),
    };

    setSaving(true);
    try {
      await onSave(updatedProgram);
      onClose();
    } catch {
      // Parent surfaces the failure; keep the modal open.
    } finally {
      setSaving(false);
    }
  }

  const inputClassName =
    "pn-input mt-2 h-12 w-full px-4 text-sm";

  const labelClassName =
    "text-sm font-medium text-[#334b41]";

  return (
    <div
      className="pn-modal-overlay fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section className="pn-modal max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[22px]">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-[#f0eadf] bg-white px-7 py-6">
          <div>
            <p className="pn-kicker">Program Portfolio</p>
            <h2 className="pn-section-title mt-1">Edit Program</h2>
            <p className="mt-1 text-sm text-[#607269]">
              Update ownership, budget, schedule, and delivery information.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close edit program modal"
            className="rounded-xl border border-[#e4dac6] bg-[#fffdfa] p-2.5 text-[#65766e] hover:bg-[#f4fbf7]"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-7"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <label className={labelClassName}>
              Program name *
              <input
                value={form.name}
                onChange={(event) =>
                  updateField("name", event.target.value)
                }
                className={inputClassName}
              />
            </label>

            <label className={labelClassName}>
              Program manager *
              <input
                value={form.manager}
                onChange={(event) =>
                  updateField("manager", event.target.value)
                }
                className={inputClassName}
              />
            </label>

            <label className={labelClassName}>
              Category
              <select
                value={form.category}
                onChange={(event) =>
                  updateField("category", event.target.value)
                }
                className={inputClassName}
              >
                {PROGRAM_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className={labelClassName}>
              Location *
              <input
                value={form.location}
                onChange={(event) =>
                  updateField("location", event.target.value)
                }
                className={inputClassName}
              />
            </label>

            <label className={labelClassName}>
              Status
              <select
                value={form.status}
                onChange={(event) =>
                  updateField(
                    "status",
                    event.target.value as ProgramStatus
                  )
                }
                className={inputClassName}
              >
                {PROGRAM_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label className={labelClassName}>
              Priority
              <select
                value={form.priority}
                onChange={(event) =>
                  updateField(
                    "priority",
                    event.target.value as ProgramPriority
                  )
                }
                className={inputClassName}
              >
                {PROGRAM_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </label>

            <label className={labelClassName}>
              Start date
              <input
                type="date"
                value={form.startDate}
                onChange={(event) =>
                  updateField("startDate", event.target.value)
                }
                className={inputClassName}
              />
            </label>

            <label className={labelClassName}>
              End date *
              <input
                type="date"
                value={form.endDate}
                min={form.startDate}
                onChange={(event) =>
                  updateField("endDate", event.target.value)
                }
                className={inputClassName}
              />
            </label>

            <label className={labelClassName}>
              Total budget
              <input
                type="number"
                min="0"
                value={form.budget}
                onChange={(event) =>
                  updateField("budget", event.target.value)
                }
                className={inputClassName}
              />
            </label>

            <label className={labelClassName}>
              Amount spent
              <input
                type="number"
                min="0"
                value={form.spent}
                onChange={(event) =>
                  updateField("spent", event.target.value)
                }
                className={inputClassName}
              />
            </label>

            <label className={labelClassName}>
              Beneficiaries
              <input
                type="number"
                min="0"
                value={form.beneficiaries}
                onChange={(event) =>
                  updateField(
                    "beneficiaries",
                    event.target.value
                  )
                }
                className={inputClassName}
              />
            </label>

            <label className={labelClassName}>
              Progress: {form.progress}%
              <input
                type="range"
                min="0"
                max="100"
                value={form.progress}
                onChange={(event) =>
                  updateField("progress", event.target.value)
                }
                className="mt-5 w-full accent-[#d4af37]"
              />
            </label>
          </div>

          <label className={`${labelClassName} mt-6 block`}>
            Description *
            <textarea
              rows={5}
              value={form.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              className="pn-input mt-2 w-full resize-none px-4 py-4 text-sm"
            />
          </label>

          {error && (
            <p className="mt-5 rounded-xl border border-[#fecdd3] bg-[#fff1f2] px-4 py-3 text-sm text-[#be123c]">
              {error}
            </p>
          )}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#f0eadf] pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-12 rounded-xl border border-[#e4dac6] bg-[#fffdfa] px-6 font-semibold text-[#334b41] hover:bg-[#f4fbf7]"
            >
              Cancel
            </button>

            <button type="submit" disabled={saving} className="pn-gold-btn flex h-12 items-center justify-center gap-2 px-7">
              <Pencil size={18} />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}