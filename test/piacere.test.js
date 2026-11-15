import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  COUNTDOWN_MS, Game, GameError, INTRO_LEAD_MS, INTRO_TAIL_MS, NONE, PENALTY_MS, QUIZ_LIMIT_MS, pointsForPlace, scoreRound,
} from '../games/piacere/game.js';
import { distance, makeRound } from '../games/piacere/public/js/cast.js';

function setup(names = ['Anna', 'Bruno']) {
  const timers = [];
  let clock = 1000;
  let seed = 0.37;
  const game = new Game({
    random: () => { seed = (seed * 9301 + 49297) % 233280 / 233280; return seed; },
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
  const tick = (ms) => { clock += ms; };
  /** Dalla sala d'attesa all'inizio della seconda parte. */
  const toQuiz = () => {
    game.startRound(players[0]);
    while (game.phase !== 'quiz') fire();
  };
  /** La risposta giusta per la persona che `p` ha davanti. */
  const right = (p) => {
    const id = game.cast.quiz[game.sheets.get(p.id).answers.length];
    return game.cast.people[id].stranger ? NONE : id;
  };
  const wrong = (p) => {
    const id = game.cast.quiz[game.sheets.get(p.id).answers.length];
    return game.cast.people[id].stranger ? game.cast.intro[0] : NONE;
  };
  return { game, players, fire, tick, toQuiz, right, wrong, get clock() { return clock; } };
}

test('il turno: stesse persone dallo stesso seme, ben distinte, nomi mai simili', () => {
  for (const level of ['facile', 'normale', 'difficile']) {
    for (let seed = 1; seed < 60; seed += 1) {
      const r = makeRound(seed, { known: 10, strangers: 3, level });
      assert.deepEqual(r, makeRound(seed, { known: 10, strangers: 3, level }));
      assert.equal(r.intro.length, 10);
      assert.equal(r.quiz.length, 13);
      assert.equal(new Set(r.quiz).size, 13);
      const known = r.people.filter((x) => !x.stranger);
      for (const a of known) for (const b of known) if (a !== b) assert.ok(distance(a.t, b.t) >= 3, `${a.name} e ${b.name} troppo simili`);
      const starts = r.people.map((x) => x.name.slice(0, 2));
      assert.equal(new Set(starts).size, starts.length);
      for (const x of r.people) {
        if (level === 'facile') assert.deepEqual(x.second, x.first);
        else assert.notEqual(x.second.top, x.first.top);
        if (level !== 'difficile') assert.equal(x.second.hat, null);
      }
    }
  }
});

test('punti per posizione, con penalità e pari merito', () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7, 8, 12].map(pointsForPlace), [10, 8, 6, 5, 4, 3, 2, 1, 1]);
  const rows = scoreRound([
    { id: 'a', answers: [{ right: true }, { right: true }], doneMs: 20000 },
    { id: 'b', answers: [{ right: true }, { right: false }], doneMs: 12000 }, // 12 + 5 = 17
    { id: 'c', answers: [{ right: true }, { right: true }], doneMs: 17000 }, // pari con b
    { id: 'd', answers: [{ right: true }], doneMs: null }, // tempo scaduto, una senza risposta
    { id: 'e', answers: [], doneMs: null }, // non ha giocato: fuori classifica
  ], 2);
  assert.deepEqual(rows.map((r) => [r.id, r.totalMs, r.place, r.points]), [
    ['b', 17000, 1, 10], ['c', 17000, 1, 10], ['a', 20000, 3, 6], ['d', QUIZ_LIMIT_MS + PENALTY_MS, 4, 5],
  ]);
});

test('prima parte sulla TV: uno alla volta, poi conto alla rovescia e cronometro', () => {
  const { game, players: [anna, bruno], fire } = setup();
  game.setSettings(anna, { known: 4, strangers: 1, paceSec: 3 });
  assert.throws(() => game.setSettings(bruno, { known: 6 }), GameError);
  assert.throws(() => game.setSettings(anna, { known: 5 }), GameError);
  game.startRound(anna);
  assert.equal(game.phase, 'intro');
  let tv = game.view({ role: 'tv' });
  assert.equal(tv.lineup.length, 4);
  assert.equal(tv.introName, null);
  assert.equal(tv.remainingMs, INTRO_LEAD_MS + 4 * 3000 + INTRO_TAIL_MS);
  // I telefoni non vedono la fila.
  assert.equal(game.view({ role: 'player', player: bruno }).lineup, undefined);

  const seen = [];
  for (let i = 0; i < 4; i += 1) {
    fire();
    tv = game.view({ role: 'tv' });
    assert.equal(tv.introIndex, i);
    seen.push(tv.introName);
    assert.ok(!('name' in tv.lineup[i]));
  }
  assert.deepEqual(seen, game.cast.intro.map((id) => game.cast.people[id].name));
  fire();
  assert.equal(game.phase, 'countdown');
  assert.equal(game.view({ role: 'tv' }).remainingMs, COUNTDOWN_MS);
  fire();
  assert.equal(game.phase, 'quiz');
});

