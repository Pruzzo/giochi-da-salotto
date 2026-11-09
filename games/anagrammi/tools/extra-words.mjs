// Parole invariabili che morph-it tiene in liste separate: preposizioni, congiunzioni,
// avverbi, pronomi, articoli, numeri, interiezioni comuni. Senza accenti, come le scrive un giocatore.
export const EXTRA = `
per tra fra con senza sopra sotto dentro fuori dietro davanti verso presso contro lungo oltre circa
dal dai dalla dalle dallo dagli del dei della delle dello degli nel nei nella nelle nello negli
sul sui sulla sulle sullo sugli col coi alla alle allo agli
che chi cui come dove quando quanto quanta quanti quante quale quali perche poiche mentre siccome
anche ancora gia mai sempre spesso subito presto tardi oggi ieri domani adesso allora dopo prima poi
qui qua li la lassu laggiu ovunque altrove vicino lontano accanto insieme appena quasi molto poco
troppo tanto piu meno bene male meglio peggio cosi forse certo davvero proprio infatti invece pure
neanche nemmeno neppure ossia oppure ovvero dunque quindi pero tuttavia comunque eppure magari
anzi inoltre almeno soltanto solamente persino perfino ecco ciao grazie prego basta evviva
non nessuno nessuna niente nulla qualcuno qualcuna qualcosa ognuno ognuna ogni tutto tutta tutti tutte
alcuno alcuna alcuni alcune altro altra altri altre stesso stessa stessi stesse tale tali
gli loro lui lei noi voi essi esse egli ella esso essa sua suo suoi sue mio mia miei mie tuo tua tuoi tue
nostro nostra nostri nostre vostro vostra vostri vostre questo questa questi queste quello quella
quelli quelle quel quei codesto ciascuno ciascuna una uno
due tre quattro cinque sei sette otto nove dieci undici dodici tredici venti trenta cento mille
primo prima secondo seconda terzo terza ultimo ultima mezzo mezza doppio
`.split(/\s+/).filter(Boolean);

// Parole che finiscono per consonante e sono davvero italiane, o entrate nell'uso da tanto tempo.
// Tutte le altre che finiscono per consonante sono sigle (usl, srl) o inglese (blog, show): fuori.
export const CONSONANT_END = new Set(`
per con non nel del dal col sul tra fra bar bus gas tram film sport autobus camion sud nord est ovest
gol golf club clan chef rock tour test virus lapis ictus humus bis lord fan don san gran bel buon qual
quel tal mar ciel fil sol val cuor fior amor sen pien ben mal fin vin pan can gal tir
radar condor bazar slogan revers alcool tennis sci cognac album rum
`.split(/\s+/).filter(Boolean));
