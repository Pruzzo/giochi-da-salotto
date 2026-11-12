// La console: sa quali giochi esistono e quale è acceso. Nessuna dipendenza di rete.
export class PlatformError extends Error {}

/** Gli stili grafici tra cui si sceglie dalla console: valgono per TV e telefoni insieme. */
export const STYLES = [
  { id: 'quaderno', title: 'Quaderno', description: 'Quadretti, biro blu e penna rossa.' },
  { id: 'enigmistica', title: 'Enigmistica', description: 'La pagina di una rivista di giochi: nero più un blu.' },
  { id: 'kraft', title: 'Kraft', description: 'Cartoncini sul cartone, nastro Dymo e timbri.' },
];
/** Lo stile con cui si parte la prima volta, prima che qualcuno ne scelga un altro dalla console. */
export const DEFAULT_STYLE = 'kraft';

export class Platform {
  constructor(games, { launch, onChange = () => {}, style, onStyle = () => {} }) {
    this.games = new Map(games.map((game) => [game.id, game]));
    this.launch = launch;
    this.onChange = onChange;
    this.activeId = null;
    this.session = null;
    this.onStyle = onStyle;
    // Lo stile salvato l'ultima volta, se esiste ancora; altrimenti quello predefinito.
    this.style = STYLES.some((s) => s.id === style) ? style : DEFAULT_STYLE;
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

  setStyle(id) {
    if (!STYLES.some((style) => style.id === id)) throw new PlatformError('Questo stile non esiste.');
    if (this.style === id) return;
    this.style = id;
    this.onStyle(id);
    this.onChange();
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
      style: this.style,
      styles: STYLES,
      games: [...this.games.values()].map(({ id, title, description }) => ({
        id,
        title,
        description,
        status: id === this.activeId ? this.session.status() : null,
      })),
    };
  }
}
