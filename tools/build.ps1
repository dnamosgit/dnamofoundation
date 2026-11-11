# Builds the public pages. Run: powershell -NoProfile -ExecutionPolicy Bypass -File tools\build.ps1
# Keep this file ASCII-only (Windows PowerShell 5.1 reads it as ANSI).
$out = Join-Path (Split-Path $PSScriptRoot -Parent) 'public'
$enc = New-Object System.Text.UTF8Encoding($false)
$legal = 'The Dnamo Football Academy Foundation has a nonprofit tax exempt status with the IRS (EIN 39-2786889).'

$navItems = @(
  @('Home','/','home'),
  @('Board of Directors','board.html','board'),
  @('Our Initiatives','initiatives.html','inits'),
  @('Testimonials','testimonials.html','tests'),
  @('Contact Us','contact.html','contact')
)

$inits = @(
  @{ id='schol'; file='scholarships.html'; num='01'; title='Scholarships'; lead='Sponsor a player so cost never keeps a child off the field.';
     photo='hero-3.jpg'; alt='A Dnamo coach with a huddle of young players' },
  @{ id='coach'; file='coaches.html'; num='02'; title='Coach Recruitment &amp; Support'; lead='Back the coaches who teach, mentor and show up for every player.';
     photo='hero-2.jpg'; alt='A Dnamo coach talking with players at training' },
  @{ id='club'; file='clubhouse.html'; num='03'; title='Club House &amp; Field'; lead='Help Dnamo find a home: a club house and fields of our own.';
     photo='hero-4.jpg'; alt='A young goalkeeper catching a ball at training' }
)

# Club House / Field fund tracker. Set both numbers (whole dollars) to switch the tracker on.
$clubRaised = 0
$clubGoal = 0

