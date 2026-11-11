// I dodici moduli di "Disinnesca la bomba": come nascono, cosa vede l'artificiere, qual è la mossa giusta.
// Le regole sono quelle del manuale, in docs/Giochi-a-squadre.md ("Il manuale"). Nessuna dipendenza di rete.
// Per ogni tipo:
//   make(rand, serial, prev)   la faccia del modulo (solo quello che l'artificiere vede); prev è la faccia di prima,
//                              per i moduli a passi, così la nuova è sempre diversa
//   solve(face, serial)        la mossa giusta secondo il manuale, calcolata da quello che si vede e dal numero di serie
//   parse(value, face)         la mossa mandata dal telefono, controllata; null se non ha senso
//   same(a, b)                 due mosse sono uguali
// La soluzione non si salva mai: si ricalcola, così non può uscire dal server per sbaglio.

// ---------- Caso ----------

export const int = (rand, n) => Math.floor(rand() * n);
export const pick = (rand, list) => list[int(rand, list.length)];

export function shuffle(rand, list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = int(rand, i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ---------- Numero di serie ----------

// Niente O: sul telefono si confonde con lo zero.
export const SERIAL_LETTERS = 'ABCDEFGHIJKLMNPQRSTUVWXYZ';
export const VOWELS = 'AEIOU';
export const SERIAL_FORMAT = /^[A-Z]{2}[0-9]-[0-9]{2}[A-Z]$/;

/** Due lettere, una cifra, trattino, due cifre, una lettera: RT4-82K. */
export function makeSerial(rand) {
  const L = () => pick(rand, SERIAL_LETTERS);
  const D = () => String(int(rand, 10));
  return `${L()}${L()}${D()}-${D()}${D()}${L()}`;
}

export const serialLetters = (serial) => [...serial].filter((c) => c >= 'A' && c <= 'Z');
export const serialDigits = (serial) => [...serial].filter((c) => c >= '0' && c <= '9').map(Number);
/** L'ultima cifra è quella prima della lettera finale. */
export const lastDigit = (serial) => serialDigits(serial)[2];
export const hasVowel = (serial) => serialLetters(serial).some((c) => VOWELS.includes(c));

// ---------- Moduli ----------

const WIRE_COLORS = ['rosso', 'blu', 'giallo', 'bianco', 'nero'];
const LIGHTS = ['rossa', 'gialla', 'verde'];
const BUTTONS = ['rosso', 'giallo', 'verde'];
export const WORDS = { CASA: 'CASCO', CASSA: 'COSA', CAUSA: 'CASA', COSA: 'CASTA', CASO: 'CAUSA', CASE: 'CASSA', CASTA: 'CASO', CASCO: 'CASE' };
const LOCK_COLORS = ['rosso', 'blu', 'verde'];
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const FLAG_COLORS = ['rosso', 'giallo', 'verde', 'blu', 'bianco', 'nero'];
const DICE_COLORS = ['bianco', 'rosso'];
export const SMORFIA = { italia: 1, bambina: 2, gatta: 3, maiale: 4, mano: 5, topi: 11, soldati: 12, risata: 19, festa: 20, testa: 34, paura: 90 };
const ZONES = ['verde', 'gialla', 'rossa'];
/** Dove sta la lancetta nel manometro (0 tutto a sinistra, 1 tutto a destra): sempre lontana dai bordi delle zone. */
export const GAUGE = { verde: [0.06, 0.34], gialla: [0.46, 0.6], rossa: [0.72, 0.94] };
const ARROWS = ['su', 'destra', 'giu', 'sinistra'];
const COMPASS = ['N', 'E', 'S', 'O']; // in senso orario, come le frecce

const isInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
const bools = (v, n) => (Array.isArray(v) && v.length === n && v.every((b) => typeof b === 'boolean') ? [...v] : null);
/** Una posizione di partenza qualunque, purché non sia già quella giusta. */
function startNot(rand, n, right) {
  for (;;) {
    const start = Array.from({ length: n }, () => rand() < 0.5);
    if (!equal(start, right)) return start;
  }
}
/** Una faccia nuova diversa da quella di prima. */
function fresh(prev, make) {
  for (;;) {
    const face = make();
    if (!prev || !equal(face, prev)) return face;
  }
}

const LEVERS = [
  ['AE', [true, false, true, false, true]],
  ['FJ', [false, false, true, true, false]],
  ['KO', [true, true, false, false, true]],
  ['PT', [false, true, true, false, false]],
  ['UZ', [true, false, false, true, true]],
];

function leversFor(serial) {
  const first = serialLetters(serial)[0];
  const row = LEVERS.find(([range]) => first >= range[0] && first <= range[1])[1];
  const out = [...row];
  if (serialDigits(serial).includes(0)) out[2] = !out[2];
  return out;
}

function bulbsFor(serial) {
  const digits = serialDigits(serial);
  const on = [1, 2, 3, 4].map((n) => digits.includes(n));
  return on.some(Boolean) ? on : [false, false, false, true];
}

function lockFor(color, serial) {
  const letters = serialLetters(serial);
  if (color === 'blu') return [...letters].reverse();
  if (color === 'verde') return [...letters].sort();
  return letters;
}

export const MODULES = {
  fili: {
    name: 'Fili',
    steps: 1,
    make(rand) {
      const n = 3 + int(rand, 4);
      return { wires: Array.from({ length: n }, () => pick(rand, WIRE_COLORS)), cut: [] };
    },
    solve({ wires }, serial) {
      const n = wires.length;
      const count = (c) => wires.filter((w) => w === c).length;
      if (count('rosso') >= 2) return wires.lastIndexOf('rosso');
      if (wires.includes('giallo') && lastDigit(serial) % 2 === 0) return wires.indexOf('giallo');
      if (wires[0] === 'nero') return 1;
      if (count('blu') > count('bianco')) return n - 1;
      return Math.ceil(n / 2) - 1;
    },
    parse: (v, face) => (isInt(v, 0, face.wires.length - 1) && !face.cut.includes(v) ? v : null),
    // Il filo tagliato resta tagliato, anche se era quello sbagliato.
    after(face, value) { face.cut.push(value); },
  },

  leve: {
    name: 'Leve',
    steps: 1,
    make: (rand, serial) => ({ start: startNot(rand, 5, leversFor(serial)) }),
    solve: (_face, serial) => leversFor(serial),
    parse: (v) => bools(v, 5),
  },

  semaforo: {
    name: 'Semaforo',
    steps: 3,
    make: (rand, _serial, prev) => fresh(prev, () => ({ light: pick(rand, LIGHTS) })),
    solve({ light }, serial) {
      const vowel = hasVowel(serial);
      return { rossa: vowel ? 'verde' : 'giallo', gialla: vowel ? 'rosso' : 'verde', verde: vowel ? 'giallo' : 'rosso' }[light];
    },
    parse: (v) => (BUTTONS.includes(v) ? v : null),
  },

  parola: {
    name: 'Parola',
    steps: 3,
    make: (rand, _serial, prev) => fresh(prev, () => {
      const screen = pick(rand, Object.keys(WORDS));
      const right = WORDS[screen];
      const others = shuffle(rand, Object.keys(WORDS).filter((w) => w !== right)).slice(0, 3);
      return { screen, keys: shuffle(rand, [right, ...others]) };
    }),
    solve: ({ screen }) => WORDS[screen],
    parse: (v, face) => (face.keys.includes(v) ? v : null),
  },

  cassaforte: {
    name: 'Cassaforte',
    steps: 1,
    make: () => ({}),
    solve(_face, serial) {
      const digits = serialDigits(serial);
      return digits.join('') + String(digits.reduce((a, b) => a + b, 0) % 10);
    },
    parse: (v) => (typeof v === 'string' && /^[0-9]{4}$/.test(v) ? v : null),
  },

  lucchetto: {
    name: 'Lucchetto',
    steps: 1,
    make(rand, serial) {
      const color = pick(rand, LOCK_COLORS);
      const right = lockFor(color, serial);
      for (;;) {
        const start = [0, 1, 2].map(() => pick(rand, ALPHABET));
        if (!equal(start, right)) return { color, start };
      }
    },
    solve: ({ color }, serial) => lockFor(color, serial),
    parse: (v) => (Array.isArray(v) && v.length === 3 && v.every((c) => typeof c === 'string' && c.length === 1 && ALPHABET.includes(c)) ? [...v] : null),
  },

  bandiera: {
    name: 'Bandiera',
    steps: 1,
    make(rand) {
      // Ogni tanto il tricolore, se no la regola 1 non esce quasi mai.
      if (rand() < 0.15) return { stripes: ['verde', 'bianco', 'rosso'] };
      for (;;) {
        const stripes = [0, 1, 2].map(() => pick(rand, FLAG_COLORS));
        if (new Set(stripes).size > 1) return { stripes };
      }
    },
    solve({ stripes }) {
      if (equal(stripes, ['verde', 'bianco', 'rosso'])) return 1;
      if (new Set(stripes).size === 2) return stripes.findIndex((c) => stripes.indexOf(c) === stripes.lastIndexOf(c));
      if (stripes[1] === 'rosso') return 0;
      const best = Math.min(...stripes.map((c) => FLAG_COLORS.indexOf(c)));
      return stripes.indexOf(FLAG_COLORS[best]);
    },
    parse: (v) => (isInt(v, 0, 2) ? v : null),
  },

  dado: {
    name: 'Dado',
    steps: 3,
    make: (rand, _serial, prev) => fresh(prev, () => ({ color: pick(rand, DICE_COLORS), value: 1 + int(rand, 6) })),
    solve({ color, value }, serial) {
      const white = (color === 'bianco') !== hasVowel(serial);
      return white ? 7 - value : (value % 6) + 1;
    },
    parse: (v) => (isInt(v, 1, 6) ? v : null),
  },

  lampadine: {
    name: 'Lampadine',
    steps: 1,
    make: (rand, serial) => ({ start: startNot(rand, 4, bulbsFor(serial)) }),
    solve: (_face, serial) => bulbsFor(serial),
    parse: (v) => bools(v, 4),
  },

  tombola: {
    name: 'Tombola',
    steps: 3,
    make: (rand, _serial, prev) => fresh(prev, () => {
      const picture = pick(rand, Object.keys(SMORFIA));
      const right = SMORFIA[picture];
      const others = shuffle(rand, Object.values(SMORFIA).filter((n) => n !== right)).slice(0, 3);
      return { picture, keys: shuffle(rand, [right, ...others]) };
    }),
    solve: ({ picture }) => SMORFIA[picture],
    parse: (v, face) => (face.keys.includes(v) ? v : null),
  },

  moka: {
    name: 'Moka',
    steps: 3,
    make: (rand, _serial, prev) => {
      const zone = pick(rand, ZONES);
      const [lo, hi] = GAUGE[zone];
      // La lancetta si sposta sempre, anche se resta nella stessa zona.
      for (;;) {
        const needle = Math.round((lo + rand() * (hi - lo)) * 100) / 100;
        if (!prev || Math.abs(needle - prev.needle) > 0.05) return { zone, needle };
      }
    },
    solve({ zone }, serial) {
      if (zone === 'verde') return 'alza';
      if (zone === 'rossa') return 'spegni';
      return lastDigit(serial) % 2 === 0 ? 'abbassa' : 'spegni';
    },
    parse: (v) => (['alza', 'abbassa', 'spegni'].includes(v) ? v : null),
  },

  bussola: {
    name: 'Bussola',
    steps: 3,
    make: (rand, _serial, prev) => fresh(prev, () => ({ arrow: pick(rand, ARROWS) })),
    solve({ arrow }, serial) {
      const at = ARROWS.indexOf(arrow);
      return COMPASS[(at + (hasVowel(serial) ? 3 : 1)) % 4];
    },
    parse: (v) => (COMPASS.includes(v) ? v : null),
  },
};

export const MODULE_TYPES = Object.keys(MODULES);

/** La mossa è quella giusta? */
export function isRight(type, face, serial, value) {
  return equal(MODULES[type].solve(face, serial), value);
}
