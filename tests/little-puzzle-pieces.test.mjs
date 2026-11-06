import test from 'node:test';
import assert from 'node:assert/strict';
import { shuffleTiles, swapTiles, isSolved } from '../src/components/puzzleLogic.js';
test('Little Explorers puzzles start with five unsolved pieces and can be completed', () => {
  for (let attempt=0; attempt<30; attempt++) {
    let pieces=shuffleTiles();
    assert.deepEqual([...pieces].sort(),[0,1,2,3,4]);
    assert.equal(isSolved(pieces),false);
    for (let target=0;target<5;target++) pieces=swapTiles(pieces,pieces.indexOf(target),target);
    assert.equal(isSolved(pieces),true);
  }
  assert.equal(isSolved([0,1,2,3,4,5,6,7,8,9]),false);
});
