/* ==========================================================================
   EGE Football — wear: age and injuries
   From the 2027 offseason on (Sam, 2026-11-02) the six lose something every
   offseason to age, and every injury costs them something too.

   Regression. Each offseason takes points off physical attributes only --
   speed, strength, jumping and the rest. What is learned never goes: pass
   accuracy, route running, BC Vision, catching, blocking technique. It is a
   handful of points at 26 (a -1 on two or three things) and snowballs from
   there, so by 34 it is heavy. Not every attribute every year: a random few,
   more of them and deeper as he ages, the athletic ones likeliest. Each
   Hyperbaric Chamber he owns takes 7.5% off it.

   Injuries. An injury costs points on what was hurt -- a hand on catching
   (a quarterback's on his throwing), an ankle on speed and jumping, a torn
   muscle on strength -- and more the longer it keeps him out: a one-week
   sprain is a point, a torn ACL about fourteen. The site counts an injury
   once the week it happened in is out; the NFL sim counts it from the snap
   it happened on.

   Both come off seeded dice, so the site, the Discord bot and the NFL sim
   work out the same numbers with nothing stored. EGE.valuesFor
   (data/ratings.js) takes them off the live season's numbers until the
   season is locked, when they are folded into data/ratings.js like any
   purchase, and the next offseason starts again.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.aging = {
  /* The first season that regresses (its offseason) and whose injuries cost
     anything. */
  from: 2027,

  /* The six were high school juniors in 2018 (the NFL sim's age too), so a
     season's age is the season less this: 26 in 2027, 34 in 2035. */
  born: 2001,

  /* Points an offseason takes at `age`, and how much more each year after:
     about 3 at 26, 6 at 28, 13 at 30, 28 at 32, 59 at 34. Never more than
     `most`. */
  curve: { age: 26, points: 3, growth: 1.45, most: 90 },

  /* What each Hyperbaric Chamber owned takes off the regression. */
  chamberCut: 0.075,

  /* What age takes from, and how likely each is to be picked. Anything not
     here is learned and never regresses. One a player's position counts
     toward his overall is three times as likely. */
  physical: {
    speed: 3, acceleration: 3, agility: 3, changeOfDirection: 2, jumping: 2,
    stamina: 2, strength: 1.5, injury: 1.5, toughness: 1, throwPower: 2,
    jukeMove: 1.5, breakTackle: 1, trucking: 1, stiffArm: 1, spinMove: 1,
    breakSack: 1, spectacularCatch: 1, impactBlocking: 1, runBlockPower: 1,
    passBlockPower: 1
  },

  /* An injury costs weeks out ^ this, at least one: 1 week 1 point, 2
     weeks 2, 4 weeks 3, 8 weeks 6, 12 weeks 9, a season (20) 14. */
  injuryPower: 0.88,

  /* What each kind of injury takes from, matched on its name in order, with
     how likely each attribute is to be hit. `QB` is what it takes from a
     quarterback instead; `TE` is added for a tight end. The last matches
     anything. */
  parts: [
    { part: 'hand', match: /hand|wrist|finger|thumb/,
      all: { catching: 3, catchInTraffic: 2, spectacularCatch: 2, carrying: 1.5 },
      QB: { throwAccuracyShort: 2, throwAccuracyMid: 2, throwAccuracyDeep: 2, throwPower: 1.5, carrying: 1 },
      TE: { runBlock: 1, passBlock: 1 } },
    { part: 'achilles', match: /achilles/,
      all: { speed: 3, acceleration: 3, jumping: 2, agility: 1 } },
    { part: 'knee', match: /\bacl\b|\bmcl\b|\bpcl\b|meniscus|knee/,
      all: { agility: 3, changeOfDirection: 3, speed: 2, acceleration: 2, jukeMove: 1, jumping: 1 } },
    { part: 'ankle', match: /ankle/,
      all: { speed: 3, jumping: 3, agility: 2, changeOfDirection: 2, acceleration: 1 } },
    { part: 'foot', match: /foot|toe|lisfranc|heel/,
      all: { speed: 2, acceleration: 2, agility: 2, jumping: 1, changeOfDirection: 1 } },
    { part: 'hamstring', match: /hamstring/,
      all: { speed: 3, acceleration: 3, stamina: 1 } },
    { part: 'quad', match: /quad|thigh/,
      all: { acceleration: 2, jumping: 2, speed: 1, strength: 1 } },
    { part: 'calf', match: /calf/,
      all: { acceleration: 2, jumping: 2, speed: 1 } },
    { part: 'groin', match: /groin/,
      all: { agility: 2, changeOfDirection: 2, acceleration: 1 } },
    { part: 'hip', match: /\bhip/,
      all: { agility: 2, changeOfDirection: 2, speed: 1, acceleration: 1 } },
    { part: 'muscle', match: /pectoral|\bpec\b|bicep|tricep|muscle/,
      all: { strength: 4, trucking: 1, stiffArm: 1, breakTackle: 1 },
      QB: { strength: 3, throwPower: 3 },
      TE: { runBlockPower: 2, passBlockPower: 2, impactBlocking: 1 } },
    { part: 'shoulder', match: /shoulder|collarbone|clavicle|rotator/,
      all: { strength: 2, stiffArm: 2, trucking: 1, spectacularCatch: 1 },
      QB: { throwPower: 3, throwAccuracyDeep: 1, strength: 1 },
      TE: { runBlockPower: 1, passBlockPower: 1, impactBlocking: 1 } },
    { part: 'ribs', match: /\bribs?\b|chest/,
      all: { toughness: 3, stamina: 2, breakTackle: 1 },
      QB: { toughness: 3, stamina: 2, breakSack: 1 } },
    { part: 'head', match: /concussion|head|neck/,
      all: { toughness: 2, injury: 2 } },
    { part: 'back', match: /\bback\b|spine/,
      all: { strength: 2, toughness: 2, stamina: 1, trucking: 1 } },
    { part: 'leg', match: /\bleg\b|fibula|tibia/,
      all: { speed: 3, acceleration: 2, agility: 2, jumping: 1, stamina: 1 } },
    { part: 'body', match: /./,
      all: { speed: 1, strength: 1, stamina: 1, toughness: 1 } }
  ]
};

