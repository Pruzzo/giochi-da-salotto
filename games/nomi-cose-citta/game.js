// Macchina a stati della partita. Nessuna dipendenza da rete: testabile da sola.
// lobby -> spinning -> writing -> review -> scored -> spinning ... -> final -> lobby
import { GameError, MAX_PLAYERS, normalize, Table } from '../shared/table.js';

export { GameError, MAX_PLAYERS, normalize };
export const LETTERS = 'ABCDEFGHILMNOPQRSTUVZ'.split('');
export const DEFAULT_CATEGORIES = ['Nomi', 'Cose', 'Città', 'Animali', 'Mestieri'];
export const DURATIONS = [30, 45, 60, 90, 120, 180];
export const SPIN_MS = 6500; // la ruota gira
export const HOLD_MS = 2500; // la lettera resta in scena prima di scrivere
const MAX_WORD = 40;
const MAX_CATEGORY = 16;
export const SCORES = [0, 1, 3];

export class Game extends Table {
  constructor(options) {
    super(options);
    this.categories = [...DEFAULT_CATEGORIES];
    this.durationSec = 60;
    this.resetRounds();
  }

  resetRounds() {
    this.clearPhaseTimer();
    this.phase = 'lobby';
    this.round = 0;
    this.letter = null;
    this.usedLetters = [];
    this.sheets = new Map(); // playerId -> { words: string[], done: boolean }
    this.marks = null; // rows della correzione in corso
    this.focusId = null;
    this.history = new Map(); // round -> Map(playerId -> punti)
    this.deadline = null;
    this.spin = null;
  }

  // ---------- Agganci del tavolo ----------

  presenceChanged() {
    this.maybeFinishWriting();
  }

  forget(player) {
    this.sheets.delete(player.id);
    if (this.focusId === player.id) this.focusId = null;
  }

  hasPlayed(id) {
    return [...this.history.values()].some((round) => round.has(id)) || !!this.marks?.some((row) => row.playerId === id);
  }

  // ---------- Impostazioni ----------

  setSettings(actor, { categories, durationSec }) {
    this.requireAdmin(actor);
    this.requirePhase('lobby');
    if (categories !== undefined) {
      if (!Array.isArray(categories) || categories.length !== 5) throw new GameError('Le categorie devono essere 5.');
      const clean = categories.map((c) => String(c ?? '').trim().slice(0, MAX_CATEGORY));
      this.categories = clean.map((c, i) => c || this.categories[i]);
    }
    if (durationSec !== undefined) {
      if (!DURATIONS.includes(durationSec)) throw new GameError('Durata non valida.');
      this.durationSec = durationSec;
    }
    this.changed();
  }

  // ---------- Turno ----------

  startRound(actor) {
    this.requireAdmin(actor);
    this.requirePhase('lobby', 'scored');
    if (this.players.size < 1) throw new GameError('Serve almeno un giocatore.');
    if (this.usedLetters.length >= LETTERS.length) this.usedLetters = [];
    const free = LETTERS.filter((l) => !this.usedLetters.includes(l));
    this.letter = free[Math.floor(this.random() * free.length)];
    this.usedLetters.push(this.letter);
    this.round += 1;
    this.marks = null;
    this.focusId = null;
    this.sheets = new Map();
    this.phase = 'spinning';
    const total = SPIN_MS + HOLD_MS;
    this.spin = { letterIndex: LETTERS.indexOf(this.letter), jitter: (this.random() - 0.5) * 0.6, spinMs: SPIN_MS };
    this.deadline = this.now() + total;
    this.schedule(total, () => this.startWriting());
    this.changed();
  }

  startWriting() {
    this.phase = 'writing';
    this.deadline = this.now() + this.durationSec * 1000;
    this.schedule(this.durationSec * 1000, () => this.finishWriting());
    this.changed();
  }

  sheetOf(playerId) {
    let sheet = this.sheets.get(playerId);
    if (!sheet) {
      sheet = { words: ['', '', '', '', ''], done: false };
      this.sheets.set(playerId, sheet);
    }
    return sheet;
  }

  saveWord(actor, index, word) {
    this.requirePhase('writing');
    if (!Number.isInteger(index) || index < 0 || index > 4) throw new GameError('Categoria non valida.');
    this.sheetOf(actor.id).words[index] = String(word ?? '').slice(0, MAX_WORD);
    this.changed();
  }

  setDone(actor, done) {
    this.requirePhase('writing');
    this.sheetOf(actor.id).done = !!done;
    this.maybeFinishWriting();
    this.changed();
  }

  maybeFinishWriting() {
    if (this.phase !== 'writing') return;
    const online = this.online();
    if (online.length && online.every((p) => this.sheets.get(p.id)?.done)) this.finishWriting();
  }

