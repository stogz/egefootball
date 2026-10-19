/* ==========================================================================
   EGE Football NFL sim — getting better, getting older
   Once a season is over every player is a year older and his overall
   moves (develop below). Two things decide which way:

   - Young players grow toward their potential, quickly at 21 and less
     each year after. A 22-year-old closes about 38% of the gap between his
     overall and his ceiling in a year, a 26-year-old about 24%. On top of
     that each year is a roll of the dice (about ±2 points), and now and
     then a player breaks out and finds a higher ceiling than anybody
     thought he had.

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

/* Share of the gap to his ceiling a player closes in a year, by age. */
function growthRate(age) {
  if (age <= 21) { return 0.4; }
  return Math.max(0.12, 0.4 - 0.04 * (age - 21));
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
    if (change < -1 && age <= 25) { player.pot = Math.max(player.ovr - 1, player.pot - 1); }
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
  if (age >= c.peak) { player.pot = after; } else { player.pot = Math.max(player.pot, after); }
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

/* Chance a player calls it a career this offseason: almost none before
   his position's usual age, rising steeply after, less for a player still
   good enough to start and more for one who is not. */
function retireChance(player) {
  if (player.ege) { return 0; }
  const c = CURVES[player.pos] || CURVES.WR;
  const x = player.age - c.retire;
  let p = 1 / (1 + Math.exp(-(0.9 * x)));
  p *= player.ovr >= 85 ? 0.35 : player.ovr >= 78 ? 0.6 : player.ovr >= 70 ? 1 : 1.5;
  if (player.age < 29) { p = player.ovr < 56 ? 0.08 : 0.005; }
  return Math.max(0, Math.min(0.97, p));
}

module.exports = { CURVES, develop, expectedChange, retireChance, moveSkills, growthRate };
