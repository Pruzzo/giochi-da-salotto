// Testo senza Intl né ICU: Node per Android (nodejs-mobile) può essere compilato senza,
// e lì String.prototype.normalize non toglie gli accenti e /\p{L}/u è un errore di sintassi.

const FROM = 'àáâãäåāăąèéêëēĕėęěìíîïĩīĭįòóôõöøōŏőùúûüũūŭůűųçćĉċčñńņňýÿŷśšşźżžğłřŕťţďľĺÀÁÂÃÄÅĀĂĄÈÉÊËĒĔĖĘĚÌÍÎÏĨĪĬĮÒÓÔÕÖØŌŎŐÙÚÛÜŨŪŬŮŰŲÇĆĈĊČÑŃŅŇÝŸŶŚŠŞŹŻŽĞŁŘŔŤŢĎĽĹ';
const TO = 'aaaaaaaaaeeeeeeeeeiiiiiiiiooooooooouuuuuuuuuucccccnnnnyyyssszzzglrrttdllAAAAAAAAAEEEEEEEEEIIIIIIIIOOOOOOOOOUUUUUUUUUUCCCCCNNNNYYYSSSZZZGLRRTTDLL';
const BASE = new Map([...FROM].map((c, i) => [c, TO[i]]));

/** Toglie gli accenti delle lettere latine: "Città" diventa "Citta". */
export function stripAccents(text) {
  return String(text ?? '')
    .replace(/[\u0300-\u036f]/g, '') // accenti già separati dalla lettera
    .replace(/[^\u0000-\u007f]/g, (c) => BASE.get(c) ?? c);
}

/** Spazi e punteggiatura (anche tipografica, come l'apostrofo curvo) che separano le parole. */
export const SEPARATORS = /[\s\u0000-\u002f\u003a-\u0040\u005b-\u0060\u007b-\u00bf\u00d7\u00f7\u2000-\u206f\u3000-\u303f]+/g;
