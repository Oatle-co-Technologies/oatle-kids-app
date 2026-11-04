# Big Kids planet journeys

Reading, Writing and Maths now use the shared `BigKidsPlanetJourney` presentation. It reuses `/adventure-homes/galaxy.webp`, the original planet image URLs, and the existing O-shaped rocket. No images, backgrounds, decorations or other bitmap assets were generated or edited.

## Navigation

The `screen` field in the existing home configuration now routes Reading directly to `map`, Writing to `writingMap`, and Maths to `math` (whose initial view is its map). The shared rocket still completes its existing home-arrival transition before that callback runs. The old adventure launch screen, launch state and launch-only narration were removed. Arcade and Storybook retain their existing entry screens.

Map back controls return to Adventures. Existing per-planet mission introductions, start/resume controls, learning activities and their back controls remain intact. Writing's Scribbler stays available as an independent free-drawing control, and is no longer displayed as an additional Earth in the planet route or counted toward mission completion.

## Presentation

`planetJourneyLayout.js` supplies ordered, serpentine coordinates: three planets across on wider screens, two on phones. The same SVG curves are used by the golden route and the existing rocket flight sampler. The map supplies a zero rocket lift so its centre follows the displayed route, without changing the flight engine, image or proportions. Existing learning-map locking conditions and completion flags are passed through unchanged.

Planet image containers have fixed centres on the path; only their original image elements float by six pixels, with staggered durations. Labels and path endpoints stay fixed while they hover. Planets render at 164px on wider screens and 124px on phones. Locked images retain their original colours with reduced opacity; no grayscale filter is applied in this map variant. Native disabled buttons and separate status labels distinguish current, completed and locked states. Mission labels remain visible when locked.

Maths labels pair each original planet name with its existing mission title; the assignments and questions are unchanged. The progress bar counts the existing completed flags across actual mission planets. The current-planet label uses the same unlocked-current selection as the rocket. Later rows scroll into view when needed; first-row destinations leave the heading/logo visible.

Reduced-motion and slow-update preferences stop hovering. Existing reduced-motion/low-power flight fallbacks are retained. All new styles are scoped to Big Kids maps. Little Explorers and the approved floating-home screen keep their previous presentation.

## Verification

- Production build passes; the existing large JavaScript bundle warning remains.
- All 27 Node tests pass. New checks cover direct home entry, phone/desktop route bounds, original ordering, unchanged progress inputs, and SHA-256 integrity of 22 pre-existing planet/logo/rocket/background files.
- Focused ESLint passes for App and new/modified shared modules. MathSection retains the same four existing lint errors as its baseline; no new errors were introduced.
- Native Chrome rendered the nine-planet preview with original artwork, golden connections, readable mission labels, progress, current/completed markers, and disabled locked destinations. In the real authenticated local game, selecting Writing displayed its existing home rocket-flight state, then Writing Planet Map directly with no launch screen, four original assignments, locked controls and the Scribbler. Reading Planet Map was also observed with all nine original assignments and locked labels.
- Some native page actions did not reliably report a resulting state; final forward/reverse mission flights, back controls, actual phone touch/orientation and installed-PWA interaction remain manual verification items. Route order and both directions have automated geometry coverage. Temporary preview files were removed.

No authentication, scoring, database, saved-progress format, original artwork or Little Explorers changes. Local implementation only; not committed or deployed.
