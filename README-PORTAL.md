# CBTS Admissions Portal

## Hosting and architecture decision

The existing site remains a Next.js static export on Cloudflare. The portal UI therefore uses a Supabase browser session and client components. Static export cannot execute Next.js middleware, server components with per-request cookies, route handlers, or server actions. Sensitive work must use Supabase RLS, Postgres functions, and Supabase Edge Functions. Do not treat the browser as a trusted server. If per-request Next.js protection or server-rendered portal pages become a hard requirement, migrate Cloudflare to an OpenNext Workers deployment before enabling real applications.

The selected Supabase region is **West EU (Paris), `eu-west-3`**, which is the closest listed Supabase region to Cameroon in the current regions list. Recheck availability in the Supabase project-creation UI.

## Environment

Set these variables in the Cloudflare Pages/Workers build environment; only the Supabase URL and publishable anon key may be public:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Set the following as Supabase Edge Function secrets, never in the browser or `NEXT_PUBLIC_`:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `RESEND_API_KEY`
- `MAIL_FROM`
- `PORTAL_SITE_URL`
- `PAYMENT_WEBHOOK_SECRET`
- `PAYMENT_PROVIDER_CREATE_URL`
- `PAYMENT_PROVIDER_VERIFY_URL`
- `PAYMENT_PROVIDER_API_KEY` (when required by the configured provider)

The credentials, email sender and payment provider were not supplied. The portal is not production-ready until real Supabase project values, SMTP, approved pledge wording, medical form template, provider credentials and registrar/admin users are configured.

## Supabase setup

1. Create a Supabase project in `eu-west-3`.
2. Link it with `supabase link --project-ref <project-ref>`.
3. Apply schema: `supabase db push`; seed development/test data: `supabase db reset` (never reset production).
4. Configure Auth email SMTP using the institution's Resend or Postmark account. Enable email confirmation and configure the allowed redirect URL ending in `/apply/dashboard`.
5. Configure Auth rate limits and CAPTCHA in the Supabase dashboard. The static client cannot implement a trusted IP-based rate limiter; rely on Supabase Auth's server controls and Edge Function limits.
6. Set the Edge Function secrets above and deploy each function with `supabase functions deploy <function-name>`. Functions are `upload-document`, `document-access`, `send-referee-invites`, `referee-response`, `create-payment`, `payment-webhook`, `send-submission-confirmation`, and `resend-verification`.
7. Assign initial staff roles through a trusted SQL editor/administrative process, never through account metadata. Set `portal_settings.matricule_regex` if the default format needs adjustment.
8. Configure custom SMTP sender/domain, delivery monitoring, backups and private Storage bucket retention before launch.

## Migrations and data

- `supabase/migrations/202611110001_initial_portal.sql`: RLS-first tables, matricule counter and signup trigger, protected-field guards, step-completion/submission RPCs, quote RPCs, audit helpers, and private storage bucket policies.
- `supabase/seed.sql`: campuses, example editable programme/fee rows, and only the seven requested KJV verses. No non-Scripture quotes are seeded.
- `src/domain/step-schemas.ts` validates interactive forms in the browser; `complete_application_step` independently validates completion on Postgres. Static hosting does not provide a shared Next server runtime, so the SQL constraints/RPC are the authoritative completion checks.
- Documents are accepted only through `upload-document`, which checks size, MIME and magic bytes. Storage direct writes are denied to applicants. `scan_status=PENDING` is a stub until a malware scanner is integrated.

## Admin and operations

Create REGISTRAR/ADMIN profiles via a trusted Supabase admin process. Privileged mutation must call audited SECURITY DEFINER RPCs or authenticated Edge Functions. CSV imports must be pre-reviewed; never approve user-provided quotes without source and rights review. Search matricules using both `applications.matricule` and `matricule_history.old_value`.

## Tests

Run `npm test` for the portal integration tests. They are skipped unless all of `CBTS_TEST_SUPABASE_URL`, `CBTS_TEST_SERVICE_ROLE_KEY` and `CBTS_TEST_ANON_KEY` point to an isolated test project. For a non-local project, explicitly set `CBTS_ALLOW_REMOTE_TESTS=1`; the tests create and delete test accounts and must never target production. Apply and validate migrations against a disposable local Supabase instance before deployment.

Manual checklist:

- Sign up, verify email, sign in, reset password, and resend verification no faster than once per 60 seconds.
- Throttle the network, edit a step, verify blur/20-second draft save, then resume after refresh.
- Submit an invalid step and verify server completion fails; complete valid data and verify it becomes COMPLETE.
- Upload valid PDF/JPG/PNG; reject a renamed `.exe`, oversized file, and forged MIME; verify private signed URL expiry and replacement/delete while DRAFT.
- Replay the payment webhook and verify it cannot double-mark or double-charge a payment.
- As staff, edit a matricule; confirm the old number resolves via matricule history.
- Run 50 concurrent signup/application creations and confirm unique matricules.
- Sign in five times; quotes are approved KJV only, no repeats in the last 20 logins, and refreshing the dashboard does not change the current login quote.
- Verify applicant A cannot read applicant B's rows or change a protected application column.
- Check `/apply/login` Lighthouse mobile performance target ≥90; fix deployment/font/edge configuration if not met.
- Check 360px, 768px and 1280px in light and dark themes; keyboard-only focus, drawer trap/Escape, tabs, modal, validation focus, and print output.

## Assumptions and open questions

- Cloudflare static export was explicitly retained; Next middleware/route handlers/cookie server sessions are therefore unavailable.
- `/apply` and `Apply Now` use the configured `/apply` URL.
- No production Supabase, SMTP, payment provider, virus scanner, medical form or approved pledge text was supplied.
- The seed fee values are examples for the listed program levels; confirm them before use.
- Define eligibility, required document matrix, institutionally approved country calling-code list, policy retention period, privacy-notice text, and staff account bootstrap process.
