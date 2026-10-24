/**
 * Main page — wires the shared UI to the feature stubs so the whole app
 * is visibly connected. Feature teams replace the stub internals, not this
 * wiring, unless the shared contract changes.
 */
import { useEffect, useState } from "react";
import MapContainer, { BOSTON_CENTER } from "./components/MapContainer";
import SearchPanel from "./components/SearchPanel";
import { getObstacles } from "./features/obstacles";
import { loadPreferences } from "./features/preferences";
import { getRoutes } from "./features/routing";
import { scoreRoute } from "./features/scoring";
import type { MapBounds, Obstacle, Route, RouteScore, UserPreferences } from "./types";

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
  const [route, setRoute] = useState<Route | null>(null);
  const [score, setScore] = useState<RouteScore | null>(null);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [loading, setLoading] = useState(false);

  // Load mock obstacles once so markers are visible on first render.
  useEffect(() => {
    getObstacles(BOSTON_BOUNDS).then(setObstacles);
  }, []);

  // Render a mock route on mount so everything is wired end-to-end.
  useEffect(() => {
    void planRoute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function planRoute() {
    setLoading(true);
    try {
      const routes = await getRoutes(
        { lat: 42.3503, lng: -71.0817 },
        { lat: 42.3555, lng: -71.0601 },
        prefs,
      );
      const best = routes[0] ?? null;
      setRoute(best);
      setScore(best ? scoreRoute(best, prefs, obstacles) : null);
    } finally {
      setLoading(false);
    }
  }

  function openPreferences() {
    // Placeholder: the preferences team will mount a real form/sheet here.
    alert("Preferences panel coming soon (owned by the preferences team).");
  }

  return (
    <div className="relative h-full w-full">
      <MapContainer center={BOSTON_CENTER} route={route} obstacles={obstacles} />

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
            distanceMeters={route?.distanceMeters ?? null}
            durationSeconds={route?.durationSeconds ?? null}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
