// Le pagine comuni dei giochi a squadre da due (games/shared/teams.js): sala d'attesa pari,
// scelta del colore, nome, istruzioni e ruoli, attesa, risultati del turno, TV divisa in zone.
// Ogni gioco passa solo le sue parti: le istruzioni, le impostazioni, il telefono e la zona TV durante il turno.
import { h, fill } from './dom.js';
import { createTimer } from './timer.js';
import { coverTv, finalPhone, finalTv, page, rosterItems, switchGame, tvPage } from './ui.js';

export const AWAY_WARNING = 'Il tuo compagno non può vedere il tuo schermo: allontanati da lui.';

export const clock = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
const people = (n) => (n === 1 ? 'un giocatore' : `${n} giocatori`);
const Cap = (text) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * @param spec.title     nome del gioco
 * @param spec.goal      una riga: come si vince
 * @param spec.roles     { roleId: { label, short, brief: [righe] } } istruzioni di ogni ruolo
 * @param spec.settings  [{ key, label, text(value) }] impostazioni del turno, nell'ordine
 * @param spec.phone     { playing(state, ctx, team) } il telefono di chi gioca durante il turno
 * @param spec.tv        { zone(state, team) -> { el, update(s, team), destroy? }, legend?(state) } la zona TV di una squadra
 * @param spec.outcome   (team, state) => testo del risultato della squadra a fine turno
 * @param spec.sounds    { go?, done?, end? } facoltativi
 */
