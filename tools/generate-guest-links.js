import { readFileSync } from 'node:fs';

const [, , eventSlug, guestFile, baseUrl = 'https://invitea-fawn.vercel.app'] = process.argv;

function fail(message) {
  console.error(message);
  process.exit(1);
}

function slugify(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseCsvLine(line) {
  const cells = [];
  let cell = '';
  let quoted = false;
  for (const char of line) {
    if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) {
      cells.push(cell.trim());
      cell = '';
    } else {
      cell += char;
    }
  }
  cells.push(cell.trim());
  return cells;
}

function parseCsv(source) {
  const lines = source.split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines.shift() || '');
  return lines.map(line => Object.fromEntries(parseCsvLine(line).map((cell, i) => [headers[i], cell])));
}

function csvCell(value) {
  const text = String(value || '');
  return /[",\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}

function buildLink(guest) {
  const guestSlug = slugify(guest.name);
  const url = new URL('/invitation.html', baseUrl);
  url.searchParams.set('i', eventSlug);
  url.searchParams.set('g', guestSlug);
  return { ...guest, guestSlug, url: url.toString() };
}

if (!eventSlug || !/^[a-z0-9-]+$/i.test(eventSlug)) fail('Usage: node tools/generate-guest-links.js <event-slug> <guest-list.csv> [base-url]');
if (!guestFile) fail('Guest list CSV path is required.');

const guests = parseCsv(readFileSync(guestFile, 'utf8')).filter(guest => guest.name);
const output = guests.map(buildLink);
const headers = ['name', 'group', 'phone', 'email', 'guestSlug', 'url'];
console.log(headers.join(','));
output.forEach(row => console.log(headers.map(header => csvCell(row[header])).join(',')));
