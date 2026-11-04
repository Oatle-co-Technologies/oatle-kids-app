import test from 'node:test';
import assert from 'node:assert/strict';
import { currentDestination, journeyPoints, routeBetween, JOURNEY_WIDTH } from '../src/components/spaceJourneyLogic.js';

test('the journey preserves reading order with distinct curved stops and room for mobile tap targets', () => {
  for (const count of [1, 4, 6, 9, 12]) {
    const points = journeyPoints(count);
    assert.equal(points.length, count);
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      assert.ok(p.x / JOURNEY_WIDTH * 320 >= 76);
      assert.ok(p.x / JOURNEY_WIDTH * 320 <= 320 - 76);
      if (i) { assert.ok(p.y - points[i - 1].y >= 180); assert.notEqual(p.x, points[i - 1].x); }
    }
  }
});
test('flights visit every intervening stop forward and backward without reordering missions', () => {
  const points = journeyPoints(9);
  for (const [from, to] of [[0, 8], [8, 0], [2, 6], [5, 1]]) {
    const path = routeBetween(points, from, to);
    assert.ok(path.startsWith(`M ${points[from].x} ${points[from].y}`));
    assert.ok(path.endsWith(`${points[to].x} ${points[to].y}`));
    assert.equal((path.match(/ C /g) || []).length, Math.abs(to - from));
  }
});
test('invalid routes are harmless and selecting the parked destination does not invent a flight', () => {
  const points = journeyPoints(4);
  assert.equal(routeBetween(points, -1, 3), '');
  assert.equal(routeBetween(points, 0, 10), '');
  assert.equal(routeBetween(points, 2, 2), `M ${points[2].x} ${points[2].y}`);
});
test('a saved destination never parks the rocket on a locked mission', () => {
  const items = [{id: 1, complete: true}, {id: 2}, {id: 3, locked: true}];
  assert.equal(currentDestination(items, 3), 1);
  assert.equal(currentDestination(items, 'stale'), 1);
  assert.equal(currentDestination(items, 1), 0);
  assert.equal(currentDestination(items, 2), 1);
  assert.equal(currentDestination([{id: 'reading'}, {id: 'storybooks'}], 'storybooks'), 1);
});
test('finished journeys remain revisitable without changing completion or locking flags', () => {
  const items = [{id: 1, complete: true}, {id: 2, complete: true}];
  const snapshot = structuredClone(items);
  assert.equal(currentDestination(items), 1);
  assert.deepEqual(items, snapshot);
});

test('completion markers preserve old question positions, unlock limits and unrelated fields', async () => {
  const { withCompletedDestination } = await import('../src/components/spaceJourneyLogic.js');
  const legacy = { unlocked: 2, activePlanet: 2, question: 7, missions: { 1: 10, 2: 7 }, startedMissions: { 2: true } };
  const marked = withCompletedDestination(legacy, 2);
  assert.equal(marked.unlocked, 2);
  assert.equal(marked.activePlanet, 2);
  assert.equal(marked.question, 7);
  assert.equal(marked.missions, legacy.missions);
  assert.equal(marked.startedMissions, legacy.startedMissions);
  assert.equal(legacy.completedMissions, undefined);
  assert.deepEqual(marked.completedMissions, { 2: true });
  assert.equal(withCompletedDestination(marked, 2), marked);
  assert.deepEqual(withCompletedDestination(marked, 3).completedMissions, { 2: true, 3: true });
});
