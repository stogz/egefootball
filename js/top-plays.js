/* ==========================================================================
   EGE Football — a week's top plays, for the League page
   The snaps that earned a player the most fantasy points (Sam,
   2026-11-10), out of the snaps every game keeps for Live Mode
   (pbp-{season}-{week}.json, which only an admin can read). The NFL Sim
   tab picks them as it puts the week's box scores up (js/nfl-sim-admin.js
   syncBoxes), and they ride on each game in sim_box_scores as `plays`:
   the play's words, and for each player who earned fantasy points on it
   his name, position, team, ESPN id, which of the six he is, his points
   and how hot he was once it was over. Nothing private, as in the feed.

   pick(entries, heat): a game's feed (nfl-sim/lib/live.js build) and its
   heat (js/live-heat.js map). Each play is
     { x: its words, hl, ht: a score's words and the side that scored,
       who: [{ n, pos, t, e, g, c, f: his points, h: 1 alight, 2 blue }] }
   with the players on it best first, kept when one of them earned MIN
   points or more (every touchdown pass, run or catch, and any gain of 40
   yards or so), the best plays first.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.topPlays = (function () {
  'use strict';

  var MIN = 4;
  var SKILL = { QB: true, RB: true, FB: true, WR: true, TE: true };

  /* What a snap added to a player's line, on the site's fantasy scoring. */
  function points(l) {
    return EGE.economy.fantasyPoints({
      passingYards: l.passYds, passingTd: l.passTd, interceptions: l.passInt, rushingYards: l.rushYds,
      rushingTd: l.rushTd, receivingYards: l.recYds, receivingTd: l.recTd, receptions: l.rec, fumbles: l.fumLost
    });
  }

  function pick(entries, heat) {
    var info = {};
    var out = [];
    entries.forEach(function (e, i) {
      if (!e) { return; }
      Object.keys(e.p || {}).forEach(function (n) { info[n] = e.p[n]; });
      if (!e.call || e.hidden || !e.d) { return; }
      var who = [];
      Object.keys(e.d).forEach(function (n) {
        var p = info[n];
        if (!p || !SKILL[p.pos]) { return; }
        var f = points(e.d[n]);
        if (!(f > 0)) { return; }
        var row = { n: p.n, pos: p.pos, t: p.t, f: f };
        if (p.e) { row.e = p.e; }
        if (p.g) { row.g = p.g; }
        if (p.c) { row.c = true; }
        var h = (heat[i] || {})[n];
        if (h) { row.h = h; }
        who.push(row);
      });
      who.sort(function (a, b) { return b.f - a.f; });
      if (!who.length || who[0].f < MIN) { return; }
      var play = { x: e.text, who: who };
      if (e.hl) {
        play.hl = e.hl;
        play.ht = e.ht;
      }
      out.push(play);
    });
    return out.sort(function (a, b) { return b.who[0].f - a.who[0].f; });
  }

  var api = { pick: pick, points: points, MIN: MIN };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
  return api;
})();
