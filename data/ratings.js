/* ==========================================================================
   EGE Football — player ratings
   Four groups of attributes every player carries, plus blocking for the
   tight ends, who are the only position here whose overall should turn on
   it. A group scores as the average of its attributes; those group scores
   are what a player's page shows.

   The overall works the way Madden's does. Each position names the
   attributes that matter to it and how much each one matters, and nothing
   else counts at all: a tight end is not marked down for throwing like a
   tight end. Those key attributes are averaged by weight, and the average is
   stretched away from 50 — so a player whose key attributes are all in the
   80s and 90s is a 99, without needing every number on the page at 99.
   ========================================================================== */

window.EGE = window.EGE || {};

/* The attribute list, in the order it is shown. */
EGE.ratingGroups = [
  {
    key: 'general',
    label: 'General',
    attributes: [
      { key: 'speed',        label: 'Speed' },
      { key: 'acceleration', label: 'Acceleration' },
      { key: 'strength',     label: 'Strength' },
      { key: 'agility',      label: 'Agility' },
      { key: 'awareness',    label: 'Awareness' },
      { key: 'jumping',      label: 'Jumping' },
      { key: 'injury',       label: 'Injury' },
      { key: 'stamina',      label: 'Stamina' },
      { key: 'toughness',    label: 'Toughness' }
    ]
  },
  {
    key: 'passing',
    label: 'Passing',
    attributes: [
      { key: 'throwPower',         label: 'Throw Power' },
      { key: 'throwUnderPressure', label: 'Throw Under Pressure' },
      { key: 'throwAccuracyShort', label: 'Throw Accuracy Short' },
      { key: 'throwAccuracyMid',   label: 'Throw Accuracy Mid' },
      { key: 'throwAccuracyDeep',  label: 'Throw Accuracy Deep' },
      { key: 'throwOnTheRun',      label: 'Throw on the Run' },
      { key: 'playAction',         label: 'Play Action' }
    ]
  },
  {
    key: 'receiving',
    label: 'Receiving',
    attributes: [
      { key: 'catching',            label: 'Catching' },
      { key: 'spectacularCatch',    label: 'Spectacular Catch' },
      { key: 'catchInTraffic',      label: 'Catch in Traffic' },
      { key: 'routeRunningShort',   label: 'Route Running Short' },
      { key: 'routeRunningMedium',  label: 'Route Running Medium' },
      { key: 'routeRunningDeep',    label: 'Route Running Deep' },
      { key: 'release',             label: 'Release' }
    ]
  },
  {
    key: 'ballCarrier',
    label: 'Ball Carrier',
    attributes: [
      { key: 'carrying',          label: 'Carrying' },
      { key: 'breakTackle',       label: 'Break Tackle' },
      { key: 'trucking',          label: 'Trucking' },
      { key: 'changeOfDirection', label: 'Change of Direction' },
      { key: 'bcVision',          label: 'BC Vision' },
      { key: 'stiffArm',          label: 'Stiff Arm' },
      { key: 'spinMove',          label: 'Spin Move' },
      { key: 'jukeMove',          label: 'Juke Move' },
      { key: 'breakSack',         label: 'Break Sack' }
    ]
  },
  {
    key: 'blocking',
    label: 'Blocking',
    attributes: [
      { key: 'runBlock',          label: 'Run Block' },
      { key: 'passBlock',         label: 'Pass Block' },
      { key: 'impactBlocking',    label: 'Impact Blocking' },
      { key: 'runBlockPower',     label: 'Run Block Power' },
      { key: 'runBlockFinesse',   label: 'Run Block Finesse' },
      { key: 'passBlockPower',    label: 'Pass Block Power' },
      { key: 'passBlockFinesse',  label: 'Pass Block Finesse' },
      { key: 'leadBlock',         label: 'Lead Block' }
    ]
  },
];

/* How much each attribute counts toward the overall, per position. Only
   the attributes listed count; the rest are still on the page but make no
   difference to the number in the corner. The weights do not have to add up
   to anything — they are normalised when the overall is worked out — so one
   can be nudged without rebalancing the rest.

   Blocking is listed only for tight ends (and the TBD fallback), which is
   how it counts for them and for nobody else. Only the positions these
   attributes describe are listed: linemen, defenders and kickers need
   attributes this file does not carry. */
