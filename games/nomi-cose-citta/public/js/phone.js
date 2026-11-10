import { h, fill, penLetter, scoreMark } from './dom.js';
import { createTimer } from '/js/kit/timer.js';
import { finalPhone, page, rankOf, rosterItems, switchGame, waitingNote } from '/js/kit/ui.js';

const initial = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').charAt(0).toUpperCase();
// ---------- Vista telefono per fase ----------

export function phoneView(state, ctx) {
  const views = { lobby, spinning, writing, review, scored, final: finalPhone };
  return views[state.phase](state, ctx);
}

function lobby(state, { act, leave }) {
  const isAdmin = state.you.isAdmin;
  const list = h('ul', { class: 'roster' });
  const status = h('p', { class: 'note' });
  const startBtn = h('button', { class: 'btn btn--red btn--wide', onClick: () => act('startRound') }, 'Fai girare la ruota');
  const claim = h('button', { class: 'btn btn--ghost btn--wide', onClick: () => act('claimAdmin') }, 'Diventa amministratore');
  const catInputs = state.categories.map((value, i) => h('input', {
    class: 'field field--small', value, maxLength: 16, 'aria-label': `Categoria ${i + 1}`,
    onChange: () => act('setSettings', { categories: catInputs.map((inp) => inp.value) }),
  }));
  const durations = h('div', { class: 'choice', role: 'group', 'aria-label': 'Tempo per turno' });

  const admin = isAdmin && h('section', { class: 'block' },
    h('h2', { class: 'heading' }, 'Le 5 categorie'),
    h('div', { class: 'cats' }, catInputs),
    h('h2', { class: 'heading' }, 'Tempo per turno'),
    durations);

  const el = page('lobby',
    h('header', { class: 'phone-head' },
      h('h1', { class: 'hello' }, `Ciao ${state.you.name}!`),
      h('button', { class: 'link', onClick: leave }, 'Esci')),
    status, claim,
    h('section', { class: 'block' }, h('h2', { class: 'heading' }, 'In classe'), list),
    admin,
    switchGame(state, act),
    isAdmin && h('div', { class: 'dock' }, startBtn));

  return {
    el,
    update(s) {
      const me = s.you.isAdmin;
      status.textContent = waitingNote(s, 'fai partire il primo turno');
      claim.hidden = me || s.adminOnline;
      fill(list, rosterItems(s, act));
      if (me) {
        catInputs.forEach((inp, i) => { if (document.activeElement !== inp) inp.value = s.categories[i]; });
        fill(durations, s.durations.map((d) => h('button', {
          class: 'choice__item', 'aria-pressed': String(d === s.durationSec),
          onClick: () => act('setSettings', { durationSec: d }),
        }, `${d}s`)));
      }
    },
  };
}

function spinning() {
  const el = page('center',
    h('svg:svg', { viewBox: '0 0 100 100', class: 'scribble', 'aria-hidden': 'true' },
      h('svg:path', { d: 'M50 8C25 7 8 26 9 50c1 24 19 42 42 41 23-1 41-20 40-42C90 28 72 9 46 10' }),
      h('svg:path', { class: 'scribble__arm', d: 'M50 50L50 18' })),
    h('h1', { class: 'shout' }, 'Guarda la TV!'),
    h('p', { class: 'note' }, 'La ruota sta scegliendo la lettera. Tieni il pollice pronto.'));
  return { el, update() {} };
}

function writing(state, { act }) {
  const letter = state.letter;
  const timer = createTimer({ onTick: (sec) => { if (sec <= 5 && sec > 0) navigator.vibrate?.(30); } });
  const debounce = new Map();
  const send = (index, word) => {
    clearTimeout(debounce.get(index));
    debounce.set(index, setTimeout(() => act('saveWord', { index, word }), 180));
  };
  const flush = (index, word) => {
    clearTimeout(debounce.get(index));
    act('saveWord', { index, word });
  };

  const fields = state.categories.map((cat, i) => {
    const warn = h('span', { class: 'row__warn', hidden: true }, `Non inizia per ${letter}`);
    const input = h('input', {
      id: `w${i}`, class: 'row__input', value: state.sheet?.words[i] ?? '', maxLength: 40,
      autocomplete: 'off', autocapitalize: 'words', spellcheck: false,
      enterKeyHint: i < 4 ? 'next' : 'done', placeholder: `${letter}…`,
      onInput: () => { check(); send(i, input.value); },
      onBlur: () => flush(i, input.value),
      onKeydown: (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        if (i < 4) document.getElementById(`w${i + 1}`)?.focus();
        else input.blur();
      },
    });
    const check = () => {
      const v = input.value.trim();
      warn.hidden = !v || initial(v) === letter;
    };
    check();
    return { input, row: h('label', { class: 'row', for: `w${i}` }, h('span', { class: 'row__cat' }, cat), input, warn) };
  });

  const doneBtn = h('button', { class: 'btn btn--ink btn--wide' }, 'Ho finito');
  let done = false;
  doneBtn.addEventListener('click', () => {
    fields.forEach((f, i) => flush(i, f.input.value));
    act('setDone', { done: !done });
  });

  const el = page('sheet',
    h('header', { class: 'sheet-head' },
      h('span', { class: 'sheet-head__letter', 'data-letter': letter }, penLetter(letter)),
      timer.el),
    h('form', { class: 'rows', onSubmit: (e) => e.preventDefault() }, fields.map((f) => f.row)),
    h('div', { class: 'dock' },
      doneBtn,
      state.you.isAdmin && h('button', { class: 'btn btn--ghost btn--wide', onClick: () => act('stopWriting') }, 'Ferma il tempo per tutti')));

  return {
    el,
    update(s) {
      timer.sync(s.remainingMs ?? 0, s.durationSec * 1000);
      done = !!s.sheet?.done;
      doneBtn.textContent = done ? 'Consegnato. Tocca per riaprire' : 'Ho finito';
      doneBtn.classList.toggle('is-done', done);
      fields.forEach((f) => { f.input.readOnly = done; });
    },
    destroy() {
      timer.destroy();
      debounce.forEach((t) => clearTimeout(t));
    },
  };
}

