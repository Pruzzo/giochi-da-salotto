import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Game, GameError, LETTERS, normalize } from '../server/game.js';

function setup(names = ['Anna', 'Bruno', 'Carla']) {
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

test('normalize ignora maiuscole, accenti e spazi', () => {
  assert.equal(normalize('  Città  '), 'citta');
  assert.equal(normalize("L'Aquila"), 'l aquila');
});

test('un solo amministratore online, subentro se è offline', () => {
  const { game, players: [anna, bruno] } = setup();
  assert.throws(() => game.join({ name: 'Dario', admin: true }), GameError);
  game.disconnect(anna);
  game.claimAdmin(bruno);
  assert.equal(game.adminId, bruno.id);
});

test('nome doppio rifiutato se online, riaggancia il posto se offline', () => {
  const { game, players: [, bruno] } = setup();
  assert.throws(() => game.join({ name: 'bruno' }), /già/);
  game.disconnect(bruno);
  assert.equal(game.join({ name: 'BRUNO' }), bruno);
});

test('il giocatore semplice non può usare le azioni da admin', () => {
  const { game, players: [, bruno] } = setup();
  assert.throws(() => game.startRound(bruno), /amministratore/);
});

test('turno completo: suggerimenti, voto admin e totali', () => {
  const { game, players: [anna, bruno, carla], fire } = setup();
  game.startRound(anna);
  assert.equal(game.phase, 'spinning');
  assert.equal(game.letter, 'A');
  assert.equal(game.view({ role: 'player', player: bruno }).letter, null, 'la lettera non arriva ai telefoni durante la ruota');
  assert.equal(game.view({ role: 'tv' }).letter, 'A');
  fire();
  assert.equal(game.phase, 'writing');

  game.saveWord(anna, 0, 'Anna');
  game.saveWord(bruno, 0, ' anna ');
  game.saveWord(carla, 0, 'Alberto');
  game.saveWord(anna, 1, 'Barca'); // iniziale sbagliata

  const tv = game.view({ role: 'tv' });
  assert.equal(tv.rows, null);
  assert.equal(JSON.stringify(tv).includes('Alberto'), false, 'le parole restano segrete durante la scrittura');
  assert.deepEqual(game.view({ role: 'player', player: bruno }).sheet.words[0], ' anna ');

  fire();
  assert.equal(game.phase, 'review');
  const [a, b, c] = game.marks;
  assert.equal(a.cells[0].score, 1);
  assert.deepEqual(a.cells[0].duplicateOf, ['Bruno']);
  assert.equal(b.cells[0].score, 1);
  assert.equal(c.cells[0].score, 3);
  assert.equal(a.cells[1].score, 0);
  assert.equal(a.cells[1].wrongLetter, true);
  assert.equal(a.cells[2].empty, true);

  game.setScore(anna, anna.id, 1, 3);
  assert.equal(a.cells[1].confirmed, true);
  assert.throws(() => game.setScore(anna, anna.id, 1, 2), /0, 1 o 3/);
  assert.throws(() => game.saveWord(bruno, 0, 'tardi'), GameError);

  game.confirmRound(anna);
  const totals = game.totals();
  assert.equal(totals.get(anna.id), 4);
  assert.equal(totals.get(bruno.id), 1);
  assert.equal(totals.get(carla.id), 3);

  game.reopenRound(anna);
  assert.equal(game.totals().get(anna.id), 0, 'riaprire toglie i punti del turno');
  game.confirmRound(anna);
  game.startRound(anna);
  assert.equal(game.letter, 'B', 'nessuna lettera ripetuta');
  assert.equal(game.totals().get(anna.id), 4, 'i totali restano tra i turni');
});

test('la consegna di tutti i giocatori online chiude il tempo', () => {
  const { game, players: [anna, bruno, carla], fire } = setup();
  game.startRound(anna);
  fire();
  game.disconnect(carla);
  game.setDone(anna, true);
  assert.equal(game.phase, 'writing');
  game.setDone(bruno, true);
  assert.equal(game.phase, 'review');
});

test('le lettere ricominciano dopo averle usate tutte', () => {
  const { game, players: [anna], fire } = setup();
  for (let i = 0; i < LETTERS.length + 1; i += 1) {
    game.startRound(anna);
    fire();
    game.stopWriting(anna);
    game.confirmRound(anna);
  }
  assert.equal(game.usedLetters.length, 1);
});

test('un giocatore che esce a metà resta nei totali ma il vecchio token non vale più', () => {
  const { game, players: [anna, bruno], fire } = setup();
  game.startRound(anna);
  fire();
  game.saveWord(bruno, 0, 'Asino');
  game.stopWriting(anna);
  game.confirmRound(anna);
  const oldToken = bruno.token;
  game.leave(bruno);
  assert.ok(game.players.has(bruno.id));
  assert.throws(() => game.join({ token: oldToken }), /nome/);
});
