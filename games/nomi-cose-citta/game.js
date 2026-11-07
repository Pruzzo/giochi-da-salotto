// Macchina a stati della partita. Nessuna dipendenza da rete: testabile da sola.
// lobby -> spinning -> writing -> review -> scored -> spinning ... -> final -> lobby
import { randomUUID } from 'node:crypto';

export const LETTERS = 'ABCDEFGHILMNOPQRSTUVZ'.split('');
export const DEFAULT_CATEGORIES = ['Nomi', 'Cose', 'Città', 'Animali', 'Mestieri'];
export const DURATIONS = [30, 45, 60, 90, 120, 180];
export const SPIN_MS = 6500; // la ruota gira
export const HOLD_MS = 2500; // la lettera resta in scena prima di scrivere
export const MAX_PLAYERS = 12;
const MAX_WORD = 40;
const MAX_NAME = 16;
const MAX_CATEGORY = 16;
export const SCORES = [0, 1, 3];

export class GameError extends Error {}

/** Minuscolo, senza accenti e spazi superflui: "Città " e "citta" sono la stessa parola. */
export function normalize(word) {
  return String(word ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export class Game {
  constructor({ random = Math.random, now = Date.now, setTimer = setTimeout, clearTimer = clearTimeout, onChange = () => {} } = {}) {
    Object.assign(this, { random, now, setTimer, clearTimer, onChange });
    this.players = new Map();
    this.adminId = null;
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

  clearPhaseTimer() {
    if (this.timer) this.clearTimer(this.timer);
    this.timer = null;
  }

  // ---------- Giocatori ----------

  join({ name, token, admin = false }) {
    let player = token ? [...this.players.values()].find((p) => p.token === token) : null;
    if (!player) {
      const clean = String(name ?? '').trim().replace(/\s+/g, ' ').slice(0, MAX_NAME);
      if (!clean) throw new GameError('Scrivi il tuo nome per entrare.');
      const twin = [...this.players.values()].find((p) => normalize(p.name) === normalize(clean));
      if (twin && twin.connections > 0) throw new GameError(`C'è già un giocatore che si chiama ${twin.name}. Scegli un altro nome.`);
      if (twin) {
        player = twin; // stessa persona che torna da un altro dispositivo
      } else {
        if (this.players.size >= MAX_PLAYERS) throw new GameError(`La partita è piena: massimo ${MAX_PLAYERS} giocatori.`);
        player = { id: randomUUID(), token: randomUUID(), name: clean, connections: 0 };
        this.players.set(player.id, player);
      }
    }
    if (admin) this.claimAdmin(player);
    this.changed();
    return player;
  }

  claimAdmin(player) {
    const current = this.players.get(this.adminId);
    if (current && current !== player && current.connections > 0) {
      throw new GameError(`L'amministratore è già ${current.name}. Entra come giocatore.`);
    }
    this.adminId = player.id;
  }

  connect(player) {
    player.connections += 1;
    this.changed();
  }

  disconnect(player) {
    player.connections = Math.max(0, player.connections - 1);
    this.maybeFinishWriting();
    this.changed();
  }

  leave(player) {
    if (this.adminId === player.id) this.adminId = null;
    player.connections = 0;
    if (this.phase === 'lobby' || !this.hasPlayed(player.id)) this.players.delete(player.id);
    else player.token = randomUUID(); // resta in classifica, ma il vecchio dispositivo perde il posto
    this.sheets.delete(player.id);
    if (this.focusId === player.id) this.focusId = null;
    this.maybeFinishWriting();
    this.changed();
  }

  hasPlayed(id) {
    return [...this.history.values()].some((round) => round.has(id)) || !!this.marks?.some((row) => row.playerId === id);
  }

  requireAdmin(actor) {
    if (!actor || actor.id !== this.adminId) throw new GameError("Solo l'amministratore può farlo.");
  }

  requirePhase(...phases) {
    if (!phases.includes(this.phase)) throw new GameError('Questa azione non è disponibile adesso.');
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

  removePlayer(actor, playerId) {
    this.requireAdmin(actor);
    this.requirePhase('lobby');
    if (playerId === actor.id) throw new GameError('Non puoi togliere te stesso.');
    const removed = this.players.get(playerId);
    if (!removed) return null;
    this.players.delete(playerId);
    this.changed();
    return removed;
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

  schedule(ms, fn) {
    this.clearPhaseTimer();
    this.timer = this.setTimer(fn, ms);
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
    const online = [...this.players.values()].filter((p) => p.connections > 0);
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
    for (const p of [...this.players.values()]) if (p.connections === 0) this.players.delete(p.id);
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
        id: p.id,
        name: p.name,
        online: p.connections > 0,
        isAdmin: p.id === this.adminId,
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
      adminId: this.adminId,
      adminOnline: (this.players.get(this.adminId)?.connections ?? 0) > 0,
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

  changed() {
    this.onChange();
  }
}
