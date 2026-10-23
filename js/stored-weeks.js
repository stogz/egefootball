/* ==========================================================================
   EGE Football — weeks the NFL sim has played, kept in Supabase
   The NFL Sim tab stores every week it plays in sim_weeks: the six's games
   as their season file would have them, and every other NFL score. This
   lays those weeks over the season files whenever the published weeks load
   (js/wallet.js), so a week can be played, published, and the next one
   played, with stats/{year}.js and data/nfl-results.js left as they are.
   Download the season files on the NFL Sim tab folds them in when wanted.

   Two rows a week, by `part`:

   - 'results': `games`, the six's results, stat lines, big plays and
     injuries ({ slug: { result, stats, bigPlays, overtime, injured,
     injury, health } }), and `scores`, every NFL score of the week the way
     data/nfl-results.js has them. Nobody but an admin can read it until the
     week is published.
   - 'fixtures': the six's playoff games that week ({ slug: game }), which
     the season file has no row for until the sim has played the round.
     Readable once the week before is out, so the game is on the schedule,
     and can take a wager, before its own week is.

   A stored week is the whole week as the sim played it, for every one of
   the six in the NFL that season: a game it has no line for is emptied
   (a week undone after it was folded into the file), and a playoff game it
   has no fixture for goes. The files win only for a week they had folded
   in since the row was saved: `stored` in stats/{year}.js and in
   data/nfl-results.js says when each week they carry was saved, so a
   correction made in the file afterwards stands, and a week played again
   after a download does not lose to the old one.

   Everything laid over is undone before the next load is laid over, so a
   week pulled back, played again or undone leaves nothing behind.

   The six's trades come first (sim_trades, one row a trade): from the
   week he moved, his season file's games are his new team's, the row's
   `games`, and the trade goes into the season's `trades` (EGE.tradesFor),
   so every week before it stays as it was played. A file that has the
   trade written in already keeps its own games. The weeks are laid over
   the games as traded, and a stored week is worked out from them too:
   pristine() takes the weeks off and leaves the trades on.

   Depends on: data/players.js, data/games.js, the season files and
   data/nfl-results.js. Read by the Discord bot too (bot/site-data.js).
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.storedWeeks = (function () {
  'use strict';

  /* What a results row sets on a game, and what a game the sim has no line
     for is left with. */
  var EMPTY = { result: null, stats: null, bigPlays: [], overtime: false, injured: false, injury: null, health: null };
  var FIELDS = Object.keys(EMPTY);

  /* What a playoff fixture can change on a game the file already has: the
     round played again can send him somewhere else. */
  var SHELL = ['opponent', 'home', 'neutral', 'name'];

  var loaded = [];
  var trades = [];
  var undo = [];
  var undoTrades = [];
  var stack = undo;
  var seen = '';
  var version = 0;

  function own(obj, key) { return Object.prototype.hasOwnProperty.call(obj, key); }

  function copy(value) { return value === undefined ? undefined : JSON.parse(JSON.stringify(value)); }

  function time(at) {
    var t = at ? Date.parse(at) : NaN;
    return isNaN(t) ? 0 : t;
  }

  /* Every change goes through these three, each leaving behind how to put
     it back: on the trades' list while they are laid, the weeks' after. */
  function set(obj, key, value) {
    var had = own(obj, key);
    var old = obj[key];
    stack.push(function () { if (had) { obj[key] = old; } else { delete obj[key]; } });
    obj[key] = value;
  }

  function insert(list, at, item) {
    list.splice(at, 0, item);
    stack.push(function () {
      var i = list.indexOf(item);
      if (i !== -1) { list.splice(i, 1); }
    });
  }

  function removeAt(list, at) {
    var item = list.splice(at, 1)[0];
    stack.push(function () { list.splice(at, 0, item); });
  }

  function revert() {
    while (undo.length) { undo.pop()(); }
  }

  function revertTrades() {
    revert();
    while (undoTrades.length) { undoTrades.pop()(); }
  }

  /* { season: { week: { results, fixtures } } } */
  function index(rows) {
    var out = {};
    (rows || []).forEach(function (row) {
      var season = out[row.season] || (out[row.season] = {});
      var week = season[row.week] || (season[row.week] = {});
      week[row.part] = row;
    });
    return out;
  }

  function savedAt(parts) {
    return Math.max(time(parts.results && parts.results.saved_at), time(parts.fixtures && parts.fixtures.saved_at));
  }

  function stampOf(holder, week) {
    return holder && holder.stored ? time(holder.stored[week]) : 0;
  }

  function stampIn(holder, week, at) {
    if (!holder.stored) { set(holder, 'stored', {}); }
    set(holder.stored, String(week), new Date(at).toISOString());
  }

  function nflSix(season) {
    return EGE.players.filter(function (player) { return EGE.tierFor(season, player) === 'nfl'; });
  }

  function weekAt(list, week) {
    for (var i = 0; i < list.length; i += 1) { if (list[i].week === week) { return i; } }
    return -1;
  }

  function placeFor(list, week) {
    for (var i = 0; i < list.length; i += 1) { if (list[i].week > week) { return i; } }
    return list.length;
  }

  /* The six's side of a week: playoff games first, then what happened in
     every game that week. */
  function laySix(season, week, parts, at) {
    var forSeason = EGE.stats[season];
    var fixtures = parts.fixtures ? parts.fixtures.games || {} : null;
    var results = parts.results ? parts.results.games || {} : null;

    nflSix(season).forEach(function (player) {
      var slug = player.slug;
      if (!forSeason.games[slug]) {
        if (!fixtures || !fixtures[slug]) { return; }
        set(forSeason.games, slug, []);
      }
      var list = forSeason.games[slug];

      if (fixtures) {
        var found = weekAt(list, week);
        var shell = fixtures[slug];
        if (shell && found === -1) {
          var game = copy(shell);
          game.week = week;
          insert(list, placeFor(list, week), game);
        } else if (shell && list[found].playoff) {
          SHELL.forEach(function (key) {
            if (own(shell, key) && shell[key] !== list[found][key]) { set(list[found], key, shell[key]); }
          });
        } else if (!shell && found !== -1 && list[found].playoff) {
          removeAt(list, found);
        }
      }

      if (results) {
        var played = list[weekAt(list, week)];
        if (!played || played.bye) { return; }
        var line = results[slug] || EMPTY;
        FIELDS.forEach(function (key) {
          set(played, key, copy(line[key] === undefined ? EMPTY[key] : line[key]));
        });
      }
    });
    stampIn(forSeason, week, at);
  }

  /* Everybody else's scores that week, in place of whatever the results
     file has for it. */
  function layScores(season, week, scores, at) {
    if (!EGE.nflSimResults) { set(EGE, 'nflSimResults', {}); }
    var all = EGE.nflSimResults;
    if (!all[season]) { set(all, String(season), { from: week, games: [] }); }
    var entry = all[season];
    var games = entry.games.filter(function (g) { return g.week !== week; })
      .concat((scores || []).map(function (g) { return Object.assign(copy(g), { week: week }); }))
      .sort(function (a, b) { return a.week - b.week || String(a.home).localeCompare(String(b.home)); });
    set(entry, 'games', games);
    if (week < entry.from) { set(entry, 'from', week); }
    stampIn(entry, week, at);
  }

  function byWeek(a, b) { return a.week - b.week; }

  /* One trade: his games from its week on are the new team's, the ones
     before it and any playoff game the file has stay -- and so does any
     game the file already has a score in, which he has played. */
  function layTrade(row) {
    var forSeason = EGE.stats[row.season];
    if (!forSeason || !row.slug || !row.to_team) { return; }
    var week = Number(row.week);
    var filed = ((forSeason.trades || {})[row.slug] || []).filter(function (t) { return t.week === week; })[0];
    if (filed && filed.to === row.to_team) { return; }
    if (!forSeason.trades) { set(forSeason, 'trades', {}); }
    set(forSeason.trades, row.slug, (forSeason.trades[row.slug] || []).filter(function (t) { return t.week !== week; })
      .concat([{ week: week, from: row.from_team || null, to: row.to_team }]).sort(byWeek));
    var games = (forSeason.games[row.slug] || []).filter(function (g) {
      return g.playoff || g.week < week || EGE.hasResult(g);
    });
    var played = {};
    games.forEach(function (g) { played[g.week] = true; });
    set(forSeason.games, row.slug, games.concat((row.games || []).filter(function (g) {
      return !played[g.week];
    }).map(copy)).sort(byWeek));
  }

  /* The trades over the files, after taking the last ones (and the weeks
     over them) off. */
  function layTrades(rows) {
    revertTrades();
    trades = rows || [];
    stack = undoTrades;
    try {
      trades.slice().sort(function (a, b) { return a.season - b.season || a.week - b.week; }).forEach(layTrade);
    } finally {
      stack = undo;
    }
  }

  /* Puts these rows over the files, after taking the last ones off. */
  function lay(rows) {
    revert();
    loaded = rows || [];
    var byWeek = index(loaded);
    Object.keys(byWeek).forEach(function (season) {
      var year = Number(season);
      Object.keys(byWeek[season]).map(Number).sort(function (a, b) { return a - b; }).forEach(function (week) {
        var parts = byWeek[season][week];
        var at = savedAt(parts);
        if (EGE.stats[year] && stampOf(EGE.stats[year], week) < at) { laySix(year, week, parts, at); }
        if (parts.results && stampOf((EGE.nflSimResults || {})[year], week) < at) {
          layScores(year, week, parts.results.scores, at);
        }
      });
    });
  }

  /* The rows from Supabase, every one this visitor can read, and the
     trades (sim_trades; left out, the ones already laid stay). Whether
     anything moved, so the page knows to draw again. */
  function apply(rows, tradeRows) {
    var list = (rows || []).slice().sort(function (a, b) {
      return a.season - b.season || a.week - b.week || String(a.part).localeCompare(String(b.part));
    });
    if (tradeRows !== undefined) { layTrades(tradeRows); }
    lay(list);
    var now = JSON.stringify(list.map(function (row) { return [row.season, row.week, row.part, row.saved_at]; })
      .concat(trades.map(function (row) { return [row.season, row.slug, row.week, row.saved_at]; })));
    if (now === seen) { return false; }
    seen = now;
    version += 1;
    /* The cards are built from the games once a load; these are games. */
    if (EGE.cards && EGE.cards.rebuild) { EGE.cards.rebuild(); }
    return true;
  }

  /* `fn` run on the files as they are, with only the trades laid over,
     then everything put back. What the NFL Sim tab works a stored week out
     from. */
  function pristine(fn) {
    var rows = loaded;
    revert();
    try {
      return fn();
    } finally {
      lay(rows);
    }
  }

  /* The rows of a season as loaded: { week: { results, fixtures } }. */
  function rowsOf(season) {
    return index(loaded)[season] || {};
  }

  /* The trade rows as loaded. */
  function tradeRows() {
    return trades.slice();
  }

  /* Whether the season file itself has any of the six's NFL results that
     week, and whether it says a stored week was folded into it. Asked of
     the files as they are. */
  function filed(season, week) {
    return pristine(function () {
      var forSeason = EGE.stats[season];
      if (!forSeason) { return false; }
      return nflSix(season).some(function (player) {
        return (forSeason.games[player.slug] || []).some(function (game) {
          return game.week === Number(week) && EGE.hasResult(game);
        });
      });
    });
  }

  function stamped(season, week) {
    return pristine(function () { return Boolean(stampOf(EGE.stats[season], week)); });
  }

  /* Every week of a season the file has any of the six's NFL results in. */
  function filedWeeks(season) {
    return pristine(function () {
      var forSeason = EGE.stats[season];
      var weeks = {};
      if (!forSeason) { return []; }
      nflSix(season).forEach(function (player) {
        (forSeason.games[player.slug] || []).forEach(function (game) {
          if (EGE.hasResult(game)) { weeks[game.week] = true; }
        });
      });
      return Object.keys(weeks).map(Number).sort(function (a, b) { return a - b; });
    });
  }

  /* The weeks laid over the season file just now: stored and not in it. */
  function overFile(season) {
    var forSeason = EGE.stats[season];
    var stamps = Object.assign({}, (forSeason && forSeason.stored) || {});
    return pristine(function () {
      var before = (EGE.stats[season] && EGE.stats[season].stored) || {};
      return Object.keys(stamps).filter(function (week) { return stamps[week] !== before[week]; })
        .map(Number).sort(function (a, b) { return a - b; });
    });
  }

  return {
    apply: apply,
    pristine: pristine,
    rows: rowsOf,
    trades: tradeRows,
    filed: filed,
    stamped: stamped,
    filedWeeks: filedWeeks,
    overFile: overFile,
    version: function () { return version; }
  };
})();
