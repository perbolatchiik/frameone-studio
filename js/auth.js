/* ============================================================
   AUTH PAGE LOGIC
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  // If already logged in, redirect to home
  if (App.isLoggedIn()) {
    const redirect = sessionStorage.getItem('frameone_redirect') || 'index.html';
    sessionStorage.removeItem('frameone_redirect');
    window.location.href = redirect;
    return;
  }

  const registerPanel = document.getElementById('register-panel');
  const loginPanel    = document.getElementById('login-panel');
  const switchToLogin = document.getElementById('switch-to-login');
  const switchToReg   = document.getElementById('switch-to-register');

  // Toggle panels
  if (switchToLogin) {
    switchToLogin.addEventListener('click', (e) => {
      e.preventDefault();
      registerPanel.style.display = 'none';
      loginPanel.style.display = 'block';
    });
  }

  if (switchToReg) {
    switchToReg.addEventListener('click', (e) => {
      e.preventDefault();
      loginPanel.style.display = 'none';
      registerPanel.style.display = 'block';
    });
  }

  // ── Register ──
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      Validate.clearAll(registerForm);

      const nameInput  = registerForm.querySelector('[name="name"]');
      const phoneInput = registerForm.querySelector('[name="phone"]');
      let valid = true;

      if (!Validate.name(nameInput.value)) {
        Validate.showError(nameInput, 'Enter your full name (at least 2 characters)');
        valid = false;
      }

      if (!Validate.phone(phoneInput.value)) {
        Validate.showError(phoneInput, 'Enter a valid phone number');
        valid = false;
      }

      if (!valid) return;

      // Check if already registered
      const users = JSON.parse(localStorage.getItem('frameone_users') || '[]');
      const phone = phoneInput.value.replace(/\D/g, '');
      const exists = users.find(u => u.phone === phone);

      if (exists) {
        Validate.showError(phoneInput, 'This phone number is already registered');
        return;
      }

      // Register
        const newUser = {
        id: Date.now(),
        name: nameInput.value,
        // Телефонды тек сандар түрінде сақтау ( replace қолданамыз )
        phone: phoneInput.value.replace(/\D/g, ''), 
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      localStorage.setItem('frameone_users', JSON.stringify(users));
      App.saveUser(newUser);

      App.toast(`Welcome, ${newUser.name.split(' ')[0]}!`, 'success');

      setTimeout(() => {
        const redirect = sessionStorage.getItem('frameone_redirect') || 'index.html';
        sessionStorage.removeItem('frameone_redirect');
        window.location.href = redirect;
      }, 800);
    });
  }

  // ── Login ──
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      Validate.clearAll(loginForm);

      const phoneInput = loginForm.querySelector('[name="phone"]');
      let valid = true;

      if (!Validate.phone(phoneInput.value)) {
        Validate.showError(phoneInput, 'Enter a valid phone number');
        valid = false;
      }

      if (!valid) return;

      // Телефонды тазалап алып, базадан іздеу
      const phone = phoneInput.value.replace(/\D/g, '');
      const users = JSON.parse(localStorage.getItem('frameone_users') || '[]');
      const user = users.find(u => u.phone === phone);

      if (!user) {
        Validate.showError(phoneInput, 'Account not found. Please register first.');
        return;
      }

      App.saveUser(user);
      App.toast(`Welcome back, ${user.name.split(' ')[0]}!`, 'success');

      setTimeout(() => {
        const redirect = sessionStorage.getItem('frameone_redirect') || 'index.html';
        sessionStorage.removeItem('frameone_redirect');
        window.location.href = redirect;
      }, 800);
    });
  }
});