---
name: Nomi, cose e città
description: Il gioco carta e penna da salotto, su un quaderno a quadretti condiviso tra TV e telefoni.
colors:
  ink: "#1b3aa8"
  ink-deep: "#14297a"
  red: "#c6202c"
  red-deep: "#961420"
  marker: "#ffe83f"
  hatch-blue: "#7d9be0"
  hatch-red: "#f0908f"
  hatch-yellow: "#fbdf38"
  paper: "#f4f8fc"
  grid: "#bcd0e6"
  margin-line: "#d3323e"
  pencil: "#4f5660"
  white: "#ffffff"
  crayon-red: "#d7263d"
  crayon-orange: "#f08a24"
  crayon-yellow: "#f6cd1a"
  crayon-green: "#2e9e4f"
  crayon-sky: "#2aa7e0"
  crayon-black: "#3a3d45"
  crayon-brown: "#8a5a2b"
  crayon-pink: "#ec6fb0"
typography:
  display-tv:
    fontFamily: "Playwrite IT, Shantell Sans, cursive"
    fontSize: "calc(var(--q) * 2.8)"
    fontWeight: 400
    lineHeight: 1.6
  title-tv:
    fontFamily: "Playwrite IT, Shantell Sans, cursive"
    fontSize: "calc(var(--q) * 2.15)"
    fontWeight: 400
    lineHeight: 1.5
  headline-tv:
    fontFamily: "Playwrite IT, Shantell Sans, cursive"
    fontSize: "calc(var(--q) * 1.6)"
    fontWeight: 400
    lineHeight: 1.5
  display-phone:
    fontFamily: "Playwrite IT, Shantell Sans, cursive"
    fontSize: "clamp(2rem, 10vw, 3rem)"
    fontWeight: 400
    lineHeight: 1.5
  title-phone:
    fontFamily: "Playwrite IT, Shantell Sans, cursive"
    fontSize: "clamp(1.7rem, 8.4vw, 2.3rem)"
    fontWeight: 400
    lineHeight: 1.5
  headline-phone:
    fontFamily: "Playwrite IT, Shantell Sans, cursive"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1.6
  annotation:
    fontFamily: "Playwrite IT, Shantell Sans, cursive"
    fontSize: ".86rem"
    lineHeight: 1.7
  written-tv:
    fontFamily: "Shantell Sans, Comic Sans MS, system-ui, sans-serif"
    fontSize: "calc(var(--q) * 1.2)"
    fontWeight: 500
    lineHeight: 1.2
  written-phone:
    fontFamily: "Shantell Sans, Comic Sans MS, system-ui, sans-serif"
    fontSize: "1.45rem"
    fontWeight: 600
  body:
    fontFamily: "Shantell Sans, Comic Sans MS, system-ui, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 400
    lineHeight: 1.4
  button:
    fontFamily: "Shantell Sans, Comic Sans MS, system-ui, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 700
  label:
    fontFamily: "Shantell Sans, Comic Sans MS, system-ui, sans-serif"
    fontSize: ".95rem"
    fontWeight: 700
  label-tv:
    fontFamily: "Shantell Sans, Comic Sans MS, system-ui, sans-serif"
    fontSize: "calc(var(--q) * .8)"
    fontWeight: 600
rounded:
  none: "0"
  label: "14px"
  hand: "180px 14px 150px 12px / 12px 150px 14px 180px"
  hand-small: "60px 10px 50px 10px / 10px 50px 10px 60px"
spacing:
  tight: "8px"
  snug: "12px"
  q-cover: "16px"
  q: "24px"
  q-tv: "min(calc(100vh / 27), calc(100vw / 48))"
components:
  button-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.button}"
    rounded: "{rounded.hand}"
    padding: "10px 16px"
    height: "56px"
  button-ink-hover:
    backgroundColor: "{colors.ink-deep}"
  button-ink-done:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
  button-red:
    backgroundColor: "{colors.red}"
    textColor: "{colors.white}"
    typography: "{typography.button}"
    rounded: "{rounded.hand}"
    padding: "10px 16px"
    height: "56px"
  button-red-hover:
    backgroundColor: "{colors.red-deep}"
  button-ghost:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.hand}"
    padding: "10px 16px"
    height: "56px"
  input-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.written-phone}"
    rounded: "{rounded.none}"
    padding: "0 4px"
    height: "54px"
  chip-choice:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.hand-small}"
    height: "48px"
  chip-choice-selected:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.red}"
    rounded: "{rounded.hand-small}"
    height: "48px"
  cover-label:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.label}"
    padding: "22px 20px"
