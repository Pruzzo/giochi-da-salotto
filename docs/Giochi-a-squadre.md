# Giochi a squadre

**Labirinto al buio** e **Disinnesca la bomba** si giocano a squadre di due, con le stesse regole per formare le squadre e scegliere i ruoli. Si accendono dalla console come gli altri giochi.

## Regole comuni dei giochi a squadre

Le squadre sono **sempre da due**: né una persona di più né una di meno. Ognuno dei due ha sul telefono una cosa diversa, quindi per vincere bisogna parlarsi.

### Solo in numero pari

- Nella console il gioco compare come gli altri, con l'etichetta *A squadre · numero pari*.
- In sala d'attesa l'amministratore vede quanti ne mancano (*Siete in 5: serve ancora un giocatore*). Finché i giocatori sono dispari **Via** resta spento.
- Con **Cambia gioco** i giocatori arrivano già dentro dal gioco precedente, così la sala d'attesa sa subito quanti sono.
- **In due** si gioca lo stesso, ma senza punti: c'è una sola squadra e non c'è nessuno da battere. La TV mostra solo com'è andata (es. *Disinnescata con 1:12 di anticipo*) e non si vincono stelline.

### 1. Scelta della squadra

Quando l'amministratore tocca **Via**, ognuno sceglie la sua squadra.

- Le squadre sono tante quante servono: metà dei giocatori (3 squadre con 6 giocatori, 6 con 12). Ogni squadra è un **colore**: Rosso, Blu, Verde, Giallo, Viola, Arancione.
- **Telefono**: i colori sono grossi tasti, ognuno con i nomi di chi c'è già dentro. Tocchi un colore per entrarci. Una squadra con due persone è **piena** e il suo tasto si spegne. Finché non sono tutte piene puoi cambiare: tocchi un altro colore e passi lì.
- **TV**: lo schermo è già diviso in una zona per squadra, col suo colore, e i nomi compaiono appena qualcuno entra. Sopra c'è scritto quanti stanno ancora scegliendo.
- Appena l'ultima squadra è piena, si passa da soli alla schermata successiva. Da lì le squadre non cambiano più per tutta la partita.

### 2. Nome, istruzioni e ruoli

Una schermata sola, sul telefono di ognuno:

- **Nome della squadra.** Lo scrive chi è entrato per primo nella squadra; il compagno vede *Anna sta scegliendo il nome*. Se lo lascia vuoto, la squadra si chiama come il suo colore (*Squadra Blu*). Il nome compare subito sulla TV, nella zona della squadra.
- **Istruzioni brevi.** Poche righe: cosa fa ciascuno dei due ruoli e come si vince. In evidenza, sempre: **«Il tuo compagno non può vedere il tuo schermo: allontanati da lui.»**
- **Scelta del ruolo.** Due tasti, uno per ruolo, ognuno con una riga che dice cosa fa. Quando il compagno ne sceglie uno, quel tasto diventa **grigio** col suo nome sopra, e a te resta l'altro. Finché il turno non parte si può cambiare idea.
- **TV**: per ogni squadra il nome, i due giocatori e il ruolo di ciascuno appena lo scelgono, con un segno di spunta quando la squadra è pronta.
- **Impostazioni del turno**: sul telefono dell'amministratore, sopra il tasto **Via**, ci sono le impostazioni di ogni gioco (quanto è difficile, quanto tempo c'è). Si scelgono **prima di ogni turno** e ripartono da quelle del turno prima, così la difficoltà si può alzare man mano. La TV le mostra a tutti.
- **Partenza**: l'amministratore tocca **Via**. Il tasto si accende solo quando in ogni squadra tutti e due i ruoli sono presi.

### 3. Il gioco e i turni dopo

- Durante il turno la TV è divisa in una zona per squadra, col nome e il colore della squadra.
- **Dal secondo turno i ruoli si scambiano da soli**: chi aveva la bomba prende il manuale, chi aveva le frecce prende la mappa. Prima di ogni turno torna la schermata delle istruzioni, già col nuovo ruolo e senza scelta, così tutti la rileggono. Poi l'amministratore tocca **Via**.
- **Punti e stelline.** I punti della squadra vanno a tutti e due. A fine partita la stellina della serata va a tutti e due i giocatori della squadra vincente (in due, come detto, non si vince niente).

### Chi si disconnette

- **In due**: il gioco si ferma. Il tempo si blocca e la TV scrive *In pausa: Bruno si è disconnesso*. Quando rientra si riparte da dove eravate.
- **In più di due**: il gioco continua per tutti, anche il tempo della sua squadra. Quando rientra, il suo telefono riprende dal punto in cui è la squadra, con lo stesso ruolo.

### Chi arriva a partita iniziata

