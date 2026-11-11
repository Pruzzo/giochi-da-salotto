// "Labirinto al buio": l'esploratore muove l'omino con la torcia sul telefono, che illumina solo la sua casella
// e la striscia più vicina di quelle accanto; il navigatore ha la mappa intera sul telefono, ma la mappa gira ogni 8 passi
// e non dice dov'è l'omino. Le regole sono in docs/Giochi-a-squadre.md, "Labirinto al buio".
// Le fasi (squadre, ruoli, turni, pausa) sono quelle comuni di games/shared/teams.js.
import { GameError, MAX_PLAYERS } from '../shared/table.js';
import { TeamTable } from '../shared/teams.js';

export { GameError, MAX_PLAYERS };

export const ROLES = [
  { id: 'esploratore', label: 'Esploratore' },
  { id: 'navigatore', label: 'Navigatore' },
];
export const SIZES = {
  piccolo: { n: 7, bombs: 3 },
  medio: { n: 9, bombs: 5 },
  grande: { n: 11, bombs: 8 },
};
export const DURATIONS = [180, 240, 300, 360, 420, 480];
export const TURN_EVERY = 8; // passi effettivi tra una girata della mappa e l'altra
export const DECO_SHARE = 6; // più o meno una casella su sei è decorata
export const FIRST_BONUS = 3;

/** I decori: pavimenti a tinta unita e simboli. In un labirinto ognuno compare una volta sola. */
export const DECOS = [
  'rosso', 'arancione', 'giallo', 'verde', 'azzurro', 'viola', 'rosa', 'marrone',
  'stella', 'luna', 'sole', 'cuore', 'chiave', 'fiore', 'ancora', 'goccia', 'campana', 'fungo', 'pesce', 'foglia', 'casetta', 'nota',
];

/** Le direzioni sulla mappa vera: il nord è in alto. bit: il passaggio aperto da quel lato. */
export const DIRS = {
  N: { dr: -1, dc: 0, bit: 1, back: 'S' },
  E: { dr: 0, dc: 1, bit: 2, back: 'W' },
  S: { dr: 1, dc: 0, bit: 4, back: 'N' },
  W: { dr: 0, dc: -1, bit: 8, back: 'E' },
};
const SIDES = Object.keys(DIRS);
/** Di una casella accanto la torcia illumina la striscia vicina: si vedono i due muri di lato. */
const ACROSS = { N: ['W', 'E'], S: ['W', 'E'], E: ['N', 'S'], W: ['N', 'S'] };

/** Il percorso più corto senza bombe, per ogni grandezza: le squadre dello stesso turno stanno tutte qui. */
export function pathTarget(n) {
  return Math.round(n * 2.6);
}
export const PATH_TOLERANCE = 1;

/** Come può essere girata la mappa: ruotata (in senso orario) e poi, forse, capovolta. */
const ORIENTATIONS = [];
for (const rot of [0, 90, 180, 270]) for (const flip of [null, 'h', 'v']) ORIENTATIONS.push({ rot, flip });

/** La matrice di una girata, per riconoscere due girate scritte diversamente ma uguali (180° + orizzontale = verticale). */
export function orientationKey({ rot, flip }) {
  // vettore (riga, colonna): rotazione oraria di 90° manda (dr, dc) in (dc, -dr)
  let a = [1, 0]; // immagine di (1, 0)
  let b = [0, 1]; // immagine di (0, 1)
  for (let i = 0; i < rot / 90; i++) { a = [a[1], -a[0]]; b = [b[1], -b[0]]; }
  if (flip === 'h') { a = [a[0], -a[1]]; b = [b[0], -b[1]]; }
  if (flip === 'v') { a = [-a[0], a[1]]; b = [-b[0], b[1]]; }
  return `${a}|${b}`;
}
const IDENTITY = orientationKey({ rot: 0, flip: null });

export function pointsFor(team) {
  if (!team.outcome?.success) return 0;
  const secs = Math.floor((team.remainingMs ?? 0) / 1000);
  const base = Math.max(1, 10 + Math.floor(secs / 10) - (team.outcome.bombs ?? 0));
  return base + (team.rank === 1 ? FIRST_BONUS : 0);
}

export class Game extends TeamTable {
  constructor(options = {}) {
    super({
      roles: ROLES,
      settings: { defaults: { durationSec: 300, size: 'piccolo' }, options: { durationSec: DURATIONS, size: Object.keys(SIZES) } },
      ...options,
    });
  }

  randInt(n) {
    return Math.floor(this.random() * n);
  }

