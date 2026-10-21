/* ==========================================================================
   EGE Football NFL sim — the offseason
   In two parts, so Sam can look at the pre-draft trades in between:

   startOffseason (after the Super Bowl)
     1. the season goes into the history and its stats to stats-YEAR.json;
        everybody heals;
     2. a year older: growth toward potential, decline past the peak,
        cliffs (lib/aging.js); the rating scale held where it was; then
        the 99s -- at most one a position, and the best at a position who
        reaches 96 is one;
     3. retirements;
     4. cap casualties; expiring contracts re-signed or let go; free
        agency;
     5. team ratings, then each team's mode (compete, retool, rebuild)
        and whether it changes coaches or schemes;
     6. pre-draft trade proposals for Sam.

   finishOffseason (the draft and after)
     7. pending trades expire; the draft, in a hand-set order if the year
        has one (lib/draft-plan.js), with any rounds Sam wrote himself;
     8. free agency again for the leftovers; 53-man rosters;
     9. the new season's schedule.
   ========================================================================== */

'use strict';

const { develop, retireChance, holdScale } = require('./aging');
const { standings, recordText } = require('./standings');
const { draftOrder, startSeason, writeWorld } = require('./season');
const { reSign, freeAgency, fillDepth, cutDown, fillHoles, onTeam, byPos, SLOTS, capCasualties } = require('./rosters');
const { runDraft, makeName } = require('./draft');
const { applyOfficial, planFor } = require('./draft-plan');
const { rateTeams } = require('./team-ratings');
const { OFFENSE, DEFENSE, fitOf, centreOn } = require('./schemes');
const { gameDay } = require('./lineup');
const { propose, closeWindow, queueMoves } = require('./trades');
const { index, syncSix } = require('./league');
const { TEAMS } = require('./teams');
const { capFor } = require('./value');
const { keep: keepRosters } = require('./history');

const ING = { compete: 'competing', retool: 'retooling', rebuild: 'rebuilding' };
function nick(key) { return TEAMS[key] ? TEAMS[key].name.split(' ').slice(-1)[0] : key; }

function ageOn(born, season) {
  if (!born) { return null; }
  const [y, m, d] = born.split('-').map(Number);
  let age = season - y;
  if (m > 9 || (m === 9 && d > 1)) { age -= 1; }
  return age;
}

/* -------------------------------------------------------------- history -- */

function archive(league) {
  const table = standings(league.schedule, league.season);
  const po = league.playoffs || {};
  const sb = po.rounds && po.rounds[3] && po.rounds[3].games[0];
  const entry = {
    season: league.season,
    champion: po.champion || null,
    runnerUp: sb ? (sb.winner === sb.home ? sb.away : sb.home) : null,
    superBowl: sb ? { home: sb.home, away: sb.away, score: sb.score } : null,
    records: {},
    divisions: {},
    seeds: table.seeds
  };
  Object.keys(table.records).forEach((k) => { entry.records[k] = recordText(table.records[k]); });
  Object.keys(table.divisions).forEach((d) => { entry.divisions[d] = table.divisions[d].map((r) => r.key); });
  (league.history = league.history || []).push(entry);
  writeWorld(league, 'stats-' + league.season + '.json', league.stats || {});
  keepRosters(league);
  return entry;
}

/* ------------------------------------------------------------------ 99s -- */

/* At most one 99 a position. The best at a position who has reached 96
   is the 99 -- so there are 99s every year, and never two at once. */
function the99s(league) {
  const out = [];
  const active = league.players.filter((p) => p.status === 'active' && !p.ege);
  const positions = Array.from(new Set(active.map((p) => p.pos)));
  positions.forEach((pos) => {
    const list = active.filter((p) => p.pos === pos).sort((a, b) => b.ovr - a.ovr || (b.pot || 0) - (a.pot || 0));
    list.forEach((p, i) => {
      if (i === 0 && p.ovr >= 96 && p.ovr < 99) { p.ovr = 99; p.pot = Math.max(p.pot, 99); out.push(p.name + ' (' + pos + ') becomes the 99'); }
      if (i > 0 && p.ovr >= 99) { p.ovr = 98; p.pot = Math.min(p.pot, 98); }
    });
  });
  return out;
}

