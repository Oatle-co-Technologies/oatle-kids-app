# Big Kids floating adventure homes

This update changes only the Big Kids adventure-selection presentation. The six existing destinations use new 3D-style floating-home artwork: Reading, Writing, Maths, Cosmic Puzzles, Space Builder, and Storybook Adventure. Both Arcade activities remain separate and accessible; Storybook sits below them.

The original Oatle Kids wordmark and `public/rocket/oatle-rocket.png` are unchanged. SpaceJourney's existing selection guard, rocket keyframe generation, reduced-motion and low-power fallbacks, timeout, cleanup, and navigation callback are reused. The shared component accepts optional home coordinates, board height, a scoped visual class, and an auto-scroll preference. Its defaults retain the previous planet-map and Little Explorers presentation. `galaxyHomeLayout.js` supplies separate desktop and phone coordinates; the same curve sampler follows those coordinates. No new animation dependency was needed.

`AdventureWorlds.css` is scoped to Big Kids' galaxy. Transparent home renders have subtle staggered transform animations, layered shadows, and a gold-edged name plaque. The destination being approached glows during the existing flight; the activity opens only when the existing engine completes arrival. Reduced-motion and slow-update displays stop continuous hovering. The entire illustration/name is one native button with keyboard focus and an accessible name.

No Little Explorers source, learning activity, scoring, mission order, unlocking, authentication, subscription, or database changes were made for this follow-up. The working tree also contains the previously requested broader redesign; this update preserves that existing work.

## Artwork

Created with the built-in image_gen tool. Branding was not supplied as an edit target and no generated rockets or replacement logos are used. Exact prompts are in `docs/galaxy-image-prompts.json`.

Project assets:

- `public/adventure-homes/reading.webp`
- `public/adventure-homes/writing.webp`
- `public/adventure-homes/maths.webp`
- `public/adventure-homes/puzzles.webp`
- `public/adventure-homes/builder.webp`
- `public/adventure-homes/storybooks.webp`
- `public/adventure-homes/galaxy.webp`

Original generated PNGs remain in the generation output directory. Copies were exported as WebP with alpha retained for the six homes. Home images are 800px square (approximately 128–181KB each); the background is about 69KB. All seven assets total under 1MB. Browser lazy loading and existing PWA runtime/optional precaching apply.

## Checks

- Production build and focused ESLint pass. The existing large-bundle warning remains.
- All 23 Node tests pass, including retained mission-route/progress tests and new checks for exact adventure IDs, all-home forward/reverse routes, desktop/phone board bounds, Arcade/Storybook placement, and presence/size of every WebP.
- Native Chrome rendered the dimensional homes, backdrop and original rocket. The isolated preview arrival log showed successful callbacks for all six destinations. The initial composition exposed overlapping footer copy, which was corrected. Wide-screen entry no longer scrolls the heading/logo out of view; mission-map scrolling defaults remain unchanged.
- Browser automation hosting is unavailable, and native Chrome stopped exposing content during the final refresh. The final phone viewport, real touch input, authenticated entry into every activity, and installed-PWA behavior still need device verification. No claim of full device testing is made.
- Temporary isolated preview files were removed. The actual local game remains available at `/app.html`. Not committed or deployed.
