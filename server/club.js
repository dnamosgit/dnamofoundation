// The Dnamo Football Club site (template 'club'): what its pages say when nothing
// has been changed in the admin center, and the rules for what may be saved.
// The pages themselves are written by tools/build-club.mjs from these defaults.
import { CLUB_DEFAULTS, CLUB_PAGES, keyOf } from './club-content.js';
import { cleanPage, pageMain } from './club-pages.js';
import { SHARED_CLEAN, photosCleaner } from './defaults.js';
import { href, list, obj, paragraphs, text, video } from './valid.js';

const kids = (group) => CLUB_PAGES.filter((p) => p.group === group && !p.index && !p.menu)
  .map((p) => ({ label: p.label, href: p.slug + '.html' }));

const HOME = {
  kicker: '2026 Season · San Francisco',
  headline: 'Dnamo Football Club',
  intro: "We believe that soccer is more than just a game. It's a way of life.",
  video: '',
  button1: { label: 'Explore programs', href: 'programs.html' },
  button2: { label: 'Camps', href: 'camps.html' },
  ticker: CLUB_PAGES.filter((p) => p.group === 'programs' && !p.index).map((p) => p.label),
  levelsEyebrow: 'Our club levels',
  levelsTitle: 'Choose your path',
  levelsIntro: ["Dnamo FC is committed to nurturing every player's individual growth while teaching the value of teamwork, accountability, and resilience. We provide an age-appropriate curriculum emphasizing technical skills and the joy of play, fostering a lifelong passion for soccer in every child."],
  levels: [
    { title: 'Microsoccer', text: 'Fun, imaginative environments and a specialized curriculum that promote a love of soccer while developing social, emotional, physical and technical skills.', href: 'microsoccer.html' },
    { title: 'Recreational', text: 'A simple, non-competitive, community-based program that safely introduces new players to soccer and builds confidence and technical skills.', href: 'recreational.html' },
    { title: 'Competitive', text: 'High-level coaching, preparation and competition through a curriculum that builds soccer IQ, technical skills and mental conditioning.', href: 'competitive.html' },
    { title: 'Travel', text: 'For highly motivated players seeking advanced education and skill development, with competitive challenges, travel and exposure to scouts.', href: 'travel.html' },
  ],
  joinTitle: 'Ready to join Dnamo FC?',
  joinText: 'We are always looking to connect with passionate players, families and coaches committed to development and a positive environment.',
  joinButton: { label: 'Contact us', href: 'contact.html' },
};

const pageDefaults = {};
for (const p of CLUB_PAGES) pageDefaults[keyOf(p.slug)] = CLUB_DEFAULTS[p.slug];

const DEFAULTS = {
  identity: { nameA: 'Dnamo', nameB: 'Football Club' },
  header: {
    items: [
      { label: 'Home', href: './', children: [] },
      { label: 'Tryouts', href: 'tryouts.html', children: [] },
      { label: 'About Us', href: 'about.html', children: [
        { label: 'Who We Are', href: 'about.html' },
        { label: 'Meet Our Team', href: 'about.html#team' },
        { label: 'Gallery', href: 'about.html#gallery' },
        ...kids('about'),
      ] },
      { label: 'Programs', href: 'programs.html', children: kids('programs') },
      { label: 'Camps', href: 'camps.html', children: kids('camps') },
      { label: 'Dnamo Academy', href: 'https://www.dnamoacademy.org/', children: [] },
      { label: 'Team Store', href: 'https://www.soccer.com/club/2001959548', children: [] },
    ],
    button: { label: 'Contact us', href: 'contact.html' },
  },
  footer: {
    links: [
      { label: 'Home', href: './' },
      { label: 'About us', href: 'about.html' },
      { label: 'Programs', href: 'programs.html' },
      { label: 'Camps', href: 'camps.html' },
      { label: 'Tryouts', href: 'tryouts.html' },
      { label: 'Dnamo Academy', href: 'https://www.dnamoacademy.org/' },
      { label: 'Team Store', href: 'https://www.soccer.com/club/2001959548' },
      { label: 'Contact us', href: 'contact.html' },
      { label: 'Terms & Conditions', href: 'https://www.dnamofc.com/terms-and-conditions' },
      { label: 'Privacy Policy', href: 'https://www.dnamofc.com/privacy-policy' },
    ],
    legal: '',
    copyright: '© 2026 Dnamo Football Club',
    linkedin: 'https://www.linkedin.com/company/dnamo-fc/',
    instagram: 'https://www.instagram.com/dnamofc',
  },
  photos: {},
  home: HOME,
  ...pageDefaults,
};

