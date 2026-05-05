(function () {
  'use strict';

  var tabs = document.querySelectorAll('.auth-tab');
  var loginForm = document.getElementById('login-form');
  var signupForm = document.getElementById('signup-form');
  var loginBtn = document.getElementById('login-btn');
  var signupBtn = document.getElementById('signup-btn');
  var loginError = document.getElementById('login-error');
  var signupError = document.getElementById('signup-error');
  var googleBtn = document.getElementById('google-signin');

  function showTab(name) {
    tabs.forEach(function (t) {
      t.classList.toggle('active', t.getAttribute('data-tab') === name);
    });
    loginForm.style.display = name === 'login' ? 'flex' : 'none';
    signupForm.style.display = name === 'signup' ? 'flex' : 'none';
    loginError.textContent = '';
    signupError.textContent = '';
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      showTab(tab.getAttribute('data-tab'));
    });
  });

  function setLoading(el, loading) {
    el.disabled = loading;
    el.textContent = loading ? 'Please wait…' : el.dataset.originalText;
  }

  if (loginBtn) loginBtn.dataset.originalText = loginBtn.textContent;
  if (signupBtn) signupBtn.dataset.originalText = signupBtn.textContent;

  function authErrorMessage(err) {
    var code = err && err.code ? err.code : '';
    var map = {
      'auth/invalid-credential': 'Invalid email or password.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/weak-password': 'Password must be at least 6 characters.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/popup-closed-by-user': 'Sign-in was cancelled.',
      'auth/popup-blocked': 'Pop-up was blocked. Please allow pop-ups for this site.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
      'auth/unauthorized-domain': 'This domain is not authorized for authentication.',
    };
    return map[code] || (err && err.message) || 'Something went wrong. Please try again.';
  }

  function redirectAfterAuth() {
    var params = new URLSearchParams(window.location.search);
    var next = params.get('next') || '/dashboard.html';
    window.location.href = next;
  }

  async function createUserProfile(user, displayName) {
    if (!window.__INVITEA_DB || !window.__INVITEA_DOC_REF || !window.__INVITEA_SET_DOC) return;
    try {
      await window.__INVITEA_SET_DOC(
        window.__INVITEA_DOC_REF(window.__INVITEA_DB, 'users', user.uid),
        {
          email: user.email || '',
          displayName: displayName || user.displayName || '',
          photoURL: user.photoURL || '',
          plan: 'none',
          createdAt: window.__INVITEA_TS ? window.__INVITEA_TS() : new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('[auth] profile creation failed', e);
    }
  }

  // --- Email Login ---
  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      loginError.textContent = '';
      if (!loginForm.checkValidity()) {
        loginForm.reportValidity();
        return;
      }
      var data = new FormData(loginForm);
      var email = data.get('email') || '';
      var password = data.get('password') || '';
      setLoading(loginBtn, true);
      try {
        await window.__INVITEA_SIGN_IN_EMAIL(window.__INVITEA_AUTH, email, password);
        redirectAfterAuth();
      } catch (err) {
        loginError.textContent = authErrorMessage(err);
        setLoading(loginBtn, false);
      }
    });
  }

  // --- Email Sign Up ---
  if (signupForm) {
    signupForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      signupError.textContent = '';
      if (!signupForm.checkValidity()) {
        signupForm.reportValidity();
        return;
      }
      var data = new FormData(signupForm);
      var name = data.get('displayName') || '';
      var email = data.get('email') || '';
      var password = data.get('password') || '';
      setLoading(signupBtn, true);
      try {
        var cred = await window.__INVITEA_SIGN_UP_EMAIL(window.__INVITEA_AUTH, email, password);
        await createUserProfile(cred.user, name);
        redirectAfterAuth();
      } catch (err) {
        signupError.textContent = authErrorMessage(err);
        setLoading(signupBtn, false);
      }
    });
  }

  // --- Google Sign In ---
  if (googleBtn) {
    googleBtn.addEventListener('click', async function () {
      if (!window.__INVITEA_SIGN_IN_POPUP || !window.__INVITEA_GOOGLE_PROVIDER) return;
      loginError.textContent = '';
      signupError.textContent = '';
      try {
        var cred = await window.__INVITEA_SIGN_IN_POPUP(window.__INVITEA_AUTH, window.__INVITEA_GOOGLE_PROVIDER);
        await createUserProfile(cred.user, cred.user.displayName || '');
        redirectAfterAuth();
      } catch (err) {
        var el = loginForm.style.display !== 'none' ? loginError : signupError;
        el.textContent = authErrorMessage(err);
      }
    });
  }
})();
