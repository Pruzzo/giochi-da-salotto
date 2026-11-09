// "Anagrammi": lo schermo estrae 8 lettere, tutti scrivono più parole possibili usando solo quelle.
// lobby -> shuffling -> writing -> reveal -> shuffling ... -> final -> lobby
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameError, MAX_PLAYERS, Table } from '../shared/table.js';

export { GameError, MAX_PLAYERS };
export const MIN_LEN = 3;
export const DURATIONS = [60, 90, 120, 180];
export const SHUFFLE_MS = 3500; // le lettere si mescolano sulla TV
export const LENGTH_POINTS = { 3: 1, 4: 2, 5: 3, 6: 5, 7: 8, 8: 12 };
export const UNIQUE_FACTOR = 2; // la parola trovata solo da te vale doppio
const MISSED_SHOWN = 6;

const dataDir = join(dirname(fileURLToPath(import.meta.url)), 'data');
let cached = null;
/** Il dizionario si legge una volta sola, alla prima partita. */
export function loadDictionary() {
  cached ??= {
    words: new Set(readFileSync(join(dataDir, 'words.txt'), 'utf8').split('\n').filter(Boolean)),
    seeds: readFileSync(join(dataDir, 'seeds.txt'), 'utf8').split('\n').filter(Boolean),
  };
  return cached;
}

/** Come la scrive un giocatore: minuscolo, senza accenti né spazi. */
export const plain = (w) => String(w ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z]/g, '');

const counts = (w) => [...w].reduce((m, c) => m.set(c, (m.get(c) ?? 0) + 1), new Map());
/** La parola si può comporre con queste lettere, ognuna usata al massimo una volta? */
export function fits(word, letters) {
  const pool = counts(letters.join(''));
  for (const [c, n] of counts(word)) if ((pool.get(c) ?? 0) < n) return false;
  return true;
}

export const basePoints = (word) => LENGTH_POINTS[Math.min(word.length, 8)] ?? 0;

export class Game extends Table {
  constructor(options = {}) {
    super(options);
    const dict = options.dictionary ?? loadDictionary();
    this.dictionary = dict.words;
    this.seeds = dict.seeds;
    this.durationSec = 120;
    this.resetRounds();
  }

  resetRounds() {
    this.clearPhaseTimer();
    this.phase = 'lobby';
    this.round = 0;
    this.seed = null;
    this.letters = null;
    this.possible = [];
    this.usedSeeds = [];
    this.sheets = new Map(); // playerId -> { words: string[], done: boolean }
    this.results = null; // playerId -> [{ word, base, sharedWith, points }]
    this.history = new Map(); // round -> Map(playerId -> punti)
    this.deadline = null;
  }

  // ---------- Agganci del tavolo ----------

  presenceChanged() {
    this.maybeFinish();
  }

  forget(player) {
    this.sheets.delete(player.id);
  }

  hasPlayed(id) {
    return [...this.history.values()].some((round) => round.has(id)) || !!this.sheets.get(id)?.words.length;
  }

  // ---------- Impostazioni ----------

  setSettings(actor, { durationSec }) {
    this.requireAdmin(actor);
    this.requirePhase('lobby', 'reveal');
    if (durationSec !== undefined) {
      if (!DURATIONS.includes(durationSec)) throw new GameError('Durata non valida.');
      this.durationSec = durationSec;
    }
    this.changed();
  }

  // ---------- Turno ----------

  pickSeed() {
    let pool = this.seeds.filter((w) => !this.usedSeeds.includes(w));
    if (!pool.length) {
      this.usedSeeds = [];
      pool = this.seeds;
    }
    return pool[Math.floor(this.random() * pool.length)];
  }

  /** Mescola finché le lettere non formano più la parola di partenza. */
  shuffle(word) {
    const letters = [...word];
    for (let tries = 0; tries < 20; tries += 1) {
      for (let i = letters.length - 1; i > 0; i -= 1) {
        const j = Math.floor(this.random() * (i + 1));
        [letters[i], letters[j]] = [letters[j], letters[i]];
      }
      if (letters.join('') !== word) break;
    }
    return letters;
  }

  startRound(actor) {
    this.requireAdmin(actor);
    this.requirePhase('lobby', 'reveal');
    if (this.players.size < 1) throw new GameError('Serve almeno un giocatore.');
    this.seed = this.pickSeed();
    this.usedSeeds.push(this.seed);
    this.letters = this.shuffle(this.seed).map((c) => c.toUpperCase());
    const lower = this.letters.map((c) => c.toLowerCase());
    this.possible = [...this.dictionary].filter((w) => w.length >= MIN_LEN && fits(w, lower));
    this.round += 1;
    this.sheets = new Map();
    this.results = null;
    this.phase = 'shuffling';
    this.deadline = this.now() + SHUFFLE_MS;
    this.schedule(SHUFFLE_MS, () => this.startWriting());
    this.changed();
  }

  startWriting() {
    this.phase = 'writing';
    this.deadline = this.now() + this.durationSec * 1000;
    this.schedule(this.durationSec * 1000, () => this.finishRound());
    this.changed();
  }

  sheetOf(id) {
    let sheet = this.sheets.get(id);
    if (!sheet) {
      sheet = { words: [], done: false };
      this.sheets.set(id, sheet);
    }
    return sheet;
  }

