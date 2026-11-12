import { fill } from './kit/dom.js';
import { tally } from './kit/stars.js';

const socket = io('/');
const shelf = document.getElementById('shelf');
const say = document.getElementById('say');
const where = document.getElementById('where');
const errorEl = document.getElementById('error');
const tallyEl = document.getElementById('tally');
const looksEl = document.getElementById('looks');
const STYLE_KEY = 'salotto-style';

/** Lo stile scelto vale anche per la console stessa, come per TV e telefoni. */
function applyStyle(style) {
  if (!style) return;
  document.documentElement.dataset.style = style;
  try { localStorage.setItem(STYLE_KEY, style); } catch { /* storage bloccato */ }
}
try { applyStyle(localStorage.getItem(STYLE_KEY) ?? 'kraft'); } catch { /* storage bloccato */ }
let view = null;
let confirming = false;

const el = (tag, cls, text) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
};

const send = (event, payload) => {
  errorEl.hidden = true;
  socket.emit(event, payload, (res) => {
    if (res?.ok) return;
    errorEl.textContent = res?.error ?? 'Qualcosa è andato storto. Riprova.';
    errorEl.hidden = false;
  });
};

const button = (cls, text, onClick) => {
  const b = el('button', `pen-btn ${cls}`, text);
  b.type = 'button';
  b.addEventListener('click', onClick);
  return b;
};

function slot(game) {
  const on = game.id === view.activeId;
  const item = el('li', `slot${on ? ' slot--on' : ''}`);
  const cover = el('div', 'slot__cover');
  cover.append(el('span', 'slot__label', game.title));
  const body = el('div', 'slot__body');
  body.append(el('h2', 'slot__title', game.title), el('p', 'slot__desc', game.description));
  const actions = el('div', 'slot__actions');
  if (on) {
    body.append(el('p', 'slot__status', `Acceso: ${game.status}`));
    if (confirming) {
      actions.append(
        el('p', 'slot__warn', 'La partita in corso verrà cancellata.'),
        button('pen-btn--red', 'Chiudi e cancella la partita', () => { confirming = false; send('close'); }),
        button('', 'Annulla', () => { confirming = false; draw(); }),
      );
    } else {
      actions.append(button('', 'Chiudi il gioco', () => { confirming = true; draw(); }));
    }
  } else {
    const play = button('pen-btn--ink', 'Accendi questo gioco', () => send('select', game.id));
    play.disabled = !!view.activeId;
    actions.append(play);
  }
  body.append(actions);
  item.append(cover, body);
  return item;
}

function looks() {
  return view.styles.map((style) => {
    const b = el('button', `look look--${style.id}`);
    b.type = 'button';
    b.setAttribute('aria-pressed', String(style.id === view.style));
    b.append(el('span', 'look__name', style.title), el('span', 'look__desc', style.description));
    b.addEventListener('click', () => { if (style.id !== view.style) send('style', style.id); });
    return b;
  });
}

function draw() {
  if (!view) return;
  applyStyle(view.style);
  looksEl.replaceChildren(...looks());
  say.textContent = view.activeId
    ? 'Tutti vedono questo gioco all’indirizzo principale.'
    : 'Scegli il gioco: comparirà a tutti all’indirizzo principale.';
  shelf.replaceChildren(...view.games.map(slot));
  fill(tallyEl, tally(view.session));
  where.hidden = !view.activeId;
  const host = view.joinUrl;
  for (const [id, path, url] of [['tv-link', '/tv', `${host}/tv`], ['phone-link', '/', host]]) {
    const a = document.getElementById(id);
    a.href = path; // relativo: funziona anche dove il nome locale non si risolve
    a.textContent = url.replace(/^https?:\/\//, '');
  }
}

socket.on('platform', (next) => {
  view = next;
  if (!view.activeId) confirming = false;
  draw();
});
socket.on('disconnect', () => {
  errorEl.textContent = 'Connessione persa, riprovo…';
  errorEl.hidden = false;
});
socket.on('connect', () => { errorEl.hidden = true; });
