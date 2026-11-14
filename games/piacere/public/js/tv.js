import { h, fill } from '/js/kit/dom.js';
import { coverTv, finalTv, tvPage } from '/js/kit/ui.js';
import { person } from './people.js';
import { sounds } from './audio.js';
import { clock, countdownNumber, rules } from './phone.js';

export function tvView(state) {
  const views = { lobby, intro, countdown, quiz, reveal, final: finalTv };
  return views[state.phase](state);
}

function lobby() {
  return coverTv({
    title: 'Piacere!',
    subject: { label: 'Regole', text: rules },
    cta: (admin) => `${admin} farà entrare gli ospiti quando siete tutti.`,
  });
}

// ---------- Prima parte: la fila ----------

function intro(state) {
  const n = state.lineup.length;
  const count = h('p', { class: 'pencil intro-head__count' });
  const say = h('h1', { class: 'say intro-head__say' }, 'Si presentano: guardateli bene!');
  const spots = state.lineup.map((x) => h('div', { class: 'lineup__spot' }, person(x.t, x.o)));
  const tags = state.lineup.map(() => h('div', { class: 'names__slot' }));
  const line = h('div', { class: 'lineup', style: { '--n': n } }, spots);
  const el = tvPage('intro',
    h('header', { class: 'intro-head' }, say, count),
    line,
    h('div', { class: 'names', style: { '--n': n }, 'aria-live': 'polite' }, tags));
  let shown = -2;
  return {
    el,
    update(s) {
      if (s.introIndex === shown) return;
      shown = s.introIndex;
      line.classList.toggle('is-presenting', shown >= 0);
      spots.forEach((spot, i) => spot.classList.toggle('is-on', i === shown));
      tags.forEach((tag, i) => fill(tag, i === shown && s.introName && h('p', { class: 'nametag' }, h('small', {}, 'Piacere,'), `${s.introName}!`)));
      count.textContent = shown >= 0 ? `${shown + 1} di ${n}` : '';
      if (shown >= 0) sounds.hello();
    },
  };
}

function countdown(state) {
  const n = h('p', { class: 'countdown__n' });
  const beat = countdownNumber(n, () => sounds.beat());
  const el = tvPage('countdown', n,
    state.level !== 'facile' && h('p', { class: 'countdown__warn' }, 'Occhio ai vestiti!'),
    h('p', { class: 'say countdown__say' }, 'Ora tornano uno alla volta, sul vostro telefono. Chi è?'));
  return { el, update(s) { beat.sync(s.remainingMs ?? 0); }, destroy: beat.destroy };
}

// ---------- Seconda parte: la gara ----------

function quiz(state) {
  const watch = h('p', { class: 'race-head__clock' });
  const board = h('ol', { class: 'race-board' });
  const strangers = state.quizLength - state.introCount;
  const el = tvPage('race',
    h('header', { class: 'race-head' },
      h('div', { class: 'race-head__text' },
        h('h1', { class: 'say race-head__say' }, 'Chi è? Rispondete dal telefono'),
        h('p', { class: 'pencil race-head__note' }, `${state.quizLength} incontri: le ${state.introCount} persone di prima${strangers ? ` e ${strangers === 1 ? 'uno sconosciuto' : `${strangers} sconosciuti`}` : ''}. Ogni errore costa ${state.penaltyMs / 1000} secondi.`)),
      watch),
    board);
  let base = performance.now() - (state.elapsedMs ?? 0);
  let finished = 0;
  const tick = setInterval(() => { watch.textContent = clock(performance.now() - base); }, 250);
  return {
    el,
    update(s) {
      base = performance.now() - (s.elapsedMs ?? 0);
      watch.textContent = clock(s.elapsedMs ?? 0);
      const racers = s.players.filter((p) => p.racing);
      const done = racers.filter((p) => p.doneMs !== null).length;
      if (done > finished) sounds.finish();
      finished = done;
      board.style.setProperty('--n', Math.max(racers.length, 1));
      board.style.setProperty('--len', s.quizLength);
      fill(board, racers.map((p) => {
        const errors = p.marks.filter((m) => !m).length;
        const isDone = p.doneMs !== null;
        return h('li', { class: `racer${isDone ? ' is-done' : ''}${p.online ? '' : ' is-away'}` },
          h('span', { class: 'written is-name racer__name' }, p.name),
          h('span', { class: 'racer__marks', 'aria-label': `${p.marks.length} risposte su ${s.quizLength}, ${errors} sbagliate` },
            Array.from({ length: s.quizLength }, (_, i) => h('span', { class: `hit${i < p.marks.length ? (p.marks[i] ? ' hit--ok' : ' hit--ko') : ''}` }))),
          h('span', { class: 'racer__time' }, isDone ? clock(p.doneMs) : ''),
          h('span', { class: 'racer__pos' }, isDone ? (errors ? `+${errors * s.penaltyMs / 1000} s` : 'netto') : ''));
      }));
    },
    destroy: () => clearInterval(tick),
  };
}

// ---------- Fine turno ----------

function reveal(state) {
  const say = h('h1', { class: 'say score__say' });
  const table = h('div', { class: 'score__table' });
  const gallery = h('section', { class: 'gallery', 'aria-label': 'Chi era chi' });
  const el = tvPage('score',
    h('section', { class: 'score__main' }, say, table,
      h('p', { class: 'pencil score__note' }, `Totale = tempo + ${state.penaltyMs / 1000} secondi per ogni errore.`),
      h('p', { class: 'pencil score__note' }, 'A destra chi era chi, e quanti l’hanno riconosciuto. ', h('span', { class: 'red' }, 'I nomi colorati sono gli sconosciuti.'))),
    gallery);
  requestAnimationFrame(() => sounds.reveal());
  return {
    el,
    update(s) {
      const rows = s.players.filter((p) => p.result).sort((a, b) => a.result.totalMs - b.result.totalMs);
      const first = rows.filter((p) => p.result.place === 1).map((p) => p.name);
      say.textContent = !first.length ? `Turno ${s.round}: nessuno ha risposto`
        : first.length > 1 ? `Turno ${s.round}: pari merito tra ${first.join(' e ')}!` : `Turno ${s.round}: ha vinto ${first[0]}!`;
      table.style.setProperty('--n', Math.max(rows.length, 1));
      fill(table,
        h('div', { class: 'score-row score-row--head' }, h('span', {}), h('span', {}, 'Nome'), h('span', {}, 'Tempo'), h('span', {}, 'Errori'), h('span', {}, 'Totale'), h('span', {}, 'Punti')),
        rows.map((p, i) => h('div', { class: 'score-row reveal', style: { '--i': i } },
          h('span', { class: 'pencil' }, `${p.result.place}°`),
          h('span', { class: 'written is-name' }, p.name),
          h('span', {}, clock(p.result.timeMs)),
          h('span', {}, p.result.errors ? `${p.result.errors} × ${s.penaltyMs / 1000} s` : '—'),
          h('span', {}, h('b', {}, clock(p.result.totalMs))),
          h('span', { class: 'red' }, `+${p.result.points}`))));
      const n = s.gallery.length;
      const cols = Math.min(5, Math.ceil(Math.sqrt(n * 1.4)));
      gallery.style.setProperty('--cols', cols);
      gallery.style.setProperty('--rows', Math.ceil(n / cols));
      fill(gallery, s.gallery.map((x) => h('div', { class: `gallery__item${x.stranger ? ' is-new' : ''}` },
        person(x.t, x.o),
        h('span', { class: 'gallery__name' }, x.name),
        h('span', { class: 'gallery__hits' }, `${x.hits} su ${s.racers}`))));
    },
  };
}
