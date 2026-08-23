"use client";

import { AlertTriangle, Trash2, X } from "lucide-react";

import { Program } from "../types";

interface DeleteProgramModalProps {
  isOpen: boolean;
  program: Program | null;
  onClose: () => void;
  onConfirm: (programId: string) => void;
}

export default function DeleteProgramModal({
  isOpen,
  program,
  onClose,
  onConfirm,
}: DeleteProgramModalProps) {
  if (!isOpen || !program) return null;

  function handleDelete() {
    if (!program) return;
    onConfirm(program.id);
    onClose();
  }

  return (
    <div
      className="pn-modal-overlay fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="pn-modal w-full max-w-lg rounded-[22px] border border-[#fecdd3] p-7">
        <div className="flex items-start justify-between">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#fecdd3] bg-[#fff1f2] text-[#be123c]">
            <AlertTriangle size={26} />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close delete confirmation"
            className="rounded-xl border border-[#e4dac6] bg-[#fffdfa] p-2.5 text-[#65766e] hover:bg-[#f4fbf7]"
          >
            <X size={19} />
          </button>
        </div>

        <h2 className="pn-section-title mt-5">Delete Program?</h2>

        <p className="mt-3 leading-7 text-[#607269]">
          You are about to permanently delete{" "}
          <span className="font-semibold text-[#112e24]">{program.name}</span>.
          This action cannot be undone.
        </p>

        <div className="mt-5 rounded-2xl border border-[#ebe3d2] bg-[#fffdfa] p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#929d97]">
            Program
          </p>
          <p className="mt-1 font-semibold text-[#112e24]">{program.name}</p>
          <p className="mt-1 text-sm text-[#607269]">
            {program.category} · {program.location}
          </p>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-xl border border-[#e4dac6] bg-[#fffdfa] px-6 font-semibold text-[#334b41] hover:bg-[#f4fbf7]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[#fecdd3] bg-[#be123c] px-6 font-bold text-white hover:bg-[#9f1239]"
          >
            <Trash2 size={18} />
            Delete Program
          </button>
        </div>
      </section>
    </div>
  );
}