EGE.positionWeights = {
  QB: {
    throwPower: 14, throwAccuracyShort: 12, throwAccuracyMid: 12,
    throwAccuracyDeep: 9, throwUnderPressure: 8, throwOnTheRun: 6,
    playAction: 4,
    awareness: 12, speed: 3, acceleration: 2, agility: 2, strength: 1,
    breakSack: 4, bcVision: 1, carrying: 1
  },
  /* These are backs who catch, not just carry, so hands and short routes
     count for something. */
  RB: {
    speed: 10, acceleration: 8, agility: 6, awareness: 6, strength: 3,
    toughness: 1, stamina: 1,
    carrying: 8, bcVision: 8, breakTackle: 7, changeOfDirection: 6,
    trucking: 4, jukeMove: 4, stiffArm: 3, spinMove: 3,
    catching: 6, routeRunningShort: 3, release: 2, catchInTraffic: 2
  },
  WR: {
    catching: 12, catchInTraffic: 7, spectacularCatch: 6,
    routeRunningShort: 7, routeRunningMedium: 7, routeRunningDeep: 6,
    release: 6,
    speed: 12, acceleration: 6, agility: 5, awareness: 7, jumping: 4,
    changeOfDirection: 3, carrying: 2, breakTackle: 1
  },
  TE: {
    catching: 11, catchInTraffic: 8, spectacularCatch: 4,
    routeRunningShort: 6, routeRunningMedium: 5, routeRunningDeep: 2,
    release: 4,
    awareness: 9, speed: 7, acceleration: 4, strength: 4, agility: 3,
    jumping: 3,
    runBlock: 7, passBlock: 4, impactBlocking: 3, runBlockPower: 2,
    leadBlock: 1,
    breakTackle: 2, trucking: 1, carrying: 1, stiffArm: 1
  },

  /* Used while a player's position is still TBD: a little of everything,
     with the athletic attributes counting most. */
  DEFAULT: {
    speed: 10, acceleration: 6, agility: 6, strength: 5, awareness: 10,
    jumping: 3,
    throwPower: 4, throwAccuracyShort: 4,
    catching: 8, routeRunningShort: 4,
    carrying: 6, breakTackle: 4, bcVision: 4,
    runBlock: 4, passBlock: 3
  }
};

/* How the weighted average of the key attributes becomes an overall:

       overall = PIVOT + STRETCH × (average − PIVOT), kept within 1-99

   A 50 average is a 50 overall. Above it, every point of average is worth
   1.4 points of overall, so key attributes averaging about 85 make a 99 —
   which is where Madden's own 99 tight ends sit — and below it a player
   falls away just as quickly. */
EGE.overallScale = { pivot: 50, stretch: 1.4 };

/* Placeholder attribute values, keyed by player slug.

   Everything between the two markers below is rewritten wholesale when a
   season is locked from the admin portal: the numbers there become whatever
   the players had bought their way up to, and the shop rows behind them are
   cleared. Nothing else in this file is touched, so leave the markers alone
   and edit inside them freely. */
/* ege:ratings:start */
/* Locked on 2026-10-17, at the end of the 2022 season. Every rating
   point and every offseason workout bought during that season is part of
   these numbers now, and the shop rows behind them have been cleared. */
