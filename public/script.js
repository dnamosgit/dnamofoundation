(function () {
  'use strict';

  /* Logo splash (phones and tablets): hold briefly once the logo has loaded, then fade out.
     Shown once per visit; later pages skip it via the inline script in <head>.
     The Club site (data-splash-key) keeps its own "seen" note, and also waits for the
     page's pictures and styles to finish loading, so the page is ready when the logo clears.
     The stylesheet fades the splash out by itself after 3 seconds whatever happens. */
  var splash = document.querySelector('.splash');
  if (splash && getComputedStyle(splash).display !== 'none') {
    var splashKey = document.documentElement.getAttribute('data-splash-key');
    try { sessionStorage.setItem(splashKey || 'dnamoSplash', '1'); } catch (e) {}
    var logo = splash.querySelector('img');
    var waits = splashKey && document.readyState !== 'complete' ? 2 : 1;
    var hideSplash = function () {
      if (--waits > 0) return;
      setTimeout(function () { splash.classList.add('done'); }, 900);
    };
    if (logo.complete) hideSplash();
    else { logo.addEventListener('load', hideSplash); logo.addEventListener('error', hideSplash); }
    if (waits > 0 && splashKey) window.addEventListener('load', hideSplash);
  }

  /* Light / dark mode. The choice is remembered on this device, per site: the Foundation
     starts light, the Club site starts dark (its pages carry data-theme-key).
     The inline script in <head> applies a saved choice before the page paints. */
  var root = document.documentElement;
  var themeBtn = document.querySelector('.theme-toggle');
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  function showTheme() {
    var dark = root.getAttribute('data-theme') === 'dark';
    themeBtn.setAttribute('aria-checked', String(dark));
    if (themeMeta) themeMeta.setAttribute('content', dark ? '#000000' : '#ffffff');
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var dark = root.getAttribute('data-theme') !== 'dark';
      if (dark) root.setAttribute('data-theme', 'dark');
      else root.removeAttribute('data-theme');
      try { localStorage.setItem(root.getAttribute('data-theme-key') || 'dnamoTheme', dark ? 'dark' : 'light'); } catch (e) {}
      showTheme();
    });
    showTheme();
  }

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover)').matches;

  /* Menu button on phones and tablets */
  var navbox = document.querySelector('.navbox');
  var burger = document.querySelector('.burger');
  burger.addEventListener('click', function () {
    var open = navbox.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
  });

  /* Blocks fade up as they scroll into view. The .reveal class is added here, so the page
     is fully visible without JavaScript. Classes are removed afterwards so hover effects
     are not slowed by the stagger delay. */
  if (!reduceMotion && 'IntersectionObserver' in window) {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        revealIO.unobserve(el);
        el.classList.add('in');
        setTimeout(function () {
          el.classList.remove('reveal', 'in');
          el.style.transitionDelay = '';
        }, 1400);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    var seen = [];
    Array.prototype.forEach.call(document.querySelectorAll(
      'main section.w > .eyebrow, main section.w > h1.h, main section.w > .lead, ' +
      '.dark > .w > .eyebrow, .dark > .w > h2.h, .grid > *, .split > *, .split2 > *, ' +
      '.goals li, .cta-row, .band .w, .sec-split > *, .club-sec > h2.h'
    ), function (el) {
      var i = seen.filter(function (p) { return p === el.parentNode; }).length;
      seen.push(el.parentNode);
      el.style.transitionDelay = Math.min(i * 90, 450) + 'ms';
      el.classList.add('reveal');
      revealIO.observe(el);
    });
  }

  /* Page banner (Club pages): the photo moves a little slower than the page */
  var banner = document.querySelector('.pagehero img');
  if (banner && !reduceMotion) {
    var drifting = false;
    var drift = function () {
      drifting = false;
      var y = window.scrollY || 0;
      if (y < banner.parentNode.offsetHeight + 80) banner.style.setProperty('--drift', Math.round(y * 0.22) + 'px');
    };
    window.addEventListener('scroll', function () {
      if (!drifting) { drifting = true; requestAnimationFrame(drift); }
    }, { passive: true });
  }

  /* Cards: a soft red glow follows the pointer */
  if (canHover) {
    document.addEventListener('pointermove', function (e) {
      var c = e.target.closest ? e.target.closest('.card, .dir') : null;
      if (!c) return;
      var r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  }

  /* Home hero slideshow: the photos take turns, cross-fading. Works for any number of photos.
     Without motion (or with a single photo) the first one simply stays. */
  var heroMedia = document.querySelector('.heromedia');
  var slides = heroMedia ? heroMedia.querySelectorAll('img[data-slot], img[data-extra]') : [];
  if (slides.length > 1 && !reduceMotion) {
    var slideNow = 0;
    slides[0].classList.add('on');
    heroMedia.classList.add('cycling');
    setInterval(function () {
      slides[slideNow].classList.remove('on');
      slideNow = (slideNow + 1) % slides.length;
      slides[slideNow].classList.add('on');
    }, 6500);
  }

  /* Home hero: the background video stays still for visitors who ask for reduced motion */
  var heroVideo = document.querySelector('.heromedia video');
  if (heroVideo && reduceMotion) {
    heroVideo.removeAttribute('autoplay');
    heroVideo.pause();
  }

  /* Back to top button, shown after scrolling down */
  var totop = document.createElement('button');
  totop.type = 'button';
  totop.className = 'totop';
  totop.setAttribute('aria-label', 'Back to top');
  totop.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  document.body.appendChild(totop);
  var syncTop = function () { totop.classList.toggle('show', window.scrollY > 600); };
  window.addEventListener('scroll', syncTop, { passive: true });
  syncTop();
  totop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  /* Board of Directors: click a card to open its profile panel */
  var profile = document.getElementById('profile');
  if (profile) {
    var dirs = Array.prototype.slice.call(document.querySelectorAll('.dir'));
    var closeProfile = function () {
      dirs.forEach(function (d) { d.classList.remove('on'); d.setAttribute('aria-expanded', 'false'); });
      profile.hidden = true;
    };
    dirs.forEach(function (d) {
      d.addEventListener('click', function () {
        var wasOpen = d.classList.contains('on');
        closeProfile();
        if (wasOpen) return;
        d.classList.add('on');
        d.setAttribute('aria-expanded', 'true');
        profile.querySelector('.pname').textContent = d.dataset.name;
        profile.querySelector('.prole').textContent = d.dataset.role;
        profile.querySelector('.pbio').textContent = d.dataset.bio;
        profile.hidden = false;
        profile.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
      });
    });
    profile.querySelector('.pclose').addEventListener('click', closeProfile);
  }

  /* Single-choice button groups (contact topics, donation funds and amounts) */
  function choose(buttons, picked) {
    buttons.forEach(function (b) {
      var on = b === picked;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }

  /* Contact: "Send message" opens the visitor's email app with the form contents */
  var form = document.getElementById('contact-form');
  if (form) {
    var topics = Array.prototype.slice.call(document.querySelectorAll('[data-topic]'));
    var topic = 'General question';
    topics.forEach(function (b) {
      b.addEventListener('click', function () { topic = b.dataset.topic; choose(topics, b); });
    });
    /* Links such as contact.html?topic=kit arrive with that topic already chosen */
    var askedTopic = new URLSearchParams(window.location.search).get('topic');
    var topicMatch = topics.filter(function (b) { return askedTopic && b.dataset.key === askedTopic; })[0];
    if (topicMatch) { topic = topicMatch.dataset.topic; choose(topics, topicMatch); }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.elements.name.value;
      var email = form.elements.email.value;
      var msg = form.elements.message.value;
      document.getElementById('form-note').hidden = false;
      window.location.href = 'mailto:impact@dnamoacademy.com?subject=' +
        encodeURIComponent('Dnamo Football Foundation: ' + topic) +
        '&body=' + encodeURIComponent(msg + '\n\n' + name + '\n' + email);
    });
  }

  /* Donate: fund, gift within the fund, amount, summary.
     Links can preselect all three: donate.html?fund=schol&opt=monthly&amt=100 */
  var donate = document.getElementById('donate');
  if (donate) {
    var funds = Array.prototype.slice.call(donate.querySelectorAll('[data-fund]'));
    var optGroups = Array.prototype.slice.call(donate.querySelectorAll('[data-opts]'));
    var optStep = document.getElementById('opt-step');
    var amtBox = document.getElementById('amt-box');
    var other = document.getElementById('other-amount');
    var otherWrap = document.getElementById('other-wrap');
    var sumFund = document.getElementById('sum-fund');
    var sumGift = document.getElementById('sum-gift');
    var sumGiftRow = document.getElementById('sum-gift-row');
    var sumAmt = document.getElementById('sum-amount');
    var opts = [];
    var amts = [];
    var amount = 0;
    var per = '';
    var money = function (n) { return '$' + Number(n).toLocaleString('en-US'); };
    var suffix = function () { return per ? ' / ' + per : ''; };

    /* The summary amount counts up or down to the new value */
    var shown = 0;
    var countFrame = 0;
    var showAmount = function () {
      var target = Number(other.value || amount);
      cancelAnimationFrame(countFrame);
      if (reduceMotion || document.hidden) {
        shown = target;
        sumAmt.textContent = money(target) + suffix();
        return;
      }
      var from = shown;
      var start = performance.now();
      var step = function (now) {
        var t = Math.min((now - start) / 350, 1);
        shown = Math.round(from + (target - from) * (1 - Math.pow(1 - t, 3)));
        sumAmt.textContent = money(shown) + suffix();
        if (t < 1) countFrame = requestAnimationFrame(step);
      };
      countFrame = requestAnimationFrame(step);
    };

    /* Build the amount buttons from the data-amts list on a fund or gift button */
    var setAmounts = function (src, want) {
      var list = src.dataset.amts.split(',').map(Number);
      per = src.dataset.per || '';
      otherWrap.hidden = list.length === 1 || src.dataset.fixed === '1';
      other.value = '';
      amount = list.indexOf(Number(want)) > -1 ? Number(want) : Number(src.dataset.def || list[0]);
      amtBox.innerHTML = '';
      amts = list.map(function (n) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'sub';
        b.dataset.amt = n;
        b.textContent = money(n) + suffix();
        b.addEventListener('click', function () {
          amount = n;
          other.value = '';
          choose(amts, b);
          showAmount();
        });
        amtBox.appendChild(b);
        choose([b], n === amount ? b : null);
        return b;
      });
      showAmount();
      if (want === 'other' && !otherWrap.hidden) other.focus();
    };
    var pickOpt = function (b, want) {
      choose(opts, b);
      sumGift.textContent = b.dataset.label;
      setAmounts(b, want);
    };
    var pickFund = function (b, wantOpt, want) {
      choose(funds, b);
      sumFund.textContent = b.querySelector('.ft').textContent;
      opts = [];
      optGroups.forEach(function (g) {
        g.hidden = g.dataset.opts !== b.dataset.fund;
        if (!g.hidden) opts = Array.prototype.slice.call(g.querySelectorAll('[data-opt]'));
      });
      optStep.hidden = sumGiftRow.hidden = !opts.length;
      if (opts.length) {
        pickOpt(opts.filter(function (o) { return o.dataset.opt === wantOpt; })[0] || opts[0], want);
      } else {
        setAmounts(b, want);
      }
    };

    funds.forEach(function (b) { b.addEventListener('click', function () { pickFund(b); }); });
    optGroups.forEach(function (g) {
      Array.prototype.forEach.call(g.querySelectorAll('[data-opt]'), function (o) {
        o.addEventListener('click', function () { pickOpt(o); });
      });
    });
    other.addEventListener('input', function () {
      other.value = other.value.replace(/[^0-9]/g, '');
      var back = other.value ? null : amts.filter(function (b) { return Number(b.dataset.amt) === amount; })[0];
      choose(amts, back || null);
      showAmount();
    });

    var params = new URLSearchParams(window.location.search);
    var wanted = params.get('fund');
    pickFund(funds.filter(function (b) { return b.dataset.fund === wanted; })[0] || funds[0],
      params.get('opt'), params.get('amt'));
  }
})();
