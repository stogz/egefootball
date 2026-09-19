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

  /* Training rolls one twelve-sided die, and the downside lands on a 1, 2 or
     3 — a quarter of the time, not most of it. Rolling each risk separately
     is what made three separate coin flips add up to "always". */
  riskDie: 12,
  riskFailsOn: 3,

  sections: [
    {
      key: 'boosters',
      title: 'Performance Boosters',
      blurb: 'Regular season games only, one use per purchase. Save one for a ' +
             'hard opponent, or spend it proving a point against a rival.',
      items: [
        { key: 'boost-2-5', name: '2.5x Booster', credits: 40, tag: '2.5x', multiplier: 2.5, consumable: true },
        { key: 'boost-2-0', name: '2.0x Booster', credits: 25, tag: '2.0x', multiplier: 2.0, consumable: true },
        { key: 'boost-1-5', name: '1.5x Booster', credits: 15, tag: '1.5x', multiplier: 1.5, consumable: true }
      ]
    },

    {
      key: 'upgrades',
      title: 'Rating Points',
      blurb: 'Buy points straight into the attributes your position is judged ' +
             'on. A point costs more the closer that attribute is to 99, so ' +
             'early ones are a credit or two and late ones are not. The ' +
             'general attributes are not here — speed, strength, stamina and ' +
             'the rest move through offseason training only.',
      upgrades: true,
      items: []
    },

    {
      key: 'training',
      title: 'Offseason Training',
      blurb: 'Where the whole offseason goes. The first block of a workout is ' +
             'cheap and every one after it costs twice the last, so an ' +
             'offseason spent entirely on one thing runs out of credits long ' +
             'before it runs out of attributes. The two that specialise are ' +
             'the cheap ones and carry a risk; the one that spreads itself ' +
             'evenly costs more and has nothing to lose. The prices go back ' +
             'to the bottom when the season is locked and the workouts fold ' +
             'into the ratings.',
      items: [
        {
          key: 'train-strength',
          name: 'Strength Training',
          credits: 8,
          creditsStack: 2,
          effects: { strength: 4, toughness: 2, injury: 2, jumping: 2 },
          risks: [
            { attribute: 'agility', amount: -2 },
            { attribute: 'stamina', amount: -2 },
            { attribute: 'speed',   amount: -2 }
          ],
          description: 'Strength +4, and toughness, injury and jumping +2 ' +
                       'each. One roll of a twelve-sided die when you buy it: ' +
                       'on a 1, 2 or 3 it costs you 2 agility, 2 stamina and ' +
                       '2 speed. Three times out of four, nothing.'
        },
        {
          key: 'train-cardio',
          name: 'Cardio Training',
          credits: 8,
          creditsStack: 2,
          effects: { speed: 2, acceleration: 2, agility: 2, stamina: 2 },
          risks: [
            { attribute: 'strength', amount: -2 }
          ],
          description: 'Speed, acceleration, agility and stamina +2 each. One ' +
                       'roll of a twelve-sided die when you buy it: on a 1, 2 ' +
                       'or 3 it costs you 2 strength. Three times out of four, ' +
                       'nothing.'
        },
        {
          key: 'train-overall',
          name: 'Overall Training',
          credits: 12,
          creditsStack: 2,
          effects: {
            speed: 1, acceleration: 1, strength: 1,
            agility: 1, jumping: 1, stamina: 1
          },
          description: 'Speed, acceleration, strength, agility, jumping and ' +
                       'stamina +1 each. Nothing to lose, and no jump as big ' +
                       'as training one thing.'
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
          nameByPosition: { QB: 'Back Field Connection' },
          credits: 20,
          description: 'The whole offseason spent with your quarterback, learning his ' +
                       'routes and calls — or, for a quarterback, with the backs and ' +
                       'receivers behind him. Chemistry resets if they are injured, ' +
                       'traded or otherwise leave. Better chemistry can mean more targets.'
        },
        {
          key: 'hyperbaric',
          name: 'Hyperbaric Chamber',
          credits: 35,
          creditsLadder: [35, 45, 60],
          creditsStep: 15,
          note: 'NFL only',
          tiers: ['nfl'],
          description: 'Lowers your injury chance, and bought often enough it extends ' +
                       'your career. Only available after your first NFL season. ' +
                       '35, then 45, then 60, and 15 more each time after that.'
        },
        {
          key: 'intel',
          name: 'Intel',
          credits: 15,
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

/* What an item is called for this player: a quarterback's connection is with
   his back field rather than with himself. */
EGE.itemName = function (item, player) {
  if (!item) { return ''; }
  var byPosition = item.nameByPosition || {};
  return (player && byPosition[player.position]) || item.name;
};

/* What an item costs the next time this player buys one.

   Most things have one flat price. An item with `creditsStack` gets dearer
   every time it is bought -- 2 doubles it, so 10 becomes 20, then 40, then
   80 -- which is what stops an offseason being spent entirely on the same
   workout. Rating points are the other scaling thing, and their price is
   worked out from the attribute rather than from a count, in data/economy.js.

   `owned` is how many are already on the books. Offseason workouts are wiped
   when a season is locked, so that count goes back to zero and the price with
   it -- see clearLockedRows in js/wallet.js. */
EGE.priceFor = function (item, owned) {
  if (!item) { return 0; }
  var times = owned || 0;
  if (!item.creditsStack || times < 1) { return item.credits; }
  return Math.round(item.credits * Math.pow(item.creditsStack, times));
};

/* How many of an item a player holds, counting a stacked row's quantity
   rather than the row. */
EGE.timesBought = function (rows, itemKey) {
  return (rows || []).reduce(function (count, row) {
    if (row.item_key !== itemKey) { return count; }
    return count + (typeof row.quantity === 'number' ? row.quantity : 1);
  }, 0);
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

/* What a performance booster multiplies a game by. Null for everything that
   is not one. */
EGE.multiplierFor = function (itemKey) {
  var item = EGE.shopItem(itemKey);
  return item && typeof item.multiplier === 'number' ? item.multiplier : null;
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

/* The attributes a stat booster may be spent on — see EGE.boostableFor in
   data/ratings.js, which reads them off the player's own ratings page. */
