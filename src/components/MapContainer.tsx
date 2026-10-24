/**
 * Shared map container — OWNED BY SHARED UI.
 *
 * Wraps react-leaflet with OpenStreetMap tiles and renders an optional
 * route polyline + obstacle markers passed in from the page. Feature teams
 * should render through props here rather than mounting their own map.
 */
import { MapContainer as LeafletMap, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import type { LatLng, Obstacle, Route } from "../types";

export interface MapContainerProps {
  center: LatLng;
  zoom?: number;
  route?: Route | null;
  obstacles?: Obstacle[];
}

/** Boston city center, used as the default map focus. */
export const BOSTON_CENTER: LatLng = { lat: 42.3601, lng: -71.0589 };

export default function MapContainer({
  center,
  zoom = 14,
  route = null,
  obstacles = [],
}: MapContainerProps) {
  // Leaflet uses [lat, lng]; our Route geometry is GeoJSON [lng, lat].
  const routeLatLngs =
    route?.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]) ?? [];

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

      {routeLatLngs.length > 0 && (
        <Polyline positions={routeLatLngs} pathOptions={{ color: "#0f766e", weight: 5 }} />
      )}

      {obstacles.map((o) => (
        <Marker key={o.id} position={[o.lat, o.lng]}>
          <Popup>
            <strong>{o.type.replace("_", " ")}</strong>
            <br />
            {o.description}
          </Popup>
        </Marker>
      ))}
    </LeafletMap>
  );
}
