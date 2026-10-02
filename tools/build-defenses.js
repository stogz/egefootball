/* ==========================================================================
   EGE Football — how good every defense is
   Writes data/defenses.js: for every FBS and FCS school, the rushing and
   passing yards its defense gave up a game, and where that ranks among the
   schools at its level. The schedule turns those ranks into the A-F grade
   beside each opponent (see EGE.defenseGrade in data/games.js).

     node tools/build-defenses.js

   Where the numbers come from
   ---------------------------
   ESPN has no "yards allowed" split by rush and pass, but it has every box
   score, and what a defense allowed is what the other side gained. So this
   reads every regular-season game each school played and credits the
   opponent's rushing and net passing yards to its defense. Sacks count
   against rushing, the way college football has always counted them.

   It is the real season: a school's 2020 grade is what its defense really
   did in 2020, the same way the conference races were played out from each
   school's real 2020 strength.

   Thin seasons
   ------------
   A school with fewer than MIN_GAMES games in a season -- UConn sat 2020
   out, and the FCS played its 2020 season in the spring of 2021, which ESPN
   does not carry -- is graded on the season before instead, and the entry
   says so with `from`. Its rank is its rank in that season.

   Run it again when a new season is added to SEASONS, or to pick up ESPN's
   corrections. Everything fetched is cached in the temp folder (see
   tools/espn.js), so a second run takes seconds.
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { fetchAll, teamNames, refIds } = require('./espn');

/* The seasons the site grades. Each needs the one before it fetched too, for
   the schools that barely played. */
const SEASONS = [2020, 2021];
const MIN_GAMES = 4;
const LEVELS = { FBS: 80, FCS: 81 };
const OUT = path.join(__dirname, '..', 'data', 'defenses.js');

const CORE = 'https://sports.core.api.espn.com/v2/sports/football/leagues/college-football';
const SITE = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football';

function round1(n) { return Math.round(n * 10) / 10; }

/* Which schools played at each level that season: { id: 'FBS' | 'FCS' }. */
function levelsFor(season) {
  const urls = {};
  Object.keys(LEVELS).forEach(function (level) {
    urls[level] = CORE + '/seasons/' + season + '/types/2/groups/' + LEVELS[level] + '/teams?limit=400';
  });
  const got = fetchAll(Object.values(urls));
  const levels = {};
  Object.keys(urls).forEach(function (level) {
    const body = got.get(urls[level]);
    refIds(body && body.items, /teams\/(\d+)/).forEach(function (id) { levels[id] = level; });
  });
  return levels;
}

/* Every completed regular-season game those schools played. */
function gamesFor(season, ids) {
  const urls = ids.map(function (id) { return SITE + '/teams/' + id + '/schedule?season=' + season; });
  const got = fetchAll(urls, season + ' schedules');
  const events = new Set();
  urls.forEach(function (url) {
    const body = got.get(url);
    ((body && body.events) || []).forEach(function (event) {
      const type = event.seasonType && event.seasonType.type;
      const done = event.competitions && event.competitions[0] &&
        event.competitions[0].status && event.competitions[0].status.type &&
        event.competitions[0].status.type.completed;
      if (type === 2 && done) { events.add(event.id); }
    });
  });
  return [...events];
}

function stat(team, name) {
  const found = (team.statistics || []).filter(function (s) { return s.name === name; })[0];
  if (!found) { return null; }
  const value = parseFloat(String(found.displayValue).split(/[-/]/)[0]);
  return isNaN(value) ? null : value;
}

/* What each school's defense allowed over the season: games, rushing yards
   and carries, passing yards and attempts, keyed by ESPN id. */
function allowedIn(season, ids) {
  const events = gamesFor(season, ids);
  const urls = events.map(function (id) { return SITE + '/summary?event=' + id; });
  const got = fetchAll(urls, season + ' box scores');

  const totals = {};
  urls.forEach(function (url) {
    const body = got.get(url);
    const teams = body && body.boxscore && body.boxscore.teams;
    if (!teams || teams.length !== 2) { return; }
    const lines = teams.map(function (team) {
      const attempts = String(((team.statistics || []).filter(function (s) {
        return s.name === 'completionAttempts';
      })[0] || {}).displayValue || '').split('/')[1];
      return {
        id: Number(team.team.id),
        rush: stat(team, 'rushingYards'),
        carries: stat(team, 'rushingAttempts'),
        pass: stat(team, 'netPassingYards'),
        attempts: attempts ? Number(attempts) : null
      };
    });
    if (lines.some(function (line) { return line.rush === null || line.pass === null; })) { return; }

    [[0, 1], [1, 0]].forEach(function (pair) {
      const defense = lines[pair[0]].id;
      const offense = lines[pair[1]];
      const row = totals[defense] || (totals[defense] = { games: 0, rush: 0, carries: 0, pass: 0, attempts: 0 });
      row.games += 1;
      row.rush += offense.rush;
      row.carries += offense.carries || 0;
      row.pass += offense.pass;
      row.attempts += offense.attempts || 0;
    });
  });
  return totals;
}

