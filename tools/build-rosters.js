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
   season, best overall first, so a room reads like a depth chart. Their
   season's numbers go into the overall but are not written out: the page
   shows the overall, not the stat line.

   Height and weight are ESPN's latest, not that season's.

   Each player also carries:

   - `year`, his year of college that season, 1 a freshman to 5 a
     fifth-year. Counted from his recruiting class (a junior college
     recruit arrives as a junior), or for a walk-on nobody ranked, from the
     first season ESPN has him in a game log.
   - `overall`, on the six's scale, topping out at 84 for a Heisman season
     and mostly between 50 and 75, so a room can be read the way the six
     are. Nobody publishes one for every college player, so
     it is worked out here from three things (see overallFor below): the
     season he had, how far into college he is, and how highly he was
     recruited -- the 247Sports Composite rating, read by
     tools/recruiting.js and used only as an ingredient, never shown.
   - `espn`, his ESPN id, and `photo: true` when ESPN has his headshot. The
     page asks ESPN's image server for it, like the opponents' logos.
   - `left: true` for a player who went on to play somewhere else. ESPN
     keeps only a player's latest number and headshot, so his are the new
     school's, and EGE.rosterFor lets the teammates who stayed keep theirs
     first when two clash.

   Hand edits are fine afterwards (a walk-on quarterback nobody wants to see
   in the QB Connection list can just be deleted) but a re-run writes over
   them. A new season goes in SEASONS; a new school is picked up from
   data/players.js on its own.
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const { fetchAll, refIds } = require('./espn');
const recruiting = require('./recruiting');
const { loadSiteData } = require('../bot/site-data');

const SEASONS = [2020, 2021];
const POSITIONS = ['QB', 'RB', 'WR', 'TE'];
/* ESPN files a fullback on his own; on the page he is a back. */
const FOLD = { FB: 'RB' };
const OUT = path.join(__dirname, '..', 'data', 'rosters.js');

const CORE = 'https://sports.core.api.espn.com/v2/sports/football/leagues/college-football';

/* The number a room is ordered by, from the category that position is
   judged on, which also feeds the overall. */
const LEADERS = { QB: 'passingYards', RB: 'rushingYards', WR: 'receivingYards', TE: 'receivingYards' };
/* The same categories' full lines -- 280/395, 3862 YDS, 38 TD, 5 INT --
   which ESPN gives for a room's top few. Anybody below them gets his yards. */
const LINES = { passingYards: 'passingLeader', rushingYards: 'rushingLeader', receivingYards: 'receivingLeader' };

/* --- the overall -----------------------------------------------------------

     overall = 50 + 34 x (0.25 x talent + 0.10 x experience + 0.75 x production)

   kept within 40-84. A Heisman season is an 84 and nothing goes past it;
   most players land between 50 and 75.

   talent      the Composite rating coming out of school, 80 and under as
               nothing and 100 as everything; nothing for anybody unranked.
   experience  his year of college, a freshman nothing and a fifth-year all.
   production  his season, as scrimmage yards plus 20 a touchdown, against
               what a Heisman-calibre season at his position comes to (PAR
               below), and no more than all of it. The season before counts
               at four fifths when it was better -- a player is no worse for
               a quiet year, and the FCS played its 2020 in the spring, which
               ESPN does not carry, so Trey Lance's 2019 is his 2020 here.

   Production carries most of it: the weights add up to more than one, so a
   Heisman season reaches the 84 whether or not he was a five-star, and
   nobody gets there on recruiting alone. An FCS school's score counts 85%,
   since its yards came against FCS defenses. On this scale a walk-on
   freshman is a 50, a five-star freshman who has not played about 58, a
   good starter about 70, and DeVonta Smith's 2020 or Bryce Young's 2021
   an 83 or 84. */
const PAR = { QB: 5000, RB: 2000, WR: 1800, TE: 1000 };
const FCS = 0.85;
const BASE = 50;
const SPAN = 34;
const CAP = 84;

function clamp01(n) { return Math.max(0, Math.min(1, n)); }

function overallFor(position, recruit, year, output, fcs) {
  const talent = recruit && typeof recruit.rating === 'number' ? clamp01((recruit.rating - 80) / 20) : 0;
  const experience = clamp01((year - 1) / 4);
  const production = clamp01(output / PAR[position]);
  const score = 0.25 * talent + 0.10 * experience + 0.75 * production;
  return Math.max(40, Math.min(CAP, Math.round(BASE + SPAN * (fcs ? FCS : 1) * score)));
}

/* The touchdowns in a leader line: '167 CAR, 1172 YDS, 15 TD' is 15. */
function touchdowns(text) {
  const found = String(text || '').match(/(\d+) TD/);
  return found ? Number(found[1]) : 0;
}

function quote(text) {
  return "'" + String(text).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
}

