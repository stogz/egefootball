/* ==========================================================================
   EGE Football NFL sim — getting better, getting older
   Once a season is over every player is a year older and his overall
   moves (develop below). Two things decide which way:

   - Young players grow toward their potential: about 40% of the gap
     between his overall and his ceiling each year through 25, more after,
     so most are close to it by 27 or 28. On top of that each year is a roll of
     the dice (about ±2 points), and now and then a player breaks out and
     finds a higher ceiling than anybody thought he had.

   - Past his position's peak a player declines, a little more every year.
     How fast depends on the position -- backs and corners live on their
     legs and go first, quarterbacks, linemen and kickers last -- and on
     his longevity (a hidden 1-99; 50 is the norm): a 90 declines about
     half as fast as a 50, a 20 about half again as fast. And every year
     past the cliff age there is a chance he falls off it, losing 5 to 12
     points at once. So some players fade slowly and some drop dramatically,
     the way it really goes.

   The curves come from real careers. Measuring how every NFL player's
   production changed from one season to the next, 1999-2023 (nflverse),
   backs' yards per game fall from age 26 on, by about 10% a year at 27-28
   and 20% at 30-31; receivers' from 28; tight ends' from 29; and
   quarterbacks hold up into their mid-30s. Those are underestimates --
   players who fall off a cliff mostly leave the data -- so the sim's
   declines are a little steeper than the raw numbers.

   Physical skills (speed, elusiveness, a corner's man coverage, a
   quarterback's legs) fall faster than mental ones (route running, hands,
   poise, vision), so an aging receiver turns into a possession receiver
   and may stop fitting the scheme he was signed for.
   ========================================================================== */

'use strict';

const { SKILLS } = require('./skills');

/* peak: the last age at full strength. decline: points lost the first
   year past it; accel: points more each year after. cliffAge: from here
   each year has `cliff` chance (plus `cliffStep` a year) of a sudden drop.
   retire: around when players at the position hang it up. */
const CURVES = {
  QB: { peak: 33, decline: 1.0, accel: 0.6, cliffAge: 36, cliff: 0.06, cliffStep: 0.05, retire: 38 },
  RB: { peak: 26, decline: 1.5, accel: 0.9, cliffAge: 28, cliff: 0.1, cliffStep: 0.06, retire: 30 },
  FB: { peak: 29, decline: 1.2, accel: 0.6, cliffAge: 31, cliff: 0.06, cliffStep: 0.05, retire: 32 },
  WR: { peak: 28, decline: 1.2, accel: 0.8, cliffAge: 31, cliff: 0.06, cliffStep: 0.05, retire: 33 },
  TE: { peak: 29, decline: 1.2, accel: 0.7, cliffAge: 32, cliff: 0.06, cliffStep: 0.05, retire: 34 },
  OT: { peak: 31, decline: 1.0, accel: 0.6, cliffAge: 34, cliff: 0.06, cliffStep: 0.05, retire: 35 },
  IOL: { peak: 30, decline: 1.0, accel: 0.6, cliffAge: 33, cliff: 0.06, cliffStep: 0.05, retire: 34 },
  EDGE: { peak: 29, decline: 1.4, accel: 0.8, cliffAge: 32, cliff: 0.07, cliffStep: 0.05, retire: 34 },
  DI: { peak: 29, decline: 1.3, accel: 0.7, cliffAge: 32, cliff: 0.06, cliffStep: 0.05, retire: 34 },
  LB: { peak: 28, decline: 1.5, accel: 0.8, cliffAge: 31, cliff: 0.07, cliffStep: 0.05, retire: 33 },
  CB: { peak: 28, decline: 1.8, accel: 0.9, cliffAge: 30, cliff: 0.08, cliffStep: 0.06, retire: 32 },
  S: { peak: 29, decline: 1.5, accel: 0.8, cliffAge: 31, cliff: 0.07, cliffStep: 0.05, retire: 33 },
  K: { peak: 35, decline: 0.6, accel: 0.4, cliffAge: 39, cliff: 0.05, cliffStep: 0.04, retire: 41 },
  P: { peak: 35, decline: 0.5, accel: 0.3, cliffAge: 39, cliff: 0.05, cliffStep: 0.04, retire: 41 }
};

