// Pop-ups: announcements shown over a page to visitors.
import { now } from './auth.js';
import { href, list, multiline, obj, text } from './valid.js';

const MAX_PER_SITE = 20;
const MAX_SHOWN = 5;          // at most this many are sent to a page; the visitor sees one

// Pages a pop-up can be limited to
export const POPUP_PAGES = [
  { file: 'index.html', label: 'Home' },
  { file: 'board.html', label: 'Board' },
  { file: 'initiatives.html', label: 'Our Initiatives' },
  { file: 'scholarships.html', label: 'Scholarships' },
  { file: 'coaches.html', label: 'Coach Recruitment' },
  { file: 'clubhouse.html', label: 'Club House & Field' },
  { file: 'testimonials.html', label: 'Testimonials' },
  { file: 'contact.html', label: 'Contact' },
  { file: 'donate.html', label: 'Donate' },
];
const FILES = POPUP_PAGES.map((p) => p.file);

// How often one visitor sees the same pop-up
export const FREQUENCIES = [
  { id: 'once', label: 'Once only' },
  { id: 'day', label: 'Once a day' },
  { id: 'session', label: 'Once per visit' },
  { id: 'always', label: 'Every page view' },
];

// A date arrives as seconds since 1970, or empty for "none"
function when(v, what) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0 || n > 4102444800) throw new Error(`${what} is not a date we can use.`);
  return n;
}

// Returns a tidy pop-up or throws an Error whose message is shown to the admin.
export function cleanPopup(v) {
  const o = obj(v);
  const title = text(o.title, 80, 'The title');
  const body = multiline(o.text, 600, 'The text', false);
  const image = String(o.image || '');
  if (image && !/^\/media\/[0-9a-f]{24}$/.test(image)) throw new Error('That photo is not one uploaded here.');
  const b = obj(o.button);
  const label = text(b.label, 40, 'The button label', false);
  const button = label ? { label, href: href(b.href, 'The button') } : { label: '', href: '' };

  let pages = 'all';
  if (o.pages !== 'all') {
    pages = [...new Set(list(o.pages, FILES.length, 'The list of pages'))].filter((p) => FILES.includes(p));
    if (!pages.length) throw new Error('Choose at least one page, or all pages.');
  }
  const frequency = FREQUENCIES.some((f) => f.id === o.frequency) ? o.frequency : 'once';
  const delay = Number(o.delay || 0);
  if (!Number.isInteger(delay) || delay < 0 || delay > 60) throw new Error('The delay must be between 0 and 60 seconds.');

  const startsAt = when(o.startsAt, 'The start date');
  const endsAt = when(o.endsAt, 'The end date');
  if (startsAt !== null && endsAt !== null && endsAt <= startsAt) throw new Error('The end date must be after the start date.');

  return { enabled: !!o.enabled, startsAt, endsAt, data: { title, text: body, image, button, pages, frequency, delay } };
}

function fromRow(r) {
  let data = {};
  try { data = JSON.parse(r.data); } catch (e) { /* a damaged row shows as empty */ }
  return { id: r.id, enabled: !!r.enabled, startsAt: r.starts_at, endsAt: r.ends_at, updatedAt: r.updated_at, ...data };
}

export async function listPopups(env, siteId) {
  const rows = (await env.DB.prepare('SELECT * FROM popups WHERE site_id = ? ORDER BY id DESC').bind(siteId).all()).results;
  return rows.map(fromRow);
}

export async function createPopup(env, siteId, value, userId) {
  const p = cleanPopup(value);
  const count = (await env.DB.prepare('SELECT COUNT(*) AS n FROM popups WHERE site_id = ?').bind(siteId).first()).n;
  if (count >= MAX_PER_SITE) throw new Error(`A site can have up to ${MAX_PER_SITE} pop-ups. Delete an old one first.`);
  const t = now();
  const made = await env.DB.prepare(
    'INSERT INTO popups (site_id, enabled, starts_at, ends_at, data, created_at, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(siteId, p.enabled ? 1 : 0, p.startsAt, p.endsAt, JSON.stringify(p.data), t, t, userId).run();
  return { id: made.meta.last_row_id, enabled: p.enabled, startsAt: p.startsAt, endsAt: p.endsAt, updatedAt: t, ...p.data };
}

// Returns the saved pop-up, or null when it does not exist on this site.
export async function updatePopup(env, siteId, id, value, userId) {
  const p = cleanPopup(value);
  const t = now();
  const done = await env.DB.prepare(
    'UPDATE popups SET enabled = ?, starts_at = ?, ends_at = ?, data = ?, updated_at = ?, updated_by = ? WHERE id = ? AND site_id = ?')
    .bind(p.enabled ? 1 : 0, p.startsAt, p.endsAt, JSON.stringify(p.data), t, userId, id, siteId).run();
  if (!done.meta.changes) return null;
  return { id, enabled: p.enabled, startsAt: p.startsAt, endsAt: p.endsAt, updatedAt: t, ...p.data };
}

export async function deletePopup(env, siteId, id) {
  const done = await env.DB.prepare('DELETE FROM popups WHERE id = ? AND site_id = ?').bind(id, siteId).run();
  return !!done.meta.changes;
}

// Public: the pop-ups that are on, inside their dates and meant for this page.
// Only what a visitor's browser needs is returned.
export async function activePopups(env, siteId, page) {
  const t = now();
  const rows = (await env.DB.prepare(
    `SELECT id, data FROM popups WHERE site_id = ? AND enabled = 1
       AND (starts_at IS NULL OR starts_at <= ?) AND (ends_at IS NULL OR ends_at > ?)
     ORDER BY id DESC`).bind(siteId, t, t).all()).results;
  const out = [];
  for (const r of rows) {
    let d;
    try { d = JSON.parse(r.data); } catch (e) { continue; }
    if (d.pages !== 'all' && !(Array.isArray(d.pages) && d.pages.includes(page))) continue;
    out.push({ id: r.id, title: d.title, text: d.text, image: d.image, button: d.button, frequency: d.frequency, delay: d.delay });
    if (out.length >= MAX_SHOWN) break;
  }
  return out;
}
