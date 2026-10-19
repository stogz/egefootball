/* ==========================================================================
   EGE Football — the NFL sim's results
   Written by the NFL sim (the admin page's NFL Sim tab, or
   node nfl-sim/sim.js site); write it again from there rather than by hand.

   From `from` on, a season's NFL games are the ones the sim played: the
   standings use these in place of the real scores in data/conferences.js.
   The six's own games are in stats/{year}.js, which wins wherever both
   have the same game. A game counts once its week is published, like every
   other result. `score` is [home, away].
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.nflSimResults = {
};
