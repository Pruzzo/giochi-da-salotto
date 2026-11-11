// Il labirinto disegnato a biro sul quaderno: muri, pavimenti colorati, simboli, bombe, porta, omino.
// Una casella misura 1 nelle coordinate SVG; la mappa intera serve al navigatore e alla TV a fine turno,
// la torcia all'esploratore durante il turno.
import { h } from '/js/kit/dom.js';

const s = (tag, props, ...kids) => h(`svg:${tag}`, props, ...kids);
let uid = 0;

export const SIDES = ['N', 'E', 'S', 'W'];
const VEC = { N: [-1, 0], E: [0, 1], S: [1, 0], W: [0, -1] };
const BIT = { N: 1, E: 2, S: 4, W: 8 };

/** Pavimenti a tinta unita, ognuno col suo pastello. */
export const FLOORS = {
  rosso: '#d7263d', arancione: '#f08a24', giallo: '#f6cd1a', verde: '#2e9e4f',
  azzurro: '#2aa7e0', viola: '#8a4fc7', rosa: '#ec6fb0', marrone: '#8a5a2b',
};

/** Simboli in un quadrato 24×24, tratto di biro e un po' di pastello. */
const SYMBOLS = {
  stella: [['path', { d: 'M12 2.2l2.95 6.2 6.75.85-4.95 4.7 1.25 6.75L12 17.45 5.95 20.7l1.25-6.75L2.3 9.25l6.75-.85z', fill: '#f6cd1a' }]],
  luna: [['path', { d: 'M15.5 2.8a9.4 9.4 0 1 0 5.9 15.6A7.6 7.6 0 0 1 15.5 2.8z', fill: '#fbe58a' }]],
  sole: [
    ['path', { d: 'M12 1.6v3.2M12 19.2v3.2M1.6 12h3.2M19.2 12h3.2M4.6 4.6l2.3 2.3M17.1 17.1l2.3 2.3M4.6 19.4l2.3-2.3M17.1 6.9l2.3-2.3', fill: 'none' }],
    ['circle', { cx: 12, cy: 12, r: 4.8, fill: '#f08a24' }],
  ],
  cuore: [['path', { d: 'M12 20.6S2.8 15.1 2.8 8.7a4.7 4.7 0 0 1 9.2-1.6 4.7 4.7 0 0 1 9.2 1.6c0 6.4-9.2 11.9-9.2 11.9z', fill: '#d7263d' }]],
  chiave: [
    ['path', { d: 'M10.6 12h10.6M17.4 12v4M20.6 12v3', fill: 'none' }],
    ['circle', { cx: 6.4, cy: 12, r: 4.2, fill: '#f6cd1a' }],
    ['circle', { cx: 6.4, cy: 12, r: 1.4, fill: '#fff' }],
  ],
  fiore: [
    ['path', { d: 'M12 8.6a3.6 3.6 0 1 1 3.2 1.9 3.6 3.6 0 1 1-1.3 4.6 3.6 3.6 0 1 1-3.8 0 3.6 3.6 0 1 1-1.3-4.6A3.6 3.6 0 1 1 12 8.6z', fill: '#ec6fb0' }],
    ['circle', { cx: 12, cy: 12, r: 2.3, fill: '#f6cd1a' }],
  ],
  ancora: [
    ['circle', { cx: 12, cy: 4.4, r: 2.2, fill: 'none' }],
    ['path', { d: 'M12 6.6v14.6M7.6 10h8.8M3.6 13.6c.6 4.4 4 7.6 8.4 7.6s7.8-3.2 8.4-7.6M3.6 13.6l-1.4 2M3.6 13.6l2.3.6M20.4 13.6l1.4 2M20.4 13.6l-2.3.6', fill: 'none' }],
  ],
  goccia: [['path', { d: 'M12 2.4s6.8 7.4 6.8 12a6.8 6.8 0 0 1-13.6 0C5.2 9.8 12 2.4 12 2.4z', fill: '#2aa7e0' }]],
  campana: [
    ['path', { d: 'M5.4 17.4v-6.2a6.6 6.6 0 0 1 13.2 0v6.2l2 2H3.4z', fill: '#f6cd1a' }],
    ['circle', { cx: 12, cy: 21.2, r: 1.6, fill: '#1b3aa8' }],
    ['path', { d: 'M12 2.4v2.2', fill: 'none' }],
  ],
  fungo: [
    ['path', { d: 'M2.6 12.4a9.4 8.6 0 0 1 18.8 0z', fill: '#d7263d' }],
    ['path', { d: 'M8.8 12.4v6.6a2 2 0 0 0 2 2h2.4a2 2 0 0 0 2-2v-6.6', fill: '#fff' }],
    ['circle', { cx: 8, cy: 8.4, r: 1.3, fill: '#fff', stroke: 'none' }],
    ['circle', { cx: 14.6, cy: 6.6, r: 1.3, fill: '#fff', stroke: 'none' }],
  ],
  pesce: [
    ['path', { d: 'M2.4 12c3.2-5.4 10.6-6.4 14.6 0-4 6.4-11.4 5.4-14.6 0zM17 12l4.6-4.4v8.8z', fill: '#f08a24' }],
    ['circle', { cx: 7, cy: 11, r: 1, fill: '#1b3aa8', stroke: 'none' }],
  ],
  foglia: [['path', { d: 'M4.4 19.6C4.4 9.4 10.6 4.2 20.6 3.6c-.4 10-6 16-16.2 16zM4.4 19.6l9.2-9.2', fill: '#2e9e4f' }]],
  casetta: [
    ['path', { d: 'M3.4 11.2L12 3.6l8.6 7.6V21H3.4z', fill: '#f0908f' }],
    ['path', { d: 'M9.8 21v-5.6h4.4V21', fill: '#fff' }],
  ],
  nota: [
    ['path', { d: 'M9.2 18.4V5.2l11-2.4v13', fill: 'none' }],
    ['ellipse', { cx: 6.6, cy: 18.6, rx: 2.8, ry: 2.2, fill: '#1b3aa8' }],
    ['ellipse', { cx: 17.6, cy: 16, rx: 2.8, ry: 2.2, fill: '#1b3aa8' }],
  ],
};

