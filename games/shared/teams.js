// Il tavolo dei giochi a squadre da due: scelta del colore, nome, ruoli, turni, chi aspetta.
// lobby -> teams -> briefing -> playing -> result -> (teams | briefing) ... -> final -> lobby
// Le regole sono in docs/Giochi-a-squadre.md, "Regole comuni dei giochi a squadre".
// Ogni gioco estende TeamTable e definisce:
//   setupTeam(team)            prepara team.board per il turno (labirinto, bomba…)
//   teamTimeout(team)          il tempo è finito e la squadra non aveva finito
//   teamPoints(team)           punti del turno per la squadra (li prendono tutti e due)
//   teamView(team, viewer)     cosa vede di quella squadra { role: 'tv'|'player', player, member, teamRole }
// e chiama this.playingTeam(actor) nelle sue azioni (controlla fase, pausa e squadra, non il ruolo: quello lo
// controlla il gioco), this.finishTeam(team, outcome) quando una squadra ha finito.
import { GameError, Table } from './table.js';

export const TEAM_COLORS = [
  { id: 'rosso', name: 'Rossa', hex: '#d7263d' },
  { id: 'blu', name: 'Blu', hex: '#2f5bd3' },
  { id: 'verde', name: 'Verde', hex: '#2e9e4f' },
  { id: 'giallo', name: 'Gialla', hex: '#f6cd1a' },
  { id: 'viola', name: 'Viola', hex: '#8a4fc7' },
  { id: 'arancione', name: 'Arancione', hex: '#f08a24' },
];
export const TEAM_SIZE = 2;
export const MAX_TEAM_NAME = 20;
const NO_PAUSE = null;

/** Le azioni comuni dei giochi a squadre, da passare a openRoom insieme a quelle del gioco. */
export function teamActions(game) {
  return {
    start: (p) => game.start(p),
    pickTeam: (p, a) => game.pickTeam(p, a.teamId),
    setTeamName: (p, a) => game.setTeamName(p, a.name),
    chooseRole: (p, a) => game.chooseRole(p, a.roleId),
    setSettings: (p, a) => game.setSettings(p, a.values),
    go: (p) => game.go(p),
    stopTurn: (p) => game.stopTurn(p),
    nextTurn: (p) => game.nextTurn(p),
    endGame: (p) => game.endGame(p),
    newGame: (p) => game.newGame(p),
  };
}

export class TeamTable extends Table {
  /**
   * @param roles     [{ id, label }, { id, label }] i due ruoli della squadra
   * @param settings  { defaults: { durationSec, ... }, options: { durationSec: [...], ... } }
   */
  constructor({ roles, settings, ...options } = {}) {
    super(options);
    if (roles?.length !== TEAM_SIZE) throw new Error('Un gioco a squadre ha esattamente due ruoli.');
    this.roles = roles;
    this.settingOptions = settings.options;
    this.settings = { ...settings.defaults };
    this.arrivals = 0;
    this.resetGame();
  }

  resetGame() {
    this.clearPhaseTimer();
    this.phase = 'lobby';
    this.round = 0;
    this.teams = []; // [{ id, color, name, members: [playerId], roles: Map(playerId -> roleId), fixed, board, done, outcome, rank, remainingMs }]
    this.choosing = []; // chi sta scegliendo la squadra, in ordine di arrivo
    this.history = new Map(); // round -> Map(playerId -> punti)
    this.deadline = null;
    this.paused = NO_PAUSE; // { remainingMs, name } quando in due qualcuno si è disconnesso
    this.finishers = 0;
    for (const p of this.players.values()) p.teamId = null;
  }

  // ---------- Agganci del tavolo ----------

  join(request) {
    const player = super.join(request);
    if (player.arrived === undefined) {
      player.arrived = ++this.arrivals;
      player.teamId = null;
    }
    return player;
  }

