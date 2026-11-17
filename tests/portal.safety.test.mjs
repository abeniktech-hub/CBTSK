import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { getTestProjectConfig } from "./helpers/test-project-config.mjs";
import { detectedFile } from "../supabase/functions/_shared/document-file.mjs";
import { signatureMatches } from "../supabase/functions/_shared/payment-signature.mjs";

const testRef = "abcdefghijklmnopqrst";
const productionRef = "zyxwvutsrqponmlkjihg";
const projectUrl = (ref) => ["https:", "", `${ref}.supabase.co`].join("/");
const validConfig = {
  SUPABASE_URL: projectUrl(testRef),
  SUPABASE_ANON_KEY: "test-anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
  TEST_PROJECT_REF: testRef,
  PRODUCTION_PROJECT_REF: productionRef,
};

test("test-project guard accepts only the explicitly allowlisted project URL", () => {
  assert.equal(getTestProjectConfig(validConfig).testRef, validConfig.TEST_PROJECT_REF);
  assert.throws(
    () => getTestProjectConfig({ ...validConfig, SUPABASE_URL: projectUrl(productionRef) }),
    /SUPABASE_URL must exactly match TEST_PROJECT_REF/,
  );
});

test("test-project guard refuses the production project", () => {
  assert.throws(
    () => getTestProjectConfig({
      ...validConfig,
      TEST_PROJECT_REF: validConfig.PRODUCTION_PROJECT_REF,
      SUPABASE_URL: projectUrl(validConfig.PRODUCTION_PROJECT_REF),
    }),
    /matches PRODUCTION_PROJECT_REF/,
  );
});

test("test-project guard refuses incomplete configuration", () => {
  assert.throws(
    () => getTestProjectConfig({}),
    /SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, TEST_PROJECT_REF, PRODUCTION_PROJECT_REF/,
  );
});

test("payment webhook signature binds the exact raw payload", async () => {
  const secret = "local-webhook-test-secret";
  const body = JSON.stringify({ reference: "test-reference", amount: 125 });
  const signature = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;

  assert.equal(await signatureMatches(secret, body, signature), true);
  assert.equal(await signatureMatches(secret, `${body} `, signature), false);
  assert.equal(await signatureMatches("different-test-secret", body, signature), false);
  assert.equal(await signatureMatches(secret, body, "sha256=invalid"), false);
  assert.equal(await signatureMatches(secret, body, null), false);
});

test("upload validation rejects an executable renamed as a PDF", () => {
  const renamedFile = {
    name: "renamed.pdf",
    type: "application/pdf",
    bytes: Uint8Array.from([0x4d, 0x5a, 0x90, 0x00]),
  };

  assert.equal(detectedFile(renamedFile.bytes), null);
});