/* Share of the gap to his ceiling a player closes in a year, by age: a
   steady 40% through 25, then more each year, so most players are close
   to their ceiling by 27 or 28 -- when the real ones were. */
function growthRate(age) {
  if (age <= 25) { return 0.4; }
  return Math.min(0.8, 0.4 + 0.1 * (age - 25));
}

/* Longevity 50 is 1x the curve, 90 about half of it, 20 about 1.4x. */
function wear(longevity) {
  return 1.6 - 1.2 * (longevity === undefined ? 50 : longevity) / 100;
}

/* What a player at his peak is expected to gain or lose going from `age`
   to age + 1, cliffs averaged in. Used to read real careers against. */
function expectedChange(pos, age, longevity) {
  const c = CURVES[pos] || CURVES.WR;
  if (age < c.peak) { return 0; }
  const w = wear(longevity);
  let change = -(c.decline + c.accel * (age - c.peak)) * w;
  if (age >= c.cliffAge) {
    const chance = Math.min(0.6, (c.cliff + c.cliffStep * (age - c.cliffAge)) * (1.5 - (longevity || 50) / 100));
    change -= chance * 8.5;
  }
  return change;
}

/* Which of a position's skills are physical (fall fastest with age, grow
   slowest when young). */
const PHYSICAL = {
  QB: ['mobility', 'arm'], RB: ['speed', 'elusive'], FB: [], WR: ['speed', 'deep', 'yac'],
  TE: ['speed', 'deep', 'yac'], OT: [], IOL: [], EDGE: ['speed', 'rush'], DI: ['rush'],
  LB: ['speed'], CB: ['speed', 'man'], S: ['speed', 'range'], K: ['power'], P: ['power']
};

/* One year of development for one player, in place. `rng` is the sim's
   seeded random number generator; `gauss` a normal draw from it. Returns
   what happened, for the offseason report. The six are left alone: their
   overalls come from the website. */
function develop(player, rng, gauss) {
  if (player.ege) { return null; }
  const c = CURVES[player.pos] || CURVES.WR;
  const age = player.age;
  const before = player.ovr;
  let change = 0;
  let note = null;

  if (age < c.peak || player.pot > player.ovr) {
    /* Still growing. Now and then a late bloomer finds more. */
    if (age <= 26 && rng() < 0.04) {
      player.pot = Math.min(99, player.pot + 3 + Math.floor(rng() * 6));
      note = 'breakout';
    }
    change = (player.pot - player.ovr) * growthRate(age) + gauss() * (age <= 24 ? 2.0 : 1.5);
    /* A young player who stalls can lose a little of his ceiling too. */
    if (change < -1 && age <= 25 && player.pot > player.ovr) { player.pot -= 1; }
  }
  if (age >= c.peak) {
    const w = wear(player.longevity);
    change += -(c.decline + c.accel * (age - c.peak)) * w + gauss() * 1.2;
    if (age >= c.cliffAge) {
      const chance = Math.min(0.6, (c.cliff + c.cliffStep * (age - c.cliffAge)) * (1.5 - (player.longevity || 50) / 100));
      if (rng() < chance) {
        change -= 5 + Math.floor(rng() * 8);
        note = 'cliff';
      }
    }
  }

  const after = Math.max(40, Math.min(99, Math.round(player.ovr + change)));
  /* Past his peak his ceiling is wherever he is. Before it, a good year
     that puts him above his ceiling does not raise it: he drifts back
     toward it (growth below goes negative) unless he really broke out. */
  if (age >= c.peak) { player.pot = after; }
  moveSkills(player, after - player.ovr);
  player.ovr = after;
  return { id: player.id, name: player.name, pos: player.pos, age, before, after, note };
}

/* Moves a player's skills with his overall: physical ones further when he
   declines (and less when he grows), then the whole set shifted so it
   averages out to the new overall again. */
function moveSkills(player, delta) {
  const weights = SKILLS[player.pos];
  if (!weights || !player.skills || !delta) { return; }
  const physical = PHYSICAL[player.pos] || [];
  const raw = {};
  let mean = 0;
  Object.keys(weights).forEach((skill) => {
    const isPhysical = physical.indexOf(skill) !== -1;
    const factor = delta < 0 ? (isPhysical ? 1.5 : 0.7) : (isPhysical ? 0.8 : 1.15);
    raw[skill] = (player.skills[skill] || player.ovr) + delta * factor;
    mean += weights[skill] * raw[skill];
  });
  const shift = player.ovr + delta - mean;
  Object.keys(weights).forEach((skill) => {
    player.skills[skill] = Math.max(30, Math.min(99, Math.round(raw[skill] + shift)));
  });
}

