/* ==========================================================================
   EGE Football — the files that change, loaded past the cache
   The season lives in stats/{year}.js and nowhere else. There is no stats
   table in Supabase and no second copy anywhere: change a touchdown in that
   file and the schedule, the game log, the season totals, the Discord post
   and the credits that touchdown is worth all move with it.

   That only holds if the browser reads the file rather than its own copy of
   it. A static host serves everything with a cache lifetime — GitHub Pages
   sends max-age=600 — and for those ten minutes a browser that has been here
   before answers from its own cache without asking. A committed correction is
   simply not there yet, and pinned to a home screen it can hold on longer.

   Which is a correctness problem rather than a slow one, because the admin
   page pays touchdown credits out of whatever this browser thinks the file
   says. Publishing a week from a stale copy writes the old number into the
   ledger, and the ledger never pays a number back down.

   So the three files the admin page regenerates get a cache-busting query,
   written out here rather than tagged in index.html, because the query has to
   be different every load and no static tag can do that.

   Why document.write, of all things
   ---------------------------------
   Because these have to be in place *before* js/app.js runs, the way they
   always were. document.write from a parser-blocking script inserts them into
   the parse stream right here, so they execute in order and js/app.js still
   finds a fully loaded season the moment it starts. Nothing about the order
   the site has always had changes.

   Fetching them instead and starting the app afterwards was the obvious move
   and it was wrong: a deploy is not atomic in a browser. index.html is cached
   too, so for a while after a push a returning visitor runs one file old and
   one new — and an app.js that waits for a loader the cached index.html never
   mentions dies on the spot, as does a cached app.js that expects the season
   to be there already. Keeping the contract synchronous is what makes both
   halves of a half-applied deploy work.

   The cost is that these are re-downloaded rather than revalidated: about
   45KB a load today. That is the price of the season being current, and it is
   worth it.

   Adding a season: put the year in SEASONS below. That is the whole of it.
   ========================================================================== */

(function () {
  'use strict';

  /* One file per season. Add the next one here when it starts. */
  var SEASONS = [2018];

  /* In the order they have always loaded in. */
  var FILES = ['data/season.js', 'data/ratings.js'].concat(
    SEASONS.map(function (year) { return 'stats/' + year + '.js'; })
  );

  /* A query string is a different URL, which is a different cache entry, which
     is a fetch. Opened from a file:// path there is no cache to get past and
     no server to ask, and a query on a file URL is a path that does not
     exist — so there it is left off. */
  var bust = window.location.protocol === 'file:' ? '' : '?t=' + Date.now();

  FILES.forEach(function (url) {
    document.write('<script src="' + url + bust + '"><\/script>');
  });

  window.EGE = window.EGE || {};
  window.EGE.siteData = {
    SEASONS: SEASONS,
    FILES: FILES,

    /* The version of this file that shipped in between fetched these three
       and handed js/app.js a promise to wait on before drawing anything. A
       browser can still be holding that app.js while this index.html is new
       -- that is the whole hazard this file exists to avoid -- so the promise
       stays, already resolved. By the time anything can read it the tags
       above have run and the season is in. */
    ready: Promise.resolve()
  };
})();
