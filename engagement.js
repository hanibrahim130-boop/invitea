// INVITEA — Engagement Pack
// Features: Add to Calendar (.ics + Google + Outlook), Native Share, Real Music Player.
// Per-guest personalization is handled in invitation-data.js.

(function () {
  'use strict';

  const MUSIC_STORAGE_KEY = 'invitea:music:muted';
  let cachedData = window.__INVITEA_DATA || null;

  // If data hasn't loaded yet (loader runs async), wire the event listener.
  document.addEventListener('invitea:data-ready', e => {
    cachedData = e.detail;
    initCalendar();
    initMusic();
  });

  // DOM is parsed for module scripts; wire UI immediately.
  initShare();
  initCalendar();
  initMusic();

  // ============ ADD TO CALENDAR ============
  function initCalendar() {
    const dropdown = document.getElementById('cal-dropdown');
    const btn = document.getElementById('cal-btn');
    const menu = dropdown && dropdown.querySelector('.cal-menu');
    if (!btn || !menu) return;

    const event = getEvent();
    if (!event) {
      // Hide if there's no event date.
      dropdown.style.display = 'none';
      return;
    }

    // Populate href targets each time data is available.
    const apple = menu.querySelector('[data-cal="apple"]');
    const google = menu.querySelector('[data-cal="google"]');
    const outlook = menu.querySelector('[data-cal="outlook"]');

    if (apple) {
      apple.addEventListener('click', e => {
        e.preventDefault();
        downloadIcs(event);
        closeMenu();
      });
    }
    if (google) google.href = googleCalUrl(event);
    if (outlook) outlook.href = outlookCalUrl(event);

    btn.addEventListener('click', () => {
      const open = !menu.hasAttribute('hidden');
      if (open) closeMenu();
      else openMenu();
    });

    document.addEventListener('click', e => {
      if (!dropdown.contains(e.target)) closeMenu();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeMenu();
    });

    function openMenu() {
      menu.removeAttribute('hidden');
      btn.setAttribute('aria-expanded', 'true');
    }
    function closeMenu() {
      menu.setAttribute('hidden', '');
      btn.setAttribute('aria-expanded', 'false');
    }
  }

  function getEvent() {
    const d = cachedData;
    if (!d || !d.event || !d.event.startISO) return null;
    const venueParts = [d.venue && d.venue.name, d.venue && d.venue.city, d.venue && d.venue.country].filter(Boolean);
    return {
      title: `${(d.couple && d.couple.names) || 'Wedding'} — ${(d.event && d.event.title) || 'Celebration'}`,
      startISO: d.event.startISO,
      endISO: d.event.endISO || addHoursIso(d.event.startISO, 6),
      location: venueParts.join(', '),
      description: `You are invited to the ${(d.event && d.event.title) || 'celebration'} of ${(d.couple && d.couple.names) || ''}.`,
      url: window.location.href,
    };
  }

  function addHoursIso(iso, hours) {
    const d = new Date(iso);
    d.setHours(d.getHours() + hours);
    return d.toISOString();
  }

  // ICS .ics file builder
  function buildIcs(event) {
    const dt = (iso) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//INVITEA//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${randomId()}@invitea.app`,
      `DTSTAMP:${dt(new Date().toISOString())}`,
      `DTSTART:${dt(event.startISO)}`,
      `DTEND:${dt(event.endISO)}`,
      `SUMMARY:${escapeIcs(event.title)}`,
      `LOCATION:${escapeIcs(event.location)}`,
      `DESCRIPTION:${escapeIcs(event.description)}`,
      `URL:${event.url}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ];
    return lines.join('\r\n');
  }

  function escapeIcs(s) {
    return String(s || '')
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;');
  }

  function randomId() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  function downloadIcs(event) {
    const blob = new Blob([buildIcs(event)], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slugify(event.title)}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function slugify(s) {
    return String(s || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  }

  function googleCalUrl(event) {
    const fmt = (iso) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${fmt(event.startISO)}/${fmt(event.endISO)}`,
      details: event.description,
      location: event.location,
    });
    return `https://www.google.com/calendar/render?${params.toString()}`;
  }

  function outlookCalUrl(event) {
    const params = new URLSearchParams({
      path: '/calendar/action/compose',
      rru: 'addevent',
      subject: event.title,
      startdt: event.startISO,
      enddt: event.endISO,
      body: event.description,
      location: event.location,
    });
    return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`;
  }

  // ============ NATIVE SHARE ============
  function initShare() {
    const btn = document.getElementById('share-btn');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      const d = cachedData;
      const couple = (d && d.couple && d.couple.names) || document.title || 'Invitation';
      const dateStr = (d && d.event && d.event.fullDate) ? ` on ${d.event.fullDate}` : '';
      const data = {
        title: `${couple} — Wedding Invitation`,
        text: `You're invited to ${couple}${dateStr}.`,
        url: window.location.href,
      };
      try {
        if (navigator.share) {
          await navigator.share(data);
        } else if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(data.url);
          toast('Link copied to clipboard');
        } else {
          // Last-resort fallback: select-the-URL prompt.
          window.prompt('Copy this invitation link:', data.url);
        }
      } catch (err) {
        if (err && err.name === 'AbortError') return; // user dismissed share sheet
        console.warn('[share]', err);
      }
    });
  }

  function toast(msg) {
    let t = document.getElementById('inv-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'inv-toast';
      t.className = 'inv-toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._tid);
    t._tid = setTimeout(() => t.classList.remove('show'), 2200);
  }

  // ============ REAL MUSIC PLAYER ============
  function initMusic() {
    const audio = document.getElementById('inv-audio');
    const btn = document.getElementById('music-toggle');
    if (!audio || !btn) return;

    const d = cachedData;
    const cfg = (d && d.music) || null;
    if (!cfg || !cfg.url) {
      btn.hidden = true;
      return;
    }

    audio.src = cfg.url;
    btn.hidden = false;

    const targetVolume = clamp(typeof cfg.volume === 'number' ? cfg.volume : 0.35, 0, 1);
    audio.volume = 0; // start silent for fade-in

    const muted = localStorage.getItem(MUSIC_STORAGE_KEY) === 'true';
    btn.classList.toggle('muted', muted);

    btn.addEventListener('click', async () => {
      const isMuted = btn.classList.contains('muted');
      if (isMuted) {
        try {
          await audio.play();
          fadeVolume(audio, 0, targetVolume, 1500);
          btn.classList.remove('muted');
          localStorage.setItem(MUSIC_STORAGE_KEY, 'false');
        } catch (err) {
          console.warn('[music] play blocked', err);
        }
      } else {
        await fadeVolume(audio, audio.volume, 0, 800);
        audio.pause();
        btn.classList.add('muted');
        localStorage.setItem(MUSIC_STORAGE_KEY, 'true');
      }
    });

    // Pause when tab hidden (saves bandwidth + respects user attention).
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && !audio.paused) {
        audio._wasPlaying = true;
        audio.pause();
      } else if (!document.hidden && audio._wasPlaying) {
        audio._wasPlaying = false;
        audio.play().catch(() => {});
      }
    });
  }

  function fadeVolume(audio, from, to, ms) {
    return new Promise(resolve => {
      const start = performance.now();
      function step(now) {
        const t = Math.min(1, (now - start) / ms);
        audio.volume = clamp(from + (to - from) * t, 0, 1);
        if (t < 1) requestAnimationFrame(step);
        else resolve();
      }
      requestAnimationFrame(step);
    });
  }

  function clamp(n, lo, hi) {
    return Math.max(lo, Math.min(hi, n));
  }
})();
