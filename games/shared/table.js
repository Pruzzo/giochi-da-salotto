// Il tavolo comune a tutti i giochi: chi è seduto, chi è l'amministratore, chi è connesso.
// Ogni gioco estende Table e aggiunge le sue regole. Nessuna dipendenza di rete.
import { randomUUID } from 'node:crypto';
import { SEPARATORS, stripAccents } from './text.js';

export const MAX_PLAYERS = 12;
const MAX_NAME = 16;

export class GameError extends Error {}

/** Minuscolo, senza accenti e spazi superflui: "Città " e "citta" sono la stessa parola. */
export function normalize(word) {
  return stripAccents(word).toLowerCase().replace(SEPARATORS, ' ').trim();
}

export class Table {
  constructor({ random = Math.random, now = Date.now, setTimer = setTimeout, clearTimer = clearTimeout, onChange = () => {} } = {}) {
    Object.assign(this, { random, now, setTimer, clearTimer, onChange });
    this.players = new Map();
    this.adminId = null;
    this.phase = 'lobby';
    this.timer = null;
  }

  // ---------- Agganci per i giochi ----------

  /** Il giocatore ha lasciato tracce nella partita (punti, tentativi): esce dalla classifica solo in sala d'attesa. */
  hasPlayed() { return false; }
  /** Qualcuno si è connesso, disconnesso o è uscito: il gioco può chiudere una fase. */
  presenceChanged() {}
  /** Il giocatore esce: il gioco dimentica i suoi dati del turno. */
  forget() {}
  /** Punti della partita, playerId -> punti. Quando la fase diventa 'final' chi ne ha di più vince una stellina della serata. */
  totals() { return new Map(); }

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
    this.presenceChanged();
    this.changed();
  }

  leave(player) {
    if (this.adminId === player.id) this.adminId = null;
    player.connections = 0;
    if (this.phase === 'lobby' || !this.hasPlayed(player.id)) this.players.delete(player.id);
    else player.token = randomUUID(); // resta in classifica, ma il vecchio dispositivo perde il posto
    this.forget(player);
    this.presenceChanged();
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

  /** A partita nuova restano seduti solo i presenti. */
  pruneOffline() {
    for (const p of [...this.players.values()]) if (p.connections === 0) this.players.delete(p.id);
  }

  online() {
    return [...this.players.values()].filter((p) => p.connections > 0);
  }

  requireAdmin(actor) {
    if (!actor || actor.id !== this.adminId) throw new GameError("Solo l'amministratore può farlo.");
  }

  requirePhase(...phases) {
    if (!phases.includes(this.phase)) throw new GameError('Questa azione non è disponibile adesso.');
  }

  // ---------- Tempo ----------

  schedule(ms, fn) {
    this.clearPhaseTimer();
    this.timer = this.setTimer(fn, ms);
  }

  clearPhaseTimer() {
    if (this.timer) this.clearTimer(this.timer);
    this.timer = null;
  }

  // ---------- Vista ----------

  /** Cosa sanno tutti di ogni giocatore; ogni gioco aggiunge il resto. */
  seat(p) {
    return { id: p.id, name: p.name, online: p.connections > 0, isAdmin: p.id === this.adminId };
  }

  baseView() {
    return {
      adminId: this.adminId,
      adminOnline: (this.players.get(this.adminId)?.connections ?? 0) > 0,
    };
  }

  changed() {
    this.onChange();
  }
}
