/* ==========================================================================
   EGE Football — player ratings
   Four groups of attributes every player carries, plus blocking for the
   tight ends, who are the only position here whose overall should turn on
   it. A group scores as the average of its attributes, and a player's overall is
   those group scores weighted by what their position actually does — a
   quarterback's overall leans on passing, a back's on ball carrying — with
   every other group still counting for something.

   The numbers below are placeholders, generated to put every player near 50
   overall in a set order — Stewart, Clark, Parr, Stogsdill, Vitel, Hatch —
   while still looking like the position each of them plays. Replace them
   with real ones as they are decided.
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

/* How much each group counts toward the overall, per position. These do not
   have to add up to anything in particular — they are normalised when the
   overall is worked out — so a group can be nudged without rebalancing the
   rest. Nothing is ever zero: a quarterback who can carry the ball is worth
   more than one who cannot, just not much more.

   A group with no weight here is left out of that position's overall
   entirely, which is how blocking counts for a tight end and for nobody
   else. Only the positions these groups describe are listed: linemen,
   defenders and kickers need attributes this file does not carry. */
EGE.positionWeights = {
  QB: { general: 20, passing: 46, receiving:  2, ballCarrier: 16 },
  /* Receiving counts heavily for a back — these are backs who catch, not
     just carry. */
  RB: { general: 25, passing:  1, receiving: 22, ballCarrier: 39 },
  WR: { general: 28, passing:  1, receiving: 48, ballCarrier: 20 },
  TE: { general: 26, passing:  1, receiving: 40, ballCarrier: 14, blocking: 20 },

  /* Used while a player's position is still TBD: everything counts, with
     the athletic attributes counting most. */
  DEFAULT: { general: 34, passing: 20, receiving: 22, ballCarrier: 24, blocking: 14 }
};

/* Placeholder attribute values, keyed by player slug.

   Everything between the two markers below is rewritten wholesale when a
   season is locked from the admin portal: the numbers there become whatever
   the players had bought their way up to, and the shop rows behind them are
   cleared. Nothing else in this file is touched, so leave the markers alone
   and edit inside them freely. */
