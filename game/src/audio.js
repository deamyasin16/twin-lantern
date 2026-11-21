// Short synth chimes for a find, a miss, a hint and a cleared set; no sound files.
let ctx = null;
const TONES = { hit: [660, 990], miss: [160, 120], start: [440, 660], clear: [523, 784, 1046], hint: [880, 700] };

export function chime(kind) {
  const notes = TONES[kind];
  if (!notes) return;
  try {
    ctx ||= new AudioContext();
    notes.forEach((freq, n) => {
      const osc = ctx.createOscillator();
      const vol = ctx.createGain();
      const t = ctx.currentTime + n * 0.09;
      osc.type = kind === 'miss' ? 'sawtooth' : 'triangle';
      osc.frequency.value = freq;
      vol.gain.setValueAtTime(0.0001, t);
      vol.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      vol.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      osc.connect(vol).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  } catch {
    // sound is optional: the game plays the same without it
  }
}
