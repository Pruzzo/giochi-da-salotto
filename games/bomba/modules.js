// I trenta moduli di "Disinnesca la bomba": come nascono, cosa vede l'artificiere, qual è la mossa giusta.
// Le regole sono quelle del manuale, in docs/Giochi-a-squadre.md ("Il manuale"). Nessuna dipendenza di rete.
// Per ogni tipo:
//   make(rand, serial, prev)   la faccia del modulo (solo quello che l'artificiere vede); prev è la faccia di prima,
//                              per i moduli a passi, così la nuova è sempre diversa
//   solve(face, serial)        la mossa giusta secondo il manuale, calcolata da quello che si vede e dal numero di serie
//   parse(value, face)         la mossa mandata dal telefono, controllata; null se non ha senso
//   after(face, move, right)   (facoltativo) dopo ogni mossa: per i fili tagliati e per chi ricorda il passo prima
//   level                      la complessità, da 1 a 3
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

// Niente O e niente Z: sul telefono si confondono con lo zero e col 2.
export const SERIAL_LETTERS = 'ABCDEFGHIJKLMNPQRSTUVWXY';
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
/** Il colore della pallina e il suo gusto; la stracciatella è bianca con le gocce di cioccolato. */
export const GELATO = {
  cioccolato: 'marrone', fragola: 'rosa', limone: 'giallo', pistacchio: 'verde', fiordilatte: 'bianco',
  stracciatella: 'bianco con le gocce', puffo: 'azzurro', liquirizia: 'nero', pesca: 'arancione',
};

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
    level: 2,
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
    level: 2,
    steps: 1,
    make: (rand, serial) => ({ start: startNot(rand, 5, leversFor(serial)) }),
    solve: (_face, serial) => leversFor(serial),
    parse: (v) => bools(v, 5),
  },

  semaforo: {
    name: 'Semaforo',
    level: 1,
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
    level: 2,
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
    level: 2,
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
    level: 2,
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
    level: 2,
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
    level: 1,
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
    level: 1,
    steps: 1,
    make: (rand, serial) => ({ start: startNot(rand, 4, bulbsFor(serial)) }),
    solve: (_face, serial) => bulbsFor(serial),
    parse: (v) => bools(v, 4),
  },

  tombola: {
    name: 'Tombola',
    level: 1,
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
    level: 1,
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

  gelato: {
    name: 'Gelato',
    level: 1,
    steps: 3,
    make: (rand, _serial, prev) => fresh(prev, () => {
      const flavor = pick(rand, Object.keys(GELATO));
      // Fiordilatte e stracciatella si somigliano: quando esce uno dei due, tra i tasti c'è spesso anche l'altro.
      const twin = { fiordilatte: 'stracciatella', stracciatella: 'fiordilatte' }[flavor];
      const others = shuffle(rand, Object.keys(GELATO).filter((f) => f !== flavor && f !== twin));
      const keys = twin && rand() < 0.7 ? [flavor, twin, ...others.slice(0, 2)] : [flavor, ...others.slice(0, 3)];
      return { flavor, keys: shuffle(rand, keys) };
    }),
    solve: ({ flavor }) => flavor,
    parse: (v, face) => (face.keys.includes(v) ? v : null),
  },
};

// ---------- I moduli nuovi: dati ----------

export const PIZZAS = {
  margherita: { name: 'Margherita', top: ['pomodoro', 'mozzarella', 'basilico'] },
  marinara: { name: 'Marinara', top: ['pomodoro', 'aglio', 'origano'] },
  diavola: { name: 'Diavola', top: ['pomodoro', 'mozzarella', 'salame'] },
  funghi: { name: 'Funghi', top: ['pomodoro', 'mozzarella', 'funghi'] },
  napoli: { name: 'Napoli', top: ['pomodoro', 'mozzarella', 'acciughe', 'capperi'] },
  capricciosa: { name: 'Capricciosa', top: ['pomodoro', 'mozzarella', 'prosciutto', 'funghi', 'carciofi', 'olive'] },
  patate: { name: 'Patate', top: ['mozzarella', 'patate'] },
  formaggi: { name: 'Quattro formaggi', top: ['formaggi'] },
};

