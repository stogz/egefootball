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
/* Locked on 2026-09-23, at the end of the 2019 season. Every rating
   point and every offseason workout bought during that season is part of
   these numbers now, and the shop rows behind them have been cleared. */
EGE.ratings = {
  'jaykeb-stewart': {
    /* General */
    speed: 49, acceleration: 48, strength: 46, agility: 41, awareness: 42,
    jumping: 41, injury: 46, stamina: 42, toughness: 41,
    /* Passing */
    throwPower: 66, throwUnderPressure: 66, throwAccuracyShort: 65,
    throwAccuracyMid: 62, throwAccuracyDeep: 60, throwOnTheRun: 62,
    playAction: 56,
    /* Receiving */
    catching: 22, spectacularCatch: 23, catchInTraffic: 22,
    routeRunningShort: 22, routeRunningMedium: 16, routeRunningDeep: 21,
    release: 22,
    /* Ball Carrier */
    carrying: 41, breakTackle: 36, trucking: 31, changeOfDirection: 39,
    bcVision: 37, stiffArm: 41, spinMove: 41, jukeMove: 36, breakSack: 58,
  },
  'cooper-clark': {
    /* General */
    speed: 55, acceleration: 55, strength: 53, agility: 46, awareness: 48,
    jumping: 50, injury: 56, stamina: 47, toughness: 51,
    /* Passing */
    throwPower: 14, throwUnderPressure: 18, throwAccuracyShort: 12,
    throwAccuracyMid: 9, throwAccuracyDeep: 16, throwOnTheRun: 14,
    playAction: 9,
    /* Receiving */
    catching: 58, spectacularCatch: 45, catchInTraffic: 55,
    routeRunningShort: 58, routeRunningMedium: 40, routeRunningDeep: 39,
    release: 45,
    /* Ball Carrier */
    carrying: 57, breakTackle: 58, trucking: 45, changeOfDirection: 58,
    bcVision: 62, stiffArm: 56, spinMove: 58, jukeMove: 58, breakSack: 59,
  },
  'andrew-parr': {
    /* General */
    speed: 44, acceleration: 45, strength: 53, agility: 44, awareness: 44,
    jumping: 45, injury: 40, stamina: 44, toughness: 46,
    /* Passing */
    throwPower: 17, throwUnderPressure: 8, throwAccuracyShort: 10,
    throwAccuracyMid: 8, throwAccuracyDeep: 17, throwOnTheRun: 15,
    playAction: 7,
    /* Receiving */
    catching: 67, spectacularCatch: 60, catchInTraffic: 67,
    routeRunningShort: 62, routeRunningMedium: 61, routeRunningDeep: 62,
    release: 62,
    /* Ball Carrier */
    carrying: 43, breakTackle: 33, trucking: 34, changeOfDirection: 31,
    bcVision: 37, stiffArm: 37, spinMove: 42, jukeMove: 38, breakSack: 39,
    /* Blocking */
    runBlock: 49, passBlock: 52, impactBlocking: 59, runBlockPower: 46,
    runBlockFinesse: 55, passBlockPower: 57, passBlockFinesse: 57,
    leadBlock: 51,
  },
  'sam-stogsdill': {
    /* General */
    speed: 56, acceleration: 55, strength: 70, agility: 45, awareness: 46,
    jumping: 50, injury: 54, stamina: 48, toughness: 50,
    /* Passing */
    throwPower: 13, throwUnderPressure: 17, throwAccuracyShort: 12,
    throwAccuracyMid: 9, throwAccuracyDeep: 15, throwOnTheRun: 13,
    playAction: 9,
    /* Receiving */
    catching: 46, spectacularCatch: 42, catchInTraffic: 40,
    routeRunningShort: 41, routeRunningMedium: 33, routeRunningDeep: 38,
    release: 41,
    /* Ball Carrier */
    carrying: 63, breakTackle: 66, trucking: 79, changeOfDirection: 48,
    bcVision: 58, stiffArm: 66, spinMove: 44, jukeMove: 39, breakSack: 70,
  },
  'isaac-vitel': {
    /* General */
    speed: 40, acceleration: 39, strength: 35, agility: 33, awareness: 35,
    jumping: 35, injury: 39, stamina: 34, toughness: 35,
    /* Passing */
    throwPower: 66, throwUnderPressure: 65, throwAccuracyShort: 72,
    throwAccuracyMid: 60, throwAccuracyDeep: 72, throwOnTheRun: 59,
    playAction: 51,
    /* Receiving */
    catching: 19, spectacularCatch: 21, catchInTraffic: 19,
    routeRunningShort: 19, routeRunningMedium: 13, routeRunningDeep: 18,
    release: 19,
    /* Ball Carrier */
    carrying: 33, breakTackle: 30, trucking: 26, changeOfDirection: 30,
    bcVision: 34, stiffArm: 35, spinMove: 36, jukeMove: 30, breakSack: 35,
  },
  'paxon-hatch': {
    /* General */
    speed: 39, acceleration: 43, strength: 43, agility: 44, awareness: 42,
    jumping: 37, injury: 36, stamina: 47, toughness: 39,
    /* Passing */
    throwPower: 8, throwUnderPressure: 18, throwAccuracyShort: 12,
    throwAccuracyMid: 16, throwAccuracyDeep: 12, throwOnTheRun: 14,
    playAction: 7,
    /* Receiving */
    catching: 63, spectacularCatch: 58, catchInTraffic: 63,
    routeRunningShort: 58, routeRunningMedium: 58, routeRunningDeep: 51,
    release: 63,
    /* Ball Carrier */
    carrying: 39, breakTackle: 48, trucking: 44, changeOfDirection: 44,
    bcVision: 39, stiffArm: 48, spinMove: 44, jukeMove: 44, breakSack: 41,
    /* Blocking */
    runBlock: 44, passBlock: 48, impactBlocking: 53, runBlockPower: 50,
    runBlockFinesse: 49, passBlockPower: 41, passBlockFinesse: 40,
    leadBlock: 48,
  },
};
EGE.ratingsLockedSeason = 2019;
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

