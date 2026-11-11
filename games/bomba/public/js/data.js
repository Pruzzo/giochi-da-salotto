// Nomi e dati dei moduli che servono al telefono (bomba e manuale). Le regole stanno sul server, in games/bomba/modules.js:
// qui solo come si chiamano le cose e cosa c'è sopra una pizza, per disegnarle e scriverle uguali nel manuale.

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

export const FLAVORS = {
  cioccolato: 'Cioccolato', fragola: 'Fragola', limone: 'Limone', pistacchio: 'Pistacchio', fiordilatte: 'Fiordilatte',
  stracciatella: 'Stracciatella', puffo: 'Puffo', liquirizia: 'Liquirizia', pesca: 'Pesca',
};
export const CLOTHES = { cappotto: 'Cappotto', maglione: 'Maglione', maglietta: 'Maglietta', costume: 'Costume' };
export const SIGN_KEYS = { fermati: 'Fermati', rallenta: 'Rallenta', avanti: 'Avanti', clacson: 'Clacson' };
export const BAR = { caffe: 'Caffè', cappuccino: 'Cappuccino', spremuta: 'Spremuta', spritz: 'Spritz', acqua: 'Acqua', cornetto: 'Cornetto' };
export const IT_ALPHABET = 'ABCDEFGHILMNOPQRSTUVZ';
export const SUIT_NAMES = { coppe: 'Coppe', denari: 'Denari', spade: 'Spade', bastoni: 'Bastoni' };
export const RECIPES = {
  carbonara: 'Carbonara', amatriciana: 'Amatriciana', gricia: 'Gricia', cacio: 'Cacio e pepe',
  aglio: 'Aglio, olio e peperoncino', pesto: 'Pesto', pomodoro: 'Al pomodoro',
};
export const INGREDIENTS = {
  guanciale: 'Guanciale', uova: 'Uova', pecorino: 'Pecorino', parmigiano: 'Parmigiano', pepe: 'Pepe', pomodoro: 'Pomodoro',
  aglio: 'Aglio', olio: 'Olio', peperoncino: 'Peperoncino', basilico: 'Basilico', pinoli: 'Pinoli', panna: 'Panna',
  cipolla: 'Cipolla', burro: 'Burro',
};
export const PAINT_NAMES = {
  rosso: 'Rosso', giallo: 'Giallo', blu: 'Blu', bianco: 'Bianco', nero: 'Nero', verde: 'Verde',
  arancione: 'Arancione', viola: 'Viola', grigio: 'Grigio', rosa: 'Rosa', marrone: 'Marrone',
};
