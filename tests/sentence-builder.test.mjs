import test from 'node:test';
import assert from 'node:assert/strict';
import { sentenceQuestions } from '../src/data/sentenceQuestions.js';
import { generateSentenceOptions } from '../src/utils/generateSentenceOptions.js';

test('beginner sentence builder keeps short words and short sentences', () => {
  assert.equal(sentenceQuestions.length, 13, 'Keep saved activity positions stable');
  for (const { words } of sentenceQuestions) {
    const sentence = words.join(' ');
    assert.ok(words.length >= 3 && words.length <= 5, sentence);
    assert.ok(words.every(word => /^[a-z]{1,3}$/i.test(word)), sentence);
    assert.match(words[0], /^[A-Z]/);
  }
});

test('every beginner sentence can be assembled using the existing word tiles', () => {
  for (const { words } of sentenceQuestions) {
    assert.equal(new Set(words).size, words.length, 'Repeated identical tiles cannot be selected twice');
    assert.deepEqual(generateSentenceOptions(words).sort(), [...words].sort());
  }
});
