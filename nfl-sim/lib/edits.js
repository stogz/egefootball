/* ==========================================================================
   EGE Football NFL sim — Sam's edits
   Any player's overall and ceiling, set by hand (the admin page's player
   editor). His skills move with his overall (skills.js reRate), so he
   plays like the new number from the next game; his ceiling is never below
   it. From there he ages and develops like anybody else, toward the new
   ceiling.

   A prospect in a class not drafted yet is kept in league.prospectEdits
   until the draft (lib/draft.js). The six are rated on the website and
   never here.
   ========================================================================== */

'use strict';

const { reRate } = require('./skills');
const { realClass, expected } = require('./draft');
const { TEAMS } = require('./teams');

/* The class the next draft takes: this season's before the draft, next
   season's from kickoff on. Only the real classes are known ahead. */
function classYear(league) { return league.phase === 'draft' ? league.season : league.season + 1; }

function draftClass(league) {
  const year = classYear(league);
  const edits = league.prospectEdits || {};
  return { year, players: (realClass(year).list || []).map((pr) => {
    const e = edits[pr.id] || {};
    const guess = expected(pr, year);
    return { id: pr.id, name: pr.name, pos: pr.pos, college: pr.college, grade: pr.grade,
             ovr: e.ovr || guess.ovr, pot: Math.max(e.ovr || guess.ovr, e.pot || guess.pot), edited: Boolean(e.ovr || e.pot) };
  }) };
}

function rating(value, what) {
  if (value === undefined || value === null || value === '') { return null; }
  const n = Number(value);
  if (!Number.isInteger(n) || n < 40 || n > 99) { throw new Error(what + ' goes from 40 to 99.'); }
  return n;
}

/* Sets a player's overall and ceiling (either can be left out). Returns
   who he is and what changed. */
function setRatings(league, id, want) {
  const ovr = rating(want.ovr, 'Overall');
  const pot = rating(want.pot, 'Ceiling');
  const p = league.byId.get(id);
  let out;
  if (p) {
    if (p.ege) { throw new Error(p.name + ' is rated on the website.'); }
    if (p.status === 'retired') { throw new Error(p.name + ' has retired.'); }
    const before = { ovr: p.ovr, pot: p.pot || p.ovr };
    if (ovr !== null && ovr !== p.ovr) { reRate(p, ovr); }
    p.pot = Math.max(p.ovr, pot !== null ? pot : before.pot);
    out = { name: p.name, pos: p.pos, team: TEAMS[p.team] ? p.team : null, before, after: { ovr: p.ovr, pot: p.pot } };
  } else {
    const c = draftClass(league);
    const pr = c.players.find((x) => x.id === id);
    if (!pr) { throw new Error('No player ' + id + '.'); }
    const before = { ovr: pr.ovr, pot: pr.pot };
    const e = (league.prospectEdits = league.prospectEdits || {})[id] || {};
    if (ovr !== null) { e.ovr = ovr; }
    if (pot !== null) { e.pot = pot; }
    league.prospectEdits[id] = e;
    const now = draftClass(league).players.find((x) => x.id === id);
    out = { name: pr.name, pos: pr.pos, team: null, prospect: c.year, before, after: { ovr: now.ovr, pot: now.pot } };
  }
  (league.transactions = league.transactions || []).push({
    season: league.season, week: league.week, phase: league.phase, kind: 'edit', id,
    summary: out.name + ': ' + out.before.ovr + ' to ' + out.after.ovr + ' overall, ' + out.before.pot + ' to ' + out.after.pot + ' ceiling'
  });
  return out;
}

module.exports = { draftClass, classYear, setRatings };