  hasPlayed(id) {
    return !!this.players.get(id)?.teamId || [...this.history.values()].some((round) => round.has(id));
  }

  presenceChanged() {
    this.updatePause();
  }

  /** Chi esce lascia la squadra. Nella scelta e nelle istruzioni la squadra si riaggiusta subito, in gioco a fine turno. */
  forget(player) {
    this.choosing = this.choosing.filter((id) => id !== player.id);
    const team = this.teamOf(player);
    player.teamId = null;
    if (team) {
      team.members = team.members.filter((id) => id !== player.id);
      team.roles.delete(player.id);
    }
    if (this.phase === 'teams' || this.phase === 'briefing') this.dissolveBroken();
    if (this.phase === 'teams') this.reshapeChoice();
    else if (this.phase === 'briefing' && !this.teams.length) this.backToLobby();
  }

  connect(player) {
    player.connections += 1;
    this.updatePause();
    this.changed();
  }

  removePlayer(actor, playerId) {
    this.requireAdmin(actor);
    this.requirePhase('lobby', 'teams', 'briefing', 'result');
    if (playerId === actor.id) throw new GameError('Non puoi togliere te stesso.');
    const removed = this.players.get(playerId);
    if (!removed) return null;
    this.players.delete(playerId);
    this.forget(removed);
    this.changed();
    return removed;
  }

  // ---------- Squadre ----------

  teamOf(player) {
    return player?.teamId ? this.teams.find((t) => t.id === player.teamId) ?? null : null;
  }

  displayName(team) {
    return team.name || `Squadra ${team.color.name}`;
  }

  /** Chi non è in squadra, in ordine di arrivo. */
  waitingPlayers() {
    return [...this.players.values()].filter((p) => !p.teamId).sort((a, b) => a.arrived - b.arrived);
  }

  start(actor) {
    this.requireAdmin(actor);
    this.requirePhase('lobby');
    const n = this.players.size;
    if (n < TEAM_SIZE) throw new GameError('Servono almeno 2 giocatori.');
    if (n % TEAM_SIZE) throw new GameError(`Siete in ${n}: serve un numero pari di giocatori.`);
    this.beginChoice();
    this.changed();
  }

  /** Chi aspetta sceglie la squadra; se sono dispari l'ultimo arrivato aspetta ancora. Le squadre già fatte restano. */
  beginChoice() {
    const pool = this.waitingPlayers();
    this.choosing = pool.slice(0, pool.length - (pool.length % TEAM_SIZE)).map((p) => p.id);
    const used = new Set(this.teams.map((t) => t.color.id));
    const free = TEAM_COLORS.filter((c) => !used.has(c.id));
    for (const color of free.slice(0, this.choosing.length / TEAM_SIZE)) {
      this.teams.push({ id: color.id, color, name: '', members: [], roles: new Map(), fixed: false, board: null, done: false, outcome: null, rank: null, remainingMs: null });
    }
    this.phase = 'teams';
  }

  /** Qualcuno è uscito durante la scelta: meno squadre nuove se serve, e chi resta dispari torna ad aspettare. */
  reshapeChoice() {
    if (this.choosing.length % TEAM_SIZE) {
      const last = [...this.choosing].sort((a, b) => this.players.get(b).arrived - this.players.get(a).arrived)[0];
      this.choosing = this.choosing.filter((id) => id !== last);
      const p = this.players.get(last);
      const team = this.teamOf(p);
      if (team) team.members = team.members.filter((id) => id !== last);
      p.teamId = null;
    }
    const open = this.teams.filter((t) => !t.fixed);
    const keep = this.choosing.length / TEAM_SIZE;
    // Si tolgono le squadre nuove più vuote, a pari merito l'ultimo colore; chi ci era dentro torna a scegliere.
    const drop = open.map((t, i) => [t, i]).sort(([a, i], [b, j]) => a.members.length - b.members.length || j - i)
      .slice(0, Math.max(0, open.length - keep)).map(([t]) => t);
    for (const team of drop) for (const id of team.members) this.players.get(id).teamId = null;
    this.teams = this.teams.filter((t) => !drop.includes(t));
    if (!this.choosing.length) {
      if (this.teams.length) this.phase = 'briefing';
      else this.backToLobby();
      return;
    }
    this.maybeTeamsDone();
  }

