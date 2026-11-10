// Screenshot per la documentazione: gioca davvero una partita con una TV e tre telefoni.
// uso, dalla radice del repo:
//   npm i --no-save playwright-core
//   node docs/tools/screenshots.mjs docs/img
// CHROME=/percorso/di/chrome se non è in /usr/bin/google-chrome.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const ROOT = new URL('../..', import.meta.url).pathname;
const OUT = process.argv[2];
mkdirSync(OUT, { recursive: true });
const PORT = 3100;
const BASE = `http://localhost:${PORT}`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const server = spawn('node', ['server/index.js'], {
  cwd: ROOT, env: { ...process.env, PORT: String(PORT), PUBLIC_URL: 'http://192.168.1.42:3000' }, stdio: 'ignore',
});
for (let i = 0; i < 50; i++) {
  try { if ((await fetch(`${BASE}/qr.svg`)).ok) break; } catch {}
  await wait(200);
}

const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome' });
const phoneCtx = () => browser.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'it-IT',
  reducedMotion: 'reduce',
});
const tvCtx = () => browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5, locale: 'it-IT', reducedMotion: 'reduce' });
const shot = async (page, name, settle = 600) => {
  await wait(settle);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log('📸', name);
};

async function open(ctxPromise, path) {
  const ctx = await ctxPromise;
  const page = await ctx.newPage();
  await page.goto(BASE + path);
  return page;
}

async function join(page, name, { admin = false, shotName } = {}) {
  await page.getByRole('button', { name: admin ? 'Amministratore' : 'Giocatore', exact: true }).click();
  await page.locator('#name').fill(name);
  if (shotName) await shot(page, shotName);
  await page.getByRole('button', { name: 'Entra', exact: true }).click();
  await wait(700);
}

async function selectGame(consolePage, title) {
  await consolePage.locator('li', { hasText: title }).getByRole('button', { name: 'Accendi questo gioco' }).click();
  await wait(800);
}

async function closeGame(consolePage) {
  await consolePage.getByRole('button', { name: 'Chiudi il gioco' }).click();
  await consolePage.getByRole('button', { name: 'Chiudi e cancella la partita' }).click();
  await wait(800);
}

// Parole per ogni lettera: Nomi, Cose, Città, Animali, Mestieri (due varianti).
const BANK = {
  A: [['Anna', 'Armadio', 'Ancona', 'Aquila', 'Avvocato'], ['Alberto', 'Anello', 'Arezzo', 'Asino', 'Architetto']],
  B: [['Bruno', 'Bicchiere', 'Bari', 'Balena', 'Barista'], ['Beatrice', 'Borsa', 'Bologna', 'Bue', 'Bidello']],
  C: [['Carla', 'Candela', 'Como', 'Cavallo', 'Cuoco'], ['Carlo', 'Cuscino', 'Cagliari', 'Cane', 'Cameriere']],
  D: [['Davide', 'Dado', 'Domodossola', 'Delfino', 'Dentista'], ['Diana', 'Divano', 'Desenzano', 'Daino', 'Dottore']],
  E: [['Elena', 'Elmo', 'Empoli', 'Elefante', 'Elettricista'], ['Enrico', 'Etichetta', 'Enna', 'Ermellino', 'Edicolante']],
  F: [['Francesca', 'Forchetta', 'Firenze', 'Foca', 'Fornaio'], ['Fabio', 'Frigorifero', 'Foggia', 'Furetto', 'Falegname']],
  G: [['Giorgio', 'Gomma', 'Genova', 'Gatto', 'Giardiniere'], ['Giada', 'Giacca', 'Grosseto', 'Gufo', 'Giornalista']],
  H: [['Hugo', 'Hotel', 'Helsinki', 'Husky', 'Hostess'], ['Harry', 'Hard disk', 'Houston', 'Hamster', 'Hacker']],
  I: [['Irene', 'Imbuto', 'Imola', 'Istrice', 'Infermiere'], ['Ivan', 'Inchiostro', 'Ivrea', 'Iena', 'Idraulico']],
  L: [['Luca', 'Lampada', 'Lecce', 'Leone', 'Libraio'], ['Laura', 'Libro', 'Livorno', 'Lupo', 'Lattaio']],
  M: [['Marco', 'Martello', 'Milano', 'Mucca', 'Medico'], ['Maria', 'Matita', 'Messina', 'Merlo', 'Muratore']],
  N: [['Nicola', 'Nastro', 'Napoli', 'Nutria', 'Notaio'], ['Nadia', 'Nave', 'Novara', 'Nibbio', 'Netturbino']],
  O: [['Olga', 'Orologio', 'Orvieto', 'Orso', 'Orafo'], ['Oscar', 'Ombrello', 'Oristano', 'Oca', 'Ottico']],
  P: [['Paolo', 'Pentola', 'Palermo', 'Pinguino', 'Pittore'], ['Paola', 'Penna', 'Parma', 'Pecora', 'Pompiere']],
  Q: [['Quirino', 'Quaderno', 'Quartu', 'Quaglia', 'Questore'], ['Quinto', 'Quadro', 'Quarrata', 'Quokka', 'Questore']],
  R: [['Roberto', 'Radio', 'Roma', 'Rana', 'Ragioniere'], ['Rita', 'Rastrello', 'Rimini', 'Riccio', 'Regista']],
  S: [['Sara', 'Sedia', 'Siena', 'Serpente', 'Sarto'], ['Stefano', 'Scopa', 'Savona', 'Scimmia', 'Sindaco']],
  T: [['Tommaso', 'Tavolo', 'Torino', 'Tigre', 'Tassista'], ['Teresa', 'Tazza', 'Trento', 'Topo', 'Tecnico']],
  U: [['Ugo', 'Uovo', 'Udine', 'Upupa', 'Usciere'], ['Ursula', 'Uncinetto', 'Urbino', 'Usignolo', 'Ufficiale']],
  V: [['Valentina', 'Vaso', 'Venezia', 'Volpe', 'Vigile'], ['Vittorio', 'Valigia', 'Verona', 'Vipera', 'Veterinario']],
  Z: [['Zeno', 'Zaino', 'Zagarolo', 'Zebra', 'Zoologo'], ['Zoe', 'Zucchero', 'Zurigo', 'Zanzara', 'Zampognaro']],
};

