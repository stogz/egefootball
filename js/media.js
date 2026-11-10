/* ==========================================================================
   EGE Football — Media (#media)
   The tweet generator (Sam, 2026-11-10), from the one on Sam's old NBA
   site: type a tweet, pick who it is from, and Post draws it as a picture
   and sends it to the trades bot's Discord channel.

   The card on the page is the tweet itself: the account at the top opens
   the account menu, the text is typed straight into it, and a picture can
   go under the text. Post draws exactly that on a canvas (draw), puts the
   PNG in Supabase Storage's public `media` bucket under the poster's user
   id, and asks post_tweet (supabase/schema.sql) to send it to the trades
   bot's webhook, which no player can read. An admin's browser posts it
   itself when the database has no pg_net to do it with.

   Accounts: a player's own account -- their name, a handle made from it
   and their headshot until they change them -- is the only one of theirs
   with the blue check. Any other they make is unverified, unless an admin
   made it and ticked Verified. Admins also get the presets in
   data/media.js (NFL, ESPN, NBC Sports), verified and not editable. All of
   a player's accounts are rows of media_accounts, read and written only by
   them; the own account is a row only once it has been changed.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.mediaView = (function () {
  'use strict';

  var ACCOUNTS = 'media_accounts';
  var BUCKET = 'media';
  var MAX_TEXT = 280;
  var MAX_ALTS = 12;
  var CHOSEN_KEY = 'ege.mediaAccount';

  /* The tweet's own look, X's light theme, kept apart from the site's. */
  var WIDTH = 598;
  var PAD = 16;
  var PFP = 48;
  var SCALE = 2;
  var FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  var INK = '#0f1419';
  var GREY = '#536471';
  var RULE = '#eff3f4';
  var EDGE = '#cfd9de';
  var BLUE = '#1d9bf0';
  var GOLD = '#e2b719';
  var BACKDROP = '#e1eecc';   /* behind a headshot, as in the nav */

  var PATHS = {
    badge: 'M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z',
    reply: 'M14.046 2.242l-4.148-.01h-.002c-4.374 0-7.8 3.427-7.8 7.802 0 4.098 3.186 7.206 7.465 7.37v3.828c0 .108.044.286.12.403.142.225.384.347.632.347.138 0 .277-.038.402-.118.264-.168 6.473-4.14 8.088-5.506 1.902-1.61 3.04-3.97 3.043-6.312v-.017c-.006-4.367-3.43-7.787-7.8-7.788zm3.787 12.972c-1.134.96-4.862 3.405-6.772 4.643V16.67c0-.414-.335-.75-.75-.75h-.396c-3.66 0-6.318-2.476-6.318-5.886 0-3.534 2.768-6.302 6.3-6.302l4.147.01h.002c3.532 0 6.3 2.766 6.302 6.296-.003 1.91-.942 3.844-2.514 5.176z',
    repost: 'M23.77 15.67c-.292-.293-.767-.293-1.06 0l-2.22 2.22V7.65c0-2.068-1.683-3.75-3.75-3.75h-5.85c-.414 0-.75.336-.75.75s.336.75.75.75h5.85c1.24 0 2.25 1.01 2.25 2.25v10.24l-2.22-2.22c-.293-.293-.768-.293-1.06 0s-.294.768 0 1.06l3.5 3.5c.145.147.337.22.53.22s.383-.072.53-.22l3.5-3.5c.294-.292.294-.767 0-1.06zm-10.66 3.28H7.26c-1.24 0-2.25-1.01-2.25-2.25V6.46l2.22 2.22c.148.147.34.22.532.22s.384-.073.53-.22c.293-.293.293-.768 0-1.06l-3.5-3.5c-.293-.294-.768-.294-1.06 0l-3.5 3.5c-.294.292-.294.767 0 1.06s.767.293 1.06 0l2.22-2.22V16.7c0 2.068 1.683 3.75 3.75 3.75h5.85c.414 0 .75-.336.75-.75s-.337-.75-.75-.75z',
    like: 'M12 21.638h-.014C9.403 21.59 1.95 14.856 1.95 8.478c0-3.064 2.525-5.754 5.403-5.754 2.29 0 3.83 1.58 4.646 2.73.814-1.148 2.354-2.73 4.645-2.73 2.88 0 5.404 2.69 5.404 5.755 0 6.376-7.454 13.11-10.037 13.157H12zM7.354 4.225c-2.08 0-3.903 1.988-3.903 4.255 0 5.74 7.034 11.596 8.55 11.658 1.518-.062 8.55-5.917 8.55-11.658 0-2.267-1.823-4.255-3.903-4.255-2.528 0-3.94 2.936-3.952 2.965-.23.562-1.156.562-1.387 0-.014-.03-1.425-2.965-3.954-2.965z',
    share: 'M17.53 7.47l-5-5c-.293-.293-.768-.293-1.06 0l-5 5c-.294.293-.294.768 0 1.06s.767.294 1.06 0l3.72-3.72V15c0 .414.336.75.75.75s.75-.336.75-.75V4.81l3.72 3.72c.146.147.338.22.53.22s.384-.072.53-.22c.293-.293.293-.767 0-1.06zM19.708 21.944H4.292C3.028 21.944 2 20.916 2 19.652V14c0-.414.336-.75.75-.75s.75.336.75.75v5.652c0 .437.355.792.792.792h15.416c.437 0 .792-.355.792-.792V14c0-.414.336-.75.75-.75s.75.336.75.75v5.652c0 1.264-1.028 2.292-2.292 2.292z'
  };
  var ACTIONS = ['reply', 'repost', 'like', 'share'];

  var state = {
    email: null,          /* whose accounts are loaded */
    loading: null,
    rows: [],             /* media_accounts rows */
    chosen: null,         /* the id tweeted as */
    picture: null,        /* { img, url } under the text */
    posting: false
  };

  var built = false;
  var nodes = {};

  /* --- small things -------------------------------------------------------- */

  function $(id) { return document.getElementById(id); }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text != null) { node.textContent = text; }
    return node;
  }

  function svg(name, className, size) {
    var ns = 'http://www.w3.org/2000/svg';
    var out = document.createElementNS(ns, 'svg');
    out.setAttribute('viewBox', '0 0 24 24');
    out.setAttribute('aria-hidden', 'true');
    if (size) { out.setAttribute('width', size); out.setAttribute('height', size); }
    if (className) { out.setAttribute('class', className); }
    var path = document.createElementNS(ns, 'path');
    path.setAttribute('d', PATHS[name]);
    out.appendChild(path);
    return out;
  }

  function client() { return EGE.auth.supabaseClient(); }
  function player() { return EGE.auth.currentPlayer(); }
  function admin() { return Boolean(EGE.wallet && EGE.wallet.admin()); }

  function remember(id) {
    try { window.localStorage.setItem(CHOSEN_KEY, id); } catch (e) { /* storage blocked */ }
  }
  function remembered() {
    try { return window.localStorage.getItem(CHOSEN_KEY); } catch (e) { return null; }
  }

  function say(text) {
    nodes.message.textContent = text || '';
    nodes.message.hidden = !text;
  }

  /* --- the accounts -------------------------------------------------------- */

  function handleFrom(name) {
    return String(name || '').replace(/[^A-Za-z0-9_]/g, '').slice(0, 15) || 'EGE';
  }

  function ownAccount() {
    var p = player();
    var row = state.rows.filter(function (r) { return r.own; })[0];
    return {
      id: 'own',
      kind: 'own',
      row: row || null,
      name: row ? row.name : p.name,
      handle: row ? row.handle : handleFrom(p.name),
      photo: row && row.photo ? row.photo : p.headshot,
      headshot: !(row && row.photo),
      verified: true
    };
  }

  function altAccounts() {
    return state.rows.filter(function (r) { return !r.own; }).map(function (r) {
      return { id: r.id, kind: 'alt', row: r, name: r.name, handle: r.handle,
               photo: r.photo || null, verified: Boolean(r.verified) };
    });
  }

  function presetAccounts() {
    if (!admin()) { return []; }
    return (EGE.mediaPresets || []).map(function (p) {
      return { id: p.id, kind: 'preset', name: p.name, handle: p.handle, photo: p.photo,
               verified: true, org: Boolean(p.org) };
    });
  }

  function allAccounts() {
    return [ownAccount()].concat(altAccounts(), presetAccounts());
  }

  function chosenAccount() {
    var all = allAccounts();
    return all.filter(function (a) { return a.id === state.chosen; })[0] || all[0];
  }

  function load(email) {
    var c = client();
    if (!c) { state.rows = []; return Promise.resolve(); }
    return c.from(ACCOUNTS).select('id, own, name, handle, photo, verified, created_at')
      .eq('email', email)
      .order('created_at', { ascending: true })
      .then(function (res) {
        if (res.error) {
          say(/media_accounts/.test(res.error.message || '')
            ? 'Run supabase/schema.sql again to make accounts.'
            : res.error.message);
          state.rows = [];
          return;
        }
        state.rows = res.data || [];
      })
      .catch(function () { state.rows = []; });
  }

  /* Saves the account the editor holds: a new one, a change to one, or the
     own account's first change, which makes its row. */
  function saveAccount(account, fields) {
    var c = client();
    if (!c) { return Promise.resolve({ ok: false, message: 'Supabase is not reachable.' }); }
    var p = player();
    var data = {
      name: fields.name,
      handle: fields.handle,
      photo: fields.photo || null,
      verified: account && account.kind === 'own' ? false : Boolean(fields.verified && admin()),
      updated_at: new Date().toISOString()
    };
    var query;
    if (account && account.row) {
      query = c.from(ACCOUNTS).update(data).eq('id', account.row.id);
    } else {
      data.email = p.email;
      data.own = Boolean(account && account.kind === 'own');
      query = c.from(ACCOUNTS).insert(data).select('id').single();
    }
    return query.then(function (res) {
      if (res.error) {
        var m = res.error.message || 'That did not save.';
        if (/media_accounts/.test(m) && /exist|relation/.test(m)) { m = 'Run supabase/schema.sql again first.'; }
        if (/row-level security/.test(m)) { m = 'Only an admin can make a verified account.'; }
        return { ok: false, message: m };
      }
      return { ok: true, id: res.data && res.data.id };
    }).catch(function (e) { return { ok: false, message: e.message }; });
  }

  function deleteAccount(account) {
    var c = client();
    if (!c || !account.row) { return Promise.resolve({ ok: false, message: 'Nothing to delete.' }); }
    return c.from(ACCOUNTS).delete().eq('id', account.row.id).then(function (res) {
      return res.error ? { ok: false, message: res.error.message } : { ok: true };
    });
  }

  /* --- pictures ------------------------------------------------------------ */

  var images = {};

  function loadImage(src) {
    if (!images[src]) {
      images[src] = new Promise(function (resolve, reject) {
        var img = new Image();
        img.decoding = 'async';
        img.onload = function () { resolve(img); };
        img.onerror = function () { delete images[src]; reject(new Error('That picture would not load.')); };
        img.src = src;
      });
    }
    return images[src];
  }

  /* An account's picture as a square, the way the tweet shows it. A
     headshot is cut out on a see-through ground, so it gets the nav's sage
     behind it and is cropped to the face. Anything else fills the square. */
  var faces = {};

  function faceOf(account) {
    var src = account.photo;
    if (!src) { return Promise.resolve(blankFace()); }
    var key = (account.headshot ? 'h:' : '') + src;
    if (!faces[key]) {
      faces[key] = loadImage(src).then(function (img) {
        var size = 192;
        var canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        var ctx = canvas.getContext('2d');
        var w = img.naturalWidth;
        var h = img.naturalHeight;
        var side, sx, sy;
        if (account.headshot) {
          ctx.fillStyle = BACKDROP;
          ctx.fillRect(0, 0, size, size);
          side = Math.min(w, h) * 0.8;
          sx = (w - side) / 2;
          sy = h * 0.04;
        } else {
          side = Math.min(w, h);
          sx = (w - side) / 2;
          sy = (h - side) / 2;
        }
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
        return canvas;
      }).catch(function () { delete faces[key]; return null; });
    }
    return faces[key];
  }

  /* An account with no picture gets X's grey one: a head and shoulders. */
  var blank = null;

  function blankFace() {
    if (blank) { return blank; }
    var size = 192;
    blank = document.createElement('canvas');
    blank.width = size;
    blank.height = size;
    var ctx = blank.getContext('2d');
    ctx.fillStyle = EDGE;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(size / 2, size * 0.4, size * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(size / 2, size * 0.98, size * 0.36, size * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
    return blank;
  }

  /* --- the crop menu ------------------------------------------------------

     A profile picture picked from the device opens here first (Sam,
     2026-11-10): drag it about under the circle, zoom with the slider, a
     pinch or the wheel, and Done keeps what is in the circle. It opens at
     once, saying it is loading, since a phone's photo can take a moment to
     open. Resolves with the square as a JPEG small enough to keep in the
     account's row -- 256 across, twice what the tweet draws -- or null
     when it is cancelled. */
  var CROP_OUT = 256;
  var CROP_MAX_ZOOM = 4;
  var crop = null;

  function cropOpen() { return Boolean(crop); }

  function closeCrop(result) {
    if (!crop) { return; }
    var open = crop;
    crop = null;
    document.removeEventListener('keydown', open.onKey, true);
    open.root.remove();
    if (open.url) { URL.revokeObjectURL(open.url); }
    if (open.back) { open.back.focus(); }
    open.resolve(result);
  }

  function openCrop(file, back) {
    closeCrop(null);
    return new Promise(function (resolve) {
      var root = el('div', 'ege-pfpcrop');
      root.setAttribute('role', 'dialog');
      root.setAttribute('aria-modal', 'true');
      root.setAttribute('aria-label', 'Crop the picture');
      var panel = el('div', 'ege-pfpcrop__panel');
      var stage = el('div', 'ege-pfpcrop__stage');
      var status = el('p', 'ege-pfpcrop__status', 'Loading\u2026');
      status.setAttribute('role', 'status');
      stage.appendChild(status);
      var ring = el('div', 'ege-pfpcrop__ring');
      ring.hidden = true;
      stage.appendChild(ring);

      var zoom = el('input', 'ege-pfpcrop__zoom');
      zoom.type = 'range';
      zoom.min = '1';
      zoom.max = String(CROP_MAX_ZOOM);
      zoom.step = '0.01';
      zoom.value = '1';
      zoom.disabled = true;
      zoom.setAttribute('aria-label', 'Zoom');

      var foot = el('div', 'ege-pfpcrop__foot');
      var cancel = el('button', 'fb-btn', 'Cancel');
      cancel.type = 'button';
      var done = el('button', 'fb-btn fb-btn--primary', 'Done');
      done.type = 'button';
      done.disabled = true;
      foot.appendChild(cancel);
      foot.appendChild(done);

      panel.appendChild(stage);
      panel.appendChild(zoom);
      panel.appendChild(foot);
      root.appendChild(panel);
      document.body.appendChild(root);

      var state = { w: 0, h: 0, z: 1, cx: 0, cy: 0 };
      var img = null;

      crop = {
        root: root,
        resolve: resolve,
        back: back || null,
        url: null,
        onKey: function (e) {
          if (e.key !== 'Escape') { return; }
          e.stopPropagation();
          closeCrop(null);
        }
      };
      var mine = crop;
      document.addEventListener('keydown', crop.onKey, true);
      cancel.addEventListener('click', function () { closeCrop(null); });
      root.addEventListener('click', function (e) { if (e.target === root) { closeCrop(null); } });
      cancel.focus();

      function side() { return stage.clientWidth || 1; }
      function scale() { return side() / Math.min(state.w, state.h) * state.z; }

      /* Keeps the circle's square inside the picture. */
      function clamp() {
        var half = Math.min(state.w, state.h) / (2 * state.z);
        state.cx = Math.min(state.w - half, Math.max(half, state.cx));
        state.cy = Math.min(state.h - half, Math.max(half, state.cy));
      }

      function draw() {
        if (!img) { return; }
        clamp();
        var k = scale();
        var s = side();
        img.style.transform = 'translate(' + (s / 2 - state.cx * k) + 'px, ' +
                              (s / 2 - state.cy * k) + 'px) scale(' + k + ')';
        zoom.value = String(state.z);
      }

      /* Zooms keeping the point under (px, py), in the stage, where it is. */
      function zoomTo(z, px, py) {
        var s = side();
        var before = scale();
        if (px == null) { px = s / 2; py = s / 2; }
        var ix = state.cx + (px - s / 2) / before;
        var iy = state.cy + (py - s / 2) / before;
        state.z = Math.min(CROP_MAX_ZOOM, Math.max(1, z));
        var after = scale();
        state.cx = ix - (px - s / 2) / after;
        state.cy = iy - (py - s / 2) / after;
        draw();
      }

      function fail(message) {
        status.textContent = message;
        status.hidden = false;
      }

      var url = URL.createObjectURL(file);
      mine.url = url;
      var picture = new Image();
      picture.className = 'ege-pfpcrop__img';
      picture.alt = '';
      picture.draggable = false;
      picture.onerror = function () { if (crop === mine) { fail('That picture would not open.'); } };
      picture.onload = function () {
        if (crop !== mine) { return; }
        img = picture;
        state.w = img.naturalWidth;
        state.h = img.naturalHeight;
        state.cx = state.w / 2;
        state.cy = state.h / 2;
        img.style.width = state.w + 'px';
        img.style.height = state.h + 'px';
        stage.insertBefore(img, ring);
        status.hidden = true;
        ring.hidden = false;
        zoom.disabled = false;
        done.disabled = false;
        draw();
      };
      if (!/^image\//.test(file.type || '')) { fail('Pick a picture.'); } else { picture.src = url; }

      zoom.addEventListener('input', function () { zoomTo(Number(zoom.value)); });

      stage.addEventListener('wheel', function (e) {
        if (!img) { return; }
        e.preventDefault();
        var box = stage.getBoundingClientRect();
        zoomTo(state.z * Math.exp(-e.deltaY * 0.0015), e.clientX - box.left, e.clientY - box.top);
      }, { passive: false });

      /* One finger or the mouse drags; two pinch. */
      var pointers = {};
      stage.addEventListener('pointerdown', function (e) {
        if (!img) { return; }
        e.preventDefault();
        stage.setPointerCapture(e.pointerId);
        pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
        stage.classList.add('is-dragging');
      });
      stage.addEventListener('pointermove', function (e) {
        var was = pointers[e.pointerId];
        if (!was || !img) { return; }
        var now = { x: e.clientX, y: e.clientY };
        var ids = Object.keys(pointers);
        if (ids.length === 1) {
          var k = scale();
          state.cx -= (now.x - was.x) / k;
          state.cy -= (now.y - was.y) / k;
          draw();
        } else if (ids.length === 2) {
          var other = pointers[ids[0] === String(e.pointerId) ? ids[1] : ids[0]];
          var apart = Math.hypot(was.x - other.x, was.y - other.y);
          if (apart > 0) {
            var box = stage.getBoundingClientRect();
            zoomTo(state.z * Math.hypot(now.x - other.x, now.y - other.y) / apart,
                   (now.x + other.x) / 2 - box.left, (now.y + other.y) / 2 - box.top);
          }
        }
        pointers[e.pointerId] = now;
      });
      function lift(e) {
        delete pointers[e.pointerId];
        if (!Object.keys(pointers).length) { stage.classList.remove('is-dragging'); }
      }
      stage.addEventListener('pointerup', lift);
      stage.addEventListener('pointercancel', lift);

      done.addEventListener('click', function () {
        if (!img) { return; }
        var size = Math.min(state.w, state.h) / state.z;
        var canvas = document.createElement('canvas');
        canvas.width = CROP_OUT;
        canvas.height = CROP_OUT;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, CROP_OUT, CROP_OUT);
        ctx.drawImage(img, state.cx - size / 2, state.cy - size / 2, size, size, 0, 0, CROP_OUT, CROP_OUT);
        var out = canvas.toDataURL('image/jpeg', 0.86);
        if (out.length > 78000) { out = canvas.toDataURL('image/jpeg', 0.7); }
        closeCrop(out);
      });
    });
  }

  /* A picture for under the text, cut down to 1600 across at most. */
  function pictureFromFile(file) {
    return readFile(file).then(loadPicked).then(function (img) {
      var most = 1600;
      var ratio = Math.min(1, most / Math.max(img.naturalWidth, img.naturalHeight));
      if (ratio === 1) { return { img: img, url: img.src }; }
      var canvas = document.createElement('canvas');
      canvas.width = Math.round(img.naturalWidth * ratio);
      canvas.height = Math.round(img.naturalHeight * ratio);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      var url = canvas.toDataURL('image/jpeg', 0.9);
      return loadPicked(url).then(function (small) { return { img: small, url: url }; });
    });
  }

  function readFile(file) {
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\//.test(file.type)) { reject(new Error('Pick a picture.')); return; }
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = function () { reject(new Error('That picture would not open.')); };
      reader.readAsDataURL(file);
    });
  }

  function loadPicked(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error('That picture would not open.')); };
      img.src = src;
    });
  }

  /* --- the tweet, drawn ------------------------------------------------------ */

  function font(size, weight) { return (weight || 400) + ' ' + size + 'px ' + FONT; }

  /* A handle, a hashtag or a link is blue, as on X. */
  var LINKY = /^([@#][A-Za-z0-9_]+|https?:\/\/\S+)(.*)$/;

  function pieces(word) {
    var hit = LINKY.exec(word);
    if (!hit) { return [{ text: word, color: INK }]; }
    var out = [{ text: hit[1], color: BLUE }];
    if (hit[2]) { out.push({ text: hit[2], color: INK }); }
    return out;
  }

  /* The text as lines of words, wrapped to `width` the way the box on the
     page wraps it: at spaces, and through a word too long for a line. */
  function wrap(ctx, text, width) {
    var lines = [];
    String(text || '').replace(/\s+$/, '').split('\n').forEach(function (para) {
      var line = [];
      var used = 0;
      (para.match(/\S+|\s+/g) || []).forEach(function (token) {
        var w = ctx.measureText(token).width;
        if (/^\s/.test(token)) {
          if (line.length) { line.push(token); used += w; }
          return;
        }
        if (used + w <= width) { line.push(token); used += w; return; }
        if (line.length) {
          while (line.length && /^\s/.test(line[line.length - 1])) { line.pop(); }
          lines.push(line);
          line = [];
          used = 0;
        }
        while (ctx.measureText(token).width > width) {
          var n = token.length - 1;
          while (n > 1 && ctx.measureText(token.slice(0, n)).width > width) { n -= 1; }
          lines.push([token.slice(0, n)]);
          token = token.slice(n);
        }
        line.push(token);
        used = ctx.measureText(token).width;
      });
      lines.push(line);
    });
    if (lines.length === 1 && !lines[0].length) { return []; }
    return lines;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function icon(ctx, name, x, y, size, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size / 24, size / 24);
    ctx.fillStyle = color;
    ctx.fill(new Path2D(PATHS[name]));
    ctx.restore();
  }

  /* The picture under the text: as wide as the text, as tall as it is up to
     five fourths of its width, cropped to the middle past that. */
  function pictureBox(picture, inner) {
    var ratio = picture.img.naturalHeight / picture.img.naturalWidth;
    return { w: inner, h: Math.round(inner * Math.min(ratio, 1.25)) };
  }

  /* Lays the tweet out and, given a context to draw on, draws it. Returns
     the height either way, so it runs once to size the canvas and again to
     paint it. */
  function paint(ctx, tweet, face, drawing) {
    var inner = WIDTH - PAD * 2;
    var y = PAD;

    if (drawing) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, WIDTH, ctx.canvas.height / SCALE);

      /* The picture: round, or a rounded square for an organisation. */
      ctx.save();
      if (tweet.org) { roundRect(ctx, PAD, y, PFP, PFP, 6); } else {
        ctx.beginPath();
        ctx.arc(PAD + PFP / 2, y + PFP / 2, PFP / 2, 0, Math.PI * 2);
      }
      ctx.clip();
      ctx.fillStyle = RULE;
      ctx.fillRect(PAD, y, PFP, PFP);
      if (face) { ctx.drawImage(face, PAD, y, PFP, PFP); }
      ctx.restore();

      var x = PAD + PFP + 12;
      ctx.textBaseline = 'alphabetic';
      ctx.font = font(15, 700);
      ctx.fillStyle = INK;
      var room = inner - PFP - 12 - 30 - (tweet.verified ? 22 : 0);
      var name = fitText(ctx, tweet.name, room);
      ctx.fillText(name, x, y + 20);
      if (tweet.verified) {
        icon(ctx, 'badge', x + ctx.measureText(name).width + 3, y + 3.5, 19, tweet.org ? GOLD : BLUE);
      }
      ctx.font = font(15);
      ctx.fillStyle = GREY;
      ctx.fillText('@' + tweet.handle, x, y + 41);

      /* The "more" dots, top right. */
      ctx.fillStyle = GREY;
      [5, 12, 19].forEach(function (cx) {
        ctx.beginPath();
        ctx.arc(WIDTH - PAD - 19 + cx * 19 / 24, y + 2 + 12 * 19 / 24, 2 * 19 / 24, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    y += PFP + 12;

    ctx.font = font(17);
    var lines = wrap(ctx, tweet.text, inner);
    lines.forEach(function (line) {
      if (drawing) {
        var at = PAD;
        line.forEach(function (word) {
          pieces(word).forEach(function (part) {
            ctx.fillStyle = part.color;
            ctx.fillText(part.text, at, y + 18);
            at += ctx.measureText(part.text).width;
          });
        });
      }
      y += 24;
    });

    if (tweet.picture) {
      y += lines.length ? 12 : 0;
      var box = pictureBox(tweet.picture, inner);
      if (drawing) {
        var img = tweet.picture.img;
        var iw = img.naturalWidth;
        var ih = img.naturalHeight;
        var sh = Math.min(ih, iw * box.h / box.w);
        ctx.save();
        roundRect(ctx, PAD, y, box.w, box.h, 16);
        ctx.clip();
        ctx.drawImage(img, 0, (ih - sh) / 2, iw, sh, PAD, y, box.w, box.h);
        ctx.restore();
        roundRect(ctx, PAD + 0.5, y + 0.5, box.w - 1, box.h - 1, 16);
        ctx.strokeStyle = EDGE;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      y += box.h;
    }

    /* No time or date under it (Sam, 2026-11-10): straight to the rule
       over the buttons. */
    y += 16;

    if (drawing) {
      ctx.fillStyle = RULE;
      ctx.fillRect(PAD, y, inner, 1);
    }
    y += 1 + 12;

    if (drawing) {
      var slot = inner / ACTIONS.length;
      ACTIONS.forEach(function (name, i) {
        icon(ctx, name, PAD + slot * i + (slot - 22.5) / 2, y, 22.5, GREY);
      });
    }
    y += 22.5 + 12;

    return Math.ceil(y);
  }

  function fitText(ctx, text, width) {
    if (ctx.measureText(text).width <= width) { return text; }
    var cut = text;
    while (cut.length > 1 && ctx.measureText(cut + '…').width > width) { cut = cut.slice(0, -1); }
    return cut + '…';
  }

  /* The tweet as a canvas, twice the size it shows at. */
  function draw(tweet) {
    return faceOf(tweet.account).then(function (face) {
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');
      ctx.scale(SCALE, SCALE);
      var height = paint(ctx, tweet, face, false);
      canvas.width = WIDTH * SCALE;
      canvas.height = height * SCALE;
      ctx = canvas.getContext('2d');
      ctx.scale(SCALE, SCALE);
      paint(ctx, tweet, face, true);
      return canvas;
    });
  }

  function currentTweet() {
    var account = chosenAccount();
    return {
      account: account,
      name: account.name,
      handle: account.handle,
      verified: account.verified,
      org: Boolean(account.org),
      text: nodes.text.value.slice(0, MAX_TEXT),
      picture: state.picture
    };
  }

  /* --- posting -------------------------------------------------------------- */

  function toBlob(canvas) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (blob) { resolve(blob); } else { reject(new Error('The tweet would not draw.')); }
      }, 'image/png');
    });
  }

  function userId() {
    return client().auth.getSession().then(function (res) {
      var session = res && res.data && res.data.session;
      if (!session || !session.user || !session.user.id) { throw new Error('Sign in again first.'); }
      return session.user.id;
    });
  }

  function upload(blob) {
    var c = client();
    return userId().then(function (uid) {
      var path = uid + '/' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8) + '.png';
      var bucket = c.storage.from(BUCKET);
      return bucket.upload(path, blob, { contentType: 'image/png', cacheControl: '31536000', upsert: false })
        .then(function (res) {
          if (res.error) {
            var m = res.error.message || 'The picture did not upload.';
            throw new Error(/bucket/i.test(m) ? 'Run supabase/schema.sql again first: there is no media bucket.' : m);
          }
          return bucket.getPublicUrl(path).data.publicUrl;
        });
    });
  }

  /* Through post_tweet, which holds the webhook. An admin's own browser
     posts it when the database cannot (no pg_net). */
  function send(url, tweet) {
    return client().rpc('post_tweet', {
      p_image: url,
      p_name: tweet.name,
      p_handle: tweet.handle,
      p_text: tweet.text || null
    }).then(function (res) {
      if (!res.error) { return; }
      var m = res.error.message || 'The trades bot did not post it.';
      if (/pg_net/.test(m) && EGE.wallet.realAdmin()) {
        return EGE.wallet.postMediaToDiscord(payloadFor(url)).then(function (out) {
          if (!out.ok) { throw new Error(out.message || 'The trades bot did not post it.'); }
          if (out.skipped) { throw new Error('The trades bot has no webhook yet.'); }
        });
      }
      if (/post_tweet/.test(m)) { m = 'Run supabase/schema.sql again first.'; }
      throw new Error(m);
    });
  }

  /* The picture alone, not in an embed (Sam, 2026-11-10): a message that
     is nothing but an image's address shows as that image. */
  function payloadFor(url) {
    return { content: url };
  }

  function post() {
    if (state.posting) { return; }
    var tweet = currentTweet();
    if (!tweet.text.trim() && !tweet.picture) { return; }
    state.posting = true;
    say('');
    refreshPost();
    nodes.post.textContent = 'Posting…';
    draw(tweet)
      .then(toBlob)
      .then(upload)
      .then(function (url) { return send(url, tweet); })
      .then(function () {
        nodes.text.value = '';
        setPicture(null);
        fitBox();
        nodes.post.textContent = 'Posted';
        window.setTimeout(function () { if (!state.posting) { nodes.post.textContent = 'Post'; } }, 1800);
      }, function (error) {
        nodes.post.textContent = 'Post';
        say(error.message || 'That did not post.');
      })
      .then(function () {
        state.posting = false;
        refreshPost();
      });
  }

  /* --- the page ---------------------------------------------------------- */

  function build() {
    if (built) { return; }
    built = true;
    nodes = {
      locked: $('mediaLocked'),
      content: $('mediaContent'),
      message: $('mediaMessage'),
      card: $('tweetCard'),
      who: $('tweetWho'),
      pfp: $('tweetPfp'),
      name: $('tweetName'),
      badge: $('tweetBadge'),
      handle: $('tweetHandle'),
      menu: $('tweetMenu'),
      text: $('tweetText'),
      pictureBox: $('tweetPicture'),
      picture: $('tweetPictureImg'),
      dropPicture: $('tweetPictureDrop'),
      attach: $('tweetAttach'),
      count: $('tweetCount'),
      post: $('tweetPost')
    };

    nodes.badge.appendChild(svg('badge', null));
    var actions = $('tweetActions');
    ACTIONS.forEach(function (name) { actions.appendChild(svg(name, 'ege-tweet__action')); });

    nodes.text.maxLength = MAX_TEXT;
    nodes.text.addEventListener('input', function () { fitBox(); refreshPost(); });

    nodes.who.addEventListener('click', function () {
      if (nodes.menu.hidden) { openMenu(); } else { closeMenu(); }
    });
    document.addEventListener('click', function (e) {
      if (nodes.menu.hidden) { return; }
      /* A click that swapped the menu's insides (New account, Edit,
         Cancel) lands here after its button has left the page. */
      if (!document.documentElement.contains(e.target)) { return; }
      /* Nor is anything done in the crop menu, which sits over the page. */
      if (cropOpen()) { return; }
      if (nodes.menu.contains(e.target) || nodes.who.contains(e.target)) { return; }
      closeMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !nodes.menu.hidden) { closeMenu(); nodes.who.focus(); }
    });

    nodes.attach.addEventListener('change', function () {
      var file = nodes.attach.files && nodes.attach.files[0];
      nodes.attach.value = '';
      if (!file) { return; }
      pictureFromFile(file).then(setPicture, function (e) { say(e.message); });
    });
    nodes.dropPicture.addEventListener('click', function () { setPicture(null); });
    nodes.post.addEventListener('click', post);
  }

  function setPicture(picture) {
    state.picture = picture;
    nodes.pictureBox.hidden = !picture;
    if (picture) {
      nodes.picture.src = picture.url;
      var box = pictureBox(picture, 1000);
      nodes.picture.style.aspectRatio = box.w + ' / ' + box.h;
    } else {
      nodes.picture.removeAttribute('src');
    }
    refreshPost();
  }

  /* The box grows with what is typed, as a tweet does. */
  function fitBox() {
    nodes.text.style.height = 'auto';
    nodes.text.style.height = nodes.text.scrollHeight + 'px';
  }

  function refreshPost() {
    var text = nodes.text.value;
    var left = MAX_TEXT - text.length;
    nodes.count.hidden = left > 20;
    nodes.count.textContent = left;
    nodes.count.classList.toggle('is-out', left <= 0);
    nodes.post.disabled = state.posting || (!text.trim() && !state.picture);
  }

  function showFace(img, account) {
    img.classList.toggle('is-org', Boolean(account.org));
    img.alt = '';
    var mine = account;
    faceOf(account).then(function (face) {
      if (img.dataset.for !== mine.id) { return; }
      if (face) { img.src = face.toDataURL('image/png'); } else { img.removeAttribute('src'); }
    });
    img.dataset.for = account.id;
  }

  function renderHead() {
    var account = chosenAccount();
    showFace(nodes.pfp, account);
    nodes.name.textContent = account.name;
    nodes.badge.hidden = !account.verified;
    nodes.badge.classList.toggle('is-org', Boolean(account.org));
    nodes.handle.textContent = '@' + account.handle;
  }

  /* --- the account menu ---------------------------------------------------- */

  function openMenu() {
    renderMenu();
    nodes.menu.hidden = false;
    nodes.who.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    nodes.menu.hidden = true;
    nodes.who.setAttribute('aria-expanded', 'false');
  }

  function accountIds(account, className) {
    var ids = el('span', className);
    var name = el('span', 'ege-acct__name');
    name.appendChild(el('span', 'ege-acct__nametext', account.name));
    if (account.verified) {
      var badge = svg('badge', 'ege-acct__badge' + (account.org ? ' is-org' : ''));
      name.appendChild(badge);
    }
    ids.appendChild(name);
    ids.appendChild(el('span', 'ege-acct__handle', '@' + account.handle));
    return ids;
  }

  function renderMenu() {
    var menu = nodes.menu;
    menu.innerHTML = '';
    var chosen = chosenAccount();
    var groups = [[ownAccount()].concat(altAccounts()), presetAccounts()];

    groups.forEach(function (group, at) {
      if (!group.length) { return; }
      if (at) { menu.appendChild(el('div', 'ege-acct__rule')); }
      group.forEach(function (account) {
        var row = el('div', 'ege-acct' + (account.id === chosen.id ? ' is-on' : ''));
        var pick = el('button', 'ege-acct__pick');
        pick.type = 'button';
        pick.setAttribute('role', 'menuitemradio');
        pick.setAttribute('aria-checked', String(account.id === chosen.id));
        var img = el('img', 'ege-acct__pfp');
        pick.appendChild(img);
        showFace(img, account);
        pick.appendChild(accountIds(account, 'ege-acct__ids'));
        pick.addEventListener('click', function () {
          state.chosen = account.id;
          remember(account.id);
          renderHead();
          closeMenu();
        });
        row.appendChild(pick);
        if (account.kind !== 'preset') {
          var edit = el('button', 'ege-acct__edit');
          edit.type = 'button';
          edit.setAttribute('aria-label', 'Edit ' + account.name);
          edit.title = 'Edit';
          edit.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z M13.5 6.5l4 4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg>';
          edit.addEventListener('click', function () { renderEditor(account); });
          row.appendChild(edit);
        }
        menu.appendChild(row);
      });
    });

    if (altAccounts().length < MAX_ALTS) {
      var add = el('button', 'ege-acct__new');
      add.type = 'button';
      add.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.6"/></svg>';
      add.appendChild(document.createTextNode('New account'));
      add.addEventListener('click', function () { renderEditor(null); });
      menu.appendChild(add);
    }
  }

  /* A new account (null) or a change to one, in the menu's place. */
  function renderEditor(account) {
    var menu = nodes.menu;
    menu.innerHTML = '';
    var form = el('form', 'ege-acctedit');
    form.noValidate = true;
    var photo = account && account.kind !== 'own' ? account.photo : (account && account.row ? account.row.photo : null);

    var pfpLabel = el('label', 'ege-acctedit__pfp');
    pfpLabel.title = 'Change the picture';
    var pfpImg = el('img', 'ege-acctedit__img');
    pfpImg.alt = '';
    var draft = account ? Object.assign({}, account) : { id: 'new', name: '', handle: '', photo: null };
    showFace(pfpImg, draft);
    var file = el('input');
    file.type = 'file';
    file.accept = 'image/*';
    file.hidden = true;
    pfpLabel.appendChild(pfpImg);
    pfpLabel.insertAdjacentHTML('beforeend', '<span class="ege-acctedit__cam" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M4 8h3.5L9 5.5h6L16.5 8H20v11H4z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="13.2" r="3.3" fill="none" stroke="currentColor" stroke-width="2"/></svg></span>');
    pfpLabel.appendChild(file);
    form.appendChild(pfpLabel);

    var name = el('input', 'fb-input ege-acctedit__name');
    name.type = 'text';
    name.maxLength = 50;
    name.placeholder = 'Name';
    name.setAttribute('aria-label', 'Name');
    name.value = account ? account.name : '';

    var handleWrap = el('label', 'ege-acctedit__handle');
    handleWrap.appendChild(el('span', 'ege-acctedit__at', '@'));
    var handle = el('input', 'fb-input');
    handle.type = 'text';
    handle.maxLength = 15;
    handle.placeholder = 'handle';
    handle.setAttribute('aria-label', 'Handle');
    handle.autocapitalize = 'off';
    handle.spellcheck = false;
    handle.value = account ? account.handle : '';
    handleWrap.appendChild(handle);

    var fields = el('div', 'ege-acctedit__fields');
    fields.appendChild(name);
    fields.appendChild(handleWrap);
    form.appendChild(fields);

    var verified = null;
    if (admin() && (!account || account.kind === 'alt')) {
      var check = el('label', 'ege-acctedit__check');
      verified = el('input');
      verified.type = 'checkbox';
      verified.checked = Boolean(account && account.verified);
      check.appendChild(verified);
      check.appendChild(document.createTextNode('Verified'));
      form.appendChild(check);
    }

    var note = el('p', 'ege-note ege-note--error ege-acctedit__note');
    note.hidden = true;
    form.appendChild(note);

    var foot = el('div', 'ege-acctedit__foot');
    if (account && account.kind === 'alt') {
      var del = el('button', 'fb-btn ege-acctedit__delete', 'Delete');
      del.type = 'button';
      del.addEventListener('click', function () {
        del.disabled = true;
        deleteAccount(account).then(function (res) {
          if (!res.ok) { del.disabled = false; fail(res.message); return; }
          if (state.chosen === account.id) { state.chosen = 'own'; remember('own'); }
          return reload().then(function () { renderHead(); renderMenu(); });
        });
      });
      foot.appendChild(del);
    }
    var back = el('button', 'fb-btn', 'Cancel');
    back.type = 'button';
    back.addEventListener('click', renderMenu);
    var save = el('button', 'fb-btn fb-btn--primary', 'Save');
    save.type = 'submit';
    foot.appendChild(back);
    foot.appendChild(save);
    form.appendChild(foot);

    function fail(message) { note.textContent = message; note.hidden = !message; }

    handle.addEventListener('input', function () {
      var clean = handle.value.replace(/^@+/, '').replace(/[^A-Za-z0-9_]/g, '');
      if (clean !== handle.value) { handle.value = clean; }
    });

    file.addEventListener('change', function () {
      var picked = file.files && file.files[0];
      file.value = '';
      if (!picked) { return; }
      openCrop(picked, name).then(function (url) {
        if (!url) { return; }
        photo = url;
        draft = Object.assign({}, draft, { id: 'draft-' + Date.now(), photo: url, headshot: false });
        showFace(pfpImg, draft);
        fail('');
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var n = name.value.trim();
      var h = handle.value.trim();
      if (!n) { fail('Give it a name.'); name.focus(); return; }
      if (!/^[A-Za-z0-9_]{1,15}$/.test(h)) { fail('A handle is letters, numbers and _ only, 15 at most.'); handle.focus(); return; }
      save.disabled = true;
      fail('');
      saveAccount(account, { name: n, handle: h, photo: photo, verified: verified && verified.checked })
        .then(function (res) {
          save.disabled = false;
          if (!res.ok) { fail(res.message); return; }
          if (!account && res.id) { state.chosen = res.id; remember(res.id); }
          return reload().then(function () { renderHead(); closeMenu(); });
        });
    });

    menu.appendChild(form);
    name.focus();
  }

  function reload() {
    var p = player();
    if (!p) { return Promise.resolve(); }
    return load(p.email);
  }

  /* --- drawing the page -------------------------------------------------------- */

  function render() {
    build();
    var p = player();
    nodes.locked.hidden = Boolean(p);
    nodes.content.hidden = !p;
    if (!p) { closeMenu(); state.email = null; return; }

    if (state.email !== p.email) {
      state.email = p.email;
      state.rows = [];
      state.chosen = remembered() || 'own';
      say('');
      state.loading = load(p.email);
    }
    closeMenu();
    renderHead();
    refreshPost();
    fitBox();
    var asked = p.email;
    state.loading.then(function () {
      if (state.email === asked) { renderHead(); }
    });
  }

  return {
    render: render,
    /* For a test, or anything else that wants the picture Post would send. */
    draw: function () { return draw(currentTweet()); }
  };
})();