export const DECO_NAMES = {
  rosso: 'pavimento rosso', arancione: 'pavimento arancione', giallo: 'pavimento giallo', verde: 'pavimento verde',
  azzurro: 'pavimento azzurro', viola: 'pavimento viola', rosa: 'pavimento rosa', marrone: 'pavimento marrone',
};

/** Un simbolo, dritto, centrato in (cx, cy), largo `size`. */
export function symbol(name, cx, cy, size) {
  const k = size / 24;
  return s('g', {
    class: 'sym', transform: `translate(${cx - 12 * k} ${cy - 12 * k}) scale(${k})`,
    fill: 'none', stroke: '#14297a', 'stroke-width': 1.7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
  }, SYMBOLS[name].map(([tag, props]) => s(tag, props)));
}

/** La bomba: palla nera, miccia e scintilla. */
export function bomb(cx, cy, size) {
  const k = size / 24;
  return s('g', { class: 'bomb', transform: `translate(${cx - 12 * k} ${cy - 12 * k}) scale(${k})` },
    s('circle', { cx: 10.6, cy: 14, r: 7.6, fill: '#2a2d36', stroke: '#14297a', 'stroke-width': 1.4 }),
    s('path', { d: 'M7 11.2a4.2 4.2 0 0 1 3.2-2.6', fill: 'none', stroke: '#fff', 'stroke-width': 1.6, 'stroke-linecap': 'round', opacity: 0.7 }),
    s('path', { d: 'M15.4 8.4l1.6-1.8c.8-.9 2-1 2.8-.2', fill: 'none', stroke: '#8a5a2b', 'stroke-width': 1.8, 'stroke-linecap': 'round' }),
    s('path', { class: 'bomb__spark', d: 'M20.6 5.6l1.6-2.2M21.2 6.8l2.4-.4M19.4 4.8l-.2-2.4', fill: 'none', stroke: '#f08a24', 'stroke-width': 1.6, 'stroke-linecap': 'round' }));
}

