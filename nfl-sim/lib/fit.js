/* ==========================================================================
   EGE Football NFL sim — fit as stars
   A player's fit in a scheme (schemes.js fitOf) is in overall points, and
   what counts as a big number differs by position: linebackers and linemen
   spread far wider than tight ends. So a fit is read against the spread of
   fits at his position across every scheme on his side of the ball, among
   the league's players of 70 or better (the same players fits are centred
   on), and turned into 0-5 stars in halves: 2.5 is an ordinary fit, each
   standard deviation is a star, and five stars is about the best one
   player in thirty.

   A team's stars say how well it has built around its schemes: each
   starter's fit read the same way, the quarterback counting double, and
   the team set against the other 31, a star and a quarter a standard
   deviation. Both go out with the published rosters for everybody to
   see (Sam, 2026-10-21; site.js publicRosters).
   ========================================================================== */

'use strict';

const { OFFENSE, DEFENSE, fitOf, schemeFor, offenseOf, defenseOf } = require('./schemes');
const { depthChart } = require('./lineup');

const OFFENSE_POS = ['QB', 'RB', 'WR', 'TE', 'OT', 'IOL'];

/* The starters each side's stars are read from, and how much each counts. */
const STARTERS = {
  offense: [['QB', 1, 2], ['RB', 1, 1], ['WR', 3, 1], ['TE', 1, 1], ['OT', 2, 0.8], ['IOL', 3, 0.8]],
  defense: [['EDGE', 2, 1], ['DI', 2, 1], ['LB', 2, 1], ['CB', 3, 1], ['S', 2, 1]]
};

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

/* 0-5 in halves from a z-score, `per` stars a standard deviation. */
function starsFrom(z, per) { return clamp(Math.round((2.5 + (per || 1) * z) * 2) / 2, 0, 5); }

/* The spread of fits at each position, worked out once a league. */
const spreads = new WeakMap();

function spreadOf(league, pos) {
  let all = spreads.get(league);
  if (!all) {
    all = {};
    const good = league.players.filter((p) => p.status === 'active' && p.ovr >= 70 && !p.ege && p.skills);
    [OFFENSE, DEFENSE].forEach((group) => Object.keys(group).forEach((key) => {
      const scheme = group[key];
      Object.keys(scheme.demands).forEach((ps) => {
        const list = all[ps] = all[ps] || [];
        good.forEach((p) => { if (p.pos === ps) { list.push(fitOf(p, scheme)); } });
      });
    }));
    Object.keys(all).forEach((ps) => {
      const list = all[ps];
      const mean = list.reduce((s, v) => s + v, 0) / Math.max(1, list.length);
      const sd = Math.sqrt(list.reduce((s, v) => s + (v - mean) * (v - mean), 0) / Math.max(1, list.length));
      all[ps] = sd > 0.2 ? sd : 1;
    });
    spreads.set(league, all);
  }
  return all[pos] || 1;
}

/* A player's fit on a team (his own, or one he might go to): the scheme,
   the fit in overall points, and the stars. Null for a position no scheme
   asks anything of (fullbacks, kickers, punters). */
function playerFit(league, p, key) {
  const team = league.teams.find((t) => t.key === key);
  const scheme = team ? schemeFor(team, p.pos) : null;
  if (!scheme || !p.skills) { return null; }
  const fit = fitOf(p, scheme);
  const z = fit / spreadOf(league, p.pos);
  return { scheme: scheme.name, side: OFFENSE_POS.indexOf(p.pos) !== -1 ? 'offense' : 'defense', fit, z, stars: starsFrom(z) };
}

/* How well a team's starters, injured ones too, fit its schemes, as one
   number a side: their fits in standard deviations, averaged. */
function rawTeamFit(league, team) {
  const chart = depthChart(team, (league.byTeam.get(team.key) || []).map((p) => (p.injury ? Object.assign({}, p, { injury: null }) : p)));
  const out = {};
  Object.keys(STARTERS).forEach((side) => {
    const scheme = side === 'offense' ? offenseOf(team) : defenseOf(team);
    let total = 0;
    let weight = 0;
    STARTERS[side].forEach(([pos, n, w]) => {
      (chart[pos] || []).slice(0, n).forEach((p) => {
        total += w * fitOf(p, scheme) / spreadOf(league, pos);
        weight += w;
      });
    });
    out[side] = weight ? total / weight : 0;
  });
  return out;
}

const teamSpreads = new WeakMap();

/* A team's stars for its offense and its defense, set against the league. */
function teamFit(league, key) {
  let all = teamSpreads.get(league);
  if (!all) {
    const raw = {};
    league.teams.forEach((t) => { raw[t.key] = rawTeamFit(league, t); });
    all = { raw, sides: {} };
    Object.keys(STARTERS).forEach((side) => {
      const list = Object.keys(raw).map((k) => raw[k][side]);
      const mean = list.reduce((s, v) => s + v, 0) / list.length;
      const sd = Math.sqrt(list.reduce((s, v) => s + (v - mean) * (v - mean), 0) / list.length) || 1;
      all.sides[side] = { mean, sd };
    });
    teamSpreads.set(league, all);
  }
  const team = league.teams.find((t) => t.key === key);
  if (!team) { return null; }
  const out = {};
  Object.keys(STARTERS).forEach((side) => {
    const s = all.sides[side];
    const scheme = side === 'offense' ? offenseOf(team) : defenseOf(team);
    out[side] = { scheme: scheme.name, stars: starsFrom((all.raw[key][side] - s.mean) / s.sd, 1.25) };
  });
  return out;
}

/* Everything a team's page shows an admin at once: the team's stars and
   every player's, by name and position (all the published rosters carry). */
function forTeam(league, key) {
  const players = {};
  (league.byTeam.get(key) || []).forEach((p) => {
    const f = playerFit(league, p, key);
    if (f) { players[p.name + '|' + p.pos] = { scheme: f.scheme, stars: f.stars }; }
  });
  return { team: teamFit(league, key), players };
}

module.exports = { playerFit, teamFit, forTeam, starsFrom };
