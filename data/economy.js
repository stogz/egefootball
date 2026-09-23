/* ==========================================================================
   EGE Football — the economy
   Every number about credits lives here: what a rating point costs, what the
   shop's flat-price items cost, and what a season pays out. Nothing else in
   the site invents a price.

   The one rule worth knowing: a rating point costs more the closer the
   attribute is to 99.

       cost = UPGRADE_BASE / (99 - value + 1)

   So it is two or three credits while a player is in the 40s and 50s, five
   to ten in the 80s, and fifty at 98 — which is what slows
   development down once a player is good rather than capping it.

   UPGRADE_BASE is tuned, not guessed: spending a typical offseason budget on
   the best-value points moves a player about four overall. It went from 36
   to 100 when the overall moved to key attributes, since a point in one of
   those is now worth about twice what it was. Retune it by
   changing this number and re-running the numbers in the README.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.economy = (function () {
  'use strict';

  var UPGRADE_BASE = 100;
  var MAX_RATING = 99;

  /* Groups credits cannot buy into. The general attributes — speed, strength,
     stamina and the rest — move only through offseason training, which is
     what makes training worth a slot in the shop at all. */
  var TRAINING_ONLY_GROUPS = ['general'];

  /* What the tuning assumes a player has to spend in an offseason: the flat
     60, plus a season that went reasonably well. */
  var TYPICAL_BUDGET = 90;

  /* --- rating points ----------------------------------------------------- */

  function upgradeCost(value) {
    if (typeof value !== 'number' || value >= MAX_RATING) { return null; }
    return Math.max(1, Math.ceil(UPGRADE_BASE / (MAX_RATING - value + 1)));
  }

  /* How much of an overall one point on this attribute is worth. Only the
     attributes a position counts are worth anything, and the ones it leans
     on hardest are worth the most. */
  function gainPerPoint(player, attributeKey) {
    return EGE.overallPerPoint(player, attributeKey);
  }

  /* Everything a player can put credits into: the attributes their position
     is judged on, what each is at now, what the next point costs, and how
     many points of it move the overall by one.

     Sorted by what a credit actually buys, best first, so spending well does
     not require working any of this out — the top of the table is the right
     answer. That ordering is what the four-overall-a-season tuning assumes. */
  function upgradePlan(player) {
    var values = EGE.valuesFor(player);
    if (!values) { return []; }

    return EGE.boostableFor(player).filter(function (attr) {
      return TRAINING_ONLY_GROUPS.indexOf(attr.groupKey) === -1;
    }).map(function (attr) {
      var value = values[attr.key];
      var gain = gainPerPoint(player, attr.key);
      var cost = upgradeCost(value);
      return {
        key: attr.key,
        label: attr.label,
        group: attr.group,
        value: value,
        base: (EGE.ratings[player.slug] || {})[attr.key],
        cost: cost,
        gain: gain,
        /* how many points on this attribute add one to the overall */
        pointsPerOverall: gain > 0 ? Math.round(1 / gain) : null,
        /* overall gained per credit spent — the number that orders the list */
        value_: cost ? gain / cost : 0
      };
    }).sort(function (a, b) {
      if (b.value_ !== a.value_) { return b.value_ - a.value_; }
      return a.label.localeCompare(b.label);
    });
  }

  /* Buying several at once is every point priced where it lands, added up —
     not the first one's price times four.

     The difference shows at a threshold. A point at 64 costs 1 and a point at
     65 costs 2, so a +4 from 64 is 1 + 2 + 2 + 2, not 4. Pricing the run off
     the first point would sell the three dearer ones at the cheap rate, which
     is a discount for buying at exactly the wrong moment. */
  var BULK_SIZES = [1, 2, 4];

  function bulkCost(value, points) {
    if (upgradeCost(value) === null) { return null; }

    var total = 0;
    for (var i = 0; i < points; i += 1) {
      var step = upgradeCost(value + i);
      if (step === null) { break; }      /* 99 is as far as it goes */
      total += step;
    }
    return total;
  }

  /* How far a run of points can actually go before hitting 99. */
  function pointsAvailable(value, wanted) {
    return Math.max(0, Math.min(wanted, MAX_RATING - value));
  }

  /* --- credits earned in season ------------------------------------------

     From 2019 a game pays for the fantasy points in it, not just for its
     touchdowns. A touchdown is still the biggest single thing on the line,
     but the yards count too, so a hundred-yard night with nothing in the end
     zone still pays -- which touchdowns alone never did.

     The scoring is the common half-PPR one:

       passing    1 a 25 yards, 4 a touchdown, -2 an interception
       rushing    1 a 10 yards, 6 a touchdown
       receiving  1 a 10 yards, 6 a touchdown, 0.5 a catch
                  -2 a fumble lost

     The positions do not score alike -- a strong tight end game is about 22
     points, a strong back or quarterback game about 31 -- so each keeps a
     share of his points. The shares were worked out from the 2018 season's 72
     stat lines rather than picked: they are what makes a breakout game (the
     average of each position's 75th and 90th percentile) pay the same 15
     credits whatever the position, with one scale over all three chosen so
     that the whole season pays what touchdowns did (757 credits against 745),
     so nothing in the shop needs repricing.

     Always rounded up -- there is no half a credit -- and a game played never
     pays less than 1, however badly it went. */
  var FANTASY = {
    passingYards: 1 / 25,
    passingTd: 4,
    interceptions: -2,
    rushingYards: 1 / 10,
    rushingTd: 6,
    receivingYards: 1 / 10,
    receivingTd: 6,
    receptions: 0.5,
    fumbles: -2
  };

  var FANTASY_SHARE = { QB: 0.55, RB: 0.5, TE: 0.75, WR: 0.75, DEFAULT: 0.5 };

  /* The first season paid this way. 2018 was paid for touchdowns as it went,
     and the ledger tops up any award that has grown, so paying it again on
     the new scale would hand every player a second helping of a season
     already settled. */
  var FANTASY_FROM = 2019;

  function fantasyPoints(stats) {
    if (!stats) { return 0; }
    var points = Object.keys(FANTASY).reduce(function (sum, key) {
      return sum + (typeof stats[key] === 'number' ? stats[key] * FANTASY[key] : 0);
    }, 0);
    /* To the hundredth, so 3.3 plus 6.7 is 10 and not 10.000000000000002. */
    return Math.round(points * 100) / 100;
  }

  function fantasyShareFor(position) {
    var share = FANTASY_SHARE[position];
    return typeof share === 'number' ? share : FANTASY_SHARE.DEFAULT;
  }

  function paysFantasy(season) {
    return (season || EGE.currentSeason) >= FANTASY_FROM;
  }

  /* --- how 2018 was paid ------------------------------------------------

     What a touchdown was worth, by position. Kept because 2018 was paid on
     it and its ledger has to keep adding up to what it said. */
  var TD_CREDITS = { QB: 5, RB: 10, TE: 10, WR: 10, DEFAULT: 5 };

  /* The stat keys a touchdown can arrive under. */
  var TD_KEYS = ['passingTd', 'rushingTd', 'receivingTd'];

  function tdRateFor(position) {
    var rate = TD_CREDITS[position];
    return typeof rate === 'number' ? rate : TD_CREDITS.DEFAULT;
  }

  function touchdownsIn(stats) {
    if (!stats) { return 0; }
    return TD_KEYS.reduce(function (sum, key) {
      return sum + (typeof stats[key] === 'number' ? stats[key] : 0);
    }, 0);
  }

  function touchdownCredits(player, stats) {
    return touchdownsIn(stats) * tdRateFor(player && player.position);
  }

  /* --- what one game pays ----------------------------------------------- */

  function gameCredits(player, stats, season) {
    if (!stats) { return 0; }
    if (!paysFantasy(season)) { return touchdownCredits(player, stats); }

    var share = fantasyShareFor(player && player.position);
    var credits = Math.ceil(Math.round(fantasyPoints(stats) * share * 100) / 100);
    return Math.max(1, credits);
  }

  /* How a position is paid in a season, in a few words for the admin page. */
  function rateText(position, season) {
    return paysFantasy(season)
      ? fantasyShareFor(position) + '\u00d7 fantasy pts'
      : tdRateFor(position) + ' a TD';
  }

  /* Every credit a player is owed for a season, worked out from the season
     data rather than from anything stored: post a result and the player is
     owed that game's credits the moment the week is out.

     Each award carries a key that is stable for what earned it, which is what
     makes paying them safe to repeat — the same week's touchdowns can only
     ever be paid once. js/wallet.js does the paying. */
  function awardsEarned(player, season) {
    var year = season || EGE.currentSeason;
    var out = [];
    if (!player) { return out; }

    /* The flat allowance, paid on the way into a season. There is no
       allowance for the first one: everybody starts on nothing, and earns
       the first 60 by getting through a season. */
    var first = (EGE.seasons && EGE.seasons[0]) ? EGE.seasons[0].year : year;
    if (year > first) {
      out.push({
        key: 'offseason-' + year,
        credits: EGE.shop.offseasonCredits,
        note: 'Offseason allowance for ' + year
      });
    }

    /* Keyed td-w{week} in every season, fantasy or not. It is the key the
       ledger already takes from a player's own browser (see
       pay_credit_awards in supabase/schema.sql), so the new scoring needed
       no change to the database. */
    EGE.gamesPlayed(player, year).forEach(function (game) {
      var credits = gameCredits(player, game.stats, year);
      if (!credits) { return; }

      var what;
      if (paysFantasy(year)) {
        what = fantasyPoints(game.stats) + ' fantasy points';
      } else {
        var tds = touchdownsIn(game.stats);
        what = tds + (tds === 1 ? ' touchdown' : ' touchdowns');
      }
      out.push({
        key: 'td-w' + game.week,
        credits: credits,
        note: what + ' in week ' + game.week + ' v ' + game.opponent
      });
    });

    return out;
  }

  return {
    UPGRADE_BASE: UPGRADE_BASE,
    MAX_RATING: MAX_RATING,
    TRAINING_ONLY_GROUPS: TRAINING_ONLY_GROUPS,
    TYPICAL_BUDGET: TYPICAL_BUDGET,
    BULK_SIZES: BULK_SIZES,
    upgradeCost: upgradeCost,
    bulkCost: bulkCost,
    pointsAvailable: pointsAvailable,
    gainPerPoint: gainPerPoint,
    upgradePlan: upgradePlan,
    TD_CREDITS: TD_CREDITS,
    tdRateFor: tdRateFor,
    touchdownsIn: touchdownsIn,
    touchdownCredits: touchdownCredits,
    FANTASY: FANTASY,
    FANTASY_SHARE: FANTASY_SHARE,
    FANTASY_FROM: FANTASY_FROM,
    fantasyPoints: fantasyPoints,
    fantasyShareFor: fantasyShareFor,
    paysFantasy: paysFantasy,
    gameCredits: gameCredits,
    rateText: rateText,
    awardsEarned: awardsEarned
  };
})();
