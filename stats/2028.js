/* ==========================================================================
   EGE Football — the 2028 season
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

EGE.stats[2028] = {
  season: 2028,
  level: 'NFL',

  /* Weeks the NFL Sim tab stored, written in here, and when each was
     saved: a stored week saved after this replaces the file's. */
  stored: {
    1: '2026-11-04T04:24:17.700Z',
    2: '2026-11-04T05:41:01.841Z',
    3: '2026-11-04T07:08:30.048Z',
    4: '2026-11-04T20:20:04.358Z',
    5: '2026-11-05T02:55:00.051Z',
    6: '2026-11-05T03:01:00.605Z',
    7: '2026-11-05T15:10:39.638Z',
    8: '2026-11-05T21:31:26.130Z',
    9: '2026-11-06T06:45:29.345Z',
    10: '2026-11-06T20:31:11.448Z',
    11: '2026-11-06T21:51:08.524Z',
    12: '2026-11-07T03:29:20.803Z',
    13: '2026-11-07T14:25:58.951Z',
    14: '2026-11-07T19:23:15.551Z',
    15: '2026-11-07T21:28:23.185Z',
    16: '2026-11-07T23:53:14.812Z',
    17: '2026-11-09T03:14:37.461Z',
    18: '2026-11-09T03:17:46.295Z',
    19: '2026-11-09T03:22:04.979Z',
    20: '2026-11-09T03:42:11.602Z',
    21: '2026-11-10T04:20:58.569Z',
    22: '2026-11-10T04:22:39.315Z'
  },

  /* The six traded in the NFL sim: from `week` on his games are the
     games of `to`, his team then, and the ones before it are as he
     played them. */
  trades: {
    'cooper-clark': [
      { week: 1, from: 'chicago', to: 'jacksonville' }
    ]
  },

  games: {

    /* Andrew Parr — Carolina Panthers */
    'andrew-parr': [
      { week:  1, date: '2028-09-10', kickoff: null,
        opponent: 'Tampa Bay Buccaneers', home: false, conference: false, division: true,
        result: { teamScore: 17, opponentScore: 20 }, booster: 'wager-for', line: 7.5,
        stats: {
          receptions: 6, receivingYards: 41, receivingYac: 14,
          receivingTd: 2, receivingLong: 14, targets: 10, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 6.8, totalYards: 41, totalTd: 2
        },
        bigPlays: [
          '5 yard receiving touchdown',
          '14 yard receiving touchdown'
        ] },
      { week:  2, date: '2028-09-17', kickoff: null,
        opponent: 'Philadelphia Eagles', home: false, conference: false,
        result: { teamScore: 24, opponentScore: 23 }, booster: null,
        stats: {
          receptions: 7, receivingYards: 60, receivingYac: 31,
          receivingTd: 0, receivingLong: 15, targets: 10, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 8.6, totalYards: 60, totalTd: 0
        } },
      { week:  3, date: '2028-09-24', kickoff: null,
        opponent: 'Houston Texans', home: false, conference: false,
        result: { teamScore: 31, opponentScore: 44 }, booster: 'boost-2-5',
        stats: {
          receptions: 11, receivingYards: 108, receivingYac: 24,
          receivingTd: 1, receivingLong: 19, targets: 15, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 9.8, totalYards: 108, totalTd: 1
        },
        bigPlays: [
          '6 yard receiving touchdown'
        ] },
      { week:  4, date: '2028-10-01', kickoff: null,
        opponent: 'Atlanta Falcons', home: false, conference: false, division: true,
        result: { teamScore: 22, opponentScore: 10 }, booster: null,
        stats: {
          receptions: 9, receivingYards: 84, receivingYac: 31,
          receivingTd: 0, receivingLong: 20, targets: 9, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 9.3, totalYards: 84, totalTd: 0
        } },
      { week:  5, date: '2028-10-08', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week:  6, date: '2028-10-15', kickoff: null,
        opponent: 'Jacksonville Jaguars', home: true, conference: false,
        result: { teamScore: 15, opponentScore: 24 }, booster: 'wager-for', line: -5.5,
        stats: {
          receptions: 6, receivingYards: 95, receivingYac: 28,
          receivingTd: 0, receivingLong: 37, targets: 11, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 15.8, totalYards: 95, totalTd: 0
        } },
      { week:  7, date: '2028-10-22', kickoff: null,
        opponent: 'New Orleans Saints', home: true, conference: false, division: true,
        result: { teamScore: 20, opponentScore: 12 }, booster: 'boost-1-5',
        stats: {
          receptions: 11, receivingYards: 111, receivingYac: 50,
          receivingTd: 0, receivingLong: 24, targets: 12, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 10.1, totalYards: 111, totalTd: 0
        } },
      { week:  8, date: '2028-10-29', kickoff: null,
        opponent: 'New Orleans Saints', home: false, conference: false, division: true,
        result: { teamScore: 21, opponentScore: 7 }, booster: 'boost-1-5',
        stats: {
          receptions: 13, receivingYards: 122, receivingYac: 68,
          receivingTd: 0, receivingLong: 24, targets: 16, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 9.4, totalYards: 122, totalTd: 0
        } },
      { week:  9, date: '2028-11-05', kickoff: null,
        opponent: 'San Francisco 49ers', home: true, conference: false,
        result: { teamScore: 33, opponentScore: 14 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 82, receivingYac: 24,
          receivingTd: 0, receivingLong: 50, targets: 7, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 16.4, totalYards: 82, totalTd: 0
        } },
      { week: 10, date: '2028-11-12', kickoff: null,
        opponent: 'Seattle Seahawks', home: false, conference: false,
        result: { teamScore: 20, opponentScore: 13 }, booster: null,
        stats: {
          receptions: 8, receivingYards: 116, receivingYac: 57,
          receivingTd: 0, receivingLong: 26, targets: 10, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 14.5, totalYards: 116, totalTd: 0
        } },
      { week: 11, date: '2028-11-19', kickoff: null,
        opponent: 'Indianapolis Colts', home: true, conference: false,
        result: { teamScore: 41, opponentScore: 10 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 74, receivingYac: 26,
          receivingTd: 0, receivingLong: 29, targets: 5, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 14.8, totalYards: 74, totalTd: 0
        } },
      { week: 12, date: '2028-11-26', kickoff: null,
        opponent: 'Miami Dolphins', home: true, conference: false,
        result: { teamScore: 33, opponentScore: 24 }, booster: null,
        stats: {
          receptions: 3, receivingYards: 15, receivingYac: 11,
          receivingTd: 1, receivingLong: 10, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 5, totalYards: 15, totalTd: 1
        },
        bigPlays: [
          '1 yard receiving touchdown'
        ] },
      { week: 13, date: '2028-12-03', kickoff: null,
        opponent: 'Atlanta Falcons', home: true, conference: false, division: true,
        result: { teamScore: 40, opponentScore: 3 }, booster: null,
        stats: {
          receptions: 7, receivingYards: 51, receivingYac: 9,
          receivingTd: 2, receivingLong: 18, targets: 10, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 7.3, totalYards: 51, totalTd: 2
        },
        bigPlays: [
          '4 yard receiving touchdown',
          '15 yard receiving touchdown'
        ] },
      { week: 14, date: '2028-12-10', kickoff: null,
        opponent: 'Tennessee Titans', home: false, conference: false, overtime: true,
        result: { teamScore: 31, opponentScore: 34 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 59, receivingYac: 11,
          receivingTd: 0, receivingLong: 18, targets: 5, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 11.8, totalYards: 59, totalTd: 0
        } },
      { week: 15, date: '2028-12-17', kickoff: null,
        opponent: 'Arizona Cardinals', home: true, conference: false,
        result: { teamScore: 47, opponentScore: 44 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 56, receivingYac: 22,
          receivingTd: 1, receivingLong: 22, targets: 5, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 14, totalYards: 56, totalTd: 1
        },
        bigPlays: [
          '14 yard game-winning receiving touchdown'
        ] },
      { week: 16, date: '2028-12-24', kickoff: null,
        opponent: 'Tampa Bay Buccaneers', home: true, conference: false, division: true,
        result: { teamScore: 34, opponentScore: 21 }, booster: 'boost-1-5',
        stats: {
          receptions: 4, receivingYards: 11, receivingYac: 4,
          receivingTd: 1, receivingLong: 4, targets: 7, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 1,
          receivingAvg: 2.8, totalYards: 11, totalTd: 1
        },
        bigPlays: [
          '4 yard receiving touchdown'
        ] },
      { week: 17, date: '2028-12-31', kickoff: null,
        opponent: 'Los Angeles Rams', home: false, conference: false,
        result: { teamScore: 10, opponentScore: 31 }, booster: null,
        stats: {
          receptions: 11, receivingYards: 60, receivingYac: 31,
          receivingTd: 1, receivingLong: 17, targets: 18, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 5.5, totalYards: 60, totalTd: 1
        },
        bigPlays: [
          '5 yard receiving touchdown'
        ] },
      { week: 18, date: '2029-01-07', kickoff: null,
        opponent: 'Chicago Bears', home: true, conference: false,
        result: { teamScore: 18, opponentScore: 28 }, booster: null,
        stats: {
          receptions: 9, receivingYards: 97, receivingYac: 20,
          receivingTd: 1, receivingLong: 21, targets: 12, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 10.8, totalYards: 97, totalTd: 1
        },
        bigPlays: [
          '4 yard receiving touchdown'
        ] },
      { week: 19, date: '2029-01-13', kickoff: null,
        name: 'NFC Wild Card',
        opponent: 'Tampa Bay Buccaneers', home: true, conference: false, playoff: true,
        result: { teamScore: 17, opponentScore: 10 }, booster: null,
        stats: {
          receptions: 3, receivingYards: 20, receivingYac: 16,
          receivingTd: 0, receivingLong: 12, targets: 3, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 6.7, totalYards: 20, totalTd: 0
        } },
      { week: 20, date: '2029-01-20', kickoff: null,
        name: 'NFC Divisional Round',
        opponent: 'Chicago Bears', home: false, conference: false, playoff: true,
        result: { teamScore: 14, opponentScore: 27 }, booster: null,
        stats: {
          receptions: 14, receivingYards: 161, receivingYac: 51,
          receivingTd: 0, receivingLong: 28, targets: 17, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 11.5, totalYards: 161, totalTd: 0
        } },
    ],

    /* Cooper Clark — Jacksonville Jaguars */
    'cooper-clark': [
      { week:  1, date: '2028-09-10', kickoff: null,
        opponent: 'Houston Texans', home: false, conference: false, division: true,
        result: { teamScore: 24, opponentScore: 34 }, booster: 'boost-2-0',
        stats: {
          carries: 16, rushingYards: 96, rushingTd: 3, rushingLong: 19,
          receptions: 7, receivingYards: 54, receivingYac: 22,
          receivingTd: 0, receivingLong: 19, targets: 7, fumbles: 1,
          rushingAvg: 6, receivingAvg: 7.7, totalYards: 150, totalTd: 3
        },
        bigPlays: [
          '2 yard rushing touchdown',
          '8 yard rushing touchdown',
          '18 yard rushing touchdown'
        ] },
      { week:  2, date: '2028-09-17', kickoff: null,
        opponent: 'Tennessee Titans', home: true, conference: false, division: true, hurt: { injury: 'Broken Ankle', weeks: 20 },
        result: { teamScore: 36, opponentScore: 33 }, booster: null,
        stats: {
          carries: 6, rushingYards: 27, rushingTd: 0, rushingLong: 15,
          receptions: 5, receivingYards: 66, receivingYac: 49,
          receivingTd: 0, receivingLong: 41, targets: 5, fumbles: 0,
          rushingAvg: 4.5, receivingAvg: 13.2, totalYards: 93, totalTd: 0
        } },
      { week:  3, date: '2028-09-24', kickoff: null,
        opponent: 'New York Jets', home: false, conference: false, injured: true, injury: 'Broken Ankle', health: 80,
        result: { teamScore: 24, opponentScore: 9 }, booster: null,
        stats: {
          carries: 0, rushingYards: 0, rushingTd: 0, rushingLong: 0,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 0,
          totalYards: 0, totalTd: 0
        } },
      { week:  4, date: '2028-10-01', kickoff: null,
        opponent: 'Indianapolis Colts', home: false, conference: false, division: true, injured: true, injury: 'Broken Ankle', health: 80,
        result: { teamScore: 7, opponentScore: 22 }, booster: null,
        stats: {
          carries: 0, rushingYards: 0, rushingTd: 0, rushingLong: 0,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 0,
          totalYards: 0, totalTd: 0
        } },
      { week:  5, date: '2028-10-08', kickoff: null,
        opponent: 'Houston Texans', home: true, conference: false, division: true, injured: true, injury: 'Broken Ankle', health: 80,
        result: { teamScore: 7, opponentScore: 37 }, booster: null,
        stats: {
          carries: 0, rushingYards: 0, rushingTd: 0, rushingLong: 0,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 0,
          totalYards: 0, totalTd: 0
        } },
      { week:  6, date: '2028-10-15', kickoff: null,
        opponent: 'Carolina Panthers', home: false, conference: false, injured: true, injury: 'Broken Ankle', health: 80,
        result: { teamScore: 24, opponentScore: 15 }, booster: 'wager-for', line: 7.5,
        stats: {
          carries: 0, rushingYards: 0, rushingTd: 0, rushingLong: 0,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 0,
          totalYards: 0, totalTd: 0
        } },
      { week:  7, date: '2028-10-22', kickoff: null,
        opponent: 'Cleveland Browns', home: true, conference: false, injured: true, injury: 'Broken Ankle', health: 80,
        result: { teamScore: 48, opponentScore: 24 }, booster: null,
        stats: {
          carries: 0, rushingYards: 0, rushingTd: 0, rushingLong: 0,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 0,
          totalYards: 0, totalTd: 0
        } },
      { week:  8, date: '2028-10-29', kickoff: null,
        opponent: 'Atlanta Falcons', home: false, conference: false, injured: true, injury: 'Broken Ankle', health: 80,
        result: { teamScore: 20, opponentScore: 17 }, booster: null,
        stats: {
          carries: 0, rushingYards: 0, rushingTd: 0, rushingLong: 0,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 0,
          totalYards: 0, totalTd: 0
        } },
      { week:  9, date: '2028-11-05', kickoff: null,
        opponent: 'Tampa Bay Buccaneers', home: true, conference: false, injured: true, injury: 'Broken Ankle', health: 80,
        result: { teamScore: 22, opponentScore: 25 }, booster: null,
        stats: {
          carries: 0, rushingYards: 0, rushingTd: 0, rushingLong: 0,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 0,
          totalYards: 0, totalTd: 0
        } },
      { week: 10, date: '2028-11-12', kickoff: null,
        opponent: 'Denver Broncos', home: false, conference: false, injured: true, injury: 'Broken Ankle', health: 80,
        result: { teamScore: 15, opponentScore: 16 }, booster: null,
        stats: {
          carries: 0, rushingYards: 0, rushingTd: 0, rushingLong: 0,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 0,
          totalYards: 0, totalTd: 0
        } },
      { week: 11, date: '2028-11-19', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week: 12, date: '2028-11-26', kickoff: null,
        opponent: 'Indianapolis Colts', home: true, conference: false, division: true, injured: true, injury: 'Broken Ankle', health: 80,
        result: { teamScore: 30, opponentScore: 21 }, booster: null,
        stats: {
          carries: 0, rushingYards: 0, rushingTd: 0, rushingLong: 0,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 0,
          totalYards: 0, totalTd: 0
        } },
      { week: 13, date: '2028-12-03', kickoff: null,
        opponent: 'Tennessee Titans', home: false, conference: false, division: true, injured: true, injury: 'Broken Ankle', health: 80,
        result: { teamScore: 30, opponentScore: 22 }, booster: null,
        stats: {
          carries: 0, rushingYards: 0, rushingTd: 0, rushingLong: 0,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 0,
          totalYards: 0, totalTd: 0
        } },
      { week: 14, date: '2028-12-10', kickoff: null,
        opponent: 'Washington Commanders', home: false, conference: false, injured: true, injury: 'Broken Ankle', health: 80,
        result: { teamScore: 17, opponentScore: 14 }, booster: null,
        stats: {
          carries: 0, rushingYards: 0, rushingTd: 0, rushingLong: 0,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 0,
          totalYards: 0, totalTd: 0
        } },
      { week: 15, date: '2028-12-17', kickoff: null,
        opponent: 'Los Angeles Chargers', home: true, conference: false, injured: true, injury: 'Broken Ankle', health: 80,
        result: { teamScore: 29, opponentScore: 7 }, booster: null,
        stats: {
          carries: 0, rushingYards: 0, rushingTd: 0, rushingLong: 0,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 0,
          totalYards: 0, totalTd: 0
        } },
      { week: 16, date: '2028-12-24', kickoff: null,
        opponent: 'New Orleans Saints', home: true, conference: false, injured: true, injury: 'Broken Ankle', health: 80,
        result: { teamScore: 19, opponentScore: 3 }, booster: null,
        stats: {
          carries: 0, rushingYards: 0, rushingTd: 0, rushingLong: 0,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 0,
          totalYards: 0, totalTd: 0
        } },
      { week: 17, date: '2028-12-31', kickoff: null,
        opponent: 'Las Vegas Raiders', home: true, conference: false, injured: true, injury: 'Broken Ankle', health: 80,
        result: { teamScore: 20, opponentScore: 34 }, booster: null,
        stats: {
          carries: 0, rushingYards: 0, rushingTd: 0, rushingLong: 0,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 0,
          totalYards: 0, totalTd: 0
        } },
      { week: 18, date: '2029-01-07', kickoff: null,
        opponent: 'Kansas City Chiefs', home: false, conference: false, injured: true, injury: 'Broken Ankle', health: 80,
        result: { teamScore: 17, opponentScore: 41 }, booster: null,
        stats: {
          carries: 0, rushingYards: 0, rushingTd: 0, rushingLong: 0,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 0,
          totalYards: 0, totalTd: 0
        } },
      { week: 19, date: '2029-01-13', kickoff: null,
        name: 'AFC Wild Card',
        opponent: 'Las Vegas Raiders', home: false, conference: false, playoff: true, injured: true, injury: 'Broken Ankle', health: 80,
        result: { teamScore: 27, opponentScore: 24 }, booster: 'wager-for', line: 7.5,
        stats: {
          carries: 0, rushingYards: 0, rushingTd: 0, rushingLong: 0,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 0,
          totalYards: 0, totalTd: 0
        } },
      { week: 20, date: '2029-01-20', kickoff: null,
        name: 'AFC Divisional Round',
        opponent: 'Baltimore Ravens', home: false, conference: false, playoff: true, injured: true, injury: 'Broken Ankle', health: 80,
        result: { teamScore: 0, opponentScore: 31 }, booster: null,
        stats: {
          carries: 0, rushingYards: 0, rushingTd: 0, rushingLong: 0,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 0,
          totalYards: 0, totalTd: 0
        } },
    ],

    /* Paxon Hatch — New York Giants */
    'paxon-hatch': [
      { week:  1, date: '2028-09-10', kickoff: null,
        opponent: 'New England Patriots', home: true, conference: false,
        result: { teamScore: 24, opponentScore: 27 }, booster: null,
        stats: {
          receptions: 7, receivingYards: 94, receivingYac: 50,
          receivingTd: 0, receivingLong: 27, targets: 11, carries: 1,
          rushingYards: 6, rushingTd: 0, rushingLong: 6, fumbles: 1,
          rushingAvg: 6, receivingAvg: 13.4, totalYards: 100, totalTd: 0
        } },
      { week:  2, date: '2028-09-17', kickoff: null,
        opponent: 'Washington Commanders', home: true, conference: false, division: true,
        result: { teamScore: 30, opponentScore: 10 }, booster: null,
        stats: {
          receptions: 9, receivingYards: 147, receivingYac: 43,
          receivingTd: 0, receivingLong: 33, targets: 13, carries: 1,
          rushingYards: 10, rushingTd: 0, rushingLong: 10, fumbles: 0,
          rushingAvg: 10, receivingAvg: 16.3, totalYards: 157, totalTd: 0
        } },
      { week:  3, date: '2028-09-24', kickoff: null,
        opponent: 'Miami Dolphins', home: false, conference: false,
        result: { teamScore: 19, opponentScore: 30 }, booster: null,
        stats: {
          receptions: 13, receivingYards: 185, receivingYac: 90,
          receivingTd: 0, receivingLong: 30, targets: 17, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 14.2, totalYards: 185, totalTd: 0
        } },
      { week:  4, date: '2028-10-01', kickoff: null,
        opponent: 'Houston Texans', home: true, conference: false,
        result: { teamScore: 41, opponentScore: 28 }, booster: 'boost-2-5',
        stats: {
          receptions: 5, receivingYards: 77, receivingYac: 22,
          receivingTd: 1, receivingLong: 24, targets: 7, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 15.4, totalYards: 77, totalTd: 1
        },
        bigPlays: [
          '11 yard receiving touchdown'
        ] },
      { week:  5, date: '2028-10-08', kickoff: null,
        opponent: 'Buffalo Bills', home: true, conference: false, overtime: true,
        result: { teamScore: 27, opponentScore: 24 }, booster: null,
        stats: {
          receptions: 14, receivingYards: 180, receivingYac: 45,
          receivingTd: 2, receivingLong: 31, targets: 20, carries: 1,
          rushingYards: 4, rushingTd: 0, rushingLong: 4, fumbles: 0,
          rushingAvg: 4, receivingAvg: 12.9, totalYards: 184, totalTd: 2
        },
        bigPlays: [
          '13 yard receiving touchdown',
          '21 yard receiving touchdown'
        ] },
      { week:  6, date: '2028-10-15', kickoff: null,
        opponent: 'Green Bay Packers', home: false, conference: false,
        result: { teamScore: 23, opponentScore: 13 }, booster: null,
        stats: {
          receptions: 9, receivingYards: 90, receivingYac: 42,
          receivingTd: 0, receivingLong: 21, targets: 12, carries: 1,
          rushingYards: 6, rushingTd: 0, rushingLong: 6, fumbles: 0,
          rushingAvg: 6, receivingAvg: 10, totalYards: 96, totalTd: 0
        } },
      { week:  7, date: '2028-10-22', kickoff: null,
        opponent: 'Philadelphia Eagles', home: false, conference: false, division: true,
        result: { teamScore: 24, opponentScore: 20 }, booster: 'boost-1-5',
        stats: {
          receptions: 5, receivingYards: 114, receivingYac: 20,
          receivingTd: 0, receivingLong: 39, targets: 9, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 22.8, totalYards: 114, totalTd: 0
        } },
      { week:  8, date: '2028-10-29', kickoff: null,
        opponent: 'Tampa Bay Buccaneers', home: false, conference: false,
        result: { teamScore: 23, opponentScore: 30 }, booster: 'boost-1-5',
        stats: {
          receptions: 5, receivingYards: 95, receivingYac: 50,
          receivingTd: 0, receivingLong: 42, targets: 8, carries: 2,
          rushingYards: 6, rushingTd: 0, rushingLong: 5, fumbles: 0,
          rushingAvg: 3, receivingAvg: 19, totalYards: 101, totalTd: 0
        } },
      { week:  9, date: '2028-11-05', kickoff: null,
        opponent: 'Detroit Lions', home: true, conference: false,
        result: { teamScore: 17, opponentScore: 24 }, booster: 'boost-1-5',
        stats: {
          receptions: 15, receivingYards: 175, receivingYac: 71,
          receivingTd: 2, receivingLong: 26, targets: 17, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 11.7, totalYards: 175, totalTd: 2
        },
        bigPlays: [
          '7 yard receiving touchdown',
          '6 yard receiving touchdown'
        ] },
      { week: 10, date: '2028-11-12', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week: 11, date: '2028-11-19', kickoff: null,
        opponent: 'San Francisco 49ers', home: true, conference: false,
        result: { teamScore: 25, opponentScore: 21 }, booster: null,
        stats: {
          receptions: 7, receivingYards: 126, receivingYac: 44,
          receivingTd: 0, receivingLong: 40, targets: 10, carries: 1,
          rushingYards: 7, rushingTd: 0, rushingLong: 7, fumbles: 0,
          rushingAvg: 7, receivingAvg: 18, totalYards: 133, totalTd: 0
        } },
      { week: 12, date: '2028-11-26', kickoff: null,
        opponent: 'Washington Commanders', home: false, conference: false, division: true,
        result: { teamScore: 37, opponentScore: 22 }, booster: null,
        stats: {
          receptions: 12, receivingYards: 163, receivingYac: 83,
          receivingTd: 3, receivingLong: 47, targets: 17, carries: 1,
          rushingYards: 5, rushingTd: 0, rushingLong: 5, fumbles: 1,
          rushingAvg: 5, receivingAvg: 13.6, totalYards: 168, totalTd: 3
        },
        bigPlays: [
          '47 yard receiving touchdown',
          '8 yard receiving touchdown',
          '25 yard receiving touchdown'
        ] },
      { week: 13, date: '2028-12-03', kickoff: null,
        opponent: 'Philadelphia Eagles', home: true, conference: false, division: true,
        result: { teamScore: 28, opponentScore: 31 }, booster: null,
        stats: {
          receptions: 7, receivingYards: 135, receivingYac: 25,
          receivingTd: 2, receivingLong: 45, targets: 8, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 19.3, totalYards: 135, totalTd: 2
        },
        bigPlays: [
          '45 yard receiving touchdown',
          '24 yard receiving touchdown'
        ] },
      { week: 14, date: '2028-12-10', kickoff: null,
        opponent: 'Minnesota Vikings', home: false, conference: false,
        result: { teamScore: 31, opponentScore: 27 }, booster: null,
        stats: {
          receptions: 6, receivingYards: 132, receivingYac: 17,
          receivingTd: 1, receivingLong: 40, targets: 12, carries: 1,
          rushingYards: 17, rushingTd: 0, rushingLong: 17, fumbles: 0,
          rushingAvg: 17, receivingAvg: 22, totalYards: 149, totalTd: 1
        },
        bigPlays: [
          '40 yard game-winning receiving touchdown'
        ] },
      { week: 15, date: '2028-12-17', kickoff: null,
        opponent: 'Chicago Bears', home: true, conference: false,
        result: { teamScore: 20, opponentScore: 10 }, booster: null,
        stats: {
          receptions: 9, receivingYards: 119, receivingYac: 50,
          receivingTd: 1, receivingLong: 24, targets: 10, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 13.2, totalYards: 119, totalTd: 1
        },
        bigPlays: [
          '15 yard receiving touchdown'
        ] },
      { week: 16, date: '2028-12-24', kickoff: null,
        opponent: 'New York Jets', home: false, conference: false,
        result: { teamScore: 16, opponentScore: 13 }, booster: null,
        stats: {
          receptions: 10, receivingYards: 213, receivingYac: 116,
          receivingTd: 0, receivingLong: 39, targets: 10, carries: 1,
          rushingYards: 5, rushingTd: 0, rushingLong: 5, fumbles: 0,
          rushingAvg: 5, receivingAvg: 21.3, totalYards: 218, totalTd: 0
        } },
      { week: 17, date: '2028-12-31', kickoff: null,
        opponent: 'Dallas Cowboys', home: true, conference: false, division: true,
        result: { teamScore: 22, opponentScore: 10 }, booster: null,
        stats: {
          receptions: 8, receivingYards: 145, receivingYac: 43,
          receivingTd: 0, receivingLong: 39, targets: 11, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 18.1, totalYards: 145, totalTd: 0
        } },
      { week: 18, date: '2029-01-07', kickoff: null,
        opponent: 'Dallas Cowboys', home: false, conference: false, division: true, overtime: true,
        result: { teamScore: 25, opponentScore: 19 }, booster: 'boost-2-5',
        stats: {
          receptions: 14, receivingYards: 232, receivingYac: 101,
          receivingTd: 2, receivingLong: 38, targets: 18, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 16.6, totalYards: 232, totalTd: 2
        },
        bigPlays: [
          '27 yard receiving touchdown',
          '20 yard game-winning receiving touchdown'
        ] },
      { week: 19, date: '2029-01-13', kickoff: null,
        name: 'NFC Wild Card',
        opponent: 'Los Angeles Rams', home: false, conference: false, playoff: true,
        result: { teamScore: 26, opponentScore: 13 }, booster: 'wager-for', line: -3.5,
        stats: {
          receptions: 7, receivingYards: 118, receivingYac: 86,
          receivingTd: 0, receivingLong: 37, targets: 11, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 16.9, totalYards: 118, totalTd: 0
        } },
      { week: 20, date: '2029-01-20', kickoff: null,
        name: 'NFC Divisional Round',
        opponent: 'Philadelphia Eagles', home: false, conference: false, playoff: true, overtime: true,
        result: { teamScore: 20, opponentScore: 26 }, booster: 'wager-for', line: 4.5,
        stats: {
          receptions: 12, receivingYards: 157, receivingYac: 57,
          receivingTd: 1, receivingLong: 29, targets: 14, carries: 1,
          rushingYards: 5, rushingTd: 0, rushingLong: 5, fumbles: 1,
          rushingAvg: 5, receivingAvg: 13.1, totalYards: 162, totalTd: 1
        },
        bigPlays: [
          '19 yard receiving touchdown'
        ] },
    ],

    /* Isaac Vitel — Tampa Bay Buccaneers */
    'isaac-vitel': [
      { week:  1, date: '2028-09-10', kickoff: null,
        opponent: 'Carolina Panthers', home: true, conference: false, division: true,
        result: { teamScore: 20, opponentScore: 17 }, booster: null,
        stats: {
          completions: 29, attempts: 41, passingYards: 304,
          passingYac: 117, passingTd: 2, interceptions: 0, carries: 2,
          rushingYards: 1, rushingTd: 0, rushingLong: 0, sacks: 1,
          fumbles: 0, passingAvg: 10.5, rating: 108.2, rushingAvg: 0.5
        },
        bigPlays: [
          '4 yard passing touchdown',
          '7 yard passing touchdown'
        ] },
      { week:  2, date: '2028-09-17', kickoff: null,
        opponent: 'New England Patriots', home: true, conference: false,
        result: { teamScore: 13, opponentScore: 16 }, booster: null,
        stats: {
          completions: 21, attempts: 35, passingYards: 202,
          passingYac: 44, passingTd: 1, interceptions: 1, carries: 1,
          rushingYards: 4, rushingTd: 0, rushingLong: 4, sacks: 3,
          fumbles: 0, passingAvg: 9.6, rating: 73.7, rushingAvg: 4
        },
        bigPlays: [
          '12 yard passing touchdown'
        ] },
      { week:  3, date: '2028-09-24', kickoff: null,
        opponent: 'New Orleans Saints', home: false, conference: false, division: true,
        result: { teamScore: 24, opponentScore: 14 }, booster: null,
        stats: {
          completions: 23, attempts: 32, passingYards: 211,
          passingYac: 74, passingTd: 1, interceptions: 2, carries: 4,
          rushingYards: 1, rushingTd: 0, rushingLong: 4, sacks: 0,
          fumbles: 0, passingAvg: 9.2, rating: 73.8, rushingAvg: 0.3
        },
        bigPlays: [
          '12 yard passing touchdown'
        ] },
      { week:  4, date: '2028-10-01', kickoff: null,
        opponent: 'Arizona Cardinals', home: false, conference: false,
        result: { teamScore: 19, opponentScore: 31 }, booster: 'boost-1-5',
        stats: {
          completions: 24, attempts: 40, passingYards: 333,
          passingYac: 58, passingTd: 1, interceptions: 1, carries: 1,
          rushingYards: 4, rushingTd: 0, rushingLong: 4, sacks: 3,
          fumbles: 1, passingAvg: 13.9, rating: 84.7, rushingAvg: 4
        },
        bigPlays: [
          '16 yard passing touchdown'
        ] },
      { week:  5, date: '2028-10-08', kickoff: null,
        opponent: 'Atlanta Falcons', home: true, conference: false, division: true,
        result: { teamScore: 29, opponentScore: 13 }, booster: 'boost-1-5',
        stats: {
          completions: 30, attempts: 40, passingYards: 351,
          passingYac: 156, passingTd: 2, interceptions: 1, carries: 4,
          rushingYards: 6, rushingTd: 0, rushingLong: 7, sacks: 4,
          fumbles: 0, passingAvg: 11.7, rating: 107.4, rushingAvg: 1.5
        },
        bigPlays: [
          '39 yard passing touchdown',
          '7 yard passing touchdown'
        ] },
      { week:  6, date: '2028-10-15', kickoff: null,
        opponent: 'Houston Texans', home: true, conference: false,
        result: { teamScore: 34, opponentScore: 27 }, booster: 'boost-1-5',
        stats: {
          completions: 29, attempts: 45, passingYards: 391,
          passingYac: 129, passingTd: 2, interceptions: 2, carries: 2,
          rushingYards: 15, rushingTd: 0, rushingLong: 8, sacks: 0,
          fumbles: 0, passingAvg: 13.5, rating: 88.3, rushingAvg: 7.5
        },
        bigPlays: [
          '13 yard passing touchdown',
          '1 yard passing touchdown'
        ] },
      { week:  7, date: '2028-10-22', kickoff: null,
        opponent: 'Indianapolis Colts', home: false, conference: false,
        result: { teamScore: 35, opponentScore: 13 }, booster: null,
        stats: {
          completions: 27, attempts: 35, passingYards: 296,
          passingYac: 75, passingTd: 3, interceptions: 0, carries: 4,
          rushingYards: 1, rushingTd: 0, rushingLong: 2, sacks: 2,
          fumbles: 0, passingAvg: 11, rating: 130.2, rushingAvg: 0.3
        },
        bigPlays: [
          '11 yard passing touchdown',
          '4 yard passing touchdown',
          '39 yard passing touchdown'
        ] },
      { week:  8, date: '2028-10-29', kickoff: null,
        opponent: 'New York Giants', home: true, conference: false,
        result: { teamScore: 30, opponentScore: 23 }, booster: 'boost-2-5',
        stats: {
          completions: 26, attempts: 34, passingYards: 364,
          passingYac: 69, passingTd: 3, interceptions: 1, carries: 2,
          rushingYards: -2, rushingTd: 0, rushingLong: 0, sacks: 3,
          fumbles: 0, passingAvg: 14, rating: 127.6, rushingAvg: -1
        },
        bigPlays: [
          '25 yard passing touchdown',
          '7 yard passing touchdown',
          '16 yard game-winning passing touchdown'
        ] },
      { week:  9, date: '2028-11-05', kickoff: null,
        opponent: 'Jacksonville Jaguars', home: false, conference: false,
        result: { teamScore: 25, opponentScore: 22 }, booster: null,
        stats: {
          completions: 24, attempts: 31, passingYards: 239,
          passingYac: 108, passingTd: 3, interceptions: 1, carries: 2,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, sacks: 6,
          fumbles: 0, passingAvg: 10, rating: 117.5, rushingAvg: 0
        },
        bigPlays: [
          '7 yard passing touchdown',
          '40 yard passing touchdown',
          '32 yard game-winning passing touchdown'
        ] },
      { week: 10, date: '2028-11-12', kickoff: null,
        opponent: 'San Francisco 49ers', home: false, conference: false,
        result: { teamScore: 14, opponentScore: 15 }, booster: null,
        stats: {
          completions: 25, attempts: 40, passingYards: 175,
          passingYac: 92, passingTd: 1, interceptions: 1, carries: 2,
          rushingYards: 2, rushingTd: 0, rushingLong: 2, sacks: 1,
          fumbles: 0, passingAvg: 7, rating: 70.3, rushingAvg: 1
        },
        bigPlays: [
          '8 yard passing touchdown'
        ] },
      { week: 11, date: '2028-11-19', kickoff: null,
        opponent: 'Atlanta Falcons', home: false, conference: false, division: true,
        result: { teamScore: 37, opponentScore: 10 }, booster: 'wager-for', line: -7.5,
        stats: {
          completions: 25, attempts: 42, passingYards: 297,
          passingYac: 105, passingTd: 1, interceptions: 1, carries: 4,
          rushingYards: 2, rushingTd: 0, rushingLong: 3, sacks: 1,
          fumbles: 0, passingAvg: 11.9, rating: 79.2, rushingAvg: 0.5
        },
        bigPlays: [
          '25 yard passing touchdown'
        ] },
      { week: 12, date: '2028-11-26', kickoff: null,
        opponent: 'Tennessee Titans', home: true, conference: false,
        result: { teamScore: 37, opponentScore: 36 }, booster: null,
        stats: {
          completions: 32, attempts: 46, passingYards: 428,
          passingYac: 115, passingTd: 5, interceptions: 1, carries: 1,
          rushingYards: 2, rushingTd: 0, rushingLong: 0, sacks: 3,
          fumbles: 0, passingAvg: 13.4, rating: 126, rushingAvg: 2
        },
        bigPlays: [
          '14 yard passing touchdown',
          '42 yard passing touchdown',
          '10 yard passing touchdown',
          '22 yard passing touchdown',
          '10 yard game-winning passing touchdown'
        ] },
      { week: 13, date: '2028-12-03', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week: 14, date: '2028-12-10', kickoff: null,
        opponent: 'Green Bay Packers', home: false, conference: false,
        result: { teamScore: 16, opponentScore: 10 }, booster: null,
        stats: {
          completions: 18, attempts: 30, passingYards: 208,
          passingYac: 76, passingTd: 1, interceptions: 0, carries: 2,
          rushingYards: -2, rushingTd: 0, rushingLong: 0, sacks: 1,
          fumbles: 0, passingAvg: 11.6, rating: 92.1, rushingAvg: -1
        },
        bigPlays: [
          '23 yard passing touchdown'
        ] },
      { week: 15, date: '2028-12-17', kickoff: null,
        opponent: 'Seattle Seahawks', home: true, conference: false,
        result: { teamScore: 31, opponentScore: 10 }, booster: null,
        stats: {
          completions: 23, attempts: 32, passingYards: 189,
          passingYac: 63, passingTd: 0, interceptions: 0, carries: 4,
          rushingYards: 0, rushingTd: 0, rushingLong: 3, sacks: 0,
          fumbles: 0, passingAvg: 8.2, rating: 86.6, rushingAvg: 0
        } },
      { week: 16, date: '2028-12-24', kickoff: null,
        opponent: 'Carolina Panthers', home: false, conference: false, division: true,
        result: { teamScore: 21, opponentScore: 34 }, booster: 'boost-1-5',
        stats: {
          completions: 25, attempts: 44, passingYards: 269,
          passingYac: 74, passingTd: 2, interceptions: 0, carries: 1,
          rushingYards: 2, rushingTd: 0, rushingLong: 2, sacks: 3,
          fumbles: 0, passingAvg: 10.8, rating: 90.1, rushingAvg: 2
        },
        bigPlays: [
          '14 yard passing touchdown',
          '16 yard passing touchdown'
        ] },
      { week: 17, date: '2028-12-31', kickoff: null,
        opponent: 'New Orleans Saints', home: true, conference: false, division: true,
        result: { teamScore: 13, opponentScore: 14 }, booster: null,
        stats: {
          completions: 28, attempts: 45, passingYards: 288,
          passingYac: 98, passingTd: 1, interceptions: 1, carries: 1,
          rushingYards: 1, rushingTd: 0, rushingLong: 0, sacks: 3,
          fumbles: 0, passingAvg: 10.3, rating: 78.8, rushingAvg: 1
        },
        bigPlays: [
          '21 yard passing touchdown'
        ] },
      { week: 18, date: '2029-01-07', kickoff: null,
        opponent: 'Los Angeles Rams', home: true, conference: false,
        result: { teamScore: 17, opponentScore: 20 }, booster: null,
        stats: {
          completions: 25, attempts: 37, passingYards: 241,
          passingYac: 93, passingTd: 2, interceptions: 2, carries: 1,
          rushingYards: 1, rushingTd: 0, rushingLong: 0, sacks: 2,
          fumbles: 0, passingAvg: 9.6, rating: 81, rushingAvg: 1
        },
        bigPlays: [
          '12 yard passing touchdown',
          '15 yard passing touchdown'
        ] },
      { week: 19, date: '2029-01-13', kickoff: null,
        name: 'NFC Wild Card',
        opponent: 'Carolina Panthers', home: false, conference: false, playoff: true,
        result: { teamScore: 10, opponentScore: 17 }, booster: null,
        stats: {
          completions: 20, attempts: 32, passingYards: 186,
          passingYac: 53, passingTd: 1, interceptions: 3, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, sacks: 3,
          fumbles: 0, passingAvg: 9.3, rating: 49.7
        },
        bigPlays: [
          '2 yard passing touchdown'
        ] },
    ],

    /* Sam Stogsdill — Pittsburgh Steelers */
    'sam-stogsdill': [
      { week:  1, date: '2028-09-10', kickoff: null,
        opponent: 'Chicago Bears', home: true, conference: false,
        result: { teamScore: 48, opponentScore: 17 }, booster: 'boost-1-5',
        stats: {
          carries: 26, rushingYards: 154, rushingTd: 3, rushingLong: 29,
          receptions: 5, receivingYards: 20, receivingYac: 9,
          receivingTd: 0, receivingLong: 11, targets: 6, fumbles: 0,
          rushingAvg: 5.9, receivingAvg: 4, totalYards: 174, totalTd: 3
        },
        bigPlays: [
          '2 yard rushing touchdown',
          '3 yard rushing touchdown',
          '1 yard rushing touchdown'
        ] },
      { week:  2, date: '2028-09-17', kickoff: null,
        opponent: 'Minnesota Vikings', home: false, conference: false,
        result: { teamScore: 20, opponentScore: 9 }, booster: null,
        stats: {
          carries: 20, rushingYards: 130, rushingTd: 1, rushingLong: 31,
          receptions: 5, receivingYards: 23, receivingYac: 18,
          receivingTd: 0, receivingLong: 11, targets: 5, fumbles: 0,
          rushingAvg: 6.5, receivingAvg: 4.6, totalYards: 153, totalTd: 1
        },
        bigPlays: [
          '23 yard rushing touchdown'
        ] },
      { week:  3, date: '2028-09-24', kickoff: null,
        opponent: 'Baltimore Ravens', home: true, conference: false, division: true,
        result: { teamScore: 52, opponentScore: 0 }, booster: 'boost-2-5',
        stats: {
          carries: 29, rushingYards: 303, rushingTd: 3, rushingLong: 68,
          receptions: 5, receivingYards: 27, receivingYac: 21,
          receivingTd: 0, receivingLong: 13, targets: 7, fumbles: 0,
          rushingAvg: 10.4, receivingAvg: 5.4, totalYards: 330, totalTd: 3
        },
        bigPlays: [
          '3 yard rushing touchdown',
          '11 yard rushing touchdown',
          '68 yard rushing touchdown'
        ] },
      { week:  4, date: '2028-10-01', kickoff: null,
        opponent: 'San Francisco 49ers', home: false, conference: false,
        result: { teamScore: 16, opponentScore: 8 }, booster: null,
        stats: {
          carries: 20, rushingYards: 117, rushingTd: 0, rushingLong: 42,
          receptions: 2, receivingYards: 9, receivingYac: 8,
          receivingTd: 0, receivingLong: 5, targets: 2, fumbles: 0,
          rushingAvg: 5.9, receivingAvg: 4.5, totalYards: 126, totalTd: 0
        } },
      { week:  5, date: '2028-10-08', kickoff: null,
        opponent: 'Baltimore Ravens', home: false, conference: false, division: true,
        result: { teamScore: 10, opponentScore: 17 }, booster: null,
        stats: {
          carries: 13, rushingYards: 56, rushingTd: 0, rushingLong: 19,
          receptions: 7, receivingYards: 122, receivingYac: 102,
          receivingTd: 0, receivingLong: 56, targets: 8, fumbles: 0,
          rushingAvg: 4.3, receivingAvg: 17.4, totalYards: 178, totalTd: 0
        } },
      { week:  6, date: '2028-10-15', kickoff: null,
        opponent: 'Buffalo Bills', home: true, conference: false,
        result: { teamScore: 16, opponentScore: 20 }, booster: null,
        stats: {
          carries: 17, rushingYards: 100, rushingTd: 2, rushingLong: 15,
          receptions: 3, receivingYards: 14, receivingYac: 7,
          receivingTd: 0, receivingLong: 7, targets: 5, fumbles: 0,
          rushingAvg: 5.9, receivingAvg: 4.7, totalYards: 114, totalTd: 2
        },
        bigPlays: [
          '3 yard rushing touchdown',
          '15 yard rushing touchdown'
        ] },
      { week:  7, date: '2028-10-22', kickoff: null,
        opponent: 'Miami Dolphins', home: false, conference: false,
        result: { teamScore: 38, opponentScore: 10 }, booster: 'boost-1-5',
        stats: {
          carries: 25, rushingYards: 164, rushingTd: 2, rushingLong: 18,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 2, fumbles: 1,
          rushingAvg: 6.6, totalYards: 164, totalTd: 2
        },
        bigPlays: [
          '14 yard rushing touchdown',
          '3 yard rushing touchdown'
        ] },
      { week:  8, date: '2028-10-29', kickoff: null,
        opponent: 'Cincinnati Bengals', home: false, conference: false, division: true,
        result: { teamScore: 24, opponentScore: 16 }, booster: 'boost-2-0',
        stats: {
          carries: 26, rushingYards: 135, rushingTd: 1, rushingLong: 20,
          receptions: 1, receivingYards: 19, receivingYac: 14,
          receivingTd: 0, receivingLong: 19, targets: 2, fumbles: 0,
          rushingAvg: 5.2, receivingAvg: 19, totalYards: 154, totalTd: 1
        },
        bigPlays: [
          '6 yard rushing touchdown'
        ] },
      { week:  9, date: '2028-11-05', kickoff: null,
        opponent: 'Houston Texans', home: true, conference: false,
        result: { teamScore: 20, opponentScore: 24 }, booster: null,
        stats: {
          carries: 18, rushingYards: 90, rushingTd: 1, rushingLong: 34,
          receptions: 6, receivingYards: 48, receivingYac: 30,
          receivingTd: 0, receivingLong: 25, targets: 7, fumbles: 0,
          rushingAvg: 5, receivingAvg: 8, totalYards: 138, totalTd: 1
        },
        bigPlays: [
          '3 yard rushing touchdown'
        ] },
      { week: 10, date: '2028-11-12', kickoff: null,
        opponent: 'New York Jets', home: false, conference: false,
        result: { teamScore: 33, opponentScore: 38 }, booster: null,
        stats: {
          carries: 25, rushingYards: 140, rushingTd: 2, rushingLong: 31,
          receptions: 6, receivingYards: 49, receivingYac: 29,
          receivingTd: 1, receivingLong: 20, targets: 8, fumbles: 0,
          rushingAvg: 5.6, receivingAvg: 8.2, totalYards: 189, totalTd: 3
        },
        bigPlays: [
          '2 yard rushing touchdown',
          '31 yard rushing touchdown',
          '2 yard receiving touchdown'
        ] },
      { week: 11, date: '2028-11-19', kickoff: null,
        opponent: 'Green Bay Packers', home: false, conference: false,
        result: { teamScore: 24, opponentScore: 21 }, booster: null,
        stats: {
          carries: 24, rushingYards: 104, rushingTd: 1, rushingLong: 34,
          receptions: 4, receivingYards: 20, receivingYac: 9,
          receivingTd: 1, receivingLong: 8, targets: 4, fumbles: 1,
          rushingAvg: 4.3, receivingAvg: 5, totalYards: 124, totalTd: 2
        },
        bigPlays: [
          '6 yard rushing touchdown',
          '1 yard game-winning receiving touchdown'
        ] },
      { week: 12, date: '2028-11-26', kickoff: null,
        opponent: 'Las Vegas Raiders', home: false, conference: false,
        result: { teamScore: 33, opponentScore: 28 }, booster: null,
        stats: {
          carries: 27, rushingYards: 127, rushingTd: 1, rushingLong: 30,
          receptions: 2, receivingYards: 11, receivingYac: 11,
          receivingTd: 0, receivingLong: 9, targets: 3, fumbles: 0,
          rushingAvg: 4.7, receivingAvg: 5.5, totalYards: 138, totalTd: 1
        },
        bigPlays: [
          '5 yard rushing touchdown'
        ] },
      { week: 13, date: '2028-12-03', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week: 14, date: '2028-12-10', kickoff: null,
        opponent: 'Cleveland Browns', home: false, conference: false, division: true,
        result: { teamScore: 29, opponentScore: 26 }, booster: null,
        stats: {
          carries: 25, rushingYards: 172, rushingTd: 2, rushingLong: 41,
          receptions: 2, receivingYards: 36, receivingYac: 32,
          receivingTd: 1, receivingLong: 18, targets: 4, fumbles: 1,
          rushingAvg: 6.9, receivingAvg: 18, totalYards: 208, totalTd: 3
        },
        bigPlays: [
          '18 yard receiving touchdown',
          '3 yard game-winning rushing touchdown',
          '14 yard rushing touchdown'
        ] },
      { week: 15, date: '2028-12-17', kickoff: null,
        opponent: 'Cincinnati Bengals', home: true, conference: false, division: true,
        result: { teamScore: 27, opponentScore: 26 }, booster: 'boost-1-5',
        stats: {
          carries: 25, rushingYards: 143, rushingTd: 0, rushingLong: 18,
          receptions: 6, receivingYards: 38, receivingYac: 14,
          receivingTd: 1, receivingLong: 20, targets: 8, fumbles: 0,
          rushingAvg: 5.7, receivingAvg: 6.3, totalYards: 181, totalTd: 1
        },
        bigPlays: [
          '4 yard receiving touchdown'
        ] },
      { week: 16, date: '2028-12-24', kickoff: null,
        opponent: 'New England Patriots', home: true, conference: false,
        result: { teamScore: 22, opponentScore: 6 }, booster: null,
        stats: {
          carries: 25, rushingYards: 129, rushingTd: 1, rushingLong: 33,
          receptions: 7, receivingYards: 91, receivingYac: 53,
          receivingTd: 0, receivingLong: 33, targets: 8, fumbles: 0,
          rushingAvg: 5.2, receivingAvg: 13, totalYards: 220, totalTd: 1
        },
        bigPlays: [
          '3 yard rushing touchdown'
        ] },
      { week: 17, date: '2028-12-31', kickoff: null,
        opponent: 'Cleveland Browns', home: true, conference: false, division: true,
        result: { teamScore: 23, opponentScore: 21 }, booster: null,
        stats: {
          carries: 26, rushingYards: 110, rushingTd: 1, rushingLong: 15,
          receptions: 7, receivingYards: 67, receivingYac: 52,
          receivingTd: 0, receivingLong: 13, targets: 10, fumbles: 0,
          rushingAvg: 4.2, receivingAvg: 9.6, totalYards: 177, totalTd: 1
        },
        bigPlays: [
          '3 yard game-winning rushing touchdown'
        ] },
      { week: 18, date: '2029-01-07', kickoff: null,
        opponent: 'Detroit Lions', home: true, conference: false,
        result: { teamScore: 34, opponentScore: 17 }, booster: null,
        stats: {
          carries: 22, rushingYards: 100, rushingTd: 1, rushingLong: 15,
          receptions: 8, receivingYards: 81, receivingYac: 49,
          receivingTd: 1, receivingLong: 18, targets: 13, fumbles: 0,
          rushingAvg: 4.5, receivingAvg: 10.1, totalYards: 181, totalTd: 2
        },
        bigPlays: [
          '7 yard rushing touchdown',
          '18 yard receiving touchdown'
        ] },
      { week: 19, date: '2029-01-13', kickoff: null,
        name: 'AFC Wild Card',
        opponent: 'Cincinnati Bengals', home: true, conference: false, playoff: true,
        result: { teamScore: 23, opponentScore: 41 }, booster: 'wager-for', line: -6.5,
        stats: {
          carries: 13, rushingYards: 52, rushingTd: 1, rushingLong: 16,
          receptions: 5, receivingYards: 63, receivingYac: 51,
          receivingTd: 0, receivingLong: 24, targets: 6, fumbles: 0,
          rushingAvg: 4, receivingAvg: 12.6, totalYards: 115, totalTd: 1
        },
        bigPlays: [
          '1 yard rushing touchdown'
        ] },
    ],

    /* Jaykeb Stewart — Houston Texans */
    'jaykeb-stewart': [
      { week:  1, date: '2028-09-10', kickoff: null,
        opponent: 'Jacksonville Jaguars', home: true, conference: false, division: true,
        result: { teamScore: 34, opponentScore: 24 }, booster: null,
        stats: {
          completions: 20, attempts: 34, passingYards: 297,
          passingYac: 103, passingTd: 1, interceptions: 0, carries: 13,
          rushingYards: 28, rushingTd: 1, rushingLong: 11, sacks: 1,
          fumbles: 0, passingAvg: 14.9, rating: 97.3, rushingAvg: 2.2
        },
        bigPlays: [
          '2 yard rushing touchdown',
          '26 yard game-winning passing touchdown'
        ] },
      { week:  2, date: '2028-09-17', kickoff: null,
        opponent: 'Las Vegas Raiders', home: false, conference: false,
        result: { teamScore: 31, opponentScore: 20 }, booster: null,
        stats: {
          completions: 28, attempts: 39, passingYards: 305,
          passingYac: 105, passingTd: 2, interceptions: 0, carries: 10,
          rushingYards: 15, rushingTd: 0, rushingLong: 5, sacks: 0,
          fumbles: 0, passingAvg: 10.9, rating: 111.6, rushingAvg: 1.5
        },
        bigPlays: [
          '15 yard passing touchdown',
          '8 yard passing touchdown'
        ] },
      { week:  3, date: '2028-09-24', kickoff: null,
        opponent: 'Carolina Panthers', home: true, conference: false,
        result: { teamScore: 44, opponentScore: 31 }, booster: 'boost-1-5',
        stats: {
          completions: 27, attempts: 38, passingYards: 286,
          passingYac: 85, passingTd: 2, interceptions: 0, carries: 4,
          rushingYards: 5, rushingTd: 1, rushingLong: 4, sacks: 1,
          fumbles: 0, passingAvg: 10.6, rating: 110.2, rushingAvg: 1.3
        },
        bigPlays: [
          '4 yard rushing touchdown',
          '17 yard passing touchdown',
          '9 yard passing touchdown'
        ] },
      { week:  4, date: '2028-10-01', kickoff: null,
        opponent: 'New York Giants', home: false, conference: false,
        result: { teamScore: 28, opponentScore: 41 }, booster: null,
        stats: {
          completions: 29, attempts: 38, passingYards: 350,
          passingYac: 108, passingTd: 2, interceptions: 1, carries: 3,
          rushingYards: 27, rushingTd: 0, rushingLong: 23, sacks: 0,
          fumbles: 0, passingAvg: 12.1, rating: 110.6, rushingAvg: 9
        },
        bigPlays: [
          '32 yard passing touchdown',
          '11 yard passing touchdown'
        ] },
      { week:  5, date: '2028-10-08', kickoff: null,
        opponent: 'Jacksonville Jaguars', home: false, conference: false, division: true,
        result: { teamScore: 37, opponentScore: 7 }, booster: null,
        stats: {
          completions: 27, attempts: 39, passingYards: 322,
          passingYac: 141, passingTd: 1, interceptions: 1, carries: 9,
          rushingYards: 66, rushingTd: 0, rushingLong: 23, sacks: 2,
          fumbles: 0, passingAvg: 11.9, rating: 92, rushingAvg: 7.3
        },
        bigPlays: [
          '6 yard passing touchdown'
        ] },
      { week:  6, date: '2028-10-15', kickoff: null,
        opponent: 'Tampa Bay Buccaneers', home: false, conference: false,
        result: { teamScore: 27, opponentScore: 34 }, booster: null,
        stats: {
          completions: 26, attempts: 36, passingYards: 265,
          passingYac: 101, passingTd: 2, interceptions: 2, carries: 7,
          rushingYards: 78, rushingTd: 0, rushingLong: 25, sacks: 1,
          fumbles: 0, passingAvg: 10.2, rating: 88.3, rushingAvg: 11.1
        },
        bigPlays: [
          '7 yard passing touchdown',
          '22 yard passing touchdown'
        ] },
      { week:  7, date: '2028-10-22', kickoff: null,
        opponent: 'Tennessee Titans', home: true, conference: false, division: true,
        result: { teamScore: 41, opponentScore: 6 }, booster: null,
        stats: {
          completions: 26, attempts: 35, passingYards: 305,
          passingYac: 166, passingTd: 3, interceptions: 0, carries: 10,
          rushingYards: 53, rushingTd: 1, rushingLong: 18, sacks: 1,
          fumbles: 0, passingAvg: 11.7, rating: 128.9, rushingAvg: 5.3
        },
        bigPlays: [
          '1 yard passing touchdown',
          '1 yard rushing touchdown',
          '4 yard passing touchdown',
          '25 yard passing touchdown'
        ] },
      { week:  8, date: '2028-10-29', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week:  9, date: '2028-11-05', kickoff: null,
        opponent: 'Pittsburgh Steelers', home: false, conference: false,
        result: { teamScore: 24, opponentScore: 20 }, booster: null,
        stats: {
          completions: 16, attempts: 31, passingYards: 202,
          passingYac: 67, passingTd: 2, interceptions: 0, carries: 5,
          rushingYards: 7, rushingTd: 0, rushingLong: 7, sacks: 0,
          fumbles: 0, passingAvg: 12.6, rating: 93.8, rushingAvg: 1.4
        },
        bigPlays: [
          '6 yard passing touchdown',
          '11 yard game-winning passing touchdown'
        ] },
      { week: 10, date: '2028-11-12', kickoff: null,
        opponent: 'New England Patriots', home: true, conference: false,
        result: { teamScore: 26, opponentScore: 20 }, booster: null,
        stats: {
          completions: 23, attempts: 28, passingYards: 287,
          passingYac: 61, passingTd: 1, interceptions: 0, carries: 7,
          rushingYards: 20, rushingTd: 1, rushingLong: 6, sacks: 1,
          fumbles: 0, passingAvg: 12.5, rating: 121.3, rushingAvg: 2.9
        },
        bigPlays: [
          '6 yard rushing touchdown',
          '5 yard passing touchdown'
        ] },
      { week: 11, date: '2028-11-19', kickoff: null,
        opponent: 'New Orleans Saints', home: false, conference: false,
        result: { teamScore: 31, opponentScore: 20 }, booster: null,
        stats: {
          completions: 27, attempts: 36, passingYards: 419,
          passingYac: 215, passingTd: 2, interceptions: 1, carries: 4,
          rushingYards: 10, rushingTd: 0, rushingLong: 8, sacks: 0,
          fumbles: 0, passingAvg: 15.5, rating: 120, rushingAvg: 2.5
        },
        bigPlays: [
          '65 yard passing touchdown',
          '28 yard passing touchdown'
        ] },
      { week: 12, date: '2028-11-26', kickoff: null,
        opponent: 'Los Angeles Chargers', home: false, conference: false,
        result: { teamScore: 29, opponentScore: 0 }, booster: null,
        stats: {
          completions: 25, attempts: 36, passingYards: 211,
          passingYac: 62, passingTd: 2, interceptions: 0, carries: 6,
          rushingYards: 28, rushingTd: 0, rushingLong: 17, sacks: 2,
          fumbles: 0, passingAvg: 8.4, rating: 102.9, rushingAvg: 4.7
        },
        bigPlays: [
          '11 yard passing touchdown',
          '17 yard passing touchdown'
        ] },
      { week: 13, date: '2028-12-03', kickoff: null,
        opponent: 'Indianapolis Colts', home: false, conference: false, division: true,
        result: { teamScore: 27, opponentScore: 17 }, booster: null,
        stats: {
          completions: 23, attempts: 29, passingYards: 279,
          passingYac: 82, passingTd: 2, interceptions: 1, carries: 8,
          rushingYards: 42, rushingTd: 0, rushingLong: 20, sacks: 1,
          fumbles: 0, passingAvg: 12.1, rating: 115.4, rushingAvg: 5.3
        },
        bigPlays: [
          '19 yard passing touchdown',
          '11 yard game-winning passing touchdown'
        ] },
      { week: 14, date: '2028-12-10', kickoff: null,
        opponent: 'Atlanta Falcons', home: true, conference: false,
        result: { teamScore: 16, opponentScore: 6 }, booster: null,
        stats: {
          completions: 28, attempts: 35, passingYards: 238,
          passingYac: 57, passingTd: 0, interceptions: 0, carries: 9,
          rushingYards: 23, rushingTd: 0, rushingLong: 6, sacks: 0,
          fumbles: 0, passingAvg: 8.5, rating: 95, rushingAvg: 2.6
        } },
      { week: 15, date: '2028-12-17', kickoff: null,
        opponent: 'Indianapolis Colts', home: true, conference: false, division: true, overtime: true,
        result: { teamScore: 27, opponentScore: 24 }, booster: null,
        stats: {
          completions: 21, attempts: 39, passingYards: 357,
          passingYac: 144, passingTd: 2, interceptions: 0, carries: 9,
          rushingYards: 30, rushingTd: 0, rushingLong: 7, sacks: 2,
          fumbles: 0, passingAvg: 17, rating: 102.2, rushingAvg: 3.3
        },
        bigPlays: [
          '43 yard passing touchdown',
          '6 yard passing touchdown'
        ] },
      { week: 16, date: '2028-12-24', kickoff: null,
        opponent: 'Kansas City Chiefs', home: true, conference: false,
        result: { teamScore: 21, opponentScore: 18 }, booster: null,
        stats: {
          completions: 22, attempts: 29, passingYards: 216,
          passingYac: 101, passingTd: 3, interceptions: 0, carries: 8,
          rushingYards: 29, rushingTd: 0, rushingLong: 9, sacks: 1,
          fumbles: 0, passingAvg: 9.8, rating: 130.8, rushingAvg: 3.6
        },
        bigPlays: [
          '4 yard passing touchdown',
          '9 yard passing touchdown',
          '3 yard game-winning passing touchdown'
        ] },
      { week: 17, date: '2028-12-31', kickoff: null,
        opponent: 'Denver Broncos', home: true, conference: false,
        result: { teamScore: 30, opponentScore: 14 }, booster: null,
        stats: {
          completions: 27, attempts: 35, passingYards: 249,
          passingYac: 94, passingTd: 2, interceptions: 1, carries: 8,
          rushingYards: 12, rushingTd: 1, rushingLong: 6, sacks: 0,
          fumbles: 0, passingAvg: 9.2, rating: 103.2, rushingAvg: 1.5
        },
        bigPlays: [
          '16 yard passing touchdown',
          '6 yard rushing touchdown',
          '5 yard passing touchdown'
        ] },
      { week: 18, date: '2029-01-07', kickoff: null,
        opponent: 'Tennessee Titans', home: false, conference: false, division: true,
        result: { teamScore: 39, opponentScore: 26 }, booster: null,
        stats: {
          completions: 32, attempts: 39, passingYards: 336,
          passingYac: 111, passingTd: 4, interceptions: 0, carries: 5,
          rushingYards: 9, rushingTd: 0, rushingLong: 5, sacks: 1,
          fumbles: 1, passingAvg: 10.5, rating: 136.8, rushingAvg: 1.8
        },
        bigPlays: [
          '54 yard passing touchdown',
          '2 yard passing touchdown',
          '11 yard passing touchdown',
          '7 yard passing touchdown'
        ] },
      { week: 20, date: '2029-01-20', kickoff: null,
        name: 'AFC Divisional Round',
        opponent: 'Cincinnati Bengals', home: true, conference: false, playoff: true,
        result: { teamScore: 26, opponentScore: 21 }, booster: null,
        stats: {
          completions: 24, attempts: 34, passingYards: 247,
          passingYac: 95, passingTd: 2, interceptions: 0, carries: 5,
          rushingYards: 9, rushingTd: 0, rushingLong: 8, sacks: 1,
          fumbles: 0, passingAvg: 10.3, rating: 110.8, rushingAvg: 1.8
        },
        bigPlays: [
          '2 yard passing touchdown',
          '11 yard passing touchdown'
        ] },
      { week: 21, date: '2029-01-28', kickoff: null,
        name: 'AFC Championship',
        opponent: 'Baltimore Ravens', home: true, conference: false, playoff: true,
        result: { teamScore: 37, opponentScore: 24 }, booster: null,
        stats: {
          completions: 27, attempts: 36, passingYards: 320,
          passingYac: 97, passingTd: 3, interceptions: 2, carries: 6,
          rushingYards: 26, rushingTd: 0, rushingLong: 13, sacks: 0,
          fumbles: 0, passingAvg: 11.9, rating: 106.3, rushingAvg: 4.3
        },
        bigPlays: [
          '6 yard passing touchdown',
          '27 yard passing touchdown',
          '25 yard passing touchdown'
        ] },
      { week: 22, date: '2029-02-11', kickoff: null,
        name: 'Super Bowl LXIII',
        opponent: 'Chicago Bears', home: false, conference: false, neutral: true, playoff: true,
        result: { teamScore: 24, opponentScore: 20 }, booster: null,
        stats: {
          completions: 35, attempts: 42, passingYards: 360,
          passingYac: 128, passingTd: 3, interceptions: 0, carries: 4,
          rushingYards: 26, rushingTd: 0, rushingLong: 21, sacks: 2,
          fumbles: 0, passingAvg: 10.3, rating: 126.2, rushingAvg: 6.5
        },
        bigPlays: [
          '10 yard passing touchdown',
          '1 yard passing touchdown',
          '20 yard game-winning passing touchdown'
        ] },
    ],
  }
};
