/* ==========================================================================
   EGE Football NFL sim — the 2028 draft class
   Writes the 2028 class into nfl-sim/data/prospects.json, after the 2027
   class (Sam, 2026-11-02: "create a 2028 Draft ... don't have any duplicate
   players appear from the 2027 ... use as many college headshots as you
   can ... a little better than the previous draft class ... Keelon Russell
   should be a 84 overall upon draft night", and then "also make Malachi
   Toney a 84 overall"):

     node nfl-sim/build/class-2028.js

   The 2028 draft is a year and a half away, so far fewer lists are out
   than there were for 2027: four first-round mock drafts and
   WalterFootball's position lists (build/class-2028-sources.json). The
   class is built in three layers:

   1. Everyone the mocks name, by his average pick over the four, a mock
      that leaves him out counting him 40th.
   2. Then everyone else on the position lists, and after them the college
      players with the most to show for 2025 and 2026 at each position (from
      cfbfastR's play-by-play: yards and touchdowns on offense; sacks,
      takeaways and pass breakups on defense; for linemen, how much their
      offense gained). The positions take turns, each by its share of a real
      class (lib/draft.js MIX), so a 2028 board looks like a draft board.

   Nobody from an earlier class is in it, by ESPN id or by name; nor is any
   player in his fourth college year in 2026, who goes in 2027. Who each
   prospect is comes from cfbfastR's 2026 college rosters, as for 2027: his
   ESPN id (`collegePhoto`, so the site shows his college headshot in the
   NFL), height, weight and class.

   The class comes in a point and a half better than 2027's at every pick
   (prospects.json `lift`), its ceilings too, and two players are set:
   Keelon Russell and Malachi Toney are 84 on draft night (`ovr`). Where
   anyone goes is still the sim's draft, by its own order and every team's
   needs.
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const { read, download } = require('./nflverse');
const { rows } = require('./write');
const { hash } = require('../lib/rng');
const c27 = require('./class-2027');

const YEAR = 2028;
const DATA = path.join(__dirname, '..', 'data', 'prospects.json');
const SOURCES = require('./class-2028-sources.json');
const SIZE = 320;
/* Points on every pick's overall and ceiling, against the 2027 class. */
const LIFT = 1.5;
/* Draft-night overalls Sam set (2026-11-02). */
const FIXED = { 'keelon russell': 84, 'malachi toney': 84 };
/* Where a mock leaves a player out. */
const MISSING = 40;
/* Kickers go in the late rounds. */
const KICKERS_FROM = 180;

/* Roughly how a real class splits by position (lib/draft.js MIX, no FB or
   punters: the sim's own depth fills those). */
const MIX = { WR: 32, CB: 30, EDGE: 24, OT: 20, IOL: 22, DI: 22, LB: 22, S: 20, RB: 18, TE: 15, QB: 12, K: 2 };

/* ---------------------------------------------------------------- names -- */

/* The same player written another way, as the rosters or the 2027 lists
   spell him. */
const ALIAS = {
  'zalance heard': 'lance heard',
  'ryan williams coleman': 'ryan coleman williams',
  'gregory johnson': 'greg johnson',
  'jabril rawls': 'jabril rawls',
  'ja bril rawls': 'jabril rawls'
};
/* A player the lists call another way than the rosters do. */
const ROSTER_NAME = { 'jeremiah mccloud': 'jeramiah mccloud', 'akylin dear': 'ak dear' };
function key(name) {
  const n = c27.norm(name).replace(/;/g, '');
  return ALIAS[n] || c27.key(n);
}

const SCHOOL = { Miami: 'Miami', UCF: 'UCF', 'NC State': 'NC State' };
function school(name) { return SCHOOL[name] || c27.school(name); }

/* ----------------------------------------------------- earlier classes -- */

function earlier(all) {
  const ids = new Set();
  const names = new Set();
  Object.keys(all.classes).filter((y) => Number(y) < YEAR).forEach((y) => {
    all.classes[y].forEach((pr) => {
      if (pr.espn) { ids.add(String(pr.espn)); }
      if (Number(y) >= 2026) { names.add(key(pr.name)); }
    });
  });
  return { ids, names };
}

/* --------------------------------------------------------------- lists -- */

function entries(lines) {
  return lines.map((line) => {
    const [n, name, pos, from] = line.split('|');
    return { n: Number(n), name, pos: c27.simPos(pos) || pos, school: school(from) };
  });
}

