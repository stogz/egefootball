/* ==========================================================================
   EGE Football NFL sim — schemes
   Every team runs one offense and one defense from the lists below. A
   scheme is two things:

   - `tendencies`: how it plays. How often it throws, how deep, how often
     it uses play-action, screens and the quarterback's legs, which way it
     runs, and who gets the ball. The game engine calls plays off these.
     A team's own numbers start from what it really did in 2023 (read off
     the play-by-play by build/schemes.js) and move toward the scheme's
     when it changes scheme.

   - `demands`: which skills it needs at each position. A Wide Zone back
     has to see the cutback lane; a Power Run back has to run through
     somebody. A player's fit in a scheme is his skills weighted by these,
     less his overall (fitOf below): above zero he is better in it than his
     overall says, below zero worse. Teams draft, trade and sign by it, and
     change scheme when their roster fits another one better.

   The game engine does not read `demands`. Fit shows up in games on its
   own, through the tendencies: a deep-ball receiver on a team whose
   quarterback throws short gets few deep targets, so what makes him good
   is used less -- which is the Ja'Marr Chase example exactly.
   ========================================================================== */

'use strict';

const OFFENSE = {
  westCoast: {
    name: 'West Coast',
    about: 'Quick, timed throws underneath with the backs and tight ends in the passing game, and yards after the catch.',
    tendencies: { pass: 0.6, short: 0.53, mid: 0.33, deep: 0.14, screen: 0.1, playAction: 0.2,
                  qbRun: 0.04, outside: 0.45, heavy: 0.22, targets: { WR: 0.57, TE: 0.22, RB: 0.21 } },
    demands: {
      QB: { accuracy: 3, poise: 2, deep: 0.5, arm: 0.5, mobility: 0.5 },
      RB: { hands: 2, elusive: 1.5, vision: 1.5, speed: 1, power: 0.5, block: 1 },
      WR: { route: 3, hands: 2, yac: 2, speed: 0.5, deep: 0.5, size: 0.5 },
      TE: { route: 2, hands: 2, yac: 1, block: 1, deep: 0.5, speed: 0.5 },
      OT: { passBlock: 2, runBlock: 1 }, IOL: { passBlock: 2, runBlock: 1 }
    }
  },
  wideZone: {
    name: 'Wide Zone',
    about: 'Outside-zone runs with bootlegs and play-action off them, motion before the snap, and a tight end who blocks and catches.',
    tendencies: { pass: 0.55, short: 0.45, mid: 0.38, deep: 0.17, screen: 0.07, playAction: 0.32,
                  qbRun: 0.03, outside: 0.62, heavy: 0.32, targets: { WR: 0.6, TE: 0.22, RB: 0.18 } },
    demands: {
      QB: { accuracy: 2.5, poise: 1, deep: 1.5, arm: 1, mobility: 1 },
      RB: { vision: 3, speed: 2, elusive: 1.5, hands: 1, power: 0.5, block: 0.5 },
      WR: { yac: 3, route: 2, speed: 1.5, hands: 1, deep: 1, size: 0.5 },
      TE: { block: 2, route: 1.5, hands: 1.5, yac: 1, speed: 0.5, deep: 0.5 },
      OT: { runBlock: 3, passBlock: 1 }, IOL: { runBlock: 3, passBlock: 1 }
    }
  },
  airRaid: {
    name: 'Air Raid',
    about: 'Three and four receivers spread wide and the ball pushed downfield.',
    tendencies: { pass: 0.66, short: 0.41, mid: 0.36, deep: 0.23, screen: 0.06, playAction: 0.17,
                  qbRun: 0.04, outside: 0.5, heavy: 0.12, targets: { WR: 0.72, TE: 0.15, RB: 0.13 } },
    demands: {
      QB: { deep: 3, arm: 3, accuracy: 1.5, poise: 1, mobility: 0.5 },
      RB: { hands: 1.5, elusive: 1, speed: 1, vision: 1, block: 1 },
      WR: { deep: 3, speed: 2.5, route: 1.5, hands: 1, yac: 0.5, size: 1 },
      TE: { route: 2, deep: 1.5, hands: 1, speed: 1, block: 0.3 },
      OT: { passBlock: 3, runBlock: 0.7 }, IOL: { passBlock: 3, runBlock: 0.7 }
    }
  },
  spreadOption: {
    name: 'Spread Option',
    about: 'A running quarterback: zone reads, RPOs and designed runs stretch the defense sideways.',
    tendencies: { pass: 0.52, short: 0.48, mid: 0.34, deep: 0.18, screen: 0.07, playAction: 0.24,
                  qbRun: 0.14, outside: 0.5, heavy: 0.18, targets: { WR: 0.63, TE: 0.2, RB: 0.17 } },
    demands: {
      QB: { mobility: 4, accuracy: 1.5, deep: 1, arm: 1, poise: 1 },
      RB: { elusive: 2, speed: 2, vision: 1.5, power: 1, hands: 0.5 },
      WR: { yac: 2, route: 1.5, speed: 1.5, deep: 1, hands: 1, size: 0.5 },
      TE: { route: 1, hands: 1, block: 1, yac: 1 },
      OT: { runBlock: 2, passBlock: 1 }, IOL: { runBlock: 2, passBlock: 1 }
    }
  },
  powerRun: {
    name: 'Power Run',
    about: 'Under center with heavy personnel, downhill gap runs, and play-action shots over the top.',
    tendencies: { pass: 0.5, short: 0.42, mid: 0.36, deep: 0.22, screen: 0.04, playAction: 0.28,
                  qbRun: 0.03, outside: 0.35, heavy: 0.42, targets: { WR: 0.6, TE: 0.25, RB: 0.15 } },
    demands: {
      QB: { arm: 2, deep: 2, poise: 1.5, accuracy: 1.5, mobility: 0.3 },
      RB: { power: 3, vision: 2, elusive: 1, speed: 1, hands: 0.5, block: 1 },
      WR: { deep: 2, size: 2, hands: 1.5, route: 1, speed: 1, yac: 0.5 },
      TE: { block: 3, hands: 1, route: 1, deep: 0.5 },
      OT: { runBlock: 3, passBlock: 1.5 }, IOL: { runBlock: 3, passBlock: 1.5 }
    }
  }
};

