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

   Depends on: js/auth.js, data/cards.js (and data/nfl-cards.js for the
   NFL cards).
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

  /* Supabase hands back at most 1000 rows a request (the API's max rows)
     and leaves the rest out without saying so. A big collection is more
     than a thousand different cards, and in card id order the last of them
     are the newest season's performances (p:2027:...) and the reward cards
     (r:...): the cards that went missing from the Library. A read that can
     run that long goes through here: `query()` makes the read afresh,
     `order` is the columns that keep its rows in one fixed order, and pages
     are read until every row the count says there is has come back. The
     result is { data, error }, like one read. */
  var PAGE = 1000;

  function allRows(query, order) {
    var rows = [];
    function page() {
      var q = query();
      order.forEach(function (col) { q = q.order(col, { ascending: true }); });
      return q.range(rows.length, rows.length + PAGE - 1).then(function (res) {
        if (res.error) { return { data: null, error: res.error }; }
        var got = res.data || [];
        rows = rows.concat(got);
        var more = typeof res.count === 'number' ? rows.length < res.count : got.length === PAGE;
        return got.length && more ? page() : { data: rows, error: null };
      });
    }
    return page();
  }

  /* Everything this player owns, as { card_id: quantity }, plus when each
     was first pulled. Null when it could not be read, so a page never
     mistakes "unreachable" for "owns nothing". */
  function collectionFor(email) {
    var c = client();
    if (!c || !email) { return Promise.resolve(null); }

    return allRows(function () {
      return c.from(CARDS).select('card_id, quantity, first_pulled_at', { count: 'exact' }).eq('email', email);
    }, ['card_id'])
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

  /* Reads the trades with `email` on one side or the other. A player can
     read no others anyway, but an admin can read every trade there is, and
     was sent all of them on every check. `read(query)` finishes the query;
     should the filter ever be refused, it is read the old way, everything
     readable, which the callers sort through themselves. */
  function tradesWith(email, columns, read) {
    var c = client();
    /* Quoted, since an address has dots in it. */
    var who = '"' + String(email).replace(/["\\]/g, '') + '"';
    return read(c.from(TRADES).select(columns).or('from_email.ilike.' + who + ',to_email.ilike.' + who))
      .then(function (res) { return res.error ? read(c.from(TRADES).select(columns)) : res; });
  }

  /* Every trade this player is on either side of, newest first. Only those
     two and an admin can read one. */
  function tradesFor(email) {
    var c = client();
    if (!c || !email) { return Promise.resolve([]); }
    var me = email.toLowerCase();

    return tradesWith(email, '*', function (q) { return q.order('created_at', { ascending: false }); })
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

    return tradesWith(email, 'id, status, seen_at, from_email, to_email', function (q) { return q; })
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
     slots, and 'npc:{slug}' for an NFL teammate's), and the cards of those
     players their rank is worked out from. Public, like the showcase:
     { players: [slug], nfl: [slug], cards: { id: quantity },
       earned: { slug: diamonds }, photos: { slug or 'n:'slug: data url } }. */
  function showcasePlayersFor(email) {
    var none = { players: [], nfl: [], cards: {}, earned: null, photos: {} };
    var c = client();
    if (!c || !email) { return Promise.resolve(none); }
    return c.rpc('showcased_player_cards', { p_email: email })
      .then(function (res) {
        var d = res.error ? null : res.data;
        return { players: (d && d.players) || [], nfl: (d && d.nfl) || [], cards: (d && d.cards) || {},
                 earned: (d && d.earned) || null, photos: (d && d.photos) || {} };
      })
      .catch(function () { return none; });
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
     player's Player Card of `slug` ('n:{slug}' for an NFL teammate's);
     set_card_photo checks they hold a card of his, that it is small
     enough and, for an NFL one, that no more than six are up. */
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
     call on every load, like the other awards. Its NFL Player Cards are
     paid the same way, after (payNflCards), and then its Team Cards
     (payTeamCards). */
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
        var six = res.error ? { paid: 0, message: res.error.message } : { paid: Number(res.data) || 0 };
        return payNflCards(got.owned, year).then(function (nfl) {
          six.paid += nfl;
          return payTeamCards(got.owned, year);
        }).then(function (teams) {
          six.paid += teams;
          return six;
        });
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

  /* --- NFL cards ------------------------------------------------------------

     The six's NFL teammates' cards (data/nfl-cards.js) are made from the NFL
     sim's box scores, a week at a time: nfl_card_lines hands back, for each
     published week from 2024 on, the games of the teams the six were on that
     week with those teams' lines and the scoring plays. What comes back is
     kept in this browser with each week's digest from sim_box_scores and
     the teams it was asked for, so a week is read once, and again only
     when the NFL Sim tab rewrites it or one of the six changes teams. */
  var NFL_STORE = 'ege.nflCards.v1';
  var NFL_CHUNK = 8;
  var nflLoad = null;
  var nflAsked = '';

  function nflStored() {
    try {
      var raw = window.localStorage.getItem(NFL_STORE);
      var got = raw ? JSON.parse(raw) : null;
      return got && got.weeks ? got : { weeks: {} };
    } catch (e) { return { weeks: {} }; }
  }

  function nflStore(weeks) {
    try { window.localStorage.setItem(NFL_STORE, JSON.stringify({ weeks: weeks })); }
    catch (e) { /* full, or not allowed: read again next time */ }
  }

  /* Reads what is not kept yet and hands every week to EGE.nflCards.
     Resolves to whether there is anything to make the cards from. Asked
     twice for the same weeks, it is the one read. */
  /* A teammate only ever with the six before 2026 has no ESPN id on his box
     score lines, so his photo is in the sim's rosters: read once someone
     needs it (EGE.nflCards.faceless), the season now's, or the one before
     when it has none yet. */
  var nflFacesAsked = false;
  function nflFaces() {
    var nfl = EGE.nflCards;
    var R = EGE.nflRosters;
    if (nflFacesAsked || !R || !nfl.faceless()) { return; }
    nflFacesAsked = true;
    var season = EGE.currentSeason;
    R.load(season).then(function (all) {
      return all && all.teams ? all : R.load(season - 1);
    }).then(function () { nfl.faces(); }, function () { nflFacesAsked = false; });
  }

  function loadNflCards() {
    var nfl = EGE.nflCards;
    var c = client();
    if (!nfl || !c) { return Promise.resolve(false); }
    var want = nfl.wanted();
    var asked = JSON.stringify(want);
    if (nflLoad && asked === nflAsked) { return nflLoad; }
    nflAsked = asked;
    if (!want.length) {
      nfl.take([]);
      nflLoad = Promise.resolve(true);
      return nflLoad;
    }

    nflLoad = c.from('sim_box_scores').select('season, week, digest').gte('season', nfl.FROM)
      .then(function (res) {
        if (res.error) { return false; }
        var digest = {};
        (res.data || []).forEach(function (row) { digest[row.season + ':' + row.week] = row.digest || ''; });
        var kept = nflStored().weeks;
        var have = {};
        var missing = [];
        want.forEach(function (w) {
          var key = w.s + ':' + w.w;
          if (digest[key] === undefined) { return; }
          var sig = digest[key] + '|' + w.t.join(',');
          if (kept[key] && kept[key].sig === sig) { have[key] = kept[key]; }
          else { missing.push({ w: w, key: key, sig: sig }); }
        });

        var chunks = [];
        for (var i = 0; i < missing.length; i += NFL_CHUNK) { chunks.push(missing.slice(i, i + NFL_CHUNK)); }
        return Promise.all(chunks.map(function (part) {
          return c.rpc('nfl_card_lines', { p_weeks: part.map(function (m) { return m.w; }) })
            .then(function (got) {
              if (got.error) { return; }
              var sigs = {};
              part.forEach(function (m) { sigs[m.key] = m.sig; });
              (got.data || []).forEach(function (row) {
                var key = row.season + ':' + row.week;
                if (sigs[key]) { have[key] = { sig: sigs[key], games: row.games || [] }; }
              });
            }, function () { /* that part is read again next time */ });
        })).then(function () {
          if (missing.length) { nflStore(have); }
          var rows = Object.keys(have).map(function (key) {
            var at = key.split(':');
            return { season: Number(at[0]), week: Number(at[1]), games: have[key].games };
          });
          nfl.take(rows);
          nflFaces();
          return rows.length > 0;
        });
      })
      .catch(function () { return false; })
      /* Nothing came back: asked again next time rather than never. */
      .then(function (ok) {
        if (!ok && nflAsked === asked) { nflAsked = ''; }
        return ok;
      });
    return nflLoad;
  }

  /* Pays this account's NFL Player Cards for the season's weeks
     (pay_nfl_card_bonuses), once the box scores are in. Resolves to what it
     paid. Nothing before the schema has it. */
  function payNflCards(owned, season) {
    var c = client();
    if (!c || !EGE.nflCards || season < EGE.nflCards.FROM) { return Promise.resolve(0); }
    return loadNflCards().then(function () {
      var awards = EGE.nflCards.bonusesEarned(owned, season);
      if (!awards.length) { return 0; }
      return c.rpc('pay_nfl_card_bonuses', { p_season: season, p_awards: awards })
        .then(function (res) { return res.error ? 0 : Number(res.data) || 0; });
    }).catch(function () { return 0; });
  }

  /* Pays this account's Team Cards for the season's wins
     (pay_team_card_wins): the page says what rank each is, from the NFL
     cards held, and Postgres finds the wins in the sim's box scores and
     prices them. Not before the NFL cards are read: a collection whose
     NFL cards are not made yet would put every win in at nothing. Resolves
     to what it paid; nothing before the schema has it. */
  function payTeamCards(owned, season) {
    var c = client();
    var nfl = EGE.nflCards;
    if (!c || !nfl || !EGE.teamCards || season < nfl.FROM) { return Promise.resolve(0); }
    return loadNflCards().then(function () {
      if (!nfl.loaded()) { return 0; }
      var teams = EGE.teamCards.claims(owned);
      if (!teams.length) { return 0; }
      return c.rpc('pay_team_card_wins', { p_season: season, p_teams: teams })
        .then(function (res) { return res.error ? 0 : Number(res.data) || 0; });
    }).catch(function () { return 0; });
  }

  /* What this account's Team Cards have paid, every season, as
     diamond_awards rows (tc-{team}-w{week}). */
  function teamCardAwards(email) {
    var c = client();
    if (!c || !email) { return Promise.resolve(null); }
    return allRows(function () {
      return c.from('diamond_awards').select('season, award_key, diamonds', { count: 'exact' })
        .eq('email', email).like('award_key', 'tc-%');
    }, ['season', 'award_key'])
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

  /* Merges three copies of `card` into its holo, or three holos into
     their Holo II, for good, and is paid a tenth of what it makes for it
     (EGE.cards.holoBonus). Comes back with what it made, how many copies
     of the card are left, what the merge paid and the diamonds after. */
  function mergeHolo(card) {
    if (!card || card.holo2) { return fail('A Holo II cannot be merged again.'); }
    if (card.reward) { return fail('That card has no holo.'); }
    return call('merge_holo_card', { p_card: card.id, p_diamonds: EGE.cards.holoBonus(card) }, function (data) {
      return {
        ok: true,
        holo: EGE.cards.byId(EGE.cards.mergedIdOf(card)),
        left: Number(data && data.left) || 0,
        paid: Number(data && data.diamonds) || 0,
        diamonds: data && typeof data.balance === 'number' ? data.balance : null
      };
    });
  }

  /* Holo all: every merge in `cards` (a card named once per merge) in one
     call, merge_holo_cards. One that cannot go is left out and the rest
     still go. Comes back with what was made, what it all paid, the
     diamonds after and why one did not go, if one did not. */
  function mergeAll(cards) {
    var list = (cards || []).filter(function (card) { return card && !card.holo2 && !card.reward; });
    if (!list.length) { return fail('There is nothing to merge.'); }
    return call('merge_holo_cards', {
      p_cards: list.map(function (card) { return card.id; }),
      p_diamonds: list.map(function (card) { return EGE.cards.holoBonus(card); })
    }, function (data) {
      return {
        ok: true,
        made: ((data && data.made) || []).map(EGE.cards.byId).filter(Boolean),
        paid: Number(data && data.diamonds) || 0,
        diamonds: data && typeof data.balance === 'number' ? data.balance : null,
        problem: (data && data.problem) || ''
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
    return allRows(function () {
      return c.from(PACKS).select('cards', { count: 'exact' }).eq('email', email).eq('pack_key', packKey);
    }, ['opened_at', 'id'])
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

  /* When this player opened each of one kind of pack in the last 24
     hours, oldest first, as times in ms: what a pack held to so many a day
     (perDay) counts. Null when it could not be read. */
  function openedToday(email, packKey) {
    var c = client();
    if (!c || !email || !packKey) { return Promise.resolve(null); }
    var since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    return c.from(PACKS).select('opened_at').eq('email', email).eq('pack_key', packKey)
      .gt('opened_at', since).order('opened_at', { ascending: true }).limit(100)
      .then(function (res) {
        return res.error ? null : (res.data || []).map(function (row) { return new Date(row.opened_at).getTime(); });
      })
      .catch(function () { return null; });
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
      allRows(function () { return c.from(CARDS).select('email, card_id, quantity', { count: 'exact' }); },
        ['email', 'card_id']),
      allRows(function () { return c.from(CLAIMS).select('email, set_key', { count: 'exact' }); },
        ['email', 'set_key']),
      allRows(function () { return c.from(TRADES).select('from_email, to_email, status', { count: 'exact' }); },
        ['created_at', 'id']),
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
    teamCardAwards: teamCardAwards,
    loadNflCards: loadNflCards,
    shopToday: shopToday,
    buyShopCard: buyShopCard,
    spinToday: spinToday,
    spin: spin,
    mergeHolo: mergeHolo,
    mergeAll: mergeAll,
    market: market,
    listCard: listCard,
    cancelListing: cancelListing,
    buyListing: buyListing,
    eventFor: eventFor,
    events: events,
    eventClaims: eventClaims,
    pulledFrom: pulledFrom,
    openedToday: openedToday,
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
