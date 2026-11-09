import assert from 'node:assert/strict';
import test from 'node:test';
import { normalize } from '../games/shared/table.js';
import { stripAccents } from '../games/shared/text.js';

// Il riferimento usa Intl (NFD), che qui sul PC c'è: il modulo deve dare lo stesso risultato senza.
const withIcu = (s) => s.normalize('NFD').replace(/\p{M}/gu, '');

test('stripAccents toglie gli accenti come NFD, senza Intl', () => {
  const letters = 'àáâãäåèéêëìíîïòóôõöùúûüçñýÿ' + 'àáâãäåèéêëìíîïòóôõöùúûüçñýÿ'.toUpperCase() + 'ăąčćęěğńňőřśšťůűźżž';
  for (const c of letters) assert.equal(stripAccents(c), withIcu(c), c);
  assert.equal(stripAccents('Perché più città già'), 'Perche piu citta gia');
  assert.equal(stripAccents('città'), 'citta'); // accento già separato
});

test('normalize tratta come uguali le varianti tipografiche', () => {
  assert.equal(normalize('L’Aquila'), normalize("L'Aquila"));
  assert.equal(normalize(' Forlì-Cesena '), 'forli cesena');
  assert.equal(normalize('Ça  va?'), 'ca va');
  assert.equal(normalize('Bolzano 2'), 'bolzano 2');
});
