// Suoni generati al volo sulla TV: nessun file da scaricare.
let ctx = null;
let muted = false;
try { muted = localStorage.getItem('ncc-muted') === '1'; } catch { /* storage bloccato */ }

export function unlockAudio() {
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  } catch { ctx = null; }
}

export const isMuted = () => muted;
export function toggleMute() {
  muted = !muted;
  try { localStorage.setItem('ncc-muted', muted ? '1' : '0'); } catch { /* storage bloccato */ }
  return muted;
}

function tone(freq, ms, { type = 'square', gain = 0.05, at = 0 } = {}) {
  if (muted || !ctx || ctx.state !== 'running') return;
  const t = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  amp.gain.setValueAtTime(gain, t);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
  osc.connect(amp).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + ms / 1000);
}

export const sounds = {
  tick: () => tone(1500, 28, { gain: 0.035 }),
  letter: () => { tone(523, 130, { type: 'triangle', gain: 0.12 }); tone(784, 240, { type: 'triangle', gain: 0.12, at: 0.12 }); },
  hurry: () => tone(880, 70, { gain: 0.04 }),
  stop: () => { tone(330, 240, { type: 'sawtooth', gain: 0.06 }); tone(220, 380, { type: 'sawtooth', gain: 0.06, at: 0.22 }); },
  mark: () => tone(660, 60, { type: 'triangle', gain: 0.09 }),
};
