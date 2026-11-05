# Live PayFast subscriptions

- App invokes the existing Supabase endpoint `quick-service` (display name: `create-payfast-checkout`).
- Checkout posts to `https://www.payfast.co.za/eng/process` for R120.00 initially and R120.00 monthly.
- Return/cancel URLs point to `/app.html`; a success query parameter never grants access.
- `payfast-itn` validates with the live PayFast endpoint, verifies the signature and merchant, and calls `apply_payfast_itn`.
- The SQL routine checks the subscription's amount/account/plan, deduplicates live receipts, and extends entitlements atomically. Sandbox receipts use a separate namespace.

Supabase configuration (values belong in the dashboard, not Git):

- `PAYFAST_MERCHANT_ID`, `PAYFAST_MERCHANT_KEY`, `PAYFAST_PASSPHRASE`: the live merchant account values.
- `APP_URL`: `https://www.oatlekids.co.za`.
- `PAYFAST_CHECKOUT_ENABLED=true` and `PAYFAST_LIVE_ACTIVATION_ENABLED=true` only when the live merchant configuration is ready.
- Supabase supplies its URL and admin context server-side.

Optional frontend override: `VITE_PAYFAST_CHECKOUT_FUNCTION`; default `quick-service`.

Deployment record: the live database routine and edge function source were updated through the user's open Supabase dashboard. Merchant-secret readiness and activation flags still require verification. No charge or purchase has been performed.
