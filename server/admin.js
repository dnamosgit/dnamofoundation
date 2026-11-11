// The admin center: its page, its files and its API, all under the secret path.
import { asset, notFound } from './assets.js';
import {
  checkPassword, clearFailures, createSession, currentUser, endSession, hashPassword,
  isLockedOut, now, recordFailure, sameSecret, sessionCookie,
} from './auth.js';
import { saveContent, saveMedia, savedContent } from './content.js';
import { DEFAULTS, KEYS, PAGES, SLOTS } from './defaults.js';

const MIN_PASSWORD = 12;
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

const cleanEmail = (v) => String(v || '').trim().toLowerCase();
const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 200;

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
    const sites = (await env.DB.prepare('SELECT id, slug, name, hostnames FROM sites ORDER BY id').all()).results;
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
    if (password.length < MIN_PASSWORD) return fail(400, `Use a password of at least ${MIN_PASSWORD} characters.`);
    if (password.length > 200) return fail(400, 'That password is too long.');
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

  // Everything below needs a signed-in admin.
  if (!user) return fail(401, 'Sign in first.');

  // Per-site routes: /api/sites/<id>/...
  const m = sub.match(/^\/api\/sites\/(\d+)\/(content|media)(?:\/([a-z]+))?$/);
  if (!m) return fail(404, 'Not found.');
  const site = await env.DB.prepare('SELECT id, name FROM sites WHERE id = ?').bind(Number(m[1])).first();
  if (!site) return fail(404, 'That site does not exist.');

  try {
    // Everything the editing screens need: current values, which are customised, and the photo slots
    if (method === 'GET' && m[2] === 'content' && !m[3]) {
      const saved = await savedContent(env, site.id);
      return json({ content: { ...DEFAULTS, ...saved }, customised: Object.keys(saved), slots: SLOTS, pages: PAGES });
    }
    // Save one section. A value of null puts the section back to the original.
    if (method === 'PUT' && m[2] === 'content' && KEYS.includes(m[3])) {
      if (!('value' in body)) return fail(400, 'Invalid request.');
      return json({ value: await saveContent(env, site.id, m[3], body.value, user.id) });
    }
    if (upload && m[2] === 'media' && !m[3]) {
      return json(await saveMedia(env, site.id, request, user.id));
    }
  } catch (e) {
    // Validation messages are written for the admin; anything else is a real fault.
    if (e instanceof Error && !(e instanceof TypeError) && !/D1_|SQLITE/.test(e.message)) return fail(400, e.message);
    console.error(e);
    return fail(500, 'Could not save. Try again.');
  }
  return fail(404, 'Not found.');
}
