import { readFileSync } from "node:fs";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Load *.geojson files as parsed JSON modules. Vite only parses *.json by
 * default, so we handle the .geojson extension ourselves.
 */
function geojson(): Plugin {
  return {
    name: "geojson-loader",
    transform(_code, id) {
      if (!id.endsWith(".geojson")) return null;
      const json = readFileSync(id, "utf-8");
      return {
        code: `export default ${json}`,
        map: null,
      };
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), geojson()],
  server: {
    host: true,
  },
});
