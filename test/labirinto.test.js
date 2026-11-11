import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DECOS, DIRS, DECO_SHARE, FIRST_BONUS, Game, PATH_TOLERANCE, SIZES, TURN_EVERY, distances, orientationKey, pathTarget,
} from '../games/labirinto/game.js';

/** Casualità ripetibile: ogni test gioca sempre gli stessi labirinti. */
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function setup(names = ['Anna', 'Bruno', 'Carla', 'Dario'], seed = 7) {
  const clock = { t: 0, timers: [] };
  const game = new Game({
    random: seeded(seed),
    now: () => clock.t,
    setTimer: (fn, ms) => { clock.timers.push({ fn, at: clock.t + ms }); return clock.timers.length; },
    clearTimer: (id) => { clock.timers[id - 1] = null; },
  });
  const ps = names.map((name, i) => {
    const p = game.join({ name, admin: i === 0 });
    game.connect(p);
    return p;
  });
  const tick = (ms) => {
    clock.t += ms;
    for (const [i, timer] of clock.timers.entries()) {
      if (timer && timer.at <= clock.t) { clock.timers[i] = null; timer.fn(); }
    }
  };
  return { game, ps, tick };
}

/** Squadre 0+1, 2+3…: i pari esplorano, i dispari navigano. */
function play(game, ps, settings) {
  game.start(ps[0]);
  const open = game.teams.filter((t) => !t.fixed);
  ps.forEach((p, i) => game.pickTeam(p, open[Math.floor(i / 2)].id));
  ps.forEach((p, i) => game.chooseRole(p, i % 2 ? 'navigatore' : 'esploratore'));
  if (settings) game.setSettings(ps[0], settings);
  game.go(ps[0]);
}

const sidesOf = (b, i) => Object.keys(DIRS).filter((s) => b.open[i] & DIRS[s].bit);
const wallsOf = (b, i) => Object.keys(DIRS).filter((s) => !(b.open[i] & DIRS[s].bit));
const neighbor = (b, i, s) => i + DIRS[s].dr * b.n + DIRS[s].dc;

/** Le frecce da premere per andare dalla posizione dell'omino all'uscita, senza bombe. */
function route(b) {
  const dist = distances(b.open, b.n, b.exit.cell, new Set(b.bombs));
  const dirs = [];
  let i = b.pos;
  while (i !== b.exit.cell) {
    const s = sidesOf(b, i).find((x) => dist[neighbor(b, i, x)] === dist[i] - 1);
    dirs.push(s);
    i = neighbor(b, i, s);
  }
  return [...dirs, b.exit.side];
}

/** Un passo vero e ritorno: due passi effettivi senza cambiare casella, evitando le bombe. */
function backAndForth(game, explorer, b) {
  const s = sidesOf(b, b.pos).find((x) => !b.bombs.includes(neighbor(b, b.pos, x)));
  game.move(explorer, s);
  game.move(explorer, DIRS[s].back);
}

test('labirinti con le regole, in tutte le grandezze', () => {
  for (const [size, { n, bombs }] of Object.entries(SIZES)) {
    for (let seed = 1; seed <= 15; seed++) {
      const { game, ps } = setup(['Anna', 'Bruno'], seed);
      play(game, ps, { size });
      const b = game.teams[0].board;
      assert.equal(b.n, n);
      assert.equal(b.open.length, n * n);
      assert.equal(b.bombs.length, bombs);
      // Decori: una casella su sei, ognuno una volta sola, la partenza è decorata.
      const decos = b.deco.filter(Boolean);
      assert.equal(decos.length, Math.round((n * n) / DECO_SHARE));
      assert.equal(new Set(decos).size, decos.length);
      assert.ok(decos.every((d) => DECOS.includes(d)));
      assert.ok(b.deco[b.start]);
      assert.equal(b.pos, b.start);
      // Bombe mai sulla partenza, sull'uscita o sui decori.
      for (const i of b.bombs) assert.ok(i !== b.start && i !== b.exit.cell && !b.deco[i]);
      // L'uscita è sul bordo, con la porta verso fuori.
      const r = Math.floor(b.exit.cell / n) + DIRS[b.exit.side].dr;
      const c = (b.exit.cell % n) + DIRS[b.exit.side].dc;
      assert.ok(r < 0 || c < 0 || r >= n || c >= n);
      // Una strada senza bombe c'è sempre, lunga quanto deciso per la grandezza.
      const path = distances(b.open, n, b.exit.cell, new Set(b.bombs))[b.start] + 1;
      assert.ok(Math.abs(path - pathTarget(n)) <= PATH_TOLERANCE, `${size}: ${path}`);
      // I passaggi sono coerenti: se da A si va a B, da B si va ad A.
      for (let i = 0; i < n * n; i++) {
        for (const s of sidesOf(b, i)) assert.ok(b.open[neighbor(b, i, s)] & DIRS[DIRS[s].back].bit);
      }
    }
  }
});

