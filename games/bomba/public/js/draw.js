// I disegni della bomba, a biro e pastelli: i pezzi dei moduli, le miniature dell'indice, i disegni della smorfia.
import { h } from '/js/kit/dom.js';

export const S = (tag, attrs = {}, ...kids) => h(`svg:${tag}`, attrs, ...kids);
export const svg = (viewBox, cls, ...kids) => S('svg', { viewBox, class: cls, 'aria-hidden': 'true' }, ...kids);

export const INK = '#1b3aa8';
export const COLORS = {
  rosso: '#d7263d', rossa: '#d7263d',
  blu: '#2f5bd3',
  giallo: '#f6cd1a', gialla: '#f6cd1a',
  verde: '#2e9e4f',
  bianco: '#ffffff',
  nero: '#2b2d33',
};

// ---------- Pezzi ----------

/** Un filo da un morsetto all'altro; tagliato, ha un buco in mezzo con i capi sfilacciati. */
export function wire(color, cut, i = 0) {
  const y = 20;
  const wave = i % 2 ? 7 : -7;
  const whole = `M14 ${y} C 90 ${y + wave}, 210 ${y - wave}, 286 ${y}`;
  const left = `M14 ${y} C 60 ${y + wave * 0.7}, 110 ${y + wave * 0.6}, 136 ${y + 2}`;
  const right = `M164 ${y - 2} C 190 ${y - wave * 0.6}, 240 ${y - wave * 0.7}, 286 ${y}`;
  const paths = cut ? [left, right] : [whole];
  return svg('0 0 300 40', 'wire',
    paths.map((d) => S('path', { d, class: 'wire__edge' })),
    paths.map((d) => S('path', { d, class: 'wire__core', stroke: COLORS[color] })),
    cut && S('path', { d: `M136 ${y + 2} l6 -6 M136 ${y + 2} l7 4 M164 ${y - 2} l-6 6 M164 ${y - 2} l-7 -5`, class: 'wire__fray' }),
    S('rect', { x: 2, y: y - 9, width: 14, height: 18, rx: 3, class: 'wire__clamp' }),
    S('rect', { x: 284, y: y - 9, width: 14, height: 18, rx: 3, class: 'wire__clamp' }));
}

/** Una leva in una fessura, su o giù. */
export function lever(up) {
  const knob = up ? 26 : 114;
  return svg('0 0 60 140', 'lever',
    S('rect', { x: 22, y: 14, width: 16, height: 112, rx: 8, class: 'lever__slot' }),
    S('line', { x1: 30, y1: 70, x2: 30, y2: knob, class: 'lever__arm' }),
    S('circle', { cx: 30, cy: 70, r: 7, class: 'lever__pin' }),
    S('circle', { cx: 30, cy: knob, r: 15, class: 'lever__knob' }));
}

/** Il semaforo con una luce accesa. */
export function trafficLight(lit) {
  return svg('0 0 110 280', 'light',
    S('rect', { x: 48, y: 250, width: 14, height: 30, class: 'light__pole' }),
    S('rect', { x: 8, y: 6, width: 94, height: 250, rx: 22, class: 'light__box' }),
    ['rossa', 'gialla', 'verde'].flatMap((c, i) => [
      lit === c && S('circle', { cx: 55, cy: 52 + i * 78, r: 38, fill: COLORS[c], class: 'light__glow' }),
      S('circle', { cx: 55, cy: 52 + i * 78, r: 30, fill: COLORS[c], class: `light__lamp${lit === c ? ' is-on' : ''}` }),
    ]));
}

const PIPS = {
  1: [[50, 50]], 2: [[28, 28], [72, 72]], 3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]], 5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 26], [72, 26], [28, 50], [72, 50], [28, 74], [72, 74]],
};

export function die(color, value, cls = 'die') {
  return svg('0 0 100 100', `${cls} die--${color}`,
    S('rect', { x: 6, y: 6, width: 88, height: 88, rx: 18, class: 'die__body' }),
    PIPS[value].map(([cx, cy]) => S('circle', { cx, cy, r: 9, class: 'die__pip' })));
}

