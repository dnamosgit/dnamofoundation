// Passwords, sessions and login throttling for the admin center.

const enc = new TextEncoder();
const PBKDF2_ITERATIONS = 100000;          // the maximum the Workers runtime allows
const SESSION_DAYS = 14;
const WINDOW_SECONDS = 15 * 60;            // look-back window for failed sign-ins
const MAX_FAILS_PER_ACCOUNT = 5;           // per email + network address
const MAX_FAILS_PER_ADDRESS = 20;          // per network address, any email
export const COOKIE = 'dn_session';

export const now = () => Math.floor(Date.now() / 1000);

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const unhex = (s) => new Uint8Array(s.match(/../g).map((h) => parseInt(h, 16)));

export async function sha256(text) {
  return hex(await crypto.subtle.digest('SHA-256', enc.encode(text)));
}

// Compare two secrets without leaking where they differ.
export async function sameSecret(a, b) {
  const [x, y] = await Promise.all([sha256(String(a)), sha256(String(b))]);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0;
}

async function pbkdf2(password, saltBytes, iterations) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations }, key, 256);
  return hex(bits);
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { hash: await pbkdf2(password, salt, PBKDF2_ITERATIONS), salt: hex(salt), iter: PBKDF2_ITERATIONS };
}

export async function checkPassword(password, user) {
  // With no such user, still do the work so the response time gives nothing away.
  if (!user) {
    await pbkdf2(password, new Uint8Array(16), PBKDF2_ITERATIONS);
    return false;
  }
  const got = await pbkdf2(password, unhex(user.pass_salt), user.pass_iter);
  return sameSecret(got, user.pass_hash);
}

// --- Sessions -------------------------------------------------------------

export async function createSession(env, userId) {
  const token = hex(crypto.getRandomValues(new Uint8Array(32)));
  const t = now();
  await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
    .bind(await sha256(token), userId, t, t + SESSION_DAYS * 86400).run();
  return token;
}

export function sessionCookie(token, base, secure, maxAge = SESSION_DAYS * 86400) {
  return `${COOKIE}=${token}; Path=${base}; HttpOnly; SameSite=Strict; Max-Age=${maxAge}` + (secure ? '; Secure' : '');
}

function readCookie(request) {
  const m = (request.headers.get('Cookie') || '').match(new RegExp('(?:^|;\\s*)' + COOKIE + '=([0-9a-f]{64})'));
  return m ? m[1] : null;
}

export async function currentUser(env, request) {
  const token = readCookie(request);
  if (!token) return null;
  return env.DB.prepare(
    `SELECT u.id, u.email, u.name, u.role FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > ?`).bind(await sha256(token), now()).first();
}

export async function endSession(env, request) {
  const token = readCookie(request);
  if (token) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(token)).run();
}

// --- Login throttling -----------------------------------------------------

const keys = (email, ip) => [`a:${email}|${ip}`, `i:${ip}`];

export async function isLockedOut(env, email, ip) {
  const [acct, addr] = keys(email, ip);
  const row = await env.DB.prepare(
    `SELECT COALESCE(SUM(who = ?1), 0) AS acct, COALESCE(SUM(who = ?2), 0) AS addr
     FROM login_attempts WHERE at > ?3 AND who IN (?1, ?2)`)
    .bind(acct, addr, now() - WINDOW_SECONDS).first();
  return row.acct >= MAX_FAILS_PER_ACCOUNT || row.addr >= MAX_FAILS_PER_ADDRESS;
}

export async function recordFailure(env, email, ip) {
  const t = now();
  const [acct, addr] = keys(email, ip);
  await env.DB.batch([
    env.DB.prepare('INSERT INTO login_attempts (who, at) VALUES (?, ?)').bind(acct, t),
    env.DB.prepare('INSERT INTO login_attempts (who, at) VALUES (?, ?)').bind(addr, t),
    env.DB.prepare('DELETE FROM login_attempts WHERE at < ?').bind(t - 86400),
  ]);
}

export async function clearFailures(env, email, ip) {
  await env.DB.prepare('DELETE FROM login_attempts WHERE who = ?').bind(keys(email, ip)[0]).run();
}
