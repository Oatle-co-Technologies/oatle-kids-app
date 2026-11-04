# Responsive planet journeys

Below 1024px, mission maps use a circular orbit around the adventure home or its existing emblem. The mobile composition follows the supplied reference: purple/gold heading, dimensional central artwork, original planets, gold-edged mission labels, numbered state badges, and a thin luminous orbit with star accents. Reading and Maths retain nine stops; Writing retains its four missions and its always-available Scribbler. Little Explorers uses the same presentation component for its existing one-to-five-stop mission maps. Adventure selection and activities are unaffected.

At 1024px and above, the wrapper has `display: contents` and forwards the original journey properties. The approved desktop stylesheet, winding coordinates, planet sizes and route builder are unchanged.

## Implementation

- `ResponsivePlanetJourney` wraps the existing `SpaceJourney`; it reuses the original items, callbacks, completion and lock flags. No curriculum, saved progress, Supabase, scoring, authentication or artwork changes.
- `planetOrbitLayout` supplies circular positions and label offsets. The same SVG arcs draw the orbit and drive the existing rocket animation in both directions. Single-stop maps also retain a full decorative orbit.
- Portrait geometry scales with the host width and available height. Short portrait phones have a compact banner. Short landscape screens place navigation beside the orbit. Actual bottom-navigation height, including the home-indicator inset, is measured rather than assumed.
- Planet images hover by only three pixels; their labels and anchors stay fixed. Reduced-motion/slow-update styles disable continuous motion. The original rocket's reduced-motion, low-power, timeout, selection locking and cleanup behavior are preserved.
- Every planet and label remains inside one native button, with a minimum 44px planet target, full accessible mission/state labels, keyboard focus and the original disabled semantics. Numbered completion/lock markers remain visible. The numerical progress summary remains available to assistive technology; the mobile view uses the badges to keep the reference composition clear.

## Verification

Temporary browser fixtures rendered the production components with existing mission labels and artwork, without writing user progress. Chrome DOM measurements checked label/target bounds and collisions, central-art clearance, horizontal overflow and bottom-navigation clearance.

| Layout | Viewports | Result |
| --- | --- | --- |
| Portrait orbit | 375×667, 390×844, 430×932, 768×1024, 820×1180 | Reading, Writing, Maths and Little Explorers five-stop fixture pass |
| Landscape orbit | 667×375, 844×390, 932×430 | The same fixtures pass |
| Extra 34px home-indicator space | All the above orbit viewports | Nine-stop Reading fixture passes |
| Desktop boundary | 1024×768 | Original winding presentation selected |

Chrome also exposed the flying-to-Scribbler state and then recorded its selection callback after arrival. This checks the shared flight/navigation handoff; the fixture does not open a real saved learning session.

The Node suite covers all current mission counts (1, 2, 3, 4, 5, 9), forward/reverse arc endpoints, single-stop orbit closure, exact breakpoint, viewport budgets with/without a 34px safe area, non-overlap and minimum target size. A desktop stylesheet hash and coordinate assertion protect the existing composition; the existing artwork-integrity suite checks the original assets. All 35 tests, focused ESLint and production build pass. The existing bundle-size warning remains.

Installed-PWA and physical-device touch/orientation checks were not performed; viewport fixtures and safe-area simulation cover the responsive geometry. Temporary verification pages were removed. No dependency or service-worker changes were needed.
