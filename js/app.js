/* ============================================================
   FRAMEONE STUDIO — Core App Logic
   ============================================================ */

'use strict';

// ── State Management ──────────────────────────────────────────
const App = {
  state: {
    user: null,
    order: {
      eventDate: '',
      eventTime: '',
      eventAddress: '',
      eventInfo: '',
      cameras: 1,
      audioNeeded: false,
      cameraSetups: {},
      operators: [],
      delivery: null,
    }
  },

  init() {
    this.loadUser();
    this.initLoader();
    this.initNav();
    this.initScrollAnimations();
    this.initToast();
  },

  loadUser() {
    const saved = localStorage.getItem('frameone_user');
    if (saved) {
      this.state.user = JSON.parse(saved);
    }
  },

  saveUser(user) {
    this.state.user = user;
    localStorage.setItem('frameone_user', JSON.stringify(user));
  },

  logout() {
    this.state.user = null;
    localStorage.removeItem('frameone_user');
    window.location.href = 'pages/auth.html';
  },

  isLoggedIn() {
    return !!this.state.user;
  },

  requireAuth(redirectTo) {
    if (!this.isLoggedIn()) {
      const target = redirectTo || window.location.href;
      sessionStorage.setItem('frameone_redirect', target);
      window.location.href = 'pages/auth.html';
      return false;
    }
    return true;
  },

  // ── Page Loader ──
  initLoader() {
    const loader = document.getElementById('page-loader');
    if (!loader) return;
    setTimeout(() => {
      loader.classList.add('hidden');
    }, 1600);
  },

  // ── Navigation ──
  initNav() {
    const nav = document.querySelector('.nav');
    if (!nav) return;

    const onScroll = () => {
      nav.classList.toggle('scrolled', window.scrollY > 50);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Update user display in nav
    const navUser = document.getElementById('nav-user-name');
    if (navUser && this.state.user) {
      navUser.textContent = this.state.user.name.split(' ')[0];
    }
  },

  // ── Scroll animations ──
  initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
  },

  // ── Toast notifications ──
  initToast() {
    if (!document.getElementById('toast-container')) {
      const container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
  },

  toast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = '0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(120%)';
      setTimeout(() => toast.remove(), 350);
    }, duration);
  },
};

// ── Form Validation ───────────────────────────────────────────
const Validate = {
  name(val) {
    return val.trim().length >= 2;
  },

  phone(val) {
    const cleaned = val.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  },

  required(val) {
    return val.trim().length > 0;
  },

  date(val) {
    if (!val) return false;
    const d = new Date(val);
    return d >= new Date();
  },

  showError(input, msg) {
    const group = input.closest('.form-group');
    if (!group) return;
    group.classList.add('has-error');

    let errEl = group.querySelector('.form-error');
    if (!errEl) {
      errEl = document.createElement('span');
      errEl.className = 'form-error';
      errEl.style.cssText = 'font-family:var(--font-mono);font-size:0.6rem;letter-spacing:0.08em;color:var(--red);margin-top:0.25rem;';
      group.appendChild(errEl);
    }
    errEl.textContent = msg;
    input.style.borderColor = 'var(--red)';
  },

  clearError(input) {
    const group = input.closest('.form-group');
    if (!group) return;
    group.classList.remove('has-error');
    const errEl = group.querySelector('.form-error');
    if (errEl) errEl.textContent = '';
    input.style.borderColor = '';
  },

  clearAll(form) {
    form.querySelectorAll('.form-input').forEach(inp => this.clearError(inp));
  }
};

// ── Phone formatter ───────────────────────────────────────────
function formatPhone(input) {
  input.addEventListener('input', function() {
    let v = this.value.replace(/\D/g, '');
    if (v.startsWith('7') || v.startsWith('8')) v = v.slice(1);
    v = v.slice(0, 10);
    let formatted = '+7';
    if (v.length > 0) formatted += ' (' + v.slice(0, 3);
    if (v.length > 3) formatted += ') ' + v.slice(3, 6);
    if (v.length > 6) formatted += '-' + v.slice(6, 8);
    if (v.length > 8) formatted += '-' + v.slice(8, 10);
    this.value = formatted;
  });
}

// ── Smooth counter ────────────────────────────────────────────
function animateCounter(el, target, suffix = '', duration = 1800) {
  let start = null;
  const step = (timestamp) => {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target) + suffix;
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// Initialize counters when visible
function initCounters() {
  const counterEls = document.querySelectorAll('[data-counter]');
  if (!counterEls.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.counter);
        const suffix = el.dataset.suffix || '';
        animateCounter(el, target, suffix);
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counterEls.forEach(el => obs.observe(el));
}

// ── Initialize on DOM ready ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  App.init();
  initCounters();

  // Format phone inputs
  document.querySelectorAll('[data-phone]').forEach(formatPhone);

  // Set min date for date inputs
  document.querySelectorAll('input[type="date"]').forEach(input => {
    const today = new Date().toISOString().split('T')[0];
    input.min = today;
  });
});