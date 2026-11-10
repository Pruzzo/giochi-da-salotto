# App Android

Questo file è per chi compila l'app. Per installarla e usarla c'è la guida [App Android](../docs/App-Android.md).

L'APK fa da server: dentro c'è Node.js ([nodejs-mobile](https://github.com/nodejs-mobile/nodejs-mobile) v18) che fa girare `server/index.js` così com'è. TV e telefoni si collegano al dispositivo Android come farebbero col PC.

## Come si usa

1. Installa l'APK sul telefono (o sul box Android TV) che farà da server. Serve Android 7 o superiore.
2. Apri **Giochi da salotto**: il server si accende da solo e in alto compare l'indirizzo, per esempio `http://192.168.1.42:3000`.
3. Sotto c'è la console: scegli il gioco da lì. **Condividi** manda l'indirizzo per telefoni e TV su WhatsApp o altrove.
4. La TV apre `http://<indirizzo>:3000/tv`, i telefoni inquadrano il QR code sulla TV.
5. Il server resta acceso anche a schermo spento o con l'app chiusa, finché c'è la notifica. **Spegni**, nell'app o nella notifica, lo chiude e libera la batteria.

Senza router: accendi l'hotspot del telefono server, collega lì TV e telefoni e poi tocca **Accendi**. Se cambi rete con il server acceso, spegnilo e riaccendilo perché prenda il nuovo indirizzo.

Se il server non parte, tocca **Log**: c'è ogni passaggio dell'avvio (rete scelta, librerie, scompattamento) e tutto quello che scrive Node. **Copia** lo mette negli appunti.

Su un televisore Android l'app mostra direttamente lo schermo della TV invece della console; la console si apre da un telefono su `/console`.

## Quale APK installare

Gli APK pronti sono nelle [release](https://github.com/Pruzzo/giochi-da-salotto/releases/latest). Compilando, finiscono in `app/build/outputs/apk/release/`:

| File | Per |
| --- | --- |
| `app-arm64-v8a-release.apk` | quasi tutti i telefoni dal 2017 in poi |
| `app-armeabi-v7a-release.apk` | telefoni vecchi e molti box TV economici |
| `app-universal-release.apk` | se non sai quale: va su entrambi, ma pesa il triplo |

## Compilare

Servono JDK 17, l'SDK Android con NDK 27.2.12479018 e CMake 3.22.1, Node.js e npm (per le dipendenze del server) e `python3`.

```bash
cd android
echo "sdk.dir=$HOME/Android/Sdk" > local.properties
./gradlew assembleRelease
```

Alla prima compilazione `scripts/prepare.sh` scarica la libreria Node.js per Android (circa 57 MB) in `libnode/`. A ogni compilazione impacchetta `server/`, `games/`, `public/` e le dipendenze di produzione in `nodejs-project.zip`, che l'app scompatta sul dispositivo al primo avvio dopo ogni installazione.

Per l'emulatore x86_64: `./gradlew assembleDebug -Pemulator`.

### Firma

Gli APK release si firmano con la chiave indicata in `keystore.properties`:

```properties
storeFile=keystore/release.jks
storePassword=...
keyAlias=giochi
keyPassword=...
```

Chiave e file delle password non vanno nel repo. **Tienine una copia a parte**: senza la stessa chiave Android non installa gli aggiornamenti sopra l'app già installata e bisogna disinstallarla prima. Se `keystore.properties` manca, l'APK release viene firmato con la chiave di debug.

## Com'è fatta

- `MainActivity`: accende e spegne il server, mostra l'indirizzo e la console in una WebView.
- `NodeService`: servizio in primo piano, in un processo a parte (`:node`), che scompatta il server e avvia Node. Node si può avviare una volta sola per processo, quindi spegnere vuol dire chiudere quel processo. Tiene acceso il Wi-Fi a bassa latenza anche a schermo spento.
- `Net`: sceglie l'indirizzo della rete locale (Wi-Fi, cavo o hotspot) e lo passa al server come `PUBLIC_URL`, perché su Android Node non sempre riesce a leggere le interfacce di rete.
- `cpp/nodebridge.cpp`: chiama `node::Start` e manda l'output di Node su logcat (`adb logcat -s NodeServer`) e nel registro del pulsante Log (`ServerLog`, file `server.log`).
- `scripts/boot.mjs`: primo file che Node esegue; scrive versione e ICU nel registro e carica `server/index.js`.
