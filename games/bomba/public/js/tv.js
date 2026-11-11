// La TV durante il turno: per ogni squadra gli errori e le lucine dei moduli. Mai la bomba.
import { h, fill } from '/js/kit/dom.js';
import { crosses, lamps, outcomeText } from './common.js';
import { sounds } from './audio.js';

export function zone(_state, team) {
  const errs = h('div', { class: 'tvz__row' });
  const mods = h('div', { class: 'tvz__row' });
  const count = h('p', { class: 'tvz__count pencil' });
  const stamp = h('p', { class: 'tvz__stamp', hidden: true });
  const el = h('div', { class: 'tvz' }, errs, mods, count, stamp);
  let last = null;

  return {
    el,
    update(_s, t) {
      const b = t.game;
      if (!b) return;
      fill(errs, crosses(b.errors, b.maxErrors, 'crosses crosses--tv'));
      fill(mods, lamps(b.solved, 'lamps lamps--tv'));
      const n = b.solved.filter(Boolean).length;
      count.textContent = `${n} ${n === 1 ? 'modulo risolto' : 'moduli risolti'} su ${b.solved.length}`;
      stamp.hidden = !t.done;
      if (t.done) {
        stamp.className = `tvz__stamp ${t.outcome?.success ? 'stamp--ok' : 'stamp--boom'}`;
        stamp.textContent = t.outcome?.success ? 'Disinnescata!' : 'BUM!';
      }
      el.classList.toggle('is-boom', t.done && !t.outcome?.success);
      // Suoni: errore e modulo risolto. Disinnesco e scoppio arrivano da sounds.done.
      if (last && !t.done) {
        if (b.errors > last.errors) sounds.error();
        else if (n > last.solved) sounds.solved();
      }
      last = { errors: b.errors, solved: n };
    },
  };
}

export function legend() {
  return h('p', { class: 'tv-legend pencil' },
    h('span', { class: 'cross is-on' }), ' errore: al terzo la bomba scoppia · ',
    h('span', { class: 'lamp is-on' }), ' modulo risolto');
}

/** A fine turno, nella zona di ogni squadra: errori, moduli e com'è andata. */
export function result(_s, t) {
  const b = t.game;
  if (!b) return null;
  return h('div', { class: 'tvz tvz--result' },
    h('div', { class: 'tvz__row' }, crosses(b.errors, b.maxErrors, 'crosses crosses--tv'), lamps(b.solved, 'lamps lamps--tv')),
    t.outcome?.reason !== 'stopped' && h('p', { class: `tvz__stamp ${t.outcome?.success ? 'stamp--ok' : 'stamp--boom'}` }, t.outcome?.success ? 'Disinnescata!' : 'BUM!'));
}

export { outcomeText };
