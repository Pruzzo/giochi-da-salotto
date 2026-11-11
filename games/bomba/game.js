// Le regole di "Disinnesca la bomba": una bomba per squadra, l'artificiere la smonta, l'esperto legge il manuale.
// Le regole sono in docs/Giochi-a-squadre.md, "Disinnesca la bomba". Nessuna dipendenza di rete.
// Squadre, ruoli, turni e pause sono di TeamTable (games/shared/teams.js); i moduli sono in modules.js.
import { GameError } from '../shared/table.js';
import { TeamTable } from '../shared/teams.js';
import { MODULES, MODULE_TYPES, isRight, makeSerial, shuffle } from './modules.js';

export const ROLES = [
  { id: 'artificiere', label: 'Artificiere' },
  { id: 'esperto', label: 'Esperto' },
];
export const MAX_ERRORS = 3;
export const DURATIONS = [180, 240, 300, 360];
export const MODULE_COUNTS = [3, 4, 5];

const clone = (value) => JSON.parse(JSON.stringify(value));

export class Game extends TeamTable {
  constructor(options = {}) {
    super({
      roles: ROLES,
      settings: { defaults: { durationSec: 300, modules: 3 }, options: { durationSec: DURATIONS, modules: MODULE_COUNTS } },
      ...options,
    });
    this.faces = 0; // ogni faccia nuova ha un numero: un tocco arrivato in ritardo sulla faccia vecchia non conta
  }

  // ---------- La bomba ----------

  /** Una bomba nuova per la squadra, con un numero di serie che nessun'altra squadra ha in questo turno. */
  setupTeam(team) {
    const taken = new Set(this.teams.filter((t) => t !== team && t.board?.round === this.round).map((t) => t.board.serial));
    let serial;
    do serial = makeSerial(this.random); while (taken.has(serial));
    const types = shuffle(this.random, MODULE_TYPES).slice(0, this.settings.modules);
    return {
      round: this.round,
      serial,
      errors: 0,
      modules: types.map((type) => ({ type, face: MODULES[type].make(this.random, serial, null), step: 0, solved: false, faceId: ++this.faces })),
    };
  }

  /**
   * L'artificiere fa una mossa su un modulo: taglia, preme, conferma.
   * @param index   quale modulo
   * @param faceId  la faccia che aveva davanti (se nel frattempo è cambiata, il tocco non conta)
   * @param value   la mossa, nel formato del modulo
   * Risponde { right } oppure { stale: true } se il tocco era per una faccia che non c'è più.
   */
  answer(actor, index, faceId, value) {
    const team = this.playingTeam(actor);
    if (this.roleOf(team, actor.id) !== 'artificiere') throw new GameError('La bomba ce l’ha l’artificiere: tu hai il manuale.');
    const board = team.board;
    const mod = board.modules[index];
    if (!mod) throw new GameError('Questo modulo non c’è.');
    if (mod.solved || mod.faceId !== faceId) return { stale: true };
    const type = MODULES[mod.type];
    const move = type.parse(value, mod.face);
    if (move === null) throw new GameError('Questa mossa non si può fare.');
    const right = isRight(mod.type, mod.face, board.serial, move);
    type.after?.(mod.face, move, right);
    if (right) {
      mod.step += 1;
      if (mod.step >= type.steps) mod.solved = true;
      else this.newFace(mod, board);
    } else {
      board.errors += 1;
      // Nei moduli a passi l'errore fa ricominciare il passo con valori nuovi.
      if (type.steps > 1) this.newFace(mod, board);
    }
    if (board.errors >= MAX_ERRORS) this.finishTeam(team, { success: false, reason: 'errors' });
    else if (board.modules.every((m) => m.solved)) this.finishTeam(team, { success: true });
    this.changed();
    return { right };
  }

  newFace(mod, board) {
    mod.face = MODULES[mod.type].make(this.random, board.serial, mod.face);
    mod.faceId = ++this.faces;
  }

  // ---------- Agganci di TeamTable ----------

  /** Il turno si chiude con la bomba ancora attiva: scoppia allo scadere del tempo, o si ferma se l'ha fermato l'amministratore. */
  teamTimeout() {
    return { success: false, reason: (this.remainingMs() ?? 0) > 1000 ? 'stopped' : 'time' };
  }

  /** 10 punti, +1 ogni 10 secondi rimasti, -2 per errore (minimo 1); +3 alla prima squadra; 0 a chi scoppia. */
  teamPoints(team) {
    if (!team.outcome?.success) return 0;
    const base = Math.max(1, 10 + Math.floor((team.remainingMs ?? 0) / 10_000) - 2 * team.board.errors);
    return base + (team.rank === 1 ? 3 : 0);
  }

  /**
   * L'artificiere della squadra vede la sua bomba, numero di serie compreso.
   * Tutti gli altri (TV, esperto, altre squadre) solo gli errori e quali moduli sono risolti.
   */
  teamView(team, viewer) {
    const { board } = team;
    const view = { errors: board.errors, maxErrors: MAX_ERRORS, solved: board.modules.map((m) => m.solved) };
    if (viewer.role !== 'player' || !viewer.member || viewer.teamRole !== 'artificiere') return view;
    return {
      ...view,
      serial: board.serial,
      modules: board.modules.map((m) => ({
        type: m.type, face: clone(m.face), faceId: m.faceId, step: m.step, steps: MODULES[m.type].steps, solved: m.solved,
      })),
    };
  }
}
