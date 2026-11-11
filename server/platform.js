// La console: sa quali giochi esistono e quale è acceso. Nessuna dipendenza di rete.
export class PlatformError extends Error {}

export class Platform {
  constructor(games, { launch, onChange = () => {} }) {
    this.games = new Map(games.map((game) => [game.id, game]));
    this.launch = launch;
    this.onChange = onChange;
    this.activeId = null;
    this.session = null;
  }

  get activeGame() {
    return this.games.get(this.activeId) ?? null;
  }

  select(id) {
    const game = this.games.get(id);
    if (!game) throw new PlatformError('Questo gioco non esiste.');
    if (this.activeId === id) return;
    if (this.activeId) throw new PlatformError(`Chiudi prima ${this.activeGame.title}.`);
    this.session = this.launch(game);
    this.activeId = id;
    this.onChange();
  }

  /** Dalla sala d'attesa: chiude il gioco acceso e accende l'altro in un colpo solo. */
  switchTo(id) {
    if (!this.games.has(id)) throw new PlatformError('Questo gioco non esiste.');
    if (this.activeId === id) throw new PlatformError('Questo gioco è già acceso.');
    this.close();
    this.select(id);
  }

  close() {
    if (!this.activeId) return;
    this.session.destroy();
    this.session = null;
    this.activeId = null;
    this.onChange();
  }

  view() {
    return {
      activeId: this.activeId,
      games: [...this.games.values()].map(({ id, title, description }) => ({
        id,
        title,
        description,
        status: id === this.activeId ? this.session.status() : null,
      })),
    };
  }
}
