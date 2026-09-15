/* ==========================================================================
   EGE Football — player ratings
   Seven groups of attributes per player, the same shape for everyone. Each
   group scores as the average of its attributes, and a player's overall is
   those group scores weighted by what their position actually does — a
   quarterback's overall leans on passing, a back's on ball carrying — with
   every other group still counting for something.

   The numbers below are placeholders: randomly generated within bands that
   suit each position, so the weighting can be seen working. Replace them
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
    key: 'defense',
    label: 'Defense',
    attributes: [
      { key: 'tackle',          label: 'Tackle' },
      { key: 'powerMoves',      label: 'Power Moves' },
      { key: 'finesseMoves',    label: 'Finesse Moves' },
      { key: 'blockShedding',   label: 'Block Shedding' },
      { key: 'pursuit',         label: 'Pursuit' },
      { key: 'playRecognition', label: 'Play Recognition' },
      { key: 'manCoverage',     label: 'Man Coverage' },
      { key: 'zoneCoverage',    label: 'Zone Coverage' },
      { key: 'hitPower',        label: 'Hit Power' },
      { key: 'press',           label: 'Press' }
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
  {
    key: 'kicking',
    label: 'Kicking',
    attributes: [
      { key: 'kickPower',    label: 'Kick Power' },
      { key: 'kickAccuracy', label: 'Kick Accuracy' },
      { key: 'kickReturn',   label: 'Kick Return' }
    ]
  }
];

/* How much each group counts toward the overall, per position. These do not
   have to add up to anything in particular — they are normalised when the
   overall is worked out — so a group can be nudged without rebalancing the
   rest. Nothing is ever zero: a quarterback who can block is worth more than
   one who cannot, just not much more. */
EGE.positionWeights = {
  QB: { general: 20, passing: 46, receiving:  2, ballCarrier: 16, defense:  2, blocking:  2, kicking: 2 },
  RB: { general: 26, passing:  1, receiving: 12, ballCarrier: 44, defense:  2, blocking: 13, kicking: 2 },
  WR: { general: 28, passing:  1, receiving: 46, ballCarrier: 18, defense:  2, blocking:  4, kicking: 1 },
  TE: { general: 24, passing:  1, receiving: 38, ballCarrier: 12, defense:  2, blocking: 22, kicking: 1 },
  OL: { general: 24, passing:  1, receiving:  2, ballCarrier:  4, defense:  6, blocking: 61, kicking: 2 },
  DL: { general: 26, passing:  1, receiving:  1, ballCarrier:  3, defense: 62, blocking:  6, kicking: 1 },
  LB: { general: 28, passing:  1, receiving:  4, ballCarrier:  4, defense: 58, blocking:  4, kicking: 1 },
  DB: { general: 32, passing:  1, receiving:  8, ballCarrier:  4, defense: 54, blocking:  1, kicking: 1 },
  K:  { general: 20, passing:  1, receiving:  1, ballCarrier:  2, defense:  4, blocking:  2, kicking: 70 },
  P:  { general: 20, passing:  1, receiving:  1, ballCarrier:  2, defense:  4, blocking:  2, kicking: 70 },

  /* Used while a player's position is still TBD: everything counts, with
     the athletic attributes counting most. */
  DEFAULT: { general: 30, passing: 10, receiving: 12, ballCarrier: 14, defense: 12, blocking: 12, kicking: 10 }
};

