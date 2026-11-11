import assert from "node:assert/strict";
import test from "node:test";
import { getTestProjectConfig } from "./helpers/test-project-config.mjs";

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