# Giving options. Each one links to the donate page with the fund, gift and amount preselected.
function Chip($fund, $opt, $amt, $label) {
  $q = "fund=$fund"
  if ($opt) { $q += "&amp;opt=$opt" }
  if ($amt) { $q += "&amp;amt=$amt" }
  "<a class=`"sub`" href=`"donate.html?$q`">$label</a>"
}
function Tier($price, $title, $desc, $chips) {
  "    <div class=`"card d static tier`"><span class=`"price`">$price</span><h3 class=`"h`">$title</h3><p>$desc</p><div class=`"row-wrap`">$chips</div></div>`r`n"
}
function Chips4($fund, $opt) {
  $c = ''
  foreach ($a in @(50,100,250,500)) { $c += (Chip $fund $opt $a ('$' + $a)) }
  $c
}
function CoachChips($opt) {
  (Chip 'coach' $opt 1000 '$1,000') + (Chip 'coach' $opt 2500 '$2,500') + (Chip 'coach' $opt 5000 '$5,000') + (Chip 'coach' $opt 'other' 'Other')
}

$intro = @{}
$more = @{}

$intro['schol'] = @'
    <div class="prose mb32" data-p="inits.schol.intro">
      <p>A scholarship covers what a family cannot, so a player can train, compete and travel with their team. Choose a full sponsorship, a monthly gift or help with tournament costs.</p>
    </div>
'@
$tiers  = Tier '$5,000' 'Sponsor a player for the year' 'Includes all fees and kit requirements for one player.' (Chip 'schol' 'year' '' 'Give $5,000')
$tiers += Tier '$2,500' 'Seasonal sponsorship' 'Sponsor one player for a season.' (Chip 'schol' 'season' '' 'Give $2,500')
$tiers += Tier '$10,000' 'Multiyear sponsorship' 'Sponsor one player for two years.' (Chip 'schol' 'two' '' 'Give $10,000')
$tiers += Tier 'Monthly' 'Sponsor a player per month' 'A smaller amount each month. Comes with a thank-you letter written by a player.' (Chips4 'schol' 'monthly')
$tiers += Tier 'Tournaments' 'Tournament scholarship' 'Covers travel expenses, tournament fees and lodging.' (Chips4 'schol' 'tourn')
$more['schol'] = @'
<section class="dark">
  <div class="w pad-l">
    <p class="eyebrow">Ways to give</p>
    <h2 class="h mb48">Sponsor a player</h2>
    <div class="grid" data-list="tiers.schol">
{{TIERS}}
    </div>
  </div>
</section>

<section class="w pad-l">
  <p class="eyebrow">Our own commitment</p>
  <h2 class="h">What Dnamo has contributed</h2>
  <p class="lead" data-t="inits.contribLead">Dnamo funds scholarships for its own players every year. These are the totals for the last three years.</p>
  <!-- TODO: fill in the three yearly totals and the three-year total -->
  <div class="grid" data-list="inits.contrib">
    <div class="card static"><span class="price">[TOTAL]</span><h3 class="h">[YEAR 1]</h3><p>Scholarships funded by Dnamo</p></div>
    <div class="card static"><span class="price">[TOTAL]</span><h3 class="h">[YEAR 2]</h3><p>Scholarships funded by Dnamo</p></div>
    <div class="card static"><span class="price">[TOTAL]</span><h3 class="h">[YEAR 3]</h3><p>Scholarships funded by Dnamo</p></div>
    <div class="card static"><span class="price">[TOTAL]</span><h3 class="h">Three-year total</h3><p>Given by Dnamo to its players</p></div>
  </div>
</section>
'@.Replace('{{TIERS}}', $tiers.TrimEnd())

$intro['coach'] = @'
    <div class="prose mb32" data-p="inits.coach.intro">
      <p>Our coaches do this because they believe in the mission. They are all young and have day jobs. They are here for the passion of the sport and the relationships they have with the players.</p>
      <p>Each coach connects with their players and is a consistent source of support, advice and mentorship. Many coaches help with carpools, school problems and social issues when parents ask for help.</p>
      <p>As players mature, coaches can be a safe place to ask for help.</p>
    </div>
'@
$tiers  = Tier 'Education' 'Coach Development Fund' 'Contributes to coaching education programs and licensing.' (CoachChips 'dev')
$tiers += Tier 'Support' 'The Coaches Fund' 'Helps cover the cost of travel, specialty equipment and leadership seminars.' (CoachChips 'fund')
$more['coach'] = @'
<section class="dark">
  <div class="w pad-l">
    <p class="eyebrow">Ways to give</p>
    <h2 class="h mb48">Two funds for our coaches</h2>
    <div class="grid" data-list="tiers.coach">
{{TIERS}}
    </div>
  </div>
</section>
'@.Replace('{{TIERS}}', $tiers.TrimEnd())

$intro['club'] = @'
    <div class="prose mb32" data-p="inits.club.intro">
      <p>We are looking for a home. We believe we have created a community, and we are now looking for a multi-field space that can act as a home away from home.</p>
      <p>Dnamo FC is here to stay. Now let&rsquo;s put a <strong>stake in the ground</strong>!</p>
    </div>
    <ul class="goals" data-list="inits.club.goals"><li>The Club House will be a place for players to study, come together and interact with other age groups.</li><li>One fund covers both the Club House and the fields.</li></ul>
'@
$pct = 0; $raisedTx = '[AMOUNT RAISED]'; $goalTx = '[GOAL]'
if ($clubGoal -gt 0) {
  $pct = [Math]::Min(100, [Math]::Round(100 * $clubRaised / $clubGoal))
  $raisedTx = '$' + ('{0:N0}' -f $clubRaised); $goalTx = '$' + ('{0:N0}' -f $clubGoal)
}
$more['club'] = @'
<section class="dark">
  <div class="w pad-l">
    <p class="eyebrow">Fund tracker</p>
    <h2 class="h mb48">How close we are to home</h2>
    <!-- TODO: set clubRaised and clubGoal in the build script (or edit the numbers and the width here) once the goal is agreed -->
    <div data-list="inits.club.thermo">
    <div class="fund"><div class="fund-top"><span class="fund-pct">{{PCT}}%</span><span><strong>{{RAISED}}</strong> raised</span><span class="fund-goal">Goal: <strong>{{GOAL}}</strong></span></div><div class="fund-bar" role="progressbar" aria-label="Club House and Field fund" aria-valuemin="0" aria-valuemax="100" aria-valuenow="{{PCT}}"><span style="width:{{PCT}}%"></span></div></div>
    </div>
    <a class="btn" href="donate.html?fund=club">Give to the Club House &amp; Field fund</a>
    <div class="cta-row"><p data-t="inits.club.matchText">Would you or your company match gifts to this fund? We would love to hear from you.</p><a class="btn s" href="contact.html?topic=match">Match a gift</a></div>
  </div>
</section>
'@.Replace('{{PCT}}', "$pct").Replace('{{RAISED}}', $raisedTx).Replace('{{GOAL}}', $goalTx)

$template = @'
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{{TITLE}}</title>
<meta name="description" content="{{DESC}}">
<meta name="theme-color" content="#ffffff">
<!-- Browser tab icon and phone home-screen icon -->
<link rel="icon" type="image/png" href="logo.png">
<link rel="apple-touch-icon" href="logo.png">
<link rel="preload" as="image" href="logo.png">
<script>try{if(localStorage.getItem('dnamoTheme')==='dark')document.documentElement.setAttribute('data-theme','dark')}catch(e){}
try{if(sessionStorage.getItem('dnamoSplash'))document.documentElement.className='no-splash'}catch(e){}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="styles.css">
</head>
<body{{BODYCLASS}}>
<!-- Logo splash: phones and tablets only, once per visit (see styles.css and script.js) -->
<div class="splash" aria-hidden="true"><img data-slot="logo" src="logo.png" alt="" width="447" height="447"></div>
<div class="prog"></div>

<header class="site-header{{SOLID}}">
  <div class="w">
    <a class="nav brand" href="/">Dnamo <span>Football Foundation</span></a>
    <button class="nav burger" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
    <nav class="navbox" id="site-nav" aria-label="Main">
{{NAV}}
      <a class="btn" href="donate.html">Donate</a>
    </nav>
  </div>
</header>

<main>
{{MAIN}}
{{BAND}}
</main>

<footer class="site-footer">
  <div class="w foot">
    <!-- Footer row 1: page links on the left, light / dark switch on the right -->
    <div class="foot-top">
      <nav class="foot-links" aria-label="Footer">
{{FOOTNAV}}
        <a class="nav" href="donate.html">Donate</a>
      </nav>
      <button class="theme-toggle" type="button" role="switch" aria-checked="false" aria-label="Dark mode" title="Light / dark mode"><span class="tt-track" aria-hidden="true"><span class="tt-knob"><svg class="tt-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg><svg class="tt-moon" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg></span></span></button>
    </div>
    <!-- Footer row 2: legal line on the left, copyright on the right -->
    <div class="foot-base">
      <p class="legal">{{LEGAL}}</p>
      <span>&copy; Dnamo Football Foundation</span>
    </div>
<!-- Social icons: float at the right edge on tablet and desktop, sit here in the footer on phones. -->
<div class="soc">
  <a href="https://www.linkedin.com/company/dnamoacademy" aria-label="Dnamo on LinkedIn"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg></a>
  <a href="https://www.instagram.com/dnamoacademy/" aria-label="Dnamo on Instagram"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg></a>
</div>
  </div>
</footer>

<script src="script.js"></script>
</body>
</html>
'@

function Page($file, $title, $desc, $key, $main, $band, $fund) {
  $nav = ''; $foot = ''
  foreach ($n in $navItems) {
    $cls = 'nav'; $cur = ''
    if ($n[2] -eq $key) { $cls = 'nav on'; $cur = ' aria-current="page"' }
    if ($n[2] -eq 'inits') {
      # Our Initiatives: the link still opens the overview; the panel lists each initiative.
      if ($file -ne $n[1]) { $cur = '' }
      $caret = '<svg class="caret" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 4.5L6 8l3.5-3.5"/></svg>'
      $nav += "      <div class=`"navdrop`">`r`n        <a class=`"$cls`" href=`"$($n[1])`"$cur>$($n[0])$caret</a>`r`n        <div class=`"dropmenu`">`r`n"
      $drop = @()
      foreach ($i in $inits) { $drop += ,@($i.title, $i.file) }
      $drop += ,@('Kit Sponsorship','initiatives.html#kit')
      foreach ($d in $drop) {
        $dc = ''
        if ($d[1] -eq $file) { $dc = ' class="on" aria-current="page"' }
        $nav += "          <a href=`"$($d[1])`"$dc>$($d[0])</a>`r`n"
      }
      $nav += "        </div>`r`n      </div>`r`n"
    } else {
      $nav  += "      <a class=`"$cls`" href=`"$($n[1])`"$cur>$($n[0])</a>`r`n"
    }
    $foot += "      <a class=`"nav`" href=`"$($n[1])`">$($n[0])</a>`r`n"
  }
  $bandHtml = ''
  if ($band -ne 'none') {
    $bc = 'band'; if ($band -eq 'dark') { $bc = 'band dk' }
    $href = 'donate.html'; if ($fund) { $href = "donate.html?fund=$fund" }
    $bandHtml = @"
<section class="$bc">
  <div class="w">
    <h2 class="h">No child turned away.</h2>
    <p>Your gift funds scholarships, coaching and safe fields for young players.</p>
    <a class="btn" href="$href">Donate now</a>
  </div>
</section>
"@
  }
  $bodyClass = ''; $solid = ' solid'
  if ($key -eq 'home') { $bodyClass = ' class="home"'; $solid = '' }
  $fullTitle = 'Dnamo Football Foundation'
  if ($title) { $fullTitle = "$title | Dnamo Football Foundation" }
  $html = $template.Replace('{{TITLE}}', $fullTitle).Replace('{{DESC}}', $desc).Replace('{{BODYCLASS}}', $bodyClass).Replace('{{SOLID}}', $solid).Replace('{{NAV}}', $nav.TrimEnd()).Replace('{{FOOTNAV}}', $foot.TrimEnd()).Replace('{{MAIN}}', $main.Trim()).Replace('{{BAND}}', $bandHtml).Replace('{{LEGAL}}', $legal)
  [IO.File]::WriteAllText((Join-Path $out $file), $html, $enc)
}

