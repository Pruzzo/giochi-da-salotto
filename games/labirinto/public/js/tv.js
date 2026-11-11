// La TV durante il turno: per ogni squadra la torcia intorno all'omino. A fine turno, il labirinto svelato.
import { h, fill } from '/js/kit/dom.js';
import { sounds } from './audio.js';
import { mapSvg } from './maze.js';

const bombsText = (n) => (n === 1 ? '1 bomba presa' : `${n} bombe prese`);

/** La zona di una squadra: niente torcia, che la TV la vede anche il navigatore. Solo passi e bombe prese. */
export function zone(state, team0) {
  const steps = h('p', { class: 'dark-steps' });
  const hits = h('p', { class: 'torch-foot' });
  const done = h('p', { class: 'torch-done', hidden: true });
  const el = h('div', { class: 'lab-zone lab-zone--dark' }, h('div', { class: 'dark-box' }, darkOmino(), steps), hits, done);
  let last = null;
  let wasDone = false;
  return {
    el,
    update(s, team) {
      const g = team.game;
      if (!g) return;
      if (last && !team.done) {
        if (g.bombsHit > last.bombsHit) sounds.bomb();
        else if (g.steps > last.steps) sounds.step();
      }
      last = { steps: g.steps, bombsHit: g.bombsHit };
      steps.textContent = g.steps === 1 ? '1 passo' : `${g.steps} passi`;
      hits.textContent = g.bombsHit ? bombsText(g.bombsHit) : '';
      if (team.done !== wasDone) {
        if (team.done && team.outcome?.success && s.phase === 'playing') sounds.exit();
        wasDone = team.done;
        done.hidden = !team.done;
        done.textContent = team.outcome?.success ? (team.rank === 1 && s.scoring ? 'Usciti per primi!' : 'Usciti!') : 'Fermi';
      }
    },
  };
}

/** Un omino che cammina al buio, con la torcia accesa: la TV non dice dove. */
function darkOmino() {
  return h('svg:svg', { class: 'dark-omino', viewBox: '0 0 100 100', 'aria-hidden': 'true' },
    h('svg:circle', { cx: 50, cy: 50, r: 48, class: 'dark-omino__night' }),
    h('svg:path', { d: 'M58 46 L96 30 L96 70 Z', class: 'dark-omino__beam' }),
    h('svg:circle', { cx: 42, cy: 30, r: 8, class: 'dark-omino__ink' }),
    h('svg:path', { d: 'M42 38 L42 62 M42 62 L32 80 M42 62 L52 80 M42 46 L58 46 M42 46 L30 56', class: 'dark-omino__line' }));
}

/** Sotto le zone: dove sta la torcia. */
export function legend() {
  return h('p', { class: 'legend' },
    h('span', { class: 'legend__item' }, 'La torcia ce l’ha l’esploratore sul telefono: il navigatore non la deve vedere.'));
}

/** A fine turno: il labirinto della squadra, con la strada fatta. */
export function resultMap(state, team) {
  const r = team.game?.reveal;
  if (!r) return null;
  return h('div', { class: 'reveal' }, mapSvg(r, { trail: r.trail, start: r.start, exited: !!team.outcome?.success }));
}
