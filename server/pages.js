// Page content: what each page says when nothing has been changed in the admin
// (mirrors tools/build.ps1), and the rules for what may be saved.
import { dollars, href, link, list, multiline, obj, paragraphs, text, video } from './valid.js';

const TESTIMONIAL = (n) => ({ quote: `[TESTIMONIAL ${n}: a sentence or two about the experience.]`, name: '[NAME]', role: '[PLAYER / PARENT / COACH / PARTNER]' });

export const PAGE_DEFAULTS = {
  home: {
    kicker: 'An offshoot of Dnamo Football Club',
    headline: 'Where talent meets possibility.',
    intro: 'Youth of all backgrounds deserve high-quality soccer training, development and facilities.',
    video: '',
    button1: { label: 'Support a player', href: 'donate.html' },
    button2: { label: 'Our initiatives', href: 'initiatives.html' },
    values: ['Teamwork', 'Perseverance', 'Sportsmanship', 'Technical mastery', 'Tactical awareness', 'Love for the game', 'Confidence', 'Leadership'],
    missionEyebrow: 'Our mission',
    missionTitle: 'Soccer excellence, on and off the pitch.',
    mission: [
      'Dnamo Football Academy Foundation, founded in 2025, is a nonprofit organization dedicated to providing youth of all backgrounds with access to high-quality soccer training, development, and facilities. We are an offshoot of Dnamo Football Club.',
      'Our mission is to deliver soccer excellence on and off the pitch by developing not only skilled athletes but also disciplined, respectful, and motivated individuals. Soccer excellence means fostering technical mastery, tactical awareness, and a genuine love for the game while promoting teamwork, perseverance, and sportsmanship.',
      'We are committed to breaking down financial and social barriers by offering affordable programs, scholarships, and community-based initiatives. Through creating access to quality training environments and fields, we give our players a safe and consistent environment where they can connect and grow as individuals.',
      'Beyond athletic training, we emphasize academic support and leadership development to help young athletes build confidence, pursue higher education, and make a lasting positive impact in their communities.',
    ],
    initsEyebrow: 'Our initiatives',
    initsTitle: 'Three ways we open the game',
  },
  board: {
    intro: 'Our Board of Directors is made up of caring community members who believe in the power of sports to bring kids together. They guide our mission with heart and commitment, ensuring every child has the opportunity to learn, grow, and thrive. Select a director to read their profile.',
    members: [
      { name: 'Elizabeth Estrada', role: 'Director', photo: 'board-elizabeth-estrada.jpg',
        bio: "Ellie's lifelong love for soccer opened doors that changed the course of her life. Her dedication and talent on the field earned her the opportunity to play at the collegiate level, where the sport not only fueled her passion but helped pay for her education. Grateful for the doors soccer opened, Ellie is committed to helping the next generation of players access the same opportunities. Leveraging her experiences as both a student-athlete and mentor, she works to ensure that programs at Dnamo Football Academy Foundation provide meaningful opportunities for growth. Her efforts support Dnamo's mission to empower young athletes, strengthen families, and give back to the community through soccer." },
      { name: 'Ika Kvavilashvili', role: 'Director', photo: 'board-ika-kvavilashvili.jpg',
        bio: 'Ika Kvavilashvili founded Dnamo FC to create opportunities for every child to experience the mentorship, discipline, and joy that shaped his own soccer journey. What began as a small local club has grown into a community built on passion, inclusivity, and the belief that soccer can change lives. With international playing and coaching experience across Georgia, the United States, and Europe, Ika brings a global perspective and a deep understanding of what it takes to develop both great players and great people. His vision extends far beyond the field. He sees soccer as a powerful tool to inspire confidence, build leadership, and unite diverse communities through shared purpose.\n\nThrough the Dnamo Football Academy Foundation, Ika continues his lifelong mission to break down barriers and open doors for young athletes. His commitment is to ensure that every child, regardless of background, has the opportunity to learn, grow, and find belonging through the beautiful game.' },
      { name: 'Paulo Romero', role: 'Director', photo: 'board-paulo-romero.jpg',
        bio: "Paulo's competitive soccer background as a player and coach instilled discipline, teamwork, and leadership that continue at Dnamo Football Academy. Leveraging leadership experience as a Chief Information Officer, he helps ensure programs run smoothly and resources are used effectively. His efforts support Dnamo's mission to empower young athletes and strengthen the community through soccer." },
    ],
    cta: 'Interested in serving or partnering with us?',
  },
  testimonials: {
    title: 'In their words',
    intro: 'Players, parents, coaches and partners on what Dnamo means to them.',
    items: [TESTIMONIAL(1), TESTIMONIAL(2), TESTIMONIAL(3)],
  },
  inits: {
    overviewTitle: 'Three ways we open the game',
    overviewLead: 'Each initiative has its own page and its own ways to give.',
    schol: {
      title: 'Scholarships',
      lead: 'Sponsor a player so cost never keeps a child off the field.',
      intro: ['A scholarship covers what a family cannot, so a player can train, compete and travel with their team. Choose a full sponsorship, a monthly gift or help with tournament costs.'],
    },
    coach: {
      title: 'Coach Recruitment & Support',
      lead: 'Back the coaches who teach, mentor and show up for every player.',
      intro: [
        'Our coaches do this because they believe in the mission. They are all young and have day jobs. They are here for the passion of the sport and the relationships they have with the players.',
        'Each coach connects with their players and is a consistent source of support, advice and mentorship. Many coaches help with carpools, school problems and social issues when parents ask for help.',
        'As players mature, coaches can be a safe place to ask for help.',
      ],
    },
    club: {
      title: 'Club House & Field',
      lead: 'Help Dnamo find a home: a club house and fields of our own.',
      intro: [
        'We are looking for a home. We believe we have created a community, and we are now looking for a multi-field space that can act as a home away from home.',
        'Dnamo FC is here to stay. Now let’s put a **stake in the ground**!',
      ],
      goals: [
        'The Club House will be a place for players to study, come together and interact with other age groups.',
        'One fund covers both the Club House and the fields.',
      ],
      raised: 0,
      goal: 0,
      matchText: 'Would you or your company match gifts to this fund? We would love to hear from you.',
    },
    contribLead: 'Dnamo funds scholarships for its own players every year. These are the totals for the last three years.',
    contrib: [
      { amount: '[TOTAL]', label: '[YEAR 1]', note: 'Scholarships funded by Dnamo' },
      { amount: '[TOTAL]', label: '[YEAR 2]', note: 'Scholarships funded by Dnamo' },
      { amount: '[TOTAL]', label: '[YEAR 3]', note: 'Scholarships funded by Dnamo' },
      { amount: '[TOTAL]', label: 'Three-year total', note: 'Given by Dnamo to its players' },
    ],
    kitLead: 'Put your logo on the kit worn by the 900 kids in our club. Each sponsorship runs for a two-year term, in line with our kit renewal policy.',
    kit: [
      { amount: '$20,000', label: 'Chest logo', note: 'Two-year term' },
      { amount: '$15,000', label: 'Backpack logo', note: 'Two-year term' },
      { amount: '$10,000', label: 'Arm logo', note: 'Two-year term' },
    ],
  },
  // Giving options. The ids are fixed (the donate page and its links use them);
  // the wording and amounts can change. tag is shown instead of a price when a gift has several amounts.
  giving: {
    general: { amounts: [25, 50, 100, 250], def: 50 },
    club: { amounts: [50, 100, 250, 500], def: 100 },
    schol: [
      { id: 'year', tag: 'Full year', short: 'Player for the year', title: 'Sponsor a player for the year', desc: 'Includes all fees and kit requirements for one player.', amounts: [5000] },
      { id: 'season', tag: 'Season', short: 'One season', title: 'Seasonal sponsorship', desc: 'Sponsor one player for a season.', amounts: [2500] },
      { id: 'two', tag: 'Two years', short: 'Two years', title: 'Multiyear sponsorship', desc: 'Sponsor one player for two years.', amounts: [10000] },
      { id: 'monthly', tag: 'Monthly', short: 'Monthly', title: 'Sponsor a player per month', desc: 'A smaller amount each month. Comes with a thank-you letter written by a player.', amounts: [50, 100, 250, 500] },
      { id: 'tourn', tag: 'Tournaments', short: 'Tournament', title: 'Tournament scholarship', desc: 'Covers travel expenses, tournament fees and lodging.', amounts: [50, 100, 250, 500] },
    ],
    coach: [
      { id: 'dev', tag: 'Education', short: 'Coach Development Fund', title: 'Coach Development Fund', desc: 'Contributes to coaching education programs and licensing.', amounts: [1000, 2500, 5000] },
      { id: 'fund', tag: 'Support', short: 'The Coaches Fund', title: 'The Coaches Fund', desc: 'Helps cover the cost of travel, specialty equipment and leadership seminars.', amounts: [1000, 2500, 5000] },
    ],
  },
};