EGE.ratings = {
  'jaykeb-stewart': {
    /* General */
    speed: 61, acceleration: 64, strength: 72, agility: 53, awareness: 42,
    jumping: 57, injury: 58, stamina: 54, toughness: 53,
    /* Passing */
    throwPower: 82, throwUnderPressure: 82, throwAccuracyShort: 85,
    throwAccuracyMid: 82, throwAccuracyDeep: 80, throwOnTheRun: 82,
    playAction: 80,
    /* Receiving */
    catching: 22, spectacularCatch: 23, catchInTraffic: 22,
    routeRunningShort: 22, routeRunningMedium: 16, routeRunningDeep: 21,
    release: 22,
    /* Ball Carrier */
    carrying: 41, breakTackle: 36, trucking: 31, changeOfDirection: 51,
    bcVision: 37, stiffArm: 41, spinMove: 41, jukeMove: 36, breakSack: 78,
  },
  'cooper-clark': {
    /* General */
    speed: 70, acceleration: 70, strength: 80, agility: 61, awareness: 48,
    jumping: 69, injury: 70, stamina: 62, toughness: 65,
    /* Passing */
    throwPower: 14, throwUnderPressure: 18, throwAccuracyShort: 12,
    throwAccuracyMid: 9, throwAccuracyDeep: 16, throwOnTheRun: 14,
    playAction: 9,
    /* Receiving */
    catching: 65, spectacularCatch: 45, catchInTraffic: 55,
    routeRunningShort: 58, routeRunningMedium: 40, routeRunningDeep: 39,
    release: 45,
    /* Ball Carrier */
    carrying: 64, breakTackle: 62, trucking: 57, changeOfDirection: 78,
    bcVision: 76, stiffArm: 57, spinMove: 62, jukeMove: 63, breakSack: 63,
  },
  'andrew-parr': {
    /* General */
    speed: 51, acceleration: 56, strength: 90, agility: 51, awareness: 44,
    jumping: 64, injury: 58, stamina: 51, toughness: 64,
    /* Passing */
    throwPower: 17, throwUnderPressure: 8, throwAccuracyShort: 10,
    throwAccuracyMid: 8, throwAccuracyDeep: 17, throwOnTheRun: 15,
    playAction: 7,
    /* Receiving */
    catching: 81, spectacularCatch: 65, catchInTraffic: 75,
    routeRunningShort: 70, routeRunningMedium: 65, routeRunningDeep: 64,
    release: 64,
    /* Ball Carrier */
    carrying: 43, breakTackle: 51, trucking: 45, changeOfDirection: 37,
    bcVision: 51, stiffArm: 40, spinMove: 61, jukeMove: 53, breakSack: 40,
    /* Blocking */
    runBlock: 73, passBlock: 60, impactBlocking: 65, runBlockPower: 60,
    runBlockFinesse: 60, passBlockPower: 60, passBlockFinesse: 60,
    leadBlock: 60,
  },
  'sam-stogsdill': {
    /* General */
    speed: 68, acceleration: 69, strength: 99, agility: 57, awareness: 46,
    jumping: 66, injury: 68, stamina: 60, toughness: 64,
    /* Passing */
    throwPower: 13, throwUnderPressure: 17, throwAccuracyShort: 12,
    throwAccuracyMid: 9, throwAccuracyDeep: 15, throwOnTheRun: 13,
    playAction: 9,
    /* Receiving */
    catching: 55, spectacularCatch: 42, catchInTraffic: 40,
    routeRunningShort: 41, routeRunningMedium: 33, routeRunningDeep: 38,
    release: 41,
    /* Ball Carrier */
    carrying: 86, breakTackle: 81, trucking: 90, changeOfDirection: 73,
    bcVision: 80, stiffArm: 68, spinMove: 44, jukeMove: 54, breakSack: 70,
  },
  'isaac-vitel': {
    /* General */
    speed: 48, acceleration: 51, strength: 59, agility: 41, awareness: 35,
    jumping: 49, injury: 51, stamina: 42, toughness: 47,
    /* Passing */
    throwPower: 70, throwUnderPressure: 82, throwAccuracyShort: 81,
    throwAccuracyMid: 71, throwAccuracyDeep: 80, throwOnTheRun: 73,
    playAction: 65,
    /* Receiving */
    catching: 19, spectacularCatch: 21, catchInTraffic: 19,
    routeRunningShort: 19, routeRunningMedium: 13, routeRunningDeep: 18,
    release: 19,
    /* Ball Carrier */
    carrying: 58, breakTackle: 35, trucking: 26, changeOfDirection: 32,
    bcVision: 35, stiffArm: 35, spinMove: 36, jukeMove: 30, breakSack: 44,
  },
  'paxon-hatch': {
    /* General */
    speed: 54, acceleration: 64, strength: 86, agility: 59, awareness: 42,
    jumping: 62, injury: 54, stamina: 62, toughness: 57,
    /* Passing */
    throwPower: 8, throwUnderPressure: 18, throwAccuracyShort: 12,
    throwAccuracyMid: 16, throwAccuracyDeep: 12, throwOnTheRun: 14,
    playAction: 7,
    /* Receiving */
    catching: 80, spectacularCatch: 69, catchInTraffic: 70,
    routeRunningShort: 75, routeRunningMedium: 70, routeRunningDeep: 70,
    release: 70,
    /* Ball Carrier */
    carrying: 51, breakTackle: 51, trucking: 50, changeOfDirection: 70,
    bcVision: 50, stiffArm: 51, spinMove: 45, jukeMove: 57, breakSack: 41,
    /* Blocking */
    runBlock: 48, passBlock: 50, impactBlocking: 53, runBlockPower: 50,
    runBlockFinesse: 50, passBlockPower: 45, passBlockFinesse: 45,
    leadBlock: 50,
  },
};
EGE.ratingsLockedSeason = 2022;
/* Where the numbers above stood when that season kicked off: only the
   attributes that moved, at their old values. It is what the ticker on a
   player's ratings measures the season's climb from. */
