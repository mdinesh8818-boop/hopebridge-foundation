import type { ImpactPeriodId, ImpactSnapshot } from "./types";
import {
  getImpactSnapshotFromPrograms,
  IMPACT_PERIOD_OPTIONS,
} from "../../../services/impactAnalytics";
import type { Program } from "./types";

export { IMPACT_PERIOD_OPTIONS };

export const IMPACT_STORIES: import("./types").ImpactStory[] = [];

export function getImpactSnapshot(
  period: ImpactPeriodId,
  programs: Program[] = [],
): ImpactSnapshot {
  return getImpactSnapshotFromPrograms(programs, period);
}
