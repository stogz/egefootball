/* ==========================================================================
   EGE Football NFL sim — the league at kickoff of 2023
   Writes the files the sim starts from:

     nfl-sim/data/league-2023.json   every team and player, Week 1 of 2023
     nfl-sim/data/prospects.json     the real 2024, 2025 and 2026 draft classes
     nfl-sim/data/schedules.json     the real 2023-2026 regular seasons
     nfl-sim/data/benchmarks-2023.json  what really happened in 2023, to
                                        check the sim against

       node nfl-sim/build/build-league.js

   Who is on which team is each club's real Week 1 roster (its 53 plus
   anybody on injured reserve), from nflverse, with two differences that
   are this world's, not the real one's:

   - the 2023 draft went the way the EGE mock draft says (the Claude Doc
     "2023 NFL Combine and Mock Draft"): Jaykeb Stewart went second to
     Houston, C.J. Stroud fourth to Indianapolis, Bijan Robinson twelfth to
     Detroit, Andrew Parr eighteenth to Detroit, Sam Stogsdill 52nd to
     Seattle, and so on. Every rookie named in it is on the team that took
     him there; any other rookie is where he really went.
   - Sam, Andrew and Jaykeb are on their teams; their numbers are read from
     the website every time the league loads (lib/ege.js).

   How each player is rated is in build/ratings.js and build/skills.js.
   Potential and longevity look forward: a young player's ceiling leans on
   how good he really became in 2023-2025, and an older player's longevity
   on whether he really held up. The sim still rolls its own dice on top --
   a player can beat his ceiling or fall short of it -- but a Puka Nacua or
   a Brock Purdy has the ceiling he turned out to have.

   Downloads from nflverse are kept outside the repository (see
   build/nflverse.js).
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const { read, num } = require('./nflverse');
const { loadPeople, loadEvidence, loadCombine } = require('./evidence');
const { seasonScores, rankToOverall, pickOverall, meanSd, STARTERS } = require('./ratings');
const { pooled, assignSkills } = require('./skills');
const { teamSchemes } = require('./schemes');
const { archetypeOf } = require('../lib/skills');
const { TEAMS, KEYS, keyForName } = require('../lib/teams');
const { sixFromSite } = require('../lib/ege');
const { HAND_SET, POSITION_FIX } = require('./hand-set');
const { buildBenchmarks } = require('./benchmarks');
const { writeJson } = require('./write');

const OUT = path.join(__dirname, '..', 'data');
const SEASON = 2023;

/* A seeded random number generator, so the build comes out the same every
   time it is run on the same data. */
