import { startClient } from '/js/kit/client.js';
import { joinView } from '/js/kit/ui.js';
import { phoneView } from './phone.js';
import { tvView } from './tv.js';

startClient({
  namespace: '/impiccato',
  storage: 'impiccato',
  views: {
    join: (ctx) => joinView({
      title: ["L'impiccato"],
      hints: {
        player: 'Indovini la parola dal telefono, lettera per lettera.',
        admin: 'Giochi anche tu, in più scegli le regole e fai partire le parole.',
        tv: 'Questo schermo mostra la parola, il tempo e gli omini di tutti.',
      },
    }, ctx),
    phone: phoneView,
    tv: tvView,
  },
});
