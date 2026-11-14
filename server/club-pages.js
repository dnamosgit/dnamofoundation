// Dnamo Football Club inner pages: the markup of a page, and the rules for what
// may be saved. The same markup function writes the files in /public/fc
// (tools/build-club.mjs) and redraws a page once it has been edited in the admin.
import { CLUB_PAGES, keyOf } from './club-content.js';
import { href, image, list, multiline, obj, paragraphs, text } from './valid.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const attr = (s) => esc(s).replace(/\n/g, '&#10;');
// Text where **double stars** mark bold
const rich = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

const CLOSE = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

function buttons(items) {
  if (!items.length) return '';
  return '<div class="row-wrap g12 club-btns">' + items.map((b, i) => {
    const out = /^https?:/i.test(b.href) ? ' target="_blank" rel="noopener"' : '';
    return `<a class="btn${i ? ' s' : ''}" href="${esc(b.href)}"${out}>${esc(b.label)}</a>`;
  }).join('') + '</div>';
}

const rows = (items) => !items.length ? '' : '<div class="rows">' + items.map((r) =>
  `<div class="rw"><span class="rw-l">${esc(r.label)}${r.note ? `<small>${esc(r.note)}</small>` : ''}</span>${r.value ? `<strong class="rw-v">${esc(r.value)}</strong>` : ''}</div>`).join('') + '</div>';

// The inner HTML of <main> for one page. all holds every page's content plus the home page's.
export function pageMain(slug, all) {
  const meta = CLUB_PAGES.find((p) => p.slug === slug);
  const p = all[keyOf(slug)];
  const group = meta.group ? CLUB_PAGES.filter((x) => x.group === meta.group) : [];
  let out = '';

  // Links to the sister pages (all programs, all camps, the About pages)
  if (group.length) {
    const name = group[0].menu || group[0].label;
    out += `<section class="w pad-sub">\n  <p class="eyebrow">${esc(name)}</p>\n  <nav class="row-wrap g12" aria-label="${esc(name)}">`;
    for (const g of group) {
      const on = g.slug === slug ? ' on" aria-current="page' : '';
      out += `<a class="sub${on}" href="${g.slug}.html">${esc(g.index ? 'Overview' : g.label)}</a>`;
    }
    out += '</nav>\n</section>\n';
  }

  out += `<section class="w ${p.photo ? 'split2 ' : ''}${group.length ? 'pad-after-sub' : 'pad'} club-top">\n  <div>`;
  if (p.eyebrow && !group.length) out += `<p class="eyebrow">${esc(p.eyebrow)}</p>`;
  out += `<h1 class="h init-title">${esc(p.title)}</h1>`;
  if (p.lead) out += `<p class="init-lead">${esc(p.lead)}</p>`;
  if (p.facts.length) out += '<dl class="facts">' + p.facts.map((f) => `<div><dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`).join('') + '</dl>';
  if (p.body.length) out += '<div class="prose">' + p.body.map((x) => `<p>${rich(x)}</p>`).join('') + '</div>';
  out += buttons(p.buttons) + '</div>';
  if (p.photo) out += `\n  <img class="shot" src="${esc(p.photo)}" alt="" width="2000" height="1125" loading="lazy">`;
  out += '\n</section>\n';

  // Sections take turns between the dark band and the plain page
  let dark = true;
  const band = (inner, id) => {
    const tag = id ? ` id="${id}"` : '';
    const html = dark ? `<section class="dark"${tag}><div class="w pad-l club-sec">${inner}</div></section>\n` : `<section class="w pad-l club-sec"${tag}>${inner}</section>\n`;
    dark = !dark;
    return html;
  };

  // An overview page lists its pages as cards
  if (meta.index) {
    const kids = group.filter((g) => !g.index);
    out += band('<div class="grid">' + kids.map((g, i) => {
      const k = all[keyOf(g.slug)];
      return `<a class="card d" href="${g.slug}.html"><span class="num">${String(i + 1).padStart(2, '0')}</span><h3 class="h">${esc(k.title)}</h3><p>${esc(k.lead)}</p><span class="more">Learn more <span class="arr" aria-hidden="true">&rarr;</span></span></a>`;
    }).join('') + '</div>');
  }

  for (const s of p.sections) {
    let inner = s.title ? `<h2 class="h">${esc(s.title)}</h2>` : '';
    if (s.text.length) inner += '<div class="prose">' + s.text.map((x) => `<p>${rich(x)}</p>`).join('') + '</div>';
    if (s.points.length) inner += '<ul class="goals">' + s.points.map((x) => `<li>${rich(x)}</li>`).join('') + '</ul>';
    inner += rows(s.rows) + buttons(s.buttons);
    out += band(inner);
  }

  if (p.people.length) {
    let inner = p.peopleTitle ? `<h2 class="h">${esc(p.peopleTitle)}</h2>` : '';
    if (p.peopleIntro) inner += `<p class="lead">${esc(p.peopleIntro)}</p>`;
    inner += '<div class="grid people">' + p.people.map((m) =>
      `<button class="dir" type="button" aria-expanded="false" aria-controls="profile" data-name="${attr(m.name)}" data-role="${attr(m.role)}" data-bio="${attr(m.bio)}"><img src="${esc(m.photo || '/person.svg')}" alt="" width="120" height="120" loading="lazy"><span class="h">${esc(m.name)}</span><span class="red">${esc(m.role)}</span></button>`).join('') + '</div>';
    inner += `<div class="profile" id="profile" hidden aria-live="polite"><button class="pclose" type="button" aria-label="Close profile" title="Close">${CLOSE}</button><h2 class="h pname"></h2><p class="prole"></p><p class="pbio"></p></div>`;
    out += band(inner, 'team');
  }

  if (p.gallery.length) {
    let inner = p.galleryTitle ? `<h2 class="h">${esc(p.galleryTitle)}</h2>` : '';
    if (p.galleryIntro) inner += `<p class="lead">${esc(p.galleryIntro)}</p>`;
    inner += '<div class="gallery">' + p.gallery.map((u) => `<img src="${esc(u)}" alt="" loading="lazy">`).join('') + '</div>';
    out += band(inner, 'gallery');
  }

  // The closing invitation is the home page's, shown on every page
  const h = all.home;
  out += `<section class="band${dark ? ' dk' : ''}">\n  <div class="w">\n    <h2 class="h" data-t="home.joinTitle">${esc(h.joinTitle)}</h2>\n    <p data-t="home.joinText">${esc(h.joinText)}</p>\n`;
  if (h.joinButton.label) out += `    <a class="btn" data-link="home.joinButton" href="${esc(h.joinButton.href)}">${esc(h.joinButton.label)}</a>\n`;
  out += '  </div>\n</section>\n';
  return out;
}