  /** Controlla subito la parola: il telefono dice se vale e perché no. */
  submit(actor, raw) {
    this.requirePhase('writing');
    const word = plain(raw);
    const sheet = this.sheetOf(actor.id);
    if (sheet.done) throw new GameError('Hai già consegnato: riapri il foglio per scrivere ancora.');
    if (word.length < MIN_LEN) throw new GameError(`Servono almeno ${MIN_LEN} lettere.`);
    if (!fits(word, this.letters.map((c) => c.toLowerCase()))) throw new GameError(`${word.toUpperCase()} usa lettere che non ci sono.`);
    if (sheet.words.includes(word)) throw new GameError(`${word.toUpperCase()} l'hai già scritta.`);
    if (!this.dictionary.has(word)) throw new GameError(`${word.toUpperCase()} non è nel dizionario.`);
    sheet.words.push(word);
    this.changed();
    return { word, points: basePoints(word) };
  }

  setDone(actor, done) {
    this.requirePhase('writing');
    this.sheetOf(actor.id).done = !!done;
    this.maybeFinish();
    this.changed();
  }

  maybeFinish() {
    if (this.phase !== 'writing') return;
    const online = this.online();
    if (online.length && online.every((p) => this.sheets.get(p.id)?.done)) this.finishRound();
  }

  stopRound(actor) {
    this.requireAdmin(actor);
    this.requirePhase('writing');
    this.finishRound();
  }

  finishRound() {
    this.clearPhaseTimer();
    this.deadline = null;
    this.phase = 'reveal';
    const finders = new Map(); // parola -> [playerId]
    for (const [id, sheet] of this.sheets) for (const w of sheet.words) finders.set(w, [...(finders.get(w) ?? []), id]);
    const nameOf = (id) => this.players.get(id)?.name ?? '?';
    this.results = new Map();
    const points = new Map();
    for (const p of this.players.values()) {
      const sheet = this.sheets.get(p.id);
      if (!sheet && p.connections === 0) continue;
      const rows = (sheet?.words ?? []).map((word) => {
        const sharedWith = finders.get(word).filter((id) => id !== p.id).map(nameOf);
        const base = basePoints(word);
        return { word, base, sharedWith, points: sharedWith.length ? base : base * UNIQUE_FACTOR };
      }).sort((a, b) => b.word.length - a.word.length || a.word.localeCompare(b.word));
      this.results.set(p.id, rows);
      points.set(p.id, rows.reduce((sum, r) => sum + r.points, 0));
    }
    this.history.set(this.round, points);
    this.missed = this.possible
      .filter((w) => !finders.has(w))
      .sort((a, b) => b.length - a.length || a.localeCompare(b))
      .slice(0, MISSED_SHOWN);
    this.changed();
  }

  endGame(actor) {
    this.requireAdmin(actor);
    this.requirePhase('reveal');
    this.phase = 'final';
    this.changed();
  }

  newGame(actor) {
    this.requireAdmin(actor);
    this.resetRounds();
    this.pruneOffline();
    this.changed();
  }

  // ---------- Vista per i client ----------

  totals() {
    const totals = new Map([...this.players.keys()].map((id) => [id, 0]));
    for (const round of this.history.values()) {
      for (const [id, pts] of round) if (totals.has(id)) totals.set(id, totals.get(id) + pts);
    }
    return totals;
  }

  /** Durante il turno gli altri vedono quante parole hai e quanto è lunga la migliore, mai quali. */
  view({ role, player = null }) {
    const open = this.phase === 'reveal' || this.phase === 'final';
    const showLetters = this.letters && (this.phase !== 'shuffling' || role === 'tv');
    const totals = this.totals();
    const lastRound = this.history.get(this.round);
    const players = [...this.players.values()].map((p) => {
      const sheet = this.sheets.get(p.id);
      const words = sheet?.words ?? [];
      return {
        ...this.seat(p),
        total: totals.get(p.id),
        roundPoints: open ? lastRound?.get(p.id) ?? null : null,
        count: words.length,
        longest: words.reduce((m, w) => Math.max(m, w.length), 0),
        done: !!sheet?.done,
        results: open ? this.results?.get(p.id) ?? null : null,
      };
    });
    const state = {
      role,
      phase: this.phase,
      round: this.round,
      durationSec: this.durationSec,
      durations: DURATIONS,
      minLen: MIN_LEN,
      lengthPoints: LENGTH_POINTS,
      uniqueFactor: UNIQUE_FACTOR,
      shuffleMs: SHUFFLE_MS,
      remainingMs: this.deadline ? Math.max(0, this.deadline - this.now()) : null,
      letters: showLetters ? this.letters : null,
      seed: open ? this.seed : null,
      fullWords: open ? this.possible.filter((w) => w.length === this.letters.length) : null,
      possibleCount: open ? this.possible.length : null,
      missed: open ? this.missed : null,
      players,
      ...this.baseView(),
    };
    if (player) {
      const sheet = this.sheets.get(player.id);
      state.you = {
        id: player.id,
        name: player.name,
        isAdmin: player.id === this.adminId,
        words: [...(sheet?.words ?? [])],
        done: !!sheet?.done,
      };
    }
    return state;
  }
}
