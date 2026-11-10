// Collega le regole di "Nomi, cose e città" alla console.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openRoom } from '../shared/room.js';
import { Game, MAX_PLAYERS } from './game.js';

const here = dirname(fileURLToPath(import.meta.url));

const PHASES = {
  lobby: 'in attesa dei giocatori',
  spinning: 'la ruota sta girando',
  writing: 'si scrive',
  review: 'correzione',
  scored: 'punti del turno',
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
    saveWord: (p, a) => game.saveWord(p, a.index, a.word),
    setDone: (p, a) => game.setDone(p, a.done),
    setSettings: (p, a) => game.setSettings(p, { categories: a.categories, durationSec: a.durationSec }),
    startRound: (p) => game.startRound(p),
    stopWriting: (p) => game.stopWriting(p),
    setScore: (p, a) => game.setScore(p, a.playerId, a.index, a.score),
    setFocus: (p, a) => game.setFocus(p, a.playerId),
    confirmRound: (p) => game.confirmRound(p),
    reopenRound: (p) => game.reopenRound(p),
    endGame: (p) => game.endGame(p),
    newGame: (p) => game.newGame(p),
  };

  return openRoom(nsp, { game, actions, status, joinUrl, onStatus, session });
}

export default {
  id: 'nomi-cose-citta',
  title: 'Nomi, cose e città',
  description: `La ruota sceglie la lettera, tutti scrivono 5 parole a tempo e l'amministratore corregge sulla TV. Fino a ${MAX_PLAYERS} giocatori.`,
  page: join(here, 'public', 'index.html'),
  publicDir: join(here, 'public'),
  start,
};