/* Everyone the mocks name, best average pick first. */
function mocked() {
  const byKey = new Map();
  SOURCES.mocks.forEach((m) => {
    entries(m.picks).forEach((e) => {
      const k = key(e.name);
      const p = byKey.get(k) || byKey.set(k, { key: k, name: e.name, school: e.school, positions: [], spots: new Map() }).get(k);
      if (!p.spots.has(m)) { p.spots.set(m, e.n); }
      p.positions.push(e.pos);
    });
  });
  const out = Array.from(byKey.values());
  out.forEach((p) => {
    const spots = SOURCES.mocks.map((m) => (p.spots.has(m) ? p.spots.get(m) : MISSING));
    p.score = spots.reduce((a, b) => a + b, 0) / spots.length;
    p.best = Math.min.apply(null, spots);
    p.pos = mostOf(p.positions);
    p.from = 'mock';
  });
  return out.sort((a, b) => a.score - b.score || a.best - b.best);
}

function mostOf(list) {
  const counts = {};
  list.forEach((x) => { counts[x] = (counts[x] || 0) + 1; });
  return Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
}

/* Everyone on the position lists, by position, best average spot first. A
   player on two lists of one position (guards and centres) counts his
   better spot. */
function listed() {
  const byPos = {};
  SOURCES.positionLists.forEach((list) => {
    entries(list.ranks).forEach((e) => {
      const pos = MIX[e.pos] ? e.pos : list.pos;
      const group = byPos[pos] || (byPos[pos] = new Map());
      const k = key(e.name);
      const p = group.get(k);
      if (!p) { group.set(k, { key: k, name: e.name, school: e.school, pos, spot: e.n, from: 'list' }); }
      else { p.spot = Math.min(p.spot, e.n); }
    });
  });
  const out = {};
  Object.keys(byPos).forEach((pos) => { out[pos] = Array.from(byPos[pos].values()).sort((a, b) => a.spot - b.spot); });
  return out;
}

/* ------------------------------------------------------------ production -- */

const CONFERENCE = {
  SEC: 1, 'Big Ten': 1, 'Big 12': 0.9, ACC: 0.9, 'FBS Independents': 0.95, 'Pac-12': 0.75,
  'American Athletic': 0.7, 'Mountain West': 0.7, 'Sun Belt': 0.65, 'Conference USA': 0.6, 'Mid-American': 0.6
};

/* What each player did in a season, from its play-by-play, and how much
   each team's offense gained. */
function seasonStats(season) {
  const players = new Map();
  const teams = new Map();
  const add = (id, stat, v) => {
    if (!id || id === 'NA') { return; }
    const s = players.get(id) || players.set(id, {}).get(id);
    s[stat] = (s[stat] || 0) + v;
  };
  const num = (v) => (v === 'NA' || v === '' || v === undefined ? 0 : Number(v) || 0);
  read('cfb_player_stats_' + season + '.csv', null, [
    'team', 'conference', 'reception_player_id', 'reception_yds', 'completion_player_id', 'completion_yds', 'rush_player_id',
    'rush_yds', 'interception_player_id', 'interception_thrown_player_id', 'touchdown_player_id', 'sack_player_id', 'sack_stat',
    'pass_breakup_player_id', 'fumble_forced_player_id', 'fumble_recovered_player_id', 'field_goal_made_player_id', 'game_id'
  ]).forEach((r) => {
    const t = teams.get(r.team) || teams.set(r.team, { yards: 0, games: new Set(), conference: r.conference }).get(r.team);
    t.games.add(r.game_id);
    add(r.reception_player_id, 'rec', num(r.reception_yds));
    add(r.completion_player_id, 'pass', num(r.completion_yds));
    add(r.rush_player_id, 'rush', num(r.rush_yds));
    t.yards += num(r.rush_yds) + num(r.completion_yds);
    add(r.interception_player_id, 'int', 1);
    add(r.interception_thrown_player_id, 'thrown', 1);
    if (r.touchdown_player_id && r.touchdown_player_id !== 'NA') {
      add(r.touchdown_player_id, 'td', 1);
      if (r.touchdown_player_id === r.reception_player_id) { add(r.completion_player_id, 'passTd', 1); }
    }
    add(r.sack_player_id, 'sack', num(r.sack_stat) || 1);
    add(r.pass_breakup_player_id, 'pbu', 1);
    add(r.fumble_forced_player_id, 'ff', 1);
    add(r.fumble_recovered_player_id, 'fr', 1);
    add(r.field_goal_made_player_id, 'fg', 1);
  });
  return { players, teams };
}

