/* ==========================================================================
   EGE Football NFL sim — the 2029 draft class
   Writes the 2029 class into nfl-sim/data/prospects.json, after the 2028
   class (Sam, 2026-11-09: "We need to create the 2029 Draft class ... some
   players that do have headshots that we can use, but I also want to add
   some fictional players ... headshots on ESPN from players that don't
   have an active headshot on the egefootball website that are DII or
   small school programs that would be unrecognizable ... fake names,
   generated colleges and positions, skills, age ... This draft class
   should be decent, but nothing too crazy"):

     node nfl-sim/build/class-2029.js

   The 2029 draft is two and a half years off, so no mock drafts or boards
   are out yet. The class is built in three layers:

   1. The top of it: the best freshmen of the 2026 season (ESPN's ranking)
      and the best-ranked high school recruits of 2026 and 2025, by their
      average spot on those lists (build/class-2029-sources.json).
   2. Then the first- and second-year college players with the most to show
      in 2026 (and 2025) at each position, read off cfbfastR's play-by-play
      the way the 2028 class was, the positions taking turns by their share
      of a real class.
   3. And through all of it, 48 made-up prospects at set places (MADE_UP):
      a name, school, position, age, height and weight of their own, with
      the ESPN college headshot of a player at a small FCS program who has
      no picture anywhere else on the site. Each picture goes to a position
      that suits the build of the player in it.

   Nobody from an earlier class is in it, by ESPN id or by name, and no one
   who was a junior or older in 2026 (he goes in 2028). The real players'
   ESPN ids, heights, weights and classes come from cfbfastR's 2026 college
   rosters, as for 2027 and 2028; every prospect is `collegePhoto`, so the
   site shows his college headshot in the NFL too.

   The class is as strong as 2028's: a point and a half above 2027 at every
   pick (prospects.json `lift`), and nobody's draft-night overall is set.
   Where anyone goes is still the sim's draft, by its own order and every
   team's needs.
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const { read, download } = require('./nflverse');
const { rows } = require('./write');
const { hash, seeded } = require('../lib/rng');
const c27 = require('./class-2027');
const c28 = require('./class-2028');

const YEAR = 2029;
const ROOT = path.join(__dirname, '..', '..');
const DATA = path.join(__dirname, '..', 'data', 'prospects.json');
const SOURCES = require('./class-2029-sources.json');
const SIZE = 320;
/* Points on every pick's overall and ceiling, against the 2027 class: the
   same as 2028's. */
const LIFT = 1.5;
/* Where a list leaves a player out, and the furthest down one outlet's
   recruiting rank counts. */
const MISSING = 32;
const DEEPEST = 40;
/* Kickers go in the late rounds. */
const KICKERS_FROM = 180;
const MIX = c28.MIX;

/* How many made-up prospects in each stretch of the class: one in the
   first round, a few on day two, the most on day three. */
const MADE_UP = [[1, 32, 1], [33, 64, 3], [65, 96, 5], [97, 160, 12], [161, 224, 13], [225, 320, 14]];

/* ---------------------------------------------------------------- names -- */

/* A player the lists call another way than the rosters do. */
const ROSTER_NAME = { 'tristen keys': 'tk keys', 'sj alofaituli': 'seuseu alofaituli' };
/* The same player written another way, and how the rosters spell him. */
const ALIAS = { 'ezavier crowell': 'ej crowell', 'jalen lot': 'jalen lott' };
const SPELLED = { 'jalen lott': 'Jalen Lott' };
/* A player the rosters have twice at one school: which one he is. */
const PINNED = { 'anthony jones': '5158983' };
function key(name) {
  const k = c28.key(name);
  return ALIAS[k] || k;
}

const POS = { DE: 'EDGE', DT: 'DI', OLB: 'LB', OG: 'IOL', OL: 'OT' };
function simPos(text) { return POS[text] || c27.simPos(text) || null; }

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

/* Every ESPN id the site already shows a picture for: the draft classes,
   the kickoff league, the college rosters and season files. */
function onTheSite() {
  const ids = new Set();
  const files = [];
  const add = (dir, test) => {
    const full = path.join(ROOT, dir);
    if (!fs.existsSync(full)) { return; }
    fs.readdirSync(full).filter((n) => test.test(n)).forEach((n) => files.push(path.join(full, n)));
  };
  add('nfl-sim/data', /\.json$/);
  add('data', /\.(js|json)$/);
  add('stats', /\.js$/);
  files.forEach((file) => {
    const text = fs.readFileSync(file, 'utf8');
    const re = /"?espn"?\s*:\s*"?(\d{4,9})/g;
    let m;
    while ((m = re.exec(text))) { ids.add(m[1]); }
  });
  return ids;
}

