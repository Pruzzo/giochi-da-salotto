import { h, fill } from '/js/kit/dom.js';
import { finalPhone, page, rosterItems, switchGame, waitingNote } from '/js/kit/ui.js';
import { person } from './people.js';
import { sounds } from './audio.js';

export const clock = (ms) => {
  const sec = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
};
const LEVEL_NAMES = { facile: 'Facile', normale: 'Normale', difficile: 'Difficile' };
const errorsText = (n) => (n === 1 ? '1 errore' : `${n} errori`);

export function rules(s) {
  const strangers = s.strangers ? ` e ${s.strangers === 1 ? '1 sconosciuto' : `${s.strangers} sconosciuti`}` : '';
  const clothes = { facile: 'stessi vestiti', normale: 'vestiti diversi', difficile: 'vestiti diversi, anche cappelli' }[s.level];
  return `${s.known} persone${strangers}, ${clothes}, ${s.paceSec} secondi a presentazione. Ogni errore costa ${s.penaltyMs / 1000} secondi.`;
}

export function phoneView(state, ctx) {
  const views = { lobby, intro, countdown, quiz, reveal, final: finalPhone };
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
    h('section', { class: 'block' }, h('h2', { class: 'heading' }, 'Giocatori'), list),
    settings,
    switchGame(state, act),
    state.you.isAdmin && h('div', { class: 'dock' },
      h('button', { class: 'btn btn--red btn--wide', onClick: () => act('startRound') }, 'Fate entrare gli ospiti')));

  return {
    el,
    update(s) {
      const me = s.you.isAdmin;
      status.textContent = waitingNote(s, 'fai entrare gli ospiti');
      claim.hidden = me || s.adminOnline;
      fill(list, rosterItems(s, act));
      fill(settings, me
        ? [
          choice('Persone che si presentano', s.knownOptions.map((n) => [n, String(n)]), s.known, (known) => act('setSettings', { known })),
          choice('Sconosciuti nella seconda parte', s.strangerOptions.map((n) => [n, n ? String(n) : 'Nessuno']), s.strangers, (strangers) => act('setSettings', { strangers })),
          choice('Vestiti', s.levels.map((l) => [l, LEVEL_NAMES[l]]), s.level, (level) => act('setSettings', { level })),
          h('p', { class: 'note' }, { facile: 'Le persone tornano con gli stessi vestiti.', normale: 'Le persone tornano con altri vestiti.', difficile: 'Altri vestiti, a volte cappelli e sciarpe, e sconosciuti che somigliano a qualcuno.' }[s.level]),
          choice('Secondi a presentazione', s.paceOptions.map((n) => [n, String(n)]), s.paceSec, (paceSec) => act('setSettings', { paceSec })),
        ]
        : [h('p', { class: 'note' }, rules(s))]);
    },
  };
}

// ---------- Prima parte: si guarda la TV ----------

function waitTurn() {
  return page('watch', h('h1', { class: 'shout shout--small' }, 'Turno già iniziato'), h('p', { class: 'note' }, 'Guarda la TV: giochi dal prossimo turno.'));
}

function intro(state) {
  if (!state.you.racing) return { el: waitTurn(), update() {} };
  const dots = h('div', { class: 'watch__dots', 'aria-hidden': 'true' });
  const count = h('p', { class: 'note' });
  const el = page('watch',
    h('h1', { class: 'shout' }, 'Guarda la TV!'),
    h('p', { class: 'note' }, `Si presentano ${state.introCount} persone: ricordati nome e faccia. Poi tornano qui, una alla volta${state.level === 'facile' ? '' : ', con altri vestiti'}.`),
    dots, count);
  return {
    el,
    update(s) {
      fill(dots, Array.from({ length: s.introCount }, (_, i) => h('span', { class: `watch__dot${i <= s.introIndex ? ' is-done' : ''}` })));
      count.textContent = s.introIndex >= 0 ? `Si presenta la ${s.introIndex + 1}ª di ${s.introCount}` : 'Stanno arrivando…';
    },
  };
}

