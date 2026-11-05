import test from 'node:test';
import assert from 'node:assert/strict';
import { missionBreakDue } from '../src/components/missionBreakLogic.js';
test('each long or short mission gets one break halfway through, never at its start or end', () => {
  for (const total of [2, 5, 10, 21, 26, 40]) {
    const due = Array.from({length:total}, (_, step) => missionBreakDue(step,total));
    assert.equal(due.filter(Boolean).length,1);
    assert.equal(due[Math.ceil(total/2)],true);
    assert.equal(missionBreakDue(total,total),false);
  }
});
test('finishing the break suppresses repeats and invalid or single-step missions do not interrupt', () => {
  assert.equal(missionBreakDue(13,26,true),false);
  for(const [step,total] of [[0,0],[0,1],[1,1],[-1,10],[NaN,20],[2,2.5]]) assert.equal(missionBreakDue(step,total),false);
});
