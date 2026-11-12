// Su ogni pagina di gioco e d'attesa: se dalla console cambia il gioco acceso, si ricarica da sola.
// Se l'amministratore passa direttamente a un altro gioco, chi era dentro ci rientra da solo (vedi kit/client.js).
// Lo stile grafico scelto dalla console si applica subito, senza ricaricare (vedi /css/styles/).
(() => {
  const KEY = 'salotto-style';
  const apply = (style) => {
    if (!style) return;
    document.documentElement.dataset.style = style;
    try { localStorage.setItem(KEY, style); } catch { /* storage bloccato */ }
  };
  // L'ultimo stile visto, prima che il server risponda: evita il lampo del quaderno.
  try { apply(localStorage.getItem(KEY) ?? 'kraft'); } catch { /* storage bloccato */ }

  const shown = document.querySelector('meta[name="platform-game"]')?.content ?? '';
  io('/').on('platform', ({ activeId, style }) => {
    apply(style);
    if ((activeId ?? '') === shown) return;
    if (shown && activeId) {
      try { sessionStorage.setItem('salotto-carry', activeId); } catch { /* storage bloccato */ }
    }
    location.reload();
  });
})();
