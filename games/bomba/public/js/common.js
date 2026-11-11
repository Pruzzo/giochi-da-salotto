// Pezzi che servono a più schermi: crocette degli errori, lucine dei moduli, come è andata.
import { h } from '/js/kit/dom.js';
import { clock } from '/js/kit/teams.js';

/** Tre caselle, una crocetta rossa per ogni errore. */
export function crosses(errors, max, cls = 'crosses') {
  return h('span', { class: cls, role: 'img', 'aria-label': `Errori: ${errors} su ${max}` },
    Array.from({ length: max }, (_, i) => h('span', { class: `cross${i < errors ? ' is-on' : ''}` })));
}

/** Una lucina per modulo, verde quando è risolto. */
export function lamps(solved, cls = 'lamps') {
  const n = solved.filter(Boolean).length;
  return h('span', { class: cls, role: 'img', 'aria-label': `Moduli risolti: ${n} su ${solved.length}` },
    solved.map((ok) => h('span', { class: `lamp${ok ? ' is-on' : ''}` })));
}

export function outcomeText(team) {
  const o = team.outcome;
  if (!o) return '';
  if (o.success) return `Disinnescata con ${clock(Math.floor((team.remainingMs ?? 0) / 1000))} di anticipo`;
  if (o.reason === 'errors') return 'Scoppiata: tre errori';
  if (o.reason === 'stopped') return 'Turno fermato';
  return 'Scoppiata: tempo scaduto';
}

/** Il riquadro di fine sul telefono, quando la squadra ha finito e le altre giocano ancora. */
export function ending(team) {
  const ok = team.outcome?.success;
  return [
    h('p', { class: `stamp ${ok ? 'stamp--ok' : 'stamp--boom'}` }, ok ? 'Disinnescata!' : 'BUM!'),
    h('p', { class: 'sum' }, outcomeText(team)),
    h('p', { class: 'note' }, 'Le altre squadre stanno ancora giocando: guarda la TV.'),
  ];
}
