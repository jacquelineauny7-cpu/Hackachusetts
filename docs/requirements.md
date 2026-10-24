# Route Your Way: feature spec

Status: draft for team review, 24 Oct 2026. This is the idea and feature spec,
written to give Kiro (and any teammate) solid context before building. It
replaces the shorter first draft.

How to read it:

- **[Transcript]** means the team said it in the app-idea discussion.
- **[Proposal]** means we filled a gap with a suggested value. Change it freely;
  nothing marked this way has been decided.
- **[Existing scaffold]** means it comes from the code already in this repo.
- **V1** is the first-version scope: Jamaica Plain and the Emerald Necklace,
  walking and biking only, built in one hackathon day by a first-time team.
  Everything outside V1 is still specified so the design leaves room for it.
- People are referred to by role, never by name.

Contents: 1 Problem and vision, 2 Users, 3 Core concept, 4 Features,
5 Scoring scales, 6 Data, 7 How it fits the existing scaffold, 8 V1 scope and
build order, 9 Marketing and validation, 10 Success checks, 11 Open questions.

---

## 1. Problem and vision

A navigation app picks the most efficient route and assumes everyone travels the
same way. That fails people who walk or bike:

- **[Transcript]** For biking, the "most efficient" route often has no bike lane,
  so the rider ends up on the road with cars.
- **[Transcript]** People with an injury or leg issues need to avoid hills, and
  for them a longer route is fine. Time is not the point.
- **[Transcript]** People may want a scenic route to a destination instead of
  the quickest one, and may want to avoid cobblestone.
- **[Transcript]** Bike sharing exists in Boston but is used less than private
  bikes, so many riders are on their own bikes and choose their own routes.

**Vision:** one navigation app for walking, biking, and driving that routes
around the traveler's own capabilities and preferences (not just speed), shows
the trade-offs honestly, and warns when the quickest option is the risky one.

**One-line pitch [Proposal]:** "Directions that fit your legs, your bike, and your
mood, not just the clock."

---

## 2. Users

| Role | What they need | Example |
| --- | --- | --- |
| Everyday bike commuter | Quick, but with bike lanes where possible | Home in Jamaica Plain to work in Longwood |
| New or nervous cyclist | Bike-lane-only or quiet streets, even if longer | First rides after buying a bike |
| Rider with their own bike | Avoid cobblestone and rough surfaces that hurt a road bike | Commute on a thin-tire bike |
| Person with an injury or limited mobility | No hills (or a hill cap); long routes are fine | Recovering from a knee injury |
| Student or visitor on foot | A pleasant walkable route, ideally through green space | Campus to Jamaica Pond |
| Recreational walker or runner | Trails matched to fitness level | Weekend walk on the Emerald Necklace |
| Parent with kids or older adult | Flat, low-traffic, well-surfaced paths | Walk to Franklin Park |
| Driver (later) | Avoid steep or difficult roads; compare against walking or biking | Deciding whether to drive at all |

Context: on a phone, often outdoors, sometimes mid-trip. Answers must be
readable at a glance.

---

## 3. Core concept

Three ideas combine to make every route request:

1. **Mode:** walk, bike, or drive.
2. **Profile (who you are):** your capabilities and constraints, saved once. For
   example "no hills over 3%", "avoid cobblestone", "bike lanes only".
3. **Goal (what you want this trip):** fastest, safest, or scenic.

The routing engine turns profile + goal into a **cost** for every street segment
(lower cost = more attractive), finds the cheapest route, and then the app
**scores** the finished route (safety, scenic, difficulty) and explains it.

A key distinction:

- **Hard constraints** from the profile exclude a segment entirely (for example
  "bike lanes only" removes streets without a lane, if any route remains).
- **Soft preferences** add cost but allow a segment if the alternative is too
  long (for example "prefer scenic").

---

## 4. Features

Each feature has: what it is, what it needs, what the user sees, and V1 status.

### F1. Mode selection: walk, bike, drive [Transcript]

The app works for people who walk, bike, or drive, and picks routes for all
three based on capabilities and preferences.

- **Needs:** a routing profile per mode (foot, bike, car) and mode-specific
  rules: bike lanes matter for biking, sidewalks and crossings for walking, road
  grade and road type for driving.
- **User sees:** a mode switcher (three icons) at the top. Times, warnings, and
  available preferences change with the mode.
- **V1:** walk and bike **yes**. Drive **no** (specified here, built later).
- **Driving, when built [Proposal]:** the profile supports "avoid steep roads"
  and "avoid cobblestone", and the app shows a comparison card: "Driving saves
  4 min vs. biking the safe route."

