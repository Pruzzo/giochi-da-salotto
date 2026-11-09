// Suoni generati al volo sulla TV: nessun file da scaricare.
let ctx = null;
let muted = false;
try { muted = localStorage.getItem('console-muted') === '1'; } catch { /* storage bloccato */ }

export function unlockAudio() {
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  } catch { ctx = null; }
}

export const isMuted = () => muted;
export function toggleMute() {
  muted = !muted;
  try { localStorage.setItem('console-muted', muted ? '1' : '0'); } catch { /* storage bloccato */ }
  return muted;
}

export function tone(freq, ms, { type = 'square', gain = 0.05, at = 0 } = {}) {
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
