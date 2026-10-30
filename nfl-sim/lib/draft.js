/* ==========================================================================
   EGE Football NFL sim — the draft
   Seven rounds in reverse order of the standings, with traded picks
   going to whoever owns them; never fewer than four full rounds, and the
   picks from those four stay on their teams through the cut to 53
   (lib/rosters.js trim).

   The classes are the real 2024, 2025 and 2026 drafts (data/prospects.json),
   each prospect graded by where he really went and given a ceiling from how
   good he really became; Paxon, Cooper and Isaac are in the 2024 class,
   rated from the website. The 2027 class is the real college players the
   fall 2026 mock drafts and big boards name, graded by their consensus
   (build/class-2027.js), with ESPN's college headshots. After 2027 the sim
   makes its own classes.

   Each team's board is the prospect's grade, his position's worth, how
   badly the team needs the position and how well he fits its schemes, with
   a little scouting noise so no two teams see a class the same way. Sam
   can put any of the six on a team by hand (place), and the website's own
   transfers for them are followed when they name an NFL team the sim
   knows.
   ========================================================================== */

'use strict';

const io = require('./io');
const { skillsFrom, archetypeOf, reRate, SKILLS } = require('./skills');
const { fitOf, schemeFor } = require('./schemes');
const { capFor, pickPoints, POSITION } = require('./value');
const { starterLevels, needAt, onTeam } = require('./rosters');
const { sixFromSite } = require('./ege');
const { TEAMS } = require('./teams');
const { fillPicks } = require('./picks');

/* How ready a rookie at each position is, against where he was picked
   (build/ratings.js uses the same numbers for the 2023 class). */
const ROOKIE_READY = { QB: -3, RB: 3, FB: 0, WR: 1, TE: -1, OT: -1, IOL: 0, EDGE: 0, DI: 0, LB: 0, CB: 0, S: 0, K: 4, P: 4 };
const FORTY = { QB: 4.8, RB: 4.52, WR: 4.48, TE: 4.7, OT: 5.2, IOL: 5.25, EDGE: 4.7, DI: 4.95, LB: 4.65, CB: 4.45, S: 4.52 };
const SPEED_SKILL = { QB: 'mobility', RB: 'speed', WR: 'speed', TE: 'speed', EDGE: 'speed', LB: 'speed', CB: 'speed', S: 'speed' };

const ROUNDS = 7;
/* The fewest full rounds a draft may have (Sam, 2026-10-26). */
const MIN_ROUNDS = 4;

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
  const all = io.data('prospects.json');
  return { list: all.classes[season] || null, ege: (all.ege && all.ege[season]) || [] };
}

/* A prospect as a player, rated from his grade. His ceiling is drawn for
   his draft slot; a real prospect's leans on how good he really became --
   most for the 2024 class (two real seasons to go on), less for 2025 (a
   rookie year, which undersells a ceiling), not at all for 2026. A class
   the sim made has its ceilings already. */
function ceilingOf(pr, season, drawn) {
  const seasons = pr.realPeak ? Math.max(0, 2026 - season) : 0;
  return typeof pr.ceiling === 'number' ? pr.ceiling :
    seasons >= 2 ? 0.65 * (pr.realPeak + 1) + 0.35 * ceilingAt(pr.grade) :
    seasons === 1 ? 0.4 * (pr.realPeak + 3) + 0.6 * drawn : drawn;
}

