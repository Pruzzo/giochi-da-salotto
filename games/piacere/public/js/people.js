// Le persone di "Piacere!": una figura intera disegnata in SVG.
// Il corpo (pelle, viso, capelli, barba, occhiali, corporatura, altezza) non cambia mai;
// i vestiti (sopra, sotto, scarpe, cappello, sciarpa) cambiano tra la prima e la seconda fase.
import { h } from '/js/kit/dom.js';

export const SKINS = ['#f6d7c3', '#eec1a0', '#d9a27b', '#b97c55', '#8d5a3b', '#5e3b28'];
export const HAIR_COLORS = {
  nero: '#2a2321', castano: '#6b4226', biondo: '#e3b54e', rosso: '#b8482a', grigio: '#9b9a97', bianco: '#ebe8e2',
};
export const CLOTHES = ['#d64545', '#e8913a', '#e9c33f', '#4f9a5a', '#3d7fc4', '#7356b8', '#d36aa3', '#3b3f47', '#f2efe7', '#8a6a4a', '#2f6d6a'];

const LINE = 'var(--fig-line, #2a2421)';
const W = 3; // spessore del contorno

let uid = 0;
const shade = (hex, k) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${f(n >> 16)} ${f((n >> 8) & 255)} ${f(n & 255)})`;
};

const p = (d, fill, extra = {}) => h('svg:path', { d, fill, stroke: LINE, 'stroke-width': W, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', ...extra });
const line = (d, extra = {}) => p(d, 'none', extra);
const circle = (cx, cy, r, fill, extra = {}) => h('svg:circle', { cx, cy, r, fill, stroke: LINE, 'stroke-width': W, ...extra });
const ellipse = (cx, cy, rx, ry, fill, extra = {}) => h('svg:ellipse', { cx, cy, rx, ry, fill, stroke: LINE, 'stroke-width': W, ...extra });

// ---------- Misure ----------

const HEAD = { tondo: [44, 44], ovale: [40, 48], lungo: [36, 53] };
const BUILD = { magro: [33, 28], medio: [41, 36], robusto: [53, 49] }; // mezza larghezza a spalle e vita
const CX = 100;
const HY = 98; // centro della testa
const SHOULDER = 156;
const WAIST = 266;
const FEET = 404;

// ---------- Capelli ----------

/** La parte dietro la testa: capelli lunghi, caschetto, coda, chignon. */
function hairBack(t, rx, ry, color) {
  const top = HY - ry;
  switch (t.hair) {
    case 'lunghi':
      return p(`M${CX - rx - 6} ${HY - 10} Q${CX - rx - 14} ${HY + 60} ${CX - rx - 6} ${SHOULDER + 34} L${CX + rx + 6} ${SHOULDER + 34} Q${CX + rx + 14} ${HY + 60} ${CX + rx + 6} ${HY - 10} Q${CX} ${top - 30} ${CX - rx - 6} ${HY - 10}Z`, color);
    case 'caschetto':
      return p(`M${CX - rx - 7} ${HY - 8} Q${CX - rx - 10} ${HY + ry - 6} ${CX - rx + 4} ${HY + ry - 2} L${CX + rx - 4} ${HY + ry - 2} Q${CX + rx + 10} ${HY + ry - 6} ${CX + rx + 7} ${HY - 8} Q${CX} ${top - 26} ${CX - rx - 7} ${HY - 8}Z`, color);
    case 'coda':
      return p(`M${CX + rx - 6} ${HY - 20} Q${CX + rx + 40} ${HY - 18} ${CX + rx + 30} ${HY + 50} Q${CX + rx + 20} ${HY + 70} ${CX + rx + 10} ${HY + 40} Q${CX + rx + 16} ${HY + 4} ${CX + rx - 6} ${HY - 4}Z`, color);
    case 'chignon':
      return circle(CX, top - 6, 17, color);
    default:
      return null;
  }
}

/** Una calotta che segue la testa fino all'altezza `low`, con la frangia disegnata da `fringe`. */
function cap(rx, ry, low, fringe, color, extra) {
  const top = HY - ry;
  return p(`M${CX - rx - 3} ${low} Q${CX - rx - 6} ${top - 2} ${CX} ${top - 9} Q${CX + rx + 6} ${top - 2} ${CX + rx + 3} ${low} ${fringe}Z`, color, extra);
}

function hairFront(t, rx, ry, color) {
  const top = HY - ry;
  const side = HY - 4; // fin dove scendono i capelli ai lati
  switch (t.hair) {
    case 'corti':
      return cap(rx, ry, side, `Q${CX + rx - 4} ${HY - 26} ${CX + rx - 14} ${top + 18} Q${CX + 10} ${top + 28} ${CX - 6} ${top + 16} Q${CX - 20} ${top + 26} ${CX - rx + 8} ${top + 20} Q${CX - rx} ${HY - 24} ${CX - rx - 3} ${side}`, color);
    case 'rasati':
      return cap(rx, ry, HY - 14, `Q${CX + rx - 4} ${top + 16} ${CX} ${top + 12} Q${CX - rx + 4} ${top + 16} ${CX - rx - 3} ${HY - 14}`, color, { 'fill-opacity': 0.55 });
    case 'spettinati':
      return p(`M${CX - rx - 3} ${side} Q${CX - rx - 8} ${top + 8} ${CX - rx + 2} ${top - 4} L${CX - 26} ${top - 20} L${CX - 14} ${top - 6} L${CX - 4} ${top - 24} L${CX + 8} ${top - 6} L${CX + 22} ${top - 22} L${CX + 26} ${top - 2} L${CX + rx + 6} ${top - 4} Q${CX + rx + 8} ${top + 10} ${CX + rx + 3} ${side} Q${CX + rx - 6} ${top + 20} ${CX + 12} ${top + 22} Q${CX - 10} ${top + 14} ${CX - rx + 6} ${top + 24} Q${CX - rx - 1} ${HY - 22} ${CX - rx - 3} ${side}Z`, color);
    case 'ricci': {
      const kids = [];
      const n = 11;
      for (let i = 0; i < n; i += 1) {
        const a = Math.PI * (1.04 + (0.92 * i) / (n - 1));
        kids.push(circle(CX + Math.cos(a) * (rx + 4), HY - 6 + Math.sin(a) * (ry + 6), 14, color));
      }
      kids.push(circle(CX - 14, top + 8, 14, color), circle(CX + 14, top + 8, 14, color), circle(CX, top + 2, 15, color));
      return h('svg:g', {}, kids);
    }
    case 'calvo':
      return h('svg:g', {},
        p(`M${CX - rx - 2} ${HY + 4} Q${CX - rx - 6} ${HY - 16} ${CX - rx + 6} ${HY - 26} Q${CX - rx + 4} ${HY - 10} ${CX - rx + 8} ${HY + 2}Z`, color),
        p(`M${CX + rx + 2} ${HY + 4} Q${CX + rx + 6} ${HY - 16} ${CX + rx - 6} ${HY - 26} Q${CX + rx - 4} ${HY - 10} ${CX + rx - 8} ${HY + 2}Z`, color));
    case 'lunghi':
    case 'coda':
    case 'chignon':
      // riga in mezzo, i capelli tirati ai lati
      return cap(rx, ry, side + 6, `Q${CX + rx - 6} ${HY - 22} ${CX + 4} ${top + 12} L${CX} ${top + 4} L${CX - 4} ${top + 12} Q${CX - rx + 6} ${HY - 22} ${CX - rx - 3} ${side + 6}`, color);
    case 'caschetto':
      return cap(rx, ry, HY + 6, `Q${CX + rx - 2} ${HY - 18} ${CX + rx - 10} ${HY - 22} L${CX - rx + 10} ${HY - 22} Q${CX - rx + 2} ${HY - 18} ${CX - rx - 3} ${HY + 6}`, color);
    default:
      return null;
  }
}

// ---------- Viso ----------

function face(t, rx, ry, skin, hairColor) {
  const kids = [];
  const eyeY = HY + 4;
  const brow = t.hair === 'calvo' || t.hairColor === 'bianco' ? shade(HAIR_COLORS[t.hairColor], 0.7) : hairColor;
  // sopracciglia
  const bw = t.brows === 'folte' ? 6 : 3;
  kids.push(line(`M${CX - 24} ${eyeY - 14} Q${CX - 16} ${eyeY - 19} ${CX - 8} ${eyeY - 15}`, { stroke: brow, 'stroke-width': bw }));
  kids.push(line(`M${CX + 24} ${eyeY - 14} Q${CX + 16} ${eyeY - 19} ${CX + 8} ${eyeY - 15}`, { stroke: brow, 'stroke-width': bw }));
  // occhi
  for (const dx of [-16, 16]) {
    kids.push(h('svg:ellipse', { cx: CX + dx, cy: eyeY, rx: 4.2, ry: 5, fill: LINE }));
    kids.push(h('svg:circle', { cx: CX + dx + 1.5, cy: eyeY - 1.8, r: 1.4, fill: '#fff' }));
  }
  // guance
  kids.push(h('svg:circle', { cx: CX - 26, cy: eyeY + 16, r: 7, fill: '#e2736b', opacity: 0.22 }));
  kids.push(h('svg:circle', { cx: CX + 26, cy: eyeY + 16, r: 7, fill: '#e2736b', opacity: 0.22 }));
  // lentiggini e neo
  if (t.freckles) {
    for (const [x, y] of [[-30, 12], [-24, 15], [-28, 18], [24, 15], [30, 12], [27, 18], [-4, 13], [4, 13]]) {
      kids.push(h('svg:circle', { cx: CX + x, cy: eyeY + y, r: 1.4, fill: shade(skin, 0.62) }));
    }
  }
  if (t.mole) kids.push(h('svg:circle', { cx: CX + 19, cy: eyeY + 26, r: 2.2, fill: shade(skin, 0.45) }));
  // naso
  const ny = eyeY + 12;
  if (t.nose === 'tondo') kids.push(h('svg:circle', { cx: CX, cy: ny + 4, r: 6, fill: shade(skin, 0.86), stroke: shade(skin, 0.6), 'stroke-width': 2 }));
  else if (t.nose === 'lungo') kids.push(p(`M${CX} ${ny - 3} L${CX + 7} ${ny + 8} Q${CX + 1} ${ny + 12} ${CX - 5} ${ny + 8}Z`, shade(skin, 0.88), { stroke: shade(skin, 0.6), 'stroke-width': 2 }));
  else kids.push(line(`M${CX - 4} ${ny + 6} Q${CX} ${ny + 9} ${CX + 4} ${ny + 6}`, { stroke: shade(skin, 0.55), 'stroke-width': 2.5 }));
  // barba, sotto la bocca
  const chin = HY + ry;
  const beard = shade(hairColor === HAIR_COLORS.bianco ? '#d8d5ce' : hairColor, 1);
  if (t.beard === 'barba') {
    kids.push(p(`M${CX - rx + 1} ${HY + 2} Q${CX - rx + 2} ${chin + 8} ${CX} ${chin + 12} Q${CX + rx - 2} ${chin + 8} ${CX + rx - 1} ${HY + 2} Q${CX + rx - 10} ${eyeY + 26} ${CX + 12} ${eyeY + 24} Q${CX} ${eyeY + 20} ${CX - 12} ${eyeY + 24} Q${CX - rx + 10} ${eyeY + 26} ${CX - rx + 1} ${HY + 2}Z`, beard));
  } else if (t.beard === 'pizzetto') {
    kids.push(p(`M${CX - 9} ${chin - 9} Q${CX} ${chin + 10} ${CX + 9} ${chin - 9} Q${CX} ${chin - 4} ${CX - 9} ${chin - 9}Z`, beard));
  }
  // bocca
  const my = eyeY + 28;
  if (t.beard === 'barba') kids.push(p(`M${CX - 9} ${my - 2} Q${CX} ${my + 7} ${CX + 9} ${my - 2}Z`, '#8a3b34', { 'stroke-width': 2 }));
  else kids.push(line(`M${CX - 10} ${my - 1} Q${CX} ${my + 7} ${CX + 10} ${my - 1}`, { 'stroke-width': 2.6 }));
  if (t.beard === 'baffi' || t.beard === 'barba') {
    kids.push(p(`M${CX} ${my - 7} Q${CX - 8} ${my - 12} ${CX - 18} ${my - 4} Q${CX - 10} ${my - 3} ${CX} ${my - 5} Q${CX + 10} ${my - 3} ${CX + 18} ${my - 4} Q${CX + 8} ${my - 12} ${CX} ${my - 7}Z`, beard, { 'stroke-width': 2 }));
  }
  // occhiali
  if (t.glasses) {
    const g = { fill: 'rgb(255 255 255 / .18)', stroke: LINE, 'stroke-width': 3 };
    if (t.glasses === 'tondi') {
      kids.push(h('svg:circle', { cx: CX - 16, cy: eyeY, r: 11, ...g }), h('svg:circle', { cx: CX + 16, cy: eyeY, r: 11, ...g }));
    } else {
      kids.push(h('svg:rect', { x: CX - 29, y: eyeY - 9, width: 24, height: 18, rx: 4, ...g }), h('svg:rect', { x: CX + 5, y: eyeY - 9, width: 24, height: 18, rx: 4, ...g }));
    }
    kids.push(line(`M${CX - 5} ${eyeY - 1} Q${CX} ${eyeY - 5} ${CX + 5} ${eyeY - 1}`), line(`M${CX - 27} ${eyeY - 2} L${CX - rx + 1} ${eyeY - 5}`), line(`M${CX + 27} ${eyeY - 2} L${CX + rx - 1} ${eyeY - 5}`));
  }
  return kids;
}

// ---------- Vestiti ----------

function patternFill(id, color, pattern) {
  if (!pattern) return [null, color];
  const ink = shade(color, color === '#f2efe7' ? 0.75 : 0.7);
  const def = pattern === 'righe'
    ? h('svg:pattern', { id, width: 12, height: 12, patternUnits: 'userSpaceOnUse' }, h('svg:rect', { width: 12, height: 12, fill: color }), h('svg:rect', { y: 7, width: 12, height: 5, fill: ink }))
    : pattern === 'quadri'
      ? h('svg:pattern', { id, width: 16, height: 16, patternUnits: 'userSpaceOnUse' }, h('svg:rect', { width: 16, height: 16, fill: color }), h('svg:rect', { width: 8, height: 16, fill: ink, opacity: 0.45 }), h('svg:rect', { width: 16, height: 8, fill: ink, opacity: 0.45 }))
      : h('svg:pattern', { id, width: 14, height: 14, patternUnits: 'userSpaceOnUse' }, h('svg:rect', { width: 14, height: 14, fill: color }), h('svg:circle', { cx: 7, cy: 7, r: 2.6, fill: ink }));
  return [def, `url(#${id})`];
}

