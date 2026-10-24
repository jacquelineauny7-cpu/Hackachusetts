/**
 * Scoring feature — OWNED BY TEAMMATE 2.
 *
 * Computes a 0–100 safety score for a route from bike lane coverage,
 * crash data, slope, and reported obstacles. Stubbed for now.
 */
import type { Obstacle, Route, RouteScore, UserPreferences } from "../../types";

/**
 * Score a route for safety given the user's preferences and known obstacles.
 *
 * TODO: pull in Boston crash data + bike lane GeoJSON from src/data,
 * weight each factor, and produce real reasons.
 */
export function scoreRoute(
  route: Route,
  prefs: UserPreferences,
  obstacles: Obstacle[] = [],
): RouteScore {
  void route;
  void prefs;

  const breakdown = {
    bikeLaneCoverage: 72,
    crashRisk: 65,
    slope: 88,
    obstacles: obstacles.length > 0 ? 50 : 90,
  };

  const total = Math.round(
    (breakdown.bikeLaneCoverage +
      breakdown.crashRisk +
      breakdown.slope +
      breakdown.obstacles) /
      4,
  );

  const reasons = [
    "Mostly protected bike lanes along the route (mock).",
    "Moderate historical crash density near one intersection (mock).",
    "Gentle grades well within your slope preference (mock).",
    obstacles.length > 0
      ? `${obstacles.length} reported obstacle(s) near the route (mock).`
      : "No reported obstacles near the route (mock).",
  ];

  return { total, breakdown, reasons };
}
