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

1. Crea una cartella in `games/` che esporta `{ id, title, description, page, publicDir, start }` e aggiungila a `games/index.js`.
2. `start(nsp, { joinUrl, onStatus, session })` riceve un namespace Socket.IO riservato e restituisce `{ status, destroy }`. Passa `session` a `openRoom`: quando la fase diventa `'final'`, chi ha più punti in `totals()` prende una vittoria della serata.
3. La pagina del gioco deve avere `<meta name="platform-game" content="<id>">` e caricare `/js/platform.js`.

La strada più corta è copiare `games/codice-segreto/`: le regole estendono `Table`, `start` chiama `openRoom` di `games/shared/room.js` con le azioni del gioco, e il client chiama `startClient` di `/js/kit/client.js` con le sue viste di telefono e TV.

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

Gli screenshot dell'app Android (`docs/img/app-*.png`) vengono dall'emulatore.
