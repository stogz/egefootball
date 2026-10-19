/* ==========================================================================
   EGE Football NFL sim — the draft
   Seven rounds in reverse order of the standings, with traded picks
   going to whoever owns them.

   The classes are the real 2024, 2025 and 2026 drafts (data/prospects.json),
   each prospect graded by where he really went and given a ceiling from how
   good he really became; Paxon, Cooper and Isaac are in the 2024 class,
   rated from the website. After 2026 the sim makes its own classes.

   Each team's board is the prospect's grade, his position's worth, how
   badly the team needs the position and how well he fits its schemes, with
   a little scouting noise so no two teams see a class the same way. Sam
   can put any of the six on a team by hand (place), and the website's own
   transfers for them are followed when they name an NFL team the sim
   knows.
   ========================================================================== */

'use strict';

const path = require('path');
const fs = require('fs');
const { skillsFrom, archetypeOf, SKILLS } = require('./skills');
const { fitOf, schemeFor } = require('./schemes');
const { capFor, pickPoints, POSITION } = require('./value');
const { starterLevels, needAt, onTeam } = require('./rosters');
const { sixFromSite } = require('./ege');
const { TEAMS } = require('./teams');

/* How ready a rookie at each position is, against where he was picked
   (build/ratings.js uses the same numbers for the 2023 class). */
const ROOKIE_READY = { QB: -3, RB: 3, FB: 0, WR: 1, TE: -1, OT: -1, IOL: 0, EDGE: 0, DI: 0, LB: 0, CB: 0, S: 0, K: 4, P: 4 };
const FORTY = { QB: 4.8, RB: 4.52, WR: 4.48, TE: 4.7, OT: 5.2, IOL: 5.25, EDGE: 4.7, DI: 4.95, LB: 4.65, CB: 4.45, S: 4.52 };
const SPEED_SKILL = { QB: 'mobility', RB: 'speed', WR: 'speed', TE: 'speed', EDGE: 'speed', LB: 'speed', CB: 'speed', S: 'speed' };

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function pickOverall(pick, pos) { return (pick ? 77 - 2.6 * Math.log(pick) : 57) + (ROOKIE_READY[pos] || 0); }

/* What a player taken at each pick turns into at his best: the average
   ceiling of the players taken there in the 2019-2022 drafts, as rated at
   the 2023 kickoff knowing how they really turned out, shaded down a
   point and a half (those ceilings are a best season, which flatters).
   About 6.5 points either way: top-ten picks bust and seventh-rounders
   become stars, at the rates real drafts have. That keeps the league's
   stars replaced: run for years, it holds about as many 80s and 90s as
   the real 2023 league had. */
const CEILING = [[1, 88.5], [5, 87.5], [21, 83.5], [48, 80], [82, 77], [125, 75.5], [175, 72.5], [230, 70.5], [262, 69.5]];
const CEILING_SD = 6.5;

function ceilingAt(pick) {
  if (pick <= CEILING[0][0]) { return CEILING[0][1]; }
  for (let i = 1; i < CEILING.length; i += 1) {
    if (pick <= CEILING[i][0]) {
      const [x0, y0] = CEILING[i - 1];
      const [x1, y1] = CEILING[i];
      return y0 + (y1 - y0) * (pick - x0) / (x1 - x0);
    }
  }
  return CEILING[CEILING.length - 1][1];
}

/* Rookie-scale pay, $M a year, by overall pick (2024 money). */
function rookiePay(pick, season) {
  return Math.round(Math.max(0.8, 9.5 * Math.pow(pick, -0.33)) * capFor(season) / capFor(2024) * 10) / 10;
}

/* --------------------------------------------------------------- classes -- */

function realClass(season) {
  const file = path.join(__dirname, '..', 'data', 'prospects.json');
  const all = JSON.parse(fs.readFileSync(file, 'utf8'));
  return { list: all.classes[season] || null, ege: (all.ege && all.ege[season]) || [] };
}

/* A prospect as a player, rated from his grade. His ceiling is drawn for
   his draft slot; a real prospect's leans on how good he really became --
   most for the 2024 class (two real seasons to go on), less for 2025 (a
   rookie year, which undersells a ceiling), not at all for 2026. A class
   the sim made has its ceilings already. */