/* ------------------------------------------------------------- schemes -- */

/* How well a team's starters fit each scheme, in overall points. */
function fits(team, roster) {
  const day = gameDay(team, roster);
  const off = [day.qb].concat(day.rbs.slice(0, 1), day.wrs, day.tes.slice(0, 1), day.ol).filter((p) => !p.standIn);
  const def = day.edge.concat(day.di, day.lb, day.cb, day.s).filter((p) => !p.standIn);
  const avg = (list, scheme) => list.reduce((s, p) => s + fitOf(p, scheme), 0) / Math.max(1, list.length);
  const o = {};
  const d = {};
  Object.keys(OFFENSE).forEach((k) => { o[k] = avg(off, OFFENSE[k]); });
  Object.keys(DEFENSE).forEach((k) => { d[k] = avg(def, DEFENSE[k]); });
  return { offense: o, defense: d };
}

/* A new scheme's tendencies: mostly the scheme's, some of the old. */
function adopt(team, side, scheme, season) {
  const old = side === 'offense' ? team.offenseTendencies : team.defenseTendencies;
  const target = (side === 'offense' ? OFFENSE : DEFENSE)[scheme].tendencies;
  const blend = (a, b) => Math.round((0.3 * a + 0.7 * b) * 1000) / 1000;
  const next = {};
  Object.keys(target).forEach((k) => {
    if (k === 'targets') {
      next.targets = {};
      Object.keys(target.targets).forEach((t) => { next.targets[t] = blend(old.targets[t], target.targets[t]); });
    } else if (k === 'front') {
      next.front = target.front;
    } else {
      next[k] = blend(old[k], target[k]);
    }
  });
  team[side] = scheme;
  team[side + 'Tendencies'] = next;
  team.schemeSince = season;
}

function best(map, exclude) {
  return Object.keys(map).filter((k) => k !== exclude).sort((a, b) => map[b] - map[a])[0];
}

/* A team's mode from its rating, last season's wins and the age of its
   best players: good teams compete, bad old ones (and very bad ones)
   rebuild, the rest retool. */
function modeFor(league, t, overall, wins) {
  const core = onTeam(league, t.key).sort((a, b) => b.ovr - a.ovr).slice(0, 12);
  const coreAge = core.reduce((s, p) => s + (p.age || 26), 0) / Math.max(1, core.length);
  if (overall >= 80 || (overall >= 74 && wins >= 10)) { return 'compete'; }
  if ((overall <= 66 && (coreAge >= 27.5 || wins <= 5)) || wins <= 4) { return 'rebuild'; }
  return 'retool';
}

/* The first season's modes, before anybody has a record. */
function firstModes(league) {
  const ratings = rateTeams(league, { rounds: 2, seed: 'kickoff:' + league.season });
  league.teams.forEach((t) => {
    t.rating = ratings[t.key].overall;
    t.mode = modeFor(league, t, t.rating, 8);
  });
}

