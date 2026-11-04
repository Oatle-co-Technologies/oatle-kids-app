import test from 'node:test';
import assert from 'node:assert/strict';
import { colourMixingQuestions } from '../src/data/colourMixingQuestions.js';

test('colour mixing uses plain spoken prompts and named colour clues instead of equations', () => {
  assert.equal(colourMixingQuestions.length, 20);
  for (const question of colourMixingQuestions) {
    assert.equal(question.mix.length, 2);
    assert.equal(question.mixNames.length, 2);
    assert(!/[+=?]/.test(question.prompt), question.prompt);
    for (const name of question.mixNames) assert(question.prompt.includes(name));
    if (question.teaching) assert(question.prompt.includes(question.answer));
    else {
      assert(question.options.includes(question.answer));
      assert(question.prompt.endsWith('Tap the colour we get.'));
    }
  }
});

test('new colour-mixing wording retains the old saved assessment identities', () => {
  for (const question of colourMixingQuestions.filter(q => !q.teaching)) {
    const [first, second] = question.mixNames;
    assert.equal(question.assessmentKey, `${first[0].toUpperCase()}${first.slice(1)} + ${second} = ?`);
  }
});
