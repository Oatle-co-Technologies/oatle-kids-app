import test from 'node:test';
import assert from 'node:assert/strict';
import { makeReadingBreakBalloons } from '../src/components/readingBreakLogic.js';

test('Reading breaks vary in length but stay brief with unique reachable balloons', () => {
  const counts = new Set();
  for (const value of [0, .25, .5, .75, .999999]) {
    const balloons = makeReadingBreakBalloons(() => value);
    counts.add(balloons.length);
    assert.equal(new Set(balloons.map(item => item.id)).size, balloons.length);
    assert.equal(new Set(balloons.map(item => item.slot)).size, balloons.length);
    for (const item of balloons) {
      assert.ok(item.slot >= 0 && item.slot < 8);
      assert.ok(item.edge >= 0 && item.edge < 4);
      assert.ok(item.delay >= 0 && item.delay < 1);
      assert.match(item.colour, /^#[0-9a-f]{6}$/i);
    }
  }
  assert.deepEqual([...counts], [4, 5, 6, 7]);
});

test('balloons can arrive from every screen edge and use every reserved cell', () => {
  const edges = new Set();
  const slots = new Set();
  for (let i = 0; i < 100; i++) {
    let seed = i + 1;
    const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    for (const item of makeReadingBreakBalloons(random)) {
      edges.add(item.edge); slots.add(item.slot);
    }
  }
  assert.equal(edges.size, 4); assert.equal(slots.size, 8);
});
