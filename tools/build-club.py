# Writes public/fc/index.html, the Dnamo Football Club home page.
# It borrows the <head>, footer and scripts of the Foundation home page
# (public/index.html, written by tools/build.ps1), so run this after build.ps1:
#     python tools/build-club.py
# The words here are the defaults; server/club.js must say the same.
import io
import os

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public')
FC = 'https://www.dnamofc.com'
STORE = 'https://www.soccer.com/club/2001959548'
ACADEMY = 'https://www.dnamoacademy.org/'
PROGRAMS = ['Juniors', 'Microsoccer', 'Recreational', 'Competitive', 'Travel', 'Goalkeeper Academy', 'IDP', 'Referee']
CAMPS = ['Summer Camp', 'Future Soccer Star', 'Microsoccer Shootout', 'Thanksgiving Camp', 'Winter Camp', 'Spring Camp']
ABOUT = [('Who We Are', '/about'), ('Meet Our Team', '/about'), ('Gallery', '/about'), ('Age Groups', '/agegroups'),
         ('Fees &amp; Financials', '/fees'), ('Resources', '/resources')]
LEVELS = [
    ('Microsoccer', 'Fun, imaginative environments and a specialized curriculum that promote a love of soccer while developing social, emotional, physical and technical skills.'),
    ('Recreational', 'A simple, non-competitive, community-based program that safely introduces new players to soccer and builds confidence and technical skills.'),
    ('Competitive', 'High-level coaching, preparation and competition through a curriculum that builds soccer IQ, technical skills and mental conditioning.'),
    ('Travel', 'For highly motivated players seeking advanced education and skill development, with competitive challenges, travel and exposure to scouts.'),
]
CARET = '<svg class="caret" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 4.5L6 8l3.5-3.5"/></svg>'


def drop(label, href, items):
    kids = ''.join('<a href="%s">%s</a>' % (h, l) for l, h in items)
    return '<div class="navdrop"><a class="nav" href="%s">%s%s</a><div class="dropmenu">%s</div></div>' % (href, label, CARET, kids)


src = io.open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
head, rest = src.split('<header class="site-header">', 1)
foot = '<footer class="site-footer">' + rest.split('<footer class="site-footer">', 1)[1]

# Head: the club's own title and description; shared files are addressed from the top of the site
head = head.replace('<title>Dnamo Football Foundation</title>', '<title>Dnamo Football Club</title>')
a = head.index('<meta name="description"')
b = head.index('>', a) + 1
head = head[:a] + '<meta name="description" content="Dnamo Football Club is a San Francisco youth soccer club with programs for every level, from Microsoccer to Travel teams.">' + head[b:]
for name in ('logo.png', 'styles.css'):
    head = head.replace('href="%s"' % name, 'href="/%s"' % name)
head = head.replace('src="logo.png"', 'src="/logo.png"')

# Footer: the club's links and social pages
a = foot.index('<nav class="foot-links"')
b = foot.index('</nav>', a)
links = [('Home', './'), ('About us', FC + '/about'), ('Programs', FC + '/programs'), ('Camps', FC + '/camps'), ('Dnamo Academy', ACADEMY),
         ('Team Store', STORE), ('Contact us', FC + '/contact'), ('Terms &amp; Conditions', FC + '/terms-and-conditions'), ('Privacy Policy', FC + '/privacy-policy')]
foot = foot[:a] + '<nav class="foot-links" aria-label="Footer">' + ''.join('<a class="nav" href="%s">%s</a>' % (h, l) for l, h in links) + foot[b:]
a = foot.index('<p class="legal">')
b = foot.index('</p>', a)
foot = foot[:a] + '<p class="legal">' + foot[b:]
foot = foot.replace('&copy; Dnamo Football Foundation', '&copy; 2026 Dnamo Football Club')
foot = foot.replace('https://www.linkedin.com/company/dnamoacademy', 'https://www.linkedin.com/company/dnamo-fc/')
foot = foot.replace('https://www.instagram.com/dnamoacademy/', 'https://www.instagram.com/dnamofc')
foot = foot.replace('src="script.js"', 'src="/script.js"')
assert 'dnamoacademy"' not in foot and 'Foundation' not in foot, 'footer still names the Foundation'

cards = ''.join(
    '    <a class="card d" href="%s/programs"><span class="num">%02d</span><h3 class="h">%s</h3><p>%s</p>'
    '<span class="more">Explore more <span class="arr" aria-hidden="true">&rarr;</span></span></a>\n' % (FC, i + 1, t, p)
    for i, (t, p) in enumerate(LEVELS))

