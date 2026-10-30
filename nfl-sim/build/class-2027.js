/* ==========================================================================
   EGE Football NFL sim — the 2027 draft class
   Writes the 2027 class into nfl-sim/data/prospects.json, next to the real
   2024-2026 classes build-league.js wrote (Sam, 2026-10-30: "Create the
   2027 draft based on a few mock drafts"):

     node nfl-sim/build/class-2027.js

   The 2027 draft has not happened, so the class is the college players the
   fall 2026 mock drafts and big boards name (build/class-2027-sources.json:
   four first-round mocks from October and five boards, one of them 321
   deep). Each prospect's grade is his place in their consensus: the average
   of his spot on all nine lists, where a list that leaves him out counts
   him

   - on a big board, just past its end (101st on a top 100), or where the
     321-deep board has him if that is further down;
   - in a mock, where the boards have him, and never better than 33rd.

   The deep board left out a few players the others have in their first
   rounds (Kingston Lopa, Xavier Gilliam), so leaving a player out of it
   counts as past its top 100, not past its 321. Where he goes in this
   world is still the sim's draft, by its own order and every team's needs.

   Who each prospect is comes from cfbfastR's 2026 college rosters, which
   carry ESPN's own athlete ids: the id, height and weight, and his class.
   The rosters have no birthdays, so his age is his class's (a senior 22, a
   junior 21, now and then a year older). His ESPN id is how the website
   shows his picture, and since ESPN has no NFL headshot for a player who
   has not been drafted yet, every one of them is marked `collegePhoto`:
   the site takes his college headshot instead, in the NFL too (Sam,
   2026-10-30).
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const { read } = require('./nflverse');
const { rows } = require('./write');
const { hash } = require('../lib/rng');

const YEAR = 2027;
const DATA = path.join(__dirname, '..', 'data', 'prospects.json');
const SOURCES = require('./class-2027-sources.json');

/* ---------------------------------------------------------------- names -- */

