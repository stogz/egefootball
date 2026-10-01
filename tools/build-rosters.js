/* ==========================================================================
   EGE Football — who else is on the team
   Writes data/rosters.js: the skill players -- quarterbacks, backs,
   receivers and tight ends -- on each of the six's college teams, a season
   at a time, from ESPN's rosters. The Teams page reads it for its rundown of
   each school, and the shop reads its quarterbacks for the QB Connection.

     node tools/build-rosters.js

   The six are not in here: they are on the team because data/players.js
   says so, and EGE.rosterFor in data/games.js puts them in their position
   room when the page asks. Everybody else is the real roster for that
   season, with the season's numbers beside anybody who has some, so a
   room reads in the order it played in -- the starter first, the walk-ons
   at the foot.

   Height and weight are ESPN's latest, not that season's.

   Hand edits are fine afterwards (a walk-on quarterback nobody wants to see
   in the QB Connection list can just be deleted) but a re-run writes over
   them. A new season goes in SEASONS; a new school is picked up from
   data/players.js on its own.
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const { fetchAll, refIds } = require('./espn');
const { loadSiteData } = require('../bot/site-data');

const SEASONS = [2020, 2021];
const POSITIONS = ['QB', 'RB', 'WR', 'TE'];
/* ESPN files a fullback on his own; on the page he is a back. */
const FOLD = { FB: 'RB' };
const OUT = path.join(__dirname, '..', 'data', 'rosters.js');

const CORE = 'https://sports.core.api.espn.com/v2/sports/football/leagues/college-football';

/* The number a room is ordered by, from the category that position is
   judged on, and the line shown beside the name. */
const LEADERS = { QB: 'passingYards', RB: 'rushingYards', WR: 'receivingYards', TE: 'receivingYards' };
/* The same categories' full lines -- 280/395, 3862 YDS, 38 TD, 5 INT --
   which ESPN gives for a room's top few. Anybody below them gets his yards. */
const LINES = { passingYards: 'passingLeader', rushingYards: 'rushingLeader', receivingYards: 'receivingLeader' };

function quote(text) {
  return "'" + String(text).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
}

/* 6' 3" to inches. */
function inches(text) {
  const found = String(text || '').match(/(\d+)'\s*(\d+)/);
  return found ? Number(found[1]) * 12 + Number(found[2]) : null;
}

function rosterFor(season, espnId) {
  const list = fetchAll([CORE + '/seasons/' + season + '/teams/' + espnId + '/athletes?limit=400'])
    .values().next().value;
  const ids = refIds(list && list.items, /athletes\/(\d+)/);
  const urls = ids.map(function (id) { return CORE + '/seasons/' + season + '/athletes/' + id; });
  const got = fetchAll(urls, season + ' roster ' + espnId);

  /* ESPN's list for a season keeps everybody who was ever on the team -- J.T.
     Barrett is on Ohio State's 2020 roster. What gives a season away is the
     game log: a player who was not there has no games in it. */
  const logs = fetchAll(urls.map(function (url) { return url + '/eventlog'; }), season + ' game logs ' + espnId);
  function wasThere(url, body) {
    const log = logs.get(url + '/eventlog');
    if (!log || !log.events || !log.events.count) { return false; }
    return !(body.draft && body.draft.year && body.draft.year <= season);
  }

  /* Every leader line in the categories a room is judged on, by athlete. */
  const leadersUrl = CORE + '/seasons/' + season + '/types/2/teams/' + espnId + '/leaders';
  const leaders = fetchAll([leadersUrl]).get(leadersUrl);
  const lines = {};
  ((leaders && leaders.categories) || []).forEach(function (category) {
    const yards = Object.keys(LINES).filter(function (key) { return LINES[key] === category.name; })[0];
    const key = yards || category.name;
    if (!LINES[key]) { return; }
    (category.leaders || []).forEach(function (leader) {
      const id = refIds([leader.athlete], /athletes\/(\d+)/)[0];
      if (!id) { return; }
      const row = (lines[id] = lines[id] || {})[key] || (lines[id][key] = { value: 0, text: null });
      if (yards) { row.text = leader.displayValue; } else {
        row.value = leader.value;
        if (!row.text) { row.text = Math.round(leader.value).toLocaleString('en-US') + ' YDS'; }
      }
    });
  });

  const rooms = {};
  POSITIONS.forEach(function (position) { rooms[position] = []; });
  urls.forEach(function (url, i) {
    const body = got.get(url);
    if (!body || !wasThere(url, body)) { return; }
    const abbr = body.position && body.position.abbreviation;
    const position = FOLD[abbr] || abbr;
    if (!rooms[position]) { return; }
    const line = (lines[ids[i]] || {})[LEADERS[position]] || null;
    rooms[position].push({
      name: body.fullName,
      jersey: body.jersey ? Number(body.jersey) : null,
      height: inches(body.displayHeight),
      weight: body.weight ? Math.round(body.weight) : null,
      value: line ? line.value : 0,
      line: line ? line.text : null
    });
  });

  POSITIONS.forEach(function (position) {
    rooms[position].sort(function (a, b) {
      return (b.value - a.value) || a.name.localeCompare(b.name);
    });
  });
  return rooms;
}

function main() {
  const EGE = loadSiteData();
  const vm = require('vm');
  const sandbox = { window: {} };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'data', 'logos.js'), 'utf8'), sandbox);

  const colleges = [...new Set(EGE.players.map(function (p) { return p.college; }).filter(Boolean))];

  const out = [];
  out.push('/* ==========================================================================');
  out.push('   EGE Football — the rosters');
  out.push('   Written by tools/build-rosters.js from ESPN; run that again rather than');
  out.push('   editing this by hand (though a hand edit is fine until the next run).');
  out.push('');
  out.push('   The skill players on each of the six\'s college teams, by season and by');
  out.push('   the team\'s key in EGE.teams: every quarterback, back, receiver and tight');
  out.push('   end, in the order they produced that season, with the season\'s line');
  out.push('   beside anybody who had one. The six are not listed -- they');
  out.push('   are put into their rooms by EGE.rosterFor in data/games.js.');
  out.push('   ========================================================================== */');
  out.push('');
  out.push('window.EGE = window.EGE || {};');
  out.push('EGE.rosters = EGE.rosters || {};');

  SEASONS.forEach(function (season) {
    out.push('');
    out.push('EGE.rosters[' + season + '] = {');
    colleges.forEach(function (key, c) {
      const school = EGE.teams[key].school;
      const espnId = sandbox.EGE.espnIds[school];
      const rooms = rosterFor(season, espnId);
      out.push('  ' + key + ': {');
      POSITIONS.forEach(function (position, p) {
        out.push('    ' + position + ': [');
        rooms[position].forEach(function (row, i) {
          const parts = ['name: ' + quote(row.name), 'jersey: ' + row.jersey,
            'height: ' + row.height, 'weight: ' + row.weight];
          if (row.line) { parts.push('line: ' + quote(row.line)); }
          out.push('      { ' + parts.join(', ') + ' }' + (i < rooms[position].length - 1 ? ',' : ''));
        });
        out.push('    ]' + (p < POSITIONS.length - 1 ? ',' : ''));
      });
      out.push('  }' + (c < colleges.length - 1 ? ',' : ''));
      console.log(season + ' ' + school + ': ' + POSITIONS.map(function (p) {
        return p + ' ' + rooms[p].length;
      }).join(', '));
    });
    out.push('};');
  });

  out.push('');
  fs.writeFileSync(OUT, out.join('\n'));
  console.log('written to data/rosters.js');
}

main();
