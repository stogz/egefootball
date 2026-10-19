/* ==========================================================================
   EGE Football NFL sim — a season
   Week by week through the regular season, a stop at the trade deadline
   after Week 9 while there are trades for Sam to look at, then seven
   playoff teams a conference down to the Super Bowl.

   Injuries carry over: a player hurt in a game misses the weeks the injury
   says, and his backup starts until he is back. Every player's season
   totals build up as the games are played, and each game's score, scoring
   plays and top performers are kept in the world folder (games-YEAR.json).
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const { playGame } = require('./game');
const { standings } = require('./standings');
const { scheduleFor } = require('./schedule');
const { side, index } = require('./league');

const DEADLINE_WEEK = 9;
const ROUNDS = ['Wild Card', 'Divisional', 'Conference Championship', 'Super Bowl'];

/* --------------------------------------------------------------- files -- */

function worldFile(league, name) { return path.join(league.world, name); }

function readWorld(league, name, fallback) {
  const file = worldFile(league, name);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : fallback;
}

function writeWorld(league, name, value) {
  fs.mkdirSync(league.world, { recursive: true });
  const file = worldFile(league, name);
  fs.writeFileSync(file + '.tmp', JSON.stringify(value));
  fs.renameSync(file + '.tmp', file);
}

/* ---------------------------------------------------------------- start -- */

/* Last season's finish in each division, 1-4, for the formula schedule. */
function lastPlaces(league) {
  const last = (league.history || [])[league.history ? league.history.length - 1 : 0];
  const places = {};
  if (!last || !last.divisions) { return places; }
  Object.keys(last.divisions).forEach((d) => last.divisions[d].forEach((key, i) => { places[key] = i + 1; }));
  return places;
}

/* Sets up the regular season: the schedule, empty stat lines, and anybody
   who starts it on injured reserve given a week to come back. */
function startSeason(league, rng) {
  league.schedule = scheduleFor(league.season, lastPlaces(league));
  league.week = 1;
  league.phase = 'regular';
  league.playoffs = null;
  league.stats = {};
  league.players.forEach((p) => {
    if (p.status !== 'injured') { return; }
    const r = rng();
    const games = r < 0.6 ? rng.int(4, 8) : r < 0.85 ? rng.int(9, 14) : 20;
    p.injury = { games, what: 'injured reserve', season: league.season, week: 0 };
    p.status = 'active';
  });
  index(league);
}

function lastWeek(league) {
  return league.schedule.reduce((m, g) => Math.max(m, g.week), 0);
}

/* ---------------------------------------------------------------- games -- */

/* Adds a game's box score to the season totals and keeps a short record of
   the game. */
function record(league, game, result, log) {
  Object.keys(result.box).forEach((id) => {
    const line = result.box[id];
    const t = league.stats[id] || (league.stats[id] = { name: line.name, pos: line.pos, team: line.team, games: 0 });
    t.team = line.team;
    t.games += 1;
    Object.keys(line).forEach((k) => {
      if (typeof line[k] !== 'number') { return; }
      if (/Long$/.test(k)) { t[k] = Math.max(t[k] || 0, line[k]); } else { t[k] = (t[k] || 0) + line[k]; }
    });
  });
  const leaders = (key) => Object.keys(result.box).map((id) => result.box[id]).filter((l) => l[key])
    .sort((a, b) => b[key] - a[key]).slice(0, 2).map((l) => l.name + ' ' + l[key]);
  log.push({
    season: league.season, week: game.week, playoff: game.playoff || undefined, round: game.round || undefined,
    home: game.home, away: game.away, score: result.score, ot: result.ot || undefined,
    scoring: result.scoring.map((s) => 'Q' + s.qtr + ' ' + s.clock + ' ' + s.team + ' ' + s.text + ' (' + s.score.join('-') + ')'),
    passing: leaders('passYds'), rushing: leaders('rushYds'), receiving: leaders('recYds'),
    injuries: result.injuries.map((i) => i.name + ' (' + i.team + ', ' + i.what + ', ' + (i.season ? 'season' : i.games + ' wk') + ')')
  });
}

function hurt(league, injuries) {
  injuries.forEach((i) => {
    const p = league.byId.get(i.id);
    if (!p) { return; }
    p.injury = { games: i.games, what: i.what, season: league.season, week: league.week, fresh: true };
  });
}

/* A week has passed: everybody hurt before it is a week closer. */
function heal(league) {
  league.players.forEach((p) => {
    if (!p.injury) { return; }
    if (p.injury.fresh) { delete p.injury.fresh; return; }
    p.injury.games -= 1;
    if (p.injury.games <= 0) { delete p.injury; }
  });
}

function play(league, game, rng, opts) {
  return playGame(side(league, game.home), side(league, game.away), rng, opts);
}

