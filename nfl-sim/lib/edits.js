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
   a team's schemes and mode (teamInfo) and a scheme picked by hand
   (setScheme), a contract set by hand or a player cut (setContract,
   releasePlayer), a team's payroll (teamPay), and the six's archetypes,
   the one thing about them set here (setSixArchetype).
   ========================================================================== */

'use strict';

const { reRate, overallOf, archetypeOf, ARCHETYPES, SKILLS } = require('./skills');
const { realClass, expected } = require('./draft');
const { sign, release, payroll, onTeam } = require('./rosters');
const { marketPay, capFor } = require('./value');
const { sixFromSite } = require('./ege');
const { OFFENSE, DEFENSE } = require('./schemes');
const { playerFit } = require('./fit');
const { adopt } = require('./offseason');
const { index } = require('./league');
const { seeded, hash } = require('./rng');
const { TEAMS } = require('./teams');
const sixTrades = require('./six-trades');

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
           skills: Object.assign({}, p.skills || {}), archetypes: ARCHETYPES[p.pos] || [],
           contract: p.contract ? { apy: p.contract.apy, through: p.contract.through } : null, season: league.season };
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
function freeAgents(league, positions, limit, key) {
  return league.players.filter((p) => p.status === 'fa' && positions.indexOf(p.pos) !== -1)
    .sort((a, b) => b.ovr - a.ovr || a.age - b.age).slice(0, limit || 60)
    .map((p) => {
      const fit = key ? playerFit(league, p, key) : null;
      return { id: p.id, name: p.name, pos: p.pos, age: p.age, ovr: p.ovr, ask: marketPay(p, league.season),
               fit: fit ? { scheme: fit.scheme, stars: fit.stars } : null };
    });
}

