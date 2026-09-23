/* ==========================================================================
   EGE Football — which season is live
   Small on purpose: the admin portal regenerates this whole file when a
   season is rolled over, so it holds the season pointer and nothing else.
   The season ladder itself — which years are high school, which are college
   — lives in data/players.js and is not touched by a rollover.

   `currentSeason` is the season the site opens on. Everything that reads a
   season without being told one reads this.

   `lockedSeasons` are the seasons whose ratings have already been folded
   into data/ratings.js. Once a season is in this list the numbers in that
   file include everything bought during it, so it must never be locked
   twice — the portal refuses to.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.currentSeason = 2019;

EGE.lockedSeasons = [2018];

/* Whether a season's ratings have been hardcoded already: either it has been
   rolled past, or data/ratings.js says it was locked at the end of it. The
   second is what covers the stretch between committing the ratings file and
   rolling the season over. */
EGE.seasonLocked = function (season) {
  var year = season || EGE.currentSeason;
  return (EGE.lockedSeasons || []).indexOf(year) !== -1 ||
    EGE.ratingsLockedSeason === year;
};

/* The season after this one on the ladder, or null at the end of it. */
EGE.nextSeason = function (season) {
  var year = season || EGE.currentSeason;
  var years = (EGE.seasons || []).map(function (s) { return s.year; }).sort();
  var at = years.indexOf(year);
  if (at === -1 || at === years.length - 1) { return null; }
  return years[at + 1];
};
