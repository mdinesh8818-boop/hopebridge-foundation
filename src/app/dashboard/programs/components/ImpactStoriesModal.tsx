"use client";

import { X } from "lucide-react";

import { IMPACT_STORIES } from "../impact-data";
import { ImpactStory } from "../types";

interface ImpactStoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStory?: (story: ImpactStory) => void;
}

interface ImpactStoryDetailModalProps {
  story: ImpactStory | null;
  onClose: () => void;
}

export default function ImpactStoriesModal({
  isOpen,
  onClose,
  onSelectStory,
}: ImpactStoriesModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="pn-modal-overlay fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="pn-modal max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[22px] p-7">
        <div className="flex items-start justify-between">
          <div>
            <p className="pn-kicker">PROGRAM IMPACT INTELLIGENCE</p>
            <h2 className="pn-section-title mt-1">Impact Stories</h2>
            <p className="mt-1 text-sm text-[#607269]">
              Real community outcomes from HopeBridge Foundation programs.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close impact stories"
            className="rounded-xl border border-[#e4dac6] bg-[#fffdfa] p-2.5 text-[#65766e] hover:bg-[#f4fbf7]"
          >
            <X size={19} />
          </button>
        </div>

        <ul className="mt-6 space-y-4">
          {IMPACT_STORIES.length === 0 ? (
            <li className="text-sm text-[#607269]">
              No impact stories yet. Stories will appear as program outcomes are recorded.
            </li>
          ) : (
            IMPACT_STORIES.map((story: ImpactStory) => (
              <StoryCard
                key={story.id}
                story={story}
                expanded
                onClick={onSelectStory ? () => onSelectStory(story) : undefined}
              />
            ))
          )}
        </ul>
      </section>
    </div>
  );
}

export function ImpactStoryDetailModal({
  story,
  onClose,
}: ImpactStoryDetailModalProps) {
  if (!story) return null;

  const accentClass =
    story.accent === "gold"
      ? "pn-impact-story-gold"
      : story.accent === "sage"
        ? "pn-impact-story-sage"
        : "pn-impact-story-emerald";

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
            <p className="pn-kicker">IMPACT STORY</p>
            <h2 className="pn-section-title mt-1">{story.title}</h2>
            <p className="mt-1 text-sm font-medium text-[#0d5f44]">{story.category}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close story detail"
            className="rounded-xl border border-[#e4dac6] bg-[#fffdfa] p-2.5 text-[#65766e] hover:bg-[#f4fbf7]"
          >
            <X size={19} />
          </button>
        </div>

        <div className={`pn-impact-story-card mt-6 ${accentClass}`}>
          <div className="pn-impact-story-thumb text-xl" aria-hidden="true">
            {story.title.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base leading-7 text-[#334b41]">
              &ldquo;{story.description}&rdquo;
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function StoryCard({
  story,
  expanded = false,
  onClick,
}: {
  story: ImpactStory;
  expanded?: boolean;
  onClick?: () => void;
}) {
  const accentClass =
    story.accent === "gold"
      ? "pn-impact-story-gold"
      : story.accent === "sage"
        ? "pn-impact-story-sage"
        : "pn-impact-story-emerald";

  const className = `pn-impact-story-card ${accentClass}${onClick ? " pn-impact-story-interactive" : ""}`;

  const content = (
    <>
      <div className="pn-impact-story-thumb" aria-hidden="true">
        {story.title.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-[#112e24]">{story.title}</p>
        <p className="mt-0.5 text-xs font-medium text-[#0d5f44]">{story.category}</p>
        <p className={`mt-2 text-sm leading-6 text-[#607269] ${expanded ? "" : "line-clamp-2"}`}>
          &ldquo;{story.description}&rdquo;
        </p>
      </div>
    </>
  );

  if (onClick) {
    return (
      <li>
        <button type="button" onClick={onClick} className={`${className} w-full text-left`}>
          {content}
        </button>
      </li>
    );
  }

  return <li className={className}>{content}</li>;
}

export { StoryCard };
