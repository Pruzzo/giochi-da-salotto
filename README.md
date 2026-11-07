# Nomi, cose e città

Il gioco di carta e penna, da giocare in salotto con una TV e i telefoni.

## Avvio

```bash
npm install
npm start
```

Serve Node.js 20 o superiore. Il server stampa due indirizzi:

- **TV:** apri `http://<ip-del-pc>:3000/tv` nel browser della TV o di un PC collegato alla TV.
- **Telefoni:** inquadra il QR code che compare sulla TV. I telefoni devono essere sulla stessa rete Wi-Fi del PC.

## Come si gioca

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

La partita vive in memoria: riavviando il server si ricomincia da zero. Un telefono che va in standby ritrova posto, parole e punti.

## Sviluppo

```bash
npm run dev   # riavvia il server a ogni modifica
npm test      # test della logica di gioco
```

- `server/game.js`: regole e stati della partita, senza dipendenze di rete
- `server/index.js`: HTTP, WebSocket e QR code
- `public/`: client senza build step (`js/tv.js` per la TV, `js/phone.js` per i telefoni)
