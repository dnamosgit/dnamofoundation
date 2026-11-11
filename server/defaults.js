// What the site shows when nothing has been changed in the admin center, and the
// rules for what may be saved. These defaults mirror tools/build.ps1.

export const DEFAULTS = {
  identity: { nameA: 'Dnamo', nameB: 'Football Foundation' },
  header: {
    items: [
      { label: 'Home', href: 'index.html', children: [] },
      { label: 'Board of Directors', href: 'board.html', children: [] },
      { label: 'Our Initiatives', href: 'initiatives.html', children: [
        { label: 'Scholarships', href: 'scholarships.html' },
        { label: 'Coach Recruitment & Support', href: 'coaches.html' },
        { label: 'Club House & Field', href: 'clubhouse.html' },
        { label: 'Kit Sponsorship', href: 'initiatives.html#kit' },
      ] },
      { label: 'Testimonials', href: 'testimonials.html', children: [] },
      { label: 'Contact Us', href: 'contact.html', children: [] },
    ],
    button: { label: 'Donate', href: 'donate.html' },
  },
  footer: {
    links: [
      { label: 'Home', href: 'index.html' },
      { label: 'Board of Directors', href: 'board.html' },
      { label: 'Our Initiatives', href: 'initiatives.html' },
      { label: 'Testimonials', href: 'testimonials.html' },
      { label: 'Contact Us', href: 'contact.html' },
      { label: 'Donate', href: 'donate.html' },
    ],
    legal: 'The Dnamo Football Academy Foundation has a nonprofit tax exempt status with the IRS (EIN 39-2786889).',
    copyright: '© Dnamo Football Foundation',
    linkedin: 'https://www.linkedin.com/company/dnamoacademy',
    instagram: 'https://www.instagram.com/dnamoacademy/',
  },
  photos: {},
};

// Pages offered as suggestions when typing a link in the admin.
export const PAGES = [
  'index.html', 'board.html', 'initiatives.html', 'scholarships.html', 'coaches.html',
  'clubhouse.html', 'initiatives.html#kit', 'testimonials.html', 'contact.html', 'donate.html',
];

// Replaceable images. id matches the data-slot attribute in the pages; src is the original file.
export const SLOTS = [
  { id: 'logo', group: 'Logo', label: 'Logo and browser tab icon', src: 'logo.png', max: 512 },
  { id: 'hero1', group: 'Home slideshow', label: 'Slide 1', src: 'hero-1.jpg', max: 2000 },
  { id: 'hero2', group: 'Home slideshow', label: 'Slide 2', src: 'hero-2.jpg', max: 2000 },
  { id: 'hero3', group: 'Home slideshow', label: 'Slide 3', src: 'hero-3.jpg', max: 2000 },
  { id: 'hero4', group: 'Home slideshow', label: 'Slide 4', src: 'hero-4.jpg', max: 2000 },
  { id: 'init-schol', group: 'Initiative pages', label: 'Scholarships', src: 'hero-3.jpg', max: 2000 },
  { id: 'init-coach', group: 'Initiative pages', label: 'Coach Recruitment & Support', src: 'hero-2.jpg', max: 2000 },
  { id: 'init-club', group: 'Initiative pages', label: 'Club House & Field', src: 'hero-4.jpg', max: 2000 },
  { id: 'board-elizabeth-estrada', group: 'Board of Directors', label: 'Elizabeth Estrada', src: 'board-elizabeth-estrada.jpg', max: 600 },
  { id: 'board-ika-kvavilashvili', group: 'Board of Directors', label: 'Ika Kvavilashvili', src: 'board-ika-kvavilashvili.jpg', max: 600 },
  { id: 'board-paulo-romero', group: 'Board of Directors', label: 'Paulo Romero', src: 'board-paulo-romero.jpg', max: 600 },
];

// --- Validation -----------------------------------------------------------
// Each cleaner returns a tidy copy of what was sent, or throws an Error whose
// message is shown to the admin.

function text(v, max, what, required = true) {
  const s = String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
  if (required && !s) throw new Error(`${what} cannot be empty.`);
  if (s.length > max) throw new Error(`${what} is too long (max ${max} characters).`);
  return s;
}

// Links may point to a page on the site, a full web address, an email or a phone number.
function href(v, what, required = true) {
  const s = String(v == null ? '' : v).trim();
  if (!s) {
    if (required) throw new Error(`${what} needs a link.`);
    return '';
  }
  if (s.length > 500) throw new Error(`${what}: that link is too long.`);
  const ok = /^https?:\/\/[^\s<>"']+$/i.test(s) || /^mailto:[^\s<>"']+$/i.test(s) || /^tel:[+\d\s().-]+$/i.test(s)
    || /^\/?[A-Za-z0-9][A-Za-z0-9._\/-]*(\?[^\s<>"'#]*)?(#[A-Za-z0-9_-]*)?$/.test(s) || /^#[A-Za-z0-9_-]*$/.test(s) || s === '/';
  if (!ok) throw new Error(`${what}: "${s}" is not a link we can use. Use a page like board.html or a full https:// address.`);
  return s;
}

function link(v, what) {
  const o = v && typeof v === 'object' ? v : {};
  const label = text(o.label, 60, `${what} label`);
  return { label, href: href(o.href, `"${label}"`) };
}

function list(v, max, what) {
  if (!Array.isArray(v)) throw new Error(`${what} is missing.`);
  if (v.length > max) throw new Error(`${what}: no more than ${max}.`);
  return v;
}

const CLEAN = {
  identity(v) {
    return { nameA: text(v.nameA, 40, 'The first part of the name'), nameB: text(v.nameB, 60, 'The second part of the name', false) };
  },
  header(v) {
    const items = list(v.items, 8, 'Menu links').map((it) => {
      const base = link(it, 'Menu link');
      base.children = list(it.children || [], 10, `Dropdown under "${base.label}"`).map((c) => link(c, 'Dropdown link'));
      return base;
    });
    if (!items.length) throw new Error('The menu needs at least one link.');
    const b = v.button && typeof v.button === 'object' ? v.button : {};
    const label = text(b.label, 30, 'The button label', false);
    return { items, button: { label, href: label ? href(b.href, 'The button') : '' } };
  },
  footer(v) {
    return {
      links: list(v.links, 10, 'Footer links').map((l) => link(l, 'Footer link')),
      legal: text(v.legal, 400, 'The legal line', false),
      copyright: text(v.copyright, 120, 'The copyright line', false),
      linkedin: socialUrl(v.linkedin, 'LinkedIn'),
      instagram: socialUrl(v.instagram, 'Instagram'),
    };
  },
  photos(v) {
    const out = {};
    for (const slot of SLOTS) {
      const val = v[slot.id];
      if (val == null || val === '') continue;
      if (!/^\/media\/[0-9a-f]{24}$/.test(val)) throw new Error('That photo is not one uploaded here.');
      out[slot.id] = val;
    }
    return out;
  },
};

function socialUrl(v, what) {
  const s = String(v == null ? '' : v).trim();
  if (!s) return '';
  if (!/^https:\/\/[^\s<>"']+$/i.test(s) || s.length > 300) throw new Error(`${what}: use the full address starting with https://`);
  return s;
}

export const KEYS = Object.keys(CLEAN);

export function clean(key, value) {
  if (!CLEAN[key]) throw new Error('Unknown setting.');
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid value.');
  return CLEAN[key](value);
}
