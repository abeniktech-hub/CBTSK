# CBTS Admissions Portal

## Cloudflare Workers deployment

The app is deployed as a Next.js Node.js-compatible Worker using `@opennextjs/cloudflare`. Static export is disabled. `middleware.ts` refreshes Supabase cookie sessions before portal routes render; this retained Next.js convention is used because the current OpenNext standalone trace does not include Next 16's `proxy.ts` output. No route declares `runtime = "edge"`; app routes use the Node.js-compatible Worker runtime. `src/lib/supabase/server.ts` provides a cookie-aware client for Server Components, Server Actions, and Route Handlers. Public/marketing pages remain statically generated where Next.js can do so.

The former GitHub Pages deployment workflow has been removed; connect this repository to Cloudflare Workers Builds instead. The Workers adapter requires Node.js 22.12 or later and Wrangler 4. OpenNext warns that local Windows builds may be less reliable; use the Linux Workers Builds environment for the deployment build.

### Environment variables

The app requires these two build-time public variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

In Cloudflare Workers Builds, add both as **build variables** so Next.js can inline them in browser bundles. They must point to the intended environment; for a test deployment, use only the test project URL and its anon/publishable key. These are public client values, not secrets. `NEXT_PUBLIC_SITE_URL` is an optional build variable used for canonical metadata and sitemap URLs.

The current Next.js Worker does not read server-only, mail, or payment credentials, so it requires **no Cloudflare runtime secrets**. Do not add secret values as build variables, `vars`, or `NEXT_PUBLIC_*` values. Supabase Edge Functions are a separate runtime; configure only the secrets those functions need in the corresponding Supabase project:

- Required by the functions using database clients: `SUPABASE_URL`, `SUPABASE_ANON_KEY` (authenticated function calls), and `SUPABASE_SERVICE_ROLE_KEY` (server-side admin client).
- Required for referee invites: `PORTAL_SITE_URL`, `RESEND_API_KEY`, and `MAIL_FROM`.
- Required for submission confirmation email: `RESEND_API_KEY` and `MAIL_FROM`.
- Required only when enabling payment functions: `PORTAL_SITE_URL`, `PAYMENT_PROVIDER_CREATE_URL`, `PAYMENT_PROVIDER_VERIFY_URL`, and `PAYMENT_PROVIDER_API_KEY`; the webhook also requires `PAYMENT_WEBHOOK_SECRET`.

Supabase Auth confirmation and password-reset emails use SMTP credentials configured in **Authentication → SMTP Settings** on that Supabase project; those credentials are not app environment variables. They are independent of Resend settings used by the Edge Functions.

### Deploy from Cloudflare Workers Builds

1. Connect the GitHub repository under **Workers & Pages → Workers Builds** and select `main`.
2. Set the build command to `npm run build:worker`; set the deploy command to `npx wrangler deploy`. The build script fails early if either required public Supabase build variable is missing.
3. Use Node.js 22.12+ for the build environment.
4. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as Workers Builds build variables before the first build.
5. The current Worker requires no runtime secrets. Configure credentials only in the Supabase Auth SMTP settings or the Supabase Edge Function secret store for the functions that use them.
6. Confirm the Worker name matches `wrangler.jsonc` (`cbtsk-26`). The existing `cbtsk-26.yaj-app.workers.dev` Worker is the test/demo deployment; do not attach the production domain or configure it with production Supabase credentials.
7. For a local build/preview, copy `.env.local.example` to `.env.local`, fill in the public Supabase values, and run `npm run preview`. `.dev.vars` supplies local Worker runtime values; the same public values can be copied from `.dev.vars.example`. For a direct CLI deployment, run `npm run deploy` after `npx wrangler login`.
8. Supabase Edge Functions are deployed separately with `npx supabase functions deploy <function-name>` and receive their own secrets with `npx supabase secrets set NAME=value`.

### Existing test/demo Worker

The existing Worker is `cbtsk-26` at `https://cbtsk-26.yaj-app.workers.dev`. Cloudflare may label its deployment environment **Production** by default; for this repository it is a test/demo Worker and must use only the test Supabase project (`bmzmxcrngduxtkrsrgbp`) and fake data. The Cloudflare environment label does not authorize use of the production Supabase project.

1. In Cloudflare, open **Workers & Pages → cbtsk-26 → Settings → Build**. Confirm the connected repository is `abeniktech-hub/CBTSK`, the intended branch is selected, the root directory is `/`, and:
   - Build command: `npm run build:worker`
   - Deploy command: `npx wrangler deploy`
   - Build environment: Node.js `22.12` or later
   - Worker name in the checked-out `wrangler.jsonc`: `cbtsk-26`

