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
    { id: 'identity', label: 'Site settings', full: true },
    { id: 'chrome', label: 'Header & footer', full: true },
    { id: 'photos', label: 'Photos', full: true },
    { id: 'pages', label: 'Page content', full: true },
    { id: 'popups', label: 'Pop-ups' },
    { id: 'sites', label: 'Sites', owner: true },
    { id: 'admins', label: 'Admins', owner: true },
    { id: 'account', label: 'My account' }
  ];
  /* A site hosted here can be edited in full; one hosted elsewhere has pop-ups only. Sites and Admins are for the owner. */
  var isFull = function () { return site.kind === 'full'; };
  var allowed = function (s) { return (!s.full || isFull()) && (!s.owner || session.user.role === 'owner'); };

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
      h('a', { class: 'btn ghost small', href: isFull() ? '/' : 'https://' + site.hostnames.split(',')[0], target: '_blank', rel: 'noopener' }, 'View site'),
      h('span', { class: 'who' }, state.user.name),
      h('button', { class: 'btn ghost small', type: 'button', onclick: function () {
        api('POST', '/logout', {}).then(load, load);
      } }, 'Sign out'));

    var side = h('nav', { class: 'side', 'aria-label': 'Admin sections' });
    SECTIONS.filter(allowed).forEach(function (s) {
      side.appendChild(h('button', { type: 'button', 'data-section': s.id, onclick: function () { go(s.id); } }, s.label));
    });

    mainEl = h('main', { class: 'main' });
    show(h('div', { class: 'frame' }, top, side, mainEl));
    datalist();
    data = null;
    paint(h('p', { class: 'lead' }, 'Loading...'));
    if (!isFull()) {          // nothing to load: this site has pop-ups only
      data = { content: {}, customised: [], slots: [], pages: [] };
      go(section);
      return;
    }
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
    if (!SECTIONS.some(function (s) { return s.id === id && allowed(s); })) id = 'overview';
    section = id;
    Array.prototype.forEach.call(document.querySelectorAll('.side button'), function (b) {
      if (b.getAttribute('data-section') === id) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
    if (!data) return;
    ({ overview: overview, identity: identity, chrome: chrome, photos: photos, pages: pages, popups: popups, sites: sites, admins: admins, account: account }[id] || overview)();
    mainEl.scrollTop = 0;
    window.scrollTo(0, 0);
  }

  var isCustom = function (key) { return data.customised.indexOf(key) > -1; };
  /* Keep the red "changed" dots on the Page content tabs in step with what is saved */
  function marks() {
    Array.prototype.forEach.call(document.querySelectorAll('.tabs button[data-tab]'), function (b) {
      var dot = b.querySelector('.dot');
      var on = isCustom(b.getAttribute('data-tab'));
      if (on && !dot) b.appendChild(h('span', { class: 'dot', title: 'Customised' }));
      if (!on && dot) dot.remove();
    });
  }

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
      // Once a section is saved it can be reset, and its tab gets the red dot
      save(key, read(), status, saveBtn).then(function () { reset.hidden = false; marks(); }, function () {});
    } }, 'Save changes');
    var reset = h('button', { class: 'btn ghost', type: 'button', hidden: !isCustom(key), onclick: function () {
      if (!window.confirm('Put this section back to the original? Your changes to it will be removed.')) return;
      save(key, null, status, reset).then(redraw, function () {});
    } }, 'Reset to original');
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
    var edit = isFull() ? h('section', { class: 'card' },
      h('h2', {}, 'Edit the site'),
      h('p', { class: 'muted' }, changed ? changed + ' section' + (changed > 1 ? 's' : '') + ' customised so far.' : 'Nothing has been changed yet.'),
      h('div', { class: 'stack' },
        h('button', { class: 'btn ghost small', type: 'button', onclick: function () { go('identity'); } }, 'Name and logo'),
        h('button', { class: 'btn ghost small', type: 'button', onclick: function () { go('chrome'); } }, 'Header & footer'),
        h('button', { class: 'btn ghost small', type: 'button', onclick: function () { go('photos'); } }, 'Photos'),
        h('button', { class: 'btn ghost small', type: 'button', onclick: function () { go('pages'); } }, 'Page content'),
        h('button', { class: 'btn ghost small', type: 'button', onclick: function () { go('popups'); } }, 'Pop-ups')))
      : h('section', { class: 'card' },
        h('h2', {}, 'Pop-ups for this site'),
        h('p', { class: 'muted' }, 'This site is hosted elsewhere. Pop-ups you make here show on it once this line is on its pages:'),
        copyBox(embedCode(site), 2),
        h('div', { class: 'stack' },
          h('button', { class: 'btn small', type: 'button', onclick: function () { go('popups'); } }, 'Manage pop-ups')));
    paint(
      h('h1', {}, 'Welcome, ' + session.user.name.split(' ')[0]),
      h('p', { class: 'lead' }, 'You are managing ' + site.name + '.'),
      h('div', { class: 'cards' },
        edit,
        h('section', { class: 'card' },
          h('h2', {}, 'Your account'),
          h('p', {}, session.user.email),
          h('p', { class: 'muted' }, role),
          h('div', { class: 'stack' },
            h('button', { class: 'btn ghost small', type: 'button', onclick: function () { go('account'); } }, 'Change password'),
            session.user.role === 'owner' ? h('button', { class: 'btn ghost small', type: 'button', onclick: function () { go('admins'); } }, 'Admins') : null,
            session.user.role === 'owner' ? h('button', { class: 'btn ghost small', type: 'button', onclick: function () { go('sites'); } }, 'Sites') : null))));
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

  /* ---------- Page content ---------- */

  function area(label, value, rows, hint) {
    var el = h('textarea', { rows: rows || 3 });
    el.value = value || '';
    var wrap = h('label', { class: 'field' }, h('span', {}, label), el, hint ? h('small', {}, hint) : null);
    wrap.input = el;
    return wrap;
  }
  /* Paragraphs are edited in one box, separated by an empty line */
  function paras(label, arr, rows, hint) {
    var f = area(label, (arr || []).join('\n\n'), rows, hint || 'Leave an empty line between paragraphs. Put **two stars** around words to make them bold.');
    f.read = function () {
      return f.input.value.split(/\n\s*\n/).map(function (x) { return x.replace(/\s+/g, ' ').trim(); }).filter(Boolean);
    };
    return f;
  }
  /* One item per line */
  function lines(label, arr, rows, hint) {
    var f = area(label, (arr || []).join('\n'), rows, hint || 'One per line.');
    f.read = function () { return f.input.value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean); };
    return f;
  }
  var amountsText = function (arr) { return (arr || []).join(', '); };
  var amountsRead = function (str) {
    return String(str).split(/[,;\s]+/).map(function (x) { return x.replace(/[$]/g, ''); }).filter(Boolean).map(Number);
  };

  /* An editable list of items with several fields each.
     spec: { fields: [{ key, label, type: 'text' | 'area' | 'photo' | 'amounts', hint }], addLabel, max, blank, fixed }
     fixed lists cannot be added to, removed from or reordered. */
  function itemList(items, spec) {
    var rows = [];
    var box = h('div', { class: 'items' });
    function row(item) {
      var readers = {};
      var body = h('div', { class: 'item-body' });
      spec.fields.forEach(function (f) {
        var v = item[f.key];
        if (f.type === 'photo') {
          var value = v || '';
          var img = h('img', { alt: '', src: value ? (value.charAt(0) === '/' ? value : '/' + value) : '/person.svg' });
          var st = h('span', { class: 'status', role: 'status' });
          var file = h('input', { type: 'file', accept: 'image/*', hidden: true, onchange: function () {
            var chosen = file.files[0];
            if (!chosen) return;
            st.className = 'status'; st.textContent = 'Uploading...';
            prepare(chosen, 600).then(function (blob) {
              return api('POST', '/sites/' + site.id + '/media', blob, { 'X-File-Name': encodeURIComponent(chosen.name) });
            }).then(function (m) {
              value = m.url; img.src = m.url;
              st.className = 'status ok'; st.textContent = 'Uploaded. Save to publish.';
            }).catch(function (err) { st.className = 'status bad'; st.textContent = err.message; file.value = ''; });
          } });
          body.appendChild(h('div', { class: 'item-photo' }, img,
            h('div', {}, h('button', { class: 'btn ghost small', type: 'button', onclick: function () { file.click(); } }, 'Change photo'), st, file)));
          readers[f.key] = function () { return value; };
        } else if (f.type === 'area') {
          var a = area(f.label, v, f.rows || 4, f.hint);
          body.appendChild(a);
          readers[f.key] = function () { return a.input.value; };
        } else if (f.type === 'amounts') {
          var am = input(f.label, amountsText(v), { inputmode: 'numeric' }, f.hint || 'Whole dollars, separated by commas.');
          body.appendChild(am);
          readers[f.key] = function () { return amountsRead(am.input.value); };
        } else {
          var t = input(f.label, v, {}, f.hint);
          body.appendChild(t);
          readers[f.key] = function () { return t.input.value; };
        }
      });
      var r = { read: function () {
        var out = {};
        if (item.id) out.id = item.id;
        Object.keys(readers).forEach(function (k) { out[k] = readers[k](); });
        return out;
      } };
      var move = function (d) {
        var i = rows.indexOf(r), j = i + d;
        if (j < 0 || j >= rows.length) return;
        rows.splice(i, 1); rows.splice(j, 0, r);
        if (d < 0) box.insertBefore(r.el, rows[j + 1].el); else box.insertBefore(rows[i].el, r.el);
      };
      r.el = h('div', { class: 'item' }, body, spec.fixed ? null : h('div', { class: 'item-tools' },
        h('button', { class: 'icon', type: 'button', title: 'Move up', 'aria-label': 'Move up', onclick: function () { move(-1); } }, '\u2191'),
        h('button', { class: 'icon', type: 'button', title: 'Move down', 'aria-label': 'Move down', onclick: function () { move(1); } }, '\u2193'),
        h('button', { class: 'icon del', type: 'button', title: 'Remove', 'aria-label': 'Remove', onclick: function () {
          if (!window.confirm('Remove this item?')) return;
          rows.splice(rows.indexOf(r), 1); r.el.remove();
        } }, '\u00d7')));
      rows.push(r);
      box.appendChild(r.el);
    }
    items.forEach(row);
    var el = h('div', {}, box, spec.fixed ? null : h('button', { class: 'btn ghost small', type: 'button', onclick: function () {
      if (rows.length >= spec.max) return;
      row(spec.blank || {});
      var first = rows[rows.length - 1].el.querySelector('input:not([type=file]), textarea');
      if (first) first.focus();
    } }, spec.addLabel));
    return { el: el, read: function () { return rows.map(function (r) { return r.read(); }); } };
  }

  var PAGE_TABS = [
    { id: 'home', label: 'Home' },
    { id: 'board', label: 'Board' },
    { id: 'inits', label: 'Initiatives' },
    { id: 'giving', label: 'Giving options' },
    { id: 'testimonials', label: 'Testimonials' }
  ];
  var pageTab = 'home';

  function pages() {
    var tabs = h('div', { class: 'tabs', role: 'tablist' }, PAGE_TABS.map(function (t) {
      return h('button', { type: 'button', role: 'tab', 'data-tab': t.id, 'aria-selected': String(t.id === pageTab), onclick: function () {
        pageTab = t.id; pages();
      } }, t.label, isCustom(t.id) ? h('span', { class: 'dot', title: 'Customised' }) : null);
    }));
    var body = ({ home: pageHome, board: pageBoard, inits: pageInits, giving: pageGiving, testimonials: pageTestimonials })[pageTab]();
    paint(h('h1', {}, 'Page content'),
      h('p', { class: 'lead' }, 'The words on each page. A red dot marks a page you have changed.'),
      tabs, body);
  }

  function pageHome() {
    var v = data.content.home;
    var kicker = input('Small line above the headline', v.kicker);
    var headline = input('Headline', v.headline);
    var intro = area('Text under the headline', v.intro, 2);
    var video = input('Background video link (optional)', v.video, { placeholder: 'https://' },
      'Paste a YouTube or Vimeo link, or a link to an .mp4 file. It plays silently on a loop behind the headline, in place of the photo slideshow. Leave empty to show the photos.');
    var b1l = input('First button label', v.button1.label), b1h = input('First button link', v.button1.href, { list: 'pages' });
    var b2l = input('Second button label', v.button2.label), b2h = input('Second button link', v.button2.href, { list: 'pages' });
    var values = lines('Scrolling words', v.values, 8, 'One per line. They scroll across the page under the photo.');
    var mEye = input('Small label', v.missionEyebrow), mTitle = input('Heading', v.missionTitle);
    var mission = paras('Text', v.mission, 14);
    var iEye = input('Small label', v.initsEyebrow), iTitle = input('Heading', v.initsTitle);
    return [
      h('section', { class: 'card' }, h('h2', {}, 'Top of the page'), kicker, headline, intro,
        h('div', { class: 'two' }, b1l, b1h), h('div', { class: 'two' }, b2l, b2h), video,
        h('p', { class: 'muted small' }, 'The slideshow photos and the photo beside the mission text are changed under Photos.')),
      h('section', { class: 'card' }, h('h2', {}, 'Scrolling words'), values),
      h('section', { class: 'card' }, h('h2', {}, 'Mission'), h('div', { class: 'two' }, mEye, mTitle), mission),
      h('section', { class: 'card' }, h('h2', {}, 'Initiatives heading'), h('div', { class: 'two' }, iEye, iTitle),
        h('p', { class: 'muted small' }, 'The three initiative cards are edited under Initiatives.'),
        actions('home', function () {
          return { kicker: kicker.input.value, headline: headline.input.value, intro: intro.input.value, video: video.input.value,
            button1: { label: b1l.input.value, href: b1h.input.value }, button2: { label: b2l.input.value, href: b2h.input.value },
            values: values.read(), missionEyebrow: mEye.input.value, missionTitle: mTitle.input.value, mission: mission.read(),
            initsEyebrow: iEye.input.value, initsTitle: iTitle.input.value };
        }, pages))
    ];
  }

  function pageBoard() {
    var v = data.content.board;
    var intro = area('Introduction', v.intro, 4);
    var members = itemList(v.members, { addLabel: 'Add board member', max: 24, blank: { name: '', role: 'Director', photo: '', bio: '' }, fields: [
      { key: 'photo', type: 'photo' },
      { key: 'name', label: 'Name' },
      { key: 'role', label: 'Role' },
      { key: 'bio', label: 'Profile', type: 'area', rows: 6, hint: 'Shown when a visitor selects this person.' }
    ] });
    var cta = input('Closing line (next to the Contact button)', v.cta);
    return [
      h('section', { class: 'card' }, h('h2', {}, 'Introduction'), intro),
      h('section', { class: 'card' }, h('h2', {}, 'Board members'), members.el,
        h('h3', {}, 'Closing line'), cta,
        actions('board', function () { return { intro: intro.input.value, members: members.read(), cta: cta.input.value }; }, pages))
    ];
  }

  function pageInits() {
    var v = data.content.inits;
    var oTitle = input('Heading', v.overviewTitle), oLead = input('Introduction', v.overviewLead);
    var statFields = [{ key: 'amount', label: 'Amount' }, { key: 'label', label: 'Title' }, { key: 'note', label: 'Note' }];
    var one = function (key, name) {
      var x = v[key];
      var f = { title: input('Title', x.title, {}, 'Also used on the home page cards, the tabs and the Donate page.'), lead: input('One-line summary', x.lead), intro: paras('Page text', x.intro, 8) };
      f.card = h('section', { class: 'card' }, h('h2', {}, name), f.title, f.lead, f.intro);
      f.read = function () { return { title: f.title.input.value, lead: f.lead.input.value, intro: f.intro.read() }; };
      return f;
    };
    var schol = one('schol', 'Scholarships page'), coach = one('coach', 'Coach page'), club = one('club', 'Club House page');
    var goals = lines('Bullet points', v.club.goals, 4);
    var raised = input('Amount raised so far ($)', String(v.club.raised), { inputmode: 'numeric' });
    var goal = input('Fundraising goal ($)', String(v.club.goal), { inputmode: 'numeric' }, 'The tracker fills in once the goal is above 0.');
    var match = input('Gift-matching line', v.club.matchText);
    add(club.card, [goals, h('h3', {}, 'Fund tracker'), h('div', { class: 'two' }, raised, goal), match]);
    var contribLead = area('Introduction', v.contribLead, 2);
    var contrib = itemList(v.contrib, { addLabel: 'Add total', max: 8, blank: { amount: '', label: '', note: '' }, fields: statFields });
    add(schol.card, [h('h3', {}, 'What Dnamo has contributed'), contribLead, contrib.el]);
    var kitLead = area('Introduction', v.kitLead, 3);
    var kit = itemList(v.kit, { addLabel: 'Add sponsorship', max: 8, blank: { amount: '', label: '', note: '' }, fields: statFields });
    return [
      h('section', { class: 'card' }, h('h2', {}, 'Overview page'), oTitle, oLead),
      schol.card, coach.card, club.card,
      h('section', { class: 'card' }, h('h2', {}, 'Kit sponsorship'), kitLead, kit.el,
        h('p', { class: 'muted small' }, 'The names in the top menu dropdown are edited under Header & footer.'),
        actions('inits', function () {
          var c = club.read();
          c.goals = goals.read(); c.raised = raised.input.value; c.goal = goal.input.value; c.matchText = match.input.value;
          return { overviewTitle: oTitle.input.value, overviewLead: oLead.input.value, schol: schol.read(), coach: coach.read(), club: c,
            contribLead: contribLead.input.value, contrib: contrib.read(), kitLead: kitLead.input.value, kit: kit.read() };
        }, pages))
    ];
  }

  function pageGiving() {
    var v = data.content.giving;
    var fund = function (x) {
      var f = { amounts: input('Amounts', amountsText(x.amounts), { inputmode: 'numeric' }, 'Whole dollars, separated by commas.'),
        def: input('Amount selected to start with', String(x.def), { inputmode: 'numeric' }) };
      f.el = h('div', { class: 'two' }, f.amounts, f.def);
      f.read = function () { return { amounts: amountsRead(f.amounts.input.value), def: Number(f.def.input.value) }; };
      return f;
    };
    var general = fund(v.general), club = fund(v.club);
    var payUrl = input('Donation form address', v.payUrl, { placeholder: 'https://' }, 'For example your Zeffy donation form.');
    var giftFields = [
      { key: 'title', label: 'Title' },
      { key: 'desc', label: 'Description' },
      { key: 'amounts', label: 'Amounts', type: 'amounts', hint: 'One amount is shown as a fixed price. Several are shown as choices.' },
      { key: 'short', label: 'Short name (button on the Donate page)' },
      { key: 'tag', label: 'Label shown in place of a price when there are several amounts' }
    ];
    var schol = itemList(v.schol, { fixed: true, fields: giftFields });
    var coach = itemList(v.coach, { fixed: true, fields: giftFields });
    return [
      h('section', { class: 'card' }, h('h2', {}, 'Payment page'),
        h('p', { class: 'muted' }, 'Where the "Continue to payment" button on the Donate page takes people. It opens in a new tab.'), payUrl),
      h('section', { class: 'card' }, h('h2', {}, 'Where it is needed most'), general.el),
      h('section', { class: 'card' }, h('h2', {}, 'Club House & Field fund'), club.el),
      h('section', { class: 'card' }, h('h2', {}, 'Scholarship gifts'),
        h('p', { class: 'muted' }, 'Shown on the Scholarships page and on the Donate page.'), schol.el),
      h('section', { class: 'card' }, h('h2', {}, 'Coach gifts'),
        h('p', { class: 'muted' }, 'Shown on the Coach page and on the Donate page. Visitors can also enter another amount.'), coach.el,
        actions('giving', function () { return { payUrl: payUrl.input.value, general: general.read(), club: club.read(), schol: schol.read(), coach: coach.read() }; }, pages))
    ];
  }

  function pageTestimonials() {
    var v = data.content.testimonials;
    var title = input('Heading', v.title), intro = input('Introduction', v.intro);
    var items = itemList(v.items, { addLabel: 'Add testimonial', max: 30, blank: { quote: '', name: '', role: '' }, fields: [
      { key: 'quote', label: 'What they said', type: 'area', rows: 3 },
      { key: 'name', label: 'Name' },
      { key: 'role', label: 'Who they are (player, parent, coach, partner)' }
    ] });
    return [
      h('section', { class: 'card' }, h('h2', {}, 'Heading'), title, intro),
      h('section', { class: 'card' }, h('h2', {}, 'Testimonials'), items.el,
        actions('testimonials', function () { return { title: title.input.value, intro: intro.input.value, items: items.read() }; }, pages))
    ];
  }

  /* ---------- Pop-ups ---------- */

  var pop = null;   // { popups, pages, frequencies } for the site being edited

  function popups() {
    paint(h('h1', {}, 'Pop-ups'), h('p', { class: 'lead' }, 'Loading...'));
    api('GET', '/sites/' + site.id + '/popups').then(function (d) {
      pop = d;
      if (section === 'popups') popupList();
    }).catch(function (err) { paint(h('h1', {}, 'Pop-ups'), h('p', { class: 'msg' }, err.message)); });
  }

  /* Where a pop-up stands right now: off, waiting for its start date, finished, or live */
  function popupState(p) {
    var t = Date.now() / 1000;
    if (!p.enabled) return { id: 'off', label: 'Off' };
    if (p.startsAt && p.startsAt > t) return { id: 'wait', label: 'Scheduled' };
    if (p.endsAt && p.endsAt <= t) return { id: 'done', label: 'Ended' };
    return { id: 'live', label: 'Live now' };
  }

  var two = function (n) { return (n < 10 ? '0' : '') + n; };
  /* Dates are stored as seconds; the date-and-time boxes work in the admin's own time zone */
  function toLocal(sec) {
    if (!sec) return '';
    var d = new Date(sec * 1000);
    return d.getFullYear() + '-' + two(d.getMonth() + 1) + '-' + two(d.getDate()) + 'T' + two(d.getHours()) + ':' + two(d.getMinutes());
  }
  function fromLocal(str) {
    if (!str) return null;
    var ms = new Date(str).getTime();
    return isNaN(ms) ? null : Math.floor(ms / 1000);
  }
  function niceDate(sec) {
    return new Date(sec * 1000).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  function popupSummary(p) {
    var where = p.pages === 'all' ? 'All pages' : pop.pages.filter(function (x) { return p.pages.indexOf(x.file) > -1; })
      .map(function (x) { return x.label; }).join(', ');
    var freq = (pop.frequencies.filter(function (f) { return f.id === p.frequency; })[0] || {}).label || '';
    var dates = p.startsAt && p.endsAt ? niceDate(p.startsAt) + ' to ' + niceDate(p.endsAt)
      : p.startsAt ? 'From ' + niceDate(p.startsAt)
      : p.endsAt ? 'Until ' + niceDate(p.endsAt) : 'No end date';
    return [where, freq, dates];
  }

  function popupList() {
    var status = h('span', { class: 'status', role: 'status' });
    var fail = function (err) { status.className = 'status bad'; status.textContent = err.message; };
    var rows = pop.popups.map(function (p) {
      var st = popupState(p);
      return h('div', { class: 'pop' },
        p.image ? h('img', { class: 'pop-img', src: p.image, alt: '' }) : h('div', { class: 'pop-img none', 'aria-hidden': 'true' }, 'No photo'),
        h('div', { class: 'pop-body' },
          h('div', { class: 'pop-head' }, h('strong', {}, p.title), h('span', { class: 'chip ' + st.id }, st.label)),
          h('p', { class: 'muted small' }, popupSummary(p).join(' · ')),
          h('div', { class: 'stack' },
            h('button', { class: 'btn small', type: 'button', onclick: function () { popupEdit(p); } }, 'Edit'),
            h('button', { class: 'btn ghost small', type: 'button', onclick: function () { window.DnamoPopup.show(p, { preview: true }); } }, 'Preview'),
            h('button', { class: 'btn ghost small', type: 'button', onclick: function () {
              var next = Object.assign({}, p, { enabled: !p.enabled });
              api('PUT', '/sites/' + site.id + '/popups/' + p.id, { popup: next }).then(popups, fail);
            } }, p.enabled ? 'Turn off' : 'Turn on'),
            h('button', { class: 'btn ghost small', type: 'button', onclick: function () {
              if (!window.confirm('Delete the pop-up "' + p.title + '"? This cannot be undone.')) return;
              api('DELETE', '/sites/' + site.id + '/popups/' + p.id, {}).then(popups, fail);
            } }, 'Delete'))));
    });
    paint(
      h('h1', {}, 'Pop-ups'),
      h('p', { class: 'lead' }, 'Small announcements that slide in at the bottom corner of a page, so visitors see what is coming without being interrupted. A visitor sees one at a time: the newest that is live.'),
      h('div', { class: 'actions flat' },
        h('button', { class: 'btn', type: 'button', onclick: function () { popupEdit(null); } }, 'New pop-up'), status),
      rows.length ? h('div', { class: 'pops' }, rows)
        : h('section', { class: 'card' }, h('p', { class: 'muted' }, 'No pop-ups yet. Create one to announce an event, a tryout date or a fundraiser.')));
  }

  function popupEdit(p) {
    var isNew = !p;
    p = p || { title: '', text: '', image: '', button: { label: '', href: '' }, pages: 'all', frequency: 'once', delay: 2, startsAt: null, endsAt: null, enabled: true };

    var title = input('Title', p.title, { maxlength: 80 });
    var text = area('Text', p.text, 4, 'Keep it short. Each new line starts a new paragraph.');
    text.input.setAttribute('maxlength', '600');

    var image = p.image || '';
    var thumb = h('div', { class: 'pop-photo' });
    var imgStatus = h('span', { class: 'status', role: 'status' });
    var drawThumb = function () {
      thumb.textContent = '';
      add(thumb, image ? h('img', { src: image, alt: '' }) : h('span', { class: 'muted small' }, 'No photo'));
      removeBtn.hidden = !image;
    };
    var file = h('input', { type: 'file', accept: 'image/*', hidden: true, onchange: function () {
      var chosen = file.files[0];
      if (!chosen) return;
      imgStatus.className = 'status'; imgStatus.textContent = 'Uploading...';
      prepare(chosen, 1200).then(function (blob) {
        return api('POST', '/sites/' + site.id + '/media', blob, { 'X-File-Name': encodeURIComponent(chosen.name) });
      }).then(function (m) {
        image = m.url; drawThumb();
        imgStatus.className = 'status ok'; imgStatus.textContent = 'Uploaded. Save to keep it.';
      }).catch(function (err) { imgStatus.className = 'status bad'; imgStatus.textContent = err.message; }).then(function () { file.value = ''; });
    } });
    var removeBtn = h('button', { class: 'btn ghost small', type: 'button', onclick: function () {
      image = ''; imgStatus.textContent = ''; drawThumb();
    } }, 'Remove photo');
    drawThumb();

    var bLabel = input('Button label', p.button.label, { maxlength: 40 }, 'Leave empty for no button.');
    var bHref = input('Button link', p.button.href, { list: 'pages' }, isFull() ? 'A page on this site or a full https:// address.' : 'A full https:// address, or a page on that site.');

    var all = h('input', { type: 'radio', name: 'where', checked: p.pages === 'all' });
    var some = h('input', { type: 'radio', name: 'where', checked: p.pages !== 'all' });
    var boxes = pop.pages.map(function (x) {
      var box = h('input', { type: 'checkbox', value: x.file, checked: p.pages !== 'all' && p.pages.indexOf(x.file) > -1 });
      return { box: box, el: h('label', { class: 'check' }, box, x.label) };
    });
    var pageBox = h('div', { class: 'checks' }, boxes.map(function (b) { return b.el; }));
    var syncWhere = function () { pageBox.hidden = all.checked; };
    all.addEventListener('change', syncWhere);
    some.addEventListener('change', syncWhere);
    syncWhere();

    var freq = h('select', {}, pop.frequencies.map(function (f) {
      return h('option', { value: f.id, selected: f.id === p.frequency }, f.label);
    }));
    var delay = input('Wait before showing (seconds)', String(p.delay), { type: 'number', min: 0, max: 60, step: 1 });
    var start = input('Start showing', toLocal(p.startsAt), { type: 'datetime-local' }, 'Leave empty to start right away.');
    var end = input('Stop showing', toLocal(p.endsAt), { type: 'datetime-local' }, 'Leave empty to keep it until you turn it off.');
    var enabled = h('input', { type: 'checkbox', checked: !!p.enabled });

    var read = function () {
      return {
        title: title.input.value, text: text.input.value, image: image,
        button: { label: bLabel.input.value, href: bHref.input.value },
        pages: all.checked || !isFull() ? 'all' : boxes.filter(function (b) { return b.box.checked; }).map(function (b) { return b.box.value; }),
        frequency: freq.value, delay: Number(delay.input.value || 0),
        startsAt: fromLocal(start.input.value), endsAt: fromLocal(end.input.value), enabled: enabled.checked
      };
    };

    var status = h('span', { class: 'status', role: 'status' });
    var saveBtn = h('button', { class: 'btn', type: 'button', onclick: function () {
      status.className = 'status'; status.textContent = 'Saving...';
      saveBtn.disabled = true;
      (isNew ? api('POST', '/sites/' + site.id + '/popups', { popup: read() })
        : api('PUT', '/sites/' + site.id + '/popups/' + p.id, { popup: read() })).then(popups, function (err) {
        status.className = 'status bad'; status.textContent = err.message;
        saveBtn.disabled = false;
      });
    } }, isNew ? 'Create pop-up' : 'Save changes');

    paint(
      h('h1', {}, isNew ? 'New pop-up' : 'Edit pop-up'),
      h('p', { class: 'lead' }, 'Use Preview to see it exactly as visitors will.'),
      h('section', { class: 'card' },
        h('h2', {}, 'What it says'),
        title, text,
        h('h3', {}, 'Photo (optional)'),
        h('div', { class: 'pop-photo-row' }, thumb,
          h('div', { class: 'stack' },
            h('button', { class: 'btn ghost small', type: 'button', onclick: function () { file.click(); } }, 'Choose photo'),
            removeBtn),
          imgStatus, file),
        h('h3', {}, 'Button (optional)'),
        h('div', { class: 'two' }, bLabel, bHref)),
      h('section', { class: 'card' },
        h('h2', {}, 'Where and how often'),
        isFull() ? [h('div', { class: 'checks' },
          h('label', { class: 'check' }, all, 'All pages'),
          h('label', { class: 'check' }, some, 'Only the pages I choose')),
        pageBox] : h('p', { class: 'muted' }, 'Shows on every page of ' + site.name + ' that has the pop-up line.'),
        h('div', { class: 'two', style: 'margin-top:16px' },
          h('label', { class: 'field' }, h('span', {}, 'How often a visitor sees it'), freq),
          delay)),
      h('section', { class: 'card' },
        h('h2', {}, 'When'),
        h('div', { class: 'two' }, start, end),
        h('p', { class: 'muted small' }, 'Times are in your own time zone.'),
        h('label', { class: 'check switch' }, enabled, 'Turned on'),
        h('div', { class: 'actions' },
          saveBtn,
          h('button', { class: 'btn ghost', type: 'button', onclick: function () {
            var v = read();
            if (!v.title.trim()) { status.className = 'status bad'; status.textContent = 'Add a title first.'; return; }
            window.DnamoPopup.show(v, { preview: true });
          } }, 'Preview'),
          h('button', { class: 'btn ghost', type: 'button', onclick: popupList }, 'Cancel'),
          status)));
    title.input.focus();
  }

  /* ---------- Shared: a box of text with a Copy button ---------- */

  function copyBox(value, rows) {
    var box = h('textarea', { class: 'copy-text', readonly: true, rows: rows || 2, spellcheck: 'false', 'aria-label': 'Text to copy' });
    box.value = value;
    box.addEventListener('focus', function () { box.select(); });
    var btn = h('button', { class: 'btn ghost small', type: 'button', onclick: function () {
      var done = function () { btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = 'Copy'; }, 1600); };
      var manual = function () { box.focus(); box.select(); try { document.execCommand('copy'); done(); } catch (e) {} };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(value).then(done, manual);
      else manual();
    } }, 'Copy');
    return h('div', { class: 'copy' }, box, btn);
  }

  var embedCode = function (s) {
    return '<script src="' + location.origin + '/embed/' + s.embedKey + '.js" async></scr' + 'ipt>';
  };
  /* A button that reports a failure next to itself */
  function statusLine() { return h('span', { class: 'status', role: 'status' }); }
  function bad(status) { return function (err) { status.className = 'status bad'; status.textContent = err.message; }; }

  /* ---------- Sites (owner) ---------- */

  function sites() {
    var cards = session.sites.map(function (s) {
      var full = s.kind === 'full';
      var name = input('Name in this admin', s.name, { maxlength: 80 });
      var address = input(full ? 'Web address (optional)' : 'Web address', s.hostnames.split(',').join(', '), { placeholder: 'www.example.org' },
        full ? 'The address this site is reached at, once it has its own domain.' : 'Where the site lives.');
      var status = statusLine();
      var saveBtn = h('button', { class: 'btn small', type: 'button', onclick: function () {
        status.className = 'status'; status.textContent = 'Saving...';
        api('PUT', '/sites/' + s.id, { name: name.input.value, address: address.input.value }).then(load, bad(status));
      } }, 'Save');
      var del = full ? null : h('button', { class: 'btn ghost small', type: 'button', onclick: function () {
        if (!window.confirm('Remove "' + s.name + '" from this admin? Its pop-ups and their photos are deleted. This cannot be undone.')) return;
        api('DELETE', '/sites/' + s.id, {}).then(load, bad(status));
      } }, 'Remove site');
      return h('section', { class: 'card' },
        h('div', { class: 'pop-head' }, h('h2', {}, s.name), h('span', { class: 'chip ' + (full ? 'live' : 'wait') }, full ? 'Hosted here' : 'Pop-ups only')),
        h('p', { class: 'muted' }, full ? 'Everything on this site can be edited: name, logo, menus, photos, page content and pop-ups.'
          : 'This site is hosted elsewhere. Pop-ups you make here show on it once the line below is added to its pages.'),
        h('div', { class: 'two' }, name, address),
        full ? null : [h('h3', {}, 'Line to add to the site'),
          h('p', { class: 'muted small' }, 'Paste it just before </body> on every page (or in the site builder’s "custom code" box). It only needs doing once.'),
          copyBox(embedCode(s), 2)],
        h('div', { class: 'actions' }, saveBtn, del, status));
    });

    var newName = input('Name', '', { maxlength: 80, placeholder: 'Dnamo Football Club' });
    var newAddress = input('Web address', '', { placeholder: 'www.example.org' });
    var addStatus = statusLine();
    paint(
      h('h1', {}, 'Sites'),
      h('p', { class: 'lead' }, 'The websites managed from this admin. Choose which one you are working on with the Site menu at the top.'),
      cards,
      h('section', { class: 'card' },
        h('h2', {}, 'Add a site'),
        h('p', { class: 'muted' }, 'For a website hosted somewhere else. You will get one line to add to it; after that, its pop-ups are made here.'),
        h('div', { class: 'two' }, newName, newAddress),
        h('div', { class: 'actions' },
          h('button', { class: 'btn', type: 'button', onclick: function () {
            addStatus.className = 'status'; addStatus.textContent = 'Adding...';
            api('POST', '/sites', { name: newName.input.value, address: newAddress.input.value }).then(function (res) {
              try { localStorage.setItem('dnamoAdminSite', String(res.site.id)); } catch (e) {}
              return load();
            }).catch(bad(addStatus));
          } }, 'Add site'), addStatus)));
  }

  /* ---------- Admins (owner) ---------- */

  var people = null;      // { users, invites, max }
  var freshLink = null;   // { text, link }: a one-time link just made, shown until the screen is left

  var joinLink = function (token) { return location.origin + location.pathname + '#join=' + token; };

  function admins() {
    paint(h('h1', {}, 'Admins'), h('p', { class: 'lead' }, 'Loading...'));
    api('GET', '/users').then(function (d) {
      people = d;
      if (section === 'admins') adminList();
    }).catch(function (err) { paint(h('h1', {}, 'Admins'), h('p', { class: 'msg' }, err.message)); });
  }

  function adminList() {
    var status = statusLine();
    var rows = people.users.map(function (u) {
      var me = u.id === session.user.id;
      return h('div', { class: 'person' },
        h('div', { class: 'person-body' },
          h('strong', {}, u.name + (me ? ' (you)' : '')),
          h('span', { class: 'muted small' }, u.email)),
        h('span', { class: 'chip' + (u.role === 'owner' ? ' live' : '') }, u.role === 'owner' ? 'Owner' : 'Admin'),
        me || u.role === 'owner' ? null : h('div', { class: 'stack' },
          h('button', { class: 'btn ghost small', type: 'button', onclick: function () {
            if (!window.confirm('Make a link that lets ' + u.name + ' choose a new password? Any earlier link stops working.')) return;
            api('POST', '/users/' + u.id + '/reset', {}).then(function (res) {
              freshLink = { text: 'Send this link to ' + u.name + '. It works once, for 24 hours.', link: joinLink(res.token) };
              admins();
            }, bad(status));
          } }, 'Password link'),
          h('button', { class: 'btn ghost small', type: 'button', onclick: function () {
            if (!window.confirm('Remove ' + u.name + '? They are signed out at once and can no longer sign in.')) return;
            api('DELETE', '/users/' + u.id, {}).then(admins, bad(status));
          } }, 'Remove')));
    });
    var waiting = people.invites.map(function (i) {
      return h('div', { class: 'person' },
        h('div', { class: 'person-body' },
          h('strong', {}, i.email),
          h('span', { class: 'muted small' }, (i.kind === 'invite' ? 'Invitation' : 'Password link') + ', works until ' + niceDate(i.expiresAt))),
        h('span', { class: 'chip wait' }, 'Waiting'),
        h('div', { class: 'stack' }, h('button', { class: 'btn ghost small', type: 'button', onclick: function () {
          api('DELETE', '/invites/' + i.id, {}).then(admins, bad(status));
        } }, 'Cancel link')));
    });

    var email = input('Their email', '', { type: 'email', autocomplete: 'off', placeholder: 'name@example.org' });
    var inviteStatus = statusLine();
    var link = freshLink;
    paint(
      h('h1', {}, 'Admins'),
      h('p', { class: 'lead' }, 'People who can sign in here. Admins can edit sites and pop-ups; only you, the owner, can manage sites and admins.'),
      link ? h('section', { class: 'card note' },
        h('h2', {}, 'Link ready'),
        h('p', {}, link.text),
        copyBox(link.link, 3),
        h('p', { class: 'muted small' }, 'It is shown only now. Send it privately (a text or email to that person); anyone who has it can use it.')) : null,
      h('section', { class: 'card' },
        h('h2', {}, 'Who has access'),
        h('div', { class: 'people' }, rows, waiting), status),
      h('section', { class: 'card' },
        h('h2', {}, 'Invite an admin'),
        h('p', { class: 'muted' }, 'You get a one-time link to send them. They open it, choose their own name and password, and are in. You never see their password.'),
        email,
        h('div', { class: 'actions' },
          h('button', { class: 'btn', type: 'button', onclick: function () {
            inviteStatus.className = 'status'; inviteStatus.textContent = 'Making the link...';
            api('POST', '/users/invite', { email: email.input.value }).then(function (res) {
              freshLink = { text: 'Send this link to ' + res.email + '. It works once, for 7 days.', link: joinLink(res.token) };
              admins();
            }, bad(inviteStatus));
          } }, 'Make invitation link'), inviteStatus)));
    freshLink = null;
  }

  /* ---------- My account ---------- */

  function account() {
    var current = input('Current password', '', { type: 'password', autocomplete: 'current-password' });
    var next = input('New password', '', { type: 'password', autocomplete: 'new-password' }, 'At least 12 characters.');
    var again = input('New password again', '', { type: 'password', autocomplete: 'new-password' });
    var status = statusLine();
    var btn = h('button', { class: 'btn', type: 'submit' }, 'Change password');
    var form = h('form', { novalidate: true, onsubmit: function (e) {
      e.preventDefault();
      if (next.input.value !== again.input.value) { bad(status)(new Error('The two new passwords do not match.')); return; }
      status.className = 'status'; status.textContent = 'Saving...';
      btn.disabled = true;
      api('POST', '/account/password', { current: current.input.value, password: next.input.value }).then(function () {
        form.reset();
        status.className = 'status ok'; status.textContent = 'Password changed. Other devices have been signed out.';
        btn.disabled = false;
      }, function (err) { bad(status)(err); btn.disabled = false; });
    } }, current, h('div', { class: 'two' }, next, again), h('div', { class: 'actions' }, btn, status));
    paint(
      h('h1', {}, 'My account'),
      h('p', { class: 'lead' }, session.user.name + ' · ' + session.user.email + ' · ' + (session.user.role === 'owner' ? 'Owner' : 'Admin')),
      h('section', { class: 'card' }, h('h2', {}, 'Change password'), form));
  }

  /* ---------- Opening a one-time link: a new admin joins, or a password is chosen again ---------- */

  function viewJoin(token) {
    var leave = function () {
      try { history.replaceState(null, '', location.pathname); } catch (e) { location.hash = ''; }
    };
    api('POST', '/join/check', { token: token }).then(function (info) {
      var reset = info.kind === 'reset';
      var hint = 'At least ' + info.minPassword + ' characters.';
      gateForm(reset ? 'Choose a new password' : 'Create your account', (reset ? 'For ' : 'You were invited as ') + info.email, [
        reset ? null : field('Your name', 'name', 'text', { autocomplete: 'name' }),
        field('Password', 'password', 'password', { autocomplete: 'new-password', minlength: info.minPassword }, hint)
      ], reset ? 'Save password' : 'Create account', function (data) {
        data.token = token;
        return api('POST', '/join', data).then(leave);
      });
    }).catch(function (err) {
      leave();
      show(h('main', { class: 'gate' }, h('div', { class: 'gate-card' },
        h('h1', {}, 'Link not valid'), h('p', { class: 'sub' }, err.message),
        h('button', { class: 'btn', type: 'button', onclick: load }, 'Go to sign in'))));
    });
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
        var show = g.name === 'Home slideshow';
        return h('section', { class: 'card' }, h('h2', {}, g.name),
          show ? h('p', { class: 'muted' }, 'The photos behind the headline on the home page. They fade from one to the next, in this order.') : null,
          h('div', { class: 'photos' }, g.slots.map(function (s) { return photoCard(s, photos); }), show ? extraSlides() : null));
      }));
  }

  /* Photos added to the home slideshow, after the built-in four: each can be removed, and one more can be added */
  var MAX_EXTRA = 8;
  function extraSlides() {
    var extra = data.content.photos.extra || [];
    var saveExtra = function (list, status) {
      var next = Object.assign({}, data.content.photos);
      if (list.length) next.extra = list; else delete next.extra;
      return save('photos', next, status).then(photos);
    };
    var cards = extra.map(function (url, i) {
      var status = h('span', { class: 'status', role: 'status' });
      return h('div', { class: 'photo' },
        h('div', { class: 'thumb' }, h('img', { src: url, alt: '', loading: 'lazy' })),
        h('div', { class: 'photo-body' },
          h('strong', {}, 'Slide ' + (i + 5)),
          h('span', { class: 'muted small' }, 'Added'),
          h('div', { class: 'stack' },
            h('button', { class: 'btn ghost small', type: 'button', onclick: function () {
              if (!window.confirm('Remove this photo from the slideshow?')) return;
              saveExtra(extra.filter(function (u, j) { return j !== i; }), status).catch(function () {});
            } }, 'Remove')),
          status));
    });
    if (extra.length < MAX_EXTRA) {
      var addStatus = h('span', { class: 'status', role: 'status' });
      var file = h('input', { type: 'file', accept: 'image/*', hidden: true, onchange: function () {
        var f = file.files[0];
        if (!f) return;
        addStatus.className = 'status';
        addStatus.textContent = 'Uploading...';
        prepare(f, 2000).then(function (blob) {
          return api('POST', '/sites/' + site.id + '/media', blob, { 'X-File-Name': encodeURIComponent(f.name) });
        }).then(function (m) {
          return saveExtra(extra.concat([m.url]), addStatus);
        }).catch(function (err) {
          addStatus.className = 'status bad';
          addStatus.textContent = err.message;
          file.value = '';
        });
      } });
      cards.push(h('div', { class: 'photo add' },
        h('button', { class: 'add-photo', type: 'button', onclick: function () { file.click(); } },
          h('span', { class: 'plus', 'aria-hidden': 'true' }, '+'), 'Add a photo'),
        h('div', { class: 'photo-body' },
          h('span', { class: 'muted small' }, extra.length ? (MAX_EXTRA - extra.length) + ' more can be added.' : 'Up to ' + MAX_EXTRA + ' extra photos. A wide photo works best.'),
          addStatus, file)));
    }
    return cards;
  }

  /* ---------- Start ---------- */

  function load() {
    return api('GET', '/state').then(function (state) {
      var join = /^#join=([0-9a-f]{64})$/.exec(location.hash);
      if (join && state.view === 'login') { viewJoin(join[1]); return; }
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
