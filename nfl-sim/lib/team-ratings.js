/* ==========================================================================
   EGE Football NFL sim — team ratings (private)
   A team's overall is how many points a game better or worse than the
   league it is, measured by the game engine itself: every team plays every
   other at a neutral site, several times over, and its average margin is
   turned into a 50-99 number. So it counts everything the engine counts --
   the players, how they fit what the team calls, and how the units fit
   each other -- and nothing is added by hand.

   The unit ratings come from the same games: how many yards a dropback
   and a carry the offense gets and the defense gives up, and how often the
   pass rush gets home, each against the league average.

   None of this is ever shown on the site or committed: it goes to the
   world folder and to whoever runs the sim.
   ========================================================================== */

'use strict';

const { playGame } = require('./game');
const { seeded } = require('./rng');
const { fitOf, offenseOf, defenseOf } = require('./schemes');
const { gameDay } = require('./lineup');

/* Points a game per overall point: +10 a game is a 95, -10 a 55. */
const PER_POINT = 2;

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function sideOf(league, key) {
  return { team: league.teams.find((t) => t.key === key), roster: league.byTeam.get(key) };
}

/* How well the starters fit the team's schemes, in overall points (0 is
   a roster built for some other scheme entirely, +3 a very good fit). */
function schemeFit(league, team) {
  const day = gameDay(team, league.byTeam.get(team.key));
  const offense = [day.qb].concat(day.rbs.slice(0, 1), day.wrs, day.tes.slice(0, 1), day.ol);
  const defense = day.edge.concat(day.di, day.lb, day.cb, day.s);
  const avg = (list, scheme) => {
    const real = list.filter((p) => !p.standIn);
    return real.length ? real.reduce((sum, p) => sum + fitOf(p, scheme), 0) / real.length : 0;
  };
  return { offense: avg(offense, offenseOf(team)), defense: avg(defense, defenseOf(team)) };
}

/* Every team against every other, `rounds` times, at neutral sites. */
function rateTeams(league, opts) {
  opts = opts || {};
  const rounds = opts.rounds || 6;
  const rng = seeded(opts.seed || 'team-ratings');
  const keys = league.teams.map((t) => t.key);
  const rows = {};
  keys.forEach((k) => {
    rows[k] = { games: 0, pf: 0, pa: 0, wins: 0, off: zero(), def: zero() };
  });
  for (let r = 0; r < rounds; r += 1) {
    for (let i = 0; i < keys.length; i += 1) {
      for (let j = i + 1; j < keys.length; j += 1) {
        const a = r % 2 ? keys[j] : keys[i];
        const b = r % 2 ? keys[i] : keys[j];
        const g = playGame(sideOf(league, a), sideOf(league, b), rng, { neutral: true, noInjuries: true });
        [[a, 0], [b, 1]].forEach(([key, s]) => {
          const row = rows[key];
          row.games += 1;
          row.pf += g.score[s];
          row.pa += g.score[1 - s];
          if (g.score[s] > g.score[1 - s]) { row.wins += 1; } else if (g.score[s] === g.score[1 - s]) { row.wins += 0.5; }
          addStats(row.off, g.stats[s]);
          addStats(row.def, g.stats[1 - s]);
        });
      }
    }
  }

  const all = zero();
  keys.forEach((k) => addStats(all, rows[k].off));
  const avg = rates(all);
  const out = {};
  keys.forEach((k) => {
    const row = rows[k];
    const off = rates(row.off);
    const def = rates(row.def);
    const margin = (row.pf - row.pa) / row.games;
    out[k] = {
      overall: clamp(Math.round(75 + PER_POINT * margin), 50, 99),
      margin: round1(margin),
      pointsFor: round1(row.pf / row.games),
      pointsAgainst: round1(row.pa / row.games),
      winPct: Math.round((row.wins / row.games) * 1000) / 1000,
      units: {
        passOffense: unit(off.netPerDropback, avg.netPerDropback, 0.55),
        runOffense: unit(off.perCarry, avg.perCarry, 0.35),
        protection: unit(-off.sackRate, -avg.sackRate, 0.012),
        passDefense: unit(-def.netPerDropback, -avg.netPerDropback, 0.55),
        runDefense: unit(-def.perCarry, -avg.perCarry, 0.35),
        passRush: unit(def.sackRate, avg.sackRate, 0.012),
        takeaways: unit(def.takeaways, avg.takeaways, 0.25)
      },
      fit: schemeFit(league, league.teams.find((t) => t.key === k))
    };
  });
  return out;
}

function zero() {
  return { games: 0, dropbacks: 0, passYards: 0, sackYards: 0, sacks: 0, attempts: 0, carries: 0, rushYards: 0,
           scrambles: 0, ints: 0, fumblesLost: 0, drives: 0 };
}

function addStats(into, s) {
  into.games += s.games || 1;
  ['dropbacks', 'passYards', 'sackYards', 'sacks', 'attempts', 'carries', 'rushYards', 'scrambles', 'ints', 'fumblesLost', 'drives']
    .forEach((k) => { into[k] += s[k] || 0; });
}

function rates(t) {
  return {
    netPerDropback: (t.passYards - t.sackYards) / Math.max(1, t.attempts + t.sacks),
    perCarry: t.rushYards / Math.max(1, t.carries),
    sackRate: t.sacks / Math.max(1, t.attempts + t.sacks),
    takeaways: (t.ints + t.fumblesLost) / Math.max(1, t.games)
  };
}

/* A unit rating: 75 is the league average, and `step` (about one team's
   standard deviation) is worth 8 points. */
function unit(value, average, step) {
  return clamp(Math.round(75 + 8 * (value - average) / step), 50, 99);
}

function round1(v) { return Math.round(v * 10) / 10; }

module.exports = { rateTeams, schemeFit, PER_POINT };
