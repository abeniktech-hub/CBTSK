"use client";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

type PortalClient = ReturnType<typeof createClient<Database, "public">>;
let browserClient: PortalClient | undefined;

export function createSupabaseBrowserClient(): PortalClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  return browserClient ??= createClient<Database, "public">(url, anonKey);
}
