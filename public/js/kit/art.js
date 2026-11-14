// I disegni dei giochi: un pittogramma a tratto per ciascuno, con un solo dettaglio in rosso.
// Griglia 48, tratto 2, estremità tonde: stesse regole delle icone in dom.js.
import { h } from './dom.js';

const p = (d, cls) => h('svg:path', { d, class: cls });
const dot = (cx, cy, r, cls) => h('svg:circle', { cx, cy, r, class: cls });
const letter = (x, y, ch, cls) => h('svg:text', { x, y, class: `art__letter ${cls ?? ''}`, 'text-anchor': 'middle' }, ch);

const ART = {
  // la ruota e la sua lancetta
  'nomi-cose-citta': () => [
    dot(24, 27, 16), p('M8 27h32M24 11v32M12.7 15.7l22.6 22.6M35.3 15.7 12.7 38.3'),
    dot(24, 27, 3.2, 'art__paper'), p('M24 12.5l-4-8.5h8z', 'art__red-fill'),
  ],
  // quattro pastelli, uno già trovato, e sotto i pallini di risposta
  'codice-segreto': () => [
    dot(8.5, 18, 4.5), dot(18.8, 18, 4.5, 'art__red-fill'), dot(29.2, 18, 4.5), dot(39.5, 18, 4.5),
    p('M4 28.5h40'), dot(15, 37, 2.4, 'art__red-fill'), dot(24, 37, 2.4, 'art__red'), dot(33, 37, .9, 'art__ink-fill'),
  ],
  // la forca a inchiostro, l'omino in rosso
  impiccato: () => [
    p('M7 43h22M13 43V6h19v6M13 14l8-8'),
    dot(32, 16.5, 4.5, 'art__red'), p('M32 21v11M26.5 25.5h11M32 32l-4.5 7M32 32l4.5 7', 'art__red'),
  ],
  // tre tessere, una fuori posto
  anagrammi: () => [
    p('M3 19h13v13H3zM31.5 21h13v13h-13z'), p('M17.5 13.5l12.8-2.2 2.2 12.8-12.8 2.2z', 'art__red'),
    letter(9.5, 29.5, 'O'), letter(38, 31.5, 'A'), letter(25, 22.6, 'R', 'art__letter--red art__letter--tilt'),
  ],
  // qualcuno che si presenta, con cappello e baffi finti
  piacere: () => [
    dot(24, 28, 11), p('M10 17h28M15.5 17V8h17v9'), dot(19.5, 25.5, .9, 'art__ink-fill'), dot(28.5, 25.5, .9, 'art__ink-fill'),
    p('M16.5 33.5q3.8-4.2 7.5-.6 3.7-3.6 7.5.6', 'art__red'),
  ],
  // i muri, l'ingresso e l'omino
  labirinto: () => [
    p('M14 6h28v36H6V6M14 14h20v20H14V22M22 22h4v4M34 24h8'),
    dot(10, 9.5, 2.6, 'art__red-fill'),
  ],
  // la bomba e la miccia accesa
  bomba: () => [
    dot(21, 29.5, 13), p('M27 17.5l3.5-4 5 4.4-3.4 4M33.2 15.6q4.3-7 9.3-2.6'),
    p('M43.5 9.5V6M46 12.5l2.5-1.2M41 9.6l-1.8-2.8', 'art__red'),
  ],
};

/** Il disegno di un gioco; un cerchio vuoto se il gioco non ne ha ancora uno. */
export function art(id, cls = '') {
  return h('svg:svg', { viewBox: '0 0 48 48', class: `art ${cls}`, 'aria-hidden': 'true' }, (ART[id] ?? (() => [dot(24, 24, 16)]))());
}
