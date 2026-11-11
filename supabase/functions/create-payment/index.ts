import { authenticatedClient, json, preflight, serviceClient } from "../_shared/http.ts";
import { MobileMoneyCardProvider } from "../_shared/payment-provider.ts";

Deno.serve(async (request) => {
  const options = preflight(request);
  if (options) return options;
  if (request.method !== "POST") return json(request, { error: "Method not allowed." }, 405);
  const authenticated = await authenticatedClient(request);
  if (!authenticated) return json(request, { error: "Authentication required." }, 401);

  const body = await request.json().catch(() => null);
  if (!body || typeof body.applicationId !== "string") return json(request, { error: "Invalid payment request." }, 400);
  const { data: application, error: applicationError } = await authenticated.client.from("applications")
    .select("id,user_id,status,payment_status,programmes(level)").eq("id", body.applicationId).maybeSingle();
  if (applicationError || !application || application.user_id !== authenticated.user.id || application.status !== "DRAFT") {
    return json(request, { error: "Application not available for payment." }, 403);
  }
  if (application.payment_status === "PAID") return json(request, { error: "Payment is already verified." }, 409);
  const programme = Array.isArray(application.programmes) ? application.programmes[0] : application.programmes;
  if (!programme?.level) return json(request, { error: "Select a programme before payment." }, 409);

  const admin = serviceClient();
  const { data: fee, error: feeError } = await admin.from("fees").select("id,amount,currency")
    .eq("programme_level", programme.level).eq("active", true).maybeSingle();
  if (feeError || !fee) return json(request, { error: "The application fee is not configured." }, 503);
  const { data: existingPayment, error: existingError } = await admin.from("payments")
    .select("status,provider_checkout_url").eq("application_id", application.id)
    .in("status", ["PENDING", "PAID"]).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (existingError) return json(request, { error: "Payment status could not be checked." }, 500);
  if (existingPayment?.status === "PAID") return json(request, { error: "Payment is already verified." }, 409);
  if (existingPayment?.status === "PENDING" && existingPayment.provider_checkout_url) {
    return json(request, { checkoutUrl: existingPayment.provider_checkout_url, amount: fee.amount, currency: fee.currency });
  }

  const createUrl = Deno.env.get("PAYMENT_PROVIDER_CREATE_URL");
  const verifyUrl = Deno.env.get("PAYMENT_PROVIDER_VERIFY_URL");
  const apiKey = Deno.env.get("PAYMENT_PROVIDER_API_KEY");
  const siteUrl = Deno.env.get("PORTAL_SITE_URL");
  if (!createUrl || !verifyUrl || !apiKey || !siteUrl) return json(request, { error: "Online payment is not configured. Contact the Registrar." }, 503);
  const provider = new MobileMoneyCardProvider(createUrl, verifyUrl, apiKey);
  let checkout: Awaited<ReturnType<typeof provider.createCheckout>>;
  try {
    checkout = await provider.createCheckout(
      { amount: fee.amount, currency: "CFA" },
      { application_id: application.id, applicant_id: authenticated.user.id },
      `${siteUrl}/apply/dashboard`,
    );
  } catch {
    return json(request, { error: "The payment provider is unavailable or returned invalid checkout data." }, 502);
  }

  const { data: payment, error: paymentError } = await admin.from("payments").insert({
    application_id: application.id,
    fee_id: fee.id,
    amount: fee.amount,
    currency: fee.currency,
    provider: "configured-provider",
    provider_reference: checkout.reference,
    provider_checkout_url: checkout.checkoutUrl,
    status: "PENDING",
  }).select("id").single();
  if (paymentError || !payment) {
    return json(request, { error: "Payment could not be recorded." }, 500);
  }
  return json(request, { paymentId: payment.id, checkoutUrl: checkout.checkoutUrl, amount: fee.amount, currency: fee.currency }, 201);
});
