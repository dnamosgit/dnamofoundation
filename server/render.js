// Applies saved admin content to a public page on its way to the visitor.
// The pages in /public hold the original content; only sections that have been
// saved in the admin are rewritten, so an untouched site is served as-is.

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const attr = (s) => esc(s).replace(/\n/g, '&#10;');
// Text where **double stars** mark bold
const rich = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
const money = (n) => '$' + Number(n).toLocaleString('en-US');
const get = (o, path) => path.split('.').reduce((v, k) => (v == null ? undefined : v[k]), o);

const CARET = '<svg class="caret" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 4.5L6 8l3.5-3.5"/></svg>';

// "/board" and "/board.html" are both board.html; "/" is index.html
export function pageFile(pathname) {
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

// --- Lists and blocks rebuilt from saved content ---------------------------
// Each returns the inner HTML for the element tagged data-list="<name>", or
// undefined when that content has not been saved (the original markup stays).

const statCards = (items, cls) => items.map((c) =>
  `<div class="card ${cls}"><span class="price">${esc(c.amount)}</span><h3 class="h">${esc(c.label)}</h3><p>${esc(c.note)}</p></div>`).join('');

function chip(fund, opt, amt, label) {
  let q = 'fund=' + fund + '&amp;opt=' + opt;
  if (amt) q += '&amp;amt=' + amt;
  return `<a class="sub" href="donate.html?${q}">${esc(label)}</a>`;
}

// Giving cards on an initiative page. One amount shows as a price; several show as buttons.
function tiers(gifts, fund) {
  return gifts.map((g) => {
    const single = g.amounts.length === 1;
    let chips = single ? chip(fund, g.id, '', 'Give ' + money(g.amounts[0]))
      : g.amounts.map((a) => chip(fund, g.id, a, money(a))).join('');
    if (fund === 'coach') chips += chip(fund, g.id, 'other', 'Other');
    return `<div class="card d static tier"><span class="price">${esc(single ? money(g.amounts[0]) : g.tag)}</span><h3 class="h">${esc(g.title)}</h3><p>${esc(g.desc)}</p><div class="row-wrap">${chips}</div></div>`;
  }).join('');
}

const LISTS = {
  'home.values': (c) => c.home && c.home.values.map((v) => `<span>${esc(v)}</span>`).join('').repeat(2),
  'board.members': (c) => c.board && c.board.members.map((m) =>
    `<button class="dir" type="button" aria-expanded="false" aria-controls="profile" data-name="${attr(m.name)}" data-role="${attr(m.role)}" data-bio="${attr(m.bio)}"><img src="${esc(m.photo || 'person.svg')}" alt="" width="120" height="120" loading="lazy"><span class="h">${esc(m.name)}</span><span class="red">${esc(m.role)}</span></button>`).join(''),
  'testimonials.items': (c) => c.testimonials && c.testimonials.items.map((t) =>
    `<figure class="card static" style="margin:0"><blockquote style="margin:0"><p class="quote">${esc(t.quote).replace(/\n+/g, '<br>')}</p></blockquote><figcaption><div class="h who">${esc(t.name)}</div><div class="red">${esc(t.role)}</div></figcaption></figure>`).join(''),
  'inits.kit': (c) => c.inits && statCards(c.inits.kit, 'd static'),
  'inits.contrib': (c) => c.inits && statCards(c.inits.contrib, 'static'),
  'inits.club.goals': (c) => c.inits && c.inits.club.goals.map((g) => `<li>${rich(g)}</li>`).join(''),
  'inits.club.thermo': (c) => {
    if (!c.inits) return undefined;
    const { raised, goal } = c.inits.club;
    const pct = goal > 0 ? Math.min(100, Math.round((100 * raised) / goal)) : 0;
    const shown = goal > 0 ? [money(raised), money(goal)] : ['[AMOUNT RAISED]', '[GOAL]'];
    return `<div class="fund"><div class="fund-top"><span class="fund-pct">${pct}%</span><span><strong>${shown[0]}</strong> raised</span><span class="fund-goal">Goal: <strong>${shown[1]}</strong></span></div>`
      + `<div class="fund-bar" role="progressbar" aria-label="Club House and Field fund" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><span style="width:${pct}%"></span></div></div>`;
  },
  'tiers.schol': (c) => c.giving && tiers(c.giving.schol, 'schol'),
  'tiers.coach': (c) => c.giving && tiers(c.giving.coach, 'coach'),
};

// The home page's background video. A YouTube or Vimeo link becomes a muted, looping
// player; anything else is treated as a video file. The first slide stays underneath
// as the picture shown while the video loads.
function videoHtml(url, poster) {
  const still = `<img src="${esc(poster)}" alt="" style="animation:none;opacity:1">`;
  const frame = (src) => `${still}<iframe src="${src}" title="Background video" allow="autoplay; encrypted-media; picture-in-picture" tabindex="-1" aria-hidden="true"></iframe>`;
  let m = url.match(/^https:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i);
  if (m) return frame(`https://www.youtube-nocookie.com/embed/${m[1]}?autoplay=1&amp;mute=1&amp;loop=1&amp;playlist=${m[1]}&amp;controls=0&amp;playsinline=1&amp;rel=0&amp;disablekb=1`);
  m = url.match(/^https:\/\/(?:www\.|player\.)?vimeo\.com\/(?:video\/)?(\d+)/i);
  if (m) return frame(`https://player.vimeo.com/video/${m[1]}?background=1&amp;autoplay=1&amp;muted=1&amp;loop=1`);
  return `<video src="${esc(url)}" poster="${esc(poster)}" autoplay muted loop playsinline preload="metadata"></video>`;
}

// An initiative page takes its browser-tab title from the saved title of that initiative
const INIT_PAGES = { 'scholarships.html': ['schol', 'Scholarships'], 'coaches.html': ['coach', 'Coach Recruitment &amp; Support'], 'clubhouse.html': ['club', 'Club House &amp; Field'] };

export function render(response, saved, pathname, popups = []) {
  const { identity, header, footer, photos, inits, giving } = saved;
  if (!Object.keys(saved).length && !popups.length) return response;

  const rw = new HTMLRewriter();
  const page = pageFile(pathname);

  const initPage = inits && INIT_PAGES[page];
  if (identity) {
    rw.on('a.nav.brand', { element(el) {
      el.setInnerContent(esc(identity.nameA) + (identity.nameB ? ` <span>${esc(identity.nameB)}</span>` : ''), { html: true });
    } });
  }
  if (identity || initPage) {
    // The browser tab title: swap in the saved site name and initiative title.
    // The text arrives as it is written in the file (already escaped), so it is put back as HTML.
    const full = identity ? (identity.nameA + ' ' + identity.nameB).trim() : null;
    let buffer = '';
    rw.on('title', { text(t) {
      buffer += t.text;
      if (!t.lastInTextNode) { t.remove(); return; }
      let title = buffer;
      if (initPage) title = title.split(initPage[1]).join(esc(inits[initPage[0]].title));
      if (full) title = title.split('Dnamo Football Foundation').join(esc(full));
      t.replace(title, { html: true });
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

  if (saved.home && saved.home.video) {
    const poster = (photos && photos.hero1) || 'hero-1.jpg';
    rw.on('.heromedia', { element(el) { el.setInnerContent(videoHtml(saved.home.video, poster), { html: true }); } });
  } else if (photos && photos.extra && photos.extra.length) {
    // Photos added to the slideshow follow the built-in slides
    rw.on('.heromedia', { element(el) {
      el.append(photos.extra.map((u) => `<img data-extra src="${esc(u)}" alt="" loading="lazy">`).join(''), { html: true });
    } });
  }

  // Page content: single texts, paragraphs, buttons, and rebuilt lists
  rw.on('[data-t]', { element(el) {
    const v = get(saved, el.getAttribute('data-t'));
    if (typeof v === 'string') el.setInnerContent(v);
  } });
  rw.on('[data-p]', { element(el) {
    const v = get(saved, el.getAttribute('data-p'));
    if (Array.isArray(v)) el.setInnerContent(v.map((p) => `<p>${rich(p)}</p>`).join(''), { html: true });
  } });
  rw.on('[data-link]', { element(el) {
    const v = get(saved, el.getAttribute('data-link'));
    if (v && v.label) { el.setAttribute('href', v.href); el.setInnerContent(v.label); }
  } });
  rw.on('[data-list]', { element(el) {
    const make = LISTS[el.getAttribute('data-list')];
    const html = make && make(saved);
    if (typeof html === 'string') el.setInnerContent(html, { html: true });
  } });

  // Donate page: amounts and gift names follow the saved giving options
  if (giving) {
    if (giving.payUrl) rw.on('#pay-link', { element(el) { el.setAttribute('href', giving.payUrl); } });
    const funds = { general: giving.general, club: giving.club };
    rw.on('[data-fund]', { element(el) {
      const f = funds[el.getAttribute('data-fund')];
      if (!f) return;
      el.setAttribute('data-amts', f.amounts.join(','));
      el.setAttribute('data-def', String(f.def));
    } });
    const gifts = {};
    for (const g of [...giving.schol, ...giving.coach]) gifts[g.id] = g;
    rw.on('[data-opt]', { element(el) {
      const g = gifts[el.getAttribute('data-opt')];
      if (!g) return;
      el.setAttribute('data-label', g.title);
      el.setAttribute('data-amts', g.amounts.join(','));
      el.setInnerContent(g.short);
    } });
  }

  // Pop-ups that are live for this page travel with it as data; popup.js shows one.
  if (popups.length) {
    const data = JSON.stringify(popups).replace(/</g, '\\u003c');
    rw.on('body', { element(el) {
      el.append(`<script type="application/json" id="dn-popups">${data}</script><script src="/popup.js" defer></script>
`, { html: true });
    } });
  }

  const out = rw.transform(response);
  const headers = new Headers(out.headers);
  headers.delete('ETag');                     // the page no longer matches the stored file
  headers.set('Cache-Control', 'no-cache');
  return new Response(out.body, { status: out.status, headers });
}
