/* ==========================================================================
   EGE Football NFL sim — the 2031 draft class
   Writes the 2031 class into nfl-sim/data/prospects.json, after the 2030
   class (Sam, 2026-11-23: "This again should be a fictional one. The only
   new change I'd like for you to make is use their real name but make up
   their position and skill. Also again make up their college. All of the
   top prospects should be going to bigger football programs while some of
   the late prospects should be going to smaller programs."):

     node nfl-sim/build/class-2031.js

   The class is made the 2030 class's way (build/class-2030.js), with one
   change: each prospect goes by his own name.

   - His picture is a real ESPN college headshot of a 2026 college player
     that is nowhere else on the site (build/class-2031-sources.json), and
     his name is that player's.
   - Everything else about him is made up. His position suits the build in
     the picture and is another than the one he plays in college whenever
     a picture is left for that (a receiver may be a corner, a guard a
     defensive tackle, a tight end a pass rusher), and the positions take turns by their share
     of a real class, premium ones first in the first round and kickers not
     before pick 180.
   - His school is real but never his own: the top of the class mostly from
     the best programs (Ohio State, Georgia, Alabama, Notre Dame, Miami ...),
     the late rounds more and more from smaller ones, Division II among
     them.
   - His skills are his own: an archetype that suits his build, given as a
     lean on each skill (`style`) and a forty time for the skill that is
     speed, so the Mock Draft shows the archetype he is drafted with.

   The class is as strong as 2030's (prospects.json `lift`), and nobody's
   draft-night overall is set. Where anyone goes is still the sim's draft.
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const { read, download } = require('./nflverse');
const { rows } = require('./write');
const { hash, seeded } = require('../lib/rng');
const c27 = require('./class-2027');
const c28 = require('./class-2028');
const c30 = require('./class-2030');

const YEAR = 2031;
const ROOT = path.join(__dirname, '..', '..');
const DATA = path.join(__dirname, '..', 'data', 'prospects.json');
const SOURCES = require('./class-2031-sources.json');
const SIZE = 320;
/* Points on every pick's overall and ceiling, against the 2027 class: the
   same as 2028's, 2029's and 2030's. */
const LIFT = 1.5;
const TOP_BUILD = 64;
const MIX = c28.MIX;
const { BUILD, FIRST_ROUND, KICKERS_FROM, ELITE, SCHOOL_MOST, archetypeOdds, styleFor } = c30;
/* Each tier's share of a stretch of the class, [last pick, elite, power,
   small, Division II]: the 2030 class's, but the whole first round from the
   best programs ("All of the top prospects should be going to bigger
   football programs"). */
const TIERS = [[32, 1, 0, 0, 0], [64, 0.85, 0.15, 0, 0]].concat(c30.TIERS.slice(2));

/* The six go by their own names; nobody in the class shares one. */
const SIX = ['Sam Stogsdill', 'Cooper Clark', 'Paxon Hatch', 'Andrew Parr', 'Isaac Vitel', 'Jaykeb Stewart'];

/* -------------------------------------------------------------- schools -- */

/* The 2030 class's schools, less every school a picture came from, so no
   one is listed at the school he really plays for. */
const PHOTO_SCHOOLS = new Set(SOURCES.photos.groups.map((g) => g.school).concat(SOURCES.unchecked.school,
  ['Kent State', 'UMass', 'Bowling Green', 'Eastern Michigan', 'Ferris State']));
const away = (list) => list.filter((s) => !PHOTO_SCHOOLS.has(s));
const POWER = away(c30.POWER);
const SMALL = away(c30.SMALL);
const D2 = away(c30.D2);

/* ------------------------------------------------------------ positions -- */

/* The positions his college position is, in the sim's terms. */
const PLAYS = { QB: ['QB'], RB: ['RB'], FB: ['RB', 'TE'], WR: ['WR'], TE: ['TE'], OL: ['OT', 'IOL'], OT: ['OT', 'IOL'],
  G: ['IOL'], C: ['IOL'], DL: ['EDGE', 'DI'], DE: ['EDGE', 'DI'], DT: ['DI'], LB: ['LB'], CB: ['CB'], S: ['S'],
  DB: ['CB', 'S'], PK: ['K'], P: ['K'] };

/* The positions a player of this build could play, by height and weight
   alone. */
function byBuild(h, w) {
  const out = [];
  const add = (pos, ok) => { if (ok !== false) { out.push(pos); } };
  if (w >= 300) { add('IOL'); add('DI'); add('OT', h >= 76); }
  else if (w >= 280) { add('DI'); add('IOL'); add('OT', h >= 78); add('EDGE', w <= 285 && h >= 76); }
  else if (w >= 260) { add('EDGE'); add('DI'); add('TE', h >= 75); add('IOL', w >= 275); }
  else if (w >= 240) { add('EDGE'); add('TE', h >= 74); add('LB', w <= 252); }
  else if (w >= 225) { add('LB'); add('TE', h >= 75); add('RB', h <= 73); add('EDGE', h >= 76); add('QB', h >= 75); }
  else if (w >= 210) { add('S'); add('LB', w >= 218); add('RB', h <= 73); add('WR', h >= 73); add('QB', h >= 74); }
  else if (w >= 190) { add('CB'); add('S'); add('WR'); add('RB', h <= 72); add('QB', h >= 74); }
  else { add('CB'); add('WR'); add('S', h >= 72); }
  add('K', w >= 175 && w <= 215);
  return out;
}