/* Signs a free agent onto a team at what the market pays him. */
function signFreeAgent(league, id, key) {
  const p = league.byId.get(id);
  if (!p || p.status !== 'fa') { throw new Error((p ? p.name : id) + ' is not a free agent.'); }
  if (!TEAMS[key]) { throw new Error('No team ' + key + '.'); }
  sign(p, key, league, seeded(hash((league.seed || 'ege-nfl') + ':sign:' + league.season + ':' + id)), marketPay(p, league.season));
  sixTrades.record(league, p, p.lastTeam || null, key);
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

/* A team's offense or defense picked by hand: its tendencies move to the
   new scheme's the way a new staff's do (offseason.js adopt), from the
   next game. The team keeps it until Sam changes it or its coaches are
   fired; it is not switched for fit in the offseason. */
function setScheme(league, key, side, scheme) {
  const t = league.teams.find((x) => x.key === key);
  if (!t) { throw new Error('No team ' + key + '.'); }
  const all = side === 'offense' ? OFFENSE : side === 'defense' ? DEFENSE : null;
  if (!all) { throw new Error('A scheme is an offense or a defense.'); }
  const want = all[scheme] ? scheme : Object.keys(all).find((k) => all[k].name.toLowerCase() === String(scheme).toLowerCase());
  if (!want) { throw new Error(scheme + ' is not ' + (side === 'offense' ? 'an offense' : 'a defense') + '.'); }
  const before = all[t[side]] ? all[t[side]].name : t[side];
  if (want === t[side]) { return { team: key, side, before, after: before, same: true }; }
  adopt(t, side, want, league.season);
  t[side + 'Set'] = league.season;
  log(league, 'scheme', key, TEAMS[key].name + ' switch to ' + (/^[AEIOU]/.test(all[want].name) ? 'an ' : 'a ') + all[want].name + ' ' + side);
  return { team: key, side, before, after: all[want].name };
}

const IN_SEASON = ['regular', 'deadline', 'playoffs'];

function round1(v) { return Math.round(v * 10) / 10; }

/* A player's contract set by hand: what he is paid a year ($M) and the
   last season it runs through, either left out to keep it. A later season
   extends it; more or less pay moves his team's payroll the same. The six
   too: what they are paid is the sim's business, not the website's. */
function setContract(league, id, want) {
  const p = league.byId.get(id);
  if (!p || p.status !== 'active' || !TEAMS[p.team]) { throw new Error((p ? p.name : id) + ' is not on a team.'); }
  const before = { apy: p.contract ? p.contract.apy : null, through: p.contract ? p.contract.through : null };
  const after = Object.assign({}, before);
  if (want.apy !== undefined && want.apy !== null && want.apy !== '') {
    const n = Number(want.apy);
    if (!isFinite(n) || n < 0.5 || n > 80) { throw new Error('Pay goes from $0.5M to $80M a year.'); }
    after.apy = round1(n);
  }
  if (want.through !== undefined && want.through !== null && want.through !== '') {
    const n = Number(want.through);
    if (!Number.isInteger(n) || n < league.season || n > league.season + 7) {
      throw new Error('A contract runs through ' + league.season + ' at the earliest and ' + (league.season + 7) + ' at the latest.');
    }
    after.through = n;
  }
  if (typeof after.apy !== 'number' || typeof after.through !== 'number') { throw new Error('Give his pay and the last season.'); }
  if (after.apy === before.apy && after.through === before.through) { return { name: p.name, before, after, same: true }; }
  p.contract = { through: after.through, apy: after.apy };
  log(league, 'contract', id, p.name + ': $' + before.apy + 'M through ' + before.through + ' to $' + after.apy + 'M through ' + after.through);
  return { name: p.name, before, after };
}

/* A player cut: a free agent from now on, and his pay off the payroll (the
   sim keeps no dead money). The team stays a man short until it signs
   somebody. One of the six only between seasons, since his games on the
   website are his team's, and his transfers need changing by hand unless
   a team signs him here. */
function releasePlayer(league, id) {
  const p = league.byId.get(id);
  if (!p || p.status !== 'active' || !TEAMS[p.team]) { throw new Error((p ? p.name : id) + ' is not on a team.'); }
  if (p.ege && IN_SEASON.indexOf(league.phase) !== -1) {
    throw new Error(p.name + ' can only be cut between seasons.');
  }
  const from = p.team;
  release(p, league.season);
  index(league);
  log(league, 'release', id, p.name + ' released by the ' + TEAMS[from].name);
  return { name: p.name, pos: p.pos, from, ege: p.ege || null };
}

/* A team's payroll against this season's cap, every player on it counted:
   the linemen, kickers and punters the Teams pages do not list too. With
   it the cap for this season and the next three, the years its contracts
   are shown for. */
function teamPay(league, key) {
  if (!TEAMS[key]) { return null; }
  const pay = payroll(league, key);
  const cap = capFor(league.season);
  const caps = {};
  for (let y = league.season; y < league.season + 4; y += 1) { caps[y] = capFor(y); }
  return { season: league.season, payroll: round1(pay), cap, room: round1(cap - pay), players: onTeam(league, key).length, caps };
}

/* The six's archetypes. Their skills are the website's, so an archetype is
   only what they are called, and one set by hand stays his whatever his
   skills do from then on (league.egeArchetypes, read in league.js
   syncSix). It is kept for one still in college too, and given him at his
   draft. None (or '') puts back the one his skills give him. */
function sixArchetypes(league) {
  const six = sixFromSite(league.season);
  const set = league.egeArchetypes || {};
  return Object.keys(six).map((slug) => {
    const site = six[slug].player;
    const p = league.byId.get('ege:' + slug);
    const now = p && p.status !== 'retired' ? p : null;
    return { slug, name: site.name, pos: site.pos, team: now && TEAMS[now.team] ? now.team : null,
             archetype: set[slug] || (now && now.archetype) || site.archetype || null, set: Boolean(set[slug]),
             archetypes: ARCHETYPES[site.pos] || [] };
  });
}

function setSixArchetype(league, slug, archetype) {
  const six = sixFromSite(league.season);
  if (!six[slug]) { throw new Error('No ' + slug + ' among the six.'); }
  const site = six[slug].player;
  const p = league.byId.get('ege:' + slug);
  const before = (p && p.archetype) || (league.egeArchetypes || {})[slug] || site.archetype || null;
  if (archetype) {
    if ((ARCHETYPES[site.pos] || []).indexOf(archetype) === -1) { throw new Error(archetype + ' is not a ' + site.pos + ' archetype.'); }
    league.egeArchetypes = Object.assign({}, league.egeArchetypes, { [slug]: archetype });
  } else if (league.egeArchetypes) {
    delete league.egeArchetypes[slug];
    if (!Object.keys(league.egeArchetypes).length) { delete league.egeArchetypes; }
  }
  const after = archetype || archetypeOf(site.pos, p && p.skills ? p.skills : site.skills, p ? p.ovr : site.ovr);
  if (p) { p.archetype = after; }
  log(league, 'edit', 'ege:' + slug, site.name + ': ' + (before || 'no archetype') + ' to ' + after + (archetype ? '' : ' (from his skills)'));
  return { name: site.name, before, after };
}

module.exports = { draftClass, classYear, setRatings, playerOn, editPlayer, freeAgents, signFreeAgent, teamInfo, setScheme,
                   setContract, releasePlayer, teamPay, sixArchetypes, setSixArchetype, SCHEMES: { offense: OFFENSE, defense: DEFENSE } };
