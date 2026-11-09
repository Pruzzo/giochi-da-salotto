import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Game, GameError, LETTERS, MAX_ERRORS, pattern, pointsFor, startingLetters } from '../games/impiccato/game.js';
import { WORDS } from '../games/impiccato/words.js';

function setup(names = ['Anna', 'Bruno'], words = ['PALLONE']) {
  const timers = [];
  let clock = 1000;
  const game = new Game({
    random: () => 0,
    now: () => clock,
    setTimer: (fn, ms) => { const t = { fn, ms }; timers.push(t); return t; },
    clearTimer: (t) => { const i = timers.indexOf(t); if (i >= 0) timers.splice(i, 1); },
  });
  game.words = words;
  const players = names.map((name, i) => {
    const p = game.join({ name, admin: i === 0 });
    game.connect(p);
    return p;
  });
  const fire = () => { const t = timers.shift(); clock += t.ms; t.fn(); };
  const tick = (ms) => { clock += ms; };
  return { game, players, fire, tick };
}

test('parole valide: almeno 5 lettere, alfabeto italiano, mai già scoperte del tutto', () => {
  assert.ok(WORDS.length > 200);
  for (const w of WORDS) {
    assert.match(w, /^[A-Z]{5,}$/);
    assert.ok([...w].every((c) => LETTERS.includes(c)), w);
    assert.ok(pattern(w, startingLetters(w)).some((c) => c === null), w);
  }
});

test('si vedono prima e ultima lettera, anche dove si ripetono', () => {
  assert.deepEqual(pattern('PALLONE', startingLetters('PALLONE')), ['P', null, null, null, null, null, 'E']);
  assert.deepEqual(pattern('ANATRA', startingLetters('ANATRA')), ['A', null, 'A', null, null, 'A']);
});

test('turno completo: lettere, errori, tempo e punti', () => {
  const { game, players: [anna, bruno], fire, tick } = setup();
  game.startRound(anna);
  assert.equal(game.phase, 'choosing');
  assert.equal(game.view({ role: 'player', player: bruno }).skeleton, null); // il telefono aspetta la TV
  assert.equal(game.view({ role: 'tv' }).skeleton.length, 7);
  fire();
  assert.equal(game.phase, 'playing');

  tick(30_000); // a metà dei 120 secondi
  assert.deepEqual(game.guessLetter(bruno, 'z'), { hit: false });
  game.guessLetter(bruno, 'A');
  assert.throws(() => game.guessLetter(bruno, 'A'), /già provata/);
  assert.throws(() => game.guessLetter(bruno, 'P'), /già provata/); // la prima lettera si vede già
  assert.deepEqual(game.view({ role: 'player', player: bruno }).you.pattern, ['P', 'A', null, null, null, null, 'E']);
  // Gli altri vedono solo quanti errori ha fatto, non quali lettere.
  const tv = game.view({ role: 'tv' }).players.find((p) => p.id === bruno.id);
  assert.equal(tv.errors, 1);
  assert.equal(tv.wrong, null);
  assert.equal(game.view({ role: 'tv' }).word, null);

  game.guessLetter(bruno, 'L');
  game.guessLetter(bruno, 'O');
  game.guessLetter(bruno, 'N');
  assert.equal(game.boards.get(bruno.id).solvedMs, 30_000);
  assert.throws(() => game.guessLetter(bruno, 'U'), GameError);

  tick(30_000);
  assert.deepEqual(game.guessWord(anna, 'pallone'), { hit: true });
  assert.equal(game.phase, 'reveal');
  const open = game.view({ role: 'tv' });
  assert.equal(open.word, 'PALLONE');
  // Bruno: 10 - 1 errore + 4 di velocità (75% del tempo rimasto). Anna: 10 + 3 (50%).
  assert.equal(open.players.find((p) => p.id === bruno.id).roundPoints, 13);
  assert.equal(open.players.find((p) => p.id === anna.id).roundPoints, 13);
});

test('sei errori e si è impiccati: zero punti', () => {
  const { game, players: [anna, bruno], fire } = setup();
  game.startRound(anna);
  fire();
  for (const c of 'BCDFG') game.guessLetter(bruno, c);
  assert.deepEqual(game.guessWord(bruno, 'PALLINA'), { hit: false });
  assert.equal(game.boards.get(bruno.id).errors, MAX_ERRORS);
  assert.ok(game.boards.get(bruno.id).hanged);
  assert.throws(() => game.guessLetter(bruno, 'A'), /impiccato/);
  fire(); // tempo scaduto
  assert.equal(game.phase, 'reveal');
  assert.equal(game.totals().get(bruno.id), 0);
  assert.equal(pointsFor({ errors: 9, solvedMs: 119_000 }, 120_000), 1);
});

test('parole corte o lunghe e nessuna ripetizione finché ce ne sono', () => {
  const { game, players: [anna], fire } = setup(['Anna'], ['GATTO', 'TELEFONO', 'LIBRO']);
  game.setSettings(anna, { length: 'short' });
  const seen = [];
  for (let i = 0; i < 2; i += 1) {
    game.startRound(anna);
    fire();
    seen.push(game.word);
    game.stopRound(anna);
  }
  assert.deepEqual(seen.sort(), ['GATTO', 'LIBRO']);
  game.startRound(anna); // finite le corte, si ricomincia
  assert.ok(['GATTO', 'LIBRO'].includes(game.word));
  assert.throws(() => game.setSettings(anna, { length: 'media' }), GameError);
});