/* Where the player in a picture could line up, by his build. */
function fitsAs(photo) {
  if (!photo.height || !photo.weight) { return c30.fitsAs(photo); }
  return byBuild(photo.height, photo.weight);
}

/* Whether that would be the position he really plays. */
function same(photo, pos) { return (PLAYS[photo.roster] || []).indexOf(pos) !== -1; }

/* ---------------------------------------------------- earlier pictures -- */

/* Every ESPN id the site already shows a picture for: the earlier draft
   classes, the kickoff league, the college rosters and season files, and
   every NFL player nflverse knows (not this class as last built, nor a
   later class, so a rebuild deals the same pictures). */
function onTheSite(all, nflPlayers) {
  const ids = new Set();
  Object.keys(all.classes).filter((y) => Number(y) < YEAR).forEach((y) => {
    all.classes[y].forEach((pr) => { if (pr.espn) { ids.add(String(pr.espn)); } });
  });
  const files = [];
  const add = (dir, test) => {
    const full = path.join(ROOT, dir);
    if (!fs.existsSync(full)) { return; }
    fs.readdirSync(full).filter((n) => test.test(n)).forEach((n) => files.push(path.join(full, n)));
  };
  add('nfl-sim/data', /^(?!prospects\.json$).*\.json$/);
  add('data', /\.(js|json)$/);
  add('stats', /\.js$/);
  files.forEach((file) => {
    const text = fs.readFileSync(file, 'utf8');
    const re = /"?espn"?\s*:\s*"?(\d{4,9})/g;
    let m;
    while ((m = re.exec(text))) { ids.add(m[1]); }
  });
  nflPlayers.forEach((p) => { if (p.espn_id) { ids.add(String(p.espn_id)); } });
  return ids;
}

/* The pictures, checked ones first (in an order of their own), then the
   ones read off a summary of a roster page, used only when nothing checked
   fits. Anyone whose picture is already on the site, or whose name someone
   in the league or an earlier class already has, is left out. */
function photos(skip, taken) {
  const parse = (from, checked) => (line) => {
    const [espn, name, roster, height, weight] = line.split('|');
    return { espn, name, roster, height: Number(height) || null, weight: Number(weight) || null, from, checked };
  };
  const order = (a, b) => hash('photo:' + YEAR + ':' + a.espn) - hash('photo:' + YEAR + ':' + b.espn);
  const ok = (ph) => !skip.has(ph.espn) && !taken.has(c27.norm(ph.name));
  const checked = [];
  SOURCES.photos.groups.forEach((g) => g.players.forEach((line) => checked.push(parse(g.school, true)(line))));
  const rest = SOURCES.unchecked.players.map(parse(SOURCES.unchecked.school, false));
  const seen = new Set();
  return checked.filter(ok).sort(order).concat(rest.filter(ok).sort(order))
    .filter((ph) => (seen.has(ph.espn) ? false : seen.add(ph.espn)));
}

/* ---------------------------------------------------------------- deal -- */

/* Schools: the tier by where he is picked, then a school in it that is not
   his own. A tier-one school is the one furthest short of its share, give
   or take a little, so the best programs send the most, none past
   SCHOOL_MOST; the other tiers are a draw. */
function schooler() {
  const rng = seeded('schools:' + YEAR);
  const count = {};
  const tiers = [Object.keys(ELITE), POWER, SMALL, D2];
  return function (n) {
    const row = TIERS.find((t) => n <= t[0]);
    const tier = rng.pick([0, 1, 2, 3], (i) => row[i + 1]);
    let school = null;
    if (tier === 0) {
      let best = Infinity;
      tiers[0].forEach((s) => {
        if ((count[s] || 0) >= SCHOOL_MOST) { return; }
        const short = ((count[s] || 0) + 0.3 + rng() * 1.2) / ELITE[s];
        if (short < best) { best = short; school = s; }
      });
    } else {
      school = rng.pick(tiers[tier], (s) => ((count[s] || 0) >= SCHOOL_MOST ? 0 : 1));
    }
    count[school] = (count[school] || 0) + 1;
    return school;
  };
}

/* ------------------------------------------------------------- the class -- */