2. In **Settings → Build → Build variables and secrets**, set these as public **build variables**:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://bmzmxcrngduxtkrsrgbp.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = the anon/publishable key from the test Supabase project's API keys page
   - `NEXT_PUBLIC_SITE_URL` = `https://cbtsk-26.yaj-app.workers.dev`

   Verify the Supabase URL is the test project before saving. These client values are embedded into the browser bundle. Do not add any service-role, SMTP, Resend, or payment-provider credentials as build variables. The current Worker requires no Cloudflare runtime secrets. Never configure this Worker with production project values.

3. Configure Auth in the **test Supabase project only**. Open **Authentication → URL Configuration**:
   - **Site URL**: `https://cbtsk-26.yaj-app.workers.dev`
   - **Redirect URLs** (exact entries only):
     - `https://cbtsk-26.yaj-app.workers.dev/apply/dashboard`
     - `https://cbtsk-26.yaj-app.workers.dev/apply/reset-password`

   Do not add a production host or wildcard. The app uses the dashboard URL for email confirmation and the reset-password URL for password resets. Under **Authentication → Sign In / Providers → Email**, enable email confirmation.

4. For test Auth email, use an SMTP sandbox account with restricted/test recipients. In the test Supabase project's **Authentication → SMTP Settings**, enable custom SMTP and enter the sandbox-provided sender email/name, host, port, username, password, and recommended TLS/STARTTLS mode. Send a test message to a sandbox-controlled recipient; never use production SMTP credentials or real applicants.

5. For Edge Function email tests, submission confirmations and referee invitations use **Resend**, not Supabase Auth SMTP. If deploying those functions to the test project, configure their `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PORTAL_SITE_URL`, `RESEND_API_KEY`, and `MAIL_FROM` in the test project's **Edge Functions → Secrets**. Use a test sender/approved recipient. Configure payment-provider secrets only for a provider sandbox. These secrets are separate from Workers Builds and the Cloudflare Worker.

6. After the branch is pushed and the intended Cloudflare build is authorized, check the selected branch, Worker name, and test-only build variables before triggering the build. Open only `https://cbtsk-26.yaj-app.workers.dev` and verify signup/confirmation, password reset, portal session refresh, and sign-out. Do not change production Supabase settings, DNS, or credentials as part of this test.

The `build:worker` command runs OpenNext's build and checks client assets for the `SUPABASE_SERVICE_ROLE_KEY` identifier and, if present in the build environment, its value. This check is in addition to the design rule that service-role credentials never enter the client application. Successful output reports the number of client files scanned; any match fails the build.

## Supabase setup

The selected region is **West EU (Paris), `eu-west-3`**, the closest listed Supabase region to Cameroon in the project-creation UI when selected. Recheck availability when creating a project.

### Isolated integration-test project

The tests create and delete accounts and are destructive to their configured database. The test runner refuses to start unless the URL's project ref exactly matches `TEST_PROJECT_REF` and that ref differs from the explicitly configured `PRODUCTION_PROJECT_REF`.

1. Create a dedicated, disposable Supabase **test** project; do not reuse production. Copy its 20-character project ref from the Supabase dashboard. Authenticate the CLI with `npx supabase login`.
2. Copy `.env.test.example` to `.env.test` (the local file is git-ignored) and fill in these exact variables:
   - `SUPABASE_URL` — the test project's URL, exactly `https://<TEST_PROJECT_REF>.supabase.co`.
   - `SUPABASE_ANON_KEY` — the test project's anon/publishable key.
   - `SUPABASE_SERVICE_ROLE_KEY` — the test project's service-role/secret key, used only to create and remove test accounts and verify test state.
   - `TEST_PROJECT_REF` — the test project's 20-character ref.
   - `PRODUCTION_PROJECT_REF` — the production project's 20-character ref, used to reject accidental production targeting.
3. Link the CLI to the test project and apply migrations only there: `.\scripts\setup-test-supabase.ps1 -ProjectRef <20-character-test-project-ref>`. The script verifies both ref variables and the exact URL host before running `supabase link` and `supabase db push`.
4. Seed only the explicit test project with the approved quote fixtures: `npx supabase db query --remote=<TEST_PROJECT_REF> --file supabase/seed.sql --yes`. Confirm the CLI output names the same ref as `TEST_PROJECT_REF`.
5. Run `npm run test:portal`. Configuration errors fail immediately (tests are never skipped). The suite reports:
   - 50 concurrent signup triggers allocate unique matricules.
   - Applicant RLS blocks cross-account reads.
   - Anon-key REST requests return no rows from private public-schema tables.
   - Applicants cannot update matricule, application status, profile role, payment status, or exam score.
   - Login quote selection avoids recent repeats and remains stable on refresh.
   - Referee response tokens expire and are single-use.
   - Unverified applicants cannot establish an authenticated session.
   - Submitted applications reject further applicant edits.
   - Applicants cannot use staff-only application controls or read audit rows.
   - Local safety tests cover test-project targeting, renamed-executable file detection, and payment webhook signatures over the exact raw payload.

