/* ==========================================================================
   EGE Football — card looks: nicknames and avatars (Sam, 2026-11-18)

   What the Player Card editor (js/cards-view.js, openCardEditor) saves for
   a card, card_styles in supabase/schema.sql, keyed like the card photos:
   one of the six's slug ('andrew-parr') or 'n:{slug}' for an NFL player's
   card (his NFL Player Card and his Season Cards share it).

     nickname  on the card for anybody who sees it; on the owner's own
               browser it also stands in for the player's name across the
               whole site, except where the name is somebody's account
               (trades, the sign-in box, the admin pages) and on other
               people's cards. Done here, on the page as drawn, so it never
               reaches a Discord post, a tweet or anything saved.
     avatar    the card photo cut to a circle: on the owner's own browser it
               takes the place of the player's face in the League page's
               circles, and nowhere else.

   Where the name stays real: anything inside [data-realname] or the
   selectors in KEEP below.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.cardLooks = (function () {
  'use strict';

  var NICKNAME_MAX = 24;

  /* --- whose: the signed-in account's styles -------------------------------- */

  var mine = {};            /* { key: { nickname, avatar, name, espn } } */
  var loadedFor = null;

  function load(email) {
    loadedFor = email || null;
    if (!email || !EGE.cardStore || !EGE.cardStore.cardStyles) { set({}); return Promise.resolve({}); }
    return EGE.cardStore.cardStyles(email).then(function (map) {
      if (loadedFor !== email) { return mine; }
      set(map || {});
      return mine;
    });
  }

  function set(map) {
    mine = map || {};
    rebuildNames();
    rebuildFaces();
  }

  /* After the editor saves one. `style` null takes it away. */
  function update(key, style) {
    if (style) { mine[key] = style; } else { delete mine[key]; }
    rebuildNames();
    rebuildFaces();
  }

  function styleFor(key) { return mine[key] || null; }
  function all() { return mine; }

  /* --- nicknames, across the page ------------------------------------------ */

  /* Where a name is somebody's account rather than the player, or is on
     somebody else's card: left as it is. */
  var KEEP = [
    '[data-realname]', '#view-admin', '#cardPageTrades', '.ege-rip__stage--trade', '.ege-nfltrade',
    '.ege-traded', '.ege-finder__trade', '.ege-who', '#signedInName', '.ege-tweet__who', '.ege-tweet__menu',
    'script', 'style', 'textarea', 'input', '[contenteditable]'
  ].join(',');

  var pattern = null;      /* RegExp over every real name with a nickname */
  var nickOf = {};         /* lower-case real name: nickname */
  var touched = new Set(); /* text nodes changed, each with its real text kept on it */
  var observer = null;

  function escape(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function realNameOf(key, style) {
    if (key.indexOf('n:') === 0) { return style && style.name ? style.name : null; }
    var p = EGE.playerBySlug ? EGE.playerBySlug(key) : null;
    return p ? p.name : null;
  }

  function rebuildNames() {
    var next = {};
    Object.keys(mine).forEach(function (key) {
      var style = mine[key];
      var real = realNameOf(key, style);
      if (style && style.nickname && real && style.nickname !== real) { next[real.toLowerCase()] = style.nickname; }
    });
    nickOf = next;
    var names = Object.keys(next).sort(function (a, b) { return b.length - a.length; });
    pattern = names.length ? new RegExp('(^|[^\\w])(' + names.map(escape).join('|') + ')(?=$|[^\\w])', 'gi') : null;
    restoreAll();
    if (pattern) {
      watch();
      swap(document.documentElement);
      if (observer) { observer.takeRecords(); }
    }
  }

  function replaced(text) {
    return text.replace(pattern, function (all, lead, name) {
      var nick = nickOf[name.toLowerCase()] || name;
      return lead + (name === name.toUpperCase() && name !== name.toLowerCase() ? nick.toUpperCase() : nick);
    });
  }

  function kept(node) {
    var parent = node.parentElement;
    return !parent || Boolean(parent.closest(KEEP));
  }

  function swapText(node) {
    if (!pattern) { return; }
    var text = node.data;
    pattern.lastIndex = 0;
    if (!text || !pattern.test(text)) { return; }
    pattern.lastIndex = 0;
    if (kept(node)) { return; }
    if (node.__egeReal === undefined) { node.__egeReal = text; }
    var out = replaced(text);
    if (out !== text) {
      node.data = out;
      touched.add(node);
    }
  }

  function swap(root) {
    if (!pattern || !root) { return; }
    if (root.nodeType === 3) { swapText(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9) { return; }
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var list = [];
    for (var n = walker.nextNode(); n; n = walker.nextNode()) { list.push(n); }
    list.forEach(swapText);
  }

  /* Back to the real names everywhere they were changed. */
  function restoreAll() {
    if (observer) { observer.takeRecords(); }
    touched.forEach(function (node) {
      if (node.isConnected && node.__egeReal !== undefined) { node.data = node.__egeReal; }
      node.__egeReal = undefined;
    });
    touched.clear();
    if (observer) { observer.takeRecords(); }
  }

  function prune() {
    touched.forEach(function (node) { if (!node.isConnected) { touched.delete(node); } });
  }

  var seen = 0;

  function watch() {
    if (observer || !window.MutationObserver) { return; }
    observer = new MutationObserver(function (records) {
      if (!pattern) { return; }
      records.forEach(function (r) {
        if (r.type === 'characterData') {
          /* The page wrote this text itself: what it says now is real. */
          r.target.__egeReal = undefined;
          swapText(r.target);
        } else {
          Array.prototype.forEach.call(r.addedNodes, swap);
        }
      });
      /* What was changed just now is not the page's own doing. */
      observer.takeRecords();
      seen += records.length;
      if (seen > 400) { seen = 0; prune(); }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  }

  /* The name to print for a player as this browser shows him: for the
     page's own drawing where it wants it straight (a card face of yours). */
  function nameFor(key, real) {
    var style = mine[key];
    return style && style.nickname ? style.nickname : real;
  }

  /* --- avatars, on the League page ------------------------------------------ */

  var bySrc = {};          /* one of the six's headshot URL: avatar */
  var byEspn = {};         /* an NFL player's ESPN id: avatar */
  var faceObserver = null;
  var ESPN_ID = /\/players\/full\/(\d+)\.png/;

  function rebuildFaces() {
    bySrc = {};
    byEspn = {};
    Object.keys(mine).forEach(function (key) {
      var style = mine[key];
      if (!style || !style.avatar) { return; }
      if (key.indexOf('n:') === 0) {
        if (style.espn) { byEspn[style.espn] = style.avatar; }
        return;
      }
      var p = EGE.playerBySlug ? EGE.playerBySlug(key) : null;
      if (p && p.headshot) { bySrc[p.headshot] = style.avatar; }
    });
    var league = document.getElementById('view-league');
    if (!league) { return; }
    Array.prototype.forEach.call(league.querySelectorAll('img'), faceFor);
    watchFaces(league);
  }

  function avatarFor(src) {
    if (!src) { return null; }
    if (bySrc[src]) { return bySrc[src]; }
    var m = ESPN_ID.exec(src);
    return m && byEspn[m[1]] ? byEspn[m[1]] : null;
  }

  function faceFor(img) {
    var real = img.getAttribute('data-real-src');
    var src = real || img.getAttribute('src');
    var avatar = avatarFor(src);
    if (avatar) {
      if (!real) { img.setAttribute('data-real-src', src); }
      if (img.getAttribute('src') !== avatar) { img.setAttribute('src', avatar); }
      img.classList.add('ege-avatarface');
    } else if (real) {
      img.removeAttribute('data-real-src');
      img.classList.remove('ege-avatarface');
      img.setAttribute('src', real);
    }
  }

  function watchFaces(league) {
    if (faceObserver || !window.MutationObserver) { return; }
    faceObserver = new MutationObserver(function (records) {
      if (!Object.keys(bySrc).length && !Object.keys(byEspn).length) { return; }
      records.forEach(function (r) {
        if (r.type === 'attributes') {
          var img = r.target;
          /* The page put a new face in: that is the real one now. */
          if (img.getAttribute('src') !== avatarFor(img.getAttribute('data-real-src'))) {
            img.removeAttribute('data-real-src');
          }
          faceFor(img);
          return;
        }
        Array.prototype.forEach.call(r.addedNodes, function (node) {
          if (node.nodeType !== 1) { return; }
          if (node.tagName === 'IMG') { faceFor(node); }
          Array.prototype.forEach.call(node.querySelectorAll('img'), faceFor);
        });
      });
      faceObserver.takeRecords();
    });
    faceObserver.observe(league, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
  }

  return {
    NICKNAME_MAX: NICKNAME_MAX,
    load: load,
    set: set,
    update: update,
    styleFor: styleFor,
    all: all,
    nameFor: nameFor,
    avatarFor: avatarFor
  };
})();
