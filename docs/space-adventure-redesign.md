# Space adventure navigation

## Scope

The first-visit age chooser now uses illustrated planet worlds. The saved-age behavior remains unchanged: returning children enter the correct adventure group, and Home returns to the age chooser.

Big Kids now explore one illustrated winding route: Reading Galaxy → Number Nebula → Writing Orbit → Cosmic Puzzles → Space Builder → Storybook Adventure. Original book covers remain visible on the Storybook destination, directly following the two Arcade destinations. Little Explorers keeps every existing activity and its independent missions, presented as larger illustrated destinations.

Reading, writing, maths and Little Explorers mission maps share `SpaceJourney`. Existing ordered arrays, disabled conditions, selection callbacks, mission content and persistence keys remain authoritative. The component never unlocks a destination. Writing's freely accessible Scribbler remains available at the end of its map.

Existing completion inferred from an unlocked successor stays visible. An additive `completedMissions` field records new completed missions, including final destinations, without changing question positions, mission arrays or unlock thresholds. Old saves continue to load. Legacy writing saves do not identify a completed final planet reliably, so it receives an explicit checkmark after completing it with this version. Little Explorers uses its existing exact completion flags.

## Rocket and animation

`public/rocket/oatle-rocket.png` is a small transparent extraction of the rocket-shaped O and fins from `public/oatle-kids-wordmark.png`. The source logo is unchanged. The logo integrates its rocket into the O; no replacement illustration was generated.

Evaluated [Motion](https://motion.dev/docs/react-animation) and [GSAP MotionPath](https://gsap.com/docs/v3/Plugins/MotionPathPlugin/). Used native SVG cubic paths and Web Animations instead: this interaction needs only one short flight, with no dependency or continuous rendering loop. Keyframes sample the same cubic segments as the displayed route, including reverse travel and gentle rotation. Only an active flight shows a small thruster effect.

The rocket parks at the current available mission or the last adventure chosen in the browser session. It cannot park on a locked mission. Later current destinations scroll into view on map load. A synchronous lock blocks repeated taps during the 620ms flight. Unmount cleanup cancels pending navigation, and an 850ms timeout prevents stalled animations from trapping the child. A settled guard prevents animation rejection/completion from navigating twice.

Reduced motion, Save-Data, low reported CPU counts, or missing Web Animations/SVG geometry support navigate immediately. Storage denial does not block navigation. Curves, controls and content remain usable without animation. Existing PWA asset caching includes the new PNG and hashed application assets.

## Verification

- Production build passes; the existing large-bundle warning remains.
- All 19 Node tests pass, including new route-order, reverse-flight geometry, 320px layout bounds, locked-state selection and legacy-progress preservation tests.
- Focused ESLint passes for App, Little Explorers and all new JavaScript/JSX modules. MathSection retains the same four existing lint errors as its baseline; this change introduces none there.
- Native Chrome preview under React StrictMode: checked both adventure groups, cover-art destination below Arcade, completed/current/locked presentation, forward flight and mission arrival, reverse selection, and opening the existing Little Explorers mission introduction. Locked mission buttons remained disabled; all destinations were temporarily disabled during a flight and enabled after arrival.
- Full authenticated app, actual phone touch/orientation, and installed-PWA behavior were not device-tested. Narrow-layout bounds have automated coverage; the attempted final narrow browser preview was unavailable after the native browser stopped rendering its content. Temporary QA entry points were removed.

No authentication, subscription, database, marketing-page or learning-content changes. Not deployed by this implementation task.
