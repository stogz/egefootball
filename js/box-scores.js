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

  function read(c, season, n, key) {
    return c.from(TABLE).select('games, digest').eq('season', season).eq('week', n)
      .maybeSingle().then(function (res) {
        if (res.error || !res.data) {
          delete games[key];
          return null;
        }
        var list = res.data.games || [];
        if (EGE.localCache && res.data.digest) {
          EGE.localCache.set('box-scores:' + key, { digest: res.data.digest, games: list });
        }
        return list;
      }, function () {
        delete games[key];
        return null;
      });
  }

  /* A week's games are about 70 KB. The week's digest, which changes
     whenever anything in its row does (nfl-sim/lib/site.js boxRows), is
     asked first, and a week this browser has kept under the same digest
     (js/local-cache.js) is not read again. */
  function week(season, n) {
    var key = season + ':' + n;
    if (!games[key]) {
      var c = client();
      var store = EGE.localCache;
      games[key] = !c ? Promise.resolve(null) : !store ? read(c, season, n, key) : Promise.all([
        c.from(TABLE).select('digest').eq('season', season).eq('week', n).maybeSingle(),
        store.get('box-scores:' + key)
      ]).then(function (got) {
        var res = got[0];
        var mine = got[1];
        if (!res.error && res.data && mine && mine.digest && mine.digest === res.data.digest) { return mine.games; }
        if (!res.error && !res.data) {
          delete games[key];
          return null;
        }
        return read(c, season, n, key);
      }, function () { return read(c, season, n, key); });
    }
    return games[key];
  }

  /* One player's games in a season, for his pop-up (nfl_player_games):
     [{ week, game: { home, away, score, round, ot, neutral }, line }] in
     week order, published weeks only. `sim` is his rosters' entry. Null
     when there is nothing to ask or the schema has no such function yet. */
  var players = {};
  function playerGames(season, sim) {
    var key = [season, sim.espn || '', sim.ege || '', sim.name, sim.pos].join('|');
    if (!players[key]) {
      var c = client();
      players[key] = !c ? Promise.resolve(null) : c.rpc('nfl_player_games', {
        p_season: season, p_espn: sim.espn ? String(sim.espn) : null, p_ege: sim.ege || null,
        p_name: sim.name, p_pos: sim.pos
      }).then(function (res) {
        if (res.error) { delete players[key]; return null; }
        return res.data || [];
      }, function () {
        delete players[key];
        return null;
      });
    }
    return players[key];
  }

  /* Everything asked for again next time: the NFL Sim tab has written. */
  function forget() {
    index = null;
    games = {};
    players = {};
  }

  EGE.boxScores = { weeks: weeks, week: week, playerGames: playerGames, forget: forget };
})();
