// I disegni della bomba, a biro e pastelli: i pezzi dei moduli, le miniature dell'indice, i disegni della smorfia.
import { h } from '/js/kit/dom.js';

export const S = (tag, attrs = {}, ...kids) => h(`svg:${tag}`, attrs, ...kids);
export const svg = (viewBox, cls, ...kids) => S('svg', { viewBox, class: cls, 'aria-hidden': 'true' }, ...kids.flat(Infinity));

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

export const SCOOP_COLORS = {
  cioccolato: '#6b3f1f', fragola: '#f4a3b8', limone: '#f8e27a', pistacchio: '#a9c96a', fiordilatte: '#fbf7ec',
  stracciatella: '#fbf7ec', puffo: '#5fb4f0', liquirizia: '#26272d', pesca: '#f6a35c',
};

/** Il cono con una pallina; la stracciatella ha le gocce di cioccolato. */
export function gelato(flavor, cls = 'gelato') {
  const chips = flavor === 'stracciatella'
    ? [[78, 62], [104, 54], [122, 76], [92, 88], [66, 92], [116, 104], [86, 112], [134, 96]].map(([x, y], i) => S('path', {
      d: `M${x} ${y}l${5 + (i % 3)} -3l2 6z`, class: 'gelato__chip',
    }))
    : [];
  return svg('0 0 200 260', cls,
    S('path', { d: 'M56 110L100 250L144 110z', class: 'gelato__cone' }),
    S('clipPath', { id: 'gelato-cone' }, S('path', { d: 'M56 110L100 250L144 110z' })),
    S('path', { d: 'M40 120L150 200M40 160L150 120M40 200L150 160M40 160L150 240M40 240L150 200', class: 'gelato__waffle', 'clip-path': 'url(#gelato-cone)' }),
    S('path', {
      d: 'M44 112c-6-40 22-74 56-74s62 34 56 74c-8 6-16 2-22 6-8-6-16 0-24-4-8 6-18 2-24 4-8-6-16 0-22-4-8 4-14 2-20-2z',
      fill: SCOOP_COLORS[flavor], class: 'gelato__scoop',
    }),
    S('ellipse', { cx: 76, cy: 66, rx: 12, ry: 8, class: 'gelato__shine' }),
    chips);
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
  gelato: () => [
    P('M34 48L50 94L66 48z', 'th-cone'),
    P('M28 50c-2-18 9-32 22-32s24 14 22 32c-6 3-10 0-14 2-4-3-8 0-12-1-4 3-8 0-12 1z', 'th-scoop'),
  ],
};

export function thumb(type, cls = 'thumb') {
  return svg('0 0 100 100', cls, THUMBS[type]());
}

// ---------- I moduli nuovi ----------

export const PAINT_COLORS = {
  ...COLORS, arancione: '#f08a24', viola: '#7d3fb8', grigio: '#9aa1ab', rosa: '#f3a6c0', marrone: '#8a5a2b',
};

/** Gli ingredienti sulla pizza: ognuno è un mucchietto di pezzi sparsi sul disco. */
const SPOTS = [[-30, -38], [28, -40], [44, 4], [26, 40], [-24, 42], [-46, 2], [0, 0], [-6, -54], [52, -24], [-50, -26], [8, 56], [-56, 30]];
const spread = (seed, n, draw) => Array.from({ length: n }, (_, i) => {
  const [x, y] = SPOTS[(seed + i * 5) % SPOTS.length];
  return S('g', { transform: `translate(${100 + x * 1.05} ${100 + y * 1.05}) rotate(${(seed * 37 + i * 71) % 360})` }, draw(i));
});
const TOPPING = {
  mozzarella: (k) => spread(k, 7, () => S('path', { d: 'M-11 -6q6-8 15-2q9 4 6 11q-5 8-14 4q-11-3-7-13z', class: 'pz-mozz' })),
  basilico: (k) => spread(k + 2, 4, () => S('path', { d: 'M0 -10q10 6 0 20q-10-14 0-20zM0 -8v16', class: 'pz-leaf' })),
  origano: (k) => spread(k + 1, 12, () => S('circle', { r: 2.2, class: 'pz-herb' })),
  aglio: (k) => spread(k + 3, 5, () => S('path', { d: 'M-5 6q-3-10 5-14q8 4 5 14z', class: 'pz-garlic' })),
  salame: (k) => spread(k + 4, 6, () => [S('circle', { r: 11, class: 'pz-salami' }), S('circle', { cx: -3, cy: -3, r: 2, class: 'pz-fat' }), S('circle', { cx: 4, cy: 3, r: 1.8, class: 'pz-fat' })]),
  funghi: (k) => spread(k + 5, 5, () => S('path', { d: 'M-10 0q0-11 10-11t10 11h-6v8h-8v-8z', class: 'pz-mush' })),
  acciughe: (k) => spread(k + 6, 4, () => S('path', { d: 'M-14 0q14-7 26 0l5-4v8l-5-4q-12 7-26 0z', class: 'pz-fish' })),
  capperi: (k) => spread(k + 7, 7, () => S('circle', { r: 4, class: 'pz-caper' })),
  prosciutto: (k) => spread(k + 8, 4, () => S('path', { d: 'M-13 -4q5-7 13-2t13 0q-2 9-13 8t-13-6z', class: 'pz-ham' })),
  carciofi: (k) => spread(k + 9, 4, () => S('path', { d: 'M0 -11q8 5 6 13q-6 4-12 0q-2-8 6-13zM0 -6v12', class: 'pz-arti' })),
  olive: (k) => spread(k + 10, 6, () => S('circle', { r: 5.5, class: 'pz-olive' })),
  patate: (k) => spread(k + 11, 7, () => S('ellipse', { rx: 11, ry: 8, class: 'pz-potato' })),
  formaggi: (k) => ['pz-c1', 'pz-c2', 'pz-c3', 'pz-c4'].flatMap((cls, j) => spread(k + j * 3, 3, () => S('path', { d: 'M-9 -7h18l-3 14h-14z', class: cls }))),
};

