# Naledi's standalone birthday invitation

Public URL: https://oatlekids.co.za/naledi-5th-birthday/

This is a static HTML invitation copied from the completed design, not a React route. Vite copies `public/naledi-5th-birthday/` into the same location in `dist/`. Two exact Vercel rewrites serve its HTML for the path with and without a trailing slash. No authentication, protected-route, database, or React component code was changed.

## Files and isolation

- `public/naledi-5th-birthday/index.html`: existing SVG artwork, CSS, details and initial-response Open Graph metadata.
- `public/naledi-5th-birthday/invitation.js`: original animation and tap/back code, extracted unchanged so the existing `script-src 'self'` policy remains effective.
- `public/naledi-5th-birthday/preview.jpg`: 1200 × 630 JPEG derived from the original opening artwork and its colours.
- `vercel.json`: exact invitation rewrites; all existing security headers preserved.
- `vite.config.js`: invitation directory excluded from the app's offline precache.
- `public/service-worker.js`: requests to the invitation bypass the app's cache. This prevents an invitation navigation overwriting the cached React app shell.

The invitation imports no React code, registers no service worker, uses no authentication or database APIs, and adds no dependencies. A public invitation does not grant access to protected application data. Search-engine `noindex,nofollow` from the original invitation is preserved.

## Deployment requirements

Use the existing Vercel project serving Oatle Kids; do not create a new project, transfer the domain, change repository visibility, or upgrade a plan.

Repository: `Oatle-co-Technologies/space-reading-adventures`.

At inspection, production was built from `e0d776e61393f65159959c6c5c59a9acb6b1d2c4`. The newer `main` commit `95385fe` already contains a separate speech change; it is not part of this invitation change. Review this existing difference before deploying current main.

The latest Git integration deployment failed with Vercel's private-organisation-repository/Hobby restriction. The simplest compatible next step is an authenticated direct deployment to the **existing project**, if the account permits it. Vercel documents CLI deployment independently of a Git connection: https://vercel.com/docs/deployments . Do not introduce a paid plan or change the app architecture to resolve this.

After merging and confirming the production source revision, use the normal existing build settings, environment variables, project identity and production domain. Build with `npm ci` and `npm run build`. A direct deployment can use `vercel link` to select the existing project and `vercel --prod`; authenticate through the owner's normal Vercel login. Never commit credentials or `.vercel/` state.

The current domain redirects to `www.oatlekids.co.za`; the existing redirect is retained. The requested non-www URL and absolute image URL follow that redirect to the same static files. No domain configuration changes are required.

## Verification completed locally

- Production build succeeded.
- Built HTML, JavaScript and JPEG match their source files byte for byte.
- Initial HTML contains the correct title, description, canonical URL, absolute HTTPS OG image URL, image dimensions/type/alt text, and Twitter large-image metadata.
- JavaScript syntax and `git diff --check` passed.
- Original invitation JavaScript is unchanged except extraction into its own file.
- Browser checks at 390 × 844 and 375 × 667: opening screen and snowfall work, tap reveals details, Back returns to opening, no console warnings/errors observed.
- Service-worker checks confirmed invitation paths bypass caching; regular app navigation still invokes the existing cache handler. Built precache contains no invitation assets.
- Local page and preview image both returned HTTP 200 without login.

## Required public checks after deployment

1. Fetch https://oatlekids.co.za/naledi-5th-birthday/ and confirm HTTP 200 after the existing www redirect, with the invitation HTML rather than the React app shell.
2. Fetch the same URL with a WhatsApp user agent and confirm OG tags exist in the initial HTML. No JavaScript execution should be required to read them.
3. Fetch https://oatlekids.co.za/naledi-5th-birthday/preview.jpg and confirm HTTP 200 with `image/jpeg` and a 1200 × 630 image.
4. Check opening, reveal, Back and snow on the public route, including a physical iPhone in Safari and WhatsApp's browser. Phone-sized desktop viewports do not establish physical iOS compatibility.
5. Paste the new link into a WhatsApp draft and wait for the preview before sending. WhatsApp can cache earlier responses, and a crawler simulation does not prove its final preview rendering. No WhatsApp message was sent during this work.

At handoff the production route remains undeployed, so public metadata/image retrieval and actual WhatsApp preview are not yet verified. Direct Vercel inspection/deployment was blocked by automatic approval review: CLI diagnostic telemetry to Sentry and saved-token access were rejected. Deployment needs explicit owner approval/access before retrying through an approved Vercel workflow.