test('seconda parte: nessuno sa chi è chi, errori e sconosciuti', () => {
  const { game, players: [anna, bruno], toQuiz, right, wrong, tick } = setup();
  toQuiz();
  const mine = game.view({ role: 'player', player: bruno }).you;
  assert.equal(mine.step, 0);
  assert.ok(mine.current.t && mine.current.o);
  assert.ok(!('name' in mine.current) && !('stranger' in mine.current));
  assert.equal(mine.names.length, game.cast.intro.length);
  assert.deepEqual(mine.names.map((n) => n.name), [...mine.names.map((n) => n.name)].sort());
  assert.equal(game.view({ role: 'tv' }).gallery, undefined);

  assert.throws(() => game.answer(bruno, 999), GameError);
  const first = game.cast.people[game.cast.quiz[0]];
  const res = game.answer(bruno, wrong(bruno));
  assert.equal(res.right, false);
  assert.equal(res.hello, first.stranger ? first.name : null);
  tick(4000);
  while (game.sheets.get(bruno.id).doneMs === null) game.answer(bruno, right(bruno));
  assert.equal(game.sheets.get(bruno.id).doneMs, 4000);
  assert.throws(() => game.answer(bruno, NONE), /già risposto/);
  assert.equal(game.phase, 'quiz'); // Anna sta ancora giocando
  assert.deepEqual(game.view({ role: 'tv' }).players.find((p) => p.id === bruno.id).marks, [false, ...Array(game.quizLength - 1).fill(true)]);

  tick(10000);
  while (game.phase === 'quiz') game.answer(anna, right(anna));
  assert.equal(game.phase, 'reveal');
  const tv = game.view({ role: 'tv' });
  const a = tv.players.find((p) => p.id === anna.id).result;
  const b = tv.players.find((p) => p.id === bruno.id).result;
  assert.deepEqual([a.timeMs, a.errors, a.totalMs, a.place, a.points], [14000, 0, 14000, 2, 8]);
  assert.deepEqual([b.timeMs, b.errors, b.totalMs, b.place, b.points], [4000, 1, 9000, 1, 10]);
  assert.equal(tv.gallery.length, game.quizLength);
  assert.equal(tv.gallery[0].hits, 1);
  const recap = game.view({ role: 'player', player: bruno }).you.answers;
  assert.equal(recap[0].right, false);
  assert.equal(recap[0].answered, true);
  assert.equal(recap[0].said, first.stranger ? game.cast.people[game.cast.intro[0]].name : null);
});

test('tempo scaduto: chi non ha finito prende errori per le persone mancanti', () => {
  const { game, players: [anna, bruno], toQuiz, right, fire } = setup();
  toQuiz();
  game.answer(anna, right(anna));
  fire(); // 3 minuti
  assert.equal(game.phase, 'reveal');
  const rows = game.history.get(1);
  assert.equal(rows.get(anna.id).errors, game.quizLength - 1);
  assert.equal(rows.get(anna.id).totalMs, QUIZ_LIMIT_MS + (game.quizLength - 1) * PENALTY_MS);
  assert.equal(rows.has(bruno.id), false);
  assert.equal(game.totals().get(bruno.id), 0);
});

test('chi arriva a turno iniziato aspetta; chi se ne va non blocca gli altri', () => {
  const { game, players: [anna, bruno], toQuiz, right } = setup(['Anna', 'Bruno']);
  toQuiz();
  const carla = game.join({ name: 'Carla' });
  game.connect(carla);
  assert.equal(game.view({ role: 'player', player: carla }).you.racing, false);
  assert.throws(() => game.answer(carla, NONE), /aspetta il prossimo/);
  while (game.sheets.get(anna.id).doneMs === null) game.answer(anna, right(anna));
  assert.equal(game.phase, 'quiz');
  game.disconnect(bruno); // l'unico rimasto si scollega: il turno si chiude
  assert.equal(game.phase, 'reveal');
  // Il turno dopo gioca anche Carla.
  game.startRound(anna);
  assert.equal(game.sheets.has(carla.id), true);
  assert.equal(game.sheets.has(bruno.id), false);
});

test('più turni sommano i punti; fine partita e partita nuova', () => {
  const { game, players: [anna, bruno], toQuiz, right, wrong, tick } = setup();
  for (let round = 0; round < 2; round += 1) {
    toQuiz();
    while (game.sheets.get(bruno.id).doneMs === null) game.answer(bruno, wrong(bruno));
    tick(1000);
    while (game.phase === 'quiz') game.answer(anna, right(anna));
  }
  assert.equal(game.totals().get(anna.id), 20);
  assert.equal(game.totals().get(bruno.id), 16);
  game.endGame(anna);
  assert.equal(game.phase, 'final');
  game.newGame(anna);
  assert.equal(game.phase, 'lobby');
  assert.equal(game.totals().get(anna.id), 0);
});

test("il master può fermare la seconda parte", () => {
  const { game, players: [anna, bruno], toQuiz } = setup();
  toQuiz();
  assert.throws(() => game.stopRound(bruno), GameError);
  game.stopRound(anna);
  assert.equal(game.phase, 'reveal');
});