/** Il 3, 2, 1: uguale su TV e telefono, contato in locale dal tempo che manca. */
export function countdownNumber(el, onBeat) {
  let endsAt = 0;
  let shown = null;
  const paint = () => {
    const n = Math.max(1, Math.ceil((endsAt - performance.now()) / 1000));
    if (n !== shown) { shown = n; el.textContent = String(n); onBeat?.(n); }
  };
  const handle = setInterval(paint, 100);
  return {
    sync(remainingMs) { endsAt = performance.now() + remainingMs; paint(); },
    destroy: () => clearInterval(handle),
  };
}

function countdown(state) {
  if (!state.you.racing) return { el: waitTurn(), update() {} };
  const n = h('p', { class: 'countdown__n countdown__n--phone', 'aria-live': 'polite' });
  const beat = countdownNumber(n, () => { navigator.vibrate?.(40); sounds.beat(); });
  const el = page('watch', n,
    state.level !== 'facile' && h('p', { class: 'countdown__warn countdown__warn--phone' }, 'Occhio ai vestiti!'),
    h('p', { class: 'note' }, 'Tra un attimo tornano qui, una alla volta.'));
  return { el, update(s) { beat.sync(s.remainingMs ?? 0); }, destroy: beat.destroy };
}

// ---------- Seconda parte: chi è? ----------

const FEEDBACK_MS = 900;

function quiz(state, { act }) {
  if (!state.you.racing) return { el: waitTurn(), update() {} };
  const count = h('span', { class: 'try-count' });
  const errs = h('span', { class: 'meet__err' });
  const watch = h('span', { class: 'timer__secs meet__clock' });
  const stage = h('div', { class: 'meet__stage' });
  const verdict = h('p', { class: 'verdict', 'aria-live': 'polite', hidden: true });
  const buttons = state.you.names.map((n) => h('button', { class: 'choice__item', onClick: () => send(n.id) }, n.name));
  const none = h('button', { class: 'btn btn--ghost answers__none', onClick: () => send('none') }, 'Non ti conosco');
  const answers = h('div', { class: 'answers', style: { '--cols': buttons.length > 6 ? 3 : 2 } }, buttons, none);
  const dock = h('div', { class: 'dock' }, answers);
  const done = h('div', { class: 'solved', hidden: true });
  const stop = state.you.isAdmin && h('button', { class: 'btn btn--ghost btn--wide', onClick: () => act('stopRound') }, 'Ferma il tempo per tutti');
  const el = page('meet',
    h('header', { class: 'sheet-head meet-head' }, count, errs, watch),
    stage, verdict, done, dock, stop && h('div', { class: 'meet__stop', hidden: true }, stop));

  let latest = state;
  let holding = false; // la risposta resta sullo schermo un attimo prima della persona dopo
  let drawnStep = -1;
  let base = 0; // performance.now() quando il cronometro segnava zero
  const lock = (on) => { for (const b of [...buttons, none]) b.disabled = on; };

  const tick = setInterval(() => {
    if (latest.you.doneMs === null) watch.textContent = clock(performance.now() - base);
  }, 250);

  function send(pick) {
    if (holding) return;
    lock(true);
    act('answer', { pick }, (res) => {
      if (!res?.ok) { lock(false); return; }
      holding = true;
      navigator.vibrate?.(res.right ? 15 : [40, 60, 40]);
      (res.right ? sounds.right : sounds.wrong)();
      const bubble = stage.querySelector('.bubble');
      if (res.hello) { bubble.textContent = `Piacere, ${res.hello}!`; bubble.classList.add('bubble--hello'); }
      else bubble.textContent = res.right ? 'Sì, sono io!' : 'Ma no, non sono io!';
      verdict.className = `verdict ${res.right ? 'verdict--ok' : 'verdict--ko'}`;
      fill(verdict, res.right ? (res.hello ? 'Giusto, è nuovo' : 'Giusto') : 'Sbagliato',
        h('small', {}, res.right ? (res.hello ? 'Non lo vedrai più' : ' ') : `+${latest.penaltyMs / 1000} secondi`));
      verdict.hidden = false;
      answers.hidden = true;
      setTimeout(() => { holding = false; draw(latest); }, FEEDBACK_MS);
    });
  }

  function draw(s) {
    const me = s.you;
    verdict.hidden = true;
    count.textContent = `${Math.min(me.step + 1, s.quizLength)} di ${s.quizLength}`;
    errs.textContent = me.errors ? errorsText(me.errors) : '';
    if (me.doneMs !== null) {
      stage.hidden = true;
      dock.hidden = true;
      done.hidden = false;
      const others = s.players.filter((p) => p.racing && p.doneMs === null && p.online).length;
      fill(done,
        h('p', { class: 'shout shout--small' }, 'Finito!'),
        h('p', { class: 'sum' }, `${clock(me.doneMs)}${me.errors ? ` + ${errorsText(me.errors)}` : ', nessun errore'}`),
        h('p', { class: 'note' }, others ? `Aspettiamo gli altri: ne mancano ${others}. Guarda la TV.` : 'Guarda la TV.'));
      el.querySelector('.meet__stop')?.removeAttribute('hidden');
      return;
    }
    if (me.step !== drawnStep && me.current) {
      drawnStep = me.step;
      fill(stage, person(me.current.t, me.current.o, { 'aria-label': 'La persona che hai davanti' }), h('p', { class: 'bubble' }, 'Ciao! Ti ricordi di me?'));
      stage.firstChild.classList.add('is-new');
    }
    answers.hidden = false;
    lock(false);
  }

  return {
    el,
    update(s) {
      latest = s;
      const me = s.you;
      base = performance.now() - (s.elapsedMs ?? 0);
      if (me.doneMs !== null) watch.textContent = clock(me.doneMs);
      if (!holding) draw(s);
    },
    destroy: () => clearInterval(tick),
  };
}

