"use client";

import { LayoutTemplate, X } from "lucide-react";

import { PROGRAM_TEMPLATES, ProgramTemplate } from "../data";

interface ProgramTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: ProgramTemplate) => void;
}

export default function ProgramTemplatesModal({
  isOpen,
  onClose,
  onSelect,
}: ProgramTemplatesModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="pn-modal-overlay fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="pn-modal w-full max-w-lg rounded-[22px] p-7">
        <div className="flex items-start justify-between">
          <div>
            <p className="pn-kicker">Program Portfolio</p>
            <h2 className="pn-section-title mt-1">Program Templates</h2>
            <p className="mt-1 text-sm text-[#607269]">
              Start a new program from a proven HopeBridge template.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close templates modal"
            className="rounded-xl border border-[#e4dac6] bg-[#fffdfa] p-2.5 text-[#65766e] hover:bg-[#f4fbf7]"
          >
            <X size={19} />
          </button>
        </div>

        <ul className="mt-6 space-y-3">
          {PROGRAM_TEMPLATES.map((template) => (
            <li key={template.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(template);
                  onClose();
                }}
                className="flex w-full items-start gap-3 rounded-2xl border border-[#ebe3d2] bg-[#fffdfa] p-4 text-left transition hover:border-[#d4af37] hover:bg-[#fffaf0]"
              >
                <div className="pn-icon-gold shrink-0">
                  <LayoutTemplate size={18} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-[#112e24]">{template.name}</p>
                  <p className="mt-1 text-xs text-[#607269]">
                    {template.category} · {template.location}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-[#607269]">
                    {template.description}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
