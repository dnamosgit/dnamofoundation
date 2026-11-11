// Helpers for serving static files from inside a function.

// Fetch a static file, following the short redirects Pages adds
// (for example /404.html -> /404).
export async function asset(env, url, path) {
  let target = new URL(path, url.origin);
  let res;
  for (let i = 0; i < 3; i++) {
    res = await env.ASSETS.fetch(new Request(target, { method: 'GET' }));
    const loc = res.headers.get('Location');
    if (res.status < 300 || res.status >= 400 || !loc) break;
    target = new URL(loc, target);
  }
  return res;
}

// The site's normal "page not found" page, with a real 404 status.
export async function notFound(env, url) {
  const res = await asset(env, url, '/404.html');
  const headers = new Headers(res.headers);
  headers.set('Cache-Control', 'no-store');
  return new Response(res.body, { status: 404, headers });
}
