# Big Kids puzzle artwork

The Big Kids Cosmic Puzzles use three 1536 × 1024 (3:2) source pictures. Little Kids and Space Builder are unchanged.

- `src/assets/images/puzzles/solar-system.webp`: generated using the built-in imagegen tool, then encoded as quality-90 WebP. Sun plus Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune and Pluto; Uranus has visible rings.
- `src/assets/images/puzzles/astronaut.webp`: generated using the built-in imagegen tool, then encoded as quality-90 WebP. One full-body astronaut, white/navy/gold suit, opaque visor.
- `src/assets/images/puzzles/oatle-kids.svg`: embeds the exact bytes of the existing `public/oatle-kids-wordmark.webp`, centered on a navy background. Small background stars distinguish edge pieces. No logo regeneration or additional rocket illustration. The official logo's own artwork is preserved intact.

The referenced ChatGPT conversation returned no artwork attachments. New illustrations were made to match the user's requested themes.

## Generation prompts

### Solar system

Use case: scientific-educational. Create a polished children's space jigsaw puzzle source illustration, landscape 1536x1024. This is the COMPLETE uncut picture, NO puzzle seams or pieces. Navy starfield with colorful richly shaded planets, clean bold readable labels. Exact sole title at top: 'The Solar System'. Show Sun plus exactly nine distinct labeled bodies arranged clearly in order across flowing rows: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto. Label Sun too. Every named body appears exactly once. Uranus MUST have very visible tilted rings; Saturn has broad rings. Pluto is small. All labels large and correctly spelled, no extra text, no branding, no rockets, no people. Keep labels and bodies comfortably within frame; use the whole canvas with distinctive details useful for assembling a puzzle. Friendly sophisticated illustrated educational style. Not to scale.

### Astronaut

Use case: illustration-story. Landscape 1536x1024 polished children's space puzzle source illustration. Complete uncut picture, NO puzzle seams. ONE gender-neutral astronaut standing alone on a moonlike surface in a beautiful navy starfield space scene. Full body from helmet top through BOTH boots entirely visible with generous margin. White spacesuit with navy panels and gold accents, gloves, boots, life support pack. Completely opaque dark navy/gold tinted visor: absolutely NO face, eyes, skin, hair or facial features visible. Neutral relaxed standing posture, both arms down, no other people, no high five, no rocket, no logo, no words. Astronaut prominent centrally, detailed rock formations, distant planet and starry sky give distinct areas for a child to assemble a puzzle. Warm gold light, charming high quality illustrated style, crisp shapes.

## Compatibility and verification

The current repository used 20/30-piece tile-swapping puzzles, with no puzzle rotation. The new levels are 10 (5×2), 12 (4×3), 16 (4×4), and 20 (5×4). Existing mission IDs, Explorer/Commander IDs, completion storage key, pointer/tap handlers, and success flow remain stable. Existing achievements remain credited under their level IDs. Space Builder retains its independent rotation/placement mechanics.

Browser checks mounted the actual CosmicPuzzles component with shared app styles, without requiring a paid account or modifying authentication. All three pictures and all four difficulties were solved through the real click handlers at 320, 390, 768, and 1440 CSS pixels; saved completion was verified. Pointer dragging was checked across columns and rows. Final layouts were inspected with reference pictures visible. This is browser emulation, not physical-device testing.

Production build passes. All 40 repository tests pass. Changed JavaScript files pass ESLint. Full-project lint has four existing errors in untouched MathSection.jsx and four warnings across Maths and SentenceWritingMission. Build retains its large-chunk warning.
