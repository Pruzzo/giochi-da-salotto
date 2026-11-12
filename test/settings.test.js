import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { loadSettings, saveSettings } from '../server/settings.js';

const tempFile = () => join(mkdtempSync(join(tmpdir(), 'salotto-')), 'cartella', 'impostazioni.json');

test('senza file le impostazioni sono vuote', () => {
  assert.deepEqual(loadSettings(tempFile()), {});
});

test('quello che si salva si rilegge, creando la cartella', () => {
  const file = tempFile();
  assert.equal(saveSettings({ style: 'enigmistica' }, file), true);
  assert.deepEqual(loadSettings(file), { style: 'enigmistica' });
  assert.match(readFileSync(file, 'utf8'), /"style": "enigmistica"/);
});

test('un file rovinato non blocca la partenza', () => {
  const file = tempFile();
  saveSettings({}, file);
  writeFileSync(file, '{ non è json');
  assert.deepEqual(loadSettings(file), {});
  writeFileSync(file, '[1, 2]');
  assert.deepEqual(loadSettings(file), {});
});
