import assert from 'node:assert/strict';
import { test } from 'node:test';
import { GameError } from '../games/shared/table.js';
import { TeamTable } from '../games/shared/teams.js';

/** Un gioco a squadre finto: ogni squadra "finisce" con l'azione win. */
class Fake extends TeamTable {
  constructor(clock) {
    super({
      roles: [{ id: 'a', label: 'Primo' }, { id: 'b', label: 'Secondo' }],
      settings: { defaults: { durationSec: 60, size: 's' }, options: { durationSec: [60, 120], size: ['s', 'l'] } },
      now: () => clock.t,
      setTimer: (fn, ms) => { clock.timers.push({ fn, at: clock.t + ms }); return clock.timers.length; },
      clearTimer: (id) => { clock.timers[id - 1] = null; },
    });
  }
  setupTeam() { return { moves: 0 }; }
  teamPoints(team) { return team.outcome.success ? 10 : 0; }
  teamView(team, viewer) { return { moves: team.board.moves, mine: viewer.member }; }
  win(actor) {
    const team = this.playingTeam(actor);
    this.finishTeam(team, { success: true });
    this.changed();
  }
}

function setup(names = ['Anna', 'Bruno', 'Carla', 'Dario']) {
  const clock = { t: 0, timers: [] };
  const game = new Fake(clock);
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
  return { game, ps, tick, clock };
}

/** Squadre fatte in ordine: 0+1, 2+3…, ruoli a e b. */
function formTeams(game, ps) {
  game.start(ps[0]);
  const open = game.teams.filter((t) => !t.fixed);
  ps.forEach((p, i) => game.pickTeam(p, open[Math.floor(i / 2)].id));
  ps.forEach((p, i) => game.chooseRole(p, i % 2 ? 'b' : 'a'));
}

test('si parte solo in numero pari, almeno in due', () => {
  const { game, ps } = setup(['Anna', 'Bruno', 'Carla']);
  assert.throws(() => game.start(ps[0]), /numero pari/);
  const solo = setup(['Anna']);
  assert.throws(() => solo.game.start(solo.ps[0]), /almeno 2/);
  assert.throws(() => setup().game.start(setup().ps[1]), GameError);
});

test('metà dei giocatori come squadre, una per colore; piena a due', () => {
  const { game, ps } = setup();
  game.start(ps[0]);
  assert.equal(game.phase, 'teams');
  assert.deepEqual(game.teams.map((t) => t.id), ['rosso', 'blu']);
  game.pickTeam(ps[0], 'rosso');
  game.pickTeam(ps[1], 'rosso');
  assert.throws(() => game.pickTeam(ps[2], 'rosso'), /piena/);
  // Si può cambiare finché non sono tutte piene.
  game.pickTeam(ps[1], 'blu');
  game.pickTeam(ps[2], 'rosso');
  assert.equal(game.phase, 'teams');
  game.pickTeam(ps[3], 'blu');
  assert.equal(game.phase, 'briefing');
  assert.ok(game.teams.every((t) => t.fixed));
});

test('il nome lo sceglie il primo entrato, vuoto vale il colore', () => {
  const { game, ps } = setup();
  formTeams(game, ps);
  assert.throws(() => game.setTeamName(ps[1], 'Noi'), /primo/);
  game.setTeamName(ps[0], '  I   Fulmini  ');
  assert.equal(game.view({ role: 'tv' }).teams[0].name, 'I Fulmini');
  assert.equal(game.view({ role: 'tv' }).teams[1].name, 'Squadra Blu');
});

