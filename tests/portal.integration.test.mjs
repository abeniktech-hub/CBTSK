import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { getTestProjectConfig } from "./helpers/test-project-config.mjs";

const { url, serviceKey, anonKey } = getTestProjectConfig();
const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const migrationsDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../supabase/migrations");

async function createApplicant(suffix = randomUUID()) {
  const email = `portal-test-${suffix}@example.test`;
  const password = `CBTS-test-${randomUUID()}-A9!`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: "Test", last_name: "Applicant", phone: "+237600000000" },
  });
  assert.ifError(error);
  assert.ok(data.user);
  return { id: data.user.id, email, password };
}

async function removeApplicants(applicants) {
  const results = await Promise.all(applicants.map(({ id }) => admin.auth.admin.deleteUser(id)));
  for (const { error } of results) assert.ifError(error);
}

test("50 concurrent signup triggers allocate unique matricules", async (t) => {
  const applicants = [];
  t.after(async () => {
    if (applicants.length) await removeApplicants(applicants);
  });
  const created = await Promise.all(Array.from({ length: 50 }, () => createApplicant()));
  applicants.push(...created);
  const { data, error } = await admin.from("applications").select("user_id,matricule")
    .in("user_id", created.map((applicant) => applicant.id));
  assert.ifError(error);
  assert.equal(data.length, 50);
  assert.equal(new Set(data.map((row) => row.matricule)).size, 50);
});

test("applicant RLS blocks cross-account reads", async (t) => {
  const applicants = [await createApplicant(), await createApplicant()];
  let storagePath;
  t.after(async () => {
    if (storagePath) {
      const { error } = await admin.storage.from("application-documents").remove([storagePath]);
      assert.ifError(error);
    }
    await removeApplicants(applicants);
  });
  const { data: apps, error: appError } = await admin.from("applications").select("id,user_id,status")
    .in("user_id", applicants.map((applicant) => applicant.id));
  assert.ifError(appError);
  const ownApplication = apps.find((application) => application.user_id === applicants[0].id);
  const otherApplication = apps.find((application) => application.user_id === applicants[1].id);
  assert.ok(ownApplication);
  assert.ok(otherApplication);

  storagePath = `${applicants[1].id}/rls-test-${randomUUID()}.pdf`;
  const { data: storedObject, error: uploadError } = await admin.storage.from("application-documents")
    .upload(storagePath, new Blob(["%PDF-1.4 test document"], { type: "application/pdf" }), {
      contentType: "application/pdf",
    });
  assert.ifError(uploadError);
  assert.ok(storedObject);
  const { data: otherDocument, error: documentInsertError } = await admin.from("documents").insert({
    application_id: otherApplication.id,
    owner_id: applicants[1].id,
    kind: "rls-test",
    storage_path: storagePath,
    mime_type: "application/pdf",
    size_bytes: 22,
  }).select("id").single();
  assert.ifError(documentInsertError);

  const client = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error: signInError } = await client.auth.signInWithPassword({
    email: applicants[0].email,
    password: applicants[0].password,
  });
  assert.ifError(signInError);
  const { data: hidden, error: readError } = await client.from("applications")
    .select("id").eq("id", otherApplication.id);
  assert.ifError(readError);
  assert.deepEqual(hidden, []);

  const { data: changedApplication, error: applicationUpdateError } = await client.from("applications")
    .update({ department: "unauthorized" }).eq("id", otherApplication.id).select("id");
  assert.ok(applicationUpdateError || !changedApplication?.length, "applicant must not update another application");

  const { data: hiddenDocuments, error: documentReadError } = await client.from("documents")
    .select("id").eq("id", otherDocument.id);
  assert.ifError(documentReadError);
  assert.deepEqual(hiddenDocuments, []);
  const { data: changedDocument, error: documentUpdateError } = await client.from("documents")
    .update({ kind: "unauthorized" }).eq("id", otherDocument.id).select("id");
  assert.ok(documentUpdateError || !changedDocument?.length, "applicant must not update another applicant's document");

  const { data: otherFiles, error: listError } = await client.storage.from("application-documents")
    .list(applicants[1].id);
  assert.ok(listError || !otherFiles?.length, "applicant must not list another applicant's files");
  const { data: downloadedFile, error: downloadError } = await client.storage.from("application-documents")
    .download(storagePath);
  assert.ok(downloadError || !downloadedFile, "applicant must not download another applicant's file");

  const attemptedPath = `${applicants[1].id}/applicant-write-${randomUUID()}.pdf`;
  const { error: storageWriteError } = await client.storage.from("application-documents")
    .upload(attemptedPath, new Blob(["unauthorized"], { type: "application/pdf" }), {
      contentType: "application/pdf",
    });
  assert.ok(storageWriteError, "applicant must not upload into another applicant's folder");
  const { data: removedFiles, error: storageDeleteError } = await client.storage.from("application-documents")
    .remove([storagePath]);
  assert.ok(storageDeleteError || !removedFiles?.length, "applicant must not delete another applicant's file");
});

