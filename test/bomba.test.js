import assert from 'node:assert/strict';
import { test } from 'node:test';
import { GameError } from '../games/shared/table.js';
import { Game, MAX_ERRORS } from '../games/bomba/game.js';
import {
  CIPHER_WORDS, FLAG_COLORS, IT_ALPHABET, MODULES, MODULE_TYPES, SERIAL_FORMAT, SMORFIA, WORDS, hasVowel, isRight, lastDigit, makeSerial,
} from '../games/bomba/modules.js';

/** Un caso ripetibile: lo stesso seme dà sempre la stessa partita. */
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

const solve = (type, face, serial) => MODULES[type].solve(face, serial);

// ---------- Numero di serie ----------

test('il numero di serie è due lettere, una cifra, trattino, due cifre, una lettera', () => {
  const rand = seeded(1);
  for (let i = 0; i < 2000; i++) {
    const serial = makeSerial(rand);
    assert.match(serial, SERIAL_FORMAT);
    assert.ok(!serial.includes('O'), 'niente O, si confonde con lo zero');
    assert.ok(!serial.includes('Z'), 'niente Z, si confonde col 2');
  }
  assert.equal(lastDigit('RT4-82K'), 2);
  assert.equal(hasVowel('RT4-82K'), false);
  assert.equal(hasVowel('RA4-82K'), true);
});

// ---------- Ogni modulo: una sola mossa giusta ----------

const permutations = (list) => (list.length <= 1 ? [list] : list.flatMap((x, i) => permutations([...list.slice(0, i), ...list.slice(i + 1)]).map((p) => [x, ...p])));
/** Le sequenze di n elementi diversi presi da `list`, in ogni ordine. */
const arrangements = (list, n) => (n === 0 ? [[]] : list.flatMap((x, i) => arrangements([...list.slice(0, i), ...list.slice(i + 1)], n - 1).map((p) => [x, ...p])));

/** Tutte le mosse possibili che il telefono può mandare per quella faccia. */
function allMoves(type, face) {
  const combos = (n) => Array.from({ length: 2 ** n }, (_, k) => Array.from({ length: n }, (_, i) => !!(k & (1 << i))));
  switch (type) {
    case 'fili': return face.wires.map((_, i) => i);
    case 'leve': return combos(5);
    case 'lampadine': return combos(4);
    case 'semaforo': return ['rosso', 'giallo', 'verde'];
    case 'parola': case 'tombola': return face.keys;
    case 'cassaforte': return Array.from({ length: 10000 }, (_, i) => String(i).padStart(4, '0'));
    case 'lucchetto': {
      const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      return [...A].flatMap((a) => [...A].flatMap((b) => [...A].map((c) => [a, b, c])));
    }
    case 'bandiera': return [0, 1, 2];
    case 'dado': return [1, 2, 3, 4, 5, 6];
    case 'moka': return ['alza', 'abbassa', 'spegni'];
    case 'pizza': case 'gelato': case 'orologio': case 'tavolozza': case 'barista': return face.keys;
    case 'termometro': return ['cappotto', 'maglione', 'maglietta', 'costume'];
    case 'cartello': return ['fermati', 'rallenta', 'avanti', 'clacson'];
    case 'scontrino': return Array.from({ length: 100 }, (_, i) => String(i));
    case 'telefono': return Array.from({ length: 1000 }, (_, i) => String(i).padStart(3, '0'));
    case 'ingranaggi': return ['orario', 'antiorario'];
    case 'briscola': return [0, 1, 2];
    // Tutte le 21^5 parole sono troppe: bastano le parole possibili lette con ogni spostamento.
    case 'cifrario': return CIPHER_WORDS.flatMap((w) => Array.from({ length: 21 }, (_, k) => [...w].map((c) => IT_ALPHABET[(IT_ALPHABET.indexOf(c) + k) % 21])));
    case 'schedina': {
      const v = ['1', 'X', '2'];
      return Array.from({ length: 81 }, (_, k) => [0, 1, 2, 3].map((i) => v[Math.floor(k / 3 ** i) % 3]));
    }
    case 'anagramma': return permutations([0, 1, 2, 3, 4]);
    case 'ascensore': return [0, 1, 2, 3, 4, 5, 6];
    case 'bilancia': case 'quadro': return combos(5);
    case 'stazione': return [1, 2, 3, 4, 5, 6];
    case 'ricetta': return [1, 2, 3, 4, 5].flatMap((n) => arrangements(face.keys, n));
    default: throw new Error(type);
  }
}

