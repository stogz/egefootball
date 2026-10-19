/* ==========================================================================
   EGE Football — the NFL's rosters, from the sim
   Every NFL team's players as the Teams pages show them: who is on the
   team, their overall, years in the league, size, archetype, skills,
   college, draft and contract. They come from the NFL sim, never from
   data/rosters.js, and there are two places to find them:

   - data/nfl-rosters.json, written on the command line by
     node nfl-sim/sim.js export and committed with the site;
   - nfl_sim_rosters in Supabase, which the admin page's NFL Sim tab
     writes every time it plays a step.

   Whichever was saved last for the season wins. Nothing private is in
   either: no team ratings, no potential, nothing about how long a player
   will last (see publicRosters in nfl-sim/lib/site.js).

   A season is asked for once a load. get() is undefined until then, null
   for a season with no rosters, and the rosters once they are in.
   ========================================================================== */

(function () {
  'use strict';

  window.EGE = window.EGE || {};

  var cache = {};
  var asking = {};

  function newer(a, b) {
    if (!a) { return b || null; }
    if (!b) { return a; }
    return String(b.savedAt || '') > String(a.savedAt || '') ? b : a;
  }

  /* The committed file holds one season, whichever the sim was on when it
     was written. */
  var file = null;
  function fromFile() {
    if (!file) {
      file = window.fetch('data/nfl-rosters.json', { cache: 'no-cache' }).then(function (res) {
        return res.ok ? res.json() : null;
      }).catch(function () { return null; });
    }
    return file;
  }

  function fromSupabase(season) {
    var client = EGE.auth && EGE.auth.supabaseClient ? EGE.auth.supabaseClient() : null;
    if (!client) { return Promise.resolve(null); }
    return client.from('nfl_sim_rosters').select('rosters').eq('season', season).maybeSingle()
      .then(function (res) {
        return res.error || !res.data ? null : res.data.rosters;
      }, function () { return null; });
  }

  function load(season) {
    if (cache[season] !== undefined) { return Promise.resolve(cache[season]); }
    if (!asking[season]) {
      asking[season] = Promise.all([fromFile(), fromSupabase(season)]).then(function (got) {
        var committed = got[0] && got[0].season === season ? got[0] : null;
        cache[season] = newer(committed, got[1]);
        delete asking[season];
        return cache[season];
      });
    }
    return asking[season];
  }

  EGE.nflRosters = {
    load: load,
    get: function (season) { return cache[season]; },
    /* The admin page, having just published a season's rosters. */
    set: function (season, rosters) { cache[season] = rosters; },
    forget: function (season) { delete cache[season]; file = null; },
    /* One team's players, best first, or null. */
    team: function (season, key) {
      var all = cache[season];
      return all && all.teams ? all.teams[key] || null : null;
    }
  };
})();
