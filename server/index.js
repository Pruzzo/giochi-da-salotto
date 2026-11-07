import express from 'express';
import { createServer } from 'node:http';
import { networkInterfaces } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';
import { Server } from 'socket.io';
import { Game, GameError } from './game.js';

const PORT = Number(process.env.PORT) || 3000;
const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

/** Indirizzo che i telefoni possono raggiungere: preferisce il Wi-Fi di casa a Docker e VPN. */
function lanAddress() {
  const rank = (ip) => (ip.startsWith('192.168.') ? 0 : ip.startsWith('10.') ? 1 : /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ? 3 : 2);
  const candidates = Object.entries(networkInterfaces())
    .filter(([name]) => !/^(docker|br-|veth|tailscale|lo)/.test(name))
    .flatMap(([, addrs]) => addrs ?? [])
    .filter((a) => a.family === 'IPv4' && !a.internal)
    .map((a) => a.address)
    .sort((a, b) => rank(a) - rank(b));
  return candidates[0] ?? 'localhost';
}

const joinUrl = process.env.PUBLIC_URL || `http://${lanAddress()}:${PORT}`;
const qrSvg = await QRCode.toString(joinUrl, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#16307f', light: '#0000' } });

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static(root, { extensions: ['html'] }));
app.get('/qr.svg', (_req, res) => res.type('image/svg+xml').send(qrSvg));
app.get('/tv', (_req, res) => res.sendFile(join(root, 'index.html')));

let pending = false;
const game = new Game({
  onChange() {
    if (pending) return;
    pending = true;
    setImmediate(() => {
      pending = false;
      for (const socket of io.sockets.sockets.values()) sendState(socket);
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
    if (removed) for (const s of io.sockets.sockets.values()) {
      if (s.data.player === removed) { s.data = {}; s.emit('kicked'); }
    }
  },
};

function detach(socket) {
  const { player } = socket.data;
  socket.data = {};
  if (player) game.disconnect(player);
}

io.on('connection', (socket) => {
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
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\nNomi, cose e città è pronto.\n  Telefoni: ${joinUrl}\n  TV:       ${joinUrl}/tv\n`);
});
