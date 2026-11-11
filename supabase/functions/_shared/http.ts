import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

export function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin");
  const allowedOrigins = (Deno.env.get("PORTAL_SITE_URL") ?? "http://localhost:3000")
    .split(",")
    .map((value) => value.trim());
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin",
  };
  if (origin && allowedOrigins.includes(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

export function json(request: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export function preflight(request: Request): Response | null {
  if (request.method !== "OPTIONS") return null;
  const origin = request.headers.get("origin");
  if (origin && !corsHeaders(request)["Access-Control-Allow-Origin"]) {
    return new Response(null, { status: 403, headers: { Vary: "Origin" } });
  }
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export function serviceClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Supabase service configuration is missing.");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function authenticatedClient(request: Request) {
  const authorization = request.headers.get("authorization");
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_ANON_KEY");
  if (!authorization?.startsWith("Bearer ") || !url || !key) return null;
  const token = authorization.slice("Bearer ".length);
  const client = createClient(url, key, {
    global: { headers: { Authorization: authorization } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await client.auth.getUser(token);
  return error || !data.user ? null : { client, user: data.user, token };
}
