# Responsive 3D mission orbits

Below 1024px, the planetary mission maps follow the approved miniature-solar-system reference: the existing adventure island in the centre, original textured planets in an evenly spaced circular orbit, dimensional activity illustrations integrated with the planets, and minimal permanent text. At 1024px and above the original winding layout and desktop stylesheet remain unchanged.

## Activity illustrations and states

Reading retains Mercury through Pluto and the exact nine requested concepts: ABC, abc, Aa, ear/sound waves, open book, pencil, building blocks, illustrated storybook and trophy. Writing retains alphabet, number and shape tracing, sentence writing, and its always-available Scribbler; shared pencils pair with the appropriate activity symbol. Maths uses number, shape, colour, sorting, addition, subtraction, grouping and assessment illustrations. All current Little Explorers mission families have visual associations, including the specific five shapes, five tracing paths, three animal puzzles, building and music activities. New unrecognised stages still render a usable book/trophy fallback instead of disappearing.

Only the mobile renderer changes. The presentation map in `missionIllustrations.js` neither sorts items nor changes their callbacks, IDs, titles, descriptions, completion or locks. The original full mission and state remain in each native button's accessible name. Hover tooltips retain the original descriptions; no extra button, panel or intermediate screen is introduced. Permanent mission bubbles are visually hidden in the orbit.

Locked planets darken and desaturate their entire texture/illustration group beneath one centred 3D padlock. Number badges remain visible. Completed destinations stay coloured and display a green tick; the current destination has a gentle golden halo. Original disabled-button semantics and the rocket flight/navigation handoff are unchanged. The parked rocket is smaller and visually offset from the activity illustration.

## Responsive composition

The mobile map is a grid with a measured content region between its header and bottom navigation. `ResizeObserver` measures that region's width and height. `planetOrbitLayout` derives the orbit radius, planet/touch size, centre island size and central point from those actual dimensions. The island stays at the exact centre of its orbit. On portrait screens the whole orbit moves lower by up to 64px when spare height is available, spending the previous empty bottom band without covering the bottom navigation. Mobile/tablet maps reserve the top status-bar/notch inset plus a 32px portrait gap, and respect left/right cutout insets in landscape. The logo/back row, adventure banner and journey subtitle have larger vertical gaps. Landscape screens at least 560px wide place their toolbar beside the orbit, with compact padding on very short screens. Bottom-navigation safe areas remain accounted for. Very short screens retain a 190px minimum journey area and allow document scrolling instead of squeezing targets into the system bars.

Touch targets are at least 44px. Planet anchors, mission numbers, locks and completion ticks remain fixed while each planet/illustration group hovers by only two pixels. Reduced-motion and slow-update styles disable the continuous motion; the existing rocket reduced-motion and low-power fallbacks are preserved. Ringed planets fit within their allotted visual space without cropping or modifying the original image files.

## Asset provenance and weight

The built-in **imagegen** tool generated 29 reusable transparent 3D icons. All final files live in `public/mission-icons/`; their filenames, shared generation prompt and individual subject prompts are recorded in [mission-icon-assets.json](mission-icon-assets.json). Original generated PNGs remain in Codex's generated-image directory. The application uses optimised, alpha-preserving WebP exports, totalling 368,400 bytes for the entire set. Shared concepts reuse the same file; desktop does not render the mobile illustration layers. No logo, rocket, planet or adventure-home artwork was replaced. No dependency was added.

## Verification

- The Node suite checks the exact 1024px breakpoint, all counts from one through nine, non-overlapping touch targets, 44px minimum sizes, centred geometry, safe-area budgets, forward/reverse arc endpoints and single-stop orbit closure. The original desktop coordinate/style and artwork-integrity checks remain active.
- Illustration tests cover the exact Reading sequence, Writing/Scribbler semantics, every existing Little Explorers mission family, transparent local assets and their total weight.
- Temporary browser fixtures use the production navigation components and original mission metadata. They report viewport bounds, island/planet collisions, hidden labels, target sizes, image loading, locks, ticks and bottom-navigation clearance without writing user progress.
- Chrome rendered the complete nine-stop Reading orbit at exactly 375×667, 390×844, 430×932, 768×1024 and 820×1180; the 1024×768 fixture retained desktop winding navigation. Additional 667×375, 844×390, 932×430, 375×568, 844×320 and 375×430 fixtures passed.
- Safari also passes the Writing and Maths matrices and the safe-area Reading and shape matrices at the same viewports. All 12 adventure families pass at 390×844 with a simulated 34px bottom inset. Native selections recorded Reading arrivals for the current and both completed destinations (3, 1, 2), plus the Scribbler arrival. These fixtures exercise the unchanged callback handoff without entering a saved learning session.
- The existing selection/lock/rocket/reduced-motion/callback function was compared byte-for-byte with the preceding revision and is unchanged.
- All 38 Node tests, focused ESLint and the production build pass. The existing large-bundle warning remains.

The status-bar spacing revision was additionally checked in Safari with simulated top insets of 0, 20, 47 and 59px, bottom insets up to 34px, and landscape side cutouts of 47/59px. Header controls, heading/subtitle separation and planet reachability passed at the requested widths. The 375×430 short-height case allows 40px of document scrolling to keep its targets usable.

Physical-device touch, installed-PWA and real saved-session learning activities require manual review. No authentication, database, progress, curriculum, routing or adventure-selection changes were made.