export const CLOTHES = ['cappotto', 'maglione', 'maglietta', 'costume'];
const clothesFor = (t) => (t < 5 ? 'cappotto' : t < 15 ? 'maglione' : t < 25 ? 'maglietta' : 'costume');

/** I cartelli: forma e colore. Il disegno dentro serve solo a confondere. */
export const SIGNS = {
  ottagono: 'fermati', 'cerchio-rosso': 'fermati', divieto: 'fermati',
  'triangolo-giu': 'rallenta', 'triangolo-su': 'clacson',
  'cerchio-blu': 'avanti', 'quadrato-blu': 'avanti', rombo: 'clacson',
};
export const SIGN_KEYS = ['fermati', 'rallenta', 'avanti', 'clacson'];

const clock = (minutes) => {
  const m = ((minutes % 720) + 720) % 720;
  const h = Math.floor(m / 60) || 12;
  return `${h}:${String(m % 60).padStart(2, '0')}`;
};

/** Quanti minuti aggiungere all'orologio: dipende dall'ultima cifra del numero di serie. */
export function addMinutes(serial) {
  const d = lastDigit(serial);
  return d <= 2 ? 15 : d <= 5 ? 30 : d <= 7 ? 45 : 60;
}

export const PHONEBOOK = {
  'Nonna Pina': '427', 'Nonno Gino': '913', 'Zia Rosa': '358', 'Zio Tano': '760', 'Zia Tina': '394',
  Mamma: '125', 'Papà': '842', 'Il dottore': '609', 'La pizzeria': '271', 'Il vigile': '534',
};

export const BLOBS = ['rosso', 'giallo', 'blu', 'bianco', 'nero', 'verde'];
export const MIXES = [
  [['rosso', 'giallo'], 'arancione'], [['giallo', 'blu'], 'verde'], [['rosso', 'blu'], 'viola'],
  [['bianco', 'nero'], 'grigio'], [['bianco', 'rosso'], 'rosa'], [['rosso', 'verde'], 'marrone'],
];
export const PAINTS = ['rosso', 'giallo', 'blu', 'bianco', 'nero', 'verde', 'arancione', 'viola', 'grigio', 'rosa', 'marrone'];
function mixOf([a, b]) {
  if (a === b) return a;
  const hit = MIXES.find(([pair]) => pair.includes(a) && pair.includes(b));
  return hit ? hit[1] : 'nero';
}

export const SUITS = ['coppe', 'denari', 'spade', 'bastoni'];
/** Dalla più forte alla più debole. */
export const STRENGTH = [1, 3, 10, 9, 8, 7, 6, 5, 4, 2];
const power = (card) => STRENGTH.length - STRENGTH.indexOf(card.n);
const takes = (card, played, trump) => (card.s === played.s ? power(card) > power(played) : card.s === trump);
/** La carta da giocare, o null se le regole non danno una carta sola (due carte ugualmente deboli). */
function briscolaMove({ trump, played, hand }) {
  const weakest = (idx) => {
    if (!idx.length) return undefined;
    const min = Math.min(...idx.map((i) => power(hand[i])));
    const all = idx.filter((i) => power(hand[i]) === min);
    return all.length === 1 ? all[0] : null;
  };
  const all = [0, 1, 2];
  const same = all.filter((i) => hand[i].s === played.s && takes(hand[i], played, trump));
  if (same.length) return weakest(same);
  const trumps = all.filter((i) => hand[i].s === trump);
  if ((played.n === 1 || played.n === 3) && trumps.length) return weakest(trumps);
  const plain = all.filter((i) => hand[i].s !== trump);
  return weakest(plain.length ? plain : all);
}

export const IT_ALPHABET = 'ABCDEFGHILMNOPQRSTUVZ';
export const CIPHER_WORDS = ['PIANO', 'TRENO', 'VESPA', 'LIBRO', 'PORTA', 'SCALA', 'MONTE', 'FIUME', 'GATTO', 'SEDIA', 'CARTA', 'NOTTE'];
const shiftOf = (serial) => lastDigit(serial) || 10;
const shiftWord = (word, by) => [...word].map((c) => IT_ALPHABET[(IT_ALPHABET.indexOf(c) + by + 21 * 2) % 21]).join('');

