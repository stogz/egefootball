/* ==========================================================================
   EGE Football — the stat generator
   Turns a fixture into a stat line: what a player did in one game, worked
   out from what he is, who he was playing, and what he had riding on it.

   Nothing here is a coin toss dressed up. A game is played out rather than
   summarised — every carry, every target, every drop-back gets its own
   number — so the totals can only ever agree with each other. A back cannot
   have a 60-yard long in a 40-yard game, because the long is the biggest
   carry in the list that added up to 40.

   Four things move a stat line, in roughly this order of weight:

     the matchup   his overall against the opponent's strength
     form          a roll, so a good player can still have a bad Friday
     the booster   a 2.5x sticker is worth about 2.5x the production
     the venue     a little at home, a little against him away

   Everything runs off a seeded generator keyed to the season, the week and
   the player, so the same seed always gives the same game. That is what
   makes a roll reviewable: the published file carries the seed it came
   from, and anyone can run it again and get the same numbers.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.statgen = (function () {
  'use strict';

  /* --- seeded randomness -------------------------------------------------- */

  /* FNV-1a, the same hash the sticker scatter uses. */
  function hashOf(text) {
    var hash = 2166136261;
    for (var i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  /* mulberry32: small, fast, and good enough for football. */
  function generator(seed) {
    var state = hashOf(String(seed));
    return function () {
      state = (state + 0x6D2B79F5) >>> 0;
      var t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function seedFor(season, week, slug, nonce) {
    return 'ege|' + season + '|' + week + '|' + slug + '|' + (nonce || 0);
  }

  /* A bell rather than a flat line: most Fridays are ordinary. */
  function bell(rand) {
    var u = Math.max(rand(), 1e-9);
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
  }

  /* How many times something happened, given how often it tends to. Knuth's
     method — the right shape for touchdowns, turnovers and sacks, which
     cluster rather than spread evenly. */
  function howMany(expected, rand) {
    if (expected <= 0) { return 0; }
    var limit = Math.exp(-expected);
    var k = 0;
    var p = 1;
    do { k += 1; p *= rand(); } while (p > limit);
    return k - 1;
  }

  function clamp(value, low, high) { return Math.max(low, Math.min(high, value)); }

  function mean(values) {
    var real = values.filter(function (v) { return typeof v === 'number'; });
    if (!real.length) { return 50; }
    return real.reduce(function (a, b) { return a + b; }, 0) / real.length;
  }

  /* --- who they were playing ---------------------------------------------- */

  /* Opponent strength on the same 1-99 scale the players are on.

     A game can carry its own `strength` in data/schedule.js, and that always
     wins — put a real number on a real opponent and this stops guessing. A
     game without one gets a number derived from the opponent's name, which
     means it is arbitrary but never moves: Torrey Pines is the same side in
     March as it was in August. Conference opponents get a few points, being
     the sides these schools are actually measured against. */
  var STRENGTH_FLOOR = 38;
  var STRENGTH_RANGE = 26;

  function opponentStrength(game) {
    if (!game) { return 50; }
    if (typeof game.strength === 'number') { return clamp(game.strength, 1, 99); }

    var rand = generator('opponent|' + game.opponent);
    var strength = STRENGTH_FLOOR + Math.floor(rand() * STRENGTH_RANGE);
    if (game.conference) { strength += 4; }
    return clamp(strength, 1, 99);
  }

  /* --- how the game went for him ------------------------------------------ */

  /* One number for how the game is going: 1 is an ordinary Friday against an
     even side, 2 is the best game of his life. Everything below scales off
     it, which is what keeps a line internally honest — nobody runs for 200
     yards and catches nothing while having a quiet night. */
  function qualityOf(player, game, multiplier, rand) {
    var overall = EGE.overallFor(player) || 50;
    var edge = overall - opponentStrength(game);

    var quality = 1 +
      edge / 55 +                       /* the matchup */
      bell(rand) * 0.26 +               /* form */
      (game.home ? 0.05 : -0.03);       /* the venue */

    quality = clamp(quality, 0.32, 2.1);

    /* What the sticker was bought for. It lifts the game he was going to
       have rather than replacing it, so a booster on a bad matchup is still
       worth less than one on a good day. */
    if (multiplier) { quality *= multiplier; }

    return clamp(quality, 0.28, 5.0);
  }

  /* --- playing it out ------------------------------------------------------ */

  /* One carry. Most of them are a couple of yards and a pile; a back who
     breaks tackles and can see a lane turns a few of them into something. */
  function carry(values, quality, rand) {
    var burst = mean([values.breakTackle, values.speed, values.bcVision, values.trucking]);
    var base = 2.4 + (burst - 50) / 24 + (quality - 1) * 2.1;
    var roll = rand();

    if (roll < 0.15) {                                   /* met in the hole */
      return -Math.round(rand() * 3);
    }
    if (roll < 0.88) {                                   /* the ordinary one */
      return Math.max(-2, Math.round(base + rand() * 5.5 - 1.6));
    }
    /* Through the line and away. */
    return Math.round(9 + rand() * (13 + (burst - 50) / 2.2 + quality * 13));
  }

  /* One target: caught or not, and if caught, how much of it was in the air
     and how much was made afterwards. */
  function target(values, quality, rand) {
    var hands = mean([values.catching, values.catchInTraffic, values.spectacularCatch]);
    var caught = clamp(0.49 + (hands - 50) / 120 + (quality - 1) * 0.10, 0.25, 0.9);
    if (rand() > caught) { return null; }

    var routes = mean([values.routeRunningShort, values.routeRunningMedium, values.routeRunningDeep]);
    var air = 3 + rand() * 9 + (routes - 50) / 9 + (quality - 1) * 2.4;
    if (rand() < 0.09) { air += 12 + rand() * 22; }      /* over the top */

    var afterCatch = mean([values.breakTackle, values.speed, values.jukeMove, values.changeOfDirection]);
    var yac = rand() * rand() * (6 + (afterCatch - 50) / 6.5 + quality * 4.5);

    air = Math.max(-2, Math.round(air));
    yac = Math.max(0, Math.round(yac));
    return { yards: Math.max(0, air + yac), yac: yac };
  }

  /* One drop-back, from the thrower's side. */
  function dropBack(values, quality, rand) {
    var accuracy = mean([values.throwAccuracyShort, values.throwAccuracyMid, values.throwAccuracyDeep]);
    var complete = clamp(0.40 + (accuracy - 50) / 115 + (quality - 1) * 0.11, 0.22, 0.84);
    if (rand() > complete) { return null; }

    var arm = mean([values.throwPower, values.throwAccuracyDeep, values.throwOnTheRun]);
    var air = 4 + rand() * 8 + (arm - 50) / 10 + (quality - 1) * 2.2;
    if (rand() < 0.10) { air += 13 + rand() * 24; }      /* the shot */

    var yac = rand() * rand() * (7 + quality * 5);
    air = Math.max(-2, Math.round(air));
    yac = Math.max(0, Math.round(yac));
    return { yards: Math.max(0, air + yac), yac: yac };
  }

  /* --- adding it up -------------------------------------------------------- */

  function totalOf(plays) {
    return plays.reduce(function (sum, gain) { return sum + gain; }, 0);
  }

  function longestOf(plays) {
    return plays.length ? plays.reduce(function (a, b) { return Math.max(a, b); }, -99) : null;
  }

  /* An average to one decimal place, or null when there was nothing to
     average. Worked out from the two numbers beside it, never rolled, so
     the line always agrees with itself. */
  function averageOf(yards, count) {
    if (!count) { return null; }
    return Math.round((yards / count) * 10) / 10;
  }

  /* How many of those yards became points. Yards are the chance and
     finishing is what is done with it, and it can never be more scores than
     there were plays to score on. */
  function scoresFrom(yards, plays, quality, finishing, rand) {
    if (yards <= 0 || !plays) { return 0; }
    var expected = (yards / 74) * (0.75 + (finishing - 50) / 190 + (quality - 1) * 0.30);
    return Math.min(plays, howMany(Math.max(0, expected), rand));
  }

  /* The scoreboard, built out of scores rather than drawn out of a hat, so
     it always looks like a football score. His own touchdowns are in it. */
  function scoreline(player, game, playerTds, quality, rand) {
    var edge = (EGE.overallFor(player) || 50) - opponentStrength(game);

    var ourTds = playerTds + howMany(1.1 + (quality - 1) * 0.5 + edge / 90, rand);
    var ourFgs = howMany(0.8, rand);
    var ours = ourTds * 7 + ourFgs * 3;
    if (ourTds && rand() < 0.12) { ours -= 1; }          /* a missed extra point */

    var theirTds = howMany(2.2 - edge / 70 - (quality - 1) * 0.25, rand);
    var theirFgs = howMany(0.9, rand);
    var theirs = theirTds * 7 + theirFgs * 3;
    if (theirTds && rand() < 0.12) { theirs -= 1; }

    /* High school football does not end level. */
    if (ours === theirs) {
      if (rand() < 0.5) { ours += 3; } else { theirs += 3; }
    }

    return { teamScore: clamp(ours, 0, 77), opponentScore: clamp(theirs, 0, 77) };
  }

  /* --- the stat lines ------------------------------------------------------ */

  /* NFL passer rating. Each part is capped at 2.375 before it is added in,
     which is the formula, not a tidy-up. */
  function passerRating(completions, attempts, yards, touchdowns, interceptions) {
    if (!attempts) { return null; }
    var a = clamp((completions / attempts - 0.3) * 5, 0, 2.375);
    var b = clamp((yards / attempts - 3) * 0.25, 0, 2.375);
    var c = clamp((touchdowns / attempts) * 20, 0, 2.375);
    var d = clamp(2.375 - (interceptions / attempts) * 25, 0, 2.375);
    return Math.round(((a + b + c + d) / 6) * 1000) / 10;
  }

  /* A quarterback's night: the throws, then what he did with his legs. */
  function quarterback(player, values, game, quality, rand) {
    var attempts = Math.round(clamp(20 + bell(rand) * 4 + (quality - 1) * 3, 11, 44));

    var completions = 0;
    var passingYards = 0;
    var passingYac = 0;
    var passPlays = [];

    for (var i = 0; i < attempts; i += 1) {
      var play = dropBack(values, quality, rand);
      if (!play) { continue; }
      completions += 1;
      passingYards += play.yards;
      passingYac += play.yac;
      passPlays.push(play.yards);
    }

    var pocket = mean([values.throwUnderPressure, values.awareness, values.breakSack]);
    var interceptions = howMany(clamp(attempts * 0.032 - (pocket - 50) / 900 - (quality - 1) * 0.28, 0, 4), rand);
    var sacks = howMany(clamp(2.0 - (pocket - 50) / 55 - (quality - 1) * 0.4, 0, 7), rand);
    var passingTd = scoresFrom(passingYards, completions, quality,
                               mean([values.throwAccuracyShort, values.awareness]), rand);

    /* A quarterback runs when he has to, and a bit more if he can. */
    var legs = mean([values.speed, values.acceleration, values.bcVision]);
    var carries = Math.round(clamp(4 + bell(rand) * 2.2 + (legs - 50) / 14, 0, 18));
    var runs = [];
    for (var r = 0; r < carries; r += 1) { runs.push(carry(values, quality * 0.88, rand)); }
    var rushingYards = totalOf(runs);
    var rushingTd = scoresFrom(Math.max(0, rushingYards), runs.length, quality * 0.7, legs, rand);

    var fumbles = howMany(clamp(0.28 - (values.carrying - 50) / 400, 0, 3), rand);

    return {
      completions: completions,
      attempts: attempts,
      passingYards: passingYards,
      passingAvg: averageOf(passingYards, completions),
      passingYac: passingYac,
      passingTd: passingTd,
      interceptions: interceptions,
      rating: passerRating(completions, attempts, passingYards, passingTd, interceptions),
      carries: carries,
      rushingYards: rushingYards,
      rushingAvg: averageOf(rushingYards, carries),
      rushingTd: rushingTd,
      rushingLong: longestOf(runs),
      sacks: sacks,
      fumbles: fumbles
    };
  }

  /* A back's night: the carries, and the targets that make him worth more
     than the carries. */
  function runningBack(player, values, game, quality, rand) {
    var workload = mean([values.stamina, values.carrying, values.toughness]);
    var carries = Math.round(clamp(14 + bell(rand) * 3.4 + (workload - 50) / 13 + (quality - 1) * 2.6, 4, 34));

    var runs = [];
    for (var i = 0; i < carries; i += 1) { runs.push(carry(values, quality, rand)); }
    var rushingYards = totalOf(runs);
    var rushingTd = scoresFrom(Math.max(0, rushingYards), runs.length, quality,
                               mean([values.trucking, values.breakTackle]), rand);

    var hands = mean([values.catching, values.routeRunningShort]);
    var targets = Math.round(clamp(3 + bell(rand) * 1.6 + (hands - 50) / 16, 0, 12));

    var receptions = 0;
    var receivingYards = 0;
    var receivingYac = 0;
    var catches = [];
    for (var t = 0; t < targets; t += 1) {
      var play = target(values, quality, rand);
      if (!play) { continue; }
      receptions += 1;
      receivingYards += play.yards;
      receivingYac += play.yac;
      catches.push(play.yards);
    }
    var receivingTd = scoresFrom(receivingYards, receptions, quality, hands, rand);

    var fumbles = howMany(clamp(0.34 - (values.carrying - 50) / 330, 0, 3), rand);

    return {
      totalYards: rushingYards + receivingYards,
      totalTd: rushingTd + receivingTd,
      carries: carries,
      rushingYards: rushingYards,
      rushingAvg: averageOf(rushingYards, carries),
      rushingTd: rushingTd,
      rushingLong: longestOf(runs),
      receptions: receptions,
      receivingYards: receivingYards,
      receivingAvg: averageOf(receivingYards, receptions),
      receivingYac: receivingYac,
      receivingTd: receivingTd,
      receivingLong: longestOf(catches),
      targets: targets,
      fumbles: fumbles
    };
  }

  /* A receiver or a tight end: the targets, and the handful of carries a
     coach gives him on a sweep. */
  function receiver(player, values, game, quality, rand) {
    var wanted = mean([values.catching, values.routeRunningMedium, values.release, values.awareness]);
    var targets = Math.round(clamp(7 + bell(rand) * 2.4 + (wanted - 50) / 11 + (quality - 1) * 2.2, 1, 20));

    var receptions = 0;
    var receivingYards = 0;
    var receivingYac = 0;
    var catches = [];
    for (var t = 0; t < targets; t += 1) {
      var play = target(values, quality, rand);
      if (!play) { continue; }
      receptions += 1;
      receivingYards += play.yards;
      receivingYac += play.yac;
      catches.push(play.yards);
    }
    var receivingTd = scoresFrom(receivingYards, receptions, quality, wanted, rand);

    /* Handed it now and then, and less often the bigger he is. */
    var carries = rand() < (player.position === 'TE' ? 0.16 : 0.3) ? 1 + Math.floor(rand() * 2) : 0;
    var runs = [];
    for (var c = 0; c < carries; c += 1) { runs.push(carry(values, quality, rand)); }
    var rushingYards = totalOf(runs);
    var rushingTd = scoresFrom(Math.max(0, rushingYards), runs.length, quality,
                               mean([values.speed, values.breakTackle]), rand);

    var fumbles = howMany(clamp(0.26 - (values.carrying - 50) / 400, 0, 3), rand);

    return {
      totalYards: receivingYards + rushingYards,
      totalTd: receivingTd + rushingTd,
      receptions: receptions,
      receivingYards: receivingYards,
      receivingAvg: averageOf(receivingYards, receptions),
      receivingYac: receivingYac,
      receivingTd: receivingTd,
      receivingLong: longestOf(catches),
      targets: targets,
      carries: carries,
      rushingYards: rushingYards,
      rushingAvg: averageOf(rushingYards, carries),
      rushingTd: rushingTd,
      rushingLong: longestOf(runs),
      fumbles: fumbles
    };
  }

  /* --- what a stat line is -------------------------------------------------

     The columns each position's game log carries, in the order they are read
     in. One definition, used by the player page, the admin preview and the
     Discord post, so there is never a version of a quarterback's line that
     disagrees with another version of it.

     `text` is what goes in the cell. `total` says how a season adds up:
     `sum` down the column, `max` for a long, and `derive` for the ones that
     have to be worked out again from the totals rather than averaged —
     averaging a column of averages is how a stat page ends up lying. */

  function show(value) {
    return value === null || value === undefined ? '—' : String(value);
  }

  var RUSHING = [
    { key: 'carries',     label: 'CAR',   title: 'Rushing Attempts',
      text: function (s) { return show(s.carries); }, total: 'sum' },
    { key: 'rushingYards', label: 'RUYDS', title: 'Rushing Yards',
      text: function (s) { return show(s.rushingYards); }, total: 'sum' },
    { key: 'rushingAvg',  label: 'RUAVG', title: 'Rushing Yards per Attempt',
      text: function (s) { return show(s.rushingAvg); }, total: 'derive',
      derive: function (t) { return averageOf(t.rushingYards, t.carries); } },
    { key: 'rushingTd',   label: 'RUTD',  title: 'Rushing Touchdowns',
      text: function (s) { return show(s.rushingTd); }, total: 'sum' },
    { key: 'rushingLong', label: 'LNG',   title: 'Longest Rush',
      text: function (s) { return show(s.rushingLong); }, total: 'max' }
  ];

  var RECEIVING = [
    { key: 'receptions',     label: 'REC',   title: 'Receptions',
      text: function (s) { return show(s.receptions); }, total: 'sum' },
    { key: 'receivingYards', label: 'REYDS', title: 'Receiving Yards',
      text: function (s) { return show(s.receivingYards); }, total: 'sum' },
    { key: 'receivingAvg',   label: 'REAVG', title: 'Receiving Yards per Reception',
      text: function (s) { return show(s.receivingAvg); }, total: 'derive',
      derive: function (t) { return averageOf(t.receivingYards, t.receptions); } },
    { key: 'receivingYac',   label: 'YAC',   title: 'Yards After Catch',
      text: function (s) { return show(s.receivingYac); }, total: 'sum' },
    { key: 'receivingTd',    label: 'RETD',  title: 'Receiving Touchdowns',
      text: function (s) { return show(s.receivingTd); }, total: 'sum' },
    { key: 'receivingLong',  label: 'LNG',   title: 'Longest Reception',
      text: function (s) { return show(s.receivingLong); }, total: 'max' },
    { key: 'targets',        label: 'TGT',   title: 'Targets',
      text: function (s) { return show(s.targets); }, total: 'sum' }
  ];

  var FUMBLES = { key: 'fumbles', label: 'FL', title: 'Fumbles Lost',
                  text: function (s) { return show(s.fumbles); }, total: 'sum' };

  var TOTALS = [
    { key: 'totalYards', label: 'YDS', title: 'Total Yards',
      text: function (s) { return show(s.totalYards); }, total: 'sum' },
    { key: 'totalTd',    label: 'TD',  title: 'Total Touchdowns',
      text: function (s) { return show(s.totalTd); }, total: 'sum' }
  ];

  var LINES = {
    QB: [
      { key: 'completions', label: 'C/ATT', title: 'Completions / Attempts',
        text: function (s) { return s.completions + '/' + s.attempts; }, total: 'derive',
        derive: function (t) { return t.completions + '/' + t.attempts; } },
      { key: 'passingYards', label: 'PYDS', title: 'Passing Yards',
        text: function (s) { return show(s.passingYards); }, total: 'sum' },
      { key: 'passingAvg',  label: 'PAVG', title: 'Passing Yards per Completion',
        text: function (s) { return show(s.passingAvg); }, total: 'derive',
        derive: function (t) { return averageOf(t.passingYards, t.completions); } },
      { key: 'passingYac',  label: 'PYAC', title: 'Passing Yards After Catch',
        text: function (s) { return show(s.passingYac); }, total: 'sum' },
      { key: 'passingTd',   label: 'PTD',  title: 'Passing Touchdowns',
        text: function (s) { return show(s.passingTd); }, total: 'sum' },
      { key: 'interceptions', label: 'INT', title: 'Interceptions',
        text: function (s) { return show(s.interceptions); }, total: 'sum' },
      { key: 'rating',      label: 'RTG',  title: 'Passer Rating',
        text: function (s) { return show(s.rating); }, total: 'derive',
        derive: function (t) {
          return passerRating(t.completions, t.attempts, t.passingYards,
                              t.passingTd, t.interceptions);
        } }
    ].concat(RUSHING, [
      { key: 'sacks', label: 'SACK', title: 'Sacks Taken',
        text: function (s) { return show(s.sacks); }, total: 'sum' },
      FUMBLES
    ]),

    RB: TOTALS.concat(RUSHING, RECEIVING, [FUMBLES]),

    TE: TOTALS.concat(RECEIVING, RUSHING, [FUMBLES]),
    WR: TOTALS.concat(RECEIVING, RUSHING, [FUMBLES])
  };

  function lineFor(position) {
    return LINES[position] || LINES.WR;
  }

  /* A season's worth of games under one line, each column added up the way
     that column is meant to be. */
  function totalLine(position, games) {
    var summed = {};
    var longs = {};

    games.forEach(function (stats) {
      if (!stats) { return; }
      Object.keys(stats).forEach(function (key) {
        var value = stats[key];
        if (typeof value !== 'number') { return; }
        summed[key] = (summed[key] || 0) + value;
        longs[key] = longs[key] === undefined ? value : Math.max(longs[key], value);
      });
    });

    var out = {};
    lineFor(position).forEach(function (column) {
      if (column.total === 'max') {
        out[column.key] = longs[column.key] === undefined ? null : longs[column.key];
      } else if (column.total === 'derive') {
        out[column.key] = column.derive(summed);
      } else {
        out[column.key] = summed[column.key] || 0;
      }
    });
    return { columns: out, summed: summed };
  }

  var BY_POSITION = { QB: quarterback, RB: runningBack, WR: receiver, TE: receiver };

  /* --- one game ------------------------------------------------------------ */

  /* Plays out a single fixture and hands back the result, the stat line, and
     everything that went into it. `options.multiplier` is the booster stuck
     on the game; `options.nonce` is what a reroll turns over. */
  function playGame(player, game, options) {
    var settings = options || {};
    var season = settings.season || EGE.currentSeason;
    var seed = seedFor(season, game.week, player.slug, settings.nonce);
    var rand = generator(seed);

    var values = EGE.valuesFor(player) || {};
    var multiplier = settings.multiplier || null;
    var quality = qualityOf(player, game, multiplier, rand);

    var play = BY_POSITION[player.position] || receiver;
    var stats = play(player, values, game, quality, rand);

    var touchdowns = EGE.economy.touchdownsIn(stats);

    return {
      week: game.week,
      seed: seed,
      nonce: settings.nonce || 0,
      result: scoreline(player, game, touchdowns, quality, rand),
      stats: stats,
      /* Kept for the record: what the roll was working from. */
      inputs: {
        overall: EGE.overallFor(player),
        opponent: game.opponent,
        opponentStrength: opponentStrength(game),
        home: Boolean(game.home),
        multiplier: multiplier,
        quality: Math.round(quality * 100) / 100
      }
    };
  }

  /* --- a whole week -------------------------------------------------------- */

  /* Which of the six is at this school, if any. Two of them share a league
     and play each other, and when they do, one scoreboard has to serve both
     of them. */
  function playerAtSchool(name) {
    var wanted = String(name).toLowerCase();
    return EGE.players.filter(function (player) {
      var team = EGE.teamFor(player);
      if (!team) { return false; }
      var school = team.school.toLowerCase();
      return school === wanted || school.indexOf(wanted + ' ') === 0;
    })[0] || null;
  }

  /* Every game in a week, played out. `nonces` is a map of player slug to
     the reroll count for that player, so one line can be rolled again
     without disturbing the rest of the week.

     `boosters` is what js/wallet.js loaded: slug -> week -> sticker row. */
  function playWeek(week, options) {
    var settings = options || {};
    var season = settings.season || EGE.currentSeason;
    var nonces = settings.nonces || {};
    var boosters = settings.boosters || EGE.gameBoosters || {};

    var played = EGE.players.map(function (player) {
      var game = EGE.gameInWeek(player, week, season);
      if (!game) { return null; }

      var sticker = (boosters[player.slug] || {})[week] || null;
      return {
        player: player,
        game: game,
        booster: sticker ? {
          key: sticker.item_key,
          name: sticker.item_name,
          multiplier: EGE.multiplierFor(sticker.item_key)
        } : null,
        outcome: playGame(player, game, {
          season: season,
          nonce: nonces[player.slug] || 0,
          multiplier: sticker ? EGE.multiplierFor(sticker.item_key) : null
        })
      };
    }).filter(Boolean);

    /* When two of them played each other, both scoreboards say the same
       thing: each keeps the points his own night produced, and takes the
       other's as the points against. */
    played.forEach(function (entry) {
      var rival = playerAtSchool(entry.game.opponent);
      if (!rival || rival.slug === entry.player.slug) { return; }

      var other = played.filter(function (e) { return e.player.slug === rival.slug; })[0];
      if (!other) { return; }
      entry.outcome.result.opponentScore = other.outcome.result.teamScore;
      entry.outcome.headToHead = rival.slug;
    });

    return played;
  }

  return {
    lineFor: lineFor,
    totalLine: totalLine,
    show: show,
    playGame: playGame,
    playWeek: playWeek,
    opponentStrength: opponentStrength,
    passerRating: passerRating,
    seedFor: seedFor,
    generator: generator,
    playerAtSchool: playerAtSchool
  };
})();
