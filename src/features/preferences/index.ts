/**
 * Preferences feature — OWNED BY TEAMMATE (shared contract input).
 *
 * User preference form + storage. Persists to localStorage for now.
 */
import type { UserPreferences } from "../../types";

const STORAGE_KEY = "brp.preferences";

/** Sensible defaults for a first-time user (bike mode). */
export const DEFAULT_PREFERENCES: UserPreferences = {
  mode: "bike",
  maxGradePercent: 6,
  avoidSurfaces: ["cobblestone", "gravel"],
  protectedLanesOnly: false,
};

/** Load saved preferences, falling back to defaults. */
export function loadPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) } as UserPreferences;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

/** Persist preferences to local storage. */
export function savePreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore storage errors (private mode, quota, etc.)
  }
}
