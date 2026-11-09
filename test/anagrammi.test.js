import assert from 'node:assert/strict';
import { test } from 'node:test';
import { basePoints, fits, Game, GameError, loadDictionary, plain, UNIQUE_FACTOR } from '../games/anagrammi/game.js';

const dictionary = {
  words: new Set(['ladro', 'lardo', 'tarlo', 'dorata', 'orlata', 'lato', 'dato', 'arto', 'oda', 'tra', 'tarli', 'altro']),
  seeds: ['dorlata'],
};

function setup(names = ['Anna', 'Bruno']) {
  const timers = [];
  let clock = 1000;
  const game = new Game({
    random: () => 0,
    now: () => clock,
    setTimer: (fn, ms) => { const t = { fn, ms }; timers.push(t); return t; },
    clearTimer: (t) => { const i = timers.indexOf(t); if (i >= 0) timers.splice(i, 1); },
    dictionary,
  });
  const players = names.map((name, i) => {
    const p = game.join({ name, admin: i === 0 });
    game.connect(p);
    return p;
  });
  const fire = () => { const t = timers.shift(); clock += t.ms; t.fn(); };
  return { game, players, fire };
}

test('il dizionario vero è pulito e le parole di partenza hanno 8 lettere', () => {
  const { words, seeds } = loadDictionary();
  assert.ok(words.size > 50000);
  for (const w of ['cane', 'cani', 'cantava', 'spiagge', 'perche', 'citta', 'andiamo']) assert.ok(words.has(w), w);
  for (const w of ['uesto', 'the', 'http', 'ok', 'usl', 'btp', 'dna', 'blog', 'show']) assert.ok(!words.has(w), w);
  for (const w of ['per', 'tram', 'autobus', 'tzigano']) assert.ok(words.has(w), w);
  assert.ok(seeds.length > 500);
  assert.ok(seeds.every((s) => s.length === 8 && words.has(s)));
});

test('lettere: ognuna si usa una volta sola, accenti e maiuscole non contano', () => {
  assert.ok(fits('ladro', [...'dorlata']));
  assert.ok(!fits('dadi', [...'dorlata']));
  assert.ok(fits('dorata', [...'dorlata'])); // due A disponibili
  assert.ok(!fits('aaa', [...'dorlata']));
  assert.equal(plain(' Città! '), 'citta');
  assert.equal(basePoints('tra'), 1);
  assert.equal(basePoints('dorata'), 5);
});

test('turno completo: parole controllate subito, doppio se unica', () => {
  const { game, players: [anna, bruno], fire } = setup();
  game.startRound(anna);
  assert.equal(game.phase, 'shuffling');
  assert.equal(game.view({ role: 'player', player: bruno }).letters, null);
  assert.equal(game.view({ role: 'tv' }).letters.length, 7);
  assert.notEqual(game.letters.join('').toLowerCase(), 'dorlata');
  fire();
  assert.equal(game.phase, 'writing');

  assert.deepEqual(game.submit(bruno, 'Ladro'), { word: 'ladro', points: 3 });
  assert.throws(() => game.submit(bruno, 'ladro'), /già scritta/);
  assert.throws(() => game.submit(bruno, 'do'), /almeno 3/);
  assert.throws(() => game.submit(bruno, 'dadi'), /lettere che non ci sono/);
  assert.throws(() => game.submit(bruno, 'adorl'), /dizionario/);
  game.submit(bruno, 'dorata');
  game.submit(anna, 'ladro');
  game.submit(anna, 'tra');

  // Gli altri vedono quante parole e la più lunga, non quali.
  const tv = game.view({ role: 'tv' }).players.find((p) => p.id === bruno.id);
  assert.equal(tv.count, 2);
  assert.equal(tv.longest, 6);
  assert.equal(tv.results, null);

  game.setDone(anna, true);
  game.setDone(bruno, true);
  assert.equal(game.phase, 'reveal');
  const open = game.view({ role: 'tv' });
  const b = open.players.find((p) => p.id === bruno.id);
  // ladro in comune (3), dorata solo sua (5 x 2)
  assert.equal(b.roundPoints, 3 + 5 * UNIQUE_FACTOR);
  assert.deepEqual(b.results.find((r) => r.word === 'ladro').sharedWith, ['Anna']);
  assert.equal(open.players.find((p) => p.id === anna.id).roundPoints, 3 + 1 * UNIQUE_FACTOR);
  assert.deepEqual(open.fullWords, []);
  assert.ok(open.missed.includes('orlata'));
  assert.ok(!open.missed.includes('ladro'));
});

test('solo l’amministratore ferma il tempo; si consegna e si riapre', () => {
  const { game, players: [anna, bruno], fire } = setup();
  assert.throws(() => game.startRound(bruno), GameError);
  game.startRound(anna);
  fire();
  game.setDone(bruno, true);
  assert.throws(() => game.submit(bruno, 'tarlo'), /consegnato/);
  game.setDone(bruno, false);
  game.submit(bruno, 'tarlo');
  assert.throws(() => game.stopRound(bruno), GameError);
  game.stopRound(anna);
  assert.equal(game.phase, 'reveal');
  assert.equal(game.totals().get(bruno.id), 3 * UNIQUE_FACTOR);
});