// --- What may be saved ------------------------------------------------------

function buttonList(v, what) {
  return list(v || [], 3, `${what} buttons`).map((b) => {
    const o = obj(b);
    const label = text(o.label, 40, 'A button label');
    return { label, href: href(o.href, `"${label}"`) };
  });
}

export function cleanPage(v) {
  const title = text(v.title, 80, 'The page title');
  return {
    eyebrow: text(v.eyebrow, 60, 'The small label', false),
    title,
    lead: text(v.lead, 200, 'The line under the title', false),
    photo: image(v.photo, 'The page photo'),
    facts: list(v.facts || [], 4, 'Quick facts').map((f) => {
      const o = obj(f);
      return { label: text(o.label, 30, 'A quick fact label'), value: text(o.value, 60, 'A quick fact') };
    }),
    body: paragraphs(v.body || [], 8, 1500, 'the introduction'),
    buttons: buttonList(v.buttons, 'Page'),
    sections: list(v.sections || [], 12, 'Sections').map((s) => {
      const o = obj(s);
      const name = text(o.title, 80, 'A section title', false);
      return {
        title: name,
        text: paragraphs(o.text || [], 8, 1500, `"${name || 'a section'}"`),
        points: list(o.points || [], 16, 'Bullet points').map((x) => text(x, 400, 'A bullet point', false)).filter(Boolean),
        rows: list(o.rows || [], 30, 'Table rows').map((r) => {
          const q = obj(r);
          return { label: text(q.label, 80, 'A table row name'), value: text(q.value, 60, 'A table figure', false), note: text(q.note, 300, 'A table note', false) };
        }),
        buttons: buttonList(o.buttons, 'Section'),
      };
    }),
    peopleTitle: text(v.peopleTitle, 80, 'The team heading', false),
    peopleIntro: text(v.peopleIntro, 600, 'The team introduction', false),
    people: list(v.people || [], 40, 'Team members').map((m) => {
      const o = obj(m);
      const name = text(o.name, 80, 'A name');
      return { name, role: text(o.role, 120, `The role of ${name}`, false), photo: image(o.photo, `The photo of ${name}`), bio: multiline(o.bio, 2500, `The profile of ${name}`, false) };
    }),
    galleryTitle: text(v.galleryTitle, 80, 'The gallery heading', false),
    galleryIntro: text(v.galleryIntro, 300, 'The gallery introduction', false),
    gallery: list(v.gallery || [], 30, 'Gallery photos').map((u) => image(u, 'A gallery photo')).filter(Boolean),
  };
}
