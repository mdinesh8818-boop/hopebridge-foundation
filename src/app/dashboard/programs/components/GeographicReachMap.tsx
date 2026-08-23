"use client";

import { useMemo } from "react";

import { GeographicLocation } from "../types";
import {
  arcPath,
  WORLD_ACTIVE_REGIONS,
  WORLD_CONNECTION_ARCS,
  WORLD_LAND_PATHS,
} from "../world-map-paths";

interface GeographicReachMapProps {
  locations: GeographicLocation[];
  hoveredId: string | null;
  onHover: (location: GeographicLocation | null) => void;
}

function aggregateByCountry(locations: GeographicLocation[]): GeographicLocation[] {
  const groups = new Map<string, GeographicLocation>();

  for (const location of locations) {
    const existing = groups.get(location.country);

    if (!existing) {
      groups.set(location.country, {
        ...location,
        id: `country-${location.country.replace(/\s+/g, "-").toLowerCase()}`,
        name: location.country,
      });
      continue;
    }

    groups.set(location.country, {
      ...existing,
      activePrograms: existing.activePrograms + location.activePrograms,
      beneficiaries: existing.beneficiaries + location.beneficiaries,
      x: (existing.x + location.x) / 2,
      y: (existing.y + location.y) / 2,
      impactLevel:
        existing.impactLevel === "High" || location.impactLevel === "High"
          ? "High"
          : existing.impactLevel === "Growing" || location.impactLevel === "Growing"
            ? "Growing"
            : existing.impactLevel,
    });
  }

  return Array.from(groups.values());
}

export default function GeographicReachMap({
  locations,
  hoveredId,
  onHover,
}: GeographicReachMapProps) {
  const countryMarkers = useMemo(() => aggregateByCountry(locations), [locations]);
  const hovered =
    countryMarkers.find((location) => location.id === hoveredId) ?? null;

  return (
    <div className="pn-impact-map-wrap">
      <svg
        viewBox="0 0 1000 500"
        className="pn-impact-map"
        aria-label="Geographic reach world map"
        role="img"
      >
        <defs>
          <linearGradient id="pnMapOcean" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#faf8f3" />
            <stop offset="100%" stopColor="#f0ebe2" />
          </linearGradient>
          <linearGradient id="pnMapLand" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ece6d8" />
            <stop offset="100%" stopColor="#e2dbd0" />
          </linearGradient>
          <linearGradient id="pnMapActive" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0d5f44" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#064e3b" stopOpacity="0.18" />
          </linearGradient>
          <filter id="pnMapNodeGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width="1000" height="500" fill="url(#pnMapOcean)" rx="12" />

        {[200, 400, 600, 800].map((x) => (
          <line
            key={`v-${x}`}
            x1={x}
            y1={8}
            x2={x}
            y2={492}
            stroke="#ddd5c8"
            strokeWidth="0.6"
            opacity="0.55"
          />
        ))}
        {[100, 200, 300, 400].map((y) => (
          <line
            key={`h-${y}`}
            x1={8}
            y1={y}
            x2={992}
            y2={y}
            stroke="#ddd5c8"
            strokeWidth="0.6"
            opacity="0.45"
          />
        ))}

        <g fill="url(#pnMapLand)" stroke="#cfc7b8" strokeWidth="0.8" strokeLinejoin="round">
          {WORLD_LAND_PATHS.map((land) => (
            <path key={land.id} d={land.d} />
          ))}
        </g>

        <g fill="url(#pnMapActive)" stroke="#0d5f44" strokeWidth="1" strokeOpacity="0.35">
          {WORLD_ACTIVE_REGIONS.map((region) => (
            <path key={region.id} d={region.d} />
          ))}
        </g>

        <g fill="none" stroke="#d4af37" strokeWidth="1" strokeOpacity="0.35">
          {WORLD_CONNECTION_ARCS.map((arc, index) => (
            <path
              key={`arc-${index}`}
              d={arcPath(arc.x1, arc.y1, arc.x2, arc.y2)}
              strokeDasharray="4 3"
            />
          ))}
        </g>

        {countryMarkers.map((location) => {
          const isHovered = hoveredId === location.id;

          return (
            <g
              key={location.id}
              onMouseEnter={() => onHover(location)}
              onMouseLeave={() => onHover(null)}
              className="cursor-pointer"
            >
              {isHovered && (
                <>
                  <circle
                    cx={location.x}
                    cy={location.y}
                    r={18}
                    fill="#d4af37"
                    fillOpacity="0.14"
                  />
                  <circle
                    cx={location.x}
                    cy={location.y}
                    r={10}
                    fill="#0d5f44"
                    fillOpacity="0.12"
                  />
                </>
              )}
              <circle
                cx={location.x}
                cy={location.y}
                r={isHovered ? 5.5 : 4.5}
                fill="#0d5f44"
                stroke="#d4af37"
                strokeWidth={isHovered ? 2.5 : 2}
                filter={isHovered ? "url(#pnMapNodeGlow)" : undefined}
              />
              <circle cx={location.x} cy={location.y} r={16} fill="transparent" />
            </g>
          );
        })}
      </svg>

      {hovered && (
        <div className="pn-impact-map-tooltip">
          <p className="font-semibold text-[#112e24]">{hovered.name}</p>
          <p className="mt-1 text-xs text-[#607269]">
            {hovered.activePrograms} Active Programs
          </p>
          <p className="text-xs text-[#607269]">
            {hovered.beneficiaries.toLocaleString()} Beneficiaries
          </p>
        </div>
      )}
    </div>
  );
}
