"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus, X } from "lucide-react";

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

import {
  generateProgramId,
  today,
} from "../utils";

interface CreateProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (program: Program) => void;
  prefill?: Partial<ProgramFormState> | null;
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

const initialForm: ProgramFormState = {
  name: "",
  category: PROGRAM_CATEGORIES[0],
  description: "",
  manager: "",
  beneficiaries: "",
  budget: "",
  spent: "0",
  progress: "0",
  startDate: today(),
  endDate: "",
  status: "Planning",
  priority: "Medium",
  location: "",
};

export default function CreateProgramModal({
  isOpen,
  onClose,
  onCreate,
  prefill = null,
}: CreateProgramModalProps) {
  const [form, setForm] =
    useState<ProgramFormState>(initialForm);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    if (prefill) {
      setForm({ ...initialForm, ...prefill });
    } else {
      setForm(initialForm);
    }

    setError("");
  }, [isOpen, prefill]);

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

  if (!isOpen) {
    return null;
  }

  function updateField(
    field: keyof ProgramFormState,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
  }

  function resetAndClose() {
    setForm(initialForm);
    setError("");
    onClose();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !form.name.trim() ||
      !form.manager.trim() ||
      !form.description.trim() ||
      !form.location.trim() ||
      !form.endDate
    ) {
      setError("Please complete all required fields.");
      return;
    }

    if (form.endDate < form.startDate) {
      setError("End date must be after the start date.");
      return;
    }

    const now = today();

    const newProgram: Program = {
      id: generateProgramId(),
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim(),
      manager: form.manager.trim(),
      beneficiaries: Math.max(
        Number(form.beneficiaries) || 0,
        0
      ),
      budget: Math.max(Number(form.budget) || 0, 0),
      spent: Math.max(Number(form.spent) || 0, 0),
      progress: Math.min(
        Math.max(Number(form.progress) || 0, 0),
        100
      ),
      startDate: form.startDate,
      endDate: form.endDate,
      status: form.status,
      priority: form.priority,
      location: form.location.trim(),
      createdAt: now,
      updatedAt: now,
    };

    onCreate(newProgram);
    setForm(initialForm);
    setError("");
    onClose();
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
          resetAndClose();
        }
      }}
    >
      <section className="pn-modal max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[22px]">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-[#f0eadf] bg-white px-7 py-6">
          <div>
            <p className="pn-kicker">Program Portfolio</p>
            <h2 className="pn-section-title mt-1">Create New Program</h2>
            <p className="mt-1 text-sm text-[#607269]">
              Add a new initiative to the HopeBridge portfolio.
            </p>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            aria-label="Close create program modal"
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
                placeholder="Example: Youth Skills Initiative"
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
                placeholder="Manager's full name"
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
                  <option
                    key={category}
                    value={category}
                  >
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
                placeholder="State, city, or region"
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
                  <option
                    key={status}
                    value={status}
                  >
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
                  <option
                    key={priority}
                    value={priority}
                  >
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
                placeholder="250000"
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
                placeholder="Number of people supported"
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
              placeholder="Describe the program objectives, activities, and expected impact..."
              className="pn-input mt-2 w-full resize-none px-4 py-4 text-sm"
            />
          </label>

          {error && (
            <p className="mt-5 rounded-xl border border-[#fecdd3] bg-[#fff0f4] px-4 py-3 text-sm text-[#be123c]">
              {error}
            </p>
          )}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#f0eadf] pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={resetAndClose}
              className="h-12 rounded-xl border border-[#e4dac6] bg-[#fffdfa] px-6 font-semibold text-[#334b41] hover:bg-[#f4fbf7]"
            >
              Cancel
            </button>

            <button type="submit" className="pn-gold-btn h-12 px-7">
              <Plus size={19} />
              Create Program
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}