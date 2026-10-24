/**
 * Scoring feature — OWNED BY TEAMMATE 2.
 *
 * Computes a 0–100 safety score for a route (higher is safer) from:
 *  - historical crashes within 30 m of the route (Cambridge crash GeoJSON)
 *  - steepness (route segment grades vs. the user's max grade preference)
 *  - active reported obstacles near the route
 *  - bike-lane coverage (from segments, when available)
 *
 * and returns plain-English reasons explaining the score.
 */
import type { Obstacle, Route, RouteScore, UserPreferences } from "../../types";
import crashData from "../../data/cambridge-crashes.geojson";

/** Distance (meters) within which a crash is counted as "on the route". */
const CRASH_RADIUS_M = 30;
/** Distance (meters) within which an obstacle is counted as "on the route". */
const OBSTACLE_RADIUS_M = 50;

/** Relative weights of each factor in the total score (must sum to 1). */
const WEIGHTS = {
  crashRisk: 0.4,
  slope: 0.3,
  obstacles: 0.2,
  bikeLaneCoverage: 0.1,
};

// ---------------------------------------------------------------------------
// Crash data (loaded once at module init)
// ---------------------------------------------------------------------------

interface CrashFeature {
  geometry: { type: "Point"; coordinates: [number, number] };
  properties?: { cyclist?: boolean; pedestrian?: boolean; date?: string };
}

interface CrashCollection {
  features: CrashFeature[];
}

/** Precomputed crash points as [lng, lat]. */
const CRASH_POINTS: [number, number][] = (crashData as CrashCollection).features
  .filter((f) => f.geometry?.type === "Point" && Array.isArray(f.geometry.coordinates))
  .map((f) => f.geometry.coordinates);

// ---------------------------------------------------------------------------
// Geometry helpers (equirectangular meters projection around a reference lat)
// ---------------------------------------------------------------------------

const EARTH_R = 6371000;
const DEG = Math.PI / 180;

/** Project a [lng, lat] point to local meters (x east, y north) around refLat. */
function toMeters(
  lng: number,
  lat: number,
  refLat: number,
): { x: number; y: number } {
  const x = lng * DEG * EARTH_R * Math.cos(refLat * DEG);
  const y = lat * DEG * EARTH_R;
  return { x, y };
}

/** Squared distance (m²) from point P to segment AB, all in local meters. */
function pointSegDistSqM(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    const ex = px - ax;
    const ey = py - ay;
    return ex * ex + ey * ey;
  }
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  const ex = px - cx;
  const ey = py - cy;
  return ex * ex + ey * ey;
}

/** Minimum distance (m) from a [lng, lat] point to a route's polyline. */
function distanceToRouteM(
  point: [number, number],
  coords: [number, number][],
  refLat: number,
): number {
  if (coords.length === 0) return Infinity;
  const p = toMeters(point[0], point[1], refLat);
  if (coords.length === 1) {
    const a = toMeters(coords[0][0], coords[0][1], refLat);
    return Math.hypot(p.x - a.x, p.y - a.y);
  }
  let minSq = Infinity;
  for (let i = 0; i < coords.length - 1; i++) {
    const a = toMeters(coords[i][0], coords[i][1], refLat);
    const b = toMeters(coords[i + 1][0], coords[i + 1][1], refLat);
    const dSq = pointSegDistSqM(p.x, p.y, a.x, a.y, b.x, b.y);
    if (dSq < minSq) minSq = dSq;
  }
  return Math.sqrt(minSq);
}

/** Quick bounding box (with margin in degrees) to skip far-away points. */
function routeBBox(coords: [number, number][], marginDeg: number) {
  let minLng = Infinity,
    minLat = Infinity,
    maxLng = -Infinity,
    maxLat = -Infinity;
  for (const [lng, lat] of coords) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  return {
    minLng: minLng - marginDeg,
    maxLng: maxLng + marginDeg,
    minLat: minLat - marginDeg,
    maxLat: maxLat + marginDeg,
  };
}

// ---------------------------------------------------------------------------
// Factor scorers
// ---------------------------------------------------------------------------

/** Count crashes within CRASH_RADIUS_M of the route. */
function countNearbyCrashes(coords: [number, number][], refLat: number): number {
  if (coords.length === 0) return 0;
  // ~30 m ≈ 0.0004° latitude; use a generous margin for the prefilter.
  const bbox = routeBBox(coords, 0.001);
  let count = 0;
  for (const pt of CRASH_POINTS) {
    const [lng, lat] = pt;
    if (lng < bbox.minLng || lng > bbox.maxLng || lat < bbox.minLat || lat > bbox.maxLat) {
      continue;
    }
    if (distanceToRouteM(pt, coords, refLat) <= CRASH_RADIUS_M) count++;
  }
  return count;
}

/**
 * Crash score 0–100 from crash density (crashes per km). Fewer crashes per km
 * is safer. ~0/km → 100, ~4/km → ~20.
 */
function crashScore(crashCount: number, distanceMeters: number): number {
  const km = Math.max(distanceMeters / 1000, 0.1);
  const perKm = crashCount / km;
  const score = 100 - perKm * 20;
  return clamp(score);
}

/**
 * Slope score 0–100 from distance-weighted segment grades. Grades at or below
 * the user's max are gentle; grades above it are penalized progressively.
 */
