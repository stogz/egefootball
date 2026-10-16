/* ==========================================================================
   EGE Football — the Cards tab
   Five pages, picked from a bar along the bottom of the screen: Cards (the
   collection, the whole screen of it), Players (the six Player Cards),
   Shop (packs, the day's six cards and the market), Trades, and
   Achievements (the library of sets to put together). A tab of its own, away from the simulation: nothing on
   it changes a rating, a result or a season, so somebody who never opens it
   is not behind anybody at anything.

   Packs are bought with diamonds, the card game's own money, and library
   sets pay them out. Credits only come into it one way: a player can swap
   them for diamonds under the packs, and nothing swaps them back. A card
   can be quick sold for a few diamonds, never for credits.

   Signed-in players only, like the shop. js/app.js routes #cards here and
   calls render(); everything else on the page is drawn from in here.

   Depends on: data/cards.js, js/cards.js, js/wallet.js, js/auth.js.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.cardsView = (function () {
  'use strict';

  var state = {
    player: null,
    owned: {},          /* card id -> how many */
    first: {},          /* card id -> when it was first pulled */
    claims: {},         /* set key -> the claim row */
    credits: null,      /* only for swapping into diamonds */
    diamonds: null,     /* what packs are bought with */
    loaded: false,
    fresh: {},          /* ids pulled since the page loaded, for the New badge */
    newTrades: {},      /* offers marked seen on this visit, still tagged New */
    trades: [],         /* every trade this player is on either side of */
    hold: false,        /* a pack is open: show nothing it holds until Done */
    view: null,         /* whose collection the binder shows: null for yours, else their email */
    other: null,        /* that player's { owned, first }; null while it loads */
    recent: null,       /* the last packs opened, newest first; null until read */
    recentShown: 4,     /* how many recent pulls are drawn */
    tab: 'cards',       /* which of the five pages is showing */
    seasonPack: null,   /* which year the Season Pack tile is turned to */
    pcAwards: null,     /* what the Player Cards have paid, diamond_awards rows */
    shop: null,         /* today's shelf from card_shop_today; null until read */
    market: null,       /* { open, mine } listings; null until read */
    photos: null,       /* this account's Player Card photos, { slug: data url } */
    pcView: null,       /* whose Player Cards the Players page shows; null is yours */
    pcOther: null,      /* theirs once read: { owned, photos, earned, failed } */
    spin: null,         /* today's spin from card_spin_today; null until read */
    spinning: false,    /* the wheel is turning: nothing redraws under it */
    sell: null,         /* picking cards to quick sell together: { picked: { id: n }, ... } */
    filter: { rarity: 'all', kind: 'all', player: 'all', sort: 'rarity' }
  };

  var DEFAULT_FILTER = { rarity: 'all', kind: 'all', player: 'all', sort: 'rarity' };

  var built = false;

  /* --- helpers ---------------------------------------------------------- */

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text != null) { node.textContent = text; }
    return node;
  }

  function byId(id) { return document.getElementById(id); }

  /* The banner over the Cards pages is for problems only. Anything that
     went through (an offer sent or taken back, a sale, a buy) shows in the
     page itself, so a non-error just clears whatever was there (Sam,
     2026-10-16). */
  function say(text, isError) {
    var node = byId('cardsMessage');
    var shown = isError ? text || '' : '';
    node.textContent = shown;
    node.hidden = !shown;
    node.className = 'ege-note ege-note--error';
  }

  function gem() {
    var g = el('span', 'ege-gem');
    g.setAttribute('role', 'img');
    g.setAttribute('aria-label', 'diamonds');
    return g;
  }

  /* What something costs in diamonds -- every price on this tab. */
  function price(diamonds) {
    var box = el('span', 'ege-price', String(diamonds));
    box.appendChild(gem());
    return box;
  }

  /* Something that is clicked but holds a whole card's worth of markup, which
     a <button> is not allowed to. */
  function pressable(node, label, onPress) {
    node.setAttribute('role', 'button');
    node.tabIndex = 0;
    if (label) { node.setAttribute('aria-label', label); }
    node.addEventListener('click', onPress);
    node.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPress(e); }
    });
    return node;
  }

  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function points(n) {
    var shown = Math.round(n * 10) / 10;
    return (shown < 0 ? '\u2212' : '') + Math.abs(shown).toFixed(1);
  }

  /* Tells the rest of the page the balances have moved, and that the
     inventory may have too (a set can pay out a booster). js/app.js
     redraws the nav and the shop from it. Either may be left out. */
  function walletChanged(credits, diamonds) {
    if (typeof credits === 'number' && !isNaN(credits)) { state.credits = credits; }
    if (typeof diamonds === 'number' && !isNaN(diamonds)) { state.diamonds = diamonds; }
    document.dispatchEvent(new window.CustomEvent('ege:wallet', {
      detail: { credits: state.credits, diamonds: state.diamonds }
    }));
  }

  function ownedIds() { return Object.keys(state.owned); }

  /* --- one card --------------------------------------------------------- */

  function describe(card) {
    var r = EGE.cards.rarity(card.rarity);
    return card.player.name + ', ' + r.name + (card.holo ? ' holo ' : ' ') +
      (card.kind === 'play' ? 'play' : 'performance') +
      ' card, ' + points(card.points) + ' fantasy points, ' + card.headline + ', week ' +
      card.week + ' ' + card.season;
  }

  /* A card's face. Sized by whatever holds it: every measurement inside is
     in container units, so the same card is a thumbnail in the binder and a
     hand-sized thing in a pack. */
  function cardEl(card, options) {
    var opts = options || {};
    var r = EGE.cards.rarity(card.rarity);
    var team = card.team || {};

    var node = el('div', 'ege-tcard ege-tcard--' + card.rarity + ' ege-tcard--' + card.kind +
      (card.holo ? ' ege-tcard--holo' : ''));
    node.style.setProperty('--rarity', r.color);
    node.style.setProperty('--ground', team.ground || '#2f4a2b');

    var face = el('div', 'ege-tcard__face');

    var top = el('div', 'ege-tcard__top');
    top.appendChild(el('span', 'ege-tcard__kind', card.kind === 'play' ? 'Play' : 'Performance'));
    var score = el('span', 'ege-tcard__score');
    score.appendChild(el('span', 'ege-tcard__points', points(card.points)));
    score.appendChild(el('span', 'ege-tcard__fpts', 'FPTS'));
    top.appendChild(score);
    face.appendChild(top);

    var art = el('div', 'ege-tcard__art');
    var photo = el('img', 'ege-tcard__photo');
    photo.src = card.player.headshot;
    photo.alt = '';
    photo.loading = 'lazy';
    photo.decoding = 'async';
    art.appendChild(photo);

    if (team.logo) {
      var logo = el('img', 'ege-tcard__logo' + (team.whiteMark ? ' ege-tcard__logo--white' : ''));
      logo.src = team.logo;
      logo.alt = '';
      logo.loading = 'lazy';
      logo.addEventListener('error', function () { logo.remove(); });
      art.appendChild(logo);
    }

    /* A holo says so in the corner the logo leaves free. */
    if (card.holo) { art.appendChild(el('span', 'ege-tcard__holo', 'Holo')); }

    if (card.kind === 'play') {
      var big = el('div', 'ege-tcard__yards');
      if (card.play.kind === 'interception') {
        big.appendChild(el('b', null, 'INT'));
      } else {
        big.appendChild(el('b', null, String(card.play.yards)));
        big.appendChild(el('small', null, 'YD' + (card.play.touchdown ? ' TD' : '')));
      }
      art.appendChild(big);
    } else if (card.big) {
      /* A performance prints its yards and its touchdowns as big as a play
         prints its yardage. */
      var stats = el('div', 'ege-tcard__yards ege-tcard__yards--game');
      stats.appendChild(el('b', null, String(card.big.yards)));
      stats.appendChild(el('small', null, 'YDS'));
      if (card.big.td) {
        stats.appendChild(el('b', null, String(card.big.td)));
        stats.appendChild(el('small', null, 'TD'));
      }
      art.appendChild(stats);
    }
    face.appendChild(art);

    var plate = el('div', 'ege-tcard__plate');
    plate.appendChild(el('div', 'ege-tcard__name', card.player.name));
    plate.appendChild(el('div', 'ege-tcard__meta',
      [card.position, team.school].filter(Boolean).join(' \u00b7 ')));
    face.appendChild(plate);

    var body = el('div', 'ege-tcard__body');
    if (card.kind === 'play') {
      body.appendChild(el('div', 'ege-tcard__headline', card.headline));
      body.appendChild(el('div', 'ege-tcard__line', card.versus));
    } else {
      body.appendChild(el('div', 'ege-tcard__headline', card.versus));
      body.appendChild(el('div', 'ege-tcard__line', card.line));
    }
    face.appendChild(body);

    var foot = el('div', 'ege-tcard__foot');
    foot.appendChild(el('span', 'ege-tcard__rarity', r.name + (card.holo ? ' Holo' : '')));
    foot.appendChild(el('span', 'ege-tcard__when',
      (card.event ? card.event : 'Wk ' + card.week) + ' \u00b7 ' + card.season));
    face.appendChild(foot);

    node.appendChild(face);

    if (opts.count > 1) {
      /* Three or more of one card can be merged into its holo: the count
         says so in holo colours. */
      var count = el('span', 'ege-tcard__count' + (opts.mergeable ? ' ege-tcard__count--merge' : ''),
        '\u00d7' + opts.count);
      if (opts.mergeable) { count.title = 'Three of these make a holo'; }
      node.appendChild(count);
    }
    if (opts.isNew) { node.appendChild(el('span', 'ege-tcard__new', 'New')); }

    return node;
  }

  /* The back every card shares, for the moment before it is turned over. */
  function backEl() {
    var node = el('div', 'ege-tcard ege-tcard--back');
    var face = el('div', 'ege-tcard__face');
    face.appendChild(el('span', 'ege-tcard__backmark'));
    var word = el('span', 'ege-tcard__backword');
    word.appendChild(document.createTextNode('EGE '));
    word.appendChild(el('em', null, 'Football'));
    face.appendChild(word);
    node.appendChild(face);
    return node;
  }

  /* --- packs ------------------------------------------------------------ */

  /* A pack's front, after a Panini Prizm pack: a dark brand bar, the
     prizm (a burst of fine rays that catches the light), the season's
     player cut out over it when it has one (EGE.cards.packCover), the
     pack's name in chrome, and a foot band with the count and the year. */
  function packArt(pack) {
    var cover = EGE.cards.packCover(pack);
    var year = pack.season || (pack.seasonOnly ? EGE.currentSeason : null);
    var art = el('div', 'ege-pack ege-pack--' + (pack.season ? 'year' : pack.key) +
      (cover ? ' ege-pack--' + cover.theme + ' ege-pack--cover' : ''));
    /* Every pack's shimmer and glow keep time with the clock, so redrawing
       the packs (a new balance, the Season Pack's arrows) carries on where
       they were instead of starting them all over at once. */
    var now = Date.now();
    art.style.setProperty('--phase', -(now % 9000) + 'ms');
    art.style.setProperty('--glow-phase', -(now % 3200) + 'ms');
    art.appendChild(el('span', 'ege-pack__top'));

    var body = el('span', 'ege-pack__body');
    /* The team's logo goes under the prizm, so the rays run across it as
       if it were printed in the foil. */
    if (cover && cover.logo) {
      var logo = el('img', 'ege-pack__logo');
      logo.src = cover.logo;
      logo.alt = '';
      logo.decoding = 'async';
      logo.draggable = false;
      logo.addEventListener('error', function () { logo.remove(); });
      body.appendChild(logo);
    }
    body.appendChild(el('span', 'ege-pack__prizm'));
    if (cover) {
      var photo = el('img', 'ege-pack__player');
      photo.src = cover.image;
      if (cover.zoom) { photo.style.setProperty('--zoom', cover.zoom); }
      if (cover.drop) { photo.style.setProperty('--drop', cover.drop + '%'); }
      photo.alt = '';
      photo.decoding = 'async';
      photo.draggable = false;
      /* A picture that will not load leaves the plain pack, not a hole. */
      photo.addEventListener('error', function () {
        photo.remove();
        art.classList.remove('ege-pack--cover');
      });
      body.appendChild(photo);
    }

    var brand = el('span', 'ege-pack__brand');
    brand.appendChild(el('b', null, 'EGE'));
    brand.appendChild(document.createTextNode(' Football'));
    body.appendChild(brand);

    body.appendChild(el('span', 'ege-pack__name',
      pack.season ? 'Season' : pack.name.replace(/ Pack$/, '')));

    var foot = el('span', 'ege-pack__foot');
    foot.appendChild(el('span', 'ege-pack__count', pack.size + ' cards'));
    if (year) { foot.appendChild(el('span', 'ege-pack__year', String(year))); }
    body.appendChild(foot);

    art.appendChild(body);
    art.appendChild(el('span', 'ege-pack__bottom'));
    return art;
  }

  /* The live Season Pack, then one for each season before it, newest
     first. They share one tile and the arrows step through them. */
  function seasonPacks() {
    return EGE.cards.PACKS.filter(function (p) {
      return p.seasonOnly || p.season;
    }).sort(function (a, b) {
      return (b.season || EGE.currentSeason) - (a.season || EGE.currentSeason);
    });
  }

  /* The arrow either side of the Season Pack's Buy button: to the year
     before or the year after. */
  function seasonArrow(list, to, label, glyph) {
    var b = el('button', 'fb-btn ege-packtile__arrow', glyph);
    b.type = 'button';
    b.setAttribute('aria-label', label);
    b.disabled = to < 0 || to >= list.length;
    if (!b.disabled) { b.title = list[to].name; }
    /* Only the Season Pack's tile is swapped: redrawing every pack would
       start every pack's shimmer over and make the row flicker. */
    b.addEventListener('click', function () {
      state.seasonPack = list[to].key;
      var tile = b.closest('.ege-packtile');
      var next = packTile(EGE.cards.pack('season'));
      tile.parentNode.replaceChild(next, tile);
      var same = next.querySelector('[aria-label="' + label + '"]');
      (same && !same.disabled ? same : next.querySelector('.ege-packtile__buy')).focus({ preventScroll: true });
    });
    return b;
  }

  /* Each pack top to bottom, centred: the pack, its name, what is in it,
     and the Buy button, with the Season Pack's year arrows either side. */
  function packTile(pack) {
    var seasons = seasonPacks();
    var at = Math.max(0, seasons.map(function (p) { return p.key; }).indexOf(state.seasonPack));
    var stepping = pack.seasonOnly && seasons.length > 1;
    if (stepping) { pack = seasons[at]; }

    var tile = el('div', 'ege-packtile');
    tile.appendChild(packArt(pack));
    tile.appendChild(el('h4', 'ege-item__name', pack.name));
    tile.appendChild(el('p', 'ege-item__text', pack.blurb));

    var pool = EGE.cards.pullable(pack.key);
    var buy = el('button', 'fb-btn fb-btn--primary ege-packtile__buy');
    buy.type = 'button';
    buy.appendChild(document.createTextNode('Buy & Rip \u00b7 '));
    buy.appendChild(price(pack.diamonds));

    var why = null;
    if (pool.length < pack.size) {
      why = pack.seasonOnly
        ? 'Opens once the first week of ' + EGE.currentSeason + ' is out.'
        : 'Opens once there are games out to put in it.';
    } else if (state.diamonds !== null && state.diamonds < pack.diamonds) {
      why = 'Not enough diamonds yet.';
    }
    buy.disabled = Boolean(why) || !state.loaded;
    if (why) { tile.appendChild(el('p', 'ege-item__blocked', why)); }
    buy.addEventListener('click', function () { buyPack(pack, buy); });

    var row = el('div', 'ege-packtile__row');
    if (stepping) { row.appendChild(seasonArrow(seasons, at + 1, 'Previous year', '\u2039')); }
    row.appendChild(buy);
    if (stepping) { row.appendChild(seasonArrow(seasons, at - 1, 'Next year', '\u203a')); }
    tile.appendChild(row);
    return tile;
  }

  function renderPacks() {
    var holder = byId('cardPacks');
    holder.innerHTML = '';

    EGE.cards.PACKS.forEach(function (pack) {
      if (pack.season) { return; }
      holder.appendChild(packTile(pack));
    });

    renderSwap();
  }

  /* --- swapping credits for diamonds -------------------------------------

     One way only, at EGE.economy.DIAMONDS_PER_CREDIT. buy_diamonds in
     supabase/schema.sql takes the credits and adds the diamonds in one go,
     and charges the rate itself. */

  function swapAmount() {
    var n = Math.floor(Number(byId('swapCredits').value));
    return n > 0 ? n : 0;
  }

  function renderSwap() {
    var rate = EGE.economy.DIAMONDS_PER_CREDIT;
    var spend = swapAmount();
    byId('swapRate').textContent = rate;

    var button = byId('swapBuy');
    button.innerHTML = '';
    button.appendChild(document.createTextNode('Get '));
    button.appendChild(price(spend * rate));
    button.disabled = !state.loaded || !spend || state.credits === null || state.credits < spend;

  }

  function buySwap() {
    var spend = swapAmount();
    var button = byId('swapBuy');
    if (!spend) { return; }
    button.disabled = true;
    say('', false);

    EGE.wallet.buyDiamonds(spend).then(function (res) {
      if (!res.ok) {
        say(res.message, true);
        renderSwap();
        return;
      }
      walletChanged(res.credits, res.diamonds);
      renderPacks();
    });
  }

  /* Puts a sealed pack in front of the player. Its cards are rolled now
     but nothing is paid until it is torn open (tearOpen pays through
     `pay`); closing it sealed costs nothing and hands nothing over. */
  function buyPack(pack, button) {
    say('', false);
    if (state.diamonds !== null && state.diamonds < pack.diamonds) {
      say('Not enough diamonds for a ' + pack.name + '.', true);
      return;
    }
    var cards = EGE.cards.rollPack(pack.key);
    if (cards.length !== pack.size) {
      say('Not enough cards are out yet to fill a ' + pack.name + '.', true);
      return;
    }

    /* New is the first of a card ever, so a pack with two of something
       new calls only the first one new. */
    var seen = Object.assign({}, state.owned);
    var isNew = cards.map(function (card) {
      var first = !seen[card.id];
      seen[card.id] = (seen[card.id] || 0) + 1;
      return first;
    });
    var paid = false;

    openRip({
      pack: pack, cards: cards, isNew: isNew, sellable: true,
      pay: function () {
        return EGE.cardStore.openPack(pack.key, cards).then(function (res) {
          if (!res.ok) { return res; }
          /* The cards are the player's now, but the collection, the
             library and the counts stay as they were until the pack is
             put away -- otherwise they give the pack away before a card
             is turned over. */
          paid = true;
          state.hold = true;
          walletChanged(null, res.diamonds);
          renderPacks();
          return res;
        });
      },
      onClose: function () { if (paid) { reveal(cards, isNew); } }
    });
  }

  /* --- ripping one open ------------------------------------------------- */

  var rip = null;

  function closeRip() {
    if (!rip) { return; }
    /* Not while a pack is being paid for: the answer decides whether it
       was bought at all. */
    if (rip.node.querySelector('.ege-rip__pack.is-paying')) { return; }
    rip.node.hidden = true;
    rip.node.innerHTML = '';
    delete rip.node.dataset.fx;
    document.documentElement.classList.remove('ege-noscroll');
    var back = rip.returnTo;
    var after = rip.onClose;
    rip = null;
    if (back && back.focus) { back.focus(); }
    if (after) { after(); }
  }

  /* The pack is put away: what was in it goes into the collection. Read
     back from the server rather than added on here, so nothing is counted
     twice if the page was refreshed while the pack was open. */
  function reveal(cards, isNew) {
    cards.forEach(function (card, i) { if (isNew[i]) { state.fresh[card.id] = true; } });
    state.hold = false;
    refresh();
  }

  /* --- the big pulls ------------------------------------------------------

     Legendary and up hold back before they turn over: the card lifts,
     shakes and glows in its colour, then turns in a burst of light. The
     rarer, the longer -- `BUILDUP` is how long it holds back, `SHOW` how
     long the burst after it runs. Mystic adds sparks and a flash of gold;
     Iconic dims everything else, fills the screen with its colours and
     puts ICONIC across the top, the longest of the three. None of it runs
     with reduced motion: the card just turns. */
  var BUILDUP = { legendary: 900, mystic: 1700, iconic: 2800 };
  var SHOW = { legendary: 1600, mystic: 2400, iconic: 3600 };
  var SPARKS = { legendary: 8, mystic: 16, iconic: 32 };
  var RINGS = { legendary: 1, mystic: 1, iconic: 2 };

  function isBig(flip) { return Boolean(BUILDUP[flip.dataset.rarity]); }

  /* Runs `then` after `ms`, unless the overlay it belongs to has gone. */
  function later(ms, then) {
    var mine = rip;
    window.setTimeout(function () { if (rip && rip === mine) { then(); } }, ms);
  }

  function flipCard(flip) {
    if (flip.classList.contains('is-flipped') || flip.classList.contains('is-charging')) { return; }
    if (!isBig(flip) || reducedMotion()) { turnOver(flip); return; }

    var rarity = flip.dataset.rarity;
    flip.style.setProperty('--charge', BUILDUP[rarity] + 'ms');
    flip.style.setProperty('--show', SHOW[rarity] + 'ms');
    flip.classList.add('is-charging', 'is-big');
    if (rarity !== 'legendary') { rip.node.dataset.fx = rarity; }
    if (rarity === 'iconic') { flip.appendChild(rays(flip)); }
    later(BUILDUP[rarity], function () {
      flip.classList.remove('is-charging');
      turnOver(flip);
      burst(flip);
    });
  }

  function turnOver(flip) {
    flip.classList.add('is-flipped');
    flip.setAttribute('aria-label', flip.dataset.label);
    var left = rip.node.querySelectorAll('.ege-flip:not(.is-flipped)').length;
    if (!left) { finishRip(); }
  }

  function rays(flip) {
    var back = flip.querySelector('.ege-flip__fx');
    if (back) { return back; }
    back = el('span', 'ege-flip__fx');
    back.setAttribute('aria-hidden', 'true');
    back.appendChild(el('span', 'ege-flip__rays'));
    return back;
  }

  /* The burst as the card turns: rays turning behind it, a ring going out,
     sparks flying off it, and for Mystic and Iconic a flash over everything.
     Taken away again once it has run, so nothing keeps animating. */
  function burst(flip) {
    var rarity = flip.dataset.rarity;
    var back = rays(flip);
    for (var r = 0; r < RINGS[rarity]; r += 1) {
      var ring = el('span', 'ege-flip__ring');
      ring.style.animationDelay = (r * 260) + 'ms';
      back.appendChild(ring);
    }
    flip.appendChild(back);

    var sparks = el('span', 'ege-flip__sparks');
    sparks.setAttribute('aria-hidden', 'true');
    var count = SPARKS[rarity];
    var reach = flip.offsetWidth || 180;
    for (var i = 0; i < count; i += 1) {
      var spark = el('span', 'ege-flip__spark');
      spark.style.setProperty('--a', Math.round(i * 360 / count + Math.random() * 10) + 'deg');
      spark.style.setProperty('--d', Math.round(reach * (0.55 + Math.random() * (rarity === 'iconic' ? 0.9 : 0.5))) + 'px');
      spark.style.setProperty('--t', Math.round(Math.random() * (rarity === 'iconic' ? 700 : 260)) + 'ms');
      sparks.appendChild(spark);
    }
    flip.appendChild(sparks);

    if (rarity !== 'legendary') {
      var flash = el('div', 'ege-rip__flash ege-rip__flash--' + rarity);
      flash.setAttribute('aria-hidden', 'true');
      rip.node.appendChild(flash);
      later(1000, function () { flash.remove(); });
    }

    if (rarity === 'iconic') {
      var banner = el('div', 'ege-rip__banner');
      banner.setAttribute('aria-hidden', 'true');
      banner.appendChild(el('span', null, 'Iconic'));
      rip.node.appendChild(banner);
      later(SHOW.iconic, function () { banner.remove(); });
    }

    later(SHOW[rarity], function () {
      back.remove();
      sparks.remove();
      flip.classList.add('is-landed');
      if (rip.node.dataset.fx === rarity && !rip.node.querySelector('.ege-flip.is-charging')) {
        delete rip.node.dataset.fx;
      }
    });
  }

  function finishRip() {
    rip.node.querySelector('.ege-rip__flipall').hidden = true;
    rip.node.querySelector('.ege-rip__done').hidden = false;
    var again = rip.node.querySelector('.ege-rip__again');
    if (again && rip.pack) {
      var affordable = state.diamonds !== null && state.diamonds >= rip.pack.diamonds &&
        EGE.cards.pullable(rip.pack.key).length >= rip.pack.size;
      again.hidden = rip.again ? false : !affordable;
    }
    rip.node.querySelector('.ege-rip__hint').textContent = rip.summary ||
      (rip.sellable ? 'Tap any you don\u2019t want to quick sell them.' : '');
    rip.done = true;
    drawSell();
  }

  /* --- quick selling out of a pack ------------------------------------- */

  function pickToSell(flip) {
    if (!rip || !rip.sellable || !rip.done || flip.classList.contains('is-sold') || rip.selling) { return; }
    if (!EGE.cards.sellPrice(flip.card)) {
      rip.node.querySelector('.ege-rip__hint').textContent = 'Iconic cards cannot be quick sold.';
      return;
    }
    var at = rip.picked.indexOf(flip);
    if (at === -1) { rip.picked.push(flip); } else { rip.picked.splice(at, 1); }
    flip.classList.toggle('is-picked', at === -1);
    flip.setAttribute('aria-pressed', at === -1 ? 'true' : 'false');
    drawSell();
  }

  function drawSell() {
    var button = rip && rip.node.querySelector('.ege-rip__sell');
    if (!button) { return; }
    var total = rip.picked.reduce(function (sum, flip) { return sum + EGE.cards.sellPrice(flip.card); }, 0);
    button.hidden = !rip.picked.length;
    button.innerHTML = '';
    button.appendChild(document.createTextNode('Quick sell ' + rip.picked.length + ' \u00b7 '));
    button.appendChild(price(total));
  }

  /* One sale at a time, so each card's copy is taken and paid for on its
     own; a refusal stops there and leaves the rest picked. */
  function sellPicked(mine, button) {
    if (!mine.picked.length || mine.selling) { return; }
    mine.selling = true;
    button.disabled = true;
    var sold = 0;
    var got = 0;

    function next() {
      if (rip !== mine) { return; }
      var flip = mine.picked[0];
      if (!flip) { return done(''); }
      EGE.cardStore.quickSell(flip.card).then(function (res) {
        if (rip !== mine) { return; }
        if (!res.ok) { return done(res.message); }
        sold += 1;
        got += res.price;
        mine.picked.shift();
        flip.classList.remove('is-picked');
        flip.classList.add('is-sold');
        walletChanged(null, res.diamonds);
        next();
      });
    }

    function done(problem) {
      mine.selling = false;
      button.disabled = false;
      renderPacks();
      drawSell();
      mine.node.querySelector('.ege-rip__hint').textContent = problem ||
        ('Sold ' + sold + (sold === 1 ? ' card' : ' cards') + ' for ' + got + (got === 1 ? ' diamond.' : ' diamonds.'));
      if (sold && EGE.showcase) { EGE.showcase.forget(); }
      /* The Another button checks the balance the sales just added to. */
      if (mine.pack && !mine.again) {
        var again = mine.node.querySelector('.ege-rip__again');
        if (again) {
          again.hidden = !(state.diamonds !== null && state.diamonds >= mine.pack.diamonds &&
            EGE.cards.pullable(mine.pack.key).length >= mine.pack.size);
        }
      }
    }

    next();
  }

  function dealCards() {
    var row = rip.node.querySelector('.ege-rip__cards');
    row.hidden = false;
    rip.node.querySelector('.ege-rip__flipall').hidden = false;
    rip.node.querySelector('.ege-rip__hint').textContent = 'Tap a card to turn it over.';
    var first = row.querySelector('.ege-flip');
    if (first) { first.focus({ preventScroll: true }); }
  }

  function tearOpen() {
    var packNode = rip.node.querySelector('.ege-rip__pack');
    if (!packNode || packNode.classList.contains('is-torn') || packNode.classList.contains('is-paying')) { return; }

    /* A bought pack is paid for here, as it tears, and only tears once the
       diamonds have gone. Refused, it stays sealed and nothing is taken. */
    if (rip.pay) {
      var mine = rip;
      var pay = rip.pay;
      packNode.classList.add('is-paying');
      mine.node.querySelector('.ege-rip__hint').textContent = 'Opening\u2026';
      pay().then(function (res) {
        if (rip !== mine) { return; }
        packNode.classList.remove('is-paying');
        if (!res.ok) {
          mine.node.querySelector('.ege-rip__hint').textContent = res.message;
          return;
        }
        mine.pay = null;
        mine.node.querySelector('.ege-rip__hint').textContent = '';
        tearOpen();
      });
      return;
    }

    packNode.classList.add('is-torn');
    packNode.setAttribute('aria-hidden', 'true');
    packNode.tabIndex = -1;
    window.setTimeout(function () {
      if (!rip) { return; }
      packNode.hidden = true;
      dealCards();
    }, reducedMotion() ? 0 : 620);
  }

  /* The overlay. With a pack, it opens on the sealed pack and the cards come
     out when it is torn; without one -- a set's reward -- it opens on the
     cards face down. `demo` is the admin's practice rip: nothing was paid
     and nothing goes anywhere, and `again` rips another one. `free` is a
     pack won on the daily spin: already the player's, so no Another. */
  function openRip(options) {
    var node = byId('cardRip');
    node.innerHTML = '';
    delete node.dataset.fx;
    rip = { node: node, pack: options.pack || null, returnTo: document.activeElement,
            onClose: options.onClose || null, again: options.again || null };
    var mineRip = rip;

    /* Once the cards are over, the only words are what a set paid on top
       of its card. */
    rip.summary = options.extras && options.extras.length ? options.extras.join(' \u00b7 ') + '.' : '';
    rip.pay = options.pay || null;
    rip.sellable = Boolean(options.sellable);
    rip.picked = [];

    var stage = el('div', 'ege-rip__stage ege-rip__stage--pack');
    stage.style.setProperty('--n', options.cards.length);

    var head = el('div', 'ege-rip__head');
    head.appendChild(el('h2', 'ege-rip__title', options.title || (options.pack && options.pack.name)));
    var close = el('button', 'fb-modal__close ege-rip__close', '\u00d7');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close');
    close.addEventListener('click', closeRip);
    head.appendChild(close);
    stage.appendChild(head);

    if (options.pack) {
      /* Nothing about the pack gives away what is in it: no glow, no
         colour, until a card is turned over. */
      var packNode = pressable(el('div', 'ege-rip__pack'), 'Tear the pack open', tearOpen);
      packNode.appendChild(packArt(options.pack));
      stage.appendChild(packNode);
    }

    var row = el('div', 'ege-rip__cards ege-rip__cards--' + options.cards.length);
    row.hidden = Boolean(options.pack);
    options.cards.forEach(function (card, i) {
      var r = EGE.cards.rarity(card.rarity);
      var flip = el('div', 'ege-flip ege-flip--' + card.rarity);
      flip.style.setProperty('--i', i);
      flip.style.setProperty('--glow', r.color);
      flip.dataset.rarity = card.rarity;
      flip.dataset.label = describe(card) + (options.isNew[i] ? ', new' : '');
      flip.card = card;
      pressable(flip, 'Card ' + (i + 1) + ', face down. Turn it over.', function () {
        if (flip.classList.contains('is-flipped')) { pickToSell(flip); } else { flipCard(flip); }
      });

      var inner = el('div', 'ege-flip__inner');
      var back = el('div', 'ege-flip__side ege-flip__side--back');
      back.appendChild(backEl());
      var front = el('div', 'ege-flip__side ege-flip__side--front');
      front.appendChild(cardEl(card, { isNew: options.isNew[i] }));
      inner.appendChild(back);
      inner.appendChild(front);
      flip.appendChild(inner);
      row.appendChild(flip);
    });
    stage.appendChild(row);

    stage.appendChild(el('p', 'ege-rip__hint', ''));

    /* Quick selling straight out of the pack: once every card is over,
       tap the ones you do not want and sell them together. */
    if (options.sellable) {
      var sellBtn = el('button', 'fb-btn ege-rip__sell');
      sellBtn.type = 'button';
      sellBtn.hidden = true;
      sellBtn.addEventListener('click', function () { sellPicked(mineRip, sellBtn); });
      stage.appendChild(sellBtn);
    }

    var actions = el('div', 'ege-rip__actions');
    var flipAll = el('button', 'fb-btn ege-rip__flipall', 'Turn them all over');
    flipAll.type = 'button';
    flipAll.hidden = true;
    flipAll.addEventListener('click', function () {
      Array.prototype.forEach.call(row.querySelectorAll('.ege-flip:not(.is-flipped):not(.is-charging)'), function (flip, i) {
        window.setTimeout(function () { if (rip) { flipCard(flip); } }, reducedMotion() ? 0 : i * 140);
      });
    });
    actions.appendChild(flipAll);

    if (options.pack && !options.free) {
      var again = el('button', 'fb-btn ege-rip__again');
      again.type = 'button';
      again.hidden = true;
      if (options.again) {
        again.textContent = 'Another demo';
      } else {
        again.appendChild(document.createTextNode('Another \u00b7 '));
        again.appendChild(price(options.pack.diamonds));
      }
      again.addEventListener('click', function () {
        var pack = options.pack;
        var next = options.again;
        closeRip();
        if (next) { next(); } else { buyPack(pack, null); }
      });
      actions.appendChild(again);
    }

    var done = el('button', 'fb-btn fb-btn--primary ege-rip__done', 'Done');
    done.type = 'button';
    done.hidden = true;
    done.addEventListener('click', closeRip);
    actions.appendChild(done);
    stage.appendChild(actions);

    node.appendChild(stage);
    node.hidden = false;
    document.documentElement.classList.add('ege-noscroll');

    if (options.pack) {
      stage.querySelector('.ege-rip__pack').focus({ preventScroll: true });
    } else {
      dealCards();
    }
  }

  /* --- the overlay, for anything else ----------------------------------- */

  /* The same dark overlay a pack opens in, with a title and a close, for a
     card up close, the trade builder and the showcase picker. Hands back the
     stage to fill. */
  function openOverlay(title, modifier) {
    var node = byId('cardRip');
    node.innerHTML = '';
    delete node.dataset.fx;
    rip = { node: node, pack: null, returnTo: document.activeElement };

    var stage = el('div', 'ege-rip__stage' + (modifier ? ' ' + modifier : ''));
    var head = el('div', 'ege-rip__head');
    head.appendChild(el('h2', 'ege-rip__title', title));
    var close = el('button', 'fb-modal__close ege-rip__close', '\u00d7');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close');
    close.addEventListener('click', closeRip);
    head.appendChild(close);
    stage.appendChild(head);

    node.appendChild(stage);
    node.hidden = false;
    document.documentElement.classList.add('ege-noscroll');
    return stage;
  }

  /* --- a card up close -------------------------------------------------- */

  /* `owned`, when given, is how many the viewer has -- left off for somebody
     else's card, on a showcase or in a trade. `theirs` is { name, email,
     count } when it is from somebody else's collection, and `sell` offers a
     quick sale of one copy when it is from your own. `owner` is the email
     of whoever's showcase it is on, and `tradeWith` an account to offer a
     trade for it (the Trade for it button). Signed in, it also says who
     else has the card and how many. */
  function zoom(card, options) {
    var opts = options || {};
    var stage = openOverlay(card.player.name, 'ege-rip__stage--zoom');

    var row = el('div', 'ege-rip__cards ege-rip__cards--1');
    var holder = el('div', 'ege-zoom__card');
    holder.appendChild(cardEl(card, {}));
    row.appendChild(holder);
    stage.appendChild(row);
    if (card.holo) { tiltHolo(holder); }

    var r = EGE.cards.rarity(card.rarity);
    var facts = el('dl', 'ege-zoom__facts');
    function fact(label, value) {
      facts.appendChild(el('dt', null, label));
      return facts.appendChild(el('dd', null, value));
    }

    /* The stat line is itself the way to the game, like a school on a
       player's page is the way to its team: the player's page, on this
       card's season, at this game in the log. */
    function lineFact(label, value) {
      facts.appendChild(el('dt', null, label));
      var dd = el('dd');
      var link = el('a', 'ege-zoom__line');
      link.href = '#' + card.slug;
      link.title = 'Open ' + card.player.first + '\u2019s game log at this game';
      link.appendChild(el('span', 'ege-zoom__linetext', value));
      link.appendChild(el('span', 'ege-zoom__go', '\u2192'));
      link.addEventListener('click', function (e) {
        e.preventDefault();
        closeRip();
        EGE.goToGame(card.slug, card.season, card.week);
      });
      dd.appendChild(link);
      facts.appendChild(dd);
    }
    if (card.holo) {
      var one = EGE.cards.byId(card.baseId);
      fact('Rarity', r.name + ' Holo \u00b7 three copies merged into one');
      fact('Fantasy', points(card.points) + ' points' +
        (one ? ' (3 \u00d7 ' + points(one.points) + ')' : ''));
    } else {
      fact('Rarity', r.name + ' \u00b7 ' + r.odds + '% of pulls');
      fact('Fantasy', points(card.points) + ' points');
    }
    fact('Game', card.versus + ' \u00b7 ' + (card.event || 'Week ' + card.week) + ', ' + card.season +
      (card.game.result ? ' \u00b7 ' + card.game.result.teamScore + '\u2013' + card.game.result.opponentScore : ''));
    if (card.kind === 'play') {
      fact('The play', card.text);
      lineFact('That game', EGE.cards.statSummary(card.player.position, card.game.stats));
    } else {
      lineFact('Line', card.line);
    }
    var ownedNode = typeof opts.owned === 'number' ? fact(opts.theirs ? 'You have' : 'Owned', String(opts.owned)) : null;
    if (opts.theirs) { fact(opts.theirs.name + ' has', String(opts.theirs.count)); }
    var viewer = EGE.auth.currentPlayer();
    if (viewer) {
      /* Everybody already counted above is left out of it. */
      var skip = [opts.theirs && opts.theirs.email, opts.owner,
                  typeof opts.owned === 'number' ? viewer.email : null]
        .filter(Boolean).map(function (e) { return e.toLowerCase(); });
      owners(card, fact('Who else has it', 'Loading…'), skip, viewer.email.toLowerCase());
    }
    stage.appendChild(facts);

    var status = el('p', 'ege-rip__hint ege-zoom__status');
    status.setAttribute('role', 'status');
    stage.appendChild(status);

    var actions = el('div', 'ege-rip__actions');
    var merge = null;
    if (opts.sell && !card.holo && opts.owned >= EGE.cards.HOLO_OF) {
      merge = mergeControl(card, { status: status });
      actions.appendChild(merge);
    }
    if (opts.sell && opts.owned > 0) {
      actions.appendChild(sellControl(card, { holder: holder, owned: ownedNode, status: status, merge: merge }));
      actions.appendChild(marketControl(card, { status: status }));
    }
    /* Somebody else's card: straight to the Trades page with an offer for
       it ready, to pick what you give and send. */
    if (viewer && opts.tradeWith && opts.tradeWith.toLowerCase() !== viewer.email.toLowerCase() &&
        playerByEmail(opts.tradeWith)) {
      var trade = el('button', 'fb-btn ege-zoom__trade', 'Trade for it');
      trade.type = 'button';
      trade.title = 'Open a trade offer to ' + firstName(opts.tradeWith) + ' for this card';
      trade.addEventListener('click', function () { tradeFor(opts.tradeWith, card); });
      actions.appendChild(trade);
    }
    var done = el('button', 'fb-btn fb-btn--primary', 'Done');
    done.type = 'button';
    done.addEventListener('click', closeRip);
    actions.appendChild(done);
    stage.appendChild(actions);
    done.focus({ preventScroll: true });
  }

  /* Who else has a card and how many, into `dd` once it is read: each
     account with its face, its first name and its count, biggest pile
     first, and any copies up on the Market (held out of collections while
     they are). `skip` is who is already counted in the facts above. */
  function owners(card, dd, skip, viewer) {
    dd.classList.add('ege-zoom__owners');
    EGE.cardStore.ownersOf(card.id).then(function (rows) {
      if (!dd.isConnected) { return; }
      dd.textContent = '';
      if (!rows) { dd.textContent = 'That could not be loaded.'; return; }
      var others = rows.filter(function (row) {
        return row.quantity > 0 && skip.indexOf(String(row.email).toLowerCase()) === -1;
      }).sort(function (a, b) {
        return b.quantity - a.quantity || (firstName(a.email) < firstName(b.email) ? -1 : 1);
      });
      var listed = state.market && state.market.open ? state.market.open.filter(function (row) {
        return row.card_id === card.id;
      }).length : 0;
      if (!others.length && !listed) { dd.textContent = 'Nobody else'; return; }

      others.forEach(function (row) {
        var mine = String(row.email).toLowerCase() === viewer;
        var who = playerByEmail(row.email);
        var tag = el('span', 'ege-owner');
        if (who) {
          var face = el('img', 'ege-owner__face');
          face.src = who.headshot;
          face.alt = '';
          tag.appendChild(face);
        }
        tag.appendChild(el('span', null, mine ? 'You' : who ? who.first : row.email));
        tag.appendChild(el('b', 'ege-owner__n', '×' + row.quantity));
        dd.appendChild(tag);
      });
      if (listed) {
        var market = el('span', 'ege-owner ege-owner--market');
        market.appendChild(gem());
        market.appendChild(el('span', null, 'On the Market'));
        market.appendChild(el('b', 'ege-owner__n', '×' + listed));
        dd.appendChild(market);
      }
    });
  }

  /* Somebody else's card to the Trades page, with an offer to them for it
     already in the builder. From anywhere: off the Cards tab (a showcase on
     a player page) it goes there first and the builder opens once the
     cards are in. */
  var pendingAsk = null;

  function tradeFor(email, card) {
    closeRip();
    var player = EGE.auth.currentPlayer();
    if (!player) { return; }
    var ask = { to: email, take: [card.id] };
    if (/^#cards(\/|$)/.test(window.location.hash) && state.player === player && state.loaded && !state.hold) {
      setTab('trades');
      openTradeBuilder(ask);
      return;
    }
    pendingAsk = ask;
    window.location.hash = '#cards/trades';
  }

  /* --- a Player Card up close -------------------------------------------- */

  /* Off a showcase, the way a card opens up close: the Player Card as big
     as a card is up close, and under it what it stands for -- whose it is,
     its rank and what that pays, the points behind it, how far it is to
     the next rank and what it has earned. `pc` comes with `earned` and
     `photo` on it (js/showcase.js); `whose` is the owner's first name, left
     off for your own. */
  function zoomPlayer(pc, options) {
    var opts = options || {};
    var player = pc.player;
    var rank = pc.rank;
    var stage = openOverlay(player.name, 'ege-rip__stage--zoom');

    var row = el('div', 'ege-rip__cards ege-rip__cards--1');
    var holder = el('div', 'ege-zoom__card');
    holder.appendChild(playerCardFace(pc, pc.earned, pc.photo || null));
    row.appendChild(holder);
    stage.appendChild(row);

    var facts = el('dl', 'ege-zoom__facts');
    function fact(label, value) {
      facts.appendChild(el('dt', null, label));
      return facts.appendChild(el('dd', null, value));
    }
    fact('Whose', opts.whose ? opts.whose + '’s Player Card' : 'Your Player Card');
    fact('Rank', rank
      ? rank.name + (rank.bonus ? ' · +' + pctText(rank.bonus) + ' of his game diamonds' : ' · no bonus until Uncommon')
      : 'Unranked');
    fact('Points', whole(pc.points) + ' FPTS from ' + pc.copies + (pc.copies === 1 ? ' card' : ' cards') +
      ' · ' + pc.distinct + ' different');
    var next = rank ? pc.next : pc.ladder[1];
    fact('Next rank', next
      ? whole(Math.max(0, Math.ceil(next.points - pc.points))) + ' more FPTS to ' + next.name +
        ' (' + whole(next.points) + '), which pays +' + pctText(next.bonus)
      : 'Iconic. As high as it goes.');
    if (pc.earned !== null && pc.earned !== undefined) {
      var earned = fact('Earned', whole(pc.earned));
      earned.appendChild(gem());
      earned.appendChild(document.createTextNode(' from his games, every season'));
    }
    var about = rank && rank.bonus ? typicalBonus(player, rank.key) : null;
    if (about !== null) { fact('A game', 'About ' + about + ' diamonds on each of his games'); }
    stage.appendChild(facts);

    var actions = el('div', 'ege-rip__actions');
    var done = el('button', 'fb-btn fb-btn--primary', 'Done');
    done.type = 'button';
    done.addEventListener('click', closeRip);
    actions.appendChild(done);
    stage.appendChild(actions);
    done.focus({ preventScroll: true });
  }

  /* Sell, beside Quick sell under a card of your own up close: puts it on
     the Market at a price you pick, the same as the Market's own Sell
     button. The first tap opens the price; Put it up lists it. Greyed out
     once the day's listings (EGE.cards.MARKET.perDay) are used. */
  function marketControl(card, parts) {
    var wrap = el('span', 'ege-zoom__market');
    var left = state.market ? listingsLeft() : 0;
    var button = el('button', 'fb-btn ege-zoom__list', 'Sell');
    button.type = 'button';
    button.disabled = !left;
    button.title = !state.market ? 'The Market could not be loaded.'
      : left ? left + ' of ' + EGE.cards.MARKET.perDay + ' listings left today'
      : 'You have used your ' + EGE.cards.MARKET.perDay + ' listings for today.';
    wrap.appendChild(button);

    button.addEventListener('click', function () {
      wrap.innerHTML = '';
      var input = el('input', 'fb-input ege-zoom__price');
      input.type = 'number';
      input.min = String(EGE.cards.MARKET.minPrice);
      input.max = String(EGE.cards.MARKET.maxPrice);
      input.step = '1';
      input.inputMode = 'numeric';
      input.value = String(EGE.cards.shopPrice(card.rarity) || 30);
      input.setAttribute('aria-label', 'Price in diamonds');
      var put = el('button', 'fb-btn ege-zoom__list', 'Put it up');
      put.type = 'button';
      wrap.appendChild(input);
      wrap.appendChild(gem());
      wrap.appendChild(put);
      parts.status.textContent = 'Your price, ' + EGE.cards.MARKET.minPrice + ' to ' +
        EGE.cards.MARKET.maxPrice + ' diamonds. ' + left + ' of ' + EGE.cards.MARKET.perDay +
        ' listings left today.';
      input.focus();

      function amount() {
        var n = Math.floor(Number(input.value));
        return n >= EGE.cards.MARKET.minPrice && n <= EGE.cards.MARKET.maxPrice ? n : 0;
      }
      input.addEventListener('input', function () { put.disabled = !amount(); });
      put.addEventListener('click', function () {
        var n = amount();
        if (!n) { return; }
        put.disabled = true;
        EGE.cardStore.listCard(card, n).then(function (res) {
          if (!res.ok) { parts.status.textContent = res.message; put.disabled = false; return; }
          closeRip();
          say('', false);
          if (EGE.showcase) { EGE.showcase.forget(); }
          refresh();
        });
      });
    });
    return wrap;
  }

  /* --- holos ---------------------------------------------------------------

     Three copies of a card merge into one holographic copy of it, with all
     three cards' fantasy points on it, for good (EGE.cards.HOLO_OF and
     merge_holo_card in supabase/schema.sql). Two taps, like a quick sale:
     the first says what it does and that it cannot be undone, the second
     merges. The holo then comes out face down, the way a pull does, and
     turns over. */
  function mergeControl(card, parts) {
    var worth = points(card.points * EGE.cards.HOLO_OF);
    var button = el('button', 'fb-btn ege-zoom__merge');
    button.type = 'button';
    var armed = false;
    var timer = null;

    function disarm() {
      armed = false;
      button.classList.remove('is-armed');
      button.textContent = 'Merge 3 into a Holo';
    }
    disarm();

    button.addEventListener('click', function () {
      if (!armed) {
        armed = true;
        button.classList.add('is-armed');
        button.textContent = 'Tap again to merge for good';
        parts.status.textContent = 'Merging takes 3 of your copies and makes one holographic ' +
          card.player.first + ' card with all of their points, ' + worth + ' FPTS. It cannot be undone.';
        timer = window.setTimeout(disarm, 6000);
        return;
      }
      window.clearTimeout(timer);
      button.disabled = true;

      EGE.cardStore.mergeHolo(card).then(function (res) {
        button.disabled = false;
        disarm();
        if (!res.ok || !res.holo) { parts.status.textContent = res.message || 'That holo could not be made.'; return; }
        var isNew = !state.owned[res.holo.id];
        /* Like a pull: out of the collection until it is turned over and
           put away. */
        state.hold = true;
        closeRip();
        if (EGE.showcase) { EGE.showcase.forget(); }
        openRip({ title: 'Holo made', cards: [res.holo], isNew: [isNew],
                  extras: ['Three ' + card.player.first + ' cards merged into one, ' + worth + ' FPTS'],
                  onClose: function () { reveal([res.holo], [isNew]); } });
      });
    });
    return button;
  }

  /* Up close, a holo leans toward the pointer and its foil follows it. */
  function tiltHolo(holder) {
    if (reducedMotion()) { return; }
    holder.classList.add('is-tilting');
    holder.addEventListener('pointermove', function (e) {
      var box = holder.getBoundingClientRect();
      var x = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width));
      var y = Math.min(1, Math.max(0, (e.clientY - box.top) / box.height));
      holder.style.setProperty('--mx', Math.round(x * 100) + '%');
      holder.style.setProperty('--my', Math.round(y * 100) + '%');
      holder.style.setProperty('--tx', ((0.5 - y) * 10).toFixed(2) + 'deg');
      holder.style.setProperty('--ty', ((x - 0.5) * 12).toFixed(2) + 'deg');
    });
    holder.addEventListener('pointerleave', function () {
      ['--mx', '--my', '--tx', '--ty'].forEach(function (k) { holder.style.removeProperty(k); });
    });
  }

  /* --- quick selling -----------------------------------------------------

     One copy of a card from your own collection back for a few diamonds,
     by rarity (EGE.cards.QUICK_SELL). Two taps: the first says what it
     pays, the second sells, so a stray tap never costs anybody a card. An
     Iconic gets a line saying it cannot be sold instead of a button. */
  function sellControl(card, parts) {
    var pays = EGE.cards.sellPrice(card);
    if (!pays) { return el('span', 'ege-zoom__nosell', 'Iconic cards cannot be quick sold.'); }

    var button = el('button', 'fb-btn ege-zoom__sell');
    button.type = 'button';
    var armed = false;
    var timer = null;

    function label(text) {
      button.innerHTML = '';
      button.appendChild(document.createTextNode(text));
      button.appendChild(price(pays));
    }
    function disarm() {
      armed = false;
      button.classList.remove('is-armed');
      label('Quick sell \u00b7 ');
    }
    disarm();

    button.addEventListener('click', function () {
      if (!armed) {
        armed = true;
        button.classList.add('is-armed');
        label('Tap again to sell \u00b7 ');
        parts.status.textContent = '';
        timer = window.setTimeout(disarm, 4000);
        return;
      }
      window.clearTimeout(timer);
      button.disabled = true;

      EGE.cardStore.quickSell(card).then(function (res) {
        button.disabled = false;
        disarm();
        if (!res.ok) { parts.status.textContent = res.message; return; }

        /* Taken off here straight away, so the binder behind is right
           before the refresh comes back with the same thing. */
        var left = Math.max(0, (state.owned[card.id] || 0) - 1);
        if (left) {
          state.owned[card.id] = left;
        } else {
          delete state.owned[card.id];
          delete state.first[card.id];
          delete state.fresh[card.id];
        }
        walletChanged(null, res.diamonds);
        renderPacks();

        if (parts.owned) { parts.owned.textContent = String(left); }
        if (parts.merge && left < EGE.cards.HOLO_OF) { parts.merge.hidden = true; }
        parts.status.textContent = 'Sold for ' + pays + (pays === 1 ? ' diamond. ' : ' diamonds. ') +
          (left ? 'You have ' + left + ' left.' : 'That was your last one.');
        if (!left) {
          button.hidden = true;
          parts.holder.classList.add('is-sold');
        }
        if (EGE.showcase) { EGE.showcase.forget(); }
        refresh();
      });
    });
    return button;
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && rip) { closeRip(); }
  });

  /* --- the collection --------------------------------------------------- */

  function chip(label, active, onPick) {
    var b = el('button', 'fb-chip' + (active ? ' is-active' : ''), label);
    b.type = 'button';
    b.setAttribute('aria-pressed', active ? 'true' : 'false');
    b.addEventListener('click', onPick);
    return b;
  }

  function pick(key, value) {
    state.filter[key] = value;
    renderFilters();
    renderCollection();
  }

  /* Whose collection the binder shows. Anybody signed in can read anybody's
     cards (a trade is picking from somebody else's), so somebody else's is
     read when it is picked and again on every refresh. */
  function pickView(email) {
    if (email && state.sell) { sellMode(false); }
    state.view = email || null;
    state.other = null;
    renderFilters();
    renderCollection();
    loadOther();
  }

  function loadOther() {
    var email = state.view;
    if (!email) { return Promise.resolve(); }
    return EGE.cardStore.collectionFor(email).then(function (got) {
      if (state.view !== email) { return; }
      state.other = got || { owned: {}, first: {}, failed: true };
      if (!state.hold) { renderCollection(); }
    });
  }

  /* The collection the binder is showing: yours, or the one picked. */
  function viewed() {
    if (!state.view) {
      return { mine: true, owned: state.owned, first: state.first, loaded: state.loaded };
    }
    var other = state.other;
    return { mine: false, name: firstName(state.view), owned: other ? other.owned : {},
             first: other ? other.first : {}, loaded: Boolean(other), failed: Boolean(other && other.failed) };
  }

  function renderFilters() {
    var bar = byId('collectionFilters');
    bar.innerHTML = '';
    var f = state.filter;

    /* One line: the kinds as buttons the height of the drop-downs beside
       them, then whose, who, the order, and the rarity (holos last in it). */
    var rest = el('div', 'ege-filterrow');
    [['all', 'All'], ['performance', 'Performances'], ['play', 'Plays']].forEach(function (k) {
      var b = chip(k[1], f.kind === k[0], function () { pick('kind', k[0]); });
      b.classList.add('ege-filterchip');
      rest.appendChild(b);
    });

    var whose = el('select', 'fb-select ege-filterselect');
    whose.setAttribute('aria-label', 'Whose collection');
    whose.appendChild(new Option('My collection', ''));
    partners().forEach(function (p) { whose.appendChild(new Option(p.first + '’s collection', p.email)); });
    whose.value = state.view || '';
    whose.addEventListener('change', function () { pickView(whose.value); });
    rest.appendChild(whose);

    var who = el('select', 'fb-select ege-filterselect');
    who.setAttribute('aria-label', 'Player');
    who.appendChild(new Option('Every player', 'all'));
    EGE.players.forEach(function (p) { who.appendChild(new Option(p.name, p.slug)); });
    who.value = f.player;
    who.addEventListener('change', function () { pick('player', who.value); });
    rest.appendChild(who);

    var sort = el('select', 'fb-select ege-filterselect');
    sort.setAttribute('aria-label', 'Sort');
    [['rarity', 'Rarest first'], ['points', 'Highest score'], ['newest', 'Newest pulls'],
     ['year', 'By year'], ['game', 'By game']]
      .forEach(function (s) { sort.appendChild(new Option(s[1], s[0])); });
    sort.value = f.sort;
    sort.addEventListener('change', function () { pick('sort', sort.value); });
    rest.appendChild(sort);

    var rarity = el('select', 'fb-select ege-filterselect');
    rarity.setAttribute('aria-label', 'Rarity');
    rarity.appendChild(new Option('All rarities', 'all'));
    EGE.cards.RARITIES.forEach(function (r) { rarity.appendChild(new Option(r.name, r.key)); });
    rarity.appendChild(new Option('Holo', 'holo'));
    rarity.value = f.rarity;
    rarity.addEventListener('change', function () { pick('rarity', rarity.value); });
    rest.appendChild(rarity);

    /* Last, a bin that puts every one of them back: all cards, my
       collection, every player, rarest first. */
    var f0 = DEFAULT_FILTER;
    var changed = Boolean(state.view) || Object.keys(f0).some(function (k) { return f[k] !== f0[k]; });
    var clear = el('button', 'fb-btn ege-filterclear');
    clear.type = 'button';
    clear.title = 'Reset the filters and sort';
    clear.setAttribute('aria-label', 'Reset the filters and sort');
    clear.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">' +
      '<path fill="currentColor" d="M9 3h6l1 2h4v2H4V5h4l1-2zm-3 6h12l-1 12H7L6 9zm4 2v8h2v-8h-2zm4 0v8h2v-8h-2z"/></svg>';
    clear.disabled = !changed;
    clear.addEventListener('click', function () {
      state.filter = Object.assign({}, DEFAULT_FILTER);
      if (state.view) { pickView(null); return; }
      renderFilters();
      renderCollection();
    });
    rest.appendChild(clear);
    /* Beside the bin, Quick sell: picks cards out of the binder to sell
       together. On a phone it sits beside the Sort button instead, since
       the bin is in the menu there. */
    rest.appendChild(sellButton(''));

    /* On a phone the whole row folds into a menu behind one Sort button
       (with a count of what is changed from the defaults), so the binder
       starts near the top. It stays open while things are picked, and Done,
       a tap outside it or Escape closes it. On a desktop the row is always
       out and the button is hidden. */
    var changes = (state.view ? 1 : 0) +
      Object.keys(f0).filter(function (k) { return f[k] !== f0[k]; }).length;
    var toggle = el('button', 'fb-btn ege-filtertoggle');
    toggle.type = 'button';
    toggle.setAttribute('aria-controls', 'collectionFilterMenu');
    toggle.setAttribute('aria-expanded', state.filtersOpen ? 'true' : 'false');
    toggle.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">' +
      '<path fill="currentColor" d="M3 6h11v2H3V6zm15 0h3v2h-3v2h-2V4h2v2zM3 16h3v-2h2v6H6v-2H3v-2zm7 0h11v2H10v-2z"/></svg>' +
      '<span>Sort</span>' + (changes ? '<b class="ege-filtertoggle__count">' + changes + '</b>' : '');
    toggle.addEventListener('click', function () { openFilters(!state.filtersOpen); });
    bar.appendChild(toggle);
    bar.appendChild(sellButton('ege-filtersell--phone'));

    var done = el('button', 'fb-btn fb-btn--primary ege-filterdone', 'Done');
    done.type = 'button';
    done.addEventListener('click', function () { openFilters(false); });
    rest.appendChild(done);

    rest.id = 'collectionFilterMenu';
    bar.classList.toggle('is-open', Boolean(state.filtersOpen));
    bar.appendChild(rest);
  }

  /* The Quick sell button: into picking cards to sell, or back out. Only
     your own collection can be sold from. */
  function sellButton(modifier) {
    var b = el('button', 'fb-btn ege-filtersell' + (modifier ? ' ' + modifier : '') + (state.sell ? ' is-on' : ''));
    b.type = 'button';
    /* A price tag, the size of the bin beside it; the words only where
       there is room for them (a phone). */
    b.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">' +
      '<path fill="currentColor" d="M21.4 11.6l-9-9A2 2 0 0 0 11 2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 .6 1.4l9 9a2 2 0 0 0 2.8 0l7-7a2 2 0 0 0 0-2.8zM6.5 8A1.5 1.5 0 1 1 6.5 5a1.5 1.5 0 0 1 0 3z"/></svg>';
    b.appendChild(el('span', 'ege-filtersell__word', 'Quick sell'));
    b.setAttribute('aria-label', 'Quick sell several cards');
    b.setAttribute('aria-pressed', state.sell ? 'true' : 'false');
    b.disabled = Boolean(state.view) || !state.loaded || Boolean(state.sell && state.sell.busy);
    b.title = state.view ? 'Only your own cards can be quick sold.' : 'Quick sell: pick cards to sell together';
    b.addEventListener('click', function () {
      if (state.filtersOpen) { openFilters(false); }
      sellMode(!state.sell);
    });
    return b;
  }

  function openFilters(open) {
    state.filtersOpen = open;
    var bar = byId('collectionFilters');
    bar.classList.toggle('is-open', open);
    var toggle = bar.querySelector('.ege-filtertoggle');
    if (toggle) { toggle.setAttribute('aria-expanded', open ? 'true' : 'false'); }
  }

  /* `first` is when each card was first pulled, for Newest pulls. */
  function sorter(how, first) {
    if (how === 'points') {
      return function (a, b) { return b.points - a.points || EGE.cards.compare(a, b); };
    }
    if (how === 'newest') {
      return function (a, b) {
        var x = first[a.id] || '';
        var y = first[b.id] || '';
        return x < y ? 1 : x > y ? -1 : EGE.cards.compare(a, b);
      };
    }
    /* The newest season first, rarest first inside it. The binder puts the
       year above each one. */
    if (how === 'year') {
      return function (a, b) { return b.season - a.season || EGE.cards.compare(a, b); };
    }
    if (how === 'game') {
      return function (a, b) {
        return b.season - a.season || b.week - a.week ||
          (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0) ||
          (a.kind === b.kind ? (a.id < b.id ? -1 : 1) : a.kind === 'performance' ? -1 : 1);
      };
    }
    return EGE.cards.compare;
  }

  function renderCollection() {
    var grid = byId('collectionGrid');
    var f = state.filter;
    var v = viewed();

    var mine = Object.keys(v.owned).map(EGE.cards.byId).filter(Boolean);
    var shown = mine.filter(function (card) {
      return (f.rarity === 'all' || (f.rarity === 'holo' ? card.holo : card.rarity === f.rarity)) &&
        (f.kind === 'all' || card.kind === f.kind) &&
        (f.player === 'all' || card.slug === f.player);
    }).sort(sorter(f.sort, v.first));

    fillBinder(grid, shown, v);

    byId('collectionTitle').textContent = v.mine ? 'Your Collection' : v.name + '’s Collection';

    var copies = Object.keys(v.owned).reduce(function (sum, id) { return sum + v.owned[id]; }, 0);
    var out = EGE.cards.pullable(null).length;
    /* A holo and its card are one card of the ones out. */
    var different = {};
    var holos = 0;
    mine.forEach(function (card) {
      different[card.baseId || card.id] = true;
      if (card.holo) { holos += v.owned[card.id]; }
    });
    byId('collectionCount').textContent = v.loaded && !v.failed
      ? copies + (copies === 1 ? ' card' : ' cards') + ' · ' + Object.keys(different).length + ' of ' + out +
        ' different' + (holos ? ' · ' + holos + ' holo' : '')
      : v.failed ? '' : 'Loading…';


    var empty = byId('collectionEmpty');
    empty.hidden = !v.loaded || shown.length > 0;
    if (v.mine) {
      empty.textContent = mine.length
        ? (f.rarity === 'holo' && !holos
          ? 'No holos yet. Get three of one card, then open it and merge them.'
          : 'Nothing you own matches that. Try another filter.')
        : 'No cards yet. Rip a pack and they land here.';
    } else {
      empty.textContent = v.failed ? v.name + '’s cards could not be loaded.'
        : mine.length ? 'Nothing of ' + v.name + '’s matches that. Try another filter.'
        : v.name + ' has no cards yet.';
    }
  }

  /* --- the binder, a few rows at a time -----------------------------------

     The Cards page is the binder and nothing else, so it is the page that
     scrolls rather than a box inside it: wherever the pointer is, the wheel
     moves the collection. Drawing every card at once is a lot of foil for a
     phone to run, so the binder draws its first few rows and adds more as
     it is scrolled: an empty marker sits after the last card drawn, and
     when it comes within a couple of rows of the bottom of the screen the
     next rows go in. Drawing
     the same view again -- after a sale, a pack, a refresh -- keeps as many
     cards as were drawn and the place it was scrolled to. */
  var binder = { key: null, sig: null, cards: [], view: null, drawn: 0, season: null, marker: null, watch: null };

  /* How many cards fit across, read off the grid itself. */
  function perRow(grid) {
    var cols = window.getComputedStyle(grid).gridTemplateColumns;
    var n = cols && cols !== 'none' ? cols.trim().split(/\s+/).length : 0;
    return n || 5;
  }

  function fillBinder(grid, cards, v) {
    var f = state.filter;
    var key = [state.view || '', f.kind, f.player, f.sort, f.rarity].join('|');
    /* The binder as it stands, card for card. Coming back to the page, or a
       refresh that changed nothing, used to throw every card away and draw
       it again -- the lag going back to Cards, worse the further it had
       been scrolled. The same binder is left as it is. */
    var sig = key + '#' + cards.map(function (card) {
      return card.id + 'x' + (v.owned[card.id] || 0) + (v.mine && state.fresh[card.id] ? 'n' : '');
    }).join(',');
    if (sig === binder.sig && grid.childElementCount) { return; }
    binder.sig = sig;
    var same = key === binder.key;
    var keep = same ? binder.drawn : 0;

    if (binder.watch && binder.marker) { binder.watch.unobserve(binder.marker); }
    grid.innerHTML = '';
    binder.key = key;
    binder.cards = cards;
    binder.view = v;
    binder.drawn = 0;
    binder.season = null;

    drawMore(grid, Math.max(keep, perRow(grid) * 4));
  }

  function drawMore(grid, count) {
    var v = binder.view;
    var byYear = state.filter.sort === 'year';
    var upto = Math.min(binder.cards.length, binder.drawn + count);
    var batch = document.createDocumentFragment();

    for (var i = binder.drawn; i < upto; i += 1) {
      var card = binder.cards[i];
      if (byYear && card.season !== binder.season) {
        binder.season = card.season;
        batch.appendChild(el('h4', 'ege-binder__year', String(card.season)));
      }
      batch.appendChild(binderCard(card, v));
    }
    binder.drawn = upto;

    if (binder.marker) { binder.marker.remove(); }
    grid.appendChild(batch);
    if (binder.drawn < binder.cards.length) { watchEnd(grid); }
  }

  function watchEnd(grid) {
    if (!window.IntersectionObserver) { drawMore(grid, binder.cards.length); return; }
    if (!binder.marker) {
      binder.marker = el('div', 'ege-binder__more');
      binder.marker.setAttribute('aria-hidden', 'true');
    }
    if (!binder.watch) {
      binder.watch = new window.IntersectionObserver(function (entries) {
        var near = entries.some(function (e) { return e.isIntersecting && e.target === binder.marker; });
        if (near && binder.marker.isConnected) { drawMore(grid, perRow(grid) * 3); }
      }, { rootMargin: '0px 0px 600px 0px' });
    }
    grid.appendChild(binder.marker);
    /* Watched afresh each time it moves, so it is checked again straight
       away: still in reach means another few rows. */
    binder.watch.unobserve(binder.marker);
    binder.watch.observe(binder.marker);
  }

  function binderCard(card, v) {
    var count = v.owned[card.id] || 0;
    var node = cardEl(card, { count: count, isNew: v.mine && state.fresh[card.id],
                              mergeable: v.mine && !card.holo && count >= EGE.cards.HOLO_OF });
    node.dataset.id = card.id;
    pressable(node, describe(card) + (count > 1 ? ', ' + count + ' owned' : ''), function () {
      if (v.mine && state.sell) {
        pickForSale(card);
      } else if (v.mine) {
        zoom(card, { owned: state.owned[card.id] || 0, sell: true });
      } else {
        zoom(card, { owned: state.owned[card.id] || 0, tradeWith: state.view,
                     theirs: { name: v.name, email: state.view,
                               count: (state.other && state.other.owned[card.id]) || 0 } });
      }
    });
    if (v.mine && state.sell) { saleMarks(node, card); }
    return node;
  }

  /* --- quick selling a group ------------------------------------------------

     Quick sell, beside the bin over the binder, turns the binder into a
     picker (Sam, 2026-10-16): a tap picks a card to sell or puts it back,
     and a card held more than once gets − and + for how many of it go. A
     bar over the page buttons keeps the count and what it all pays, with
     Extras to pick every copy past the first of the cards showing. Selling
     is two taps like a single quick sale, and goes one copy at a time
     through quick_sell_card, so a refusal stops there and leaves the rest
     picked. Iconic cards cannot be picked. Nothing in the background
     redraws the binder while it is on (busy()). */
  function sellMode(on) {
    if (on && (state.view || !state.loaded)) { return; }
    if (!on && state.sell && state.sell.busy) { return; }
    state.sell = on ? { picked: {}, armed: false, busy: false, note: '', timer: null } : null;
    byId('collectionPanel').classList.toggle('is-selling', Boolean(on));
    renderFilters();
    markBinder();
    drawSellBar();
  }

  function pickForSale(card) {
    var s = state.sell;
    if (!s || s.busy) { return; }
    disarmSale();
    if (!EGE.cards.sellPrice(card)) {
      s.note = 'Iconic cards cannot be quick sold.';
    } else if (s.picked[card.id]) {
      delete s.picked[card.id];
      s.note = '';
    } else if (state.owned[card.id]) {
      s.picked[card.id] = 1;
      s.note = '';
    }
    markBinder(card.id);
    drawSellBar();
  }

  function stepSale(card, by) {
    var s = state.sell;
    if (!s || s.busy) { return; }
    disarmSale();
    var n = Math.min(state.owned[card.id] || 0, (s.picked[card.id] || 0) + by);
    if (n > 0) { s.picked[card.id] = n; } else { delete s.picked[card.id]; }
    s.note = '';
    markBinder(card.id);
    drawSellBar();
  }

  /* A card's look while picking: red round it when picked, with how many
     of it go and the − and + to change that when there is more than one. */
  function saleMarks(node, card) {
    var old = node.querySelector('.ege-salepick');
    if (old) { old.remove(); }
    var s = state.sell;
    var n = s ? s.picked[card.id] || 0 : 0;
    node.classList.toggle('is-picked', n > 0);
    node.classList.toggle('is-nosell', Boolean(s) && !EGE.cards.sellPrice(card));
    if (s) { node.setAttribute('aria-pressed', n ? 'true' : 'false'); } else { node.removeAttribute('aria-pressed'); }
    if (!n) { return; }

    var owned = state.owned[card.id] || 0;
    var box = el('span', 'ege-salepick');
    box.appendChild(el('b', 'ege-salepick__tag', 'Sell'));
    if (owned > 1) {
      var step = el('span', 'ege-salepick__step');
      [['−', -1, 'One fewer'], [n + ' of ' + owned, 0, ''], ['+', 1, 'One more']].forEach(function (part) {
        if (!part[1]) { step.appendChild(el('span', 'ege-salepick__n', part[0])); return; }
        var b = el('button', 'ege-salepick__btn', part[0]);
        b.type = 'button';
        b.setAttribute('aria-label', part[2] + ' ' + card.player.first + ' card to sell');
        b.disabled = part[1] > 0 ? n >= owned : false;
        /* Not the card's own tap, which would put it back altogether. */
        b.addEventListener('click', function (e) { e.stopPropagation(); stepSale(card, part[1]); });
        b.addEventListener('keydown', function (e) { e.stopPropagation(); });
        step.appendChild(b);
      });
      box.appendChild(step);
    }
    node.appendChild(box);
  }

  /* Every card drawn in the binder, or just those of `id`. */
  function markBinder(id) {
    if (state.view) { return; }
    Array.prototype.forEach.call(byId('collectionGrid').querySelectorAll('.ege-tcard[data-id]'), function (node) {
      if (id && node.dataset.id !== id) { return; }
      var card = EGE.cards.byId(node.dataset.id);
      if (card) { saleMarks(node, card); }
    });
  }

  function saleTotals() {
    var s = state.sell;
    var copies = 0;
    var pays = 0;
    Object.keys(s ? s.picked : {}).forEach(function (id) {
      var card = EGE.cards.byId(id);
      if (!card) { return; }
      copies += s.picked[id];
      pays += (EGE.cards.sellPrice(card) || 0) * s.picked[id];
    });
    return { copies: copies, pays: pays };
  }

  function disarmSale() {
    var s = state.sell;
    if (!s || !s.armed) { return; }
    window.clearTimeout(s.timer);
    s.armed = false;
  }

  /* The bar along the foot of the page while picking. */
  function drawSellBar() {
    var bar = byId('sellBar');
    if (!bar) {
      bar = el('div', 'ege-sellbar');
      bar.id = 'sellBar';
      bar.setAttribute('role', 'region');
      bar.setAttribute('aria-label', 'Quick sell');
      byId('cardPageCards').appendChild(bar);
    }
    var s = state.sell;
    bar.hidden = !s;
    bar.innerHTML = '';
    if (!s) { return; }
    var t = saleTotals();

    var text = el('p', 'ege-sellbar__text');
    text.setAttribute('role', 'status');
    if (s.note) {
      text.textContent = s.note;
    } else if (t.copies) {
      text.appendChild(el('strong', null, t.copies + (t.copies === 1 ? ' card' : ' cards')));
      text.appendChild(document.createTextNode(' picked · '));
      text.appendChild(price(t.pays));
    } else {
      text.textContent = 'Tap cards to pick them for a quick sale.';
    }
    bar.appendChild(text);

    var row = el('div', 'ege-sellbar__actions');
    var extras = el('button', 'fb-btn fb-btn--sm', 'Extras');
    extras.type = 'button';
    extras.title = 'Pick every copy past the first of the cards showing';
    extras.disabled = s.busy;
    extras.addEventListener('click', pickExtras);
    var out = el('button', 'fb-btn fb-btn--sm', t.copies ? 'Cancel' : 'Done');
    out.type = 'button';
    out.disabled = s.busy;
    out.addEventListener('click', function () { sellMode(false); });
    var go = el('button', 'fb-btn fb-btn--sm fb-btn--primary ege-sellbar__go' + (s.armed ? ' is-armed' : ''));
    go.type = 'button';
    go.appendChild(document.createTextNode(s.busy ? 'Selling…' : s.armed ? 'Tap again to sell · ' : 'Quick sell · '));
    if (!s.busy) { go.appendChild(price(t.pays)); }
    go.disabled = s.busy || !t.copies;
    go.addEventListener('click', function () {
      if (!s.armed) {
        s.armed = true;
        s.note = '';
        s.timer = window.setTimeout(function () {
          if (state.sell === s && s.armed && !s.busy) { s.armed = false; drawSellBar(); }
        }, 4000);
        drawSellBar();
        return;
      }
      disarmSale();
      sellGroup();
    });
    row.appendChild(extras);
    row.appendChild(out);
    row.appendChild(go);
    bar.appendChild(row);
  }

  /* Every copy past the first of each card the binder is showing, as it
     is filtered; Iconic left out. */
  function pickExtras() {
    var s = state.sell;
    if (!s || s.busy) { return; }
    disarmSale();
    var added = 0;
    binder.cards.forEach(function (card) {
      var extra = (state.owned[card.id] || 0) - 1;
      if (extra > 0 && EGE.cards.sellPrice(card) && (s.picked[card.id] || 0) < extra) {
        s.picked[card.id] = extra;
        added += 1;
      }
    });
    s.note = added || saleTotals().copies ? '' : 'No extras here: you have one of each of these.';
    markBinder();
    drawSellBar();
  }

  function sellGroup() {
    var s = state.sell;
    if (!s || s.busy) { return; }
    var queue = [];
    Object.keys(s.picked).forEach(function (id) {
      for (var i = 0; i < s.picked[id]; i += 1) { queue.push(id); }
    });
    if (!queue.length) { return; }
    var total = queue.length;
    var sold = 0;
    var got = 0;
    s.busy = true;
    s.note = 'Selling 1 of ' + total + '…';
    renderFilters();
    drawSellBar();

    function next() {
      var id = queue.shift();
      if (!id) { return finish(''); }
      var card = EGE.cards.byId(id);
      EGE.cardStore.quickSell(card).then(function (res) {
        if (!res.ok) { return finish(res.message); }
        sold += 1;
        got += res.price;
        if (s.picked[id] > 1) { s.picked[id] -= 1; } else { delete s.picked[id]; }
        var left = Math.max(0, (state.owned[id] || 0) - 1);
        if (left) {
          state.owned[id] = left;
        } else {
          delete state.owned[id];
          delete state.first[id];
          delete state.fresh[id];
        }
        walletChanged(null, res.diamonds);
        if (queue.length) {
          s.note = 'Selling ' + (sold + 1) + ' of ' + total + '…';
          drawSellBar();
        }
        next();
      });
    }

    function finish(problem) {
      s.busy = false;
      s.armed = false;
      var did = sold ? 'Sold ' + sold + (sold === 1 ? ' card' : ' cards') + ' for ' + got +
        (got === 1 ? ' diamond.' : ' diamonds.') : '';
      s.note = problem ? (did ? did + ' The next one did not go: ' : '') + problem : did;
      if (sold) {
        if (EGE.showcase) { EGE.showcase.forget(); }
        renderPacks();
        renderCollection();
        refresh();
      }
      if (state.sell === s) {
        renderFilters();
        markBinder();
        drawSellBar();
      }
    }

    next();
  }

  /* --- recent pulls -------------------------------------------------------

     The last packs anybody opened, newest first, with who opened them:
     four to a page, and Show more goes back three times, sixteen in all.
     Read through recent_card_opens, since card_packs is only readable by
     its owner. Like the collection, held back while a pack is open. */
  var RECENT_STEP = 4;
  var RECENT_MAX = 16;

  function pulls() {
    return (state.recent || []).map(function (row) {
      /* A pack won on the daily spin is spin-{pack}. */
      var spun = /^spin-/.test(row.pack_key || '');
      var pack = EGE.cards.pack(spun ? row.pack_key.slice(5) : row.pack_key);
      var cards = EGE.cards.packOrder((row.cards || []).map(EGE.cards.byId).filter(Boolean));
      return { title: (spun ? 'Daily Spin \u00b7 ' : '') + (pack ? pack.name : 'Pack'),
               email: row.email, when: row.opened_at, cards: cards };
    }).slice(0, RECENT_MAX);
  }

  function agoText(iso) {
    var then = new Date(iso).getTime();
    if (isNaN(then)) { return ''; }
    var mins = Math.floor((Date.now() - then) / 60000);
    if (mins < 1) { return 'Just now'; }
    if (mins < 60) { return mins + ' min ago'; }
    var hours = Math.floor(mins / 60);
    if (hours < 24) { return hours + (hours === 1 ? ' hour ago' : ' hours ago'); }
    return whenText(iso);
  }

  function renderRecent() {
    var holder = byId('recentList');
    holder.innerHTML = '';
    var list = pulls();

    list.slice(0, state.recentShown).forEach(function (pull) {
      var tile = el('article', 'ege-pull');
      var head = el('div', 'ege-pull__head');
      var opener = playerByEmail(pull.email);
      var mine = String(pull.email || '').toLowerCase() === me();
      var who = el('div', 'ege-pull__who');
      if (opener) {
        var face = el('img', 'ege-avatar ege-avatar--sm');
        face.src = opener.headshot;
        face.alt = '';
        who.appendChild(face);
      }
      who.appendChild(el('strong', 'ege-pull__title',
        (mine ? 'You' : opener ? opener.first : 'Somebody') + ' \u00b7 ' + pull.title));
      head.appendChild(who);
      head.appendChild(el('span', 'fb-meta', agoText(pull.when)));
      tile.appendChild(head);

      var strip = el('div', 'ege-pull__cards');
      pull.cards.forEach(function (card) {
        var have = state.owned[card.id] || 0;
        var node = cardEl(card, {});
        if (mine && !have) { node.classList.add('is-gone'); }
        pressable(node, describe(card) + (mine && !have ? ', no longer in your collection' : ''), function () {
          zoom(card, { owned: state.owned[card.id] || 0, sell: mine, tradeWith: mine ? null : pull.email });
        });
        strip.appendChild(node);
      });
      tile.appendChild(strip);
      holder.appendChild(tile);
    });

    if (!list.length) {
      holder.appendChild(el('p', 'fb-meta', state.recent === null
        ? (state.loaded ? 'The recent pulls could not be loaded.' : 'Loading\u2026')
        : 'Nobody has opened a pack yet.'));
    }

    byId('recentMore').hidden = list.length <= state.recentShown;
  }

  /* --- trades ----------------------------------------------------------- */

  var MAX_SIDE = 6;   /* the most cards either side of one offer; schema.sql agrees */

  function me() { return state.player ? state.player.email.toLowerCase() : ''; }

  function playerByEmail(email) {
    var e = String(email || '').toLowerCase();
    return EGE.players.filter(function (p) { return p.email && p.email.toLowerCase() === e; })[0] || null;
  }

  function firstName(email) {
    var p = playerByEmail(email);
    return p ? p.first : email;
  }

  /* Who there is to trade with: everybody else with an account. */
  function partners() {
    return EGE.playersWithAccounts().filter(function (p) { return p.email.toLowerCase() !== me(); });
  }

  function whenText(iso) {
    if (!iso) { return ''; }
    var d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  /* A row of cards, small, each one tappable to see it up close. */
  function cardStrip(ids, emptyText) {
    var strip = el('div', 'ege-trade__cards');
    var cards = (ids || []).map(EGE.cards.byId).filter(Boolean);
    if (!cards.length) {
      strip.appendChild(el('span', 'ege-trade__nothing', emptyText || 'Nothing'));
      return strip;
    }
    cards.forEach(function (card) {
      var node = cardEl(card, {});
      pressable(node, describe(card), function () { zoom(card, { owned: state.owned[card.id] || 0 }); });
      strip.appendChild(node);
    });
    return strip;
  }

  var STATUS_TEXT = { accepted: 'Done', declined: 'Declined', cancelled: 'Taken back', expired: 'Expired' };

  function tradeRow(t) {
    var mine = t.from_email.toLowerCase() === me();
    var other = mine ? t.to_email : t.from_email;
    var row = el('article', 'ege-trade ege-trade--' + t.status);

    var head = el('div', 'ege-trade__head');
    var who = el('div', 'ege-trade__who');
    var them = playerByEmail(other);
    if (them) {
      var face = el('img', 'ege-avatar ege-avatar--sm');
      face.src = them.headshot;
      face.alt = '';
      who.appendChild(face);
    }
    who.appendChild(el('strong', null, (mine ? 'To ' : 'From ') + (them ? them.name : other)));
    who.appendChild(el('span', 'fb-meta', whenText(t.created_at)));
    if (t.status === 'open' && !mine && (isNewTrade(t) || state.newTrades[t.id])) {
      who.appendChild(el('span', 'ege-trade__new', 'New'));
    }
    head.appendChild(who);
    if (t.status !== 'open') {
      head.appendChild(el('span', 'fb-tag' + (t.status === 'accepted' ? ' fb-tag--sage' : ' fb-tag--outline'),
        STATUS_TEXT[t.status] || t.status));
    }
    row.appendChild(head);

    /* Always from the reader's side: what you give, what you get. */
    var youGive = mine ? t.give : t.take;
    var youGet = mine ? t.take : t.give;
    var sides = el('div', 'ege-trade__sides');
    var give = el('div', 'ege-trade__side');
    give.appendChild(el('span', 'ege-trade__label', 'You give'));
    give.appendChild(cardStrip(youGive, 'Nothing \u2014 a gift to you'));
    var get = el('div', 'ege-trade__side');
    get.appendChild(el('span', 'ege-trade__label', 'You get'));
    get.appendChild(cardStrip(youGet, mine ? 'Nothing \u2014 a gift from you' : 'Nothing'));
    sides.appendChild(give);
    sides.appendChild(el('span', 'ege-trade__swap', '\u21c4'));
    sides.appendChild(get);
    row.appendChild(sides);

    if (t.status === 'open') {
      var actions = el('div', 'fb-row fb-row--wrap ege-trade__actions');
      if (mine) {
        actions.appendChild(el('span', 'fb-meta', 'Waiting on ' + firstName(other) + '.'));
        actions.appendChild(actionButton('Take it back', '', function (b) { answer(t, 'cancel', b); }));
      } else {
        actions.appendChild(actionButton('Accept', 'fb-btn--primary', function (b) { answer(t, 'accept', b); }));
        actions.appendChild(actionButton('Decline', '', function (b) { answer(t, 'decline', b); }));
      }
      row.appendChild(actions);
    }
    return row;
  }

  function actionButton(label, modifier, onClick) {
    var b = el('button', 'fb-btn fb-btn--sm ' + (modifier || ''), label);
    b.type = 'button';
    b.addEventListener('click', function () { onClick(b); });
    return b;
  }

  function answer(t, what, button) {
    button.disabled = true;
    say('', false);
    var call = what === 'cancel' ? EGE.cardStore.cancelTrade(t.id)
      : EGE.cardStore.respondTrade(t.id, what === 'accept');

    call.then(function (res) {
      if (!res.ok) { say(res.message, true); button.disabled = false; return; }
      if (res.status === 'expired') {
        say('That trade cannot go through any more: one of you no longer has a card it was for.', true);
      }
      if (EGE.showcase) { EGE.showcase.forget(); }
      refresh();
    });
  }

  function renderTrades() {
    var holder = byId('tradeList');
    holder.innerHTML = '';
    var trades = state.trades;

    var incoming = trades.filter(function (t) { return t.status === 'open' && t.to_email.toLowerCase() === me(); });
    var outgoing = trades.filter(function (t) { return t.status === 'open' && t.from_email.toLowerCase() === me(); });
    var done = trades.filter(function (t) { return t.status !== 'open'; }).slice(0, 6);

    [['Offers to you', incoming], ['Your offers', outgoing], ['Recent', done]].forEach(function (group) {
      if (!group[1].length) { return; }
      var section = el('section', 'ege-library__group');
      section.appendChild(el('h4', 'ege-library__title', group[0]));
      var list = el('div', 'ege-trades');
      group[1].forEach(function (t) { list.appendChild(tradeRow(t)); });
      section.appendChild(list);
      holder.appendChild(section);
    });

    if (!trades.length) {
      holder.appendChild(el('p', 'fb-meta', state.loaded
        ? 'No trades yet.'
        : 'Loading\u2026'));
    }

    byId('tradesCount').textContent = incoming.length
      ? incoming.length + (incoming.length === 1 ? ' offer waiting on you' : ' offers waiting on you')
      : '';
    byId('tradeNew').disabled = !state.loaded || !partners().length;
    var fresh = incoming.filter(isNewTrade).length;
    setBadge(fresh);
    tabBadge('tabTradesBadge', fresh);
    seeTrades();
  }

  /* Coming back to a page left open on Trades sees what came in meanwhile. */
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && state.player) { seeTrades(); }
  });

  /* An offer to this player they have not had on screen yet. */
  function isNewTrade(t) {
    return t.status === 'open' && t.to_email.toLowerCase() === me() && !t.seen_at;
  }

  /* With the Trades page on screen, the new offers on it are seen: they
     stop counting on the nav and the page button (here and on any other
     device), and keep their New tag until the page is left. */
  function seeTrades() {
    if (state.tab !== 'trades' || !state.loaded || document.visibilityState === 'hidden' ||
        !/^#cards\/trades\b/.test(window.location.hash)) { return; }
    var fresh = state.trades.filter(isNewTrade);
    if (!fresh.length) { return; }
    var ids = fresh.map(function (t) { return t.id; });
    var now = new Date().toISOString();
    fresh.forEach(function (t) { state.newTrades[t.id] = true; t.seen_at = now; });
    setBadge(0);
    tabBadge('tabTradesBadge', 0);
    EGE.cardStore.markTradesSeen(ids);
  }

  /* --- searching a pile of cards ------------------------------------------

     Each side of the trade builder has a Sort button over its cards, like
     the collection's on a phone, and everything for finding a card is in
     the menu under it: a search box (a player, a school, an opponent, a
     play, a season), then the kinds, the player, the season, the rarity
     and the order. The button counts what is changed from the defaults,
     and the bin puts them all back. */
  var FIND_DEFAULT = { q: '', kind: 'all', player: 'all', season: 'all', rarity: 'all', sort: 'rarity' };

  /* Everything a search can find a card by, in lower case. */
  var findText = {};
  function cardText(card) {
    if (!findText[card.id]) {
      var team = card.team || {};
      findText[card.id] = [card.player.name, card.position, team.school, card.versus, card.headline,
        card.line, card.text, card.event, card.season, 'week ' + card.week, EGE.cards.rarity(card.rarity).name,
        card.kind === 'play' ? 'play' : 'performance', card.holo ? 'holo' : '']
        .filter(Boolean).join(' ').toLowerCase();
    }
    return findText[card.id];
  }

  function finds(card, f) {
    if (f.kind !== 'all' && card.kind !== f.kind) { return false; }
    if (f.player !== 'all' && card.slug !== f.player) { return false; }
    if (f.season !== 'all' && String(card.season) !== f.season) { return false; }
    if (f.rarity !== 'all' && (f.rarity === 'holo' ? !card.holo : card.rarity !== f.rarity)) { return false; }
    var words = f.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) { return true; }
    var text = cardText(card);
    return words.every(function (w) { return text.indexOf(w) !== -1; });
  }

  /* A Sort button and its menu. `onChange` redraws whatever it sorts; the
     menu itself is never redrawn, so the search box keeps its place while
     it is typed in. Hands back { node, sort(cards, first) }. */
  function finder(onChange) {
    var f = Object.assign({}, FIND_DEFAULT);
    var wrap = el('div', 'ege-finder');
    var toggle = el('button', 'fb-btn ege-filtertoggle ege-finder__toggle');
    toggle.type = 'button';
    toggle.setAttribute('aria-expanded', 'false');
    var menu = el('div', 'ege-finder__menu');
    menu.hidden = true;
    wrap.appendChild(toggle);
    wrap.appendChild(menu);

    function changes() {
      return Object.keys(FIND_DEFAULT).filter(function (k) {
        return k === 'q' ? Boolean(f.q.trim()) : f[k] !== FIND_DEFAULT[k];
      }).length;
    }

    function label() {
      var n = changes();
      toggle.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">' +
        '<path fill="currentColor" d="M3 6h11v2H3V6zm15 0h3v2h-3v2h-2V4h2v2zM3 16h3v-2h2v6H6v-2H3v-2zm7 0h11v2H10v-2z"/></svg>' +
        '<span>Sort</span>' + (n ? '<b class="ege-filtertoggle__count">' + n + '</b>' : '');
      toggle.setAttribute('aria-label', 'Sort and search' + (n ? ', ' + n + ' changed' : ''));
      clear.disabled = !n;
    }

    function open(on) {
      menu.hidden = !on;
      wrap.classList.toggle('is-open', on);
      toggle.setAttribute('aria-expanded', on ? 'true' : 'false');
      if (on) { search.focus({ preventScroll: true }); }
    }
    toggle.addEventListener('click', function () { open(menu.hidden); });

    function changed() { label(); onChange(); }

    var search = el('input', 'fb-input ege-finder__search');
    search.type = 'search';
    search.placeholder = 'Search a player, team or play';
    search.setAttribute('aria-label', 'Search the cards');
    search.autocomplete = 'off';
    search.addEventListener('input', function () { f.q = search.value; changed(); });
    search.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); open(false); toggle.focus({ preventScroll: true }); }
    });
    menu.appendChild(search);

    var kinds = el('div', 'ege-finder__kinds');
    var kindChips = [['all', 'All'], ['performance', 'Performances'], ['play', 'Plays']].map(function (k) {
      var b = chip(k[1], f.kind === k[0], function () {
        f.kind = k[0];
        kindChips.forEach(function (c) {
          var on = c.dataset.kind === f.kind;
          c.classList.toggle('is-active', on);
          c.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        changed();
      });
      b.classList.add('ege-filterchip');
      b.dataset.kind = k[0];
      kinds.appendChild(b);
      return b;
    });
    menu.appendChild(kinds);

    function select(key, aria, options) {
      var s = el('select', 'fb-select ege-filterselect');
      s.setAttribute('aria-label', aria);
      options.forEach(function (o) { s.appendChild(new Option(o[1], o[0])); });
      s.value = f[key];
      s.addEventListener('change', function () { f[key] = s.value; changed(); });
      menu.appendChild(s);
      return s;
    }
    var selects = {
      player: select('player', 'Player', [['all', 'Every player']].concat(EGE.players.map(function (p) {
        return [p.slug, p.name];
      }))),
      season: select('season', 'Season', [['all', 'Every season']].concat(EGE.seasonsPlayed().slice().reverse()
        .map(function (y) { return [String(y), String(y)]; }))),
      rarity: select('rarity', 'Rarity', [['all', 'All rarities']].concat(EGE.cards.RARITIES.map(function (r) {
        return [r.key, r.name];
      })).concat([['holo', 'Holo']])),
      sort: select('sort', 'Order', [['rarity', 'Rarest first'], ['points', 'Highest score'],
        ['newest', 'Newest pulls'], ['year', 'By year'], ['game', 'By game']])
    };

    var foot = el('div', 'ege-finder__foot');
    var clear = el('button', 'fb-btn ege-filterclear');
    clear.type = 'button';
    clear.title = 'Reset the search and sort';
    clear.setAttribute('aria-label', 'Reset the search and sort');
    clear.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">' +
      '<path fill="currentColor" d="M9 3h6l1 2h4v2H4V5h4l1-2zm-3 6h12l-1 12H7L6 9zm4 2v8h2v-8h-2zm4 0v8h2v-8h-2z"/></svg>';
    clear.addEventListener('click', function () {
      f = Object.assign({}, FIND_DEFAULT);
      search.value = '';
      Object.keys(selects).forEach(function (k) { selects[k].value = f[k]; });
      kindChips.forEach(function (c) {
        c.classList.toggle('is-active', c.dataset.kind === 'all');
        c.setAttribute('aria-pressed', c.dataset.kind === 'all' ? 'true' : 'false');
      });
      changed();
    });
    var done = el('button', 'fb-btn fb-btn--primary ege-finder__done', 'Done');
    done.type = 'button';
    done.addEventListener('click', function () { open(false); toggle.focus({ preventScroll: true }); });
    foot.appendChild(clear);
    foot.appendChild(done);
    menu.appendChild(foot);

    label();
    return {
      node: wrap,
      /* What of `cards` the menu lets through, in its order; `first` is
         when each was first pulled, for Newest pulls. */
      sort: function (cards, first) {
        return cards.filter(function (card) { return finds(card, f); }).sort(sorter(f.sort, first || {}));
      },
      changed: function () { return changes() > 0; }
    };
  }

  /* --- the trade builder ------------------------------------------------- */

  /* `preset` starts it already filled in: { to: email, take: [card id] },
     from a card of somebody else's (tradeFor). What you give is still
     yours to pick, and nothing goes until Send. */
  function openTradeBuilder(preset) {
    var ask = preset && preset.to ? preset : null;
    var build = { to: null, give: [], take: [], theirs: null, theirsFirst: {}, missing: null };
    var stage = openOverlay('Propose a trade', 'ege-rip__stage--trade');
    var panel = el('div', 'fb-panel ege-tradebuilder');
    stage.appendChild(panel);

    var head = el('div', 'fb-panel__head');
    var pickLabel = el('label', 'ege-field ege-field--inline');
    pickLabel.appendChild(el('span', 'fb-eyebrow', 'Trade with'));
    var pick = el('select', 'fb-select');
    partners().forEach(function (p) { pick.appendChild(new Option(p.name, p.email)); });
    if (ask) { pick.value = ask.to; }
    pickLabel.appendChild(pick);
    head.appendChild(pickLabel);
    panel.appendChild(head);

    var cols = el('div', 'ege-tradecols');
    panel.appendChild(cols);

    var foot = el('div', 'fb-panel__foot');
    var summary = el('span', 'fb-meta');
    var send = el('button', 'fb-btn fb-btn--primary', 'Send the offer');
    send.type = 'button';
    foot.appendChild(summary);
    foot.appendChild(send);
    panel.appendChild(foot);

    /* One side of the offer: its title and count, its Sort button, and the
       cards. `side` says where its cards and its picks are, read afresh on
       every draw since the other side's change with who it is with. */
    function column(side) {
      var holder = el('div', 'ege-tradecol');
      var top = el('div', 'ege-tradecol__head');
      var title = el('h4', 'ege-item__name');
      var tag = el('span', 'fb-tag fb-tag--num');
      top.appendChild(title);
      top.appendChild(tag);
      holder.appendChild(top);
      var find = finder(function () { fill(); });
      holder.appendChild(find.node);
      var grid = el('div', 'ege-tradegrid');
      holder.appendChild(grid);
      cols.appendChild(holder);

      function fill() {
        var owned = side.owned();
        var picked = side.picked();
        title.textContent = side.title();
        tag.textContent = picked.length + ' / ' + MAX_SIDE;
        grid.innerHTML = '';
        if (owned === null) {
          grid.appendChild(el('p', 'fb-meta', 'Loading\u2026'));
          return;
        }
        var all = Object.keys(owned).map(EGE.cards.byId).filter(Boolean);
        var cards = find.sort(all, side.first());
        cards.forEach(function (card) {
          var on = picked.indexOf(card.id) !== -1;
          var node = cardEl(card, { count: owned[card.id] });
          if (on) { node.classList.add('is-picked'); }
          node.setAttribute('aria-pressed', on ? 'true' : 'false');
          pressable(node, describe(card) + (on ? ', in the offer' : ''), function () {
            var at = picked.indexOf(card.id);
            if (at !== -1) { picked.splice(at, 1); }
            else if (picked.length < MAX_SIDE) { picked.push(card.id); }
            draw();
          });
          grid.appendChild(node);
        });
        if (!cards.length) {
          grid.appendChild(el('p', 'fb-meta', all.length && find.changed()
            ? 'Nothing here matches that. Try another search.' : side.none()));
        }
      }
      return { fill: fill, grid: grid };
    }

    var mineSide = column({
      title: function () { return 'You give'; },
      owned: function () { return state.owned; },
      first: function () { return state.first; },
      picked: function () { return build.give; },
      none: function () { return 'No cards of yours to offer here.'; }
    });
    var theirsSide = column({
      title: function () { return 'You get from ' + firstName(build.to); },
      owned: function () { return build.theirs; },
      first: function () { return build.theirsFirst; },
      picked: function () { return build.take; },
      none: function () { return firstName(build.to) + ' has no cards here.'; }
    });

    function draw() {
      mineSide.fill();
      theirsSide.fill();
      summary.textContent = build.missing && !build.give.length ? build.missing
        : build.give.length
        ? 'You give ' + build.give.length + ', you get ' + build.take.length +
          (build.take.length ? '.' : ' \u2014 a gift.')
        : build.take.length
        ? 'You get ' + build.take.length + '. Pick what you give for ' + (build.take.length === 1 ? 'it.' : 'them.')
        : 'Pick at least one of your cards to offer.';
      send.disabled = !build.give.length || build.theirs === null;
    }

    /* `take` is what to ask them for straight away, once their cards are in
       and only what they still have. */
    function choose(email, take) {
      build.to = email;
      build.take = [];
      build.theirs = null;
      build.theirsFirst = {};
      build.missing = null;
      draw();
      EGE.cardStore.collectionFor(email).then(function (got) {
        if (build.to !== email) { return; }
        build.theirs = got ? got.owned : {};
        build.theirsFirst = got ? got.first : {};
        (take || []).forEach(function (id) {
          if (build.theirs[id] && build.take.length < MAX_SIDE) { build.take.push(id); }
        });
        if (take && take.length && !build.take.length) {
          build.missing = firstName(email) + ' does not have that card any more.';
        }
        draw();
        /* The card asked for, scrolled into sight in their side. */
        var on = theirsSide.grid.querySelector('.is-picked');
        if (on) {
          theirsSide.grid.scrollTop += on.getBoundingClientRect().top - theirsSide.grid.getBoundingClientRect().top - 18;
        }
      });
    }

    pick.addEventListener('change', function () { choose(pick.value); });

    send.addEventListener('click', function () {
      send.disabled = true;
      EGE.cardStore.proposeTrade(build.to, build.give.slice(), build.take.slice()).then(function (res) {
        if (!res.ok) {
          summary.textContent = res.message;
          send.disabled = false;
          return;
        }
        closeRip();
        refresh();
      });
    });

    choose(pick.value, ask && pick.value === ask.to ? ask.take : null);
    /* Focus goes on the builder, not the drop-down: a phone opens a
       focused drop-down's picker straight away. */
    panel.tabIndex = -1;
    panel.focus({ preventScroll: true });
  }

  /* --- the nav badge ----------------------------------------------------- */

  /* How many new offers this player has, a red count on Cards in the nav,
     so a trade does not sit unanswered because nobody opened the tab. It
     goes once the Trades page has been open with them on it (seeTrades). */
  function setBadge(count) {
    var badge = byId('navCardsBadge');
    if (!badge) { return; }
    badge.textContent = count;
    badge.hidden = !count;
    var link = byId('navCards');
    if (link) {
      link.setAttribute('aria-label', count ? 'Cards, ' + count + ' new trade offer' + (count === 1 ? '' : 's') : 'Cards');
    }
  }

  /* A count on one of the page buttons along the bottom. */
  function tabBadge(id, count) {
    var badge = byId(id);
    if (!badge) { return; }
    badge.textContent = count;
    badge.hidden = !count;
  }

  function refreshBadge() {
    var player = EGE.auth.currentPlayer();
    if (!player) { setBadge(0); return Promise.resolve(); }
    return EGE.cardStore.tradeStates(player.email).then(function (trades) {
      /* Left as it is when the trades could not be read. */
      if (!trades || EGE.auth.currentPlayer() !== player) { return; }
      var e = player.email.toLowerCase();
      setBadge(trades.filter(function (t) {
        return t.status === 'open' && t.to_email.toLowerCase() === e && !t.seen_at;
      }).length);
    });
  }

  /* --- the library ------------------------------------------------------ */

  function rewardText(set) {
    var rw = set.reward;
    var floor = EGE.cards.rarity(rw.floor).name;
    var parts = [(/^[AEIOU]/.test(floor) ? 'An ' : 'A ') + floor + '-or-better card' +
      (rw.fromText ? ' (' + rw.fromText + ')' : '')];
    if (rw.diamonds) { parts.push(rw.diamonds + ' diamonds'); }
    if (rw.booster) {
      var item = EGE.shopItem ? EGE.shopItem(rw.booster) : null;
      parts.push(item ? item.name : '1.5x Booster');
    }
    return parts.join(' \u00b7 ');
  }

  /* Slots that want the same thing are one line with a pip each, so "ten
     play cards" is a row of ten rather than a list of ten. */
  function slotLines(filled) {
    var lines = [];
    filled.slots.forEach(function (one) {
      var last = lines[lines.length - 1];
      if (last && last.label === one.slot.label) { last.slots.push(one); return; }
      lines.push({ label: one.slot.label, slots: [one] });
    });

    var list = el('ul', 'ege-set__needs');
    lines.forEach(function (line) {
      var have = line.slots.filter(function (s) { return s.card; }).length;
      var item = el('li', 'ege-set__need' + (have === line.slots.length ? ' is-done' : '') +
        (line.slots.length > 5 ? ' ege-set__need--many' : ''));
      var pips = el('span', 'ege-set__pips');
      line.slots.forEach(function (s) {
        var pip = el('span', 'ege-set__pip' + (s.card ? ' is-filled' : ''));
        if (s.card) {
          pip.style.background = EGE.cards.rarity(s.card.rarity).color;
          pip.title = s.card.player.name + ' \u00b7 ' + s.card.headline + ' \u00b7 ' + s.card.season;
        }
        pips.appendChild(pip);
      });
      item.appendChild(pips);
      item.appendChild(el('span', 'ege-set__label', line.label));
      if (line.slots.length > 1) {
        item.appendChild(el('span', 'ege-set__tally', have + '/' + line.slots.length));
      }
      list.appendChild(item);
    });
    return list;
  }

  function setTile(set) {
    var filled = EGE.cards.fill(set, ownedIds());
    var claim = state.claims[set.key];
    var tile = el('article', 'ege-set' + (claim ? ' is-claimed' : filled.complete ? ' is-complete' : ''));

    var head = el('div', 'ege-set__head');
    head.appendChild(el('h4', 'ege-item__name', set.name));
    head.appendChild(el('span', 'fb-tag fb-tag--num' + (claim ? ' fb-tag--sage' : filled.complete ? ' fb-tag--clay' : ''),
      claim ? 'Claimed' : filled.have + ' / ' + filled.need));
    tile.appendChild(head);
    tile.appendChild(el('p', 'ege-item__text', set.blurb));

    var meter = el('div', 'fb-meter');
    var fill = el('div', 'fb-meter__fill' + (claim ? ' fb-meter__fill--alt' : ''));
    fill.style.width = (filled.need ? Math.round(filled.have / filled.need * 100) : 0) + '%';
    meter.appendChild(fill);
    tile.appendChild(meter);

    tile.appendChild(slotLines(filled));

    var reward = el('p', 'ege-set__reward');
    reward.appendChild(el('strong', null, 'Reward '));
    reward.appendChild(document.createTextNode(rewardText(set)));
    tile.appendChild(reward);

    if (claim) {
      var got = claim.reward && claim.reward.card ? EGE.cards.byId(claim.reward.card) : null;
      if (got) {
        var line = el('p', 'ege-set__got');
        line.appendChild(document.createTextNode('Pulled '));
        var name = el('button', 'ege-linkbtn', EGE.cards.rarity(got.rarity).name + ' ' + got.player.first + ', ' + got.headline);
        name.type = 'button';
        name.addEventListener('click', function () { zoom(got, { owned: state.owned[got.id] || 0 }); });
        line.appendChild(name);
        tile.appendChild(line);
      }
    } else if (filled.complete) {
      var button = el('button', 'fb-btn fb-btn--primary fb-btn--block', 'Claim the reward');
      button.type = 'button';
      button.addEventListener('click', function () { claimSet(set, filled, button); });
      tile.appendChild(button);
    }

    return tile;
  }

  function claimSet(set, filled, button) {
    button.disabled = true;
    say('', false);

    EGE.cardStore.claimSet(set, filled).then(function (res) {
      if (!res.ok) {
        say(res.message, true);
        button.disabled = false;
        return;
      }

      var isNew = res.card ? !state.owned[res.card.id] : false;
      var extras = [];
      if (set.reward.diamonds) { extras.push('+' + set.reward.diamonds + ' diamonds'); }
      if (set.reward.booster) { extras.push('a 1.5x Booster in your shop inventory'); }

      /* Like a pack: the reward card stays face down, and out of the
         collection and the library, until it is put away. */
      if (res.card) {
        state.hold = true;
        walletChanged(null, res.diamonds);
        renderPacks();
        openRip({ title: set.name + ' complete', cards: [res.card], isNew: [isNew], extras: extras,
                  onClose: function () { reveal([res.card], [isNew]); } });
      } else {
        walletChanged(null, res.diamonds);
        refresh();
      }
    });
  }

  function renderLibrary() {
    var holder = byId('librarySets');
    holder.innerHTML = '';
    var sets = EGE.cards.sets();

    var groups = [];
    sets.forEach(function (set) {
      var name = set.group || 'Collections';
      var group = groups.filter(function (g) { return g.name === name; })[0];
      if (!group) { group = { name: name, sets: [] }; groups.push(group); }
      group.sets.push(set);
    });

    groups.forEach(function (group) {
      var section = el('section', 'ege-library__group');
      section.appendChild(el('h4', 'ege-library__title', group.name));
      var grid = el('div', 'ege-library__grid');
      group.sets.forEach(function (set) { grid.appendChild(setTile(set)); });
      section.appendChild(grid);
      holder.appendChild(section);
    });

    var claimed = sets.filter(function (set) { return state.claims[set.key]; }).length;
    var ready = sets.filter(function (set) {
      return !state.claims[set.key] && EGE.cards.fill(set, ownedIds()).complete;
    }).length;
    byId('libraryCount').textContent = claimed + ' of ' + sets.length + ' claimed' +
      (ready ? ' \u00b7 ' + ready + ' ready to claim' : '');
    tabBadge('tabSetsBadge', ready);
  }

  /* --- the five pages ----------------------------------------------------

     Picked from the radio bar along the bottom of the screen. The page goes
     into the address as #cards/shop and so on, swapped in place rather than
     navigated to, so switching is instant and does not reload anything; a
     link or a refresh on #cards/shop opens on the shop. */
  var TABS = ['cards', 'players', 'shop', 'trades', 'achievements'];
  var TAB_TITLES = { cards: 'Cards', players: 'Player Cards', shop: 'Shop', trades: 'Trades',
                     achievements: 'Achievements' };

  /* A page not showing is parked rather than taken out of the page: its
     contents skip drawing (content-visibility: hidden, in site.css) but keep
     their layout, so coming back to a page full of cards does not lay every
     one of them out again. Browsers without it hide the page as before. */
  var PARK = Boolean(window.CSS && window.CSS.supports && window.CSS.supports('content-visibility', 'hidden'));

  function setTab(tab, fromRoute) {
    tab = String(tab || '').replace(/\/+$/, '');        /* #cards/trades/ too */
    var next = TABS.indexOf(tab) === -1 ? 'cards' : tab;
    var moved = next !== state.tab;
    state.tab = next;

    Array.prototype.forEach.call(document.querySelectorAll('#cardsContent .ege-cardpage'), function (page) {
      var off = page.dataset.page !== next;
      if (PARK) {
        page.hidden = false;
        page.classList.toggle('is-parked', off);
        page.inert = off;
      } else {
        page.hidden = off;
      }
    });
    Array.prototype.forEach.call(document.querySelectorAll('#cardTabs input'), function (input) {
      input.checked = input.value === next;
      input.parentNode.classList.toggle('is-active', input.checked);
    });
    /* The slider glides under the picked icon, one fifth of the island per page. */
    byId('cardTabs').style.setProperty('--tab', TABS.indexOf(next));
    byId('cardsTitle').textContent = TAB_TITLES[next];
    document.title = TAB_TITLES[next] + ' — EGE Football';

    var hash = '#cards' + (next === 'cards' ? '' : '/' + next);
    if (!fromRoute && window.location.hash !== hash && window.history && window.history.replaceState) {
      window.history.replaceState(null, '', hash);
    }
    if (moved && !fromRoute) { window.scrollTo(0, 0); }
    /* The binder measures itself to draw its first rows, and a hidden page
       measures as nothing. */
    if (moved && next === 'cards' && state.loaded && !state.hold) { renderCollection(); }
    /* Picking cards to sell is on the Cards page only. */
    if (moved && next !== 'cards' && state.sell) { sellMode(false); }
    /* Leaving the Trades page drops the New tags of the offers seen on it. */
    if (moved && next !== 'trades' && Object.keys(state.newTrades).length) {
      state.newTrades = {};
      if (state.loaded) { renderTrades(); }
    }
    if (next === 'trades') { seeTrades(); }
  }

  /* --- player cards ------------------------------------------------------ */

  function pctText(bonus) { return Math.round(bonus * 100) + '%'; }

  /* About what one of his games pays at a rank: his games this season so
     far, or last season's before any are out. */
  function typicalBonus(player, rankKey) {
    var games = [];
    [EGE.currentSeason, EGE.currentSeason - 1].some(function (year) {
      games = EGE.gamesPlayed(player, year).filter(function (g) { return g.stats && !g.injured; })
        .map(function (g) { return EGE.cards.playerBonus(player, g.stats, year, rankKey); });
      return games.length > 0;
    });
    if (!games.length) { return null; }
    return Math.round(games.reduce(function (a, b) { return a + b; }, 0) / games.length);
  }

  function whole(n) { return Math.floor(n).toLocaleString('en-US'); }

  /* A Player Card's face, from Sam's sketch: PLAYER and the FPTS held
     across the top, his picture, his name and team · position, what the
     card has earned you with its bonus beside it, a bar to the next rank
     with how far there is to go, and the rank along the foot. Framed in
     the rank's colour, the size of a binder card and with its effects. `earned` is the diamonds
     it has paid in all, or null where that is not known; `custom` the
     photo its owner put on it, in place of the headshot. Drawn here for
     the Players page and by js/showcase.js for a player's own page. Not
     ranked yet, it is a grey card. */
  function playerCardFace(pc, earned, custom) {
    var player = pc.player;
    var rank = pc.rank;
    var key = rank ? rank.key : 'unranked';
    var team = EGE.teamFor(player, EGE.currentSeason) || {};

    /* A binder card underneath (.ege-tcard): the same size as a play or
       performance card, and the same foil, sheen and glow for its rank. */
    var outer = el('div', 'ege-tcard ege-tcard--' + key + ' ege-plcard ege-plcard--' + key);
    outer.style.setProperty('--rarity', rank ? rank.color : '#8b9097');
    outer.style.setProperty('--ground', team.ground || '#2f4a2b');
    var node = el('div', 'ege-tcard__face ege-plcard__face');
    outer.appendChild(node);

    var top = el('div', 'ege-plcard__top');
    top.appendChild(el('span', 'ege-plcard__kind', 'Player'));
    var fpts = el('span', 'ege-plcard__fpts');
    fpts.appendChild(el('b', null, whole(pc.points)));
    fpts.appendChild(document.createTextNode(' FPTS'));
    top.appendChild(fpts);
    node.appendChild(top);

    var frame = el('div', 'ege-plcard__photo');
    var photo = el('img');
    photo.src = custom || player.headshot;
    photo.alt = '';
    photo.loading = 'lazy';
    photo.decoding = 'async';
    frame.appendChild(photo);
    node.appendChild(frame);

    var plate = el('div', 'ege-plcard__plate');
    plate.appendChild(el('div', 'ege-plcard__name', player.name));
    var where = el('div', 'ege-plcard__team');
    if (team.logo) {
      var logo = el('img', 'ege-plcard__logo');
      logo.src = team.logo;
      logo.alt = '';
      logo.loading = 'lazy';
      logo.addEventListener('error', function () { logo.remove(); });
      where.appendChild(logo);
    }
    where.appendChild(el('span', null,
      [team.school, EGE.positionFor ? EGE.positionFor(player) : player.position].filter(Boolean).join(' \u00b7 ')));
    plate.appendChild(where);

    var earn = el('div', 'ege-plcard__earn');
    earn.appendChild(document.createTextNode('Earned '));
    if (earned !== null && earned !== undefined) {
      earn.appendChild(el('b', null, whole(earned)));
      earn.appendChild(gem());
    } else {
      earn.appendChild(el('b', null, '\u2014'));
    }
    earn.appendChild(document.createTextNode(' · '));
    earn.appendChild(el('b', 'ege-plcard__pct', (rank && rank.bonus ? '+' : '') + pctText(rank ? rank.bonus : 0)));
    var about = rank && rank.bonus ? typicalBonus(player, rank.key) : null;
    if (about !== null) { earn.title = 'About ' + about + ' diamonds on each of his games'; }
    plate.appendChild(earn);

    /* To the next rank; before any card, to the first one that pays. */
    var next = rank ? pc.next : pc.ladder[1];
    var from = rank ? rank.points : 0;
    var bar = el('div', 'ege-plcard__bar');
    var fill = el('span', 'ege-plcard__fill');
    fill.style.width = (next
      ? Math.max(0, Math.min(100, (pc.points - from) / Math.max(1, next.points - from) * 100))
      : 100) + '%';
    bar.appendChild(fill);
    plate.appendChild(bar);
    plate.appendChild(el('div', 'ege-plcard__togo', next
      ? whole(Math.max(0, Math.ceil(next.points - pc.points))) + ' to ' + next.name
      : 'As high as it goes'));
    node.appendChild(plate);

    var foot = el('div', 'ege-plcard__foot');
    foot.appendChild(el('span', 'ege-plcard__rank', rank ? rank.name : 'Unranked'));
    foot.appendChild(el('span', null, 'Career'));
    node.appendChild(foot);
    return outer;
  }

  /* What each Player Card has paid this account, every season:
     { slug: diamonds }, or null before the awards are read. */
  function earnedTotals() {
    if (!state.pcAwards) { return null; }
    var totals = {};
    state.pcAwards.forEach(function (row) {
      var m = /^pc-(.+)-w\d+$/.exec(row.award_key);
      if (m) { totals[m[1]] = (totals[m[1]] || 0) + (row.diamonds || 0); }
    });
    return totals;
  }

  function earnedFrom(slug) {
    var totals = earnedTotals();
    return totals ? totals[slug] || 0 : null;
  }

  /* A Player Card and, beside it, what it means: his name, how far it is
     to the next rank, what it has earned and pays a game, and the buttons
     to see his cards and (on your own) put a photo on it. `whose` is the
     account the cards belong to: { mine, first, email, earned, photos }. */
  function playerCardEl(pc, whose) {
    var player = pc.player;
    var rank = pc.rank;
    var earned = whose.earned ? (whose.earned[player.slug] || 0) : null;
    var photo = whose.photos ? whose.photos[player.slug] || null : null;
    var node = el('article', 'ege-pcard');
    node.appendChild(playerCardFace(pc, earned, photo));

    var body = el('div', 'ege-pcard__body');
    body.appendChild(el('h4', 'ege-item__name', player.name));
    body.appendChild(el('span', 'fb-meta', pc.copies
      ? whole(pc.points) + ' FPTS from ' + pc.copies + (pc.copies === 1 ? ' card' : ' cards') +
        ' · ' + pc.distinct + ' different'
      : (whose.mine ? 'No cards of his yet.' : whose.first + ' has no cards of his yet.')));

    /* Progress to the next rank, in the colour of the one held. */
    var next = rank ? pc.next : pc.ladder[1];
    var from = rank ? rank.points : 0;
    var meter = el('div', 'fb-meter ege-pcard__meter');
    var fill = el('div', 'fb-meter__fill');
    fill.style.width = (next ? Math.max(0, Math.min(100, (pc.points - from) / Math.max(1, next.points - from) * 100)) : 100) + '%';
    fill.style.background = rank ? rank.color : '#8b9097';
    meter.appendChild(fill);
    body.appendChild(meter);
    body.appendChild(el('p', 'ege-pcard__next', !pc.copies
      ? 'One ' + player.first + ' card starts it, and ' + whole(next.points) + ' FPTS makes it ' + next.name + '.'
      : next ? whole(Math.max(0, Math.ceil(next.points - pc.points))) + ' more FPTS to ' + next.name +
               ' (' + whole(next.points) + '), which pays +' + pctText(next.bonus) + '.'
      : 'Iconic. As high as it goes.'));

    /* What it has earned, and what it pays now. */
    var pays = el('p', 'ege-pcard__bonus');
    if (earned !== null) {
      pays.appendChild(document.createTextNode('Earned '));
      var amount = el('strong', 'ege-pcard__amount', whole(earned));
      amount.appendChild(gem());
      pays.appendChild(amount);
      pays.appendChild(document.createTextNode(' so far. '));
    }
    if (rank && rank.bonus) {
      var about = typicalBonus(player, rank.key);
      var rate = el('span', 'ege-pcard__rate', '+' + pctText(rank.bonus));
      rate.appendChild(gem());
      pays.appendChild(rate);
      pays.appendChild(document.createTextNode(' of his game diamonds' +
        (about !== null ? ', about ' + about + ' a game.' : '.')));
    } else {
      pays.appendChild(document.createTextNode('No bonus until Uncommon.'));
    }
    body.appendChild(pays);

    var row = el('div', 'ege-pcard__actions');
    var see = el('button', 'fb-btn fb-btn--sm ege-pcard__see', 'See his cards');
    see.type = 'button';
    see.disabled = !pc.copies;
    see.addEventListener('click', function () {
      state.filter.player = player.slug;
      setTab('cards');
      if ((state.view || null) !== (whose.mine ? null : whose.email)) {
        pickView(whose.mine ? null : whose.email);
      } else {
        renderFilters();
        renderCollection();
      }
    });
    row.appendChild(see);

    /* Your own: a photo of yours on it, in place of his headshot. */
    if (whose.mine) {
      var pick = el('button', 'fb-btn fb-btn--sm ege-pcard__photo', photo ? 'Change photo' : 'Add photo');
      pick.type = 'button';
      pick.disabled = !pc.copies || state.photos === null;
      pick.title = state.photos === null ? 'Photos could not be loaded. Run supabase/schema.sql.'
        : !pc.copies ? 'Collect a ' + player.first + ' card first.' : '';
      pick.addEventListener('click', function () { choosePhoto(pc); });
      row.appendChild(pick);
      if (photo) {
        var drop = el('button', 'fb-btn fb-btn--sm ege-pcard__unphoto', '×');
        drop.type = 'button';
        drop.title = 'Remove your photo';
        drop.setAttribute('aria-label', 'Remove your photo from ' + player.first + '’s Player Card');
        drop.addEventListener('click', function () { removePhoto(player, drop); });
        row.appendChild(drop);
      }
    }
    body.appendChild(row);

    node.appendChild(body);
    return node;
  }

  /* --- somebody else's Player Cards ----------------------------------------

     Picked above the Player Cards. Their cards are readable by anybody
     signed in, the same as their collection; their photos are public; and
     what their cards have earned comes from player_card_earnings, since
     diamond_awards itself is theirs alone. */
  function pickPcView(email) {
    state.pcView = email || null;
    state.pcOther = null;
    renderPlayerCards();
    loadPcOther();
  }

  function loadPcOther() {
    var email = state.pcView;
    if (!email) { return Promise.resolve(); }
    return Promise.all([
      EGE.cardStore.collectionFor(email),
      EGE.cardStore.cardPhotos(email),
      EGE.cardStore.playerCardEarnings(email)
    ]).then(function (all) {
      if (state.pcView !== email) { return; }
      state.pcOther = { owned: all[0] ? all[0].owned : {}, failed: !all[0], photos: all[1] || {},
                        earned: all[2] };
      if (!state.hold) { renderPlayerCards(); }
    });
  }

  /* --- photos on Player Cards ---------------------------------------------

     Picked from the phone or computer, then cropped: the picture sits in a
     frame the shape of the card's photo, dragged to move it and zoomed with
     the slider, a pinch or the mouse wheel. What is in the frame is drawn
     PHOTO_W by PHOTO_H on a canvas and saved as a WebP, so a 4 MB phone
     photo goes up as about 20-50 KB, and redrawing it leaves its location
     and the rest of what the camera wrote behind. set_card_photo refuses
     anything over about 100 KB; PHOTO_MAX keeps under it. One per Player
     Card per account, 36 at most across the site. */
  var PHOTO_W = 480;
  var PHOTO_H = 310;          /* the card's photo is about 0.65 as tall as wide */
  var PHOTO_MAX = 130000;
  var ZOOM_MAX = 4;

  function loadPhoto(file) {
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\//.test(file.type)) { reject(new Error('That is not a picture.')); return; }
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('That picture could not be opened. Try a JPEG or PNG.'));
      };
      img.onload = function () { resolve({ img: img, url: url }); };
      img.src = url;
    });
  }

  /* The frame's part of the picture as a data URL, or null if too big. */
  function cropToDataUrl(img, view) {
    var canvas = document.createElement('canvas');
    canvas.width = PHOTO_W;
    canvas.height = PHOTO_H;
    canvas.getContext('2d').drawImage(img, view.sx, view.sy, view.sw, view.sh, 0, 0, PHOTO_W, PHOTO_H);
    var out = '';
    [0.82, 0.7, 0.55, 0.4].some(function (quality) {
      out = canvas.toDataURL('image/webp', quality);
      /* A browser that cannot write WebP hands back a PNG. */
      if (out.indexOf('data:image/webp') !== 0) { out = canvas.toDataURL('image/jpeg', quality); }
      return out.length <= PHOTO_MAX;
    });
    return out.length <= PHOTO_MAX ? out : null;
  }

  function choosePhoto(pc) {
    var input = el('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      if (!file) { return; }
      loadPhoto(file).then(function (loaded) { cropPhoto(pc, loaded, null); },
        function (error) { say(error.message, true); });
    });
    input.click();
  }

  /* The crop: the picture in a frame the card photo's shape. `start` is
     where it was left, coming back from the preview. */
  function cropPhoto(pc, loaded, start) {
    var img = loaded.img;
    var iw = img.naturalWidth;
    var ih = img.naturalHeight;
    var stage = openOverlay('Crop your photo', 'ege-rip__stage--zoom');
    rip.onClose = function () { if (!loaded.keep) { URL.revokeObjectURL(loaded.url); } };

    var frame = el('div', 'ege-crop');
    frame.style.aspectRatio = PHOTO_W + ' / ' + PHOTO_H;
    var pic = el('img', 'ege-crop__img');
    pic.src = loaded.url;
    pic.alt = '';
    pic.draggable = false;
    frame.appendChild(pic);
    stage.appendChild(frame);

    var zoomRow = el('label', 'ege-crop__zoom');
    zoomRow.appendChild(el('span', null, 'Zoom'));
    var slider = el('input');
    slider.type = 'range';
    slider.min = '1';
    slider.max = String(ZOOM_MAX);
    slider.step = '0.01';
    zoomRow.appendChild(slider);
    stage.appendChild(zoomRow);
    stage.appendChild(el('p', 'ege-rip__hint', 'Drag the picture to move it. Pinch, scroll or slide to zoom.'));

    /* The view in the picture's own pixels: the centre and the zoom, where
       zoom 1 is the whole frame filled with as much picture as fits. */
    var aspect = PHOTO_W / PHOTO_H;
    var fitW = Math.min(iw, ih * aspect);         /* the frame's width at zoom 1 */
    var view = start ? { cx: start.cx, cy: start.cy, z: start.z }
      : { cx: iw / 2, cy: Math.min(ih - fitW / aspect / 2, Math.max(fitW / aspect / 2, ih * 0.38)), z: 1 };

    function rect() {
      var sw = fitW / view.z;
      var sh = sw / aspect;
      view.cx = Math.min(iw - sw / 2, Math.max(sw / 2, view.cx));
      view.cy = Math.min(ih - sh / 2, Math.max(sh / 2, view.cy));
      return { sx: view.cx - sw / 2, sy: view.cy - sh / 2, sw: sw, sh: sh };
    }

    function paint() {
      var r = rect();
      var box = frame.getBoundingClientRect();
      var k = box.width / r.sw;                    /* screen px per picture px */
      pic.style.width = (iw * k) + 'px';
      pic.style.height = (ih * k) + 'px';
      pic.style.transform = 'translate(' + (-r.sx * k) + 'px,' + (-r.sy * k) + 'px)';
      slider.value = String(view.z);
    }

    function zoomTo(z) {
      view.z = Math.min(ZOOM_MAX, Math.max(1, z));
      paint();
    }

    slider.addEventListener('input', function () { zoomTo(Number(slider.value)); });
    frame.addEventListener('wheel', function (event) {
      event.preventDefault();
      zoomTo(view.z * Math.exp(-event.deltaY / 400));
    }, { passive: false });

    /* Dragging with one finger or the mouse; pinching with two. */
    var pointers = {};
    var pinch = null;
    function spread() {
      var ps = Object.keys(pointers).map(function (id) { return pointers[id]; });
      return Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y);
    }
    frame.addEventListener('pointerdown', function (event) {
      frame.setPointerCapture(event.pointerId);
      pointers[event.pointerId] = { x: event.clientX, y: event.clientY };
      if (Object.keys(pointers).length === 2) { pinch = { d: spread(), z: view.z }; }
    });
    frame.addEventListener('pointermove', function (event) {
      var last = pointers[event.pointerId];
      if (!last) { return; }
      var now = { x: event.clientX, y: event.clientY };
      pointers[event.pointerId] = now;
      if (pinch && Object.keys(pointers).length === 2) {
        zoomTo(pinch.z * spread() / Math.max(1, pinch.d));
        return;
      }
      var k = frame.getBoundingClientRect().width / rect().sw;
      view.cx -= (now.x - last.x) / k;
      view.cy -= (now.y - last.y) / k;
      paint();
    });
    function lift(event) {
      delete pointers[event.pointerId];
      if (Object.keys(pointers).length < 2) { pinch = null; }
    }
    frame.addEventListener('pointerup', lift);
    frame.addEventListener('pointercancel', lift);

    var actions = el('div', 'ege-rip__actions');
    var again = el('button', 'fb-btn', 'Pick another');
    again.type = 'button';
    again.addEventListener('click', function () { closeRip(); choosePhoto(pc); });
    var next = el('button', 'fb-btn fb-btn--primary', 'Crop');
    next.type = 'button';
    next.addEventListener('click', function () {
      var photo = cropToDataUrl(img, rect());
      if (!photo) { say('That picture is too big. Try a smaller one.', true); return; }
      loaded.keep = true;
      closeRip();
      loaded.keep = false;
      previewPhoto(pc, photo, loaded, { cx: view.cx, cy: view.cy, z: view.z });
    });
    actions.appendChild(again);
    actions.appendChild(next);
    stage.appendChild(actions);

    if (img.decode) { img.decode().then(paint, paint); } else { paint(); }
    requestAnimationFrame(paint);
    next.focus({ preventScroll: true });
  }

  /* The card with the new photo on it, before it is kept. */
  function previewPhoto(pc, photo, loaded, view) {
    var player = pc.player;
    var stage = openOverlay(player.first + '’s card photo', 'ege-rip__stage--zoom');
    rip.onClose = function () { if (!loaded.keep) { URL.revokeObjectURL(loaded.url); } };
    var holder = el('div', 'ege-photoprev');
    holder.appendChild(playerCardFace(pc, earnedFrom(player.slug), photo));
    stage.appendChild(holder);

    var status = el('p', 'ege-rip__hint', 'Only your ' + player.first + ' card shows it, here and on your page.');
    status.setAttribute('role', 'status');
    stage.appendChild(status);

    var actions = el('div', 'ege-rip__actions');
    var again = el('button', 'fb-btn', 'Crop again');
    again.type = 'button';
    again.addEventListener('click', function () {
      loaded.keep = true;
      closeRip();
      loaded.keep = false;
      cropPhoto(pc, loaded, view);
    });
    var keep = el('button', 'fb-btn fb-btn--primary', 'Use this photo');
    keep.type = 'button';
    keep.addEventListener('click', function () {
      keep.disabled = true;
      again.disabled = true;
      status.textContent = 'Saving…';
      EGE.cardStore.setCardPhoto(player.slug, photo).then(function (res) {
        if (!res.ok) {
          status.textContent = res.message;
          keep.disabled = false;
          again.disabled = false;
          return;
        }
        state.photos = state.photos || {};
        state.photos[player.slug] = photo;
        if (EGE.showcase) { EGE.showcase.forget(); }
        closeRip();
        say('', false);
        renderPlayerCards();
      });
    });
    actions.appendChild(again);
    actions.appendChild(keep);
    stage.appendChild(actions);
    keep.focus({ preventScroll: true });
  }

  function removePhoto(player, button) {
    button.disabled = true;
    EGE.cardStore.clearCardPhoto(player.slug).then(function (res) {
      if (!res.ok) { say(res.message, true); button.disabled = false; return; }
      if (state.photos) { delete state.photos[player.slug]; }
      if (EGE.showcase) { EGE.showcase.forget(); }
      say('', false);
      renderPlayerCards();
    });
  }

  function renderPlayerCards() {
    var who = byId('playerCardsWho');
    if (!who.options.length) {
      who.appendChild(new Option('My Player Cards', ''));
      partners().forEach(function (p) { who.appendChild(new Option(p.first + '\u2019s Player Cards', p.email)); });
      who.addEventListener('change', function () { pickPcView(who.value); });
    }
    who.value = state.pcView || '';

    var holder = byId('playerCards');
    holder.innerHTML = '';
    var other = state.pcView ? playerByEmail(state.pcView) : null;
    var whose = state.pcView
      ? { mine: false, email: state.pcView, first: other ? other.first : state.pcView,
          earned: state.pcOther && state.pcOther.earned, photos: state.pcOther && state.pcOther.photos }
      : { mine: true, earned: earnedTotals(), photos: state.photos };
    if (state.pcView && !state.pcOther) {
      holder.appendChild(el('p', 'fb-meta', 'Loading ' + whose.first + '\u2019s Player Cards\u2026'));
      return;
    }
    if (state.pcView && state.pcOther.failed) {
      holder.appendChild(el('p', 'fb-meta', whose.first + '\u2019s cards could not be loaded.'));
      return;
    }
    var owned = state.pcView ? state.pcOther.owned : state.owned;
    EGE.players.forEach(function (player) {
      holder.appendChild(playerCardEl(EGE.cards.playerCard(player, owned), whose));
    });

    var total = state.pcView ? 0 : (state.pcAwards || []).filter(function (row) { return row.season === EGE.currentSeason; })
      .reduce(function (sum, row) { return sum + (row.diamonds || 0); }, 0);
    var earned = byId('playerCardsEarned');
    earned.innerHTML = '';
    if (total) {
      earned.appendChild(document.createTextNode(EGE.currentSeason + ' bonuses: ' + total + ' '));
      earned.appendChild(gem());
    }
  }

  function renderRankTable() {
    var body = byId('rankTable');
    body.innerHTML = '';
    var scale = EGE.cards.RANK_SCALE;
    EGE.cards.PLAYER_RANKS.forEach(function (r) {
      var rarityInfo = EGE.cards.rarity(r.key);
      var tr = el('tr');
      var name = el('td');
      var dot = el('span', 'ege-chipdot');
      dot.style.background = rarityInfo.color;
      name.appendChild(dot);
      name.appendChild(el('strong', null, rarityInfo.name));
      tr.appendChild(name);
      [scale.WR, scale.TE, scale.QB].forEach(function (k) {
        tr.appendChild(el('td', 'num', r.points ? String(Math.round(r.points * k)) : '1 card'));
      });
      tr.appendChild(el('td', 'num', r.bonus ? '+' + pctText(r.bonus) : '—'));
      body.appendChild(tr);
    });
  }

  /* --- the daily spin -------------------------------------------------------

     One free spin a day on the Shop page, turning over at 7:00 AM Central
     (EGE.cards.SPIN). The database rolls the prize (spin_card_wheel) and
     the wheel only shows where it landed, so it is turned after the answer
     comes back. A card comes out face down like a pull, a pack sealed like
     a bought one (already paid for, so tearing it costs nothing), and
     diamonds go straight on the balance.

     The slices are sized for the eye, not to the odds -- at their real
     size the two jackpots would be slivers too thin to read -- and the odds
     are not shown on the page (Sam, 2026-10-16). Once today's spin is spun
     the whole panel goes until the next one opens (Sam, 2026-10-16). */
  var WHEEL = [
    { prize: 'uncommon', deg: 60 },
    { prize: 'diamonds', deg: 44 },
    { prize: 'rare', deg: 35 },
    { prize: 'legendary', deg: 15 },
    { prize: 'uncommon', deg: 60 },
    { prize: 'base', deg: 52 },
    { prize: 'diamonds', deg: 44 },
    { prize: 'rare', deg: 35 },
    { prize: 'pro', deg: 15 }
  ];
  /* Each prize's slice and its lettering: the rarities in their own
     colours, diamonds in the diamond's, the Base Pack cream, and the
     jackpots dark with gold. */
  var WHEEL_LOOK = {
    uncommon:  { fill: '#3e9a4b', ink: '#fbf4e6' },
    diamonds:  { fill: '#7fdcf5', ink: '#1d2416' },
    rare:      { fill: '#e8812a', ink: '#1d2416' },
    base:      { fill: '#fbf4e6', ink: '#1d2416' },
    legendary: { fill: '#8a4fd8', ink: '#ffffff' },
    pro:       { fill: '#1d2416', ink: '#f0b82a' }
  };
  var SPIN_MS = 5200;

  /* `keep` is when the panel may go after a spin, once the wheel has shown
     where it stopped. */
  var wheel = { drawn: false, turn: 0, prize: null, keep: 0 };

  function polar(r, deg) {
    var a = deg * Math.PI / 180;
    return (r * Math.sin(a)).toFixed(2) + ' ' + (-r * Math.cos(a)).toFixed(2);
  }

  /* The wheel, once: slices clockwise from the top, each prize's name along
     the middle of its slice reading out to the rim, and a peg between each
     two. Turned with a CSS transform after that, never redrawn. */
  function drawWheel() {
    var holder = byId('spinWheel');
    if (wheel.drawn || !holder) { return; }
    wheel.drawn = true;
    var R = 92;
    var at = 0;
    var svg = ['<svg viewBox="-100 -100 200 200" focusable="false">',
               '<circle r="99" class="ege-spin__rim"/>'];
    var pegs = [];
    WHEEL.forEach(function (slice) {
      var look = WHEEL_LOOK[slice.prize];
      var prize = EGE.cards.spinPrize(slice.prize);
      var jackpot = prize.jackpot ? ' ege-spin__slice--jackpot' : '';
      var mid = at + slice.deg / 2;
      svg.push('<path class="ege-spin__slice' + jackpot + '" fill="' + look.fill + '" d="M0 0 L' +
        polar(R, at) + ' A' + R + ' ' + R + ' 0 0 1 ' + polar(R, at + slice.deg) + ' Z"/>');
      svg.push('<g transform="rotate(' + mid + ')"><text class="ege-spin__label' +
        (prize.jackpot ? ' ege-spin__label--jackpot' : '') + '" transform="rotate(-90)" x="' + (R - 6) +
        '" y="0" text-anchor="end" dominant-baseline="central" fill="' + look.ink + '">' +
        prize.short.toUpperCase() + '</text></g>');
      pegs.push('<circle class="ege-spin__peg" r="2.6" cx="' + polar(95.5, at).replace(' ', '" cy="') + '"/>');
      at += slice.deg;
    });
    holder.innerHTML = svg.concat(pegs, ['</svg>']).join('');
  }

  /* Somewhere in one of the prize's slices: its middle when the wheel is
     only being put where it stopped, anywhere but its edges for a spin. */
  function sliceAngle(prize, anywhere) {
    var at = 0;
    var picks = [];
    WHEEL.forEach(function (slice) {
      if (slice.prize === prize) { picks.push({ from: at, deg: slice.deg }); }
      at += slice.deg;
    });
    if (!picks.length) { return 0; }
    var pick = picks[anywhere ? Math.floor(Math.random() * picks.length) : 0];
    return pick.from + pick.deg * (anywhere ? 0.2 + Math.random() * 0.6 : 0.5);
  }

  /* Turns the wheel so `prize` is under the pointer at the top: a long spin
     that slows to a stop, or (`spin` false) straight there. */
  function turnTo(prize, spin) {
    var node = byId('spinWheel');
    if (!spin && wheel.prize === prize) { return; }
    var rest = (360 - sliceAngle(prize, spin)) % 360;
    var turn = rest;
    if (spin) {
      turn = wheel.turn - (wheel.turn % 360) + 360 * 6 + rest;
      if (turn - wheel.turn < 360 * 5) { turn += 360; }
    }
    wheel.turn = turn;
    wheel.prize = prize;
    node.style.transition = spin && !reducedMotion()
      ? 'transform ' + SPIN_MS + 'ms cubic-bezier(.12, .7, .08, 1)' : 'none';
    node.style.transform = 'rotate(' + turn + 'deg)';
  }

  /* Where today's spin stands. The day may have turned over since it was
     read, which makes today's spin yesterday's. */
  function spinNow() {
    var s = state.spin;
    if (!s) { return null; }
    var ends = new Date(s.next_at).getTime();
    var over = !isNaN(ends) && Date.now() >= ends;
    return { spin: over ? null : s.spin, nextAt: over ? null : s.next_at };
  }

  function renderSpin() {
    drawWheel();
    if (state.spinning) { return; }
    var panel = byId('spinPanel');
    var go = byId('spinGo');
    var result = byId('spinResult');
    var resets = byId('spinResets');
    var now = spinNow();

    /* Out of sight until today's spin is known, so it never shows for a
       moment to somebody who has spun already; if it cannot be read, the
       panel says so. */
    if (!now) {
      panel.hidden = !state.loaded;
      go.disabled = true;
      go.textContent = 'Spin';
      resets.textContent = '';
      result.textContent = 'The daily spin could not be loaded. Run supabase/schema.sql to set it up, then reload.';
      tabBadge('tabShopBadge', 0);
      return;
    }

    /* Spun: the wheel stays long enough to show where it stopped, then the
       panel goes until the next spin opens. */
    if (now.spin) {
      tabBadge('tabShopBadge', 0);
      var left = wheel.keep - Date.now();
      panel.hidden = left <= 0;
      if (left > 0) { window.setTimeout(renderSpin, left + 20); }
      return;
    }

    var enough = EGE.cards.pullable(null).length >= EGE.cards.pack('pro').size;
    panel.hidden = false;
    go.disabled = !state.loaded || !enough;
    go.textContent = 'Spin';
    resets.textContent = enough ? 'Ready' : '';
    result.textContent = enough ? 'Your free spin is ready.' : 'The wheel opens once there are cards out.';
    tabBadge('tabShopBadge', enough && state.loaded ? 1 : 0);
  }

  function doSpin() {
    var go = byId('spinGo');
    if (state.spinning || go.disabled) { return; }
    state.spinning = true;
    go.disabled = true;
    go.textContent = 'Spinning…';
    byId('spinResult').textContent = '';
    say('', false);

    /* New is the first of a card ever, as in a pack. */
    var seen = Object.assign({}, state.owned);
    var player = state.player;
    EGE.cardStore.spin().then(function (res) {
      if (state.player !== player) { return; }
      if (!res.ok) {
        state.spinning = false;
        /* Spun already, in another tab perhaps: read where it stands. */
        EGE.cardStore.spinToday().then(function (now) {
          if (state.player !== player) { return; }
          if (now) { state.spin = now; }
          renderSpin();
          byId('spinResult').textContent = res.message;
        });
        return;
      }

      var isNew = res.cards.map(function (card) {
        var first = !seen[card.id];
        seen[card.id] = (seen[card.id] || 0) + 1;
        return first;
      });
      /* What it won stays out of the collection until it has been shown. */
      if (res.cards.length) { state.hold = true; }
      state.spin = { next_at: res.nextAt,
                     spin: { prize: res.prize, diamonds: res.won,
                             cards: res.cards.map(function (card) { return card.id; }) } };
      tabBadge('tabShopBadge', 0);
      turnTo(res.prize, true);
      window.setTimeout(function () { landed(res, isNew, player); }, reducedMotion() ? 0 : SPIN_MS + 300);
    });
  }

  function landed(res, isNew, player) {
    state.spinning = false;
    if (state.player !== player) { return; }
    var prize = EGE.cards.spinPrize(res.prize);
    var wrap = byId('spinWheel').parentNode;
    /* It glows where it stopped, then fades and goes until tomorrow. */
    var still = reducedMotion() ? 0 : 2400;
    wheel.keep = Date.now() + still;
    wrap.classList.add(prize && prize.jackpot ? 'is-jackpot' : 'is-won');
    window.setTimeout(function () { wrap.classList.add('is-leaving'); }, Math.max(0, still - 450));
    window.setTimeout(function () { wrap.classList.remove('is-won', 'is-jackpot', 'is-leaving'); }, still + 40);

    walletChanged(null, res.diamonds);
    renderSpin();
    renderPacks();

    if (!res.cards.length) {
      renderDaily();
      renderMarket();
      return;
    }
    var pack = prize && prize.pack ? EGE.cards.pack(prize.pack) : null;
    openRip({
      pack: pack, free: true, sellable: Boolean(pack), cards: res.cards, isNew: isNew,
      title: 'Daily Spin' + (pack ? ' · ' + pack.name : ''),
      onClose: function () { reveal(res.cards, isNew); }
    });
  }

  /* --- the shop's daily cards --------------------------------------------- */

  function resetsText(iso) {
    var ms = new Date(iso).getTime() - Date.now();
    if (isNaN(ms)) { return ''; }
    if (ms <= 0) { return 'New cards any minute'; }
    var mins = Math.ceil(ms / 60000);
    var hours = Math.floor(mins / 60);
    return 'New cards in ' + (hours ? hours + 'h ' : '') + (mins % 60) + 'm';
  }

  function renderDaily() {
    var holder = byId('dailyCards');
    holder.innerHTML = '';
    var shop = state.shop;
    byId('dailyResets').textContent = shop && shop.resets_at ? resetsText(shop.resets_at) : '';

    if (!shop || !shop.cards || !shop.cards.length) {
      holder.appendChild(el('p', 'fb-meta', !state.loaded ? 'Loading…'
        : shop ? 'Nothing on the shelf yet. It fills once there are cards out.'
        : 'Today’s cards could not be loaded. Run supabase/schema.sql to set up the shop, then reload.'));
      return;
    }

    var sold = shop.sold || [];
    shop.cards.forEach(function (one, slot) {
      var card = EGE.cards.byId(one.card);
      if (!card) { return; }
      var gone = sold.indexOf(slot) !== -1;
      var cost = EGE.cards.shopPrice(one.rarity);
      var tile = el('div', 'ege-daily__item' + (gone ? ' is-sold' : '') +
        (one.rarity === 'legendary' ? ' ege-daily__item--top' : ''));

      var face = cardEl(card, {});
      pressable(face, describe(card), function () { zoom(card, { owned: state.owned[card.id] || 0 }); });
      tile.appendChild(face);
      if (gone) { tile.appendChild(el('span', 'ege-daily__sold', 'Sold')); }

      var buy = el('button', 'fb-btn fb-btn--primary fb-btn--block ege-daily__buy');
      buy.type = 'button';
      if (gone) {
        buy.textContent = 'Sold';
        buy.disabled = true;
      } else {
        buy.appendChild(document.createTextNode('Buy · '));
        buy.appendChild(price(cost));
        buy.disabled = !state.loaded || state.diamonds === null || state.diamonds < cost;
        buy.addEventListener('click', function () { buyDaily(slot, card, buy); });
      }
      tile.appendChild(buy);
      holder.appendChild(tile);
    });
  }

  function buyDaily(slot, card, button) {
    button.disabled = true;
    say('', false);
    EGE.cardStore.buyShopCard(slot).then(function (res) {
      if (!res.ok) {
        say(res.message, true);
        refresh();
        return;
      }
      var isNew = !state.owned[card.id];
      if (state.shop && state.shop.sold) { state.shop.sold.push(slot); }
      state.hold = true;
      walletChanged(null, res.diamonds);
      renderPacks();
      renderDaily();
      openRip({ title: 'Bought from the shop', cards: [card], isNew: [isNew],
                onClose: function () { reveal([card], [isNew]); } });
    });
  }

  /* --- the market ---------------------------------------------------------- */

  function listingsLeft() {
    var mine = (state.market && state.market.mine) || [];
    return Math.max(0, EGE.cards.MARKET.perDay - mine.length);
  }

  function hoursLeft(iso) {
    var ms = new Date(iso).getTime() - Date.now();
    if (isNaN(ms) || ms <= 0) { return 'ending'; }
    var hours = Math.floor(ms / 3600000);
    return hours ? hours + 'h left' : Math.max(1, Math.ceil(ms / 60000)) + 'm left';
  }

  function listingEl(row) {
    var card = EGE.cards.byId(row.card_id);
    if (!card) { return null; }
    var mine = row.email.toLowerCase() === me();
    var tile = el('div', 'ege-listing' + (mine ? ' is-mine' : ''));

    var face = cardEl(card, {});
    pressable(face, describe(card), function () { zoom(card, { owned: state.owned[card.id] || 0 }); });
    tile.appendChild(face);

    var who = el('div', 'ege-listing__who');
    who.appendChild(el('strong', null, mine ? 'Yours' : firstName(row.email)));
    who.appendChild(el('span', 'fb-meta', hoursLeft(row.expires_at)));
    tile.appendChild(who);

    var button;
    if (mine) {
      button = actionButton('Take it down', 'fb-btn--block', function (b) { cancelListing(row, b); });
    } else {
      button = el('button', 'fb-btn fb-btn--primary fb-btn--sm fb-btn--block');
      button.type = 'button';
      button.appendChild(document.createTextNode('Buy · '));
      button.appendChild(price(row.price));
      button.disabled = state.diamonds === null || state.diamonds < row.price;
      button.addEventListener('click', function () { buyListing(row, card, button); });
    }
    if (mine) {
      var asking = el('span', 'ege-listing__price');
      asking.appendChild(document.createTextNode('Asking '));
      asking.appendChild(price(row.price));
      tile.appendChild(asking);
    }
    tile.appendChild(button);
    return tile;
  }

  function renderMarket() {
    var holder = byId('marketList');
    holder.innerHTML = '';
    var m = state.market;

    byId('marketSell').disabled = !state.loaded || !m || !listingsLeft() || !ownedIds().length;
    byId('marketCount').textContent = m ? listingsLeft() + ' of ' + EGE.cards.MARKET.perDay + ' listings left today' : '';

    if (!m) {
      holder.appendChild(el('p', 'fb-meta', state.loaded
        ? 'The market could not be loaded. Run supabase/schema.sql to set it up, then reload.'
        : 'Loading…'));
      return;
    }

    var mine = m.open.filter(function (row) { return row.email.toLowerCase() === me(); });
    var theirs = m.open.filter(function (row) { return row.email.toLowerCase() !== me(); });

    [['Your listings', mine], ['For sale', theirs]].forEach(function (group) {
      var section = el('section', 'ege-library__group');
      section.appendChild(el('h4', 'ege-library__title', group[0]));
      var grid = el('div', 'ege-market__grid');
      group[1].forEach(function (row) {
        var tile = listingEl(row);
        if (tile) { grid.appendChild(tile); }
      });
      if (!grid.children.length) {
        grid.appendChild(el('p', 'fb-meta', group[1] === mine
          ? 'Nothing of yours is up. Sell a card to put one here.'
          : 'Nobody else has anything up right now.'));
      }
      section.appendChild(grid);
      holder.appendChild(section);
    });
  }

  function cancelListing(row, button) {
    button.disabled = true;
    say('', false);
    EGE.cardStore.cancelListing(row.id).then(function (res) {
      if (!res.ok) { say(res.message, true); button.disabled = false; return; }
      refresh();
    });
  }

  function buyListing(row, card, button) {
    button.disabled = true;
    say('', false);
    EGE.cardStore.buyListing(row.id).then(function (res) {
      if (!res.ok) { say(res.message, true); refresh(); return; }
      var isNew = !state.owned[card.id];
      state.hold = true;
      walletChanged(null, res.diamonds);
      renderPacks();
      openRip({ title: 'Bought from ' + firstName(row.email), cards: [card], isNew: [isNew],
                onClose: function () { reveal([card], [isNew]); } });
    });
  }

  /* Picking a card to sell, then its price. */
  function openSellPicker() {
    var pickState = { card: null, rarity: 'all' };
    var stage = openOverlay('Sell a card', 'ege-rip__stage--trade');
    var panel = el('div', 'fb-panel ege-tradebuilder');
    stage.appendChild(panel);

    var head = el('div', 'fb-panel__head');
    head.appendChild(el('span', 'fb-meta', 'Pick a card, then your price. ' +
      listingsLeft() + ' of ' + EGE.cards.MARKET.perDay + ' listings left today.'));
    panel.appendChild(head);

    var col = el('div', 'ege-tradecol ege-sellpick');
    panel.appendChild(col);

    var foot = el('div', 'fb-panel__foot');
    var summary = el('span', 'fb-meta', 'Pick one of your cards.');
    var priceLabel = el('label', 'ege-field ege-field--inline');
    priceLabel.appendChild(el('span', 'fb-eyebrow', 'Price'));
    var input = el('input', 'fb-input ege-swap__input');
    input.type = 'number';
    input.min = String(EGE.cards.MARKET.minPrice);
    input.max = String(EGE.cards.MARKET.maxPrice);
    input.step = '1';
    input.inputMode = 'numeric';
    priceLabel.appendChild(input);
    priceLabel.appendChild(gem());
    var send = el('button', 'fb-btn fb-btn--primary', 'Put it up');
    send.type = 'button';
    foot.appendChild(summary);
    foot.appendChild(priceLabel);
    foot.appendChild(send);
    panel.appendChild(foot);

    function amount() {
      var n = Math.floor(Number(input.value));
      return n >= EGE.cards.MARKET.minPrice && n <= EGE.cards.MARKET.maxPrice ? n : 0;
    }

    function draw() {
      col.innerHTML = '';
      var filter = el('select', 'fb-select ege-filterselect');
      filter.setAttribute('aria-label', 'Rarity');
      filter.appendChild(new Option('Every rarity', 'all'));
      EGE.cards.RARITIES.forEach(function (r) { filter.appendChild(new Option(r.name, r.key)); });
      filter.value = pickState.rarity;
      filter.addEventListener('change', function () { pickState.rarity = filter.value; draw(); });
      col.appendChild(filter);

      var cards = ownedIds().map(EGE.cards.byId).filter(function (c) {
        return c && (pickState.rarity === 'all' || c.rarity === pickState.rarity);
      }).sort(EGE.cards.compare);
      var grid = el('div', 'ege-tradegrid');
      cards.forEach(function (card) {
        var on = pickState.card === card;
        var node = cardEl(card, { count: state.owned[card.id] });
        if (on) { node.classList.add('is-picked'); }
        node.setAttribute('aria-pressed', on ? 'true' : 'false');
        pressable(node, describe(card), function () {
          pickState.card = on ? null : card;
          /* A starting price: what the shop would charge for it. */
          if (pickState.card && !input.value) {
            input.value = String(EGE.cards.shopPrice(card.rarity) || 30);
          }
          draw();
        });
        grid.appendChild(node);
      });
      if (!cards.length) { grid.appendChild(el('p', 'fb-meta', 'No cards of yours here.')); }
      col.appendChild(grid);
      update();
    }

    function update() {
      var card = pickState.card;
      summary.textContent = card
        ? EGE.cards.rarity(card.rarity).name + ' ' + card.player.first + ', ' + card.headline +
          (amount() ? ', for ' + amount() + (amount() === 1 ? ' diamond.' : ' diamonds.') : '. Pick a price from 1 to 999.')
        : 'Pick one of your cards.';
      send.disabled = !card || !amount() || !listingsLeft();
    }

    input.addEventListener('input', update);
    send.addEventListener('click', function () {
      send.disabled = true;
      var card = pickState.card;
      EGE.cardStore.listCard(card, amount()).then(function (res) {
        if (!res.ok) { summary.textContent = res.message; send.disabled = false; return; }
        closeRip();
        say('', false);
        if (EGE.showcase) { EGE.showcase.forget(); }
        refresh();
      });
    });

    draw();
    panel.tabIndex = -1;
    panel.focus({ preventScroll: true });
  }

  /* --- drawing and loading ---------------------------------------------- */

  function renderAll() {
    renderPacks();
    renderSpin();
    if (state.hold) { return; }
    renderRecent();
    if (state.tab === 'cards') { renderCollection(); }
    renderPlayerCards();
    renderDaily();
    renderMarket();
    renderTrades();
    renderLibrary();
  }

  function build() {
    if (built) { return; }
    built = true;
    renderFilters();
    /* A tap outside the phone's Sort menu closes it. A pick inside it redraws
       the menu, so a tap on something no longer in the page was inside. */
    document.addEventListener('click', function (event) {
      if (!state.filtersOpen || !event.target.isConnected) { return; }
      if (!byId('collectionFilters').contains(event.target)) { openFilters(false); }
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && state.filtersOpen) { openFilters(false); }
    });
    byId('tradeNew').addEventListener('click', function () { openTradeBuilder(null); });
    byId('marketSell').addEventListener('click', openSellPicker);
    byId('spinGo').addEventListener('click', doSpin);
    /* The countdown to the next spin, and the wheel coming free again at
       7:00 AM Central with the page left open. */
    window.setInterval(function () {
      if (state.player && state.loaded && !state.spinning) { renderSpin(); }
    }, 30000);
    Array.prototype.forEach.call(document.querySelectorAll('#cardTabs input'), function (input) {
      input.addEventListener('change', function () { if (input.checked) { setTab(input.value); } });
    });
    renderRankTable();
    byId('swapCredits').addEventListener('input', renderSwap);
    byId('swapBuy').addEventListener('click', buySwap);
    byId('recentMore').addEventListener('click', function () {
      state.recentShown += RECENT_STEP;
      renderRecent();
    });
  }

  function refresh() {
    var player = state.player;
    if (!player) { return Promise.resolve(); }

    refreshing += 1;
    return Promise.all([
      EGE.cardStore.collectionFor(player.email),
      EGE.cardStore.claimsFor(player.email),
      EGE.wallet.creditsFor(player.email),
      EGE.cardStore.tradesFor(player.email),
      EGE.wallet.diamondsFor(player.email),
      EGE.cardStore.recentOpens(RECENT_MAX),
      loadOther(),
      EGE.cardStore.playerCardAwards(player.email),
      EGE.cardStore.shopToday(),
      EGE.cardStore.market(player.email),
      EGE.cardStore.cardPhotos(player.email),
      loadPcOther(),
      EGE.cardStore.spinToday()
    ]).then(function (all) {
      if (state.player !== player) { return; }
      if (all[0] === null) {
        say('Your cards could not be loaded. Run supabase/schema.sql to set up the card tables, then reload.', true);
      } else {
        state.owned = all[0].owned;
        state.first = all[0].first;
      }
      state.claims = all[1];
      state.credits = all[2];
      state.trades = all[3];
      state.diamonds = all[4];
      state.recent = all[5];
      state.pcAwards = all[7];
      state.shop = all[8];
      state.market = all[9];
      state.photos = all[10];
      state.spin = all[12];
      state.loaded = all[0] !== null;
      if (all[4] === null && all[0] !== null) {
        say('Your diamonds could not be loaded. Run supabase/schema.sql to set up the diamond tables, then reload.', true);
      }
      renderAll();
      /* A Trade for it from off the Cards tab, now there is a collection
         to give from. */
      if (pendingAsk && state.loaded && !state.hold && !rip && /^#cards(\/|$)/.test(window.location.hash)) {
        var ask = pendingAsk;
        pendingAsk = null;
        setTab('trades');
        openTradeBuilder(ask);
      }
    }).then(function () { refreshing -= 1; }, function () { refreshing -= 1; });
  }

  /* --- keeping up in the background --------------------------------------

     js/app.js calls poll() every so often while a Cards page is on screen,
     so an offer, a card sold off the shelf or the market, somebody else's
     pack, or diamonds from a sale turn up without a reload. It asks for a
     little -- where each trade stands and the balance, and on the Shop page
     the shelf, the market and the recent pulls -- and redraws only the part
     that is different, so a check that finds nothing new touches nothing.

     Nothing is redrawn while it would be pulled out from under somebody: a
     pack, a card up close, the trade builder or the crop tool (anything in
     the overlay), the phone's Sort menu, a box being typed in, a refresh
     already on its way, or a tap in the last few seconds that may still be
     waiting on its answer. The next check tries again. `full` reads
     everything again, for a week just out; held over to the next check
     when now is not the moment. */
  var refreshing = 0;
  var polling = false;
  var touched = 0;
  var owedFull = false;
  var TOUCH_QUIET = 4000;

  ['pointerdown', 'keydown'].forEach(function (type) {
    document.addEventListener(type, function () { touched = Date.now(); }, true);
  });

  function busy() {
    if (state.hold || rip || state.filtersOpen || state.sell || refreshing || polling || state.spinning) { return true; }
    if (Date.now() - touched < TOUCH_QUIET) { return true; }
    var a = document.activeElement;
    return Boolean(a && (a.tagName === 'TEXTAREA' || a.tagName === 'SELECT' ||
      (a.tagName === 'INPUT' && !/^(radio|checkbox|button|submit)$/.test(a.type))));
  }

  /* Where each trade stands, as one string: a new offer, an answer, or an
     offer seen on another device all change it. */
  function tradeSig(trades) {
    return (trades || []).map(function (t) {
      return t.id + ':' + t.status + (t.seen_at ? ':seen' : '');
    }).sort().join(',');
  }

  var pollCount = 0;

  function poll(full) {
    var player = state.player;
    if (!player || !state.loaded || !/^#cards(\/|$)/.test(window.location.hash)) { return Promise.resolve(); }
    if (full) { owedFull = true; }
    if (busy()) { return Promise.resolve(); }
    if (owedFull) {
      owedFull = false;
      return refresh();
    }

    /* The shelf, the market and the recent pulls only on the Shop page,
       and every other check: they are what changes least often. */
    pollCount += 1;
    var shop = state.tab === 'shop' && pollCount % 2 === 0;
    polling = true;
    return Promise.all([
      EGE.cardStore.tradeStates(player.email),
      EGE.wallet.diamondsFor(player.email),
      shop ? EGE.cardStore.shopToday() : null,
      shop ? EGE.cardStore.market(player.email) : null,
      shop ? EGE.cardStore.recentOpens(RECENT_MAX) : null
    ]).then(function (got) {
      polling = false;
      if (state.player !== player || busy()) { return; }

      /* A trade moved: read them all again, and the collection with them
         when one went through, since that changed what is in it. */
      if (got[0] && tradeSig(got[0]) !== tradeSig(state.trades)) {
        var done = got[0].some(function (t) {
          return t.status === 'accepted' && !state.trades.some(function (old) {
            return old.id === t.id && old.status === 'accepted';
          });
        });
        return done ? refresh() : EGE.cardStore.tradesFor(player.email).then(function (trades) {
          /* An empty answer to a non-empty check is a read that failed. */
          if (state.player !== player || busy() || (!trades.length && got[0].length)) { return; }
          state.trades = trades;
          renderTrades();
        });
      }

      /* The balance moved on its own -- a listing sold, a game paid out:
         the nav, and every price it decides can be paid. */
      if (typeof got[1] === 'number' && got[1] !== state.diamonds) {
        walletChanged(null, got[1]);
        renderPacks();
        renderDaily();
        renderMarket();
      }

      if (got[2] && JSON.stringify(got[2]) !== JSON.stringify(state.shop)) {
        state.shop = got[2];
        renderDaily();
      }
      if (got[3] && JSON.stringify(got[3]) !== JSON.stringify(state.market)) {
        state.market = got[3];
        renderMarket();
      }
      if (got[4] && JSON.stringify(got[4]) !== JSON.stringify(state.recent)) {
        state.recent = got[4];
        renderRecent();
      }
    }, function () { polling = false; });
  }

  /* Called by js/app.js whenever #cards is shown; `tab` is the page from
     #cards/{tab}, or nothing to stay on the one showing. */
  function render(tab) {
    var player = EGE.auth.currentPlayer();
    byId('cardsLocked').hidden = Boolean(player);
    byId('cardsContent').hidden = !player;

    if (!player) { pendingAsk = null; reset(); return; }
    if (state.player !== player) {
      reset();
      state.player = player;
    }
    build();
    setTab(tab || state.tab, true);
    renderFilters();
    renderAll();
    owedFull = false;
    refresh();
  }

  /* Signed out: forget everything this page knew. */
  function reset() {
    closeRip();
    state.player = null;
    state.owned = {};
    state.first = {};
    state.claims = {};
    state.credits = null;
    state.diamonds = null;
    state.loaded = false;
    state.fresh = {};
    state.newTrades = {};
    state.trades = [];
    state.hold = false;
    state.view = null;
    state.other = null;
    state.recent = null;
    state.recentShown = RECENT_STEP;
    state.pcAwards = null;
    state.shop = null;
    state.market = null;
    state.photos = null;
    state.pcView = null;
    state.pcOther = null;
    state.spin = null;
    state.spinning = false;
    if (state.sell) { window.clearTimeout(state.sell.timer); }
    state.sell = null;
    var panel = byId('collectionPanel');
    if (panel) { panel.classList.remove('is-selling'); }
    var bar = byId('sellBar');
    if (bar) { bar.hidden = true; }
    wheel.prize = null;
    binder.key = null;
    binder.sig = null;
    setBadge(0);
  }

  /* --- the admin's demo packs -------------------------------------------

     A pack ripped on the admin page to try the openings out: rolled the
     way a real one is, opened in the same overlay, and nothing else --
     nothing is paid and nothing goes into anybody's collection. `best`
     makes the last card a Legendary, Mystic or Iconic, so the big pulls can
     be seen without waiting for the odds. Hands back { ok, message }. */
  function demoPack(packKey, best) {
    var pack = EGE.cards.pack(packKey);
    if (!pack) { return { ok: false, message: 'There is no such pack.' }; }
    var cards = EGE.cards.rollPack(packKey);
    if (cards.length !== pack.size) {
      return { ok: false, message: 'Not enough cards are out yet to fill a ' + pack.name + '.' };
    }

    var message = '';
    if (best) {
      var pool = EGE.cards.pullable(packKey).filter(function (c) { return c.rarity === best; });
      if (!pool.length) { pool = EGE.cards.pullable(null).filter(function (c) { return c.rarity === best; }); }
      if (pool.length) {
        /* Still one card above Legendary at most, still no more
           Legendary-or-better than the pack holds, and still worst to
           best, with the chosen one last. */
        var legend = EGE.cards.rankOf('legendary');
        var room = EGE.cards.legendaryCap(pack) - 1;
        var bigRoom = EGE.cards.rankOf(best) > legend ? 0 : 1;
        cards = cards.slice(0, -1).map(function (c) {
          var r = EGE.cards.rankOf(c.rarity);
          if (r < legend) { return c; }
          if (room > 0 && (r === legend || bigRoom > 0)) {
            room -= 1;
            if (r > legend) { bigRoom -= 1; }
            return c;
          }
          return EGE.cards.rollPack(packKey)[0];
        }).filter(Boolean);
        cards = EGE.cards.packOrder(cards).concat([pool[Math.floor(Math.random() * pool.length)]]);
      } else {
        message = 'No ' + EGE.cards.rarity(best).name + ' card is out yet, so this pack came out as it rolled.';
      }
    }

    openRip({
      pack: pack,
      cards: cards,
      isNew: cards.map(function () { return false; }),
      title: pack.name + ' (demo)',
      demo: true,
      again: function () { demoPack(packKey, best); }
    });
    return { ok: true, message: message };
  }

  /* What the showcase on a player page and the admin panel draw with. */
  return {
    render: render,
    reset: reset,
    poll: poll,
    refreshBadge: refreshBadge,
    cardEl: cardEl,
    playerCardFace: playerCardFace,
    describe: describe,
    pressable: pressable,
    zoom: zoom,
    zoomPlayer: zoomPlayer,
    openOverlay: openOverlay,
    closeOverlay: closeRip,
    demoPack: demoPack
  };
})();