body = """<header class="site-header">
  <div class="w">
    <a class="nav brand" href="./">Dnamo <span>Football Club</span></a>
    <button class="nav burger" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
    <nav class="navbox" id="site-nav" aria-label="Main">
      <a class="nav on" href="./" aria-current="page">Home</a>
      <a class="nav" href="{FC}/tryouts">Tryouts</a>
      {about}
      {programs}
      {camps}
      <a class="nav" href="{ACADEMY}">Dnamo Academy</a>
      <a class="nav" href="{STORE}">Team Store</a>
      <a class="btn" href="{FC}/contact">Contact us</a>
    </nav>
  </div>
</header>

<main>
<section class="dark">
  <div class="hero2">
    <!-- Hero slideshow: the photos cross-fade in turn (script.js). More can be added in the admin; a video link there replaces them. -->
    <div class="heromedia" role="img" aria-label="Dnamo players and coaches training on pitches in San Francisco">
      <img data-slot="hero1" src="/hero-1.jpg" alt="" fetchpriority="high">
      <img data-slot="hero2" src="/hero-2.jpg" alt="">
      <img data-slot="hero3" src="/hero-3.jpg" alt="">
      <img data-slot="hero4" src="/hero-4.jpg" alt="">
    </div>
    <div class="herotx">
      <p class="kicker" data-t="home.kicker">2026 Season &middot; San Francisco</p>
      <h1 class="h" data-t="home.headline">Dnamo Football Club</h1>
      <p class="intro" data-t="home.intro">We believe that soccer is more than just a game. It's a way of life.</p>
      <div class="row-wrap g16"><a class="btn" data-link="home.button1" href="{FC}/programs">Explore programs</a><a class="btn o" data-link="home.button2" href="{FC}/camps">Camps</a></div>
    </div>
    <span class="herocue" aria-hidden="true"></span>
  </div>
</section>

<!-- Decorative ticker of the club's programs; hidden from screen readers -->
<div class="marquee" aria-hidden="true"><div class="mq-track" data-list="club.ticker">{ticker}</div></div>

<!-- Upcoming event: can be switched off in the admin -->
<section class="w pad-l" id="event">
  <div class="event">
    <div>
      <p class="eyebrow" data-t="home.eventEyebrow">Upcoming event</p>
      <h2 class="h" data-t="home.eventTitle">Thanksgiving Camp</h2>
      <div class="prose" data-p="home.eventText">
        <p>Our Thanksgiving Soccer Camp keeps players active and engaged during the holiday break with fun, high-energy drills and small-sided games. Led by professional coaches, players develop their technical skills and tactical understanding while staying sharp for the season ahead.</p>
      </div>
      <a class="btn" data-link="home.eventButton" href="https://dnamofc.byga.net/programs/hj15224m1v/signup">Register now</a>
    </div>
    <img data-slot="event" src="/hero-2.jpg" alt="Players at a Dnamo camp" width="2000" height="1125" loading="lazy">
  </div>
</section>

<section class="dark">
  <div class="w pad-l">
    <p class="eyebrow" data-t="home.levelsEyebrow">Our club levels</p>
    <h2 class="h" data-t="home.levelsTitle">Choose your path</h2>
    <div class="levels-intro" data-p="home.levelsIntro">
      <p>Dnamo FC is committed to nurturing every player's individual growth while teaching the value of teamwork, accountability, and resilience. We provide an age-appropriate curriculum emphasizing technical skills and the joy of play, fostering a lifelong passion for soccer in every child.</p>
    </div>
    <div class="grid four" data-list="club.levels">
{cards}    </div>
  </div>
</section>
<section class="band">
  <div class="w">
    <h2 class="h" data-t="home.joinTitle">Ready to join Dnamo FC?</h2>
    <p data-t="home.joinText">We are always looking to connect with passionate players, families and coaches committed to development and a positive environment.</p>
    <a class="btn" data-link="home.joinButton" href="{FC}/contact">Contact us</a>
  </div>
</section>
</main>

""".format(
    FC=FC, ACADEMY=ACADEMY, STORE=STORE, cards=cards,
    about=drop('About Us', FC + '/about', [(l, FC + h) for l, h in ABOUT]),
    programs=drop('Programs', FC + '/programs', [(p, FC + '/programs') for p in PROGRAMS]),
    camps=drop('Camps', FC + '/camps', [(c, FC + '/camps') for c in CAMPS]),
    ticker=''.join('<span>%s</span>' % p for p in PROGRAMS) * 2)

os.makedirs(os.path.join(ROOT, 'fc'), exist_ok=True)
io.open(os.path.join(ROOT, 'fc', 'index.html'), 'w', encoding='utf-8', newline='\n').write(head + body + foot)
print('wrote public/fc/index.html')
