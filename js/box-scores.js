/* ==========================================================================
   EGE Football — every NFL game's box score, from the sim
   What the League page shows of a week the NFL sim played: every game's
   score, both teams' numbers, every player's line, the scoring plays and
   who got hurt. The NFL Sim tab writes them to sim_box_scores in Supabase,
   a row a week (nfl-sim/lib/site.js boxRows), and nobody but an admin can
   read a week before it is published.

   weeks() is every season's weeks there are rows for, { season: [week] },
   asked for once (and again once another week is out); week(season, n) is
   that week's games, asked for the first time it is wanted. Both resolve
   to null when there is nothing to ask (no Supabase, or no table yet), so
   the page falls back to the scores the season files have.
   ========================================================================== */

(function () {
  'use strict';

  window.EGE = window.EGE || {};

  var TABLE = 'sim_box_scores';
  var index = null;
  var indexStamp = '';
  var games = {};

  function client() {
    return EGE.auth && EGE.auth.supabaseClient ? EGE.auth.supabaseClient() : null;
  }

  /* The weeks out on the site: an index read before a week was published
     is read again after. */
  function stamp() {
    var out = EGE.publishedWeeks || {};
    return Object.keys(out).map(function (season) { return season + ':' + (out[season] || []).join(','); }).join('|');
  }

  function weeks() {
    var now = stamp();
    if (!index || indexStamp !== now) {
      indexStamp = now;
      var c = client();
      index = !c ? Promise.resolve(null) : c.from(TABLE).select('season, week').then(function (res) {
        if (res.error) { return null; }
        var out = {};
        (res.data || []).forEach(function (row) {
          if (!EGE.isPublished(row.season, row.week)) { return; }
          (out[row.season] = out[row.season] || []).push(row.week);
        });
        Object.keys(out).forEach(function (season) { out[season].sort(function (a, b) { return a - b; }); });
        return out;
      }, function () { return null; });
    }
    return index;
  }

  function week(season, n) {
    var key = season + ':' + n;
    if (!games[key]) {
      var c = client();
      games[key] = !c ? Promise.resolve(null) : c.from(TABLE).select('games').eq('season', season).eq('week', n)
        .maybeSingle().then(function (res) {
          if (res.error || !res.data) {
            delete games[key];
            return null;
          }
          return res.data.games || [];
        }, function () {
          delete games[key];
          return null;
        });
    }
    return games[key];
  }

  /* Everything asked for again next time: the NFL Sim tab has written. */
  function forget() {
    index = null;
    games = {};
  }

  EGE.boxScores = { weeks: weeks, week: week, forget: forget };
})();