/** Una lampadina col suo numero sullo zoccolo. */
export function bulb(n, on) {
  return svg('0 0 70 120', `bulb${on ? ' is-on' : ''}`,
    on && S('g', { class: 'bulb__rays' },
      S('path', { d: 'M35 2v8M6 14l6 6M64 14l-6 6M0 44h8M62 44h8' })),
    S('path', { d: 'M35 12c-17 0-28 12-28 28 0 12 7 19 12 25 3 4 4 8 4 12h24c0-4 1-8 4-12 5-6 12-13 12-25 0-16-11-28-28-28z', class: 'bulb__glass' }),
    S('path', { d: 'M28 76l0-16 7-8 7 8 0 16', class: 'bulb__wire' }),
    S('rect', { x: 21, y: 78, width: 28, height: 26, rx: 4, class: 'bulb__base' }),
    S('path', { d: 'M21 86h28M21 94h28', class: 'bulb__screw' }),
    S('text', { x: 35, y: 119, class: 'bulb__n' }, String(n)));
}

/** Il manometro: tre zone e la lancetta (0 tutto a sinistra, 1 tutto a destra). */
export function gauge(needle, cls = 'gauge') {
  const at = (v, r) => {
    const a = Math.PI * (1 - v);
    return [60 + r * Math.cos(a), 64 - r * Math.sin(a)];
  };
  const arc = (from, to, color) => {
    const [x1, y1] = at(from, 44);
    const [x2, y2] = at(to, 44);
    return S('path', { d: `M${x1.toFixed(1)} ${y1.toFixed(1)} A44 44 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`, stroke: color, class: 'gauge__zone' });
  };
  const [nx, ny] = at(needle, 40);
  return svg('0 0 120 80', cls,
    S('path', { d: 'M8 64 A52 52 0 0 1 112 64 Z', class: 'gauge__face' }),
    arc(0, 0.4, COLORS.verde), arc(0.4, 0.66, COLORS.giallo), arc(0.66, 1, COLORS.rosso),
    S('line', { x1: 60, y1: 64, x2: nx.toFixed(1), y2: ny.toFixed(1), class: 'gauge__needle' }),
    S('circle', { cx: 60, cy: 64, r: 6, class: 'gauge__pin' }));
}

/** La moka sul fornello, col manometro attaccato sopra. */
export function moka(needle) {
  return svg('0 0 300 250', 'moka',
    // fornello e fiamma
    S('path', { d: 'M40 236h170', class: 'moka__stove' }),
    S('path', { d: 'M88 228c-6-10 4-14 0-24 10 6 10 16 6 24M118 228c-8-12 6-18 0-30 12 8 12 20 6 30M150 228c-6-10 4-14 0-24 10 6 10 16 6 24', class: 'moka__flame' }),
    // la moka
    S('path', { d: 'M78 214l14-60h62l14 60z', class: 'moka__pot' }),
    S('path', { d: 'M92 154l-4-6h70l-4 6z', class: 'moka__waist' }),
    S('path', { d: 'M88 148l12-62h46l12 62z', class: 'moka__pot' }),
    S('path', { d: 'M96 86q27-18 54 0z', class: 'moka__lid' }),
    S('circle', { cx: 123, cy: 72, r: 5, class: 'moka__knob' }),
    S('path', { d: 'M100 98l-26 10 4 40 14-8', class: 'moka__handle' }),
    S('path', { d: 'M146 92l14-10', class: 'moka__spout' }),
    S('path', { d: 'M110 182h26M114 120h18', class: 'moka__line' }),
    // il tubicino e il manometro
    S('path', { d: 'M158 120h60v-12', class: 'moka__pipe' }),
    S('g', { transform: 'translate(138 2)' }, S('rect', { x: 0, y: 0, width: 160, height: 108, rx: 14, class: 'moka__gaugebox' }),
      S('g', { transform: 'translate(8 8)' }, sized(gauge(needle, 'gauge gauge--in'), 144, 96))));
}

function sized(el, width, height) {
  el.setAttribute('width', width);
  el.setAttribute('height', height);
  return el;
}

const ARROW_ANGLE = { su: 0, destra: 90, giu: 180, sinistra: 270 };

