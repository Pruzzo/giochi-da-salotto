import { startClient } from '/js/kit/client.js';
import { clock, teamViews } from '/js/kit/teams.js';
import { joinView } from '/js/kit/ui.js';
import { sounds } from './audio.js';
import { playingPhone } from './phone.js';
import { legend, resultMap, zone } from './tv.js';

const SIZE_TEXT = { piccolo: 'Piccolo 7×7', medio: 'Medio 9×9', grande: 'Grande 11×11' };
const bombs = (n) => (n === 1 ? '1 bomba' : `${n} bombe`);

const { phone, tv } = teamViews({
  title: 'Labirinto al buio',
  goal: 'L’esploratore cammina al buio guardando la TV, il navigatore ha la mappa sul telefono. Parlatevi e uscite dalla porta prima che finisca il tempo, lontano dalle bombe.',
  roles: {
    esploratore: {
      label: 'Esploratore',
      short: 'Muove l’omino con le frecce e guarda la TV.',
      brief: [
        'Sulla TV, nella zona della tua squadra, vedi solo la tua casella e metà di quelle accanto. Il nord è sempre in alto.',
        'Descrivi al navigatore quello che vedi: colori, simboli, muri, bombe.',
        'Sulla bomba torni alla partenza. Contro un muro non succede niente.',
      ],
    },
    navigatore: {
      label: 'Navigatore',
      short: 'Ha la mappa intera, ma non vede l’omino.',
      brief: [
        'Hai la mappa con muri, decori, bombe e la porta d’uscita, ma non l’omino: capisci dov’è da quello che ti racconta l’esploratore.',
        'Ogni 8 passi la mappa gira o si capovolge: leggi la scritta in alto prima di dare indicazioni.',
        'Guidalo fino alla porta, lontano dalle bombe.',
      ],
    },
  },
  settings: [
    { key: 'size', label: 'Labirinto', text: (v) => SIZE_TEXT[v] ?? v },
    { key: 'durationSec', label: 'Tempo', text: (v) => `${v / 60} minuti` },
  ],
  phone: { playing: playingPhone },
  tv: { zone, legend, result: resultMap },
  outcome: (team) => {
    const o = team.outcome ?? {};
    const hit = o.bombs ? ` · ${bombs(o.bombs)}` : '';
    if (o.success) return `Usciti con ${clock(Math.round((team.remainingMs ?? 0) / 1000))} di anticipo${hit}`;
    return `Non sono usciti${hit}`;
  },
  sounds: { go: sounds.go, end: sounds.end },
});

startClient({
  namespace: '/labirinto',
  storage: 'labirinto',
  views: {
    join: (ctx) => joinView({
      title: ['Labirinto', 'al buio'],
      hints: {
        player: 'A squadre di due: uno muove l’omino guardando la TV, l’altro lo guida con la mappa sul telefono.',
        admin: 'Giochi anche tu, in più scegli grandezza del labirinto e tempo e fai partire i turni.',
        tv: 'Questo schermo è la torcia: per ogni squadra mostra solo intorno all’omino. E il tempo.',
      },
    }, ctx),
    phone,
    tv,
  },
});