function toPlayer(pr, season, rng) {
  const age = pr.age || 22;
  const ovr = Math.round(clamp(pickOverall(pr.grade, pr.pos) + rng.gauss() * 2.5, 48, 86));
  const drawn = ceilingAt(pr.grade) + rng.gauss() * CEILING_SD;
  const seasons = pr.realPeak ? Math.max(0, 2026 - season) : 0;
  const pot = typeof pr.ceiling === 'number' ? pr.ceiling :
    seasons >= 2 ? 0.65 * (pr.realPeak + 1) + 0.35 * ceilingAt(pr.grade) :
    seasons === 1 ? 0.4 * (pr.realPeak + 3) + 0.6 * drawn : drawn;
  const z = {};
  Object.keys(SKILLS[pr.pos] || {}).forEach((k) => { z[k] = rng.gauss() * 0.9; });
  const speedKey = SPEED_SKILL[pr.pos];
  if (speedKey && pr.forty) { z[speedKey] = clamp((FORTY[pr.pos] - pr.forty) / 0.08, -2.5, 2.5); }
  const skills = skillsFrom(pr.pos, ovr, z);
  return {
    id: pr.id, name: pr.name, pos: pr.pos, team: null, born: pr.born, age,
    height: pr.height, weight: pr.weight, college: pr.college, entry: season,
    ovr, pot: Math.round(clamp(pot, ovr, 97)),
    skills, archetype: archetypeOf(pr.pos, skills, ovr),
    longevity: Math.round(clamp(50 + rng.gauss() * 12, 15, 90)),
    durability: Math.round(clamp(72 + rng.gauss() * 10, 35, 95)),
    status: 'prospect', grade: pr.grade
  };
}

/* The six from the website, as prospects: graded where a player of their
   site overall would go. */
function egeProspects(season, slugs) {
  if (!slugs.length) { return []; }
  const six = sixFromSite(season);
  return slugs.filter((s) => six[s]).map((s) => {
    const p = six[s].player;
    const grade = Math.round(clamp(Math.exp((77 + (ROOKIE_READY[p.pos] || 0) - p.ovr) / 2.6), 1, 257));
    let siteTeam = null;
    Object.keys(TEAMS).forEach((k) => { if (TEAMS[k].site && TEAMS[k].site === six[s].siteTeam) { siteTeam = k; } });
    return Object.assign({}, p, { age: season - 2001, entry: season, status: 'prospect', grade, siteTeam });
  });
}

/* ---------------------------------------------------------- made classes -- */

const FIRST = ['James', 'Marcus', 'Tyler', 'Jalen', 'Caleb', 'Darius', 'Trey', 'Isaiah', 'Brandon', 'Jordan', 'Malik', 'Elijah',
  'Cameron', 'Xavier', 'Devin', 'Andre', 'Josh', 'Chris', 'Kendall', 'Jaylen', 'Mason', 'Dylan', 'Bryce', 'Aiden', 'Zion',
  'Quinton', 'Tre', 'DeShawn', 'Kobe', 'Rashad', 'Nate', 'Luke', 'Cole', 'Drew', 'Garrett', 'Hunter', 'Kyle', 'Logan', 'Owen',
  'Ryan', 'Sean', 'Travis', 'Wyatt', 'Jaden', 'Jamari', 'Keon', 'Omari', 'Tavion', 'Javon', 'Micah', 'Noah', 'Eli', 'Brock',
  'Carson', 'Dominic', 'Emmanuel', 'Gavin', 'Jace', 'Khalil', 'Lamar', 'Marquise', 'Desmond', 'Terrance', 'Vincent'];
