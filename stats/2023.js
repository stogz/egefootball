/* ==========================================================================
   EGE Football — the 2023 season
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

EGE.stats[2023] = {
  season: 2023,
  level: 'NFL and college football',

  games: {

    /* Andrew Parr — Detroit Lions */
    'andrew-parr': [
      { week:  1, date: '2023-09-07', kickoff: '8:20pm',
        opponent: 'Kansas City Chiefs', home: false, conference: false,
        result: { teamScore: 20, opponentScore: 24 }, booster: null,
        stats: {
          receptions: 7, receivingYards: 81, receivingYac: 36,
          receivingTd: 1, receivingLong: 30, targets: 9, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 11.6, totalYards: 81, totalTd: 1
        },
        bigPlays: [
          '3 yard receiving touchdown'
        ] },
      { week:  2, date: '2023-09-17', kickoff: '1:00pm',
        opponent: 'Seattle Seahawks', home: true, conference: false,
        result: { teamScore: 33, opponentScore: 32 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 55, receivingYac: 17,
          receivingTd: 1, receivingLong: 33, targets: 5, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 13.8, totalYards: 55, totalTd: 1
        },
        bigPlays: [
          '33 yard game-winning receiving touchdown'
        ] },
      { week:  3, date: '2023-09-24', kickoff: '1:00pm',
        opponent: 'Atlanta Falcons', home: true, conference: false,
        result: { teamScore: 22, opponentScore: 8 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 52, receivingYac: 15,
          receivingTd: 0, receivingLong: 38, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 13, totalYards: 52, totalTd: 0
        } },
      { week:  4, date: '2023-09-28', kickoff: '8:15pm',
        opponent: 'Green Bay Packers', home: false, conference: false, division: true,
        result: { teamScore: 36, opponentScore: 18 }, booster: null,
        stats: {
          receptions: 6, receivingYards: 53, receivingYac: 31,
          receivingTd: 0, receivingLong: 20, targets: 8, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 8.8, totalYards: 53, totalTd: 0
        } },
      { week:  5, date: '2023-10-08', kickoff: '1:00pm',
        opponent: 'Carolina Panthers', home: true, conference: false,
        result: { teamScore: 45, opponentScore: 22 }, booster: null,
        stats: {
          receptions: 2, receivingYards: 24, receivingYac: 8,
          receivingTd: 0, receivingLong: 15, targets: 3, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 12, totalYards: 24, totalTd: 0
        } },
      { week:  6, date: '2023-10-15', kickoff: '4:25pm',
        opponent: 'Tampa Bay Buccaneers', home: false, conference: false, injured: true, injury: 'Groin Strain', health: 70,
        result: { teamScore: 18, opponentScore: 3 }, booster: null,
        stats: {
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          totalYards: 0, totalTd: 0
        } },
      { week:  7, date: '2023-10-22', kickoff: '1:00pm',
        opponent: 'Baltimore Ravens', home: false, conference: false, injured: true, injury: 'Groin Strain', health: 79,
        result: { teamScore: 3, opponentScore: 37 }, booster: null,
        stats: {
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          totalYards: 0, totalTd: 0
        } },
      { week:  8, date: '2023-10-30', kickoff: '8:15pm',
        opponent: 'Las Vegas Raiders', home: true, conference: false,
        result: { teamScore: 23, opponentScore: 13 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 64, receivingYac: 25,
          receivingTd: 0, receivingLong: 42, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 16, totalYards: 64, totalTd: 0
        } },
      { week:  9, date: '2023-11-05', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week: 10, date: '2023-11-12', kickoff: '4:05pm',
        opponent: 'Los Angeles Chargers', home: false, conference: false,
        result: { teamScore: 45, opponentScore: 36 }, booster: null,
        stats: {
          receptions: 8, receivingYards: 94, receivingYac: 32,
          receivingTd: 1, receivingLong: 44, targets: 10, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 11.8, totalYards: 94, totalTd: 1
        },
        bigPlays: [
          '44 yard receiving touchdown'
        ] },
      { week: 11, date: '2023-11-19', kickoff: '1:00pm',
        opponent: 'Chicago Bears', home: true, conference: false, division: true,
        result: { teamScore: 33, opponentScore: 27 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 40, receivingYac: 16,
          receivingTd: 0, receivingLong: 28, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 10, totalYards: 40, totalTd: 0
        } },
      { week: 12, date: '2023-11-23', kickoff: '12:30pm',
        opponent: 'Green Bay Packers', home: true, conference: false, division: true,
        result: { teamScore: 24, opponentScore: 36 }, booster: null,
        stats: {
          receptions: 3, receivingYards: 31, receivingYac: 15,
          receivingTd: 0, receivingLong: 23, targets: 5, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 10.3, totalYards: 31, totalTd: 0
        } },
      { week: 13, date: '2023-12-03', kickoff: '1:00pm',
        opponent: 'New Orleans Saints', home: false, conference: false,
        result: { teamScore: 34, opponentScore: 31 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 49, receivingYac: 18,
          receivingTd: 0, receivingLong: 34, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 12.3, totalYards: 49, totalTd: 0
        } },
      { week: 14, date: '2023-12-10', kickoff: '1:00pm',
        opponent: 'Chicago Bears', home: false, conference: false, division: true,
        result: { teamScore: 11, opponentScore: 21 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 40, receivingYac: 14,
          receivingTd: 0, receivingLong: 16, targets: 7, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 8, totalYards: 40, totalTd: 0
        } },
      { week: 15, date: '2023-12-16', kickoff: '8:15pm',
        opponent: 'Denver Broncos', home: true, conference: false,
        result: { teamScore: 34, opponentScore: 16 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 27, receivingYac: 11,
          receivingTd: 0, receivingLong: 15, targets: 5, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 6.8, totalYards: 27, totalTd: 0
        } },
      { week: 16, date: '2023-12-24', kickoff: '1:00pm',
        opponent: 'Minnesota Vikings', home: false, conference: false, division: true,
        result: { teamScore: 31, opponentScore: 26 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 54, receivingYac: 16,
          receivingTd: 1, receivingLong: 40, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 10.8, totalYards: 54, totalTd: 1
        },
        bigPlays: [
          '2 yard receiving touchdown'
        ] },
      { week: 17, date: '2023-12-30', kickoff: '8:15pm',
        opponent: 'Dallas Cowboys', home: false, conference: false,
        result: { teamScore: 19, opponentScore: 23 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 55, receivingYac: 23,
          receivingTd: 0, receivingLong: 36, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 13.8, totalYards: 55, totalTd: 0
        } },
      { week: 18, date: '2024-01-07', kickoff: '1:00pm',
        opponent: 'Minnesota Vikings', home: true, conference: false, division: true,
        result: { teamScore: 19, opponentScore: 24 }, booster: null,
        stats: {
          receptions: 3, receivingYards: 27, receivingYac: 9,
          receivingTd: 1, receivingLong: 19, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 9, totalYards: 27, totalTd: 1
        },
        bigPlays: [
          '19 yard receiving touchdown'
        ] },
    ],

    /* Cooper Clark — USC */
    'cooper-clark': [
      { week:  0, date: '2023-08-26', kickoff: '5:00pm',
        opponent: 'San José State', home: true, conference: false,
        result: { teamScore: 59, opponentScore: 40 }, booster: null,
        stats: {
          carries: 18, rushingYards: 221, rushingTd: 2, rushingLong: 60,
          receptions: 3, receivingYards: 50, receivingYac: 33,
          receivingTd: 1, receivingLong: 27, targets: 4, fumbles: 0,
          rushingAvg: 12.3, receivingAvg: 16.7, totalYards: 271,
          totalTd: 3
        },
        bigPlays: [
          '5 yard rushing touchdown',
          '1 yard rushing touchdown',
          '19 yard receiving touchdown'
        ] },
      { week:  1, date: '2023-09-02', kickoff: '3:30pm',
        opponent: 'Nevada', home: true, conference: false,
        result: { teamScore: 69, opponentScore: 14 }, booster: null,
        stats: {
          carries: 22, rushingYards: 168, rushingTd: 2, rushingLong: 41,
          receptions: 5, receivingYards: 52, receivingYac: 37,
          receivingTd: 0, receivingLong: 24, targets: 6, fumbles: 0,
          rushingAvg: 7.6, receivingAvg: 10.4, totalYards: 220, totalTd: 2
        },
        bigPlays: [
          '6 yard rushing touchdown',
          '41 yard rushing touchdown'
        ] },
      { week:  2, date: '2023-09-09', kickoff: '7:30pm',
        opponent: 'Stanford', home: true, conference: true,
        result: { teamScore: 64, opponentScore: 13 }, booster: null,
        stats: {
          carries: 30, rushingYards: 241, rushingTd: 3, rushingLong: 38,
          receptions: 6, receivingYards: 61, receivingYac: 47,
          receivingTd: 0, receivingLong: 31, targets: 7, fumbles: 0,
          rushingAvg: 8, receivingAvg: 10.2, totalYards: 302, totalTd: 3
        },
        bigPlays: [
          '11 yard rushing touchdown',
          '4 yard rushing touchdown',
          '1 yard rushing touchdown'
        ] },
      { week:  4, date: '2023-09-23', kickoff: '7:30pm',
        opponent: 'Arizona State', home: false, conference: true,
        result: { teamScore: 34, opponentScore: 16 }, booster: null,
        stats: {
          carries: 28, rushingYards: 139, rushingTd: 3, rushingLong: 22,
          receptions: 5, receivingYards: 44, receivingYac: 33,
          receivingTd: 0, receivingLong: 21, targets: 6, fumbles: 0,
          rushingAvg: 5, receivingAvg: 8.8, totalYards: 183, totalTd: 3
        },
        bigPlays: [
          '19 yard rushing touchdown',
          '12 yard rushing touchdown',
          '8 yard rushing touchdown'
        ] },
      { week:  5, date: '2023-09-30', kickoff: '9:00am',
        opponent: 'Colorado', home: false, conference: true,
        result: { teamScore: 52, opponentScore: 34 }, booster: null,
        stats: {
          carries: 31, rushingYards: 236, rushingTd: 2, rushingLong: 57,
          receptions: 5, receivingYards: 41, receivingYac: 29,
          receivingTd: 0, receivingLong: 16, targets: 6, fumbles: 0,
          rushingAvg: 7.6, receivingAvg: 8.2, totalYards: 277, totalTd: 2
        },
        bigPlays: [
          '57 yard rushing touchdown',
          '3 yard rushing touchdown'
        ] },
      { week:  6, date: '2023-10-07', kickoff: '7:30pm',
        opponent: 'Arizona', home: true, conference: true,
        result: { teamScore: 46, opponentScore: 34 }, booster: null,
        stats: {
          carries: 29, rushingYards: 112, rushingTd: 1, rushingLong: 17,
          receptions: 7, receivingYards: 71, receivingYac: 52,
          receivingTd: 1, receivingLong: 24, targets: 8, fumbles: 0,
          rushingAvg: 3.9, receivingAvg: 10.1, totalYards: 183, totalTd: 2
        },
        bigPlays: [
          '2 yard rushing touchdown',
          '15 yard receiving touchdown'
        ] },
      { week:  7, date: '2023-10-14', kickoff: '4:30pm',
        opponent: 'Notre Dame', home: false, conference: false, scouts: true,
        result: { teamScore: 10, opponentScore: 51 }, booster: null,
        stats: {
          carries: 18, rushingYards: 61, rushingTd: 0, rushingLong: 13,
          receptions: 7, receivingYards: 68, receivingYac: 55,
          receivingTd: 0, receivingLong: 35, targets: 10, fumbles: 0,
          rushingAvg: 3.4, receivingAvg: 9.7, totalYards: 129, totalTd: 0
        } },
      { week:  8, date: '2023-10-21', kickoff: '5:00pm',
        opponent: 'Utah', home: true, conference: true, scouts: true,
        result: { teamScore: 33, opponentScore: 39 }, booster: null,
        stats: {
          carries: 25, rushingYards: 104, rushingTd: 2, rushingLong: 18,
          receptions: 6, receivingYards: 58, receivingYac: 44,
          receivingTd: 0, receivingLong: 23, targets: 7, fumbles: 0,
          rushingAvg: 4.2, receivingAvg: 9.7, totalYards: 162, totalTd: 2
        },
        bigPlays: [
          '5 yard rushing touchdown',
          '14 yard rushing touchdown'
        ] },
      { week:  9, date: '2023-10-28', kickoff: '1:00pm',
        opponent: 'California', home: false, conference: true,
        result: { teamScore: 52, opponentScore: 48 }, booster: null,
        stats: {
          carries: 30, rushingYards: 148, rushingTd: 2, rushingLong: 26,
          receptions: 5, receivingYards: 47, receivingYac: 36,
          receivingTd: 0, receivingLong: 16, targets: 7, fumbles: 1,
          rushingAvg: 4.9, receivingAvg: 9.4, totalYards: 195, totalTd: 2
        },
        bigPlays: [
          '7 yard rushing touchdown',
          '1 yard rushing touchdown'
        ] },
      { week: 10, date: '2023-11-04', kickoff: '4:30pm',
        opponent: 'Washington', home: true, conference: true, scouts: true,
        result: { teamScore: 45, opponentScore: 57 }, booster: null,
        stats: {
          carries: 26, rushingYards: 118, rushingTd: 2, rushingLong: 21,
          receptions: 7, receivingYards: 63, receivingYac: 54,
          receivingTd: 1, receivingLong: 24, targets: 9, fumbles: 0,
          rushingAvg: 4.5, receivingAvg: 9, totalYards: 181, totalTd: 3
        },
        bigPlays: [
          '3 yard rushing touchdown',
          '2 yard rushing touchdown',
          '4 yard receiving touchdown'
        ] },
      { week: 11, date: '2023-11-11', kickoff: '7:30pm',
        opponent: 'Oregon', home: false, conference: true, scouts: true,
        result: { teamScore: 33, opponentScore: 45 }, booster: null,
        stats: {
          carries: 27, rushingYards: 121, rushingTd: 1, rushingLong: 24,
          receptions: 5, receivingYards: 38, receivingYac: 27,
          receivingTd: 0, receivingLong: 13, targets: 6, fumbles: 0,
          rushingAvg: 4.5, receivingAvg: 7.6, totalYards: 159, totalTd: 1
        },
        bigPlays: [
          '9 yard rushing touchdown'
        ] },
      { week: 12, date: '2023-11-18', kickoff: '12:30pm',
        opponent: 'UCLA', home: true, conference: true,
        result: { teamScore: 21, opponentScore: 33 }, booster: null,
        stats: {
          carries: 24, rushingYards: 109, rushingTd: 1, rushingLong: 19,
          receptions: 8, receivingYards: 71, receivingYac: 52,
          receivingTd: 0, receivingLong: 29, targets: 10, fumbles: 0,
          rushingAvg: 4.5, receivingAvg: 8.9, totalYards: 180, totalTd: 1
        },
        bigPlays: [
          '4 yard rushing touchdown'
        ] },
    ],

    /* Paxon Hatch — North Carolina */
    'paxon-hatch': [
      { week:  1, date: '2023-09-02', kickoff: '7:30pm',
        opponent: 'South Carolina', home: false, conference: false, neutral: true,
        result: { teamScore: 30, opponentScore: 8 }, booster: null,
        stats: {
          receptions: 6, receivingYards: 66, receivingYac: 27,
          receivingTd: 1, receivingLong: 29, targets: 8, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 11, totalYards: 66, totalTd: 1
        },
        bigPlays: [
          '29 yard receiving touchdown'
        ] },
      { week:  2, date: '2023-09-09', kickoff: '5:15pm',
        opponent: 'App State', home: true, conference: false,
        result: { teamScore: 44, opponentScore: 41 }, booster: null,
        stats: {
          receptions: 7, receivingYards: 112, receivingYac: 41,
          receivingTd: 1, receivingLong: 66, targets: 9, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 16, totalYards: 112, totalTd: 1
        },
        bigPlays: [
          '14 yard receiving touchdown'
        ] },
      { week:  3, date: '2023-09-16', kickoff: '3:30pm',
        opponent: 'Minnesota', home: true, conference: false, scouts: true,
        result: { teamScore: 30, opponentScore: 9 }, booster: null,
        stats: {
          receptions: 7, receivingYards: 109, receivingYac: 36,
          receivingTd: 2, receivingLong: 73, targets: 9, carries: 1,
          rushingYards: 3, rushingTd: 0, rushingLong: 3, fumbles: 0,
          rushingAvg: 3, receivingAvg: 15.6, totalYards: 112, totalTd: 2
        },
        bigPlays: [
          '4 yard receiving touchdown',
          '2 yard receiving touchdown'
        ] },
      { week:  4, date: '2023-09-23', kickoff: '8:00pm',
        opponent: 'Pittsburgh', home: false, conference: true,
        result: { teamScore: 38, opponentScore: 26 }, booster: null,
        stats: {
          receptions: 8, receivingYards: 139, receivingYac: 61,
          receivingTd: 1, receivingLong: 42, targets: 11, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 17.4, totalYards: 139, totalTd: 1
        },
        bigPlays: [
          '42 yard receiving touchdown'
        ] },
      { week:  6, date: '2023-10-07', kickoff: '3:30pm',
        opponent: 'Syracuse', home: true, conference: true,
        result: { teamScore: 41, opponentScore: 15 }, booster: null,
        stats: {
          receptions: 8, receivingYards: 124, receivingYac: 41,
          receivingTd: 1, receivingLong: 40, targets: 12, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 15.5, totalYards: 124, totalTd: 1
        },
        bigPlays: [
          '13 yard receiving touchdown'
        ] },
      { week:  7, date: '2023-10-14', kickoff: '7:30pm',
        opponent: 'Miami', home: true, conference: true,
        result: { teamScore: 37, opponentScore: 30 }, booster: null,
        stats: {
          receptions: 8, receivingYards: 95, receivingYac: 46,
          receivingTd: 2, receivingLong: 37, targets: 13, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 11.9, totalYards: 95, totalTd: 2
        },
        bigPlays: [
          '22 yard receiving touchdown',
          '16 yard receiving touchdown'
        ] },
      { week:  8, date: '2023-10-21', kickoff: '6:30pm',
        opponent: 'Virginia', home: true, conference: true,
        result: { teamScore: 18, opponentScore: 25 }, booster: null,
        stats: {
          receptions: 7, receivingYards: 133, receivingYac: 53,
          receivingTd: 0, receivingLong: 45, targets: 12, carries: 1,
          rushingYards: 6, rushingTd: 0, rushingLong: 6, fumbles: 0,
          rushingAvg: 6, receivingAvg: 19, totalYards: 139, totalTd: 0
        } },
      { week:  9, date: '2023-10-28', kickoff: '8:00pm',
        opponent: 'Georgia Tech', home: false, conference: true,
        result: { teamScore: 41, opponentScore: 59 }, booster: null,
        stats: {
          receptions: 6, receivingYards: 75, receivingYac: 30,
          receivingTd: 1, receivingLong: 21, targets: 10, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 12.5, totalYards: 75, totalTd: 1
        },
        bigPlays: [
          '7 yard receiving touchdown'
        ] },
      { week: 10, date: '2023-11-04', kickoff: '12:00pm',
        opponent: 'Campbell', home: true, conference: false,
        result: { teamScore: 66, opponentScore: 15 }, booster: null,
        stats: {
          receptions: 6, receivingYards: 79, receivingYac: 26,
          receivingTd: 2, receivingLong: 29, targets: 7, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 13.2, totalYards: 79, totalTd: 2
        },
        bigPlays: [
          '12 yard receiving touchdown',
          '11 yard receiving touchdown'
        ] },
      { week: 11, date: '2023-11-11', kickoff: '8:00pm',
        opponent: 'Duke', home: true, conference: true, scouts: true,
        result: { teamScore: 50, opponentScore: 46 }, booster: null,
        stats: {
          receptions: 6, receivingYards: 134, receivingYac: 55,
          receivingTd: 0, receivingLong: 82, targets: 9, carries: 1,
          rushingYards: 5, rushingTd: 0, rushingLong: 5, fumbles: 1,
          rushingAvg: 5, receivingAvg: 22.3, totalYards: 139, totalTd: 0
        } },
      { week: 12, date: '2023-11-18', kickoff: '3:30pm',
        opponent: 'Clemson', home: false, conference: true, scouts: true,
        result: { teamScore: 26, opponentScore: 22 }, booster: null,
        stats: {
          receptions: 6, receivingYards: 88, receivingYac: 35,
          receivingTd: 1, receivingLong: 44, targets: 8, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 14.7, totalYards: 88, totalTd: 1
        },
        bigPlays: [
          '44 yard game-winning receiving touchdown'
        ] },
      { week: 13, date: '2023-11-25', kickoff: '8:00pm',
        opponent: 'NC State', home: false, conference: true, scouts: true,
        result: { teamScore: 24, opponentScore: 36 }, booster: null,
        stats: {
          receptions: 8, receivingYards: 62, receivingYac: 28,
          receivingTd: 1, receivingLong: 32, targets: 12, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 7.8, totalYards: 62, totalTd: 1
        },
        bigPlays: [
          '32 yard receiving touchdown'
        ] },
    ],

    /* Isaac Vitel — Texas */
    'isaac-vitel': [
      { week:  1, date: '2023-09-02', kickoff: '2:30pm',
        opponent: 'Rice', home: true, conference: false,
        result: { teamScore: 37, opponentScore: 18 }, booster: null,
        stats: {
          completions: 17, attempts: 31, passingYards: 236,
          passingYac: 119, passingTd: 4, interceptions: 0, carries: 3,
          rushingYards: 7, rushingTd: 0, rushingLong: 4, sacks: 1,
          fumbles: 0, passingAvg: 13.9, rating: 119.1, rushingAvg: 2.3
        },
        bigPlays: [
          '75 yard passing touchdown',
          '11 yard passing touchdown',
          '11 yard passing touchdown',
          '27 yard passing touchdown'
        ] },
      { week:  2, date: '2023-09-09', kickoff: '6:00pm',
        opponent: 'Alabama', home: false, conference: false, scouts: true,
        result: { teamScore: 38, opponentScore: 21 }, booster: null,
        stats: {
          completions: 17, attempts: 30, passingYards: 207,
          passingYac: 63, passingTd: 4, interceptions: 1, carries: 4,
          rushingYards: 17, rushingTd: 0, rushingLong: 11, sacks: 1,
          fumbles: 0, passingAvg: 12.2, rating: 103.7, rushingAvg: 4.3
        },
        bigPlays: [
          '62 yard passing touchdown',
          '53 yard passing touchdown',
          '3 yard passing touchdown',
          '18 yard passing touchdown'
        ] },
      { week:  3, date: '2023-09-16', kickoff: '7:00pm',
        opponent: 'Wyoming', home: true, conference: false,
        result: { teamScore: 34, opponentScore: 21 }, booster: null,
        stats: {
          completions: 23, attempts: 42, passingYards: 291,
          passingYac: 155, passingTd: 3, interceptions: 1, carries: 5,
          rushingYards: 8, rushingTd: 0, rushingLong: 2, sacks: 3,
          fumbles: 1, passingAvg: 12.7, rating: 90.5, rushingAvg: 1.6
        },
        bigPlays: [
          '12 yard passing touchdown',
          '11 yard passing touchdown',
          '24 yard passing touchdown'
        ] },
      { week:  4, date: '2023-09-23', kickoff: '6:30pm',
        opponent: 'Baylor', home: false, conference: true,
        result: { teamScore: 37, opponentScore: 9 }, booster: null,
        stats: {
          completions: 17, attempts: 27, passingYards: 313,
          passingYac: 93, passingTd: 4, interceptions: 1, carries: 7,
          rushingYards: 18, rushingTd: 0, rushingLong: 6, sacks: 1,
          fumbles: 0, passingAvg: 18.4, rating: 127, rushingAvg: 2.6
        },
        bigPlays: [
          '50 yard passing touchdown',
          '16 yard passing touchdown',
          '15 yard passing touchdown',
          '9 yard passing touchdown'
        ] },
      { week:  5, date: '2023-09-30', kickoff: '2:30pm',
        opponent: 'Kansas', home: true, conference: true,
        result: { teamScore: 36, opponentScore: 8 }, booster: null,
        stats: {
          completions: 21, attempts: 32, passingYards: 329,
          passingYac: 80, passingTd: 4, interceptions: 1, carries: 3,
          rushingYards: 11, rushingTd: 0, rushingLong: 8, sacks: 2,
          fumbles: 0, passingAvg: 15.7, rating: 126.2, rushingAvg: 3.7
        },
        bigPlays: [
          '35 yard passing touchdown',
          '18 yard passing touchdown',
          '10 yard passing touchdown',
          '3 yard passing touchdown'
        ] },
      { week:  6, date: '2023-10-07', kickoff: '11:00am',
        opponent: 'Oklahoma', home: false, conference: true, neutral: true, scouts: true,
        result: { teamScore: 26, opponentScore: 30 }, booster: null,
        stats: {
          completions: 24, attempts: 38, passingYards: 268,
          passingYac: 72, passingTd: 3, interceptions: 1, carries: 4,
          rushingYards: 9, rushingTd: 0, rushingLong: 4, sacks: 1,
          fumbles: 1, passingAvg: 11.2, rating: 99.5, rushingAvg: 2.3
        },
        bigPlays: [
          '50 yard passing touchdown',
          '23 yard passing touchdown',
          '4 yard passing touchdown'
        ] },
      { week:  8, date: '2023-10-21', kickoff: '3:00pm',
        opponent: 'Houston', home: false, conference: true,
        result: { teamScore: 20, opponentScore: 23 }, booster: null,
        stats: {
          completions: 22, attempts: 35, passingYards: 306,
          passingYac: 88, passingTd: 2, interceptions: 1, carries: 4,
          rushingYards: 8, rushingTd: 0, rushingLong: 3.5, sacks: 3,
          fumbles: 0, passingAvg: 13.9, rating: 98, rushingAvg: 2
        },
        bigPlays: [
          '57 yard passing touchdown',
          '45 yard passing touchdown'
        ] },
      { week:  9, date: '2023-10-28', kickoff: '2:30pm',
        opponent: 'BYU', home: true, conference: true, injured: true, injury: 'Bruised Ribs', health: 62,
        result: { teamScore: 23, opponentScore: 6 }, booster: null,
        stats: {
          completions: 0, attempts: 0, passingYards: 0, passingYac: 0,
          passingTd: 0, interceptions: 0, carries: 0, rushingYards: 0,
          rushingTd: 0, rushingLong: 0, sacks: 0, fumbles: 0
        } },
      { week: 10, date: '2023-11-04', kickoff: '11:00am',
        opponent: 'Kansas State', home: true, conference: true, scouts: true, injured: true, injury: 'Bruised Ribs', health: 78,
        result: { teamScore: 34, opponentScore: 33 }, booster: null,
        stats: {
          completions: 0, attempts: 0, passingYards: 0, passingYac: 0,
          passingTd: 0, interceptions: 0, carries: 0, rushingYards: 0,
          rushingTd: 0, rushingLong: 0, sacks: 0, fumbles: 0
        } },
      { week: 11, date: '2023-11-11', kickoff: '6:30pm',
        opponent: 'TCU', home: false, conference: true,
        result: { teamScore: 31, opponentScore: 23 }, booster: null,
        stats: {
          completions: 30, attempts: 44, passingYards: 633,
          passingYac: 206, passingTd: 4, interceptions: 1, carries: 3,
          rushingYards: 6, rushingTd: 0, rushingLong: 3, sacks: 2,
          fumbles: 0, passingAvg: 21.1, rating: 131.8, rushingAvg: 2
        },
        bigPlays: [
          '64 yard passing touchdown',
          '17 yard passing touchdown',
          '11 yard passing touchdown',
          '33 yard passing touchdown'
        ] },
      { week: 12, date: '2023-11-18', kickoff: '7:00pm',
        opponent: 'Iowa State', home: false, conference: true, scouts: true,
        result: { teamScore: 28, opponentScore: 14 }, booster: null,
        stats: {
          completions: 15, attempts: 27, passingYards: 154,
          passingYac: 56, passingTd: 3, interceptions: 0, carries: 3,
          rushingYards: 10, rushingTd: 0, rushingLong: 7, sacks: 1,
          fumbles: 0, passingAvg: 10.3, rating: 109.2, rushingAvg: 3.3
        },
        bigPlays: [
          '11 yard passing touchdown',
          '8 yard passing touchdown',
          '21 yard passing touchdown'
        ] },
      { week: 13, date: '2023-11-24', kickoff: '6:30pm',
        opponent: 'Texas Tech', home: true, conference: true,
        result: { teamScore: 60, opponentScore: 7 }, booster: null,
        stats: {
          completions: 14, attempts: 25, passingYards: 213,
          passingYac: 81, passingTd: 5, interceptions: 0, carries: 2,
          rushingYards: 4, rushingTd: 0, rushingLong: 2.5, sacks: 2,
          fumbles: 0, passingAvg: 15.2, rating: 123.8, rushingAvg: 2
        },
        bigPlays: [
          '49 yard passing touchdown',
          '43 yard passing touchdown',
          '39 yard passing touchdown',
          '1 yard passing touchdown',
          '22 yard passing touchdown'
        ] },
    ],

    /* Sam Stogsdill — Seattle Seahawks */
    'sam-stogsdill': [
      { week:  1, date: '2023-09-10', kickoff: '1:25pm',
        opponent: 'Los Angeles Rams', home: true, conference: false, division: true,
        result: { teamScore: 9, opponentScore: 26 }, booster: null,
        stats: {
          carries: 8, rushingYards: 42, rushingTd: 0, rushingLong: 18,
          receptions: 2, receivingYards: 11, receivingYac: 10,
          receivingTd: 0, receivingLong: 7, targets: 2, fumbles: 0,
          rushingAvg: 5.3, receivingAvg: 5.5, totalYards: 53, totalTd: 0
        } },
      { week:  2, date: '2023-09-17', kickoff: '10:00am',
        opponent: 'Detroit Lions', home: false, conference: false,
        result: { teamScore: 32, opponentScore: 33 }, booster: null,
        stats: {
          carries: 9, rushingYards: 31, rushingTd: 1, rushingLong: 9,
          receptions: 2, receivingYards: 15, receivingYac: 14,
          receivingTd: 0, receivingLong: 11, targets: 2, fumbles: 0,
          rushingAvg: 3.4, receivingAvg: 7.5, totalYards: 46, totalTd: 1
        },
        bigPlays: [
          '1 yard rushing touchdown'
        ] },
      { week:  3, date: '2023-09-24', kickoff: '1:05pm',
        opponent: 'Carolina Panthers', home: true, conference: false,
        result: { teamScore: 42, opponentScore: 22 }, booster: null,
        stats: {
          carries: 13, rushingYards: 51, rushingTd: 1, rushingLong: 10,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 0,
          rushingAvg: 3.9, totalYards: 51, totalTd: 1
        },
        bigPlays: [
          '1 yard rushing touchdown'
        ] },
      { week:  4, date: '2023-10-02', kickoff: '5:15pm',
        opponent: 'New York Giants', home: false, conference: false,
        result: { teamScore: 23, opponentScore: 0 }, booster: null,
        stats: {
          carries: 14, rushingYards: 63, rushingTd: 0, rushingLong: 9,
          receptions: 1, receivingYards: 8, receivingYac: 8,
          receivingTd: 0, receivingLong: 8, targets: 1, fumbles: 0,
          rushingAvg: 4.5, receivingAvg: 8, totalYards: 71, totalTd: 0
        } },
      { week:  5, date: '2023-10-08', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week:  6, date: '2023-10-15', kickoff: '10:00am',
        opponent: 'Cincinnati Bengals', home: false, conference: false,
        result: { teamScore: 9, opponentScore: 17 }, booster: null,
        stats: {
          carries: 9, rushingYards: 45, rushingTd: 0, rushingLong: 16,
          receptions: 2, receivingYards: 9, receivingYac: 9,
          receivingTd: 0, receivingLong: 5, targets: 3, fumbles: 0,
          rushingAvg: 5, receivingAvg: 4.5, totalYards: 54, totalTd: 0
        } },
      { week:  7, date: '2023-10-22', kickoff: '1:05pm',
        opponent: 'Arizona Cardinals', home: true, conference: false, division: true,
        result: { teamScore: 12, opponentScore: 10 }, booster: null,
        stats: {
          carries: 8, rushingYards: 46, rushingTd: 0, rushingLong: 13,
          receptions: 1, receivingYards: 14, receivingYac: 11,
          receivingTd: 0, receivingLong: 14, targets: 1, fumbles: 0,
          rushingAvg: 5.8, receivingAvg: 14, totalYards: 60, totalTd: 0
        } },
      { week:  8, date: '2023-10-29', kickoff: '1:05pm',
        opponent: 'Cleveland Browns', home: true, conference: false,
        result: { teamScore: 26, opponentScore: 12 }, booster: null,
        stats: {
          carries: 15, rushingYards: 52, rushingTd: 1, rushingLong: 9,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 0,
          rushingAvg: 3.5, totalYards: 52, totalTd: 1
        },
        bigPlays: [
          '4 yard rushing touchdown'
        ] },
      { week:  9, date: '2023-11-05', kickoff: '10:00am',
        opponent: 'Baltimore Ravens', home: false, conference: false,
        result: { teamScore: 8, opponentScore: 37 }, booster: null,
        stats: {
          carries: 6, rushingYards: 29, rushingTd: 0, rushingLong: 11,
          receptions: 2, receivingYards: 22, receivingYac: 22,
          receivingTd: 0, receivingLong: 18, targets: 4, fumbles: 0,
          rushingAvg: 4.8, receivingAvg: 11, totalYards: 51, totalTd: 0
        } },
      { week: 10, date: '2023-11-12', kickoff: '1:25pm',
        opponent: 'Washington Commanders', home: true, conference: false,
        result: { teamScore: 35, opponentScore: 23 }, booster: null,
        stats: {
          carries: 11, rushingYards: 61, rushingTd: 0, rushingLong: 14,
          receptions: 1, receivingYards: 11, receivingYac: 11,
          receivingTd: 0, receivingLong: 11, targets: 1, fumbles: 1,
          rushingAvg: 5.5, receivingAvg: 11, totalYards: 72, totalTd: 0
        } },
      { week: 11, date: '2023-11-19', kickoff: '1:25pm',
        opponent: 'Los Angeles Rams', home: false, conference: false, division: true,
        result: { teamScore: 9, opponentScore: 15 }, booster: null,
        stats: {
          carries: 11, rushingYards: 73, rushingTd: 0, rushingLong: 20,
          receptions: 1, receivingYards: 8, receivingYac: 6,
          receivingTd: 0, receivingLong: 8, targets: 1, fumbles: 0,
          rushingAvg: 6.6, receivingAvg: 8, totalYards: 81, totalTd: 0
        } },
      { week: 12, date: '2023-11-23', kickoff: '5:20pm',
        opponent: 'San Francisco 49ers', home: true, conference: false, division: true,
        result: { teamScore: 17, opponentScore: 31 }, booster: null,
        stats: {
          carries: 7, rushingYards: 23, rushingTd: 0, rushingLong: 8,
          receptions: 2, receivingYards: 11, receivingYac: 10,
          receivingTd: 1, receivingLong: 7, targets: 2, fumbles: 0,
          rushingAvg: 3.3, receivingAvg: 5.5, totalYards: 34, totalTd: 1
        },
        bigPlays: [
          '7 yard receiving touchdown'
        ] },
      { week: 13, date: '2023-11-30', kickoff: '5:15pm',
        opponent: 'Dallas Cowboys', home: false, conference: false,
        result: { teamScore: 45, opponentScore: 42 }, booster: null,
        stats: {
          carries: 9, rushingYards: 55, rushingTd: 1, rushingLong: 33,
          receptions: 2, receivingYards: 13, receivingYac: 13,
          receivingTd: 0, receivingLong: 9, targets: 3, fumbles: 0,
          rushingAvg: 6.1, receivingAvg: 6.5, totalYards: 68, totalTd: 1
        },
        bigPlays: [
          '33 yard rushing touchdown'
        ] },
      { week: 14, date: '2023-12-10', kickoff: '1:05pm',
        opponent: 'San Francisco 49ers', home: false, conference: false, division: true,
        result: { teamScore: 23, opponentScore: 26 }, booster: null,
        stats: {
          carries: 9, rushingYards: 44, rushingTd: 1, rushingLong: 19,
          receptions: 1, receivingYards: 10, receivingYac: 9,
          receivingTd: 0, receivingLong: 10, targets: 1, fumbles: 0,
          rushingAvg: 4.9, receivingAvg: 10, totalYards: 54, totalTd: 1
        },
        bigPlays: [
          '19 yard rushing touchdown'
        ] },
      { week: 15, date: '2023-12-18', kickoff: '5:15pm',
        opponent: 'Philadelphia Eagles', home: true, conference: false,
        result: { teamScore: 21, opponentScore: 13 }, booster: null,
        stats: {
          carries: 12, rushingYards: 55, rushingTd: 1, rushingLong: 15,
          receptions: 1, receivingYards: 7, receivingYac: 6,
          receivingTd: 0, receivingLong: 7, targets: 1, fumbles: 0,
          rushingAvg: 4.6, receivingAvg: 7, totalYards: 62, totalTd: 1
        },
        bigPlays: [
          '6 yard rushing touchdown'
        ] },
      { week: 16, date: '2023-12-24', kickoff: '10:00am',
        opponent: 'Tennessee Titans', home: false, conference: false,
        result: { teamScore: 16, opponentScore: 18 }, booster: null,
        stats: {
          carries: 10, rushingYards: 36, rushingTd: 0, rushingLong: 8,
          receptions: 2, receivingYards: 14, receivingYac: 14,
          receivingTd: 0, receivingLong: 10, targets: 3, fumbles: 0,
          rushingAvg: 3.6, receivingAvg: 7, totalYards: 50, totalTd: 0
        } },
      { week: 17, date: '2023-12-31', kickoff: '1:05pm',
        opponent: 'Pittsburgh Steelers', home: true, conference: false,
        result: { teamScore: 25, opponentScore: 34 }, booster: null,
        stats: {
          carries: 13, rushingYards: 50, rushingTd: 0, rushingLong: 17,
          receptions: 1, receivingYards: 7, receivingYac: 7,
          receivingTd: 0, receivingLong: 7, targets: 1, fumbles: 0,
          rushingAvg: 3.8, receivingAvg: 7, totalYards: 57, totalTd: 0
        } },
      { week: 18, date: '2024-01-07', kickoff: '1:25pm',
        opponent: 'Arizona Cardinals', home: false, conference: false, division: true,
        result: { teamScore: 27, opponentScore: 25 }, booster: null,
        stats: {
          carries: 12, rushingYards: 59, rushingTd: 0, rushingLong: 20,
          receptions: 1, receivingYards: 8, receivingYac: 8,
          receivingTd: 0, receivingLong: 8, targets: 2, fumbles: 1,
          rushingAvg: 4.9, receivingAvg: 8, totalYards: 67, totalTd: 0
        } },
    ],

    /* Jaykeb Stewart — Houston Texans */
    'jaykeb-stewart': [
      { week:  1, date: '2023-09-10', kickoff: '12:00pm',
        opponent: 'Baltimore Ravens', home: false, conference: false,
        result: { teamScore: 10, opponentScore: 32 }, booster: null,
        stats: {
          completions: 27, attempts: 46, passingYards: 189,
          passingYac: 95, passingTd: 1, interceptions: 2, carries: 6,
          rushingYards: 27, rushingTd: 0, rushingLong: 18, sacks: 6,
          fumbles: 0, passingAvg: 7, rating: 57.2, rushingAvg: 4.5
        },
        bigPlays: [
          '5 yard passing touchdown'
        ] },
      { week:  2, date: '2023-09-17', kickoff: '12:00pm',
        opponent: 'Indianapolis Colts', home: true, conference: false, division: true,
        result: { teamScore: 20, opponentScore: 30 }, booster: null,
        stats: {
          completions: 25, attempts: 36, passingYards: 296,
          passingYac: 149, passingTd: 1, interceptions: 2, carries: 2,
          rushingYards: 7, rushingTd: 0, rushingLong: 5.5, sacks: 1,
          fumbles: 0, passingAvg: 11.8, rating: 80.3, rushingAvg: 3.5
        },
        bigPlays: [
          '66 yard passing touchdown'
        ] },
      { week:  3, date: '2023-09-24', kickoff: '12:00pm',
        opponent: 'Jacksonville Jaguars', home: false, conference: false, division: true,
        result: { teamScore: 36, opponentScore: 22 }, booster: null,
        stats: {
          completions: 16, attempts: 25, passingYards: 180,
          passingYac: 69, passingTd: 1, interceptions: 1, carries: 5,
          rushingYards: 22, rushingTd: 0, rushingLong: 15, sacks: 1,
          fumbles: 0, passingAvg: 11.3, rating: 82.1, rushingAvg: 4.4
        },
        bigPlays: [
          '30 yard passing touchdown'
        ] },
      { week:  4, date: '2023-10-01', kickoff: '12:00pm',
        opponent: 'Pittsburgh Steelers', home: true, conference: false,
        result: { teamScore: 29, opponentScore: 6 }, booster: null,
        stats: {
          completions: 15, attempts: 23, passingYards: 183,
          passingYac: 70, passingTd: 1, interceptions: 1, carries: 5,
          rushingYards: 29, rushingTd: 2, rushingLong: 17, sacks: 2,
          fumbles: 0, passingAvg: 12.2, rating: 86, rushingAvg: 5.8
        },
        bigPlays: [
          '11 yard passing touchdown',
          '5 yard rushing touchdown',
          '4 yard rushing touchdown'
        ] },
      { week:  5, date: '2023-10-08', kickoff: '12:00pm',
        opponent: 'Atlanta Falcons', home: false, conference: false,
        result: { teamScore: 12, opponentScore: 22 }, booster: null,
        stats: {
          completions: 28, attempts: 38, passingYards: 356,
          passingYac: 185, passingTd: 1, interceptions: 0, carries: 2,
          rushingYards: 6, rushingTd: 1, rushingLong: 4, sacks: 3,
          fumbles: 0, passingAvg: 12.7, rating: 111.3, rushingAvg: 3
        },
        bigPlays: [
          '1 yard passing touchdown',
          '2 yard rushing touchdown'
        ] },
      { week:  6, date: '2023-10-15', kickoff: '12:00pm',
        opponent: 'New Orleans Saints', home: true, conference: false,
        result: { teamScore: 23, opponentScore: 8 }, booster: null,
        stats: {
          completions: 21, attempts: 29, passingYards: 252,
          passingYac: 121, passingTd: 2, interceptions: 0, carries: 3,
          rushingYards: 10, rushingTd: 0, rushingLong: 7, sacks: 2,
          fumbles: 0, passingAvg: 12, rating: 121.6, rushingAvg: 3.3
        },
        bigPlays: [
          '60 yard passing touchdown',
          '15 yard passing touchdown'
        ] },
      { week:  7, date: '2023-10-22', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week:  8, date: '2023-10-29', kickoff: '12:00pm',
        opponent: 'Carolina Panthers', home: false, conference: false,
        result: { teamScore: 7, opponentScore: 19 }, booster: null,
        stats: {
          completions: 24, attempts: 38, passingYards: 239,
          passingYac: 117, passingTd: 1, interceptions: 0, carries: 5,
          rushingYards: 54, rushingTd: 0, rushingLong: 31, sacks: 4,
          fumbles: 0, passingAvg: 10, rating: 89.7, rushingAvg: 10.8
        },
        bigPlays: [
          '64 yard passing touchdown'
        ] },
      { week:  9, date: '2023-11-05', kickoff: '12:00pm',
        opponent: 'Tampa Bay Buccaneers', home: true, conference: false,
        result: { teamScore: 41, opponentScore: 36 }, booster: null,
        stats: {
          completions: 18, attempts: 25, passingYards: 280,
          passingYac: 188, passingTd: 2, interceptions: 0, carries: 4,
          rushingYards: 16, rushingTd: 0, rushingLong: 11.5, sacks: 2,
          fumbles: 0, passingAvg: 15.6, rating: 135.4, rushingAvg: 4
        },
        bigPlays: [
          '14 yard passing touchdown',
          '11 yard passing touchdown'
        ] },
      { week: 10, date: '2023-11-12', kickoff: '12:00pm',
        opponent: 'Cincinnati Bengals', home: false, conference: false, overtime: true,
        result: { teamScore: 34, opponentScore: 37 }, booster: null,
        stats: {
          completions: 23, attempts: 34, passingYards: 249,
          passingYac: 92, passingTd: 3, interceptions: 1, carries: 4,
          rushingYards: 37, rushingTd: 1, rushingLong: 20, sacks: 1,
          fumbles: 0, passingAvg: 10.8, rating: 106.1, rushingAvg: 9.3
        },
        bigPlays: [
          '22 yard passing touchdown',
          '16 yard passing touchdown',
          '10 yard passing touchdown',
          '3 yard rushing touchdown'
        ] },
      { week: 11, date: '2023-11-19', kickoff: '12:00pm',
        opponent: 'Arizona Cardinals', home: true, conference: false,
        result: { teamScore: 26, opponentScore: 20 }, booster: null,
        stats: {
          completions: 22, attempts: 27, passingYards: 323,
          passingYac: 155, passingTd: 2, interceptions: 0, carries: 4,
          rushingYards: 16, rushingTd: 0, rushingLong: 7, sacks: 1,
          fumbles: 0, passingAvg: 14.7, rating: 141.2, rushingAvg: 4
        },
        bigPlays: [
          '21 yard passing touchdown',
          '4 yard passing touchdown'
        ] },
      { week: 12, date: '2023-11-26', kickoff: '12:00pm',
        opponent: 'Jacksonville Jaguars', home: true, conference: false, division: true,
        result: { teamScore: 25, opponentScore: 24 }, booster: null,
        stats: {
          completions: 18, attempts: 24, passingYards: 153,
          passingYac: 78, passingTd: 1, interceptions: 1, carries: 2,
          rushingYards: 11, rushingTd: 0, rushingLong: 9.5, sacks: 1,
          fumbles: 0, passingAvg: 8.5, rating: 87.7, rushingAvg: 5.5
        },
        bigPlays: [
          '11 yard passing touchdown'
        ] },
      { week: 13, date: '2023-12-03', kickoff: '12:00pm',
        opponent: 'Denver Broncos', home: true, conference: false,
        result: { teamScore: 22, opponentScore: 20 }, booster: null,
        stats: {
          completions: 22, attempts: 33, passingYards: 255,
          passingYac: 134, passingTd: 3, interceptions: 1, carries: 6,
          rushingYards: 22, rushingTd: 0, rushingLong: 9, sacks: 1,
          fumbles: 0, passingAvg: 11.6, rating: 107.5, rushingAvg: 3.7
        },
        bigPlays: [
          '34 yard passing touchdown',
          '10 yard passing touchdown',
          '2 yard passing touchdown'
        ] },
      { week: 14, date: '2023-12-10', kickoff: '12:00pm',
        opponent: 'New York Jets', home: false, conference: false,
        result: { teamScore: 6, opponentScore: 36 }, booster: null,
        stats: {
          completions: 21, attempts: 34, passingYards: 276,
          passingYac: 122, passingTd: 1, interceptions: 0, carries: 8,
          rushingYards: 50, rushingTd: 0, rushingLong: 13, sacks: 2,
          fumbles: 0, passingAvg: 13.1, rating: 97.2, rushingAvg: 6.3
        },
        bigPlays: [
          '4 yard passing touchdown'
        ] },
      { week: 15, date: '2023-12-17', kickoff: '12:00pm',
        opponent: 'Tennessee Titans', home: false, conference: false, division: true,
        result: { teamScore: 24, opponentScore: 13 }, booster: null,
        stats: {
          completions: 21, attempts: 31, passingYards: 240,
          passingYac: 132, passingTd: 1, interceptions: 0, carries: 9,
          rushingYards: 35, rushingTd: 0, rushingLong: 10, sacks: 2,
          fumbles: 1, passingAvg: 11.4, rating: 101.5, rushingAvg: 3.9
        },
        bigPlays: [
          '3 yard passing touchdown'
        ] },
      { week: 16, date: '2023-12-24', kickoff: '12:00pm',
        opponent: 'Cleveland Browns', home: true, conference: false,
        result: { teamScore: 36, opponentScore: 40 }, booster: null,
        stats: {
          completions: 19, attempts: 29, passingYards: 267,
          passingYac: 103, passingTd: 2, interceptions: 0, carries: 2,
          rushingYards: 8, rushingTd: 0, rushingLong: 6, sacks: 2,
          fumbles: 0, passingAvg: 14.1, rating: 118, rushingAvg: 4
        },
        bigPlays: [
          '29 yard passing touchdown',
          '7 yard passing touchdown'
        ] },
      { week: 17, date: '2023-12-31', kickoff: '12:00pm',
        opponent: 'Tennessee Titans', home: true, conference: false, division: true,
        result: { teamScore: 21, opponentScore: 0 }, booster: null,
        stats: {
          completions: 13, attempts: 21, passingYards: 147,
          passingYac: 76, passingTd: 1, interceptions: 1, carries: 3,
          rushingYards: 40, rushingTd: 0, rushingLong: 25, sacks: 1,
          fumbles: 1, passingAvg: 11.3, rating: 78.9, rushingAvg: 13.3
        },
        bigPlays: [
          '44 yard passing touchdown'
        ] },
      { week: 18, date: '2024-01-06', kickoff: '7:15pm',
        opponent: 'Indianapolis Colts', home: false, conference: false, division: true,
        result: { teamScore: 19, opponentScore: 17 }, booster: null,
        stats: {
          completions: 19, attempts: 29, passingYards: 165,
          passingYac: 85, passingTd: 2, interceptions: 0, carries: 4,
          rushingYards: 12, rushingTd: 1, rushingLong: 6, sacks: 1,
          fumbles: 1, passingAvg: 8.7, rating: 103.4, rushingAvg: 3
        },
        bigPlays: [
          '5 yard passing touchdown',
          '2 yard passing touchdown',
          '3 yard rushing touchdown'
        ] },
    ],
  }
};