---

# Design System: Nomi, cose e città

## Overview

**Creative North Star: "Il Quaderno a Quadretti"**

Il sistema non imita un quaderno: è il quaderno di una partita vera. La TV è il foglio comune, il telefono è il foglietto coperto col braccio, e ogni elemento dell'interfaccia corrisponde a un gesto che si fa con una penna: scrivere, tratteggiare, sottolineare, evidenziare, cerchiare un voto, voltare pagina. Se un elemento non si potrebbe fare su carta con quattro strumenti da astuccio, non appartiene a questo mondo.

La densità cambia con la distanza. Sulla TV si progetta per il divano: la griglia è di 48 per 27 quadretti e tutto si misura in quadretti, così una stessa pagina si legge uguale a qualunque risoluzione. Sul telefono si progetta per un pollice: colonna unica, righe alte, azione ancorata in basso. La copertina rossa con l'etichetta bianca apre la partita; da lì in poi si sta sulla carta, e ogni cambio di fase è un voltapagina.

Il rifiuto dichiarato è il party game viola e neon: niente gradienti luminosi, niente glow, niente estetica da app di quiz. L'energia viene dalla suspense della ruota e dallo svelamento delle parole, non dalla decorazione.

**Key Characteristics:**
- Carta bianca fredda con quadretti azzurri e margine rosso come superficie di ogni fase di gioco.
- Quattro strumenti con un ruolo fisso: biro blu, penna rossa, matita grigia, evidenziatore giallo.
- Due scritture: mano stampatella dei giocatori e corsivo scolastico italiano della voce che guida e giudica.
- Una sola unità di misura, il quadretto, che sulla TV scala con lo schermo.
- Forme disegnate a mano: bordi irregolari, cerchi aperti, tratteggi, nessuna icona riempita.
- Movimento come scrittura: i contenuti compaiono da sinistra a destra, le fasi cambiano con il voltapagina.

## Colors

Due inchiostri saturi su carta fredda, con il giallo riservato a un solo significato e una copertina rossa a tutto schermo che dà identità alla prima vista.

