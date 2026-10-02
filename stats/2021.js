/* ==========================================================================
   EGE Football — the 2021 season
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

EGE.stats[2021] = {
  season: 2021,
  level: 'College football',

  games: {

    /* Andrew Parr — Alabama */
    'andrew-parr': [
      { week:  1, date: '2021-09-04', kickoff: '2:30pm',
        opponent: 'Miami', home: false, conference: false, neutral: true,
        result: null, booster: null, stats: null },
      { week:  2, date: '2021-09-11', kickoff: '3:00pm',
        opponent: 'Mercer', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  3, date: '2021-09-18', kickoff: '2:30pm',
        opponent: 'Florida', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week:  4, date: '2021-09-25', kickoff: '6:30pm',
        opponent: 'Southern Miss', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  5, date: '2021-10-02', kickoff: '2:30pm',
        opponent: 'Ole Miss', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week:  6, date: '2021-10-09', kickoff: '7:00pm',
        opponent: 'Texas A&M', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week:  7, date: '2021-10-16', kickoff: '6:00pm',
        opponent: 'Mississippi State', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week:  8, date: '2021-10-23', kickoff: '6:00pm',
        opponent: 'Tennessee', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week: 10, date: '2021-11-06', kickoff: '6:00pm',
        opponent: 'LSU', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week: 11, date: '2021-11-13', kickoff: '11:00am',
        opponent: 'New Mexico State', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week: 12, date: '2021-11-20', kickoff: '2:30pm',
        opponent: 'Arkansas', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week: 13, date: '2021-11-27', kickoff: '2:30pm',
        opponent: 'Auburn', home: false, conference: true,
        result: null, booster: null, stats: null },
    ],

    /* Cooper Clark — USC */
    'cooper-clark': [
      { week:  1, date: '2021-09-04', kickoff: '2:00pm',
        opponent: 'San José State', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  2, date: '2021-09-11', kickoff: '7:30pm',
        opponent: 'Stanford', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week:  3, date: '2021-09-18', kickoff: '12:30pm',
        opponent: 'Washington State', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week:  4, date: '2021-09-25', kickoff: '7:30pm',
        opponent: 'Oregon State', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week:  5, date: '2021-10-02', kickoff: '11:00am',
        opponent: 'Colorado', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week:  6, date: '2021-10-09', kickoff: '5:00pm',
        opponent: 'Utah', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week:  8, date: '2021-10-23', kickoff: '4:30pm',
        opponent: 'Notre Dame', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week:  9, date: '2021-10-30', kickoff: '4:00pm',
        opponent: 'Arizona', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week: 10, date: '2021-11-06', kickoff: '7:30pm',
        opponent: 'Arizona State', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week: 12, date: '2021-11-20', kickoff: '1:00pm',
        opponent: 'UCLA', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week: 13, date: '2021-11-27', kickoff: '7:30pm',
        opponent: 'BYU', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week: 14, date: '2021-12-04', kickoff: '8:00pm',
        opponent: 'California', home: false, conference: true,
        result: null, booster: null, stats: null },
    ],

    /* Paxon Hatch — North Dakota State */
    'paxon-hatch': [
      { week:  1, date: '2021-09-04', kickoff: '2:30pm',
        opponent: 'Albany', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  2, date: '2021-09-11', kickoff: '2:30pm',
        opponent: 'Valparaiso', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  3, date: '2021-09-18', kickoff: '5:00pm',
        opponent: 'Towson', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week:  5, date: '2021-10-02', kickoff: '2:00pm',
        opponent: 'North Dakota', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week:  6, date: '2021-10-09', kickoff: '1:00pm',
        opponent: 'Northern Iowa', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week:  7, date: '2021-10-16', kickoff: '2:00pm',
        opponent: 'Illinois State', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week:  8, date: '2021-10-23', kickoff: '2:30pm',
        opponent: 'Missouri State', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week:  9, date: '2021-10-30', kickoff: '2:30pm',
        opponent: 'Indiana State', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week: 10, date: '2021-11-06', kickoff: '2:00pm',
        opponent: 'South Dakota State', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week: 11, date: '2021-11-13', kickoff: '11:00am',
        opponent: 'Youngstown State', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week: 12, date: '2021-11-20', kickoff: '2:30pm',
        opponent: 'South Dakota', home: true, conference: true,
        result: null, booster: null, stats: null },
    ],

    /* Isaac Vitel — Illinois */
    'isaac-vitel': [
      { week:  0, date: '2021-08-28', kickoff: '12:20pm',
        opponent: 'Nebraska', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week:  1, date: '2021-09-04', kickoff: '6:30pm',
        opponent: 'UTSA', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  2, date: '2021-09-11', kickoff: '10:00am',
        opponent: 'Virginia', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week:  3, date: '2021-09-17', kickoff: '8:00pm',
        opponent: 'Maryland', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week:  4, date: '2021-09-25', kickoff: '2:30pm',
        opponent: 'Purdue', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week:  5, date: '2021-10-02', kickoff: '11:00am',
        opponent: 'Charlotte', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  6, date: '2021-10-09', kickoff: '2:30pm',
        opponent: 'Wisconsin', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week:  8, date: '2021-10-23', kickoff: '11:00am',
        opponent: 'Penn State', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week:  9, date: '2021-10-30', kickoff: '11:00am',
        opponent: 'Rutgers', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week: 10, date: '2021-11-06', kickoff: '11:00am',
        opponent: 'Minnesota', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week: 12, date: '2021-11-20', kickoff: '1:00pm',
        opponent: 'Iowa', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week: 13, date: '2021-11-27', kickoff: '2:30pm',
        opponent: 'Northwestern', home: true, conference: true,
        result: null, booster: null, stats: null },
    ],

    /* Sam Stogsdill — Ohio State */
    'sam-stogsdill': [
      { week:  1, date: '2021-09-02', kickoff: '8:00pm',
        opponent: 'Minnesota', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week:  2, date: '2021-09-11', kickoff: '12:00pm',
        opponent: 'Oregon', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  3, date: '2021-09-18', kickoff: '3:30pm',
        opponent: 'Tulsa', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  4, date: '2021-09-25', kickoff: '7:30pm',
        opponent: 'Akron', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  5, date: '2021-10-02', kickoff: '3:30pm',
        opponent: 'Rutgers', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week:  6, date: '2021-10-09', kickoff: '12:00pm',
        opponent: 'Maryland', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week:  8, date: '2021-10-23', kickoff: '7:30pm',
        opponent: 'Indiana', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week:  9, date: '2021-10-30', kickoff: '7:30pm',
        opponent: 'Penn State', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week: 10, date: '2021-11-06', kickoff: '12:00pm',
        opponent: 'Nebraska', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week: 11, date: '2021-11-13', kickoff: '3:30pm',
        opponent: 'Purdue', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week: 12, date: '2021-11-20', kickoff: '12:00pm',
        opponent: 'Michigan State', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week: 13, date: '2021-11-27', kickoff: '12:00pm',
        opponent: 'Michigan', home: false, conference: true,
        result: null, booster: null, stats: null },
    ],

    /* Jaykeb Stewart — Ohio State */
    'jaykeb-stewart': [
      { week:  1, date: '2021-09-02', kickoff: '8:00pm',
        opponent: 'Minnesota', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week:  2, date: '2021-09-11', kickoff: '12:00pm',
        opponent: 'Oregon', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  3, date: '2021-09-18', kickoff: '3:30pm',
        opponent: 'Tulsa', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  4, date: '2021-09-25', kickoff: '7:30pm',
        opponent: 'Akron', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  5, date: '2021-10-02', kickoff: '3:30pm',
        opponent: 'Rutgers', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week:  6, date: '2021-10-09', kickoff: '12:00pm',
        opponent: 'Maryland', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week:  8, date: '2021-10-23', kickoff: '7:30pm',
        opponent: 'Indiana', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week:  9, date: '2021-10-30', kickoff: '7:30pm',
        opponent: 'Penn State', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week: 10, date: '2021-11-06', kickoff: '12:00pm',
        opponent: 'Nebraska', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week: 11, date: '2021-11-13', kickoff: '3:30pm',
        opponent: 'Purdue', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week: 12, date: '2021-11-20', kickoff: '12:00pm',
        opponent: 'Michigan State', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week: 13, date: '2021-11-27', kickoff: '12:00pm',
        opponent: 'Michigan', home: false, conference: true,
        result: null, booster: null, stats: null },
    ],
  }
};