const DEFENSE = {
  cover3: {
    name: 'Cover 3',
    about: 'Single-high zone: a centerfielder deep, corners in thirds, and a safety down in the box against the run.',
    tendencies: { man: 0.25, twoHigh: 0.25, blitz: 0.22, box: 6.6, front: 43 },
    demands: {
      EDGE: { rush: 3, run: 1, speed: 1 }, DI: { rush: 1.5, run: 2 },
      LB: { run: 2, cover: 1.5, speed: 1 },
      CB: { zone: 2, speed: 1.5, man: 1, ball: 1, tackle: 1 },
      S: { range: 2.5, box: 2, cover: 1.5, ball: 1, speed: 1 }
    }
  },
  quarters: {
    name: 'Quarters',
    about: 'Two safeties deep to take away the big play; the box is light, so it can be run on.',
    tendencies: { man: 0.25, twoHigh: 0.6, blitz: 0.18, box: 6.2, front: 34 },
    demands: {
      EDGE: { rush: 3, run: 1 }, DI: { rush: 2, run: 1.5 },
      LB: { cover: 2, run: 1.5, speed: 1.5 },
      CB: { zone: 2, man: 1.5, ball: 1, speed: 1 },
      S: { cover: 3, range: 2, box: 1.5, ball: 1.5 }
    }
  },
  manBlitz: {
    name: 'Cover 1 Man',
    about: 'Press-man corners, one deep safety and pressure from everywhere.',
    tendencies: { man: 0.55, twoHigh: 0.2, blitz: 0.36, box: 6.9, front: 43 },
    demands: {
      EDGE: { rush: 2.5, speed: 1 }, DI: { rush: 2, run: 1 },
      LB: { blitz: 3, cover: 1.5, speed: 1 },
      CB: { man: 3.5, speed: 2, ball: 0.5 },
      S: { range: 2.5, box: 1.5, cover: 1 }
    }
  },
  pressure34: {
    name: '3-4 Pressure',
    about: 'A nose tackle, two rushing outside linebackers, disguised looks and simulated pressures.',
    tendencies: { man: 0.38, twoHigh: 0.4, blitz: 0.3, box: 6.6, front: 34 },
    demands: {
      EDGE: { rush: 3, cover: 1, run: 1 }, DI: { run: 3, rush: 1 },
      LB: { blitz: 2, run: 2, cover: 1 },
      CB: { man: 2, zone: 1.5, ball: 1 },
      S: { cover: 2, box: 1.5, range: 1.5 }
    }
  },
  tampa2: {
    name: 'Tampa 2',
    about: 'A four-man rush with everybody else in zone; the middle linebacker carries the deep middle.',
    tendencies: { man: 0.18, twoHigh: 0.55, blitz: 0.15, box: 6.3, front: 43 },
    demands: {
      EDGE: { rush: 3.5, speed: 1 }, DI: { rush: 2.5, run: 1 },
      LB: { speed: 2.5, cover: 2.5, run: 1 },
      CB: { zone: 3, tackle: 1.5, ball: 1 },
      S: { cover: 2, range: 1.5, ball: 1 }
    }
  }
};

/* How much better (or worse) a player is in a scheme than his overall:
   his skills weighted by what the scheme asks of his position, less his
   overall. 0 for a position the scheme asks nothing particular of. */
function fitOf(player, scheme) {
  const demands = scheme && scheme.demands && scheme.demands[player.pos];
  if (!demands || !player.skills) { return 0; }
  let total = 0;
  let weight = 0;
  Object.keys(demands).forEach((skill) => {
    if (typeof player.skills[skill] !== 'number') { return; }
    total += demands[skill] * player.skills[skill];
    weight += demands[skill];
  });
  return weight ? total / weight - player.ovr : 0;
}

/* The scheme a team runs, from its keys. */
function offenseOf(team) { return OFFENSE[team.offense]; }
function defenseOf(team) { return DEFENSE[team.defense]; }

/* The scheme that asks for this position, offense or defense. */
function schemeFor(team, pos) {
  const offense = offenseOf(team);
  if (offense && offense.demands[pos]) { return offense; }
  const defense = defenseOf(team);
  if (defense && defense.demands[pos]) { return defense; }
  return null;
}

module.exports = { OFFENSE, DEFENSE, fitOf, offenseOf, defenseOf, schemeFor };
