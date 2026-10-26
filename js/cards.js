/* ==========================================================================
   EGE Football — the card collection, in Supabase
   Who owns which cards and which library sets they have claimed (see the
   Cards section of supabase/schema.sql). Cards only ever arrive through two
   database functions, each one transaction: opening a pack takes the
   diamonds and hands over the cards together, and claiming a set pays its
   reward and marks it claimed together. Neither can half happen.

   What a card *is* comes from data/cards.js; all that is stored is its id.

   Trades, quick sales, showcases, holo merges, the daily spin and the
   admin's resets go through database functions too: a trade moves both
   sides at once or not at all, a sale takes the card and pays the diamonds
   together, a merge takes three copies and hands over the holo together, a
   spin is once a day, a showcase only takes cards its player owns, and only
   an admin can reset anything. A limited-time event's sets (the Gold
   Rush, Halloween) are locked in and its reward claimed the same way, and
   an event's card that changes hands waits 48 hours before the database
   lets it go again.

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

  /* Who has a card and how many: [{ email, quantity }]. Any signed-in
     player can read every collection (a trade is picking out of somebody
     else's), so this is everybody's. Null when it could not be read. */
  function ownersOf(cardId) {
    var c = client();
    if (!c || !cardId) { return Promise.resolve(null); }
    return c.from(CARDS).select('email, quantity').eq('card_id', cardId).gt('quantity', 0)
      .then(function (res) { return res.error ? null : (res.data || []); })
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

  /* Pays for a pack whose cards were rolled when it was put in front of the
     player (EGE.cards.rollPack), which is the moment it is torn open: a
     pack closed without tearing is never charged and its cards never
     arrive. What the database charges for and what the rip shows are the
     same cards. */
  function openPack(packKey, cards) {
    var c = client();
    if (!c) { return fail(offline()); }

    var pack = EGE.cards.pack(packKey);
    if (!pack) { return fail('There is no such pack.'); }
    if (!cards || cards.length !== pack.size) {
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

  /* The last packs anybody opened, newest first: { email, pack_key, cards,
     opened_at }. Through recent_card_opens, since card_packs itself is
     only readable by its owner. Null when they could not be read. */
  function recentOpens(limit) {
    var c = client();
    if (!c) { return Promise.resolve(null); }
    return c.rpc('recent_card_opens', { p_limit: limit || 16 })
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

  /* Just where each of those trades stands -- id, status, whether it has
     been seen, and who it is to -- for checking in the background whether
     anything has moved before reading them all again. Null when it could
     not be read. */
  function tradeStates(email) {
    var c = client();
    if (!c || !email) { return Promise.resolve(null); }
    var me = email.toLowerCase();

    return c.from(TRADES).select('id, status, seen_at, from_email, to_email')
      .then(function (res) {
        if (res.error) { return null; }
        return (res.data || []).filter(function (t) {
          return t.from_email.toLowerCase() === me || t.to_email.toLowerCase() === me;
        });
      })
      .catch(function () { return null; });
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

  /* Marks offers made to this player as seen, so they stop counting as new. */
  function markTradesSeen(ids) {
    var c = client();
    if (!c || !ids.length) { return Promise.resolve(false); }
    return c.rpc('mark_trades_seen', { p_ids: ids })
      .then(function (res) { return !res.error; })
      .catch(function () { return false; });
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

  /* The Player Cards a player has put in their showcase ('pc:{slug}'
     slots), and the cards of those players their rank is worked out from.
     Public, like the showcase: { players: [slug], cards: { id: quantity },
     earned: { slug: diamonds }, photos: { slug: data url } }. */
  function showcasePlayersFor(email) {
    var c = client();
    if (!c || !email) { return Promise.resolve({ players: [], cards: {}, earned: null, photos: {} }); }
    return c.rpc('showcased_player_cards', { p_email: email })
      .then(function (res) {
        var d = res.error ? null : res.data;
        return { players: (d && d.players) || [], cards: (d && d.cards) || {},
                 earned: (d && d.earned) || null, photos: (d && d.photos) || {} };
      })
      .catch(function () { return { players: [], cards: {}, earned: null, photos: {} }; });
  }

  /* --- photos on Player Cards ---------------------------------------------- */

  /* This player's custom Player Card photos: { slug: data url }. Null when
     they could not be read (before the schema has card_photos). */
  function cardPhotos(email) {
    var c = client();
    if (!c || !email) { return Promise.resolve(null); }
    return c.from('card_photos').select('slug, photo').eq('email', email)
      .then(function (res) {
        if (res.error) { return null; }
        var map = {};
        (res.data || []).forEach(function (row) { map[row.slug] = row.photo; });
        return map;
      })
      .catch(function () { return null; });
  }

  /* What each of this player's Player Cards has paid them, every season:
     { slug: diamonds }. Anybody signed in can read it; null when it could
     not be (before the schema has player_card_earnings). */
  function playerCardEarnings(email) {
    var c = client();
    if (!c || !email) { return Promise.resolve(null); }
    return c.rpc('player_card_earnings', { p_email: email })
      .then(function (res) { return res.error ? null : (res.data || {}); })
      .catch(function () { return null; });
  }

  /* Puts a photo, already cropped and shrunk to a data URL, on this
     player's Player Card of `slug`; set_card_photo checks they hold a card
     of his and that it is small enough. */
  function setCardPhoto(slug, photo) {
    return call('set_card_photo', { p_slug: slug, p_photo: photo }, function () { return { ok: true }; });
  }

  /* Takes one down. An admin passes `email` (and no slug for all of them). */
  function clearCardPhoto(slug, email) {
    return call('clear_card_photo', { p_slug: slug || null, p_email: email || null },
      function (n) { return { ok: true, count: Number(n) || 0 }; });
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

  /* --- the daily spin ---------------------------------------------------------- */

  /* Where this account stands with today's spin: { day, next_at, spin }
     where spin is { prize, cards, diamonds, spun_at } once it has spun
     today, else null. Null when it cannot be read. */
  function spinToday() {
    var c = client();
    if (!c) { return Promise.resolve(null); }
    return c.rpc('card_spin_today')
      .then(function (res) { return res.error ? null : res.data; })
      .catch(function () { return null; });
  }

  /* Spins: the page proposes every prize (EGE.cards.rollSpinOffer) and
     spin_card_wheel rolls which one it is. Comes back with { prize,
     cards: [card], won, diamonds, next_at }. */
  function spin() {
    var offer = EGE.cards.rollSpinOffer();
    if (!offer) { return fail('The wheel opens once there are cards out to put on it.'); }
    return call('spin_card_wheel', { p_offer: offer }, function (data) {
      return {
        ok: true,
        prize: data.prize,
        cards: (data.cards || []).map(EGE.cards.byId).filter(Boolean),
        won: Number(data.won) || 0,
        diamonds: Number(data.diamonds),
        nextAt: data.next_at
      };
    });
  }

  /* --- holos ------------------------------------------------------------------ */

  /* Merges three copies of `card` into its holo, for good, and is paid a
     tenth of the holo's fantasy score for it (EGE.cards.holoBonus). Comes
     back with the holo, how many copies of the card are left, what the
     merge paid and the diamonds after. */
  function mergeHolo(card) {
    if (!card || card.holo) { return fail('Only a card can be merged into a holo.'); }
    if (card.reward) { return fail('That card has no holo.'); }
    return call('merge_holo_card', { p_card: card.id, p_diamonds: EGE.cards.holoBonus(card) }, function (data) {
      return {
        ok: true,
        holo: EGE.cards.byId(EGE.cards.holoIdOf(card.id)),
        left: Number(data && data.left) || 0,
        paid: Number(data && data.diamonds) || 0,
        diamonds: data && typeof data.balance === 'number' ? data.balance : null
      };
    });
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

  /* --- limited-time events (the Gold Rush, Halloween) -------------------------- */

  /* An event's card_events row: { key, name, days, sets, reward, starts_at,
     ends_at }, starts_at null until an admin starts it. Readable signed out
     too. Null when it could not be read (before the schema has it). */
  function eventFor(key) {
    var c = client();
    if (!c || !key) { return Promise.resolve(null); }
    return c.from('card_events').select('*').eq('key', key).maybeSingle()
      .then(function (res) { return res.error ? null : (res.data || null); })
      .catch(function () { return null; });
  }

  /* Every event's row, keyed by event. Null when they could not be read. */
  function events() {
    var c = client();
    if (!c) { return Promise.resolve(null); }
    return c.from('card_events').select('*')
      .then(function (res) {
        if (res.error) { return null; }
        var out = {};
        (res.data || []).forEach(function (row) { out[row.key] = row; });
        return out;
      })
      .catch(function () { return null; });
  }

  /* Which sets this player has locked in, by event then by set, and under
     the event's own key once its reward is claimed:
     { 'halloween': { 'graveyard': row, ... }, ... }. */
  function eventClaims(email) {
    var c = client();
    if (!c || !email) { return Promise.resolve({}); }
    return c.from('card_event_claims').select('event_key, set_key, cards, claimed_at, reward')
      .eq('email', email)
      .then(function (res) {
        var out = {};
        if (res.error) { return out; }
        (res.data || []).forEach(function (row) {
          (out[row.event_key] = out[row.event_key] || {})[row.set_key] = row;
        });
        return out;
      })
      .catch(function () { return {}; });
  }

  /* Every card this player has pulled out of one kind of pack, { id: true }:
     what Halloween's Card Art set counts, since a card traded for does not.
     Empty when it could not be read. */
  function pulledFrom(email, packKey) {
    var c = client();
    if (!c || !email || !packKey) { return Promise.resolve({}); }
    return c.from(PACKS).select('cards').eq('email', email).eq('pack_key', packKey)
      .then(function (res) {
        var out = {};
        if (res.error) { return out; }
        (res.data || []).forEach(function (row) {
          (row.cards || []).forEach(function (id) { out[id] = true; });
        });
        return out;
      })
      .catch(function () { return {}; });
  }

  /* Locks in one of an event's sets with the cards it was made with;
     claim_event_set checks they are all that event's cards in the
     collection (and, for a set that says so, pulled from its packs by this
     player), and pays the reward: the card rolled here, and the set's
     diamonds and booster, which it holds itself. */
  function claimEventSet(set, filled) {
    if (!filled.complete) { return fail('That set is not complete yet.'); }
    var reward = set.reward ? EGE.cards.rollReward(set) : null;
    return call('claim_event_set', {
      p_event: set.event,
      p_set: set.key,
      p_cards: filled.slots.map(function (one) { return one.card.id; }),
      p_reward_card: reward ? reward.id : null
    }, function (out) {
      out = out || {};
      return { ok: true, claimed: Number(out.claimed) || 0, card: reward,
               diamonds: out.diamonds == null ? null : Number(out.diamonds) };
    });
  }

  /* Every set locked in: the event's reward card. */
  function claimEventReward(key) {
    return call('claim_event_reward', { p_event: key }, function (id) {
      return { ok: true, card: EGE.cards.byId(id) };
    });
  }

  /* The event copies of this player's still cooling down after a trade
     or a market sale: { card id: [when each can go again] }, soonest
     first. Null when they could not be read. */
  function tradeLocks(email) {
    var c = client();
    if (!c || !email) { return Promise.resolve(null); }
    return c.from('card_trade_locks').select('card_id, locked_until')
      .eq('email', email.toLowerCase()).gt('locked_until', new Date().toISOString())
      .order('locked_until', { ascending: true })
      .then(function (res) {
        if (res.error) { return null; }
        var out = {};
        (res.data || []).forEach(function (row) {
          (out[row.card_id] = out[row.card_id] || []).push(row.locked_until);
        });
        return out;
      })
      .catch(function () { return null; });
  }

  /* The admin's start (its days from now) and early end. */
  function startEvent(key) {
    return call('start_card_event', { p_key: key }, function (row) { return { ok: true, event: row }; });
  }

  function endEvent(key) {
    return call('end_card_event', { p_key: key }, function (row) { return { ok: true, event: row }; });
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
      c.from(SHOWCASES).select('email, cards'),
      c.from('card_photos').select('email, slug')
    ]).then(function (all) {
      if (all.slice(0, 4).some(function (res) { return res.error; })) { return null; }
      return { cards: all[0].data || [], claims: all[1].data || [],
               trades: all[2].data || [], showcases: all[3].data || [],
               photos: all[4].error ? null : (all[4].data || []) };
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
    ownersOf: ownersOf,
    claimsFor: claimsFor,
    openPack: openPack,
    claimSet: claimSet,
    recentPacks: recentPacks,
    quickSell: quickSell,
    recentOpens: recentOpens,
    cardPhotos: cardPhotos,
    playerCardEarnings: playerCardEarnings,
    setCardPhoto: setCardPhoto,
    clearCardPhoto: clearCardPhoto,
    tradesFor: tradesFor,
    tradeStates: tradeStates,
    proposeTrade: proposeTrade,
    respondTrade: respondTrade,
    cancelTrade: cancelTrade,
    markTradesSeen: markTradesSeen,
    showcaseFor: showcaseFor,
    setShowcase: setShowcase,
    showcasePlayersFor: showcasePlayersFor,
    syncPlayerCards: syncPlayerCards,
    playerCardAwards: playerCardAwards,
    shopToday: shopToday,
    buyShopCard: buyShopCard,
    spinToday: spinToday,
    spin: spin,
    mergeHolo: mergeHolo,
    market: market,
    listCard: listCard,
    cancelListing: cancelListing,
    buyListing: buyListing,
    eventFor: eventFor,
    events: events,
    eventClaims: eventClaims,
    pulledFrom: pulledFrom,
    claimEventSet: claimEventSet,
    claimEventReward: claimEventReward,
    tradeLocks: tradeLocks,
    startEvent: startEvent,
    endEvent: endEvent,
    everything: everything,
    clearLibrary: clearLibrary,
    resetGoals: resetGoals
  };
})();