/* --------------------------------------------------------------- lists -- */

/* The freshmen and recruits the lists name, best average spot first. */
function named() {
  const byKey = new Map();
  const get = (name, from) => {
    const k = key(name);
    return byKey.get(k) || byKey.set(k, { key: k, name: SPELLED[k] || name, school: c28.school(from), positions: [] }).get(k);
  };
  SOURCES.freshmen.ranks.forEach((line) => {
    const [n, name, pos, from] = line.split('|');
    const p = get(name, from);
    p.fresh = Number(n);
    p.positions.unshift(simPos(pos));
  });
  SOURCES.recruits.forEach((list) => {
    list.players.forEach((line) => {
      const [name, pos, from, ranks] = line.split('|');
      const p = get(name, from);
      const spots = ranks.split(',').map(Number).filter((x) => x > 0).map((x) => Math.min(x, DEEPEST));
      const spot = spots.length ? spots.reduce((a, b) => a + b, 0) / spots.length : DEEPEST;
      if (p.recruit === undefined || spot < p.recruit) { p.recruit = spot; p.recruitClass = list.class; }
      if (simPos(pos)) { p.positions.push(simPos(pos)); }
    });
  });
  const out = Array.from(byKey.values());
  out.forEach((p) => {
    const fresh = p.fresh || MISSING;
    const recruit = p.recruit === undefined ? MISSING : p.recruit;
    p.score = (fresh + recruit) / 2;
    p.best = Math.min(fresh, recruit);
    p.pos = p.positions[0] || null;
  });
  return out.sort((a, b) => a.score - b.score || a.best - b.best);
}

/* ------------------------------------------------------------ production -- */

/* The college players with the most to show, by position: first- and
   second-year players at schools that play FBS football (the 2028 class's
   way, a year younger). */
