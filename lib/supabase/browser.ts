import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getRequiredEnv } from "@/lib/env";

// Cliente Supabase para el navegador (usa las variables NEXT_PUBLIC_*).
export function createSupabaseBrowserClient(): SupabaseClient {
  const url = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return createBrowserClient(url, anonKey);
}

