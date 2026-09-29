/* ==========================================================================
   EGE Football — the 2020 season
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
   DNP Injured: Bruised Shoulder, in place of his stat line.

   `neutral: true` marks a game at a neutral site — listed as vs, and home
   is false because it is nobody's. A kickoff of null is one that has not
   been set yet; it shows as a dash until it is.
   ========================================================================== */

window.EGE = window.EGE || {};
EGE.stats = EGE.stats || {};

EGE.stats[2020] = {
  season: 2020,
  level: 'College football',

  games: {

    /* Andrew Parr — Alabama */
    'andrew-parr': [
      { week:  1, date: '2020-09-05', kickoff: null,
        opponent: 'USC', home: false, conference: false, neutral: true,
        result: { teamScore: 58, opponentScore: 16 }, booster: null,
        stats: {
          receptions: 2, receivingYards: 18, receivingYac: 6,
          receivingTd: 1, receivingLong: 12, targets: 2, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 9, totalYards: 18, totalTd: 1
        },
        bigPlays: [
          '6 yard receiving touchdown'
        ] },
      { week:  2, date: '2020-09-12', kickoff: null,
        opponent: 'Georgia State', home: true, conference: false,
        result: { teamScore: 57, opponentScore: 19 }, booster: null,
        stats: {
          receptions: 2, receivingYards: 15, receivingYac: 6,
          receivingTd: 1, receivingLong: 11, targets: 2, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 7.5, totalYards: 15, totalTd: 1
        },
        bigPlays: [
          '4 yard receiving touchdown'
        ] },
      { week:  3, date: '2020-09-19', kickoff: null,
        opponent: 'Georgia', home: true, conference: true,
        result: { teamScore: 35, opponentScore: 24 }, booster: null,
        stats: {
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          totalYards: 0, totalTd: 0
        } },
      { week:  4, date: '2020-09-26', kickoff: null,
        opponent: 'Kent State', home: true, conference: false,
        result: { teamScore: 65, opponentScore: 9 }, booster: null,
        stats: {
          receptions: 3, receivingYards: 77, receivingYac: 31,
          receivingTd: 0, receivingLong: 41, targets: 4, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 25.7, totalYards: 77, totalTd: 0
        } },
      { week:  5, date: '2020-10-03', kickoff: null,
        opponent: 'Ole Miss', home: false, conference: true,
        result: { teamScore: 48, opponentScore: 31 }, booster: null,
        stats: {
          receptions: 2, receivingYards: 18, receivingYac: 7,
          receivingTd: 1, receivingLong: 17, targets: 3, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 9, totalYards: 18, totalTd: 1
        },
        bigPlays: [
          '1 yard receiving touchdown'
        ] },
      { week:  6, date: '2020-10-10', kickoff: null,
        opponent: 'Arkansas', home: false, conference: true,
        result: { teamScore: 46, opponentScore: 24 }, booster: null,
        stats: {
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 1, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          totalYards: 0, totalTd: 0
        } },
      { week:  7, date: '2020-10-17', kickoff: null,
        opponent: 'Mississippi State', home: true, conference: true,
        result: { teamScore: 49, opponentScore: 21 }, booster: null,
        stats: {
          receptions: 2, receivingYards: 25, receivingYac: 12,
          receivingTd: 0, receivingLong: 21, targets: 2, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 12.5, totalYards: 25, totalTd: 0
        } },
      { week:  8, date: '2020-10-24', kickoff: null,
        opponent: 'Tennessee', home: false, conference: true,
        result: { teamScore: 35, opponentScore: 21 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 62, receivingYac: 35,
          receivingTd: 0, receivingLong: 22, targets: 5, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 12.4, totalYards: 62, totalTd: 0
        } },
      { week: 10, date: '2020-11-07', kickoff: null,
        opponent: 'LSU', home: false, conference: true,
        result: { teamScore: 48, opponentScore: 28 }, booster: null,
        stats: {
          receptions: 3, receivingYards: 44, receivingYac: 17,
          receivingTd: 0, receivingLong: 16, targets: 3, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 14.7, totalYards: 44, totalTd: 0
        } },
      { week: 11, date: '2020-11-14', kickoff: null,
        opponent: 'UT Martin', home: true, conference: false,
        result: { teamScore: 55, opponentScore: 0 }, booster: null,
        stats: {
          receptions: 1, receivingYards: 5, receivingYac: 2,
          receivingTd: 0, receivingLong: 5, targets: 3, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 5, totalYards: 5, totalTd: 0
        } },
      { week: 12, date: '2020-11-21', kickoff: null,
        opponent: 'Texas A&M', home: true, conference: true,
        result: { teamScore: 47, opponentScore: 13 }, booster: null,
        stats: {
          receptions: 3, receivingYards: 28, receivingYac: 12,
          receivingTd: 0, receivingLong: 12, targets: 3, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 9.3, totalYards: 28, totalTd: 0
        } },
      { week: 13, date: '2020-11-28', kickoff: null,
        opponent: 'Auburn', home: true, conference: true,
        result: { teamScore: 27, opponentScore: 28 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 57, receivingYac: 28,
          receivingTd: 0, receivingLong: 26, targets: 4, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 14.3, totalYards: 57, totalTd: 0
        } },
    ],

    /* Cooper Clark — USC */
    'cooper-clark': [
      { week:  1, date: '2020-09-05', kickoff: null,
        opponent: 'Alabama', home: false, conference: false, neutral: true,
        result: { teamScore: 16, opponentScore: 58 }, booster: null,
        stats: {
          carries: 4, rushingYards: 12, rushingTd: 0, rushingLong: 6,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 1, fumbles: 0,
          rushingAvg: 3, totalYards: 12, totalTd: 0
        } },
      { week:  2, date: '2020-09-12', kickoff: null,
        opponent: 'New Mexico', home: true, conference: false,
        result: { teamScore: 45, opponentScore: 13 }, booster: null,
        stats: {
          carries: 6, rushingYards: 24, rushingTd: 0, rushingLong: 9,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 0,
          rushingAvg: 4, totalYards: 24, totalTd: 0
        } },
      { week:  3, date: '2020-09-19', kickoff: null,
        opponent: 'Stanford', home: false, conference: true,
        result: { teamScore: 43, opponentScore: 30 }, booster: null,
        stats: {
          carries: 5, rushingYards: 29, rushingTd: 0, rushingLong: 9,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 1, fumbles: 0,
          rushingAvg: 5.8, totalYards: 29, totalTd: 0
        } },
      { week:  4, date: '2020-09-26', kickoff: null,
        opponent: 'Arizona State', home: true, conference: true,
        result: { teamScore: 31, opponentScore: 37 }, booster: null,
        stats: {
          carries: 1, rushingYards: 21, rushingTd: 0, rushingLong: 21,
          receptions: 1, receivingYards: 5, receivingYac: 3,
          receivingTd: 0, receivingLong: 5, targets: 1, fumbles: 0,
          rushingAvg: 21, receivingAvg: 5, totalYards: 26, totalTd: 0
        } },
      { week:  5, date: '2020-10-02', kickoff: null,
        opponent: 'Utah', home: false, conference: true,
        result: { teamScore: 21, opponentScore: 24 }, booster: null,
        stats: {
          carries: 4, rushingYards: 12, rushingTd: 0, rushingLong: 9,
          receptions: 1, receivingYards: 5, receivingYac: 4,
          receivingTd: 0, receivingLong: 5, targets: 1, fumbles: 0,
          rushingAvg: 3, receivingAvg: 5, totalYards: 17, totalTd: 0
        } },
      { week:  6, date: '2020-10-10', kickoff: null,
        opponent: 'California', home: true, conference: true,
        result: { teamScore: 38, opponentScore: 10 }, booster: null,
        stats: {
          carries: 4, rushingYards: 44, rushingTd: 0, rushingLong: 31,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 0,
          rushingAvg: 11, totalYards: 44, totalTd: 0
        } },
      { week:  7, date: '2020-10-17', kickoff: null,
        opponent: 'Arizona', home: false, conference: true,
        result: { teamScore: 44, opponentScore: 10 }, booster: null,
        stats: {
          carries: 8, rushingYards: 42, rushingTd: 1, rushingLong: 21,
          receptions: 1, receivingYards: 10, receivingYac: 7,
          receivingTd: 0, receivingLong: 10, targets: 1, fumbles: 0,
          rushingAvg: 5.3, receivingAvg: 10, totalYards: 52, totalTd: 1
        },
        bigPlays: [
          '21 yard rushing touchdown'
        ] },
      { week:  9, date: '2020-10-31', kickoff: null,
        opponent: 'Colorado', home: true, conference: true,
        result: { teamScore: 41, opponentScore: 14 }, booster: null,
        stats: {
          carries: 6, rushingYards: 13, rushingTd: 0, rushingLong: 6,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 1, fumbles: 0,
          rushingAvg: 2.2, totalYards: 13, totalTd: 0
        } },
      { week: 10, date: '2020-11-07', kickoff: null,
        opponent: 'Oregon', home: false, conference: true,
        result: { teamScore: 28, opponentScore: 27 }, booster: null,
        stats: {
          carries: 4, rushingYards: 7, rushingTd: 0, rushingLong: 3,
          receptions: 1, receivingYards: 1, receivingYac: 1,
          receivingTd: 0, receivingLong: 1, targets: 1, fumbles: 0,
          rushingAvg: 1.8, receivingAvg: 1, totalYards: 8, totalTd: 0
        } },
      { week: 11, date: '2020-11-14', kickoff: null,
        opponent: 'Washington', home: true, conference: true,
        result: { teamScore: 31, opponentScore: 20 }, booster: null,
        stats: {
          carries: 3, rushingYards: 18, rushingTd: 0, rushingLong: 7,
          receptions: 1, receivingYards: 2, receivingYac: 2,
          receivingTd: 0, receivingLong: 2, targets: 1, fumbles: 0,
          rushingAvg: 6, receivingAvg: 2, totalYards: 20, totalTd: 0
        } },
      { week: 12, date: '2020-11-21', kickoff: null,
        opponent: 'UCLA', home: false, conference: true,
        result: { teamScore: 28, opponentScore: 50 }, booster: null,
        stats: {
          carries: 4, rushingYards: 11, rushingTd: 1, rushingLong: 6,
          receptions: 1, receivingYards: 11, receivingYac: 10,
          receivingTd: 0, receivingLong: 11, targets: 1, fumbles: 0,
          rushingAvg: 2.8, receivingAvg: 11, totalYards: 22, totalTd: 1
        },
        bigPlays: [
          '6 yard rushing touchdown'
        ] },
      { week: 13, date: '2020-11-28', kickoff: null,
        opponent: 'Notre Dame', home: true, conference: false,
        result: { teamScore: 34, opponentScore: 33 }, booster: null,
        stats: {
          carries: 3, rushingYards: 4, rushingTd: 0, rushingLong: 3,
          receptions: 1, receivingYards: 6, receivingYac: 6,
          receivingTd: 0, receivingLong: 6, targets: 1, fumbles: 0,
          rushingAvg: 1.3, receivingAvg: 6, totalYards: 10, totalTd: 0
        } },
    ],

    /* Paxon Hatch — North Dakota State */
    'paxon-hatch': [
      { week:  1, date: '2020-09-05', kickoff: null,
        opponent: 'Oregon', home: false, conference: false,
        result: { teamScore: 13, opponentScore: 26 }, booster: null,
        stats: {
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 2, carries: 1,
          rushingYards: 21, rushingTd: 0, rushingLong: 21, fumbles: 0,
          rushingAvg: 21, totalYards: 21, totalTd: 0
        } },
      { week:  2, date: '2020-09-12', kickoff: null,
        opponent: 'Drake', home: true, conference: false,
        result: { teamScore: 30, opponentScore: 13 }, booster: null,
        stats: {
          receptions: 8, receivingYards: 182, receivingYac: 64,
          receivingTd: 1, receivingLong: 52, targets: 8, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 22.8, totalYards: 182, totalTd: 1
        },
        bigPlays: [
          '52 yard receiving touchdown'
        ] },
      { week:  3, date: '2020-09-19', kickoff: null,
        opponent: 'North Carolina A&T', home: true, conference: false,
        result: { teamScore: 45, opponentScore: 24 }, booster: null,
        stats: {
          receptions: 2, receivingYards: 38, receivingYac: 14,
          receivingTd: 2, receivingLong: 32, targets: 3, carries: 1,
          rushingYards: 5, rushingTd: 0, rushingLong: 5, fumbles: 0,
          rushingAvg: 5, receivingAvg: 19, totalYards: 43, totalTd: 2
        },
        bigPlays: [
          '32 yard receiving touchdown',
          '6 yard receiving touchdown'
        ] },
      { week:  4, date: '2020-09-26', kickoff: null,
        opponent: 'Northern Iowa', home: false, conference: true,
        result: { teamScore: 23, opponentScore: 13 }, booster: null,
        stats: {
          receptions: 9, receivingYards: 150, receivingYac: 56,
          receivingTd: 1, receivingLong: 26, targets: 10, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 16.7, totalYards: 150, totalTd: 1
        },
        bigPlays: [
          '22 yard receiving touchdown'
        ] },
      { week:  5, date: '2020-10-03', kickoff: null,
        opponent: 'Illinois State', home: true, conference: true,
        result: { teamScore: 31, opponentScore: 14 }, booster: null,
        stats: {
          receptions: 3, receivingYards: 16, receivingYac: 6,
          receivingTd: 0, receivingLong: 7, targets: 3, carries: 1,
          rushingYards: 3, rushingTd: 0, rushingLong: 3, fumbles: 0,
          rushingAvg: 3, receivingAvg: 5.3, totalYards: 19, totalTd: 0
        } },
      { week:  6, date: '2020-10-10', kickoff: null,
        opponent: 'Indiana State', home: false, conference: true,
        result: { teamScore: 33, opponentScore: 0 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 66, receivingYac: 23,
          receivingTd: 1, receivingLong: 29, targets: 7, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 13.2, totalYards: 66, totalTd: 1
        },
        bigPlays: [
          '20 yard receiving touchdown'
        ] },
      { week:  7, date: '2020-10-17', kickoff: null,
        opponent: 'South Dakota State', home: true, conference: true,
        result: { teamScore: 35, opponentScore: 3 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 49, receivingYac: 14,
          receivingTd: 0, receivingLong: 21, targets: 6, carries: 1,
          rushingYards: 6, rushingTd: 0, rushingLong: 6, fumbles: 0,
          rushingAvg: 6, receivingAvg: 12.3, totalYards: 55, totalTd: 0
        } },
      { week:  8, date: '2020-10-24', kickoff: null,
        opponent: 'Youngstown State', home: true, conference: true,
        result: { teamScore: 45, opponentScore: 21 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 123, receivingYac: 45,
          receivingTd: 0, receivingLong: 47, targets: 6, carries: 1,
          rushingYards: 5, rushingTd: 0, rushingLong: 5, fumbles: 0,
          rushingAvg: 5, receivingAvg: 24.6, totalYards: 128, totalTd: 0
        } },
      { week:  9, date: '2020-10-31', kickoff: null,
        opponent: 'Missouri State', home: false, conference: true,
        result: { teamScore: 45, opponentScore: 3 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 106, receivingYac: 42,
          receivingTd: 1, receivingLong: 35, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 21.2, totalYards: 106, totalTd: 1
        },
        bigPlays: [
          '22 yard receiving touchdown'
        ] },
      { week: 11, date: '2020-11-14', kickoff: null,
        opponent: 'North Dakota', home: true, conference: true,
        result: { teamScore: 52, opponentScore: 10 }, booster: null,
        stats: {
          receptions: 1, receivingYards: 1, receivingYac: 0,
          receivingTd: 1, receivingLong: 1, targets: 3, carries: 1,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          rushingAvg: 0, receivingAvg: 1, totalYards: 1, totalTd: 1
        },
        bigPlays: [
          '1 yard receiving touchdown'
        ] },
      { week: 12, date: '2020-11-21', kickoff: null,
        opponent: 'South Dakota', home: false, conference: true,
        result: { teamScore: 41, opponentScore: 7 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 62, receivingYac: 22,
          receivingTd: 1, receivingLong: 43, targets: 5, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 12.4, totalYards: 62, totalTd: 1
        },
        bigPlays: [
          '43 yard receiving touchdown'
        ] },
    ],

    /* Isaac Vitel — Illinois */
    'isaac-vitel': [
      { week:  1, date: '2020-09-04', kickoff: null,
        opponent: 'Illinois State', home: true, conference: false,
        result: { teamScore: 27, opponentScore: 0 }, booster: null,
        stats: {
          completions: 3, attempts: 5, passingYards: 33, passingYac: 16,
          passingTd: 0, interceptions: 0, carries: 1, rushingYards: 3,
          rushingTd: 0, rushingLong: 3, sacks: 0, fumbles: 0,
          passingAvg: 11, rating: 79.6, rushingAvg: 3
        } },
      { week:  2, date: '2020-09-12', kickoff: null,
        opponent: 'UConn', home: true, conference: false,
        result: { teamScore: 27, opponentScore: 6 }, booster: null,
        stats: {
          completions: 0, attempts: 0, passingYards: 0, passingYac: 0,
          passingTd: 0, interceptions: 0, carries: 0, rushingYards: 0,
          rushingTd: 0, rushingLong: 0, sacks: 0, fumbles: 0
        } },
      { week:  3, date: '2020-09-19', kickoff: null,
        opponent: 'Bowling Green', home: true, conference: false,
        result: { teamScore: 48, opponentScore: 7 }, booster: null,
        stats: {
          completions: 2, attempts: 5, passingYards: 23, passingYac: 8,
          passingTd: 0, interceptions: 0, carries: 3, rushingYards: 6,
          rushingTd: 0, rushingLong: 3, sacks: 0, fumbles: 0,
          passingAvg: 11.5, rating: 54.6, rushingAvg: 2
        } },
      { week:  5, date: '2020-10-03', kickoff: null,
        opponent: 'Rutgers', home: false, conference: true,
        result: { teamScore: 38, opponentScore: 12 }, booster: null,
        stats: {
          completions: 0, attempts: 0, passingYards: 0, passingYac: 0,
          passingTd: 0, interceptions: 0, carries: 0, rushingYards: 0,
          rushingTd: 0, rushingLong: 0, sacks: 0, fumbles: 0
        } },
      { week:  6, date: '2020-10-10', kickoff: null,
        opponent: 'Nebraska', home: false, conference: true,
        result: { teamScore: 16, opponentScore: 28 }, booster: null,
        stats: {
          completions: 0, attempts: 0, passingYards: 0, passingYac: 0,
          passingTd: 0, interceptions: 0, carries: 0, rushingYards: 0,
          rushingTd: 0, rushingLong: 0, sacks: 0, fumbles: 0
        } },
      { week:  7, date: '2020-10-17', kickoff: null,
        opponent: 'Purdue', home: true, conference: true,
        result: { teamScore: 21, opponentScore: 38 }, booster: null,
        stats: {
          completions: 0, attempts: 0, passingYards: 0, passingYac: 0,
          passingTd: 0, interceptions: 0, carries: 0, rushingYards: 0,
          rushingTd: 0, rushingLong: 0, sacks: 0, fumbles: 0
        } },
      { week:  8, date: '2020-10-24', kickoff: null,
        opponent: 'Minnesota', home: true, conference: true,
        result: { teamScore: 29, opponentScore: 23 }, booster: null,
        stats: {
          completions: 0, attempts: 0, passingYards: 0, passingYac: 0,
          passingTd: 0, interceptions: 0, carries: 0, rushingYards: 0,
          rushingTd: 0, rushingLong: 0, sacks: 0, fumbles: 0
        } },
      { week:  9, date: '2020-10-31', kickoff: null,
        opponent: 'Wisconsin', home: false, conference: true,
        result: { teamScore: 30, opponentScore: 44 }, booster: null,
        stats: {
          completions: 0, attempts: 0, passingYards: 0, passingYac: 0,
          passingTd: 0, interceptions: 0, carries: 0, rushingYards: 0,
          rushingTd: 0, rushingLong: 0, sacks: 0, fumbles: 0
        } },
      { week: 10, date: '2020-11-07', kickoff: null,
        opponent: 'Iowa', home: true, conference: true,
        result: { teamScore: 13, opponentScore: 28 }, booster: null,
        stats: {
          completions: 0, attempts: 0, passingYards: 0, passingYac: 0,
          passingTd: 0, interceptions: 0, carries: 0, rushingYards: 0,
          rushingTd: 0, rushingLong: 0, sacks: 0, fumbles: 0
        } },
      { week: 11, date: '2020-11-14', kickoff: null,
        opponent: 'Indiana', home: false, conference: true,
        result: { teamScore: 28, opponentScore: 24 }, booster: null,
        stats: {
          completions: 0, attempts: 0, passingYards: 0, passingYac: 0,
          passingTd: 0, interceptions: 0, carries: 0, rushingYards: 0,
          rushingTd: 0, rushingLong: 0, sacks: 0, fumbles: 0
        } },
      { week: 12, date: '2020-11-21', kickoff: null,
        opponent: 'Ohio State', home: true, conference: true,
        result: { teamScore: 19, opponentScore: 41 }, booster: null,
        stats: {
          completions: 0, attempts: 0, passingYards: 0, passingYac: 0,
          passingTd: 0, interceptions: 0, carries: 0, rushingYards: 0,
          rushingTd: 0, rushingLong: 0, sacks: 0, fumbles: 0
        } },
      { week: 13, date: '2020-11-28', kickoff: null,
        opponent: 'Northwestern', home: false, conference: true,
        result: { teamScore: 17, opponentScore: 38 }, booster: null,
        stats: {
          completions: 0, attempts: 0, passingYards: 0, passingYac: 0,
          passingTd: 0, interceptions: 0, carries: 0, rushingYards: 0,
          rushingTd: 0, rushingLong: 0, sacks: 0, fumbles: 0
        } },
    ],

    /* Sam Stogsdill — Ohio State */
    'sam-stogsdill': [
      { week:  1, date: '2020-09-05', kickoff: null,
        opponent: 'Bowling Green', home: true, conference: false,
        result: { teamScore: 71, opponentScore: 0 }, booster: null,
        stats: {
          carries: 10, rushingYards: 95, rushingTd: 1, rushingLong: 32,
          receptions: 1, receivingYards: 11, receivingYac: 8,
          receivingTd: 0, receivingLong: 11, targets: 1, fumbles: 0,
          rushingAvg: 9.5, receivingAvg: 11, totalYards: 106, totalTd: 1
        },
        bigPlays: [
          '5 yard rushing touchdown'
        ] },
      { week:  2, date: '2020-09-12', kickoff: null,
        opponent: 'Oregon', home: false, conference: false,
        result: { teamScore: 37, opponentScore: 20 }, booster: null,
        stats: {
          carries: 3, rushingYards: 19, rushingTd: 0, rushingLong: 8,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 0,
          rushingAvg: 6.3, totalYards: 19, totalTd: 0
        } },
      { week:  3, date: '2020-09-19', kickoff: null,
        opponent: 'Buffalo', home: true, conference: false,
        result: { teamScore: 54, opponentScore: 20 }, booster: null,
        stats: {
          carries: 5, rushingYards: 17, rushingTd: 1, rushingLong: 8,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 0,
          rushingAvg: 3.4, totalYards: 17, totalTd: 1
        },
        bigPlays: [
          '8 yard rushing touchdown'
        ] },
      { week:  4, date: '2020-09-26', kickoff: null,
        opponent: 'Rutgers', home: true, conference: true,
        result: { teamScore: 51, opponentScore: 0 }, booster: null,
        stats: {
          carries: 11, rushingYards: 126, rushingTd: 0, rushingLong: 85,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 0,
          rushingAvg: 11.5, totalYards: 126, totalTd: 0
        } },
      { week:  6, date: '2020-10-10', kickoff: null,
        opponent: 'Iowa', home: true, conference: true,
        result: { teamScore: 34, opponentScore: 21 }, booster: null,
        stats: {
          carries: 2, rushingYards: 4, rushingTd: 0, rushingLong: 2,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 0,
          rushingAvg: 2, totalYards: 4, totalTd: 0
        } },
      { week:  7, date: '2020-10-17', kickoff: null,
        opponent: 'Michigan State', home: false, conference: true,
        result: { teamScore: 42, opponentScore: 14 }, booster: null,
        stats: {
          carries: 6, rushingYards: 31, rushingTd: 0, rushingLong: 9,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 0,
          rushingAvg: 5.2, totalYards: 31, totalTd: 0
        } },
      { week:  8, date: '2020-10-24', kickoff: null,
        opponent: 'Penn State', home: false, conference: true,
        result: { teamScore: 38, opponentScore: 24 }, booster: null,
        stats: {
          carries: 4, rushingYards: 16, rushingTd: 1, rushingLong: 8,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 0,
          rushingAvg: 4, totalYards: 16, totalTd: 1
        },
        bigPlays: [
          '6 yard rushing touchdown'
        ] },
      { week:  9, date: '2020-10-31', kickoff: null,
        opponent: 'Nebraska', home: true, conference: true,
        result: { teamScore: 53, opponentScore: 12 }, booster: null,
        stats: {
          carries: 6, rushingYards: 20, rushingTd: 0, rushingLong: 11,
          receptions: 1, receivingYards: 2, receivingYac: 2,
          receivingTd: 0, receivingLong: 2, targets: 1, fumbles: 0,
          rushingAvg: 3.3, receivingAvg: 2, totalYards: 22, totalTd: 0
        } },
      { week: 10, date: '2020-11-07', kickoff: null,
        opponent: 'Indiana', home: true, conference: true,
        result: { teamScore: 44, opponentScore: 0 }, booster: null,
        stats: {
          carries: 7, rushingYards: 54, rushingTd: 0, rushingLong: 31,
          receptions: 1, receivingYards: 8, receivingYac: 8,
          receivingTd: 0, receivingLong: 8, targets: 1, fumbles: 0,
          rushingAvg: 7.7, receivingAvg: 8, totalYards: 62, totalTd: 0
        } },
      { week: 11, date: '2020-11-14', kickoff: null,
        opponent: 'Maryland', home: false, conference: true,
        result: { teamScore: 42, opponentScore: 21 }, booster: null,
        stats: {
          carries: 6, rushingYards: 26, rushingTd: 0, rushingLong: 6,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 0,
          rushingAvg: 4.3, totalYards: 26, totalTd: 0
        } },
      { week: 12, date: '2020-11-21', kickoff: null,
        opponent: 'Illinois', home: false, conference: true,
        result: { teamScore: 41, opponentScore: 19 }, booster: null,
        stats: {
          carries: 5, rushingYards: 35, rushingTd: 0, rushingLong: 9,
          receptions: 1, receivingYards: 3, receivingYac: 2,
          receivingTd: 0, receivingLong: 3, targets: 1, fumbles: 0,
          rushingAvg: 7, receivingAvg: 3, totalYards: 38, totalTd: 0
        } },
      { week: 13, date: '2020-11-28', kickoff: null,
        opponent: 'Michigan', home: true, conference: true,
        result: { teamScore: 51, opponentScore: 24 }, booster: null,
        stats: {
          carries: 5, rushingYards: 33, rushingTd: 0, rushingLong: 8,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 0,
          rushingAvg: 6.6, totalYards: 33, totalTd: 0
        } },
    ],

    /* Jaykeb Stewart — Ohio State */
    'jaykeb-stewart': [
      { week:  1, date: '2020-09-05', kickoff: null,
        opponent: 'Bowling Green', home: true, conference: false,
        result: { teamScore: 71, opponentScore: 0 }, booster: null,
        stats: {
          completions: 8, attempts: 9, passingYards: 110, passingYac: 55,
          passingTd: 1, interceptions: 0, carries: 2, rushingYards: 9,
          rushingTd: 0, rushingLong: 5, sacks: 2, fumbles: 0,
          passingAvg: 13.8, rating: 154.6, rushingAvg: 4.5
        },
        bigPlays: [
          '28 yard passing touchdown'
        ] },
      { week:  2, date: '2020-09-12', kickoff: null,
        opponent: 'Oregon', home: false, conference: false,
        result: { teamScore: 37, opponentScore: 20 }, booster: null,
        stats: {
          completions: 0, attempts: 0, passingYards: 0, passingYac: 0,
          passingTd: 0, interceptions: 0, carries: 0, rushingYards: 0,
          rushingTd: 0, rushingLong: 0, sacks: 0, fumbles: 0
        } },
      { week:  3, date: '2020-09-19', kickoff: null,
        opponent: 'Buffalo', home: true, conference: false,
        result: { teamScore: 54, opponentScore: 20 }, booster: null,
        stats: {
          completions: 2, attempts: 3, passingYards: 13, passingYac: 6,
          passingTd: 1, interceptions: 0, carries: 1, rushingYards: 0,
          rushingTd: 0, rushingLong: 0, sacks: 0, fumbles: 0,
          passingAvg: 6.5, rating: 115.3, rushingAvg: 0
        },
        bigPlays: [
          '4 yard passing touchdown'
        ] },
      { week:  4, date: '2020-09-26', kickoff: null,
        opponent: 'Rutgers', home: true, conference: true,
        result: { teamScore: 51, opponentScore: 0 }, booster: null,
        stats: {
          completions: 5, attempts: 11, passingYards: 47, passingYac: 21,
          passingTd: 1, interceptions: 1, carries: 1, rushingYards: -3,
          rushingTd: 0, rushingLong: -3, sacks: 0, fumbles: 0,
          passingAvg: 9.4, rating: 50.2, rushingAvg: -3
        },
        bigPlays: [
          '2 yard passing touchdown'
        ] },
      { week:  6, date: '2020-10-10', kickoff: null,
        opponent: 'Iowa', home: true, conference: true,
        result: { teamScore: 34, opponentScore: 21 }, booster: null,
        stats: {
          completions: 0, attempts: 0, passingYards: 0, passingYac: 0,
          passingTd: 0, interceptions: 0, carries: 0, rushingYards: 0,
          rushingTd: 0, rushingLong: 0, sacks: 0, fumbles: 0
        } },
      { week:  7, date: '2020-10-17', kickoff: null,
        opponent: 'Michigan State', home: false, conference: true,
        result: { teamScore: 42, opponentScore: 14 }, booster: null,
        stats: {
          completions: 0, attempts: 0, passingYards: 0, passingYac: 0,
          passingTd: 0, interceptions: 0, carries: 0, rushingYards: 0,
          rushingTd: 0, rushingLong: 0, sacks: 0, fumbles: 0
        } },
      { week:  8, date: '2020-10-24', kickoff: null,
        opponent: 'Penn State', home: false, conference: true,
        result: { teamScore: 38, opponentScore: 24 }, booster: null,
        stats: {
          completions: 0, attempts: 0, passingYards: 0, passingYac: 0,
          passingTd: 0, interceptions: 0, carries: 0, rushingYards: 0,
          rushingTd: 0, rushingLong: 0, sacks: 0, fumbles: 0
        } },
      { week:  9, date: '2020-10-31', kickoff: null,
        opponent: 'Nebraska', home: true, conference: true,
        result: { teamScore: 53, opponentScore: 12 }, booster: null,
        stats: {
          completions: 4, attempts: 5, passingYards: 63, passingYac: 30,
          passingTd: 0, interceptions: 0, carries: 1, rushingYards: 0,
          rushingTd: 0, rushingLong: 0, sacks: 0, fumbles: 0,
          passingAvg: 15.8, rating: 118.8, rushingAvg: 0
        } },
      { week: 10, date: '2020-11-07', kickoff: null,
        opponent: 'Indiana', home: true, conference: true,
        result: { teamScore: 44, opponentScore: 0 }, booster: null,
        stats: {
          completions: 9, attempts: 9, passingYards: 146, passingYac: 67,
          passingTd: 1, interceptions: 0, carries: 2, rushingYards: 2,
          rushingTd: 0, rushingLong: 2, sacks: 0, fumbles: 0,
          passingAvg: 16.2, rating: 155.8, rushingAvg: 1
        },
        bigPlays: [
          '44 yard passing touchdown'
        ] },
      { week: 11, date: '2020-11-14', kickoff: null,
        opponent: 'Maryland', home: false, conference: true,
        result: { teamScore: 42, opponentScore: 21 }, booster: null,
        stats: {
          completions: 0, attempts: 0, passingYards: 0, passingYac: 0,
          passingTd: 0, interceptions: 0, carries: 0, rushingYards: 0,
          rushingTd: 0, rushingLong: 0, sacks: 0, fumbles: 0
        } },
      { week: 12, date: '2020-11-21', kickoff: null,
        opponent: 'Illinois', home: false, conference: true,
        result: { teamScore: 41, opponentScore: 19 }, booster: null,
        stats: {
          completions: 0, attempts: 0, passingYards: 0, passingYac: 0,
          passingTd: 0, interceptions: 0, carries: 0, rushingYards: 0,
          rushingTd: 0, rushingLong: 0, sacks: 0, fumbles: 0
        } },
      { week: 13, date: '2020-11-28', kickoff: null,
        opponent: 'Michigan', home: true, conference: true,
        result: { teamScore: 51, opponentScore: 24 }, booster: null,
        stats: {
          completions: 0, attempts: 0, passingYards: 0, passingYac: 0,
          passingTd: 0, interceptions: 0, carries: 0, rushingYards: 0,
          rushingTd: 0, rushingLong: 0, sacks: 0, fumbles: 0
        } },
    ],
  }
};
