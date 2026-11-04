# Big Kids planet journeys

The current mobile/tablet presentation is documented in [Responsive planet journeys](responsive-planet-orbits.md). The desktop composition described below is preserved.

The latest revision follows the supplied Writing Adventure reference's composition: a bevelled purple/gold title banner with a circular emblem, brand/back controls at the left, an optional profile control using the child's saved name, compact numbered planet/mission capsules, a bright continuous golden looping path, and a bottom progress dock with green completion orbs.

## Original content and artwork

The original planet images, O-shaped rocket, logo and `/adventure-homes/galaxy.webp` are unchanged. No bitmap art or decorative assets were generated or edited. Planet images are rendered larger within their existing transparent margins, preserving their proportions and image files.

Reading and Maths retain all nine original planet/mission assignments. Their wide board uses four planets above and five below, in original reading order. Writing keeps its four existing mission planets and now includes **Scribbler as its fifth, always-available planet destination**, using the existing Jupiter image. Scribbler opens the existing free-drawing activity and is not counted as an unfinished learning mission. The progress dock measures the four original Writing missions. No new curriculum or nine-mission Writing sequence was invented from the reference's illustrative text.

## Navigation and route geometry

Reading, Writing and Maths homes continue to enter their maps directly after the existing home rocket flight. The old adventure launch screen remains removed. Existing per-planet introductions, start/resume controls, learning activities and back controls are unchanged. Map back controls return to Adventures; saved-name profile controls open existing Settings.

`planetJourneyLayout.js` provides a wide reference board, three-column tablet layout, and two-column phone layout. `planetJourneyRoute` supplies gently dipped connections and an outer-loop transition to the second row. Displayed gold paths and the existing rocket sampler call the same path builder. Reverse travel reverses cubic control points so it follows the same route backward. The rocket engine's locking, animation timing, reduced-motion fallback, timeout and cleanup are unchanged. Shared defaults keep the approved adventure homes and Little Explorers unaffected.

Planet art floats gently, with staggered timing; labels and route anchors stay fixed. Number bubbles stay gold, with small completion/lock markers. The current planet has a soft halo. Locked planets remain disabled and retain their original colours. Accessible labels retain the full mission and state. Reduced-motion and slow-update preferences stop continuous floating. All new styles are scoped to Big Kids.

## Verification

- Production build and focused ESLint pass; the existing large JavaScript bundle warning remains.
- All 30 Node tests pass, including direct entry, the four-above/five-below arrangement, route geometry in both directions for five- and nine-stop maps across all three layouts, Scribbler's free accessibility/progress semantics, and byte-for-byte integrity of 22 original artwork files.
- MathSection retains its baseline lint errors; no unrelated learning logic was changed.
- A fresh native Chrome preview rendered the revised nine-stop composition, large original planets, numbered capsules, golden loop and bottom progress dock with three green orbs. The preview callback log recorded successful planet arrivals.
- The local PWA service worker was serving stale development modules at `127.0.0.1:5173`; the fresh `localhost:5173` origin was used to inspect the actual revision. Production assets retain Vite's hashed filenames. No service-worker or authentication changes were made.
- Native Chrome did not reliably expose the refreshed Writing preview or every page-action result. The actual Scribbler interaction, phone/tablet touch/orientation and installed-PWA behavior still need manual checks. Source integration and all five-stop routes are covered by the tests.
- Temporary isolated preview files were removed. The actual local game is available at `/app.html`. Local implementation only; not committed or deployed.

No authentication, scoring, saved-progress format, original artwork or Little Explorers changes.