// --- Rules ----------------------------------------------------------------

function amounts(v, what) {
  const arr = list(v, 6, `Amounts for ${what}`).map((a) => dollars(a, `An amount for ${what}`, 1000000)).filter((n) => n > 0);
  if (!arr.length) throw new Error(`${what} needs at least one amount.`);
  return [...new Set(arr)].sort((a, b) => a - b);
}

function fund(v, what) {
  const o = obj(v);
  const a = amounts(o.amounts, what);
  const def = Number(o.def);
  return { amounts: a, def: a.includes(def) ? def : a[0] };
}

// Gifts keep the built-in ids and order; only wording and amounts are taken from what was sent.
function gifts(v, defaults, what) {
  const sent = list(v, 10, what);
  return defaults.map((d) => {
    const o = obj(sent.find((x) => x && x.id === d.id));
    return {
      id: d.id,
      tag: text(o.tag, 20, `The short tag for "${d.title}"`),
      short: text(o.short, 40, `The button label for "${d.title}"`),
      title: text(o.title, 80, 'A gift title'),
      desc: text(o.desc, 240, `The description of "${d.title}"`, false),
      amounts: amounts(o.amounts, `"${d.title}"`),
    };
  });
}

function stat(v, what) {
  const o = obj(v);
  return { amount: text(o.amount, 24, `${what} amount`), label: text(o.label, 60, `${what} title`), note: text(o.note, 120, `${what} note`, false) };
}

