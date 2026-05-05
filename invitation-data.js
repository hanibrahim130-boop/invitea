// INVITEA — Invitation data loader & binder
// Loads ?i=<slug> from URL, fetches data/<slug>.json, applies bindings.
// Falls back silently to static HTML if no slug or fetch fails (e.g. file://).

(function () {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  const slug = (params.get('i') || params.get('invite') || '').trim();
  const guestSlug = (params.get('g') || params.get('guest') || '').trim();

  // Expose globals up-front so other modules see them regardless of slug validity.
  window.__INVITEA_SLUG = slug || null;
  window.__INVITEA_GUEST = guestSlug || null;

  // Always apply per-guest greeting + RSVP prefill, even without a data slug.
  applyGuestPersonalization(guestSlug);

  if (!slug || !/^[a-z0-9-]+$/i.test(slug)) return; // safety: only safe slugs

  fetch(`data/${slug}.json`, { cache: 'no-store' })
    .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
    .then(applyData)
    .catch(err => console.warn('[invitation-data] No data for slug', slug, err));

  function applyGuestPersonalization(raw) {
    if (!raw || !/^[a-z0-9-]+$/i.test(raw)) return;
    // Slug to display name: "fatima-al-rashid" -> "Fatima Al-Rashid".
    const name = raw
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
      // Re-insert hyphen if the slug had double dash hint (skip for now)
      ;
    // Greeting line
    const greetEl = document.getElementById('inv-personal-greeting');
    if (greetEl) {
      greetEl.textContent = `Dear ${name},`;
      greetEl.hidden = false;
    }
    // Pre-fill RSVP name + add hidden guest_id
    const nameField = document.getElementById('rsvp-name');
    if (nameField && !nameField.value) nameField.value = name;
    const rsvpForm = document.getElementById('rsvp-form');
    if (rsvpForm && !rsvpForm.querySelector('input[name="guest_id"]')) {
      const gid = document.createElement('input');
      gid.type = 'hidden';
      gid.name = 'guest_id';
      gid.value = raw;
      rsvpForm.appendChild(gid);
    }
    // Same for guestbook author prefill
    const gbName = document.getElementById('gb-name');
    if (gbName && !gbName.value) gbName.value = name;
  }

  function applyData(data) {
    if (!data || typeof data !== 'object') return;

    // Derived fields the templates reference but JSON shouldn't store redundantly.
    derive(data);

    // Expose backend config for invitation.js submit handlers + engagement.js features.
    window.__INVITEA_RSVP = data.rsvp || null;
    window.__INVITEA_SUBJECT = (data.rsvp && data.rsvp.subjectPrefix) || `RSVP — ${(data.couple && data.couple.names) || 'Invitation'}`;
    window.__INVITEA_DATA = data; // engagement.js reads music + event details
    // Notify engagement.js that data is ready (it may have loaded before us).
    document.dispatchEvent(new CustomEvent('invitea:data-ready', { detail: data }));

    // Theme overrides via CSS custom props.
    if (data.theme) {
      const root = document.documentElement;
      if (data.theme.accent) root.style.setProperty('--gold', data.theme.accent);
      if (data.theme.accentLight) root.style.setProperty('--gold-light', data.theme.accentLight);
    }

    // Page <title> + a couple of OG tags for share previews.
    if (data.couple && data.couple.names) {
      document.title = `${data.couple.names} — You're Invited`;
      setMeta('og:title', `${data.couple.names} — A ${data.event ? data.event.title || 'Celebration' : 'Celebration'}`);
    }

    // <element data-bind="path.to.value">
    document.querySelectorAll('[data-bind]').forEach(el => {
      const path = el.getAttribute('data-bind');
      const val = resolve(data, path);
      if (val == null) return;
      el.textContent = String(val);
    });

    // <element data-bind-html="path">  — TRUST: data file is author-controlled.
    // Keep the strings small and free of <script>; this is for line breaks etc.
    document.querySelectorAll('[data-bind-html]').forEach(el => {
      const path = el.getAttribute('data-bind-html');
      const val = resolve(data, path);
      if (val == null) return;
      el.innerHTML = sanitize(String(val));
    });

    // Lists: <container data-list="key"> — known schemas: story, guestbook
    if (Array.isArray(data.story)) renderStory(data.story);
    if (Array.isArray(data.guestbook)) renderGuestbook(data.guestbook);

    // Hand-off: stash dynamic event date for countdown.
    if (data.event && data.event.startISO) {
      window.__INVITEA_EVENT_DATE = data.event.startISO;
    }
  }

  function derive(data) {
    if (data.couple && data.couple.namesAmpersand && data.couple.namesAmpersand.length === 2) {
      const [a, b] = data.couple.namesAmpersand;
      // SAFE: we sanitize on apply; this just builds the display HTML.
      data.couple.namesHtml = `${escapeHtml(a)} <span class="inv-amp">&amp;</span> ${escapeHtml(b)}`;
    }
    if (data.venue && data.venue.city && data.venue.country) {
      data.venue.cityCountry = `${data.venue.city}, ${data.venue.country}`;
    }
    if (data.event && data.event.startISO) {
      try {
        const d = new Date(data.event.startISO);
        if (!isNaN(d)) {
          data.event.fullDate = d.toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
          });
        }
      } catch (_) { /* noop */ }
    }
  }

  function resolve(obj, path) {
    return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Permissive sanitizer for author-controlled HTML strings.
  // Strips <script>, on* handlers, and javascript: URLs — keeps simple inline tags.
  function sanitize(html) {
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
      .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
      .replace(/javascript:/gi, '');
  }

  function setMeta(property, value) {
    let el = document.querySelector(`meta[property="${property}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('property', property);
      document.head.appendChild(el);
    }
    el.setAttribute('content', value);
  }

  function renderStory(items) {
    const root = document.querySelector('[data-list="story"]');
    if (!root) return;
    // Preserve the connector line; remove existing items only.
    root.querySelectorAll('.timeline-item').forEach(n => n.remove());
    items.forEach((item, i) => {
      const wrap = document.createElement('div');
      wrap.className = 'timeline-item reveal-inv' + (i % 2 === 1 ? ' right' : '');

      const dot = document.createElement('div');
      dot.className = 'timeline-dot';

      const content = document.createElement('div');
      content.className = 'timeline-content';

      const date = document.createElement('span');
      date.className = 'timeline-date';
      date.textContent = item.date || '';

      const title = document.createElement('h3');
      title.textContent = item.title || '';

      const body = document.createElement('p');
      body.textContent = item.body || '';

      content.append(date, title, body);
      wrap.append(dot, content);
      root.appendChild(wrap);
    });
  }

  function renderGuestbook(items) {
    const root = document.querySelector('[data-list="guestbook"]');
    if (!root) return;
    root.replaceChildren();
    items.forEach(({ author, message }) => {
      const item = document.createElement('div');
      item.className = 'guestbook-msg';

      const a = document.createElement('span');
      a.className = 'gb-author';
      a.textContent = author || 'Anonymous';

      const p = document.createElement('p');
      p.textContent = `"${message || ''}"`;

      item.append(a, p);
      root.appendChild(item);
    });
  }
})();