test('un labirinto diverso per squadra, nuovo a ogni turno, con strade lunghe uguali o quasi', () => {
  const { game, ps } = setup(['Anna', 'Bruno', 'Carla', 'Dario', 'Ezio', 'Fede'], 3);
  play(game, ps, { size: 'medio' });
  const boards = game.teams.map((t) => t.board);
  assert.equal(new Set(boards.map((b) => b.open.join())).size, 3);
  const lengths = boards.map((b) => distances(b.open, b.n, b.exit.cell, new Set(b.bombs))[b.start] + 1);
  assert.ok(Math.max(...lengths) - Math.min(...lengths) <= 2 * PATH_TOLERANCE, String(lengths));
  assert.ok(boards.every((b) => b.bombs.length === 5 && b.deco.filter(Boolean).length === 14));
  game.stopTurn(ps[0]);
  game.nextTurn(ps[0]);
  game.go(ps[0]);
  assert.notEqual(game.teams[0].board.open.join(), boards[0].open.join());
});

test('si muove solo l’esploratore; contro il muro l’omino trema e non conta il passo', () => {
  const { game, ps } = setup();
  play(game, ps);
  const b = game.teams[0].board;
  assert.throws(() => game.move(ps[1], 'N'), /esploratore/);
  assert.throws(() => game.move(ps[0], 'X'), /Direzione/);
  const wall = wallsOf(b, b.pos).find((s) => !(b.pos === b.exit.cell && s === b.exit.side));
  game.move(ps[0], wall);
  assert.equal(b.pos, b.start);
  assert.equal(b.steps, 0);
  assert.equal(b.bumps, 1);
  assert.deepEqual(b.event, { seq: 1, type: 'wall', dir: wall });
  const way = sidesOf(b, b.pos).find((s) => !b.bombs.includes(neighbor(b, b.pos, s)));
  game.move(ps[0], way);
  assert.equal(b.pos, neighbor(b, b.start, way));
  assert.equal(b.steps, 1);
  assert.equal(b.event.type, 'step');
});

test('sulla bomba si torna alla partenza e la bomba sparisce, dalla torcia e dalla mappa', () => {
  const { game, ps } = setup();
  play(game, ps);
  const b = game.teams[0].board;
  const way = sidesOf(b, b.pos)[0];
  const target = neighbor(b, b.pos, way);
  b.bombs = [...b.bombs, target]; // una bomba proprio accanto alla partenza
  // Nella torcia dell'esploratore: la bomba è nella striscia della casella accanto.
  const torch = () => game.view({ role: 'player', player: ps[0] }).teams[0].game.torch;
  assert.equal(torch().around[way].bomb, true);
  game.move(ps[0], way);
  assert.equal(b.pos, b.start);
  assert.equal(b.bombsHit, 1);
  assert.equal(b.steps, 1);
  assert.deepEqual(b.trail, [[b.start, target], [b.start]]);
  assert.equal(b.event.type, 'bomb');
  assert.ok(!b.bombs.includes(target));
  assert.equal(torch().around[way].bomb, false);
  assert.equal(game.view({ role: 'tv' }).teams[0].game.bombsHit, 1);
  assert.ok(!game.view({ role: 'player', player: ps[1] }).teams[0].game.bombs.includes(target));
});

test('la mappa del navigatore gira ogni 8 passi effettivi, mai dritta e mai uguale a prima', () => {
  const { game, ps } = setup();
  play(game, ps);
  const b = game.teams[0].board;
  const nav = () => game.view({ role: 'player', player: ps[1] }).teams[0].game;
  assert.deepEqual(nav().orientation, { rot: 0, flip: null, seq: 0 });
  assert.equal(nav().stepsToTurn, TURN_EVERY);
  const wall = wallsOf(b, b.pos).find((s) => !(b.pos === b.exit.cell && s === b.exit.side));
  let previous = orientationKey(nav().orientation);
  for (let turn = 1; turn <= 6; turn++) {
    for (let k = 0; k < (TURN_EVERY - 2) / 2; k++) backAndForth(game, ps[0], b);
    backAndForth(game, ps[0], b);
    // I muri non contano: stando fermi la mappa non si muove.
    if (b.pos === b.start && wall) for (let k = 0; k < 5; k++) game.move(ps[0], wall);
    assert.equal(nav().orientation.seq, turn);
    const key = orientationKey(nav().orientation);
    assert.notEqual(key, previous);
    assert.notEqual(key, orientationKey({ rot: 0, flip: null }));
    previous = key;
    assert.equal(nav().stepsToTurn, TURN_EVERY);
  }
  game.move(ps[0], sidesOf(b, b.pos).find((s) => !b.bombs.includes(neighbor(b, b.pos, s))));
  assert.equal(nav().stepsToTurn, TURN_EVERY - 1);
});

test('le girate uguali si riconoscono: 180° e capovolta in orizzontale è capovolta in verticale', () => {
  assert.equal(orientationKey({ rot: 180, flip: 'h' }), orientationKey({ rot: 0, flip: 'v' }));
  assert.notEqual(orientationKey({ rot: 90, flip: null }), orientationKey({ rot: 270, flip: null }));
});

