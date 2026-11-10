import test from 'node:test';
import assert from 'node:assert/strict';
import { COLORING_PAGES } from '../src/components/coloringPages.js';
import { emptyColouring, colourRegion, changeColouring, undoColouring, redoColouring } from '../src/components/coloringLogic.js';

test('each age group has twelve distinct pictures with age-appropriate detail', () => {
  assert.equal(COLORING_PAGES.little.length, 12);
  assert.equal(COLORING_PAGES.big.length, 12);
  assert(COLORING_PAGES.little.every(p => p.regions.length <= 7));
  assert(COLORING_PAGES.big.every(p => p.regions.length >= 15));
  const ids = Object.values(COLORING_PAGES).flat().map(p => p.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const page of Object.values(COLORING_PAGES).flat()) {
    assert.equal(new Set(page.regions.map(r => r.id)).size, page.regions.length);
    assert(page.regions.every(r => r.label && ['ellipse', 'path', 'rect', 'circle', 'polygon'].includes(r.type)));
  }
});
test('recolouring and erasing are reversible without changing the original picture state', () => {
  const blank = emptyColouring();
  const red = colourRegion(blank, 'body', '#f25b68');
  const blue = colourRegion(red, 'body', '#55bafa');
  assert.deepEqual(blank.colours, {});
  assert.deepEqual(undoColouring(blue).colours, red.colours);
  assert.deepEqual(redoColouring(undoColouring(blue)).colours, blue.colours);
  const erased = colourRegion(blue, 'body', null);
  assert.deepEqual(erased.colours, {});
  assert.deepEqual(undoColouring(erased).colours, blue.colours);
});
test('clearing a picture can be undone, and a new edit replaces redo history', () => {
  const coloured = colourRegion(emptyColouring(), 'wing', '#a579db');
  const cleared = changeColouring(coloured, {});
  assert.deepEqual(undoColouring(cleared).colours, coloured.colours);
  const edited = colourRegion(undoColouring(cleared), 'body', '#66c779');
  assert.equal(edited.future.length, 0);
  assert.equal(colourRegion(coloured, 'wing', '#a579db'), coloured);
});
test('page histories stay independent and excessive edits have bounded history', () => {
  const first = colourRegion(emptyColouring(), 'petal', '#f25b68');
  const second = colourRegion(emptyColouring(), 'shell', '#66c779');
  const book = { flower: first, turtle: second };
  book.turtle = undoColouring(second);
  assert.deepEqual(book.flower.colours, { petal: '#f25b68' });
  let state = emptyColouring();
  for (let i = 0; i < 100; i++) state = colourRegion(state, 'body', i % 2 ? '#55bafa' : '#f25b68');
  assert.equal(state.past.length, 60);
  assert.equal(undoColouring(emptyColouring()).past.length, 0);
  assert.equal(redoColouring(emptyColouring()).future.length, 0);
});
