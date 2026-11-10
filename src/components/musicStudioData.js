export const RECORDING_LIMIT_SECONDS = 60;
export const RECORDING_LIMIT_NOTES = 256;
export const NOTE_ROUNDS = [{
  pitch: 0,
  name: 'C'
}, {
  pitch: 2,
  name: 'D'
}, {
  pitch: 4,
  name: 'E'
}, {
  pitch: 5,
  name: 'F'
}, {
  pitch: 7,
  name: 'G'
}, {
  pitch: 9,
  name: 'A'
}, {
  pitch: 11,
  name: 'B'
}, {
  pitch: 12,
  name: 'High C'
}];
const kinds = new Set(['piano', 'violin', 'xylophone', 'drum', 'bongos', 'bell']);
export function validTune(value) {
  return Array.isArray(value) && value.length > 0 && value.length <= RECORDING_LIMIT_NOTES && value.every((n, i) => n && kinds.has(n.kind) && Number.isInteger(n.pitch) && n.pitch >= 0 && n.pitch <= 12 && Number.isFinite(n.time) && n.time >= 0 && n.time <= RECORDING_LIMIT_SECONDS && (i === 0 || n.time >= value[i - 1].time));
}
export function encodeWave(buffer) {
  const samples = buffer.getChannelData(0);
  const data = new ArrayBuffer(44 + samples.length * 2),
    v = new DataView(data);
  const write = (offset, text) => {
    for (let i = 0; i < text.length; i++) v.setUint8(offset + i, text.charCodeAt(i));
  };
  write(0, 'RIFF');
  v.setUint32(4, 36 + samples.length * 2, true);
  write(8, 'WAVE');
  write(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, buffer.sampleRate, true);
  v.setUint32(28, buffer.sampleRate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  write(36, 'data');
  v.setUint32(40, samples.length * 2, true);
  samples.forEach((sample, i) => v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, sample)) * (sample < 0 ? 32768 : 32767), true));
  return data;
}
export const STUDIO_NOTES = [{
  name: 'C',
  pitch: 0
}, {
  name: 'D',
  pitch: 2
}, {
  name: 'E',
  pitch: 4
}, {
  name: 'F',
  pitch: 5
}, {
  name: 'G',
  pitch: 7
}, {
  name: 'A',
  pitch: 9
}, {
  name: 'B',
  pitch: 11
}, {
  name: 'High C',
  pitch: 12
}];
export const INSTRUMENT_NAMES = {
  piano: 'Piano',
  violin: 'Violin',
  xylophone: 'Xylophone',
  drum: 'Drum',
  bongos: 'Bongos',
  bell: 'Bell'
};

// Queue playback callbacks, not oscillator voices: future notes must not exhaust
// the audio engine's limit before the recording reaches them.
export function scheduleTunePlayback(notes, schedule, play, finish) {
  if (!validTune(notes)) return false;
  for (const note of notes) schedule(() => play(note), note.time * 1000);
  schedule(finish, (notes.at(-1).time + 1.4) * 1000);
  return true;
}
