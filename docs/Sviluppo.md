# Sviluppo

Node.js + Express + Socket.IO sul server, HTML, CSS e JavaScript senza build step sul client. Le partite vivono in memoria.

## Avvio in sviluppo

```bash
npm install
npm run dev   # riavvia il server a ogni modifica
npm test      # test della logica di gioco (node --test)
```

## Com'è fatto

```
server/
  index.js          HTTP, WebSocket, QR code, pagine della console
  mdns.js           annuncia il nome game.local nella rete
  platform.js       quale gioco è acceso (senza dipendenze di rete)
  session.js        le vittorie della serata, che restano cambiando gioco
public/             console, pagina d'attesa, font, colori e pezzi comuni del client
  js/kit/           ingresso, copertina TV, voltapagina, timer, suoni, fine partita
games/
  index.js          elenco dei giochi sulla console
  shared/           tavolo comune (giocatori, amministratore, riconnessione), WebSocket, testo
  <gioco>/
    game.js         regole (nessuna dipendenza di rete, testate in test/)
    index.js        collegamento alla console
    public/         client del gioco: viste del telefono e della TV
android/            l'app Android che fa da server (vedi sotto)
docs/               questa guida, con gli screenshot e lo script che li genera
test/               test di regole e piattaforma
```

- `games/shared/table.js`: la classe `Table` da cui partono tutti i giochi. Gestisce chi è seduto, l'amministratore, i nomi doppi e la riconnessione con un token salvato sul telefono.
- `games/shared/room.js`: collega un `Table` a un namespace Socket.IO. Raggruppa gli aggiornamenti dello stesso giro di eventi e manda a ognuno solo la sua vista (`game.view({ role, player })`): le risposte degli altri non escono mai dal server prima del tempo.
- `games/shared/text.js`: accenti e separatori senza `Intl`, perché il Node dell'app Android non ha ICU. Sul server non usare `\p{…}` nelle regex, `normalize()` o `Intl`: lì non funzionano.

## Aggiungere un gioco

1. Crea una cartella in `games/` che esporta `{ id, title, tagline, description, meta, page, publicDir, start }`, aggiungila a `games/index.js` e disegna il suo pittogramma in `public/js/kit/art.js`. Per testi e aspetto segui la [Guida di stile](Guida-di-stile.md).
2. `start(nsp, ctx)` riceve un namespace Socket.IO riservato e restituisce `{ status, destroy }`. Passa tutto `ctx` a `openRoom` (`{ joinUrl, onStatus, session, platform }`): con `session`, quando la fase diventa `'final'` chi ha più punti in `totals()` prende una vittoria della serata; con `platform`, l'amministratore può usare **Cambia gioco** (azione `switchGame`, in sala d'attesa e a fine partita). Nella sala d'attesa del telefono metti `switchGame(state, act)` di `/js/kit/ui.js`.
3. La pagina del gioco deve avere `<meta name="platform-game" content="<id>">` e caricare `/js/platform.js`.

La strada più corta è copiare `games/codice-segreto/`: le regole estendono `Table`, `start` chiama `openRoom` di `games/shared/room.js` con le azioni del gioco, e il client chiama `startClient` di `/js/kit/client.js` con le sue viste di telefono e TV.

### Giochi a squadre

Per un gioco a squadre da due c'è già tutta la parte comune: scelta del colore, nome della squadra, ruoli che si scambiano, impostazioni prima di ogni turno, pausa in due, chi arriva a metà che aspetta la fine del turno.

- Server: le regole estendono `TeamTable` di `games/shared/teams.js` e definiscono `setupTeam`, `teamTimeout`, `teamPoints` e `teamView` (cosa vede ciascuno della squadra). Le azioni chiamano `playingTeam(actor)` e, a squadra finita, `finishTeam(team, outcome)`. `teamActions(game)` dà le azioni comuni da passare a `openRoom`.
- Client: `teamViews(spec)` di `/js/kit/teams.js` dà le pagine di telefono e TV per tutte le fasi; il gioco passa le istruzioni, le impostazioni, il telefono durante il turno e la zona della TV di una squadra. Gli stili comuni sono in `/css/teams.css`.

## Le persone di Piacere!