export function pizza(top, cls = 'pizza') {
  const red = top.includes('pomodoro');
  return svg('0 0 200 200', cls,
    S('circle', { cx: 100, cy: 100, r: 94, class: 'pz-crust' }),
    S('circle', { cx: 100, cy: 100, r: 80, class: red ? 'pz-sauce' : 'pz-white' }),
    top.filter((t) => t !== 'pomodoro').map((t, k) => TOPPING[t](k * 3)));
}

/** Il termometro: la colonnina rossa sale da -10 a 40 gradi. */
export function thermometer(temp) {
  const y = (t) => 214 - ((t + 10) / 50) * 180;
  const ticks = [-10, 0, 10, 20, 30, 40];
  return svg('0 0 140 260', 'thermo',
    S('rect', { x: 50, y: 18, width: 40, height: 210, rx: 20, class: 'thermo__glass' }),
    S('circle', { cx: 70, cy: 226, r: 28, class: 'thermo__bulb' }),
    S('rect', { x: 62, y: y(temp), width: 16, height: 226 - y(temp), class: 'thermo__mercury' }),
    ticks.map((t) => S('path', { d: `M90 ${y(t)}h14`, class: 'thermo__tick' })),
    ticks.map((t) => S('text', { x: 110, y: y(t) + 6, class: 'thermo__n' }, String(t))));
}

/** I cartelli stradali. */
export function roadSign(sign, cls = 'sign') {
  const W = 'sign__white';
  const shapes = {
    ottagono: [S('path', { d: 'M62 10h76l52 52v76l-52 52H62l-52-52V62z', class: 'sign__red' }), S('rect', { x: 48, y: 88, width: 104, height: 24, rx: 4, class: W })],
    'cerchio-rosso': [S('circle', { cx: 100, cy: 100, r: 90, class: 'sign__red' }), S('rect', { x: 36, y: 86, width: 128, height: 28, rx: 4, class: W })],
    divieto: [S('circle', { cx: 100, cy: 100, r: 90, class: 'sign__red' }), S('circle', { cx: 100, cy: 100, r: 66, class: W })],
    'triangolo-giu': [S('path', { d: 'M10 22h180L100 186z', class: 'sign__red' }), S('path', { d: 'M44 42h112L100 146z', class: W })],
    'triangolo-su': [S('path', { d: 'M100 14l90 164H10z', class: 'sign__red' }), S('path', { d: 'M100 52l56 104H44z', class: W }),
      S('path', { d: 'M100 80v40M100 134v6', class: 'sign__mark' })],
    'cerchio-blu': [S('circle', { cx: 100, cy: 100, r: 90, class: 'sign__blue' }), S('path', { d: 'M100 48l34 40h-20v54h-28V88H66z', class: W })],
    'quadrato-blu': [S('rect', { x: 14, y: 14, width: 172, height: 172, rx: 14, class: 'sign__blue' }), S('text', { x: 100, y: 140, class: 'sign__letter' }, 'P')],
    rombo: [S('path', { d: 'M100 8l92 92-92 92-92-92z', class: 'sign__white sign__edge' }), S('path', { d: 'M100 34l66 66-66 66-66-66z', class: 'sign__yellow' })],
  };
  return svg('0 0 200 200', cls, shapes[sign]);
}

