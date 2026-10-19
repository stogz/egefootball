/* ==========================================================================
   EGE Football NFL sim — schemes
   Every team runs one offense and one defense from the lists below. A
   scheme is two things:

   - `tendencies`: how it plays. How often it throws, how deep, how often
     it uses play-action, screens and the quarterback's legs, which way it
     runs, and who gets the ball. The game engine calls plays off these.
     A team's own numbers start from what it really did in 2023 (read off
     the play-by-play by build/schemes.js) and move toward the scheme's
     when it changes scheme. They are on the play-by-play's own scale
     (`outside` is runs charted to the end, `deep` throws of 20 air yards
     or more), and NFL teams are more alike than their scheme names: the
     scheme numbers sit close to the 2023 league average, a little further
     out in the direction the scheme leans.

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
    tendencies: { pass: 0.572, short: 0.616, mid: 0.287, deep: 0.097, screen: 0.123, playAction: 0.183,
                  qbRun: 0.049, outside: 0.233, heavy: 0.313, targets: { WR: 0.563, TE: 0.219, RB: 0.218 } },
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
    tendencies: { pass: 0.542, short: 0.57, mid: 0.319, deep: 0.111, screen: 0.099, playAction: 0.242,
                  qbRun: 0.041, outside: 0.282, heavy: 0.393, targets: { WR: 0.581, TE: 0.22, RB: 0.199 } },
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
    tendencies: { pass: 0.605, short: 0.549, mid: 0.314, deep: 0.136, screen: 0.09, playAction: 0.166,
                  qbRun: 0.049, outside: 0.248, heavy: 0.218, targets: { WR: 0.657, TE: 0.177, RB: 0.166 } },
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
    tendencies: { pass: 0.525, short: 0.589, mid: 0.296, deep: 0.115, screen: 0.099, playAction: 0.204,
                  qbRun: 0.104, outside: 0.248, heavy: 0.278, targets: { WR: 0.6, TE: 0.208, RB: 0.192 } },
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
    tendencies: { pass: 0.512, short: 0.555, mid: 0.313, deep: 0.132, screen: 0.071, playAction: 0.224,
                  qbRun: 0.041, outside: 0.2, heavy: 0.462, targets: { WR: 0.583, TE: 0.238, RB: 0.179 } },
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
    tendencies: { man: 0.361, twoHigh: 0.306, blitz: 0.279, box: 6.39, front: 43 },
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
    tendencies: { man: 0.361, twoHigh: 0.518, blitz: 0.247, box: 6.19, front: 34 },
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
    tendencies: { man: 0.579, twoHigh: 0.268, blitz: 0.375, box: 6.54, front: 43 },
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
    tendencies: { man: 0.464, twoHigh: 0.406, blitz: 0.336, box: 6.39, front: 34 },
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
    tendencies: { man: 0.296, twoHigh: 0.492, blitz: 0.222, box: 6.24, front: 43 },
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
function rawFit(player, scheme) {
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

/* Some skills run higher across the league than others, so the raw
   numbers would make one scheme look better for everybody (Tampa 2 for
   corners, by almost a point) and teams would all drift to it. Each fit is
   centred instead: the average NFL player of 70 or better at a position
   fits every scheme at 0. The centre is the league as it is now (set when
   the league loads and again each offseason, since aging moves skills
   unevenly: legs go first, so an older league would otherwise tilt every
   team away from man coverage); until then, the 2023 kickoff league's. */
let centre = null;

function centreFrom(players) {
  const out = {};
  const good = players.filter((p) => p.status !== 'retired' && p.status !== 'prospect' && p.ovr >= 70 && !p.ege && p.skills);
  [OFFENSE, DEFENSE].forEach((group) => Object.keys(group).forEach((key) => {
    const sc = group[key];
    out[sc.name] = {};
    Object.keys(sc.demands).forEach((ps) => {
      const list = good.filter((p) => p.pos === ps);
      out[sc.name][ps] = list.reduce((sum, p) => sum + rawFit(p, sc), 0) / Math.max(1, list.length);
    });
  }));
  return out;
}

/* Re-centres fits on this league's players. */
function centreOn(league) { centre = centreFrom(league.players); }

function centreOf(scheme, pos) {
  if (!centre) {
    centre = centreFrom(require('./io').data('league-2023.json').players);
  }
  return (centre[scheme.name] && centre[scheme.name][pos]) || 0;
}

function fitOf(player, scheme) {
  const demands = scheme && scheme.demands && scheme.demands[player.pos];
  if (!demands || !player.skills) { return 0; }
  return rawFit(player, scheme) - centreOf(scheme, player.pos);
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

module.exports = { OFFENSE, DEFENSE, fitOf, offenseOf, defenseOf, schemeFor, centreOn };