/* Plays the current week. Returns what happened, for the report. */
function playWeek(league, rng, hooks) {
  if (league.phase === 'deadline') {
    if (hooks && hooks.closeDeadline) { hooks.closeDeadline(league); }
    league.phase = 'regular';
  }
  if (league.phase !== 'regular') { throw new Error('The regular season is not on (phase: ' + league.phase + ').'); }
  const week = league.week;
  const games = league.schedule.filter((g) => g.week === week && !g.score);
  const log = readWorld(league, 'games-' + league.season + '.json', []);
  const out = { week, games: [], injuries: [] };
  games.forEach((g) => {
    const r = play(league, g, rng, { neutral: !!g.neutral });
    g.score = r.score;
    if (r.ot) { g.ot = true; }
    hurt(league, r.injuries);
    record(league, g, r, log);
    out.games.push({ home: g.home, away: g.away, score: r.score, ot: r.ot });
    out.injuries.push.apply(out.injuries, r.injuries);
  });
  heal(league);
  writeWorld(league, 'games-' + league.season + '.json', log);
  league.week += 1;
  if (week === DEADLINE_WEEK && hooks && hooks.deadline) {
    const proposals = hooks.deadline(league);
    if (proposals && proposals.length) { league.phase = 'deadline'; out.deadline = proposals.length; }
  }
  if (week >= lastWeek(league)) {
    if (league.phase === 'deadline' && hooks && hooks.closeDeadline) { hooks.closeDeadline(league); }
    startPlayoffs(league);
  }
  return out;
}

/* ------------------------------------------------------------- playoffs -- */

function startPlayoffs(league) {
  const table = standings(league.schedule, league.season);
  league.phase = 'playoffs';
  league.playoffs = { season: league.season, seeds: table.seeds, rounds: [], champion: null };
}

function seedOf(league, key) {
  const s = league.playoffs.seeds;
  const i = s.AFC.indexOf(key);
  return i !== -1 ? i + 1 : s.NFC.indexOf(key) + 1;
}

/* The games of the next playoff round. */
function nextRound(league) {
  const po = league.playoffs;
  const n = po.rounds.length;
  if (n === 0) {
    const games = [];
    ['AFC', 'NFC'].forEach((c) => {
      const s = po.seeds[c];
      [[1, 6], [2, 5], [3, 4]].forEach(([a, b]) => games.push({ home: s[a], away: s[b], conf: c }));
    });
    return games;
  }
  const alive = (conf) => {
    const last = po.rounds[n - 1].games.filter((g) => g.conf === conf).map((g) => g.winner);
    if (n === 1) { last.push(po.seeds[conf][0]); }
    return last.sort((a, b) => seedOf(league, a) - seedOf(league, b));
  };
  if (n === 1) {
    const games = [];
    ['AFC', 'NFC'].forEach((c) => {
      const t = alive(c);
      games.push({ home: t[0], away: t[3], conf: c }, { home: t[1], away: t[2], conf: c });
    });
    return games;
  }
  if (n === 2) {
    return ['AFC', 'NFC'].map((c) => { const t = alive(c); return { home: t[0], away: t[1], conf: c }; });
  }
  const afc = po.rounds[2].games.filter((g) => g.conf === 'AFC')[0].winner;
  const nfc = po.rounds[2].games.filter((g) => g.conf === 'NFC')[0].winner;
  return [league.season % 2 ? { home: afc, away: nfc, neutral: true, conf: 'SB' } : { home: nfc, away: afc, neutral: true, conf: 'SB' }];
}

function playRound(league, rng) {
  if (league.phase !== 'playoffs') { throw new Error('The playoffs are not on (phase: ' + league.phase + ').'); }
  const po = league.playoffs;
  const name = ROUNDS[po.rounds.length];
  const games = nextRound(league);
  const log = readWorld(league, 'games-' + league.season + '.json', []);
  const out = { round: name, games: [], injuries: [] };
  games.forEach((g) => {
    g.playoff = true;
    g.round = name;
    g.week = lastWeek(league) + po.rounds.length + 1;
    const r = play(league, g, rng, { neutral: !!g.neutral, playoff: true });
    g.score = r.score;
    if (r.ot) { g.ot = true; }
    g.winner = r.winner;
    hurt(league, r.injuries);
    record(league, g, r, log);
    out.games.push(g);
    out.injuries.push.apply(out.injuries, r.injuries);
  });
  heal(league);
  writeWorld(league, 'games-' + league.season + '.json', log);
  po.rounds.push({ name, games });
  if (name === 'Super Bowl') {
    po.champion = games[0].winner;
    league.phase = 'offseason';
  }
  return out;
}

/* Where each team picks in next spring's draft: teams that missed the
   playoffs worst record first, then playoff teams by how far they got. */
function draftOrder(league) {
  const table = standings(league.schedule, league.season);
  const po = league.playoffs;
  const exit = {};
  if (po) {
    po.rounds.forEach((r, i) => r.games.forEach((g) => {
      const loser = g.winner === g.home ? g.away : g.home;
      exit[loser] = i + 1;
    }));
    if (po.champion) { exit[po.champion] = 5; }
  }
  const keys = Object.keys(table.records);
  return keys.sort((a, b) => {
    const ea = exit[a] || 0;
    const eb = exit[b] || 0;
    if (ea !== eb) { return ea - eb; }
    const ra = table.records[a];
    const rb = table.records[b];
    return (ra.pct - rb.pct) || (ra.diff - rb.diff) || a.localeCompare(b);
  });
}

module.exports = { startSeason, playWeek, playRound, startPlayoffs, draftOrder, readWorld, writeWorld, lastWeek, DEADLINE_WEEK, ROUNDS };
