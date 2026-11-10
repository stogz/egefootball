/* ==========================================================================
   EGE Football — the personalities
   Now and then, not every week (Sam, 2026-11-10), somebody with a big
   following weighs in on the week the league just played. Each has a
   voice of his own, written here from scratch -- nothing any of them has
   really said -- and only ever about the sim's games:

   - Stephen A Smith: critical, loud, the odd word in capitals; now and
     then he hands out flowers for a great game.
   - SleeperNFL: unserious. Fantasy slander and memes, lower case.
   - Skip Bayless: critical like Stephen A, but measures the young against
     the greats of his day and finds them wanting, and thinks the game was
     better then. The Cowboys are the exception: he talks them up after a
     win and always on a streak.
   - Ian Rapoport: the trade man. Before the deadline he reports who is
     being shopped, and after a trade he sometimes says what he makes of it
     (trade below), the teams as hashtags the way he writes them.
   - Cam Newton: a little goofy. Slanders whoever falls short, gives his
     props to whoever earns them.
   - Pat McAfee: mostly positive. Big finishes, ballers, and kickers.
   - LeBron James: whoever had a big day, by name, with a pile of emojis
     and hardly ever a number.
   - Shannon Sharpe: loud and sure; a tight end who knows what the job
     takes, a Broncos man, and no friend of the Cowboys.
   - Chad Johnson: goofy, and only about receivers.
   - JJ Watt: sincere and upbeat, the defense and the big men first, and
     his Texans.
   - Terrell Owens: all for the receivers, and quick to blame the
     quarterback when one does not get the ball.
   Skip never uses an emoji (Sam); LeBron uses a lot of them; everybody
   else one at most.

   week(context) is what js/media-news.js asks after the week's news: none
   most weeks, one about half of them, two now and then, each about
   something that happened that week. trade(trade) is Rapoport on a trade
   ESPN has just tweeted, or null (most trades). The accounts are in
   data/media.js; js/media.js draws and posts them like any other.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.mediaVoices = (function () {
  'use strict';

  var STEPHEN = 'preset:stephen-a';
  var SLEEPER = 'preset:sleeper';
  var SKIP = 'preset:skip';
  var RAP = 'preset:rapsheet';
  var CAM = 'preset:cam';
  var PAT = 'preset:mcafee';
  var LEBRON = 'preset:lebron';
  var SHANNON = 'preset:shannon';
  var CHAD = 'preset:ochocinco';
  var WATT = 'preset:jj-watt';
  var TO = 'preset:terrell-owens';

  /* How often anybody speaks after a week, and a second voice after the
     first: a dozen or so tweets a season among the eleven, so each is
     heard from once or twice, never a weekly column. */
  var SPEAK = 0.5;
  var SPEAK_PLAYOFFS = 0.6;
  var SECOND = 0.25;
  /* How much each is heard from, of the ones with something to say. */
  var SHARE = {};
  SHARE[STEPHEN] = 1;
  SHARE[SLEEPER] = 1.2;
  SHARE[SKIP] = 0.9;
  SHARE[RAP] = 0.7;
  SHARE[CAM] = 0.9;
  SHARE[PAT] = 1;
  SHARE[LEBRON] = 1.1;
  SHARE[SHANNON] = 0.9;
  SHARE[CHAD] = 0.9;
  SHARE[WATT] = 0.8;
  SHARE[TO] = 0.8;
  /* How often Rapoport follows ESPN's tweet of a trade. */
  var RAP_TAKE = 0.35;
  var RAP_TAKE_SIX = 0.7;
  /* How often Skip crows about a Cowboys streak or playoff win. */
  var SKIP_COWBOYS = 0.75;

  function kit() { return EGE.mediaNews.kit; }

  /* --- small things ---------------------------------------------------------- */

  var WORDS = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN',
               'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
  var TENS = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
  var PLURAL = { QB: 'quarterbacks', RB: 'running backs', WR: 'receivers', TE: 'tight ends' };
  var LEGENDS = {
    QB: ['Joe Montana', 'Dan Marino', 'John Elway', 'Troy Aikman', 'Roger Staubach', 'Brett Favre'],
    RB: ['Emmitt Smith', 'Barry Sanders', 'Walter Payton', 'Eric Dickerson', 'Jim Brown'],
    WR: ['Jerry Rice', 'Michael Irvin', 'Randy Moss', 'Terrell Owens'],
    TE: ['Tony Gonzalez', 'Jason Witten', 'Kellen Winslow', 'Mike Ditka'],
    D: ['Lawrence Taylor', 'Reggie White', 'Deion Sanders', 'Ray Lewis']
  };
  var EMOJI = /\p{Extended_Pictographic}/u;
  var DEFENSE = /^(DI|DE|DT|EDGE|LB|ILB|OLB|CB|S|FS|SS|DB|DL)$/;
  var FG = /^(.+) (\d+)-yard field goal$/;

  /* A number as Stephen A shouts it: THIRTY-ONE. */
  function upper(n) {
    if (n < 20) { return WORDS[n] || String(n); }
    if (n < 100) { return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + WORDS[n % 10] : ''); }
    return String(n);
  }

  /* A tweet from `templates`, dressed with one of `emojis` (p of the time)
     unless it carries its own. A template can be [text, its own emojis],
     for the ones only some emojis suit. */
  function write(templates, words, emojis, p) {
    var k = kit();
    var order = templates.slice().sort(function () { return Math.random() - 0.5; });
    for (var i = 0; i < order.length; i += 1) {
      var t = Array.isArray(order[i]) ? order[i] : [order[i], emojis];
      var text = k.say([t[0]], words);
      if (text) { return EMOJI.test(text) ? text : k.dress(text, t[1], p); }
    }
    return null;
  }

  /* Fantasy points, as a Sleeper league scores them (full PPR). */
  function fpts(l) {
    var n = (l.passYds || 0) * 0.04 + (l.passTd || 0) * 4 - (l.passInt || 0) * 2 +
            (l.rushYds || 0) * 0.1 + (l.rushTd || 0) * 6 +
            (l.rec || 0) + (l.recYds || 0) * 0.1 + (l.recTd || 0) * 6;
    return Math.round(n * 10) / 10;
  }

  /* A line as somebody would say it in a sentence. */
  function brief(l) {
    var k = kit();
    var tdAll = (l.rushTd || 0) + (l.recTd || 0);
    if (l.pos === 'QB') {
      return (l.passCmp || 0) + '/' + (l.passAtt || 0) + ', ' + k.commas(l.passYds || 0) + ' yards, ' + (l.passTd || 0) + ' TD' +
             (l.passInt ? ', ' + l.passInt + ' INT' : '') + ((l.rushYds || 0) >= 40 ? ', ' + l.rushYds + ' rushing' : '');
    }
    if (l.pos === 'RB') {
      return (l.rushAtt || 0) + ' carries, ' + k.commas(l.rushYds || 0) + ' yards' + (tdAll ? ', ' + tdAll + ' TD' : '') +
             ((l.recYds || 0) >= 30 ? ', ' + l.rec + ' catches for ' + l.recYds : '');
    }
    return (l.rec || 0) + ' catches, ' + k.commas(l.recYds || 0) + ' yards' + (l.recTd ? ', ' + l.recTd + ' TD' : '');
  }

  /* --- what happened ------------------------------------------------------------ */

  /* The week as the personalities see it: every game, with what made it
     one to talk about, and every skill player's line with how he did and
     who he is (his overall and age, from the rosters). */
  function read(ctx) {
    var k = kit();
    var games = [];
    var lines = [];
    (ctx.games || []).forEach(function (g) {
      if (!g.score || g.score[0] === g.score[1]) { return; }
      var s = k.sides(g);
      var wi = g.home === s.w ? 0 : 1;
      var all = k.plays(g);
      var deficit = 0;
      all.forEach(function (p) { deficit = Math.max(deficit, p.score[1 - wi] - p.score[wi]); });
      var last = all[all.length - 1];
      var prior = all.length > 1 ? all[all.length - 2].score : [0, 0];
      var late = last && last.team === s.w && (last.qtr >= 5 || (last.qtr === 4 && last.left <= 120)) &&
                 prior[wi] <= prior[1 - wi] ? last : null;
      var wr = ctx.before[s.w];
      var lr = ctx.before[s.l];
      var game = {
        g: g, s: s, deficit: deficit, late: late, ot: Boolean(g.ot), round: g.round || null,
        upset: Boolean(wr && lr && wr.w + wr.l >= 3 && lr.w + lr.l >= 3 && k.pct(lr) - k.pct(wr) >= 0.3),
        words: {
          winner: k.nick(s.w), Winner: k.full(s.w), winnerCity: k.city(s.w), WINNER: k.nick(s.w).toUpperCase(),
          loser: k.nick(s.l), Loser: k.full(s.l), loserCity: k.city(s.l), LOSER: k.nick(s.l).toUpperCase(),
          ws: s.ws, ls: s.ls, score: s.ws + '-' + s.ls, margin: s.margin, MARGIN: upper(s.margin),
          total: s.ws + s.ls, where: g.round === 'Super Bowl' ? 'the Super Bowl' : k.city(g.home), deficit: deficit,
          wwas: wr ? k.record(wr) : '', lwas: lr ? k.record(lr) : '',
          wrec: ctx.after[s.w] ? k.record(ctx.after[s.w]) : '', lrec: ctx.after[s.l] ? k.record(ctx.after[s.l]) : ''
        }
      };
      games.push(game);
      (g.box || []).forEach(function (l) {
        if (!PLURAL[l.pos] && l.pos !== 'K' && !DEFENSE.test(l.pos)) { return; }
        var row = k.rosterRow(ctx.rosters, l.team, l.name);
        var ovr = row ? row.ovr : (l.ege ? 90 : 0);
        lines.push({
          l: l, game: game, team: l.team, opp: l.team === g.home ? g.away : g.home, won: l.team === s.w,
          ovr: ovr, age: row ? row.age : null, years: row ? row.years : null, ege: Boolean(l.ege),
          star: ovr >= 85 || Boolean(l.ege), score: k.standout(l), pts: fpts(l)
        });
      });
    });
    return { games: games, lines: lines };
  }

  /* How badly a star fell short, or 0. */
  function dud(x) {
    var l = x.l;
    if (!x.star) { return 0; }
    if (l.pos === 'QB' && (l.passAtt || 0) >= 15) {
      if ((l.passInt || 0) >= 3) { return 1 + l.passInt * 0.4 + (x.won ? 0 : 0.3); }
      if (!l.passTd && !l.rushTd && (l.passYds || 0) < 190 && !x.won) { return 1 + (190 - (l.passYds || 0)) / 150; }
      return 0;
    }
    if (l.pos === 'RB' && (l.rushAtt || 0) >= 10 && !l.rushTd && !l.recTd) {
      var ypc = (l.rushYds || 0) / l.rushAtt;
      return ypc < 3.2 && (l.recYds || 0) < 30 ? 1 + (3.2 - ypc) / 2 + (x.won ? 0 : 0.2) : 0;
    }
    if ((l.pos === 'WR' || l.pos === 'TE') && (l.targets || 0) >= 6 && !l.recTd && (l.recYds || 0) < 35) {
      return 1 + (35 - (l.recYds || 0)) / 40 + (x.won ? 0 : 0.2);
    }
    return 0;
  }

  function lineWords(x) {
    var k = kit();
    var l = x.l;
    var legends = LEGENDS[l.pos] || LEGENDS.D;
    var ypc = l.rushAtt ? (l.rushYds || 0) / l.rushAtt : 0;
    return {
      name: l.name, NAME: l.name.toUpperCase(), pos: l.pos, posPlural: PLURAL[l.pos] || 'players',
      team: k.nick(x.team), Team: k.full(x.team), city: k.city(x.team),
      opp: k.nick(x.opp), Opp: k.full(x.opp), oppCity: k.city(x.opp),
      stat: brief(l), pts: x.pts, age: x.age,
      yds: k.commas(l.passYds || l.rushYds || l.recYds || 0), passYds: k.commas(l.passYds || 0),
      rushYds: l.rushYds || 0, recYds: l.recYds || 0, cmp: l.passCmp || 0, att: l.passAtt || 0,
      ints: l.passInt || 0, INTS: upper(l.passInt || 0), carries: l.rushAtt || 0, ypc: ypc.toFixed(1),
      rec: l.rec || 0, targets: l.targets || 0,
      td: (l.passTd || 0) + (l.rushTd || 0) + (l.recTd || 0),
      legend: kit().pick(legends), result: x.won ? 'win' : 'loss'
    };
  }

  function byScore(list) { return list.slice().sort(function (a, b) { return b.score - a.score; }); }
  function greats(seen) {
    return byScore(seen.lines.filter(function (x) { return PLURAL[x.l.pos] && x.score >= 1.6; })).slice(0, 4);
  }
  /* The week's best defensive games: sacks, takeaways, a score. */
  function defenders(seen) {
    return byScore(seen.lines.filter(function (x) {
      return DEFENSE.test(x.l.pos) && x.score >= 1.4 && ((x.l.sacks || 0) >= 2 || x.l.ints || x.l.defTd || x.l.ff);
    })).slice(0, 3);
  }

  function sackText(n) { return n % 1 ? n.toFixed(1) : String(n); }

  /* A defender's day as a list: 3 sacks, 1 INT and a forced fumble. */
  function defList(l) {
    var k = kit();
    var rows = [];
    if (l.sacks) { rows.push(sackText(l.sacks) + (l.sacks === 1 ? ' sack' : ' sacks')); }
    if (l.ints) { rows.push(l.ints + (l.ints === 1 ? ' INT' : ' INTs')); }
    if (l.ff) { rows.push(l.ff + (l.ff === 1 ? ' forced fumble' : ' forced fumbles')); }
    if (l.defTd) { rows.push(l.defTd === 1 ? 'a touchdown' : l.defTd + ' touchdowns'); }
    if (l.tackles && rows.length < 3) { rows.push(l.tackles + ' tackles'); }
    return k.list(rows);
  }

  function duds(seen) {
    return seen.lines.map(function (x) { return { x: x, bad: dud(x) }; }).filter(function (d) { return d.bad > 0; })
      .sort(function (a, b) { return b.bad - a.bad; }).slice(0, 4);
  }

  /* A candidate tweet: who it is about, so two voices are not on the same
     thing, and how much it is worth saying. */
  function take(text, weight, about) { return text ? { text: text, weight: weight, about: about } : null; }

  /* --- Stephen A Smith ------------------------------------------------------------ */

  function stephenA(seen, ctx) {
    var k = kit();
    var out = [];
    var CROSS = ['😤', '🤦'];
    duds(seen).forEach(function (d) {
      var x = d.x;
      var w = lineWords(x);
      var t;
      if (x.l.pos === 'QB' && w.ints >= 3) {
        t = [
          '{ints} interceptions. {INTS}! Against the {opp}! I’m sorry, but {name} has GOT to be better than that. That is UNACCEPTABLE.',
          'Let me be very clear: what {name} did today was a DISGRACE. {cmp}-for-{att}, {passYds} yards, {ints} picks. The {team} deserve better. PERIOD.',
          'I don’t want to hear ANYTHING about {name} being elite. Not today. Not after {ints} interceptions against the {opp}.'
        ];
      } else if (x.l.pos === 'QB') {
        t = [
          '{name}: {passYds} yards. ZERO touchdowns. And a loss to the {opp}. Somebody in {city} needs to start asking some VERY hard questions.',
          'I’ve been patient with {name}. I am DONE being patient. {cmp}-for-{att}, {passYds} yards, no touchdowns. That is not good enough. Not in this league.'
        ];
      } else if (x.l.pos === 'RB') {
        t = [
          '{carries} carries for {yds} yards. Ladies and gentlemen, that is NOT a feature back. That is a PROBLEM in {city}.',
          '{name} ran it {carries} times for {yds} yards against the {opp}. {ypc} a carry! I don’t care WHO is blocking for you, that is unacceptable.'
        ];
      } else {
        t = [
          '{name}: {rec} catches, {yds} yards. You want to be paid like a number one? THEN PLAY LIKE ONE. Not today, my friend. Not today.',
          'Where was {name}?! {targets} targets and {yds} yards against the {opp}. When your team needs you, you have to SHOW UP.'
        ];
      }
      out.push(take(write(t, w, CROSS, 0.2), d.bad + (x.ege ? 0.3 : 0), x.l.name));
    });
    seen.games.forEach(function (game) {
      var w = game.words;
      if (game.upset && w.lwas) {
        out.push(take(write([
          'The {lwas} {loser} lost to the {wwas} {winner}?! THE {WINNER}?! Somebody has to answer for this. This is EMBARRASSING.',
          'I refuse to sit here and act like what the {loser} did today is acceptable. You LOST to the {winner}. At {lwas}! That is a DISGRACE.'
        ], w, CROSS, 0.2), 1.5, w.loser));
      }
      if (game.s.margin >= 28 && !game.round) {
        out.push(take(write([
          'The {loser} got beat by {margin}. {MARGIN} POINTS! That is not a loss, that is an EMBARRASSMENT. Somebody check the effort level in that building.'
        ], w, CROSS, 0.2), 1 + game.s.margin / 60, w.loser));
      }
    });
    if (ctx.regular) {
      Object.keys(ctx.after || {}).forEach(function (key) {
        var run = k.streak(ctx.after[key]);
        if (run.won || run.n < 4) { return; }
        var w = { n: run.n, N: upper(run.n), team: k.nick(key), city: k.city(key) };
        out.push(take(write([
          '{n} straight losses. {N}! Somebody in {city} has some explaining to do, and I am not letting ANYBODY off the hook.',
          'The {team} have lost {n} in a row. I have seen enough. Something has to change in {city}, and it has to change NOW.'
        ], w, CROSS, 0.2), 0.8 + run.n / 10, w.team));
      });
    }
    /* Flowers, now and then. */
    greats(seen).forEach(function (x) {
      var w = lineWords(x);
      out.push(take(write([
        x.l.pos === 'QB' ? 'Now THAT is how you play quarterback! {name}: {stat}. I’ve been critical, I’ll admit it, but give the man his FLOWERS.'
          : 'Now THAT is how you play football! {name}: {stat}. I’ve been critical, I’ll admit it, but give the man his FLOWERS.',
        'I’ll give credit where credit is due. {name} was MAGNIFICENT today. Absolutely magnificent. {stat}.',
        'Ladies and gentlemen, {name}! {stat} against the {opp}. That is a GROWN man. I said what I said.'
      ], w, ['👏', '🔥'], 0.3), x.score * 0.45 + (x.ege ? 0.2 : 0), x.l.name));
    });
    /* NBC's ladder: never the man he would have at the top. */
    var table = ctx.ladder;
    if (table && ctx.week >= 5 && table.rows.length >= 3) {
      var top = table.rows[0];
      var him = table.rows[1 + Math.floor(Math.random() * 2)];
      var ladder = take(write([
        'NBC has {leader} at number one on the MVP ladder?! I’m sorry, I can’t do it. {him} is the MVP of this league right now and it is NOT close.',
        'Let me get this straight. {leader} is leading the MVP race and {him} is behind him? PREPOSTEROUS. Absolutely preposterous.'
      ], { leader: top.name, him: him.name }, CROSS, 0.2), 1.1, top.name);
      if (ladder) { ladder.afterLadder = true; out.push(ladder); }
    }
    return out.filter(Boolean);
  }

  /* --- SleeperNFL --------------------------------------------------------------- */

  function sleeper(seen) {
    var out = [];
    var SLANDER = ['💀', '😭', '🤡', '😂', '🙃'];
    duds(seen).forEach(function (d) {
      var x = d.x;
      var w = lineWords(x);
      var t = [
        ['if you started {name} this week we’re so sorry', ['💀', '😭']],
        ['{name} really put up {pts} fantasy points', ['💀']],
        ['{name} managers are in shambles', ['😭', '💀']],
        ['-1000 aura for {name} this week', ['💀']],
        'not {name} giving his fantasy managers {pts} points 😭',
        '{name}: {stat}\n\nthe slander will continue until performance improves 💀',
        ['{pts} fantasy points from {name}. we’re not mad, just disappointed', ['🙃']],
        ['the {opp} had {name} in witness protection all game', ['💀', '😂']]
      ];
      if (x.l.pos === 'QB' && w.ints >= 3) {
        t.push(['{name} threw {ints} picks. the {opp} should put him on their payroll', ['💀', '😂']]);
        t.push(['{name} kept throwing it to the guys in the other jerseys. {ints} times', ['💀', '🤡']]);
      }
      if (x.l.pos === 'RB') { t.push(['{name}: {carries} carries, {yds} yards. the o-line owes your fantasy team an apology', ['😭', '💀']]); }
      if (x.l.pos === 'WR' || x.l.pos === 'TE') {
        t.push(['{name} was so locked up today his fantasy managers filed a missing persons report', ['💀', '😭']]);
      }
      out.push(take(write(t, w, SLANDER, 0.8), d.bad + 0.2 + (x.ege ? 0.3 : 0), x.l.name));
    });
    greats(seen).forEach(function (x) {
      var w = lineWords(x);
      out.push(take(write([
        ['{name} just dropped {pts} on your fantasy league. that’s the tweet', ['🔥', '🤯']],
        ['{name} is HIM. we said what we said', ['😤', '🔥']],
        ['{name} put up {pts} points and you benched him didn’t you', ['😭', '💀']],
        ['{name} managers eating good tonight', ['🤑', '🍽️']],
        ['we have to stop letting {name} cook', ['😭', '🔥']],
        ['+1000 aura for {name} this week', ['😤', '🔥']],
        ['{name} was LOCKED IN today. {stat}', ['🔒', '😤']],
        ['this is your sign to never bench {name} again', ['🙏', '🔥']]
      ], w, ['🔥'], 0.8), x.score * 0.8 + (x.ege ? 0.2 : 0), x.l.name));
    });
    seen.games.forEach(function (game) {
      var w = game.words;
      if (game.s.ls === 0) {
        out.push(take(write([
          'the {loser} scored 0 points today. not a typo',
          'the {loser} offense left the building early today'
        ], w, ['💀', '🚪'], 0.9), 1.2, w.loser));
      } else if (game.s.margin >= 30) {
        out.push(take(write([
          '{winner} {ws}, {loser} {ls}. someone check on the {loser} group chat',
          'the {loser} were down bad today. like {margin} points bad',
          '{loser} fans it’s okay to log off for the night'
        ], w, ['💀', '😭'], 0.9), 1 + game.s.margin / 60, w.loser));
      }
    });
    return out.filter(Boolean);
  }

  /* --- Skip Bayless --------------------------------------------------------------- */

  var DALLAS = 'DAL';

  /* Skip on his Cowboys (Sam, 2026-11-10: "he should glaze the cowboys"):
     a win is proof, a streak is destiny, a loss was somebody else's
     fault. { candidates, big } -- big when the Cowboys have just made it
     three, five, seven or more in a row, or won in the playoffs, which
     Skip will not keep to himself. */
  function cowboys(seen, ctx) {
    var k = kit();
    var game = seen.games.filter(function (gm) { return gm.g.home === DALLAS || gm.g.away === DALLAS; })[0];
    if (!game) { return { candidates: [], big: false }; }
    var won = game.s.w === DALLAS;
    var other = won ? game.s.l : game.s.w;
    var r = ctx.after[DALLAS];
    var run = ctx.regular && r ? k.streak(r) : { won: won, n: 0 };
    var qb = (game.g.box || []).filter(function (l) { return l.team === DALLAS && l.pos === 'QB'; })
      .sort(function (a, b) { return (b.passAtt || 0) - (a.passAtt || 0); })[0];
    var star = byScore(seen.lines.filter(function (x) { return x.team === DALLAS && PLURAL[x.l.pos] && x.score >= 1.4; }))[0];
    var w = { opp: k.nick(other), score: game.s.ws + '-' + game.s.ls, rec: r ? k.record(r) : '', n: run.n,
              N: upper(run.n), qb: qb ? qb.name : '', star: star ? star.l.name : '', stat: star ? brief(star.l) : '' };
    var out = [];
    if (won && game.round === 'Super Bowl') {
      out.push(take(write([
        'THE DALLAS COWBOYS ARE SUPER BOWL CHAMPIONS. I have waited a long, long time to type that. How ’bout them Cowboys!',
        'MY COWBOYS ARE WORLD CHAMPIONS. {score} over the {opp}. To everybody who doubted this team for years: I TOLD YOU.'
      ], w, null, 0), 6, 'Cowboys'));
    } else if (won && game.round) {
      out.push(take(write([
        'MY COWBOYS ARE MOVING ON. {score} over the {opp}. Nobody wants any part of Dallas right now. NOBODY.',
        'How ’bout them Cowboys! {score} over the {opp}, and this team is just getting started. I can see the confetti from here.'
      ], w, null, 0), 5, 'Cowboys'));
    } else if (won && run.n >= 3) {
      out.push(take(write([
        '{n} straight for MY Cowboys. They’re {rec} and nobody wants to see Dallas in January. I’ve been saying it since August.',
        'How ’bout them Cowboys! {n} in a row. This team is BUILT for a Super Bowl run. Mark it down.',
        '{N} STRAIGHT. My Cowboys are rolling and the rest of the league knows it. {rec}. Start planning the parade.'
      ], w, null, 0), 3 + run.n / 4, 'Cowboys'));
    } else if (won) {
      var t = ['Cowboys win, {score} over the {opp}. I told you this team was different this year. I TOLD you.'];
      if (w.qb) { t.push('MY Cowboys just handled the {opp}, {score}. {qb} looked like Troy Aikman out there. Don’t look now, but Dallas is for real.'); }
      if (w.star) { t.push('{star} was the best player on that field today and it wasn’t close. {stat}. THAT is what a Cowboy looks like.'); }
      out.push(take(write(t, w, null, 0), 2.2, 'Cowboys'));
    } else {
      var excuses = ['Tough one for my Cowboys, but I am NOT worried. Not one bit. This team is fine. Trust me.'];
      if (game.s.margin <= 7) { excuses.push('The Cowboys didn’t lose that game. The officials took it from them. I said what I said.'); }
      out.push(take(write(excuses, w, null, 0), game.round ? 2.5 : 1.2, 'Cowboys'));
    }
    var big = won && (Boolean(game.round) || (run.n >= 3 && (run.n === 3 || run.n === 5 || run.n >= 7)));
    return { candidates: out.filter(Boolean), big: big };
  }

  function skip(seen, ctx) {
    var out = cowboys(seen, ctx).candidates;
    var SHRUG = null;   /* Skip never uses an emoji (Sam, 2026-11-10) */
    greats(seen).forEach(function (x) {
      var young = (x.age && x.age <= 24) || (x.years != null && x.years <= 2);
      var old = x.age && x.age >= 31;
      if ((!young && !old) || x.team === DALLAS) { return; }
      var w = lineWords(x);
      var t = young ? [
        'Everybody’s going crazy over {name}. Fine. Nice game. But {legend} did that EVERY week, against real defenses, when you could actually hit people. Pump the brakes.',
        '{name} put up {stat} and the internet wants to crown him. In my day that was a normal Sunday for {legend}. Wake me up when he does it in January.',
        'Here we go again. One big game and {name} is “the next {legend}.” He’s not. Not close.',
        'I’ll say it: today’s {posPlural} have it SO easy. No real hitting, flags on everything. {name} gets {yds} yards and they’re calling him great. Give me {legend} in his prime. Every time.'
      ] : [
        'See?! {name} is {age} years old and was the best player on that field. Experience MATTERS. I’ve been saying this for YEARS.',
        'Everybody wanted to write {name} off. {age} years old: {stat}. Old school wins. Always has.'
      ];
      out.push(take(write(t, w, SHRUG, 0), x.score * 0.8 + (x.ege ? 0.2 : 0), x.l.name));
    });
    duds(seen).forEach(function (d) {
      var x = d.x;
      if (!((x.age && x.age <= 25) || (x.years != null && x.years <= 3)) || x.team === DALLAS) { return; }
      var w = lineWords(x);
      out.push(take(write([
        x.l.pos === 'QB' && w.ints >= 3 ? '{name} threw {ints} picks today. I’ve been telling you all along: he’s not ready. {legend} would NEVER have looked this lost.'
          : '{name}: {stat}. I keep hearing he’s the future. The future looks a lot like the past, and not the good part of it.',
        'This is what happens when you hype a kid before he’s done anything. {name}: {stat}. {legend} had to EARN it.'
      ], w, SHRUG, 0), d.bad + (x.ege ? 0.3 : 0), x.l.name));
    });
    seen.games.forEach(function (game) {
      var w = Object.assign({ defLegend: kit().pick(LEGENDS.D) }, game.words);
      if (w.total >= 70) {
        out.push(take(write([
          '{total} points in {where}. That’s not football, that’s flag football. Defenses used to be allowed to hit people. The game I grew up loving is GONE.',
          '{winner} {ws}, {loser} {ls}. Nobody tackles anymore. {defLegend} would have eaten both of these offenses alive.'
        ], w, SHRUG, 0), 1 + (w.total - 70) / 30, w.winner));
      }
    });
    return out.filter(Boolean);
  }

  /* --- Ian Rapoport ---------------------------------------------------------------- */

  function tag(key) { return '#' + kit().nick(key).replace(/[^A-Za-z0-9]/g, ''); }

  /* Before the deadline: who is being shopped. Never one of the six:
     only Sam moves them. */
  function rapoport(seen, ctx) {
    var k = kit();
    var out = [];
    if (!ctx.regular || ctx.week < 4 || ctx.week > ctx.deadline || !ctx.rosters || !ctx.rosters.teams) { return out; }
    Object.keys(ctx.rosters.teams).forEach(function (key) {
      if (!EGE.nfl || !EGE.nfl.teams[key]) { return; }
      var r = ctx.after[key];
      if (!r || r.w + r.l < 3 || k.pct(r) > 0.4) { return; }
      /* The one or two biggest names on a losing team. */
      ctx.rosters.teams[key].filter(function (row) {
        if (row.ege || row.ovr < 79 || (row.age || 0) < 26 || /^(K|P|LS|FB)$/.test(row.pos)) { return false; }
        return !(row.out && (row.out.games === null || row.out.games >= 4));
      }).sort(function (a, b) { return b.ovr - a.ovr; }).slice(0, 2).forEach(function (row) {
        var left = ctx.deadline - ctx.week;
        var w = { name: row.name, pos: row.pos, team: tag(key), nick: k.nick(key), rec: k.record(r),
                  deadline: left <= 0 ? 'before the deadline' : left === 1 ? 'with a week to go before the deadline' : 'ahead of the deadline' };
        out.push(take(write([
          'Sources: The {team} have begun fielding calls on {pos} {name}. At {rec}, everything is on the table {deadline}.',
          'Keep an eye on {team} {pos} {name}. I’m told several contenders have checked in, and the {nick} are listening.',
          'The {team} aren’t shopping {name}, but they’ll listen. That’s new. Something to watch {deadline}.',
          'From what I understand, {name} would welcome a fresh start, and the {rec} {team} are open to it. Stay tuned.'
        ], w, null, 0), (row.ovr - 75) / 6 + Math.random() * 0.5, row.name));
      });
    });
    return out.filter(Boolean).sort(function (a, b) { return b.weight - a.weight; }).slice(0, 4);
  }

  /* --- Cam Newton ------------------------------------------------------------------- */

  function cam(seen) {
    var out = [];
    greats(seen).forEach(function (x) {
      var w = lineWords(x);
      var t = [
        ['I SEE YOU {NAME}!! {stat}. That’s GROWN MAN football right there', ['👀', '💪']],
        ['Respect where it’s due: {name} was COOKING today. {stat}. Let’s GOOO', ['🔥', '💪']],
        ['{name} got that DOG in him. {stat}. Can’t teach that', ['🐶', '💪']],
        ['Ain’t NOBODY guarding {name} right now. {stat}. It’s levels to this', ['🔥', '😤']]
      ];
      if (x.l.pos === 'QB' && (x.l.passYds || 0) >= 200 && (x.l.rushYds || 0) >= 50) {
        t = ['Dual-threat QB props!! {name} with {passYds} through the air AND {rushYds} on the ground. THAT’S what I’m talking about. Can’t nobody stop that',
             'You gotta respect a QB that can beat you with his arm AND his legs. {name}: {stat}. Let’s GO'];
      }
      out.push(take(write(t, w, ['💪', '🔥', '👀'], 0.65), x.score * 0.8 + (x.ege ? 0.3 : 0), x.l.name));
    });
    duds(seen).forEach(function (d) {
      var x = d.x;
      var w = lineWords(x);
      out.push(take(write([
        'Somebody check on {name} 😂 {stat}?? Bruh...',
        x.l.pos === 'QB' && w.ints >= 3 ? 'Respectfully... {name} gotta be better than that. {ints} picks?? Nah. Not at this level.'
          : 'Respectfully... {name} gotta be better than that. {stat}?? Nah. Not at this level.',
        '{name} out there playing like it’s the preseason. {stat}. Tighten up, bro',
        'I’m not gonna lie to y’all… {name} was NOT that guy today. {stat}. Gotta be better'
      ], w, ['😂', '🤦', '😭'], 0.6), d.bad + (x.ege ? 0.3 : 0), x.l.name));
    });
    seen.games.forEach(function (game) {
      if (!game.upset) { return; }
      out.push(take(write([
        'Them boys in {loserCity} gotta tighten up. You can’t lose to the {winner} like that. Can’t do it'
      ], game.words, ['🤦', '😂'], 0.6), 1.3, game.words.loser));
    });
    return out.filter(Boolean);
  }

  /* --- Pat McAfee ------------------------------------------------------------------- */

  function mcafee(seen, ctx) {
    var k = kit();
    var out = [];
    var HYPE = ['🔥', '💥', '🙌', '💪'];
    seen.games.forEach(function (game) {
      var w = game.words;
      var m = game.late ? FG.exec(game.late.text) : null;
      if (game.round === 'Super Bowl') {
        out.push(take(write([
          'CHAMPIONS!! Congrats to the {Winner} and everybody in {winnerCity}. Enjoy every second of this one, you earned it'
        ], w, ['🏆'], 0.9), 3, w.winner));
      }
      if (m) {
        var kw = Object.assign({ kicker: m[1], dist: m[2] }, w);
        out.push(take(write([
          'KICKERS ARE FOOTBALL PLAYERS and I will not be taking questions at this time. {kicker} from {dist} to win it',
          '{kicker} from {dist}... BOOM. Specialists win ballgames, everybody. Never forget it'
        ], kw, ['🎯', '💥', '🦵'], 0.7), 2.4, m[1]));
      } else if (game.late) {
        out.push(take(write([
          'WHAT A FINISH in {where}!! {winner} {ws}, {loser} {ls}. Football is the greatest sport on planet Earth and it is not close'
        ], w, HYPE, 0.6), 2.1, w.winner));
      }
      if (game.deficit >= 14) {
        out.push(take(write([
          'Down {deficit} and the {winner} said “not today.” That locker room believes in each other and you could FEEL it. LOVE this'
        ], w, HYPE, 0.6), 1.6 + game.deficit / 30, w.winner));
      }
      if (game.ot) {
        out.push(take(write([
          'OVERTIME BALLGAME!! {winner} {ws}, {loser} {ls}. My heart can’t take this. What a sport'
        ], w, HYPE, 0.6), 1.7, w.winner));
      }
      if (game.upset) {
        out.push(take(write([
          'Nobody gave the {winner} a chance today. They didn’t care one bit. BIG win, {score} over the {loser}. Absolute ballers'
        ], w, HYPE, 0.6), 1.5, w.winner));
      }
    });
    if (ctx.regular) {
      Object.keys(ctx.after || {}).forEach(function (key) {
        var was = ctx.before[key];
        var now = ctx.after[key];
        if (!was || !now || was.w !== 0 || was.l < 3 || now.w !== 1) { return; }
        out.push(take(write([
          'FINALLY!! The {team} are in the win column and I am genuinely so happy for those fans. They deserve it'
        ], { team: k.nick(key) }, HYPE, 0.6), 1.4, k.nick(key)));
      });
    }
    seen.lines.forEach(function (x) {
      if (x.l.pos !== 'K' || (x.l.fgm || 0) < 4) { return; }
      out.push(take(write([
        '{name} went {fgm}-for-{fga} today. Kickers win ballgames. Respect the leg'
      ], { name: x.l.name, fgm: x.l.fgm, fga: x.l.fga }, ['🦵', '🎯'], 0.7), 1 + x.l.fgm / 10, x.l.name));
    });
    greats(seen).forEach(function (x) {
      var w = lineWords(x);
      out.push(take(write([
        '{name} is an ABSOLUTE BALLER. {stat}. Pumped for the {team} faithful',
        'Shoutout {name}. {stat}. That’s a dude, man. That’s a DUDE',
        'Can we talk about {name} for a second?? {stat}. Football is fun, man'
      ], w, HYPE, 0.6), x.score * 0.8 + (x.ege ? 0.2 : 0), x.l.name));
    });
    return out.filter(Boolean);
  }

  /* --- LeBron James ----------------------------------------------------------------- */

  /* Whoever had a big day, by name, and emojis: lots of them, and hardly
     ever a number (Sam, 2026-11-10). */
  var BRON_EMOJI = ['🔥🔥🔥🔥', '🤯🤯🤯', '🙌🏾🙌🏾🙌🏾', '👑👑👑', '😤😤😤', '💪🏾💪🏾💪🏾', '👀👀👀👀', '🔥🔥🤯🤯', '🐐🐐', '🚀🚀🚀'];

  function lebron(seen) {
    var k = kit();
    var out = [];
    greats(seen).forEach(function (x) {
      var w = lineWords(x);
      w.e = k.pick(BRON_EMOJI);
      w.e2 = k.pick(BRON_EMOJI);
      var t = [
        '{NAME}!!!!!!! {e}',
        '{name} is SPECIAL!!!! {e}',
        'Man listen!!!! {name} {e}',
        'BRO!!!!!!!! {name} {e}{e2}',
        'Sheeeeesh!!!! {name} {e}',
        'Y’all see what {name} just did?!?!?! {e}',
        '{name} you’re HIM!!!! {e}',
        'WOW!!!!! {name} {e}'
      ];
      if ((x.age && x.age <= 24) || (x.years != null && x.years <= 2)) { t.push('Kid is a PROBLEM!!!! {name} {e}'); }
      if (k.chance(0.25)) { t = ['{yds} yards?!?!?! {name} {e}', '{name} with {td} touchdowns?!?! C’MON MAN!!!! {e}']; }
      out.push(take(k.say(t, w), x.score * 0.8 + (x.ege ? 0.3 : 0), x.l.name));
    });
    seen.games.forEach(function (game) {
      if (!game.late && !game.ot && game.round !== 'Super Bowl') { return; }
      var w = Object.assign({ e: k.pick(BRON_EMOJI) }, game.words);
      out.push(take(k.say(game.round === 'Super Bowl' ? ['CHAMPS!!!!!! Congrats {Winner}!!!! {e}'] : [
        'THIS GAME!!!!!! {e}',
        'Nah this {winner} {loser} game was CRAZY!!!! {e}'
      ], w), game.round === 'Super Bowl' ? 2.5 : 1.6, w.winner));
    });
    return out.filter(Boolean);
  }

  /* --- Shannon Sharpe --------------------------------------------------------------- */

  var BRONCOS = 'DEN';

  /* Loud and sure of himself, a Hall of Fame tight end who knows what the
     position takes; cheers his Broncos and has no sympathy for the
     Cowboys. */
  function shannon(seen) {
    var out = [];
    var LOUD = ['💯', '🔥', '😂'];
    greats(seen).forEach(function (x) {
      var w = lineWords(x);
      var t = x.l.pos === 'TE' ? [
        'As a tight end, let me tell y’all something: what {name} did today is HARD. {stat}. Give that man his respect.',
        'Tight ends don’t get enough love. {name}: {stat}. That’s a BAD man.'
      ] : [
        '{name} is a BAD man. {stat}. Y’all better start respecting him.',
        'That boy {name} can PLAY. I’m telling you. {stat}.',
        '{name} is HIM. Not him-ish. HIM.'
      ];
      out.push(take(write(t, w, ['💯', '🔥'], 0.5), x.score * 0.8 + (x.l.pos === 'TE' ? 0.5 : 0) + (x.ege ? 0.2 : 0), x.l.name));
    });
    duds(seen).forEach(function (d) {
      var w = lineWords(d.x);
      out.push(take(write([
        'I love {name}, but I can’t defend that. {stat}. Not good enough.',
        '{name}, you gotta be better than that, young fella. {stat}. Can’t happen.'
      ], w, ['😂', '🤦'], 0.4), d.bad * 0.8, d.x.l.name));
    });
    seen.games.forEach(function (game) {
      var w = game.words;
      if (game.s.l === 'DAL') {
        out.push(take(write([
          'The Cowboys lost to the {winner}, {score}. I’m not gonna say anything. I don’t have to.',
          'America’s Team, y’all. {winner} {ws}, Cowboys {ls}. Same old Cowboys.'
        ], w, LOUD, 0.6), 2, 'Cowboys'));
      }
      if (game.s.w === BRONCOS) {
        out.push(take(write([
          'BRONCOS WIN! {score} over the {loser}. Mile High, stand up!',
          'That’s my Broncos! {score} over the {loser}. Let’s ride.'
        ], w, ['🐴', '🔥'], 0.6), 1.6, 'Broncos'));
      }
    });
    return out.filter(Boolean);
  }

  /* --- Chad Johnson ------------------------------------------------------------------ */

  /* Goofy, and only about receivers (Sam, 2026-11-10). */
  function chad(seen) {
    var out = [];
    var LAUGH = ['😂😂', '🤣🤣', '😂🤣'];
    greats(seen).forEach(function (x) {
      if (x.l.pos !== 'WR') { return; }
      var w = Object.assign({ lol: kit().pick(LAUGH) }, lineWords(x));
      out.push(take(kit().say([
        '{name} put that DB in a blender {lol} {stat}. WR gang stand up!',
        'Somebody tell the {opp} secondary it’s okay to cover {name} {lol} {rec} catches, {yds} yards',
        '{name} reminds me of me {lol} Get that man double coverage before it’s too late',
        'Watching {name} got me wanting to come out of retirement {lol} Somebody bring me a helmet',
        '{name} is a WR1. Not a debate. Child please {lol}',
        'The {opp} DBs gonna need a ride home after what {name} did to them {lol}'
      ], w), x.score * 0.9 + (x.ege ? 0.3 : 0), x.l.name));
    });
    duds(seen).forEach(function (d) {
      if (d.x.l.pos !== 'WR') { return; }
      var w = Object.assign({ lol: kit().pick(LAUGH) }, lineWords(d.x));
      out.push(take(kit().say([
        '{name} had {yds} yards today… I had more than that in my sleep {lol}',
        'Child please. {targets} targets and {yds} yards?? {name} better be on that JUGS machine tonight {lol}',
        '{name} was invisible out there. I checked the milk cartons {lol}'
      ], w), d.bad, d.x.l.name));
    });
    return out.filter(Boolean);
  }

  /* --- JJ Watt -------------------------------------------------------------------- */

  var TEXANS = 'HOU';

  /* Sincere and upbeat, and a defensive lineman at heart: the big men and
     the defense first, and the Texans, his old team. */
  function jjWatt(seen, ctx) {
    var k = kit();
    var out = [];
    var CLAP = ['💪', '👏', '🔥', '🙌'];
    defenders(seen).forEach(function (x) {
      var l = x.l;
      var w = { name: l.name, team: k.nick(x.team), opp: k.nick(x.opp), def: defList(l), sacks: sackText(l.sacks || 0) };
      var t = [
        'Defensive players don’t get enough love. {name} was a PROBLEM today: {def}.',
        'That’s how you take over a football game from the defensive side of the ball. {name}: {def}. Unreal.',
        '{name} is a football player. That’s the highest compliment I can give.'
      ];
      if ((l.sacks || 0) >= 2) { t.push('{name}. {sacks} sacks. Absolute game wrecker. Big men deserve love too.'); }
      if (l.defTd) { t.push('{name} takes it to the house! There is no better feeling in football. Trust me.'); }
      out.push(take(write(t, w, CLAP, 0.5), x.score + (x.ege ? 0.3 : 0), l.name));
    });
    var game = seen.games.filter(function (gm) { return gm.s.w === TEXANS; })[0];
    if (game) {
      var r = ctx.after[TEXANS];
      var qb = (game.g.box || []).filter(function (l) { return l.team === TEXANS && l.pos === 'QB'; })
        .sort(function (a, b) { return (b.passAtt || 0) - (a.passAtt || 0); })[0];
      var w = { score: game.words.score, opp: game.words.loser, rec: r && ctx.regular ? k.record(r) : '', qb: qb ? qb.name : '' };
      var t = ['Texans win! {score} over the {opp}. H-Town, let’s go!'];
      if (w.rec) { t.push('Love seeing the Texans rolling. {rec} and climbing.'); }
      if (w.qb && qb.passTd >= 2) { t.push('{qb} is the real deal. Houston is lucky to have him.'); }
      out.push(take(write(t, w, ['🤘', '🔥', '🙌'], 0.6), 1.8, 'Texans'));
    }
    return out.filter(Boolean);
  }

  /* --- Terrell Owens -------------------------------------------------------------- */

  /* A Hall of Fame receiver: sure of himself, all for the receivers, and
     quick to say whose fault it is when one does not get the ball. */
  function owens(seen) {
    var out = [];
    greats(seen).forEach(function (x) {
      if (x.l.pos !== 'WR' && x.l.pos !== 'TE') { return; }
      var w = lineWords(x);
      out.push(take(write([
        '{name} giving these DBs the business. {stat}. Feed your receivers and watch what happens.',
        '{name} reminds me of a young 81. {stat}. I see you.',
        x.l.pos === 'TE' ? 'That’s a TE1, period. {name}: {stat}.' : 'That’s a WR1, period. {name}: {stat}.',
        'Corners can’t check {name}. Simple as that. {stat}.'
      ], w, ['🔥', '👀', '💯', '😤'], 0.5), x.score * 0.9 + (x.ege ? 0.3 : 0), x.l.name));
    });
    duds(seen).forEach(function (d) {
      if (d.x.l.pos !== 'WR' && d.x.l.pos !== 'TE') { return; }
      var w = lineWords(d.x);
      out.push(take(write([
        'Somebody in {city} needs to get {name} the ball. {targets} targets, {yds} yards. That’s a QB problem, not a receiver problem.',
        '{name} is open. He’s ALWAYS open. Get your playmakers the ball, {team}!'
      ], w, ['👀', '🤦'], 0.4), d.bad, d.x.l.name));
    });
    return out.filter(Boolean);
  }

  /* --- who speaks ----------------------------------------------------------------- */

  var WRITERS = [
    [STEPHEN, stephenA], [SLEEPER, sleeper], [SKIP, skip], [RAP, rapoport], [CAM, cam], [PAT, mcafee],
    [LEBRON, lebron], [SHANNON, shannon], [CHAD, chad], [WATT, jjWatt], [TO, owens]
  ];

  function oneOf(candidates) {
    var best = candidates.slice().sort(function (a, b) { return b.weight - a.weight; }).slice(0, 3);
    return best.length ? kit().pick(best) : null;
  }

  function weighted(pool) {
    var total = pool.reduce(function (sum, p) { return sum + SHARE[p.account]; }, 0);
    var roll = Math.random() * total;
    for (var i = 0; i < pool.length; i += 1) {
      roll -= SHARE[pool[i].account];
      if (roll <= 0) { return pool[i]; }
    }
    return pool[pool.length - 1];
  }

  /* The week's personality tweets: [] most weeks, otherwise one or two
     [{ account, text, kind: 'voice', afterLadder }], each about something
     different. */
  function week(ctx) {
    if (!EGE.mediaNews || !EGE.mediaNews.kit) { return []; }
    var seen = read(ctx);
    var out = [];
    var about = {};
    /* A Cowboys streak or a Cowboys playoff win: Skip says so, most
       times, whether or not anybody else speaks. */
    var dallas = cowboys(seen, ctx);
    if (dallas.big && dallas.candidates.length && kit().chance(SKIP_COWBOYS)) {
      var boast = dallas.candidates[0];
      about[boast.about] = true;
      out.push({ account: SKIP, text: boast.text, kind: 'voice', afterLadder: false });
    }
    if (!kit().chance(ctx.regular ? SPEAK : SPEAK_PLAYOFFS)) { return out; }
    var pool = WRITERS.map(function (w) {
      return { account: w[0], candidates: w[1](seen, ctx) };
    }).filter(function (p) { return p.candidates.length && !(out.length && p.account === SKIP); });
    var turns = Math.min(2, out.length + (kit().chance(SECOND) ? 2 : 1));
    while (out.length < turns && pool.length) {
      var who = weighted(pool);
      pool.splice(pool.indexOf(who), 1);
      var fresh = who.candidates.filter(function (c) { return !about[c.about]; });
      var c = oneOf(fresh);
      if (!c) { continue; }
      about[c.about] = true;
      out.push({ account: who.account, text: c.text, kind: 'voice', afterLadder: Boolean(c.afterLadder) });
    }
    return out;
  }

  /* --- Rapoport on a trade ---------------------------------------------------------- */

  /* What a team stands at this season, from the scores out on the site. */
  function standing(key) {
    if (!EGE.nflResults || !EGE.nfl || !EGE.nfl.keyByName) { return null; }
    var rows = EGE.nflResults(EGE.currentSeason).filter(function (g) { return g.week <= 18; }).map(function (g) {
      return { week: g.week, home: EGE.nfl.keyByName(g.home), away: EGE.nfl.keyByName(g.away), score: g.score };
    });
    var r = kit().records(rows)[key];
    return r && r.w + r.l >= 3 ? r : null;
  }

  function picksText(picks) {
    var k = kit();
    var firsts = picks.filter(function (p) { return p.round === 1; }).length;
    if (picks.length === 1) {
      return 'A ' + (k.ROUND_WORDS[picks[0].round] || picks[0].round + 'th') + '-round pick';
    }
    var many = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven'][picks.length] || String(picks.length);
    return many + ' picks' + (firsts ? ', including ' + (firsts === 1 ? 'a first' : firsts + ' firsts') : '');
  }

  /* Rapoport after ESPN, now and then (more often when one of the six
     moves): { account, text, kind: 'voice' } or null. */
  function trade(t) {
    if (!EGE.mediaNews || !EGE.mediaNews.kit) { return null; }
    var k = kit();
    var sides = (t && t.sides) || [];
    if (sides.length !== 2) { return null; }
    var six = sides.map(function (s) { return (s.gets || []).filter(function (g) { return g.six; })[0] || null; });
    var anySix = six[0] || six[1];
    if (!k.chance(anySix ? RAP_TAKE_SIX : RAP_TAKE)) { return null; }
    var people = sides.map(function (s) {
      return (s.gets || []).filter(function (g) { return !g.year; })
        .sort(function (a, b) { return (Number(b.ovr) || 0) - (Number(a.ovr) || 0); });
    });
    var picks = sides.map(function (s) { return (s.gets || []).filter(function (g) { return g.year; }); });
    var templates;
    var w = {};
    if (anySix) {
      var to = six[0] ? 0 : 1;
      w = { name: anySix.name, to: tag(sides[to].team), toCity: k.city(sides[to].team), from: tag(sides[1 - to].team) };
      templates = [
        'This is a big one. {name} is headed to the {to}. I’m told {toCity} had been working on it for a while, and the {from} finally got a price they liked.',
        'The {to} land {name}. A franchise-altering move for both sides, and one that will be talked about for a long time.'
      ];
    } else if (people[0].length && people[1].length) {
      w = { a: tag(sides[0].team), b: tag(sides[1].team), aBest: people[0][0].name, bBest: people[1][0].name };
      templates = [
        'Interesting one: the {a} get {aBest}, the {b} get {bBest}. Both teams get help where they needed it. I’m told talks picked up over the last few days.',
        'A true football trade between the {a} and {b}. {aBest} and {bBest} swap teams, and both front offices think they won it.'
      ];
    } else if (people[0].length || people[1].length) {
      var buy = people[0].length ? 0 : 1;
      var sell = 1 - buy;
      var cost = picks[sell].length ? picksText(picks[sell]) : null;
      if (!cost) { return null; }
      var rec = standing(sides[buy].team);
      var firstGone = picks[sell].some(function (p) { return p.round === 1; });
      w = { buyer: tag(sides[buy].team), seller: tag(sides[sell].team), sellerCity: k.city(sides[sell].team),
            best: people[buy][0].name, cost: cost, costLower: cost.charAt(0).toLowerCase() + cost.slice(1),
            rec: rec ? k.record(rec) : '' };
      templates = [
        'The {seller} move {best} for {costLower}. This is a reset in {sellerCity}, and they aren’t hiding it.',
        firstGone ? 'The {buyer} pay a real price for {best}: {costLower}. They believe he’s the missing piece.'
          : 'The {buyer} get {best} and keep their first-round pick. Strong work from that front office.'
      ];
      if (rec && k.pct(rec) >= 0.6) {
        templates.push('At {rec}, the {buyer} are going for it. {best} gives them exactly what they needed, and it cost {costLower}.');
      }
    } else {
      return null;
    }
    var text = k.say(templates, w);
    return text ? { account: RAP, text: text, kind: 'voice' } : null;
  }

  return {
    week: week,
    trade: trade,
    /* For a test: every voice's candidates for a week. */
    candidates: function (ctx) {
      var seen = read(ctx);
      var out = {};
      WRITERS.forEach(function (w) { out[w[0]] = w[1](seen, ctx); });
      return out;
    },
    ACCOUNTS: WRITERS.map(function (w) { return w[0]; })
  };
})();
