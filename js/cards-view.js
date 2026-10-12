/* ==========================================================================
   EGE Football — the Cards tab
   Packs to buy and rip, the collection they fill, and the library of sets
   to put together. A tab of its own, away from the simulation: nothing on
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
    trades: [],         /* every trade this player is on either side of */
    hold: false,        /* a pack is open: show nothing it holds until Done */
    view: null,         /* whose collection the binder shows: null for yours, else their email */
    other: null,        /* that player's { owned, first }; null while it loads */
    recent: null,       /* the last packs opened, newest first; null until read */
    recentShown: 4,     /* how many recent pulls are drawn */
    filter: { rarity: 'all', kind: 'all', player: 'all', sort: 'rarity' }
  };

  var built = false;

  /* --- helpers ---------------------------------------------------------- */

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text != null) { node.textContent = text; }
    return node;
  }

  function byId(id) { return document.getElementById(id); }

  function say(text, isError) {
    var node = byId('cardsMessage');
    node.textContent = text || '';
    node.hidden = !text;
    node.className = 'ege-note' + (isError ? ' ege-note--error' : ' ege-note--ok');
  }

  function coin() {
    var c = el('span', 'ege-coin');
    c.setAttribute('role', 'img');
    c.setAttribute('aria-label', 'credits');
    return c;
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

  function creditPrice(credits) {
    var box = el('span', 'ege-price', String(credits));
    box.appendChild(coin());
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
    return card.player.name + ', ' + r.name + ' ' + (card.kind === 'play' ? 'play' : 'performance') +
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

    var node = el('div', 'ege-tcard ege-tcard--' + card.rarity + ' ege-tcard--' + card.kind);
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
    foot.appendChild(el('span', 'ege-tcard__rarity', r.name));
    foot.appendChild(el('span', 'ege-tcard__when',
      (card.event ? card.event : 'Wk ' + card.week) + ' \u00b7 ' + card.season));
    face.appendChild(foot);

    node.appendChild(face);

    if (opts.count > 1) { node.appendChild(el('span', 'ege-tcard__count', '\u00d7' + opts.count)); }
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

  function packArt(pack) {
    var art = el('div', 'ege-pack ege-pack--' + pack.key);
    art.appendChild(el('span', 'ege-pack__top'));
    var body = el('span', 'ege-pack__body');
    body.appendChild(el('span', 'ege-pack__brand', 'EGE Football'));
    body.appendChild(el('span', 'ege-pack__name', pack.name.replace(/ Pack$/, '')));
    body.appendChild(el('span', 'ege-pack__count',
      pack.size + ' cards' +
      (pack.seasonOnly ? ' \u00b7 ' + EGE.currentSeason : '')));
    art.appendChild(body);
    return art;
  }

  function renderPacks() {
    var holder = byId('cardPacks');
    holder.innerHTML = '';

    EGE.cards.PACKS.forEach(function (pack) {
      var tile = el('div', 'ege-packtile');
      tile.appendChild(packArt(pack));

      var words = el('div', 'ege-packtile__words');
      words.appendChild(el('h4', 'ege-item__name', pack.name));
      words.appendChild(el('p', 'ege-item__text', pack.blurb));

      var pool = EGE.cards.pullable(pack.key);
      var buy = el('button', 'fb-btn fb-btn--primary fb-btn--block ege-packtile__buy');
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
      if (why) { words.appendChild(el('p', 'ege-item__blocked', why)); }

      buy.addEventListener('click', function () { buyPack(pack, buy); });
      words.appendChild(buy);
      tile.appendChild(words);
      holder.appendChild(tile);
    });

    byId('cardsBalance').textContent = state.diamonds === null ? '\u2014' : state.diamonds;
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

    var have = byId('swapHave');
    have.innerHTML = '';
    if (state.credits === null) { return; }
    have.appendChild(document.createTextNode('You have '));
    have.appendChild(creditPrice(state.credits));
    have.appendChild(document.createTextNode(spend > state.credits
      ? '. That is more than you have.'
      : '. This costs ' + spend + (spend === 1 ? ' credit.' : ' credits.')));
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
      say(res.message, false);
      renderPacks();
    });
  }

  function buyPack(pack, button) {
    if (button) { button.disabled = true; }
    say('', false);
    var before = Object.assign({}, state.owned);

    return EGE.cardStore.openPack(pack.key).then(function (res) {
      if (!res.ok) {
        say(res.message, true);
        renderPacks();
        return;
      }

      /* New is the first of a card ever, so a pack with two of something
         new calls only the first one new. */
      var seen = Object.assign({}, before);
      var isNew = res.cards.map(function (card) {
        var first = !seen[card.id];
        seen[card.id] = (seen[card.id] || 0) + 1;
        return first;
      });

      /* The cards are the player's now, but the collection, the library
         and the counts stay as they were until the pack is put away --
         otherwise they give the pack away before a card is turned over. */
      state.hold = true;
      walletChanged(null, res.diamonds);
      renderPacks();

      openRip({ pack: pack, cards: res.cards, isNew: isNew,
                onClose: function () { reveal(res.cards, isNew); } });
    });
  }

  /* --- ripping one open ------------------------------------------------- */

  var rip = null;

  function closeRip() {
    if (!rip) { return; }
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
    rip.node.querySelector('.ege-rip__hint').textContent = rip.summary || '';
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
    if (!packNode || packNode.classList.contains('is-torn')) { return; }
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
     and nothing goes anywhere, and `again` rips another one. */
  function openRip(options) {
    var node = byId('cardRip');
    node.innerHTML = '';
    delete node.dataset.fx;
    rip = { node: node, pack: options.pack || null, returnTo: document.activeElement,
            onClose: options.onClose || null, again: options.again || null };

    var best = options.cards.slice().sort(EGE.cards.compare)[0];
    var fresh = options.isNew.filter(Boolean).length;
    var bestText = best && options.cards.length > 1
      ? 'Best pull: ' + EGE.cards.rarity(best.rarity).name + ' ' + best.player.first + '. ' : '';
    rip.summary = options.demo
      ? bestText + 'A demo: nothing went into anybody\u2019s collection.'
      : (options.extras && options.extras.length ? options.extras.join(' \u00b7 ') + '. ' : '') + bestText +
        (options.cards.length > 1 ? fresh + ' new to your collection.' : (fresh ? 'New to your collection.' : 'One you had already.'));

    var stage = el('div', 'ege-rip__stage');

    var head = el('div', 'ege-rip__head');
    head.appendChild(el('h2', 'ege-rip__title', options.title || (options.pack && options.pack.name)));
    var close = el('button', 'fb-modal__close ege-rip__close', '\u00d7');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close');
    close.addEventListener('click', closeRip);
    head.appendChild(close);
    stage.appendChild(head);

    if (options.pack) {
      var packNode = pressable(el('div', 'ege-rip__pack'), 'Tear the pack open', tearOpen);
      /* A pack with a Legendary or better in it lets out a little of its
         light as it tears. */
      if (best && EGE.cards.rankOf(best.rarity) >= EGE.cards.rankOf('legendary')) {
        packNode.classList.add('has-glow');
        packNode.style.setProperty('--glow', EGE.cards.rarity(best.rarity).color);
      }
      packNode.appendChild(packArt(options.pack));
      packNode.appendChild(el('span', 'ege-rip__tear', 'Tap to rip'));
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
      pressable(flip, 'Card ' + (i + 1) + ', face down. Turn it over.', function () { flipCard(flip); });

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

    stage.appendChild(el('p', 'ege-rip__hint', options.pack ? 'Tap the pack to tear it open.' : ''));

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

    if (options.pack) {
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
     else's card, on a showcase or in a trade. `theirs` is { name, count }
     when it is from somebody else's collection, and `sell` offers a quick
     sale of one copy when it is from your own. */
  function zoom(card, options) {
    var opts = options || {};
    var stage = openOverlay(card.player.name, 'ege-rip__stage--zoom');

    var row = el('div', 'ege-rip__cards ege-rip__cards--1');
    var holder = el('div', 'ege-zoom__card');
    holder.appendChild(cardEl(card, {}));
    row.appendChild(holder);
    stage.appendChild(row);

    var r = EGE.cards.rarity(card.rarity);
    var facts = el('dl', 'ege-zoom__facts');
    function fact(label, value) {
      facts.appendChild(el('dt', null, label));
      return facts.appendChild(el('dd', null, value));
    }

    /* The stat line, and beside it a button to the game itself: the
       player's page, on this card's season, at this game in the log. */
    function lineFact(label, value) {
      facts.appendChild(el('dt', null, label));
      var dd = el('dd', 'ege-zoom__line');
      dd.appendChild(el('span', null, value));
      var go = el('button', 'fb-btn fb-btn--sm ege-zoom__go', '\u2192');
      go.type = 'button';
      go.title = 'Open ' + card.player.first + '\u2019s game log at this game';
      go.setAttribute('aria-label', go.title);
      go.addEventListener('click', function () {
        closeRip();
        EGE.goToGame(card.slug, card.season, card.week);
      });
      dd.appendChild(go);
      facts.appendChild(dd);
    }
    fact('Rarity', r.name + ' \u00b7 ' + r.odds + '% of pulls');
    fact('Fantasy', points(card.points) + ' points');
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
    stage.appendChild(facts);

    var status = el('p', 'ege-rip__hint ege-zoom__status');
    status.setAttribute('role', 'status');
    stage.appendChild(status);

    var actions = el('div', 'ege-rip__actions');
    if (opts.sell && opts.owned > 0) {
      actions.appendChild(sellControl(card, { holder: holder, owned: ownedNode, status: status }));
    }
    var done = el('button', 'fb-btn fb-btn--primary', 'Done');
    done.type = 'button';
    done.addEventListener('click', closeRip);
    actions.appendChild(done);
    stage.appendChild(actions);
    done.focus({ preventScroll: true });
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

    /* One line: the three kinds as buttons the height of the drop-downs
       beside them, then whose, who, the order, and the rarity. */
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
    rarity.value = f.rarity;
    rarity.addEventListener('change', function () { pick('rarity', rarity.value); });
    rest.appendChild(rarity);

    bar.appendChild(rest);
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
      return (f.rarity === 'all' || card.rarity === f.rarity) &&
        (f.kind === 'all' || card.kind === f.kind) &&
        (f.player === 'all' || card.slug === f.player);
    }).sort(sorter(f.sort, v.first));

    fillBinder(grid, shown, v);

    byId('collectionTitle').textContent = v.mine ? 'Your Collection' : v.name + '’s Collection';

    var copies = Object.keys(v.owned).reduce(function (sum, id) { return sum + v.owned[id]; }, 0);
    var out = EGE.cards.pullable(null).length;
    byId('collectionCount').textContent = v.loaded && !v.failed
      ? copies + (copies === 1 ? ' card' : ' cards') + ' · ' + mine.length + ' of ' + out + ' different'
      : v.failed ? '' : 'Loading…';

    fitBinder();

    var empty = byId('collectionEmpty');
    empty.hidden = !v.loaded || shown.length > 0;
    if (v.mine) {
      empty.textContent = mine.length
        ? 'Nothing you own matches that. Try another filter.'
        : 'No cards yet. Rip a pack and they land here.';
    } else {
      empty.textContent = v.failed ? v.name + '’s cards could not be loaded.'
        : mine.length ? 'Nothing of ' + v.name + '’s matches that. Try another filter.'
        : v.name + ' has no cards yet.';
    }
  }

  /* --- the binder, a few rows at a time -----------------------------------

     Drawing every card at once is a lot of foil for a phone to run, so the
     binder draws its first few rows and adds more as it is scrolled: an
     empty marker sits after the last card drawn, and when it comes within a
     couple of rows of the bottom of the binder the next rows go in. Drawing
     the same view again -- after a sale, a pack, a refresh -- keeps as many
     cards as were drawn and the place it was scrolled to. */
  var binder = { key: null, cards: [], view: null, drawn: 0, season: null, marker: null, watch: null };

  /* How many cards fit across, read off the grid itself. */
  function perRow(grid) {
    var cols = window.getComputedStyle(grid).gridTemplateColumns;
    var n = cols && cols !== 'none' ? cols.trim().split(/\s+/).length : 0;
    return n || 5;
  }

  function fillBinder(grid, cards, v) {
    var f = state.filter;
    var key = [state.view || '', f.kind, f.player, f.sort, f.rarity].join('|');
    var same = key === binder.key;
    var keep = same ? binder.drawn : 0;
    var top = same ? grid.scrollTop : 0;

    if (binder.watch && binder.marker) { binder.watch.unobserve(binder.marker); }
    grid.innerHTML = '';
    binder.key = key;
    binder.cards = cards;
    binder.view = v;
    binder.drawn = 0;
    binder.season = null;

    drawMore(grid, Math.max(keep, perRow(grid) * 4));
    grid.scrollTop = top;
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
      }, { root: grid, rootMargin: '0px 0px 480px 0px' });
    }
    grid.appendChild(binder.marker);
    /* Watched afresh each time it moves, so it is checked again straight
       away: still in reach means another few rows. */
    binder.watch.unobserve(binder.marker);
    binder.watch.observe(binder.marker);
  }

  function binderCard(card, v) {
    var count = v.owned[card.id] || 0;
    var node = cardEl(card, { count: count, isNew: v.mine && state.fresh[card.id] });
    pressable(node, describe(card) + (count > 1 ? ', ' + count + ' owned' : ''), function () {
      if (v.mine) {
        zoom(card, { owned: state.owned[card.id] || 0, sell: true });
      } else {
        zoom(card, { owned: state.owned[card.id] || 0,
                     theirs: { name: v.name, count: (state.other && state.other.owned[card.id]) || 0 } });
      }
    });
    return node;
  }

  /* Three rows of cards and no more: past that the collection scrolls in
     its own box, so the rest of the page is never a long way down. How tall
     three rows are depends on how wide the cards came out, so it is measured
     off a card, and measured again whenever the width changes. */
  var BINDER_ROWS = 3;
  var binderWatch = null;

  function fitBinder() {
    var grid = byId('collectionGrid');
    var card = grid.querySelector('.ege-tcard');
    if (!card || !card.offsetHeight) { grid.style.maxHeight = ''; }
    else {
      var css = window.getComputedStyle(grid);
      var gap = parseFloat(css.rowGap) || 0;
      var pad = (parseFloat(css.paddingTop) || 0) + (parseFloat(css.paddingBottom) || 0);
      grid.style.maxHeight = Math.ceil(card.offsetHeight * BINDER_ROWS + gap * (BINDER_ROWS - 1) + pad) + 'px';
    }
    if (!binderWatch && window.ResizeObserver) {
      var width = grid.clientWidth;
      binderWatch = new window.ResizeObserver(function () {
        if (grid.clientWidth === width) { return; }
        width = grid.clientWidth;
        fitBinder();
      });
      binderWatch.observe(grid);
    }
  }

  /* --- recent pulls -------------------------------------------------------

     The last packs opened and set rewards pulled, newest first, so a pull
     can be found again once the pack is put away. Packs come from
     card_packs, which only the player and an admin can read; rewards from
     the claims already loaded. Like the collection, held back while a pack
     is open. */
  var RECENT_STEP = 4;
  var RECENT_MAX = 20;

  function pulls() {
    var list = (state.recent || []).map(function (row) {
      var pack = EGE.cards.pack(row.pack_key);
      return { title: pack ? pack.name : 'Pack', when: row.opened_at, cards: row.cards || [] };
    });
    var sets = EGE.cards.sets();
    Object.keys(state.claims).forEach(function (key) {
      var claim = state.claims[key];
      var card = claim.reward && claim.reward.card;
      if (!card) { return; }
      var set = sets.filter(function (one) { return one.key === key; })[0];
      list.push({ title: (set ? set.name : 'Library') + ' reward', when: claim.claimed_at, cards: [card] });
    });
    return list.sort(function (a, b) {
      return a.when < b.when ? 1 : a.when > b.when ? -1 : 0;
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
      head.appendChild(el('strong', 'ege-pull__title', pull.title));
      head.appendChild(el('span', 'fb-meta', agoText(pull.when)));
      tile.appendChild(head);

      var strip = el('div', 'ege-pull__cards');
      pull.cards.map(EGE.cards.byId).filter(Boolean).forEach(function (card) {
        var have = state.owned[card.id] || 0;
        var node = cardEl(card, {});
        if (!have) { node.classList.add('is-gone'); }
        pressable(node, describe(card) + (have ? '' : ', no longer in your collection'), function () {
          zoom(card, { owned: state.owned[card.id] || 0, sell: true });
        });
        strip.appendChild(node);
      });
      tile.appendChild(strip);
      holder.appendChild(tile);
    });

    if (!list.length) {
      holder.appendChild(el('p', 'fb-meta', state.recent === null
        ? (state.loaded ? 'Your recent pulls could not be loaded.' : 'Loading…')
        : 'Nothing pulled yet. Rip a pack and it shows up here.'));
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
      if (res.status === 'accepted') {
        say('Trade done with ' + firstName(t.from_email) + '. The cards are in your collection.', false);
      } else if (res.status === 'expired') {
        say('That trade cannot go through any more: one of you no longer has a card it was for.', true);
      } else if (res.status === 'declined') {
        say('Declined.', false);
      } else {
        say('Offer taken back.', false);
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
    setBadge(incoming.length);
  }

  /* --- the trade builder ------------------------------------------------- */

  function openTradeBuilder() {
    var build = { to: null, give: [], take: [], theirs: null, filterMine: 'all', filterTheirs: 'all' };
    var stage = openOverlay('Propose a trade', 'ege-rip__stage--trade');
    var panel = el('div', 'fb-panel ege-tradebuilder');
    stage.appendChild(panel);

    var head = el('div', 'fb-panel__head');
    var pickLabel = el('label', 'ege-field ege-field--inline');
    pickLabel.appendChild(el('span', 'fb-eyebrow', 'Trade with'));
    var pick = el('select', 'fb-select');
    partners().forEach(function (p) { pick.appendChild(new Option(p.name, p.email)); });
    pickLabel.appendChild(pick);
    head.appendChild(pickLabel);
    panel.appendChild(head);

    var cols = el('div', 'ege-tradecols');
    var mineCol = el('div', 'ege-tradecol');
    var theirsCol = el('div', 'ege-tradecol');
    cols.appendChild(mineCol);
    cols.appendChild(theirsCol);
    panel.appendChild(cols);

    var foot = el('div', 'fb-panel__foot');
    var summary = el('span', 'fb-meta');
    var send = el('button', 'fb-btn fb-btn--primary', 'Send the offer');
    send.type = 'button';
    foot.appendChild(summary);
    foot.appendChild(send);
    panel.appendChild(foot);

    function column(holder, title, owned, picked, filterKey, note) {
      holder.innerHTML = '';
      var top = el('div', 'ege-tradecol__head');
      top.appendChild(el('h4', 'ege-item__name', title));
      top.appendChild(el('span', 'fb-tag fb-tag--num', picked.length + ' / ' + MAX_SIDE));
      holder.appendChild(top);

      if (owned === null) {
        holder.appendChild(el('p', 'fb-meta', 'Loading\u2026'));
        return;
      }

      var filter = el('select', 'fb-select ege-filterselect');
      filter.setAttribute('aria-label', 'Rarity');
      filter.appendChild(new Option('Every rarity', 'all'));
      EGE.cards.RARITIES.forEach(function (r) { filter.appendChild(new Option(r.name, r.key)); });
      filter.value = build[filterKey];
      filter.addEventListener('change', function () { build[filterKey] = filter.value; draw(); });
      holder.appendChild(filter);

      var cards = Object.keys(owned).map(EGE.cards.byId).filter(function (c) {
        return c && (build[filterKey] === 'all' || c.rarity === build[filterKey]);
      }).sort(EGE.cards.compare);

      var grid = el('div', 'ege-tradegrid');
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
      if (!cards.length) { grid.appendChild(el('p', 'fb-meta', note)); }
      holder.appendChild(grid);
    }

    function draw() {
      var name = firstName(build.to);
      column(mineCol, 'You give', state.owned, build.give, 'filterMine', 'No cards of yours to offer here.');
      column(theirsCol, 'You get from ' + name, build.theirs, build.take, 'filterTheirs',
        name + ' has no cards here.');
      summary.textContent = build.give.length
        ? 'You give ' + build.give.length + ', you get ' + build.take.length +
          (build.take.length ? '.' : ' \u2014 a gift.')
        : 'Pick at least one of your cards to offer.';
      send.disabled = !build.give.length || build.theirs === null;
    }

    function choose(email) {
      build.to = email;
      build.take = [];
      build.theirs = null;
      draw();
      EGE.cardStore.collectionFor(email).then(function (got) {
        if (build.to !== email) { return; }
        build.theirs = got ? got.owned : {};
        draw();
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
        say('Offer sent to ' + firstName(build.to) + '.', false);
        refresh();
      });
    });

    choose(pick.value);
    /* Focus goes on the builder, not the drop-down: a phone opens a
       focused drop-down's picker straight away. */
    panel.tabIndex = -1;
    panel.focus({ preventScroll: true });
  }

  /* --- the nav badge ----------------------------------------------------- */

  /* How many offers are waiting on this player, on the Cards tab in the nav,
     so a trade does not sit unanswered because nobody opened the tab. */
  function setBadge(count) {
    var badge = byId('navCardsBadge');
    if (!badge) { return; }
    badge.textContent = count;
    badge.hidden = !count;
    var link = byId('navCards');
    if (link) {
      link.setAttribute('aria-label', count ? 'Cards, ' + count + ' trade offer' + (count === 1 ? '' : 's') + ' waiting' : 'Cards');
    }
  }

  function refreshBadge() {
    var player = EGE.auth.currentPlayer();
    if (!player) { setBadge(0); return Promise.resolve(); }
    return EGE.cardStore.tradesFor(player.email).then(function (trades) {
      var e = player.email.toLowerCase();
      setBadge(trades.filter(function (t) { return t.status === 'open' && t.to_email.toLowerCase() === e; }).length);
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
        say(set.name + ' complete: ' + extras.join(', ') + '.', false);
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
  }

  /* --- the odds, said out loud ------------------------------------------ */

  function renderOdds() {
    var body = byId('cardOdds');
    body.innerHTML = '';
    var out = EGE.cards.pullable(null);
    var perf = EGE.cards.counts(out.filter(function (c) { return c.kind === 'performance'; }));
    var play = EGE.cards.counts(out.filter(function (c) { return c.kind === 'play'; }));

    EGE.cards.RARITIES.forEach(function (r) {
      var tr = el('tr');
      var name = el('td');
      var dot = el('span', 'ege-chipdot');
      dot.style.background = r.color;
      name.appendChild(dot);
      name.appendChild(el('strong', null, r.name));
      tr.appendChild(name);
      tr.appendChild(el('td', 'num', r.odds + '%'));
      tr.appendChild(el('td', 'num', String(perf[r.key] + play[r.key])));
      var sells = el('td', 'num');
      var pays = EGE.cards.QUICK_SELL[r.key];
      sells.appendChild(pays ? price(pays) : document.createTextNode('Never'));
      tr.appendChild(sells);
      body.appendChild(tr);
    });
  }

  /* --- drawing and loading ---------------------------------------------- */

  function renderAll() {
    renderPacks();
    if (state.hold) { return; }
    renderRecent();
    renderCollection();
    renderTrades();
    renderLibrary();
    renderOdds();
  }

  function build() {
    if (built) { return; }
    built = true;
    renderFilters();
    byId('tradeNew').addEventListener('click', openTradeBuilder);
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

    return Promise.all([
      EGE.cardStore.collectionFor(player.email),
      EGE.cardStore.claimsFor(player.email),
      EGE.wallet.creditsFor(player.email),
      EGE.cardStore.tradesFor(player.email),
      EGE.wallet.diamondsFor(player.email),
      EGE.cardStore.recentPacks(player.email, RECENT_MAX),
      loadOther()
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
      state.loaded = all[0] !== null;
      if (all[4] === null && all[0] !== null) {
        say('Your diamonds could not be loaded. Run supabase/schema.sql to set up the diamond tables, then reload.', true);
      }
      renderAll();
    });
  }

  /* Called by js/app.js whenever #cards is shown. */
  function render() {
    var player = EGE.auth.currentPlayer();
    byId('cardsLocked').hidden = Boolean(player);
    byId('cardsContent').hidden = !player;

    if (!player) { reset(); return; }
    if (state.player !== player) {
      reset();
      state.player = player;
    }
    build();
    renderFilters();
    renderAll();
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
    state.trades = [];
    state.hold = false;
    state.view = null;
    state.other = null;
    state.recent = null;
    state.recentShown = RECENT_STEP;
    binder.key = null;
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
        cards[cards.length - 1] = pool[Math.floor(Math.random() * pool.length)];
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
    refreshBadge: refreshBadge,
    cardEl: cardEl,
    describe: describe,
    pressable: pressable,
    zoom: zoom,
    openOverlay: openOverlay,
    closeOverlay: closeRip,
    demoPack: demoPack
  };
})();
