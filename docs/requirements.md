# Route Your Way: idea requirements

Status: draft for team review, 24 Oct 2026. This describes the **idea** (what
problem we solve, for whom, and what each feature must do). It is not a spec for
the code. The app scaffold in this repo will be updated to match once the team
confirms the first-version scope at the end of this document.

## 1. Problem

Map apps answer "how do I get there fastest?" For people walking or biking in
Boston that is often the wrong question. The fastest bike route can run along a
four-lane road with no bike lane, and the nicest walk (through a park, along the
water) is rarely the one suggested. People either accept a route that feels
unsafe or piece together a better one themselves from local knowledge.

Route Your Way lets the traveler say what they care about (speed, safety, or
enjoyment), shows the trade-off honestly, and warns them when the quickest
option is the risky one.

## 2. Who it is for

| User | What they need | Typical trip |
| --- | --- | --- |
| Everyday bike commuter | Get there quickly, but avoid roads with no bike infrastructure | Home in JP to work in Longwood |
| New or nervous cyclist | Protected lanes and quiet streets, even if it takes longer | First rides after buying a bike |
| Student or visitor on foot | A pleasant, walkable path, ideally through green space | Campus to Jamaica Pond |
| Recreational walker or runner | Loops and trails matched to their fitness | Weekend walk on the Emerald Necklace |
| Parent with kids / older adult | Low-traffic, flat, well-surfaced routes | Walk or ride to Franklin Park |
| Driver (later) | Same app, so they can compare driving with walking or biking | Deciding whether to drive at all |

Common context: on a phone, often outdoors, sometimes mid-trip. Answers must be
readable at a glance.

## 3. Features

Each feature lists what it needs, how a user would see it, and whether it fits
the first version (V1 = Jamaica Plain and the Emerald Necklace, walking and
biking only, built in one hackathon day by a first-time team).

### F1. Route styles: fastest, safest, scenic

The user picks how they want to travel and the app routes for that goal.

- **Fastest**: shortest travel time for the mode.
- **Safest**: prefers protected or separated bike lanes, low-traffic streets,
  off-street paths, and fewer busy-road crossings; avoids high-crash corridors.
- **Scenic**: prefers park paths, tree-lined and waterfront streets, and green
  space (in V1, the Emerald Necklace parks: Jamaica Pond, Arnold Arboretum,
  Franklin Park, Olmsted Park, the Riverway).

What it needs:
- A routing engine on OpenStreetMap data that accepts a preference or weighting
  (OpenRouteService has cycling and walking profiles plus options for greener
  and quieter routes; to be confirmed at build time).
- Map data that marks bike infrastructure and park paths (OSM tags such as
  `cycleway=*`, `highway=cycleway`, `highway=path`/`footway`, `leisure=park`),
  optionally the City of Boston bike network dataset.
- For "safest": crash history (Boston Vision Zero crash records) as an extra
  signal, if time allows.

What the user sees: three buttons or tabs ("Fastest / Safest / Scenic"). All
three routes can be drawn at once in different colors, each with a card showing
time, distance, and a one-line reason ("82% on protected lanes").

V1 fit: **Yes, core feature.** Scenic can be a simple "prefer park paths" weight.

### F2. Travel modes: walking, biking, driving

What it needs: a routing profile per mode (foot, bike, car), plus mode-specific
rules (bike lanes matter for biking, sidewalks and crossings for walking).

What the user sees: a mode switcher (walk / bike / drive icons) above the route
styles. Times and warnings change with the mode.

