/* ==========================================================================
   EGE Football — the 2019 season
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

   `bigPlays` is an optional list of the moments worth calling out, one
   string a play — '44 yard receiving touchdown bomb'. They go out under
   the stat line in the Discord post. A game with none leaves it off.

   `overtime: true` marks a game that went to overtime. The score is still
   the final one; the flag only adds the OT beside it.

   `conference: true` marks the games listed with an asterisk, and
   `scouts: true` marks a game scouts will be at — what Intel buys is the
   right to see it.
   ========================================================================== */

window.EGE = window.EGE || {};
EGE.stats = EGE.stats || {};

EGE.stats[2019] = {
  season: 2019,
  level: 'High school varsity',

  games: {

    /* Andrew Parr — Wake Forest High School */
    'andrew-parr': [
      { week:  1, date: '2019-08-23', kickoff: '7:00pm',
        opponent: 'Cardinal Gibbons', home: true, conference: false, scouts: true,
        result: { teamScore: 38, opponentScore: 24 }, booster: 'boost-2-5',
        stats: {
          receptions: 9, receivingYards: 205, receivingYac: 144,
          receivingTd: 3, receivingLong: 53, targets: 14, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 22.8, totalYards: 205, totalTd: 3
        },
        bigPlays: [
          '53 yard receiving touchdown',
          '22 yard receiving touchdown',
          '10 yard receiving touchdown',
          '44 yard reception'
        ] },
      { week:  2, date: '2019-08-30', kickoff: '7:00pm',
        opponent: 'Clayton', home: false, conference: false,
        result: { teamScore: 42, opponentScore: 10 }, booster: null, stats: null },
      { week:  3, date: '2019-09-09', kickoff: '7:00pm',
        opponent: 'Middle Creek', home: true, conference: false,
        result: { teamScore: 52, opponentScore: 6 }, booster: null, stats: null },
      { week:  4, date: '2019-09-13', kickoff: '7:00pm',
        opponent: 'Millbrook', home: false, conference: false,
        result: { teamScore: 49, opponentScore: 7 }, booster: null, stats: null },
      { week:  5, date: '2019-09-20', kickoff: '7:00pm',
        opponent: 'Garner', home: false, conference: false,
        result: { teamScore: 52, opponentScore: 17 }, booster: null, stats: null },
      { week:  6, date: '2019-09-27', kickoff: '7:00pm',
        opponent: 'Wallace-Rose Hill', home: true, conference: false, scouts: true,
        result: { teamScore: 42, opponentScore: 28 }, booster: null, stats: null },
      { week:  8, date: '2019-10-11', kickoff: '7:00pm',
        opponent: 'Knightdale', home: true, conference: true,
        result: { teamScore: 41, opponentScore: 14 }, booster: null, stats: null },
      { week:  9, date: '2019-10-18', kickoff: '7:00pm',
        opponent: 'Corinth Holders', home: false, conference: true,
        result: { teamScore: 34, opponentScore: 7 }, booster: null, stats: null },
      { week: 10, date: '2019-10-25', kickoff: '7:00pm',
        opponent: 'Rolesville', home: true, conference: true, scouts: true, overtime: true,
        result: { teamScore: 31, opponentScore: 30 }, booster: null, stats: null },
      { week: 11, date: '2019-11-01', kickoff: '7:00pm',
        opponent: 'Wakefield', home: false, conference: true,
        result: { teamScore: 41, opponentScore: 24 }, booster: null, stats: null },
      { week: 12, date: '2019-11-08', kickoff: '7:00pm',
        opponent: 'Heritage', home: true, conference: true,
        result: { teamScore: 52, opponentScore: 26 }, booster: null, stats: null },
    ],

    /* Cooper Clark — Carlsbad High School */
    'cooper-clark': [
      { week:  1, date: '2019-08-23', kickoff: '7:00pm',
        opponent: 'Hart', home: true, conference: false,
        result: { teamScore: 58, opponentScore: 14 }, booster: null,
        stats: {
          carries: 21, rushingYards: 137, rushingTd: 3, rushingLong: 38,
          receptions: 4, receivingYards: 26, receivingYac: 9,
          receivingTd: 1, receivingLong: 12, targets: 6, fumbles: 0,
          rushingAvg: 6.5, receivingAvg: 6.5, totalYards: 163, totalTd: 4
        },
        bigPlays: [
          '38 yard rushing touchdown bomb',
          '12 yard receiving touchdown',
          '6 yard rushing touchdown',
          '1 yard rushing touchdown'
        ] },
      { week:  2, date: '2019-08-30', kickoff: '7:00pm',
        opponent: 'Millikan', home: false, conference: false,
        result: { teamScore: 52, opponentScore: 7 }, booster: null, stats: null },
      { week:  3, date: '2019-09-06', kickoff: '7:00pm',
        opponent: 'Lawndale', home: false, conference: false, scouts: true,
        result: { teamScore: 16, opponentScore: 35 }, booster: null, stats: null },
      { week:  4, date: '2019-09-13', kickoff: '7:00pm',
        opponent: 'Mission Hills', home: true, conference: true,
        result: { teamScore: 17, opponentScore: 7 }, booster: null, stats: null },
      { week:  5, date: '2019-09-20', kickoff: '7:00pm',
        opponent: 'San Marcos', home: true, conference: true,
        result: { teamScore: 28, opponentScore: 7 }, booster: null, stats: null },
      { week:  7, date: '2019-10-04', kickoff: '7:15pm',
        opponent: 'Torrey Pines', home: false, conference: true,
        result: { teamScore: 42, opponentScore: 7 }, booster: null, stats: null },
      { week:  8, date: '2019-10-11', kickoff: '7:00pm',
        opponent: 'Oceanside', home: false, conference: true, scouts: true,
        result: { teamScore: 22, opponentScore: 20 }, booster: null, stats: null },
      { week:  9, date: '2019-10-18', kickoff: '7:00pm',
        opponent: 'El Camino', home: true, conference: true,
        result: { teamScore: 28, opponentScore: 14 }, booster: null, stats: null },
      { week: 10, date: '2019-10-25', kickoff: '7:00pm',
        opponent: 'La Costa Canyon', home: false, conference: true, scouts: true,
        result: { teamScore: 14, opponentScore: 7 }, booster: null, stats: null },
      { week: 11, date: '2019-11-01', kickoff: '7:00pm',
        opponent: 'Vista', home: true, conference: false,
        result: { teamScore: 26, opponentScore: 14 }, booster: null, stats: null },
    ],

    /* Paxon Hatch — Bloomington High School */
    'paxon-hatch': [
      { week:  2, date: '2019-08-30', kickoff: '7:00pm',
        opponent: 'Danville', home: true, conference: true,
        result: { teamScore: 36, opponentScore: 0 }, booster: null, stats: null },
      { week:  3, date: '2019-09-07', kickoff: '1:00pm',
        opponent: 'Lincoln-Way Central', home: true, conference: false, scouts: true,
        result: { teamScore: 6, opponentScore: 46 }, booster: null, stats: null },
      { week:  4, date: '2019-09-13', kickoff: '7:00pm',
        opponent: 'Manual', home: false, conference: true,
        result: { teamScore: 28, opponentScore: 8 }, booster: null, stats: null },
      { week:  5, date: '2019-09-20', kickoff: '7:00pm',
        opponent: 'Normal West', home: true, conference: true,
        result: { teamScore: 16, opponentScore: 31 }, booster: null, stats: null },
      { week:  6, date: '2019-09-27', kickoff: '6:00pm',
        opponent: 'Urbana', home: true, conference: true,
        result: { teamScore: 58, opponentScore: 6 }, booster: null, stats: null },
      { week:  7, date: '2019-10-04', kickoff: '7:00pm',
        opponent: 'Normal Community', home: false, conference: true, scouts: true,
        result: { teamScore: 26, opponentScore: 43 }, booster: null, stats: null },
      { week:  8, date: '2019-10-12', kickoff: '7:00pm',
        opponent: 'Peoria Notre Dame', home: true, conference: true,
        result: { teamScore: 6, opponentScore: 20 }, booster: null, stats: null },
      { week:  9, date: '2019-10-18', kickoff: '7:00pm',
        opponent: 'Peoria', home: true, conference: true, scouts: true,
        result: { teamScore: 26, opponentScore: 42 }, booster: null, stats: null },
      { week: 10, date: '2019-10-25', kickoff: '7:00pm',
        opponent: 'Centennial', home: false, conference: true,
        result: { teamScore: 54, opponentScore: 6 }, booster: null, stats: null },
    ],

    /* Isaac Vitel — Bloomington High School */
    'isaac-vitel': [
      { week:  2, date: '2019-08-30', kickoff: '7:00pm',
        opponent: 'Danville', home: true, conference: true,
        result: { teamScore: 36, opponentScore: 0 }, booster: null, stats: null },
      { week:  3, date: '2019-09-07', kickoff: '1:00pm',
        opponent: 'Lincoln-Way Central', home: true, conference: false, scouts: true,
        result: { teamScore: 6, opponentScore: 46 }, booster: null, stats: null },
      { week:  4, date: '2019-09-13', kickoff: '7:00pm',
        opponent: 'Manual', home: false, conference: true,
        result: { teamScore: 28, opponentScore: 8 }, booster: null, stats: null },
      { week:  5, date: '2019-09-20', kickoff: '7:00pm',
        opponent: 'Normal West', home: true, conference: true,
        result: { teamScore: 16, opponentScore: 31 }, booster: null, stats: null },
      { week:  6, date: '2019-09-27', kickoff: '6:00pm',
        opponent: 'Urbana', home: true, conference: true,
        result: { teamScore: 58, opponentScore: 6 }, booster: null, stats: null },
      { week:  7, date: '2019-10-04', kickoff: '7:00pm',
        opponent: 'Normal Community', home: false, conference: true, scouts: true,
        result: { teamScore: 26, opponentScore: 43 }, booster: null, stats: null },
      { week:  8, date: '2019-10-12', kickoff: '7:00pm',
        opponent: 'Peoria Notre Dame', home: true, conference: true,
        result: { teamScore: 6, opponentScore: 20 }, booster: null, stats: null },
      { week:  9, date: '2019-10-18', kickoff: '7:00pm',
        opponent: 'Peoria', home: true, conference: true, scouts: true,
        result: { teamScore: 26, opponentScore: 42 }, booster: null, stats: null },
      { week: 10, date: '2019-10-25', kickoff: '7:00pm',
        opponent: 'Centennial', home: false, conference: true,
        result: { teamScore: 54, opponentScore: 6 }, booster: null, stats: null },
    ],

    /* Sam Stogsdill — Normal Community High School */
    'sam-stogsdill': [
      { week:  2, date: '2019-08-30', kickoff: '7:00pm',
        opponent: 'Richwoods', home: true, conference: true,
        result: { teamScore: 30, opponentScore: 7 }, booster: null, stats: null },
      { week:  3, date: '2019-09-06', kickoff: '7:00pm',
        opponent: 'Normal West', home: false, conference: true, scouts: true,
        result: { teamScore: 19, opponentScore: 14 }, booster: null, stats: null },
      { week:  4, date: '2019-09-13', kickoff: '7:00pm',
        opponent: 'Urbana', home: false, conference: true,
        result: { teamScore: 40, opponentScore: 0 }, booster: null, stats: null },
      { week:  5, date: '2019-09-20', kickoff: '7:00pm',
        opponent: 'Lapeer', home: false, conference: false, scouts: true,
        result: { teamScore: 8, opponentScore: 42 }, booster: null, stats: null },
      { week:  6, date: '2019-09-27', kickoff: '7:00pm',
        opponent: 'Manual', home: true, conference: true,
        result: { teamScore: 31, opponentScore: 6 }, booster: null, stats: null },
      { week:  7, date: '2019-10-04', kickoff: '7:00pm',
        opponent: 'Bloomington', home: true, conference: true,
        result: { teamScore: 43, opponentScore: 26 }, booster: null, stats: null },
      { week:  8, date: '2019-10-11', kickoff: '7:00pm',
        opponent: 'Danville', home: false, conference: true,
        result: { teamScore: 22, opponentScore: 19 }, booster: null, stats: null },
      { week:  9, date: '2019-10-18', kickoff: '7:00pm',
        opponent: 'Centennial', home: true, conference: true,
        result: { teamScore: 41, opponentScore: 13 }, booster: null, stats: null },
      { week: 10, date: '2019-10-25', kickoff: '7:00pm',
        opponent: 'Peoria', home: false, conference: true, scouts: true,
        result: { teamScore: 18, opponentScore: 32 }, booster: null, stats: null },
    ],

    /* Jaykeb Stewart — Naples High School */
    'jaykeb-stewart': [
      { week:  1, date: '2019-08-23', kickoff: '7:30pm',
        opponent: 'Riverview Sarasota', home: false, conference: false, scouts: true,
        result: { teamScore: 29, opponentScore: 28 }, booster: null,
        stats: {
          completions: 28, attempts: 45, passingYards: 385,
          passingYac: 233, passingTd: 3, interceptions: 1, carries: 1,
          rushingYards: 5, rushingTd: 0, rushingLong: 5, sacks: 1,
          fumbles: 0, passingAvg: 13.8, rating: 102.5, rushingAvg: 5
        },
        bigPlays: [
          '32 yard passing touchdown',
          '12 yard passing touchdown',
          '7 yard passing touchdown',
          '66 yard dot on third down'
        ] },
      { week:  2, date: '2019-08-30', kickoff: '7:30pm',
        opponent: 'Edison', home: true, conference: false, scouts: true,
        result: { teamScore: 17, opponentScore: 12 }, booster: null, stats: null },
      { week:  3, date: '2019-09-06', kickoff: '7:30pm',
        opponent: 'Monsignor Pace', home: true, conference: false, scouts: true,
        result: { teamScore: 38, opponentScore: 28 }, booster: null, stats: null },
      { week:  4, date: '2019-09-13', kickoff: '7:30pm',
        opponent: 'Palmetto Ridge', home: true, conference: true,
        result: { teamScore: 37, opponentScore: 0 }, booster: null, stats: null },
      { week:  5, date: '2019-09-20', kickoff: '7:30pm',
        opponent: 'Lehigh', home: true, conference: false,
        result: { teamScore: 23, opponentScore: 7 }, booster: null, stats: null },
      { week:  6, date: '2019-09-27', kickoff: '7:00pm',
        opponent: 'Barron Collier', home: false, conference: true,
        result: { teamScore: 49, opponentScore: 14 }, booster: null, stats: null },
      { week:  8, date: '2019-10-11', kickoff: '7:30pm',
        opponent: 'Lely', home: true, conference: true,
        result: { teamScore: 45, opponentScore: 0 }, booster: null, stats: null },
      { week:  9, date: '2019-10-18', kickoff: '7:00pm',
        opponent: 'Golden Gate', home: false, conference: true,
        result: { teamScore: 49, opponentScore: 14 }, booster: null, stats: null },
      { week: 10, date: '2019-10-25', kickoff: '7:00pm',
        opponent: 'Immokalee', home: false, conference: true,
        result: { teamScore: 36, opponentScore: 7 }, booster: null, stats: null },
    ],
  }
};