EGE.ratingsSeasonStart = {
  season: 2022,
  changes: {
    'jaykeb-stewart': {
      speed: 58, acceleration: 59, strength: 65, agility: 50, jumping: 52,
      injury: 54, stamina: 51, toughness: 49, throwUnderPressure: 74,
      throwAccuracyShort: 81, throwAccuracyMid: 78, throwAccuracyDeep: 76,
      throwOnTheRun: 78, playAction: 76, breakSack: 74,
    },
    'cooper-clark': {
      speed: 68, acceleration: 68, strength: 78, agility: 59, jumping: 67,
      injury: 68, stamina: 60, toughness: 63, changeOfDirection: 65,
      bcVision: 64,
    },
    'andrew-parr': {
      speed: 49, acceleration: 54, strength: 82, agility: 49, jumping: 60,
      injury: 54, stamina: 49, toughness: 60, spectacularCatch: 63,
      catchInTraffic: 69, routeRunningMedium: 61, routeRunningDeep: 62,
      release: 62, breakTackle: 50, trucking: 34, changeOfDirection: 36,
      bcVision: 38, breakSack: 39, impactBlocking: 64, runBlockPower: 54,
      runBlockFinesse: 55, passBlockPower: 57, leadBlock: 56,
    },
    'sam-stogsdill': {
      speed: 63, acceleration: 64, agility: 52, jumping: 65, stamina: 55,
      catching: 47, carrying: 80, breakTackle: 71, trucking: 84,
      changeOfDirection: 67, bcVision: 78, stiffArm: 66,
    },
    'isaac-vitel': {
      speed: 46, acceleration: 49, strength: 55, agility: 39, jumping: 47,
      injury: 49, stamina: 40, toughness: 45, throwUnderPressure: 72,
      throwAccuracyShort: 80, throwAccuracyMid: 67, throwAccuracyDeep: 76,
      throwOnTheRun: 69, playAction: 51, carrying: 46, breakTackle: 33,
      changeOfDirection: 31, bcVision: 34, breakSack: 38,
    },
    'paxon-hatch': {
      speed: 48, acceleration: 58, strength: 80, agility: 53, jumping: 58,
      injury: 52, stamina: 56, toughness: 55, catching: 75,
      spectacularCatch: 65, catchInTraffic: 65, routeRunningShort: 70,
      routeRunningMedium: 65, routeRunningDeep: 65, release: 65,
      breakTackle: 50, changeOfDirection: 65, jukeMove: 50,
    },
  }
};
/* ege:ratings:end */

/* Which group scores a position's page shows, and what to call them there.
   This is only about the page — what counts toward the overall is
   EGE.positionWeights. Anything not listed here shows every group. */