test('ogni modulo generato ha esattamente una mossa giusta, ed è una mossa che si può fare', () => {
  const rand = seeded(7);
  for (const type of MODULE_TYPES) {
    const heavy = type === 'cassaforte' || type === 'lucchetto';
    for (let i = 0; i < (heavy ? 40 : 400); i++) {
      const serial = makeSerial(rand);
      const face = MODULES[type].make(rand, serial, null);
      // Conta le mosse diverse per il server: nell'anagramma due lettere uguali toccate in ordine diverso sono la stessa parola.
      const parsed = allMoves(type, face).map((m) => MODULES[type].parse(m, face)).filter((m) => m !== null);
      const right = [...new Set(parsed.filter((m) => isRight(type, face, serial, m)).map((m) => JSON.stringify(m)))];
      assert.equal(right.length, 1, `${type} ${serial} ${JSON.stringify(face)}`);
    }
  }
});

test('le facce nuove dei moduli a passi sono diverse da quelle di prima', () => {
  const rand = seeded(3);
  for (const type of MODULE_TYPES.filter((t) => MODULES[t].steps > 1)) {
    let face = MODULES[type].make(rand, 'RT4-82K', null);
    for (let i = 0; i < 200; i++) {
      const next = MODULES[type].make(rand, 'RT4-82K', face);
      assert.notDeepEqual(next, face, type);
      face = next;
    }
  }
});

test('generazione: fili da 3 a 6, bandiere mai di un colore solo, tasti senza doppioni', () => {
  const rand = seeded(11);
  const lengths = new Set();
  for (let i = 0; i < 1000; i++) {
    const serial = makeSerial(rand);
    const wires = MODULES.fili.make(rand, serial).wires;
    lengths.add(wires.length);
    assert.ok(wires.length >= 3 && wires.length <= 6);
    const { stripes } = MODULES.bandiera.make(rand, serial);
    assert.ok(new Set(stripes).size > 1);
    assert.ok(stripes.every((c) => FLAG_COLORS.includes(c)));
    for (const type of ['parola', 'tombola']) {
      const face = MODULES[type].make(rand, serial, null);
      assert.equal(face.keys.length, 4);
      assert.equal(new Set(face.keys).size, 4, type);
      assert.ok(face.keys.includes(solve(type, face, serial)), type);
    }
    // Leve, lampadine e lucchetto non partono già nella posizione giusta.
    for (const type of ['leve', 'lampadine', 'lucchetto']) {
      const face = MODULES[type].make(rand, serial);
      assert.notDeepEqual(face.start, solve(type, face, serial), type);
    }
  }
  assert.deepEqual([...lengths].sort(), [3, 4, 5, 6]);
});

// ---------- Le regole del manuale, con i suoi esempi ----------

test('Fili: le regole in ordine, la prima che vale', () => {
  // 1. due o più rossi: l'ultimo rosso (vale anche col primo nero o col giallo e cifra pari)
  assert.equal(solve('fili', { wires: ['nero', 'rosso', 'giallo', 'rosso'] }, 'RT4-82K'), 3);
  // 2. un giallo e ultima cifra pari: il primo giallo
  assert.equal(solve('fili', { wires: ['nero', 'giallo', 'blu', 'giallo'] }, 'RT4-82K'), 1);
  assert.equal(solve('fili', { wires: ['blu', 'giallo', 'giallo'] }, 'RT4-80K'), 1); // lo zero è pari
  // 3. con la cifra dispari si passa oltre: primo nero, il secondo filo
  assert.equal(solve('fili', { wires: ['nero', 'giallo', 'blu', 'giallo'] }, 'RT4-83K'), 1);
  assert.equal(solve('fili', { wires: ['nero', 'blu', 'blu', 'blu', 'giallo'] }, 'RT4-83K'), 1);
  // 4. più blu che bianchi: l'ultimo
  assert.equal(solve('fili', { wires: ['blu', 'rosso', 'bianco', 'blu', 'giallo'] }, 'RT4-83K'), 4);
  // 5. altrimenti quello di mezzo; con un numero pari, il più alto dei due
  assert.equal(solve('fili', { wires: ['bianco', 'blu', 'rosso'] }, 'RT4-83K'), 1);
  assert.equal(solve('fili', { wires: ['bianco', 'blu', 'rosso', 'giallo'] }, 'RT4-83K'), 1);
  assert.equal(solve('fili', { wires: ['bianco', 'bianco', 'rosso', 'giallo', 'blu', 'bianco'] }, 'RT4-83K'), 2);
});

