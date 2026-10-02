/* ==========================================================================
   EGE Football — the 2021 season
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

   `injured: true` marks a game the player missed hurt, and `injury` says
   what with — 'Bruised Shoulder'. The Discord post shows it in red, as
   DNP Injured: Bruised Shoulder, in place of his stat line. `health` is how
   healthy he is that week, 0 to 100; while the week is the one being played
   his page shows an injury report with it as a bar.

   `neutral: true` marks a game at a neutral site — listed as vs, and home
   is false because it is nobody's. A kickoff of null is one that has not
   been set yet; it shows as a dash until it is.

   `playoff: true` marks a postseason game: a playoff round, and in college
   a conference title game or a bowl too. `name` says which game it is —
   'SEC Championship', 'Rose Bowl — CFP Semifinal' — and shows under the
   opponent on the schedule and beside it in the Discord post. A game is
   out of sight until the week before it is published, so a bowl is not
   on anybody's schedule before the title game that sent them there.
   ========================================================================== */

window.EGE = window.EGE || {};
EGE.stats = EGE.stats || {};

EGE.stats[2021] = {
  season: 2021,
  level: 'College football',

  games: {

    /* Andrew Parr — Alabama */
    'andrew-parr': [
      { week:  1, date: '2021-09-04', kickoff: '2:30pm',
        opponent: 'Miami', home: false, conference: false, neutral: true,
        result: { teamScore: 52, opponentScore: 21 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 68, receivingYac: 27,
          receivingTd: 1, receivingLong: 40, targets: 7, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 13.6, totalYards: 68, totalTd: 1
        },
        bigPlays: [
          '1 yard receiving touchdown'
        ] },
      { week:  2, date: '2021-09-11', kickoff: '3:00pm',
        opponent: 'Mercer', home: true, conference: false,
        result: { teamScore: 52, opponentScore: 14 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 50, receivingYac: 19,
          receivingTd: 0, receivingLong: 24, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 12.5, totalYards: 50, totalTd: 0
        } },
      { week:  3, date: '2021-09-18', kickoff: '2:30pm',
        opponent: 'Florida', home: false, conference: true,
        result: { teamScore: 38, opponentScore: 9 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 64, receivingYac: 32,
          receivingTd: 0, receivingLong: 32, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 12.8, totalYards: 64, totalTd: 0
        } },
      { week:  4, date: '2021-09-25', kickoff: '6:30pm',
        opponent: 'Southern Miss', home: true, conference: false,
        result: { teamScore: 44, opponentScore: 0 }, booster: null,
        stats: {
          receptions: 2, receivingYards: 11, receivingYac: 3,
          receivingTd: 2, receivingLong: 8, targets: 3, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 5.5, totalYards: 11, totalTd: 2
        },
        bigPlays: [
          '8 yard receiving touchdown',
          '3 yard receiving touchdown'
        ] },
      { week:  5, date: '2021-10-02', kickoff: '2:30pm',
        opponent: 'Ole Miss', home: true, conference: true,
        result: { teamScore: 51, opponentScore: 0 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 40, receivingYac: 12,
          receivingTd: 1, receivingLong: 20, targets: 5, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 10, totalYards: 40, totalTd: 1
        },
        bigPlays: [
          '1 yard receiving touchdown'
        ] },
      { week:  6, date: '2021-10-09', kickoff: '7:00pm',
        opponent: 'Texas A&M', home: false, conference: true,
        result: { teamScore: 10, opponentScore: 28 }, booster: null,
        stats: {
          receptions: 12, receivingYards: 145, receivingYac: 63,
          receivingTd: 0, receivingLong: 38, targets: 14, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 12.1, totalYards: 145, totalTd: 0
        } },
      { week:  7, date: '2021-10-16', kickoff: '6:00pm',
        opponent: 'Mississippi State', home: false, conference: true,
        result: { teamScore: 31, opponentScore: 17 }, booster: null,
        stats: {
          receptions: 3, receivingYards: 26, receivingYac: 12,
          receivingTd: 0, receivingLong: 14, targets: 5, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 8.7, totalYards: 26, totalTd: 0
        } },
      { week:  8, date: '2021-10-23', kickoff: '6:00pm',
        opponent: 'Tennessee', home: true, conference: true,
        result: { teamScore: 45, opponentScore: 34 }, booster: null,
        stats: {
          receptions: 2, receivingYards: 9, receivingYac: 5,
          receivingTd: 1, receivingLong: 7, targets: 5, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 4.5, totalYards: 9, totalTd: 1
        },
        bigPlays: [
          '2 yard receiving touchdown'
        ] },
      { week: 10, date: '2021-11-06', kickoff: '6:00pm',
        opponent: 'LSU', home: true, conference: true,
        result: { teamScore: 49, opponentScore: 20 }, booster: null,
        stats: {
          receptions: 2, receivingYards: 33, receivingYac: 13,
          receivingTd: 0, receivingLong: 18, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 16.5, totalYards: 33, totalTd: 0
        } },
      { week: 11, date: '2021-11-13', kickoff: '11:00am',
        opponent: 'New Mexico State', home: true, conference: false,
        result: { teamScore: 64, opponentScore: 7 }, booster: null,
        stats: {
          receptions: 3, receivingYards: 79, receivingYac: 21,
          receivingTd: 0, receivingLong: 56, targets: 4, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 26.3, totalYards: 79, totalTd: 0
        } },
      { week: 12, date: '2021-11-20', kickoff: '2:30pm',
        opponent: 'Arkansas', home: true, conference: true,
        result: { teamScore: 53, opponentScore: 21 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 70, receivingYac: 25,
          receivingTd: 1, receivingLong: 23, targets: 7, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 14, totalYards: 70, totalTd: 1
        },
        bigPlays: [
          '23 yard receiving touchdown'
        ] },
      { week: 13, date: '2021-11-27', kickoff: '2:30pm',
        opponent: 'Auburn', home: false, conference: true,
        result: { teamScore: 37, opponentScore: 17 }, booster: null,
        stats: {
          receptions: 7, receivingYards: 44, receivingYac: 17,
          receivingTd: 0, receivingLong: 11, targets: 10, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 6.3, totalYards: 44, totalTd: 0
        } },
    ],

    /* Cooper Clark — USC */
    'cooper-clark': [
      { week:  1, date: '2021-09-04', kickoff: '2:00pm',
        opponent: 'San José State', home: true, conference: false,
        result: { teamScore: 40, opponentScore: 10 }, booster: null,
        stats: {
          carries: 7, rushingYards: 31, rushingTd: 0, rushingLong: 11,
          receptions: 4, receivingYards: 48, receivingYac: 35,
          receivingTd: 0, receivingLong: 17, targets: 4, fumbles: 0,
          rushingAvg: 4.4, receivingAvg: 12, totalYards: 79, totalTd: 0
        } },
      { week:  2, date: '2021-09-11', kickoff: '7:30pm',
        opponent: 'Stanford', home: true, conference: true,
        result: { teamScore: 34, opponentScore: 13 }, booster: null,
        stats: {
          carries: 7, rushingYards: 33, rushingTd: 1, rushingLong: 8,
          receptions: 1, receivingYards: 5, receivingYac: 5,
          receivingTd: 0, receivingLong: 5, targets: 2, fumbles: 0,
          rushingAvg: 4.7, receivingAvg: 5, totalYards: 38, totalTd: 1
        },
        bigPlays: [
          '3 yard rushing touchdown'
        ] },
      { week:  3, date: '2021-09-18', kickoff: '12:30pm',
        opponent: 'Washington State', home: false, conference: true,
        result: { teamScore: 17, opponentScore: 26 }, booster: null,
        stats: {
          carries: 5, rushingYards: 21, rushingTd: 0, rushingLong: 8,
          receptions: 6, receivingYards: 62, receivingYac: 52,
          receivingTd: 0, receivingLong: 16, targets: 7, fumbles: 0,
          rushingAvg: 4.2, receivingAvg: 10.3, totalYards: 83, totalTd: 0
        } },
      { week:  4, date: '2021-09-25', kickoff: '7:30pm',
        opponent: 'Oregon State', home: true, conference: true,
        result: { teamScore: 41, opponentScore: 13 }, booster: null,
        stats: {
          carries: 6, rushingYards: 29, rushingTd: 1, rushingLong: 7,
          receptions: 6, receivingYards: 34, receivingYac: 28,
          receivingTd: 0, receivingLong: 8, targets: 6, fumbles: 0,
          rushingAvg: 4.8, receivingAvg: 5.7, totalYards: 63, totalTd: 1
        },
        bigPlays: [
          '3 yard rushing touchdown'
        ] },
      { week:  5, date: '2021-10-02', kickoff: '11:00am',
        opponent: 'Colorado', home: false, conference: true,
        result: { teamScore: 38, opponentScore: 37 }, booster: null,
        stats: {
          carries: 6, rushingYards: 38, rushingTd: 1, rushingLong: 15,
          receptions: 2, receivingYards: 17, receivingYac: 15,
          receivingTd: 0, receivingLong: 9, targets: 5, fumbles: 0,
          rushingAvg: 6.3, receivingAvg: 8.5, totalYards: 55, totalTd: 1
        },
        bigPlays: [
          '6 yard rushing touchdown'
        ] },
      { week:  6, date: '2021-10-09', kickoff: '5:00pm',
        opponent: 'Utah', home: true, conference: true,
        result: { teamScore: 17, opponentScore: 37 }, booster: null,
        stats: {
          carries: 6, rushingYards: 3, rushingTd: 0, rushingLong: 4,
          receptions: 6, receivingYards: 67, receivingYac: 53,
          receivingTd: 0, receivingLong: 17, targets: 7, fumbles: 0,
          rushingAvg: 0.5, receivingAvg: 11.2, totalYards: 70, totalTd: 0
        } },
      { week:  8, date: '2021-10-23', kickoff: '4:30pm',
        opponent: 'Notre Dame', home: false, conference: false,
        result: { teamScore: 17, opponentScore: 37 }, booster: null,
        stats: {
          carries: 3, rushingYards: 10, rushingTd: 0, rushingLong: 6,
          receptions: 4, receivingYards: 47, receivingYac: 39,
          receivingTd: 0, receivingLong: 20, targets: 5, fumbles: 0,
          rushingAvg: 3.3, receivingAvg: 11.8, totalYards: 57, totalTd: 0
        } },
      { week:  9, date: '2021-10-30', kickoff: '4:00pm',
        opponent: 'Arizona', home: true, conference: true,
        result: { teamScore: 17, opponentScore: 27 }, booster: null,
        stats: {
          carries: 8, rushingYards: 46, rushingTd: 0, rushingLong: 21,
          receptions: 5, receivingYards: 21, receivingYac: 17,
          receivingTd: 0, receivingLong: 8, targets: 5, fumbles: 0,
          rushingAvg: 5.8, receivingAvg: 4.2, totalYards: 67, totalTd: 0
        } },
      { week: 10, date: '2021-11-06', kickoff: '7:30pm',
        opponent: 'Arizona State', home: false, conference: true,
        result: { teamScore: 20, opponentScore: 37 }, booster: null,
        stats: {
          carries: 10, rushingYards: 32, rushingTd: 1, rushingLong: 7,
          receptions: 3, receivingYards: 27, receivingYac: 23,
          receivingTd: 0, receivingLong: 12, targets: 4, fumbles: 0,
          rushingAvg: 3.2, receivingAvg: 9, totalYards: 59, totalTd: 1
        },
        bigPlays: [
          '3 yard rushing touchdown'
        ] },
      { week: 12, date: '2021-11-20', kickoff: '1:00pm',
        opponent: 'UCLA', home: true, conference: true,
        result: { teamScore: 28, opponentScore: 42 }, booster: null,
        stats: {
          carries: 4, rushingYards: -1, rushingTd: 0, rushingLong: 4,
          receptions: 6, receivingYards: 60, receivingYac: 49,
          receivingTd: 0, receivingLong: 24, targets: 8, fumbles: 0,
          rushingAvg: -0.2, receivingAvg: 10, totalYards: 59, totalTd: 0
        } },
      { week: 13, date: '2021-11-27', kickoff: '7:30pm',
        opponent: 'BYU', home: true, conference: false,
        result: { teamScore: 34, opponentScore: 26 }, booster: null,
        stats: {
          carries: 8, rushingYards: 32, rushingTd: 0, rushingLong: 9,
          receptions: 6, receivingYards: 38, receivingYac: 29,
          receivingTd: 0, receivingLong: 15, targets: 7, fumbles: 0,
          rushingAvg: 4, receivingAvg: 6.3, totalYards: 70, totalTd: 0
        } },
      { week: 14, date: '2021-12-04', kickoff: '8:00pm',
        opponent: 'California', home: false, conference: true,
        result: { teamScore: 28, opponentScore: 21 }, booster: null,
        stats: {
          carries: 8, rushingYards: 33, rushingTd: 0, rushingLong: 10,
          receptions: 4, receivingYards: 13, receivingYac: 12,
          receivingTd: 0, receivingLong: 4, targets: 4, fumbles: 0,
          rushingAvg: 4.1, receivingAvg: 3.3, totalYards: 46, totalTd: 0
        } },
    ],

    /* Paxon Hatch — North Dakota State */
    'paxon-hatch': [
      { week:  1, date: '2021-09-04', kickoff: '2:30pm',
        opponent: 'Albany', home: true, conference: false,
        result: { teamScore: 41, opponentScore: 0 }, booster: null,
        stats: {
          receptions: 3, receivingYards: 54, receivingYac: 14,
          receivingTd: 2, receivingLong: 41, targets: 5, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 18, totalYards: 54, totalTd: 2
        },
        bigPlays: [
          '41 yard receiving touchdown',
          '5 yard receiving touchdown'
        ] },
      { week:  2, date: '2021-09-11', kickoff: '2:30pm',
        opponent: 'Valparaiso', home: true, conference: false,
        result: { teamScore: 44, opponentScore: 23 }, booster: null,
        stats: {
          receptions: 7, receivingYards: 167, receivingYac: 64,
          receivingTd: 1, receivingLong: 60, targets: 10, carries: 1,
          rushingYards: 40, rushingTd: 0, rushingLong: 40, fumbles: 0,
          rushingAvg: 40, receivingAvg: 23.9, totalYards: 207, totalTd: 1
        },
        bigPlays: [
          '35 yard receiving touchdown'
        ] },
      { week:  3, date: '2021-09-18', kickoff: '5:00pm',
        opponent: 'Towson', home: false, conference: false,
        result: { teamScore: 29, opponentScore: 0 }, booster: null,
        stats: {
          receptions: 7, receivingYards: 156, receivingYac: 56,
          receivingTd: 1, receivingLong: 44, targets: 12, carries: 1,
          rushingYards: 3, rushingTd: 0, rushingLong: 3, fumbles: 0,
          rushingAvg: 3, receivingAvg: 22.3, totalYards: 159, totalTd: 1
        },
        bigPlays: [
          '39 yard receiving touchdown'
        ] },
      { week:  5, date: '2021-10-02', kickoff: '2:00pm',
        opponent: 'North Dakota', home: false, conference: true,
        result: { teamScore: 40, opponentScore: 10 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 45, receivingYac: 17,
          receivingTd: 1, receivingLong: 22, targets: 5, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 11.3, totalYards: 45, totalTd: 1
        },
        bigPlays: [
          '1 yard receiving touchdown'
        ] },
      { week:  6, date: '2021-10-09', kickoff: '1:00pm',
        opponent: 'Northern Iowa', home: true, conference: true,
        result: { teamScore: 21, opponentScore: 24 }, booster: null,
        stats: {
          receptions: 3, receivingYards: 36, receivingYac: 15,
          receivingTd: 1, receivingLong: 14, targets: 7, carries: 1,
          rushingYards: 8, rushingTd: 0, rushingLong: 8, fumbles: 0,
          rushingAvg: 8, receivingAvg: 12, totalYards: 44, totalTd: 1
        },
        bigPlays: [
          '8 yard receiving touchdown'
        ] },
      { week:  7, date: '2021-10-16', kickoff: '2:00pm',
        opponent: 'Illinois State', home: false, conference: true,
        result: { teamScore: 41, opponentScore: 14 }, booster: null,
        stats: {
          receptions: 9, receivingYards: 210, receivingYac: 68,
          receivingTd: 1, receivingLong: 51, targets: 11, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 23.3, totalYards: 210, totalTd: 1
        },
        bigPlays: [
          '21 yard receiving touchdown'
        ] },
      { week:  8, date: '2021-10-23', kickoff: '2:30pm',
        opponent: 'Missouri State', home: true, conference: true,
        result: { teamScore: 44, opponentScore: 10 }, booster: null,
        stats: {
          receptions: 9, receivingYards: 199, receivingYac: 68,
          receivingTd: 2, receivingLong: 52, targets: 12, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 22.1, totalYards: 199, totalTd: 2
        },
        bigPlays: [
          '36 yard receiving touchdown',
          '29 yard receiving touchdown'
        ] },
      { week:  9, date: '2021-10-30', kickoff: '2:30pm',
        opponent: 'Indiana State', home: true, conference: true,
        result: { teamScore: 50, opponentScore: 0 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 65, receivingYac: 30,
          receivingTd: 1, receivingLong: 29, targets: 5, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 16.3, totalYards: 65, totalTd: 1
        },
        bigPlays: [
          '29 yard receiving touchdown'
        ] },
      { week: 10, date: '2021-11-06', kickoff: '2:00pm',
        opponent: 'South Dakota State', home: false, conference: true,
        result: { teamScore: 23, opponentScore: 28 }, booster: null,
        stats: {
          receptions: 6, receivingYards: 102, receivingYac: 37,
          receivingTd: 0, receivingLong: 34, targets: 8, carries: 1,
          rushingYards: -3, rushingTd: 0, rushingLong: -3, fumbles: 0,
          rushingAvg: -3, receivingAvg: 17, totalYards: 99, totalTd: 0
        } },
      { week: 11, date: '2021-11-13', kickoff: '11:00am',
        opponent: 'Youngstown State', home: false, conference: true,
        result: { teamScore: 35, opponentScore: 14 }, booster: null,
        stats: {
          receptions: 6, receivingYards: 93, receivingYac: 42,
          receivingTd: 2, receivingLong: 44, targets: 10, carries: 1,
          rushingYards: 10, rushingTd: 0, rushingLong: 10, fumbles: 0,
          rushingAvg: 10, receivingAvg: 15.5, totalYards: 103, totalTd: 2
        },
        bigPlays: [
          '3 yard receiving touchdown',
          '2 yard receiving touchdown'
        ] },
      { week: 12, date: '2021-11-20', kickoff: '2:30pm',
        opponent: 'South Dakota', home: true, conference: true,
        result: { teamScore: 44, opponentScore: 28 }, booster: null,
        stats: {
          receptions: 7, receivingYards: 148, receivingYac: 63,
          receivingTd: 1, receivingLong: 44, targets: 8, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 21.1, totalYards: 148, totalTd: 1
        },
        bigPlays: [
          '44 yard receiving touchdown'
        ] },
    ],

    /* Isaac Vitel — Illinois */
    'isaac-vitel': [
      { week:  0, date: '2021-08-28', kickoff: '12:20pm',
        opponent: 'Nebraska', home: true, conference: true,
        result: { teamScore: 23, opponentScore: 19 }, booster: null,
        stats: {
          completions: 8, attempts: 16, passingYards: 78, passingYac: 37,
          passingTd: 1, interceptions: 0, carries: 2, rushingYards: 1,
          rushingTd: 0, rushingLong: 4, sacks: 2, fumbles: 0,
          passingAvg: 9.8, rating: 84.9, rushingAvg: 0.5
        },
        bigPlays: [
          '23 yard passing touchdown'
        ] },
      { week:  1, date: '2021-09-04', kickoff: '6:30pm',
        opponent: 'UTSA', home: true, conference: false,
        result: { teamScore: 23, opponentScore: 30 }, booster: null,
        stats: {
          completions: 6, attempts: 15, passingYards: 46, passingYac: 18,
          passingTd: 1, interceptions: 1, carries: 4, rushingYards: 6,
          rushingTd: 0, rushingLong: 5, sacks: 1, fumbles: 0,
          passingAvg: 7.7, rating: 42.6, rushingAvg: 1.5
        },
        bigPlays: [
          '8 yard passing touchdown'
        ] },
      { week:  2, date: '2021-09-11', kickoff: '10:00am',
        opponent: 'Virginia', home: false, conference: false,
        result: { teamScore: 14, opponentScore: 42 }, booster: null,
        stats: {
          completions: 8, attempts: 16, passingYards: 112, passingYac: 46,
          passingTd: 0, interceptions: 0, carries: 1, rushingYards: 3,
          rushingTd: 0, rushingLong: 3, sacks: 1, fumbles: 0,
          passingAvg: 14, rating: 72.9, rushingAvg: 3
        } },
      { week:  3, date: '2021-09-17', kickoff: '8:00pm',
        opponent: 'Maryland', home: true, conference: true,
        result: { teamScore: 24, opponentScore: 26 }, booster: null,
        stats: {
          completions: 5, attempts: 13, passingYards: 46, passingYac: 22,
          passingTd: 1, interceptions: 0, carries: 2, rushingYards: 6,
          rushingTd: 0, rushingLong: 3, sacks: 2, fumbles: 0,
          passingAvg: 9.2, rating: 74.5, rushingAvg: 3
        },
        bigPlays: [
          '1 yard passing touchdown'
        ] },
      { week:  4, date: '2021-09-25', kickoff: '2:30pm',
        opponent: 'Purdue', home: false, conference: true,
        result: { teamScore: 15, opponentScore: 21 }, booster: null,
        stats: {
          completions: 8, attempts: 13, passingYards: 108, passingYac: 35,
          passingTd: 0, interceptions: 0, carries: 1, rushingYards: -4,
          rushingTd: 0, rushingLong: -4, sacks: 1, fumbles: 0,
          passingAvg: 13.5, rating: 88, rushingAvg: -4
        } },
      { week:  5, date: '2021-10-02', kickoff: '11:00am',
        opponent: 'Charlotte', home: true, conference: false,
        result: { teamScore: 54, opponentScore: 7 }, booster: null,
        stats: {
          completions: 2, attempts: 4, passingYards: 37, passingYac: 22,
          passingTd: 0, interceptions: 0, carries: 1, rushingYards: 0,
          rushingTd: 0, rushingLong: 0, sacks: 0, fumbles: 0,
          passingAvg: 18.5, rating: 82.3, rushingAvg: 0
        } },
      { week:  6, date: '2021-10-09', kickoff: '2:30pm',
        opponent: 'Wisconsin', home: true, conference: true, injured: true, injury: 'AC Joint Sprain', health: 39,
        result: { teamScore: 13, opponentScore: 21 }, booster: null,
        stats: {
          completions: 0, attempts: 0, passingYards: 0, passingYac: 0,
          passingTd: 0, interceptions: 0, carries: 0, rushingYards: 0,
          rushingTd: 0, rushingLong: 0, sacks: 0, fumbles: 0
        } },
      { week:  8, date: '2021-10-23', kickoff: '11:00am',
        opponent: 'Penn State', home: false, conference: true, injured: true, injury: 'AC Joint Sprain', health: 46,
        result: { teamScore: 21, opponentScore: 7 }, booster: null,
        stats: {
          completions: 0, attempts: 0, passingYards: 0, passingYac: 0,
          passingTd: 0, interceptions: 0, carries: 0, rushingYards: 0,
          rushingTd: 0, rushingLong: 0, sacks: 0, fumbles: 0
        } },
      { week:  9, date: '2021-10-30', kickoff: '11:00am',
        opponent: 'Rutgers', home: true, conference: true, injured: true, injury: 'AC Joint Sprain', health: 83,
        result: { teamScore: 14, opponentScore: 13 }, booster: null,
        stats: {
          completions: 0, attempts: 0, passingYards: 0, passingYac: 0,
          passingTd: 0, interceptions: 0, carries: 0, rushingYards: 0,
          rushingTd: 0, rushingLong: 0, sacks: 0, fumbles: 0
        } },
      { week: 10, date: '2021-11-06', kickoff: '11:00am',
        opponent: 'Minnesota', home: false, conference: true,
        result: { teamScore: 20, opponentScore: 26 }, booster: null,
        stats: {
          completions: 9, attempts: 15, passingYards: 113, passingYac: 47,
          passingTd: 2, interceptions: 0, carries: 4, rushingYards: -5,
          rushingTd: 0, rushingLong: 2, sacks: 1, fumbles: 0,
          passingAvg: 12.6, rating: 123.1, rushingAvg: -1.2
        },
        bigPlays: [
          '28 yard passing touchdown',
          '24 yard passing touchdown'
        ] },
      { week: 12, date: '2021-11-20', kickoff: '1:00pm',
        opponent: 'Iowa', home: false, conference: true,
        result: { teamScore: 10, opponentScore: 31 }, booster: null,
        stats: {
          completions: 6, attempts: 14, passingYards: 64, passingYac: 28,
          passingTd: 1, interceptions: 1, carries: 2, rushingYards: 9,
          rushingTd: 0, rushingLong: 5, sacks: 2, fumbles: 0,
          passingAvg: 10.7, rating: 50.9, rushingAvg: 4.5
        },
        bigPlays: [
          '2 yard passing touchdown'
        ] },
      { week: 13, date: '2021-11-27', kickoff: '2:30pm',
        opponent: 'Northwestern', home: true, conference: true,
        result: { teamScore: 23, opponentScore: 24 }, booster: null,
        stats: {
          completions: 5, attempts: 12, passingYards: 52, passingYac: 25,
          passingTd: 0, interceptions: 1, carries: 0, rushingYards: 0,
          rushingTd: 0, rushingLong: 0, sacks: 1, fumbles: 0,
          passingAvg: 10.4, rating: 20.1
        } },
    ],

    /* Sam Stogsdill — Ohio State */
    'sam-stogsdill': [
      { week:  1, date: '2021-09-02', kickoff: '8:00pm',
        opponent: 'Minnesota', home: false, conference: true,
        result: { teamScore: 27, opponentScore: 21 }, booster: null,
        stats: {
          carries: 15, rushingYards: 114, rushingTd: 1, rushingLong: 31,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 1, fumbles: 1,
          rushingAvg: 7.6, totalYards: 114, totalTd: 1
        },
        bigPlays: [
          '31 yard rushing touchdown'
        ] },
      { week:  2, date: '2021-09-11', kickoff: '12:00pm',
        opponent: 'Oregon', home: true, conference: false,
        result: { teamScore: 47, opponentScore: 30 }, booster: null,
        stats: {
          carries: 22, rushingYards: 100, rushingTd: 0, rushingLong: 13,
          receptions: 1, receivingYards: 9, receivingYac: 8,
          receivingTd: 0, receivingLong: 9, targets: 1, fumbles: 0,
          rushingAvg: 4.5, receivingAvg: 9, totalYards: 109, totalTd: 0
        } },
      { week:  3, date: '2021-09-18', kickoff: '3:30pm',
        opponent: 'Tulsa', home: true, conference: false,
        result: { teamScore: 48, opponentScore: 21 }, booster: null,
        stats: {
          carries: 15, rushingYards: 73, rushingTd: 2, rushingLong: 11,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 2, fumbles: 0,
          rushingAvg: 4.9, totalYards: 73, totalTd: 2
        },
        bigPlays: [
          '1 yard rushing touchdown',
          '1 yard rushing touchdown'
        ] },
      { week:  4, date: '2021-09-25', kickoff: '7:30pm',
        opponent: 'Akron', home: true, conference: false,
        result: { teamScore: 69, opponentScore: 0 }, booster: null,
        stats: {
          carries: 8, rushingYards: 55, rushingTd: 1, rushingLong: 15,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 1, fumbles: 0,
          rushingAvg: 6.9, totalYards: 55, totalTd: 1
        },
        bigPlays: [
          '1 yard rushing touchdown'
        ] },
      { week:  5, date: '2021-10-02', kickoff: '3:30pm',
        opponent: 'Rutgers', home: false, conference: true,
        result: { teamScore: 34, opponentScore: 21 }, booster: null,
        stats: {
          carries: 18, rushingYards: 116, rushingTd: 1, rushingLong: 32,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 0,
          rushingAvg: 6.4, totalYards: 116, totalTd: 1
        },
        bigPlays: [
          '11 yard rushing touchdown'
        ] },
      { week:  6, date: '2021-10-09', kickoff: '12:00pm',
        opponent: 'Maryland', home: true, conference: true,
        result: { teamScore: 41, opponentScore: 31 }, booster: null,
        stats: {
          carries: 15, rushingYards: 100, rushingTd: 1, rushingLong: 11,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 1, fumbles: 0,
          rushingAvg: 6.7, totalYards: 100, totalTd: 1
        },
        bigPlays: [
          '2 yard rushing touchdown'
        ] },
      { week:  8, date: '2021-10-23', kickoff: '7:30pm',
        opponent: 'Indiana', home: false, conference: true,
        result: { teamScore: 43, opponentScore: 7 }, booster: null,
        stats: {
          carries: 19, rushingYards: 115, rushingTd: 2, rushingLong: 16,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 0,
          rushingAvg: 6.1, totalYards: 115, totalTd: 2
        },
        bigPlays: [
          '4 yard rushing touchdown',
          '2 yard rushing touchdown'
        ] },
      { week:  9, date: '2021-10-30', kickoff: '7:30pm',
        opponent: 'Penn State', home: true, conference: true,
        result: { teamScore: 31, opponentScore: 38 }, booster: null,
        stats: {
          carries: 18, rushingYards: 123, rushingTd: 3, rushingLong: 31,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 1, fumbles: 0,
          rushingAvg: 6.8, totalYards: 123, totalTd: 3
        },
        bigPlays: [
          '31 yard rushing touchdown',
          '11 yard rushing touchdown',
          '5 yard rushing touchdown'
        ] },
      { week: 10, date: '2021-11-06', kickoff: '12:00pm',
        opponent: 'Nebraska', home: false, conference: true,
        result: { teamScore: 41, opponentScore: 29 }, booster: null,
        stats: {
          carries: 12, rushingYards: 88, rushingTd: 2, rushingLong: 19,
          receptions: 1, receivingYards: 2, receivingYac: 2,
          receivingTd: 0, receivingLong: 2, targets: 1, fumbles: 0,
          rushingAvg: 7.3, receivingAvg: 2, totalYards: 90, totalTd: 2
        },
        bigPlays: [
          '4 yard rushing touchdown',
          '3 yard rushing touchdown'
        ] },
      { week: 11, date: '2021-11-13', kickoff: '3:30pm',
        opponent: 'Purdue', home: true, conference: true,
        result: { teamScore: 44, opponentScore: 36 }, booster: null,
        stats: {
          carries: 21, rushingYards: 224, rushingTd: 1, rushingLong: 82,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 0,
          rushingAvg: 10.7, totalYards: 224, totalTd: 1
        },
        bigPlays: [
          '1 yard rushing touchdown'
        ] },
      { week: 12, date: '2021-11-20', kickoff: '12:00pm',
        opponent: 'Michigan State', home: true, conference: true,
        result: { teamScore: 51, opponentScore: 20 }, booster: null,
        stats: {
          carries: 14, rushingYards: 84, rushingTd: 1, rushingLong: 19,
          receptions: 2, receivingYards: 32, receivingYac: 25,
          receivingTd: 0, receivingLong: 18, targets: 2, fumbles: 0,
          rushingAvg: 6, receivingAvg: 16, totalYards: 116, totalTd: 1
        },
        bigPlays: [
          '1 yard rushing touchdown'
        ] },
      { week: 13, date: '2021-11-27', kickoff: '12:00pm',
        opponent: 'Michigan', home: false, conference: true,
        result: { teamScore: 43, opponentScore: 24 }, booster: null,
        stats: {
          carries: 22, rushingYards: 170, rushingTd: 0, rushingLong: 58,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 0,
          rushingAvg: 7.7, totalYards: 170, totalTd: 0
        } },
    ],

    /* Jaykeb Stewart — Ohio State */
    'jaykeb-stewart': [
      { week:  1, date: '2021-09-02', kickoff: '8:00pm',
        opponent: 'Minnesota', home: false, conference: true,
        result: { teamScore: 27, opponentScore: 21 }, booster: null,
        stats: {
          completions: 25, attempts: 38, passingYards: 375,
          passingYac: 167, passingTd: 2, interceptions: 0, carries: 4,
          rushingYards: 2, rushingTd: 0, rushingLong: 4, sacks: 2,
          fumbles: 0, passingAvg: 15, rating: 115.6, rushingAvg: 0.5
        },
        bigPlays: [
          '34 yard passing touchdown',
          '32 yard passing touchdown'
        ] },
      { week:  2, date: '2021-09-11', kickoff: '12:00pm',
        opponent: 'Oregon', home: true, conference: false,
        result: { teamScore: 47, opponentScore: 30 }, booster: null,
        stats: {
          completions: 25, attempts: 35, passingYards: 345,
          passingYac: 109, passingTd: 4, interceptions: 0, carries: 1,
          rushingYards: 6, rushingTd: 1, rushingLong: 6, sacks: 1,
          fumbles: 0, passingAvg: 13.8, rating: 140.8, rushingAvg: 6
        },
        bigPlays: [
          '68 yard passing touchdown',
          '32 yard passing touchdown',
          '6 yard rushing touchdown',
          '5 yard passing touchdown',
          '2 yard passing touchdown'
        ] },
      { week:  3, date: '2021-09-18', kickoff: '3:30pm',
        opponent: 'Tulsa', home: true, conference: false,
        result: { teamScore: 48, opponentScore: 21 }, booster: null,
        stats: {
          completions: 19, attempts: 27, passingYards: 188,
          passingYac: 94, passingTd: 4, interceptions: 0, carries: 2,
          rushingYards: 10, rushingTd: 0, rushingLong: 6, sacks: 1,
          fumbles: 0, passingAvg: 9.9, rating: 129.3, rushingAvg: 5
        },
        bigPlays: [
          '22 yard passing touchdown',
          '20 yard passing touchdown',
          '11 yard passing touchdown',
          '1 yard passing touchdown'
        ] },
      { week:  4, date: '2021-09-25', kickoff: '7:30pm',
        opponent: 'Akron', home: true, conference: false,
        result: { teamScore: 69, opponentScore: 0 }, booster: null,
        stats: {
          completions: 17, attempts: 26, passingYards: 244,
          passingYac: 125, passingTd: 5, interceptions: 1, carries: 3,
          rushingYards: 12, rushingTd: 0, rushingLong: 5, sacks: 2,
          fumbles: 0, passingAvg: 14.4, rating: 119.2, rushingAvg: 4
        },
        bigPlays: [
          '38 yard passing touchdown',
          '22 yard passing touchdown',
          '11 yard passing touchdown',
          '2 yard passing touchdown',
          '1 yard passing touchdown'
        ] },
      { week:  5, date: '2021-10-02', kickoff: '3:30pm',
        opponent: 'Rutgers', home: false, conference: true,
        result: { teamScore: 34, opponentScore: 21 }, booster: null,
        stats: {
          completions: 21, attempts: 33, passingYards: 357,
          passingYac: 103, passingTd: 2, interceptions: 0, carries: 3,
          rushingYards: 13, rushingTd: 0, rushingLong: 5, sacks: 0,
          fumbles: 0, passingAvg: 17, rating: 120.4, rushingAvg: 4.3
        },
        bigPlays: [
          '31 yard passing touchdown',
          '3 yard passing touchdown'
        ] },
      { week:  6, date: '2021-10-09', kickoff: '12:00pm',
        opponent: 'Maryland', home: true, conference: true,
        result: { teamScore: 41, opponentScore: 31 }, booster: null,
        stats: {
          completions: 28, attempts: 36, passingYards: 365,
          passingYac: 167, passingTd: 3, interceptions: 0, carries: 2,
          rushingYards: 12, rushingTd: 0, rushingLong: 7, sacks: 1,
          fumbles: 0, passingAvg: 13, rating: 136.7, rushingAvg: 6
        },
        bigPlays: [
          '27 yard passing touchdown',
          '20 yard passing touchdown',
          '1 yard passing touchdown'
        ] },
      { week:  8, date: '2021-10-23', kickoff: '7:30pm',
        opponent: 'Indiana', home: false, conference: true,
        result: { teamScore: 43, opponentScore: 7 }, booster: null,
        stats: {
          completions: 16, attempts: 26, passingYards: 256,
          passingYac: 103, passingTd: 3, interceptions: 1, carries: 2,
          rushingYards: 6, rushingTd: 0, rushingLong: 4, sacks: 0,
          fumbles: 0, passingAvg: 16, rating: 116.8, rushingAvg: 3
        },
        bigPlays: [
          '11 yard passing touchdown',
          '6 yard passing touchdown',
          '1 yard passing touchdown'
        ] },
      { week:  9, date: '2021-10-30', kickoff: '7:30pm',
        opponent: 'Penn State', home: true, conference: true,
        result: { teamScore: 31, opponentScore: 38 }, booster: null,
        stats: {
          completions: 18, attempts: 37, passingYards: 189,
          passingYac: 80, passingTd: 1, interceptions: 0, carries: 7,
          rushingYards: 28, rushingTd: 0, rushingLong: 10, sacks: 0,
          fumbles: 0, passingAvg: 10.5, rating: 72.9, rushingAvg: 4
        },
        bigPlays: [
          '24 yard passing touchdown'
        ] },
      { week: 10, date: '2021-11-06', kickoff: '12:00pm',
        opponent: 'Nebraska', home: false, conference: true,
        result: { teamScore: 41, opponentScore: 29 }, booster: null,
        stats: {
          completions: 23, attempts: 32, passingYards: 218,
          passingYac: 120, passingTd: 3, interceptions: 0, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, sacks: 2,
          fumbles: 0, passingAvg: 9.5, rating: 121.6
        },
        bigPlays: [
          '8 yard passing touchdown',
          '3 yard passing touchdown',
          '1 yard passing touchdown'
        ] },
      { week: 11, date: '2021-11-13', kickoff: '3:30pm',
        opponent: 'Purdue', home: true, conference: true,
        result: { teamScore: 44, opponentScore: 36 }, booster: null,
        stats: {
          completions: 28, attempts: 40, passingYards: 400,
          passingYac: 206, passingTd: 4, interceptions: 0, carries: 3,
          rushingYards: 11, rushingTd: 0, rushingLong: 6, sacks: 2,
          fumbles: 0, passingAvg: 14.3, rating: 135.4, rushingAvg: 3.7
        },
        bigPlays: [
          '55 yard passing touchdown',
          '23 yard passing touchdown',
          '20 yard passing touchdown',
          '8 yard passing touchdown'
        ] },
      { week: 12, date: '2021-11-20', kickoff: '12:00pm',
        opponent: 'Michigan State', home: true, conference: true,
        result: { teamScore: 51, opponentScore: 20 }, booster: null,
        stats: {
          completions: 13, attempts: 20, passingYards: 180,
          passingYac: 101, passingTd: 2, interceptions: 1, carries: 4,
          rushingYards: 0, rushingTd: 0, rushingLong: 4, sacks: 1,
          fumbles: 0, passingAvg: 13.8, rating: 106.3, rushingAvg: 0
        },
        bigPlays: [
          '22 yard passing touchdown',
          '2 yard passing touchdown'
        ] },
      { week: 13, date: '2021-11-27', kickoff: '12:00pm',
        opponent: 'Michigan', home: false, conference: true,
        result: { teamScore: 43, opponentScore: 24 }, booster: null,
        stats: {
          completions: 23, attempts: 32, passingYards: 289,
          passingYac: 155, passingTd: 4, interceptions: 1, carries: 2,
          rushingYards: 2, rushingTd: 0, rushingLong: 3, sacks: 2,
          fumbles: 0, passingAvg: 12.6, rating: 126.2, rushingAvg: 1
        },
        bigPlays: [
          '21 yard passing touchdown',
          '20 yard passing touchdown',
          '6 yard passing touchdown',
          '2 yard passing touchdown'
        ] },
    ],
  }
};