/** L'orologio a lancette; `minutes` sono i minuti dopo mezzanotte. */
export function clockFace(minutes, cls = 'clock') {
  const m = minutes % 60;
  const hAngle = ((minutes % 720) / 720) * 360;
  const mAngle = (m / 60) * 360;
  return svg('0 0 200 200', cls,
    S('circle', { cx: 100, cy: 100, r: 92, class: 'clock__rim' }),
    S('circle', { cx: 100, cy: 100, r: 80, class: 'clock__face' }),
    Array.from({ length: 12 }, (_, i) => {
      const a = (i * Math.PI) / 6;
      return S('text', { x: (100 + 64 * Math.sin(a)).toFixed(1), y: (100 - 64 * Math.cos(a) + 7).toFixed(1), class: 'clock__n' }, String(i || 12));
    }),
    S('line', { x1: 100, y1: 100, x2: 100, y2: 52, class: 'clock__hour', transform: `rotate(${hAngle} 100 100)` }),
    S('line', { x1: 100, y1: 100, x2: 100, y2: 30, class: 'clock__min', transform: `rotate(${mAngle} 100 100)` }),
    S('circle', { cx: 100, cy: 100, r: 6, class: 'clock__pin' }));
}

/** Una banconota da 10, 20 o 50 euro. */
export function banknote(value) {
  return svg('0 0 180 90', `note note--${value}`,
    S('rect', { x: 4, y: 4, width: 172, height: 82, rx: 8, class: 'note__paper' }),
    S('circle', { cx: 132, cy: 45, r: 26, class: 'note__seal' }),
    S('text', { x: 18, y: 36, class: 'note__eur' }, 'EURO'),
    S('text', { x: 18, y: 76, class: 'note__val' }, String(value)));
}

/** Una macchia di colore. */
export function blob(color, flip = false) {
  return svg('0 0 120 110', 'blob',
    S('path', {
      d: 'M60 8c22 0 40 10 46 30s-2 34-12 46-30 22-48 18-36-14-38-36 8-36 22-46 18-12 30-12z',
      fill: PAINT_COLORS[color], class: 'blob__paint', transform: flip ? 'scale(-1 1) translate(-120 0)' : null,
    }),
    S('ellipse', { cx: 42, cy: 34, rx: 12, ry: 7, class: 'blob__shine' }));
}

/** Un ingranaggio a dieci denti. */
function gear(cx, cy, r, red) {
  const teeth = 10;
  let d = '';
  for (let i = 0; i < teeth * 2; i++) {
    const a1 = (i * Math.PI) / teeth;
    const a2 = ((i + 1) * Math.PI) / teeth;
    const rr = i % 2 ? r : r + 9;
    d += `${i ? 'L' : 'M'}${(cx + rr * Math.cos(a1)).toFixed(1)} ${(cy + rr * Math.sin(a1)).toFixed(1)}L${(cx + rr * Math.cos(a2)).toFixed(1)} ${(cy + rr * Math.sin(a2)).toFixed(1)}`;
  }
  return [S('path', { d: `${d}z`, class: `gear${red ? ' gear--red' : ''}` }), S('circle', { cx, cy, r: r * 0.32, class: 'gear__hub' })];
}

/** La fila di ingranaggi: quelli che si toccano sono vicini, quelli con la cinghia lontani e legati. */
export function gears({ gears: list, first }) {
  const r = 30;
  const xs = [50];
  list.slice(0, -1).forEach((g) => xs.push(xs.at(-1) + (g.belt ? 2 * r + 46 : 2 * r + 9)));
  const width = xs.at(-1) + 50;
  const cy = 70;
  const arrow = first === 'orario'
    ? 'M26 34 A32 32 0 0 1 74 34' : 'M74 34 A32 32 0 0 0 26 34';
  return svg(`0 0 ${width} 150`, 'gears',
    list.map((g, i) => g.belt && S('path', {
      d: `M${xs[i]} ${cy - r + 4}L${xs[i + 1]} ${cy - r + 4}M${xs[i]} ${cy + r - 4}L${xs[i + 1]} ${cy + r - 4}`, class: 'gears__belt',
    })),
    list.flatMap((g, i) => gear(xs[i], cy, r, g.red)),
    S('path', { d: arrow, class: 'gears__arrow', transform: `translate(0 -8)`, 'marker-end': 'url(#gear-head)' }),
    S('defs', {}, S('marker', { id: 'gear-head', viewBox: '0 0 10 10', refX: 5, refY: 5, markerWidth: 4, markerHeight: 4, orient: 'auto-start-reverse' },
      S('path', { d: 'M0 0L10 5L0 10z', class: 'gears__head' }))));
}

