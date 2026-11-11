import { startClient } from '/js/kit/client.js';
import { joinView } from '/js/kit/ui.js';
import { teamViews } from '/js/kit/teams.js';
import { bombPhone } from './bomb.js';
import { manualPhone } from './manual.js';
import { legend, outcomeText, result, zone } from './tv.js';
import { sounds } from './audio.js';

const { phone, tv } = teamViews({
  title: 'Disinnesca la bomba',
  goal: 'Uno ha la bomba, l’altro il manuale per smontarla. Disinnescate tutti i moduli prima che scada il tempo: al terzo errore la bomba scoppia.',
  roles: {
    artificiere: {
      label: 'Artificiere',
      short: 'Hai la bomba: la descrivi e la smonti.',
      brief: [
        'In alto c’è un quadratino per ogni modulo: toccalo per aprirlo. Sotto c’è l’etichetta col numero di serie.',
        'Descrivi al compagno quello che vedi e fai quello che ti dice: taglia, sposta, premi.',
        'Ogni mossa sbagliata è un errore: al terzo la bomba scoppia.',
      ],
    },
    esperto: {
      label: 'Esperto',
      short: 'Hai il manuale: trovi la regola giusta.',
      brief: [
        'Nell’indice del manuale c’è il disegno di ogni modulo: fatti descrivere quello che ha l’artificiere e apri la sua pagina.',
        'Leggi la regola e digli cosa fare.',
        'Molte regole usano il numero di serie: chiediglielo.',
      ],
    },
  },
  settings: [
    { key: 'modules', label: 'Moduli della bomba', text: (v) => String(v) },
    { key: 'durationSec', label: 'Tempo', text: (v) => `${v / 60} min` },
  ],
  phone: {
    playing: (state, ctx, team) => (state.you.teamRole === 'artificiere' ? bombPhone(state, ctx, team) : manualPhone(state, ctx, team)),
  },
  tv: { zone, legend, result },
  outcome: (team) => outcomeText(team),
  sounds: {
    go: sounds.go,
    done: (team) => (team.outcome?.success ? sounds.defused() : sounds.boom()),
    end: sounds.boom,
  },
});

startClient({
  namespace: '/bomba',
  storage: 'bomba',
  views: {
    join: (ctx) => joinView({
      title: ['Disinnesca', 'la bomba'],
      hints: {
        player: 'A squadre di due: uno ha la bomba sul telefono, l’altro il manuale.',
        admin: 'Giochi anche tu, in più scegli quanti moduli e quanto tempo prima di ogni turno.',
        tv: 'Questo schermo mostra il tempo, gli errori e i moduli risolti di ogni squadra. Mai la bomba.',
      },
    }, ctx),
    phone,
    tv,
  },
});
