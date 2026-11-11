"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

type PortalClient = ReturnType<typeof createBrowserClient<Database, "public">>;
let browserClient: PortalClient | undefined;

export function createSupabaseBrowserClient(): PortalClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  return browserClient ??= createBrowserClient<Database, "public">(url, anonKey);
}

export function getMissingSupabasePublicVariables(): string[] {
  const missing: string[] = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return missing;
}

export function getSupabaseConfigurationError(): string {
  if (process.env.NODE_ENV === "production") {
    return "The application portal is not configured yet. Please contact the seminary.";
  }
  const missing = getMissingSupabasePublicVariables();
  return `The application portal is not configured. Missing required environment variable${missing.length === 1 ? "" : "s"}: ${missing.join(", ")}. Add them to .env.local or Cloudflare Workers Build variables.`;
}