function toPlayer(pr, season, rng) {
  const age = pr.age || 22;
  const ovr = Math.round(clamp(pickOverall(pr.grade, pr.pos) + rng.gauss() * 2.5, 48, 86));
  const pot = ceilingOf(pr, season, ceilingAt(pr.grade) + rng.gauss() * CEILING_SD);
  const z = {};
  Object.keys(SKILLS[pr.pos] || {}).forEach((k) => { z[k] = rng.gauss() * 0.9; });
  const speedKey = SPEED_SKILL[pr.pos];
  if (speedKey && pr.forty) { z[speedKey] = clamp((FORTY[pr.pos] - pr.forty) / 0.08, -2.5, 2.5); }
  const skills = skillsFrom(pr.pos, ovr, z);
  return {
    id: pr.id, name: pr.name, pos: pr.pos, team: null, born: pr.born, age,
    height: pr.height, weight: pr.weight, college: pr.college, entry: season, espn: pr.espn || undefined,
    collegePhoto: pr.collegePhoto || undefined,
    ovr, pot: Math.round(clamp(pot, ovr, 97)),
    skills, archetype: archetypeOf(pr.pos, skills, ovr),
    longevity: Math.round(clamp(50 + rng.gauss() * 12, 15, 90)),
    durability: Math.round(clamp(72 + rng.gauss() * 10, 35, 95)),
    status: 'prospect', grade: pr.grade
  };
}

/* What a prospect is expected to come in as, before the draw: the player
   editor's starting numbers for a class not drafted yet. */
function expected(pr, season) {
  const ovr = Math.round(clamp(pickOverall(pr.grade, pr.pos), 48, 86));
  return { ovr, pot: Math.round(clamp(ceilingOf(pr, season, ceilingAt(pr.grade)), ovr, 97)) };
}

/* The pick a player of this overall goes at (pickOverall backwards). */
function gradeFor(ovr, pos) { return Math.round(clamp(Math.exp((77 + (ROOKIE_READY[pos] || 0) - ovr) / 2.6), 1, 257)); }

/* Overalls and ceilings Sam set by hand before the class was drafted
   (lib/edits.js). A new overall moves where he is graded too, so the
   teams see him the way Sam rates him. */
function applyEdits(league, prospects) {
  const edits = league.prospectEdits || {};
  prospects.forEach((p) => {
    const e = edits[p.id];
    if (!e) { return; }
    if (e.ovr) { reRate(p, e.ovr); p.grade = gradeFor(e.ovr, p.pos); }
    p.pot = Math.max(p.ovr, e.pot || p.pot);
    delete edits[p.id];
  });
  if (league.prospectEdits && !Object.keys(edits).length) { delete league.prospectEdits; }
}

/* The six from the website, as prospects: graded where a player of their
   site overall would go. */
