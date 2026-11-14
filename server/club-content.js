// Dnamo Football Club: what every inner page says when nothing has been changed
// in the admin center. tools/build-club.mjs writes the pages in /public/fc from
// this file, so the pages and the admin defaults can never disagree.
//
// A page is: { eyebrow, title, lead, photo, facts, body, buttons, sections,
//              peopleTitle, peopleIntro, peopleOrder, people,
//              galleryTitle, galleryIntro, gallerySource, galleryCount, galleryFeed, gallery }
//   peopleOrder    'title' sorts people by title then name; 'manual' keeps the order of the list
//   gallerySource  'photos' shows the uploaded photos; 'instagram' shows the latest posts
// A section is: { title, text, points, rows, buttons }
//   facts   [{ label, value }]            short figures under the lead
//   rows    [{ label, value, note }]      a table: name, figure, small print
//   buttons [{ label, href }]

const BYGA = 'https://dnamofc.byga.net';
const CONTACT_FORM = BYGA + '/f/tesnnlnaks';
const TRYOUT_SIGNUP = BYGA + '/tryouts/s6le4sg93o/signup';

// Every page of the site, in menu order. group ties a page to its overview page.
export const CLUB_PAGES = [
  { slug: 'tryouts', label: 'Tryouts' },
  { slug: 'about', label: 'Who We Are', group: 'about', menu: 'About Us' },
  { slug: 'agegroups', label: 'Age Groups', group: 'about' },
  { slug: 'fees', label: 'Fees & Financials', group: 'about' },
  { slug: 'resources', label: 'Resources', group: 'about' },
  { slug: 'programs', label: 'Programs', group: 'programs', index: true },
  { slug: 'juniors', label: 'Juniors', group: 'programs' },
  { slug: 'microsoccer', label: 'Microsoccer', group: 'programs' },
  { slug: 'recreational', label: 'Recreational', group: 'programs' },
  { slug: 'competitive', label: 'Competitive', group: 'programs' },
  { slug: 'travel', label: 'Travel', group: 'programs' },
  { slug: 'goalkeeper', label: 'Goalkeeper Academy', group: 'programs' },
  { slug: 'idp', label: 'IDP', group: 'programs' },
  { slug: 'referee', label: 'Referee', group: 'programs' },
  { slug: 'camps', label: 'Camps', group: 'camps', index: true },
  { slug: 'summer-camp', label: 'Summer Camp', group: 'camps' },
  { slug: 'future-soccer-star', label: 'Future Soccer Star', group: 'camps' },
  { slug: 'microsoccer-shootout', label: 'Microsoccer Shootout', group: 'camps' },
  { slug: 'thanksgiving-camp', label: 'Thanksgiving Camp', group: 'camps' },
  { slug: 'winter-camp', label: 'Winter Camp', group: 'camps' },
  { slug: 'spring-camp', label: 'Spring Camp', group: 'camps' },
  { slug: 'contact', label: 'Contact' },
];

// Content keys cannot hold a dash, so "summer-camp" is saved as "summercamp"
export const keyOf = (slug) => slug.replace(/-/g, '');

const page = (p) => ({
  eyebrow: '', title: '', lead: '', photo: '', facts: [], body: [], buttons: [], sections: [],
  peopleTitle: '', peopleIntro: '', peopleOrder: 'title', people: [],
  galleryTitle: '', galleryIntro: '', gallerySource: 'photos', galleryCount: 12, galleryFeed: '', gallery: [], ...p,
});
const section = (s) => ({ title: '', text: [], points: [], rows: [], buttons: [], ...s });
// Written as "Title · License" below; kept as two separate fields
const person = (name, role, bio) => {
  const [title, ...rest] = role.split(' · ');
  return { name, role: title, license: rest.join(' · '), photo: '', bio };
};
const info = (href) => [{ label: 'Get more info', href }];

