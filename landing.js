/* ============================================
   INVITEA — Ultra-Premium Landing JS
   ============================================ */

(function () {
  'use strict';

  /* ---- Preloader ---- */
  var pre = document.getElementById('preloader');
  function dismissPreloader() {
    if (pre) pre.classList.add('done');
  }
  // Dismiss when fonts are ready OR after a hard ceiling, whichever first.
  // Prevents long FOIT and removes the previous fixed 2.6s theatrical hold.
  var minHold = 800; // small artistic minimum
  var maxHold = 3000;
  var startedAt = performance.now();
  var fontsReady = (document.fonts && document.fonts.ready) || Promise.resolve();
  Promise.race([
    fontsReady,
    new Promise(function (resolve) { setTimeout(resolve, maxHold); })
  ]).then(function () {
    var elapsed = performance.now() - startedAt;
    var wait = Math.max(0, minHold - elapsed);
    setTimeout(dismissPreloader, wait);
  });

  /* ---- Cursor glow (desktop only) ---- */
  var glow = document.getElementById('cursor-glow');
  var glowRaf = null;
  if (glow && window.matchMedia('(pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var gx = 0, gy = 0, cx = 0, cy = 0;
    document.addEventListener('mousemove', function (e) {
      gx = e.clientX;
      gy = e.clientY;
    }, { passive: true });
    function glowLoop() {
      cx += (gx - cx) * 0.08;
      cy += (gy - cy) * 0.08;
      glow.style.left = cx + 'px';
      glow.style.top = cy + 'px';
      glowRaf = requestAnimationFrame(glowLoop);
    }
    glowLoop();
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && glowRaf) {
        cancelAnimationFrame(glowRaf);
        glowRaf = null;
      } else if (!document.hidden && !glowRaf) {
        glowLoop();
      }
    });
  } else if (glow) {
    glow.style.display = 'none';
  }

  /* ---- Ambient canvas (floating particles) ---- */
  var canvas = document.getElementById('ambient-canvas');
  var prefersReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isCoarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  if (canvas && !prefersReduce) {
    var ctx = canvas.getContext('2d');
    var particles = [];
    // Lower count on touch / small screens to save battery + frame budget.
    var particleCount = isCoarse || window.innerWidth < 768 ? 18 : 40;
    var pRaf = null;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    for (var i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5 + 0.5,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.3 + 0.05,
        pulse: Math.random() * Math.PI * 2
      });
    }

    function animateParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(function (p) {
        p.x += p.speedX;
        p.y += p.speedY;
        p.pulse += 0.01;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        var alpha = p.opacity * (0.5 + 0.5 * Math.sin(p.pulse));
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#c4956a';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      pRaf = requestAnimationFrame(animateParticles);
    }
    animateParticles();

    // Pause when tab not visible — saves CPU/battery.
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && pRaf) {
        cancelAnimationFrame(pRaf);
        pRaf = null;
      } else if (!document.hidden && !pRaf) {
        animateParticles();
      }
    });
  } else if (canvas) {
    canvas.style.display = 'none';
  }

  /* ---- Navbar scroll state (rAF-throttled, idempotent) ---- */
  var navbar = document.getElementById('navbar');
  var navTicking = false;
  var navScrolled = false;
  window.addEventListener('scroll', function () {
    if (!navbar || navTicking) return;
    navTicking = true;
    requestAnimationFrame(function () {
      var shouldScroll = window.scrollY > 60;
      if (shouldScroll !== navScrolled) {
        navbar.classList.toggle('scrolled', shouldScroll);
        navScrolled = shouldScroll;
      }
      navTicking = false;
    });
  }, { passive: true });

  /* ---- Mobile menu ---- */
  var menuBtn = document.getElementById('mobile-menu-btn');
  var navLinks = document.getElementById('nav-links');
  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', function () {
      menuBtn.classList.toggle('active');
      navLinks.classList.toggle('active');
    });
    navLinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        menuBtn.classList.remove('active');
        navLinks.classList.remove('active');
      });
    });
  }

  /* ---- Scroll reveal ---- */
  var reveals = document.querySelectorAll('.reveal-up');
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  reveals.forEach(function (el) { revealObserver.observe(el); });

  /* ---- Counter animation ---- */
  var counters = document.querySelectorAll('.metric-value[data-count]');
  var counterObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      var target = parseInt(el.getAttribute('data-count'), 10);
      var duration = 2000;
      var start = 0;
      var startTime = null;

      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        var progress = Math.min((timestamp - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * target);
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target;
      }
      requestAnimationFrame(step);
      counterObserver.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(function (el) { counterObserver.observe(el); });

  /* ---- Journey connector fill on scroll ---- */
  var connector = document.getElementById('connector-fill');
  if (connector) {
    var journeySection = document.querySelector('.journey');
    var connectorObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          connector.style.width = '100%';
        }
      });
    }, { threshold: 0.3 });
    if (journeySection) connectorObserver.observe(journeySection);
  }

  var intakeForm = document.getElementById('client-intake-form');
  var intakeStatus = document.getElementById('client-intake-status');
  var packageLinks = document.querySelectorAll('[data-package]');
  function setPreferredPackage(packageName) {
    if (!intakeForm) return;
    var select = intakeForm.querySelector('[name="package"]');
    if (select && packageName) select.value = packageName;
  }
  packageLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      setPreferredPackage(link.getAttribute('data-package'));
    });
  });
  if (intakeForm) {
    intakeForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!intakeForm.checkValidity()) {
        intakeForm.reportValidity();
        return;
      }
      var data = new FormData(intakeForm);
      var recipient = intakeForm.getAttribute('data-recipient') || 'hello@invitea.app';
      var subject = 'INVITEA Project Request — ' + (data.get('eventType') || 'New Event');
      var body = [
        'Client Name: ' + (data.get('clientName') || ''),
        'Email: ' + (data.get('email') || ''),
        'Phone / WhatsApp: ' + (data.get('phone') || ''),
        'Event Type: ' + (data.get('eventType') || ''),
        'Event Date: ' + (data.get('eventDate') || ''),
        'Expected Guests: ' + (data.get('guestCount') || ''),
        'Preferred Package: ' + (data.get('package') || ''),
        'Design Direction: ' + (data.get('style') || ''),
        '',
        'Event Details:',
        data.get('details') || ''
      ].join('\n');
      window.location.href = 'mailto:' + recipient + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      if (intakeStatus) intakeStatus.textContent = 'Opening your email app with the project brief.';
    });
  }

  /* ---- Smooth scroll for anchor links ---- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

})();
