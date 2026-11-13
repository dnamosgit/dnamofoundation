// The Dnamo Football Club site (template 'club'): what its page says when nothing
// has been changed in the admin center, and the rules for what may be saved.
// These defaults mirror public/fc/index.html.
import { SHARED_CLEAN, photosCleaner } from './defaults.js';
import { href, link, list, obj, paragraphs, text, video } from './valid.js';

const FC = 'https://www.dnamofc.com';
const PROGRAMS = ['Juniors', 'Microsoccer', 'Recreational', 'Competitive', 'Travel', 'Goalkeeper Academy', 'IDP', 'Referee'];
const CAMPS = ['Summer Camp', 'Future Soccer Star', 'Microsoccer Shootout', 'Thanksgiving Camp', 'Winter Camp', 'Spring Camp'];

const DEFAULTS = {
  identity: { nameA: 'Dnamo', nameB: 'Football Club' },
  header: {
    items: [
      { label: 'Home', href: './', children: [] },
      { label: 'Tryouts', href: FC + '/tryouts', children: [] },
      { label: 'About Us', href: FC + '/about', children: [
        { label: 'Who We Are', href: FC + '/about' },
        { label: 'Meet Our Team', href: FC + '/about' },
        { label: 'Gallery', href: FC + '/about' },
        { label: 'Age Groups', href: FC + '/agegroups' },
        { label: 'Fees & Financials', href: FC + '/fees' },
        { label: 'Resources', href: FC + '/resources' },
      ] },
      { label: 'Programs', href: FC + '/programs', children: PROGRAMS.map((label) => ({ label, href: FC + '/programs' })) },
      { label: 'Camps', href: FC + '/camps', children: CAMPS.map((label) => ({ label, href: FC + '/camps' })) },
      { label: 'Dnamo Academy', href: 'https://www.dnamoacademy.org/', children: [] },
      { label: 'Team Store', href: 'https://www.soccer.com/club/2001959548', children: [] },
    ],
    button: { label: 'Contact us', href: FC + '/contact' },
  },
  footer: {
    links: [
      { label: 'Home', href: './' },
      { label: 'About us', href: FC + '/about' },
      { label: 'Programs', href: FC + '/programs' },
      { label: 'Camps', href: FC + '/camps' },
      { label: 'Dnamo Academy', href: 'https://www.dnamoacademy.org/' },
      { label: 'Team Store', href: 'https://www.soccer.com/club/2001959548' },
      { label: 'Contact us', href: FC + '/contact' },
      { label: 'Terms & Conditions', href: FC + '/terms-and-conditions' },
      { label: 'Privacy Policy', href: FC + '/privacy-policy' },
    ],
    legal: '',
    copyright: '© 2026 Dnamo Football Club',
    linkedin: 'https://www.linkedin.com/company/dnamo-fc/',
    instagram: 'https://www.instagram.com/dnamofc',
  },
  photos: {},
  home: {
    kicker: '2026 Season · San Francisco',
    headline: 'Dnamo Football Club',
    intro: "We believe that soccer is more than just a game. It's a way of life.",
    video: '',
    button1: { label: 'Explore programs', href: FC + '/programs' },
    button2: { label: 'Camps', href: FC + '/camps' },
    ticker: PROGRAMS,
    eventShow: true,
    eventEyebrow: 'Upcoming event',
    eventTitle: 'Thanksgiving Camp',
    eventText: ['Our Thanksgiving Soccer Camp keeps players active and engaged during the holiday break with fun, high-energy drills and small-sided games. Led by professional coaches, players develop their technical skills and tactical understanding while staying sharp for the season ahead.'],
    eventButton: { label: 'Register now', href: 'https://dnamofc.byga.net/programs/hj15224m1v/signup' },
    levelsEyebrow: 'Our club levels',
    levelsTitle: 'Choose your path',
    levelsIntro: ["Dnamo FC is committed to nurturing every player's individual growth while teaching the value of teamwork, accountability, and resilience. We provide an age-appropriate curriculum emphasizing technical skills and the joy of play, fostering a lifelong passion for soccer in every child."],
    levels: [
      { title: 'Microsoccer', text: 'Fun, imaginative environments and a specialized curriculum that promote a love of soccer while developing social, emotional, physical and technical skills.', href: FC + '/programs' },
      { title: 'Recreational', text: 'A simple, non-competitive, community-based program that safely introduces new players to soccer and builds confidence and technical skills.', href: FC + '/programs' },
      { title: 'Competitive', text: 'High-level coaching, preparation and competition through a curriculum that builds soccer IQ, technical skills and mental conditioning.', href: FC + '/programs' },
      { title: 'Travel', text: 'For highly motivated players seeking advanced education and skill development, with competitive challenges, travel and exposure to scouts.', href: FC + '/programs' },
    ],
    joinTitle: 'Ready to join Dnamo FC?',
    joinText: 'We are always looking to connect with passionate players, families and coaches committed to development and a positive environment.',
    joinButton: { label: 'Contact us', href: FC + '/contact' },
  },
};

const SLOTS = [
  { id: 'logo', group: 'Logo', label: 'Logo and browser tab icon', src: 'logo.png', max: 512 },
  { id: 'hero1', group: 'Home slideshow', label: 'Slide 1', src: 'hero-1.jpg', max: 2000 },
  { id: 'hero2', group: 'Home slideshow', label: 'Slide 2', src: 'hero-2.jpg', max: 2000 },
  { id: 'hero3', group: 'Home slideshow', label: 'Slide 3', src: 'hero-3.jpg', max: 2000 },
  { id: 'hero4', group: 'Home slideshow', label: 'Slide 4', src: 'hero-4.jpg', max: 2000 },
  { id: 'event', group: 'Home page', label: 'Upcoming event photo', src: 'hero-2.jpg', max: 1600 },
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
      eventShow: v.eventShow !== false,
      eventEyebrow: text(v.eventEyebrow, 60, 'The event label', false),
      eventTitle: text(v.eventTitle, 80, 'The event title'),
      eventText: paragraphs(v.eventText, 6, 800, 'the event text'),
      eventButton: button(v.eventButton, 'The event button'),
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

export const CLUB = {
  name: 'club',
  title: 'Dnamo Football Club',       // as written in the page's <title>
  path: '/fc/',                        // where the site is reached until it has its own address
  onePage: true,
  DEFAULTS,
  SLOTS,
  PAGES: ['./'],
  KEYS: Object.keys(CLEAN),
  CLEAN,
};
