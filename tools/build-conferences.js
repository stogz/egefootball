/* ==========================================================================
   EGE Football — building a season's conference races
   Writes data/conferences.js: every conference game of the season that
   none of the six is in, played out, so the site can say where a school
   stands in its division week by week.

     node tools/build-conferences.js 2021

   One season at a time (2020 if none is given); the file keeps every other
   season's block exactly as it was.

   Why it is made up
   -----------------
   The season files only hold the games the six play. A place in a division
   needs everybody else's record too, and the real 2020 season is no help
   past its first few weeks: the Big Ten and the Pac-12 started late and
   played short, the SEC went conference-only and the Valley moved to the
   spring. The simulation plays the whole of the original 2020 calendar, so
   the rest of each conference has to play it as well.

   So each school gets the strength it actually showed in 2020 -- points
   scored and allowed a game, from the final standings -- and plays out a
   full conference schedule built around the fixtures already in
   stats/2020.js. The schedules follow each league's real shape (every
   division rival, the Big Ten's and SEC's crossovers, the Pac-12's four of
   six, the Valley's eight of ten) and their rivalry weekends.

   The dice are seeded, so the file comes out the same every time. Of the
   first few thousand seeds, the one kept for each conference is the one
   whose final standings come closest to the order those schools really
   finished 2020 in: Alabama and Texas A&M near the top of the West,
   Vanderbilt at the foot of the East, and so on.

   Nothing here touches the six's own games. Those are read from the season
   file on the page, as they are published, so a result corrected in the
   editor moves the standings with it. Run this again only if a fixture
   (who, or which week) changes.
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const { loadSiteData } = require('../bot/site-data');
const { fetchAll } = require('./espn');
const { weekOf, localParts } = require('./calendar');

const SEASON = Number(process.argv[2]) || 2020;
const SEEDS = 4000;
const OUT = path.join(__dirname, '..', 'data', 'conferences.js');

/* Points scored and allowed a game, and the conference record, from the
   real 2020 final standings (Sports Reference for the FBS leagues, the
   Valley's own for its spring season). The record is only what the seed
   is judged against. Indiana State sat the spring out, so it has no record
   to be judged by and a strength in line with its 2019. */
