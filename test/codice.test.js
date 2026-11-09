import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FIRST_BONUS, Game, GameError, MAX_ATTEMPTS, pointsFor, score } from '../games/codice-segreto/game.js';

function setup(names = ['Anna', 'Bruno']) {
  const timers = [];
  let clock = 1000;
  const game = new Game({
    random: () => 0,
    now: () => clock,
    setTimer: (fn, ms) => { const t = { fn, ms }; timers.push(t); return t; },
    clearTimer: (t) => { const i = timers.indexOf(t); if (i >= 0) timers.splice(i, 1); },
  });
  const players = names.map((name, i) => {
    const p = game.join({ name, admin: i === 0 });
    game.connect(p);
    return p;
  });
  const fire = () => { const t = timers.shift(); clock += t.ms; t.fn(); };
  return { game, players, fire };
}

test('pallini pieni e vuoti, anche con pastelli ripetuti', () => {
  assert.deepEqual(score([1, 2, 3, 4], [1, 2, 3, 4]), { exact: 4, near: 0 });
  assert.deepEqual(score([1, 2, 3, 4], [4, 3, 2, 1]), { exact: 0, near: 4 });
  assert.deepEqual(score([1, 1, 2, 2], [1, 2, 1, 5]), { exact: 1, near: 2 });
  assert.deepEqual(score([1, 2, 3, 4], [5, 5, 5, 5]), { exact: 0, near: 0 });
  assert.deepEqual(score([1, 2, 2, 3], [2, 2, 2, 2]), { exact: 2, near: 0 });
});

test('senza ripetizioni il codice ha 4 pastelli diversi', () => {
  const { game, players } = setup();
  game.random = Math.random;
  for (let i = 0; i < 50; i += 1) {
    game.phase = 'lobby';
    game.startRound(players[0]);
    assert.equal(new Set(game.code).size, 4);
    assert.ok(game.code.every((c) => c >= 1 && c <= 6));
  }
});

test('turno completo: il codice resta segreto finché non si svela', () => {
  const { game, players: [anna, bruno], fire } = setup();
  game.startRound(anna);
  assert.equal(game.phase, 'hiding');
  fire();
  assert.equal(game.phase, 'playing');
  assert.deepEqual(game.code, [1, 2, 3, 4]); // random() = 0

  game.guess(bruno, [4, 3, 2, 1]);
  const tv = game.view({ role: 'tv' });
  assert.equal(tv.code, null);
  assert.deepEqual(tv.players[1].guesses, [{ exact: 0, near: 4 }]);
  const mine = game.view({ role: 'player', player: bruno });
  assert.deepEqual(mine.you.guesses[0].code, [4, 3, 2, 1]);
  assert.equal(game.view({ role: 'player', player: anna }).players[1].guesses[0].code, undefined);

  game.guess(bruno, [1, 2, 3, 4]);
  assert.equal(game.boards.get(bruno.id).rank, 1);
  assert.throws(() => game.guess(bruno, [1, 2, 3, 4]), GameError);
  game.guess(anna, [1, 2, 3, 4]);
  // Tutti hanno finito: il turno si chiude da solo.
  assert.equal(game.phase, 'reveal');
  const open = game.view({ role: 'tv' });
  assert.deepEqual(open.code, [1, 2, 3, 4]);
  assert.equal(open.players.find((p) => p.id === bruno.id).roundPoints, MAX_ATTEMPTS - 1 + FIRST_BONUS);
  assert.equal(open.players.find((p) => p.id === anna.id).roundPoints, MAX_ATTEMPTS);
});

test('tentativi finiti o tempo scaduto valgono zero', () => {
  const { game, players: [anna, bruno], fire } = setup();
  game.startRound(anna);
  fire();
  for (let i = 0; i < MAX_ATTEMPTS; i += 1) game.guess(bruno, [5, 5, 5, 5]);
  assert.throws(() => game.guess(bruno, [1, 2, 3, 4]), /tentativi/);
  assert.equal(game.phase, 'playing'); // Anna non ha ancora finito
  fire(); // scade il tempo
  assert.equal(game.phase, 'reveal');
  assert.equal(game.totals().get(bruno.id), 0);
  assert.equal(game.totals().get(anna.id), 0);
  assert.equal(pointsFor({ guesses: [{}], rank: 2 }), MAX_ATTEMPTS);
});

test('tentativi non validi e azioni da amministratore', () => {
  const { game, players: [anna, bruno], fire } = setup();
  assert.throws(() => game.startRound(bruno), GameError);
  assert.throws(() => game.setSettings(bruno, { colors: 8 }), GameError);
  game.setSettings(anna, { colors: 8, repeats: true, durationSec: 300 });
  assert.throws(() => game.setSettings(anna, { colors: 7 }), GameError);
  game.startRound(anna);
  fire();
  assert.throws(() => game.guess(bruno, [1, 2, 3]), GameError);
  assert.throws(() => game.guess(bruno, [1, 2, 3, 9]), GameError);
  game.stopRound(anna);
  assert.equal(game.phase, 'reveal');
  game.endGame(anna);
  assert.equal(game.phase, 'final');
  game.newGame(anna);
  assert.equal(game.phase, 'lobby');
  assert.equal(game.totals().get(bruno.id), 0);
});
