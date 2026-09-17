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
      { week:  1, date: '2018-08-17', kickoff: '7:00pm',
        opponent: 'Millbrook', home: false, conference: false,
        result: { teamScore: 51, opponentScore: 0 }, booster: null,
        stats: {
          receptions: 3, receivingYards: 25, receivingYac: 7,
          receivingTd: 1, receivingLong: 17, targets: 4, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 8.3, totalYards: 25, totalTd: 1
        } },
      { week:  2, date: '2018-08-24', kickoff: '7:00pm',
        opponent: 'Richmond Senior', home: true, conference: false, scouts: true,
        result: { teamScore: 49, opponentScore: 28 }, booster: null,
        stats: {
          receptions: 7, receivingYards: 91, receivingYac: 19,
          receivingTd: 1, receivingLong: 21, targets: 10, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 1,
          receivingAvg: 13, totalYards: 91, totalTd: 1
        } },
      { week:  3, date: '2018-08-31', kickoff: '7:00pm',
        opponent: 'Middle Creek', home: false, conference: false,
        result: { teamScore: 22, opponentScore: 9 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 58, receivingYac: 14,
          receivingTd: 0, receivingLong: 32, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 14.5, totalYards: 58, totalTd: 0
        } },
      { week:  4, date: '2018-09-07', kickoff: '7:00pm',
        opponent: 'Leesville Road', home: true, conference: false,
        result: { teamScore: 31, opponentScore: 18 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 81, receivingYac: 31,
          receivingTd: 0, receivingLong: 26, targets: 9, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 16.2, totalYards: 81, totalTd: 0
        } },
      { week:  6, date: '2018-09-21', kickoff: '7:30pm',
        opponent: 'Franklinton', home: false, conference: false,
        result: { teamScore: 42, opponentScore: 7 }, booster: null,
        stats: {
          receptions: 6, receivingYards: 56, receivingYac: 11,
          receivingTd: 0, receivingLong: 20, targets: 8, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 9.3, totalYards: 56, totalTd: 0
        } },
      { week:  8, date: '2018-10-05', kickoff: '7:00pm',
        opponent: 'Knightdale', home: false, conference: true,
        result: { teamScore: 55, opponentScore: 14 }, booster: null,
        stats: {
          receptions: 3, receivingYards: 27, receivingYac: 6,
          receivingTd: 2, receivingLong: 23, targets: 5, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 9, totalYards: 27, totalTd: 2
        } },
      { week: 10, date: '2018-10-19', kickoff: '7:00pm',
        opponent: 'Rolesville', home: false, conference: true, scouts: true,
        result: { teamScore: 24, opponentScore: 7 }, booster: null,
        stats: {
          receptions: 3, receivingYards: 38, receivingYac: 9,
          receivingTd: 0, receivingLong: 23, targets: 5, carries: 1,
          rushingYards: 5, rushingTd: 0, rushingLong: 5, fumbles: 0,
          rushingAvg: 5, receivingAvg: 12.7, totalYards: 43, totalTd: 0
        } },
      { week: 11, date: '2018-10-25', kickoff: '7:00pm',
        opponent: 'Wakefield', home: true, conference: true,
        result: { teamScore: 42, opponentScore: 0 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 46, receivingYac: 11,
          receivingTd: 0, receivingLong: 23, targets: 7, carries: 1,
          rushingYards: 3, rushingTd: 0, rushingLong: 3, fumbles: 0,
          rushingAvg: 3, receivingAvg: 9.2, totalYards: 49, totalTd: 0
        } },
      { week: 12, date: '2018-11-02', kickoff: '7:00pm',
        opponent: 'Heritage', home: false, conference: true,
        result: { teamScore: 38, opponentScore: 2 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 43, receivingYac: 11,
          receivingTd: 1, receivingLong: 26, targets: 7, carries: 1,
          rushingYards: 4, rushingTd: 1, rushingLong: 4, fumbles: 1,
          rushingAvg: 4, receivingAvg: 10.8, totalYards: 47, totalTd: 2
        } },
      { week: 13, date: '2018-11-09', kickoff: '7:00pm',
        opponent: 'Corinth Holders', home: true, conference: true, scouts: true,
        result: { teamScore: 70, opponentScore: 7 }, booster: null,
        stats: {
          receptions: 3, receivingYards: 35, receivingYac: 10,
          receivingTd: 0, receivingLong: 21, targets: 5, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 11.7, totalYards: 35, totalTd: 0
        } },
    ],

    /* Cooper Clark — Carlsbad High School */
    'cooper-clark': [
      { week:  1, date: '2018-08-17', kickoff: '7:00pm',
        opponent: 'Steele Canyon', home: true, conference: false,
        result: { teamScore: 39, opponentScore: 7 }, booster: null,
        stats: {
          carries: 13, rushingYards: 56, rushingTd: 0, rushingLong: 16,
          receptions: 4, receivingYards: 46, receivingYac: 26,
          receivingTd: 1, receivingLong: 30, targets: 6, fumbles: 0,
          rushingAvg: 4.3, receivingAvg: 11.5, totalYards: 102, totalTd: 1
        } },
      { week:  2, date: '2018-08-24', kickoff: '7:00pm',
        opponent: 'Desert Vista', home: true, conference: false,
        result: { teamScore: 21, opponentScore: 33 }, booster: null,
        stats: {
          carries: 8, rushingYards: 45, rushingTd: 0, rushingLong: 13,
          receptions: 4, receivingYards: 39, receivingYac: 23,
          receivingTd: 0, receivingLong: 22, targets: 5, fumbles: 0,
          rushingAvg: 5.6, receivingAvg: 9.8, totalYards: 84, totalTd: 0
        } },
      { week:  3, date: '2018-08-31', kickoff: '7:00pm',
        opponent: 'Sweetwater', home: true, conference: false,
        result: { teamScore: 44, opponentScore: 0 }, booster: null,
        stats: {
          carries: 16, rushingYards: 89, rushingTd: 0, rushingLong: 18,
          receptions: 5, receivingYards: 52, receivingYac: 25,
          receivingTd: 0, receivingLong: 15, targets: 6, fumbles: 0,
          rushingAvg: 5.6, receivingAvg: 10.4, totalYards: 141, totalTd: 0
        } },
      { week:  4, date: '2018-09-07', kickoff: '7:00pm',
        opponent: 'Mission Hills', home: false, conference: true, scouts: true,
        result: { teamScore: 44, opponentScore: 29 }, booster: null,
        stats: {
          carries: 14, rushingYards: 121, rushingTd: 1, rushingLong: 52,
          receptions: 2, receivingYards: 19, receivingYac: 9,
          receivingTd: 1, receivingLong: 19, targets: 3, fumbles: 0,
          rushingAvg: 8.6, receivingAvg: 9.5, totalYards: 140, totalTd: 2
        } },
      { week:  5, date: '2018-09-14', kickoff: '7:15pm',
        opponent: 'San Marcos', home: false, conference: true,
        result: { teamScore: 35, opponentScore: 24 }, booster: null,
        stats: {
          carries: 10, rushingYards: 37, rushingTd: 1, rushingLong: 12,
          receptions: 5, receivingYards: 44, receivingYac: 24,
          receivingTd: 1, receivingLong: 14, targets: 7, fumbles: 0,
          rushingAvg: 3.7, receivingAvg: 8.8, totalYards: 81, totalTd: 2
        } },
      { week:  7, date: '2018-09-28', kickoff: '7:00pm',
        opponent: 'Torrey Pines', home: true, conference: true,
        result: { teamScore: 28, opponentScore: 35 }, booster: null,
        stats: {
          carries: 16, rushingYards: 53, rushingTd: 0, rushingLong: 13,
          receptions: 3, receivingYards: 24, receivingYac: 13,
          receivingTd: 0, receivingLong: 18, targets: 4, fumbles: 0,
          rushingAvg: 3.3, receivingAvg: 8, totalYards: 77, totalTd: 0
        } },
      { week:  8, date: '2018-10-05', kickoff: '7:00pm',
        opponent: 'Oceanside', home: true, conference: true,
        result: { teamScore: 23, opponentScore: 21 }, booster: null,
        stats: {
          carries: 17, rushingYards: 74, rushingTd: 1, rushingLong: 10,
          receptions: 3, receivingYards: 23, receivingYac: 13,
          receivingTd: 0, receivingLong: 15, targets: 4, fumbles: 0,
          rushingAvg: 4.4, receivingAvg: 7.7, totalYards: 97, totalTd: 1
        } },
      { week: 10, date: '2018-10-19', kickoff: '7:00pm',
        opponent: 'La Costa Canyon', home: true, conference: true, scouts: true,
        result: { teamScore: 24, opponentScore: 7 }, booster: null,
        stats: {
          carries: 12, rushingYards: 46, rushingTd: 0, rushingLong: 13,
          receptions: 3, receivingYards: 39, receivingYac: 24,
          receivingTd: 0, receivingLong: 19, targets: 4, fumbles: 0,
          rushingAvg: 3.8, receivingAvg: 13, totalYards: 85, totalTd: 0
        } },
      { week: 11, date: '2018-10-26', kickoff: '7:00pm',
        opponent: 'Vista', home: false, conference: false,
        result: { teamScore: 28, opponentScore: 0 }, booster: null,
        stats: {
          carries: 14, rushingYards: 56, rushingTd: 0, rushingLong: 12,
          receptions: 5, receivingYards: 38, receivingYac: 25,
          receivingTd: 0, receivingLong: 12, targets: 7, fumbles: 0,
          rushingAvg: 4, receivingAvg: 7.6, totalYards: 94, totalTd: 0
        } },
    ],

    /* Paxon Hatch — Bloomington High School */
    'paxon-hatch': [
      { week:  2, date: '2018-08-24', kickoff: '7:00pm',
        opponent: 'Danville', home: false, conference: true,
        result: { teamScore: 21, opponentScore: 12 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 84, receivingYac: 31,
          receivingTd: 0, receivingLong: 26, targets: 7, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 16.8, totalYards: 84, totalTd: 0
        } },
      { week:  3, date: '2018-09-01', kickoff: '12:00pm',
        opponent: 'Rich East', home: false, conference: false,
        result: { teamScore: 30, opponentScore: 7 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 109, receivingYac: 33,
          receivingTd: 1, receivingLong: 44, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 21.8, totalYards: 109, totalTd: 1
        } },
      { week:  4, date: '2018-09-07', kickoff: '7:00pm',
        opponent: 'Manual', home: true, conference: true,
        result: { teamScore: 50, opponentScore: 0 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 72, receivingYac: 27,
          receivingTd: 1, receivingLong: 33, targets: 7, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 18, totalYards: 72, totalTd: 1
        } },
      { week:  5, date: '2018-09-14', kickoff: '7:00pm',
        opponent: 'Normal West', home: false, conference: true,
        result: { teamScore: 14, opponentScore: 17 }, booster: null,
        stats: {
          receptions: 6, receivingYards: 83, receivingYac: 18,
          receivingTd: 0, receivingLong: 20, targets: 9, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 13.8, totalYards: 83, totalTd: 0
        } },
      { week:  6, date: '2018-09-22', kickoff: '4:00pm',
        opponent: 'Urbana', home: true, conference: true,
        result: { teamScore: 47, opponentScore: 12 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 84, receivingYac: 34,
          receivingTd: 1, receivingLong: 41, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 21, totalYards: 84, totalTd: 1
        } },
      { week:  7, date: '2018-09-28', kickoff: '7:00pm',
        opponent: 'Normal Community', home: true, conference: true, scouts: true,
        result: { teamScore: 28, opponentScore: 49 }, booster: null,
        stats: {
          receptions: 3, receivingYards: 66, receivingYac: 25,
          receivingTd: 1, receivingLong: 36, targets: 4, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 1,
          receivingAvg: 22, totalYards: 66, totalTd: 1
        } },
      { week:  8, date: '2018-10-05', kickoff: '7:00pm',
        opponent: 'Peoria Notre Dame', home: true, conference: true,
        result: { teamScore: 56, opponentScore: 28 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 72, receivingYac: 16,
          receivingTd: 1, receivingLong: 36, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 14.4, totalYards: 72, totalTd: 1
        } },
      { week:  9, date: '2018-10-12', kickoff: '7:00pm',
        opponent: 'Peoria', home: false, conference: true,
        result: { teamScore: 51, opponentScore: 40 }, booster: null,
        stats: {
          receptions: 3, receivingYards: 53, receivingYac: 11,
          receivingTd: 2, receivingLong: 44, targets: 7, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 17.7, totalYards: 53, totalTd: 2
        } },
      { week: 10, date: '2018-10-19', kickoff: '7:00pm',
        opponent: 'Centennial', home: true, conference: true,
        result: { teamScore: 41, opponentScore: 0 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 85, receivingYac: 33,
          receivingTd: 0, receivingLong: 39, targets: 7, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 21.3, totalYards: 85, totalTd: 0
        } },
    ],

    /* Isaac Vitel — Bloomington High School */
    'isaac-vitel': [
      { week:  2, date: '2018-08-24', kickoff: '7:00pm',
        opponent: 'Danville', home: false, conference: true,
        result: { teamScore: 21, opponentScore: 12 }, booster: null,
        stats: {
          completions: 12, attempts: 24, passingYards: 194,
          passingYac: 31, passingTd: 1, interceptions: 2, carries: 2,
          rushingYards: 7, rushingTd: 0, rushingLong: 7, sacks: 3,
          fumbles: 0, passingAvg: 16.2, rating: 56.6, rushingAvg: 3.5
        } },
      { week:  3, date: '2018-09-01', kickoff: '12:00pm',
        opponent: 'Rich East', home: false, conference: false,
        result: { teamScore: 30, opponentScore: 7 }, booster: null,
        stats: {
          completions: 18, attempts: 30, passingYards: 292,
          passingYac: 89, passingTd: 3, interceptions: 1, carries: 3,
          rushingYards: 11, rushingTd: 0, rushingLong: 11, sacks: 3,
          fumbles: 0, passingAvg: 16.2, rating: 112.1, rushingAvg: 3.7
        } },
      { week:  4, date: '2018-09-07', kickoff: '7:00pm',
        opponent: 'Manual', home: true, conference: true,
        result: { teamScore: 50, opponentScore: 0 }, booster: null,
        stats: {
          completions: 10, attempts: 22, passingYards: 172,
          passingYac: 29, passingTd: 4, interceptions: 1, carries: 2,
          rushingYards: 3, rushingTd: 1, rushingLong: 3, sacks: 0,
          fumbles: 0, passingAvg: 17.2, rating: 93.2, rushingAvg: 1.5
        } },
      { week:  5, date: '2018-09-14', kickoff: '7:00pm',
        opponent: 'Normal West', home: false, conference: true,
        result: { teamScore: 14, opponentScore: 17 }, booster: null,
        stats: {
          completions: 15, attempts: 32, passingYards: 274,
          passingYac: 60, passingTd: 0, interceptions: 2, carries: 5,
          rushingYards: 14, rushingTd: 0, rushingLong: 11, sacks: 3,
          fumbles: 0, passingAvg: 18.3, rating: 50.8, rushingAvg: 2.8
        } },
      { week:  6, date: '2018-09-22', kickoff: '4:00pm',
        opponent: 'Urbana', home: true, conference: true,
        result: { teamScore: 47, opponentScore: 12 }, booster: null,
        stats: {
          completions: 13, attempts: 26, passingYards: 223,
          passingYac: 62, passingTd: 2, interceptions: 2, carries: 2,
          rushingYards: 4, rushingTd: 0, rushingLong: 4, sacks: 3,
          fumbles: 0, passingAvg: 17.2, rating: 73.1, rushingAvg: 2
        } },
      { week:  7, date: '2018-09-28', kickoff: '7:00pm',
        opponent: 'Normal Community', home: true, conference: true, scouts: true,
        result: { teamScore: 28, opponentScore: 49 }, booster: null,
        stats: {
          completions: 10, attempts: 17, passingYards: 152,
          passingYac: 40, passingTd: 2, interceptions: 1, carries: 2,
          rushingYards: 9, rushingTd: 0, rushingLong: 9, sacks: 1,
          fumbles: 0, passingAvg: 15.2, rating: 103.1, rushingAvg: 4.5
        } },
      { week:  8, date: '2018-10-05', kickoff: '7:00pm',
        opponent: 'Peoria Notre Dame', home: true, conference: true,
        result: { teamScore: 56, opponentScore: 28 }, booster: null,
        stats: {
          completions: 10, attempts: 21, passingYards: 155,
          passingYac: 24, passingTd: 2, interceptions: 2, carries: 4,
          rushingYards: 5, rushingTd: 0, rushingLong: 5, sacks: 2,
          fumbles: 0, passingAvg: 15.5, rating: 64.7, rushingAvg: 1.3
        } },
      { week:  9, date: '2018-10-12', kickoff: '7:00pm',
        opponent: 'Peoria', home: false, conference: true, scouts: true,
        result: { teamScore: 51, opponentScore: 40 }, booster: null,
        stats: {
          completions: 10, attempts: 20, passingYards: 155,
          passingYac: 46, passingTd: 3, interceptions: 1, carries: 4,
          rushingYards: 6, rushingTd: 1, rushingLong: 3, sacks: 0,
          fumbles: 0, passingAvg: 15.5, rating: 94.8, rushingAvg: 1.5
        } },
      { week: 10, date: '2018-10-19', kickoff: '7:00pm',
        opponent: 'Centennial', home: true, conference: true,
        result: { teamScore: 41, opponentScore: 0 }, booster: null,
        stats: {
          completions: 10, attempts: 21, passingYards: 183,
          passingYac: 30, passingTd: 1, interceptions: 1, carries: 4,
          rushingYards: 4, rushingTd: 0, rushingLong: 4, sacks: 0,
          fumbles: 0, passingAvg: 18.3, rating: 74.1, rushingAvg: 1
        } },
    ],

    /* Sam Stogsdill — Normal Community High School */
    'sam-stogsdill': [
      { week:  2, date: '2018-08-24', kickoff: '7:00pm',
        opponent: 'Richwoods', home: false, conference: true,
        result: { teamScore: 43, opponentScore: 7 }, booster: null,
        stats: {
          carries: 25, rushingYards: 151, rushingTd: 1, rushingLong: 18,
          receptions: 1, receivingYards: 5, receivingYac: 3,
          receivingTd: 0, receivingLong: 5, targets: 2, fumbles: 0,
          rushingAvg: 6, receivingAvg: 5, totalYards: 156, totalTd: 1
        } },
      { week:  3, date: '2018-08-31', kickoff: '7:00pm',
        opponent: 'Normal West', home: true, conference: true,
        result: { teamScore: 49, opponentScore: 27 }, booster: null,
        stats: {
          carries: 28, rushingYards: 183, rushingTd: 2, rushingLong: 14,
          receptions: 1, receivingYards: 8, receivingYac: 6,
          receivingTd: 0, receivingLong: 8, targets: 2, fumbles: 0,
          rushingAvg: 6.5, receivingAvg: 8, totalYards: 191, totalTd: 2
        } },
      { week:  4, date: '2018-09-07', kickoff: '7:00pm',
        opponent: 'Urbana', home: true, conference: true,
        result: { teamScore: 49, opponentScore: 6 }, booster: null,
        stats: {
          carries: 23, rushingYards: 145, rushingTd: 1, rushingLong: 12,
          receptions: 1, receivingYards: 10, receivingYac: 6,
          receivingTd: 1, receivingLong: 10, targets: 2, fumbles: 0,
          rushingAvg: 6.3, receivingAvg: 10, totalYards: 155, totalTd: 2
        } },
      { week:  5, date: '2018-09-14', kickoff: '7:00pm',
        opponent: 'Neuqua Valley', home: true, conference: false,
        result: { teamScore: 35, opponentScore: 36 }, booster: null,
        stats: {
          carries: 20, rushingYards: 80, rushingTd: 0, rushingLong: 13,
          receptions: 1, receivingYards: 10, receivingYac: 7,
          receivingTd: 1, receivingLong: 10, targets: 1, fumbles: 0,
          rushingAvg: 4, receivingAvg: 10, totalYards: 90, totalTd: 1
        } },
      { week:  6, date: '2018-09-21', kickoff: '7:00pm',
        opponent: 'Manual', home: false, conference: true,
        result: { teamScore: 48, opponentScore: 8 }, booster: null,
        stats: {
          carries: 21, rushingYards: 118, rushingTd: 2, rushingLong: 14,
          receptions: 1, receivingYards: 10, receivingYac: 8,
          receivingTd: 0, receivingLong: 10, targets: 1, fumbles: 0,
          rushingAvg: 5.6, receivingAvg: 10, totalYards: 128, totalTd: 2
        } },
      { week:  7, date: '2018-09-28', kickoff: '7:00pm',
        opponent: 'Bloomington', home: false, conference: true, scouts: true,
        result: { teamScore: 49, opponentScore: 28 }, booster: null,
        stats: {
          carries: 16, rushingYards: 69, rushingTd: 1, rushingLong: 16,
          receptions: 2, receivingYards: 10, receivingYac: 8,
          receivingTd: 1, receivingLong: 10, targets: 3, fumbles: 0,
          rushingAvg: 4.3, receivingAvg: 5, totalYards: 79, totalTd: 2
        } },
      { week:  8, date: '2018-10-05', kickoff: '7:00pm',
        opponent: 'Danville', home: true, conference: true,
        result: { teamScore: 36, opponentScore: 8 }, booster: null,
        stats: {
          carries: 23, rushingYards: 150, rushingTd: 1, rushingLong: 15,
          receptions: 1, receivingYards: 7, receivingYac: 5,
          receivingTd: 0, receivingLong: 7, targets: 1, fumbles: 0,
          rushingAvg: 6.5, receivingAvg: 7, totalYards: 157, totalTd: 1
        } },
      { week:  9, date: '2018-10-12', kickoff: '7:00pm',
        opponent: 'Centennial', home: false, conference: true,
        result: { teamScore: 35, opponentScore: 7 }, booster: null,
        stats: {
          carries: 26, rushingYards: 141, rushingTd: 0, rushingLong: 14,
          receptions: 1, receivingYards: 4, receivingYac: 2,
          receivingTd: 0, receivingLong: 4, targets: 1, fumbles: 0,
          rushingAvg: 5.4, receivingAvg: 4, totalYards: 145, totalTd: 0
        } },
      { week: 10, date: '2018-10-19', kickoff: '7:00pm',
        opponent: 'Peoria', home: true, conference: true, scouts: true,
        result: { teamScore: 61, opponentScore: 14 }, booster: null,
        stats: {
          carries: 22, rushingYards: 131, rushingTd: 0, rushingLong: 12,
          receptions: 1, receivingYards: 10, receivingYac: 8,
          receivingTd: 0, receivingLong: 10, targets: 1, fumbles: 0,
          rushingAvg: 6, receivingAvg: 10, totalYards: 141, totalTd: 0
        } },
    ],

    /* Jaykeb Stewart — Naples High School */
    'jaykeb-stewart': [
      { week:  2, date: '2018-08-24', kickoff: '7:30pm',
        opponent: 'Edison', home: true, conference: false,
        result: { teamScore: 30, opponentScore: 18 }, booster: null,
        stats: {
          completions: 10, attempts: 17, passingYards: 118,
          passingYac: 48, passingTd: 2, interceptions: 0, carries: 5,
          rushingYards: 24, rushingTd: 1, rushingLong: 19, sacks: 0,
          fumbles: 0, passingAvg: 11.8, rating: 119.2, rushingAvg: 4.8
        } },
      { week:  3, date: '2018-08-31', kickoff: '7:30pm',
        opponent: 'Palmetto', home: true, conference: false,
        result: { teamScore: 17, opponentScore: 26 }, booster: null,
        stats: {
          completions: 8, attempts: 12, passingYards: 110, passingYac: 48,
          passingTd: 1, interceptions: 0, carries: 6, rushingYards: 33,
          rushingTd: 1, rushingLong: 20, sacks: 3, fumbles: 1,
          passingAvg: 13.8, rating: 123.6, rushingAvg: 5.5
        } },
      { week:  5, date: '2018-09-14', kickoff: '7:00pm',
        opponent: 'Gulf Coast', home: false, conference: false,
        result: { teamScore: 51, opponentScore: 0 }, booster: null,
        stats: {
          completions: 15, attempts: 25, passingYards: 166,
          passingYac: 72, passingTd: 4, interceptions: 1, carries: 3,
          rushingYards: 16, rushingTd: 0, rushingLong: 16, sacks: 3,
          fumbles: 0, passingAvg: 11.1, rating: 102.7, rushingAvg: 5.3
        } },
      { week:  6, date: '2018-09-21', kickoff: '7:30pm',
        opponent: 'Immokalee', home: true, conference: false, scouts: true,
        result: { teamScore: 48, opponentScore: 17 }, booster: null,
        stats: {
          completions: 13, attempts: 18, passingYards: 173,
          passingYac: 53, passingTd: 2, interceptions: 1, carries: 3,
          rushingYards: 9, rushingTd: 0, rushingLong: 8, sacks: 3,
          fumbles: 0, passingAvg: 13.3, rating: 116.2, rushingAvg: 3
        } },
      { week:  7, date: '2018-09-28', kickoff: '7:00pm',
        opponent: 'Palmetto Ridge', home: false, conference: true,
        result: { teamScore: 42, opponentScore: 0 }, booster: null,
        stats: {
          completions: 12, attempts: 18, passingYards: 159,
          passingYac: 48, passingTd: 3, interceptions: 1, carries: 5,
          rushingYards: 22, rushingTd: 0, rushingLong: 8, sacks: 0,
          fumbles: 0, passingAvg: 13.3, rating: 110.9, rushingAvg: 4.4
        } },
      { week:  8, date: '2018-10-05', kickoff: '7:00pm',
        opponent: 'Lely', home: false, conference: false,
        result: { teamScore: 45, opponentScore: 0 }, booster: null,
        stats: {
          completions: 11, attempts: 18, passingYards: 134,
          passingYac: 58, passingTd: 3, interceptions: 1, carries: 4,
          rushingYards: 11, rushingTd: 0, rushingLong: 11, sacks: 3,
          fumbles: 0, passingAvg: 12.2, rating: 100.5, rushingAvg: 2.8
        } },
      { week:  9, date: '2018-10-12', kickoff: '7:30pm',
        opponent: 'Golden Gate', home: true, conference: true,
        result: { teamScore: 31, opponentScore: 10 }, booster: null,
        stats: {
          completions: 10, attempts: 17, passingYards: 134,
          passingYac: 50, passingTd: 2, interceptions: 1, carries: 6,
          rushingYards: 14, rushingTd: 1, rushingLong: 8, sacks: 3,
          fumbles: 1, passingAvg: 13.4, rating: 98.7, rushingAvg: 2.3
        } },
      { week: 10, date: '2018-10-19', kickoff: '7:30pm',
        opponent: 'South Fort Myers', home: true, conference: false,
        result: { teamScore: 63, opponentScore: 0 }, booster: null,
        stats: {
          completions: 16, attempts: 23, passingYards: 241,
          passingYac: 91, passingTd: 1, interceptions: 1, carries: 7,
          rushingYards: 20, rushingTd: 1, rushingLong: 6, sacks: 2,
          fumbles: 1, passingAvg: 15.1, rating: 100.1, rushingAvg: 2.9
        } },
      { week: 11, date: '2018-10-26', kickoff: '7:30pm',
        opponent: 'Barron Collier', home: true, conference: true, scouts: true,
        result: { teamScore: 25, opponentScore: 9 }, booster: null,
        stats: {
          completions: 8, attempts: 14, passingYards: 122, passingYac: 52,
          passingTd: 1, interceptions: 0, carries: 6, rushingYards: 33,
          rushingTd: 0, rushingLong: 16, sacks: 1, fumbles: 0,
          passingAvg: 15.3, rating: 109.8, rushingAvg: 5.5
        } },
      { week: 12, date: '2018-11-02', kickoff: '7:30pm',
        opponent: 'Piper', home: true, conference: false,
        result: { teamScore: 42, opponentScore: 6 }, booster: null,
        stats: {
          completions: 17, attempts: 26, passingYards: 258,
          passingYac: 99, passingTd: 3, interceptions: 1, carries: 4,
          rushingYards: 26, rushingTd: 0, rushingLong: 26, sacks: 2,
          fumbles: 0, passingAvg: 15.2, rating: 120.4, rushingAvg: 6.5
        } },
    ],
  }
};
