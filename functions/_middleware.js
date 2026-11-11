// Runs in front of every request to the site.
//  - The admin center answers only under the secret ADMIN_PATH. Every other
//    admin-looking address gets the normal "page not found" page.
//  - /media/<id> serves photos uploaded in the admin.
//  - Public pages pass through, with any content saved in the admin applied.
import { handleAdmin } from '../server/admin.js';
import { notFound } from '../server/assets.js';
import { savedContent, serveMedia, siteForHost } from '../server/content.js';
import { render } from '../server/render.js';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // The admin's own files live in /_adm/ and are never served directly.
  if (path === '/_adm' || path.startsWith('/_adm/')) return page(context, url, await notFound(env, url));

  const secret = String(env.ADMIN_PATH || '').replace(/^\/+|\/+$/g, '');
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
    return render(response, await savedContent(env, siteId), url.pathname);
  } catch (e) {
    console.error('render failed', e);
    return response;
  }
}
