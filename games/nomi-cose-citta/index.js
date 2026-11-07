// Collega le regole di "Nomi, cose e città" alla console.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Game, GameError, MAX_PLAYERS } from './game.js';

const here = dirname(fileURLToPath(import.meta.url));

const PHASES = {
  lobby: 'in attesa dei giocatori',
  spinning: 'la ruota sta girando',
  writing: 'si scrive',
  review: 'correzione',
  scored: 'punti del turno',
  final: 'partita finita',
};

function start(nsp, { joinUrl, onStatus }) {
  let pending = false;
  let lastStatus = '';

  const status = () => {
    const players = game.players.size;
    const who = players === 1 ? '1 giocatore' : `${players} giocatori`;
    const turn = game.round > 0 ? `turno ${game.round}, ` : '';
    return `${turn}${PHASES[game.phase]}, ${who}`;
  };

  const game = new Game({
    onChange() {
      if (pending) return;
      pending = true;
      setImmediate(() => {
        pending = false;
        for (const socket of nsp.sockets.values()) sendState(socket);
        const next = status();
        if (next !== lastStatus) {
          lastStatus = next;
          onStatus();
        }
      });
    },
  });

  function sendState(socket) {
    const { role, player } = socket.data;
    if (role) socket.emit('state', { ...game.view({ role, player }), joinUrl });
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
    saveWord: (p, a) => game.saveWord(p, a.index, a.word),
    setDone: (p, a) => game.setDone(p, a.done),
    setSettings: (p, a) => game.setSettings(p, { categories: a.categories, durationSec: a.durationSec }),
    startRound: (p) => game.startRound(p),
    stopWriting: (p) => game.stopWriting(p),
    setScore: (p, a) => game.setScore(p, a.playerId, a.index, a.score),
    setFocus: (p, a) => game.setFocus(p, a.playerId),
    confirmRound: (p) => game.confirmRound(p),
    reopenRound: (p) => game.reopenRound(p),
    endGame: (p) => game.endGame(p),
    newGame: (p) => game.newGame(p),
    claimAdmin: (p) => { game.claimAdmin(p); game.changed(); },
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
      action(player, msg);
    }));

    socket.on('leave', (_msg, ack) => reply(ack, () => {
      const { player } = socket.data;
      socket.data = {};
      if (player) game.leave(player);
    }));

    socket.on('disconnect', () => detach(socket));
  }

  nsp.on('connection', onConnection);
  lastStatus = status();

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

export default {
  id: 'nomi-cose-citta',
  title: 'Nomi, cose e città',
  description: `La ruota sceglie la lettera, tutti scrivono 5 parole a tempo e l'amministratore corregge sulla TV. Fino a ${MAX_PLAYERS} giocatori.`,
  page: join(here, 'public', 'index.html'),
  publicDir: join(here, 'public'),
  start,
};
