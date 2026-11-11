import { authenticatedClient, json, preflight, serviceClient } from "../_shared/http.ts";

Deno.serve(async (request) => {
  const options = preflight(request);
  if (options) return options;
  if (request.method !== "POST") return json(request, { error: "Method not allowed." }, 405);
  const authenticated = await authenticatedClient(request);
  if (!authenticated) return json(request, { error: "Authentication required." }, 401);

  const body = await request.json().catch(() => null);
  if (!body || typeof body.applicationId !== "string") return json(request, { error: "Invalid application request." }, 400);
  const { data: application, error: applicationError } = await authenticated.client.from("applications")
    .select("id,user_id,matricule,status").eq("id", body.applicationId).maybeSingle();
  if (applicationError || !application || application.user_id !== authenticated.user.id || application.status !== "SUBMITTED") {
    return json(request, { error: "Submitted application not found." }, 404);
  }
  if (!authenticated.user.email) return json(request, { error: "Email address unavailable." }, 409);

  const resendKey = Deno.env.get("RESEND_API_KEY");
  const mailFrom = Deno.env.get("MAIL_FROM");
  if (!resendKey || !mailFrom) return json(request, { error: "Confirmation email is not configured." }, 503);

  const admin = serviceClient();
  const { data: outbox, error: outboxError } = await admin.from("email_outbox")
    .select("id,status,updated_at,attempts").eq("application_id", application.id)
    .eq("kind", "SUBMISSION_CONFIRMATION").maybeSingle();
  if (outboxError || !outbox) return json(request, { error: "Confirmation message is not queued." }, 500);
  if (outbox.status === "SENT") return json(request, { sent: true, duplicate: true });
  if (outbox.status === "PROCESSING" && Date.now() - new Date(outbox.updated_at).getTime() < 10 * 60 * 1000) {
    return json(request, { sent: false, pending: true }, 202);
  }
  const { data: claimed, error: claimError } = await admin.rpc("claim_submission_email", {
    p_application_id: application.id,
  });
  if (claimError) return json(request, { error: "Confirmation email could not be claimed." }, 500);
  if (!claimed) return json(request, { sent: false, pending: true }, 202);

  const mailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `cbts-application-${application.id}`,
    },
    body: JSON.stringify({
      from: mailFrom,
      to: [authenticated.user.email],
      subject: "CBTS application received",
      text: `Your CBTS application has been submitted.\n\nMatricule: ${application.matricule}\n\nSign in to the applicant portal to track its status.`,
    }),
  });
  if (!mailResponse.ok) {
    const { error: retryError } = await admin.from("email_outbox")
      .update({ status: "PENDING", last_error: "Email provider rejected the message." }).eq("id", outbox.id);
    if (retryError) return json(request, { error: "Email delivery failed and retry state could not be saved." }, 500);
    return json(request, { error: "Confirmation email could not be delivered. It can be retried later." }, 502);
  }
  const { error: sentError } = await admin.from("email_outbox")
    .update({ status: "SENT", sent_at: new Date().toISOString(), last_error: null }).eq("id", outbox.id);
  if (sentError) return json(request, { error: "Email was delivered but its status could not be recorded." }, 500);
  return json(request, { sent: true });
});
