/* ==========================================================================
   EGE Football — sounds
   Two sounds on the Cards tab, both Sam's clips in sound/: a pack tearing
   open, and a card turning over. Both are loud as they come, so they play
   quietly, each at its own volume in SOUNDS. The rip is the louder clip by
   a long way (about 11 dB), so it is turned down further than the flip.

   Played through Web Audio rather than an <audio> element: an iPhone
   ignores an element's volume and would play them at full blast. Web Audio
   also keeps quiet when the phone's silent switch is on, and as `ambient`
   it plays over the player's own music rather than stopping it.

   A browser only lets a page make a sound once it has been tapped, so
   wake() sets everything up when a pack or a card is put in front of the
   player (always after a tap), and any tap after that wakes it again if
   the browser has put it to sleep. Anything that goes wrong -- no Web
   Audio, a browser that will not allow it, a clip that will not load --
   just means no sound. Nothing waits on it.

   Depends on: nothing.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.sounds = (function () {
  'use strict';

  /* 1 is the clip as it was sent. The clips are trimmed at the front, so
     each starts the moment it is played. */
  var SOUNDS = {
    flip: { src: 'sound/card-flip.mp3', volume: 0.25 },
    rip: { src: 'sound/pack-rip.mp3', volume: 0.1 }
  };

  /* The same sound twice inside this many milliseconds is heard once.
     Turning a whole pack over with reduced motion on turns every card at
     the same moment, and five flips on top of each other are five times
     as loud. Further apart than this they overlap, so turning a pack over
     card by card is heard card by card. */
  var APART = 60;

  var context = null;   /* made on the first wake(); false if it cannot be */
  var clips = {};       /* name -> its decoded clip, once loaded */
  var last = {};        /* name -> when it last started */

  function quiet() {}

  function wake() {
    if (context === false) { return null; }
    try {
      if (!context) {
        var Context = window.AudioContext || window.webkitAudioContext;
        if (!Context) { context = false; return null; }
        if (navigator.audioSession) { navigator.audioSession.type = 'ambient'; }
        context = new Context();
        Object.keys(SOUNDS).forEach(load);
        ['pointerup', 'touchend', 'click', 'keydown'].forEach(function (type) {
          document.addEventListener(type, resume, { capture: true, passive: true });
        });
      }
      resume();
    } catch (e) {
      context = false;
      return null;
    }
    return context;
  }

  /* Suspended until the page has been tapped, and put to sleep again by a
     phone after a call or a while in another app. */
  function resume() {
    if (!context || context.state === 'running' || !context.resume) { return; }
    try {
      var woken = context.resume();
      if (woken && woken.catch) { woken.catch(quiet); }
    } catch (e) { /* stays asleep: no sound */ }
  }

  function load(name) {
    fetch(SOUNDS[name].src).then(function (res) {
      if (!res.ok) { throw new Error('No ' + name + ' sound'); }
      return res.arrayBuffer();
    }).then(function (data) {
      /* The callback form, which older Safari needs; newer browsers also
         hand back a promise, which would otherwise reject unheard. */
      var decoded = context.decodeAudioData(data, function (clip) { clips[name] = clip; }, quiet);
      if (decoded && decoded.catch) { decoded.catch(quiet); }
    }).catch(quiet);
  }

  /* Plays a sound from its start. One that has not loaded yet is skipped,
     not played late. */
  function play(name) {
    var ctx = wake();
    var clip = clips[name];
    if (!ctx || !clip) { return; }
    var now = Date.now();
    if (last[name] && now - last[name] < APART) { return; }
    last[name] = now;
    try {
      var source = ctx.createBufferSource();
      source.buffer = clip;
      var volume = ctx.createGain();
      volume.gain.value = SOUNDS[name].volume;
      source.connect(volume);
      volume.connect(ctx.destination);
      source.start(0);
    } catch (e) { /* no sound */ }
  }

  return { wake: wake, play: play };
})();
