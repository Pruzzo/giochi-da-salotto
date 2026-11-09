import { h, fill } from '/js/kit/dom.js';
import { createTimer } from '/js/kit/timer.js';
import { finalPhone, page, rankOf, rosterItems, waitingNote } from '/js/kit/ui.js';

const clock = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

export function phoneView(state, ctx) {
  const views = { lobby, shuffling, writing, reveal, final: finalPhone };
  return views[state.phase](state, ctx);
}

export function rules(s) {
  return `Parole di almeno ${s.minLen} lettere. Più sono lunghe più valgono, doppio se la trovi solo tu. ${clock(s.durationSec)} a turno.`;
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
    state.you.isAdmin && h('div', { class: 'dock' },
      h('button', { class: 'btn btn--red btn--wide', onClick: () => act('startRound') }, 'Fai estrarre le lettere')));

  return {
    el,
    update(s) {
      const me = s.you.isAdmin;
      status.textContent = waitingNote(s, 'fai estrarre le prime lettere');
      claim.hidden = me || s.adminOnline;
      fill(list, rosterItems(s, act));
      fill(settings, me
        ? h('div', { class: 'block' },
          h('h2', { class: 'heading' }, 'Tempo per turno'),
          h('div', { class: 'choice', role: 'group', 'aria-label': 'Tempo per turno' },
            s.durations.map((d) => h('button', {
              class: 'choice__item', 'aria-pressed': String(d === s.durationSec), onClick: () => act('setSettings', { durationSec: d }),
            }, clock(d)))))
        : h('p', { class: 'note' }, rules(s)));
    },
  };
}

function shuffling() {
  const el = page('center',
    h('div', { class: 'tiles tiles--wait', 'aria-hidden': 'true' }, [...'????'].map((c) => h('span', { class: 'tile' }, c))),
    h('h1', { class: 'shout' }, 'Guarda la TV!'),
    h('p', { class: 'note' }, 'Lo schermo sta estraendo le lettere. Tieni il pollice pronto.'));
  return { el, update() {} };
}

// ---------- Si cercano parole ----------

