# Guida di stile

Le regole per far sembrare ogni schermata parte dello stesso prodotto. Valgono per la console, l'ingresso, le sale d'attesa e l'app Android; i giochi le ereditano dai token comuni. Il mondo visivo completo (materiali, colori, componenti dei giochi) è in [`DESIGN.md`](../DESIGN.md).

Lo stile di riferimento è **Kraft**: cartone sotto, cartoncini crema sopra, titoli su nastro Dymo, testo a macchina da scrivere, timbri rossi. Quaderno ed Enigmistica restano selezionabili e seguono le stesse regole di spazio, gerarchia e voce.

## 1. Spazi

Una scala sola, a passi di 4. Sono i token `--s1`…`--s8` in [`public/css/tokens.css`](../public/css/tokens.css); nell'app Android gli stessi valori in `dp`.

| Token | Valore | Dove si usa |
| --- | --- | --- |
| `--s1` | 4 | Tra un titolo e la riga che lo spiega |
| `--s2` | 8 | Tra elementi dello stesso gruppo (due bottoni, due scelte) |
| `--s3` | 12 | Tra schede dello stesso elenco; tra etichetta e contenuto |
| `--s4` | 16 | Margine della pagina sul telefono; padding di una scheda |
| `--s5` | 24 | Tra gruppi diversi dentro la stessa scheda |
| `--s6` | 32 | Tra sezioni sul telefono |
| `--s7` | 48 | Tra sezioni su schermi larghi |
| `--s8` | 64 | Solo respiro attorno a un elemento isolato |

Tre regole bastano:

1. **Vicino vuol dire insieme.** Lo spazio dentro un gruppo è sempre più piccolo di quello attorno al gruppo. Se due cose distano quanto le sezioni, sembrano due sezioni.
2. **Più spazio sopra un titolo che sotto.** Il titolo appartiene a quello che segue.
3. **Niente valori fuori scala.** Se 16 è poco e 24 è troppo, il problema è il raggruppamento, non il numero.

Sulla TV lo spazio si misura in quadretti (`--q`), non in pixel: vedi `DESIGN.md`.

## 2. Gerarchia

Una schermata ha **una** cosa principale. Si riconosce perché è l'unica con quel peso.

| Livello | Token | Aspetto in Kraft | Quante per schermata |
| --- | --- | --- | --- |
| Insegna | — | Nastro Dymo: bianco su nero, maiuscolo, storto di 1° | Una |
| Titolo | `--t-display` 1.75rem | Macchina da scrivere, inchiostro | Una |
| Titolo di scheda | `--t-title` 1.25rem | Macchina da scrivere, inchiostro | Una per scheda |
| Testo | `--t-body` 1rem, interlinea 1.45 | Inchiostro; matita se è di contorno | — |
| Nota | `--t-small` .875rem | Matita | Poche |
| Etichetta | `--t-label` .75rem, maiuscolo, spaziato .08–.12em | Matita | Solo per dati brevi |

- **Un solo comando pieno per schermata**, in basso, largo quanto il pollice. Nero (nastro) per chi gioca, rosso (timbro) per chi arbitra o per un'azione che cancella qualcosa. Tutto il resto è contorno o testo sottolineato.
- **Il rosso è un giudizio, non una decorazione.** Punti, voti, stato «in corso», avvisi. Mai un titolo qualsiasi.
- **Il timbro dice uno stato, mai un comando.** «In corso», «Scelto». Non si tocca.
- **La scheda è un oggetto vero.** Un cartoncino serve quando il contenuto è un oggetto che si può prendere in mano (un gioco, un invito, il segnapunti). Titoli di sezione e scelte di contorno stanno direttamente sul cartone. Mai una scheda dentro una scheda.
- **Le righe misurano al massimo 65–70 caratteri.**

## 3. Presentare le cose

