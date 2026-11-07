import { fill } from './dom.js';
import { unlockAudio } from './audio.js';
import { joinView, phoneView } from './phone.js';
import { tvView } from './tv.js';

const socket = io({ reconnectionDelayMax: 2000 });
const app = document.getElementById('app');
const toastEl = document.getElementById('toast');

const store = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* storage bloccato */ } },
  del(key) { try { localStorage.removeItem(key); } catch { /* storage bloccato */ } },
};

let session = location.pathname === '/tv'
  ? { role: 'tv' }
  : store.get('ncc-role') === 'tv'
    ? { role: 'tv' }
    : store.get('ncc-token') ? { role: 'player', token: store.get('ncc-token') } : null;

let view = null;
let viewKey = null;
let state = null;

let toastTimer = 0;
export function toast(message) {
  toastEl.textContent = message;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.hidden = true; }, 4000);
}

function act(type, payload = {}) {
  socket.emit('act', { type, ...payload }, (res) => {
    if (res && !res.ok) toast(res.error);
  });
}

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Ogni cambio di fase è un voltapagina: la pagina vecchia ruota sul dorso e scopre la nuova. */
function mount(next, key) {
  const old = view;
  view = next;
  viewKey = key;
  old?.destroy?.();
  if (old && !reduced()) {
    old.el.classList.add('page-turn');
    old.el.inert = true;
    old.el.addEventListener('animationend', () => old.el.remove(), { once: true });
    setTimeout(() => old.el.remove(), 1200);
    app.prepend(next.el);
  } else {
    fill(app, next.el);
  }
}

function render() {
  if (!session) {
    if (viewKey !== 'join') mount(joinView({ onEnter: enter }), 'join');
    return;
  }
  if (!state) return;
  document.body.dataset.role = state.role;
  const key = state.role === 'tv'
    ? `tv:${state.phase}:${state.round}`
    : `p:${state.phase}:${state.round}:${state.you?.isAdmin ? 'a' : 'g'}`;
  if (key !== viewKey) {
    const factory = state.role === 'tv' ? tvView : phoneView;
    mount(factory(state, { act, leave }), key);
  }
  view.update(state);
}

function hello() {
  if (!session) return;
  socket.emit('hello', session, (res) => {
    if (res?.ok) return;
    // Il token non vale più (partita nuova o server riavviato): si torna all'ingresso.
    forget();
    if (res?.error) toast('La partita è ricominciata: rientra con il tuo nome.');
  });
}

function forget() {
  session = null;
  state = null;
  store.del('ncc-token');
  store.del('ncc-role');
  render();
}

function leave() {
  socket.emit('leave', null, () => forget());
}

/** Dalla schermata d'ingresso: ritorna un eventuale errore da mostrare sul campo. */
function enter(request, done) {
  unlockAudio();
  socket.emit('hello', request, (res) => {
    if (!res?.ok) { done(res?.error ?? 'Non riesco a entrare. Riprova.'); return; }
    if (res.role === 'tv') {
      session = { role: 'tv' };
      store.set('ncc-role', 'tv');
    } else {
      session = { role: 'player', token: res.token };
      store.set('ncc-token', res.token);
    }
    done(null);
  });
}

socket.on('connect', () => {
  document.body.classList.remove('offline');
  hello();
});
socket.on('disconnect', () => document.body.classList.add('offline'));
socket.on('state', (next) => {
  state = next;
  render();
});
socket.on('kicked', () => {
  forget();
  toast("L'amministratore ti ha tolto dalla partita.");
});

addEventListener('pointerdown', unlockAudio, { passive: true });
render();