/** I semi delle carte napoletane, disegnati semplici. */
export const SUIT_ART = {
  coppe: () => [S('path', { d: 'M14 10h32q0 22-16 26q-16-4-16-26z', class: 'suit--cup' }), S('path', { d: 'M30 36v12M20 52h20', class: 'suit--cupfoot' })],
  denari: () => [S('circle', { cx: 30, cy: 30, r: 22, class: 'suit--coin' }), S('circle', { cx: 30, cy: 30, r: 11, class: 'suit--coinin' })],
  spade: () => [S('path', { d: 'M30 4l6 8v30h-12V12z', class: 'suit--blade' }), S('path', { d: 'M16 42h28M30 42v14', class: 'suit--hilt' })],
  bastoni: () => [S('path', { d: 'M22 56l14-50q8 2 6 10l-12 42z', class: 'suit--club' }), S('path', { d: 'M30 26l-8-4M34 16l6-6', class: 'suit--twig' })],
};
const CARD_NAMES = { 8: 'Fante', 9: 'Cavallo', 10: 'Re', 1: 'Asso' };

/** Una carta: numero, seme e (per le figure e l'asso) il nome. */
export function card({ s, n }, cls = 'card') {
  return svg('0 0 80 120', `${cls} card--${s}`,
    S('rect', { x: 3, y: 3, width: 74, height: 114, rx: 8, class: 'card__paper' }),
    S('text', { x: 12, y: 30, class: 'card__n' }, String(n)),
    S('g', { transform: 'translate(18 40)' }, SUIT_ART[s]()),
    CARD_NAMES[n] && S('text', { x: 40, y: 110, class: 'card__name' }, CARD_NAMES[n]));
}

/** La bilancia a due piatti: a sinistra i pesi del modulo, a destra quelli messi dall'artificiere. Sempre in pari: non tradisce. */
export function scale(left, right) {
  const weight = (x, w, i) => S('g', { transform: `translate(${x + i * 34} 52)` },
    S('path', { d: 'M4 30h26l-4-26h-18z', class: 'weight' }), S('text', { x: 17, y: 26, class: 'weight__n' }, String(w)));
  return svg('0 0 300 190', 'scale',
    S('path', { d: 'M150 40v130M110 176h80', class: 'scale__post' }),
    S('path', { d: 'M40 40h220', class: 'scale__beam' }),
    S('circle', { cx: 150, cy: 40, r: 8, class: 'scale__pin' }),
    S('path', { d: 'M40 40l-26 46M40 40l26 46M260 40l-26 46M260 40l26 46', class: 'scale__string' }),
    S('path', { d: 'M4 86h72q-6 18-36 18t-36-18zM224 86h72q-6 18-36 18t-36-18z', class: 'scale__pan' }),
    left.map((w, i) => weight(40 - (left.length * 34) / 2, w, i)),
    right.map((w, i) => weight(260 - (right.length * 34) / 2, w, i)));
}

/** Un interruttore colorato con la spia sopra. */
export function powerSwitch(color, lamp, up) {
  return svg('0 0 60 150', 'switch',
    S('circle', { cx: 30, cy: 20, r: 13, class: `switch__lamp${lamp ? ' is-on' : ''}` }),
    S('rect', { x: 8, y: 44, width: 44, height: 98, rx: 8, class: 'switch__plate' }),
    S('rect', { x: 18, y: up ? 54 : 94, width: 24, height: 38, rx: 6, fill: COLORS[color], class: 'switch__toggle' }));
}

