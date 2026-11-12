// La ruota: disegnata a biro su carta, con settori tratteggiati a mano.
// Il giro è un'unica animazione calcolata dal seed del server: più TV restano allineate.
import { sounds } from './audio.js';

const NS = 'http://www.w3.org/2000/svg';
const SIZE = 1000;
const C = SIZE / 2;
const R = 470;
const HATCHES = ['url(#hatch-blue)', 'url(#hatch-red)', 'url(#hatch-yellow)'];

/** Rumore deterministico: lo stesso tratto "a mano" a ogni ridisegno. */
function wobble(seed) {
  return (x) => (Math.sin(seed * 12.9 + x * 7.3) + Math.sin(seed * 3.1 + x * 2.7)) * 0.5;
}

function polar(r, deg) {
  const a = ((deg - 90) * Math.PI) / 180;
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
}

function handCircle(r, seed) {
  const n = wobble(seed);
  const pts = [];
  for (let d = 0; d <= 368; d += 4) {
    const [x, y] = polar(r + n(d / 40) * 3.5, d);
    pts.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return `M${pts.join('L')}`;
}

function handLine(r0, r1, deg, seed) {
  const n = wobble(seed);
  const pts = [];
  for (let i = 0; i <= 6; i += 1) {
    const [x, y] = polar(r0 + ((r1 - r0) * i) / 6, deg + n(i) * 0.35);
    pts.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return `M${pts.join('L')}`;
}

function sectorPath(r0, r1, a0, a1) {
  const [x0, y0] = polar(r1, a0);
  const [x1, y1] = polar(r1, a1);
  const [x2, y2] = polar(r0, a1);
  const [x3, y3] = polar(r0, a0);
  return `M${x0} ${y0}A${r1} ${r1} 0 0 1 ${x1} ${y1}L${x2} ${y2}A${r0} ${r0} 0 0 0 ${x3} ${y3}Z`;
}

function hatchPattern(id, color, angle, gap, width) {
  return `<pattern id="${id}" width="${gap}" height="${gap}" patternUnits="userSpaceOnUse" patternTransform="rotate(${angle})"><line x1="0" y1="0" x2="0" y2="${gap}" style="stroke: ${color}" stroke-width="${width}"/></pattern>`;
}

export function createWheel(letters, used = []) {
  const step = 360 / letters.length;
  let parts = '';
  letters.forEach((letter, i) => {
    const a0 = i * step;
    const a1 = (i + 1) * step;
    const mid = a0 + step / 2;
    const isUsed = used.includes(letter);
    parts += `<path d="${sectorPath(190, R, a0, a1)}" fill="${isUsed ? 'none' : HATCHES[i % 3]}"/>`;
    parts += `<path d="${handLine(190, R, a0, i + 1)}" class="w-line"/>`;
    const [x, y] = polar(R - 72, mid);
    parts += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${mid.toFixed(1)})">`
      + `<circle r="43" fill="var(--paper)"/><text class="w-letter${isUsed ? ' w-letter--used' : ''}" dy=".36em">${letter}</text>`
      + (isUsed ? '<path class="w-cross" d="M-30 -30L30 30M30 -30L-30 30"/>' : '')
      + '</g>';
  });
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${SIZE} ${SIZE + 60}`);
  svg.setAttribute('class', 'wheel');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Ruota delle lettere');
  svg.innerHTML = `
    <defs>
      ${hatchPattern('hatch-blue', 'var(--hatch-blue)', 38, 15, 7)}
      ${hatchPattern('hatch-red', 'var(--hatch-red)', -42, 15, 7)}
      ${hatchPattern('hatch-yellow', 'var(--hatch-yellow)', 70, 13, 9)}
    </defs>
    <g transform="translate(0 60)">
      <g class="wheel__spin">
        ${parts}
        <path d="${handCircle(R, 2)}" class="w-line w-line--bold"/>
        <path d="${handCircle(R - 3, 5)}" class="w-line"/>
        <path d="${handCircle(190, 3)}" class="w-line w-line--bold"/>
      </g>
      <circle cx="${C}" cy="${C}" r="188" fill="var(--paper)"/>
      <path d="${handCircle(188, 8)}" class="w-line"/>
      <circle cx="${C}" cy="${C}" r="9" fill="var(--ink)"/>
    </g>
    <path class="wheel__pointer" d="M${C - 48} 8Q${C} 22 ${C + 48} 6L${C + 3} 118L${C - 4} 116Z"/>`;
  const spinner = svg.querySelector('.wheel__spin');
  let animation = null;
  let raf = 0;

  return {
    el: svg,
    /** Parte (o riprende, se la TV si è ricaricata) dalla posizione giusta per finire sulla lettera. */
    spin({ letterIndex, jitter, spinMs, elapsedMs = 0, onLand }) {
      const end = 360 * 7 - (letterIndex + 0.5 + jitter) * step;
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const land = () => {
        cancelAnimationFrame(raf);
        spinner.style.transform = `rotate(${end}deg)`;
        svg.classList.add('wheel--landed');
        onLand?.();
      };
      spinner.style.transformOrigin = `${C}px ${C}px`;
      if (reduce || elapsedMs >= spinMs) { land(); return; }
      animation = spinner.animate(
        [{ transform: 'rotate(0deg)' }, { transform: `rotate(${end}deg)` }],
        { duration: spinMs, easing: 'cubic-bezier(.14,.72,.1,1)', fill: 'forwards' },
      );
      animation.currentTime = elapsedMs;
      animation.onfinish = land;
      // Un clic a ogni settore che passa sotto la lamella.
      let last = null;
      const watch = () => {
        const matrix = new DOMMatrixReadOnly(getComputedStyle(spinner).transform);
        const deg = (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI;
        const sector = Math.floor(((deg + 360) % 360) / step);
        if (last !== null && sector !== last) sounds.tick();
        last = sector;
        raf = requestAnimationFrame(watch);
      };
      raf = requestAnimationFrame(watch);
    },
    destroy() {
      cancelAnimationFrame(raf);
      if (animation) animation.onfinish = null;
      animation?.cancel();
    },
  };
}
