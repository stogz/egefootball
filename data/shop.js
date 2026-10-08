/* ==========================================================================
   EGE Football — the offseason shop
   What credits buy, and how credits are earned. Prices are in credits.

   Spelling follows the site's own attribute names where the two describe
   the same thing, so "Catching in Traffic" here is the Catch in Traffic
   attribute in data/ratings.js. Where a listed item has no single attribute
   behind it yet — Block Power covers both run and pass block power — the
   key is null until that is settled.

   `icon` is the picture on an item's card. The originals are in icon/shop at
   1254px; the site loads the 256px copies in icon/shop/small.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.shop = {

  /* What a player has to start with, before an offseason has been played. */
  startingCredits: 0,

  /* What every player gets each offseason, whatever they are paid. The same
     60 as the earnings table's "Every Off-season" row, not an extra 60 on
     top. */
  offseasonCredits: 60,

  /* How an offseason pays, as the shop's Earning Credits panel shows it.
     Every row stacks: a starter who made the Pro Bowl gets the 60, the 30
     for his salary and the 30 for the Pro Bowl.

     The first row is paid on its own on the way into a season (see
     awardsEarned in data/economy.js). The `sub` rows are the ones an admin
     hands out from the admin page. Unspent credits carry into the next
     season. */
  earnings: [
    { label: 'Every Off-season',   credits: 60, automatic: true },
    { label: 'Rookie Contract',    credits: 10, sub: true },
    { label: 'Starter Salary',     credits: 30, sub: true },
    { label: 'High Salary',        credits: 50, sub: true },
    { label: 'Superstar Salary',   credits: 70, sub: true },
    { label: 'Pro-Bowl Honors',    credits: 30, sub: true },
    { label: 'All-Pro Honors',     credits: 45, sub: true },
    { label: 'Major Award Season', credits: 60, sub: true },
    { label: 'MVP/OPOY',           credits: 75, sub: true }
  ],

  /* Training rolls one twelve-sided die, and the downside lands on a 1, 2 or
     3 — a quarter of the time, not most of it. Rolling each risk separately
     is what made three separate coin flips add up to "always". */
  riskDie: 12,
  riskFailsOn: 3,

  /* The most boosters one season's games can carry, whatever their kind.
     Each kind has its own cap too (`seasonLimit` on the item). The same
     numbers are enforced in supabase/schema.sql. */
  boosterSeasonLimit: 5,

  sections: [
    {
      key: 'boosters',
      title: 'Performance Boosters',
      blurb: 'Regular season games only, one use per purchase. Save one for a ' +
             'hard opponent, or spend it proving a point against a rival. A ' +
             'season takes five at most: two 2.5x, three 2.0x and four 1.5x. ' +
             'Any you do not use carry over.',
      /* How many can go on a season's games: `seasonLimit` of each, and
         `boosterSeasonLimit` above across all three. Buying is not capped --
         an unused booster carries over -- only sticking one on a game is. */
      items: [
        { key: 'boost-2-5', name: '2.5x Booster', credits: 40, tag: '2.5x', multiplier: 2.5, consumable: true, seasonLimit: 2 },
        { key: 'boost-2-0', name: '2.0x Booster', credits: 25, tag: '2.0x', multiplier: 2.0, consumable: true, seasonLimit: 3 },
        { key: 'boost-1-5', name: '1.5x Booster', credits: 15, tag: '1.5x', multiplier: 1.5, consumable: true, seasonLimit: 4 }
      ]
    },

    {
      key: 'upgrades',
      title: 'Rating Points',
      blurb: 'Buy points straight into the attributes your position is judged ' +
             'on. A point costs more the closer that attribute is to 99, so ' +
             'early ones are two or three credits and late ones are not. The ' +
             'general attributes are not here — speed, strength, stamina and ' +
             'the rest move through offseason training only.',
      upgrades: true,
      items: []
    },

    {
      key: 'training',
      title: 'Offseason Training',
      /* Drawn inside the Rating Points panel, under the points, rather than
         as a panel of its own. Each workout's price doubles every time it is
         bought, and goes back to the bottom when the season is locked. */
      panel: 'upgrades',
      items: [
        {
          key: 'train-strength',
          icon: 'icon/shop/small/strength.png',
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
          icon: 'icon/shop/small/cardio.png',
          name: 'Cardio Training',
          credits: 16,
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
          icon: 'icon/shop/small/gym.png',
          name: 'Overall Training',
          credits: 20,
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
          icon: 'icon/shop/small/qb.png',
          name: 'QB Connection',
          nameByPosition: { QB: 'O-Line Connection' },
          credits: 20,
          /* Buying it again with the same quarterback makes the connection
             better, one level a time (Roman numerals from II). The first two
             cost 20 each; after that every level costs 10 more than the one
             before. See EGE.priceFor. */
          levels: true,
          creditsLadder: [20, 20],
          creditsStep: 10,
          note: 'College and later',
          tiers: ['college', 'nfl'],
          /* A receiver or a back names which quarterback it is with, from
             his team's quarterback room (EGE.quarterbacksFor). A quarterback
             buys the O-Line Connection and has nobody to pick. */
          pickQuarterback: true,
          description: 'The whole offseason spent with your quarterback, learning his ' +
                       'routes and calls. Chemistry resets if they are injured, ' +
                       'traded or otherwise leave. Better chemistry can mean more targets. ' +
                       'Buy it again with the same quarterback to level it up (II, III and ' +
                       'so on); the first two cost 20, then each level costs 10 more.',
          descriptionByPosition: {
            QB: 'The whole offseason spent with your offensive line, learning their ' +
                'protections and calls. Chemistry resets if they are injured, ' +
                'traded or otherwise leave. Better chemistry means a lower chance ' +
                'of being sacked. Buy it again to level it up (II, III and so on); ' +
                'the first two cost 20, then each level costs 10 more.'
          }
        },
        {
          key: 'hyperbaric',
          icon: 'icon/shop/small/chamber.png',
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
          icon: 'icon/shop/small/intel.png',
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
   his offensive line rather than with himself. */
EGE.itemName = function (item, player) {
  if (!item) { return ''; }
  var byPosition = item.nameByPosition || {};
  return (player && byPosition[player.position]) || item.name;
};

/* Whether buying this item means naming a quarterback: the QB Connection,
   for anybody who is not one. */
EGE.needsQuarterback = function (item, player) {
  return Boolean(item && item.pickQuarterback && player && player.position !== 'QB');
};

/* 1 to 3999 as Roman numerals. */
EGE.roman = function (n) {
  var table = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
               [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  var left = Math.max(0, Math.floor(n) || 0);
  var out = '';
  table.forEach(function (pair) {
    while (left >= pair[0]) { out += pair[1]; left -= pair[0]; }
  });
  return out;
};

/* How good a connection is: the quantity on its row. Only a row for the same
   quarterback counts, so a new quarterback starts again at the bottom. */
EGE.levelOf = function (rows, itemKey, target) {
  var row = (rows || []).filter(function (one) {
    return one.item_key === itemKey && (one.target || null) === (target || null);
  })[0];
  return row ? (typeof row.quantity === 'number' ? row.quantity : 1) : 0;
};

/* What an inventory row is called once the quarterback is named, and once it
   has been bought up a level: QB Connection II \u2014 C.J. Stroud. The first
   level carries no numeral; it is what the item is called. */
EGE.connectionName = function (item, player, quarterback, level) {
  var name = EGE.itemName(item, player);
  if (item && item.levels && level > 1) { name += ' ' + EGE.roman(level); }
  return quarterback ? name + ' \u2014 ' + quarterback : name;
};

/* Which quarterback an inventory row's connection is with, or null for a row
   that is not one (or an O-Line Connection, which has nobody to name). The
   name is kept in `target`; a row from before that was filled in only has it
   after the dash in its title. */
EGE.connectionQuarterback = function (row) {
  if (!row || row.item_key !== 'qb-connection') { return null; }
  if (row.target) { return row.target; }
  var parts = String(row.item_name || '').split(' \u2014 ');
  return parts.length > 1 ? parts.slice(1).join(' \u2014 ') : null;
};

/* What an item says it does for this player, on the same terms as its name. */
EGE.itemDescription = function (item, player) {
  if (!item) { return ''; }
  var byPosition = item.descriptionByPosition || {};
  return (player && byPosition[player.position]) || item.description || '';
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

  /* A ladder is the first few prices written out, and then `creditsStep`
     more each time: [20, 20] with a step of 10 is 20, 20, 30, 40, 50. */
  if (item.creditsLadder) {
    var ladder = item.creditsLadder;
    if (times < ladder.length) { return ladder[times]; }
    return ladder[ladder.length - 1] + (item.creditsStep || 0) * (times - ladder.length + 1);
  }
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
  if (tier === 'highSchool' && item.tiers.indexOf('college') !== -1) {
    return { ok: false, reason: 'Not until college.' };
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