/* Modes, then coaching changes and scheme switches. */
function modesAndSchemes(league, rng, ratings, lastRecords) {
  const notes = [];
  league.teams.forEach((t) => {
    const r = ratings[t.key];
    t.rating = r.overall;
    const roster = onTeam(league, t.key);
    const rec = lastRecords[t.key];
    const wins = rec ? Number(rec.split('-')[0]) : 8;
    const before = t.mode;
    t.mode = modeFor(league, t, r.overall, wins);
    if (before !== t.mode) { notes.push(nick(t.key) + ' go from ' + ING[before] + ' to ' + ING[t.mode]); }

    /* Coaches: a bad year can cost a staff its job. */
    const fireChance = wins <= 4 ? 0.6 : wins <= 6 ? 0.3 : wins <= 8 ? 0.08 : wins <= 10 ? 0.02 : 0;
    const f = fits(t, roster);
    if (rng() < fireChance) {
      const offPick = rng() < 0.65 ? best(f.offense) : Object.keys(OFFENSE)[Math.floor(rng() * 5)];
      const defPick = rng() < 0.65 ? best(f.defense) : Object.keys(DEFENSE)[Math.floor(rng() * 5)];
      const changes = [];
      const an = (name) => (/^[AEIOU]/.test(name) ? 'an ' : 'a ') + name;
      if (offPick !== t.offense) { changes.push(an(OFFENSE[offPick].name) + ' offense'); adopt(t, 'offense', offPick, league.season); }
      if (defPick !== t.defense) { changes.push(an(DEFENSE[defPick].name) + ' defense'); adopt(t, 'defense', defPick, league.season); }
      notes.push(nick(t.key) + ' fire their coaches' + (changes.length ? ' and switch to ' + changes.join(' and ') : ' and keep their schemes'));
      return;
    }
    /* Same staff: a switch only when the roster now clearly fits another
       scheme, or a rebuilding team wants to try something. */
    const offBest = best(f.offense);
    if (offBest !== t.offense && (f.offense[offBest] - f.offense[t.offense] > 1.2 || (t.mode === 'rebuild' && rng() < 0.15))) {
      notes.push(nick(t.key) + ' move from ' + OFFENSE[t.offense].name + ' to ' + OFFENSE[offBest].name + ' (fit ' +
        f.offense[t.offense].toFixed(1) + ' to ' + f.offense[offBest].toFixed(1) + ')');
      adopt(t, 'offense', offBest, league.season);
    }
    const defBest = best(f.defense);
    if (defBest !== t.defense && (f.defense[defBest] - f.defense[t.defense] > 1.2 || (t.mode === 'rebuild' && rng() < 0.15))) {
      notes.push(nick(t.key) + ' move from ' + DEFENSE[t.defense].name + ' to ' + DEFENSE[defBest].name + ' (fit ' +
        f.defense[t.defense].toFixed(1) + ' to ' + f.defense[defBest].toFixed(1) + ')');
      adopt(t, 'defense', defBest, league.season);
    }
  });
  return notes;
}

/* ------------------------------------------------------------ big moves -- */

/* A star (85 or better, or 80 now and 85 last season) who would leave the
   team he played for last season waits for Sam: lib/rosters.js keeps him
   where he was on the deal he was offered, and lib/trades.js queues the
   move. Kickers, punters and the six never do. */
function bigMove(league, lastSeason) {
  const star = (p) => p.ovr >= 85 || (p.ovr >= 80 && (lastSeason.get(p.id) || 0) >= 85);
  return (p, key) => star(p) && p.pos !== 'K' && p.pos !== 'P' && !p.ege && p.faSince === league.season &&
    Boolean(p.lastTeam && TEAMS[p.lastTeam]) && p.lastTeam !== key;
}

/* ---------------------------------------------------------- part one -- */

