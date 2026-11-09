/** Crea un elemento. Il testo passa sempre da textContent: i nomi dei giocatori non diventano mai HTML. */
export function h(tag, props = {}, ...kids) {
  const el = tag.startsWith('svg:')
    ? document.createElementNS('http://www.w3.org/2000/svg', tag.slice(4))
    : document.createElement(tag);
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value === undefined || value === null || value === false) continue;
    if (key.startsWith('on')) el.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === 'class') el.setAttribute('class', value);
    else if (key === 'style' && typeof value === 'object') {
      for (const [k, v] of Object.entries(value)) el.style.setProperty(k, v);
    } else if (key in el && !tag.startsWith('svg:') && key !== 'list') el[key] = value;
    else el.setAttribute(key, value === true ? '' : value);
  }
  el.append(...kids.flat().filter((k) => k !== null && k !== undefined && k !== false));
  return el;
}

export function fill(el, ...kids) {
  el.replaceChildren(...kids.flat().filter((k) => k !== null && k !== undefined && k !== false));
  return el;
}

/** Icone disegnate con lo stesso tratto di biro. */
const ICONS = {
  sound: 'M4 10v4h4l5 4V6L8 10H4zM16.5 9c1.4 1.6 1.4 4.4 0 6M19 6.5c2.8 3 2.8 8 0 11',
  mute: 'M4 10v4h4l5 4V6L8 10H4zM17 9.5l4.5 5M21.5 9.5l-4.5 5',
  full: 'M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5',
};

export function icon(name) {
  return h('svg:svg', { viewBox: '0 0 24 24', class: 'icon', 'aria-hidden': 'true' }, h('svg:path', { d: ICONS[name] }));
}
