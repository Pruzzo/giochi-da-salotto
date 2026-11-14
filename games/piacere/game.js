// "Piacere!": una fila di persone si presenta sulla TV, poi tornano una alla volta sul telefono
// con altri vestiti, mescolate a qualche sconosciuto. Vince chi le riconosce prima e senza sbagliare.
// lobby -> intro -> countdown -> quiz -> reveal -> intro ... -> final -> lobby
import { GameError, MAX_PLAYERS, Table } from '../shared/table.js';
import { makeRound } from './public/js/cast.js';

export { GameError, MAX_PLAYERS };
export const KNOWN_OPTIONS = [4, 6, 8, 10];
export const STRANGER_OPTIONS = [0, 1, 2, 3];
export const LEVELS = ['facile', 'normale', 'difficile'];
export const PACE_OPTIONS = [3, 4, 5];
export const INTRO_LEAD_MS = 2500; // la fila compare tutta in ombra prima della prima presentazione
export const INTRO_TAIL_MS = 1500; // l'ultima resta nella luce un attimo in più
export const COUNTDOWN_MS = 3000;
export const QUIZ_LIMIT_MS = 180000;
export const PENALTY_MS = 5000;
export const POINTS = [10, 8, 6, 5, 4, 3, 2];
export const NONE = 'none'; // la risposta "Non ti conosco"

/** Punti per posizione: 10, 8, 6, 5, 4, 3, 2, poi 1. */
export const pointsForPlace = (place) => POINTS[place - 1] ?? 1;

/**
 * La classifica di un turno. Chi non ha risposto a nessuno resta fuori e prende 0.
 * @param sheets  [{ id, answers: [{ right }], doneMs }]
 * @param length  quante persone tornano nella seconda parte
 */
export function scoreRound(sheets, length) {
  const rows = sheets.filter((s) => s.answers.length).map((s) => {
    const errors = s.answers.filter((a) => !a.right).length + (length - s.answers.length);
    const timeMs = s.doneMs ?? QUIZ_LIMIT_MS;
    return { id: s.id, timeMs, errors, totalMs: timeMs + errors * PENALTY_MS };
  });
  for (const r of rows) {
    r.place = rows.filter((o) => o.totalMs < r.totalMs).length + 1;
    r.points = pointsForPlace(r.place);
  }
  return rows.sort((a, b) => a.totalMs - b.totalMs);
}

export class Game extends Table {
  constructor(options) {
    super(options);
    this.known = 6;
    this.strangers = 2;
    this.level = 'normale';
    this.paceSec = 4;
    this.resetRounds();
  }

  resetRounds() {
    this.clearPhaseTimer();
    this.phase = 'lobby';
    this.round = 0;
    this.cast = null; // { people, intro, quiz }
    this.introIndex = -1;
    this.sheets = new Map(); // playerId -> { answers: [{ pick, right }], doneMs }
    this.startedAt = null;
    this.deadline = null;
    this.history = new Map(); // round -> Map(playerId -> riga della classifica)
  }

  // ---------- Agganci del tavolo ----------

  presenceChanged() {
    this.maybeFinish();
  }

  forget(player) {
    this.sheets.delete(player.id);
  }

  hasPlayed(id) {
    return [...this.history.values()].some((round) => round.has(id)) || !!this.sheets.get(id)?.answers.length;
  }

  // ---------- Impostazioni ----------

  setSettings(actor, { known, strangers, level, paceSec }) {
    this.requireAdmin(actor);
    this.requirePhase('lobby', 'reveal');
    const check = (value, options, message) => {
      if (value !== undefined && !options.includes(value)) throw new GameError(message);
      return value !== undefined;
    };
    if (check(known, KNOWN_OPTIONS, 'Le persone possono essere 4, 6, 8 o 10.')) this.known = known;
    if (check(strangers, STRANGER_OPTIONS, 'Gli sconosciuti vanno da 0 a 3.')) this.strangers = strangers;
    if (check(level, LEVELS, 'Livello non valido.')) this.level = level;
    if (check(paceSec, PACE_OPTIONS, 'Ritmo non valido.')) this.paceSec = paceSec;
    this.changed();
  }

