import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,statSync} from 'node:fs';
import {MUSIC_INSTRUMENTS,COPY_INSTRUMENTS,DANCE_SONGS,MUSIC_LICENCE} from '../src/components/musicGardenData.js';
test('copy uses the same five instruments as free play, one instrument per turn',()=>{
 assert.equal(new Set(MUSIC_INSTRUMENTS).size,5);assert.deepEqual(COPY_INSTRUMENTS,MUSIC_INSTRUMENTS);
});
test('four distinct recorded songs ship with their source and attribution',()=>{
 assert.equal(DANCE_SONGS.length,4);assert.equal(new Set(DANCE_SONGS.map(s=>s.src)).size,4);
 const attribution=readFileSync(new URL('../public/music-garden/ATTRIBUTION.txt',import.meta.url),'utf8');
 for(const song of DANCE_SONGS){assert.ok(statSync(new URL('../public'+song.src,import.meta.url)).size>100000);assert.ok(attribution.includes(song.title));assert.ok(attribution.includes(song.isrc));}
 assert.ok(attribution.includes(MUSIC_LICENCE));assert.ok(attribution.includes('Kevin MacLeod'));
});

test('copy examples contain four audible beats and finish before the child’s turn', async()=>{
 const {COPY_BEATS_MS,COPY_TURN_MS}=await import('../src/components/musicGardenData.js');
 assert.equal(COPY_BEATS_MS.length,4);
 assert.ok(COPY_BEATS_MS.at(-1)-COPY_BEATS_MS[0]>=2500);
 assert.ok(COPY_TURN_MS>=COPY_BEATS_MS.at(-1)+700);
 for(let i=1;i<COPY_BEATS_MS.length;i++)assert.ok(COPY_BEATS_MS[i]>COPY_BEATS_MS[i-1]);
});
