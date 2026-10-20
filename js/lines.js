/* ==========================================================================
   EGE Football — the lines
   A point spread on every game the six have still to play, for the wagers
   (Sam, 2026-10-20): Seattle by 3.5 over Pittsburgh, and a wager takes one
   side of it. Taking Seattle, Seattle has to win by 4 or more; taking
   Pittsburgh, Pittsburgh has to win or lose by 3 or fewer. Every line ends
   in a half, so a wager is always won or lost, never a push, and the
   closest a game gets is a half point.

   A line is worked out from a projected score for each side, and the score
   from everything the page already shows and nothing it does not:

   - every result put out so far that season -- the six's own games, every
     conference race in data/conferences.js, and the NFL sim's other games
     (data/nfl-results.js) -- each team's points scored and allowed, with
     who it played taken into account, so forty against a bad defense
     counts for less than forty against a good one. A blowout past four
     touchdowns counts half of what it ran up past that;
   - where each team stood before a ball was kicked, which the season's own
     results take over from as they come in (worth a few games at the
     start, and less and less after): in the NFL its starters' ratings off
     the rosters on the Teams pages (js/nfl-rosters.js, never the sim's own
     team ratings), in college its defense's yards allowed off
     data/defenses.js and whether it is an FCS school. Either way, last
     season's results when the site has them, worth as much again;
   - who is at home, and nobody at a neutral site;
   - one of the six out hurt for the game, once his injury report is up
     (EGE.outInjured): his team scores less without him, a quarterback
     most of all.

   A result counts only once its week is published and only from before the
   game, so a line never knows a score the site has not put out. It moves
   as the weeks come out, like a real one does; a wager keeps the line it
   was taken at (`line` on its row in game_boosters, and on the game in the
   season file once the admin writes it in).
   ========================================================================== */

