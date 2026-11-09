// "L'impiccato": lo schermo sceglie la parola, ognuno la indovina dal suo telefono, a gara.
// lobby -> choosing -> playing -> reveal -> choosing ... -> final -> lobby
import { GameError, MAX_PLAYERS, Table } from '../shared/table.js';
import { SHORT_MAX, WORDS } from './words.js';

export { GameError, MAX_PLAYERS };
export const LETTERS = 'ABCDEFGHILMNOPQRSTUVZ'.split('');
export const MAX_ERRORS = 6;
export const DURATIONS = [60, 90, 120, 180];
export const LENGTHS = ['short', 'long', 'any'];
export const CHOOSE_MS = 3500; // la TV disegna le caselle della parola
export const BASE_POINTS = 10;
export const SPEED_POINTS = 5;

/** Lettere scoperte all'inizio: la prima e l'ultima, ovunque compaiano nella parola. */
export function startingLetters(word) {
  return new Set([word[0], word.at(-1)]);
}

export function pattern(word, known) {
  return [...word].map((c) => (known.has(c) ? c : null));
}

/** 10 punti per la parola, meno 1 per ogni errore, più fino a 5 per la velocità. */
export function pointsFor(board, durationMs) {
  if (!board?.solvedMs && board?.solvedMs !== 0) return 0;
  const speed = Math.round(SPEED_POINTS * Math.max(0, 1 - board.solvedMs / durationMs));
  return Math.max(1, BASE_POINTS - board.errors + speed);
}

const clean = (s) => String(s ?? '').normalize('NFD').replace(/\p{M}/gu, '').toUpperCase().replace(/[^A-Z]/g, '');

export class Game extends Table {
  constructor(options) {
    super(options);
    this.durationSec = 120;
    this.length = 'any';
    this.words = WORDS;
    this.resetRounds();
  }

  resetRounds() {
    this.clearPhaseTimer();
    this.phase = 'lobby';
    this.round = 0;
    this.word = null;
    this.usedWords = [];
    this.boards = new Map(); // playerId -> { tried: Set, wrong: [], wordTries: [], errors, solvedMs, hanged }
    this.history = new Map(); // round -> Map(playerId -> punti)
    this.deadline = null;
    this.startedAt = null;
  }

  // ---------- Agganci del tavolo ----------

  presenceChanged() {
    this.maybeFinish();
  }

  forget(player) {
    this.boards.delete(player.id);
  }

  hasPlayed(id) {
    const b = this.boards.get(id);
    return [...this.history.values()].some((round) => round.has(id)) || !!(b && (b.tried.size || b.wordTries.length));
  }

  // ---------- Impostazioni ----------

  setSettings(actor, { durationSec, length }) {
    this.requireAdmin(actor);
    this.requirePhase('lobby', 'reveal');
    if (durationSec !== undefined) {
      if (!DURATIONS.includes(durationSec)) throw new GameError('Durata non valida.');
      this.durationSec = durationSec;
    }
    if (length !== undefined) {
      if (!LENGTHS.includes(length)) throw new GameError('Lunghezza non valida.');
      this.length = length;
    }
    this.changed();
  }

  // ---------- Turno ----------

  pickWord() {
    const fits = (w) => this.length === 'any' || (this.length === 'short' ? w.length <= SHORT_MAX : w.length > SHORT_MAX);
    let pool = this.words.filter((w) => fits(w) && !this.usedWords.includes(w));
    if (!pool.length) {
      this.usedWords = this.usedWords.filter((w) => !fits(w));
      pool = this.words.filter(fits);
    }
    return pool[Math.floor(this.random() * pool.length)];
  }

  startRound(actor) {
    this.requireAdmin(actor);
    this.requirePhase('lobby', 'reveal');
    if (this.players.size < 1) throw new GameError('Serve almeno un giocatore.');
    this.word = this.pickWord();
    this.usedWords.push(this.word);
    this.round += 1;
    this.boards = new Map();
    this.phase = 'choosing';
    this.deadline = this.now() + CHOOSE_MS;
    this.schedule(CHOOSE_MS, () => this.startPlaying());
    this.changed();
  }

  startPlaying() {
    this.phase = 'playing';
    this.startedAt = this.now();
    this.deadline = this.startedAt + this.durationSec * 1000;
    this.schedule(this.durationSec * 1000, () => this.finishRound());
    this.changed();
  }

  boardOf(id) {
    let board = this.boards.get(id);
    if (!board) {
      board = { tried: new Set(), wrong: [], wordTries: [], errors: 0, solvedMs: null, hanged: false };
      this.boards.set(id, board);
    }
    return board;
  }

  isFinished(board) {
    return !!board && (board.solvedMs !== null || board.hanged);
  }