function startOffseason(league, rng) {
  if (league.phase !== 'offseason') { throw new Error('The season is not over (phase: ' + league.phase + ').'); }
  const report = { season: league.season + 1 };
  const entry = archive(league);
  report.champion = entry.champion;
  league.draftOrder = draftOrder(league);
  delete league.draftRounds;
  league.stats = {};
  league.players.forEach((p) => { delete p.injury; });

  /* A year older. */
  const lastSeason = new Map(league.players.filter((p) => p.status === 'active').map((p) => [p.id, p.ovr]));
  league.season += 1;
  const changes = [];
  league.players.forEach((p) => {
    if (p.status === 'retired') { return; }
    const age = ageOn(p.born, league.season);
    if (age !== null) { p.age = age; }
    if (p.status !== 'active' && p.status !== 'fa') { return; }
    const c = develop(p, rng, rng.gauss);
    if (c && (Math.abs(c.after - c.before) >= 5 || c.note)) { changes.push(c); }
  });
  report.scale = holdScale(league);
  syncSix(league);
  centreOn(league);
  report.bigChanges = changes.sort((a, b) => Math.abs(b.after - b.before) - Math.abs(a.after - a.before)).slice(0, 25);
  report.the99s = the99s(league);

  /* Retirements. Free agents nobody signed for a year retire too. */
  report.retired = [];
  league.players.forEach((p) => {
    if (p.ege || (p.status !== 'active' && p.status !== 'fa')) { return; }
    const stale = p.status === 'fa' && p.faSince && p.faSince < league.season - 1;
    if (stale || rng() < retireChance(p)) {
      if (p.ovr >= 80) { report.retired.push(p.name + ' (' + p.pos + ', ' + p.team + ', ' + p.age + ', ' + p.ovr + ')'); }
      p.status = 'retired';
      p.retired = league.season;
      p.team = null;
    }
  });
  /* Retired players keep only who they were, to keep the world file small. */
  league.players.forEach((p) => {
    if (p.status !== 'retired') { return; }
    ['skills', 'contract', 'injury', 'faSince', 'archetype', 'archetypeSet', 'durability', 'longevity', 'height', 'weight', 'pfr', 'otc']
      .forEach((k) => { delete p[k]; });
  });
  index(league);

  /* Contracts and free agency. */
  report.capCasualties = capCasualties(league).filter((c) => c.apy >= 8)
    .map((c) => c.player.name + ' (' + c.player.pos + ', ' + c.player.age + ', ' + c.player.ovr + ', $' + c.apy + 'M) by ' + nick(c.team));
  index(league);
  const re = reSign(league, rng);
  report.leftInFreeAgency = re.freed.filter((p) => p.ovr >= 80).map((p) => p.name + ' (' + p.pos + ', ' + p.ovr + ')');
  index(league);
  const held = [];
  const signed = freeAgency(league, rng, { reserve: 0.05 * capFor(league.season), hold: bigMove(league, lastSeason), held });
  report.signings = signed.filter((p) => p.ovr >= 78).map((p) => p.name + ' (' + p.pos + ', ' + p.ovr + ') to ' + p.team +
    ', $' + p.contract.apy + 'M through ' + p.contract.through);
  index(league);
  report.depth = fillDepth(league, rng, makeName).length;
  index(league);

  /* Ratings, modes, coaches and schemes. */
  const ratings = rateTeams(league, { rounds: 2, seed: 'offseason:' + league.season });
  report.schemes = modesAndSchemes(league, rng, ratings, entry.records);
  index(league);

  /* Pre-draft trades for Sam. */
  league.phase = 'draft';
  applyOfficial(league);
  report.moves = queueMoves(league, held, 'offseason');
  report.trades = propose(league, 'offseason', rng);
  return report;
}

/* ---------------------------------------------------------- part two -- */

function finishOffseason(league, rng, place) {
  if (league.phase !== 'draft') { throw new Error('Not draft time (phase: ' + league.phase + ').'); }
  const report = { season: league.season };
  report.expired = closeWindow(league, 'offseason');
  /* A hand-set order goes for every round, and a draft written by hand
     for the rounds it covers. */
  applyOfficial(league);
  const plan = planFor(league, league.season);
  report.written = plan ? plan.picks.length : 0;
  report.draft = runDraft(league, league.draftRounds || league.draftOrder, rng, place, plan);
  delete league.draftRounds;
  if (plan) { delete league.draftPlans[league.season]; }
  index(league);
  freeAgency(league, rng, { minScore: 0.05 });
  index(league);
  report.released = cutDown(league, rng).length;
  index(league);
  fillHoles(league, rng, makeName);
  index(league);
  league.players.forEach((p) => {
    if (p.status === 'active' && !p.team) { p.status = 'fa'; }
  });
  startSeason(league, rng);
  report.rosters = league.teams.map((t) => t.key + ' ' + onTeam(league, t.key).length).join(', ');
  return report;
}

module.exports = { startOffseason, finishOffseason, firstModes, the99s, fits, ageOn };