- Chi entra dopo la scelta delle squadre resta **in attesa** fino alla fine del turno: il suo telefono lo dice, e la TV scrive quanti aspettano (*Un giocatore in attesa*, *2 giocatori in attesa*).
- A fine turno, se quelli in attesa sono **in numero pari**, si torna alla scelta delle squadre: le squadre che ci sono restano come sono, e chi aspettava forma le squadre nuove con colori nuovi. Poi nome, istruzioni e ruoli, come per tutti.
- Se sono **dispari**, l'ultimo arrivato continua ad aspettare e gli altri scelgono la squadra. Con 3 in attesa, i primi due formano una squadra e il terzo aspetta che arrivi qualcun altro.
- Con una sola persona in attesa non cambia niente: si continua con le squadre che ci sono, e la TV lo scrive.

---

## Disinnesca la bomba

Uno dei due ha la bomba in mano e non sa come si smonta, l'altro ha il manuale e non vede la bomba. Si salva solo chi si spiega bene.

È ispirato ai giochi di bombe da disinnescare in coppia, ma in versione corta e in italiano: un'etichetta sola, trenta tipi di modulo con regole di poche righe, e molti giocano su cose italiane (la bandiera, la smorfia, la moka, la briscola, la carbonara). Moduli e manuale sono nostri.

> **Lavori in corso.** I 30 moduli ci sono già, e [qui](https://claude.ai/artifact/St1Fp2vAgn5Vb6Lgef4YpQ) si vedono tutti, sia come li vede l'artificiere sia come li legge l'esperto. Mancano però due cose. La prima è la **difficoltà** del turno: per ora i moduli escono a caso fra tutti e 30, e i punti e l'indice del manuale non dipendono ancora dalla difficoltà. La seconda è la **validazione di tutti i flussi** in una partita vera. I dettagli sono in [Sviluppo](Sviluppo.md#lavori-in-corso-i-30-moduli-di-disinnesca-la-bomba).

**Ruoli**

| | Cosa vede | Cosa fa |
| --- | --- | --- |
| **Artificiere** | Sul telefono: la bomba, un modulo alla volta, e l'etichetta col numero di serie. | Descrive quello che vede, taglia, sposta, preme. |
| **Esperto** | Sul telefono: il manuale, una pagina per modulo. | Fa domande, trova la regola giusta e dice cosa fare. |
| **TV** | Per ogni squadra: gli errori e quali moduli sono risolti. Mai la bomba. In alto il tempo, uguale per tutti. | |

**La bomba**

- Ha da 3 a 5 **moduli**, tutti di tipo diverso. Ogni modulo ha una lucina: si accende di verde quando è risolto.
- I tipi di modulo sono **trenta**, dieci per ogni **complessità**: 1 (si guarda e si risponde), 2 (regole in ordine o un conto) e 3 (più condizioni, conti a più passaggi, o regole che ricordano cosa si è fatto prima). Quali escono dipende dalla **difficoltà** del turno:

  | Difficoltà | Moduli che possono uscire |
  | --- | --- |
  | Facile | solo complessità 1 |
  | Medio | complessità 1 e 2, almeno uno di complessità 2 |
  | Difficile | complessità 2 e 3, almeno uno di complessità 3 |
- Sul telefono dell'artificiere in alto c'è una fila di quadratini, uno per modulo: si tocca un quadratino per aprire quel modulo. Sotto c'è sempre l'**etichetta** col numero di serie.
- Il **numero di serie** è sempre fatto così: due lettere, una cifra, trattino, due cifre, una lettera (es. `RT4-82K`). Non ci sono mai la lettera O, che si confonderebbe con lo zero (scritto barrato), e la Z, che si confonderebbe col 2. Quindi ha sempre **tre lettere** e **tre cifre**. L'*ultima cifra* è quella prima della lettera finale (nell'esempio, 2). Molte regole lo usano: l'esperto dovrà chiederlo.
- **Uno diverso per ogni squadra**, e una bomba nuova a ogni turno. Tutte le bombe di un turno hanno lo stesso numero di moduli e la stessa difficoltà.

**Errori e fine**

- Ogni azione sbagliata è un **errore**: il telefono dell'artificiere vibra e lampeggia di rosso, la TV segna una crocetta nella zona della squadra.
- Al **terzo errore** la bomba scoppia. Scoppia anche allo scadere del tempo.
- La bomba è **disinnescata** quando tutti i moduli hanno la lucina verde.
- Il turno finisce quando tutte le squadre hanno disinnescato o sono scoppiate, quando scade il tempo, o quando l'amministratore lo ferma.

**Come si gioca**