/* Placeholder attribute values, keyed by player slug. */
EGE.ratings = {
  'andrew-parr': {
    /* General */
    speed: 80, acceleration: 82, strength: 85, agility: 88, awareness: 81,
    jumping: 89, injury: 79, stamina: 97, toughness: 82,
    /* Passing */
    throwPower: 12, throwUnderPressure: 16, throwAccuracyShort: 34,
    throwAccuracyMid: 17, throwAccuracyDeep: 14, throwOnTheRun: 26,
    playAction: 43,
    /* Receiving */
    catching: 90, spectacularCatch: 82, catchInTraffic: 88,
    routeRunningShort: 76, routeRunningMedium: 74, routeRunningDeep: 69,
    release: 89,
    /* Ball Carrier */
    carrying: 85, breakTackle: 80, trucking: 87, changeOfDirection: 86,
    bcVision: 97, stiffArm: 94, spinMove: 81, jukeMove: 78, breakSack: 87,
    /* Defense */
    tackle: 16, powerMoves: 21, finesseMoves: 21, blockShedding: 35,
    pursuit: 11, playRecognition: 40, manCoverage: 16, zoneCoverage: 12,
    hitPower: 43, press: 34,
    /* Blocking */
    runBlock: 50, passBlock: 50, impactBlocking: 56, runBlockPower: 52,
    runBlockFinesse: 48, passBlockPower: 53, passBlockFinesse: 56,
    leadBlock: 56,
    /* Kicking */
    kickPower: 36, kickAccuracy: 34, kickReturn: 26,
  },
  'cooper-clark': {
    /* General */
    speed: 84, acceleration: 87, strength: 96, agility: 83, awareness: 86,
    jumping: 91, injury: 97, stamina: 88, toughness: 96,
    /* Passing */
    throwPower: 31, throwUnderPressure: 27, throwAccuracyShort: 22,
    throwAccuracyMid: 42, throwAccuracyDeep: 10, throwOnTheRun: 39,
    playAction: 19,
    /* Receiving */
    catching: 89, spectacularCatch: 97, catchInTraffic: 96,
    routeRunningShort: 86, routeRunningMedium: 93, routeRunningDeep: 83,
    release: 79,
    /* Ball Carrier */
    carrying: 68, breakTackle: 85, trucking: 84, changeOfDirection: 69,
    bcVision: 73, stiffArm: 70, spinMove: 85, jukeMove: 80, breakSack: 75,
    /* Defense */
    tackle: 22, powerMoves: 18, finesseMoves: 29, blockShedding: 43,
    pursuit: 40, playRecognition: 27, manCoverage: 38, zoneCoverage: 39,
    hitPower: 16, press: 39,
    /* Blocking */
    runBlock: 30, passBlock: 32, impactBlocking: 38, runBlockPower: 46,
    runBlockFinesse: 41, passBlockPower: 31, passBlockFinesse: 33,
    leadBlock: 33,
    /* Kicking */
    kickPower: 21, kickAccuracy: 41, kickReturn: 42,
  },
  'paxon-hatch': {
    /* General */
    speed: 78, acceleration: 71, strength: 80, agility: 91, awareness: 86,
    jumping: 83, injury: 77, stamina: 68, toughness: 84,
    /* Passing */
    throwPower: 37, throwUnderPressure: 38, throwAccuracyShort: 38,
    throwAccuracyMid: 13, throwAccuracyDeep: 43, throwOnTheRun: 18,
    playAction: 23,
    /* Receiving */
    catching: 85, spectacularCatch: 74, catchInTraffic: 86,
    routeRunningShort: 77, routeRunningMedium: 89, routeRunningDeep: 90,
    release: 83,
    /* Ball Carrier */
    carrying: 61, breakTackle: 81, trucking: 84, changeOfDirection: 71,
    bcVision: 77, stiffArm: 55, spinMove: 72, jukeMove: 62, breakSack: 72,
    /* Defense */
    tackle: 48, powerMoves: 38, finesseMoves: 55, blockShedding: 37,
    pursuit: 47, playRecognition: 36, manCoverage: 26, zoneCoverage: 44,
    hitPower: 28, press: 49,
    /* Blocking */
    runBlock: 88, passBlock: 88, impactBlocking: 73, runBlockPower: 61,
    runBlockFinesse: 77, passBlockPower: 82, passBlockFinesse: 76,
    leadBlock: 86,
    /* Kicking */
    kickPower: 20, kickAccuracy: 42, kickReturn: 27,
  },
  'isaac-vitel': {
    /* General */
    speed: 74, acceleration: 77, strength: 70, agility: 82, awareness: 68,
    jumping: 88, injury: 84, stamina: 73, toughness: 84,
    /* Passing */
    throwPower: 88, throwUnderPressure: 83, throwAccuracyShort: 89,
    throwAccuracyMid: 99, throwAccuracyDeep: 79, throwOnTheRun: 85,
    playAction: 99,
    /* Receiving */
    catching: 19, spectacularCatch: 31, catchInTraffic: 22,
    routeRunningShort: 28, routeRunningMedium: 37, routeRunningDeep: 29,
    release: 34,
    /* Ball Carrier */
    carrying: 75, breakTackle: 61, trucking: 59, changeOfDirection: 81,
    bcVision: 69, stiffArm: 79, spinMove: 63, jukeMove: 78, breakSack: 72,
    /* Defense */
    tackle: 33, powerMoves: 42, finesseMoves: 36, blockShedding: 21,
    pursuit: 31, playRecognition: 37, manCoverage: 37, zoneCoverage: 19,
    hitPower: 29, press: 36,
    /* Blocking */
    runBlock: 13, passBlock: 32, impactBlocking: 26, runBlockPower: 32,
    runBlockFinesse: 39, passBlockPower: 27, passBlockFinesse: 14,
    leadBlock: 12,
    /* Kicking */
    kickPower: 19, kickAccuracy: 40, kickReturn: 15,
  },
  'sam-stogsdill': {
    /* General */
    speed: 86, acceleration: 99, strength: 84, agility: 90, awareness: 84,
    jumping: 91, injury: 85, stamina: 78, toughness: 87,
    /* Passing */
    throwPower: 31, throwUnderPressure: 22, throwAccuracyShort: 16,
    throwAccuracyMid: 15, throwAccuracyDeep: 15, throwOnTheRun: 34,
    playAction: 28,
    /* Receiving */
    catching: 85, spectacularCatch: 74, catchInTraffic: 77,
    routeRunningShort: 69, routeRunningMedium: 66, routeRunningDeep: 68,
    release: 73,
    /* Ball Carrier */
    carrying: 99, breakTackle: 99, trucking: 82, changeOfDirection: 89,
    bcVision: 88, stiffArm: 82, spinMove: 89, jukeMove: 81, breakSack: 78,
    /* Defense */
    tackle: 28, powerMoves: 24, finesseMoves: 21, blockShedding: 21,
    pursuit: 39, playRecognition: 15, manCoverage: 21, zoneCoverage: 32,
    hitPower: 40, press: 35,
    /* Blocking */
    runBlock: 47, passBlock: 52, impactBlocking: 60, runBlockPower: 53,
    runBlockFinesse: 37, passBlockPower: 55, passBlockFinesse: 52,
    leadBlock: 46,
    /* Kicking */
    kickPower: 28, kickAccuracy: 21, kickReturn: 14,
  },
  'jaykeb-stewart': {
    /* General */
    speed: 66, acceleration: 89, strength: 92, agility: 83, awareness: 91,
    jumping: 69, injury: 90, stamina: 84, toughness: 76,
    /* Passing */
    throwPower: 78, throwUnderPressure: 85, throwAccuracyShort: 84,
    throwAccuracyMid: 89, throwAccuracyDeep: 85, throwOnTheRun: 98,
    playAction: 83,
    /* Receiving */
    catching: 12, spectacularCatch: 26, catchInTraffic: 10,
    routeRunningShort: 28, routeRunningMedium: 30, routeRunningDeep: 28,
    release: 18,
    /* Ball Carrier */
    carrying: 75, breakTackle: 83, trucking: 77, changeOfDirection: 60,
    bcVision: 61, stiffArm: 69, spinMove: 72, jukeMove: 61, breakSack: 72,
    /* Defense */
    tackle: 12, powerMoves: 12, finesseMoves: 24, blockShedding: 25,
    pursuit: 29, playRecognition: 10, manCoverage: 19, zoneCoverage: 13,
    hitPower: 41, press: 12,
    /* Blocking */
    runBlock: 29, passBlock: 14, impactBlocking: 32, runBlockPower: 43,
    runBlockFinesse: 11, passBlockPower: 21, passBlockFinesse: 15,
    leadBlock: 37,
    /* Kicking */
    kickPower: 29, kickAccuracy: 15, kickReturn: 22,
  },
};

