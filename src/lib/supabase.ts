import { createClient } from "@supabase/supabase-js";

const url = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined;
export const isSupabaseConfigured = Boolean(url && key);

let client: ReturnType<typeof createSupabaseClient> | undefined;

function createSupabaseClient() {
  if (!url || !key)
    throw new Error("Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (see .env.local)");
  return createClient(url, key);
}

export function getSupabase() {
  return (client ??= createSupabaseClient());
}
