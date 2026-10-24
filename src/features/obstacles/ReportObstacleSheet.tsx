/**
 * Report page — OWNED BY TEAMMATE 3.
 *
 * Mobile-first bottom sheet for reporting an obstacle. The user picks a type,
 * writes a description, and submits. Location comes from a map tap (passed in
 * as `lat`/`lng`); if none is set yet, the sheet prompts the user to tap the map.
 */
import { useState } from "react";
import type { Obstacle, ObstacleType } from "../../types";
import { reportObstacle } from "./index";

const TYPE_OPTIONS: { value: ObstacleType; label: string }[] = [
  { value: "blocked_lane", label: "Blocked bike lane" },
  { value: "construction", label: "Construction" },
  { value: "broken_ramp", label: "Broken curb ramp" },
  { value: "surface_damage", label: "Surface damage" },
  { value: "other", label: "Other" },
];

export interface ReportObstacleSheetProps {
  /** Location the user tapped on the map, or null if not chosen yet. */
  lat: number | null;
  lng: number | null;
  onClose: () => void;
  /** Called with the saved obstacle so the page can drop a pin immediately. */
  onReported: (obstacle: Obstacle) => void;
}

export default function ReportObstacleSheet({
  lat,
  lng,
  onClose,
  onReported,
}: ReportObstacleSheetProps) {
  const [type, setType] = useState<ObstacleType>("blocked_lane");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasLocation = lat != null && lng != null;

  async function handleSubmit() {
    if (!hasLocation) return;
    setSubmitting(true);
    setError(null);
    try {
      const saved = await reportObstacle({
        lat: lat as number,
        lng: lng as number,
        type,
        description: description.trim(),
      });
      onReported(saved);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pointer-events-auto fixed inset-0 z-[1100] flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full max-w-md rounded-t-2xl bg-white p-4 shadow-2xl">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-300" />
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-teal-800">Report an obstacle</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-2 py-1 text-sm text-gray-500 active:bg-gray-100"
          >
            Cancel
          </button>
        </div>

        <p className="mt-1 text-xs text-gray-500">
          {hasLocation
            ? `At ${(lat as number).toFixed(5)}, ${(lng as number).toFixed(5)}`
            : "Tap the map to choose where the obstacle is."}
        </p>

        <label className="mt-3 block text-sm font-medium text-gray-700">Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as ObstacleType)}
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-teal-500"
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <label className="mt-3 block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="What's blocking the way?"
          className="mt-1 w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-teal-500"
        />

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!hasLocation || submitting}
          className="mt-4 w-full rounded-xl bg-teal-600 px-3 py-2 text-sm font-semibold text-white active:bg-teal-700 disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit report"}
        </button>
      </div>
    </div>
  );
}
