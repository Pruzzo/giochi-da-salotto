import express from 'express';
import { createServer } from 'node:http';
import { networkInterfaces } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';
import { Server } from 'socket.io';
import games from '../games/index.js';
import { announce, LOCAL_NAME } from './mdns.js';
import { Platform, PlatformError } from './platform.js';
import { Session } from './session.js';

const PORT = Number(process.env.PORT) || 3000;
const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

/** Le interfacce di rete, o nessuna dove il sistema non le lascia leggere (Android). */
function interfaces() {
  try {
    return networkInterfaces();
  } catch {
    return {};
  }
}

/** Indirizzo che i telefoni possono raggiungere: preferisce il Wi-Fi di casa a Docker e VPN. */
function lanAddress() {
  const rank = (ip) => (ip.startsWith('192.168.') ? 0 : ip.startsWith('10.') ? 1 : /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ? 3 : 2);
  const candidates = Object.entries(interfaces())
    .filter(([name]) => !/^(docker|br-|veth|tailscale|lo)/.test(name))
    .flatMap(([, addrs]) => addrs ?? [])
    .filter((a) => a.family === 'IPv4' && !a.internal)
    .map((a) => a.address)
    .sort((a, b) => rank(a) - rank(b));
  return candidates[0] ?? 'localhost';
}

// L'indirizzo numerico finisce solo nel QR code, dove non si legge: è l'unico che aprono tutti i telefoni.
// Ovunque si legga un indirizzo c'è il nome locale, e alle pagine il numero non arriva proprio.
const qrUrl = process.env.PUBLIC_URL || `http://${lanAddress()}:${PORT}`;
const { hostname, port: qrPort } = new URL(qrUrl);
const isIp = /^\d+\.\d+\.\d+\.\d+$/.test(hostname);
const joinUrl = isIp ? `http://${LOCAL_NAME}${qrPort ? `:${qrPort}` : ''}` : qrUrl;
const qrSvg = await QRCode.toString(qrUrl, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#16307f', light: '#0000' } });

const app = express();
const server = createServer(app);
const io = new Server(server);

const platformView = () => ({ ...platform.view(), joinUrl, session: session.view() });
const broadcast = () => io.of('/').emit('platform', platformView());

// Le vittorie della serata restano finché il server è acceso, anche cambiando gioco.
const session = new Session({ onChange: broadcast });
const platform = new Platform(games, {
  onChange: broadcast,
  launch: (game) => game.start(io.of(`/${game.id}`), { joinUrl, onStatus: broadcast, session }),
});

// Un gioco spento non accetta connessioni.
for (const game of games) {
  io.of(`/${game.id}`).use((_socket, next) => {
    next(platform.activeId === game.id ? undefined : new Error('Gioco non acceso'));
  });
  app.use(`/games/${game.id}`, express.static(game.publicDir, { index: false }));
}

// L'indirizzo principale e /tv mostrano il gioco acceso, altrimenti la pagina d'attesa.
const sendActive = (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.sendFile(platform.activeGame?.page ?? join(root, 'standby.html'));
};
app.get('/', sendActive);
app.get('/tv', sendActive);
app.get('/console', (_req, res) => res.sendFile(join(root, 'console.html')));
app.get('/qr.svg', (_req, res) => res.type('image/svg+xml').send(qrSvg));
app.use(express.static(root, { index: false }));

io.on('connection', (socket) => {
  socket.emit('platform', platformView());

  const handle = (fn) => (id, ack) => {
    try {
      fn(id);
      ack?.({ ok: true });
    } catch (error) {
      if (!(error instanceof PlatformError)) console.error(error);
      ack?.({ ok: false, error: error instanceof PlatformError ? error.message : 'Qualcosa è andato storto. Riprova.' });
    }
  };
  socket.on('select', handle((id) => platform.select(id)));
  socket.on('close', handle(() => platform.close()));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\nConsole pronta.\n  Scegli il gioco: ${joinUrl}/console\n  Telefoni:        ${joinUrl}\n  TV:              ${joinUrl}/tv\n`);
  if (isIp) announce(hostname);
});
