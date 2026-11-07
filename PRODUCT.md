# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: Node.js + Express + Socket.IO con client HTML/CSS/JS vanilla senza build step. Scelto perché gira su un PC di casa con `npm start`, e Socket.IO riconnette i telefoni che vanno in standby.

## Users

Amici o famiglia nello stesso salotto, in serata, con una TV e i propri telefoni. Il giocatore scrive parole sotto pressione del tempo. L'amministratore è anche giocatore: avvia i turni e assegna i punti. La TV è lo schermo comune che tutti guardano da lontano.

## Product Purpose

Trasforma il classico "nomi, cose e città" da carta e penna in un gioco da salotto: una ruota estrae la lettera, tutti scrivono in contemporanea sul telefono, poi la correzione diventa un momento collettivo sulla TV. Successo: si gioca senza account, senza spiegazioni e senza contare i punti a mano.

## Positioning

La TV è il tavolo comune e il telefono è il foglietto privato: le parole restano segrete finché il tempo non scade, poi vengono svelate e giudicate davanti a tutti.

## Operating Context

Una console in `/console` sceglie il gioco acceso: tutti lo vedono all'indirizzo principale, e senza gioco acceso compare una pagina d'attesa. Per ora c'è un solo gioco. Una sola partita per server, in rete locale. Si entra da un QR code/indirizzo mostrato sulla TV. Tre ruoli: TV, giocatore, giocatore amministratore. Ciclo: l'admin avvia il turno, la ruota sulla TV gira da sola e sceglie una lettera, i giocatori scrivono fino allo scadere, la TV mostra le parole, l'admin vota dal telefono e la TV si aggiorna in diretta, poi nuovo turno.

## Capabilities and Constraints

- 5 categorie, default Nomi, Cose, Città, Animali, Mestieri; rinominabili dall'admin in lobby.
- Punteggi per parola: 3, 1 o 0. Il gioco evidenzia i doppioni e propone 3 per le uniche e 1 per le uguali; le parole vuote o con iniziale sbagliata partono da 0. L'admin ha l'ultima parola.
- L'admin vota dal telefono, non sulla TV.
- Riconnessione obbligatoria: un telefono in standby non perde posto, parole o punti.
- Lingua: italiano.

## Brand Commitments

Nome: "Nomi, cose e città". Nessun altro asset esistente.

## Product Principles

- Dal divano: tutto ciò che è sulla TV si legge a tre metri.
- Un solo pollice: sul telefono si gioca con una mano, senza zoom e senza perdere il testo.
- La suspense è il prodotto: la ruota e lo svelamento delle parole sono i momenti da guardare insieme.
- L'admin arbitra, non amministra: le decisioni sono rapide e visibili a tutti.

## Accessibility & Inclusion

Target tattili ampi, contrasto alto a distanza, rispetto di `prefers-reduced-motion`.
