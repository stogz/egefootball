/* ==========================================================================
   EGE Football — the files that change, loaded fresh every time
   The season lives in stats/{year}.js and nowhere else. There is no stats
   table in Supabase and no copy anywhere: change a touchdown in that file and
   the schedule, the game log, the season totals, the Discord post and the
   credits that touchdown is worth all move with it.

   That only holds if the browser actually reads the file. A static host
   serves these with a cache lifetime — GitHub Pages sends max-age=600 — and
   for those ten minutes a returning browser answers from its own cache
   without asking, so a committed correction is simply not there yet. Pinned
   to a home screen it can hold on longer than that.

   Which is a real problem rather than a slow one, because the admin page pays
   touchdown credits out of whatever this browser thinks the file says. Paying
   a published week from a stale copy writes the old number into the ledger,
   and the ledger never pays a number back down.

   So the three files the admin regenerates are loaded through here instead of
   as plain <script src> tags, with the cache told to revalidate. Unchanged,
   that is a 304 and a few hundred bytes; changed, it is the new file. The
   rest of the site — the code, the kit, the players — is still tagged in
   index.html the ordinary way, because it only changes when a deploy does.

   Adding a season: put the year in SEASONS below. That is the whole of it.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.siteData = (function () {
  'use strict';

  /* One file per season. Add the next one here when it starts. */
  var SEASONS = [2018];

  /* In the order they have to run in. Nothing here reads anything from
     another of them while it loads — they are all plain declarations — but
     the order is kept anyway so this file is never the reason something
     changed. */
  var FILES = ['data/season.js', 'data/ratings.js'].concat(
    SEASONS.map(function (year) { return 'stats/' + year + '.js'; })
  );

  /* Run it the way a <script> tag would: in global scope, synchronously, so
     `window.EGE` in the file means what it says. */
  function run(source, from) {
    var script = document.createElement('script');
    script.textContent = source;
    script.setAttribute('data-from', from);
    document.head.appendChild(script);
  }

  /* no-cache is revalidate, not re-download: the browser still asks, and the
     server still answers 304 when nothing has moved. no-store would throw the
     copy away and fetch the lot every time. */
  function ask(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (res) {
      if (!res.ok) { throw new Error(url + ' — HTTP ' + res.status); }
      return res.text();
    });
  }

  /* The way back for anything fetch cannot do — chiefly opening the page from
     a file:// path, where a fetch is cross-origin and a script tag is not.
     The query string is the cache-buster there instead. */
  function viaTag(url) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = url + '?t=' + Date.now();
      script.onload = function () { resolve(); };
      script.onerror = function () { reject(new Error(url + ' would not load')); };
      document.head.appendChild(script);
    });
  }

  /* Asked for all at once, run one after another: the network is the slow
     part and there is no reason to queue it, but the order above is the order
     they execute in whatever order they come back. */
  function load() {
    var asked = FILES.map(function (url) {
      if (typeof fetch !== 'function') { return Promise.resolve(null); }
      return ask(url).catch(function () { return null; });   /* null: use a tag */
    });

    return asked.reduce(function (chain, waiting, at) {
      return chain.then(function () {
        return waiting.then(function (source) {
          return source === null ? viaTag(FILES[at]) : run(source, FILES[at]);
        });
      });
    }, Promise.resolve());
  }

  /* Started as this file runs, so the network is busy while the rest of the
     tags in index.html are still being fetched and parsed. js/app.js waits on
     it before drawing anything. */
  var ready = load();

  return {
    SEASONS: SEASONS,
    FILES: FILES,
    ready: ready
  };
})();
