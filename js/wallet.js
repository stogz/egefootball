/* ==========================================================================
   EGE Football — credits and inventory
   A balance per player and a row per thing they own, both in Supabase (see
   supabase/schema.sql). The table's policies do the real enforcing: a player
   reads and writes only their own, an admin reads and writes everyone's.
   Nothing here is a security boundary — it is the shape of the UI.

   Depends on: js/auth.js.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.wallet = (function () {
  'use strict';

  var CREDITS = 'player_credits';
  var INVENTORY = 'player_inventory';
  var ADMINS = 'admins';
  var GAME_BOOSTERS = 'game_boosters';
  var AWARDS = 'credit_awards';

  var isAdmin = false;

  function client() {
    return EGE.auth.supabaseClient ? EGE.auth.supabaseClient() : null;
  }

  function fail(message) { return Promise.resolve({ ok: false, message: message }); }

  function offline() {
    return 'The shop cannot reach Supabase. Run supabase/schema.sql and check js/supabase-config.js.';
  }

  /* --- who is an admin --------------------------------------------------- */

  function refreshAdmin(email) {
    var c = client();
    isAdmin = false;
    if (!c || !email) { return Promise.resolve(false); }

    return c.from(ADMINS).select('email').eq('email', email).maybeSingle()
      .then(function (res) {
        isAdmin = Boolean(!res.error && res.data);
        return isAdmin;
      })
      .catch(function () { return false; });
  }

  function admin() { return isAdmin; }

  /* --- credits ----------------------------------------------------------- */

  function creditsFor(email) {
    var c = client();
    if (!c) { return Promise.resolve(null); }

    return c.from(CREDITS).select('credits').eq('email', email).maybeSingle()
      .then(function (res) {
        if (res.error) { return null; }
        return res.data ? res.data.credits : EGE.shop.startingCredits;
      })
      .catch(function () { return null; });
  }

  function setCredits(email, credits) {
    var c = client();
    if (!c) { return fail(offline()); }

    var amount = Math.max(0, Math.round(Number(credits) || 0));
    return c.from(CREDITS)
      .upsert({ email: email, credits: amount, updated_at: new Date().toISOString() },
              { onConflict: 'email' })
      .then(function (res) {
        if (res.error) { return { ok: false, message: res.error.message }; }
        return { ok: true, credits: amount };
      });
  }

  /* --- inventory --------------------------------------------------------- */

  function inventoryFor(email) {
    var c = client();
    if (!c) { return Promise.resolve([]); }

    return c.from(INVENTORY).select('*').eq('email', email)
      .order('purchased_at', { ascending: false })
      .then(function (res) { return res.error ? [] : (res.data || []); })
      .catch(function () { return []; });
  }

  /* Every account at once — only an admin's policies will return more than
     their own rows. */
  function allInventory() {
    var c = client();
    if (!c) { return Promise.resolve([]); }

    return c.from(INVENTORY).select('*').order('purchased_at', { ascending: false })
      .then(function (res) { return res.error ? [] : (res.data || []); })
      .catch(function () { return []; });
  }

  function allCredits() {
    var c = client();
    if (!c) { return Promise.resolve([]); }

    return c.from(CREDITS).select('*')
      .then(function (res) { return res.error ? [] : (res.data || []); })
      .catch(function () { return []; });
  }

  /* --- what a purchase does to the ratings -------------------------------- */

  /* Training rolls its downside once, when it is bought, and the result is
     stored: nobody gets to re-roll by reloading the page. */
  function rollEffects(item) {
    var effects = {};
    Object.keys(item.effects || {}).forEach(function (key) {
      effects[key] = item.effects[key];
    });

    if (item.needsTarget) { return effects; }

    (item.risks || []).forEach(function (risk) {
      if (Math.random() < risk.chance) {
        effects[risk.attribute] = (effects[risk.attribute] || 0) + risk.amount;
      }
    });
    return effects;
  }

  function effectsForTarget(item, target) {
    var effects = {};
    if (item.needsTarget && target) { effects[target] = item.boost || 1; }
    return effects;
  }

  /* How many of this item a player already owns, which is what makes the
     next one dearer. */
  function ownedCount(rows, key) {
    return (rows || []).filter(function (row) { return row.item_key === key; }).length;
  }

  /* Everything bought, everywhere, summed per attribute per account, so a
     boosted overall shows on every page. Intel rows are invisible to anyone
     but their owner, and carry no effects anyway. */
  function loadBoosts() {
    var c = client();
    if (!c) { return Promise.resolve({}); }

    return c.from(INVENTORY).select('email, effects, active, season')
      .then(function (res) {
        var boosts = {};
        if (res.error) { EGE.appliedBoosts = boosts; return boosts; }

        (res.data || []).forEach(function (row) {
          if (!row.active || lapsed(row) || !row.effects) { return; }

          /* Rows are owned by an email; ratings are keyed by player. */
          var player = EGE.players.filter(function (p) {
            return p.email && row.email && p.email.toLowerCase() === row.email.toLowerCase();
          })[0];
          if (!player) { return; }

          var forPlayer = boosts[player.slug] || (boosts[player.slug] = {});
          Object.keys(row.effects).forEach(function (attr) {
            forPlayer[attr] = (forPlayer[attr] || 0) + row.effects[attr];
          });
        });

        EGE.appliedBoosts = boosts;
        return boosts;
      })
      .catch(function () { EGE.appliedBoosts = {}; return {}; });
  }

  /* --- buying ------------------------------------------------------------ */

  /* Six players and one shop, so the balance is read, checked and written
     in sequence rather than locked. The worst case is a double spend from
     two tabs at once, which an admin can put right. */
  function buy(email, item, target, player) {
    var c = client();
    if (!c) { return fail(offline()); }
    if (!item) { return fail('That item is not in the shop.'); }
    if (item.needsTarget && !target) { return fail('Choose which attribute to raise.'); }

    /* The button is disabled too, but a disabled button is a suggestion. */
    var allowed = EGE.itemAvailable(item, EGE.currentSeason);
    if (!allowed.ok) { return fail(allowed.reason); }

    return creditsFor(email).then(function (balance) {
      if (balance === null) { return { ok: false, message: offline() }; }

      var price = EGE.priceFor(item);
      if (balance < price) {
        return { ok: false, message: 'Not enough credits — that costs ' + price + ', you have ' + balance + '.' };
      }

      var effects = item.needsTarget ? effectsForTarget(item, target) : rollEffects(item);

      return inventoryFor(email).then(function (rows) {
        var existing = item.consumable ? stackedRow(rows, item.key, null) : null;

        var write = existing
          ? c.from(INVENTORY).update({
              quantity: quantityOf(existing) + 1,
              credits: (existing.credits || 0) + price
            }).eq('id', existing.id)
          : c.from(INVENTORY).insert({
              email: email,
              item_key: item.key,
              item_name: EGE.itemName(item, player),
              target: target || null,
              quantity: 1,
              credits: price,
              effects: effects,
              consumable: Boolean(item.consumable),
              season: item.seasonBound ? EGE.currentSeason : null,
              active: !item.consumable   /* a booster is in effect only once used */
            });

        return write.then(function (res) {
          if (res.error) { return { ok: false, message: res.error.message }; }
          return setCredits(email, balance - price).then(function (spent) {
            if (!spent.ok) { return spent; }
            return {
              ok: true,
              effects: effects,
              message: 'Bought ' + EGE.itemName(item, player) + ' for ' + price + ' credits.',
              credits: spent.credits
            };
          });
        });
      });
    });
  }

  /* Things bought over and over stack onto one row: rating points and
     performance boosters both keep a quantity rather than a row apiece. */
  function stackedRow(rows, itemKey, target) {
    return (rows || []).filter(function (row) {
      return row.item_key === itemKey && (row.target || null) === (target || null);
    })[0] || null;
  }

  function quantityOf(row) {
    return typeof row.quantity === 'number' ? row.quantity : 1;
  }

  /* Buys one point on one attribute. The price comes from what the attribute
     is at right now, so it is worked out here rather than trusted from the
     page that asked. */
  function buyUpgrade(email, player, attributeKey, points) {
    var c = client();
    if (!c) { return fail(offline()); }

    var wanted = points || 1;
    var attribute = EGE.economy.upgradePlan(player).filter(function (row) {
      return row.key === attributeKey;
    })[0];

    if (!attribute) {
      var known = EGE.boostableFor(player).filter(function (row) {
        return row.key === attributeKey;
      })[0];
      if (known && EGE.economy.TRAINING_ONLY_GROUPS.indexOf(known.groupKey) !== -1) {
        return fail(known.label + ' moves through offseason training, not credits.');
      }
      return fail('That attribute is not one this position is judged on.');
    }
    if (attribute.cost === null) {
      return fail(attribute.label + ' is already at ' + EGE.economy.MAX_RATING + '.');
    }

    /* Never sell more than there is room for below 99. */
    var buying = EGE.economy.pointsAvailable(attribute.value, wanted);
    if (!buying) {
      return fail(attribute.label + ' is already at ' + EGE.economy.MAX_RATING + '.');
    }

    var price = EGE.economy.bulkCost(attribute.value, buying);

    return creditsFor(email).then(function (balance) {
      if (balance === null) { return { ok: false, message: offline() }; }
      if (balance < price) {
        return {
          ok: false,
          message: 'Not enough credits — that costs ' + price + ', you have ' + balance + '.'
        };
      }

      return inventoryFor(email).then(function (rows) {
        var existing = stackedRow(rows, 'upgrade', attributeKey);
        var owned = existing ? quantityOf(existing) + buying : buying;
        var effects = {};
        effects[attributeKey] = owned;

        var write = existing
          ? c.from(INVENTORY).update({
              quantity: owned,
              effects: effects,
              credits: (existing.credits || 0) + price
            }).eq('id', existing.id)
          : c.from(INVENTORY).insert({
              email: email,
              item_key: 'upgrade',
              item_name: attribute.label,
              target: attributeKey,
              quantity: buying,
              credits: price,
              effects: effects,
              consumable: false,
              season: null,
              active: true
            });

        return write.then(function (res) {
          if (res.error) { return { ok: false, message: res.error.message }; }
          return setCredits(email, balance - price).then(function (spent) {
            if (!spent.ok) { return spent; }
            return {
              ok: true,
              message: attribute.label + ' ' + attribute.value + ' \u2192 ' + (attribute.value + buying) +
                       ' for ' + price + ' credits.',
              credits: spent.credits
            };
          });
        });
      });
    });
  }

  /* --- credits earned ---------------------------------------------------- */

  /* What a player has been paid this season, newest first. */
  function awardsFor(email, season) {
    var c = client();
    if (!c || !email) { return Promise.resolve([]); }

    return c.from(AWARDS).select('*')
      .eq('email', email).eq('season', season || EGE.currentSeason)
      .order('awarded_at', { ascending: false })
      .then(function (res) { return res.error ? [] : (res.data || []); })
      .catch(function () { return []; });
  }

  /* Every award for a season, across every account. An admin's policies are
     what make this return more than one player's worth. */
  function allAwards(season) {
    var c = client();
    if (!c) { return Promise.resolve([]); }

    var query = c.from(AWARDS).select('*');
    if (season) { query = query.eq('season', season); }

    return query.order('awarded_at', { ascending: false })
      .then(function (res) { return res.error ? [] : (res.data || []); })
      .catch(function () { return []; });
  }

  /* Pays whatever the season data says this player is owed and has not had
     yet: the offseason allowance on the way into a season, and the credits
     for each touchdown as the results are posted.

     Nothing is worked out here — data/economy.js decides what is owed, and
     Postgres decides what is new, in one transaction, so calling this on
     every page load is both safe and the whole point. A result committed
     with two touchdowns in it turns into twenty credits the next time the
     player opens the site. */
  function syncAwards(player, season) {
    var c = client();
    if (!c || !player || !player.email) { return Promise.resolve({ paid: 0 }); }

    var year = season || EGE.currentSeason;
    var owed = EGE.economy.awardsEarned(player, year);
    if (!owed.length) { return Promise.resolve({ paid: 0 }); }

    return c.rpc('pay_credit_awards', {
      p_email: player.email,
      p_season: year,
      p_awards: owed
    }).then(function (res) {
      if (res.error) { return { paid: 0, message: res.error.message }; }
      return { paid: Number(res.data) || 0 };
    }).catch(function () { return { paid: 0 }; });
  }

  /* Hands out credits an admin has decided on — a good season, a Pro Bowl,
     whatever the earnings table calls it. Logged like any other award, so it
     shows up in the season log rather than as a balance that changed for no
     recorded reason. */
  function awardCredits(email, credits, note) {
    var c = client();
    if (!c) { return fail(offline()); }

    var amount = Math.round(Number(credits) || 0);
    if (amount <= 0) { return fail('An award has to be worth something.'); }

    /* Unique per account per season, and an admin may well hand out two of
       the same size in one season, so the clock breaks the tie. */
    var key = 'manual-' + Date.now().toString(36);

    return c.rpc('pay_credit_awards', {
      p_email: email,
      p_season: EGE.currentSeason,
      p_awards: [{ key: key, credits: amount, note: note || 'Awarded by an admin' }]
    }).then(function (res) {
      if (res.error) { return { ok: false, message: res.error.message }; }
      var paid = Number(res.data) || 0;
      if (!paid) { return { ok: false, message: 'Nothing was paid \u2014 try again.' }; }
      return { ok: true, credits: paid, message: paid + ' credits awarded.' };
    });
  }

  /* --- the end of a season ----------------------------------------------- */

  /* Rating points and training are what the season lock folds into
     data/ratings.js, so once that file is in the repository these rows are
     saying it twice. Everything else stays: an unused performance booster is
     still unused next season, and Intel lapses on its own.

     Admin only in practice \u2014 the delete policy allows a player their own
     rows, which is no more than the inventory already lets them do. */
  function clearLockedRows(email) {
    var c = client();
    if (!c) { return fail(offline()); }

    var query = c.from(INVENTORY).delete()
      .or('item_key.eq.upgrade,item_key.like.train-%');
    if (email) { query = query.eq('email', email); }

    return query.then(function (res) {
      if (res.error) { return { ok: false, message: res.error.message }; }
      return { ok: true, message: 'Rating points and training cleared.' };
    });
  }

  /* --- boosters stuck on games ------------------------------------------- */

  /* Every sticker on every game, keyed by player slug and then by week, so a
     schedule can draw them without asking per row. */
  function loadGameBoosters(season) {
    var c = client();
    if (!c) { EGE.gameBoosters = {}; return Promise.resolve({}); }

    return c.from(GAME_BOOSTERS).select('*').eq('season', season || EGE.currentSeason)
      .then(function (res) {
        var byPlayer = {};
        if (res.error) { EGE.gameBoosters = byPlayer; return byPlayer; }

        (res.data || []).forEach(function (row) {
          var player = EGE.players.filter(function (p) {
            return p.email && row.email && p.email.toLowerCase() === row.email.toLowerCase();
          })[0];
          if (!player) { return; }
          var weeks = byPlayer[player.slug] || (byPlayer[player.slug] = {});
          weeks[row.week] = row;
        });

        EGE.gameBoosters = byPlayer;
        return byPlayer;
      })
      .catch(function () { EGE.gameBoosters = {}; return {}; });
  }

  /* Sticks one on a game: the sticker leaves the inventory, because it is on
     the schedule now rather than in a drawer. */
  function applyBooster(email, item, season, week) {
    var c = client();
    if (!c) { return fail(offline()); }

    return inventoryFor(email).then(function (rows) {
      var owned = stackedRow(rows, item.key, null);
      if (!owned || quantityOf(owned) < 1) { return { ok: false, message: 'You do not own one of those.' }; }

      return c.from(GAME_BOOSTERS).insert({
        email: email,
        season: season,
        week: week,
        item_key: item.key,
        item_name: item.name
      }).then(function (res) {
        if (res.error) {
          return {
            ok: false,
            message: /duplicate|unique/i.test(res.error.message || '')
              ? 'That game already has a sticker on it.'
              : res.error.message
          };
        }

        var left = quantityOf(owned) - 1;
        var write = left > 0
          ? c.from(INVENTORY).update({ quantity: left }).eq('id', owned.id)
          : c.from(INVENTORY).delete().eq('id', owned.id);

        return write.then(function () {
          return { ok: true, message: item.name + ' stuck on week ' + week + '.' };
        });
      });
    });
  }

  /* Peels one off and puts it back in the drawer. */
  function peelBooster(email, sticker) {
    var c = client();
    if (!c) { return fail(offline()); }

    var item = EGE.shopItem(sticker.item_key);
    if (!item) { return fail('That sticker is not in the shop any more.'); }

    return c.from(GAME_BOOSTERS).delete().eq('id', sticker.id).then(function (res) {
      if (res.error) { return { ok: false, message: res.error.message }; }

      return inventoryFor(email).then(function (rows) {
        var owned = stackedRow(rows, item.key, null);
        var write = owned
          ? c.from(INVENTORY).update({ quantity: quantityOf(owned) + 1 }).eq('id', owned.id)
          : c.from(INVENTORY).insert({
              email: email,
              item_key: item.key,
              item_name: item.name,
              target: null,
              quantity: 1,
              credits: 0,
              effects: {},
              consumable: true,
              season: null,
              active: false
            });

        return write.then(function () {
          return { ok: true, message: item.name + ' back in your inventory.' };
        });
      });
    });
  }

  /* --- using and toggling ------------------------------------------------ */

  /* A performance booster is spent the moment it is used: one comes off the
     pile, and the row goes when the last one does. The inventory is what a
     player still has, not a receipt book. */
  function useItem(row) {
    var c = client();
    if (!c) { return fail(offline()); }
    if (!row.consumable) { return fail('That one is not used up.'); }

    var left = quantityOf(row) - 1;
    var write = left > 0
      ? c.from(INVENTORY).update({ quantity: left }).eq('id', row.id)
      : c.from(INVENTORY).delete().eq('id', row.id);

    return write.then(function (res) {
      if (res.error) { return { ok: false, message: res.error.message }; }
      return {
        ok: true,
        message: row.item_name + ' used' + (left > 0 ? ' \u2014 ' + left + ' left.' : '.')
      };
    });
  }

  function setActive(row, active) {
    var c = client();
    if (!c) { return fail(offline()); }

    return c.from(INVENTORY).update({ active: Boolean(active) }).eq('id', row.id)
      .then(function (res) {
        if (res.error) { return { ok: false, message: res.error.message }; }
        return { ok: true, message: row.item_name + (active ? ' is in effect.' : ' is off.') };
      });
  }

  /* Admin only in practice: the delete policy allows a player their own rows
     too, which is the same thing as using one up. */
  function removeItem(row) {
    var c = client();
    if (!c) { return fail(offline()); }

    return c.from(INVENTORY).delete().eq('id', row.id).then(function (res) {
      if (res.error) { return { ok: false, message: res.error.message }; }
      return { ok: true, message: row.item_name + ' removed.' };
    });
  }

  /* Takes one off a stack, keeping the row until it empties. */
  function decrement(row) {
    var c = client();
    if (!c) { return fail(offline()); }

    var left = quantityOf(row) - 1;
    if (left <= 0) { return removeItem(row); }

    var patch = { quantity: left };
    if (row.item_key === 'upgrade' && row.target) {
      patch.effects = {};
      patch.effects[row.target] = left;
    }

    return c.from(INVENTORY).update(patch).eq('id', row.id).then(function (res) {
      if (res.error) { return { ok: false, message: res.error.message }; }
      return { ok: true, message: row.item_name + ' down to ' + left + '.' };
    });
  }

  /* Hands an item over without charging for it. */
  function grant(email, item, target) {
    var c = client();
    if (!c) { return fail(offline()); }

    return c.from(INVENTORY).insert({
      email: email,
      item_key: item.key,
      item_name: item.name,
      target: target || null,
      effects: item.needsTarget ? effectsForTarget(item, target) : rollEffects(item),
      credits: 0,
      consumable: Boolean(item.consumable),
      season: item.seasonBound ? EGE.currentSeason : null,
      active: !item.consumable
    }).then(function (res) {
      if (res.error) { return { ok: false, message: res.error.message }; }
      return { ok: true, message: item.name + ' granted.' };
    });
  }

  /* A season-bound row is spent the moment the season turns over. */
  function lapsed(row) {
    return typeof row.season === 'number' && row.season !== EGE.currentSeason;
  }

  /* Does this inventory hold live Intel for the season on show? */
  function hasIntel(rows) {
    return (rows || []).some(function (row) {
      return row.item_key === 'intel' && row.active && !lapsed(row);
    });
  }

  return {
    loadBoosts: loadBoosts,
    ownedCount: ownedCount,
    lapsed: lapsed,
    hasIntel: hasIntel,
    refreshAdmin: refreshAdmin,
    admin: admin,
    creditsFor: creditsFor,
    setCredits: setCredits,
    inventoryFor: inventoryFor,
    allInventory: allInventory,
    allCredits: allCredits,
    buy: buy,
    buyUpgrade: buyUpgrade,
    loadGameBoosters: loadGameBoosters,
    applyBooster: applyBooster,
    peelBooster: peelBooster,
    useItem: useItem,
    setActive: setActive,
    removeItem: removeItem,
    decrement: decrement,
    quantityOf: quantityOf,
    grant: grant,
    awardsFor: awardsFor,
    allAwards: allAwards,
    syncAwards: syncAwards,
    awardCredits: awardCredits,
    clearLockedRows: clearLockedRows
  };
})();
