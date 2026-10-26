/* ==========================================================================
   EGE Football — the 2025 season
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

EGE.stats[2025] = {
  season: 2025,
  level: 'NFL',

  /* Weeks the NFL Sim tab stored, written in here, and when each was
     saved: a stored week saved after this replaces the file's. */
  stored: {
    1: '2026-10-23T17:08:58.688Z',
    2: '2026-10-23T17:48:25.452Z',
    3: '2026-10-23T19:23:56.045Z',
    4: '2026-10-23T19:34:46.427Z',
    5: '2026-10-23T20:42:12.959Z',
    6: '2026-10-23T20:50:53.702Z',
    7: '2026-10-23T21:18:16.644Z',
    8: '2026-10-24T00:47:40.165Z',
    9: '2026-10-24T02:06:15.218Z',
    10: '2026-10-24T16:49:04.555Z',
    11: '2026-10-24T18:01:14.285Z',
    12: '2026-10-25T00:44:41.116Z',
    13: '2026-10-25T01:18:43.396Z',
    14: '2026-10-25T01:30:09.041Z',
    15: '2026-10-25T01:40:20.847Z',
    16: '2026-10-26T16:30:27.156Z'
  },

  /* The six traded in the NFL sim: from `week` on his games are the
     games of `to`, his team then, and the ones before it are as he
     played them. */
  trades: {
    'sam-stogsdill': [
      { week: 6, from: 'seattle', to: 'pittsburgh' }
    ],
    'andrew-parr': [
      { week: 8, from: 'detroit', to: 'carolina' }
    ]
  },

  games: {

    /* Andrew Parr — Detroit Lions, then Carolina Panthers */
    'andrew-parr': [
      { week:  1, date: '2025-09-07', kickoff: '4:25pm',
        opponent: 'Green Bay Packers', home: false, conference: false, division: true, overtime: true,
        result: { teamScore: 28, opponentScore: 34 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 47, receivingYac: 20,
          receivingTd: 0, receivingLong: 17, targets: 8, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 11.8, totalYards: 47, totalTd: 0
        } },
      { week:  2, date: '2025-09-14', kickoff: '1:00pm',
        opponent: 'Chicago Bears', home: true, conference: false, division: true, overtime: true,
        result: { teamScore: 16, opponentScore: 10 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 53, receivingYac: 13,
          receivingTd: 0, receivingLong: 17, targets: 7, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 10.6, totalYards: 53, totalTd: 0
        } },
      { week:  3, date: '2025-09-22', kickoff: '8:15pm',
        opponent: 'Baltimore Ravens', home: false, conference: false,
        result: { teamScore: 29, opponentScore: 31 }, booster: null,
        stats: {
          receptions: 7, receivingYards: 89, receivingYac: 26,
          receivingTd: 1, receivingLong: 21, targets: 10, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 12.7, totalYards: 89, totalTd: 1
        },
        bigPlays: [
          '5 yard receiving touchdown'
        ] },
      { week:  4, date: '2025-09-28', kickoff: '1:00pm',
        opponent: 'Cleveland Browns', home: true, conference: false,
        result: { teamScore: 26, opponentScore: 8 }, booster: null,
        stats: {
          receptions: 6, receivingYards: 49, receivingYac: 11,
          receivingTd: 0, receivingLong: 20, targets: 8, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 8.2, totalYards: 49, totalTd: 0
        } },
      { week:  5, date: '2025-10-05', kickoff: '4:25pm',
        opponent: 'Cincinnati Bengals', home: false, conference: false,
        result: { teamScore: 13, opponentScore: 34 }, booster: null,
        stats: {
          receptions: 3, receivingYards: 14, receivingYac: 10,
          receivingTd: 0, receivingLong: 8, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 4.7, totalYards: 14, totalTd: 0
        } },
      { week:  6, date: '2025-10-12', kickoff: '8:20pm',
        opponent: 'Kansas City Chiefs', home: false, conference: false,
        result: { teamScore: 7, opponentScore: 21 }, booster: null,
        stats: {
          receptions: 3, receivingYards: 28, receivingYac: 20,
          receivingTd: 0, receivingLong: 17, targets: 4, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 9.3, totalYards: 28, totalTd: 0
        } },
      { week:  7, date: '2025-10-20', kickoff: '7:00pm',
        opponent: 'Tampa Bay Buccaneers', home: true, conference: false,
        result: { teamScore: 17, opponentScore: 24 }, booster: null,
        stats: {
          receptions: 3, receivingYards: 29, receivingYac: 4,
          receivingTd: 0, receivingLong: 20, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 9.7, totalYards: 29, totalTd: 0
        } },
      { week:  8, date: '2025-10-26', kickoff: '1:00pm',
        opponent: 'Buffalo Bills', home: true, conference: false,
        result: { teamScore: 37, opponentScore: 27 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 58, receivingYac: 3,
          receivingTd: 1, receivingLong: 20, targets: 8, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 14.5, totalYards: 58, totalTd: 1
        },
        bigPlays: [
          '17 yard receiving touchdown'
        ] },
      { week:  9, date: '2025-11-02', kickoff: '1:00pm',
        opponent: 'Green Bay Packers', home: false, conference: false,
        result: { teamScore: 37, opponentScore: 7 }, booster: null,
        stats: {
          receptions: 2, receivingYards: 29, receivingYac: 11,
          receivingTd: 0, receivingLong: 19, targets: 3, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 14.5, totalYards: 29, totalTd: 0
        } },
      { week: 10, date: '2025-11-09', kickoff: '1:00pm',
        opponent: 'New Orleans Saints', home: true, conference: false, division: true,
        result: { teamScore: 16, opponentScore: 6 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 52, receivingYac: 16,
          receivingTd: 0, receivingLong: 19, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 1,
          receivingAvg: 10.4, totalYards: 52, totalTd: 0
        } },
      { week: 11, date: '2025-11-16', kickoff: '1:00pm',
        opponent: 'Atlanta Falcons', home: false, conference: false, division: true,
        result: { teamScore: 3, opponentScore: 33 }, booster: null,
        stats: {
          receptions: 3, receivingYards: 4, receivingYac: 1,
          receivingTd: 0, receivingLong: 3, targets: 8, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 1,
          receivingAvg: 1.3, totalYards: 4, totalTd: 0
        } },
      { week: 12, date: '2025-11-24', kickoff: '8:15pm',
        opponent: 'San Francisco 49ers', home: false, conference: false,
        result: { teamScore: 17, opponentScore: 6 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 25, receivingYac: 6,
          receivingTd: 0, receivingLong: 11, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 6.3, totalYards: 25, totalTd: 0
        } },
      { week: 13, date: '2025-11-30', kickoff: '1:00pm',
        opponent: 'Los Angeles Rams', home: true, conference: false,
        result: { teamScore: 31, opponentScore: 10 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 19, receivingYac: 4,
          receivingTd: 0, receivingLong: 13, targets: 5, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 4.8, totalYards: 19, totalTd: 0
        } },
      { week: 14, date: '2025-12-07', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week: 15, date: '2025-12-14', kickoff: '4:25pm',
        opponent: 'New Orleans Saints', home: false, conference: false, division: true,
        result: { teamScore: 30, opponentScore: 6 }, booster: null,
        stats: {
          receptions: 6, receivingYards: 30, receivingYac: 17,
          receivingTd: 0, receivingLong: 8, targets: 8, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 5, totalYards: 30, totalTd: 0
        } },
      { week: 16, date: '2025-12-21', kickoff: '1:00pm',
        opponent: 'Tampa Bay Buccaneers', home: true, conference: false, division: true,
        result: { teamScore: 33, opponentScore: 16 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 58, receivingYac: 10,
          receivingTd: 0, receivingLong: 22, targets: 7, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 11.6, totalYards: 58, totalTd: 0
        } },
      { week: 17, date: '2025-12-28', kickoff: '1:00pm',
        opponent: 'Seattle Seahawks', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week: 18, date: '2026-01-03', kickoff: '4:30pm',
        opponent: 'Tampa Bay Buccaneers', home: false, conference: false, division: true,
        result: null, booster: null, stats: null },
    ],

    /* Cooper Clark — Chicago Bears */
    'cooper-clark': [
      { week:  1, date: '2025-09-08', kickoff: '7:15pm',
        opponent: 'Minnesota Vikings', home: true, conference: false, division: true,
        result: { teamScore: 37, opponentScore: 7 }, booster: null,
        stats: {
          carries: 13, rushingYards: 130, rushingTd: 2, rushingLong: 34,
          receptions: 6, receivingYards: 49, receivingYac: 23,
          receivingTd: 0, receivingLong: 13, targets: 6, fumbles: 0,
          rushingAvg: 10, receivingAvg: 8.2, totalYards: 179, totalTd: 2
        },
        bigPlays: [
          '23 yard rushing touchdown',
          '2 yard rushing touchdown'
        ] },
      { week:  2, date: '2025-09-14', kickoff: '12:00pm',
        opponent: 'Detroit Lions', home: false, conference: false, division: true, overtime: true,
        result: { teamScore: 10, opponentScore: 16 }, booster: null,
        stats: {
          carries: 6, rushingYards: 20, rushingTd: 0, rushingLong: 6,
          receptions: 3, receivingYards: 26, receivingYac: 15,
          receivingTd: 1, receivingLong: 13, targets: 5, fumbles: 0,
          rushingAvg: 3.3, receivingAvg: 8.7, totalYards: 46, totalTd: 1
        },
        bigPlays: [
          '4 yard receiving touchdown'
        ] },
      { week:  3, date: '2025-09-21', kickoff: '3:25pm',
        opponent: 'Dallas Cowboys', home: true, conference: false,
        result: { teamScore: 20, opponentScore: 27 }, booster: null,
        stats: {
          carries: 12, rushingYards: 52, rushingTd: 0, rushingLong: 14,
          receptions: 1, receivingYards: 11, receivingYac: 8,
          receivingTd: 0, receivingLong: 11, targets: 1, fumbles: 0,
          rushingAvg: 4.3, receivingAvg: 11, totalYards: 63, totalTd: 0
        } },
      { week:  4, date: '2025-09-28', kickoff: '3:25pm',
        opponent: 'Las Vegas Raiders', home: false, conference: false,
        result: { teamScore: 31, opponentScore: 26 }, booster: null,
        stats: {
          carries: 11, rushingYards: 36, rushingTd: 0, rushingLong: 12,
          receptions: 4, receivingYards: 31, receivingYac: 19,
          receivingTd: 1, receivingLong: 12, targets: 4, fumbles: 0,
          rushingAvg: 3.3, receivingAvg: 7.8, totalYards: 67, totalTd: 1
        },
        bigPlays: [
          '12 yard receiving touchdown'
        ] },
      { week:  5, date: '2025-10-05', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week:  6, date: '2025-10-13', kickoff: '7:15pm',
        opponent: 'Washington Commanders', home: false, conference: false,
        result: { teamScore: 24, opponentScore: 6 }, booster: null,
        stats: {
          carries: 14, rushingYards: 110, rushingTd: 1, rushingLong: 62,
          receptions: 3, receivingYards: 10, receivingYac: 3,
          receivingTd: 1, receivingLong: 7, targets: 4, fumbles: 0,
          rushingAvg: 7.9, receivingAvg: 3.3, totalYards: 120, totalTd: 2
        },
        bigPlays: [
          '7 yard receiving touchdown',
          '62 yard rushing touchdown'
        ] },
      { week:  7, date: '2025-10-19', kickoff: '12:00pm',
        opponent: 'New Orleans Saints', home: true, conference: false,
        result: { teamScore: 36, opponentScore: 18 }, booster: null,
        stats: {
          carries: 21, rushingYards: 121, rushingTd: 1, rushingLong: 21,
          receptions: 2, receivingYards: 11, receivingYac: 4,
          receivingTd: 0, receivingLong: 7, targets: 8, fumbles: 1,
          rushingAvg: 5.8, receivingAvg: 5.5, totalYards: 132, totalTd: 1
        },
        bigPlays: [
          '4 yard rushing touchdown'
        ] },
      { week:  8, date: '2025-10-26', kickoff: '12:00pm',
        opponent: 'Baltimore Ravens', home: false, conference: false,
        result: { teamScore: 10, opponentScore: 23 }, booster: null,
        stats: {
          carries: 13, rushingYards: 51, rushingTd: 1, rushingLong: 15,
          receptions: 2, receivingYards: 12, receivingYac: 12,
          receivingTd: 0, receivingLong: 9, targets: 4, fumbles: 0,
          rushingAvg: 3.9, receivingAvg: 6, totalYards: 63, totalTd: 1
        },
        bigPlays: [
          '1 yard rushing touchdown'
        ] },
      { week:  9, date: '2025-11-02', kickoff: '12:00pm',
        opponent: 'Cincinnati Bengals', home: false, conference: false,
        result: { teamScore: 19, opponentScore: 30 }, booster: null,
        stats: {
          carries: 14, rushingYards: 72, rushingTd: 0, rushingLong: 29,
          receptions: 2, receivingYards: 32, receivingYac: 8,
          receivingTd: 0, receivingLong: 19, targets: 3, fumbles: 0,
          rushingAvg: 5.1, receivingAvg: 16, totalYards: 104, totalTd: 0
        } },
      { week: 10, date: '2025-11-09', kickoff: '12:00pm',
        opponent: 'New York Giants', home: true, conference: false,
        result: { teamScore: 25, opponentScore: 15 }, booster: null,
        stats: {
          carries: 16, rushingYards: 75, rushingTd: 1, rushingLong: 19,
          receptions: 5, receivingYards: 63, receivingYac: 61,
          receivingTd: 0, receivingLong: 45, targets: 5, fumbles: 0,
          rushingAvg: 4.7, receivingAvg: 12.6, totalYards: 138, totalTd: 1
        },
        bigPlays: [
          '1 yard rushing touchdown'
        ] },
      { week: 11, date: '2025-11-16', kickoff: '12:00pm',
        opponent: 'Minnesota Vikings', home: false, conference: false, division: true,
        result: { teamScore: 10, opponentScore: 29 }, booster: null,
        stats: {
          carries: 16, rushingYards: 91, rushingTd: 0, rushingLong: 25,
          receptions: 2, receivingYards: 11, receivingYac: 9,
          receivingTd: 0, receivingLong: 11, targets: 4, fumbles: 1,
          rushingAvg: 5.7, receivingAvg: 5.5, totalYards: 102, totalTd: 0
        } },
      { week: 12, date: '2025-11-23', kickoff: '12:00pm',
        opponent: 'Pittsburgh Steelers', home: true, conference: false,
        result: { teamScore: 10, opponentScore: 32 }, booster: null,
        stats: {
          carries: 16, rushingYards: 89, rushingTd: 0, rushingLong: 21,
          receptions: 4, receivingYards: 23, receivingYac: 21,
          receivingTd: 0, receivingLong: 16, targets: 7, fumbles: 0,
          rushingAvg: 5.6, receivingAvg: 5.8, totalYards: 112, totalTd: 0
        } },
      { week: 13, date: '2025-11-28', kickoff: '2:00pm',
        opponent: 'Philadelphia Eagles', home: false, conference: false,
        result: { teamScore: 14, opponentScore: 27 }, booster: null,
        stats: {
          carries: 17, rushingYards: 76, rushingTd: 1, rushingLong: 37,
          receptions: 5, receivingYards: 52, receivingYac: 24,
          receivingTd: 0, receivingLong: 22, targets: 5, fumbles: 0,
          rushingAvg: 4.5, receivingAvg: 10.4, totalYards: 128, totalTd: 1
        },
        bigPlays: [
          '37 yard rushing touchdown'
        ] },
      { week: 14, date: '2025-12-07', kickoff: '3:25pm',
        opponent: 'Green Bay Packers', home: false, conference: false, division: true,
        result: { teamScore: 15, opponentScore: 16 }, booster: null,
        stats: {
          carries: 19, rushingYards: 90, rushingTd: 0, rushingLong: 24,
          receptions: 4, receivingYards: 37, receivingYac: 23,
          receivingTd: 0, receivingLong: 24, targets: 6, fumbles: 0,
          rushingAvg: 4.7, receivingAvg: 9.3, totalYards: 127, totalTd: 0
        } },
      { week: 15, date: '2025-12-14', kickoff: '12:00pm',
        opponent: 'Cleveland Browns', home: true, conference: false,
        result: { teamScore: 23, opponentScore: 3 }, booster: null,
        stats: {
          carries: 7, rushingYards: 26, rushingTd: 0, rushingLong: 7,
          receptions: 7, receivingYards: 70, receivingYac: 37,
          receivingTd: 0, receivingLong: 23, targets: 9, fumbles: 0,
          rushingAvg: 3.7, receivingAvg: 10, totalYards: 96, totalTd: 0
        } },
      { week: 16, date: '2025-12-20', kickoff: '7:20pm',
        opponent: 'Green Bay Packers', home: true, conference: false, division: true,
        result: { teamScore: 23, opponentScore: 7 }, booster: null,
        stats: {
          carries: 17, rushingYards: 81, rushingTd: 0, rushingLong: 33,
          receptions: 4, receivingYards: 60, receivingYac: 39,
          receivingTd: 0, receivingLong: 26, targets: 4, fumbles: 0,
          rushingAvg: 4.8, receivingAvg: 15, totalYards: 141, totalTd: 0
        } },
      { week: 17, date: '2025-12-28', kickoff: '7:20pm',
        opponent: 'San Francisco 49ers', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week: 18, date: '2026-01-04', kickoff: '3:25pm',
        opponent: 'Detroit Lions', home: true, conference: false, division: true,
        result: null, booster: null, stats: null },
    ],

    /* Paxon Hatch — New York Giants */
    'paxon-hatch': [
      { week:  1, date: '2025-09-07', kickoff: '1:00pm',
        opponent: 'Washington Commanders', home: false, conference: false, division: true,
        result: { teamScore: 30, opponentScore: 10 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 23, receivingYac: 7,
          receivingTd: 0, receivingLong: 18, targets: 8, carries: 3,
          rushingYards: 9, rushingTd: 0, rushingLong: 5, fumbles: 0,
          rushingAvg: 3, receivingAvg: 5.8, totalYards: 32, totalTd: 0
        } },
      { week:  2, date: '2025-09-14', kickoff: '1:00pm',
        opponent: 'Dallas Cowboys', home: false, conference: false, division: true, overtime: true,
        result: { teamScore: 29, opponentScore: 35 }, booster: null,
        stats: {
          receptions: 7, receivingYards: 186, receivingYac: 93,
          receivingTd: 1, receivingLong: 66, targets: 12, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 26.6, totalYards: 186, totalTd: 1
        },
        bigPlays: [
          '1 yard receiving touchdown'
        ] },
      { week:  3, date: '2025-09-21', kickoff: '8:20pm',
        opponent: 'Kansas City Chiefs', home: true, conference: false, overtime: true,
        result: { teamScore: 27, opponentScore: 24 }, booster: null,
        stats: {
          receptions: 13, receivingYards: 170, receivingYac: 52,
          receivingTd: 1, receivingLong: 21, targets: 16, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 13.1, totalYards: 170, totalTd: 1
        },
        bigPlays: [
          '9 yard receiving touchdown'
        ] },
      { week:  4, date: '2025-09-28', kickoff: '1:00pm',
        opponent: 'Los Angeles Chargers', home: true, conference: false,
        result: { teamScore: 16, opponentScore: 22 }, booster: null,
        stats: {
          receptions: 8, receivingYards: 147, receivingYac: 33,
          receivingTd: 0, receivingLong: 29, targets: 10, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 18.4, totalYards: 147, totalTd: 0
        } },
      { week:  5, date: '2025-10-05', kickoff: '1:00pm',
        opponent: 'New Orleans Saints', home: false, conference: false,
        result: { teamScore: 23, opponentScore: 13 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 60, receivingYac: 24,
          receivingTd: 0, receivingLong: 23, targets: 7, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 15, totalYards: 60, totalTd: 0
        } },
      { week:  6, date: '2025-10-09', kickoff: '8:15pm',
        opponent: 'Philadelphia Eagles', home: true, conference: false, division: true,
        result: { teamScore: 16, opponentScore: 20 }, booster: null,
        stats: {
          receptions: 2, receivingYards: 49, receivingYac: 10,
          receivingTd: 0, receivingLong: 31, targets: 7, carries: 1,
          rushingYards: 0, rushingTd: 0, rushingLong: 8, fumbles: 0,
          rushingAvg: 0, receivingAvg: 24.5, totalYards: 49, totalTd: 0
        } },
      { week:  7, date: '2025-10-19', kickoff: '4:05pm',
        opponent: 'Denver Broncos', home: false, conference: false,
        result: { teamScore: 17, opponentScore: 9 }, booster: null,
        stats: {
          receptions: 2, receivingYards: 5, receivingYac: 5,
          receivingTd: 0, receivingLong: 4, targets: 5, carries: 2,
          rushingYards: 12, rushingTd: 0, rushingLong: 6, fumbles: 0,
          rushingAvg: 6, receivingAvg: 2.5, totalYards: 17, totalTd: 0
        } },
      { week:  8, date: '2025-10-26', kickoff: '1:00pm',
        opponent: 'Philadelphia Eagles', home: false, conference: false, division: true,
        result: { teamScore: 3, opponentScore: 41 }, booster: null,
        stats: {
          receptions: 2, receivingYards: 34, receivingYac: 15,
          receivingTd: 0, receivingLong: 18, targets: 4, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 17, totalYards: 34, totalTd: 0
        } },
      { week:  9, date: '2025-11-02', kickoff: '1:00pm',
        opponent: 'San Francisco 49ers', home: true, conference: false,
        result: { teamScore: 32, opponentScore: 7 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 72, receivingYac: 42,
          receivingTd: 0, receivingLong: 34, targets: 5, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 18, totalYards: 72, totalTd: 0
        } },
      { week: 10, date: '2025-11-09', kickoff: '1:00pm',
        opponent: 'Chicago Bears', home: false, conference: false,
        result: { teamScore: 15, opponentScore: 25 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 55, receivingYac: 10,
          receivingTd: 0, receivingLong: 25, targets: 5, carries: 1,
          rushingYards: 6, rushingTd: 0, rushingLong: 6, fumbles: 0,
          rushingAvg: 6, receivingAvg: 13.8, totalYards: 61, totalTd: 0
        } },
      { week: 11, date: '2025-11-16', kickoff: '1:00pm',
        opponent: 'Green Bay Packers', home: true, conference: false,
        result: { teamScore: 16, opponentScore: 6 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 57, receivingYac: 9,
          receivingTd: 0, receivingLong: 20, targets: 10, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 11.4, totalYards: 57, totalTd: 0
        } },
      { week: 12, date: '2025-11-23', kickoff: '1:00pm',
        opponent: 'Detroit Lions', home: false, conference: false,
        result: { teamScore: 24, opponentScore: 19 }, booster: null,
        stats: {
          receptions: 9, receivingYards: 133, receivingYac: 52,
          receivingTd: 0, receivingLong: 27, targets: 12, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 14.8, totalYards: 133, totalTd: 0
        } },
      { week: 13, date: '2025-12-01', kickoff: '8:15pm',
        opponent: 'New England Patriots', home: false, conference: false,
        result: { teamScore: 34, opponentScore: 9 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 59, receivingYac: 37,
          receivingTd: 0, receivingLong: 29, targets: 5, carries: 1,
          rushingYards: 5, rushingTd: 0, rushingLong: 5, fumbles: 0,
          rushingAvg: 5, receivingAvg: 11.8, totalYards: 64, totalTd: 0
        } },
      { week: 14, date: '2025-12-07', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week: 15, date: '2025-12-14', kickoff: '1:00pm',
        opponent: 'Washington Commanders', home: true, conference: false, division: true,
        result: { teamScore: 29, opponentScore: 0 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 59, receivingYac: 10,
          receivingTd: 1, receivingLong: 34, targets: 7, carries: 1,
          rushingYards: 6, rushingTd: 0, rushingLong: 6, fumbles: 0,
          rushingAvg: 6, receivingAvg: 11.8, totalYards: 65, totalTd: 1
        },
        bigPlays: [
          '7 yard receiving touchdown'
        ] },
      { week: 16, date: '2025-12-21', kickoff: '1:00pm',
        opponent: 'Minnesota Vikings', home: true, conference: false,
        result: { teamScore: 27, opponentScore: 22 }, booster: null,
        stats: {
          receptions: 13, receivingYards: 244, receivingYac: 107,
          receivingTd: 3, receivingLong: 88, targets: 13, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 18.8, totalYards: 244, totalTd: 3
        },
        bigPlays: [
          '88 yard receiving touchdown',
          '12 yard receiving touchdown',
          '4 yard receiving touchdown'
        ] },
      { week: 17, date: '2025-12-28', kickoff: '4:05pm',
        opponent: 'Las Vegas Raiders', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week: 18, date: '2026-01-04', kickoff: '1:00pm',
        opponent: 'Dallas Cowboys', home: true, conference: false, division: true,
        result: null, booster: null, stats: null },
    ],

    /* Isaac Vitel — Tampa Bay Buccaneers */
    'isaac-vitel': [
      { week:  1, date: '2025-09-07', kickoff: '1:00pm',
        opponent: 'Atlanta Falcons', home: false, conference: false, division: true,
        result: { teamScore: 10, opponentScore: 43 }, booster: null,
        stats: {
          completions: 13, attempts: 27, passingYards: 169,
          passingYac: 31, passingTd: 1, interceptions: 1, carries: 1,
          rushingYards: -1, rushingTd: 0, rushingLong: 0, sacks: 5,
          fumbles: 0, passingAvg: 13, rating: 65.2, rushingAvg: -1
        },
        bigPlays: [
          '21 yard passing touchdown'
        ] },
      { week:  2, date: '2025-09-15', kickoff: '7:00pm',
        opponent: 'Houston Texans', home: false, conference: false,
        result: { teamScore: 13, opponentScore: 27 }, booster: null,
        stats: {
          completions: 26, attempts: 39, passingYards: 234,
          passingYac: 83, passingTd: 1, interceptions: 0, carries: 1,
          rushingYards: 4, rushingTd: 0, rushingLong: 4, sacks: 6,
          fumbles: 1, passingAvg: 9, rating: 91.2, rushingAvg: 4
        },
        bigPlays: [
          '4 yard passing touchdown'
        ] },
      { week:  3, date: '2025-09-21', kickoff: '1:00pm',
        opponent: 'New York Jets', home: true, conference: false,
        result: { teamScore: 27, opponentScore: 30 }, booster: null,
        stats: {
          completions: 28, attempts: 48, passingYards: 347,
          passingYac: 75, passingTd: 4, interceptions: 2, carries: 2,
          rushingYards: 5, rushingTd: 0, rushingLong: 4, sacks: 4,
          fumbles: 0, passingAvg: 12.4, rating: 91.2, rushingAvg: 2.5
        },
        bigPlays: [
          '5 yard passing touchdown',
          '15 yard passing touchdown',
          '7 yard passing touchdown',
          '51 yard passing touchdown'
        ] },
      { week:  4, date: '2025-09-28', kickoff: '1:00pm',
        opponent: 'Philadelphia Eagles', home: true, conference: false,
        result: { teamScore: 23, opponentScore: 24 }, booster: null,
        stats: {
          completions: 30, attempts: 42, passingYards: 354,
          passingYac: 127, passingTd: 1, interceptions: 1, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, sacks: 3,
          fumbles: 0, passingAvg: 11.8, rating: 94.7
        },
        bigPlays: [
          '5 yard passing touchdown'
        ] },
      { week:  5, date: '2025-10-05', kickoff: '4:05pm',
        opponent: 'Seattle Seahawks', home: false, conference: false,
        result: { teamScore: 17, opponentScore: 9 }, booster: null,
        stats: {
          completions: 18, attempts: 29, passingYards: 164,
          passingYac: 49, passingTd: 1, interceptions: 0, carries: 3,
          rushingYards: 6, rushingTd: 0, rushingLong: 8, sacks: 3,
          fumbles: 1, passingAvg: 9.1, rating: 88.9, rushingAvg: 2
        },
        bigPlays: [
          '7 yard passing touchdown'
        ] },
      { week:  6, date: '2025-10-12', kickoff: '4:25pm',
        opponent: 'San Francisco 49ers', home: true, conference: false,
        result: { teamScore: 38, opponentScore: 7 }, booster: null,
        stats: {
          completions: 24, attempts: 38, passingYards: 317,
          passingYac: 78, passingTd: 5, interceptions: 0, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, sacks: 3,
          fumbles: 1, passingAvg: 13.2, rating: 129.1
        },
        bigPlays: [
          '33 yard passing touchdown',
          '8 yard passing touchdown',
          '10 yard passing touchdown',
          '11 yard passing touchdown',
          '3 yard passing touchdown'
        ] },
      { week:  7, date: '2025-10-20', kickoff: '7:00pm',
        opponent: 'Detroit Lions', home: false, conference: false,
        result: { teamScore: 24, opponentScore: 17 }, booster: null,
        stats: {
          completions: 25, attempts: 37, passingYards: 252,
          passingYac: 93, passingTd: 3, interceptions: 2, carries: 2,
          rushingYards: -2, rushingTd: 0, rushingLong: 0, sacks: 0,
          fumbles: 0, passingAvg: 10.1, rating: 91.3, rushingAvg: -1
        },
        bigPlays: [
          '15 yard passing touchdown',
          '4 yard passing touchdown',
          '20 yard passing touchdown'
        ] },
      { week:  8, date: '2025-10-26', kickoff: '4:05pm',
        opponent: 'New Orleans Saints', home: false, conference: false, division: true,
        result: { teamScore: 16, opponentScore: 22 }, booster: null,
        stats: {
          completions: 18, attempts: 33, passingYards: 337,
          passingYac: 162, passingTd: 1, interceptions: 0, carries: 1,
          rushingYards: 2, rushingTd: 0, rushingLong: 0, sacks: 4,
          fumbles: 1, passingAvg: 18.7, rating: 100.2, rushingAvg: 2
        },
        bigPlays: [
          '38 yard passing touchdown'
        ] },
      { week:  9, date: '2025-11-02', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week: 10, date: '2025-11-09', kickoff: '1:00pm',
        opponent: 'New England Patriots', home: true, conference: false,
        result: { teamScore: 23, opponentScore: 16 }, booster: null,
        stats: {
          completions: 21, attempts: 37, passingYards: 282,
          passingYac: 75, passingTd: 2, interceptions: 2, carries: 1,
          rushingYards: 3, rushingTd: 0, rushingLong: 3, sacks: 4,
          fumbles: 0, passingAvg: 13.4, rating: 76.6, rushingAvg: 3
        },
        bigPlays: [
          '30 yard passing touchdown',
          '25 yard game-winning passing touchdown'
        ] },
      { week: 11, date: '2025-11-16', kickoff: '1:00pm',
        opponent: 'Buffalo Bills', home: false, conference: false,
        result: { teamScore: 0, opponentScore: 26 }, booster: null,
        stats: {
          completions: 5, attempts: 9, passingYards: 69, passingYac: 48,
          passingTd: 0, interceptions: 1, carries: 0, rushingYards: 0,
          rushingTd: 0, rushingLong: 0, sacks: 2, fumbles: 0,
          passingAvg: 13.8, rating: 40.7
        } },
      { week: 12, date: '2025-11-23', kickoff: '8:20pm',
        opponent: 'Los Angeles Rams', home: false, conference: false, injured: true, injury: 'Shoulder', health: 80,
        result: { teamScore: 0, opponentScore: 13 }, booster: null,
        stats: {
          completions: 0, attempts: 0, passingYards: 0, passingYac: 0,
          passingTd: 0, interceptions: 0, carries: 0, rushingYards: 0,
          rushingTd: 0, rushingLong: 0, sacks: 0, fumbles: 0
        } },
      { week: 13, date: '2025-11-30', kickoff: '1:00pm',
        opponent: 'Arizona Cardinals', home: true, conference: false,
        result: { teamScore: 10, opponentScore: 18 }, booster: null,
        stats: {
          completions: 27, attempts: 41, passingYards: 251,
          passingYac: 89, passingTd: 1, interceptions: 0, carries: 1,
          rushingYards: 4, rushingTd: 0, rushingLong: 4, sacks: 3,
          fumbles: 0, passingAvg: 9.3, rating: 90.6, rushingAvg: 4
        },
        bigPlays: [
          '7 yard passing touchdown'
        ] },
      { week: 14, date: '2025-12-07', kickoff: '1:00pm',
        opponent: 'New Orleans Saints', home: true, conference: false, division: true,
        result: { teamScore: 12, opponentScore: 20 }, booster: null,
        stats: {
          completions: 25, attempts: 40, passingYards: 267,
          passingYac: 99, passingTd: 1, interceptions: 0, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, sacks: 7,
          fumbles: 0, passingAvg: 10.7, rating: 90.3
        },
        bigPlays: [
          '1 yard passing touchdown'
        ] },
      { week: 15, date: '2025-12-11', kickoff: '8:15pm',
        opponent: 'Atlanta Falcons', home: true, conference: false, division: true,
        result: { teamScore: 13, opponentScore: 20 }, booster: null,
        stats: {
          completions: 19, attempts: 31, passingYards: 252,
          passingYac: 105, passingTd: 1, interceptions: 0, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, sacks: 5,
          fumbles: 1, passingAvg: 13.3, rating: 97.8
        },
        bigPlays: [
          '13 yard passing touchdown'
        ] },
      { week: 16, date: '2025-12-21', kickoff: '1:00pm',
        opponent: 'Carolina Panthers', home: false, conference: false, division: true,
        result: { teamScore: 16, opponentScore: 33 }, booster: null,
        stats: {
          completions: 25, attempts: 36, passingYards: 253,
          passingYac: 116, passingTd: 2, interceptions: 2, carries: 1,
          rushingYards: 8, rushingTd: 0, rushingLong: 8, sacks: 3,
          fumbles: 0, passingAvg: 10.1, rating: 84.6, rushingAvg: 8
        },
        bigPlays: [
          '17 yard passing touchdown',
          '1 yard passing touchdown'
        ] },
      { week: 17, date: '2025-12-28', kickoff: '1:00pm',
        opponent: 'Miami Dolphins', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week: 18, date: '2026-01-03', kickoff: '4:30pm',
        opponent: 'Carolina Panthers', home: true, conference: false, division: true,
        result: null, booster: null, stats: null },
    ],

    /* Sam Stogsdill — Seattle Seahawks, then Pittsburgh Steelers */
    'sam-stogsdill': [
      { week:  1, date: '2025-09-07', kickoff: '1:05pm',
        opponent: 'San Francisco 49ers', home: true, conference: false, division: true,
        result: { teamScore: 24, opponentScore: 13 }, booster: null,
        stats: {
          carries: 12, rushingYards: 70, rushingTd: 1, rushingLong: 46,
          receptions: 1, receivingYards: 13, receivingYac: 13,
          receivingTd: 0, receivingLong: 13, targets: 1, fumbles: 1,
          rushingAvg: 5.8, receivingAvg: 13, totalYards: 83, totalTd: 1
        },
        bigPlays: [
          '46 yard rushing touchdown'
        ] },
      { week:  2, date: '2025-09-14', kickoff: '10:00am',
        opponent: 'Pittsburgh Steelers', home: false, conference: false,
        result: { teamScore: 6, opponentScore: 12 }, booster: null,
        stats: {
          carries: 4, rushingYards: 13, rushingTd: 0, rushingLong: 14,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 0,
          rushingAvg: 3.3, totalYards: 13, totalTd: 0
        } },
      { week:  3, date: '2025-09-21', kickoff: '1:05pm',
        opponent: 'New Orleans Saints', home: true, conference: false,
        result: { teamScore: 14, opponentScore: 9 }, booster: null,
        stats: {
          carries: 3, rushingYards: -2, rushingTd: 0, rushingLong: 2,
          receptions: 3, receivingYards: 16, receivingYac: 8,
          receivingTd: 0, receivingLong: 11, targets: 3, fumbles: 0,
          rushingAvg: -0.7, receivingAvg: 5.3, totalYards: 14, totalTd: 0
        } },
      { week:  4, date: '2025-09-25', kickoff: '5:15pm',
        opponent: 'Arizona Cardinals', home: false, conference: false, division: true,
        result: { teamScore: 0, opponentScore: 16 }, booster: null,
        stats: {
          carries: 7, rushingYards: 9, rushingTd: 0, rushingLong: 11,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 0,
          rushingAvg: 1.3, totalYards: 9, totalTd: 0
        } },
      { week:  5, date: '2025-10-05', kickoff: '1:05pm',
        opponent: 'Tampa Bay Buccaneers', home: true, conference: false,
        result: { teamScore: 9, opponentScore: 17 }, booster: null,
        stats: {
          carries: 2, rushingYards: 13, rushingTd: 0, rushingLong: 13,
          receptions: 1, receivingYards: 5, receivingYac: 2,
          receivingTd: 0, receivingLong: 5, targets: 2, fumbles: 0,
          rushingAvg: 6.5, receivingAvg: 5, totalYards: 18, totalTd: 0
        } },
      { week:  6, date: '2025-10-12', kickoff: '1:00pm',
        opponent: 'Cleveland Browns', home: true, conference: false, division: true,
        result: { teamScore: 38, opponentScore: 13 }, booster: null,
        stats: {
          carries: 20, rushingYards: 97, rushingTd: 3, rushingLong: 20,
          receptions: 3, receivingYards: 19, receivingYac: 17,
          receivingTd: 0, receivingLong: 12, targets: 6, fumbles: 0,
          rushingAvg: 4.9, receivingAvg: 6.3, totalYards: 116, totalTd: 3
        },
        bigPlays: [
          '2 yard rushing touchdown',
          '2 yard rushing touchdown',
          '4 yard rushing touchdown'
        ] },
      { week:  7, date: '2025-10-16', kickoff: '8:15pm',
        opponent: 'Cincinnati Bengals', home: false, conference: false, division: true, overtime: true,
        result: { teamScore: 30, opponentScore: 33 }, booster: null,
        stats: {
          carries: 18, rushingYards: 100, rushingTd: 1, rushingLong: 20,
          receptions: 6, receivingYards: 65, receivingYac: 43,
          receivingTd: 1, receivingLong: 26, targets: 7, fumbles: 1,
          rushingAvg: 5.6, receivingAvg: 10.8, totalYards: 165, totalTd: 2
        },
        bigPlays: [
          '8 yard receiving touchdown',
          '5 yard rushing touchdown'
        ] },
      { week:  8, date: '2025-10-26', kickoff: '8:20pm',
        opponent: 'Green Bay Packers', home: true, conference: false,
        result: { teamScore: 26, opponentScore: 0 }, booster: null,
        stats: {
          carries: 21, rushingYards: 78, rushingTd: 0, rushingLong: 12,
          receptions: 2, receivingYards: 6, receivingYac: 1,
          receivingTd: 0, receivingLong: 6, targets: 4, fumbles: 0,
          rushingAvg: 3.7, receivingAvg: 3, totalYards: 84, totalTd: 0
        } },
      { week:  9, date: '2025-11-02', kickoff: '1:00pm',
        opponent: 'Indianapolis Colts', home: true, conference: false,
        result: { teamScore: 23, opponentScore: 33 }, booster: null,
        stats: {
          carries: 18, rushingYards: 100, rushingTd: 2, rushingLong: 37,
          receptions: 6, receivingYards: 62, receivingYac: 44,
          receivingTd: 0, receivingLong: 24, targets: 8, fumbles: 0,
          rushingAvg: 5.6, receivingAvg: 10.3, totalYards: 162, totalTd: 2
        },
        bigPlays: [
          '3 yard rushing touchdown',
          '1 yard rushing touchdown'
        ] },
      { week: 10, date: '2025-11-09', kickoff: '8:20pm',
        opponent: 'Los Angeles Chargers', home: false, conference: false, overtime: true,
        result: { teamScore: 22, opponentScore: 19 }, booster: null,
        stats: {
          carries: 24, rushingYards: 139, rushingTd: 0, rushingLong: 25,
          receptions: 1, receivingYards: 5, receivingYac: 1,
          receivingTd: 0, receivingLong: 5, targets: 3, fumbles: 0,
          rushingAvg: 5.8, receivingAvg: 5, totalYards: 144, totalTd: 0
        } },
      { week: 11, date: '2025-11-16', kickoff: '1:00pm',
        opponent: 'Cincinnati Bengals', home: true, conference: false, division: true,
        result: { teamScore: 32, opponentScore: 24 }, booster: null,
        stats: {
          carries: 23, rushingYards: 151, rushingTd: 1, rushingLong: 31,
          receptions: 6, receivingYards: 77, receivingYac: 39,
          receivingTd: 1, receivingLong: 19, targets: 10, fumbles: 0,
          rushingAvg: 6.6, receivingAvg: 12.8, totalYards: 228, totalTd: 2
        },
        bigPlays: [
          '19 yard game-winning receiving touchdown',
          '9 yard rushing touchdown'
        ] },
      { week: 12, date: '2025-11-23', kickoff: '1:00pm',
        opponent: 'Chicago Bears', home: false, conference: false,
        result: { teamScore: 32, opponentScore: 10 }, booster: null,
        stats: {
          carries: 13, rushingYards: 51, rushingTd: 2, rushingLong: 8,
          receptions: 2, receivingYards: 10, receivingYac: 8,
          receivingTd: 0, receivingLong: 8, targets: 5, fumbles: 0,
          rushingAvg: 3.9, receivingAvg: 5, totalYards: 61, totalTd: 2
        },
        bigPlays: [
          '3 yard rushing touchdown',
          '2 yard rushing touchdown'
        ] },
      { week: 13, date: '2025-11-30', kickoff: '4:25pm',
        opponent: 'Buffalo Bills', home: true, conference: false,
        result: { teamScore: 14, opponentScore: 15 }, booster: null,
        stats: {
          carries: 15, rushingYards: 71, rushingTd: 2, rushingLong: 20,
          receptions: 2, receivingYards: 15, receivingYac: 12,
          receivingTd: 0, receivingLong: 9, targets: 2, fumbles: 0,
          rushingAvg: 4.7, receivingAvg: 7.5, totalYards: 86, totalTd: 2
        },
        bigPlays: [
          '20 yard rushing touchdown',
          '5 yard rushing touchdown'
        ] },
      { week: 14, date: '2025-12-07', kickoff: '1:00pm',
        opponent: 'Baltimore Ravens', home: false, conference: false, division: true,
        result: { teamScore: 25, opponentScore: 22 }, booster: null,
        stats: {
          carries: 14, rushingYards: 87, rushingTd: 2, rushingLong: 23,
          receptions: 3, receivingYards: 18, receivingYac: 10,
          receivingTd: 1, receivingLong: 9, targets: 4, fumbles: 0,
          rushingAvg: 6.2, receivingAvg: 6, totalYards: 105, totalTd: 3
        },
        bigPlays: [
          '1 yard rushing touchdown',
          '3 yard receiving touchdown',
          '23 yard rushing touchdown'
        ] },
      { week: 15, date: '2025-12-15', kickoff: '8:15pm',
        opponent: 'Miami Dolphins', home: true, conference: false,
        result: { teamScore: 17, opponentScore: 14 }, booster: null,
        stats: {
          carries: 29, rushingYards: 132, rushingTd: 0, rushingLong: 39,
          receptions: 5, receivingYards: 36, receivingYac: 15,
          receivingTd: 1, receivingLong: 17, targets: 10, fumbles: 0,
          rushingAvg: 4.6, receivingAvg: 7.2, totalYards: 168, totalTd: 1
        },
        bigPlays: [
          '1 yard receiving touchdown'
        ] },
      { week: 16, date: '2025-12-21', kickoff: '4:25pm',
        opponent: 'Detroit Lions', home: false, conference: false, overtime: true,
        result: { teamScore: 17, opponentScore: 23 }, booster: null,
        stats: {
          carries: 24, rushingYards: 145, rushingTd: 1, rushingLong: 30,
          receptions: 5, receivingYards: 35, receivingYac: 18,
          receivingTd: 0, receivingLong: 20, targets: 7, fumbles: 0,
          rushingAvg: 6, receivingAvg: 7, totalYards: 180, totalTd: 1
        },
        bigPlays: [
          '30 yard rushing touchdown'
        ] },
      { week: 17, date: '2025-12-28', kickoff: '1:00pm',
        opponent: 'Cleveland Browns', home: false, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week: 18, date: '2026-01-04', kickoff: '8:20pm',
        opponent: 'Baltimore Ravens', home: true, conference: false, division: true,
        result: null, booster: null, stats: null },
    ],

    /* Jaykeb Stewart — Houston Texans */
    'jaykeb-stewart': [
      { week:  1, date: '2025-09-07', kickoff: '3:25pm',
        opponent: 'Los Angeles Rams', home: false, conference: false,
        result: { teamScore: 44, opponentScore: 7 }, booster: null,
        stats: {
          completions: 25, attempts: 38, passingYards: 266,
          passingYac: 78, passingTd: 3, interceptions: 0, carries: 5,
          rushingYards: 4, rushingTd: 0, rushingLong: 5, sacks: 3,
          fumbles: 0, passingAvg: 10.6, rating: 112.4, rushingAvg: 0.8
        },
        bigPlays: [
          '4 yard passing touchdown',
          '7 yard passing touchdown',
          '13 yard passing touchdown'
        ] },
      { week:  2, date: '2025-09-15', kickoff: '6:00pm',
        opponent: 'Tampa Bay Buccaneers', home: true, conference: false,
        result: { teamScore: 27, opponentScore: 13 }, booster: null,
        stats: {
          completions: 20, attempts: 33, passingYards: 176,
          passingYac: 37, passingTd: 2, interceptions: 1, carries: 6,
          rushingYards: 5, rushingTd: 0, rushingLong: 3, sacks: 1,
          fumbles: 0, passingAvg: 8.8, rating: 82.4, rushingAvg: 0.8
        },
        bigPlays: [
          '6 yard passing touchdown',
          '19 yard passing touchdown'
        ] },
      { week:  3, date: '2025-09-21', kickoff: '12:00pm',
        opponent: 'Jacksonville Jaguars', home: false, conference: false, division: true,
        result: { teamScore: 7, opponentScore: 36 }, booster: null,
        stats: {
          completions: 22, attempts: 40, passingYards: 300,
          passingYac: 144, passingTd: 1, interceptions: 3, carries: 3,
          rushingYards: 5, rushingTd: 0, rushingLong: 3, sacks: 5,
          fumbles: 1, passingAvg: 13.6, rating: 56.3, rushingAvg: 1.7
        },
        bigPlays: [
          '39 yard passing touchdown'
        ] },
      { week:  4, date: '2025-09-28', kickoff: '12:00pm',
        opponent: 'Tennessee Titans', home: true, conference: false, division: true,
        result: { teamScore: 24, opponentScore: 9 }, booster: null,
        stats: {
          completions: 26, attempts: 36, passingYards: 251,
          passingYac: 119, passingTd: 2, interceptions: 0, carries: 2,
          rushingYards: 1, rushingTd: 1, rushingLong: 2, sacks: 1,
          fumbles: 0, passingAvg: 9.7, rating: 109.8, rushingAvg: 0.5
        },
        bigPlays: [
          '18 yard passing touchdown',
          '2 yard rushing touchdown',
          '10 yard passing touchdown'
        ] },
      { week:  5, date: '2025-10-05', kickoff: '12:00pm',
        opponent: 'Baltimore Ravens', home: false, conference: false,
        result: { teamScore: 3, opponentScore: 16 }, booster: null,
        stats: {
          completions: 19, attempts: 28, passingYards: 159,
          passingYac: 58, passingTd: 0, interceptions: 1, carries: 4,
          rushingYards: 12, rushingTd: 0, rushingLong: 6, sacks: 2,
          fumbles: 0, passingAvg: 8.4, rating: 67.4, rushingAvg: 3
        } },
      { week:  6, date: '2025-10-12', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week:  7, date: '2025-10-20', kickoff: '9:00pm',
        opponent: 'Seattle Seahawks', home: false, conference: false,
        result: { teamScore: 16, opponentScore: 10 }, booster: null,
        stats: {
          completions: 19, attempts: 32, passingYards: 179,
          passingYac: 49, passingTd: 1, interceptions: 1, carries: 4,
          rushingYards: 9, rushingTd: 0, rushingLong: 4, sacks: 4,
          fumbles: 0, passingAvg: 9.4, rating: 72.3, rushingAvg: 2.3
        },
        bigPlays: [
          '6 yard passing touchdown'
        ] },
      { week:  8, date: '2025-10-26', kickoff: '12:00pm',
        opponent: 'San Francisco 49ers', home: true, conference: false,
        result: { teamScore: 41, opponentScore: 14 }, booster: null,
        stats: {
          completions: 24, attempts: 35, passingYards: 216,
          passingYac: 75, passingTd: 3, interceptions: 0, carries: 7,
          rushingYards: 29, rushingTd: 1, rushingLong: 24, sacks: 1,
          fumbles: 0, passingAvg: 9, rating: 113.5, rushingAvg: 4.1
        },
        bigPlays: [
          '8 yard passing touchdown',
          '11 yard passing touchdown',
          '1 yard passing touchdown',
          '24 yard rushing touchdown'
        ] },
      { week:  9, date: '2025-11-02', kickoff: '12:00pm',
        opponent: 'Denver Broncos', home: true, conference: false,
        result: { teamScore: 21, opponentScore: 17 }, booster: null,
        stats: {
          completions: 27, attempts: 38, passingYards: 288,
          passingYac: 135, passingTd: 3, interceptions: 0, carries: 6,
          rushingYards: 25, rushingTd: 0, rushingLong: 7, sacks: 4,
          fumbles: 1, passingAvg: 10.7, rating: 119.2, rushingAvg: 4.2
        },
        bigPlays: [
          '4 yard passing touchdown',
          '17 yard passing touchdown',
          '4 yard game-winning passing touchdown'
        ] },
      { week: 10, date: '2025-11-09', kickoff: '12:00pm',
        opponent: 'Jacksonville Jaguars', home: true, conference: false, division: true,
        result: { teamScore: 7, opponentScore: 17 }, booster: null,
        stats: {
          completions: 24, attempts: 33, passingYards: 192,
          passingYac: 89, passingTd: 1, interceptions: 0, carries: 2,
          rushingYards: 19, rushingTd: 0, rushingLong: 17, sacks: 3,
          fumbles: 0, passingAvg: 8, rating: 97, rushingAvg: 9.5
        },
        bigPlays: [
          '14 yard passing touchdown'
        ] },
      { week: 11, date: '2025-11-16', kickoff: '12:00pm',
        opponent: 'Tennessee Titans', home: false, conference: false, division: true,
        result: { teamScore: 27, opponentScore: 14 }, booster: null,
        stats: {
          completions: 28, attempts: 43, passingYards: 235,
          passingYac: 90, passingTd: 2, interceptions: 3, carries: 7,
          rushingYards: 26, rushingTd: 0, rushingLong: 8, sacks: 2,
          fumbles: 1, passingAvg: 8.4, rating: 65.6, rushingAvg: 3.7
        },
        bigPlays: [
          '6 yard passing touchdown',
          '17 yard passing touchdown'
        ] },
      { week: 12, date: '2025-11-20', kickoff: '7:15pm',
        opponent: 'Buffalo Bills', home: true, conference: false, overtime: true,
        result: { teamScore: 31, opponentScore: 34 }, booster: null,
        stats: {
          completions: 30, attempts: 41, passingYards: 358,
          passingYac: 107, passingTd: 4, interceptions: 1, carries: 7,
          rushingYards: 26, rushingTd: 0, rushingLong: 11, sacks: 1,
          fumbles: 0, passingAvg: 11.9, rating: 121.8, rushingAvg: 3.7
        },
        bigPlays: [
          '2 yard passing touchdown',
          '1 yard passing touchdown',
          '12 yard passing touchdown',
          '27 yard passing touchdown'
        ] },
      { week: 13, date: '2025-11-30', kickoff: '12:00pm',
        opponent: 'Indianapolis Colts', home: false, conference: false, division: true,
        result: { teamScore: 17, opponentScore: 30 }, booster: null,
        stats: {
          completions: 26, attempts: 37, passingYards: 237,
          passingYac: 108, passingTd: 1, interceptions: 0, carries: 5,
          rushingYards: 27, rushingTd: 0, rushingLong: 10, sacks: 1,
          fumbles: 0, passingAvg: 9.1, rating: 96.3, rushingAvg: 5.4
        },
        bigPlays: [
          '16 yard passing touchdown'
        ] },
      { week: 14, date: '2025-12-07', kickoff: '7:20pm',
        opponent: 'Kansas City Chiefs', home: false, conference: false,
        result: { teamScore: 17, opponentScore: 22 }, booster: null,
        stats: {
          completions: 20, attempts: 26, passingYards: 256,
          passingYac: 75, passingTd: 1, interceptions: 0, carries: 3,
          rushingYards: 4, rushingTd: 0, rushingLong: 4, sacks: 4,
          fumbles: 0, passingAvg: 12.8, rating: 120, rushingAvg: 1.3
        },
        bigPlays: [
          '30 yard passing touchdown'
        ] },
      { week: 15, date: '2025-12-14', kickoff: '12:00pm',
        opponent: 'Arizona Cardinals', home: true, conference: false,
        result: { teamScore: 24, opponentScore: 14 }, booster: null,
        stats: {
          completions: 18, attempts: 26, passingYards: 177,
          passingYac: 54, passingTd: 1, interceptions: 1, carries: 8,
          rushingYards: 32, rushingTd: 0, rushingLong: 21, sacks: 1,
          fumbles: 0, passingAvg: 9.8, rating: 84.9, rushingAvg: 4
        },
        bigPlays: [
          '6 yard passing touchdown'
        ] },
      { week: 16, date: '2025-12-21', kickoff: '3:25pm',
        opponent: 'Las Vegas Raiders', home: true, conference: false,
        result: { teamScore: 45, opponentScore: 28 }, booster: null,
        stats: {
          completions: 20, attempts: 24, passingYards: 312,
          passingYac: 91, passingTd: 4, interceptions: 0, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, sacks: 3,
          fumbles: 0, passingAvg: 15.6, rating: 158.3
        },
        bigPlays: [
          '6 yard passing touchdown',
          '8 yard passing touchdown',
          '26 yard passing touchdown',
          '16 yard passing touchdown'
        ] },
      { week: 17, date: '2025-12-27', kickoff: '3:30pm',
        opponent: 'Los Angeles Chargers', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week: 18, date: '2026-01-04', kickoff: '12:00pm',
        opponent: 'Indianapolis Colts', home: true, conference: false, division: true,
        result: null, booster: null, stats: null },
    ],
  }
};