/** Lo scoppio: una stella rossa e gialla. */
export function burst(cx, cy, size) {
  const k = size / 24;
  // il gruppo esterno mette a posto, quello interno si anima (una animazione CSS sostituirebbe il transform)
  return s('g', { transform: `translate(${cx - 12 * k} ${cy - 12 * k}) scale(${k})` }, s('g', { class: 'burst' },
    s('path', { d: 'M12 1l2.4 6.2L20.6 4l-2.2 6.4 5.2 2.2-5.6 2.4 2.6 6.4-6.2-3L12 23l-2.4-6.6-6.2 3 2.6-6.4L.4 12.6l5.2-2.2L3.4 4l6.2 3.2z', fill: '#f6cd1a', stroke: '#d7263d', 'stroke-width': 1.4, 'stroke-linejoin': 'round' }),
    s('path', { d: 'M12 6.4l1.4 3.6 3.6-1.6-1.4 3.6 3 1.4-3.2 1.2 1.4 3.4-3.4-1.6L12 19.6l-1.4-3.8-3.4 1.6 1.4-3.4-3.2-1.2 3-1.4-1.4-3.6 3.6 1.6z', fill: '#d7263d' })));
}

/** La porta d'uscita sul muro tra (x1, y1) e (x2, y2): un'anta marrone con la maniglia e una freccia verde verso fuori. */
export function door(x1, y1, x2, y2, out, { arrow = true } = {}) {
  const horizontal = y1 === y2;
  const t = 0.24;
  const [ox, oy] = out;
  const len = horizontal ? Math.abs(x2 - x1) : Math.abs(y2 - y1);
  const inset = Math.min(0.1, len * 0.15);
  const x = horizontal ? Math.min(x1, x2) + inset : x1 - t / 2;
  const y = horizontal ? y1 - t / 2 : Math.min(y1, y2) + inset;
  const w = horizontal ? len - 2 * inset : t;
  const hgt = horizontal ? t : len - 2 * inset;
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  // freccia: dalla porta verso fuori, con la punta
  const tip = [cx + ox * 0.36, cy + oy * 0.36];
  const from = [cx + ox * 0.16, cy + oy * 0.16];
  const wing = (k) => [tip[0] - ox * 0.12 + oy * 0.1 * k, tip[1] - oy * 0.12 + ox * 0.1 * k];
  const [w1, w2] = [wing(1), wing(-1)];
  return s('g', { class: 'door' },
    s('rect', { x, y, width: Math.max(0, w), height: Math.max(0, hgt), rx: 0.04, fill: '#8a5a2b', stroke: '#14297a', 'stroke-width': 0.05 }),
    s('path', { d: horizontal ? `M${x + 0.06} ${cy}H${x + w - 0.06}` : `M${cx} ${y + 0.06}V${y + hgt - 0.06}`, stroke: '#5c3a19', 'stroke-width': 0.03, 'stroke-dasharray': '.05 .05' }),
    s('circle', { cx: horizontal ? x + w * 0.8 : cx, cy: horizontal ? cy : y + hgt * 0.8, r: 0.045, fill: '#f6cd1a', stroke: '#14297a', 'stroke-width': 0.02 }),
    arrow && s('path', {
      class: 'door__arrow', d: `M${from[0]} ${from[1]}L${tip[0]} ${tip[1]}M${w1[0]} ${w1[1]}L${tip[0]} ${tip[1]}L${w2[0]} ${w2[1]}`,
      fill: 'none', stroke: '#2e9e4f', 'stroke-width': 0.075, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
    }));
}

function wallLine(x1, y1, x2, y2, cls = 'wall') {
  return s('line', { class: cls, x1, y1, x2, y2 });
}

/** I quattro lati di una casella nelle coordinate (x, y) del suo angolo in alto a sinistra. */
function edge(x, y, side) {
  return {
    N: [x, y, x + 1, y], S: [x, y + 1, x + 1, y + 1], W: [x, y, x, y + 1], E: [x + 1, y, x + 1, y + 1],
  }[side];
}

// ---------- La mappa che gira ----------

/** Come si sposta un vettore (riga, colonna) con la mappa girata: prima la rotazione oraria, poi il capovolgimento. */
function linear({ rot, flip }) {
  return ([a, b]) => {
    for (let i = 0; i < rot / 90; i++) [a, b] = [b, -a];
    if (flip === 'h') b = -b;
    if (flip === 'v') a = -a;
    return [a, b];
  };
}