function writing(state, { act, toast }) {
  const letters = [...state.letters];
  let order = letters.map((_, i) => i); // posizione delle tessere sul telefono, si può rimescolare
  let picked = []; // indici delle tessere usate, in ordine
  let shown = -1;

  const timer = createTimer({ onTick: (sec) => { if (sec <= 5 && sec > 0) navigator.vibrate?.(30); } });
  const tally = h('span', { class: 'tally' });
  const found = h('ul', { class: 'found' });
  const word = h('p', { class: 'compose-word', 'aria-live': 'polite' });
  const tiles = h('div', { class: 'tiles tiles--phone', role: 'group', 'aria-label': 'Lettere' });
  const send = h('button', { class: 'btn btn--ink', onClick: submit }, 'Scrivi');
  const back = h('button', { class: 'btn btn--ghost', onClick: backspace, 'aria-label': 'Cancella l’ultima lettera' }, '⌫');
  const mix = h('button', { class: 'btn btn--ghost', onClick: shuffle }, 'Mescola');
  const doneBtn = h('button', { class: 'btn btn--ghost btn--wide' }, 'Ho finito');
  const stop = state.you.isAdmin && h('button', { class: 'btn btn--ghost btn--wide', onClick: () => act('stopRound') }, 'Ferma il tempo per tutti');
  let done = false;
  doneBtn.addEventListener('click', () => act('setDone', { done: !done }));
  const compose = h('div', { class: 'compose' }, word, tiles, h('div', { class: 'compose-row' }, back, mix, send));

  const el = page('ana-sheet',
    h('header', { class: 'sheet-head' }, tally, timer.el),
    found,
    h('div', { class: 'dock' }, compose, doneBtn, stop));

  function draw() {
    const text = picked.map((i) => letters[i]).join('');
    word.textContent = text || 'Tocca le lettere';
    word.classList.toggle('is-empty', !text);
    fill(tiles, order.map((i) => h('button', {
      class: `tile${picked.includes(i) ? ' is-used' : ''}`,
      disabled: picked.includes(i) || done,
      'aria-label': letters[i],
      onClick: () => { picked.push(i); navigator.vibrate?.(6); draw(); },
    }, letters[i])));
    send.disabled = picked.length < state.minLen || done;
    back.disabled = !picked.length || done;
    mix.disabled = done;
  }

  function backspace() {
    picked.pop();
    draw();
  }

  function shuffle() {
    for (let i = order.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    draw();
  }

  function submit() {
    const text = picked.map((i) => letters[i]).join('');
    if (text.length < state.minLen) return;
    send.disabled = true;
    act('submit', { word: text }, (res) => {
      if (res?.ok) picked = [];
      else {
        word.classList.remove('is-shake');
        void word.offsetWidth; // riparte l'animazione
        word.classList.add('is-shake');
        navigator.vibrate?.([40, 60, 40]);
      }
      draw();
    });
  }

  // Con una tastiera vera (tablet, PC) si può anche scrivere.
  const onKey = (e) => {
    if (done || e.target.closest?.('input')) return;
    if (e.key === 'Enter') { e.preventDefault(); submit(); return; }
    if (e.key === 'Backspace') { e.preventDefault(); backspace(); return; }
    const c = e.key.length === 1 ? e.key.toUpperCase() : '';
    const free = order.find((i) => letters[i] === c && !picked.includes(i));
    if (free !== undefined) { picked.push(free); draw(); }
  };
  addEventListener('keydown', onKey);
  draw();

  return {
    el,
    update(s) {
      timer.sync(s.remainingMs ?? 0, s.durationSec * 1000);
      const words = s.you.words;
      const pts = words.reduce((sum, w) => sum + (s.lengthPoints[Math.min(w.length, 8)] ?? 0), 0);
      tally.textContent = `${words.length} ${words.length === 1 ? 'parola' : 'parole'} · ${pts} punti`;
      if (words.length !== shown) {
        const fresh = words.length > shown && shown >= 0;
        shown = words.length;
        fill(found, words.length
          ? [...words].reverse().map((w, i) => h('li', { class: `found__item${fresh && i === 0 ? ' is-new' : ''}` },
            h('span', { class: 'written' }, w.toUpperCase()),
            h('span', { class: 'found__pts' }, String(s.lengthPoints[Math.min(w.length, 8)]))))
          : h('li', { class: 'note found__empty' }, `Componi una parola di almeno ${s.minLen} lettere con le tessere qui sotto e tocca Scrivi.`));
      }
      done = s.you.done;
      doneBtn.textContent = done ? 'Consegnato. Tocca per riaprire' : 'Ho finito';
      doneBtn.classList.toggle('is-done', done);
      compose.classList.toggle('is-closed', done);
      draw();
    },
    destroy() {
      timer.destroy();
      removeEventListener('keydown', onKey);
    },
  };
}

// ---------- Parole svelate ----------

export function resultRow(r) {
  return h('li', { class: 'found__item' },
    h('span', { class: `written${r.sharedWith.length ? ' is-dup' : ''}` }, r.word.toUpperCase()),
    h('span', { class: 'why' }, r.sharedWith.length ? `anche ${r.sharedWith.join(', ')}` : 'solo tu: doppio'),
    h('span', { class: 'found__pts red' }, `+${r.points}`));
}

function reveal(state, { act }) {
  const body = h('div', { class: 'wait-body' });
  const el = page('wait', body, state.you.isAdmin && h('div', { class: 'dock' },
    h('button', { class: 'btn btn--red btn--wide', onClick: () => act('startRound') }, 'Nuove lettere'),
    h('button', { class: 'btn btn--ghost btn--wide', onClick: () => act('endGame') }, 'Fine partita')));
  return {
    el,
    update(s) {
      const me = s.players.find((p) => p.id === s.you.id);
      const rows = me?.results ?? [];
      fill(body,
        h('p', { class: 'note' }, `Con tutte le lettere: ${s.fullWords.map((w) => w.toUpperCase()).join(', ')}`),
        h('h1', { class: 'shout' }, `${me?.total ?? 0} punti`),
        h('p', { class: 'note' }, `${rankOf(s.players, s.you.id)}° in classifica su ${s.players.length}. ${s.you.isAdmin ? '' : 'Tra poco si riparte.'}`),
        h('p', { class: 'sum' }, `Turno: +${me?.roundPoints ?? 0}`),
        rows.length ? h('ul', { class: 'found found--open' }, rows.map(resultRow)) : h('p', { class: 'note' }, 'Nessuna parola in questo turno.'));
    },
  };
}
