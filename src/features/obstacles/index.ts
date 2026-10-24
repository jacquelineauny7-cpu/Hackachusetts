/**
 * Obstacles feature — OWNED BY TEAMMATE 3.
 *
 * Reporting and showing user-reported obstacles. Persistence will use
 * Supabase (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Stubbed for now
 * with an in-memory list.
 */
import type { MapBounds, Obstacle } from "../../types";

/** In-memory mock store so the UI has something to render. */
const MOCK_OBSTACLES: Obstacle[] = [
  {
    id: "obs-1",
    lat: 42.3555,
    lng: -71.0689,
    type: "construction",
    description: "Lane closed for construction near Copley (mock).",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "obs-2",
    lat: 42.3538,
    lng: -71.0725,
    type: "broken_ramp",
    description: "Curb ramp damaged, hard for wheelchairs (mock).",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
  },
];

/**
 * Get obstacles within the given map bounds.
 *
 * TODO: query Supabase, filter by bounds and expiresAt > now.
 */
export async function getObstacles(bounds: MapBounds): Promise<Obstacle[]> {
  return MOCK_OBSTACLES.filter(
    (o) =>
      o.lat <= bounds.north &&
      o.lat >= bounds.south &&
      o.lng <= bounds.east &&
      o.lng >= bounds.west,
  );
}

/**
 * Report a new obstacle.
 *
 * TODO: insert into Supabase and return the stored row.
 * Accepts the obstacle without server-generated fields.
 */
export async function reportObstacle(
  obstacle: Omit<Obstacle, "id" | "createdAt" | "expiresAt">,
): Promise<Obstacle> {
  const now = new Date();
  const created: Obstacle = {
    ...obstacle,
    id: `obs-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString(),
  };
  MOCK_OBSTACLES.push(created);
  return created;
}