function production(pos, s) {
  const v = (k) => s[k] || 0;
  switch (pos) {
    case 'QB': return v('pass') + 20 * v('passTd') + v('rush') - 45 * v('thrown');
    case 'RB': return v('rush') + v('rec') + 25 * v('td');
    case 'WR': case 'TE': return v('rec') + 25 * v('td');
    case 'EDGE': case 'DI': case 'LB': return 30 * v('sack') + 20 * v('ff') + 10 * v('pbu') + 10 * v('fr') + 30 * v('int');
    case 'CB': case 'S': return 40 * v('int') + 12 * v('pbu') + 20 * v('ff') + 10 * v('fr');
    case 'K': return 10 * v('fg');
    default: return 0;
  }
}

/* A roster position as the sim's. */
function rosterPos(r) {
  const h = Number(r.height) || 0;
  const w = Number(r.weight) || 0;
  switch (r.position) {
    case 'QB': case 'RB': case 'WR': case 'TE': return r.position;
    case 'FB': return 'RB';
    case 'OL': case 'OT': case 'G': case 'C': return r.position === 'OT' || (r.position === 'OL' && h >= 77) ? 'OT' : 'IOL';
    case 'DL': case 'DE': case 'DT': case 'NT': case 'EDGE':
      return r.position === 'DT' || r.position === 'NT' || w >= 285 ? 'DI' : 'EDGE';
    case 'LB': return 'LB';
    case 'CB': return 'CB';
    case 'S': return 'S';
    case 'DB': return w >= 200 ? 'S' : 'CB';
    case 'PK': return 'K';
    default: return null;
  }
}

/* The college players with the most to show, by position: third- and
   second-year players at schools that play FBS football. */
function depth(roster, stats, taken) {
  const byPos = {};
  const linemen = new Map();
  roster.forEach((r) => {
    const year = Number(r.year);
    if (year !== 2 && year !== 3) { return; }
    if (taken.has(r.athlete_id)) { return; }
    const pos = rosterPos(r);
    if (!pos || !MIX[pos]) { return; }
    const team = stats[0].teams.get(r.team);
    const conf = team ? CONFERENCE[team.conference] : undefined;
    if (!conf) { return; }
    let score;
    if (pos === 'OT' || pos === 'IOL') {
      /* No stats for linemen: his offense's yards a game, the older and
         bigger of a school's linemen first, two at most from one school. */
      const ypg = team.yards / Math.max(1, team.games.size);
      score = ypg * conf + (year === 3 ? 25 : 0) + (Number(r.weight) || 0) / 20;
      const list = linemen.get(r.team) || linemen.set(r.team, []).get(r.team);
      list.push({ r, pos, score });
      return;
    }
    const now = stats[0].players.get(r.athlete_id) || {};
    const before = stats[1].players.get(r.athlete_id) || {};
    score = (production(pos, now) + 0.7 * production(pos, before)) * conf;
    if (score <= 0) { return; }
    (byPos[pos] || (byPos[pos] = [])).push({ r, pos, score });
  });
  linemen.forEach((list) => {
    list.sort((a, b) => b.score - a.score).slice(0, 2).forEach((x, i) => {
      x.score *= i ? 0.9 : 1;
      (byPos[x.pos] || (byPos[x.pos] = [])).push(x);
    });
  });
  Object.keys(byPos).forEach((pos) => byPos[pos].sort((a, b) => b.score - a.score));
  return byPos;
}

/* -------------------------------------------------------------- the class -- */

function prospect(p, r, pos) {
  const espn = r ? String(r.athlete_id) : null;
  const id = espn ? 'espn:' + espn : 'draft:' + YEAR + ':' + p.key.replace(/ /g, '-');
  /* His class in the 2027 season, the last before the draft. */
  const year = r ? Number(r.year) + 1 : 4;
  const age = (year >= 4 ? 22 : 21) + (hash(id) % 3 === 0 ? 1 : 0);
  const month = 1 + (hash(id + ':born') % 8);
  const out = {
    id,
    name: p.name,
    pos,
    college: c27.shown(r ? r.team : p.school),
    espn: espn || undefined,
    collegePhoto: espn ? true : undefined,
    born: (YEAR - age) + '-0' + month + '-15',
    age,
    height: r && Number(r.height) ? Number(r.height) : null,
    weight: r && Number(r.weight) ? Number(r.weight) : null,
    forty: null,
    grade: 0,
    realPeak: null
  };
  if (FIXED[p.key]) { out.ovr = FIXED[p.key]; }
  return out;
}

