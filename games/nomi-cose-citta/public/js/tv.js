import { h, fill, penLetter, scoreMark } from './dom.js';
import { sounds } from './audio.js';
import { createTimer } from '/js/kit/timer.js';
import { coverTv, finalTv, tvPage } from '/js/kit/ui.js';
import { createWheel } from './wheel.js';
import { cellClass } from './phone.js';

export function tvView(state) {
  const views = { lobby, spinning, writing, review: sheet, scored: sheet, final: finalTv };
  return views[state.phase](state);
}

// ---------- Copertina ----------

function lobby() {
  return coverTv({
    title: 'Nomi, cose e città',
    subject: { label: 'Materie', text: (s) => s.categories.join(' · ') },
    cta: (admin) => `${admin} farà girare la ruota quando siete tutti.`,
  });
}

// ---------- Ruota ----------

function spinning(state) {
  const wheel = createWheel(state.letters, state.usedLetters.slice(0, -1));
  const big = h('p', { class: 'spin-side__letter', 'aria-live': 'polite' });
  const say = h('h1', { class: 'spin-side__say' }, `Turno ${state.round}: la ruota sta girando…`);
  const under = h('p', { class: 'spin-side__under' }, 'Tenete pronto il telefono.');
  const el = tvPage('spin',
    h('div', { class: 'spin-wheel' }, wheel.el),
    h('section', { class: 'spin-side' },
      say, big, under));
  const elapsed = state.spin.totalMs - (state.remainingMs ?? state.spin.totalMs);
  queueMicrotask(() => wheel.spin({
    ...state.spin,
    elapsedMs: elapsed,
    onLand() {
      say.textContent = `Turno ${state.round}: la lettera è`;
      fill(big, penLetter(state.letter));
      under.textContent = 'Preparatevi a scrivere 5 parole!';
      el.classList.add('spin--landed');
      sounds.letter();
    },
  }));
  return { el, update() {}, destroy: () => wheel.destroy() };
}

// ---------- Scrittura ----------

function writing(state) {
  const timer = createTimer({
    onTick: (sec) => { if (sec > 0 && sec <= 10) sounds.hurry(); },
    onEnd: () => sounds.stop(),
  });
  const board = h('ul', { class: 'progress' });
  const count = h('p', { class: 'pencil pencil--big' });
  const el = tvPage('write',
    h('div', { class: 'write-top' }, timer.el),
    h('section', { class: 'write-letter' }, h('span', { class: 'giant' }, penLetter(state.letter))),
    h('section', { class: 'write-do' },
      h('h1', { class: 'say' }, `Scrivete una parola con la ${state.letter} per ogni categoria`),
      h('ol', { class: 'cats-list' }, state.categories.map((c) => h('li', {}, c))),
      count),
    h('section', { class: 'write-board' }, board));
  return {
    el,
    update(s) {
      timer.sync(s.remainingMs ?? 0, s.durationSec * 1000);
      const done = s.players.filter((p) => p.done).length;
      count.textContent = done ? `Hanno consegnato in ${done} su ${s.players.length}` : '';
      fill(board, s.players.map((p) => h('li', { class: `progress__row${p.done ? ' is-done' : ''}${p.online ? '' : ' is-away'}` },
        h('span', { class: 'written is-name' }, p.name),
        h('span', { class: 'ticks', 'aria-label': `${p.filled.filter(Boolean).length} parole su 5` },
          p.filled.map((on) => h('span', { class: `tick${on ? ' is-on' : ''}` }))))));
    },
    destroy: () => timer.destroy(),
  };
}

// ---------- Correzione e punteggi ----------