/* Base ratings with everything bought folded in. Nothing leaves 1-99. */
EGE.valuesFor = function (player) {
  var base = (player && EGE.ratings[player.slug]) || null;
  if (!base) { return null; }

  var boosts = EGE.boostsFor(player);
  if (!Object.keys(boosts).length) { return base; }

  var out = {};
  Object.keys(base).forEach(function (key) {
    var value = base[key] + (boosts[key] || 0);
    out[key] = Math.max(1, Math.min(99, value));
  });
  return out;
};

/* A group scores as the plain average of the attributes inside it. */
EGE.groupRating = function (player, groupKey) {
  var values = EGE.valuesFor(player);
  var group = egeGroupByKey(groupKey);
  if (!values || !group) { return null; }

  var total = 0;
  var counted = 0;
  group.attributes.forEach(function (attr) {
    if (typeof values[attr.key] === 'number') { total += values[attr.key]; counted += 1; }
  });
  return counted ? Math.round(total / counted) : null;
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
EGE.overallFor = function (player) {
  if (!player || !EGE.ratings[player.slug]) { return null; }
  var key = egeKeyAverage(EGE.valuesFor(player), EGE.weightsFor(player.position));
  if (!key) { return null; }

  var scale = EGE.overallScale;
  var overall = scale.pivot + scale.stretch * (key.average - scale.pivot);
  return Math.max(1, Math.min(99, Math.round(overall)));
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

  return {
    overall: EGE.overallFor(player),
    position: player.position || null,
    groups: EGE.shownGroupsFor(player.position).map(function (shown) {
      var group = egeGroupByKey(shown.key);
      if (!group) { return null; }
      return {
        key: group.key,
        label: shown.label,
        rating: EGE.groupRating(player, group.key),
        attributes: group.attributes.map(function (attr) {
          return {
            key: attr.key,
            label: attr.label,
            value: values[attr.key],
            base: base[attr.key],
            boost: boosts[attr.key] || 0
          };
        })
      };
    }).filter(function (group) { return group && group.rating !== null; })
  };
};