function body(t, o, skin, defs, id) {
  const [w, ww] = BUILD[t.build];
  const kids = [];
  const leg = Math.max(13, ww / 2 - 2);
  const lx = CX - ww / 2 - 1;
  const rxl = CX + ww / 2 + 1;
  const shoe = o.shoes;
  // gambe
  const bottomColor = o.bottomColor;
  const legPath = (x, to) => `M${x - leg} ${WAIST - 6} L${x - leg + 2} ${to} L${x + leg - 2} ${to} L${x + leg} ${WAIST - 6}Z`;
  if (o.bottom === 'gonna') {
    kids.push(p(legPath(lx, FEET - 12), skin), p(legPath(rxl, FEET - 12), skin));
    kids.push(p(`M${CX - ww - 2} ${WAIST - 8} L${CX - ww - 18} ${WAIST + 70} Q${CX} ${WAIST + 80} ${CX + ww + 18} ${WAIST + 70} L${CX + ww + 2} ${WAIST - 8}Z`, bottomColor));
  } else if (o.bottom === 'pantaloncini') {
    kids.push(p(legPath(lx, FEET - 12), skin), p(legPath(rxl, FEET - 12), skin));
    kids.push(p(`M${CX - ww - 2} ${WAIST - 8} L${CX - ww - 6} ${WAIST + 52} L${CX - 3} ${WAIST + 52} L${CX} ${WAIST + 18} L${CX + 3} ${WAIST + 52} L${CX + ww + 6} ${WAIST + 52} L${CX + ww + 2} ${WAIST - 8}Z`, bottomColor));
  } else {
    kids.push(p(legPath(lx, FEET - 10), bottomColor), p(legPath(rxl, FEET - 10), bottomColor));
    if (o.bottom === 'jeans') kids.push(line(`M${lx + 4} ${WAIST + 10} L${lx + 4} ${FEET - 14}`, { stroke: shade(bottomColor, 0.75), 'stroke-width': 2, 'stroke-dasharray': '4 4' }), line(`M${rxl - 4} ${WAIST + 10} L${rxl - 4} ${FEET - 14}`, { stroke: shade(bottomColor, 0.75), 'stroke-width': 2, 'stroke-dasharray': '4 4' }));
  }
  // scarpe
  kids.push(p(`M${lx - leg - 4} ${FEET} Q${lx - leg - 4} ${FEET - 14} ${lx} ${FEET - 14} Q${lx + leg + 2} ${FEET - 14} ${lx + leg + 2} ${FEET}Z`, shoe));
  kids.push(p(`M${rxl - leg - 2} ${FEET} Q${rxl - leg - 2} ${FEET - 14} ${rxl} ${FEET - 14} Q${rxl + leg + 4} ${FEET - 14} ${rxl + leg + 4} ${FEET}Z`, shoe));

  // braccia: manica lunga o corta, mani
  const [patDef, topFill] = patternFill(`pat${id}`, o.topColor, o.pattern);
  if (patDef) defs.push(patDef);
  const short = o.top === 'maglietta';
  const armOut = 16;
  for (const s of [-1, 1]) {
    const x0 = CX + s * (w - 4);
    const x1 = CX + s * (w + armOut);
    const end = WAIST - 4;
    const arm = `M${x0} ${SHOULDER + 4} Q${CX + s * (w + 10)} ${SHOULDER} ${CX + s * (w + 12)} ${SHOULDER + 14} L${x1 + s * 2} ${end} L${x1 - s * 16} ${end} L${CX + s * (w - 6)} ${SHOULDER + 36}Z`;
    kids.push(p(arm, short ? skin : (o.top === 'giacca' ? o.topColor : topFill)));
    if (short) kids.push(p(`M${x0} ${SHOULDER + 4} Q${CX + s * (w + 10)} ${SHOULDER} ${CX + s * (w + 12)} ${SHOULDER + 14} L${CX + s * (w + 14)} ${SHOULDER + 40} L${CX + s * (w - 4)} ${SHOULDER + 40}Z`, topFill));
    kids.push(circle(x1 - s * 7, end + 6, 10, skin));
  }
  // busto
  const torso = `M${CX - w + 6} ${SHOULDER - 2} Q${CX - w - 2} ${SHOULDER} ${CX - w} ${SHOULDER + 18} L${CX - ww} ${WAIST} L${CX + ww} ${WAIST} L${CX + w} ${SHOULDER + 18} Q${CX + w + 2} ${SHOULDER} ${CX + w - 6} ${SHOULDER - 2}Z`;
  if (o.top === 'giacca') {
    kids.push(p(torso, o.topColor));
    kids.push(p(`M${CX - 14} ${SHOULDER - 2} L${CX} ${SHOULDER + 50} L${CX + 14} ${SHOULDER - 2}Z`, '#f2efe7'));
    kids.push(line(`M${CX - 16} ${SHOULDER - 2} L${CX - 4} ${SHOULDER + 60} L${CX - 4} ${WAIST}`), line(`M${CX + 16} ${SHOULDER - 2} L${CX + 4} ${SHOULDER + 60} L${CX + 4} ${WAIST}`));
    kids.push(h('svg:circle', { cx: CX - 9, cy: SHOULDER + 80, r: 3, fill: LINE }));
  } else {
    kids.push(p(torso, topFill));
    if (o.top === 'camicia') {
      kids.push(p(`M${CX - 14} ${SHOULDER - 4} L${CX} ${SHOULDER + 10} L${CX - 4} ${SHOULDER + 18}Z`, '#fff'), p(`M${CX + 14} ${SHOULDER - 4} L${CX} ${SHOULDER + 10} L${CX + 4} ${SHOULDER + 18}Z`, '#fff'));
      kids.push(line(`M${CX} ${SHOULDER + 10} L${CX} ${WAIST - 2}`, { 'stroke-width': 2 }));
      for (let y = SHOULDER + 30; y < WAIST - 10; y += 26) kids.push(h('svg:circle', { cx: CX + 5, cy: y, r: 2.2, fill: LINE }));
    } else if (o.top === 'felpa') {
      kids.push(p(`M${CX - 22} ${SHOULDER - 4} Q${CX} ${SHOULDER + 26} ${CX + 22} ${SHOULDER - 4}`, shade(o.topColor, 0.82)));
      kids.push(p(`M${CX - ww + 10} ${WAIST - 44} L${CX + ww - 10} ${WAIST - 44} L${CX + ww - 16} ${WAIST - 14} L${CX - ww + 16} ${WAIST - 14}Z`, 'none', { 'stroke-width': 2 }));
    } else if (o.top === 'maglione') {
      kids.push(line(`M${CX - ww} ${WAIST - 12} L${CX + ww} ${WAIST - 12}`, { 'stroke-width': 2 }));
      kids.push(p(`M${CX - 16} ${SHOULDER - 3} Q${CX} ${SHOULDER + 10} ${CX + 16} ${SHOULDER - 3}`, shade(o.topColor, 0.85), { 'stroke-width': 2.5 }));
    } else {
      kids.push(line(`M${CX - 14} ${SHOULDER - 2} Q${CX} ${SHOULDER + 12} ${CX + 14} ${SHOULDER - 2}`, { 'stroke-width': 2.5 }));
    }
  }
  return kids;
}

