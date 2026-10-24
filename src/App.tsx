/**
 * Main page — wires the shared UI to the feature stubs so the whole app
 * is visibly connected. Feature teams replace the stub internals, not this
 * wiring, unless the shared contract changes.
 */
import { useEffect, useState } from "react";
import MapContainer, { BOSTON_CENTER } from "./components/MapContainer";
import SearchPanel from "./components/SearchPanel";
import { getObstacles } from "./features/obstacles";
import ReportObstacleSheet from "./features/obstacles/ReportObstacleSheet";
import { loadPreferences } from "./features/preferences";
import { getRoutes } from "./features/routing";
import { scoreRoute } from "./features/scoring";
import type { LatLng, MapBounds, Obstacle, Route, RouteScore, UserPreferences } from "./types";

// Rough bounds around Boston for the mock obstacle query.
const BOSTON_BOUNDS: MapBounds = {
  north: 42.4,
  south: 42.32,
  east: -71.0,
  west: -71.12,
};

export default function App() {
  const [prefs] = useState<UserPreferences>(() => loadPreferences());
  const [start, setStart] = useState("Back Bay");
  const [destination, setDestination] = useState("Downtown Crossing");
  const [routes, setRoutes] = useState<Route[]>([]);
  const [score, setScore] = useState<RouteScore | null>(null);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [loading, setLoading] = useState(false);

  // Obstacle reporting state.
  const [reporting, setReporting] = useState(false);
  const [draftPin, setDraftPin] = useState<LatLng | null>(null);

  // The primary route is the first returned; scoring/summary use this one.
  const primaryRoute = routes[0] ?? null;

  // Load mock obstacles once so markers are visible on first render.
  useEffect(() => {
    getObstacles(BOSTON_BOUNDS).then(setObstacles);
  }, []);

  // Render a mock route on mount so everything is wired end-to-end.
  useEffect(() => {
    void planRoute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-score whenever the primary route or obstacles change, so the score
  // always reflects the latest obstacle data (which loads asynchronously).
  useEffect(() => {
    setScore(primaryRoute ? scoreRoute(primaryRoute, prefs, obstacles) : null);
  }, [primaryRoute, prefs, obstacles]);

  async function planRoute() {
    setLoading(true);
    try {
      const result = await getRoutes(
        { lat: 42.3503, lng: -71.0817 },
        { lat: 42.3555, lng: -71.0601 },
        prefs,
      );
      setRoutes(result);
    } catch (err) {
      console.error("[routing] failed to plan route:", err);
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  }

  function openPreferences() {
    // Placeholder: the preferences team will mount a real form/sheet here.
    alert("Preferences panel coming soon (owned by the preferences team).");
  }

  function startReporting() {
    setDraftPin(null);
    setReporting(true);
  }

  function handleMapClick(loc: LatLng) {
    // Only capture clicks while placing an obstacle report.
    if (reporting) setDraftPin(loc);
  }

  function handleReported(obstacle: Obstacle) {
    // Drop the new pin immediately so the user sees their report.
    setObstacles((prev) => [obstacle, ...prev]);
    setDraftPin(null);
    setReporting(false);
  }

  function closeReporting() {
    setReporting(false);
    setDraftPin(null);
  }

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={BOSTON_CENTER}
        routes={routes}
        obstacles={obstacles}
        onMapClick={handleMapClick}
        draftPin={draftPin}
      />

      {/* Mobile-first floating search panel pinned to the top. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1000] p-3">
        <div className="mx-auto max-w-md">
          <SearchPanel
            start={start}
            destination={destination}
            onStartChange={setStart}
            onDestinationChange={setDestination}
            onPlanRoute={planRoute}
            onOpenPreferences={openPreferences}
            score={score}
            distanceMeters={primaryRoute?.distanceMeters ?? null}
            durationSeconds={primaryRoute?.durationSeconds ?? null}
            loading={loading}
          />
        </div>
      </div>

      {/* Floating "Report obstacle" button (hidden while the sheet is open). */}
      {!reporting && (
        <button
          type="button"
          onClick={startReporting}
          className="pointer-events-auto absolute bottom-5 right-5 z-[1000] rounded-full bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-lg active:bg-teal-700"
        >
          + Report obstacle
        </button>
      )}

      {reporting && (
        <ReportObstacleSheet
          lat={draftPin?.lat ?? null}
          lng={draftPin?.lng ?? null}
          onClose={closeReporting}
          onReported={handleReported}
        />
      )}
    </div>
  );
}
