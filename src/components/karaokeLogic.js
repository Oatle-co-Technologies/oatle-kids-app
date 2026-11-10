// Cues follow the media clock, so pause/resume and buffering cannot drift from the music.
export function karaokePosition(song, seconds) {
  const time = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  if (time < song.countIn) return { count: Math.min(4, Math.floor(time / (60 / song.bpm)) + 1), line: -1, word: -1 };
  const line = song.lines.findIndex(cue => time >= cue.start && time < cue.end);
  if (line < 0) return { count: 0, line: song.lines.length - 1, word: -1 };
  return { count: 0, line, word: song.lines[line].words.findIndex(cue => time >= cue.start && time < cue.end) };
}
