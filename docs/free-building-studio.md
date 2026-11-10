# Age-specific free building

## Big Kids

Space Challenge Arcade → Space Builder now includes a Build Anything free-play card. It opens the full space studio with six colours, square blocks, all 26 letters in upper and lower case, undo/redo, remove, clear and Done. Back and Done return to Space Builder's mission list. Free play does not mark any blueprint mission complete. Existing blueprint missions and saved completion IDs remain unchanged.

## Little Explorers

Building Adventure's free mission now uses the simplified playground: three large coloured square choices, 72px phone / 88px desktop building blocks, and only Back, Undo, Clear and Done. There are no alphabet tabs, letter-case controls, redo or individual-delete tools. Tap and drag placement, reversible clearing and the existing mission completion callback remain available. Guided Build This shape pictures remain unchanged.

## Verification

The actual parent components were mounted in an isolated DOM check: Little Explorers renders the simple variant, the Big Kids free-play card opens the full variant, completion and return navigation work, and blueprint progress is unchanged. The layouts were also checked in a browser at desktop and 320px phone widths. Existing placement, collision, bounds and undo/redo regression checks remain applicable to the shared interaction logic.

The full-screen backdrop fills the area above the existing app navigation. Each variant has a compact tray and no visible instruction paragraphs. Constructions remain in activity memory; leaving the activity clears the current creation, matching prior behaviour. Authentication and subscriptions are unaffected.
