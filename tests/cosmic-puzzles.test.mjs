import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PUZZLE_LEVELS, cosmicSolved, shuffleCosmicTiles, swapCosmicTiles } from '../src/components/cosmicPuzzleLogic.js';

test('Big Kids layouts progress from 10 to 20 and can each be solved by swapping', () => {
  assert.deepEqual(Object.values(PUZZLE_LEVELS).map(level => level.pieces), [10, 12, 16, 20]);
  for (const { columns, rows, pieces } of Object.values(PUZZLE_LEVELS)) {
    assert.equal(columns * rows, pieces);
    for (const random of [() => 0, () => 0.5, () => 0.999999]) {
      let tiles = shuffleCosmicTiles(pieces, random);
      assert.equal(cosmicSolved(tiles, pieces), false);
      assert.deepEqual([...tiles].sort((a, b) => a - b), Array.from({ length: pieces }, (_, i) => i));
      for (let target = 0; target < pieces; target++) tiles = swapCosmicTiles(tiles, target, tiles.indexOf(target));
      assert.equal(cosmicSolved(tiles, pieces), true);
    }
  }
});

test('logo puzzle embeds the official wordmark bytes without regenerating or modifying them', () => {
  const svg = readFileSync(new URL('../src/assets/images/puzzles/oatle-kids.svg', import.meta.url), 'utf8');
  const encoded = svg.match(/data:image\/webp;base64,([^"\s]+)/)[1];
  assert.deepEqual(Buffer.from(encoded, 'base64'), readFileSync(new URL('../public/oatle-kids-wordmark.webp', import.meta.url)));
});