function sheet(state) {
  const table = h('div', { class: 'table', role: 'table', 'aria-label': 'Parole di tutti i giocatori' });
  const help = h('p', { class: 'sheet-help' });
  const el = tvPage(`marks marks--${state.phase}`,
    h('header', { class: 'marks-head' },
      h('span', { class: 'marks-letter' }, penLetter(state.letter)),
      h('h1', { class: 'say say--mid' }, state.phase === 'review' ? 'Correzione' : `Punti del turno ${state.round}`),
      help),
    table);
  const cells = new Map();
  let builtFor = '';

  /** Ogni parola resta su una riga e si rimpicciolisce quanto basta per stare nel suo quadretto. */
  function fitText() {
    table.querySelectorAll('.word, .table__name').forEach((node) => {
      node.classList.remove('word--wrap');
      node.style.setProperty('--fit', '1');
      const style = getComputedStyle(node.parentElement);
      const box = node.parentElement.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const width = node.getBoundingClientRect().width;
      if (box <= 0 || width <= box) return;
      const fit = box / width;
      // Sotto il 60% non si legge dal divano: meglio andare a capo.
      const isWord = node.classList.contains('word');
      if (fit < 0.6 && isWord) node.classList.add('word--wrap');
      node.style.setProperty('--fit', (isWord ? Math.max(fit, 0.6) : fit).toFixed(3));
    });
  }

  function build(s) {
    const scored = s.phase === 'scored';
    table.style.setProperty('--rows', Math.max(s.rows.length, 1));
    const rowQ = Math.min(5, Math.max(2, Math.floor(24 / Math.max(s.rows.length, 1))));
    table.style.setProperty('--row-q', rowQ);
    table.classList.toggle('table--roomy', rowQ >= 4);
    const head = h('div', { class: 'table__row table__row--head', role: 'row' },
      h('span', { class: 'table__name', role: 'columnheader' }),
      s.categories.map((c) => h('span', { class: 'table__cat', role: 'columnheader' }, c)),
      h('span', { class: 'table__sum', role: 'columnheader' }, 'Turno'),
      scored && h('span', { class: 'table__sum', role: 'columnheader' }, 'Totale'));
    const rows = s.rows.map((row, r) => {
      const rowEl = h('div', { class: 'table__row reveal', role: 'row', 'data-id': row.playerId, style: { '--i': r } },
        h('span', { class: 'table__name-box', role: 'rowheader' }, h('span', { class: 'table__name is-name' }, row.name)),
        row.cells.map((cell, i) => {
          const word = h('span', { class: 'word' }, cell.text || '—');
          const slot = h('span', { class: 'cell__mark' });
          const box = h('span', { class: 'cell', role: 'cell' }, h('span', { class: 'word-wrap' }, word), slot);
          cells.set(`${row.playerId}:${i}`, { word, slot, last: null });
          return box;
        }),
        h('span', { class: 'table__sum red', role: 'cell', 'data-points': '' }),
        scored && h('span', { class: 'table__sum red red--total', role: 'cell', 'data-total': '' }));
      return rowEl;
    });
    fill(table, head, rows);
    fitText();
    document.fonts?.ready.then(fitText);
  }

  return {
    el,
    update(s) {
      const scored = s.phase === 'scored';
      help.textContent = scored
        ? "L'amministratore può far partire un nuovo turno."
        : `Unica 3 · Doppione 1 · Sbagliata 0. ${s.players.find((p) => p.isAdmin)?.name ?? "L'amministratore"} decide dal telefono.`;
      const key = s.rows.map((r) => r.playerId).join();
      if (key !== builtFor) {
        builtFor = key;
        build(s);
      }
      for (const row of s.rows) {
        const rowEl = table.querySelector(`[data-id="${row.playerId}"]`);
        rowEl.classList.toggle('is-focus', row.playerId === s.focusId);
        rowEl.querySelector('[data-points]').textContent = row.points;
        const total = rowEl.querySelector('[data-total]');
        if (total) total.textContent = s.players.find((p) => p.id === row.playerId)?.total ?? 0;
        row.cells.forEach((cell, i) => {
          const c = cells.get(`${row.playerId}:${i}`);
          const stamp = `${cell.score}${cell.confirmed}`;
          // Non tocca word--wrap: il voto in diretta non deve rompere l'adattamento del testo.
          for (const name of ['is-empty', 'is-struck', 'is-dup']) c.word.classList.toggle(name, cellClass(cell).includes(name));
          if (c.last !== stamp) {
            const fresh = c.last !== null && cell.confirmed;
            fill(c.slot, scoreMark(cell.score, cell.confirmed));
            if (fresh) { c.slot.firstChild.classList.add('mark--draw'); sounds.mark(); }
            c.last = stamp;
          }
        });
      }
    },
  };
}
