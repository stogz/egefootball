/* ==========================================================================
   EGE Football — Live Mode: who is on fire
   A player gets hot (Sam, 2026-11-09, 2026-11-10) and his plays burn,
   orange, then blue once he is absurdly hot. Never a quarterback: backs,
   receivers, tight ends, defenders and kickers.

   He catches fire on his third big play in a row (blue on the fourth), on
   his second touchdown of the game (blue on the third) or on his second
   takeaway, an interception or a forced fumble (blue on the third).

   Once alight he keeps burning while he keeps making catches or picking
   up good yards. It goes out on two dropped passes, a fumble or a
   turnover on downs (a kicker's missed field goal too), or two plays in a
   row that lose yards; and it burns out once enough snaps pass without a
   good play from him (HEAT.burn).

   Worked out on the page from what each snap added to the lines (`d`), so
   every game ever put on follows the same rules, old ones included. A
   long return that did not score is read from the snap's words.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.liveHeat = (function () {
  'use strict';

  var HEAT = {
    flame: 3,   /* big plays in a row to catch fire; one more turns it blue */
    count: 2,   /* touchdowns, or takeaways, in a game to catch fire; one more turns it blue */
    drops: 2,   /* dropped passes that put it out */
    sour: 2,    /* plays in a row losing yards that put it out */
    burn: 24    /* snaps without a good play before it burns out */
  };

  /* How hot so many make him: `at` lights him, more turns it blue. */
  function levelOf(n, at) { return n > at ? 2 : n === at ? 1 : 0; }

  /* Who returned a kick or a punt that did not score, and how far:
     "..., Marvin Mims 44-yd return". */
  function returned(e, names) {
    if (e.tag !== 'kick' && e.tag !== 'punt') { return null; }
    var m = /, (.+) (\d+)-yd return$/.exec(e.text || '');
    if (!m || names[m[1]] === undefined) { return null; }
    return { n: names[m[1]], yds: +m[2], punt: e.tag === 'punt' };
  }

  /* What one snap did for one player. */
  function judge(e, n, l, back) {
    var rush = Boolean(l.rushAtt);
    var caught = Boolean(l.rec);
    var rushYds = l.rushYds || 0;
    var recYds = l.recYds || 0;
    var td = (l.rushTd || 0) + (l.recTd || 0) + (l.retTd || 0) + (l.defTd || 0);
    var take = (l.ints || 0) + (l.ff || 0);
    var fumbled = Boolean(l.fumLost);
    var drop = String(e.r) === String(n) && /, dropped pass$/.test(e.text || '');
    var big = td > 0 || take > 0 || Boolean(l.sacks) ||
      (rush && !fumbled && rushYds >= 12) || (caught && !fumbled && recYds >= 20) ||
      (Boolean(l.fgm) && (l.fgLong || 0) >= 50) ||
      Boolean(back && back.yds >= (back.punt ? 25 : 40));
    var lost = fumbled || (e.tag === 'downs' && (rush || Boolean(l.targets))) || (Boolean(l.fga) && !l.fgm);
    return {
      td: td,
      take: take,
      big: big,
      dud: !big && (drop || lost || (rush && rushYds <= 2)),
      good: big || (caught && recYds > 0) || (rush && rushYds >= 4) || Boolean(l.passDef) || Boolean(l.fgm),
      sour: (rush && rushYds < 0) || (caught && recYds < 0),
      drop: drop,
      lost: lost
    };
  }

  /* For every entry, who is alight once it is out: { number: 1 orange,
     2 blue }. A call not yet out, a wait and halftime change nothing. */
  function map(entries) {
    var info = {};
    var names = {};
    entries.forEach(function (e) {
      Object.keys((e && e.p) || {}).forEach(function (n) { info[n] = e.p[n]; names[e.p[n].n] = n; });
    });
    var st = {};
    var lit = {};
    return entries.map(function (e) {
      if (!e || e.hidden || !e.call) { return lit; }
      Object.keys(st).forEach(function (n) { if (st[n].lvl) { st[n].idle += 1; } });
      var back = returned(e, names);
      var who = Object.keys(e.d || {});
      if (back && who.indexOf(back.n) === -1) { who.push(back.n); }
      who.forEach(function (n) {
        if (!info[n] || info[n].pos === 'QB') { return; }
        var s = st[n] || (st[n] = { lvl: 0, streak: 0, tds: 0, takes: 0, drops: 0, sour: 0, idle: 0 });
        var j = judge(e, n, (e.d || {})[n] || {}, back && back.n === n ? back : null);
        s.tds += j.td;
        s.takes += j.take;
        s.streak = j.big ? s.streak + 1 : j.dud ? 0 : s.streak;
        if (s.lvl) {
          if (j.drop) { s.drops += 1; }
          s.sour = j.sour ? s.sour + 1 : 0;
          if (j.good) { s.idle = 0; }
          if (j.lost || s.drops >= HEAT.drops || s.sour >= HEAT.sour) { s.lvl = 0; s.streak = 0; }
        }
        var want = Math.max(levelOf(s.streak, HEAT.flame), j.td ? levelOf(s.tds, HEAT.count) : 0,
                            j.take ? levelOf(s.takes, HEAT.count) : 0);
        if (want > s.lvl) { s.lvl = want; s.drops = 0; s.sour = 0; s.idle = 0; }
      });
      var now = {};
      Object.keys(st).forEach(function (n) {
        if (st[n].lvl && st[n].idle >= HEAT.burn) { st[n].lvl = 0; st[n].streak = 0; }
        if (st[n].lvl) { now[n] = st[n].lvl; }
      });
      lit = now;
      return lit;
    });
  }

  var api = { map: map, HEAT: HEAT };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
  return api;
})();
