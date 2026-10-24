# Boston Route Planner

A mobile-first web app that plans the best route across Boston for cyclists
and people with mobility needs. Users enter a start and destination plus
preferences (max slope, surfaces to avoid, protected bike lanes only,
wheelchair-accessible) and get the best route with a **safety score** and an
explanation. Users can also report obstacles (blocked bike lane, construction,
broken curb ramp) on the map.

> Status: **scaffolding only.** Features are stubbed with mock data so three
> teammates can build in parallel on separate branches.

## Stack

- **Vite + React + TypeScript**
- **react-leaflet** + OpenStreetMap tiles for the map
- **Tailwind CSS** for styling (mobile-first)
- **OpenRouteService** for routing (cycling + wheelchair profiles) — _stubbed_
- **Supabase** for obstacle reports — _stubbed_

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Create your local env file (never commit .env)
cp .env.example .env
#   Windows PowerShell: Copy-Item .env.example .env

# 3. Start the dev server
npm run dev
```

Then open the URL Vite prints (default http://localhost:5173). You should see a
full-screen Boston map with a floating search panel and a mock route drawn in.

### Environment variables

Set these in `.env` (see `.env.example`):

| Variable                  | Purpose                           |
| ------------------------- | --------------------------------- |
| `VITE_ORS_API_KEY`        | OpenRouteService routing API key  |
| `VITE_SUPABASE_URL`       | Supabase project URL              |
| `VITE_SUPABASE_ANON_KEY`  | Supabase anon/public key          |

## Project structure & ownership

Each teammate owns one feature folder and works on their own branch. The
**shared contract** lives in `src/types/index.ts` — coordinate there before
changing a shared type.

| Path                      | Owner            | Responsibility                                            |
| ------------------------- | ---------------- | --------------------------------------------------------- |
| `src/types/`              | shared           | TypeScript types — the contract between teammates         |
| `src/components/`         | shared UI        | Layout, `MapContainer`, `SearchPanel`                     |
| `src/features/routing/`   | Teammate 1       | OpenRouteService calls, route display                     |
| `src/features/scoring/`   | Teammate 2       | Safety score from bike lanes, crash data, slope, obstacles|
| `src/features/obstacles/` | Teammate 3       | Reporting and showing obstacles (Supabase)                |
| `src/features/preferences/` | shared/any     | User preference form and storage                          |
| `src/data/`               | shared           | Static Boston datasets (GeoJSON), added later             |

### Stub API (replace internals, keep signatures)

- `getRoutes(start, end, prefs): Promise<Route[]>` — `features/routing`
- `scoreRoute(route, prefs, obstacles?): RouteScore` — `features/scoring`
- `getObstacles(bounds): Promise<Obstacle[]>` — `features/obstacles`
- `reportObstacle(obstacle): Promise<Obstacle>` — `features/obstacles`
- `loadPreferences()` / `savePreferences(prefs)` — `features/preferences`

## Team rules

- **Use the shared types** in `src/types`. Don't redefine them locally.
- **Keep your work inside your own feature folder.** Shared changes go through
  `src/types` or `src/components` with a heads-up to the team.
- **Never commit API keys.** `.env` is gitignored; only `.env.example` is tracked.
- **Mobile-first.** Design and test for phone screens first.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — type-check and build for production
- `npm run preview` — preview the production build
- `npm run lint` — type-check only (`tsc --noEmit`)
