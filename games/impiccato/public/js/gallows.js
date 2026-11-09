// La forca a matita e l'omino a penna rossa: ogni errore aggiunge un tratto.
import { h } from '/js/kit/dom.js';

const FRAME = [
  'M8 93C24 91.5 44 93.5 64 92.5', // terreno
  'M22 93C21.4 66 22.6 38 21.8 10', // palo
  'M20 11.5C36 10.8 52 12.4 70 11.6', // trave
  'M22 30C28 24 33 18 39 11.5', // rinforzo
  'M66 11.8C66.3 15.5 65.8 19.5 66.1 23', // corda
];
const PARTS = [
  'M66.5 23C59 22.5 56 28 56 33.5c0 6 4.5 10 10.5 10 6 0 10-4.5 10-10C76.5 27 72 22.6 64.5 23.6', // testa
  'M66.3 43.5C66 51 66.6 58 66.2 66', // corpo
  'M66.2 49.5C62 53 58.5 56.5 55 60.5', // braccio sinistro
  'M66.4 49.5C70 53 73.5 56.5 77.5 60', // braccio destro
  'M66.2 66C63 71 60.5 76.5 57.5 82', // gamba sinistra
  'M66.4 66C69.5 71 72 76.5 75.5 82', // gamba destra
];

export function createGallows() {
  const parts = PARTS.map((d) => h('svg:path', { d, pathLength: '1', class: 'gallows__part' }));
  const el = h('svg:svg', { viewBox: '0 0 100 100', class: 'gallows', role: 'img' },
    FRAME.map((d) => h('svg:path', { d, class: 'gallows__frame' })), parts);
  let shown = null;
  return {
    el,
    /** Mostra `errors` tratti; quelli nuovi si disegnano, i vecchi compaiono già fatti. */
    set(errors) {
      if (errors === shown) return;
      parts.forEach((p, i) => {
        const on = i < errors;
        p.classList.toggle('is-instant', shown === null || i < (shown ?? 0));
        p.classList.toggle('is-on', on);
      });
      el.setAttribute('aria-label', errors ? `${errors} errori su ${PARTS.length}` : 'Nessun errore');
      shown = errors;
    },
  };
}

/** La parola come caselle sul foglio: lettera scritta o spazio vuoto sopra la riga. */
export function slots(pattern, cls = '') {
  return h('span', {
    class: `slots ${cls}`, style: { '--len': pattern.length }, role: 'img',
    'aria-label': pattern.map((c) => c ?? 'vuoto').join(', '),
  }, pattern.map((c, i) => h('span', { class: `slot${c ? '' : ' is-blank'}`, style: { '--i': i } }, c ?? '')));
}

export const clock = (ms) => {
  const sec = Math.round(ms / 1000);
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
};

export const LENGTH_LABELS = { short: 'Corte', long: 'Lunghe', any: 'Tutte' };

export function rules(s) {
  const words = { short: `corte, fino a ${s.shortMax} lettere`, long: `lunghe, da ${s.shortMax + 1} lettere in su`, any: 'di ogni lunghezza' }[s.length];
  return `Parole ${words}. ${s.maxErrors} errori e sei impiccato. ${clock(s.durationSec * 1000)} a turno.`;
}

/** Esito di un giocatore in poche parole, per TV e telefono. */
export function outcome(p) {
  if (p.solvedMs !== null) return `indovinata in ${clock(p.solvedMs)}`;
  if (p.hanged) return 'impiccato';
  return null;
}
