/**
 * Routing feature — OWNED BY TEAMMATE 1.
 *
 * Calls the OpenRouteService Directions API and returns Route objects that
 * satisfy the shared contract in src/types.
 *
 * - bike  -> cycling-regular
 * - walk  -> foot-walking
 * - wheelchair -> wheelchair
 *
 * Requests 2 alternative routes with elevation and extra_info for steepness
 * and surface. Falls back to a mock route if VITE_ORS_API_KEY is not set, so
 * the app still runs for teammates without a key.
 */
import type { LatLng, Route, RouteSegment, TravelMode, UserPreferences } from "../../types";

const ORS_BASE = "https://api.openrouteservice.org/v2/directions";

/** Map our travel mode to an ORS routing profile. */
const PROFILE_BY_MODE: Record<TravelMode, string> = {
  bike: "cycling-regular",
  walk: "foot-walking",
  wheelchair: "wheelchair",
};

/**
 * ORS steepness IDs map to grade buckets. The sign indicates up/down; we use
 * the magnitude as a representative grade percent for scoring/display.
 * See ORS extra-info docs (steepness IDs).
 */
const STEEPNESS_GRADE_PERCENT: Record<number, number> = {
  0: 0,
  1: 2,
  2: 5,
  3: 9,
  4: 13,
  5: 20,
};

/** ORS surface IDs -> human-readable surface labels (common subset). */
const SURFACE_LABELS: Record<number, string> = {
  0: "unknown",
  1: "paved",
  2: "unpaved",
  3: "asphalt",
  4: "concrete",
  5: "cobblestone",
  6: "metal",
  7: "wood",
  8: "compacted gravel",
  9: "fine gravel",
  10: "gravel",
  11: "dirt",
  12: "ground",
  13: "ice",
  14: "paving stones",
  15: "sand",
  16: "woodchips",
  17: "grass",
  18: "grass paver",
};

/** Minimal shape of the ORS GeoJSON directions response we rely on. */
interface OrsExtraValues {
  /** [fromCoordIndex, toCoordIndex, value] triples. */
  values: [number, number, number][];
}

interface OrsFeatureProperties {
  summary?: { distance?: number; duration?: number };
  extras?: {
    steepness?: OrsExtraValues;
    surface?: OrsExtraValues;
  };
}

interface OrsFeature {
  geometry: { type: "LineString"; coordinates: number[][] };
  properties: OrsFeatureProperties;
}

interface OrsDirectionsResponse {
  features: OrsFeature[];
}

function apiKey(): string | undefined {
  const key = import.meta.env.VITE_ORS_API_KEY;
  return key && key.trim() ? key.trim() : undefined;
}

/**
 * Fetch candidate routes between two points for the given preferences.
 * Returns up to 2 routes (ORS alternatives).
 */