/* What the shop's loader found: how many Hyperbaric Chambers each player
   owns, by slug (js/wallet.js loadBoosts). Empty until it has loaded, and on
   the command line. */
EGE.appliedChambers = EGE.appliedChambers || {};

EGE.chambersFor = function (player) {
  return (player && EGE.appliedChambers[player.slug]) || 0;
};

/* How old the six are in a season. */
EGE.ageIn = function (season) {
  return (season || EGE.currentSeason) - EGE.aging.born;
};

(function () {
  'use strict';

  /* mulberry32 on an FNV-1a hash of the words, the NFL sim's own dice
     (nfl-sim/lib/rng.js), so the numbers are the same everywhere. */
  function hash(text) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h;
  }

  function dice(words) {
    var s = hash(words.join(':')) >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* One of `items` ({ key, weight }), each as likely as its weight. */
  function pick(roll, items, weightOf) {
    var total = 0;
    var weights = items.map(function (item) {
      var w = Math.max(0, weightOf(item));
      total += w;
      return w;
    });
    var r = roll() * total;
    for (var i = 0; i < items.length; i += 1) {
      r -= weights[i];
      if (r <= 0 && weights[i] > 0) { return items[i]; }
    }
    return items[items.length - 1];
  }

  /* The attributes this player's page shows and his ratings carry, so a
     drop is always one he can see. */
  function shown(player) {
    var base = EGE.ratings[player.slug] || {};
    var keys = {};
    EGE.boostableFor(player).forEach(function (attr) {
      if (typeof base[attr.key] === 'number') { keys[attr.key] = attr.label; }
    });
    return keys;
  }

  function labelOf(key) {
    var found = null;
    EGE.ratingGroups.forEach(function (group) {
      group.attributes.forEach(function (attr) { if (attr.key === key) { found = attr.label; } });
    });
    return found || key;
  }

  /* { key: n } as [{ key, label, amount }], the biggest first. */
  function listOf(counts) {
    return Object.keys(counts).map(function (key) {
      return { key: key, label: labelOf(key), amount: -counts[key] };
    }).sort(function (a, b) { return a.amount - b.amount || a.label.localeCompare(b.label); });
  }

  /* --- regression -------------------------------------------------------- */

  /* What age is likely to take from him: his physical attributes, the ones
     his position counts three times as likely. */
  function agePool(player) {
    var A = EGE.aging;
    var have = shown(player);
    var counts = EGE.weightsFor(player.position);
    return Object.keys(A.physical).filter(function (key) {
      return have[key];
    }).map(function (key) {
      return { key: key, weight: A.physical[key] * (counts[key] ? 3 : 1) };
    });
  }

  /* The order the points come off in, for `n` points: a few attributes a
     point each, more of them the more there is to take, then the rest on
     those same ones. A chamber takes points off the end, so buying one
     never moves a drop to a different attribute. */
  function ageHits(roll, pool, n) {
    if (n <= 0 || !pool.length) { return []; }
    var spread = Math.max(1, Math.round(2.2 * Math.sqrt(n)));
    var k = Math.min(n, spread, Math.max(1, pool.length - 3));
    var left = pool.slice();
    var chosen = [];
    for (var i = 0; i < k; i += 1) {
      var one = pick(roll, left, function (item) { return item.weight; });
      chosen.push(one);
      left.splice(left.indexOf(one), 1);
    }
    var order = chosen.map(function (item) { return item.key; });
    for (var j = k; j < n; j += 1) {
      order.push(pick(roll, chosen, function (item) { return item.weight; }).key);
    }
    return order;
  }

  /* The offseason's regression going into `season`: { season, age, points,
     saved, chambers, drops: [{ key, label, amount }] }, or null before it
     starts. `chambers` is how many he owns (EGE.chambersFor by default). */
  EGE.regressionFor = function (player, season, chambers) {
    var A = EGE.aging;
    var year = season || EGE.currentSeason;
    if (!player || !EGE.ratings[player.slug] || year < A.from) { return null; }

    var age = EGE.ageIn(year);
    var expected = Math.min(A.curve.most, A.curve.points * Math.pow(A.curve.growth, age - A.curve.age));
    var roll = dice(['ege-regression', player.slug, year]);
    /* One roll rounds both ways, so a chamber's 7.5% is exact on average
       and a chamber never makes it worse. */
    var u = roll();
    var owned = typeof chambers === 'number' ? chambers : EGE.chambersFor(player);
    var keep = Math.max(0, 1 - A.chamberCut * owned);
    var full = Math.floor(expected + u);
    var points = Math.floor(expected * keep + u);

    var counts = {};
    ageHits(roll, agePool(player), full).slice(0, points).forEach(function (key) {
      counts[key] = (counts[key] || 0) + 1;
    });
    return { season: year, age: age, points: points, saved: full - points, chambers: owned, drops: listOf(counts) };
  };

  /* --- injuries ---------------------------------------------------------- */

  EGE.injuryPart = function (injury) {
    var text = String(injury || '').toLowerCase();
    return EGE.aging.parts.filter(function (part) { return part.match.test(text); })[0];
  };

  /* What one injury costs him: [{ key, label, amount }]. `hurt` is
     { week, injury, weeks }. */
  EGE.injuryCostFor = function (player, season, hurt) {
    if (!player || !hurt || !EGE.ratings[player.slug]) { return []; }
    var part = EGE.injuryPart(hurt.injury);
    var pos = player.position;
    var weights = {};
    var from = pos === 'QB' && part.QB ? part.QB : part.all;
    Object.keys(from).forEach(function (key) { weights[key] = from[key]; });
    if (pos === 'TE' && part.TE) {
      Object.keys(part.TE).forEach(function (key) { weights[key] = (weights[key] || 0) + part.TE[key]; });
    }
    var have = shown(player);
    var pool = Object.keys(weights).filter(function (key) { return have[key]; }).map(function (key) {
      return { key: key, weight: weights[key] };
    });
    if (!pool.length) { return []; }

    var weeks = Math.max(1, Number(hurt.weeks) || 1);
    var points = Math.max(1, Math.round(Math.pow(weeks, EGE.aging.injuryPower)));
    var roll = dice(['ege-injury', player.slug, season, hurt.week, String(hurt.injury).toLowerCase()]);
    /* Leaning on what the injury is to most, without it all landing on one
       number: each point on an attribute halves its chance of the next. */
    var counts = {};
    for (var i = 0; i < points; i += 1) {
      var key = pick(roll, pool, function (item) {
        return item.weight * Math.pow(0.5, counts[item.key] || 0);
      }).key;
      counts[key] = (counts[key] || 0) + 1;
    }
    return listOf(counts);
  };

  /* The injuries that count against him in `season`: every game that says
     what hurt him in it (`hurt` in the season file, from the NFL sim), once
     its week is out. [{ week, injury, weeks }], oldest first. */
  EGE.injuriesFor = function (player, season) {
    var year = season || EGE.currentSeason;
    if (!player || year < EGE.aging.from || !EGE.gamesFor) { return []; }
    return EGE.gamesFor(player, year).filter(function (game) {
      return game.hurt && game.hurt.injury && EGE.isPublished(year, game.week);
    }).map(function (game) {
      return { week: game.week, injury: game.hurt.injury, weeks: game.hurt.weeks };
    });
  };

  /* --- both -------------------------------------------------------------- */

  var memo = {};
  var memoSize = 0;

  /* Everything the season has taken off him: { season, regression,
     injuries: [{ week, injury, weeks, drops }], total: { key: -n } }.
     `opts.injuries` is a list the caller knows of (the NFL sim's, before the
     week is out), laid over the site's own by week. */
  EGE.wearFor = function (player, season, opts) {
    var year = season || EGE.currentSeason;
    var out = { season: year, regression: null, injuries: [], total: {} };
    if (!player || !EGE.ratings[player.slug] || year < EGE.aging.from) { return out; }

    var byWeek = {};
    EGE.injuriesFor(player, year).concat((opts && opts.injuries) || []).forEach(function (hurt) {
      if (hurt && hurt.injury) { byWeek[hurt.week] = hurt; }
    });
    var hurts = Object.keys(byWeek).map(Number).sort(function (a, b) { return a - b; }).map(function (week) {
      var h = byWeek[week];
      return { week: week, injury: String(h.injury), weeks: Number(h.weeks) || 1 };
    });

    var chambers = EGE.chambersFor(player);
    var key = [player.slug, player.position, year, chambers, JSON.stringify(hurts)].join('|');
    if (memo[key]) { return memo[key]; }

    out.regression = EGE.regressionFor(player, year, chambers);
    out.injuries = hurts.map(function (hurt) {
      return { week: hurt.week, injury: hurt.injury, weeks: hurt.weeks, drops: EGE.injuryCostFor(player, year, hurt) };
    });
    var lists = [out.regression ? out.regression.drops : []].concat(out.injuries.map(function (h) { return h.drops; }));
    lists.forEach(function (drops) {
      drops.forEach(function (drop) { out.total[drop.key] = (out.total[drop.key] || 0) + drop.amount; });
    });

    if (memoSize > 500) { memo = {}; memoSize = 0; }
    memo[key] = out;
    memoSize += 1;
    return out;
  };
})();
