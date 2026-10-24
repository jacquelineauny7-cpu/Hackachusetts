/**
 * Shared TypeScript types — the contract between all feature teams.
 *
 * Do not redefine these inside feature folders. If a type needs to change,
 * discuss it with the team and change it here so everyone stays in sync.
 */

/** Travel mode the user is planning for. */
export type TravelMode = "bike" | "walk" | "wheelchair";

/** Obstacle categories a user can report on the map. */
export type ObstacleType =
  | "blocked_lane"
  | "construction"
  | "broken_ramp"
  | "surface_damage"
  | "other";

/**
 * User routing preferences. Owned by src/features/preferences,
 * consumed by routing and scoring.
 */
export interface UserPreferences {
  mode: TravelMode;
  /** Maximum acceptable grade/slope as a percent (e.g. 5 = 5%). */
  maxGradePercent: number;
  /** Surface types to avoid, e.g. ["cobblestone", "gravel"]. */
  avoidSurfaces: string[];
  /** When true, prefer/require protected bike lanes only. */
  protectedLanesOnly: boolean;
}

/** A single GeoJSON LineString geometry (lng, lat pairs). */
export interface LineStringGeometry {
  type: "LineString";
  /** Array of [longitude, latitude] (GeoJSON order) positions. */
  coordinates: [number, number][];
}

/** A contiguous portion of a route with uniform characteristics. */
export interface RouteSegment {
  id: string;
  distanceMeters: number;
  /** Optional human-readable name (street, path, etc.). */
  name?: string;
  /** Surface type for this segment, if known. */
  surface?: string;
  /** Whether this segment runs along a protected bike lane. */
  protectedLane?: boolean;
  /** Average grade/slope percent for this segment, if known. */
  gradePercent?: number;
}

/**
 * A computed route. Owned by src/features/routing.
 * Geometry is a GeoJSON LineString in [lng, lat] order.
 */
export interface Route {
  id: string;
  geometry: LineStringGeometry;
  distanceMeters: number;
  durationSeconds: number;
  /** Elevation samples (meters) along the route. */
  elevationProfile: number[];
  segments: RouteSegment[];
}

/** Breakdown of the safety score by contributing factor (each 0–100). */
export interface RouteScoreBreakdown {
  bikeLaneCoverage: number;
  crashRisk: number;
  slope: number;
  obstacles: number;
}

/**
 * Safety score for a route. Owned by src/features/scoring.
 * `total` is 0–100 (higher is safer).
 */
export interface RouteScore {
  total: number;
  breakdown: RouteScoreBreakdown;
  /** Human-readable explanations of why the route scored this way. */
  reasons: string[];
}

/**
 * A user-reported obstacle. Owned by src/features/obstacles.
 * Timestamps are ISO 8601 strings.
 */
export interface Obstacle {
  id: string;
  lat: number;
  lng: number;
  type: ObstacleType;
  description: string;
  photoUrl?: string;
  createdAt: string;
  expiresAt: string;
}

/** Geographic bounding box used to query obstacles in view. */
export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/** A start or destination point entered by the user. */
export interface LatLng {
  lat: number;
  lng: number;
}