/* ege:ratings:start */
EGE.ratings = {
  'jaykeb-stewart': {
    /* General */
    speed: 54, acceleration: 52, strength: 48, agility: 45, awareness: 49,
    jumping: 47, injury: 53, stamina: 46, toughness: 48,
    /* Passing */
    throwPower: 64, throwUnderPressure: 68, throwAccuracyShort: 62,
    throwAccuracyMid: 59, throwAccuracyDeep: 66, throwOnTheRun: 64,
    playAction: 59,
    /* Receiving */
    catching: 26, spectacularCatch: 27, catchInTraffic: 25,
    routeRunningShort: 26, routeRunningMedium: 18, routeRunningDeep: 24,
    release: 26,
    /* Ball Carrier */
    carrying: 44, breakTackle: 42, trucking: 36, changeOfDirection: 41,
    bcVision: 43, stiffArm: 48, spinMove: 48, jukeMove: 42, breakSack: 47,
  },
  'cooper-clark': {
    /* General */
    speed: 57, acceleration: 55, strength: 51, agility: 48, awareness: 52,
    jumping: 50, injury: 56, stamina: 49, toughness: 51,
    /* Passing */
    throwPower: 15, throwUnderPressure: 19, throwAccuracyShort: 13,
    throwAccuracyMid: 10, throwAccuracyDeep: 17, throwOnTheRun: 15,
    playAction: 10,
    /* Receiving */
    catching: 45, spectacularCatch: 46, catchInTraffic: 44,
    routeRunningShort: 45, routeRunningMedium: 37, routeRunningDeep: 42,
    release: 45,
    /* Ball Carrier */
    carrying: 58, breakTackle: 55, trucking: 50, changeOfDirection: 54,
    bcVision: 57, stiffArm: 61, spinMove: 62, jukeMove: 55, breakSack: 60,
  },
  'andrew-parr': {
    /* General */
    speed: 46, acceleration: 47, strength: 52, agility: 46, awareness: 46,
    jumping: 47, injury: 42, stamina: 46, toughness: 48,
    /* Passing */
    throwPower: 18, throwUnderPressure: 8, throwAccuracyShort: 11,
    throwAccuracyMid: 8, throwAccuracyDeep: 18, throwOnTheRun: 16,
    playAction: 7,
    /* Receiving */
    catching: 64, spectacularCatch: 63, catchInTraffic: 59,
    routeRunningShort: 58, routeRunningMedium: 52, routeRunningDeep: 50,
    release: 57,
    /* Ball Carrier */
    carrying: 33, breakTackle: 35, trucking: 36, changeOfDirection: 33,
    bcVision: 39, stiffArm: 39, spinMove: 44, jukeMove: 40, breakSack: 41,
    /* Blocking */
    runBlock: 51, passBlock: 53, impactBlocking: 50, runBlockPower: 48,
    runBlockFinesse: 58, passBlockPower: 58, passBlockFinesse: 56,
    leadBlock: 54,
  },
  'sam-stogsdill': {
    /* General */
    speed: 54, acceleration: 53, strength: 48, agility: 46, awareness: 49,
    jumping: 48, injury: 53, stamina: 46, toughness: 49,
    /* Passing */
    throwPower: 14, throwUnderPressure: 18, throwAccuracyShort: 13,
    throwAccuracyMid: 10, throwAccuracyDeep: 16, throwOnTheRun: 14,
    playAction: 9,
    /* Receiving */
    catching: 43, spectacularCatch: 44, catchInTraffic: 42,
    routeRunningShort: 43, routeRunningMedium: 35, routeRunningDeep: 40,
    release: 43,
    /* Ball Carrier */
    carrying: 55, breakTackle: 52, trucking: 47, changeOfDirection: 51,
    bcVision: 54, stiffArm: 58, spinMove: 59, jukeMove: 52, breakSack: 58,
  },
  'isaac-vitel': {
    /* General */
    speed: 47, acceleration: 46, strength: 41, agility: 39, awareness: 42,
    jumping: 41, injury: 46, stamina: 40, toughness: 42,
    /* Passing */
    throwPower: 55, throwUnderPressure: 60, throwAccuracyShort: 54,
    throwAccuracyMid: 51, throwAccuracyDeep: 58, throwOnTheRun: 56,
    playAction: 51,
    /* Receiving */
    catching: 23, spectacularCatch: 25, catchInTraffic: 22,
    routeRunningShort: 23, routeRunningMedium: 15, routeRunningDeep: 21,
    release: 23,
    /* Ball Carrier */
    carrying: 39, breakTackle: 36, trucking: 31, changeOfDirection: 35,
    bcVision: 38, stiffArm: 42, spinMove: 43, jukeMove: 36, breakSack: 41,
  },
  'paxon-hatch': {
    /* General */
    speed: 38, acceleration: 42, strength: 40, agility: 43, awareness: 43,
    jumping: 36, injury: 35, stamina: 46, toughness: 38,
    /* Passing */
    throwPower: 8, throwUnderPressure: 19, throwAccuracyShort: 12,
    throwAccuracyMid: 17, throwAccuracyDeep: 12, throwOnTheRun: 14,
    playAction: 7,
    /* Receiving */
    catching: 53, spectacularCatch: 56, catchInTraffic: 52,
    routeRunningShort: 55, routeRunningMedium: 54, routeRunningDeep: 45,
    release: 55,
    /* Ball Carrier */
    carrying: 37, breakTackle: 33, trucking: 29, changeOfDirection: 41,
    bcVision: 35, stiffArm: 39, spinMove: 41, jukeMove: 39, breakSack: 42,
    /* Blocking */
    runBlock: 45, passBlock: 50, impactBlocking: 45, runBlockPower: 52,
    runBlockFinesse: 51, passBlockPower: 40, passBlockFinesse: 41,
    leadBlock: 42,
  },
};
/* ege:ratings:end */

/* Which group scores a position's page shows, and what to call them there.
   A quarterback's receiving still counts toward his overall — it just isn't
   worth a line on the page. Anything not listed here shows every group. */
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

/* The overall: every group score, weighted by what the position asks for. */
EGE.overallFor = function (player) {
  if (!player || !EGE.ratings[player.slug]) { return null; }
  var weights = EGE.weightsFor(player.position);

  var weighted = 0;
  var totalWeight = 0;
  EGE.ratingGroups.forEach(function (group) {
    var rating = EGE.groupRating(player, group.key);
    var weight = weights[group.key] || 0;
    if (rating === null || !weight) { return; }
    weighted += rating * weight;
    totalWeight += weight;
  });

  return totalWeight ? Math.round(weighted / totalWeight) : null;
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