const STAFF = [
  person('Ika Kvavilashvili', 'Director of Coaching · USSF B License', 'Driven by a desire to give back to the sport that changed his life, Ika Kvavilashvili founded Dnamo FC. His vision was to create a platform where young athletes could experience the same opportunities and guidance that shaped his own journey. From his roots at Dinamo Academy in Georgia to winning titles like the Dallas Cup and Surf Cup with Santa Clara Sporting in the US, his journey is a testament to his talent and tenacity. Ika draws on his experiences from Europe and the US to positively impact young athletes. While testing his skills professionally in Turkey and Georgia, coaching emerged as his true calling.'),
  person('Claudio Castro', 'Director of Formations · USSF B License', "Claudio Castro, a revered Bay Area coach, began his journey with Mt. Diablo Soccer Club and later excelled with Diablo Valley Soccer Club as an ODP Regional Player. He reached the Futsal Nationals semi-final in 2007 and led Concord High's NCS Championship run in 2012-2013 as top goal scorer. In 2023, all four teams he coached made State Cup finals, with three winning, marking his coaching at NorCal's highest levels."),
  person('Guillaume Rahem', 'Director of Microsoccer & Camps · USSF C License', 'Guillaume, also known as "Ganso," comes from Suresnes in West Paris. His soccer journey began at five, inspired by PSG and Zinedine Zidane. He played for local clubs and started coaching with Dnamo FC in 2021, working from Microsoccer up to NorCal competitive levels. Coaching lets him stay connected to the game while passing on life lessons and nurturing young players on and off the field.'),
  person('Luis Soto', 'Director of Player Pathway · USSF C License', 'Coach Luis, originally from Guatemala, arrived in the United States at the age of two. His soccer journey began at six with America Scores. He won the State Cup in 2014-2015 and the CIF Championship with Lowell High School. Luis coaches to give youngsters the same opportunities he cherished, guiding both recreational and travel teams at Dnamo.'),
  person('Paulo Romero', 'Director of Goalkeepers · USSF D License', "Coach Paulo has more than 12 years of coaching experience. His soccer journey began as a goalkeeper in Peru's top academies, earning a spot on the U-15 national team. At Dnamo FC he channels that experience into shaping goalkeepers and teams, instilling discipline and teamwork and fostering a culture of excellence."),
  person('Benno Nagel', 'Director of Individual Development Program · UEFA B & USSF B', 'Benno Nagel brings more than 15 years of experience across youth development and the professional game, including work with the Dinamo Zagreb Academy in Croatia and Rayo OKC of the former North American Soccer League. He has also contributed to the launch of professional clubs such as Oakland Roots SC and The Town FC, giving him a broad view of the pathway from youth soccer to the highest levels.'),
  person('Douglas Donizet', 'Coach · CBF B & Goalkeeper 1 and 2 License', 'Originally from São Paulo, Coach Douglas brings an 11-year professional playing career, notably with Atlético Goianiense, and a sophisticated tactical approach. Blending the creative flair of Brazilian football with modern coaching standards, he develops well-rounded athletes who are technically precise and tactically aware, both outfield players and goalkeepers.'),
  person('Gaby Ebissou', 'Coach · USSF D License', 'For Coach Gaby, football is the sport of his life. He joined his local club in France at six, discovered his qualities as a goalkeeper, and at ten joined the Tours Football Club academy, where he spent eight years from U10 to U18. He is now a youth coach in San Francisco who takes joy in sharing his knowledge and passion.'),
  person('Ahmed Fara', 'Coach · USSF C License', "Ahmed Fara began coaching in high school and joined Dnamo Football Club in 2022. His work is marked by a commitment to excellence and holistic player development, instilling discipline, teamwork and perseverance so that young athletes can meet life's challenges with resilience."),
  person('Alex Flores', 'Coach · USSF D License', "Born and raised in San Francisco, Alex's passion for football grew while playing at club level. He began coaching at Dnamo in 2022. Alex is deeply interested in the tactical side of the game and draws on the ideas of managers like Mikel Arteta, Pep Guardiola and Jose Mourinho in his coaching."),
  person('Roberto Gomes', 'Coach · USSF C License', 'Coach Roberto grew up in Brazil, left home at 11 to join an academy and signed his first professional contract at 15 with Atlético Mineiro. As a goalkeeper he played in the Campeonato Brasileiro Série A and Série B with clubs like Goiás and Atlético Goianiense, and gained international experience with Udinese in Italy. He now helps young athletes build strong skills and a deep understanding of the game.'),
  person('Armando Acosta', 'Coach', 'Coach Armando (Mando) started playing fútbol in Colombia at the age of three and played for his city team from U10 to U15 in semi-professional tournaments. He moved to the U.S. at 16 and played two years of varsity soccer. As a coach he has learned that playing is not the only reason to love fútbol.'),
  person('Salvador Herrera', 'Coach', 'Coach Salvador grew up playing in Mexico City from the age of six. He began coaching ten years ago in San Leandro and Hayward. A father of three who all play soccer, he values discipline, teamwork and personal growth, and trains players of different ages to reach their full potential.'),
  person('Paolo Lacoste', 'Coach · USSF C License', 'Paolo, originally from Paris, trained at professional youth academies alongside future professionals. For him coaching is a true vocation: mentorship that develops skill, nurtures a real love for the game and teaches life lessons. He joined Dnamo after a year in Berkeley.'),
  person('Juan Larios', 'Coach', 'Juan Larios started playing at three and went on to four years of collegiate soccer at Cal State San Bernardino, reaching the NCAA Division II Regional Championship. He has coached at Dnamo FC for three years and aims to make a meaningful impact in the lives of his players.'),
  person('Jesus Quinteros', 'Coach', 'Coach Jesús started playing in Colombia at four, spent five years in Spain, and made his professional debut in Colombia at 17. He went on to play professionally in Chile, Mexico and the United States. He began coaching in the U.S. in 2016 and loves passing his knowledge on to children, helping them grow in football and as people.'),
  person('Alberto Toledo', 'Coach · USSF D License', "Alberto Toledo, from San Francisco, excelled as a goalkeeper and captained his high school team. He played at the highest level in NorCal from age 14 and competed in Europe's Donosti Cup. A Molecular Biology graduate of UC Santa Cruz, he is now a goalkeeper coach."),
  person('Diego Sanchez', 'Coach', 'Diego Sanchez played for the Guatemalan national team and Mission Green FC, with appearances at the Donosti Cup, Dallas Cup and Surf Cup. He holds a D coaching license and is working toward his C license.'),
  person('Rodrigo Silveira', 'Coach', 'Coach Rodrigo, born and raised in Bahia, Brazil, developed his skills in the youth academy of Vitória FC. He began coaching in 2014 with Soccer Without Borders and has coached in San Francisco since 2016 with middle school, high school and club programs, building confidence and love for the game.'),
  person('Michael Soto', 'Coach', 'Coach Michael was born and raised in San Francisco and joined Dnamo FC as a player at 13. Through the club he played at the highest level of youth soccer in the U.S., including MLS Next with the SF Glens. He now plays at City College of San Francisco and coaches at the club that helped him succeed.'),
];