/* Overalls are a scale, and the scale holds still. Every year the league
   gets older and new classes come in, and over a few seasons that would
   leave a position rated higher or lower across the board than it was --
   quarterbacks, who last, drift up; backs, who do not, drift down -- so a
   90 would stop meaning what it means now. So once everybody has aged,
   each position's top group (32 x its starters, plus one more each) is
   set against the same group at the 2023 kickoff, and every player there
   moves half of the way back in average and in spread, never more than 3
   points in a year. Who is better than whom
   never changes. The six are left alone: theirs come from the website. */
const SCALE_GROUP = { QB: 2, RB: 2, FB: 1, WR: 4, TE: 2, OT: 3, IOL: 4, EDGE: 3, DI: 3, LB: 3, CB: 4, S: 3, K: 1, P: 1 };
let kickoffScale = null;

function scaleOf(players, pos) {
  const top = players.filter((p) => p.pos === pos && !p.ege && p.status !== 'retired' && p.status !== 'prospect')
    .map((p) => p.ovr).sort((a, b) => b - a).slice(0, 32 * (SCALE_GROUP[pos] || 1));
  if (top.length < 10) { return null; }
  const mean = top.reduce((s, v) => s + v, 0) / top.length;
  const sd = Math.sqrt(top.reduce((s, v) => s + (v - mean) * (v - mean), 0) / top.length);
  return { mean, sd };
}

function holdScale(league) {
  if (!kickoffScale) {
    const file = require('path').join(__dirname, '..', 'data', 'league-2023.json');
    const kickoff = JSON.parse(require('fs').readFileSync(file, 'utf8')).players;
    kickoffScale = {};
    Object.keys(SCALE_GROUP).forEach((pos) => { kickoffScale[pos] = scaleOf(kickoff, pos); });
  }
  const moves = {};
  Object.keys(SCALE_GROUP).forEach((pos) => {
    const want = kickoffScale[pos];
    const now = scaleOf(league.players, pos);
    if (!want || !now || !now.sd) { return; }
    const sd = now.sd + 0.5 * (want.sd - now.sd);
    const mean = now.mean + 0.5 * (want.mean - now.mean);
    moves[pos] = Math.round((mean - now.mean) * 10) / 10;
    league.players.forEach((p) => {
      if (p.pos !== pos || p.ege || p.status === 'retired' || p.status === 'prospect') { return; }
      const target = mean + (p.ovr - now.mean) * sd / now.sd;
      const delta = Math.round(Math.max(-3, Math.min(3, target - p.ovr)));
      if (!delta) { return; }
      p.ovr = Math.max(40, Math.min(99, p.ovr + delta));
      p.pot = Math.max(p.ovr, Math.min(99, (p.pot || p.ovr) + delta));
      if (p.skills) { Object.keys(p.skills).forEach((k) => { p.skills[k] = Math.max(30, Math.min(99, p.skills[k] + delta)); }); }
    });
  });
  return moves;
}

/* Chance a player calls it a career this offseason: almost none before
   his position's usual age, rising steeply after, less for a player still
   good enough to start and more for one who is not. */
function retireChance(player) {
  if (player.ege) { return 0; }
  const c = CURVES[player.pos] || CURVES.WR;
  const x = player.age - c.retire;
  let p = 1 / (1 + Math.exp(-(0.9 * x - 0.3)));
  p *= player.ovr >= 85 ? 0.25 : player.ovr >= 78 ? 0.4 : player.ovr >= 70 ? 0.9 : 1.4;
  if (x <= -1) { p = Math.min(p, player.ovr < 65 ? 0.15 : 0.03); }
  if (player.age < 27) { p = player.ovr < 56 ? 0.05 : 0.002; }
  return Math.max(0, Math.min(0.97, p));
}

module.exports = { CURVES, develop, expectedChange, retireChance, moveSkills, growthRate, holdScale };
