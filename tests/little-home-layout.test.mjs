import test from 'node:test';
import assert from 'node:assert/strict';
import { littleHomeLayout } from '../src/components/littleHomeLayout.js';
import { routeBetween } from '../src/components/spaceJourneyLogic.js';

test('ten Little Explorers homes fit the board without overlapping rows', () => {
  for (const compact of [true, false]) {
    const { points, height } = littleHomeLayout(10, compact);
    for (const point of points) {
      const halfWidth = compact ? .235 * 720 : .135 * 720;
      assert.ok(point.x - halfWidth >= 0 && point.x + halfWidth <= 720);
      assert.ok(point.y - 130 >= 0 && point.y + 160 <= height);
    }
    for (let a = 0; a < points.length; a++) {
      for (let b = a + 1; b < points.length; b++) {
        if (points[a].x === points[b].x) assert.ok(points[b].y - points[a].y >= 280);
      }
    }
  }
});
test('existing rocket navigation can reach all ten homes from every other home', () => {
  for (const compact of [true, false]) {
    const { points } = littleHomeLayout(10, compact);
    for (let from = 0; from < 10; from++) {
      for (let to = 0; to < 10; to++) {
        const route = routeBetween(points, from, to);
        assert.ok(route.startsWith(`M ${points[from].x} ${points[from].y}`));
        assert.ok(route.endsWith(`${points[to].x} ${points[to].y}`));
        assert.ok(!route.includes('NaN'));
      }
    }
  }
});
