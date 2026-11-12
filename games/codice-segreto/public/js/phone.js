import { h, fill } from '/js/kit/dom.js';
import { createTimer } from '/js/kit/timer.js';
import { finalPhone, page, rankOf, rosterItems, switchGame, waitingNote } from '/js/kit/ui.js';
import { COLORS, peg, pegRow, pins } from './pegs.js';

const clock = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

export function phoneView(state, ctx) {
  const views = { lobby, hiding, playing, reveal, final: finalPhone };
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
      h('button', { class: 'btn btn--red btn--wide', onClick: () => act('startRound') }, 'Fai scegliere il codice')));

  return {
    el,
    update(s) {
      const me = s.you.isAdmin;
      status.textContent = waitingNote(s, 'fai scegliere il primo codice allo schermo');
      claim.hidden = me || s.adminOnline;
      fill(list, rosterItems(s, act));
      fill(settings, me
        ? [
          choice('Pastelli tra cui scegliere', s.colorOptions.map((n) => [n, String(n)]), s.colors, (colors) => act('setSettings', { colors })),
          choice('Colori ripetuti nel codice', [[false, 'No'], [true, 'Sì']], s.repeats, (repeats) => act('setSettings', { repeats })),
          choice('Tempo per turno', s.durations.map((d) => [d, clock(d)]), s.durationSec, (durationSec) => act('setSettings', { durationSec })),
        ]
        : [h('p', { class: 'note' }, rules(s))]);
    },
  };
}

export function rules(s) {
  return `${s.codeLength} pastelli su ${s.colors}, ${s.repeats ? 'anche ripetuti' : 'tutti diversi'}. ${s.maxAttempts} tentativi, ${clock(s.durationSec)} a turno.`;
}

function hiding() {
  const el = page('center',
    h('div', { class: 'hide-pegs', 'aria-hidden': 'true' }, [1, 2, 3, 4].map((c) => peg(c))),
    h('h1', { class: 'shout' }, 'Guarda la TV!'),
    h('p', { class: 'note' }, 'Lo schermo sta scegliendo il codice. Tra un attimo puoi provare.'));
  return { el, update() {} };
}

// ---------- Si indovina ----------

function playing(state, { act }) {
  const length = state.codeLength;
  let draft = Array(length).fill(null);
  let cursor = 0;
  let shown = -1;
  let sending = false;

  const timer = createTimer({ onTick: (sec) => { if (sec <= 5 && sec > 0) navigator.vibrate?.(30); } });
  const count = h('span', { class: 'try-count' });
  const history = h('ol', { class: 'tries' });
  const slots = h('div', { class: 'draft', role: 'group', 'aria-label': 'Il tuo tentativo' });
  const palette = h('div', { class: 'palette', role: 'group', 'aria-label': 'Pastelli' });
  const send = h('button', { class: 'btn btn--ink', onClick: submit }, 'Prova');
  const erase = h('button', { class: 'btn btn--ghost', onClick: back }, 'Cancella');
  const why = h('p', { class: 'draft__why', 'aria-live': 'polite' });
  const input = h('div', { class: 'compose' }, slots, why, palette, h('div', { class: 'dock__pair' }, erase, send));
  const done = h('div', { class: 'solved', hidden: true });
  const stop = state.you.isAdmin && h('button', { class: 'btn btn--ghost btn--wide', onClick: () => act('stopRound') }, 'Ferma il tempo per tutti');

  const el = page('code-sheet',
    h('header', { class: 'sheet-head' }, count, timer.el),
    history, done,
    h('div', { class: 'dock' }, input, stop));

  const same = (a, b) => a.every((c, i) => c === b[i]);
  let current = state;

  function drawDraft() {
    const full = draft.every(Boolean);
    const repeated = full && current.you.guesses.some((g) => same(g.code, draft));
    fill(slots, draft.map((c, i) => h('button', {
      class: `draft__slot${i === cursor ? ' is-cursor' : ''}`,
      'aria-label': `Posto ${i + 1}: ${c ? COLORS[c].name : 'vuoto'}`,
      'aria-pressed': String(i === cursor),
      onClick: () => { cursor = i; drawDraft(); },
    }, peg(c, { 'aria-hidden': 'true' }))));
    send.disabled = !full || repeated || sending;
    erase.disabled = draft.every((c) => !c);
    why.textContent = repeated ? 'Questa fila l’hai già provata.' : '';
  }

  function pick(c) {
    draft[cursor] = c;
    navigator.vibrate?.(8);
    const next = draft.findIndex((v, i) => !v && i > cursor);
    const any = draft.findIndex((v) => !v);
    cursor = next >= 0 ? next : any >= 0 ? any : Math.min(cursor + 1, length - 1);
    drawDraft();
  }

  function back() {
    if (!draft[cursor]) {
      const prev = draft.findLastIndex((v, i) => v && i < cursor);
      if (prev >= 0) cursor = prev;
    }
    draft[cursor] = null;
    drawDraft();
  }

  function submit() {
    if (!draft.every(Boolean)) return;
    sending = true;
    drawDraft();
    act('guess', { code: [...draft] }, (res) => {
      sending = false;
      // La fila resta lì: di solito si cambia solo qualche pastello. Il cursore torna all'inizio.
      if (res?.ok) cursor = 0;
      drawDraft();
    });
  }

  return {
    el,
    update(s) {
      current = s;
      timer.sync(s.remainingMs ?? 0, s.durationSec * 1000);
      const tries = s.you.guesses;
      const left = s.maxAttempts - tries.length;
      count.textContent = s.you.finished ? `${tries.length} tentativi` : `Tentativo ${tries.length + 1} di ${s.maxAttempts}`;
      if (tries.length !== shown) {
        shown = tries.length;
        fill(history, tries.map((g, i) => h('li', { class: `try${i === tries.length - 1 ? ' is-new' : ''}` },
          h('span', { class: 'try__n' }, String(i + 1)),
          pegRow(g.code),
          pins(g.exact, g.near, s.codeLength))));
        if (!tries.length) fill(history, h('li', { class: 'tries__empty note' },
          'Componi una fila di pastelli e premi Prova. ', h('b', {}, '●'), ' pastello giusto al posto giusto, ', h('b', {}, '○'), ' pastello giusto da spostare.'));
        requestAnimationFrame(() => history.lastElementChild?.scrollIntoView({ block: 'nearest' }));
      }
      fill(palette, Array.from({ length: s.colors }, (_, i) => h('button', {
        class: 'choice__item palette__btn', 'aria-label': `${i + 1} ${COLORS[i + 1].name}`, onClick: () => pick(i + 1),
      }, peg(i + 1, { 'aria-hidden': 'true' }))));
      palette.style.setProperty('--cols', s.colors > 6 ? 4 : 3);
      input.hidden = s.you.finished;
      done.hidden = !s.you.finished;
      if (s.you.finished) {
        const others = s.players.filter((p) => !p.finished && p.online).length;
        fill(done,
          h('p', { class: 'shout shout--small' }, s.you.rank ? (s.you.rank === 1 ? 'Trovato per primo!' : `Trovato! Sei ${s.you.rank}°`) : 'Tentativi finiti'),
          h('p', { class: 'note' }, others ? `Aspettiamo gli altri: ne mancano ${others}. Guarda la TV.` : 'Guarda la TV.'));
      } else if (left === 1) {
        count.textContent = `Ultimo tentativo!`;
      }
      drawDraft();
    },
    destroy: () => timer.destroy(),
  };
}