test('Leve: la prima lettera sceglie la riga, lo zero gira la leva di mezzo', () => {
  const u = true;
  const g = false;
  assert.deepEqual(solve('leve', {}, 'AT4-82K'), [u, g, u, g, u]);
  assert.deepEqual(solve('leve', {}, 'ET4-82K'), [u, g, u, g, u]);
  assert.deepEqual(solve('leve', {}, 'FT4-82K'), [g, g, u, u, g]);
  assert.deepEqual(solve('leve', {}, 'JT4-82K'), [g, g, u, u, g]);
  assert.deepEqual(solve('leve', {}, 'KT4-82K'), [u, u, g, g, u]);
  assert.deepEqual(solve('leve', {}, 'RT4-82K'), [g, u, u, g, g]);
  assert.deepEqual(solve('leve', {}, 'ZT4-82K'), [u, g, g, u, u]);
  assert.deepEqual(solve('leve', {}, 'RT0-82K'), [g, u, g, g, g]);
  assert.deepEqual(solve('leve', {}, 'KT4-00K'), [u, u, u, g, u]);
});

test('Semaforo: con e senza vocale', () => {
  const press = (light, serial) => solve('semaforo', { light }, serial);
  assert.deepEqual(['rossa', 'gialla', 'verde'].map((l) => press(l, 'AT4-82K')), ['verde', 'rosso', 'giallo']);
  assert.deepEqual(['rossa', 'gialla', 'verde'].map((l) => press(l, 'RT4-82K')), ['giallo', 'verde', 'rosso']);
});

test('Parola: la tabella del manuale', () => {
  assert.deepEqual(WORDS, { CASA: 'CASCO', CASSA: 'COSA', CAUSA: 'CASA', COSA: 'CASTA', CASO: 'CAUSA', CASE: 'CASSA', CASTA: 'CASO', CASCO: 'CASE' });
  assert.equal(solve('parola', { screen: 'CAUSA', keys: ['CASE', 'CASA', 'COSA', 'CASO'] }), 'CASA');
});

test('Cassaforte: RT4-82K apre con 4824', () => {
  assert.equal(solve('cassaforte', {}, 'RT4-82K'), '4824');
  assert.equal(solve('cassaforte', {}, 'AB0-00C'), '0000');
  assert.equal(solve('cassaforte', {}, 'AB9-99C'), '9997');
});

test('Lucchetto: RT4-82K col verde è K R T', () => {
  assert.deepEqual(solve('lucchetto', { color: 'verde' }, 'RT4-82K'), ['K', 'R', 'T']);
  assert.deepEqual(solve('lucchetto', { color: 'rosso' }, 'RT4-82K'), ['R', 'T', 'K']);
  assert.deepEqual(solve('lucchetto', { color: 'blu' }, 'RT4-82K'), ['K', 'T', 'R']);
  assert.deepEqual(solve('lucchetto', { color: 'verde' }, 'ZA1-23A'), ['A', 'A', 'Z']);
});

test('Bandiera: tricolore, due uguali, mezzo rosso, il primo dell’elenco', () => {
  const touch = (stripes) => solve('bandiera', { stripes });
  assert.equal(touch(['verde', 'bianco', 'rosso']), 1);
  assert.equal(touch(['blu', 'giallo', 'blu']), 1);
  assert.equal(touch(['rosso', 'rosso', 'nero']), 2);
  assert.equal(touch(['bianco', 'rosso', 'rosso']), 0);
  assert.equal(touch(['nero', 'rosso', 'giallo']), 0);
  assert.equal(touch(['blu', 'verde', 'giallo']), 2);
  assert.equal(touch(['rosso', 'bianco', 'verde']), 0); // il tricolore al contrario non è la bandiera italiana
  assert.equal(touch(['nero', 'bianco', 'blu']), 2);
});

test('Dado: opposto o successivo, la vocale scambia i colori', () => {
  const press = (color, value, serial) => solve('dado', { color, value }, serial);
  assert.deepEqual([1, 2, 3, 4, 5, 6].map((v) => press('bianco', v, 'RT4-82K')), [6, 5, 4, 3, 2, 1]);
  assert.deepEqual([1, 2, 3, 4, 5, 6].map((v) => press('rosso', v, 'RT4-82K')), [2, 3, 4, 5, 6, 1]);
  assert.deepEqual([1, 2, 3, 4, 5, 6].map((v) => press('bianco', v, 'RE4-82K')), [2, 3, 4, 5, 6, 1]);
  assert.deepEqual([1, 2, 3, 4, 5, 6].map((v) => press('rosso', v, 'RE4-82K')), [6, 5, 4, 3, 2, 1]);
});

