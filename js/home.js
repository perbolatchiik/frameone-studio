/* ============================================================
   HOME PAGE LOGIC
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  // ── Auth check for user display ──
  const userBtn = document.getElementById('nav-user-btn');
  const authBtn = document.getElementById('nav-auth-btn');

  if (App.isLoggedIn()) {
    if (userBtn) userBtn.style.display = 'flex';
    if (authBtn) authBtn.style.display = 'none';
    const nameEl = document.getElementById('nav-user-name');
    if (nameEl) nameEl.textContent = App.state.user.name.split(' ')[0];
  } else {
    if (userBtn) userBtn.style.display = 'none';
    if (authBtn) authBtn.style.display = 'inline-flex';
  }

  // ── Logout ──
  document.getElementById('nav-logout')?.addEventListener('click', (e) => {
    e.preventDefault();
    App.logout();
  });

  // ── Order CTA ──
  document.querySelectorAll('[data-order-cta]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!App.isLoggedIn()) {
        sessionStorage.setItem('frameone_redirect', 'pages/order.html');
        window.location.href = 'pages/auth.html'; // Бұл жерде / белгісі жоқ!
      } else {
        window.location.href = 'pages/order.html'; // Бұл жерде де / жоқ
      }
    });
  });

  // ── Hero parallax (subtle) ──
  const heroBg = document.querySelector('.hero-bg');
  if (heroBg) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY * 0.3;
      heroBg.style.transform = `translateY(${y}px)`;
    }, { passive: true });
  }

  // ── Gallery items hover info ──
  // handled by CSS transitions
});