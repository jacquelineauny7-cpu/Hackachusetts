/**
 * Shared search panel — OWNED BY SHARED UI.
 *
 * Mobile-first floating panel with start/destination inputs, a preferences
 * button, and a route summary + safety score area. Purely presentational:
 * the page owns state and passes handlers in.
 */
import type { RouteScore } from "../types";

export interface SearchPanelProps {
  start: string;
  destination: string;
  onStartChange: (value: string) => void;
  onDestinationChange: (value: string) => void;
  onPlanRoute: () => void;
  onOpenPreferences: () => void;
  score?: RouteScore | null;
  distanceMeters?: number | null;
  durationSeconds?: number | null;
  loading?: boolean;
}

function formatDistance(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

function formatDuration(s: number): string {
  const mins = Math.round(s / 60);
  return mins >= 60 ? `${Math.floor(mins / 60)} h ${mins % 60} min` : `${mins} min`;
}

export default function SearchPanel({
  start,
  destination,
  onStartChange,
  onDestinationChange,
  onPlanRoute,
  onOpenPreferences,
  score = null,
  distanceMeters = null,
  durationSeconds = null,
  loading = false,
}: SearchPanelProps) {
  return (
    <div className="pointer-events-auto w-full rounded-2xl bg-white/95 p-4 shadow-lg backdrop-blur">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-base font-semibold text-teal-800">Boston Route Planner</h1>
        <button
          type="button"
          onClick={onOpenPreferences}
          className="rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700 active:bg-teal-100"
        >
          Preferences
        </button>
      </div>

      <div className="mt-3 space-y-2">
        <input
          value={start}
          onChange={(e) => onStartChange(e.target.value)}
          placeholder="Start"
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-teal-500"
        />
        <input
          value={destination}
          onChange={(e) => onDestinationChange(e.target.value)}
          placeholder="Destination"
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-teal-500"
        />
        <button
          type="button"
          onClick={onPlanRoute}
          disabled={loading}
          className="w-full rounded-xl bg-teal-600 px-3 py-2 text-sm font-semibold text-white active:bg-teal-700 disabled:opacity-60"
        >
          {loading ? "Planning…" : "Plan route"}
        </button>
      </div>

      {(score || distanceMeters != null) && (
        <div className="mt-3 rounded-xl bg-gray-50 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {distanceMeters != null && formatDistance(distanceMeters)}
              {durationSeconds != null && ` · ${formatDuration(durationSeconds)}`}
            </span>
            {score && (
              <span className="rounded-full bg-teal-600 px-2 py-0.5 text-sm font-bold text-white">
                {score.total}/100
              </span>
            )}
          </div>
          {score && (
            <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-gray-500">
              {score.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
