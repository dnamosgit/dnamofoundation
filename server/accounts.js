// Admin accounts: invitations, password changes and removing people.
// There is no email sending: the owner gets a one-time link and passes it on.
import {
  checkPassword, clearFailures, createSession, hashPassword, isLockedOut, now, recordFailure, sessionCookie, sha256,
} from './auth.js';
import { text } from './valid.js';

export const MIN_PASSWORD = 12;
const MAX_USERS = 10;
const INVITE_SECONDS = 7 * 86400;
const RESET_SECONDS = 86400;

export const cleanEmail = (v) => String(v || '').trim().toLowerCase();
export const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 200;

export function checkNewPassword(password) {
  if (password.length < MIN_PASSWORD) throw new Error(`Use a password of at least ${MIN_PASSWORD} characters.`);
  if (password.length > 200) throw new Error('That password is too long.');
  return password;
}

const newToken = () => [...crypto.getRandomValues(new Uint8Array(32))].map((b) => b.toString(16).padStart(2, '0')).join('');

async function findInvite(env, token) {
  if (!/^[0-9a-f]{64}$/.test(token)) return null;
  return env.DB.prepare('SELECT * FROM invites WHERE token_hash = ? AND expires_at > ?').bind(await sha256(token), now()).first();
}

async function makeLink(env, kind, email, userId, by, seconds) {
  const token = newToken();
  const t = now();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM invites WHERE expires_at <= ? OR (kind = ? AND email = ?)').bind(t, kind, email),
    env.DB.prepare('INSERT INTO invites (token_hash, kind, email, user_id, created_by, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(await sha256(token), kind, email, userId, by, t, t + seconds),
  ]);
  return { token, email, expiresAt: t + seconds };
}

// Open to people who are not signed in: using a one-time link.
// Returns a Response, or null when the request is for something else.
export async function joinRoutes(c) {
  const { env, route, body, ip } = c;
  if (route !== 'POST /join/check' && route !== 'POST /join') return null;
  if (await isLockedOut(env, 'join', ip)) return c.fail(429, 'Too many attempts. Try again in 15 minutes.');
  const inv = await findInvite(env, String(body.token || ''));
  if (!inv) {
    await recordFailure(env, 'join', ip);
    return c.fail(404, 'This link is no longer valid. Ask the site owner for a new one.');
  }
  if (route === 'POST /join/check') return c.json({ kind: inv.kind, email: inv.email, minPassword: MIN_PASSWORD });

  const p = await hashPassword(checkNewPassword(String(body.password || '')));
  let userId = inv.user_id;
  if (inv.kind === 'reset') {
    await env.DB.batch([
      env.DB.prepare('UPDATE users SET pass_hash = ?, pass_salt = ?, pass_iter = ? WHERE id = ?').bind(p.hash, p.salt, p.iter, userId),
      env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId),
      env.DB.prepare('DELETE FROM invites WHERE id = ?').bind(inv.id),
    ]);
  } else {
    const name = text(body.name, 100, 'Your name');
    // The link is used up first, so it can never create two accounts.
    const used = await env.DB.prepare('DELETE FROM invites WHERE id = ?').bind(inv.id).run();
    if (!used.meta.changes) return c.fail(404, 'This link is no longer valid. Ask the site owner for a new one.');
    const made = await env.DB.prepare(
      `INSERT INTO users (email, name, role, pass_hash, pass_salt, pass_iter, created_at)
       SELECT ?, ?, 'admin', ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = ?)`)
      .bind(inv.email, name, p.hash, p.salt, p.iter, now(), inv.email).run();
    if (!made.meta.changes) return c.fail(409, 'There is already an account for this email. Sign in instead.');
    userId = made.meta.last_row_id;
  }
  const token = await createSession(env, userId);
  return c.json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(token, c.base, c.secure) });
}