- **Prima la scelta, poi il resto.** Nella console i giochi sono la prima cosa; indirizzi, vittorie e aspetto stanno dopo (a lato, su schermi larghi).
- **Elenchi densi, dettagli a richiesta.** Una scheda di gioco mostra disegno, titolo, una riga e i dati. La spiegazione compare solo quando la si sceglie.
- **Scegliere e confermare sono due gesti.** Toccare una scheda la sceglie; il comando che fa partire qualcosa per tutti sta nella barra in basso e dice cosa succede («Gioca a Anagrammi», «Passa a Anagrammi»).
- **Ogni gioco ha un disegno.** Un pittogramma a tratto su griglia 48, tratto 2, estremità tonde, con un solo dettaglio in rosso. Sono in [`public/js/kit/art.js`](../public/js/kit/art.js); un gioco nuovo ne aggiunge uno.
- **Ombre solo per ciò che è appoggiato.** Un cartoncino sul cartone ha un'ombra corta e calda; quello scelto si solleva e si inclina di mezzo grado. Bottoni, righe e barre restano piatti.
- **Un solo movimento per schermata**, e deve voler dire qualcosa: il timbro che si stampa, la scheda che si apre. Con `prefers-reduced-motion` sparisce.
- **Bersagli tattili da 48px in su**, il comando principale da 56.

## 4. Voce dei testi

Si parla come un amico che spiega il gioco al tavolo, non come un manuale.

1. **Il fatto, non il meccanismo.** L'utente vuole sapere cosa succede, non come funziona la pagina.
2. **Frasi corte. Un'idea per frase.** Due frasi brevi battono una con i due punti.
3. **Il comando dice cosa fa.** Verbo più oggetto: «Chiudi la partita», non «Conferma».
4. **Gli avvisi dicono cosa si perde e cosa resta.**
5. **Niente lessico di scuola fuori dallo stile Quaderno.** Giocatori, categorie, vittorie; non classe, materie, stelline.
6. **Mai rassicurare a vuoto.** Niente «per ora», «da sola», «semplicemente».

| Prima | Dopo |
| --- | --- |
| Scegli il gioco: comparirà a tutti all'indirizzo principale. | Cosa si gioca stasera? |
| Accendi questo gioco | Gioca a Anagrammi |
| La partita in corso verrà cancellata. | I punti di questa partita si perdono. Le vittorie della serata restano. |
| Nessun gioco acceso. Si parte appena qualcuno sceglie il gioco. Questa pagina si aggiorna da sola. | Si comincia tra poco. Il gioco di stasera non è ancora stato scelto. Resta qui: parte da solo. |
| In attesa che Giulia faccia partire il turno. | Giulia dà il via quando ci siete tutti. |
| Il server è spento. Tocca Accendi per giocare. | Server spento. Finché è spento nessuno può entrare a giocare. |
| In classe · Materie | Giocatori · Categorie |

Le descrizioni dei giochi seguono la stessa regola: una riga che fa venire voglia (`tagline`), due frasi di regole (`description`), i dati in etichetta (`meta`). Sono nei file `games/*/index.js`.

## 5. App Android

- **La barra è un nastro Dymo**: nera, con un pallino di stato (verde acceso, giallo in corso, grigio spento) e l'indirizzo da leggere per intero. Nient'altro in fila: quello che serve di rado (condividere, registro, spegnere) sta nel menu.
- **A server spento l'app mostra un cartoncino**, non un testo al centro dello schermo: cosa sta succedendo, una riga di spiegazione, un solo comando. È la pagina `android/app/src/main/assets/shell/index.html`, con gli stessi token del gioco.
- **Durante la partita la barra offre solo il ritorno alla console.**

## Prima di chiudere una schermata

- [ ] Tutti gli spazi vengono dalla scala.
- [ ] C'è un solo comando pieno, e dice cosa fa.
- [ ] Il rosso compare solo dove c'è un giudizio, uno stato o un rischio.
- [ ] Nessuna frase spiega come funziona la pagina.
- [ ] Si legge e si tocca con una mano a 390px di larghezza.
- [ ] Guardata anche negli altri due stili, non si rompe.