### Primary
- **Biro Blu** (#1b3aa8): tutto ciò che scrive un giocatore (parole, nomi), bordi e righe della tabella, tratteggi del timer, bottone d'azione del giocatore, contorno della focus ring.
- **Biro Calcata** (#14297a): la voce del quaderno in corsivo (titolo, istruzioni, messaggi grandi), hover del bottone blu, fondo del toast.

### Secondary
- **Penna Rossa** (#c6202c): l'arbitro. Voti cerchiati, note di correzione, somme, cancellature; bottoni degli atti dell'amministratore (far girare la ruota, confermare i punti, nuovo turno); ultimi dieci secondi del timer; errori; fondo della copertina.
- **Rosso Dorso** (#961420): il dorso della copertina, il fondo dietro le pagine durante il voltapagina, hover del bottone rosso, bordo della lancetta della ruota.

### Tertiary
- **Evidenziatore** (#ffe83f): solo i doppioni, passato come una striscia di evidenziatore dietro la parola.
- **Matite della Ruota** (#7d9be0, #f0908f, #fbdf38): i tre tratteggi colorati che si alternano sui settori della ruota. Non escono dalla ruota.

### Neutral
- **Carta Fredda** (#f4f8fc): superficie di pagine, etichette, dock e intestazioni fisse; testo sul bottone blu.
- **Quadretto Azzurro** (#bcd0e6): griglia di fondo a 1px e righe divisorie a 2px tra le voci di una lista. Mai usato per testo.
- **Margine Stampato** (#d3323e): esclusivamente la riga verticale del margine, stampata sulla carta; è più chiaro della penna perché appartiene al foglio, non a chi corregge.
- **Matita** (#4f5660): suggerimenti, nomi dei campi, categorie, voci vuote, voti ancora proposti.
- **Bianco Pieno** (#ffffff): testo su fondi rossi e sul toast.

### Pastelli (solo Codice segreto)
Otto matite colorate sono i pezzi del gioco, non colori dell'interfaccia: rosso, arancione, giallo, verde, azzurro, nero, marrone, rosa (`crayon-*`). Compaiono solo dentro i tondi dei pastelli, sempre con il numero scritto sopra in Biro Calcata e alone di carta, così si riconoscono anche senza distinguere i colori. Il tondo è colorato a pastello: tinta piena attraversata da righe di carta oblique, mai una campitura liscia.

### Named Rules
**The Pastello Rule.** I colori `crayon-*` vivono solo nei tondi dei pastelli di Codice segreto. Non diventano mai sfondi, bordi, testi o accenti dell'interfaccia; il giallo pastello rigato non è l'evidenziatore.

**The Due Penne Rule.** Il blu è di chi gioca, il rosso è di chi giudica. Le parole dei giocatori restano in biro blu anche quando vengono corrette: il rosso arriva sopra di loro come cancellatura, cerchio o nota, mai al posto loro.

**The Evidenziatore Rule.** Il giallo pieno significa una cosa sola: questa parola è un doppione. Il tratteggio giallo della ruota è una matita colorata, ha un altro valore e non comunica nulla.

**The Matita Prima Rule.** Una proposta è a matita, una decisione è a penna. Il voto suggerito dal gioco è grigio e tratteggiato; diventa rosso e continuo solo quando l'amministratore lo conferma.

## Typography

**Display Font:** Playwrite IT (con Shantell Sans, cursive)
**Body Font:** Shantell Sans (con Comic Sans MS, system-ui, sans-serif come solo ripiego tecnico; il font è servito dal progetto)

**Character:** Il corsivo scolastico italiano è la grafia che si impara in prima elementare, e porta l'autorità gentile della maestra; Shantell Sans è la stampatella svelta di chi scrive sul ginocchio. Insieme mettono in scena la partita: chi scrive e chi corregge.

Il contratto di direzione assegnava il corsivo all'arbitro in penna rossa. La build lo estende a tutta la voce che guida: in Biro Calcata quando istruisce, in Penna Rossa quando giudica. Vale la build.

### Hierarchy
- **Display TV** (400, 2.8 quadretti, 1.6): il vincitore a fine partita.
- **Title TV** (400, 2.15 quadretti, 1.5): il titolo sull'etichetta di copertina.
- **Headline TV** (400, 1.6 quadretti, 1.5): cosa sta succedendo durante la ruota; 1.45 quadretti accanto alla lettera in fase di scrittura.
- **Display Phone** (400, clamp(2rem, 10vw, 3rem), 1.5): i messaggi che riempiono il telefono, come "Guarda la TV!".
- **Title Phone** (400, clamp(1.7rem, 8.4vw, 2.3rem), 1.5): il titolo sulla copertina del telefono.
- **Headline Phone** (400, 1.5rem, 1.6): l'intestazione di ogni foglio.
- **Annotation** (.86rem, 1.7): le note a margine dell'arbitro e i ruoli accanto ai nomi, solo sul telefono.
- **Written TV** (500, 1.2 quadretti, 1.2): le parole nella tabella di correzione, che si adattano alla casella; l'elenco delle categorie in scrittura sale a 1.9 quadretti e 600.
- **Written Phone** (600, 1.45rem): quello che il giocatore digita sulle righe. Le liste stanno tra 1.25rem e 1.3rem.
- **Body** (400, 1.05rem, 1.4): testo corrente e note a matita.
- **Button** (700, 1.15rem): etichette dei bottoni.
- **Label** (700, .95rem): la categoria sopra ogni riga di scrittura, in matita.
- **Label TV** (600, .8 quadretti): nomi dei campi, aiuti e intestazioni della tabella (fino a .85 quadretti).

La **lettera del turno** è un disegno, non testo: contorno a biro, carta sopra, tratteggio blu, in Shantell Sans 600 dentro un SVG. Misura 12 quadretti in scrittura, 11 sulla ruota, 2.6 nell'intestazione della correzione, 3.6rem sul telefono.

### Named Rules
**The Corsivo Respira Rule.** Il corsivo su più parole ha interlinea da 1.5 in su: Playwrite IT ha ascendenti e discendenti ampie, e la build le lascia sempre respirare. Interlinea 1 è ammessa solo per la cifra isolata di un voto.

**The Tre Metri Rule.** Sulla TV ogni dimensione del testo si scrive in quadretti, mai in pixel o rem, e l'interfaccia fissa non scende sotto .8 quadretti. Una parola che non entra nella casella si restringe fino al 60% e poi va a capo: sotto quella soglia non si legge dal divano.

## Layout

La griglia è letterale. Il quadretto (`--q`) disegna lo sfondo e dimensiona colonne, righe, gap e testo: gli elementi cadono sulla griglia che si vede. Vale 24px sul telefono, 16px sulla copertina del telefono e min(100vh / 27, 100vw / 48) sulla TV, che quindi è sempre un foglio di 48 per 27 quadretti senza scorrimento.

Il layout non dipende dalla larghezza dello schermo: non ci sono breakpoint. Il ruolo decide la composizione, TV o telefono, e dentro ciascun ruolo le misure sono fluide. Le uniche media query riguardano l'hover reale e il movimento ridotto.

**TV.** Margine di 3 quadretti, poi composizioni diverse per fase, tutte a colonne fisse in quadretti: ruota su 27 quadretti con il testo al fianco; scrittura su tre colonne (13 per la lettera, centro fluido, 15 per i progressi) sotto una fascia timer di 3; correzione a tabella con colonna nomi di 6, cinque colonne parole da 7 (6.4 quando compare il totale) e somme da 3. L'altezza delle righe si ricava dal numero di giocatori, tra 2 e 5 quadretti; da 4 in su la parola sta sopra il voto, sotto i 4 gli sta accanto. La copertina affianca etichetta (27) e QR (12).

**Telefono.** Colonna unica con margine rosso a 1 quadretto, testo da 1.5 quadretti, gap di 1 quadretto fra i blocchi. Il ritmo interno è fatto di 8px e 12px, le righe di scrittura sono alte 4 quadretti con il campo a 2.25. L'azione principale sta nel dock fisso in basso, che rispetta la safe area; lettera e timer restano fissi in alto mentre si scrive. La copertina si ferma a 420px.

## Elevation & Depth

Il sistema è piatto: la carta è carta, e la profondità viene da inchiostro, righe e sovrapposizione. Le ombre esistono solo per i due oggetti fisicamente staccati dal foglio, l'etichetta incollata sulla copertina e la pagina che si volta; tutto il resto, compresi dock, intestazioni fisse e toast, si separa con il colore o una riga a inchiostro.

### Shadow Vocabulary
- **Etichetta incollata** (`box-shadow: 0 0 0 3px var(--paper), 0 0 0 5px var(--ink), 0 8px 18px rgb(70 0 10 / .35)`): bordino di carta, filetto a biro e ombra morbida tinta di rosso. Solo sulle etichette della copertina.
- **Pagina che si volta** (`box-shadow: 18px 0 40px rgb(20 20 60 / .25)`): solo durante il voltapagina, sul lato che si solleva.
- **Alone di carta** (`text-shadow: 0 0 .1em var(--paper), 0 0 .1em var(--paper), 0 0 .16em var(--paper), 0 0 .16em var(--paper)`): non è elevazione ma leggibilità. Stacca dai quadretti le parole, i nomi e le categorie; si toglie sulle parole evidenziate.

### Named Rules
**The Foglio Piatto Rule.** Se non si solleva davvero dalla pagina, non ha ombra. Dock, toast, bottoni e chip restano piatti in ogni stato.

## Shapes

Tre famiglie di forma, ognuna con la sua ragione. Le **forme a mano** dei bottoni e delle scelte usano raggi molto diversi per angolo e producono un rettangolo tracciato a mano libera, sempre irregolare (vedi `rounded.hand` e `rounded.hand-small`). Le **forme di cancelleria** sono oggetti stampati: etichetta con angoli dolcemente curvi (14px), toast (10px), bottoncini degli angoli della TV (6px). Le **forme del foglio** non hanno raggio: righe, campi di scrittura, caselle di spunta, tacche di progresso.

I cerchi sono aperti e sovrapposti alla chiusura, come un voto tracciato in un gesto, e la ruota è costruita con linee leggermente tremolanti da un rumore deterministico, così il tratto resta identico a ogni ridisegno. I riempimenti di quantità sono tratteggi diagonali a -45°, 3px di tratto e 3px di vuoto.

### Named Rules
**The Tratteggio Rule.** Colorare un'area a mano significa tratteggiarla: timer, tacche di avanzamento, settori della ruota, lettera del turno. Una quantità non è mai una campitura piena; il pieno resta a ciò che non misura nulla, come bottoni, copertina e lancetta.

## Components

### Buttons
Grandi, un po' storti, fatti per un pollice che ha fretta.
- **Shape:** rettangolo a mano libera (`rounded.hand`), altezza minima 56px, quasi sempre a tutta larghezza; bordo di 3px anche quando è trasparente, così le varianti hanno la stessa misura.
- **Biro:** l'azione del giocatore (Entra, Ho finito, Avanti). Una volta consegnato si svuota: carta con bordo blu.
- **Penna:** l'atto dell'amministratore (Fai girare la ruota, Conferma i punti, Nuovo turno).
- **Contorno:** l'azione secondaria, carta con bordo blu.
- **Hover / Focus:** l'hover scurisce il fondo solo su dispositivi con hover reale; il contorno ottiene una velatura blu all'8%. Alla pressione il bottone scende di 2px in .12s. Il focus è un anello di 3px in Biro Blu con 2px di stacco, uguale in tutto il sistema.
- **Disabilitato:** opacità .6 con cursore di attesa.
- **Link:** azioni minori come Esci, in rosso sottolineato con 10px di padding per conservare il bersaglio tattile.

### Chips
Le scelte a mano: durata del turno sul telefono e giocatore da correggere.
- **Style:** carta con bordo tratteggiato da 1.5px in matita, forma `rounded.hand-small`, altezza minima 48px, peso 500.
- **State:** la selezione ripassa il bordo a 3px continui in Penna Rossa, con testo rosso a peso 700.

### Cards / Containers
L'unico contenitore è l'etichetta della copertina; sulle pagine i raggruppamenti sono solo righe.
- **Corner Style:** angoli dolcemente curvi (`rounded.label`).
- **Background:** Carta Fredda su copertina rossa.
- **Shadow Strategy:** Etichetta incollata, vedi Elevation & Depth.
- **Internal Padding:** 22px e 20px sul telefono; 1.2 e 1.6 quadretti sulla TV.
- **Campi dell'etichetta:** sulla TV l'etichetta è compilata come quella di un quaderno vero: nome del campo a matita (Materie, Classe), e sotto "Classe" le firme dei giocatori su righe puntinate, che compaiono scrivendosi.

### Inputs / Fields
Una riga di quaderno su cui si scrive, non una scatola.
- **Style:** fondo trasparente, nessun bordo tranne una riga inferiore di 3px in Biro Blu, cursore in Penna Rossa, testo grande.
- **Focus:** la riga diventa rossa e il fondo prende una velatura blu al 6%.
- **Error / Disabled:** in sola lettura la riga diventa tratteggiata; gli avvisi stanno sotto il campo in rosso a peso 600.
- **Caselle di ruolo:** sulla copertina del telefono la scelta del ruolo è una casella da 26px a bordo blu, spuntata con una X in penna rossa.

### Navigation
Non c'è navigazione: la partita ha una sola pagina per fase e il server decide quale. Sulla TV i soli controlli sono i bottoncini suono e schermo intero nell'angolo in basso a sinistra, sul margine, a opacità .55 finché non vengono raggiunti: non devono farsi guardare dal divano.

### Il Voto Cerchiato
La firma dell'arbitro: una cifra in corsivo dentro un cerchio aperto tracciato a mano, 2.1em di lato. A matita con tratteggio finché è proposta, in Penna Rossa continua quando è confermata, con il cerchio che si disegna in .45s nel momento in cui l'admin decide e la TV lo mostra a tutti. Sul telefono i voti 3, 1 e 0 sono bersagli da 48 per 52px con un cerchio tratteggiato tenue; quello scelto si ripassa a penna.

### La Ruota
Il pezzo da guardare insieme: un SVG disegnato a biro con doppia circonferenza tremolante, settori tratteggiati nelle tre Matite della Ruota e lettere su dischetti di carta. Le lettere già uscite perdono il tratteggio e si cancellano con una X rossa; la lancetta è l'unico elemento pieno. Il giro è un'unica animazione calcolata dal seed del server e rallenta con `cubic-bezier(.14, .72, .1, 1)`, così più schermi restano allineati.

### Il Voltapagina
Ogni cambio di fase ruota la pagina vecchia sul dorso di -108° in .85s e scopre la nuova sotto. È l'unica transizione tra schermate. Con `prefers-reduced-motion` la pagina si sostituisce senza movimento e la ruota si ferma direttamente sulla lettera.

### Il Timer
Una striscia alta un quadretto, con anello interno a biro e tacche ogni quadretto, riempita a tratteggio. Negli ultimi dieci secondi tratteggio e cifre passano in Penna Rossa. I secondi hanno peso 800 e cifre tabulari.

### Lo Svelamento
Le righe della correzione si scrivono da sinistra a destra con un clip-path (.7s, una ogni .45s), la classifica finale con lo stesso gesto (una ogni .22s). Sul foglio corretto si tiene traccia delle parole con i segni della scrittura: cancellatura rossa per le parole sbagliate, sottolineatura rossa per chi ha consegnato, sottolineatura ondulata per il vincitore, freccia rossa sul margine per la riga in correzione.

### Il Codice Coperto (Codice segreto)
Quattro caselle quadrate tracciate a biro sul foglio, senza raggio. Per nascondere il codice, sopra ogni casella passano due scarabocchi a zig-zag in Biro Blu (uno per verso), disegnati con `stroke-dashoffset` uno dopo l'altro; sotto, il pastello sparisce. Allo svelamento lo scarabocchio si ritira nello stesso ordine e il pastello riappare. Sulla TV la fila si mescola per due secondi prima di essere coperta: sono pastelli a caso, la TV non conosce il codice.

### I Pallini
La risposta a un tentativo è un quadrato di quattro segni in Penna Rossa: pallino pieno per un pastello giusto al posto giusto, cerchio vuoto per un pastello giusto ma fuori posto, puntino a matita per il resto. Il rosso qui è il giudizio, come nella Due Penne Rule; i pastelli scelti dal giocatore restano suoi.

### La Forca (L'impiccato)
La forca è a matita (`pencil`, tratto 3), l'omino a Penna Rossa (tratto 4): ogni errore è un giudizio e aggiunge un tratto, nell'ordine testa, corpo, braccia, gambe, disegnato con `stroke-dashoffset` in .5s. I tratti già presenti compaiono senza animazione quando la pagina si ridisegna.

### Le Caselle della Parola
Ogni lettera è una casella sopra una riga in Biro Blu; le caselle vuote sono solo la riga. Sulla TV le caselle si tracciano una dopo l'altra (.18s l'una) mentre lo schermo sceglie la parola. Le lettere sbagliate, sul telefono e nella tabella finale, sono cancellate in Penna Rossa; sulla tastiera le lettere già nella parola diventano tratteggiate color quadretto.

### Le Tessere (Anagrammi)
Le lettere estratte sono quadretti grandi bordati in Biro Blu, senza raggio, con la lettera in Shantell Sans 700. Sulla TV girano come un contatore e si fermano una alla volta da sinistra; sul telefono una tessera usata diventa tratteggiata color quadretto finché la parola non è scritta. Una parola trovata anche da altri prende l'evidenziatore giallo, come un doppione di Nomi, cose e città: è lo stesso significato.

## Do's and Don'ts

### Do:
- **Do** misura tutto ciò che è sulla TV in quadretti, testo compreso, partendo da `--q`.
- **Do** fai cadere gli elementi sulla griglia visibile: colonne e righe in multipli interi o semplici del quadretto.
- **Do** tieni le parole dei giocatori in Shantell Sans e Biro Blu, con l'alone di carta quando stanno sui quadretti.
- **Do** usa Playwrite IT per la voce che guida e giudica, a peso 400 e con interlinea di almeno 1.5 sul testo in più parole.
- **Do** mostra lo stato con un segno da astuccio: cerchio, cancellatura, sottolineatura, evidenziatore, tratteggio.
- **Do** tieni i bersagli tattili a 48px o più e l'azione principale nel dock in basso sul telefono.
- **Do** fai comparire i contenuti di gioco scrivendoli da sinistra a destra, con la curva `--out`, e neutralizza ogni movimento con `prefers-reduced-motion`.
- **Do** disegna ogni nuova icona come un SVG a tratto, senza riempimento, con estremità arrotondate e tratto 2 su griglia 24.

### Don't:
- **Don't** usare i pastelli `crayon-*` fuori dai tondi di Codice segreto.
- **Don't** introdurre viola, neon, glow o gradienti luminosi da party game.
- **Don't** usare il giallo pieno per qualcosa che non sia un doppione.
- **Don't** colorare di rosso una parola scritta da un giocatore: il rosso le passa sopra, non la riscrive.
- **Don't** usare il Bottone Penna per un'azione che non spetta all'amministratore.
- **Don't** mettere ombre su ciò che non si solleva dal foglio, nemmeno in hover.
- **Don't** racchiudere i campi di testo in una scatola: sono righe.
- **Don't** riempire timer e barre di avanzamento con una campitura piena.
- **Don't** aggiungere transizioni tra schermate diverse dal voltapagina.
- **Don't** usare un raggio uniforme su bottoni e scelte toccati dal giocatore.
- **Don't** scrivere testi sulla TV in pixel o rem, né farli scendere sotto .8 quadretti nell'interfaccia fissa.
