import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { MISSION_ILLUSTRATIONS, missionIllustration, missionIconPath } from '../src/components/missionIllustrations.js';
import { EXTRA_ADVENTURES } from '../src/components/littleMissionCatalog.js';

test('Reading uses the nine approved activity illustrations in the original mission sequence', () => {
  assert.deepEqual(MISSION_ILLUSTRATIONS.reading.map(icons => icons[0]), ['uppercase', 'lowercase', 'letter-pair', 'ear', 'book', 'pencil', 'blocks', 'storybook', 'trophy']);
  assert.equal(MISSION_ILLUSTRATIONS.counting.length, 9);
  assert.equal(MISSION_ILLUSTRATIONS.writing.length, 5);
  assert.deepEqual(missionIllustration('writing', { id:'scribbler', free:true }, 4), ['palette', 'pencil']);
  for (const adventure of EXTRA_ADVENTURES) assert.equal(MISSION_ILLUSTRATIONS[adventure.id].length, adventure.missions.length);
  for (const [id, count] of [['balloons',5],['shapes',5],['trail',5],['scribble',2],['discovery',2]]) assert.equal(MISSION_ILLUSTRATIONS[id].length,count);
  assert.deepEqual(missionIllustration('reading', {id:'future-stage'}, 99), ['book']);
});

test('every referenced mission icon is a small transparent local WebP, reusing the original branded rocket', async () => {
  const keys = new Set([...Object.values(MISSION_ILLUSTRATIONS).flat(2), 'lock']);
  let total = 0;
  for (const key of keys) {
    const url = missionIconPath(key);
    const bytes = await readFile(new URL(`../public${url}`,import.meta.url));
    if (key === 'rocket') { assert.equal(url,'/rocket/oatle-rocket.png'); continue; }
    assert.equal(bytes.subarray(0,4).toString(),'RIFF',key);
    assert.equal(bytes.subarray(8,12).toString(),'WEBP',key);
    assert.ok(bytes.includes(Buffer.from('ALPH')),`${key} preserves a transparent background`);
    assert.ok(bytes.length<30_000,`${key} stays lightweight`);
    total += bytes.length;
  }
  assert.ok(total<400_000,'the complete reusable icon set stays below 400KB');
});
