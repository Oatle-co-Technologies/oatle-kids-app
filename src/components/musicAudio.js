import { encodeWave, validTune } from './musicStudioData.js';
// Interactive instrument voices only. Dance music uses separately credited recordings.
export function createMusicAudio(options = {}) {
  let context;
  let output;
  let disposed = false;
  const voices = new Set();

  async function unlock() {
    if (disposed) return false;
    try {
      if (!context) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext && !options.context) return false;
        context = options.context || new AudioContext();
        output = context.createGain();
        output.gain.value = 0.55;
        const limiter = context.createDynamicsCompressor();
        output.connect(limiter);
        limiter.connect(context.destination);
      }
      if (options.offline) return !disposed;
      await context.resume();
      return !disposed && context.state === 'running';
    } catch { return false; }
  }

  function tone(frequency, time, duration, volume, type = 'sine', endFrequency) {
    if (!context || disposed || voices.size >= (options.offline ? 1024 : 64)) return;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, time);
    if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, time + duration);
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(volume, time + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + duration);
    oscillator.connect(envelope);
    envelope.connect(output);
    voices.add(oscillator);
    oscillator.onended = () => { voices.delete(oscillator); oscillator.disconnect(); envelope.disconnect(); };
    oscillator.start(time);
    oscillator.stop(time + duration + 0.02);
  }

  function hit(instrument, delay = 0, pitch = 0) {
    if (!context || (!options.offline && context.state !== 'running') || disposed) return;
    const time = context.currentTime + delay;
    const frequency = 523.25 * 2 ** (pitch / 12);
    if (instrument === 'drum') {
      tone(155, time, 0.3, 0.65, 'sine', 55);
      tone(310, time, 0.055, 0.12, 'triangle', 90);
    } else if (instrument === 'bongos') {
      tone(240 * 2 ** (pitch / 12), time, 0.22, 0.5, 'sine', 115 * 2 ** (pitch / 12));
      tone(460 * 2 ** (pitch / 12), time, 0.045, 0.11, 'triangle', 220 * 2 ** (pitch / 12));
    } else if (instrument === 'xylophone') {
      tone(frequency, time, 0.5, 0.32);
      tone(frequency * 3, time, 0.13, 0.06);
    } else if (instrument === 'bell') {
      tone(frequency * 1.5, time, 0.7, 0.26);
      tone(frequency * 3, time, 0.3, 0.07);
    } else if (instrument === 'violin') {
      tone(frequency, time, .85, .16, 'sawtooth');
      tone(frequency * 2, time, .6, .035, 'triangle');
    } else {
      tone(frequency, time, 0.55, 0.32, 'triangle');
      tone(frequency * 2, time, 0.22, 0.06);
    }
  }

  function stop() {
    for (const voice of voices) {
      try { voice.stop(); } catch { /* Already ended. */ }
    }
    voices.clear();
  }

  function dispose() {
    disposed = true;
    stop();
    if (context && context.state !== 'closed') void context.close().catch(() => {});
  }

  return { unlock, hit, stop, dispose };
}

export async function renderMusicWave(notes) {
  if (!validTune(notes)) throw new Error('Invalid tune');
  const OfflineContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!OfflineContext) throw new Error('Audio export unavailable');
  const context = new OfflineContext(1, Math.ceil((notes.at(-1).time + 1.5) * 44100), 44100);
  const engine = createMusicAudio({ context, offline: true });
  await engine.unlock();
  for (const note of notes) engine.hit(note.kind, note.time, note.pitch);
  const buffer = await context.startRendering();
  return new Blob([encodeWave(buffer)], { type: 'audio/wav' });
}