function initiative(v, what) {
  const o = obj(v);
  return {
    title: text(o.title, 60, `${what} title`),
    lead: text(o.lead, 200, `${what} summary`),
    intro: paragraphs(o.intro, 8, 1200, `the ${what} text`),
  };
}

// A board photo is either one uploaded here, one of the original files, or empty (a placeholder shows)
function boardPhoto(v) {
  const s = String(v == null ? '' : v);
  if (!s || /^\/media\/[0-9a-f]{24}$/.test(s) || /^board-[a-z0-9-]+\.jpg$/.test(s)) return s;
  throw new Error('That photo is not one uploaded here.');
}

export const PAGE_CLEAN = {
  home(v) {
    return {
      kicker: text(v.kicker, 120, 'The small line above the headline', false),
      headline: text(v.headline, 120, 'The headline'),
      intro: text(v.intro, 300, 'The text under the headline', false),
      video: video(v.video),
      button1: link(v.button1, 'The first button'),
      button2: link(v.button2, 'The second button'),
      values: list(v.values, 16, 'The scrolling words').map((w) => text(w, 40, 'A scrolling word', false)).filter(Boolean),
      missionEyebrow: text(v.missionEyebrow, 60, 'The mission label', false),
      missionTitle: text(v.missionTitle, 140, 'The mission heading'),
      mission: paragraphs(v.mission, 10, 1500, 'the mission text'),
      initsEyebrow: text(v.initsEyebrow, 60, 'The initiatives label', false),
      initsTitle: text(v.initsTitle, 140, 'The initiatives heading'),
    };
  },
  board(v) {
    return {
      intro: text(v.intro, 800, 'The introduction', false),
      members: list(v.members, 24, 'Board members').map((m) => {
        const o = obj(m);
        return {
          name: text(o.name, 80, 'A board member name'),
          role: text(o.role, 80, 'A board member role', false),
          photo: boardPhoto(o.photo),
          bio: multiline(o.bio, 4000, 'A board member profile', false),
        };
      }),
      cta: text(v.cta, 200, 'The closing line', false),
    };
  },
  testimonials(v) {
    return {
      title: text(v.title, 100, 'The heading'),
      intro: text(v.intro, 300, 'The introduction', false),
      items: list(v.items, 30, 'Testimonials').map((t) => {
        const o = obj(t);
        return { quote: multiline(o.quote, 900, 'A testimonial'), name: text(o.name, 80, 'A testimonial name'), role: text(o.role, 80, 'A testimonial role', false) };
      }),
    };
  },
  inits(v) {
    const club = obj(v.club);
    return {
      overviewTitle: text(v.overviewTitle, 120, 'The overview heading'),
      overviewLead: text(v.overviewLead, 300, 'The overview introduction', false),
      schol: initiative(v.schol, 'Scholarships'),
      coach: initiative(v.coach, 'Coach page'),
      club: {
        ...initiative(club, 'Club House'),
        goals: paragraphs(club.goals, 8, 300, 'the Club House points'),
        raised: dollars(club.raised, 'Amount raised'),
        goal: dollars(club.goal, 'The goal'),
        matchText: text(club.matchText, 300, 'The gift-matching line', false),
      },
      contribLead: text(v.contribLead, 400, 'The contribution introduction', false),
      contrib: list(v.contrib, 8, 'Contribution totals').map((c) => stat(c, 'A contribution')),
      kitLead: text(v.kitLead, 400, 'The kit sponsorship introduction', false),
      kit: list(v.kit, 8, 'Kit sponsorships').map((c) => stat(c, 'A kit sponsorship')),
    };
  },
  giving(v) {
    return {
      general: fund(v.general, 'Where it is needed most'),
      club: fund(v.club, 'the Club House & Field fund'),
      schol: gifts(v.schol, PAGE_DEFAULTS.giving.schol, 'Scholarship gifts'),
      coach: gifts(v.coach, PAGE_DEFAULTS.giving.coach, 'Coach gifts'),
    };
  },
};
