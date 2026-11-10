// La parte di ogni gioco che parla col server: ingresso, riconnessione col token, voltapagina tra le fasi.
import { fill } from './dom.js';
import { unlockAudio } from './audio.js';

/**
 * @param namespace  '/<id del gioco>'
 * @param storage    prefisso delle chiavi in localStorage
 * @param views      { join(ctx), phone(state, ctx), tv(state, ctx) }
 */
export function startClient({ namespace, storage, views }) {
  const socket = io(namespace, { reconnectionDelayMax: 2000 });
  const app = document.getElementById('app');
  const toastEl = document.getElementById('toast');
  const TOKEN = `${storage}-token`;
  const ROLE = `${storage}-role`;

  const store = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch { /* storage bloccato */ } },
    del(key) { try { localStorage.removeItem(key); } catch { /* storage bloccato */ } },
  };

  // Chi eri nell'ultimo gioco, per rientrare da solo quando l'amministratore cambia gioco.
  const ME = 'salotto-me';
  const carried = takeCarry(namespace.slice(1));
  if (carried) { store.del(TOKEN); store.del(ROLE); }

  let session = location.pathname === '/tv' || store.get(ROLE) === 'tv'
    ? { role: 'tv' }
    : store.get(TOKEN) ? { role: 'player', token: store.get(TOKEN) } : null;

  function takeCarry(id) {
    let to = null;
    try { to = sessionStorage.getItem('salotto-carry'); sessionStorage.removeItem('salotto-carry'); } catch { /* storage bloccato */ }
    if (to !== id) return null;
    try { return JSON.parse(store.get(ME)); } catch { return null; }
  }

  let view = null;
  let viewKey = null;
  let state = null;

  let toastTimer = 0;
  function toast(message) {
    toastEl.textContent = message;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.hidden = true; }, 4000);
  }

  /** Manda un'azione; `done(res)` riceve la risposta, gli errori finiscono comunque nel toast. */
  function act(type, payload = {}, done) {
    socket.emit('act', { type, ...payload }, (res) => {
      if (res && !res.ok) toast(res.error);
      done?.(res);
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

  const ctx = { act, leave, toast };

  function render() {
    if (!session) {
      if (viewKey !== 'join') mount(views.join({ onEnter: enter }), 'join');
      return;
    }
    if (!state) return;
    document.body.dataset.role = state.role;
    const key = state.role === 'tv'
      ? `tv:${state.phase}:${state.round}`
      : `p:${state.phase}:${state.round}:${state.you?.isAdmin ? 'a' : 'g'}`;
    if (key !== viewKey) mount((state.role === 'tv' ? views.tv : views.phone)(state, ctx), key);
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
    store.del(TOKEN);
    store.del(ROLE);
    render();
  }

  function leave() {
    socket.emit('leave', null, () => forget());
  }

  function enter(request, done) {
    unlockAudio();
    socket.emit('hello', request, (res) => {
      if (!res?.ok) { done(res?.error ?? 'Non riesco a entrare. Riprova.'); return; }
      if (res.role === 'tv') {
        session = { role: 'tv' };
        store.set(ROLE, 'tv');
      } else {
        session = { role: 'player', token: res.token };
        store.set(TOKEN, res.token);
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
    store.set(ME, JSON.stringify(next.role === 'tv' ? { role: 'tv' } : { role: 'player', name: next.you.name, admin: next.you.isAdmin }));
    render();
  });
  socket.on('kicked', () => {
    forget();
    toast("L'amministratore ti ha tolto dalla partita.");
  });

  addEventListener('pointerdown', unlockAudio, { passive: true });
  render();
  if (carried && !session) {
    enter(carried.role === 'tv' ? { role: 'tv' } : { role: 'player', name: carried.name, admin: !!carried.admin }, (error) => {
      if (error) toast(`Non sono riuscito a farti rientrare: ${error}`);
    });
  }
}