  stopWriting(actor) {
    this.requireAdmin(actor);
    this.requirePhase('writing');
    this.finishWriting();
  }

  finishWriting() {
    this.clearPhaseTimer();
    this.deadline = null;
    this.phase = 'review';
    this.marks = this.buildMarks();
    this.focusId = this.marks[0]?.playerId ?? null;
    this.changed();
  }

  /** Propone i punti: 3 parola unica, 1 doppione, 0 se vuota o con l'iniziale sbagliata. */
  buildMarks() {
    const target = normalize(this.letter);
    const participants = [...this.players.values()].filter((p) => p.connections > 0 || this.sheets.has(p.id));
    const rows = participants.map((p) => {
      const words = this.sheetOf(p.id).words;
      return { playerId: p.id, name: p.name, cells: words.map((raw) => {
        const text = raw.trim().replace(/\s+/g, ' ');
        const key = normalize(text);
        return { text, key, empty: !key, wrongLetter: !!key && !key.startsWith(target), duplicateOf: [], score: 0, confirmed: false };
      }) };
    });
    for (let c = 0; c < 5; c += 1) {
      const valid = rows.filter((r) => !r.cells[c].empty && !r.cells[c].wrongLetter);
      for (const row of valid) {
        const cell = row.cells[c];
        const others = valid.filter((o) => o !== row && o.cells[c].key === cell.key);
        cell.duplicateOf = others.map((o) => o.name);
        cell.score = others.length ? 1 : 3;
      }
    }
    return rows;
  }

  setScore(actor, playerId, index, score) {
    this.requireAdmin(actor);
    this.requirePhase('review');
    if (!SCORES.includes(score)) throw new GameError('Il punteggio può essere 0, 1 o 3.');
    const row = this.marks.find((r) => r.playerId === playerId);
    const cell = row?.cells[index];
    if (!cell) throw new GameError('Parola non trovata.');
    Object.assign(cell, { score, confirmed: true });
    this.focusId = playerId;
    this.changed();
  }

  setFocus(actor, playerId) {
    this.requireAdmin(actor);
    this.requirePhase('review');
    if (this.marks.some((r) => r.playerId === playerId)) this.focusId = playerId;
    this.changed();
  }

  confirmRound(actor) {
    this.requireAdmin(actor);
    this.requirePhase('review');
    const points = new Map();
    for (const row of this.marks) {
      row.cells.forEach((c) => { c.confirmed = true; });
      points.set(row.playerId, row.cells.reduce((sum, c) => sum + c.score, 0));
    }
    this.history.set(this.round, points);
    this.phase = 'scored';
    this.focusId = null;
    this.changed();
  }

  reopenRound(actor) {
    this.requireAdmin(actor);
    this.requirePhase('scored');
    this.history.delete(this.round);
    this.phase = 'review';
    this.focusId = this.marks[0]?.playerId ?? null;
    this.changed();
  }

  endGame(actor) {
    this.requireAdmin(actor);
    this.requirePhase('scored');
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

  /** Le parole restano private finché il tempo non scade; la lettera solo sulla TV durante la ruota. */
  view({ role, player = null }) {
    const totals = this.totals();
    const writing = this.phase === 'writing';
    const lastRound = this.history.get(this.round);
    const players = [...this.players.values()].map((p) => {
      const sheet = this.sheets.get(p.id);
      return {
        ...this.seat(p),
        total: totals.get(p.id),
        roundPoints: lastRound?.get(p.id) ?? null,
        filled: writing && sheet ? sheet.words.map((w) => !!w.trim()) : [false, false, false, false, false],
        done: writing && !!sheet?.done,
      };
    });
    const showLetter = this.phase !== 'spinning' || role === 'tv';
    const state = {
      role,
      phase: this.phase,
      round: this.round,
      categories: this.categories,
      durationSec: this.durationSec,
      players,
      ...this.baseView(),
      letter: showLetter ? this.letter : null,
      letters: LETTERS,
      usedLetters: this.usedLetters,
      remainingMs: this.deadline ? Math.max(0, this.deadline - this.now()) : null,
      spin: this.phase === 'spinning' ? { ...this.spin, holdMs: HOLD_MS, totalMs: SPIN_MS + HOLD_MS } : null,
      durations: DURATIONS,
      focusId: this.focusId,
      rows: this.marks?.map((row) => ({
        playerId: row.playerId,
        name: row.name,
        points: row.cells.reduce((sum, c) => sum + c.score, 0),
        cells: row.cells.map(({ key, ...cell }) => cell),
      })) ?? null,
    };
    if (player) {
      state.you = { id: player.id, name: player.name, isAdmin: player.id === this.adminId };
      if (writing) state.sheet = { ...this.sheetOf(player.id), words: [...this.sheetOf(player.id).words] };
    }
    return state;
  }

}
