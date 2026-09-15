/* ==========================================================================
   EGE Football — schedules
   The regular season, one entry per game. Weeks run Thursday to Wednesday
   from 16 August 2018, so a midweek game belongs to the week that has just
   finished rather than the one about to start.

   A week a player has no entry for is a week they do not play — a bye, an
   open date, a season that started later than someone else's. Anything
   reading this file should skip that player for that week rather than
   render a blank.

   `conference: true` marks the games listed with an asterisk.

   `scouts: true` marks a game scouts will be at. It is always in the data;
   what a player buys with Intel is the right to see it.

   No results yet: this is the schedule as it stands before the season. A
   game gains a `result: { teamScore, opponentScore }` and a `stats` object
   once it has been played, and everything reading this file already handles
   both states.
   ========================================================================== */

window.EGE = window.EGE || {};

/* Keyed by season, then by player slug. */
EGE.schedule = {
  2018: {
    'andrew-parr': [
      { week:  1, date: '2018-08-18', kickoff: '7:00pm',
        opponent: 'Millbrook', home: true, conference: false },
      { week:  2, date: '2018-08-25', kickoff: '7:30pm',
        opponent: 'Richmond Senior', home: false, conference: false, scouts: true },
      { week:  3, date: '2018-09-04', kickoff: '6:00pm',
        opponent: 'Middle Creek', home: true, conference: false },
      { week:  4, date: '2018-09-08', kickoff: '7:00pm',
        opponent: 'Leesville Road', home: false, conference: false },
      { week:  5, date: '2018-09-15', kickoff: '7:00pm',
        opponent: 'Southern Nash', home: false, conference: false },
      { week:  6, date: '2018-09-22', kickoff: '7:00pm',
        opponent: 'Franklinton', home: true, conference: false },
      { week:  8, date: '2018-10-06', kickoff: '7:00pm',
        opponent: 'Knightdale', home: true, conference: true },
      { week:  9, date: '2018-10-13', kickoff: '7:00pm',
        opponent: 'Corinth Holders', home: false, conference: true, scouts: true },
      { week: 10, date: '2018-10-20', kickoff: '7:00pm',
        opponent: 'Rolesville', home: true, conference: true },
      { week: 11, date: '2018-10-27', kickoff: '7:00pm',
        opponent: 'Wakefield', home: false, conference: true },
      { week: 12, date: '2018-11-03', kickoff: '7:00pm',
        opponent: 'Heritage', home: true, conference: true, scouts: true },
    ],
    'cooper-clark': [
      { week:  2, date: '2018-08-25', kickoff: '7:00pm',
        opponent: 'Del Norte', home: true, conference: false },
      { week:  3, date: '2018-09-01', kickoff: '7:00pm',
        opponent: 'St. Augustine', home: false, conference: false },
      { week:  4, date: '2018-09-08', kickoff: '7:00pm',
        opponent: 'Sweetwater', home: false, conference: false },
      { week:  5, date: '2018-09-15', kickoff: '7:00pm',
        opponent: 'Mission Hills', home: true, conference: true, scouts: true },
      { week:  6, date: '2018-09-22', kickoff: '7:00pm',
        opponent: 'La Costa Canyon', home: false, conference: true },
      { week:  8, date: '2018-10-06', kickoff: '7:00pm',
        opponent: 'Oceanside', home: false, conference: true },
      { week:  9, date: '2018-10-13', kickoff: '7:00pm',
        opponent: 'San Marcos', home: true, conference: true },
      { week: 10, date: '2018-10-20', kickoff: '7:00pm',
        opponent: 'Torrey Pines', home: true, conference: true, scouts: true },
      { week: 11, date: '2018-10-27', kickoff: '7:00pm',
        opponent: 'El Camino', home: false, conference: true },
      { week: 12, date: '2018-11-03', kickoff: '7:00pm',
        opponent: 'Vista', home: true, conference: false },
    ],
    'paxon-hatch': [
      { week:  2, date: '2018-08-25', kickoff: '7:00pm',
        opponent: 'Manual', home: true, conference: true },
      { week:  3, date: '2018-09-01', kickoff: '7:00pm',
        opponent: 'Normal Community', home: false, conference: true, scouts: true },
      { week:  4, date: '2018-09-08', kickoff: '7:00pm',
        opponent: 'Champaign Central', home: true, conference: true, scouts: true },
      { week:  5, date: '2018-09-15', kickoff: '7:00pm',
        opponent: 'Kankakee', home: true, conference: false },
      { week:  6, date: '2018-09-22', kickoff: '7:30pm',
        opponent: 'Peoria', home: false, conference: true, scouts: true },
      { week:  7, date: '2018-09-29', kickoff: '7:00pm',
        opponent: 'Normal West', home: true, conference: true },
      { week:  8, date: '2018-10-06', kickoff: '7:00pm',
        opponent: 'Richwoods', home: false, conference: true },
      { week:  9, date: '2018-10-13', kickoff: '7:00pm',
        opponent: 'Urbana', home: true, conference: true },
      { week: 10, date: '2018-10-20', kickoff: '7:00pm',
        opponent: 'Danville', home: false, conference: true },
    ],
    /* No school yet, so no schedule yet. */
    'isaac-vitel': [],
    'sam-stogsdill': [
      { week:  2, date: '2018-08-25', kickoff: '7:00pm',
        opponent: 'Urbana', home: false, conference: true },
      { week:  3, date: '2018-09-01', kickoff: '7:00pm',
        opponent: 'Bloomington', home: true, conference: true, scouts: true },
      { week:  4, date: '2018-09-08', kickoff: '7:00pm',
        opponent: 'Peoria Notre Dame', home: false, conference: true },
      { week:  5, date: '2018-09-15', kickoff: '7:00pm',
        opponent: 'Normal West', home: false, conference: true },
      { week:  6, date: '2018-09-22', kickoff: '7:00pm',
        opponent: 'Richwoods', home: true, conference: true },
      { week:  7, date: '2018-09-29', kickoff: '7:00pm',
        opponent: 'Bradley-Bourbonnais', home: true, conference: false },
      { week:  8, date: '2018-10-06', kickoff: '7:00pm',
        opponent: 'Centennial', home: true, conference: true },
      { week:  9, date: '2018-10-13', kickoff: '7:00pm',
        opponent: 'Danville', home: true, conference: true },
      { week: 10, date: '2018-10-20', kickoff: '7:00pm',
        opponent: 'Champaign Central', home: false, conference: true, scouts: true },
    ],
    'jaykeb-stewart': [
      { week:  2, date: '2018-08-25', kickoff: '7:30pm',
        opponent: 'Edison', home: true, conference: false },
      { week:  3, date: '2018-09-01', kickoff: '7:30pm',
        opponent: 'Palmetto', home: true, conference: false },
      { week:  7, date: '2018-09-28', kickoff: '7:30pm',
        opponent: 'Palmetto Ridge', home: true, conference: true, scouts: true },
      { week:  8, date: '2018-10-06', kickoff: '7:30pm',
        opponent: 'Lely', home: true, conference: false },
      { week:  9, date: '2018-10-13', kickoff: '7:00pm',
        opponent: 'Golden Gate', home: false, conference: true },
      { week: 10, date: '2018-10-20', kickoff: '7:30pm',
        opponent: 'South Fort Myers', home: false, conference: false },
      { week: 11, date: '2018-10-27', kickoff: '7:00pm',
        opponent: 'Barron Collier', home: false, conference: true, scouts: true },
      { week: 12, date: '2018-11-03', kickoff: '7:30pm',
        opponent: 'Piper', home: true, conference: false },
    ],
  }
};