// ---------- Fine turno ----------

function reveal(state, { act }) {
  const body = h('div', { class: 'wait-body' });
  const list = h('ol', { class: 'recap' });
  const mine = h('section', { class: 'block' }, h('h2', { class: 'heading' }, 'Le tue risposte'), list);
  const el = page('wait', body, mine, state.you.isAdmin && h('div', { class: 'dock' },
    h('button', { class: 'btn btn--red btn--wide', onClick: () => act('startRound') }, 'Fate entrare nuovi ospiti'),
    h('button', { class: 'btn btn--ghost btn--wide', onClick: () => act('endGame') }, 'Fine partita')));
  return {
    el,
    update(s) {
      const me = s.players.find((p) => p.id === s.you.id);
      const r = me?.result;
      fill(body, r
        ? [
          h('h1', { class: 'shout' }, r.place === 1 ? 'Primo posto!' : `${r.place}° posto`),
          h('p', { class: 'sum' }, `+${r.points} punti`),
          h('p', { class: 'note' }, r.errors
            ? `Tempo ${clock(r.timeMs)} e ${errorsText(r.errors)}: totale ${clock(r.totalMs)}.`
            : `Tempo ${clock(r.timeMs)} e nessun errore.`),
          h('p', { class: 'note' }, `${me.total} punti in tutto. ${s.you.isAdmin ? '' : 'Tra poco arrivano altri ospiti.'}`),
        ]
        : [h('h1', { class: 'shout shout--small' }, 'Non hai giocato questo turno'), h('p', { class: 'note' }, `${me?.total ?? 0} punti in tutto.`)]);
      mine.hidden = !s.you.answers.length;
      fill(list, s.you.answers.map((a) => h('li', { class: 'recap__row' },
        person(a.t, a.o),
        h('span', {},
          h('span', { class: 'recap__name' }, a.name), a.stranger && h('span', { class: 'recap__new' }, ' sconosciuto'), h('br'),
          h('span', { class: 'recap__said' }, !a.answered ? 'Non hai fatto in tempo' : a.said ? `Hai detto: ${a.said}` : 'Hai detto: non ti conosco')),
        h('span', { class: a.right ? 'recap__ok' : 'recap__ko', 'aria-label': a.right ? 'giusto' : 'sbagliato' }, a.right ? '✓' : '✕'))));
    },
  };
}
