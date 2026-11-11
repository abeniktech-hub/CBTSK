import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";

const url = process.env.CBTS_TEST_SUPABASE_URL;
const serviceKey = process.env.CBTS_TEST_SERVICE_ROLE_KEY;
const anonKey = process.env.CBTS_TEST_ANON_KEY;
const configured = Boolean(url && serviceKey && anonKey);
const local = url ? ["localhost", "127.0.0.1", "supabase"].includes(new URL(url).hostname) : false;
const allowed = configured && (local || process.env.CBTS_ALLOW_REMOTE_TESTS === "1");
const skipReason = configured && !allowed
  ? "Set CBTS_ALLOW_REMOTE_TESTS=1 to run destructive test-user cleanup against a non-local test project."
  : "Set CBTS_TEST_SUPABASE_URL, CBTS_TEST_SERVICE_ROLE_KEY and CBTS_TEST_ANON_KEY for an isolated test project.";

const admin = allowed
  ? createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;

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
  await Promise.all(applicants.map(({ id }) => admin.auth.admin.deleteUser(id)));
}

test("50 concurrent signup triggers allocate unique matricules", { skip: allowed ? false : skipReason }, async (t) => {
  const applicants = [];
  t.after(() => removeApplicants(applicants));
  const created = await Promise.all(Array.from({ length: 50 }, () => createApplicant()));
  applicants.push(...created);
  const { data, error } = await admin.from("applications").select("user_id,matricule")
    .in("user_id", created.map((applicant) => applicant.id));
  assert.ifError(error);
  assert.equal(data.length, 50);
  assert.equal(new Set(data.map((row) => row.matricule)).size, 50);
});

test("applicant RLS blocks cross-account reads and protected updates", { skip: allowed ? false : skipReason }, async (t) => {
  const applicants = [await createApplicant(), await createApplicant()];
  t.after(() => removeApplicants(applicants));
  const { data: apps, error: appError } = await admin.from("applications").select("id,user_id,status")
    .in("user_id", applicants.map((applicant) => applicant.id));
  assert.ifError(appError);
  const ownApplication = apps.find((application) => application.user_id === applicants[0].id);
  const otherApplication = apps.find((application) => application.user_id === applicants[1].id);
  assert.ok(ownApplication);
  assert.ok(otherApplication);

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

  const { data: changed, error: updateError } = await client.from("applications")
    .update({ status: "ADMITTED" }).eq("id", ownApplication.id).select("id");
  assert.ok(updateError || !changed?.length, "applicant update must fail or affect no rows");
  const { data: unchanged, error: verifyError } = await admin.from("applications")
    .select("status").eq("id", ownApplication.id).single();
  assert.ifError(verifyError);
  assert.equal(unchanged.status, "DRAFT");
});

test("login quote selection avoids recent repeats and remains stable on refresh", { skip: allowed ? false : skipReason }, async (t) => {
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