(function () {
  'use strict';

  window.EGE = window.EGE || {};

  /* Points a team scores in an average game, which the season's own
     results replace once there are enough of them; what being at home is
     worth across a game; how many games' worth of say the preseason guess
     has; and the longest line drawn. */
  var LEAGUES = {
    nfl:     { points: 21.5, home: 1.6, prior: 4, longest: 24.5 },
    college: { points: 28,   home: 2.6, prior: 3, longest: 45.5 }
  };

  /* A blowout says less than its score: past this margin, half of the rest
     counts. */
  var BLOWOUT = 28;

  /* Points a starter's overall point is worth, an NFL roster against the
     league's average one; and a hundred yards a game of defense, in college. */
  var NFL_PER_OVERALL = 1.3;
  var COLLEGE_PER_YARD = 0.07;

  /* What an FCS school gives away to an FBS one, each side of the ball. */
  var FCS = 12;

  /* What his team's scoring loses with one of the six out hurt. */
  var OUT = { QB: 4, RB: 1, FB: 0.5, WR: 1.2, TE: 0.8 };

  function mean(list, fallback) {
    if (!list.length) { return fallback; }
    return list.reduce(function (sum, n) { return sum + n; }, 0) / list.length;
  }

  function leagueRules(league) { return LEAGUES[league] || LEAGUES.college; }

  /* --- the results ------------------------------------------------------- */

  /* Every game of the league's season with a published score, from before
     week `before`, each once: { home, away, score: [home, away], neutral }.
     A game across the conferences is listed without who was at home, so it
     counts as neutral. */
  function results(season, league, before) {
    var seen = {};
    var list = [];
    function add(week, home, away, score, neutral) {
      if (week >= before || !score || typeof score[0] !== 'number' || typeof score[1] !== 'number') { return; }
      var key = week + '|' + [home, away].sort().join('|');
      if (seen[key]) { return; }
      seen[key] = true;
      list.push({ home: home, away: away, score: score, neutral: Boolean(neutral) });
    }

    EGE.players.forEach(function (player) {
      if (EGE.leagueOf(player, season) !== league) { return; }
      var team = EGE.teamFor(player, season);
      if (!team) { return; }
      EGE.gamesPlayed(player, season).forEach(function (game) {
        var ours = [game.result.teamScore, game.result.opponentScore];
        if (game.home || game.neutral) {
          add(game.week, team.school, game.opponent, ours, game.neutral);
        } else {
          add(game.week, game.opponent, team.school, [ours[1], ours[0]], false);
        }
      });
    });

    var leagues = (EGE.conferences || {})[season] || {};
    var simmed = league === 'nfl' ? ((EGE.nflSimResults || {})[season] || null) : null;
    var from = simmed ? simmed.from : Infinity;
    function counts(game) { return game.week < from && EGE.isPublished(season, game.week); }
    Object.keys(leagues).forEach(function (id) {
      var each = leagues[id];
      if (Boolean(each.nfl) !== (league === 'nfl')) { return; }
      (each.games || []).forEach(function (game) {
        if (counts(game)) { add(game.week, game.home, game.away, game.score, game.neutral); }
      });
      (each.nonConference || []).forEach(function (game) {
        if (counts(game)) { add(game.week, game.school, game.opponent, game.score, true); }
      });
    });
    if (simmed) {
      simmed.games.forEach(function (game) {
        if (EGE.isPublished(season, game.week)) {
          add(game.week, game.home, game.away, game.score, game.neutral);
        }
      });
    }
    return list;
  }

  /* --- where a team stood beforehand -------------------------------------- */

  function flat(points) {
    return function () { return { off: points, def: points }; };
  }

  /* An NFL team's offense and defense from its starters' overalls (one of
     the six at his site overall, as the Teams page counts him), against
     the league's average roster. */
  function nflPriors(season, points) {
    var all = EGE.nflRosters ? EGE.nflRosters.get(season) : null;
    if (!all || !all.teams) { return flat(points); }
    var units = {};
    Object.keys(all.teams).forEach(function (key) {
      var unit = EGE.nflRosters.unitOveralls(season, key, function (sim) {
        var player = sim.ege ? EGE.playerBySlug(sim.ege) : null;
        return player ? EGE.overallFor(player) : sim.ovr;
      });
      if (unit) { units[key] = unit; }
    });
    var keys = Object.keys(units);
    var offense = mean(keys.map(function (key) { return units[key].offense; }), 0);
    var defense = mean(keys.map(function (key) { return units[key].defense; }), 0);
    return function (name) {
      var unit = units[EGE.nfl.keyByName(name)];
      if (!unit) { return { off: points, def: points }; }
      return {
        off: points + (unit.offense - offense) * NFL_PER_OVERALL,
        def: points - (unit.defense - defense) * NFL_PER_OVERALL
      };
    };
  }

  /* A school's defense from the yards it gave up a game, against the FBS
     average, and its offense guessed at a third as far the other way: a
     program good on one side of the ball tends to be good on the other.
     An FCS school is a long way down on both; a school the table does not
     have, a little way. */
  function collegePriors(season, points) {
    var table = EGE.defenseTable ? EGE.defenseTable(season) : null;
    var schools = table ? table.schools : {};
    var fbs = Object.keys(schools).filter(function (name) { return schools[name].level === 'FBS'; });
    var yards = mean(fbs.map(function (name) { return schools[name].rush + schools[name].pass; }), 380);
    return function (name) {
      var school = schools[name];
      if (!school) { return { off: points - 3, def: points + 3 }; }
      var def = points + (school.rush + school.pass - yards) * COLLEGE_PER_YARD;
      var off = points - (def - points) / 3;
      if (school.level !== 'FBS') { def += FCS; off -= FCS; }
      return { off: off, def: def };
    };
  }

  /* --- the ratings -------------------------------------------------------- */

  /* Each team's offense and defense as points scored and allowed against an
     average team at a neutral site, from its results with who they were
     against taken out, pulled toward `priorOf` by `weight` games' worth. */
  function solve(list, points, home, priorOf, weight) {
    var teams = {};
    function team(name) {
      if (!teams[name]) {
        var prior = priorOf(name);
        teams[name] = { off: prior.off, def: prior.def, prior: prior, games: [] };
      }
      return teams[name];
    }
    list.forEach(function (game) {
      var a = game.score[0];
      var b = game.score[1];
      var over = Math.abs(a - b) - BLOWOUT;
      if (over > 0) {
        var give = over / 4;
        if (a > b) { a -= give; b += give; } else { a += give; b -= give; }
      }
      var edge = game.neutral ? 0 : 1;
      team(game.home).games.push({ against: game.away, scored: a, allowed: b, edge: edge });
      team(game.away).games.push({ against: game.home, scored: b, allowed: a, edge: -edge });
    });

    var names = Object.keys(teams);
    for (var round = 0; round < 30; round += 1) {
      var next = {};
      names.forEach(function (name) {
        var t = teams[name];
        var off = t.prior.off * weight;
        var def = t.prior.def * weight;
        t.games.forEach(function (g) {
          var them = teams[g.against];
          off += g.scored - (them.def - points) - g.edge * home / 2;
          def += g.allowed - (them.off - points) + g.edge * home / 2;
        });
        var count = weight + t.games.length;
        next[name] = { off: off / count, def: def / count };
      });
      names.forEach(function (name) {
        teams[name].off = next[name].off;
        teams[name].def = next[name].def;
      });
    }
    return teams;
  }

  /* Points a team scores a game in the league, from the results when there
     are enough of them. */
  function averagePoints(list, fallback) {
    if (list.length < 15) { return fallback; }
    var total = 0;
    list.forEach(function (game) { total += game.score[0] + game.score[1]; });
    return total / (list.length * 2);
  }

  /* Last season's ratings, pulled a third of the way back to average, for a
     team that played enough of it; null for the rest. */
  function lastSeason(season, league) {
    var rules = leagueRules(league);
    var list = results(season - 1, league, Infinity);
    if (list.length < 30) { return function () { return null; }; }
    var points = averagePoints(list, rules.points);
    var teams = solve(list, points, rules.home, flat(points), rules.prior);
    return function (name, now) {
      var t = teams[name];
      if (!t || t.games.length < 5) { return null; }
      return { off: now + (t.off - points) * 2 / 3, def: now + (t.def - points) * 2 / 3 };
    };
  }

  /* Every team's ratings in the league's season going into `week`:
     { points, team(name) }. */
  function ratings(season, league, week) {
    var rules = leagueRules(league);
    var list = results(season, league, week);
    var points = averagePoints(list, rules.points);
    var before = league === 'nfl' ? nflPriors(season, points) : collegePriors(season, points);
    var last = lastSeason(season, league);
    function priorOf(name) {
      var now = before(name);
      var then = last(name, points);
      return then ? { off: (now.off + then.off) / 2, def: (now.def + then.def) / 2 } : now;
    }
    var teams = solve(list, points, rules.home, priorOf, rules.prior);
    return {
      points: points,
      team: function (name) { return teams[name] || priorOf(name); }
    };
  }

  /* What one of the six being out costs his team's scoring that week. */
  function hurt(season, week, school) {
    var cost = 0;
    EGE.players.forEach(function (player) {
      var team = EGE.teamFor(player, season);
      if (!team || team.school !== school) { return; }
      var game = EGE.gameInWeek(player, week, season);
      if (game && EGE.outInjured(player, game)) {
        cost += OUT[EGE.positionFor(player, season)] || 1;
      }
    });
    return cost;
  }

  /* --- the line ----------------------------------------------------------- */

  /* The line on one of a player's games, or null for a bye:
       { favorite: 'for' | 'against', spread: 3.5,
         for: -3.5, against: 3.5,              -- each side's line
         projected: { for: 24, against: 20 } }
     `for` is his own team, as in a wager. */
  EGE.gameLine = function (player, game) {
    if (!player || !game || game.bye || !game.opponent) { return null; }
    var team = EGE.teamFor(player, game.season);
    if (!team) { return null; }
    var league = EGE.leagueOf(player, game.season);
    var rules = leagueRules(league);
    var rated = ratings(game.season, league, game.week);
    var us = rated.team(team.school);
    var them = rated.team(game.opponent);
    var edge = game.neutral ? 0 : game.home ? 1 : -1;

    var ours = us.off + them.def - rated.points + edge * rules.home / 2 -
      hurt(game.season, game.week, team.school);
    var theirs = them.off + us.def - rated.points - edge * rules.home / 2 -
      hurt(game.season, game.week, game.opponent);
    ours = Math.max(3, ours);
    theirs = Math.max(3, theirs);

    var margin = ours - theirs;
    var favorite = margin > 0 || (margin === 0 && edge >= 0) ? 'for' : 'against';
    var spread = Math.min(rules.longest, Math.floor(Math.abs(margin)) + 0.5);

    /* The projected score, kept on the right side of the line. */
    var projected = { for: Math.round(ours), against: Math.round(theirs) };
    var under = favorite === 'for' ? 'against' : 'for';
    if (projected[favorite] <= projected[under]) { projected[favorite] = projected[under] + 1; }

    return {
      favorite: favorite,
      spread: spread,
      for: favorite === 'for' ? -spread : spread,
      against: favorite === 'against' ? -spread : spread,
      projected: projected
    };
  };

  /* A side's line as it is written: -3.5 as "−3.5", 3.5 as "+3.5". */
  EGE.lineText = function (line) {
    if (typeof line !== 'number') { return ''; }
    return (line < 0 ? '\u2212' : '+') + Math.abs(line);
  };

  /* What a side has to do to beat its line, in words. */
  EGE.coverText = function (team, line) {
    if (typeof line !== 'number' || !line) { return team + ' has to win'; }
    if (line < 0) { return team + ' has to win by ' + Math.ceil(-line) + ' or more'; }
    var margin = Math.floor(line);
    return margin ? team + ' has to win, or lose by ' + margin + ' or fewer' : team + ' has to win or tie';
  };

  /* Whatever a line needs loaded before it can be worked out: the NFL's
     rosters, for an NFL game. */
  EGE.lineReady = function (player, season) {
    if (EGE.leagueOf(player, season) !== 'nfl' || !EGE.nflRosters) { return Promise.resolve(); }
    return EGE.nflRosters.load(season).then(function () {}, function () {});
  };
})();
