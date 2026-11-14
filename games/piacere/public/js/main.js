import { startClient } from '/js/kit/client.js';
import { joinView } from '/js/kit/ui.js';
import { phoneView } from './phone.js';
import { tvView } from './tv.js';

startClient({
  namespace: '/piacere',
  storage: 'piacere',
  views: {
    join: (ctx) => joinView({
      title: ['Piacere!'],
      hints: {
        player: 'Guardi chi si presenta sulla TV, poi dal telefono dici chi è.',
        admin: 'Giochi anche tu, in più scegli quante persone arrivano e fai partire i turni.',
        tv: 'Questo schermo mostra la fila delle persone, la gara e la classifica.',
      },
    }, ctx),
    phone: phoneView,
    tv: tvView,
  },
});
