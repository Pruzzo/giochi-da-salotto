import { startClient } from '/js/kit/client.js';
import { joinView } from '/js/kit/ui.js';
import { phoneView } from './phone.js';
import { tvView } from './tv.js';

startClient({
  namespace: '/anagrammi',
  storage: 'anagrammi',
  views: {
    join: (ctx) => joinView({
      title: ['Anagrammi'],
      hints: {
        player: 'Componi le parole sul telefono con le lettere estratte.',
        admin: 'Giochi anche tu, in più scegli il tempo e fai partire i turni.',
        tv: 'Questo schermo mostra le lettere, il tempo e quante parole trova ognuno.',
      },
    }, ctx),
    phone: phoneView,
    tv: tvView,
  },
});
