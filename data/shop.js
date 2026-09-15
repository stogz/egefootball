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

  /* What a player gets to spend each offseason, before anything earned. */
  allowance: [
    { label: 'Every offseason',          credits: 100 },
    { label: 'Making over $5m AAV',      credits: 200 },
    { label: 'Making over $10m AAV',     credits: 300 }
  ],

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
        { name: '2.5x Booster', credits: 70, tag: '2.5x' },
        { name: '2.0x Booster', credits: 45, tag: '2.0x' },
        { name: '1.5x Booster', credits: 25, tag: '1.5x' }
      ]
    },

    {
      key: 'stat-boosters',
      title: 'Stat Boosters',
      blurb: 'Applied to any one of the attributes below.',
      items: [
        { name: '+1 Booster', credits: 15, tag: '+1' },
        { name: '+2 Booster', credits: 35, tag: '+2' },
        { name: '+3 Booster', credits: 60, tag: '+3' }
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
          name: 'Offseason Strength Training',
          credits: 45,
          description: 'Strength, power and weight, built with frequent lifting and a ' +
                       'strict weight-gaining diet. Can cost speed, agility and stamina.'
        },
        {
          name: 'Offseason Cardio Training',
          credits: 45,
          description: 'Speed, stamina and agility, built with frequent conditioning ' +
                       'aimed at losing weight. Can cost strength, power and weight.'
        },
        {
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
          name: 'QB Connection',
          credits: 30,
          description: 'The whole offseason spent with your quarterback, learning his ' +
                       'routes and calls. Chemistry resets if he is injured, traded or ' +
                       'otherwise leaves. Better chemistry can mean more targets.'
        },
        {
          name: 'Hyperbaric Chamber',
          credits: 50,
          creditsLadder: [50, 65, 85],
          creditsStep: 20,
          note: 'NFL only',
          description: 'Lowers your injury chance, and bought often enough it extends ' +
                       'your career. Only available after your first NFL season. ' +
                       '50, then 65, then 85, and 20 more each time after that.'
        },
        {
          name: 'Intel',
          credits: 20,
          description: 'Find out which games scouts will be at — college scouts while ' +
                       'you are in high school, NFL scouts while you are in college.'
        }
      ]
    }
  ]
};
