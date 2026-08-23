"use client";

import { useState } from "react";

type RegionData = {
  region: string;
  count: number;
  programCount: number;
};

type CommunityReachMapProps = {
  regions: RegionData[];
  activeRegion: string;
  onSelectRegion: (region: string) => void;
};

const REGION_POSITIONS: Record<string, { cx: number; cy: number }> = {
  "Northern Virginia": { cx: 720, cy: 280 },
  "Central Appalachia": { cx: 680, cy: 320 },
  "Gulf Coast": { cx: 560, cy: 420 },
  "Pacific Northwest": { cx: 180, cy: 180 },
  "Midwest Urban": { cx: 520, cy: 260 },
  "Southwest Border": { cx: 340, cy: 400 },
};

export default function CommunityReachMap({
  regions,
  activeRegion,
  onSelectRegion,
}: CommunityReachMapProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const display = hovered ?? (activeRegion !== "All" ? activeRegion : null);
  const hoveredData = display ? regions.find((r) => r.region === display) : null;

  return (
    <div className="relative">
      <svg viewBox="0 0 820 520" className="h-auto w-full" aria-label="Community reach map">
        <defs>
          <linearGradient id="bfMapFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#011612" />
            <stop offset="100%" stopColor="#022c22" />
          </linearGradient>
        </defs>
        <rect width="820" height="520" rx="16" fill="url(#bfMapFill)" />
        <path
          d="M120 180 Q200 120 320 140 T520 160 T680 200 T760 260 T720 340 T580 400 T400 420 T220 380 T140 300 Z"
          fill="rgba(253,252,248,0.06)"
          stroke="rgba(234,216,177,0.18)"
          strokeWidth="1"
        />
        {regions.map(({ region, count }) => {
          const pos = REGION_POSITIONS[region];
          if (!pos) return null;
          const isActive = activeRegion === region || hovered === region;

          return (
            <g key={region}>
              <circle
                className="bf-map-point"
                cx={pos.cx}
                cy={pos.cy}
                r={isActive ? 8 : 5 + Math.min(count, 6)}
                fill={isActive ? "#f3e5ab" : "rgba(212,175,55,0.65)"}
                stroke="#d4af37"
                strokeWidth="1"
                onMouseEnter={() => setHovered(region)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelectRegion(activeRegion === region ? "All" : region)}
              />
              {isActive && (
                <circle
                  cx={pos.cx}
                  cy={pos.cy}
                  r="16"
                  fill="none"
                  stroke="rgba(243,229,171,0.35)"
                  strokeWidth="1"
                />
              )}
            </g>
          );
        })}
      </svg>

      {hoveredData && (
        <div className="absolute bottom-4 left-4 rounded-xl border border-[rgba(212,175,55,0.35)] bg-[rgba(1,22,18,0.92)] px-4 py-3 text-sm backdrop-blur-sm">
          <p className="font-semibold text-[#f3e5ab]">{hoveredData.region}</p>
          <p className="mt-1 text-[rgba(247,243,232,0.72)]">
            {hoveredData.count} beneficiar{hoveredData.count === 1 ? "y" : "ies"}
          </p>
          <p className="text-[rgba(247,243,232,0.52)]">
            {hoveredData.programCount} active program{hoveredData.programCount === 1 ? "" : "s"}
          </p>
        </div>
      )}
    </div>
  );
}
