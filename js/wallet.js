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
  var PUBLISHED = 'published_weeks';

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
     stored: nobody gets to re-roll by reloading the page.

     One twelve-sided die for the whole purchase. On a 1, 2 or 3 the downside
     lands, all of it; on 4 and up, none of it. Rolling each risk separately
     is what made three coin flips add up to a debuff nearly every time. */
  function rollEffects(item) {
    var effects = {};
    Object.keys(item.effects || {}).forEach(function (key) {
      effects[key] = item.effects[key];
    });

    if (item.needsTarget || !(item.risks || []).length) { return effects; }

    /* The roll is worth telling the player about, but it is not an attribute,
       so it is handed back beside the effects rather than stored among them —
       a `__roll` key in there would turn up in his boost summary as a rating
       he had bought. */
    var roll = 1 + Math.floor(Math.random() * EGE.shop.riskDie);
    lastRoll = roll;

    if (roll <= EGE.shop.riskFailsOn) {
      item.risks.forEach(function (risk) {
        effects[risk.attribute] = (effects[risk.attribute] || 0) + risk.amount;
      });
    }
    return effects;
  }

  /* What the last training die came up, for the message that follows it. */
  var lastRoll = null;

  function rollMessage(item) {
    if (!(item.risks || []).length || lastRoll === null) { return ''; }
    var bad = lastRoll <= EGE.shop.riskFailsOn;
    var said = ' Rolled a ' + lastRoll + ' on a d' + EGE.shop.riskDie + ' \u2014 ' +
               (bad ? 'the downside landed.' : 'no downside.');
    lastRoll = null;
    return said;
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
        /* A request that failed says nothing about what has been bought, so
           whatever was there already stays -- nothing on the first load, and
           the last good answer on a refresh, rather than every overall on
           the page dropping back to its base number for one bad request. */
        if (res.error) { return EGE.appliedBoosts || {}; }
        var boosts = {};

        (res.data || []).forEach(function (row) {
          /* A row with effects is a workout or rating points, and those are in
             the ratings for good once bought -- there is no switch for them,
             so a row left switched off from before still counts. */
          if (lapsed(row) || !row.effects) { return; }

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
      .catch(function () { return EGE.appliedBoosts || {}; });
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

    /* Both up front, because a stacking price depends on what is already
       owned: asking for the balance, pricing it, and only then reading the
       inventory would price the fourth workout as though it were the first.
       And it is priced here rather than taken from the page, which is the
       whole reason this runs on what the server says. */
    return Promise.all([creditsFor(email), inventoryFor(email)]).then(function (both) {
      var balance = both[0];
      var rows = both[1];
      if (balance === null) { return { ok: false, message: offline() }; }

      var price = EGE.priceFor(item, EGE.timesBought(rows, item.key));
      if (balance < price) {
        return { ok: false, message: 'Not enough credits — that costs ' + price + ', you have ' + balance + '.' };
      }

      var effects = item.needsTarget ? effectsForTarget(item, target) : rollEffects(item);

      return Promise.resolve().then(function () {
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
              message: 'Bought ' + EGE.itemName(item, player) + ' for ' + price +
                       ' credits.' + rollMessage(item),
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

  /* Hands out credits an admin has decided on — a salary, a Pro Bowl,
     whatever the earnings table calls it. Added straight onto the balance
     and not logged anywhere: the credits are the point, not a record of
     them.

     Read, then written. A balance that cannot be read is never treated as
     nothing, or awarding 30 would set it to 30. */
  function awardCredits(email, credits) {
    var c = client();
    if (!c) { return fail(offline()); }

    var amount = Math.round(Number(credits) || 0);
    if (amount <= 0) { return fail('An award has to be worth something.'); }

    return creditsFor(email).then(function (have) {
      if (have === null) {
        return { ok: false, message: 'Could not read the balance \u2014 nothing was added.' };
      }
      return setCredits(email, have + amount).then(function (res) {
        if (!res.ok) { return res; }
        return { ok: true, credits: res.credits,
                 message: amount + ' credits added \u2014 ' + res.credits + ' now.' };
      });
    });
  }

  /* --- weeks that are out -------------------------------------------------- */

  /* Which weeks the admin has published, as { season: [week, ...] }. Read by
     everyone, signed in or not: it is what decides whether a visitor sees a
     score at all.

     Until this has loaded the site shows fixtures, never results, so a page
     that cannot reach Supabase is behind rather than wrong. */
  function loadPublishedWeeks() {
    var c = client();
    if (!c) { EGE.publishedWeeks = {}; return Promise.resolve({}); }

    return c.from(PUBLISHED).select('season, week, posted_at')
      .then(function (res) {
        /* Same rule as the boosts: a failed request keeps what was already
           out, rather than taking every score off the page. */
        if (res.error) { return EGE.publishedWeeks || {}; }
        var bySeason = {};

        (res.data || []).forEach(function (row) {
          var weeks = bySeason[row.season] || (bySeason[row.season] = []);
          weeks.push(row.week);
        });
        Object.keys(bySeason).forEach(function (season) {
          bySeason[season].sort(function (a, b) { return a - b; });
        });

        EGE.publishedWeeks = bySeason;
        return bySeason;
      })
      .catch(function () { return EGE.publishedWeeks || {}; });
  }

  /* Every published week with when it went out and whether Discord has had
     it, newest first. The admin page's list. */
  function publishedRows(season) {
    var c = client();
    if (!c) { return Promise.resolve([]); }

    var query = c.from(PUBLISHED).select('*');
    if (season) { query = query.eq('season', season); }

    return query.order('week', { ascending: false })
      .then(function (res) { return res.error ? [] : (res.data || []); })
      .catch(function () { return []; });
  }

  /* Puts a week out. Everything else follows from the row landing: the
     schedule shows the score, the game log fills in, the record moves, and
     the touchdown credits become owed. */
  function publishWeek(season, week) {
    var c = client();
    if (!c) { return fail(offline()); }

    return c.from(PUBLISHED)
      .upsert({ season: season, week: week, published_at: new Date().toISOString() },
              { onConflict: 'season,week' })
      .then(function (res) {
        if (res.error) { return { ok: false, message: res.error.message }; }
        return loadPublishedWeeks().then(function () {
          return { ok: true, message: 'Week ' + week + ' is out.' };
        });
      });
  }

  /* Takes it back. Testing this means publishing and unpublishing the same
     week over and over, so it is one call and no confirmation.

     Credits already paid for it stay paid — an award is a ledger entry, not
     a view of the schedule. Publishing it again pays nothing twice. */
  function unpublishWeek(season, week) {
    var c = client();
    if (!c) { return fail(offline()); }

    return c.from(PUBLISHED).delete().eq('season', season).eq('week', week)
      .then(function (res) {
        if (res.error) { return { ok: false, message: res.error.message }; }
        return loadPublishedWeeks().then(function () {
          return { ok: true, message: 'Week ' + week + ' pulled back.' };
        });
      });
  }

  function markPosted(season, week) {
    var c = client();
    if (!c) { return Promise.resolve({ ok: false }); }

    return c.from(PUBLISHED).update({ posted_at: new Date().toISOString() })
      .eq('season', season).eq('week', week)
      .then(function (res) { return { ok: !res.error }; })
      .catch(function () { return { ok: false }; });
  }

  /* Sends a built week to Discord.

     Straight to the webhook when one is set in js/discord-config.js, which is
     the whole setup: no function to deploy and the message lands on the click.
     The URL is public in that case, which is a decision taken there.

     Failing that, the edge function, which keeps the URL as a Supabase secret.

     Whichever it is, the week is already published by the time this runs — a
     post that does not land is a message missing from a channel, not a week
     missing from the site, and the scheduled bot picks it up if it is set up. */
  function postWeekToDiscord(payload) {
    var url = (EGE.discordConfig || {}).webhookUrl;
    if (url) { return postToWebhook(url, payload); }

    var c = client();
    if (!c) { return fail(offline()); }

    return c.functions.invoke('post-week', { body: payload })
      .then(function (res) {
        if (res.error) {
          return {
            ok: false,
            message: 'the post-week function said no (' +
                     (res.error.message || 'no reason given') + ')'
          };
        }
        return { ok: true };
      })
      .catch(function (error) {
        return { ok: false, message: error.message };
      });
  }

  /* Discord's own endpoint, from the browser.

     There is deliberately no falling back to the edge function when this
     fails. A request that reached Discord but whose reply the browser could
     not read looks identical to one that never arrived, and trying the other
     route would post the week twice. Better to say so and let the admin look
     at the channel — Post again is one click. */
  function postToWebhook(url, payload) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (response) {
      if (response.ok) { return { ok: true }; }
      return response.text().then(function (body) {
        return {
          ok: false,
          message: 'Discord replied ' + response.status +
                   (body ? ': ' + body.slice(0, 200) : '')
        };
      });
    }).catch(function (error) {
      return {
        ok: false,
        message: 'the webhook could not be reached (' + error.message + '). ' +
                 'Check the channel before posting again \u2014 it may have landed anyway.'
      };
    });
  }

  /* --- clearing out the boosters -------------------------------------------- */

  /* A sticker on a game that has been published is written into
     stats/{year}.js, and that is where it lives from then on. This drops the
     rows behind those weeks, so the table only ever carries the games still
     to come and a season's worth of stickers does not pile up.

     Only published weeks, so a sticker on a fixture nobody has played is
     never taken off a player. */
  function clearPublishedBoosters(season) {
    var c = client();
    if (!c) { return fail(offline()); }

    var weeks = (EGE.publishedWeeks[season] || []).slice();
    if (!weeks.length) {
      return Promise.resolve({ ok: false, message: 'No published weeks to clear.' });
    }

    return c.from(GAME_BOOSTERS).delete().eq('season', season).in('week', weeks)
      .then(function (res) {
        if (res.error) { return { ok: false, message: res.error.message }; }
        return loadGameBoosters(season).then(function () {
          return {
            ok: true,
            message: 'Cleared the stickers on ' + weeks.length +
                     (weeks.length === 1 ? ' published week.' : ' published weeks.')
          };
        });
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

    /* The page does not draw a plus on a playoff game, but the page is not
       what decides. A booster is spent on planning a regular season, and the
       postseason is not planned -- so the week is checked here as well, where
       the sticker actually leaves the drawer. */
    var owner = EGE.players.filter(function (p) {
      return p.email && email && p.email.toLowerCase() === String(email).toLowerCase();
    })[0];
    var target = owner ? EGE.gameInWeek(owner, week, season) : null;
    if (target && target.playoff) {
      return fail('No boosters in the playoffs \u2014 that one is a postseason game.');
    }

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
    clearLockedRows: clearLockedRows,
    loadPublishedWeeks: loadPublishedWeeks,
    publishedRows: publishedRows,
    publishWeek: publishWeek,
    unpublishWeek: unpublishWeek,
    markPosted: markPosted,
    postWeekToDiscord: postWeekToDiscord,
    clearPublishedBoosters: clearPublishedBoosters
  };
})();
