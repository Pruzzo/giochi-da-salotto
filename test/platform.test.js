import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Platform, PlatformError } from '../server/platform.js';

function setup() {
  const log = [];
  let changes = 0;
  const games = [{ id: 'a', title: 'Gioco A', description: 'x' }, { id: 'b', title: 'Gioco B', description: 'y' }];
  const platform = new Platform(games, {
    onChange: () => { changes += 1; },
    launch: (game) => {
      log.push(`start ${game.id}`);
      return { status: () => `stato ${game.id}`, destroy: () => log.push(`stop ${game.id}`) };
    },
  });
  return { platform, log, changes: () => changes };
}

test('parte senza giochi accesi', () => {
  const { platform } = setup();
  assert.equal(platform.view().activeId, null);
  assert.equal(platform.activeGame, null);
});

test('accendere un gioco lo rende attivo e ne mostra lo stato', () => {
  const { platform, log, changes } = setup();
  platform.select('a');
  assert.equal(platform.view().activeId, 'a');
  assert.equal(platform.view().games[0].status, 'stato a');
  assert.equal(platform.view().games[1].status, null);
  assert.deepEqual(log, ['start a']);
  assert.equal(changes(), 1);
});

test('riaccendere lo stesso gioco non cancella la partita', () => {
  const { platform, log } = setup();
  platform.select('a');
  platform.select('a');
  assert.deepEqual(log, ['start a']);
});

test('un gioco inesistente o un secondo gioco vengono rifiutati', () => {
  const { platform } = setup();
  assert.throws(() => platform.select('zzz'), PlatformError);
  platform.select('a');
  assert.throws(() => platform.select('b'), /Chiudi prima Gioco A/);
});

test('chiudere ferma il gioco e permette di sceglierne un altro', () => {
  const { platform, log } = setup();
  platform.select('a');
  platform.close();
  assert.equal(platform.activeId, null);
  platform.select('b');
  assert.deepEqual(log, ['start a', 'stop a', 'start b']);
});
