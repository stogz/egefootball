/* ==========================================================================
   EGE Football NFL sim — schedules
   2023 to 2026 are the real schedules (data/schedules.json). After that the
   sim makes its own by the NFL's formula: six division games; four against
   a whole division of the same conference and four against one of the
   other, on rotation; two against the same-place teams of the other two
   divisions in the conference; and a seventeenth against a same-place team
   from the other conference. Eighteen weeks, one bye each.
   ========================================================================== */

'use strict';

const path = require('path');
const fs = require('fs');
const { TEAMS, KEYS } = require('./teams');
const { seeded } = require('./rng');

const DIVS = ['East', 'North', 'South', 'West'];

function realSchedule(season) {
  const file = path.join(__dirname, '..', 'data', 'schedules.json');
  const all = JSON.parse(fs.readFileSync(file, 'utf8'));
  return all[season] ? all[season].map((g) => ({ week: g.week, home: g.home, away: g.away, neutral: g.neutral || undefined })) : null;
}

function division(conf, div, places) {
  return KEYS.filter((k) => TEAMS[k].conf === conf && TEAMS[k].div === div)
    .sort((a, b) => (places[a] || 0) - (places[b] || 0));
}

/* The pairings for one season. `places` is each team's finish in its
   division last season (1-4). */
function pairings(season, places) {
  const games = [];
  const add = (home, away) => games.push({ home, away });
  ['AFC', 'NFC'].forEach((conf) => {
    DIVS.forEach((div) => {
      const teams = division(conf, div, places);
      for (let i = 0; i < 4; i += 1) {
        for (let j = i + 1; j < 4; j += 1) { add(teams[i], teams[j]); add(teams[j], teams[i]); }
      }
    });
  });
  /* A whole division of the same conference, on a three-year rotation. */
  const inConf = [[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]][season % 3];
  ['AFC', 'NFC'].forEach((conf) => {
    inConf.forEach(([x, y]) => {
      const a = division(conf, DIVS[x], places);
      const b = division(conf, DIVS[y], places);
      for (let i = 0; i < 4; i += 1) {
        for (let j = 0; j < 4; j += 1) { if ((i + j + season) % 2) { add(a[i], b[j]); } else { add(b[j], a[i]); } }
      }
    });
    /* Same place in the two divisions it does not play in full. */
    for (let x = 0; x < 4; x += 1) {
      const partner = inConf.filter((p) => p.indexOf(x) !== -1)[0];
      const others = [0, 1, 2, 3].filter((y) => partner.indexOf(y) === -1);
      others.forEach((y) => {
        if (y < x) { return; }
        const a = division(conf, DIVS[x], places);
        const b = division(conf, DIVS[y], places);
        for (let i = 0; i < 4; i += 1) { if ((i + x + y + season) % 2) { add(a[i], b[i]); } else { add(b[i], a[i]); } }
      });
      void others;
    }
  });
  /* A whole division of the other conference on a four-year rotation, and
     a same-place seventeenth game from the division two along. */
  const r = season % 4;
  for (let x = 0; x < 4; x += 1) {
    const afc = division('AFC', DIVS[x], places);
    const nfc = division('NFC', DIVS[(x + r) % 4], places);
    const extra = division('NFC', DIVS[(x + r + 2) % 4], places);
    for (let i = 0; i < 4; i += 1) {
      for (let j = 0; j < 4; j += 1) { if ((i + j + season) % 2) { add(afc[i], nfc[j]); } else { add(nfc[j], afc[i]); } }
      if (season % 2) { add(afc[i], extra[i]); } else { add(extra[i], afc[i]); }
    }
  }
  balanceHomes(games);
  return games;
}