test("anon REST access returns no rows from private public-schema tables", async () => {
  const migrationFiles = (await readdir(migrationsDirectory)).filter((file) => file.endsWith(".sql"));
  const tables = new Set();
  for (const migrationFile of migrationFiles) {
    const sql = await readFile(path.join(migrationsDirectory, migrationFile), "utf8");
    for (const match of sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?public\.([a-z_][a-z0-9_]*)/gi)) {
      tables.add(match[1]);
    }
  }
  assert.ok(tables.size > 0, "public tables must be discoverable from SQL migrations");

  for (const table of tables) {
    const response = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        Accept: "application/json",
      },
    });
    if (response.status === 401 || response.status === 403) continue;
    assert.equal(response.status, 200, `anon REST request for public.${table} should succeed or be denied`);
    const rows = await response.json();
    assert.ok(Array.isArray(rows), `public.${table} REST response must be an array`);
    assert.deepEqual(rows, [], `public.${table} must not return rows to the anon key`);
  }
});

test("applicant cannot update matricule, status, role, payment status, or exam score", async (t) => {
  const applicant = await createApplicant();
  t.after(() => removeApplicants([applicant]));
  const { data: application, error: applicationError } = await admin.from("applications")
    .select("id,matricule,status,payment_status,exam_score").eq("user_id", applicant.id).single();
  assert.ifError(applicationError);
  const { data: profile, error: profileError } = await admin.from("profiles")
    .select("role").eq("id", applicant.id).single();
  assert.ifError(profileError);

  const client = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error: signInError } = await client.auth.signInWithPassword({
    email: applicant.email,
    password: applicant.password,
  });
  assert.ifError(signInError);

  const attempts = [
    { table: "applications", id: application.id, column: "matricule", value: `${application.matricule}-CHANGED`, oldValue: application.matricule },
    { table: "applications", id: application.id, column: "status", value: "ADMITTED", oldValue: application.status },
    { table: "profiles", id: applicant.id, column: "role", value: "ADMIN", oldValue: profile.role },
    { table: "applications", id: application.id, column: "payment_status", value: "PAID", oldValue: application.payment_status },
    { table: "applications", id: application.id, column: "exam_score", value: 100, oldValue: application.exam_score },
  ];

  for (const attempt of attempts) {
    const { data: changed, error } = await client.from(attempt.table)
      .update({ [attempt.column]: attempt.value }).eq("id", attempt.id).select(attempt.column);
    assert.ok(error || !changed?.length, `applicant must not update ${attempt.table}.${attempt.column}`);

    const { data: unchanged, error: verifyError } = await admin.from(attempt.table)
      .select(attempt.column).eq("id", attempt.id).single();
    assert.ifError(verifyError);
    assert.equal(unchanged[attempt.column], attempt.oldValue, `${attempt.table}.${attempt.column} must remain unchanged`);
  }
});

test("login quote selection avoids recent repeats and remains stable on refresh", async (t) => {
  const [applicant, alternateApplicant] = await Promise.all([createApplicant(), createApplicant()]);
  t.after(() => removeApplicants([applicant, alternateApplicant]));
  const alternateClient = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error: alternateSignInError } = await alternateClient.auth.signInWithPassword({
    email: alternateApplicant.email,
    password: alternateApplicant.password,
  });
  assert.ifError(alternateSignInError);
  const { data: firstQuote, error: firstLoginError } = await alternateClient.rpc("record_login_and_pick_quote");
  assert.ifError(firstLoginError);
  assert.ok(firstQuote?.id);
  const shown = new Set([firstQuote.id]);
  for (let index = 0; index < 3; index += 1) {
    const { data: alternate, error } = await alternateClient.rpc("pick_another_login_quote");
    assert.ifError(error);
    if (alternate?.id) shown.add(alternate.id);
  }
  const { data: overLimit, error: limitError } = await alternateClient.rpc("pick_another_login_quote");
  assert.ifError(limitError);
  assert.ok(!overLimit?.id, "the server must enforce at most three alternate quotes per login");
  assert.ok(shown.size <= 4);

  const client = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error: signInError } = await client.auth.signInWithPassword({
    email: applicant.email,
    password: applicant.password,
  });
  assert.ifError(signInError);

  const selections = [];
  for (let index = 0; index < 5; index += 1) {
    const { data: quote, error } = await client.rpc("record_login_and_pick_quote");
    assert.ifError(error);
    assert.ok(quote?.id, "approved seed quotes must be present in the test database");
    selections.push(quote.id);
    const { data: firstRead, error: firstError } = await client.from("login_events")
      .select("quote_id").eq("user_id", applicant.id).order("created_at", { ascending: false }).limit(1).single();
    const { data: refreshRead, error: refreshError } = await client.from("login_events")
      .select("quote_id").eq("user_id", applicant.id).order("created_at", { ascending: false }).limit(1).single();
    assert.ifError(firstError);
    assert.ifError(refreshError);
    assert.equal(firstRead.quote_id, quote.id);
    assert.equal(refreshRead.quote_id, firstRead.quote_id);
  }
  assert.equal(new Set(selections).size, selections.length, "quotes should not repeat within the recent-login window");
});

