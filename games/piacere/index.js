// Collega le regole di "Piacere!" alla console.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openRoom } from '../shared/room.js';
import { Game, MAX_PLAYERS, NONE } from './game.js';

const here = dirname(fileURLToPath(import.meta.url));

const PHASES = {
  lobby: 'in attesa dei giocatori',
  intro: 'si presentano sulla TV',
  countdown: 'conto alla rovescia',
  quiz: 'chi è?',
  reveal: 'classifica del turno',
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
    setSettings: (p, a) => game.setSettings(p, { known: a.known, strangers: a.strangers, level: a.level, paceSec: a.paceSec }),
    startRound: (p) => game.startRound(p),
    answer: (p, a) => game.answer(p, a.pick === NONE ? NONE : Number(a.pick)),
    stopRound: (p) => game.stopRound(p),
    endGame: (p) => game.endGame(p),
    newGame: (p) => game.newGame(p),
  };

  return openRoom(nsp, { game, actions, status, ...ctx });
}

export default {
  id: 'piacere',
  title: 'Piacere!',
  tagline: "Li hai appena conosciuti. Li riconosci?",
  description: "Una fila di persone si presenta sulla TV, poi torna sul telefono con altri vestiti e qualche sconosciuto in mezzo. Ogni errore costa 5 secondi.",
  meta: [`1–${MAX_PLAYERS} giocatori`, 'Individuale'],
  page: join(here, 'public', 'index.html'),
  publicDir: join(here, 'public'),
  start,
};
