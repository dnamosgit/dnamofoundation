// Applies saved admin content to a public page on its way to the visitor.
// The pages in /public hold the original content; only sections that have been
// saved in the admin are rewritten, so an untouched site is served as-is.

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const CARET = '<svg class="caret" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 4.5L6 8l3.5-3.5"/></svg>';

// "/board" and "/board.html" are both board.html; "/" is index.html
function pageFile(pathname) {
  const last = pathname.split('/').pop();
  if (!last) return 'index.html';
  return last.includes('.') ? last : last + '.html';
}
const fileOf = (href) => href.split('#')[0].split('?')[0].replace(/^\//, '') || 'index.html';

// The main menu, with the same markup and classes the page generator writes.
function navHtml(header, page) {
  let out = '';
  for (const it of header.items) {
    const kids = it.children || [];
    const here = fileOf(it.href) === page;
    const on = here || kids.some((k) => fileOf(k.href) === page);
    const cls = on ? 'nav on' : 'nav';
    const cur = here ? ' aria-current="page"' : '';
    if (!kids.length) {
      out += `<a class="${cls}" href="${esc(it.href)}"${cur}>${esc(it.label)}</a>`;
      continue;
    }
    out += `<div class="navdrop"><a class="${cls}" href="${esc(it.href)}"${cur}>${esc(it.label)}${CARET}</a><div class="dropmenu">`;
    for (const k of kids) {
      // A link to a section of a page ("page.html#part") is never marked as the current page
      const kon = !k.href.includes('#') && fileOf(k.href) === page ? ' class="on" aria-current="page"' : '';
      out += `<a href="${esc(k.href)}"${kon}>${esc(k.label)}</a>`;
    }
    out += '</div></div>';
  }
  if (header.button && header.button.label) {
    out += `<a class="btn" href="${esc(header.button.href)}">${esc(header.button.label)}</a>`;
  }
  return out;
}

export function render(response, saved, pathname) {
  const { identity, header, footer, photos } = saved;
  if (!identity && !header && !footer && !(photos && Object.keys(photos).length)) return response;

  const rw = new HTMLRewriter();
  const page = pageFile(pathname);

  if (identity) {
    const full = (identity.nameA + ' ' + identity.nameB).trim();
    rw.on('a.nav.brand', { element(el) {
      el.setInnerContent(esc(identity.nameA) + (identity.nameB ? ` <span>${esc(identity.nameB)}</span>` : ''), { html: true });
    } });
    // The browser tab title: swap the original site name for the saved one
    let buffer = '';
    rw.on('title', { text(t) {
      buffer += t.text;
      if (!t.lastInTextNode) { t.remove(); return; }
      t.replace(buffer.split('Dnamo Football Foundation').join(full));
      buffer = '';
    } });
  }

  if (header) {
    rw.on('nav.navbox', { element(el) { el.setInnerContent(navHtml(header, page), { html: true }); } });
  }

  if (footer) {
    rw.on('nav.foot-links', { element(el) {
      el.setInnerContent(footer.links.map((l) => `<a class="nav" href="${esc(l.href)}">${esc(l.label)}</a>`).join(''), { html: true });
    } });
    rw.on('.foot .legal', { element(el) { el.setInnerContent(footer.legal); } });
    rw.on('.foot-base > span', { element(el) { el.setInnerContent(footer.copyright); } });
    const social = (url) => ({ element(el) { if (url) el.setAttribute('href', url); else el.remove(); } });
    rw.on('.soc a[aria-label$="LinkedIn"]', social(footer.linkedin));
    rw.on('.soc a[aria-label$="Instagram"]', social(footer.instagram));
  }

  if (photos && Object.keys(photos).length) {
    rw.on('img[data-slot]', { element(el) {
      const url = photos[el.getAttribute('data-slot')];
      if (url) el.setAttribute('src', url);
    } });
    if (photos.logo) {
      // browser tab icon, phone home-screen icon and the preload hint
      rw.on('link[href="logo.png"]', { element(el) {
        el.setAttribute('href', photos.logo);
        if (el.getAttribute('type') === 'image/png') el.removeAttribute('type');
      } });
    }
  }

  const out = rw.transform(response);
  const headers = new Headers(out.headers);
  headers.delete('ETag');                     // the page no longer matches the stored file
  headers.set('Cache-Control', 'no-cache');
  return new Response(out.body, { status: out.status, headers });
}
