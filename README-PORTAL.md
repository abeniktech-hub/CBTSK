# CBTS Admissions Portal

## Cloudflare Workers deployment

The app is deployed as a Next.js Node.js-compatible Worker using `@opennextjs/cloudflare`. Static export is disabled. `middleware.ts` refreshes Supabase cookie sessions before portal routes render; this retained Next.js convention is used because the current OpenNext standalone trace does not include Next 16's `proxy.ts` output. No route declares `runtime = "edge"`; app routes use the Node.js-compatible Worker runtime. `src/lib/supabase/server.ts` provides a cookie-aware client for Server Components, Server Actions, and Route Handlers. Public/marketing pages remain statically generated where Next.js can do so.

The former GitHub Pages deployment workflow has been removed; connect this repository to Cloudflare Workers Builds instead. The Workers adapter requires Node.js 22.12 or later and Wrangler 4. OpenNext warns that local Windows builds may be less reliable; use the Linux Workers Builds environment for the deployment build.

### Environment variables

The `/apply` configuration screen calls `createSupabaseBrowserClient()` and requires exactly these two build-time public variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

In development, copy `.env.local.example` to `.env.local`; for local Worker preview, copy `.dev.vars.example` to `.dev.vars`. In Cloudflare Workers Builds, add both as **build variables** so Next.js can inline them in browser bundles. They are public project URL/publishable anon-key values, not secrets.

Set server-only values as encrypted Cloudflare Worker secrets, never as build variables, `vars`, or `NEXT_PUBLIC_*` values:

- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `MAIL_FROM`
- `PORTAL_SITE_URL`
- `PAYMENT_WEBHOOK_SECRET`
- `PAYMENT_PROVIDER_CREATE_URL`
- `PAYMENT_PROVIDER_VERIFY_URL`
- `PAYMENT_PROVIDER_API_KEY` (if required by the provider)

Set Worker secrets using the Cloudflare dashboard or `npx wrangler secret put <NAME>`. Keep the Supabase service-role key out of local public env files and all client code. Supabase Edge Functions are a separate runtime; configure the function secrets there as well: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `RESEND_API_KEY`, `MAIL_FROM`, `PORTAL_SITE_URL`, `PAYMENT_WEBHOOK_SECRET`, `PAYMENT_PROVIDER_CREATE_URL`, `PAYMENT_PROVIDER_VERIFY_URL`, and `PAYMENT_PROVIDER_API_KEY` (when required by the provider). Do not put these in Workers Builds variables.

### Deploy from Cloudflare Workers Builds

1. Connect the GitHub repository under **Workers & Pages → Workers Builds** and select `main`.
2. Set the build command to `npm run build:worker`; set the deploy command to `npx wrangler deploy`. The build script fails early if either required public Supabase build variable is missing.
3. Use Node.js 22.12+ for the build environment.
4. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as Workers Builds build variables before the first build.
5. Add the server-only keys as encrypted Worker secrets after the Worker is created. Do not add them as build variables.
6. Confirm the Worker name matches `wrangler.jsonc` (`cbts-admissions-portal`) and attach the desired `cbts.edu.cm` route/custom domain.
7. For a local build/preview, copy `.env.local.example` to `.env.local`, fill in the public Supabase values, and run `npm run preview`. `.dev.vars` supplies local Worker runtime values; the same public values can be copied from `.dev.vars.example`. For a direct CLI deployment, run `npm run deploy` after `npx wrangler login`.
8. Supabase Edge Functions are deployed separately with `npx supabase functions deploy <function-name>` and receive their own secrets with `npx supabase secrets set NAME=value`.

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

The test-project URL must match the explicit `TEST_PROJECT_REF` exactly, and `TEST_PROJECT_REF` must differ from `PRODUCTION_PROJECT_REF`; both the setup script and test runner enforce this. Never use a production service-role key in `.env.test`. All five integration tests must pass against the isolated test project before the portal can be considered production-ready.

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
- [ ] Cloudflare Workers Builds connected to `main`, with `npm run build:worker` and `npx wrangler deploy`.
- [ ] Both public Supabase variables set as build variables; production build completed and client-secret scan passed.
- [ ] No service-role, payment, or email credentials exist in build variables, public env files, source maps, or browser bundles; server secrets configured only in the Worker/Edge Function secret stores.
- [ ] Custom domain, HTTPS, redirects, and security headers verified.
- [ ] Supabase Auth Site URL, exact Redirect URLs, custom SMTP, and email confirmation tested.
- [ ] All five integration tests pass on the isolated test project before production launch.
- [ ] REGISTRAR/ADMIN accounts and role assignment tested through trusted setup.
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
