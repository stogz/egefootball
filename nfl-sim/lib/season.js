/* ==========================================================================
   EGE Football NFL sim — a season
   Week by week through the regular season, a stop at the trade deadline
   after Week 9 while there are trades for Sam to look at, then seven
   playoff teams a conference down to the Super Bowl.

   Injuries carry over: a player hurt in a game misses the weeks the injury
   says, and his backup starts until he is back. Every player's season
   totals build up as the games are played, and each game's score, scoring
   plays and top performers are kept in the world folder (games-YEAR.json),
   with the six's whole lines, touchdowns and injuries for their season file.

   The six get one injury a season between them, the way Sam has always
   drawn them (weighted by the injury rating, which is their durability
   here): once one of them is hurt, the rest of the season spares them.

   Weeks the website has already played can be taken as they happened
   (importWeeks) instead of simulated, and the season goes on from there.
   ========================================================================== */

'use strict';

const io = require('./io');
const { playGame } = require('./game');
const { standings } = require('./standings');
const { scheduleFor } = require('./schedule');
const { side, index } = require('./league');

const DEADLINE_WEEK = 9;
const ROUNDS = ['Wild Card', 'Divisional', 'Conference Championship', 'Super Bowl'];

/* --------------------------------------------------------------- files -- */

function readWorld(league, name, fallback) {
  return io.has(league.world, name) ? io.read(league.world, name) : fallback;
}

function writeWorld(league, name, value) { io.write(league.world, name, value); }

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

/* A touchdown that put its team ahead late (the fourth quarter or
   overtime) and was never caught after. */
function winning(result, td) {
  if (!(td.ot || td.qtr >= 4) || result.winner !== result[td.side ? 'away' : 'home']) { return false; }
  if (td.before[td.side] > td.before[1 - td.side]) { return false; }
  return result.scoring.slice(td.at).every((s) => s.score[td.side] > s.score[1 - td.side]);
}

/* What the six did in a game, for their season file: the line, the
   touchdowns they scored or threw, what hurt them in it, or what kept them
   out of it. Keyed by slug. */
function sixIn(league, game, result) {
  const out = {};
  [game.home, game.away].forEach((key) => {
    (league.byTeam.get(key) || []).forEach((p) => {
      if (!p.ege) { return; }
      const entry = { team: key };
      if (result.box[p.id]) { entry.line = result.box[p.id]; }
      if (p.injury && !p.injury.fresh) { entry.out = p.injury.what; }
      const hurt = result.injuries.filter((i) => i.id === p.id)[0];
      if (hurt) { entry.hurt = { what: hurt.what, games: hurt.games }; }
      const tds = (result.tds || []).filter((t) => t.id === p.id || t.qb === p.id);
      if (tds.length) { entry.tds = tds.map((t) => ({ how: t.how, yards: t.yards, mine: t.id === p.id, winning: winning(result, t) })); }
      out[p.ege] = entry;
    });
  });
  return out;
}

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
    home: game.home, away: game.away, score: result.score, ot: result.ot || undefined, neutral: game.neutral || undefined,
    scoring: result.scoring.map((s) => 'Q' + s.qtr + ' ' + s.clock + ' ' + s.team + ' ' + s.text + ' (' + s.score.join('-') + ')'),
    passing: leaders('passYds'), rushing: leaders('rushYds'), receiving: leaders('recYds'),
    injuries: result.injuries.map((i) => i.name + ' (' + i.team + ', ' + i.what + ', ' + (i.season ? 'season' : i.games + ' wk') + ')'),
    six: sixIn(league, game, result)
  });
}

function hurt(league, injuries) {
  injuries.forEach((i) => {
    const p = league.byId.get(i.id);
    if (!p) { return; }
    p.injury = { games: i.games, what: i.what, season: league.season, week: league.week, fresh: true };
    if (p.ege) { league.egeHurt = league.season; }
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
  const spareEge = league.egeHurt === league.season;
  return playGame(side(league, game.home), side(league, game.away), rng, Object.assign({ spareEge }, opts));
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

/* Weeks the website has already played, from the week the league is on
   through `through`: each game's real score (or the six's, from their
   season file) goes into the schedule as if it had been simulated. Nobody
   gets a box score for them, injuries heal a week at a time, and the trade
   deadline comes round after Week 9 as usual. `results` are
   { week, home, away, score: [home, away], ot } with team keys; which side
   is listed as home does not matter. `egeHurt` says one of the six has
   already had his injury this season. */
function importWeeks(league, results, through, hooks, opts) {
  if (league.phase !== 'regular') { throw new Error('Weeks can only be taken in during the regular season (phase: ' + league.phase + ').'); }
  const last = Math.min(through, lastWeek(league));
  if (last < league.week) { throw new Error('The league is already past Week ' + through + '.'); }
  const log = readWorld(league, 'games-' + league.season + '.json', []);
  const out = { from: league.week, through: last, games: 0 };
  for (let week = league.week; week <= last; week += 1) {
    league.schedule.filter((g) => g.week === week && !g.score).forEach((g) => {
      const found = results.filter((r) => r.week === week &&
        ((r.home === g.home && r.away === g.away) || (r.home === g.away && r.away === g.home)))[0];
      if (!found) { throw new Error('No Week ' + week + ' result for ' + g.away + ' at ' + g.home + '.'); }
      g.score = found.home === g.home ? found.score.slice() : [found.score[1], found.score[0]];
      if (found.ot) { g.ot = true; }
      g.imported = true;
      log.push({ season: league.season, week, home: g.home, away: g.away, score: g.score, ot: g.ot || undefined, imported: true });
      out.games += 1;
    });
    heal(league);
    league.week = week + 1;
    if (week === DEADLINE_WEEK && hooks && hooks.deadline) {
      const proposals = hooks.deadline(league);
      if (proposals && proposals.length) { league.phase = 'deadline'; out.deadline = proposals.length; }
    }
  }
  if (opts && opts.egeHurt) { league.egeHurt = league.season; }
  writeWorld(league, 'games-' + league.season + '.json', log);
  if (league.week > lastWeek(league)) {
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

module.exports = { startSeason, playWeek, playRound, importWeeks, startPlayoffs, draftOrder, readWorld, writeWorld, lastWeek,
                   DEADLINE_WEEK, ROUNDS };