test('Lampadine: RT4-82K accende la 2 e la 4; senza cifre da 1 a 4 solo la 4', () => {
  assert.deepEqual(solve('lampadine', {}, 'RT4-82K'), [false, true, false, true]);
  assert.deepEqual(solve('lampadine', {}, 'RT5-90K'), [false, false, false, true]);
  assert.deepEqual(solve('lampadine', {}, 'RT1-13K'), [true, false, true, false]);
});

test('Tombola: la smorfia del manuale', () => {
  assert.deepEqual(SMORFIA, { italia: 1, bambina: 2, gatta: 3, maiale: 4, mano: 5, topi: 11, soldati: 12, risata: 19, festa: 20, testa: 34, paura: 90 });
});

test('Moka: verde alza, rossa spegne, gialla secondo l’ultima cifra', () => {
  const press = (zone, serial) => solve('moka', { zone, needle: 0.5 }, serial);
  assert.equal(press('verde', 'RT4-83K'), 'alza');
  assert.equal(press('rossa', 'RT4-82K'), 'spegni');
  assert.equal(press('gialla', 'RT4-82K'), 'abbassa');
  assert.equal(press('gialla', 'RT4-83K'), 'spegni');
});

test('Orologio: i minuti da aggiungere dipendono dall’ultima cifra, e dopo le 12 si ricomincia dall’1', () => {
  const at = 12 * 60 + 50; // le 12:50
  assert.deepEqual(['RT4-80K', 'RT4-83K', 'RT4-86K', 'RT4-89K'].map((s) => solve('orologio', { minutes: at }, s)), ['1:05', '1:20', '1:35', '1:50']);
  assert.equal(solve('orologio', { minutes: 3 * 60 + 50 }, 'RT4-84K'), '4:20');
});

test('Gelato: si preme il gusto della pallina, e con fiordilatte spesso c’è anche la stracciatella', () => {
  assert.equal(solve('gelato', { flavor: 'puffo', keys: [] }, 'RT4-82K'), 'puffo');
  const rand = seeded(3);
  let both = 0;
  for (let i = 0; i < 200; i++) {
    const face = MODULES.gelato.make(rand, 'RT4-82K', null);
    assert.equal(face.keys.length, 4);
    assert.ok(face.keys.includes(face.flavor));
    if (face.flavor === 'fiordilatte' && face.keys.includes('stracciatella')) both++;
  }
  assert.ok(both > 0);
});

// ---------- La partita ----------

