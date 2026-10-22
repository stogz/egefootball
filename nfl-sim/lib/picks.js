/* ==========================================================================
   EGE Football NFL sim — how far out the picks go
   Every team has its own seven picks in every draft through 2030 (Sam,
   2026-10-22), and keeps six drafts ahead after that: as each draft is
   held, the year six out is added. A world saved with fewer is filled in
   the next time it opens (lib/league.js ready), never touching a pick that
   is already there or one already used.
   ========================================================================== */

'use strict';

const THROUGH = 2030;
const AHEAD = 6;
const ROUNDS = 7;

/* The next draft: this one while the league is at it, otherwise next
   spring's. */
function nextDraft(league) { return league.phase === 'draft' ? league.season : league.season + 1; }

/* The last draft there are picks for. */
function lastDraft(league) { return Math.max(THROUGH, league.season + AHEAD); }

/* Adds every team's own picks for each draft from `first` (the next one
   unless given) to the last that has none yet. Returns the years added. */
function fillPicks(league, first) {
  league.picks = league.picks || [];
  const have = new Set(league.picks.map((p) => p.year));
  const added = [];
  for (let year = first || nextDraft(league); year <= lastDraft(league); year += 1) {
    if (have.has(year)) { continue; }
    league.teams.forEach((t) => {
      for (let round = 1; round <= ROUNDS; round += 1) { league.picks.push({ year, round, from: t.key, owner: t.key }); }
    });
    added.push(year);
  }
  return added;
}

module.exports = { THROUGH, AHEAD, nextDraft, lastDraft, fillPicks };
