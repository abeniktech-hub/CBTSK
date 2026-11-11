import { authenticatedClient, json, preflight, serviceClient } from "../_shared/http.ts";

const bucket = "application-documents";
const maximumBytes = 5 * 1024 * 1024;

function detectedFile(bytes: Uint8Array): { mime: string; extension: string } | null {
  if (bytes.length >= 5 && new TextDecoder().decode(bytes.subarray(0, 5)) === "%PDF-") {
    return { mime: "application/pdf", extension: "pdf" };
  }
  if (bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value)) {
    return { mime: "image/png", extension: "png" };
  }
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) {
    return { mime: "image/jpeg", extension: "jpg" };
  }
  return null;
}

Deno.serve(async (request) => {
  const options = preflight(request);
  if (options) return options;
  if (request.method !== "POST") return json(request, { error: "Method not allowed." }, 405);

  const authenticated = await authenticatedClient(request);
  if (!authenticated) return json(request, { error: "Authentication required." }, 401);

  const form = await request.formData();
  const file = form.get("file");
  const applicationId = form.get("applicationId");
  const kind = form.get("kind");
  if (!(file instanceof File) || typeof applicationId !== "string" ||
      typeof kind !== "string" || !/^[a-z0-9_]{2,64}$/.test(kind)) {
    return json(request, { error: "Invalid document upload." }, 400);
  }
  if (file.size < 1 || file.size > maximumBytes) {
    return json(request, { error: "Documents must be no larger than 5 MB." }, 413);
  }

  const { data: application, error: applicationError } = await authenticated.client
    .from("applications").select("id,status,user_id").eq("id", applicationId).maybeSingle();
  if (applicationError || !application || application.user_id !== authenticated.user.id || application.status !== "DRAFT") {
    return json(request, { error: "Application not available for document updates." }, 403);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = detectedFile(bytes);
  if (!detected || detected.mime !== file.type) {
    return json(request, { error: "File content does not match an allowed PDF, JPG or PNG document." }, 415);
  }

  const admin = serviceClient();
  const path = `${authenticated.user.id}/${application.id}/${crypto.randomUUID()}.${detected.extension}`;
  const { error: uploadError } = await admin.storage.from(bucket).upload(path, bytes, {
    contentType: detected.mime,
    upsert: false,
  });
  if (uploadError) return json(request, { error: "Document could not be stored." }, 502);

  const { data: document, error: insertError } = await admin.from("documents").insert({
    application_id: application.id,
    owner_id: authenticated.user.id,
    kind,
    storage_path: path,
    mime_type: detected.mime,
    size_bytes: bytes.byteLength,
    scan_status: "PENDING",
  }).select("id,kind,scan_status").single();
  if (insertError || !document) {
    const { error: cleanupError } = await admin.storage.from(bucket).remove([path]);
    if (cleanupError) console.error("Could not remove orphaned application upload.");
    return json(request, { error: "Document record could not be created." }, 500);
  }

  return json(request, { document, scanStatus: "PENDING" }, 201);
});
