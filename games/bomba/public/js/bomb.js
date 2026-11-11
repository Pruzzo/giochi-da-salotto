// Il telefono dell'artificiere: la bomba, un modulo alla volta, e l'etichetta col numero di serie.
// Il server manda solo quello che si vede; la mossa giusta la sa solo lui.
import { h, fill } from '/js/kit/dom.js';
import { page } from '/js/kit/ui.js';
import { COLORS, bulb, compass, die, lever, moka, padlock, smorfia, thumb, trafficLight, wire } from './draw.js';
import { crosses, ending } from './common.js';

/** Lo zero col trattino in mezzo, così non si confonde con una lettera. */
const slashedZeros = (text) => [...text].map((c) => (c === '0' ? h('span', { class: 'zero' }, '0') : c));

const POSITIONS = ['sinistra', 'di mezzo', 'destra'];
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Un bottone che manda la mossa e si spegne finché il server non risponde. */
function key(label, onClick, props = {}) {
  return h('button', { type: 'button', ...props, onClick }, label);
}

// Ogni pannello riceve il modulo, `send(value)` e `draft`: le cose che l'artificiere sposta prima di confermare
// (leve, rotelle, lampadine, cifre), che restano finché non cambia la faccia del modulo.
const PANELS = {
  fili(mod, send) {
    const { wires, cut } = mod.face;
    return h('div', { class: 'wires' },
      wires.map((color, i) => h('button', {
        type: 'button', class: `wires__wire${cut.includes(i) ? ' is-cut' : ''}`, disabled: cut.includes(i),
        'aria-label': `Filo ${i + 1}${cut.includes(i) ? ', tagliato' : ''}`, onClick: () => send(i),
      }, wire(color, cut.includes(i), i))),
      h('p', { class: 'panel__hint' }, 'Tocca un filo per tagliarlo.'));
  },

  leve(mod, send, draft) {
    draft.levers ??= [...mod.face.start];
    const row = h('div', { class: 'levers' });
    const paint = () => fill(row, draft.levers.map((up, i) => h('button', {
      type: 'button', class: 'levers__lever', 'aria-label': `Leva ${i + 1}: ${up ? 'su' : 'giù'}`, 'aria-pressed': String(up),
      onClick: () => { draft.levers[i] = !draft.levers[i]; navigator.vibrate?.(8); paint(); },
    }, lever(up), h('span', { class: 'levers__pos' }, up ? 'su' : 'giù'))));
    paint();
    return h('div', { class: 'panel__stack' }, row, key('Conferma', () => send([...draft.levers]), { class: 'btn btn--ink btn--wide' }));
  },

  semaforo(mod, send) {
    return h('div', { class: 'semaforo' }, trafficLight(mod.face.light),
      h('div', { class: 'semaforo__keys' }, [['rosso', 'Rosso'], ['giallo', 'Giallo'], ['verde', 'Verde']].map(([c, label]) => key(
        h('span', { class: 'round-key__label' }, label), () => send(c),
        { class: 'round-key', style: { '--c': COLORS[c] }, 'aria-label': label }))));
  },

  parola(mod, send) {
    return h('div', { class: 'panel__stack' },
      h('div', { class: 'lcd', role: 'img', 'aria-label': `Schermino: ${mod.face.screen}` }, mod.face.screen),
      h('div', { class: 'keys keys--2' }, mod.face.keys.map((w) => key(w, () => send(w), { class: 'word-key' }))));
  },

  cassaforte(_mod, send, draft) {
    draft.code ??= '';
    const screen = h('div', { class: 'lcd lcd--code', 'aria-live': 'polite' });
    const paint = () => fill(screen, [0, 1, 2, 3].map((i) => h('span', { class: 'lcd__digit' }, draft.code[i] ? slashedZeros(draft.code[i]) : '·')));
    const type = (d) => { if (draft.code.length < 4) draft.code += d; navigator.vibrate?.(8); paint(); };
    const open = () => {
      if (draft.code.length < 4) return;
      const code = draft.code;
      draft.code = '';
      paint();
      send(code);
    };
    paint();
    const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
    return h('div', { class: 'safe' }, screen,
      h('div', { class: 'keys keys--3' },
        digits.map((d) => key(d, () => type(d), { class: 'pad-key' })),
        key('Cancella', () => { draft.code = ''; paint(); }, { class: 'pad-key pad-key--small' }),
        key('0', () => type('0'), { class: 'pad-key' }),
        key('Apri', open, { class: 'pad-key pad-key--small pad-key--go' })));
  },

  lucchetto(mod, send, draft) {
    draft.letters ??= [...mod.face.start];
    const wheels = h('div', { class: 'lock__wheels' });
    const turn = (i, by) => {
      draft.letters[i] = ALPHABET[(ALPHABET.indexOf(draft.letters[i]) + by + 26) % 26];
      navigator.vibrate?.(6);
      paint();
    };
    const paint = () => fill(wheels, draft.letters.map((c, i) => h('div', { class: 'wheel' },
      key('▲', () => turn(i, -1), { class: 'wheel__btn', 'aria-label': `Rotella ${i + 1} su` }),
      h('span', { class: 'wheel__window', 'aria-label': `Rotella ${i + 1}: ${c}` },
        h('span', { class: 'wheel__ghost' }, ALPHABET[(ALPHABET.indexOf(c) + 25) % 26]),
        h('span', { class: 'wheel__letter' }, c),
        h('span', { class: 'wheel__ghost' }, ALPHABET[(ALPHABET.indexOf(c) + 1) % 26])),
      key('▼', () => turn(i, 1), { class: 'wheel__btn', 'aria-label': `Rotella ${i + 1} giù` }))));
    paint();
    return h('div', { class: 'panel__stack' },
      h('div', { class: 'lock', style: { '--c': COLORS[mod.face.color] } }, padlock(), h('div', { class: 'lock__body' }, wheels)),
      key('Apri', () => send([...draft.letters]), { class: 'btn btn--ink btn--wide' }));
  },

  bandiera(mod, send) {
    return h('div', { class: 'flag' },
      h('span', { class: 'flag__pole', 'aria-hidden': 'true' }),
      h('div', { class: 'flag__cloth' }, mod.face.stripes.map((c, i) => key('', () => send(i), {
        class: 'flag__stripe', style: { '--c': COLORS[c] }, 'aria-label': `Striscia ${POSITIONS[i]}`,
      }))));
  },

  dado(mod, send) {
    return h('div', { class: 'panel__stack' },
      h('div', { class: 'dice-tray' }, die(mod.face.color, mod.face.value)),
      h('div', { class: 'keys keys--3' }, [1, 2, 3, 4, 5, 6].map((n) => key(String(n), () => send(n), { class: 'pad-key' }))));
  },

  lampadine(mod, send, draft) {
    draft.bulbs ??= [...mod.face.start];
    const row = h('div', { class: 'bulbs' });
    const paint = () => fill(row, draft.bulbs.map((on, i) => key(bulb(i + 1, on), () => {
      draft.bulbs[i] = !draft.bulbs[i];
      navigator.vibrate?.(8);
      paint();
    }, { class: 'bulbs__bulb', 'aria-label': `Lampadina ${i + 1}: ${on ? 'accesa' : 'spenta'}`, 'aria-pressed': String(on) })));
    paint();
    return h('div', { class: 'panel__stack' }, row, key('Conferma', () => send([...draft.bulbs]), { class: 'btn btn--ink btn--wide' }));
  },

  tombola(mod, send) {
    return h('div', { class: 'panel__stack' },
      h('div', { class: 'board-screen' }, smorfia(mod.face.picture, 'art art--big')),
      h('div', { class: 'keys keys--4' }, mod.face.keys.map((n) => key(String(n), () => send(n), { class: 'pad-key pad-key--num' }))));
  },

  moka(mod, send) {
    return h('div', { class: 'panel__stack' }, moka(mod.face.needle),
      h('div', { class: 'keys keys--1' },
        key('Alza la fiamma', () => send('alza'), { class: 'word-key' }),
        key('Abbassa', () => send('abbassa'), { class: 'word-key' }),
        key('Spegni', () => send('spegni'), { class: 'word-key' })));
  },

  bussola(mod, send) {
    return h('div', { class: 'panel__stack' }, compass(mod.face.arrow),
      h('div', { class: 'keys keys--4' }, ['N', 'S', 'E', 'O'].map((d) => key(d, () => send(d), { class: 'pad-key pad-key--num' }))));
  },
};

