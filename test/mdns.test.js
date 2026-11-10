import assert from 'node:assert/strict';
import test from 'node:test';
import { answerQuery } from '../server/mdns.js';

const IP = '192.168.1.42';
const ask = (name, type = 'A', port = 5353) => {
  const sent = [];
  answerQuery({ id: 7, questions: [{ name, type }] }, { port, address: '192.168.1.9' }, IP, (res, to) => sent.push({ res, to }));
  return sent;
};

test('risponde a game.local con l\'indirizzo del server, senza badare alle maiuscole', () => {
  for (const name of ['game.local', 'GAME.local']) {
    const [{ res, to }] = ask(name);
    assert.equal(res.answers[0].data, IP);
    assert.equal(to, undefined); // a tutta la rete
  }
});

test('ignora altri nomi e altri tipi', () => {
  assert.equal(ask('stampante.local').length, 0);
  assert.equal(ask('game.local', 'AAAA').length, 0);
});

test('chi chiede da un\'altra porta riceve la risposta diretta', () => {
  const [{ res, to }] = ask('game.local', 'A', 40000);
  assert.equal(res.id, 7);
  assert.equal(res.questions[0].name, 'game.local');
  assert.equal(to.port, 40000);
});
