/* ==========================================================================
   EGE Football — results, as they are published
   One entry per game that has been played: the score, the stat line, and
   what was riding on it. Written by the admin portal a week at a time and
   committed here, which is what makes a week official — Supabase holds a
   season in progress, and this file holds what actually happened.

   It is applied over data/schedule.js when it loads, so everything that
   already reads a game — the schedule table, the game log, the record, the
   touchdown credits, the Discord bot — picks the results up without knowing
   this file exists.

   Everything between the markers is rewritten by the portal each time a week
   is published, and it carries every week published so far, not just the
   latest. Leave the markers alone and it will keep finding its place.
   ========================================================================== */

window.EGE = window.EGE || {};

/* ege:results:start */
EGE.results = {};
/* ege:results:end */

EGE.applyResults();
