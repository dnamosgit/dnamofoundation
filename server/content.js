// Reading and saving a site's editable content, and its uploaded photos.
import { DEFAULTS, KEYS, clean } from './defaults.js';
import { now } from './auth.js';

const MAX_UPLOAD = 1500000;   // bytes; the database allows up to 2 MB per row

// Which site a request is for: matched by web address, otherwise the first site.
export async function siteForHost(env, hostname) {
  const sites = (await env.DB.prepare("SELECT id, hostnames FROM sites WHERE kind = 'full' ORDER BY id").all()).results;
  const host = hostname.toLowerCase();
  const hit = sites.find((s) => s.hostnames.split(',').map((h) => h.trim().toLowerCase()).includes(host));
  return (hit || sites[0] || {}).id || null;
}

// Only what has been saved, as { key: value }. Unsaved keys are absent.
export async function savedContent(env, siteId) {
  const rows = (await env.DB.prepare('SELECT key, value FROM content WHERE site_id = ?').bind(siteId).all()).results;
  const out = {};
  for (const r of rows) {
    if (!KEYS.includes(r.key)) continue;
    try { out[r.key] = JSON.parse(r.value); } catch (e) { /* ignore a damaged row; the default shows */ }
  }
  return out;
}

export async function saveContent(env, siteId, key, value, userId) {
  if (!KEYS.includes(key)) throw new Error('Unknown setting.');
  if (value === null) {           // back to the built-in original
    await env.DB.prepare('DELETE FROM content WHERE site_id = ? AND key = ?').bind(siteId, key).run();
    return DEFAULTS[key];
  }
  const tidy = clean(key, value);
  await env.DB.prepare(
    `INSERT INTO content (site_id, key, value, updated_at, updated_by) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (site_id, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by`)
    .bind(siteId, key, JSON.stringify(tidy), now(), userId).run();
  return tidy;
}

// --- Photos ---------------------------------------------------------------

// The real type is read from the file's first bytes, never trusted from the browser.
function sniff(b) {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return 'image/gif';
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'image/webp';
  return null;
}

export async function saveMedia(env, siteId, request, userId) {
  const declared = Number(request.headers.get('Content-Length') || 0);
  if (declared > MAX_UPLOAD) throw new Error('That photo is too large.');
  const buf = await request.arrayBuffer();
  if (!buf.byteLength) throw new Error('No photo was sent.');
  if (buf.byteLength > MAX_UPLOAD) throw new Error('That photo is too large.');
  const type = sniff(new Uint8Array(buf.slice(0, 12)));
  if (!type) throw new Error('Use a JPG, PNG, WebP or GIF image.');
  const id = [...crypto.getRandomValues(new Uint8Array(12))].map((x) => x.toString(16).padStart(2, '0')).join('');
  const name = decodeURIComponent(request.headers.get('X-File-Name') || '').replace(/[^\w .()-]/g, '').slice(0, 120);
  await env.DB.prepare('INSERT INTO media (id, site_id, type, size, name, data, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(id, siteId, type, buf.byteLength, name, buf, now(), userId).run();
  return { id, url: '/media/' + id, type, size: buf.byteLength };
}

// Public: /media/<id>. Ids are random and files never change, so they cache forever.
export async function serveMedia(context, id) {
  const { request, env } = context;
  const cache = caches.default;
  const hit = await cache.match(request);
  if (hit) return hit;
  const row = await env.DB.prepare('SELECT type, data FROM media WHERE id = ?').bind(id).first();
  if (!row) return null;
  const bytes = row.data instanceof ArrayBuffer ? row.data : new Uint8Array(row.data);
  const res = new Response(bytes, { headers: {
    'Content-Type': row.type,
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'",
  } });
  context.waitUntil(cache.put(request, res.clone()));
  return res;
}
