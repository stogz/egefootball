/* ==========================================================================
   EGE Football — the 2029 season
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

   `hurt: { injury: 'Torn ACL', weeks: 20 }` is what hurt him in a game he
   played, from the NFL sim, and for how many weeks. From 2028 it costs him
   attributes once that week is out (data/aging.js).

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

EGE.stats[2029] = {
  season: 2029,
  level: 'NFL',

  /* Weeks the NFL Sim tab stored, written in here, and when each was
     saved: a stored week saved after this replaces the file's. */
  stored: {
    1: '2026-11-10T07:08:44.853Z',
    2: '2026-11-10T16:50:14.778Z',
    3: '2026-11-10T20:26:04.407Z',
    4: '2026-11-11T16:32:51.019Z',
    5: '2026-11-11T17:11:24.531Z',
    6: '2026-11-11T20:31:19.522Z',
    7: '2026-11-12T04:45:18.758Z',
    8: '2026-11-12T13:57:20.969Z',
    9: '2026-11-12T16:24:26.095Z',
    11: '2026-11-12T23:47:20.717Z',
    12: '2026-11-13T02:50:05.573Z',
    13: '2026-11-13T04:18:32.449Z',
    14: '2026-11-13T16:02:49.024Z',
    15: '2026-11-13T19:53:40.597Z',
    16: '2026-11-13T20:57:36.706Z',
    17: '2026-11-13T21:07:54.221Z',
    18: '2026-11-13T21:55:00.302Z',
    19: '2026-11-14T00:50:25.276Z',
    20: '2026-11-14T15:25:23.673Z',
    21: '2026-11-14T20:13:08.344Z',
    22: '2026-11-15T01:46:34.912Z'
  },

  /* The six traded in the NFL sim: from `week` on his games are the
     games of `to`, his team then, and the ones before it are as he
     played them. */
  trades: {
    'isaac-vitel': [
      { week: 7, from: 'tampaBay', to: null },
      { week: 11, from: null, to: 'newYorkJets' }
    ],
    'andrew-parr': [
      { week: 7, from: 'carolina', to: 'baltimore' }
    ]
  },

  games: {

    /* Andrew Parr — Carolina Panthers, then Baltimore Ravens */
    'andrew-parr': [
      { week:  1, date: '2029-09-09', kickoff: null,
        opponent: 'Washington Commanders', home: true, conference: false,
        result: { teamScore: 35, opponentScore: 14 }, booster: 'wager-for', line: -10.5,
        stats: {
          receptions: 11, receivingYards: 75, receivingYac: 33,
          receivingTd: 1, receivingLong: 16, targets: 11, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 6.8, totalYards: 75, totalTd: 1
        },
        bigPlays: [
          '11 yard receiving touchdown'
        ] },
      { week:  2, date: '2029-09-16', kickoff: null,
        opponent: 'Tampa Bay Buccaneers', home: true, conference: false, division: true,
        result: { teamScore: 24, opponentScore: 27 }, booster: 'boost-1-5',
        stats: {
          receptions: 10, receivingYards: 121, receivingYac: 56,
          receivingTd: 0, receivingLong: 45, targets: 15, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 12.1, totalYards: 121, totalTd: 0
        } },
      { week:  3, date: '2029-09-23', kickoff: null,
        opponent: 'Dallas Cowboys', home: false, conference: false,
        result: { teamScore: 14, opponentScore: 56 }, booster: null,
        stats: {
          receptions: 11, receivingYards: 127, receivingYac: 56,
          receivingTd: 0, receivingLong: 39, targets: 15, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 11.5, totalYards: 127, totalTd: 0
        } },
      { week:  4, date: '2029-09-30', kickoff: null,
        opponent: 'Chicago Bears', home: true, conference: false,
        result: { teamScore: 23, opponentScore: 34 }, booster: 'boost-2-0',
        stats: {
          receptions: 12, receivingYards: 99, receivingYac: 49,
          receivingTd: 1, receivingLong: 18, targets: 13, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 8.3, totalYards: 99, totalTd: 1
        },
        bigPlays: [
          '2 yard receiving touchdown'
        ] },
      { week:  5, date: '2029-10-07', kickoff: null,
        opponent: 'Las Vegas Raiders', home: false, conference: false,
        result: { teamScore: 17, opponentScore: 30 }, booster: null,
        stats: {
          receptions: 8, receivingYards: 81, receivingYac: 24,
          receivingTd: 1, receivingLong: 21, targets: 13, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 10.1, totalYards: 81, totalTd: 1
        },
        bigPlays: [
          '1 yard receiving touchdown'
        ] },
      { week:  6, date: '2029-10-14', kickoff: null,
        opponent: 'Tampa Bay Buccaneers', home: false, conference: false, division: true,
        result: { teamScore: 15, opponentScore: 18 }, booster: 'boost-2-5',
        stats: {
          receptions: 10, receivingYards: 128, receivingYac: 26,
          receivingTd: 0, receivingLong: 30, targets: 11, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 12.8, totalYards: 128, totalTd: 0
        } },
      { week:  7, date: '2029-10-21', kickoff: null,
        opponent: 'Los Angeles Chargers', home: true, conference: false,
        result: { teamScore: 17, opponentScore: 16 }, booster: 'wager-for', line: 6.5,
        stats: {
          receptions: 6, receivingYards: 81, receivingYac: 25,
          receivingTd: 1, receivingLong: 43, targets: 7, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 13.5, totalYards: 81, totalTd: 1
        },
        bigPlays: [
          '43 yard game-winning receiving touchdown'
        ] },
      { week:  8, date: '2029-10-28', kickoff: null,
        opponent: 'Atlanta Falcons', home: true, conference: false,
        result: { teamScore: 21, opponentScore: 3 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 53, receivingYac: 33,
          receivingTd: 0, receivingLong: 18, targets: 7, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 10.6, totalYards: 53, totalTd: 0
        } },
      { week:  9, date: '2029-11-04', kickoff: null,
        opponent: 'Pittsburgh Steelers', home: true, conference: false, division: true,
        result: { teamScore: 31, opponentScore: 24 }, booster: 'boost-2-5',
        stats: {
          receptions: 7, receivingYards: 65, receivingYac: 15,
          receivingTd: 0, receivingLong: 19, targets: 8, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 9.3, totalYards: 65, totalTd: 0
        } },
      { week: 10, date: '2029-11-11', kickoff: null,
        opponent: 'Carolina Panthers', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week: 11, date: '2029-11-18', kickoff: null,
        opponent: 'Buffalo Bills', home: false, conference: false,
        result: { teamScore: 27, opponentScore: 13 }, booster: null,
        stats: {
          receptions: 9, receivingYards: 91, receivingYac: 24,
          receivingTd: 0, receivingLong: 19, targets: 10, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 10.1, totalYards: 91, totalTd: 0
        } },
      { week: 12, date: '2029-11-25', kickoff: null,
        opponent: 'New Orleans Saints', home: false, conference: false,
        result: { teamScore: 33, opponentScore: 21 }, booster: null,
        stats: {
          receptions: 1, receivingYards: 19, receivingYac: 2,
          receivingTd: 0, receivingLong: 19, targets: 2, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 19, totalYards: 19, totalTd: 0
        } },
      { week: 13, date: '2029-12-02', kickoff: null,
        opponent: 'Cincinnati Bengals', home: true, conference: false, division: true,
        result: { teamScore: 20, opponentScore: 15 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 40, receivingYac: 17,
          receivingTd: 0, receivingLong: 17, targets: 9, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 1,
          receivingAvg: 8, totalYards: 40, totalTd: 0
        } },
      { week: 14, date: '2029-12-09', kickoff: null,
        opponent: 'Jacksonville Jaguars', home: true, conference: false,
        result: { teamScore: 7, opponentScore: 33 }, booster: null,
        stats: {
          receptions: 9, receivingYards: 154, receivingYac: 48,
          receivingTd: 0, receivingLong: 26, targets: 11, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 17.1, totalYards: 154, totalTd: 0
        } },
      { week: 15, date: '2029-12-16', kickoff: null,
        opponent: 'Pittsburgh Steelers', home: false, conference: false, division: true,
        result: { teamScore: 17, opponentScore: 37 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 45, receivingYac: 21,
          receivingTd: 0, receivingLong: 21, targets: 5, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 11.3, totalYards: 45, totalTd: 0
        } },
      { week: 16, date: '2029-12-23', kickoff: null,
        opponent: 'Denver Broncos', home: false, conference: false,
        result: { teamScore: 31, opponentScore: 26 }, booster: null,
        stats: {
          receptions: 6, receivingYards: 79, receivingYac: 18,
          receivingTd: 1, receivingLong: 20, targets: 7, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 13.2, totalYards: 79, totalTd: 1
        },
        bigPlays: [
          '16 yard receiving touchdown'
        ] },
      { week: 17, date: '2029-12-30', kickoff: null,
        opponent: 'Cincinnati Bengals', home: false, conference: false, division: true,
        result: { teamScore: 30, opponentScore: 35 }, booster: null,
        stats: {
          receptions: 7, receivingYards: 69, receivingYac: 39,
          receivingTd: 1, receivingLong: 22, targets: 8, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 9.9, totalYards: 69, totalTd: 1
        },
        bigPlays: [
          '2 yard receiving touchdown'
        ] },
      { week: 18, date: '2030-01-06', kickoff: null,
        opponent: 'Las Vegas Raiders', home: false, conference: false,
        result: { teamScore: 19, opponentScore: 23 }, booster: null,
        stats: {
          receptions: 3, receivingYards: 38, receivingYac: 15,
          receivingTd: 0, receivingLong: 24, targets: 4, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 12.7, totalYards: 38, totalTd: 0
        } },
    ],

    /* Cooper Clark — Jacksonville Jaguars */
    'cooper-clark': [
      { week:  1, date: '2029-09-09', kickoff: null,
        opponent: 'Arizona Cardinals', home: true, conference: false,
        result: { teamScore: 37, opponentScore: 27 }, booster: 'boost-1-5',
        stats: {
          carries: 15, rushingYards: 102, rushingTd: 2, rushingLong: 27,
          receptions: 7, receivingYards: 34, receivingYac: 20,
          receivingTd: 1, receivingLong: 9, targets: 7, fumbles: 0,
          rushingAvg: 6.8, receivingAvg: 4.9, totalYards: 136, totalTd: 3
        },
        bigPlays: [
          '2 yard receiving touchdown',
          '1 yard game-winning rushing touchdown',
          '7 yard rushing touchdown'
        ] },
      { week:  2, date: '2029-09-16', kickoff: null,
        opponent: 'Houston Texans', home: true, conference: false, division: true,
        result: { teamScore: 29, opponentScore: 31 }, booster: 'boost-2-0',
        stats: {
          carries: 10, rushingYards: 57, rushingTd: 2, rushingLong: 21,
          receptions: 5, receivingYards: 47, receivingYac: 31,
          receivingTd: 1, receivingLong: 15, targets: 6, fumbles: 0,
          rushingAvg: 5.7, receivingAvg: 9.4, totalYards: 104, totalTd: 3
        },
        bigPlays: [
          '21 yard rushing touchdown',
          '5 yard receiving touchdown',
          '3 yard rushing touchdown'
        ] },
      { week:  3, date: '2029-09-23', kickoff: null,
        opponent: 'Los Angeles Rams', home: false, conference: false,
        result: { teamScore: 25, opponentScore: 29 }, booster: null,
        stats: {
          carries: 10, rushingYards: 41, rushingTd: 1, rushingLong: 17,
          receptions: 3, receivingYards: 66, receivingYac: 26,
          receivingTd: 0, receivingLong: 36, targets: 6, fumbles: 0,
          rushingAvg: 4.1, receivingAvg: 22, totalYards: 107, totalTd: 1
        },
        bigPlays: [
          '17 yard rushing touchdown'
        ] },
      { week:  4, date: '2029-09-30', kickoff: null,
        opponent: 'Los Angeles Chargers', home: true, conference: false,
        result: { teamScore: 33, opponentScore: 28 }, booster: 'boost-2-5',
        stats: {
          carries: 14, rushingYards: 55, rushingTd: 1, rushingLong: 22,
          receptions: 9, receivingYards: 81, receivingYac: 51,
          receivingTd: 0, receivingLong: 25, targets: 9, fumbles: 0,
          rushingAvg: 3.9, receivingAvg: 9, totalYards: 136, totalTd: 1
        },
        bigPlays: [
          '22 yard rushing touchdown'
        ] },
      { week:  5, date: '2029-10-07', kickoff: null,
        opponent: 'Miami Dolphins', home: true, conference: false,
        result: { teamScore: 21, opponentScore: 17 }, booster: null,
        stats: {
          carries: 18, rushingYards: 149, rushingTd: 1, rushingLong: 36,
          receptions: 4, receivingYards: 37, receivingYac: 24,
          receivingTd: 0, receivingLong: 14, targets: 5, fumbles: 1,
          rushingAvg: 8.3, receivingAvg: 9.3, totalYards: 186, totalTd: 1
        },
        bigPlays: [
          '36 yard rushing touchdown'
        ] },
      { week:  6, date: '2029-10-14', kickoff: null,
        opponent: 'Tennessee Titans', home: false, conference: false, division: true,
        result: { teamScore: 10, opponentScore: 27 }, booster: null,
        stats: {
          carries: 13, rushingYards: 29, rushingTd: 0, rushingLong: 7,
          receptions: 7, receivingYards: 31, receivingYac: 26,
          receivingTd: 0, receivingLong: 12, targets: 10, fumbles: 1,
          rushingAvg: 2.2, receivingAvg: 4.4, totalYards: 60, totalTd: 0
        } },
      { week:  7, date: '2029-10-21', kickoff: null,
        opponent: 'San Francisco 49ers', home: false, conference: false,
        result: { teamScore: 15, opponentScore: 13 }, booster: null,
        stats: {
          carries: 26, rushingYards: 141, rushingTd: 1, rushingLong: 28,
          receptions: 5, receivingYards: 39, receivingYac: 35,
          receivingTd: 0, receivingLong: 24, targets: 5, fumbles: 0,
          rushingAvg: 5.4, receivingAvg: 7.8, totalYards: 180, totalTd: 1
        },
        bigPlays: [
          '2 yard game-winning rushing touchdown'
        ] },
      { week:  8, date: '2029-10-28', kickoff: null,
        opponent: 'Buffalo Bills', home: false, conference: false,
        result: { teamScore: 27, opponentScore: 19 }, booster: null,
        stats: {
          carries: 14, rushingYards: 79, rushingTd: 0, rushingLong: 29,
          receptions: 5, receivingYards: 57, receivingYac: 37,
          receivingTd: 0, receivingLong: 20, targets: 6, fumbles: 0,
          rushingAvg: 5.6, receivingAvg: 11.4, totalYards: 136, totalTd: 0
        } },
      { week:  9, date: '2029-11-04', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week: 10, date: '2029-11-11', kickoff: null,
        opponent: 'Houston Texans', home: false, conference: false, division: true,
        result: { teamScore: 10, opponentScore: 39 }, booster: 'boost-2-0',
        stats: {
          carries: 11, rushingYards: 58, rushingTd: 0, rushingLong: 23,
          receptions: 5, receivingYards: 42, receivingYac: 27,
          receivingTd: 0, receivingLong: 17, targets: 5, fumbles: 0,
          rushingAvg: 5.3, receivingAvg: 8.4, totalYards: 100, totalTd: 0
        } },
      { week: 11, date: '2029-11-18', kickoff: null,
        opponent: 'Indianapolis Colts', home: false, conference: false, division: true,
        result: { teamScore: 40, opponentScore: 17 }, booster: null,
        stats: {
          carries: 24, rushingYards: 112, rushingTd: 1, rushingLong: 19,
          receptions: 5, receivingYards: 57, receivingYac: 47,
          receivingTd: 2, receivingLong: 27, targets: 5, fumbles: 1,
          rushingAvg: 4.7, receivingAvg: 11.4, totalYards: 169, totalTd: 3
        },
        bigPlays: [
          '7 yard receiving touchdown',
          '7 yard receiving touchdown',
          '1 yard rushing touchdown'
        ] },
      { week: 12, date: '2029-11-25', kickoff: null,
        opponent: 'New England Patriots', home: true, conference: false, overtime: true,
        result: { teamScore: 23, opponentScore: 29 }, booster: null,
        stats: {
          carries: 22, rushingYards: 131, rushingTd: 1, rushingLong: 20,
          receptions: 1, receivingYards: 8, receivingYac: 3,
          receivingTd: 0, receivingLong: 8, targets: 3, fumbles: 0,
          rushingAvg: 6, receivingAvg: 8, totalYards: 139, totalTd: 1
        },
        bigPlays: [
          '5 yard rushing touchdown'
        ] },
      { week: 13, date: '2029-12-02', kickoff: null,
        opponent: 'Green Bay Packers', home: true, conference: false,
        result: { teamScore: 35, opponentScore: 31 }, booster: null,
        stats: {
          carries: 13, rushingYards: 64, rushingTd: 0, rushingLong: 16,
          receptions: 4, receivingYards: 30, receivingYac: 25,
          receivingTd: 0, receivingLong: 9, targets: 6, fumbles: 0,
          rushingAvg: 4.9, receivingAvg: 7.5, totalYards: 94, totalTd: 0
        } },
      { week: 14, date: '2029-12-09', kickoff: null,
        opponent: 'Baltimore Ravens', home: false, conference: false,
        result: { teamScore: 33, opponentScore: 7 }, booster: null,
        stats: {
          carries: 19, rushingYards: 96, rushingTd: 0, rushingLong: 23,
          receptions: 6, receivingYards: 82, receivingYac: 75,
          receivingTd: 0, receivingLong: 23, targets: 9, fumbles: 0,
          rushingAvg: 5.1, receivingAvg: 13.7, totalYards: 178, totalTd: 0
        } },
      { week: 15, date: '2029-12-16', kickoff: null,
        opponent: 'Seattle Seahawks', home: true, conference: false,
        result: { teamScore: 56, opponentScore: 6 }, booster: null,
        stats: {
          carries: 20, rushingYards: 94, rushingTd: 1, rushingLong: 19,
          receptions: 6, receivingYards: 65, receivingYac: 55,
          receivingTd: 2, receivingLong: 22, targets: 6, fumbles: 0,
          rushingAvg: 4.7, receivingAvg: 10.8, totalYards: 159, totalTd: 3
        },
        bigPlays: [
          '5 yard receiving touchdown',
          '22 yard receiving touchdown',
          '6 yard rushing touchdown'
        ] },
      { week: 16, date: '2029-12-23', kickoff: null,
        opponent: 'Tennessee Titans', home: true, conference: false, division: true,
        result: { teamScore: 39, opponentScore: 17 }, booster: null,
        stats: {
          carries: 23, rushingYards: 188, rushingTd: 2, rushingLong: 27,
          receptions: 4, receivingYards: 17, receivingYac: 12,
          receivingTd: 0, receivingLong: 9, targets: 5, fumbles: 0,
          rushingAvg: 8.2, receivingAvg: 4.3, totalYards: 205, totalTd: 2
        },
        bigPlays: [
          '27 yard rushing touchdown',
          '22 yard rushing touchdown'
        ] },
      { week: 17, date: '2029-12-30', kickoff: null,
        opponent: 'New York Jets', home: false, conference: false,
        result: { teamScore: 10, opponentScore: 27 }, booster: 'boost-2-0',
        stats: {
          carries: 7, rushingYards: 16, rushingTd: 0, rushingLong: 5,
          receptions: 7, receivingYards: 78, receivingYac: 63,
          receivingTd: 1, receivingLong: 30, targets: 7, fumbles: 1,
          rushingAvg: 2.3, receivingAvg: 11.1, totalYards: 94, totalTd: 1
        },
        bigPlays: [
          '23 yard receiving touchdown'
        ] },
      { week: 18, date: '2030-01-06', kickoff: null,
        opponent: 'Indianapolis Colts', home: true, conference: false, division: true, overtime: true,
        result: { teamScore: 16, opponentScore: 13 }, booster: null,
        stats: {
          carries: 16, rushingYards: 77, rushingTd: 1, rushingLong: 16,
          receptions: 5, receivingYards: 37, receivingYac: 30,
          receivingTd: 0, receivingLong: 22, targets: 8, fumbles: 0,
          rushingAvg: 4.8, receivingAvg: 7.4, totalYards: 114, totalTd: 1
        },
        bigPlays: [
          '1 yard rushing touchdown'
        ] },
      { week: 19, date: '2030-01-12', kickoff: null,
        name: 'AFC Wild Card',
        opponent: 'Pittsburgh Steelers', home: false, conference: false, playoff: true,
        result: { teamScore: 21, opponentScore: 41 }, booster: null,
        stats: {
          carries: 18, rushingYards: 55, rushingTd: 1, rushingLong: 13,
          receptions: 6, receivingYards: 80, receivingYac: 75,
          receivingTd: 0, receivingLong: 49, targets: 6, fumbles: 0,
          rushingAvg: 3.1, receivingAvg: 13.3, totalYards: 135, totalTd: 1
        },
        bigPlays: [
          '1 yard rushing touchdown'
        ] },
    ],

    /* Paxon Hatch — New York Giants */
    'paxon-hatch': [
      { week:  1, date: '2029-09-09', kickoff: null,
        opponent: 'Green Bay Packers', home: true, conference: false,
        result: { teamScore: 26, opponentScore: 13 }, booster: null,
        stats: {
          receptions: 8, receivingYards: 93, receivingYac: 40,
          receivingTd: 0, receivingLong: 32, targets: 8, carries: 1,
          rushingYards: 12, rushingTd: 0, rushingLong: 12, fumbles: 0,
          rushingAvg: 12, receivingAvg: 11.6, totalYards: 105, totalTd: 0
        } },
      { week:  2, date: '2029-09-16', kickoff: null,
        opponent: 'Las Vegas Raiders', home: true, conference: false,
        result: { teamScore: 23, opponentScore: 36 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 101, receivingYac: 29,
          receivingTd: 1, receivingLong: 31, targets: 7, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 20.2, totalYards: 101, totalTd: 1
        },
        bigPlays: [
          '31 yard receiving touchdown'
        ] },
      { week:  3, date: '2029-09-23', kickoff: null,
        opponent: 'Arizona Cardinals', home: true, conference: false,
        result: { teamScore: 15, opponentScore: 12 }, booster: null,
        stats: {
          receptions: 7, receivingYards: 67, receivingYac: 15,
          receivingTd: 1, receivingLong: 27, targets: 12, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 9.6, totalYards: 67, totalTd: 1
        },
        bigPlays: [
          '27 yard game-winning receiving touchdown'
        ] },
      { week:  4, date: '2029-09-30', kickoff: null,
        opponent: 'Philadelphia Eagles', home: false, conference: false, division: true,
        result: { teamScore: 20, opponentScore: 34 }, booster: null,
        stats: {
          receptions: 14, receivingYards: 141, receivingYac: 88,
          receivingTd: 1, receivingLong: 50, targets: 16, carries: 1,
          rushingYards: 1, rushingTd: 0, rushingLong: 1, fumbles: 0,
          rushingAvg: 1, receivingAvg: 10.1, totalYards: 142, totalTd: 1
        },
        bigPlays: [
          '3 yard receiving touchdown'
        ] },
      { week:  5, date: '2029-10-07', kickoff: null,
        opponent: 'Baltimore Ravens', home: false, conference: false,
        result: { teamScore: 21, opponentScore: 14 }, booster: null,
        stats: {
          receptions: 9, receivingYards: 83, receivingYac: 40,
          receivingTd: 0, receivingLong: 23, targets: 10, carries: 2,
          rushingYards: 4, rushingTd: 1, rushingLong: 2, fumbles: 0,
          rushingAvg: 2, receivingAvg: 9.2, totalYards: 87, totalTd: 1
        },
        bigPlays: [
          '2 yard rushing touchdown'
        ] },
      { week:  6, date: '2029-10-14', kickoff: null,
        opponent: 'Dallas Cowboys', home: true, conference: false, division: true,
        result: { teamScore: 25, opponentScore: 17 }, booster: null,
        stats: {
          receptions: 10, receivingYards: 118, receivingYac: 47,
          receivingTd: 0, receivingLong: 24, targets: 11, carries: 1,
          rushingYards: 3, rushingTd: 0, rushingLong: 3, fumbles: 0,
          rushingAvg: 3, receivingAvg: 11.8, totalYards: 121, totalTd: 0
        } },
      { week:  7, date: '2029-10-21', kickoff: null,
        opponent: 'Dallas Cowboys', home: false, conference: false, division: true,
        result: { teamScore: 14, opponentScore: 22 }, booster: null,
        stats: {
          receptions: 11, receivingYards: 114, receivingYac: 50,
          receivingTd: 1, receivingLong: 25, targets: 11, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 10.4, totalYards: 114, totalTd: 1
        },
        bigPlays: [
          '9 yard receiving touchdown'
        ] },
      { week:  8, date: '2029-10-28', kickoff: null,
        opponent: 'Tampa Bay Buccaneers', home: true, conference: false,
        result: { teamScore: 13, opponentScore: 9 }, booster: 'boost-2-0',
        stats: {
          receptions: 8, receivingYards: 125, receivingYac: 21,
          receivingTd: 1, receivingLong: 22, targets: 9, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 15.6, totalYards: 125, totalTd: 1
        },
        bigPlays: [
          '14 yard receiving touchdown'
        ] },
      { week:  9, date: '2029-11-04', kickoff: null,
        opponent: 'Philadelphia Eagles', home: true, conference: false, division: true,
        result: { teamScore: 17, opponentScore: 18 }, booster: null,
        stats: {
          receptions: 12, receivingYards: 157, receivingYac: 61,
          receivingTd: 1, receivingLong: 24, targets: 14, carries: 3,
          rushingYards: 17, rushingTd: 0, rushingLong: 7, fumbles: 0,
          rushingAvg: 5.7, receivingAvg: 13.1, totalYards: 174, totalTd: 1
        },
        bigPlays: [
          '24 yard receiving touchdown'
        ] },
      { week: 10, date: '2029-11-11', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week: 11, date: '2029-11-18', kickoff: null,
        opponent: 'Washington Commanders', home: true, conference: false, division: true, hurt: { injury: 'Knee Sprain', weeks: 4 },
        result: { teamScore: 13, opponentScore: 14 }, booster: 'boost-1-5',
        stats: {
          receptions: 7, receivingYards: 129, receivingYac: 26,
          receivingTd: 1, receivingLong: 33, targets: 12, carries: 1,
          rushingYards: -1, rushingTd: 0, rushingLong: 0, fumbles: 0,
          rushingAvg: -1, receivingAvg: 18.4, totalYards: 128, totalTd: 1
        },
        bigPlays: [
          '33 yard receiving touchdown'
        ] },
      { week: 12, date: '2029-11-25', kickoff: null,
        opponent: 'Washington Commanders', home: false, conference: false, division: true, injured: true, injury: 'Knee Sprain', health: 80,
        result: { teamScore: 27, opponentScore: 20 }, booster: null,
        stats: {
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          totalYards: 0, totalTd: 0
        } },
      { week: 13, date: '2029-12-02', kickoff: null,
        opponent: 'Denver Broncos', home: true, conference: false, injured: true, injury: 'Knee Sprain', health: 80,
        result: { teamScore: 33, opponentScore: 17 }, booster: null,
        stats: {
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          totalYards: 0, totalTd: 0
        } },
      { week: 14, date: '2029-12-09', kickoff: null,
        opponent: 'Los Angeles Chargers', home: false, conference: false, injured: true, injury: 'Knee Sprain', health: 80,
        result: { teamScore: 16, opponentScore: 10 }, booster: null,
        stats: {
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          totalYards: 0, totalTd: 0
        } },
      { week: 15, date: '2029-12-16', kickoff: null,
        opponent: 'New Orleans Saints', home: false, conference: false, injured: true, injury: 'Knee Sprain', health: 80,
        result: { teamScore: 23, opponentScore: 3 }, booster: null,
        stats: {
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          totalYards: 0, totalTd: 0
        } },
      { week: 16, date: '2029-12-23', kickoff: null,
        opponent: 'Atlanta Falcons', home: true, conference: false,
        result: { teamScore: 28, opponentScore: 10 }, booster: null,
        stats: {
          receptions: 7, receivingYards: 113, receivingYac: 37,
          receivingTd: 0, receivingLong: 24, targets: 9, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 16.1, totalYards: 113, totalTd: 0
        } },
      { week: 17, date: '2029-12-30', kickoff: null,
        opponent: 'Carolina Panthers', home: false, conference: false,
        result: { teamScore: 24, opponentScore: 10 }, booster: null,
        stats: {
          receptions: 9, receivingYards: 91, receivingYac: 43,
          receivingTd: 2, receivingLong: 27, targets: 13, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 1,
          receivingAvg: 10.1, totalYards: 91, totalTd: 2
        },
        bigPlays: [
          '7 yard receiving touchdown',
          '5 yard receiving touchdown'
        ] },
      { week: 18, date: '2030-01-06', kickoff: null,
        opponent: 'Kansas City Chiefs', home: false, conference: false,
        result: { teamScore: 50, opponentScore: 23 }, booster: 'boost-2-0',
        stats: {
          receptions: 10, receivingYards: 153, receivingYac: 47,
          receivingTd: 3, receivingLong: 62, targets: 11, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 15.3, totalYards: 153, totalTd: 3
        },
        bigPlays: [
          '62 yard receiving touchdown',
          '1 yard receiving touchdown',
          '18 yard receiving touchdown'
        ] },
      { week: 19, date: '2030-01-12', kickoff: null,
        name: 'NFC Wild Card',
        opponent: 'Arizona Cardinals', home: false, conference: false, playoff: true, overtime: true,
        result: { teamScore: 27, opponentScore: 24 }, booster: null,
        stats: {
          receptions: 19, receivingYards: 214, receivingYac: 85,
          receivingTd: 2, receivingLong: 22, targets: 23, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 11.3, totalYards: 214, totalTd: 2
        },
        bigPlays: [
          '12 yard receiving touchdown',
          '9 yard receiving touchdown'
        ] },
      { week: 20, date: '2030-01-19', kickoff: null,
        name: 'NFC Divisional Round',
        opponent: 'Philadelphia Eagles', home: false, conference: false, playoff: true,
        result: { teamScore: 27, opponentScore: 24 }, booster: 'wager-for', line: 2.5,
        stats: {
          receptions: 4, receivingYards: 61, receivingYac: 31,
          receivingTd: 0, receivingLong: 27, targets: 7, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 15.3, totalYards: 61, totalTd: 0
        } },
      { week: 21, date: '2030-01-27', kickoff: null,
        name: 'NFC Championship',
        opponent: 'Tampa Bay Buccaneers', home: false, conference: false, playoff: true,
        result: { teamScore: 29, opponentScore: 3 }, booster: null,
        stats: {
          receptions: 11, receivingYards: 146, receivingYac: 36,
          receivingTd: 1, receivingLong: 31, targets: 11, carries: 2,
          rushingYards: 2, rushingTd: 1, rushingLong: 2, fumbles: 1,
          rushingAvg: 1, receivingAvg: 13.3, totalYards: 148, totalTd: 2
        },
        bigPlays: [
          '12 yard receiving touchdown',
          '2 yard rushing touchdown'
        ] },
      { week: 22, date: '2030-02-10', kickoff: null,
        name: 'Super Bowl LXIV',
        opponent: 'Pittsburgh Steelers', home: false, conference: false, neutral: true, playoff: true,
        result: { teamScore: 33, opponentScore: 28 }, booster: 'wager-for', line: -3.5,
        stats: {
          receptions: 12, receivingYards: 164, receivingYac: 61,
          receivingTd: 2, receivingLong: 28, targets: 14, carries: 1,
          rushingYards: 1, rushingTd: 0, rushingLong: 1, fumbles: 0,
          rushingAvg: 1, receivingAvg: 13.7, totalYards: 165, totalTd: 2
        },
        bigPlays: [
          '12 yard receiving touchdown',
          '28 yard receiving touchdown'
        ] },
    ],

    /* Isaac Vitel — Tampa Bay Buccaneers, then New York Jets */
    'isaac-vitel': [
      { week:  1, date: '2029-09-09', kickoff: null,
        opponent: 'Baltimore Ravens', home: false, conference: false,
        result: { teamScore: 6, opponentScore: 3 }, booster: null,
        stats: {
          completions: 24, attempts: 35, passingYards: 204,
          passingYac: 61, passingTd: 0, interceptions: 0, carries: 4,
          rushingYards: -5, rushingTd: 0, rushingLong: 1, sacks: 0,
          fumbles: 0, passingAvg: 8.5, rating: 83.5, rushingAvg: -1.2
        } },
      { week:  2, date: '2029-09-16', kickoff: null,
        opponent: 'Carolina Panthers', home: false, conference: false, division: true,
        result: { teamScore: 27, opponentScore: 24 }, booster: null,
        stats: {
          completions: 24, attempts: 30, passingYards: 255,
          passingYac: 103, passingTd: 3, interceptions: 1, carries: 5,
          rushingYards: 1, rushingTd: 0, rushingLong: 4, sacks: 0,
          fumbles: 0, passingAvg: 10.6, rating: 121.5, rushingAvg: 0.2
        },
        bigPlays: [
          '12 yard passing touchdown',
          '12 yard passing touchdown',
          '26 yard game-winning passing touchdown'
        ] },
      { week:  3, date: '2029-09-23', kickoff: null,
        opponent: 'New Orleans Saints', home: true, conference: false, division: true,
        result: { teamScore: 16, opponentScore: 8 }, booster: null,
        stats: {
          completions: 23, attempts: 36, passingYards: 231,
          passingYac: 118, passingTd: 0, interceptions: 0, carries: 4,
          rushingYards: -2, rushingTd: 0, rushingLong: 1, sacks: 0,
          fumbles: 0, passingAvg: 10, rating: 82.1, rushingAvg: -0.5
        } },
      { week:  4, date: '2029-09-30', kickoff: null,
        opponent: 'Washington Commanders', home: false, conference: false,
        result: { teamScore: 14, opponentScore: 22 }, booster: null,
        stats: {
          completions: 28, attempts: 45, passingYards: 280,
          passingYac: 79, passingTd: 0, interceptions: 0, carries: 5,
          rushingYards: 22, rushingTd: 0, rushingLong: 9, sacks: 4,
          fumbles: 0, passingAvg: 10, rating: 79.9, rushingAvg: 4.4
        } },
      { week:  5, date: '2029-10-07', kickoff: null,
        opponent: 'New Orleans Saints', home: false, conference: false, division: true,
        result: { teamScore: 17, opponentScore: 10 }, booster: null,
        stats: {
          completions: 26, attempts: 38, passingYards: 258,
          passingYac: 89, passingTd: 0, interceptions: 0, carries: 3,
          rushingYards: 2, rushingTd: 0, rushingLong: 4, sacks: 0,
          fumbles: 0, passingAvg: 9.9, rating: 87.4, rushingAvg: 0.7
        } },
      { week:  6, date: '2029-10-14', kickoff: null,
        opponent: 'Carolina Panthers', home: true, conference: false, division: true,
        result: { teamScore: 18, opponentScore: 15 }, booster: 'boost-2-0',
        stats: {
          completions: 21, attempts: 38, passingYards: 230,
          passingYac: 131, passingTd: 1, interceptions: 0, carries: 1,
          rushingYards: 4, rushingTd: 0, rushingLong: 4, sacks: 2,
          fumbles: 0, passingAvg: 11, rating: 82.1, rushingAvg: 4
        },
        bigPlays: [
          '9 yard game-winning passing touchdown'
        ] },
      { week: 11, date: '2029-11-18', kickoff: null,
        opponent: 'New England Patriots', home: false, conference: false, division: true,
        result: { teamScore: 33, opponentScore: 23 }, booster: null,
        stats: {
          completions: 32, attempts: 39, passingYards: 262,
          passingYac: 100, passingTd: 2, interceptions: 0, carries: 3,
          rushingYards: 0, rushingTd: 0, rushingLong: 2, sacks: 1,
          fumbles: 0, passingAvg: 8.2, rating: 111.8, rushingAvg: 0
        },
        bigPlays: [
          '11 yard passing touchdown',
          '6 yard passing touchdown'
        ] },
      { week: 12, date: '2029-11-25', kickoff: null,
        opponent: 'Houston Texans', home: false, conference: false,
        result: { teamScore: 33, opponentScore: 15 }, booster: null,
        stats: {
          completions: 23, attempts: 33, passingYards: 214,
          passingYac: 87, passingTd: 1, interceptions: 0, carries: 1,
          rushingYards: -1, rushingTd: 0, rushingLong: 0, sacks: 3,
          fumbles: 1, passingAvg: 9.3, rating: 97.3, rushingAvg: -1
        },
        bigPlays: [
          '12 yard passing touchdown'
        ] },
      { week: 13, date: '2029-12-02', kickoff: null,
        opponent: 'Tennessee Titans', home: false, conference: false,
        result: { teamScore: 21, opponentScore: 17 }, booster: null,
        stats: {
          completions: 23, attempts: 31, passingYards: 259,
          passingYac: 87, passingTd: 3, interceptions: 0, carries: 6,
          rushingYards: 8, rushingTd: 0, rushingLong: 5, sacks: 1,
          fumbles: 0, passingAvg: 11.3, rating: 131, rushingAvg: 1.3
        },
        bigPlays: [
          '10 yard passing touchdown',
          '17 yard passing touchdown',
          '21 yard game-winning passing touchdown'
        ] },
      { week: 14, date: '2029-12-09', kickoff: null,
        opponent: 'Buffalo Bills', home: true, conference: false, division: true,
        result: { teamScore: 43, opponentScore: 7 }, booster: 'boost-2-0',
        stats: {
          completions: 25, attempts: 36, passingYards: 372,
          passingYac: 175, passingTd: 3, interceptions: 1, carries: 3,
          rushingYards: 4, rushingTd: 0, rushingLong: 6, sacks: 1,
          fumbles: 0, passingAvg: 14.9, rating: 119.2, rushingAvg: 1.3
        },
        bigPlays: [
          '53 yard passing touchdown',
          '10 yard passing touchdown',
          '9 yard passing touchdown'
        ] },
      { week: 15, date: '2029-12-16', kickoff: null,
        opponent: 'Miami Dolphins', home: false, conference: false, division: true,
        result: { teamScore: 31, opponentScore: 27 }, booster: 'boost-1-5',
        stats: {
          completions: 23, attempts: 41, passingYards: 361,
          passingYac: 155, passingTd: 3, interceptions: 0, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, sacks: 1,
          fumbles: 0, passingAvg: 15.7, rating: 109.9
        },
        bigPlays: [
          '42 yard passing touchdown',
          '17 yard passing touchdown',
          '3 yard game-winning passing touchdown'
        ] },
      { week: 16, date: '2029-12-23', kickoff: null,
        opponent: 'Detroit Lions', home: true, conference: false,
        result: { teamScore: 24, opponentScore: 27 }, booster: null,
        stats: {
          completions: 34, attempts: 45, passingYards: 431,
          passingYac: 114, passingTd: 3, interceptions: 1, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, sacks: 6,
          fumbles: 2, passingAvg: 12.7, rating: 117.9
        },
        bigPlays: [
          '9 yard passing touchdown',
          '14 yard passing touchdown',
          '3 yard passing touchdown'
        ] },
      { week: 17, date: '2029-12-30', kickoff: null,
        opponent: 'Jacksonville Jaguars', home: true, conference: false,
        result: { teamScore: 27, opponentScore: 10 }, booster: 'boost-2-0',
        stats: {
          completions: 23, attempts: 33, passingYards: 280,
          passingYac: 131, passingTd: 2, interceptions: 1, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, sacks: 4,
          fumbles: 0, passingAvg: 12.2, rating: 103.1
        },
        bigPlays: [
          '13 yard passing touchdown',
          '2 yard passing touchdown'
        ] },
      { week: 18, date: '2030-01-06', kickoff: null,
        opponent: 'Miami Dolphins', home: true, conference: false, division: true,
        result: { teamScore: 33, opponentScore: 10 }, booster: 'boost-1-5',
        stats: {
          completions: 37, attempts: 42, passingYards: 396,
          passingYac: 123, passingTd: 1, interceptions: 0, carries: 2,
          rushingYards: 6, rushingTd: 0, rushingLong: 5, sacks: 2,
          fumbles: 0, passingAvg: 10.7, rating: 113.9, rushingAvg: 3
        },
        bigPlays: [
          '1 yard passing touchdown'
        ] },
      { week: 19, date: '2030-01-12', kickoff: null,
        name: 'AFC Wild Card',
        opponent: 'Los Angeles Chargers', home: false, conference: false, playoff: true,
        result: { teamScore: 21, opponentScore: 12 }, booster: null,
        stats: {
          completions: 26, attempts: 36, passingYards: 318,
          passingYac: 138, passingTd: 2, interceptions: 0, carries: 1,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, sacks: 1,
          fumbles: 1, passingAvg: 12.2, rating: 117.6, rushingAvg: 0
        },
        bigPlays: [
          '10 yard passing touchdown',
          '7 yard passing touchdown'
        ] },
      { week: 20, date: '2030-01-19', kickoff: null,
        name: 'AFC Divisional Round',
        opponent: 'Pittsburgh Steelers', home: false, conference: false, playoff: true,
        result: { teamScore: 14, opponentScore: 24 }, booster: null,
        stats: {
          completions: 26, attempts: 38, passingYards: 299,
          passingYac: 114, passingTd: 1, interceptions: 0, carries: 2,
          rushingYards: 1, rushingTd: 0, rushingLong: 2, sacks: 3,
          fumbles: 0, passingAvg: 11.5, rating: 100.7, rushingAvg: 0.5
        },
        bigPlays: [
          '3 yard passing touchdown'
        ] },
    ],

    /* Sam Stogsdill — Pittsburgh Steelers */
    'sam-stogsdill': [
      { week:  1, date: '2029-09-09', kickoff: null,
        opponent: 'Las Vegas Raiders', home: true, conference: false,
        result: { teamScore: 21, opponentScore: 24 }, booster: null,
        stats: {
          carries: 30, rushingYards: 149, rushingTd: 2, rushingLong: 34,
          receptions: 6, receivingYards: 98, receivingYac: 67,
          receivingTd: 1, receivingLong: 36, targets: 7, fumbles: 0,
          rushingAvg: 5, receivingAvg: 16.3, totalYards: 247, totalTd: 3
        },
        bigPlays: [
          '1 yard rushing touchdown',
          '4 yard rushing touchdown',
          '8 yard receiving touchdown'
        ] },
      { week:  2, date: '2029-09-16', kickoff: null,
        opponent: 'New England Patriots', home: true, conference: false,
        result: { teamScore: 24, opponentScore: 10 }, booster: null,
        stats: {
          carries: 26, rushingYards: 174, rushingTd: 0, rushingLong: 37,
          receptions: 3, receivingYards: 27, receivingYac: 22,
          receivingTd: 0, receivingLong: 16, targets: 5, fumbles: 0,
          rushingAvg: 6.7, receivingAvg: 9, totalYards: 201, totalTd: 0
        } },
      { week:  3, date: '2029-09-23', kickoff: null,
        opponent: 'Houston Texans', home: false, conference: false,
        result: { teamScore: 39, opponentScore: 35 }, booster: null,
        stats: {
          carries: 17, rushingYards: 105, rushingTd: 1, rushingLong: 38,
          receptions: 10, receivingYards: 152, receivingYac: 128,
          receivingTd: 0, receivingLong: 60, targets: 12, fumbles: 0,
          rushingAvg: 6.2, receivingAvg: 15.2, totalYards: 257, totalTd: 1
        },
        bigPlays: [
          '38 yard rushing touchdown'
        ] },
      { week:  4, date: '2029-09-30', kickoff: null,
        opponent: 'Cincinnati Bengals', home: false, conference: false, division: true,
        result: { teamScore: 24, opponentScore: 21 }, booster: 'boost-1-5',
        stats: {
          carries: 21, rushingYards: 165, rushingTd: 1, rushingLong: 46,
          receptions: 5, receivingYards: 29, receivingYac: 17,
          receivingTd: 0, receivingLong: 9, targets: 5, fumbles: 0,
          rushingAvg: 7.9, receivingAvg: 5.8, totalYards: 194, totalTd: 1
        },
        bigPlays: [
          '46 yard rushing touchdown'
        ] },
      { week:  5, date: '2029-10-07', kickoff: null,
        opponent: 'Cincinnati Bengals', home: true, conference: false, division: true,
        result: { teamScore: 21, opponentScore: 26 }, booster: 'boost-1-5',
        stats: {
          carries: 18, rushingYards: 111, rushingTd: 0, rushingLong: 20,
          receptions: 6, receivingYards: 36, receivingYac: 28,
          receivingTd: 2, receivingLong: 12, targets: 7, fumbles: 0,
          rushingAvg: 6.2, receivingAvg: 6, totalYards: 147, totalTd: 2
        },
        bigPlays: [
          '1 yard receiving touchdown',
          '3 yard receiving touchdown'
        ] },
      { week:  6, date: '2029-10-14', kickoff: null,
        opponent: 'Cleveland Browns', home: false, conference: false, division: true,
        result: { teamScore: 28, opponentScore: 14 }, booster: 'wager-for', line: 0.5,
        stats: {
          carries: 33, rushingYards: 210, rushingTd: 3, rushingLong: 40,
          receptions: 5, receivingYards: 54, receivingYac: 36,
          receivingTd: 0, receivingLong: 18, targets: 5, fumbles: 0,
          rushingAvg: 6.4, receivingAvg: 10.8, totalYards: 264, totalTd: 3
        },
        bigPlays: [
          '8 yard rushing touchdown',
          '1 yard rushing touchdown',
          '2 yard rushing touchdown'
        ] },
      { week:  7, date: '2029-10-21', kickoff: null,
        opponent: 'Kansas City Chiefs', home: false, conference: false,
        result: { teamScore: 24, opponentScore: 10 }, booster: null,
        stats: {
          carries: 26, rushingYards: 161, rushingTd: 2, rushingLong: 48,
          receptions: 4, receivingYards: 11, receivingYac: 10,
          receivingTd: 0, receivingLong: 6, targets: 5, fumbles: 0,
          rushingAvg: 6.2, receivingAvg: 2.8, totalYards: 172, totalTd: 2
        },
        bigPlays: [
          '4 yard rushing touchdown',
          '1 yard rushing touchdown'
        ] },
      { week:  8, date: '2029-10-28', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week:  9, date: '2029-11-04', kickoff: null,
        opponent: 'Baltimore Ravens', home: false, conference: false, division: true,
        result: { teamScore: 24, opponentScore: 31 }, booster: 'boost-2-5',
        stats: {
          carries: 20, rushingYards: 105, rushingTd: 3, rushingLong: 21,
          receptions: 2, receivingYards: 12, receivingYac: 9,
          receivingTd: 0, receivingLong: 12, targets: 6, fumbles: 0,
          rushingAvg: 5.3, receivingAvg: 6, totalYards: 117, totalTd: 3
        },
        bigPlays: [
          '9 yard rushing touchdown',
          '1 yard rushing touchdown',
          '21 yard rushing touchdown'
        ] },
      { week: 10, date: '2029-11-11', kickoff: null,
        opponent: 'Philadelphia Eagles', home: true, conference: false,
        result: { teamScore: 3, opponentScore: 33 }, booster: null,
        stats: {
          carries: 14, rushingYards: 54, rushingTd: 0, rushingLong: 17,
          receptions: 7, receivingYards: 58, receivingYac: 49,
          receivingTd: 0, receivingLong: 18, targets: 9, fumbles: 1,
          rushingAvg: 3.9, receivingAvg: 8.3, totalYards: 112, totalTd: 0
        } },
      { week: 11, date: '2029-11-18', kickoff: null,
        opponent: 'Los Angeles Chargers', home: false, conference: false, overtime: true,
        result: { teamScore: 33, opponentScore: 27 }, booster: 'boost-2-0',
        stats: {
          carries: 17, rushingYards: 81, rushingTd: 1, rushingLong: 27,
          receptions: 12, receivingYards: 116, receivingYac: 85,
          receivingTd: 0, receivingLong: 34, targets: 16, fumbles: 0,
          rushingAvg: 4.8, receivingAvg: 9.7, totalYards: 197, totalTd: 1
        },
        bigPlays: [
          '3 yard rushing touchdown'
        ] },
      { week: 12, date: '2029-11-25', kickoff: null,
        opponent: 'Cleveland Browns', home: true, conference: false, division: true, overtime: true,
        result: { teamScore: 26, opponentScore: 20 }, booster: null,
        stats: {
          carries: 22, rushingYards: 133, rushingTd: 1, rushingLong: 19,
          receptions: 8, receivingYards: 93, receivingYac: 55,
          receivingTd: 1, receivingLong: 34, targets: 11, fumbles: 0,
          rushingAvg: 6, receivingAvg: 11.6, totalYards: 226, totalTd: 2
        },
        bigPlays: [
          '4 yard rushing touchdown',
          '34 yard receiving touchdown'
        ] },
      { week: 13, date: '2029-12-02', kickoff: null,
        opponent: 'Carolina Panthers', home: true, conference: false,
        result: { teamScore: 31, opponentScore: 24 }, booster: 'boost-1-5',
        stats: {
          carries: 21, rushingYards: 77, rushingTd: 0, rushingLong: 21,
          receptions: 8, receivingYards: 54, receivingYac: 26,
          receivingTd: 1, receivingLong: 20, targets: 8, fumbles: 0,
          rushingAvg: 3.7, receivingAvg: 6.8, totalYards: 131, totalTd: 1
        },
        bigPlays: [
          '3 yard receiving touchdown'
        ] },
      { week: 14, date: '2029-12-09', kickoff: null,
        opponent: 'Atlanta Falcons', home: false, conference: false,
        result: { teamScore: 19, opponentScore: 9 }, booster: null,
        stats: {
          carries: 20, rushingYards: 108, rushingTd: 0, rushingLong: 23,
          receptions: 4, receivingYards: 45, receivingYac: 14,
          receivingTd: 0, receivingLong: 20, targets: 8, fumbles: 0,
          rushingAvg: 5.4, receivingAvg: 11.3, totalYards: 153, totalTd: 0
        } },
      { week: 15, date: '2029-12-16', kickoff: null,
        opponent: 'Baltimore Ravens', home: true, conference: false, division: true,
        result: { teamScore: 37, opponentScore: 17 }, booster: null,
        stats: {
          carries: 20, rushingYards: 146, rushingTd: 0, rushingLong: 22,
          receptions: 7, receivingYards: 74, receivingYac: 49,
          receivingTd: 0, receivingLong: 17, targets: 8, fumbles: 0,
          rushingAvg: 7.3, receivingAvg: 10.6, totalYards: 220, totalTd: 0
        } },
      { week: 16, date: '2029-12-23', kickoff: null,
        opponent: 'Tampa Bay Buccaneers', home: false, conference: false,
        result: { teamScore: 30, opponentScore: 28 }, booster: null,
        stats: {
          carries: 16, rushingYards: 170, rushingTd: 3, rushingLong: 33,
          receptions: 4, receivingYards: 13, receivingYac: 4,
          receivingTd: 0, receivingLong: 5, targets: 6, fumbles: 0,
          rushingAvg: 10.6, receivingAvg: 3.3, totalYards: 183, totalTd: 3
        },
        bigPlays: [
          '2 yard rushing touchdown',
          '3 yard rushing touchdown',
          '31 yard game-winning rushing touchdown'
        ] },
      { week: 17, date: '2029-12-30', kickoff: null,
        opponent: 'New Orleans Saints', home: true, conference: false,
        result: { teamScore: 23, opponentScore: 16 }, booster: null,
        stats: {
          carries: 21, rushingYards: 130, rushingTd: 1, rushingLong: 32,
          receptions: 8, receivingYards: 67, receivingYac: 40,
          receivingTd: 1, receivingLong: 17, targets: 8, fumbles: 0,
          rushingAvg: 6.2, receivingAvg: 8.4, totalYards: 197, totalTd: 2
        },
        bigPlays: [
          '6 yard receiving touchdown',
          '1 yard rushing touchdown'
        ] },
      { week: 18, date: '2030-01-06', kickoff: null,
        opponent: 'Denver Broncos', home: true, conference: false,
        result: { teamScore: 25, opponentScore: 27 }, booster: 'wager-for', line: -8.5,
        stats: {
          carries: 18, rushingYards: 109, rushingTd: 2, rushingLong: 23,
          receptions: 4, receivingYards: 29, receivingYac: 19,
          receivingTd: 0, receivingLong: 12, targets: 6, fumbles: 1,
          rushingAvg: 6.1, receivingAvg: 7.3, totalYards: 138, totalTd: 2
        },
        bigPlays: [
          '16 yard rushing touchdown',
          '10 yard rushing touchdown'
        ] },
      { week: 19, date: '2030-01-12', kickoff: null,
        name: 'AFC Wild Card',
        opponent: 'Jacksonville Jaguars', home: true, conference: false, playoff: true,
        result: { teamScore: 41, opponentScore: 21 }, booster: null,
        stats: {
          carries: 25, rushingYards: 185, rushingTd: 2, rushingLong: 45,
          receptions: 5, receivingYards: 86, receivingYac: 76,
          receivingTd: 1, receivingLong: 53, targets: 5, fumbles: 1,
          rushingAvg: 7.4, receivingAvg: 17.2, totalYards: 271, totalTd: 3
        },
        bigPlays: [
          '3 yard receiving touchdown',
          '4 yard rushing touchdown',
          '5 yard rushing touchdown'
        ] },
      { week: 20, date: '2030-01-19', kickoff: null,
        name: 'AFC Divisional Round',
        opponent: 'New York Jets', home: true, conference: false, playoff: true,
        result: { teamScore: 24, opponentScore: 14 }, booster: null,
        stats: {
          carries: 25, rushingYards: 145, rushingTd: 2, rushingLong: 33,
          receptions: 4, receivingYards: 43, receivingYac: 18,
          receivingTd: 1, receivingLong: 20, targets: 4, fumbles: 0,
          rushingAvg: 5.8, receivingAvg: 10.8, totalYards: 188, totalTd: 3
        },
        bigPlays: [
          '17 yard receiving touchdown',
          '2 yard rushing touchdown',
          '20 yard game-winning rushing touchdown'
        ] },
      { week: 21, date: '2030-01-27', kickoff: null,
        name: 'AFC Championship',
        opponent: 'Houston Texans', home: false, conference: false, playoff: true,
        result: { teamScore: 23, opponentScore: 16 }, booster: null,
        stats: {
          carries: 27, rushingYards: 175, rushingTd: 2, rushingLong: 35,
          receptions: 4, receivingYards: 25, receivingYac: 19,
          receivingTd: 0, receivingLong: 10, targets: 5, fumbles: 0,
          rushingAvg: 6.5, receivingAvg: 6.3, totalYards: 200, totalTd: 2
        },
        bigPlays: [
          '1 yard rushing touchdown',
          '28 yard rushing touchdown'
        ] },
      { week: 22, date: '2030-02-10', kickoff: null,
        name: 'Super Bowl LXIV',
        opponent: 'New York Giants', home: false, conference: false, neutral: true, playoff: true,
        result: { teamScore: 28, opponentScore: 33 }, booster: null,
        stats: {
          carries: 19, rushingYards: 137, rushingTd: 1, rushingLong: 23,
          receptions: 4, receivingYards: 38, receivingYac: 24,
          receivingTd: 0, receivingLong: 14, targets: 5, fumbles: 0,
          rushingAvg: 7.2, receivingAvg: 9.5, totalYards: 175, totalTd: 1
        },
        bigPlays: [
          '23 yard rushing touchdown'
        ] },
    ],

    /* Jaykeb Stewart — Houston Texans */
    'jaykeb-stewart': [
      { week:  1, date: '2029-09-09', kickoff: null,
        opponent: 'Buffalo Bills', home: true, conference: false,
        result: { teamScore: 28, opponentScore: 17 }, booster: null,
        stats: {
          completions: 23, attempts: 28, passingYards: 276,
          passingYac: 176, passingTd: 2, interceptions: 0, carries: 9,
          rushingYards: 31, rushingTd: 1, rushingLong: 10, sacks: 0,
          fumbles: 0, passingAvg: 12, rating: 131.5, rushingAvg: 3.4
        },
        bigPlays: [
          '6 yard passing touchdown',
          '13 yard passing touchdown',
          '4 yard rushing touchdown'
        ] },
      { week:  2, date: '2029-09-16', kickoff: null,
        opponent: 'Jacksonville Jaguars', home: false, conference: false, division: true,
        result: { teamScore: 31, opponentScore: 29 }, booster: 'boost-2-0',
        stats: {
          completions: 22, attempts: 32, passingYards: 351,
          passingYac: 175, passingTd: 3, interceptions: 1, carries: 6,
          rushingYards: 23, rushingTd: 1, rushingLong: 18, sacks: 0,
          fumbles: 0, passingAvg: 16, rating: 123.3, rushingAvg: 3.8
        },
        bigPlays: [
          '44 yard passing touchdown',
          '18 yard rushing touchdown',
          '4 yard passing touchdown',
          '5 yard passing touchdown'
        ] },
      { week:  3, date: '2029-09-23', kickoff: null,
        opponent: 'Pittsburgh Steelers', home: true, conference: false,
        result: { teamScore: 35, opponentScore: 39 }, booster: 'boost-2-0',
        stats: {
          completions: 33, attempts: 43, passingYards: 384,
          passingYac: 107, passingTd: 4, interceptions: 0, carries: 8,
          rushingYards: 47, rushingTd: 0, rushingLong: 12, sacks: 1,
          fumbles: 0, passingAvg: 11.6, rating: 134.3, rushingAvg: 5.9
        },
        bigPlays: [
          '6 yard passing touchdown',
          '2 yard passing touchdown',
          '9 yard passing touchdown',
          '6 yard passing touchdown'
        ] },
      { week:  4, date: '2029-09-30', kickoff: null,
        opponent: 'Los Angeles Rams', home: true, conference: false,
        result: { teamScore: 40, opponentScore: 24 }, booster: 'boost-2-0',
        stats: {
          completions: 24, attempts: 31, passingYards: 324,
          passingYac: 176, passingTd: 4, interceptions: 1, carries: 7,
          rushingYards: 32, rushingTd: 0, rushingLong: 18, sacks: 1,
          fumbles: 0, passingAvg: 13.5, rating: 136.3, rushingAvg: 4.6
        },
        bigPlays: [
          '1 yard passing touchdown',
          '1 yard passing touchdown',
          '4 yard passing touchdown',
          '8 yard passing touchdown'
        ] },
      { week:  5, date: '2029-10-07', kickoff: null,
        opponent: 'Indianapolis Colts', home: false, conference: false, division: true,
        result: { teamScore: 45, opponentScore: 34 }, booster: 'boost-1-5',
        stats: {
          completions: 30, attempts: 41, passingYards: 334,
          passingYac: 148, passingTd: 4, interceptions: 2, carries: 4,
          rushingYards: 26, rushingTd: 0, rushingLong: 25, sacks: 2,
          fumbles: 0, passingAvg: 11.1, rating: 109.2, rushingAvg: 6.5
        },
        bigPlays: [
          '14 yard passing touchdown',
          '8 yard passing touchdown',
          '13 yard passing touchdown',
          '57 yard game-winning passing touchdown'
        ] },
      { week:  6, date: '2029-10-14', kickoff: null,
        opponent: 'Indianapolis Colts', home: true, conference: false, division: true,
        result: { teamScore: 36, opponentScore: 20 }, booster: 'boost-1-5',
        stats: {
          completions: 20, attempts: 26, passingYards: 311,
          passingYac: 81, passingTd: 3, interceptions: 1, carries: 6,
          rushingYards: 15, rushingTd: 0, rushingLong: 7, sacks: 0,
          fumbles: 0, passingAvg: 15.6, rating: 138.5, rushingAvg: 2.5
        },
        bigPlays: [
          '5 yard passing touchdown',
          '23 yard passing touchdown',
          '6 yard passing touchdown'
        ] },
      { week:  7, date: '2029-10-21', kickoff: null,
        opponent: 'Las Vegas Raiders', home: false, conference: false,
        result: { teamScore: 30, opponentScore: 24 }, booster: null,
        stats: {
          completions: 20, attempts: 30, passingYards: 267,
          passingYac: 70, passingTd: 2, interceptions: 0, carries: 8,
          rushingYards: 18, rushingTd: 0, rushingLong: 16, sacks: 0,
          fumbles: 0, passingAvg: 13.4, rating: 116.9, rushingAvg: 2.3
        },
        bigPlays: [
          '6 yard passing touchdown',
          '36 yard passing touchdown'
        ] },
      { week:  8, date: '2029-10-28', kickoff: null,
        opponent: 'Tennessee Titans', home: true, conference: false, division: true,
        result: { teamScore: 24, opponentScore: 30 }, booster: null,
        stats: {
          completions: 25, attempts: 35, passingYards: 290,
          passingYac: 102, passingTd: 1, interceptions: 0, carries: 6,
          rushingYards: 24, rushingTd: 0, rushingLong: 7, sacks: 0,
          fumbles: 0, passingAvg: 11.6, rating: 105.7, rushingAvg: 4
        },
        bigPlays: [
          '5 yard passing touchdown'
        ] },
      { week:  9, date: '2029-11-04', kickoff: null,
        opponent: 'Miami Dolphins', home: false, conference: false,
        result: { teamScore: 20, opponentScore: 13 }, booster: null,
        stats: {
          completions: 19, attempts: 24, passingYards: 146,
          passingYac: 52, passingTd: 2, interceptions: 0, carries: 4,
          rushingYards: 13, rushingTd: 0, rushingLong: 8, sacks: 2,
          fumbles: 0, passingAvg: 7.7, rating: 119.8, rushingAvg: 3.3
        },
        bigPlays: [
          '5 yard passing touchdown',
          '12 yard passing touchdown'
        ] },
      { week: 10, date: '2029-11-11', kickoff: null,
        opponent: 'Jacksonville Jaguars', home: true, conference: false, division: true,
        result: { teamScore: 39, opponentScore: 10 }, booster: null,
        stats: {
          completions: 19, attempts: 27, passingYards: 281,
          passingYac: 108, passingTd: 2, interceptions: 0, carries: 7,
          rushingYards: 37, rushingTd: 0, rushingLong: 13, sacks: 0,
          fumbles: 0, passingAvg: 14.8, rating: 128.8, rushingAvg: 5.3
        },
        bigPlays: [
          '18 yard passing touchdown',
          '40 yard passing touchdown'
        ] },
      { week: 11, date: '2029-11-18', kickoff: null,
        opponent: 'Tennessee Titans', home: false, conference: false, division: true,
        result: { teamScore: 27, opponentScore: 11 }, booster: null,
        stats: {
          completions: 21, attempts: 40, passingYards: 278,
          passingYac: 74, passingTd: 2, interceptions: 0, carries: 6,
          rushingYards: 79, rushingTd: 1, rushingLong: 28, sacks: 2,
          fumbles: 0, passingAvg: 13.2, rating: 91.5, rushingAvg: 13.2
        },
        bigPlays: [
          '8 yard rushing touchdown',
          '3 yard passing touchdown',
          '3 yard passing touchdown'
        ] },
      { week: 12, date: '2029-11-25', kickoff: null,
        opponent: 'New York Jets', home: true, conference: false,
        result: { teamScore: 15, opponentScore: 33 }, booster: null,
        stats: {
          completions: 26, attempts: 37, passingYards: 291,
          passingYac: 68, passingTd: 2, interceptions: 0, carries: 6,
          rushingYards: 26, rushingTd: 0, rushingLong: 14, sacks: 4,
          fumbles: 1, passingAvg: 11.2, rating: 111.4, rushingAvg: 4.3
        },
        bigPlays: [
          '23 yard passing touchdown',
          '16 yard passing touchdown'
        ] },
      { week: 13, date: '2029-12-02', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week: 14, date: '2029-12-09', kickoff: null,
        opponent: 'New England Patriots', home: false, conference: false,
        result: { teamScore: 31, opponentScore: 22 }, booster: null,
        stats: {
          completions: 23, attempts: 30, passingYards: 304,
          passingYac: 130, passingTd: 2, interceptions: 0, carries: 3,
          rushingYards: -1, rushingTd: 0, rushingLong: 1, sacks: 2,
          fumbles: 0, passingAvg: 13.2, rating: 130.4, rushingAvg: -0.3
        },
        bigPlays: [
          '7 yard passing touchdown',
          '1 yard passing touchdown'
        ] },
      { week: 15, date: '2029-12-16', kickoff: null,
        opponent: 'Chicago Bears', home: true, conference: false,
        result: { teamScore: 37, opponentScore: 21 }, booster: null,
        stats: {
          completions: 29, attempts: 36, passingYards: 279,
          passingYac: 84, passingTd: 4, interceptions: 0, carries: 5,
          rushingYards: 25, rushingTd: 1, rushingLong: 17, sacks: 1,
          fumbles: 0, passingAvg: 9.6, rating: 136, rushingAvg: 5
        },
        bigPlays: [
          '19 yard passing touchdown',
          '19 yard passing touchdown',
          '3 yard passing touchdown',
          '28 yard passing touchdown',
          '3 yard rushing touchdown'
        ] },
      { week: 16, date: '2029-12-23', kickoff: null,
        opponent: 'Seattle Seahawks', home: false, conference: false,
        result: { teamScore: 40, opponentScore: 10 }, booster: null,
        stats: {
          completions: 26, attempts: 32, passingYards: 367,
          passingYac: 148, passingTd: 3, interceptions: 1, carries: 3,
          rushingYards: 13, rushingTd: 0, rushingLong: 8, sacks: 1,
          fumbles: 0, passingAvg: 14.1, rating: 132.7, rushingAvg: 4.3
        },
        bigPlays: [
          '21 yard passing touchdown',
          '20 yard passing touchdown',
          '15 yard passing touchdown'
        ] },
      { week: 17, date: '2029-12-30', kickoff: null,
        opponent: 'Arizona Cardinals', home: false, conference: false,
        result: { teamScore: 12, opponentScore: 20 }, booster: null,
        stats: {
          completions: 17, attempts: 24, passingYards: 148,
          passingYac: 74, passingTd: 1, interceptions: 0, carries: 5,
          rushingYards: 16, rushingTd: 0, rushingLong: 17, sacks: 1,
          fumbles: 0, passingAvg: 8.7, rating: 100.7, rushingAvg: 3.2
        },
        bigPlays: [
          '2 yard passing touchdown'
        ] },
      { week: 18, date: '2030-01-06', kickoff: null,
        opponent: 'San Francisco 49ers', home: true, conference: false,
        result: { teamScore: 13, opponentScore: 10 }, booster: null,
        stats: {
          completions: 18, attempts: 26, passingYards: 204,
          passingYac: 63, passingTd: 0, interceptions: 0, carries: 6,
          rushingYards: 2, rushingTd: 0, rushingLong: 7, sacks: 0,
          fumbles: 0, passingAvg: 11.3, rating: 92.5, rushingAvg: 0.3
        } },
      { week: 20, date: '2030-01-19', kickoff: null,
        name: 'AFC Divisional Round',
        opponent: 'Cincinnati Bengals', home: true, conference: false, playoff: true,
        result: { teamScore: 28, opponentScore: 20 }, booster: null,
        stats: {
          completions: 26, attempts: 31, passingYards: 245,
          passingYac: 96, passingTd: 2, interceptions: 0, carries: 7,
          rushingYards: 29, rushingTd: 1, rushingLong: 25, sacks: 1,
          fumbles: 0, passingAvg: 9.4, rating: 121.1, rushingAvg: 4.1
        },
        bigPlays: [
          '38 yard passing touchdown',
          '10 yard passing touchdown',
          '4 yard rushing touchdown'
        ] },
      { week: 21, date: '2030-01-27', kickoff: null,
        name: 'AFC Championship',
        opponent: 'Pittsburgh Steelers', home: true, conference: false, playoff: true,
        result: { teamScore: 16, opponentScore: 23 }, booster: null,
        stats: {
          completions: 23, attempts: 38, passingYards: 245,
          passingYac: 124, passingTd: 2, interceptions: 1, carries: 5,
          rushingYards: 4, rushingTd: 0, rushingLong: 5, sacks: 2,
          fumbles: 0, passingAvg: 10.7, rating: 86, rushingAvg: 0.8
        },
        bigPlays: [
          '7 yard passing touchdown',
          '2 yard passing touchdown'
        ] },
    ],
  }
};