The test-project URL must match the explicit `TEST_PROJECT_REF` exactly, and `TEST_PROJECT_REF` must differ from `PRODUCTION_PROJECT_REF`; both the setup script and test runner enforce this. Never use a production service-role key in `.env.test`. All nine integration tests and five local safety tests must pass before the portal can be considered production-ready. The submit RPC's email-verification check, browser route gating, and payment webhook replay still require manual QA with the test deployment and payment-provider sandbox.

### Production project and Auth

1. Create the production Supabase project in `eu-west-3`.
2. Link it only for deployment operations using `npx supabase link --project-ref <production-project-ref>`; apply migrations with `npx supabase db push`. Do not run `db reset` against production.
3. Configure Auth:
   - **Site URL:** `https://cbts.edu.cm` (or the final canonical portal host).
   - **Redirect URLs:** include the exact production callback destination `https://cbts.edu.cm/apply/dashboard`, plus local development `http://localhost:3000/apply/dashboard`; do not use broad wildcards in production.
   - **SMTP:** configure a verified institutional sender with the chosen custom SMTP provider; test delivery, bounce handling, and sender-domain authentication.
   - **Email confirmation:** enable email confirmation and verify the link redirects back to `/apply/dashboard`.
4. Configure Supabase Auth rate limits/CAPTCHA, backups, private Storage retention, and administrator bootstrap via a trusted process. Never set roles in user-editable metadata.
5. Deploy the Edge Functions and configure their Supabase secrets separately from Cloudflare Worker secrets.

## Database and portal notes

- `supabase/migrations/202611110001_initial_portal.sql`: RLS-first schema, matricule counter/signup trigger, protected-field guards, step-completion/submission RPCs, quote RPCs, audit helpers, and private Storage policies.
- `supabase/seed.sql`: campuses, example editable programme/fee rows, and only the seven requested KJV verses. Confirm example fee values before launch.
- `src/domain/step-schemas.ts` validates interactive forms; `complete_application_step` independently validates completion in Postgres.
- Documents are accepted through `upload-document`, which checks size, MIME, and magic bytes. Storage direct writes are denied to applicants. `scan_status=PENDING` is a stub until a malware scanner is integrated.
- Static marketing routes may be generated at build time. Authenticated portal routes render dynamically on Workers with SSR cookie sessions.

## Go-live checklist

- [ ] Production Supabase project and approved `eu-west-3` region selected.
- [ ] Production schema migrations reviewed and applied; catalog values, fees, pledge text, privacy notice, and medical-form template approved.
- [ ] Production backups/PITR retention are configured and a restore drill has succeeded.
- [ ] Cloudflare Workers Builds connected to `main`, with `npm run build:worker` and `npx wrangler deploy`.
- [ ] Both public Supabase variables set as build variables; production build completed and client-secret scan passed.
- [ ] No service-role, payment, or email credentials exist in build variables, public env files, source maps, or browser bundles; this Worker uses no runtime secrets, and Edge Function secrets are configured only in Supabase's function secret store.
- [ ] Custom domain, HTTPS, redirects, and security headers verified.
- [ ] Supabase Auth Site URL, exact Redirect URLs, custom SMTP, and email confirmation tested.
- [ ] Admin and staff accounts use 2FA; recovery procedures are tested.
- [ ] All nine integration tests and five local safety tests pass before production launch.
- [ ] REGISTRAR/ADMIN accounts and role assignment tested through trusted setup.
- [ ] Initial administrator account creation is completed through the trusted bootstrap process; no user-editable metadata grants roles.
- [ ] Virus scanner integration and a process for clearing documents from `PENDING` are ready.
- [ ] Payment provider verification, webhook signature and replay protection tested using provider sandbox credentials.
- [ ] Sign-up, verification, sign-in, reset, and resend cooldown tested.
- [ ] Throttled-network autosave/resume, server-side step validation, and submission lock tested.
- [ ] Private upload, signed URL expiry, replacement/deletion, and renamed executable rejection tested.
- [ ] Admin matricule update, audit trail, and old-number search tested.
- [ ] Login quote selection tested over five logins and refresh; only approved public-domain Scripture is seeded.
- [ ] 360px, 768px, and 1280px layouts, keyboard access, reduced motion, print view, and mobile Lighthouse target checked.

## Assumptions and outstanding product inputs

- The portal is hosted on Cloudflare Workers rather than static Cloudflare Pages so dynamic Next.js and cookie-authenticated server features are available.
- The production domain is assumed to be `cbts.edu.cm`; replace it with the canonical domain if different.
- No production/test Supabase credentials, SMTP sender/provider credentials, payment provider, virus scanner, approved pledge wording, medical form template, or registrar/admin accounts were supplied.
- Define the institution-approved calling-code list, document requirement matrix, data retention period, privacy-notice text, and account export/deletion handling before launch.
