// Le pagine che ogni gioco della console ha uguali: ingresso, copertina TV, elenco della classe, fine partita.
import { h, fill, icon } from './dom.js';
import { isMuted, toggleMute, unlockAudio } from './audio.js';
import { stars, starsWidth, tally } from './stars.js';

export const rankOf = (players, id) => {
  const me = players.find((p) => p.id === id);
  return me ? players.filter((p) => p.total > me.total).length + 1 : null;
};

export function page(cls, ...kids) {
  return h('main', { class: `page page--phone ${cls}` }, ...kids);
}

/** Suono e schermo intero, nell'angolo della TV. */
export function controls() {
  const sound = h('button', { class: 'corner__btn', title: 'Suono', 'aria-label': 'Attiva o disattiva il suono' });
  const paint = () => fill(sound, icon(isMuted() ? 'mute' : 'sound'));
  paint();
  sound.addEventListener('click', () => { unlockAudio(); toggleMute(); paint(); });
  return h('div', { class: 'corner' }, sound,
    document.documentElement.requestFullscreen && h('button', {
      class: 'corner__btn', title: 'Schermo intero', 'aria-label': 'Schermo intero',
      onClick: () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()),
    }, icon('full')));
}

export function tvPage(cls, ...kids) {
  return h('main', { class: `page page--tv ${cls}` }, ...kids, controls());
}

// ---------- Ingresso dal telefono ----------

/**
 * @param title  righe del titolo in copertina
 * @param hints  { player, admin, tv } cosa fa ciascun ruolo in questo gioco
 */
export function joinView({ title, hints }, { onEnter }) {
  const roles = [
    { id: 'player', label: 'Giocatore', hint: hints.player },
    { id: 'admin', label: 'Amministratore', hint: hints.admin },
    { id: 'tv', label: 'TV', hint: hints.tv },
  ];
  let role = 'player';
  const nameInput = h('input', {
    id: 'name', class: 'field', maxLength: 16, autocomplete: 'nickname', autocapitalize: 'words',
    enterKeyHint: 'go', placeholder: 'Il tuo nome',
  });
  const error = h('p', { class: 'error', role: 'alert', hidden: true });
  const hint = h('p', { class: 'cover__hint' });
  const nameRow = h('label', { class: 'cover__row' }, h('span', { class: 'cover__label' }, 'Nome'), nameInput);
  const submit = h('button', { class: 'btn btn--ink btn--wide', type: 'submit' }, 'Entra');
  const tabs = roles.map((r) => h('button', {
    type: 'button', class: 'tab', 'aria-pressed': 'false',
    onClick: () => choose(r.id),
  }, r.label));

  function choose(next) {
    role = next;
    roles.forEach((r, i) => tabs[i].setAttribute('aria-pressed', String(r.id === next)));
    hint.textContent = roles.find((r) => r.id === next).hint;
    nameRow.hidden = next === 'tv';
    submit.textContent = next === 'tv' ? 'Usa questo schermo come TV' : 'Entra';
    error.hidden = true;
  }
  choose('player');

  const form = h('form', {
    class: 'cover__label-card',
    onSubmit: (e) => {
      e.preventDefault();
      submit.disabled = true;
      const request = role === 'tv' ? { role: 'tv' } : { role: 'player', name: nameInput.value, admin: role === 'admin' };
      onEnter(request, (message) => {
        submit.disabled = false;
        if (message) {
          error.textContent = message;
          error.hidden = false;
        }
      });
    },
  },
  h('h1', { class: 'title' }, title.flatMap((line, i) => (i ? [h('br'), line] : [line]))),
  h('div', { class: 'tabs', role: 'group', 'aria-label': 'Come vuoi partecipare?' }, tabs),
  hint, nameRow, error, submit);

  return { el: h('main', { class: 'cover cover--phone' }, form), update() {} };
}

// ---------- Sala d'attesa ----------

/** Chi è in classe, con il tasto per togliere qualcuno se sei l'amministratore. */
export function rosterItems(s, act) {
  const me = s.you.isAdmin;
  return s.players.map((p) => h('li', { class: `roster__item${p.online ? '' : ' is-away'}` },
    h('span', { class: 'written' }, p.name),
    stars(p.wins),
    p.isAdmin && h('span', { class: 'tag' }, 'amministratore'),
    !p.online && h('span', { class: 'tag' }, 'non connesso'),
    me && p.id !== s.you.id && h('button', { class: 'link', onClick: () => act('removePlayer', { playerId: p.id }), 'aria-label': `Togli ${p.name}` }, 'Togli')));
}

export function waitingNote(s, action) {
  if (s.you.isAdmin) return `Quando ci siete tutti, ${action}.`;
  const admin = s.players.find((p) => p.isAdmin);
  return s.adminOnline ? `In attesa che ${admin?.name} faccia partire il turno.` : 'Manca un amministratore per iniziare.';
}

/**
 * Copertina della TV: etichetta con titolo e firme, QR per entrare.
 * @param subject  { label, text(s) } la riga sotto il titolo (es. le materie)
 * @param cta      (adminName) => frase per quando ci sono tutti
 */