Object.assign(THUMBS, {
  pizza: () => [C(50, 50, 44, 'th-crust'), C(50, 50, 36, 'th-sauce'), ...[[38, 38], [62, 44], [46, 64], [64, 64]].map(([x, y]) => C(x, y, 7, 'th-mozz')),
    P('M34 54q6 4 0 10q-6-6 0-10z', 'th-leaf')],
  termometro: () => [S('rect', { x: 40, y: 6, width: 20, height: 72, rx: 10, class: 'th-glass' }), C(50, 80, 14, 'th-merc'),
    S('rect', { x: 46, y: 36, width: 8, height: 44, class: 'th-merc' })],
  cartello: () => [P('M50 8l42 76H8z', 'th-signred'), P('M50 30l23 42H27z', 'th-signwhite')],
  orologio: () => [C(50, 50, 42, 'th-rim'), P('M50 50V22M50 50l18 10', 'th-hands')],
  scontrino: () => [P('M24 6h52v84l-6-5-7 5-6-5-7 5-6-5-7 5-6-5-7 5z', 'th-receipt'), P('M32 22h36M32 36h36M32 50h36M32 66h20', 'th-lines')],
  telefono: () => [S('rect', { x: 26, y: 4, width: 48, height: 92, rx: 8, class: 'th-box' }), S('rect', { x: 31, y: 12, width: 38, height: 18, rx: 2, class: 'th-screen' }),
    ...Array.from({ length: 9 }, (_, i) => S('rect', { x: 32 + (i % 3) * 13, y: 36 + Math.floor(i / 3) * 16, width: 10, height: 11, rx: 2, class: 'th-key' }))],
  tavolozza: () => [P('M50 8c26 0 44 16 44 36 0 12-10 14-18 12-8-2-12 4-8 12 4 10-6 24-22 24C24 92 6 72 6 48S24 8 50 8z', 'th-palette'),
    C(30, 34, 8, 'th-paint-r'), C(52, 24, 8, 'th-paint-y'), C(72, 34, 8, 'th-paint-b')],
  ingranaggi: () => [...gear(32, 50, 18, false), ...gear(70, 50, 18, false)],
  briscola: () => [S('rect', { x: 14, y: 10, width: 40, height: 62, rx: 5, class: 'th-card', transform: 'rotate(-10 34 41)' }),
    S('rect', { x: 44, y: 22, width: 40, height: 62, rx: 5, class: 'th-card', transform: 'rotate(8 64 53)' }), C(64, 52, 9, 'th-coin')],
  cifrario: () => [S('rect', { x: 8, y: 10, width: 84, height: 28, rx: 4, class: 'th-screen' }), S('text', { x: 50, y: 31, class: 'th-word' }, 'VTGPQ'),
    ...[0, 1, 2, 3, 4].map((i) => S('rect', { x: 10 + i * 17, y: 52, width: 13, height: 34, rx: 3, class: 'th-wheel' }))],
  barista: () => [P('M24 40h44v18q0 22-22 22t-22-22z', 'th-cup'), P('M68 46q14 0 12 12t-14 8', 'th-handle'), P('M36 30q4-8 0-16M50 30q4-8 0-16', 'th-steam')],
  schedina: () => [S('rect', { x: 10, y: 6, width: 80, height: 88, rx: 4, class: 'th-receipt' }),
    ...[0, 1, 2, 3].flatMap((r) => [0, 1, 2].map((c) => S('rect', { x: 46 + c * 14, y: 16 + r * 19, width: 11, height: 12, rx: 2, class: (r + c) % 3 ? 'th-key' : 'th-key th-key--on' })))],
  anagramma: () => ['G', 'A', 'T', 'O'].map((l, i) => [S('rect', { x: 6 + i * 23, y: 34, width: 20, height: 26, rx: 4, class: 'th-tile' }), S('text', { x: 16 + i * 23, y: 54, class: 'th-tilel' }, l)]),
  ascensore: () => [S('rect', { x: 26, y: 4, width: 48, height: 92, rx: 6, class: 'th-panel' }),
    ...Array.from({ length: 6 }, (_, i) => C(40 + (i % 2) * 20, 22 + Math.floor(i / 2) * 26, 8, 'th-btn'))],
  bilancia: () => [P('M50 14v76M30 90h40M14 22h72', 'th-scale'), P('M14 22l-8 20M14 22l8 20M86 22l-8 20M86 22l8 20', 'th-string'),
    P('M2 42h24q-2 8-12 8t-12-8zM74 42h24q-2 8-12 8t-12-8z', 'th-pan')],
  stazione: () => [S('rect', { x: 6, y: 20, width: 88, height: 56, rx: 4, class: 'th-board' }), P('M14 36h50M14 50h40M14 64h46', 'th-boardline'), S('text', { x: 82, y: 56, class: 'th-plat' }, '4')],
  quadro: () => [0, 1, 2, 3].flatMap((i) => [C(20 + i * 20, 18, 6, i % 2 ? 'th-lamp' : 'th-lamp is-on'),
    S('rect', { x: 12 + i * 20, y: 32, width: 16, height: 54, rx: 3, class: 'th-plate' }),
    S('rect', { x: 15 + i * 20, y: i % 3 ? 36 : 62, width: 10, height: 20, rx: 2, class: i % 2 ? 'th-tog-b' : 'th-tog-r' })]),
  ricetta: () => [P('M14 46h72v26q0 18-18 18H32q-18 0-18-18z', 'th-pot'), P('M6 50h8M86 50h8', 'th-pot'), P('M30 40q4-10 0-20M50 40q4-10 0-20M70 40q4-10 0-20', 'th-steam')],
});