### F2. Capability and preference profile [Transcript]

The user sets what they can and want to do once. The app saves it and applies it
to every route.

Profile fields:

| Field | Type | Applies to | Hard or soft |
| --- | --- | --- | --- |
| Max incline (steepest allowed grade) | percent, see section 5.3 | walk, bike, drive | Hard |
| Avoid hills altogether ("flat as possible") | toggle | walk, bike, drive | Soft, heavy weight |
| Bike lanes only | toggle | bike | Hard (with fallback, see F4) |
| Protected lanes only | toggle | bike | Hard (with fallback) |
| Avoid cobblestone | toggle | walk, bike, drive | Hard by default |
| Avoid unpaved / rough surfaces | toggle | walk, bike | Hard by default |
| Prefer scenic | slider 0 to 3 | all | Soft |
| Extra distance accepted | percent or minutes | all | Limit on alternatives (F5) |
| Fitness / difficulty ceiling | Easy, Medium, Hard | walk, bike | Hard on trails (F8) |
| Bike type [Proposal] | road, hybrid, mountain, e-bike | bike | Sets surface and grade tolerances |

- **Needs:** a form, local storage (the scaffold's preferences feature already
  saves to `localStorage`), and engine support for each field.
- **User sees:** a short setup flow the first time ("Tell us about your trips"),
  then a profile sheet that can be edited at any time. Quick presets
  **[Proposal]**: "Recovering (no hills)", "Nervous cyclist (protected lanes
  only)", "Scenic stroll", "Commuter".
- **V1:** **yes**, with these fields: max incline, avoid hills, bike lanes only,
  avoid cobblestone, avoid unpaved, scenic preference, extra distance accepted.
  Bike type, fitness ceiling, and presets are stretch goals.

### F3. Route goals: fastest, safest, scenic [Transcript]

Per trip, the user picks how to optimise.

- **Fastest:** shortest travel time within the profile's hard constraints.
- **Safest:** maximises the safety score (section 5.1): bike infrastructure,
  low traffic, low crash rate, fewer difficult crossings.
- **Scenic:** maximises the scenic score (section 5.2): parks, trails, water,
  tree-lined streets, tied to a destination (the user still arrives where they
  asked).
- **Custom blend [Proposal]:** a slider between the three, for example 40%
  safe, 40% scenic, 20% fast.