function ownSheet(state, row) {
  return h('ul', { class: 'own' }, state.categories.map((cat, i) => {
    const cell = row.cells[i];
    return h('li', { class: 'own__row' },
      h('span', { class: 'row__cat' }, cat),
      h('span', { class: `written ${cellClass(cell)}` }, cell.text || 'vuota'),
      scoreMark(cell.score, cell.confirmed));
  }));
}

export function cellClass(cell) {
  return [
    cell.empty && 'is-empty',
    cell.score === 0 && !cell.empty && 'is-struck',
    cell.duplicateOf.length > 0 && 'is-dup',
  ].filter(Boolean).join(' ');
}

function review(state, ctx) {
  return state.you.isAdmin ? adminReview(state, ctx) : playerReview(state);
}

function playerReview() {
  const body = h('div');
  return {
    el: page('wait', h('h1', { class: 'shout shout--small' }, 'Guarda la TV!'), h('p', { class: 'note' }, "L'amministratore sta correggendo. Qui vedi i tuoi punti in diretta."), body),
    update(s) {
      const row = s.rows.find((r) => r.playerId === s.you.id);
      if (!row) { fill(body, h('p', { class: 'note' }, 'In questo turno non hai scritto parole.')); return; }
      fill(body, ownSheet(s, row), h('p', { class: 'sum' }, `Turno: ${row.points}`));
    },
  };
}

function adminReview(state, { act }) {
  const tabs = h('div', { class: 'who', role: 'group', 'aria-label': 'Giocatore da correggere' });
  const body = h('div', { class: 'grade' });
  const nav = h('div', { class: 'dock' });
  let current = state.focusId;

  const el = page('review', h('header', { class: 'phone-head' },
    h('h1', { class: 'hello hello--red' }, `Correggi: lettera ${state.letter}`)), tabs, body, nav);

  const pick = (s, id) => { current = id; act('setFocus', { playerId: id }); draw(s); };

  function draw(s) {
    if (!s.rows.some((r) => r.playerId === current)) current = s.rows[0]?.playerId;
    fill(tabs, s.rows.map((r) => h('button', {
      class: 'who__item', 'aria-pressed': String(r.playerId === current),
      onClick: () => pick(s, r.playerId),
    }, r.name, h('span', { class: 'who__pts' }, String(r.points)))));
    const row = s.rows.find((r) => r.playerId === current);
    if (!row) { fill(body, h('p', { class: 'note' }, 'Nessuna parola in questo turno.')); }
    else {
      fill(body, s.categories.map((cat, i) => {
        const cell = row.cells[i];
        return h('div', { class: 'grade__row' },
          h('div', { class: 'grade__word' },
            h('span', { class: 'row__cat' }, cat),
            h('span', { class: `written ${cellClass(cell)}` }, cell.text || 'vuota'),
            h('span', { class: 'why' },
              cell.duplicateOf.length ? `Uguale a ${cell.duplicateOf.join(', ')}` : cell.wrongLetter ? `Non inizia per ${s.letter}` : '')),
          h('div', { class: 'pts', role: 'group', 'aria-label': `Punti per ${cell.text || cat}` },
            [3, 1, 0].map((v) => h('button', {
              class: 'pts__btn', 'data-v': v, 'aria-pressed': String(cell.score === v),
              onClick: () => act('setScore', { playerId: row.playerId, index: i, score: v }),
            }, String(v)))));
      }));
    }
    const idx = s.rows.findIndex((r) => r.playerId === current);
    const nextRow = s.rows[idx + 1];
    fill(nav,
      nextRow
        ? h('button', { class: 'btn btn--ink btn--wide', onClick: () => pick(s, nextRow.playerId) }, `Avanti: ${nextRow.name}`)
        : null,
      h('button', { class: `btn ${nextRow ? 'btn--ghost' : 'btn--red'} btn--wide`, onClick: () => act('confirmRound') }, 'Conferma i punti del turno'));
  }

  return { el, update: draw };
}

function scored(state, { act }) {
  const body = h('div');
  const isAdmin = state.you.isAdmin;
  const el = page('wait', body, isAdmin && h('div', { class: 'dock' },
    h('button', { class: 'btn btn--red btn--wide', onClick: () => act('startRound') }, 'Nuovo turno'),
    h('div', { class: 'dock__pair' },
      h('button', { class: 'btn btn--ghost', onClick: () => act('reopenRound') }, 'Correggi'),
      h('button', { class: 'btn btn--ghost', onClick: () => act('endGame') }, 'Fine partita'))));
  return {
    el,
    update(s) {
      const me = s.players.find((p) => p.id === s.you.id);
      const row = s.rows?.find((r) => r.playerId === s.you.id);
      fill(body,
        h('h1', { class: 'shout' }, `${me?.total ?? 0} punti`),
        h('p', { class: 'note' }, `${rankOf(s.players, s.you.id)}° in classifica su ${s.players.length}. ${isAdmin ? '' : 'Tra poco si riparte.'}`),
        row && ownSheet(s, row));
    },
  };
}
