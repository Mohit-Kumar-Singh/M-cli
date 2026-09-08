import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** True when the app has been pointed at a real Supabase project. */
export const supabaseConfigured = Boolean(url && anonKey);

if (!supabaseConfigured) {
  // Not fatal — the app still renders so screens can be built before the
  // backend is provisioned (see docs/decisions/0008).
  console.warn(
    "Supabase env not set. Copy web/.env.example to .env.local and fill it in.",
  );
}

// Untyped client for now. Once the Supabase project exists, generate types:
//   npx supabase gen types typescript --linked > src/types/db.ts
// and switch to createClient<Database>(...).
// The placeholder URL is never contacted — screens guard on `supabaseConfigured`.
export const supabase = createClient(
  url ?? "https://unconfigured.invalid",
  anonKey ?? "unconfigured",
);