/* 1 for the fewest yards allowed. Level schools share a rank. */
function rank(rows, key) {
  const sorted = rows.slice().sort(function (a, b) { return a[key] - b[key]; });
  const ranks = new Map();
  sorted.forEach(function (row, i) {
    const prev = sorted[i - 1];
    ranks.set(row.id, prev && prev[key] === row[key] ? ranks.get(prev.id) : i + 1);
  });
  return ranks;
}

/* One season's table: every school with enough games, its yards allowed a
   game and its ranks at its level. */
function table(season) {
  const levels = levelsFor(season);
  const ids = Object.keys(levels).map(Number);
  const totals = allowedIn(season, ids);

  const rows = ids.filter(function (id) {
    return totals[id] && totals[id].games >= MIN_GAMES;
  }).map(function (id) {
    const t = totals[id];
    return {
      id: id,
      level: levels[id],
      games: t.games,
      rush: round1(t.rush / t.games),
      perCarry: t.carries ? round1(t.rush / t.carries) : null,
      pass: round1(t.pass / t.games),
      perAttempt: t.attempts ? round1(t.pass / t.attempts) : null
    };
  });

  const out = {};
  Object.keys(LEVELS).forEach(function (level) {
    const pool = rows.filter(function (row) { return row.level === level; });
    const rush = rank(pool, 'rush');
    const pass = rank(pool, 'pass');
    pool.forEach(function (row) {
      row.rushRank = rush.get(row.id);
      row.passRank = pass.get(row.id);
      row.of = pool.length;
      out[row.id] = row;
    });
  });
  return { rows: out, levels: levels };
}

function quote(name) {
  return "'" + name.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
}

function entry(row, from) {
  const parts = [
    'level: ' + quote(row.level),
    'games: ' + row.games,
    'rush: ' + row.rush,
    'perCarry: ' + row.perCarry,
    'rushRank: ' + row.rushRank,
    'pass: ' + row.pass,
    'perAttempt: ' + row.perAttempt,
    'passRank: ' + row.passRank,
    'of: ' + row.of
  ];
  if (from) { parts.push('from: ' + from); }
  return '{ ' + parts.join(', ') + ' }';
}

/* The site's other spellings of a school, from data/logos.js, so a season
   file that writes 'Miami (FL)' or 'Pitt' finds its defense too. */
function aliasesById(names) {
  const sandbox = { window: {} };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'data', 'logos.js'), 'utf8'), sandbox);
  const byId = {};
  Object.keys(sandbox.EGE.espnIds).forEach(function (name) {
    const id = sandbox.EGE.espnIds[name];
    if (names.get(id) !== name) { (byId[id] = byId[id] || []).push(name); }
  });
  return byId;
}

function main() {
  const names = teamNames();
  const aliases = aliasesById(names);
  const tables = {};
  function tableFor(season) {
    if (!tables[season]) { tables[season] = table(season); }
    return tables[season];
  }

  const out = [];
  out.push('/* ==========================================================================');
  out.push('   EGE Football — every defense, graded');
  out.push('   Written by tools/build-defenses.js from ESPN\'s box scores; run that again');
  out.push('   rather than editing this by hand.');
  out.push('');
  out.push('   Per school and season: the rushing and passing yards its defense gave up');
  out.push('   a game (with yards a carry and an attempt beside them), and where each');
  out.push('   ranks among the `of` schools at its level, 1 being the stingiest. A');
  out.push('   school that barely played that season is graded on the one before, and');
  out.push('   says so with `from`. EGE.defenseGrade in data/games.js turns a rank into');
  out.push('   the letter on the schedule.');
  out.push('   ========================================================================== */');
  out.push('');
  out.push('window.EGE = window.EGE || {};');
  out.push('EGE.defenses = EGE.defenses || {};');

  SEASONS.forEach(function (season) {
    const now = tableFor(season);
    const before = tableFor(season - 1);
    const lines = [];
    let fallbacks = 0;

    const ids = new Set(Object.keys(now.levels).map(Number));
    ids.forEach(function (id) {
      let row = now.rows[id];
      let from = null;
      if (!row && before.rows[id]) { row = before.rows[id]; from = season - 1; fallbacks += 1; }
      if (!row || !names.get(id)) { return; }
      /* A school that moved up a level is graded where it played. */
      [names.get(id)].concat(aliases[id] || []).forEach(function (name) {
        lines.push({ name: name, text: entry(row, from) });
      });
    });

    lines.sort(function (a, b) { return a.name.localeCompare(b.name); });
    out.push('');
    out.push('EGE.defenses[' + season + '] = {');
    lines.forEach(function (line, i) {
      out.push('  ' + quote(line.name) + ': ' + line.text + (i < lines.length - 1 ? ',' : ''));
    });
    out.push('};');
    console.log(season + ': ' + lines.length + ' schools (' + fallbacks + ' on the season before)');
  });

  out.push('');
  fs.writeFileSync(OUT, out.join('\n'));
  console.log('written to data/defenses.js');
}

main();
