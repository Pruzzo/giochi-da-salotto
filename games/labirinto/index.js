// Collega le regole di "Labirinto al buio" alla console.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openRoom } from '../shared/room.js';
import { teamActions } from '../shared/teams.js';
import { Game } from './game.js';

const here = dirname(fileURLToPath(import.meta.url));

const PHASES = {
  lobby: 'in attesa dei giocatori',
  teams: 'si scelgono le squadre',
  briefing: 'nome della squadra e ruoli',
  playing: 'al buio nel labirinto',
  result: 'turno finito',
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
    ...teamActions(game),
    move: (p, a) => game.move(p, a.dir),
  };

  return openRoom(nsp, { game, actions, status, ...ctx });
}

export default {
  id: 'labirinto',
  title: 'Labirinto al buio',
  description: 'A squadre di due, solo in numero pari. L’esploratore cammina al buio tra le bombe guardando la TV, il navigatore ha la mappa sul telefono: ma la mappa gira e non dice dov’è l’omino. Fino a 6 squadre.',
  page: join(here, 'public', 'index.html'),
  publicDir: join(here, 'public'),
  start,
};