  shuffle(list) {
    const a = [...list];
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.randInt(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ---------- Il labirinto ----------

  /** Un labirinto per la squadra, diverso da quelli delle altre squadre dello stesso turno. */
  setupTeam(team) {
    const { n, bombs } = SIZES[this.settings.size];
    const others = this.teams.filter((t) => t !== team && t.board?.round === this.round).map((t) => t.board.open.join());
    for (;;) {
      const board = this.generate(n, bombs);
      if (board && !others.includes(board.open.join())) return Object.assign(board, { round: this.round });
    }
  }

  /** Prova a fare un labirinto con le regole: null se questo tentativo non va bene. */
  generate(n, bombCount) {
    const at = (r, c) => r * n + c;
    const inside = (r, c) => r >= 0 && c >= 0 && r < n && c < n;
    const open = new Array(n * n).fill(0);
    const carve = (i, side) => {
      const d = DIRS[side];
      const j = at(Math.floor(i / n) + d.dr, (i % n) + d.dc);
      open[i] |= d.bit;
      open[j] |= DIRS[d.back].bit;
    };
    const sidesOf = (i) => SIDES.filter((s) => inside(Math.floor(i / n) + DIRS[s].dr, (i % n) + DIRS[s].dc));

    // Labirinto perfetto (backtracking), poi qualche muro in meno per avere più strade e giri.
    const seen = new Set([this.randInt(n * n)]);
    const stack = [...seen];
    while (stack.length) {
      const i = stack.at(-1);
      const free = sidesOf(i).filter((s) => !seen.has(i + DIRS[s].dr * n + DIRS[s].dc));
      if (!free.length) { stack.pop(); continue; }
      const side = free[this.randInt(free.length)];
      const j = i + DIRS[side].dr * n + DIRS[side].dc;
      carve(i, side);
      seen.add(j);
      stack.push(j);
    }
    for (let i = 0; i < n * n; i++) {
      const walls = sidesOf(i).filter((s) => !(open[i] & DIRS[s].bit));
      if (walls.length === sidesOf(i).length - 1 && this.random() < 0.45) carve(i, walls[this.randInt(walls.length)]);
    }

    // L'uscita: una porta sul bordo.
    const border = [];
    for (let i = 0; i < n * n; i++) for (const s of SIDES) if (!sidesOf(i).includes(s)) border.push({ cell: i, side: s });
    const exit = border[this.randInt(border.length)];

    // La partenza: una casella a distanza giusta dall'uscita, decorata.
    const target = pathTarget(n);
    const far = distances(open, n, exit.cell, new Set());
    const starts = far.map((d, i) => [d, i]).filter(([d]) => Math.abs(d + 1 - target) <= PATH_TOLERANCE).map(([, i]) => i);
    if (!starts.length) return null;
    const start = starts[this.randInt(starts.length)];
    const decoCount = Math.round((n * n) / DECO_SHARE);
    const decoCells = [start, ...this.shuffle([...Array(n * n).keys()].filter((i) => i !== start && i !== exit.cell)).slice(0, decoCount - 1)];
    const names = this.shuffle(DECOS).slice(0, decoCount);
    const deco = new Array(n * n).fill(null);
    decoCells.forEach((i, k) => { deco[i] = names[k]; });

    // Le bombe: sulle caselle di passaggio, mai dove si sta (partenza, uscita, decori), e sempre una strada pulita.
    const free = [...Array(n * n).keys()].filter((i) => !deco[i] && i !== exit.cell);
    const passages = free.filter((i) => SIDES.filter((s) => open[i] & DIRS[s].bit).length >= 2);
    for (let attempt = 0; attempt < 30; attempt++) {
      const pool = this.shuffle(passages.length >= bombCount ? passages : free);
      const bombs = new Set(pool.slice(0, bombCount));
      const d = distances(open, n, exit.cell, bombs)[start];
      if (Number.isFinite(d) && Math.abs(d + 1 - target) <= PATH_TOLERANCE) {
        return {
          n, open, deco, exit, start,
          bombs: [...bombs].sort((a, b) => a - b),
          pos: start,
          steps: 0, bombsHit: 0, bumps: 0,
          orientation: { rot: 0, flip: null, seq: 0 },
          event: { seq: 0, type: null, dir: null },
          trail: [[start]],
        };
      }
    }
    return null;
  }

  // ---------- Il gioco ----------

  move(actor, dir) {
    const team = this.playingTeam(actor);
    if (this.roleOf(team, actor.id) !== 'esploratore') throw new GameError('Le frecce le ha l’esploratore: tu guidalo con la mappa.');
    const d = DIRS[dir];
    if (!d) throw new GameError('Direzione sconosciuta.');
    const b = team.board;
    const event = (type) => { b.event = { seq: b.event.seq + 1, type, dir }; };
    if (b.pos === b.exit.cell && dir === b.exit.side) {
      b.steps += 1;
      event('exit');
      this.finishTeam(team, { success: true, bombs: b.bombsHit, steps: b.steps });
      this.changed();
      return;
    }
    if (!(b.open[b.pos] & d.bit)) {
      b.bumps += 1;
      event('wall');
      this.changed();
      return;
    }
    const next = b.pos + d.dr * b.n + d.dc;
    b.steps += 1;
    b.trail.at(-1).push(next);
    if (b.bombs.includes(next)) {
      b.bombsHit += 1;
      b.bombs = b.bombs.filter((i) => i !== next);
      b.pos = b.start;
      b.trail.push([b.start]);
      event('bomb');
    } else {
      b.pos = next;
      event('step');
    }
    if (b.steps % TURN_EVERY === 0) this.turnMap(b);
    this.changed();
  }

  /** La mappa del navigatore si gira: mai dritta, mai uguale a prima. */
  turnMap(b) {
    const current = orientationKey(b.orientation);
    const choices = ORIENTATIONS.filter((o) => orientationKey(o) !== current && orientationKey(o) !== IDENTITY);
    const next = choices[this.randInt(choices.length)];
    b.orientation = { ...next, seq: b.orientation.seq + 1 };
  }

  teamTimeout(team) {
    return { success: false, bombs: team.board.bombsHit, steps: team.board.steps };
  }

  teamPoints(team) {
    return pointsFor(team);
  }

  // ---------- Cosa vede chi ----------

  teamView(team, viewer) {
    const b = team.board;
    const common = { size: b.n, bombsHit: b.bombsHit };
    if (viewer.role === 'tv') {
      // La torcia sta sul telefono dell'esploratore: la TV la vede anche il navigatore.
      const view = { ...common, steps: b.steps };
      // A turno finito la TV svela il labirinto e la strada fatta.
      if (this.phase === 'result' || this.phase === 'final') view.reveal = { ...this.map(b), trail: b.trail, start: b.start };
      return view;
    }
    if (!viewer.member) return null;
    if (viewer.teamRole === 'navigatore') {
      return {
        ...common, role: 'navigatore', ...this.map(b),
        orientation: b.orientation,
        stepsToTurn: TURN_EVERY - (b.steps % TURN_EVERY),
        event: { seq: b.event.seq, type: b.event.type },
      };
    }
    if (viewer.teamRole === 'esploratore') return { ...common, role: 'esploratore', torch: this.torch(b), event: b.event };
    return null;
  }

  /** La mappa intera, senza l'omino e senza la partenza. */
  map(b) {
    return { n: b.n, open: b.open, deco: b.deco, bombs: b.bombs, exit: b.exit };
  }

  /** La torcia: la casella dell'omino intera, delle quattro accanto solo la striscia vicina. Niente coordinate. */
  torch(b) {
    const n = b.n;
    const r = Math.floor(b.pos / n);
    const c = b.pos % n;
    const side = (i, s) => (b.open[i] & DIRS[s].bit ? 'open' : b.exit.cell === i && b.exit.side === s ? 'door' : 'wall');
    const here = { deco: b.deco[b.pos], walls: Object.fromEntries(SIDES.map((s) => [s, side(b.pos, s)])) };
    const around = {};
    for (const s of SIDES) {
      const rr = r + DIRS[s].dr;
      const cc = c + DIRS[s].dc;
      if (rr < 0 || cc < 0 || rr >= n || cc >= n) { around[s] = null; continue; }
      const j = rr * n + cc;
      around[s] = { deco: b.deco[j], bomb: b.bombs.includes(j), walls: Object.fromEntries(ACROSS[s].map((x) => [x, side(j, x)])) };
    }
    return { here, around };
  }
}

/** Passi dalla casella `from` a ogni casella, senza passare sulle bombe. */
export function distances(open, n, from, bombs) {
  const dist = new Array(n * n).fill(Infinity);
  dist[from] = 0;
  const queue = [from];
  while (queue.length) {
    const i = queue.shift();
    for (const s of SIDES) {
      if (!(open[i] & DIRS[s].bit)) continue;
      const j = i + DIRS[s].dr * n + DIRS[s].dc;
      if (bombs.has(j) || dist[j] !== Infinity) continue;
      dist[j] = dist[i] + 1;
      queue.push(j);
    }
  }
  return dist;
}
