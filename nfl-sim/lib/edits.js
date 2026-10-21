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

   The Teams pages use the rest, for an admin: a player's archetype and
   skills too (editPlayer), a free agent signed onto a team (signFreeAgent),
   and a team's schemes and mode (teamInfo).
   ========================================================================== */

'use strict';

const { reRate, overallOf, archetypeOf, ARCHETYPES, SKILLS } = require('./skills');
const { realClass, expected } = require('./draft');
const { sign } = require('./rosters');
const { marketPay } = require('./value');
const { OFFENSE, DEFENSE } = require('./schemes');
const { index } = require('./league');
const { seeded, hash } = require('./rng');
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

function log(league, kind, id, summary) {
  (league.transactions = league.transactions || []).push({ season: league.season, week: league.week, phase: league.phase,
                                                           kind, id, summary });
}

/* A player on a team page, as the editor needs him. Found by name and
   position, which is all the published rosters carry. */
function playerOn(league, key, name, pos) {
  const p = (league.byTeam.get(key) || []).find((x) => x.name === name && x.pos === pos);
  if (!p) { return null; }
  return { id: p.id, ege: p.ege || null, ovr: p.ovr, pot: Math.max(p.pot || p.ovr, p.ovr), archetype: p.archetype || null,
           skills: Object.assign({}, p.skills || {}), archetypes: ARCHETYPES[p.pos] || [] };
}

/* Any of a player's overall, ceiling, archetype and skills (whatever is
   given and different). New skills make the overall they average out to,
   unless a new overall is given too; a new overall alone moves every skill
   with it. An archetype set by hand stays his whatever his skills do. */
function editPlayer(league, id, want) {
  const p = league.byId.get(id);
  if (!p) { throw new Error('No player ' + id + '.'); }
  if (p.ege) { throw new Error(p.name + ' is rated on the website.'); }
  if (p.status === 'retired') { throw new Error(p.name + ' has retired.'); }
  const before = { ovr: p.ovr, pot: Math.max(p.pot || p.ovr, p.ovr), archetype: p.archetype || null };
  let ovr = rating(want.ovr, 'Overall');
  if (ovr === p.ovr) { ovr = null; }
  const pot = rating(want.pot, 'Ceiling');
  let skills = null;
  if (want.skills) {
    skills = {};
    Object.keys(SKILLS[p.pos] || {}).forEach((k) => {
      const v = want.skills[k];
      const n = v === undefined || v === null || v === '' ? (p.skills || {})[k] : Number(v);
      if (!Number.isInteger(n) || n < 30 || n > 99) { throw new Error('Skills go from 30 to 99.'); }
      skills[k] = n;
    });
    if (!Object.keys(skills).some((k) => skills[k] !== (p.skills || {})[k])) { skills = null; }
  }
  if (skills) {
    p.skills = skills;
    p.ovr = ovr !== null ? ovr : overallOf(p.pos, skills);
  } else if (ovr !== null) {
    reRate(p, ovr);
  }
  if (want.archetype && want.archetype !== p.archetype) {
    if ((ARCHETYPES[p.pos] || []).indexOf(want.archetype) === -1) { throw new Error(want.archetype + ' is not a ' + p.pos + ' archetype.'); }
    p.archetype = want.archetype;
    p.archetypeSet = true;
  } else if (skills && !p.archetypeSet) {
    p.archetype = archetypeOf(p.pos, p.skills, p.ovr);
  }
  p.pot = Math.max(p.ovr, pot !== null ? pot : before.pot);
  const after = { ovr: p.ovr, pot: p.pot, archetype: p.archetype || null };
  log(league, 'edit', id, p.name + ': ' + before.ovr + '/' + before.pot + ' to ' + after.ovr + '/' + after.pot +
    (after.archetype !== before.archetype ? ', ' + after.archetype : '') + (skills ? ', skills' : ''));
  return { name: p.name, before, after };
}

/* The free agents at some positions, best first, with what each asks. */
function freeAgents(league, positions, limit) {
  return league.players.filter((p) => p.status === 'fa' && positions.indexOf(p.pos) !== -1)
    .sort((a, b) => b.ovr - a.ovr || a.age - b.age).slice(0, limit || 60)
    .map((p) => ({ id: p.id, name: p.name, pos: p.pos, age: p.age, ovr: p.ovr, ask: marketPay(p, league.season) }));
}

/* Signs a free agent onto a team at what the market pays him. */
function signFreeAgent(league, id, key) {
  const p = league.byId.get(id);
  if (!p || p.status !== 'fa') { throw new Error((p ? p.name : id) + ' is not a free agent.'); }
  if (!TEAMS[key]) { throw new Error('No team ' + key + '.'); }
  sign(p, key, league, seeded(hash((league.seed || 'ege-nfl') + ':sign:' + league.season + ':' + id)), marketPay(p, league.season));
  index(league);
  log(league, 'signing', id, p.name + ' signs with ' + TEAMS[key].name);
  return { name: p.name, pos: p.pos, ovr: p.ovr, contract: Object.assign({}, p.contract) };
}

/* A team's schemes and mode, for an admin's eyes on its page. */
function teamInfo(league, key) {
  const t = league.teams.find((x) => x.key === key);
  if (!t) { return null; }
  return { season: league.season, offense: OFFENSE[t.offense] ? OFFENSE[t.offense].name : t.offense,
           defense: DEFENSE[t.defense] ? DEFENSE[t.defense].name : t.defense, mode: t.mode || 'compete' };
}

module.exports = { draftClass, classYear, setRatings, playerOn, editPlayer, freeAgents, signFreeAgent, teamInfo };