// For signed-in admins. Returns a Response, or null when the request is for something else.
export async function accountRoutes(c) {
  const { env, route, method, sub, body, user, ip } = c;

  // Anyone can change their own password. Every other device is signed out.
  if (route === 'POST /account/password') {
    if (await isLockedOut(env, user.email, ip)) return c.fail(429, 'Too many attempts. Try again in 15 minutes.');
    const row = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(user.id).first();
    if (!(await checkPassword(String(body.current || '').slice(0, 200), row))) {
      await recordFailure(env, user.email, ip);
      return c.fail(400, 'Your current password is not right.');
    }
    await clearFailures(env, user.email, ip);
    const p = await hashPassword(checkNewPassword(String(body.password || '')));
    await env.DB.batch([
      env.DB.prepare('UPDATE users SET pass_hash = ?, pass_salt = ?, pass_iter = ? WHERE id = ?').bind(p.hash, p.salt, p.iter, user.id),
      env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user.id),
    ]);
    const token = await createSession(env, user.id);
    return c.json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(token, c.base, c.secure) });
  }

  const m = sub.match(/^\/api\/(users|invites)(?:\/(\d+|invite))?(?:\/(reset))?$/);
  if (!m) return null;
  if (user.role !== 'owner') return c.fail(403, 'Only the owner can manage admins.');
  const id = /^\d+$/.test(m[2] || '') ? Number(m[2]) : null;

  if (route === 'GET /users') {
    const users = (await env.DB.prepare('SELECT id, email, name, role, created_at AS createdAt FROM users ORDER BY id').all()).results;
    const invites = (await env.DB.prepare(
      'SELECT id, kind, email, expires_at AS expiresAt FROM invites WHERE expires_at > ? ORDER BY id').bind(now()).all()).results;
    return c.json({ users, invites, max: MAX_USERS });
  }

  if (route === 'POST /users/invite') {
    const email = cleanEmail(body.email);
    if (!validEmail(email)) return c.fail(400, 'Enter a valid email address.');
    if (await env.DB.prepare('SELECT 1 FROM users WHERE email = ?').bind(email).first()) return c.fail(400, 'That person already has an account.');
    const count = (await env.DB.prepare(
      `SELECT (SELECT COUNT(*) FROM users) + (SELECT COUNT(*) FROM invites WHERE kind = 'invite' AND expires_at > ? AND email <> ?) AS n`)
      .bind(now(), email).first()).n;
    if (count >= MAX_USERS) return c.fail(400, `There can be up to ${MAX_USERS} admins, counting open invitations.`);
    return c.json(await makeLink(env, 'invite', email, null, user.id, INVITE_SECONDS));
  }

  if (method === 'POST' && m[1] === 'users' && id && m[3] === 'reset') {
    if (id === user.id) return c.fail(400, 'Change your own password under My account.');
    const target = await env.DB.prepare('SELECT id, email FROM users WHERE id = ?').bind(id).first();
    if (!target) return c.fail(404, 'That account no longer exists.');
    return c.json(await makeLink(env, 'reset', target.email, target.id, user.id, RESET_SECONDS));
  }

  if (method === 'DELETE' && m[1] === 'users' && id && !m[3]) {
    if (id === user.id) return c.fail(400, 'You cannot remove your own account.');
    const done = await env.DB.batch([
      env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id),
      env.DB.prepare('DELETE FROM invites WHERE user_id = ?').bind(id),
      env.DB.prepare("DELETE FROM users WHERE id = ? AND role <> 'owner'").bind(id),
    ]);
    return done[2].meta.changes ? c.json({ ok: true }) : c.fail(404, 'That account no longer exists.');
  }

  if (method === 'DELETE' && m[1] === 'invites' && id && !m[3]) {
    const done = await env.DB.prepare('DELETE FROM invites WHERE id = ?').bind(id).run();
    return done.meta.changes ? c.json({ ok: true }) : c.fail(404, 'That link no longer exists.');
  }
  return null;
}
