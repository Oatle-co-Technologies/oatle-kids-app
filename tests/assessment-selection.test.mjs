import test from 'node:test';
import assert from 'node:assert/strict';
import { selectAssessment, restoreAssessmentQuestions, assessmentResults } from '../src/utils/assessmentSelection.js';
const skills = [{ id: 'letters' }, { id: 'words' }];
const pool = skills.flatMap(({ id }) => Array.from({ length: 12 }, (_, i) => ({ skill: id, assessmentId: `${id}-${i}` })));
test('new attempts retain skill coverage and use fresh questions, without changing their banks', () => {
  const first = selectAssessment(pool, skills, 4, [], () => .4);
  const second = selectAssessment(pool, skills, 4, first.map(q => q.assessmentId), () => .4);
  assert.equal(first.length, 8);
  for (const { id } of skills) assert.equal(second.filter(q => q.skill === id).length, 4);
  assert(!second.some(q => first.some(old => old.assessmentId === q.assessmentId)));
  assert.equal(pool[0].assessmentId, 'letters-0');
});
test('small banks can reuse necessary questions, but never duplicate them within an attempt', () => {
  const small = pool.slice(0, 3);
  const selected = selectAssessment(small, skills.slice(0, 1), 2, small.map(q => q.assessmentId));
  assert.equal(selected.length, 2); assert.equal(new Set(selected.map(q => q.assessmentId)).size, 2);
});
test('resuming restores exact question order and rejects incomplete old banks or duplicated IDs', () => {
  const ids = ['words-2', 'letters-5'];
  assert.deepEqual(restoreAssessmentQuestions(ids, pool).map(q => q.assessmentId), ids);
  assert.deepEqual(restoreAssessmentQuestions(['words-2', 'removed'], pool), []);
  assert.deepEqual(restoreAssessmentQuestions(['words-2', 'words-2'], pool), []);
});
test('assessment reports count the final answer and give each skill its own total', () => {
  assert.deepEqual(assessmentResults(skills, [{ skill: 'letters', correct: true }, { skill: 'words', correct: false }, { skill: 'words', correct: true }]), {
    letters: { total: 1, correct: 1 }, words: { total: 2, correct: 1 },
  });
});
