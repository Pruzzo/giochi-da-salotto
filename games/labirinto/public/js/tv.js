// La TV durante il turno: per ogni squadra la torcia intorno all'omino. A fine turno, il labirinto svelato.
import { h, fill } from '/js/kit/dom.js';
import { sounds } from './audio.js';
import { bomb, door, mapSvg, torchSvg } from './maze.js';

const bombsText = (n) => (n === 1 ? '1 bomba presa' : `${n} bombe prese`);

/** La zona di una squadra: si ridisegna solo quando quella squadra fa qualcosa. */
export function zone(state, team0) {
  const view = h('div', { class: 'torch-box' });
  const foot = h('p', { class: 'torch-foot' });
  const done = h('p', { class: 'torch-done', hidden: true });
  const el = h('div', { class: 'lab-zone' }, view, done, foot);
  let seq = null;
  let wasDone = false;
  return {
    el,
    update(s, team) {
      const g = team.game;
      if (!g) return;
      if (g.event.seq !== seq) {
        const first = seq === null;
        seq = g.event.seq;
        fill(view, torchSvg(g.torch, { color: team.color.hex, event: first ? null : g.event }));
        if (!first) sounds[g.event.type]?.();
      }
      foot.textContent = g.bombsHit ? bombsText(g.bombsHit) : '';
      if (team.done !== wasDone) {
        wasDone = team.done;
        done.hidden = !team.done;
        done.textContent = team.outcome?.success ? (team.rank === 1 && s.scoring ? 'Usciti per primi!' : 'Usciti!') : 'Fermi';
      }
    },
  };
}

/** Sotto le zone: come leggere la torcia. */
export function legend() {
  const icon = (...kids) => h('svg:svg', { class: 'legend__icon', viewBox: '0 0 1 1', 'aria-hidden': 'true' }, ...kids);
  return h('p', { class: 'legend' },
    h('span', { class: 'legend__item' }, h('b', { class: 'legend__north' }, 'N ↑'), 'il nord è in alto'),
    h('span', { class: 'legend__item' }, icon(bomb(0.5, 0.5, 1)), 'bomba: si torna alla partenza'),
    h('span', { class: 'legend__item' }, icon(door(0.1, 0.4, 0.9, 0.4, [0, 1])), 'la porta d’uscita'));
}

/** A fine turno: il labirinto della squadra, con la strada fatta. */
export function resultMap(state, team) {
  const r = team.game?.reveal;
  if (!r) return null;
  return h('div', { class: 'reveal' }, mapSvg(r, { trail: r.trail, start: r.start, exited: !!team.outcome?.success }));
}
