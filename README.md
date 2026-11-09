# Console di giochi da salotto

Una piattaforma da usare con una TV e i telefoni. Dalla console si sceglie il gioco e tutti lo vedono all'indirizzo principale. I giochi sono **Nomi, cose e città**, **Codice segreto**, **L'impiccato** e **Anagrammi**.

## Avvio

```bash
npm install
npm start
```

Serve Node.js 18 o superiore. Il server stampa tre indirizzi:

- **Console:** apri `http://<ip-del-pc>:3000/console` e accendi un gioco.
- **TV:** apri `http://<ip-del-pc>:3000/tv` nel browser della TV o di un PC collegato alla TV.
- **Telefoni:** inquadrano il QR code sulla TV o aprono `http://<ip-del-pc>:3000`. Devono essere sulla stessa rete Wi-Fi del PC.

Le pagine di TV e telefoni si aggiornano da sole quando dalla console si accende o si chiude un gioco. Chiudere un gioco cancella la partita in corso.

La console non ha password: chiunque sia sulla stessa rete può aprirla.

## Come si gioca a Nomi, cose e città

1. Ognuno entra dal telefono con il proprio nome. Uno sceglie il ruolo **Amministratore**: gioca anche lui, in più può rinominare le 5 categorie e scegliere il tempo per turno.
2. L'amministratore tocca **Fai girare la ruota**. La ruota gira da sola sulla TV e sceglie una lettera non ancora uscita.
3. Tutti scrivono una parola per categoria. Le parole restano private fino allo scadere del tempo. Il turno finisce prima se tutti toccano **Ho finito**.
4. La TV mostra le parole di tutti. Il gioco propone i punti: **3** per una parola unica, **1** per un doppione, **0** per una parola vuota o con l'iniziale sbagliata.
5. L'amministratore conferma o cambia i punti dal telefono e la TV si aggiorna in diretta. Poi tocca **Conferma i punti del turno** e fa partire un nuovo turno, oppure chiude la partita.

## Come si gioca a Codice segreto

1. Si entra dal telefono come per l'altro gioco. L'amministratore sceglie tra quanti pastelli si pesca (6 o 8), se il codice può ripetere un colore e quanto dura il turno.
2. L'amministratore tocca **Fai scegliere il codice**. Lo schermo sceglie la sequenza a caso: nessuno la conosce, nemmeno l'amministratore. Sulla TV quattro pastelli si mescolano e uno scarabocchio a biro li copre.
3. Ognuno compone una fila di 4 pastelli sul telefono e tocca **Prova**. Ogni pastello ha anche un numero, così si distingue senza guardare il colore. Per ogni tentativo arrivano i pallini: **●** pastello giusto al posto giusto, **○** pastello giusto ma da spostare. Si hanno 10 tentativi.
4. La TV mostra a tutti i pallini di ognuno, non i pastelli: si vede chi si sta avvicinando senza poter copiare.
5. Il turno finisce quando tutti hanno trovato il codice o finito i tentativi, quando scade il tempo, o quando l'amministratore lo ferma. La TV svela il codice e la fila migliore di ciascuno.
6. Punti: chi trova il codice prende 11 meno i tentativi usati (10 al primo colpo, 1 al decimo), più 2 di premio per il primo a trovarlo. Chi non lo trova prende 0.

## Come si gioca a L'impiccato

1. L'amministratore sceglie parole corte (fino a 7 lettere), lunghe o di ogni lunghezza e il tempo per turno, poi tocca **Fai scegliere la parola**.
2. Lo schermo sceglie una parola e ne scrive la prima e l'ultima lettera, anche dove si ripetono dentro la parola. Le altre sono caselle vuote.
3. Ognuno gioca sul suo telefono toccando le lettere. Ogni lettera sbagliata aggiunge un tratto all'omino: al sesto si è impiccati. Con **So la parola!** si prova la parola intera; se è sbagliata conta come un errore.
4. La TV mostra il tempo e l'omino di ogni giocatore, con quanti errori ha fatto e se ha indovinato e in quanto tempo. Le lettere degli altri restano segrete fino alla fine.
5. Punti per chi indovina: 10, meno 1 per ogni errore, più fino a 5 per la velocità (5 subito, 0 allo scadere). Minimo 1. Chi non indovina o viene impiccato prende 0.

## Come si gioca ad Anagrammi

1. L'amministratore sceglie il tempo per turno e tocca **Fai estrarre le lettere**. Lo schermo estrae 8 lettere, prese da una parola comune e mescolate.
2. Ognuno compone parole sul telefono toccando le tessere (con una tastiera vera si può anche scrivere) e tocca **Scrivi**. Ogni tessera si usa una volta sola, le parole devono avere almeno 3 lettere.
3. Il telefono dice subito se la parola vale: deve essere nel dizionario e usare solo le lettere estratte. Le parole sbagliate non costano nulla.
4. La TV mostra quante parole ha ognuno e quanto è lunga la sua migliore, mai quali.
5. Punti: 3 lettere 1, 4 lettere 2, 5 lettere 3, 6 lettere 5, 7 lettere 8, 8 lettere 12. Una parola trovata solo da te vale doppio; quelle trovate anche da altri sono evidenziate in giallo.
6. Alla fine la TV mostra la parola di partenza, le più lunghe di ognuno e quelle che nessuno ha trovato.

Il dizionario (circa 63.000 parole con plurali, femminili e verbi coniugati) viene da morph-it: fonti, licenze e istruzioni per rigenerarlo sono in `games/anagrammi/data/README.md`.

## Su Android

Al posto del PC può fare da server un telefono o un box Android TV: l'app è in `android/`, istruzioni in `android/README.md`.

## Configurazione

| Variabile | Default | A cosa serve |
| --- | --- | --- |
| `PORT` | `3000` | Porta del server |
| `PUBLIC_URL` | rilevato dalla rete | Indirizzo nel QR code, se quello rilevato non è giusto |

La partita e il gioco acceso vivono in memoria: riavviando il server si riparte dalla console. Un telefono che va in standby ritrova posto, parole e punti.

## Sviluppo

```bash
npm run dev   # riavvia il server a ogni modifica
npm test      # test della logica di gioco
```

- `server/platform.js`: quale gioco è acceso, senza dipendenze di rete
- `server/index.js`: HTTP, WebSocket, QR code e pagine della console
- `public/`: console e pagina d'attesa, più font e colori condivisi
- `games/index.js`: elenco dei giochi disponibili
- `games/shared/`: il tavolo comune (`table.js`: giocatori, amministratore, riconnessione) e il collegamento ai WebSocket (`room.js`)
- `games/nomi-cose-citta/`, `games/codice-segreto/`, `games/impiccato/`, `games/anagrammi/`: regole (`game.js`), collegamento alla console (`index.js`) e client senza build step (`public/`)
- `public/js/kit/`, `public/css/kit.css`: pezzi comuni del client (ingresso, copertina TV, voltapagina, timer, suoni, fine partita)

### Aggiungere un gioco

Crea una cartella in `games/` che esporta `{ id, title, description, page, publicDir, start }` e aggiungila a `games/index.js`. `start(nsp, { joinUrl, onStatus })` riceve un namespace Socket.IO riservato e restituisce `{ status, destroy }`. La pagina del gioco deve avere `<meta name="platform-game" content="<id>">` e caricare `/js/platform.js`.

La strada più corta è copiare `games/codice-segreto/`: le regole estendono `Table` di `games/shared/table.js`, `start` chiama `openRoom` di `games/shared/room.js` con le azioni del gioco, e il client chiama `startClient` di `/js/kit/client.js` con le sue viste di telefono e TV.