EGE.positionGroups = {
  QB: [
    { key: 'general',     label: 'General' },
    { key: 'passing',     label: 'Passing' },
    { key: 'ballCarrier', label: 'Carrying' }
  ],
  RB: [
    { key: 'general',     label: 'General' },
    { key: 'receiving',   label: 'Receiving' },
    { key: 'ballCarrier', label: 'Carrying' }
  ],
  /* No blocking: a receiver is not judged on it, and it is not on his page. */
  WR: [
    { key: 'general',     label: 'General' },
    { key: 'receiving',   label: 'Receiving' },
    { key: 'ballCarrier', label: 'Carrying' }
  ],
  TE: [
    { key: 'general',     label: 'General' },
    { key: 'receiving',   label: 'Catching' },
    { key: 'blocking',    label: 'Blocking' },
    { key: 'ballCarrier', label: 'Carrying' }
  ]
};

EGE.shownGroupsFor = function (position) {
  return EGE.positionGroups[position] || EGE.ratingGroups.map(function (group) {
    return { key: group.key, label: group.label };
  });
};

/* --- working the numbers out ---------------------------------------------- */

function egeGroupByKey(key) {
  return EGE.ratingGroups.filter(function (g) { return g.key === key; })[0] || null;
}

/* What the shop has done to a player's ratings, summed per attribute and
   keyed by player slug — not by email, so a player whose sign-in address is
   still TBD can carry boosts too. Filled in by js/wallet.js; empty until it
   has loaded, and empty forever if Supabase is not reachable. */
EGE.appliedBoosts = {};

EGE.boostsFor = function (player) {
  if (!player) { return {}; }
  return EGE.appliedBoosts[player.slug] || {};
};

/* Whether the shop rows the live season's lock folded into the base numbers
   are still there to be counted.

   Locking writes every purchase into the base, but the rows behind them stay
   in Supabase until the admin clears them -- and in between, base plus rows
   would count every one of them twice. So while the rows still carry all of
   what the lock folded in (each attribute moved at least as far, the same
   way), they are the season's purchases and are counted from where the
   season started. Once they are cleared, or never were folded, the base is
   the starting point as it always was. */
function egeRowsStillFolded(player, base, boosts) {
  var start = EGE.seasonStartValuesFor(player);
  var folded = Object.keys(base).filter(function (key) {
    return base[key] !== start[key];
  });
  if (!folded.length) { return false; }

  return folded.every(function (key) {
    var moved = base[key] - start[key];
    var bought = boosts[key] || 0;
    return moved > 0 ? bought >= moved : bought <= moved;
  });
}

/* Base ratings with everything bought folded in, never twice. Nothing leaves
   1-99. */
EGE.valuesFor = function (player) {
  var base = (player && EGE.ratings[player.slug]) || null;
  if (!base) { return null; }

  var boosts = EGE.boostsFor(player);
  if (!Object.keys(boosts).length) { return base; }

  var from = egeRowsStillFolded(player, base, boosts)
    ? EGE.seasonStartValuesFor(player)
    : base;

  var out = {};
  Object.keys(from).forEach(function (key) {
    var value = from[key] + (boosts[key] || 0);
    out[key] = Math.max(1, Math.min(99, value));
  });
  return out;
};

/* Where a player's numbers stood when the live season began. Until the
   season is locked that is the file's own base numbers -- everything since
   is in the shop rows. Once it is locked, the base has the season folded in,
   and EGE.ratingsSeasonStart holds what it replaced. */
EGE.seasonStartValuesFor = function (player) {
  var base = (player && EGE.ratings[player.slug]) || null;
  if (!base) { return null; }

  var start = EGE.ratingsSeasonStart;
  var changes = start && start.season === EGE.currentSeason &&
                start.changes && start.changes[player.slug];
  if (!changes) { return base; }

  var out = {};
  Object.keys(base).forEach(function (key) {
    out[key] = typeof changes[key] === 'number' ? changes[key] : base[key];
  });
  return out;
};

/* A group scores as the plain average of the attributes inside it. */
function egeGroupAverage(values, group) {
  if (!values || !group) { return null; }

  var total = 0;
  var counted = 0;
  group.attributes.forEach(function (attr) {
    if (typeof values[attr.key] === 'number') { total += values[attr.key]; counted += 1; }
  });
  return counted ? Math.round(total / counted) : null;
}