test('dalla porta si esce: punti, premio alla prima squadra, zero a chi non esce', () => {
  const { game, ps, tick } = setup();
  play(game, ps, { durationSec: 300 });
  const red = game.teams[0].board;
  tick(61_000); // restano 239 secondi
  // Una bomba presa per strada.
  const way = sidesOf(red, red.pos)[0];
  red.bombs = [...red.bombs, neighbor(red, red.pos, way)];
  game.move(ps[0], way);
  for (const dir of route(red)) game.move(ps[0], dir);
  const team = game.teams[0];
  assert.equal(team.done, true);
  assert.equal(team.rank, 1);
  assert.deepEqual(team.outcome, { success: true, bombs: 1, steps: red.steps });
  assert.equal(game.view({ role: 'player', player: ps[0] }).teams[0].game.event.type, 'exit');
  assert.throws(() => game.move(ps[0], 'N'), /già finito/);
  assert.equal(game.phase, 'playing');
  tick(239_000);
  assert.equal(game.phase, 'result');
  assert.equal(team.points, 10 + 23 - 1 + FIRST_BONUS);
  assert.equal(game.teams[1].points, 0);
  assert.equal(game.teams[1].outcome.success, false);
});

test('la seconda squadra non ha il premio; i punti non scendono sotto 1', () => {
  const { game, ps, tick } = setup();
  play(game, ps, { durationSec: 180 });
  const [red, blue] = game.teams.map((t) => t.board);
  for (const dir of route(red)) game.move(ps[0], dir);
  tick(179_000); // resta un secondo
  blue.bombsHit = 15;
  for (const dir of route(blue)) game.move(ps[2], dir);
  assert.equal(game.phase, 'result');
  assert.equal(game.teams[0].points, 10 + 18 + FIRST_BONUS);
  assert.equal(game.teams[1].rank, 2);
  assert.equal(game.teams[1].points, 1);
});

test('cosa vede chi: la mappa solo al navigatore, la torcia solo all’esploratore', () => {
  const { game, ps } = setup();
  play(game, ps);
  const b = game.teams[0].board;
  const tv = game.view({ role: 'tv' }).teams[0].game;
  const explorer = game.view({ role: 'player', player: ps[0] }).teams[0].game;
  const navigator = game.view({ role: 'player', player: ps[1] }).teams[0].game;
  const stranger = game.view({ role: 'player', player: ps[2] }).teams[0].game;
  // La TV la vede anche il navigatore: durante il turno solo passi e bombe prese.
  for (const key of ['open', 'deco', 'bombs', 'exit', 'pos', 'start', 'trail', 'reveal', 'torch', 'event']) assert.ok(!(key in tv), key);
  assert.equal(tv.steps, 0);
  // L'esploratore ha le frecce e la torcia, non la mappa.
  assert.equal(explorer.role, 'esploratore');
  for (const key of ['open', 'deco', 'bombs', 'exit', 'pos', 'start']) assert.ok(!(key in explorer), key);
  assert.deepEqual(Object.keys(explorer.torch).sort(), ['around', 'here']);
  assert.equal(explorer.torch.here.deco, b.deco[b.start]);
  for (const s of Object.keys(DIRS)) {
    const wall = b.open[b.pos] & DIRS[s].bit ? 'open' : b.exit.cell === b.pos && b.exit.side === s ? 'door' : 'wall';
    assert.equal(explorer.torch.here.walls[s], wall);
    const side = explorer.torch.around[s];
    if (side) assert.equal(Object.keys(side.walls).length, 2); // della casella accanto, solo la striscia vicina
  }
  // Il navigatore ha la mappa, ma non sa dov'è l'omino né dove è partito.
  assert.equal(navigator.role, 'navigatore');
  assert.deepEqual(navigator.open, b.open);
  for (const key of ['pos', 'start', 'trail', 'torch']) assert.ok(!(key in navigator), key);
  assert.ok(!('dir' in navigator.event));
  // Chi è di un'altra squadra non vede niente di questa.
  assert.equal(stranger, null);
  // A turno finito la TV svela il labirinto e la strada fatta.
  game.stopTurn(ps[0]);
  const after = game.view({ role: 'tv' }).teams[0].game;
  assert.deepEqual(after.reveal.open, b.open);
  assert.deepEqual(after.reveal.trail, [[b.start]]);
});

test('nella torcia, fuori dal bordo è buio', () => {
  const { game, ps } = setup();
  play(game, ps);
  const b = game.teams[0].board;
  b.pos = 0; // l'angolo in alto a sinistra
  const torch = game.view({ role: 'player', player: ps[0] }).teams[0].game.torch;
  assert.equal(torch.around.N, null);
  assert.equal(torch.around.W, null);
  assert.ok(torch.around.E && torch.around.S);
  assert.deepEqual(Object.keys(torch.around.E.walls), ['N', 'S']);
  assert.deepEqual(Object.keys(torch.around.S.walls), ['W', 'E']);
});
