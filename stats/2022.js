/* ==========================================================================
   EGE Football — the 2022 season
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

EGE.stats[2022] = {
  season: 2022,
  level: 'College football',

  /* How the rest of each draw went. See data/brackets.js for the
     order: the whole left half top to bottom, then the whole right.
     [winner, winner's score, loser's score], or null for a bye and
     for the one matchup his own school is in. */
  playoffs: {
    ohioState: [
      { week: 18, results: [
        null,
        ['Georgia', 21, 13],
      ] },
      { week: 18, results: [
        ['Michigan', 31, 23],
      ] },
    ],

    alabama: [
      { week: 18, results: [
        ['Michigan', 35, 21],
        null,
      ] },
      { week: 18, results: [
        ['Michigan', 31, 23],
      ] },
    ],
  },

  games: {

    /* Andrew Parr — Alabama */
    'andrew-parr': [
      { week:  1, date: '2022-09-03', kickoff: '6:30pm',
        opponent: 'Utah State', home: true, conference: false,
        result: { teamScore: 61, opponentScore: 0 }, booster: null,
        stats: {
          receptions: 7, receivingYards: 60, receivingYac: 30,
          receivingTd: 0, receivingLong: 22, targets: 13, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 8.6, totalYards: 60, totalTd: 0
        } },
      { week:  2, date: '2022-09-10', kickoff: '11:00am',
        opponent: 'Texas', home: false, conference: false, scouts: true,
        result: { teamScore: 27, opponentScore: 13 }, booster: null,
        stats: {
          receptions: 10, receivingYards: 84, receivingYac: 29,
          receivingTd: 0, receivingLong: 21, targets: 11, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 8.4, totalYards: 84, totalTd: 0
        } },
      { week:  3, date: '2022-09-17', kickoff: '3:00pm',
        opponent: 'UL Monroe', home: true, conference: false,
        result: { teamScore: 63, opponentScore: 6 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 51, receivingYac: 18,
          receivingTd: 4, receivingLong: 25, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 12.8, totalYards: 51, totalTd: 4
        },
        bigPlays: [
          '25 yard receiving touchdown',
          '11 yard receiving touchdown',
          '10 yard receiving touchdown',
          '5 yard receiving touchdown'
        ] },
      { week:  4, date: '2022-09-24', kickoff: '6:30pm',
        opponent: 'Vanderbilt', home: true, conference: true,
        result: { teamScore: 56, opponentScore: 3 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 98, receivingYac: 40,
          receivingTd: 1, receivingLong: 67, targets: 5, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 24.5, totalYards: 98, totalTd: 1
        },
        bigPlays: [
          '5 yard receiving touchdown'
        ] },
      { week:  5, date: '2022-10-01', kickoff: '2:30pm',
        opponent: 'Arkansas', home: false, conference: true,
        result: { teamScore: 56, opponentScore: 17 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 52, receivingYac: 24,
          receivingTd: 1, receivingLong: 25, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 13, totalYards: 52, totalTd: 1
        },
        bigPlays: [
          '25 yard receiving touchdown'
        ] },
      { week:  6, date: '2022-10-08', kickoff: '7:00pm',
        opponent: 'Texas A&M', home: true, conference: true, scouts: true,
        result: { teamScore: 19, opponentScore: 24 }, booster: null,
        stats: {
          receptions: 3, receivingYards: 47, receivingYac: 12,
          receivingTd: 0, receivingLong: 47, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 15.7, totalYards: 47, totalTd: 0
        } },
      { week:  7, date: '2022-10-15', kickoff: '2:30pm',
        opponent: 'Tennessee', home: false, conference: true, scouts: true,
        result: { teamScore: 42, opponentScore: 59 }, booster: null,
        stats: {
          receptions: 7, receivingYards: 92, receivingYac: 19,
          receivingTd: 1, receivingLong: 25, targets: 9, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 13.1, totalYards: 92, totalTd: 1
        },
        bigPlays: [
          '8 yard receiving touchdown'
        ] },
      { week:  8, date: '2022-10-22', kickoff: '6:00pm',
        opponent: 'Mississippi State', home: true, conference: true,
        result: { teamScore: 35, opponentScore: 0 }, booster: null,
        stats: {
          receptions: 7, receivingYards: 117, receivingYac: 61,
          receivingTd: 1, receivingLong: 42, targets: 8, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 16.7, totalYards: 117, totalTd: 1
        },
        bigPlays: [
          '6 yard receiving touchdown'
        ] },
      { week: 10, date: '2022-11-05', kickoff: '6:00pm',
        opponent: 'LSU', home: false, conference: true, scouts: true,
        result: { teamScore: 38, opponentScore: 24 }, booster: null,
        stats: {
          receptions: 6, receivingYards: 153, receivingYac: 64,
          receivingTd: 3, receivingLong: 54, targets: 7, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 25.5, totalYards: 153, totalTd: 3
        },
        bigPlays: [
          '49 yard receiving touchdown',
          '21 yard receiving touchdown',
          '20 yard receiving touchdown'
        ] },
      { week: 11, date: '2022-11-12', kickoff: '2:30pm',
        opponent: 'Ole Miss', home: false, conference: true,
        result: { teamScore: 31, opponentScore: 21 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 54, receivingYac: 22,
          receivingTd: 0, receivingLong: 24, targets: 9, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 10.8, totalYards: 54, totalTd: 0
        } },
      { week: 12, date: '2022-11-19', kickoff: '11:00am',
        opponent: 'Austin Peay', home: true, conference: false,
        result: { teamScore: 38, opponentScore: 0 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 52, receivingYac: 13,
          receivingTd: 0, receivingLong: 33, targets: 5, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 13, totalYards: 52, totalTd: 0
        } },
      { week: 13, date: '2022-11-26', kickoff: '2:30pm',
        opponent: 'Auburn', home: true, conference: true,
        result: { teamScore: 38, opponentScore: 37 }, booster: null,
        stats: {
          receptions: 11, receivingYards: 175, receivingYac: 88,
          receivingTd: 3, receivingLong: 74, targets: 14, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 15.9, totalYards: 175, totalTd: 3
        },
        bigPlays: [
          '74 yard receiving touchdown',
          '23 yard receiving touchdown',
          '18 yard receiving touchdown'
        ] },
      { week: 15, date: '2022-12-03', kickoff: null,
        name: 'SEC Championship',
        opponent: 'Georgia', home: false, conference: false, neutral: true, playoff: true,
        result: { teamScore: 33, opponentScore: 31 }, booster: null,
        stats: {
          receptions: 6, receivingYards: 70, receivingYac: 36,
          receivingTd: 0, receivingLong: 35, targets: 7, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 11.7, totalYards: 70, totalTd: 0
        } },
      { week: 18, date: '2022-12-31', kickoff: null,
        name: 'Peach Bowl — CFP Semifinal',
        opponent: 'Georgia', home: false, conference: false, neutral: true, playoff: true,
        result: { teamScore: 13, opponentScore: 21 }, booster: null,
        stats: {
          receptions: 6, receivingYards: 95, receivingYac: 25,
          receivingTd: 0, receivingLong: 34, targets: 9, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 15.8, totalYards: 95, totalTd: 0
        } },
    ],

    /* Cooper Clark — USC */
    'cooper-clark': [
      { week:  1, date: '2022-09-03', kickoff: '3:00pm',
        opponent: 'Rice', home: true, conference: false,
        result: { teamScore: 69, opponentScore: 10 }, booster: null,
        stats: {
          carries: 13, rushingYards: 59, rushingTd: 0, rushingLong: 13,
          receptions: 4, receivingYards: 21, receivingYac: 16,
          receivingTd: 0, receivingLong: 13, targets: 4, fumbles: 0,
          rushingAvg: 4.5, receivingAvg: 5.3, totalYards: 80, totalTd: 0
        } },
      { week:  2, date: '2022-09-10', kickoff: '4:30pm',
        opponent: 'Stanford', home: false, conference: true,
        result: { teamScore: 44, opponentScore: 24 }, booster: null,
        stats: {
          carries: 16, rushingYards: 64, rushingTd: 0, rushingLong: 15,
          receptions: 4, receivingYards: 54, receivingYac: 37,
          receivingTd: 1, receivingLong: 26, targets: 5, fumbles: 0,
          rushingAvg: 4, receivingAvg: 13.5, totalYards: 118, totalTd: 1
        },
        bigPlays: [
          '19 yard receiving touchdown'
        ] },
      { week:  3, date: '2022-09-17', kickoff: '7:30pm',
        opponent: 'Fresno State', home: true, conference: false,
        result: { teamScore: 42, opponentScore: 20 }, booster: null,
        stats: {
          carries: 15, rushingYards: 48, rushingTd: 1, rushingLong: 20,
          receptions: 3, receivingYards: 37, receivingYac: 26,
          receivingTd: 0, receivingLong: 37, targets: 3, fumbles: 0,
          rushingAvg: 3.2, receivingAvg: 12.3, totalYards: 85, totalTd: 1
        },
        bigPlays: [
          '20 yard rushing touchdown'
        ] },
      { week:  4, date: '2022-09-24', kickoff: '6:30pm',
        opponent: 'Oregon State', home: false, conference: true, scouts: true,
        result: { teamScore: 19, opponentScore: 13 }, booster: null,
        stats: {
          carries: 14, rushingYards: 64, rushingTd: 0, rushingLong: 15,
          receptions: 1, receivingYards: 8, receivingYac: 6,
          receivingTd: 0, receivingLong: 8, targets: 2, fumbles: 0,
          rushingAvg: 4.6, receivingAvg: 8, totalYards: 72, totalTd: 0
        } },
      { week:  5, date: '2022-10-01', kickoff: '7:30pm',
        opponent: 'Arizona State', home: true, conference: true,
        result: { teamScore: 38, opponentScore: 28 }, booster: null,
        stats: {
          carries: 15, rushingYards: 66, rushingTd: 1, rushingLong: 57,
          receptions: 3, receivingYards: 50, receivingYac: 38,
          receivingTd: 1, receivingLong: 32, targets: 3, fumbles: 0,
          rushingAvg: 4.4, receivingAvg: 16.7, totalYards: 116, totalTd: 2
        },
        bigPlays: [
          '57 yard rushing touchdown',
          '18 yard receiving touchdown'
        ] },
      { week:  6, date: '2022-10-08', kickoff: '4:30pm',
        opponent: 'Washington State', home: true, conference: true,
        result: { teamScore: 35, opponentScore: 9 }, booster: null,
        stats: {
          carries: 16, rushingYards: 46, rushingTd: 0, rushingLong: 9,
          receptions: 2, receivingYards: 15, receivingYac: 14,
          receivingTd: 0, receivingLong: 15, targets: 3, fumbles: 0,
          rushingAvg: 2.9, receivingAvg: 7.5, totalYards: 61, totalTd: 0
        } },
      { week:  7, date: '2022-10-15', kickoff: '5:00pm',
        opponent: 'Utah', home: false, conference: true, scouts: true, overtime: true,
        result: { teamScore: 45, opponentScore: 42 }, booster: null,
        stats: {
          carries: 16, rushingYards: 123, rushingTd: 2, rushingLong: 31,
          receptions: 3, receivingYards: 12, receivingYac: 9,
          receivingTd: 0, receivingLong: 12, targets: 5, fumbles: 0,
          rushingAvg: 7.7, receivingAvg: 4, totalYards: 135, totalTd: 2
        },
        bigPlays: [
          '3 yard rushing touchdown',
          '3 yard rushing touchdown'
        ] },
      { week:  9, date: '2022-10-29', kickoff: '4:00pm',
        opponent: 'Arizona', home: false, conference: true,
        result: { teamScore: 45, opponentScore: 35 }, booster: null,
        stats: {
          carries: 18, rushingYards: 148, rushingTd: 3, rushingLong: 31,
          receptions: 3, receivingYards: 24, receivingYac: 16,
          receivingTd: 0, receivingLong: 24, targets: 4, fumbles: 0,
          rushingAvg: 8.2, receivingAvg: 8, totalYards: 172, totalTd: 3
        },
        bigPlays: [
          '29 yard rushing touchdown',
          '6 yard rushing touchdown',
          '5 yard rushing touchdown'
        ] },
      { week: 10, date: '2022-11-05', kickoff: '7:30pm',
        opponent: 'California', home: true, conference: true,
        result: { teamScore: 41, opponentScore: 35 }, booster: null,
        stats: {
          carries: 14, rushingYards: 64, rushingTd: 1, rushingLong: 29,
          receptions: 3, receivingYards: 38, receivingYac: 29,
          receivingTd: 0, receivingLong: 38, targets: 3, fumbles: 0,
          rushingAvg: 4.6, receivingAvg: 12.7, totalYards: 102, totalTd: 1
        },
        bigPlays: [
          '29 yard rushing touchdown'
        ] },
      { week: 11, date: '2022-11-11', kickoff: '6:30pm',
        opponent: 'Colorado', home: true, conference: true,
        result: { teamScore: 59, opponentScore: 13 }, booster: null,
        stats: {
          carries: 14, rushingYards: 87, rushingTd: 0, rushingLong: 14,
          receptions: 2, receivingYards: 30, receivingYac: 23,
          receivingTd: 0, receivingLong: 30, targets: 3, fumbles: 0,
          rushingAvg: 6.2, receivingAvg: 15, totalYards: 117, totalTd: 0
        } },
      { week: 12, date: '2022-11-19', kickoff: '5:00pm',
        opponent: 'UCLA', home: false, conference: true, scouts: true,
        result: { teamScore: 56, opponentScore: 35 }, booster: null,
        stats: {
          carries: 15, rushingYards: 106, rushingTd: 2, rushingLong: 15,
          receptions: 2, receivingYards: 17, receivingYac: 10,
          receivingTd: 0, receivingLong: 15, targets: 2, fumbles: 1,
          rushingAvg: 7.1, receivingAvg: 8.5, totalYards: 123, totalTd: 2
        },
        bigPlays: [
          '8 yard rushing touchdown',
          '5 yard rushing touchdown'
        ] },
      { week: 13, date: '2022-11-26', kickoff: '4:30pm',
        opponent: 'Notre Dame', home: true, conference: false, scouts: true,
        result: { teamScore: 42, opponentScore: 23 }, booster: null,
        stats: {
          carries: 17, rushingYards: 113, rushingTd: 2, rushingLong: 63,
          receptions: 2, receivingYards: 11, receivingYac: 9,
          receivingTd: 0, receivingLong: 11, targets: 3, fumbles: 0,
          rushingAvg: 6.6, receivingAvg: 5.5, totalYards: 124, totalTd: 2
        },
        bigPlays: [
          '63 yard rushing touchdown',
          '25 yard rushing touchdown'
        ] },
      { week: 15, date: '2022-12-02', kickoff: null,
        name: 'Pac-12 Championship',
        opponent: 'Washington', home: false, conference: false, neutral: true, playoff: true,
        result: { teamScore: 26, opponentScore: 30 }, booster: null,
        stats: {
          carries: 19, rushingYards: 114, rushingTd: 0, rushingLong: 22,
          receptions: 3, receivingYards: 28, receivingYac: 23,
          receivingTd: 0, receivingLong: 27, targets: 4, fumbles: 0,
          rushingAvg: 6, receivingAvg: 9.3, totalYards: 142, totalTd: 0
        } },
      { week: 18, date: '2023-01-02', kickoff: null,
        name: 'Cotton Bowl',
        opponent: 'Tulane', home: false, conference: false, neutral: true, playoff: true,
        result: { teamScore: 45, opponentScore: 35 }, booster: null,
        stats: {
          carries: 11, rushingYards: 57, rushingTd: 0, rushingLong: 10,
          receptions: 2, receivingYards: 10, receivingYac: 7,
          receivingTd: 0, receivingLong: 10, targets: 3, fumbles: 0,
          rushingAvg: 5.2, receivingAvg: 5, totalYards: 67, totalTd: 0
        } },
    ],

    /* Paxon Hatch — North Carolina */
    'paxon-hatch': [
      { week:  0, date: '2022-08-27', kickoff: '8:15pm',
        opponent: 'Florida A&M', home: true, conference: false,
        result: { teamScore: 66, opponentScore: 14 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 110, receivingYac: 61,
          receivingTd: 2, receivingLong: 79, targets: 8, carries: 1,
          rushingYards: 7, rushingTd: 0, rushingLong: 7, fumbles: 0,
          rushingAvg: 7, receivingAvg: 22, totalYards: 117, totalTd: 2
        },
        bigPlays: [
          '24 yard receiving touchdown',
          '5 yard receiving touchdown'
        ] },
      { week:  1, date: '2022-09-03', kickoff: '12:00pm',
        opponent: 'App State', home: false, conference: false,
        result: { teamScore: 61, opponentScore: 63 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 20, receivingYac: 6,
          receivingTd: 0, receivingLong: 11, targets: 5, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 5, totalYards: 20, totalTd: 0
        } },
      { week:  2, date: '2022-09-10', kickoff: '12:00pm',
        opponent: 'Georgia State', home: false, conference: false,
        result: { teamScore: 33, opponentScore: 30 }, booster: null,
        stats: {
          receptions: 2, receivingYards: 35, receivingYac: 14,
          receivingTd: 0, receivingLong: 35, targets: 4, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 17.5, totalYards: 35, totalTd: 0
        } },
      { week:  4, date: '2022-09-24', kickoff: '3:30pm',
        opponent: 'Notre Dame', home: true, conference: false, scouts: true,
        result: { teamScore: 35, opponentScore: 42 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 37, receivingYac: 11,
          receivingTd: 1, receivingLong: 20, targets: 6, carries: 1,
          rushingYards: 3, rushingTd: 0, rushingLong: 3, fumbles: 0,
          rushingAvg: 3, receivingAvg: 7.4, totalYards: 40, totalTd: 1
        },
        bigPlays: [
          '20 yard receiving touchdown'
        ] },
      { week:  5, date: '2022-10-01', kickoff: '3:30pm',
        opponent: 'Virginia Tech', home: true, conference: true,
        result: { teamScore: 45, opponentScore: 6 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 124, receivingYac: 63,
          receivingTd: 3, receivingLong: 73, targets: 6, carries: 1,
          rushingYards: 3, rushingTd: 0, rushingLong: 3, fumbles: 0,
          rushingAvg: 3, receivingAvg: 31, totalYards: 127, totalTd: 3
        },
        bigPlays: [
          '73 yard receiving touchdown',
          '20 yard receiving touchdown',
          '13 yard receiving touchdown'
        ] },
      { week:  6, date: '2022-10-08', kickoff: '4:00pm',
        opponent: 'Miami', home: false, conference: true,
        result: { teamScore: 31, opponentScore: 20 }, booster: null,
        stats: {
          receptions: 7, receivingYards: 48, receivingYac: 24,
          receivingTd: 0, receivingLong: 16, targets: 10, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 6.9, totalYards: 48, totalTd: 0
        } },
      { week:  7, date: '2022-10-15', kickoff: '8:00pm',
        opponent: 'Duke', home: false, conference: true,
        result: { teamScore: 49, opponentScore: 23 }, booster: null,
        stats: {
          receptions: 2, receivingYards: 24, receivingYac: 11,
          receivingTd: 0, receivingLong: 24, targets: 4, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 12, totalYards: 24, totalTd: 0
        } },
      { week:  9, date: '2022-10-29', kickoff: '8:00pm',
        opponent: 'Pittsburgh', home: true, conference: true, scouts: true,
        result: { teamScore: 42, opponentScore: 23 }, booster: null,
        stats: {
          receptions: 5, receivingYards: 176, receivingYac: 72,
          receivingTd: 3, receivingLong: 75, targets: 8, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 35.2, totalYards: 176, totalTd: 3
        },
        bigPlays: [
          '75 yard receiving touchdown',
          '22 yard receiving touchdown',
          '19 yard receiving touchdown'
        ] },
      { week: 10, date: '2022-11-05', kickoff: '12:00pm',
        opponent: 'Virginia', home: false, conference: true,
        result: { teamScore: 30, opponentScore: 28 }, booster: null,
        stats: {
          receptions: 8, receivingYards: 64, receivingYac: 13,
          receivingTd: 1, receivingLong: 64, targets: 13, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 8, totalYards: 64, totalTd: 1
        },
        bigPlays: [
          '64 yard receiving touchdown'
        ] },
      { week: 11, date: '2022-11-12', kickoff: '7:30pm',
        opponent: 'Wake Forest', home: false, conference: true, scouts: true,
        result: { teamScore: 37, opponentScore: 33 }, booster: null,
        stats: {
          receptions: 3, receivingYards: 35, receivingYac: 21,
          receivingTd: 1, receivingLong: 25, targets: 5, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 11.7, totalYards: 35, totalTd: 1
        },
        bigPlays: [
          '4 yard receiving touchdown'
        ] },
      { week: 12, date: '2022-11-19', kickoff: '5:30pm',
        opponent: 'Georgia Tech', home: true, conference: true,
        result: { teamScore: 14, opponentScore: 24 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 45, receivingYac: 29,
          receivingTd: 1, receivingLong: 20, targets: 5, carries: 1,
          rushingYards: 9, rushingTd: 0, rushingLong: 9, fumbles: 0,
          rushingAvg: 9, receivingAvg: 11.3, totalYards: 54, totalTd: 1
        },
        bigPlays: [
          '20 yard receiving touchdown'
        ] },
      { week: 13, date: '2022-11-25', kickoff: '3:30pm',
        opponent: 'NC State', home: true, conference: true, scouts: true,
        result: { teamScore: 30, opponentScore: 27 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 43, receivingYac: 12,
          receivingTd: 0, receivingLong: 26, targets: 8, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 10.8, totalYards: 43, totalTd: 0
        } },
      { week: 15, date: '2022-12-03', kickoff: null,
        name: 'ACC Championship',
        opponent: 'Clemson', home: false, conference: false, neutral: true, playoff: true,
        result: { teamScore: 21, opponentScore: 34 }, booster: null,
        stats: {
          receptions: 4, receivingYards: 64, receivingYac: 31,
          receivingTd: 0, receivingLong: 54, targets: 6, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 0,
          receivingAvg: 16, totalYards: 64, totalTd: 0
        } },
      { week: 18, date: '2022-12-28', kickoff: null,
        name: 'Holiday Bowl',
        opponent: 'Oregon', home: false, conference: false, neutral: true, playoff: true,
        result: { teamScore: 30, opponentScore: 38 }, booster: null,
        stats: {
          receptions: 7, receivingYards: 103, receivingYac: 23,
          receivingTd: 1, receivingLong: 45, targets: 9, carries: 0,
          rushingYards: 0, rushingTd: 0, rushingLong: 0, fumbles: 1,
          receivingAvg: 14.7, totalYards: 103, totalTd: 1
        },
        bigPlays: [
          '8 yard receiving touchdown'
        ] },
    ],

    /* Isaac Vitel — Texas */
    'isaac-vitel': [
      { week:  1, date: '2022-09-03', kickoff: '7:00pm',
        opponent: 'UL Monroe', home: true, conference: false,
        result: { teamScore: 52, opponentScore: 9 }, booster: null,
        stats: {
          completions: 12, attempts: 22, passingYards: 152,
          passingYac: 61, passingTd: 1, interceptions: 0, carries: 5,
          rushingYards: 13, rushingTd: 0, rushingLong: 5, sacks: 1,
          fumbles: 0, passingAvg: 12.7, rating: 91.5, rushingAvg: 2.6
        },
        bigPlays: [
          '35 yard passing touchdown'
        ] },
      { week:  2, date: '2022-09-10', kickoff: '11:00am',
        opponent: 'Alabama', home: true, conference: false, scouts: true,
        result: { teamScore: 13, opponentScore: 27 }, booster: null,
        stats: {
          completions: 25, attempts: 36, passingYards: 269,
          passingYac: 115, passingTd: 2, interceptions: 3, carries: 3,
          rushingYards: 5, rushingTd: 0, rushingLong: 5, sacks: 3,
          fumbles: 0, passingAvg: 10.8, rating: 74.9, rushingAvg: 1.7
        },
        bigPlays: [
          '63 yard passing touchdown',
          '22 yard passing touchdown'
        ] },
      { week:  3, date: '2022-09-17', kickoff: '7:00pm',
        opponent: 'UTSA', home: true, conference: false,
        result: { teamScore: 47, opponentScore: 14 }, booster: null,
        stats: {
          completions: 13, attempts: 22, passingYards: 202,
          passingYac: 77, passingTd: 1, interceptions: 0, carries: 3,
          rushingYards: 8, rushingTd: 0, rushingLong: 8, sacks: 1,
          fumbles: 0, passingAvg: 15.5, rating: 104.7, rushingAvg: 2.7
        },
        bigPlays: [
          '9 yard passing touchdown'
        ] },
      { week:  4, date: '2022-09-24', kickoff: '2:30pm',
        opponent: 'Texas Tech', home: false, conference: true,
        result: { teamScore: 31, opponentScore: 40 }, booster: null,
        stats: {
          completions: 22, attempts: 37, passingYards: 345,
          passingYac: 92, passingTd: 1, interceptions: 2, carries: 4,
          rushingYards: 4, rushingTd: 0, rushingLong: 2, sacks: 3,
          fumbles: 0, passingAvg: 15.7, rating: 77, rushingAvg: 1
        },
        bigPlays: [
          '74 yard passing touchdown'
        ] },
      { week:  5, date: '2022-10-01', kickoff: '6:30pm',
        opponent: 'West Virginia', home: true, conference: true,
        result: { teamScore: 34, opponentScore: 24 }, booster: null,
        stats: {
          completions: 14, attempts: 34, passingYards: 263,
          passingYac: 121, passingTd: 4, interceptions: 1, carries: 4,
          rushingYards: 13, rushingTd: 0, rushingLong: 5, sacks: 1,
          fumbles: 0, passingAvg: 18.8, rating: 95.6, rushingAvg: 3.3
        },
        bigPlays: [
          '60 yard passing touchdown',
          '57 yard passing touchdown',
          '9 yard passing touchdown',
          '6 yard passing touchdown'
        ] },
      { week:  6, date: '2022-10-08', kickoff: '11:00am',
        opponent: 'Oklahoma', home: false, conference: true, neutral: true,
        result: { teamScore: 54, opponentScore: 0 }, booster: null,
        stats: {
          completions: 16, attempts: 30, passingYards: 177,
          passingYac: 68, passingTd: 1, interceptions: 2, carries: 4,
          rushingYards: 7, rushingTd: 1, rushingLong: 6, sacks: 1,
          fumbles: 0, passingAvg: 11.1, rating: 54.4, rushingAvg: 1.8
        },
        bigPlays: [
          '18 yard passing touchdown',
          '6 yard rushing touchdown'
        ] },
      { week:  7, date: '2022-10-15', kickoff: '11:00am',
        opponent: 'Iowa State', home: true, conference: true,
        result: { teamScore: 26, opponentScore: 19 }, booster: null,
        stats: {
          completions: 20, attempts: 34, passingYards: 241,
          passingYac: 87, passingTd: 3, interceptions: 2, carries: 3,
          rushingYards: 6, rushingTd: 0, rushingLong: 6, sacks: 3,
          fumbles: 0, passingAvg: 12.1, rating: 85.5, rushingAvg: 2
        },
        bigPlays: [
          '27 yard passing touchdown',
          '25 yard passing touchdown',
          '12 yard passing touchdown'
        ] },
      { week:  8, date: '2022-10-22', kickoff: '2:30pm',
        opponent: 'Oklahoma State', home: false, conference: true,
        result: { teamScore: 38, opponentScore: 35 }, booster: null,
        stats: {
          completions: 20, attempts: 35, passingYards: 329,
          passingYac: 133, passingTd: 5, interceptions: 1, carries: 5,
          rushingYards: 12, rushingTd: 0, rushingLong: 6, sacks: 1,
          fumbles: 0, passingAvg: 16.5, rating: 116.5, rushingAvg: 2.4
        },
        bigPlays: [
          '34 yard passing touchdown',
          '19 yard passing touchdown',
          '9 yard passing touchdown',
          '7 yard passing touchdown',
          '4 yard passing touchdown'
        ] },
      { week: 10, date: '2022-11-05', kickoff: '6:00pm',
        opponent: 'Kansas State', home: false, conference: true, scouts: true,
        result: { teamScore: 41, opponentScore: 20 }, booster: null,
        stats: {
          completions: 18, attempts: 29, passingYards: 209,
          passingYac: 71, passingTd: 3, interceptions: 1, carries: 3,
          rushingYards: 3, rushingTd: 0, rushingLong: 3, sacks: 1,
          fumbles: 0, passingAvg: 11.6, rating: 104, rushingAvg: 1
        },
        bigPlays: [
          '9 yard passing touchdown',
          '8 yard passing touchdown',
          '3 yard passing touchdown'
        ] },
      { week: 11, date: '2022-11-12', kickoff: '6:30pm',
        opponent: 'TCU', home: true, conference: true, scouts: true,
        result: { teamScore: 14, opponentScore: 13 }, booster: null,
        stats: {
          completions: 19, attempts: 36, passingYards: 370,
          passingYac: 121, passingTd: 0, interceptions: 0, carries: 3,
          rushingYards: 4, rushingTd: 0, rushingLong: 2, sacks: 3,
          fumbles: 0, passingAvg: 19.5, rating: 88.9, rushingAvg: 1.3
        } },
      { week: 12, date: '2022-11-19', kickoff: '2:30pm',
        opponent: 'Kansas', home: false, conference: true,
        result: { teamScore: 51, opponentScore: 17 }, booster: null,
        stats: {
          completions: 12, attempts: 24, passingYards: 162,
          passingYac: 59, passingTd: 1, interceptions: 0, carries: 3,
          rushingYards: 5, rushingTd: 0, rushingLong: 4, sacks: 1,
          fumbles: 0, passingAvg: 13.5, rating: 85.8, rushingAvg: 1.7
        },
        bigPlays: [
          '79 yard passing touchdown'
        ] },
      { week: 13, date: '2022-11-25', kickoff: '11:00am',
        opponent: 'Baylor', home: true, conference: true, scouts: true,
        result: { teamScore: 44, opponentScore: 21 }, booster: null,
        stats: {
          completions: 21, attempts: 32, passingYards: 310,
          passingYac: 104, passingTd: 5, interceptions: 1, carries: 3,
          rushingYards: 6, rushingTd: 0, rushingLong: 6, sacks: 2,
          fumbles: 0, passingAvg: 14.8, rating: 123.7, rushingAvg: 2
        },
        bigPlays: [
          '58 yard passing touchdown',
          '53 yard passing touchdown',
          '26 yard passing touchdown',
          '7 yard passing touchdown',
          '2 yard passing touchdown'
        ] },
      { week: 15, date: '2022-12-03', kickoff: null,
        name: 'Big 12 Championship',
        opponent: 'TCU', home: false, conference: false, neutral: true, playoff: true,
        result: { teamScore: 31, opponentScore: 30 }, booster: null,
        stats: {
          completions: 20, attempts: 32, passingYards: 392,
          passingYac: 133, passingTd: 4, interceptions: 1, carries: 4,
          rushingYards: 10, rushingTd: 0, rushingLong: 10, sacks: 4,
          fumbles: 0, passingAvg: 19.6, rating: 131.8, rushingAvg: 2.5
        },
        bigPlays: [
          '59 yard passing touchdown',
          '19 yard passing touchdown',
          '12 yard passing touchdown',
          '3 yard passing touchdown'
        ] },
      { week: 18, date: '2022-12-31', kickoff: null,
        name: 'Sugar Bowl',
        opponent: 'Tennessee', home: false, conference: false, neutral: true, playoff: true,
        result: { teamScore: 51, opponentScore: 21 }, booster: null,
        stats: {
          completions: 17, attempts: 30, passingYards: 356,
          passingYac: 132, passingTd: 5, interceptions: 3, carries: 3,
          rushingYards: 11, rushingTd: 1, rushingLong: 8, sacks: 1,
          fumbles: 0, passingAvg: 20.9, rating: 98.7, rushingAvg: 3.7
        },
        bigPlays: [
          '54 yard passing touchdown',
          '51 yard passing touchdown',
          '40 yard passing touchdown',
          '9 yard passing touchdown',
          '3 yard passing touchdown',
          '8 yard rushing touchdown'
        ] },
    ],

    /* Sam Stogsdill — Ohio State */
    'sam-stogsdill': [
      { week:  1, date: '2022-09-03', kickoff: '7:30pm',
        opponent: 'Notre Dame', home: true, conference: false, scouts: true,
        result: { teamScore: 34, opponentScore: 0 }, booster: null,
        stats: {
          carries: 16, rushingYards: 166, rushingTd: 0, rushingLong: 33,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 1, fumbles: 0,
          rushingAvg: 10.4, totalYards: 166, totalTd: 0
        } },
      { week:  2, date: '2022-09-10', kickoff: '12:00pm',
        opponent: 'Arkansas State', home: true, conference: false,
        result: { teamScore: 45, opponentScore: 13 }, booster: null,
        stats: {
          carries: 14, rushingYards: 54, rushingTd: 0, rushingLong: 8,
          receptions: 1, receivingYards: 10, receivingYac: 9,
          receivingTd: 0, receivingLong: 10, targets: 1, fumbles: 0,
          rushingAvg: 3.9, receivingAvg: 10, totalYards: 64, totalTd: 0
        } },
      { week:  3, date: '2022-09-17', kickoff: '7:00pm',
        opponent: 'Toledo', home: true, conference: false,
        result: { teamScore: 84, opponentScore: 14 }, booster: null,
        stats: {
          carries: 18, rushingYards: 132, rushingTd: 2, rushingLong: 15,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 1, fumbles: 0,
          rushingAvg: 7.3, totalYards: 132, totalTd: 2
        },
        bigPlays: [
          '8 yard rushing touchdown',
          '3 yard rushing touchdown'
        ] },
      { week:  4, date: '2022-09-24', kickoff: '7:30pm',
        opponent: 'Wisconsin', home: true, conference: true, scouts: true,
        result: { teamScore: 49, opponentScore: 23 }, booster: null,
        stats: {
          carries: 16, rushingYards: 57, rushingTd: 0, rushingLong: 13,
          receptions: 1, receivingYards: 8, receivingYac: 6,
          receivingTd: 0, receivingLong: 8, targets: 1, fumbles: 0,
          rushingAvg: 3.6, receivingAvg: 8, totalYards: 65, totalTd: 0
        } },
      { week:  5, date: '2022-10-01', kickoff: '3:30pm',
        opponent: 'Rutgers', home: true, conference: true,
        result: { teamScore: 55, opponentScore: 3 }, booster: null,
        stats: {
          carries: 16, rushingYards: 146, rushingTd: 2, rushingLong: 76,
          receptions: 1, receivingYards: 11, receivingYac: 8,
          receivingTd: 1, receivingLong: 11, targets: 1, fumbles: 0,
          rushingAvg: 9.1, receivingAvg: 11, totalYards: 157, totalTd: 3
        },
        bigPlays: [
          '76 yard rushing touchdown',
          '1 yard rushing touchdown',
          '11 yard receiving touchdown'
        ] },
      { week:  6, date: '2022-10-08', kickoff: '4:00pm',
        opponent: 'Michigan State', home: false, conference: true,
        result: { teamScore: 61, opponentScore: 7 }, booster: null,
        stats: {
          carries: 18, rushingYards: 161, rushingTd: 3, rushingLong: 17,
          receptions: 1, receivingYards: 7, receivingYac: 5,
          receivingTd: 0, receivingLong: 7, targets: 1, fumbles: 0,
          rushingAvg: 8.9, receivingAvg: 7, totalYards: 168, totalTd: 3
        },
        bigPlays: [
          '8 yard rushing touchdown',
          '6 yard rushing touchdown',
          '4 yard rushing touchdown'
        ] },
      { week:  8, date: '2022-10-22', kickoff: '12:00pm',
        opponent: 'Iowa', home: true, conference: true,
        result: { teamScore: 59, opponentScore: 6 }, booster: null,
        stats: {
          carries: 18, rushingYards: 90, rushingTd: 1, rushingLong: 17,
          receptions: 1, receivingYards: 12, receivingYac: 10,
          receivingTd: 0, receivingLong: 12, targets: 1, fumbles: 0,
          rushingAvg: 5, receivingAvg: 12, totalYards: 102, totalTd: 1
        },
        bigPlays: [
          '17 yard rushing touchdown'
        ] },
      { week:  9, date: '2022-10-29', kickoff: '12:00pm',
        opponent: 'Penn State', home: false, conference: true, scouts: true,
        result: { teamScore: 44, opponentScore: 31 }, booster: null,
        stats: {
          carries: 24, rushingYards: 151, rushingTd: 3, rushingLong: 17,
          receptions: 1, receivingYards: 11, receivingYac: 6,
          receivingTd: 0, receivingLong: 11, targets: 1, fumbles: 0,
          rushingAvg: 6.3, receivingAvg: 11, totalYards: 162, totalTd: 3
        },
        bigPlays: [
          '8 yard rushing touchdown',
          '5 yard rushing touchdown',
          '1 yard rushing touchdown'
        ] },
      { week: 10, date: '2022-11-05', kickoff: '12:00pm',
        opponent: 'Northwestern', home: false, conference: true,
        result: { teamScore: 38, opponentScore: 0 }, booster: null,
        stats: {
          carries: 23, rushingYards: 138, rushingTd: 3, rushingLong: 22,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 0, fumbles: 0,
          rushingAvg: 6, totalYards: 138, totalTd: 3
        },
        bigPlays: [
          '9 yard rushing touchdown',
          '4 yard rushing touchdown',
          '1 yard rushing touchdown'
        ] },
      { week: 11, date: '2022-11-12', kickoff: '12:00pm',
        opponent: 'Indiana', home: true, conference: true,
        result: { teamScore: 58, opponentScore: 13 }, booster: null,
        stats: {
          carries: 17, rushingYards: 290, rushingTd: 3, rushingLong: 66,
          receptions: 1, receivingYards: 8, receivingYac: 5,
          receivingTd: 0, receivingLong: 8, targets: 1, fumbles: 1,
          rushingAvg: 17.1, receivingAvg: 8, totalYards: 298, totalTd: 3
        },
        bigPlays: [
          '66 yard rushing touchdown',
          '8 yard rushing touchdown',
          '7 yard rushing touchdown'
        ] },
      { week: 12, date: '2022-11-19', kickoff: '3:30pm',
        opponent: 'Maryland', home: false, conference: true,
        result: { teamScore: 49, opponentScore: 24 }, booster: null,
        stats: {
          carries: 22, rushingYards: 106, rushingTd: 3, rushingLong: 68,
          receptions: 1, receivingYards: 10, receivingYac: 7,
          receivingTd: 0, receivingLong: 10, targets: 1, fumbles: 0,
          rushingAvg: 4.8, receivingAvg: 10, totalYards: 116, totalTd: 3
        },
        bigPlays: [
          '68 yard rushing touchdown',
          '6 yard rushing touchdown',
          '5 yard rushing touchdown'
        ] },
      { week: 13, date: '2022-11-26', kickoff: '12:00pm',
        opponent: 'Michigan', home: true, conference: true, scouts: true,
        result: { teamScore: 31, opponentScore: 35 }, booster: null,
        stats: {
          carries: 27, rushingYards: 91, rushingTd: 0, rushingLong: 9,
          receptions: 1, receivingYards: 7, receivingYac: 5,
          receivingTd: 0, receivingLong: 7, targets: 1, fumbles: 0,
          rushingAvg: 3.4, receivingAvg: 7, totalYards: 98, totalTd: 0
        } },
      { week: 18, date: '2022-12-31', kickoff: null,
        name: 'Fiesta Bowl — CFP Semifinal',
        opponent: 'Michigan', home: false, conference: false, neutral: true, playoff: true,
        result: { teamScore: 21, opponentScore: 35 }, booster: null,
        stats: {
          carries: 21, rushingYards: 142, rushingTd: 1, rushingLong: 17,
          receptions: 0, receivingYards: 0, receivingYac: 0,
          receivingTd: 0, receivingLong: 0, targets: 1, fumbles: 0,
          rushingAvg: 6.8, totalYards: 142, totalTd: 1
        },
        bigPlays: [
          '1 yard rushing touchdown'
        ] },
    ],

    /* Jaykeb Stewart — Ohio State */
    'jaykeb-stewart': [
      { week:  1, date: '2022-09-03', kickoff: '7:30pm',
        opponent: 'Notre Dame', home: true, conference: false, scouts: true,
        result: { teamScore: 34, opponentScore: 0 }, booster: null,
        stats: {
          completions: 25, attempts: 36, passingYards: 263,
          passingYac: 113, passingTd: 5, interceptions: 0, carries: 4,
          rushingYards: 29, rushingTd: 0, rushingLong: 16, sacks: 1,
          fumbles: 0, passingAvg: 10.5, rating: 130, rushingAvg: 7.3
        },
        bigPlays: [
          '29 yard passing touchdown',
          '19 yard passing touchdown',
          '17 yard passing touchdown',
          '14 yard passing touchdown',
          '12 yard passing touchdown'
        ] },
      { week:  2, date: '2022-09-10', kickoff: '12:00pm',
        opponent: 'Arkansas State', home: true, conference: false,
        result: { teamScore: 45, opponentScore: 13 }, booster: null,
        stats: {
          completions: 15, attempts: 22, passingYards: 199,
          passingYac: 69, passingTd: 1, interceptions: 1, carries: 3,
          rushingYards: 13, rushingTd: 1, rushingLong: 8, sacks: 1,
          fumbles: 0, passingAvg: 13.3, rating: 92.8, rushingAvg: 4.3
        },
        bigPlays: [
          '5 yard passing touchdown',
          '1 yard rushing touchdown'
        ] },
      { week:  3, date: '2022-09-17', kickoff: '7:00pm',
        opponent: 'Toledo', home: true, conference: false,
        result: { teamScore: 84, opponentScore: 14 }, booster: null,
        stats: {
          completions: 26, attempts: 34, passingYards: 269,
          passingYac: 142, passingTd: 5, interceptions: 1, carries: 5,
          rushingYards: 39, rushingTd: 2, rushingLong: 28, sacks: 2,
          fumbles: 0, passingAvg: 10.3, rating: 126.1, rushingAvg: 7.8
        },
        bigPlays: [
          '61 yard passing touchdown',
          '24 yard passing touchdown',
          '23 yard passing touchdown',
          '18 yard passing touchdown',
          '8 yard passing touchdown',
          '7 yard rushing touchdown',
          '3 yard rushing touchdown'
        ] },
      { week:  4, date: '2022-09-24', kickoff: '7:30pm',
        opponent: 'Wisconsin', home: true, conference: true,
        result: { teamScore: 49, opponentScore: 23 }, booster: null,
        stats: {
          completions: 32, attempts: 43, passingYards: 386,
          passingYac: 169, passingTd: 3, interceptions: 0, carries: 7,
          rushingYards: 37, rushingTd: 1, rushingLong: 27, sacks: 1,
          fumbles: 0, passingAvg: 12.1, rating: 124.8, rushingAvg: 5.3
        },
        bigPlays: [
          '26 yard passing touchdown',
          '19 yard passing touchdown',
          '6 yard passing touchdown',
          '27 yard rushing touchdown'
        ] },
      { week:  5, date: '2022-10-01', kickoff: '3:30pm',
        opponent: 'Rutgers', home: true, conference: true,
        result: { teamScore: 55, opponentScore: 3 }, booster: null,
        stats: {
          completions: 21, attempts: 32, passingYards: 325,
          passingYac: 149, passingTd: 4, interceptions: 0, carries: 9,
          rushingYards: 48, rushingTd: 1, rushingLong: 47, sacks: 2,
          fumbles: 0, passingAvg: 15.5, rating: 138.7, rushingAvg: 5.3
        },
        bigPlays: [
          '31 yard passing touchdown',
          '23 yard passing touchdown',
          '18 yard passing touchdown',
          '11 yard passing touchdown',
          '47 yard rushing touchdown'
        ] },
      { week:  6, date: '2022-10-08', kickoff: '4:00pm',
        opponent: 'Michigan State', home: false, conference: true,
        result: { teamScore: 61, opponentScore: 7 }, booster: null,
        stats: {
          completions: 24, attempts: 31, passingYards: 332,
          passingYac: 170, passingTd: 5, interceptions: 1, carries: 6,
          rushingYards: 30, rushingTd: 0, rushingLong: 15, sacks: 2,
          fumbles: 0, passingAvg: 13.8, rating: 137.4, rushingAvg: 5
        },
        bigPlays: [
          '68 yard passing touchdown',
          '28 yard passing touchdown',
          '26 yard passing touchdown',
          '24 yard passing touchdown',
          '14 yard passing touchdown'
        ] },
      { week:  8, date: '2022-10-22', kickoff: '12:00pm',
        opponent: 'Iowa', home: true, conference: true, scouts: true,
        result: { teamScore: 59, opponentScore: 6 }, booster: null,
        stats: {
          completions: 15, attempts: 20, passingYards: 150,
          passingYac: 70, passingTd: 2, interceptions: 0, carries: 3,
          rushingYards: 14, rushingTd: 1, rushingLong: 8, sacks: 1,
          fumbles: 0, passingAvg: 10, rating: 129.2, rushingAvg: 4.7
        },
        bigPlays: [
          '9 yard passing touchdown',
          '7 yard passing touchdown',
          '6 yard rushing touchdown'
        ] },
      { week:  9, date: '2022-10-29', kickoff: '12:00pm',
        opponent: 'Penn State', home: false, conference: true, scouts: true, injured: true, injury: 'Hamstring Strain', health: 64,
        result: { teamScore: 44, opponentScore: 31 }, booster: null,
        stats: {
          completions: 0, attempts: 0, passingYards: 0, passingYac: 0,
          passingTd: 0, interceptions: 0, carries: 0, rushingYards: 0,
          rushingTd: 0, rushingLong: 0, sacks: 0, fumbles: 0
        } },
      { week: 10, date: '2022-11-05', kickoff: '12:00pm',
        opponent: 'Northwestern', home: false, conference: true,
        result: { teamScore: 38, opponentScore: 0 }, booster: null,
        stats: {
          completions: 19, attempts: 25, passingYards: 171,
          passingYac: 85, passingTd: 0, interceptions: 0, carries: 6,
          rushingYards: 46, rushingTd: 0, rushingLong: 16, sacks: 1,
          fumbles: 0, passingAvg: 9, rating: 93.9, rushingAvg: 7.7
        } },
      { week: 11, date: '2022-11-12', kickoff: '12:00pm',
        opponent: 'Indiana', home: true, conference: true,
        result: { teamScore: 58, opponentScore: 13 }, booster: null,
        stats: {
          completions: 23, attempts: 33, passingYards: 387,
          passingYac: 171, passingTd: 5, interceptions: 1, carries: 5,
          rushingYards: 68, rushingTd: 0, rushingLong: 34, sacks: 1,
          fumbles: 0, passingAvg: 16.8, rating: 136, rushingAvg: 13.6
        },
        bigPlays: [
          '48 yard passing touchdown',
          '36 yard passing touchdown',
          '27 yard passing touchdown',
          '25 yard passing touchdown',
          '4 yard passing touchdown'
        ] },
      { week: 12, date: '2022-11-19', kickoff: '3:30pm',
        opponent: 'Maryland', home: false, conference: true,
        result: { teamScore: 49, opponentScore: 24 }, booster: null,
        stats: {
          completions: 22, attempts: 32, passingYards: 246,
          passingYac: 93, passingTd: 2, interceptions: 1, carries: 6,
          rushingYards: 21, rushingTd: 0, rushingLong: 14, sacks: 1,
          fumbles: 0, passingAvg: 11.2, rating: 99.2, rushingAvg: 3.5
        },
        bigPlays: [
          '52 yard passing touchdown',
          '45 yard passing touchdown'
        ] },
      { week: 13, date: '2022-11-26', kickoff: '12:00pm',
        opponent: 'Michigan', home: true, conference: true, scouts: true,
        result: { teamScore: 31, opponentScore: 35 }, booster: null,
        stats: {
          completions: 36, attempts: 53, passingYards: 494,
          passingYac: 237, passingTd: 4, interceptions: 0, carries: 5,
          rushingYards: 18, rushingTd: 0, rushingLong: 13, sacks: 1,
          fumbles: 0, passingAvg: 13.7, rating: 122.7, rushingAvg: 3.6
        },
        bigPlays: [
          '80 yard passing touchdown',
          '20 yard passing touchdown',
          '19 yard passing touchdown',
          '14 yard passing touchdown'
        ] },
      { week: 18, date: '2022-12-31', kickoff: null,
        name: 'Fiesta Bowl — CFP Semifinal',
        opponent: 'Michigan', home: false, conference: false, neutral: true, playoff: true,
        result: { teamScore: 21, opponentScore: 35 }, booster: null,
        stats: {
          completions: 30, attempts: 48, passingYards: 321,
          passingYac: 137, passingTd: 2, interceptions: 0, carries: 6,
          rushingYards: 26, rushingTd: 0, rushingLong: 13, sacks: 4,
          fumbles: 0, passingAvg: 10.7, rating: 95.9, rushingAvg: 4.3
        },
        bigPlays: [
          '38 yard passing touchdown',
          '10 yard passing touchdown'
        ] },
    ],
  }
};