V1 fit: **Walking and biking yes. Driving no** (out of V1 scope). Driving is
mostly useful as a comparison ("driving saves 4 minutes, biking the safe route
costs 6"), which can come later.

### F3. Bike-lane warning with safer alternatives

The signature feature. When the fastest bike route has stretches with poor or no
bike infrastructure, the app says so and offers a safer option.

What it needs:
- Per-segment knowledge of bike infrastructure along the fastest route
  (protected lane, painted lane, shared road, no lane, off-street path).
- A rule for when to warn, for example: more than 20% of the distance, or any
  single stretch longer than 400 m, on a busy road with no bike lane. Thresholds
  to be tuned by the team.
- A safer alternative route to compare against (from F1 "safest").

What the user sees: a yellow banner on the fastest route, e.g. "1.2 km of this
route is on Centre St with no bike lane. A safer route adds 3 min and stays on
protected lanes." The risky stretch is highlighted in red on the map. One tap
switches to the safer route.

V1 fit: **Yes, core feature and the demo moment.**

### F4. "How much extra distance will you accept?"

The user sets a personal limit on how much longer a safer or scenic route may be.

What it needs:
- A tolerance value per user (percent or minutes).
- Route comparison: only suggest a safer or scenic route if it is within the
  limit; otherwise keep the fastest route but still show the warning.
- Optionally, use the tolerance to tune the routing engine's alternative-route
  settings.

What the user sees: a slider, "I'll go up to +10% / +5 min out of my way for a
safer or nicer route." Route cards show the cost, e.g. "+0.4 km, +2 min." If no
safer route fits, the app says "No safer route within +10%. Try raising your
limit."

V1 fit: **Yes.** A slider plus a filter on the routes we already compute.

### F5. Trails and difficulty levels

For walkers, runners, and recreational riders: show and choose park trails by
difficulty.

What it needs:
- Trail data with difficulty signals: surface (paved, gravel, dirt), slope or
  elevation change, and trail difficulty tags where OSM has them (e.g.
  `sac_scale`, `mtb:scale`, `trail_visibility`). Coverage in Boston parks is
  likely patchy, so we may need to derive difficulty from surface plus slope.
- A simple scale: Easy (paved, flat), Moderate (unpaved or some hills),
  Challenging (steep, rough, or narrow).

What the user sees: an "Easy / Moderate / Challenging" filter, colored trail
lines in the parks, and a difficulty label on each route card. A "loop" option
(start and end at the same place) is a natural extension.

V1 fit: **Partial.** Show a difficulty label (derived from surface and slope) on
routes through the Emerald Necklace. A full trail browser and loops are later.

### F6. Safety score with plain-language reasons (from the existing scaffold)

A 0 to 100 score per route with reasons ("mostly protected lanes", "one busy
crossing at Centre and South St").

What it needs: the same per-segment data as F3, plus optional crash data.

What the user sees: a score badge on each route card and a short list of reasons.

V1 fit: **Yes, lightweight.** It is the same data as F3 shown as a number.

### F7. Accessibility preferences (from the existing scaffold)

Max slope, surfaces to avoid (cobblestones, gravel), wheelchair-friendly routing.

What it needs: slope and surface data per segment, and a wheelchair routing
profile.

What the user sees: a preferences panel.

V1 fit: **Later.** Valuable, but it widens the scope beyond walk and bike.
"Avoid unpaved surfaces" can be a single toggle if time allows.

### F8. Community obstacle reports (from the existing scaffold)

Users report blocked bike lanes, construction, or broken curb ramps; routes
account for them.

What it needs: a shared database, moderation, and expiry of old reports.

What the user sees: a "Report" button and pins on the map.

V1 fit: **Later.** Needs a backend and real users to be meaningful.

## 4. Data and tools

| Need | Source | Notes |
| --- | --- | --- |
| Base map | OpenStreetMap tiles via Leaflet | Already in the scaffold |
| Routing | OpenRouteService (hosted API, free key) | Walking and cycling profiles, alternative routes, per-segment extra info (surface, way type, steepness); verify exact options at build time |
| Bike infrastructure | OSM tags, City of Boston Existing Bike Network | Used for F1 safest, F3, F6 |
| Parks and paths | OSM `leisure=park`, `highway=path/footway/cycleway` | Used for F1 scenic, F5 |
| Crash history | Boston Vision Zero crash records (Analyze Boston) | Optional for V1 |
| Elevation and slope | ORS elevation option | Used for F5, F7 |

API keys go in `.env` only (already gitignored). Never commit keys.

## 5. Out of scope for V1

- Areas outside Jamaica Plain and the Emerald Necklace.
- Driving directions, transit, scooters.
- Turn-by-turn voice navigation and live GPS tracking.
- User accounts, saved routes, and community reports.
- Real-time traffic or construction feeds.

## 6. How we'll know V1 works

1. For a set of test trips in JP (for example Jackson Square to Jamaica Pond,
   Forest Hills to the Arboretum, Hyde Square to Franklin Park), the app returns
   fastest, safest, and scenic routes for both walking and biking.
2. On at least one test trip, the fastest bike route triggers the bike-lane
   warning and the safer route avoids the flagged stretch.
3. Changing the extra-distance slider changes which alternative is offered.
4. A teammate who did not build it can run the app locally from the README.

## 7. Proposed prototype features (for team confirmation)

Build in this order, so there is a working demo after each step:

1. **F2 walk and bike modes** and **F1 fastest / safest / scenic** routes in the
   JP and Emerald Necklace area.
2. **F3 bike-lane warning** with the risky stretch highlighted and a one-tap
   switch to the safer route.
3. **F4 extra-distance slider** filtering the alternatives.
4. **F6 safety score** badge and reasons on each route card.
5. **F5 difficulty label** (Easy / Moderate / Challenging) on routes through the
   parks, if time allows.

Deferred: driving mode (F2), full trail browser and loops (F5), accessibility
preferences (F7), obstacle reports (F8).

## 8. Open questions

- Which hackathon track does this pitch under? (Civic action is the natural fit;
  confirm against the track briefs.)
- Warning thresholds for F3: what counts as "too much" road without a bike lane?
- Should the extra-distance limit be in percent, minutes, or both?
- Is the existing scaffold's wheelchair focus still part of the pitch, or is it
  now walk and bike only?
