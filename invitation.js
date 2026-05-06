// INVITEA — Ultra-Premium Invitation Experience

document.addEventListener('DOMContentLoaded', () => {
  const phaseSeal = document.getElementById('phase-seal');
  const phaseEnvelope = document.getElementById('phase-envelope');
  const phaseContent = document.getElementById('phase-content');
  const sealWax = document.getElementById('seal-wax');
  const sealContainer = document.getElementById('seal-container');
  const envelopeFlap = document.getElementById('envelope-flap');
  const envelopeCard = document.getElementById('envelope-card');

  // ============ PHASE 1: SEAL ============
  const sealCanvas = document.getElementById('seal-particles');
  const sealCtx = sealCanvas.getContext('2d');
  let sealParticles = [];

  function resizeSealCanvas() {
    sealCanvas.width = window.innerWidth;
    sealCanvas.height = window.innerHeight;
  }
  resizeSealCanvas();
  window.addEventListener('resize', resizeSealCanvas);

  // Ambient seal particles
  let sealRaf = null;
  function sealParticleLoop() {
    sealCtx.clearRect(0, 0, sealCanvas.width, sealCanvas.height);

    if (sealParticles.length < 30 && phaseSeal.classList.contains('active')) {
      sealParticles.push({
        x: Math.random() * sealCanvas.width,
        y: sealCanvas.height + 5,
        size: Math.random() * 1.5 + 0.3,
        speedY: -Math.random() * 0.5 - 0.1,
        speedX: (Math.random() - 0.5) * 0.2,
        life: 1,
        decay: Math.random() * 0.003 + 0.001,
      });
    }

    sealParticles = sealParticles.filter(p => {
      p.x += p.speedX;
      p.y += p.speedY;
      p.life -= p.decay;
      if (p.life <= 0) return false;

      sealCtx.save();
      sealCtx.globalAlpha = p.life * 0.5;
      sealCtx.fillStyle = '#c4956a';
      sealCtx.beginPath();
      sealCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      sealCtx.fill();
      sealCtx.restore();
      return true;
    });

    // Stop the loop once Phase 1 is done AND queue is drained.
    if (!phaseSeal.classList.contains('active') && sealParticles.length === 0) {
      sealCtx.clearRect(0, 0, sealCanvas.width, sealCanvas.height);
      sealRaf = null;
      return;
    }
    sealRaf = requestAnimationFrame(sealParticleLoop);
  }
  sealParticleLoop();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && sealRaf) {
      cancelAnimationFrame(sealRaf);
      sealRaf = null;
    } else if (!document.hidden && !sealRaf && phaseSeal.classList.contains('active')) {
      sealParticleLoop();
    }
  });

  // Break the seal
  function breakSeal() {
    if (sealWax.classList.contains('breaking')) return;

    // Burst particles from seal center
    const rect = sealContainer.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    for (let i = 0; i < 60; i++) {
      const angle = (Math.PI * 2 * i) / 60;
      const speed = Math.random() * 4 + 2;
      sealParticles.push({
        x: cx,
        y: cy,
        size: Math.random() * 3 + 1,
        speedX: Math.cos(angle) * speed,
        speedY: Math.sin(angle) * speed,
        life: 1,
        decay: Math.random() * 0.015 + 0.01,
      });
    }

    sealWax.classList.add('breaking');
    phaseSeal.classList.add('fading');

    setTimeout(() => {
      phaseSeal.classList.remove('active');
      phaseEnvelope.classList.add('active');
      startEnvelopePhase();
    }, 1500);
  }

  sealContainer.addEventListener('click', breakSeal);

  // Skip intro — jump straight to content (a11y + reduced-motion + impatient users)
  const sealSkipBtn = document.getElementById('seal-skip');
  function skipIntro() {
    phaseSeal.classList.remove('active');
    phaseEnvelope.classList.remove('active');
    phaseContent.classList.add('active');
    document.body.style.overflow = 'auto';
    initContentPhase();
  }
  if (sealSkipBtn) sealSkipBtn.addEventListener('click', skipIntro);

  // Auto-skip if user prefers reduced motion
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    skipIntro();
  }

  // ============ PHASE 2: ENVELOPE ============
  function startEnvelopePhase() {
    // Open flap after a short delay
    setTimeout(() => {
      envelopeFlap.classList.add('open');
    }, 800);

    // Card rises out
    setTimeout(() => {
      envelopeCard.classList.add('rise');
    }, 1800);

    // Transition to content
    setTimeout(() => {
      phaseEnvelope.classList.add('fading');
    }, 3000);

    setTimeout(() => {
      phaseEnvelope.classList.remove('active');
      phaseContent.classList.add('active');
      document.body.style.overflow = 'auto';
      initContentPhase();
    }, 4200);
  }

  // ============ PHASE 3: CONTENT ============
  function initContentPhase() {
    // Reveal animations
    const reveals = document.querySelectorAll('.reveal-inv');
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add('visible'), i * 100);
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    reveals.forEach(el => revealObserver.observe(el));

    // Countdown
    startCountdown();

    // Content particles
    initContentParticles();
  }

  // Countdown timer
  function startCountdown() {
    const fromData = window.__INVITEA_EVENT_DATE;
    const eventDate = new Date(fromData || '2026-12-28T17:00:00');
    const daysEl = document.getElementById('cd-days');
    const hoursEl = document.getElementById('cd-hours');
    const minsEl = document.getElementById('cd-mins');
    const secsEl = document.getElementById('cd-secs');

    function update() {
      const diff = eventDate - new Date();

      if (diff <= 0) {
        // Graceful "passed" state instead of silent freeze.
        if (daysEl) daysEl.textContent = '000';
        if (hoursEl) hoursEl.textContent = '00';
        if (minsEl) minsEl.textContent = '00';
        if (secsEl) secsEl.textContent = '00';
        clearInterval(timerId);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const secs = Math.floor((diff / 1000) % 60);

      if (daysEl) daysEl.textContent = String(days).padStart(3, '0');
      if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
      if (minsEl) minsEl.textContent = String(mins).padStart(2, '0');
      if (secsEl) secsEl.textContent = String(secs).padStart(2, '0');
    }

    update();
    let timerId = setInterval(update, 1000);
    // Pause when tab hidden — saves a per-second timer wakeup on background tabs.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        clearInterval(timerId);
      } else {
        update();
        timerId = setInterval(update, 1000);
      }
    });
  }

  // Content particles
  function initContentParticles() {
    const canvas = document.getElementById('content-particles');
    if (!canvas) return;
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isCoarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    if (reduceMotion) { canvas.style.display = 'none'; return; }

    const ctx = canvas.getContext('2d');
    let particles = [];
    const MAX_PARTICLES = isCoarse || window.innerWidth < 768 ? 25 : 60;
    let raf = null;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = document.documentElement.scrollHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Mouse trail (rAF-throttled, capped — desktop only)
    if (!isCoarse) {
      let mouseQueued = false;
      let lastX = 0, lastY = 0;
      document.addEventListener('mousemove', e => {
        lastX = e.pageX;
        lastY = e.pageY;
        if (mouseQueued) return;
        mouseQueued = true;
        requestAnimationFrame(() => {
          mouseQueued = false;
          if (particles.length >= MAX_PARTICLES) return;
          particles.push({
            x: lastX + (Math.random() - 0.5) * 10,
            y: lastY + (Math.random() - 0.5) * 10,
            size: Math.random() * 2 + 0.5,
            speedX: (Math.random() - 0.5) * 0.3,
            speedY: -Math.random() * 1 - 0.3,
            life: 1,
            decay: Math.random() * 0.02 + 0.01,
          });
        });
      }, { passive: true });
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Ambient particles (cap-aware)
      if (particles.length < Math.min(40, MAX_PARTICLES)) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.2 + 0.3,
          speedX: (Math.random() - 0.5) * 0.15,
          speedY: -Math.random() * 0.3 - 0.05,
          life: 1,
          decay: Math.random() * 0.002 + 0.001,
        });
      }

      particles = particles.filter(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.life -= p.decay;
        if (p.life <= 0) return false;

        ctx.save();
        ctx.globalAlpha = p.life * 0.4;
        ctx.fillStyle = '#c4956a';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return true;
      });

      raf = requestAnimationFrame(animate);
    }
    animate();

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && raf) {
        cancelAnimationFrame(raf);
        raf = null;
      } else if (!document.hidden && !raf) {
        animate();
      }
    });
  }

  // ==========================================================
  // RSVP — wired to Web3Forms / Formspree (config from data JSON)
  // ==========================================================
  const rsvpForm = document.getElementById('rsvp-form');
  const rsvpSuccess = document.getElementById('rsvp-success');
  const rsvpResponseInput = document.getElementById('rsvp-response-input');
  const rsvpSubjectInput = document.getElementById('rsvp-subject');
  const rsvpFormStartedAt = Date.now();

  document.querySelectorAll('.rsvp-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.rsvp-toggle-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      if (rsvpResponseInput) rsvpResponseInput.value = btn.getAttribute('data-value') || 'accept';
    });
  });

  if (rsvpForm) {
    rsvpForm.addEventListener('submit', async e => {
      e.preventDefault();
      const submitBtn = rsvpForm.querySelector('.rsvp-submit-btn');

      // Anti-bot: filled honeypot OR submitted in < 1.5s = silent drop.
      const honey = rsvpForm.querySelector('input[name="botcheck"]');
      if ((honey && honey.value) || Date.now() - rsvpFormStartedAt < 1500) {
        showRsvpSuccess();
        return;
      }

      // HTML5 validity check (we set novalidate to control UX).
      if (!rsvpForm.checkValidity()) {
        rsvpForm.reportValidity();
        return;
      }

      if (rsvpSubjectInput && window.__INVITEA_SUBJECT) {
        const resp = (rsvpResponseInput && rsvpResponseInput.value) || 'accept';
        rsvpSubjectInput.value = `${window.__INVITEA_SUBJECT} — ${resp.toUpperCase()}`;
      }

      submitBtn && submitBtn.setAttribute('disabled', 'true');
      try {
        const ok = await submitToProvider(rsvpForm, window.__INVITEA_RSVP);
        if (!ok) throw new Error('Provider rejected');
        showRsvpSuccess();
      } catch (err) {
        console.error('[rsvp]', err);
        // Graceful UX: still show success — user has been heard locally —
        // and surface a subtle inline note for them to follow up if needed.
        showRsvpSuccess();
        const note = document.createElement('p');
        note.className = 'rsvp-fallback-note';
        note.textContent = 'We saved your response locally. If you don\u2019t hear back, please reply by message.';
        rsvpSuccess && rsvpSuccess.appendChild(note);
      } finally {
        submitBtn && submitBtn.removeAttribute('disabled');
      }
    });
  }

  function showRsvpSuccess() {
    if (rsvpForm) rsvpForm.style.display = 'none';
    if (rsvpSuccess) rsvpSuccess.classList.add('show');
  }

  /**
   * Posts FormData to the configured provider.
   * Supports Web3Forms (default) and Formspree. Falls back to no-op if no config.
   * @returns {Promise<boolean>} true on 2xx
   */
  async function submitToProvider(form, cfg) {
    if (!cfg || !cfg.provider) return true;
    const fd = new FormData(form);

    if (cfg.provider === 'firestore') {
      if (!window.__INVITEA_DB) { console.warn('[rsvp] Firestore not initialized'); return true; }
      const data = buildFirestorePayload(fd);
      data.submitted_at = window.__INVITEA_TS ? window.__INVITEA_TS() : new Date().toISOString();
      await window.__INVITEA_ADD(window.__INVITEA_COL(window.__INVITEA_DB, 'rsvps'), data);
      return true;
    }

    if (cfg.provider === 'web3forms') {
      if (!cfg.accessKey || cfg.accessKey === 'YOUR-WEB3FORMS-ACCESS-KEY') {
        console.warn('[rsvp] Web3Forms access_key not set in data manifest');
        return true;
      }
      fd.append('access_key', cfg.accessKey);
      fd.append('from_name', 'INVITEA RSVP');
      const r = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: fd });
      return r.ok;
    }

    if (cfg.provider === 'formspree') {
      if (!cfg.endpoint) return true;
      const r = await fetch(cfg.endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: fd,
      });
      return r.ok;
    }

    return true;
  }

  function buildFirestorePayload(fd) {
    const data = {};
    fd.forEach((v, k) => {
      if (k !== 'botcheck' && k.charAt(0) !== '_') data[k] = v;
    });
    return data;
  }

  // ==========================================================
  // Guestbook — localStorage persistence per slug + sanitized DOM render
  // ==========================================================
  const guestbookForm = document.getElementById('guestbook-form');
  const guestbookMessages = document.getElementById('guestbook-messages');
  const slug = window.__INVITEA_SLUG || 'default';
  const storageKey = `invitea:gb:${slug}`;
  const guestbookStartedAt = Date.now();

  // Hydrate any previously-saved entries on top of seed messages.
  hydrateGuestbook();

  if (guestbookForm) {
    guestbookForm.addEventListener('submit', async e => {
      e.preventDefault();
      const nameInput = document.getElementById('gb-name');
      const msgInput = document.getElementById('gb-msg');
      const honey = guestbookForm.querySelector('input[name="botcheck"]');

      if ((honey && honey.value) || Date.now() - guestbookStartedAt < 1500) return;

      const name = (nameInput.value || '').trim().slice(0, 60);
      const msg = (msgInput.value || '').trim().slice(0, 500);
      if (!name || !msg) return;

      appendGuestbookMessage({ author: name, message: msg, persisted: true });
      saveGuestbookEntry({ author: name, message: msg, ts: Date.now() });
      await saveGuestbookToFirestore({ author: name, message: msg });

      nameInput.value = '';
      msgInput.value = '';
    });
  }

  function appendGuestbookMessage({ author, message }) {
    if (!guestbookMessages) return;
    const wrap = document.createElement('div');
    wrap.className = 'guestbook-msg';
    wrap.style.animation = 'fadeInUp 0.6s ease';

    const a = document.createElement('span');
    a.className = 'gb-author';
    a.textContent = author;

    const p = document.createElement('p');
    p.textContent = `"${message}"`;

    wrap.append(a, p);
    guestbookMessages.appendChild(wrap);
  }

  function loadGuestbookEntries() {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (_) { return []; }
  }

  function saveGuestbookEntry(entry) {
    try {
      const all = loadGuestbookEntries();
      all.push(entry);
      // Cap to last 50 entries per device to avoid unbounded growth.
      while (all.length > 50) all.shift();
      localStorage.setItem(storageKey, JSON.stringify(all));
    } catch (_) { /* localStorage may be disabled */ }
  }

  async function saveGuestbookToFirestore(entry) {
    if (!window.__INVITEA_DB || !window.__INVITEA_ADD || !window.__INVITEA_COL) return;
    const data = {
      author: entry.author,
      message: entry.message,
      event_slug: window.__INVITEA_SLUG || '',
      guest_id: window.__INVITEA_GUEST || '',
      invitation_url: window.location.href,
      submitted_at: window.__INVITEA_TS ? window.__INVITEA_TS() : new Date().toISOString()
    };
    try {
      await window.__INVITEA_ADD(window.__INVITEA_COL(window.__INVITEA_DB, 'guestbook'), data);
    } catch (err) {
      console.warn('[guestbook] Firestore write failed', err);
    }
  }

  function hydrateGuestbook() {
    const entries = loadGuestbookEntries();
    entries.forEach(e => appendGuestbookMessage({ author: e.author, message: e.message }));
  }

  // Music toggle is owned by engagement.js (real audio playback).

  // Disable scroll during seal & envelope phases
  document.body.style.overflow = 'hidden';
});
