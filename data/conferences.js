/* ==========================================================================
   EGE Football — the conference races
   Written by tools/build-conferences.js; change that and run it again
   rather than editing this by hand.

   Every conference game of the season that none of the six is in, played
   out, so the page can say where a school stands in its division as the
   weeks go by. The six's own conference games are not here: those are
   read from stats/{year}.js as they are published, so the standings move
   with whatever the season file says.

   2020's schedules are drawn in each league's real shape, since the real
   2020 was cut short; 2021's are the real ones, as played. Either way the
   scores are played out here, from how strong each school really was.

   A game here counts once its week is published, the same as everything
   else on the site. `score` is [home, away].
   ========================================================================== */

window.EGE = window.EGE || {};
EGE.conferences = EGE.conferences || {};

EGE.conferences[2020] = {
  bigTen: {
    name: 'Big Ten',
    divisions: {
      'Big Ten East': ['Ohio State', 'Indiana', 'Penn State', 'Maryland', 'Michigan', 'Rutgers', 'Michigan State'],
      'Big Ten West': ['Northwestern', 'Iowa', 'Wisconsin', 'Minnesota', 'Nebraska', 'Purdue', 'Illinois']
    },
    /* seed 1900 */
    games: [
      { week:  4, home: 'Michigan', away: 'Northwestern', score: [15, 24] },
      { week:  4, home: 'Michigan State', away: 'Indiana', score: [7, 31] },
      { week:  4, home: 'Nebraska', away: 'Wisconsin', score: [19, 25] },
      { week:  4, home: 'Penn State', away: 'Minnesota', score: [19, 8] },
      { week:  4, home: 'Purdue', away: 'Maryland', score: [20, 16] },
      { week:  5, home: 'Iowa', away: 'Northwestern', score: [8, 18] },
      { week:  5, home: 'Maryland', away: 'Michigan State', score: [24, 20] },
      { week:  5, home: 'Minnesota', away: 'Nebraska', score: [28, 16] },
      { week:  5, home: 'Penn State', away: 'Michigan', score: [42, 23] },
      { week:  5, home: 'Wisconsin', away: 'Purdue', score: [53, 29] },
      { week:  6, home: 'Indiana', away: 'Wisconsin', score: [29, 23] },
      { week:  6, home: 'Maryland', away: 'Penn State', score: [35, 34] },
      { week:  6, home: 'Michigan', away: 'Rutgers', score: [17, 11] },
      { week:  6, home: 'Northwestern', away: 'Michigan State', score: [12, 9] },
      { week:  6, home: 'Purdue', away: 'Minnesota', score: [39, 24] },
      { week:  7, home: 'Iowa', away: 'Wisconsin', score: [18, 30] },
      { week:  7, home: 'Maryland', away: 'Minnesota', score: [30, 32] },
      { week:  7, home: 'Michigan', away: 'Indiana', score: [14, 31] },
      { week:  7, home: 'Nebraska', away: 'Northwestern', score: [31, 19] },
      { week:  7, home: 'Rutgers', away: 'Penn State', score: [20, 23] },
      { week:  8, home: 'Michigan State', away: 'Nebraska', score: [24, 10] },
      { week:  8, home: 'Northwestern', away: 'Wisconsin', score: [31, 14] },
      { week:  8, home: 'Purdue', away: 'Iowa', score: [28, 19] },
      { week:  8, home: 'Rutgers', away: 'Indiana', score: [32, 23] },
      { week:  9, home: 'Indiana', away: 'Maryland', score: [32, 13] },
      { week:  9, home: 'Minnesota', away: 'Michigan', score: [29, 19] },
      { week:  9, home: 'Purdue', away: 'Northwestern', score: [9, 31] },
      { week:  9, home: 'Rutgers', away: 'Iowa', score: [7, 27] },
      { week: 10, home: 'Maryland', away: 'Michigan', score: [37, 21] },
      { week: 10, home: 'Penn State', away: 'Northwestern', score: [3, 32] },
      { week: 10, home: 'Purdue', away: 'Rutgers', score: [21, 35] },
      { week: 10, home: 'Wisconsin', away: 'Michigan State', score: [28, 16] },
      { week: 11, home: 'Iowa', away: 'Minnesota', score: [28, 10] },
      { week: 11, home: 'Michigan', away: 'Michigan State', score: [40, 32] },
      { week: 11, home: 'Nebraska', away: 'Purdue', score: [33, 27] },
      { week: 11, home: 'Wisconsin', away: 'Penn State', score: [17, 23] },
      { week: 12, home: 'Indiana', away: 'Penn State', score: [39, 35] },
      { week: 12, home: 'Iowa', away: 'Michigan', score: [46, 29] },
      { week: 12, home: 'Michigan State', away: 'Rutgers', score: [30, 33] },
      { week: 12, home: 'Minnesota', away: 'Northwestern', score: [8, 19] },
      { week: 12, home: 'Nebraska', away: 'Maryland', score: [27, 12] },
      { week: 13, home: 'Indiana', away: 'Purdue', score: [40, 22] },
      { week: 13, home: 'Iowa', away: 'Nebraska', score: [35, 0] },
      { week: 13, home: 'Minnesota', away: 'Wisconsin', score: [18, 9] },
      { week: 13, home: 'Penn State', away: 'Michigan State', score: [42, 12] },
      { week: 13, home: 'Rutgers', away: 'Maryland', score: [22, 28] }
    ]
  },

  sec: {
    name: 'SEC',
    divisions: {
      'SEC East': ['Florida', 'Georgia', 'Missouri', 'Kentucky', 'Tennessee', 'South Carolina', 'Vanderbilt'],
      'SEC West': ['Alabama', 'Texas A&M', 'Auburn', 'LSU', 'Ole Miss', 'Mississippi State', 'Arkansas']
    },
    /* seed 3944 */
    games: [
      { week:  3, home: 'Kentucky', away: 'Florida', score: [27, 49] },
      { week:  3, home: 'Missouri', away: 'Tennessee', score: [31, 21] },
      { week:  3, home: 'Ole Miss', away: 'LSU', score: [38, 39] },
      { week:  3, home: 'Texas A&M', away: 'Arkansas', score: [42, 34] },
      { week:  3, home: 'Vanderbilt', away: 'South Carolina', score: [30, 22] },
      { week:  4, home: 'Florida', away: 'Missouri', score: [42, 8] },
      { week:  4, home: 'Georgia', away: 'Tennessee', score: [34, 24] },
      { week:  4, home: 'LSU', away: 'Arkansas', score: [48, 14] },
      { week:  4, home: 'Ole Miss', away: 'Kentucky', score: [29, 46] },
      { week:  4, home: 'Texas A&M', away: 'Auburn', score: [28, 19] },
      { week:  5, home: 'Arkansas', away: 'Vanderbilt', score: [32, 12] },
      { week:  5, home: 'LSU', away: 'Missouri', score: [50, 47] },
      { week:  5, home: 'Mississippi State', away: 'Texas A&M', score: [22, 34] },
      { week:  5, home: 'South Carolina', away: 'Auburn', score: [26, 30] },
      { week:  5, home: 'Tennessee', away: 'Florida', score: [33, 29] },
      { week:  6, home: 'Auburn', away: 'Mississippi State', score: [18, 13] },
      { week:  6, home: 'Missouri', away: 'South Carolina', score: [33, 13] },
      { week:  6, home: 'Tennessee', away: 'Texas A&M', score: [18, 26] },
      { week:  6, home: 'Vanderbilt', away: 'Kentucky', score: [29, 49] },
      { week:  7, home: 'Florida', away: 'Vanderbilt', score: [42, 12] },
      { week:  7, home: 'Missouri', away: 'Georgia', score: [42, 28] },
      { week:  8, home: 'Auburn', away: 'Arkansas', score: [34, 45] },
      { week:  8, home: 'Georgia', away: 'South Carolina', score: [29, 18] },
      { week:  8, home: 'Mississippi State', away: 'LSU', score: [25, 26] },
      { week:  8, home: 'Ole Miss', away: 'Vanderbilt', score: [50, 25] },
      { week:  9, home: 'Auburn', away: 'Ole Miss', score: [47, 20] },
      { week:  9, home: 'Georgia', away: 'Florida', score: [44, 35] },
      { week:  9, home: 'Kentucky', away: 'Mississippi State', score: [11, 24] },
      { week:  9, home: 'South Carolina', away: 'Texas A&M', score: [21, 24] },
      { week:  9, home: 'Vanderbilt', away: 'Missouri', score: [18, 35] },
      { week: 10, home: 'Mississippi State', away: 'Arkansas', score: [51, 30] },
      { week: 10, home: 'Missouri', away: 'Kentucky', score: [48, 22] },
      { week: 10, home: 'South Carolina', away: 'Tennessee', score: [40, 25] },
      { week: 11, home: 'Auburn', away: 'LSU', score: [29, 13] },
      { week: 11, home: 'Florida', away: 'Mississippi State', score: [51, 28] },
      { week: 11, home: 'Kentucky', away: 'Tennessee', score: [24, 18] },
      { week: 11, home: 'Texas A&M', away: 'Ole Miss', score: [43, 38] },
      { week: 11, home: 'Vanderbilt', away: 'Georgia', score: [24, 31] },
      { week: 12, home: 'Arkansas', away: 'Ole Miss', score: [34, 36] },
      { week: 12, home: 'Auburn', away: 'Georgia', score: [21, 19] },
      { week: 12, home: 'Florida', away: 'LSU', score: [44, 32] },
      { week: 12, home: 'Kentucky', away: 'South Carolina', score: [25, 14] },
      { week: 13, home: 'Arkansas', away: 'Missouri', score: [28, 19] },
      { week: 13, home: 'Georgia', away: 'Kentucky', score: [24, 16] },
      { week: 13, home: 'LSU', away: 'Texas A&M', score: [17, 16] },
      { week: 13, home: 'Mississippi State', away: 'Ole Miss', score: [24, 34] },
      { week: 13, home: 'South Carolina', away: 'Florida', score: [22, 23] },
      { week: 13, home: 'Tennessee', away: 'Vanderbilt', score: [38, 36] }
    ]
  },

  pac12: {
    name: 'Pac-12',
    divisions: {
      'Pac-12 North': ['Oregon', 'Washington', 'Stanford', 'Oregon State', 'California', 'Washington State'],
      'Pac-12 South': ['USC', 'Colorado', 'Utah', 'Arizona State', 'UCLA', 'Arizona']
    },
    /* seed 3267 */
    games: [
      { week:  3, home: 'Arizona', away: 'UCLA', score: [29, 39] },
      { week:  3, home: 'Arizona State', away: 'Washington State', score: [66, 16] },
      { week:  3, home: 'Colorado', away: 'California', score: [37, 26] },
      { week:  3, home: 'Utah', away: 'Oregon', score: [23, 35] },
      { week:  4, home: 'Colorado', away: 'Washington', score: [21, 56] },
      { week:  4, home: 'Oregon', away: 'California', score: [36, 19] },
      { week:  4, home: 'Stanford', away: 'UCLA', score: [27, 40] },
      { week:  4, home: 'Utah', away: 'Arizona', score: [35, 6] },
      { week:  4, home: 'Washington State', away: 'Oregon State', score: [28, 32] },
      { week:  5, home: 'Oregon', away: 'Washington', score: [21, 27] },
      { week:  5, home: 'Oregon State', away: 'California', score: [23, 18] },
      { week:  5, home: 'Stanford', away: 'Arizona', score: [25, 18] },
      { week:  5, home: 'UCLA', away: 'Arizona State', score: [37, 57] },
      { week:  5, home: 'Washington State', away: 'Colorado', score: [43, 30] },
      { week:  6, home: 'Colorado', away: 'UCLA', score: [14, 33] },
      { week:  6, home: 'Utah', away: 'Arizona State', score: [33, 31] },
      { week:  6, home: 'Washington State', away: 'Stanford', score: [16, 20] },
      { week:  7, home: 'Arizona State', away: 'Oregon State', score: [34, 20] },
      { week:  7, home: 'California', away: 'Washington', score: [31, 29] },
      { week:  7, home: 'Stanford', away: 'Oregon', score: [29, 27] },
      { week:  7, home: 'Washington State', away: 'UCLA', score: [22, 30] },
      { week:  8, home: 'Arizona State', away: 'Oregon', score: [59, 37] },
      { week:  8, home: 'Oregon State', away: 'UCLA', score: [38, 31] },
      { week:  8, home: 'Utah', away: 'Washington State', score: [18, 37] },
      { week:  8, home: 'Washington', away: 'Stanford', score: [21, 48] },
      { week:  9, home: 'California', away: 'Washington State', score: [33, 34] },
      { week:  9, home: 'Oregon', away: 'Arizona', score: [54, 46] },
      { week:  9, home: 'Stanford', away: 'Utah', score: [19, 37] },
      { week:  9, home: 'Washington', away: 'Oregon State', score: [37, 43] },
      { week: 10, home: 'Arizona', away: 'Washington', score: [30, 35] },
      { week: 10, home: 'Oregon State', away: 'Colorado', score: [21, 25] },
      { week: 10, home: 'UCLA', away: 'California', score: [23, 30] },
      { week: 11, home: 'Arizona', away: 'Colorado', score: [15, 29] },
      { week: 11, home: 'California', away: 'Arizona State', score: [25, 17] },
      { week: 11, home: 'Oregon State', away: 'Stanford', score: [21, 39] },
      { week: 11, home: 'Utah', away: 'UCLA', score: [41, 31] },
      { week: 12, home: 'Colorado', away: 'Arizona State', score: [25, 22] },
      { week: 12, home: 'Oregon State', away: 'Arizona', score: [39, 17] },
      { week: 12, home: 'Washington', away: 'Utah', score: [55, 28] },
      { week: 12, home: 'Washington State', away: 'Oregon', score: [23, 30] },
      { week: 13, home: 'Arizona State', away: 'Arizona', score: [22, 26] },
      { week: 13, home: 'California', away: 'Stanford', score: [32, 12] },
      { week: 13, home: 'Colorado', away: 'Utah', score: [33, 27] },
      { week: 13, home: 'Oregon', away: 'Oregon State', score: [36, 29] },
      { week: 13, home: 'Washington State', away: 'Washington', score: [29, 35] }
    ]
  },

  valley: {
    name: 'Missouri Valley',
    divisions: {
      'Missouri Valley': ['South Dakota State', 'Missouri State', 'North Dakota', 'North Dakota State', 'Southern Illinois', 'Northern Iowa', 'Illinois State', 'South Dakota', 'Western Illinois', 'Youngstown State', 'Indiana State']
    },
    /* seed 3074 */
    games: [
      { week:  4, home: 'Missouri State', away: 'Indiana State', score: [34, 26] },
      { week:  4, home: 'South Dakota', away: 'Illinois State', score: [32, 24] },
      { week:  4, home: 'Southern Illinois', away: 'Western Illinois', score: [33, 31] },
      { week:  4, home: 'Youngstown State', away: 'North Dakota', score: [21, 24] },
      { week:  5, home: 'Indiana State', away: 'Southern Illinois', score: [24, 33] },
      { week:  5, home: 'North Dakota', away: 'South Dakota', score: [26, 0] },
      { week:  5, home: 'Northern Iowa', away: 'Missouri State', score: [25, 30] },
      { week:  5, home: 'South Dakota State', away: 'Youngstown State', score: [33, 23] },
      { week:  6, home: 'Northern Iowa', away: 'North Dakota', score: [12, 30] },
      { week:  6, home: 'South Dakota State', away: 'Illinois State', score: [29, 18] },
      { week:  6, home: 'Western Illinois', away: 'South Dakota', score: [6, 11] },
      { week:  6, home: 'Youngstown State', away: 'Southern Illinois', score: [9, 30] },
      { week:  7, home: 'Illinois State', away: 'Missouri State', score: [8, 33] },
      { week:  7, home: 'South Dakota', away: 'Indiana State', score: [35, 18] },
      { week:  7, home: 'Southern Illinois', away: 'North Dakota', score: [22, 32] },
      { week:  7, home: 'Western Illinois', away: 'Youngstown State', score: [29, 28] },
      { week:  8, home: 'Illinois State', away: 'Western Illinois', score: [29, 28] },
      { week:  8, home: 'Indiana State', away: 'Northern Iowa', score: [13, 18] },
      { week:  8, home: 'Missouri State', away: 'South Dakota State', score: [26, 30] },
      { week:  9, home: 'North Dakota', away: 'Western Illinois', score: [36, 22] },
      { week:  9, home: 'Northern Iowa', away: 'Illinois State', score: [25, 35] },
      { week:  9, home: 'South Dakota State', away: 'Indiana State', score: [41, 25] },
      { week:  9, home: 'Southern Illinois', away: 'South Dakota', score: [27, 25] },
      { week: 10, home: 'Illinois State', away: 'Indiana State', score: [32, 38] },
      { week: 10, home: 'North Dakota', away: 'Missouri State', score: [24, 29] },
      { week: 10, home: 'Northern Iowa', away: 'Southern Illinois', score: [24, 17] },
      { week: 10, home: 'Western Illinois', away: 'South Dakota State', score: [30, 34] },
      { week: 10, home: 'Youngstown State', away: 'South Dakota', score: [19, 7] },
      { week: 11, home: 'Indiana State', away: 'Western Illinois', score: [28, 33] },
      { week: 11, home: 'South Dakota', away: 'Northern Iowa', score: [22, 29] },
      { week: 11, home: 'South Dakota State', away: 'Southern Illinois', score: [21, 15] },
      { week: 11, home: 'Youngstown State', away: 'Missouri State', score: [10, 22] },
      { week: 12, home: 'Illinois State', away: 'Youngstown State', score: [29, 22] },
      { week: 12, home: 'North Dakota', away: 'South Dakota State', score: [34, 23] },
      { week: 12, home: 'Southern Illinois', away: 'Missouri State', score: [42, 47] },
      { week: 12, home: 'Western Illinois', away: 'Northern Iowa', score: [19, 27] }
    ]
  }
};

