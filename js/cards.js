/* ==========================================================================
   EGE Football — the card collection, in Supabase
   Who owns which cards and which library sets they have claimed (see the
   Cards section of supabase/schema.sql). Cards only ever arrive through two
   database functions, each one transaction: opening a pack takes the
   diamonds and hands over the cards together, and claiming a set pays its
   reward and marks it claimed together. Neither can half happen.

   What a card *is* comes from data/cards.js; all that is stored is its id.

   Trades, quick sales, showcases and the admin's resets go through
   database functions too: a trade moves both sides at once or not at all, a
   sale takes the card and pays the diamonds together, a showcase only takes
   cards its player owns, and only an admin can reset anything.

   Depends on: js/auth.js, data/cards.js.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.cardStore = (function () {
  'use strict';

  var CARDS = 'player_cards';
  var CLAIMS = 'card_set_claims';
  var TRADES = 'card_trades';
  var SHOWCASES = 'card_showcases';
  var PACKS = 'card_packs';

  function client() {
    return EGE.auth.supabaseClient ? EGE.auth.supabaseClient() : null;
  }

  function fail(message) { return Promise.resolve({ ok: false, message: message }); }

  function offline() {
    return 'Cards cannot reach Supabase. Run supabase/schema.sql and check js/supabase-config.js.';
  }

  /* Postgres says why it refused in the exception text; that is what the
     player should read, without the PL/pgSQL location tacked on. */
  function said(error) {
    return String((error && error.message) || 'Something went wrong.').replace(/\s*CONTEXT:.*$/, '');
  }

  /* Everything this player owns, as { card_id: quantity }, plus when each
     was first pulled. Null when it could not be read, so a page never
     mistakes "unreachable" for "owns nothing". */
  function collectionFor(email) {
    var c = client();
    if (!c || !email) { return Promise.resolve(null); }

    return c.from(CARDS).select('card_id, quantity, first_pulled_at').eq('email', email)
      .then(function (res) {
        if (res.error) { return null; }
        var owned = {};
        var first = {};
        (res.data || []).forEach(function (row) {
          if (row.quantity > 0) {
            owned[row.card_id] = row.quantity;
            first[row.card_id] = row.first_pulled_at;
          }
        });
        return { owned: owned, first: first };
      })
      .catch(function () { return null; });
  }

  /* Which sets this player has claimed, keyed by set. */
  function claimsFor(email) {
    var c = client();
    if (!c || !email) { return Promise.resolve({}); }

    return c.from(CLAIMS).select('set_key, reward, claimed_at').eq('email', email)
      .then(function (res) {
        var out = {};
        if (res.error) { return out; }
        (res.data || []).forEach(function (row) { out[row.set_key] = row; });
        return out;
      })
      .catch(function () { return {}; });
  }

  /* Rolls a pack and pays for it. The cards are decided first, so what the
     database charges for and what the rip shows are the same cards; if the
     payment is refused, nothing was opened. */
  function openPack(packKey) {
    var c = client();
    if (!c) { return fail(offline()); }

    var pack = EGE.cards.pack(packKey);
    if (!pack) { return fail('There is no such pack.'); }

    var cards = EGE.cards.rollPack(packKey);
    if (cards.length !== pack.size) {
      return fail('Not enough cards are out yet to fill a ' + pack.name + '.');
    }

    return c.rpc('open_card_pack', {
      p_pack: packKey,
      p_cards: cards.map(function (card) { return card.id; })
    }).then(function (res) {
      if (res.error) { return { ok: false, message: said(res.error) }; }
      return { ok: true, cards: cards, diamonds: Number(res.data) };
    }).catch(function (error) {
      return { ok: false, message: said(error) };
    });
  }

  /* Claims a completed set: the reward card is rolled here, and the database
     checks that every card the set was made with is really in the
     collection before it pays anything. */
  function claimSet(set, filled) {
    var c = client();
    if (!c) { return fail(offline()); }
    if (!filled.complete) { return fail('That set is not complete yet.'); }

    var reward = EGE.cards.rollReward(set);
    return c.rpc('claim_card_set', {
      p_set: set.key,
      p_cards: filled.slots.map(function (one) { return one.card.id; }),
      p_reward_card: reward ? reward.id : null,
      p_diamonds: set.reward.diamonds || 0,
      p_booster: set.reward.booster || null
    }).then(function (res) {
      if (res.error) { return { ok: false, message: said(res.error) }; }
      return { ok: true, card: reward, diamonds: Number(res.data) };
    }).catch(function (error) {
      return { ok: false, message: said(error) };
    });
  }

  /* The last packs this player opened, newest first: { pack_key, cards,
     opened_at }. Only the player and an admin can read them. Null when they
     could not be read. */
  function recentPacks(email, limit) {
    var c = client();
    if (!c || !email) { return Promise.resolve(null); }

    return c.from(PACKS).select('pack_key, cards, opened_at').eq('email', email)
      .order('opened_at', { ascending: false }).limit(limit || 20)
      .then(function (res) { return res.error ? null : (res.data || []); })
      .catch(function () { return null; });
  }

  /* Sells one copy of a card back for diamonds. The price is by rarity and
     is charged by quick_sell_card in supabase/schema.sql; an Iconic is
     refused there as well as here. */
  function quickSell(card) {
    if (!card || !EGE.cards.sellPrice(card)) { return fail('An Iconic card cannot be quick sold.'); }
    return call('quick_sell_card', { p_card: card.id, p_rarity: card.rarity },
      function (n) { return { ok: true, diamonds: Number(n), price: EGE.cards.sellPrice(card) }; });
  }

  /* --- trades ------------------------------------------------------------ */

  /* Every trade this player is on either side of, newest first. Only those
     two and an admin can read one. */
  function tradesFor(email) {
    var c = client();
    if (!c || !email) { return Promise.resolve([]); }
    var me = email.toLowerCase();

    return c.from(TRADES).select('*').order('created_at', { ascending: false })
      .then(function (res) {
        if (res.error) { return []; }
        return (res.data || []).filter(function (t) {
          return t.from_email.toLowerCase() === me || t.to_email.toLowerCase() === me;
        });
      })
      .catch(function () { return []; });
  }

  function call(fn, args, done) {
    var c = client();
    if (!c) { return fail(offline()); }
    return c.rpc(fn, args).then(function (res) {
      if (res.error) { return { ok: false, message: said(res.error) }; }
      return done(res.data);
    }).catch(function (error) {
      return { ok: false, message: said(error) };
    });
  }

  function proposeTrade(toEmail, give, take) {
    return call('propose_card_trade', { p_to: toEmail, p_give: give, p_take: take || [] },
      function (id) { return { ok: true, id: id }; });
  }

  /* Accepting can still come back 'expired': one of the two no longer has a
     card the offer was for. */
  function respondTrade(id, accept) {
    return call('respond_card_trade', { p_trade: id, p_accept: Boolean(accept) },
      function (status) { return { ok: true, status: status }; });
  }

  function cancelTrade(id) {
    return call('cancel_card_trade', { p_trade: id },
      function () { return { ok: true, status: 'cancelled' }; });
  }

  /* --- showcases ----------------------------------------------------------- */

  /* The cards a player has up on their page. Public, so this works signed
     out too. */
  function showcaseFor(email) {
    var c = client();
    if (!c || !email) { return Promise.resolve([]); }
    return c.from(SHOWCASES).select('cards').eq('email', email).maybeSingle()
      .then(function (res) { return res.error || !res.data ? [] : (res.data.cards || []); })
      .catch(function () { return []; });
  }

  function setShowcase(ids) {
    return call('set_card_showcase', { p_cards: ids }, function () { return { ok: true }; });
  }

  /* --- player cards -------------------------------------------------------- */

  /* Pays what this account's Player Cards are owed for the season's games:
     its collection decides the rank on each of the six, data/cards.js what
     each game pays at it, and pay_player_card_bonuses what is new. Safe to
     call on every load, like the other awards. */
  function syncPlayerCards(player, season) {
    var c = client();
    if (!c || !player || !player.email) { return Promise.resolve({ paid: 0 }); }
    var year = season || EGE.currentSeason;
    if (!EGE.economy.paysDiamonds(year)) { return Promise.resolve({ paid: 0 }); }

    return collectionFor(player.email).then(function (got) {
      /* A collection that could not be read is not an empty one: paying on
         it would settle every game at nothing. */
      if (!got) { return { paid: 0 }; }
      return c.rpc('pay_player_card_bonuses', {
        p_season: year,
        p_awards: EGE.cards.playerBonusesEarned(got.owned, year)
      }).then(function (res) {
        if (res.error) { return { paid: 0, message: res.error.message }; }
        return { paid: Number(res.data) || 0 };
      });
    }).catch(function () { return { paid: 0 }; });
  }

  /* What this account's Player Cards have paid, as diamond_awards rows. */
  function playerCardAwards(email) {
    var c = client();
    if (!c || !email) { return Promise.resolve(null); }
    return c.from('diamond_awards').select('season, award_key, diamonds, note, awarded_at')
      .eq('email', email).like('award_key', 'pc-%')
      .order('awarded_at', { ascending: false })
      .then(function (res) { return res.error ? null : (res.data || []); })
      .catch(function () { return null; });
  }

  /* --- the shop's daily cards ------------------------------------------------ */

  /* Today's shelf: { day, resets_at, cards: [{ card, rarity }], sold: [slot] }.
     The page proposes the day's six, rolled from the date, and the database
     keeps whichever proposal came first. Null when it cannot be read. */
  function shopToday() {
    var c = client();
    if (!c) { return Promise.resolve(null); }
    var seed = new Date().toISOString().slice(0, 10);
    return c.rpc('card_shop_today', { p_cards: EGE.cards.rollShop(seed) })
      .then(function (res) { return res.error ? null : res.data; })
      .catch(function () { return null; });
  }

  function buyShopCard(slot) {
    return call('buy_shop_card', { p_slot: slot },
      function (n) { return { ok: true, diamonds: Number(n) }; });
  }

  /* --- the market ------------------------------------------------------------ */

  var LISTINGS = 'card_listings';

  /* Everything up for sale now, oldest first, and this account's own
     listings from the last day (to count against the three). Anything that
     has run out is put back first. */
  function market(email) {
    var c = client();
    if (!c) { return Promise.resolve(null); }
    var since = new Date(Date.now() - EGE.cards.MARKET.hours * 3600 * 1000).toISOString();

    return c.rpc('expire_card_listings').then(function () {
      return Promise.all([
        c.from(LISTINGS).select('*').eq('status', 'open').order('created_at', { ascending: true }),
        email ? c.from(LISTINGS).select('*').eq('email', email).gt('created_at', since)
          .order('created_at', { ascending: false }) : Promise.resolve({ data: [] })
      ]);
    }).then(function (both) {
      if (both[0].error) { return null; }
      return { open: both[0].data || [], mine: both[1].error ? [] : (both[1].data || []) };
    }).catch(function () { return null; });
  }

  function listCard(card, price) {
    return call('list_card_for_sale', { p_card: card.id, p_rarity: card.rarity, p_price: price },
      function (id) { return { ok: true, id: id }; });
  }

  function cancelListing(id) {
    return call('cancel_card_listing', { p_listing: id },
      function () { return { ok: true }; });
  }

  function buyListing(id) {
    return call('buy_card_listing', { p_listing: id },
      function (n) { return { ok: true, diamonds: Number(n) }; });
  }

  /* --- the admin's resets -------------------------------------------------- */

  /* Every collection, claim and trade -- what an admin's policies return. */
  function everything() {
    var c = client();
    if (!c) { return Promise.resolve(null); }
    return Promise.all([
      c.from(CARDS).select('email, card_id, quantity'),
      c.from(CLAIMS).select('email, set_key'),
      c.from(TRADES).select('from_email, to_email, status'),
      c.from(SHOWCASES).select('email, cards')
    ]).then(function (all) {
      if (all.some(function (res) { return res.error; })) { return null; }
      return { cards: all[0].data || [], claims: all[1].data || [],
               trades: all[2].data || [], showcases: all[3].data || [] };
    }).catch(function () { return null; });
  }

  /* `email` null is everybody. */
  function clearLibrary(email) {
    return call('admin_clear_card_library', { p_email: email || null },
      function (n) { return { ok: true, count: Number(n) || 0 }; });
  }

  function resetGoals(email) {
    return call('admin_reset_card_goals', { p_email: email || null },
      function (n) { return { ok: true, count: Number(n) || 0 }; });
  }

  return {
    collectionFor: collectionFor,
    claimsFor: claimsFor,
    openPack: openPack,
    claimSet: claimSet,
    recentPacks: recentPacks,
    quickSell: quickSell,
    tradesFor: tradesFor,
    proposeTrade: proposeTrade,
    respondTrade: respondTrade,
    cancelTrade: cancelTrade,
    showcaseFor: showcaseFor,
    setShowcase: setShowcase,
    syncPlayerCards: syncPlayerCards,
    playerCardAwards: playerCardAwards,
    shopToday: shopToday,
    buyShopCard: buyShopCard,
    market: market,
    listCard: listCard,
    cancelListing: cancelListing,
    buyListing: buyListing,
    everything: everything,
    clearLibrary: clearLibrary,
    resetGoals: resetGoals
  };
})();
