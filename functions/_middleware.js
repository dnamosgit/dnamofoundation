// Runs in front of every request to the site.
//  - The admin center answers only under the secret ADMIN_PATH. Every other
//    admin-looking address gets the normal "page not found" page.
//  - /media/<id> serves photos uploaded in the admin.
//  - /embed/<key>.js shows pop-ups on a site hosted elsewhere.
//  - Public pages pass through, with any content saved in the admin applied.
import { handleAdmin } from '../server/admin.js';
import { notFound } from '../server/assets.js';
import { savedContent, serveMedia, siteForHost } from '../server/content.js';
import { activePopups } from '../server/popups.js';
import { pageFile, render } from '../server/render.js';
import { serveEmbed } from '../server/sites.js';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // TEMPORARY setup check, to be removed once the admin is reachable. It says only
  // whether each setting is present and well-formed, never what it contains.
  if (path === '/_adm/check') {
    const raw = String(env.ADMIN_PATH || '');
    const tidy = raw.trim().replace(/^\/+|\/+$/g, '');
    const state = !raw ? 'missing' : tidy.length < 8 ? 'too-short' : !/^[a-z0-9-]+$/.test(tidy) ? 'odd-characters' : raw !== tidy ? 'ok-after-trim' : 'ok';
    const res = await notFound(env, url);
    const headers = new Headers(res.headers);
    headers.set('X-Setup-Check', `path=${state}; code=${String(env.SETUP_TOKEN || '').trim().length >= 16 ? 'ok' : 'missing-or-short'}; db=${env.DB ? 'ok' : 'missing'}`);
    return new Response(res.body, { status: 404, headers });
  }

  // The admin's own files live in /_adm/ and are never served directly.
  if (path === '/_adm' || path.startsWith('/_adm/')) return page(context, url, await notFound(env, url));

  const secret = String(env.ADMIN_PATH || '').trim().replace(/^\/+|\/+$/g, '');
  if (secret.length >= 8) {
    const base = '/' + secret;
    if (path === base || path.startsWith(base + '/')) {
      return handleAdmin(context, base, path.slice(base.length) || '');
    }
  }

  const media = path.match(/^\/media\/([0-9a-f]{24})$/);
  if (media && env.DB && request.method === 'GET') {
    return (await serveMedia(context, media[1])) || page(context, url, await notFound(env, url));
  }

  // The one-line script that shows pop-ups on a site hosted elsewhere.
  const embed = path.match(/^\/embed\/([0-9a-f]{32})\.js$/);
  if (embed && env.DB && request.method === 'GET') {
    return (await serveEmbed(context, embed[1])) || new Response('/* unknown site */\n', {
      status: 404, headers: { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-store' } });
  }

  // Pages are always fetched in full (never "not modified"), because saved
  // content can change what a page shows without the file itself changing.
  const last = path.split('/').pop();
  if (request.method === 'GET' && (!last.includes('.') || last.endsWith('.html'))) {
    const headers = new Headers(request.headers);
    headers.delete('If-None-Match');
    headers.delete('If-Modified-Since');
    return page(context, url, await context.next(new Request(request, { headers })));
  }
  return context.next();
}

// Apply saved admin content to an HTML response. If anything goes wrong
// (for example the database is unreachable) the original page is served.
async function page(context, url, response) {
  const { request, env } = context;
  if (request.method !== 'GET' || !env.DB) return response;
  if (!(response.headers.get('Content-Type') || '').includes('text/html')) return response;
  try {
    const siteId = await siteForHost(env, url.hostname);
    if (!siteId) return response;
    // Pop-ups are for real pages only, never the "page not found" page.
    const [saved, popups] = await Promise.all([
      savedContent(env, siteId),
      response.status === 200 ? activePopups(env, siteId, pageFile(url.pathname)).catch(() => []) : [],
    ]);
    return render(response, saved, url.pathname, popups);
  } catch (e) {
    console.error('render failed', e);
    return response;
  }
}