export const CLUB_DEFAULTS = {
  tryouts: page({
    eyebrow: '2026/2027 Season',
    title: 'Tryouts',
    lead: 'The club where you come to be better than you were yesterday.',
    photo: '/hero-1.jpg',
    body: [
      'Tryouts are how we place every player in the right environment: the right group, the right coach and the right level of challenge. Discover your potential and join us for the upcoming season.',
      'The official 2026/2027 season begins in August and runs through late May or early June, with summer games and camps to set the stage.',
    ],
    buttons: [{ label: 'Register now', href: TRYOUT_SIGNUP }, { label: 'Find your age group', href: 'agegroups.html' }],
    sections: [
      section({ title: 'New participants', text: ['Welcome to the journey. To get started:'], points: [
        '**Begin registration.** Use the Register now button to start your sign-up.',
        "**Find your group.** Check the age group page to find your child's age category.",
        "**Await confirmation.** After tryouts we will contact you about your player's invitation to join the club.",
      ], buttons: [{ label: 'Register now', href: TRYOUT_SIGNUP }] }),
      section({ title: 'Returning players', text: ["We're thrilled to have you back. Here is how to rejoin:"], points: [
        '**Register and attend.** All returning players register and attend tryouts for the new season.',
        "**Verify your details.** Confirm your child's age group for the new season-year.",
        "**Confirmation.** After tryouts we will notify you about your player's place with the club.",
      ], buttons: [{ label: 'Register now', href: TRYOUT_SIGNUP }] }),
      section({ title: 'Important tryout guidelines', points: [
        'Tryouts ensure the highest level of integrity and competition for all players and levels.',
        'All players must try out: current, returning and new.',
        'Team spots are not awarded without attending tryouts or scheduling a player evaluation.',
        'We place players based on overall individual and team development needs.',
      ] }),
      section({ title: 'What a season at Dnamo offers', text: [
        'Our advanced players receive guidance from top-tier coaches, access to competitive play in higher-level leagues, and exposure through showcases and events aimed at college recruitment.',
        'We believe in nurturing talent and giving every dedicated athlete the support needed to reach their full potential. Questions? Write to info@dnamofc.com.',
      ] }),
    ],
  }),

  about: page({
    eyebrow: 'Who we are',
    title: 'The Dnamo Way',
    lead: 'Excellence in academics and soccer builds maturity and self-confidence.',
    photo: '/hero-3.jpg',
    body: [
      'Dnamo FC believes the experiences a player has with us will be beneficial throughout their lifetime. We are resolute in dedicating our time and resources to the technical, tactical, physical and psychological aspects of playing soccer.',
    ],
    sections: [
      section({ title: 'Our mission', text: [
        'Our mission is simple: we strive to inspire our youth, on and off the field, to be better people and players. Focusing on player development and the love of the game, we empower our members to be positive and skilled athletes.',
        'Dnamo FC serves the more committed soccer player by providing the highest level of education and instruction available, preparing players to proudly represent the club at local, state, regional and national competitions.',
      ] }),
      section({ title: 'Development', text: [
        'Developing soccer players is a long-term process that requires passion and commitment from professional coaches and a community of members who genuinely care. We are invested in your children from the start, and seeing them flourish and reach their full potential is our reward.',
      ] }),
      section({ title: 'Our community', text: [
        'We look to harness the ability of our members and give them opportunities to excel on and off the field. We want a reputation for developing exceptional human beings while helping those who wish to move on to programs of the highest caliber.',
      ] }),
    ],
    peopleTitle: 'Meet our team',
    peopleIntro: 'Our coaching staff is nationally licensed and continually attending professional development programs. Our coaches are supportive of each child, knowledgeable in player development, and hired for their approach, mindset and experience. Select a coach to read their profile.',
    people: STAFF,
    galleryTitle: 'Gallery',
    galleryIntro: 'Highlights from match days, training sessions and club events.',
    gallery: ['/hero-1.jpg', '/hero-2.jpg', '/hero-3.jpg', '/hero-4.jpg'],
  }),

  agegroups: page({
    eyebrow: 'About us',
    title: 'Age Group Alignment',
    lead: 'Age groups now follow the season year, August 1 to July 31.',
    body: ['Youth soccer age groups shifted to a season-year format to better align players with their school-grade peers nationwide. Use the table to find your player\'s group for 2026-2027.'],
    sections: [
      section({ title: 'Age groups 2026-2027', rows: [
        ['U8', 2018], ['U9', 2017], ['U10', 2016], ['U11', 2015], ['U12', 2014], ['U13', 2013],
        ['U14', 2012], ['U15', 2011], ['U16', 2010], ['U17', 2009], ['U18', 2008],
      ].map(([label, y]) => ({ label, value: `Aug 1, ${y} - Jul 31, ${y + 1}`, note: '' })) }),
      section({ title: 'Not sure where your player fits?', text: ['Younger players start in Juniors (18 months to 3 years) and Microsoccer (Pre-K to 1st grade). If your player sits between groups, our coaches will help place them where they will develop best.'],
        buttons: [{ label: 'See our programs', href: 'programs.html' }, { label: 'Contact us', href: 'contact.html' }] }),
    ],
  }),

  fees: page({
    eyebrow: 'About us',
    title: 'Fees & Financials',
    lead: 'Transparent pricing, and a path to excellence for every committed player.',
    body: ['Our fee structure is designed to cover professional coaching, high-quality field space and comprehensive league administration.'],
    sections: [
      section({ title: 'Competitive teams', text: ['NPL, Premier, Gold, Silver, Bronze and Upper House.'], rows: [
        { label: 'Training · U13+', value: '$1,177 per season', note: '2 trainings and 1 conditioning per week, plus 1 week of pre-season training' },
        { label: 'Training · U9-U12', value: '$1,016 per season', note: '1 training and 1 conditioning' },
        { label: 'Registration · All ages', value: '$450 annual', note: 'Applies to NorCal teams only, not Upper House' },
        { label: 'Admin · All ages', value: '$5 annual', note: 'Administrative fee' },
        { label: 'State Cup · All ages', value: '$400 annual', note: 'Not all teams participate in State Cup' },
        { label: 'Tournaments · All ages', value: 'Varies', note: 'One tournament fee, depending on the tournament' },
        { label: 'Uniform · NPL / Premier / Gold', value: '$402-$407', note: '3 jerseys (home, away, third), 2 shorts, 2 socks, training jersey, pants, jacket, backpack (goalkeeper jerseys mandatory)' },
        { label: 'Uniform · All other levels', value: '$348-$353', note: '2 jerseys (home, away), 2 shorts, 2 socks, training jersey, pants, jacket, backpack (goalkeeper jerseys mandatory)' },
      ] }),
      section({ title: 'Recreational teams', rows: [
        { label: 'Training · 2nd-5th grade', value: '$561 per season', note: '1 training per week, plus 1 week of pre-season training' },
        { label: 'Uniform', value: '$118-$123', note: '1 jersey, 1 short, 1 sock and a training jersey' },
        { label: 'Contract', value: 'By season', note: 'Fall and Spring are separate commitments' },
      ] }),
      section({ title: 'Microsoccer teams (ages 4-7)', rows: [
        { label: 'Training with games · Pre-K (4) to 1st grade', value: '$400 per season', note: '1 training per week, plus 1 week of pre-season training' },
        { label: 'Training without games · Pre-K (4) to 1st grade', value: '$282 per season', note: '' },
        { label: 'Uniform', value: '$94', note: '1 jersey, 1 pair of shorts and 1 pair of socks' },
        { label: 'Contract', value: 'By season', note: 'SF Vikings Micro Soccer League' },
      ] }),
      section({ title: 'Winter program', rows: [
        { label: 'Training · 2nd-8th grade', value: '$455', note: '1 training per week' },
        { label: 'Training · 2nd-8th grade', value: '$725', note: '2 trainings per week' },
        { label: 'Futsal · 2nd-8th grade', value: '$69', note: 'Jose Coronado Futsal League' },
        { label: 'Permits · 2nd-8th grade', value: '$40 (1x) / $80 (2x)', note: 'Field permits' },
        { label: 'Training · All ages', value: '$560', note: '2 trainings per week' },
        { label: 'Permits · All ages', value: '$80', note: 'Field permits' },
      ] }),
      section({ title: 'Financial aid', text: [
        "We believe that financial constraints should never stand in the way of a player's passion. Dnamo FC offers needs-based financial aid and scholarships, based on total family income and demonstrated hardship. We also offer installment payment plans to spread the cost of the season over several months.",
      ], points: [
        '**Awards.** Aid covers a portion of club fees based on demonstrated need and available scholarship funds.',
        '**Duration.** Support is awarded annually for Competitive and Travel teams and seasonally for Micro and Recreational programs. Families reapply each term.',
        '**Timeline.** Decisions are typically emailed within two weeks of a completed application.',
        '**Exclusions.** Aid does not cover uniform costs, tournament fees or Winter Season programs.',
        '**Availability.** Funds are limited and not guaranteed; we encourage early applications.',
      ], buttons: [{ label: 'Application form', href: 'https://form.jotform.com/250878166870065' }, { label: 'Email financial aid', href: 'mailto:financialaid@dnamofc.com' }] }),
      section({ title: 'Refund policy', text: ['**Micro and Recreational teams (SFYS)**'], points: [
        '**No refunds.** Once registered, fees are non-refundable; they cover field reservations, coaching and league submissions. A full or partial refund may be issued only if the club is unable to form a complete team.',
        '**Transfer option.** If you cannot participate you may propose a replacement player. Refunds are considered case by case once the new player is confirmed.',
        '**Commitment.** Registration covers the current season only, with no future obligation.',
      ] }),
      section({ title: 'Travel and Competitive teams (NorCal Premier)', points: [
        '**No refunds.** Accepting a roster spot is a binding commitment. Fees are immediately allocated to NorCal league fees and seasonal operations.',
        '**Transfer option.** Families may offer a replacement player; any refund depends on club approval and a successful replacement.',
        '**Commitment.** Competitive registration typically covers a full year (Fall and Spring). Rare exceptions require Director approval.',
      ] }),
    ],
  }),

  resources: page({
    eyebrow: 'About us',
    title: 'Resources',
    lead: 'Partners who help our players stay healthy, recover well and perform.',
    sections: [
      section({ title: 'Atlas Health Center', text: [
        'Atlas Health Center is a long-standing integrative wellness facility in San Francisco that has provided holistic care for more than 30 years. The center specializes in chiropractic adjustments, acupuncture and manual therapy to address the root causes of pain, with on-site digital X-rays and individual recovery plans for patients of all ages.',
        'This partnership gives Dnamo FC players and their families professional expertise in managing sports-related injuries and musculoskeletal health, so athletes can recover properly after high-intensity training and stay in peak condition through the season.',
      ], rows: [
        { label: 'Mission District office', value: '(415) 282-1755', note: '2920 24th St, San Francisco, CA 94110' },
        { label: 'Van Ness office', value: '(415) 513-5874', note: '2301 Van Ness Ave #101, San Francisco, CA 94109' },
      ], buttons: [{ label: 'Visit Atlas Health Center', href: 'http://www.atlashealthcenter.net/' }] }),
    ],
  }),

  programs: page({
    eyebrow: 'Programs',
    title: 'A pathway for every player',
    lead: 'From first touches at 18 months to travel teams competing across the region.',
    photo: '/hero-2.jpg',
    body: [
      'Dnamo FC is committed to developing the best talent in San Francisco. We believe that the pursuit of excellence in both academics and soccer builds maturity, discipline and self-confidence. The experiences our players gain here prepare them for success far beyond the field.',
      'Every program below is a step on one pathway. Players move up when they are ready, and our coaches guide each family on the right next step.',
    ],
    buttons: [{ label: 'Tryouts', href: 'tryouts.html' }, { label: 'Age groups', href: 'agegroups.html' }],
  }),

  juniors: page({
    title: 'Dnamo Juniors',
    lead: 'First steps into the beautiful game, with a parent or caregiver alongside.',
    photo: '/hero-2.jpg',
    facts: [{ label: 'Ages', value: '18 months - 3 years' }, { label: 'Training', value: '1 session a week' }, { label: 'With', value: 'Parent or caregiver' }],
    body: [
      'Dnamo FC Juniors is an introductory program designed to help little ones take their very first steps into the game. In a safe, fun and nurturing environment, children explore movement, ball skills and social play in a way that feels natural and is designed for early childhood development.',
      'At this age the win is simple: a child who cannot wait to come back next week.',
    ],
    buttons: info(BYGA + '/programs/x6libl7zpz/signup'),
    sections: [
      section({ title: 'What we focus on', points: ['First touches with the ball', 'Coordination and movement', 'Social interaction and making friends', 'Building confidence through play'] }),
      section({ title: 'Typical structure', points: ['1 session per week', 'Parent or caregiver participation encouraged', 'Age-appropriate activities and games', 'A fun, positive and pressure-free environment'] }),
      section({ title: 'What comes next', text: ['When players reach Pre-K age they are ready for Microsoccer, where they join a team and play their first weekend games.'], buttons: [{ label: 'Microsoccer', href: 'microsoccer.html' }] }),
    ],
  }),

  microsoccer: page({
    title: 'Microsoccer',
    lead: 'A first team, a first coach and a love for the game.',
    photo: '/hero-2.jpg',
    facts: [{ label: 'Ages', value: 'Pre-K (4) - 1st grade' }, { label: 'Training', value: '1 session a week' }, { label: 'Games', value: 'Weekends' }],
    body: [
      "The Microsoccer program introduces young players to the game through fun, creative and engaging activities that support early development. The curriculum builds a strong foundation in soccer while supporting children's physical, social, cognitive and emotional growth.",
      'Coaches create imaginative training environments that keep players engaged while they learn basic technical skills. Teams typically stay together through the season so players feel comfortable and confident.',
    ],
    buttons: info(BYGA + '/tryouts/jm960wc99i/signup'),
    sections: [
      section({ title: 'Typical structure', points: ['1 training session per week', 'Weekend games in the SF Vikings Micro Soccer League', 'A week of pre-season training', 'Focus on fun and skill introduction'] }),
      section({ title: 'What comes next', text: ['From 2nd grade, players continue in the Recreational program or, when they are ready for more, try out for a Competitive team.'], buttons: [{ label: 'Recreational', href: 'recreational.html' }, { label: 'Fees', href: 'fees.html' }] }),
    ],
  }),

  recreational: page({
    title: 'Recreational',
    lead: 'Keep developing, keep enjoying it, and keep soccer in balance with everything else.',
    photo: '/hero-3.jpg',
    facts: [{ label: 'Grades', value: '2nd - 5th grade' }, { label: 'Training', value: '1 session a week' }, { label: 'League', value: 'SF Youth Soccer' }, { label: 'Seasons', value: 'Fall and Spring' }],
    body: [
      'The Recreational program is for players who want to continue developing their skills while enjoying a balanced soccer experience. Players take part in structured training sessions and games while learning the fundamentals of teamwork, decision-making and technique in a positive environment.',
    ],
    buttons: info(BYGA + '/tryouts/ueq9ifrdbn/signup'),
    sections: [
      section({ title: 'What we focus on', points: ['Skill development', 'Game understanding', 'Confidence building', 'Enjoyment of the sport'] }),
      section({ title: 'Typical structure', points: ['1 training session per week', 'League games through San Francisco Youth Soccer', 'Seasonal participation: Fall and Spring are separate commitments'] }),
      section({ title: 'What comes next', text: ['Recreational players who want more training and a higher level of play are invited to an evaluation for our Competitive teams.'], buttons: [{ label: 'Competitive', href: 'competitive.html' }] }),
    ],
  }),

  competitive: page({
    title: 'Competitive',
    lead: 'For players ready to train more seriously and compete at a higher level.',
    photo: '/hero-1.jpg',
    facts: [{ label: 'Ages', value: 'U9 - U18' }, { label: 'Entry', value: 'Tryouts or evaluation' }, { label: 'Coaches', value: 'Licensed staff' }],
    body: [
      'Players are placed on teams through evaluations or tryouts and train in structured environments led by licensed coaches. The program emphasizes technical development, tactical understanding and competitive performance, with league play and tournaments through the season.',
      'We place players where they will be challenged and where they will play. Both matter.',
    ],
    buttons: [{ label: 'Tryouts', href: 'tryouts.html' }, { label: 'Fees', href: 'fees.html' }],
    sections: [
      section({ title: 'Focus areas', points: ['Technical mastery', 'Tactical understanding', 'Competitive mindset', 'Team development'] }),
      section({ title: 'Typical structure', points: ['U9-U12: 1 training and 1 conditioning session per week', 'U13 and up: 2 trainings and 1 conditioning session per week', 'A week of pre-season training', 'League play and tournaments (NPL, Premier, Gold, Silver, Bronze and Upper House levels)'] }),
      section({ title: 'What comes next', text: ['Our most committed players move into the Travel program, and can add specialist work through the Goalkeeper Academy or the Individual Development Program.'], buttons: [{ label: 'Travel', href: 'travel.html' }, { label: 'IDP', href: 'idp.html' }] }),
    ],
  }),

  travel: page({
    title: 'Travel',
    lead: 'For highly committed players who want to compete at an advanced level.',
    photo: '/hero-4.jpg',
    facts: [{ label: 'Training', value: '2-3 sessions a week' }, { label: 'League', value: 'NorCal Premier' }, { label: 'Entry', value: 'Tryouts' }],
    body: [
      'Travel teams train multiple times per week and compete in regional leagues and tournaments. Players are selected through tryouts and take part in NorCal Premier competitions throughout the season.',
      'Advanced teams also have opportunities to compete internationally, in tournaments such as the Mediterranean International Cup in Spain and the Gothia Cup in Sweden.',
    ],
    buttons: [{ label: 'Tryouts', href: 'tryouts.html' }],
    sections: [
      section({ title: 'Where our teams compete', points: ['League matches in NorCal Premier', 'Regional tournaments', 'Showcase events', 'State Cup competitions'] }),
      section({ title: 'Typical structure', points: ['2-3 training sessions per week', 'League matches', 'Regional tournaments', 'A full-year commitment covering Fall and Spring'] }),
      section({ title: 'The commitment', text: ['Travel soccer asks a lot of players and families: time, travel and consistency. In return players get top-tier coaching, a demanding match schedule and exposure through showcases aimed at college recruitment.'], buttons: [{ label: 'Fees and financial aid', href: 'fees.html' }] }),
    ],
  }),

  goalkeeper: page({
    title: 'Goalkeeper Academy',
    lead: 'Specialized training for the most specialized position on the field.',
    photo: '/hero-4.jpg',
    facts: [{ label: 'For', value: 'Goalkeepers' }, { label: 'Led by', value: 'Former professional goalkeepers' }],
    body: [
      'The Dnamo FC Goalkeeper Academy helps goalkeepers develop the technical, tactical and mental skills the modern game demands. Training takes place in a focused goalkeeper environment where players work alongside other goalkeepers and receive detailed coaching from experienced staff.',
    ],
    buttons: info(BYGA + '/programs/urprxiudtx/signup'),
    sections: [
      section({ title: 'What we train', points: ['Shot stopping and reaction saves', 'Handling and catching techniques', 'Footwork and positioning', '1v1 situations and decision-making', 'Distribution with hands and feet', 'Communication and leadership'] }),
      section({ title: 'Why join', text: ['Goalkeepers receive more repetitions, detailed feedback and specialized coaching that accelerates development and builds confidence in matches. The program is led by former professional goalkeeper coaches and is designed to grow confident, reliable goalkeepers who perform consistently in competitive environments.'] }),
    ],
  }),

  idp: page({
    title: 'Individual Development Program',
    lead: 'A personal development plan, a dedicated performance coach and real accountability.',
    photo: '/hero-1.jpg',
    facts: [{ label: '1:1 mentorship', value: '$500 a month' }, { label: 'Group (up to 6)', value: '$150 a month' }, { label: 'Minimum', value: '2 months' }],
    body: [
      'Team training builds chemistry, tactical understanding and competitive identity. It remains the foundation of our development model. But meaningful individual growth often needs additional structure: accountability, detailed film analysis and long-term planning.',
      'The IDP is an optional high-performance pathway for ambitious field players. It is not additional team training. It is individualized strategic development. Goalkeepers have their own IDP within the Goalkeeper Academy.',
    ],
    buttons: [{ label: 'Register', href: BYGA + '/programs/93huhauz9x/signup' }],
    sections: [
      section({ title: 'Who it is for', points: ['Competitive youth players seeking additional structure', 'Motivated young players who want a long-term development plan', 'Players targeting varsity impact roles', 'College-aspiring athletes', 'Players pursuing professional pathways'] }),
      section({ title: 'What players do', text: ['Each player is paired with a performance coach who serves as strategist, mentor and accountability partner. Through in-person and virtual sessions, players will:'], points: ['Build a personalized annual development roadmap', 'Set measurable performance objectives', 'Conduct structured film analysis and tactical reviews', 'Develop professional habits and accountability systems', 'Receive monthly written progress evaluations', 'Join exclusive webinars with professional players and coaches'] }),
      section({ title: 'Program structure', rows: [
        { label: 'Month 1 · Assessment and foundation', value: '', note: 'Development intake and goal assessment, parent-player-coach strategy meeting, on-field technical evaluation, tactical film breakdown and an initial development report' },
        { label: 'Every month · Guided development', value: '', note: 'Four weekly 45-minute virtual performance sessions, one 60-minute on-field session, a written progress report and one live professional webinar' },
      ] }),
      section({ title: 'Program leadership', text: [
        'The program is led by Benno Nagel, a former professional coach with more than 15 years in advanced youth development and professional environments, including Dinamo Zagreb Academy (Croatia) and Rayo OKC of the North American Soccer League. He has worked with nearly 40 national team players across youth and senior levels, including several who have competed in FIFA World Cup competitions.',
        "During this pilot phase Benno works directly with every participating player, and connects with each player's team coaches so the individual work reinforces their team environment.",
      ] }),
      section({ title: 'Investment and value', text: ['In the Bay Area, private training typically costs $100 to $150 per hour, without film analysis, written evaluations or structured mentorship. The IDP combines all of these in one framework. Spots are intentionally limited.'], rows: [
        { label: 'Individual · 1:1 coaching and mentorship', value: '$500 per month', note: 'Minimum 2-month commitment ($1,000 per family). Parents are invited to join.' },
        { label: 'Group · 6:1 coaching and mentorship', value: '$150 per month', note: 'Minimum 2-month commitment ($300 per family). Groups of 4 to 6 athletes, ideally by position.' },
      ], buttons: [{ label: 'Individual enrollment', href: BYGA + '/programs/aaapk64j80/signup' }, { label: 'Group enrollment', href: BYGA + '/f/lyiypvmkhs' }] }),
    ],
  }),

  referee: page({
    title: 'Referee Program',
    lead: 'Learn the game from the middle of the field, and get paid for it.',
    photo: '/hero-3.jpg',
    facts: [{ label: 'Ages', value: '13 and older' }, { label: 'Pay', value: '$25 - $35 a match' }],
    body: [
      'In partnership with the San Francisco Soccer Referee Association, the club invites individuals 13 and older to become paid league referees. Refereeing deepens a player\'s understanding of the game and builds confidence, judgment and leadership.',
      'Interested candidates register through the US Soccer Learning Center. If you have any questions, contact us and we will get back to you as soon as possible.',
    ],
    buttons: [{ label: 'Register', href: 'https://docs.google.com/forms/d/e/1FAIpQLSdJwanbucAJeYKiD_SCF7SG-zD8W7u96jquD5L4yJfc2qCRfw/viewform' }, { label: 'US Soccer Learning Center', href: 'https://learning.ussoccer.com/referee' }],
  }),

  camps: page({
    eyebrow: 'Camps',
    title: 'Training camps',
    lead: 'Week-long programs during every school break, for beginners and experienced players alike.',
    photo: '/hero-2.jpg',
    body: ['Our camps run year-round and are led by expert youth coaches. They focus on progressive skill development, teamwork, fair play and an international philosophy that builds both soccer and real-world skills.'],
  }),

  'summer-camp': page({
    title: 'Summer Camp',
    lead: 'A full week of soccer during the longest break of the year.',
    photo: '/hero-1.jpg',
    facts: [{ label: 'Length', value: 'Week-long' }, { label: 'Options', value: 'Full day or half day' }, { label: 'Extra', value: 'After care' }],
    body: ['Our Summer Camp is a comprehensive, week-long experience where players improve core skills, play in fun tournaments and deepen their love for the game in a supportive, high-energy setting. Expert coaches guide players through an intensive curriculum focused on ball mastery, distribution and teamwork.'],
    buttons: [{ label: 'Full day info', href: BYGA + '/programs/6pv0snhxwj/signup' }, { label: 'Half day info', href: BYGA + '/programs/4b5j5a1ywg/signup' }, { label: 'After care info', href: BYGA + '/programs/ml8gz8byxd/signup' }],
  }),

  'future-soccer-star': page({
    title: 'Future Soccer Star Shootout',
    lead: 'Fun. No pressure. Just soccer.',
    photo: '/hero-2.jpg',
    facts: [{ label: 'Ages', value: '3 - 8' }, { label: 'Cost', value: 'Free' }],
    body: ['Introduce your child to the game in a supportive, high-energy environment. Whether they are brand new or already playing rec, this event is designed to build confidence and give parents a first-hand look at our club culture.'],
    buttons: [{ label: 'Sign up here', href: BYGA + '/programs/gs05avdyw2/signup' }],
    sections: [
      section({ title: 'What to expect', points: ['**Skill-building.** Age-appropriate activities and "shootout" games.', '**The vibe.** 100% encouragement. This is not a tryout.', '**The goal.** Helping young players fall in love with the sport.'] }),
      section({ title: 'Reserve your spot', text: ['Spaces are limited to ensure quality coaching for every child.'] }),
    ],
  }),

  'microsoccer-shootout': page({
    title: 'Microsoccer Shootout',
    lead: 'A free event for our youngest players, and our way of giving back.',
    photo: '/hero-2.jpg',
    facts: [{ label: 'Cost', value: 'Free' }],
    body: ['We are committed to nurturing the next generation of soccer lovers through our Microsoccer program. This free shootout offers fun, engaging activities that introduce our youngest players to the game, fostering joy, teamwork and a lifelong love for soccer.'],
    buttons: info(CONTACT_FORM),
  }),

  'thanksgiving-camp': page({
    title: 'Thanksgiving Camp',
    lead: 'Stay active and sharp through the holiday break.',
    photo: '/hero-2.jpg',
    body: ['Our Thanksgiving Soccer Camp keeps young players active and engaged during the holiday break, with a focus on fun and skill retention. Led by our professional coaches, the camp uses high-energy drills and small-sided games to improve technical ability and tactical understanding before players return to the regular season.'],
    buttons: info(BYGA + '/programs/hj15224m1v/signup'),
  }),

  'winter-camp': page({
    title: 'Winter Camp',
    lead: 'High-level training that keeps skills moving forward through the cold season.',
    photo: '/hero-4.jpg',
    body: ['Our Winter Camp offers an intensive training environment designed to prevent skill regression and advance technical proficiency. Led by licensed coaches, the program uses fast-paced indoor or outdoor activities. It is the ideal opportunity for dedicated players to maintain peak performance and prepare for the spring season.'],
    buttons: info(CONTACT_FORM),
  }),

  'spring-camp': page({
    title: 'Spring Camp',
    lead: 'Sharpen up right before the next playing cycle begins.',
    photo: '/hero-3.jpg',
    body: ['The Spring Camp gives players a targeted set of sessions on foundational technical skills and dynamic small-group tactics as they prepare for the upcoming season. It is designed to re-energize players, sharpen their abilities and build confidence through enjoyable, challenging drills.'],
    buttons: info(CONTACT_FORM),
  }),

  contact: page({
    eyebrow: 'Ready to get started?',
    title: 'Get started with Dnamo FC',
    lead: "We're excited to welcome new players and families into the Dnamo FC community.",
    photo: '/hero-3.jpg',
    body: ["Whether you're looking to join a team, attend a training session or learn more about our programs, we're here to help. Use the contact form, or write to us at info@dnamofc.com."],
    buttons: [{ label: 'Contact us', href: CONTACT_FORM }, { label: 'Email info@dnamofc.com', href: 'mailto:info@dnamofc.com' }],
  }),
};