function setup(names = ['Anna', 'Bruno', 'Carla', 'Dario'], seed = 5) {
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

/** Squadre 0+1, 2+3…: il primo di ogni coppia è l'artificiere. Poi Via. */
function play(game, ps, settings = {}) {
  game.start(ps[0]);
  const open = game.teams.filter((t) => !t.fixed);
  ps.forEach((p, i) => game.pickTeam(p, open[Math.floor(i / 2)].id));
  ps.forEach((p, i) => game.chooseRole(p, i % 2 ? 'esperto' : 'artificiere'));
  if (Object.keys(settings).length) game.setSettings(ps[0], settings);
  game.go(ps[0]);
}

/** La mossa giusta e una sbagliata, calcolate solo da quello che vede l'artificiere. */
function moves(view, index) {
  const m = view.modules[index];
  // La mossa giusta come la manda il telefono: per quasi tutti è la soluzione stessa, per alcuni no (indici, testo).
  const right = allMovesQuick(m.type, m.face).find((v) => MODULES[m.type].parse(v, m.face) !== null && isRight(m.type, m.face, view.serial, MODULES[m.type].parse(v, m.face)))
    ?? MODULES[m.type].solve(m.face, view.serial);
  const wrong = allMovesQuick(m.type, m.face).find((v) => MODULES[m.type].parse(v, m.face) !== null && !isRight(m.type, m.face, view.serial, MODULES[m.type].parse(v, m.face)));
  return { m, right, wrong };
}

function allMovesQuick(type, face) {
  if (type === 'cassaforte') return ['0000', '1111', '2222'];
  if (type === 'lucchetto') return [['A', 'A', 'A'], ['B', 'B', 'B']];
  if (type === 'telefono') return ['000', '111', '999'];
  return allMoves(type, face);
}

const bomb = (game, p) => game.view({ role: 'player', player: p }).teams.find((t) => t.id === p.teamId).game;

test('ogni squadra ha la sua bomba, coi moduli tutti diversi e lo stesso numero', () => {
  const { game, ps } = setup(['A', 'B', 'C', 'D', 'E', 'F']);
  play(game, ps, { modules: 5 });
  const serials = game.teams.map((t) => t.board.serial);
  assert.equal(new Set(serials).size, 3);
  for (const team of game.teams) {
    assert.equal(team.board.modules.length, 5);
    assert.equal(new Set(team.board.modules.map((m) => m.type)).size, 5);
  }
  const before = serials.join();
  game.stopTurn(ps[0]);
  game.nextTurn(ps[0]);
  game.go(ps[0]);
  assert.notEqual(game.teams.map((t) => t.board.serial).join(), before);
});

test('cosa vede chi: la bomba solo l’artificiere della squadra, mai la soluzione', () => {
  const { game, ps } = setup();
  play(game, ps);
  const art = bomb(game, ps[0]);
  assert.match(art.serial, SERIAL_FORMAT);
  assert.equal(art.modules.length, 3);
  assert.deepEqual(Object.keys(art.modules[0]).sort(), ['face', 'faceId', 'solved', 'step', 'steps', 'type']);
  const others = [
    game.view({ role: 'tv' }).teams[0].game,
    bomb(game, ps[1]), // l'esperto della stessa squadra
    game.view({ role: 'player', player: ps[2] }).teams[0].game, // l'artificiere di un'altra squadra
  ];
  for (const view of others) {
    assert.deepEqual(view, { errors: 0, maxErrors: 3, solved: [false, false, false] });
  }
  // La soluzione non c'è da nessuna parte nello stato mandato ai telefoni.
  const text = JSON.stringify(game.view({ role: 'player', player: ps[0] }));
  assert.ok(!/solution|answer|right/.test(text));
});

test('solo l’artificiere tocca la bomba; un tocco su una faccia vecchia non conta', () => {
  const { game, ps } = setup();
  play(game, ps);
  const view = bomb(game, ps[0]);
  const { m, right } = moves(view, 0);
  assert.throws(() => game.answer(ps[1], 0, m.faceId, right), /artificiere/);
  assert.throws(() => game.answer(ps[0], 9, m.faceId, right), GameError);
  assert.throws(() => game.answer(ps[0], 0, m.faceId, 'boh'), /non si può/);
  assert.deepEqual(game.answer(ps[0], 0, m.faceId + 1000, right), { stale: true });
  assert.equal(bomb(game, ps[0]).errors, 0);
});

test('mosse giuste: i passi vanno avanti, il modulo si risolve, la bomba si disinnesca', () => {
  const { game, ps, tick } = setup();
  play(game, ps, { modules: 4 });
  tick(65_000);
  for (let i = 0; i < 4; i++) {
    for (;;) {
      const view = bomb(game, ps[0]);
      const { m, right } = moves(view, i);
      if (m.solved) break;
      const step = m.step;
      assert.deepEqual(game.answer(ps[0], i, m.faceId, right), { right: true });
      const after = bomb(game, ps[0])?.modules?.[i];
      if (after && !after.solved) {
        assert.equal(after.step, step + 1);
        assert.notEqual(after.faceId, m.faceId);
      }
      if (game.teams[0].done) break;
    }
  }
  assert.equal(game.teams[0].done, true);
  assert.deepEqual(game.teams[0].outcome, { success: true });
  assert.deepEqual(game.view({ role: 'tv' }).teams[0].game.solved, [true, true, true, true]);
  // L'altra squadra scoppia con tre errori, il turno si chiude.
  for (let k = 0; k < MAX_ERRORS; k++) {
    const { m, wrong } = moves(bomb(game, ps[2]), 0);
    assert.deepEqual(game.answer(ps[2], 0, m.faceId, wrong), { right: false });
  }
  assert.equal(game.phase, 'result');
  assert.deepEqual(game.teams[1].outcome, { success: false, reason: 'errors' });
  // 300 s - 65 s = 235 s rimasti: 10 + 23, primi +3
  assert.equal(game.teams[0].points, 36);
  assert.equal(game.teams[1].points, 0);
  assert.deepEqual([...game.totals().values()], [36, 36, 0, 0]);
});

test('errori: un passo sbagliato ricomincia con valori nuovi, i moduli a un passo restano com’erano', () => {
  const { game, ps } = setup();
  play(game, ps, { modules: 5 });
  const view = bomb(game, ps[0]);
  const multi = view.modules.findIndex((m) => m.steps > 1);
  const single = view.modules.findIndex((m) => m.steps === 1);
  assert.ok(multi >= 0 && single >= 0);
  // Prima un passo giusto, poi uno sbagliato: si resta al secondo passo, con una faccia nuova.
  let { m, right } = moves(view, multi);
  game.answer(ps[0], multi, m.faceId, right);
  ({ m } = moves(bomb(game, ps[0]), multi));
  const { wrong } = moves(bomb(game, ps[0]), multi);
  game.answer(ps[0], multi, m.faceId, wrong);
  const after = bomb(game, ps[0]).modules[multi];
  assert.equal(after.step, 1);
  assert.notEqual(after.faceId, m.faceId);
  assert.notDeepEqual(after.face, m.face);
  assert.equal(bomb(game, ps[0]).errors, 1);
  // Modulo a un passo: stessa faccia, si riprova.
  const s = moves(bomb(game, ps[0]), single);
  game.answer(ps[0], single, s.m.faceId, s.wrong);
  const again = bomb(game, ps[0]).modules[single];
  assert.equal(again.faceId, s.m.faceId);
  assert.equal(again.solved, false);
  assert.equal(game.view({ role: 'tv' }).teams[0].game.errors, 2);
});

test('Fili: il filo sbagliato resta tagliato e non si taglia due volte', () => {
  const { game, ps } = setup();
  play(game, ps);
  const board = game.teams[0].board;
  board.modules[0] = { type: 'fili', face: { wires: ['bianco', 'blu', 'rosso'], cut: [] }, step: 0, solved: false, faceId: 999 };
  board.serial = 'RT4-83K';
  assert.deepEqual(game.answer(ps[0], 0, 999, 0), { right: false });
  assert.deepEqual(bomb(game, ps[0]).modules[0].face.cut, [0]);
  assert.throws(() => game.answer(ps[0], 0, 999, 0), /non si può/);
  assert.deepEqual(game.answer(ps[0], 0, 999, 1), { right: true });
  assert.equal(bomb(game, ps[0]).modules[0].solved, true);
});

test('tempo scaduto: la bomba scoppia; fermato dall’amministratore: turno fermato', () => {
  const { game, ps, tick } = setup();
  play(game, ps, { durationSec: 180 });
  tick(180_000);
  assert.equal(game.phase, 'result');
  assert.deepEqual(game.teams.map((t) => t.outcome.reason), ['time', 'time']);
  assert.deepEqual(game.teams.map((t) => t.points), [0, 0]);
  game.nextTurn(ps[0]);
  game.go(ps[0]);
  tick(10_000);
  game.stopTurn(ps[0]);
  assert.deepEqual(game.teams.map((t) => t.outcome.reason), ['stopped', 'stopped']);
});

test('punti: minimo 1 con tanti errori, +3 solo alla prima squadra', () => {
  const { game } = setup();
  const team = (success, remainingMs, errors, rank) => ({ outcome: { success }, remainingMs, rank, board: { errors } });
  assert.equal(game.teamPoints(team(true, 300_000, 0, 1)), 43);
  assert.equal(game.teamPoints(team(true, 59_999, 2, 2)), 11);
  assert.equal(game.teamPoints(team(true, 0, 2, 2)), 6);
  assert.equal(game.teamPoints(team(true, 5_000, 2, 1)), 9);
  assert.equal(game.teamPoints(team(true, 0, 6, 2)), 1);
  assert.equal(game.teamPoints(team(false, 100_000, 0, null)), 0);
});

test('dal secondo turno l’artificiere diventa esperto e ha una bomba nuova', () => {
  const { game, ps } = setup(['Anna', 'Bruno']);
  play(game, ps, { modules: 3 });
  assert.ok(bomb(game, ps[0]).serial);
  game.stopTurn(ps[0]);
  game.nextTurn(ps[0]);
  game.setSettings(ps[0], { modules: 5, durationSec: 360 });
  game.go(ps[0]);
  assert.equal(bomb(game, ps[0]).serial, undefined);
  assert.equal(bomb(game, ps[1]).modules.length, 5);
  assert.equal(game.remainingMs(), 360_000);
  assert.equal(game.view({ role: 'tv' }).scoring, false);
});