  // ---------- Turno ----------

  get quizLength() {
    return this.cast?.quiz.length ?? 0;
  }

  person(id) {
    return this.cast.people[id];
  }

  startRound(actor) {
    this.requireAdmin(actor);
    this.requirePhase('lobby', 'reveal');
    const racers = this.online();
    if (!racers.length) throw new GameError('Serve almeno un giocatore.');
    this.round += 1;
    this.cast = makeRound(Math.floor(this.random() * 2 ** 32), { known: this.known, strangers: this.strangers, level: this.level });
    // Gioca chi è collegato adesso; chi arriva dopo aspetta il turno successivo.
    this.sheets = new Map(racers.map((p) => [p.id, { answers: [], doneMs: null }]));
    this.phase = 'intro';
    this.introIndex = -1;
    this.startedAt = null;
    this.deadline = this.now() + INTRO_LEAD_MS + this.cast.intro.length * this.paceSec * 1000 + INTRO_TAIL_MS;
    this.schedule(INTRO_LEAD_MS, () => this.nextIntro());
    this.changed();
  }

  nextIntro() {
    this.introIndex += 1;
    const last = this.introIndex >= this.cast.intro.length - 1;
    this.schedule(this.paceSec * 1000 + (last ? INTRO_TAIL_MS : 0), () => (last ? this.startCountdown() : this.nextIntro()));
    this.changed();
  }

  startCountdown() {
    this.phase = 'countdown';
    this.introIndex = -1;
    this.deadline = this.now() + COUNTDOWN_MS;
    this.schedule(COUNTDOWN_MS, () => this.startQuiz());
    this.changed();
  }

  startQuiz() {
    this.phase = 'quiz';
    this.startedAt = this.now();
    this.deadline = this.startedAt + QUIZ_LIMIT_MS;
    this.schedule(QUIZ_LIMIT_MS, () => this.finishRound());
    this.maybeFinish(); // se nel frattempo se ne sono andati tutti
    this.changed();
  }

  /** Una risposta: il nome di una persona della prima parte, o "Non ti conosco". */
  answer(actor, pick) {
    this.requirePhase('quiz');
    const sheet = this.sheets.get(actor.id);
    if (!sheet) throw new GameError('Questo turno è iniziato prima che entrassi: aspetta il prossimo.');
    if (sheet.doneMs !== null) throw new GameError('Hai già risposto a tutti.');
    if (pick !== NONE && !this.cast.intro.includes(pick)) throw new GameError('Scegli un nome o "Non ti conosco".');
    const target = this.person(this.cast.quiz[sheet.answers.length]);
    const right = target.stranger ? pick === NONE : pick === target.id;
    sheet.answers.push({ pick, right });
    if (sheet.answers.length === this.quizLength) sheet.doneMs = this.now() - this.startedAt;
    this.maybeFinish();
    this.changed();
    // Il telefono lo dice subito; gli sconosciuti si presentano dopo la risposta, giusta o no.
    return { right, hello: target.stranger ? target.name : null };
  }

  maybeFinish() {
    if (this.phase !== 'quiz') return;
    const waiting = [...this.sheets.entries()].filter(([id, s]) => s.doneMs === null && (this.players.get(id)?.connections ?? 0) > 0);
    if (!waiting.length) this.finishRound();
  }

  stopRound(actor) {
    this.requireAdmin(actor);
    this.requirePhase('quiz');
    this.finishRound();
  }

