/**
 * Routing feature — OWNED BY TEAMMATE 1.
 *
 * Responsible for calling OpenRouteService (cycling + wheelchair profiles)
 * and returning Route objects. Everything here is stubbed with mock data
 * for now; replace the internals, keep the signatures.
 */
import type { LatLng, Route, UserPreferences } from "../../types";

/** Boston-ish mock geometry (Back Bay → Downtown), [lng, lat] order. */
const MOCK_COORDINATES: [number, number][] = [
  [-71.0817, 42.3503],
  [-71.0776, 42.3519],
  [-71.0705, 42.3535],
  [-71.0636, 42.3558],
  [-71.0589, 42.3601],
];

/**
 * Fetch candidate routes between two points for the given preferences.
 *
 * TODO: call OpenRouteService Directions API using VITE_ORS_API_KEY.
 * Map `prefs.mode` to the ORS profile (cycling-regular / wheelchair / foot-walking).
 */
export async function getRoutes(
  start: LatLng,
  end: LatLng,
  prefs: UserPreferences,
): Promise<Route[]> {
  const mockRoute: Route = {
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

  return [mockRoute];
}
