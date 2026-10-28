// Small original instrument voices; all audio is generated locally, with no downloads.
export function createMusicAudio() {
  let context;
  let output;
  let disposed = false;
  const voices = new Set();

  async function unlock() {
    if (disposed) return false;
    try {
      if (!context) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return false;
        context = new AudioContext();
        output = context.createGain();
        output.gain.value = 0.55;
        const limiter = context.createDynamicsCompressor();
        output.connect(limiter);
        limiter.connect(context.destination);
      }
      await context.resume();
      return !disposed && context.state === 'running';
    } catch { return false; }
  }

  function tone(frequency, time, duration, volume, type = 'sine', endFrequency) {
    if (!context || disposed || voices.size >= 64) return;
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
    if (!context || context.state !== 'running' || disposed) return;
    const time = context.currentTime + delay;
    const frequency = 523.25 * 2 ** (pitch / 12);
    if (instrument === 'drum') {
      tone(155, time, 0.3, 0.65, 'sine', 55);
      tone(310, time, 0.055, 0.12, 'triangle', 90);
    } else if (instrument === 'bell') {
      tone(frequency * 1.5, time, 0.7, 0.26);
      tone(frequency * 3, time, 0.3, 0.07);
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
