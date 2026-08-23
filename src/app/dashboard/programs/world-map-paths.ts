/** Simplified equirectangular world land paths — viewBox 1000 × 500 */

export const WORLD_MAP_VIEWBOX = { width: 1000, height: 500 };

/** Inactive land — warm neutral ivory */
export const WORLD_LAND_PATHS: { id: string; d: string }[] = [
  {
    id: "north-america",
    d: "M 58,52 L 118,38 L 188,42 L 258,58 L 308,82 L 328,118 L 318,152 L 288,178 L 248,192 L 198,186 L 158,168 L 118,142 L 82,112 L 58,82 Z M 198,186 L 218,198 L 228,218 L 212,232 L 188,224 Z",
  },
  {
    id: "greenland",
    d: "M 318,28 L 372,22 L 398,42 L 388,68 L 352,78 L 318,62 Z",
  },
  {
    id: "south-america",
    d: "M 228,228 L 272,218 L 302,242 L 318,282 L 312,332 L 288,378 L 248,398 L 212,372 L 202,318 L 208,262 Z",
  },
  {
    id: "europe",
    d: "M 458,78 L 512,68 L 552,82 L 568,108 L 552,132 L 512,138 L 472,128 L 452,102 Z",
  },
  {
    id: "africa",
    d: "M 472,142 L 532,136 L 578,162 L 598,212 L 588,272 L 562,328 L 518,358 L 482,338 L 462,278 L 458,212 L 468,162 Z",
  },
  {
    id: "middle-east",
    d: "M 552,142 L 598,136 L 622,162 L 612,198 L 578,208 L 552,182 Z",
  },
  {
    id: "asia",
    d: "M 598,58 L 698,48 L 798,62 L 872,98 L 898,142 L 882,188 L 828,208 L 768,198 L 698,172 L 638,148 L 602,118 L 588,88 Z",
  },
  {
    id: "india-subcontinent",
    d: "M 628,168 L 668,162 L 688,198 L 672,238 L 638,232 L 618,202 Z",
  },
  {
    id: "southeast-asia",
    d: "M 718,208 L 768,198 L 812,218 L 848,238 L 828,258 L 778,252 L 728,232 Z",
  },
  {
    id: "australia",
    d: "M 798,312 L 868,302 L 912,332 L 898,378 L 848,392 L 798,368 L 782,338 Z",
  },
  {
    id: "japan",
    d: "M 848,118 L 862,108 L 872,128 L 858,142 L 842,132 Z",
  },
  {
    id: "antarctica",
    d: "M 88,452 L 912,452 L 892,478 L 108,478 Z",
  },
];

/** Active HopeBridge operating regions — emerald tint overlays */
export const WORLD_ACTIVE_REGIONS: { id: string; d: string }[] = [
  {
    id: "region-namerica",
    d: "M 98,72 L 188,58 L 278,78 L 298,128 L 268,168 L 208,178 L 148,158 L 108,118 Z",
  },
  {
    id: "region-mexico",
    d: "M 188,188 L 218,198 L 228,222 L 208,232 L 182,218 Z",
  },
  {
    id: "region-brazil",
    d: "M 232,248 L 278,238 L 302,288 L 278,348 L 232,362 L 218,302 Z",
  },
  {
    id: "region-kenya",
    d: "M 528,218 L 568,212 L 582,248 L 562,272 L 528,262 Z",
  },
  {
    id: "region-india",
    d: "M 628,168 L 678,162 L 698,208 L 672,248 L 628,238 Z",
  },
  {
    id: "region-seasia",
    d: "M 768,208 L 812,198 L 832,228 L 808,252 L 772,242 Z",
  },
];

/** Subtle connection arcs between major program hubs (x1,y1,x2,y2) */
export const WORLD_CONNECTION_ARCS: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}[] = [
  { x1: 195, y1: 128, x2: 548, y2: 248 },
  { x1: 195, y1: 128, x2: 698, y2: 188 },
  { x1: 548, y1: 248, x2: 698, y2: 188 },
  { x1: 248, y1: 298, x2: 548, y2: 248 },
];

export function arcPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): string {
  const midX = (x1 + x2) / 2;
  const midY = Math.min(y1, y2) - 40 - Math.abs(x2 - x1) * 0.06;
  return `M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`;
}
