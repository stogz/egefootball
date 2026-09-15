/* ==========================================================================
   EGE Football — the offseason shop
   What credits buy, and how credits are earned. Prices are in credits.

   Spelling follows the site's own attribute names where the two describe
   the same thing, so "Catching in Traffic" here is the Catch in Traffic
   attribute in data/ratings.js. Where a listed item has no single attribute
   behind it yet — Block Power covers both run and pass block power — the
   key is null until that is settled.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.shop = {

  /* What a player has to start with, before an offseason has been played. */
  startingCredits: 0,

  /* What every player gets each offseason, whatever they are paid. The same
     60 as the earnings table's "Regular" row, not an extra 60 on top. */
  offseasonCredits: 60,

  /* Credits earned on top. Unspent credits carry into the next season. */
  earnings: [
    { label: 'Regular',                credits: 60 },
    { label: 'Rookie / small contract', credits: 10 },
    { label: 'Average starter salary',  credits: 30 },
    { label: 'High salary',             credits: 50 },
    { label: 'Top 3 salary',            credits: 70 },
    { label: 'Good season',             credits: 15 },
    { label: 'Pro Bowl season',         credits: 30 },
    { label: 'All-Pro season',          credits: 45 },
    { label: 'Major award season',      credits: 60 },
    { label: 'MVP / OPOY / DPOY',       credits: 75 }
  ],

  sections: [
    {
      key: 'boosters',
      title: 'Performance Boosters',
      blurb: 'Regular season games only, one use per purchase. Save one for a ' +
             'hard opponent, or spend it proving a point against a rival.',
      items: [
        { key: 'boost-2-5', name: '2.5x Booster', credits: 70, tag: '2.5x', consumable: true },
        { key: 'boost-2-0', name: '2.0x Booster', credits: 45, tag: '2.0x', consumable: true },
        { key: 'boost-1-5', name: '1.5x Booster', credits: 25, tag: '1.5x', consumable: true }
      ]
    },

    {
      key: 'stat-boosters',
      title: 'Stat Boosters',
      blurb: 'Applied to any one of the attributes below.',
      items: [
        { key: 'stat-1', name: '+1 Booster', credits: 15, tag: '+1', needsTarget: true },
        { key: 'stat-2', name: '+2 Booster', credits: 35, tag: '+2', needsTarget: true },
        { key: 'stat-3', name: '+3 Booster', credits: 60, tag: '+3', needsTarget: true }
      ],
      /* Which attributes a stat booster can be spent on. */
      targets: [
        {
          label: 'Passing',
          attributes: [
            { label: 'Throw Power',          key: 'throwPower' },
            { label: 'Throw Under Pressure', key: 'throwUnderPressure' },
            { label: 'Throw Accuracy Short', key: 'throwAccuracyShort' },
            { label: 'Throw Accuracy Mid',   key: 'throwAccuracyMid' },
            { label: 'Throw Accuracy Deep',  key: 'throwAccuracyDeep' },
            { label: 'Throw on the Run',     key: 'throwOnTheRun' },
            { label: 'Play Action',          key: 'playAction' },
            { label: 'Break Sack',           key: 'breakSack' }
          ]
        },
        {
          label: 'Receiving',
          attributes: [
            { label: 'Catching',             key: 'catching' },
            { label: 'Catching in Traffic',  key: 'catchInTraffic' },
            { label: 'Route Running Short',  key: 'routeRunningShort' },
            { label: 'Route Running Medium', key: 'routeRunningMedium' },
            { label: 'Route Running Deep',   key: 'routeRunningDeep' },
            { label: 'Release',              key: 'release' }
          ]
        },
        {
          label: 'Carrying',
          attributes: [
            { label: 'Carrying',            key: 'carrying' },
            { label: 'Break Tackle',        key: 'breakTackle' },
            { label: 'Trucking',            key: 'trucking' },
            { label: 'Change of Direction', key: 'changeOfDirection' },
            { label: 'Stiff Arm',           key: 'stiffArm' },
            { label: 'Spin Move',           key: 'spinMove' },
            { label: 'Juke Move',           key: 'jukeMove' }
          ]
        },
        {
          label: 'Blocking',
          attributes: [
            { label: 'Block Power', key: null },   /* run and pass block power */
            { label: 'Run Block',   key: 'runBlock' },
            { label: 'Pass Block',  key: 'passBlock' }
          ]
        }
      ]
    },

    {
      key: 'training',
      title: 'Offseason Training',
      blurb: 'Where the whole offseason goes. Each one trades something away.',
      items: [
        {
          key: 'train-strength',
          name: 'Offseason Strength Training',
          credits: 45,
          description: 'Strength, power and weight, built with frequent lifting and a ' +
                       'strict weight-gaining diet. Can cost speed, agility and stamina.'
        },
        {
          key: 'train-cardio',
          name: 'Offseason Cardio Training',
          credits: 45,
          description: 'Speed, stamina and agility, built with frequent conditioning ' +
                       'aimed at losing weight. Can cost strength, power and weight.'
        },
        {
          key: 'train-overall',
          name: 'Overall Offseason Training',
          credits: 35,
          description: 'Speed, strength, stamina and agility together, but only a little ' +
                       'of each. No side effects, and no jump as big as training one thing.'
        }
      ]
    },

    {
      key: 'extras',
      title: 'Everything Else',
      items: [
        {
          key: 'qb-connection',
          name: 'QB Connection',
          credits: 30,
          description: 'The whole offseason spent with your quarterback, learning his ' +
                       'routes and calls. Chemistry resets if he is injured, traded or ' +
                       'otherwise leaves. Better chemistry can mean more targets.'
        },
        {
          key: 'hyperbaric',
          name: 'Hyperbaric Chamber',
          credits: 50,
          creditsLadder: [50, 65, 85],
          creditsStep: 20,
          note: 'NFL only',
          tiers: ['nfl'],
          description: 'Lowers your injury chance, and bought often enough it extends ' +
                       'your career. Only available after your first NFL season. ' +
                       '50, then 65, then 85, and 20 more each time after that.'
        },
        {
          key: 'intel',
          name: 'Intel',
          credits: 20,
          note: 'High school and college only',
          tiers: ['highSchool', 'college'],
          seasonBound: true,          /* good for the season it is bought in */
          description: 'Find out which games scouts will be at — college scouts while ' +
                       'you are in high school, NFL scouts while you are in college. ' +
                       'Nothing left to scout for once you are in the NFL.'
        }
      ]
    }
  ]
};

