(function () {
  'use strict';

  /* Logo splash (phones and tablets): hold briefly once the logo has loaded, then fade out.
     Shown once per visit; later pages skip it via the inline script in <head>. */
  var splash = document.querySelector('.splash');
  if (splash && getComputedStyle(splash).display !== 'none') {
    try { sessionStorage.setItem('dnamoSplash', '1'); } catch (e) {}
    var logo = splash.querySelector('img');
    var hideSplash = function () {
      setTimeout(function () { splash.classList.add('done'); }, 900);
    };
    if (logo.complete) hideSplash();
    else { logo.addEventListener('load', hideSplash); logo.addEventListener('error', hideSplash); }
  }

  /* Light / dark mode. Light is the default; the choice is remembered on this device.
     The inline script in <head> applies a saved "dark" choice before the page paints. */
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
      try { localStorage.setItem('dnamoTheme', dark ? 'dark' : 'light'); } catch (e) {}
      showTheme();
    });
    showTheme();
  }

  /* Header: transparent over the home hero, black once scrolled or when the menu is open */
  var header = document.querySelector('.site-header');
  var navbox = document.querySelector('.navbox');
  var burger = document.querySelector('.burger');
  var isHome = document.body.classList.contains('home');

  function syncHeader() {
    if (!isHome) return;
    var solid = window.scrollY > 40 || navbox.classList.contains('open');
    header.classList.toggle('solid', solid);
  }
  window.addEventListener('scroll', syncHeader, { passive: true });
  syncHeader();

  burger.addEventListener('click', function () {
    var open = navbox.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
    syncHeader();
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
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.elements.name.value;
      var email = form.elements.email.value;
      var msg = form.elements.message.value;
      window.location.href = 'mailto:impact@dnamoacademy.com?subject=' +
        encodeURIComponent('Dnamo Football Foundation: ' + topic) +
        '&body=' + encodeURIComponent(msg + '\n\n' + name + '\n' + email);
    });
  }

  /* Donate: fund (preselectable with ?fund=train|schol|acad), amount, summary */
  var donate = document.getElementById('donate');
  if (donate) {
    var funds = Array.prototype.slice.call(donate.querySelectorAll('[data-fund]'));
    var amts = Array.prototype.slice.call(donate.querySelectorAll('[data-amt]'));
    var other = document.getElementById('other-amount');
    var sumFund = document.getElementById('sum-fund');
    var sumAmt = document.getElementById('sum-amount');
    var amount = 50;

    var pickFund = function (b) {
      choose(funds, b);
      sumFund.textContent = b.querySelector('.ft').textContent;
    };
    var showAmount = function () {
      sumAmt.textContent = '$' + (other.value || amount);
    };

    funds.forEach(function (b) { b.addEventListener('click', function () { pickFund(b); }); });
    amts.forEach(function (b) {
      b.addEventListener('click', function () {
        amount = Number(b.dataset.amt);
        other.value = '';
        choose(amts, b);
        showAmount();
      });
    });
    other.addEventListener('input', function () {
      other.value = other.value.replace(/[^0-9]/g, '');
      if (other.value) {
        choose(amts, null);
      } else {
        choose(amts, amts.filter(function (b) { return Number(b.dataset.amt) === amount; })[0]);
      }
      showAmount();
    });

    var wanted = new URLSearchParams(window.location.search).get('fund');
    var match = funds.filter(function (b) { return b.dataset.fund === wanted; })[0];
    if (match) pickFund(match);
  }
})();
