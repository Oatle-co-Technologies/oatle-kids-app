# Parent assessment reports and optional email marketing

## What changes

Parent signup has a separate, optional checkbox, initially unchecked, before checkout. An auth INSERT trigger copies that explicit choice into a protected preference record and append-only consent history. Existing accounts default to opted out. Later auth metadata edits cannot change consent. Account settings and the pre-subscription screen provide a preference editor. Unsubscribe tokens are unguessable, stored as SHA-256 hashes, and change marketing only. GET renders confirmation without changing consent; POST supports confirmation and List-Unsubscribe one-click requests.

Completed Reading (Pluto) and Maths (Mission 9) assessments persist their existing per-skill results to the authenticated parent's report records. The recipient is resolved from the confirmed Supabase account, never a browser-supplied address. Each skill includes correct/total, percentage and a specific five-minute home activity. Reports contain no child's name, age, siblings or other profile data. These are app learning snapshots, not formal assessments. Educational reports are independent of marketing consent and subscription status.

Device attempts retain a stable UUID. Failed submissions remain in an account-specific queue and retry on connectivity, completion and every 30 seconds while the app is open. The restored household flow isolates progress by parent and child profile and syncs only approved learning keys. Assessment attempt IDs are also child-specific. Namespaced caches and device registrations archived by the interim account-only release are recovered locally without overwriting current values; unowned legacy child data and auth tokens are not imported automatically. Browser storage must remain available: clearing it before a report reaches the server loses that unsent attempt. No historical reports are bulk emailed.

The atomic database RPC validates exact skill coverage, integer score bounds and assessment totals (Reading: 7 x 4, Maths: 10 x 2). A report UUID can never be reused for another parent or changed scores. Scores are the app's existing answer evaluation, not an independent server regrading of question answers. They are not suitable for high-stakes or tamper-proof certification.

The server outbox uses unique report/campaign keys, batch leases, retry backoff, a frozen provider payload and Resend idempotency. Ambiguous attempts older than 23 hours move to `review` instead of risking a duplicate after the provider's 24-hour idempotency window. Provider acceptance is recorded as `sent`; it is not a guarantee of inbox delivery. Inspect the provider dashboard for bounces and delivery events. Do not automatically reset review jobs: reconcile their idempotency key/provider receipt first.

## Brevo signup reminders

The `marketing-reminder` function uses Brevo and claims reminder jobs only. It uses `BREVO_API_KEY`, `MARKETING_WORKER_SECRET`, and `BREVO_MARKETING_REMINDERS_ENABLED`. Its scheduler calls it with `X-Email-Worker-Secret` from Vault. The confirmation page at `/unsubscribe.html` accepts the email's private token and posts it to `email-unsubscribe`. A visit to the page leaves consent intact until the parent submits the form.

## Assessment report worker activation

Production rollout on 10 November 2026: the migration was dry-run successfully against the live schema, then applied and recorded as `202611100001`. All historical users remain opted out. The three functions have been deployed. The worker retains gateway JWT verification plus its private header. At that rollout, public access to signed-token unsubscribe links and outbound delivery were disabled. No email provider credentials were present in the live function secrets. This implementation supplies a Resend adapter; it does not establish that the business already uses Resend. No production secrets are included.

1. Confirm the target Supabase project and existing subscription/entitlement schema. Run the migration in a staging project first, including its auth trigger, before deploying the updated frontend. The repository does not contain the original full database schema; tests use the observed schema contract. Inspect existing grants, policies and auth triggers before production migration.
2. Deploy `parent-email`, `email-worker` and `email-unsubscribe` with the supplied function configuration. `parent-email` performs `auth.getUser` token verification itself, requires a verified account and uses the caller's token for the authenticated RPC. `email-worker` retains gateway JWT verification and additionally requires its independent `X-Email-Worker-Secret` header.
3. Configure `APP_ORIGIN` for the exact frontend origin, `EMAIL_WORKER_SECRET` (random high-entropy scheduler secret), `EMAIL_TOKEN_SECRET` (separate stable random secret), `RESEND_API_KEY`, and `EMAIL_FROM` (verified sender). Supabase supplies the standard URL/anon/service-role variables. Store secrets in the deployment platform, never in source or frontend variables.
4. Keep `EMAIL_DELIVERY_ENABLED=false` and `MARKETING_REMINDERS_ENABLED=false` while applying migrations and deploying. Exercise registration, preference changes, both assessments and unsubscribe against synthetic accounts. Run local tests below; these make no real provider calls.
5. In staging, use a provider test configuration or isolated test recipients to verify sender authentication, formatting and receipt. The live worker sends to confirmed account addresses, so do not enable it on production merely to test. Check provider bounce/complaint controls and sending limits before production activation.
6. After staging acceptance, enable `EMAIL_DELIVERY_ENABLED=true` for educational reports. Arrange an authenticated scheduler to POST to `/functions/v1/email-worker` every five minutes with `Authorization: Bearer <SUPABASE_ANON_KEY>` and `X-Email-Worker-Secret: <EMAIL_WORKER_SECRET>`. Do not expose that secret in a public URL. Scheduling is deliberately not installed in a migration because the repository does not identify the production secret store or scheduler.
7. Keep the legacy `MARKETING_REMINDERS_ENABLED` setting off while the dedicated Brevo worker handles reminders.

Monitor pending queue age, `review` rows, failed worker invocations and provider delivery failures. Disable `EMAIL_DELIVERY_ENABLED` to stop all new provider submissions; disable the marketing flag to stop enqueueing reminders. Existing reminder jobs still require current consent and no active access. Account deletion cascades through reports, preferences, consent events, tokens and queue entries; provider-side retention must be managed in the provider account. Reports and frozen email payloads remain private to their owner/service role under RLS; set a business-approved retention policy before activation.

## Verification

- `npm ci --ignore-scripts`
- `npm run build`
- `npm run test:email` — report validation, templates, mocked provider, handler authentication/kill switch/unsubscribe, real PostgreSQL semantics via PGlite for the migration, RLS, consent audit, deduplication, retries and reminder suppression.
- `npm run test:e2e` — local browser, synthetic accounts, mocked Supabase and blocked external requests. Verifies signup opt-in before checkout, pre-subscription preference editing, and completion recovery for both assessment report flows.
- `npm test` — whole existing suite. An existing planet-orbit CSS hash expectation fails on the unchanged base CSS. Whole-repo lint also has existing React effect-state errors in Maths; newly added modules pass focused lint.

Reference contracts: [Supabase user-data triggers](https://supabase.com/docs/guides/auth/managing-user-data), [Resend idempotency window](https://resend.com/changelog/idempotency-keys).
