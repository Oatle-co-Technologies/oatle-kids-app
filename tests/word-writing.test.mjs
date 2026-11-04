import test from 'node:test';
import assert from 'node:assert/strict';
import { WRITING_WORDS, migrateWritingProgress } from '../src/data/wordWriting.js';

test('word writing provides ten distinct beginner three-letter words', () => {
  assert.equal(WRITING_WORDS.length, 10);
  assert.equal(new Set(WRITING_WORDS).size, 10);
  assert(WRITING_WORDS.every(word => /^[a-z]{3}$/.test(word)));
});
test('new writers follow letters, numbers, shapes, words, then sentences', () => {
  assert.deepEqual(migrateWritingProgress(null), {version:2,unlocked:1,missions:{},startedMissions:{},completedMissions:{}});
});
test('existing sentence progress moves intact while the new word mission stays unfinished', () => {
  const old={unlocked:4,missions:{1:8,4:2},startedMissions:{4:true},completedMissions:{1:true,2:true,3:true,4:true}};
  const snapshot=JSON.stringify(old);const saved=migrateWritingProgress(old);
  assert.equal(saved.unlocked,5);assert.equal(saved.missions[5],2);assert.equal(saved.startedMissions[5],true);
  assert.equal(saved.completedMissions[5],true);assert.equal(saved.completedMissions[4],false);
  assert.equal(saved.missions[1],8);assert.equal(saved.missions[4],undefined);
  assert.deepEqual(migrateWritingProgress(saved),saved);
  assert.equal(JSON.stringify(old),snapshot);
});
test('earlier writers keep their existing locks and version-two word progress never remaps', () => {
  assert.equal(migrateWritingProgress({unlocked:2,missions:{2:3}}).unlocked,2);
  const saved={version:2,unlocked:4,missions:{4:7},startedMissions:{4:true},completedMissions:{3:true}};
  assert.equal(migrateWritingProgress(saved).missions[4],7);
  assert.equal(migrateWritingProgress(saved).missions[5],undefined);
});