function rngFrom(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = rngFrom(2023);
function gauss() {
  const u = Math.max(rng(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

/* PFF's position first (it tells an edge rusher from an off-ball
   linebacker, which a 3-4 depth chart does not), then the depth chart's. */
const FROM_PFF = { QB: 'QB', HB: 'RB', FB: 'FB', WR: 'WR', TE: 'TE', T: 'OT', G: 'IOL', C: 'IOL',
                   ED: 'EDGE', DI: 'DI', LB: 'LB', CB: 'CB', S: 'S', K: 'K', P: 'P' };
const FROM_DEPTH = { QB: 'QB', RB: 'RB', HB: 'RB', FB: 'FB', WR: 'WR', TE: 'TE', T: 'OT', OT: 'OT', G: 'IOL',
                     C: 'IOL', OL: 'IOL', DE: 'EDGE', OLB: 'EDGE', DT: 'DI', NT: 'DI', DL: 'DI', ILB: 'LB',
                     MLB: 'LB', LB: 'LB', CB: 'CB', DB: 'CB', FS: 'S', SS: 'S', S: 'S', SAF: 'S', K: 'K', P: 'P' };

function simPos(pff, depth, position) {
  return FROM_PFF[pff] || FROM_DEPTH[depth] || FROM_DEPTH[position] || null;
}

function norm(name) {
  return String(name || '').toLowerCase().replace(/\b(jr|sr|ii|iii|iv|v)\b\.?/g, '')
    .replace(/[^a-z]/g, '');
}

function ageOn(born, year) {
  if (!born) { return null; }
  const b = new Date(born + 'T00:00:00Z');
  const ref = new Date(Date.UTC(year, 8, 1));
  return Math.floor((ref - b) / (365.25 * 86400000));
}

function inches(text) {
  const m = /^(\d+)-(\d+)$/.exec(text || '') || /^(\d+)'(\d+)"?$/.exec(text || '');
  if (m) { return Number(m[1]) * 12 + Number(m[2]); }
  return num(text);
}

/* The EGE mock draft (Rounds 1 and 2, then the later picks it named), as
   [pick, team, player]. The six are not in here; they are added from the
   site. */
const MOCK_2023 = [
  [1, 'CAR', 'Bryce Young'], [3, 'HOU', 'Will Anderson'], [4, 'IND', 'C.J. Stroud'],
  [5, 'SEA', 'Devon Witherspoon'], [6, 'ARI', 'Paris Johnson'], [7, 'LV', 'Anthony Richardson'],
  [8, 'ATL', 'Tyree Wilson'], [9, 'PHI', 'Jalen Carter'], [10, 'CHI', 'Darnell Wright'],
  [11, 'TEN', 'Peter Skoronski'], [12, 'DET', 'Bijan Robinson'], [13, 'GB', 'Lukas Van Ness'],
  [14, 'PIT', 'Broderick Jones'], [15, 'NYJ', 'Will McDonald'], [16, 'WAS', 'Emmanuel Forbes'],
  [17, 'NE', 'Christian Gonzalez'], [19, 'TB', 'Calijah Kancey'], [20, 'SEA', 'Jaxon Smith-Njigba'],
  [21, 'LAC', 'Quentin Johnston'], [22, 'BAL', 'Zay Flowers'], [23, 'MIN', 'Jordan Addison'],
  [24, 'NYG', 'Deonte Banks'], [25, 'BUF', 'Jack Campbell'], [26, 'DAL', 'Jahmyr Gibbs'],
  [27, 'JAX', 'Anton Harrison'], [28, 'CIN', 'Dalton Kincaid'], [29, 'NO', 'Myles Murphy'],
  [30, 'PHI', 'Nolan Smith'], [31, 'KC', 'Felix Anudike-Uzomah'], [32, 'PIT', 'Joey Porter'],
  [33, 'TEN', 'Will Levis'], [34, 'DET', 'Brian Branch'], [35, 'LV', 'Michael Mayer'],
  [36, 'LA', 'Steve Avila'], [37, 'SEA', 'Mazi Smith'], [38, 'ATL', 'Matthew Bergeron'],
  [39, 'CAR', 'Jonathan Mingo'], [40, 'NO', 'Bryan Bresee'], [41, 'ARI', 'BJ Ojulari'],
  [42, 'GB', 'Sam LaPorta'], [43, 'NYJ', 'Joe Tippmann'], [44, 'IND', 'JuJu Brents'],
  [45, 'DET', 'Drew Sanders'], [46, 'NE', 'Keion White'], [47, 'WAS', 'Quan Martin'],
  [48, 'TB', 'Cody Mauch'], [49, 'PIT', 'Keeanu Benton'], [50, 'GB', 'Jayden Reed'],
  [51, 'MIA', 'Cam Smith'], [53, 'CHI', 'Gervon Dexter'], [54, 'LAC', 'Derick Hall'],
  [55, 'KC', 'Rashee Rice'], [56, 'CHI', 'Tyrique Stevenson'], [57, 'NYG', 'John Michael Schmitz'],
  [58, 'DAL', 'Luke Musgrave'], [59, 'BUF', "O'Cyrus Torrence"], [60, 'CIN', 'DJ Turner'],
  [61, 'JAX', 'Isaiah Foskey'], [62, 'HOU', 'Juice Scruggs'], [63, 'DEN', 'Marvin Mims'],
  [68, 'DET', 'Hendon Hooker'], [69, 'HOU', 'Tank Dell'], [71, 'NO', 'Zach Charbonnet'],
  [73, 'NYG', 'Jalin Hyatt'], [79, 'IND', 'Josh Downs'], [81, 'TEN', 'Tyjae Spears'],
  [84, 'MIA', "De'Von Achane"], [86, 'BAL', 'Trenton Simpson'], [93, 'PIT', 'Darnell Washington'],
  [99, 'SF', 'Jake Moody'], [111, 'CLE', 'Dawand Jones'], [115, 'CHI', 'Roschon Johnson'],
  [163, 'CIN', 'Chase Brown'], [177, 'LA', 'Puka Nacua'], [191, 'TB', 'Trey Palmer']
];

/* The mock's names where nflverse's differ. */
const ALSO_KNOWN_AS = { 'Tank Dell': 'Nathaniel Dell', 'JuJu Brents': 'Julius Brents' };

/* How much the market's opinion counts in a veteran's 2023 score. Linemen
   and kickers have little else to go on. */
const MARKET_WEIGHT = { OT: 0.5, IOL: 0.5, K: 0.2, P: 0.2, QB: 0.3 };

/* How much a young player is expected to improve from here, by his age
   at the start of the season, before his ceiling is known. */
const EXPECTED_GROWTH = { 20: 10, 21: 9, 22: 8, 23: 6.5, 24: 5, 25: 3.5, 26: 2, 27: 1 };

/* Where each position's decline starts, for reading an older player's
   real 2023-2025 seasons against what age alone would have done
   (lib/aging.js has the curves the sim plays with). */
const { expectedChange } = require('../lib/aging');

function main() {
  const { people, byPfr } = loadPeople();
  const combine = loadCombine();
  const evidence = loadEvidence([2020, 2021, 2022, 2023, 2024, 2025], byPfr);

  /* Week 1 of 2023: the 53, the inactives and injured reserve. */
  const week1 = read('roster_weekly_2023.csv', (r) => r.week === '1' && r.game_type === 'REG' &&
    ['ACT', 'INA', 'RES'].indexOf(r.status) !== -1);

  const players = new Map();
  week1.forEach((r) => {
    if (!r.gsis_id || players.has(r.gsis_id)) { return; }
    const person = people.get(r.gsis_id) || {};
    const pos = POSITION_FIX[r.full_name] || simPos(person.pff_position, r.depth_chart_position, r.position);
    if (!pos) { return; }
    players.set(r.gsis_id, {
      id: r.gsis_id,
      name: r.full_name,
      pos,
      team: r.team,
      born: r.birth_date || person.birth_date || null,
      height: num(r.height) || inches(person.height),
      weight: num(r.weight) || num(person.weight),
      college: r.college || person.college_name || null,
      entry: num(r.entry_year) || num(person.rookie_season),
      draft: { year: num(person.draft_year), round: num(person.draft_round), pick: num(r.draft_number) || num(person.draft_pick) },
      status: r.status === 'RES' ? 'injured' : 'active',
      pfr: person.pfr_id || null,
      otc: person.otc_id || null
    });
  });

  /* The EGE draft. A rookie who was not on a Week 1 roster (Quan Martin
     started 2023 hurt) comes from the season's roster instead. */
  const rookies = new Map();
  players.forEach((p) => { if (p.entry === 2023) { rookies.set(norm(p.name), p); } });
  const seasonRoster = new Map();
  read('roster_2023.csv').forEach((r) => { if (r.gsis_id) { seasonRoster.set(norm(r.full_name), r); } });
  MOCK_2023.forEach(([pick, team, name]) => {
    const known = ALSO_KNOWN_AS[name] || name;
    let p = rookies.get(norm(known));
    const r = !p && seasonRoster.get(norm(known));
    if (r) {
      const person = people.get(r.gsis_id) || {};
      p = {
        id: r.gsis_id, name: r.full_name,
        pos: simPos(person.pff_position, r.depth_chart_position, r.position),
        born: r.birth_date || person.birth_date || null, height: num(r.height), weight: num(r.weight),
        college: r.college || null, entry: 2023, draft: {}, status: 'injured',
        pfr: person.pfr_id || null, otc: person.otc_id || null
      };
      players.set(p.id, p);
    }
    if (!p) { process.stderr.write('Mock pick not on a 2023 roster: ' + name + '\n'); return; }
    p.team = team;
    p.draft = { year: 2023, round: pick <= 31 ? 1 : pick <= 63 ? 2 : pick <= 102 ? 3 : pick <= 135 ? 4 : pick <= 177 ? 5 : 6, pick };
  });

  /* Judge every season at the position he plays now. */
  const posNow = (gsis) => {
    if (players.has(gsis)) { return players.get(gsis).pos; }
    const person = people.get(gsis);
    return person ? simPos(person.pff_position, null, person.position) : null;
  };
  const scores = {};
  [2020, 2021, 2022, 2023, 2024, 2025].forEach((y) => { scores[y] = seasonScores(evidence[y], posNow); });

  /* Contracts: the latest deal signed through 2022, by OverTheCap id. */
  const contracts = new Map();
  read('historical_contracts.csv.gz').forEach((c) => {
    const signed = num(c.year_signed);
    if (!c.otc_id || !signed || signed > 2022) { return; }
    const was = contracts.get(c.otc_id);
    if (!was || signed > was.signed) {
      contracts.set(c.otc_id, {
        signed, years: num(c.years) || 1, apy: num(c.apy) || 0, capPct: num(c.apy_cap_pct) || 0,
        rookie: num(c.draft_year) === signed
      });
    }
  });

  /* The 2023 score: 2022 and 2021 (2020 for a lost season), the market,
     the draft. Each part is a z-score within the position, so they add. */
  const list = Array.from(players.values());
  const byPos = {};
  list.forEach((p) => { (byPos[p.pos] = byPos[p.pos] || []).push(p); });
  Object.keys(byPos).forEach((pos) => {
    const group = byPos[pos];
    const market = group.map((p) => {
      const c = p.otc && contracts.get(p.otc);
      return c && !c.rookie && c.capPct > 0 && c.signed + c.years - 1 >= 2022 ? Math.log(c.capPct) : null;
    });
    const ms = meanSd(market.filter(Number.isFinite));
    const pedigree = group.map((p) => -Math.log(p.draft.pick || 300));
    const ps = meanSd(pedigree);
    group.forEach((p, i) => {
      const s22 = scores[2022].get(p.id);
      const s21 = scores[2021].get(p.id);
      const s20 = scores[2020].get(p.id);
      const parts = [];
      if (s22) { parts.push([s22.score, 0.65]); }
      if (s21) { parts.push([s21.score, 0.35]); }
      if (!s22 && s20) { parts.push([s20.score, 0.3]); }
      let score = parts.length
        ? parts.reduce((a, b) => a + b[0] * b[1], 0) / parts.reduce((a, b) => a + b[1], 0)
        : -1.6;
      /* One season of evidence is pulled a little toward the bench. */
      if (parts.length === 1) { score = score * 0.85 - 0.1; }
      if (Number.isFinite(market[i])) {
        const w = MARKET_WEIGHT[pos] || 0.25;
        score = (1 - w) * score + w * (market[i] - ms.mean) / ms.sd;
      }
      const years = SEASON - (p.entry || SEASON);
      if (years <= 3 && p.entry !== SEASON) {
        score = (1 - 0.12 * (4 - years) / 3) * score + 0.12 * (4 - years) / 3 * (pedigree[i] - ps.mean) / ps.sd;
      }
      p._score = score;
    });
  });

  /* Score to overall, veterans by rank; rookies from where they went. */
  Object.keys(byPos).forEach((pos) => {
    const vets = byPos[pos].filter((p) => p.entry !== SEASON).map((p) => ({ id: p.id, score: p._score }));
    const overall = rankToOverall(vets, pos);
    byPos[pos].forEach((p) => {
      if (p.entry === SEASON) {
        p.ovr = pickOverall(p.draft.pick, pos) + gauss() * 2;
      } else {
        p.ovr = overall.get(p.id);
        /* A young player who has barely played still has his draft slot. */
        const years = SEASON - (p.entry || SEASON);
        if (years <= 2 && p.draft.pick) {
          p.ovr = Math.max(p.ovr, 0.55 * p.ovr + 0.45 * (pickOverall(p.draft.pick, pos) + 2 * years));
        }
      }
    });
  });

  /* What really happened next: each season 2023-2025 rated the same way,
     for ceilings and longevity. */
  const realRating = {};
  [2023, 2024, 2025].forEach((y) => {
    const rated = new Map();
    const groups = {};
    scores[y].forEach((s, gsis) => { (groups[s.pos] = groups[s.pos] || []).push({ id: gsis, score: s.score }); });
    Object.keys(groups).forEach((pos) => {
      rankToOverall(groups[pos], pos).forEach((v, id) => rated.set(id, v));
    });
    realRating[y] = rated;
  });
  const meaningful = (gsis, y) => {
    const e = evidence[y].get(gsis);
    if (!e) { return false; }
    return (e.offSnaps || 0) + (e.defSnaps || 0) >= 250 || (e.fgAtt || 0) >= 10 || (e.ptAtt || 0) >= 25;
  };

  list.forEach((p) => {
    applyHandSet(p);
    p.ovr = clamp(Math.round(p.ovr), 50, 99);
    p.age = ageOn(p.born, SEASON);
    const future = [2023, 2024, 2025].filter((y) => meaningful(p.id, y)).map((y) => [y, realRating[y].get(p.id)]);
    p.pot = potentialOf(p, future);
    p.longevity = longevityOf(p, future);
    p.durability = durabilityOf(p, evidence);
  });

  /* Skills, from pooled 2021-2022 style plus the combine and size. A
     player with no 2021-2022 to speak of (every rookie) is read off how he
     really played in 2023-2024 instead: Puka Nacua catches like Puka
     Nacua from his first snap. */
  list.forEach((p) => {
    const c = (p.pfr && combine.get(p.pfr)) || {};
    const before = [evidence[2021].get(p.id), evidence[2022].get(p.id)];
    const snaps = before.reduce((a, e) => a + (e ? (e.offSnaps || 0) + (e.defSnaps || 0) : 0), 0);
    p.e = pooled(snaps >= 150 ? before : [evidence[2023].get(p.id), evidence[2024].get(p.id)]);
    p.body = { forty: c.forty, height: p.height, weight: p.weight };
  });
  assignSkills(list, rng);
  list.forEach((p) => { p.archetype = archetypeOf(p.pos, p.skills, p.ovr); });

  /* Contracts in force for 2023. A deal that ran out before 2023 means a
     2023 signing nflverse's table does not have yet: one to three years,
     at what his overall is worth. */
  list.forEach((p) => {
    const c = p.otc && contracts.get(p.otc);
    if (p.entry === SEASON) {
      p.contract = { through: SEASON + 3, apy: rookieScale(p.draft.pick) };
    } else if (c && c.signed + c.years - 1 >= SEASON) {
      p.contract = { through: c.signed + c.years - 1, apy: round1(c.apy / 1e6) };
    } else {
      p.contract = { through: SEASON + Math.floor(rng() * 3), apy: null };
    }
  });

  /* The six, from the site. */
  const six = sixFromSite(SEASON);
  const siteToKey = {};
  KEYS.forEach((key) => { if (TEAMS[key].site) { siteToKey[TEAMS[key].site] = key; } });
  const egePlayers = [];
  const egeProspects = [];
  Object.keys(six).forEach((slug) => {
    const { player, siteTeam } = six[slug];
    if (siteTeam) {
      const team = siteToKey[siteTeam];
      const pick = { 'jaykeb-stewart': 2, 'andrew-parr': 18, 'sam-stogsdill': 52 }[slug] || null;
      egePlayers.push(Object.assign(player, {
        team, age: ageOn(player.born, SEASON), entry: SEASON, status: 'active',
        draft: { year: SEASON, round: pick && pick <= 31 ? 1 : 2, pick },
        contract: { through: SEASON + 3, apy: rookieScale(pick) },
        archetype: archetypeOf(player.pos, player.skills, player.ovr)
      }));
    } else {
      egeProspects.push(slug);
    }
  });

  /* Schemes. */
  const positionOf = (gsis) => {
    const person = people.get(gsis);
    if (!person) { return null; }
    const pos = simPos(person.pff_position, null, person.position);
    return pos === 'FB' ? 'RB' : pos;
  };
  const schemes = teamSchemes(positionOf);

  const teams = KEYS.map((key) => Object.assign({ key }, TEAMS[key], {
    offense: schemes[key].offense,
    defense: schemes[key].defense,
    offenseTendencies: schemes[key].offenseTendencies,
    defenseTendencies: schemes[key].defenseTendencies,
    mode: 'compete',
    schemeSince: SEASON
  }));

  const out = list.concat(egePlayers).map(cleanPlayer);
  out.sort((a, b) => (a.team < b.team ? -1 : a.team > b.team ? 1 : b.ovr - a.ovr));

  /* Each team's own picks, three drafts out. */
  const picks = [];
  [2024, 2025, 2026].forEach((year) => {
    KEYS.forEach((team) => {
      for (let round = 1; round <= 7; round += 1) { picks.push({ year, round, from: team, owner: team }); }
    });
  });

  const league = {
    season: SEASON,
    phase: 'preseason',
    built: new Date().toISOString().slice(0, 10),
    source: 'nflverse Week 1 2023 rosters; ratings from 2020-2022 seasons (build/build-league.js)',
    teams,
    players: out,
    picks
  };
  fs.mkdirSync(OUT, { recursive: true });
  writeJson('league-2023.json', league);
  writeJson('prospects.json', buildProspects(people, combine, realRating, meaningful, evidence, egeProspects));
  writeJson('schedules.json', buildSchedules());
  writeJson('benchmarks-2023.json', buildBenchmarks());
  report(out, teams);
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function round1(v) { return Math.round(v * 10) / 10; }

/* Rookie-scale pay, in millions a year: about $9.5M for the first pick,
   $3M at the end of the first round, under $1M from the fourth round on. */
function rookieScale(pick) {
  if (!pick) { return 0.8; }
  return round1(Math.max(0.8, 9.5 * Math.pow(pick, -0.33)));
}

/* Hand-set overalls (build/hand-set.js) for the handful the formula gets
   wrong -- mostly stars a lost or injured 2022 undersells, and the 99s. */
function applyHandSet(p) {
  const set = HAND_SET[p.name];
  if (set && (!set.pos || set.pos === p.pos)) {
    if (typeof set.ovr === 'number') { p.ovr = set.ovr; }
    p._handPot = set.pot;
  }
}

/* A young player's ceiling: what age and draft slot say he should grow
   into, blended with how good he really got in 2023-2025 (the real seasons
   count for more). Never below where he is now. A player 28 or older has
   no growth left in him; his ceiling is his overall. */
function potentialOf(p, future) {
  if (typeof p._handPot === 'number') { return Math.max(p.ovr, p._handPot); }
  const age = p.age || 25;
  if (age >= 28) { return p.ovr; }
  const growth = EXPECTED_GROWTH[age] !== undefined ? EXPECTED_GROWTH[age] : (age < 20 ? 10 : 0);
  const round = p.draft && p.draft.round;
  const bonus = !p.draft || !p.draft.pick ? -1 : round === 1 ? (p.draft.pick <= 10 ? 4 : 3) : round === 2 ? 1.5 : round === 3 ? 0.5 : 0;
  const prior = p.ovr + growth + bonus;
  let pot;
  if (future.length) {
    const peak = Math.max(...future.map((f) => f[1]));
    pot = 0.65 * (peak + 1) + 0.35 * prior;
  } else {
    pot = p.ovr + growth * 0.4;
  }
  pot += gauss() * 1.5;
  /* 98s and 99s are for players who are already there; nobody is built
     with one waiting for him. */
  return clamp(Math.round(Math.max(pot, p.ovr)), p.ovr, Math.max(p.ovr, 97));
}

/* How well a player holds off age, 1-99 with 50 the norm. For a player 27
   or older, his real 2023-2025 seasons against what his age alone would
   have done: a Derrick Henry who stayed great has a high one, a back who
   fell off a cliff a low one. Everybody else is 50, give or take. */
function longevityOf(p, future) {
  const age = p.age || 25;
  if (age < 27) { return clamp(Math.round(50 + gauss() * 8), 25, 80); }
  if (!future.length) { return clamp(Math.round(32 + gauss() * 6), 15, 60); }
  const [lastYear, lastRating] = future[future.length - 1];
  const years = lastYear - SEASON + 1;
  let expected = 0;
  for (let y = 0; y < years; y += 1) { expected += expectedChange(p.pos, age + y, 50); }
  const surplus = (lastRating - p.ovr) - expected;
  return clamp(Math.round(50 + 4 * surplus / Math.max(1, years) * 1.5 + gauss() * 4), 15, 92);
}

/* How rarely he gets hurt, 1-99: the share of games he played in 2020-2022
   (the ones he was on a roster for). */
function durabilityOf(p, evidence) {
  let played = 0;
  let possible = 0;
  [2020, 2021, 2022].forEach((y) => {
    if (p.entry && p.entry > y) { return; }
    const e = evidence[y].get(p.id);
    possible += y >= 2021 ? 17 : 16;
    played += e ? e.games || 0 : 0;
  });
  if (!possible) { return clamp(Math.round(72 + gauss() * 8), 45, 95); }
  const share = played / possible;
  return clamp(Math.round(40 + 55 * share + gauss() * 4), 25, 97);
}

/* What goes in the file for a player. */
function cleanPlayer(p) {
  return {
    id: p.id,
    name: p.name,
    pos: p.pos,
    team: p.team,
    ege: p.ege || undefined,
    born: p.born,
    age: p.age,
    height: p.height || null,
    weight: p.weight || null,
    college: p.college || undefined,
    entry: p.entry,
    draft: p.draft && p.draft.pick ? p.draft : undefined,
    ovr: p.ovr,
    pot: p.pot,
    skills: p.skills,
    archetype: p.archetype,
    longevity: p.longevity,
    durability: p.durability,
    contract: p.contract,
    status: p.status
  };
}

/* The real 2024, 2025 and 2026 draft classes. Each prospect's grade is
   where he really went (the scouting consensus, in effect); where he goes
   in this world is the sim's draft. Paxon Hatch, Cooper Clark and Isaac
   Vitel join the 2024 class from the site. */
function buildProspects(people, combine, realRating, meaningful, evidence, egeSlugs) {
  const classes = {};
  read('draft_picks.csv', (r) => ['2024', '2025', '2026'].indexOf(r.season) !== -1).forEach((r) => {
    const year = Number(r.season);
    const person = (r.gsis_id && people.get(r.gsis_id)) || {};
    const pos = simPos(person.pff_position, null, r.position) || simPos(null, null, r.position);
    if (!pos) { return; }
    const pick = num(r.pick);
    const c = (r.pfr_player_id && combine.get(r.pfr_player_id)) || {};
    const born = person.birth_date || null;
    const future = [2024, 2025].filter((y) => y >= year && r.gsis_id && meaningful(r.gsis_id, y))
      .map((y) => realRating[y].get(r.gsis_id)).filter(Number.isFinite);
    (classes[year] = classes[year] || []).push({
      id: r.gsis_id || ('draft:' + year + ':' + pick),
      name: r.pfr_player_name,
      pos,
      college: r.college,
      born,
      age: num(r.age),
      height: inches(person.height) || null,
      weight: num(person.weight) || null,
      forty: c.forty || null,
      grade: pick,
      realPeak: future.length ? Math.max(...future) : null
    });
  });
  Object.keys(classes).forEach((year) => classes[year].sort((a, b) => a.grade - b.grade));
  return { classes, ege: { 2024: egeSlugs } };
}

/* The real regular seasons, 2023-2026: week, home, away. */
function buildSchedules() {
  const out = {};
  read('games.csv', (r) => r.game_type === 'REG' && Number(r.season) >= 2023).forEach((r) => {
    const y = r.season;
    (out[y] = out[y] || []).push({ week: Number(r.week), home: r.home_team, away: r.away_team,
                                    neutral: r.location === 'Neutral' || undefined });
  });
  return out;
}

/* The best at each position, to eyeball after a build. */
function report(players, teams) {
  const order = ['QB', 'RB', 'WR', 'TE', 'OT', 'IOL', 'EDGE', 'DI', 'LB', 'CB', 'S', 'K', 'P'];
  order.forEach((pos) => {
    const top = players.filter((p) => p.pos === pos).sort((a, b) => b.ovr - a.ovr).slice(0, 12);
    process.stdout.write(pos + ': ' + top.map((p) => p.name + ' ' + p.ovr + '/' + p.pot + ' (' + p.team + ')').join(', ') + '\n');
  });
  process.stdout.write('\n' + teams.map((t) => t.key + ' ' + t.offense + '/' + t.defense).join('  ') + '\n');
}

if (require.main === module) { main(); }

module.exports = { simPos, norm, ageOn };