test('il ruolo preso dal compagno non si può prendere; Via solo con tutti i ruoli', () => {
  const { game, ps } = setup();
  game.start(ps[0]);
  ps.forEach((p, i) => game.pickTeam(p, i < 2 ? 'rosso' : 'blu'));
  game.chooseRole(ps[0], 'a');
  assert.throws(() => game.chooseRole(ps[1], 'a'), /l'ha già preso Anna/);
  game.chooseRole(ps[1], 'b');
  assert.throws(() => game.go(ps[0]), /due ruoli/);
  game.chooseRole(ps[2], 'b');
  game.chooseRole(ps[3], 'a');
  assert.throws(() => game.go(ps[1]), /amministratore/);
  game.go(ps[0]);
  assert.equal(game.phase, 'playing');
});

test('turno: chi finisce prende i punti, tutti e due; dal secondo turno i ruoli si scambiano', () => {
  const { game, ps } = setup();
  formTeams(game, ps);
  game.go(ps[0]);
  game.win(ps[2]);
  assert.equal(game.phase, 'playing');
  assert.throws(() => game.win(ps[3]), /già finito/);
  game.win(ps[1]);
  assert.equal(game.phase, 'result');
  assert.deepEqual([...game.totals().values()], [10, 10, 10, 10]);
  assert.equal(game.teams[1].rank, 1);
  game.nextTurn(ps[0]);
  assert.equal(game.phase, 'briefing');
  assert.equal(game.roleOf(game.teams[0], ps[0].id), 'b');
  assert.equal(game.roleOf(game.teams[0], ps[1].id), 'a');
  assert.throws(() => game.chooseRole(ps[0], 'a'), /scambiano da soli/);
});

test('allo scadere del tempo il turno si chiude per tutti', () => {
  const { game, ps, tick } = setup();
  formTeams(game, ps);
  game.go(ps[0]);
  game.win(ps[0]);
  tick(60_000);
  assert.equal(game.phase, 'result');
  assert.deepEqual(game.teams.map((t) => t.points), [10, 0]);
});

test('in due non si tengono i punti', () => {
  const { game, ps } = setup(['Anna', 'Bruno']);
  formTeams(game, ps);
  game.go(ps[0]);
  game.win(ps[0]);
  assert.equal(game.view({ role: 'tv' }).scoring, false);
  assert.deepEqual([...game.totals().values()], [0, 0]);
});

test('in due, se uno si disconnette il tempo si ferma e riparte quando rientra', () => {
  const { game, ps, tick } = setup(['Anna', 'Bruno']);
  formTeams(game, ps);
  game.go(ps[0]);
  tick(10_000);
  game.disconnect(ps[1]);
  assert.deepEqual(game.view({ role: 'tv' }).paused, { name: 'Bruno' });
  assert.throws(() => game.win(ps[0]), /pausa/);
  tick(500_000);
  assert.equal(game.phase, 'playing');
  game.connect(ps[1]);
  assert.equal(game.view({ role: 'tv' }).paused, null);
  assert.equal(game.remainingMs(), 50_000);
  tick(50_000);
  assert.equal(game.phase, 'result');
});

test('in più di due chi si disconnette non ferma nessuno', () => {
  const { game, ps } = setup();
  formTeams(game, ps);
  game.go(ps[0]);
  game.disconnect(ps[3]);
  assert.equal(game.paused, null);
  game.connect(ps[3]);
  game.win(ps[3]);
  assert.equal(game.teams[1].done, true);
});

test('chi arriva a metà aspetta; a fine turno i pari scelgono, l’ultimo dispari aspetta ancora', () => {
  const { game, ps } = setup();
  formTeams(game, ps);
  game.go(ps[0]);
  const late = ['Ezio', 'Fede', 'Gino'].map((name) => { const p = game.join({ name }); game.connect(p); return p; });
  const tv = game.view({ role: 'tv' });
  assert.deepEqual(tv.waiting, ['Ezio', 'Fede', 'Gino']);
  assert.equal(game.view({ role: 'player', player: late[0] }).you.slot, 'waiting');
  assert.throws(() => game.win(late[0]), /fine del turno/);
  game.stopTurn(ps[0]);
  game.nextTurn(ps[0]);
  assert.equal(game.phase, 'teams');
  assert.deepEqual(game.choosing, [late[0].id, late[1].id]);
  assert.deepEqual(game.teams.map((t) => [t.id, t.fixed]), [['rosso', true], ['blu', true], ['verde', false]]);
  assert.throws(() => game.pickTeam(late[2], 'verde'), /fine del turno/);
  assert.throws(() => game.pickTeam(late[0], 'rosso'), /non c’è/);
  game.pickTeam(late[0], 'verde');
  game.pickTeam(late[1], 'verde');
  assert.equal(game.phase, 'briefing');
  // Le squadre vecchie hanno già i ruoli scambiati, la nuova li sceglie.
  assert.equal(game.teamReady(game.teams[0]), true);
  assert.equal(game.teamReady(game.teams[2]), false);
  assert.deepEqual(game.view({ role: 'tv' }).waiting, ['Gino']);
});

test('con una sola persona in attesa si continua con le squadre che ci sono', () => {
  const { game, ps } = setup();
  formTeams(game, ps);
  game.go(ps[0]);
  game.connect(game.join({ name: 'Ezio' }));
  game.stopTurn(ps[0]);
  game.nextTurn(ps[0]);
  assert.equal(game.phase, 'briefing');
});

test('chi esce durante la scelta: si rifanno i conti e il dispari torna ad aspettare', () => {
  const { game, ps } = setup(['Anna', 'Bruno', 'Carla', 'Dario', 'Ezio', 'Fede']);
  game.start(ps[0]);
  game.pickTeam(ps[4], 'verde');
  game.pickTeam(ps[0], 'rosso');
  game.leave(ps[5]); // Fede esce: restano 5, Ezio (ultimo arrivato) aspetta
  assert.equal(game.teams.length, 2);
  assert.ok(!game.choosing.includes(ps[4].id));
  assert.equal(ps[4].teamId, null);
  game.pickTeam(ps[1], 'rosso');
  game.pickTeam(ps[2], 'blu');
  game.pickTeam(ps[3], 'blu');
  assert.equal(game.phase, 'briefing');
});

test('chi esce durante le istruzioni scioglie la squadra; il compagno aspetta', () => {
  const { game, ps } = setup();
  formTeams(game, ps);
  game.leave(ps[3]);
  assert.deepEqual(game.teams.map((t) => t.id), ['rosso']);
  assert.equal(ps[2].teamId, null);
  game.go(ps[0]);
  assert.equal(game.phase, 'playing');
});

test('ogni telefono sa cosa mostrare, e la vista del gioco sa chi guarda', () => {
  const { game, ps } = setup();
  formTeams(game, ps);
  assert.equal(game.view({ role: 'player', player: ps[0] }).you.slot, 'rosso:');
  game.go(ps[0]);
  const anna = game.view({ role: 'player', player: ps[0] });
  assert.equal(anna.you.slot, 'rosso:a');
  assert.equal(anna.you.namer, true);
  assert.deepEqual(anna.teams.map((t) => t.game.mine), [true, false]);
});

test('impostazioni: solo valori ammessi, scelte prima di ogni turno', () => {
  const { game, ps } = setup();
  formTeams(game, ps);
  game.setSettings(ps[0], { durationSec: 120, size: 'l' });
  assert.throws(() => game.setSettings(ps[0], { durationSec: 5 }), /non valido/);
  game.go(ps[0]);
  assert.throws(() => game.setSettings(ps[0], { size: 's' }), GameError);
  assert.equal(game.remainingMs(), 120_000);
});
