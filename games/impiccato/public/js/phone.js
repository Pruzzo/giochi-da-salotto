import { h, fill } from '/js/kit/dom.js';
import { createTimer } from '/js/kit/timer.js';
import { finalPhone, page, rankOf, rosterItems, switchGame, waitingNote } from '/js/kit/ui.js';
import { clock, createGallows, LENGTH_LABELS, rules, slots } from './gallows.js';

export function phoneView(state, ctx) {
  const views = { lobby, choosing, playing, reveal, final: finalPhone };
  return views[state.phase](state, ctx);
}

function choice(label, items, current, onPick) {
  return h('div', { class: 'block' },
    h('h2', { class: 'heading' }, label),
    h('div', { class: 'choice', role: 'group', 'aria-label': label },
      items.map(([value, text]) => h('button', {
        class: 'choice__item', 'aria-pressed': String(value === current), onClick: () => onPick(value),
      }, text))));
}

// ---------- Sala d'attesa ----------

function lobby(state, { act, leave }) {
  const list = h('ul', { class: 'roster' });
  const status = h('p', { class: 'note' });
  const claim = h('button', { class: 'btn btn--ghost btn--wide', onClick: () => act('claimAdmin') }, 'Diventa amministratore');
  const settings = h('section', { class: 'settings' });
  const el = page('lobby',
    h('header', { class: 'phone-head' },
      h('h1', { class: 'hello' }, `Ciao ${state.you.name}!`),
      h('button', { class: 'link', onClick: leave }, 'Esci')),
    status, claim,
    h('section', { class: 'block' }, h('h2', { class: 'heading' }, 'In classe'), list),
    settings,
    switchGame(state, act),
    state.you.isAdmin && h('div', { class: 'dock' },
      h('button', { class: 'btn btn--red btn--wide', onClick: () => act('startRound') }, 'Fai scegliere la parola')));

  return {
    el,
    update(s) {
      const me = s.you.isAdmin;
      status.textContent = waitingNote(s, 'fai scegliere la prima parola');
      claim.hidden = me || s.adminOnline;
      fill(list, rosterItems(s, act));
      fill(settings, me
        ? [
          choice('Parole', s.lengths.map((l) => [l, LENGTH_LABELS[l]]), s.length, (length) => act('setSettings', { length })),
          h('p', { class: 'note' }, `Corte: fino a ${s.shortMax} lettere.`),
          choice('Tempo per turno', s.durations.map((d) => [d, clock(d * 1000)]), s.durationSec, (durationSec) => act('setSettings', { durationSec })),
        ]
        : [h('p', { class: 'note' }, rules(s))]);
    },
  };
}

function choosing() {
  const el = page('center',
    h('div', { class: 'wait-slots', 'aria-hidden': 'true' }, slots(['?', null, null, null, '?'])),
    h('h1', { class: 'shout' }, 'Guarda la TV!'),
    h('p', { class: 'note' }, 'Lo schermo sta scegliendo la parola. Tieni il pollice pronto.'));
  return { el, update() {} };
}

// ---------- Si indovina ----------