test("referee responses reject expired and reused tokens", async (t) => {
  const applicant = await createApplicant();
  t.after(() => removeApplicants([applicant]));
  const { data: application, error: applicationError } = await admin.from("applications")
    .select("id").eq("user_id", applicant.id).single();
  assert.ifError(applicationError);
  const { data: referee, error: refereeError } = await admin.from("referees").insert({
    application_id: application.id,
    kind: "pastor",
    name: "Test Referee",
    email: `referee-${randomUUID()}@example.test`,
    phone: "+237600000001",
  }).select("id").single();
  assert.ifError(refereeError);

  const expiredHash = createHash("sha256").update(randomUUID()).digest("hex");
  const activeHash = createHash("sha256").update(randomUUID()).digest("hex");
  const { error: inviteError } = await admin.from("referee_invites").insert([
    { referee_id: referee.id, token_hash: expiredHash, expires_at: new Date(Date.now() - 60_000).toISOString() },
    { referee_id: referee.id, token_hash: activeHash, expires_at: new Date(Date.now() + 60_000).toISOString() },
  ]);
  assert.ifError(inviteError);

  const recommendation = { recommendation: "A suitable candidate." };
  const { error: expiredError } = await admin.rpc("submit_referee_response", {
    p_token_hash: expiredHash,
    p_recommendation: recommendation,
  });
  assert.match(expiredError?.message ?? "", /invalid or expired/i);

  const { error: submitError } = await admin.rpc("submit_referee_response", {
    p_token_hash: activeHash,
    p_recommendation: recommendation,
  });
  assert.ifError(submitError);
  const { error: reuseError } = await admin.rpc("submit_referee_response", {
    p_token_hash: activeHash,
    p_recommendation: recommendation,
  });
  assert.match(reuseError?.message ?? "", /invalid or expired/i);

  const { data: savedReferee, error: savedRefereeError } = await admin.from("referees")
    .select("status").eq("id", referee.id).single();
  const { data: responses, error: responseError } = await admin.from("referee_responses")
    .select("id").eq("referee_id", referee.id);
  assert.ifError(savedRefereeError);
  assert.ifError(responseError);
  assert.equal(savedReferee.status, "RECEIVED");
  assert.equal(responses.length, 1);
});

test("unverified applicants cannot establish a session to submit", async (t) => {
  const email = `portal-unverified-${randomUUID()}@example.test`;
  const password = `CBTS-test-${randomUUID()}-A9!`;
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
    user_metadata: { first_name: "Test", last_name: "Applicant", phone: "+237600000000" },
  });
  assert.ifError(createError);
  assert.ok(created.user);
  t.after(async () => {
    const { error } = await admin.auth.admin.deleteUser(created.user.id);
    assert.ifError(error);
  });
  const client = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: signIn, error: signInError } = await client.auth.signInWithPassword({ email, password });
  assert.ok(signInError, "unverified applicants must not receive an authenticated session");
  assert.equal(signIn.session, null);
});

test("submitted applications reject further applicant edits", async (t) => {
  const applicant = await createApplicant();
  t.after(() => removeApplicants([applicant]));
  const { data: application, error: applicationError } = await admin.from("applications")
    .select("id").eq("user_id", applicant.id).single();
  assert.ifError(applicationError);
  const { error: statusError } = await admin.from("applications")
    .update({ status: "SUBMITTED", submitted_at: new Date().toISOString() }).eq("id", application.id);
  assert.ifError(statusError);

  const client = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error: signInError } = await client.auth.signInWithPassword({
    email: applicant.email,
    password: applicant.password,
  });
  assert.ifError(signInError);
  const { error: completionError } = await client.rpc("complete_application_step", {
    p_application_id: application.id,
    p_step_key: "personal_information",
    p_data: { first_name: "Changed" },
  });
  assert.match(completionError?.message ?? "", /application not available/i);

  const { error: progressError } = await client.from("step_progress").insert({
    application_id: application.id,
    step_key: "personal_information",
    status: "COMPLETE",
    data: { first_name: "Changed" },
  });
  assert.ok(progressError, "applicants must not add progress to a submitted application");
});

test("applicants cannot access staff-only application controls", async (t) => {
  const applicant = await createApplicant();
  t.after(() => removeApplicants([applicant]));
  const { data: application, error: applicationError } = await admin.from("applications")
    .select("id,status").eq("user_id", applicant.id).single();
  assert.ifError(applicationError);
  const client = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error: signInError } = await client.auth.signInWithPassword({
    email: applicant.email,
    password: applicant.password,
  });
  assert.ifError(signInError);

  const { error: statusError } = await client.rpc("admin_set_application_status", {
    p_application_id: application.id,
    p_status: "SUBMITTED",
  });
  assert.match(statusError?.message ?? "", /staff access required/i);
  const { data: auditRows, error: auditError } = await client.from("audit_log").select("id").limit(1);
  assert.ifError(auditError);
  assert.deepEqual(auditRows, []);
  const { data: unchanged, error: unchangedError } = await admin.from("applications")
    .select("status").eq("id", application.id).single();
  assert.ifError(unchangedError);
  assert.equal(unchanged.status, application.status);
});
