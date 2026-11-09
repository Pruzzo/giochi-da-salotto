import { h, fill } from '/js/kit/dom.js';
import { createTimer } from '/js/kit/timer.js';
import { coverTv, finalTv, tvPage } from '/js/kit/ui.js';
import { sounds } from './audio.js';
import { COLORS, peg, pegRow, pins, scribble } from './pegs.js';
import { rules } from './phone.js';

export function tvView(state) {
  const views = { lobby, hiding, playing, reveal, final: finalTv };
  return views[state.phase](state);
}

function lobby() {
  return coverTv({
    title: 'Codice segreto',
    subject: { label: 'Regole', text: rules },
    cta: (admin) => `Quando siete tutti, ${admin} farà scegliere il codice allo schermo.`,
  });
}

/** Il codice coperto: quattro caselle sotto uno scarabocchio a biro. */
function vault(length, { cls = '' } = {}) {
  return h('div', { class: `vault ${cls}`, role: 'img', 'aria-label': 'Codice nascosto' },
    Array.from({ length }, (_, i) => h('span', { class: 'vault__box', style: { '--i': i } },
      h('span', { class: 'vault__peg' }), scribble(i + 1))));
}

function legend(s) {
  return h('div', { class: 'legend' },
    h('div', { class: 'legend__colors' }, Array.from({ length: s.colors }, (_, i) => peg(i + 1))),
    h('p', { class: 'legend__row' }, pins(1, 0, 1), 'giusto e al suo posto'),
    h('p', { class: 'legend__row' }, pins(0, 1, 1), 'giusto ma fuori posto'));
}

// ---------- Lo schermo sceglie il codice ----------

function hiding(state) {
  const box = vault(state.codeLength, { cls: 'vault--hiding' });
  const say = h('h1', { class: 'hide__say' }, `Turno ${state.round}: lo schermo sceglie il codice…`);
  const el = tvPage('hide', say, box, h('p', { class: 'hide__under' }, rules(state)));
  const pegs = [...box.querySelectorAll('.vault__peg')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Pastelli a caso che girano come un mazzo, poi lo scarabocchio li copre. La TV non conosce il codice vero.
  const elapsed = state.hideMs - (state.remainingMs ?? state.hideMs);
  const shuffleUntil = performance.now() + Math.max(0, 2200 - elapsed);
  let handle = 0;
  const roll = () => {
    const now = performance.now();
    pegs.forEach((slot) => fill(slot, peg(1 + Math.floor(Math.random() * state.colors), { 'aria-hidden': 'true' })));
    if (now < shuffleUntil && !reduced) {
      sounds.tick();
      handle = setTimeout(roll, 110);
    } else {
      box.classList.add('is-covered');
      say.textContent = `Turno ${state.round}: codice scelto e coperto. Via!`;
      sounds.cover();
    }
  };
  roll();
  return { el, update() {}, destroy: () => clearTimeout(handle) };
}

// ---------- Si indovina ----------

function playing(state) {
  const timer = createTimer({
    onTick: (sec) => { if (sec > 0 && sec <= 10) sounds.hurry(); },
    onEnd: () => sounds.stop(),
  });
  const board = h('ol', { class: 'race' });
  const count = h('p', { class: 'pencil race__count' });
  const el = tvPage('play',
    h('div', { class: 'play-top' }, timer.el),
    h('section', { class: 'play-side' },
      h('h1', { class: 'say play-side__say' }, 'Trovate il codice!'),
      vault(state.codeLength, { cls: 'vault--small is-covered' }),
      legend(state),
      count),
    h('section', { class: 'play-board' }, board));
  let solved = 0;

  return {
    el,
    update(s) {
      timer.sync(s.remainingMs ?? 0, s.durationSec * 1000);
      const found = s.players.filter((p) => p.rank).length;
      if (found > solved) sounds.solved();
      solved = found;
      count.textContent = found ? `${found === 1 ? 'L’ha trovato' : 'L’hanno trovato'} in ${found} su ${s.players.length}` : '';
      const rowQ = Math.min(3, Math.max(1.6, 22 / Math.max(s.players.length, 1)));
      board.style.setProperty('--row-q', rowQ.toFixed(2));
      fill(board, s.players.map((p) => h('li', { class: `race__row${p.rank ? ' is-solved' : ''}${p.online ? '' : ' is-away'}` },
        h('span', { class: 'written race__name' }, p.name),
        h('span', { class: 'race__tries', 'aria-label': `${p.guesses.length} tentativi su ${s.maxAttempts}` },
          Array.from({ length: s.maxAttempts }, (_, i) => {
            const g = p.guesses[i];
            return h('span', { class: `race__try${g ? '' : ' is-blank'}` }, g ? pins(g.exact, g.near, s.codeLength) : null);
          })),
        h('span', { class: 'race__state red' },
          p.rank ? `${p.rank}°!` : p.finished ? 'finiti' : `${p.guesses.length}/${s.maxAttempts}`))));
    },
    destroy: () => timer.destroy(),
  };
}

// ---------- Codice svelato ----------

/** Per chi non l'ha trovato, la fila che ci è andata più vicino. */
function closest(guesses) {
  return [...guesses].sort((a, b) => b.exact - a.exact || b.near - a.near)[0] ?? null;
}

function reveal(state) {
  const box = vault(state.codeLength, { cls: 'vault--reveal is-covered' });
  box.querySelectorAll('.vault__peg').forEach((slot, i) => fill(slot, peg(state.code[i], { 'aria-hidden': 'true' })));
  box.setAttribute('aria-label', `Il codice era ${state.code.map((c) => `${c} ${COLORS[c].name}`).join(', ')}`);
  const table = h('ol', { class: 'results' });
  const el = tvPage('open',
    h('header', { class: 'open-head' }, h('h1', { class: 'say open-head__say' }, `Turno ${state.round}: il codice era`), box),
    table);
  requestAnimationFrame(() => requestAnimationFrame(() => { box.classList.remove('is-covered'); sounds.reveal(); }));

  return {
    el,
    update(s) {
      const order = [...s.players]
        .filter((p) => p.guesses.length || p.online)
        .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99) || b.total - a.total);
      table.style.setProperty('--n', Math.max(order.length, 1));
      fill(table,
        h('li', { class: 'results__row results__row--head' },
          h('span', {}), h('span', {}, 'Tentativi'), h('span', {}, 'Fila migliore'), h('span', { class: 'red' }, 'Turno'), h('span', { class: 'red' }, 'Totale')),
        order.map((p, i) => {
          const best = p.rank ? p.guesses.at(-1) : closest(p.guesses);
          return h('li', { class: `results__row reveal${p.rank === 1 ? ' is-first' : ''}`, style: { '--i': i } },
            h('span', { class: 'written results__name' }, p.name),
            h('span', { class: `results__tries${p.rank ? '' : ' is-miss'}` }, p.rank ? `${p.guesses.length}` : p.guesses.length ? 'non trovato' : '—'),
            h('span', { class: 'results__best' }, best ? [pegRow(best.code), pins(best.exact, best.near, s.codeLength)] : null),
            h('span', { class: 'red results__pts' }, `+${p.roundPoints ?? 0}`),
            h('span', { class: 'red results__pts' }, String(p.total)));
        }));
    },
  };
}