export function compass(arrow, cls = 'compass') {
  return svg('0 0 200 200', cls,
    S('circle', { cx: 100, cy: 100, r: 92, class: 'compass__rim' }),
    S('circle', { cx: 100, cy: 100, r: 78, class: 'compass__face' }),
    Array.from({ length: 16 }, (_, i) => {
      const a = (i * Math.PI) / 8;
      const r1 = i % 4 ? 70 : 62;
      return S('line', {
        x1: (100 + r1 * Math.sin(a)).toFixed(1), y1: (100 - r1 * Math.cos(a)).toFixed(1),
        x2: (100 + 78 * Math.sin(a)).toFixed(1), y2: (100 - 78 * Math.cos(a)).toFixed(1), class: 'compass__tick',
      });
    }),
    S('g', { transform: `rotate(${ARROW_ANGLE[arrow]} 100 100)` },
      S('path', { d: 'M100 30l22 40h-12v62h-20v-62h-12z', class: 'compass__arrow' })),
    S('circle', { cx: 100, cy: 100, r: 6, class: 'compass__pin' }));
}

/** Il lucchetto: arco in alto e corpo colorato (le rotelle sono bottoni HTML sopra il corpo). */
export function padlock() {
  return svg('0 0 200 90', 'padlock',
    S('path', { d: 'M48 90V52a52 46 0 0 1 104 0v38', class: 'padlock__shackle' }),
    S('path', { d: 'M48 90V52a52 46 0 0 1 104 0v38', class: 'padlock__shine' }));
}

// ---------- La smorfia ----------

const P = (d, cls = '') => S('path', { d, class: cls });
const C = (cx, cy, r, cls = '') => S('circle', { cx, cy, r, class: cls });

