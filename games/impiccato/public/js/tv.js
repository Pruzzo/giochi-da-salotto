import { h, fill } from '/js/kit/dom.js';
import { createTimer } from '/js/kit/timer.js';
import { coverTv, finalTv, tvPage } from '/js/kit/ui.js';
import { sounds } from './audio.js';
import { clock, createGallows, outcome, rules, slots } from './gallows.js';

export function tvView(state) {
  const views = { lobby, choosing, playing, reveal, final: finalTv };
  return views[state.phase](state);
}

function lobby() {
  return coverTv({
    title: "L'impiccato",
    subject: { label: 'Regole', text: rules },
    cta: (admin) => `${admin} farà scegliere la parola quando siete tutti.`,
  });
}

// ---------- Lo schermo sceglie la parola ----------

function choosing(state) {
  const n = state.skeleton.length;
  const el = tvPage('choose',
    h('h1', { class: 'choose__say' }, `Turno ${state.round}: lo schermo sceglie la parola…`),
    slots(state.skeleton, 'slots--draw'),
    h('p', { class: 'choose__under' }, `${n} lettere. La prima e l'ultima sono già scritte.`));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const timers = reduced ? [] : state.skeleton.map((_, i) => setTimeout(() => sounds.tick(), 300 + i * 180));
  return { el, update() {}, destroy: () => timers.forEach(clearTimeout) };
}

// ---------- Si indovina ----------

function playing(state) {
  const timer = createTimer({
    onTick: (sec) => { if (sec > 0 && sec <= 10) sounds.hurry(); },
    onEnd: () => sounds.stop(),
  });
  const board = h('ul', { class: 'hangs' });
  const count = h('p', { class: 'pencil hangs__count' });
  const el = tvPage('play hang-play',
    h('div', { class: 'play-top' }, timer.el),
    h('section', { class: 'play-side' },
      h('h1', { class: 'say play-side__say' }, 'Indovinate la parola!'),
      slots(state.skeleton, 'slots--side'),
      h('p', { class: 'side-note' }, `${state.skeleton.length} lettere. Ogni lettera sbagliata è un tratto dell'omino: al sesto si è impiccati.`),
      count),
    h('section', { class: 'play-board' }, board));

  const cards = new Map();
  let builtFor = '';
  const before = new Map();

  function build(s) {
    const n = Math.max(s.players.length, 1);
    const cols = n <= 8 ? 2 : 3;
    board.style.setProperty("--cols", cols);
    board.dataset.cols = cols;
    board.style.setProperty('--rows', Math.ceil(n / cols));
    cards.clear();
    fill(board, s.players.map((p) => {
      const gallows = createGallows();
      const status = h('span', { class: 'hang__status' });
      const card = h('li', { class: 'hang' },
        h('span', { class: 'hang__pic' }, gallows.el),
        h('span', { class: 'hang__text' }, h('span', { class: 'written hang__name' }, p.name), status));
      cards.set(p.id, { card, gallows, status });
      return card;
    }));
  }

  return {
    el,
    update(s) {
      timer.sync(s.remainingMs ?? 0, s.durationSec * 1000);
      const key = s.players.map((p) => p.id).join();
      if (key !== builtFor) { builtFor = key; build(s); }
      for (const p of s.players) {
        const c = cards.get(p.id);
        c.gallows.set(p.errors);
        const said = outcome(p);
        c.status.textContent = said ?? (p.errors ? `${p.errors} ${p.errors === 1 ? 'errore' : 'errori'}` : p.played ? 'nessun errore' : '');
        c.card.classList.toggle('is-solved', p.solvedMs !== null);
        c.card.classList.toggle('is-hanged', p.hanged);
        c.card.classList.toggle('is-away', !p.online);
        const was = before.get(p.id);
        if (was && !was.finished && p.finished) (p.hanged ? sounds.hanged : sounds.solved)();
        else if (was && p.errors > was.errors) sounds.miss();
        before.set(p.id, { finished: p.finished, errors: p.errors });
      }
      const solved = s.players.filter((p) => p.solvedMs !== null).length;
      count.textContent = solved ? `${solved === 1 ? 'L’ha indovinata' : 'L’hanno indovinata'} in ${solved} su ${s.players.length}` : '';
    },
    destroy: () => timer.destroy(),
  };
}

// ---------- Parola svelata ----------

function reveal(state) {
  const table = h('ol', { class: 'results' });
  const el = tvPage('open',
    h('header', { class: 'open-head' },
      h('h1', { class: 'say open-head__say' }, `Turno ${state.round}: la parola era`),
      slots([...state.word], 'slots--open')),
    table);
  queueMicrotask(() => sounds.reveal());

  return {
    el,
    update(s) {
      const order = s.players
        .filter((p) => p.played || p.online)
        .sort((a, b) => (b.roundPoints ?? 0) - (a.roundPoints ?? 0) || b.total - a.total);
      table.style.setProperty('--n', Math.max(order.length, 1));
      const top = order[0]?.roundPoints ?? 0;
      fill(table,
        h('li', { class: 'results__row results__row--head' },
          h('span', {}), h('span', {}, 'Esito'), h('span', {}, 'Lettere sbagliate'), h('span', { class: 'red' }, 'Turno'), h('span', { class: 'red' }, 'Totale')),
        order.map((p, i) => h('li', { class: `results__row reveal${top > 0 && p.roundPoints === top ? ' is-first' : ''}`, style: { '--i': i } },
          h('span', { class: 'written results__name' }, p.name),
          h('span', { class: `results__tries${p.solvedMs === null ? ' is-miss' : ''}` },
            outcome(p) ?? (p.played ? 'non indovinata' : '—')),
          h('span', { class: 'results__wrong' }, p.wrong?.length ? p.wrong.map((w) => h('span', { class: 'is-struck' }, w)) : h('span', { class: 'pencil' }, p.played ? 'nessuna' : '')),
          h('span', { class: 'red results__pts' }, `+${p.roundPoints ?? 0}`),
          h('span', { class: 'red results__pts' }, String(p.total)))));
    },
  };
}

