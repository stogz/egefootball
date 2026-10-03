/* ==========================================================================
   EGE Football — the card collection, in Supabase
   Who owns which cards and which library sets they have claimed (see the
   Cards section of supabase/schema.sql). Cards only ever arrive through two
   database functions, each one transaction: opening a pack takes the credits
   and hands over the cards together, and claiming a set pays its reward and
   marks it claimed together. Neither can half happen.

   What a card *is* comes from data/cards.js; all that is stored is its id.

   Depends on: js/auth.js, data/cards.js.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.cardStore = (function () {
  'use strict';

  var CARDS = 'player_cards';
  var CLAIMS = 'card_set_claims';

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
      return { ok: true, cards: cards, credits: Number(res.data) };
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

  return {
    collectionFor: collectionFor,
    claimsFor: claimsFor,
    openPack: openPack,
    claimSet: claimSet
  };
})();
