/**
 * Shared map container — OWNED BY SHARED UI.
 *
 * Wraps react-leaflet with OpenStreetMap tiles and renders route polylines
 * plus obstacle markers passed in from the page. Supports rendering multiple
 * routes at once (e.g. a primary route and alternatives). Feature teams should
 * render through props here rather than mounting their own map.
 */
import { useEffect } from "react";
import {
  MapContainer as LeafletMap,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { LatLngBounds } from "leaflet";
import type { LatLng, Obstacle, Route } from "../types";

export interface MapContainerProps {
  center: LatLng;
  zoom?: number;
  /** Convenience single-route prop (rendered as the primary route). */
  route?: Route | null;
  /** Multiple routes; the first is treated as primary, the rest as alternatives. */
  routes?: Route[];
  obstacles?: Obstacle[];
  /** When true, pan/zoom to fit all rendered routes. Defaults to true. */
  fitToRoutes?: boolean;
  /** Called with the clicked location (used when placing an obstacle report). */
  onMapClick?: (loc: LatLng) => void;
  /** A draft pin to show while the user is placing a report. */
  draftPin?: LatLng | null;
}

/** Boston city center, used as the default map focus. */
export const BOSTON_CENTER: LatLng = { lat: 42.3601, lng: -71.0589 };

/** Convert a Route's GeoJSON [lng, lat] geometry to Leaflet [lat, lng]. */
function toLatLngs(route: Route): [number, number][] {
  return route.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
}

/** Forwards map click events to the page (for placing obstacle reports). */
function ClickHandler({ onMapClick }: { onMapClick?: (loc: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onMapClick?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

/** Imperatively fit the map to the bounds of the given routes. */
function FitBounds({ routes, enabled }: { routes: Route[]; enabled: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (!enabled || routes.length === 0) return;
    const points = routes.flatMap((r) => toLatLngs(r));
    if (points.length === 0) return;
    map.fitBounds(new LatLngBounds(points), { padding: [48, 48] });
  }, [map, routes, enabled]);
  return null;
}

export default function MapContainer({
  center,
  zoom = 14,
  route = null,
  routes,
  obstacles = [],
  fitToRoutes = true,
  onMapClick,
  draftPin = null,
}: MapContainerProps) {
  // Normalize inputs into a single list; `routes` takes precedence.
  const allRoutes: Route[] = routes?.length ? routes : route ? [route] : [];

  return (
    <LeafletMap
      center={[center.lat, center.lng]}
      zoom={zoom}
      zoomControl={false}
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Render alternatives first (underneath), primary last (on top). */}
      {allRoutes
        .map((r, i) => ({ r, i }))
        .reverse()
        .map(({ r, i }) => {
          const primary = i === 0;
          return (
            <Polyline
              key={r.id}
              positions={toLatLngs(r)}
              pathOptions={{
                color: primary ? "#0f766e" : "#64748b",
                weight: primary ? 6 : 4,
                opacity: primary ? 1 : 0.7,
                dashArray: primary ? undefined : "6 8",
              }}
            />
          );
        })}

      {obstacles.map((o) => (
        <Marker key={o.id} position={[o.lat, o.lng]}>
          <Popup>
            <strong>{o.type.replace(/_/g, " ")}</strong>
            <br />
            {o.description}
          </Popup>
        </Marker>
      ))}

      {draftPin && (
        <Marker position={[draftPin.lat, draftPin.lng]}>
          <Popup>New obstacle here</Popup>
        </Marker>
      )}

      <ClickHandler onMapClick={onMapClick} />
      <FitBounds routes={allRoutes} enabled={fitToRoutes} />
    </LeafletMap>
  );
}
