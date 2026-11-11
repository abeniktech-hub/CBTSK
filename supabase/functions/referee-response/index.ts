import { corsHeaders, preflight, serviceClient } from "../_shared/http.ts";

async function digest(value: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function page(request: Request, title: string, content: string, status = 200): Response {
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><body style="font:16px/1.6 system-ui,sans-serif;max-width:680px;margin:3rem auto;padding:1rem;color:#2a1a22"><h1>${title}</h1>${content}</body></html>`, {
    status,
    headers: { ...corsHeaders(request), "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}

Deno.serve(async (request) => {
  const options = preflight(request);
  if (options) return options;
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (!/^[a-f0-9]{64}$/.test(token)) return page(request, "Recommendation link unavailable", "<p>This link is invalid or expired.</p>", 404);
  const admin = serviceClient();
  const tokenHash = await digest(token);
  const { data: invite, error } = await admin.from("referee_invites")
    .select("id,expires_at,consumed_at").eq("token_hash", tokenHash).maybeSingle();
  if (error || !invite || invite.consumed_at || new Date(invite.expires_at) <= new Date()) {
    return page(request, "Recommendation link unavailable", "<p>This link is invalid, expired or already used.</p>", 410);
  }

  if (request.method === "GET") {
    return page(request, "Confidential recommendation", `<form method="post">
      <input type="hidden" name="token" value="${token}">
      <label for="recommendation">Your recommendation</label>
      <textarea id="recommendation" name="recommendation" required maxlength="5000" rows="10" style="display:block;width:100%;margin:1rem 0;padding:.75rem" autocomplete="off"></textarea>
      <button type="submit" style="padding:.75rem 1.25rem">Submit recommendation</button>
      <p>The applicant cannot read your recommendation. This single-use link expires in seven days.</p>
    </form>`);
  }
  if (request.method !== "POST") return page(request, "Method not allowed", "<p>Use this form to submit your recommendation.</p>", 405);

  const form = await request.formData();
  if (form.get("token") !== token) return page(request, "Recommendation link unavailable", "<p>This link is invalid or expired.</p>", 400);
  const recommendation = form.get("recommendation");
  if (typeof recommendation !== "string" || !recommendation.trim() || recommendation.length > 5000) {
    return page(request, "Recommendation required", "<p>Enter a recommendation of no more than 5,000 characters.</p>", 400);
  }
  const { error: submitError } = await admin.rpc("submit_referee_response", {
    p_token_hash: tokenHash,
    p_recommendation: { recommendation: recommendation.trim() },
  });
  if (submitError) return page(request, "Recommendation link unavailable", "<p>This link is invalid, expired or already used.</p>", 410);
  return page(request, "Recommendation submitted", "<p>Thank you. Your confidential recommendation has been received.</p>");
});
