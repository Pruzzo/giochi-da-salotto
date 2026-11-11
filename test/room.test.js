import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Game } from '../games/codice-segreto/game.js';
import { openRoom } from '../games/shared/room.js';

const flush = () => new Promise(setImmediate);

/** Una stanza con un namespace finto: i telefoni sono socket finti che mandano eventi e leggono le risposte. */
function setup() {
  let connect = null;
  const sockets = new Map();
  const nsp = {
    name: '/codice-segreto', sockets,
    on(_ev, fn) { connect = fn; }, off() {}, disconnectSockets() {},
  };
  const switched = [];
  const platform = {
    list: () => [{ id: 'codice-segreto', title: 'Codice segreto' }, { id: 'impiccato', title: "L'impiccato" }],
    switchTo: (id) => switched.push(id),
  };
  const game = new Game();
  openRoom(nsp, { game, actions: {}, status: () => '', joinUrl: 'http://x', onStatus() {}, platform });

  const phone = (hello) => {
    const handlers = {};
    const socket = { id: String(sockets.size), sent: null, on(ev, fn) { handlers[ev] = fn; }, emit(_ev, state) { this.sent = state; } };
    sockets.set(socket.id, socket);
    connect(socket);
    const call = (ev, msg) => new Promise((resolve) => handlers[ev](msg, resolve));
    return { socket, ready: call('hello', hello), act: (type, extra = {}) => call('act', { type, ...extra }) };
  };
  return { game, phone, switched };
}

test('ogni telefono riceve gli altri giochi, non quello acceso', async () => {
  const { phone } = setup();
  const anna = phone({ role: 'player', name: 'Anna', admin: true });
  await anna.ready;
  await flush();
  assert.deepEqual(anna.socket.sent.games, [{ id: 'impiccato', title: "L'impiccato" }]);
});

test("l'amministratore cambia gioco dalla sala d'attesa", async () => {
  const { phone, switched } = setup();
  const anna = phone({ role: 'player', name: 'Anna', admin: true });
  await anna.ready;
  assert.equal((await anna.act('switchGame', { gameId: 'impiccato' })).ok, true);
  assert.deepEqual(switched, []); // il cambio parte dopo la risposta
  await flush();
  assert.deepEqual(switched, ['impiccato']);
});

test('solo l\'amministratore, solo verso un altro gioco, mai a metà turno', async () => {
  const { game, phone, switched } = setup();
  const anna = phone({ role: 'player', name: 'Anna', admin: true });
  const bruno = phone({ role: 'player', name: 'Bruno' });
  await anna.ready;
  await bruno.ready;
  assert.match((await bruno.act('switchGame', { gameId: 'impiccato' })).error, /Solo l'amministratore/);
  assert.equal((await anna.act('switchGame', { gameId: 'codice-segreto' })).ok, false);
  assert.equal((await anna.act('switchGame', { gameId: 'zzz' })).ok, false);
  game.code = [1, 2, 3, 4];
  game.phase = 'playing';
  assert.equal((await anna.act('switchGame', { gameId: 'impiccato' })).ok, false);
  game.phase = 'final';
  assert.equal((await anna.act('switchGame', { gameId: 'impiccato' })).ok, true);
  await flush();
  assert.deepEqual(switched, ['impiccato']);
});
