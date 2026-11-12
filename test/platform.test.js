import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Platform, PlatformError } from '../server/platform.js';

function setup(options = {}) {
  const log = [];
  let changes = 0;
  const games = [{ id: 'a', title: 'Gioco A', description: 'x' }, { id: 'b', title: 'Gioco B', description: 'y' }];
  const platform = new Platform(games, {
    onChange: () => { changes += 1; },
    launch: (game) => {
      log.push(`start ${game.id}`);
      return { status: () => `stato ${game.id}`, destroy: () => log.push(`stop ${game.id}`) };
    },
    ...options,
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

test('cambiare gioco chiude quello acceso e accende l\'altro', () => {
  const { platform, log } = setup();
  platform.select('a');
  platform.switchTo('b');
  assert.equal(platform.view().activeId, 'b');
  assert.deepEqual(log, ['start a', 'stop a', 'start b']);
});

test('non si cambia verso lo stesso gioco o uno inesistente', () => {
  const { platform, log } = setup();
  platform.select('a');
  assert.throws(() => platform.switchTo('a'), /già acceso/);
  assert.throws(() => platform.switchTo('zzz'), PlatformError);
  assert.equal(platform.view().activeId, 'a');
  assert.deepEqual(log, ['start a']);
});

test('lo stile parte dal kraft e si cambia per tutti', () => {
  const { platform, changes } = setup();
  assert.equal(platform.view().style, 'kraft');
  assert.ok(platform.view().styles.some((s) => s.id === 'enigmistica'));
  platform.setStyle('enigmistica');
  assert.equal(platform.view().style, 'enigmistica');
  assert.equal(changes(), 1);
  platform.setStyle('enigmistica');
  assert.equal(changes(), 1);
});

test('uno stile sconosciuto viene rifiutato', () => {
  const { platform } = setup();
  assert.throws(() => platform.setStyle('neon'), PlatformError);
  assert.equal(platform.view().style, 'kraft');
});

test('riparte dallo stile salvato e avvisa a ogni cambio', () => {
  const saved = [];
  const { platform } = setup({ style: 'enigmistica', onStyle: (id) => saved.push(id) });
  assert.equal(platform.view().style, 'enigmistica');
  platform.setStyle('enigmistica');
  platform.setStyle('quaderno');
  assert.deepEqual(saved, ['quaderno']);
});

test('uno stile salvato che non esiste più torna al predefinito', () => {
  const { platform } = setup({ style: 'neon' });
  assert.equal(platform.view().style, 'kraft');
});
