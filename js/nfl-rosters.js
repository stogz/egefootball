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

   Three things are worked out from them here: how hard each defense is on
   one of the six's positions, for the ODEF grade on an NFL schedule; the
   defenders he will face in his next game, for the strip under it; and
   for an admin's eyes only a team's offense and defense as two overalls.

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

  /* --- what a roster adds up to -------------------------------------------

     Worked out here from the players' own ratings in the rosters, the same
     ones the Teams pages show, and nothing else: none of the sim's own team
     ratings, which stay in the world (see nfl-sim/README.md). Starters are
     the best healthy players at each spot, the sim's game-day lineup:
     nickel on defense, eleven personnel on offense. A spot with nobody
     healthy in it counts as a 55, the sim's stand-in. */

  function depth(rows) {
    var d = {};
    rows.forEach(function (p) {
      if (p.out) { return; }
      (d[p.pos] = d[p.pos] || []).push(p);
    });
    Object.keys(d).forEach(function (pos) {
      d[pos].sort(function (a, b) { return (b.ovr || 0) - (a.ovr || 0); });
    });
    return function (pos, i) { return (d[pos] || [])[i] || null; };
  }

  function skill(p, key) {
    if (!p) { return 55; }
    var v = p.skills && p.skills[key];
    return typeof v === 'number' ? v : p.ovr;
  }

  function weighted(list, valueOf) {
    var total = 0;
    var weight = 0;
    list.forEach(function (pair) {
      total += (pair[0] ? valueOf(pair[0]) : 55) * pair[1];
      weight += pair[1];
    });
    return weight ? total / weight : 55;
  }

  /* A defender's coverage, whatever he lines up as. */
  function cover(p) {
    if (!p) { return 55; }
    if (p.pos === 'CB') { return (skill(p, 'man') + skill(p, 'zone')) / 2; }
    if (p.pos === 'S') { return (skill(p, 'range') + skill(p, 'cover')) / 2; }
    return skill(p, 'cover');
  }

  /* How hard a defense is on one kind of player, from the ratings of the
     defenders he would see: a back the front and the safeties in the box
     (the sim's own run-defense sums, inside and out), a quarterback the
     pass rush and everybody in coverage, a receiver the corners and the
     deep safeties, a tight end the linebackers and safeties. */
  var MATCHUPS = {
    rush: {
      text: 'Run defense',
      short: 'Run Defense',
      score: function (at) {
        var inside = weighted([[at('DI', 0), 1.3], [at('DI', 1), 1.3], [at('LB', 0), 1.1], [at('LB', 1), 1.1],
          [at('EDGE', 0), 0.6], [at('EDGE', 1), 0.6], [at('S', 0), 0.3], [at('S', 1), 0.3]],
          function (p) { return skill(p, p.pos === 'S' ? 'box' : 'run'); });
        var outside = weighted([[at('EDGE', 0), 1.2], [at('EDGE', 1), 1.2], [at('LB', 0), 1], [at('LB', 1), 1],
          [at('DI', 0), 0.5], [at('DI', 1), 0.5], [at('S', 0), 0.5], [at('S', 1), 0.5], [at('CB', 0), 0.3], [at('CB', 1), 0.3]],
          function (p) { return skill(p, p.pos === 'S' ? 'box' : p.pos === 'CB' ? 'tackle' : p.pos === 'LB' ? 'speed' : 'run'); });
        return (inside + outside) / 2;
      }
    },
    QB: {
      text: 'Pass defense',
      short: 'Pass Defense',
      score: function (at) {
        return 0.35 * passRush(at) +
          0.15 * weighted([[at('LB', 0), 1], [at('LB', 1), 1], [at('S', 0), 0.4]],
            function (p) { return skill(p, p.pos === 'S' ? 'box' : 'blitz'); }) +
          0.5 * weighted([[at('CB', 0), 1.1], [at('CB', 1), 1], [at('CB', 2), 0.7], [at('S', 0), 0.9], [at('S', 1), 0.9],
            [at('LB', 0), 0.5], [at('LB', 1), 0.5]], cover);
      }
    },
    WR: {
      text: 'Coverage on receivers',
      short: 'Pass Defense',
      score: function (at) {
        return 0.25 * passRush(at) +
          0.75 * weighted([[at('CB', 0), 1.2], [at('CB', 1), 1.1], [at('CB', 2), 0.8], [at('S', 0), 0.6], [at('S', 1), 0.6]],
            function (p) { return p.pos === 'S' ? skill(p, 'range') : cover(p); });
      }
    },
    TE: {
      text: 'Coverage on tight ends',
      short: 'Pass Defense',
      score: function (at) {
        return 0.25 * passRush(at) +
          0.75 * weighted([[at('LB', 0), 1.1], [at('LB', 1), 1], [at('S', 0), 1], [at('S', 1), 0.9], [at('CB', 2), 0.5]],
            function (p) { return p.pos === 'S' ? (skill(p, 'cover') + skill(p, 'box')) / 2 : cover(p); });
      }
    }
  };

  function passRush(at) {
    return weighted([[at('EDGE', 0), 1.3], [at('EDGE', 1), 1.3], [at('DI', 0), 0.8], [at('DI', 1), 0.8]],
      function (p) { return skill(p, 'rush'); });
  }

  function matchupFor(position) {
    if (position === 'RB' || position === 'FB') { return 'rush'; }
    return MATCHUPS[position] ? position : 'QB';
  }

  /* Every team's defense against `position`, best first:
     [{ key, score }], or null before the season's rosters are in. */
  var ranked = {};
  function defenseRanks(season, position) {
    var all = cache[season];
    if (!all || !all.teams) { return null; }
    var kind = matchupFor(position);
    var id = season + ':' + kind;
    if (ranked[id] && ranked[id].from === all) { return ranked[id].list; }
    var list = Object.keys(all.teams).map(function (key) {
      return { key: key, score: MATCHUPS[kind].score(depth(all.teams[key])) };
    }).sort(function (a, b) { return b.score - a.score; });
    ranked[id] = { from: all, list: list };
    return list;
  }

  /* The grade one of the six gets for a defense: where it ranks against
     his position among the NFL's teams, a fifth of the league a letter,
     with the rating it ranks on (`score`, out of 99 like an overall) and
     what to call that rating (`short`).
     Null until the rosters are in (load() them first), or for a team the
     rosters do not have. */
  function defenseGrade(season, key, position) {
    var list = defenseRanks(season, position);
    if (!list) { return null; }
    var at = -1;
    list.forEach(function (row, i) { if (row.key === key) { at = i; } });
    if (at === -1) { return null; }
    var letters = EGE.GRADES;
    var letter = letters[Math.min(letters.length - 1, Math.floor(at / list.length * letters.length))];
    var what = MATCHUPS[matchupFor(position)].text;
    return {
      letter: letter,
      score: Math.round(list[at].score),
      short: MATCHUPS[matchupFor(position)].short,
      side: matchupFor(position) === 'rush' ? 'rush' : 'pass',
      rank: at + 1,
      of: list.length,
      level: 'NFL',
      season: season,
      text: what + ': ' + letter + ' \u2014 ' + EGE.ordinal(at + 1).toLowerCase() + ' of ' + list.length +
        ' in the NFL, by its players\u2019 ratings'
    };
  }

  /* The defenders one of the six will actually line up against, from the
     same depth chart the grade is worked out on: a back the front seven
     and the box safety, a quarterback the whole defense, a receiver the
     corners and safeties, a tight end the edge rushers he blocks and the
     linebackers and safeties who cover him. Hurt players are not in it. */
  var FACING = {
    rush: [['DI', 0], ['DI', 1], ['EDGE', 0], ['EDGE', 1], ['LB', 0], ['LB', 1], ['S', 0]],
    QB: [['EDGE', 0], ['EDGE', 1], ['DI', 0], ['DI', 1], ['LB', 0], ['LB', 1], ['CB', 0], ['CB', 1], ['CB', 2],
         ['S', 0], ['S', 1]],
    WR: [['CB', 0], ['CB', 1], ['CB', 2], ['S', 0], ['S', 1]],
    TE: [['EDGE', 0], ['EDGE', 1], ['LB', 0], ['LB', 1], ['S', 0], ['S', 1]]
  };

  /* Those defenders as roster rows, in that order, or null before the
     season's rosters are in or for a team they do not have. */
  function facing(season, key, position) {
    var all = cache[season];
    var rows = all && all.teams ? all.teams[key] : null;
    if (!rows || !rows.length) { return null; }
    var at = depth(rows);
    return FACING[matchupFor(position)].map(function (slot) { return at(slot[0], slot[1]); })
      .filter(Boolean);
  }

  /* A team's offense and defense as two overalls, for an admin only: the
     starters' overalls with the ones that matter most counting most -- the
     quarterback a third of the offense. `ovrOf(row)` is the overall to use
     for a player (one of the six's is his site overall). Never drawn for
     anybody else; see renderNflRoster in js/app.js. */
  var UNITS = {
    offense: [['QB', 0, 0.34], ['RB', 0, 0.12], ['RB', 1, 0.04], ['WR', 0, 0.14], ['WR', 1, 0.11],
              ['WR', 2, 0.08], ['TE', 0, 0.12], ['TE', 1, 0.05]],
    defense: [['EDGE', 0, 0.12], ['EDGE', 1, 0.10], ['DI', 0, 0.10], ['DI', 1, 0.08], ['LB', 0, 0.10],
              ['LB', 1, 0.07], ['CB', 0, 0.12], ['CB', 1, 0.10], ['CB', 2, 0.06], ['S', 0, 0.08], ['S', 1, 0.07]]
  };

  function unitOveralls(season, key, ovrOf) {
    var all = cache[season];
    var rows = all && all.teams ? all.teams[key] : null;
    if (!rows || !rows.length) { return null; }
    var withOvr = rows.map(function (p) { return Object.assign({}, p, { ovr: ovrOf ? ovrOf(p) : p.ovr }); });
    var at = depth(withOvr);
    var out = {};
    Object.keys(UNITS).forEach(function (side) {
      out[side] = Math.round(weighted(UNITS[side].map(function (slot) {
        return [at(slot[0], slot[1]), slot[2]];
      }), function (p) { return p.ovr; }));
    });
    return out;
  }

  EGE.nflRosters = {
    load: load,
    get: function (season) { return cache[season]; },
    /* The admin page, having just published a season's rosters. */
    set: function (season, rosters) { cache[season] = rosters; },
    forget: function (season) { delete cache[season]; file = null; },
    defenseGrade: defenseGrade,
    facing: facing,
    unitOveralls: unitOveralls,
    /* One team's players, best first, or null. */
    team: function (season, key) {
      var all = cache[season];
      return all && all.teams ? all.teams[key] || null : null;
    }
  };
})();