/* Whether an item can be bought in a given season, and why not when it
   cannot. A player with no NFL season behind them cannot buy a chamber. */
EGE.itemAvailable = function (item, season) {
  if (!item || !item.tiers) { return { ok: true }; }

  var tier = EGE.tierFor(season);
  if (item.tiers.indexOf(tier) !== -1) { return { ok: true }; }

  if (item.tiers.length === 1 && item.tiers[0] === 'nfl') {
    return { ok: false, reason: 'NFL only — nobody has played an NFL season yet.' };
  }
  return { ok: false, reason: 'Not available at this level.' };
};

/* Every purchasable thing, flattened, so an inventory row can name what it
   was bought from. */
EGE.shopItems = function () {
  var items = [];
  EGE.shop.sections.forEach(function (section) {
    section.items.forEach(function (item) {
      items.push({ section: section.key, item: item });
    });
  });
  return items;
};

EGE.shopItem = function (key) {
  var found = EGE.shopItems().filter(function (entry) { return entry.item.key === key; })[0];
  return found ? found.item : null;
};

/* The attributes a stat booster may be spent on, flattened for a picker. */
EGE.boosterTargets = function () {
  var section = EGE.shop.sections.filter(function (s) { return s.key === 'stat-boosters'; })[0];
  if (!section) { return []; }
  var out = [];
  section.targets.forEach(function (group) {
    group.attributes.forEach(function (attr) {
      out.push({ label: attr.label, key: attr.key, group: group.label });
    });
  });
  return out;
};
