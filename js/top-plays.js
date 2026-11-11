/* ==========================================================================
   EGE Football — a week's top plays, for the League page
   The snaps that earned a player the most fantasy points (Sam,
   2026-11-10), out of the snaps every game keeps for Live Mode
   (pbp-{season}-{week}.json, which only an admin can read). The NFL Sim
   tab picks them as it puts the week's box scores up (js/nfl-sim-admin.js
   syncBoxes), and they ride on each game in sim_box_scores as `plays`.
   Nothing private goes with them, as in the feed.

   pick(entries, heat): a game's feed (nfl-sim/lib/live.js build) and its
   heat (js/live-heat.js map). Each play is
     { s: the score once it was over [home, away], q, c: the quarter and
       the clock when it was snapped, gw: the game winner, ice: it iced
       the game,
       who: [{ n, pos, t, e, g, c: who he is (as the feed has him),
               w: the play as his ("44-yd touchdown catch"), f: his
               points, h: 1 alight once it was over, 2 blue }] }
   with the players on it best first, kept when one of them earned MIN
   points or more (every touchdown, and any gain of 40 yards or so).

   Points are the site's fantasy scoring of what the snap added to his
   line. The site's scoring has nothing for a defender's or a returner's
   touchdown, so a pick-six or a return for a score counts as a run would:
   6 and a point every 10 yards (Sam weighed a 90-yd pick-six over a
   1-yd game winner, 2026-11-10).

   rank(play, who): his points, and a lift for a game winner (WINNER) or a
   play that iced the game (ICING), enough to move it up the list but not
   to put a short score over a long one (Sam, 2026-11-10).
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.topPlays = (function () {
  'use strict';

  var MIN = 4;
  var WINNER = 4;
  var ICING = 2;
  /* "Late": the last five minutes of the fourth quarter, or overtime. */
  var LATE = 300;

  /* What a snap added to a player's line, on the site's fantasy scoring. */
  function points(l) {
    return EGE.economy.fantasyPoints({
      passingYards: l.passYds, passingTd: l.passTd, interceptions: l.passInt, rushingYards: l.rushYds,
      rushingTd: l.rushTd, receivingYards: l.recYds, receivingTd: l.recTd, receptions: l.rec, fumbles: l.fumLost
    });
  }

  function round(n) { return Math.round(n * 100) / 100; }

  /* The play as his, and what it earned him, or null for nothing. */
  function asHis(e, l) {
    if (l.defTd || l.retTd) {
      var m = /^(-?\d+)-yd/.exec(e.hl || '');
      var y = m ? +m[1] : 0;
      var words = l.ints ? y + '-yd pick six' : l.retTd ? (e.hl || y + '-yd return touchdown')
        : y + '-yd fumble return touchdown';
      return { w: words, f: round(6 + y / 10) };
    }
    var kind = l.passAtt ? ['pass', l.passYds, l.passTd] : l.rec ? ['catch', l.recYds, l.recTd]
      : l.rushAtt ? ['rush', l.rushYds, l.rushTd] : null;
    var f = points(l);
    if (!kind || !(f > 0)) { return null; }
    return { w: (kind[1] || 0) + '-yd ' + (kind[2] ? 'touchdown ' : '') + kind[0], f: f };
  }

  function late(at) { return at.q > 4 || (at.q === 4 && at.c <= LATE); }

  function pick(entries, heat) {
    var info = {};
    var out = [];
    var final = null;
    entries.forEach(function (e) { if (e && e.post && e.post.s) { final = e.post.s; } });
    /* The side that won, 0 home or 1 away, and its lead after each snap. */
    var won = final && final[0] !== final[1] ? (final[0] > final[1] ? 0 : 1) : null;
    function lead(s) { return s[won] - s[1 - won]; }
    entries.forEach(function (e, i) {
      if (!e) { return; }
      Object.keys(e.p || {}).forEach(function (n) { info[n] = e.p[n]; });
      if (!e.call || e.hidden || !e.d || !e.pre || !e.post) { return; }
      var who = [];
      Object.keys(e.d).forEach(function (n) {
        var p = info[n];
        var his = p ? asHis(e, e.d[n]) : null;
        if (!his) { return; }
        var row = { n: p.n, pos: p.pos, t: p.t, w: his.w, f: his.f };
        if (p.e) { row.e = p.e; }
        if (p.g) { row.g = p.g; }
        if (p.c) { row.c = true; }
        var h = (heat[i] || {})[n];
        if (h) { row.h = h; }
        who.push(row);
      });
      who.sort(function (a, b) { return b.f - a.f; });
      if (!who.length || who[0].f < MIN) { return; }
      var play = { s: e.post.s.slice(), q: e.pre.q, c: e.pre.c, who: who };
      /* A score by the side that won, late: the one that put it ahead for
         good, or the one that took a one-score lead past one score. */
      var before = e.pre.s ? lead(e.pre.s) : 0;
      var after = lead(e.post.s);
      if (won !== null && after > before && late(e.pre)) {
        var held = entries.slice(i + 1).every(function (x) { return !x || !x.post || !x.post.s || lead(x.post.s) > 0; });
        if (before <= 0 && after > 0 && held) {
          play.gw = 1;
        } else if (before >= 1 && before <= 8 && after >= 9) {
          play.ice = 1;
        }
      }
      out.push(play);
    });
    return out;
  }

  function rank(play, who) {
    return who.f + (play.gw ? WINNER : 0) + (play.ice ? ICING : 0);
  }

  var api = { pick: pick, rank: rank, points: points, MIN: MIN, WINNER: WINNER, ICING: ICING };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
  return api;
})();