function slopeScore(route: Route, prefs: UserPreferences): { score: number; maxGrade: number } {
  const segs = route.segments.filter((s) => s.gradePercent != null);
  if (segs.length === 0) return { score: 80, maxGrade: 0 };

  const maxGrade = segs.reduce((m, s) => Math.max(m, s.gradePercent ?? 0), 0);
  const totalDist = segs.reduce((sum, s) => sum + Math.max(s.distanceMeters, 0), 0) || 1;
  const limit = Math.max(prefs.maxGradePercent, 1);

  // Weighted penalty: each segment contributes based on how far its grade
  // exceeds the user's limit, scaled by its share of total distance.
  let penalty = 0;
  for (const s of segs) {
    const grade = s.gradePercent ?? 0;
    const over = Math.max(0, grade - limit);
    const share = Math.max(s.distanceMeters, 0) / totalDist;
    // 8 points per percent over the limit, fully weighted across the route.
    penalty += over * 8 * share;
  }
  return { score: clamp(100 - penalty), maxGrade };
}

/** Count active (non-expired) obstacles within OBSTACLE_RADIUS_M of the route. */
function countActiveObstacles(
  obstacles: Obstacle[],
  coords: [number, number][],
  refLat: number,
): number {
  if (coords.length === 0) return 0;
  const now = Date.now();
  let count = 0;
  for (const o of obstacles) {
    const expires = Date.parse(o.expiresAt);
    if (!Number.isNaN(expires) && expires <= now) continue; // expired
    if (distanceToRouteM([o.lng, o.lat], coords, refLat) <= OBSTACLE_RADIUS_M) count++;
  }
  return count;
}

/** Obstacle score 0–100. Each active obstacle on-route costs 25 points. */
function obstacleScore(activeCount: number): number {
  return clamp(100 - activeCount * 25);
}

/**
 * Bike-lane coverage 0–100 from the fraction of route distance on protected
 * lanes. Routing may not populate this yet; default to a neutral value.
 */
function bikeLaneScore(route: Route): { score: number; known: boolean; coverage: number } {
  const known = route.segments.some((s) => s.protectedLane != null);
  if (!known) return { score: 60, known: false, coverage: 0 };

  const total = route.segments.reduce((sum, s) => sum + Math.max(s.distanceMeters, 0), 0) || 1;
  const covered = route.segments
    .filter((s) => s.protectedLane)
    .reduce((sum, s) => sum + Math.max(s.distanceMeters, 0), 0);
  const coverage = covered / total;
  return { score: clamp(coverage * 100), known: true, coverage };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Clamp a number to the 0–100 range and round it. */
function clamp(n: number): number {
  return Math.round(Math.max(0, Math.min(100, n)));
}

/**
 * Score a route for safety given the user's preferences and known obstacles.
 */
export function scoreRoute(
  route: Route,
  prefs: UserPreferences,
  obstacles: Obstacle[] = [],
): RouteScore {
  const coords = route.geometry.coordinates;
  const refLat = coords.length ? coords[Math.floor(coords.length / 2)][1] : 42.3736;

  const crashCount = countNearbyCrashes(coords, refLat);
  const crashRisk = crashScore(crashCount, route.distanceMeters);

  const { score: slope, maxGrade } = slopeScore(route, prefs);

  const activeObstacles = countActiveObstacles(obstacles, coords, refLat);
  const obstaclesScoreVal = obstacleScore(activeObstacles);

  const bikeLane = bikeLaneScore(route);

  const breakdown = {
    bikeLaneCoverage: bikeLane.score,
    crashRisk,
    slope,
    obstacles: obstaclesScoreVal,
  };

  const total = clamp(
    breakdown.crashRisk * WEIGHTS.crashRisk +
      breakdown.slope * WEIGHTS.slope +
      breakdown.obstacles * WEIGHTS.obstacles +
      breakdown.bikeLaneCoverage * WEIGHTS.bikeLaneCoverage,
  );

  const reasons = buildReasons({
    crashCount,
    distanceMeters: route.distanceMeters,
    maxGrade,
    limit: prefs.maxGradePercent,
    activeObstacles,
    bikeLane,
  });

  return { total, breakdown, reasons };
}

function buildReasons(ctx: {
  crashCount: number;
  distanceMeters: number;
  maxGrade: number;
  limit: number;
  activeObstacles: number;
  bikeLane: { known: boolean; coverage: number };
}): string[] {
  const reasons: string[] = [];

  // Crashes
  if (ctx.crashCount === 0) {
    reasons.push("No recorded crashes within 30 m of this route.");
  } else {
    const km = Math.max(ctx.distanceMeters / 1000, 0.1);
    const perKm = (ctx.crashCount / km).toFixed(1);
    reasons.push(
      `${ctx.crashCount} recorded crash${ctx.crashCount === 1 ? "" : "es"} within 30 m of this route (~${perKm} per km).`,
    );
  }

  // Slope
  if (ctx.maxGrade <= ctx.limit) {
    reasons.push(
      `Grades stay within your limit (max ~${ctx.maxGrade.toFixed(0)}% vs. ${ctx.limit}% allowed).`,
    );
  } else {
    reasons.push(
      `Includes a steep stretch (~${ctx.maxGrade.toFixed(0)}%) above your ${ctx.limit}% limit.`,
    );
  }

  // Obstacles
  if (ctx.activeObstacles === 0) {
    reasons.push("No active obstacle reports near this route.");
  } else {
    reasons.push(
      `${ctx.activeObstacles} active obstacle report${ctx.activeObstacles === 1 ? "" : "s"} near this route.`,
    );
  }

  // Bike lanes
  if (!ctx.bikeLane.known) {
    reasons.push("Bike-lane coverage unknown for this route.");
  } else {
    const pct = Math.round(ctx.bikeLane.coverage * 100);
    reasons.push(`About ${pct}% of the route is on protected bike lanes.`);
  }

  return reasons;
}