/** La scritta della girata, in grande sul telefono del navigatore. */
export function orientationText({ rot, flip }) {
  const lines = [];
  if (rot === 90) lines.push('Ruotata di 90° a destra');
  if (rot === 180) lines.push('Ruotata di 180°');
  if (rot === 270) lines.push('Ruotata di 90° a sinistra');
  if (flip === 'h') lines.push('Capovolta in orizzontale');
  if (flip === 'v') lines.push('Capovolta in verticale');
  return lines.length ? lines : ['Mappa dritta'];
}

export function orientationHint({ rot, flip }) {
  if (!rot && !flip) return 'Il nord è in alto, come per l’esploratore.';
  const hints = [];
  if (rot && flip) hints.push('Prima ruotata, poi capovolta.');
  if (flip === 'h') hints.push('Destra e sinistra scambiate.');
  if (flip === 'v') hints.push('Sopra e sotto scambiati.');
  return hints.join(' ');
}

/**
 * La mappa intera.
 * @param m        { n, open, deco, bombs, exit }
 * @param options  { orientation, trail, start, exited } girata della mappa; strada fatta, partenza e uscita (a fine turno)
 */
export function mapSvg(m, { orientation = { rot: 0, flip: null }, trail = null, start = null, exited = false } = {}) {
  const n = m.n;
  const mid = (n - 1) / 2;
  const L = linear(orientation);
  const place = (i) => {
    const [a, b] = L([Math.floor(i / n) - mid, (i % n) - mid]);
    return { x: b + mid, y: a + mid };
  };
  const turn = (side) => {
    const [a, b] = L(VEC[side]);
    return SIDES.find((x) => VEC[x][0] === a && VEC[x][1] === b);
  };
  const pad = 0.45;
  const floor = s('g', { class: 'floor' });
  const decos = s('g', { class: 'decos' });
  const walls = s('g', { class: 'walls' });
  const marks = s('g', { class: 'marks' });
  for (let i = 0; i < n * n; i++) {
    const { x, y } = place(i);
    const color = FLOORS[m.deco[i]];
    floor.append(s('rect', { class: 'cell', x, y, width: 1, height: 1, fill: color ?? 'transparent' }));
    if (color) floor.append(s('rect', { class: 'cell--color', x: x + 0.07, y: y + 0.07, width: 0.86, height: 0.86 }));
    else if (m.deco[i]) decos.append(symbol(m.deco[i], x + 0.5, y + 0.5, 0.78));
    if (m.bombs.includes(i)) decos.append(bomb(x + 0.5, y + 0.5, 0.74));
    const r = Math.floor(i / n);
    const c = i % n;
    for (const side of SIDES) {
      if (m.open[i] & BIT[side]) continue;
      const rr = r + VEC[side][0];
      const cc = c + VEC[side][1];
      const outside = rr < 0 || cc < 0 || rr >= n || cc >= n;
      if (!outside && (side === 'S' || side === 'E')) continue; // il muro in comune si disegna una volta
      const shown = turn(side);
      if (m.exit.cell === i && m.exit.side === side) {
        const [x1, y1, x2, y2] = edge(x, y, shown);
        walls.append(door(x1, y1, x2, y2, [VEC[shown][1], VEC[shown][0]]));
      } else {
        walls.append(wallLine(...edge(x, y, shown)));
      }
    }
  }
  if (trail) {
    for (const [k, path] of trail.entries()) {
      const pts = path.map((i) => { const { x, y } = place(i); return `${x + 0.5},${y + 0.5}`; });
      // chi è uscito passa dalla porta
      if (exited && k === trail.length - 1) {
        const { x, y } = place(m.exit.cell);
        const [dy, dx] = VEC[turn(m.exit.side)];
        pts.push(`${x + 0.5 + dx * 0.95},${y + 0.5 + dy * 0.95}`);
      }
      if (pts.length > 1) marks.append(s('polyline', { class: 'trail', points: pts.join(' ') }));
      if (k < trail.length - 1) {
        const { x, y } = place(path.at(-1));
        marks.append(burst(x + 0.5, y + 0.5, 0.8));
      }
    }
  }
  if (start !== null) {
    const { x, y } = place(start);
    marks.append(s('circle', { class: 'start', cx: x + 0.5, cy: y + 0.5, r: 0.2 }));
  }
  return s('svg', {
    class: 'maze', viewBox: `${-pad} ${-pad} ${n + 2 * pad} ${n + 2 * pad}`, role: 'img', 'aria-label': 'Mappa del labirinto',
  },
  s('rect', { class: 'maze__paper', x: 0, y: 0, width: n, height: n }),
  s('path', { class: 'maze__grid', d: gridPath(n) }),
  floor, decos, marks, walls);
}

