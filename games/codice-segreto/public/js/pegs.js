// I pastelli e i pallini della risposta, uguali su telefono e TV.
import { h } from '/js/kit/dom.js';

export const COLORS = [
  null,
  { name: 'rosso', hex: '#d7263d' },
  { name: 'arancione', hex: '#f08a24' },
  { name: 'giallo', hex: '#f6cd1a' },
  { name: 'verde', hex: '#2e9e4f' },
  { name: 'azzurro', hex: '#2aa7e0' },
  { name: 'nero', hex: '#3a3d45' },
  { name: 'marrone', hex: '#8a5a2b' },
  { name: 'rosa', hex: '#ec6fb0' },
];

/** Un tondo colorato a pastello, con il numero scritto sopra: si riconosce anche senza distinguere i colori. */
export function peg(c, props = {}) {
  if (!c) return h('span', { class: 'peg peg--empty', 'aria-label': 'vuoto', ...props });
  return h('span', {
    class: 'peg', style: { '--c': COLORS[c].hex }, 'data-c': c, 'aria-label': `${c} ${COLORS[c].name}`, ...props,
  }, h('span', { class: 'peg__n', 'aria-hidden': 'true' }, String(c)));
}

export function pegRow(code, cls = '') {
  return h('span', { class: `pegs ${cls}`, role: 'img', 'aria-label': code.map((c) => `${c} ${COLORS[c].name}`).join(', ') },
    code.map((c) => peg(c, { 'aria-label': null })));
}

export function pinsLabel(exact, near) {
  if (!exact && !near) return 'nessun pastello giusto';
  const parts = [];
  if (exact) parts.push(exact === 1 ? '1 al posto giusto' : `${exact} al posto giusto`);
  if (near) parts.push(near === 1 ? '1 da spostare' : `${near} da spostare`);
  return parts.join(', ');
}

/** La risposta: pallini pieni per i posti giusti, vuoti per i pastelli da spostare, puntini per il resto. */
export function pins(exact, near, length = 4) {
  const dots = Array.from({ length }, (_, i) => (i < exact ? 'exact' : i < exact + near ? 'near' : 'none'));
  return h('span', { class: 'pins', role: 'img', 'aria-label': pinsLabel(exact, near) },
    dots.map((kind) => h('span', { class: `pin pin--${kind}` })));
}

/** Lo scarabocchio a biro che copre il codice: due passate fitte di tratti obliqui, come per cancellare. */
export function scribble(seed = 1) {
  const n = (i) => ((seed * 37 + i * 53) % 11) - 5; // tremolio della mano, sempre uguale per lo stesso seed
  const pass = (flip) => {
    const pts = [];
    for (let i = 0; i <= 12; i += 1) {
      const t = 4 + i * 7.7;
      const top = i % 2 === 0;
      const [x, y] = top ? [t + n(i) * 0.6, 6 + n(i + 3) * 0.5] : [t - 14 + n(i), 94 + n(i + 5) * 0.5];
      pts.push(flip ? `${100 - x} ${y}` : `${x} ${y}`);
    }
    return `M${pts.map((p) => p.split(' ').map((v) => Math.min(98, Math.max(2, Number(v))).toFixed(1)).join(' ')).join('L')}`;
  };
  return h('svg:svg', { class: 'scribble-cover', viewBox: '0 0 100 100', preserveAspectRatio: 'none', 'aria-hidden': 'true' },
    h('svg:path', { d: pass(false), pathLength: '1' }),
    h('svg:path', { d: pass(true), pathLength: '1', class: 'scribble-cover__second' }));
}
