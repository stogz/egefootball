/* ==========================================================================
   EGE Football — NFL cards
   The six's NFL teammates in the card game (Sam, 2026-11-06): their
   touchdowns and their games, from 2025 on, pulled out of the NFL Pack.

   Where they come from
   -------------------
   The NFL sim's box scores (sim_box_scores in Supabase, the League page's
   every-game box score), a week at a time as each week is published. The
   page asks nfl_card_lines in supabase/schema.sql for the weeks out, naming
   the teams the six were on in each (EGE.teamKeyFor, so a trade or a
   signing moves who his teammates are from that week on), and gets back
   those teams' lines and every game's scoring plays. js/cards.js does the
   asking and keeps what comes back in the browser, so a week is only ever
   read once; take() hands it here.

   A teammate's game is a PERFORMANCE card when he had at least one carry,
   catch or defensive stat in it (a tackle, a sack, an interception, a pass
   broken up, a forced fumble or a defensive touchdown), and every
   touchdown he scored or threw is a PLAY card. The six's own games and
   touchdowns are their own cards already (data/cards.js), so they are left
   out here, but a teammate's pass that one of the six caught is the
   teammate's card.

     n:2025:dj-moore:5        D.J. Moore's week 5 game in 2025
     nt:2025:dj-moore:5:0     his first touchdown of that game

   A teammate is named for his name ('dj-moore'). Two different players
   with one name -- they would have to be teammates of the six both -- are
   told apart by position on the second one to turn up ('josh-allen-edge').

   Grading
   -------
   As the six's cards are graded (data/cards.js): a performance on its
   fantasy points times its position's share, against the bars an NFL game
   of the six's is held to; a play on its yards as though it were run in
   (yards / 10, +6, +0.5 for a catch), +3 for a game-winning one. A defender
   is scored IDP style (DEFENSE below) and graded on his own share. A
   kickoff, punt or interception return for a touchdown has no yardage in
   the box score, so it is graded Epic.

   Nothing here touches the six's cards, packs or sets: an NFL card is only
   in the NFL Pack and the NFL sets, and the Library's other sets never take
   one.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.nflCards = (function () {
  'use strict';

  /* The first season with every NFL player's box score kept. */
  var FROM = 2025;

  /* A defender's fantasy points, IDP style. */
  var DEFENSE = { tackles: 1, sacks: 4, defInts: 5, passDef: 1.5, ff: 3, defTd: 6 };

  /* A performance's grade is its fantasy points times this. The offense's
     are the six's (a tight end grades on 0.68, data/cards.js). A
     defender's are set so his position's best tenth of games grade Rare,
     about where a receiver's do, in the sim's 2025 and 2026: a lineman's
     and a defensive back's games score little, a linebacker's tackles add
     up. DEF is any other position (a lineman with a tackle). */
  var GRADE_SHARE = { QB: 0.55, RB: 0.5, FB: 0.5, WR: 0.75, TE: 0.68,
                      DI: 1.6, EDGE: 1.35, LB: 0.8, CB: 1.4, S: 1.4, DEF: 1.2 };

  var OFFENSE = ['QB', 'RB', 'FB', 'WR', 'TE'];

  /* The box score's names for a line, and the site's (data/economy.js
     scores the site's). A defender's interceptions are his own key, since
     `interceptions` is a quarterback's thrown. */
  var KEYS = {
    rushAtt: 'carries', rushYds: 'rushingYards', rushTd: 'rushingTd', rushLong: 'rushingLong',
    targets: 'targets', rec: 'receptions', recYds: 'receivingYards', recTd: 'receivingTd', recLong: 'receivingLong',
    passCmp: 'completions', passAtt: 'attempts', passYds: 'passingYards', passTd: 'passingTd',
    passInt: 'interceptions', fumLost: 'fumbles',
    tackles: 'tackles', sacks: 'sacks', ints: 'defInts', passDef: 'passDef', ff: 'ff', defTd: 'defTd'
  };
  var DEF_KEYS = ['tackles', 'sacks', 'defInts', 'passDef', 'ff', 'defTd'];

  function round2(n) { return Math.round(n * 100) / 100; }

  function isDefense(pos) { return OFFENSE.indexOf(pos) === -1; }

  function gradeShare(pos) {
    var s = GRADE_SHARE[pos];
    return typeof s === 'number' ? s : GRADE_SHARE.DEF;
  }

  /* --- what has been read ------------------------------------------------ */

  var weeks = [];          /* [{ season, week, games }], oldest first */
  var loaded = false;
  var built = null;
  var listeners = [];

  /* The weeks js/cards.js read, oldest first. Everything is worked out
     again from them, and the card catalogue with it. */
  function take(rows) {
    weeks = (rows || []).filter(function (r) { return r && r.season >= FROM; }).slice()
      .sort(function (a, b) { return a.season - b.season || a.week - b.week; });
    loaded = true;
    built = null;
    setsCache = null;
    if (EGE.cards && EGE.cards.rebuild) { EGE.cards.rebuild(); }
    listeners.slice().forEach(function (fn) { try { fn(); } catch (e) { /* a page's own trouble */ } });
  }

  function onChange(fn) { listeners.push(fn); }

  /* --- the six, and who was with them ------------------------------------- */

  /* The sim's key for the team each of the six was on that week, as
     { simKey: [slug] }. */
  var withCache = {};
  function sixTeams(season, week) {
    var key = season + ':' + week;
    if (withCache[key]) { return withCache[key]; }
    var out = {};
    (EGE.players || []).forEach(function (p) {
      var site = EGE.teamKeyFor ? EGE.teamKeyFor(p, season, week) : null;
      var team = site && EGE.teams ? EGE.teams[site] : null;
      var sim = team && team.tier === 'nfl' && EGE.nfl ? EGE.nfl.keyForSite(site) : null;
      if (sim) { (out[sim] = out[sim] || []).push(p.slug); }
    });
    withCache[key] = out;
    return out;
  }

  /* The weeks to read: every published week from FROM on, with the teams
     the six were on that week. [{ s, w, t: [simKey] }] */
  function wanted() {
    var out = [];
    Object.keys(EGE.publishedWeeks || {}).map(Number).filter(function (s) { return s >= FROM; })
      .sort(function (a, b) { return a - b; }).forEach(function (season) {
        (EGE.publishedWeeks[season] || []).slice().sort(function (a, b) { return a - b; }).forEach(function (week) {
          var teams = Object.keys(sixTeams(season, week)).sort();
          if (teams.length) { out.push({ s: season, w: Number(week), t: teams }); }
        });
      });
    return out;
  }

  function sixByName() {
    var out = {};
    (EGE.players || []).forEach(function (p) { out[String(p.name).toLowerCase()] = p.slug; });
    return out;
  }

  /* --- a teammate --------------------------------------------------------- */

  function slugOf(name) {
    var s = String(name || '');
    if (s.normalize) { s = s.normalize('NFD').replace(/[̀-ͯ]/g, ''); }
    s = s.toLowerCase().replace(/['’.]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return s || 'player';
  }

  var STANDIN = 'icon/cards/nfl-standin.png';

  function headshotOf(espn, college) {
    return espn && EGE.espnHeadshot ? EGE.espnHeadshot(espn, college, 350, 254) : STANDIN;
  }

  /* One player across every week read: who he is (his ESPN id, or his name
     where there is none), named once and for good the first time he turns
     up, oldest week first. */
  function playerFor(b, line) {
    var who = line.espn ? 'e' + line.espn : 'n' + String(line.name).toLowerCase();
    var p = b.who[who];
    if (!p) {
      var slug = slugOf(line.name);
      if (b.players[slug]) { slug = slug + '-' + String(line.pos || 'nfl').toLowerCase(); }
      var n = 2;
      var base = slug;
      while (b.players[slug]) { slug = base + '-' + n; n += 1; }
      var parts = String(line.name).split(' ');
      p = {
        slug: slug, name: line.name, first: parts[0], last: parts.slice(1).join(' ') || parts[0],
        position: line.pos || '', espn: line.espn || null, collegePhoto: Boolean(line.collegePhoto),
        headshot: headshotOf(line.espn, line.collegePhoto), nfl: true, teams: {}
      };
      b.who[who] = p;
      b.players[slug] = p;
    }
    if (line.pos) { p.position = line.pos; }
    if (line.espn && !p.espn) { p.espn = line.espn; p.headshot = headshotOf(line.espn, line.collegePhoto); }
    return p;
  }

  /* A line in the site's stat names, numbers only. */
  function statsOf(line) {
    var out = {};
    Object.keys(KEYS).forEach(function (k) {
      if (typeof line[k] === 'number' && line[k] !== 0) { out[KEYS[k]] = line[k]; }
    });
    return out;
  }

  function n(s, key) { return typeof s[key] === 'number' ? s[key] : 0; }

  /* A carry, a catch or anything on defense: what makes a game a card
     (Sam, 2026-11-06). */
  function qualifies(s) {
    return n(s, 'carries') > 0 || n(s, 'receptions') > 0 ||
      DEF_KEYS.some(function (k) { return n(s, k) > 0; });
  }

  function fantasy(s) {
    var points = EGE.economy ? EGE.economy.fantasyPoints(s) : 0;
    DEF_KEYS.forEach(function (k) { points += n(s, k) * DEFENSE[k]; });
    return round2(points);
  }

  function defenseLine(s) {
    var parts = [];
    if (n(s, 'tackles')) { parts.push(n(s, 'tackles') + ' TKL'); }
    if (n(s, 'sacks')) { parts.push(n(s, 'sacks') + ' SK'); }
    if (n(s, 'defInts')) { parts.push(n(s, 'defInts') + ' INT'); }
    if (n(s, 'passDef')) { parts.push(n(s, 'passDef') + ' PD'); }
    if (n(s, 'ff')) { parts.push(n(s, 'ff') + ' FF'); }
    if (n(s, 'defTd')) { parts.push(n(s, 'defTd') + ' TD'); }
    return parts.join(' · ') || '0 TKL';
  }

  /* The short line a card prints: a defender's tackles and the rest, or
     the offense's the way the six's are written. */
  function lineOf(pos, s) {
    if (isDefense(pos)) { return defenseLine(s); }
    return EGE.cards.statSummary(pos === 'FB' ? 'RB' : pos, s);
  }

  /* The two big numbers across the picture: the yards the line leads with
     and the touchdowns, or a defender's tackles and his biggest play. */
  function bigOf(pos, s) {
    var td = n(s, 'passingTd') + n(s, 'rushingTd') + n(s, 'receivingTd') + n(s, 'defTd');
    if (isDefense(pos)) {
      /* His tackles, then his biggest play; a game with no tackle leads
         with what he did do. */
      var did = [['tackles', 'TKL'], ['sacks', 'SK'], ['defInts', 'INT'], ['defTd', 'TD'], ['ff', 'FF'],
                 ['passDef', 'PD']].filter(function (k) { return n(s, k[0]) > 0; });
      var first = did[0] || ['tackles', 'TKL'];
      var then = did[1] || null;
      return { yards: n(s, first[0]), unit: first[1], td: then ? n(s, then[0]) : 0, tdUnit: then ? then[1] : 'TD' };
    }
    if (pos === 'QB') { return { yards: n(s, 'passingYards'), td: td }; }
    if ((pos === 'RB' || pos === 'FB') && n(s, 'carries') > 0) { return { yards: n(s, 'rushingYards'), td: td }; }
    if (n(s, 'receptions') === 0 && n(s, 'carries') > 0) { return { yards: n(s, 'rushingYards'), td: td }; }
    return { yards: n(s, 'receivingYards'), td: td };
  }

  /* --- grading ------------------------------------------------------------ */

  function rarityOf(id, score, kind) {
    if (EGE.cards.ICONIC.indexOf(id) !== -1) { return 'iconic'; }
    var found = EGE.cards.RARITIES[0];
    EGE.cards.RARITIES.forEach(function (r) {
      var bar = kind === 'performance' && typeof r.collegePerformance === 'number' ? r.collegePerformance : r[kind];
      if (typeof bar === 'number' && score >= bar) { found = r; }
    });
    return found.key;
  }

  /* --- the scoring plays -------------------------------------------------- */

  /* 'Q4 10:20 TEN Nick Westbrook-Ikhine 3 pass from Will Levis (10-20)':
     the quarter, the clock, the team, what happened and the score after,
     home first. */
  var SCORE = /^Q(\d+) (\d+:\d+) ([A-Z]+) (.*) \((\d+)-(\d+)\)$/;

  function readScoring(list, home) {
    return (list || []).map(function (text) {
      var m = SCORE.exec(String(text));
      if (!m) { return null; }
      var what = m[4];
      var out = { qtr: Number(m[1]), clock: m[2], team: m[3], text: what,
                  score: [Number(m[5]), Number(m[6])], side: m[3] === home ? 0 : 1 };
      var pass = /^(.+?) (-?\d+) pass from (.+)$/.exec(what);
      var run = /^(.+?) (-?\d+) run$/.exec(what);
      var ret = /^(.+) (kickoff|punt) return$/.exec(what);
      var pick = /^(.+) interception return$/.exec(what);
      if (pass) { out.td = { how: 'pass', by: pass[1], yards: Number(pass[2]), from: pass[3] }; }
      else if (run) { out.td = { how: 'run', by: run[1], yards: Number(run[2]) }; }
      else if (ret) { out.td = { how: ret[2] === 'kickoff' ? 'kick' : 'punt', by: ret[1], yards: null }; }
      else if (pick) { out.td = { how: 'pick', by: pick[1], yards: null }; }
      return out;
    }).filter(Boolean);
  }

  /* A touchdown that put its team ahead in the fourth quarter or overtime
     of a game it won, and was never caught after: Game-Winning, as the
     six's cards say it. */
  function gameWinning(plays, at, won) {
    var p = plays[at];
    if (!won || p.qtr < 4) { return false; }
    var before = at ? plays[at - 1].score : [0, 0];
    if (before[p.side] > before[1 - p.side]) { return false; }
    return plays.slice(at).every(function (q) { return q.score[p.side] > q.score[1 - p.side]; });
  }

  var HOW_WORD = { run: 'Rushing', 'catch': 'Receiving', pass: 'Passing' };

  /* --- building them ------------------------------------------------------ */

  function versusOf(home, oppKey, neutral) {
    var opp = EGE.nfl && EGE.nfl.teams[oppKey];
    return (home || neutral ? 'vs. ' : 'at ') + (opp ? opp.name : oppKey);
  }

  function build() {
    var b = { list: [], byId: {}, who: {}, players: {}, bySlug: {} };
    var six = sixByName();

    weeks.forEach(function (row) {
      (row.games || []).forEach(function (g) {
        var mates = sixTeams(row.season, row.week);
        var plays = readScoring(g.scoring, g.home);
        var score = g.score || [0, 0];
        var playoff = row.week >= 19 || Boolean(g.round);

        [g.home, g.away].forEach(function (team, side) {
          var with6 = mates[team];
          if (!with6) { return; }
          var simTeam = EGE.nfl && EGE.nfl.teams[team];
          var site = simTeam ? simTeam.site : null;
          var teamObj = (site && EGE.teams && EGE.teams[site]) || { school: simTeam ? simTeam.name : team };
          var oppKey = side === 0 ? g.away : g.home;
          var result = { teamScore: score[side], opponentScore: score[1 - side] };
          var won = result.teamScore > result.opponentScore;
          var lines = (g.box || []).filter(function (l) {
            return l.team === team && !l.ege && !six[String(l.name).toLowerCase()];
          });
          var byName = {};
          lines.forEach(function (l) { byName[l.name] = l; });

          function base(p, line) {
            var s = line ? statsOf(line) : {};
            /* The team he is on now: the last one he turned up for. */
            p.site = site;
            p.simTeam = team;
            return {
              nfl: true, season: row.season, week: row.week, slug: p.slug, player: p,
              position: (line && line.pos) || p.position, team: teamObj, teamKey: site, simTeam: team,
              opponent: EGE.nfl && EGE.nfl.teams[oppKey] ? EGE.nfl.teams[oppKey].name : oppKey,
              oppKey: oppKey, versus: versusOf(side === 0, oppKey, g.neutral || row.week === 22),
              event: g.round || null, playoff: playoff, with: with6.slice(),
              game: { season: row.season, week: row.week, stats: s, result: result,
                      line: lineOf((line && line.pos) || p.position, s) }
            };
          }

          function add(card) {
            if (b.byId[card.id]) { return; }
            b.byId[card.id] = card;
            b.list.push(card);
            (b.bySlug[card.slug] = b.bySlug[card.slug] || []).push(card);
          }

          /* His game, if there is a carry, a catch or a defensive stat in
             it. */
          lines.forEach(function (line) {
            var p = playerFor(b, line);
            var s = statsOf(line);
            p.teams[row.season] = team;
            if (!qualifies(s)) { return; }
            var card = base(p, line);
            card.id = 'n:' + row.season + ':' + p.slug + ':' + row.week;
            card.kind = 'performance';
            card.points = fantasy(s);
            card.grade = round2(card.points * gradeShare(card.position));
            card.rarity = rarityOf(card.id, card.grade, 'performance');
            card.big = bigOf(card.position, s);
            card.headline = card.versus;
            card.line = card.game.line;
            add(card);
          });

          /* Every touchdown he scored or threw. */
          var count = {};
          plays.forEach(function (play, at) {
            if (play.team !== team || !play.td) { return; }
            var td = play.td;
            var clutch = gameWinning(plays, at, won) ? 'Game-Winning' : null;
            var involved = [{ name: td.by, how: td.how === 'pass' ? 'catch' : td.how }];
            if (td.how === 'pass') { involved.push({ name: td.from, how: 'pass' }); }
            involved.forEach(function (one) {
              var low = String(one.name).toLowerCase();
              if (six[low]) { return; }
              var line = byName[one.name] || { name: one.name, pos: '', team: team };
              var p = playerFor(b, line);
              var i = count[p.slug] || 0;
              count[p.slug] = i + 1;
              var card = base(p, byName[one.name] || null);
              var yards = td.yards;
              var read = { kind: one.how, yards: yards, touchdown: true, clutch: clutch,
                           from: td.how === 'pass' ? td.from : null, to: td.how === 'pass' ? td.by : null };
              read.fromSix = read.from ? six[String(read.from).toLowerCase()] || null : null;
              read.toSix = read.to ? six[String(read.to).toLowerCase()] || null : null;
              var points;
              var grade;
              if (one.how === 'catch') { points = yards * 0.1 + 0.5 + 6; grade = yards / 10 + 6.5; }
              else if (one.how === 'run') { points = yards * 0.1 + 6; grade = yards / 10 + 6; }
              else if (one.how === 'pass') { points = yards * 0.04 + 4; grade = yards / 10 + 6; }
              else if (one.how === 'pick') { points = 6 + DEFENSE.defInts; grade = 10.5; }
              else { points = 6; grade = 10.5; }
              if (clutch) { grade += 3; }
              if (one.how === 'pick') {
                /* A defender's pick-six prints INT big, as the six's do. */
                read.kind = 'interception';
              } else if (one.how === 'kick' || one.how === 'punt') {
                read.kind = 'return';
                read.big = { text: one.how === 'kick' ? 'KR' : 'PR', unit: 'TD' };
              }
              read.points = round2(points);
              read.grade = round2(grade);
              card.id = 'nt:' + row.season + ':' + p.slug + ':' + row.week + ':' + i;
              card.kind = 'play';
              card.play = read;
              card.points = read.points;
              card.grade = read.grade;
              card.rarity = rarityOf(card.id, read.grade, 'play');
              card.headline = one.how === 'pick' ? 'Pick-Six'
                : one.how === 'kick' ? 'Kickoff Return TD' : one.how === 'punt' ? 'Punt Return TD'
                : yards + ' YD ' + HOW_WORD[one.how] + ' TD';
              card.text = one.how === 'pass' ? yards + ' yard touchdown pass to ' + td.by
                : one.how === 'catch' ? yards + ' yard touchdown catch from ' + td.from
                : one.how === 'run' ? yards + ' yard touchdown run'
                : one.how === 'pick' ? 'Interception returned for a touchdown'
                : (one.how === 'kick' ? 'Kickoff' : 'Punt') + ' returned for a touchdown';
              if (clutch) { card.text += ', the game-winner'; }
              card.line = card.text;
              add(card);
            });
          });
        });
      });
    });

    built = b;
  }

  function ensure() { if (!built) { build(); } }

  function list() { ensure(); return built.list; }
  function byId(id) { ensure(); return built.byId[id] || null; }
  function players() { ensure(); return built.players; }
  function playerOf(slug) { ensure(); return built.players[slug] || null; }
  function cardsOf(slug) { ensure(); return built.bySlug[slug] || []; }

  function isNflId(id) { return /^nt?:/.test(String(id || '')); }

  /* What the NFL Pack can hand out: every card of a published week. */
  function pullable() {
    return list().filter(function (card) { return EGE.isPublished(card.season, card.week); });
  }

  /* --- the NFL Pack ------------------------------------------------------ */

  /* Four NFL cards for 22 diamonds (Sam, 2026-11-06), the last one Rare or
     better like the event packs', on the standard odds. open_card_pack in
     supabase/schema.sql charges for it and takes only NFL cards in it. The
     NFL shield is Sam's. */
  var PACK = {
    key: 'nfl',
    name: 'NFL Pack',
    diamonds: 22,
    size: 4,
    floor: 'rare',
    nfl: true,
    pool: pullable,
    cover: { theme: 'nfl', logo: 'icon/packs/nfl-shield.webp' },
    blurb: 'Four cards of the six’s NFL teammates, the last one Rare or better.'
  };

  /* --- NFL Player Cards ----------------------------------------------------

     A teammate the account has collected enough of has a Player Card of
     his own (Sam, 2026-11-06), on the six's ladder but shorter, since there
     are far more of them and a teammate's cards score less: it is made the
     moment his cards are worth NFL_RANKS' first rung, Uncommon, and climbs
     from there. Points are the six's: the FPTS on every copy held.

     It pays much less than one of the six's (Sam): a fifth of his game's
     fantasy points times his position's share (PAY_SHARE), times the
     rank's bonus, and the week's NFL Player Cards are paid together, the
     total rounded, as one award a week (npc-w{week}; pay_nfl_card_bonuses
     in supabase/schema.sql holds it to 60). A teammate starter's 15-point
     game at Mystic is worth about 3 diamonds; at Uncommon, a fifth of one. */
  var NFL_RANKS = [
    { key: 'uncommon',  points: 30,   bonus: 0.10 },
    { key: 'rare',      points: 80,   bonus: 0.25 },
    { key: 'epic',      points: 160,  bonus: 0.50 },
    { key: 'legendary', points: 280,  bonus: 0.80 },
    { key: 'mystic',    points: 450,  bonus: 1.25 },
    { key: 'iconic',    points: 1400, bonus: 3.00 },
    { key: 'goat',      points: 5600, bonus: 5.00 }
  ];

  var PAY = 0.2;
  var PAY_SHARE = { QB: 0.55, RB: 0.5, FB: 0.5, WR: 0.75, TE: 0.75, DEF: 0.6 };
  var BONUS_MAX = 60;

  function payShare(pos) {
    var s = PAY_SHARE[pos];
    return typeof s === 'number' ? s : PAY_SHARE.DEF;
  }

  function ladderFor() {
    return NFL_RANKS.map(function (r) {
      var info = EGE.cards.playerRank(r.key);
      return { key: r.key, name: info.name, color: info.color, points: r.points, bonus: r.bonus };
    });
  }

  /* Every teammate the account holds a card of: { slug: { points, copies,
     distinct } }. */
  function holdings(owned) {
    var out = {};
    Object.keys(owned || {}).forEach(function (id) {
      if (!isNflId(id)) { return; }
      var card = EGE.cards.byId(id);
      var q = owned[id] || 0;
      if (!card || !card.nfl || q <= 0) { return; }
      var h = out[card.slug] || (out[card.slug] = { points: 0, copies: 0, seen: {} });
      h.points += Math.max(0, card.points) * q;
      h.copies += q;
      h.seen[card.baseId || card.id] = true;
    });
    Object.keys(out).forEach(function (slug) {
      out[slug].points = round2(out[slug].points);
      out[slug].distinct = Object.keys(out[slug].seen).length;
      delete out[slug].seen;
    });
    return out;
  }

  /* One teammate's NFL Player Card for `owned`, shaped as data/cards.js's
     playerCard is: rank null below Uncommon, when there is no card yet. */
  function playerCard(slug, owned, held) {
    var player = playerOf(slug);
    var h = (held || holdings(owned))[slug] || { points: 0, copies: 0, distinct: 0 };
    var ladder = ladderFor();
    var at = -1;
    ladder.forEach(function (r, i) { if (h.points >= r.points) { at = i; } });
    return {
      player: player, nfl: true, points: h.points, copies: h.copies, distinct: h.distinct, ladder: ladder,
      rank: at === -1 ? null : ladder[at],
      next: at + 1 < ladder.length ? ladder[at + 1] : null
    };
  }

  /* Every NFL Player Card the account has made, best first. */
  function playerCards(owned) {
    var held = holdings(owned);
    return Object.keys(held).map(function (slug) { return playerCard(slug, owned, held); })
      .filter(function (pc) { return pc.player && pc.rank; })
      .sort(function (a, b) { return b.points - a.points || (a.player.name < b.player.name ? -1 : 1); });
  }

  /* How many teammates the account has a card of but not yet a Player Card. */
  function onTheWay(owned) {
    var held = holdings(owned);
    var first = NFL_RANKS[0].points;
    return Object.keys(held).filter(function (slug) { return held[slug].points < first; }).length;
  }

  /* What one of his games pays at a rank, in diamonds and parts of one. */
  function gameBonus(card, rankKey) {
    var r = NFL_RANKS.filter(function (one) { return one.key === rankKey; })[0];
    if (!r || !card || card.kind !== 'performance') { return 0; }
    var times = EGE.economy ? EGE.economy.playoffDiamondTimes(card.season, card.playoff) : 1;
    return Math.max(0, card.points) * payShare(card.position) * PAY * r.bonus * times;
  }

  /* About what one of his games pays at a rank: his games this season, or
     last season's before any are out. */
  function typicalBonus(slug, rankKey) {
    var games = [];
    [EGE.currentSeason, EGE.currentSeason - 1].some(function (year) {
      games = cardsOf(slug).filter(function (c) {
        return c.kind === 'performance' && c.season === year && EGE.isPublished(c.season, c.week);
      });
      return games.length > 0;
    });
    if (!games.length) { return null; }
    var sum = games.reduce(function (t, c) { return t + gameBonus(c, rankKey); }, 0);
    return Math.round(sum / games.length * 10) / 10;
  }

  /* What the account's NFL Player Cards owe for each published week of
     `season` the box scores are in for: [{ key: 'npc-w{week}', diamonds,
     note }]. A week of nothing is 0, so it is settled at the ranks held
     when it was first paid. Nothing at all before the box scores are read,
     so a week is never settled on cards that are not there yet. */
  function bonusesEarned(owned, season) {
    var year = season || EGE.currentSeason;
    var out = [];
    if (!loaded || year < FROM) { return out; }
    var cards = playerCards(owned);
    var rank = {};
    cards.forEach(function (pc) { rank[pc.player.slug] = pc.rank.key; });
    weeks.filter(function (w) { return w.season === year && EGE.isPublished(year, w.week); }).forEach(function (w) {
      var total = 0;
      var paying = 0;
      list().forEach(function (c) {
        if (c.season !== year || c.week !== w.week || c.kind !== 'performance' || !rank[c.slug]) { return; }
        var b = gameBonus(c, rank[c.slug]);
        if (b > 0) { total += b; paying += 1; }
      });
      var diamonds = Math.min(BONUS_MAX, Math.round(total));
      out.push({
        key: 'npc-w' + w.week,
        diamonds: diamonds,
        note: 'NFL Player Cards, week ' + w.week + ': ' + paying + (paying === 1 ? ' teammate' : ' teammates')
      });
    });
    return out;
  }

  /* --- the NFL sets --------------------------------------------------------

     Every set wants NFL cards and only those (EGE.cards.fill keeps the two
     apart), and pays an NFL card at or above its floor, from the NFL Pack's
     cards, with diamonds and on the longer ones a 1.5x Booster, inside what
     claim_card_set lets a set pay (40 diamonds, a 1.5x). None of them names
     a teammate, since who the six play with changes every season: they ask
     for teammates of each of the six, for kinds of play and for the big
     days, so the same sets fill whoever is in the sim's world. */
  var setsCache = null;

  function slot(label, test) { return { label: label, test: test }; }
  function times(count, label, test) {
    var out = [];
    for (var i = 0; i < count; i += 1) { out.push(slot(label, test)); }
    return out;
  }
  function stat(c, key) { return c.kind === 'performance' ? n(c.game.stats, key) : 0; }
  function td(c, how) { return c.kind === 'play' && c.play && c.play.kind === how; }
  function rankAtLeast(c, key) { return EGE.cards.rankOf(c.rarity) >= EGE.cards.rankOf(key); }
  function withSix(slug) { return function (c) { return (c.with || []).indexOf(slug) !== -1; }; }
  function at(pos) {
    return function (c) { return pos.indexOf(c.position) !== -1; };
  }

  /* Slots that want different teammates, not just different cards: no
     player fills two of them (fill, below). */
  function differentPlayers(count, label, test) {
    return times(count, label, test).map(function (s) { s.player = true; return s; });
  }

  var REWARD = {
    rare:       function (d, booster) { return { floor: 'rare', diamonds: d, booster: booster || null }; },
    epic:       function (d, booster) { return { floor: 'epic', diamonds: d, booster: booster || null }; },
    legendary:  function (d, booster) { return { floor: 'legendary', diamonds: d, booster: booster || null }; },
    mystic:     function (d, booster) { return { floor: 'mystic', diamonds: d, booster: booster || null }; }
  };

  function sets() {
    if (setsCache) { return setsCache; }
    var BOOST = EGE.cards.BOOSTER;
    var out = [];
    var six = EGE.players || [];
    var seasons = {};
    list().forEach(function (c) { seasons[c.season] = true; });

    out.push({
      key: 'nfl-supporting-cast', name: 'Supporting Cast', group: 'NFL',
      blurb: 'A card of a teammate of each of the six.',
      slots: six.map(function (p) { return slot(p.first + '’s teammate', withSix(p.slug)); }),
      reward: REWARD.rare(8)
    });

    six.forEach(function (p) {
      out.push({
        key: 'nfl-mates-' + p.slug, name: p.first + '’s Locker Room', group: 'NFL Teammates',
        blurb: 'Six of ' + p.first + '’s teammates, each a different player.',
        slots: differentPlayers(6, p.first + '’s teammate', withSix(p.slug)),
        reward: Object.assign(REWARD.epic(10), { from: withSix(p.slug), fromText: p.first + '’s teammates' })
      });
    });

    Object.keys(seasons).map(Number).sort(function (a, b) { return a - b; }).forEach(function (season) {
      out.push({
        key: 'nfl-season-' + season, name: season + ' Teammates', group: 'NFL Seasons',
        blurb: 'A ' + season + ' performance by a teammate of each of the six.',
        slots: six.map(function (p) {
          return slot(p.first + ', ' + season, function (c) {
            return c.season === season && c.kind === 'performance' && withSix(p.slug)(c);
          });
        }),
        reward: Object.assign(REWARD.epic(12, BOOST), {
          from: function (c) { return c.season === season; }, fromText: String(season) })
      });
    });

    out.push({
      key: 'nfl-offense', name: 'Skill Positions', group: 'NFL',
      blurb: 'A quarterback, a running back, a receiver and a tight end.',
      slots: [slot('QB', at(['QB'])), slot('RB', at(['RB', 'FB'])), slot('WR', at(['WR'])), slot('TE', at(['TE']))],
      reward: REWARD.rare(8)
    });

    out.push({
      key: 'nfl-defense', name: 'Defense', group: 'NFL',
      blurb: 'An edge rusher, a lineman, a linebacker, a corner and a safety.',
      slots: [slot('EDGE', at(['EDGE'])), slot('DL', at(['DI', 'DL', 'DT', 'DE'])), slot('LB', at(['LB'])),
              slot('CB', at(['CB'])), slot('S', at(['S']))],
      reward: REWARD.rare(10)
    });

    out.push({
      key: 'nfl-ground-game', name: 'Ground Game', group: 'NFL',
      blurb: 'Five rushing touchdowns.',
      slots: times(5, 'Rushing TD', function (c) { return td(c, 'run'); }),
      reward: REWARD.epic(12)
    });

    out.push({
      key: 'nfl-air-mail', name: 'Air Mail', group: 'NFL',
      blurb: 'Five receiving touchdowns.',
      slots: times(5, 'Receiving TD', function (c) { return td(c, 'catch'); }),
      reward: REWARD.rare(10)
    });

    /* A teammate's pass to Paxon, Cooper or Andrew is a card of the
       quarterback's: about one card in 140 is one, so this is the long one. */
    out.push({
      key: 'nfl-special-delivery', name: 'Special Delivery', group: 'NFL',
      blurb: 'Three teammates’ touchdown passes to one of the six.',
      slots: times(3, 'TD pass to one of the six', function (c) { return td(c, 'pass') && Boolean(c.play.toSix); }),
      reward: REWARD.legendary(20, BOOST)
    });

    out.push({
      key: 'nfl-targets', name: 'Favorite Targets', group: 'NFL',
      blurb: 'Two touchdown catches from Isaac and two from Jaykeb.',
      slots: times(2, 'TD catch from Isaac', function (c) { return td(c, 'catch') && c.play.fromSix === 'isaac-vitel'; })
        .concat(times(2, 'TD catch from Jaykeb', function (c) {
          return td(c, 'catch') && c.play.fromSix === 'jaykeb-stewart';
        })),
      reward: REWARD.epic(15, BOOST)
    });

    out.push({
      key: 'nfl-house-call', name: 'House Call', group: 'NFL',
      blurb: 'Three touchdowns of 50 yards or more.',
      slots: times(3, '50+ yard TD', function (c) { return c.kind === 'play' && c.play.yards >= 50; }),
      reward: REWARD.legendary(15, BOOST)
    });

    out.push({
      key: 'nfl-take-it-back', name: 'Take It Back', group: 'NFL',
      blurb: 'A pick-six, or a kickoff or punt returned for a touchdown.',
      slots: [slot('Return TD', function (c) { return td(c, 'interception') || td(c, 'return'); })],
      reward: REWARD.epic(12)
    });

    out.push({
      key: 'nfl-clutch', name: 'Clutch', group: 'NFL',
      blurb: 'Two game-winning touchdowns.',
      slots: times(2, 'Game-winning TD', function (c) { return c.kind === 'play' && Boolean(c.play.clutch); }),
      reward: REWARD.legendary(15, BOOST)
    });

    out.push({
      key: 'nfl-century', name: 'Century Club', group: 'NFL',
      blurb: 'Three games of 100 rushing or receiving yards.',
      slots: times(3, '100-yard game', function (c) {
        return stat(c, 'rushingYards') >= 100 || stat(c, 'receivingYards') >= 100;
      }),
      reward: REWARD.epic(12)
    });

    out.push({
      key: 'nfl-sack-attack', name: 'Sack Attack', group: 'NFL',
      blurb: 'Three games with two sacks or more.',
      slots: times(3, '2+ sack game', function (c) { return stat(c, 'sacks') >= 2; }),
      reward: REWARD.epic(12)
    });

    out.push({
      key: 'nfl-ball-hawk', name: 'Ball Hawk', group: 'NFL',
      blurb: 'Three games with an interception.',
      slots: times(3, 'Game with an INT', function (c) { return stat(c, 'defInts') >= 1; }),
      reward: REWARD.epic(12)
    });

    out.push({
      key: 'nfl-tackle-machine', name: 'Tackle Machine', group: 'NFL',
      blurb: 'Two games of 12 tackles or more.',
      slots: times(2, '12+ tackle game', function (c) { return stat(c, 'tackles') >= 12; }),
      reward: REWARD.epic(12)
    });

    out.push({
      key: 'nfl-playoff-run', name: 'Playoff Run', group: 'NFL',
      blurb: 'Four cards from the playoffs.',
      slots: times(4, 'Playoff card', function (c) { return c.playoff; }),
      reward: REWARD.epic(15, BOOST)
    });

    out.push({
      key: 'nfl-collector', name: 'NFL Collector', group: 'NFL',
      blurb: 'An NFL card of every rarity, Common to Mystic.',
      slots: EGE.cards.RARITIES.filter(function (r) { return r.key !== 'iconic'; }).map(function (r) {
        return slot(r.name, function (c) { return c.rarity === r.key; });
      }),
      reward: REWARD.legendary(20, BOOST)
    });

    out.push({
      key: 'nfl-pro-bowl', name: 'Pro Bowl', group: 'NFL',
      blurb: 'Five different Legendary-or-better NFL cards.',
      slots: times(5, 'Legendary+', function (c) { return rankAtLeast(c, 'legendary'); }),
      reward: REWARD.mystic(25, BOOST)
    });

    out.forEach(function (set) { set.nfl = true; });
    setsCache = out;
    return out;
  }

  /* Which owned NFL card fills which slot of an NFL set, the way
     EGE.cards.fill does it for the six's (best cards offered first, a card
     and its holos one card), and a slot marked `player` never takes a
     teammate another such slot has. */
  function fill(set, ownedIds) {
    var owned = (ownedIds || []).filter(isNflId).map(EGE.cards.byId)
      .filter(function (c) { return c && c.nfl; }).sort(EGE.cards.compare);
    var used = {};
    var usedPlayer = {};
    var filled = set.slots.map(function (s) {
      var card = owned.filter(function (c) {
        return !used[c.baseId || c.id] && !(s.player && usedPlayer[c.slug]) && s.test(c);
      })[0] || null;
      if (card) {
        used[card.baseId || card.id] = true;
        if (s.player) { usedPlayer[card.slug] = true; }
      }
      return { slot: s, card: card };
    });
    var have = filled.filter(function (f) { return f.card; }).length;
    return { slots: filled, have: have, need: set.slots.length,
             complete: set.slots.length > 0 && have === set.slots.length };
  }

  /* The card an NFL set pays: an NFL card at or above its floor, from the
     set's own pool where it names one. */
  function rollReward(set, rng) {
    var pool = pullable();
    if (set.reward.from) {
      var narrowed = pool.filter(set.reward.from);
      if (narrowed.length) { pool = narrowed; }
    }
    return EGE.cards.drawFrom(pool, rng || Math.random, set.reward.floor);
  }

  /* --- into the card game ---------------------------------------------------

     The NFL Pack goes on the shelf after the Pro Pack, and data/cards.js's
     sets, set filling, set rewards and pack covers learn the NFL ones; its
     own sets never take an NFL card, and the NFL ones never take one of
     the six's. */
  if (EGE.cards) {
    EGE.cards.PACKS.push(PACK);

    var sixSets = EGE.cards.sets;
    EGE.cards.sets = function () { return sixSets().concat(sets()); };

    var sixFill = EGE.cards.fill;
    EGE.cards.fill = function (set, ownedIds, pulled) {
      if (set && set.nfl) { return fill(set, ownedIds); }
      return sixFill(set, (ownedIds || []).filter(function (id) { return !isNflId(id); }), pulled);
    };

    var sixReward = EGE.cards.rollReward;
    EGE.cards.rollReward = function (set, rng) {
      return set && set.nfl ? rollReward(set, rng) : sixReward(set, rng);
    };

    var sixCover = EGE.cards.packCover;
    EGE.cards.packCover = function (p) { return p && p.cover ? p.cover : sixCover(p); };
  }

  return {
    FROM: FROM,
    DEFENSE: DEFENSE,
    GRADE_SHARE: GRADE_SHARE,
    PACK: PACK,
    NFL_RANKS: NFL_RANKS,
    PAY: PAY,
    PAY_SHARE: PAY_SHARE,
    BONUS_MAX: BONUS_MAX,
    take: take,
    loaded: function () { return loaded; },
    onChange: onChange,
    wanted: wanted,
    sixTeams: sixTeams,
    slugOf: slugOf,
    isNflId: isNflId,
    list: list,
    byId: byId,
    players: players,
    playerOf: playerOf,
    cardsOf: cardsOf,
    pullable: pullable,
    holdings: holdings,
    playerCard: playerCard,
    playerCards: playerCards,
    onTheWay: onTheWay,
    ladderFor: ladderFor,
    gameBonus: gameBonus,
    typicalBonus: typicalBonus,
    bonusesEarned: bonusesEarned,
    sets: sets,
    fill: fill,
    rollReward: rollReward,
    forget: function () { withCache = {}; built = null; setsCache = null; }
  };
})();