function InitCards($extra) {
  $s = ''
  foreach ($i in $inits) {
    $s += "    <a class=`"card$extra`" href=`"$($i.file)`"><span class=`"num`">$($i.num)</span><h3 class=`"h`" data-t=`"inits.$($i.id).title`">$($i.title)</h3><p data-t=`"inits.$($i.id).lead`">$($i.lead)</p><span class=`"more`">Learn more <span class=`"arr`" aria-hidden=`"true`">&rarr;</span></span></a>`r`n"
  }
  $s.TrimEnd()
}

function Subnav($activeFile) {
  $items = @(,@('Overview','initiatives.html'))
  foreach ($i in $inits) { $items += ,@($i.title, $i.file, " data-t=`"inits.$($i.id).title`"") }
  $items += ,@('Kit Sponsorship','initiatives.html#kit')
  $s = ''
  foreach ($it in $items) {
    $cls = 'sub'; $cur = ''
    if ($it[1] -eq $activeFile) { $cls = 'sub on'; $cur = ' aria-current="page"' }
    $s += "    <a class=`"$cls`" href=`"$($it[1])`"$cur$($it[2])>$($it[0])</a>`r`n"
  }
  @"
<section class="w pad-sub">
  <p class="eyebrow">Our initiatives</p>
  <nav class="row-wrap g12" aria-label="Initiatives">
$($s.TrimEnd())
  </nav>
</section>
"@
}

# ---------- Home ----------
$mq = ''
foreach ($v in @('Teamwork','Perseverance','Sportsmanship','Technical mastery','Tactical awareness','Love for the game','Confidence','Leadership')) { $mq += "<span>$v</span>" }
$main = @"
<section class="dark">
  <div class="hero2">
    <!-- Hero slideshow: four photos that cross-fade (see .heromedia in styles.css). A video link set in the admin replaces it. -->
    <div class="heromedia" role="img" aria-label="Dnamo players and coaches training on pitches in San Francisco">
      <img data-slot="hero1" src="hero-1.jpg" alt="" fetchpriority="high">
      <img data-slot="hero2" src="hero-2.jpg" alt="">
      <img data-slot="hero3" src="hero-3.jpg" alt="">
      <img data-slot="hero4" src="hero-4.jpg" alt="">
    </div>
    <div class="herotx">
      <p class="kicker" data-t="home.kicker">An offshoot of Dnamo Football Club</p>
      <h1 class="h" data-t="home.headline">Where talent meets possibility.</h1>
      <p class="intro" data-t="home.intro">Youth of all backgrounds deserve high-quality soccer training, development and facilities.</p>
      <div class="row-wrap g16"><a class="btn" data-link="home.button1" href="donate.html">Support a player</a><a class="btn o" data-link="home.button2" href="initiatives.html">Our initiatives</a></div>
    </div>
    <span class="herocue" aria-hidden="true"></span>
  </div>
</section>

<!-- Decorative ticker of the values named in the mission text; hidden from screen readers -->
<div class="marquee" aria-hidden="true"><div class="mq-track" data-list="home.values">$mq$mq</div></div>

<section class="w split pad-l">
  <div><p class="eyebrow" data-t="home.missionEyebrow">Our mission</p><h2 class="h" data-t="home.missionTitle">Soccer excellence, on and off the pitch.</h2>
    <img class="mission-img" data-slot="mission" src="hero-3.jpg" alt="Dnamo players and a coach at training" width="2000" height="1125" loading="lazy"></div>
  <div class="prose" data-p="home.mission">
    <p>Dnamo Football Academy Foundation, founded in 2025, is a nonprofit organization dedicated to providing youth of all backgrounds with access to high-quality soccer training, development, and facilities. We are an offshoot of Dnamo Football Club.</p>
    <p>Our mission is to deliver soccer excellence on and off the pitch by developing not only skilled athletes but also disciplined, respectful, and motivated individuals. Soccer excellence means fostering technical mastery, tactical awareness, and a genuine love for the game while promoting teamwork, perseverance, and sportsmanship.</p>
    <p>We are committed to breaking down financial and social barriers by offering affordable programs, scholarships, and community-based initiatives. Through creating access to quality training environments and fields, we give our players a safe and consistent environment where they can connect and grow as individuals.</p>
    <p>Beyond athletic training, we emphasize academic support and leadership development to help young athletes build confidence, pursue higher education, and make a lasting positive impact in their communities.</p>
  </div>
</section>

<section class="dark">
  <div class="w pad-l">
    <p class="eyebrow" data-t="home.initsEyebrow">Our initiatives</p>
    <h2 class="h mb48" data-t="home.initsTitle">Three ways we open the game</h2>
    <div class="grid">
$(InitCards ' d')
    </div>
  </div>
</section>
"@
Page 'index.html' '' 'Dnamo Football Foundation is a San Francisco nonprofit giving youth of all backgrounds access to high-quality soccer training, development and facilities.' 'home' $main 'light' ''

# ---------- Board ----------
# Copied from https://www.dnamoacademy.org/board-members
$board = @(
  @{ name='Elizabeth Estrada'; role='Director'; photo='board-elizabeth-estrada.jpg';
     bio='Ellie''s lifelong love for soccer opened doors that changed the course of her life. Her dedication and talent on the field earned her the opportunity to play at the collegiate level, where the sport not only fueled her passion but helped pay for her education. Grateful for the doors soccer opened, Ellie is committed to helping the next generation of players access the same opportunities. Leveraging her experiences as both a student-athlete and mentor, she works to ensure that programs at Dnamo Football Academy Foundation provide meaningful opportunities for growth. Her efforts support Dnamo''s mission to empower young athletes, strengthen families, and give back to the community through soccer.' },
  @{ name='Ika Kvavilashvili'; role='Director'; photo='board-ika-kvavilashvili.jpg';
     bio='Ika Kvavilashvili founded Dnamo FC to create opportunities for every child to experience the mentorship, discipline, and joy that shaped his own soccer journey. What began as a small local club has grown into a community built on passion, inclusivity, and the belief that soccer can change lives. With international playing and coaching experience across Georgia, the United States, and Europe, Ika brings a global perspective and a deep understanding of what it takes to develop both great players and great people. His vision extends far beyond the field. He sees soccer as a powerful tool to inspire confidence, build leadership, and unite diverse communities through shared purpose.&#10;&#10;Through the Dnamo Football Academy Foundation, Ika continues his lifelong mission to break down barriers and open doors for young athletes. His commitment is to ensure that every child, regardless of background, has the opportunity to learn, grow, and find belonging through the beautiful game.' },
  @{ name='Paulo Romero'; role='Director'; photo='board-paulo-romero.jpg';
     bio='Paulo''s competitive soccer background as a player and coach instilled discipline, teamwork, and leadership that continue at Dnamo Football Academy. Leveraging leadership experience as a Chief Information Officer, he helps ensure programs run smoothly and resources are used effectively. His efforts support Dnamo''s mission to empower young athletes and strengthen the community through soccer.' }
)
$cards = ''
foreach ($d in $board) {
  $cards += "    <button class=`"dir`" type=`"button`" aria-expanded=`"false`" aria-controls=`"profile`" data-name=`"$($d.name)`" data-role=`"$($d.role)`" data-bio=`"$($d.bio)`"><img src=`"$($d.photo)`" alt=`"`" width=`"120`" height=`"120`" loading=`"lazy`"><span class=`"h`">$($d.name)</span><span class=`"red`">$($d.role)</span></button>`r`n"
}
$main = @"
<section class="w pad">
  <p class="eyebrow">Leadership</p>
  <h1 class="h">Board of Directors</h1>
  <p class="lead" data-t="board.intro">Our Board of Directors is made up of caring community members who believe in the power of sports to bring kids together. They guide our mission with heart and commitment, ensuring every child has the opportunity to learn, grow, and thrive. Select a director to read their profile.</p>
  <div class="grid" data-list="board.members">
$($cards.TrimEnd())
  </div>
  <div class="profile" id="profile" hidden aria-live="polite">
    <button class="pclose" type="button" aria-label="Close profile" title="Close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    <h2 class="h pname"></h2>
    <p class="prole"></p>
    <p class="pbio"></p>
  </div>
  <div class="cta-row"><p data-t="board.cta">Interested in serving or partnering with us?</p><a class="btn s" href="contact.html">Contact us</a></div>
</section>
"@
Page 'board.html' 'Board of Directors' 'Meet the board of directors guiding Dnamo Football Foundation.' 'board' $main 'dark' ''

# ---------- Initiatives overview ----------
$main = @"
$(Subnav 'initiatives.html')
<section class="w pad-after-sub">
  <h1 class="h" data-t="inits.overviewTitle">Three ways we open the game</h1>
  <p class="lead" data-t="inits.overviewLead">Each initiative has its own page and its own ways to give.</p>
  <div class="grid tray">
$(InitCards '')
  </div>
</section>
"@
$main += @'

<section class="dark" id="kit">
  <div class="w pad-l">
    <p class="eyebrow">For businesses</p>
    <h2 class="h">Kit sponsorship</h2>
    <p class="lead" data-t="inits.kitLead">Put your logo on the kit worn by the 900 kids in our club. Each sponsorship runs for a two-year term, in line with our kit renewal policy.</p>
    <div class="grid" data-list="inits.kit">
      <div class="card d static"><span class="price">$20,000</span><h3 class="h">Chest logo</h3><p>Two-year term</p></div>
      <div class="card d static"><span class="price">$15,000</span><h3 class="h">Backpack logo</h3><p>Two-year term</p></div>
      <div class="card d static"><span class="price">$10,000</span><h3 class="h">Arm logo</h3><p>Two-year term</p></div>
    </div>
    <div class="mt48"><a class="btn" href="contact.html?topic=kit">Ask about kit sponsorship</a></div>
  </div>
</section>
'@
Page 'initiatives.html' 'Our Initiatives' 'Scholarships, coach support, a club house and fields, and kit sponsorship: how to back Dnamo Football Foundation.' 'inits' $main 'dark' ''

# ---------- Initiative pages ----------
foreach ($i in $inits) {
  $main = @"
$(Subnav $i.file)
<section class="w split2 pad-after-sub">
  <div>
    <h1 class="h init-title" data-t="inits.$($i.id).title">$($i.title)</h1>
    <p class="init-lead" data-t="inits.$($i.id).lead">$($i.lead)</p>
$($intro[$i.id].TrimEnd())
    <a class="btn" href="donate.html?fund=$($i.id)">Donate to <span data-t="inits.$($i.id).title">$($i.title)</span></a>
  </div>
  <img class="shot" data-slot="init-$($i.id)" src="$($i.photo)" alt="$($i.alt)" width="2000" height="1125" loading="lazy">
</section>

$($more[$i.id])
"@
  $plain = $i.title.Replace('&amp;', 'and')
  Page $i.file $i.title "$plain at Dnamo Football Foundation. $($i.lead)" 'inits' $main 'dark' $i.id
}

# ---------- Testimonials ----------
$cards = ''
foreach ($n in 1..3) {
  $cards += "    <figure class=`"card static`" style=`"margin:0`"><blockquote style=`"margin:0`"><p class=`"quote`">[TESTIMONIAL ${n}: a sentence or two about the experience.]</p></blockquote><figcaption><div class=`"h who`">[NAME]</div><div class=`"red`">[PLAYER / PARENT / COACH / PARTNER]</div></figcaption></figure>`r`n"
}
$main = @"
<section class="w pad">
  <p class="eyebrow">Testimonials</p>
  <h1 class="h" data-t="testimonials.title">In their words</h1>
  <p class="lead" data-t="testimonials.intro">Players, parents, coaches and partners on what Dnamo means to them.</p>
  <!-- TODO: real testimonials -->
  <div class="grid tray" data-list="testimonials.items">
$($cards.TrimEnd())
  </div>
  <div class="mt48"><a class="btn s" href="contact.html">Share your story</a></div>
</section>
"@
Page 'testimonials.html' 'Testimonials' 'Players, parents, coaches and partners on what Dnamo Football Foundation means to them.' 'tests' $main 'dark' ''

# ---------- Contact ----------
$main = @'
<section class="w pad">
  <p class="eyebrow">Contact us</p>
  <h1 class="h">Let&rsquo;s talk</h1>
  <p class="lead l48">Questions about programs, scholarships, partnerships or volunteering? Send us a note and we&rsquo;ll get back to you.</p>
  <div class="split2 contact">
    <!-- No backend: script.js turns this into a mailto link that opens the visitor's email app -->
    <form id="contact-form" action="mailto:impact@dnamoacademy.com" method="post" enctype="text/plain">
      <span class="lab" id="topic-lab">What is this about?</span>
      <div class="row-wrap mb32" role="group" aria-labelledby="topic-lab">
        <button class="sub on" type="button" data-topic="General question" aria-pressed="true">General question</button>
        <button class="sub" type="button" data-topic="Partnership" aria-pressed="false">Partnership</button>
        <button class="sub" type="button" data-topic="Kit sponsorship" data-key="kit" aria-pressed="false">Kit sponsorship</button>
        <button class="sub" type="button" data-topic="Gift matching" data-key="match" aria-pressed="false">Gift matching</button>
        <button class="sub" type="button" data-topic="Volunteering" aria-pressed="false">Volunteering</button>
        <button class="sub" type="button" data-topic="Scholarships" aria-pressed="false">Scholarships</button>
      </div>
      <label class="lab" for="cn">Name</label><input class="field" id="cn" name="name" autocomplete="name">
      <label class="lab" for="ce">Email</label><input class="field" id="ce" name="email" type="email" autocomplete="email">
      <label class="lab" for="cm">Message</label><textarea class="field" id="cm" name="message" rows="6"></textarea>
      <button class="btn" type="submit">Send message</button>
      <p class="form-note" id="form-note" role="status" hidden>Opening your email app. If nothing happens, write to us at impact@dnamoacademy.com.</p>
    </form>
    <div class="sum reach">
      <h2 class="h">Reach us directly</h2>
      <div class="row"><span>Email</span><a href="mailto:impact@dnamoacademy.com">impact@dnamoacademy.com</a></div>
      <div class="row"><span>Location</span><span>San Francisco, California</span></div>
      <div class="row"><span>Follow</span><span><a href="https://www.linkedin.com/company/dnamoacademy">LinkedIn</a> &middot; <a href="https://www.instagram.com/dnamoacademy/">Instagram</a></span></div>
      <p class="note">Prefer to give? Your support keeps young players on the field.</p>
      <a class="btn s" href="donate.html">Donate</a>
    </div>
  </div>
</section>
'@
Page 'contact.html' 'Contact Us' 'Get in touch with Dnamo Football Foundation about programs, scholarships, partnerships or volunteering.' 'contact' $main 'dark' ''

# ---------- Donate ----------
$fundCards = "        <button class=`"card on`" type=`"button`" data-fund=`"general`" data-amts=`"25,50,100,250`" data-def=`"50`" aria-pressed=`"true`"><span class=`"h ft`">Where it is needed most</span><span class=`"dsc`">Flexible support across all three initiatives.</span></button>`r`n"
foreach ($i in $inits) {
  $amts = ''
  if ($i.id -eq 'club') { $amts = ' data-amts="50,100,250,500" data-def="100"' }
  $fundCards += "        <button class=`"card`" type=`"button`" data-fund=`"$($i.id)`"$amts aria-pressed=`"false`"><span class=`"h ft`" data-t=`"inits.$($i.id).title`">$($i.title)</span><span class=`"dsc`" data-t=`"inits.$($i.id).lead`">$($i.lead)</span></button>`r`n"
}
# Gifts within a fund. data-amts lists the amounts; a single amount is a fixed price.
$optGroups = @'
        <div class="row-wrap mb48" role="group" aria-labelledby="opt-lab" data-opts="schol" hidden>
          <button class="sub" type="button" data-opt="year" data-label="Sponsor a player for the year" data-amts="5000" aria-pressed="false">Player for the year</button>
          <button class="sub" type="button" data-opt="season" data-label="Seasonal sponsorship" data-amts="2500" aria-pressed="false">One season</button>
          <button class="sub" type="button" data-opt="two" data-label="Multiyear sponsorship (two years)" data-amts="10000" aria-pressed="false">Two years</button>
          <button class="sub" type="button" data-opt="monthly" data-label="Sponsor a player per month" data-amts="50,100,250,500" data-per="month" data-fixed="1" aria-pressed="false">Monthly</button>
          <button class="sub" type="button" data-opt="tourn" data-label="Tournament scholarship" data-amts="50,100,250,500" data-fixed="1" aria-pressed="false">Tournament</button>
        </div>
        <div class="row-wrap mb48" role="group" aria-labelledby="opt-lab" data-opts="coach" hidden>
          <button class="sub" type="button" data-opt="dev" data-label="Coach Development Fund" data-amts="1000,2500,5000" aria-pressed="false">Coach Development Fund</button>
          <button class="sub" type="button" data-opt="fund" data-label="The Coaches Fund" data-amts="1000,2500,5000" aria-pressed="false">The Coaches Fund</button>
        </div>
'@
$main = @'
<section class="w pad" id="donate">
  <p class="eyebrow">Donate</p>
  <h1 class="h">Support a young player</h1>
  <p class="lead l48">Choose where your gift goes and how much to give.</p>
  <div class="split2">
    <div>
      <span class="lab" id="fund-lab">Where should your gift go?</span>
      <div class="grid mb48" role="group" aria-labelledby="fund-lab">
{{FUNDS}}
      </div>
      <div id="opt-step" hidden>
        <span class="lab" id="opt-lab">Choose a gift</span>
{{OPTS}}
      </div>
      <span class="lab" id="amt-lab">Choose an amount</span>
      <!-- script.js fills this with the amounts for the chosen fund or gift -->
      <div class="row-wrap mb24" id="amt-box" role="group" aria-labelledby="amt-lab"></div>
      <div id="other-wrap">
        <label class="lab" for="other-amount">Or enter another amount ($)</label>
        <input class="field short" id="other-amount" inputmode="numeric" autocomplete="off">
      </div>
    </div>
    <div class="sum" aria-live="polite">
      <h2 class="h">Your gift</h2>
      <div class="row"><span>Fund</span><span class="right" id="sum-fund">Where it is needed most</span></div>
      <div class="row" id="sum-gift-row" hidden><span>Gift</span><span class="right" id="sum-gift"></span></div>
      <div class="row"><span>Amount</span><span class="bold" id="sum-amount">$50</span></div>
      <!-- TODO: no payment provider yet. Point this at Wix donations, PayPal or Stripe. -->
      <a class="btn block" href="#">Continue to payment</a>
      <p class="fine">{{LEGAL}}</p>
    </div>
  </div>
</section>
'@
$main = $main.Replace('{{FUNDS}}', $fundCards.TrimEnd()).Replace('{{OPTS}}', $optGroups.TrimEnd())
Page 'donate.html' 'Donate' 'Support a young player. Choose a fund and an amount to give to Dnamo Football Foundation.' 'donate' $main 'none' ''

# Not-found page. Also shown for the hidden admin paths, so it must work from any URL depth:
# the <base> tag makes its stylesheet, script and links resolve from the site root.
$main = @'
<section class="w pad-l">
  <p class="eyebrow">Error 404</p>
  <h1 class="h">Page not found</h1>
  <p class="lead l48">The page you are looking for does not exist or has moved.</p>
  <div class="row-wrap g16"><a class="btn" href="/">Back to home</a><a class="btn o" href="contact.html">Contact us</a></div>
</section>
'@
Page '404.html' 'Page not found' 'Page not found.' 'none' $main 'none' ''
$nf = Join-Path $out '404.html'
$nfHtml = [IO.File]::ReadAllText($nf).Replace('<head>', "<head>`r`n<base href=`"/`">`r`n<meta name=`"robots`" content=`"noindex`">")
[IO.File]::WriteAllText($nf, $nfHtml, $enc)

Get-ChildItem $out -File | Select-Object Name, Length
