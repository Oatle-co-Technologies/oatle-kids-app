import test from 'node:test';
import assert from 'node:assert/strict';
import { galaxyHomeLayout } from '../src/components/galaxyHomeLayout.js';
import { BIG_KIDS_HOMES } from '../src/components/bigKidsHomes.js';
import { routeBetween } from '../src/components/spaceJourneyLogic.js';

test('all existing adventures retain their exact navigation IDs, with storybooks following Arcade', () => {
  assert.deepEqual(BIG_KIDS_HOMES.map(item => item.id), ['reading', 'writing', 'counting', 'cosmicPuzzles', 'spaceBuilder', 'storybooks']);
  assert.equal(new Set(BIG_KIDS_HOMES.map(item => item.image)).size, 6);
  for (const home of BIG_KIDS_HOMES) assert.match(home.image, /^\/adventure-homes\/[^/]+\.webp$/);
});

test('desktop and phone layouts keep every complete home within the board', () => {
  for (const compact of [false, true]) {
    const { points, height } = galaxyHomeLayout(compact);
    assert.equal(points.length, BIG_KIDS_HOMES.length);
    for (const p of points) {
      const halfWidth = compact ? .235 * 720 : .135 * 720;
      assert.ok(p.x - halfWidth >= 0);
      assert.ok(p.x + halfWidth <= 720);
      assert.ok(p.y - 130 >= 0);
      assert.ok(p.y + 160 <= height);
    }
    assert.ok(points[5].y > points[3].y && points[5].y > points[4].y, 'Storybook home sits below the Arcade homes');
  }
});

test('the existing rocket path engine reaches every home in both layouts and directions', () => {
  for (const compact of [false, true]) {
    const { points } = galaxyHomeLayout(compact);
    for (let from = 0; from < points.length; from++) {
      for (let to = 0; to < points.length; to++) {
        const path = routeBetween(points, from, to);
        assert.ok(path.startsWith(`M ${points[from].x} ${points[from].y}`));
        assert.ok(path.endsWith(`${points[to].x} ${points[to].y}`));
        assert.equal((path.match(/ C /g) || []).length, Math.abs(to - from));
      }
    }
  }
});

test('every home and galaxy background uses an existing WebP asset', async () => {
  const { readFile } = await import('node:fs/promises');
  for (const path of [...BIG_KIDS_HOMES.map(home => home.image), '/adventure-homes/galaxy.webp']) {
    const file = await readFile(new URL(`../public${path}`, import.meta.url));
    assert.equal(file.subarray(0, 4).toString(), 'RIFF', path);
    assert.equal(file.subarray(8, 12).toString(), 'WEBP', path);
    assert.ok(file.length < 250_000, `${path} stays lightweight`);
  }
});
