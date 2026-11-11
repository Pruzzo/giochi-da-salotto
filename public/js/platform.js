// Su ogni pagina di gioco e d'attesa: se dalla console cambia il gioco acceso, si ricarica da sola.
// Se l'amministratore passa direttamente a un altro gioco, chi era dentro ci rientra da solo (vedi kit/client.js).
(() => {
  const shown = document.querySelector('meta[name="platform-game"]')?.content ?? '';
  io('/').on('platform', ({ activeId }) => {
    if ((activeId ?? '') === shown) return;
    if (shown && activeId) {
      try { sessionStorage.setItem('salotto-carry', activeId); } catch { /* storage bloccato */ }
    }
    location.reload();
  });
})();