export function teamViews(spec) {
  const settingsText = (s) => spec.settings.map((x) => `${x.label}: ${x.text(s.settings[x.key])}`).join(' · ');
  const roleLabel = (id) => spec.roles[id]?.label ?? '';

  // ---------- Pezzi comuni ----------

  function settingsBlock(s, act) {
    return h('section', { class: 'settings' }, spec.settings.map((x) => h('div', { class: 'block' },
      h('h2', { class: 'heading' }, x.label),
      h('div', { class: 'choice', role: 'group', 'aria-label': x.label },
        s.settingOptions[x.key].map((value) => h('button', {
          class: 'choice__item', 'aria-pressed': String(value === s.settings[x.key]),
          onClick: () => act('setSettings', { values: { [x.key]: value } }),
        }, x.text(value)))))));
  }

  function chip(team) {
    return h('span', { class: 'team-chip', style: { '--team': team.color.hex } }, team.name);
  }

  function waitingPhone(state, { leave }) {
    const body = h('div', { class: 'wait-body' });
    const el = page('wait',
      h('header', { class: 'phone-head' }, h('h1', { class: 'hello' }, `Ciao ${state.you.name}!`), h('button', { class: 'link', onClick: leave }, 'Esci')),
      body);
    return {
      el,
      update(s) {
        const others = s.waiting.filter((n) => n !== s.you.name).length;
        fill(body,
          h('h1', { class: 'shout shout--small' }, 'Sei in attesa'),
          h('p', { class: 'note' }, s.phase === 'teams'
            ? 'Le squadre nuove stanno scegliendo. Tu entri alla fine del prossimo turno, appena c’è un altro giocatore con te.'
            : others
              ? 'Alla fine del turno sceglierete la squadra.'
              : 'Entri alla fine del turno, appena arriva un altro giocatore con cui fare squadra.'),
          h('p', { class: 'note' }, 'Intanto guarda la TV.'));
      },
    };
  }

  // ---------- Telefono ----------

  function lobbyPhone(state, ctx) {
    const { act, leave } = ctx;
    const list = h('ul', { class: 'roster' });
    const status = h('p', { class: 'note' });
    const claim = h('button', { class: 'btn btn--ghost btn--wide', onClick: () => act('claimAdmin') }, 'Diventa amministratore');
    const settings = h('div');
    const go = h('button', { class: 'btn btn--red btn--wide', onClick: () => act('start') }, 'Via: scegliete le squadre');
    const el = page('lobby',
      h('header', { class: 'phone-head' }, h('h1', { class: 'hello' }, `Ciao ${state.you.name}!`), h('button', { class: 'link', onClick: leave }, 'Esci')),
      status, claim,
      h('section', { class: 'block' }, h('h2', { class: 'heading' }, 'In classe'), list),
      settings,
      switchGame(state, act),
      state.you.isAdmin && h('div', { class: 'dock' }, go));
    return {
      el,
      update(s) {
        const n = s.players.length;
        const odd = n % 2 === 1;
        const admin = s.players.find((p) => p.isAdmin);
        status.textContent = n < 2 ? 'Si gioca a squadre di due: serve almeno un altro giocatore.'
          : odd ? `Siete in ${n}: serve ancora un giocatore per fare squadre da due.`
          : s.you.isAdmin ? `Siete in ${n}: ${n / 2} ${n === 2 ? 'squadra' : 'squadre'}. Quando ci siete tutti, tocca Via.`
          : s.adminOnline ? `Siete in ${n}. In attesa che ${admin?.name} dia il via.` : 'Manca un amministratore per iniziare.';
        claim.hidden = s.you.isAdmin || s.adminOnline;
        fill(list, rosterItems(s, act));
        if (s.you.isAdmin) fill(settings, settingsBlock(s, act));
        else fill(settings, h('p', { class: 'note' }, `A squadre di due, solo in numero pari. ${settingsText(s)}.`));
        go.disabled = n < 2 || odd;
      },
    };
  }

  function teamsPhone(state, ctx) {
    if (!state.you.choosing && !state.you.teamId) return waitingPhone(state, ctx);
    const { act, leave } = ctx;
    const status = h('p', { class: 'note' });
    const grid = h('div', { class: 'team-pick' });
    const el = page('lobby',
      h('header', { class: 'phone-head' }, h('h1', { class: 'hello' }, 'Scegli la squadra'), h('button', { class: 'link', onClick: leave }, 'Esci')),
      status, grid);
    return {
      el,
      update(s) {
        const open = s.teams.filter((t) => !t.fixed);
        if (!s.you.choosing) {
          status.textContent = 'La tua squadra resta com’è. Stanno scegliendo i giocatori nuovi: guarda la TV.';
          fill(grid);
          return;
        }
        const mine = s.you.teamId;
        status.textContent = mine
          ? 'Puoi ancora cambiare finché le squadre non sono tutte piene.'
          : 'Tocca un colore per entrare in quella squadra. Ogni squadra è da due.';
        fill(grid, open.map((t) => {
          const full = t.members.length >= 2 && t.id !== mine;
          return h('button', {
            class: `team-pick__btn${t.id === mine ? ' is-mine' : ''}`, style: { '--team': t.color.hex },
            disabled: full, 'aria-pressed': String(t.id === mine),
            onClick: () => act('pickTeam', { teamId: t.id }),
          },
          h('span', { class: 'team-pick__color' }, `Squadra ${t.color.name}`),
          h('span', { class: 'team-pick__who' }, t.members.length ? t.members.map((m) => m.name).join(' e ') : 'vuota'),
          full && h('span', { class: 'team-pick__full' }, 'piena'));
        }));
      },
    };
  }

  function briefingPhone(state, ctx) {
    if (!state.you.teamId) return waitingPhone(state, ctx);
    const { act, leave } = ctx;
    const myTeam = (s) => s.teams.find((t) => t.id === s.you.teamId);
    const team0 = myTeam(state);
    const nameBox = h('div', { class: 'block team-name' });
    const nameInput = state.you.namer && h('input', {
      class: 'field', maxLength: 20, value: team0.customName, placeholder: team0.name, 'aria-label': 'Nome della squadra',
      enterKeyHint: 'done', onChange: (e) => act('setTeamName', { name: e.target.value }),
    });
    const rolesBox = h('div', { class: 'role-pick' });
    const admin = h('div');
    const go = h('button', { class: 'btn btn--red btn--wide', onClick: () => act('go') }, 'Via!');
    const goNote = h('p', { class: 'note' });
    const el = page('briefing',
      h('header', { class: 'phone-head' }, h('h1', { class: 'hello' }, spec.title), h('button', { class: 'link', onClick: leave }, 'Esci')),
      nameBox,
      h('section', { class: 'block brief' },
        h('h2', { class: 'heading' }, 'Come si gioca'),
        h('p', {}, spec.goal),
        h('p', { class: 'brief__warn' }, AWAY_WARNING)),
      h('section', { class: 'block' }, h('h2', { class: 'heading' }, team0.played ? 'Il tuo ruolo in questo turno' : 'Scegli il tuo ruolo'), rolesBox),
      admin,
      state.you.isAdmin && h('div', { class: 'dock' }, goNote, go));
    if (nameInput) nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') e.target.blur(); });
    return {
      el,
      update(s) {
        const team = myTeam(s);
        if (!team) return;
        const mate = team.members.find((m) => m.id !== s.you.id);
        if (nameInput) {
          if (document.activeElement !== nameInput) nameInput.value = team.customName;
          fill(nameBox, h('h2', { class: 'heading' }, 'Nome della squadra'), nameInput, chip(team));
        } else {
          fill(nameBox, h('h2', { class: 'heading' }, 'La tua squadra'), chip(team),
            !team.customName && mate && h('p', { class: 'note' }, `${team.members[0].name} sta scegliendo il nome.`));
        }
        fill(rolesBox, s.roles.map((r) => {
          const mine = s.you.teamRole === r.id;
          const taken = !mine && mate?.role === r.id;
          const info = spec.roles[r.id];
          return h('button', {
            class: `role-pick__btn${mine ? ' is-mine' : ''}${taken ? ' is-taken' : ''}`,
            disabled: taken || (team.played && !mine), 'aria-pressed': String(mine),
            onClick: () => act('chooseRole', { roleId: r.id }),
          },
          h('span', { class: 'role-pick__label' }, info.label),
          h('span', { class: 'role-pick__short' }, info.short),
          taken && h('span', { class: 'role-pick__who' }, `l’ha scelto ${mate.name}`),
          mine && h('span', { class: 'role-pick__who' }, 'tu'));
        }));
        const myRole = s.you.teamRole && spec.roles[s.you.teamRole];
        if (myRole) {
          rolesBox.append(h('ul', { class: 'brief__list' }, myRole.brief.map((line) => h('li', {}, line))));
        }
        if (s.you.isAdmin) {
          fill(admin, settingsBlock(s, act));
          const missing = s.teams.filter((t) => !t.ready).length;
          go.disabled = missing > 0;
          goNote.textContent = missing ? `Aspettiamo i ruoli di ${missing === 1 ? 'una squadra' : `${missing} squadre`}.` : 'Tutti pronti: si parte quando vuoi.';
        }
      },
    };
  }

  /** Durante il turno: chi aspetta guarda la TV, chi gioca ha la pagina del gioco; sopra, la pausa. */
  function playingPhone(state, ctx) {
    if (!state.you.teamId || !state.teams.find((t) => t.id === state.you.teamId)?.playing) return waitingPhone(state, ctx);
    const team = state.teams.find((t) => t.id === state.you.teamId);
    const inner = spec.phone.playing(state, ctx, team);
    const banner = h('p', { class: 'pause-banner', role: 'status', hidden: true });
    const stop = state.you.isAdmin && h('button', { class: 'link pause-stop', onClick: () => ctx.act('stopTurn') }, 'Ferma il turno per tutti');
    const el = h('div', { class: 'team-play' }, banner, inner.el, stop);
    return {
      el,
      update(s) {
        banner.hidden = !s.paused;
        banner.textContent = s.paused ? `In pausa: ${s.paused.name} si è disconnesso. Si riparte quando rientra.` : '';
        inner.update(s, s.teams.find((t) => t.id === s.you.teamId));
      },
      destroy: () => inner.destroy?.(),
    };
  }

  function resultPhone(state, { act }) {
    const body = h('div', { class: 'wait-body' });
    const el = page('wait', body, state.you.isAdmin && h('div', { class: 'dock' },
      h('button', { class: 'btn btn--red btn--wide', onClick: () => act('nextTurn') }, 'Nuovo turno'),
      h('button', { class: 'btn btn--ghost btn--wide', onClick: () => act('endGame') }, 'Fine partita'),
      switchGame(state, act)));
    return {
      el,
      update(s) {
        const team = s.teams.find((t) => t.id === s.you.teamId);
        const me = s.players.find((p) => p.id === s.you.id);
        fill(body,
          team && team.playing ? [
            chip(team),
            h('h1', { class: 'shout' }, team.outcome?.success ? 'Ce l’avete fatta!' : 'Questa volta no'),
            h('p', { class: 'sum' }, spec.outcome(team, s)),
            s.scoring && h('p', { class: 'note' }, `+${team.points ?? 0} a testa. Totale: ${me?.total ?? 0} punti.`),
          ] : h('h1', { class: 'shout shout--small' }, 'Turno finito'),
          h('p', { class: 'note' }, s.you.isAdmin ? 'Al prossimo turno i ruoli si scambiano.' : 'Tra poco si riparte: al prossimo turno i ruoli si scambiano.'));
      },
    };
  }

  function phone(state, ctx) {
    const views = { lobby: lobbyPhone, teams: teamsPhone, briefing: briefingPhone, playing: playingPhone, result: resultPhone, final: finalPhone };
    return views[state.phase](state, ctx);
  }

  // ---------- TV ----------

  function lobbyTv() {
    return coverTv({
      title: spec.title,
      subject: { label: 'Regole', text: (s) => `A squadre di due, solo in numero pari. ${settingsText(s)}.` },
      cta: (admin) => `Quando siete in numero pari, ${admin} dà il via e scegliete le squadre.`,
    });
  }

  /** La TV divisa in tante zone quante sono le squadre. */
  function zonesGrid(n) {
    const cols = n <= 3 ? n : n === 4 ? 2 : 3;
    const rows = Math.ceil(n / cols);
    const grid = h('div', { class: 'zones', style: { '--cols': cols, '--rows': rows } });
    return grid;
  }

  function zoneShell(team, ...kids) {
    return h('section', { class: `zone${team.done ? ' is-done' : ''}`, style: { '--team': team.color.hex } },
      h('header', { class: 'zone__head' },
        h('span', { class: 'zone__name' }, team.name),
        h('span', { class: 'zone__who' }, team.members.map((m) => h('span', { class: m.online ? '' : 'is-away' }, m.name, m.role ? h('em', {}, ` ${roleLabel(m.role)}`) : null)))),
      h('div', { class: 'zone__body' }, ...kids));
  }

  function waitingLine(s) {
    return s.waiting.length ? `${Cap(people(s.waiting.length))} in attesa` : '';
  }

  function teamsTv(state) {
    const say = h('h1', { class: 'say tv-say' });
    const sub = h('p', { class: 'pencil tv-sub' });
    const grid = zonesGrid(state.teams.length);
    const el = tvPage('teams-tv', h('header', { class: 'tv-head' }, say, sub), grid);
    return {
      el,
      update(s) {
        const choosing = s.choosing.filter((n) => !s.teams.some((t) => t.members.some((m) => m.name === n)));
        say.textContent = 'Scegliete la squadra dal telefono';
        sub.textContent = [choosing.length ? `Devono ancora scegliere: ${choosing.join(', ')}` : 'Tutti dentro!', waitingLine(s)].filter(Boolean).join(' · ');
        grid.style.setProperty('--cols', s.teams.length <= 3 ? s.teams.length : s.teams.length === 4 ? 2 : 3);
        fill(grid, s.teams.map((t) => zoneShell(t,
          h('ul', { class: 'zone__seats' }, [0, 1].map((i) => h('li', { class: t.members[i] ? 'written' : 'is-empty' }, t.members[i]?.name ?? 'posto libero'))),
          t.fixed && h('p', { class: 'pencil' }, 'Squadra già fatta'))));
      },
    };
  }

  function briefingTv(state) {
    const say = h('h1', { class: 'say tv-say' });
    const sub = h('p', { class: 'pencil tv-sub' });
    const grid = zonesGrid(state.teams.length);
    const warn = h('p', { class: 'tv-warn' }, 'Il compagno non deve vedere il tuo schermo: allontanatevi!');
    const el = tvPage('teams-tv', h('header', { class: 'tv-head' }, say, sub), grid, warn);
    return {
      el,
      update(s) {
        say.textContent = s.round ? `Turno ${s.round + 1}: ruoli scambiati` : 'Nome della squadra e ruoli';
        sub.textContent = [settingsText(s), waitingLine(s)].filter(Boolean).join(' · ');
        fill(grid, s.teams.map((t) => zoneShell(t,
          h('ul', { class: 'zone__seats' }, t.members.map((m) => h('li', { class: 'written' }, m.name, ' ',
            h('span', { class: 'red' }, m.role ? roleLabel(m.role) : 'sceglie il ruolo…')))),
          h('p', { class: `zone__ready${t.ready ? ' is-ready' : ''}` }, t.ready ? '✓ pronti' : 'non ancora pronti'))));
      },
    };
  }

  function playingTv(state) {
    const timer = createTimer({ onEnd: () => spec.sounds?.end?.() });
    const pause = h('p', { class: 'tv-pause', role: 'status', hidden: true });
    const sub = h('p', { class: 'pencil tv-sub' });
    const grid = zonesGrid(state.teams.filter((t) => t.playing).length);
    const zones = new Map();
    for (const team of state.teams.filter((t) => t.playing)) {
      const zone = spec.tv.zone(state, team);
      const shell = zoneShell(team, zone.el);
      zones.set(team.id, { zone, shell, done: false });
      grid.append(shell);
    }
    const legend = spec.tv.legend ? spec.tv.legend(state) : null;
    const el = tvPage('teams-tv teams-tv--play', h('header', { class: 'tv-head tv-head--play' }, timer.el, sub), pause, grid, legend);
    spec.sounds?.go?.();
    return {
      el,
      update(s) {
        timer.sync(s.remainingMs ?? 0, s.durationSec * 1000);
        pause.hidden = !s.paused;
        pause.textContent = s.paused ? `In pausa: ${s.paused.name} si è disconnesso` : '';
        const done = s.teams.filter((t) => t.playing && t.done).length;
        sub.textContent = [`Turno ${s.round}`, done ? `${done} ${done === 1 ? 'squadra ha' : 'squadre hanno'} finito` : '', waitingLine(s)].filter(Boolean).join(' · ');
        for (const team of s.teams) {
          const z = zones.get(team.id);
          if (!z) continue;
          z.shell.classList.toggle('is-done', team.done);
          if (team.done && !z.done) spec.sounds?.done?.(team);
          z.done = team.done;
          for (const [i, m] of team.members.entries()) z.shell.querySelectorAll('.zone__who > span')[i]?.classList.toggle('is-away', !m.online);
          z.zone.update(s, team);
        }
      },
      destroy() {
        timer.destroy();
        for (const { zone } of zones.values()) zone.destroy?.();
      },
    };
  }

  function resultTv(state) {
    const say = h('h1', { class: 'say tv-say' });
    const sub = h('p', { class: 'pencil tv-sub' });
    const grid = zonesGrid(state.teams.filter((t) => t.playing).length);
    const el = tvPage('teams-tv', h('header', { class: 'tv-head' }, say, sub), grid);
    return {
      el,
      update(s) {
        const played = s.teams.filter((t) => t.playing);
        say.textContent = `Turno ${s.round} finito`;
        sub.textContent = [s.scoring ? '' : 'In due non si tengono i punti', waitingLine(s)].filter(Boolean).join(' · ');
        fill(grid, played.map((t) => {
          const total = s.players.find((p) => p.id === t.members[0]?.id)?.total ?? 0;
          return zoneShell(t,
            spec.tv.result ? spec.tv.result(s, t) : null,
            h('p', { class: `zone__outcome${t.outcome?.success ? ' is-win' : ''}` }, t.rank === 1 && s.scoring ? `Primi! ${spec.outcome(t, s)}` : spec.outcome(t, s)),
            s.scoring && h('p', { class: 'zone__points' }, h('span', { class: 'red' }, `+${t.points ?? 0}`), ` a testa · totale ${total}`));
        }));
      },
    };
  }

  function tv(state, ctx) {
    const views = { lobby: lobbyTv, teams: teamsTv, briefing: briefingTv, playing: playingTv, result: resultTv, final: finalTv };
    return views[state.phase](state, ctx);
  }

  return { phone, tv };
}