  known(board) {
    const known = startingLetters(this.word);
    for (const c of board?.tried ?? []) if (this.word.includes(c)) known.add(c);
    return known;
  }

  playable(actor) {
    this.requirePhase('playing');
    const board = this.boardOf(actor.id);
    if (board.solvedMs !== null) throw new GameError("Hai già indovinato la parola!");
    if (board.hanged) throw new GameError('Sei stato impiccato: aspetta il prossimo turno.');
    return board;
  }

  miss(board) {
    board.errors += 1;
    if (board.errors >= MAX_ERRORS) board.hanged = true;
  }

  solve(board) {
    board.solvedMs = this.now() - this.startedAt;
  }

  guessLetter(actor, letter) {
    const board = this.playable(actor);
    const c = clean(letter);
    if (c.length !== 1 || !LETTERS.includes(c)) throw new GameError('Scegli una lettera.');
    if (board.tried.has(c) || startingLetters(this.word).has(c)) throw new GameError(`La ${c} l'hai già provata.`);
    board.tried.add(c);
    const hit = this.word.includes(c);
    if (!hit) {
      board.wrong.push(c);
      this.miss(board);
    } else if (pattern(this.word, this.known(board)).every(Boolean)) {
      this.solve(board);
    }
    this.after();
    return { hit };
  }

  guessWord(actor, word) {
    const board = this.playable(actor);
    const w = clean(word);
    if (w.length < 2) throw new GameError('Scrivi la parola intera.');
    const hit = w === this.word;
    if (hit) this.solve(board);
    else {
      board.wordTries.push(w);
      this.miss(board);
    }
    this.after();
    return { hit };
  }

  after() {
    this.maybeFinish();
    this.changed();
  }

  maybeFinish() {
    if (this.phase !== 'playing') return;
    const online = this.online();
    if (online.length && online.every((p) => this.isFinished(this.boards.get(p.id)))) this.finishRound();
  }

  stopRound(actor) {
    this.requireAdmin(actor);
    this.requirePhase('playing');
    this.finishRound();
  }

  finishRound() {
    this.clearPhaseTimer();
    this.deadline = null;
    this.phase = 'reveal';
    const points = new Map();
    for (const p of this.players.values()) {
      if (p.connections > 0 || this.boards.has(p.id)) points.set(p.id, pointsFor(this.boards.get(p.id), this.durationSec * 1000));
    }
    this.history.set(this.round, points);
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

  /**
   * Durante il turno la TV e gli altri vedono solo errori, tempo ed esito di ciascuno:
   * nessuna lettera, giusta o sbagliata, finché la parola non si svela.
   */
  view({ role, player = null }) {
    const open = this.phase === 'reveal' || this.phase === 'final';
    const showSkeleton = this.word && (this.phase !== 'choosing' || role === 'tv');
    const totals = this.totals();
    const lastRound = this.history.get(this.round);
    const players = [...this.players.values()].map((p) => {
      const b = this.boards.get(p.id);
      return {
        ...this.seat(p),
        total: totals.get(p.id),
        roundPoints: open ? lastRound?.get(p.id) ?? null : null,
        errors: b?.errors ?? 0,
        solvedMs: b?.solvedMs ?? null,
        hanged: !!b?.hanged,
        finished: this.isFinished(b),
        played: !!b && (b.tried.size > 0 || b.wordTries.length > 0),
        wrong: open ? [...(b?.wrong ?? []), ...(b?.wordTries ?? [])] : null,
      };
    });
    const state = {
      role,
      phase: this.phase,
      round: this.round,
      durationSec: this.durationSec,
      length: this.length,
      durations: DURATIONS,
      lengths: LENGTHS,
      shortMax: SHORT_MAX,
      maxErrors: MAX_ERRORS,
      letters: LETTERS,
      chooseMs: CHOOSE_MS,
      remainingMs: this.deadline ? Math.max(0, this.deadline - this.now()) : null,
      skeleton: showSkeleton ? pattern(this.word, startingLetters(this.word)) : null,
      word: open ? this.word : null,
      players,
      ...this.baseView(),
    };
    if (player) {
      const b = this.boards.get(player.id);
      state.you = {
        id: player.id,
        name: player.name,
        isAdmin: player.id === this.adminId,
        pattern: this.phase === 'playing' ? pattern(this.word, this.known(b)) : null,
        tried: [...(b?.tried ?? [])],
        wrong: [...(b?.wrong ?? [])],
        wordTries: [...(b?.wordTries ?? [])],
        errors: b?.errors ?? 0,
        solvedMs: b?.solvedMs ?? null,
        hanged: !!b?.hanged,
        finished: this.isFinished(b),
      };
    }
    return state;
  }
}
