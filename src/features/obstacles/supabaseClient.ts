/**
 * Supabase client singleton for the obstacles feature.
 *
 * Returns null when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set, so
 * the app can still run against mock data for teammates without a Supabase
 * project configured.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;

  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

  if (!url || !key || url.includes("your-project") || key.includes("your-")) {
    console.warn(
      "[obstacles] Supabase not configured; using in-memory mock data. " +
        "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env to enable persistence.",
    );
    cached = null;
    return cached;
  }

  cached = createClient(url, key);
  return cached;
}
