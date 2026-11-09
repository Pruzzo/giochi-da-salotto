import { h, fill } from '/js/kit/dom.js';
import { createTimer } from '/js/kit/timer.js';
import { coverTv, finalTv, tvPage } from '/js/kit/ui.js';
import { sounds } from './audio.js';
import { rules } from './phone.js';

export function tvView(state) {
  const views = { lobby, shuffling, writing, reveal, final: finalTv };
  return views[state.phase](state);
}

function lobby() {
  return coverTv({
    title: 'Anagrammi',
    subject: { label: 'Regole', text: rules },
    cta: (admin) => `Quando siete tutti, ${admin} farà estrarre le lettere allo schermo.`,
  });
}

const tileRow = (letters, cls = '') => h('div', { class: `tiles ${cls}`, role: 'img', 'aria-label': `Lettere: ${letters.join(' ')}` },
  letters.map((c, i) => h('span', { class: 'tile', style: { '--i': i } }, c)));

function legend(s) {
  return h('p', { class: 'ana-legend' },
    Object.entries(s.lengthPoints).map(([len, pts]) => h('span', { class: 'ana-legend__item' },
      h('b', {}, `${len} lettere`), ` ${pts} ${pts === 1 ? 'punto' : 'punti'}`)),
    h('span', { class: 'ana-legend__item red' }, 'Solo tu: doppio'));
}

// ---------- Lo schermo estrae le lettere ----------

function shuffling(state) {
  const row = tileRow(state.letters.map(() => ''), 'tiles--tv tiles--draw');
  const say = h('h1', { class: 'choose__say' }, `Turno ${state.round}: lo schermo estrae le lettere…`);
  const el = tvPage('choose', say, row, h('p', { class: 'choose__under' }, `Parole di almeno ${state.minLen} lettere, ogni tessera si usa una volta sola.`));
  const tiles = [...row.children];
  const ABC = 'ABCDEFGHILMNOPQRSTUVZ';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const elapsed = state.shuffleMs - (state.remainingMs ?? state.shuffleMs);
  const start = performance.now() - elapsed;
  // Ogni tessera gira come un contatore e si ferma sulla sua lettera, da sinistra a destra.
  const settleAt = (i) => 900 + i * 260;
  let handle = 0;
  const roll = () => {
    const t = performance.now() - start;
    let moving = false;
    tiles.forEach((tile, i) => {
      if (reduced || t >= settleAt(i)) {
        if (tile.textContent !== state.letters[i]) { tile.textContent = state.letters[i]; tile.classList.add('is-set'); sounds.tick(); }
      } else {
        moving = true;
        tile.textContent = ABC[Math.floor(Math.random() * ABC.length)];
      }
    });
    if (moving) handle = setTimeout(roll, 70);
    else say.textContent = `Turno ${state.round}: ecco le lettere. Via!`;
  };
  roll();
  return { el, update() {}, destroy: () => clearTimeout(handle) };
}

// ---------- Si cercano parole ----------

function writing(state) {
  const timer = createTimer({
    onTick: (sec) => { if (sec > 0 && sec <= 10) sounds.hurry(); },
    onEnd: () => sounds.stop(),
  });
  const board = h('ul', { class: 'ana-board' });
  const el = tvPage('ana-play',
    h('div', { class: 'play-top' }, timer.el),
    tileRow(state.letters, 'tiles--tv'),
    legend(state),
    board);
  const before = new Map();

  return {
    el,
    update(s) {
      timer.sync(s.remainingMs ?? 0, s.durationSec * 1000);
      const n = Math.max(s.players.length, 1);
      board.style.setProperty('--cols', n <= 4 ? 2 : n <= 9 ? 3 : 4);
      fill(board, s.players.map((p) => {
        const was = before.get(p.id);
        if (was && p.longest > was.longest && p.longest >= 7) sounds.long();
        else if (was && p.count > was.count) sounds.found();
        before.set(p.id, { count: p.count, longest: p.longest });
        return h('li', { class: `ana-player${p.done ? ' is-done' : ''}${p.online ? '' : ' is-away'}` },
          h('span', { class: 'written ana-player__name' }, p.name),
          h('span', { class: 'ana-player__count' }, h('b', {}, String(p.count)), p.count === 1 ? ' parola' : ' parole'),
          h('span', { class: 'ana-player__long' }, p.longest ? `la più lunga: ${p.longest} lettere` : ''));
      }));
    },
    destroy: () => timer.destroy(),
  };
}

// ---------- Parole svelate ----------

function reveal(state) {
  const table = h('ol', { class: 'results' });
  const full = state.fullWords.map((w) => w.toUpperCase());
  const el = tvPage('open ana-open',
    h('header', { class: 'open-head' },
      h('h1', { class: 'say open-head__say' }, `Turno ${state.round}: con tutte le lettere`),
      h('span', { class: `ana-full${full.length > 1 ? ' ana-full--many' : ''}` }, full.map((w, i) => h('span', { class: 'ana-full__word', style: { '--i': i } }, w)))),
    table,
    h('p', { class: 'ana-missed' }));
  queueMicrotask(() => sounds.reveal());

  return {
    el,
    update(s) {
      const order = s.players
        .filter((p) => p.results)
        .sort((a, b) => (b.roundPoints ?? 0) - (a.roundPoints ?? 0) || b.total - a.total);
      table.style.setProperty('--n', Math.max(order.length, 1));
      const top = order[0]?.roundPoints ?? 0;
      fill(table,
        h('li', { class: 'results__row results__row--head' },
          h('span', {}), h('span', {}, 'Parole'), h('span', {}, 'Le più lunghe'), h('span', { class: 'red' }, 'Turno'), h('span', { class: 'red' }, 'Totale')),
        order.map((p, i) => h('li', { class: `results__row reveal${top > 0 && p.roundPoints === top ? ' is-first' : ''}`, style: { '--i': i } },
          h('span', { class: 'written results__name' }, p.name),
          h('span', { class: 'results__tries' }, String(p.results.length)),
          h('span', { class: 'ana-best' }, p.results.slice(0, 3).map((r) => h('span', { class: `written${r.sharedWith.length ? ' is-dup' : ''}` }, r.word.toUpperCase()))),
          h('span', { class: 'red results__pts' }, `+${p.roundPoints ?? 0}`),
          h('span', { class: 'red results__pts' }, String(p.total)))));
      fill(el.querySelector('.ana-missed'),
        h('span', { class: 'pencil' }, `Si potevano fare ${s.possibleCount} parole. Nessuno ha trovato: `),
        s.missed.map((w) => h('span', { class: 'written ana-missed__word' }, w.toUpperCase())));
    },
  };
}