function depth(roster, stats, taken) {
  const byPos = {};
  const linemen = new Map();
  roster.forEach((r) => {
    const year = Number(r.year);
    if (year !== 1 && year !== 2) { return; }
    if (taken.has(r.athlete_id)) { return; }
    const pos = c28.rosterPos(r);
    if (!pos || !MIX[pos]) { return; }
    const team = stats[0].teams.get(r.team);
    const conf = team ? c28.CONFERENCE[team.conference] : undefined;
    if (!conf) { return; }
    if (pos === 'OT' || pos === 'IOL') {
      /* No stats for linemen: his offense's yards a game, the older and
         bigger of a school's linemen first, two at most from one school. */
      const ypg = team.yards / Math.max(1, team.games.size);
      const score = ypg * conf + (year === 2 ? 25 : 0) + (Number(r.weight) || 0) / 20;
      (linemen.get(r.team) || linemen.set(r.team, []).get(r.team)).push({ r, pos, score });
      return;
    }
    const now = stats[0].players.get(r.athlete_id) || {};
    const before = stats[1].players.get(r.athlete_id) || {};
    const score = (c28.production(pos, now) + 0.7 * c28.production(pos, before)) * conf;
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

/* -------------------------------------------------------------- made up -- */

const FIRST = ['Adrian', 'Amari', 'Ambrose', 'Anders', 'Arlo', 'Augustin', 'Beckett', 'Boden', 'Brennan', 'Callum', 'Cassius', 'Cedric',
  'Corbin', 'Cortez', 'Dalton', 'Damarion', 'Dashiell', 'Dashon', 'Desmond', 'Dorian', 'Ellison', 'Emeka', 'Emory', 'Everett', 'Ezra',
  'Fabian', 'Finnegan', 'Gideon', 'Greer', 'Harlan', 'Hollis', 'Idris', 'Jabari', 'Jericho', 'Jonas', 'Josiah', 'Jovan', 'Kairo',
  'Kasen', 'Keegan', 'Keldrick', 'Kellan', 'Kofi', 'Lachlan', 'Lamonte', 'Landry', 'Lennox', 'Malcolm', 'Marcel', 'Matthias',
  'Montez', 'Nasir', 'Niko', 'Obadiah', 'Orion', 'Osei', 'Pierce', 'Quentin', 'Rafferty', 'Reuben', 'Rhett', 'Ronan', 'Rowan',
  'Santino', 'Silas', 'Soren', 'Sterling', 'Tariq', 'Thaddeus', 'Tobias', 'Torin', 'Ulysses', 'Valentin', 'Vance', 'Wendell',
  'Weston', 'Xander', 'Yusuf', 'Zaire', 'Zeke', 'Amos', 'Benedict', 'Caspian', 'Darnell', 'Jaxon', 'Cyrus', 'Ignatius', 'Kenji'];
const LAST = ['Abernathy', 'Adeyemi', 'Ainsworth', 'Alcott', 'Arceneaux', 'Asante', 'Ashford', 'Bancroft', 'Barlowe', 'Beaumont',
  'Blackwell', 'Boudreaux', 'Bramlett', 'Broussard', 'Calloway', 'Carrow', 'Castellano', 'Chamberlain', 'Corwin', 'Crenshaw',
  'Dabney', 'Delacroix', 'Desrosiers', 'Draper', 'Dunleavy', 'Eastwood', 'Ekwueme', 'Ellsworth', 'Fairbanks', 'Faleolo', 'Fenwick',
  'Fonoti', 'Fontenot', 'Gallion', 'Garrity', 'Guidry', 'Haddix', 'Halvorsen', 'Hargrove', 'Holloway', 'Huxley', 'Ibekwe',
  'Ingersoll', 'Jaramillo', 'Kaczmarek', 'Kealoha', 'Kingsley', 'Lachance', 'Landreneau', 'Langford', 'Lockhart', 'Lowell', 'Mabry',
  'Mahoe', 'Mancuso', 'Mbeki', 'Montague', 'Nakamura', 'Nwosu', 'Oakley', 'Okonjo', 'Okoro', 'Pemberton', 'Quarterman',
  'Radcliffe', 'Ravenell', 'Redfield', 'Rourke', 'Salcedo', 'Satterfield', 'Sherwood', 'Silvestri', 'Strickland', 'Tennyson',
  'Thornbury', 'Tuilagi', 'Underhill', 'Vandermeer', 'Velasquez', 'Wainwright', 'Wexford', 'Whitlock', 'Yarborough', 'Zeller'];
/* Schools that do not exist. */
const SCHOOLS = ['Bramwell State', 'Red Mesa State', 'Copper Basin', 'Harlan Falls', 'Kestrel Valley', 'Marlow A&M', 'Grayford',
  'Tallow Creek State', 'Sycamore Bend', 'Port Calder', 'Ashcombe', 'Juniper State', 'Northgate Tech', 'Lone Prairie State',
  'Saint Aldric', 'Hollister Tech', 'Mount Carrow', 'East Briar', 'Wolf Hollow State', 'Fairbrook', 'Pinecrest A&M',
  'Calloway State', 'Riverbend', 'Dunmore State'];
/* An NFL build at each position: height, weight, and the lightest and
   heaviest a made-up prospect there is listed at. */
const BUILD = {
  QB: [75, 218, 205, 240], RB: [70, 210, 195, 228], WR: [73, 195, 180, 222], TE: [77, 248, 238, 265], OT: [78, 312, 300, 335],
  IOL: [76, 310, 298, 330], EDGE: [76, 255, 242, 275], DI: [75, 302, 285, 330], LB: [73, 232, 222, 245], CB: [72, 190, 180, 200],
  S: [72, 203, 192, 215]
};

/* The positions the player in a picture could play, by his build. */
function fitsAs(photo) {
  const w = photo.weight;
  switch (photo.roster) {
    case 'QB': return ['QB'];
    case 'RB': return ['RB'];
    case 'WR': return w && w > 200 ? ['WR'] : ['WR', 'CB'];
    case 'TE': return ['TE'];
    case 'OL': return photo.height >= 77 ? ['OT'] : ['IOL'];
    case 'DE': case 'DL': case 'DT':
      if (w >= 280) { return ['DI']; }
      if (w && w < 255) { return ['EDGE']; }
      if (!w) { return photo.roster === 'DE' ? ['EDGE'] : ['DI', 'EDGE']; }
      return ['EDGE', 'DI'];
    case 'LB': return w && w >= 230 ? ['LB', 'EDGE'] : ['LB'];
    case 'CB': return ['CB'];
    case 'DB': return ['CB', 'S'];
    case 'S': return ['S'];
    default: return [];
  }
}

function photos(skip) {
  return SOURCES.photos.players.map((line) => {
    const [espn, roster, height, weight] = line.split('|');
    return { espn, roster, height: Number(height) || null, weight: Number(weight) || null };
  }).filter((x) => !skip.has(x.espn)).sort((a, b) => hash('photo:' + a.espn) - hash('photo:' + b.espn));
}

function shuffled(list, rng) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/* The made-up names and schools, dealt out in turn: no first or last name
   used twice, nobody named like anyone in college football or the NFL,
   and two prospects from each school. */
function dealer(taken) {
  const rng = seeded('made-up:' + YEAR);
  const first = shuffled(FIRST, rng);
  const last = shuffled(LAST, rng);
  const schools = shuffled(SCHOOLS, rng);
  let made = 0;
  return {
    rng,
    name() {
      for (;;) {
        const name = first.shift() + ' ' + last.shift();
        if (!taken.has(c27.norm(name))) { taken.add(c27.norm(name)); return name; }
      }
    },
    school() { made += 1; return schools[(made - 1) % schools.length]; }
  };
}

function madeUp(photo, pos, deal) {
  const id = 'made:' + YEAR + ':' + photo.espn;
  const [height, weight, light, heavy] = BUILD[pos];
  const rng = deal.rng;
  const age = [21, 22, 22, 23][Math.floor(rng() * 4)];
  const month = 1 + Math.floor(rng() * 8);
  const listed = Math.min(heavy, Math.max(light, (photo.weight || weight) + Math.floor(rng() * 9)));
  const tall = photo.height || height + Math.floor(rng() * 3) - 1;
  return {
    id,
    name: deal.name(),
    pos,
    college: c27.shown(deal.school()),
    espn: photo.espn,
    collegePhoto: true,
    madeUp: true,
    born: (YEAR - age) + '-0' + month + '-15',
    age,
    height: tall,
    weight: listed,
    forty: null,
    grade: 0,
    realPeak: null
  };
}

/* Where the made-up prospects go: spread through each stretch. */
function madeUpSlots() {
  const slots = new Set();
  MADE_UP.forEach(([from, to, n]) => {
    const size = to - from + 1;
    for (let i = 0; i < n; i += 1) {
      const lo = from + Math.floor(size * i / n);
      const hi = from + Math.floor(size * (i + 1) / n) - 1;
      slots.add(lo + (hash('slot:' + YEAR + ':' + lo) % (hi - lo + 1)));
    }
  });
  return slots;
}

/* -------------------------------------------------------------- the class -- */

/* Each real prospect's school as the rosters name it. */
const rosterTeam = new Map();

function prospect(p, r, pos) {
  const espn = r ? String(r.athlete_id) : null;
  if (r) { rosterTeam.set(espn, r.team); }
  const id = espn ? 'espn:' + espn : 'draft:' + YEAR + ':' + p.key.replace(/ /g, '-');
  /* His class in the 2028 season, the last before the draft. */
  const year = r ? Number(r.year) + 2 : 4;
  const age = (year >= 4 ? 22 : 21) + (hash(id) % 3 === 0 ? 1 : 0);
  const month = 1 + (hash(id + ':born') % 8);
  return {
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
}

function main() {
  download('cfb_player_stats_2026.csv');
  download('cfb_player_stats_2025.csv');
  const all = JSON.parse(fs.readFileSync(DATA, 'utf8'));
  delete all.classes[YEAR];
  const before = earlier(all);
  const indexes = [c27.rosterIndex(2026), c27.rosterIndex(2025)];
  const roster = read('cfb_rosters_2026.csv');
  const used = new Set();
  const left = [];
  const older = [];
  const unmatched = [];
  const noPhoto = [];
  /* Players ESPN shows no headshot for, on the rosters checked. */
  const bare = new Set(SOURCES.headshots.missing);
  const checked = new Set(Object.keys(SOURCES.headshots.rosters));

  /* A named player, if he belongs in this class: never one without an
     ESPN headshot. */
  function take(p) {
    if (used.has(p.key)) { return null; }
    if (before.names.has(p.key)) { left.push(p.name); return null; }
    const r = PINNED[p.key] ? roster.find((x) => x.athlete_id === PINNED[p.key]) :
      c27.rosterRow(Object.assign({}, p, { key: ROSTER_NAME[p.key] || p.key }), p.pos, indexes);
    if (r && used.has(String(r.athlete_id))) { return null; }
    if (r && before.ids.has(String(r.athlete_id))) { left.push(p.name); return null; }
    /* His class in 2026, from whichever season's roster has him. */
    if (r && Number(r.year) + 2026 - Number(r.season) >= 3) { older.push(p.name); return null; }
    if (!r) { unmatched.push(p.name + ' (' + p.school + ')'); return null; }
    if (bare.has(String(r.athlete_id))) { noPhoto.push(p.name); return null; }
    const pos = p.pos || (r && c28.rosterPos(r)) || 'WR';
    used.add(p.key);
    if (r) { used.add(String(r.athlete_id)); }
    return prospect(p, r, pos);
  }

  const top = [];
  named().forEach((p) => { const pr = take(p); if (pr) { top.push(pr); } });

  /* The rest, position by position. */
  const taken = new Set(before.ids);
  const stats = [c28.seasonStats(2026), c28.seasonStats(2025)];
  const deep = depth(roster, stats, taken);
  const queues = {};
  Object.keys(MIX).forEach((pos) => {
    queues[pos] = [];
    (deep[pos] || []).forEach((x) => {
      const p = { key: key(x.r.first_name + ' ' + x.r.last_name), name: x.r.first_name + ' ' + x.r.last_name, school: x.r.team, pos };
      if (used.has(String(x.r.athlete_id)) || used.has(p.key) || before.names.has(p.key)) { return; }
      if (bare.has(String(x.r.athlete_id))) { noPhoto.push(p.name); return; }
      used.add(p.key);
      used.add(String(x.r.athlete_id));
      queues[pos].push(prospect(p, x.r, pos));
    });
  });

  /* The made-up prospects' pictures and names: nobody else's. */
  const site = onTheSite();
  const pool = photos(new Set(Array.from(site).concat(Array.from(used))));
  const names = new Set();
  [2024, 2025, 2026].forEach((y) => read('cfb_rosters_' + y + '.csv').forEach((r) => names.add(c27.norm(r.first_name + ' ' + r.last_name))));
  Object.keys(all.classes).forEach((y) => all.classes[y].forEach((pr) => names.add(c27.norm(pr.name))));
  JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'league-2023.json'), 'utf8')).players
    .forEach((p) => names.add(c27.norm(p.name)));
  const slots = madeUpSlots();
  const deal = dealer(names);

  /* The class, pick by pick. The positions take turns where no list
     decides: next is the one furthest short of its share. */
  const total = Object.keys(MIX).reduce((a, k) => a + MIX[k], 0);
  const counts = {};
  const next = (ok) => {
    let pick = null;
    let best = Infinity;
    Object.keys(MIX).forEach((pos) => {
      if (!ok(pos)) { return; }
      const share = ((counts[pos] || 0) + 1) / (MIX[pos] / total);
      if (share < best) { best = share; pick = pos; }
    });
    return pick;
  };
  const out = [];
  while (out.length < SIZE) {
    const n = out.length + 1;
    let pr = null;
    if (slots.has(n)) {
      const pos = next((x) => x !== 'K' && pool.some((ph) => fitsAs(ph).indexOf(x) !== -1));
      const at = pos ? pool.findIndex((ph) => fitsAs(ph).indexOf(pos) !== -1) : -1;
      if (at !== -1) { pr = madeUp(pool.splice(at, 1)[0], pos, deal); }
    }
    if (!pr && top.length) { pr = top.shift(); }
    if (!pr) {
      const pos = next((x) => queues[x].length && !(x === 'K' && n < KICKERS_FROM));
      if (!pos) { break; }
      pr = queues[pos].shift();
    }
    pr.grade = n;
    out.push(pr);
    counts[pr.pos] = (counts[pr.pos] || 0) + 1;
  }

  all.classes[YEAR] = out;
  all.lift = Object.assign({}, all.lift, { [YEAR]: LIFT });
  fs.writeFileSync(DATA, rows(all, '') + '\n');
  const made = out.filter((pr) => pr.madeUp);
  const photographed = out.filter((pr) => pr.collegePhoto).length;
  process.stderr.write('Wrote nfl-sim/data/prospects.json: ' + out.length + ' prospects in ' + YEAR + ', ' + photographed +
                       ' with an ESPN headshot, ' + made.length + ' made up\n');
  process.stderr.write('By position: ' + Object.keys(counts).map((k) => k + ' ' + counts[k]).join(', ') + '\n');
  process.stderr.write('In an earlier class, left out (' + left.length + '): ' + left.join(', ') + '\n');
  process.stderr.write('Juniors or older in 2026, left out (' + older.length + '): ' + older.join(', ') + '\n');
  if (unmatched.length) { process.stderr.write('No ESPN id, left out: ' + unmatched.join(', ') + '\n'); }
  process.stderr.write('No ESPN headshot, left out (' + noPhoto.length + '): ' + noPhoto.join(', ') + '\n');
  const unchecked = {};
  out.filter((pr) => !pr.madeUp && !checked.has(rosterTeam.get(pr.espn))).forEach((pr) => {
    const team = rosterTeam.get(pr.espn);
    unchecked[team] = (unchecked[team] || 0) + 1;
  });
  if (Object.keys(unchecked).length) {
    process.stderr.write('Rosters not checked for headshots yet (' + Object.keys(unchecked).length + '): ' +
                         Object.keys(unchecked).map((k) => k + ' ' + unchecked[k]).join(', ') + '\n');
  }
}

if (require.main === module) { main(); }

module.exports = { named, madeUpSlots, fitsAs };
