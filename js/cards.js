/* ==========================================================================
   EGE Football — the card collection, in Supabase
   Who owns which cards and which library sets they have claimed (see the
   Cards section of supabase/schema.sql). Cards only ever arrive through two
   database functions, each one transaction: opening a pack takes the credits
   and hands over the cards together, and claiming a set pays its reward and
   marks it claimed together. Neither can half happen.

   What a card *is* comes from data/cards.js; all that is stored is its id.

   Trades, showcases and the admin's resets go through database functions
   too: a trade moves both sides at once or not at all, a showcase only
   takes cards its player owns, and only an admin can reset anything.

   Depends on: js/auth.js, data/cards.js.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.cardStore = (function () {
  'use strict';

  var CARDS = 'player_cards';
  var CLAIMS = 'card_set_claims';
  var TRADES = 'card_trades';
  var SHOWCASES = 'card_showcases';

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
      return { ok: true, cards: cards, credits: Number(res.data), booster: pack.booster || null };
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
      p_credits: set.reward.credits || 0,
      p_booster: set.reward.booster || null
    }).then(function (res) {
      if (res.error) { return { ok: false, message: said(res.error) }; }
      return { ok: true, card: reward, credits: Number(res.data) };
    }).catch(function (error) {
      return { ok: false, message: said(error) };
    });
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
    tradesFor: tradesFor,
    proposeTrade: proposeTrade,
    respondTrade: respondTrade,
    cancelTrade: cancelTrade,
    showcaseFor: showcaseFor,
    setShowcase: setShowcase,
    everything: everything,
    clearLibrary: clearLibrary,
    resetGoals: resetGoals
  };
})();
