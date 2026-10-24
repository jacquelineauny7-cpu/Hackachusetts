/**
 * Fixes Leaflet's default marker icons under a Vite/bundler setup.
 * Without this, markers render as broken images because Leaflet resolves
 * icon URLs relative to the CSS by default. Import this once at app start.
 */
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});