/** I passi dei moduli a più passi: tre pallini, pieni quelli fatti. */
function steps(mod) {
  if (mod.steps < 2) return null;
  return h('span', { class: 'steps', 'aria-label': `Passo ${Math.min(mod.step + 1, mod.steps)} di ${mod.steps}` },
    Array.from({ length: mod.steps }, (_, i) => h('span', { class: `steps__dot${i < mod.step ? ' is-done' : ''}` })));
}

export function bombPhone(state, { act }) {
  let selected = 0;
  let shownKey = '';
  let lastErrors = null;
  let current = state;
  const drafts = new Map(); // faceId -> quello che l'artificiere ha spostato
  let sending = false;

  const squares = h('nav', { class: 'squares', 'aria-label': 'Moduli' });
  const serial = h('span', { class: 'label__serial' });
  const errs = h('span', { class: 'label__errors' });
  const label = h('div', { class: 'label' }, h('span', { class: 'label__what' }, 'N. di serie'), serial, errs);
  const panel = h('section', { class: 'module' });
  const flash = h('div', { class: 'flash', 'aria-hidden': 'true' });
  const done = h('div', { class: 'bomb-done', hidden: true });
  const el = page('bomb', squares, label, panel, done, flash);

  const bomb = (s) => s.teams.find((t) => t.id === s.you.teamId)?.game;

  function send(index, mod, value) {
    if (sending) return;
    sending = true;
    act('answer', { module: index, faceId: mod.faceId, value }, () => { sending = false; });
  }

  function drawPanel(b) {
    const mod = b.modules[selected];
    let draft = drafts.get(mod.faceId);
    if (!draft) drafts.set(mod.faceId, (draft = {}));
    fill(panel,
      h('header', { class: 'module__head' },
        h('span', { class: 'module__n' }, `Modulo ${selected + 1}`),
        steps(mod),
        h('span', { class: `lamp${mod.solved ? ' is-on' : ''}`, 'aria-label': mod.solved ? 'Lucina verde: risolto' : 'Lucina spenta' })),
      mod.solved
        ? h('div', { class: 'module__solved' },
          h('p', { class: 'shout shout--small' }, 'Risolto!'),
          nextUnsolved(b) !== null && h('button', { class: 'btn btn--ghost btn--wide', onClick: () => select(nextUnsolved(b)) }, 'Prossimo modulo'))
        : h('div', { class: `module__body module__body--${mod.type}` }, PANELS[mod.type](mod, (v) => send(selected, mod, v), draft)));
  }

  function nextUnsolved(b) {
    for (let k = 1; k <= b.modules.length; k++) {
      const i = (selected + k) % b.modules.length;
      if (!b.modules[i].solved) return i;
    }
    return null;
  }

  function select(i) {
    selected = i;
    shownKey = '';
    update(current);
  }

  function update(s) {
    current = s;
    const team = s.teams.find((t) => t.id === s.you.teamId);
    const b = bomb(s);
    if (!b?.modules) return;
    if (serial.dataset.serial !== b.serial) {
      serial.dataset.serial = b.serial;
      fill(serial, slashedZeros(b.serial));
    }
    fill(errs, crosses(b.errors, b.maxErrors));
    errs.setAttribute('aria-label', `Errori: ${b.errors} su ${b.maxErrors}`);
    if (lastErrors !== null && b.errors > lastErrors) {
      navigator.vibrate?.([180, 80, 180]);
      flash.classList.remove('is-on');
      void flash.offsetWidth; // riparte l'animazione
      flash.classList.add('is-on');
    }
    lastErrors = b.errors;
    fill(squares, b.modules.map((m, i) => h('button', {
      type: 'button', class: `square${i === selected ? ' is-open' : ''}${m.solved ? ' is-solved' : ''}`,
      'aria-label': `Modulo ${i + 1}${m.solved ? ', risolto' : ''}`, 'aria-pressed': String(i === selected),
      onClick: () => select(i),
    }, thumb(m.type, 'square__thumb'), h('span', { class: 'square__n' }, String(i + 1)), h('span', { class: `square__lamp${m.solved ? ' is-on' : ''}` }))));
    const mod = b.modules[selected];
    const panelKey = `${selected}:${mod.faceId}:${mod.solved}:${mod.face.cut?.length ?? ''}`;
    if (panelKey !== shownKey) {
      shownKey = panelKey;
      drawPanel(b);
    }
    done.hidden = !team.done;
    panel.hidden = team.done;
    if (team.done) fill(done, ending(team));
  }

  return { el, update };
}