export function coverTv({ title, subject, cta }) {
  const names = h('ol', { class: 'signatures' });
  const what = h('p', { class: 'cover__do' });
  const about = h('p', { class: 'cover__cats' });
  const url = h('span', { class: 'cover__url' });
  const el = h('main', { class: 'cover cover--tv' },
    h('div', { class: 'cover__label-card cover__label-card--tv' },
      h('h1', { class: 'title' }, title),
      h('div', { class: 'label-field' }, h('span', { class: 'label-field__name' }, subject.label), about),
      h('div', { class: 'label-field label-field--grow' }, h('span', { class: 'label-field__name' }, 'Classe'), names),
      what),
    h('aside', { class: 'cover__join' },
      h('img', { class: 'qr', src: '/qr.svg', alt: 'QR code per entrare nella partita' }),
      h('p', { class: 'cover__scan' }, 'Inquadra e scrivi il tuo nome'),
      url),
    controls());
  return {
    el,
    update(s) {
      fill(about, subject.text(s));
      url.textContent = s.joinUrl.replace(/^https?:\/\//, '');
      const longest = Math.max(1, ...s.players.map((p) => p.name.length + starsWidth(p.wins) * 0.7));
      names.style.setProperty('--sig', Math.min(s.players.length > 8 ? 1 : 1.4, 9 / (longest * 0.62)).toFixed(2));
      fill(names, s.players.length
        ? s.players.map((p) => h('li', { class: `signature${p.online ? '' : ' is-away'}` }, p.name, stars(p.wins), p.isAdmin && h('span', { class: 'signature__badge' }, 'amministratore')))
        : h('li', { class: 'signature signature--empty' }, 'Nessuno in classe, per ora'));
      what.textContent = !s.players.length ? 'Inquadra il codice col telefono per entrare.'
        : !s.adminOnline ? 'Serve un amministratore: sceglilo al momento di entrare.'
        : cta(s.players.find((p) => p.isAdmin).name);
    },
  };
}

// ---------- Cambia gioco ----------

/** Solo per l'amministratore: passa a un altro gioco, e tutti ci rientrano da soli. */
export function switchGame(state, act) {
  if (!state.you?.isAdmin || !state.games?.length) return null;
  const open = h('button', { class: 'btn btn--ghost btn--wide', onClick: () => show(true) }, 'Cambia gioco');
  const picker = h('div', { class: 'switch__list', hidden: true },
    h('p', { class: 'note' }, 'Tutti passano al nuovo gioco col loro nome. I punti di questa partita si perdono, le stelline restano.'),
    state.games.map((g) => h('button', {
      class: 'btn btn--ink btn--wide',
      onClick: (e) => { e.currentTarget.disabled = true; act('switchGame', { gameId: g.id }, (res) => { if (!res?.ok) show(false); }); },
    }, g.title)),
    h('button', { class: 'link', onClick: () => show(false) }, 'Annulla'));
  function show(on) {
    open.hidden = on;
    picker.hidden = !on;
    for (const b of picker.querySelectorAll('button')) b.disabled = false;
  }
  return h('section', { class: 'switch' }, open, picker);
}

// ---------- Fine partita ----------

export function finalPhone(state, { act, leave }) {
  const body = h('div');
  let first = true; // la stellina nuova si attacca una volta sola, non a ogni aggiornamento
  const el = page('wait', body,
    h('div', { class: 'dock' },
      state.you.isAdmin
        ? [h('button', { class: 'btn btn--red btn--wide', onClick: () => act('newGame') }, 'Nuova partita'), switchGame(state, act)]
        : h('button', { class: 'btn btn--ghost btn--wide', onClick: leave }, 'Esci dalla partita')));
  return {
    el,
    update(s) {
      const me = s.players.find((p) => p.id === s.you.id);
      const rank = rankOf(s.players, s.you.id);
      fill(body,
        h('h1', { class: 'shout' }, rank === 1 ? 'Hai vinto!' : `${rank}° posto`),
        h('p', { class: 'sum' }, `${me?.total ?? 0} punti`),
        me?.wonNow && h('p', { class: 'prize' }, stars(1, { fresh: first }), 'Una vittoria in più stasera'),
        h('ol', { class: 'own' }, [...s.players].sort((a, b) => b.total - a.total).map((p) => h('li', { class: 'standing' },
          h('span', { class: 'written' }, p.name), h('span', { class: 'red' }, String(p.total))))),
        s.session && h('div', { class: 'final-tally' }, tally(s.session, { fresh: first })));
      first = false;
    },
  };
}

export function finalTv() {
  const list = h('ol', { class: 'pagella' });
  const lead = h('h1', { class: 'winner' });
  const prize = h('p', { class: 'end__prize' });
  const side = h('aside', { class: 'end__tally' });
  const el = tvPage('end', h('div', { class: 'end__main' }, lead, prize, list), side);
  let first = true; // le stelline nuove si attaccano una volta sola, non a ogni aggiornamento
  return {
    el,
    update(s) {
      const won = s.players.filter((p) => p.wonNow);
      prize.hidden = !won.length;
      fill(prize, stars(1), won.length > 1 ? 'Una stellina a testa nelle vittorie della serata' : 'Una stellina in più nelle vittorie della serata');
      side.hidden = !s.session;
      if (s.session) fill(side, tally(s.session, { fresh: first }));
      first = false;
      const sorted = [...s.players].sort((a, b) => b.total - a.total);
      const top = sorted[0]?.total ?? 0;
      const winners = sorted.filter((p) => p.total === top).map((p) => p.name);
      lead.textContent = winners.length > 1 ? `Pari merito: ${winners.join(' e ')}!` : `Ha vinto ${winners[0] ?? ''}!`;
      list.style.setProperty('--n', Math.max(sorted.length, 1));
      fill(list, sorted.map((p, i) => h('li', { class: `pagella__row${p.total === top ? ' is-top' : ''}`, style: { '--i': i } },
        h('span', { class: 'pagella__pos' }, `${sorted.findIndex((q) => q.total === p.total) + 1}°`),
        h('span', { class: 'written' }, p.name),
        h('span', { class: 'red' }, String(p.total)))));
    },
  };
}
