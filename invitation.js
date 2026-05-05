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

    requestAnimationFrame(sealParticleLoop);
  }
  sealParticleLoop();

  // Break the seal
  sealContainer.addEventListener('click', () => {
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
  });

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
    const eventDate = new Date('2026-12-28T17:00:00');

    function update() {
      const now = new Date();
      const diff = eventDate - now;

      if (diff <= 0) return;

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const secs = Math.floor((diff / 1000) % 60);

      const daysEl = document.getElementById('cd-days');
      const hoursEl = document.getElementById('cd-hours');
      const minsEl = document.getElementById('cd-mins');
      const secsEl = document.getElementById('cd-secs');

      if (daysEl) daysEl.textContent = String(days).padStart(3, '0');
      if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
      if (minsEl) minsEl.textContent = String(mins).padStart(2, '0');
      if (secsEl) secsEl.textContent = String(secs).padStart(2, '0');
    }

    update();
    setInterval(update, 1000);
  }

  // Content particles
  function initContentParticles() {
    const canvas = document.getElementById('content-particles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = document.documentElement.scrollHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Mouse trail
    document.addEventListener('mousemove', e => {
      for (let i = 0; i < 1; i++) {
        particles.push({
          x: e.pageX + (Math.random() - 0.5) * 10,
          y: e.pageY + (Math.random() - 0.5) * 10,
          size: Math.random() * 2 + 0.5,
          speedX: (Math.random() - 0.5) * 0.3,
          speedY: -Math.random() * 1 - 0.3,
          life: 1,
          decay: Math.random() * 0.02 + 0.01,
        });
      }
    });

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Ambient particles
      if (particles.length < 40) {
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

      requestAnimationFrame(animate);
    }
    animate();
  }

  // RSVP form
  const rsvpForm = document.getElementById('rsvp-form');
  const rsvpSuccess = document.getElementById('rsvp-success');

  document.querySelectorAll('.rsvp-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.rsvp-toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  if (rsvpForm) {
    rsvpForm.addEventListener('submit', e => {
      e.preventDefault();
      rsvpForm.style.display = 'none';
      rsvpSuccess.classList.add('show');
    });
  }

  // Guest book
  const guestbookForm = document.getElementById('guestbook-form');
  const guestbookMessages = document.getElementById('guestbook-messages');

  if (guestbookForm) {
    guestbookForm.addEventListener('submit', e => {
      e.preventDefault();
      const nameInput = guestbookForm.querySelector('input');
      const msgInput = guestbookForm.querySelector('textarea');
      const name = nameInput.value.trim();
      const msg = msgInput.value.trim();

      if (name && msg) {
        const msgEl = document.createElement('div');
        msgEl.className = 'guestbook-msg';
        msgEl.style.animation = 'fadeInUp 0.6s ease';
        msgEl.innerHTML = `
          <span class="gb-author">${name}</span>
          <p>"${msg}"</p>
        `;
        guestbookMessages.appendChild(msgEl);
        nameInput.value = '';
        msgInput.value = '';
      }
    });
  }

  // Music toggle (placeholder)
  const musicToggle = document.getElementById('music-toggle');
  if (musicToggle) {
    musicToggle.classList.add('muted');
    musicToggle.addEventListener('click', () => {
      musicToggle.classList.toggle('muted');
    });
  }

  // Disable scroll during seal & envelope phases
  document.body.style.overflow = 'hidden';
});