/* --- reading it ----------------------------------------------------------- */

EGE.gamesFor = function (player, season) {
  var year = season || EGE.currentSeason;
  var bySlug = EGE.schedule[year] || {};
  return (player && bySlug[player.slug]) || [];
};

/* A game is final once it has a result. Until then it is a fixture. */
EGE.isFinal = function (game) {
  return Boolean(game && game.result &&
    typeof game.result.teamScore === 'number' &&
    typeof game.result.opponentScore === 'number');
};

EGE.gamesPlayed = function (player, season) {
  return EGE.gamesFor(player, season).filter(EGE.isFinal);
};

EGE.gameInWeek = function (player, week, season) {
  return EGE.gamesFor(player, season).filter(function (game) {
    return game.week === week;
  })[0] || null;
};

/* How many weeks the regular season runs to, across every player. */
EGE.lastWeek = function (season) {
  var year = season || EGE.currentSeason;
  var bySlug = EGE.schedule[year] || {};
  var last = 0;
  Object.keys(bySlug).forEach(function (slug) {
    bySlug[slug].forEach(function (game) { if (game.week > last) { last = game.week; } });
  });
  return last;
};

/* The games scouts will attend. Only worth reading when the player has
   Intel for that season. */
EGE.scoutedGames = function (player, season) {
  return EGE.gamesFor(player, season).filter(function (game) { return game.scouts; });
};

/* Lays the published results over the fixtures. data/results.js calls this
   when it loads, and everything downstream — the table, the record, the game
   log, the credits a touchdown earns, the Discord bot — reads a game that now
   has a `result` and a `stats` on it, exactly as if it had been typed in here.

   Safe to call twice: it writes the same thing over the top. A result for a
   week nobody has a fixture in is ignored rather than invented. */
EGE.applyResults = function () {
  var published = EGE.results || {};

  Object.keys(published).forEach(function (season) {
    var bySlug = published[season] || {};

    Object.keys(bySlug).forEach(function (slug) {
      var player = EGE.playerBySlug(slug);
      if (!player) { return; }

      var weeks = bySlug[slug] || {};
      Object.keys(weeks).forEach(function (week) {
        var game = EGE.gameInWeek(player, Number(week), Number(season));
        if (!game) { return; }

        var entry = weeks[week];
        game.result = entry.result;
        game.stats = entry.stats;
        if (entry.booster) { game.booster = entry.booster; }
        if (entry.seed) { game.seed = entry.seed; }
      });
    });
  });
};

EGE.recordFor = function (player, season) {
  var wins = 0;
  var losses = 0;
  EGE.gamesPlayed(player, season).forEach(function (game) {
    if (game.result.teamScore > game.result.opponentScore) { wins += 1; } else { losses += 1; }
  });
  return { wins: wins, losses: losses, text: wins + '-' + losses };
};