1. **Prima di ogni turno** l'amministratore sceglie la **difficoltà** (Facile, Medio, Difficile; si parte da Medio), quanti moduli ha la bomba (3, 4 o 5) e quanto tempo c'è (da 3 a 8 minuti), come nelle [regole comuni](#2-nome-istruzioni-e-ruoli).
2. Formate le squadre e scelti i ruoli (vedi le [regole comuni](#regole-comuni-dei-giochi-a-squadre)), l'amministratore tocca **Via**. Tutte le squadre partono insieme.
3. L'artificiere apre un modulo e lo descrive. L'esperto cerca la pagina giusta e lo guida. I moduli si risolvono in qualunque ordine.

**Punti**: la squadra che disinnesca prende 10 punti a Facile, 15 a Medio e 20 a Difficile, più 1 ogni 10 secondi rimasti, meno 2 per ogni errore (minimo 1). La prima squadra a disinnescare prende 3 punti in più. Chi scoppia prende 0. In due non si tengono i punti.

### Il manuale

Questo è il testo che l'esperto ha sul telefono. La prima pagina è un **indice** con il disegno di ogni modulo, così l'esperto riconosce il modulo da come lo descrive l'artificiere e apre la pagina giusta. L'indice mostra solo i moduli che possono uscire con la difficoltà del turno: 10 a Facile, 20 a Medio e a Difficile, divisi per complessità.

Quando una regola parla di **vocali** intende A, E, I, O, U tra le lettere del numero di serie.

### Moduli di complessità 1

Si guarda, si cerca nella tabella e si risponde.

#### Lampadine

*Quattro lampadine numerate da 1 a 4, ognuna accesa o spenta (si toccano per cambiarle), e un tasto Conferma.*

1. Accendi le lampadine il cui numero compare tra le **cifre del numero di serie**, e spegni le altre.
2. Se nessuna cifra va da 1 a 4, accendi **solo la 4**.

Esempio: `RT4-82K` → cifre 4, 8, 2 → accese la **2** e la **4**. Poi premi **Conferma**.

#### Moka

*Una moka sul fornello con un manometro: la lancetta sta nella zona verde, gialla o rossa. Tre tasti: Alza la fiamma, Abbassa, Spegni. Si risolve in tre passi.*

| Lancetta | Cosa fare |
| --- | --- |
| Verde | **Alza la fiamma** |
| Gialla | ultima cifra pari: **Abbassa**; dispari: **Spegni** |
| Rossa | **Spegni** |

Un tasto sbagliato è un errore, e la lancetta si sposta.

#### Tombola

*Uno schermino con un disegno e quattro tasti con un numero ciascuno. Si risolve in tre passi.*

È la smorfia: premi il numero del disegno.

| Disegno | Numero | | Disegno | Numero |
| --- | --- | --- | --- | --- |
| L'Italia | 1 | | I topi | 11 |
| La bambina | 2 | | I soldati | 12 |
| La gatta | 3 | | La risata | 19 |
| Il maiale | 4 | | La festa | 20 |
| La mano | 5 | | La testa | 34 |
| | | | La paura | 90 |

Il numero giusto c'è sempre tra i quattro tasti. Un tasto sbagliato è un errore, e arriva un disegno nuovo.

#### Gelato

*Un cono con una pallina di gelato e quattro tasti con il nome di un gusto. Si risolve in tre passi.*

Premi il gusto della pallina:

| Pallina | Gusto |
| --- | --- |
| marrone | Cioccolato |
| rosa | Fragola |
| gialla | Limone |
| verde | Pistacchio |
| bianca | Fiordilatte |
| bianca con le **gocce di cioccolato** | Stracciatella |
| azzurra | Puffo |
| nera | Liquirizia |
| arancione | Pesca |

Il gusto giusto c'è sempre tra i quattro tasti. Un tasto sbagliato è un errore, e arriva un gelato nuovo.

#### Dado

*Un dado, bianco o rosso, che mostra una faccia, e sei tasti da 1 a 6. Si risolve in tre lanci.*

| Dado | Cosa premere |
| --- | --- |
| Bianco | la **faccia opposta**: 7 meno il numero (1 → 6, 2 → 5, 3 → 4…) |
| Rosso | il **numero dopo** (1 → 2, 2 → 3… e 6 → 1) |

Se nel numero di serie c'è una **vocale**, i colori si scambiano: il dado bianco va trattato come rosso e il rosso come bianco.

Un tasto sbagliato è un errore, e il dado si rilancia.

#### Semaforo

*Tre luci in alto (rossa, gialla, verde) e sotto tre tasti degli stessi colori. Si risolve in tre passi: a ogni passo si accende una luce.*

Guarda se nel numero di serie c'è almeno una **vocale**, poi premi il tasto indicato:

| Si accende | Con vocale | Senza vocale |
| --- | --- | --- |
| Rossa | premi Verde | premi Giallo |
| Gialla | premi Rosso | premi Verde |
| Verde | premi Giallo | premi Rosso |

Dopo tre passi giusti il semaforo è risolto. Un tasto sbagliato è un errore, e quel passo ricomincia con una luce nuova.

#### Pizza

*Una pizza vista dall'alto con sopra gli ingredienti, e quattro tasti con il nome di una pizza. Si risolve in tre passi.*

Premi il nome della pizza:

| Sulla pizza | Premi |
| --- | --- |
| pomodoro, mozzarella, basilico | Margherita |
| pomodoro, aglio, origano, **niente mozzarella** | Marinara |
| pomodoro, mozzarella, salame piccante | Diavola |
| pomodoro, mozzarella, funghi | Funghi |
| pomodoro, mozzarella, acciughe, capperi | Napoli |
| pomodoro, mozzarella, prosciutto, funghi, carciofi, olive | Capricciosa |
| mozzarella, patate, **niente pomodoro** | Patate |
| quattro formaggi diversi, **niente pomodoro** | Quattro formaggi |

Il nome giusto c'è sempre tra i quattro tasti. Un tasto sbagliato è un errore, e arriva una pizza nuova.

#### Termometro

*Un termometro con la temperatura scritta sotto, in gradi, e quattro tasti: Cappotto, Maglione, Maglietta, Costume. Si risolve in tre passi.*

| Temperatura | Premi |
| --- | --- |
| sotto i 5 gradi (anche sotto zero) | Cappotto |
| da 5 a 14 | Maglione |
| da 15 a 24 | Maglietta |
| 25 o più | Costume |

Un tasto sbagliato è un errore, e la temperatura cambia.

#### Cartello

*Un cartello stradale e quattro tasti: Fermati, Rallenta, Avanti, Clacson. Si risolve in tre passi.*

Il disegno dentro il cartello non conta: contano **forma e colore**.

| Cartello | Premi |
| --- | --- |
| ottagono rosso | Fermati |
| cerchio rosso, o bianco col bordo rosso | Fermati |
| triangolo con la punta in giù | Rallenta |
| triangolo con la punta in su | Clacson |
| cerchio blu | Avanti |
| quadrato blu | Avanti |
| rombo giallo | Clacson |

Un tasto sbagliato è un errore, e arriva un cartello nuovo.

#### Orologio

*Un orologio con le lancette e quattro tasti con un orario scritto in cifre. Si risolve in tre passi.*

La lancetta corta segna l'ora, la lunga i minuti. Guarda l'**ultima cifra** del numero di serie e premi l'orario che l'orologio segnerà dopo:

| Ultima cifra | Premi l'ora di |
| --- | --- |
| 0, 1, 2 | **un quarto d'ora** dopo |
| 3, 4, 5 | **mezz'ora** dopo |
| 6, 7 | **tre quarti d'ora** dopo |
| 8, 9 | **un'ora** dopo |

Esempio: l'orologio segna le 3 e 50 e l'ultima cifra è 4 → mezz'ora dopo → premi **4:20**. I minuti sono sempre multipli di 5 e gli orari vanno da 1:00 a 12:55: dopo le 12 si ricomincia dall'1 (12:50 più mezz'ora fa 1:20).

Un tasto sbagliato è un errore, e l'orologio cambia ora.

### Moduli di complessità 2

Regole da leggere in ordine, o un conto col numero di serie.

#### Fili

*Da 3 a 6 fili orizzontali, uno sotto l'altro. Colori: rosso, blu, giallo, bianco, nero. Se ne taglia uno solo.*

I fili si contano dall'alto. Leggi le regole in ordine e fermati alla prima che vale:

1. Ci sono **2 o più fili rossi**: taglia l'**ultimo rosso**.
2. C'è almeno un **filo giallo** e l'**ultima cifra** del numero di serie è **pari**: taglia il **primo giallo**.
3. Il **primo filo è nero**: taglia il **secondo filo**.
4. Ci sono **più fili blu che bianchi**: taglia l'**ultimo filo**.
5. Altrimenti: taglia il **filo di mezzo** (con un numero pari di fili, il più alto dei due di mezzo).

#### Bandiera

*Una bandiera con tre strisce verticali. Colori possibili: rosso, giallo, verde, blu, bianco, nero. Le tre strisce non sono mai tutte dello stesso colore. Si tocca una striscia sola.*

Leggi le regole in ordine e fermati alla prima che vale:

1. È la **bandiera italiana** (verde, bianco, rosso, da sinistra): tocca la **bianca**.
2. **Due strisce hanno lo stesso colore**: tocca quella **diversa**.
3. La striscia di **mezzo è rossa**: tocca quella **a sinistra**.
4. Altrimenti tocca la striscia col colore che viene **prima** in questo elenco: rosso, giallo, verde, blu, bianco, nero.

#### Leve

*Cinque leve in fila, ognuna su o giù, e un tasto Conferma.*

Guarda la **prima lettera** del numero di serie e metti le leve così, da sinistra a destra, poi premi **Conferma**:

| Prima lettera | Leve |
| --- | --- |
| A – E | su · giù · su · giù · su |
| F – J | giù · giù · su · su · giù |
| K – O | su · su · giù · giù · su |
| P – T | giù · su · su · giù · giù |
| U – Z | su · giù · giù · su · su |

Se nel numero di serie c'è uno **zero**, la leva di mezzo va al contrario.

#### Lucchetto

*Un lucchetto colorato (rosso, blu o verde) con tre rotelle di lettere, ognuna con le frecce su e giù, e un tasto Apri.*

Le rotelle vanno sulle **tre lettere del numero di serie**:

| Lucchetto | Ordine delle lettere |
| --- | --- |
| Rosso | come compaiono nel numero di serie |
| Blu | al contrario |
| Verde | in ordine alfabetico |

Esempio: `RT4-82K` col lucchetto verde → **K R T**. Poi premi **Apri**.

#### Parola

*Uno schermino con una parola e sotto quattro tasti, ognuno con una parola. Si risolve in tre passi.*

Le parole si somigliano apposta: **fatti fare lo spelling**. Trova la parola dello schermino e premi il tasto con la parola accanto:

| Sullo schermino | Premi |
| --- | --- |
| CASA | CASCO |
| CASSA | COSA |
| CAUSA | CASA |
| COSA | CASTA |
| CASO | CAUSA |
| CASE | CASSA |
| CASTA | CASO |
| CASCO | CASE |

La parola da premere c'è sempre tra i quattro tasti. Dopo tre passi giusti il modulo è risolto. Un tasto sbagliato è un errore, e quel passo ricomincia con parole nuove.

#### Cassaforte

*Un tastierino da 0 a 9, i tasti Cancella e Apri, e uno schermino per quattro cifre.*

Il codice ha quattro cifre:

1. le **tre cifre del numero di serie**, nell'ordine in cui compaiono;
2. poi l'**ultima cifra della loro somma**.

Esempio: `RT4-82K` → 4, 8, 2 → somma 14 → **4824**. Scrivilo e premi **Apri**.

#### Scontrino

*Uno scontrino con tre prezzi in euro, senza centesimi, e accanto una banconota da 10, 20 o 50 euro. Sotto un tastierino da 0 a 9, i tasti Cancella e Paga, e uno schermino.*

1. Somma i tre prezzi: è il **totale**.
2. Se nel numero di serie c'è una **vocale**, c'è lo sconto: togli **2 euro** dal totale.
3. Scrivi il **resto**, cioè la banconota meno il totale, e premi **Paga**.

Esempio: prezzi 4, 7 e 3, banconota da 20, nessuna vocale → totale 14 → scrivi **6**. Il totale non supera mai la banconota.

#### Telefono

*Uno schermino con il nome di chi chiamare, un tastierino da 0 a 9 e i tasti Cancella e Chiama.*

Cerca il nome nella rubrica:

| Nome | Numero | | Nome | Numero |
| --- | --- | --- | --- | --- |
| Nonna Pina | 427 | | Mamma | 125 |
| Nonno Gino | 913 | | Papà | 842 |
| Zia Rosa | 358 | | Il dottore | 609 |
| Zio Tano | 760 | | La pizzeria | 271 |
| Zia Tina | 394 | | Il vigile | 534 |

Se l'**ultima cifra** del numero di serie è **dispari**, componi il numero **al contrario** (427 → 724). Poi premi **Chiama**.

#### Tavolozza

*Due macchie di colore e quattro tasti colorati. Si risolve in tre passi.*

Leggi le regole in ordine e fermati alla prima che vale:

1. Le due macchie sono **dello stesso colore**: premi **quel colore**.
2. Le due macchie sono in questa tabella: premi il colore che fanno insieme.

   | Macchie | Premi |
   | --- | --- |
   | rosso e giallo | arancione |
   | giallo e blu | verde |
   | rosso e blu | viola |
   | bianco e nero | grigio |
   | bianco e rosso | rosa |
   | rosso e verde | marrone |

3. Altrimenti premi il **nero**.

Un tasto sbagliato è un errore, e arrivano macchie nuove.

#### Ingranaggi

*Da 3 a 6 ingranaggi in fila, da sinistra a destra. Sul primo una freccia dice in che verso gira. Due tasti: ↻ (orario) e ↺ (antiorario).*

1. Due ingranaggi che **si toccano** girano al **contrario** l'uno dell'altro.
2. Due ingranaggi uniti da una **cinghia** (una striscia nera: non si toccano) girano **nello stesso verso**.
3. Un ingranaggio **rosso** è rotto: lì la catena si ferma.

Premi il verso dell'**ultimo ingranaggio che gira**: quello più a destra, oppure, se c'è un ingranaggio rosso, quello subito prima del rosso.

### Moduli di complessità 3

Più condizioni insieme, conti a più passaggi, o regole che dipendono da cosa si è fatto prima.

#### Briscola

*In alto la briscola (un seme). Al centro la carta giocata dall'avversario. In basso le tue tre carte: si tocca quella da giocare. Si risolve in tre mani.*

Le carte hanno un seme (coppe, denari, spade, bastoni) e un numero da 1 a 10: l'8 è il Fante, il 9 il Cavallo, il 10 il Re. Dalla più forte alla più debole:

**Asso (1) · Tre · Re (10) · Cavallo (9) · Fante (8) · 7 · 6 · 5 · 4 · 2**

Una carta **prende** se è dello stesso seme di quella giocata ed è più forte, oppure se è una briscola e quella giocata no. Leggi le regole in ordine e fermati alla prima che vale:

1. Puoi prendere con una carta **dello stesso seme** di quella giocata: gioca la **più debole** che prende.
2. La carta giocata è un **Asso** o un **Tre** e hai una briscola: gioca la **briscola più debole**.
3. Altrimenti gioca la carta **più debole** che non è briscola. Se hai solo briscole, la più debole.

Un tocco sbagliato è un errore, e si gioca una mano nuova.

#### Cifrario

*Uno schermino con una parola segreta di cinque lettere, sotto cinque rotelle di lettere con le frecce su e giù, e il tasto Apri.*

Si usa l'alfabeto italiano di 21 lettere: **A B C D E F G H I L M N O P Q R S T U V Z** (niente J, K, W, X, Y).

1. Lo **spostamento** è l'**ultima cifra** del numero di serie. Se è 0, lo spostamento è 10.
2. Ogni lettera della parola segreta va **indietro** di tanti posti quanto lo spostamento. Prima della A si ricomincia dalla Z.
3. Metti le rotelle sulla parola che viene fuori e premi **Apri**.

Esempio: spostamento 2, parola segreta **VTGPQ** → V torna a T, T a R, G a E, P a N, Q a O → **TRENO**. La parola giusta è sempre una di queste, così l'esperto può controllare:

PIANO · TRENO · VESPA · LIBRO · PORTA · SCALA · MONTE · FIUME · GATTO · SEDIA · CARTA · NOTTE

#### Barista

*Uno schermino con l'ora e quello che chiede il cliente, e quattro tasti con cose da bar. Si risolve in tre clienti.*

Leggi le regole in ordine e fermati alla prima che vale:

1. Chiede un **cappuccino** e sono le **11 o più tardi**: servi un **caffè**. Il cappuccino si beve la mattina.
2. Chiede uno **spritz** e sono **prima delle 17**: servi una **spremuta**.
3. Chiede **la stessa cosa** che hai **servito** al cliente prima: servi un'**acqua**.
4. Altrimenti servi **quello che chiede**.

Le cose da bar sono: caffè, cappuccino, spremuta, spritz, acqua, cornetto. Al primo cliente la regola 3 non vale. Un tasto sbagliato è un errore, e arriva un cliente nuovo: il "cliente prima" resta l'ultimo servito bene.

#### Schedina

*Quattro partite, una per riga, ognuna con due città: a sinistra chi gioca in casa. Accanto a ogni riga tre tasti: 1, X, 2. Sotto il tasto Gioca.*

Per ogni riga leggi le regole in ordine e fermati alla prima che vale:

1. Le due città **cominciano con la stessa lettera**: **X**.
2. Una delle due è **Roma**: vince Roma.
3. Vince la città col nome **più lungo**.
4. I nomi sono lunghi uguali: **X**.

Vince la città in casa: **1**. Vince quella fuori: **2**. Infine, se l'**ultima cifra** del numero di serie è **dispari**, nella **terza riga** scambia 1 e 2. Poi premi **Gioca**.

#### Anagramma

*Cinque tessere in fila, ognuna con una lettera, in disordine. Si toccano una alla volta.*

1. Le lettere sono quelle di una di queste parole: CAMPO · FORNO · GRANO · TIGRE · SPADA · BURRO · PESCA · LAMPO · CUORE · DENTE · SALTO · FUNGO.
2. Tocca le tessere nell'**ordine della parola**.
3. Se nel numero di serie c'è una **vocale**, toccale invece **dalla fine**: la parola al contrario.

Le lettere doppie (FORNO, BURRO…) si toccano in un ordine qualsiasi tra loro. Ogni tessera toccata mostra il suo numero d'ordine; alla quinta il modulo controlla. Se l'ordine è sbagliato è un errore, e si ricomincia dalla prima.

#### Ascensore

*Una pulsantiera con i piani da 0 a 6 e uno schermino con una chiamata: un piano e una freccia, su o giù. Si risolve in quattro chiamate.*

Per ogni chiamata leggi le regole in ordine e fermati alla prima che vale:

1. È la **prima** chiamata: premi il **piano della chiamata**.
2. Il piano della chiamata è **quello che hai premuto prima**: premi lo **0**.
3. Freccia **su**: premi il piano **sopra** quello che hai premuto prima. Freccia **giù**: il piano **sotto**.
4. Se così finiresti sopra il 6 o sotto lo 0, premi invece il **piano della chiamata**.

Un tasto sbagliato è un errore, e arriva una chiamata nuova: "quello che hai premuto prima" resta l'ultimo piano giusto.

#### Bilancia

*Una bilancia a due piatti. A sinistra ci sono dei pesi con scritto quanti chili, il piatto di destra è vuoto. Sotto, cinque pesi: 1, 2, 3, 5 e 10 chili. Si toccano per metterli a destra o toglierli, poi si preme Pesa.*

1. Somma i pesi di sinistra.
2. Se nel numero di serie c'è una **vocale**, la bilancia è **truccata**: aggiungi 1 chilo.
3. Metti a destra i pesi che fanno **esattamente** quel numero, usando **meno pesi possibile**, e premi **Pesa**.

#### Stazione

*Il tabellone delle partenze con un treno: destinazione, ora di partenza e ritardo. Sotto, sei tasti con i binari da 1 a 6. Si risolve in tre treni.*

1. Trova il binario della destinazione:

   | Destinazione | Binario |
   | --- | --- |
   | Milano, Torino | 1 |
   | Venezia, Trieste | 2 |
   | Bologna, Firenze | 3 |
   | Roma, Napoli | 4 |
   | Bari, Lecce | 5 |
   | Palermo, Genova | 6 |

2. Il treno ha **più di 10 minuti** di ritardo: vai al binario **dopo** (dopo il 6 viene l'1).
3. Poi, se il treno parte **dalle 18 in poi** e nel numero di serie c'è una **vocale**, vai al binario **prima** (prima dell'1 viene il 6).

Premi il binario. Un tasto sbagliato è un errore, e arriva un treno nuovo.

#### Quadro elettrico

*Cinque interruttori in fila, ognuno rosso o blu, con sopra una spia accesa o spenta. Si toccano per metterli su o giù; sotto il tasto Conferma.*

Metti ogni interruttore come dice la tabella:

| Interruttore | Spia accesa | Spia spenta |
| --- | --- | --- |
| Rosso | giù | su |
| Blu | su se l'ultima cifra è pari, giù se è dispari | giù |

Se nel numero di serie c'è una **vocale**, il **terzo** interruttore va al **contrario** di quello che dice la tabella. Poi premi **Conferma**. Le spie non cambiano quando muovi gli interruttori.

#### Ricetta

*Uno schermino con il nome di un primo piatto, sei tasti con un ingrediente ciascuno, e sotto la pentola con i tasti Svuota e Servi. Si toccano gli ingredienti giusti nell'ordine giusto, poi si preme Servi. Si risolve in due piatti.*

| Piatto | Ingredienti, in ordine |
| --- | --- |
| Carbonara | guanciale, uova, pecorino, pepe |
| Amatriciana | guanciale, pomodoro, pecorino |
| Gricia | guanciale, pecorino, pepe |
| Cacio e pepe | pecorino, pepe |
| Aglio, olio e peperoncino | aglio, olio, peperoncino |
| Pesto | basilico, aglio, pinoli, olio, parmigiano |
| Al pomodoro | olio, pomodoro, basilico |

Se nel numero di serie c'è una **vocale**, al posto del **pecorino** va il **parmigiano**. La **panna** non va mai. Un piatto servito sbagliato è un errore, e arriva un piatto nuovo. Prima di servire, Svuota toglie tutto dalla pentola.

**Da provare giocando**

- Il manuale resta uguale in tutte le partite: con trenta moduli ci vuole parecchio a impararlo. Se diventa comunque troppo facile, si aggiunge un livello col manuale che cambia a ogni partita.
- La complessità di ogni modulo è una stima: se giocando un modulo risulta più facile o più difficile del previsto, si sposta di livello o si sistema la sua pagina.
- Alcuni moduli facili si risolvono anche senza manuale da chi conosce la cosa (le pizze, il termometro): va bene così. Quelli di complessità 3 hanno sempre una regola che non si indovina (nella briscola l'Asso e il Tre, nella ricetta il parmigiano al posto del pecorino).

---

## Labirinto al buio

Uno dei due cammina al buio in un labirinto pieno di bombe, con una torcia che illumina solo la casella dove si trova. L'altro ha la mappa, ma la mappa non sta mai ferma e non dice dove si trova l'omino.

**Ruoli**

| | Cosa vede | Cosa fa |
| --- | --- | --- |
| **Esploratore** | Sul telefono: la torcia e quattro frecce. | Muove l'omino e descrive quello che vede. |
| **Navigatore** | Sul telefono: la mappa intera, con muri, decori, bombe e uscita. Non l'omino. | Capisce dov'è l'omino e lo guida a voce fino all'uscita, lontano dalle bombe. |
| **TV** | Il tempo e, per ogni squadra, i passi fatti e le bombe prese. Niente torcia: la TV la vede anche il navigatore. | |

**Il labirinto**

- **Uno diverso per ogni squadra**, così nessuno copia guardando la zona degli altri. Sono tutti della stessa grandezza, con lo stesso numero di bombe e di decori e un percorso per l'uscita di lunghezza simile.
- **Grandezze**: piccolo (7×7 caselle, 3 bombe), medio (9×9, 5 bombe), grande (11×11, 8 bombe).
- **Decori**: alcune caselle sono diverse dalle altre e servono a orientarsi. Possono essere **a tinta unita** (pavimento rosso, verde, blu…) o avere un **simbolo** (stella, luna, chiave, fiore, ancora…). In un labirinto ogni decoro compare una volta sola. Più o meno una casella su sei è decorata.
- **Bombe**: stanno sulle caselle dove si può passare, mai sul percorso obbligato per l'uscita: c'è sempre una strada senza bombe.
- **Uscita**: una porta sul muro esterno di una casella del bordo. Si esce da quella casella premendo la freccia verso la porta.
- **Partenza**: l'omino parte sempre su una casella decorata, così l'esploratore ha subito qualcosa da descrivere.

**Cosa vede l'esploratore (la torcia)**

Sul suo telefono, sopra le frecce, vede **solo la sua casella**. Tutto intorno è buio. Vede:

- i **muri** intorno a sé, cioè dove può andare;
- il **decoro** della sua casella, cioè il colore o il simbolo;
- l'**uscita**, quando ci è sopra.

Delle caselle accanto non vede niente, **nemmeno le bombe**: per sapere dove sono deve farselo dire dal navigatore.

Il nord è sempre in alto, e l'esploratore non sa dove sia l'uscita. La torcia sta sul telefono e non sulla TV perché il navigatore, guardando la TV, vedrebbe dov'è l'omino: l'esploratore non deve fargli vedere lo schermo. Il tempo che resta si vede solo sulla TV, non sui telefoni.

**Cosa vede il navigatore (la mappa che si capovolge)**

- Ha la mappa intera, con muri, decori, bombe e uscita. **Non vede l'omino**: capisce dov'è da quello che l'esploratore gli descrive (*"sono su una casella blu, ho un muro sopra e uno a destra"*).
- **Ogni 8 passi dell'esploratore la mappa si capovolge**, in orizzontale (destra e sinistra scambiate) o in verticale (sopra e sotto scambiati). Non viene mai ruotata. Si parte con la mappa dritta; dopo non torna mai dritta e ogni volta cambia, quindi orizzontale e verticale si alternano. Otto pallini sotto la mappa dicono quanti passi mancano alla prossima volta. Il telefono lo scrive sempre in grande (es. *Capovolta in orizzontale*), e un'animazione avvisa quando cambia. Contano solo i passi fatti davvero: i muri non contano, e stando fermi a ragionare la mappa non si muove. Gli 8 passi valgono per tutte le grandezze.
- I simboli dei decori restano sempre dritti, così non tradiscono come è capovolta la mappa: per saperlo bisogna leggere la scritta.
- Il navigatore deve tradurre *"sulla mia mappa vai a destra"* nella direzione vera per l'esploratore.

**Come si gioca**

1. **Prima di ogni turno** l'amministratore sceglie la grandezza del labirinto e quanto tempo c'è (da 3 a 8 minuti), come nelle [regole comuni](#2-nome-istruzioni-e-ruoli).
2. Formate le squadre e scelti i ruoli (vedi le [regole comuni](#regole-comuni-dei-giochi-a-squadre)), l'amministratore tocca **Via**. Tutte le squadre partono insieme, ognuna nel suo labirinto.
3. L'esploratore si muove con le frecce. Contro un muro l'omino non si sposta e trema un attimo, senza penalità.
4. **Su una bomba** l'omino salta in aria e **torna alla partenza**. La bomba scoppiata sparisce, dalla torcia e dalla mappa. Il navigatore deve capire di nuovo dov'è, ma almeno sa che è alla partenza.
5. Il turno della squadra finisce quando l'omino passa dalla porta d'uscita. Le altre squadre continuano fino allo scadere del tempo.
6. A fine turno la TV svela il labirinto di ogni squadra, con la strada fatta e le bombe prese.

**Punti**: chi esce prende 10 punti più 1 ogni 10 secondi rimasti, meno 1 per ogni bomba presa (minimo 1). La prima squadra a uscire prende 3 punti in più. Chi non esce prende 0. In due non si tengono i punti.

**Da provare giocando**

- La mappa si capovolge ogni 8 passi in tutte le grandezze. Se nel labirinto grande risulta troppo facile, si capovolge più spesso.