function main() {
  const { preview } = require('../lib/draft');
  download('players.csv');
  const all = JSON.parse(fs.readFileSync(DATA, 'utf8'));
  delete all.classes[YEAR];
  const nflPlayers = read('players.csv');

  /* Names that are already somebody's on the site: every NFL player, every
     earlier prospect, everyone in the kickoff league and the six. */
  const taken = new Set(SIX.map(c27.norm));
  nflPlayers.forEach((p) => {
    taken.add(c27.norm(p.display_name));
    if (p.first_name && p.last_name) { taken.add(c27.norm(p.first_name + ' ' + p.last_name)); }
  });
  Object.keys(all.classes).filter((y) => Number(y) < YEAR)
    .forEach((y) => all.classes[y].forEach((pr) => taken.add(c27.norm(pr.name))));
  JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'league-2023.json'), 'utf8')).players
    .forEach((p) => taken.add(c27.norm(p.name)));

  const pool = photos(onTheSite(all, nflPlayers), taken);
  const school = schooler();
  const rng = seeded('made-up:' + YEAR);

  /* The class, pick by pick. Next is the position furthest short of its
     share (the premium ones sooner in the first round) that a picture is
     left for. */
  const total = Object.keys(MIX).reduce((a, k) => a + MIX[k], 0);
  const counts = {};
  const out = [];
  const missed = [];
  while (out.length < SIZE) {
    const n = out.length + 1;
    let pos = null;
    let best = Infinity;
    Object.keys(MIX).forEach((p) => {
      if (p === 'K' && n < KICKERS_FROM) { return; }
      const lean = n <= 32 ? FIRST_ROUND[p] : 1;
      if (!lean || !pool.some((ph) => fitsAs(ph).indexOf(p) !== -1)) { return; }
      const share = ((counts[p] || 0) + 1) / (MIX[p] / total * lean);
      if (share < best) { best = share; pos = p; }
    });
    if (!pos) { break; }
    /* The top two rounds get the checked pictures nearest an NFL build for
       the position, of the next few that fit. */
    const [height, weight, light, heavy] = BUILD[pos];
    let fits = pool.map((ph, i) => i).filter((i) => fitsAs(pool[i]).indexOf(pos) !== -1);
    /* A checked picture, if any fits; of those, someone who plays another
       position in college, if any is left. */
    if (fits.some((i) => pool[i].checked)) { fits = fits.filter((i) => pool[i].checked); }
    if (fits.some((i) => !same(pool[i], pos))) { fits = fits.filter((i) => !same(pool[i], pos)); }
    fits = fits.slice(0, n <= TOP_BUILD ? 10 : 1);
    const off = (ph) => Math.abs((ph.height || height) - height) + Math.abs((ph.weight || weight) - weight) / 8;
    const at = fits.reduce((a, b) => (off(pool[b]) < off(pool[a]) ? b : a));
    const photo = pool.splice(at, 1)[0];
    const tall = photo.height ? Math.max(height - 4, Math.min(height + 4, photo.height)) : height + rng.int(-1, 1);
    const listed = Math.min(heavy, Math.max(light, (photo.weight || weight) + rng.int(0, 8)));
    const age = rng.pick([21, 22, 23], (a) => ({ 21: 3, 22: 4.5, 23: 2.5 }[a]));
    const born = (YEAR - age) + '-' + String(rng.int(1, 8)).padStart(2, '0') + '-' + String(rng.int(1, 28)).padStart(2, '0');
    const pr = {
      id: 'made:' + YEAR + ':' + photo.espn,
      name: photo.name,
      pos,
      college: c27.shown(school(n)),
      espn: photo.espn,
      collegePhoto: true,
      madeUp: true,
      born,
      age,
      height: tall,
      weight: listed,
      forty: null,
      grade: n,
      realPeak: null
    };
    /* His archetype, and the skills that make him one: drawn again until
       lib/skills.js names him the same. */
    const odds = archetypeOdds(pos, tall, listed);
    const want = rng.pick(Object.keys(odds), (a) => odds[a]);
    for (let tries = 0; tries < 40; tries += 1) {
      const { style, forty } = styleFor(pos, want, rng);
      pr.style = style;
      pr.forty = forty;
      if (preview(pr, YEAR, LIFT).archetype === want) { break; }
      if (tries === 39) { missed.push(pr.name + ' (' + want + ')'); }
    }
    out.push(pr);
    counts[pos] = (counts[pos] || 0) + 1;
  }
  if (out.length < SIZE) { throw new Error('Only ' + out.length + ' pictures fit'); }

  all.classes[YEAR] = out;
  all.lift = Object.assign({}, all.lift, { [YEAR]: LIFT });
  fs.writeFileSync(DATA, rows(all, '') + '\n');
  const schools = {};
  out.forEach((pr) => { schools[pr.college] = (schools[pr.college] || 0) + 1; });
  process.stderr.write('Wrote nfl-sim/data/prospects.json: ' + out.length + ' prospects in ' + YEAR + ', ' +
                       pool.length + ' pictures left over\n');
  process.stderr.write('By position: ' + Object.keys(counts).map((k) => k + ' ' + counts[k]).join(', ') + '\n');
  process.stderr.write('Schools (' + Object.keys(schools).length + '): ' + Object.keys(schools)
    .sort((a, b) => schools[b] - schools[a]).map((k) => k + ' ' + schools[k]).join(', ') + '\n');
  if (missed.length) { process.stderr.write('Archetype not reached: ' + missed.join(', ') + '\n'); }
}

if (require.main === module) { main(); }

module.exports = { fitsAs, byBuild, same, PLAYS };
