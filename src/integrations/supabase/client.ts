import { createClient, type SupabaseClientOptions } from "@supabase/supabase-js";

function env(name: string): string | undefined {
  const value = import.meta.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

const projectId = env("VITE_SUPABASE_PROJECT_ID");
const supabaseUrl =
  env("VITE_SUPABASE_URL") ??
  (projectId ? `https://${projectId}.supabase.co` : undefined);

const supabaseKey =
  env("VITE_SUPABASE_ANON_KEY") ?? env("VITE_SUPABASE_PUBLISHABLE_KEY");

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "[supabase] Set VITE_SUPABASE_URL (or VITE_SUPABASE_PROJECT_ID) and VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY) in .env",
  );
}

const isBrowser = typeof window !== "undefined";

const options: SupabaseClientOptions = {
  auth: {
    persistSession: isBrowser,
    autoRefreshToken: isBrowser,
    storage: isBrowser ? window.localStorage : undefined,
  },
};

if (import.meta.env.SSR) {
  try {
    const { default: WebSocket } = await import("ws");
    options.realtime = { transport: WebSocket };
  } catch {
    /* Realtime optional during SSR on some hosts */
  }
}

export const supabase = createClient(supabaseUrl, supabaseKey, options);