export const SMORFIA_ART = {
  italia: () => [
    P('M27 9l12-2 8 2 4 6-3 4 3 6 6 9 9 9 8 6 8 5 5 7-2 4-6-3-5 1-3 5 4 6-3 8-5 4-3-5 2-8-6-7-8-6-9-8-7-10-6-9-3-9-6-4-2-6z', 'art-fill art-green'),
    P('M58 88l14-5 6 3-6 6-12 0z', 'art-fill art-green'),
    P('M30 55c4-2 9-1 10 3l-1 13c-2 4-7 4-9 1l-2-10z', 'art-fill art-green'),
  ],
  bambina: () => [
    C(50, 26, 14, 'art-fill art-skin'),
    C(32, 22, 6, 'art-fill art-brown'), C(68, 22, 6, 'art-fill art-brown'),
    P('M36 22c0-12 28-12 28 0c-6-4-22-4-28 0z', 'art-fill art-brown'),
    C(45, 25, 1.8, 'art-dot'), C(55, 25, 1.8, 'art-dot'), P('M45 32q5 4 10 0'),
    P('M50 40l-20 40h40z', 'art-fill art-pink'),
    P('M38 50l-12 12M62 50l12 12M43 80v14M57 80v14'),
  ],
  gatta: () => [
    P('M22 30l6-22 16 14h12l16-14 6 22c4 8 4 18 0 26-6 14-20 20-28 20s-22-6-28-20c-4-8-4-18 0-26z', 'art-fill art-orange'),
    P('M34 40q4-5 8 0M58 40q4-5 8 0'),
    P('M46 52h8l-4 5z', 'art-fill art-pink'),
    P('M50 57q-4 6-9 3M50 57q4 6 9 3'),
    P('M40 54l-24-4M40 58l-24 2M60 54l24-4M60 58l24 2'),
  ],
  maiale: () => [
    P('M24 26l-4-16 18 8M76 26l4-16-18 8', 'art-fill art-pink'),
    C(50, 50, 32, 'art-fill art-pink'),
    S('ellipse', { cx: 50, cy: 60, rx: 16, ry: 11, class: 'art-fill art-pinkdeep' }),
    C(44, 60, 3, 'art-dot'), C(56, 60, 3, 'art-dot'),
    C(38, 40, 3, 'art-dot'), C(62, 40, 3, 'art-dot'),
  ],
  mano: () => [
    P('M30 92l-4-30c-2-8-12-18-6-22 5-3 10 6 14 12V18c0-6 9-6 9 0v26V10c0-6 9-6 9 0v34V14c0-6 9-6 9 0v32V24c0-6 9-6 9 0v40c0 14-6 22-12 28z', 'art-fill art-skin'),
  ],
  topi: () => S('g', { transform: 'translate(0 -14)' },
    P('M8 62c0-14 12-22 26-20 10 2 14 10 14 20H8z', 'art-fill art-grey'),
    C(32, 40, 7, 'art-fill art-grey'), C(14, 58, 1.8, 'art-dot'), P('M8 62l-4 1'),
    P('M48 62c10 0 10 12 0 14s-6 12 4 12', 'art-tail'),
    P('M50 82c0-14 12-22 26-20 10 2 14 10 14 20H50z', 'art-fill art-grey'),
    C(74, 60, 7, 'art-fill art-grey'), C(56, 78, 1.8, 'art-dot'), P('M50 82l-4 1'),
    P('M90 82c8-2 8-12 2-16', 'art-tail')
  ),
  soldati: () => [0, 40].map((x) => S('g', { transform: `translate(${x} 0)` },
    S('rect', { x: 18, y: 6, width: 16, height: 18, rx: 3, class: 'art-fill art-black' }),
    C(26, 30, 8, 'art-fill art-skin'),
    S('rect', { x: 16, y: 38, width: 20, height: 30, rx: 3, class: 'art-fill art-red' }),
    P('M20 68v24M32 68v24M16 44l-6 16'),
    P('M40 20v50', 'art-gun'),
    P('M36 46h6'))),
  risata: () => [
    C(50, 50, 40, 'art-fill art-yellow'),
    P('M28 38q6-8 12 0M60 38q6-8 12 0'),
    P('M26 54h48c0 18-12 28-24 28S26 72 26 54z', 'art-fill art-mouth'),
    P('M30 56h40'),
    P('M18 40q-6 8-2 14M82 40q6 8 2 14', 'art-tear'),
  ],
  festa: () => [
    P('M30 52c-10 0-16-10-16-20s7-18 16-18 16 8 16 18-6 20-16 20z', 'art-fill art-red'),
    P('M70 46c-10 0-16-10-16-20s7-18 16-18 16 8 16 18-6 20-16 20z', 'art-fill art-blue'),
    P('M50 64c-9 0-14-9-14-17s6-16 14-16 14 7 14 16-5 17-14 17z', 'art-fill art-yellow'),
    P('M30 52q-4 16 8 40M70 46q6 20-12 46M50 64q2 14 -2 28'),
    P('M10 70l4 4M86 66l4-4M14 86l5-1M80 84l4 4M24 66l3-4', 'art-confetti'),
  ],
  testa: () => [
    P('M62 92V76c10 0 16-4 16-10v-8l6-2-6-12c0-20-12-34-32-34-18 0-30 14-30 32 0 14 8 24 18 28v22', 'art-fill art-skin'),
    P('M16 42c0-18 12-30 30-30 18 0 30 12 32 26-10-6-20-12-36-10-8 1-12 6-14 14z', 'art-fill art-brown'),
    S('ellipse', { cx: 42, cy: 50, rx: 5, ry: 8, class: 'art-fill art-skin' }),
    C(66, 46, 2, 'art-dot'), P('M66 66h8'),
  ],
  paura: () => [
    P('M22 30l-4-16 12 10 4-18 8 16 8-18 6 18 8-16 4 18 12-10-4 16', 'art-hair'),
    C(50, 54, 36, 'art-fill art-pale'),
    C(36, 46, 10, 'art-fill art-white'), C(64, 46, 10, 'art-fill art-white'),
    C(36, 46, 2.5, 'art-dot'), C(64, 46, 2.5, 'art-dot'),
    P('M26 30l18 6M74 30l-18 6'),
    S('ellipse', { cx: 50, cy: 72, rx: 9, ry: 12, class: 'art-fill art-mouth' }),
    P('M88 52q4 8 0 10q-4-2 0-10z', 'art-fill art-blue'),
  ],
};

export function smorfia(picture, cls = 'art') {
  return svg('0 0 100 100', cls, SMORFIA_ART[picture]());
}

// ---------- Miniature dell'indice (e dei quadratini sulla bomba) ----------

