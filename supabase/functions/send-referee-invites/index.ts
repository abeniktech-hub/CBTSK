import { authenticatedClient, json, preflight, serviceClient } from "../_shared/http.ts";

async function digest(value: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (request) => {
  const options = preflight(request);
  if (options) return options;
  if (request.method !== "POST") return json(request, { error: "Method not allowed." }, 405);
  const authenticated = await authenticatedClient(request);
  if (!authenticated) return json(request, { error: "Authentication required." }, 401);

  const body = await request.json().catch(() => null);
  if (!body || typeof body.applicationId !== "string") {
    return json(request, { error: "Invalid application request." }, 400);
  }
  const { data: application, error: applicationError } = await authenticated.client
    .from("applications").select("id,status,user_id").eq("id", body.applicationId).maybeSingle();
  if (applicationError || !application || application.user_id !== authenticated.user.id || application.status !== "DRAFT") {
    return json(request, { error: "Application not available." }, 403);
  }

  const resendKey = Deno.env.get("RESEND_API_KEY");
  const mailFrom = Deno.env.get("MAIL_FROM");
  const siteUrl = Deno.env.get("PORTAL_SITE_URL");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!resendKey || !mailFrom || !siteUrl || !supabaseUrl) {
    return json(request, { error: "Referee email is not configured." }, 503);
  }

  const admin = serviceClient();
  const { data: referees, error: refereeError } = await admin.from("referees")
    .select("id,name,email,status").eq("application_id", application.id).eq("status", "PENDING");
  if (refereeError) return json(request, { error: "Referee requests could not be prepared." }, 500);
  if (!referees?.length) return json(request, { error: "No pending referees were found." }, 409);

  const { data: activeInvites, error: inviteLookupError } = await admin.from("referee_invites")
    .select("referee_id").in("referee_id", referees.map((referee) => referee.id))
    .is("consumed_at", null).gt("expires_at", new Date().toISOString());
  if (inviteLookupError) return json(request, { error: "Referee requests could not be checked." }, 500);
  const activeIds = new Set((activeInvites ?? []).map((invite) => invite.referee_id));
  const pending = referees.filter((referee) => !activeIds.has(referee.id));
  if (!pending.length) return json(request, { sent: 0, pending: referees.length });

  let sent = 0;
  for (const referee of pending) {
    const token = randomToken();
    const tokenHash = await digest(token);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: invite, error: insertError } = await admin.from("referee_invites")
      .insert({ referee_id: referee.id, token_hash: tokenHash, expires_at: expiresAt })
      .select("id").single();
    if (insertError || !invite) {
      return json(request, { error: "A referee request could not be saved." }, 500);
    }

    const link = `${supabaseUrl}/functions/v1/referee-response?token=${encodeURIComponent(token)}`;
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: mailFrom,
        to: [referee.email],
        subject: "CBTS reference request",
        text: `Dear ${referee.name},\n\nYou have been invited to provide a confidential recommendation for a CBTS applicant. Submit it using this private link within seven days:\n\n${link}\n\nThe applicant will not be able to read your recommendation.`,
      }),
    });
    if (!response.ok) {
      const { error: deleteError } = await admin.from("referee_invites").delete().eq("id", invite.id);
      if (deleteError) console.error("Could not remove an unsent referee invite.");
      return json(request, { error: "A referee email could not be delivered. Try again later." }, 502);
    }
    sent += 1;
    const { error: auditError } = await admin.from("audit_log").insert({
      actor_id: authenticated.user.id,
      action: "referee.invite",
      entity_type: "application",
      entity_id: application.id,
      details: { referee_id: referee.id },
    });
    if (auditError) return json(request, { error: "A referee request was sent but could not be audited." }, 500);
  }

  return json(request, { sent, pending: referees.length });
});
