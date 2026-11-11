// Il telefono dell'esperto: il manuale. Il testo è quello di docs/Giochi-a-squadre.md, "Il manuale", parola per parola.
// Prima pagina: l'indice col disegno di ogni modulo; poi una pagina per modulo.
import { h, fill } from '/js/kit/dom.js';
import { page } from '/js/kit/ui.js';
import { smorfia, thumb } from './draw.js';
import { crosses, ending, lamps } from './common.js';

// Testo con **grassetto**: niente HTML, solo pezzi di testo e <b>.
function rich(text) {
  return text.split('**').map((part, i) => (i % 2 ? h('b', {}, part) : part));
}
const P = (text) => h('p', {}, rich(text));
const OL = (...items) => h('ol', { class: 'man-ol' }, items.map((t) => h('li', {}, rich(t))));
const TABLE = (head, rows, cls = '') => h('table', { class: `man-table ${cls}` },
  h('thead', {}, h('tr', {}, head.map((c) => h('th', {}, rich(c))))),
  h('tbody', {}, rows.map((r) => h('tr', {}, r.map((c) => h('td', {}, typeof c === 'string' ? rich(c) : c))))));

const TOMBOLA = [
  ['italia', 'L\'Italia', 1], ['bambina', 'La bambina', 2], ['gatta', 'La gatta', 3], ['maiale', 'Il maiale', 4],
  ['mano', 'La mano', 5], ['topi', 'I topi', 11], ['soldati', 'I soldati', 12], ['risata', 'La risata', 19],
  ['festa', 'La festa', 20], ['testa', 'La testa', 34], ['paura', 'La paura', 90],
];

