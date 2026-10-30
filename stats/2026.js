/* ==========================================================================
   EGE Football — the 2026 season
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
   shop key — 'boost-2-5', 'boost-2-0', 'boost-1-5' — or a wager,
   'wager-for' (his own team) or 'wager-against' (the other one), or null.
   A wager has `line` beside it, the point spread it was taken at from the
   side it took: -3.5 means that side had to win by 4. Once a week is
   published this is where a booster lives for good, so the row behind it
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
   right to see it. In the NFL the asterisk is a division game instead,
   `division: true`, and `conference` is always false.

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

   `trades` is the six traded in the NFL sim that season, by slug: from
   `week` on he plays for `to` (a key in EGE.teams) and his games are its
   games, and the ones before it are the ones he played for `from`.
   ========================================================================== */

window.EGE = window.EGE || {};
EGE.stats = EGE.stats || {};

EGE.stats[2026] = {
  season: 2026,
  level: 'NFL',

  /* Weeks the NFL Sim tab stored, written in here, and when each was
     saved: a stored week saved after this replaces the file's. */
  stored: {
    1: '2026-10-27T03:48:26.937Z',
    2: '2026-10-27T15:13:37.432Z',
    3: '2026-10-27T21:46:21.437Z',
    4: '2026-10-27T22:21:30.331Z',
    5: '2026-10-28T01:39:49.119Z',
    6: '2026-10-28T02:06:52.941Z',
    7: '2026-10-28T02:37:51.727Z',
    8: '2026-10-28T15:04:11.114Z',
    9: '2026-10-28T15:12:28.622Z',
    10: '2026-10-28T16:35:54.965Z',
    11: '2026-10-28T20:05:52.176Z',
    12: '2026-10-29T02:22:08.479Z',
    13: '2026-10-29T23:16:50.631Z',
    14: '2026-10-30T00:32:59.826Z',
    15: '2026-10-30T01:32:12.556Z',
    16: '2026-10-30T02:24:51.155Z',
    17: '2026-10-30T02:41:50.251Z',
    18: '2026-10-30T03:04:05.406Z',
    19: '2026-10-30T03:13:21.122Z',
    20: '2026-10-30T15:46:07.297Z',
    21: '2026-10-30T18:31:52.856Z',
    22: '2026-10-30T21:59:48.056Z'
  },

  games: {

    /* Andrew Parr — Carolina Panthers */
    'andrew-parr': [
      { week:  1, date: '2026-09-13', kickoff: '1:00pm',
        opponent: 'Chicago Bears', home: true, conference: false,
        result: { teamScore: 24, opponentScore: 48 }, booster: null,
        stats: {
          receptions: 1, receivingYards: 8, receivingYac: 8,
          receivingTd: 0, receivingLong: 8, targets: 4, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 8, totalYards: 8, totalTd: 0
        } },
      { week:  2, date: '2026-09-20', kickoff: '1:00pm',
        opponent: 'Atlanta Falcons', home: false, conference: false, division: true,
        result: { teamScore: 14, opponentScore: 32 }, booster: null,
        stats: {
          receptions: 8, receivingYards: 96, receivingYac: 32,
          receivingTd: 0, receivingLong: 21, targets: 12, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 12, totalYards: 96, totalTd: 0
        } },
      { week:  3, date: '2026-09-27', kickoff: '1:00pm',
        opponent: 'Cleveland Browns', home: false, conference: false,
        result: { teamScore: 33, opponentScore: 5 }, booster: 'wager-for', line: 2.5,
        stats: {
          receptions: 4, receivingYards: 36, receivingYac: 18,
          receivingTd: 1, receivingLong: 10, targets: 4, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 9, totalYards: 36, totalTd: 1
        },
        bigPlays: [
          '9 yard receiving touchdown'
        ] },
      { week:  4, date: '2026-10-04', kickoff: '8:20pm',
        opponent: 'Detroit Lions', home: true, conference: false,
        result: { teamScore: 27, opponentScore: 20 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 41, receivingYac: 13,
          receivingTd: 0, receivingLong: 19, targets: 5, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 10.3, totalYards: 41, totalTd: 0
        } },
      { week:  5, date: '2026-10-11', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week:  6, date: '2026-10-18', kickoff: '1:00pm',
        opponent: 'Philadelphia Eagles', home: false, conference: false,
        result: { teamScore: 27, opponentScore: 30 }, booster: 'wager-for', line: 11.5,
        stats: {
          receptions: 1, receivingYards: 15, receivingYac: 0,
          receivingTd: 1, receivingLong: 15, targets: 2, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 15, totalYards: 15, totalTd: 1
        },
        bigPlays: [
          '15 yard receiving touchdown'
        ] },
      { week:  7, date: '2026-10-25', kickoff: '1:00pm',
        opponent: 'Tampa Bay Buccaneers', home: true, conference: false, division: true,
        result: { teamScore: 34, opponentScore: 10 }, booster: 'boost-2-0',
        stats: {
          receptions: 8, receivingYards: 35, receivingYac: 15,
          receivingTd: 1, receivingLong: 8, targets: 10, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 4.4, totalYards: 35, totalTd: 1
        },
        bigPlays: [
          '2 yard receiving touchdown'
        ] },
      { week:  8, date: '2026-10-29', kickoff: '8:15pm',
        opponent: 'Green Bay Packers', home: false, conference: false,
        result: { teamScore: 21, opponentScore: 29 }, booster: null,
        stats: {
          receptions: 12, receivingYards: 105, receivingYac: 31,
          receivingTd: 1, receivingLong: 18, targets: 17, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 8.8, totalYards: 105, totalTd: 1
        },
        bigPlays: [
          '3 yard receiving touchdown'
        ] },
      { week:  9, date: '2026-11-08', kickoff: '1:00pm',
        opponent: 'Denver Broncos', home: true, conference: false,
        result: { teamScore: 24, opponentScore: 17 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 58, receivingYac: 43,
          receivingTd: 1, receivingLong: 25, targets: 5, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 14.5, totalYards: 58, totalTd: 1
        },
        bigPlays: [
          '25 yard receiving touchdown'
        ] },
      { week: 10, date: '2026-11-15', kickoff: '1:00pm',
        opponent: 'New Orleans Saints', home: false, conference: false, division: true,
        result: { teamScore: 24, opponentScore: 20 }, booster: null,
        stats: {
          receptions: 9, receivingYards: 109, receivingYac: 31,
          receivingTd: 0, receivingLong: 22, targets: 10, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 12.1, totalYards: 109, totalTd: 0
        } },
      { week: 11, date: '2026-11-22', kickoff: '1:00pm',
        opponent: 'Baltimore Ravens', home: true, conference: false,
        result: { teamScore: 17, opponentScore: 44 }, booster: null,
        stats: {
          receptions: 6, receivingYards: 65, receivingYac: 16,
          receivingTd: 1, receivingLong: 24, targets: 9, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 10.8, totalYards: 65, totalTd: 1
        },
        bigPlays: [
          '3 yard receiving touchdown'
        ] },
      { week: 12, date: '2026-11-30', kickoff: '8:15pm',
        opponent: 'Tampa Bay Buccaneers', home: false, conference: false, division: true,
        result: { teamScore: 31, opponentScore: 33 }, booster: 'boost-2-0',
        stats: {
          receptions: 12, receivingYards: 120, receivingYac: 21,
          receivingTd: 1, receivingLong: 18, targets: 14, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 10, totalYards: 120, totalTd: 1
        },
        bigPlays: [
          '16 yard receiving touchdown'
        ] },
      { week: 13, date: '2026-12-06', kickoff: '4:25pm',
        opponent: 'Minnesota Vikings', home: false, conference: false,
        result: { teamScore: 27, opponentScore: 0 }, booster: 'boost-1-5',
        stats: {
          receptions: 4, receivingYards: 34, receivingYac: 12,
          receivingTd: 0, receivingLong: 17, targets: 5, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 8.5, totalYards: 34, totalTd: 0
        } },
      { week: 14, date: '2026-12-13', kickoff: '1:00pm',
        opponent: 'New Orleans Saints', home: true, conference: false, division: true,
        result: { teamScore: 20, opponentScore: 21 }, booster: 'boost-1-5',
        stats: {
          receptions: 5, receivingYards: 66, receivingYac: 23,
          receivingTd: 1, receivingLong: 23, targets: 9, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 13.2, totalYards: 66, totalTd: 1
        },
        bigPlays: [
          '20 yard receiving touchdown'
        ] },
      { week: 15, date: '2026-12-20', kickoff: '1:00pm',
        opponent: 'Cincinnati Bengals', home: true, conference: false,
        result: { teamScore: 23, opponentScore: 27 }, booster: 'boost-1-5',
        stats: {
          receptions: 6, receivingYards: 55, receivingYac: 19,
          receivingTd: 0, receivingLong: 18, targets: 7, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 9.2, totalYards: 55, totalTd: 0
        } },
      { week: 16, date: '2026-12-27', kickoff: '1:00pm',
        opponent: 'Pittsburgh Steelers', home: false, conference: false,
        result: { teamScore: 24, opponentScore: 19 }, booster: null,
        stats: {
          receptions: 3, receivingYards: 32, receivingYac: 7,
          receivingTd: 0, receivingLong: 17, targets: 7, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 10.7, totalYards: 32, totalTd: 0
        } },
      { week: 17, date: '2027-01-03', kickoff: '1:00pm',
        opponent: 'Seattle Seahawks', home: true, conference: false,
        result: { teamScore: 17, opponentScore: 19 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 40, receivingYac: 10,
          receivingTd: 0, receivingLong: 17, targets: 5, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 8, totalYards: 40, totalTd: 0
        } },
      { week: 18, date: '2027-01-10', kickoff: '1:00pm',
        opponent: 'Atlanta Falcons', home: true, conference: false, division: true,
        result: { teamScore: 13, opponentScore: 30 }, booster: null,
        stats: {
          receptions: 3, receivingYards: 12, receivingYac: 8,
          receivingTd: 0, receivingLong: 9, targets: 10, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 4, totalYards: 12, totalTd: 0
        } },
    ],

    /* Cooper Clark — Chicago Bears */
    'cooper-clark': [
      { week:  1, date: '2026-09-13', kickoff: '12:00pm',
        opponent: 'Carolina Panthers', home: false, conference: false,
        result: { teamScore: 48, opponentScore: 24 }, booster: null,
        stats: {
          carries: 12, rushingYards: 103, rushingTd: 1, rushingLong: 51,
          receptions: 8, receivingYards: 82, receivingYac: 66,
          receivingTd: 0, receivingLong: 27, targets: 8, fumbles: 0,
          rushingAvg: 8.6, receivingAvg: 10.3, totalYards: 185, totalTd: 1
        },
        bigPlays: [
          '1 yard rushing touchdown'
        ] },
      { week:  2, date: '2026-09-20', kickoff: '12:00pm',
        opponent: 'Minnesota Vikings', home: true, conference: false, division: true,
        result: { teamScore: 13, opponentScore: 20 }, booster: null,
        stats: {
          carries: 18, rushingYards: 111, rushingTd: 0, rushingLong: 20,
          receptions: 4, receivingYards: 38, receivingYac: 22,
          receivingTd: 0, receivingLong: 19, targets: 4, fumbles: 0,
          rushingAvg: 6.2, receivingAvg: 9.5, totalYards: 149, totalTd: 0
        } },
      { week:  3, date: '2026-09-28', kickoff: '7:15pm',
        opponent: 'Philadelphia Eagles', home: true, conference: false,
        result: { teamScore: 38, opponentScore: 31 }, booster: null,
        stats: {
          carries: 15, rushingYards: 49, rushingTd: 1, rushingLong: 7,
          receptions: 1, receivingYards: 5, receivingYac: 2,
          receivingTd: 0, receivingLong: 5, targets: 2, fumbles: 0,
          rushingAvg: 3.3, receivingAvg: 5, totalYards: 54, totalTd: 1
        },
        bigPlays: [
          '3 yard rushing touchdown'
        ] },
      { week:  4, date: '2026-10-04', kickoff: '12:00pm',
        opponent: 'New York Jets', home: true, conference: false,
        result: { teamScore: 23, opponentScore: 15 }, booster: null,
        stats: {
          carries: 7, rushingYards: 68, rushingTd: 0, rushingLong: 40,
          receptions: 3, receivingYards: 38, receivingYac: 13,
          receivingTd: 0, receivingLong: 22, targets: 5, fumbles: 0,
          rushingAvg: 9.7, receivingAvg: 12.7, totalYards: 106, totalTd: 0
        } },
      { week:  5, date: '2026-10-11', kickoff: '12:00pm',
        opponent: 'Green Bay Packers', home: false, conference: false, division: true,
        result: { teamScore: 24, opponentScore: 21 }, booster: null,
        stats: {
          carries: 11, rushingYards: 45, rushingTd: 1, rushingLong: 7,
          receptions: 4, receivingYards: 37, receivingYac: 20,
          receivingTd: 0, receivingLong: 20, targets: 7, fumbles: 0,
          rushingAvg: 4.1, receivingAvg: 9.3, totalYards: 82, totalTd: 1
        },
        bigPlays: [
          '1 yard rushing touchdown'
        ] },
      { week:  6, date: '2026-10-18', kickoff: '12:00pm',
        opponent: 'Atlanta Falcons', home: false, conference: false, overtime: true,
        result: { teamScore: 10, opponentScore: 13 }, booster: null,
        stats: {
          carries: 7, rushingYards: 29, rushingTd: 0, rushingLong: 11,
          receptions: 4, receivingYards: 25, receivingYac: 23,
          receivingTd: 0, receivingLong: 10, targets: 5, fumbles: 0,
          rushingAvg: 4.1, receivingAvg: 6.3, totalYards: 54, totalTd: 0
        } },
      { week:  7, date: '2026-10-22', kickoff: '7:15pm',
        opponent: 'New England Patriots', home: true, conference: false,
        result: { teamScore: 28, opponentScore: 32 }, booster: null,
        stats: {
          carries: 11, rushingYards: 71, rushingTd: 3, rushingLong: 26,
          receptions: 5, receivingYards: 44, receivingYac: 34,
          receivingTd: 0, receivingLong: 20, targets: 9, fumbles: 0,
          rushingAvg: 6.5, receivingAvg: 8.8, totalYards: 115, totalTd: 3
        },
        bigPlays: [
          '14 yard rushing touchdown',
          '8 yard rushing touchdown',
          '3 yard rushing touchdown'
        ] },
      { week:  8, date: '2026-11-02', kickoff: '7:15pm',
        opponent: 'Seattle Seahawks', home: false, conference: false,
        result: { teamScore: 24, opponentScore: 13 }, booster: 'boost-2-0',
        stats: {
          carries: 15, rushingYards: 79, rushingTd: 1, rushingLong: 19,
          receptions: 3, receivingYards: 3, receivingYac: 3,
          receivingTd: 0, receivingLong: 3, targets: 3, fumbles: 0,
          rushingAvg: 5.3, receivingAvg: 1, totalYards: 82, totalTd: 1
        },
        bigPlays: [
          '1 yard rushing touchdown'
        ] },
      { week:  9, date: '2026-11-08', kickoff: '7:20pm',
        opponent: 'Tampa Bay Buccaneers', home: true, conference: false, overtime: true,
        result: { teamScore: 30, opponentScore: 27 }, booster: 'boost-2-0',
        stats: {
          carries: 10, rushingYards: 84, rushingTd: 1, rushingLong: 40,
          receptions: 6, receivingYards: 52, receivingYac: 35,
          receivingTd: 0, receivingLong: 20, targets: 9, fumbles: 0,
          rushingAvg: 8.4, receivingAvg: 8.7, totalYards: 136, totalTd: 1
        },
        bigPlays: [
          '19 yard rushing touchdown'
        ] },
      { week: 10, date: '2026-11-15', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week: 11, date: '2026-11-22', kickoff: '12:00pm',
        opponent: 'New Orleans Saints', home: true, conference: false,
        result: { teamScore: 18, opponentScore: 6 }, booster: null,
        stats: {
          carries: 11, rushingYards: 44, rushingTd: 1, rushingLong: 9,
          receptions: 2, receivingYards: 11, receivingYac: 2,
          receivingTd: 0, receivingLong: 8, targets: 3, fumbles: 0,
          rushingAvg: 4, receivingAvg: 5.5, totalYards: 55, totalTd: 1
        },
        bigPlays: [
          '1 yard rushing touchdown'
        ] },
      { week: 12, date: '2026-11-26', kickoff: '12:00pm',
        opponent: 'Detroit Lions', home: false, conference: false, division: true,
        result: { teamScore: 27, opponentScore: 49 }, booster: null,
        stats: {
          carries: 11, rushingYards: 56, rushingTd: 0, rushingLong: 11,
          receptions: 3, receivingYards: 11, receivingYac: 11,
          receivingTd: 0, receivingLong: 7, targets: 4, fumbles: 0,
          rushingAvg: 5.1, receivingAvg: 3.7, totalYards: 67, totalTd: 0
        } },
      { week: 13, date: '2026-12-06', kickoff: '12:00pm',
        opponent: 'Jacksonville Jaguars', home: true, conference: false, overtime: true,
        result: { teamScore: 22, opponentScore: 16 }, booster: 'boost-1-5',
        stats: {
          carries: 10, rushingYards: 48, rushingTd: 0, rushingLong: 10,
          receptions: 6, receivingYards: 34, receivingYac: 22,
          receivingTd: 0, receivingLong: 10, targets: 7, fumbles: 0,
          rushingAvg: 4.8, receivingAvg: 5.7, totalYards: 82, totalTd: 0
        } },
      { week: 14, date: '2026-12-13', kickoff: '12:00pm',
        opponent: 'Miami Dolphins', home: false, conference: false,
        result: { teamScore: 34, opponentScore: 51 }, booster: null,
        stats: {
          carries: 6, rushingYards: 24, rushingTd: 0, rushingLong: 7,
          receptions: 2, receivingYards: 45, receivingYac: 26,
          receivingTd: 0, receivingLong: 31, targets: 5, fumbles: 0,
          rushingAvg: 4, receivingAvg: 22.5, totalYards: 69, totalTd: 0
        } },
      { week: 15, date: '2026-12-19', kickoff: '7:20pm',
        opponent: 'Buffalo Bills', home: false, conference: false,
        result: { teamScore: 12, opponentScore: 27 }, booster: 'boost-1-5',
        stats: {
          carries: 14, rushingYards: 66, rushingTd: 1, rushingLong: 14,
          receptions: 5, receivingYards: 47, receivingYac: 32,
          receivingTd: 0, receivingLong: 33, targets: 6, fumbles: 0,
          rushingAvg: 4.7, receivingAvg: 9.4, totalYards: 113, totalTd: 1
        },
        bigPlays: [
          '6 yard rushing touchdown'
        ] },
      { week: 16, date: '2026-12-25', kickoff: '12:00pm',
        opponent: 'Green Bay Packers', home: true, conference: false, division: true,
        result: { teamScore: 44, opponentScore: 21 }, booster: 'boost-1-5',
        stats: {
          carries: 12, rushingYards: 176, rushingTd: 1, rushingLong: 66,
          receptions: 6, receivingYards: 45, receivingYac: 23,
          receivingTd: 1, receivingLong: 18, targets: 6, fumbles: 0,
          rushingAvg: 14.7, receivingAvg: 7.5, totalYards: 221, totalTd: 2
        },
        bigPlays: [
          '5 yard receiving touchdown',
          '66 yard rushing touchdown'
        ] },
      { week: 17, date: '2027-01-03', kickoff: '3:25pm',
        opponent: 'Detroit Lions', home: true, conference: false, division: true,
        result: { teamScore: 30, opponentScore: 26 }, booster: 'wager-for', line: 1.5,
        stats: {
          carries: 9, rushingYards: 49, rushingTd: 0, rushingLong: 11,
          receptions: 2, receivingYards: 5, receivingYac: 2,
          receivingTd: 0, receivingLong: 3, targets: 3, fumbles: 0,
          rushingAvg: 5.4, receivingAvg: 2.5, totalYards: 54, totalTd: 0
        } },
      { week: 18, date: '2027-01-10', kickoff: '12:00pm',
        opponent: 'Minnesota Vikings', home: false, conference: false, division: true,
        result: { teamScore: 26, opponentScore: 19 }, booster: 'wager-for', line: -7.5,
        stats: {
          carries: 16, rushingYards: 81, rushingTd: 1, rushingLong: 15,
          receptions: 1, receivingYards: 3, receivingYac: 2,
          receivingTd: 0, receivingLong: 3, targets: 1, fumbles: 0,
          rushingAvg: 5.1, receivingAvg: 3, totalYards: 84, totalTd: 1
        },
        bigPlays: [
          '15 yard rushing touchdown'
        ] },
      { week: 19, date: '2027-01-16', kickoff: null,
        name: 'NFC Wild Card',
        opponent: 'San Francisco 49ers', home: false, conference: false, playoff: true,
        result: { teamScore: 27, opponentScore: 17 }, booster: null,
        stats: {
          carries: 12, rushingYards: 71, rushingTd: 0, rushingLong: 26,
          receptions: 8, receivingYards: 47, receivingYac: 29,
          receivingTd: 1, receivingLong: 18, targets: 8, fumbles: 0,
          rushingAvg: 5.9, receivingAvg: 5.9, totalYards: 118, totalTd: 1
        },
        bigPlays: [
          '18 yard receiving touchdown'
        ] },
      { week: 20, date: '2027-01-23', kickoff: null,
        name: 'NFC Divisional Round',
        opponent: 'Green Bay Packers', home: false, conference: false, playoff: true,
        result: { teamScore: 10, opponentScore: 15 }, booster: null,
        stats: {
          carries: 12, rushingYards: 28, rushingTd: 0, rushingLong: 6,
          receptions: 6, receivingYards: 55, receivingYac: 35,
          receivingTd: 1, receivingLong: 27, targets: 10, fumbles: 0,
          rushingAvg: 2.3, receivingAvg: 9.2, totalYards: 83, totalTd: 1
        },
        bigPlays: [
          '2 yard receiving touchdown'
        ] },
    ],

    /* Paxon Hatch — New York Giants */
    'paxon-hatch': [
      { week:  1, date: '2026-09-13', kickoff: '8:20pm',
        opponent: 'Dallas Cowboys', home: true, conference: false, division: true,
        result: { teamScore: 24, opponentScore: 6 }, booster: 'boost-1-5',
        stats: {
          receptions: 10, receivingYards: 168, receivingYac: 107,
          receivingTd: 2, receivingLong: 62, targets: 12, carries: 1,
          rushingYards: 2, rushingTd: 0, rushingLong: 2, fumbles: 0,
          rushingAvg: 2, receivingAvg: 16.8, totalYards: 170, totalTd: 2
        },
        bigPlays: [
          '30 yard receiving touchdown',
          '6 yard receiving touchdown'
        ] },
      { week:  2, date: '2026-09-21', kickoff: '8:15pm',
        opponent: 'Los Angeles Rams', home: false, conference: false,
        result: { teamScore: 23, opponentScore: 7 }, booster: 'boost-2-0',
        stats: {
          receptions: 8, receivingYards: 100, receivingYac: 44,
          receivingTd: 2, receivingLong: 44, targets: 12, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 12.5, totalYards: 100, totalTd: 2
        },
        bigPlays: [
          '44 yard receiving touchdown',
          '11 yard receiving touchdown'
        ] },
      { week:  3, date: '2026-09-27', kickoff: '1:00pm',
        opponent: 'Tennessee Titans', home: true, conference: false,
        result: { teamScore: 20, opponentScore: 24 }, booster: null,
        stats: {
          receptions: 7, receivingYards: 70, receivingYac: 21,
          receivingTd: 1, receivingLong: 23, targets: 9, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 10, totalYards: 70, totalTd: 1
        },
        bigPlays: [
          '22 yard receiving touchdown'
        ] },
      { week:  4, date: '2026-10-04', kickoff: '1:00pm',
        opponent: 'Arizona Cardinals', home: true, conference: false,
        result: { teamScore: 24, opponentScore: 6 }, booster: null,
        stats: {
          receptions: 11, receivingYards: 100, receivingYac: 29,
          receivingTd: 2, receivingLong: 31, targets: 13, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 9.1, totalYards: 100, totalTd: 2
        },
        bigPlays: [
          '8 yard receiving touchdown',
          '5 yard receiving touchdown'
        ] },
      { week:  5, date: '2026-10-11', kickoff: '1:00pm',
        opponent: 'Washington Commanders', home: false, conference: false, division: true,
        result: { teamScore: 20, opponentScore: 6 }, booster: 'boost-1-5',
        stats: {
          receptions: 7, receivingYards: 68, receivingYac: 12,
          receivingTd: 1, receivingLong: 24, targets: 9, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 9.7, totalYards: 68, totalTd: 1
        },
        bigPlays: [
          '24 yard receiving touchdown'
        ] },
      { week:  6, date: '2026-10-18', kickoff: '1:00pm',
        opponent: 'New Orleans Saints', home: true, conference: false,
        result: { teamScore: 17, opponentScore: 10 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 23, receivingYac: 13,
          receivingTd: 0, receivingLong: 9, targets: 6, carries: 1,
          rushingYards: 5, rushingTd: 0, rushingLong: 5, fumbles: 0,
          rushingAvg: 5, receivingAvg: 5.8, totalYards: 28, totalTd: 0
        } },
      { week:  7, date: '2026-10-25', kickoff: '1:00pm',
        opponent: 'Houston Texans', home: false, conference: false, injured: true, injury: 'Hip', health: 80,
        result: { teamScore: 21, opponentScore: 20 }, booster: 'boost-1-5',
        stats: {
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          totalYards: 0, totalTd: 0
        } },
      { week:  8, date: '2026-11-01', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week:  9, date: '2026-11-08', kickoff: '1:00pm',
        opponent: 'Philadelphia Eagles', home: false, conference: false, division: true,
        result: { teamScore: 7, opponentScore: 21 }, booster: null,
        stats: {
          receptions: 3, receivingYards: 53, receivingYac: 14,
          receivingTd: 0, receivingLong: 21, targets: 5, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 17.7, totalYards: 53, totalTd: 0
        } },
      { week: 10, date: '2026-11-12', kickoff: '8:15pm',
        opponent: 'Washington Commanders', home: true, conference: false, division: true,
        result: { teamScore: 47, opponentScore: 7 }, booster: null,
        stats: {
          receptions: 13, receivingYards: 131, receivingYac: 62,
          receivingTd: 1, receivingLong: 48, targets: 15, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 10.1, totalYards: 131, totalTd: 1
        },
        bigPlays: [
          '5 yard receiving touchdown'
        ] },
      { week: 11, date: '2026-11-22', kickoff: '1:00pm',
        opponent: 'Jacksonville Jaguars', home: true, conference: false,
        result: { teamScore: 19, opponentScore: 22 }, booster: 'boost-1-5',
        stats: {
          receptions: 7, receivingYards: 91, receivingYac: 29,
          receivingTd: 0, receivingLong: 27, targets: 8, carries: 1,
          rushingYards: 6, rushingTd: 0, rushingLong: 6, fumbles: 0,
          rushingAvg: 6, receivingAvg: 13, totalYards: 97, totalTd: 0
        } },
      { week: 12, date: '2026-11-29', kickoff: '1:00pm',
        opponent: 'Indianapolis Colts', home: false, conference: false,
        result: { teamScore: 38, opponentScore: 31 }, booster: null,
        stats: {
          receptions: 8, receivingYards: 134, receivingYac: 28,
          receivingTd: 2, receivingLong: 34, targets: 11, carries: 2,
          rushingYards: 31, rushingTd: 0, rushingLong: 25, fumbles: 0,
          rushingAvg: 15.5, receivingAvg: 16.8, totalYards: 165,
          totalTd: 2
        },
        bigPlays: [
          '6 yard receiving touchdown',
          '8 yard receiving touchdown'
        ] },
      { week: 13, date: '2026-12-06', kickoff: '1:00pm',
        opponent: 'San Francisco 49ers', home: true, conference: false,
        result: { teamScore: 27, opponentScore: 6 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 38, receivingYac: 10,
          receivingTd: 1, receivingLong: 17, targets: 5, carries: 1,
          rushingYards: 7, rushingTd: 0, rushingLong: 7, fumbles: 0,
          rushingAvg: 7, receivingAvg: 7.6, totalYards: 45, totalTd: 1
        },
        bigPlays: [
          '2 yard receiving touchdown'
        ] },
      { week: 14, date: '2026-12-13', kickoff: '4:25pm',
        opponent: 'Seattle Seahawks', home: false, conference: false,
        result: { teamScore: 20, opponentScore: 8 }, booster: 'wager-for', line: -6.5,
        stats: {
          receptions: 7, receivingYards: 129, receivingYac: 25,
          receivingTd: 1, receivingLong: 38, targets: 12, carries: 1,
          rushingYards: 8, rushingTd: 0, rushingLong: 8, fumbles: 0,
          rushingAvg: 8, receivingAvg: 18.4, totalYards: 137, totalTd: 1
        },
        bigPlays: [
          '32 yard receiving touchdown'
        ] },
      { week: 15, date: '2026-12-20', kickoff: '1:00pm',
        opponent: 'Cleveland Browns', home: true, conference: false,
        result: { teamScore: 39, opponentScore: 24 }, booster: 'wager-for', line: -16.5,
        stats: {
          receptions: 7, receivingYards: 86, receivingYac: 22,
          receivingTd: 2, receivingLong: 21, targets: 10, carries: 1,
          rushingYards: 3, rushingTd: 0, rushingLong: 3, fumbles: 0,
          rushingAvg: 3, receivingAvg: 12.3, totalYards: 89, totalTd: 2
        },
        bigPlays: [
          '13 yard receiving touchdown',
          '4 yard receiving touchdown'
        ] },
      { week: 16, date: '2026-12-28', kickoff: '8:15pm',
        opponent: 'Detroit Lions', home: false, conference: false,
        result: { teamScore: 13, opponentScore: 16 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 66, receivingYac: 19,
          receivingTd: 0, receivingLong: 29, targets: 7, carries: 1,
          rushingYards: 4, rushingTd: 0, rushingLong: 4, fumbles: 0,
          rushingAvg: 4, receivingAvg: 13.2, totalYards: 70, totalTd: 0
        } },
      { week: 17, date: '2027-01-03', kickoff: '1:00pm',
        opponent: 'Dallas Cowboys', home: false, conference: false, division: true,
        result: { teamScore: 32, opponentScore: 13 }, booster: null,
        stats: {
          receptions: 11, receivingYards: 155, receivingYac: 63,
          receivingTd: 0, receivingLong: 36, targets: 14, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 14.1, totalYards: 155, totalTd: 0
        } },
      { week: 18, date: '2027-01-10', kickoff: '1:00pm',
        opponent: 'Philadelphia Eagles', home: true, conference: false, division: true,
        result: { teamScore: 38, opponentScore: 33 }, booster: null,
        stats: {
          receptions: 13, receivingYards: 168, receivingYac: 51,
          receivingTd: 0, receivingLong: 37, targets: 17, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 12.9, totalYards: 168, totalTd: 0
        } },
      { week: 19, date: '2027-01-16', kickoff: null,
        name: 'NFC Wild Card',
        opponent: 'Philadelphia Eagles', home: true, conference: false, playoff: true,
        result: { teamScore: 42, opponentScore: 23 }, booster: null,
        stats: {
          receptions: 9, receivingYards: 190, receivingYac: 64,
          receivingTd: 3, receivingLong: 42, targets: 11, carries: 1,
          rushingYards: 4, rushingTd: 0, rushingLong: 66, fumbles: 0,
          rushingAvg: 4, receivingAvg: 21.1, totalYards: 194, totalTd: 3
        },
        bigPlays: [
          '10 yard receiving touchdown',
          '22 yard receiving touchdown',
          '11 yard receiving touchdown'
        ] },
      { week: 20, date: '2027-01-23', kickoff: null,
        name: 'NFC Divisional Round',
        opponent: 'Detroit Lions', home: true, conference: false, playoff: true,
        result: { teamScore: 23, opponentScore: 17 }, booster: null,
        stats: {
          receptions: 8, receivingYards: 173, receivingYac: 116,
          receivingTd: 2, receivingLong: 60, targets: 13, carries: 1,
          rushingYards: 2, rushingTd: 0, rushingLong: 2, fumbles: 0,
          rushingAvg: 2, receivingAvg: 21.6, totalYards: 175, totalTd: 2
        },
        bigPlays: [
          '60 yard receiving touchdown',
          '13 yard receiving touchdown'
        ] },
      { week: 21, date: '2027-01-31', kickoff: null,
        name: 'NFC Championship',
        opponent: 'Green Bay Packers', home: false, conference: false, playoff: true,
        result: { teamScore: 20, opponentScore: 24 }, booster: null,
        stats: {
          receptions: 7, receivingYards: 149, receivingYac: 62,
          receivingTd: 1, receivingLong: 58, targets: 11, carries: 1,
          rushingYards: 6, rushingTd: 0, rushingLong: 6, fumbles: 0,
          rushingAvg: 6, receivingAvg: 21.3, totalYards: 155, totalTd: 1
        },
        bigPlays: [
          '18 yard receiving touchdown'
        ] },
    ],

    /* Isaac Vitel — Tampa Bay Buccaneers */
    'isaac-vitel': [
      { week:  1, date: '2026-09-13', kickoff: '1:00pm',
        opponent: 'Cincinnati Bengals', home: false, conference: false,
        result: { teamScore: 30, opponentScore: 17 }, booster: 'boost-1-5',
        stats: {
          completions: 23, attempts: 32, passingYards: 272,
          passingYac: 75, passingTd: 3, interceptions: 0, carries: 3,
          rushingYards: 2, rushingTd: 0, rushingLong: 2, sacks: 1,
          fumbles: 0, passingAvg: 11.8, rating: 128.6, rushingAvg: 0.7
        },
        bigPlays: [
          '1 yard passing touchdown',
          '18 yard passing touchdown',
          '9 yard passing touchdown'
        ] },
      { week:  2, date: '2026-09-20', kickoff: '1:00pm',
        opponent: 'Cleveland Browns', home: true, conference: false,
        result: { teamScore: 20, opponentScore: 17 }, booster: 'boost-1-5',
        stats: {
          completions: 31, attempts: 49, passingYards: 277,
          passingYac: 126, passingTd: 1, interceptions: 0, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, sacks: 4,
          fumbles: 0, passingAvg: 8.9, rating: 85.2
        },
        bigPlays: [
          '33 yard game-winning passing touchdown'
        ] },
      { week:  3, date: '2026-09-27', kickoff: '4:05pm',
        opponent: 'Minnesota Vikings', home: true, conference: false,
        result: { teamScore: 21, opponentScore: 28 }, booster: null,
        stats: {
          completions: 29, attempts: 44, passingYards: 295,
          passingYac: 112, passingTd: 1, interceptions: 2, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, sacks: 3,
          fumbles: 0, passingAvg: 10.2, rating: 73.6
        },
        bigPlays: [
          '3 yard passing touchdown'
        ] },
      { week:  4, date: '2026-10-04', kickoff: '1:00pm',
        opponent: 'Green Bay Packers', home: true, conference: false,
        result: { teamScore: 20, opponentScore: 25 }, booster: null,
        stats: {
          completions: 16, attempts: 23, passingYards: 200,
          passingYac: 90, passingTd: 2, interceptions: 1, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, sacks: 3,
          fumbles: 0, passingAvg: 12.5, rating: 107.2
        },
        bigPlays: [
          '4 yard passing touchdown',
          '10 yard passing touchdown'
        ] },
      { week:  5, date: '2026-10-08', kickoff: '8:15pm',
        opponent: 'Dallas Cowboys', home: false, conference: false,
        result: { teamScore: 28, opponentScore: 3 }, booster: null,
        stats: {
          completions: 18, attempts: 29, passingYards: 256,
          passingYac: 62, passingTd: 2, interceptions: 0, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, sacks: 3,
          fumbles: 0, passingAvg: 14.2, rating: 113.6
        },
        bigPlays: [
          '17 yard passing touchdown',
          '15 yard passing touchdown'
        ] },
      { week:  6, date: '2026-10-18', kickoff: '1:00pm',
        opponent: 'Pittsburgh Steelers', home: true, conference: false,
        result: { teamScore: 14, opponentScore: 10 }, booster: null,
        stats: {
          completions: 18, attempts: 31, passingYards: 110,
          passingYac: 40, passingTd: 1, interceptions: 2, carries: 4,
          rushingYards: 5, rushingTd: 0, rushingLong: 3, sacks: 3,
          fumbles: 0, passingAvg: 6.1, rating: 49.1, rushingAvg: 1.3
        },
        bigPlays: [
          '2 yard passing touchdown'
        ] },
      { week:  7, date: '2026-10-25', kickoff: '1:00pm',
        opponent: 'Carolina Panthers', home: false, conference: false, division: true,
        result: { teamScore: 10, opponentScore: 34 }, booster: null,
        stats: {
          completions: 16, attempts: 30, passingYards: 192,
          passingYac: 61, passingTd: 1, interceptions: 0, carries: 2,
          rushingYards: 0, rushingTd: 0, rushingLong: 1, sacks: 8,
          fumbles: 1, passingAvg: 12, rating: 84.3, rushingAvg: 0
        },
        bigPlays: [
          '17 yard passing touchdown'
        ] },
      { week:  8, date: '2026-11-01', kickoff: '1:00pm',
        opponent: 'Atlanta Falcons', home: true, conference: false, division: true,
        result: { teamScore: 34, opponentScore: 18 }, booster: null,
        stats: {
          completions: 27, attempts: 35, passingYards: 266,
          passingYac: 117, passingTd: 1, interceptions: 0, carries: 2,
          rushingYards: -2, rushingTd: 0, rushingLong: 0, sacks: 4,
          fumbles: 0, passingAvg: 9.9, rating: 107.6, rushingAvg: -1
        },
        bigPlays: [
          '9 yard passing touchdown'
        ] },
      { week:  9, date: '2026-11-08', kickoff: '8:20pm',
        opponent: 'Chicago Bears', home: false, conference: false, overtime: true,
        result: { teamScore: 27, opponentScore: 30 }, booster: null,
        stats: {
          completions: 24, attempts: 34, passingYards: 262,
          passingYac: 93, passingTd: 2, interceptions: 0, carries: 1,
          rushingYards: -1, rushingTd: 0, rushingLong: 0, sacks: 3,
          fumbles: 0, passingAvg: 10.9, rating: 112.6, rushingAvg: -1
        },
        bigPlays: [
          '24 yard passing touchdown',
          '16 yard passing touchdown'
        ] },
      { week: 10, date: '2026-11-15', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week: 11, date: '2026-11-22', kickoff: '1:00pm',
        opponent: 'Detroit Lions', home: false, conference: false,
        result: { teamScore: 28, opponentScore: 31 }, booster: null,
        stats: {
          completions: 25, attempts: 41, passingYards: 300,
          passingYac: 90, passingTd: 3, interceptions: 1, carries: 1,
          rushingYards: 1, rushingTd: 0, rushingLong: 1, sacks: 4,
          fumbles: 0, passingAvg: 12, rating: 97.6, rushingAvg: 1
        },
        bigPlays: [
          '8 yard passing touchdown',
          '5 yard passing touchdown',
          '7 yard passing touchdown'
        ] },
      { week: 12, date: '2026-11-30', kickoff: '8:15pm',
        opponent: 'Carolina Panthers', home: true, conference: false, division: true,
        result: { teamScore: 33, opponentScore: 31 }, booster: null,
        stats: {
          completions: 19, attempts: 35, passingYards: 256,
          passingYac: 105, passingTd: 3, interceptions: 0, carries: 1,
          rushingYards: -1, rushingTd: 0, rushingLong: 0, sacks: 0,
          fumbles: 0, passingAvg: 13.5, rating: 106.4, rushingAvg: -1
        },
        bigPlays: [
          '18 yard passing touchdown',
          '27 yard passing touchdown',
          '13 yard passing touchdown'
        ] },
      { week: 13, date: '2026-12-06', kickoff: '1:00pm',
        opponent: 'Los Angeles Chargers', home: true, conference: false,
        result: { teamScore: 38, opponentScore: 17 }, booster: null,
        stats: {
          completions: 24, attempts: 39, passingYards: 241,
          passingYac: 98, passingTd: 2, interceptions: 0, carries: 3,
          rushingYards: -3, rushingTd: 0, rushingLong: 0, sacks: 2,
          fumbles: 1, passingAvg: 10, rating: 96.2, rushingAvg: -1
        },
        bigPlays: [
          '0 yard passing touchdown',
          '11 yard passing touchdown'
        ] },
      { week: 14, date: '2026-12-13', kickoff: '1:00pm',
        opponent: 'Baltimore Ravens', home: false, conference: false,
        result: { teamScore: 28, opponentScore: 25 }, booster: null,
        stats: {
          completions: 33, attempts: 51, passingYards: 334,
          passingYac: 114, passingTd: 2, interceptions: 2, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, sacks: 0,
          fumbles: 0, passingAvg: 10.1, rating: 80
        },
        bigPlays: [
          '3 yard passing touchdown',
          '9 yard game-winning passing touchdown'
        ] },
      { week: 15, date: '2026-12-20', kickoff: '1:00pm',
        opponent: 'New Orleans Saints', home: true, conference: false, division: true,
        result: { teamScore: 17, opponentScore: 25 }, booster: null,
        stats: {
          completions: 25, attempts: 34, passingYards: 324,
          passingYac: 89, passingTd: 1, interceptions: 0, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, sacks: 7,
          fumbles: 0, passingAvg: 13, rating: 112.9
        },
        bigPlays: [
          '14 yard passing touchdown'
        ] },
      { week: 16, date: '2026-12-27', kickoff: '1:00pm',
        opponent: 'Atlanta Falcons', home: false, conference: false, division: true,
        result: { teamScore: 10, opponentScore: 15 }, booster: null,
        stats: {
          completions: 22, attempts: 35, passingYards: 222,
          passingYac: 109, passingTd: 1, interceptions: 1, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, sacks: 6,
          fumbles: 0, passingAvg: 10.1, rating: 78.5
        },
        bigPlays: [
          '3 yard passing touchdown'
        ] },
      { week: 17, date: '2027-01-03', kickoff: '1:00pm',
        opponent: 'Los Angeles Rams', home: true, conference: false,
        result: { teamScore: 31, opponentScore: 24 }, booster: 'boost-2-0',
        stats: {
          completions: 22, attempts: 30, passingYards: 370,
          passingYac: 93, passingTd: 3, interceptions: 0, carries: 2,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, sacks: 3,
          fumbles: 0, passingAvg: 16.8, rating: 147.9, rushingAvg: 0
        },
        bigPlays: [
          '27 yard passing touchdown',
          '8 yard passing touchdown',
          '38 yard game-winning passing touchdown'
        ] },
      { week: 18, date: '2027-01-10', kickoff: '1:00pm',
        opponent: 'New Orleans Saints', home: false, conference: false, division: true,
        result: { teamScore: 51, opponentScore: 33 }, booster: 'boost-2-0',
        stats: {
          completions: 28, attempts: 38, passingYards: 372,
          passingYac: 164, passingTd: 3, interceptions: 2, carries: 2,
          rushingYards: -2, rushingTd: 0, rushingLong: 0, sacks: 4,
          fumbles: 1, passingAvg: 13.3, rating: 108.7, rushingAvg: -1
        },
        bigPlays: [
          '5 yard passing touchdown',
          '20 yard passing touchdown',
          '7 yard passing touchdown'
        ] },
      { week: 19, date: '2027-01-16', kickoff: null,
        name: 'NFC Wild Card',
        opponent: 'Detroit Lions', home: true, conference: false, playoff: true, overtime: true,
        result: { teamScore: 22, opponentScore: 25 }, booster: 'wager-for', line: 1.5,
        stats: {
          completions: 24, attempts: 35, passingYards: 258,
          passingYac: 99, passingTd: 2, interceptions: 0, carries: 1,
          rushingYards: -1, rushingTd: 0, rushingLong: 0, sacks: 3,
          fumbles: 0, passingAvg: 10.8, rating: 109, rushingAvg: -1
        },
        bigPlays: [
          '7 yard passing touchdown',
          '8 yard passing touchdown'
        ] },
    ],

    /* Sam Stogsdill — Pittsburgh Steelers */
    'sam-stogsdill': [
      { week:  1, date: '2026-09-13', kickoff: '1:00pm',
        opponent: 'Atlanta Falcons', home: true, conference: false,
        result: { teamScore: 32, opponentScore: 21 }, booster: null,
        stats: {
          carries: 22, rushingYards: 109, rushingTd: 2, rushingLong: 21,
          receptions: 4, receivingYards: 29, receivingYac: 9,
          receivingTd: 0, receivingLong: 19, targets: 4, fumbles: 0,
          rushingAvg: 5, receivingAvg: 7.3, totalYards: 138, totalTd: 2
        },
        bigPlays: [
          '2 yard rushing touchdown',
          '2 yard rushing touchdown'
        ] },
      { week:  2, date: '2026-09-20', kickoff: '1:00pm',
        opponent: 'New England Patriots', home: false, conference: false,
        result: { teamScore: 10, opponentScore: 23 }, booster: null,
        stats: {
          carries: 16, rushingYards: 62, rushingTd: 1, rushingLong: 18,
          receptions: 5, receivingYards: 20, receivingYac: 7,
          receivingTd: 0, receivingLong: 14, targets: 7, fumbles: 0,
          rushingAvg: 3.9, receivingAvg: 4, totalYards: 82, totalTd: 1
        },
        bigPlays: [
          '2 yard rushing touchdown'
        ] },
      { week:  3, date: '2026-09-27', kickoff: '1:00pm',
        opponent: 'Cincinnati Bengals', home: true, conference: false, division: true,
        result: { teamScore: 34, opponentScore: 13 }, booster: 'boost-1-5',
        stats: {
          carries: 28, rushingYards: 117, rushingTd: 2, rushingLong: 13,
          receptions: 3, receivingYards: 5, receivingYac: 3,
          receivingTd: 0, receivingLong: 5, targets: 4, fumbles: 1,
          rushingAvg: 4.2, receivingAvg: 1.7, totalYards: 122, totalTd: 2
        },
        bigPlays: [
          '2 yard rushing touchdown',
          '7 yard rushing touchdown'
        ] },
      { week:  4, date: '2026-10-01', kickoff: '8:15pm',
        opponent: 'Cleveland Browns', home: false, conference: false, division: true,
        result: { teamScore: 9, opponentScore: 34 }, booster: null,
        stats: {
          carries: 6, rushingYards: 18, rushingTd: 0, rushingLong: 7,
          receptions: 2, receivingYards: 18, receivingYac: 11,
          receivingTd: 0, receivingLong: 11, targets: 6, fumbles: 0,
          rushingAvg: 3, receivingAvg: 9, totalYards: 36, totalTd: 0
        } },
      { week:  5, date: '2026-10-11', kickoff: '1:00pm',
        opponent: 'Indianapolis Colts', home: true, conference: false,
        result: { teamScore: 40, opponentScore: 14 }, booster: null,
        stats: {
          carries: 26, rushingYards: 110, rushingTd: 3, rushingLong: 15,
          receptions: 2, receivingYards: 9, receivingYac: 3,
          receivingTd: 0, receivingLong: 6, targets: 5, fumbles: 0,
          rushingAvg: 4.2, receivingAvg: 4.5, totalYards: 119, totalTd: 3
        },
        bigPlays: [
          '4 yard rushing touchdown',
          '15 yard rushing touchdown',
          '10 yard rushing touchdown'
        ] },
      { week:  6, date: '2026-10-18', kickoff: '1:00pm',
        opponent: 'Tampa Bay Buccaneers', home: false, conference: false,
        result: { teamScore: 10, opponentScore: 14 }, booster: null,
        stats: {
          carries: 13, rushingYards: 61, rushingTd: 0, rushingLong: 23,
          receptions: 7, receivingYards: 44, receivingYac: 31,
          receivingTd: 0, receivingLong: 13, targets: 11, fumbles: 0,
          rushingAvg: 4.7, receivingAvg: 6.3, totalYards: 105, totalTd: 0
        } },
      { week:  7, date: '2026-10-25', kickoff: '9:30am',
        opponent: 'New Orleans Saints', home: false, conference: false, neutral: true,
        result: { teamScore: 21, opponentScore: 17 }, booster: null,
        stats: {
          carries: 21, rushingYards: 95, rushingTd: 0, rushingLong: 12,
          receptions: 2, receivingYards: 12, receivingYac: 6,
          receivingTd: 1, receivingLong: 10, targets: 3, fumbles: 0,
          rushingAvg: 4.5, receivingAvg: 6, totalYards: 107, totalTd: 1
        },
        bigPlays: [
          '10 yard receiving touchdown'
        ] },
      { week:  8, date: '2026-11-01', kickoff: '1:00pm',
        opponent: 'Cleveland Browns', home: true, conference: false, division: true,
        result: { teamScore: 27, opponentScore: 10 }, booster: null,
        stats: {
          carries: 23, rushingYards: 112, rushingTd: 0, rushingLong: 17,
          receptions: 4, receivingYards: 34, receivingYac: 16,
          receivingTd: 0, receivingLong: 10, targets: 7, fumbles: 0,
          rushingAvg: 4.9, receivingAvg: 8.5, totalYards: 146, totalTd: 0
        } },
      { week:  9, date: '2026-11-08', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week: 10, date: '2026-11-15', kickoff: '8:20pm',
        opponent: 'Cincinnati Bengals', home: false, conference: false, division: true,
        result: { teamScore: 44, opponentScore: 17 }, booster: 'boost-2-0',
        stats: {
          carries: 20, rushingYards: 129, rushingTd: 2, rushingLong: 20,
          receptions: 6, receivingYards: 40, receivingYac: 22,
          receivingTd: 0, receivingLong: 11, targets: 7, fumbles: 0,
          rushingAvg: 6.5, receivingAvg: 6.7, totalYards: 169, totalTd: 2
        },
        bigPlays: [
          '4 yard rushing touchdown',
          '5 yard rushing touchdown'
        ] },
      { week: 11, date: '2026-11-22', kickoff: '4:25pm',
        opponent: 'Philadelphia Eagles', home: false, conference: false,
        result: { teamScore: 31, opponentScore: 44 }, booster: null,
        stats: {
          carries: 9, rushingYards: 99, rushingTd: 1, rushingLong: 36,
          receptions: 1, receivingYards: 9, receivingYac: 5,
          receivingTd: 0, receivingLong: 9, targets: 2, fumbles: 0,
          rushingAvg: 11, receivingAvg: 9, totalYards: 108, totalTd: 1
        },
        bigPlays: [
          '36 yard rushing touchdown'
        ] },
      { week: 12, date: '2026-11-27', kickoff: '3:00pm',
        opponent: 'Denver Broncos', home: true, conference: false,
        result: { teamScore: 47, opponentScore: 14 }, booster: null,
        stats: {
          carries: 23, rushingYards: 102, rushingTd: 3, rushingLong: 12,
          receptions: 4, receivingYards: 42, receivingYac: 23,
          receivingTd: 0, receivingLong: 17, targets: 4, fumbles: 0,
          rushingAvg: 4.4, receivingAvg: 10.5, totalYards: 144, totalTd: 3
        },
        bigPlays: [
          '1 yard rushing touchdown',
          '3 yard rushing touchdown',
          '2 yard rushing touchdown'
        ] },
      { week: 13, date: '2026-12-06', kickoff: '8:20pm',
        opponent: 'Houston Texans', home: true, conference: false,
        result: { teamScore: 21, opponentScore: 24 }, booster: null,
        stats: {
          carries: 16, rushingYards: 118, rushingTd: 0, rushingLong: 27,
          receptions: 6, receivingYards: 25, receivingYac: 24,
          receivingTd: 0, receivingLong: 21, targets: 9, fumbles: 0,
          rushingAvg: 7.4, receivingAvg: 4.2, totalYards: 143, totalTd: 0
        } },
      { week: 14, date: '2026-12-14', kickoff: '8:15pm',
        opponent: 'Jacksonville Jaguars', home: false, conference: false,
        result: { teamScore: 16, opponentScore: 21 }, booster: null,
        stats: {
          carries: 22, rushingYards: 108, rushingTd: 0, rushingLong: 14,
          receptions: 4, receivingYards: 36, receivingYac: 21,
          receivingTd: 0, receivingLong: 16, targets: 4, fumbles: 0,
          rushingAvg: 4.9, receivingAvg: 9, totalYards: 144, totalTd: 0
        } },
      { week: 15, date: '2026-12-20', kickoff: '1:00pm',
        opponent: 'Baltimore Ravens', home: true, conference: false, division: true,
        result: { teamScore: 41, opponentScore: 16 }, booster: 'boost-1-5',
        stats: {
          carries: 22, rushingYards: 194, rushingTd: 2, rushingLong: 64,
          receptions: 8, receivingYards: 92, receivingYac: 67,
          receivingTd: 1, receivingLong: 30, targets: 10, fumbles: 0,
          rushingAvg: 8.8, receivingAvg: 11.5, totalYards: 286, totalTd: 3
        },
        bigPlays: [
          '5 yard receiving touchdown',
          '10 yard game-winning rushing touchdown',
          '4 yard rushing touchdown'
        ] },
      { week: 16, date: '2026-12-27', kickoff: '1:00pm',
        opponent: 'Carolina Panthers', home: true, conference: false,
        result: { teamScore: 19, opponentScore: 24 }, booster: null,
        stats: {
          carries: 12, rushingYards: 59, rushingTd: 0, rushingLong: 11,
          receptions: 4, receivingYards: 11, receivingYac: 11,
          receivingTd: 0, receivingLong: 9, targets: 6, fumbles: 0,
          rushingAvg: 4.9, receivingAvg: 2.8, totalYards: 70, totalTd: 0
        } },
      { week: 17, date: '2027-01-03', kickoff: '1:00pm',
        opponent: 'Tennessee Titans', home: false, conference: false,
        result: { teamScore: 24, opponentScore: 20 }, booster: null,
        stats: {
          carries: 15, rushingYards: 61, rushingTd: 0, rushingLong: 25,
          receptions: 3, receivingYards: 7, receivingYac: 6,
          receivingTd: 0, receivingLong: 10, targets: 5, fumbles: 0,
          rushingAvg: 4.1, receivingAvg: 2.3, totalYards: 68, totalTd: 0
        } },
      { week: 18, date: '2027-01-10', kickoff: '1:00pm',
        opponent: 'Baltimore Ravens', home: false, conference: false, division: true,
        result: { teamScore: 24, opponentScore: 27 }, booster: 'boost-1-5',
        stats: {
          carries: 14, rushingYards: 47, rushingTd: 0, rushingLong: 18,
          receptions: 5, receivingYards: 29, receivingYac: 19,
          receivingTd: 2, receivingLong: 11, targets: 6, fumbles: 0,
          rushingAvg: 3.4, receivingAvg: 5.8, totalYards: 76, totalTd: 2
        },
        bigPlays: [
          '6 yard receiving touchdown',
          '2 yard receiving touchdown'
        ] },
    ],

    /* Jaykeb Stewart — Houston Texans */
    'jaykeb-stewart': [
      { week:  1, date: '2026-09-13', kickoff: '12:00pm',
        opponent: 'Buffalo Bills', home: true, conference: false,
        result: { teamScore: 10, opponentScore: 21 }, booster: null,
        stats: {
          completions: 29, attempts: 42, passingYards: 225,
          passingYac: 107, passingTd: 1, interceptions: 0, carries: 7,
          rushingYards: 56, rushingTd: 0, rushingLong: 17, sacks: 0,
          fumbles: 0, passingAvg: 7.8, rating: 89.9, rushingAvg: 8
        },
        bigPlays: [
          '2 yard passing touchdown'
        ] },
      { week:  2, date: '2026-09-20', kickoff: '12:00pm',
        opponent: 'Cincinnati Bengals', home: true, conference: false,
        result: { teamScore: 34, opponentScore: 19 }, booster: 'boost-1-5',
        stats: {
          completions: 33, attempts: 39, passingYards: 382,
          passingYac: 139, passingTd: 2, interceptions: 1, carries: 4,
          rushingYards: 9, rushingTd: 0, rushingLong: 9, sacks: 1,
          fumbles: 0, passingAvg: 11.6, rating: 113.9, rushingAvg: 2.3
        },
        bigPlays: [
          '14 yard passing touchdown',
          '33 yard passing touchdown'
        ] },
      { week:  3, date: '2026-09-27', kickoff: '12:00pm',
        opponent: 'Indianapolis Colts', home: false, conference: false, division: true,
        result: { teamScore: 20, opponentScore: 3 }, booster: null,
        stats: {
          completions: 23, attempts: 33, passingYards: 229,
          passingYac: 80, passingTd: 2, interceptions: 1, carries: 7,
          rushingYards: 7, rushingTd: 0, rushingLong: 3, sacks: 3,
          fumbles: 0, passingAvg: 10, rating: 96.7, rushingAvg: 1
        },
        bigPlays: [
          '15 yard passing touchdown',
          '7 yard passing touchdown'
        ] },
      { week:  4, date: '2026-10-04', kickoff: '12:00pm',
        opponent: 'Dallas Cowboys', home: true, conference: false,
        result: { teamScore: 34, opponentScore: 31 }, booster: null,
        stats: {
          completions: 22, attempts: 31, passingYards: 208,
          passingYac: 95, passingTd: 4, interceptions: 1, carries: 6,
          rushingYards: 33, rushingTd: 0, rushingLong: 15, sacks: 2,
          fumbles: 0, passingAvg: 9.5, rating: 115.3, rushingAvg: 5.5
        },
        bigPlays: [
          '19 yard passing touchdown',
          '1 yard passing touchdown',
          '28 yard passing touchdown',
          '20 yard passing touchdown'
        ] },
      { week:  5, date: '2026-10-11', kickoff: '12:00pm',
        opponent: 'Tennessee Titans', home: false, conference: false, division: true,
        result: { teamScore: 31, opponentScore: 13 }, booster: null,
        stats: {
          completions: 21, attempts: 29, passingYards: 261,
          passingYac: 117, passingTd: 3, interceptions: 1, carries: 3,
          rushingYards: 18, rushingTd: 1, rushingLong: 15, sacks: 2,
          fumbles: 0, passingAvg: 12.4, rating: 120, rushingAvg: 6
        },
        bigPlays: [
          '20 yard passing touchdown',
          '5 yard passing touchdown',
          '3 yard rushing touchdown',
          '23 yard passing touchdown'
        ] },
      { week:  6, date: '2026-10-18', kickoff: '8:30am',
        opponent: 'Jacksonville Jaguars', home: false, conference: false, division: true, neutral: true,
        result: { teamScore: 15, opponentScore: 44 }, booster: null,
        stats: {
          completions: 23, attempts: 41, passingYards: 177,
          passingYac: 92, passingTd: 1, interceptions: 1, carries: 1,
          rushingYards: 21, rushingTd: 0, rushingLong: 21, sacks: 4,
          fumbles: 0, passingAvg: 7.7, rating: 64.8, rushingAvg: 21
        },
        bigPlays: [
          '2 yard passing touchdown'
        ] },
      { week:  7, date: '2026-10-25', kickoff: '12:00pm',
        opponent: 'New York Giants', home: true, conference: false,
        result: { teamScore: 20, opponentScore: 21 }, booster: null,
        stats: {
          completions: 25, attempts: 35, passingYards: 219,
          passingYac: 60, passingTd: 1, interceptions: 0, carries: 4,
          rushingYards: 13, rushingTd: 0, rushingLong: 8, sacks: 1,
          fumbles: 0, passingAvg: 8.8, rating: 97.2, rushingAvg: 3.3
        },
        bigPlays: [
          '6 yard passing touchdown'
        ] },
      { week:  8, date: '2026-11-01', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week:  9, date: '2026-11-08', kickoff: '3:05pm',
        opponent: 'Los Angeles Chargers', home: false, conference: false,
        result: { teamScore: 20, opponentScore: 16 }, booster: null,
        stats: {
          completions: 22, attempts: 34, passingYards: 228,
          passingYac: 90, passingTd: 0, interceptions: 0, carries: 8,
          rushingYards: 24, rushingTd: 1, rushingLong: 10, sacks: 1,
          fumbles: 0, passingAvg: 10.4, rating: 83.9, rushingAvg: 3
        },
        bigPlays: [
          '3 yard game-winning rushing touchdown'
        ] },
      { week: 10, date: '2026-11-15', kickoff: '12:00pm',
        opponent: 'Cleveland Browns', home: false, conference: false,
        result: { teamScore: 32, opponentScore: 12 }, booster: null,
        stats: {
          completions: 23, attempts: 28, passingYards: 315,
          passingYac: 97, passingTd: 4, interceptions: 1, carries: 8,
          rushingYards: 23, rushingTd: 0, rushingLong: 8, sacks: 1,
          fumbles: 0, passingAvg: 13.7, rating: 138.2, rushingAvg: 2.9
        },
        bigPlays: [
          '36 yard passing touchdown',
          '7 yard passing touchdown',
          '12 yard passing touchdown',
          '11 yard passing touchdown'
        ] },
      { week: 11, date: '2026-11-19', kickoff: '7:15pm',
        opponent: 'Indianapolis Colts', home: true, conference: false, division: true,
        result: { teamScore: 22, opponentScore: 14 }, booster: null,
        stats: {
          completions: 28, attempts: 35, passingYards: 304,
          passingYac: 130, passingTd: 2, interceptions: 0, carries: 6,
          rushingYards: 7, rushingTd: 0, rushingLong: 5, sacks: 3,
          fumbles: 0, passingAvg: 10.9, rating: 121.9, rushingAvg: 1.2
        },
        bigPlays: [
          '6 yard passing touchdown',
          '16 yard passing touchdown'
        ] },
      { week: 12, date: '2026-11-29', kickoff: '12:00pm',
        opponent: 'Baltimore Ravens', home: true, conference: false,
        result: { teamScore: 38, opponentScore: 10 }, booster: null,
        stats: {
          completions: 21, attempts: 28, passingYards: 338,
          passingYac: 74, passingTd: 3, interceptions: 0, carries: 9,
          rushingYards: 14, rushingTd: 0, rushingLong: 5, sacks: 0,
          fumbles: 0, passingAvg: 16.1, rating: 150.6, rushingAvg: 1.6
        },
        bigPlays: [
          '9 yard passing touchdown',
          '18 yard passing touchdown',
          '37 yard passing touchdown'
        ] },
      { week: 13, date: '2026-12-06', kickoff: '7:20pm',
        opponent: 'Pittsburgh Steelers', home: false, conference: false,
        result: { teamScore: 24, opponentScore: 21 }, booster: 'boost-2-0',
        stats: {
          completions: 31, attempts: 42, passingYards: 359,
          passingYac: 143, passingTd: 2, interceptions: 0, carries: 7,
          rushingYards: 22, rushingTd: 0, rushingLong: 13, sacks: 2,
          fumbles: 0, passingAvg: 11.6, rating: 115.1, rushingAvg: 3.1
        },
        bigPlays: [
          '40 yard passing touchdown',
          '9 yard game-winning passing touchdown'
        ] },
      { week: 14, date: '2026-12-13', kickoff: '12:00pm',
        opponent: 'Washington Commanders', home: false, conference: false,
        result: { teamScore: 17, opponentScore: 13 }, booster: 'boost-1-5',
        stats: {
          completions: 22, attempts: 29, passingYards: 278,
          passingYac: 69, passingTd: 1, interceptions: 0, carries: 6,
          rushingYards: 19, rushingTd: 0, rushingLong: 15, sacks: 2,
          fumbles: 0, passingAvg: 12.6, rating: 116.7, rushingAvg: 3.2
        },
        bigPlays: [
          '15 yard game-winning passing touchdown'
        ] },
      { week: 15, date: '2026-12-20', kickoff: '12:00pm',
        opponent: 'Jacksonville Jaguars', home: true, conference: false, division: true,
        result: { teamScore: 25, opponentScore: 26 }, booster: 'boost-1-5',
        stats: {
          completions: 23, attempts: 38, passingYards: 317,
          passingYac: 115, passingTd: 0, interceptions: 2, carries: 5,
          rushingYards: 22, rushingTd: 0, rushingLong: 15, sacks: 5,
          fumbles: 2, passingAvg: 13.8, rating: 65.4, rushingAvg: 4.4
        } },
      { week: 16, date: '2026-12-24', kickoff: '7:15pm',
        opponent: 'Philadelphia Eagles', home: false, conference: false,
        result: { teamScore: 40, opponentScore: 43 }, booster: 'boost-1-5',
        stats: {
          completions: 25, attempts: 37, passingYards: 272,
          passingYac: 119, passingTd: 2, interceptions: 0, carries: 6,
          rushingYards: 41, rushingTd: 0, rushingLong: 17, sacks: 2,
          fumbles: 0, passingAvg: 10.9, rating: 107, rushingAvg: 6.8
        },
        bigPlays: [
          '7 yard passing touchdown',
          '10 yard passing touchdown'
        ] },
      { week: 17, date: '2027-01-04', kickoff: '7:15pm',
        opponent: 'Green Bay Packers', home: false, conference: false,
        result: { teamScore: 31, opponentScore: 32 }, booster: null,
        stats: {
          completions: 21, attempts: 33, passingYards: 259,
          passingYac: 97, passingTd: 2, interceptions: 0, carries: 5,
          rushingYards: 13, rushingTd: 0, rushingLong: 7, sacks: 0,
          fumbles: 0, passingAvg: 12.3, rating: 108, rushingAvg: 2.6
        },
        bigPlays: [
          '16 yard passing touchdown',
          '16 yard passing touchdown'
        ] },
      { week: 18, date: '2027-01-10', kickoff: '12:00pm',
        opponent: 'Tennessee Titans', home: true, conference: false, division: true,
        result: { teamScore: 35, opponentScore: 7 }, booster: null,
        stats: {
          completions: 29, attempts: 34, passingYards: 315,
          passingYac: 108, passingTd: 3, interceptions: 0, carries: 7,
          rushingYards: 23, rushingTd: 1, rushingLong: 17, sacks: 1,
          fumbles: 0, passingAvg: 10.9, rating: 134.7, rushingAvg: 3.3
        },
        bigPlays: [
          '18 yard passing touchdown',
          '3 yard rushing touchdown',
          '23 yard passing touchdown',
          '5 yard passing touchdown'
        ] },
      { week: 19, date: '2027-01-16', kickoff: null,
        name: 'AFC Wild Card',
        opponent: 'New England Patriots', home: false, conference: false, playoff: true,
        result: { teamScore: 31, opponentScore: 42 }, booster: null,
        stats: {
          completions: 27, attempts: 37, passingYards: 301,
          passingYac: 144, passingTd: 3, interceptions: 1, carries: 2,
          rushingYards: 4, rushingTd: 0, rushingLong: 5, sacks: 0,
          fumbles: 0, passingAvg: 11.1, rating: 112.6, rushingAvg: 2
        },
        bigPlays: [
          '5 yard passing touchdown',
          '23 yard passing touchdown',
          '14 yard passing touchdown'
        ] },
    ],
  }
};
