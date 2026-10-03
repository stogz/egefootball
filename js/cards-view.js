/* ==========================================================================
   EGE Football — the Cards tab
   Packs to buy and rip, the collection they fill, and the library of sets
   to put together. A tab of its own, away from the simulation: nothing on
   it changes a rating, a result or a season, so somebody who never opens it
   is not behind anybody at anything.

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
    credits: null,
    loaded: false,
    fresh: {},          /* ids pulled since the page loaded, for the New badge */
    trades: [],         /* every trade this player is on either side of */
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

  function price(credits) {
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

  /* Tells the rest of the page the balance has moved, and that the
     inventory may have too (a set can pay out a booster). js/app.js
     redraws the nav and the shop from it. */
  function walletChanged(credits) {
    if (typeof credits === 'number' && !isNaN(credits)) { state.credits = credits; }
    document.dispatchEvent(new window.CustomEvent('ege:wallet', { detail: { credits: state.credits } }));
  }

  function ownedIds() { return Object.keys(state.owned); }

  function cardCount() {
    return ownedIds().reduce(function (sum, id) { return sum + state.owned[id]; }, 0);
  }

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
      pack.size + ' cards' + (pack.booster ? ' + booster' : '') +
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
      buy.appendChild(price(pack.credits));

      var why = null;
      if (pool.length < pack.size) {
        why = pack.seasonOnly
          ? 'Opens once the first week of ' + EGE.currentSeason + ' is out.'
          : 'Opens once there are games out to put in it.';
      } else if (state.credits !== null && state.credits < pack.credits) {
        why = 'Not enough credits yet.';
      }
      buy.disabled = Boolean(why) || !state.loaded;
      if (why) { words.appendChild(el('p', 'ege-item__blocked', why)); }

      buy.addEventListener('click', function () { buyPack(pack, buy); });
      words.appendChild(buy);
      tile.appendChild(words);
      holder.appendChild(tile);
    });

    byId('cardsBalance').textContent = state.credits === null ? '\u2014' : state.credits;
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

      res.cards.forEach(function (card, i) {
        state.owned[card.id] = (state.owned[card.id] || 0) + 1;
        if (isNew[i]) { state.fresh[card.id] = true; state.first[card.id] = new Date().toISOString(); }
      });
      walletChanged(res.credits);
      renderAll();

      openRip({ pack: pack, cards: res.cards, isNew: isNew,
                extras: res.booster ? ['A 1.5x Booster is in your shop inventory'] : [] });
    });
  }

  /* --- ripping one open ------------------------------------------------- */

  var rip = null;

  function closeRip() {
    if (!rip) { return; }
    rip.node.hidden = true;
    rip.node.innerHTML = '';
    document.documentElement.classList.remove('ege-noscroll');
    var back = rip.returnTo;
    rip = null;
    if (back && back.focus) { back.focus(); }
  }

  function flipCard(flip) {
    if (flip.classList.contains('is-flipped')) { return; }
    flip.classList.add('is-flipped');
    flip.setAttribute('aria-label', flip.dataset.label);
    var left = rip.node.querySelectorAll('.ege-flip:not(.is-flipped)').length;
    if (!left) { finishRip(); }
  }

  function finishRip() {
    rip.node.querySelector('.ege-rip__flipall').hidden = true;
    rip.node.querySelector('.ege-rip__done').hidden = false;
    var again = rip.node.querySelector('.ege-rip__again');
    if (again && rip.pack) {
      var affordable = state.credits !== null && state.credits >= rip.pack.credits &&
        EGE.cards.pullable(rip.pack.key).length >= rip.pack.size;
      again.hidden = !affordable;
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
     cards face down. */
  function openRip(options) {
    var node = byId('cardRip');
    node.innerHTML = '';
    rip = { node: node, pack: options.pack || null, returnTo: document.activeElement };

    var best = options.cards.slice().sort(EGE.cards.compare)[0];
    var fresh = options.isNew.filter(Boolean).length;
    rip.summary = (options.extras && options.extras.length ? options.extras.join(' \u00b7 ') + '. ' : '') +
      (best && options.cards.length > 1 ? 'Best pull: ' + EGE.cards.rarity(best.rarity).name + ' ' + best.player.first + '. ' : '') +
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
      Array.prototype.forEach.call(row.querySelectorAll('.ege-flip:not(.is-flipped)'), function (flip, i) {
        window.setTimeout(function () { if (rip) { flipCard(flip); } }, reducedMotion() ? 0 : i * 140);
      });
    });
    actions.appendChild(flipAll);

    if (options.pack) {
      var again = el('button', 'fb-btn ege-rip__again');
      again.type = 'button';
      again.hidden = true;
      again.appendChild(document.createTextNode('Another \u00b7 '));
      again.appendChild(price(options.pack.credits));
      again.addEventListener('click', function () {
        var pack = options.pack;
        closeRip();
        buyPack(pack, null);
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
     else's card, on a showcase or in a trade. */
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
      facts.appendChild(el('dd', null, value));
    }
    fact('Rarity', r.name + ' \u00b7 ' + r.odds + '% of pulls');
    fact('Fantasy', points(card.points) + ' points');
    fact('Game', card.versus + ' \u00b7 ' + (card.event || 'Week ' + card.week) + ', ' + card.season +
      (card.game.result ? ' \u00b7 ' + card.game.result.teamScore + '\u2013' + card.game.result.opponentScore : ''));
    if (card.kind === 'play') {
      fact('The play', card.text);
      fact('That game', EGE.cards.statSummary(card.player.position, card.game.stats));
    } else {
      fact('Line', card.line);
    }
    if (typeof opts.owned === 'number') { fact('Owned', String(opts.owned)); }
    stage.appendChild(facts);

    var actions = el('div', 'ege-rip__actions');
    var done = el('button', 'fb-btn fb-btn--primary', 'Done');
    done.type = 'button';
    done.addEventListener('click', closeRip);
    actions.appendChild(done);
    stage.appendChild(actions);
    done.focus({ preventScroll: true });
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

  function renderFilters() {
    var bar = byId('collectionFilters');
    bar.innerHTML = '';
    var f = state.filter;

    /* One line: the three kinds as buttons the height of the drop-downs
       beside them, then who, the order, and the rarity. */
    var rest = el('div', 'ege-filterrow');
    [['all', 'All'], ['performance', 'Performances'], ['play', 'Plays']].forEach(function (k) {
      var b = chip(k[1], f.kind === k[0], function () { pick('kind', k[0]); });
      b.classList.add('ege-filterchip');
      rest.appendChild(b);
    });

    var who = el('select', 'fb-select ege-filterselect');
    who.setAttribute('aria-label', 'Player');
    who.appendChild(new Option('Every player', 'all'));
    EGE.players.forEach(function (p) { who.appendChild(new Option(p.name, p.slug)); });
    who.value = f.player;
    who.addEventListener('change', function () { pick('player', who.value); });
    rest.appendChild(who);

    var sort = el('select', 'fb-select ege-filterselect');
    sort.setAttribute('aria-label', 'Sort');
    [['rarity', 'Rarest first'], ['points', 'Highest score'], ['newest', 'Newest pulls'], ['game', 'By game']]
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

  function sorter(how) {
    if (how === 'points') {
      return function (a, b) { return b.points - a.points || EGE.cards.compare(a, b); };
    }
    if (how === 'newest') {
      return function (a, b) {
        var x = state.first[a.id] || '';
        var y = state.first[b.id] || '';
        return x < y ? 1 : x > y ? -1 : EGE.cards.compare(a, b);
      };
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
    grid.innerHTML = '';
    var f = state.filter;

    var mine = ownedIds().map(EGE.cards.byId).filter(Boolean);
    var shown = mine.filter(function (card) {
      return (f.rarity === 'all' || card.rarity === f.rarity) &&
        (f.kind === 'all' || card.kind === f.kind) &&
        (f.player === 'all' || card.slug === f.player);
    }).sort(sorter(f.sort));

    shown.forEach(function (card) {
      var node = cardEl(card, { count: state.owned[card.id], isNew: state.fresh[card.id] });
      pressable(node, describe(card) + (state.owned[card.id] > 1 ? ', ' + state.owned[card.id] + ' owned' : ''),
        function () { zoom(card, { owned: state.owned[card.id] || 0 }); });
      grid.appendChild(node);
    });

    var out = EGE.cards.pullable(null).length;
    byId('collectionCount').textContent = state.loaded
      ? cardCount() + (cardCount() === 1 ? ' card' : ' cards') + ' \u00b7 ' + mine.length + ' of ' + out + ' different'
      : 'Loading\u2026';

    var empty = byId('collectionEmpty');
    empty.hidden = !state.loaded || shown.length > 0;
    empty.textContent = mine.length
      ? 'Nothing you own matches that. Try another filter.'
      : 'No cards yet. Rip a pack and they land here.';
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
        ? 'No trades yet. Offer some of your cards for some of somebody else\u2019s, or give one away.'
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
    pick.focus({ preventScroll: true });
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
    if (rw.credits) { parts.push(rw.credits + ' credits'); }
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
      if (res.card) {
        state.owned[res.card.id] = (state.owned[res.card.id] || 0) + 1;
        if (isNew) { state.fresh[res.card.id] = true; state.first[res.card.id] = new Date().toISOString(); }
      }
      state.claims[set.key] = {
        set_key: set.key,
        reward: { card: res.card ? res.card.id : null, credits: set.reward.credits, booster: set.reward.booster || null }
      };
      walletChanged(res.credits);
      renderAll();

      var extras = [];
      if (set.reward.credits) { extras.push('+' + set.reward.credits + ' credits'); }
      if (set.reward.booster) { extras.push('a 1.5x Booster in your shop inventory'); }

      if (res.card) {
        openRip({ title: set.name + ' complete', cards: [res.card], isNew: [isNew], extras: extras });
      } else {
        say(set.name + ' complete: ' + extras.join(', ') + '.', false);
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
      body.appendChild(tr);
    });
  }

  /* --- drawing and loading ---------------------------------------------- */

  function renderAll() {
    renderPacks();
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
  }

  function refresh() {
    var player = state.player;
    if (!player) { return Promise.resolve(); }

    return Promise.all([
      EGE.cardStore.collectionFor(player.email),
      EGE.cardStore.claimsFor(player.email),
      EGE.wallet.creditsFor(player.email),
      EGE.cardStore.tradesFor(player.email)
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
      state.loaded = all[0] !== null;
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
    state.loaded = false;
    state.fresh = {};
    state.trades = [];
    setBadge(0);
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
    closeOverlay: closeRip
  };
})();
