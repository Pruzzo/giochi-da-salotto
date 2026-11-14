// Collega le regole di "Anagrammi" alla console.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openRoom } from '../shared/room.js';
import { Game, MAX_PLAYERS } from './game.js';

const here = dirname(fileURLToPath(import.meta.url));

const PHASES = {
  lobby: 'in attesa dei giocatori',
  shuffling: 'si mescolano le lettere',
  writing: 'si cercano parole',
  reveal: 'parole svelate',
  final: 'partita finita',
};

function start(nsp, ctx) {
  const game = new Game();

  const status = () => {
    const players = game.players.size;
    const who = players === 1 ? '1 giocatore' : `${players} giocatori`;
    const turn = game.round > 0 ? `turno ${game.round}, ` : '';
    return `${turn}${PHASES[game.phase]}, ${who}`;
  };

  const actions = {
    setSettings: (p, a) => game.setSettings(p, { durationSec: a.durationSec }),
    startRound: (p) => game.startRound(p),
    submit: (p, a) => game.submit(p, a.word),
    setDone: (p, a) => game.setDone(p, a.done),
    stopRound: (p) => game.stopRound(p),
    endGame: (p) => game.endGame(p),
    newGame: (p) => game.newGame(p),
  };

  return openRoom(nsp, { game, actions, status, ...ctx });
}

export default {
  id: 'anagrammi',
  title: 'Anagrammi',
  tagline: "Otto lettere, tutte le parole che trovi.",
  description: "Le parole lunghe valgono di più. Quelle che trovi solo tu valgono doppio.",
  meta: [`1–${MAX_PLAYERS} giocatori`, 'Individuale'],
  page: join(here, 'public', 'index.html'),
  publicDir: join(here, 'public'),
  start,
};
