/* ==========================================================================
   EGE Football — the economy
   Every number about credits lives here: what a rating point costs, what the
   shop's flat-price items cost, and what a season pays out. Nothing else in
   the site invents a price.

   The one rule worth knowing: a rating point costs more the closer the
   attribute is to 99.

       cost = UPGRADE_BASE / (99 - value + 1)

   So it is a credit or two while a player is in the 40s and 50s, a handful
   in the 80s, and twenty-odd at 98 — which is what slows development down
   once a player is good rather than capping it.

   UPGRADE_BASE is tuned, not guessed: spending a typical offseason budget on
   the best-value points moves a player about four overall. Retune it by
   changing this number and re-running the numbers in the README.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.economy = (function () {
  'use strict';

  var UPGRADE_BASE = 36;
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

  /* How much of an overall one point on this attribute is worth. A point in
     the group a position leans on is worth several times one outside it. */
  function gainPerPoint(player, attributeKey) {
    var weights = EGE.weightsFor(player.position);
    var total = EGE.ratingGroups.reduce(function (sum, group) {
      return sum + (weights[group.key] || 0);
    }, 0);

    var found = null;
    EGE.ratingGroups.forEach(function (group) {
      group.attributes.forEach(function (attr) {
        if (attr.key === attributeKey) { found = group; }
      });
    });
    if (!found || !total) { return 0; }

    return (weights[found.key] || 0) / total / found.attributes.length;
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

  /* Buying several at once is priced off the next single point rather than
     off each step: +2 costs double, +4 costs quadruple. It saves a little at
     the steep end of the curve, which is the point of offering it. */
  var BULK_SIZES = [1, 2, 4];

  function bulkCost(value, points) {
    var single = upgradeCost(value);
    if (single === null) { return null; }
    return single * points;
  }

  /* How far a run of points can actually go before hitting 99. */
  function pointsAvailable(value, wanted) {
    return Math.max(0, Math.min(wanted, MAX_RATING - value));
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
    upgradePlan: upgradePlan
  };
})();
