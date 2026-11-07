// Su ogni pagina di gioco e d'attesa: se dalla console cambia il gioco acceso, si ricarica da sola.
(() => {
  const shown = document.querySelector('meta[name="platform-game"]')?.content ?? '';
  io('/').on('platform', ({ activeId }) => {
    if ((activeId ?? '') !== shown) location.reload();
  });
})();
