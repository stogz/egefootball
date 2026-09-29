/* ==========================================================================
   EGE Football — the 2020 season
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

   `neutral: true` marks a game at a neutral site — listed as vs, and home
   is false because it is nobody's. A kickoff of null is one that has not
   been set yet; it shows as a dash until it is.
   ========================================================================== */

window.EGE = window.EGE || {};
EGE.stats = EGE.stats || {};

EGE.stats[2020] = {
  season: 2020,
  level: 'College football',

  games: {

    /* Andrew Parr — Alabama */
    'andrew-parr': [
      { week:  1, date: '2020-09-05', kickoff: null,
        opponent: 'USC', home: false, conference: false, neutral: true,
        result: null, booster: null, stats: null },
      { week:  2, date: '2020-09-12', kickoff: null,
        opponent: 'Georgia State', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  3, date: '2020-09-19', kickoff: null,
        opponent: 'Georgia', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week:  4, date: '2020-09-26', kickoff: null,
        opponent: 'Kent State', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  5, date: '2020-10-03', kickoff: null,
        opponent: 'Ole Miss', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week:  6, date: '2020-10-10', kickoff: null,
        opponent: 'Arkansas', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week:  7, date: '2020-10-17', kickoff: null,
        opponent: 'Mississippi State', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week:  8, date: '2020-10-24', kickoff: null,
        opponent: 'Tennessee', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week: 10, date: '2020-11-07', kickoff: null,
        opponent: 'LSU', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week: 11, date: '2020-11-14', kickoff: null,
        opponent: 'UT Martin', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week: 12, date: '2020-11-21', kickoff: null,
        opponent: 'Texas A&M', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week: 13, date: '2020-11-28', kickoff: null,
        opponent: 'Auburn', home: true, conference: true,
        result: null, booster: null, stats: null },
    ],

    /* Cooper Clark — USC */
    'cooper-clark': [
      { week:  1, date: '2020-09-05', kickoff: null,
        opponent: 'Alabama', home: false, conference: false, neutral: true,
        result: null, booster: null, stats: null },
      { week:  2, date: '2020-09-12', kickoff: null,
        opponent: 'New Mexico', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  3, date: '2020-09-19', kickoff: null,
        opponent: 'Stanford', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week:  4, date: '2020-09-26', kickoff: null,
        opponent: 'Arizona State', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week:  5, date: '2020-10-02', kickoff: null,
        opponent: 'Utah', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week:  6, date: '2020-10-10', kickoff: null,
        opponent: 'California', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week:  7, date: '2020-10-17', kickoff: null,
        opponent: 'Arizona', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week:  9, date: '2020-10-31', kickoff: null,
        opponent: 'Colorado', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week: 10, date: '2020-11-07', kickoff: null,
        opponent: 'Oregon', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week: 11, date: '2020-11-14', kickoff: null,
        opponent: 'Washington', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week: 12, date: '2020-11-21', kickoff: null,
        opponent: 'UCLA', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week: 13, date: '2020-11-28', kickoff: null,
        opponent: 'Notre Dame', home: true, conference: false,
        result: null, booster: null, stats: null },
    ],

    /* Paxon Hatch — North Dakota State */
    'paxon-hatch': [
      { week:  1, date: '2020-09-05', kickoff: null,
        opponent: 'Oregon', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week:  2, date: '2020-09-12', kickoff: null,
        opponent: 'Drake', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  3, date: '2020-09-19', kickoff: null,
        opponent: 'North Carolina A&T', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  4, date: '2020-09-26', kickoff: null,
        opponent: 'Northern Iowa', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week:  5, date: '2020-10-03', kickoff: null,
        opponent: 'Illinois State', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week:  6, date: '2020-10-10', kickoff: null,
        opponent: 'Indiana State', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week:  7, date: '2020-10-17', kickoff: null,
        opponent: 'South Dakota State', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week:  8, date: '2020-10-24', kickoff: null,
        opponent: 'Youngstown State', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week:  9, date: '2020-10-31', kickoff: null,
        opponent: 'Missouri State', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week: 11, date: '2020-11-14', kickoff: null,
        opponent: 'North Dakota', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week: 12, date: '2020-11-21', kickoff: null,
        opponent: 'South Dakota', home: false, conference: true,
        result: null, booster: null, stats: null },
    ],

    /* Isaac Vitel — Illinois */
    'isaac-vitel': [
      { week:  1, date: '2020-09-04', kickoff: null,
        opponent: 'Illinois State', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  2, date: '2020-09-12', kickoff: null,
        opponent: 'UConn', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  3, date: '2020-09-19', kickoff: null,
        opponent: 'Bowling Green', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  5, date: '2020-10-03', kickoff: null,
        opponent: 'Rutgers', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week:  6, date: '2020-10-10', kickoff: null,
        opponent: 'Nebraska', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week:  7, date: '2020-10-17', kickoff: null,
        opponent: 'Purdue', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week:  8, date: '2020-10-24', kickoff: null,
        opponent: 'Minnesota', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week:  9, date: '2020-10-31', kickoff: null,
        opponent: 'Wisconsin', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week: 10, date: '2020-11-07', kickoff: null,
        opponent: 'Iowa', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week: 11, date: '2020-11-14', kickoff: null,
        opponent: 'Indiana', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week: 12, date: '2020-11-21', kickoff: null,
        opponent: 'Ohio State', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week: 13, date: '2020-11-28', kickoff: null,
        opponent: 'Northwestern', home: false, conference: true,
        result: null, booster: null, stats: null },
    ],

    /* Sam Stogsdill — Ohio State */
    'sam-stogsdill': [
      { week:  1, date: '2020-09-05', kickoff: null,
        opponent: 'Bowling Green', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  2, date: '2020-09-12', kickoff: null,
        opponent: 'Oregon', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week:  3, date: '2020-09-19', kickoff: null,
        opponent: 'Buffalo', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  4, date: '2020-09-26', kickoff: null,
        opponent: 'Rutgers', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week:  6, date: '2020-10-10', kickoff: null,
        opponent: 'Iowa', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week:  7, date: '2020-10-17', kickoff: null,
        opponent: 'Michigan State', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week:  8, date: '2020-10-24', kickoff: null,
        opponent: 'Penn State', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week:  9, date: '2020-10-31', kickoff: null,
        opponent: 'Nebraska', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week: 10, date: '2020-11-07', kickoff: null,
        opponent: 'Indiana', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week: 11, date: '2020-11-14', kickoff: null,
        opponent: 'Maryland', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week: 12, date: '2020-11-21', kickoff: null,
        opponent: 'Illinois', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week: 13, date: '2020-11-28', kickoff: null,
        opponent: 'Michigan', home: true, conference: true,
        result: null, booster: null, stats: null },
    ],

    /* Jaykeb Stewart — Ohio State */
    'jaykeb-stewart': [
      { week:  1, date: '2020-09-05', kickoff: null,
        opponent: 'Bowling Green', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  2, date: '2020-09-12', kickoff: null,
        opponent: 'Oregon', home: false, conference: false,
        result: null, booster: null, stats: null },
      { week:  3, date: '2020-09-19', kickoff: null,
        opponent: 'Buffalo', home: true, conference: false,
        result: null, booster: null, stats: null },
      { week:  4, date: '2020-09-26', kickoff: null,
        opponent: 'Rutgers', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week:  6, date: '2020-10-10', kickoff: null,
        opponent: 'Iowa', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week:  7, date: '2020-10-17', kickoff: null,
        opponent: 'Michigan State', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week:  8, date: '2020-10-24', kickoff: null,
        opponent: 'Penn State', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week:  9, date: '2020-10-31', kickoff: null,
        opponent: 'Nebraska', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week: 10, date: '2020-11-07', kickoff: null,
        opponent: 'Indiana', home: true, conference: true,
        result: null, booster: null, stats: null },
      { week: 11, date: '2020-11-14', kickoff: null,
        opponent: 'Maryland', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week: 12, date: '2020-11-21', kickoff: null,
        opponent: 'Illinois', home: false, conference: true,
        result: null, booster: null, stats: null },
      { week: 13, date: '2020-11-28', kickoff: null,
        opponent: 'Michigan', home: true, conference: true,
        result: null, booster: null, stats: null },
    ],
  }
};
