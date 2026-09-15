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
        result: { teamScore: 28, opponentScore: 3 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 52, receivingYac: 6,
          receivingTd: 0, receivingLong: 13, targets: 9, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 2,
          receivingAvg: 10.4, totalYards: 52, totalTd: 0
        } },
      { week:  2, date: '2018-08-25', kickoff: '7:30pm',
        opponent: 'Richmond Senior', home: false, conference: false, scouts: true,
        result: { teamScore: 20, opponentScore: 17 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 44, receivingYac: 7,
          receivingTd: 1, receivingLong: 12, targets: 11, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 8.8, totalYards: 44, totalTd: 1
        } },
      { week:  3, date: '2018-09-04', kickoff: '6:00pm',
        opponent: 'Middle Creek', home: true, conference: false,
        result: { teamScore: 28, opponentScore: 14 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 71, receivingYac: 16,
          receivingTd: 2, receivingLong: 23, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 14.2, totalYards: 71, totalTd: 2
        } },
      { week:  4, date: '2018-09-08', kickoff: '7:00pm',
        opponent: 'Leesville Road', home: false, conference: false,
        result: { teamScore: 27, opponentScore: 13 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 88, receivingYac: 2,
          receivingTd: 2, receivingLong: 33, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 17.6, totalYards: 88, totalTd: 2
        } },
      { week:  5, date: '2018-09-15', kickoff: '7:00pm',
        opponent: 'Southern Nash', home: false, conference: false,
        result: { teamScore: 6, opponentScore: 21 }, booster: null,
        stats: {
          receptions: 3, receivingYards: 33, receivingYac: 10,
          receivingTd: 0, receivingLong: 18, targets: 4, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 11, totalYards: 33, totalTd: 0
        } },
      { week:  6, date: '2018-09-22', kickoff: '7:00pm',
        opponent: 'Franklinton', home: true, conference: false,
        result: { teamScore: 0, opponentScore: 28 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 49, receivingYac: 6,
          receivingTd: 0, receivingLong: 17, targets: 8, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 12.3, totalYards: 49, totalTd: 0
        } },
      { week:  8, date: '2018-10-06', kickoff: '7:00pm',
        opponent: 'Knightdale', home: true, conference: true,
        result: { teamScore: 10, opponentScore: 6 }, booster: null,
        stats: {
          receptions: 6, receivingYards: 86, receivingYac: 18,
          receivingTd: 0, receivingLong: 28, targets: 7, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 14.3, totalYards: 86, totalTd: 0
        } },
      { week:  9, date: '2018-10-13', kickoff: '7:00pm',
        opponent: 'Corinth Holders', home: false, conference: true, scouts: true,
        result: { teamScore: 17, opponentScore: 7 }, booster: null,
        stats: {
          receptions: 10, receivingYards: 103, receivingYac: 14,
          receivingTd: 1, receivingLong: 16, targets: 13, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 10.3, totalYards: 103, totalTd: 1
        } },
      { week: 10, date: '2018-10-20', kickoff: '7:00pm',
        opponent: 'Rolesville', home: true, conference: true,
        result: { teamScore: 9, opponentScore: 17 }, booster: null,
        stats: {
          receptions: 6, receivingYards: 80, receivingYac: 8,
          receivingTd: 0, receivingLong: 27, targets: 8, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 13.3, totalYards: 80, totalTd: 0
        } },
      { week: 11, date: '2018-10-27', kickoff: '7:00pm',
        opponent: 'Wakefield', home: false, conference: true,
        result: { teamScore: 14, opponentScore: 10 }, booster: null,
        stats: {
          receptions: 2, receivingYards: 19, receivingYac: 5,
          receivingTd: 1, receivingLong: 11, targets: 3, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 9.5, totalYards: 19, totalTd: 1
        } },
      { week: 12, date: '2018-11-03', kickoff: '7:00pm',
        opponent: 'Heritage', home: true, conference: true, scouts: true,
        result: { teamScore: 42, opponentScore: 3 }, booster: 'boost-2-0',
        stats: {
          receptions: 9, receivingYards: 107, receivingYac: 14,
          receivingTd: 1, receivingLong: 17, targets: 9, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 1,
          receivingAvg: 11.9, totalYards: 107, totalTd: 1
        } },
    ],

    /* Cooper Clark — Carlsbad High School */
    'cooper-clark': [
      { week:  2, date: '2018-08-25', kickoff: '7:00pm',
        opponent: 'Del Norte', home: true, conference: false,
        result: { teamScore: 21, opponentScore: 17 }, booster: null,
        stats: {
          carries: 14, rushingYards: 126, rushingTd: 1, rushingLong: 36,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 1, fumbles: 0,
          rushingAvg: 9, totalYards: 126, totalTd: 1
        } },
      { week:  3, date: '2018-09-01', kickoff: '7:00pm',
        opponent: 'St. Augustine', home: false, conference: false,
        result: { teamScore: 7, opponentScore: 10 }, booster: null,
        stats: {
          carries: 18, rushingYards: 118, rushingTd: 1, rushingLong: 41,
          receptions: 2, receivingYards: 20, receivingYac: 12,
          receivingTd: 0, receivingLong: 14, targets: 5, fumbles: 0,
          rushingAvg: 6.6, receivingAvg: 10, totalYards: 138, totalTd: 1
        } },
      { week:  4, date: '2018-09-08', kickoff: '7:00pm',
        opponent: 'Sweetwater', home: false, conference: false,
        result: { teamScore: 15, opponentScore: 7 }, booster: null,
        stats: {
          carries: 16, rushingYards: 77, rushingTd: 1, rushingLong: 30,
          receptions: 2, receivingYards: 13, receivingYac: 1,
          receivingTd: 0, receivingLong: 10, targets: 2, fumbles: 0,
          rushingAvg: 4.8, receivingAvg: 6.5, totalYards: 90, totalTd: 1
        } },
      { week:  5, date: '2018-09-15', kickoff: '7:00pm',
        opponent: 'Mission Hills', home: true, conference: true, scouts: true,
        result: { teamScore: 28, opponentScore: 6 }, booster: null,
        stats: {
          carries: 14, rushingYards: 59, rushingTd: 1, rushingLong: 19,
          receptions: 3, receivingYards: 24, receivingYac: 12,
          receivingTd: 1, receivingLong: 11, targets: 4, fumbles: 1,
          rushingAvg: 4.2, receivingAvg: 8, totalYards: 83, totalTd: 2
        } },
      { week:  6, date: '2018-09-22', kickoff: '7:00pm',
        opponent: 'La Costa Canyon', home: false, conference: true,
        result: { teamScore: 7, opponentScore: 17 }, booster: null,
        stats: {
          carries: 12, rushingYards: 43, rushingTd: 0, rushingLong: 10,
          receptions: 2, receivingYards: 11, receivingYac: 6,
          receivingTd: 1, receivingLong: 7, targets: 2, fumbles: 0,
          rushingAvg: 3.6, receivingAvg: 5.5, totalYards: 54, totalTd: 1
        } },
      { week:  8, date: '2018-10-06', kickoff: '7:00pm',
        opponent: 'Oceanside', home: false, conference: true,
        result: { teamScore: 10, opponentScore: 21 }, booster: null,
        stats: {
          carries: 13, rushingYards: 48, rushingTd: 1, rushingLong: 7,
          receptions: 2, receivingYards: 22, receivingYac: 12,
          receivingTd: 0, receivingLong: 11, targets: 4, fumbles: 1,
          rushingAvg: 3.7, receivingAvg: 11, totalYards: 70, totalTd: 1
        } },
      { week:  9, date: '2018-10-13', kickoff: '7:00pm',
        opponent: 'San Marcos', home: true, conference: true,
        result: { teamScore: 36, opponentScore: 34 }, booster: null,
        stats: {
          carries: 15, rushingYards: 48, rushingTd: 1, rushingLong: 7,
          receptions: 1, receivingYards: 17, receivingYac: 10,
          receivingTd: 0, receivingLong: 17, targets: 2, fumbles: 0,
          rushingAvg: 3.2, receivingAvg: 17, totalYards: 65, totalTd: 1
        } },
      { week: 10, date: '2018-10-20', kickoff: '7:00pm',
        opponent: 'Torrey Pines', home: true, conference: true, scouts: true,
        result: { teamScore: 41, opponentScore: 21 }, booster: 'boost-2-5',
        stats: {
          carries: 19, rushingYards: 159, rushingTd: 2, rushingLong: 37,
          receptions: 2, receivingYards: 43, receivingYac: 20,
          receivingTd: 1, receivingLong: 22, targets: 3, fumbles: 1,
          rushingAvg: 8.4, receivingAvg: 21.5, totalYards: 202, totalTd: 3
        } },
      { week: 11, date: '2018-10-27', kickoff: '7:00pm',
        opponent: 'El Camino', home: false, conference: true,
        result: { teamScore: 35, opponentScore: 17 }, booster: null,
        stats: {
          carries: 14, rushingYards: 96, rushingTd: 2, rushingLong: 35,
          receptions: 1, receivingYards: 11, receivingYac: 1,
          receivingTd: 0, receivingLong: 11, targets: 2, fumbles: 1,
          rushingAvg: 6.9, receivingAvg: 11, totalYards: 107, totalTd: 2
        } },
      { week: 12, date: '2018-11-03', kickoff: '7:00pm',
        opponent: 'Vista', home: true, conference: false,
        result: { teamScore: 9, opponentScore: 20 }, booster: null,
        stats: {
          carries: 16, rushingYards: 117, rushingTd: 0, rushingLong: 40,
          receptions: 3, receivingYards: 35, receivingYac: 8,
          receivingTd: 0, receivingLong: 17, targets: 3, fumbles: 0,
          rushingAvg: 7.3, receivingAvg: 11.7, totalYards: 152, totalTd: 0
        } },
    ],

    /* Paxon Hatch — Bloomington High School */
    'paxon-hatch': [
      { week:  2, date: '2018-08-25', kickoff: '7:00pm',
        opponent: 'Manual', home: true, conference: true,
        result: { teamScore: 14, opponentScore: 34 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 50, receivingYac: 10,
          receivingTd: 1, receivingLong: 15, targets: 8, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 10, totalYards: 50, totalTd: 1
        } },
      { week:  3, date: '2018-09-01', kickoff: '7:00pm',
        opponent: 'Normal Community', home: false, conference: true, scouts: true,
        result: { teamScore: 10, opponentScore: 13 }, booster: 'boost-1-5',
        stats: {
          receptions: 4, receivingYards: 45, receivingYac: 15,
          receivingTd: 1, receivingLong: 17, targets: 8, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 11.3, totalYards: 45, totalTd: 1
        } },
      { week:  4, date: '2018-09-08', kickoff: '7:00pm',
        opponent: 'Champaign Central', home: true, conference: true, scouts: true,
        result: { teamScore: 10, opponentScore: 27 }, booster: null,
        stats: {
          receptions: 3, receivingYards: 39, receivingYac: 2,
          receivingTd: 1, receivingLong: 29, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 13, totalYards: 39, totalTd: 1
        } },
      { week:  5, date: '2018-09-15', kickoff: '7:00pm',
        opponent: 'Kankakee', home: true, conference: false,
        result: { teamScore: 20, opponentScore: 28 }, booster: null,
        stats: {
          receptions: 2, receivingYards: 23, receivingYac: 2,
          receivingTd: 0, receivingLong: 12, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 11.5, totalYards: 23, totalTd: 0
        } },
      { week:  6, date: '2018-09-22', kickoff: '7:30pm',
        opponent: 'Peoria', home: false, conference: true, scouts: true,
        result: { teamScore: 7, opponentScore: 16 }, booster: null,
        stats: {
          receptions: 3, receivingYards: 20, receivingYac: 0,
          receivingTd: 0, receivingLong: 10, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 1,
          receivingAvg: 6.7, totalYards: 20, totalTd: 0
        } },
      { week:  7, date: '2018-09-29', kickoff: '7:00pm',
        opponent: 'Normal West', home: true, conference: true,
        result: { teamScore: 10, opponentScore: 9 }, booster: null,
        stats: {
          receptions: 2, receivingYards: 18, receivingYac: 7,
          receivingTd: 1, receivingLong: 11, targets: 3, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 1,
          receivingAvg: 9, totalYards: 18, totalTd: 1
        } },
      { week:  8, date: '2018-10-06', kickoff: '7:00pm',
        opponent: 'Richwoods', home: false, conference: true,
        result: { teamScore: 20, opponentScore: 0 }, booster: null,
        stats: {
          receptions: 1, receivingYards: 4, receivingYac: 0,
          receivingTd: 0, receivingLong: 4, targets: 4, carries: 1,
          rushingYards: 1, rushingTd: 0, rushingLong: 1, fumbles: 1,
          rushingAvg: 1, receivingAvg: 4, totalYards: 5, totalTd: 0
        } },
      { week:  9, date: '2018-10-13', kickoff: '7:00pm',
        opponent: 'Urbana', home: true, conference: true,
        result: { teamScore: 13, opponentScore: 0 }, booster: null,
        stats: {
          receptions: 3, receivingYards: 18, receivingYac: 3,
          receivingTd: 0, receivingLong: 7, targets: 5, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 6, totalYards: 18, totalTd: 0
        } },
      { week: 10, date: '2018-10-20', kickoff: '7:00pm',
        opponent: 'Danville', home: false, conference: true,
        result: { teamScore: 24, opponentScore: 15 }, booster: null,
        stats: {
          receptions: 1, receivingYards: 10, receivingYac: 3,
          receivingTd: 1, receivingLong: 10, targets: 3, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 1,
          receivingAvg: 10, totalYards: 10, totalTd: 1
        } },
    ],

    /* Isaac Vitel — no school yet, so no fixtures. */
    'isaac-vitel': [],

    /* Sam Stogsdill — Normal Community High School */
    'sam-stogsdill': [
      { week:  2, date: '2018-08-25', kickoff: '7:00pm',
        opponent: 'Urbana', home: false, conference: true,
        result: { teamScore: 0, opponentScore: 7 }, booster: null,
        stats: {
          carries: 13, rushingYards: 85, rushingTd: 0, rushingLong: 36,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 1, fumbles: 0,
          rushingAvg: 6.5, totalYards: 85, totalTd: 0
        } },
      { week:  3, date: '2018-09-01', kickoff: '7:00pm',
        opponent: 'Bloomington', home: true, conference: true, scouts: true,
        result: { teamScore: 13, opponentScore: 10 }, booster: 'boost-2-0',
        stats: {
          carries: 14, rushingYards: 86, rushingTd: 0, rushingLong: 26,
          receptions: 1, receivingYards: 12, receivingYac: 0,
          receivingTd: 0, receivingLong: 12, targets: 1, fumbles: 0,
          rushingAvg: 6.1, receivingAvg: 12, totalYards: 98, totalTd: 0
        } },
      { week:  4, date: '2018-09-08', kickoff: '7:00pm',
        opponent: 'Peoria Notre Dame', home: false, conference: true,
        result: { teamScore: 35, opponentScore: 3 }, booster: null,
        stats: {
          carries: 14, rushingYards: 55, rushingTd: 1, rushingLong: 6,
          receptions: 1, receivingYards: 7, receivingYac: 2,
          receivingTd: 1, receivingLong: 7, targets: 4, fumbles: 2,
          rushingAvg: 3.9, receivingAvg: 7, totalYards: 62, totalTd: 2
        } },
      { week:  5, date: '2018-09-15', kickoff: '7:00pm',
        opponent: 'Normal West', home: false, conference: true,
        result: { teamScore: 13, opponentScore: 10 }, booster: null,
        stats: {
          carries: 15, rushingYards: 98, rushingTd: 1, rushingLong: 33,
          receptions: 3, receivingYards: 28, receivingYac: 11,
          receivingTd: 0, receivingLong: 11, targets: 4, fumbles: 0,
          rushingAvg: 6.5, receivingAvg: 9.3, totalYards: 126, totalTd: 1
        } },
      { week:  6, date: '2018-09-22', kickoff: '7:00pm',
        opponent: 'Richwoods', home: true, conference: true,
        result: { teamScore: 17, opponentScore: 24 }, booster: null,
        stats: {
          carries: 18, rushingYards: 100, rushingTd: 0, rushingLong: 27,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 3, fumbles: 0,
          rushingAvg: 5.6, totalYards: 100, totalTd: 0
        } },
      { week:  7, date: '2018-09-29', kickoff: '7:00pm',
        opponent: 'Bradley-Bourbonnais', home: true, conference: false,
        result: { teamScore: 17, opponentScore: 3 }, booster: null,
        stats: {
          carries: 8, rushingYards: 28, rushingTd: 1, rushingLong: 6,
          receptions: 1, receivingYards: 12, receivingYac: 1,
          receivingTd: 0, receivingLong: 12, targets: 4, fumbles: 0,
          rushingAvg: 3.5, receivingAvg: 12, totalYards: 40, totalTd: 1
        } },
      { week:  8, date: '2018-10-06', kickoff: '7:00pm',
        opponent: 'Centennial', home: true, conference: true,
        result: { teamScore: 14, opponentScore: 13 }, booster: null,
        stats: {
          carries: 14, rushingYards: 54, rushingTd: 0, rushingLong: 20,
          receptions: 1, receivingYards: 3, receivingYac: 1,
          receivingTd: 1, receivingLong: 3, targets: 2, fumbles: 0,
          rushingAvg: 3.9, receivingAvg: 3, totalYards: 57, totalTd: 1
        } },
      { week:  9, date: '2018-10-13', kickoff: '7:00pm',
        opponent: 'Danville', home: true, conference: true,
        result: { teamScore: 10, opponentScore: 14 }, booster: null,
        stats: {
          carries: 12, rushingYards: 76, rushingTd: 1, rushingLong: 34,
          receptions: 1, receivingYards: 16, receivingYac: 5,
          receivingTd: 0, receivingLong: 16, targets: 3, fumbles: 0,
          rushingAvg: 6.3, receivingAvg: 16, totalYards: 92, totalTd: 1
        } },
      { week: 10, date: '2018-10-20', kickoff: '7:00pm',
        opponent: 'Champaign Central', home: false, conference: true, scouts: true,
        result: { teamScore: 13, opponentScore: 14 }, booster: null,
        stats: {
          carries: 10, rushingYards: 27, rushingTd: 0, rushingLong: 16,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 2, fumbles: 0,
          rushingAvg: 2.7, totalYards: 27, totalTd: 0
        } },
    ],

    /* Jaykeb Stewart — Naples High School */
    'jaykeb-stewart': [
      { week:  2, date: '2018-08-25', kickoff: '7:30pm',
        opponent: 'Edison', home: true, conference: false,
        result: { teamScore: 34, opponentScore: 7 }, booster: null,
        stats: {
          completions: 9, attempts: 18, passingYards: 118, passingYac: 33,
          passingTd: 2, interceptions: 0, carries: 4, rushingYards: 35,
          rushingTd: 0, rushingLong: 29, sacks: 4, fumbles: 0,
          passingAvg: 13.1, rating: 108.1, rushingAvg: 8.8
        } },
      { week:  3, date: '2018-09-01', kickoff: '7:30pm',
        opponent: 'Palmetto', home: true, conference: false,
        result: { teamScore: 34, opponentScore: 23 }, booster: null,
        stats: {
          completions: 13, attempts: 25, passingYards: 180,
          passingYac: 25, passingTd: 2, interceptions: 2, carries: 4,
          rushingYards: 12, rushingTd: 1, rushingLong: 6, sacks: 2,
          fumbles: 0, passingAvg: 13.8, rating: 68.8, rushingAvg: 3
        } },
      { week:  7, date: '2018-09-28', kickoff: '7:30pm',
        opponent: 'Palmetto Ridge', home: true, conference: true, scouts: true,
        result: { teamScore: 35, opponentScore: 27 }, booster: null,
        stats: {
          completions: 14, attempts: 19, passingYards: 200,
          passingYac: 27, passingTd: 3, interceptions: 1, carries: 4,
          rushingYards: 24, rushingTd: 0, rushingLong: 10, sacks: 1,
          fumbles: 0, passingAvg: 14.3, rating: 125, rushingAvg: 6
        } },
      { week:  8, date: '2018-10-06', kickoff: '7:30pm',
        opponent: 'Lely', home: true, conference: false,
        result: { teamScore: 21, opponentScore: 12 }, booster: null,
        stats: {
          completions: 20, attempts: 27, passingYards: 298,
          passingYac: 72, passingTd: 2, interceptions: 2, carries: 4,
          rushingYards: 7, rushingTd: 0, rushingLong: 5, sacks: 0,
          fumbles: 1, passingAvg: 14.9, rating: 103.6, rushingAvg: 1.8
        } },
      { week:  9, date: '2018-10-13', kickoff: '7:00pm',
        opponent: 'Golden Gate', home: false, conference: true,
        result: { teamScore: 17, opponentScore: 31 }, booster: 'boost-1-5',
        stats: {
          completions: 12, attempts: 22, passingYards: 187,
          passingYac: 43, passingTd: 2, interceptions: 0, carries: 2,
          rushingYards: 2, rushingTd: 0, rushingLong: 4, sacks: 0,
          fumbles: 1, passingAvg: 15.6, rating: 113.3, rushingAvg: 1
        } },
      { week: 10, date: '2018-10-20', kickoff: '7:30pm',
        opponent: 'South Fort Myers', home: false, conference: false,
        result: { teamScore: 20, opponentScore: 14 }, booster: null,
        stats: {
          completions: 9, attempts: 16, passingYards: 158, passingYac: 23,
          passingTd: 3, interceptions: 0, carries: 2, rushingYards: 4,
          rushingTd: 0, rushingLong: 2, sacks: 1, fumbles: 1,
          passingAvg: 17.6, rating: 129.7, rushingAvg: 2
        } },
      { week: 11, date: '2018-10-27', kickoff: '7:00pm',
        opponent: 'Barron Collier', home: false, conference: true, scouts: true,
        result: { teamScore: 10, opponentScore: 20 }, booster: null,
        stats: {
          completions: 5, attempts: 15, passingYards: 70, passingYac: 20,
          passingTd: 0, interceptions: 0, carries: 4, rushingYards: 32,
          rushingTd: 0, rushingLong: 25, sacks: 2, fumbles: 0,
          passingAvg: 14, rating: 49.3, rushingAvg: 8
        } },
      { week: 12, date: '2018-11-03', kickoff: '7:30pm',
        opponent: 'Piper', home: true, conference: false,
        result: { teamScore: 35, opponentScore: 3 }, booster: null,
        stats: {
          completions: 16, attempts: 27, passingYards: 305,
          passingYac: 62, passingTd: 4, interceptions: 0, carries: 3,
          rushingYards: 10, rushingTd: 0, rushingLong: 6, sacks: 1,
          fumbles: 0, passingAvg: 19.1, rating: 138.1, rushingAvg: 3.3
        } },
    ],
  }
};
