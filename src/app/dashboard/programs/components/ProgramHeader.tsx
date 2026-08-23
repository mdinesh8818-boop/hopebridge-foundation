"use client";

import { LayoutTemplate, Megaphone, Plus } from "lucide-react";

interface ProgramHeaderProps {
  onCreate: () => void;
  onTemplates: () => void;
}

export default function ProgramHeader({
  onCreate,
  onTemplates,
}: ProgramHeaderProps) {
  return (
    <section className="pn-hero" aria-label="Program Nexus hero">
      <div className="pn-hero-scene" aria-hidden="true" />
      <div className="pn-hero-earth-vignette" aria-hidden="true" />
      <div className="pn-hero-sunrise-core" aria-hidden="true" />
      <div className="pn-hero-sunrise-glow" aria-hidden="true" />
      <div className="pn-hero-light-rays" aria-hidden="true" />
      <div className="pn-hero-network-shimmer" aria-hidden="true" />
      <div className="pn-hero-readability" aria-hidden="true" />
      <div className="pn-hero-atmosphere" aria-hidden="true" />
      <div className="pn-hero-particles" aria-hidden="true" />
      <div className="pn-hero-edge-vignette" aria-hidden="true" />
      <div className="pn-hero-texture" aria-hidden="true" />

      <div className="pn-hero-content">
        <div className="pn-pill">
          <Megaphone size={13} strokeWidth={2} />
          HOPEBRIDGE PROGRAM PORTFOLIO
        </div>

        <h1 className="pn-title mt-3">
          <span className="pn-title-white">Program </span>
          <span className="pn-title-gold">Nexus</span>
        </h1>

        <p className="pn-hero-desc">
          Design, manage, monitor and optimize every HopeBridge Foundation
          program through one centralized intelligent workspace.
        </p>

        <div className="pn-hero-actions-row">
          <button type="button" onClick={onCreate} className="pn-gold-btn">
            <Plus size={18} />
            Create New Program
          </button>
          <button type="button" onClick={onTemplates} className="pn-secondary-btn">
            <LayoutTemplate size={17} />
            Program Templates
          </button>
        </div>
      </div>
    </section>
  );
}