Le persone sono disegnate dal codice, non da immagini, e ogni turno ne escono di nuove.

- `games/piacere/public/js/cast.js` decide il turno senza toccare il DOM, così lo usano sia il server sia i test. `makeRound(seed, { known, strangers, level })` restituisce le persone (tratti fissi, nome, vestiti della prima e della seconda parte), l'ordine delle presentazioni e la fila della seconda parte. Con lo stesso seme esce sempre lo stesso turno.
  - Due persone conosciute differiscono in almeno 3 tratti tra sesso, capelli, colore dei capelli, barba, occhiali, corporatura, altezza, forma del viso e pelle; a *Difficile* gli sconosciuti ne possono avere solo 2 diversi da una di loro.
  - I nomi di uno stesso turno non cominciano mai con le stesse due lettere.
  - Nella seconda parte cambiano sempre il sopra, il suo colore e il colore del sotto. A *Facile* i vestiti restano gli stessi.
- `games/piacere/public/js/people.js` disegna una persona intera in SVG da tratti e vestiti, nel riquadro 200×420 con i piedi su y=404; l'altezza accorcia o allunga la figura dai piedi. Pelle, capelli e vestiti hanno colori fissi, uguali in tutti gli stili; il contorno usa `--fig-line`.
- Il server non manda mai ai telefoni chi è chi: nella seconda parte ogni telefono riceve solo l'aspetto della persona che ha davanti e l'elenco dei nomi. Il nome di uno sconosciuto arriva nella risposta all'azione, dopo che si è risposto.

## Lavori in corso: i 30 moduli di Disinnesca la bomba

Tutti i 30 moduli descritti nella [guida](Giochi-a-squadre.md#disinnesca-la-bomba) sono scritti: in `games/bomba/modules.js` c'è la logica del server, e ogni modulo ha il suo pannello sul telefono dell'artificiere e la sua pagina nel manuale. Per ognuno, quello che vede l'artificiere e quello che legge l'esperto sono in [questa pagina di revisione](https://claude.ai/artifact/St1Fp2vAgn5Vb6Lgef4YpQ).

Mancano ancora:

- **La difficoltà del turno.** Per ora la bomba pesca i moduli a caso fra tutti e 30. Bisogna fare:
  - l'impostazione Facile/Medio/Difficile, che parte da Medio;
  - il tempo fino a 8 minuti;
  - la scelta dei moduli dalla complessità giusta, con almeno un modulo del livello più alto;
  - i punti base 10/15/20;
  - l'indice del manuale che mostra solo i moduli del turno.
- **La validazione di tutti i flussi.** I test automatici controllano la risposta giusta, le risposte sbagliate e i passi di ogni modulo. Non c'è ancora stata una partita vera con tutti i moduli, con TV e telefoni. In quella partita va verificato, modulo per modulo:
  - che le regole si possano spiegare a voce;
  - che il manuale e il pannello dicano la stessa cosa;
  - che dopo un errore il modulo riparta bene;
  - che i moduli che ricordano le mosse fatte prima (Barista, Ascensore) funzionino in tutti i casi.

## L'app Android

In `android/`: un'app Java che contiene Node.js ([nodejs-mobile](https://github.com/nodejs-mobile/nodejs-mobile) 18) e fa girare `server/index.js` così com'è. Istruzioni di compilazione, firma e struttura in [`android/README.md`](https://github.com/Pruzzo/giochi-da-salotto/blob/main/android/README.md).

In breve:

```bash
cd android
echo "sdk.dir=$HOME/Android/Sdk" > local.properties
./gradlew assembleRelease
```

Servono JDK 17, l'SDK Android con NDK 27.2.12479018 e CMake 3.22.1, Node.js e `python3`.

## Gli screenshot di questa guida

`docs/tools/screenshots.mjs` accende un server, apre una TV e tre telefoni in Chrome e gioca una partita vera, fotografando ogni passaggio:

```bash
npm i --no-save playwright-core
node docs/tools/screenshots.mjs docs/img
```

Con `ONLY=piacere` rifà solo gli screenshot di Piacere!. Il server dello script parte con impostazioni nuove, quindi con lo stile predefinito, Kraft.

Gli screenshot dell'app Android (`docs/img/app-*.png`) vengono dall'emulatore.
