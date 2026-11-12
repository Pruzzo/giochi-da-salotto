import { h } from '/js/kit/dom.js';

export { h, fill, icon } from '/js/kit/dom.js';

/** Il voto dell'arbitro: cifra in penna, cerchiata a mano. A matita finché è solo una proposta. */
export function scoreMark(score, confirmed) {
  return h('span', { class: `mark ${confirmed ? 'mark--ink' : 'mark--pencil'}`, 'data-score': score },
    h('svg:svg', { viewBox: '0 0 40 40', class: 'mark__ring', 'aria-hidden': 'true' },
      h('svg:path', { d: 'M21 4C10 3 4 11 4 20c0 10 8 16 17 16 10 0 15-8 15-16C36 11 29 4 18 5', pathLength: '1' })),
    h('span', { class: 'mark__digit' }, String(score)));
}

let penId = 0;
/** La lettera del turno: contorno a biro e riempimento a tratteggio, come i settori della ruota. */
export function penLetter(letter) {
  penId += 1;
  const id = `pen-${penId}`;
  const svg = h('svg:svg', { viewBox: '0 0 200 200', class: 'pen-letter', role: 'img', 'aria-label': `Lettera ${letter}` });
  svg.innerHTML = `<defs><pattern id="${id}" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(-40)"><line x1="0" y1="0" x2="0" y2="9" style="stroke: var(--ink)" stroke-width="4.5"/></pattern></defs>`
    // Tre strati: contorno, carta sopra (cancella le sovrapposizioni del font), tratteggio.
    + ['class="pen-letter__edge"', 'class="pen-letter__paper"', `class="pen-letter__hatch" fill="url(#${id})"`]
      .map((attrs) => `<text x="100" y="104" text-anchor="middle" dominant-baseline="central" ${attrs}></text>`).join('');
  svg.querySelectorAll('text').forEach((t) => { t.textContent = letter; });
  return svg;
}