function egeProspects(season, slugs) {
  if (!slugs.length) { return []; }
  const six = sixFromSite(season);
  return slugs.filter((s) => six[s]).map((s) => {
    const p = six[s].player;
    const grade = gradeFor(p.ovr, p.pos);
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

/* Every pick of a draft, in order: [{ n, round, slot, from, owner }].
   `order` is the first round's team order, used for every round, or an
   order for each round; `year` is the draft's, this season's if not given. */
function picksInOrder(league, order, year) {
  const draftYear = year || league.season;
  const out = [];
  for (let round = 1; round <= ROUNDS; round += 1) {
    (Array.isArray(order[0]) ? order[round - 1] : order).forEach((key, i) => {
      const pick = league.picks.find((p) => p.year === draftYear && p.round === round && p.from === key);
      if (!pick) { return; }
      out.push({ n: out.length + 1, round, slot: i + 1, from: key, owner: pick.owner, pick });
    });
  }
  return out;
}

/* ----------------------------------------------------------------- draft -- */

/* Runs the whole draft. `order` is the first round's team order, or one
   for each round; `place` is { slug: 'TEAM' or 'TEAM:round' } for the six;
   `plan` is a draft written by hand (lib/draft-plan.js), whose picks go
   exactly as written. */
/* Every team in every round's order: a team the order left out picks
   last in that round. */
function fullOrder(league, order) {
  const rounds = [];
  for (let r = 0; r < ROUNDS; r += 1) {
    const one = (Array.isArray(order[0]) ? order[r] || order[0] : order).slice();
    league.teams.forEach((t) => { if (one.indexOf(t.key) === -1) { one.push(t.key); } });
    rounds.push(one);
  }
  return rounds;
}

/* Every team's pick in every round of a draft is somewhere: a pick that is
   missing, and was not forfeited (an owner of null in
   data/draft-orders.json), goes back to its own team. Returns how many. */
function restorePicks(league, year) {
  const official = io.data('draft-orders.json')[year] || {};
  const forfeited = new Set((official.trades || []).filter((t) => !t.owner).map((t) => t.round + '-' + t.from));
  let added = 0;
  league.teams.forEach((t) => {
    for (let round = 1; round <= ROUNDS; round += 1) {
      if (forfeited.has(round + '-' + t.key)) { continue; }
      if (league.picks.some((p) => p.year === year && p.round === round && p.from === t.key)) { continue; }
      league.picks.push({ year, round, from: t.key, owner: t.key });
      added += 1;
    }
  });
  return added;
}

function runDraft(league, order, rng, place, plan) {
  place = place || {};
  const season = league.season;
  restorePicks(league, season);
  order = fullOrder(league, order);
  const real = realClass(season);
  const list = real.list || madeClass(season, rng);
  const prospects = list.map((pr) => toPlayer(pr, season, rng));
  applyEdits(league, prospects);
  egeProspects(season, real.ege).forEach((p) => {
    if ((league.egeArchetypes || {})[p.ege]) { p.archetype = league.egeArchetypes[p.ege]; }
    prospects.push(p);
    if (!place[p.ege] && p.siteTeam) { place[p.ege] = p.siteTeam; }
  });
  const written = {};
  (plan ? plan.picks : []).forEach((w) => {
    written[w.n] = w;
    if (w.ege) { delete place[w.ege]; }
  });
  const reserved = new Set((plan ? plan.picks : []).map((w) => w.id));
  const levels = starterLevels(league);
  const noise = new Map();
  league.teams.forEach((t) => prospects.forEach((p) => noise.set(t.key + p.id, 1 + rng.gauss() * 0.12)));
  const taken = new Set();
  const picks = picksInOrder(league, order);
  const results = [];
  picks.forEach((slot) => {
    const w = written[slot.n];
    const team = league.teams.find((t) => t.key === (w ? w.team : slot.owner));
    let choice = null;
    if (w) {
      choice = prospects.find((p) => p.id === w.id && !taken.has(p.id));
      if (!choice) { throw new Error('Pick ' + slot.n + ' of the uploaded draft: ' + w.name + ' is not in the ' + season + ' class.'); }
    }
    /* One of the six placed on this team goes with its first pick (in the
       round asked for, if one was). */
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
        if (taken.has(p.id) || reserved.has(p.id)) { return; }
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
    choice.draft = { year: season, round: slot.round, pick: slot.n, team: team.key };
    choice.contract = { through: season + 3, apy: rookiePay(slot.n, season) };
    delete choice.siteTeam;
    if (!league.byId.has(choice.id)) { league.players.push(choice); league.byId.set(choice.id, choice); }
    results.push({ n: slot.n, round: slot.round, team: team.key, from: slot.from, id: choice.id, name: choice.name,
                   pos: choice.pos, ovr: choice.ovr, pot: choice.pot, grade: choice.grade, ege: choice.ege || undefined });
  });
  for (let round = 1; round <= MIN_ROUNDS; round += 1) {
    if (results.filter((d) => d.round === round).length < league.teams.length - 4) {
      throw new Error('The ' + season + ' draft has only ' + results.filter((d) => d.round === round).length +
                      ' picks in round ' + round + '; every draft takes at least ' + MIN_ROUNDS + ' full rounds.');
    }
  }
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
  /* The year's picks are used; the year six out is added (lib/picks.js). */
  league.picks = league.picks.filter((p) => p.year !== season);
  fillPicks(league, season + 1);
  return results;
}

module.exports = { runDraft, toPlayer, madeClass, makeName, rookiePay, pickOverall, picksInOrder, realClass, expected,
                   restorePicks, ROUNDS, MIN_ROUNDS };
