// Il nome game.local in rete locale (mDNS): chi lo cerca riceve l'indirizzo del server.
// È una comodità in più: il QR code usa sempre l'indirizzo numerico, che funziona ovunque.
import makeMdns from 'multicast-dns';

export const LOCAL_NAME = 'game.local';

/** Una risposta per ogni domanda sul nostro nome. Chi chiede da una porta diversa dalla 5353 vuole la risposta diretta. */
export function answerQuery(query, rinfo, ip, respond) {
  const asked = query.questions.filter((q) => q.name.toLowerCase() === LOCAL_NAME && (q.type === 'A' || q.type === 'ANY'));
  if (asked.length === 0) return;
  const answer = { name: LOCAL_NAME, type: 'A', class: 'IN', data: ip };
  if (rinfo.port === 5353) respond({ answers: [{ ...answer, ttl: 120, flush: true }] });
  else respond({ id: query.id, questions: asked, answers: [{ ...answer, ttl: 10 }] }, rinfo);
}

/** Inizia a rispondere per game.local. Se la rete non lo permette, il server funziona lo stesso. */
export function announce(ip) {
  // bind esplicito: legata al solo indirizzo della scheda, la socket non riceverebbe il multicast.
  const mdns = makeMdns({ interface: ip, bind: '0.0.0.0', reuseAddr: true });
  mdns.on('query', (query, rinfo) => answerQuery(query, rinfo, ip, (res, to) => mdns.respond(res, to)));
  mdns.on('error', (error) => console.error(`Nome ${LOCAL_NAME} non disponibile: ${error.message}`));
  return mdns;
}