/** Solo i bordi delle caselle, senza quadretti dentro. */
function gridPath(n) {
  let d = '';
  for (let k = 0; k <= n; k++) d += `M${k} 0V${n}M0 ${k}H${n}`;
  return d;
}

// ---------- La torcia ----------

/** L'omino del quaderno, con la maglietta del colore della squadra. */
function omino(color, aside = false) {
  return s('g', { class: 'omino', transform: aside ? 'translate(.17 .1)' : null },
    s('g', { class: 'omino__body', fill: 'none', stroke: '#14297a', 'stroke-width': 0.055, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
      s('path', { d: 'M.5 .5V.64M.5 .52L.38 .6M.5 .52L.62 .6M.5 .64L.42 .78M.5 .64L.58 .78' }),
      s('path', { d: 'M.43 .47h.14l.03 .19h-.2z', fill: color, 'stroke-width': 0.04 }),
      s('circle', { cx: 0.5, cy: 0.37, r: 0.085, fill: '#fff' })));
}

// Delle caselle accanto si vede solo la striscia più vicina: una riga di quadretti su quattro.
const SEE = 0.25;
const HALF = {
  N: { x: 0, y: -SEE, w: 1, h: SEE }, S: { x: 0, y: 1, w: 1, h: SEE },
  W: { x: -SEE, y: 0, w: SEE, h: 1 }, E: { x: 1, y: 0, w: SEE, h: 1 },
};
// Dove comincia la casella accanto, per disegnarne i muri.
const NEXT = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const PAD = 0.06;
const VIEW = { x: -SEE - PAD, size: 1 + 2 * (SEE + PAD) };

/**
 * La torcia dell'esploratore: la casella dell'omino e la striscia vicina delle quattro accanto. Il nord è in alto.
 * @param torch  { here: { deco, walls }, around: { N|E|S|W: { deco, bomb, walls } | null } }
 */
export function torchSvg(torch, { color, event = null }) {
  const id = `t${++uid}`;
  const world = s('g', { class: 'world' });
  const lit = s('g', { class: 'lit' });
  const glow = s('radialGradient', { id: `${id}-glow`, cx: 0.5, cy: 0.5, r: 0.62 },
    s('stop', { offset: '45%', 'stop-color': '#0d1330', 'stop-opacity': 0 }),
    s('stop', { offset: '100%', 'stop-color': '#0d1330', 'stop-opacity': 0.72 }));

  const areas = [{ x: 0, y: 0, w: 1, h: 1, deco: torch.here.deco }];
  for (const side of SIDES) {
    const cell = torch.around[side];
    if (cell) areas.push({ ...HALF[side], deco: cell.deco, bomb: cell.bomb, side });
  }
  // La luce cade solo sulle caselle che ci sono: fuori dal bordo resta buio.
  const clip = s('clipPath', { id: `${id}-clip` }, areas.map((a) => s('rect', { x: a.x, y: a.y, width: a.w, height: a.h })));
  for (const a of areas) {
    lit.append(s('rect', { class: 'torch__floor', x: a.x, y: a.y, width: a.w, height: a.h }));
    // Niente quadretti: solo il contorno della casella (di quelle accanto, il pezzo che si vede).
    const [ox, oy] = a.side ? NEXT[a.side] : [0, 0];
    lit.append(s('rect', { class: 'maze__grid torch__edge', x: ox, y: oy, width: 1, height: 1 }));
    const color = FLOORS[a.deco];
    if (color) {
      lit.append(s('rect', { x: a.x, y: a.y, width: a.w, height: a.h, fill: color }));
      lit.append(s('rect', { class: 'cell--color', x: a.x + 0.05, y: a.y + 0.05, width: a.w - 0.1, height: a.h - 0.1 }));
    }
  }
  // Decori e bombe delle caselle accanto, nella striscia che si vede. La bomba sta dove stava quando
  // si vedeva mezza casella: la luce ne mostra solo il pezzo che cade nella striscia.
  for (const a of areas.slice(1)) {
    const cx = a.x + a.w / 2;
    const cy = a.y + a.h / 2;
    if (a.bomb) {
      const [dx, dy] = NEXT[a.side];
      lit.append(bomb(0.5 + dx * 0.75, 0.5 + dy * 0.75, 0.42));
    } else if (a.deco && !FLOORS[a.deco]) lit.append(symbol(a.deco, cx, cy, SEE * 0.85));
  }
  // Il simbolo della casella dell'omino, grande sul pavimento.
  // Il simbolo della casella dell'omino, grande sul pavimento; l'omino si sposta un po' per non coprirlo.
  const sym = torch.here.deco && !FLOORS[torch.here.deco];
  if (sym) lit.append(symbol(torch.here.deco, 0.4, 0.4, 0.66));

  const walls = s('g', { class: 'walls' });
  for (const side of SIDES) {
    const kind = torch.here.walls[side];
    const [x1, y1, x2, y2] = edge(0, 0, side);
    if (kind === 'wall') walls.append(wallLine(x1, y1, x2, y2, `wall${event?.type === 'wall' && event.dir === side ? ' is-hit' : ''}`));
    if (kind === 'door') walls.append(door(x1, y1, x2, y2, [VEC[side][1], VEC[side][0]]));
  }
  for (const side of SIDES) {
    const cell = torch.around[side];
    if (!cell) continue;
    const half = HALF[side];
    for (const [across, kind] of Object.entries(cell.walls)) {
      if (kind === 'open') continue;
      const [x1, y1, x2, y2] = edge(NEXT[side][0], NEXT[side][1], across);
      // della casella accanto si vede solo la striscia vicina
      const clipLine = (v1, v2, lo, hi) => [Math.max(Math.min(v1, v2), lo), Math.min(Math.max(v1, v2), hi)];
      const [ax, bx] = clipLine(x1, x2, half.x, half.x + half.w);
      const [ay, by] = clipLine(y1, y2, half.y, half.y + half.h);
      if (kind === 'door') walls.append(door(ax, ay, bx, by, [VEC[across][1], VEC[across][0]]));
      else walls.append(wallLine(ax, ay, bx, by));
    }
  }
  // Sotto i muri un alone di carta, così si staccano dal buio.
  const halo = walls.cloneNode(true);
  halo.setAttribute('class', 'walls walls--halo');
  world.append(s('g', { 'clip-path': `url(#${id}-clip)` }, lit, s('rect', { x: -SEE, y: -SEE, width: 1 + 2 * SEE, height: 1 + 2 * SEE, fill: `url(#${id}-glow)` })), halo, walls);
  const svg = s('svg', { class: `torch${event ? ` is-${event.type}` : ''}`, viewBox: `${VIEW.x} ${VIEW.x} ${VIEW.size} ${VIEW.size}`, role: 'img', 'aria-label': describe(torch) },
    s('defs', {}, clip, glow),
    s('rect', { class: 'torch__dark', x: VIEW.x, y: VIEW.x, width: VIEW.size, height: VIEW.size }),
    world,
    omino(color, sym));
  if (event?.dir) {
    svg.style.setProperty('--dx', VEC[event.dir][1]);
    svg.style.setProperty('--dy', VEC[event.dir][0]);
  }
  if (event?.type === 'bomb') svg.append(burst(0.5, 0.5, 1.5));
  return svg;
}

/** Quello che si vede, a parole, per chi usa un lettore di schermo. */
function describe(torch) {
  const name = (d) => DECO_NAMES[d] ?? d;
  const parts = [torch.here.deco ? `Sei su: ${name(torch.here.deco)}` : 'Casella vuota'];
  const words = { N: 'sopra', E: 'a destra', S: 'sotto', W: 'a sinistra' };
  for (const side of SIDES) {
    const w = torch.here.walls[side];
    const cell = torch.around[side];
    parts.push(`${words[side]}: ${w === 'wall' ? 'muro' : w === 'door' ? 'porta d’uscita' : cell?.bomb ? 'bomba' : cell?.deco ? name(cell.deco) : 'passaggio'}`);
  }
  return parts.join('; ');
}