const LAST = ['Johnson', 'Williams', 'Brown', 'Jackson', 'Davis', 'Harris', 'Robinson', 'Walker', 'Thomas', 'Moore', 'Carter',
  'Mitchell', 'Washington', 'Coleman', 'Henderson', 'Simmons', 'Bryant', 'Foster', 'Hayes', 'Griffin', 'Wallace', 'Tucker',
  'Porter', 'Hunter', 'Hicks', 'Holmes', 'Banks', 'Reed', 'Bell', 'Brooks', 'Sanders', 'Price', 'Bennett', 'Wood', 'Barnes',
  'Ross', 'Jenkins', 'Perry', 'Powell', 'Long', 'Patterson', 'Graham', 'Sullivan', 'Fisher', 'Ellis', 'Hamilton', 'Gibson',
  'McDonald', 'Cruz', 'Marshall', 'Owens', 'Harrison', 'Fletcher', 'Lawson', 'Dixon', 'Hale', 'Riley', 'Stokes', 'Burke',
  'Spencer', 'Tate', 'Vaughn', 'Whitfield', 'Quarles', 'Kirkland', 'Okafor', 'Adebayo', 'Fuimaono', 'Tuiasosopo'];
const COLLEGES = ['Alabama', 'Georgia', 'Ohio State', 'Michigan', 'LSU', 'Texas', 'Oregon', 'Clemson', 'Penn State', 'USC',
  'Notre Dame', 'Florida State', 'Miami (FL)', 'Oklahoma', 'Tennessee', 'Washington', 'Iowa', 'Wisconsin', 'Utah', 'Auburn',
  'Texas A&M', 'Ole Miss', 'Kentucky', 'Missouri', 'Arizona State', 'Boise State', 'TCU', 'Kansas State', 'North Carolina',
  'UCLA', 'Florida', 'South Carolina', 'Minnesota', 'Pittsburgh', 'Louisville', 'Toledo', 'Tulane', 'Houston', 'Baylor'];
/* Roughly how a real class splits by position. */
const MIX = [['WR', 32], ['CB', 30], ['EDGE', 24], ['OT', 20], ['IOL', 22], ['DI', 22], ['LB', 22], ['S', 20], ['RB', 18],
  ['TE', 15], ['QB', 12], ['K', 3], ['P', 3], ['FB', 1]];

function makeName(rng) {
  return FIRST[Math.floor(rng() * FIRST.length)] + ' ' + LAST[Math.floor(rng() * LAST.length)];
}

function madeClass(season, rng) {
  const out = [];
  let grade = 0;
  const bag = [];
  MIX.forEach(([pos, n]) => { for (let i = 0; i < n; i += 1) { bag.push(pos); } });
  while (out.length < 257) {
    grade += 1;
    /* Quarterbacks and pass rushers go early; specialists late. */
    let pos = bag[Math.floor(rng() * bag.length)];
    if ((pos === 'K' || pos === 'P') && grade < 120) { pos = 'S'; }
    if (pos === 'RB' && grade < 15 && rng() < 0.6) { pos = 'EDGE'; }
    const age = 21 + Math.floor(rng() * 3);
    out.push({
      id: 'sim:' + season + ':d' + grade, name: makeName(rng), pos, college: COLLEGES[Math.floor(rng() * COLLEGES.length)],
      born: (season - age) + '-0' + (1 + Math.floor(rng() * 9)) + '-15', age,
      height: null, weight: null, forty: null, grade, ceiling: clamp(ceilingAt(grade) + rng.gauss() * CEILING_SD, 55, 97)
    });
  }
  return out;
}

/* ---------------------------------------------------------------- order -- */

/* Every pick of this year's draft, in order: [{ n, round, slot, from, owner }]. */
function picksInOrder(league, order) {
  const out = [];
  for (let round = 1; round <= 7; round += 1) {
    order.forEach((key, i) => {
      const pick = league.picks.find((p) => p.year === league.season && p.round === round && p.from === key);
      if (!pick) { return; }
      out.push({ n: out.length + 1, round, slot: i + 1, from: key, owner: pick.owner, pick });
    });
  }
  return out;
}

/* ----------------------------------------------------------------- draft -- */

/* Runs the whole draft. `order` is the first round's team order;
   `place` is { slug: 'TEAM' or 'TEAM:round' } for the six. */
