import { startClient } from '/js/kit/client.js';
import { joinView } from '/js/kit/ui.js';
import { phoneView } from './phone.js';
import { tvView } from './tv.js';

startClient({
  namespace: '/codice-segreto',
  storage: 'codice',
  views: {
    join: (ctx) => joinView({
      title: ['Codice', 'segreto'],
      hints: {
        player: 'Componi le file di pastelli dal telefono.',
        admin: 'Giochi anche tu, in più scegli le regole e fai partire i turni. Il codice lo sceglie lo schermo: non lo vedi nemmeno tu.',
        tv: 'Questo schermo mostra il codice coperto, la gara e la classifica.',
      },
    }, ctx),
    phone: phoneView,
    tv: tvView,
  },
});