export const THUMBS = {
  fili: () => [
    ['rosso', 22], ['blu', 40], ['giallo', 58], ['nero', 76],
  ].flatMap(([c, y]) => [P(`M10 ${y}q40-8 80 0`, 'th-edge'), S('path', { d: `M10 ${y}q40-8 80 0`, stroke: COLORS[c], class: 'th-wire' })]),
  leve: () => [0, 1, 2, 3, 4].flatMap((i) => {
    const x = 14 + i * 18;
    const up = [true, false, true, true, false][i];
    return [S('rect', { x: x - 4, y: 18, width: 8, height: 64, rx: 4, class: 'th-slot' }), C(x, up ? 26 : 74, 8, 'th-knob')];
  }),
  semaforo: () => [
    S('rect', { x: 30, y: 4, width: 40, height: 92, rx: 12, class: 'th-box' }),
    ...['rossa', 'gialla', 'verde'].map((c, i) => S('circle', { cx: 50, cy: 22 + i * 28, r: 10, fill: COLORS[c] })),
  ],
  parola: () => [
    S('rect', { x: 8, y: 10, width: 84, height: 30, rx: 4, class: 'th-screen' }),
    S('text', { x: 50, y: 31, class: 'th-word' }, 'CASA'),
    ...[[8, 50], [52, 50], [8, 74], [52, 74]].map(([x, y]) => S('rect', { x, y, width: 40, height: 18, rx: 5, class: 'th-key' })),
  ],
  cassaforte: () => [
    S('rect', { x: 14, y: 6, width: 72, height: 20, rx: 3, class: 'th-screen' }),
    ...Array.from({ length: 12 }, (_, i) => S('rect', { x: 18 + (i % 3) * 22, y: 32 + Math.floor(i / 3) * 16, width: 18, height: 12, rx: 3, class: 'th-key' })),
  ],
  lucchetto: () => [
    P('M30 46V30a20 20 0 0 1 40 0v16', 'th-shackle'),
    S('rect', { x: 16, y: 44, width: 68, height: 50, rx: 8, fill: COLORS.verde, class: 'th-body' }),
    ...[0, 1, 2].map((i) => S('rect', { x: 24 + i * 19, y: 56, width: 14, height: 26, rx: 3, class: 'th-wheel' })),
  ],
  bandiera: () => [
    P('M14 8v88', 'th-pole'),
    ...['verde', 'bianco', 'rosso'].map((c, i) => S('rect', { x: 16 + i * 26, y: 12, width: 26, height: 52, fill: COLORS[c], class: 'th-stripe' })),
  ],
  dado: () => [
    S('rect', { x: 14, y: 14, width: 72, height: 72, rx: 14, class: 'th-die' }),
    ...[[32, 32], [50, 50], [68, 68]].map(([cx, cy]) => C(cx, cy, 7, 'th-pip')),
  ],
  lampadine: () => [0, 1, 2, 3].flatMap((i) => {
    const x = 14 + i * 24;
    return [C(x, 40, 10, i % 2 ? 'th-bulb' : 'th-bulb is-on'), S('rect', { x: x - 5, y: 52, width: 10, height: 12, class: 'th-base' }),
      S('text', { x, y: 82, class: 'th-n' }, String(i + 1))];
  }),
  tombola: () => [
    S('rect', { x: 18, y: 6, width: 64, height: 50, rx: 6, class: 'th-screen th-screen--light' }),
    S('g', { transform: 'translate(30 8) scale(.46)', class: 'art' }, SMORFIA_ART.gatta()),
    ...[0, 1, 2, 3].map((i) => S('rect', { x: 6 + i * 23, y: 66, width: 19, height: 22, rx: 5, class: 'th-key' })),
  ],
  moka: () => [
    P('M30 92l8-28h28l8 28z', 'th-pot'), P('M36 62l6-28h20l6 28z', 'th-pot'),
    P('M40 34q12-8 24 0z', 'th-pot'),
    P('M56 18 A20 20 0 0 1 96 18', 'th-gaugeface'),
    P('M76 18l10-12', 'th-needle'),
  ],
  bussola: () => [
    C(50, 50, 40, 'th-rim'),
    P('M50 18l12 22h-7v30h-10v-30h-7z', 'th-arrow'),
  ],
};

export function thumb(type, cls = 'thumb') {
  return svg('0 0 100 100', cls, THUMBS[type]());
}