  pickTeam(actor, teamId) {
    this.requirePhase('teams');
    if (!this.choosing.includes(actor.id)) throw new GameError('Aspetta: entri nelle squadre alla fine del turno.');
    const team = this.teams.find((t) => t.id === teamId && !t.fixed);
    if (!team) throw new GameError('Questa squadra non c’è.');
    if (actor.teamId === team.id) return;
    if (team.members.length >= TEAM_SIZE) throw new GameError('Questa squadra è già piena.');
    const old = this.teamOf(actor);
    if (old) old.members = old.members.filter((id) => id !== actor.id);
    team.members.push(actor.id);
    actor.teamId = team.id;
    this.maybeTeamsDone();
    this.changed();
  }

  maybeTeamsDone() {
    if (this.phase !== 'teams') return;
    if (!this.choosing.every((id) => this.players.get(id)?.teamId)) return;
    for (const team of this.teams) team.fixed = true;
    this.choosing = [];
    this.phase = 'briefing';
  }

  // ---------- Nome, ruoli, impostazioni ----------

  setTeamName(actor, name) {
    this.requirePhase('briefing');
    const team = this.teamOf(actor);
    if (!team) throw new GameError('Non sei in una squadra.');
    if (team.members[0] !== actor.id) throw new GameError('Il nome lo sceglie chi è entrato per primo nella squadra.');
    team.name = String(name ?? '').trim().replace(/\s+/g, ' ').slice(0, MAX_TEAM_NAME);
    this.changed();
  }

  /** Il ruolo si sceglie solo al primo turno della squadra: dopo si scambiano da soli. */
  chooseRole(actor, roleId) {
    this.requirePhase('briefing');
    const team = this.teamOf(actor);
    if (!team) throw new GameError('Non sei in una squadra.');
    if (team.played) throw new GameError('Dal secondo turno i ruoli si scambiano da soli.');
    if (!this.roles.some((r) => r.id === roleId)) throw new GameError('Questo ruolo non esiste.');
    const mate = team.members.find((id) => id !== actor.id);
    if (mate && team.roles.get(mate) === roleId) throw new GameError(`Questo ruolo l'ha già preso ${this.players.get(mate).name}.`);
    team.roles.set(actor.id, roleId);
    this.changed();
  }

  setSettings(actor, values) {
    this.requireAdmin(actor);
    this.requirePhase('lobby', 'teams', 'briefing', 'result');
    for (const [key, value] of Object.entries(values ?? {})) {
      const options = this.settingOptions[key];
      if (!options) throw new GameError('Impostazione sconosciuta.');
      if (!options.includes(value)) throw new GameError('Valore non valido.');
      this.settings[key] = value;
    }
    this.changed();
  }

  teamReady(team) {
    return team.members.length === TEAM_SIZE && team.members.every((id) => team.roles.has(id));
  }

  roleOf(team, playerId) {
    return team?.roles.get(playerId) ?? null;
  }

  /** Il giocatore di quella squadra con quel ruolo. */
  memberWithRole(team, roleId) {
    const id = team.members.find((m) => team.roles.get(m) === roleId);
    return id ? this.players.get(id) : null;
  }

  // ---------- Turno ----------

