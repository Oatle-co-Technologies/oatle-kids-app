import test from 'node:test';
import assert from 'node:assert/strict';
import { renderDrawing, captureDrawing } from '../src/components/saveDrawing.js';

test('export preserves the layer order for both Scribblers and includes writing lines', async () => {
  const original = globalThis.document;
  const calls = [];
  const context = { scale: (...args) => calls.push(['scale', ...args]), fillRect: (...args) => calls.push(['fill', ...args]), drawImage: (...args) => calls.push(['image', ...args]), fillText: (...args) => calls.push(['text', ...args]) };
  globalThis.document = { createElement: () => ({ getContext: () => context }) };
  try {
    for (const above of [false, true]) {
      calls.length = 0;
      const canvas = await renderDrawing({ width: 600, height: 400, background: '#fffdf5', ink: 'pen-strokes', lines: [{ x: 20, y: 40, width: 560, height: 2, colour: '#ddd' }], stickers: [{ x: 80, y: 90, width: 30, height: 30, svg: '<svg/>' }], stickersAboveInk: above }, async () => 'star-sticker');
      assert.equal(canvas.width, 1200); assert.equal(canvas.height, 800);
      assert.deepEqual(calls.filter(c => c[0] === 'image').map(c => c[1]), above ? ['pen-strokes', 'star-sticker'] : ['star-sticker', 'pen-strokes']);
      assert.deepEqual(calls.filter(c => c[0] === 'fill'), [['fill', 0, 0, 600, 400], ['fill', 20, 40, 560, 2]]);
    }
    const large = await renderDrawing({ width: 5000, height: 2500, background: '#fff', ink: 'ink', lines: [], stickers: [] });
    assert.equal(large.width, 4096); assert.equal(large.height, 2048);
  } finally { globalThis.document = original; }
});
test('an unavailable or hidden canvas fails clearly rather than downloading an empty file', () => {
  assert.throws(() => captureDrawing(null), /not ready/);
  assert.throws(() => captureDrawing({ width: 100, height: 100, getBoundingClientRect: () => ({ width: 0, height: 0 }) }), /not visible/);
});
