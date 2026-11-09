# Dizionario di Anagrammi

`words.txt` contiene le parole italiane da 3 a 8 lettere accettate dal gioco, minuscole e senza accenti. `seeds.txt` contiene le parole di partenza da 8 lettere, tra le più usate e con almeno 25 anagrammi possibili.

## Fonti

- **morph-it!** di Marco Baroni e Eros Zanchetta (Università di Bologna), tramite i pacchetti npm `italian-words-dict`, `italian-adjectives-dict` e `italian-verbs-dict` 3.4.0 di Ludan Stoecklé. morph-it è distribuito con doppia licenza Creative Commons Attribution-ShareAlike 2.0 e GNU LGPL: `words.txt` ne è un'opera derivata e resta sotto le stesse licenze. Vedi `CC-BY-SA-2.0.txt` e `readme-morph-it.txt`.
- **an-array-of-italian-words** 1.2.0 (MIT), usato solo per ordinare le parole di partenza per frequenza d'uso. Nessuna parola viene accettata perché compare in questa lista.
- `tools/extra-words.mjs`: parole invariabili aggiunte a mano (preposizioni, avverbi, pronomi, numeri).

Ai plurali dei nomi in *-cia/-gia* si aggiunge la forma scolastica (spiagge, camicie) quando morph-it ne riporta un'altra.

## Rigenerare

Vedi l'intestazione di `tools/build-dict.mjs`.