export const PAGES = [
  {
    type: 'fili', title: 'Fili',
    desc: 'Da 3 a 6 fili orizzontali, uno sotto l\'altro. Colori: rosso, blu, giallo, bianco, nero. Se ne taglia uno solo.',
    body: () => [
      P('I fili si contano dall\'alto. Leggi le regole in ordine e fermati alla prima che vale:'),
      OL(
        'Ci sono **2 o più fili rossi**: taglia l\'**ultimo rosso**.',
        'C\'è almeno un **filo giallo** e l\'**ultima cifra** del numero di serie è **pari**: taglia il **primo giallo**.',
        'Il **primo filo è nero**: taglia il **secondo filo**.',
        'Ci sono **più fili blu che bianchi**: taglia l\'**ultimo filo**.',
        'Altrimenti: taglia il **filo di mezzo** (con un numero pari di fili, il più alto dei due di mezzo).'),
    ],
  },
  {
    type: 'leve', title: 'Leve',
    desc: 'Cinque leve in fila, ognuna su o giù, e un tasto Conferma.',
    body: () => [
      P('Guarda la **prima lettera** del numero di serie e metti le leve così, da sinistra a destra, poi premi **Conferma**:'),
      TABLE(['Prima lettera', 'Leve'], [
        ['A – E', 'su · giù · su · giù · su'],
        ['F – J', 'giù · giù · su · su · giù'],
        ['K – O', 'su · su · giù · giù · su'],
        ['P – T', 'giù · su · su · giù · giù'],
        ['U – Z', 'su · giù · giù · su · su'],
      ], 'man-table--levers'),
      P('Se nel numero di serie c\'è uno **zero**, la leva di mezzo va al contrario.'),
    ],
  },
  {
    type: 'semaforo', title: 'Semaforo',
    desc: 'Tre luci in alto (rossa, gialla, verde) e sotto tre tasti degli stessi colori. Si risolve in tre passi: a ogni passo si accende una luce.',
    body: () => [
      P('Guarda se nel numero di serie c\'è almeno una **vocale**, poi premi il tasto indicato:'),
      TABLE(['Si accende', 'Con vocale', 'Senza vocale'], [
        ['Rossa', 'premi Verde', 'premi Giallo'],
        ['Gialla', 'premi Rosso', 'premi Verde'],
        ['Verde', 'premi Giallo', 'premi Rosso'],
      ]),
      P('Dopo tre passi giusti il semaforo è risolto. Un tasto sbagliato è un errore, e quel passo ricomincia con una luce nuova.'),
    ],
  },
  {
    type: 'parola', title: 'Parola',
    desc: 'Uno schermino con una parola e sotto quattro tasti, ognuno con una parola. Si risolve in tre passi.',
    body: () => [
      P('Le parole si somigliano apposta: **fatti fare lo spelling**. Trova la parola dello schermino e premi il tasto con la parola accanto:'),
      TABLE(['Sullo schermino', 'Premi'], [
        ['CASA', 'CASCO'], ['CASSA', 'COSA'], ['CAUSA', 'CASA'], ['COSA', 'CASTA'],
        ['CASO', 'CAUSA'], ['CASE', 'CASSA'], ['CASTA', 'CASO'], ['CASCO', 'CASE'],
      ], 'man-table--words'),
      P('La parola da premere c\'è sempre tra i quattro tasti. Dopo tre passi giusti il modulo è risolto. Un tasto sbagliato è un errore, e quel passo ricomincia con parole nuove.'),
    ],
  },
  {
    type: 'cassaforte', title: 'Cassaforte',
    desc: 'Un tastierino da 0 a 9, i tasti Cancella e Apri, e uno schermino per quattro cifre.',
    body: () => [
      P('Il codice ha quattro cifre:'),
      OL('le **tre cifre del numero di serie**, nell\'ordine in cui compaiono;', 'poi l\'**ultima cifra della loro somma**.'),
      P('Esempio: RT4-82K → 4, 8, 2 → somma 14 → **4824**. Scrivilo e premi **Apri**.'),
    ],
  },
  {
    type: 'lucchetto', title: 'Lucchetto',
    desc: 'Un lucchetto colorato (rosso, blu o verde) con tre rotelle di lettere, ognuna con le frecce su e giù, e un tasto Apri.',
    body: () => [
      P('Le rotelle vanno sulle **tre lettere del numero di serie**:'),
      TABLE(['Lucchetto', 'Ordine delle lettere'], [
        ['Rosso', 'come compaiono nel numero di serie'],
        ['Blu', 'al contrario'],
        ['Verde', 'in ordine alfabetico'],
      ]),
      P('Esempio: RT4-82K col lucchetto verde → **K R T**. Poi premi **Apri**.'),
    ],
  },
  {
    type: 'bandiera', title: 'Bandiera',
    desc: 'Una bandiera con tre strisce verticali. Colori possibili: rosso, giallo, verde, blu, bianco, nero. Le tre strisce non sono mai tutte dello stesso colore. Si tocca una striscia sola.',
    body: () => [
      P('Leggi le regole in ordine e fermati alla prima che vale:'),
      OL(
        'È la **bandiera italiana** (verde, bianco, rosso, da sinistra): tocca la **bianca**.',
        '**Due strisce hanno lo stesso colore**: tocca quella **diversa**.',
        'La striscia di **mezzo è rossa**: tocca quella **a sinistra**.',
        'Altrimenti tocca la striscia col colore che viene **prima** in questo elenco: rosso, giallo, verde, blu, bianco, nero.'),
    ],
  },
  {
    type: 'dado', title: 'Dado',
    desc: 'Un dado, bianco o rosso, che mostra una faccia, e sei tasti da 1 a 6. Si risolve in tre lanci.',
    body: () => [
      TABLE(['Dado', 'Cosa premere'], [
        ['Bianco', 'la **faccia opposta**: 7 meno il numero (1 → 6, 2 → 5, 3 → 4…)'],
        ['Rosso', 'il **numero dopo** (1 → 2, 2 → 3… e 6 → 1)'],
      ]),
      P('Se nel numero di serie c\'è una **vocale**, i colori si scambiano: il dado bianco va trattato come rosso e il rosso come bianco.'),
      P('Un tasto sbagliato è un errore, e il dado si rilancia.'),
    ],
  },
  {
    type: 'lampadine', title: 'Lampadine',
    desc: 'Quattro lampadine numerate da 1 a 4, ognuna accesa o spenta (si toccano per cambiarle), e un tasto Conferma.',
    body: () => [
      OL('Accendi le lampadine il cui numero compare tra le **cifre del numero di serie**, e spegni le altre.',
        'Se nessuna cifra va da 1 a 4, accendi **solo la 4**.'),
      P('Esempio: RT4-82K → cifre 4, 8, 2 → accese la **2** e la **4**. Poi premi **Conferma**.'),
    ],
  },
  {
    type: 'tombola', title: 'Tombola',
    desc: 'Uno schermino con un disegno e quattro tasti con un numero ciascuno. Si risolve in tre passi.',
    body: () => [
      P('È la smorfia: premi il numero del disegno.'),
      TABLE(['Disegno', '', 'Numero'], TOMBOLA.map(([id, name, n]) => [smorfia(id, 'art art--tiny'), name, h('b', {}, String(n))]), 'man-table--tombola'),
      P('Il numero giusto c\'è sempre tra i quattro tasti. Un tasto sbagliato è un errore, e arriva un disegno nuovo.'),
    ],
  },
  {
    type: 'moka', title: 'Moka',
    desc: 'Una moka sul fornello con un manometro: la lancetta sta nella zona verde, gialla o rossa. Tre tasti: Alza la fiamma, Abbassa, Spegni. Si risolve in tre passi.',
    body: () => [
      TABLE(['Lancetta', 'Cosa fare'], [
        ['Verde', '**Alza la fiamma**'],
        ['Gialla', 'ultima cifra pari: **Abbassa**; dispari: **Spegni**'],
        ['Rossa', '**Spegni**'],
      ]),
      P('Un tasto sbagliato è un errore, e la lancetta si sposta.'),
    ],
  },
  {
    type: 'bussola', title: 'Bussola',
    desc: 'Una freccia che punta in su, in giù, a destra o a sinistra, e quattro tasti: N, S, E, O. Si risolve in tre passi.',
    body: () => [
      P('La freccia in su è il Nord, a destra l\'Est, in giù il Sud, a sinistra l\'Ovest. Premi la direzione della freccia **girata di un quarto in senso orario** (N → E, E → S, S → O, O → N).'),
      P('Se nel numero di serie c\'è una **vocale**, gira invece in senso **antiorario** (N → O, O → S, S → E, E → N).'),
    ],
  },
];