  go(actor) {
    this.requireAdmin(actor);
    this.requirePhase('briefing');
    if (!this.teams.length) throw new GameError('Non ci sono squadre.');
    if (!this.teams.every((t) => this.teamReady(t))) throw new GameError('Ogni squadra deve avere i due ruoli.');
    this.round += 1;
    this.finishers = 0;
    for (const team of this.teams) {
      Object.assign(team, { done: false, outcome: null, rank: null, remainingMs: null });
      team.board = this.setupTeam(team);
    }
    this.phase = 'playing';
    this.deadline = this.now() + this.settings.durationSec * 1000;
    this.schedule(this.settings.durationSec * 1000, () => this.timeUp());
    this.updatePause();
    this.changed();
  }

  /** Si tiene il punteggio solo se c'è qualcuno da battere. */
  get scoring() {
    return this.teams.length > 1;
  }

  remainingMs() {
    if (this.paused) return this.paused.remainingMs;
    return this.deadline ? Math.max(0, this.deadline - this.now()) : null;
  }

  /** In due, se uno dei due si disconnette il gioco si ferma; in più di due si va avanti. */
  updatePause() {
    if (this.phase !== 'playing' || this.teams.length !== 1) {
      if (this.paused && this.phase !== 'playing') this.paused = NO_PAUSE;
      return;
    }
    const away = this.teams[0].members.map((id) => this.players.get(id)).find((p) => p && p.connections === 0);
    if (away && !this.paused) {
      this.paused = { remainingMs: this.remainingMs(), name: away.name };
      this.clearPhaseTimer();
      this.deadline = null;
    } else if (!away && this.paused) {
      const left = this.paused.remainingMs;
      this.paused = NO_PAUSE;
      this.deadline = this.now() + left;
      this.schedule(left, () => this.timeUp());
    } else if (away && this.paused) {
      this.paused.name = away.name;
    }
  }

  /** La squadra di chi agisce, se in questo momento può giocare. */
  playingTeam(actor) {
    this.requirePhase('playing');
    if (this.paused) throw new GameError(`Gioco in pausa: aspettiamo ${this.paused.name}.`);
    const team = this.teamOf(actor);
    if (!team || !team.board) throw new GameError('Aspetta: entri nelle squadre alla fine del turno.');
    if (team.done) throw new GameError('La vostra squadra ha già finito questo turno.');
    return team;
  }

  /** Una squadra ha finito (outcome.success: ce l'ha fatta). Quando hanno finito tutte, il turno si chiude. */
  finishTeam(team, outcome) {
    if (team.done) return;
    team.done = true;
    team.outcome = outcome;
    team.remainingMs = this.remainingMs();
    if (outcome?.success) team.rank = ++this.finishers;
    if (this.teams.every((t) => t.done || !t.board)) this.finishTurn();
  }

  timeUp() {
    if (this.phase !== 'playing') return;
    this.finishTurn();
    this.changed();
  }

  stopTurn(actor) {
    this.requireAdmin(actor);
    this.requirePhase('playing');
    this.finishTurn();
    this.changed();
  }

  finishTurn() {
    if (this.phase !== 'playing') return;
    for (const team of this.teams) {
      if (team.board && !team.done) {
        team.done = true;
        team.outcome = this.teamTimeout(team) ?? { success: false };
        team.remainingMs = 0;
      }
    }
    this.clearPhaseTimer();
    this.deadline = null;
    this.paused = NO_PAUSE;
    this.phase = 'result';
    const points = new Map();
    for (const team of this.teams) {
      if (!team.board) continue;
      team.points = this.scoring ? Math.max(0, Math.round(this.teamPoints(team) ?? 0)) : 0;
      team.played = true;
      for (const id of team.members) points.set(id, team.points);
    }
    this.history.set(this.round, points);
  }

  /** Squadre già fatte rimaste con una persona sola: si sciolgono, e chi resta torna ad aspettare. */
  dissolveBroken() {
    const broken = this.teams.filter((t) => t.fixed && t.members.length < TEAM_SIZE);
    for (const team of broken) for (const id of team.members) this.players.get(id).teamId = null;
    this.teams = this.teams.filter((t) => !broken.includes(t));
  }