export async function getRoutes(
  start: LatLng,
  end: LatLng,
  prefs: UserPreferences,
): Promise<Route[]> {
  const key = apiKey();
  if (!key) {
    // No key configured — keep the app usable with a mock.
    console.warn("[routing] VITE_ORS_API_KEY not set; returning a mock route.");
    return [mockRoute(start, end, prefs)];
  }

  const profile = PROFILE_BY_MODE[prefs.mode];
  const body = {
    coordinates: [
      [start.lng, start.lat],
      [end.lng, end.lat],
    ],
    elevation: true,
    extra_info: ["steepness", "surface"],
    instructions: false,
    alternative_routes: {
      target_count: 2,
      share_factor: 0.6,
      weight_factor: 1.6,
    },
  };

  let res: Response;
  try {
    res = await fetch(`${ORS_BASE}/${profile}/geojson`, {
      method: "POST",
      headers: {
        Authorization: key,
        "Content-Type": "application/json",
        Accept: "application/geo+json",
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new Error(
      `OpenRouteService request failed (network): ${(err as Error).message}`,
    );
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `OpenRouteService returned ${res.status} ${res.statusText}. ${detail}`.trim(),
    );
  }

  const data = (await res.json()) as OrsDirectionsResponse;
  if (!data.features?.length) {
    throw new Error("OpenRouteService returned no routes for these points.");
  }

  return data.features.map((feature, i) => parseFeature(feature, i));
}

/** Convert one ORS GeoJSON feature into our shared Route type. */
function parseFeature(feature: OrsFeature, index: number): Route {
  const coords = feature.geometry.coordinates;

  // Geometry: keep [lng, lat]; strip the elevation (3rd) component.
  const coordinates: [number, number][] = coords.map(
    ([lng, lat]) => [lng, lat] as [number, number],
  );

  // Elevation profile: the 3rd component of each position, when present.
  const elevationProfile: number[] = coords.map((c) =>
    typeof c[2] === "number" ? c[2] : 0,
  );

  const summary = feature.properties.summary ?? {};
  const extras = feature.properties.extras ?? {};

  // Build segments by combining steepness and surface sections. We key off
  // the steepness sections and look up the surface at each section's start.
  const segments = buildSegments(coordinates, extras.steepness, extras.surface);

  return {
    id: `ors-route-${index + 1}`,
    geometry: { type: "LineString", coordinates },
    distanceMeters: Math.round(summary.distance ?? 0),
    durationSeconds: Math.round(summary.duration ?? 0),
    elevationProfile,
    segments,
  };
}

/** Haversine distance in meters between two [lng, lat] points. */
function haversineMeters(a: [number, number], b: [number, number]): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Sum the geometric length of coordinates between two indices. */
function distanceBetweenIndices(
  coordinates: [number, number][],
  fromIdx: number,
  toIdx: number,
): number {
  let total = 0;
  const end = Math.min(toIdx, coordinates.length - 1);
  for (let i = fromIdx; i < end; i++) {
    total += haversineMeters(coordinates[i], coordinates[i + 1]);
  }
  return total;
}

/** Find the surface value active at a given coordinate index. */
function surfaceAt(surface: OrsExtraValues | undefined, idx: number): number | undefined {
  if (!surface) return undefined;
  for (const [from, to, value] of surface.values) {
    if (idx >= from && idx < to) return value;
  }
  return undefined;
}

/**
 * Build route segments from the steepness extra_info sections, annotating
 * each with distance, surface label, and grade percent.
 */
function buildSegments(
  coordinates: [number, number][],
  steepness: OrsExtraValues | undefined,
  surface: OrsExtraValues | undefined,
): RouteSegment[] {
  // If steepness is missing, emit a single whole-route segment.
  const sections: [number, number, number][] = steepness?.values?.length
    ? steepness.values
    : [[0, Math.max(coordinates.length - 1, 0), 0]];

  return sections.map(([from, to, steepValue], i) => {
    const surfaceId = surfaceAt(surface, from);
    const gradePercent = STEEPNESS_GRADE_PERCENT[Math.abs(steepValue)] ?? 0;
    return {
      id: `seg-${i + 1}`,
      distanceMeters: Math.round(distanceBetweenIndices(coordinates, from, to)),
      surface: surfaceId != null ? SURFACE_LABELS[surfaceId] ?? "unknown" : undefined,
      // protectedLane is unknown from ORS alone; the scoring team fills this
      // in later from Boston bike-lane data. Leave undefined.
      gradePercent,
    };
  });
}

/** Boston-ish mock geometry used only when no API key is configured. */
const MOCK_COORDINATES: [number, number][] = [
  [-71.0817, 42.3503],
  [-71.0776, 42.3519],
  [-71.0705, 42.3535],
  [-71.0636, 42.3558],
  [-71.0589, 42.3601],
];

function mockRoute(start: LatLng, end: LatLng, prefs: UserPreferences): Route {
  return {
    id: "mock-route-1",
    geometry: {
      type: "LineString",
      coordinates: [
        [start.lng, start.lat],
        ...MOCK_COORDINATES,
        [end.lng, end.lat],
      ],
    },
    distanceMeters: 3200,
    durationSeconds: prefs.mode === "wheelchair" ? 2700 : 900,
    elevationProfile: [5, 6, 8, 7, 9, 6, 5],
    segments: [
      {
        id: "seg-1",
        distanceMeters: 1600,
        name: "Commonwealth Ave",
        surface: "asphalt",
        protectedLane: true,
        gradePercent: 1.5,
      },
      {
        id: "seg-2",
        distanceMeters: 1600,
        name: "Boylston St",
        surface: "asphalt",
        protectedLane: false,
        gradePercent: 2.0,
      },
    ],
  };
}
