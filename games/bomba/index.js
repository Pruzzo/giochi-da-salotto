// Collega le regole di "Disinnesca la bomba" alla console.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openRoom } from '../shared/room.js';
import { teamActions } from '../shared/teams.js';
import { Game } from './game.js';

const here = dirname(fileURLToPath(import.meta.url));

const PHASES = {
  lobby: 'in attesa dei giocatori',
  teams: 'si scelgono le squadre',
  briefing: 'nomi e ruoli',
  playing: 'si disinnesca',
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
    answer: (p, a) => game.answer(p, a.module, a.faceId, a.value),
  };

  return openRoom(nsp, { game, actions, status, ...ctx });
}

export default {
  id: 'bomba',
  title: 'Disinnesca la bomba',
  description: 'A squadre di due, solo in numero pari. Uno ha la bomba sul telefono, l’altro il manuale per smontarla: parlatevi bene, prima che scada il tempo o che facciate tre errori.',
  page: join(here, 'public', 'index.html'),
  publicDir: join(here, 'public'),
  start,
};
