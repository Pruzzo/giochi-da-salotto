# Risoluzione dei problemi

## I telefoni non riescono ad aprire la pagina

Il browser del telefono gira a vuoto o dice che il sito non è raggiungibile.

1. **Stessa rete?** Telefono e server devono essere sullo stesso Wi-Fi (o sull'hotspot del telefono server). Controlla che il telefono non sia passato ai dati mobili: in quel caso spegni i dati e riprova.
2. **Rete ospiti?** Le reti *ospiti* dei router, molte reti di alberghi e alcuni ripetitori isolano i dispositivi tra loro: si naviga su internet, ma non ci si vede in casa. Usa la rete principale, oppure l'hotspot del telefono server con l'[app Android](App-Android.md#senza-wi-fi-lhotspot).
3. **Indirizzo giusto?** Deve essere `http://game.local:3000`, con `http://` (non `https://`) e la porta. Alcuni browser aggiungono `https://` da soli: scrivilo per intero. Se il nome non si apre, vedi [più sotto](#il-nome-gamelocal-non-si-apre).
4. **Firewall del PC?** Vedi sotto.

Una prova veloce: apri il gioco dallo stesso dispositivo che fa da server (nell'app con **Vai a giocare**, sul PC con `http://localhost:3000`). Se lì funziona e dagli altri no, il problema è la rete o il firewall, non il gioco.

## Il firewall del PC blocca i telefoni

Sul PC la pagina si apre, dai telefoni no.

- **Windows**: apri *Windows Defender Firewall → Consenti app o funzionalità attraverso Windows Defender Firewall*, tocca **Modifica impostazioni** e spunta **Privata** accanto a **Node.js JavaScript Runtime** (o *node.exe*). Controlla anche che la rete di casa sia impostata come **privata** e non pubblica, in *Impostazioni → Rete e Internet → Wi-Fi → (la tua rete)*.
- **macOS**: *Impostazioni di Sistema → Rete → Firewall → Opzioni*, e consenti le connessioni in entrata a `node`.
- **Linux** con `ufw`: `sudo ufw allow 3000/tcp`.

## Il nome game.local non si apre

Alcuni telefoni Android e alcune smart TV non riconoscono i nomi che finiscono con `.local`: il browser dice che il sito non esiste.

- **Telefoni**: inquadrate il QR code sulla TV, che funziona anche su questi dispositivi.
- **TV**: se il suo browser non trova il nome, collega alla TV un PC in HDMI o usa un box Android TV con l'[app](App-Android.md#su-android-tv). In alternativa inquadra il QR code con un dispositivo collegato alla TV e scegli il ruolo **TV**.
- **Link mandato con Condividi**: contiene `game.local`, quindi su questi telefoni non si apre. Usate il QR code.

## Il QR code porta a un indirizzo sbagliato

Succede su PC con più reti (VPN, macchine virtuali, cavo e Wi-Fi insieme): il QR code usa la rete sbagliata.

1. Trova l'indirizzo del PC nella rete di casa:
   - Windows: `ipconfig` nel terminale, alla voce *Indirizzo IPv4* della scheda Wi-Fi o Ethernet;
   - macOS: *Impostazioni di Sistema → Wi-Fi → Dettagli*, oppure `ipconfig getifaddr en0`;
   - Linux: `hostname -I`.
2. Riavvia il server dicendogli l'indirizzo giusto, per esempio:

   ```bash
   PUBLIC_URL=http://INDIRIZZO-DEL-PC:3000 npm start
   ```

   Su Windows (PowerShell): `$env:PUBLIC_URL="http://INDIRIZZO-DEL-PC:3000"; npm start`.

Nell'app Android il QR code si prepara da solo sulla rete giusta tra Wi-Fi, cavo e hotspot. Se è sbagliato dopo un cambio di rete, tocca **Spegni** e poi **Accendi**.

## La TV non mostra bene il gioco

- I browser delle smart TV più vecchie a volte non reggono le animazioni o i caratteri. Alternative che funzionano sempre: un PC o portatile collegato alla TV in HDMI, un box Android TV con l'[app](App-Android.md#su-android-tv) o con Chrome.
- La TV può entrare anche come "telefono": apri l'indirizzo principale e scegli il ruolo **TV**.
- Per lo schermo intero usa l'icona in basso a sinistra sulla TV.

## Un giocatore è uscito per sbaglio o ha cambiato telefono

Deve rientrare dal QR code con **lo stesso nome**: ritrova punti e risposte. Se compare "C'è già un giocatore che si chiama…", il vecchio telefono è ancora collegato: chiudi lì la pagina, oppure scegli un altro nome.

## Non c'è l'amministratore

Se l'amministratore esce o si scollega, un altro giocatore tocca **Diventa amministratore** dalla sala d'attesa e prende il suo posto.

## Sul telefono il server si spegne da solo

L'app tiene acceso il server con una notifica fissa, ma alcuni telefoni chiudono lo stesso le app in sottofondo per risparmiare batteria. Sul telefono server:

1. *Impostazioni → App → Giochi da salotto → Batteria*: scegli **Senza restrizioni** (o **Non ottimizzare**).
2. Su Xiaomi: anche *Avvio automatico* attivo e, nelle app recenti, tieni premuto l'app e tocca il lucchetto.
3. Su Huawei: *Avvio app* → gestione manuale, con tutte le opzioni attive.
4. Su Samsung: togli l'app dalle *App in sospensione* in *Assistenza dispositivo → Batteria*.

Il sito [dontkillmyapp.com](https://dontkillmyapp.com/) ha le istruzioni per quasi ogni marca.

## Sul telefono il server non parte

Apri il **Log** dell'app: spiega cosa è successo. Vedi [Se il server non parte](App-Android.md#se-il-server-non-parte-il-log).

## La partita è sparita

La partita vive in memoria: si cancella se il server si riavvia, se dalla console si chiude o si cambia gioco, o se nell'app si tocca **Spegni**. I telefoni lo dicono ("La partita è ricominciata: rientra con il tuo nome").