export function manualPhone(state) {
  const status = h('div', { class: 'man-status' });
  const body = h('div', { class: 'man-body' });
  const done = h('div', { class: 'bomb-done', hidden: true });
  const back = h('button', { type: 'button', class: 'man-back', onClick: () => show(null) }, '← Indice');
  const el = page('manual', h('header', { class: 'man-head' }, back, status), done, body);

  /** null: l'indice; se no la pagina di quel modulo. */
  function show(type) {
    back.hidden = !type;
    if (!type) {
      fill(body,
        h('h1', { class: 'man-title' }, 'Manuale dell’esperto'),
        h('div', { class: 'man-intro' },
          P('Fatti descrivere il modulo dall\'artificiere, trova il disegno che gli somiglia e apri la sua pagina.'),
          P('Il **numero di serie** è sempre fatto così: due lettere, una cifra, trattino, due cifre, una lettera (es. RT4-82K). Quindi ha sempre **tre lettere** e **tre cifre**. L\'**ultima cifra** è quella prima della lettera finale (nell\'esempio, 2). Molte regole lo usano: chiedilo all\'artificiere.'),
          P('Quando una regola parla di **vocali** intende A, E, I, O, U tra le lettere del numero di serie.')),
        h('div', { class: 'man-index' }, PAGES.map((p) => h('button', {
          type: 'button', class: 'man-card', onClick: () => show(p.type),
        }, thumb(p.type, 'man-card__thumb'), h('span', { class: 'man-card__name' }, p.title)))));
    } else {
      const p = PAGES.find((x) => x.type === type);
      fill(body,
        h('div', { class: 'man-page' },
          h('div', { class: 'man-page__head' }, thumb(p.type, 'man-page__thumb'), h('h1', { class: 'man-title' }, p.title)),
          h('p', { class: 'man-desc' }, p.desc),
          ...p.body()));
    }
    el.scrollTop = 0;
  }

  show(null);

  return {
    el,
    update(s) {
      const team = s.teams.find((t) => t.id === s.you.teamId);
      const b = team?.game;
      if (!b) return;
      fill(status, crosses(b.errors, b.maxErrors), lamps(b.solved));
      done.hidden = !team.done;
      if (team.done) fill(done, ending(team));
    },
  };
}