async function write(page, words) {
  for (let i = 0; i < words.length; i++) await page.locator(`#w${i}`).fill(words[i]);
  await page.locator('#w0').blur?.();
  await wait(400);
}

try {
  // ---------- Console e attesa ----------
  const tv = await open(tvCtx(), '/tv');
  await shot(tv, 'tv-attesa', 1200);
  const consolePhone = await open(phoneCtx(), '/console');
  await shot(consolePhone, 'console', 1200);
  const consoleWide = await open(tvCtx(), '/console');
  await shot(consoleWide, 'console-pc', 800);
  await consoleWide.close();

  // ---------- Nomi, cose e città ----------
  await selectGame(consolePhone, 'Nomi, cose e città');
  await shot(consolePhone, 'console-acceso');
  await tv.waitForTimeout(1500);
  await shot(tv, 'ncc-tv-copertina');

  const giulia = await open(phoneCtx(), '/');
  await shot(giulia, 'telefono-ingresso', 1200);
  await join(giulia, 'Giulia', { admin: true, shotName: 'telefono-ingresso-admin' });
  const marco = await open(phoneCtx(), '/');
  await join(marco, 'Marco');
  const sara = await open(phoneCtx(), '/');
  await join(sara, 'Sara');
  await shot(giulia, 'ncc-telefono-sala-admin');
  await shot(marco, 'ncc-telefono-sala');
  await shot(tv, 'ncc-tv-sala');

  await giulia.getByRole('button', { name: 'Fai girare la ruota' }).click();
  await shot(tv, 'ncc-tv-ruota', 1200);
  await shot(marco, 'ncc-telefono-ruota', 0);
  await giulia.locator('.sheet-head__letter').waitFor({ timeout: 30000 });
  const letter = await giulia.locator('.sheet-head__letter').getAttribute('data-letter');
  console.log('lettera', letter);
  const [w1, w2] = BANK[letter];
  await write(giulia, w1);
  await write(marco, [w2[0], w1[1], w2[2], w2[3], w2[4]]);
  const wrong = letter === 'P' ? 'Cuoco' : 'Pizzaiolo';
  await write(sara, [w1[0], w2[1], w1[2], '', wrong]);
  await shot(sara, 'ncc-telefono-scrittura');
  await shot(tv, 'ncc-tv-scrittura');
  for (const p of [giulia, marco, sara]) await p.getByRole('button', { name: 'Ho finito' }).click();
  await wait(2500);
  await shot(tv, 'ncc-tv-correzione', 1500);
  await shot(giulia, 'ncc-telefono-correzione-admin');
  await shot(marco, 'ncc-telefono-correzione');
  await giulia.getByRole('button', { name: 'Conferma i punti del turno' }).click();
  await shot(tv, 'ncc-tv-punti', 1500);
  await shot(giulia, 'ncc-telefono-punti-admin');
  await shot(marco, 'ncc-telefono-punti');

  // ---------- Gli altri giochi: una schermata di gioco ciascuno ----------
  const others = [
    { id: 'codice', title: 'Codice segreto', start: 'Fai scegliere il codice' },
    { id: 'impiccato', title: "L'impiccato", start: 'Fai scegliere la parola' },
    { id: 'anagrammi', title: 'Anagrammi', start: 'Fai estrarre le lettere' },
  ];
  for (const game of others) {
    await closeGame(consolePhone);
    await selectGame(consolePhone, game.title);
    await tv.reload();
    await wait(1500);
    const a = await open(phoneCtx(), '/');
    await join(a, 'Giulia', { admin: true });
    const b = await open(phoneCtx(), '/');
    await join(b, 'Marco');
    await shot(a, `${game.id}-telefono-sala-admin`);
    await a.getByRole('button', { name: game.start }).click();
    await shot(tv, `${game.id}-tv-inizio`, 1500);
    await wait(5000);
    if (game.id === 'impiccato') {
      for (const ch of ['E', 'A', 'R', 'T']) {
        await b.getByRole('button', { name: ch, exact: true }).click().catch(() => {});
        await wait(200);
      }
    }
    await shot(b, `${game.id}-telefono-gioco`, 800);
    await shot(tv, `${game.id}-tv-gioco`, 800);
    await a.context().close();
    await b.context().close();
  }
} catch (error) {
  console.error('ERRORE', error);
  process.exitCode = 1;
} finally {
  await browser.close();
  server.kill();
}
