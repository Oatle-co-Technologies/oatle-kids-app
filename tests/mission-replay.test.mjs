import test from 'node:test';
import assert from 'node:assert/strict';
import { beginMissionRun, finishMissionRun } from '../src/utils/missionReplay.js';

test('completed and legacy-unlocked missions reopen at the beginning without losing achievements', () => {
  for (const progress of [
    {unlocked:7,missions:{6:19},startedMissions:{6:true},completedMissions:{6:true}},
    {unlocked:7,missions:{6:19},startedMissions:{6:true}},
  ]) {
    const run=beginMissionRun(progress,6);
    assert.equal(run.missions[6],0);assert.equal(run.startedMissions[6],false);
    assert.equal(run.unlocked,7);assert.deepEqual(run.completedMissions,progress.completedMissions);
  }
});
test('unfinished first attempts and paused replays resume at the saved step', () => {
  const fresh=beginMissionRun({unlocked:6,missions:{6:3},startedMissions:{6:true}},6);
  assert.equal(fresh.missions[6],3);
  const replay=beginMissionRun({unlocked:7,missions:{6:4},completedMissions:{6:true},missionRuns:{6:'in-progress'}},6);
  assert.equal(replay.missions[6],4);
});
test('finishing a replay makes its next visit fresh, and Start again can reset a paused run', () => {
  const run={unlocked:7,missions:{6:19},completedMissions:{6:true},missionRuns:{6:'in-progress'}};
  assert.equal(beginMissionRun(finishMissionRun(run,6),6).missions[6],0);
  assert.equal(beginMissionRun(run,6,{restart:true}).missions[6],0);
});
test('the new writing mission is not mistaken for a completed older mission', () => {
  const run=beginMissionRun({unlocked:5,missions:{4:3},completedMissions:{4:false,5:true}},4);
  assert.equal(run.missions[4],3);assert.equal(run.completedMissions[5],true);
});