  finishRound() {
    this.clearPhaseTimer();
    this.deadline = null;
    this.phase = 'reveal';
    const rows = scoreRound([...this.sheets.entries()].map(([id, s]) => ({ id, ...s })), this.quizLength);
    this.history.set(this.round, new Map(rows.map((r) => [r.id, r])));
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
      for (const [id, row] of round) if (totals.has(id)) totals.set(id, totals.get(id) + row.points);
    }
    return totals;
  }

  /** Come appare una persona: il corpo e i vestiti di una delle due parti, mai il nome. */
  look(id, part) {
    const x = this.person(id);
    return { t: x.t, o: x[part] };
  }

  /**
   * Prima parte: la TV vede la fila e solo il nome di chi si presenta.
   * Seconda parte: ogni telefono vede solo la persona che ha davanti e l'elenco dei nomi; nessuno sa chi è chi.
   * A fine turno si scopre tutto.
   */
  view({ role, player = null }) {
    const open = this.phase === 'reveal' || this.phase === 'final';
    const totals = this.totals();
    const last = this.history.get(this.round);
    const elapsedMs = this.startedAt !== null && this.phase === 'quiz' ? this.now() - this.startedAt : null;
    const racing = this.phase === 'intro' || this.phase === 'countdown' || this.phase === 'quiz';
    const players = [...this.players.values()].map((p) => {
      const sheet = this.sheets.get(p.id);
      const row = open ? last?.get(p.id) ?? null : null;
      return {
        ...this.seat(p),
        total: totals.get(p.id),
        racing: racing && !!sheet,
        marks: sheet ? sheet.answers.map((a) => a.right) : [],
        doneMs: sheet?.doneMs ?? null,
        result: row && { place: row.place, points: row.points, timeMs: row.timeMs, errors: row.errors, totalMs: row.totalMs },
      };
    });
    const state = {
      role,
      phase: this.phase,
      round: this.round,
      known: this.known,
      strangers: this.strangers,
      level: this.level,
      paceSec: this.paceSec,
      knownOptions: KNOWN_OPTIONS,
      strangerOptions: STRANGER_OPTIONS,
      levels: LEVELS,
      paceOptions: PACE_OPTIONS,
      penaltyMs: PENALTY_MS,
      limitMs: QUIZ_LIMIT_MS,
      countdownMs: COUNTDOWN_MS,
      remainingMs: this.deadline ? Math.max(0, this.deadline - this.now()) : null,
      elapsedMs,
      introCount: this.cast?.intro.length ?? this.known,
      quizLength: this.quizLength,
      introIndex: this.introIndex,
      players,
      ...this.baseView(),
    };
    if (this.phase === 'intro' && role === 'tv') {
      state.lineup = this.cast.intro.map((id) => this.look(id, 'first'));
      state.introName = this.introIndex >= 0 ? this.person(this.cast.intro[this.introIndex]).name : null;
    }
    if (open && this.cast) {
      const hits = (i) => [...this.sheets.values()].filter((s) => s.answers[i]?.right).length;
      state.gallery = this.cast.quiz.map((id, i) => ({ ...this.look(id, 'second'), name: this.person(id).name, stranger: this.person(id).stranger, hits: hits(i) }));
      state.racers = this.sheets.size;
    }
    if (player) {
      const sheet = this.sheets.get(player.id);
      const step = sheet?.answers.length ?? 0;
      state.you = {
        id: player.id,
        name: player.name,
        isAdmin: player.id === this.adminId,
        racing: !!sheet,
        step,
        errors: sheet ? sheet.answers.filter((a) => !a.right).length : 0,
        doneMs: sheet?.doneMs ?? null,
        current: this.phase === 'quiz' && sheet && step < this.quizLength ? this.look(this.cast.quiz[step], 'second') : null,
        names: this.phase === 'quiz' && sheet
          ? this.cast.intro.map((id) => ({ id, name: this.person(id).name })).sort((a, b) => (a.name < b.name ? -1 : 1)) // niente Intl: sul Node di Android non c'è
          : [],
        answers: open && sheet
          ? this.cast.quiz.map((id, i) => {
            const a = sheet.answers[i];
            return {
              ...this.look(id, 'second'),
              name: this.person(id).name,
              stranger: this.person(id).stranger,
              answered: !!a,
              said: a && a.pick !== NONE ? this.person(a.pick).name : null,
              right: !!a?.right,
            };
          })
          : [],
      };
    }
    return state;
  }
}