const SLOTS = [
  { id: 'logo', group: 'Logo', label: 'Logo and browser tab icon', src: 'fc/logo.jpg', max: 512 },
  { id: 'hero1', group: 'Home slideshow', label: 'Slide 1', src: 'hero-1.jpg', max: 2000 },
  { id: 'hero2', group: 'Home slideshow', label: 'Slide 2', src: 'hero-2.jpg', max: 2000 },
  { id: 'hero3', group: 'Home slideshow', label: 'Slide 3', src: 'hero-3.jpg', max: 2000 },
  { id: 'hero4', group: 'Home slideshow', label: 'Slide 4', src: 'hero-4.jpg', max: 2000 },
];

const button = (v, what) => {
  const o = obj(v);
  const label = text(o.label, 40, `${what} label`, false);
  return { label, href: label ? href(o.href, what) : '' };
};

const CLEAN = {
  ...SHARED_CLEAN,
  photos: photosCleaner(SLOTS),
  home(v) {
    return {
      kicker: text(v.kicker, 80, 'The small line above the headline', false),
      headline: text(v.headline, 80, 'The headline'),
      intro: text(v.intro, 300, 'The text under the headline', false),
      video: video(v.video),
      button1: button(v.button1, 'The first button'),
      button2: button(v.button2, 'The second button'),
      ticker: list(v.ticker, 12, 'Scrolling words').map((w) => text(w, 40, 'A scrolling word', false)).filter(Boolean),
      levelsEyebrow: text(v.levelsEyebrow, 60, 'The club levels label', false),
      levelsTitle: text(v.levelsTitle, 80, 'The club levels heading'),
      levelsIntro: paragraphs(v.levelsIntro, 4, 800, 'the club levels text'),
      levels: list(v.levels, 8, 'Club levels').map((l) => {
        const o = obj(l);
        const title = text(o.title, 60, 'A level title');
        return { title, text: text(o.text, 400, `The text for "${title}"`, false), href: href(o.href, `"${title}"`) };
      }),
      joinTitle: text(v.joinTitle, 80, 'The closing heading'),
      joinText: text(v.joinText, 400, 'The closing text', false),
      joinButton: button(v.joinButton, 'The closing button'),
    };
  },
};
for (const p of CLUB_PAGES) CLEAN[keyOf(p.slug)] = cleanPage;

export const CLUB = {
  name: 'club',
  title: 'Dnamo Football Club',       // as written in each page's <title>
  path: '/fc/',                        // where the site is reached until it has its own address
  dark: true,                          // dark is this site's own look; light is the visitor's choice
  logo: '/fc/logo.jpg',
  DEFAULTS,
  SLOTS,
  PAGES: ['./', ...CLUB_PAGES.map((p) => p.slug + '.html'), 'about.html#team', 'about.html#gallery'],
  POPUP_PAGES: [{ file: 'index.html', label: 'Home' }, ...CLUB_PAGES.map((p) => ({ file: p.slug + '.html', label: p.label }))],
  // What the admin needs to list the pages: slug, content key, name and group
  PAGE_LIST: CLUB_PAGES.map((p) => ({ slug: p.slug, key: keyOf(p.slug), label: p.index ? p.label + ' overview' : p.label, group: p.group || '' })),
  KEYS: Object.keys(CLEAN),
  CLEAN,
  // An inner page is drawn afresh once anything that shows on it has been saved:
  // the page itself, a page it lists, or the closing invitation from the home page.
  // Returns { html, title } or null when the stored file can be served as it is.
  main(file, saved) {
    const meta = CLUB_PAGES.find((p) => p.slug + '.html' === file);
    if (!meta) return null;
    if (!saved.home && !CLUB_PAGES.some((p) => saved[keyOf(p.slug)])) return null;
    const mine = saved[keyOf(meta.slug)];
    return { html: pageMain(meta.slug, { ...DEFAULTS, ...saved }), title: mine ? mine.title : null, was: DEFAULTS[keyOf(meta.slug)].title };
  },
};
