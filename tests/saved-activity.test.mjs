import test from 'node:test';
import assert from 'node:assert/strict';
import { readSavedActivity, saveActivity, resumeScreen } from '../src/utils/savedActivity.js';
test('saved activity survives a new read and unsupported screens fall back safely', () => {
 const data=new Map(); globalThis.localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
 const saved={screen:'writingMission2',writingActivePlanet:2}; saveActivity('location',saved);
 assert.deepEqual(readSavedActivity('location',{}),saved);
 assert.equal(resumeScreen(saved,['writingMission2'],'explore'),'writingMission2');
 assert.equal(resumeScreen({screen:'celebration'},['writingMission2'],'explore'),'explore');
 data.set('broken','{'); assert.deepEqual(readSavedActivity('broken',{}),{});
 data.set('invalid','[]'); assert.deepEqual(readSavedActivity('invalid',{}),{});
 delete globalThis.localStorage;
});
test('unavailable storage does not prevent play',()=>{
 globalThis.localStorage={getItem(){throw Error('unavailable')},setItem(){throw Error('unavailable')}};
 assert.deepEqual(readSavedActivity('x',{}),{});assert.doesNotThrow(()=>saveActivity('x',{}));delete globalThis.localStorage;
});
