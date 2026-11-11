// Il telefono dell'esperto: il manuale. Il testo è quello di docs/Giochi-a-squadre.md, "Il manuale", parola per parola.
// Prima pagina: l'indice col disegno di ogni modulo, diviso per complessità; poi una pagina per modulo.
import { h, fill } from '/js/kit/dom.js';
import { page } from '/js/kit/ui.js';
import { gelato, pizza, roadSign, smorfia, thumb } from './draw.js';
import { PIZZAS } from './data.js';
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
    type: 'gelato', title: 'Gelato',
    desc: 'Un cono con una pallina di gelato e quattro tasti con il nome di un gusto. Si risolve in tre passi.',
    body: () => [
      P('Premi il gusto della pallina:'),
      TABLE(['Pallina', '', 'Gusto'], [
        ['cioccolato', 'marrone', 'Cioccolato'], ['fragola', 'rosa', 'Fragola'], ['limone', 'gialla', 'Limone'],
        ['pistacchio', 'verde', 'Pistacchio'], ['fiordilatte', 'bianca', 'Fiordilatte'],
        ['stracciatella', 'bianca con le **gocce di cioccolato**', 'Stracciatella'], ['puffo', 'azzurra', 'Puffo'],
        ['liquirizia', 'nera', 'Liquirizia'], ['pesca', 'arancione', 'Pesca'],
      ].map(([id, text, name]) => [gelato(id, 'gelato gelato--tiny'), text, h('b', {}, name)]), 'man-table--pics'),
      P('Il gusto giusto c\'è sempre tra i quattro tasti. Un tasto sbagliato è un errore, e arriva un gelato nuovo.'),
    ],
  },
];

// ---------- Le pagine dei moduli nuovi ----------

const TOP_NAMES = {
  pomodoro: 'pomodoro', mozzarella: 'mozzarella', basilico: 'basilico', aglio: 'aglio', origano: 'origano', salame: 'salame piccante',
  funghi: 'funghi', acciughe: 'acciughe', capperi: 'capperi', prosciutto: 'prosciutto', carciofi: 'carciofi', olive: 'olive', patate: 'patate',
};
const pizzaRow = (top) => (top[0] === 'formaggi' ? 'quattro formaggi diversi, **niente pomodoro**'
  : top.map((t) => TOP_NAMES[t]).join(', ') + (top.includes('pomodoro') ? (top.includes('mozzarella') ? '' : ', **niente mozzarella**') : ', **niente pomodoro**'));