const DRAWN_2020 = {
  bigTen: {
    name: 'Big Ten',
    weeks: [4, 13],
    divisions: {
      'Big Ten East': {
        'Ohio State':     [41.0, 25.8, 5, 0],
        'Indiana':        [28.9, 20.3, 6, 1],
        'Penn State':     [29.8, 27.7, 4, 5],
        'Maryland':       [23.6, 32.0, 2, 3],
        'Michigan':       [28.3, 34.5, 2, 4],
        'Rutgers':        [26.7, 32.1, 3, 6],
        'Michigan State': [18.0, 35.1, 2, 5]
      },
      'Big Ten West': {
        'Northwestern':   [24.7, 15.9, 6, 1],
        'Iowa':           [31.8, 16.0, 6, 2],
        'Wisconsin':      [25.1, 17.4, 3, 3],
        'Minnesota':      [27.3, 30.1, 3, 4],
        'Nebraska':       [23.1, 29.4, 3, 5],
        'Purdue':         [27.2, 29.8, 2, 4],
        'Illinois':       [20.1, 34.9, 2, 6]
      }
    },
    /* Three crossovers a school, Indiana and Purdue always one of them. */
    crossovers: 3,
    locked: [['Indiana', 'Purdue']],
    rivalryWeek: { 13: [['Indiana', 'Purdue'], ['Iowa', 'Nebraska'],
                        ['Minnesota', 'Wisconsin'], ['Penn State', 'Michigan State'],
                        ['Maryland', 'Rutgers']] }
  },

  sec: {
    name: 'SEC',
    weeks: [3, 13],
    divisions: {
      'SEC East': {
        'Florida':           [39.8, 30.8, 8, 2],
        'Georgia':           [32.3, 20.0, 7, 2],
        'Missouri':          [26.7, 32.3, 5, 5],
        'Kentucky':          [21.8, 25.9, 4, 6],
        'Tennessee':         [21.5, 30.1, 3, 7],
        'South Carolina':    [23.5, 36.0, 2, 8],
        'Vanderbilt':        [14.8, 37.3, 0, 9]
      },
      'SEC West': {
        'Alabama':           [48.5, 19.4, 10, 0],
        'Texas A&M':         [32.6, 21.7, 8, 1],
        'Auburn':            [25.1, 24.7, 6, 4],
        'LSU':               [32.0, 34.9, 5, 5],
        'Ole Miss':          [39.2, 38.3, 4, 5],
        'Mississippi State': [21.4, 28.1, 3, 7],
        'Arkansas':          [25.7, 34.9, 3, 7]
      }
    },
    /* One permanent crossover a school, and one that rotates. */
    permanent: [['Alabama', 'Tennessee'], ['Arkansas', 'Missouri'], ['Auburn', 'Georgia'],
                ['LSU', 'Florida'], ['Ole Miss', 'Vanderbilt'],
                ['Mississippi State', 'Kentucky'], ['Texas A&M', 'South Carolina']],
    rivalryWeek: { 9: [['Florida', 'Georgia']],
                   13: [['Ole Miss', 'Mississippi State'], ['LSU', 'Texas A&M'],
                        ['Arkansas', 'Missouri'], ['Tennessee', 'Vanderbilt']] }
  },

  pac12: {
    name: 'Pac-12',
    weeks: [3, 13],
    divisions: {
      'Pac-12 North': {
        'Oregon':            [31.3, 28.3, 3, 2],
        'Washington':        [30.3, 25.0, 3, 1],
        'Stanford':          [29.3, 31.7, 4, 2],
        'Oregon State':      [28.9, 33.3, 2, 5],
        'California':        [20.3, 26.5, 1, 3],
        'Washington State':  [27.0, 38.5, 1, 3]
      },
      'Pac-12 South': {
        'USC':               [33.3, 26.0, 5, 0],
        'Colorado':          [28.5, 31.7, 3, 1],
        'Utah':              [30.2, 26.0, 3, 2],
        'Arizona State':     [40.3, 23.3, 2, 2],
        'UCLA':              [35.4, 30.7, 3, 4],
        'Arizona':           [17.4, 39.8, 0, 5]
      }
    },
    /* Four of the six across the way. The four California schools always
       play each other. */
    crossovers: 4,
    locked: [['USC', 'Stanford'], ['USC', 'California'],
             ['UCLA', 'Stanford'], ['UCLA', 'California']],
    rivalryWeek: { 13: [['Washington', 'Washington State'], ['Oregon', 'Oregon State'],
                        ['Arizona', 'Arizona State'], ['Stanford', 'California'],
                        ['Utah', 'Colorado']] }
  },

  valley: {
    name: 'Missouri Valley',
    weeks: [4, 12],
    divisions: {
      'Missouri Valley': {
        'South Dakota State': [33.0, 17.0, 5, 1],
        'Missouri State':     [28.0, 24.0, 5, 1],
        'North Dakota':       [30.0, 20.0, 4, 1],
        'North Dakota State': [31.0, 18.0, 5, 2],
        'Southern Illinois':  [30.0, 22.0, 3, 3],
        'Northern Iowa':      [22.0, 20.0, 3, 4],
        'Illinois State':     [18.0, 26.0, 1, 3],
        'South Dakota':       [22.0, 27.0, 1, 3],
        'Western Illinois':   [20.0, 30.0, 1, 5],
        'Youngstown State':   [20.0, 32.0, 1, 6],
        'Indiana State':      [19.0, 29.0, null, null]
      }
    },
    /* No divisions: eight of the other ten. */
    games: 8,
    rivalryWeek: { 12: [['North Dakota', 'South Dakota State']] }
  }
};

/* 2021 was played in full, so its conference schedules are the real ones,
   read from ESPN, and only the scores are played out -- from each school's
   real 2021 points scored and allowed a game, with the seed judged against
   its real 2021 conference record, both also from ESPN. The leagues lined
   up the same way as in 2020. */
function membersOf(conferences) {
  const out = {};
  Object.keys(conferences).forEach(function (id) {
    const divisions = {};
    Object.keys(conferences[id].divisions).forEach(function (d) {
      divisions[d] = Object.keys(conferences[id].divisions[d]);
    });
    out[id] = { name: conferences[id].name, divisions: divisions };
  });
  return out;
}

