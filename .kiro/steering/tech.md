# Tech

## Stack

- **Build:** Vite
- **UI:** React 18 + TypeScript (strict mode)
- **Map:** react-leaflet 4 + Leaflet, OpenStreetMap raster tiles
- **Styling:** Tailwind CSS (mobile-first)
- **Routing API:** OpenRouteService (cycling + wheelchair profiles) — **stubbed**
- **Obstacle storage:** Supabase — **stubbed**

### Version pinning note

We're on **React 18** with **react-leaflet 4** on purpose. react-leaflet 5
requires React 19; don't bump react-leaflet without also moving React and
retesting the map.

## Commands

```bash
npm install        # install deps
npm run dev        # start dev server (http://localhost:5173)
npm run build      # type-check + production build
npm run preview    # preview the production build
npm run lint       # type-check only (tsc --noEmit)
```

## Environment variables

All client env vars must be prefixed `VITE_` to be exposed to the app. Defined
in `.env` (gitignored). See `.env.example` for the template.

- `VITE_ORS_API_KEY` — OpenRouteService API key
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon/public key

Access with `import.meta.env.VITE_*` (typed in `src/vite-env.d.ts`).

## Rules

- **Never commit API keys or secrets.** `.env` and `.env.*` are gitignored;
  only `.env.example` is tracked. Add new keys to `.env.example` with a
  placeholder value, never a real one.
- **Keep TypeScript strict.** No `any` to silence errors; fix the type.
- **Mobile-first.** Build layouts for phone screens first, then enhance up.
- **Stubs keep their signatures.** When replacing a stub with a real
  implementation, keep the exported function signature stable so the rest of
  the app keeps working. If a signature must change, update `src/types` and
  tell the team.
- **Leaflet gotchas:** the map container needs an explicit height (handled via
  `.leaflet-container` CSS), and default marker icons are fixed in
  `src/components/leafletSetup.ts` — import it once at app start.

## Conventions

- Feature logic lives behind a folder `index.ts` that exports the public API.
- Geometry uses GeoJSON `[lng, lat]` order in `Route`; convert to Leaflet's
  `[lat, lng]` only at the map boundary.
