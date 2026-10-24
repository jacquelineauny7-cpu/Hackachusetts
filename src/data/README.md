# Static Boston datasets

Drop static GeoJSON datasets here (loaded later by the scoring feature):

- `bike-lanes.geojson` — Boston bike lane network (protected vs. painted)
- `crashes.geojson` — historical crash points/density
- (optional) `elevation`/slope sources

Keep raw files small enough to ship with the app, or document where to
fetch them. Import them from feature code, e.g.:

```ts
import bikeLanes from "../../data/bike-lanes.geojson?raw";
```

Nothing here is wired up yet — this folder is a placeholder.