EGE.conferences[2021] = {
  bigTen: {
    name: 'Big Ten',
    divisions: {
      'Big Ten East': ['Ohio State', 'Indiana', 'Penn State', 'Maryland', 'Michigan', 'Rutgers', 'Michigan State'],
      'Big Ten West': ['Northwestern', 'Iowa', 'Wisconsin', 'Minnesota', 'Nebraska', 'Purdue', 'Illinois']
    },
    /* seed 2069 */
    games: [
      { week:  1, home: 'Iowa', away: 'Indiana', score: [39, 28] },
      { week:  1, home: 'Northwestern', away: 'Michigan State', score: [24, 39] },
      { week:  1, home: 'Wisconsin', away: 'Penn State', score: [25, 31] },
      { week:  4, home: 'Michigan', away: 'Rutgers', score: [32, 20] },
      { week:  4, home: 'Michigan State', away: 'Nebraska', score: [52, 34] },
      { week:  5, home: 'Maryland', away: 'Iowa', score: [24, 35] },
      { week:  5, home: 'Nebraska', away: 'Northwestern', score: [29, 13] },
      { week:  5, home: 'Purdue', away: 'Minnesota', score: [16, 9] },
      { week:  5, home: 'Wisconsin', away: 'Michigan', score: [14, 25] },
      { week:  6, home: 'Iowa', away: 'Penn State', score: [30, 3] },
      { week:  6, home: 'Nebraska', away: 'Michigan', score: [11, 41] },
      { week:  6, home: 'Rutgers', away: 'Michigan State', score: [3, 22] },
      { week:  7, home: 'Indiana', away: 'Michigan State', score: [16, 25] },
      { week:  7, home: 'Iowa', away: 'Purdue', score: [31, 21] },
      { week:  7, home: 'Minnesota', away: 'Nebraska', score: [25, 14] },
      { week:  7, home: 'Northwestern', away: 'Rutgers', score: [24, 21] },
      { week:  8, home: 'Michigan', away: 'Northwestern', score: [47, 20] },
      { week:  8, home: 'Minnesota', away: 'Maryland', score: [40, 10] },
      { week:  8, home: 'Purdue', away: 'Wisconsin', score: [31, 28] },
      { week:  9, home: 'Maryland', away: 'Indiana', score: [36, 33] },
      { week:  9, home: 'Michigan State', away: 'Michigan', score: [32, 35] },
      { week:  9, home: 'Nebraska', away: 'Purdue', score: [28, 11] },
      { week:  9, home: 'Northwestern', away: 'Minnesota', score: [0, 18] },
      { week:  9, home: 'Wisconsin', away: 'Iowa', score: [26, 0] },
      { week: 10, home: 'Maryland', away: 'Penn State', score: [39, 31] },
      { week: 10, home: 'Michigan', away: 'Indiana', score: [45, 24] },
      { week: 10, home: 'Northwestern', away: 'Iowa', score: [13, 24] },
      { week: 10, home: 'Purdue', away: 'Michigan State', score: [31, 40] },
      { week: 10, home: 'Rutgers', away: 'Wisconsin', score: [30, 46] },
      { week: 11, home: 'Indiana', away: 'Rutgers', score: [28, 13] },
      { week: 11, home: 'Iowa', away: 'Minnesota', score: [34, 29] },
      { week: 11, home: 'Michigan State', away: 'Maryland', score: [39, 20] },
      { week: 11, home: 'Penn State', away: 'Michigan', score: [15, 35] },
      { week: 11, home: 'Wisconsin', away: 'Northwestern', score: [20, 23] },
      { week: 12, home: 'Indiana', away: 'Minnesota', score: [21, 34] },
      { week: 12, home: 'Maryland', away: 'Michigan', score: [34, 28] },
      { week: 12, home: 'Northwestern', away: 'Purdue', score: [22, 34] },
      { week: 12, home: 'Wisconsin', away: 'Nebraska', score: [42, 15] },
      { week: 13, home: 'Michigan State', away: 'Penn State', score: [21, 28] },
      { week: 13, home: 'Minnesota', away: 'Wisconsin', score: [0, 16] },
      { week: 13, home: 'Nebraska', away: 'Iowa', score: [2, 45] },
      { week: 13, home: 'Purdue', away: 'Indiana', score: [20, 12] },
      { week: 13, home: 'Rutgers', away: 'Maryland', score: [25, 0] }
    ]
  },

  sec: {
    name: 'SEC',
    divisions: {
      'SEC East': ['Florida', 'Georgia', 'Missouri', 'Kentucky', 'Tennessee', 'South Carolina', 'Vanderbilt'],
      'SEC West': ['Alabama', 'Texas A&M', 'Auburn', 'LSU', 'Ole Miss', 'Mississippi State', 'Arkansas']
    },
    /* seed 3226 */
    games: [
      { week:  2, home: 'Kentucky', away: 'Missouri', score: [56, 14] },
      { week:  3, home: 'Georgia', away: 'South Carolina', score: [42, 21] },
      { week:  4, home: 'Arkansas', away: 'Texas A&M', score: [44, 37] },
      { week:  4, home: 'Florida', away: 'Tennessee', score: [31, 6] },
      { week:  4, home: 'Mississippi State', away: 'LSU', score: [30, 32] },
      { week:  4, home: 'South Carolina', away: 'Kentucky', score: [24, 29] },
      { week:  5, home: 'Kentucky', away: 'Florida', score: [28, 6] },
      { week:  5, home: 'LSU', away: 'Auburn', score: [23, 27] },
      { week:  5, home: 'Missouri', away: 'Tennessee', score: [51, 43] },
      { week:  5, home: 'Texas A&M', away: 'Mississippi State', score: [26, 33] },
      { week:  6, home: 'Auburn', away: 'Georgia', score: [24, 44] },
      { week:  6, home: 'Kentucky', away: 'LSU', score: [31, 28] },
      { week:  6, home: 'Ole Miss', away: 'Arkansas', score: [28, 20] },
      { week:  6, home: 'Tennessee', away: 'South Carolina', score: [41, 34] },
      { week:  7, home: 'Arkansas', away: 'Auburn', score: [41, 21] },
      { week:  7, home: 'Georgia', away: 'Kentucky', score: [35, 17] },
      { week:  7, home: 'LSU', away: 'Florida', score: [40, 23] },
      { week:  7, home: 'Missouri', away: 'Texas A&M', score: [26, 39] },
      { week:  7, home: 'South Carolina', away: 'Vanderbilt', score: [30, 22] },
      { week:  7, home: 'Tennessee', away: 'Ole Miss', score: [33, 46] },
      { week:  8, home: 'Ole Miss', away: 'LSU', score: [27, 21] },
      { week:  8, home: 'Texas A&M', away: 'South Carolina', score: [34, 2] },
      { week:  8, home: 'Vanderbilt', away: 'Mississippi State', score: [24, 36] },
      { week:  9, home: 'Auburn', away: 'Ole Miss', score: [26, 44] },
      { week:  9, home: 'Florida', away: 'Georgia', score: [22, 42] },
      { week:  9, home: 'Mississippi State', away: 'Kentucky', score: [24, 35] },
      { week:  9, home: 'Vanderbilt', away: 'Missouri', score: [21, 46] },
      { week: 10, home: 'Arkansas', away: 'Mississippi State', score: [32, 13] },
      { week: 10, home: 'Georgia', away: 'Missouri', score: [56, 11] },
      { week: 10, home: 'Kentucky', away: 'Tennessee', score: [32, 39] },
      { week: 10, home: 'South Carolina', away: 'Florida', score: [29, 25] },
      { week: 10, home: 'Texas A&M', away: 'Auburn', score: [3, 14] },
      { week: 11, home: 'Auburn', away: 'Mississippi State', score: [19, 39] },
      { week: 11, home: 'LSU', away: 'Arkansas', score: [40, 38] },
      { week: 11, home: 'Missouri', away: 'South Carolina', score: [27, 28] },
      { week: 11, home: 'Ole Miss', away: 'Texas A&M', score: [21, 16] },
      { week: 11, home: 'Tennessee', away: 'Georgia', score: [27, 34] },
      { week: 11, home: 'Vanderbilt', away: 'Kentucky', score: [23, 26] },
      { week: 12, home: 'Missouri', away: 'Florida', score: [21, 28] },
      { week: 12, home: 'Ole Miss', away: 'Vanderbilt', score: [28, 13] },
      { week: 12, home: 'South Carolina', away: 'Auburn', score: [15, 35] },
      { week: 13, home: 'Arkansas', away: 'Missouri', score: [24, 13] },
      { week: 13, home: 'LSU', away: 'Texas A&M', score: [21, 35] },
      { week: 13, home: 'Mississippi State', away: 'Ole Miss', score: [10, 35] },
      { week: 13, home: 'Tennessee', away: 'Vanderbilt', score: [23, 22] }
    ]
  },

  pac12: {
    name: 'Pac-12',
    divisions: {
      'Pac-12 North': ['Oregon', 'Washington', 'Stanford', 'Oregon State', 'California', 'Washington State'],
      'Pac-12 South': ['USC', 'Colorado', 'Utah', 'Arizona State', 'UCLA', 'Arizona']
    },
    /* seed 1984 */
    games: [
      { week:  4, home: 'Arizona State', away: 'Colorado', score: [28, 0] },
      { week:  4, home: 'Oregon', away: 'Arizona', score: [35, 31] },
      { week:  4, home: 'Stanford', away: 'UCLA', score: [23, 45] },
      { week:  4, home: 'Utah', away: 'Washington State', score: [21, 27] },
      { week:  4, home: 'Washington', away: 'California', score: [19, 31] },
      { week:  5, home: 'California', away: 'Washington State', score: [24, 31] },
      { week:  5, home: 'Oregon State', away: 'Washington', score: [27, 20] },
      { week:  5, home: 'Stanford', away: 'Oregon', score: [33, 17] },
      { week:  5, home: 'UCLA', away: 'Arizona State', score: [30, 28] },
      { week:  6, home: 'Arizona', away: 'UCLA', score: [29, 20] },
      { week:  6, home: 'Arizona State', away: 'Stanford', score: [48, 24] },
      { week:  6, home: 'Washington State', away: 'Oregon State', score: [27, 22] },
      { week:  7, home: 'Oregon', away: 'California', score: [46, 39] },
      { week:  7, home: 'Utah', away: 'Arizona State', score: [21, 33] },
      { week:  7, home: 'Washington', away: 'UCLA', score: [20, 31] },
      { week:  7, home: 'Washington State', away: 'Stanford', score: [31, 23] },
      { week:  8, home: 'Arizona', away: 'Washington', score: [7, 24] },
      { week:  8, home: 'California', away: 'Colorado', score: [43, 39] },
      { week:  8, home: 'Oregon State', away: 'Utah', score: [22, 24] },
      { week:  8, home: 'UCLA', away: 'Oregon', score: [34, 15] },
      { week:  9, home: 'Arizona State', away: 'Washington State', score: [32, 15] },
      { week:  9, home: 'California', away: 'Oregon State', score: [29, 28] },
      { week:  9, home: 'Oregon', away: 'Colorado', score: [28, 12] },
      { week:  9, home: 'Stanford', away: 'Washington', score: [28, 30] },
      { week:  9, home: 'Utah', away: 'UCLA', score: [18, 14] },
      { week: 10, home: 'Arizona', away: 'California', score: [29, 19] },
      { week: 10, home: 'Colorado', away: 'Oregon State', score: [21, 39] },
      { week: 10, home: 'Stanford', away: 'Utah', score: [18, 27] },
      { week: 10, home: 'Washington', away: 'Oregon', score: [23, 34] },
      { week: 11, home: 'Arizona', away: 'Utah', score: [8, 24] },
      { week: 11, home: 'Oregon', away: 'Washington State', score: [14, 10] },
      { week: 11, home: 'Oregon State', away: 'Stanford', score: [35, 18] },
      { week: 11, home: 'UCLA', away: 'Colorado', score: [25, 37] },
      { week: 11, home: 'Washington', away: 'Arizona State', score: [18, 6] },
      { week: 12, home: 'Colorado', away: 'Washington', score: [40, 31] },
      { week: 12, home: 'Oregon State', away: 'Arizona State', score: [17, 15] },
      { week: 12, home: 'Stanford', away: 'California', score: [28, 33] },
      { week: 12, home: 'Utah', away: 'Oregon', score: [25, 14] },
      { week: 12, home: 'Washington State', away: 'Arizona', score: [37, 24] },
      { week: 13, home: 'Arizona State', away: 'Arizona', score: [40, 7] },
      { week: 13, home: 'Oregon', away: 'Oregon State', score: [43, 40] },
      { week: 13, home: 'UCLA', away: 'California', score: [31, 25] },
      { week: 13, home: 'Utah', away: 'Colorado', score: [52, 33] },
      { week: 13, home: 'Washington', away: 'Washington State', score: [32, 0] }
    ]
  },

  valley: {
    name: 'Missouri Valley',
    divisions: {
      'Missouri Valley': ['South Dakota State', 'Missouri State', 'North Dakota', 'North Dakota State', 'Southern Illinois', 'Northern Iowa', 'Illinois State', 'South Dakota', 'Western Illinois', 'Youngstown State', 'Indiana State']
    },
    /* seed 2009 */
    games: [
      { week:  4, home: 'Missouri State', away: 'South Dakota', score: [45, 14] },
      { week:  4, home: 'Southern Illinois', away: 'Illinois State', score: [37, 33] },
      { week:  4, home: 'Youngstown State', away: 'Western Illinois', score: [15, 40] },
      { week:  5, home: 'Illinois State', away: 'Missouri State', score: [18, 19] },
      { week:  5, home: 'Northern Iowa', away: 'Youngstown State', score: [37, 0] },
      { week:  5, home: 'South Dakota', away: 'Indiana State', score: [28, 21] },
      { week:  5, home: 'Western Illinois', away: 'Southern Illinois', score: [19, 35] },
      { week:  6, home: 'Indiana State', away: 'Western Illinois', score: [29, 38] },
      { week:  6, home: 'South Dakota', away: 'North Dakota', score: [16, 42] },
      { week:  6, home: 'South Dakota State', away: 'Southern Illinois', score: [48, 27] },
      { week:  6, home: 'Youngstown State', away: 'Missouri State', score: [27, 41] },
      { week:  7, home: 'Missouri State', away: 'Indiana State', score: [21, 13] },
      { week:  7, home: 'Northern Iowa', away: 'South Dakota', score: [21, 24] },
      { week:  7, home: 'Southern Illinois', away: 'North Dakota', score: [28, 24] },
      { week:  7, home: 'Western Illinois', away: 'South Dakota State', score: [14, 21] },
      { week:  8, home: 'Indiana State', away: 'Youngstown State', score: [19, 36] },
      { week:  8, home: 'North Dakota', away: 'Western Illinois', score: [35, 23] },
      { week:  8, home: 'South Dakota', away: 'Illinois State', score: [28, 21] },
      { week:  8, home: 'South Dakota State', away: 'Northern Iowa', score: [27, 29] },
      { week:  9, home: 'Missouri State', away: 'North Dakota', score: [24, 15] },
      { week:  9, home: 'Northern Iowa', away: 'Southern Illinois', score: [11, 24] },
      { week:  9, home: 'Western Illinois', away: 'Illinois State', score: [16, 30] },
      { week:  9, home: 'Youngstown State', away: 'South Dakota State', score: [13, 40] },
      { week: 10, home: 'Illinois State', away: 'Northern Iowa', score: [22, 20] },
      { week: 10, home: 'North Dakota', away: 'Youngstown State', score: [25, 29] },
      { week: 10, home: 'Southern Illinois', away: 'Missouri State', score: [19, 24] },
      { week: 10, home: 'Western Illinois', away: 'South Dakota', score: [21, 50] },
      { week: 11, home: 'Indiana State', away: 'Southern Illinois', score: [21, 2] },
      { week: 11, home: 'Missouri State', away: 'Northern Iowa', score: [32, 15] },
      { week: 11, home: 'North Dakota', away: 'Illinois State', score: [29, 3] },
      { week: 11, home: 'South Dakota', away: 'South Dakota State', score: [19, 7] },
      { week: 12, home: 'Illinois State', away: 'Indiana State', score: [31, 38] },
      { week: 12, home: 'Northern Iowa', away: 'Western Illinois', score: [42, 21] },
      { week: 12, home: 'South Dakota State', away: 'North Dakota', score: [21, 0] },
      { week: 12, home: 'Southern Illinois', away: 'Youngstown State', score: [37, 29] }
    ]
  }
};
