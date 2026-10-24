# Product

## What we're building

A mobile-first web app that plans the best route across Boston for **cyclists**
and **people with mobility needs** (including wheelchair users).

Users enter:

- a **start** and **destination**
- **preferences**: max slope (grade %), surfaces to avoid, protected bike lanes
  only, and travel mode (bike / walk / wheelchair)

The app returns the **best route** with:

- a **safety score** (0–100)
- a plain-language **explanation** of why the route scored that way

Users can also **report obstacles** on the map — blocked bike lanes,
construction, broken curb ramps, surface damage, and other hazards — so routes
reflect real, current conditions.

## Who it's for

People navigating Boston on a bike or with limited mobility, on their phone,
often mid-trip. The experience must be fast, legible on a small screen, and
usable one-handed.

## Principles

- **Safety and accessibility first.** The score and explanation are the point;
  don't bury them.
- **Mobile-first, always.** Design and test on phone screens before desktop.
- **Honest routing.** Prefer real data (bike lanes, crash history, slope,
  reported obstacles) over guesses. While stubbed, make mock data obviously
  mock.
- **Community-powered.** Obstacle reports from users keep routes accurate.

## Current status

Scaffolding only. All data flows are stubbed with mock data so the team can
build features in parallel. Real OpenRouteService routing and Supabase-backed
obstacle reports come later.

## Feature spec

The full feature spec for Route Your Way (profiles, route goals, scoring
scales, incline and difficulty bands, data sources, wearable and stop features,
and V1 scope) lives in `docs/requirements.md`. Read it before building a feature.
Where it differs from this file, the spec is newer and wins. Values marked
`[Proposal]` in the spec are suggestions, not decisions.

#[[file:docs/requirements.md]]
