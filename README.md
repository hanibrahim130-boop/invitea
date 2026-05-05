# INVITEA

Premium digital invitation experiences — landing page + cinematic invitation demo.

## Stack

- Vanilla HTML/CSS/JS (no framework)
- [Vite](https://vitejs.dev/) for dev server, multi-page bundling, minification, asset hashing
- Google Fonts (Playfair Display, Cormorant Garamond, Great Vibes, Jost) loaded non-blocking

## Structure

```
.
├── index.html              # Landing page
├── invitation.html         # Per-event invitation (data-driven)
├── landing.css / landing.js
├── invitation.css / invitation.js
├── invitation-data.js      # Loads data/<slug>.json based on ?i=<slug>
├── public/
│   ├── favicon.svg
│   ├── robots.txt
│   ├── sitemap.xml
│   └── data/
│       └── sarah-ahmed.json   # Sample invitation manifest
├── vite.config.js
└── package.json
```

## Develop

```powershell
npm install
npm run dev
```

Then open:
- `http://localhost:5173/` — landing
- `http://localhost:5173/invitation.html` — invitation (default static fallback)
- `http://localhost:5173/invitation.html?i=sarah-ahmed` — invitation rendered from `public/data/sarah-ahmed.json`

## Build

```powershell
npm run build
npm run preview
```

Output: `dist/`. Deploy that directory to any static host (Netlify, Vercel, Cloudflare Pages, S3+CloudFront, GitHub Pages).

## Add a new invitation

1. Copy `public/data/sarah-ahmed.json` → `public/data/<your-slug>.json`
2. Edit names, dates, venue, story, guestbook, theme accent.
3. Share the URL: `https://your-domain/invitation.html?i=<your-slug>`

The slug must match `^[a-z0-9-]+$` (security guard against path traversal).

## Backend (RSVP)

RSVP submissions go to **[Web3Forms](https://web3forms.com/)** (or Formspree). No backend infra needed.

### Setup

1. Create a free Web3Forms account → grab your **access key**.
2. Edit your invitation manifest (`public/data/<slug>.json`):

```json
"rsvp": {
  "provider": "web3forms",
  "accessKey": "your-access-key-here",
  "subjectPrefix": "RSVP — Sarah & Ahmed"
}
```

You'll receive an email per submission. The subject is auto-suffixed with `— ACCEPT` or `— DECLINE`.

### Formspree alternative

```json
"rsvp": {
  "provider": "formspree",
  "endpoint": "https://formspree.io/f/yourFormId",
  "subjectPrefix": "RSVP — Sarah & Ahmed"
}
```

### Anti-bot

- Hidden honeypot input (`name="botcheck"`) — bots fill it, real users don't.
- 1.5s minimum render-to-submit window — silently drops auto-submits.

### Guestbook

Currently persisted to **`localStorage`** keyed per slug (`invitea:gb:<slug>`). Capped at 50 entries per device. Each visitor sees their own messages persist across sessions on the same device. For shared/server-side guestbook, swap in Supabase or a Worker (see `invitation.js` `submitToProvider` for the integration pattern).

## Engagement features

Implemented in `engagement.js`:

### Add to Calendar

The Date Badge in the welcome section has an "Add to Calendar" dropdown:
- **Apple Calendar** — generates a per-event `.ics` file at runtime and triggers a download.
- **Google Calendar** — opens `calendar.google.com` with the event pre-filled.
- **Outlook** — opens Outlook deeplink with the event pre-filled.

All three read from your `event.startISO` / `event.endISO` / `venue.*` in the JSON manifest. If `endISO` is missing, defaults to `startISO + 6 hours`.

### Native Share

Top-right share button. On mobile, opens the native share sheet (WhatsApp/iMessage/Email) via `navigator.share`. On desktop, copies the link to clipboard and shows a toast.

### Music Player

Set `music.url` and `music.volume` in the JSON manifest. The fixed top-right music button appears, fades in over 1.5s, persists muted state in `localStorage`, and pauses when the tab is hidden.

```json
"music": {
  "url": "https://yourcdn.com/song.mp3",
  "autoplay": false,
  "volume": 0.35
}
```

If `music.url` is `null`, the button is hidden.

### Per-guest personalization

Append `?g=<guest-slug>` to any invitation URL:

```
https://your-domain/invitation.html?i=sarah-ahmed&g=fatima-al-rashid
```

Effects:
- "Dear Fatima Al-Rashid," appears above the host line
- RSVP name field is pre-filled
- Guestbook author field is pre-filled
- A hidden `guest_id` field is appended to the RSVP submission so you know which invited guest responded

Slug rules: `^[a-z0-9-]+$`. Hyphens become spaces; each word is title-cased.

**Bulk URL generation** (PowerShell example):

```powershell
$guests = "fatima-al-rashid","omar-hassan","lina-khalid"
$base = "https://your-domain/invitation.html?i=sarah-ahmed"
$guests | ForEach-Object { "$base&g=$_" }
```

## Production checklist

- [ ] Replace `https://invitea.app/` with your real domain in `index.html`, `invitation.html`, `public/robots.txt`, `public/sitemap.xml`.
- [ ] Provide a real `og-image.jpg` (1200×630) at `public/og-image.jpg`.
- [ ] Set the Web3Forms (or Formspree) credentials in each `public/data/<slug>.json`.
- [ ] Generate a per-invitation OG preview image (`public/invitations/<slug>-og.jpg`).
- [ ] If you need shared guestbook across devices, replace localStorage with a server-backed provider.

## Architecture notes

- **`data-bind="path.to.value"`** → element `textContent` (XSS-safe).
- **`data-bind-html="path"`** → element `innerHTML` after permissive sanitizer (strips `<script>`, `on*=`, `javascript:`). Use only for author-controlled HTML.
- **`data-list="story|guestbook"`** → container is rebuilt from a JSON array.
- **Theme overrides** via `theme.accent` / `theme.accentLight` in JSON write to `--gold` / `--gold-light` CSS custom properties at runtime.
- **Reduced-motion** users skip the seal/envelope intro automatically.
- **Per-event pages are `noindex`** — they're private. The landing is public + sitemap-indexed.
