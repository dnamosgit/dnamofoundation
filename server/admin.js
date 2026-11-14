// The admin center: its page, its files and its API, all under the secret path.
import { asset, notFound } from './assets.js';
import {
  checkPassword, clearFailures, createSession, currentUser, endSession, hashPassword,
  isLockedOut, now, recordFailure, sameSecret, sessionCookie,
} from './auth.js';
import { MIN_PASSWORD, accountRoutes, checkNewPassword, cleanEmail, joinRoutes, validEmail } from './accounts.js';
import { saveContent, saveMedia, savedContent } from './content.js';
import { templateFor } from './templates.js';
import { SITE_COLUMNS, siteRoutes } from './sites.js';
import { FREQUENCIES, LAYOUTS, createPopup, deletePopup, listPopups, updatePopup } from './popups.js';

const FILES = { '/admin.css': '/_adm/admin.css', '/admin.js': '/_adm/admin.js' };

const SECURITY = {
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
};

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...SECURITY, ...extra },
  });
}
const fail = (status, error) => json({ error }, status);

async function file(env, url, path) {
  const res = await asset(env, url, path);
  if (!res.ok) return notFound(env, url);
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(SECURITY)) headers.set(k, v);
  return new Response(res.body, { status: 200, headers });
}

export async function handleAdmin(context, base, sub) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  if (!env.DB) return fail(500, 'The database is not connected.');

  // Pages and files
  if (method === 'GET' || method === 'HEAD') {
    if (sub === '') return Response.redirect(url.origin + base + '/', 302);
    if (sub === '/') return file(env, url, '/_adm/index.html');
    if (FILES[sub]) return file(env, url, FILES[sub]);
  }

  if (!sub.startsWith('/api/')) return notFound(env, url);
  const route = method + ' ' + sub.slice(4);

  // Changes must come from the admin page itself, as JSON.
  // (Photo uploads are the one exception: they send the image file itself.)
  const upload = method === 'POST' && sub.match(/^\/api\/sites\/(\d+)\/media$/);
  let body = {};
  if (method !== 'GET' && request.headers.get('Origin') !== url.origin) return fail(403, 'Request blocked.');
  if (method !== 'GET' && !upload) {
    if (!(request.headers.get('Content-Type') || '').startsWith('application/json')) return fail(415, 'Send JSON.');
    try { body = await request.json(); } catch (e) { return fail(400, 'Invalid request.'); }
    if (!body || typeof body !== 'object') return fail(400, 'Invalid request.');
  }

  const secure = url.protocol === 'https:';
  const ip = request.headers.get('CF-Connecting-IP') || 'local';
  const userCount = (await env.DB.prepare('SELECT COUNT(*) AS n FROM users').first()).n;
  const user = await currentUser(env, request);

  // What the admin page should show: first-time setup, sign-in, or the app.
  if (route === 'GET /state') {
    if (!userCount) return json({ view: 'setup', minPassword: MIN_PASSWORD });
    if (!user) return json({ view: 'login' });
    const sites = (await env.DB.prepare(`SELECT ${SITE_COLUMNS} FROM sites ORDER BY id`).all()).results;
    return json({ view: 'app', user, sites });
  }

  // First-time setup: creates the owner account. Works only while there are no accounts.
  if (route === 'POST /setup') {
    if (userCount) return fail(409, 'Setup is already complete.');
    if (!env.SETUP_TOKEN || String(env.SETUP_TOKEN).length < 16) return fail(500, 'SETUP_TOKEN is not configured.');
    if (await isLockedOut(env, 'setup', ip)) return fail(429, 'Too many attempts. Try again in 15 minutes.');
    if (!(await sameSecret(body.token || '', env.SETUP_TOKEN))) {
      await recordFailure(env, 'setup', ip);
      return fail(403, 'That setup code is not right.');
    }
    const email = cleanEmail(body.email);
    const name = String(body.name || '').trim().slice(0, 100);
    const password = String(body.password || '');
    if (!name) return fail(400, 'Enter your name.');
    if (!validEmail(email)) return fail(400, 'Enter a valid email address.');
    try { checkNewPassword(password); } catch (e) { return fail(400, e.message); }
    const p = await hashPassword(password);
    const made = await env.DB.prepare(
      `INSERT INTO users (email, name, role, pass_hash, pass_salt, pass_iter, created_at)
       SELECT ?, ?, 'owner', ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM users)`)
      .bind(email, name, p.hash, p.salt, p.iter, now()).run();
    if (!made.meta.changes) return fail(409, 'Setup is already complete.');
    const token = await createSession(env, made.meta.last_row_id);
    return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(token, base, secure) });
  }

  if (route === 'POST /login') {
    const email = cleanEmail(body.email);
    const password = String(body.password || '').slice(0, 200);
    if (await isLockedOut(env, email, ip)) return fail(429, 'Too many attempts. Try again in 15 minutes.');
    const row = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
    if (!(await checkPassword(password, row))) {
      await recordFailure(env, email, ip);
      return fail(401, 'Email or password is not right.');
    }
    await clearFailures(env, email, ip);
    const token = await createSession(env, row.id);
    return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(token, base, secure) });
  }

  if (route === 'POST /logout') {
    await endSession(env, request);
    return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie('', base, secure, 0) });
  }

  const c = { env, route, method, sub, body, user, ip, base, secure, json, fail };
  try {
    // Using a one-time invitation or password link (no sign-in needed)
    if (userCount) {
      const joined = await joinRoutes(c);
      if (joined) return joined;
    }

    // Everything below needs a signed-in admin.
    if (!user) return fail(401, 'Sign in first.');

    const other = (await accountRoutes(c)) || (await siteRoutes(c));
    if (other) return other;

    // Per-site routes: /api/sites/<id>/...
    const m = sub.match(/^\/api\/sites\/(\d+)\/(content|media|popups)(?:\/([a-z0-9]+))?$/);
    if (!m) return fail(404, 'Not found.');
    const site = await env.DB.prepare('SELECT id, name, kind, template FROM sites WHERE id = ?').bind(Number(m[1])).first();
    if (!site) return fail(404, 'That site does not exist.');
    // A site hosted elsewhere has pop-ups (and their photos) only, shown on all its pages.
    const full = site.kind === 'full';
    const tpl = templateFor(site.template);
    if (!full && m[2] === 'content') return fail(400, 'This site is hosted elsewhere, so only its pop-ups are managed here.');
    const popup = full || !body.popup || typeof body.popup !== 'object' ? body.popup : { ...body.popup, pages: 'all' };

    // Everything the editing screens need: current values, which are customised, and the photo slots
    if (method === 'GET' && m[2] === 'content' && !m[3]) {
      const saved = await savedContent(env, site.id, tpl);
      return json({ content: { ...tpl.DEFAULTS, ...saved }, customised: Object.keys(saved), slots: tpl.SLOTS, pages: tpl.PAGES, pageList: tpl.PAGE_LIST });
    }
    // Save one section. A value of null puts the section back to the original.
    if (method === 'PUT' && m[2] === 'content' && tpl.KEYS.includes(m[3])) {
      if (!('value' in body)) return fail(400, 'Invalid request.');
      return json({ value: await saveContent(env, site.id, m[3], body.value, user.id, tpl) });
    }
    if (upload && m[2] === 'media' && !m[3]) {
      return json(await saveMedia(env, site.id, request, user.id));
    }
    // Pop-ups: list, add, change, delete
    if (m[2] === 'popups') {
      const pid = /^\d+$/.test(m[3] || '') ? Number(m[3]) : null;
      if (method === 'GET' && !m[3]) {
        return json({ popups: await listPopups(env, site.id), pages: tpl.POPUP_PAGES, frequencies: FREQUENCIES, layouts: LAYOUTS, layout: tpl.dark ? 'wide' : 'card', now: now() });
      }
      if (method === 'POST' && !m[3]) return json({ popup: await createPopup(env, site.id, popup, user.id, tpl.POPUP_PAGES) });
      if (method === 'PUT' && pid) {
        const changed = await updatePopup(env, site.id, pid, popup, user.id, tpl.POPUP_PAGES);
        return changed ? json({ popup: changed }) : fail(404, 'That pop-up no longer exists.');
      }
      if (method === 'DELETE' && pid) {
        return (await deletePopup(env, site.id, pid)) ? json({ ok: true }) : fail(404, 'That pop-up no longer exists.');
      }
    }
    return fail(404, 'Not found.');
  } catch (e) {
    // Validation messages are written for the admin; anything else is a real fault.
    if (e instanceof Error && !(e instanceof TypeError) && !/D1_|SQLITE/.test(e.message)) return fail(400, e.message);
    console.error(e);
    return fail(500, 'Could not save. Try again.');
  }
}