function norm(name) {
  return String(name || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[.'’`]/g, '').replace(/-/g, ' ')
    .replace(/\b(jr|sr|ii|iii|iv|v)\b/g, '').replace(/\s+/g, ' ').trim();
}

/* The same player written another way somewhere. */
const ALIAS = {
  'tae johnson': 'brauntae johnson',
  'ryan williams': 'ryan coleman williams',
  'jaden baugh': 'jadan baugh',
  'kyngston viliamu asa': 'kyngstonn viliamu asa',
  'faletau satala': 'faletau satuala',
  'terrence carter': 'terrance carter',
  'keon saab': 'keon sabb',
  'tavion gadsen': 'tavion gadson',
  'deshon bishop': 'desean bishop',
  'jermaine matthews': 'jermaine mathews'
};

function key(name) { const k = norm(name); return ALIAS[k] || k; }

/* A player the lists call by a nickname, as the rosters have him. */
const ROSTER_NAME = { 'oj frederique': 'romanas frederique', 'dom nichols': 'dominic nichols', 'adonijah green': 'aj green' };

/* Schools as the lists and the rosters write them. */
const SCHOOL = {
  'miami (fl)': 'Miami', 'miami (fla.)': 'Miami', cal: 'California', pitt: 'Pittsburgh', fau: 'Florida Atlantic'
};
function school(name) { return SCHOOL[String(name || '').toLowerCase()] || name; }

/* And as the other classes show them (Pro Football Reference's way). */
const SHOWN = {
  'Ole Miss': 'Mississippi', Miami: 'Miami (FL)', UCF: 'Central Florida', 'NC State': 'North Carolina St.',
  'Boston College': 'Boston Col.', UConn: 'Connecticut', UTEP: 'Texas-El Paso'
};
function shown(name) { return SHOWN[name] || String(name || '').replace(/ State$/, ' St.'); }

/* ------------------------------------------------------------ positions -- */

const POS = {
  QB: 'QB', RB: 'RB', HB: 'RB', FB: 'FB', WR: 'WR', TE: 'TE', OT: 'OT', IOL: 'IOL', G: 'IOL', C: 'IOL',
  EDGE: 'EDGE', DE: 'EDGE', DT: 'DI', DI: 'DI', LB: 'LB', CB: 'CB', S: 'S'
};
/* A player only lists with "OL" or "DL" on: where he really plays. */
const POSITION_FIX = { 'earnest greene': 'OT', 'malachi breland': 'IOL' };

function simPos(text) { return POS[String(text || '').toUpperCase()] || null; }

/* --------------------------------------------------------------- lists -- */

function entries(lines) {
  return lines.map((line) => {
    const [n, name, pos, from] = line.split('|');
    return { n: Number(n), name, pos, school: school(from) };
  });
}

/* Every player the lists name, once, the deep board's spelling first. Two
   players with one name (Jordan Ross the LSU end and the Arizona receiver)
   are told apart by school. */
function collect() {
  const players = [];
  const byKey = new Map();
  const lists = [SOURCES.boards[0]].concat(SOURCES.boards.slice(1), SOURCES.mocks);
  lists.forEach((list) => {
    entries(list.ranks || list.picks).forEach((e) => {
      const k = key(e.name);
      const same = byKey.get(k) || [];
      let p = same.length === 1 ? same[0] : same.find((x) => x.school === e.school);
      if (same.length === 1 && list === SOURCES.boards[0] && same[0].school !== e.school) { p = null; }
      if (!p) {
        p = { key: k, name: e.name, school: e.school, positions: [], spots: new Map() };
        players.push(p);
        byKey.set(k, same.concat([p]));
      }
      if (!p.spots.has(list)) { p.spots.set(list, e.n); }
      if (simPos(e.pos)) { p.positions.push(simPos(e.pos)); }
    });
  });
  return players;
}

/* The deep board's position, or the one the lists give him most. */
function positionOf(p) {
  if (POSITION_FIX[p.key]) { return POSITION_FIX[p.key]; }
  const counts = {};
  p.positions.forEach((pos) => { counts[pos] = (counts[pos] || 0) + 1; });
  return p.positions.length ? Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] : null;
}

function consensus(players) {
  const deep = SOURCES.boards[0];
  players.forEach((p) => {
    const deepRank = p.spots.get(deep) || 0;
    const boards = SOURCES.boards.map((b) => {
      if (p.spots.has(b)) { return p.spots.get(b); }
      return b === deep ? 101 : Math.max(b.size + 1, deepRank);
    });
    p.board = boards.reduce((a, b) => a + b, 0) / boards.length;
    const mocks = SOURCES.mocks.map((m) => (p.spots.has(m) ? p.spots.get(m) : Math.max(m.size + 1, p.board)));
    p.score = boards.concat(mocks).reduce((a, b) => a + b, 0) / (boards.length + mocks.length);
    p.deepRank = deepRank || 999;
  });
  return players.sort((a, b) => a.score - b.score || a.board - b.board || a.deepRank - b.deepRank);
}

/* -------------------------------------------------------------- rosters -- */

function rosterIndex(season) {
  const index = new Map();
  read('cfb_rosters_' + season + '.csv').forEach((r) => {
    const k = key(r.first_name + ' ' + r.last_name);
    (index.get(k) || index.set(k, []).get(k)).push(r);
  });
  return index;
}

const GROUP = {
  QB: ['QB'], RB: ['RB', 'FB'], FB: ['RB', 'FB'], WR: ['WR'], TE: ['TE'], OT: ['OL', 'OT', 'G', 'C'], IOL: ['OL', 'OT', 'G', 'C'],
  EDGE: ['DL', 'DE', 'EDGE', 'LB', 'DT'], DI: ['DL', 'DT', 'DE', 'NT'], LB: ['LB', 'DL', 'DE', 'EDGE'],
  CB: ['DB', 'CB', 'S'], S: ['DB', 'S', 'CB']
};

/* His row in the college rosters: his name at his school, or his name
   alone where only one player at his position has it (a transfer). */
function rosterRow(p, pos, indexes) {
  for (let i = 0; i < indexes.length; i += 1) {
    const same = indexes[i].get(ROSTER_NAME[p.key] || p.key) || [];
    const atSchool = same.filter((r) => r.team === p.school);
    if (atSchool.length === 1) { return atSchool[0]; }
    const fits = same.filter((r) => (GROUP[pos] || []).indexOf(r.position) !== -1);
    if (fits.length === 1) { return fits[0]; }
  }
  return null;
}

/* -------------------------------------------------------------- the class -- */

function main() {
  const all = JSON.parse(fs.readFileSync(DATA, 'utf8'));
  const taken = new Set();
  Object.keys(all.classes).filter((y) => Number(y) < YEAR).forEach((y) => {
    all.classes[y].forEach((pr) => { if (pr.espn) { taken.add(String(pr.espn)); } });
  });
  const indexes = [rosterIndex(2026), rosterIndex(2025)];
  const out = [];
  const unmatched = [];
  consensus(collect()).forEach((p) => {
    const pos = positionOf(p);
    if (!pos) { process.stderr.write('No position for ' + p.name + '\n'); return; }
    const r = rosterRow(p, pos, indexes);
    if (r && taken.has(r.athlete_id)) { process.stderr.write(p.name + ' is in an earlier class; left out\n'); return; }
    if (!r) { unmatched.push(p.name + ' (' + p.school + ')'); }
    const espn = r ? r.athlete_id : null;
    const id = espn ? 'espn:' + espn : 'draft:' + YEAR + ':' + p.key.replace(/ /g, '-');
    const year = r ? Number(r.year) : 4;
    const age = (year >= 4 ? 22 : 21) + (hash(id) % 3 === 0 ? 1 : 0);
    const month = 1 + (hash(id + ':born') % 8);
    const college = r && school(p.school) === 'Unaffiliated' ? r.team : p.school;
    out.push({
      id,
      name: p.name,
      pos,
      college: shown(college),
      espn: espn || undefined,
      collegePhoto: espn ? true : undefined,
      born: (YEAR - age) + '-0' + month + '-15',
      age,
      height: r && Number(r.height) ? Number(r.height) : null,
      weight: r && Number(r.weight) ? Number(r.weight) : null,
      forty: null,
      grade: out.length + 1,
      realPeak: null
    });
  });
  all.classes[YEAR] = out;
  fs.writeFileSync(DATA, rows(all, '') + '\n');
  process.stderr.write('Wrote nfl-sim/data/prospects.json: ' + out.length + ' prospects in ' + YEAR + ', ' +
                       (out.length - unmatched.length) + ' with an ESPN id\n');
  if (unmatched.length) { process.stderr.write('No ESPN id: ' + unmatched.join(', ') + '\n'); }
}

if (require.main === module) { main(); }

module.exports = { consensus, collect, norm };