/* --- working the numbers out ---------------------------------------------- */

function egeGroupByKey(key) {
  return EGE.ratingGroups.filter(function (g) { return g.key === key; })[0] || null;
}

/* A group scores as the plain average of the attributes inside it. */
EGE.groupRating = function (slug, groupKey) {
  var values = EGE.ratings[slug];
  var group = egeGroupByKey(groupKey);
  if (!values || !group) { return null; }

  var total = 0;
  var counted = 0;
  group.attributes.forEach(function (attr) {
    if (typeof values[attr.key] === 'number') { total += values[attr.key]; counted += 1; }
  });
  return counted ? Math.round(total / counted) : null;
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
    var rating = EGE.groupRating(player.slug, group.key);
    var weight = weights[group.key] || 0;
    if (rating === null || !weight) { return; }
    weighted += rating * weight;
    totalWeight += weight;
  });

  return totalWeight ? Math.round(weighted / totalWeight) : null;
};

/* Everything a ratings panel needs, in display order. */
EGE.ratingsFor = function (player) {
  if (!player || !EGE.ratings[player.slug]) { return null; }
  var values = EGE.ratings[player.slug];
  var weights = EGE.weightsFor(player.position);

  return {
    overall: EGE.overallFor(player),
    position: player.position || null,
    groups: EGE.ratingGroups.map(function (group) {
      return {
        key: group.key,
        label: group.label,
        rating: EGE.groupRating(player.slug, group.key),
        weight: weights[group.key] || 0,
        attributes: group.attributes.map(function (attr) {
          return { key: attr.key, label: attr.label, value: values[attr.key] };
        })
      };
    })
  };
};
