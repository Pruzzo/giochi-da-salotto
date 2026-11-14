import { h, fill } from './kit/dom.js';
import { art } from './kit/art.js';
import { tally } from './kit/stars.js';

const socket = io('/');
const $ = (id) => document.getElementById(id);
const shelf = $('shelf');
const lead = $('lead');
const table = $('table');
const dock = $('dock');
const errorEl = $('error');
const tallyEl = $('tally');
const looksEl = $('looks');
const STYLE_KEY = 'salotto-style';

/** Lo stile scelto vale anche per la console stessa, come per TV e telefoni. */
function applyStyle(style) {
  if (!style) return;
  document.documentElement.dataset.style = style;
  try { localStorage.setItem(STYLE_KEY, style); } catch { /* storage bloccato */ }
}
try { applyStyle(localStorage.getItem(STYLE_KEY) ?? 'kraft'); } catch { /* storage bloccato */ }

let view = null;
let picked = null; // il gioco toccato sullo scaffale, in attesa di conferma nel dock
let closing = false; // si sta chiedendo conferma per chiudere la partita

const send = (event, payload) => {
  errorEl.hidden = true;
  socket.emit(event, payload, (res) => {
    if (res?.ok) return;
    errorEl.textContent = res?.error ?? 'Non ha funzionato. Riprova.';
    errorEl.hidden = false;
  });
};

const button = (cls, text, onClick) => h('button', { class: `pen-btn ${cls}`, type: 'button', onClick }, text);
const capital = (text) => text.charAt(0).toUpperCase() + text.slice(1);
const active = () => view.games.find((g) => g.id === view.activeId) ?? null;

// ---------- Sul tavolo: il gioco acceso ----------

function drawTable() {
  const game = active();
  table.hidden = !game;
  if (!game) return;
  const actions = closing
    ? [
      h('p', { class: 'table__warn' }, 'I punti di questa partita si perdono. Le vittorie della serata restano.'),
      button('pen-btn--red', 'Chiudi la partita', () => { closing = false; send('close'); }),
      button('', 'Continua a giocare', () => { closing = false; drawTable(); }),
    ]
    : [
      h('a', { class: 'pen-btn pen-btn--ink', href: '/' }, 'Entra a giocare'),
      button('', 'Chiudi la partita', () => { closing = true; drawTable(); }),
    ];
  fill(table,
    art(game.id, 'table__art'),
    h('div', { class: 'table__body' },
      h('h2', { class: 'table__title', id: 'table-title' }, game.title),
      h('p', { class: 'table__status' }, capital(game.status ?? ''))),
    h('p', { class: 'stamp table__stamp' }, 'In corso'),
    h('div', { class: 'table__actions' }, actions));
}

// ---------- Lo scaffale ----------

function card(game) {
  const on = game.id === picked;
  return h('li', {},
    h('button', {
      class: 'game', type: 'button', 'aria-pressed': String(on), 'data-game': game.id,
      onClick: () => pick(game.id === picked ? null : game.id),
    },
    art(game.id, 'game__art'),
    h('span', { class: 'game__title' }, game.title),
    h('span', { class: 'game__tagline' }, game.tagline),
    h('span', { class: 'game__more' }, h('span', { class: 'game__desc' }, game.description)),
    h('span', { class: 'game__meta' }, game.meta.map((m) => h('span', {}, m))),
    h('span', { class: 'stamp game__stamp', 'aria-hidden': 'true' }, 'Scelto')));
}

/** Toccare una scatola la sceglie soltanto: si parte dal dock, così non si accende un gioco per sbaglio. */
function pick(id) {
  picked = id;
  for (const b of shelf.querySelectorAll('.game')) {
    const on = b.dataset.game === id;
    b.setAttribute('aria-pressed', String(on));
    b.classList.toggle('is-fresh', on); // il timbro si stampa solo al tocco, non a ogni ridisegno
  }
  drawDock();
}

function drawDock() {
  const game = view.games.find((g) => g.id === picked);
  dock.hidden = !game;
  if (!game) return;
  const now = active();
  fill(dock,
    now && h('p', { class: 'confirm__warn' }, `La partita a ${now.title} finisce qui. Chi è dentro passa al nuovo gioco.`),
    button(now ? 'pen-btn--red' : 'pen-btn--ink', now ? `Passa a ${game.title}` : `Gioca a ${game.title}`, (e) => {
      e.currentTarget.disabled = true;
      send(now ? 'switch' : 'select', game.id);
    }));
}

// ---------- Aspetto ----------

function looks() {
  return view.styles.map((style) => h('button', {
    class: `look look--${style.id}`, type: 'button', 'aria-pressed': String(style.id === view.style), title: style.description,
    onClick: () => { if (style.id !== view.style) send('style', style.id); },
  }, h('span', { class: 'look__swatch', 'aria-hidden': 'true' }), h('span', { class: 'look__name' }, style.title)));
}

function draw() {
  if (!view) return;
  applyStyle(view.style);
  if (picked === view.activeId) picked = null;
  if (!view.activeId) closing = false;
  drawTable();
  lead.textContent = view.activeId ? 'Cambiare gioco?' : 'Cosa si gioca stasera?';
  fill(shelf, view.games.filter((g) => g.id !== view.activeId).map(card));
  drawDock();
  fill(looksEl, looks());
  tallyEl.hidden = !view.session?.players.length;
  if (!tallyEl.hidden) fill(tallyEl, tally(view.session));
  const host = view.joinUrl;
  for (const [id, path, url] of [['tv-link', '/tv', `${host}/tv`], ['phone-link', '/', host]]) {
    const a = $(id);
    a.href = path; // relativo: funziona anche dove il nome locale non si risolve
    a.textContent = url.replace(/^https?:\/\//, '');
  }
}

socket.on('platform', (next) => {
  view = next;
  draw();
});
socket.on('disconnect', () => {
  errorEl.textContent = 'Connessione persa. Riprovo…';
  errorEl.hidden = false;
});
socket.on('connect', () => { errorEl.hidden = true; });
