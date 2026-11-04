import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { planetJourneyLayout, planetJourneyProgress, PLANET_NAMES } from '../src/components/planetJourneyLayout.js';
import { routeBetween } from '../src/components/spaceJourneyLogic.js';
import { adventureEntryScreen } from '../src/components/bigKidsHomes.js';

test('learning homes enter their maps directly; Arcade and Storybook keep their existing screens', () => {
  for (const [id, screen] of Object.entries({reading: 'map', writing: 'writingMap', counting: 'math', cosmicPuzzles: 'cosmicPuzzles', spaceBuilder: 'spaceBuilder', storybooks: 'storybooks'})) {
    assert.equal(adventureEntryScreen(id), screen);
    assert.notEqual(adventureEntryScreen(id), 'launch');
  }
  assert.equal(adventureEntryScreen('unknown'), null);
});

test('all original planet identities, rocket, logo and shared galaxy artwork are unchanged', async () => {
  const originals = JSON.parse(await readFile(new URL('./fixtures/original-space-artwork.json', import.meta.url)));
  assert.ok(Object.keys(originals).length >= 13);
  for (const [path, expected] of Object.entries(originals)) {
    const file = await readFile(new URL(`../${path}`, import.meta.url));
    assert.equal(createHash('sha256').update(file).digest('hex'), expected, path);
  }
  assert.deepEqual(PLANET_NAMES, ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']);
});

test('four- and nine-planet routes keep original item order with room for readable phone labels', () => {
  for (const count of [4, 9]) {
    for (const compact of [false, true]) {
      const {points, height} = planetJourneyLayout(count, compact);
      assert.equal(points.length, count);
      const width = compact ? 296 : 720;
      const half = compact ? width * .23 : 107.5;
      for (let i = 0; i < count; i++) {
        const x = points[i].x / 720 * width;
        assert.ok(x - half >= 0 && x + half <= width);
        assert.ok(points[i].y >= 82 && points[i].y + 190 < height);
        if (i) {
          const path = routeBetween(points, i - 1, i);
          assert.ok(path.startsWith(`M ${points[i - 1].x} ${points[i - 1].y}`));
          assert.ok(path.endsWith(`${points[i].x} ${points[i].y}`));
        }
      }
      for (let i = 2; i < count; i++) {
        if (compact && points[i].x === points[i-1].x) assert.ok(points[i].y - points[i-1].y >= 290, 'Adjacent row endpoints leave space for labels');
      }
    }
  }
});

test('new progress presentation reads existing completion flags without changing locks or saved positions', () => {
  const items = Object.freeze([Object.freeze({id: 1, complete: true}), Object.freeze({id: 2, complete: false}), Object.freeze({id: 3, locked: true})]);
  assert.deepEqual(planetJourneyProgress(items), {completed: 1, total: 3});
  assert.equal(items[2].locked, true);
  assert.deepEqual(planetJourneyProgress([]), {completed: 0, total: 0});
});
