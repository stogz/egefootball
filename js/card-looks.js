/* ==========================================================================
   EGE Football — card looks: nicknames, avatars and the editor's options
   (Sam, 2026-11-18)

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
     look      { plate, ground, pattern, font }: the card's colour, the
               colour behind the photo, a pattern on it and the name's type.

   Where the name stays real: anything inside [data-realname] or the
   selectors in KEEP below.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.cardLooks = (function () {
  'use strict';

  /* --- the editor's options ------------------------------------------------ */

  /* The card's own colour, behind the words. `ink` is the writing on it. */
  var PLATES = [
    { key: 'cream', name: 'Cream', bg: null },
    { key: 'white', name: 'White', bg: '#ffffff', ink: '#1d2416', muted: '#5d6455' },
    { key: 'night', name: 'Night', bg: '#1d2416', ink: '#fbf4e6', muted: '#b9c0ad' },
    { key: 'sky', name: 'Sky', bg: '#d7ecf7', ink: '#14303f', muted: '#4b6878' },
    { key: 'blush', name: 'Blush', bg: '#f6dcdc', ink: '#3b1a1a', muted: '#7a5252' },
    { key: 'sage', name: 'Sage', bg: '#dfe8cf', ink: '#1d2a14', muted: '#56624a' },
    { key: 'gold', name: 'Gold', bg: '#f1d98a', ink: '#2f2408', muted: '#6b5a26' },
    { key: 'royal', name: 'Royal', bg: '#24306b', ink: '#f4f1ff', muted: '#b8bde3' }
  ];

  /* Behind the photo: the team's colour, or one of these. */
  var GROUNDS = [null, '#1d2416', '#b3261e', '#e8722c', '#f2c230', '#2f7d3b', '#1f6fb2', '#5b3fa6', '#d6458f',
                 '#7a8088', '#f4f1e8'];

  var PATTERNS = [
    { key: 'none', name: 'None' },
    { key: 'stripes', name: 'Stripes' },
    { key: 'dots', name: 'Dots' },
    { key: 'grid', name: 'Grid' },
    { key: 'rays', name: 'Rays' },
    { key: 'waves', name: 'Waves' }
  ];

  var FONTS = [
    { key: 'display', name: 'Classic' },
    { key: 'block', name: 'Block' },
    { key: 'serif', name: 'Serif' },
    { key: 'script', name: 'Script' },
    { key: 'mono', name: 'Mono' }
  ];

  var NICKNAME_MAX = 24;

  /* The name types beyond the site's own come from Google Fonts, read only
     once a card on the page (or the editor) needs one. */
  var FONT_SHEET = 'https://fonts.googleapis.com/css2?family=Anton&family=Pacifico' +
    '&family=Playfair+Display:ital,wght@1,800&family=Space+Mono:wght@700&display=swap';
  var fontsIn = false;
  function needFonts() {
    if (fontsIn || !document.head) { return; }
    fontsIn = true;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONT_SHEET;
    document.head.appendChild(link);
  }

  function plateOf(key) { return PLATES.filter(function (p) { return p.key === key; })[0] || PLATES[0]; }

  /* Puts a look on a card face (.ege-tcard): CSS in site.css does the rest. */
  function dress(outer, look) {
    var l = look || {};
    var plate = plateOf(l.plate);
    if (plate.bg) {
      outer.style.setProperty('--plate', plate.bg);
      outer.style.setProperty('--plate-ink', plate.ink);
      outer.style.setProperty('--plate-muted', plate.muted);
      outer.classList.add('has-plate');
    }
    if (l.ground && /^#[0-9a-f]{6}$/i.test(l.ground)) { outer.style.setProperty('--ground', l.ground); }
    if (l.pattern && l.pattern !== 'none') { outer.setAttribute('data-pattern', l.pattern); }
    if (l.font && l.font !== 'display') { outer.setAttribute('data-font', l.font); needFonts(); }
    return outer;
  }

  /* --- whose: the signed-in account's styles -------------------------------- */

  var mine = {};            /* { key: { nickname, look, avatar, name, espn } } */
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
    PLATES: PLATES,
    GROUNDS: GROUNDS,
    PATTERNS: PATTERNS,
    FONTS: FONTS,
    NICKNAME_MAX: NICKNAME_MAX,
    needFonts: needFonts,
    dress: dress,
    load: load,
    set: set,
    update: update,
    styleFor: styleFor,
    all: all,
    nameFor: nameFor,
    avatarFor: avatarFor
  };
})();
