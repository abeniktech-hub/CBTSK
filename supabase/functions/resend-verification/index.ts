import { authenticatedClient, json, preflight, serviceClient } from "../_shared/http.ts";

Deno.serve(async (request) => {
  const options = preflight(request);
  if (options) return options;
  if (request.method !== "POST") return json(request, { error: "Method not allowed." }, 405);
  const authenticated = await authenticatedClient(request);
  if (!authenticated || !authenticated.user.email) {
    return json(request, { error: "If the address can receive email, a verification message will be sent." }, 200);
  }
  if (authenticated.user.email_confirmed_at) {
    return json(request, { error: "If the address can receive email, a verification message will be sent." }, 200);
  }

  const admin = serviceClient();
  const { data: allowed, error: limitError } = await admin.rpc("claim_verification_resend", {
    p_user_id: authenticated.user.id,
  });
  if (limitError) return json(request, { error: "Verification is temporarily unavailable." }, 503);
  if (!allowed) return json(request, { error: "Please wait before requesting another verification email." }, 429);

  const { error: resendError } = await authenticated.client.auth.resend({
    type: "signup",
    email: authenticated.user.email,
  });
  if (resendError) {
    return json(request, { error: "If the address can receive email, a verification message will be sent." }, 200);
  }
  return json(request, { sent: true });
});
