/* ==========================================================================
   EGE Football — the 2024 season
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
   ========================================================================== */

window.EGE = window.EGE || {};
EGE.stats = EGE.stats || {};

EGE.stats[2024] = {
  season: 2024,
  level: 'NFL',

  /* Weeks the NFL Sim tab stored, written in here, and when each was
     saved: a stored week saved after this replaces the file's. */
  stored: {
    3: '2026-10-21T16:50:17.110Z',
    4: '2026-10-21T16:58:47.864Z',
    5: '2026-10-21T17:44:43.867Z',
    6: '2026-10-21T19:33:45.223Z',
    7: '2026-10-21T22:36:18.243Z',
    8: '2026-10-22T02:57:21.255Z',
    9: '2026-10-22T03:15:39.270Z',
    10: '2026-10-22T04:16:03.967Z',
    11: '2026-10-22T04:41:37.574Z',
    12: '2026-10-22T13:48:14.034Z',
    13: '2026-10-22T23:42:59.380Z',
    14: '2026-10-23T02:01:02.211Z',
    15: '2026-10-23T02:13:24.955Z',
    16: '2026-10-23T02:27:04.163Z',
    17: '2026-10-23T02:39:33.406Z',
    18: '2026-10-23T02:51:51.427Z',
    19: '2026-10-23T02:55:59.065Z',
    20: '2026-10-23T03:05:54.087Z',
    21: '2026-10-23T03:07:14.403Z',
    22: '2026-10-23T03:10:36.481Z'
  },

  games: {

    /* Andrew Parr — Detroit Lions */
    'andrew-parr': [
      { week:  1, date: '2024-09-08', kickoff: '8:20pm',
        opponent: 'Los Angeles Rams', home: true, conference: false,
        result: { teamScore: 27, opponentScore: 10 }, booster: null,
        stats: {
          receptions: 3, receivingYards: 22, receivingYac: 10,
          receivingTd: 0, receivingLong: 11, targets: 4, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 7.3, totalYards: 22, totalTd: 0
        } },
      { week:  2, date: '2024-09-15', kickoff: '1:00pm',
        opponent: 'Tampa Bay Buccaneers', home: true, conference: false,
        result: { teamScore: 27, opponentScore: 16 }, booster: null,
        stats: {
          receptions: 2, receivingYards: 18, receivingYac: 0,
          receivingTd: 1, receivingLong: 16, targets: 4, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 9, totalYards: 18, totalTd: 1
        },
        bigPlays: [
          '16 yard receiving touchdown'
        ] },
      { week:  3, date: '2024-09-22', kickoff: '4:25pm',
        opponent: 'Arizona Cardinals', home: false, conference: false,
        result: { teamScore: 12, opponentScore: 18 }, booster: null,
        stats: {
          receptions: 6, receivingYards: 44, receivingYac: 10,
          receivingTd: 0, receivingLong: 19, targets: 9, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 7.3, totalYards: 44, totalTd: 0
        } },
      { week:  4, date: '2024-09-30', kickoff: '8:15pm',
        opponent: 'Seattle Seahawks', home: true, conference: false,
        result: { teamScore: 11, opponentScore: 22 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 26, receivingYac: 5,
          receivingTd: 0, receivingLong: 13, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 6.5, totalYards: 26, totalTd: 0
        } },
      { week:  5, date: '2024-10-06', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week:  6, date: '2024-10-13', kickoff: '4:25pm',
        opponent: 'Dallas Cowboys', home: false, conference: false,
        result: { teamScore: 23, opponentScore: 14 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 42, receivingYac: 4,
          receivingTd: 1, receivingLong: 18, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 10.5, totalYards: 42, totalTd: 1
        },
        bigPlays: [
          '6 yard receiving touchdown'
        ] },
      { week:  7, date: '2024-10-20', kickoff: '1:00pm',
        opponent: 'Minnesota Vikings', home: false, conference: false, division: true,
        result: { teamScore: 18, opponentScore: 16 }, booster: null,
        stats: {
          receptions: 3, receivingYards: 35, receivingYac: 21,
          receivingTd: 0, receivingLong: 13, targets: 4, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 11.7, totalYards: 35, totalTd: 0
        } },
      { week:  8, date: '2024-10-27', kickoff: '1:00pm',
        opponent: 'Tennessee Titans', home: true, conference: false,
        result: { teamScore: 34, opponentScore: 3 }, booster: null,
        stats: {
          receptions: 3, receivingYards: 26, receivingYac: 4,
          receivingTd: 0, receivingLong: 16, targets: 3, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 8.7, totalYards: 26, totalTd: 0
        } },
      { week:  9, date: '2024-11-03', kickoff: '4:25pm',
        opponent: 'Green Bay Packers', home: false, conference: false, division: true,
        result: { teamScore: 21, opponentScore: 16 }, booster: null,
        stats: {
          receptions: 3, receivingYards: 33, receivingYac: 16,
          receivingTd: 0, receivingLong: 20, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 11, totalYards: 33, totalTd: 0
        } },
      { week: 10, date: '2024-11-10', kickoff: '8:20pm',
        opponent: 'Houston Texans', home: false, conference: false,
        result: { teamScore: 43, opponentScore: 16 }, booster: null,
        stats: {
          receptions: 2, receivingYards: 18, receivingYac: 2,
          receivingTd: 1, receivingLong: 13, targets: 5, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 9, totalYards: 18, totalTd: 1
        },
        bigPlays: [
          '5 yard receiving touchdown'
        ] },
      { week: 11, date: '2024-11-17', kickoff: '1:00pm',
        opponent: 'Jacksonville Jaguars', home: true, conference: false,
        result: { teamScore: 10, opponentScore: 17 }, booster: null,
        stats: {
          receptions: 8, receivingYards: 63, receivingYac: 41,
          receivingTd: 0, receivingLong: 16, targets: 13, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 7.9, totalYards: 63, totalTd: 0
        } },
      { week: 12, date: '2024-11-24', kickoff: '1:00pm',
        opponent: 'Indianapolis Colts', home: false, conference: false,
        result: { teamScore: 31, opponentScore: 8 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 55, receivingYac: 10,
          receivingTd: 0, receivingLong: 21, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 11, totalYards: 55, totalTd: 0
        } },
      { week: 13, date: '2024-11-28', kickoff: '12:30pm',
        opponent: 'Chicago Bears', home: true, conference: false, division: true,
        result: { teamScore: 28, opponentScore: 14 }, booster: null,
        stats: {
          receptions: 2, receivingYards: 16, receivingYac: 1,
          receivingTd: 2, receivingLong: 16, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 8, totalYards: 16, totalTd: 2
        },
        bigPlays: [
          '0 yard receiving touchdown',
          '16 yard receiving touchdown'
        ] },
      { week: 14, date: '2024-12-05', kickoff: '8:15pm',
        opponent: 'Green Bay Packers', home: true, conference: false, division: true,
        result: { teamScore: 17, opponentScore: 9 }, booster: null,
        stats: {
          receptions: 1, receivingYards: 9, receivingYac: 9,
          receivingTd: 0, receivingLong: 9, targets: 2, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 9, totalYards: 9, totalTd: 0
        } },
      { week: 15, date: '2024-12-15', kickoff: '4:25pm',
        opponent: 'Buffalo Bills', home: true, conference: false,
        result: { teamScore: 14, opponentScore: 33 }, booster: null,
        stats: {
          receptions: 1, receivingYards: 12, receivingYac: 10,
          receivingTd: 0, receivingLong: 12, targets: 2, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 12, totalYards: 12, totalTd: 0
        } },
      { week: 16, date: '2024-12-22', kickoff: '1:00pm',
        opponent: 'Chicago Bears', home: false, conference: false, division: true,
        result: { teamScore: 19, opponentScore: 10 }, booster: null,
        stats: {
          receptions: 3, receivingYards: 33, receivingYac: 13,
          receivingTd: 1, receivingLong: 15, targets: 4, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 11, totalYards: 33, totalTd: 1
        },
        bigPlays: [
          '7 yard receiving touchdown'
        ] },
      { week: 17, date: '2024-12-30', kickoff: '8:15pm',
        opponent: 'San Francisco 49ers', home: false, conference: false,
        result: { teamScore: 20, opponentScore: 34 }, booster: null,
        stats: {
          receptions: 3, receivingYards: 42, receivingYac: 5,
          receivingTd: 1, receivingLong: 20, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 14, totalYards: 42, totalTd: 1
        },
        bigPlays: [
          '2 yard receiving touchdown'
        ] },
      { week: 18, date: '2025-01-05', kickoff: '8:20pm',
        opponent: 'Minnesota Vikings', home: true, conference: false, division: true,
        result: { teamScore: 15, opponentScore: 26 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 61, receivingYac: 12,
          receivingTd: 0, receivingLong: 19, targets: 8, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 12.2, totalYards: 61, totalTd: 0
        } },
      { week: 19, date: '2025-01-11', kickoff: null,
        name: 'NFC Wild Card',
        opponent: 'Dallas Cowboys', home: true, conference: false, playoff: true,
        result: { teamScore: 19, opponentScore: 10 }, booster: null,
        stats: {
          receptions: 6, receivingYards: 36, receivingYac: 17,
          receivingTd: 0, receivingLong: 11, targets: 7, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 6, totalYards: 36, totalTd: 0
        } },
      { week: 20, date: '2025-01-18', kickoff: null,
        name: 'NFC Divisional Round',
        opponent: 'Seattle Seahawks', home: false, conference: false, playoff: true,
        result: { teamScore: 18, opponentScore: 9 }, booster: null,
        stats: {
          receptions: 1, receivingYards: 24, receivingYac: 0,
          receivingTd: 0, receivingLong: 24, targets: 1, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 24, totalYards: 24, totalTd: 0
        } },
      { week: 21, date: '2025-01-26', kickoff: null,
        name: 'NFC Championship',
        opponent: 'New York Giants', home: false, conference: false, playoff: true, overtime: true,
        result: { teamScore: 23, opponentScore: 29 }, booster: null,
        stats: {
          receptions: 6, receivingYards: 81, receivingYac: 31,
          receivingTd: 0, receivingLong: 39, targets: 8, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 13.5, totalYards: 81, totalTd: 0
        } },
    ],

    /* Cooper Clark — Chicago Bears */
    'cooper-clark': [
      { week:  1, date: '2024-09-08', kickoff: '12:00pm',
        opponent: 'Tennessee Titans', home: true, conference: false,
        result: { teamScore: 35, opponentScore: 7 }, booster: null,
        stats: {
          carries: 17, rushingYards: 108, rushingTd: 1, rushingLong: 72,
          receptions: 4, receivingYards: 76, receivingYac: 69,
          receivingTd: 0, receivingLong: 41, targets: 4, fumbles: 0,
          rushingAvg: 6.4, receivingAvg: 19, totalYards: 184, totalTd: 1
        },
        bigPlays: [
          '4 yard rushing touchdown'
        ] },
      { week:  2, date: '2024-09-15', kickoff: '7:20pm',
        opponent: 'Houston Texans', home: false, conference: false,
        result: { teamScore: 20, opponentScore: 23 }, booster: null,
        stats: {
          carries: 10, rushingYards: 36, rushingTd: 0, rushingLong: 16,
          receptions: 4, receivingYards: 41, receivingYac: 33,
          receivingTd: 0, receivingLong: 28, targets: 7, fumbles: 0,
          rushingAvg: 3.6, receivingAvg: 10.3, totalYards: 77, totalTd: 0
        } },
      { week:  3, date: '2024-09-22', kickoff: '12:00pm',
        opponent: 'Indianapolis Colts', home: false, conference: false,
        result: { teamScore: 41, opponentScore: 16 }, booster: null,
        stats: {
          carries: 9, rushingYards: 44, rushingTd: 0, rushingLong: 21,
          receptions: 2, receivingYards: 13, receivingYac: 7,
          receivingTd: 0, receivingLong: 8, targets: 3, fumbles: 1,
          rushingAvg: 4.9, receivingAvg: 6.5, totalYards: 57, totalTd: 0
        } },
      { week:  4, date: '2024-09-29', kickoff: '12:00pm',
        opponent: 'Los Angeles Rams', home: true, conference: false, overtime: true,
        result: { teamScore: 20, opponentScore: 23 }, booster: null,
        stats: {
          carries: 11, rushingYards: 18, rushingTd: 0, rushingLong: 10,
          receptions: 4, receivingYards: 44, receivingYac: 27,
          receivingTd: 0, receivingLong: 19, targets: 6, fumbles: 0,
          rushingAvg: 1.6, receivingAvg: 11, totalYards: 62, totalTd: 0
        } },
      { week:  5, date: '2024-10-06', kickoff: '12:00pm',
        opponent: 'Carolina Panthers', home: true, conference: false,
        result: { teamScore: 29, opponentScore: 10 }, booster: null,
        stats: {
          carries: 15, rushingYards: 76, rushingTd: 0, rushingLong: 14,
          receptions: 3, receivingYards: 19, receivingYac: 4,
          receivingTd: 0, receivingLong: 7, targets: 4, fumbles: 0,
          rushingAvg: 5.1, receivingAvg: 6.3, totalYards: 95, totalTd: 0
        } },
      { week:  6, date: '2024-10-13', kickoff: '8:30am',
        opponent: 'Jacksonville Jaguars', home: false, conference: false, neutral: true, injured: true, injury: 'Back', health: 80,
        result: { teamScore: 23, opponentScore: 19 }, booster: null,
        stats: {
          carries: 0, rushingYards: 0, rushingTd: 0, rushingLong: 0,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 0,
          totalYards: 0, totalTd: 0
        } },
      { week:  7, date: '2024-10-20', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week:  8, date: '2024-10-27', kickoff: '3:25pm',
        opponent: 'Washington Commanders', home: false, conference: false,
        result: { teamScore: 13, opponentScore: 9 }, booster: null,
        stats: {
          carries: 17, rushingYards: 94, rushingTd: 0, rushingLong: 19,
          receptions: 6, receivingYards: 58, receivingYac: 42,
          receivingTd: 0, receivingLong: 25, targets: 7, fumbles: 0,
          rushingAvg: 5.5, receivingAvg: 9.7, totalYards: 152, totalTd: 0
        } },
      { week:  9, date: '2024-11-03', kickoff: '3:05pm',
        opponent: 'Arizona Cardinals', home: false, conference: false,
        result: { teamScore: 10, opponentScore: 23 }, booster: null,
        stats: {
          carries: 11, rushingYards: 38, rushingTd: 0, rushingLong: 11,
          receptions: 3, receivingYards: 33, receivingYac: 6,
          receivingTd: 1, receivingLong: 20, targets: 5, fumbles: 0,
          rushingAvg: 3.5, receivingAvg: 11, totalYards: 71, totalTd: 1
        },
        bigPlays: [
          '5 yard receiving touchdown'
        ] },
      { week: 10, date: '2024-11-10', kickoff: '12:00pm',
        opponent: 'New England Patriots', home: true, conference: false,
        result: { teamScore: 26, opponentScore: 0 }, booster: null,
        stats: {
          carries: 26, rushingYards: 94, rushingTd: 2, rushingLong: 10,
          receptions: 4, receivingYards: 23, receivingYac: 10,
          receivingTd: 0, receivingLong: 11, targets: 6, fumbles: 0,
          rushingAvg: 3.6, receivingAvg: 5.8, totalYards: 117, totalTd: 2
        },
        bigPlays: [
          '2 yard rushing touchdown',
          '3 yard rushing touchdown'
        ] },
      { week: 11, date: '2024-11-17', kickoff: '12:00pm',
        opponent: 'Green Bay Packers', home: true, conference: false, division: true,
        result: { teamScore: 20, opponentScore: 15 }, booster: null,
        stats: {
          carries: 19, rushingYards: 71, rushingTd: 0, rushingLong: 22,
          receptions: 1, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 4, fumbles: 0,
          rushingAvg: 3.7, receivingAvg: 0, totalYards: 71, totalTd: 0
        } },
      { week: 12, date: '2024-11-24', kickoff: '12:00pm',
        opponent: 'Minnesota Vikings', home: true, conference: false, division: true,
        result: { teamScore: 23, opponentScore: 6 }, booster: null,
        stats: {
          carries: 19, rushingYards: 74, rushingTd: 2, rushingLong: 16,
          receptions: 4, receivingYards: 25, receivingYac: 21,
          receivingTd: 0, receivingLong: 13, targets: 8, fumbles: 0,
          rushingAvg: 3.9, receivingAvg: 6.3, totalYards: 99, totalTd: 2
        },
        bigPlays: [
          '1 yard rushing touchdown',
          '2 yard rushing touchdown'
        ] },
      { week: 13, date: '2024-11-28', kickoff: '11:30am',
        opponent: 'Detroit Lions', home: false, conference: false, division: true,
        result: { teamScore: 14, opponentScore: 28 }, booster: null,
        stats: {
          carries: 19, rushingYards: 137, rushingTd: 0, rushingLong: 39,
          receptions: 5, receivingYards: 13, receivingYac: 2,
          receivingTd: 0, receivingLong: 10, targets: 6, fumbles: 0,
          rushingAvg: 7.2, receivingAvg: 2.6, totalYards: 150, totalTd: 0
        } },
      { week: 14, date: '2024-12-08', kickoff: '3:25pm',
        opponent: 'San Francisco 49ers', home: false, conference: false,
        result: { teamScore: 14, opponentScore: 29 }, booster: null,
        stats: {
          carries: 11, rushingYards: 36, rushingTd: 1, rushingLong: 17,
          receptions: 1, receivingYards: 4, receivingYac: 3,
          receivingTd: 0, receivingLong: 4, targets: 3, fumbles: 0,
          rushingAvg: 3.3, receivingAvg: 4, totalYards: 40, totalTd: 1
        },
        bigPlays: [
          '17 yard rushing touchdown'
        ] },
      { week: 15, date: '2024-12-16', kickoff: '7:00pm',
        opponent: 'Minnesota Vikings', home: false, conference: false, division: true,
        result: { teamScore: 25, opponentScore: 19 }, booster: null,
        stats: {
          carries: 17, rushingYards: 55, rushingTd: 1, rushingLong: 7,
          receptions: 5, receivingYards: 66, receivingYac: 63,
          receivingTd: 0, receivingLong: 49, targets: 6, fumbles: 0,
          rushingAvg: 3.2, receivingAvg: 13.2, totalYards: 121, totalTd: 1
        },
        bigPlays: [
          '1 yard rushing touchdown'
        ] },
      { week: 16, date: '2024-12-22', kickoff: '12:00pm',
        opponent: 'Detroit Lions', home: true, conference: false, division: true,
        result: { teamScore: 10, opponentScore: 19 }, booster: null,
        stats: {
          carries: 12, rushingYards: 70, rushingTd: 0, rushingLong: 16,
          receptions: 1, receivingYards: 6, receivingYac: 2,
          receivingTd: 0, receivingLong: 6, targets: 4, fumbles: 0,
          rushingAvg: 5.8, receivingAvg: 6, totalYards: 76, totalTd: 0
        } },
      { week: 17, date: '2024-12-26', kickoff: '7:15pm',
        opponent: 'Seattle Seahawks', home: true, conference: false,
        result: { teamScore: 20, opponentScore: 22 }, booster: null,
        stats: {
          carries: 17, rushingYards: 152, rushingTd: 2, rushingLong: 84,
          receptions: 2, receivingYards: 12, receivingYac: 5,
          receivingTd: 0, receivingLong: 7, targets: 3, fumbles: 0,
          rushingAvg: 8.9, receivingAvg: 6, totalYards: 164, totalTd: 2
        },
        bigPlays: [
          '84 yard rushing touchdown',
          '5 yard rushing touchdown'
        ] },
      { week: 18, date: '2025-01-05', kickoff: '12:00pm',
        opponent: 'Green Bay Packers', home: false, conference: false, division: true,
        result: { teamScore: 6, opponentScore: 16 }, booster: null,
        stats: {
          carries: 7, rushingYards: 17, rushingTd: 0, rushingLong: 10,
          receptions: 3, receivingYards: 18, receivingYac: 10,
          receivingTd: 0, receivingLong: 10, targets: 6, fumbles: 0,
          rushingAvg: 2.4, receivingAvg: 6, totalYards: 35, totalTd: 0
        } },
    ],

    /* Paxon Hatch — New York Giants */
    'paxon-hatch': [
      { week:  1, date: '2024-09-08', kickoff: '1:00pm',
        opponent: 'Minnesota Vikings', home: true, conference: false,
        result: { teamScore: 31, opponentScore: 21 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 29, receivingYac: 6,
          receivingTd: 1, receivingLong: 10, targets: 4, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 7.3, totalYards: 29, totalTd: 1
        },
        bigPlays: [
          '10 yard receiving touchdown'
        ] },
      { week:  2, date: '2024-09-15', kickoff: '1:00pm',
        opponent: 'Washington Commanders', home: false, conference: false, division: true,
        result: { teamScore: 23, opponentScore: 13 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 71, receivingYac: 16,
          receivingTd: 2, receivingLong: 30, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 14.2, totalYards: 71, totalTd: 2
        },
        bigPlays: [
          '26 yard receiving touchdown',
          '4 yard receiving touchdown'
        ] },
      { week:  3, date: '2024-09-22', kickoff: '1:00pm',
        opponent: 'Cleveland Browns', home: false, conference: false, overtime: true,
        result: { teamScore: 19, opponentScore: 13 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 42, receivingYac: 4,
          receivingTd: 2, receivingLong: 19, targets: 8, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 8.4, totalYards: 42, totalTd: 2
        },
        bigPlays: [
          '14 yard receiving touchdown',
          '4 yard game-winning receiving touchdown'
        ] },
      { week:  4, date: '2024-09-26', kickoff: '8:15pm',
        opponent: 'Dallas Cowboys', home: true, conference: false, division: true,
        result: { teamScore: 28, opponentScore: 10 }, booster: null,
        stats: {
          receptions: 8, receivingYards: 99, receivingYac: 17,
          receivingTd: 1, receivingLong: 26, targets: 10, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 12.4, totalYards: 99, totalTd: 1
        },
        bigPlays: [
          '8 yard receiving touchdown'
        ] },
      { week:  5, date: '2024-10-06', kickoff: '4:25pm',
        opponent: 'Seattle Seahawks', home: false, conference: false,
        result: { teamScore: 17, opponentScore: 10 }, booster: null,
        stats: {
          receptions: 6, receivingYards: 59, receivingYac: 23,
          receivingTd: 0, receivingLong: 21, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 9.8, totalYards: 59, totalTd: 0
        } },
      { week:  6, date: '2024-10-13', kickoff: '8:20pm',
        opponent: 'Cincinnati Bengals', home: true, conference: false,
        result: { teamScore: 17, opponentScore: 34 }, booster: null,
        stats: {
          receptions: 3, receivingYards: 33, receivingYac: 8,
          receivingTd: 0, receivingLong: 20, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 11, totalYards: 33, totalTd: 0
        } },
      { week:  7, date: '2024-10-20', kickoff: '1:00pm',
        opponent: 'Philadelphia Eagles', home: true, conference: false, division: true, overtime: true,
        result: { teamScore: 31, opponentScore: 28 }, booster: null,
        stats: {
          receptions: 6, receivingYards: 92, receivingYac: 17,
          receivingTd: 0, receivingLong: 36, targets: 8, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 15.3, totalYards: 92, totalTd: 0
        } },
      { week:  8, date: '2024-10-28', kickoff: '8:15pm',
        opponent: 'Pittsburgh Steelers', home: false, conference: false,
        result: { teamScore: 30, opponentScore: 32 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 80, receivingYac: 13,
          receivingTd: 0, receivingLong: 20, targets: 10, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 16, totalYards: 80, totalTd: 0
        } },
      { week:  9, date: '2024-11-03', kickoff: '1:00pm',
        opponent: 'Washington Commanders', home: true, conference: false, division: true,
        result: { teamScore: 15, opponentScore: 13 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 44, receivingYac: 23,
          receivingTd: 1, receivingLong: 18, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 11, totalYards: 44, totalTd: 1
        },
        bigPlays: [
          '2 yard receiving touchdown'
        ] },
      { week: 10, date: '2024-11-10', kickoff: '9:30am',
        opponent: 'Carolina Panthers', home: false, conference: false, neutral: true, overtime: true,
        result: { teamScore: 30, opponentScore: 24 }, booster: null,
        stats: {
          receptions: 3, receivingYards: 55, receivingYac: 8,
          receivingTd: 1, receivingLong: 37, targets: 3, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 18.3, totalYards: 55, totalTd: 1
        },
        bigPlays: [
          '14 yard receiving touchdown'
        ] },
      { week: 11, date: '2024-11-17', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week: 12, date: '2024-11-24', kickoff: '1:00pm',
        opponent: 'Tampa Bay Buccaneers', home: true, conference: false,
        result: { teamScore: 20, opponentScore: 0 }, booster: null,
        stats: {
          receptions: 6, receivingYards: 90, receivingYac: 18,
          receivingTd: 1, receivingLong: 38, targets: 10, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 15, totalYards: 90, totalTd: 1
        },
        bigPlays: [
          '10 yard receiving touchdown'
        ] },
      { week: 13, date: '2024-11-28', kickoff: '4:30pm',
        opponent: 'Dallas Cowboys', home: false, conference: false, division: true,
        result: { teamScore: 19, opponentScore: 52 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 53, receivingYac: 26,
          receivingTd: 0, receivingLong: 24, targets: 9, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 13.3, totalYards: 53, totalTd: 0
        } },
      { week: 14, date: '2024-12-08', kickoff: '1:00pm',
        opponent: 'New Orleans Saints', home: true, conference: false,
        result: { teamScore: 29, opponentScore: 13 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 58, receivingYac: 8,
          receivingTd: 1, receivingLong: 25, targets: 8, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 11.6, totalYards: 58, totalTd: 1
        },
        bigPlays: [
          '16 yard receiving touchdown'
        ] },
      { week: 15, date: '2024-12-15', kickoff: '1:00pm',
        opponent: 'Baltimore Ravens', home: true, conference: false,
        result: { teamScore: 17, opponentScore: 20 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 40, receivingYac: 11,
          receivingTd: 0, receivingLong: 16, targets: 5, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 10, totalYards: 40, totalTd: 0
        } },
      { week: 16, date: '2024-12-22', kickoff: '1:00pm',
        opponent: 'Atlanta Falcons', home: false, conference: false,
        result: { teamScore: 29, opponentScore: 9 }, booster: null,
        stats: {
          receptions: 3, receivingYards: 39, receivingYac: 3,
          receivingTd: 0, receivingLong: 19, targets: 5, carries: 1,
          rushingYards: 5, rushingTd: 0, rushingLong: 5, fumbles: 0,
          rushingAvg: 5, receivingAvg: 13, totalYards: 44, totalTd: 0
        } },
      { week: 17, date: '2024-12-29', kickoff: '1:00pm',
        opponent: 'Indianapolis Colts', home: true, conference: false,
        result: { teamScore: 30, opponentScore: 3 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 24, receivingYac: 9,
          receivingTd: 0, receivingLong: 9, targets: 7, carries: 1,
          rushingYards: 16, rushingTd: 0, rushingLong: 16, fumbles: 0,
          rushingAvg: 16, receivingAvg: 6, totalYards: 40, totalTd: 0
        } },
      { week: 18, date: '2025-01-05', kickoff: '1:00pm',
        opponent: 'Philadelphia Eagles', home: false, conference: false, division: true,
        result: { teamScore: 20, opponentScore: 44 }, booster: null,
        stats: {
          receptions: 8, receivingYards: 118, receivingYac: 33,
          receivingTd: 2, receivingLong: 26, targets: 15, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 14.8, totalYards: 118, totalTd: 2
        },
        bigPlays: [
          '26 yard receiving touchdown',
          '4 yard receiving touchdown'
        ] },
      { week: 20, date: '2025-01-18', kickoff: null,
        name: 'NFC Divisional Round',
        opponent: 'San Francisco 49ers', home: true, conference: false, playoff: true,
        result: { teamScore: 40, opponentScore: 6 }, booster: null,
        stats: {
          receptions: 6, receivingYards: 83, receivingYac: 24,
          receivingTd: 0, receivingLong: 22, targets: 7, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 13.8, totalYards: 83, totalTd: 0
        } },
      { week: 21, date: '2025-01-26', kickoff: null,
        name: 'NFC Championship',
        opponent: 'Detroit Lions', home: true, conference: false, playoff: true, overtime: true,
        result: { teamScore: 29, opponentScore: 23 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 69, receivingYac: 11,
          receivingTd: 2, receivingLong: 22, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 13.8, totalYards: 69, totalTd: 2
        },
        bigPlays: [
          '14 yard receiving touchdown',
          '19 yard receiving touchdown'
        ] },
      { week: 22, date: '2025-02-09', kickoff: null,
        name: 'Super Bowl LIX',
        opponent: 'Baltimore Ravens', home: false, conference: false, neutral: true, playoff: true,
        result: { teamScore: 30, opponentScore: 20 }, booster: null,
        stats: {
          receptions: 7, receivingYards: 94, receivingYac: 5,
          receivingTd: 1, receivingLong: 35, targets: 11, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 13.4, totalYards: 94, totalTd: 1
        },
        bigPlays: [
          '27 yard receiving touchdown'
        ] },
    ],

    /* Isaac Vitel — Tampa Bay Buccaneers */
    'isaac-vitel': [
      { week:  1, date: '2024-09-08', kickoff: '4:25pm',
        opponent: 'Washington Commanders', home: true, conference: false,
        result: { teamScore: 34, opponentScore: 9 }, booster: null,
        stats: {
          completions: 0, attempts: 0, passingYards: 0, passingYac: 0,
          passingTd: 0, interceptions: 0, carries: 0, rushingYards: 0,
          rushingTd: 0, rushingLong: 0, sacks: 0, fumbles: 0
        } },
      { week:  2, date: '2024-09-15', kickoff: '1:00pm',
        opponent: 'Detroit Lions', home: false, conference: false,
        result: { teamScore: 16, opponentScore: 27 }, booster: null,
        stats: {
          completions: 26, attempts: 46, passingYards: 210,
          passingYac: 112, passingTd: 0, interceptions: 1, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, sacks: 8,
          fumbles: 0, passingAvg: 8.1, rating: 59.1
        } },
      { week:  3, date: '2024-09-22', kickoff: '1:00pm',
        opponent: 'Denver Broncos', home: true, conference: false,
        result: { teamScore: 26, opponentScore: 14 }, booster: null,
        stats: {
          completions: 23, attempts: 27, passingYards: 204,
          passingYac: 68, passingTd: 0, interceptions: 0, carries: 3,
          rushingYards: -1, rushingTd: 1, rushingLong: 1, sacks: 5,
          fumbles: 0, passingAvg: 8.9, rating: 98.1, rushingAvg: -0.3
        },
        bigPlays: [
          '1 yard rushing touchdown'
        ] },
      { week:  4, date: '2024-09-29', kickoff: '1:00pm',
        opponent: 'Philadelphia Eagles', home: true, conference: false,
        result: { teamScore: 22, opponentScore: 17 }, booster: null,
        stats: {
          completions: 24, attempts: 37, passingYards: 261,
          passingYac: 112, passingTd: 1, interceptions: 0, carries: 3,
          rushingYards: -3, rushingTd: 0, rushingLong: 0, sacks: 1,
          fumbles: 0, passingAvg: 10.9, rating: 94.5, rushingAvg: -1
        },
        bigPlays: [
          '1 yard game-winning passing touchdown'
        ] },
      { week:  5, date: '2024-10-03', kickoff: '8:15pm',
        opponent: 'Atlanta Falcons', home: false, conference: false, division: true,
        result: { teamScore: 6, opponentScore: 16 }, booster: null,
        stats: {
          completions: 22, attempts: 34, passingYards: 223,
          passingYac: 83, passingTd: 0, interceptions: 2, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, sacks: 6,
          fumbles: 0, passingAvg: 10.1, rating: 58.8
        } },
      { week:  6, date: '2024-10-13', kickoff: '1:00pm',
        opponent: 'New Orleans Saints', home: false, conference: false, division: true,
        result: { teamScore: 21, opponentScore: 13 }, booster: null,
        stats: {
          completions: 12, attempts: 23, passingYards: 144,
          passingYac: 82, passingTd: 1, interceptions: 0, carries: 3,
          rushingYards: -3, rushingTd: 0, rushingLong: 0, sacks: 3,
          fumbles: 0, passingAvg: 12, rating: 86.1, rushingAvg: -1
        },
        bigPlays: [
          '32 yard passing touchdown'
        ] },
      { week:  7, date: '2024-10-21', kickoff: '8:15pm',
        opponent: 'Baltimore Ravens', home: true, conference: false,
        result: { teamScore: 24, opponentScore: 12 }, booster: null,
        stats: {
          completions: 23, attempts: 34, passingYards: 234,
          passingYac: 59, passingTd: 2, interceptions: 1, carries: 5,
          rushingYards: 2, rushingTd: 0, rushingLong: 2, sacks: 5,
          fumbles: 0, passingAvg: 10.2, rating: 94.5, rushingAvg: 0.4
        },
        bigPlays: [
          '7 yard passing touchdown',
          '15 yard passing touchdown'
        ] },
      { week:  8, date: '2024-10-27', kickoff: '1:00pm',
        opponent: 'Atlanta Falcons', home: true, conference: false, division: true,
        result: { teamScore: 38, opponentScore: 21 }, booster: null,
        stats: {
          completions: 25, attempts: 34, passingYards: 258,
          passingYac: 97, passingTd: 2, interceptions: 1, carries: 3,
          rushingYards: 5, rushingTd: 0, rushingLong: 4, sacks: 0,
          fumbles: 0, passingAvg: 10.3, rating: 102.3, rushingAvg: 1.7
        },
        bigPlays: [
          '16 yard passing touchdown',
          '18 yard passing touchdown'
        ] },
      { week:  9, date: '2024-11-04', kickoff: '8:15pm',
        opponent: 'Kansas City Chiefs', home: false, conference: false,
        result: { teamScore: 21, opponentScore: 31 }, booster: null,
        stats: {
          completions: 27, attempts: 44, passingYards: 325,
          passingYac: 80, passingTd: 3, interceptions: 0, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, sacks: 7,
          fumbles: 2, passingAvg: 12, rating: 106.7
        },
        bigPlays: [
          '12 yard passing touchdown',
          '14 yard passing touchdown',
          '35 yard passing touchdown'
        ] },
      { week: 10, date: '2024-11-10', kickoff: '1:00pm',
        opponent: 'San Francisco 49ers', home: true, conference: false,
        result: { teamScore: 10, opponentScore: 41 }, booster: null,
        stats: {
          completions: 25, attempts: 37, passingYards: 191,
          passingYac: 43, passingTd: 0, interceptions: 2, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, sacks: 3,
          fumbles: 0, passingAvg: 7.6, rating: 57.4
        } },
      { week: 11, date: '2024-11-17', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week: 12, date: '2024-11-24', kickoff: '1:00pm',
        opponent: 'New York Giants', home: false, conference: false,
        result: { teamScore: 0, opponentScore: 20 }, booster: null,
        stats: {
          completions: 16, attempts: 31, passingYards: 198,
          passingYac: 83, passingTd: 0, interceptions: 0, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, sacks: 7,
          fumbles: 1, passingAvg: 12.4, rating: 71.7
        } },
      { week: 13, date: '2024-12-01', kickoff: '4:05pm',
        opponent: 'Carolina Panthers', home: false, conference: false, division: true,
        result: { teamScore: 24, opponentScore: 14 }, booster: null,
        stats: {
          completions: 18, attempts: 26, passingYards: 190,
          passingYac: 84, passingTd: 1, interceptions: 1, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, sacks: 4,
          fumbles: 0, passingAvg: 10.6, rating: 87
        },
        bigPlays: [
          '10 yard passing touchdown'
        ] },
      { week: 14, date: '2024-12-08', kickoff: '1:00pm',
        opponent: 'Las Vegas Raiders', home: true, conference: false,
        result: { teamScore: 27, opponentScore: 19 }, booster: null,
        stats: {
          completions: 25, attempts: 32, passingYards: 245,
          passingYac: 40, passingTd: 3, interceptions: 0, carries: 3,
          rushingYards: -3, rushingTd: 0, rushingLong: 0, sacks: 9,
          fumbles: 1, passingAvg: 9.8, rating: 129.8, rushingAvg: -1
        },
        bigPlays: [
          '15 yard passing touchdown',
          '6 yard passing touchdown',
          '1 yard passing touchdown'
        ] },
      { week: 15, date: '2024-12-15', kickoff: '4:25pm',
        opponent: 'Los Angeles Chargers', home: false, conference: false,
        result: { teamScore: 7, opponentScore: 17 }, booster: null,
        stats: {
          completions: 21, attempts: 30, passingYards: 204,
          passingYac: 96, passingTd: 0, interceptions: 2, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, sacks: 4,
          fumbles: 0, passingAvg: 9.7, rating: 61
        } },
      { week: 16, date: '2024-12-22', kickoff: '8:20pm',
        opponent: 'Dallas Cowboys', home: false, conference: false,
        result: { teamScore: 10, opponentScore: 13 }, booster: null,
        stats: {
          completions: 14, attempts: 28, passingYards: 193,
          passingYac: 66, passingTd: 1, interceptions: 0, carries: 1,
          rushingYards: -1, rushingTd: 0, rushingLong: 0, sacks: 5,
          fumbles: 0, passingAvg: 13.8, rating: 84.4, rushingAvg: -1
        },
        bigPlays: [
          '27 yard passing touchdown'
        ] },
      { week: 17, date: '2024-12-29', kickoff: '1:00pm',
        opponent: 'Carolina Panthers', home: true, conference: false, division: true,
        result: { teamScore: 7, opponentScore: 26 }, booster: null,
        stats: {
          completions: 22, attempts: 31, passingYards: 198,
          passingYac: 69, passingTd: 1, interceptions: 1, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, sacks: 8,
          fumbles: 1, passingAvg: 9, rating: 85.1
        },
        bigPlays: [
          '3 yard passing touchdown'
        ] },
      { week: 18, date: '2025-01-05', kickoff: '1:00pm',
        opponent: 'New Orleans Saints', home: true, conference: false, division: true,
        result: { teamScore: 17, opponentScore: 12 }, booster: null,
        stats: {
          completions: 19, attempts: 25, passingYards: 165,
          passingYac: 43, passingTd: 2, interceptions: 1, carries: 4,
          rushingYards: -2, rushingTd: 0, rushingLong: 0, sacks: 3,
          fumbles: 0, passingAvg: 8.7, rating: 102.9, rushingAvg: -0.5
        },
        bigPlays: [
          '1 yard passing touchdown',
          '14 yard passing touchdown'
        ] },
    ],

    /* Sam Stogsdill — Seattle Seahawks */
    'sam-stogsdill': [
      { week:  1, date: '2024-09-08', kickoff: '1:05pm',
        opponent: 'Denver Broncos', home: true, conference: false,
        result: { teamScore: 27, opponentScore: 5 }, booster: null,
        stats: {
          carries: 11, rushingYards: 44, rushingTd: 1, rushingLong: 16,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 1,
          rushingAvg: 4, totalYards: 44, totalTd: 1
        },
        bigPlays: [
          '16 yard rushing touchdown'
        ] },
      { week:  2, date: '2024-09-15', kickoff: '10:00am',
        opponent: 'New England Patriots', home: false, conference: false,
        result: { teamScore: 6, opponentScore: 16 }, booster: null,
        stats: {
          carries: 9, rushingYards: 38, rushingTd: 0, rushingLong: 19,
          receptions: 1, receivingYards: 1, receivingYac: 1,
          receivingTd: 0, receivingLong: 1, targets: 1, fumbles: 0,
          rushingAvg: 4.2, receivingAvg: 1, totalYards: 39, totalTd: 0
        } },
      { week:  3, date: '2024-09-22', kickoff: '1:05pm',
        opponent: 'Miami Dolphins', home: true, conference: false,
        result: { teamScore: 44, opponentScore: 20 }, booster: null,
        stats: {
          carries: 12, rushingYards: 108, rushingTd: 2, rushingLong: 65,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 0,
          rushingAvg: 9, totalYards: 108, totalTd: 2
        },
        bigPlays: [
          '65 yard rushing touchdown',
          '3 yard rushing touchdown'
        ] },
      { week:  4, date: '2024-09-30', kickoff: '5:15pm',
        opponent: 'Detroit Lions', home: false, conference: false,
        result: { teamScore: 22, opponentScore: 11 }, booster: null,
        stats: {
          carries: 6, rushingYards: 13, rushingTd: 0, rushingLong: 4,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 0,
          rushingAvg: 2.2, totalYards: 13, totalTd: 0
        } },
      { week:  5, date: '2024-10-06', kickoff: '1:25pm',
        opponent: 'New York Giants', home: true, conference: false,
        result: { teamScore: 10, opponentScore: 17 }, booster: null,
        stats: {
          carries: 6, rushingYards: 19, rushingTd: 0, rushingLong: 5,
          receptions: 1, receivingYards: 5, receivingYac: 5,
          receivingTd: 0, receivingLong: 5, targets: 1, fumbles: 0,
          rushingAvg: 3.2, receivingAvg: 5, totalYards: 24, totalTd: 0
        } },
      { week:  6, date: '2024-10-10', kickoff: '5:15pm',
        opponent: 'San Francisco 49ers', home: true, conference: false, division: true,
        result: { teamScore: 33, opponentScore: 21 }, booster: null,
        stats: {
          carries: 8, rushingYards: 56, rushingTd: 1, rushingLong: 23,
          receptions: 2, receivingYards: 7, receivingYac: 7,
          receivingTd: 0, receivingLong: 9, targets: 2, fumbles: 0,
          rushingAvg: 7, receivingAvg: 3.5, totalYards: 63, totalTd: 1
        },
        bigPlays: [
          '9 yard rushing touchdown'
        ] },
      { week:  7, date: '2024-10-20', kickoff: '10:00am',
        opponent: 'Atlanta Falcons', home: false, conference: false,
        result: { teamScore: 43, opponentScore: 14 }, booster: null,
        stats: {
          carries: 15, rushingYards: 41, rushingTd: 1, rushingLong: 14,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 0,
          rushingAvg: 2.7, totalYards: 41, totalTd: 1
        },
        bigPlays: [
          '3 yard rushing touchdown'
        ] },
      { week:  8, date: '2024-10-27', kickoff: '1:05pm',
        opponent: 'Buffalo Bills', home: true, conference: false,
        result: { teamScore: 16, opponentScore: 17 }, booster: null,
        stats: {
          carries: 8, rushingYards: 39, rushingTd: 0, rushingLong: 13,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 0,
          rushingAvg: 4.9, totalYards: 39, totalTd: 0
        } },
      { week:  9, date: '2024-11-03', kickoff: '1:25pm',
        opponent: 'Los Angeles Rams', home: true, conference: false, division: true,
        result: { teamScore: 35, opponentScore: 17 }, booster: null,
        stats: {
          carries: 10, rushingYards: 77, rushingTd: 1, rushingLong: 25,
          receptions: 1, receivingYards: 17, receivingYac: 0,
          receivingTd: 0, receivingLong: 17, targets: 1, fumbles: 0,
          rushingAvg: 7.7, receivingAvg: 17, totalYards: 94, totalTd: 1
        },
        bigPlays: [
          '25 yard rushing touchdown'
        ] },
      { week: 10, date: '2024-11-10', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week: 11, date: '2024-11-17', kickoff: '1:05pm',
        opponent: 'San Francisco 49ers', home: false, conference: false, division: true,
        result: { teamScore: 18, opponentScore: 29 }, booster: null,
        stats: {
          carries: 11, rushingYards: 67, rushingTd: 1, rushingLong: 27,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 0,
          rushingAvg: 6.1, totalYards: 67, totalTd: 1
        },
        bigPlays: [
          '9 yard rushing touchdown'
        ] },
      { week: 12, date: '2024-11-24', kickoff: '1:25pm',
        opponent: 'Arizona Cardinals', home: true, conference: false, division: true,
        result: { teamScore: 22, opponentScore: 21 }, booster: null,
        stats: {
          carries: 6, rushingYards: 28, rushingTd: 0, rushingLong: 10,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 1,
          rushingAvg: 4.7, totalYards: 28, totalTd: 0
        } },
      { week: 13, date: '2024-12-01', kickoff: '10:00am',
        opponent: 'New York Jets', home: false, conference: false,
        result: { teamScore: 23, opponentScore: 28 }, booster: null,
        stats: {
          carries: 8, rushingYards: 20, rushingTd: 0, rushingLong: 6,
          receptions: 1, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 1, fumbles: 0,
          rushingAvg: 2.5, receivingAvg: 0, totalYards: 20, totalTd: 0
        } },
      { week: 14, date: '2024-12-08', kickoff: '1:05pm',
        opponent: 'Arizona Cardinals', home: false, conference: false, division: true,
        result: { teamScore: 16, opponentScore: 14 }, booster: null,
        stats: {
          carries: 8, rushingYards: 13, rushingTd: 0, rushingLong: 5,
          receptions: 1, receivingYards: 14, receivingYac: 4,
          receivingTd: 0, receivingLong: 14, targets: 2, fumbles: 0,
          rushingAvg: 1.6, receivingAvg: 14, totalYards: 27, totalTd: 0
        } },
      { week: 15, date: '2024-12-15', kickoff: '5:20pm',
        opponent: 'Green Bay Packers', home: true, conference: false,
        result: { teamScore: 28, opponentScore: 25 }, booster: null,
        stats: {
          carries: 8, rushingYards: 36, rushingTd: 2, rushingLong: 10,
          receptions: 1, receivingYards: 23, receivingYac: 4,
          receivingTd: 0, receivingLong: 23, targets: 1, fumbles: 0,
          rushingAvg: 4.5, receivingAvg: 23, totalYards: 59, totalTd: 2
        },
        bigPlays: [
          '1 yard rushing touchdown',
          '3 yard rushing touchdown'
        ] },
      { week: 16, date: '2024-12-22', kickoff: '1:05pm',
        opponent: 'Minnesota Vikings', home: true, conference: false,
        result: { teamScore: 30, opponentScore: 19 }, booster: null,
        stats: {
          carries: 9, rushingYards: 16, rushingTd: 1, rushingLong: 4,
          receptions: 2, receivingYards: 7, receivingYac: 7,
          receivingTd: 0, receivingLong: 4, targets: 3, fumbles: 0,
          rushingAvg: 1.8, receivingAvg: 3.5, totalYards: 23, totalTd: 1
        },
        bigPlays: [
          '3 yard rushing touchdown'
        ] },
      { week: 17, date: '2024-12-26', kickoff: '5:15pm',
        opponent: 'Chicago Bears', home: false, conference: false,
        result: { teamScore: 22, opponentScore: 20 }, booster: null,
        stats: {
          carries: 15, rushingYards: 91, rushingTd: 0, rushingLong: 25,
          receptions: 3, receivingYards: 51, receivingYac: 47,
          receivingTd: 0, receivingLong: 43, targets: 3, fumbles: 0,
          rushingAvg: 6.1, receivingAvg: 17, totalYards: 142, totalTd: 0
        } },
      { week: 18, date: '2025-01-05', kickoff: '1:25pm',
        opponent: 'Los Angeles Rams', home: false, conference: false, division: true, overtime: true,
        result: { teamScore: 16, opponentScore: 22 }, booster: null,
        stats: {
          carries: 8, rushingYards: 42, rushingTd: 0, rushingLong: 14,
          receptions: 2, receivingYards: 13, receivingYac: 4,
          receivingTd: 0, receivingLong: 11, targets: 2, fumbles: 0,
          rushingAvg: 5.3, receivingAvg: 6.5, totalYards: 55, totalTd: 0
        } },
      { week: 19, date: '2025-01-11', kickoff: null,
        name: 'NFC Wild Card',
        opponent: 'Los Angeles Rams', home: true, conference: false, playoff: true,
        result: { teamScore: 28, opponentScore: 24 }, booster: null,
        stats: {
          carries: 8, rushingYards: 16, rushingTd: 0, rushingLong: 7,
          receptions: 1, receivingYards: 4, receivingYac: 4,
          receivingTd: 0, receivingLong: 4, targets: 2, fumbles: 0,
          rushingAvg: 2, receivingAvg: 4, totalYards: 20, totalTd: 0
        } },
      { week: 20, date: '2025-01-18', kickoff: null,
        name: 'NFC Divisional Round',
        opponent: 'Detroit Lions', home: true, conference: false, playoff: true,
        result: { teamScore: 9, opponentScore: 18 }, booster: null,
        stats: {
          carries: 9, rushingYards: 28, rushingTd: 0, rushingLong: 7,
          receptions: 1, receivingYards: 5, receivingYac: 0,
          receivingTd: 0, receivingLong: 5, targets: 1, fumbles: 0,
          rushingAvg: 3.1, receivingAvg: 5, totalYards: 33, totalTd: 0
        } },
    ],

    /* Jaykeb Stewart — Houston Texans */
    'jaykeb-stewart': [
      { week:  1, date: '2024-09-08', kickoff: '12:00pm',
        opponent: 'Indianapolis Colts', home: false, conference: false, division: true,
        result: { teamScore: 16, opponentScore: 41 }, booster: null,
        stats: {
          completions: 22, attempts: 38, passingYards: 257,
          passingYac: 130, passingTd: 1, interceptions: 0, carries: 1,
          rushingYards: 1, rushingTd: 0, rushingLong: 0, sacks: 1,
          fumbles: 0, passingAvg: 11.7, rating: 87.3, rushingAvg: 1
        },
        bigPlays: [
          '8 yard passing touchdown'
        ] },
      { week:  2, date: '2024-09-15', kickoff: '7:20pm',
        opponent: 'Chicago Bears', home: true, conference: false,
        result: { teamScore: 23, opponentScore: 20 }, booster: null,
        stats: {
          completions: 25, attempts: 38, passingYards: 341,
          passingYac: 116, passingTd: 1, interceptions: 1, carries: 6,
          rushingYards: 7, rushingTd: 0, rushingLong: 7, sacks: 4,
          fumbles: 0, passingAvg: 13.6, rating: 92.1, rushingAvg: 1.2
        },
        bigPlays: [
          '23 yard game-winning passing touchdown'
        ] },
      { week:  3, date: '2024-09-22', kickoff: '12:00pm',
        opponent: 'Minnesota Vikings', home: false, conference: false,
        result: { teamScore: 10, opponentScore: 27 }, booster: null,
        stats: {
          completions: 25, attempts: 35, passingYards: 279,
          passingYac: 115, passingTd: 1, interceptions: 0, carries: 2,
          rushingYards: 1, rushingTd: 0, rushingLong: 2, sacks: 3,
          fumbles: 1, passingAvg: 11.2, rating: 104.3, rushingAvg: 0.5
        },
        bigPlays: [
          '9 yard passing touchdown'
        ] },
      { week:  4, date: '2024-09-29', kickoff: '12:00pm',
        opponent: 'Jacksonville Jaguars', home: true, conference: false, division: true,
        result: { teamScore: 9, opponentScore: 28 }, booster: null,
        stats: {
          completions: 20, attempts: 32, passingYards: 202,
          passingYac: 44, passingTd: 1, interceptions: 3, carries: 1,
          rushingYards: -1, rushingTd: 0, rushingLong: 0, sacks: 3,
          fumbles: 0, passingAvg: 10.1, rating: 51.8, rushingAvg: -1
        },
        bigPlays: [
          '4 yard passing touchdown'
        ] },
      { week:  5, date: '2024-10-06', kickoff: '12:00pm',
        opponent: 'Buffalo Bills', home: true, conference: false,
        result: { teamScore: 20, opponentScore: 38 }, booster: null,
        stats: {
          completions: 32, attempts: 50, passingYards: 346,
          passingYac: 147, passingTd: 1, interceptions: 1, carries: 1,
          rushingYards: 2, rushingTd: 0, rushingLong: 2, sacks: 0,
          fumbles: 0, passingAvg: 10.8, rating: 82.6, rushingAvg: 2
        },
        bigPlays: [
          '16 yard passing touchdown'
        ] },
      { week:  6, date: '2024-10-13', kickoff: '12:00pm',
        opponent: 'New England Patriots', home: false, conference: false,
        result: { teamScore: 23, opponentScore: 9 }, booster: null,
        stats: {
          completions: 26, attempts: 34, passingYards: 230,
          passingYac: 78, passingTd: 0, interceptions: 0, carries: 6,
          rushingYards: 12, rushingTd: 1, rushingLong: 5, sacks: 2,
          fumbles: 0, passingAvg: 8.8, rating: 94, rushingAvg: 2
        },
        bigPlays: [
          '5 yard rushing touchdown'
        ] },
      { week:  7, date: '2024-10-20', kickoff: '12:00pm',
        opponent: 'Green Bay Packers', home: false, conference: false,
        result: { teamScore: 6, opponentScore: 10 }, booster: null,
        stats: {
          completions: 19, attempts: 33, passingYards: 165,
          passingYac: 87, passingTd: 0, interceptions: 1, carries: 4,
          rushingYards: 20, rushingTd: 0, rushingLong: 7, sacks: 5,
          fumbles: 0, passingAvg: 8.7, rating: 58.3, rushingAvg: 5
        } },
      { week:  8, date: '2024-10-27', kickoff: '12:00pm',
        opponent: 'Indianapolis Colts', home: true, conference: false, division: true,
        result: { teamScore: 20, opponentScore: 13 }, booster: null,
        stats: {
          completions: 20, attempts: 32, passingYards: 210,
          passingYac: 108, passingTd: 1, interceptions: 0, carries: 5,
          rushingYards: 21, rushingTd: 0, rushingLong: 8, sacks: 3,
          fumbles: 0, passingAvg: 10.5, rating: 91.9, rushingAvg: 4.2
        },
        bigPlays: [
          '5 yard passing touchdown'
        ] },
      { week:  9, date: '2024-10-31', kickoff: '7:15pm',
        opponent: 'New York Jets', home: false, conference: false,
        result: { teamScore: 21, opponentScore: 47 }, booster: null,
        stats: {
          completions: 17, attempts: 27, passingYards: 143,
          passingYac: 57, passingTd: 1, interceptions: 2, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, sacks: 2,
          fumbles: 1, passingAvg: 8.4, rating: 58.1
        },
        bigPlays: [
          '28 yard passing touchdown'
        ] },
      { week: 10, date: '2024-11-10', kickoff: '7:20pm',
        opponent: 'Detroit Lions', home: true, conference: false,
        result: { teamScore: 16, opponentScore: 43 }, booster: null,
        stats: {
          completions: 22, attempts: 30, passingYards: 222,
          passingYac: 80, passingTd: 2, interceptions: 0, carries: 2,
          rushingYards: 14, rushingTd: 0, rushingLong: 10, sacks: 1,
          fumbles: 0, passingAvg: 10.1, rating: 116.2, rushingAvg: 7
        },
        bigPlays: [
          '2 yard passing touchdown',
          '3 yard passing touchdown'
        ] },
      { week: 11, date: '2024-11-18', kickoff: '7:15pm',
        opponent: 'Dallas Cowboys', home: false, conference: false,
        result: { teamScore: 13, opponentScore: 20 }, booster: null,
        stats: {
          completions: 28, attempts: 34, passingYards: 305,
          passingYac: 108, passingTd: 1, interceptions: 0, carries: 3,
          rushingYards: 13, rushingTd: 0, rushingLong: 9, sacks: 2,
          fumbles: 0, passingAvg: 10.9, rating: 113.8, rushingAvg: 4.3
        },
        bigPlays: [
          '7 yard passing touchdown'
        ] },
      { week: 12, date: '2024-11-24', kickoff: '12:00pm',
        opponent: 'Tennessee Titans', home: true, conference: false, division: true,
        result: { teamScore: 26, opponentScore: 37 }, booster: null,
        stats: {
          completions: 30, attempts: 41, passingYards: 319,
          passingYac: 129, passingTd: 3, interceptions: 0, carries: 7,
          rushingYards: 24, rushingTd: 0, rushingLong: 14, sacks: 6,
          fumbles: 2, passingAvg: 10.6, rating: 119.9, rushingAvg: 3.4
        },
        bigPlays: [
          '10 yard passing touchdown',
          '23 yard passing touchdown',
          '4 yard passing touchdown'
        ] },
      { week: 13, date: '2024-12-01', kickoff: '12:00pm',
        opponent: 'Jacksonville Jaguars', home: false, conference: false, division: true,
        result: { teamScore: 10, opponentScore: 27 }, booster: null,
        stats: {
          completions: 21, attempts: 35, passingYards: 175,
          passingYac: 81, passingTd: 0, interceptions: 1, carries: 2,
          rushingYards: 8, rushingTd: 0, rushingLong: 9, sacks: 3,
          fumbles: 1, passingAvg: 8.3, rating: 61, rushingAvg: 4
        } },
      { week: 14, date: '2024-12-08', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week: 15, date: '2024-12-15', kickoff: '12:00pm',
        opponent: 'Miami Dolphins', home: true, conference: false, overtime: true,
        result: { teamScore: 10, opponentScore: 16 }, booster: null,
        stats: {
          completions: 36, attempts: 51, passingYards: 341,
          passingYac: 113, passingTd: 1, interceptions: 1, carries: 2,
          rushingYards: 9, rushingTd: 0, rushingLong: 7, sacks: 1,
          fumbles: 0, passingAvg: 9.5, rating: 87.1, rushingAvg: 4.5
        },
        bigPlays: [
          '3 yard passing touchdown'
        ] },
      { week: 16, date: '2024-12-21', kickoff: '12:00pm',
        opponent: 'Kansas City Chiefs', home: false, conference: false,
        result: { teamScore: 34, opponentScore: 37 }, booster: null,
        stats: {
          completions: 20, attempts: 29, passingYards: 250,
          passingYac: 114, passingTd: 3, interceptions: 0, carries: 5,
          rushingYards: 15, rushingTd: 0, rushingLong: 6, sacks: 1,
          fumbles: 0, passingAvg: 12.5, rating: 130, rushingAvg: 3
        },
        bigPlays: [
          '16 yard passing touchdown',
          '53 yard passing touchdown',
          '23 yard passing touchdown'
        ] },
      { week: 17, date: '2024-12-25', kickoff: '3:30pm',
        opponent: 'Baltimore Ravens', home: true, conference: false,
        result: { teamScore: 18, opponentScore: 24 }, booster: null,
        stats: {
          completions: 31, attempts: 45, passingYards: 287,
          passingYac: 91, passingTd: 2, interceptions: 1, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, sacks: 1,
          fumbles: 0, passingAvg: 9.3, rating: 91.6
        },
        bigPlays: [
          '3 yard passing touchdown',
          '1 yard passing touchdown'
        ] },
      { week: 18, date: '2025-01-05', kickoff: '12:00pm',
        opponent: 'Tennessee Titans', home: false, conference: false, division: true,
        result: { teamScore: 24, opponentScore: 13 }, booster: null,
        stats: {
          completions: 22, attempts: 29, passingYards: 210,
          passingYac: 61, passingTd: 3, interceptions: 0, carries: 6,
          rushingYards: 22, rushingTd: 0, rushingLong: 16, sacks: 3,
          fumbles: 0, passingAvg: 9.5, rating: 130, rushingAvg: 3.7
        },
        bigPlays: [
          '7 yard passing touchdown',
          '4 yard passing touchdown',
          '7 yard passing touchdown'
        ] },
    ],
  }
};
