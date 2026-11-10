import test from 'node:test';
import assert from 'node:assert/strict';
import { LITTLE_FEELING_ROUNDS } from '../src/components/feelingsData.js';
import { feelingsStep, initialFeelingsState } from '../src/components/feelingsLogic.js';
import { FACE_CHALLENGES, FACE_PARTS, FEELING_FEATURES, changeFacePart, checkFace } from '../src/components/faceBuilderData.js';

test('little feeling rounds offer two faces and repeat four feelings evenly', () => {
  assert.equal(LITTLE_FEELING_ROUNDS.length, 8);
  for (const id of ['happy', 'sad', 'angry', 'surprised']) assert.equal(LITTLE_FEELING_ROUNDS.filter(r => r.target === id).length, 2);
  for (const round of LITTLE_FEELING_ROUNDS) { assert.equal(round.choices.length, 2); assert.equal(new Set(round.choices).size, 2); assert(round.choices.includes(round.target)); }
});
test('a different face gets gentle guidance and does not advance the younger child', () => {
  const start = feelingsStep(initialFeelingsState(), { type: 'START' });
  const retry = feelingsStep(start, { type: 'FEELING', id: 'sad' });
  assert.equal(retry.phase, 'feeling'); assert.equal(retry.index, 0);
  assert.match(retry.feedback, /smiling mouth/); assert.doesNotMatch(retry.feedback, /wrong|bad|fail/i);
  assert.equal(feelingsStep(retry, { type: 'NEXT' }), retry);
});
test('all little rounds can complete and replay without retaining old answers', () => {
  let state = feelingsStep(initialFeelingsState(), { type: 'START' });
  for (const round of LITTLE_FEELING_ROUNDS) { state = feelingsStep(state, { type: 'FEELING', id: round.target }); assert.equal(state.phase, 'matched'); state = feelingsStep(state, { type: 'NEXT' }); }
  assert.equal(state.phase, 'complete'); assert.equal(feelingsStep(state, { type: 'NEXT' }), state);
  assert.deepEqual(feelingsStep(state, { type: 'RESTART' }), { index: 0, phase: 'feeling', feeling: null, feedback: '' });
});
test('every expression can be built from the actual selectable face parts', () => {
  assert.equal(FACE_CHALLENGES.length, 6);
  for (const challenge of FACE_CHALLENGES) {
    assert.equal(checkFace(challenge, FEELING_FEATURES[challenge.id]).complete, true);
    for (const part of Object.keys(FACE_PARTS)) {
      assert(challenge.accepted[part].every(id => FACE_PARTS[part].some(item => item.id === id)));
      assert(challenge.hints[part]);
    }
    // Alternative drawings can work; feedback does not claim to read a real child's emotions.
    for (const eyes of challenge.accepted.eyes) for (const brows of challenge.accepted.brows) for (const mouth of challenge.accepted.mouth) {
      assert.equal(checkFace(challenge, { eyes, brows, mouth }).complete, true);
    }
  }
});
test('changing one feature preserves the others and never mutates the previous face', () => {
  const original = { ...FEELING_FEATURES.calm };
  const changed = changeFacePart(original, 'mouth', 'smile');
  assert.equal(original.mouth, 'gentle'); assert.equal(changed.mouth, 'smile');
  assert.equal(changed.eyes, original.eyes); assert.equal(changed.brows, original.brows);
  assert.equal(changeFacePart(original, 'nose', 'smile'), original);
  assert.equal(changeFacePart(original, 'mouth', 'unknown'), original);
});
test('unfinished faces get a usable clue and successful faces can be edited again', () => {
  const challenge = FACE_CHALLENGES.find(item => item.id === 'surprised');
  let face = { ...FEELING_FEATURES.calm };
  const result = checkFace(challenge, face);
  assert.equal(result.complete, false); assert.equal(result.part, 'mouth'); assert.match(result.message, /open mouth/);
  for (const part of ['mouth', 'brows', 'eyes']) face = changeFacePart(face, part, FEELING_FEATURES.surprised[part]);
  assert.equal(checkFace(challenge, face).complete, true);
  assert.equal(checkFace(challenge, changeFacePart(face, 'mouth', 'frown')).complete, false);
});