const REAL_2021 = membersOf(DRAWN_2020);

/* How each season is built: drawn (a schedule made up in the league's real
   shape) or real (the schedule as it was played). */
const SEASONS = {
  2020: { mode: 'drawn', conferences: DRAWN_2020 },
  2021: { mode: 'real', conferences: REAL_2021 }
};

if (!SEASONS[SEASON]) { throw new Error('No conferences set up for ' + SEASON + ' -- add it to SEASONS.'); }
const CONFERENCES = SEASONS[SEASON].conferences;

/* --- dice ------------------------------------------------------------------ */

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(list, rng) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function normal(rng) {
  const u = Math.max(rng(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

const key = (a, b) => [a, b].sort().join('|');

/* --- the fixtures already written ---------------------------------------- */

/* Every conference game one of the six plays, as the season file has it.
   Ohio State's are in twice, once for each of its two players, and the
   Illinois game once from each side; the key keeps one of each. */
function fixedGames(EGE, teams) {
  const fixed = new Map();
  EGE.players.forEach(function (player) {
    const team = EGE.teamFor(player, SEASON);
    if (!team || !teams.has(team.school)) { return; }
    EGE.gamesFor(player, SEASON).forEach(function (game) {
      if (!game.conference || game.playoff || game.bye) { return; }
      if (!teams.has(game.opponent)) {
        throw new Error(team.school + ' plays "' + game.opponent + '", which is not in the conference here');
      }
      const k = key(team.school, game.opponent);
      if (fixed.has(k)) { return; }
      const r = game.result;
      fixed.set(k, {
        week: game.week,
        home: game.home ? team.school : game.opponent,
        away: game.home ? game.opponent : team.school,
        score: r ? (game.home ? [r.teamScore, r.opponentScore] : [r.opponentScore, r.teamScore]) : null
      });
    });
  });
  return fixed;
}

/* --- who plays whom -------------------------------------------------------- */

/* The schools one of the six plays for: their conference schedule is the
   one in the season file and nothing may be added to it. */
function ownersOf(fixed, teams, EGE) {
  const owners = new Set();
  EGE.players.forEach(function (player) {
    const team = EGE.teamFor(player, SEASON);
    if (team && teams.has(team.school)) { owners.add(team.school); }
  });
  return owners;
}

/* Across two divisions: each school plays `count` of the other side. */
function crossPairs(conf, fixed, owners, rng) {
  const [a, b] = Object.keys(conf.divisions).map((d) => Object.keys(conf.divisions[d]));
  const need = conf.crossovers;
  const must = new Set((conf.locked || []).map((p) => key(p[0], p[1])));
  const permanent = new Set((conf.permanent || []).map((p) => key(p[0], p[1])));
  fixed.forEach(function (game, k) {
    const [x, y] = k.split('|');
    if (a.includes(x) !== a.includes(y)) { must.add(k); }
  });

  for (let attempt = 0; attempt < 20000; attempt += 1) {
    const load = new Map([...a, ...b].map((t) => [t, 0]));
    const chosen = new Set();
    must.forEach(function (k) {
      chosen.add(k);
      k.split('|').forEach((t) => load.set(t, load.get(t) + 1));
    });
    let ok = true;
    for (const x of shuffle(a, rng)) {
      if (owners.has(x)) { if (load.get(x) !== need) { ok = false; } continue; }
      const options = shuffle(b.filter(function (y) {
        return !owners.has(y) && !chosen.has(key(x, y)) &&
          !permanent.has(key(x, y)) && load.get(y) < need;
      }), rng);
      while (load.get(x) < need && options.length) {
        const y = options.pop();
        chosen.add(key(x, y));
        load.set(x, load.get(x) + 1);
        load.set(y, load.get(y) + 1);
      }
      if (load.get(x) !== need) { ok = false; break; }
    }
    if (ok && [...load.values()].every((n) => n === need)) { return [...chosen]; }
  }
  throw new Error(conf.name + ': no crossover draw fits');
}

/* The SEC: the permanent pairs, then one rotating opponent each. */
function secCross(conf, fixed, owners, rng) {
  const [east, west] = Object.keys(conf.divisions).map((d) => Object.keys(conf.divisions[d]));
  const permanent = conf.permanent.map((p) => key(p[0], p[1]));
  const rotating = new Map();
  fixed.forEach(function (game, k) {
    const [x, y] = k.split('|');
    if (east.includes(x) !== east.includes(y) && !permanent.includes(k)) {
      const w = west.includes(x) ? x : y;
      rotating.set(w, east.includes(x) ? x : y);
    }
  });
  for (let attempt = 0; attempt < 20000; attempt += 1) {
    const open = shuffle(east.filter((e) => ![...rotating.values()].includes(e)), rng);
    const pairs = new Map(rotating);
    let ok = true;
    west.forEach(function (w) {
      if (pairs.has(w)) { return; }
      const at = open.findIndex((e) => !permanent.includes(key(w, e)));
      if (at === -1) { ok = false; return; }
      pairs.set(w, open.splice(at, 1)[0]);
    });
    if (ok) { return permanent.concat([...pairs].map(([w, e]) => key(w, e))); }
  }
  throw new Error('SEC: no rotation fits');
}

/* The Valley: eleven schools, eight games, so each misses two -- which is a
   ring through all eleven, every school skipping the two beside it. North
   Dakota State's two are already known. */
function valleyPairs(conf, fixed, owners, rng) {
  const teams = Object.keys(conf.divisions['Missouri Valley']);
  const played = new Set(fixed.keys());
  const anchor = [...owners][0];
  const skipped = teams.filter((t) => t !== anchor && !played.has(key(anchor, t)));
  for (let attempt = 0; attempt < 20000; attempt += 1) {
    const rest = shuffle(teams.filter((t) => t !== anchor && !skipped.includes(t)), rng);
    const ring = [skipped[0], anchor, skipped[1]].concat(rest);
    const missed = new Set(ring.map((t, i) => key(t, ring[(i + 1) % ring.length])));
    const pairs = [];
    for (let i = 0; i < teams.length; i += 1) {
      for (let j = i + 1; j < teams.length; j += 1) {
        if (!missed.has(key(teams[i], teams[j]))) { pairs.push(key(teams[i], teams[j])); }
      }
    }
    return pairs;
  }
  throw new Error('Valley: no ring fits');
}

function divisionPairs(conf) {
  const pairs = [];
  Object.keys(conf.divisions).forEach(function (d) {
    const teams = Object.keys(conf.divisions[d]);
    for (let i = 0; i < teams.length; i += 1) {
      for (let j = i + 1; j < teams.length; j += 1) { pairs.push(key(teams[i], teams[j])); }
    }
  });
  return pairs;
}

/* --- when ------------------------------------------------------------------ */

/* Every game given a week in the league's window, no school twice in one
   week, the fixtures where they are and the rivalries on their weekend.
   Most-constrained game first, weeks in random order, backtracking. */
function assignWeeks(conf, pairs, fixed, rng) {
  const [first, last] = conf.weeks;
  const weeks = [];
  for (let w = first; w <= last; w += 1) { weeks.push(w); }

  const busy = new Map();
  const mark = (t, w, on) => {
    if (!busy.has(t)) { busy.set(t, new Set()); }
    busy.get(t)[on ? 'add' : 'delete'](w);
  };
  const placed = new Map();
  fixed.forEach(function (game, k) {
    placed.set(k, game.week);
    k.split('|').forEach((t) => mark(t, game.week, true));
  });

  const pinned = new Map();
  Object.keys(conf.rivalryWeek || {}).forEach(function (w) {
    conf.rivalryWeek[w].forEach((p) => pinned.set(key(p[0], p[1]), Number(w)));
  });

  const open = shuffle(pairs.filter((k) => !placed.has(k)), rng);
  const free = (k, w) => k.split('|').every((t) => !(busy.get(t) || new Set()).has(w));
  const choices = (k) => (pinned.has(k) ? [pinned.get(k)] : weeks).filter((w) => free(k, w));

  let steps = 0;
  function solve(left) {
    if (!left.length) { return true; }
    if ((steps += 1) > 200000) { return false; }
    let best = 0;
    let bestCount = Infinity;
    left.forEach(function (k, i) {
      const n = choices(k).length;
      if (n < bestCount) { best = i; bestCount = n; }
    });
    if (!bestCount) { return false; }
    const k = left[best];
    const rest = left.slice(0, best).concat(left.slice(best + 1));
    for (const w of shuffle(choices(k), rng)) {
      placed.set(k, w);
      k.split('|').forEach((t) => mark(t, w, true));
      if (solve(rest)) { return true; }
      k.split('|').forEach((t) => mark(t, w, false));
      placed.delete(k);
    }
    return false;
  }
  return solve(open) ? placed : null;
}

/* Home and away, as near to half and half as the fixtures allow. */
function assignHomes(pairs, fixed, rng) {
  const homes = new Map();
  const count = new Map();
  const bump = (t) => count.set(t, (count.get(t) || 0) + 1);
  fixed.forEach((game) => bump(game.home));
  const games = new Map();
  pairs.forEach((k) => k.split('|').forEach((t) => games.set(t, (games.get(t) || 0) + 1)));

  shuffle(pairs.filter((k) => !fixed.has(k)), rng).forEach(function (k) {
    const [x, y] = k.split('|');
    const lean = (t) => (count.get(t) || 0) - games.get(t) / 2;
    const home = lean(x) === lean(y) ? (rng() < 0.5 ? x : y) : (lean(x) < lean(y) ? x : y);
    homes.set(k, home);
    bump(home);
  });
  return homes;
}

/* --- how it went ----------------------------------------------------------- */

/* A side's points are the middle of what it scored and what the other side
   gave up, a point and a half either way for home field, and the rest is
   the day. A tie goes to overtime. */
function play(home, away, rating, rng) {
  const [ho, hd] = rating[home];
  const [ao, ad] = rating[away];
  const hMean = (ho + ad) / 2 + 1.5;
  const aMean = (ao + hd) / 2 - 1.5;
  let h = footballScore(hMean + 10 * normal(rng));
  let a = footballScore(aMean + 10 * normal(rng));
  while (h === a) {
    const homeEdge = 0.5 + (hMean - aMean) / 40;
    if (rng() < homeEdge) { h += rng() < 0.6 ? 7 : 3; } else { a += rng() < 0.6 ? 7 : 3; }
  }
  return [h, a];
}

/* A number a scoreboard could show. */
function footballScore(x) {
  let n = Math.max(0, Math.round(x));
  if (n === 1) { n = 0; }
  if (n === 4 || n === 5) { n = n === 4 ? 3 : 6; }
  return n;
}

/* --- judging a seed -------------------------------------------------------- */

function spearman(xs, ys) {
  const rank = function (v) {
    const order = v.map((x, i) => [x, i]).sort((p, q) => p[0] - q[0]);
    const r = new Array(v.length);
    for (let i = 0; i < order.length;) {
      let j = i;
      while (j + 1 < order.length && order[j + 1][0] === order[i][0]) { j += 1; }
      for (let k = i; k <= j; k += 1) { r[order[k][1]] = (i + j) / 2; }
      i = j + 1;
    }
    return r;
  };
  const rx = rank(xs);
  const ry = rank(ys);
  const mean = (v) => v.reduce((s, x) => s + x, 0) / v.length;
  const mx = mean(rx);
  const my = mean(ry);
  let num = 0;
  let dx = 0;
  let dy = 0;
  rx.forEach(function (x, i) {
    num += (x - mx) * (ry[i] - my);
    dx += (x - mx) * (x - mx);
    dy += (ry[i] - my) * (ry[i] - my);
  });
  return num / Math.sqrt(dx * dy);
}

function build(EGE, conf, seed) {
  const rng = mulberry32(seed);
  const rating = {};
  Object.keys(conf.divisions).forEach(function (d) {
    Object.assign(rating, conf.divisions[d]);
  });
  const teams = new Set(Object.keys(rating));
  const fixed = fixedGames(EGE, teams);
  const owners = ownersOf(fixed, teams, EGE);

  let pairs;
  if (conf.games) {
    pairs = valleyPairs(conf, fixed, owners, rng);
  } else {
    const cross = conf.permanent ? secCross(conf, fixed, owners, rng) : crossPairs(conf, fixed, owners, rng);
    pairs = divisionPairs(conf).concat(cross);
  }
  fixed.forEach(function (game, k) {
    if (!pairs.includes(k)) { throw new Error(conf.name + ': fixture ' + k + ' is not on the draw'); }
  });

  const weeks = assignWeeks(conf, pairs, fixed, rng);
  if (!weeks) { return null; }
  const homes = assignHomes(pairs, fixed, rng);

  const games = pairs.filter((k) => !fixed.has(k)).map(function (k) {
    const [x, y] = k.split('|');
    const home = homes.get(k);
    const away = home === x ? y : x;
    return { week: weeks.get(k), home: home, away: away, score: play(home, away, rating, rng) };
  }).sort((p, q) => p.week - q.week || p.home.localeCompare(q.home));

  /* How the season finishes, the six's games included, to judge it by. */
  const won = new Map([...teams].map((t) => [t, [0, 0]]));
  const result = (w, l) => { won.get(w)[0] += 1; won.get(l)[1] += 1; };
  games.concat([...fixed.values()].filter((g) => g.score)).forEach(function (g) {
    if (g.score[0] > g.score[1]) { result(g.home, g.away); } else { result(g.away, g.home); }
  });

  const judged = [...teams].filter((t) => rating[t][2] !== null);
  const pct = (w, l) => (w + l ? w / (w + l) : 0.5);
  const score = spearman(judged.map((t) => pct(...won.get(t))),
                         judged.map((t) => pct(rating[t][2], rating[t][3])));
  return { games: games, score: score, finals: won };
}

/* --- a season as it was played --------------------------------------------- */

const SITE = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football';

/* Every regular-season game the league's schools played, from ESPN, with
   each school's real points a game and conference record, and the games
   they played outside the league as they really finished:
   { fixtures: [{ week, home, away }], rating: { school: [for, against, w, l] },
     nonConference: [{ week, school, opponent, score: [school's, opponent's] }] }

   A non-conference game the six's schools are in is left out of that list
   either way round -- Ohio State's own, or Oregon's at Ohio State. Those are
   in the season file, played out, and are read from there. */
function realSeason(EGE, conf) {
  const schools = [].concat(...Object.values(conf.divisions));
  const members = new Set(schools);
  const ours = new Set(EGE.players.map((p) => EGE.teamFor(p, SEASON)).filter(Boolean).map((t) => t.school));
  const nonConference = [];
  const urls = schools.map(function (school) {
    const id = EGE.espnIds[school];
    if (!id) { throw new Error('No ESPN id for ' + school); }
    return SITE + '/teams/' + id + '/schedule?season=' + SEASON + '&seasontype=2';
  });
  const got = fetchAll(urls, conf.name + ' schedules');

  const seen = new Set();
  const fixtures = [];
  const tally = {};
  schools.forEach(function (school) { tally[school] = { pf: 0, pa: 0, games: 0, w: 0, l: 0 }; });

  urls.forEach(function (url, at) {
    const school = schools[at];
    ((got.get(url) || {}).events || []).forEach(function (event) {
      const game = event.competitions[0];
      const notes = ((game.notes || [])[0] || {}).headline || '';
      const status = ((game.status || {}).type || {});
      if (/championship/i.test(notes) || !status.completed) { return; }
      /* A score is an object with a value, or a bare number. Not `value ||`:
         a shutout's 0 is falsy, and every game somebody was held scoreless in
         used to drop out of the schedule -- Penn State's wins over Indiana and
         Rutgers in 2021 among them. */
      const sides = game.competitors.map(function (c) {
        const score = c.score && typeof c.score === 'object' ? c.score.value : c.score;
        return { name: c.team.location, home: c.homeAway === 'home', score: Number(score) };
      });
      const us = sides.filter((x) => x.name === school)[0];
      const them = sides.filter((x) => x !== us)[0];
      if (!us || !them || isNaN(us.score) || isNaN(them.score)) { return; }

      const row = tally[school];
      row.games += 1;
      row.pf += us.score;
      row.pa += them.score;
      if (!members.has(them.name)) {
        if (!ours.has(school) && !ours.has(them.name)) {
          nonConference.push({
            week: weekOf(localParts(game.date, 'America/Chicago').date, SEASON),
            school: school,
            opponent: them.name,
            score: [us.score, them.score]
          });
        }
        return;
      }
      if (us.score > them.score) { row.w += 1; } else { row.l += 1; }

      if (seen.has(event.id)) { return; }
      seen.add(event.id);
      const home = sides.filter((x) => x.home)[0] || sides[0];
      const away = sides.filter((x) => x !== home)[0];
      fixtures.push({
        week: weekOf(localParts(game.date, 'America/Chicago').date, SEASON),
        home: home.name,
        away: away.name
      });
    });
  });

  const rating = {};
  schools.forEach(function (school) {
    const t = tally[school];
    rating[school] = t.games
      ? [Math.round(t.pf / t.games * 10) / 10, Math.round(t.pa / t.games * 10) / 10, t.w, t.l]
      : [21, 28, null, null];
  });
  nonConference.sort((p, q) => p.week - q.week || p.school.localeCompare(q.school));
  return { fixtures: fixtures, rating: rating, nonConference: nonConference };
}

/* The real schedule played out with one seed: every game none of the six
   is in gets a score; the six's own come from the season file. */
function buildReal(EGE, conf, seed, real) {
  const rng = mulberry32(seed);
  const rating = real.rating;
  const teams = new Set(Object.keys(rating));
  const fixed = fixedGames(EGE, teams);
  const owners = ownersOf(fixed, teams, EGE);

  const games = real.fixtures.filter(function (g) {
    return !owners.has(g.home) && !owners.has(g.away);
  }).map(function (g) {
    return { week: g.week, home: g.home, away: g.away, score: play(g.home, g.away, rating, rng) };
  }).sort((p, q) => p.week - q.week || p.home.localeCompare(q.home));

  const won = new Map([...teams].map((t) => [t, [0, 0]]));
  const result = (w, l) => { won.get(w)[0] += 1; won.get(l)[1] += 1; };
  games.concat([...fixed.values()].filter((g) => g.score)).forEach(function (g) {
    if (g.score[0] > g.score[1]) { result(g.home, g.away); } else { result(g.away, g.home); }
  });
  const judged = [...teams].filter((t) => rating[t][2] !== null);
  const pct = (w, l) => (w + l ? w / (w + l) : 0.5);
  const score = spearman(judged.map((t) => pct(...won.get(t))),
                         judged.map((t) => pct(rating[t][2], rating[t][3])));
  return { games: games, score: score, finals: won };
}

/* --- the file -------------------------------------------------------------- */

/* The file with this season's block put in -- in place of the one that is
   there, or after the last one -- and every other season's left alone. */
function write(results) {
  const block = seasonBlock(results);
  const existing = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : null;
  if (!existing) { fs.writeFileSync(OUT, header().concat(block).join('\n')); return; }
  const start = existing.indexOf('EGE.conferences[' + SEASON + '] = {');
  if (start === -1) {
    fs.writeFileSync(OUT, existing.replace(/\n*$/, '\n\n') + block.join('\n'));
    return;
  }
  const end = existing.indexOf('\n};\n', start) + 4;
  fs.writeFileSync(OUT, existing.slice(0, start) + block.join('\n') +
    existing.slice(end));
}

function header() {
  const out = [];
  out.push('/* ==========================================================================');
  out.push('   EGE Football — the conference races');
  out.push('   Written by tools/build-conferences.js; change that and run it again');
  out.push('   rather than editing this by hand.');
  out.push('');
  out.push('   Every conference game of the season that none of the six is in, played');
  out.push('   out, so the page can say where a school stands in its division as the');
  out.push('   weeks go by. The six\'s own conference games are not here: those are');
  out.push('   read from stats/{year}.js as they are published, so the standings move');
  out.push('   with whatever the season file says.');
  out.push('');
  out.push('   2020\'s schedules are drawn in each league\'s real shape, since the real');
  out.push('   2020 was cut short; 2021\'s are the real ones, as played. Either way the');
  out.push('   scores are played out here, from how strong each school really was.');
  out.push('');
  out.push('   A game here counts once its week is published, the same as everything');
  out.push('   else on the site. `score` is [home, away].');
  out.push('');
  out.push('   A real season also lists each school\'s games outside the league in');
  out.push('   `nonConference`, as they really finished (`score` is [the school\'s,');
  out.push('   the opponent\'s]), so the standings can carry an overall record that');
  out.push('   moves every week, not only in weeks with a conference game. A game one');
  out.push('   of the six\'s schools is in is left out: it is in the season file.');
  out.push('   ========================================================================== */');
  out.push('');
  out.push('window.EGE = window.EGE || {};');
  out.push('EGE.conferences = EGE.conferences || {};');
  out.push('');
  return out;
}

function seasonBlock(results) {
  const out = [];
  out.push('EGE.conferences[' + SEASON + '] = {');
  const ids = Object.keys(results);
  ids.forEach(function (id, at) {
    const conf = CONFERENCES[id];
    const r = results[id];
    out.push('  ' + id + ': {');
    out.push("    name: '" + conf.name + "',");
    out.push('    divisions: {');
    const divs = Object.keys(conf.divisions);
    divs.forEach(function (d, i) {
      const teams = schoolsIn(conf.divisions[d]).map(quote).join(', ');
      out.push('      ' + quote(d) + ': [' + teams + ']' + (i < divs.length - 1 ? ',' : ''));
    });
    out.push('    },');
    out.push('    /* seed ' + r.seed + ' */');
    out.push('    games: [');
    r.games.forEach(function (g, i) {
      out.push('      { week: ' + String(g.week).padStart(2) + ', home: ' + quote(g.home) +
        ', away: ' + quote(g.away) + ', score: [' + g.score[0] + ', ' + g.score[1] + '] }' +
        (i < r.games.length - 1 ? ',' : ''));
    });
    if (!r.nonConference) {
      out.push('    ]');
    } else {
      out.push('    ],');
      out.push('    /* Outside the league, as really played: [school\'s score, opponent\'s]. */');
      out.push('    nonConference: [');
      r.nonConference.forEach(function (g, i) {
        out.push('      { week: ' + String(g.week).padStart(2) + ', school: ' + quote(g.school) +
          ', opponent: ' + quote(g.opponent) + ', score: [' + g.score[0] + ', ' + g.score[1] + '] }' +
          (i < r.nonConference.length - 1 ? ',' : ''));
      });
      out.push('    ]');
    }
    out.push('  }' + (at < ids.length - 1 ? ',' : ''));
    if (at < ids.length - 1) { out.push(''); }
  });
  out.push('};');
  out.push('');
  return out;
}

/* A string as a single-quoted literal. Escaped, because a school can have
   an apostrophe in it -- Hawai'i is on UCLA's and Oregon State's schedules. */
function quote(text) { return "'" + String(text).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'"; }

/* A division's schools: the keys of a drawn season's strengths, or a real
   season's plain list. */
function schoolsIn(division) {
  return Array.isArray(division) ? division : Object.keys(division);
}

function main() {
  const EGE = loadSiteData();
  const results = {};
  const real = SEASONS[SEASON].mode === 'real';
  if (real) {
    /* ESPN's ids, for reading the schedules. */
    const vm = require('vm');
    const sandbox = {};
    sandbox.window = sandbox;
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'data', 'logos.js'), 'utf8'), sandbox);
    EGE.espnIds = sandbox.EGE.espnIds;
  }
  Object.keys(CONFERENCES).forEach(function (id) {
    const season = real ? realSeason(EGE, CONFERENCES[id]) : null;
    let best = null;
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const built = real ? buildReal(EGE, CONFERENCES[id], seed, season)
                         : build(EGE, CONFERENCES[id], seed);
      if (built && (!best || built.score > best.score)) { best = Object.assign({ seed: seed }, built); }
    }
    if (!best) { throw new Error(id + ': no seed built a season'); }
    if (season) { best.nonConference = season.nonConference; }
    results[id] = best;
    console.log(CONFERENCES[id].name + ': seed ' + best.seed + ', rank match ' + best.score.toFixed(3));
    Object.keys(CONFERENCES[id].divisions).forEach(function (d) {
      const rows = schoolsIn(CONFERENCES[id].divisions[d]).map((t) => [t, best.finals.get(t)])
        .sort((p, q) => q[1][0] / (q[1][0] + q[1][1]) - p[1][0] / (p[1][0] + p[1][1]));
      console.log('  ' + d + ': ' + rows.map((r) => r[0] + ' ' + r[1][0] + '-' + r[1][1]).join(', '));
    });
  });
  write(results);
}

main();
