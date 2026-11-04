# Storybook Adventure

Available from both age groups' adventure menus. Neptune's existing reading mission is unchanged. Book metadata and numeric reading order live in `src/data/storybooks.js`. The supplied public PNG files are used byte-for-byte, including all embedded text and credits.

## Asset audit

| Book | Cover | Numbered pages |
| --- | --- | --- |
| Dumelang! | dumelang-cover-page.png | dumelang-page1.png–dumelang-page8.png |
| A Rocket to the Moon | cover-page.png | page1.png–page11.png |
| This is My Family | cover-page.png | page1.png–page6.png |
| When Refilwe Grows Up | cover-page.png | page1.png–page12.png |

All four covers credit Ntombizodwa Moekwa. All 37 numbered pages were visually inspected in numeric order; no sequence gaps or missing illustrations were found. Refilwe's cover is square; its interior pages and the other books are landscape. The reader uses contain sizing, so none are cropped or stretched. Single-page viewing is intentional on desktop as well: two landscape illustrations side by side would reduce readable text size.

At phone portrait widths, embedded text is small, especially **A Rocket to the Moon pages 3–11**, **When Refilwe Grows Up pages 1–12**, and **Dumelang! pages 2, 4, 6–8**. Family pages 1–6 also benefit from enlargement. Original illustrations are unchanged. Phone portrait mode now prompts readers to turn their device sideways, with an optional Read here for now control. The landscape reader fits each page to its natural proportions and available height, removing the previous fixed-height white margins. Both adventure menus and the older children’s home screen display all four original covers before entering the shelf. Reading options collapse into a menu to leave more room for illustrations in landscape. Enlarge page provides a scrollable 1400px view, with Fit page to return. Landscape phone orientation is helpful.

## Page turning

Evaluated [react-pageflip](https://github.com/Nodlik/react-pageflip) and its [StPageFlip engine](https://github.com/Nodlik/StPageFlip). Chose a small native Web Animations implementation for this fixed illustration-only reader, avoiding a React wrapper dependency in this React 19 app. A leaf rotates about its left spine, darkens toward the edge, and unfolds the next illustration; previous turns reverse direction. The destination illustration sits beneath the turning leaf. No sliding carousel or PDF is used.

A synchronous lock prevents overlapping turns. Destination illustrations must preload before navigation enables. Animation rejection, unavailable APIs, simple-turn mode, and reduced-motion preferences all preserve reading functionality. A timeout releases interrupted turns. Swipes ignore vertical motion and multitouch; enlargement disables swipe navigation so scrolling works. Modal isolation prevents background navigation; Escape and Close return focus to the selected cover.

Only neighbouring illustrations preload, and covers lazy-load. Existing service-worker runtime caching and generated optional precache include the original public assets; artwork is not added to the mandatory shell download. Source PNGs are large (roughly 2–3MB each); first-time offline reading requires their download to complete.

## Validation

- Production build passes (existing large JavaScript chunk warning remains).
- Existing 12 tests pass; added asset test checks all 41 original files, numeric order, uniqueness, PNG headers and dimensions.
- Focused ESLint passes for the new component and configuration.
- Browser QA was attempted, but the computer-use browser host was unavailable. Desktop animation, mobile swipes, focus behavior and visual layout still need verification on a real browser/device. No claim of device testing is made.
