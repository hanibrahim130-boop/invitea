import './firebase-init.js';

(function () {
  'use strict';

  var dbEl = document.getElementById('db-page');
  var authStatusEl = document.getElementById('db-auth-status');
  var authStatusText = document.getElementById('db-auth-status-text');
  var nameEl = document.getElementById('db-user-name');
  var welcomeEl = document.getElementById('db-welcome-name');
  var logoutBtn = document.getElementById('db-logout');
  var badgeBasic = document.getElementById('badge-basic');
  var badgePremium = document.getElementById('badge-premium');
  var btnBasic = document.getElementById('btn-basic');
  var btnPremium = document.getElementById('btn-premium');
  var eventForm = document.getElementById('event-form');
  var eventSubmit = document.getElementById('event-submit');
  var eventStatus = document.getElementById('event-status');
  var eventsList = document.getElementById('events-list');
  var eventsEmpty = document.getElementById('db-events-empty');
  var createEventBtn = document.getElementById('btn-create-event');
  var statEvents = document.getElementById('stat-events');
  var statSent = document.getElementById('stat-sent');
  var statResponses = document.getElementById('stat-responses');
  var currentUser = null;

  function showPage() {
    if (dbEl) dbEl.style.display = 'flex';
    if (authStatusEl) authStatusEl.style.display = 'none';
  }

  function setAuthStatus(message) {
    if (authStatusText) authStatusText.textContent = message;
  }

  function redirectToAuth() {
    setAuthStatus('Session required. Redirecting to sign in…');
    window.location.href = '/auth?next=' + encodeURIComponent(window.location.pathname + window.location.search);
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
      btnBasic.textContent = plan === 'basic' ? 'Current Plan' : 'Request Basic Access';
      btnBasic.classList.toggle('disabled', plan === 'basic');
    }
    if (btnPremium) {
      btnPremium.textContent = plan === 'premium' ? 'Current Plan' : 'Request Premium Access';
      btnPremium.classList.toggle('primary', plan !== 'premium');
      btnPremium.classList.toggle('disabled', plan === 'premium');
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
      setAuthStatus('Authentication failed to initialize. Refresh the page or open /auth.');
      return;
    }

    var resolved = false;
    window.setTimeout(function () {
      if (!resolved) setAuthStatus('Authentication is taking longer than expected. Refresh the page or sign in again.');
    }, 6000);

    window.__INVITEA_ON_AUTH(window.__INVITEA_AUTH, async function (user) {
      resolved = true;
      if (!user) {
        redirectToAuth();
        return;
      }

      window.__INVITEA_USER = user;
      currentUser = user;
      showPage();

      var profile = await loadProfile(user);
      updateUI(user, profile);
      await refreshEvents(user);
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

  function requestAccess(planName) {
    var user = window.__INVITEA_USER;
    var email = user && user.email ? user.email : '';
    var body = 'Hi INVITEA, I want ' + planName + ' beta access.\nAccount email: ' + email;
    window.location.href = 'mailto:hello@invitea.app?subject=' + encodeURIComponent('INVITEA ' + planName + ' Access Request') + '&body=' + encodeURIComponent(body);
  }

  if (btnBasic) {
    btnBasic.addEventListener('click', function () {
      requestAccess('Basic');
    });
  }
  if (btnPremium) {
    btnPremium.addEventListener('click', function () {
      requestAccess('Premium');
    });
  }

  function getEventCollection(user) {
    return window.__INVITEA_COL(window.__INVITEA_DB, 'users', user.uid, 'events');
  }

  function value(data, key) {
    return String(data.get(key) || '').trim();
  }

  function buildEventPayload(data, user) {
    return {
      ownerId: user.uid,
      title: value(data, 'title'),
      eventType: value(data, 'eventType'),
      eventDate: value(data, 'eventDate'),
      venue: value(data, 'venue'),
      city: value(data, 'city'),
      guestCount: value(data, 'guestCount'),
      template: value(data, 'template'),
      deliveryChannels: value(data, 'deliveryChannels'),
      notes: value(data, 'notes'),
      sentCount: 0,
      responseCount: 0,
      status: 'draft',
      createdAt: window.__INVITEA_TS ? window.__INVITEA_TS() : new Date().toISOString(),
      updatedAt: window.__INVITEA_TS ? window.__INVITEA_TS() : new Date().toISOString(),
    };
  }

  function setEventLoading(loading) {
    if (!eventSubmit) return;
    eventSubmit.disabled = loading;
    eventSubmit.textContent = loading ? 'Creating…' : 'Create Event';
  }

  function sortEvents(a, b) {
    var aTime = a.createdAt && a.createdAt.seconds ? a.createdAt.seconds : 0;
    var bTime = b.createdAt && b.createdAt.seconds ? b.createdAt.seconds : 0;
    return bTime - aTime;
  }

  async function loadEvents(user) {
    if (!window.__INVITEA_DB || !window.__INVITEA_COL || !window.__INVITEA_GET_DOCS) return [];
    try {
      var snap = await window.__INVITEA_GET_DOCS(getEventCollection(user));
      var events = [];
      snap.forEach(function (item) {
        events.push(Object.assign({ id: item.id }, item.data()));
      });
      return events.sort(sortEvents);
    } catch (e) {
      console.warn('[dashboard] event load failed', e);
      return [];
    }
  }

  function createMeta(text) {
    var el = document.createElement('span');
    el.textContent = text;
    return el;
  }

  function createEventCard(event) {
    var card = document.createElement('article');
    var title = document.createElement('h3');
    var meta = document.createElement('div');
    var notes = document.createElement('p');
    card.className = 'db-event-card';
    meta.className = 'db-event-meta';
    title.textContent = event.title || 'Untitled Event';
    [event.status || 'draft', event.eventType, event.eventDate, event.guestCount].filter(Boolean).forEach(function (item) {
      meta.appendChild(createMeta(item));
    });
    notes.textContent = event.notes || 'No event notes yet.';
    card.appendChild(title);
    card.appendChild(meta);
    card.appendChild(notes);
    return card;
  }

  function renderStats(events) {
    var sent = events.reduce(function (sum, item) { return sum + (Number(item.sentCount) || 0); }, 0);
    var responses = events.reduce(function (sum, item) { return sum + (Number(item.responseCount) || 0); }, 0);
    if (statEvents) statEvents.textContent = String(events.length);
    if (statSent) statSent.textContent = String(sent);
    if (statResponses) statResponses.textContent = String(responses);
  }

  function renderEvents(events) {
    if (!eventsList) return;
    eventsList.innerHTML = '';
    events.forEach(function (event) {
      eventsList.appendChild(createEventCard(event));
    });
    if (eventsEmpty) eventsEmpty.style.display = events.length ? 'none' : 'block';
    renderStats(events);
  }

  async function refreshEvents(user) {
    renderEvents(await loadEvents(user));
  }

  async function createEvent(data) {
    if (!currentUser || !window.__INVITEA_ADD) return;
    await window.__INVITEA_ADD(getEventCollection(currentUser), buildEventPayload(data, currentUser));
    eventForm.reset();
    if (eventStatus) eventStatus.textContent = 'Event workspace created.';
    await refreshEvents(currentUser);
  }

  if (eventForm) {
    eventForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!eventForm.checkValidity()) return eventForm.reportValidity();
      setEventLoading(true);
      if (eventStatus) eventStatus.textContent = '';
      try {
        await createEvent(new FormData(eventForm));
      } catch (err) {
        if (eventStatus) eventStatus.textContent = 'Event creation failed. Try again.';
        console.warn('[dashboard] event creation failed', err);
      } finally {
        setEventLoading(false);
      }
    });
  }

  if (createEventBtn && eventForm) {
    createEventBtn.addEventListener('click', function () {
      eventForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
      var title = eventForm.querySelector('[name="title"]');
      if (title) title.focus();
    });
  }

  init();
})();