EGE.groupRating = function (player, groupKey) {
  return egeGroupAverage(EGE.valuesFor(player), egeGroupByKey(groupKey));
};

/* Every attribute this player's position is judged on, under the labels their
   page uses. What of it can be bought is the economy's business, not this
   file's — see TRAINING_ONLY_GROUPS in data/economy.js. */
EGE.boostableFor = function (player) {
  var out = [];
  EGE.shownGroupsFor(player && player.position).forEach(function (shown) {
    var group = egeGroupByKey(shown.key);
    if (!group) { return; }
    group.attributes.forEach(function (attr) {
      out.push({ key: attr.key, label: attr.label, group: shown.label, groupKey: shown.key });
    });
  });
  return out;
};

EGE.weightsFor = function (position) {
  return EGE.positionWeights[position] || EGE.positionWeights.DEFAULT;
};

/* The weighted average of the key attributes this player actually has —
   a tight end's blocking counts, nobody else carries any. */
function egeKeyAverage(values, weights) {
  var weighted = 0;
  var totalWeight = 0;
  Object.keys(weights).forEach(function (key) {
    if (typeof values[key] !== 'number') { return; }
    weighted += values[key] * weights[key];
    totalWeight += weights[key];
  });
  return totalWeight ? { average: weighted / totalWeight, totalWeight: totalWeight } : null;
}

/* The overall: the position's key attributes, weighted and stretched. */
function egeOverallOf(values, position) {
  if (!values) { return null; }
  var key = egeKeyAverage(values, EGE.weightsFor(position));
  if (!key) { return null; }

  var scale = EGE.overallScale;
  var overall = scale.pivot + scale.stretch * (key.average - scale.pivot);
  return Math.max(1, Math.min(99, Math.round(overall)));
}

EGE.overallFor = function (player) {
  if (!player || !EGE.ratings[player.slug]) { return null; }
  return egeOverallOf(EGE.valuesFor(player), player.position);
};

/* The overall the live season started on. */
EGE.seasonStartOverallFor = function (player) {
  if (!player || !EGE.ratings[player.slug]) { return null; }
  return egeOverallOf(EGE.seasonStartValuesFor(player), player.position);
};

/* How much overall one point on this attribute is worth to this player,
   before rounding. Zero for anything their position does not count. */
EGE.overallPerPoint = function (player, attributeKey) {
  if (!player || !EGE.ratings[player.slug]) { return 0; }
  var weights = EGE.weightsFor(player.position);
  var key = egeKeyAverage(EGE.valuesFor(player), weights);
  if (!key || !weights[attributeKey]) { return 0; }
  return EGE.overallScale.stretch * weights[attributeKey] / key.totalWeight;
};

/* Everything a ratings panel needs, in display order: the groups this
   position is judged on, under the labels it uses for them. Groups the
   player has no numbers for are dropped rather than rendered empty. */
EGE.ratingsFor = function (player) {
  if (!player || !EGE.ratings[player.slug]) { return null; }
  var values = EGE.valuesFor(player);
  var base = EGE.ratings[player.slug];
  var boosts = EGE.boostsFor(player);
  var start = EGE.seasonStartValuesFor(player);

  return {
    overall: EGE.overallFor(player),
    /* Where each number stood when the live season began, for the ticker. */
    overallStart: EGE.seasonStartOverallFor(player),
    position: player.position || null,
    groups: EGE.shownGroupsFor(player.position).map(function (shown) {
      var group = egeGroupByKey(shown.key);
      if (!group) { return null; }
      return {
        key: group.key,
        label: shown.label,
        rating: EGE.groupRating(player, group.key),
        ratingStart: egeGroupAverage(start, group),
        attributes: group.attributes.map(function (attr) {
          return {
            key: attr.key,
            label: attr.label,
            value: values[attr.key],
            start: start[attr.key],
            base: base[attr.key],
            boost: boosts[attr.key] || 0
          };
        })
      };
    }).filter(function (group) { return group && group.rating !== null; })
  };
};
