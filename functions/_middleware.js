// Runs in front of every request to the site.
//  - The admin center answers only under the secret ADMIN_PATH. Every other
//    admin-looking address gets the normal "page not found" page.
//  - /media/<id> serves photos uploaded in the admin.
//  - /embed/<key>.js shows pop-ups on a site hosted elsewhere.
//  - Public pages pass through, with any content saved in the admin applied.
import { handleAdmin } from '../server/admin.js';
import { asset, notFound } from '../server/assets.js';
import { savedContent, serveMedia, siteFor } from '../server/content.js';
import { activePopups } from '../server/popups.js';
import { pageFile, render } from '../server/render.js';
import { serveEmbed } from '../server/sites.js';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

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
    const site = env.DB ? await siteFor(env, url.hostname, path).catch(() => null) : null;
    // A site with its own web address has its pages at the top of that address:
    // /tryouts there is the file kept under the site's own folder (/fc/tryouts).
    if (site && site.ownHost) {
      if (path.includes('..')) return page(context, url, await notFound(env, url), site);
      const found = await asset(env, url, site.tpl.path + path.replace(/^\/+/, ''));
      return page(context, url, found.ok ? found : await notFound(env, url), site);
    }
    return page(context, url, await context.next(new Request(request, { headers })), site);
  }
  return context.next();
}

// Apply saved admin content to an HTML response. If anything goes wrong
// (for example the database is unreachable) the original page is served.
async function page(context, url, response, known) {
  const { request, env } = context;
  if (request.method !== 'GET' || !env.DB) return response;
  if (!(response.headers.get('Content-Type') || '').includes('text/html')) return response;
  try {
    const site = known || await siteFor(env, url.hostname, url.pathname);
    if (!site) return response;
    // Pop-ups are for real pages only, never the "page not found" page.
    const [saved, popups] = await Promise.all([
      savedContent(env, site.id, site.tpl),
      response.status === 200 ? activePopups(env, site.id, pageFile(url.pathname)).catch(() => []) : [],
    ]);
    return render(response, saved, url.pathname, popups, site.tpl);
  } catch (e) {
    console.error('render failed', e);
    return response;
  }
}
