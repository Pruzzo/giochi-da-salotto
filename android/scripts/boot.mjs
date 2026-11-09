// Avvio su Android: scrive nel log com'è fatto questo Node, poi carica il server.
// Tutto quello che passa da console finisce nel registro dell'app (pulsante Log).
console.log(`Node ${process.version} ${process.arch}, ICU ${process.versions.icu ?? 'assente'}`);
console.log(`PUBLIC_URL=${process.env.PUBLIC_URL} PORT=${process.env.PORT}`);
process.on('exit', (code) => console.log(`Node si ferma con codice ${code}`));

try {
  await import('./server/index.js');
} catch (error) {
  console.error(`Il server non è partito: ${error?.stack ?? error}`);
  process.exit(1);
}
