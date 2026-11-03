/* ==========================================================================
   EGE Football — the 2027 season
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

EGE.stats[2027] = {
  season: 2027,
  level: 'NFL',

  /* Weeks the NFL Sim tab stored, written in here, and when each was
     saved: a stored week saved after this replaces the file's. */
  stored: {
    1: '2026-10-31T00:50:53.510Z',
    2: '2026-10-31T01:52:21.146Z',
    3: '2026-10-31T02:23:01.859Z',
    4: '2026-10-31T05:54:20.064Z',
    5: '2026-10-31T18:23:16.200Z',
    6: '2026-10-31T18:43:52.625Z',
    7: '2026-11-01T02:43:14.750Z',
    8: '2026-11-01T14:25:22.869Z',
    9: '2026-11-01T18:26:18.846Z',
    10: '2026-11-02T03:06:04.805Z',
    11: '2026-11-02T13:17:07.190Z',
    12: '2026-11-02T19:32:23.974Z',
    13: '2026-11-02T20:26:55.907Z',
    14: '2026-11-02T21:17:27.026Z',
    15: '2026-11-02T22:35:35.495Z',
    16: '2026-11-02T23:46:34.150Z',
    17: '2026-11-03T02:56:29.515Z',
    18: '2026-11-03T03:16:02.667Z',
    19: '2026-11-03T03:36:17.744Z',
    20: '2026-11-03T07:39:53.181Z',
    21: '2026-11-03T15:39:48.575Z',
    22: '2026-11-03T19:47:19.072Z'
  },

  games: {

    /* Andrew Parr — Carolina Panthers */
    'andrew-parr': [
      { week:  1, date: '2027-09-12', kickoff: null,
        opponent: 'Cincinnati Bengals', home: true, conference: false,
        result: { teamScore: 34, opponentScore: 29 }, booster: null,
        stats: {
          receptions: 7, receivingYards: 99, receivingYac: 20,
          receivingTd: 2, receivingLong: 30, targets: 10, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 14.1, totalYards: 99, totalTd: 2
        },
        bigPlays: [
          '30 yard receiving touchdown',
          '19 yard game-winning receiving touchdown'
        ] },
      { week:  2, date: '2027-09-19', kickoff: null,
        opponent: 'Denver Broncos', home: true, conference: false,
        result: { teamScore: 33, opponentScore: 17 }, booster: null,
        stats: {
          receptions: 9, receivingYards: 82, receivingYac: 17,
          receivingTd: 1, receivingLong: 21, targets: 10, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 9.1, totalYards: 82, totalTd: 1
        },
        bigPlays: [
          '7 yard receiving touchdown'
        ] },
      { week:  3, date: '2027-09-26', kickoff: null,
        opponent: 'Tampa Bay Buccaneers', home: false, conference: false, division: true, overtime: true,
        result: { teamScore: 34, opponentScore: 28 }, booster: 'boost-2-0',
        stats: {
          receptions: 8, receivingYards: 74, receivingYac: 18,
          receivingTd: 1, receivingLong: 19, targets: 11, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 9.3, totalYards: 74, totalTd: 1
        },
        bigPlays: [
          '19 yard game-winning receiving touchdown'
        ] },
      { week:  4, date: '2027-10-03', kickoff: null,
        opponent: 'Kansas City Chiefs', home: false, conference: false,
        result: { teamScore: 25, opponentScore: 38 }, booster: 'wager-for', line: 4.5,
        stats: {
          receptions: 9, receivingYards: 94, receivingYac: 38,
          receivingTd: 0, receivingLong: 19, targets: 14, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 10.4, totalYards: 94, totalTd: 0
        } },
      { week:  5, date: '2027-10-10', kickoff: null,
        opponent: 'Las Vegas Raiders', home: false, conference: false,
        result: { teamScore: 16, opponentScore: 27 }, booster: null,
        stats: {
          receptions: 8, receivingYards: 87, receivingYac: 22,
          receivingTd: 0, receivingLong: 16, targets: 10, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 10.9, totalYards: 87, totalTd: 0
        } },
      { week:  6, date: '2027-10-17', kickoff: null,
        opponent: 'Chicago Bears', home: false, conference: false,
        result: { teamScore: 19, opponentScore: 3 }, booster: 'wager-for', line: 6.5,
        stats: {
          receptions: 9, receivingYards: 111, receivingYac: 31,
          receivingTd: 0, receivingLong: 24, targets: 12, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 12.3, totalYards: 111, totalTd: 0
        } },
      { week:  7, date: '2027-10-24', kickoff: null,
        opponent: 'Atlanta Falcons', home: true, conference: false, division: true,
        result: { teamScore: 27, opponentScore: 17 }, booster: null,
        stats: {
          receptions: 7, receivingYards: 81, receivingYac: 21,
          receivingTd: 1, receivingLong: 21, targets: 8, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 11.6, totalYards: 81, totalTd: 1
        },
        bigPlays: [
          '1 yard receiving touchdown'
        ] },
      { week:  8, date: '2027-10-31', kickoff: null,
        opponent: 'Los Angeles Chargers', home: true, conference: false,
        result: { teamScore: 20, opponentScore: 3 }, booster: 'boost-1-5',
        stats: {
          receptions: 13, receivingYards: 124, receivingYac: 42,
          receivingTd: 0, receivingLong: 20, targets: 14, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 9.5, totalYards: 124, totalTd: 0
        } },
      { week:  9, date: '2027-11-07', kickoff: null,
        opponent: 'Detroit Lions', home: true, conference: false,
        result: { teamScore: 24, opponentScore: 9 }, booster: 'boost-1-5',
        stats: {
          receptions: 7, receivingYards: 61, receivingYac: 21,
          receivingTd: 1, receivingLong: 19, targets: 7, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 8.7, totalYards: 61, totalTd: 1
        },
        bigPlays: [
          '5 yard receiving touchdown'
        ] },
      { week: 10, date: '2027-11-14', kickoff: null,
        opponent: 'Arizona Cardinals', home: false, conference: false,
        result: { teamScore: 21, opponentScore: 17 }, booster: null,
        stats: {
          receptions: 6, receivingYards: 104, receivingYac: 60,
          receivingTd: 0, receivingLong: 33, targets: 9, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 17.3, totalYards: 104, totalTd: 0
        } },
      { week: 11, date: '2027-11-21', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week: 12, date: '2027-11-28', kickoff: null,
        opponent: 'Tampa Bay Buccaneers', home: true, conference: false, division: true,
        result: { teamScore: 19, opponentScore: 25 }, booster: 'boost-2-5',
        stats: {
          receptions: 12, receivingYards: 135, receivingYac: 49,
          receivingTd: 1, receivingLong: 25, targets: 17, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 11.3, totalYards: 135, totalTd: 1
        },
        bigPlays: [
          '1 yard receiving touchdown'
        ] },
      { week: 13, date: '2027-12-05', kickoff: null,
        opponent: 'Washington Commanders', home: false, conference: false, overtime: true,
        result: { teamScore: 32, opponentScore: 26 }, booster: 'boost-2-5',
        stats: {
          receptions: 13, receivingYards: 83, receivingYac: 30,
          receivingTd: 2, receivingLong: 13, targets: 17, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 6.4, totalYards: 83, totalTd: 2
        },
        bigPlays: [
          '9 yard receiving touchdown',
          '12 yard receiving touchdown'
        ] },
      { week: 14, date: '2027-12-12', kickoff: null,
        opponent: 'New Orleans Saints', home: true, conference: false, division: true,
        result: { teamScore: 26, opponentScore: 38 }, booster: null,
        stats: {
          receptions: 7, receivingYards: 71, receivingYac: 29,
          receivingTd: 1, receivingLong: 16, targets: 8, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 10.1, totalYards: 71, totalTd: 1
        },
        bigPlays: [
          '12 yard receiving touchdown'
        ] },
      { week: 15, date: '2027-12-19', kickoff: null,
        opponent: 'Green Bay Packers', home: false, conference: false,
        result: { teamScore: 22, opponentScore: 13 }, booster: null,
        stats: {
          receptions: 3, receivingYards: 18, receivingYac: 15,
          receivingTd: 0, receivingLong: 15, targets: 5, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 6, totalYards: 18, totalTd: 0
        } },
      { week: 16, date: '2027-12-26', kickoff: null,
        opponent: 'Minnesota Vikings', home: true, conference: false,
        result: { teamScore: 22, opponentScore: 28 }, booster: null,
        stats: {
          receptions: 10, receivingYards: 116, receivingYac: 43,
          receivingTd: 1, receivingLong: 19, targets: 15, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 11.6, totalYards: 116, totalTd: 1
        },
        bigPlays: [
          '16 yard receiving touchdown'
        ] },
      { week: 17, date: '2028-01-02', kickoff: null,
        opponent: 'New Orleans Saints', home: false, conference: false, division: true,
        result: { teamScore: 22, opponentScore: 30 }, booster: null,
        stats: {
          receptions: 6, receivingYards: 118, receivingYac: 75,
          receivingTd: 2, receivingLong: 73, targets: 9, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 19.7, totalYards: 118, totalTd: 2
        },
        bigPlays: [
          '73 yard receiving touchdown',
          '2 yard receiving touchdown'
        ] },
      { week: 18, date: '2028-01-09', kickoff: null,
        opponent: 'Atlanta Falcons', home: false, conference: false, division: true,
        result: { teamScore: 25, opponentScore: 27 }, booster: null,
        stats: {
          receptions: 10, receivingYards: 109, receivingYac: 44,
          receivingTd: 1, receivingLong: 21, targets: 10, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 10.9, totalYards: 109, totalTd: 1
        },
        bigPlays: [
          '13 yard receiving touchdown'
        ] },
      { week: 19, date: '2028-01-15', kickoff: null,
        name: 'NFC Wild Card',
        opponent: 'Tampa Bay Buccaneers', home: false, conference: false, playoff: true,
        result: { teamScore: 5, opponentScore: 27 }, booster: null,
        stats: {
          receptions: 7, receivingYards: 53, receivingYac: 23,
          receivingTd: 0, receivingLong: 16, targets: 8, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 7.6, totalYards: 53, totalTd: 0
        } },
    ],

    /* Cooper Clark — Chicago Bears */
    'cooper-clark': [
      { week:  1, date: '2027-09-12', kickoff: null,
        opponent: 'Minnesota Vikings', home: true, conference: false, division: true,
        result: { teamScore: 29, opponentScore: 17 }, booster: null,
        stats: {
          carries: 9, rushingYards: 55, rushingTd: 0, rushingLong: 12,
          receptions: 4, receivingYards: 90, receivingYac: 71,
          receivingTd: 1, receivingLong: 67, targets: 5, fumbles: 0,
          rushingAvg: 6.1, receivingAvg: 22.5, totalYards: 145, totalTd: 1
        },
        bigPlays: [
          '67 yard receiving touchdown'
        ] },
      { week:  2, date: '2027-09-19', kickoff: null,
        opponent: 'Jacksonville Jaguars', home: false, conference: false,
        result: { teamScore: 41, opponentScore: 31 }, booster: null,
        stats: {
          carries: 19, rushingYards: 93, rushingTd: 2, rushingLong: 23,
          receptions: 4, receivingYards: 17, receivingYac: 17,
          receivingTd: 0, receivingLong: 11, targets: 4, fumbles: 0,
          rushingAvg: 4.9, receivingAvg: 4.3, totalYards: 110, totalTd: 2
        },
        bigPlays: [
          '1 yard rushing touchdown',
          '5 yard rushing touchdown'
        ] },
      { week:  3, date: '2027-09-26', kickoff: null,
        opponent: 'Buffalo Bills', home: false, conference: false, overtime: true,
        result: { teamScore: 36, opponentScore: 33 }, booster: null,
        stats: {
          carries: 19, rushingYards: 107, rushingTd: 0, rushingLong: 30,
          receptions: 6, receivingYards: 25, receivingYac: 13,
          receivingTd: 1, receivingLong: 10, targets: 6, fumbles: 0,
          rushingAvg: 5.6, receivingAvg: 4.2, totalYards: 132, totalTd: 1
        },
        bigPlays: [
          '4 yard receiving touchdown'
        ] },
      { week:  4, date: '2027-10-03', kickoff: null,
        opponent: 'Indianapolis Colts', home: false, conference: false,
        result: { teamScore: 28, opponentScore: 30 }, booster: null,
        stats: {
          carries: 12, rushingYards: 92, rushingTd: 1, rushingLong: 50,
          receptions: 5, receivingYards: 70, receivingYac: 50,
          receivingTd: 0, receivingLong: 37, targets: 7, fumbles: 0,
          rushingAvg: 7.7, receivingAvg: 14, totalYards: 162, totalTd: 1
        },
        bigPlays: [
          '11 yard rushing touchdown'
        ] },
      { week:  5, date: '2027-10-10', kickoff: null,
        opponent: 'Houston Texans', home: true, conference: false,
        result: { teamScore: 20, opponentScore: 26 }, booster: null,
        stats: {
          carries: 15, rushingYards: 121, rushingTd: 0, rushingLong: 20,
          receptions: 4, receivingYards: 28, receivingYac: 19,
          receivingTd: 0, receivingLong: 12, targets: 7, fumbles: 0,
          rushingAvg: 8.1, receivingAvg: 7, totalYards: 149, totalTd: 0
        } },
      { week:  6, date: '2027-10-17', kickoff: null,
        opponent: 'Carolina Panthers', home: true, conference: false,
        result: { teamScore: 3, opponentScore: 19 }, booster: null,
        stats: {
          carries: 15, rushingYards: 50, rushingTd: 0, rushingLong: 13,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 0,
          rushingAvg: 3.3, totalYards: 50, totalTd: 0
        } },
      { week:  7, date: '2027-10-24', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week:  8, date: '2027-10-31', kickoff: null,
        opponent: 'Tampa Bay Buccaneers', home: true, conference: false,
        result: { teamScore: 34, opponentScore: 17 }, booster: null,
        stats: {
          carries: 16, rushingYards: 70, rushingTd: 0, rushingLong: 30,
          receptions: 2, receivingYards: 9, receivingYac: 9,
          receivingTd: 0, receivingLong: 6, targets: 2, fumbles: 0,
          rushingAvg: 4.4, receivingAvg: 4.5, totalYards: 79, totalTd: 0
        } },
      { week:  9, date: '2027-11-07', kickoff: null,
        opponent: 'Washington Commanders', home: true, conference: false,
        result: { teamScore: 16, opponentScore: 17 }, booster: null,
        stats: {
          carries: 16, rushingYards: 60, rushingTd: 0, rushingLong: 10,
          receptions: 1, receivingYards: 2, receivingYac: 2,
          receivingTd: 0, receivingLong: 2, targets: 1, fumbles: 0,
          rushingAvg: 3.8, receivingAvg: 2, totalYards: 62, totalTd: 0
        } },
      { week: 10, date: '2027-11-14', kickoff: null,
        opponent: 'Detroit Lions', home: false, conference: false, division: true,
        result: { teamScore: 6, opponentScore: 19 }, booster: null,
        stats: {
          carries: 3, rushingYards: 9, rushingTd: 0, rushingLong: 7,
          receptions: 2, receivingYards: 13, receivingYac: 9,
          receivingTd: 0, receivingLong: 9, targets: 4, fumbles: 0,
          rushingAvg: 3, receivingAvg: 6.5, totalYards: 22, totalTd: 0
        } },
      { week: 11, date: '2027-11-21', kickoff: null,
        opponent: 'New Orleans Saints', home: false, conference: false,
        result: { teamScore: 55, opponentScore: 17 }, booster: null,
        stats: {
          carries: 15, rushingYards: 106, rushingTd: 0, rushingLong: 34,
          receptions: 4, receivingYards: 3, receivingYac: 3,
          receivingTd: 0, receivingLong: 4, targets: 4, fumbles: 0,
          rushingAvg: 7.1, receivingAvg: 0.8, totalYards: 109, totalTd: 0
        } },
      { week: 12, date: '2027-11-28', kickoff: null,
        opponent: 'Detroit Lions', home: true, conference: false, division: true,
        result: { teamScore: 20, opponentScore: 6 }, booster: null,
        stats: {
          carries: 18, rushingYards: 74, rushingTd: 1, rushingLong: 19,
          receptions: 3, receivingYards: 37, receivingYac: 29,
          receivingTd: 0, receivingLong: 17, targets: 3, fumbles: 0,
          rushingAvg: 4.1, receivingAvg: 12.3, totalYards: 111, totalTd: 1
        },
        bigPlays: [
          '7 yard rushing touchdown'
        ] },
      { week: 13, date: '2027-12-05', kickoff: null,
        opponent: 'Arizona Cardinals', home: true, conference: false,
        result: { teamScore: 41, opponentScore: 33 }, booster: null,
        stats: {
          carries: 14, rushingYards: 81, rushingTd: 1, rushingLong: 13,
          receptions: 7, receivingYards: 61, receivingYac: 48,
          receivingTd: 0, receivingLong: 17, targets: 7, fumbles: 1,
          rushingAvg: 5.8, receivingAvg: 8.7, totalYards: 142, totalTd: 1
        },
        bigPlays: [
          '7 yard rushing touchdown'
        ] },
      { week: 14, date: '2027-12-12', kickoff: null,
        opponent: 'Green Bay Packers', home: false, conference: false, division: true,
        result: { teamScore: 17, opponentScore: 29 }, booster: null,
        stats: {
          carries: 15, rushingYards: 58, rushingTd: 1, rushingLong: 10,
          receptions: 3, receivingYards: 27, receivingYac: 17,
          receivingTd: 0, receivingLong: 14, targets: 5, fumbles: 0,
          rushingAvg: 3.9, receivingAvg: 9, totalYards: 85, totalTd: 1
        },
        bigPlays: [
          '4 yard rushing touchdown'
        ] },
      { week: 15, date: '2027-12-19', kickoff: null,
        opponent: 'Tennessee Titans', home: true, conference: false,
        result: { teamScore: 19, opponentScore: 26 }, booster: null,
        stats: {
          carries: 20, rushingYards: 114, rushingTd: 1, rushingLong: 18,
          receptions: 2, receivingYards: 18, receivingYac: 5,
          receivingTd: 1, receivingLong: 16, targets: 4, fumbles: 0,
          rushingAvg: 5.7, receivingAvg: 9, totalYards: 132, totalTd: 2
        },
        bigPlays: [
          '6 yard rushing touchdown',
          '2 yard receiving touchdown'
        ] },
      { week: 16, date: '2027-12-26', kickoff: null,
        opponent: 'Green Bay Packers', home: true, conference: false, division: true,
        result: { teamScore: 23, opponentScore: 13 }, booster: 'wager-for', line: 2.5,
        stats: {
          carries: 21, rushingYards: 76, rushingTd: 0, rushingLong: 9,
          receptions: 1, receivingYards: 23, receivingYac: 23,
          receivingTd: 0, receivingLong: 23, targets: 1, fumbles: 0,
          rushingAvg: 3.6, receivingAvg: 23, totalYards: 99, totalTd: 0
        } },
      { week: 17, date: '2028-01-02', kickoff: null,
        opponent: 'Atlanta Falcons', home: false, conference: false,
        result: { teamScore: 19, opponentScore: 24 }, booster: null,
        stats: {
          carries: 9, rushingYards: 64, rushingTd: 1, rushingLong: 30,
          receptions: 2, receivingYards: 22, receivingYac: 14,
          receivingTd: 0, receivingLong: 12, targets: 3, fumbles: 0,
          rushingAvg: 7.1, receivingAvg: 11, totalYards: 86, totalTd: 1
        },
        bigPlays: [
          '3 yard rushing touchdown'
        ] },
      { week: 18, date: '2028-01-09', kickoff: null,
        opponent: 'Minnesota Vikings', home: false, conference: false, division: true,
        result: { teamScore: 21, opponentScore: 3 }, booster: 'wager-for', line: -6.5,
        stats: {
          carries: 20, rushingYards: 93, rushingTd: 0, rushingLong: 13,
          receptions: 1, receivingYards: 17, receivingYac: 13,
          receivingTd: 0, receivingLong: 17, targets: 3, fumbles: 0,
          rushingAvg: 4.7, receivingAvg: 17, totalYards: 110, totalTd: 0
        } },
      { week: 19, date: '2028-01-15', kickoff: null,
        name: 'NFC Wild Card',
        opponent: 'New York Giants', home: false, conference: false, playoff: true,
        result: { teamScore: 21, opponentScore: 28 }, booster: null,
        stats: {
          carries: 16, rushingYards: 69, rushingTd: 1, rushingLong: 17,
          receptions: 6, receivingYards: 43, receivingYac: 24,
          receivingTd: 1, receivingLong: 15, targets: 7, fumbles: 0,
          rushingAvg: 4.3, receivingAvg: 7.2, totalYards: 112, totalTd: 2
        },
        bigPlays: [
          '4 yard receiving touchdown',
          '8 yard rushing touchdown'
        ] },
    ],

    /* Paxon Hatch — New York Giants */
    'paxon-hatch': [
      { week:  1, date: '2027-09-12', kickoff: null,
        opponent: 'Philadelphia Eagles', home: true, conference: false, division: true,
        result: { teamScore: 20, opponentScore: 13 }, booster: null,
        stats: {
          receptions: 11, receivingYards: 111, receivingYac: 47,
          receivingTd: 1, receivingLong: 30, targets: 14, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 10.1, totalYards: 111, totalTd: 1
        },
        bigPlays: [
          '24 yard game-winning receiving touchdown'
        ] },
      { week:  2, date: '2027-09-19', kickoff: null,
        opponent: 'Baltimore Ravens', home: false, conference: false,
        result: { teamScore: 35, opponentScore: 6 }, booster: null,
        stats: {
          receptions: 7, receivingYards: 95, receivingYac: 33,
          receivingTd: 1, receivingLong: 22, targets: 8, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 13.6, totalYards: 95, totalTd: 1
        },
        bigPlays: [
          '7 yard receiving touchdown'
        ] },
      { week:  3, date: '2027-09-26', kickoff: null,
        opponent: 'San Francisco 49ers', home: true, conference: false, overtime: true,
        result: { teamScore: 26, opponentScore: 32 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 43, receivingYac: 25,
          receivingTd: 0, receivingLong: 26, targets: 5, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 8.6, totalYards: 43, totalTd: 0
        } },
      { week:  4, date: '2027-10-03', kickoff: null,
        opponent: 'Seattle Seahawks', home: false, conference: false,
        result: { teamScore: 20, opponentScore: 13 }, booster: 'boost-2-0',
        stats: {
          receptions: 11, receivingYards: 129, receivingYac: 74,
          receivingTd: 1, receivingLong: 28, targets: 17, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 11.7, totalYards: 129, totalTd: 1
        },
        bigPlays: [
          '3 yard receiving touchdown'
        ] },
      { week:  5, date: '2027-10-10', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week:  6, date: '2027-10-17', kickoff: null,
        opponent: 'Green Bay Packers', home: false, conference: false,
        result: { teamScore: 31, opponentScore: 34 }, booster: null,
        stats: {
          receptions: 10, receivingYards: 141, receivingYac: 56,
          receivingTd: 0, receivingLong: 34, targets: 15, carries: 2,
          rushingYards: -1, rushingTd: 0, rushingLong: 0, fumbles: 0,
          rushingAvg: -0.5, receivingAvg: 14.1, totalYards: 140,
          totalTd: 0
        } },
      { week:  7, date: '2027-10-24', kickoff: null,
        opponent: 'Arizona Cardinals', home: true, conference: false,
        result: { teamScore: 56, opponentScore: 3 }, booster: 'boost-2-0',
        stats: {
          receptions: 12, receivingYards: 181, receivingYac: 53,
          receivingTd: 3, receivingLong: 29, targets: 14, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 15.1, totalYards: 181, totalTd: 3
        },
        bigPlays: [
          '13 yard receiving touchdown',
          '19 yard receiving touchdown',
          '6 yard receiving touchdown'
        ] },
      { week:  8, date: '2027-10-31', kickoff: null,
        opponent: 'Cleveland Browns', home: true, conference: false,
        result: { teamScore: 41, opponentScore: 10 }, booster: null,
        stats: {
          receptions: 6, receivingYards: 113, receivingYac: 30,
          receivingTd: 1, receivingLong: 31, targets: 10, carries: 1,
          rushingYards: -2, rushingTd: 0, rushingLong: 0, fumbles: 0,
          rushingAvg: -2, receivingAvg: 18.8, totalYards: 111, totalTd: 1
        },
        bigPlays: [
          '8 yard receiving touchdown'
        ] },
      { week:  9, date: '2027-11-07', kickoff: null,
        opponent: 'Cincinnati Bengals', home: false, conference: false,
        result: { teamScore: 34, opponentScore: 38 }, booster: 'boost-2-5',
        stats: {
          receptions: 13, receivingYards: 210, receivingYac: 74,
          receivingTd: 2, receivingLong: 37, targets: 20, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 16.2, totalYards: 210, totalTd: 2
        },
        bigPlays: [
          '2 yard receiving touchdown',
          '14 yard receiving touchdown'
        ] },
      { week: 10, date: '2027-11-14', kickoff: null,
        opponent: 'Washington Commanders', home: false, conference: false, division: true,
        result: { teamScore: 31, opponentScore: 26 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 54, receivingYac: 15,
          receivingTd: 0, receivingLong: 20, targets: 9, carries: 1,
          rushingYards: 4, rushingTd: 0, rushingLong: 4, fumbles: 0,
          rushingAvg: 4, receivingAvg: 13.5, totalYards: 58, totalTd: 0
        } },
      { week: 11, date: '2027-11-21', kickoff: null,
        opponent: 'Kansas City Chiefs', home: false, conference: false,
        result: { teamScore: 26, opponentScore: 16 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 28, receivingYac: 16,
          receivingTd: 0, receivingLong: 10, targets: 7, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 7, totalYards: 28, totalTd: 0
        } },
      { week: 12, date: '2027-11-28', kickoff: null,
        opponent: 'Pittsburgh Steelers', home: true, conference: false,
        result: { teamScore: 24, opponentScore: 20 }, booster: null,
        stats: {
          receptions: 10, receivingYards: 124, receivingYac: 69,
          receivingTd: 1, receivingLong: 24, targets: 14, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 12.4, totalYards: 124, totalTd: 1
        },
        bigPlays: [
          '21 yard receiving touchdown'
        ] },
      { week: 13, date: '2027-12-05', kickoff: null,
        opponent: 'Los Angeles Rams', home: false, conference: false,
        result: { teamScore: 23, opponentScore: 16 }, booster: null,
        stats: {
          receptions: 8, receivingYards: 125, receivingYac: 89,
          receivingTd: 1, receivingLong: 48, targets: 12, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 15.6, totalYards: 125, totalTd: 1
        },
        bigPlays: [
          '2 yard receiving touchdown'
        ] },
      { week: 14, date: '2027-12-12', kickoff: null,
        opponent: 'Dallas Cowboys', home: false, conference: false, division: true,
        result: { teamScore: 13, opponentScore: 23 }, booster: 'boost-2-5',
        stats: {
          receptions: 6, receivingYards: 114, receivingYac: 60,
          receivingTd: 1, receivingLong: 64, targets: 11, carries: 1,
          rushingYards: 1, rushingTd: 0, rushingLong: 1, fumbles: 0,
          rushingAvg: 1, receivingAvg: 19, totalYards: 115, totalTd: 1
        },
        bigPlays: [
          '3 yard receiving touchdown'
        ] },
      { week: 15, date: '2027-12-19', kickoff: null,
        opponent: 'Washington Commanders', home: true, conference: false, division: true,
        result: { teamScore: 48, opponentScore: 9 }, booster: 'wager-against', line: 21.5,
        stats: {
          receptions: 8, receivingYards: 115, receivingYac: 57,
          receivingTd: 2, receivingLong: 27, targets: 10, carries: 2,
          rushingYards: 12, rushingTd: 1, rushingLong: 9, fumbles: 0,
          rushingAvg: 6, receivingAvg: 14.4, totalYards: 127, totalTd: 3
        },
        bigPlays: [
          '16 yard receiving touchdown',
          '8 yard receiving touchdown',
          '9 yard rushing touchdown'
        ] },
      { week: 16, date: '2027-12-26', kickoff: null,
        opponent: 'Philadelphia Eagles', home: false, conference: false, division: true,
        result: { teamScore: 28, opponentScore: 17 }, booster: null,
        stats: {
          receptions: 10, receivingYards: 178, receivingYac: 84,
          receivingTd: 1, receivingLong: 42, targets: 11, carries: 2,
          rushingYards: 14, rushingTd: 0, rushingLong: 9, fumbles: 0,
          rushingAvg: 7, receivingAvg: 17.8, totalYards: 192, totalTd: 1
        },
        bigPlays: [
          '16 yard receiving touchdown'
        ] },
      { week: 17, date: '2028-01-02', kickoff: null,
        opponent: 'Tampa Bay Buccaneers', home: true, conference: false,
        result: { teamScore: 30, opponentScore: 10 }, booster: null,
        stats: {
          receptions: 7, receivingYards: 69, receivingYac: 29,
          receivingTd: 1, receivingLong: 32, targets: 8, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 9.9, totalYards: 69, totalTd: 1
        },
        bigPlays: [
          '32 yard receiving touchdown'
        ] },
      { week: 18, date: '2028-01-09', kickoff: null,
        opponent: 'Dallas Cowboys', home: true, conference: false, division: true,
        result: { teamScore: 37, opponentScore: 13 }, booster: 'boost-1-5',
        stats: {
          receptions: 6, receivingYards: 153, receivingYac: 46,
          receivingTd: 1, receivingLong: 44, targets: 10, carries: 1,
          rushingYards: 4, rushingTd: 0, rushingLong: 4, fumbles: 0,
          rushingAvg: 4, receivingAvg: 25.5, totalYards: 157, totalTd: 1
        },
        bigPlays: [
          '12 yard receiving touchdown'
        ] },
      { week: 19, date: '2028-01-15', kickoff: null,
        name: 'NFC Wild Card',
        opponent: 'Chicago Bears', home: true, conference: false, playoff: true,
        result: { teamScore: 28, opponentScore: 21 }, booster: null,
        stats: {
          receptions: 8, receivingYards: 105, receivingYac: 27,
          receivingTd: 1, receivingLong: 27, targets: 9, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 13.1, totalYards: 105, totalTd: 1
        },
        bigPlays: [
          '27 yard receiving touchdown'
        ] },
      { week: 20, date: '2028-01-22', kickoff: null,
        name: 'NFC Divisional Round',
        opponent: 'Tampa Bay Buccaneers', home: true, conference: false, playoff: true,
        result: { teamScore: 17, opponentScore: 12 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 71, receivingYac: 24,
          receivingTd: 1, receivingLong: 25, targets: 11, carries: 1,
          rushingYards: 7, rushingTd: 0, rushingLong: 7, fumbles: 0,
          rushingAvg: 7, receivingAvg: 14.2, totalYards: 78, totalTd: 1
        },
        bigPlays: [
          '3 yard game-winning receiving touchdown'
        ] },
      { week: 21, date: '2028-01-30', kickoff: null,
        name: 'NFC Championship',
        opponent: 'San Francisco 49ers', home: false, conference: false, playoff: true,
        result: { teamScore: 6, opponentScore: 29 }, booster: 'wager-for', line: -0.5,
        stats: {
          receptions: 7, receivingYards: 80, receivingYac: 22,
          receivingTd: 0, receivingLong: 19, targets: 11, carries: 2,
          rushingYards: 4, rushingTd: 0, rushingLong: 4, fumbles: 0,
          rushingAvg: 2, receivingAvg: 11.4, totalYards: 84, totalTd: 0
        } },
    ],

    /* Isaac Vitel — Tampa Bay Buccaneers */
    'isaac-vitel': [
      { week:  1, date: '2027-09-12', kickoff: null,
        opponent: 'San Francisco 49ers', home: false, conference: false,
        result: { teamScore: 21, opponentScore: 19 }, booster: null,
        stats: {
          completions: 17, attempts: 24, passingYards: 212,
          passingYac: 48, passingTd: 2, interceptions: 0, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, sacks: 1,
          fumbles: 0, passingAvg: 12.5, rating: 125.7
        },
        bigPlays: [
          '37 yard passing touchdown',
          '8 yard passing touchdown'
        ] },
      { week:  2, date: '2027-09-19', kickoff: null,
        opponent: 'Las Vegas Raiders', home: false, conference: false,
        result: { teamScore: 24, opponentScore: 20 }, booster: null,
        stats: {
          completions: 20, attempts: 31, passingYards: 216,
          passingYac: 58, passingTd: 2, interceptions: 1, carries: 5,
          rushingYards: 18, rushingTd: 0, rushingLong: 14, sacks: 0,
          fumbles: 0, passingAvg: 10.8, rating: 92.9, rushingAvg: 3.6
        },
        bigPlays: [
          '33 yard passing touchdown',
          '4 yard passing touchdown'
        ] },
      { week:  3, date: '2027-09-26', kickoff: null,
        opponent: 'Carolina Panthers', home: true, conference: false, division: true, overtime: true,
        result: { teamScore: 28, opponentScore: 34 }, booster: 'boost-2-0',
        stats: {
          completions: 18, attempts: 22, passingYards: 212,
          passingYac: 137, passingTd: 2, interceptions: 0, carries: 2,
          rushingYards: 4, rushingTd: 0, rushingLong: 3, sacks: 1,
          fumbles: 0, passingAvg: 11.8, rating: 137.1, rushingAvg: 2
        },
        bigPlays: [
          '4 yard passing touchdown',
          '3 yard passing touchdown'
        ] },
      { week:  4, date: '2027-10-03', kickoff: null,
        opponent: 'Detroit Lions', home: true, conference: false, overtime: true,
        result: { teamScore: 19, opponentScore: 17 }, booster: null,
        stats: {
          completions: 2, attempts: 5, passingYards: 23, passingYac: 18,
          passingTd: 0, interceptions: 0, carries: 1, rushingYards: 2,
          rushingTd: 0, rushingLong: 0, sacks: 1, fumbles: 0,
          passingAvg: 11.5, rating: 54.6, rushingAvg: 2
        } },
      { week:  5, date: '2027-10-10', kickoff: null,
        opponent: 'Denver Broncos', home: true, conference: false, injured: true, injury: 'Hamstring', health: 80,
        result: { teamScore: 20, opponentScore: 17 }, booster: null,
        stats: {
          completions: 0, attempts: 0, passingYards: 0, passingYac: 0,
          passingTd: 0, interceptions: 0, carries: 0, rushingYards: 0,
          rushingTd: 0, rushingLong: 0, sacks: 0, fumbles: 0
        } },
      { week:  6, date: '2027-10-17', kickoff: null,
        opponent: 'Atlanta Falcons', home: true, conference: false, division: true, injured: true, injury: 'Hamstring', health: 80,
        result: { teamScore: 17, opponentScore: 9 }, booster: null,
        stats: {
          completions: 0, attempts: 0, passingYards: 0, passingYac: 0,
          passingTd: 0, interceptions: 0, carries: 0, rushingYards: 0,
          rushingTd: 0, rushingLong: 0, sacks: 0, fumbles: 0
        } },
      { week:  7, date: '2027-10-24', kickoff: null,
        opponent: 'Kansas City Chiefs', home: false, conference: false,
        result: { teamScore: 37, opponentScore: 10 }, booster: null,
        stats: {
          completions: 22, attempts: 30, passingYards: 208,
          passingYac: 87, passingTd: 2, interceptions: 0, carries: 3,
          rushingYards: 1, rushingTd: 0, rushingLong: 0, sacks: 2,
          fumbles: 0, passingAvg: 9.5, rating: 114.3, rushingAvg: 0.3
        },
        bigPlays: [
          '16 yard passing touchdown',
          '1 yard passing touchdown'
        ] },
      { week:  8, date: '2027-10-31', kickoff: null,
        opponent: 'Chicago Bears', home: false, conference: false,
        result: { teamScore: 17, opponentScore: 34 }, booster: 'boost-2-5',
        stats: {
          completions: 20, attempts: 29, passingYards: 265,
          passingYac: 101, passingTd: 2, interceptions: 0, carries: 3,
          rushingYards: 4, rushingTd: 0, rushingLong: 3, sacks: 3,
          fumbles: 1, passingAvg: 13.3, rating: 120.6, rushingAvg: 1.3
        },
        bigPlays: [
          '53 yard passing touchdown',
          '2 yard passing touchdown'
        ] },
      { week:  9, date: '2027-11-07', kickoff: null,
        opponent: 'Atlanta Falcons', home: false, conference: false, division: true, overtime: true,
        result: { teamScore: 20, opponentScore: 17 }, booster: 'boost-1-5',
        stats: {
          completions: 35, attempts: 45, passingYards: 329,
          passingYac: 140, passingTd: 1, interceptions: 0, carries: 5,
          rushingYards: 5, rushingTd: 0, rushingLong: 2, sacks: 3,
          fumbles: 0, passingAvg: 9.4, rating: 104.5, rushingAvg: 1
        },
        bigPlays: [
          '3 yard passing touchdown'
        ] },
      { week: 10, date: '2027-11-14', kickoff: null,
        opponent: 'Green Bay Packers', home: false, conference: false,
        result: { teamScore: 21, opponentScore: 17 }, booster: null,
        stats: {
          completions: 17, attempts: 24, passingYards: 216,
          passingYac: 71, passingTd: 1, interceptions: 0, carries: 6,
          rushingYards: 0, rushingTd: 0, rushingLong: 4, sacks: 2,
          fumbles: 0, passingAvg: 12.7, rating: 112.5, rushingAvg: 0
        },
        bigPlays: [
          '22 yard game-winning passing touchdown'
        ] },
      { week: 11, date: '2027-11-21', kickoff: null,
        opponent: 'Los Angeles Chargers', home: true, conference: false,
        result: { teamScore: 17, opponentScore: 10 }, booster: null,
        stats: {
          completions: 29, attempts: 43, passingYards: 292,
          passingYac: 105, passingTd: 2, interceptions: 1, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, sacks: 1,
          fumbles: 0, passingAvg: 10.1, rating: 92.4
        },
        bigPlays: [
          '8 yard passing touchdown',
          '10 yard passing touchdown'
        ] },
      { week: 12, date: '2027-11-28', kickoff: null,
        opponent: 'Carolina Panthers', home: false, conference: false, division: true,
        result: { teamScore: 25, opponentScore: 19 }, booster: 'boost-2-5',
        stats: {
          completions: 17, attempts: 25, passingYards: 267,
          passingYac: 112, passingTd: 2, interceptions: 1, carries: 2,
          rushingYards: 1, rushingTd: 0, rushingLong: 2, sacks: 1,
          fumbles: 0, passingAvg: 15.7, rating: 113.3, rushingAvg: 0.5
        },
        bigPlays: [
          '10 yard passing touchdown',
          '25 yard passing touchdown'
        ] },
      { week: 13, date: '2027-12-05', kickoff: null,
        opponent: 'Minnesota Vikings', home: true, conference: false,
        result: { teamScore: 23, opponentScore: 7 }, booster: 'wager-for', line: -5.5,
        stats: {
          completions: 20, attempts: 27, passingYards: 231,
          passingYac: 120, passingTd: 2, interceptions: 3, carries: 2,
          rushingYards: -2, rushingTd: 0, rushingLong: 0, sacks: 2,
          fumbles: 0, passingAvg: 11.6, rating: 84.6, rushingAvg: -1
        },
        bigPlays: [
          '9 yard passing touchdown',
          '12 yard passing touchdown'
        ] },
      { week: 14, date: '2027-12-12', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week: 15, date: '2027-12-19', kickoff: null,
        opponent: 'New Orleans Saints', home: false, conference: false, division: true,
        result: { teamScore: 13, opponentScore: 14 }, booster: null,
        stats: {
          completions: 22, attempts: 36, passingYards: 301,
          passingYac: 120, passingTd: 0, interceptions: 1, carries: 2,
          rushingYards: 0, rushingTd: 0, rushingLong: 1, sacks: 1,
          fumbles: 0, passingAvg: 13.7, rating: 76.3, rushingAvg: 0
        } },
      { week: 16, date: '2027-12-26', kickoff: null,
        opponent: 'Baltimore Ravens', home: true, conference: false,
        result: { teamScore: 45, opponentScore: 17 }, booster: null,
        stats: {
          completions: 30, attempts: 37, passingYards: 277,
          passingYac: 90, passingTd: 2, interceptions: 0, carries: 4,
          rushingYards: 7, rushingTd: 0, rushingLong: 7, sacks: 0,
          fumbles: 0, passingAvg: 9.2, rating: 115.9, rushingAvg: 1.8
        },
        bigPlays: [
          '3 yard passing touchdown',
          '4 yard passing touchdown'
        ] },
      { week: 17, date: '2028-01-02', kickoff: null,
        opponent: 'New York Giants', home: false, conference: false,
        result: { teamScore: 10, opponentScore: 30 }, booster: 'boost-1-5',
        stats: {
          completions: 22, attempts: 40, passingYards: 195,
          passingYac: 36, passingTd: 1, interceptions: 0, carries: 1,
          rushingYards: -1, rushingTd: 0, rushingLong: 0, sacks: 0,
          fumbles: 0, passingAvg: 8.9, rating: 76.6, rushingAvg: -1
        },
        bigPlays: [
          '6 yard passing touchdown'
        ] },
      { week: 18, date: '2028-01-09', kickoff: null,
        opponent: 'New Orleans Saints', home: true, conference: false, division: true,
        result: { teamScore: 34, opponentScore: 0 }, booster: null,
        stats: {
          completions: 23, attempts: 28, passingYards: 309,
          passingYac: 99, passingTd: 2, interceptions: 0, carries: 1,
          rushingYards: -1, rushingTd: 0, rushingLong: 0, sacks: 3,
          fumbles: 1, passingAvg: 13.4, rating: 136.5, rushingAvg: -1
        },
        bigPlays: [
          '16 yard passing touchdown',
          '25 yard passing touchdown'
        ] },
      { week: 19, date: '2028-01-15', kickoff: null,
        name: 'NFC Wild Card',
        opponent: 'Carolina Panthers', home: true, conference: false, playoff: true,
        result: { teamScore: 27, opponentScore: 5 }, booster: null,
        stats: {
          completions: 21, attempts: 27, passingYards: 269,
          passingYac: 136, passingTd: 1, interceptions: 0, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, sacks: 1,
          fumbles: 0, passingAvg: 12.8, rating: 120.5
        },
        bigPlays: [
          '17 yard passing touchdown'
        ] },
      { week: 20, date: '2028-01-22', kickoff: null,
        name: 'NFC Divisional Round',
        opponent: 'New York Giants', home: false, conference: false, playoff: true,
        result: { teamScore: 12, opponentScore: 17 }, booster: null,
        stats: {
          completions: 31, attempts: 39, passingYards: 192,
          passingYac: 76, passingTd: 0, interceptions: 0, carries: 1,
          rushingYards: -1, rushingTd: 0, rushingLong: 0, sacks: 2,
          fumbles: 0, passingAvg: 6.2, rating: 87.2, rushingAvg: -1
        } },
    ],

    /* Sam Stogsdill — Pittsburgh Steelers */
    'sam-stogsdill': [
      { week:  1, date: '2027-09-12', kickoff: null,
        opponent: 'Los Angeles Chargers', home: false, conference: false,
        result: { teamScore: 34, opponentScore: 24 }, booster: null,
        stats: {
          carries: 20, rushingYards: 126, rushingTd: 2, rushingLong: 45,
          receptions: 4, receivingYards: 28, receivingYac: 22,
          receivingTd: 1, receivingLong: 14, targets: 4, fumbles: 0,
          rushingAvg: 6.3, receivingAvg: 7, totalYards: 154, totalTd: 3
        },
        bigPlays: [
          '4 yard rushing touchdown',
          '2 yard receiving touchdown',
          '7 yard rushing touchdown'
        ] },
      { week:  2, date: '2027-09-19', kickoff: null,
        opponent: 'Houston Texans', home: true, conference: false,
        result: { teamScore: 21, opponentScore: 26 }, booster: null,
        stats: {
          carries: 9, rushingYards: 34, rushingTd: 0, rushingLong: 8,
          receptions: 6, receivingYards: 46, receivingYac: 16,
          receivingTd: 1, receivingLong: 25, targets: 6, fumbles: 0,
          rushingAvg: 3.8, receivingAvg: 7.7, totalYards: 80, totalTd: 1
        },
        bigPlays: [
          '5 yard receiving touchdown'
        ] },
      { week:  3, date: '2027-09-26', kickoff: null,
        opponent: 'Cincinnati Bengals', home: true, conference: false, division: true,
        result: { teamScore: 19, opponentScore: 31 }, booster: null,
        stats: {
          carries: 13, rushingYards: 92, rushingTd: 1, rushingLong: 18,
          receptions: 6, receivingYards: 65, receivingYac: 41,
          receivingTd: 0, receivingLong: 23, targets: 6, fumbles: 1,
          rushingAvg: 7.1, receivingAvg: 10.8, totalYards: 157, totalTd: 1
        },
        bigPlays: [
          '13 yard rushing touchdown'
        ] },
      { week:  4, date: '2027-10-03', kickoff: null,
        opponent: 'Cleveland Browns', home: true, conference: false, division: true,
        result: { teamScore: 22, opponentScore: 10 }, booster: 'boost-1-5',
        stats: {
          carries: 24, rushingYards: 172, rushingTd: 1, rushingLong: 51,
          receptions: 2, receivingYards: 14, receivingYac: 8,
          receivingTd: 0, receivingLong: 7, targets: 4, fumbles: 0,
          rushingAvg: 7.2, receivingAvg: 7, totalYards: 186, totalTd: 1
        },
        bigPlays: [
          '4 yard rushing touchdown'
        ] },
      { week:  5, date: '2027-10-10', kickoff: null,
        opponent: 'Cleveland Browns', home: false, conference: false, division: true,
        result: { teamScore: 20, opponentScore: 12 }, booster: null,
        stats: {
          carries: 15, rushingYards: 58, rushingTd: 0, rushingLong: 15,
          receptions: 7, receivingYards: 76, receivingYac: 45,
          receivingTd: 1, receivingLong: 25, targets: 7, fumbles: 0,
          rushingAvg: 3.9, receivingAvg: 10.9, totalYards: 134, totalTd: 1
        },
        bigPlays: [
          '6 yard receiving touchdown'
        ] },
      { week:  6, date: '2027-10-17', kickoff: null,
        opponent: 'Washington Commanders', home: false, conference: false,
        result: { teamScore: 50, opponentScore: 10 }, booster: null,
        stats: {
          carries: 25, rushingYards: 83, rushingTd: 1, rushingLong: 14,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 1, fumbles: 0,
          rushingAvg: 3.3, totalYards: 83, totalTd: 1
        },
        bigPlays: [
          '1 yard rushing touchdown'
        ] },
      { week:  7, date: '2027-10-24', kickoff: null,
        opponent: 'Dallas Cowboys', home: true, conference: false,
        result: { teamScore: 12, opponentScore: 17 }, booster: null,
        stats: {
          carries: 14, rushingYards: 65, rushingTd: 0, rushingLong: 16,
          receptions: 3, receivingYards: 42, receivingYac: 34,
          receivingTd: 0, receivingLong: 23, targets: 8, fumbles: 0,
          rushingAvg: 4.6, receivingAvg: 14, totalYards: 107, totalTd: 0
        } },
      { week:  8, date: '2027-10-31', kickoff: null,
        opponent: 'Philadelphia Eagles', home: true, conference: false,
        result: { teamScore: 32, opponentScore: 25 }, booster: null,
        stats: {
          carries: 20, rushingYards: 106, rushingTd: 0, rushingLong: 24,
          receptions: 5, receivingYards: 28, receivingYac: 14,
          receivingTd: 1, receivingLong: 9, targets: 6, fumbles: 0,
          rushingAvg: 5.3, receivingAvg: 5.6, totalYards: 134, totalTd: 1
        },
        bigPlays: [
          '7 yard receiving touchdown'
        ] },
      { week:  9, date: '2027-11-07', kickoff: null,
        opponent: 'Jacksonville Jaguars', home: false, conference: false,
        result: { teamScore: 37, opponentScore: 10 }, booster: null,
        stats: {
          carries: 16, rushingYards: 97, rushingTd: 2, rushingLong: 20,
          receptions: 3, receivingYards: 69, receivingYac: 52,
          receivingTd: 0, receivingLong: 46, targets: 4, fumbles: 0,
          rushingAvg: 6.1, receivingAvg: 23, totalYards: 166, totalTd: 2
        },
        bigPlays: [
          '0 yard rushing touchdown',
          '3 yard rushing touchdown'
        ] },
      { week: 10, date: '2027-11-14', kickoff: null,
        opponent: 'Indianapolis Colts', home: false, conference: false,
        result: { teamScore: 17, opponentScore: 6 }, booster: null,
        stats: {
          carries: 14, rushingYards: 42, rushingTd: 0, rushingLong: 7,
          receptions: 5, receivingYards: 46, receivingYac: 20,
          receivingTd: 0, receivingLong: 26, targets: 8, fumbles: 1,
          rushingAvg: 3, receivingAvg: 9.2, totalYards: 88, totalTd: 0
        } },
      { week: 11, date: '2027-11-21', kickoff: null,
        opponent: 'Cincinnati Bengals', home: false, conference: false, division: true,
        result: { teamScore: 23, opponentScore: 18 }, booster: 'boost-2-5',
        stats: {
          carries: 17, rushingYards: 72, rushingTd: 1, rushingLong: 30,
          receptions: 6, receivingYards: 89, receivingYac: 72,
          receivingTd: 1, receivingLong: 34, targets: 7, fumbles: 0,
          rushingAvg: 4.2, receivingAvg: 14.8, totalYards: 161, totalTd: 2
        },
        bigPlays: [
          '30 yard rushing touchdown',
          '7 yard receiving touchdown'
        ] },
      { week: 12, date: '2027-11-28', kickoff: null,
        opponent: 'New York Giants', home: false, conference: false,
        result: { teamScore: 20, opponentScore: 24 }, booster: 'wager-for', line: 5.5,
        stats: {
          carries: 14, rushingYards: 63, rushingTd: 0, rushingLong: 30,
          receptions: 3, receivingYards: 23, receivingYac: 13,
          receivingTd: 0, receivingLong: 13, targets: 5, fumbles: 0,
          rushingAvg: 4.5, receivingAvg: 7.7, totalYards: 86, totalTd: 0
        } },
      { week: 13, date: '2027-12-05', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week: 14, date: '2027-12-12', kickoff: null,
        opponent: 'Atlanta Falcons', home: true, conference: false,
        result: { teamScore: 25, opponentScore: 22 }, booster: null,
        stats: {
          carries: 15, rushingYards: 120, rushingTd: 1, rushingLong: 22,
          receptions: 5, receivingYards: 69, receivingYac: 33,
          receivingTd: 0, receivingLong: 17, targets: 5, fumbles: 0,
          rushingAvg: 8, receivingAvg: 13.8, totalYards: 189, totalTd: 1
        },
        bigPlays: [
          '22 yard rushing touchdown'
        ] },
      { week: 15, date: '2027-12-19', kickoff: null,
        opponent: 'New York Jets', home: false, conference: false,
        result: { teamScore: 28, opponentScore: 23 }, booster: null,
        stats: {
          carries: 19, rushingYards: 89, rushingTd: 1, rushingLong: 15,
          receptions: 3, receivingYards: 41, receivingYac: 22,
          receivingTd: 1, receivingLong: 21, targets: 4, fumbles: 0,
          rushingAvg: 4.7, receivingAvg: 13.7, totalYards: 130, totalTd: 2
        },
        bigPlays: [
          '1 yard rushing touchdown',
          '5 yard receiving touchdown'
        ] },
      { week: 16, date: '2027-12-26', kickoff: null,
        opponent: 'Tennessee Titans', home: true, conference: false,
        result: { teamScore: 24, opponentScore: 10 }, booster: null,
        stats: {
          carries: 18, rushingYards: 44, rushingTd: 1, rushingLong: 13,
          receptions: 5, receivingYards: 68, receivingYac: 38,
          receivingTd: 0, receivingLong: 26, targets: 7, fumbles: 0,
          rushingAvg: 2.4, receivingAvg: 13.6, totalYards: 112, totalTd: 1
        },
        bigPlays: [
          '1 yard rushing touchdown'
        ] },
      { week: 17, date: '2028-01-02', kickoff: null,
        opponent: 'Baltimore Ravens', home: true, conference: false, division: true,
        result: { teamScore: 21, opponentScore: 20 }, booster: 'boost-2-0',
        stats: {
          carries: 20, rushingYards: 69, rushingTd: 3, rushingLong: 20,
          receptions: 1, receivingYards: 12, receivingYac: 6,
          receivingTd: 0, receivingLong: 12, targets: 1, fumbles: 0,
          rushingAvg: 3.5, receivingAvg: 12, totalYards: 81, totalTd: 3
        },
        bigPlays: [
          '4 yard rushing touchdown',
          '3 yard rushing touchdown',
          '6 yard game-winning rushing touchdown'
        ] },
      { week: 18, date: '2028-01-09', kickoff: null,
        opponent: 'Baltimore Ravens', home: false, conference: false, division: true,
        result: { teamScore: 24, opponentScore: 13 }, booster: 'wager-for', line: -1.5,
        stats: {
          carries: 22, rushingYards: 84, rushingTd: 0, rushingLong: 19,
          receptions: 4, receivingYards: 36, receivingYac: 24,
          receivingTd: 0, receivingLong: 26, targets: 6, fumbles: 0,
          rushingAvg: 3.8, receivingAvg: 9, totalYards: 120, totalTd: 0
        } },
      { week: 19, date: '2028-01-15', kickoff: null,
        name: 'AFC Wild Card',
        opponent: 'Denver Broncos', home: true, conference: false, playoff: true,
        result: { teamScore: 38, opponentScore: 21 }, booster: null,
        stats: {
          carries: 28, rushingYards: 172, rushingTd: 3, rushingLong: 24,
          receptions: 4, receivingYards: 27, receivingYac: 15,
          receivingTd: 0, receivingLong: 12, targets: 4, fumbles: 0,
          rushingAvg: 6.1, receivingAvg: 6.8, totalYards: 199, totalTd: 3
        },
        bigPlays: [
          '24 yard rushing touchdown',
          '1 yard rushing touchdown',
          '3 yard rushing touchdown'
        ] },
      { week: 20, date: '2028-01-22', kickoff: null,
        name: 'AFC Divisional Round',
        opponent: 'New England Patriots', home: true, conference: false, playoff: true,
        result: { teamScore: 31, opponentScore: 24 }, booster: null,
        stats: {
          carries: 20, rushingYards: 182, rushingTd: 3, rushingLong: 66,
          receptions: 2, receivingYards: 18, receivingYac: 4,
          receivingTd: 0, receivingLong: 11, targets: 4, fumbles: 0,
          rushingAvg: 9.1, receivingAvg: 9, totalYards: 200, totalTd: 3
        },
        bigPlays: [
          '13 yard rushing touchdown',
          '66 yard rushing touchdown',
          '3 yard game-winning rushing touchdown'
        ] },
      { week: 21, date: '2028-01-30', kickoff: null,
        name: 'AFC Championship',
        opponent: 'Houston Texans', home: false, conference: false, playoff: true,
        result: { teamScore: 10, opponentScore: 33 }, booster: null,
        stats: {
          carries: 14, rushingYards: 60, rushingTd: 0, rushingLong: 14,
          receptions: 5, receivingYards: 73, receivingYac: 62,
          receivingTd: 1, receivingLong: 27, targets: 5, fumbles: 0,
          rushingAvg: 4.3, receivingAvg: 14.6, totalYards: 133, totalTd: 1
        },
        bigPlays: [
          '27 yard receiving touchdown'
        ] },
    ],

    /* Jaykeb Stewart — Houston Texans */
    'jaykeb-stewart': [
      { week:  1, date: '2027-09-12', kickoff: null,
        opponent: 'Cleveland Browns', home: false, conference: false,
        result: { teamScore: 30, opponentScore: 10 }, booster: 'boost-2-0',
        stats: {
          completions: 23, attempts: 29, passingYards: 263,
          passingYac: 101, passingTd: 3, interceptions: 0, carries: 9,
          rushingYards: 33, rushingTd: 1, rushingLong: 10, sacks: 1,
          fumbles: 0, passingAvg: 11.4, rating: 138.9, rushingAvg: 3.7
        },
        bigPlays: [
          '5 yard rushing touchdown',
          '29 yard passing touchdown',
          '1 yard passing touchdown',
          '6 yard passing touchdown'
        ] },
      { week:  2, date: '2027-09-19', kickoff: null,
        opponent: 'Pittsburgh Steelers', home: false, conference: false,
        result: { teamScore: 26, opponentScore: 21 }, booster: 'boost-1-5',
        stats: {
          completions: 24, attempts: 31, passingYards: 244,
          passingYac: 89, passingTd: 2, interceptions: 1, carries: 9,
          rushingYards: 14, rushingTd: 0, rushingLong: 5, sacks: 0,
          fumbles: 0, passingAvg: 10.2, rating: 107.5, rushingAvg: 1.6
        },
        bigPlays: [
          '3 yard passing touchdown',
          '17 yard passing touchdown'
        ] },
      { week:  3, date: '2027-09-26', kickoff: null,
        opponent: 'Tennessee Titans', home: true, conference: false, division: true,
        result: { teamScore: 28, opponentScore: 16 }, booster: null,
        stats: {
          completions: 20, attempts: 30, passingYards: 263,
          passingYac: 95, passingTd: 1, interceptions: 1, carries: 9,
          rushingYards: 44, rushingTd: 2, rushingLong: 25, sacks: 0,
          fumbles: 0, passingAvg: 13.2, rating: 91.4, rushingAvg: 4.9
        },
        bigPlays: [
          '12 yard passing touchdown',
          '7 yard rushing touchdown',
          '11 yard rushing touchdown'
        ] },
      { week:  4, date: '2027-10-03', kickoff: null,
        opponent: 'Los Angeles Chargers', home: true, conference: false,
        result: { teamScore: 44, opponentScore: 10 }, booster: null,
        stats: {
          completions: 21, attempts: 28, passingYards: 243,
          passingYac: 114, passingTd: 2, interceptions: 0, carries: 11,
          rushingYards: 23, rushingTd: 1, rushingLong: 7, sacks: 0,
          fumbles: 0, passingAvg: 11.6, rating: 124.6, rushingAvg: 2.1
        },
        bigPlays: [
          '5 yard rushing touchdown',
          '50 yard passing touchdown',
          '3 yard passing touchdown'
        ] },
      { week:  5, date: '2027-10-10', kickoff: null,
        opponent: 'Chicago Bears', home: false, conference: false,
        result: { teamScore: 26, opponentScore: 20 }, booster: null,
        stats: {
          completions: 27, attempts: 40, passingYards: 328,
          passingYac: 146, passingTd: 2, interceptions: 1, carries: 9,
          rushingYards: 26, rushingTd: 0, rushingLong: 9, sacks: 2,
          fumbles: 0, passingAvg: 12.1, rating: 98.7, rushingAvg: 2.9
        },
        bigPlays: [
          '33 yard passing touchdown',
          '10 yard passing touchdown'
        ] },
      { week:  6, date: '2027-10-17', kickoff: null,
        opponent: 'Baltimore Ravens', home: true, conference: false,
        result: { teamScore: 30, opponentScore: 7 }, booster: null,
        stats: {
          completions: 27, attempts: 37, passingYards: 279,
          passingYac: 113, passingTd: 2, interceptions: 0, carries: 5,
          rushingYards: 29, rushingTd: 0, rushingLong: 8, sacks: 2,
          fumbles: 0, passingAvg: 10.3, rating: 112.3, rushingAvg: 5.8
        },
        bigPlays: [
          '28 yard passing touchdown',
          '4 yard passing touchdown'
        ] },
      { week:  7, date: '2027-10-24', kickoff: null,
        opponent: 'New York Jets', home: true, conference: false,
        result: { teamScore: 28, opponentScore: 30 }, booster: null,
        stats: {
          completions: 30, attempts: 44, passingYards: 343,
          passingYac: 102, passingTd: 2, interceptions: 2, carries: 5,
          rushingYards: 22, rushingTd: 1, rushingLong: 7, sacks: 2,
          fumbles: 0, passingAvg: 11.4, rating: 87.6, rushingAvg: 4.4
        },
        bigPlays: [
          '4 yard passing touchdown',
          '2 yard rushing touchdown',
          '2 yard passing touchdown'
        ] },
      { week:  8, date: '2027-10-31', kickoff: null,
        opponent: 'Detroit Lions', home: false, conference: false,
        result: { teamScore: 37, opponentScore: 20 }, booster: null,
        stats: {
          completions: 18, attempts: 27, passingYards: 238,
          passingYac: 135, passingTd: 3, interceptions: 0, carries: 7,
          rushingYards: 28, rushingTd: 0, rushingLong: 12, sacks: 2,
          fumbles: 0, passingAvg: 13.2, rating: 131.4, rushingAvg: 4
        },
        bigPlays: [
          '25 yard passing touchdown',
          '42 yard passing touchdown',
          '12 yard passing touchdown'
        ] },
      { week:  9, date: '2027-11-07', kickoff: null,
        opponent: 'Minnesota Vikings', home: true, conference: false,
        result: { teamScore: 60, opponentScore: 10 }, booster: null,
        stats: {
          completions: 22, attempts: 29, passingYards: 232,
          passingYac: 76, passingTd: 3, interceptions: 0, carries: 4,
          rushingYards: 1, rushingTd: 0, rushingLong: 4, sacks: 0,
          fumbles: 0, passingAvg: 10.5, rating: 133.1, rushingAvg: 0.3
        },
        bigPlays: [
          '6 yard passing touchdown',
          '14 yard passing touchdown',
          '5 yard passing touchdown'
        ] },
      { week: 10, date: '2027-11-14', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week: 11, date: '2027-11-21', kickoff: null,
        opponent: 'Jacksonville Jaguars', home: false, conference: false, division: true,
        result: { teamScore: 36, opponentScore: 17 }, booster: null,
        stats: {
          completions: 22, attempts: 30, passingYards: 289,
          passingYac: 61, passingTd: 2, interceptions: 0, carries: 8,
          rushingYards: 18, rushingTd: 0, rushingLong: 6, sacks: 3,
          fumbles: 1, passingAvg: 13.1, rating: 125.6, rushingAvg: 2.3
        },
        bigPlays: [
          '16 yard passing touchdown',
          '42 yard passing touchdown'
        ] },
      { week: 12, date: '2027-11-28', kickoff: null,
        opponent: 'Jacksonville Jaguars', home: true, conference: false, division: true,
        result: { teamScore: 16, opponentScore: 7 }, booster: null,
        stats: {
          completions: 21, attempts: 38, passingYards: 228,
          passingYac: 85, passingTd: 1, interceptions: 0, carries: 5,
          rushingYards: 7, rushingTd: 0, rushingLong: 4, sacks: 0,
          fumbles: 0, passingAvg: 10.9, rating: 81.9, rushingAvg: 1.4
        },
        bigPlays: [
          '8 yard passing touchdown'
        ] },
      { week: 13, date: '2027-12-05', kickoff: null,
        opponent: 'Green Bay Packers', home: false, conference: false,
        result: { teamScore: 24, opponentScore: 17 }, booster: null,
        stats: {
          completions: 23, attempts: 34, passingYards: 245,
          passingYac: 93, passingTd: 2, interceptions: 2, carries: 4,
          rushingYards: 12, rushingTd: 0, rushingLong: 8, sacks: 0,
          fumbles: 0, passingAvg: 10.7, rating: 83.6, rushingAvg: 3
        },
        bigPlays: [
          '12 yard passing touchdown',
          '6 yard game-winning passing touchdown'
        ] },
      { week: 14, date: '2027-12-12', kickoff: null,
        opponent: 'Seattle Seahawks', home: true, conference: false,
        result: { teamScore: 39, opponentScore: 10 }, booster: null,
        stats: {
          completions: 19, attempts: 25, passingYards: 204,
          passingYac: 59, passingTd: 2, interceptions: 0, carries: 11,
          rushingYards: 38, rushingTd: 0, rushingLong: 9, sacks: 0,
          fumbles: 0, passingAvg: 10.7, rating: 126.1, rushingAvg: 3.5
        },
        bigPlays: [
          '10 yard passing touchdown',
          '2 yard passing touchdown'
        ] },
      { week: 15, date: '2027-12-19', kickoff: null,
        opponent: 'Indianapolis Colts', home: false, conference: false, division: true,
        result: { teamScore: 40, opponentScore: 16 }, booster: null,
        stats: {
          completions: 25, attempts: 41, passingYards: 332,
          passingYac: 120, passingTd: 2, interceptions: 1, carries: 4,
          rushingYards: 15, rushingTd: 1, rushingLong: 8, sacks: 1,
          fumbles: 0, passingAvg: 13.3, rating: 92.7, rushingAvg: 3.8
        },
        bigPlays: [
          '28 yard passing touchdown',
          '5 yard passing touchdown',
          '4 yard rushing touchdown'
        ] },
      { week: 16, date: '2027-12-26', kickoff: null,
        opponent: 'Indianapolis Colts', home: true, conference: false, division: true,
        result: { teamScore: 28, opponentScore: 7 }, booster: null,
        stats: {
          completions: 27, attempts: 39, passingYards: 296,
          passingYac: 141, passingTd: 3, interceptions: 0, carries: 13,
          rushingYards: 44, rushingTd: 1, rushingLong: 10, sacks: 3,
          fumbles: 0, passingAvg: 11, rating: 117, rushingAvg: 3.4
        },
        bigPlays: [
          '9 yard passing touchdown',
          '29 yard passing touchdown',
          '5 yard rushing touchdown',
          '4 yard passing touchdown'
        ] },
      { week: 17, date: '2028-01-02', kickoff: null,
        opponent: 'Cincinnati Bengals', home: true, conference: false,
        result: { teamScore: 24, opponentScore: 32 }, booster: null,
        stats: {
          completions: 21, attempts: 29, passingYards: 355,
          passingYac: 87, passingTd: 3, interceptions: 2, carries: 8,
          rushingYards: 37, rushingTd: 0, rushingLong: 9, sacks: 1,
          fumbles: 0, passingAvg: 16.9, rating: 119.2, rushingAvg: 4.6
        },
        bigPlays: [
          '12 yard passing touchdown',
          '18 yard passing touchdown',
          '49 yard passing touchdown'
        ] },
      { week: 18, date: '2028-01-09', kickoff: null,
        opponent: 'Tennessee Titans', home: false, conference: false, division: true,
        result: { teamScore: 31, opponentScore: 28 }, booster: null,
        stats: {
          completions: 23, attempts: 37, passingYards: 333,
          passingYac: 143, passingTd: 1, interceptions: 0, carries: 5,
          rushingYards: 26, rushingTd: 0, rushingLong: 10, sacks: 1,
          fumbles: 0, passingAvg: 14.5, rating: 100.4, rushingAvg: 5.2
        },
        bigPlays: [
          '2 yard game-winning passing touchdown'
        ] },
      { week: 20, date: '2028-01-22', kickoff: null,
        name: 'AFC Divisional Round',
        opponent: 'Las Vegas Raiders', home: true, conference: false, playoff: true,
        result: { teamScore: 28, opponentScore: 24 }, booster: null,
        stats: {
          completions: 19, attempts: 31, passingYards: 260,
          passingYac: 94, passingTd: 2, interceptions: 1, carries: 6,
          rushingYards: 30, rushingTd: 0, rushingLong: 13, sacks: 0,
          fumbles: 0, passingAvg: 13.7, rating: 96.2, rushingAvg: 5
        },
        bigPlays: [
          '13 yard passing touchdown',
          '1 yard game-winning passing touchdown'
        ] },
      { week: 21, date: '2028-01-30', kickoff: null,
        name: 'AFC Championship',
        opponent: 'Pittsburgh Steelers', home: true, conference: false, playoff: true,
        result: { teamScore: 33, opponentScore: 10 }, booster: null,
        stats: {
          completions: 28, attempts: 35, passingYards: 315,
          passingYac: 81, passingTd: 3, interceptions: 0, carries: 2,
          rushingYards: 4, rushingTd: 0, rushingLong: 7, sacks: 1,
          fumbles: 0, passingAvg: 11.3, rating: 132.7, rushingAvg: 2
        },
        bigPlays: [
          '26 yard passing touchdown',
          '6 yard passing touchdown',
          '24 yard passing touchdown'
        ] },
      { week: 22, date: '2028-02-13', kickoff: null,
        name: 'Super Bowl LXII',
        opponent: 'San Francisco 49ers', home: false, conference: false, neutral: true, playoff: true,
        result: { teamScore: 35, opponentScore: 31 }, booster: null,
        stats: {
          completions: 27, attempts: 49, passingYards: 274,
          passingYac: 74, passingTd: 3, interceptions: 0, carries: 4,
          rushingYards: 14, rushingTd: 0, rushingLong: 7, sacks: 1,
          fumbles: 1, passingAvg: 10.1, rating: 91.7, rushingAvg: 3.5
        },
        bigPlays: [
          '1 yard passing touchdown',
          '9 yard passing touchdown',
          '7 yard game-winning passing touchdown'
        ] },
    ],
  }
};
