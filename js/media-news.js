/* ==========================================================================
   EGE Football — the league's news, as tweets
   What the NFL, ESPN and NBC Sports accounts tweet to the trades bot's
   channel (Sam, 2026-11-10), written here and drawn and posted by the
   Media page (EGE.mediaView.postAs):

   - week(season, week): when a week is published, three to five tweets
     about it from the NFL sim's box scores (js/box-scores.js), the
     standings and the rosters (js/nfl-rosters.js): the game of the week
     (a late winner, a comeback, an upset, a blowout...), a stat line or
     two, a team on a streak, a big injury, and now and then a player who
     might be moved before the Week 9 deadline, or who is headed for free
     agency after it. Each kind has a stack of ways to say it and goes to
     whichever account fits, so no two weeks read alike. Nothing on the
     six's trade-block status: only Sam trades them.
   - trade(trade): an approved sim trade as ESPN reports one (Sam: trades
     are tweeted by ESPN alone), from what the NFL Sim tab knows of it,
     { sides: [{ team, gets: [player { pos, name } | pick { year, round,
     n, from }] }] }.

   Every tweet is 280 characters at most.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.mediaNews = (function () {
  'use strict';

  var NFL = 'preset:nfl';
  var ESPN = 'preset:espn';
  var NBC = 'preset:nbc-sports';
  var DEADLINE_WEEK = 9;
  var LAST_REGULAR = 18;
  var MAX = 280;

  /* Who tweets what. The first is likeliest. */
  var VOICES = {
    headline: [NFL, NBC],
    statline: [ESPN, NFL, NBC],
    standings: [NFL, NBC],
    injury: [ESPN, NFL],
    rumour: [ESPN, NBC],
    market: [ESPN, NBC]
  };

  /* --- small things -------------------------------------------------------- */

  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function chance(p) { return Math.random() < p; }

  function fill(template, words) {
    return template.replace(/\{(\w+)\}/g, function (all, key) {
      return words[key] == null ? all : String(words[key]);
    });
  }

  /* The first of the templates that comes out short enough, tried in a
     random order. */
  function say(templates, words) {
    var order = templates.slice().sort(function () { return Math.random() - 0.5; });
    for (var i = 0; i < order.length; i += 1) {
      var text = fill(order[i], words).replace(/ +\n/g, '\n').trim();
      if (text.length <= MAX && !/\{\w+\}/.test(text)) { return text; }
    }
    return null;
  }

  function team(key) { return (EGE.nfl && EGE.nfl.teams[key]) || { name: key }; }
  function full(key) { return team(key).name; }
  function nick(key) { var words = full(key).split(' '); return words[words.length - 1]; }
  /* Where a team plays, as a sentence says it: Detroit, Los Angeles. */
  function city(key) { var words = full(key).split(' '); return words.slice(0, -1).join(' ') || full(key); }
  function owns(name) { return name + (/s$/.test(name) ? '’' : '’s'); }

  function ordinal(n) {
    var tens = n % 100;
    return n + (tens >= 11 && tens <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' })[n % 10] || 'th');
  }
  var ROUND_WORDS = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh'];

  function list(items) {
    if (items.length < 2) { return items.join(''); }
    return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
  }

  function count(n, one, many) { return n + ' ' + (n === 1 ? one : many || one + 's'); }
  function tds(n) { return n === 1 ? 'a touchdown' : n + ' touchdowns'; }
  function num(n) { return Math.round(n) === n ? String(n) : n.toFixed(1); }

  /* "a torn ACL", "an MCL sprain", "broken ribs". */
  function withArticle(what) {
    var first = String(what).split(' ')[0];
    if (/s$/.test(what) && !/ss$/.test(what)) { return what; }
    var an = /^[A-Z]{2,}$/.test(first) ? /^[AEFHILMNORSX]/.test(first) : /^[aeiou]/i.test(first);
    return (an ? 'an ' : 'a ') + what;
  }

  function cap(text) { return text.charAt(0).toUpperCase() + text.slice(1); }

  function record(r) { return r ? r.w + '-' + r.l : '0-0'; }
  function pct(r) { return r && r.w + r.l ? r.w / (r.w + r.l) : 0.5; }

  /* --- the week as it was played ------------------------------------------- */

  /* Each team's record and its run of results, from the scores. */
  function records(results) {
    var out = {};
    results.slice().sort(function (a, b) { return a.week - b.week; }).forEach(function (g) {
      if (!g.score || g.score[0] === g.score[1]) { return; }
      [[g.home, 0], [g.away, 1]].forEach(function (side) {
        var key = side[0];
        if (!key) { return; }
        var r = out[key] || (out[key] = { w: 0, l: 0, run: [] });
        var won = g.score[side[1]] > g.score[1 - side[1]];
        if (won) { r.w += 1; } else { r.l += 1; }
        r.run.push(won);
      });
    });
    return out;
  }

  function streak(r) {
    if (!r || !r.run.length) { return { won: false, n: 0 }; }
    var last = r.run[r.run.length - 1];
    var n = 0;
    for (var i = r.run.length - 1; i >= 0 && r.run[i] === last; i -= 1) { n += 1; }
    return { won: last, n: n };
  }

  function keyOf(name) { return EGE.nfl && EGE.nfl.keyByName ? EGE.nfl.keyByName(name) : null; }

  /* The season's scores before the week, by key: the standings as they
     stood going in. */
  function scoresBefore(season, week) {
    if (!EGE.nflResults || week <= 1) { return []; }
    return EGE.nflResults(season, week - 1).map(function (g) {
      return { week: g.week, home: keyOf(g.home), away: keyOf(g.away), score: g.score };
    });
  }

  /* The week's games: the box scores when the NFL Sim tab has written
     them, or just the scores. */
  function weekGames(season, week, boxes) {
    if (boxes && boxes.length) { return boxes; }
    if (!EGE.nflResults) { return []; }
    return EGE.nflResults(season, week).filter(function (g) { return g.week === week; }).map(function (g) {
      return { home: keyOf(g.home), away: keyOf(g.away), score: g.score };
    }).filter(function (g) { return g.home && g.away; });
  }

  /* A game from the winner's side. */
  function sides(g) {
    var homeWon = g.score[0] > g.score[1];
    return {
      w: homeWon ? g.home : g.away, l: homeWon ? g.away : g.home,
      ws: Math.max(g.score[0], g.score[1]), ls: Math.min(g.score[0], g.score[1]),
      margin: Math.abs(g.score[0] - g.score[1]), home: g.home
    };
  }

  var SCORE_LINE = /^Q(\d) (\d+):(\d\d) (\S+) (.*) \((\d+)-(\d+)\)$/;

  function plays(g) {
    return (g.scoring || []).map(function (text) {
      var m = SCORE_LINE.exec(text);
      if (!m) { return null; }
      return { qtr: Number(m[1]), left: Number(m[2]) * 60 + Number(m[3]), clock: m[2] + ':' + m[3],
               team: m[4], text: m[5], score: [Number(m[6]), Number(m[7])] };
    }).filter(Boolean);
  }

  /* --- the game of the week -------------------------------------------------- */

  function headlines(games, before) {
    var out = [];
    games.forEach(function (g) {
      if (!g.score || g.score[0] === g.score[1]) { return; }
      var from = out.length;
      tell(g, out);
      for (var i = from; i < out.length; i += 1) { out[i].game = g; }
    });
    return out.filter(function (c) { return c.text; });

    function tell(g, out) {
      var s = sides(g);
      var wi = g.home === s.w ? 0 : 1;
      var words = {
        team: nick(s.w), Team: full(s.w), city: city(s.w), opp: nick(s.l), Opp: full(s.l), oppCity: city(s.l),
        where: g.neutral ? null : city(s.home), score: s.ws + '-' + s.ls, ws: s.ws, ls: s.ls,
        final: 'FINAL: ' + nick(s.w) + ' ' + s.ws + ', ' + nick(s.l) + ' ' + s.ls,
        total: s.ws + s.ls, margin: s.margin
      };
      var all = plays(g);
      var round = g.round || null;

      if (round) {
        out.push(playoffLine(g, s, words, round));
        return;
      }

      /* A late winner: the last score, in the last two minutes or overtime,
         that put the winners ahead. */
      var last = all[all.length - 1];
      var prior = all.length > 1 ? all[all.length - 2].score : [0, 0];
      if (last && last.team === s.w && (last.qtr >= 5 || (last.qtr === 4 && last.left <= 120)) &&
          prior[wi] <= prior[1 - wi]) {
        var late = lateWinner(last, words, last.qtr >= 5 || g.ot);
        if (late) { out.push({ kind: 'headline', weight: 3.2, text: late }); }
      }

      /* Back from two scores down or more. */
      var deficit = 0;
      all.forEach(function (p) { deficit = Math.max(deficit, p.score[1 - wi] - p.score[wi]); });
      if (deficit >= 14) {
        words.deficit = deficit;
        out.push({ kind: 'headline', weight: 2.4 + deficit / 30, text: say([
          'Down {deficit}, the {team} stormed back to beat the {opp} {score}.',
          'The {team} were down {deficit} and won anyway. {Team} {ws}, {Opp} {ls}.',
          'Comeback complete in {where}. The {team} erase a {deficit}-point hole and beat the {opp} {score}.',
          'Never count out the {team}. Down {deficit}, they rally past the {opp} {score}.',
          '{final}\n\nThe {team} trailed by {deficit} at one point.'
        ], words) });
      }

      if (g.ot) {
        out.push({ kind: 'headline', weight: 2.2, text: say([
          'We needed extra time in {where}. The {team} outlast the {opp} {score} in overtime.',
          '{final} (OT)\n\nWhat a game.',
          'Overtime thriller: the {team} get past the {opp}, {score}.',
          'Sixty minutes was not enough. {Team} {ws}, {Opp} {ls} in OT.'
        ], words) });
      }

      /* A team that should not have won, by the records coming in. */
      var wr = before[s.w];
      var lr = before[s.l];
      if (wr && lr && wr.w + wr.l >= 3 && lr.w + lr.l >= 3 && pct(lr) - pct(wr) >= 0.35) {
        words.wrec = record({ w: wr.w + 1, l: wr.l });
        words.lrec = record({ w: lr.w, l: lr.l + 1 });
        words.wwas = record(wr);
        words.lwas = record(lr);
        out.push({ kind: 'headline', weight: 2 + (pct(lr) - pct(wr)) * 2, text: say([
          'Upset alert: the {wwas} {team} just took down the {lwas} {opp}, {score}.',
          'Nobody saw this one coming. {Team} {ws}, {Opp} {ls}.',
          'The {team} came in at {wwas}. They leave {where} with a {score} win over the {lwas} {opp}.',
          'Any given Sunday. The {team} ({wrec}) knock off the {opp} ({lrec}), {score}.',
          'Stunner: {final}'
        ], words) });
      }

      if (s.ls === 0) {
        out.push({ kind: 'headline', weight: 1.9, text: say([
          'The {team} defense pitched a shutout: {ws}-0 over the {opp}.',
          'Zero. The {opp} did not score a point against the {team}, who win {score}.',
          'Shutout in {where}. {Team} {ws}, {Opp} 0.'
        ], words) });
      } else if (s.margin >= 28) {
        out.push({ kind: 'headline', weight: 1.6 + s.margin / 60, text: say([
          'The {team} rolled the {opp} {score}. It was never close.',
          'Statement win: {Team} {ws}, {Opp} {ls}.',
          '{final}\n\nThe {team} won by {margin}.',
          'The {team} put {ws} on the {opp}. That is all.',
          'A {margin}-point beatdown in {where}. The {team} handle the {opp}, {score}.'
        ], words) });
      }

      if (s.ws + s.ls >= 70) {
        out.push({ kind: 'headline', weight: 1.5 + (s.ws + s.ls - 70) / 40, text: say([
          '{total} points in {where}. The {team} survive the {opp} {score}.',
          'Defense optional: {Team} {ws}, {Opp} {ls}.',
          'What a shootout. The {team} outscore the {opp}, {score}.'
        ], words) });
      }
    }
  }

  function lateWinner(play, words, overtime) {
    var w = Object.assign({}, words, { clock: play.clock });
    var when = overtime ? 'in overtime' : 'with {clock} left';
    var m;
    if ((m = /^(.+) (\d+)-yard field goal$/.exec(play.text))) {
      w.kicker = m[1];
      w.dist = m[2];
      return say(overtime ? [
        '{kicker} ends it in overtime from {dist} yards. {Team} {ws}, {Opp} {ls}.',
        'Walk-off! {kicker} drills a {dist}-yarder in OT and the {team} beat the {opp} {score}.',
        '{kicker} from {dist}... GOOD. The {team} win it in overtime, {score}.'
      ] : [
        '{kicker} from {dist}... GOOD. The {team} beat the {opp} {score} with {clock} left.',
        'Ice in his veins. {kicker} hits from {dist} with {clock} to go and the {team} win {score}.'
      ].concat(play.left <= 3 ? ['Walk-off! {kicker} drills a {dist}-yarder as time expires and the {team} take down the {opp}, {score}.'] : []), w);
    }
    if ((m = /^(.+) (\d+) pass from (.+)$/.exec(play.text))) {
      w.catcher = m[1];
      w.yds = m[2];
      w.qb = m[3];
      return say([
        '{qb} to {catcher} ' + when + '. The {team} win {score}.',
        '{catcher} with the go-ahead score from {qb} ' + when + '. {Team} {ws}, {Opp} {ls}.',
        'Clutch. {qb} finds {catcher} from {yds} yards out ' + when + ' and the {team} beat the {opp} {score}.'
      ], w);
    }
    if ((m = /^(.+) (\d+) run$/.exec(play.text))) {
      w.runner = m[1];
      w.yds = m[2];
      return say([
        '{runner} punches it in from {yds} out ' + when + ' and the {team} take it {score}.',
        '{runner} wins it for the {team} ' + when + '. {Team} {ws}, {Opp} {ls}.',
        'Game-winner: {runner}, {yds} yards, ' + when + '. The {team} beat the {opp} {score}.'
      ], w);
    }
    if ((m = /^(.+) (interception|punt|kickoff) return$/.exec(play.text))) {
      w.hero = m[1];
      w.how = m[2];
      return say([
        '{hero} takes a {how} back to the house ' + when + ' and the {team} beat the {opp} {score}.',
        'Unbelievable finish in {where}. {hero} with a {how} return touchdown ' + when + '. {Team} {ws}, {Opp} {ls}.'
      ], w);
    }
    return null;
  }

  var NEXT_ROUND = { 'Wild Card': 'the Divisional Round', 'Divisional': 'the conference championship',
                     'Conference Championship': 'the Super Bowl' };

  function playoffLine(g, s, words, round) {
    words.next = NEXT_ROUND[round] || 'the next round';
    words.round = round;
    if (round === 'Super Bowl') {
      return { kind: 'headline', weight: 10, text: say([
        'The {Team} are Super Bowl champions!\n\n{Team} {ws}, {Opp} {ls}.',
        'Confetti is falling. The {team} beat the {opp} {score} to win the Super Bowl.',
        'CHAMPIONS. The {Team} win the Super Bowl, {score} over the {opp}.'
      ], words) };
    }
    return { kind: 'headline', weight: 4 + Math.random(), text: say([
      'The {team} are moving on. They beat the {opp} {score} and head to {next}.',
      '{final}\n\nThe {team} advance to {next}.',
      'Season over for the {opp}. The {team} win {score} and are on to {next}.',
      'The {team} take care of business in the {round} round, {score} over the {opp}.'
    ], words) };
  }

  /* --- stat lines ------------------------------------------------------------- */

  var DEFENDERS = /^(DI|DE|DT|EDGE|LB|ILB|OLB|CB|S|FS|SS|DB|DL)$/;

  /* How much a line stands out, so the best of the week goes. */
  function standout(line) {
    if (line.pos === 'QB') {
      return (line.passYds || 0) / 300 + (line.passTd || 0) * 0.35 - (line.passInt || 0) * 0.3 +
             (line.rushYds || 0) / 150 + (line.rushTd || 0) * 0.3;
    }
    if (line.pos === 'RB') {
      return (line.rushYds || 0) / 125 + (line.rushTd || 0) * 0.4 + (line.recYds || 0) / 200 + (line.recTd || 0) * 0.3;
    }
    if (line.pos === 'WR' || line.pos === 'TE') {
      return (line.recYds || 0) / 120 + (line.recTd || 0) * 0.45 + (line.rec || 0) / 25;
    }
    if (DEFENDERS.test(line.pos)) {
      return (line.sacks || 0) * 0.45 + (line.ints || 0) * 0.6 + (line.defTd || 0) * 0.8 + (line.ff || 0) * 0.35 +
             (line.tackles || 0) / 25 + (line.passDef || 0) / 12;
    }
    if (line.pos === 'K') { return (line.fgm || 0) >= 5 ? 1.4 : 0; }
    return 0;
  }

  /* The line as a stack, one number a row. */
  function stack(line) {
    var rows = [];
    if (line.pos === 'QB') {
      rows.push(line.passCmp + '/' + line.passAtt);
      rows.push(line.passYds + ' pass yards');
      rows.push(count(line.passTd || 0, 'TD', 'TD'));
      if (line.passInt) { rows.push(line.passInt + ' INT'); }
      if ((line.rushYds || 0) >= 40) { rows.push(line.rushYds + ' rush yards'); }
      if (line.rushTd) { rows.push(count(line.rushTd, 'rush TD', 'rush TD')); }
    } else if (line.pos === 'RB') {
      rows.push(count(line.rushAtt || 0, 'carry', 'carries'));
      rows.push((line.rushYds || 0) + ' rush yards');
      if (line.rushTd) { rows.push(count(line.rushTd, 'TD', 'TD')); }
      if ((line.recYds || 0) >= 30) { rows.push(count(line.rec, 'catch', 'catches') + ', ' + line.recYds + ' yards'); }
      if (line.recTd) { rows.push(count(line.recTd, 'receiving TD', 'receiving TD')); }
    } else if (line.pos === 'WR' || line.pos === 'TE') {
      rows.push(count(line.rec || 0, 'catch', 'catches'));
      rows.push((line.recYds || 0) + ' yards');
      if (line.recTd) { rows.push(count(line.recTd, 'TD', 'TD')); }
    } else {
      defence(line).forEach(function (row) { rows.push(row); });
    }
    return rows.join('\n');
  }

  function defence(line) {
    var rows = [];
    if (line.tackles) { rows.push(count(line.tackles, 'tackle')); }
    if (line.sacks) { rows.push(num(line.sacks) + (line.sacks === 1 ? ' sack' : ' sacks')); }
    if (line.ints) { rows.push(count(line.ints, 'INT', 'INTs')); }
    if (line.ff) { rows.push(count(line.ff, 'forced fumble')); }
    if (line.passDef) { rows.push(count(line.passDef, 'pass defended', 'passes defended')); }
    if (line.defTd) { rows.push(count(line.defTd, 'TD', 'TD')); }
    if (line.pos === 'K') { rows.push(line.fgm + '/' + line.fga + ' FG'); }
    return rows;
  }

  function statlines(games, before) {
    var out = [];
    games.forEach(function (g) {
      if (!g.box || !g.score) { return; }
      var s = sides(g);
      g.box.forEach(function (line) {
        var score = standout(line);
        if (line.ege) { score += 0.15; }
        if (score < 1.35) { return; }
        var mine = line.team;
        var opp = mine === g.home ? g.away : g.home;
        var won = mine === s.w;
        var qb = g.box.filter(function (l) { return l.team === mine && l.pos === 'QB'; })
          .sort(function (a, b) { return (b.passAtt || 0) - (a.passAtt || 0); })[0];
        var words = {
          name: line.name, pos: line.pos, team: nick(mine), Team: full(mine), city: city(mine),
          opp: nick(opp), Opp: full(opp), oppCity: city(opp),
          score: s.ws + '-' + s.ls, result: won ? 'win' : 'loss',
          beat: won ? pick(s.margin <= 3 ? ['edged', 'held off', 'squeaked past'] :
                           s.margin >= 17 ? ['rolled past', 'routed', 'cruised past'] : ['beat', 'took down', 'handled'])
                    : pick(['fell to', 'lost to']),
          stack: stack(line), qb: qb && qb.name !== line.name ? qb.name : 'The QB',
          yds: line.passYds || line.rushYds || line.recYds || 0,
          cmp: line.passCmp, att: line.passAtt || line.rushAtt, td: line.passTd || line.rushTd || line.recTd || 0,
          rec: line.rec, carries: line.rushAtt,
          tdWords: tds(line.passTd || line.rushTd || line.recTd || 0),
          tdClause: (line.rushTd || line.recTd) ? ' and ' + tds(line.rushTd || line.recTd) : '',
          defList: list(defence(line).map(function (row) { return row; })),
          week: g.week
        };
        var common = [
          '{name} against the {opp}:\n\n{stack}',
          '{name} was cooking against the {oppCity} defense.\n\n{stack}',
          'Stat line of the week belongs to {name}.\n\n{stack}',
          '{team} {pos} {name} in the {score} {result}:\n\n{stack}',
          '{name} put on a show.\n\n{stack}'
        ];
        var own;
        if (line.pos === 'QB') {
          own = [
            '{name} threw for {yds} yards and {tdWords} as the {team} {beat} the {opp} {score}.',
            '{name} went {cmp}-for-{att} for {yds} yards and {tdWords} against the {opp}.',
            'Another big day for {name}: {yds} yards through the air, {tdWords}, and a {team} {result}.',
            '{name} picked apart the {opp} defense to the tune of {yds} yards and {tdWords}.'
          ];
          if (!line.passTd) { own = []; }
        } else if (line.pos === 'RB') {
          own = [
            '{name} ran for {yds} yards on {carries} carries{tdClause} as the {team} {beat} the {opp} {score}.',
            '{name} could not be stopped: {carries} carries, {yds} yards{tdClause}.',
            'The {opp} had no answer for {name}, who piled up {yds} rushing yards{tdClause}.'
          ];
        } else if (line.pos === 'WR' || line.pos === 'TE') {
          own = [
            '{name} hauled in {rec} passes for {yds} yards{tdClause} against the {opp}.',
            '{name} was everywhere for the {team}: {rec} catches, {yds} yards{tdClause}.',
            '{qb} kept finding {name}. {rec} catches, {yds} yards{tdClause}.'
          ];
          if (words.qb === 'The QB') { own.pop(); }
        } else if (line.pos === 'K') {
          own = [];
        } else {
          own = [
            '{name} wrecked the {opp} game plan: {defList}.',
            '{name} lived in the backfield against the {opp}. {defList}.',
            'Big day for {team} {pos} {name}: {defList}.'
          ];
        }
        var text = say(chance(0.5) && own.length ? own : common, words) || say(common, words);
        if (text) { out.push({ kind: 'statline', weight: score, text: text, game: g }); }
      });
    });
    return out.sort(function (a, b) { return b.weight - a.weight; });
  }

  /* --- the standings ------------------------------------------------------------ */

  function standings(games, before, after, week) {
    if (week > LAST_REGULAR) { return []; }
    var out = [];
    var unbeaten = Object.keys(after).filter(function (k) { return after[k].l === 0 && after[k].w >= 1; });
    games.forEach(function (g) {
      if (!g.score || g.score[0] === g.score[1]) { return; }
      var s = sides(g);
      [s.w, s.l].forEach(function (key) {
        var was = before[key] || { w: 0, l: 0, run: [] };
        var now = after[key];
        if (!now) { return; }
        var run = streak(now);
        var words = { team: nick(key), Team: full(key), city: city(key), rec: record(now), w: now.w, l: now.l,
                      n: run.n, others: unbeaten.length - 1, opp: nick(key === s.w ? s.l : s.w) };
        if (now.l === 0 && now.w >= 4) {
          out.push({ kind: 'standings', weight: 1.2 + now.w / 10, text: say(unbeaten.length === 1 ? [
            'The {team} are {rec}, the last unbeaten team in the league.',
            'Still perfect. The {team} move to {rec} and nobody else is unbeaten.',
            '{rec}. The {team} are the only team left without a loss.'
          ] : [
            'The {team} are {rec}. Still perfect.',
            'Unbeaten no matter what: the {team} improve to {rec}.',
            '{rec} and rolling. The {team} keep the zero in the loss column.'
          ], words) });
        } else if (was.l === 0 && was.w >= 3 && now.l === 1) {
          words.was = record(was);
          out.push({ kind: 'standings', weight: 1.4, text: say([
            'The {team} are unbeaten no more. The {opp} hand them their first loss.',
            'There goes the perfect season. The {team} fall to {rec}.',
            'Perfect no longer: the {team} drop to {rec} after a loss to the {opp}.'
          ], words) });
        } else if (now.w === 0 && now.l >= 5) {
          out.push({ kind: 'standings', weight: 1 + now.l / 20, text: say([
            'Still searching for a win: the {team} fall to {rec}.',
            '{rec}. It has been a long season in {city}.',
            'The {team} are still winless after another loss, this time to the {opp}.'
          ], words) });
        } else if (was.w === 0 && was.l >= 3 && now.w === 1) {
          words.was = record(was);
          out.push({ kind: 'standings', weight: 1.3, text: say([
            'Finally! The {team} are in the win column after an {was} start.',
            'The {team} get their first win of the season, against the {opp}.',
            'No more zero. The {team} pick up win number one and move to {rec}.'
          ], words) });
        } else if (run.won && run.n >= 5) {
          out.push({ kind: 'standings', weight: 1 + run.n / 10, text: say([
            '{n} straight wins for the {team}, who are now {rec}.',
            'The {team} have won {n} in a row. Nobody is playing better right now.',
            'Hot streak: the {team} make it {n} straight and sit at {rec}.'
          ], words) });
        } else if (!run.won && run.n >= 5) {
          out.push({ kind: 'standings', weight: 0.8 + run.n / 20, text: say([
            'That is {n} losses in a row for the {team}, now {rec}.',
            'The skid hits {n} in {city}. The {team} fall to {rec}.'
          ], words) });
        }
      });
    });
    return out.filter(function (c) { return c.text; });
  }

  /* --- injuries ------------------------------------------------------------------ */

  var HURT = /^(.+) \(([A-Z]+), (.+), (season|\d+ wk)\)$/;

  function rosterRow(rosters, key, name) {
    var rows = rosters && rosters.teams ? rosters.teams[key] || [] : [];
    return rows.filter(function (r) { return r.name === name; })[0] || null;
  }

  function injuries(games, rosters) {
    var out = [];
    games.forEach(function (g) {
      (g.injuries || []).forEach(function (text) {
        var m = HURT.exec(text);
        if (!m) { return; }
        var key = m[2];
        var season = m[4] === 'season';
        var weeks = season ? 99 : parseInt(m[4], 10);
        if (weeks < 3) { return; }
        var what = m[3];
        if (what.indexOf(' ') === -1 && /^[a-z]+$/.test(what)) { what = what.replace(/^ribs$/, 'rib') + ' injury'; }
        var row = rosterRow(rosters, key, m[1]);
        var ovr = row ? row.ovr : 70;
        if (ovr < 75 && !(row && row.ege)) { return; }
        var pos = row ? row.pos : '';
        var words = { name: m[1], team: nick(key), Team: full(key), city: city(key), pos: pos,
                      what: what, aWhat: withArticle(what), AWhat: cap(withArticle(what)), weeks: weeks,
                      range: weeks >= 6 ? (weeks - 1) + '-' + (weeks + 1) + ' weeks' : 'about ' + weeks + ' weeks' };
        var text = say(season ? [
          '{team} {pos} {name} is out for the season with {aWhat}, sources say.',
          'Brutal news in {city}: {name} ({what}) will miss the rest of the season.',
          'Season over for {team} {pos} {name}. The diagnosis: {aWhat}.',
          'The {team} have lost {name} for the year. {pos} suffered {aWhat}.'
        ] : [
          '{team} {pos} {name} is expected to miss {weeks} weeks with {aWhat}, per sources.',
          '{name} suffered {aWhat} and will be out {range}, sources said.',
          'Injury update: {team} {pos} {name} ({what}) is week to week, expected back in {range}.',
          'The {team} will be without {name} for a while: {aWhat}, out {range}.'
        ], words);
        if (text) { out.push({ kind: 'injury', weight: (ovr - 70) / 10 + (season ? 1 : 0), text: text }); }
      });
    });
    return out.sort(function (a, b) { return b.weight - a.weight; });
  }

  /* --- who might be moved -------------------------------------------------------- */

  var MODES = { rebuild: 'rebuilding', retool: 'retooling' };

  function players(rosters) {
    var out = [];
    if (!rosters || !rosters.teams) { return out; }
    Object.keys(rosters.teams).forEach(function (key) {
      if (!EGE.nfl || !EGE.nfl.teams[key]) { return; }
      rosters.teams[key].forEach(function (row) {
        if (row.ege) { return; }                      /* only Sam moves the six */
        if (row.out && (row.out.games === null || row.out.games >= 4)) { return; }
        out.push({ key: key, row: row });
      });
    });
    return out;
  }

  /* Before the deadline: a good, older player on a team going nowhere, a
     star who does not fit what his team runs, or one in the last year of
     his deal. */
  function rumours(rosters, after, season, week) {
    var out = [];
    var systems = (rosters && rosters.systems) || {};
    players(rosters).forEach(function (p) {
      var row = p.row;
      if (row.ovr < 77 || (row.age || 0) < 25 || /^(K|P)$/.test(row.pos)) { return; }
      var sys = systems[p.key] || {};
      var r = after[p.key];
      var losing = r && r.w + r.l >= 3 && pct(r) <= 0.4;
      var selling = MODES[sys.mode] || losing;
      var lastYear = row.contract && row.contract.through <= season;
      var misfit = typeof row.fit === 'number' && row.fit <= 1 && row.ovr >= 80;
      if (!selling && !misfit) { return; }
      var weight = (row.ovr - 70) / 10 + (row.age >= 29 ? 0.4 : 0) + (lastYear ? 0.5 : 0) + (misfit ? 0.3 : 0) +
                   (losing ? 0.4 : 0) + Math.random() * 0.8;
      var left = DEADLINE_WEEK - week;
      var words = {
        name: row.name, pos: row.pos, age: row.age, team: nick(p.key), Team: full(p.key), city: city(p.key),
        teams: owns(nick(p.key)), rec: record(r), mode: MODES[sys.mode] || 'selling',
        scheme: /^(QB|RB|WR|TE|OT|IOL|OL|C|G)$/.test(row.pos) ? sys.offense || 'offense' : sys.defense || 'defense',
        deadline: left <= 0 ? 'before the deadline passes' : left === 1 ? 'with the deadline a week away'
          : 'with the deadline ' + left + ' weeks away'
      };
      var templates = [];
      if (selling) {
        templates = templates.concat([
          'Sources: the {team} have started taking calls on {pos} {name}. At {rec}, they are open for business {deadline}.',
          'Keep an eye on {team} {pos} {name}. Multiple contenders have checked in, per league sources.',
          'The {team} are listening on {name}, and there is real interest {deadline}.',
          '{name} could be on the move. The {team} are {mode} and he would bring back real value, per sources.',
          'League sources expect {name} ({age}) to be one of the bigger names talked about {deadline}.'
        ]);
        if (!r || r.w + r.l < 3) { templates = templates.filter(function (t) { return t.indexOf('{rec}') === -1; }); }
      }
      if (misfit) {
        templates = templates.concat([
          '{name} has not been a great fit in the {teams} {scheme} scheme and would welcome a fresh start, per sources.',
          'There is a sense around the league that {name} wants out of {city}. Worth watching {deadline}.'
        ]);
      }
      if (lastYear) {
        templates.push('{name} is in the final year of his deal and the {team} have not opened extension talks. He is a name to watch {deadline}.');
      }
      var text = say(templates, words);
      if (text) { out.push({ kind: 'rumour', weight: weight, text: text }); }
    });
    return out.sort(function (a, b) { return b.weight - a.weight; }).slice(0, 4);
  }

  /* After it: the best of the coming free agents. */
  function market(rosters) {
    var out = [];
    players(rosters).forEach(function (p) {
      var row = p.row;
      if (!row.market || row.market < 8 || row.ovr < 80 || /^(K|P)$/.test(row.pos)) { return; }
      var teams = (row.interest || []).length;
      var words = {
        name: row.name, pos: row.pos, team: nick(p.key), Team: full(p.key), city: city(p.key),
        money: '$' + Math.round(row.market) + 'M', teams: teams
      };
      var templates = [
        '{name}’s deal with the {team} runs out after the season. League sources expect a market around {money} a year.',
        'Free agency is coming and {name} is set to be one of the top names. Think {money} a year, per sources.',
        'Will the {team} pay {name}? He is headed for free agency and could command {money} a year.'
      ];
      if (teams >= 3) {
        templates.push('{name} is headed for free agency, and {teams} teams are already expected to be in the mix, per sources.');
      }
      var text = say(templates, words);
      if (text) { out.push({ kind: 'market', weight: (row.ovr - 75) / 10 + Math.random() * 0.8, text: text }); }
    });
    return out.sort(function (a, b) { return b.weight - a.weight; }).slice(0, 4);
  }

  /* --- the week's tweets --------------------------------------------------------- */

  /* Who says each one: the likeliest voice that has said the least so far,
     so all three get a word in. */
  function voice(kind, used) {
    var choices = VOICES[kind] || [NFL];
    var least = Math.min.apply(null, choices.map(function (id) { return used[id] || 0; }));
    var open = choices.filter(function (id) { return (used[id] || 0) === least; });
    var chosen = chance(0.7) ? open[0] : pick(open);
    used[chosen] = (used[chosen] || 0) + 1;
    return chosen;
  }

  /* One of the best few, so the same game does not always win out. */
  function oneOf(candidates, top) {
    var best = candidates.slice().sort(function (a, b) { return b.weight - a.weight; }).slice(0, top || 3);
    return best.length ? pick(best) : null;
  }

  function plan(season, week, boxes, rosters) {
    var games = weekGames(season, week, boxes).map(function (g) { return Object.assign({ week: week }, g); });
    if (!games.length) { return []; }
    var earlier = scoresBefore(season, week);
    var before = records(earlier);
    var regular = week <= LAST_REGULAR && !games.some(function (g) { return g.round; });
    var after = regular ? records(earlier.concat(games)) : before;

    var picked = [];
    var head = oneOf(headlines(games, before), 2);
    if (head) { picked.push(head); }

    var stats = statlines(games, before).filter(function (c) { return !head || c.game !== head.game; });
    var first = oneOf(stats, 3);
    if (first) {
      picked.push(first);
      if (chance(0.5)) {
        var second = oneOf(stats.filter(function (c) { return c.game !== first.game; }), 3);
        if (second) { picked.push(second); }
      }
    }

    if (regular && chance(0.75)) {
      var table = oneOf(standings(games, before, after, week), 2);
      if (table) { picked.push(table); }
    }
    if (chance(0.6)) {
      var hurt = oneOf(injuries(games, rosters), 2);
      if (hurt) { picked.push(hurt); }
    }
    if (regular && week <= DEADLINE_WEEK && chance(0.55)) {
      var rumour = oneOf(rumours(rosters, after, season, week), 4);
      if (rumour) { picked.push(rumour); }
    } else if (regular && week > DEADLINE_WEEK && chance(0.3)) {
      var money = oneOf(market(rosters), 4);
      if (money) { picked.push(money); }
    }

    /* Three at least when there is that much to say, five at most. */
    if (picked.length < 3) {
      var spare = stats.filter(function (c) { return picked.indexOf(c) === -1; });
      while (picked.length < 3 && spare.length) { picked.push(spare.shift()); }
    }
    picked = picked.slice(0, 5);

    var used = {};
    return picked.map(function (c) { return { account: voice(c.kind, used), text: c.text, kind: c.kind }; });
  }

  function week(season, n) {
    var boxes = EGE.boxScores ? EGE.boxScores.week(season, n).catch(function () { return null; }) : Promise.resolve(null);
    var rosters = EGE.nflRosters ? EGE.nflRosters.load(season).catch(function () { return null; }) : Promise.resolve(null);
    return Promise.all([boxes, rosters]).then(function (got) {
      return plan(season, n, got[0], got[1]);
    });
  }

  /* --- a trade, as ESPN has it --------------------------------------------------- */

  function item(thing) {
    if (thing.year) {
      var round = ROUND_WORDS[thing.round] || ordinal(thing.round);
      var whose = thing.from ? 'the ' + owns(nick(thing.from)) + ' ' : 'a ';
      return whose + thing.year + ' ' + round + '-round pick' + (thing.n ? ' (No. ' + thing.n + ')' : '');
    }
    return (thing.pos ? thing.pos + ' ' : '') + thing.name;
  }

  /* What a side gets, short enough for the tweet: the players by name and,
     when that runs long, the picks counted. */
  function bundle(gets, short) {
    var people = gets.filter(function (g) { return !g.year; }).map(item);
    var picks = gets.filter(function (g) { return g.year; });
    var parts = people.slice();
    if (picks.length && short) {
      var best = picks.slice().sort(function (a, b) { return a.round - b.round || a.year - b.year; })[0];
      parts.push(picks.length === 1 ? item(best)
        : picks.length + ' draft picks, including ' + item(best).replace(/^(a|the \S+) /, 'a '));
    } else {
      picks.forEach(function (p) { parts.push(item(p)); });
    }
    return { text: list(parts) || 'future considerations', people: people.length, picks: picks.length,
             many: people.length + picks.length > 1 };
  }

  function trade(t) {
    var sides = (t && t.sides) || [];
    if (sides.length < 2) { return null; }
    var a = sides[0];
    var b = sides[1];
    var text = null;
    [false, true].some(function (short) {
      var aGets = bundle(a.gets || [], short);
      var bGets = bundle(b.gets || [], short);
      var six = (a.gets || []).concat(b.gets || []).some(function (g) { return g.six; });
      var words = {
        A: full(a.team), a: nick(a.team), aCity: city(a.team), aGets: aGets.text,
        B: full(b.team), b: nick(b.team), bCity: city(b.team), bGets: bGets.text,
        bIs: bGets.many ? 'are' : 'is', aIs: aGets.many ? 'are' : 'is',
        lead: six ? 'BREAKING: ' : pick(['Trade: ', 'BREAKING: ', 'Trade: ', ''])
      };
      var templates;
      if (bGets.people && !aGets.people) {
        /* B gets the players, A the picks. */
        templates = [
          '{lead}The {B} are acquiring {bGets} from the {a} for {aGets}, sources tell ESPN.',
          '{lead}The {a} are trading {bGets} to the {B}, sources tell ESPN. The {a} get {aGets} in return.',
          'Deal done: {bGets} {bIs} headed to {bCity}. The {a} land {aGets}, sources tell ESPN.',
          '{lead}The {b} have traded for {bGets}. {aCity} gets {aGets}, sources tell ESPN.'
        ];
      } else if (aGets.people && !bGets.people) {
        templates = [
          '{lead}The {A} are acquiring {aGets} from the {b} for {bGets}, sources tell ESPN.',
          '{lead}The {b} are trading {aGets} to the {A}, sources tell ESPN. The {b} get {bGets} in return.',
          'Deal done: {aGets} {aIs} headed to {aCity}. The {b} land {bGets}, sources tell ESPN.',
          '{lead}The {a} have traded for {aGets}. {bCity} gets {bGets}, sources tell ESPN.'
        ];
      } else if (aGets.people && bGets.people) {
        templates = [
          '{lead}{bGets} to the {b}, {aGets} to the {a}, sources tell ESPN.',
          '{lead}The {a} and {b} have agreed to a trade sending {bGets} to {bCity} and {aGets} to {aCity}, sources tell ESPN.',
          'Blockbuster: the {a} are sending {bGets} to the {b} for {aGets}, sources tell ESPN.'
        ];
      } else {
        templates = [
          'Pick swap: the {a} get {aGets} from the {b} for {bGets}, sources tell ESPN.',
          'The {a} and {b} have swapped picks, sources tell ESPN. The {a} get {aGets}; the {b} get {bGets}.'
        ];
      }
      text = say(templates, words);
      return Boolean(text);
    });
    if (text) { return { account: ESPN, text: cap(text), kind: 'trade' }; }
    var fallback = 'Trade: ' + full(a.team) + ' and ' + full(b.team) + ' have made a deal, sources tell ESPN.';
    return { account: ESPN, text: fallback, kind: 'trade' };
  }

  return {
    week: week,
    trade: trade,
    /* For a test: the week's tweets from box scores and rosters in hand. */
    plan: plan,
    ESPN: ESPN
  };
})();