function runDraft(league, order, rng, place) {
  place = place || {};
  const season = league.season;
  const real = realClass(season);
  const list = real.list || madeClass(season, rng);
  const prospects = list.map((pr) => toPlayer(pr, season, rng));
  egeProspects(season, real.ege).forEach((p) => {
    prospects.push(p);
    if (!place[p.ege] && p.siteTeam) { place[p.ege] = p.siteTeam; }
  });
  const levels = starterLevels(league);
  const noise = new Map();
  league.teams.forEach((t) => prospects.forEach((p) => noise.set(t.key + p.id, 1 + rng.gauss() * 0.12)));
  const taken = new Set();
  const picks = picksInOrder(league, order);
  const results = [];
  picks.forEach((slot) => {
    const team = league.teams.find((t) => t.key === slot.owner);
    /* One of the six placed on this team goes with its first pick (in the
       round asked for, if one was). */
    let choice = null;
    Object.keys(place).forEach((slug) => {
      const [key, round] = String(place[slug]).split(':');
      const p = prospects.find((x) => x.ege === slug);
      if (choice || !p || taken.has(p.id) || key !== team.key) { return; }
      if (round && Number(round) !== slot.round) { return; }
      choice = p;
    });
    if (!choice) {
      const roster = onTeam(league, team.key);
      let best = -1;
      prospects.forEach((p) => {
        if (taken.has(p.id)) { return; }
        if (p.ege && place[p.ege]) { return; }
        const need = needAt(league, team.key, p.pos, levels, roster);
        const fit = fitOf(p, schemeFor(team, p.pos));
        const score = pickPoints(p.grade) * Math.sqrt(POSITION[p.pos] || 0.8) * (1 + 0.45 * need) * (1 + 0.02 * fit) *
                      noise.get(team.key + p.id);
        if (score > best) { best = score; choice = p; }
      });
    }
    taken.add(choice.id);
    choice.team = team.key;
    choice.status = 'active';
    choice.draft = { year: season, round: slot.round, pick: slot.n };
    choice.contract = { through: season + 3, apy: rookiePay(slot.n, season) };
    delete choice.siteTeam;
    if (!league.byId.has(choice.id)) { league.players.push(choice); league.byId.set(choice.id, choice); }
    results.push({ n: slot.n, round: slot.round, team: team.key, from: slot.from, id: choice.id, name: choice.name,
                   pos: choice.pos, ovr: choice.ovr, pot: choice.pot, grade: choice.grade, ege: choice.ege || undefined });
  });
  /* One of the six placed on a team with no pick left where asked (it
     traded the pick away) signs with it after the draft; one nobody took
     is a free agent like anybody else. */
  prospects.filter((p) => p.ege && !taken.has(p.id)).forEach((p) => {
    const key = place[p.ege] ? String(place[p.ege]).split(':')[0] : null;
    taken.add(p.id);
    p.draft = null;
    delete p.siteTeam;
    if (key && TEAMS[key]) {
      p.team = key;
      p.status = 'active';
      p.contract = { through: season + 2, apy: rookiePay(260, season) };
    } else {
      p.team = 'FA';
      p.status = 'fa';
      p.faSince = season;
    }
    if (!league.byId.has(p.id)) { league.players.push(p); league.byId.set(p.id, p); }
    results.push({ n: null, round: null, team: p.team, id: p.id, name: p.name, pos: p.pos, ovr: p.ovr, pot: p.pot, ege: p.ege,
                   undrafted: true });
  });
  /* The best of the rest go to camps as undrafted free agents. */
  prospects.filter((p) => !taken.has(p.id) && !p.ege).slice(0, 60).forEach((p) => {
    p.team = 'FA';
    p.status = 'fa';
    p.faSince = season;
    p.draft = null;
    p.ovr = Math.max(48, p.ovr - 2);
    if (!league.byId.has(p.id)) { league.players.push(p); league.byId.set(p.id, p); }
  });
  /* The year's picks are used; the year three out is added. */
  league.picks = league.picks.filter((p) => p.year !== season);
  const future = season + 3;
  if (!league.picks.some((p) => p.year === future)) {
    league.teams.forEach((t) => { for (let r = 1; r <= 7; r += 1) { league.picks.push({ year: future, round: r, from: t.key, owner: t.key }); } });
  }
  return results;
}

module.exports = { runDraft, toPlayer, madeClass, makeName, rookiePay, pickOverall, picksInOrder };