function hat(o, rx, ry) {
  const top = HY - ry;
  if (o.hat === 'berretto') {
    return h('svg:g', {},
      p(`M${CX - rx - 4} ${HY - 18} Q${CX - rx - 6} ${top - 26} ${CX} ${top - 28} Q${CX + rx + 6} ${top - 26} ${CX + rx + 4} ${HY - 18}Z`, o.hatColor),
      p(`M${CX - rx - 7} ${HY - 26} L${CX + rx + 7} ${HY - 26} L${CX + rx + 7} ${HY - 12} L${CX - rx - 7} ${HY - 12}Z`, shade(o.hatColor, 0.8)),
      circle(CX, top - 30, 9, shade(o.hatColor, 0.9)));
  }
  if (o.hat === 'cappellino') {
    return h('svg:g', {},
      p(`M${CX - rx - 2} ${HY - 22} Q${CX - rx - 2} ${top - 16} ${CX} ${top - 18} Q${CX + rx + 2} ${top - 16} ${CX + rx + 2} ${HY - 22}Z`, o.hatColor),
      p(`M${CX - rx + 4} ${HY - 22} Q${CX - rx - 30} ${HY - 22} ${CX - rx - 34} ${HY - 12} L${CX - rx + 8} ${HY - 14}Z`, shade(o.hatColor, 0.8)));
  }
  if (o.hat === 'cappello') {
    return h('svg:g', {},
      ellipse(CX, HY - 26, rx + 26, 9, o.hatColor),
      p(`M${CX - rx + 2} ${HY - 26} L${CX - rx + 8} ${top - 22} Q${CX} ${top - 30} ${CX + rx - 8} ${top - 22} L${CX + rx - 2} ${HY - 26}Z`, o.hatColor),
      p(`M${CX - rx + 4} ${HY - 34} L${CX + rx - 4} ${HY - 34} L${CX + rx - 3} ${HY - 26} L${CX - rx + 3} ${HY - 26}Z`, shade(o.hatColor, 0.6)));
  }
  return null;
}

