/* Dnamo admin center: first-time setup, sign-in, and the editing screens.
   All page content is built with DOM calls (never innerHTML), so saved text can't inject markup. */
(function () {
  'use strict';

  var app = document.getElementById('app');

  /* Small element builder: h('p', {class: 'x'}, 'text', childNode) */
  function h(tag, attrs) {
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else if (k === 'value') el.value = v;
      else if (v === true) el.setAttribute(k, '');
      else if (v !== false && v != null) el.setAttribute(k, v);
    });
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) c.forEach(function (x) { add(el, x); });
    else el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  function show() {
    app.textContent = '';
    for (var i = 0; i < arguments.length; i++) app.appendChild(arguments[i]);
  }

  /* API calls are relative to the secret admin address this page was opened at.
     body is sent as JSON, or as-is when it is a file. */
  function api(method, path, body, headers) {
    var isFile = body instanceof Blob;
    return fetch('api' + path, {
      method: method,
      credentials: 'same-origin',
      headers: Object.assign(body && !isFile ? { 'Content-Type': 'application/json' } : {}, headers || {}),
      body: body ? (isFile ? body : JSON.stringify(body)) : undefined
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (res.status === 401 && path !== '/login') { load(); throw new Error('Your session ended. Sign in again.'); }
        if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.');
        return data;
      });
    });
  }

  function field(label, name, type, extra, hint) {
    var input = h('input', Object.assign({ name: name, type: type, required: true }, extra || {}));
    return h('label', { class: 'field' }, h('span', {}, label), input, hint ? h('small', {}, hint) : null);
  }

  /* ---------- Sign-in and first-time setup ---------- */

  function gateForm(title, sub, fields, buttonText, send) {
    var msg = h('p', { class: 'msg', role: 'alert', hidden: true });
    var btn = h('button', { class: 'btn', type: 'submit' }, buttonText);
    var form = h('form', { novalidate: true, onsubmit: function (e) {
      e.preventDefault();
      var data = {};
      Array.prototype.forEach.call(form.elements, function (el) { if (el.name) data[el.name] = el.value; });
      msg.hidden = true;
      btn.disabled = true;
      send(data).then(load).catch(function (err) {
        msg.textContent = err.message;
        msg.hidden = false;
        btn.disabled = false;
      });
    } }, msg, fields, btn);
    show(h('main', { class: 'gate' }, h('div', { class: 'gate-card' },
      h('img', { src: '/logo.png', alt: '', width: 72, height: 72 }),
      h('h1', {}, title), h('p', { class: 'sub' }, sub), form)));
    var first = form.querySelector('input');
    if (first) first.focus();
  }

  function viewSetup(state) {
    gateForm('Create the owner account', 'First-time setup. This screen appears only once.', [
      field('Setup code', 'token', 'password', { autocomplete: 'off' }, 'The one-time code stored with the site settings.'),
      field('Your name', 'name', 'text', { autocomplete: 'name' }),
      field('Email', 'email', 'email', { autocomplete: 'username' }),
      field('Password', 'password', 'password', { autocomplete: 'new-password', minlength: state.minPassword },
        'At least ' + state.minPassword + ' characters.')
    ], 'Create account', function (data) { return api('POST', '/setup', data); });
  }

  function viewLogin() {
    gateForm('Sign in', 'Dnamo admin center', [
      field('Email', 'email', 'email', { autocomplete: 'username' }),
      field('Password', 'password', 'password', { autocomplete: 'current-password' })
    ], 'Sign in', function (data) { return api('POST', '/login', data); });
  }

  /* ---------- The app ---------- */

  var SECTIONS = [
    { id: 'overview', label: 'Overview' },
    { id: 'identity', label: 'Site settings' },
    { id: 'chrome', label: 'Header & footer' },
    { id: 'photos', label: 'Photos' },
    { id: 'pages', label: 'Page content', soon: true },
    { id: 'popups', label: 'Pop-ups', soon: true },
    { id: 'sites', label: 'Sites', soon: true },
    { id: 'admins', label: 'Admins', soon: true }
  ];

  var session = null;   // { user, sites }
  var site = null;      // the site being edited
  var data = null;      // { content, customised, slots, pages } for that site
  var section = 'overview';
  var mainEl = null;

  function viewApp(state) {
    session = state;
    var saved = null;
    try { saved = localStorage.getItem('dnamoAdminSite'); } catch (e) {}
    site = state.sites.filter(function (s) { return String(s.id) === saved; })[0] || state.sites[0];

    var select = h('select', { 'aria-label': 'Site', onchange: function () {
      try { localStorage.setItem('dnamoAdminSite', select.value); } catch (e) {}
      viewApp(state);
    } });
    state.sites.forEach(function (s) {
      select.appendChild(h('option', { value: s.id, selected: s.id === site.id }, s.name));
    });

    var top = h('header', { class: 'top' },
      h('div', { class: 'brand' }, 'Dnamo ', h('b', {}, 'Admin')),
      h('label', { class: 'pick' }, 'Site', select),
      h('a', { class: 'btn ghost small', href: '/', target: '_blank', rel: 'noopener' }, 'View site'),
      h('span', { class: 'who' }, state.user.name),
      h('button', { class: 'btn ghost small', type: 'button', onclick: function () {
        api('POST', '/logout', {}).then(load, load);
      } }, 'Sign out'));

    var side = h('nav', { class: 'side', 'aria-label': 'Admin sections' });
    SECTIONS.forEach(function (s) {
      side.appendChild(h('button', {
        type: 'button', disabled: !!s.soon, 'data-section': s.id,
        onclick: function () { go(s.id); }
      }, s.label, s.soon ? h('span', { class: 'tag' }, 'Soon') : null));
    });

    mainEl = h('main', { class: 'main' });
    show(h('div', { class: 'frame' }, top, side, mainEl));
    datalist();
    data = null;
    paint(h('p', { class: 'lead' }, 'Loading...'));
    api('GET', '/sites/' + site.id + '/content').then(function (d) {
      data = d;
      datalist();
      go(section);
    }).catch(function (err) { paint(h('p', { class: 'msg' }, err.message)); });
  }

  /* Suggestions for link fields: the site's own pages */
  function datalist() {
    var old = document.getElementById('pages');
    if (old) old.remove();
    var dl = h('datalist', { id: 'pages' });
    ((data && data.pages) || []).forEach(function (p) { dl.appendChild(h('option', { value: p })); });
    document.body.appendChild(dl);
  }

  function paint() {
    mainEl.textContent = '';
    for (var i = 0; i < arguments.length; i++) add(mainEl, arguments[i]);
  }

  function go(id) {
    section = id;
    Array.prototype.forEach.call(document.querySelectorAll('.side button'), function (b) {
      if (b.getAttribute('data-section') === id) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
    if (!data) return;
    ({ overview: overview, identity: identity, chrome: chrome, photos: photos }[id] || overview)();
    mainEl.scrollTop = 0;
    window.scrollTo(0, 0);
  }

  var isCustom = function (key) { return data.customised.indexOf(key) > -1; };

  /* Save one section; value null puts it back to the original. Shows the result next to the button. */
  function save(key, value, status, btn) {
    status.className = 'status';
    status.textContent = 'Saving...';
    if (btn) btn.disabled = true;
    return api('PUT', '/sites/' + site.id + '/content/' + key, { value: value }).then(function (res) {
      data.content[key] = res.value;
      data.customised = data.customised.filter(function (k) { return k !== key; });
      if (value !== null) data.customised.push(key);
      status.className = 'status ok';
      status.textContent = value === null ? 'Back to the original.' : 'Saved. It is live on the site now.';
      if (btn) btn.disabled = false;
      return res.value;
    }).catch(function (err) {
      status.className = 'status bad';
      status.textContent = err.message;
      if (btn) btn.disabled = false;
      throw err;
    });
  }

  /* Save + "Reset to original" buttons with a status line. read() returns the value to save. */
  function actions(key, read, redraw) {
    var status = h('span', { class: 'status', role: 'status' });
    var saveBtn = h('button', { class: 'btn', type: 'button', onclick: function () {
      save(key, read(), status, saveBtn).catch(function () {});
    } }, 'Save changes');
    var reset = isCustom(key) ? h('button', { class: 'btn ghost', type: 'button', onclick: function () {
      if (!window.confirm('Put this section back to the original? Your changes to it will be removed.')) return;
      save(key, null, status, reset).then(redraw, function () {});
    } }, 'Reset to original') : null;
    return h('div', { class: 'actions' }, saveBtn, reset, status);
  }

  function input(label, value, extra, hint) {
    var el = h('input', Object.assign({ type: 'text', value: value || '' }, extra || {}));
    var wrap = h('label', { class: 'field' }, h('span', {}, label), el, hint ? h('small', {}, hint) : null);
    wrap.input = el;
    return wrap;
  }

  /* ---------- Overview ---------- */

  function overview() {
    var role = session.user.role === 'owner' ? 'Owner' : 'Admin';
    var changed = data.customised.length;
    paint(
      h('h1', {}, 'Welcome, ' + session.user.name.split(' ')[0]),
      h('p', { class: 'lead' }, 'You are managing ' + site.name + '.'),
      h('div', { class: 'cards' },
        h('section', { class: 'card' },
          h('h2', {}, 'Edit the site'),
          h('p', { class: 'muted' }, changed ? changed + ' section' + (changed > 1 ? 's' : '') + ' customised so far.' : 'Nothing has been changed yet.'),
          h('div', { class: 'stack' },
            h('button', { class: 'btn ghost small', type: 'button', onclick: function () { go('identity'); } }, 'Name and logo'),
            h('button', { class: 'btn ghost small', type: 'button', onclick: function () { go('chrome'); } }, 'Header & footer'),
            h('button', { class: 'btn ghost small', type: 'button', onclick: function () { go('photos'); } }, 'Photos'))),
        h('section', { class: 'card' },
          h('h2', {}, 'Your account'),
          h('p', {}, session.user.email),
          h('p', { class: 'muted' }, role)),
        h('section', { class: 'card' },
          h('h2', {}, 'Being built next'),
          h('ol', {},
            h('li', {}, 'Page content'),
            h('li', {}, 'Pop-ups'),
            h('li', {}, 'More sites and admin accounts')))));
  }

  /* ---------- Site settings: name and logo ---------- */

  function identity() {
    var v = data.content.identity;
    var a = input('First part (shown in red)', v.nameA, { maxlength: 40 });
    var b = input('Second part', v.nameB, { maxlength: 60 });
    var preview = h('div', { class: 'wordmark', 'aria-label': 'Preview' });
    var draw = function () {
      preview.textContent = '';
      add(preview, [h('b', {}, a.input.value), ' ' + b.input.value]);
    };
    a.input.addEventListener('input', draw);
    b.input.addEventListener('input', draw);
    draw();
    var logo = data.slots.filter(function (s) { return s.id === 'logo'; })[0];
    paint(
      h('h1', {}, 'Site settings'),
      h('p', { class: 'lead' }, 'The name in the top bar and browser tab, and the logo.'),
      h('section', { class: 'card' },
        h('h2', {}, 'Site name'),
        h('div', { class: 'two' }, a, b),
        h('p', { class: 'muted small' }, 'Preview'), preview,
        actions('identity', function () { return { nameA: a.input.value, nameB: b.input.value }; }, identity)),
      h('section', { class: 'card' },
        h('h2', {}, 'Logo'),
        h('p', { class: 'muted' }, 'Used as the browser tab icon, the phone home-screen icon and the loading screen on phones. A square image works best.'),
        h('div', { class: 'photos' }, photoCard(logo, identity))));
  }

  /* ---------- Header & footer ---------- */

  /* An editable list of links. opts.nested adds a dropdown list under each link. */
  function linkList(items, opts) {
    var rows = [];
    var box = h('div', { class: 'links' });
    function row(item) {
      var label = h('input', { type: 'text', value: item.label || '', placeholder: 'Label', 'aria-label': 'Label', maxlength: 60 });
      var href = h('input', { type: 'text', value: item.href || '', placeholder: 'Link, e.g. board.html', 'aria-label': 'Link', list: 'pages' });
      var kids = opts.nested ? linkList(item.children || [], { addLabel: 'Add dropdown link', max: 10 }) : null;
      var r = { read: function () {
        var out = { label: label.value, href: href.value };
        if (kids) out.children = kids.read();
        return out;
      } };
      var move = function (d) {
        var i = rows.indexOf(r), j = i + d;
        if (j < 0 || j >= rows.length) return;
        rows.splice(i, 1); rows.splice(j, 0, r);
        if (d < 0) box.insertBefore(r.el, rows[j + 1].el); else box.insertBefore(rows[i].el, r.el);
      };
      r.el = h('div', { class: 'link' + (opts.nested ? ' top-link' : '') },
        h('div', { class: 'link-row' }, label, href,
          h('button', { class: 'icon', type: 'button', title: 'Move up', 'aria-label': 'Move up', onclick: function () { move(-1); } }, '↑'),
          h('button', { class: 'icon', type: 'button', title: 'Move down', 'aria-label': 'Move down', onclick: function () { move(1); } }, '↓'),
          h('button', { class: 'icon del', type: 'button', title: 'Remove', 'aria-label': 'Remove', onclick: function () {
            rows.splice(rows.indexOf(r), 1); r.el.remove();
          } }, '×')),
        kids ? h('div', { class: 'kids' }, h('p', { class: 'muted small' }, 'Dropdown links (optional)'), kids.el) : null);
      rows.push(r);
      box.appendChild(r.el);
    }
    items.forEach(row);
    var el = h('div', {}, box, h('button', { class: 'btn ghost small', type: 'button', onclick: function () {
      if (rows.length >= opts.max) return;
      row({ label: '', href: '', children: [] });
      rows[rows.length - 1].el.querySelector('input').focus();
    } }, opts.addLabel));
    return { el: el, read: function () { return rows.map(function (r) { return r.read(); }); } };
  }

  function chrome() {
    var hd = data.content.header, ft = data.content.footer;
    var menu = linkList(hd.items, { nested: true, addLabel: 'Add menu link', max: 8 });
    var btnLabel = input('Button label', hd.button.label, { maxlength: 30 }, 'Leave empty to hide the button.');
    var btnHref = input('Button link', hd.button.href, { list: 'pages' });
    var links = linkList(ft.links, { addLabel: 'Add footer link', max: 10 });
    var legal = h('textarea', { rows: 3, maxlength: 400 });
    legal.value = ft.legal;
    var copy = input('Copyright line', ft.copyright, { maxlength: 120 });
    var li = input('LinkedIn address', ft.linkedin, { placeholder: 'https://' }, 'Leave empty to hide the icon.');
    var ig = input('Instagram address', ft.instagram, { placeholder: 'https://' }, 'Leave empty to hide the icon.');
    paint(
      h('h1', {}, 'Header & footer'),
      h('p', { class: 'lead' }, 'The menu at the top of every page and the links at the bottom.'),
      h('section', { class: 'card' },
        h('h2', {}, 'Top menu'),
        h('p', { class: 'muted' }, 'A link can be a page on this site (pick from the suggestions) or a full address starting with https://.'),
        menu.el,
        h('h3', {}, 'Button'),
        h('div', { class: 'two' }, btnLabel, btnHref),
        actions('header', function () {
          return { items: menu.read(), button: { label: btnLabel.input.value, href: btnHref.input.value } };
        }, chrome)),
      h('section', { class: 'card' },
        h('h2', {}, 'Footer'),
        h('h3', {}, 'Links'),
        links.el,
        h('h3', {}, 'Text'),
        h('label', { class: 'field' }, h('span', {}, 'Legal line'), legal),
        copy,
        h('h3', {}, 'Social icons'),
        h('div', { class: 'two' }, li, ig),
        actions('footer', function () {
          return { links: links.read(), legal: legal.value, copyright: copy.input.value, linkedin: li.input.value, instagram: ig.input.value };
        }, chrome)));
  }

  /* ---------- Photos ---------- */

  var TARGET = 1200000;   // bytes; the server accepts up to 1.5 MB

  function toBlob(canvas, type, q) {
    return new Promise(function (resolve) { canvas.toBlob(resolve, type, q); });
  }

  /* Shrink a photo in the browser so uploads are quick and pages stay fast.
     Small images in a web format are sent untouched. */
  function prepare(file, maxDim) {
    if (!/^image\//.test(file.type)) return Promise.reject(new Error('Choose an image file (JPG, PNG or WebP).'));
    return createImageBitmap(file).catch(function () {
      throw new Error('That image could not be read. Try a JPG or PNG.');
    }).then(function (bmp) {
      var scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
      var webType = /^image\/(jpeg|png|webp|gif)$/.test(file.type);
      if (webType && scale === 1 && file.size <= TARGET) return file;
      if (file.type === 'image/gif' && file.size <= TARGET) return file;
      var type = file.type === 'image/png' || file.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
      var tries = [[1, 0.86], [1, 0.76], [1, 0.66], [0.8, 0.76], [0.65, 0.72], [0.5, 0.7]];
      var attempt = function (i) {
        var w = Math.max(1, Math.round(bmp.width * scale * tries[i][0]));
        var hgt = Math.max(1, Math.round(bmp.height * scale * tries[i][0]));
        var canvas = h('canvas', { width: w, height: hgt });
        canvas.getContext('2d').drawImage(bmp, 0, 0, w, hgt);
        return toBlob(canvas, type, tries[i][1]).then(function (blob) {
          if (!blob) throw new Error('That image could not be processed.');
          if (blob.size <= TARGET || i === tries.length - 1) return blob;
          return attempt(i + 1);
        });
      };
      return attempt(0);
    });
  }

  function photoCard(slot, redraw) {
    var current = data.content.photos[slot.id];
    var status = h('span', { class: 'status', role: 'status' });
    var file = h('input', { type: 'file', accept: 'image/*', hidden: true, onchange: function () {
      var f = file.files[0];
      if (!f) return;
      status.className = 'status';
      status.textContent = 'Uploading...';
      prepare(f, slot.max).then(function (blob) {
        return api('POST', '/sites/' + site.id + '/media', blob, { 'X-File-Name': encodeURIComponent(f.name) });
      }).then(function (m) {
        var next = Object.assign({}, data.content.photos);
        next[slot.id] = m.url;
        return save('photos', next, status);
      }).then(redraw).catch(function (err) {
        status.className = 'status bad';
        status.textContent = err.message;
        file.value = '';
      });
    } });
    return h('div', { class: 'photo' },
      h('div', { class: 'thumb' + (slot.id === 'logo' ? ' contain' : '') }, h('img', { src: current || '/' + slot.src, alt: '', loading: 'lazy' })),
      h('div', { class: 'photo-body' },
        h('strong', {}, slot.label),
        h('span', { class: 'muted small' }, current ? 'Replaced' : 'Original'),
        h('div', { class: 'stack' },
          h('button', { class: 'btn small', type: 'button', onclick: function () { file.click(); } }, 'Replace'),
          current ? h('button', { class: 'btn ghost small', type: 'button', onclick: function () {
            var next = Object.assign({}, data.content.photos);
            delete next[slot.id];
            save('photos', next, status).then(redraw, function () {});
          } }, 'Use original') : null),
        status, file));
  }

  function photos() {
    var groups = [];
    data.slots.forEach(function (s) {
      if (s.group === 'Logo') return;
      var g = groups.filter(function (x) { return x.name === s.group; })[0];
      if (!g) groups.push(g = { name: s.group, slots: [] });
      g.slots.push(s);
    });
    paint(
      h('h1', {}, 'Photos'),
      h('p', { class: 'lead' }, 'Replace any photo on the site. Large photos are shrunk automatically; a change is live as soon as it uploads.'),
      groups.map(function (g) {
        return h('section', { class: 'card' }, h('h2', {}, g.name),
          h('div', { class: 'photos' }, g.slots.map(function (s) { return photoCard(s, photos); })));
      }));
  }

  /* ---------- Start ---------- */

  function load() {
    return api('GET', '/state').then(function (state) {
      if (state.view === 'setup') viewSetup(state);
      else if (state.view === 'login') viewLogin();
      else viewApp(state);
    }).catch(function (err) {
      show(h('main', { class: 'gate' }, h('div', { class: 'gate-card' },
        h('h1', {}, 'Cannot load'), h('p', { class: 'sub' }, err.message),
        h('button', { class: 'btn', type: 'button', onclick: load }, 'Try again'))));
    });
  }

  load();
})();
