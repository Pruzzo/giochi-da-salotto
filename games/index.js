// I giochi disponibili sulla console. Per aggiungerne uno: una cartella in games/
// che esporta { id, title, tagline, description, meta, page, publicDir, start }, poi una riga qui
// e un disegno in public/js/kit/art.js. Come scrivere tagline e descrizione: docs/Guida-di-stile.md.
// Le parti comuni sono in games/shared (server) e public/js/kit, public/css/kit.css (client).
import codiceSegreto from './codice-segreto/index.js';
import anagrammi from './anagrammi/index.js';
import impiccato from './impiccato/index.js';
import nomiCoseCitta from './nomi-cose-citta/index.js';
import labirinto from './labirinto/index.js';
import bomba from './bomba/index.js';
import piacere from './piacere/index.js';

export default [nomiCoseCitta, codiceSegreto, impiccato, anagrammi, piacere, labirinto, bomba];
