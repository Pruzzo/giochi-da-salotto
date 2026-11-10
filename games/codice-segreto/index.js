// Collega le regole di "Codice segreto" alla console.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openRoom } from '../shared/room.js';
import { Game, MAX_PLAYERS } from './game.js';

const here = dirname(fileURLToPath(import.meta.url));

const PHASES = {
  lobby: 'in attesa dei giocatori',
  hiding: 'lo schermo sceglie il codice',
  playing: 'si indovina',
  reveal: 'codice svelato',
  final: 'partita finita',
};

function start(nsp, { joinUrl, onStatus, session }) {
  const game = new Game();

  const status = () => {
    const players = game.players.size;
    const who = players === 1 ? '1 giocatore' : `${players} giocatori`;
    const turn = game.round > 0 ? `turno ${game.round}, ` : '';
    return `${turn}${PHASES[game.phase]}, ${who}`;
  };

  const actions = {
    setSettings: (p, a) => game.setSettings(p, { colors: a.colors, repeats: a.repeats, durationSec: a.durationSec }),
    startRound: (p) => game.startRound(p),
    guess: (p, a) => { game.guess(p, a.code); },
    stopRound: (p) => game.stopRound(p),
    endGame: (p) => game.endGame(p),
    newGame: (p) => game.newGame(p),
  };

  return openRoom(nsp, { game, actions, status, joinUrl, onStatus, session });
}

export default {
  id: 'codice-segreto',
  title: 'Codice segreto',
  description: `Lo schermo sceglie a caso una fila di 4 pastelli e la tiene coperta: tutti la cercano dal telefono, a ogni tentativo pallini pieni e vuoti dicono quanto ci sei vicino. Fino a ${MAX_PLAYERS} giocatori.`,
  page: join(here, 'public', 'index.html'),
  publicDir: join(here, 'public'),
  start,
};
