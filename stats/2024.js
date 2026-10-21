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
        result: null, booster: null, stats: null },
      { week:  5, date: '2024-10-06', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week:  6, date: '2024-10-13', kickoff: '4:25pm',
        opponent: 'Dallas Cowboys', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week:  7, date: '2024-10-20', kickoff: '1:00pm',
        opponent: 'Minnesota Vikings', home: false, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week:  8, date: '2024-10-27', kickoff: '1:00pm',
        opponent: 'Tennessee Titans', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  9, date: '2024-11-03', kickoff: '4:25pm',
        opponent: 'Green Bay Packers', home: false, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week: 10, date: '2024-11-10', kickoff: '8:20pm',
        opponent: 'Houston Texans', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week: 11, date: '2024-11-17', kickoff: '1:00pm',
        opponent: 'Jacksonville Jaguars', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week: 12, date: '2024-11-24', kickoff: '1:00pm',
        opponent: 'Indianapolis Colts', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week: 13, date: '2024-11-28', kickoff: '12:30pm',
        opponent: 'Chicago Bears', home: true, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week: 14, date: '2024-12-05', kickoff: '8:15pm',
        opponent: 'Green Bay Packers', home: true, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week: 15, date: '2024-12-15', kickoff: '4:25pm',
        opponent: 'Buffalo Bills', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week: 16, date: '2024-12-22', kickoff: '1:00pm',
        opponent: 'Chicago Bears', home: false, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week: 17, date: '2024-12-30', kickoff: '8:15pm',
        opponent: 'San Francisco 49ers', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week: 18, date: '2025-01-05', kickoff: '8:20pm',
        opponent: 'Minnesota Vikings', home: true, conference: false, division: true,
        result: null, booster: null, stats: null },
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
        opponent: 'Los Angeles Rams', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  5, date: '2024-10-06', kickoff: '12:00pm',
        opponent: 'Carolina Panthers', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  6, date: '2024-10-13', kickoff: '8:30am',
        opponent: 'Jacksonville Jaguars', home: false, conference: false, neutral: true,
        result: null, booster: null, stats: null },
      { week:  7, date: '2024-10-20', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week:  8, date: '2024-10-27', kickoff: '3:25pm',
        opponent: 'Washington Commanders', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week:  9, date: '2024-11-03', kickoff: '3:05pm',
        opponent: 'Arizona Cardinals', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week: 10, date: '2024-11-10', kickoff: '12:00pm',
        opponent: 'New England Patriots', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week: 11, date: '2024-11-17', kickoff: '12:00pm',
        opponent: 'Green Bay Packers', home: true, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week: 12, date: '2024-11-24', kickoff: '12:00pm',
        opponent: 'Minnesota Vikings', home: true, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week: 13, date: '2024-11-28', kickoff: '11:30am',
        opponent: 'Detroit Lions', home: false, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week: 14, date: '2024-12-08', kickoff: '3:25pm',
        opponent: 'San Francisco 49ers', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week: 15, date: '2024-12-16', kickoff: '7:00pm',
        opponent: 'Minnesota Vikings', home: false, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week: 16, date: '2024-12-22', kickoff: '12:00pm',
        opponent: 'Detroit Lions', home: true, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week: 17, date: '2024-12-26', kickoff: '7:15pm',
        opponent: 'Seattle Seahawks', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week: 18, date: '2025-01-05', kickoff: '12:00pm',
        opponent: 'Green Bay Packers', home: false, conference: false, division: true,
        result: null, booster: null, stats: null },
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
        result: null, booster: null, stats: null },
      { week:  5, date: '2024-10-06', kickoff: '4:25pm',
        opponent: 'Seattle Seahawks', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week:  6, date: '2024-10-13', kickoff: '8:20pm',
        opponent: 'Cincinnati Bengals', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  7, date: '2024-10-20', kickoff: '1:00pm',
        opponent: 'Philadelphia Eagles', home: true, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week:  8, date: '2024-10-28', kickoff: '8:15pm',
        opponent: 'Pittsburgh Steelers', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week:  9, date: '2024-11-03', kickoff: '1:00pm',
        opponent: 'Washington Commanders', home: true, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week: 10, date: '2024-11-10', kickoff: '9:30am',
        opponent: 'Carolina Panthers', home: false, conference: false, neutral: true,
        result: null, booster: null, stats: null },
      { week: 11, date: '2024-11-17', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week: 12, date: '2024-11-24', kickoff: '1:00pm',
        opponent: 'Tampa Bay Buccaneers', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week: 13, date: '2024-11-28', kickoff: '4:30pm',
        opponent: 'Dallas Cowboys', home: false, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week: 14, date: '2024-12-08', kickoff: '1:00pm',
        opponent: 'New Orleans Saints', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week: 15, date: '2024-12-15', kickoff: '1:00pm',
        opponent: 'Baltimore Ravens', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week: 16, date: '2024-12-22', kickoff: '1:00pm',
        opponent: 'Atlanta Falcons', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week: 17, date: '2024-12-29', kickoff: '1:00pm',
        opponent: 'Indianapolis Colts', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week: 18, date: '2025-01-05', kickoff: '1:00pm',
        opponent: 'Philadelphia Eagles', home: false, conference: false, division: true,
        result: null, booster: null, stats: null },
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
        result: null, booster: null, stats: null },
      { week:  5, date: '2024-10-03', kickoff: '8:15pm',
        opponent: 'Atlanta Falcons', home: false, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week:  6, date: '2024-10-13', kickoff: '1:00pm',
        opponent: 'New Orleans Saints', home: false, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week:  7, date: '2024-10-21', kickoff: '8:15pm',
        opponent: 'Baltimore Ravens', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  8, date: '2024-10-27', kickoff: '1:00pm',
        opponent: 'Atlanta Falcons', home: true, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week:  9, date: '2024-11-04', kickoff: '8:15pm',
        opponent: 'Kansas City Chiefs', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week: 10, date: '2024-11-10', kickoff: '1:00pm',
        opponent: 'San Francisco 49ers', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week: 11, date: '2024-11-17', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week: 12, date: '2024-11-24', kickoff: '1:00pm',
        opponent: 'New York Giants', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week: 13, date: '2024-12-01', kickoff: '4:05pm',
        opponent: 'Carolina Panthers', home: false, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week: 14, date: '2024-12-08', kickoff: '1:00pm',
        opponent: 'Las Vegas Raiders', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week: 15, date: '2024-12-15', kickoff: '4:25pm',
        opponent: 'Los Angeles Chargers', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week: 16, date: '2024-12-22', kickoff: '8:20pm',
        opponent: 'Dallas Cowboys', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week: 17, date: '2024-12-29', kickoff: '1:00pm',
        opponent: 'Carolina Panthers', home: true, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week: 18, date: '2025-01-05', kickoff: '1:00pm',
        opponent: 'New Orleans Saints', home: true, conference: false, division: true,
        result: null, booster: null, stats: null },
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
        result: null, booster: null, stats: null },
      { week:  5, date: '2024-10-06', kickoff: '1:25pm',
        opponent: 'New York Giants', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  6, date: '2024-10-10', kickoff: '5:15pm',
        opponent: 'San Francisco 49ers', home: true, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week:  7, date: '2024-10-20', kickoff: '10:00am',
        opponent: 'Atlanta Falcons', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week:  8, date: '2024-10-27', kickoff: '1:05pm',
        opponent: 'Buffalo Bills', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  9, date: '2024-11-03', kickoff: '1:25pm',
        opponent: 'Los Angeles Rams', home: true, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week: 10, date: '2024-11-10', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week: 11, date: '2024-11-17', kickoff: '1:05pm',
        opponent: 'San Francisco 49ers', home: false, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week: 12, date: '2024-11-24', kickoff: '1:25pm',
        opponent: 'Arizona Cardinals', home: true, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week: 13, date: '2024-12-01', kickoff: '10:00am',
        opponent: 'New York Jets', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week: 14, date: '2024-12-08', kickoff: '1:05pm',
        opponent: 'Arizona Cardinals', home: false, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week: 15, date: '2024-12-15', kickoff: '5:20pm',
        opponent: 'Green Bay Packers', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week: 16, date: '2024-12-22', kickoff: '1:05pm',
        opponent: 'Minnesota Vikings', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week: 17, date: '2024-12-26', kickoff: '5:15pm',
        opponent: 'Chicago Bears', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week: 18, date: '2025-01-05', kickoff: '1:25pm',
        opponent: 'Los Angeles Rams', home: false, conference: false, division: true,
        result: null, booster: null, stats: null },
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
        result: null, booster: null, stats: null },
      { week:  5, date: '2024-10-06', kickoff: '12:00pm',
        opponent: 'Buffalo Bills', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  6, date: '2024-10-13', kickoff: '12:00pm',
        opponent: 'New England Patriots', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week:  7, date: '2024-10-20', kickoff: '12:00pm',
        opponent: 'Green Bay Packers', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week:  8, date: '2024-10-27', kickoff: '12:00pm',
        opponent: 'Indianapolis Colts', home: true, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week:  9, date: '2024-10-31', kickoff: '7:15pm',
        opponent: 'New York Jets', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week: 10, date: '2024-11-10', kickoff: '7:20pm',
        opponent: 'Detroit Lions', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week: 11, date: '2024-11-18', kickoff: '7:15pm',
        opponent: 'Dallas Cowboys', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week: 12, date: '2024-11-24', kickoff: '12:00pm',
        opponent: 'Tennessee Titans', home: true, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week: 13, date: '2024-12-01', kickoff: '12:00pm',
        opponent: 'Jacksonville Jaguars', home: false, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week: 14, date: '2024-12-08', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week: 15, date: '2024-12-15', kickoff: '12:00pm',
        opponent: 'Miami Dolphins', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week: 16, date: '2024-12-21', kickoff: '12:00pm',
        opponent: 'Kansas City Chiefs', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week: 17, date: '2024-12-25', kickoff: '3:30pm',
        opponent: 'Baltimore Ravens', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week: 18, date: '2025-01-05', kickoff: '12:00pm',
        opponent: 'Tennessee Titans', home: false, conference: false, division: true,
        result: null, booster: null, stats: null },
    ],
  }
};
