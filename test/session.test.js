import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Game } from '../games/codice-segreto/game.js';
import { openRoom } from '../games/shared/room.js';
import { Session } from '../server/session.js';

const flush = () => new Promise(setImmediate);

test('vince chi ha più punti, a pari merito vincono tutti', () => {
  const session = new Session();
  session.record([{ name: 'Anna', total: 10 }, { name: 'Bruno', total: 4 }]);
  session.record([{ name: 'Anna', total: 2 }, { name: 'Bruno', total: 7 }, { name: 'Carla', total: 7 }]);
  assert.deepEqual(session.view().players, [
    { name: 'Anna', wins: 1, last: false },
    { name: 'Bruno', wins: 1, last: true },
    { name: 'Carla', wins: 1, last: true },
  ]);
});

test('da soli o senza punti non vince nessuno', () => {
  const session = new Session();
  assert.deepEqual(session.record([{ name: 'Anna', total: 12 }]), []);
  assert.deepEqual(session.record([{ name: 'Anna', total: 0 }, { name: 'Bruno', total: 0 }]), []);
  assert.deepEqual(session.view().players, []);
});

test('lo stesso nome con accenti e maiuscole diversi è la stessa persona', () => {
  const session = new Session();
  session.record([{ name: 'Nicolò', total: 5 }, { name: 'Bruno', total: 1 }]);
  session.record([{ name: 'nicolo ', total: 5 }, { name: 'Bruno', total: 1 }]);
  assert.equal(session.winsOf('NICOLÒ'), 2);
  assert.deepEqual(session.view().players.map((p) => p.wins), [2]);
});

test('la classifica parte dal più vincente', () => {
  const session = new Session();
  session.record([{ name: 'Anna', total: 5 }, { name: 'Bruno', total: 1 }]);
  session.record([{ name: 'Anna', total: 1 }, { name: 'Bruno', total: 5 }]);
  session.record([{ name: 'Anna', total: 1 }, { name: 'Bruno', total: 5 }]);
  assert.deepEqual(session.view().players.map((p) => [p.name, p.wins]), [['Bruno', 2], ['Anna', 1]]);
});

/** Un namespace finto con una TV collegata, per vedere cosa riceve. */
function room(session) {
  const tv = { data: { role: 'tv' }, sent: null, emit(_ev, state) { this.sent = state; } };
  const nsp = { sockets: new Map([['tv', tv]]), on() {}, off() {}, disconnectSockets() {} };
  const game = new Game();
  const [anna, bruno] = ['Anna', 'Bruno'].map((name, i) => {
    const p = game.join({ name, admin: i === 0 });
    game.connect(p);
    return p;
  });
  const handle = openRoom(nsp, { game, actions: {}, status: () => '', joinUrl: 'http://x', onStatus() {}, session });
  /** Una partita di un turno finita con questi punti. */
  const play = async (a, b) => {
    if (game.phase === 'final') {
      game.newGame(anna);
      await flush();
    }
    game.round += 1;
    game.code = [1, 2, 3, 4];
    game.history.set(game.round, new Map([[anna.id, a], [bruno.id, b]]));
    game.phase = 'reveal';
    game.endGame(anna);
    await flush();
  };
  return { game, anna, bruno, tv, play, handle };
}

test('la fine di una partita assegna la vittoria una volta sola', async () => {
  let changes = 0;
  const session = new Session({ onChange: () => { changes += 1; } });
  const { game, anna, tv, play } = room(session);
  await play(9, 3);
  assert.equal(session.winsOf('Anna'), 1);
  assert.equal(changes, 1);
  const shown = tv.sent.players.find((p) => p.name === 'Anna');
  assert.deepEqual([shown.wins, shown.wonNow], [1, true]);
  assert.equal(tv.sent.players.find((p) => p.name === 'Bruno').wonNow, false);
  assert.deepEqual(tv.sent.session.players, [{ name: 'Anna', wins: 1, last: true }]);

  // Altri aggiornamenti sulla schermata finale non contano di nuovo.
  game.changed();
  await flush();
  assert.equal(session.winsOf('Anna'), 1);

  // Nuova partita: la stellina nuova sparisce, quella vinta resta.
  game.newGame(anna);
  await flush();
  assert.equal(tv.sent.players.find((p) => p.name === 'Anna').wonNow, false);
  assert.equal(tv.sent.players.find((p) => p.name === 'Anna').wins, 1);
});

test('le vittorie restano cambiando gioco', async () => {
  const session = new Session();
  const first = room(session);
  await first.play(9, 3);
  first.handle.destroy();
  const second = room(session);
  await second.play(1, 4);
  await second.play(8, 2);
  assert.deepEqual(session.view().players.map((p) => [p.name, p.wins]), [['Anna', 2], ['Bruno', 1]]);
});
