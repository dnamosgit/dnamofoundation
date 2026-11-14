/* Dnamo pop-ups. Loaded only on pages that have a live pop-up.
   A pop-up is a small card that slides in at the bottom right corner. It never
   covers the page or blocks it: visitors can keep reading and close it when they like.
   Two shapes: a tall card with the photo on top, or a low, wide card with the photo at the side.
   Self-contained: brings its own styles, so it looks the same on any page.
   All text is placed with textContent, so pop-up text can never inject markup. */
(function () {
  'use strict';

  var CSS = '' +
    '.dnp-card{position:fixed;right:76px;bottom:20px;z-index:2147483000;box-sizing:border-box;width:330px;max-width:calc(100vw - 24px);max-height:calc(100vh - 40px);max-height:calc(100dvh - 40px);overflow:auto;background:#fff;color:#111;border:1px solid #e3e3e3;border-radius:16px;box-shadow:0 16px 44px rgba(0,0,0,.2);font:400 13.5px/1.55 Inter,system-ui,-apple-system,"Segoe UI",sans-serif;text-align:left;opacity:0;transform:translateY(18px);transition:opacity .35s ease,transform .35s ease}' +
    '.dnp-card.dnp-in{opacity:1;transform:none}' +
    '.dnp-card *{box-sizing:border-box}' +
    '.dnp-img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;background:#eee}' +
    '.dnp-body{padding:14px 18px 18px;border-top:3px solid #eb2323}' +
    '.dnp-title{margin:0 26px 6px 0;font:700 21px/1.05 "Barlow Condensed","Arial Narrow",Arial,sans-serif;text-transform:uppercase;letter-spacing:.02em;color:#000}' +
    '.dnp-img + .dnp-body .dnp-title{margin-right:0}' +
    '.dnp-text{margin:0 0 6px;color:#444}' +
    '.dnp-text:last-of-type{margin-bottom:0}' +
    '.dnp-btn{display:inline-flex;align-items:center;justify-content:center;min-height:34px;margin-top:12px;padding:7px 16px;border-radius:999px;background:#eb2323;color:#fff;font:600 11.5px/1 Inter,system-ui,sans-serif;text-transform:uppercase;letter-spacing:.08em;text-decoration:none;transition:background-color .2s ease}' +
    '.dnp-btn:hover,.dnp-btn:focus-visible{background:#c81a1a;color:#fff}' +
    '.dnp-x{position:absolute;top:8px;right:8px;width:26px;height:26px;padding:0;border:0;border-radius:50%;background:rgba(255,255,255,.94);color:#444;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,.18)}' +
    '.dnp-x::before{content:"";position:absolute;inset:-8px}' +
    '.dnp-x:hover{background:#000;color:#fff}' +
    '.dnp-x svg{width:10px;height:10px}' +
    '.dnp-card :focus-visible{outline:2px solid #eb2323;outline-offset:2px}' +
    '.dnp-note{margin:0;padding:6px 18px;background:#111;color:#fff;font:600 10.5px/1.4 Inter,system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase}' +
    '.dnp-label{display:flex;align-items:center;gap:8px;margin:0 26px 6px 0;font:italic 600 10.5px/1.3 Inter,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#111}' +
    '.dnp-label::before{content:"";flex:none;width:7px;height:7px;background:#eb2323}' +
    '.dnp-label + .dnp-title{margin-right:0}' +
    '.dnp-wide{display:grid;grid-template-columns:minmax(0,1fr) 38%;width:480px;border-radius:6px}' +
    '.dnp-wide .dnp-note{grid-column:1/-1}' +
    '.dnp-wide .dnp-img{order:2;width:100%;height:100%;min-height:150px;aspect-ratio:auto}' +
    '.dnp-wide .dnp-body{order:1;padding:14px 16px 14px;border-top:0;border-left:3px solid #eb2323}' +
    '.dnp-wide .dnp-title{font-size:19px;margin-right:0}' +
    '.dnp-wide .dnp-text{font-size:12px;line-height:1.5;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:5;overflow:hidden}' +
    '.dnp-wide .dnp-btn{min-height:0;margin-top:10px;padding:0;border-radius:0;background:none;color:#d81e1e;font-size:11.5px}' +
    '.dnp-wide .dnp-btn::after{content:"\\2197";margin-left:8px;font-size:13px}' +
    '.dnp-wide .dnp-btn:hover,.dnp-wide .dnp-btn:focus-visible{background:none;color:#a51414;text-decoration:underline}' +
    '.dnp-wide:not(:has(.dnp-img)){display:block;width:360px}' +
    '@media (max-width:600px){.dnp-card{left:12px;right:12px;bottom:12px;width:auto;max-width:none}.dnp-wide .dnp-img{min-height:120px}.dnp-wide .dnp-text{-webkit-line-clamp:3}}' +
    '@media (prefers-reduced-motion:reduce){.dnp-card{transition:none}}';

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

    var card = el('aside', 'dnp-card' + (p.layout === 'wide' ? ' dnp-wide' : ''));
    card.setAttribute('role', 'region');
    card.setAttribute('aria-label', 'Announcement');

    if (opts.preview) card.appendChild(el('p', 'dnp-note', 'Preview'));
    if (p.image) {
      var img = el('img', 'dnp-img');
      img.src = p.image;
      img.alt = '';
      card.appendChild(img);
    }
    var body = el('div', 'dnp-body');
    if (p.label) body.appendChild(el('p', 'dnp-label', p.label));
    body.appendChild(el('h2', 'dnp-title', p.title));
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
    x.setAttribute('aria-label', 'Close announcement');
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 16 16');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2.2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('aria-hidden', 'true');
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M3 3l10 10M13 3L3 13');
    svg.appendChild(path);
    x.appendChild(svg);
    card.appendChild(x);

    function close() {
      if (open !== close) return;
      open = null;
      document.removeEventListener('keydown', keys);
      card.remove();
    }
    function keys(e) { if (e.key === 'Escape') close(); }
    x.addEventListener('click', close);
    document.addEventListener('keydown', keys);

    open = close;
    document.body.appendChild(card);
    card.offsetWidth;                 // start the slide from the hidden state
    card.classList.add('dnp-in');
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
