const requiredVariables = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "TEST_PROJECT_REF",
  "PRODUCTION_PROJECT_REF",
];

export function getTestProjectConfig(env = process.env) {
  const missing = requiredVariables.filter((name) => !env[name]?.trim());
  if (missing.length) {
    throw new Error(`Integration tests require these .env.test variables: ${missing.join(", ")}`);
  }

  const testRef = env.TEST_PROJECT_REF.trim();
  const productionRef = env.PRODUCTION_PROJECT_REF.trim();
  if (!/^[a-z0-9]{20}$/.test(testRef)) {
    throw new Error("TEST_PROJECT_REF must be the 20-character ref of the dedicated test project.");
  }
  if (!/^[a-z0-9]{20}$/.test(productionRef)) {
    throw new Error("PRODUCTION_PROJECT_REF must be the 20-character production project ref.");
  }
  if (testRef === productionRef) {
    throw new Error("Refusing to run integration tests: TEST_PROJECT_REF matches PRODUCTION_PROJECT_REF.");
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(env.SUPABASE_URL);
  } catch {
    throw new Error("SUPABASE_URL must be the HTTPS URL of the dedicated test project.");
  }
  if (
    parsedUrl.protocol !== "https:" ||
    parsedUrl.hostname !== `${testRef}.supabase.co` ||
    parsedUrl.port ||
    (parsedUrl.pathname !== "/" && parsedUrl.pathname !== "") ||
    parsedUrl.search ||
    parsedUrl.hash
  ) {
    throw new Error("Refusing to run integration tests: SUPABASE_URL must exactly match TEST_PROJECT_REF.");
  }

  return {
    url: parsedUrl.origin,
    anonKey: env.SUPABASE_ANON_KEY,
    serviceKey: env.SUPABASE_SERVICE_ROLE_KEY,
    testRef,
  };
}
