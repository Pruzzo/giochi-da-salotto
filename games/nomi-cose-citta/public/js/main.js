import { startClient } from '/js/kit/client.js';
import { joinView } from '/js/kit/ui.js';
import { phoneView } from './phone.js';
import { tvView } from './tv.js';

startClient({
  namespace: '/nomi-cose-citta',
  storage: 'ncc',
  views: {
    join: (ctx) => joinView({
      title: ['Nomi, cose', 'e città'],
      hints: {
        player: 'Scrivi le tue parole dal telefono.',
        admin: 'Giochi anche tu, in più avvii i turni e assegni i punti.',
        tv: 'Questo schermo mostra ruota, parole e punteggi a tutti.',
      },
    }, ctx),
    phone: phoneView,
    tv: tvView,
  },
});