/* 6' 3" to inches. */
function inches(text) {
  const found = String(text || '').match(/(\d+)'\s*(\d+)/);
  return found ? Number(found[1]) * 12 + Number(found[2]) : null;
}

/* The first season, of the five before this one, that ESPN has a player in
   a game log for, anywhere -- for a player the Composite never ranked. */
function firstSeason(id, season) {
  const urls = [];
  for (let back = 5; back >= 1; back -= 1) {
    urls.push(CORE + '/seasons/' + (season - back) + '/athletes/' + id + '/eventlog');
  }
  const got = fetchAll(urls);
  for (let i = 0; i < urls.length; i += 1) {
    const log = got.get(urls[i]);
    if (log && log.events && log.events.count) { return season - (5 - i); }
  }
  return season;
}

/* Every leader line in the categories a room is judged on, by athlete. */
function leaderLines(season, espnId) {
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
  return lines;
}

/* Whether a player went on to play somewhere else within three seasons.
   ESPN keeps one number and one headshot per player, his latest, so for a
   player who transferred out they are the new school's -- Jahleel
   Billingsley is #9 on ESPN, for Texas, but Bryce Young was Alabama's 9. */
function leftAfter(id, season, espnId) {
  const urls = [1, 2, 3].map(function (ahead) {
    return CORE + '/seasons/' + (season + ahead) + '/athletes/' + id + '/eventlog';
  });
  const got = fetchAll(urls);
  return urls.some(function (url) {
    const log = got.get(url);
    return Boolean(log && log.events && log.events.count && log.teams &&
      !log.teams[String(espnId)]);
  });
}

function rosterFor(season, espnId, school, index, fcs) {
  const list = fetchAll([CORE + '/seasons/' + season + '/teams/' + espnId + '/athletes?limit=400'])
    .values().next().value;
  const ids = refIds(list && list.items, /athletes\/(\d+)/);
  const urls = ids.map(function (id) { return CORE + '/seasons/' + season + '/athletes/' + id; });
  const got = fetchAll(urls, season + ' roster ' + espnId);

  /* ESPN's list for a season keeps everybody who was ever on the team -- J.T.
     Barrett is on Ohio State's 2020 roster, and Jameson Williams on its 2021
     one after he had gone to Alabama. What gives a season away is the game
     log: a player who was there has games in it, for this team. */
  const logs = fetchAll(urls.map(function (url) { return url + '/eventlog'; }), season + ' game logs ' + espnId);
  function wasThere(url, body) {
    const log = logs.get(url + '/eventlog');
    if (!log || !log.events || !log.events.count) { return false; }
    if (!log.teams || !log.teams[String(espnId)]) { return false; }
    return !(body.draft && body.draft.year && body.draft.year <= season);
  }

  const lines = leaderLines(season, espnId);
  const before = leaderLines(season - 1, espnId);

  /* Scrimmage yards and touchdowns, every way he got them: this season, or
     four fifths of the last one if that was better. */
  function output(id) {
    function total(mine) {
      return Object.keys(mine || {}).reduce(function (sum, key) {
        return sum + (mine[key].value || 0) + 20 * touchdowns(mine[key].text);
      }, 0);
    }
    return Math.max(total(lines[id]), 0.8 * total(before[id]));
  }

  const rooms = {};
  POSITIONS.forEach(function (position) { rooms[position] = []; });
  urls.forEach(function (url, i) {
    const body = got.get(url);
    if (!body || !wasThere(url, body)) { return; }
    const abbr = body.position && body.position.abbreviation;
    const position = FOLD[abbr] || abbr;
    if (!rooms[position]) { return; }
    const line = (lines[ids[i]] || {})[LEADERS[position]] || null;
    const recruit = recruiting.find(index, body.fullName, position, school, season);
    const year = Math.min(5, Math.max(1, recruit ? recruiting.yearsIn(recruit, season)
                                                 : season - firstSeason(ids[i], season) + 1));
    rooms[position].push({
      name: body.fullName,
      espn: ids[i],
      photo: Boolean(body.headshot),
      jersey: body.jersey ? Number(body.jersey) : null,
      height: inches(body.displayHeight),
      weight: body.weight ? Math.round(body.weight) : null,
      year: year,
      left: leftAfter(ids[i], season, espnId),
      overall: overallFor(position, recruit, year, output(ids[i]), fcs),
      value: line ? line.value : 0,
      line: line ? line.text : null
    });
  });

  POSITIONS.forEach(function (position) {
    rooms[position].sort(function (a, b) {
      return (b.overall - a.overall) || (b.value - a.value) || a.name.localeCompare(b.name);
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

  /* Six years of classes before the first season reaches every fifth-year
     on its roster, and a sixth for anybody given an extra year. */
  const index = recruiting.load(Math.min.apply(null, SEASONS) - 6, Math.max.apply(null, SEASONS));

  const out = [];
  out.push('/* ==========================================================================');
  out.push('   EGE Football — the rosters');
  out.push('   Written by tools/build-rosters.js from ESPN; run that again rather than');
  out.push('   editing this by hand (though a hand edit is fine until the next run).');
  out.push('');
  out.push('   The skill players on each of the six\'s college teams, by season and by');
  out.push('   the team\'s key in EGE.teams: every quarterback, back, receiver and tight');
  out.push('   end, best first.');
  out.push('   `year` is his year of college that season (1 a freshman, 5 a');
  out.push('   fifth-year), `overall` his overall on the six\'s scale (how it is worked');
  out.push('   out is at the top of the tool), `espn` his ESPN id and `photo` whether');
  out.push('   ESPN has his headshot. Jersey numbers are ESPN\'s; EGE.rosterFor moves');
  out.push('   anybody wearing one of the six\'s. The six are not listed -- they are');
  out.push('   put into their rooms by EGE.rosterFor in data/games.js.');
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
      /* The Valley is the FCS; everybody else here is FBS. */
      const fcs = EGE.teams[key].league === 'Missouri Valley';
      const rooms = rosterFor(season, espnId, school, index, fcs);
      out.push('  ' + key + ': {');
      POSITIONS.forEach(function (position, p) {
        out.push('    ' + position + ': [');
        rooms[position].forEach(function (row, i) {
          const parts = ['name: ' + quote(row.name), 'jersey: ' + row.jersey,
            'year: ' + row.year, 'overall: ' + row.overall,
            'height: ' + row.height, 'weight: ' + row.weight, 'espn: ' + row.espn];
          if (row.photo) { parts.push('photo: true'); }
          if (row.left) { parts.push('left: true'); }
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