function playing(state, { act, toast }) {
  const timer = createTimer({ onTick: (sec) => { if (sec <= 5 && sec > 0) navigator.vibrate?.(30); } });
  const gallows = createGallows();
  const errors = h('p', { class: 'hang-errors' });
  const wrongList = h('p', { class: 'hang-wrong' });
  const word = h('div', { class: 'hang-word' });
  const keys = h('div', { class: 'keys', role: 'group', 'aria-label': 'Lettere' });
  const field = h('input', {
    class: 'field', maxLength: 16, autocomplete: 'off', autocapitalize: 'characters', spellcheck: false,
    enterKeyHint: 'go', placeholder: 'La parola intera', 'aria-label': 'La parola intera',
  });
  const wordForm = h('form', {
    class: 'word-form', hidden: true,
    onSubmit: (e) => {
      e.preventDefault();
      if (!field.value.trim()) return;
      const tried = field.value.trim().toUpperCase();
      act('guessWord', { word: field.value }, (res) => {
        if (!res?.ok) return;
        if (!res.hit) { toast(`Non è ${tried}: un errore in più.`); navigator.vibrate?.([40, 60, 40]); }
        field.value = '';
        toggleWord(false);
      });
    },
  },
  h('p', { class: 'note' }, 'Se sbagli la parola conta come un errore.'),
  field,
  h('div', { class: 'dock__pair' },
    h('button', { class: 'btn btn--ghost', type: 'button', onClick: () => toggleWord(false) }, 'Annulla'),
    h('button', { class: 'btn btn--ink', type: 'submit' }, 'Prova')));
  const sayWord = h('button', { class: 'btn btn--ghost btn--wide', onClick: () => toggleWord(true) }, 'So la parola!');
  const input = h('div', { class: 'compose' }, keys, sayWord);
  const done = h('div', { class: 'solved', hidden: true });
  const stop = state.you.isAdmin && h('button', { class: 'btn btn--ghost btn--wide', onClick: () => act('stopRound') }, 'Ferma il tempo per tutti');

  function toggleWord(open) {
    wordForm.hidden = !open;
    input.hidden = open;
    if (open) field.focus();
  }

  const dock = h('div', { class: 'dock' }, input, wordForm, stop);
  const el = page('hang-sheet',
    h('header', { class: 'sheet-head' }, errors, timer.el),
    h('section', { class: 'hang-top' }, h('div', { class: 'hang-pic' }, gallows.el), wrongList),
    word, done,
    dock);

  let builtFor = '';
  return {
    el,
    update(s) {
      const you = s.you;
      timer.sync(s.remainingMs ?? 0, s.durationSec * 1000);
      gallows.set(you.errors);
      errors.textContent = `Errori ${you.errors} di ${s.maxErrors}`;
      errors.classList.toggle('is-hurt', you.errors >= s.maxErrors - 1);
      fill(wrongList, [...you.wrong, ...you.wordTries].map((w) => h('span', { class: 'is-struck written' }, w)));
      const pattern = you.pattern ?? [];
      const key = pattern.map((c) => c ?? '_').join('');
      if (key !== builtFor) { builtFor = key; fill(word, slots(pattern, 'slots--phone')); }
      const given = new Set([pattern[0], pattern.at(-1)]);
      fill(keys, s.letters.map((c) => {
        const wrong = you.wrong.includes(c);
        const hit = !wrong && (you.tried.includes(c) || given.has(c));
        return h('button', {
          class: `key${wrong ? ' is-wrong' : ''}${hit ? ' is-hit' : ''}`,
          disabled: wrong || hit,
          'aria-label': `${c}${wrong ? ', sbagliata' : hit ? ', nella parola' : ''}`,
          onClick: () => act('guessLetter', { letter: c }, (res) => { if (res?.ok && !res.hit) navigator.vibrate?.(60); }),
        }, c);
      }));
      const finished = you.finished;
      input.hidden = finished || !wordForm.hidden;
      if (finished) wordForm.hidden = true;
      done.hidden = !finished;
      dock.hidden = finished && !stop; // a chi ha finito non resta niente da toccare
      if (finished) {
        const others = s.players.filter((p) => !p.finished && p.online).length;
        fill(done,
          h('p', { class: 'shout shout--small' }, you.solvedMs !== null ? `Indovinata in ${clock(you.solvedMs)}!` : 'Impiccato!'),
          h('p', { class: 'note' }, others ? `Aspettiamo gli altri: ne mancano ${others}. Guarda la TV.` : 'Guarda la TV.'));
      }
    },
    destroy: () => timer.destroy(),
  };
}

// ---------- Parola svelata ----------

function reveal(state, { act }) {
  const body = h('div', { class: 'wait-body' });
  const el = page('wait', body, state.you.isAdmin && h('div', { class: 'dock' },
    h('button', { class: 'btn btn--red btn--wide', onClick: () => act('startRound') }, 'Nuova parola'),
    h('button', { class: 'btn btn--ghost btn--wide', onClick: () => act('endGame') }, 'Fine partita')));
  return {
    el,
    update(s) {
      const me = s.players.find((p) => p.id === s.you.id);
      const line = s.you.solvedMs !== null
        ? `Indovinata in ${clock(s.you.solvedMs)} con ${s.you.errors} ${s.you.errors === 1 ? 'errore' : 'errori'}: +${me?.roundPoints ?? 0}`
        : s.you.hanged ? 'Impiccato: +0' : me?.played ? 'Non indovinata in tempo: +0' : 'Non hai giocato questo turno.';
      fill(body,
        h('p', { class: 'note' }, 'La parola era'),
        h('div', { class: 'hang-word' }, slots([...s.word], 'slots--phone')),
        h('p', { class: 'sum' }, line),
        h('h1', { class: 'shout' }, `${me?.total ?? 0} punti`),
        h('p', { class: 'note' }, `${rankOf(s.players, s.you.id)}° in classifica su ${s.players.length}. ${s.you.isAdmin ? '' : 'Tra poco si riparte.'}`));
    },
  };
}
