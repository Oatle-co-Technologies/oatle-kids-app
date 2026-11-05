import test from 'node:test';
import assert from 'node:assert/strict';
import { cosmicPlanetLayout } from '../src/components/cosmicPlanetLayout.js';
import { galaxyHomeLayout } from '../src/components/galaxyHomeLayout.js';
import { routeBetween } from '../src/components/spaceJourneyLogic.js';

test('planet destinations use the exact Cosmic home desktop and phone coordinates', () => {
  for (const compact of [false, true]) assert.deepEqual(cosmicPlanetLayout(6, compact).points, galaxyHomeLayout(compact).points);
});
test('all journey lengths fit and retain ordered, reversible connecting routes', () => {
  for (const compact of [false, true]) for (const count of [0, 1, 3, 4, 5, 6, 9, 12, 20]) {
    const { points, height } = cosmicPlanetLayout(count, compact);
    assert.equal(points.length, count);
    points.forEach((point, i) => {
      assert.ok(point.x > 80 && point.x < 640);
      assert.ok(point.y + 190 < height);
      if (i) {
        assert.notDeepEqual(point, points[i - 1]);
        assert.ok(routeBetween(points, i - 1, i).endsWith(`${point.x} ${point.y}`));
        assert.ok(routeBetween(points, i, i - 1).endsWith(`${points[i - 1].x} ${points[i - 1].y}`));
      }
    });
  }
});
