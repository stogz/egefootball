/* ==========================================================================
   EGE Football — the 2018 season
   The whole season in one file: who each of them plays, when, and what they
   did in it. One of these per season, and nothing else holds a fixture or a
   stat line — the schedule lives here too, because a game and what happened
   in it are the same thing.

   Filling it in
   -------------
   `result` and `stats` are null until a game has been played. Put the numbers
   in by hand, or use the season editor on the admin page, which writes this
   file back out for you.

   `booster` is the performance booster that was riding on the game, as its
   shop key — 'boost-2-5', 'boost-2-0', 'boost-1-5' — or null. Once a week
   is published this is where a booster lives for good, so the row behind it
   can be cleared out of Supabase.

   Nothing here shows on the site until the admin publishes that week. The
   numbers can sit in the repository for as long as it takes.

   `conference: true` marks the games listed with an asterisk, and
   `scouts: true` marks a game scouts will be at — what Intel buys is the
   right to see it.
   ========================================================================== */

window.EGE = window.EGE || {};
EGE.stats = EGE.stats || {};

EGE.stats[2018] = {
  season: 2018,
  level: 'High school varsity',

  games: {

    /* Andrew Parr — Wake Forest High School */
    'andrew-parr': [
      { week:  1, date: '2018-08-18', kickoff: '7:00pm',
        opponent: 'Millbrook', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  2, date: '2018-08-25', kickoff: '7:30pm',
        opponent: 'Richmond Senior', home: false, conference: false, scouts: true,
        result: null, booster: null, stats: null },
      { week:  3, date: '2018-09-04', kickoff: '6:00pm',
        opponent: 'Middle Creek', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  4, date: '2018-09-08', kickoff: '7:00pm',
        opponent: 'Leesville Road', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week:  5, date: '2018-09-15', kickoff: '7:00pm',
        opponent: 'Southern Nash', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week:  6, date: '2018-09-22', kickoff: '7:00pm',
        opponent: 'Franklinton', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  8, date: '2018-10-06', kickoff: '7:00pm',
        opponent: 'Knightdale', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week:  9, date: '2018-10-13', kickoff: '7:00pm',
        opponent: 'Corinth Holders', home: false, conference: true, scouts: true,
        result: null, booster: null, stats: null },
      { week: 10, date: '2018-10-20', kickoff: '7:00pm',
        opponent: 'Rolesville', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week: 11, date: '2018-10-27', kickoff: '7:00pm',
        opponent: 'Wakefield', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week: 12, date: '2018-11-03', kickoff: '7:00pm',
        opponent: 'Heritage', home: true, conference: true, scouts: true,
        result: null, booster: null, stats: null },
    ],

    /* Cooper Clark — Carlsbad High School */
    'cooper-clark': [
      { week:  2, date: '2018-08-25', kickoff: '7:00pm',
        opponent: 'Del Norte', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  3, date: '2018-09-01', kickoff: '7:00pm',
        opponent: 'St. Augustine', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week:  4, date: '2018-09-08', kickoff: '7:00pm',
        opponent: 'Sweetwater', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week:  5, date: '2018-09-15', kickoff: '7:00pm',
        opponent: 'Mission Hills', home: true, conference: true, scouts: true,
        result: null, booster: null, stats: null },
      { week:  6, date: '2018-09-22', kickoff: '7:00pm',
        opponent: 'La Costa Canyon', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week:  8, date: '2018-10-06', kickoff: '7:00pm',
        opponent: 'Oceanside', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week:  9, date: '2018-10-13', kickoff: '7:00pm',
        opponent: 'San Marcos', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week: 10, date: '2018-10-20', kickoff: '7:00pm',
        opponent: 'Torrey Pines', home: true, conference: true, scouts: true,
        result: null, booster: null, stats: null },
      { week: 11, date: '2018-10-27', kickoff: '7:00pm',
        opponent: 'El Camino', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week: 12, date: '2018-11-03', kickoff: '7:00pm',
        opponent: 'Vista', home: true, conference: false,
        result: null, booster: null, stats: null },
    ],

    /* Paxon Hatch — Bloomington High School */
    'paxon-hatch': [
      { week:  2, date: '2018-08-25', kickoff: '7:00pm',
        opponent: 'Manual', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week:  3, date: '2018-09-01', kickoff: '7:00pm',
        opponent: 'Normal Community', home: false, conference: true, scouts: true,
        result: null, booster: null, stats: null },
      { week:  4, date: '2018-09-08', kickoff: '7:00pm',
        opponent: 'Champaign Central', home: true, conference: true, scouts: true,
        result: null, booster: null, stats: null },
      { week:  5, date: '2018-09-15', kickoff: '7:00pm',
        opponent: 'Kankakee', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  6, date: '2018-09-22', kickoff: '7:30pm',
        opponent: 'Peoria', home: false, conference: true, scouts: true,
        result: null, booster: null, stats: null },
      { week:  7, date: '2018-09-29', kickoff: '7:00pm',
        opponent: 'Normal West', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week:  8, date: '2018-10-06', kickoff: '7:00pm',
        opponent: 'Richwoods', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week:  9, date: '2018-10-13', kickoff: '7:00pm',
        opponent: 'Urbana', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week: 10, date: '2018-10-20', kickoff: '7:00pm',
        opponent: 'Danville', home: false, conference: true,
        result: null, booster: null, stats: null },
    ],

    /* Isaac Vitel — no school yet, so no fixtures. */
    'isaac-vitel': [],

    /* Sam Stogsdill — Normal Community High School */
    'sam-stogsdill': [
      { week:  2, date: '2018-08-25', kickoff: '7:00pm',
        opponent: 'Urbana', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week:  3, date: '2018-09-01', kickoff: '7:00pm',
        opponent: 'Bloomington', home: true, conference: true, scouts: true,
        result: null, booster: null, stats: null },
      { week:  4, date: '2018-09-08', kickoff: '7:00pm',
        opponent: 'Peoria Notre Dame', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week:  5, date: '2018-09-15', kickoff: '7:00pm',
        opponent: 'Normal West', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week:  6, date: '2018-09-22', kickoff: '7:00pm',
        opponent: 'Richwoods', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week:  7, date: '2018-09-29', kickoff: '7:00pm',
        opponent: 'Bradley-Bourbonnais', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  8, date: '2018-10-06', kickoff: '7:00pm',
        opponent: 'Centennial', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week:  9, date: '2018-10-13', kickoff: '7:00pm',
        opponent: 'Danville', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week: 10, date: '2018-10-20', kickoff: '7:00pm',
        opponent: 'Champaign Central', home: false, conference: true, scouts: true,
        result: null, booster: null, stats: null },
    ],

    /* Jaykeb Stewart — Naples High School */
    'jaykeb-stewart': [
      { week:  2, date: '2018-08-25', kickoff: '7:30pm',
        opponent: 'Edison', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  3, date: '2018-09-01', kickoff: '7:30pm',
        opponent: 'Palmetto', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  7, date: '2018-09-28', kickoff: '7:30pm',
        opponent: 'Palmetto Ridge', home: true, conference: true, scouts: true,
        result: null, booster: null, stats: null },
      { week:  8, date: '2018-10-06', kickoff: '7:30pm',
        opponent: 'Lely', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  9, date: '2018-10-13', kickoff: '7:00pm',
        opponent: 'Golden Gate', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week: 10, date: '2018-10-20', kickoff: '7:30pm',
        opponent: 'South Fort Myers', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week: 11, date: '2018-10-27', kickoff: '7:00pm',
        opponent: 'Barron Collier', home: false, conference: true, scouts: true,
        result: null, booster: null, stats: null },
      { week: 12, date: '2018-11-03', kickoff: '7:30pm',
        opponent: 'Piper', home: true, conference: false,
        result: null, booster: null, stats: null },
    ],
  }
};
