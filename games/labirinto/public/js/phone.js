// Il telefono durante il turno: le frecce dell'esploratore, la mappa che gira del navigatore.
import { h, fill } from '/js/kit/dom.js';
import { page } from '/js/kit/ui.js';
import { mapSvg, orientationHint, orientationText, torchSvg } from './maze.js';

const vibrate = (pattern) => { try { navigator.vibrate?.(pattern); } catch { /* niente vibrazione */ } };
const bombsText = (n) => (n ? `Bombe prese: ${n}` : 'Nessuna bomba presa');

export function playingPhone(state, ctx, team) {
  return team.game?.role === 'navigatore' ? navigatorPhone(state, ctx, team) : explorerPhone(state, ctx, team);
}

// ---------- Esploratore ----------

const ARROWS = [
  { dir: 'N', label: 'Su', d: 'M6 15l6-6 6 6' },
  { dir: 'W', label: 'Sinistra', d: 'M15 6l-6 6 6 6' },
  { dir: 'E', label: 'Destra', d: 'M9 6l6 6-6 6' },
  { dir: 'S', label: 'Giù', d: 'M6 9l6 6 6-6' },
];
const KEYS = { ArrowUp: 'N', ArrowDown: 'S', ArrowLeft: 'W', ArrowRight: 'E' };

function explorerPhone(state, { act }, team0) {
  const chip = h('span', { class: 'team-chip', style: { '--team': team0.color.hex } }, team0.name);
  const status = h('p', { class: 'lab-status', role: 'status' });
  const hits = h('p', { class: 'note' });
  const pad = h('div', { class: 'pad' },
    ARROWS.map((a) => h('button', {
      class: `pad__btn pad__btn--${a.dir}`, 'aria-label': a.label,
      onClick: () => act('move', { dir: a.dir }),
    }, h('svg:svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true' }, h('svg:path', { d: a.d })))),
    h('span', { class: 'pad__north', 'aria-hidden': 'true' }, 'N', h('small', {}, '↑')));
  const torch = h('div', { class: 'torch-box' });
  const el = page('lab-explorer',
    h('header', { class: 'lab-head' },
      h('p', { class: 'lab-role' }, 'Esploratore'), chip),
    h('p', { class: 'note' }, 'Racconta al navigatore cosa vedi: colori, simboli, muri, bombe. Il nord è in alto.'),
    torch,
    h('div', { class: 'lab-info' }, status, hits),
    pad);
  let seq = null;
  const onKey = (e) => {
    const dir = KEYS[e.key];
    if (!dir) return;
    e.preventDefault();
    act('move', { dir });
  };
  addEventListener('keydown', onKey);
  const finishUpdate = (s, team) => {
    for (const btn of pad.querySelectorAll('button')) btn.disabled = !!s.paused || team.done;
  };
  return {
    el,
    update(s, team) {
      const g = team?.game;
      if (!g) return;
      hits.textContent = bombsText(g.bombsHit);
      if (g.event.seq !== seq) {
        const first = seq === null;
        seq = g.event.seq;
        fill(torch, torchSvg(g.torch, { color: team.color.hex, event: first ? null : g.event }));
        if (first) return finishUpdate(s, team);
        const say = { wall: 'Muro! Da lì non si passa.', bomb: 'BUM! Sei tornato alla partenza.', exit: 'Siete usciti!' }[g.event.type] ?? '';
        status.textContent = say;
        status.className = `lab-status${g.event.type === 'bomb' ? ' is-bomb' : ''}`;
        if (g.event.type === 'wall') vibrate(60);
        if (g.event.type === 'bomb') vibrate([300, 100, 300]);
        if (g.event.type === 'exit') vibrate([80, 60, 80, 60, 160]);
      }
      finishUpdate(s, team);
    },
    destroy: () => removeEventListener('keydown', onKey),
  };
}

// ---------- Navigatore ----------

function navigatorPhone(state, ctx, team0) {
  const chip = h('span', { class: 'team-chip', style: { '--team': team0.color.hex } }, team0.name);
  const card = h('div', { class: 'turn-card', role: 'status', 'aria-live': 'polite' });
  const mapBox = h('div', { class: 'map-box' });
  const dots = h('div', { class: 'dots', 'aria-hidden': 'true' });
  const next = h('p', { class: 'note' });
  const hits = h('p', { class: 'note' });
  const flash = h('p', { class: 'lab-status', role: 'status' });
  const el = page('lab-nav',
    h('header', { class: 'lab-head' }, h('p', { class: 'lab-role' }, 'Navigatore'), chip),
    card, mapBox,
    h('footer', { class: 'lab-foot' }, h('div', { class: 'lab-foot__turn' }, dots, next), h('div', { class: 'lab-foot__info' }, hits, flash)));
  let shownTurn = null;
  let shownBombs = null;
  let seq = team0.game?.event?.seq ?? 0;
  return {
    el,
    update(s, team) {
      const g = team?.game;
      if (!g || g.role !== 'navigatore') return;
      const o = g.orientation;
      if (shownTurn !== o.seq || shownBombs !== g.bombs.join()) {
        const turned = shownTurn !== null && shownTurn !== o.seq;
        fill(card,
          h('p', { class: 'turn-card__label' }, 'La mappa è'),
          orientationText(o).map((line) => h('p', { class: 'turn-card__big' }, line)),
          h('p', { class: 'turn-card__hint' }, orientationHint(o)));
        fill(mapBox, mapSvg(g, { orientation: o }));
        if (turned) {
          for (const node of [card, mapBox]) {
            node.classList.remove('is-turning');
            void node.offsetWidth; // fa ripartire l'animazione
            node.classList.add('is-turning');
          }
          vibrate([120, 80, 120]);
        }
        shownTurn = o.seq;
        shownBombs = g.bombs.join();
      }
      const left = g.stepsToTurn;
      fill(dots, Array.from({ length: 8 }, (_, i) => h('span', { class: `dot${i < 8 - left ? ' is-done' : ''}` })));
      next.textContent = left === 1 ? 'Gira al prossimo passo!' : `Gira tra ${left} passi`;
      hits.textContent = bombsText(g.bombsHit);
      if (g.event.seq !== seq) {
        seq = g.event.seq;
        if (g.event.type === 'bomb') {
          flash.textContent = 'BUM! L’omino è tornato alla partenza.';
          flash.className = 'lab-status is-bomb';
          vibrate(300);
        } else if (g.event.type === 'exit') {
          flash.textContent = 'Siete usciti!';
          flash.className = 'lab-status';
        } else if (g.event.type === 'step') {
          flash.textContent = '';
        }
      }
    },
  };
}
