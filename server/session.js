// Le vittorie della serata: durano finché il server è acceso, qualunque gioco si scelga.
// Chi gioca si riconosce dal nome, come fa il tavolo con chi torna da un altro dispositivo.
import { normalize } from '../games/shared/table.js';

export class Session {
  constructor({ onChange = () => {} } = {}) {
    this.onChange = onChange;
    this.wins = new Map(); // nome normalizzato -> { name, wins }
    this.last = new Set(); // chi ha vinto la partita più recente
  }

  /**
   * Una partita è finita: una vittoria a chi ha più punti, a tutti in caso di pari merito.
   * Da soli o senza punti non vince nessuno.
   * @param standings  [{ name, total, ... }] tutti quelli in classifica
   * @returns i vincitori, così come sono arrivati
   */
  record(standings) {
    const top = Math.max(0, ...standings.map((s) => s.total));
    const winners = standings.length >= 2 && top > 0 ? standings.filter((s) => s.total === top) : [];
    this.last = new Set();
    for (const { name } of winners) {
      const key = normalize(name);
      const entry = this.wins.get(key) ?? { name, wins: 0 };
      entry.name = name;
      entry.wins += 1;
      this.wins.set(key, entry);
      this.last.add(key);
    }
    this.onChange();
    return winners;
  }

  winsOf(name) {
    return this.wins.get(normalize(name))?.wins ?? 0;
  }

  /** Dal più vincente; a pari vittorie resta avanti chi ha vinto per primo. */
  view() {
    return {
      players: [...this.wins.entries()]
        .map(([key, { name, wins }]) => ({ name, wins, last: this.last.has(key) }))
        .sort((a, b) => b.wins - a.wins),
    };
  }
}