- **User sees:** three tabs or chips ("Fastest / Safest / Scenic"). All three
  routes drawn at once in different colours, each with a card: time, distance,
  safety score, scenic score, difficulty, and a one-line reason ("82% on
  protected lanes, passes Jamaica Pond").
- **V1:** **yes**, core feature.

### F4. Bike-lane-only and bike-lane-aware routing [Transcript]

The team's central complaint: efficient routes often have no bike lane, putting
the rider on the road.

- **Bike-lane-only mode:** the route uses only segments with a bike lane,
  protected lane, off-street path, or designated greenway.
- **Fallback [Proposal]:** if no route exists using lanes only, the app says so
  and offers the best route with the shortest unprotected stretch, clearly
  highlighted. It never silently drops the rule.
- **Bike-lane warning:** when the fastest bike route has poor or no bike
  infrastructure, show a yellow banner on that route: "1.2 km of this route is
  on Centre St with no bike lane. A safer route adds 3 min and stays on
  protected lanes." Highlight the risky stretch in red. One tap switches to the
  safer route.
- **Warning thresholds [Proposal]:** warn when any of these is true on the
  fastest route: more than 20% of the distance has no bike infrastructure;
  any single unprotected stretch is longer than 400 m on a road with speed limit
  above 30 mph or 3 or more lanes; or the route crosses a high-crash corridor
  (section 5.1).
- **Needs:** per-segment bike infrastructure type (section 6), a way to compare
  the fastest route against the safest route.
- **V1:** **yes**, core feature and the demo moment.

### F5. Extra distance accepted [Transcript: "length of time doesn't matter" for some users]

A personal limit on how much longer a safer or scenic route may be. For some
users (for example avoiding hills with an injury) the limit is effectively
unlimited.

- **User sees:** a slider, "I'll go up to +10% / +5 min out of my way for a safer
  or nicer route", with an "As long as it takes" option for users who need it.
  Route cards show the cost ("+0.4 km, +2 min"). If no safer route fits: "No
  safer route within +10%. Raise your limit?"
- **Default [Proposal]:** +15% for the safest and scenic goals.
- **Rule [Proposal]:** hard constraints (such as max incline) override the limit.
  If a constraint forces a longer route, show it and say why: "Longer because
  your route avoids slopes over 3%."
- **V1:** **yes**.

### F6. Hill avoidance and incline control [Transcript]

Users with injury or leg issues can pick a route with no hills; time and length
do not matter for them. The team also described using incline percentages to
set difficulty bands.

- **Needs:** elevation along each segment (section 6) so grade percentage can be
  computed.
- **User sees:** "Max hill steepness" with named steps instead of raw percents
  (see section 5.3), plus an elevation profile chart on each route card with the
  steepest stretch marked.
- **V1:** **yes**: a max-incline setting that excludes or heavily penalises steep
  segments, and a small elevation profile.

### F7. Surface and terrain preferences [Transcript]

Avoid cobblestone; distinguish concrete from nature trails.

- **Surface classes [Proposal]:** Smooth paved (asphalt, concrete), Rough paved
  (brick, cobblestone, sett, broken pavement), Packed natural (compacted gravel,
  fine gravel, packed dirt), Loose natural (loose gravel, sand, mud, roots).
- **User sees:** toggles ("Avoid cobblestone", "Avoid unpaved"), and a surface
  breakdown bar on each route card ("86% smooth paved, 14% packed dirt").
- **Needs:** OSM `surface=*` and `smoothness=*` tags; many segments have no tag,
  so the app needs a default (assume paved for roads, unknown for paths) and
  should say when surface data is unknown.
- **V1:** **yes** for avoid cobblestone and avoid unpaved; the breakdown bar is a
  stretch goal.

### F8. Trails and difficulty levels [Transcript]

Difficulty is set by incline and terrain together: a given percentage incline is
within easy, medium, or hard, and terrain (flat concrete versus a nature trail)
shifts the level.

- **Needs:** trail data (section 6), grade and surface per segment, the scoring
  rules in section 5.4.
- **User sees:** an Easy / Medium / Hard label with colour on each route card
  and on park trails, and a filter ("Show me Easy trails only"). A tap on the
  label explains why ("Medium: 60% of route is a gravel path, steepest climb 6%").
- **Loops [Proposal]:** a "loop from here" option for walkers and runners
  (start and end at the same point, target a distance or time). Later.
- **V1:** label on routes through the Emerald Necklace **yes** (derived from
  grade and surface); trail filter and loops **no**.

### F9. Scenic routing tied to a destination [Transcript]

The user has a destination and wants the scenic way to get there, not a
sightseeing loop.

- **How it works [Proposal]:** the scenic goal lowers the cost of scenic
  segments (section 5.2) while still requiring the route to end at the
  destination within the accepted extra distance.
- **User sees:** the scenic route with highlights along it ("Passes Jamaica Pond
  and the Arboretum, 71% in parks or beside water"). Optional "scenic spots"
  markers **[Proposal]**.
- **V1:** **yes**: park and trail weighting using OSM, in the Emerald Necklace.

### F10. Safety and scenic scoring with explanations [Transcript + Existing scaffold]

The team wants to build its own scale for what makes a route safe or scenic and
needs to work out the percentage breakdowns. The scaffold already shows a 0 to
100 score with reasons.

- **User sees:** two badges per route (Safety 0 to 100, Scenic 0 to 100), the
  difficulty label, and a short list of plain-language reasons.
- **Needs:** the scales in section 5.
- **V1:** **yes**.

### F11. Crash-rate data per street [Transcript]

Build the data by finding crash rates on certain streets.

- **Needs:** crash records matched to street segments, turned into a crash rate
  per segment (section 6).
- **User sees:** no raw map of crashes by default; the effect shows up in the
  safety score and reasons ("Higher-than-typical crash history at Centre and
  South St"). Optional crash-hotspot layer **[Proposal]**.
- **V1:** **stretch goal.** Start without it (use infrastructure only); add it if
  the data loads cleanly.

### F12. Park and trail counts along a route [Transcript]

Count the number of parks on or passed by a route, and use trail data for scenic
options.

- **Needs:** park polygons and trail lines (section 6), a spatial check of which
  parks the route passes through or within a set distance of.
- **User sees:** "Passes 3 parks" and the park names on the scenic route card.
- **V1:** **yes**, as part of the scenic score.

### F13. Report an obstacle (blocked lane, construction) [Existing scaffold]

Users report hazards so routes reflect current conditions.

- **V1:** **no.** Needs a backend, moderation, and real users. Keep the scaffold
  stub.

### F14. Accessibility / wheelchair profile [Existing scaffold]

The scaffold includes a wheelchair mode.

- **V1:** **no**, pending a team decision (see open questions). Much of F2 (max
  incline, avoid rough surfaces, curb ramps) supports it later.

### F15. Wearable companion: hands-free turn prompts [Transcript]

While riding or running, the app connects to a wearable such as earbuds (for
example AirPods) and gives short spoken turn prompts, so the user does not look
at the phone.

- **Needs:** audio output through the phone's normal Bluetooth connection (no
  special wearable integration is needed for spoken prompts, because the phone
  plays the audio to the earbuds). Live location from the phone (GPS), a
  turn-by-turn engine (the route geometry plus a "next maneuver" calculation),
  and text-to-speech. A native app or a web app with the browser speech and
  geolocation APIs **[Proposal]**. Smartwatch haptics (buzz left or right) and
  earbud head-tracking are later ideas and need native apps for each platform.
- **User sees:** a "Start ride" button, then short prompts ("Left on Centre St in
  100 metres"), plus a minimal screen with the next turn. Volume and voice are
  the phone's.
- **Limits to know [Proposal]:** a web page may stop updating its location when
  the screen locks or the browser goes to the background, which breaks
  turn-by-turn; this must be tested on a real phone. A native app (or a
  progressive web app with a wake lock) may be needed.
- **V1:** **no** for live navigation. V1 shows the routes on a map. **Later:**
  spoken prompts first, then haptics.

### F16. Hurry mode and the green-light route [Transcript]

When the user is in a hurry, the app maximises speed. The team's bigger idea is
a "green-light route": connect to traffic signals so the route and pacing try to
hit the greens.

Two levels, from simple to hard:

1. **Hurry mode (no signal data) [Proposal]:** the Fastest goal plus a penalty on
   segments with many signalised intersections or known long waits, using
   signal locations from map data. This estimates delay with an average wait per
   signal (proposed 20 seconds for biking, 30 for walking, to be tuned).
2. **Green-light route (needs signal timing):** with each signal's timing plan,
   the app picks the route and the speed that arrives at each signal during the
   green phase, and can suggest a target speed ("ride 16 km/h to catch the next
   greens", the idea behind "green wave" systems).

- **Needs:** at level 1, OpenStreetMap `highway=traffic_signals` nodes. At
  level 2: signal timing data (cycle length, green split, offsets, and ideally
  live phase), plus an accurate live position and speed from F15.
- **User sees:** a "Hurry" toggle on the route card showing estimated signal
  stops ("about 6 signals, ~2 min of waiting"). At level 2, a "catch the
  greens" suggestion with a target speed.
- **Open question, flagged clearly:** signal timing data is often not public. In
  the US many cities run signals on fixed or actuated plans that are not
  published as a live feed, and live phase data may only be available through
  city traffic departments or vendor partners. **We have not verified whether
  Boston publishes signal timing or live phase data.** Before this feature is
  promised in a pitch, someone must check with the city's transportation
  department (and any data partner) and confirm what is available, its format,
  and its terms. Do not present level 2 as a working feature until then.
- **V1:** level 1 estimated delay **maybe** (stretch goal, uses map data only).
  Level 2 green-light route **no, unconfirmed**; treat as a research question
  and a possible partner conversation.

### F17. Reroute when a red light is hit [Transcript]

If the user reaches a red light, the app reroutes: it says to turn left or right
and redirects onto a new path, so the user keeps moving.

- **Needs:** F15 (live position and prompts), F16 level 2 (to know the light is
  red now, and the phase of the next signals), and a fast re-route from the
  current position. Without live signal data the app cannot know a light is red;
  it could only infer a stop from the phone's speed dropping to zero near a
  signal **[Proposal]**.
- **User sees:** a prompt such as "Red ahead. Turn right on Wyman St to keep
  moving" and a new line on the map. After a reroute, the app should not
  produce a longer route than the extra-distance setting allows (F5).
- **Risk [Proposal]:** rerouting around a red light could encourage unsafe
  riding if it leads onto worse roads. The new path must respect the safety
  profile (F2 and F4), and prompts must never tell a user to run a red light.
- **V1:** **no.** Later, after F15 and F16 level 2 exist.

### F18. Quiet mode: speak only when it matters [Transcript]

A mode that limits how often the app speaks and alerts, so it only interrupts on
what matters. The team described it as a green-light mode with fewer follow-ups,
so the app does not keep talking while things are going well.

- **Rules [Proposal]:**
  - Always speak: a turn or reroute, a safety warning (for example, a stretch with
    no bike lane ahead), a hazard.
  - Speak once: the start and the arrival.
  - Stay silent: confirmations ("you're on track"), repeated reminders, and
    anything the user can see on the screen.
  - Prompt timing: a heads-up about a turn at roughly 150 m, a final cue at
    about 30 m for biking; for running and walking, 80 m and 20 m. Distances
    scale with speed.
- **Needs:** F15, and a notion of alert priority (critical, useful, optional).
- **User sees:** a setting "Prompts: Standard / Quiet / Turns only".
- **V1:** **no** (depends on F15). The priority levels should still be designed
  into the alert code from the start so it can be added.

### F19. Planned stop along the way [Transcript]

The user adds a stop (for example "grab matcha on my bike ride") and says what
they want. The app suggests places on or near the route.

- **Needs:** a places dataset with categories and opening hours (OpenStreetMap
  `amenity=cafe`, `shop=*` with `cuisine` and `opening_hours`, or a places API;
  an API usually needs a key and has terms and costs, which we have not
  checked). A free-text request ("matcha") mapped to categories or keywords.
  Routing with a waypoint: route start to stop to destination.
- **User sees:** an "Add a stop" button. The user types or picks "matcha"; the
  app shows 3 to 5 options as pins on the route, each with the extra distance
  and time to reach it ("+0.2 km, +1 min"), whether it is open now, and a
  bike-friendly note (bike parking, on a bike lane). Choosing one updates the
  route.
- **How to find "on the way" [Proposal]:** a place counts as on the way if
  adding it as a waypoint increases the route by no more than a set limit (the
  F5 extra-distance setting, default 10% or 400 m).
- **Gap to decide:** "matcha" is a specific item; map data usually knows cafes,
  not what they serve. Options: match on name and cuisine tags only, use
  reviews (needs a paid or restricted API), or let the user confirm. We do not
  know yet which is acceptable.
- **V1:** **stretch goal.** A simple version: user taps a category (cafe, water,
  bike shop, restroom) and picks from nearby pins on the route, using OSM data
  only. Free-text and live opening hours are later.

### F20. Detour for a better spot [Transcript]

If the best place is not on the way and the user does not mind going out of
their way, the app finds better options farther off the route.

- **Needs:** F19, a quality signal for places (ratings or popularity, which
  come from an external places service or user input; OSM does not have
  ratings), and the extra-distance setting (F5).
- **User sees:** in the stop picker, a toggle "I'll detour for something
  better", with a slider for how far (for example up to +1.5 km). Results are
  sorted by quality then detour cost, each showing the detour ("+1.1 km, +5
  min") and why it is suggested.
- **Rule [Proposal]:** the detour limit is separate from the route extra-distance
  limit, and the app shows the total before the user confirms.
- **V1:** **no.** Needs a ratings source. Later.

---

## 5. Scoring scales

All numbers in this section are **[Proposal]**. The team said it needs to work
out these breakdowns; these are starting values to test and tune, not decisions.
Every score is 0 to 100, higher is better (more safe, more scenic). Weights are
kept in one config file so they are easy to change.

### 5.1 Safety score (bike)

| Factor | Weight | How it is scored |
| --- | --- | --- |
| Bike infrastructure | 40% | Distance-weighted: off-street path or protected lane = 100; painted lane = 70; shared lane marking or signed route on a quiet street (limit up to 25 mph) = 50; no infrastructure on a busy road = 0 |
| Traffic stress of the road | 25% | Road class and speed: residential up to 25 mph = 100; collector 25 to 30 mph = 60; arterial above 30 mph or 3+ lanes = 20 |
| Crash history | 20% | Crash rate per segment, from low (100) to top-decile (0); skipped (weight moved to others) if no crash data |
| Intersections and crossings | 10% | Fewer unsignalised crossings of busy roads = higher |
| Surface quality | 5% | Smooth paved = 100; rough paved = 60; packed natural = 60; loose = 20 |

Safety labels: 80 to 100 = Very safe, 60 to 79 = Good, 40 to 59 = Mixed,
below 40 = Risky.

Walking safety [Proposal]: replace bike infrastructure with sidewalk presence
and quality (40%), keep traffic stress (20%), crash history (20%, pedestrian
crashes), crossings (15%), surface (5%).

### 5.2 Scenic score

| Factor | Weight | How it is scored |
| --- | --- | --- |
| Share of route in parks or on trails | 40% | Distance in a park or on a path = 100 scale |
| Water and views | 20% | Distance within 50 m of a pond, river, or waterfront |
| Greenery | 20% | Tree-lined streets (street-tree data) or green land use nearby |
| Calm surroundings | 10% | Low traffic stress (reuses 5.1) |
| Landmarks / notable parks passed | 10% | Count of named parks, gardens, or landmarks, capped |

Scenic labels: 70 to 100 = Very scenic, 40 to 69 = Pleasant, below 40 = Plain.

### 5.3 Incline bands

Grade is rise divided by run, in percent, computed per segment and summarised for
the route as (a) the steepest sustained stretch (at least 50 m) and (b) the share
of distance above each band. A short spike is flagged but weighs less.

| Band | Grade | Plain description |
| --- | --- | --- |
| Flat | 0 to under 2% | Barely noticeable |
| Gentle | 2 to under 4% | Noticeable, easy for most people |
| Moderate | 4 to under 7% | A real climb for casual riders and walkers |
| Steep | 7 to under 10% | Hard; hard for anyone with a leg injury |
| Very steep | 10% and above | Walk the bike; avoid for limited mobility |

Max incline profile settings map onto these: "Flat only" = 2%, "Gentle" = 4%,
"Moderate" = 7%, "Any" = no cap. For walking with limited mobility, a common
accessibility guideline is a maximum of about 5% (1:20) sustained; we use the
"Gentle" setting as the default for the "no hills" preset. These thresholds need
checking against accessibility standards before launch (see open questions).

### 5.4 Difficulty level (Easy / Medium / Hard)

Difficulty combines incline and terrain, as the team described. Proposed method:

1. **Incline points** from the steepest sustained grade: Flat/Gentle = 0, Moderate
   = 1, Steep = 2, Very steep = 3.
2. **Terrain points** from the dominant surface (more than 30% of distance, take
   the hardest): Smooth paved = 0, Rough paved = 1, Packed natural = 1, Loose
   natural = 2.
3. **Length points** (walking): up to 3 km = 0, 3 to 8 km = 1, over 8 km = 2.
   (Biking: up to 15 km = 0, 15 to 40 km = 1, over 40 km = 2.)
4. **Total:** 0 to 1 = Easy, 2 to 3 = Medium, 4 or more = Hard.

Examples: a flat concrete path of 2 km = 0 points = Easy. The same 2 km on a
loose gravel nature trail with a 5% climb = 2 + 1 = 3 = Medium. A 10 km walk on a
gravel trail with an 8% climb = 2 + 2 + 2 = 6 = Hard.

Terrain shifts difficulty because the same grade is harder on loose ground than
on smooth concrete; this is why surface is part of the score, not just a filter.

### 5.5 Cost function used by the routing engine

For each segment: `cost = length × (1 + sum of penalties)`, where penalties come
from the profile and goal. **[Proposal]** starting multipliers (tune by testing):

| Condition | Fastest | Safest | Scenic |
| --- | --- | --- | --- |
| No bike infrastructure on a busy road (bike) | +0.3 | +3.0 | +1.0 |
| Painted lane only (bike) | 0 | +0.5 | +0.2 |
| Protected lane or off-street path (bike) | 0 | -0.2 | -0.2 |
| Grade above the user's max incline | excluded | excluded | excluded |
| Grade in the band just under the max | +0.5 | +0.5 | +0.5 |
| Cobblestone (when "avoid" is on) | excluded | excluded | excluded |
| Park path or trail | 0 | -0.1 | -0.5 |
| Waterfront or tree-lined | 0 | 0 | -0.3 |
| High-crash segment | 0 | +1.0 | +0.3 |

A negative value makes the segment cheaper than its plain length. Costs never go
below 0.2 × length, so the route cannot loop to farm bonuses.

---

## 6. Data

The team wants to build the data by collecting crash rates and elevation, and to
use trail and park data for scenic options.

| Need | Source | Notes |
| --- | --- | --- |
| Street network, bike infrastructure | OpenStreetMap (`highway=cycleway`, `cycleway=*`, `bicycle=*`) | Free; coverage varies, so check the JP test area on the map first |
| Official bike network | City of Boston Existing Bike Network (Analyze Boston, Boston GIS) | Use to cross-check OSM; separates protected from painted lanes |
| Surface and smoothness | OSM `surface`, `smoothness`, `tracktype` | Many gaps; need a default and an "unknown" flag |
| Elevation and grade | Routing engine elevation option, or a public elevation model (USGS 3DEP) | Needed for F6 and F8 |
| Crash records | Boston Vision Zero crash records (Analyze Boston), MassDOT crash data | Match each crash to the nearest street segment; count per segment per year; normalise by segment length (crashes per km per year) |
| Parks and open space | OSM `leisure=park`, `landuse=forest`, City of Boston open space | Used for F9 and F12 |
| Trails | OSM `highway=path/footway/track`, `sac_scale`, `mtb:scale` | Difficulty tags are rare; derive difficulty from surface and grade |
| Trees and greenery | Boston street tree inventory | Stretch goal for the scenic score |
| Signal locations | OSM `highway=traffic_signals` | For the estimated-delay version of hurry mode (F16); available now |
| Signal timing and live phase | City traffic department or a data partner | **Unconfirmed.** Often not public; needed for the green-light route (F16) and red-light reroute (F17). See open question 14 |
| Places for stops | OSM `amenity=cafe`, `shop=*`, `opening_hours`; or a places API | A places API needs a key, has terms and costs we have not checked (F19, F20) |
| Ratings / popularity | External places service | OSM has none; needed for detour suggestions (F20) |
| Live position | Phone GPS | Needed for F15, F17, F18 |
| Traffic stress | OSM `maxspeed`, `lanes`, `highway` class | Basis for the traffic-stress factor |

Data rules:

- Keep raw datasets small enough to ship with the app, or document where to
  download them. Never commit API keys; use `.env` (already gitignored).
- Always show when data is missing or guessed ("Surface unknown on 12% of this
  route").
- Record data source and date in `src/data/README.md` so the team knows how
  fresh each layer is.

**Routing engine:** [Existing scaffold] OpenRouteService is the planned engine.
It offers walking and cycling profiles, alternative routes, and per-segment
details (surface, way type, steepness), and supports avoiding features and
custom weightings. **Not verified:** the exact options and rate limits of the
free tier; confirm at build time. An option **[Proposal]** if ORS limits get in
the way: compute routes in the browser or a small local server on a prepared
graph of the JP area using the cost function in 5.5.

---

## 7. How this fits the existing scaffold

The repo already contains a Vite + React + TypeScript + Leaflet scaffold, built
for an earlier version of the idea (cyclists and mobility needs, with a single
route and a safety score). Mapping:

| Spec item | Scaffold piece | Change needed |
| --- | --- | --- |
| Mode | `TravelMode` = bike, walk, wheelchair | Add `drive` later; decide on wheelchair |
| Profile | `UserPreferences` (mode, max grade, avoid surfaces, protected lanes only) | Add `avoidHills`, `bikeLanesOnly`, `scenicPreference`, `extraDistanceAccepted`, `difficultyCeiling`; add `goal` (fastest, safest, scenic) |
| Routes | `getRoutes()` returns one mock route | Return up to three (one per goal) |
| Segments | `RouteSegment` has surface, protectedLane, gradePercent | Add `infrastructureType`, `trafficStress`, `crashRate`, `inPark` |
| Score | `RouteScore` has one total and four breakdown items | Add `scenic` and `difficulty` |
| Obstacles | stubbed with mock data | Leave as is (V1 out of scope) |
| Stops | none | Later: add `stops: Place[]` to the trip request and `waypoints` to routing (F19, F20) |
| Live navigation | none | Later: a navigation feature folder for position, prompts, and alert priority (F15, F17, F18) |
| Signals | none | Later: `signalsOnRoute` and estimated delay on `Route` (F16) |

Any change to `src/types` is a shared contract change and should go through the
team, as the steering notes in `.kiro/steering` require.

---

## 8. V1 scope and build order

**V1 = Jamaica Plain and the Emerald Necklace, walking and biking only.**

In V1 (build in this order, so there is a working demo after each step):

1. F1 walk and bike modes; F3 fastest, safest, scenic routes (three routes drawn
   on the map with cards).
2. F2 profile (core fields) and F6 max incline / avoid hills; F7 avoid cobblestone
   and unpaved.
3. F4 bike-lane-only and the bike-lane warning with a one-tap switch.
4. F5 extra distance accepted slider.
5. F10 safety and scenic scores with reasons; F12 park counts.
6. F8 difficulty label on routes through the parks.

Stretch goals: F11 crash data, bike type, presets, surface breakdown bar,
elevation chart polish, F16 estimated signal delay (map data only), and a
simple F19 stop picker by category using map data only.

Not in V1: driving (F1), trail filter and loops (F8), obstacle reports (F13),
wheelchair (F14), wearable prompts (F15), the green-light route using signal
timing (F16 level 2), red-light reroute (F17), quiet mode (F18), free-text stops
and detours for better spots (F19, F20), areas outside the test zone, turn-by-turn voice navigation,
live GPS tracking, accounts, saved routes, real-time traffic.

Other test areas the team mapped for later (for trying the idea beyond V1):
Dorchester and the Neponset Greenway, Roxbury and the South End, East Boston and
Chelsea Creek.

---

## 9. Marketing and validation

The team noted that marketing could be part of the project, and that events
often include interviewing people. **[Transcript]**: interview people during the
event or after.

Proposed plan **[Proposal]**:

- **At the event:** ask other attendees five questions (below) while they take
  breaks, and record answers (with permission) on a shared sheet. Aim for 10 to
  15 short interviews.
- **After the event:** share the prototype with 5 to 10 riders and walkers in
  Jamaica Plain, and ask them to try one of their real trips.
- **Interview questions:** How do you get around Boston? Have you ever been on a
  road with no bike lane and felt unsafe? What would make you choose a longer
  route? Do you avoid hills or cobblestone? Would you use an app that warned you
  about the fastest route?
- **Metrics to report in the pitch:** share of interviewees who have felt unsafe
  routing, share who would accept a longer safer route, the typical extra
  distance they accept (feeds the F5 default), and the most requested
  preferences (feeds the F2 field list).
- **Pitch story:** open with the unsafe fastest-route example (F4 warning), show
  the same trip as a safe route, then show the profile changing the route (no
  hills for a recovering traveler).
- Handle interview data carefully: no names or contact details are needed, get
  consent before recording, and note the hackathon's media terms.

---

## 10. Success checks for V1

1. For test trips in Jamaica Plain (for example Jackson Square to Jamaica Pond,
   Forest Hills to the Arboretum, Hyde Square to Franklin Park), the app returns
   fastest, safest, and scenic routes for walking and biking.
2. On at least one test trip, the fastest bike route triggers the bike-lane
   warning, and the safer route avoids the flagged stretch.
3. Setting max incline to "Gentle" produces a route with no stretch above 4%, or
   a clear message that none exists.
4. Turning on "avoid cobblestone" removes cobblestone segments from the route.
5. Changing the extra-distance slider changes which alternative is offered.
6. Each route card shows safety, scenic, and difficulty with reasons.
7. A teammate who did not build it can run the app locally from the README.

---

## 11. Open questions for the team

Product:

1. Which hackathon track does this pitch under? (Civic action is the natural fit;
   confirm against the track briefs that drop at 9 AM.)
2. Is the wheelchair focus from the earlier scaffold still part of the idea, or
   is it walk and bike only?
3. Is driving a real part of the pitch, or a future mention?
4. Should "length of time doesn't matter" be an explicit setting ("As long as it
   takes"), as proposed in F5?

Scoring and thresholds:

5. Are the safety and scenic weights in 5.1 and 5.2 right? Who on the team owns
   tuning them?
6. Are the incline bands in 5.3 acceptable? Should they follow an accessibility
   standard exactly, and which one?
7. Should difficulty differ for walkers versus bikers (the length points already
   do; the incline points might too)?
8. What counts as "too much road without a bike lane" for the warning (F4
   thresholds)?
9. Should the extra distance limit be in percent, minutes, or both?

Data and technical:

10. Is the OpenRouteService free tier enough, or do we compute routes ourselves?
11. Which crash dataset do we trust, and how many years of data do we use?
12. How do we treat segments with unknown surface or unknown bike infrastructure
    (assume the worst, or show as unknown)?
13. Where does the profile live in V1: only on the device, or an account?

Wearable, signals, and stops:

14. **Signal timing data (blocks F16 and F17).** Does the City of Boston, or a
    partner, publish signal timing or live signal phase data? Who do we ask
    (the city's transportation department, the Mayor's Office innovation staff,
    a hackathon data partner)? Until answered, the green-light route is an
    unconfirmed idea, not a feature to promise.
15. Is live turn-by-turn in scope for the pitch, or is the pitch the planning
    app plus a mock-up of the wearable experience?
16. Native app or web app for live navigation? A web page may lose location
    updates when the screen locks; this needs a test on a real phone.
17. Which places source do we use for stops (OSM only, or a places API with a
    key and terms), and how do we handle a specific item like "matcha"?
18. Is rerouting after a red light acceptable from a safety point of view, and
    what wording keeps it from encouraging unsafe riding?

Marketing:

19. Who runs the interviews, and what consent wording do we use?
