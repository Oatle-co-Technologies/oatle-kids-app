import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { KARAOKE_SONGS } from '../src/components/karaokeData.js';
import { karaokePosition } from '../src/components/karaokeLogic.js';
import { makeExtraAdventures } from '../src/components/littleMissionCatalog.js';

test('ten original instrumental tracks have valid, complete, ordered word cues', () => {
  assert.equal(KARAOKE_SONGS.length, 10);
  assert.equal(KARAOKE_SONGS[0].id, 'abc');
  assert.equal(new Set(KARAOKE_SONGS.map(song => song.src)).size, 10);
  for (const song of KARAOKE_SONGS) {
    assert.ok(song.source && song.recording.includes('Original Oatle Kids'));
    assert.equal(createHash('sha256').update(readFileSync(new URL('../public' + song.src, import.meta.url))).digest('hex'), song.sha256);
    let previous = song.countIn;
    for (const [i, line] of song.lines.entries()) {
      assert.ok(Math.abs(line.start - previous) < .0001);
      assert.ok(line.end > line.start && line.end < song.duration);
      assert.equal(line.words[0].start, line.start);
      assert.equal(line.words.at(-1).end, line.end);
      for (const [j, word] of line.words.entries()) {
        assert.ok(word.text && word.end > word.start);
        assert.deepEqual(karaokePosition(song, (word.start + word.end) / 2), { count: 0, line: i, word: j });
        if (j) assert.ok(Math.abs(word.start - line.words[j - 1].end) < .0001);
      }
      previous = line.end;
    }
    assert.equal(karaokePosition(song, 0).count, 1);
    assert.equal(karaokePosition(song, song.countIn - .001).count, 4);
    assert.equal(karaokePosition(song, song.duration).word, -1);
  }
});

test('ABC highlights every letter in alphabet order, including the quick L-M-N-O-P notes', () => {
  const song = KARAOKE_SONGS[0];
  const letters = song.lines.slice(0, 4).flatMap(line => line.words).filter(word => /^[A-Z]$/.test(word.text));
  assert.equal(letters.map(word => word.text).join(''), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  for (const word of letters) {
    const cue = karaokePosition(song, word.start + .01);
    assert.equal(song.lines[cue.line].words[cue.word].text, word.text);
  }
});

test('karaoke remains available after removing the sung nursery mission', () => {
  const art = ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter'].map(name => ({ name }));
  const missions = makeExtraAdventures(art).find(adventure => adventure.id === 'music').planets;
  assert.deepEqual(missions.map(mission => mission.progressId), ['music-play', 'music-dance', 'music-karaoke']);
  assert.equal(missions[2].mode, 'karaoke');
  assert.equal(missions[2].name, 'Jupiter');
  assert.ok(!missions.some(mission => mission.mode === 'rhymes'));
});


