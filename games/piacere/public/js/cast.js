// Chi si presenta in "Piacere!": tratti fissi, nomi e due guardaroba diversi.
// Niente DOM: lo stesso file serve al server per decidere il turno e al prototipo.

export const NAMES = {
  f: ['Anna', 'Bea', 'Carla', 'Delia', 'Elsa', 'Fiora', 'Gina', 'Ilaria', 'Lucia', 'Marta', 'Nora', 'Olga', 'Paola', 'Rita', 'Sara', 'Tina', 'Vera', 'Zoe'],
  m: ['Aldo', 'Bruno', 'Carlo', 'Dario', 'Enzo', 'Fabio', 'Guido', 'Ivo', 'Lino', 'Mario', 'Nico', 'Otto', 'Piero', 'Remo', 'Sergio', 'Tullio', 'Ugo', 'Walter'],
};

const HAIR = {
  f: ['lunghi', 'caschetto', 'coda', 'chignon', 'ricci', 'corti'],
  m: ['corti', 'ricci', 'calvo', 'spettinati', 'rasati', 'corti'],
};
const HAIR_COLORS = ['nero', 'castano', 'biondo', 'rosso', 'grigio', 'bianco'];
const TOPS = ['maglietta', 'maglione', 'camicia', 'felpa', 'giacca'];
const BOTTOMS = { f: ['pantaloni', 'jeans', 'gonna', 'pantaloncini'], m: ['pantaloni', 'jeans', 'pantaloncini'] };
const PATTERNS = [null, null, null, 'righe', 'pois', 'quadri'];
const CLOTH = 11; // quanti colori ha la tavolozza dei vestiti (people.js)
const SHOES = ['#3b3f47', '#8a5a2b', '#f2efe7', '#c0392b', '#2f4f7f'];
const HATS = ['berretto', 'cappellino', 'cappello'];

/** Generatore pseudo-casuale con seme: la stessa partita dà le stesse persone a tutti. */
export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (r, list) => list[Math.floor(r() * list.length)];

function traits(r) {
  const sex = r() < 0.5 ? 'f' : 'm';
  const old = r() < 0.2;
  return {
    sex,
    skin: Math.floor(r() * 6),
    face: pick(r, ['tondo', 'ovale', 'lungo']),
    hair: pick(r, HAIR[sex]),
    hairColor: old ? pick(r, ['grigio', 'bianco']) : pick(r, HAIR_COLORS.slice(0, 4)),
    brows: r() < 0.4 ? 'folte' : 'sottili',
    nose: pick(r, ['piccolo', 'tondo', 'lungo']),
    beard: sex === 'm' && r() < 0.45 ? pick(r, ['barba', 'baffi', 'pizzetto']) : null,
    glasses: r() < 0.3 ? pick(r, ['tondi', 'squadrati']) : null,
    freckles: r() < 0.2,
    mole: r() < 0.15,
    build: pick(r, ['magro', 'medio', 'robusto']),
    height: pick(r, [0.86, 0.93, 1, 1.07]),
  };
}

/** Quanto si distinguono due persone, contando solo quello che si nota da lontano. */
export function distance(a, b) {
  const keys = ['sex', 'hair', 'hairColor', 'beard', 'glasses', 'build', 'height', 'face'];
  return keys.filter((k) => a[k] !== b[k]).length + (Math.abs(a.skin - b.skin) >= 2 ? 1 : 0);
}

/** Un guardaroba; `hats` aggiunge cappelli e sciarpe (livello difficile). */
export function outfit(r, t, { hats = false } = {}) {
  return {
    top: pick(r, TOPS),
    topColor: Math.floor(r() * CLOTH),
    pattern: pick(r, PATTERNS),
    bottom: pick(r, BOTTOMS[t.sex]),
    bottomColor: Math.floor(r() * CLOTH),
    shoes: pick(r, SHOES),
    hat: hats && r() < 0.45 ? pick(r, HATS) : null,
    hatColor: Math.floor(r() * CLOTH),
    scarf: hats && r() < 0.3 ? Math.floor(r() * CLOTH) : null,
  };
}

/** Un guardaroba che non assomiglia al primo: cambiano sempre almeno il sopra e il suo colore. */
function otherOutfit(r, t, before, opts) {
  for (let i = 0; i < 20; i += 1) {
    const o = outfit(r, t, opts);
    if (o.top !== before.top && o.topColor !== before.topColor && o.bottomColor !== before.bottomColor) return o;
  }
  return outfit(r, t, opts);
}

/**
 * Il turno: chi si presenta nella prima fase e la fila della seconda.
 * @param known     quante persone si presentano
 * @param strangers quanti sconosciuti si infilano nella seconda fase
 * @param level     'facile' (stessi vestiti), 'normale' (vestiti diversi), 'difficile' (anche cappelli, sciarpe e sconosciuti somiglianti)
 */
export function makeRound(seed, { known = 6, strangers = 2, level = 'normale' } = {}) {
  const r = rng(seed);
  const people = [];
  const used = new Set();
  const total = known + strangers;
  // Le persone conosciute devono distinguersi bene; gli sconosciuti, a difficile, possono somigliare a una di loro.
  for (let tries = 0; people.length < total && tries < 5000; tries += 1) {
    const t = traits(r);
    const isStranger = people.length >= known;
    const others = isStranger ? people : people.filter((x) => !x.stranger);
    const min = isStranger && level === 'difficile' ? 2 : 3;
    if (others.some((x) => distance(x.t, t) < min)) continue;
    const name = pick(r, NAMES[t.sex]);
    if (used.has(name) || [...used].some((n) => n.slice(0, 2) === name.slice(0, 2))) continue;
    used.add(name);
    people.push({ id: people.length, name, t, stranger: isStranger });
  }
  const hats = level === 'difficile';
  for (const x of people) {
    x.first = outfit(r, x.t);
    x.second = level === 'facile' ? x.first : otherOutfit(r, x.t, x.first, { hats });
  }
  const order = people.map((x) => x.id);
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(r() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return {
    people,
    intro: people.filter((x) => !x.stranger).map((x) => x.id),
    quiz: order,
  };
}
