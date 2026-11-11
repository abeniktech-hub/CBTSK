import { authenticatedClient, json, preflight, serviceClient } from "../_shared/http.ts";

const bucket = "application-documents";

Deno.serve(async (request) => {
  const options = preflight(request);
  if (options) return options;
  if (request.method !== "POST") return json(request, { error: "Method not allowed." }, 405);
  const authenticated = await authenticatedClient(request);
  if (!authenticated) return json(request, { error: "Authentication required." }, 401);

  const body = await request.json().catch(() => null);
  if (!body || typeof body.documentId !== "string" || !["sign", "delete"].includes(body.action)) {
    return json(request, { error: "Invalid document request." }, 400);
  }

  const admin = serviceClient();
  const { data: document, error: lookupError } = await admin.from("documents")
    .select("id,application_id,owner_id,storage_path,scan_status")
    .eq("id", body.documentId).maybeSingle();
  if (lookupError || !document || document.owner_id !== authenticated.user.id) {
    return json(request, { error: "Document not found." }, 404);
  }

  const { data: application, error: applicationError } = await authenticated.client.from("applications")
    .select("status").eq("id", document.application_id).maybeSingle();
  if (applicationError || !application) return json(request, { error: "Document not found." }, 404);

  if (body.action === "delete") {
    if (application.status !== "DRAFT") return json(request, { error: "Submitted applications are locked." }, 409);
    const { error: storageError } = await admin.storage.from(bucket).remove([document.storage_path]);
    if (storageError) return json(request, { error: "Document could not be deleted." }, 502);
    const { error: deleteError } = await admin.from("documents").delete().eq("id", document.id);
    if (deleteError) return json(request, { error: "Document record could not be deleted." }, 500);
    return json(request, { deleted: true });
  }

  if (document.scan_status !== "CLEAN") {
    return json(request, { error: "Document preview is available after the security scan." }, 409);
  }
  const { data: signed, error: signedError } = await admin.storage.from(bucket)
    .createSignedUrl(document.storage_path, 300);
  if (signedError || !signed) return json(request, { error: "Document preview is unavailable." }, 502);
  return json(request, { signedUrl: signed.signedUrl, expiresIn: 300 });
});