PAGES.push(
  {
    type: 'pizza', title: 'Pizza',
    desc: 'Una pizza vista dall\'alto con sopra gli ingredienti, e quattro tasti con il nome di una pizza. Si risolve in tre passi.',
    body: () => [
      P('Premi il nome della pizza:'),
      TABLE(['Sulla pizza', '', 'Premi'], Object.values(PIZZAS).map((p) => [pizza(p.top, 'pizza pizza--tiny'), pizzaRow(p.top), h('b', {}, p.name)]), 'man-table--pics'),
      P('Il nome giusto c\'è sempre tra i quattro tasti. Un tasto sbagliato è un errore, e arriva una pizza nuova.'),
    ],
  },
  {
    type: 'termometro', title: 'Termometro',
    desc: 'Un termometro con la temperatura scritta sotto, in gradi, e quattro tasti: Cappotto, Maglione, Maglietta, Costume. Si risolve in tre passi.',
    body: () => [
      TABLE(['Temperatura', 'Premi'], [
        ['sotto i 5 gradi (anche sotto zero)', '**Cappotto**'], ['da 5 a 14', '**Maglione**'], ['da 15 a 24', '**Maglietta**'], ['25 o più', '**Costume**'],
      ]),
      P('Un tasto sbagliato è un errore, e la temperatura cambia.'),
    ],
  },
  {
    type: 'cartello', title: 'Cartello',
    desc: 'Un cartello stradale e quattro tasti: Fermati, Rallenta, Avanti, Clacson. Si risolve in tre passi.',
    body: () => [
      P('Il disegno dentro il cartello non conta: contano **forma e colore**.'),
      TABLE(['Cartello', '', 'Premi'], [
        ['ottagono', 'ottagono rosso', 'Fermati'], ['cerchio-rosso', 'cerchio rosso, o bianco col bordo rosso', 'Fermati'],
        ['triangolo-giu', 'triangolo con la punta in giù', 'Rallenta'], ['triangolo-su', 'triangolo con la punta in su', 'Clacson'],
        ['cerchio-blu', 'cerchio blu', 'Avanti'], ['quadrato-blu', 'quadrato blu', 'Avanti'], ['rombo', 'rombo giallo', 'Clacson'],
      ].map(([id, text, key]) => [roadSign(id, 'sign sign--tiny'), text, h('b', {}, key)]), 'man-table--pics'),
      P('Un tasto sbagliato è un errore, e arriva un cartello nuovo.'),
    ],
  },
  {
    type: 'orologio', title: 'Orologio',
    desc: 'Un orologio con le lancette e quattro tasti con un orario scritto in cifre. Si risolve in tre passi.',
    body: () => [
      P('La lancetta corta segna l\'ora, la lunga i minuti. Guarda l\'**ultima cifra** del numero di serie e premi l\'orario che l\'orologio segnerà dopo:'),
      TABLE(['Ultima cifra', 'Premi l\'ora di'], [
        ['0, 1, 2', '**un quarto d\'ora** dopo'], ['3, 4, 5', '**mezz\'ora** dopo'], ['6, 7', '**tre quarti d\'ora** dopo'], ['8, 9', '**un\'ora** dopo'],
      ]),
      P('Esempio: l\'orologio segna le 3 e 50 e l\'ultima cifra è 4 → mezz\'ora dopo → premi **4:20**.'),
      P('I minuti sono sempre multipli di 5 e gli orari vanno da 1:00 a 12:55: dopo le 12 si ricomincia dall\'1 (12:50 più mezz\'ora fa 1:20).'),
      P('Un tasto sbagliato è un errore, e l\'orologio cambia ora.'),
    ],
  },
  {
    type: 'scontrino', title: 'Scontrino',
    desc: 'Uno scontrino con tre prezzi in euro, senza centesimi, e accanto una banconota da 10, 20 o 50 euro. Sotto un tastierino da 0 a 9, i tasti Cancella e Paga, e uno schermino.',
    body: () => [
      OL('Somma i tre prezzi: è il **totale**.',
        'Se nel numero di serie c\'è una **vocale**, c\'è lo sconto: togli **2 euro** dal totale.',
        'Scrivi il **resto**, cioè la banconota meno il totale, e premi **Paga**.'),
      P('Esempio: prezzi 4, 7 e 3, banconota da 20, nessuna vocale → totale 14 → scrivi **6**. Il totale non supera mai la banconota.'),
    ],
  },
  {
    type: 'telefono', title: 'Telefono',
    desc: 'Uno schermino con il nome di chi chiamare, un tastierino da 0 a 9 e i tasti Cancella e Chiama.',
    body: () => [
      P('Cerca il nome nella rubrica:'),
      TABLE(['Nome', 'Numero', 'Nome', 'Numero'], [
        ['Nonna Pina', '427', 'Mamma', '125'], ['Nonno Gino', '913', 'Papà', '842'], ['Zia Rosa', '358', 'Il dottore', '609'],
        ['Zio Tano', '760', 'La pizzeria', '271'], ['Zia Tina', '394', 'Il vigile', '534'],
      ], 'man-table--book'),
      P('Se l\'**ultima cifra** del numero di serie è **dispari**, componi il numero **al contrario** (427 → 724). Poi premi **Chiama**.'),
    ],
  },
  {
    type: 'tavolozza', title: 'Tavolozza',
    desc: 'Due macchie di colore e quattro tasti colorati. Si risolve in tre passi.',
    body: () => [
      P('Leggi le regole in ordine e fermati alla prima che vale:'),
      OL('Le due macchie sono **dello stesso colore**: premi **quel colore**.',
        'Le due macchie sono in questa tabella: premi il colore che fanno insieme.',
        'Altrimenti premi il **nero**.'),
      TABLE(['Macchie', 'Premi'], [
        ['rosso e giallo', 'arancione'], ['giallo e blu', 'verde'], ['rosso e blu', 'viola'],
        ['bianco e nero', 'grigio'], ['bianco e rosso', 'rosa'], ['rosso e verde', 'marrone'],
      ]),
      P('Un tasto sbagliato è un errore, e arrivano macchie nuove.'),
    ],
  },
  {
    type: 'ingranaggi', title: 'Ingranaggi',
    desc: 'Da 3 a 6 ingranaggi in fila, da sinistra a destra. Sul primo una freccia dice in che verso gira. Due tasti: ↻ (orario) e ↺ (antiorario).',
    body: () => [
      OL('Due ingranaggi che **si toccano** girano al **contrario** l\'uno dell\'altro.',
        'Due ingranaggi uniti da una **cinghia** (una striscia nera: non si toccano) girano **nello stesso verso**.',
        'Un ingranaggio **rosso** è rotto: lì la catena si ferma.'),
      P('Premi il verso dell\'**ultimo ingranaggio che gira**: quello più a destra, oppure, se c\'è un ingranaggio rosso, quello subito prima del rosso.'),
    ],
  },
  {
    type: 'briscola', title: 'Briscola',
    desc: 'In alto la briscola (un seme). Al centro la carta giocata dall\'avversario. In basso le tue tre carte: si tocca quella da giocare. Si risolve in tre mani.',
    body: () => [
      P('Le carte hanno un seme (coppe, denari, spade, bastoni) e un numero da 1 a 10: l\'8 è il Fante, il 9 il Cavallo, il 10 il Re. Dalla più forte alla più debole:'),
      P('**Asso (1) · Tre · Re (10) · Cavallo (9) · Fante (8) · 7 · 6 · 5 · 4 · 2**'),
      P('Una carta **prende** se è dello stesso seme di quella giocata ed è più forte, oppure se è una briscola e quella giocata no. Leggi le regole in ordine e fermati alla prima che vale:'),
      OL('Puoi prendere con una carta **dello stesso seme** di quella giocata: gioca la **più debole** che prende.',
        'La carta giocata è un **Asso** o un **Tre** e hai una briscola: gioca la **briscola più debole**.',
        'Altrimenti gioca la carta **più debole** che non è briscola. Se hai solo briscole, la più debole.'),
      P('Un tocco sbagliato è un errore, e si gioca una mano nuova.'),
    ],
  },
  {
    type: 'cifrario', title: 'Cifrario',
    desc: 'Uno schermino con una parola segreta di cinque lettere, sotto cinque rotelle di lettere con le frecce su e giù, e il tasto Apri.',
    body: () => [
      P('Si usa l\'alfabeto italiano di 21 lettere: **A B C D E F G H I L M N O P Q R S T U V Z** (niente J, K, W, X, Y).'),
      OL('Lo **spostamento** è l\'**ultima cifra** del numero di serie. Se è 0, lo spostamento è 10.',
        'Ogni lettera della parola segreta va **indietro** di tanti posti quanto lo spostamento. Prima della A si ricomincia dalla Z.',
        'Metti le rotelle sulla parola che viene fuori e premi **Apri**.'),
      P('Esempio: spostamento 2, parola segreta **VTGPQ** → V torna a T, T a R, G a E, P a N, Q a O → **TRENO**. La parola giusta è sempre una di queste:'),
      P('PIANO · TRENO · VESPA · LIBRO · PORTA · SCALA · MONTE · FIUME · GATTO · SEDIA · CARTA · NOTTE'),
    ],
  },
  {
    type: 'barista', title: 'Barista',
    desc: 'Uno schermino con l\'ora e quello che chiede il cliente, e quattro tasti con cose da bar. Si risolve in tre clienti.',
    body: () => [
      P('Leggi le regole in ordine e fermati alla prima che vale:'),
      OL('Chiede un **cappuccino** e sono le **11 o più tardi**: servi un **caffè**. Il cappuccino si beve la mattina.',
        'Chiede uno **spritz** e sono **prima delle 17**: servi una **spremuta**.',
        'Chiede **la stessa cosa** che hai **servito** al cliente prima: servi un\'**acqua**.',
        'Altrimenti servi **quello che chiede**.'),
      P('Al primo cliente la regola 3 non vale. Un tasto sbagliato è un errore, e arriva un cliente nuovo: il "cliente prima" resta l\'ultimo servito bene.'),
    ],
  },
  {
    type: 'schedina', title: 'Schedina',
    desc: 'Quattro partite, una per riga, ognuna con due città: a sinistra chi gioca in casa. Accanto a ogni riga tre tasti: 1, X, 2. Sotto il tasto Gioca.',
    body: () => [
      P('Per ogni riga leggi le regole in ordine e fermati alla prima che vale:'),
      OL('Le due città **cominciano con la stessa lettera**: **X**.', 'Una delle due è **Roma**: vince Roma.',
        'Vince la città col nome **più lungo**.', 'I nomi sono lunghi uguali: **X**.'),
      P('Vince la città in casa: **1**. Vince quella fuori: **2**. Infine, se l\'**ultima cifra** del numero di serie è **dispari**, nella **terza riga** scambia 1 e 2. Poi premi **Gioca**.'),
    ],
  },
  {
    type: 'anagramma', title: 'Anagramma',
    desc: 'Cinque tessere in fila, ognuna con una lettera, in disordine. Si toccano una alla volta.',
    body: () => [
      OL('Le lettere sono quelle di una di queste parole: CAMPO · FORNO · GRANO · TIGRE · SPADA · BURRO · PESCA · LAMPO · CUORE · DENTE · SALTO · FUNGO.',
        'Tocca le tessere nell\'**ordine della parola**.',
        'Se nel numero di serie c\'è una **vocale**, toccale invece **dalla fine**: la parola al contrario.'),
      P('Le lettere doppie (FORNO, BURRO…) si toccano in un ordine qualsiasi tra loro. Ogni tessera toccata mostra il suo numero d\'ordine; alla quinta il modulo controlla. Se l\'ordine è sbagliato è un errore, e si ricomincia dalla prima.'),
    ],
  },
  {
    type: 'ascensore', title: 'Ascensore',
    desc: 'Una pulsantiera con i piani da 0 a 6 e uno schermino con una chiamata: un piano e una freccia, su o giù. Si risolve in quattro chiamate.',
    body: () => [
      P('Per ogni chiamata leggi le regole in ordine e fermati alla prima che vale:'),
      OL('È la **prima** chiamata: premi il **piano della chiamata**.',
        'Il piano della chiamata è **quello che hai premuto prima**: premi lo **0**.',
        'Freccia **su**: premi il piano **sopra** quello che hai premuto prima. Freccia **giù**: il piano **sotto**.',
        'Se così finiresti sopra il 6 o sotto lo 0, premi invece il **piano della chiamata**.'),
      P('Un tasto sbagliato è un errore, e arriva una chiamata nuova: "quello che hai premuto prima" resta l\'ultimo piano giusto.'),
    ],
  },
  {
    type: 'bilancia', title: 'Bilancia',
    desc: 'Una bilancia a due piatti. A sinistra ci sono dei pesi con scritto quanti chili, il piatto di destra è vuoto. Sotto, cinque pesi: 1, 2, 3, 5 e 10 chili. Si toccano per metterli a destra o toglierli, poi si preme Pesa.',
    body: () => [
      OL('Somma i pesi di sinistra.',
        'Se nel numero di serie c\'è una **vocale**, la bilancia è **truccata**: aggiungi 1 chilo.',
        'Metti a destra i pesi che fanno **esattamente** quel numero, usando **meno pesi possibile**, e premi **Pesa**.'),
    ],
  },
  {
    type: 'stazione', title: 'Stazione',
    desc: 'Il tabellone delle partenze con un treno: destinazione, ora di partenza e ritardo. Sotto, sei tasti con i binari da 1 a 6. Si risolve in tre treni.',
    body: () => [
      P('1. Trova il binario della destinazione:'),
      TABLE(['Destinazione', 'Binario'], [
        ['Milano, Torino', '1'], ['Venezia, Trieste', '2'], ['Bologna, Firenze', '3'], ['Roma, Napoli', '4'], ['Bari, Lecce', '5'], ['Palermo, Genova', '6'],
      ]),
      P('2. Il treno ha **più di 10 minuti** di ritardo: vai al binario **dopo** (dopo il 6 viene l\'1).'),
      P('3. Poi, se il treno parte **dalle 18 in poi** e nel numero di serie c\'è una **vocale**, vai al binario **prima** (prima dell\'1 viene il 6).'),
      P('Premi il binario. Un tasto sbagliato è un errore, e arriva un treno nuovo.'),
    ],
  },
  {
    type: 'quadro', title: 'Quadro elettrico',
    desc: 'Cinque interruttori in fila, ognuno rosso o blu, con sopra una spia accesa o spenta. Si toccano per metterli su o giù; sotto il tasto Conferma.',
    body: () => [
      P('Metti ogni interruttore come dice la tabella:'),
      TABLE(['Interruttore', 'Spia accesa', 'Spia spenta'], [
        ['Rosso', 'giù', 'su'], ['Blu', 'su se l\'ultima cifra è pari, giù se è dispari', 'giù'],
      ]),
      P('Se nel numero di serie c\'è una **vocale**, il **terzo** interruttore va al **contrario** di quello che dice la tabella. Poi premi **Conferma**. Le spie non cambiano quando muovi gli interruttori.'),
    ],
  },
  {
    type: 'ricetta', title: 'Ricetta',
    desc: 'Uno schermino con il nome di un primo piatto, sei tasti con un ingrediente ciascuno, e sotto la pentola con i tasti Svuota e Servi. Si toccano gli ingredienti giusti nell\'ordine giusto, poi si preme Servi. Si risolve in due piatti.',
    body: () => [
      TABLE(['Piatto', 'Ingredienti, in ordine'], [
        ['Carbonara', 'guanciale, uova, pecorino, pepe'], ['Amatriciana', 'guanciale, pomodoro, pecorino'], ['Gricia', 'guanciale, pecorino, pepe'],
        ['Cacio e pepe', 'pecorino, pepe'], ['Aglio, olio e peperoncino', 'aglio, olio, peperoncino'],
        ['Pesto', 'basilico, aglio, pinoli, olio, parmigiano'], ['Al pomodoro', 'olio, pomodoro, basilico'],
      ]),
      P('Se nel numero di serie c\'è una **vocale**, al posto del **pecorino** va il **parmigiano**. La **panna** non va mai. Un piatto servito sbagliato è un errore, e arriva un piatto nuovo. Prima di servire, Svuota toglie tutto dalla pentola.'),
    ],
  },
);

/** La complessità di ogni modulo, per l'indice. */
export const LEVELS = {
  lampadine: 1, moka: 1, tombola: 1, gelato: 1, dado: 1, semaforo: 1, pizza: 1, termometro: 1, cartello: 1, orologio: 1,
  fili: 2, bandiera: 2, leve: 2, lucchetto: 2, parola: 2, cassaforte: 2, scontrino: 2, telefono: 2, tavolozza: 2, ingranaggi: 2,
  briscola: 3, cifrario: 3, barista: 3, schedina: 3, anagramma: 3, ascensore: 3, bilancia: 3, stazione: 3, quadro: 3, ricetta: 3,
};

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
        [1, 2, 3].flatMap((level) => [
          h('h2', { class: 'man-level' }, `Complessità ${level}`),
          h('div', { class: 'man-index' }, PAGES.filter((p) => LEVELS[p.type] === level).map((p) => h('button', {
            type: 'button', class: 'man-card', onClick: () => show(p.type),
          }, thumb(p.type, 'man-card__thumb'), h('span', { class: 'man-card__name' }, p.title)))),
        ]));
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
