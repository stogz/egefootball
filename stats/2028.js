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
        result: null, booster: null, stats: null },
      { week:  2, date: '2028-09-17', kickoff: null,
        opponent: 'Philadelphia Eagles', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week:  3, date: '2028-09-24', kickoff: null,
        opponent: 'Houston Texans', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week:  4, date: '2028-10-01', kickoff: null,
        opponent: 'Atlanta Falcons', home: false, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week:  5, date: '2028-10-08', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week:  6, date: '2028-10-15', kickoff: null,
        opponent: 'Jacksonville Jaguars', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  7, date: '2028-10-22', kickoff: null,
        opponent: 'New Orleans Saints', home: true, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week:  8, date: '2028-10-29', kickoff: null,
        opponent: 'New Orleans Saints', home: false, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week:  9, date: '2028-11-05', kickoff: null,
        opponent: 'San Francisco 49ers', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week: 10, date: '2028-11-12', kickoff: null,
        opponent: 'Seattle Seahawks', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week: 11, date: '2028-11-19', kickoff: null,
        opponent: 'Indianapolis Colts', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week: 12, date: '2028-11-26', kickoff: null,
        opponent: 'Miami Dolphins', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week: 13, date: '2028-12-03', kickoff: null,
        opponent: 'Atlanta Falcons', home: true, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week: 14, date: '2028-12-10', kickoff: null,
        opponent: 'Tennessee Titans', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week: 15, date: '2028-12-17', kickoff: null,
        opponent: 'Arizona Cardinals', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week: 16, date: '2028-12-24', kickoff: null,
        opponent: 'Tampa Bay Buccaneers', home: true, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week: 17, date: '2028-12-31', kickoff: null,
        opponent: 'Los Angeles Rams', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week: 18, date: '2029-01-07', kickoff: null,
        opponent: 'Chicago Bears', home: true, conference: false,
        result: null, booster: null, stats: null },
    ],

    /* Cooper Clark — Jacksonville Jaguars */
    'cooper-clark': [
      { week:  1, date: '2028-09-10', kickoff: null,
        opponent: 'Houston Texans', home: false, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week:  2, date: '2028-09-17', kickoff: null,
        opponent: 'Tennessee Titans', home: true, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week:  3, date: '2028-09-24', kickoff: null,
        opponent: 'New York Jets', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week:  4, date: '2028-10-01', kickoff: null,
        opponent: 'Indianapolis Colts', home: false, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week:  5, date: '2028-10-08', kickoff: null,
        opponent: 'Houston Texans', home: true, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week:  6, date: '2028-10-15', kickoff: null,
        opponent: 'Carolina Panthers', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week:  7, date: '2028-10-22', kickoff: null,
        opponent: 'Cleveland Browns', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  8, date: '2028-10-29', kickoff: null,
        opponent: 'Atlanta Falcons', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week:  9, date: '2028-11-05', kickoff: null,
        opponent: 'Tampa Bay Buccaneers', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week: 10, date: '2028-11-12', kickoff: null,
        opponent: 'Denver Broncos', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week: 11, date: '2028-11-19', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week: 12, date: '2028-11-26', kickoff: null,
        opponent: 'Indianapolis Colts', home: true, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week: 13, date: '2028-12-03', kickoff: null,
        opponent: 'Tennessee Titans', home: false, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week: 14, date: '2028-12-10', kickoff: null,
        opponent: 'Washington Commanders', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week: 15, date: '2028-12-17', kickoff: null,
        opponent: 'Los Angeles Chargers', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week: 16, date: '2028-12-24', kickoff: null,
        opponent: 'New Orleans Saints', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week: 17, date: '2028-12-31', kickoff: null,
        opponent: 'Las Vegas Raiders', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week: 18, date: '2029-01-07', kickoff: null,
        opponent: 'Kansas City Chiefs', home: false, conference: false,
        result: null, booster: null, stats: null },
    ],

    /* Paxon Hatch — New York Giants */
    'paxon-hatch': [
      { week:  1, date: '2028-09-10', kickoff: null,
        opponent: 'New England Patriots', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  2, date: '2028-09-17', kickoff: null,
        opponent: 'Washington Commanders', home: true, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week:  3, date: '2028-09-24', kickoff: null,
        opponent: 'Miami Dolphins', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week:  4, date: '2028-10-01', kickoff: null,
        opponent: 'Houston Texans', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  5, date: '2028-10-08', kickoff: null,
        opponent: 'Buffalo Bills', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  6, date: '2028-10-15', kickoff: null,
        opponent: 'Green Bay Packers', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week:  7, date: '2028-10-22', kickoff: null,
        opponent: 'Philadelphia Eagles', home: false, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week:  8, date: '2028-10-29', kickoff: null,
        opponent: 'Tampa Bay Buccaneers', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week:  9, date: '2028-11-05', kickoff: null,
        opponent: 'Detroit Lions', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week: 10, date: '2028-11-12', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week: 11, date: '2028-11-19', kickoff: null,
        opponent: 'San Francisco 49ers', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week: 12, date: '2028-11-26', kickoff: null,
        opponent: 'Washington Commanders', home: false, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week: 13, date: '2028-12-03', kickoff: null,
        opponent: 'Philadelphia Eagles', home: true, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week: 14, date: '2028-12-10', kickoff: null,
        opponent: 'Minnesota Vikings', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week: 15, date: '2028-12-17', kickoff: null,
        opponent: 'Chicago Bears', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week: 16, date: '2028-12-24', kickoff: null,
        opponent: 'New York Jets', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week: 17, date: '2028-12-31', kickoff: null,
        opponent: 'Dallas Cowboys', home: true, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week: 18, date: '2029-01-07', kickoff: null,
        opponent: 'Dallas Cowboys', home: false, conference: false, division: true,
        result: null, booster: null, stats: null },
    ],

    /* Isaac Vitel — Tampa Bay Buccaneers */
    'isaac-vitel': [
      { week:  1, date: '2028-09-10', kickoff: null,
        opponent: 'Carolina Panthers', home: true, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week:  2, date: '2028-09-17', kickoff: null,
        opponent: 'New England Patriots', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  3, date: '2028-09-24', kickoff: null,
        opponent: 'New Orleans Saints', home: false, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week:  4, date: '2028-10-01', kickoff: null,
        opponent: 'Arizona Cardinals', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week:  5, date: '2028-10-08', kickoff: null,
        opponent: 'Atlanta Falcons', home: true, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week:  6, date: '2028-10-15', kickoff: null,
        opponent: 'Houston Texans', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  7, date: '2028-10-22', kickoff: null,
        opponent: 'Indianapolis Colts', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week:  8, date: '2028-10-29', kickoff: null,
        opponent: 'New York Giants', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  9, date: '2028-11-05', kickoff: null,
        opponent: 'Jacksonville Jaguars', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week: 10, date: '2028-11-12', kickoff: null,
        opponent: 'San Francisco 49ers', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week: 11, date: '2028-11-19', kickoff: null,
        opponent: 'Atlanta Falcons', home: false, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week: 12, date: '2028-11-26', kickoff: null,
        opponent: 'Tennessee Titans', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week: 13, date: '2028-12-03', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week: 14, date: '2028-12-10', kickoff: null,
        opponent: 'Green Bay Packers', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week: 15, date: '2028-12-17', kickoff: null,
        opponent: 'Seattle Seahawks', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week: 16, date: '2028-12-24', kickoff: null,
        opponent: 'Carolina Panthers', home: false, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week: 17, date: '2028-12-31', kickoff: null,
        opponent: 'New Orleans Saints', home: true, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week: 18, date: '2029-01-07', kickoff: null,
        opponent: 'Los Angeles Rams', home: true, conference: false,
        result: null, booster: null, stats: null },
    ],

    /* Sam Stogsdill — Pittsburgh Steelers */
    'sam-stogsdill': [
      { week:  1, date: '2028-09-10', kickoff: null,
        opponent: 'Chicago Bears', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  2, date: '2028-09-17', kickoff: null,
        opponent: 'Minnesota Vikings', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week:  3, date: '2028-09-24', kickoff: null,
        opponent: 'Baltimore Ravens', home: true, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week:  4, date: '2028-10-01', kickoff: null,
        opponent: 'San Francisco 49ers', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week:  5, date: '2028-10-08', kickoff: null,
        opponent: 'Baltimore Ravens', home: false, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week:  6, date: '2028-10-15', kickoff: null,
        opponent: 'Buffalo Bills', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  7, date: '2028-10-22', kickoff: null,
        opponent: 'Miami Dolphins', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week:  8, date: '2028-10-29', kickoff: null,
        opponent: 'Cincinnati Bengals', home: false, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week:  9, date: '2028-11-05', kickoff: null,
        opponent: 'Houston Texans', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week: 10, date: '2028-11-12', kickoff: null,
        opponent: 'New York Jets', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week: 11, date: '2028-11-19', kickoff: null,
        opponent: 'Green Bay Packers', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week: 12, date: '2028-11-26', kickoff: null,
        opponent: 'Las Vegas Raiders', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week: 13, date: '2028-12-03', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week: 14, date: '2028-12-10', kickoff: null,
        opponent: 'Cleveland Browns', home: false, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week: 15, date: '2028-12-17', kickoff: null,
        opponent: 'Cincinnati Bengals', home: true, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week: 16, date: '2028-12-24', kickoff: null,
        opponent: 'New England Patriots', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week: 17, date: '2028-12-31', kickoff: null,
        opponent: 'Cleveland Browns', home: true, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week: 18, date: '2029-01-07', kickoff: null,
        opponent: 'Detroit Lions', home: true, conference: false,
        result: null, booster: null, stats: null },
    ],

    /* Jaykeb Stewart — Houston Texans */
    'jaykeb-stewart': [
      { week:  1, date: '2028-09-10', kickoff: null,
        opponent: 'Jacksonville Jaguars', home: true, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week:  2, date: '2028-09-17', kickoff: null,
        opponent: 'Las Vegas Raiders', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week:  3, date: '2028-09-24', kickoff: null,
        opponent: 'Carolina Panthers', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  4, date: '2028-10-01', kickoff: null,
        opponent: 'New York Giants', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week:  5, date: '2028-10-08', kickoff: null,
        opponent: 'Jacksonville Jaguars', home: false, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week:  6, date: '2028-10-15', kickoff: null,
        opponent: 'Tampa Bay Buccaneers', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week:  7, date: '2028-10-22', kickoff: null,
        opponent: 'Tennessee Titans', home: true, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week:  8, date: '2028-10-29', kickoff: null,
        opponent: null, home: false, conference: false, bye: true,
        result: null, booster: null, stats: null },
      { week:  9, date: '2028-11-05', kickoff: null,
        opponent: 'Pittsburgh Steelers', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week: 10, date: '2028-11-12', kickoff: null,
        opponent: 'New England Patriots', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week: 11, date: '2028-11-19', kickoff: null,
        opponent: 'New Orleans Saints', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week: 12, date: '2028-11-26', kickoff: null,
        opponent: 'Los Angeles Chargers', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week: 13, date: '2028-12-03', kickoff: null,
        opponent: 'Indianapolis Colts', home: false, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week: 14, date: '2028-12-10', kickoff: null,
        opponent: 'Atlanta Falcons', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week: 15, date: '2028-12-17', kickoff: null,
        opponent: 'Indianapolis Colts', home: true, conference: false, division: true,
        result: null, booster: null, stats: null },
      { week: 16, date: '2028-12-24', kickoff: null,
        opponent: 'Kansas City Chiefs', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week: 17, date: '2028-12-31', kickoff: null,
        opponent: 'Denver Broncos', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week: 18, date: '2029-01-07', kickoff: null,
        opponent: 'Tennessee Titans', home: false, conference: false, division: true,
        result: null, booster: null, stats: null },
    ],
  }
};