/**
 * Una persona intera. `t` sono i tratti fissi, `o` i vestiti.
 * La figura sta in piedi su y=404 di un riquadro 200×420; l'altezza la accorcia o la allunga dai piedi.
 */
export function person(t, outfit, props = {}) {
  uid += 1;
  // I colori dei vestiti arrivano come posizioni nella tavolozza.
  const col = (c) => (typeof c === 'number' ? CLOTHES[c] : c);
  const o = { ...outfit, topColor: col(outfit.topColor), bottomColor: col(outfit.bottomColor), hatColor: col(outfit.hatColor), scarf: outfit.scarf == null ? null : col(outfit.scarf) };
  const [rx, ry] = HEAD[t.face];
  const skin = SKINS[t.skin];
  const hairColor = HAIR_COLORS[t.hairColor];
  const defs = [];
  const parts = [];
  parts.push(hairBack(t, rx, ry, hairColor));
  parts.push(...body(t, o, skin, defs, uid));
  // collo, sciarpa
  parts.push(p(`M${CX - 11} ${HY + ry - 10} L${CX - 12} ${SHOULDER + 4} Q${CX} ${SHOULDER + 12} ${CX + 12} ${SHOULDER + 4} L${CX + 11} ${HY + ry - 10}Z`, shade(skin, 0.9)));
  if (o.top === 'felpa' || o.top === 'maglione') {
    parts.push(p(`M${CX - 16} ${SHOULDER - 3} Q${CX} ${SHOULDER + 12} ${CX + 16} ${SHOULDER - 3}`, o.top === 'felpa' ? shade(o.topColor, 0.82) : shade(o.topColor, 0.85), { 'stroke-width': 2.5 }));
  }
  // orecchie e testa
  parts.push(ellipse(CX - rx + 1, HY + 6, 7, 10, skin), ellipse(CX + rx - 1, HY + 6, 7, 10, skin));
  parts.push(ellipse(CX, HY, rx, ry, skin));
  parts.push(...face(t, rx, ry, skin, hairColor));
  parts.push(o.hat ? null : hairFront(t, rx, ry, hairColor));
  if (o.hat) {
    // sotto il cappello si vedono ancora i capelli ai lati, se ci sono
    if (!['calvo', 'rasati'].includes(t.hair)) parts.push(p(`M${CX - rx - 3} ${HY - 4} Q${CX - rx - 4} ${HY - 22} ${CX - rx + 8} ${HY - 22} L${CX - rx + 4} ${HY - 4}Z`, hairColor), p(`M${CX + rx + 3} ${HY - 4} Q${CX + rx + 4} ${HY - 22} ${CX + rx - 8} ${HY - 22} L${CX + rx - 4} ${HY - 4}Z`, hairColor));
    parts.push(hat(o, rx, ry));
  }
  if (o.scarf) {
    parts.push(p(`M${CX - 22} ${SHOULDER - 8} Q${CX} ${SHOULDER + 10} ${CX + 22} ${SHOULDER - 8} L${CX + 24} ${SHOULDER + 6} Q${CX} ${SHOULDER + 24} ${CX - 24} ${SHOULDER + 6}Z`, o.scarf));
    parts.push(p(`M${CX + 8} ${SHOULDER + 12} L${CX + 20} ${SHOULDER + 70} L${CX + 6} ${SHOULDER + 72} L${CX - 2} ${SHOULDER + 14}Z`, shade(o.scarf, 0.88)));
  }
  const k = t.height;
  return h('svg:svg', { viewBox: '-20 -20 240 440', class: 'person', role: 'img', ...props },
    defs.length ? h('svg:defs', {}, defs) : null,
    h('svg:g', { transform: `translate(${CX} ${FEET}) scale(${k}) translate(${-CX} ${-FEET})` }, parts.filter(Boolean)));
}
