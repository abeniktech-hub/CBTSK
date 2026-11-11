import { json, serviceClient } from "../_shared/http.ts";
import { MobileMoneyCardProvider } from "../_shared/payment-provider.ts";

function bytesFromHex(value: string): Uint8Array | null {
  if (!/^[a-f0-9]{64}$/i.test(value)) return null;
  return new Uint8Array(value.match(/.{2}/g)!.map((pair) => Number.parseInt(pair, 16)));
}

async function signatureMatches(secret: string, rawBody: string, supplied: string | null): Promise<boolean> {
  if (!supplied?.startsWith("sha256=")) return false;
  const suppliedBytes = bytesFromHex(supplied.slice(7));
  if (!suppliedBytes) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const expected = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody)));
  if (expected.length !== suppliedBytes.length) return false;
  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) mismatch |= expected[index] ^ suppliedBytes[index];
  return mismatch === 0;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json(request, { error: "Method not allowed." }, 405);
  const secret = Deno.env.get("PAYMENT_WEBHOOK_SECRET");
  const verifyUrl = Deno.env.get("PAYMENT_PROVIDER_VERIFY_URL");
  const apiKey = Deno.env.get("PAYMENT_PROVIDER_API_KEY");
  if (!secret || !verifyUrl || !apiKey) return json(request, { error: "Payment verification is not configured." }, 503);

  const rawBody = await request.text();
  if (!await signatureMatches(secret, rawBody, request.headers.get("x-cbts-signature"))) {
    return json(request, { error: "Invalid webhook signature." }, 401);
  }
  let event: { reference?: unknown };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return json(request, { error: "Invalid webhook payload." }, 400);
  }
  if (typeof event.reference !== "string" || event.reference.length > 200) {
    return json(request, { error: "Invalid payment reference." }, 400);
  }

  const admin = serviceClient();
  const { data: payment, error: paymentError } = await admin.from("payments")
    .select("id,application_id,amount,currency,status,provider_reference")
    .eq("provider_reference", event.reference).maybeSingle();
  if (paymentError || !payment) return json(request, { error: "Payment not found." }, 404);
  if (payment.status === "PAID") return json(request, { received: true, duplicate: true });

  const provider = new MobileMoneyCardProvider(
    Deno.env.get("PAYMENT_PROVIDER_CREATE_URL") ?? "",
    verifyUrl,
    apiKey,
  );
  let verification;
  try {
    verification = await provider.verify(payment.provider_reference);
  } catch {
    return json(request, { error: "Provider verification is temporarily unavailable." }, 502);
  }
  if (verification.status !== "PAID" || verification.amount !== payment.amount ||
      verification.currency !== payment.currency) {
    return json(request, { error: "Provider payment details do not match the recorded payment." }, 409);
  }

  const verifiedAt = new Date().toISOString();
  const { error: updatePaymentError } = await admin.from("payments")
    .update({ status: "PAID", verified_at: verifiedAt })
    .eq("id", payment.id).eq("status", "PENDING");
  if (updatePaymentError) return json(request, { error: "Verified payment could not be recorded." }, 500);
  const { error: updateApplicationError } = await admin.from("applications")
    .update({ payment_status: "PAID" }).eq("id", payment.application_id);
  if (updateApplicationError) return json(request, { error: "Application payment status could not be updated." }, 500);
  const { error: auditError } = await admin.from("audit_log").insert({
    action: "payment.verified",
    entity_type: "payment",
    entity_id: payment.id,
    details: { provider_reference: payment.provider_reference },
  });
  if (auditError) return json(request, { error: "Verified payment could not be audited." }, 500);
  return json(request, { received: true });
});
