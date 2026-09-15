/* ==========================================================================
   EGE Football — schedules and results
   The regular season, one entry per player per week. A week a player did not
   play — a bye, or a game they missed — is `{ week, bye: true }`, and
   anything reading this file should skip it rather than render a blank.

   Stat keys follow the player's position: a quarterback carries completions
   and passing yards, a back carries carries and rushing yards, a tight end
   carries receptions and receiving yards.

   Placeholders, like the ratings: opponents, scores and stat lines are
   generated. Isaac Vitel has no schedule at all yet because his school is
   still TBD, which is the same thing as having no games to post.
   ========================================================================== */

window.EGE = window.EGE || {};

/* Keyed by season, then by player slug. */
EGE.schedule = {
  2018: {
    'andrew-parr': [
      {
        week: 1, date: '2018-08-08', opponent: 'Heritage', home: true,
        teamScore: 16, opponentScore: 39,
        stats: { receptions: 7, targets: 7, receivingYards: 79,
          receivingTd: 0 }
      },
      {
        week: 2, date: '2018-08-15', opponent: 'Millbrook', home: true,
        teamScore: 10, opponentScore: 8,
        stats: { receptions: 6, targets: 7, receivingYards: 40,
          receivingTd: 1 }
      },
      {
        week: 3, date: '2018-08-22', opponent: 'Rolesville', home: true,
        teamScore: 31, opponentScore: 20,
        stats: { receptions: 1, targets: 2, receivingYards: 15,
          receivingTd: 1 }
      },
      {
        week: 4, date: '2018-09-01', opponent: 'Leesville Road', home: false,
        teamScore: 20, opponentScore: 9,
        stats: { receptions: 7, targets: 8, receivingYards: 74,
          receivingTd: 0 }
      },
      {
        week: 5, date: '2018-09-08', opponent: 'Green Hope', home: true,
        teamScore: 37, opponentScore: 24,
        stats: { receptions: 3, targets: 5, receivingYards: 21,
          receivingTd: 2 }
      },
      { week: 6, bye: true },
      {
        week: 7, date: '2018-09-22', opponent: 'Cardinal Gibbons', home: false,
        teamScore: 11, opponentScore: 16,
        stats: { receptions: 3, targets: 6, receivingYards: 51,
          receivingTd: 2 }
      },
      {
        week: 8, date: '2018-09-01', opponent: 'Broughton', home: true,
        teamScore: 43, opponentScore: 40,
        stats: { receptions: 6, targets: 9, receivingYards: 97,
          receivingTd: 1 }
      },
      {
        week: 9, date: '2018-10-08', opponent: 'Sanderson', home: false,
        teamScore: 35, opponentScore: 41,
        stats: { receptions: 7, targets: 7, receivingYards: 81,
          receivingTd: 1 }
      },
      {
        week: 10, date: '2018-10-15', opponent: 'Knightdale', home: false,
        teamScore: 39, opponentScore: 25,
        stats: { receptions: 2, targets: 5, receivingYards: 21,
          receivingTd: 0 }
      },
      {
        week: 11, date: '2018-10-22', opponent: 'Wakefield', home: true,
        teamScore: 12, opponentScore: 31,
        stats: { receptions: 7, targets: 8, receivingYards: 102,
          receivingTd: 1 }
      },
    ],
    'cooper-clark': [
      {
        week: 1, date: '2018-08-08', opponent: 'La Costa Canyon', home: true,
        teamScore: 32, opponentScore: 14,
        stats: { carries: 19, rushingYards: 42, rushingTd: 0, receptions: 3,
          receivingYards: 36 }
      },
      {
        week: 2, date: '2018-08-15', opponent: 'Torrey Pines', home: false,
        teamScore: 42, opponentScore: 20,
        stats: { carries: 15, rushingYards: 40, rushingTd: 1, receptions: 1,
          receivingYards: 48 }
      },
      {
        week: 3, date: '2018-08-22', opponent: 'San Marcos', home: true,
        teamScore: 45, opponentScore: 16,
        stats: { carries: 18, rushingYards: 143, rushingTd: 3, receptions: 0,
          receivingYards: 3 }
      },
      { week: 4, bye: true },
      {
        week: 5, date: '2018-09-08', opponent: 'Vista', home: true,
        teamScore: 43, opponentScore: 41,
        stats: { carries: 20, rushingYards: 56, rushingTd: 2, receptions: 3,
          receivingYards: 32 }
      },
      {
        week: 6, date: '2018-09-15', opponent: 'Oceanside', home: false,
        teamScore: 26, opponentScore: 39,
        stats: { carries: 9, rushingYards: 61, rushingTd: 0, receptions: 1,
          receivingYards: 57 }
      },
      {
        week: 7, date: '2018-09-22', opponent: 'El Camino', home: false,
        teamScore: 7, opponentScore: 25,
        stats: { carries: 19, rushingYards: 113, rushingTd: 3, receptions: 3,
          receivingYards: 45 }
      },
      {
        week: 8, date: '2018-09-01', opponent: 'Rancho Buena Vista', home: true,
        teamScore: 25, opponentScore: 17,
        stats: { carries: 10, rushingYards: 69, rushingTd: 1, receptions: 4,
          receivingYards: 49 }
      },
      {
        week: 9, date: '2018-10-08', opponent: 'Mission Hills', home: true,
        teamScore: 24, opponentScore: 6,
        stats: { carries: 20, rushingYards: 131, rushingTd: 1, receptions: 2,
          receivingYards: 15 }
      },
      {
        week: 10, date: '2018-10-15', opponent: 'Poway', home: false,
        teamScore: 45, opponentScore: 28,
        stats: { carries: 17, rushingYards: 61, rushingTd: 3, receptions: 2,
          receivingYards: 29 }
      },
      {
        week: 11, date: '2018-10-22', opponent: 'Escondido', home: false,
        teamScore: 38, opponentScore: 30,
        stats: { carries: 13, rushingYards: 83, rushingTd: 2, receptions: 5,
          receivingYards: 11 }
      },
    ],
    'paxon-hatch': [
      {
        week: 1, date: '2018-08-08', opponent: 'Normal West', home: true,
        teamScore: 18, opponentScore: 15,
        stats: { receptions: 4, targets: 6, receivingYards: 51,
          receivingTd: 1 }
      },
      {
        week: 2, date: '2018-08-15', opponent: 'Peoria Notre Dame', home: false,
        teamScore: 40, opponentScore: 20,
        stats: { receptions: 4, targets: 7, receivingYards: 22,
          receivingTd: 1 }
      },
      {
        week: 3, date: '2018-08-22', opponent: 'Danville', home: false,
        teamScore: 15, opponentScore: 23,
        stats: { receptions: 5, targets: 8, receivingYards: 35,
          receivingTd: 0 }
      },
      {
        week: 4, date: '2018-09-01', opponent: 'Champaign Central', home: true,
        teamScore: 7, opponentScore: 32,
        stats: { receptions: 3, targets: 7, receivingYards: 17,
          receivingTd: 2 }
      },
      {
        week: 5, date: '2018-09-08', opponent: 'Urbana', home: false,
        teamScore: 41, opponentScore: 7,
        stats: { receptions: 3, targets: 7, receivingYards: 20,
          receivingTd: 2 }
      },
      {
        week: 6, date: '2018-09-15', opponent: 'Mattoon', home: false,
        teamScore: 41, opponentScore: 21,
        stats: { receptions: 7, targets: 11, receivingYards: 73,
          receivingTd: 1 }
      },
      { week: 7, bye: true },
      {
        week: 8, date: '2018-09-01', opponent: 'Charleston', home: true,
        teamScore: 23, opponentScore: 18,
        stats: { receptions: 2, targets: 3, receivingYards: 21,
          receivingTd: 0 }
      },
      {
        week: 9, date: '2018-10-08', opponent: 'Lincoln', home: false,
        teamScore: 32, opponentScore: 21,
        stats: { receptions: 2, targets: 4, receivingYards: 22,
          receivingTd: 2 }
      },
      {
        week: 10, date: '2018-10-15', opponent: 'Springfield', home: false,
        teamScore: 41, opponentScore: 8,
        stats: { receptions: 9, targets: 9, receivingYards: 162,
          receivingTd: 1 }
      },
      {
        week: 11, date: '2018-10-22', opponent: 'Decatur MacArthur', home: false,
        teamScore: 17, opponentScore: 13,
        stats: { receptions: 3, targets: 4, receivingYards: 49,
          receivingTd: 0 }
      },
    ],
    'isaac-vitel': [
    ],
    'sam-stogsdill': [
      {
        week: 1, date: '2018-08-08', opponent: 'Bloomington', home: false,
        teamScore: 31, opponentScore: 16,
        stats: { carries: 9, rushingYards: 23, rushingTd: 2, receptions: 2,
          receivingYards: 50 }
      },
      {
        week: 2, date: '2018-08-15', opponent: 'Normal West', home: false,
        teamScore: 13, opponentScore: 22,
        stats: { carries: 20, rushingYards: 107, rushingTd: 2, receptions: 0,
          receivingYards: 11 }
      },
      {
        week: 3, date: '2018-08-22', opponent: 'Peoria', home: true,
        teamScore: 8, opponentScore: 13,
        stats: { carries: 25, rushingYards: 178, rushingTd: 3, receptions: 4,
          receivingYards: 6 }
      },
      {
        week: 4, date: '2018-09-01', opponent: 'Dunlap', home: true,
        teamScore: 34, opponentScore: 41,
        stats: { carries: 20, rushingYards: 149, rushingTd: 3, receptions: 5,
          receivingYards: 11 }
      },
      { week: 5, bye: true },
      {
        week: 6, date: '2018-09-15', opponent: 'Morton', home: true,
        teamScore: 9, opponentScore: 40,
        stats: { carries: 20, rushingYards: 140, rushingTd: 1, receptions: 4,
          receivingYards: 37 }
      },
      {
        week: 7, date: '2018-09-22', opponent: 'Pekin', home: false,
        teamScore: 35, opponentScore: 19,
        stats: { carries: 17, rushingYards: 86, rushingTd: 3, receptions: 2,
          receivingYards: 51 }
      },
      {
        week: 8, date: '2018-09-01', opponent: 'Washington', home: false,
        teamScore: 19, opponentScore: 42,
        stats: { carries: 25, rushingYards: 150, rushingTd: 1, receptions: 5,
          receivingYards: 27 }
      },
      {
        week: 9, date: '2018-10-08', opponent: 'Metamora', home: true,
        teamScore: 41, opponentScore: 42,
        stats: { carries: 17, rushingYards: 55, rushingTd: 3, receptions: 0,
          receivingYards: 38 }
      },
      {
        week: 10, date: '2018-10-15', opponent: 'Canton', home: false,
        teamScore: 14, opponentScore: 11,
        stats: { carries: 12, rushingYards: 80, rushingTd: 3, receptions: 1,
          receivingYards: 25 }
      },
      {
        week: 11, date: '2018-10-22', opponent: 'Limestone', home: false,
        teamScore: 28, opponentScore: 15,
        stats: { carries: 26, rushingYards: 190, rushingTd: 0, receptions: 1,
          receivingYards: 3 }
      },
    ],
    'jaykeb-stewart': [
      {
        week: 1, date: '2018-08-08', opponent: 'Golden Gate', home: true,
        teamScore: 43, opponentScore: 26,
        stats: { completions: 12, attempts: 28, passingYards: 228,
          passingTd: 3, interceptions: 0, rushingYards: 18, rushingTd: 1 }
      },
      {
        week: 2, date: '2018-08-15', opponent: 'Palmetto Ridge', home: false,
        teamScore: 33, opponentScore: 27,
        stats: { completions: 12, attempts: 25, passingYards: 262,
          passingTd: 2, interceptions: 2, rushingYards: 41, rushingTd: 0 }
      },
      { week: 3, bye: true },
      {
        week: 4, date: '2018-09-01', opponent: 'Gulf Coast', home: false,
        teamScore: 29, opponentScore: 16,
        stats: { completions: 23, attempts: 32, passingYards: 206,
          passingTd: 0, interceptions: 1, rushingYards: 1, rushingTd: 0 }
      },
      {
        week: 5, date: '2018-09-08', opponent: 'Barron Collier', home: true,
        teamScore: 24, opponentScore: 10,
        stats: { completions: 15, attempts: 20, passingYards: 164,
          passingTd: 0, interceptions: 0, rushingYards: 34, rushingTd: 1 }
      },
      {
        week: 6, date: '2018-09-15', opponent: 'Lely', home: false,
        teamScore: 41, opponentScore: 32,
        stats: { completions: 13, attempts: 26, passingYards: 212,
          passingTd: 2, interceptions: 1, rushingYards: 41, rushingTd: 0 }
      },
      {
        week: 7, date: '2018-09-22', opponent: 'Immokalee', home: false,
        teamScore: 41, opponentScore: 15,
        stats: { completions: 20, attempts: 30, passingYards: 185,
          passingTd: 0, interceptions: 2, rushingYards: 19, rushingTd: 0 }
      },
      {
        week: 8, date: '2018-09-01', opponent: 'Estero', home: false,
        teamScore: 26, opponentScore: 17,
        stats: { completions: 14, attempts: 21, passingYards: 283,
          passingTd: 4, interceptions: 1, rushingYards: 23, rushingTd: 1 }
      },
      {
        week: 9, date: '2018-10-08', opponent: 'Riverdale', home: true,
        teamScore: 31, opponentScore: 38,
        stats: { completions: 15, attempts: 27, passingYards: 252,
          passingTd: 0, interceptions: 2, rushingYards: 34, rushingTd: 0 }
      },
      {
        week: 10, date: '2018-10-15', opponent: 'Bonita Springs', home: true,
        teamScore: 9, opponentScore: 42,
        stats: { completions: 11, attempts: 26, passingYards: 205,
          passingTd: 0, interceptions: 2, rushingYards: 10, rushingTd: 0 }
      },
      {
        week: 11, date: '2018-10-22', opponent: 'Dunbar', home: false,
        teamScore: 35, opponentScore: 12,
        stats: { completions: 13, attempts: 25, passingYards: 271,
          passingTd: 0, interceptions: 0, rushingYards: 61, rushingTd: 1 }
      },
    ],
  }
};

/* --- reading it ----------------------------------------------------------- */

EGE.gamesFor = function (player, season) {
  var year = season || EGE.currentSeason;
  var bySlug = EGE.schedule[year] || {};
  return (player && bySlug[player.slug]) || [];
};

/* The games actually played, in week order — byes and missed weeks dropped. */
EGE.gamesPlayed = function (player, season) {
  return EGE.gamesFor(player, season).filter(function (game) { return !game.bye; });
};

EGE.gameInWeek = function (player, week, season) {
  return EGE.gamesFor(player, season).filter(function (game) {
    return game.week === week && !game.bye;
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

EGE.recordFor = function (player, season) {
  var wins = 0;
  var losses = 0;
  EGE.gamesPlayed(player, season).forEach(function (game) {
    if (game.teamScore > game.opponentScore) { wins += 1; } else { losses += 1; }
  });
  return { wins: wins, losses: losses, text: wins + '-' + losses };
};
