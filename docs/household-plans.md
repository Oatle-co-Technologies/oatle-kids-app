# Single Child and Family plans

Final prices approved on 10 November 2026:

| Plan | Monthly ZAR | Profiles | Registered browsers/apps | Playing at once |
| --- | --- | --- | --- | --- |
| Single Child, including promo grants | R120 | 1 | 2 | 1 |
| Family | R200 | 3 | 2 | 2 |

Promo grants, including existing grants and lifetime grants, remain Single Child. Their existing expiry is preserved. The database trigger derives the plan from the entitlement type and a verified paid subscription, ignoring attempted client-side family selections. Existing R120 recurring charges are unchanged. Family is granted only from a confirmed R200 monthly PayFast subscription. Payment return URLs do not grant access.

## Profiles, progress and sessions

The parent creates profiles using nicknames. The first profile can import existing progress from that device with the parent's explicit selection. Siblings receive separate local caches and separate server snapshots. Only whitelisted learning keys sync; auth tokens are never included. Snapshot revisions reject stale writes. Unsynced changes remain on the device across refreshes; if newer cloud progress conflicts, the parent can keep the local backup and load the latest cloud version. Choosing another child waits for outstanding saves before releasing the current session.

Two browser/app registrations are allowed per account. A browser registration is not a hardware fingerprint: another browser or a separately stored installed app may count separately. Parents can remove an old device. One child cannot have two active play sessions. A Single Child plan has one active lease; Family has two. Per-account database locks serialize concurrent registration, profile creation and checkout reservations. Downgrades preserve extra child profiles and their progress but make them unavailable until Family is restored.

The current app renews its session every 30 seconds. Leases expire after 90 seconds; if connectivity is lost, play pauses after that grace period and local progress remains saved. Closing a tab can leave its place occupied for up to 90 seconds. This is application access control, not DRM for already downloaded public browser assets. Old cached clients must update before they can show/enforce the new parent-account flow.

## Billing behavior

Checkout accepts only `single` or `family`; the server chooses R120/R200 and creates the pending subscription atomically. Repeated checkout clicks reuse the same pending reference. A different pending plan or an active recurring subscription blocks creating another recurring subscription. Existing subscribers and active promo users contact support for a plan change, rather than receiving a second recurring charge automatically. Do not change an existing PayFast recurring amount as part of this rollout.

No live payment or real customer account was used in tests. Provider delivery of a real R200 recurring charge is not verified until an owner-approved transaction is performed.

## Production rollout procedure

1. Back up and review the current production schema, including subscriptions and entitlement grants; keep the previous frontend deployment available for rollback.
2. Apply `supabase/migrations/20261110090000_household_plans.sql` once to the existing project. The migration is additive and preserves expiry, prices and existing progress. It creates RLS-protected tables and owner-checked RPCs. Confirm the live subscriptions schema has the existing `created_at` field used for checkout reservations.
3. Deploy **quick-service** using the entrypoint in `supabase/config.toml`. Its plan definitions are in `supabase/functions/quick-service/subscriptionPlans.js`, shared with the frontend. Deploy all three function files together. JWT verification is performed inside `createSupabaseContext(..., {auth:'user'})`, matching the existing endpoint implementation. Do not change merchant secrets or activation flags.
4. The existing promo endpoint **hyper-action** and PayFast ITN endpoint remain compatible; neither needs replacement for this rollout. The new database trigger makes promo grants Single Child, and the existing ITN routine validates against the selected subscription's stored amount.
5. Deploy the frontend and updated pricing/privacy/terms to the existing Vercel project. Do not publish the frontend before the database and checkout endpoint are ready.
6. Verify the public R120/R200 pricing, existing promo login, one-profile promo limit, Family profile chooser, device management, profile refresh, and two-browser play limit using disposable test accounts. Never use actual customer credentials or automatically charge a card for a verification.

Rollback: restore the prior frontend and quick-service version. Leave the additive tables and columns in place so child progress is not lost. The previous frontend and R120 checkout remain compatible with the added columns. Do not drop child/profile tables during rollback.

## Validation

- Production build passes.
- All 128 existing and new Node checks pass, including R200 checkout and revision-based sync.
- Eleven PostgreSQL integration checks pass against an isolated local PostgreSQL server: promo downgrades, family profile/device caps, concurrent registration/creation, cross-account isolation, expired/revoked sessions, price matching, receipt deduplication and duplicate checkout protection.
- Chrome mobile emulation at 390px verifies legacy-progress import, refresh restoration, sibling isolation, three Family profiles, two registered devices, two siblings playing together, same-child locking, one promo profile and R120/R200 plan choices.
- Browser tests use the real app/components and the real SQL routines with disposable local accounts; authentication and payment-provider delivery are stubbed. Physical devices and real recurring payments have not been tested.

## Published — 10 November 2026

- Applied the additive household migration through the existing Supabase dashboard; the production schema includes `subscriptions.created_at` as expected. Existing email-assigned promo restrictions were retained; the existing promo and ITN functions were not replaced.
- Updated the existing **quick-service** checkout endpoint with the entrypoint, signed checkout helper and shared R120/R200 plan definitions. The dashboard confirmed the new deployment. An unauthenticated HTTP request returns 401.
- Ran a production SQL verification entirely inside a rolled-back transaction: confirmed R200 Family activation, three-profile/two-device caps, simultaneous sibling sessions, revision-based saves, heartbeat renewal, promo Single Child restrictions, and preservation of profiles after downgrade. No lasting test users, receipts or subscriptions were created.
- Published the app and the two-card website/AI update to `https://www.oatlekids.co.za/`. Final Vercel deployment: `dpl_8Av3Tuq9153bWLqUVKfbNDU8Myh5` (`oatlekids-5fwkxyufr-vinoliamoekwas-projects.vercel.app`). Prior app deployment for rollback: `dpl_3sK7eeLA8B8FfrV5DeXSyMaYY6zW`.
- Public HTTP and browser checks confirmed R120 Single Child/R200 Family cards, shared activity inclusions, profile/device/play limits, promo restriction, new app bundle, and offline manifest. Four live AI questions returned the correct prices, limits, promo policy, progress information and plan-change/device-management guidance.
- No real payment was submitted or customer recurring amount changed. Completion of a real R200 PayFast transaction remains untested.
