/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ORS_API_KEY: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Allow importing .geojson files as parsed JSON objects.
declare module "*.geojson" {
  const value: {
    type: string;
    features: Array<{
      type: string;
      geometry: { type: string; coordinates: unknown };
      properties?: Record<string, unknown>;
    }>;
  };
  export default value;
}
