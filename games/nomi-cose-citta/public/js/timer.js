// Il tempo è una riga di quadretti annerita a biro, un quadretto alla volta.
import { h } from './dom.js';

export function createTimer({ onTick, onEnd } = {}) {
  const fillEl = h('span', { class: 'timer__fill' });
  const secs = h('span', { class: 'timer__secs' });
  const probe = h('span', { class: 'timer__probe' });
  const el = h('div', { class: 'timer', role: 'timer' }, h('span', { class: 'timer__track' }, fillEl, probe), secs);
  let endsAt = 0;
  let totalMs = 1;
  let lastSec = null;
  let handle = 0;

  const paint = () => {
    const left = Math.max(0, endsAt - performance.now());
    const sec = Math.ceil(left / 1000);
    const track = fillEl.parentElement.clientWidth;
    const cell = probe.offsetWidth || 24; // un quadretto: --q è un'espressione, si misura
    const cols = Math.max(1, Math.floor(track / cell));
    fillEl.style.width = `${Math.round((1 - left / totalMs) * cols) * cell}px`;
    if (sec !== lastSec) {
      secs.textContent = sec >= 60 ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}` : String(sec);
      el.classList.toggle('timer--hurry', sec <= 10);
      if (lastSec !== null) onTick?.(sec);
      lastSec = sec;
      if (sec === 0) onEnd?.();
    }
  };

  return {
    el,
    sync(remainingMs, durationMs) {
      totalMs = durationMs;
      const next = performance.now() + remainingMs;
      if (Math.abs(next - endsAt) > 400) endsAt = next;
      if (!handle) handle = setInterval(paint, 200);
      paint();
    },
    destroy() {
      clearInterval(handle);
      handle = 0;
    },
  };
}
