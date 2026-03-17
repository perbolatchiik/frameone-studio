/* ============================================================
   ORDER PAGE LOGIC — Multi-step flow
   FIX: operator cards use data-operator (not data-id)
   NEW:  sends order to backend API
   ============================================================ */

'use strict';

// ── Config ──────────────────────────────────────────────────
// Change this to your deployed backend URL when you deploy
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api'
  : 'https://frameone-backend.onrender.com/api'; // ← replace after deploy

const OrderFlow = {
  currentStep: 1,
  totalSteps: 4,
  data: {
    eventDate: '',
    eventTime: '',
    eventAddress: '',
    eventInfo: '',
    cameras: 1,
    audioNeeded: false,
    cameraSetups: {},
    operators: [],
    delivery: null,
    deliveryPrice: 0,
  },

  init() {
    // Auth guard
    if (!App.requireAuth(window.location.href)) return;

    this.renderUserName();
    this.bindStep1();
    this.bindStep2();
    this.bindStep3();
    this.bindStep4();
    this.bindNavButtons();
    this.updateProgress();
    this.updateSummary();
  },

  renderUserName() {
    const el = document.getElementById('user-greeting');
    if (el && App.state.user) {
      el.textContent = App.state.user.name.split(' ')[0];
    }
  },

  goToStep(step) {
    if (step < 1 || step > this.totalSteps) return;

    document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById(`step-${step}`);
    if (panel) panel.classList.add('active');

    this.currentStep = step;
    this.updateProgress();
    this.updateSummary();

    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  updateProgress() {
    document.querySelectorAll('.step-dot').forEach((dot, idx) => {
      const stepNum = idx + 1;
      dot.classList.remove('active', 'completed');
      if (stepNum === this.currentStep) dot.classList.add('active');
      if (stepNum < this.currentStep) dot.classList.add('completed');
      const circle = dot.querySelector('.step-circle');
      if (circle) {
        circle.innerHTML = stepNum < this.currentStep ? '✓' : stepNum;
      }
    });

    document.querySelectorAll('.step-line').forEach((line, idx) => {
      line.classList.toggle('completed', idx + 1 < this.currentStep);
    });
  },

  updateSummary() {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (val) {
        el.textContent = val;
        el.classList.remove('placeholder');
      } else {
        el.textContent = '—';
        el.classList.add('placeholder');
      }
    };

    const d = this.data;
    set('sum-date',      d.eventDate ? new Date(d.eventDate).toLocaleDateString('ru-RU', { day:'numeric', month:'long', year:'numeric' }) : '');
    set('sum-time',      d.eventTime || '');
    set('sum-address',   d.eventAddress ? (d.eventAddress.length > 28 ? d.eventAddress.slice(0, 28) + '…' : d.eventAddress) : '');
    set('sum-cameras',   d.cameras ? `${d.cameras} cam${d.cameras > 1 ? 's' : ''}` : '');
    set('sum-audio',     d.audioNeeded !== null ? (d.audioNeeded ? 'Yes — Clean audio' : 'Not needed') : '');
    set('sum-operators', d.operators.length ? d.operators.join(', ') : '');
    set('sum-delivery',  d.delivery || '');

    const priceEl = document.getElementById('sum-price');
    if (priceEl) {
      priceEl.textContent = d.deliveryPrice ? `${d.deliveryPrice.toLocaleString()} ₸` : '—';
    }
  },

  // ── Step 1 ──────────────────────────────────────────────────
  bindStep1() {
    const form = document.getElementById('form-step1');
    if (!form) return;

    form.querySelectorAll('.form-input').forEach(inp => {
      inp.addEventListener('change', () => {
        this.data.eventDate    = form.querySelector('[name="eventDate"]')?.value || '';
        this.data.eventTime    = form.querySelector('[name="eventTime"]')?.value || '';
        this.data.eventAddress = form.querySelector('[name="eventAddress"]')?.value || '';
        this.data.eventInfo    = form.querySelector('[name="eventInfo"]')?.value || '';
        this.updateSummary();
      });
      // also update on input for address/info textarea
      inp.addEventListener('input', () => {
        this.data.eventDate    = form.querySelector('[name="eventDate"]')?.value || '';
        this.data.eventTime    = form.querySelector('[name="eventTime"]')?.value || '';
        this.data.eventAddress = form.querySelector('[name="eventAddress"]')?.value || '';
        this.data.eventInfo    = form.querySelector('[name="eventInfo"]')?.value || '';
        this.updateSummary();
      });
    });
  },

  validateStep1() {
    const form = document.getElementById('form-step1');
    if (!form) return true;
    Validate.clearAll(form);
    let valid = true;

    const dateInput = form.querySelector('[name="eventDate"]');
    const timeInput = form.querySelector('[name="eventTime"]');
    const addrInput = form.querySelector('[name="eventAddress"]');

    if (!dateInput.value) {
      Validate.showError(dateInput, 'Please select the event date');
      valid = false;
    } else if (!Validate.date(dateInput.value)) {
      Validate.showError(dateInput, 'Event date cannot be in the past');
      valid = false;
    }

    if (!timeInput.value) {
      Validate.showError(timeInput, 'Please enter the event time');
      valid = false;
    }

    if (!Validate.required(addrInput.value)) {
      Validate.showError(addrInput, 'Please enter the event address');
      valid = false;
    }

    return valid;
  },

  // ── Step 2 ──────────────────────────────────────────────────
  bindStep2() {
    // Camera selector — uses data-cameras attribute
    document.querySelectorAll('.camera-option').forEach(opt => {
      opt.addEventListener('click', () => {
        document.querySelectorAll('.camera-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        const radio = opt.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
        this.data.cameras = parseInt(opt.dataset.cameras);
        // Reset operators when camera count changes
        this.data.operators = [];
        document.querySelectorAll('.operator-card').forEach(c => c.classList.remove('selected'));
        this.buildSetupBuilder(this.data.cameras);
        this.updateSummary();
      });
    });

    // Audio toggle
    document.querySelectorAll('.toggle-option[data-audio]').forEach(opt => {
      opt.addEventListener('click', () => {
        document.querySelectorAll('.toggle-option[data-audio]').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        const radio = opt.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
        this.data.audioNeeded = opt.dataset.audio === 'true';
        this.updateSummary();
      });
    });

    this.buildSetupBuilder(1);
  },

  buildSetupBuilder(count) {
    const builder = document.getElementById('setup-builder');
    if (!builder) return;

    const equipment = ['Tripod', 'Crane', 'Stabilizer (Gimbal)', 'Steadicam', 'Slider', 'Drone', 'Handheld', 'Jib Arm'];

    let html = `<div class="setup-builder-title">Camera Setup Configuration</div>`;

    for (let i = 1; i <= count; i++) {
      html += `
        <div class="setup-row">
          <div class="setup-cam-label">Camera ${i}</div>
          <select class="setup-select" data-cam="${i}" id="setup-cam-${i}">
            ${equipment.map(eq =>
              `<option value="${eq}"${
                (i === 1 && eq === 'Stabilizer (Gimbal)') ||
                (i === 2 && eq === 'Tripod') ? ' selected' : ''
              }>${eq}</option>`
            ).join('')}
          </select>
        </div>
      `;
    }

    builder.innerHTML = html;

    builder.querySelectorAll('.setup-select').forEach(sel => {
      // init data
      this.data.cameraSetups[`cam${sel.dataset.cam}`] = sel.value;
      sel.addEventListener('change', () => {
        this.data.cameraSetups[`cam${sel.dataset.cam}`] = sel.value;
      });
    });
  },

  // ── Step 3 ──────────────────────────────────────────────────
  // BUG FIX: HTML uses data-operator, not data-id
  bindStep3() {
    document.querySelectorAll('.operator-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // Prevent label from double-firing checkbox
        e.preventDefault();

        // FIX: use data-operator (matches HTML attribute)
        const id = card.dataset.operator;
        if (!id) return;

        const index = this.data.operators.indexOf(id);

        if (index > -1) {
          // Deselect
          this.data.operators.splice(index, 1);
          card.classList.remove('selected');
        } else {
          if (this.data.operators.length < this.data.cameras) {
            this.data.operators.push(id);
            card.classList.add('selected');
          } else {
            App.toast(
              `You selected ${this.data.cameras} camera${this.data.cameras > 1 ? 's' : ''}, so you can only choose ${this.data.cameras} operator${this.data.cameras > 1 ? 's' : ''}.`,
              'error'
            );
          }
        }
        this.updateSummary();
      });
    });
  },

  validateStep3() {
    if (this.data.operators.length === 0) {
      App.toast(`Please select at least 1 operator.`, 'error');
      return false;
    }
    if (this.data.operators.length !== this.data.cameras) {
      App.toast(`Please select exactly ${this.data.cameras} operator(s) — one per camera.`, 'error');
      return false;
    }
    return true;
  },

  // ── Step 4 ──────────────────────────────────────────────────
  bindStep4() {
    document.querySelectorAll('.delivery-option').forEach(opt => {
      opt.addEventListener('click', () => {
        document.querySelectorAll('.delivery-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        const radio = opt.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
        this.data.delivery = opt.dataset.delivery;
        this.data.deliveryPrice = parseInt(opt.dataset.price);
        this.updateSummary();
      });
    });
  },

  validateStep4() {
    if (!this.data.delivery) {
      App.toast('Please select a video delivery method', 'error');
      return false;
    }
    return true;
  },

  // ── Navigation ──────────────────────────────────────────────
  bindNavButtons() {
    document.getElementById('btn-step1-next')?.addEventListener('click', () => {
      if (this.validateStep1()) this.goToStep(2);
    });

    document.getElementById('btn-step2-back')?.addEventListener('click', () => this.goToStep(1));
    document.getElementById('btn-step2-next')?.addEventListener('click', () => this.goToStep(3));

    document.getElementById('btn-step3-back')?.addEventListener('click', () => this.goToStep(2));
    document.getElementById('btn-step3-next')?.addEventListener('click', () => {
      if (this.validateStep3()) this.goToStep(4);
    });

    document.getElementById('btn-step4-back')?.addEventListener('click', () => this.goToStep(3));
    document.getElementById('btn-submit')?.addEventListener('click', () => this.submitOrder());
  },

  // ── Submit ──────────────────────────────────────────────────
  async submitOrder() {
    if (!this.validateStep4()) return;

    const btn = document.getElementById('btn-submit');
    if (btn) {
      btn.textContent = 'Processing...';
      btn.disabled = true;
    }

    const order = {
      clientName:    App.state.user?.name || '',
      clientPhone:   App.state.user?.phone || '',
      eventDate:     this.data.eventDate,
      eventTime:     this.data.eventTime,
      eventAddress:  this.data.eventAddress,
      eventInfo:     this.data.eventInfo,
      cameras:       this.data.cameras,
      audioNeeded:   this.data.audioNeeded,
      cameraSetups:  this.data.cameraSetups,
      operators:     this.data.operators,
      delivery:      this.data.delivery,
      deliveryPrice: this.data.deliveryPrice,
    };

    // Try to send to backend API
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json.error || 'Server error');

      // Save for success page
      const savedOrder = { ...order, id: json.orderId || ('FO-' + Date.now()) };
      localStorage.setItem('frameone_last_order', JSON.stringify(savedOrder));

    } catch (err) {
      // Fallback: save locally if backend is not available
      console.warn('Backend unavailable, saving locally:', err.message);
      const localOrder = {
        id: 'FO-' + Date.now(),
        userId: App.state.user?.id,
        ...order,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      const orders = JSON.parse(localStorage.getItem('frameone_orders') || '[]');
      orders.push(localOrder);
      localStorage.setItem('frameone_orders', JSON.stringify(orders));
      localStorage.setItem('frameone_last_order', JSON.stringify(localOrder));
    }

    setTimeout(() => {
      window.location.href = 'success.html';
    }, 1000);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  OrderFlow.init();
});
