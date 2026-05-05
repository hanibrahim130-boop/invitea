(function () {
  'use strict';

  var dbEl = document.getElementById('db-page');
  var nameEl = document.getElementById('db-user-name');
  var welcomeEl = document.getElementById('db-welcome-name');
  var logoutBtn = document.getElementById('db-logout');
  var badgeBasic = document.getElementById('badge-basic');
  var badgePremium = document.getElementById('badge-premium');
  var btnBasic = document.getElementById('btn-basic');
  var btnPremium = document.getElementById('btn-premium');

  function showPage() {
    if (dbEl) dbEl.style.display = 'flex';
  }

  function redirectToAuth() {
    window.location.href = '/auth.html?next=' + encodeURIComponent(window.location.pathname + window.location.search);
  }

  async function loadProfile(user) {
    if (!window.__INVITEA_DB || !window.__INVITEA_DOC_REF || !window.__INVITEA_GET_DOC) return;
    try {
      var snap = await window.__INVITEA_GET_DOC(window.__INVITEA_DOC_REF(window.__INVITEA_DB, 'users', user.uid));
      return snap.exists() ? snap.data() : null;
    } catch (e) {
      console.warn('[dashboard] profile load failed', e);
      return null;
    }
  }

  function setPlan(plan) {
    var planMap = {
      'basic': { el: badgeBasic },
      'premium': { el: badgePremium },
    };

    // Hide all badges
    if (badgeBasic) badgeBasic.style.display = 'none';
    if (badgePremium) badgePremium.style.display = 'none';

    // Show current badge
    if (planMap[plan] && planMap[plan].el) {
      planMap[plan].el.style.display = 'inline-block';
    }

    // Update button states
    if (btnBasic) {
      btnBasic.textContent = plan === 'basic' ? 'Current Plan' : 'Choose Basic';
      btnBasic.classList.toggle('primary', plan !== 'basic');
      btnBasic.disabled = plan === 'basic';
    }
    if (btnPremium) {
      btnPremium.textContent = plan === 'premium' ? 'Current Plan' : 'Choose Premium';
      btnPremium.classList.toggle('primary', plan !== 'premium');
      btnPremium.disabled = plan === 'premium';
    }
  }

  function updateUI(user, profile) {
    var displayName = profile && profile.displayName ? profile.displayName : (user.displayName || user.email || 'Guest');
    if (nameEl) nameEl.textContent = displayName;
    if (welcomeEl) welcomeEl.textContent = displayName.split(' ')[0];

    var plan = profile && profile.plan ? profile.plan : 'none';
    setPlan(plan);
  }

  async function init() {
    if (!window.__INVITEA_ON_AUTH || !window.__INVITEA_AUTH) {
      redirectToAuth();
      return;
    }

    window.__INVITEA_ON_AUTH(window.__INVITEA_AUTH, async function (user) {
      if (!user) {
        redirectToAuth();
        return;
      }

      window.__INVITEA_USER = user;
      showPage();

      var profile = await loadProfile(user);
      updateUI(user, profile);
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async function () {
      if (!window.__INVITEA_SIGN_OUT || !window.__INVITEA_AUTH) return;
      try {
        await window.__INVITEA_SIGN_OUT(window.__INVITEA_AUTH);
        redirectToAuth();
      } catch (e) {
        console.warn('[dashboard] logout failed', e);
      }
    });
  }

  // Plan button handlers (placeholder for Stripe integration)
  if (btnBasic) {
    btnBasic.addEventListener('click', function () {
      if (btnBasic.disabled) return;
      alert('Stripe checkout for Basic ($5/mo) — coming next');
    });
  }
  if (btnPremium) {
    btnPremium.addEventListener('click', function () {
      if (btnPremium.disabled) return;
      alert('Stripe checkout for Premium ($15/mo) — coming next');
    });
  }

  if (document.getElementById('btn-create-event')) {
    document.getElementById('btn-create-event').addEventListener('click', function () {
      alert('Event creation — coming in Phase 2');
    });
  }

  init();
})();
