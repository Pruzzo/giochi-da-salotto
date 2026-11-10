// Collega le regole de "L'impiccato" alla console.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openRoom } from '../shared/room.js';
import { Game, MAX_PLAYERS } from './game.js';

const here = dirname(fileURLToPath(import.meta.url));

const PHASES = {
  lobby: 'in attesa dei giocatori',
  choosing: 'lo schermo sceglie la parola',
  playing: 'si indovina',
  reveal: 'parola svelata',
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
    setSettings: (p, a) => game.setSettings(p, { durationSec: a.durationSec, length: a.length }),
    startRound: (p) => game.startRound(p),
    guessLetter: (p, a) => game.guessLetter(p, a.letter),
    guessWord: (p, a) => game.guessWord(p, a.word),
    stopRound: (p) => game.stopRound(p),
    endGame: (p) => game.endGame(p),
    newGame: (p) => game.newGame(p),
  };

  return openRoom(nsp, { game, actions, status, ...ctx });
}

export default {
  id: 'impiccato',
  title: "L'impiccato",
  description: `Lo schermo sceglie una parola e ne mostra la prima e l'ultima lettera: ognuno la indovina dal telefono. Vince chi è più veloce e sbaglia meno. Fino a ${MAX_PLAYERS} giocatori.`,
  page: join(here, 'public', 'index.html'),
  publicDir: join(here, 'public'),
  start,
};
