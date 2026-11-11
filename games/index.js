// I giochi disponibili sulla console. Per aggiungerne uno: una cartella in games/
// che esporta { id, title, description, page, publicDir, start }, poi una riga qui.
// Le parti comuni sono in games/shared (server) e public/js/kit, public/css/kit.css (client).
import codiceSegreto from './codice-segreto/index.js';
import anagrammi from './anagrammi/index.js';
import impiccato from './impiccato/index.js';
import nomiCoseCitta from './nomi-cose-citta/index.js';
import labirinto from './labirinto/index.js';
import bomba from './bomba/index.js';

export default [nomiCoseCitta, codiceSegreto, impiccato, anagrammi, labirinto, bomba];