  backToLobby() {
    const keep = this.history;
    this.resetGame();
    this.history = keep;
  }

  nextTurn(actor) {
    this.requireAdmin(actor);
    this.requirePhase('result');
    this.dissolveBroken();
    for (const team of this.teams) {
      team.board = null;
      const [a, b] = team.members;
      const ra = team.roles.get(a);
      team.roles.set(a, team.roles.get(b));
      team.roles.set(b, ra);
    }
    if (this.waitingPlayers().length >= TEAM_SIZE) this.beginChoice();
    else if (this.teams.length) this.phase = 'briefing';
    else this.backToLobby();
    this.changed();
  }

  endGame(actor) {
    this.requireAdmin(actor);
    this.requirePhase('result');
    this.phase = 'final';
    this.changed();
  }

  newGame(actor) {
    this.requireAdmin(actor);
    this.resetGame();
    this.pruneOffline();
    this.changed();
  }

  // ---------- Agganci per i giochi (da sovrascrivere) ----------

  setupTeam() { return {}; }
  teamTimeout() { return { success: false }; }
  teamPoints() { return 0; }
  teamView() { return null; }

  // ---------- Vista ----------

  totals() {
    const totals = new Map([...this.players.keys()].map((id) => [id, 0]));
    for (const round of this.history.values()) {
      for (const [id, pts] of round) if (totals.has(id)) totals.set(id, totals.get(id) + pts);
    }
    return totals;
  }

  view({ role, player = null }) {
    const totals = this.totals();
    const viewerTeam = this.teamOf(player);
    const teams = this.teams.map((team) => {
      const member = !!player && team.members.includes(player.id);
      return {
        id: team.id,
        color: team.color,
        name: this.displayName(team),
        customName: team.name,
        fixed: team.fixed,
        members: team.members.map((id) => {
          const p = this.players.get(id);
          return { id, name: p.name, online: p.connections > 0, role: team.roles.get(id) ?? null };
        }),
        ready: this.teamReady(team),
        played: !!team.played,
        playing: !!team.board,
        done: team.done,
        outcome: team.outcome,
        rank: team.rank,
        remainingMs: team.remainingMs,
        points: this.phase === 'result' || this.phase === 'final' ? team.points ?? null : null,
        game: team.board ? this.teamView(team, { role, player, member, teamRole: member ? team.roles.get(player.id) : null }) : null,
      };
    });
    const state = {
      role,
      phase: this.phase,
      round: this.round,
      roles: this.roles,
      settings: { ...this.settings },
      settingOptions: this.settingOptions,
      durationSec: this.settings.durationSec,
      remainingMs: this.remainingMs(),
      paused: this.paused ? { name: this.paused.name } : null,
      scoring: this.scoring,
      teams,
      choosing: this.choosing.map((id) => this.players.get(id)?.name).filter(Boolean),
      waiting: this.waitingPlayers().filter((p) => !this.choosing.includes(p.id)).map((p) => p.name),
      players: [...this.players.values()].map((p) => ({ ...this.seat(p), total: totals.get(p.id), teamId: p.teamId })),
      ...this.baseView(),
    };
    if (player) {
      const choosing = this.choosing.includes(player.id);
      const teamRole = viewerTeam ? viewerTeam.roles.get(player.id) ?? null : null;
      const waiting = !viewerTeam && !choosing;
      state.you = {
        id: player.id,
        name: player.name,
        isAdmin: player.id === this.adminId,
        teamId: viewerTeam?.id ?? null,
        teamRole,
        namer: !!viewerTeam && viewerTeam.members[0] === player.id,
        choosing,
        waiting,
        // Il client cambia pagina quando cambia questo: chi aspetta, chi sceglie, chi gioca e con che ruolo.
        slot: waiting ? 'waiting' : choosing ? 'choosing' : `${viewerTeam?.id}:${this.phase === 'playing' ? teamRole : ''}`,
      };
    }
    return state;
  }
}