export const BAR = ['caffe', 'cappuccino', 'spremuta', 'spritz', 'acqua', 'cornetto'];
function serve({ hour, ask, before }) {
  if (ask === 'cappuccino' && hour >= 11) return 'caffe';
  if (ask === 'spritz' && hour < 17) return 'spremuta';
  if (before && ask === before) return 'acqua';
  return ask;
}

export const CITIES = ['Roma', 'Bari', 'Pisa', 'Asti', 'Como', 'Lecce', 'Siena', 'Parma', 'Udine', 'Genova', 'Torino', 'Napoli',
  'Milano', 'Verona', 'Ancona', 'Bologna', 'Firenze', 'Palermo', 'Venezia', 'Catania', 'Trieste', 'Cagliari', 'Brescia', 'Bergamo', 'Padova'];
function matchResult([home, away]) {
  if (home[0] === away[0]) return 'X';
  if (home === 'Roma') return '1';
  if (away === 'Roma') return '2';
  if (home.length !== away.length) return home.length > away.length ? '1' : '2';
  return 'X';
}

export const ANAGRAMS = ['CAMPO', 'FORNO', 'GRANO', 'TIGRE', 'SPADA', 'BURRO', 'PESCA', 'LAMPO', 'CUORE', 'DENTE', 'SALTO', 'FUNGO'];

function liftMove({ floor, arrow, before }) {
  if (before === null || before === undefined) return floor;
  if (floor === before) return 0;
  const next = before + (arrow === 'su' ? 1 : -1);
  return next < 0 || next > 6 ? floor : next;
}

export const WEIGHTS = [1, 2, 3, 5, 10];
/** I pesi da mettere: quelli che fanno il numero col minor numero di pesi; null se i modi sono più d'uno. */
function weighFor(target) {
  let best = null;
  let ties = 0;
  for (let mask = 1; mask < 32; mask++) {
    const pick = WEIGHTS.map((_, i) => Boolean(mask & (1 << i)));
    const sum = WEIGHTS.reduce((acc, w, i) => acc + (pick[i] ? w : 0), 0);
    if (sum !== target) continue;
    const count = pick.filter(Boolean).length;
    if (!best || count < best.count) { best = { pick, count }; ties = 0; } else if (count === best.count) ties++;
  }
  return best && !ties ? best.pick : null;
}

export const PLATFORMS = {
  Milano: 1, Torino: 1, Venezia: 2, Trieste: 2, Bologna: 3, Firenze: 3, Roma: 4, Napoli: 4, Bari: 5, Lecce: 5, Palermo: 6, Genova: 6,
};
function platformFor({ dest, hour, delay }, serial) {
  let p = PLATFORMS[dest];
  if (delay > 10) p = (p % 6) + 1;
  if (hour >= 18 && hasVowel(serial)) p = ((p + 4) % 6) + 1;
  return p;
}

function switchesFor({ switches }, serial) {
  const even = lastDigit(serial) % 2 === 0;
  const out = switches.map(({ color, lamp }) => (color === 'rosso' ? !lamp : lamp && even));
  if (hasVowel(serial)) out[2] = !out[2];
  return out;
}

export const RECIPES = {
  carbonara: { name: 'Carbonara', steps: ['guanciale', 'uova', 'pecorino', 'pepe'] },
  amatriciana: { name: 'Amatriciana', steps: ['guanciale', 'pomodoro', 'pecorino'] },
  gricia: { name: 'Gricia', steps: ['guanciale', 'pecorino', 'pepe'] },
  cacio: { name: 'Cacio e pepe', steps: ['pecorino', 'pepe'] },
  aglio: { name: 'Aglio, olio e peperoncino', steps: ['aglio', 'olio', 'peperoncino'] },
  pesto: { name: 'Pesto', steps: ['basilico', 'aglio', 'pinoli', 'olio', 'parmigiano'] },
  pomodoro: { name: 'Al pomodoro', steps: ['olio', 'pomodoro', 'basilico'] },
};
export const INGREDIENTS = ['guanciale', 'uova', 'pecorino', 'parmigiano', 'pepe', 'pomodoro', 'aglio', 'olio', 'peperoncino', 'basilico', 'pinoli', 'panna', 'cipolla', 'burro'];
const recipeFor = (dish, serial) => RECIPES[dish].steps.map((x) => (x === 'pecorino' && hasVowel(serial) ? 'parmigiano' : x));

