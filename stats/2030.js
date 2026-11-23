/* ==========================================================================
   EGE Football — the 2030 season
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

EGE.stats[2030] = {
  season: 2030,
  level: 'NFL',

  /* Weeks the NFL Sim tab stored, written in here, and when each was
     saved: a stored week saved after this replaces the file's. */
  stored: {
    1: '2026-11-16T04:23:11.236Z',
    2: '2026-11-16T04:29:32.581Z',
    3: '2026-11-16T04:38:10.096Z',
    4: '2026-11-16T16:18:59.733Z',
    5: '2026-11-16T17:08:44.547Z',
    6: '2026-11-16T17:22:21.716Z',
    7: '2026-11-16T18:59:38.782Z',
    8: '2026-11-16T22:51:10.858Z',
    9: '2026-11-17T02:39:18.921Z',
    10: '2026-11-17T21:52:20.443Z',
    11: '2026-11-17T23:59:33.599Z',
    12: '2026-11-18T04:09:43.364Z',
    13: '2026-11-18T08:48:50.639Z',
    14: '2026-11-18T17:17:21.939Z',
    15: '2026-11-18T21:32:31.169Z',
    16: '2026-11-19T00:08:35.105Z',
    17: '2026-11-19T03:53:55.036Z',
    18: '2026-11-19T04:45:46.626Z',
    19: '2026-11-19T04:49:07.040Z',
    20: '2026-11-21T22:30:07.973Z',
    21: '2026-11-23T02:12:55.817Z',
    22: '2026-11-23T04:12:05.338Z'
  },

  /* The six traded in the NFL sim: from `week` on his games are the
     games of `to`, his team then, and the ones before it are as he
     played them. */
  trades: {
    'andrew-parr': [
      { week: 1, from: 'baltimore', to: 'newYorkJets' }
    ],
    'sam-stogsdill': [
      { week: 1, from: 'pittsburgh', to: 'arizona' }
    ]
  },

  games: {

    /* Andrew Parr — New York Jets */
    'andrew-parr': [
      { week:  1, date: '2030-09-08', kickoff: null,
        opponent: 'Cleveland Browns', home: true, conference: false,
        result: { teamScore: 24, opponentScore: 34 }, booster: 'boost-2-5',
        stats: {
          receptions: 4, receivingYards: 39, receivingYac: 5,
          receivingTd: 0, receivingLong: 16, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 9.8, totalYards: 39, totalTd: 0
        } },
      { week:  2, date: '2030-09-15', kickoff: null,
        opponent: 'Carolina Panthers', home: false, conference: false,
        result: { teamScore: 40, opponentScore: 24 }, booster: 'wager-for', line: -7.5,
        stats: {
          receptions: 6, receivingYards: 99, receivingYac: 38,
          receivingTd: 0, receivingLong: 31, targets: 8, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 16.5, totalYards: 99, totalTd: 0
        } },
      { week:  3, date: '2030-09-22', kickoff: null,
        opponent: 'Kansas City Chiefs', home: true, conference: false,
        result: { teamScore: 31, opponentScore: 3 }, booster: null,
        stats: {
          receptions: 6, receivingYards: 43, receivingYac: 10,
          receivingTd: 0, receivingLong: 14, targets: 7, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 7.2, totalYards: 43, totalTd: 0
        } },
      { week:  4, date: '2030-09-29', kickoff: null,
        opponent: 'Denver Broncos', home: true, conference: false, overtime: true,
        result: { teamScore: 34, opponentScore: 37 }, booster: 'boost-2-0',
        stats: {
          receptions: 14, receivingYards: 152, receivingYac: 100,
          receivingTd: 2, receivingLong: 31, targets: 19, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 10.9, totalYards: 152, totalTd: 2
        },
        bigPlays: [
          '14 yard receiving touchdown',
          '31 yard receiving touchdown'
        ] },
      { week:  5, date: '2030-10-06', kickoff: null,
        opponent: 'Miami Dolphins', home: true, conference: false, division: true,
        result: { teamScore: 20, opponentScore: 3 }, booster: 'boost-2-0',
        stats: {
          receptions: 7, receivingYards: 71, receivingYac: 28,
          receivingTd: 1, receivingLong: 33, targets: 8, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 10.1, totalYards: 71, totalTd: 1
        },
        bigPlays: [
          '3 yard receiving touchdown'
        ] },
      { week:  6, date: '2030-10-13', kickoff: null,
        opponent: 'Los Angeles Chargers', home: false, conference: false,
        result: { teamScore: 38, opponentScore: 20 }, booster: 'wager-for', line: -7.5,
        stats: {
          receptions: 3, receivingYards: 63, receivingYac: 2,
          receivingTd: 1, receivingLong: 41, targets: 3, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 21, totalYards: 63, totalTd: 1
        },
        bigPlays: [
          '8 yard receiving touchdown'
        ] },
      { week:  7, date: '2030-10-20', kickoff: null,
        opponent: 'Tampa Bay Buccaneers', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  8, date: '2030-10-27', kickoff: null,
        opponent: 'Miami Dolphins', home: false, conference: false, division: true,
        result: { teamScore: 24, opponentScore: 29 }, booster: 'boost-2-0',
        stats: {
          receptions: 6, receivingYards: 32, receivingYac: 7,
          receivingTd: 2, receivingLong: 12, targets: 7, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 5.3, totalYards: 32, totalTd: 2
        },
        bigPlays: [
          '6 yard receiving touchdown',
          '12 yard receiving touchdown'
        ] },
      { week:  9, date: '2030-11-03', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week: 10, date: '2030-11-10', kickoff: null,
        opponent: 'Buffalo Bills', home: true, conference: false, division: true,
        result: { teamScore: 34, opponentScore: 16 }, booster: null,
        stats: {
          receptions: 6, receivingYards: 52, receivingYac: 26,
          receivingTd: 0, receivingLong: 21, targets: 8, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 8.7, totalYards: 52, totalTd: 0
        } },
      { week: 11, date: '2030-11-17', kickoff: null,
        opponent: 'Las Vegas Raiders', home: false, conference: false,
        result: { teamScore: 35, opponentScore: 10 }, booster: null,
        stats: {
          receptions: 6, receivingYards: 34, receivingYac: 16,
          receivingTd: 1, receivingLong: 9, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 5.7, totalYards: 34, totalTd: 1
        },
        bigPlays: [
          '4 yard receiving touchdown'
        ] },
      { week: 12, date: '2030-11-24', kickoff: null,
        opponent: 'Philadelphia Eagles', home: false, conference: false,
        result: { teamScore: 29, opponentScore: 6 }, booster: null,
        stats: {
          receptions: 2, receivingYards: 10, receivingYac: 6,
          receivingTd: 0, receivingLong: 7, targets: 3, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 5, totalYards: 10, totalTd: 0
        } },
      { week: 13, date: '2030-12-01', kickoff: null,
        opponent: 'Atlanta Falcons', home: true, conference: false,
        result: { teamScore: 26, opponentScore: 13 }, booster: null,
        stats: {
          receptions: 10, receivingYards: 75, receivingYac: 35,
          receivingTd: 1, receivingLong: 19, targets: 13, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 7.5, totalYards: 75, totalTd: 1
        },
        bigPlays: [
          '5 yard receiving touchdown'
        ] },
      { week: 14, date: '2030-12-08', kickoff: null,
        opponent: 'Houston Texans', home: false, conference: false,
        result: { teamScore: 33, opponentScore: 10 }, booster: null,
        stats: {
          receptions: 6, receivingYards: 75, receivingYac: 45,
          receivingTd: 0, receivingLong: 25, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 12.5, totalYards: 75, totalTd: 0
        } },
      { week: 15, date: '2030-12-15', kickoff: null,
        opponent: 'New England Patriots', home: true, conference: false, division: true,
        result: { teamScore: 38, opponentScore: 31 }, booster: 'boost-2-5',
        stats: {
          receptions: 5, receivingYards: 42, receivingYac: 25,
          receivingTd: 0, receivingLong: 18, targets: 7, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 8.4, totalYards: 42, totalTd: 0
        } },
      { week: 16, date: '2030-12-22', kickoff: null,
        opponent: 'Buffalo Bills', home: false, conference: false, division: true,
        result: { teamScore: 42, opponentScore: 17 }, booster: null,
        stats: {
          receptions: 6, receivingYards: 35, receivingYac: 6,
          receivingTd: 3, receivingLong: 13, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 5.8, totalYards: 35, totalTd: 3
        },
        bigPlays: [
          '8 yard receiving touchdown',
          '9 yard receiving touchdown',
          '2 yard receiving touchdown'
        ] },
      { week: 17, date: '2030-12-29', kickoff: null,
        opponent: 'New Orleans Saints', home: false, conference: false,
        result: { teamScore: 41, opponentScore: 27 }, booster: null,
        stats: {
          receptions: 8, receivingYards: 82, receivingYac: 18,
          receivingTd: 0, receivingLong: 21, targets: 12, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 10.3, totalYards: 82, totalTd: 0
        } },
      { week: 18, date: '2031-01-05', kickoff: null,
        opponent: 'New England Patriots', home: false, conference: false, division: true,
        result: { teamScore: 32, opponentScore: 24 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 59, receivingYac: 16,
          receivingTd: 1, receivingLong: 20, targets: 7, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 11.8, totalYards: 59, totalTd: 1
        },
        bigPlays: [
          '10 yard receiving touchdown'
        ] },
      { week: 19, date: '2031-01-11', kickoff: null,
        name: 'AFC Wild Card',
        opponent: 'Los Angeles Chargers', home: true, conference: false, playoff: true,
        result: { teamScore: 53, opponentScore: 20 }, booster: null,
        stats: {
          receptions: 8, receivingYards: 81, receivingYac: 25,
          receivingTd: 1, receivingLong: 21, targets: 11, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 10.1, totalYards: 81, totalTd: 1
        },
        bigPlays: [
          '16 yard receiving touchdown'
        ] },
      { week: 20, date: '2031-01-18', kickoff: null,
        name: 'AFC Divisional Round',
        opponent: 'Houston Texans', home: false, conference: false, playoff: true,
        result: { teamScore: 20, opponentScore: 17 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 50, receivingYac: 17,
          receivingTd: 0, receivingLong: 19, targets: 7, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 10, totalYards: 50, totalTd: 0
        } },
      { week: 21, date: '2031-01-26', kickoff: null,
        name: 'AFC Championship',
        opponent: 'Las Vegas Raiders', home: false, conference: false, playoff: true,
        result: { teamScore: 10, opponentScore: 30 }, booster: null,
        stats: {
          receptions: 6, receivingYards: 68, receivingYac: 31,
          receivingTd: 0, receivingLong: 22, targets: 9, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 11.3, totalYards: 68, totalTd: 0
        } },
    ],

    /* Cooper Clark — Jacksonville Jaguars */
    'cooper-clark': [
      { week:  1, date: '2030-09-08', kickoff: null,
        opponent: 'Washington Commanders', home: false, conference: false,
        result: { teamScore: 18, opponentScore: 21 }, booster: null,
        stats: {
          carries: 15, rushingYards: 100, rushingTd: 0, rushingLong: 51,
          receptions: 8, receivingYards: 98, receivingYac: 66,
          receivingTd: 1, receivingLong: 22, targets: 9, fumbles: 0,
          rushingAvg: 6.7, receivingAvg: 12.3, totalYards: 198, totalTd: 1
        },
        bigPlays: [
          '2 yard receiving touchdown'
        ] },
      { week:  2, date: '2030-09-15', kickoff: null,
        opponent: 'Indianapolis Colts', home: true, conference: false, division: true,
        result: { teamScore: 19, opponentScore: 21 }, booster: null,
        stats: {
          carries: 15, rushingYards: 43, rushingTd: 0, rushingLong: 8,
          receptions: 8, receivingYards: 36, receivingYac: 27,
          receivingTd: 0, receivingLong: 14, targets: 10, fumbles: 0,
          rushingAvg: 2.9, receivingAvg: 4.5, totalYards: 79, totalTd: 0
        } },
      { week:  3, date: '2030-09-22', kickoff: null,
        opponent: 'Dallas Cowboys', home: false, conference: false,
        result: { teamScore: 30, opponentScore: 0 }, booster: null,
        stats: {
          carries: 23, rushingYards: 139, rushingTd: 1, rushingLong: 36,
          receptions: 6, receivingYards: 60, receivingYac: 55,
          receivingTd: 0, receivingLong: 17, targets: 8, fumbles: 0,
          rushingAvg: 6, receivingAvg: 10, totalYards: 199, totalTd: 1
        },
        bigPlays: [
          '1 yard rushing touchdown'
        ] },
      { week:  4, date: '2030-09-29', kickoff: null,
        opponent: 'Carolina Panthers', home: false, conference: false,
        result: { teamScore: 33, opponentScore: 31 }, booster: null,
        stats: {
          carries: 18, rushingYards: 85, rushingTd: 1, rushingLong: 19,
          receptions: 1, receivingYards: -1, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 2, fumbles: 0,
          rushingAvg: 4.7, receivingAvg: -1, totalYards: 84, totalTd: 1
        },
        bigPlays: [
          '5 yard rushing touchdown'
        ] },
      { week:  5, date: '2030-10-06', kickoff: null,
        opponent: 'Cleveland Browns', home: true, conference: false,
        result: { teamScore: 28, opponentScore: 31 }, booster: null,
        stats: {
          carries: 15, rushingYards: 52, rushingTd: 0, rushingLong: 16,
          receptions: 8, receivingYards: 72, receivingYac: 37,
          receivingTd: 0, receivingLong: 19, targets: 13, fumbles: 0,
          rushingAvg: 3.5, receivingAvg: 9, totalYards: 124, totalTd: 0
        } },
      { week:  6, date: '2030-10-13', kickoff: null,
        opponent: 'Pittsburgh Steelers', home: false, conference: false,
        result: { teamScore: 34, opponentScore: 27 }, booster: 'boost-1-5',
        stats: {
          carries: 13, rushingYards: 115, rushingTd: 1, rushingLong: 52,
          receptions: 4, receivingYards: 29, receivingYac: 24,
          receivingTd: 0, receivingLong: 13, targets: 6, fumbles: 0,
          rushingAvg: 8.8, receivingAvg: 7.3, totalYards: 144, totalTd: 1
        },
        bigPlays: [
          '3 yard rushing touchdown'
        ] },
      { week:  7, date: '2030-10-20', kickoff: null,
        opponent: 'New York Giants', home: true, conference: false,
        result: { teamScore: 47, opponentScore: 16 }, booster: 'boost-2-5',
        stats: {
          carries: 18, rushingYards: 111, rushingTd: 2, rushingLong: 31,
          receptions: 4, receivingYards: 42, receivingYac: 24,
          receivingTd: 1, receivingLong: 19, targets: 5, fumbles: 0,
          rushingAvg: 6.2, receivingAvg: 10.5, totalYards: 153, totalTd: 3
        },
        bigPlays: [
          '6 yard rushing touchdown',
          '9 yard receiving touchdown',
          '1 yard rushing touchdown'
        ] },
      { week:  8, date: '2030-10-27', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week:  9, date: '2030-11-03', kickoff: null,
        opponent: 'Tennessee Titans', home: false, conference: false, division: true,
        result: { teamScore: 36, opponentScore: 33 }, booster: null,
        stats: {
          carries: 20, rushingYards: 113, rushingTd: 2, rushingLong: 29,
          receptions: 6, receivingYards: 41, receivingYac: 20,
          receivingTd: 1, receivingLong: 16, targets: 6, fumbles: 0,
          rushingAvg: 5.7, receivingAvg: 6.8, totalYards: 154, totalTd: 3
        },
        bigPlays: [
          '2 yard rushing touchdown',
          '5 yard rushing touchdown',
          '11 yard receiving touchdown'
        ] },
      { week: 10, date: '2030-11-10', kickoff: null,
        opponent: 'Houston Texans', home: false, conference: false, division: true,
        result: { teamScore: 14, opponentScore: 51 }, booster: 'boost-2-0',
        stats: {
          carries: 11, rushingYards: 54, rushingTd: 1, rushingLong: 24,
          receptions: 7, receivingYards: 55, receivingYac: 39,
          receivingTd: 1, receivingLong: 17, targets: 9, fumbles: 0,
          rushingAvg: 4.9, receivingAvg: 7.9, totalYards: 109, totalTd: 2
        },
        bigPlays: [
          '24 yard rushing touchdown',
          '5 yard receiving touchdown'
        ] },
      { week: 11, date: '2030-11-17', kickoff: null,
        opponent: 'Houston Texans', home: true, conference: false, division: true,
        result: { teamScore: 37, opponentScore: 34 }, booster: 'boost-2-0',
        stats: {
          carries: 16, rushingYards: 75, rushingTd: 1, rushingLong: 13,
          receptions: 4, receivingYards: 43, receivingYac: 27,
          receivingTd: 1, receivingLong: 22, targets: 5, fumbles: 0,
          rushingAvg: 4.7, receivingAvg: 10.8, totalYards: 118, totalTd: 2
        },
        bigPlays: [
          '17 yard receiving touchdown',
          '5 yard rushing touchdown'
        ] },
      { week: 12, date: '2030-11-24', kickoff: null,
        opponent: 'Denver Broncos', home: true, conference: false,
        result: { teamScore: 17, opponentScore: 34 }, booster: null,
        stats: {
          carries: 10, rushingYards: 69, rushingTd: 0, rushingLong: 18,
          receptions: 2, receivingYards: 17, receivingYac: 8,
          receivingTd: 0, receivingLong: 12, targets: 4, fumbles: 0,
          rushingAvg: 6.9, receivingAvg: 8.5, totalYards: 86, totalTd: 0
        } },
      { week: 13, date: '2030-12-01', kickoff: null,
        opponent: 'Cincinnati Bengals', home: true, conference: false,
        result: { teamScore: 30, opponentScore: 16 }, booster: null,
        stats: {
          carries: 22, rushingYards: 70, rushingTd: 0, rushingLong: 8,
          receptions: 4, receivingYards: 85, receivingYac: 79,
          receivingTd: 0, receivingLong: 49, targets: 4, fumbles: 0,
          rushingAvg: 3.2, receivingAvg: 21.3, totalYards: 155, totalTd: 0
        } },
      { week: 14, date: '2030-12-08', kickoff: null,
        opponent: 'Philadelphia Eagles', home: true, conference: false,
        result: { teamScore: 31, opponentScore: 20 }, booster: null,
        stats: {
          carries: 11, rushingYards: 44, rushingTd: 1, rushingLong: 24,
          receptions: 1, receivingYards: 4, receivingYac: 3,
          receivingTd: 0, receivingLong: 4, targets: 2, fumbles: 0,
          rushingAvg: 4, receivingAvg: 4, totalYards: 48, totalTd: 1
        },
        bigPlays: [
          '1 yard rushing touchdown'
        ] },
      { week: 15, date: '2030-12-15', kickoff: null,
        opponent: 'New York Jets', home: false, conference: false,
        result: { teamScore: 31, opponentScore: 38 }, booster: 'boost-2-5',
        stats: {
          carries: 13, rushingYards: 152, rushingTd: 1, rushingLong: 58,
          receptions: 7, receivingYards: 104, receivingYac: 77,
          receivingTd: 1, receivingLong: 38, targets: 7, fumbles: 0,
          rushingAvg: 11.7, receivingAvg: 14.9, totalYards: 256,
          totalTd: 2
        },
        bigPlays: [
          '58 yard rushing touchdown',
          '38 yard receiving touchdown'
        ] },
      { week: 16, date: '2030-12-22', kickoff: null,
        opponent: 'Tennessee Titans', home: true, conference: false, division: true,
        result: { teamScore: 20, opponentScore: 40 }, booster: null,
        stats: {
          carries: 13, rushingYards: 119, rushingTd: 0, rushingLong: 55,
          receptions: 1, receivingYards: 13, receivingYac: 11,
          receivingTd: 0, receivingLong: 13, targets: 4, fumbles: 0,
          rushingAvg: 9.2, receivingAvg: 13, totalYards: 132, totalTd: 0
        } },
      { week: 17, date: '2030-12-29', kickoff: null,
        opponent: 'Indianapolis Colts', home: false, conference: false, division: true,
        result: { teamScore: 13, opponentScore: 26 }, booster: null,
        stats: {
          carries: 14, rushingYards: 77, rushingTd: 0, rushingLong: 9,
          receptions: 5, receivingYards: 61, receivingYac: 27,
          receivingTd: 0, receivingLong: 21, targets: 6, fumbles: 1,
          rushingAvg: 5.5, receivingAvg: 12.2, totalYards: 138, totalTd: 0
        } },
      { week: 18, date: '2031-01-05', kickoff: null,
        opponent: 'Baltimore Ravens', home: false, conference: false,
        result: { teamScore: 10, opponentScore: 13 }, booster: null,
        stats: {
          carries: 16, rushingYards: 73, rushingTd: 0, rushingLong: 17,
          receptions: 4, receivingYards: 37, receivingYac: 24,
          receivingTd: 0, receivingLong: 18, targets: 5, fumbles: 1,
          rushingAvg: 4.6, receivingAvg: 9.3, totalYards: 110, totalTd: 0
        } },
    ],

    /* Paxon Hatch — New York Giants */
    'paxon-hatch': [
      { week:  1, date: '2030-09-08', kickoff: null,
        opponent: 'Miami Dolphins', home: true, conference: false, overtime: true,
        result: { teamScore: 24, opponentScore: 30 }, booster: null,
        stats: {
          receptions: 12, receivingYards: 241, receivingYac: 137,
          receivingTd: 2, receivingLong: 62, targets: 15, carries: 2,
          rushingYards: 9, rushingTd: 0, rushingLong: 5, fumbles: 0,
          rushingAvg: 4.5, receivingAvg: 20.1, totalYards: 250, totalTd: 2
        },
        bigPlays: [
          '10 yard receiving touchdown',
          '62 yard receiving touchdown'
        ] },
      { week:  2, date: '2030-09-15', kickoff: null,
        opponent: 'San Francisco 49ers', home: false, conference: false,
        result: { teamScore: 37, opponentScore: 15 }, booster: null,
        stats: {
          receptions: 8, receivingYards: 78, receivingYac: 34,
          receivingTd: 1, receivingLong: 22, targets: 9, carries: 1,
          rushingYards: -3, rushingTd: 0, rushingLong: 0, fumbles: 0,
          rushingAvg: -3, receivingAvg: 9.8, totalYards: 75, totalTd: 1
        },
        bigPlays: [
          '3 yard receiving touchdown'
        ] },
      { week:  3, date: '2030-09-22', kickoff: null,
        opponent: 'Indianapolis Colts', home: true, conference: false,
        result: { teamScore: 20, opponentScore: 19 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 75, receivingYac: 54,
          receivingTd: 1, receivingLong: 44, targets: 8, carries: 2,
          rushingYards: 7, rushingTd: 1, rushingLong: 4, fumbles: 0,
          rushingAvg: 3.5, receivingAvg: 15, totalYards: 82, totalTd: 2
        },
        bigPlays: [
          '3 yard rushing touchdown',
          '44 yard receiving touchdown'
        ] },
      { week:  4, date: '2030-09-29', kickoff: null,
        opponent: 'Philadelphia Eagles', home: true, conference: false, division: true,
        result: { teamScore: 13, opponentScore: 20 }, booster: null,
        stats: {
          receptions: 9, receivingYards: 109, receivingYac: 35,
          receivingTd: 1, receivingLong: 27, targets: 12, carries: 1,
          rushingYards: 4, rushingTd: 0, rushingLong: 4, fumbles: 0,
          rushingAvg: 4, receivingAvg: 12.1, totalYards: 113, totalTd: 1
        },
        bigPlays: [
          '1 yard receiving touchdown'
        ] },
      { week:  5, date: '2030-10-06', kickoff: null,
        opponent: 'Tennessee Titans', home: false, conference: false, hurt: { injury: 'Broken Collarbone', weeks: 9 },
        result: { teamScore: 42, opponentScore: 16 }, booster: 'boost-2-5',
        stats: {
          receptions: 8, receivingYards: 115, receivingYac: 63,
          receivingTd: 0, receivingLong: 24, targets: 14, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 14.4, totalYards: 115, totalTd: 0
        } },
      { week:  6, date: '2030-10-13', kickoff: null,
        opponent: 'Green Bay Packers', home: true, conference: false, injured: true, injury: 'Broken Collarbone', health: 80,
        result: { teamScore: 17, opponentScore: 24 }, booster: null,
        stats: {
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          totalYards: 0, totalTd: 0
        } },
      { week:  7, date: '2030-10-20', kickoff: null,
        opponent: 'Jacksonville Jaguars', home: false, conference: false, injured: true, injury: 'Broken Collarbone', health: 80,
        result: { teamScore: 16, opponentScore: 47 }, booster: null,
        stats: {
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          totalYards: 0, totalTd: 0
        } },
      { week:  8, date: '2030-10-27', kickoff: null,
        opponent: 'Arizona Cardinals', home: false, conference: false, injured: true, injury: 'Broken Collarbone', health: 80, overtime: true,
        result: { teamScore: 38, opponentScore: 44 }, booster: null,
        stats: {
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          totalYards: 0, totalTd: 0
        } },
      { week:  9, date: '2030-11-03', kickoff: null,
        opponent: 'Philadelphia Eagles', home: false, conference: false, division: true, injured: true, injury: 'Broken Collarbone', health: 80,
        result: { teamScore: 20, opponentScore: 24 }, booster: null,
        stats: {
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          totalYards: 0, totalTd: 0
        } },
      { week: 10, date: '2030-11-10', kickoff: null,
        opponent: 'New Orleans Saints', home: false, conference: false, injured: true, injury: 'Broken Collarbone', health: 80,
        result: { teamScore: 14, opponentScore: 39 }, booster: null,
        stats: {
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          totalYards: 0, totalTd: 0
        } },
      { week: 11, date: '2030-11-17', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week: 12, date: '2030-11-24', kickoff: null,
        opponent: 'Washington Commanders', home: false, conference: false, division: true, injured: true, injury: 'Broken Collarbone', health: 80,
        result: { teamScore: 22, opponentScore: 34 }, booster: null,
        stats: {
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          totalYards: 0, totalTd: 0
        } },
      { week: 13, date: '2030-12-01', kickoff: null,
        opponent: 'Houston Texans', home: true, conference: false, injured: true, injury: 'Broken Collarbone', health: 80,
        result: { teamScore: 27, opponentScore: 30 }, booster: null,
        stats: {
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          totalYards: 0, totalTd: 0
        } },
      { week: 14, date: '2030-12-08', kickoff: null,
        opponent: 'Washington Commanders', home: true, conference: false, division: true, injured: true, injury: 'Broken Collarbone', health: 80,
        result: { teamScore: 24, opponentScore: 14 }, booster: null,
        stats: {
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          totalYards: 0, totalTd: 0
        } },
      { week: 15, date: '2030-12-15', kickoff: null,
        opponent: 'Dallas Cowboys', home: false, conference: false, division: true,
        result: { teamScore: 28, opponentScore: 35 }, booster: 'boost-1-5',
        stats: {
          receptions: 13, receivingYards: 146, receivingYac: 74,
          receivingTd: 1, receivingLong: 31, targets: 13, carries: 1,
          rushingYards: 2, rushingTd: 0, rushingLong: 2, fumbles: 0,
          rushingAvg: 2, receivingAvg: 11.2, totalYards: 148, totalTd: 1
        },
        bigPlays: [
          '2 yard receiving touchdown'
        ] },
      { week: 16, date: '2030-12-22', kickoff: null,
        opponent: 'Seattle Seahawks', home: true, conference: false,
        result: { teamScore: 21, opponentScore: 20 }, booster: 'boost-1-5',
        stats: {
          receptions: 12, receivingYards: 193, receivingYac: 46,
          receivingTd: 0, receivingLong: 33, targets: 17, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 16.1, totalYards: 193, totalTd: 0
        } },
      { week: 17, date: '2030-12-29', kickoff: null,
        opponent: 'Dallas Cowboys', home: true, conference: false, division: true,
        result: { teamScore: 16, opponentScore: 40 }, booster: 'boost-1-5',
        stats: {
          receptions: 9, receivingYards: 83, receivingYac: 40,
          receivingTd: 1, receivingLong: 24, targets: 10, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 9.2, totalYards: 83, totalTd: 1
        },
        bigPlays: [
          '7 yard receiving touchdown'
        ] },
      { week: 18, date: '2031-01-05', kickoff: null,
        opponent: 'Los Angeles Rams', home: true, conference: false,
        result: { teamScore: 24, opponentScore: 28 }, booster: 'boost-1-5',
        stats: {
          receptions: 11, receivingYards: 120, receivingYac: 42,
          receivingTd: 2, receivingLong: 27, targets: 11, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 10.9, totalYards: 120, totalTd: 2
        },
        bigPlays: [
          '2 yard receiving touchdown',
          '25 yard receiving touchdown'
        ] },
    ],

    /* Isaac Vitel — New York Jets */
    'isaac-vitel': [
      { week:  1, date: '2030-09-08', kickoff: null,
        opponent: 'Denver Broncos', home: false, conference: false,
        result: { teamScore: 24, opponentScore: 34 }, booster: 'boost-1-5',
        stats: {
          completions: 24, attempts: 34, passingYards: 305,
          passingYac: 128, passingTd: 3, interceptions: 1, carries: 1,
          rushingYards: -1, rushingTd: 0, rushingLong: 0, sacks: 1,
          fumbles: 0, passingAvg: 12.7, rating: 115.4, rushingAvg: -1
        },
        bigPlays: [
          '6 yard passing touchdown',
          '19 yard passing touchdown',
          '6 yard passing touchdown'
        ] },
      { week:  2, date: '2030-09-15', kickoff: null,
        opponent: 'Buffalo Bills', home: false, conference: false, division: true,
        result: { teamScore: 40, opponentScore: 24 }, booster: 'boost-1-5',
        stats: {
          completions: 29, attempts: 36, passingYards: 342,
          passingYac: 133, passingTd: 2, interceptions: 0, carries: 2,
          rushingYards: -2, rushingTd: 0, rushingLong: 0, sacks: 1,
          fumbles: 0, passingAvg: 11.8, rating: 124.8, rushingAvg: -1
        },
        bigPlays: [
          '29 yard passing touchdown',
          '4 yard passing touchdown'
        ] },
      { week:  3, date: '2030-09-22', kickoff: null,
        opponent: 'New England Patriots', home: false, conference: false, division: true,
        result: { teamScore: 31, opponentScore: 3 }, booster: 'boost-1-5',
        stats: {
          completions: 26, attempts: 29, passingYards: 266,
          passingYac: 110, passingTd: 2, interceptions: 0, carries: 1,
          rushingYards: 2, rushingTd: 0, rushingLong: 2, sacks: 0,
          fumbles: 0, passingAvg: 10.2, rating: 127.9, rushingAvg: 2
        },
        bigPlays: [
          '19 yard passing touchdown',
          '6 yard passing touchdown'
        ] },
      { week:  4, date: '2030-09-29', kickoff: null,
        opponent: 'Las Vegas Raiders', home: true, conference: false, overtime: true,
        result: { teamScore: 34, opponentScore: 37 }, booster: null,
        stats: {
          completions: 42, attempts: 56, passingYards: 511,
          passingYac: 293, passingTd: 4, interceptions: 0, carries: 4,
          rushingYards: 14, rushingTd: 0, rushingLong: 8, sacks: 3,
          fumbles: 0, passingAvg: 12.2, rating: 126.4, rushingAvg: 3.5
        },
        bigPlays: [
          '14 yard passing touchdown',
          '31 yard passing touchdown',
          '23 yard passing touchdown',
          '5 yard passing touchdown'
        ] },
      { week:  5, date: '2030-10-06', kickoff: null,
        opponent: 'Cincinnati Bengals', home: false, conference: false,
        result: { teamScore: 20, opponentScore: 3 }, booster: null,
        stats: {
          completions: 26, attempts: 37, passingYards: 286,
          passingYac: 116, passingTd: 2, interceptions: 0, carries: 1,
          rushingYards: 5, rushingTd: 0, rushingLong: 5, sacks: 4,
          fumbles: 0, passingAvg: 11, rating: 110.9, rushingAvg: 5
        },
        bigPlays: [
          '3 yard passing touchdown',
          '3 yard passing touchdown'
        ] },
      { week:  6, date: '2030-10-13', kickoff: null,
        opponent: 'New Orleans Saints', home: true, conference: false,
        result: { teamScore: 38, opponentScore: 20 }, booster: null,
        stats: {
          completions: 18, attempts: 27, passingYards: 287,
          passingYac: 42, passingTd: 3, interceptions: 1, carries: 1,
          rushingYards: 1, rushingTd: 0, rushingLong: 1, sacks: 1,
          fumbles: 0, passingAvg: 15.9, rating: 123.5, rushingAvg: 1
        },
        bigPlays: [
          '18 yard passing touchdown',
          '24 yard passing touchdown',
          '8 yard passing touchdown'
        ] },
      { week:  7, date: '2030-10-20', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week:  8, date: '2030-10-27', kickoff: null,
        opponent: 'Los Angeles Chargers', home: true, conference: false,
        result: { teamScore: 24, opponentScore: 29 }, booster: null,
        stats: {
          completions: 29, attempts: 40, passingYards: 274,
          passingYac: 85, passingTd: 3, interceptions: 1, carries: 3,
          rushingYards: 13, rushingTd: 0, rushingLong: 6, sacks: 6,
          fumbles: 0, passingAvg: 9.4, rating: 105.6, rushingAvg: 4.3
        },
        bigPlays: [
          '6 yard passing touchdown',
          '12 yard passing touchdown',
          '10 yard passing touchdown'
        ] },
      { week:  9, date: '2030-11-03', kickoff: null,
        opponent: 'New England Patriots', home: true, conference: false, division: true,
        result: { teamScore: 29, opponentScore: 31 }, booster: null,
        stats: {
          completions: 21, attempts: 31, passingYards: 315,
          passingYac: 129, passingTd: 4, interceptions: 0, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, sacks: 1,
          fumbles: 0, passingAvg: 15, rating: 140.5
        },
        bigPlays: [
          '3 yard passing touchdown',
          '22 yard passing touchdown',
          '7 yard passing touchdown',
          '49 yard passing touchdown'
        ] },
      { week: 10, date: '2030-11-10', kickoff: null,
        opponent: 'Miami Dolphins', home: false, conference: false, division: true,
        result: { teamScore: 34, opponentScore: 16 }, booster: null,
        stats: {
          completions: 25, attempts: 34, passingYards: 271,
          passingYac: 122, passingTd: 2, interceptions: 0, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, sacks: 1,
          fumbles: 0, passingAvg: 10.8, rating: 116.2
        },
        bigPlays: [
          '10 yard passing touchdown',
          '21 yard passing touchdown'
        ] },
      { week: 11, date: '2030-11-17', kickoff: null,
        opponent: 'Buffalo Bills', home: true, conference: false, division: true,
        result: { teamScore: 35, opponentScore: 10 }, booster: null,
        stats: {
          completions: 29, attempts: 37, passingYards: 340,
          passingYac: 151, passingTd: 2, interceptions: 1, carries: 2,
          rushingYards: -2, rushingTd: 0, rushingLong: 0, sacks: 2,
          fumbles: 0, passingAvg: 11.7, rating: 111.7, rushingAvg: -1
        },
        bigPlays: [
          '4 yard passing touchdown',
          '28 yard passing touchdown'
        ] },
      { week: 12, date: '2030-11-24', kickoff: null,
        opponent: 'Atlanta Falcons', home: false, conference: false,
        result: { teamScore: 29, opponentScore: 6 }, booster: 'wager-for', line: -13.5,
        stats: {
          completions: 27, attempts: 36, passingYards: 304,
          passingYac: 155, passingTd: 2, interceptions: 0, carries: 5,
          rushingYards: 3, rushingTd: 0, rushingLong: 5, sacks: 3,
          fumbles: 0, passingAvg: 11.3, rating: 118.3, rushingAvg: 0.6
        },
        bigPlays: [
          '1 yard passing touchdown',
          '17 yard passing touchdown'
        ] },
      { week: 13, date: '2030-12-01', kickoff: null,
        opponent: 'Dallas Cowboys', home: false, conference: false,
        result: { teamScore: 26, opponentScore: 13 }, booster: null,
        stats: {
          completions: 27, attempts: 39, passingYards: 305,
          passingYac: 125, passingTd: 1, interceptions: 0, carries: 2,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, sacks: 1,
          fumbles: 0, passingAvg: 11.3, rating: 100.9, rushingAvg: 0
        },
        bigPlays: [
          '5 yard passing touchdown'
        ] },
      { week: 14, date: '2030-12-08', kickoff: null,
        opponent: 'Kansas City Chiefs', home: false, conference: false,
        result: { teamScore: 33, opponentScore: 10 }, booster: null,
        stats: {
          completions: 24, attempts: 30, passingYards: 356,
          passingYac: 129, passingTd: 3, interceptions: 0, carries: 1,
          rushingYards: -1, rushingTd: 0, rushingLong: 0, sacks: 0,
          fumbles: 0, passingAvg: 14.8, rating: 149.4, rushingAvg: -1
        },
        bigPlays: [
          '5 yard passing touchdown',
          '6 yard passing touchdown',
          '18 yard passing touchdown'
        ] },
      { week: 15, date: '2030-12-15', kickoff: null,
        opponent: 'Jacksonville Jaguars', home: true, conference: false,
        result: { teamScore: 38, opponentScore: 31 }, booster: 'boost-2-0',
        stats: {
          completions: 23, attempts: 31, passingYards: 356,
          passingYac: 135, passingTd: 5, interceptions: 1, carries: 4,
          rushingYards: -4, rushingTd: 0, rushingLong: 0, sacks: 2,
          fumbles: 0, passingAvg: 15.5, rating: 137.9, rushingAvg: -1
        },
        bigPlays: [
          '64 yard passing touchdown',
          '68 yard passing touchdown',
          '5 yard passing touchdown',
          '4 yard passing touchdown',
          '6 yard passing touchdown'
        ] },
      { week: 16, date: '2030-12-22', kickoff: null,
        opponent: 'Tampa Bay Buccaneers', home: true, conference: false,
        result: { teamScore: 42, opponentScore: 17 }, booster: 'boost-2-0',
        stats: {
          completions: 32, attempts: 41, passingYards: 307,
          passingYac: 118, passingTd: 3, interceptions: 0, carries: 6,
          rushingYards: 10, rushingTd: 0, rushingLong: 7, sacks: 0,
          fumbles: 0, passingAvg: 9.6, rating: 122.3, rushingAvg: 1.7
        },
        bigPlays: [
          '8 yard passing touchdown',
          '9 yard passing touchdown',
          '2 yard passing touchdown'
        ] },
      { week: 17, date: '2030-12-29', kickoff: null,
        opponent: 'Carolina Panthers', home: false, conference: false,
        result: { teamScore: 41, opponentScore: 27 }, booster: null,
        stats: {
          completions: 27, attempts: 39, passingYards: 340,
          passingYac: 79, passingTd: 4, interceptions: 0, carries: 2,
          rushingYards: -2, rushingTd: 0, rushingLong: 0, sacks: 1,
          fumbles: 0, passingAvg: 12.6, rating: 130.3, rushingAvg: -1
        },
        bigPlays: [
          '16 yard passing touchdown',
          '28 yard passing touchdown',
          '29 yard passing touchdown',
          '5 yard passing touchdown'
        ] },
      { week: 18, date: '2031-01-05', kickoff: null,
        opponent: 'Miami Dolphins', home: true, conference: false, division: true,
        result: { teamScore: 32, opponentScore: 24 }, booster: null,
        stats: {
          completions: 26, attempts: 31, passingYards: 202,
          passingYac: 63, passingTd: 3, interceptions: 0, carries: 4,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, sacks: 3,
          fumbles: 0, passingAvg: 7.8, rating: 126.1, rushingAvg: 0
        },
        bigPlays: [
          '5 yard passing touchdown',
          '7 yard passing touchdown',
          '10 yard passing touchdown'
        ] },
      { week: 19, date: '2031-01-11', kickoff: null,
        name: 'AFC Wild Card',
        opponent: 'Los Angeles Chargers', home: true, conference: false, playoff: true,
        result: { teamScore: 53, opponentScore: 20 }, booster: null,
        stats: {
          completions: 23, attempts: 36, passingYards: 324,
          passingYac: 141, passingTd: 2, interceptions: 0, carries: 4,
          rushingYards: -1, rushingTd: 0, rushingLong: 2, sacks: 2,
          fumbles: 0, passingAvg: 14.1, rating: 111.3, rushingAvg: -0.2
        },
        bigPlays: [
          '29 yard passing touchdown',
          '16 yard passing touchdown'
        ] },
      { week: 20, date: '2031-01-18', kickoff: null,
        name: 'AFC Divisional Round',
        opponent: 'Houston Texans', home: false, conference: false, playoff: true,
        result: { teamScore: 20, opponentScore: 17 }, booster: null,
        stats: {
          completions: 22, attempts: 34, passingYards: 310,
          passingYac: 87, passingTd: 2, interceptions: 1, carries: 4,
          rushingYards: -1, rushingTd: 0, rushingLong: 2, sacks: 2,
          fumbles: 0, passingAvg: 14.1, rating: 101.3, rushingAvg: -0.2
        },
        bigPlays: [
          '44 yard passing touchdown',
          '45 yard game-winning passing touchdown'
        ] },
      { week: 21, date: '2031-01-26', kickoff: null,
        name: 'AFC Championship',
        opponent: 'Las Vegas Raiders', home: false, conference: false, playoff: true,
        result: { teamScore: 10, opponentScore: 30 }, booster: null,
        stats: {
          completions: 20, attempts: 31, passingYards: 197,
          passingYac: 73, passingTd: 1, interceptions: 0, carries: 1,
          rushingYards: -1, rushingTd: 0, rushingLong: 0, sacks: 1,
          fumbles: 0, passingAvg: 9.9, rating: 93.1, rushingAvg: -1
        },
        bigPlays: [
          '14 yard passing touchdown'
        ] },
    ],

    /* Sam Stogsdill — Arizona Cardinals */
    'sam-stogsdill': [
      { week:  1, date: '2030-09-08', kickoff: null,
        opponent: 'Seattle Seahawks', home: true, conference: false, division: true, overtime: true,
        result: { teamScore: 28, opponentScore: 34 }, booster: null,
        stats: {
          carries: 13, rushingYards: 69, rushingTd: 1, rushingLong: 21,
          receptions: 4, receivingYards: 28, receivingYac: 5,
          receivingTd: 0, receivingLong: 14, targets: 6, fumbles: 0,
          rushingAvg: 5.3, receivingAvg: 7, totalYards: 97, totalTd: 1
        },
        bigPlays: [
          '2 yard rushing touchdown'
        ] },
      { week:  2, date: '2030-09-15', kickoff: null,
        opponent: 'Los Angeles Rams', home: false, conference: false, division: true,
        result: { teamScore: 12, opponentScore: 30 }, booster: null,
        stats: {
          carries: 13, rushingYards: 53, rushingTd: 0, rushingLong: 14,
          receptions: 7, receivingYards: 84, receivingYac: 63,
          receivingTd: 1, receivingLong: 23, targets: 9, fumbles: 0,
          rushingAvg: 4.1, receivingAvg: 12, totalYards: 137, totalTd: 1
        },
        bigPlays: [
          '22 yard receiving touchdown'
        ] },
      { week:  3, date: '2030-09-22', kickoff: null,
        opponent: 'Detroit Lions', home: true, conference: false,
        result: { teamScore: 20, opponentScore: 17 }, booster: 'boost-1-5',
        stats: {
          carries: 27, rushingYards: 92, rushingTd: 1, rushingLong: 15,
          receptions: 5, receivingYards: 45, receivingYac: 29,
          receivingTd: 0, receivingLong: 17, targets: 5, fumbles: 0,
          rushingAvg: 3.4, receivingAvg: 9, totalYards: 137, totalTd: 1
        },
        bigPlays: [
          '3 yard rushing touchdown'
        ] },
      { week:  4, date: '2030-09-29', kickoff: null,
        opponent: 'Carolina Panthers', home: false, conference: false,
        result: { teamScore: 13, opponentScore: 20 }, booster: null,
        stats: {
          carries: 22, rushingYards: 126, rushingTd: 0, rushingLong: 24,
          receptions: 3, receivingYards: 19, receivingYac: 11,
          receivingTd: 0, receivingLong: 12, targets: 4, fumbles: 1,
          rushingAvg: 5.7, receivingAvg: 6.3, totalYards: 145, totalTd: 0
        } },
      { week:  5, date: '2030-10-06', kickoff: null,
        opponent: 'New York Giants', home: false, conference: false,
        result: { teamScore: 16, opponentScore: 32 }, booster: null,
        stats: {
          carries: 11, rushingYards: 51, rushingTd: 0, rushingLong: 13,
          receptions: 6, receivingYards: 35, receivingYac: 18,
          receivingTd: 0, receivingLong: 11, targets: 6, fumbles: 0,
          rushingAvg: 4.6, receivingAvg: 5.8, totalYards: 86, totalTd: 0
        } },
      { week:  6, date: '2030-10-13', kickoff: null,
        opponent: 'Las Vegas Raiders', home: true, conference: false,
        result: { teamScore: 17, opponentScore: 23 }, booster: null,
        stats: {
          carries: 14, rushingYards: 54, rushingTd: 0, rushingLong: 17,
          receptions: 4, receivingYards: 15, receivingYac: 7,
          receivingTd: 0, receivingLong: 9, targets: 4, fumbles: 0,
          rushingAvg: 3.9, receivingAvg: 3.8, totalYards: 69, totalTd: 0
        } },
      { week:  7, date: '2030-10-20', kickoff: null,
        opponent: 'Dallas Cowboys', home: true, conference: false,
        result: { teamScore: 46, opponentScore: 10 }, booster: null,
        stats: {
          carries: 24, rushingYards: 190, rushingTd: 2, rushingLong: 35,
          receptions: 1, receivingYards: 13, receivingYac: 7,
          receivingTd: 1, receivingLong: 13, targets: 2, fumbles: 0,
          rushingAvg: 7.9, receivingAvg: 13, totalYards: 203, totalTd: 3
        },
        bigPlays: [
          '3 yard rushing touchdown',
          '6 yard rushing touchdown',
          '13 yard receiving touchdown'
        ] },
      { week:  8, date: '2030-10-27', kickoff: null,
        opponent: 'Washington Commanders', home: false, conference: false, overtime: true,
        result: { teamScore: 44, opponentScore: 38 }, booster: 'boost-2-0',
        stats: {
          carries: 22, rushingYards: 181, rushingTd: 1, rushingLong: 62,
          receptions: 4, receivingYards: 32, receivingYac: 21,
          receivingTd: 0, receivingLong: 12, targets: 4, fumbles: 0,
          rushingAvg: 8.2, receivingAvg: 8, totalYards: 213, totalTd: 1
        },
        bigPlays: [
          '62 yard rushing touchdown'
        ] },
      { week:  9, date: '2030-11-03', kickoff: null,
        opponent: 'Pittsburgh Steelers', home: true, conference: false,
        result: { teamScore: 20, opponentScore: 33 }, booster: null,
        stats: {
          carries: 11, rushingYards: 97, rushingTd: 1, rushingLong: 75,
          receptions: 5, receivingYards: 30, receivingYac: 14,
          receivingTd: 0, receivingLong: 16, targets: 7, fumbles: 0,
          rushingAvg: 8.8, receivingAvg: 6, totalYards: 127, totalTd: 1
        },
        bigPlays: [
          '75 yard rushing touchdown'
        ] },
      { week: 10, date: '2030-11-10', kickoff: null,
        opponent: 'Los Angeles Rams', home: true, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week: 11, date: '2030-11-17', kickoff: null,
        opponent: 'San Francisco 49ers', home: true, conference: false, division: true,
        result: { teamScore: 48, opponentScore: 14 }, booster: 'boost-2-0',
        stats: {
          carries: 27, rushingYards: 186, rushingTd: 2, rushingLong: 37,
          receptions: 6, receivingYards: 63, receivingYac: 39,
          receivingTd: 1, receivingLong: 25, targets: 6, fumbles: 0,
          rushingAvg: 6.9, receivingAvg: 10.5, totalYards: 249, totalTd: 3
        },
        bigPlays: [
          '2 yard rushing touchdown',
          '23 yard rushing touchdown',
          '7 yard receiving touchdown'
        ] },
      { week: 12, date: '2030-11-24', kickoff: null,
        opponent: 'Cincinnati Bengals', home: false, conference: false,
        result: { teamScore: 13, opponentScore: 16 }, booster: null,
        stats: {
          carries: 17, rushingYards: 132, rushingTd: 1, rushingLong: 41,
          receptions: 3, receivingYards: 19, receivingYac: 8,
          receivingTd: 0, receivingLong: 8, targets: 6, fumbles: 0,
          rushingAvg: 7.8, receivingAvg: 6.3, totalYards: 151, totalTd: 1
        },
        bigPlays: [
          '1 yard rushing touchdown'
        ] },
      { week: 13, date: '2030-12-01', kickoff: null,
        opponent: 'San Francisco 49ers', home: false, conference: false, division: true,
        result: { teamScore: 10, opponentScore: 30 }, booster: null,
        stats: {
          carries: 15, rushingYards: 73, rushingTd: 1, rushingLong: 19,
          receptions: 4, receivingYards: 23, receivingYac: 10,
          receivingTd: 0, receivingLong: 14, targets: 5, fumbles: 1,
          rushingAvg: 4.9, receivingAvg: 5.8, totalYards: 96, totalTd: 1
        },
        bigPlays: [
          '6 yard rushing touchdown'
        ] },
      { week: 14, date: '2030-12-08', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week: 15, date: '2030-12-15', kickoff: null,
        opponent: 'Baltimore Ravens', home: false, conference: false, overtime: true,
        result: { teamScore: 40, opponentScore: 34 }, booster: null,
        stats: {
          carries: 11, rushingYards: 58, rushingTd: 0, rushingLong: 19,
          receptions: 6, receivingYards: 131, receivingYac: 98,
          receivingTd: 2, receivingLong: 75, targets: 6, fumbles: 0,
          rushingAvg: 5.3, receivingAvg: 21.8, totalYards: 189, totalTd: 2
        },
        bigPlays: [
          '75 yard receiving touchdown',
          '2 yard receiving touchdown'
        ] },
      { week: 16, date: '2030-12-22', kickoff: null,
        opponent: 'Cleveland Browns', home: true, conference: false,
        result: { teamScore: 9, opponentScore: 19 }, booster: null,
        stats: {
          carries: 11, rushingYards: 43, rushingTd: 0, rushingLong: 6,
          receptions: 3, receivingYards: 8, receivingYac: 6,
          receivingTd: 0, receivingLong: 5, targets: 3, fumbles: 0,
          rushingAvg: 3.9, receivingAvg: 2.7, totalYards: 51, totalTd: 0
        } },
      { week: 17, date: '2030-12-29', kickoff: null,
        opponent: 'Seattle Seahawks', home: false, conference: false, division: true,
        result: { teamScore: 34, opponentScore: 30 }, booster: 'boost-2-0',
        stats: {
          carries: 14, rushingYards: 102, rushingTd: 1, rushingLong: 22,
          receptions: 2, receivingYards: 23, receivingYac: 18,
          receivingTd: 0, receivingLong: 17, targets: 2, fumbles: 1,
          rushingAvg: 7.3, receivingAvg: 11.5, totalYards: 125, totalTd: 1
        },
        bigPlays: [
          '22 yard rushing touchdown'
        ] },
      { week: 18, date: '2031-01-05', kickoff: null,
        opponent: 'Philadelphia Eagles', home: true, conference: false,
        result: { teamScore: 27, opponentScore: 6 }, booster: 'boost-1-5',
        stats: {
          carries: 29, rushingYards: 147, rushingTd: 1, rushingLong: 29,
          receptions: 4, receivingYards: 28, receivingYac: 15,
          receivingTd: 0, receivingLong: 15, targets: 4, fumbles: 0,
          rushingAvg: 5.1, receivingAvg: 7, totalYards: 175, totalTd: 1
        },
        bigPlays: [
          '29 yard rushing touchdown'
        ] },
      { week: 19, date: '2031-01-11', kickoff: null,
        name: 'NFC Wild Card',
        opponent: 'Tampa Bay Buccaneers', home: true, conference: false, playoff: true,
        result: { teamScore: 27, opponentScore: 28 }, booster: 'wager-for', line: 2.5,
        stats: {
          carries: 21, rushingYards: 123, rushingTd: 3, rushingLong: 41,
          receptions: 4, receivingYards: 129, receivingYac: 119,
          receivingTd: 0, receivingLong: 48, targets: 5, fumbles: 0,
          rushingAvg: 5.9, receivingAvg: 32.3, totalYards: 252, totalTd: 3
        },
        bigPlays: [
          '3 yard rushing touchdown',
          '4 yard rushing touchdown',
          '10 yard rushing touchdown'
        ] },
    ],

    /* Jaykeb Stewart — Houston Texans */
    'jaykeb-stewart': [
      { week:  1, date: '2030-09-08', kickoff: null,
        opponent: 'Pittsburgh Steelers', home: false, conference: false,
        result: { teamScore: 34, opponentScore: 28 }, booster: 'boost-2-0',
        stats: {
          completions: 25, attempts: 34, passingYards: 282,
          passingYac: 78, passingTd: 4, interceptions: 0, carries: 8,
          rushingYards: 25, rushingTd: 0, rushingLong: 13, sacks: 2,
          fumbles: 0, passingAvg: 11.3, rating: 137.1, rushingAvg: 3.1
        },
        bigPlays: [
          '4 yard passing touchdown',
          '2 yard passing touchdown',
          '37 yard passing touchdown',
          '7 yard game-winning passing touchdown'
        ] },
      { week:  2, date: '2030-09-15', kickoff: null,
        opponent: 'Washington Commanders', home: true, conference: false, overtime: true,
        result: { teamScore: 44, opponentScore: 38 }, booster: 'boost-2-0',
        stats: {
          completions: 36, attempts: 50, passingYards: 410,
          passingYac: 220, passingTd: 3, interceptions: 1, carries: 7,
          rushingYards: 59, rushingTd: 1, rushingLong: 21, sacks: 2,
          fumbles: 0, passingAvg: 11.4, rating: 107.9, rushingAvg: 8.4
        },
        bigPlays: [
          '4 yard rushing touchdown',
          '3 yard passing touchdown',
          '1 yard passing touchdown',
          '60 yard game-winning passing touchdown'
        ] },
      { week:  3, date: '2030-09-22', kickoff: null,
        opponent: 'Philadelphia Eagles', home: false, conference: false, overtime: true,
        result: { teamScore: 30, opponentScore: 24 }, booster: 'boost-1-5',
        stats: {
          completions: 29, attempts: 38, passingYards: 374,
          passingYac: 140, passingTd: 4, interceptions: 1, carries: 7,
          rushingYards: 38, rushingTd: 0, rushingLong: 11, sacks: 1,
          fumbles: 0, passingAvg: 12.9, rating: 130.8, rushingAvg: 5.4
        },
        bigPlays: [
          '6 yard passing touchdown',
          '5 yard passing touchdown',
          '16 yard passing touchdown',
          '3 yard game-winning passing touchdown'
        ] },
      { week:  4, date: '2030-09-29', kickoff: null,
        opponent: 'Tennessee Titans', home: true, conference: false, division: true,
        result: { teamScore: 31, opponentScore: 26 }, booster: 'boost-1-5',
        stats: {
          completions: 27, attempts: 35, passingYards: 337,
          passingYac: 159, passingTd: 1, interceptions: 0, carries: 7,
          rushingYards: 22, rushingTd: 1, rushingLong: 9, sacks: 0,
          fumbles: 0, passingAvg: 12.5, rating: 116, rushingAvg: 3.1
        },
        bigPlays: [
          '24 yard passing touchdown',
          '2 yard rushing touchdown'
        ] },
      { week:  5, date: '2030-10-06', kickoff: null,
        opponent: 'New England Patriots', home: true, conference: false,
        result: { teamScore: 32, opponentScore: 17 }, booster: null,
        stats: {
          completions: 24, attempts: 39, passingYards: 384,
          passingYac: 167, passingTd: 2, interceptions: 0, carries: 3,
          rushingYards: 26, rushingTd: 1, rushingLong: 22, sacks: 3,
          fumbles: 0, passingAvg: 16, rating: 111.5, rushingAvg: 8.7
        },
        bigPlays: [
          '22 yard rushing touchdown',
          '50 yard passing touchdown',
          '6 yard passing touchdown'
        ] },
      { week:  6, date: '2030-10-13', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week:  7, date: '2030-10-20', kickoff: null,
        opponent: 'Cincinnati Bengals', home: false, conference: false,
        result: { teamScore: 22, opponentScore: 17 }, booster: null,
        stats: {
          completions: 25, attempts: 32, passingYards: 249,
          passingYac: 92, passingTd: 1, interceptions: 0, carries: 9,
          rushingYards: 16, rushingTd: 0, rushingLong: 9, sacks: 1,
          fumbles: 0, passingAvg: 10, rating: 109.5, rushingAvg: 1.8
        },
        bigPlays: [
          '23 yard passing touchdown'
        ] },
      { week:  8, date: '2030-10-27', kickoff: null,
        opponent: 'Tampa Bay Buccaneers', home: false, conference: false,
        result: { teamScore: 14, opponentScore: 19 }, booster: null,
        stats: {
          completions: 25, attempts: 44, passingYards: 264,
          passingYac: 91, passingTd: 1, interceptions: 1, carries: 5,
          rushingYards: 35, rushingTd: 0, rushingLong: 14, sacks: 2,
          fumbles: 0, passingAvg: 10.6, rating: 72.5, rushingAvg: 7
        },
        bigPlays: [
          '11 yard passing touchdown'
        ] },
      { week:  9, date: '2030-11-03', kickoff: null,
        opponent: 'Dallas Cowboys', home: true, conference: false, overtime: true,
        result: { teamScore: 30, opponentScore: 27 }, booster: null,
        stats: {
          completions: 20, attempts: 29, passingYards: 279,
          passingYac: 110, passingTd: 1, interceptions: 0, carries: 2,
          rushingYards: 2, rushingTd: 0, rushingLong: 6, sacks: 2,
          fumbles: 0, passingAvg: 14, rating: 111.1, rushingAvg: 1
        },
        bigPlays: [
          '13 yard passing touchdown'
        ] },
      { week: 10, date: '2030-11-10', kickoff: null,
        opponent: 'Jacksonville Jaguars', home: true, conference: false, division: true,
        result: { teamScore: 51, opponentScore: 14 }, booster: null,
        stats: {
          completions: 31, attempts: 33, passingYards: 391,
          passingYac: 125, passingTd: 4, interceptions: 0, carries: 3,
          rushingYards: 12, rushingTd: 0, rushingLong: 8, sacks: 0,
          fumbles: 0, passingAvg: 12.6, rating: 155.6, rushingAvg: 4
        },
        bigPlays: [
          '18 yard passing touchdown',
          '8 yard passing touchdown',
          '6 yard passing touchdown',
          '17 yard passing touchdown'
        ] },
      { week: 11, date: '2030-11-17', kickoff: null,
        opponent: 'Jacksonville Jaguars', home: false, conference: false, division: true,
        result: { teamScore: 34, opponentScore: 37 }, booster: null,
        stats: {
          completions: 32, attempts: 40, passingYards: 329,
          passingYac: 129, passingTd: 3, interceptions: 0, carries: 5,
          rushingYards: 32, rushingTd: 1, rushingLong: 18, sacks: 1,
          fumbles: 0, passingAvg: 10.3, rating: 125.9, rushingAvg: 6.4
        },
        bigPlays: [
          '3 yard passing touchdown',
          '14 yard passing touchdown',
          '3 yard rushing touchdown',
          '7 yard passing touchdown'
        ] },
      { week: 12, date: '2030-11-24', kickoff: null,
        opponent: 'Cleveland Browns', home: false, conference: false,
        result: { teamScore: 23, opponentScore: 17 }, booster: null,
        stats: {
          completions: 22, attempts: 36, passingYards: 236,
          passingYac: 91, passingTd: 1, interceptions: 1, carries: 9,
          rushingYards: 20, rushingTd: 0, rushingLong: 9, sacks: 2,
          fumbles: 1, passingAvg: 10.7, rating: 78, rushingAvg: 2.2
        },
        bigPlays: [
          '20 yard passing touchdown'
        ] },
      { week: 13, date: '2030-12-01', kickoff: null,
        opponent: 'New York Giants', home: false, conference: false,
        result: { teamScore: 30, opponentScore: 27 }, booster: 'boost-2-5',
        stats: {
          completions: 26, attempts: 32, passingYards: 277,
          passingYac: 67, passingTd: 4, interceptions: 0, carries: 6,
          rushingYards: 6, rushingTd: 0, rushingLong: 6, sacks: 2,
          fumbles: 0, passingAvg: 10.7, rating: 142.3, rushingAvg: 1
        },
        bigPlays: [
          '4 yard passing touchdown',
          '2 yard passing touchdown',
          '4 yard passing touchdown',
          '20 yard game-winning passing touchdown'
        ] },
      { week: 14, date: '2030-12-08', kickoff: null,
        opponent: 'Indianapolis Colts', home: false, conference: false, division: true,
        result: { teamScore: 37, opponentScore: 29 }, booster: null,
        stats: {
          completions: 23, attempts: 28, passingYards: 286,
          passingYac: 76, passingTd: 1, interceptions: 0, carries: 8,
          rushingYards: 19, rushingTd: 0, rushingLong: 6, sacks: 2,
          fumbles: 0, passingAvg: 12.4, rating: 121.1, rushingAvg: 2.4
        },
        bigPlays: [
          '5 yard passing touchdown'
        ] },
      { week: 15, date: '2030-12-15', kickoff: null,
        opponent: 'Baltimore Ravens', home: true, conference: false,
        result: { teamScore: 21, opponentScore: 12 }, booster: null,
        stats: {
          completions: 16, attempts: 31, passingYards: 190,
          passingYac: 52, passingTd: 1, interceptions: 2, carries: 8,
          rushingYards: 15, rushingTd: 0, rushingLong: 10, sacks: 1,
          fumbles: 0, passingAvg: 11.9, rating: 54.5, rushingAvg: 1.9
        },
        bigPlays: [
          '21 yard passing touchdown'
        ] },
      { week: 16, date: '2030-12-22', kickoff: null,
        opponent: 'Los Angeles Chargers', home: true, conference: false,
        result: { teamScore: 20, opponentScore: 30 }, booster: null,
        stats: {
          completions: 29, attempts: 43, passingYards: 282,
          passingYac: 96, passingTd: 1, interceptions: 1, carries: 7,
          rushingYards: 32, rushingTd: 0, rushingLong: 9, sacks: 0,
          fumbles: 0, passingAvg: 9.7, rating: 83.7, rushingAvg: 4.6
        },
        bigPlays: [
          '18 yard passing touchdown'
        ] },
      { week: 17, date: '2030-12-29', kickoff: null,
        opponent: 'Tennessee Titans', home: false, conference: false, division: true,
        result: { teamScore: 17, opponentScore: 34 }, booster: null,
        stats: {
          completions: 25, attempts: 43, passingYards: 250,
          passingYac: 104, passingTd: 1, interceptions: 1, carries: 8,
          rushingYards: 38, rushingTd: 1, rushingLong: 14, sacks: 4,
          fumbles: 1, passingAvg: 10, rating: 72.8, rushingAvg: 4.8
        },
        bigPlays: [
          '1 yard passing touchdown',
          '14 yard rushing touchdown'
        ] },
      { week: 18, date: '2031-01-05', kickoff: null,
        opponent: 'Indianapolis Colts', home: true, conference: false, division: true,
        result: { teamScore: 20, opponentScore: 12 }, booster: null,
        stats: {
          completions: 16, attempts: 25, passingYards: 133,
          passingYac: 76, passingTd: 1, interceptions: 1, carries: 6,
          rushingYards: 20, rushingTd: 0, rushingLong: 12, sacks: 0,
          fumbles: 0, passingAvg: 8.3, rating: 74.3, rushingAvg: 3.3
        },
        bigPlays: [
          '14 yard passing touchdown'
        ] },
      { week: 19, date: '2031-01-11', kickoff: null,
        name: 'AFC Wild Card',
        opponent: 'New England Patriots', home: true, conference: false, playoff: true,
        result: { teamScore: 24, opponentScore: 15 }, booster: null,
        stats: {
          completions: 24, attempts: 34, passingYards: 280,
          passingYac: 111, passingTd: 2, interceptions: 0, carries: 7,
          rushingYards: 13, rushingTd: 0, rushingLong: 11, sacks: 2,
          fumbles: 0, passingAvg: 11.7, rating: 114.8, rushingAvg: 1.9
        },
        bigPlays: [
          '7 yard passing touchdown',
          '9 yard passing touchdown'
        ] },
      { week: 20, date: '2031-01-18', kickoff: null,
        name: 'AFC Divisional Round',
        opponent: 'New York Jets', home: true, conference: false, playoff: true,
        result: { teamScore: 17, opponentScore: 20 }, booster: null,
        stats: {
          completions: 28, attempts: 39, passingYards: 287,
          passingYac: 145, passingTd: 1, interceptions: 0, carries: 5,
          rushingYards: 27, rushingTd: 0, rushingLong: 13, sacks: 2,
          fumbles: 0, passingAvg: 10.3, rating: 101.1, rushingAvg: 5.4
        },
        bigPlays: [
          '13 yard passing touchdown'
        ] },
    ],
  }
};
