// The sites managed from this admin center.
// Sites of kind 'full' are served from here. Others are hosted elsewhere and show
// pop-ups made here by loading one small script: /embed/<key>.js
import { asset } from './assets.js';
import { now } from './auth.js';
import { activePopups } from './popups.js';
import { text } from './valid.js';

const MAX_SITES = 20;
const randomHex = (bytes) => [...crypto.getRandomValues(new Uint8Array(bytes))].map((b) => b.toString(16).padStart(2, '0')).join('');

export const SITE_COLUMNS = 'id, slug, name, hostnames, kind, template, embed_key AS embedKey';

// "https://www.example.org/about, example.org" -> "www.example.org,example.org"
function hosts(v, required) {
  const out = [];
  for (const part of String(v || '').split(/[\s,]+/)) {
    if (!part) continue;
    const host = part.toLowerCase().replace(/^[a-z]+:\/\//, '').replace(/[/?#].*$/, '');
    if (!/^[a-z0-9]([a-z0-9.-]*[a-z0-9])?(:\d{1,5})?$/.test(host) || host.length > 200) {
      throw new Error(`"${part}" is not a web address we can use. Use something like www.example.org.`);
    }
    if (!out.includes(host)) out.push(host);
  }
  if (out.length > 5) throw new Error('No more than 5 web addresses per site.');
  if (required && !out.length) throw new Error('Enter the web address of the site.');
  return out.join(',');
}

// Adding, renaming and removing sites: owner only.
// Returns a Response, or null when the request is for something else.
export async function siteRoutes(c) {
  const { env, method, sub, body, user } = c;
  const m = sub.match(/^\/api\/sites(?:\/(\d+))?$/);
  if (!m || method === 'GET') return null;
  if (user.role !== 'owner') return c.fail(403, 'Only the owner can manage sites.');
  const id = m[1] ? Number(m[1]) : null;

  if (method === 'POST' && !id) {
    const name = text(body.name, 80, 'The site name');
    const hostnames = hosts(body.address, true);
    const count = (await env.DB.prepare('SELECT COUNT(*) AS n FROM sites').first()).n;
    if (count >= MAX_SITES) throw new Error(`You can manage up to ${MAX_SITES} sites.`);
    const made = await env.DB.prepare(
      "INSERT INTO sites (slug, name, hostnames, kind, embed_key, created_at) VALUES (?, ?, ?, 'popups', ?, ?)")
      .bind('site-' + randomHex(6), name, hostnames, randomHex(16), now()).run();
    return c.json({ site: await env.DB.prepare(`SELECT ${SITE_COLUMNS} FROM sites WHERE id = ?`).bind(made.meta.last_row_id).first() });
  }

  if (method === 'PUT' && id) {
    const site = await env.DB.prepare('SELECT id, kind FROM sites WHERE id = ?').bind(id).first();
    if (!site) return c.fail(404, 'That site does not exist.');
    const name = text(body.name, 80, 'The site name');
    const hostnames = hosts(body.address, site.kind !== 'full');
    await env.DB.prepare('UPDATE sites SET name = ?, hostnames = ? WHERE id = ?').bind(name, hostnames, id).run();
    return c.json({ site: await env.DB.prepare(`SELECT ${SITE_COLUMNS} FROM sites WHERE id = ?`).bind(id).first() });
  }

  if (method === 'DELETE' && id) {
    // The site served from here can never be removed. Pop-ups and photos of a removed site go with it.
    const done = await env.DB.batch([
      env.DB.prepare("DELETE FROM popups WHERE site_id IN (SELECT id FROM sites WHERE id = ? AND kind = 'popups')").bind(id),
      env.DB.prepare("DELETE FROM media WHERE site_id IN (SELECT id FROM sites WHERE id = ? AND kind = 'popups')").bind(id),
      env.DB.prepare("DELETE FROM sites WHERE id = ? AND kind = 'popups'").bind(id),
    ]);
    return done[2].meta.changes ? c.json({ ok: true }) : c.fail(400, 'That site cannot be removed.');
  }
  return null;
}

// Public: /embed/<key>.js, loaded by a site hosted elsewhere. It carries that
// site's live pop-ups and the code that shows them. Returns null for an unknown key.
export async function serveEmbed(context, key) {
  const { env } = context;
  const url = new URL(context.request.url);
  const site = await env.DB.prepare("SELECT id FROM sites WHERE embed_key = ? AND kind = 'popups'").bind(key).first();
  if (!site) return null;
  const popups = await activePopups(env, site.id, null);
  let js = '/* no pop-ups right now */\n';
  if (popups.length) {
    // Photos live here, so their addresses are made complete for the other site.
    for (const p of popups) if (p.image) p.image = url.origin + p.image;
    const code = await asset(env, url, '/popup.js');
    if (!code.ok) return null;
    js = 'window.DnamoPopups=' + JSON.stringify(popups).replace(/</g, '\\u003c') + ';\n' + (await code.text());
  }
  return new Response(js, { headers: {
    'Content-Type': 'application/javascript; charset=utf-8',
    'Cache-Control': 'public, max-age=120',
    'X-Content-Type-Options': 'nosniff',
    'Cross-Origin-Resource-Policy': 'cross-origin',
  } });
}
