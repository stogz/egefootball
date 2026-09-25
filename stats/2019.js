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
        result: { teamScore: 42, opponentScore: 10 }, booster: null,
        stats: {
          receptions: 8, receivingYards: 98, receivingYac: 32,
          receivingTd: 2, receivingLong: 23, targets: 8, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 12.3, totalYards: 98, totalTd: 2
        },
        bigPlays: [
          '15 yard receiving touchdown',
          '9 yard receiving touchdown'
        ] },
      { week:  3, date: '2019-09-09', kickoff: '7:00pm',
        opponent: 'Middle Creek', home: true, conference: false,
        result: { teamScore: 52, opponentScore: 6 }, booster: null,
        stats: {
          receptions: 6, receivingYards: 81, receivingYac: 48,
          receivingTd: 0, receivingLong: 32, targets: 9, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 13.5, totalYards: 81, totalTd: 0
        } },
      { week:  4, date: '2019-09-13', kickoff: '7:00pm',
        opponent: 'Millbrook', home: false, conference: false,
        result: { teamScore: 49, opponentScore: 7 }, booster: null,
        stats: {
          receptions: 3, receivingYards: 18, receivingYac: 7,
          receivingTd: 2, receivingLong: 11, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 6, totalYards: 18, totalTd: 2
        },
        bigPlays: [
          '4 yard receiving touchdown',
          '3 yard receiving touchdown'
        ] },
      { week:  5, date: '2019-09-20', kickoff: '7:00pm',
        opponent: 'Garner', home: false, conference: false,
        result: { teamScore: 52, opponentScore: 17 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 86, receivingYac: 27,
          receivingTd: 1, receivingLong: 38, targets: 8, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 17.2, totalYards: 86, totalTd: 1
        },
        bigPlays: [
          '38 yard reception',
          '6 yard receiving touchdown'
        ] },
      { week:  6, date: '2019-09-27', kickoff: '7:00pm',
        opponent: 'Wallace-Rose Hill', home: true, conference: false, scouts: true,
        result: { teamScore: 42, opponentScore: 28 }, booster: null,
        stats: {
          receptions: 10, receivingYards: 124, receivingYac: 16,
          receivingTd: 2, receivingLong: 21, targets: 12, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 12.4, totalYards: 124, totalTd: 2
        },
        bigPlays: [
          '16 yard receiving touchdown',
          '2 yard receiving touchdown'
        ] },
      { week:  8, date: '2019-10-11', kickoff: '7:00pm',
        opponent: 'Knightdale', home: true, conference: true,
        result: { teamScore: 41, opponentScore: 14 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 37, receivingYac: 11,
          receivingTd: 2, receivingLong: 18, targets: 9, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 9.3, totalYards: 37, totalTd: 2
        },
        bigPlays: [
          '11 yard receiving touchdown',
          '4 yard receiving touchdown'
        ] },
      { week:  9, date: '2019-10-18', kickoff: '7:00pm',
        opponent: 'Corinth Holders', home: false, conference: true,
        result: { teamScore: 34, opponentScore: 7 }, booster: null,
        stats: {
          receptions: 7, receivingYards: 121, receivingYac: 45,
          receivingTd: 1, receivingLong: 51, targets: 9, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 17.3, totalYards: 121, totalTd: 1
        },
        bigPlays: [
          '51 yard reception',
          '1 yard receiving touchdown'
        ] },
      { week: 10, date: '2019-10-25', kickoff: '7:00pm',
        opponent: 'Rolesville', home: true, conference: true, scouts: true, overtime: true,
        result: { teamScore: 31, opponentScore: 30 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 51, receivingYac: 17,
          receivingTd: 1, receivingLong: 23, targets: 9, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 10.2, totalYards: 51, totalTd: 1
        },
        bigPlays: [
          '8 yard receiving touchdown'
        ] },
      { week: 11, date: '2019-11-01', kickoff: '7:00pm',
        opponent: 'Wakefield', home: false, conference: true,
        result: { teamScore: 41, opponentScore: 24 }, booster: null,
        stats: {
          receptions: 6, receivingYards: 66, receivingYac: 18,
          receivingTd: 0, receivingLong: 21, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 11, totalYards: 66, totalTd: 0
        } },
      { week: 12, date: '2019-11-08', kickoff: '7:00pm',
        opponent: 'Heritage', home: true, conference: true,
        result: { teamScore: 52, opponentScore: 26 }, booster: null,
        stats: {
          receptions: 6, receivingYards: 112, receivingYac: 18,
          receivingTd: 2, receivingLong: 40, targets: 8, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 18.7, totalYards: 112, totalTd: 2
        },
        bigPlays: [
          '40 yard receiving touchdown',
          '33 yard receiving touchdown'
        ] },
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
        result: { teamScore: 63, opponentScore: 0 }, booster: null,
        stats: {
          carries: 32, rushingYards: 255, rushingTd: 2, rushingLong: 65,
          receptions: 2, receivingYards: 12, receivingYac: 5,
          receivingTd: 0, receivingLong: 9, targets: 2, fumbles: 0,
          rushingAvg: 8, receivingAvg: 6, totalYards: 267, totalTd: 2
        },
        bigPlays: [
          '19 yard rushing touchdown',
          '4 yard rushing touchdown',
          '65 yard BEAST-mode'
        ] },
      { week:  3, date: '2019-09-06', kickoff: '7:00pm',
        opponent: 'Lawndale', home: false, conference: false, scouts: true,
        result: { teamScore: 24, opponentScore: 42 }, booster: 'boost-2-0',
        stats: {
          carries: 7, rushingYards: 2, rushingTd: 0, rushingLong: 5,
          receptions: 11, receivingYards: 106, receivingYac: 43,
          receivingTd: 2, receivingLong: 16, targets: 14, fumbles: 1,
          rushingAvg: 0.3, receivingAvg: 9.6, totalYards: 108, totalTd: 2
        },
        bigPlays: [
          '12 yard receiving touchdown',
          '1 yard receiving touchdown'
        ] },
      { week:  4, date: '2019-09-13', kickoff: '7:00pm',
        opponent: 'Mission Hills', home: true, conference: true,
        result: { teamScore: 17, opponentScore: 7 }, booster: null,
        stats: {
          carries: 15, rushingYards: 92, rushingTd: 0, rushingLong: 61,
          receptions: 4, receivingYards: 21, receivingYac: 9,
          receivingTd: 0, receivingLong: 10, targets: 7, fumbles: 0,
          rushingAvg: 6.1, receivingAvg: 5.3, totalYards: 113, totalTd: 0
        },
        bigPlays: [
          '61 yard run'
        ] },
      { week:  5, date: '2019-09-20', kickoff: '7:00pm',
        opponent: 'San Marcos', home: true, conference: true,
        result: { teamScore: 28, opponentScore: 7 }, booster: null,
        stats: {
          carries: 19, rushingYards: 172, rushingTd: 1, rushingLong: 57,
          receptions: 5, receivingYards: 52, receivingYac: 46,
          receivingTd: 0, receivingLong: 26, targets: 6, fumbles: 0,
          rushingAvg: 9.1, receivingAvg: 10.4, totalYards: 224, totalTd: 1
        },
        bigPlays: [
          '57 yard run',
          '36 yard rushing touchdown'
        ] },
      { week:  7, date: '2019-10-04', kickoff: '7:15pm',
        opponent: 'Torrey Pines', home: false, conference: true,
        result: { teamScore: 36, opponentScore: 6 }, booster: null,
        stats: {
          carries: 12, rushingYards: 102, rushingTd: 0, rushingLong: 51,
          receptions: 6, receivingYards: 39, receivingYac: 33,
          receivingTd: 1, receivingLong: 11, targets: 7, fumbles: 0,
          rushingAvg: 8.5, receivingAvg: 6.5, totalYards: 141, totalTd: 1
        },
        bigPlays: [
          '9 yard receiving touchdown',
          '51 yard BEAST-MODE'
        ] },
      { week:  8, date: '2019-10-11', kickoff: '7:00pm',
        opponent: 'Oceanside', home: false, conference: true, scouts: true,
        result: { teamScore: 22, opponentScore: 20 }, booster: null,
        stats: {
          carries: 21, rushingYards: 72, rushingTd: 3, rushingLong: 12,
          receptions: 2, receivingYards: 29, receivingYac: 20,
          receivingTd: 0, receivingLong: 18, targets: 6, fumbles: 0,
          rushingAvg: 3.4, receivingAvg: 14.5, totalYards: 101, totalTd: 3
        },
        bigPlays: [
          '7 yard rushing touchdown',
          '4 yard rushing touchdown',
          '1 yard rushing touchdown'
        ] },
      { week:  9, date: '2019-10-18', kickoff: '7:00pm',
        opponent: 'El Camino', home: true, conference: true,
        result: { teamScore: 28, opponentScore: 14 }, booster: null,
        stats: {
          carries: 17, rushingYards: 140, rushingTd: 1, rushingLong: 31,
          receptions: 4, receivingYards: 56, receivingYac: 46,
          receivingTd: 0, receivingLong: 33, targets: 5, fumbles: 1,
          rushingAvg: 8.2, receivingAvg: 14, totalYards: 196, totalTd: 1
        },
        bigPlays: [
          '23 yard rushing touchdown'
        ] },
      { week: 10, date: '2019-10-25', kickoff: '7:00pm',
        opponent: 'La Costa Canyon', home: false, conference: true, scouts: true,
        result: { teamScore: 14, opponentScore: 7 }, booster: null,
        stats: {
          carries: 13, rushingYards: 74, rushingTd: 1, rushingLong: 19,
          receptions: 4, receivingYards: 23, receivingYac: 10,
          receivingTd: 0, receivingLong: 9, targets: 6, fumbles: 0,
          rushingAvg: 5.7, receivingAvg: 5.8, totalYards: 97, totalTd: 1
        },
        bigPlays: [
          '3 yard rushing touchdown'
        ] },
      { week: 11, date: '2019-11-01', kickoff: '7:00pm',
        opponent: 'Vista', home: true, conference: false,
        result: { teamScore: 26, opponentScore: 14 }, booster: null,
        stats: {
          carries: 19, rushingYards: 148, rushingTd: 3, rushingLong: 34,
          receptions: 4, receivingYards: 33, receivingYac: 22,
          receivingTd: 0, receivingLong: 15, targets: 6, fumbles: 1,
          rushingAvg: 7.8, receivingAvg: 8.3, totalYards: 181, totalTd: 3
        },
        bigPlays: [
          '34 yard rushing touchdown',
          '20 yard rushing touchdown',
          '2 yard rushing touchdown'
        ] },
    ],

    /* Paxon Hatch — Bloomington High School */
    'paxon-hatch': [
      { week:  2, date: '2019-08-30', kickoff: '7:00pm',
        opponent: 'Danville', home: true, conference: true,
        result: { teamScore: 36, opponentScore: 0 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 137, receivingYac: 62,
          receivingTd: 1, receivingLong: 55, targets: 8, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 27.4, totalYards: 137, totalTd: 1
        },
        bigPlays: [
          '3 yard receiving touchdown',
          '55 yard reception, 44 yards after catch'
        ] },
      { week:  3, date: '2019-09-07', kickoff: '1:00pm',
        opponent: 'Lincoln-Way Central', home: true, conference: false, scouts: true,
        result: { teamScore: 10, opponentScore: 46 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 16, receivingYac: 16,
          receivingTd: 0, receivingLong: 16, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 4, totalYards: 16, totalTd: 0
        } },
      { week:  4, date: '2019-09-13', kickoff: '7:00pm',
        opponent: 'Manual', home: false, conference: true,
        result: { teamScore: 28, opponentScore: 8 }, booster: null,
        stats: {
          receptions: 6, receivingYards: 136, receivingYac: 47,
          receivingTd: 1, receivingLong: 40, targets: 7, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 22.7, totalYards: 136, totalTd: 1
        },
        bigPlays: [
          '40 yard reception, 24 yards after catch',
          '16 yard receiving touchdown'
        ] },
      { week:  5, date: '2019-09-20', kickoff: '7:00pm',
        opponent: 'Normal West', home: true, conference: true,
        result: { teamScore: 16, opponentScore: 31 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 37, receivingYac: 6,
          receivingTd: 0, receivingLong: 13, targets: 7, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 9.3, totalYards: 37, totalTd: 0
        } },
      { week:  6, date: '2019-09-27', kickoff: '6:00pm',
        opponent: 'Urbana', home: true, conference: true,
        result: { teamScore: 58, opponentScore: 6 }, booster: null,
        stats: {
          receptions: 6, receivingYards: 85, receivingYac: 26,
          receivingTd: 1, receivingLong: 26, targets: 10, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 14.2, totalYards: 85, totalTd: 1
        },
        bigPlays: [
          '5 yard receiving touchdown'
        ] },
      { week:  7, date: '2019-10-04', kickoff: '7:00pm',
        opponent: 'Normal Community', home: false, conference: true, scouts: true, overtime: true,
        result: { teamScore: 48, opponentScore: 45 }, booster: 'boost-2-0',
        stats: {
          receptions: 10, receivingYards: 108, receivingYac: 51,
          receivingTd: 2, receivingLong: 37, targets: 18, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 1,
          receivingAvg: 10.8, totalYards: 108, totalTd: 2
        },
        bigPlays: [
          '37 yard receiving touchdown',
          '11 yard receiving touchdown'
        ] },
      { week:  8, date: '2019-10-12', kickoff: '7:00pm',
        opponent: 'Peoria Notre Dame', home: true, conference: true,
        result: { teamScore: 6, opponentScore: 20 }, booster: null,
        stats: {
          receptions: 2, receivingYards: 15, receivingYac: 5,
          receivingTd: 0, receivingLong: 9, targets: 9, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 7.5, totalYards: 15, totalTd: 0
        } },
      { week:  9, date: '2019-10-18', kickoff: '7:00pm',
        opponent: 'Peoria', home: true, conference: true, scouts: true,
        result: { teamScore: 26, opponentScore: 42 }, booster: null,
        stats: {
          receptions: 6, receivingYards: 80, receivingYac: 21,
          receivingTd: 1, receivingLong: 33, targets: 10, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 13.3, totalYards: 80, totalTd: 1
        },
        bigPlays: [
          '6 yard receiving touchdown'
        ] },
      { week: 10, date: '2019-10-25', kickoff: '7:00pm',
        opponent: 'Centennial', home: false, conference: true,
        result: { teamScore: 54, opponentScore: 6 }, booster: null,
        stats: {
          receptions: 2, receivingYards: 35, receivingYac: 5,
          receivingTd: 1, receivingLong: 18, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 17.5, totalYards: 35, totalTd: 1
        },
        bigPlays: [
          '17 yard receiving touchdown'
        ] },
    ],

    /* Isaac Vitel — Bloomington High School */
    'isaac-vitel': [
      { week:  2, date: '2019-08-30', kickoff: '7:00pm',
        opponent: 'Danville', home: true, conference: true,
        result: { teamScore: 36, opponentScore: 0 }, booster: null,
        stats: {
          completions: 31, attempts: 44, passingYards: 394,
          passingYac: 287, passingTd: 4, interceptions: 0, carries: 1,
          rushingYards: 2, rushingTd: 0, rushingLong: 2, sacks: 3,
          fumbles: 1, passingAvg: 12.7, rating: 128.4, rushingAvg: 2
        },
        bigPlays: [
          '26 yard passing touchdown',
          '12 yard passing touchdown',
          '9 yard passing touchdown',
          '3 yard passing touchdown (P. Hatch)',
          '55 yard-dot (P. Hatch)'
        ] },
      { week:  3, date: '2019-09-07', kickoff: '1:00pm',
        opponent: 'Lincoln-Way Central', home: true, conference: false, scouts: true,
        result: { teamScore: 10, opponentScore: 46 }, booster: 'boost-1-5',
        stats: {
          completions: 15, attempts: 26, passingYards: 138,
          passingYac: 120, passingTd: 0, interceptions: 2, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, sacks: 0,
          fumbles: 1, passingAvg: 9.2, rating: 40.2
        },
        bigPlays: [
          '42 yard pick-six'
        ] },
      { week:  4, date: '2019-09-13', kickoff: '7:00pm',
        opponent: 'Manual', home: false, conference: true,
        result: { teamScore: 28, opponentScore: 8 }, booster: null,
        stats: {
          completions: 18, attempts: 25, passingYards: 311,
          passingYac: 138, passingTd: 3, interceptions: 0, carries: 2,
          rushingYards: 3, rushingTd: 0, rushingLong: 3, sacks: 1,
          fumbles: 1, passingAvg: 17.3, rating: 153.5, rushingAvg: 1.5
        },
        bigPlays: [
          '32 yard passing touchdown',
          '16 yard passing touchdown (P. Hatch)',
          '1 yard passing touchdown'
        ] },
      { week:  5, date: '2019-09-20', kickoff: '7:00pm',
        opponent: 'Normal West', home: true, conference: true,
        result: { teamScore: 16, opponentScore: 31 }, booster: null,
        stats: {
          completions: 22, attempts: 39, passingYards: 275,
          passingYac: 98, passingTd: 1, interceptions: 1, carries: 2,
          rushingYards: 7, rushingTd: 0, rushingLong: 5, sacks: 4,
          fumbles: 0, passingAvg: 12.5, rating: 76.3, rushingAvg: 3.5
        },
        bigPlays: [
          '29 yard passing touchdown'
        ] },
      { week:  6, date: '2019-09-27', kickoff: '6:00pm',
        opponent: 'Urbana', home: true, conference: true,
        result: { teamScore: 58, opponentScore: 6 }, booster: null,
        stats: {
          completions: 16, attempts: 23, passingYards: 244,
          passingYac: 83, passingTd: 4, interceptions: 1, carries: 2,
          rushingYards: 8, rushingTd: 0, rushingLong: 7, sacks: 1,
          fumbles: 0, passingAvg: 15.3, rating: 125.7, rushingAvg: 4
        },
        bigPlays: [
          '34 yard passing touchdown',
          '33 yard passing touchdown',
          '13 yard passing touchdown',
          '5 yard passing touchdown (P. Hatch)'
        ] },
      { week:  7, date: '2019-10-04', kickoff: '7:00pm',
        opponent: 'Normal Community', home: false, conference: true, scouts: true, overtime: true,
        result: { teamScore: 48, opponentScore: 45 }, booster: 'boost-2-5',
        stats: {
          completions: 31, attempts: 42, passingYards: 428,
          passingYac: 287, passingTd: 5, interceptions: 1, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, sacks: 0,
          fumbles: 0, passingAvg: 13.8, rating: 135.7
        },
        bigPlays: [
          '37 yard passing touchdown (P. Hatch)',
          '11 yard passing touchdown (P. Hatch)',
          '7 yard passing touchdown',
          '6 yard passing touchdown',
          '3 yard passing touchdown',
          '55 yard pick-six'
        ] },
      { week:  8, date: '2019-10-12', kickoff: '7:00pm',
        opponent: 'Peoria Notre Dame', home: true, conference: true,
        result: { teamScore: 6, opponentScore: 20 }, booster: null,
        stats: {
          completions: 12, attempts: 35, passingYards: 134,
          passingYac: 37, passingTd: 1, interceptions: 0, carries: 3,
          rushingYards: -3, rushingTd: 0, rushingLong: 0, sacks: 2,
          fumbles: 0, passingAvg: 11.2, rating: 56.1, rushingAvg: -1
        },
        bigPlays: [
          '27 yard passing touchdown'
        ] },
      { week:  9, date: '2019-10-18', kickoff: '7:00pm',
        opponent: 'Peoria', home: true, conference: true, scouts: true,
        result: { teamScore: 26, opponentScore: 42 }, booster: null,
        stats: {
          completions: 22, attempts: 37, passingYards: 279,
          passingYac: 103, passingTd: 3, interceptions: 3, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, sacks: 6,
          fumbles: 0, passingAvg: 12.7, rating: 76.3
        },
        bigPlays: [
          '38 yard passing touchdown',
          '6 yard passing touchdown (P. Hatch)',
          '5 yard passing touchdown',
          '73 yard pick-six'
        ] },
      { week: 10, date: '2019-10-25', kickoff: '7:00pm',
        opponent: 'Centennial', home: false, conference: true,
        result: { teamScore: 54, opponentScore: 6 }, booster: null,
        stats: {
          completions: 12, attempts: 24, passingYards: 157,
          passingYac: 50, passingTd: 4, interceptions: 1, carries: 2,
          rushingYards: 7, rushingTd: 0, rushingLong: 4, sacks: 1,
          fumbles: 0, passingAvg: 13.1, rating: 93.2, rushingAvg: 3.5
        },
        bigPlays: [
          '17 yard passing touchdown (P. Hatch)',
          '8 yard passing touchdown',
          '4 yard passing touchdown',
          '3 yard passing touchdown'
        ] },
    ],

    /* Sam Stogsdill — Normal Community High School */
    'sam-stogsdill': [
      { week:  2, date: '2019-08-30', kickoff: '7:00pm',
        opponent: 'Richwoods', home: true, conference: true,
        result: { teamScore: 49, opponentScore: 7 }, booster: null,
        stats: {
          carries: 33, rushingYards: 209, rushingTd: 4, rushingLong: 33,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 1, fumbles: 0,
          rushingAvg: 6.3, totalYards: 209, totalTd: 4
        },
        bigPlays: [
          '33 yard rushing touchdown',
          '12 yard rushing touchdown',
          '1 yard rushing touchdown',
          '1 yard rushing touchdown'
        ] },
      { week:  3, date: '2019-09-06', kickoff: '7:00pm',
        opponent: 'Normal West', home: false, conference: true, scouts: true,
        result: { teamScore: 37, opponentScore: 14 }, booster: 'boost-1-5',
        stats: {
          carries: 35, rushingYards: 312, rushingTd: 3, rushingLong: 60,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 0,
          rushingAvg: 8.9, totalYards: 312, totalTd: 3
        },
        bigPlays: [
          '60 yard touchdown',
          '55 yard touchdown',
          '3 yard touchdown',
          '43 yard BEAST-mode'
        ] },
      { week:  4, date: '2019-09-13', kickoff: '7:00pm',
        opponent: 'Urbana', home: false, conference: true,
        result: { teamScore: 40, opponentScore: 0 }, booster: null,
        stats: {
          carries: 23, rushingYards: 150, rushingTd: 2, rushingLong: 14,
          receptions: 1, receivingYards: 4, receivingYac: 3,
          receivingTd: 1, receivingLong: 4, targets: 1, fumbles: 0,
          rushingAvg: 6.5, receivingAvg: 4, totalYards: 154, totalTd: 3
        },
        bigPlays: [
          '6 yard rushing touchdown',
          '2 yard rushing touchdown',
          '4 yard receiving touchdown'
        ] },
      { week:  5, date: '2019-09-20', kickoff: '7:00pm',
        opponent: 'Lapeer', home: false, conference: false, scouts: true,
        result: { teamScore: 8, opponentScore: 42 }, booster: null,
        stats: {
          carries: 19, rushingYards: 129, rushingTd: 1, rushingLong: 25,
          receptions: 1, receivingYards: 8, receivingYac: 4,
          receivingTd: 0, receivingLong: 8, targets: 1, fumbles: 0,
          rushingAvg: 6.8, receivingAvg: 8, totalYards: 137, totalTd: 1
        },
        bigPlays: [
          '25 yard rushing touchdown'
        ] },
      { week:  6, date: '2019-09-27', kickoff: '7:00pm',
        opponent: 'Manual', home: true, conference: true,
        result: { teamScore: 31, opponentScore: 6 }, booster: null,
        stats: {
          carries: 23, rushingYards: 183, rushingTd: 3, rushingLong: 68,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 1, fumbles: 0,
          rushingAvg: 8, totalYards: 183, totalTd: 3
        },
        bigPlays: [
          '2 yard rushing touchdown',
          '2 yard rushing touchdown',
          '1 yard rushing touchdown',
          '68 yard BEAST-mode'
        ] },
      { week:  7, date: '2019-10-04', kickoff: '7:00pm',
        opponent: 'Bloomington', home: true, conference: true, overtime: true,
        result: { teamScore: 45, opponentScore: 48 }, booster: 'boost-2-5',
        stats: {
          carries: 36, rushingYards: 247, rushingTd: 4, rushingLong: 59,
          receptions: 2, receivingYards: 12, receivingYac: 9,
          receivingTd: 0, receivingLong: 9, targets: 3, fumbles: 1,
          rushingAvg: 6.9, receivingAvg: 6, totalYards: 259, totalTd: 4
        },
        bigPlays: [
          '59 yard rushing touchdown',
          '12 yard rushing touchdown',
          '8 yard rushing touchdown',
          '1 yard rushing touchdown'
        ] },
      { week:  8, date: '2019-10-11', kickoff: '7:00pm',
        opponent: 'Danville', home: false, conference: true,
        result: { teamScore: 22, opponentScore: 19 }, booster: null,
        stats: {
          carries: 31, rushingYards: 171, rushingTd: 0, rushingLong: 21,
          receptions: 1, receivingYards: -2, receivingYac: 1,
          receivingTd: 0, receivingLong: -2, targets: 1, fumbles: 0,
          rushingAvg: 5.5, receivingAvg: -2, totalYards: 169, totalTd: 0
        } },
      { week:  9, date: '2019-10-18', kickoff: '7:00pm',
        opponent: 'Centennial', home: true, conference: true,
        result: { teamScore: 41, opponentScore: 13 }, booster: null,
        stats: {
          carries: 20, rushingYards: 117, rushingTd: 4, rushingLong: 14,
          receptions: 1, receivingYards: 2, receivingYac: 1,
          receivingTd: 0, receivingLong: 2, targets: 1, fumbles: 0,
          rushingAvg: 5.9, receivingAvg: 2, totalYards: 119, totalTd: 4
        },
        bigPlays: [
          '14 yard rushing touchdown',
          '4 yard rushing touchdown',
          '1 yard rushing touchdown',
          '1 yard rushing touchdown'
        ] },
      { week: 10, date: '2019-10-25', kickoff: '7:00pm',
        opponent: 'Peoria', home: false, conference: true, scouts: true,
        result: { teamScore: 18, opponentScore: 32 }, booster: null,
        stats: {
          carries: 25, rushingYards: 103, rushingTd: 1, rushingLong: 20,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 1, fumbles: 0,
          rushingAvg: 4.1, totalYards: 103, totalTd: 1
        },
        bigPlays: [
          '20 yard rushing touchdown'
        ] },
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
        result: { teamScore: 29, opponentScore: 12 }, booster: null,
        stats: {
          completions: 19, attempts: 26, passingYards: 197,
          passingYac: 105, passingTd: 2, interceptions: 0, carries: 4,
          rushingYards: 23, rushingTd: 1, rushingLong: 9, sacks: 4,
          fumbles: 0, passingAvg: 10.4, rating: 120.2, rushingAvg: 5.8
        },
        bigPlays: [
          '32 yard passing touchdown',
          '9 yard rushing touchdown',
          '6 yard passing touchdown'
        ] },
      { week:  3, date: '2019-09-06', kickoff: '7:30pm',
        opponent: 'Monsignor Pace', home: true, conference: false, scouts: true,
        result: { teamScore: 38, opponentScore: 28 }, booster: null,
        stats: {
          completions: 18, attempts: 34, passingYards: 164,
          passingYac: 71, passingTd: 2, interceptions: 0, carries: 5,
          rushingYards: 31, rushingTd: 0, rushingLong: 19, sacks: 2,
          fumbles: 0, passingAvg: 9.1, rating: 85.9, rushingAvg: 6.2
        },
        bigPlays: [
          '19 yard passing touchdown',
          '5 yard passing touchdown'
        ] },
      { week:  4, date: '2019-09-13', kickoff: '7:30pm',
        opponent: 'Palmetto Ridge', home: true, conference: true,
        result: { teamScore: 37, opponentScore: 0 }, booster: null,
        stats: {
          completions: 11, attempts: 24, passingYards: 173,
          passingYac: 74, passingTd: 1, interceptions: 0, carries: 4,
          rushingYards: 43, rushingTd: 0, rushingLong: 19, sacks: 1,
          fumbles: 0, passingAvg: 15.7, rating: 84.2, rushingAvg: 10.8
        },
        bigPlays: [
          '48 yard dot',
          '46 yard dot',
          '3 yard passing touchdown'
        ] },
      { week:  5, date: '2019-09-20', kickoff: '7:30pm',
        opponent: 'Lehigh', home: true, conference: false,
        result: { teamScore: 23, opponentScore: 7 }, booster: null,
        stats: {
          completions: 14, attempts: 25, passingYards: 173,
          passingYac: 101, passingTd: 2, interceptions: 1, carries: 3,
          rushingYards: 20, rushingTd: 0, rushingLong: 12, sacks: 2,
          fumbles: 0, passingAvg: 12.4, rating: 87.6, rushingAvg: 6.7
        },
        bigPlays: [
          '48 yard dot',
          '25 yard passing touchdown',
          '6 yard passing touchdown'
        ] },
      { week:  6, date: '2019-09-27', kickoff: '7:00pm',
        opponent: 'Barron Collier', home: false, conference: true,
        result: { teamScore: 49, opponentScore: 14 }, booster: null,
        stats: {
          completions: 19, attempts: 33, passingYards: 254,
          passingYac: 161, passingTd: 4, interceptions: 0, carries: 8,
          rushingYards: 34, rushingTd: 1, rushingLong: 19, sacks: 0,
          fumbles: 0, passingAvg: 13.4, rating: 121.7, rushingAvg: 4.3
        },
        bigPlays: [
          '29 yard passing touchdown',
          '12 yard passing touchdown',
          '10 yard passing touchdown',
          '9 yard rushing touchdown',
          '2 yard passing touchdown',
          '44 yard-dot'
        ] },
      { week:  8, date: '2019-10-11', kickoff: '7:30pm',
        opponent: 'Lely', home: true, conference: true,
        result: { teamScore: 45, opponentScore: 0 }, booster: null,
        stats: {
          completions: 9, attempts: 20, passingYards: 149, passingYac: 52,
          passingTd: 3, interceptions: 0, carries: 5, rushingYards: 36,
          rushingTd: 1, rushingLong: 12, sacks: 2, fumbles: 0,
          passingAvg: 16.6, rating: 110.2, rushingAvg: 7.2
        },
        bigPlays: [
          '25 yard passing touchdown',
          '1 yard passing touchdown',
          '1 yard passing touchdown',
          '2 yard rushing touchdown'
        ] },
      { week:  9, date: '2019-10-18', kickoff: '7:00pm',
        opponent: 'Golden Gate', home: false, conference: true,
        result: { teamScore: 49, opponentScore: 14 }, booster: null,
        stats: {
          completions: 15, attempts: 24, passingYards: 214,
          passingYac: 89, passingTd: 5, interceptions: 0, carries: 1,
          rushingYards: 3, rushingTd: 1, rushingLong: 3, sacks: 1,
          fumbles: 0, passingAvg: 14.3, rating: 130.9, rushingAvg: 3
        },
        bigPlays: [
          '46 yard passing touchdown',
          '29 yard passing touchdown',
          '6 yard passing touchdown',
          '2 yard passing touchdown',
          '2 yard passing touchdown',
          '3 yard rushing touchdown'
        ] },
      { week: 10, date: '2019-10-25', kickoff: '7:00pm',
        opponent: 'Immokalee', home: false, conference: true,
        result: { teamScore: 36, opponentScore: 7 }, booster: null,
        stats: {
          completions: 15, attempts: 25, passingYards: 125,
          passingYac: 33, passingTd: 2, interceptions: 1, carries: 3,
          rushingYards: 20, rushingTd: 0, rushingLong: 12, sacks: 1,
          fumbles: 0, passingAvg: 8.3, rating: 82.9, rushingAvg: 6.7
        },
        bigPlays: [
          '10 yard passing touchdown',
          '10 yard passing touchdown'
        ] },
    ],
  }
};