/** Quattro tasti: la risposta giusta più tre a caso da `pool`, in ordine sparso. */
function fourKeys(rand, right, pool) {
  return shuffle(rand, [right, ...shuffle(rand, pool.filter((x) => x !== right)).slice(0, 3)]);
}
const strings = (v, n, allowed) => (Array.isArray(v) && v.length === n && v.every((x) => allowed.includes(x)) ? [...v] : null);

// ---------- I moduli nuovi ----------

const MORE = {
  pizza: {
    name: 'Pizza',
    level: 1,
    steps: 3,
    make: (rand, _serial, prev) => fresh(prev, () => {
      const pizza = pick(rand, Object.keys(PIZZAS));
      return { pizza, keys: fourKeys(rand, pizza, Object.keys(PIZZAS)) };
    }),
    solve: ({ pizza }) => pizza,
    parse: (v, face) => (face.keys.includes(v) ? v : null),
  },

  termometro: {
    name: 'Termometro',
    level: 1,
    steps: 3,
    make: (rand, _serial, prev) => fresh(prev, () => ({ temp: -8 + int(rand, 43) })),
    solve: ({ temp }) => clothesFor(temp),
    parse: (v) => (CLOTHES.includes(v) ? v : null),
  },

  cartello: {
    name: 'Cartello',
    level: 1,
    steps: 3,
    make: (rand, _serial, prev) => fresh(prev, () => ({ sign: pick(rand, Object.keys(SIGNS)) })),
    solve: ({ sign }) => SIGNS[sign],
    parse: (v) => (SIGN_KEYS.includes(v) ? v : null),
  },

  orologio: {
    name: 'Orologio',
    level: 1,
    steps: 3,
    make: (rand, serial, prev) => fresh(prev, () => {
      const at = 60 + int(rand, 144) * 5; // dall'1:00 alle 12:55
      const right = clock(at + addMinutes(serial));
      // Gli altri tasti sono l'ora segnata e gli orari degli altri casi della tabella.
      const others = shuffle(rand, [0, 15, 30, 45, 60].map((m) => clock(at + m)).filter((t) => t !== right)).slice(0, 3);
      return { minutes: at, keys: shuffle(rand, [right, ...others]) };
    }),
    solve: ({ minutes }, serial) => clock(minutes + addMinutes(serial)),
    parse: (v, face) => (face.keys.includes(v) ? v : null),
  },

  scontrino: {
    name: 'Scontrino',
    level: 2,
    steps: 1,
    make(rand) {
      for (;;) {
        const note = pick(rand, [10, 20, 50]);
        const top = { 10: 4, 20: 8, 50: 18 }[note];
        const prices = [0, 1, 2].map(() => 1 + int(rand, top));
        const total = prices.reduce((a, b) => a + b, 0);
        if (total <= note && total >= 3) return { prices, note };
      }
    },
    solve: ({ prices, note }, serial) => note - (prices.reduce((a, b) => a + b, 0) - (hasVowel(serial) ? 2 : 0)),
    parse: (v) => (typeof v === 'string' && /^[0-9]{1,3}$/.test(v) ? Number(v) : null),
  },

  telefono: {
    name: 'Telefono',
    level: 2,
    steps: 1,
    make: (rand) => ({ name: pick(rand, Object.keys(PHONEBOOK)) }),
    solve: ({ name }, serial) => (lastDigit(serial) % 2 ? [...PHONEBOOK[name]].reverse().join('') : PHONEBOOK[name]),
    parse: (v) => (typeof v === 'string' && /^[0-9]{3}$/.test(v) ? v : null),
  },

  tavolozza: {
    name: 'Tavolozza',
    level: 2,
    steps: 3,
    make: (rand, _serial, prev) => fresh(prev, () => {
      const r = rand();
      let blobs;
      if (r < 0.25) { const c = pick(rand, BLOBS); blobs = [c, c]; } else if (r < 0.8) blobs = shuffle(rand, pick(rand, MIXES)[0]);
      else {
        do blobs = [pick(rand, BLOBS), pick(rand, BLOBS)]; while (blobs[0] === blobs[1] || mixOf(blobs) !== 'nero');
      }
      return { blobs, keys: fourKeys(rand, mixOf(blobs), PAINTS) };
    }),
    solve: ({ blobs }) => mixOf(blobs),
    parse: (v, face) => (face.keys.includes(v) ? v : null),
  },

  ingranaggi: {
    name: 'Ingranaggi',
    level: 2,
    steps: 1,
    make(rand) {
      const n = 3 + int(rand, 4);
      const broken = rand() < 0.4 ? 2 + int(rand, n - 2) : -1; // mai il primo né il secondo
      const gears = Array.from({ length: n }, (_, i) => ({ red: i === broken, belt: i < n - 1 && rand() < 0.3 }));
      return { gears, first: pick(rand, ['orario', 'antiorario']) };
    },
    solve({ gears, first }) {
      let dir = first;
      for (let i = 1; i < gears.length; i++) {
        if (gears[i].red) return dir;
        if (!gears[i - 1].belt) dir = dir === 'orario' ? 'antiorario' : 'orario';
      }
      return dir;
    },
    parse: (v) => (['orario', 'antiorario'].includes(v) ? v : null),
  },

  briscola: {
    name: 'Briscola',
    level: 3,
    steps: 3,
    make: (rand, _serial, prev) => fresh(prev, () => {
      for (;;) {
        const deck = shuffle(rand, SUITS.flatMap((s) => STRENGTH.map((n) => ({ s, n }))));
        const face = { trump: pick(rand, SUITS), played: deck[0], hand: deck.slice(1, 4) };
        if (briscolaMove(face) !== null) return face;
      }
    }),
    solve: (face) => briscolaMove(face),
    parse: (v) => (isInt(v, 0, 2) ? v : null),
  },

  cifrario: {
    name: 'Cifrario',
    level: 3,
    steps: 1,
    make(rand, serial) {
      const word = pick(rand, CIPHER_WORDS);
      const secret = shiftWord(word, shiftOf(serial));
      for (;;) {
        const start = [0, 1, 2, 3, 4].map(() => pick(rand, IT_ALPHABET));
        if (start.join('') !== word) return { secret, start };
      }
    },
    solve: ({ secret }, serial) => [...shiftWord(secret, -shiftOf(serial))],
    parse: (v) => strings(v, 5, [...IT_ALPHABET]),
  },

  barista: {
    name: 'Barista',
    level: 3,
    steps: 3,
    make: (rand, _serial, prev) => fresh(prev, () => {
      const before = prev ? prev.served : null;
      const hour = 7 + int(rand, 16);
      const ask = before && rand() < 0.3 ? before : pick(rand, BAR);
      const face = { hour, ask, before };
      // Tra i tasti c'è sempre anche quello che chiede, così chi non legge le regole sbaglia.
      const right = serve(face);
      const others = shuffle(rand, BAR.filter((x) => x !== right && x !== ask)).slice(0, ask === right ? 3 : 2);
      return { ...face, keys: shuffle(rand, [...new Set([right, ask, ...others])]), served: before };
    }),
    solve: (face) => serve(face),
    parse: (v, face) => (face.keys.includes(v) ? v : null),
    // Il "cliente prima" è l'ultimo servito bene: dopo un errore resta quello di prima.
    after(face, move, right) { if (right) face.served = move; },
  },

  schedina: {
    name: 'Schedina',
    level: 3,
    steps: 1,
    make(rand) {
      const matches = [0, 1, 2, 3].map(() => {
        const r = rand();
        const pool = r < 0.2 ? ['Roma', ...shuffle(rand, CITIES.filter((c) => c !== 'Roma'))] : shuffle(rand, CITIES);
        if (r >= 0.2 && r < 0.35) {
          // due città con la stessa iniziale
          for (const a of pool) {
            const b = pool.find((c) => c !== a && c[0] === a[0]);
            if (b) return shuffle(rand, [a, b]);
          }
        }
        return shuffle(rand, pool.slice(0, 2));
      });
      return { matches };
    },
    solve({ matches }, serial) {
      const out = matches.map(matchResult);
      if (lastDigit(serial) % 2) out[2] = { 1: '2', 2: '1', X: 'X' }[out[2]];
      return out;
    },
    parse: (v) => strings(v, 4, ['1', 'X', '2']),
  },

  anagramma: {
    name: 'Anagramma',
    level: 3,
    steps: 1,
    make(rand) {
      const word = pick(rand, ANAGRAMS);
      for (;;) {
        const tiles = shuffle(rand, [...word]);
        if (tiles.join('') !== word && tiles.join('') !== [...word].reverse().join('')) return { tiles };
      }
    },
    solve({ tiles }, serial) {
      const word = ANAGRAMS.find((w) => [...w].sort().join('') === [...tiles].sort().join(''));
      return hasVowel(serial) ? [...word].reverse().join('') : word;
    },
    // Arrivano le tessere toccate, in ordine: conta la parola che fanno, così le lettere doppie vanno bene in ogni ordine.
    parse: (v, face) => (Array.isArray(v) && v.length === 5 && new Set(v).size === 5 && v.every((i) => isInt(i, 0, 4))
      ? v.map((i) => face.tiles[i]).join('') : null),
  },

  ascensore: {
    name: 'Ascensore',
    level: 3,
    steps: 4,
    make: (rand, _serial, prev) => fresh(prev, () => {
      const before = prev ? prev.pressed : null;
      const floor = before !== null && rand() < 0.25 ? before : int(rand, 7);
      return { floor, arrow: pick(rand, ['su', 'giu']), before, pressed: before };
    }),
    solve: (face) => liftMove(face),
    parse: (v) => (isInt(v, 0, 6) ? v : null),
    after(face, move, right) { if (right) face.pressed = move; },
  },

  bilancia: {
    name: 'Bilancia',
    level: 3,
    steps: 1,
    make(rand, serial) {
      for (;;) {
        const left = Array.from({ length: 2 + int(rand, 2) }, () => 1 + int(rand, 8));
        const target = left.reduce((a, b) => a + b, 0) + (hasVowel(serial) ? 1 : 0);
        if (target <= 21 && weighFor(target)) return { left };
      }
    },
    solve: ({ left }, serial) => weighFor(left.reduce((a, b) => a + b, 0) + (hasVowel(serial) ? 1 : 0)),
    parse: (v) => bools(v, 5),
  },

  stazione: {
    name: 'Stazione',
    level: 3,
    steps: 3,
    make: (rand, _serial, prev) => fresh(prev, () => ({
      dest: pick(rand, Object.keys(PLATFORMS)),
      hour: 6 + int(rand, 17),
      minute: int(rand, 12) * 5,
      delay: rand() < 0.5 ? 0 : pick(rand, [5, 10, 15, 20, 25, 30, 45]),
    })),
    solve: (face, serial) => platformFor(face, serial),
    parse: (v) => (isInt(v, 1, 6) ? v : null),
  },

  quadro: {
    name: 'Quadro elettrico',
    level: 3,
    steps: 1,
    make(rand, serial) {
      const switches = Array.from({ length: 5 }, () => ({ color: pick(rand, ['rosso', 'blu']), lamp: rand() < 0.5 }));
      return { switches, start: startNot(rand, 5, switchesFor({ switches }, serial)) };
    },
    solve: (face, serial) => switchesFor(face, serial),
    parse: (v) => bools(v, 5),
  },

  ricetta: {
    name: 'Ricetta',
    level: 3,
    steps: 2,
    make: (rand, serial, prev) => fresh(prev, () => {
      const dish = pick(rand, Object.keys(RECIPES));
      const need = recipeFor(dish, serial);
      // Se nel piatto c'è il pecorino (o il parmigiano al suo posto), ci sono tutti e due, così la regola conta.
      const tempt = RECIPES[dish].steps.includes('pecorino') ? ['pecorino', 'parmigiano', 'panna'] : ['panna'];
      const extra = shuffle(rand, INGREDIENTS.filter((x) => !need.includes(x) && !tempt.includes(x)));
      const keys = [...new Set([...need, ...tempt])].concat(extra).slice(0, 6);
      return { dish, keys: shuffle(rand, keys) };
    }),
    solve: ({ dish }, serial) => recipeFor(dish, serial),
    parse: (v, face) => (Array.isArray(v) && v.length >= 1 && v.length <= 6 && new Set(v).size === v.length && v.every((x) => face.keys.includes(x)) ? [...v] : null),
  },
};

Object.assign(MODULES, MORE);

export const MODULE_TYPES = Object.keys(MODULES);

/** La mossa è quella giusta? */
export function isRight(type, face, serial, value) {
  return equal(MODULES[type].solve(face, serial), value);
}
