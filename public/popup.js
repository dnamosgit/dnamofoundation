/* Dnamo pop-ups. Loaded only on pages that have a live pop-up.
   Self-contained: brings its own styles, so it looks the same on any page.
   All text is placed with textContent, so pop-up text can never inject markup. */
(function () {
  'use strict';

  var CSS = '' +
    '.dnp-back{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,.62);opacity:0;transition:opacity .25s ease}' +
    '.dnp-back.dnp-in{opacity:1}' +
    '.dnp-card{position:relative;width:100%;max-width:440px;max-height:calc(100vh - 40px);max-height:calc(100dvh - 40px);overflow:auto;background:#fff;color:#111;border-radius:18px;box-shadow:0 30px 80px rgba(0,0,0,.45);font:400 15px/1.55 Inter,system-ui,-apple-system,"Segoe UI",sans-serif;text-align:left;transform:translateY(14px);transition:transform .25s ease}' +
    '.dnp-in .dnp-card{transform:none}' +
    '.dnp-img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;background:#eee}' +
    '.dnp-body{padding:26px 26px 28px;border-top:4px solid #eb2323}' +
    '.dnp-title{margin:0 36px 10px 0;font:700 26px/1.04 "Barlow Condensed","Arial Narrow",Arial,sans-serif;text-transform:uppercase;letter-spacing:.02em;color:#000}' +
    '.dnp-img + .dnp-body .dnp-title{margin-right:0}' +
    '.dnp-text{margin:0 0 10px;color:#333}' +
    '.dnp-text:last-of-type{margin-bottom:0}' +
    '.dnp-btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;margin-top:18px;padding:9px 22px;border-radius:999px;background:#eb2323;color:#fff;font:600 12.5px/1 Inter,system-ui,sans-serif;text-transform:uppercase;letter-spacing:.06em;text-decoration:none;transition:background-color .2s ease}' +
    '.dnp-btn:hover,.dnp-btn:focus-visible{background:#c81a1a;color:#fff}' +
    '.dnp-x{position:absolute;top:10px;right:10px;width:40px;height:40px;padding:0;border:0;border-radius:50%;background:rgba(255,255,255,.92);color:#000;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.2)}' +
    '.dnp-x:hover{background:#000;color:#fff}' +
    '.dnp-x svg{width:16px;height:16px}' +
    '.dnp-card :focus-visible{outline:2px solid #eb2323;outline-offset:2px}' +
    '.dnp-note{margin:0;padding:8px 26px;background:#111;color:#fff;font:600 12px/1.4 Inter,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase}' +
    '@media (max-width:520px){.dnp-back{align-items:flex-end;padding:12px}.dnp-card{max-height:calc(100dvh - 24px)}.dnp-body{padding:22px 20px 24px}.dnp-title{font-size:24px}}' +
    '@media (prefers-reduced-motion:reduce){.dnp-back,.dnp-card{transition:none}}';

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  var open = null;   // closes the pop-up that is showing

  /* Show one pop-up. opts.preview adds a "Preview" strip and keeps the button from leaving the page. */
  function show(p, opts) {
    opts = opts || {};
    if (open) open();
    if (!document.getElementById('dnp-css')) {
      var st = el('style');
      st.id = 'dnp-css';
      st.textContent = CSS;
      document.head.appendChild(st);
    }

    var back = el('div', 'dnp-back');
    var card = el('div', 'dnp-card');
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');
    card.setAttribute('aria-labelledby', 'dnp-title');

    if (opts.preview) card.appendChild(el('p', 'dnp-note', 'Preview'));
    if (p.image) {
      var img = el('img', 'dnp-img');
      img.src = p.image;
      img.alt = '';
      card.appendChild(img);
    }
    var body = el('div', 'dnp-body');
    var title = el('h2', 'dnp-title', p.title);
    title.id = 'dnp-title';
    body.appendChild(title);
    String(p.text || '').split(/\n+/).forEach(function (line) {
      if (line.trim()) body.appendChild(el('p', 'dnp-text', line.trim()));
    });
    if (p.button && p.button.label) {
      var a = el('a', 'dnp-btn', p.button.label);
      a.href = p.button.href;
      if (/^https?:/i.test(p.button.href)) { a.target = '_blank'; a.rel = 'noopener'; }
      if (opts.preview) a.addEventListener('click', function (e) { e.preventDefault(); });
      else a.addEventListener('click', function () { close(); });
      body.appendChild(a);
    }
    card.appendChild(body);

    var x = el('button', 'dnp-x');
    x.type = 'button';
    x.setAttribute('aria-label', 'Close');
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 16 16');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('aria-hidden', 'true');
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M3 3l10 10M13 3L3 13');
    svg.appendChild(path);
    x.appendChild(svg);
    card.appendChild(x);
    back.appendChild(card);

    var before = document.activeElement;
    function close() {
      if (open !== close) return;
      open = null;
      document.removeEventListener('keydown', keys, true);
      back.remove();
      if (before && before.focus) { try { before.focus(); } catch (e) {} }
    }
    function keys(e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab') return;
      // keep the keyboard inside the pop-up while it is open
      var f = card.querySelectorAll('a[href],button');
      var first = f[0], last = f[f.length - 1];
      if (!card.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    x.addEventListener('click', close);
    back.addEventListener('mousedown', function (e) { if (e.target === back) close(); });
    document.addEventListener('keydown', keys, true);

    open = close;
    document.body.appendChild(back);
    back.offsetWidth;                 // start the fade from the hidden state
    back.classList.add('dnp-in');
    x.focus();
    return close;
  }

  /* Has this visitor already seen this pop-up as often as its setting allows? */
  var KEY = 'dnamoPopup:';
  function seen(p) {
    try {
      if (p.frequency === 'always') return false;
      if (p.frequency === 'session') return !!sessionStorage.getItem(KEY + p.id);
      var at = Number(localStorage.getItem(KEY + p.id) || 0);
      if (!at) return false;
      return p.frequency === 'day' ? Date.now() - at < 86400000 : true;
    } catch (e) { return false; }
  }
  function mark(p) {
    try {
      if (p.frequency === 'session') sessionStorage.setItem(KEY + p.id, '1');
      else if (p.frequency !== 'always') localStorage.setItem(KEY + p.id, String(Date.now()));
    } catch (e) {}
  }

  window.DnamoPopup = { show: show };

  // The pop-ups come with the page, or with the script itself on a site hosted elsewhere.
  var store = document.getElementById('dn-popups');
  var list = Array.isArray(window.DnamoPopups) ? window.DnamoPopups : [];
  if (store) { try { list = JSON.parse(store.textContent) || []; } catch (e) {} }
  var begin = function () {
  // One pop-up per page view: the newest one this visitor has not used up.
  var next = list.filter(function (p) { return !seen(p); })[0];
  if (!next) return;
  var tries = 0;
  (function start() {
    // On phones the site opens with a logo screen; wait for it to clear first.
    var splash = document.querySelector('.splash');
    if (splash && !splash.classList.contains('done') && getComputedStyle(splash).display !== 'none' && tries++ < 30) {
      setTimeout(start, 200);
      return;
    }
    setTimeout(function () {
      if (seen(next)) return;           // shown meanwhile in another tab
      mark(next);
      show(next);
    }, Math.max(0, Number(next.delay) || 0) * 1000 + (tries ? 700 : 400));
  })();
  };
  if (document.body) begin(); else document.addEventListener('DOMContentLoaded', begin);
})();
