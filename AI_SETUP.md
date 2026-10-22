# Oatle Kids public assistant

The landing-page dialog sends only the current question to `/api/chat`.
The Vercel Node function calls the same Cloudflare Workers AI model used by
the main Oatle site; no new Worker or paid-provider fallback is required.

Set these server-only Production environment variables on Vercel's `oatlekids` project:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Never prefix these with VITE_ or put them in source files. Redeploy after setting them.
Cloudflare usage is shared with other apps using that account.

Public knowledge and response instructions are in `api/chat.mjs`. Keep them aligned
with the published activities and confirmed policies. Phonics is no longer offered.
Payment checkout and refund/cancellation policies must not be described as final
until the owner confirms them. The assistant cannot access accounts or take actions.

Messages are rendered as text, not HTML, and are not persisted by the widget.
The provider processes submitted questions. The dialog explains this before sending.
Input/output caps, a provider timeout, origin checks and best-effort per-instance
throttling are included. In-memory throttling is not a global distributed limit;
configure Vercel Firewall rate limits if traffic warrants it.
