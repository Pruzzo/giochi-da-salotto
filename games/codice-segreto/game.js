// "Codice segreto": il banco nasconde una fila di 4 pastelli, tutti provano a indovinarla.
// lobby -> hiding -> playing -> reveal -> hiding ... -> final -> lobby
import { GameError, MAX_PLAYERS, Table } from '../shared/table.js';

export { GameError, MAX_PLAYERS };
export const CODE_LENGTH = 4;
export const MAX_ATTEMPTS = 10;
export const COLOR_OPTIONS = [6, 8];
export const DURATIONS = [120, 180, 300, 480];
export const HIDE_MS = 4000; // la TV copre il codice prima di partire
export const FIRST_BONUS = 2;

/** Pallini pieni: pastello giusto al posto giusto. Pallini vuoti: pastello giusto, posto sbagliato. */
export function score(secret, guess) {
  let exact = 0;
  const left = new Map();
  const tried = new Map();
  secret.forEach((c, i) => {
    if (guess[i] === c) exact += 1;
    else {
      left.set(c, (left.get(c) ?? 0) + 1);
      tried.set(guess[i], (tried.get(guess[i]) ?? 0) + 1);
    }
  });
  let near = 0;
  for (const [c, n] of tried) near += Math.min(n, left.get(c) ?? 0);
  return { exact, near };
}

/** Punti di un turno: più presto lo trovi, più vale. Il primo a trovarlo prende un premio. */
export function pointsFor(board) {
  if (!board?.rank) return 0;
  return MAX_ATTEMPTS + 1 - board.guesses.length + (board.rank === 1 ? FIRST_BONUS : 0);
}

export class Game extends Table {
  constructor(options) {
    super(options);
    this.colors = 6;
    this.repeats = false;
    this.durationSec = 180;
    this.resetRounds();
  }

  resetRounds() {
    this.clearPhaseTimer();
    this.phase = 'lobby';
    this.round = 0;
    this.code = null;
    this.boards = new Map(); // playerId -> { guesses: [{ code, exact, near }], rank }
    this.solvers = 0;
    this.history = new Map(); // round -> Map(playerId -> punti)
    this.deadline = null;
  }

  // ---------- Agganci del tavolo ----------

  presenceChanged() {
    this.maybeFinish();
  }

  forget(player) {
    this.boards.delete(player.id);
  }

  hasPlayed(id) {
    return [...this.history.values()].some((round) => round.has(id)) || !!this.boards.get(id)?.guesses.length;
  }

  // ---------- Impostazioni ----------

  setSettings(actor, { colors, repeats, durationSec }) {
    this.requireAdmin(actor);
    this.requirePhase('lobby', 'reveal');
    if (colors !== undefined) {
      if (!COLOR_OPTIONS.includes(colors)) throw new GameError('I pastelli possono essere 6 o 8.');
      this.colors = colors;
    }
    if (repeats !== undefined) this.repeats = !!repeats;
    if (durationSec !== undefined) {
      if (!DURATIONS.includes(durationSec)) throw new GameError('Durata non valida.');
      this.durationSec = durationSec;
    }
    this.changed();
  }

  // ---------- Turno ----------

  makeCode() {
    const pick = () => 1 + Math.floor(this.random() * this.colors);
    if (this.repeats) return Array.from({ length: CODE_LENGTH }, pick);
    const box = Array.from({ length: this.colors }, (_, i) => i + 1);
    return Array.from({ length: CODE_LENGTH }, () => box.splice(Math.floor(this.random() * box.length), 1)[0]);
  }

  startRound(actor) {
    this.requireAdmin(actor);
    this.requirePhase('lobby', 'reveal');
    if (this.players.size < 1) throw new GameError('Serve almeno un giocatore.');
    this.code = this.makeCode();
    this.round += 1;
    this.boards = new Map();
    this.solvers = 0;
    this.phase = 'hiding';
    this.deadline = this.now() + HIDE_MS;
    this.schedule(HIDE_MS, () => this.startPlaying());
    this.changed();
  }

  startPlaying() {
    this.phase = 'playing';
    this.deadline = this.now() + this.durationSec * 1000;
    this.schedule(this.durationSec * 1000, () => this.finishRound());
    this.changed();
  }

  boardOf(id) {
    let board = this.boards.get(id);
    if (!board) {
      board = { guesses: [], rank: null };
      this.boards.set(id, board);
    }
    return board;
  }

  isFinished(board) {
    return !!board && (!!board.rank || board.guesses.length >= MAX_ATTEMPTS);
  }

  guess(actor, code) {
    this.requirePhase('playing');
    if (!Array.isArray(code) || code.length !== CODE_LENGTH
      || !code.every((c) => Number.isInteger(c) && c >= 1 && c <= this.colors)) {
      throw new GameError(`Scegli ${CODE_LENGTH} pastelli prima di provare.`);
    }
    const board = this.boardOf(actor.id);
    if (board.rank) throw new GameError("Hai già trovato il codice!");
    if (board.guesses.length >= MAX_ATTEMPTS) throw new GameError('Hai finito i tentativi.');
    const result = score(this.code, code);
    board.guesses.push({ code: [...code], ...result });
    if (result.exact === CODE_LENGTH) {
      this.solvers += 1;
      board.rank = this.solvers;
    }
    this.maybeFinish();
    this.changed();
    return result;
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
      if (p.connections > 0 || this.boards.has(p.id)) points.set(p.id, pointsFor(this.boards.get(p.id)));
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

  /** Durante il turno tutti vedono i pallini degli altri, ma i pastelli solo i propri. Il codice si svela alla fine. */
  view({ role, player = null }) {
    const open = this.phase === 'reveal' || this.phase === 'final';
    const totals = this.totals();
    const lastRound = this.history.get(this.round);
    const players = [...this.players.values()].map((p) => {
      const board = this.boards.get(p.id);
      return {
        ...this.seat(p),
        total: totals.get(p.id),
        roundPoints: open ? lastRound?.get(p.id) ?? null : null,
        guesses: (board?.guesses ?? []).map((g) => (open ? { ...g, code: [...g.code] } : { exact: g.exact, near: g.near })),
        rank: board?.rank ?? null,
        finished: this.isFinished(board),
      };
    });
    const state = {
      role,
      phase: this.phase,
      round: this.round,
      colors: this.colors,
      repeats: this.repeats,
      durationSec: this.durationSec,
      colorOptions: COLOR_OPTIONS,
      durations: DURATIONS,
      codeLength: CODE_LENGTH,
      maxAttempts: MAX_ATTEMPTS,
      firstBonus: FIRST_BONUS,
      hideMs: HIDE_MS,
      remainingMs: this.deadline ? Math.max(0, this.deadline - this.now()) : null,
      code: open ? [...this.code] : null,
      players,
      ...this.baseView(),
    };
    if (player) {
      const board = this.boards.get(player.id);
      state.you = {
        id: player.id,
        name: player.name,
        isAdmin: player.id === this.adminId,
        guesses: (board?.guesses ?? []).map((g) => ({ ...g, code: [...g.code] })),
        rank: board?.rank ?? null,
        finished: this.isFinished(board),
      };
    }
    return state;
  }
}
