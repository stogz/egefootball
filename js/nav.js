/* ==========================================================================
   EGE Football — the nav
   The bar across the top (Sam, 2026-11-24): the orange slider under the page
   you are on, the ball's spin when you change page, the shadow once the page
   is scrolled, the balances counting to a new number, and the choice between
   a nav that stays put (the default) and one that slides away while you
   scroll down and comes back the moment you scroll up.

   The choice is kept on this device (localStorage `ege.navMode`) and set from
   the "Auto-hide nav" switch in the portal. Plain script, loaded before
   app.js; app.js still decides which link is the page you are on, and this
   follows its `is-active`.
   ========================================================================== */

(function () {
  'use strict';

  var EGE = window.EGE = window.EGE || {};
  var root = document.documentElement;
  var nav = document.querySelector('.fb-nav');
  if (!nav) { return; }

  var KEY = 'ege.navMode';
  var links = nav.querySelector('.fb-nav__links');
  var mark = nav.querySelector('.fb-brand__mark');
  var switches = Array.prototype.slice.call(document.querySelectorAll('[data-nav-autohide]'));

  function still() {
    return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* --- sticky or auto-hide ------------------------------------------------ */

  function readMode() {
    try { return window.localStorage.getItem(KEY) === 'autohide' ? 'autohide' : 'sticky'; } catch (e) { return 'sticky'; }
  }

  var mode = readMode();

  function setMode(next) {
    mode = next === 'autohide' ? 'autohide' : 'sticky';
    try {
      if (mode === 'autohide') { window.localStorage.setItem(KEY, 'autohide'); } else { window.localStorage.removeItem(KEY); }
    } catch (e) { /* kept for this visit only */ }
    applyMode();
  }

  function applyMode() {
    root.setAttribute('data-nav', mode);
    switches.forEach(function (box) { box.checked = mode === 'autohide'; });
    if (mode !== 'autohide') { reveal(); }
  }

  switches.forEach(function (box) {
    box.addEventListener('change', function () { setMode(box.checked ? 'autohide' : 'sticky'); });
  });

  /* Another tab changing it changes this one too. */
  window.addEventListener('storage', function (event) {
    if (event.key === KEY) { mode = readMode(); applyMode(); }
  });

  /* --- its height, for whatever sits under it --------------------------------

     The card filters stick under the nav and the page scrolls things into
     view below it, so both read its height from here (--nav-h), and how much
     of the screen it is covering right now (--nav-offset: nothing while it
     is tucked away). */
  var height = nav.offsetHeight;

  function measure() {
    height = nav.offsetHeight;
    root.style.setProperty('--nav-h', height + 'px');
    root.style.setProperty('--nav-offset', (tucked ? 0 : height) + 'px');
  }

  /* --- scrolling -------------------------------------------------------------

     A shadow once the page has moved. In auto-hide, away after a short run
     down and back after a short run up, so a finger's wobble does neither.
     Never away near the top or while something in it has the keyboard. */
  var tucked = false;
  var lastY = 0;
  var run = 0;
  var queued = false;

  function scrollY() {
    var most = Math.max(0, root.scrollHeight - window.innerHeight);
    /* iOS bounces past both ends; the bounce is not a direction. */
    return Math.min(Math.max(window.pageYOffset || 0, 0), most);
  }

  function tuck() {
    if (tucked) { return; }
    tucked = true;
    nav.classList.add('is-tucked');
    root.style.setProperty('--nav-offset', '0px');
  }

  function reveal() {
    if (!tucked) { return; }
    tucked = false;
    nav.classList.remove('is-tucked');
    root.style.setProperty('--nav-offset', height + 'px');
  }

  function onScroll() {
    queued = false;
    var y = scrollY();
    var moved = y - lastY;
    lastY = y;
    nav.classList.toggle('is-scrolled', y > 2);

    if (mode !== 'autohide' || y <= height) { run = 0; reveal(); return; }
    if (!moved) { return; }
    if ((moved > 0) !== (run > 0)) { run = 0; }
    run += moved;
    if (run > 14 && !keyboardIn()) { tuck(); }
    if (run < -10) { reveal(); }
  }

  /* A link keeps the focus after a click in some browsers, so only focus
     from the keyboard holds the bar down. */
  function keyboardIn() {
    try { return Boolean(nav.querySelector(':focus-visible')); } catch (e) { return false; }
  }

  window.addEventListener('scroll', function () {
    if (!queued) { queued = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });

  /* Tabbing into it, or a mouse at the very top of the screen, brings it back. */
  nav.addEventListener('focusin', function () { if (keyboardIn()) { reveal(); } });
  document.addEventListener('mousemove', function (event) {
    if (tucked && event.clientY < 10) { reveal(); run = 0; }
  }, { passive: true });

  /* --- the slider under the page you are on ----------------------------------

     One orange bar for the whole row, moved to whichever link app.js has
     marked active and stretched to its width, so changing page slides it
     across rather than switching one underline off and another on. */
  var ink = document.createElement('span');
  ink.className = 'fb-nav__ink';
  ink.setAttribute('aria-hidden', 'true');
  links.appendChild(ink);
  links.classList.add('has-ink');

  var current = null;
  var placed = false;
  var pending = false;

  function place() {
    pending = false;
    var active = links.querySelector('.fb-navlink.is-active');
    if (!active || active.hidden || !active.offsetWidth) {
      ink.classList.remove('is-on');
      current = null;
      return;
    }
    var style = window.getComputedStyle(active);
    var padLeft = parseFloat(style.paddingLeft) || 0;
    var padRight = parseFloat(style.paddingRight) || 0;
    var x = active.offsetLeft + padLeft;
    var w = Math.max(8, active.offsetWidth - padLeft - padRight);

    /* The first time, it is simply there; after that it slides. */
    if (!placed) { ink.classList.add('is-still'); }
    ink.style.width = w + 'px';
    ink.style.transform = 'translateX(' + x + 'px)';
    ink.classList.add('is-on');
    if (!placed) {
      void ink.offsetWidth;
      ink.classList.remove('is-still');
      placed = true;
    }

    if (current && current !== active) { spin(); }
    current = active;

    /* On a phone the row scrolls sideways when it has to; keep the page you
       are on in sight. */
    if (links.scrollWidth > links.clientWidth + 1) {
      var left = active.offsetLeft;
      var right = left + active.offsetWidth;
      if (left < links.scrollLeft || right > links.scrollLeft + links.clientWidth) {
        links.scrollTo({ left: Math.max(0, left - 24), behavior: still() ? 'auto' : 'smooth' });
      }
    }
  }

  function schedule() {
    if (pending) { return; }
    pending = true;
    window.requestAnimationFrame(place);
  }

  /* app.js flips `is-active` and unhides Shop, Cards, Media and Admin on
     sign-in, and the trade badge widens Cards: any of those moves the bar. */
  if (window.MutationObserver) {
    new window.MutationObserver(function (records) {
      for (var i = 0; i < records.length; i += 1) {
        if (records[i].target !== ink) { schedule(); return; }
      }
    }).observe(links, { attributes: true, attributeFilter: ['class', 'hidden'], subtree: true, childList: true, characterData: true });
  }

  window.addEventListener('resize', function () { measure(); schedule(); });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { measure(); schedule(); });
  }
  if (window.ResizeObserver) {
    new window.ResizeObserver(function () { measure(); }).observe(nav);
  }

  /* --- the ball ------------------------------------------------------------- */

  function spin() {
    if (!mark || still()) { return; }
    mark.classList.remove('is-spinning');
    void mark.offsetWidth;
    mark.classList.add('is-spinning');
  }
  if (mark) {
    mark.addEventListener('animationend', function () { mark.classList.remove('is-spinning'); });
  }

  /* --- the balances ----------------------------------------------------------

     A balance that changes counts its way to the new number and gives a
     small bump, up or down. The first number a page shows (the starting
     credits, before Supabase answers) is a stand-in, so the real one simply
     replaces it. */
  function count(node, value, real) {
    if (!node) { return; }
    var was = node.getAttribute('data-real') === '1' ? Number(node.textContent) : NaN;
    if (real) { node.setAttribute('data-real', '1'); } else { node.removeAttribute('data-real'); }
    var token = (Number(node.getAttribute('data-count')) || 0) + 1;
    node.setAttribute('data-count', token);

    var to = Number(value);
    if (!real || isNaN(was) || isNaN(to) || was === to || still()) {
      node.textContent = value;
      return;
    }

    var chip = node.closest('.ege-credits');
    if (chip) {
      chip.classList.remove('is-up', 'is-down');
      void chip.offsetWidth;
      chip.classList.add(to > was ? 'is-up' : 'is-down');
    }

    var start = null;
    var span = Math.min(900, 380 + Math.abs(to - was) * 6);
    function step(now) {
      if (Number(node.getAttribute('data-count')) !== token) { return; }
      if (start === null) { start = now; }
      var t = Math.min(1, (now - start) / span);
      var eased = 1 - Math.pow(1 - t, 3);
      node.textContent = t >= 1 ? value : Math.round(was + (to - was) * eased);
      if (t < 1) { window.requestAnimationFrame(step); }
    }
    window.requestAnimationFrame(step);
  }

  nav.addEventListener('animationend', function (event) {
    var chip = event.target.closest && event.target.closest('.ege-credits');
    if (chip && /ege-balance-/.test(event.animationName)) { chip.classList.remove('is-up', 'is-down'); }
  });

  /* --- scrolling to something ---------------------------------------------------

     How much of the top of the screen the nav will be covering once the page
     has scrolled to `y`: all of it if it stays, none of it in auto-hide when
     the page is going down to get there (it will have tucked away). */
  function cover(y) {
    if (mode === 'autohide' && y > scrollY() && y > height) { return 0; }
    return height;
  }

  EGE.nav = {
    mode: function () { return mode; },
    setMode: setMode,
    count: count,
    cover: cover,
    reveal: reveal
  };

  applyMode();
  measure();
  place();
  onScroll();
})();