function main() {
  download('cfb_player_stats_2026.csv');
  download('cfb_player_stats_2025.csv');
  const all = JSON.parse(fs.readFileSync(DATA, 'utf8'));
  const before = earlier(all);
  const indexes = [c27.rosterIndex(2026), c27.rosterIndex(2025)];
  const roster = read('cfb_rosters_2026.csv');
  const used = new Set();
  const out = [];
  const left = [];
  const seniors = [];
  const unmatched = [];

  /* A named player, if he belongs in this class. */
  function take(p, isMock) {
    if (used.has(p.key)) { return null; }
    if (before.names.has(p.key)) { left.push(p.name); return null; }
    const r = c27.rosterRow(Object.assign({}, p, { key: ROSTER_NAME[p.key] || p.key }), p.pos, indexes);
    if (r && used.has(String(r.athlete_id))) { return null; }
    if (r && before.ids.has(String(r.athlete_id))) { left.push(p.name); return null; }
    /* Off the 2026 roster or a senior there: a mock's pick stays (his
       picture may not), a position list's goes. */
    if (!r && !isMock) { return null; }
    if (r && r.season === '2026' && Number(r.year) >= 4 && !isMock) { seniors.push(p.name); return null; }
    if (!r) { unmatched.push(p.name + ' (' + p.school + ')'); }
    used.add(p.key);
    if (r) { used.add(String(r.athlete_id)); }
    return prospect(p, r, p.pos);
  }

  mocked().forEach((p) => { const pr = take(p, true); if (pr) { out.push(pr); } });

  /* The rest, position by position. */
  const counts = {};
  out.forEach((pr) => { counts[pr.pos] = (counts[pr.pos] || 0) + 1; });
  const lists = listed();
  const taken = new Set(before.ids);
  const stats = [seasonStats(2026), seasonStats(2025)];
  const deep = depth(roster, stats, taken);
  const queues = {};
  Object.keys(MIX).forEach((pos) => {
    const q = [];
    (lists[pos] || []).forEach((p) => { const pr = take(p, false); if (pr) { q.push(pr); } });
    (deep[pos] || []).forEach((x) => {
      const p = { key: key(x.r.first_name + ' ' + x.r.last_name), name: x.r.first_name + ' ' + x.r.last_name, school: x.r.team, pos };
      if (used.has(String(x.r.athlete_id)) || used.has(p.key) || before.names.has(p.key)) { return; }
      used.add(p.key);
      used.add(String(x.r.athlete_id));
      q.push(prospect(p, x.r, pos));
    });
    queues[pos] = q;
  });
  /* The positions take turns: next is the one furthest short of its share. */
  const total = Object.keys(MIX).reduce((a, k) => a + MIX[k], 0);
  while (out.length < SIZE) {
    let next = null;
    let best = Infinity;
    Object.keys(MIX).forEach((pos) => {
      if (!queues[pos].length || (pos === 'K' && out.length < KICKERS_FROM)) { return; }
      const share = ((counts[pos] || 0) + 1) / (MIX[pos] / total);
      if (share < best) { best = share; next = pos; }
    });
    if (!next) { break; }
    out.push(queues[next].shift());
    counts[next] = (counts[next] || 0) + 1;
  }
  out.forEach((pr, i) => { pr.grade = i + 1; });

  all.classes[YEAR] = out;
  all.lift = Object.assign({}, all.lift, { [YEAR]: LIFT });
  fs.writeFileSync(DATA, rows(all, '') + '\n');
  const photos = out.filter((pr) => pr.collegePhoto).length;
  process.stderr.write('Wrote nfl-sim/data/prospects.json: ' + out.length + ' prospects in ' + YEAR + ', ' + photos +
                       ' with an ESPN id\n');
  process.stderr.write('In an earlier class, left out (' + left.length + '): ' + left.join(', ') + '\n');
  process.stderr.write('Seniors in 2026, left out (' + seniors.length + '): ' + seniors.join(', ') + '\n');
  if (unmatched.length) { process.stderr.write('No ESPN id: ' + unmatched.join(', ') + '\n'); }
}

if (require.main === module) { main(); }

module.exports = { mocked, listed, key };
