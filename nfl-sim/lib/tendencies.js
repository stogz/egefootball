/* ==========================================================================
   EGE Football NFL sim — a team's tendencies (an admin's)
   What the game engine reads off a team to call its plays, and where the
   ball goes, for the Tendencies panel an admin sees on a team's page:

   - its calls: how often it throws on an early down in a close game, the
     depth of its throws, play-action, outside runs, how many of its
     designed runs the quarterback starting now keeps (game.js
     qbRunChance), and how its targets split between receivers, tight ends
     and backs; on defense how often it plays man, two deep safeties and
     blitzes, and how many it puts in the box. Each with where it ranks
     among the 32, most first, and the league's lowest, highest and
     average.
   - who gets the ball: each player's carries and targets a game, expected
     from the game-day lineup as it is now (the team against every other
     team twice, home and away, nobody hurt, the six's connections
     counted), and as the season has gone so far.

   Scheme fit is not here: the engine never reads it in a game
   (lib/schemes.js).
   ========================================================================== */

'use strict';

const { gameDay } = require('./lineup');
const { playGame, qbRunChance } = require('./game');
const { offenseOf, defenseOf } = require('./schemes');
const { side } = require('./league');
const boosts = require('./boosts');
const { seeded } = require('./rng');

const CALLS = ['pass', 'screen', 'short', 'mid', 'deep', 'playAction', 'outside', 'qbRun', 'WR', 'TE', 'RB',
               'man', 'twoHigh', 'blitz', 'box'];

/* The numbers a team's plays are called from. Throws by depth are shares
   of the throws, screens included. */
function callsOf(league, team) {
  const o = team.offenseTendencies;
  const d = team.defenseTendencies;
  const day = gameDay(team, league.byTeam.get(team.key) || []);
  const aimed = o.short + o.mid + o.deep;
  const thrown = 1 - o.screen;
  return {
    qb: day.qb.standIn ? null : day.qb.name,
    pass: o.pass, screen: o.screen, short: thrown * o.short / aimed, mid: thrown * o.mid / aimed, deep: thrown * o.deep / aimed,
    playAction: o.playAction, outside: o.outside, qbRun: qbRunChance(o, day.qb),
    WR: o.targets.WR, TE: o.targets.TE, RB: o.targets.RB,
    man: d.man, twoHigh: d.twoHigh, blitz: d.blitz, box: d.box
  };
}

/* Each player's carries and targets a game against the league, from
   ROUNDS games against every other team. Kept until the lineup, the
   team's tendencies or the connections change. */
const ROUNDS = 2;
const memo = new Map();

function expected(league, key, links) {
  const me = side(league, key);
  const sign = [league.season, league.week, key, JSON.stringify(me.team.offenseTendencies), JSON.stringify(links[key] || null),
    me.roster.map((p) => p.id + ':' + p.ovr + ':' + (p.injury ? p.injury.games : 0)).join(',')].join('|');
  if (memo.has(sign)) { return memo.get(sign); }
  const rng = seeded('tendencies:' + league.season + ':' + key);
  const per = {};
  let games = 0;
  league.teams.forEach((t) => {
    if (t.key === key) { return; }
    const them = side(league, t.key);
    for (let r = 0; r < ROUNDS; r += 1) {
      const home = r % 2 === 0;
      const result = playGame(home ? me : them, home ? them : me, rng, { noInjuries: true, links: links.all });
      games += 1;
      Object.keys(result.box).forEach((id) => {
        const line = result.box[id];
        if (line.team !== key) { return; }
        const e = per[id] || (per[id] = { carries: 0, targets: 0 });
        e.carries += line.rushAtt || 0;
        e.targets += line.targets || 0;
      });
    }
  });
  Object.keys(per).forEach((id) => { per[id].carries /= games; per[id].targets /= games; });
  memo.clear();
  memo.set(sign, per);
  return per;
}

/* Where `value` ranks among `all`, most first. */
function rank(all, value) { return 1 + all.filter((v) => v > value + 1e-9).length; }

/* Carries or targets a game, expected and this season, most first. */
function usage(league, key, per, stat, keep) {
  const season = league.stats || {};
  const rows = {};
  const row = (id) => {
    if (!rows[id]) {
      const p = league.byId.get(id);
      const s = season[id] || {};
      rows[id] = { name: p ? p.name : s.name, pos: p ? p.pos : s.pos, ege: (p && p.ege) || undefined, expected: 0, total: 0, games: 0 };
    }
    return rows[id];
  };
  Object.keys(per).forEach((id) => { if (per[id][stat] >= 0.05) { row(id).expected = per[id][stat]; } });
  Object.keys(season).forEach((id) => {
    const s = season[id];
    if (s.team !== key || !s[stat === 'carries' ? 'rushAtt' : 'targets']) { return; }
    const r = row(id);
    r.total = s[stat === 'carries' ? 'rushAtt' : 'targets'];
    r.games = s.games;
  });
  return Object.keys(rows).map((id) => rows[id])
    .map((r) => Object.assign(r, { perGame: r.games ? r.total / r.games : 0 }))
    .sort((a, b) => (b.expected - a.expected) || (b.perGame - a.perGame))
    .slice(0, keep);
}

/* Everything the panel shows for one team. */
function forTeam(league, key) {
  const team = league.teams.find((t) => t.key === key);
  if (!team) { throw new Error('No team ' + key + '.'); }
  const mine = callsOf(league, team);
  const everyone = league.teams.map((t) => (t.key === key ? mine : callsOf(league, t)));
  const calls = {};
  CALLS.forEach((k) => {
    const all = everyone.map((c) => c[k]);
    calls[k] = { value: mine[k], rank: rank(all, mine[k]), min: Math.min.apply(null, all), max: Math.max.apply(null, all),
                 average: all.reduce((a, b) => a + b, 0) / all.length };
  });
  const read = boosts.read(league);
  const links = { all: read.links };
  (league.byTeam.get(key) || []).forEach((p) => { if (read.links[p.id]) { links[key] = (links[key] || []).concat(read.links[p.id]); } });
  const per = expected(league, key, links);
  return {
    key, season: league.season,
    offense: offenseOf(team).name, defense: defenseOf(team).name, qb: mine.qb,
    calls,
    carries: usage(league, key, per, 'carries', 6),
    targets: usage(league, key, per, 'targets', 9)
  };
}

module.exports = { forTeam, callsOf, CALLS, ROUNDS };
