// Costruisce il dizionario di "Anagrammi" da morph-it (tramite i pacchetti npm di Ludan Stoecklé)
// e sceglie le parole di partenza tra quelle più comuni.
//
//   npm pack italian-words-dict@3.4.0 italian-adjectives-dict@3.4.0 italian-verbs-dict@3.4.0 an-array-of-italian-words@1.2.0
//   (estrai ogni .tgz in una cartella sua)
//   node games/anagrammi/tools/build-dict.mjs <nomi.json> <aggettivi.json> <verbi.json> <frequenze.json>
//
// Scrive games/anagrammi/data/words.txt (parole valide) e seeds.txt (parole di partenza da 8 lettere).
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONSONANT_END, EXTRA } from './extra-words.mjs';

const [nounsPath, adjPath, verbsPath, freqPath] = process.argv.slice(2);
if (!freqPath) {
  console.error('Uso: node build-dict.mjs <nomi.json> <aggettivi.json> <verbi.json> <frequenze.json>');
  process.exit(1);
}

const MIN = 3;
const ONSET = /^(s?(ch|gh|[bcdfgpt][lr]|vr|[bcdfghlmnpqrtvz])?|gn|ps|pn|tz)[aeiou]/;
const MAX = 8;
const SEED_LEN = 8;
const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');

/** Come la scriverebbe un giocatore: minuscolo, senza accenti, solo lettere. */
const plain = (w) => w.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const words = new Set();
const add = (w) => {
  if (typeof w !== 'string') return;
  const p = plain(w);
  // Solo le 21 lettere italiane; chi finisce per consonante deve stare nella lista (niente sigle né inglese).
  if (!/^[abcdefghilmnopqrstuvz]+$/.test(p) || p.length < MIN || p.length > MAX) return;
  if (!/[aeiou]/.test(p) || (/[^aeiou]$/.test(p) && !CONSONANT_END.has(p))) return;
  // Nessuna parola italiana comincia con "dn", "pc", "cd": sono sigle (dna, pci, cda).
  if (!ONSET.test(p)) return;
  words.add(p);
};
/** Tutte le stringhe dentro un oggetto annidato (forme dei verbi). */
const walk = (v) => {
  if (typeof v === 'string') add(v);
  else if (v && typeof v === 'object') Object.values(v).forEach(walk);
};

const nouns = JSON.parse(readFileSync(nounsPath, 'utf8'));
for (const [w, info] of Object.entries(nouns)) {
  add(w);
  add(info?.P);
  // -cia/-gia: morph-it a volte sbaglia il plurale (spiaggie). Regola scolastica:
  // dopo consonante -ce/-ge (spiagge, arance), dopo vocale -cie/-gie (camicie, bugie).
  const m = plain(w).match(/^(.*)([cg])ia$/);
  if (m) add(/[aeiou]$/.test(m[1]) ? `${m[1]}${m[2]}ie` : `${m[1]}${m[2]}e`);
}
const adjs = JSON.parse(readFileSync(adjPath, 'utf8'));
for (const [w, forms] of Object.entries(adjs)) { add(w); walk(forms); }
const verbs = JSON.parse(readFileSync(verbsPath, 'utf8'));
for (const [w, forms] of Object.entries(verbs)) { add(w); walk(forms); }
EXTRA.forEach(add);

// Parole di partenza: 8 lettere, valide, tra le più usate e con almeno 25 anagrammi possibili.
const freq = JSON.parse(readFileSync(freqPath, 'utf8'));
const counts = (w) => [...w].reduce((m, c) => m.set(c, (m.get(c) ?? 0) + 1), new Map());
const fits = (w, pool) => {
  const need = counts(w);
  for (const [c, n] of need) if ((pool.get(c) ?? 0) < n) return false;
  return true;
};
const list = [...words];
const seeds = [];
for (const w of freq.slice(0, 40000)) {
  if (w.length !== SEED_LEN || !words.has(w) || seeds.includes(w)) continue;
  const pool = counts(w);
  const found = list.filter((x) => fits(x, pool)).length;
  if (found >= 25) seeds.push(w);
  if (seeds.length >= 1500) break;
}

writeFileSync(join(out, 'words.txt'), `${list.sort().join('\n')}\n`);
writeFileSync(join(out, 'seeds.txt'), `${seeds.join('\n')}\n`);
console.log(`${list.length} parole, ${seeds.length} parole di partenza`);
