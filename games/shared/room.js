// Collega un tavolo (Table) a un namespace Socket.IO: ingresso, riconnessione, azioni, uscita.
// Ogni gioco passa le sue azioni e la frase di stato che compare in console.
import { GameError } from './table.js';

/**
 * @param nsp       namespace del gioco
 * @param game      istanza di una sottoclasse di Table
 * @param actions   { nome: (player, msg) => void } azioni dei giocatori
 * @param status    () => string  stato breve mostrato in console
 * @param session   le vittorie della serata (server/session.js), facoltativo
 * @param platform  { list(), switchTo(id) } la console, per cambiare gioco dalla sala d'attesa; facoltativo
 */
export function openRoom(nsp, { game, actions, status, joinUrl, onStatus, session = null, platform = null }) {
  const gameId = nsp.name?.slice(1);
  let pending = false;
  let lastStatus = status();
  let lastPhase = game.phase;
  let awarded = new Set(); // chi ha appena vinto una stellina, finché resta la schermata finale

  /** Ogni partita che arriva alla fine assegna le vittorie della serata, una volta sola. */
  function trackFinal() {
    if (!session || game.phase === lastPhase) return;
    lastPhase = game.phase;
    if (game.phase !== 'final') {
      awarded = new Set();
      return;
    }
    const totals = game.totals();
    const standings = [...game.players.values()].map((p) => ({ id: p.id, name: p.name, total: totals.get(p.id) ?? 0 }));
    awarded = new Set(session.record(standings).map((w) => w.id));
  }

  // Gli aggiornamenti dello stesso giro di eventi partono una volta sola.
  game.onChange = () => {
    if (pending) return;
    pending = true;
    setImmediate(() => {
      pending = false;
      trackFinal();
      for (const socket of nsp.sockets.values()) sendState(socket);
      const next = status();
      if (next !== lastStatus) {
        lastStatus = next;
        onStatus();
      }
    });
  };

  function sendState(socket) {
    const { role, player } = socket.data;
    if (role) socket.emit('state', withSession(game.view({ role, player })));
  }

  /** Accanto a ogni nome le sue vittorie della serata; a fine partita, chi ne ha appena presa una. */
  function withSession(state) {
    const games = platform ? platform.list().filter((g) => g.id !== gameId) : [];
    if (!session) return { ...state, joinUrl, games };
    return {
      ...state,
      joinUrl,
      games,
      players: state.players.map((p) => ({ ...p, wins: session.winsOf(p.name), wonNow: awarded.has(p.id) })),
      session: session.view(),
    };
  }

  function reply(ack, fn) {
    try {
      ack?.({ ok: true, ...(fn() ?? {}) });
    } catch (error) {
      if (!(error instanceof GameError)) console.error(error);
      ack?.({ ok: false, error: error instanceof GameError ? error.message : 'Qualcosa è andato storto. Riprova.' });
    }
  }

  const ACTIONS = {
    ...actions,
    claimAdmin: (p) => { game.claimAdmin(p); game.changed(); },
    // L'amministratore passa a un altro gioco: in sala d'attesa o a partita finita, mai a metà turno.
    switchGame: (p, a) => {
      game.requireAdmin(p);
      game.requirePhase('lobby', 'final');
      if (!platform?.list().some((g) => g.id === a.gameId && g.id !== gameId)) throw new GameError('Questo gioco non c\'è.');
      // Dopo la risposta: il cambio chiude questa stanza e tutte le sue connessioni.
      setImmediate(() => platform.switchTo(a.gameId));
    },
    removePlayer: (p, a) => {
      const removed = game.removePlayer(p, a.playerId);
      if (removed) for (const s of nsp.sockets.values()) {
        if (s.data.player === removed) { s.data = {}; s.emit('kicked'); }
      }
    },
  };

  function detach(socket) {
    const { player } = socket.data;
    socket.data = {};
    if (player) game.disconnect(player);
  }

  function onConnection(socket) {
    socket.data = {};

    socket.on('hello', (msg, ack) => reply(ack, () => {
      const data = msg ?? {};
      if (data.role === 'tv') {
        detach(socket);
        socket.data = { role: 'tv' };
        sendState(socket);
        return { role: 'tv' };
      }
      const player = game.join({ name: data.name, token: data.token, admin: !!data.admin });
      detach(socket);
      socket.data = { role: 'player', player };
      game.connect(player);
      sendState(socket);
      return { role: 'player', token: player.token };
    }));

    socket.on('act', (msg, ack) => reply(ack, () => {
      const { player } = socket.data;
      const action = ACTIONS[msg?.type];
      if (!player) throw new GameError('Sessione scaduta: rientra nella partita.');
      if (!action) throw new GameError('Azione sconosciuta.');
      // Un'azione può rispondere al telefono con un oggetto (es. { hit: false }).
      const result = action(player, msg);
      return result && typeof result === 'object' ? result : undefined;
    }));

    socket.on('leave', (_msg, ack) => reply(ack, () => {
      const { player } = socket.data;
      socket.data = {};
      if (player) game.leave(player);
    }));

    socket.on('disconnect', () => detach(socket));
  }

  nsp.on('connection', onConnection);

  return {
    status,
    destroy() {
      nsp.off('connection', onConnection);
      game.clearPhaseTimer();
      game.onChange = () => {};
      // false: chiude solo questo namespace. La connessione condivisa serve ad annunciare il cambio di gioco.
      nsp.disconnectSockets(false);
    },
  };
}
