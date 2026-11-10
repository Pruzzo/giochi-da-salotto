// Le vittorie della serata: una stellina dorata per ogni partita vinta, come quelle della maestra.
// Le usano i giochi, la console e la pagina d'attesa; lo stile è in /css/tally.css.
import { h } from './dom.js';

const STAR = 'M12 2.8l2.7 5.8 6.3.7-4.7 4.3 1.3 6.3-5.6-3.2-5.6 3.2 1.3-6.3L3 9.3l6.3-.7z';
const TILT = [-9, 6, -3, 10, -6, 3]; // attaccate a mano, mai dritte
const SHOWN = 5; // oltre, una stellina e il numero

function star(i, fresh) {
  return h('svg:svg', {
    viewBox: '0 0 24 24', class: `star${fresh ? ' star--fresh' : ''}`, 'aria-hidden': 'true',
    style: { '--r': `${TILT[i % TILT.length]}deg` },
  }, h('svg:path', { d: STAR }));
}

/** Le stelline di un giocatore. `fresh`: l'ultima si attacca adesso, con un timbro. */
export function stars(n, { fresh = false } = {}) {
  if (!n) return null;
  const label = n === 1 ? '1 vittoria stasera' : `${n} vittorie stasera`;
  const kids = n > SHOWN
    ? [star(0, fresh), h('span', { class: 'stars__count' }, `×${n}`)]
    : Array.from({ length: n }, (_, i) => star(i, fresh && i === n - 1));
  return h('span', { class: 'stars', role: 'img', 'aria-label': label, title: label }, kids);
}

/** Lunghezza in caratteri che occupano le stelline accanto a un nome, per dimensionare le firme. */
export const starsWidth = (n) => (!n ? 0 : n > SHOWN ? 3 : n * 1.1 + 0.5);

/**
 * Il foglio delle vittorie della serata.
 * @param session  { players: [{ name, wins, last }] } dal server
 * @param fresh    chi ha vinto l'ultima partita riceve la stellina col timbro
 */
export function tally(session, { fresh = false, empty = 'Nessuna partita vinta, per ora.' } = {}) {
  const rows = session?.players ?? [];
  return h('section', { class: 'tally' },
    h('h2', { class: 'tally__title' }, 'Vittorie della serata'),
    rows.length
      ? h('ol', { class: 'tally__list' }, rows.map((p) => {
        const now = fresh && p.last;
        return h('li', { class: `tally__row${now ? ' is-fresh' : ''}` },
          h('span', { class: 'tally__name' }, p.name),
          stars(p.wins, { fresh: now }));
      }))
      : h('p', { class: 'tally__empty' }, empty),
    h('p', { class: 'tally__note' }, 'Una stellina a chi vince una partita, a qualunque gioco.'));
}
