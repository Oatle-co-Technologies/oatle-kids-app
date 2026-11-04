import test from 'node:test';
import assert from 'node:assert/strict';
import { ANIMALS, isRightFood, isRightHome } from '../src/components/animalLogic.js';
import { feedingChoices } from '../src/components/feedingChoices.js';
test('every feeding round has just two objects with exactly one accepted food', () => {
  for (const animal of ANIMALS) {
    const choices = feedingChoices(animal.id);
    assert.equal(choices.length, 2);
    assert.equal(new Set(choices.map(c=>c.food)).size, 2);
    assert.equal(choices.filter(c=>isRightFood(animal.id,c.food)).length, 1);
  }
  assert.deepEqual(feedingChoices('missing'), []);
});

test('each two-home scene has exactly one matching home for its animal', () => {
  for (const animal of ANIMALS) {
    const choices = feedingChoices(animal.id);
    assert.equal(new Set(choices.map(c => c.home)).size, 2);
    assert.equal(choices.filter(c => isRightHome(animal.id, c.home)).length, 1);
  }
});
