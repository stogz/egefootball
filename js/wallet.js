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

  /* --- buying ------------------------------------------------------------ */

  /* Six players and one shop, so the balance is read, checked and written
     in sequence rather than locked. The worst case is a double spend from
     two tabs at once, which an admin can put right. */
  function buy(email, item, target) {
    var c = client();
    if (!c) { return fail(offline()); }
    if (!item) { return fail('That item is not in the shop.'); }
    if (item.needsTarget && !target) { return fail('Choose which attribute to raise.'); }

    /* The button is disabled too, but a disabled button is a suggestion. */
    var allowed = EGE.itemAvailable(item, EGE.currentSeason);
    if (!allowed.ok) { return fail(allowed.reason); }

    return creditsFor(email).then(function (balance) {
      if (balance === null) { return { ok: false, message: offline() }; }
      if (balance < item.credits) {
        return { ok: false, message: 'Not enough credits — that costs ' + item.credits + ', you have ' + balance + '.' };
      }

      return c.from(INVENTORY).insert({
        email: email,
        item_key: item.key,
        item_name: item.name,
        target: target || null,
        credits: item.credits,
        consumable: Boolean(item.consumable),
        season: item.seasonBound ? EGE.currentSeason : null,
        active: !item.consumable      /* a booster is in effect only once used */
      }).then(function (res) {
        if (res.error) { return { ok: false, message: res.error.message }; }
        return setCredits(email, balance - item.credits).then(function (spent) {
          if (!spent.ok) { return spent; }
          return { ok: true, message: 'Bought ' + item.name + '.', credits: spent.credits };
        });
      });
    });
  }

  /* --- using and toggling ------------------------------------------------ */

  /* A performance booster is spent the moment it is used, so the row goes:
     the inventory is what a player still has. */
  function useItem(row) {
    var c = client();
    if (!c) { return fail(offline()); }
    if (!row.consumable) { return fail('That one is not used up.'); }

    return c.from(INVENTORY).delete().eq('id', row.id).then(function (res) {
      if (res.error) { return { ok: false, message: res.error.message }; }
      return { ok: true, message: row.item_name + ' used.' };
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

  /* Hands an item over without charging for it. */
  function grant(email, item, target) {
    var c = client();
    if (!c) { return fail(offline()); }

    return c.from(INVENTORY).insert({
      email: email,
      item_key: item.key,
      item_name: item.name,
      target: target || null,
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
    useItem: useItem,
    setActive: setActive,
    removeItem: removeItem,
    grant: grant
  };
})();
