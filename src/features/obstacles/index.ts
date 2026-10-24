/**
 * Obstacles feature — OWNED BY TEAMMATE 3.
 *
 * Reporting and showing user-reported obstacles, persisted in Supabase
 * (table `obstacles`, see supabase/schema.sql). Falls back to an in-memory
 * mock when Supabase env vars are not configured, so the app still runs.
 */
import type { MapBounds, Obstacle, ObstacleType } from "../../types";
import { getSupabase } from "./supabaseClient";

const TABLE = "obstacles";

/** Shape of a row as stored in Postgres (snake_case columns). */
interface ObstacleRow {
  id: string;
  lat: number;
  lng: number;
  type: ObstacleType;
  description: string;
  photo_url: string | null;
  created_at: string;
  expires_at: string;
}

/** Map a DB row to the shared Obstacle type (snake_case -> camelCase). */
function rowToObstacle(row: ObstacleRow): Obstacle {
  return {
    id: row.id,
    lat: row.lat,
    lng: row.lng,
    type: row.type,
    description: row.description,
    photoUrl: row.photo_url ?? undefined,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

/**
 * Get active (non-expired) obstacles within the given map bounds.
 */
export async function getObstacles(bounds: MapBounds): Promise<Obstacle[]> {
  const supabase = getSupabase();
  if (!supabase) {
    return getMockObstacles(bounds);
  }

  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .gte("lat", bounds.south)
    .lte("lat", bounds.north)
    .gte("lng", bounds.west)
    .lte("lng", bounds.east)
    .gt("expires_at", nowIso)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load obstacles: ${error.message}`);
  }

  return (data as ObstacleRow[]).map(rowToObstacle);
}

/**
 * Report a new obstacle. Accepts the obstacle without server-generated fields
 * (id, createdAt, expiresAt) and returns the stored row.
 */
export async function reportObstacle(
  obstacle: Omit<Obstacle, "id" | "createdAt" | "expiresAt">,
): Promise<Obstacle> {
  const supabase = getSupabase();
  if (!supabase) {
    return reportMockObstacle(obstacle);
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      lat: obstacle.lat,
      lng: obstacle.lng,
      type: obstacle.type,
      description: obstacle.description,
      photo_url: obstacle.photoUrl ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to report obstacle: ${error.message}`);
  }

  return rowToObstacle(data as ObstacleRow);
}

// ---------------------------------------------------------------------------
// Mock fallback (used only when Supabase is not configured)
// ---------------------------------------------------------------------------

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

function getMockObstacles(bounds: MapBounds): Obstacle[] {
  const now = Date.now();
  return MOCK_OBSTACLES.filter(
    (o) =>
      Date.parse(o.expiresAt) > now &&
      o.lat <= bounds.north &&
      o.lat >= bounds.south &&
      o.lng <= bounds.east &&
      o.lng >= bounds.west,
  );
}

function reportMockObstacle(
  obstacle: Omit<Obstacle, "id" | "createdAt" | "expiresAt">,
): Obstacle {
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
