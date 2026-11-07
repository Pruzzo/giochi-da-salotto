# Console di giochi da salotto

Una piattaforma da usare con una TV e i telefoni. Dalla console si sceglie il gioco e tutti lo vedono all'indirizzo principale. Per ora c'è un solo gioco: **Nomi, cose e città**.

## Avvio

```bash
npm install
npm start
```

Serve Node.js 20 o superiore. Il server stampa tre indirizzi:

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
- `games/nomi-cose-citta/`: regole (`game.js`), collegamento alla console (`index.js`) e client senza build step (`public/`)

### Aggiungere un gioco

Crea una cartella in `games/` che esporta `{ id, title, description, page, publicDir, start }` e aggiungila a `games/index.js`. `start(nsp, { joinUrl, onStatus })` riceve un namespace Socket.IO riservato e restituisce `{ status, destroy }`. La pagina del gioco deve avere `<meta name="platform-game" content="<id>">` e caricare `/js/platform.js`.
