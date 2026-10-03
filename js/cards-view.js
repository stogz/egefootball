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
    return (shown < 0 ? '−' : '') + Math.abs(shown).toFixed(1);
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
    }
    face.appendChild(art);

    var plate = el('div', 'ege-tcard__plate');
    plate.appendChild(el('div', 'ege-tcard__name', card.player.name));
    plate.appendChild(el('div', 'ege-tcard__meta',
      [card.position, team.school].filter(Boolean).join(' · ')));
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
      (card.event ? card.event : 'Wk ' + card.week) + ' · ' + card.season));
    face.appendChild(foot);

    node.appendChild(face);

    if (opts.count > 1) { node.appendChild(el('span', 'ege-tcard__count', '×' + opts.count)); }
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
      pack.size + ' cards' + (pack.seasonOnly ? ' · ' + EGE.currentSeason : '')));
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
      buy.appendChild(document.createTextNode('Buy & Rip · '));
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

    byId('cardsBalance').textContent = state.credits === null ? '—' : state.credits;
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

      openRip({ pack: pack, cards: res.cards, isNew: isNew });
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
    rip.summary = (options.extras && options.extras.length ? options.extras.join(' · ') + '. ' : '') +
      (best && options.cards.length > 1 ? 'Best pull: ' + EGE.cards.rarity(best.rarity).name + ' ' + best.player.first + '. ' : '') +
      (options.cards.length > 1 ? fresh + ' new to your collection.' : (fresh ? 'New to your collection.' : 'One you had already.'));

    var stage = el('div', 'ege-rip__stage');

    var head = el('div', 'ege-rip__head');
    head.appendChild(el('h2', 'ege-rip__title', options.title || (options.pack && options.pack.name)));
    var close = el('button', 'fb-modal__close ege-rip__close', '×');
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
      again.appendChild(document.createTextNode('Another · '));
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

  /* --- a card up close -------------------------------------------------- */

  function zoom(card) {
    var node = byId('cardRip');
    node.innerHTML = '';
    rip = { node: node, pack: null, returnTo: document.activeElement };

    var stage = el('div', 'ege-rip__stage ege-rip__stage--zoom');
    var head = el('div', 'ege-rip__head');
    head.appendChild(el('h2', 'ege-rip__title', card.player.name));
    var close = el('button', 'fb-modal__close ege-rip__close', '×');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close');
    close.addEventListener('click', closeRip);
    head.appendChild(close);
    stage.appendChild(head);

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
    fact('Rarity', r.name + ' · ' + r.odds + '% of pulls');
    fact('Fantasy', points(card.points) + ' points');
    fact('Game', card.versus + ' · ' + (card.event || 'Week ' + card.week) + ', ' + card.season +
      (card.game.result ? ' · ' + card.game.result.teamScore + '–' + card.game.result.opponentScore : ''));
    if (card.kind === 'play') {
      fact('The play', card.text);
      fact('That game', EGE.cards.statSummary(card.player.position, card.game.stats));
    } else {
      fact('Line', card.line);
    }
    fact('Owned', String(state.owned[card.id] || 0));
    stage.appendChild(facts);

    var actions = el('div', 'ege-rip__actions');
    var done = el('button', 'fb-btn fb-btn--primary', 'Done');
    done.type = 'button';
    done.addEventListener('click', closeRip);
    actions.appendChild(done);
    stage.appendChild(actions);

    node.appendChild(stage);
    node.hidden = false;
    document.documentElement.classList.add('ege-noscroll');
    done.focus({ preventScroll: true });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && rip) { closeRip(); }
  });

  /* --- the collection --------------------------------------------------- */

  function chip(label, active, onPick, color) {
    var b = el('button', 'fb-chip' + (active ? ' is-active' : ''));
    b.type = 'button';
    if (color) {
      var dot = el('span', 'ege-chipdot');
      dot.style.background = color;
      b.appendChild(dot);
    }
    b.appendChild(document.createTextNode(label));
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

    var rarities = el('div', 'ege-filterrow');
    rarities.appendChild(chip('All', f.rarity === 'all', function () { pick('rarity', 'all'); }));
    EGE.cards.RARITIES.forEach(function (r) {
      rarities.appendChild(chip(r.name, f.rarity === r.key, function () { pick('rarity', r.key); }, r.color));
    });
    bar.appendChild(rarities);

    var rest = el('div', 'ege-filterrow');
    [['all', 'Both kinds'], ['performance', 'Performances'], ['play', 'Plays']].forEach(function (k) {
      rest.appendChild(chip(k[1], f.kind === k[0], function () { pick('kind', k[0]); }));
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
        function () { zoom(card); });
      grid.appendChild(node);
    });

    var out = EGE.cards.pullable(null).length;
    byId('collectionCount').textContent = state.loaded
      ? cardCount() + (cardCount() === 1 ? ' card' : ' cards') + ' · ' + mine.length + ' of ' + out + ' different'
      : 'Loading…';

    var empty = byId('collectionEmpty');
    empty.hidden = !state.loaded || shown.length > 0;
    empty.textContent = mine.length
      ? 'Nothing you own matches that. Try another filter.'
      : 'No cards yet. Rip a pack and they land here.';
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
    return parts.join(' · ');
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
          pip.title = s.card.player.name + ' · ' + s.card.headline + ' · ' + s.card.season;
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
        name.addEventListener('click', function () { zoom(got); });
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
      (ready ? ' · ' + ready + ' ready to claim' : '');
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
    renderLibrary();
    renderOdds();
  }

  function build() {
    if (built) { return; }
    built = true;
    renderFilters();
  }

  function refresh() {
    var player = state.player;
    if (!player) { return Promise.resolve(); }

    return Promise.all([
      EGE.cardStore.collectionFor(player.email),
      EGE.cardStore.claimsFor(player.email),
      EGE.wallet.creditsFor(player.email)
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
  }

  return { render: render, reset: reset };
})();