/* Flips non-division games until every team has eight or nine at home. */
function balanceHomes(games) {
  const homes = {};
  KEYS.forEach((k) => { homes[k] = 0; });
  games.forEach((g) => { homes[g.home] += 1; });
  const sameDiv = (a, b) => TEAMS[a].conf === TEAMS[b].conf && TEAMS[a].div === TEAMS[b].div;
  for (let guard = 0; guard < 500; guard += 1) {
    const heavy = KEYS.filter((k) => homes[k] > 9).concat(KEYS.filter((k) => homes[k] === 9));
    let flipped = false;
    for (let i = 0; i < heavy.length && !flipped; i += 1) {
      const k = heavy[i];
      const g = games.filter((x) => x.home === k && !sameDiv(x.home, x.away))
        .sort((x, y) => homes[x.away] - homes[y.away])[0];
      if (g && homes[k] - homes[g.away] >= 2 && (homes[k] > 9 || homes[g.away] < 8)) {
        homes[g.home] -= 1;
        homes[g.away] += 1;
        const h = g.home;
        g.home = g.away;
        g.away = h;
        flipped = true;
      }
    }
    if (!flipped) { break; }
  }
}

/* Spreads the games over 18 weeks so nobody plays twice in a week and each
   team has one bye between Weeks 5 and 14: byes are handed out first, then
   each week is a full matching of the teams still to play, built most-
   constrained team first, starting over when a week cannot be filled. */
function weeks(games, seed) {
  const rng = seeded(seed);
  const BYES = [0, 0, 0, 0, 2, 4, 4, 4, 4, 4, 4, 2, 2, 2, 0, 0, 0, 0];
  for (let attempt = 0; attempt < 2000; attempt += 1) {
    const teams = KEYS.slice().sort(() => rng() - 0.5);
    const byeWeek = {};
    let at = 0;
    BYES.forEach((n, i) => { for (let k = 0; k < n; k += 1) { byeWeek[teams[at]] = i + 1; at += 1; } });
    /* Games still to place, by pair. */
    const left = {};
    KEYS.forEach((k) => { left[k] = {}; });
    games.forEach((g) => {
      (left[g.home][g.away] = left[g.home][g.away] || []).push(g);
      (left[g.away][g.home] = left[g.away][g.home] || []).push(g);
    });
    const out = [];
    let ok = true;
    for (let w = 1; w <= 18 && ok; w += 1) {
      const playing = KEYS.filter((k) => byeWeek[k] !== w);
      const match = matching(playing, left, rng);
      if (!match) { ok = false; break; }
      match.forEach(([a, b]) => {
        const list = left[a][b];
        const g = list.splice(Math.floor(rng() * list.length), 1)[0];
        const other = left[b][a];
        other.splice(other.indexOf(g), 1);
        out.push({ week: w, home: g.home, away: g.away });
      });
    }
    if (ok) { return out; }
  }
  throw new Error('Could not lay out a schedule');
}

/* A perfect matching of `teams` over pairs that still have a game left. */
function matching(teams, left, rng) {
  const free = new Set(teams);
  const pairs = [];
  let budget = 20000;
  const options = (k) => Object.keys(left[k]).filter((o) => free.has(o) && left[k][o].length);
  function solve() {
    if (!free.size) { return true; }
    if ((budget -= 1) < 0) { return false; }
    let pick = null;
    let opts = null;
    free.forEach((k) => {
      const o = options(k);
      if (!opts || o.length < opts.length) { pick = k; opts = o; }
    });
    if (!opts.length) { return false; }
    opts.sort(() => rng() - 0.5);
    for (let i = 0; i < opts.length; i += 1) {
      const o = opts[i];
      free.delete(pick);
      free.delete(o);
      pairs.push([pick, o]);
      if (solve()) { return true; }
      pairs.pop();
      free.add(pick);
      free.add(o);
    }
    return false;
  }
  return solve() ? pairs : null;
}

/* The regular season for `season`: the real one while there is one. */
function scheduleFor(season, places) {
  const real = realSchedule(season);
  if (real) { return real; }
  return weeks(pairings(season, places || {}), 'schedule:' + season);
}

module.exports = { scheduleFor, pairings, weeks };
