/* ==========================================================================
   EGE Football — on a touch screen
   The few things a phone, and Safari on an iPhone above all, needs from
   script rather than from the stylesheet. Loaded in the head, before the
   page is drawn. The stylesheet's half is under "On a phone" in site.css.
   ========================================================================== */

(function () {
  'use strict';

  var nav = window.navigator;

  /* --- no zooming in on a box ----------------------------------------------

     Safari on an iPhone zooms the page in on any text box, menu or select
     whose type is under 16px the moment it is tapped, and leaves it zoomed
     when the keyboard goes away -- the "the page jumped and now it's huge"
     glitch. Most of this site's boxes are 13 to 15px on a phone. A top
     zoom of 1 stops that zoom. It does not stop a pinch: iOS has let people
     pinch past it since iOS 10. Everywhere else it would stop the pinch too,
     so it goes on for iOS only (iPads that say they are Macs included). */
  var ios = /iP(hone|od|ad)/.test(nav.userAgent || '') ||
    (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1);
  if (ios) {
    var viewport = document.querySelector('meta[name="viewport"]');
    if (viewport && !/maximum-scale/.test(viewport.content)) {
      viewport.content += ', maximum-scale=1';
    }
  }

  /* --- a press you can see ---------------------------------------------------

     Safari only shows a button as pressed (:active -- the kit's buttons push
     in under it) on a page that listens for touches. This is that listener;
     it does nothing else, and it never holds a scroll up. */
  document.addEventListener('touchstart', function () {}, { passive: true });

  /* --- two quick taps are not "tap again" ----------------------------------

     Quick sell, Merge, Holo all and taking a booster off are two taps on
     purpose: the first arms the button and says what it will do, the second
     does it. Now that two quick taps no longer zoom the page they are two
     clicks, and a double tap would arm and confirm in one go. So a tap that
     lands on an armed button within a moment of the tap before it, in the
     same spot, is taken for the second half of a double tap and dropped. A
     real second tap, made after reading what the button says, is never that
     quick. A mouse double-click gets the same treatment. */
  var ARMED = '.is-armed, .ege-slot__applied--armed';
  var last = { at: 0, x: 0, y: 0 };

  document.addEventListener('click', function (event) {
    var now = Date.now();
    var quick = now - last.at < 450 &&
      Math.abs(event.clientX - last.x) < 40 && Math.abs(event.clientY - last.y) < 40;
    last = { at: now, x: event.clientX, y: event.clientY };
    /* A click from the keyboard comes with no position and no hurry. */
    if (!quick || event.detail === 0) { return; }
    var target = event.target;
    if (target && target.closest && target.closest(ARMED)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
}());
