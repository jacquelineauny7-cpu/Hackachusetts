# Structure

## Folder layout & ownership

Each teammate owns one feature folder and works on their own branch.

```
src/
  types/            # SHARED CONTRACT — TypeScript types for everyone
  components/        # Shared UI: Layout, MapContainer, SearchPanel
  features/
    routing/         # Teammate 1: OpenRouteService calls, route display
    scoring/         # Teammate 2: safety score (bike lanes, crash, slope, obstacles)
    obstacles/       # Teammate 3: report + show obstacles (Supabase)
    preferences/     # User preference form + storage
  data/              # Static Boston datasets (GeoJSON), added later
  App.tsx            # Main page — wires shared UI to feature stubs
  main.tsx           # App entry
```

## The shared contract: `src/types/index.ts`

This is the agreement between all feature teams. Key types:

- `UserPreferences` — `mode`, `maxGradePercent`, `avoidSurfaces`, `protectedLanesOnly`
- `Route` — `id`, `geometry` (GeoJSON LineString), `distanceMeters`,
  `durationSeconds`, `elevationProfile`, `segments`
- `RouteScore` — `total` (0–100), `breakdown` (bikeLaneCoverage, crashRisk,
  slope, obstacles), `reasons[]`
- `Obstacle` — `id`, `lat`, `lng`, `type`, `description`, `photoUrl?`,
  `createdAt`, `expiresAt`

## Stub API surface (replace internals, keep signatures)

- `routing`: `getRoutes(start, end, prefs): Promise<Route[]>`
- `scoring`: `scoreRoute(route, prefs, obstacles?): RouteScore`
- `obstacles`: `getObstacles(bounds): Promise<Obstacle[]>`,
  `reportObstacle(obstacle): Promise<Obstacle>`
- `preferences`: `loadPreferences()`, `savePreferences(prefs)`

## Rules

- **Use the shared types in `src/types`.** Do not redefine `Route`,
  `RouteScore`, `Obstacle`, or `UserPreferences` inside a feature folder.
- **Stay in your own feature folder.** Don't edit another team's folder.
  Changes to `src/types` or `src/components` are shared — flag them to the team
  before merging.
- **Expose features through `index.ts`.** Import other features via their
  folder (`../scoring`), not deep internal files.
- **Never commit API keys.** Secrets go in `.env` (gitignored), placeholders in
  `.env.example`.
- **Mobile-first.** Every UI change must look and work right on a phone first.
- **Convert geometry at the map edge.** `Route.geometry` is GeoJSON `[lng, lat]`;
  only `MapContainer` converts to Leaflet `[lat, lng]`.
```