// ---------- Codice svelato ----------

/** Le proprie file del turno, numerate e con i pallini, da confrontare col codice svelato. */
function triesList(guesses, length) {
  return guesses.map((g, i) => h('li', { class: 'try' },
    h('span', { class: 'try__n' }, String(i + 1)),
    pegRow(g.code),
    pins(g.exact, g.near, length)));
}

function reveal(state, { act }) {
  const body = h('div', { class: 'wait-body' });
  // Le giocate si aprono solo a richiesta: restano aperte anche quando arriva un aggiornamento.
  let open = false;
  const list = h('ol', { class: 'tries tries--review', hidden: true });
  const toggle = h('button', {
    class: 'btn btn--ghost btn--wide', 'aria-expanded': 'false',
    onClick: () => { open = !open; paint(); },
  });
  const mine = h('section', { class: 'review' }, toggle, list);
  function paint() {
    toggle.textContent = open ? 'Nascondi le tue giocate' : 'Vedi le tue giocate';
    toggle.setAttribute('aria-expanded', String(open));
    list.hidden = !open;
  }
  paint();
  const el = page('wait', body, mine, state.you.isAdmin && h('div', { class: 'dock' },
    h('button', { class: 'btn btn--red btn--wide', onClick: () => act('startRound') }, 'Nuovo codice'),
    h('button', { class: 'btn btn--ghost btn--wide', onClick: () => act('endGame') }, 'Fine partita')));
  return {
    el,
    update(s) {
      const me = s.players.find((p) => p.id === s.you.id);
      const tries = s.you.guesses.length;
      const line = s.you.rank
        ? `Trovato in ${tries} ${tries === 1 ? 'tentativo' : 'tentativi'}: +${me?.roundPoints ?? 0}`
        : tries ? 'Non trovato questa volta: +0' : 'Non hai giocato questo turno.';
      fill(body,
        h('p', { class: 'note' }, 'Il codice era'),
        pegRow(s.code, 'pegs--big'),
        h('p', { class: 'sum' }, line),
        h('h1', { class: 'shout' }, `${me?.total ?? 0} punti`),
        h('p', { class: 'note' }, `${rankOf(s.players, s.you.id)}° in classifica su ${s.players.length}. ${s.you.isAdmin ? '' : 'Tra poco si riparte.'}`));
      mine.hidden = !tries;
      fill(list, triesList(s.you.guesses, s.codeLength));
    },
  };
}
