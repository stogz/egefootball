/* ==========================================================================
   EGE Football — the showcase on a player page
   Up to six cards a player picks out of their collection to show off on
   their own page; any of the six can be one of their Player Cards instead
   ('pc:{slug}' among the ids). Anybody can see it, signed in or not; only the player can
   change it, and only with cards they own. A card traded away comes down on
   its own (supabase/schema.sql prunes it when the trade goes through).

   js/app.js calls render() every time it draws a player page.

   Depends on: data/cards.js, js/cards.js, js/cards-view.js, js/auth.js.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.showcase = (function () {
  'use strict';

  var SIZE = 6;                     /* set_card_showcase holds to the same */
  var STALE_AFTER = 20 * 1000;

  var cache = {};                   /* email -> { ids, at } */
  var shown = null;                 /* the player on screen */
  var editing = null;               /* the ids being arranged, while editing */
  var ownCards = null;              /* the editor's own collection, once read */
  var ownPhotos = null;             /* and their Player Card photos */
  var ownEarned = null;             /* and what their Player Cards have earned */
  var PC = 'pc:';                   /* a slot holding a Player Card: 'pc:{slug}' */
  var message = '';

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text != null) { node.textContent = text; }
    return node;
  }

  function byId(id) { return document.getElementById(id); }

  function isMine(player) {
    var me = EGE.auth.currentPlayer();
    return Boolean(me && player && me.slug === player.slug);
  }

  function savedIds(player) {
    var hit = cache[player.email];
    return hit ? hit.ids : [];
  }

  /* A slot's Player Card: 'pc:{slug}' worked out from the cards of that
     player the owner holds (the editor's own collection once read, else
     what showcased_player_cards handed over), with what it has earned and
     its photo. Null for a card id, or a player with no cards behind it. */
  function slotPlayerCard(id) {
    if (id.indexOf(PC) !== 0) { return null; }
    var p = EGE.playerBySlug(id.slice(PC.length));
    if (!p) { return null; }
    var saved = (cache[shown.email] || {}).players || {};
    var pc = EGE.cards.playerCard(p, (editing && ownCards) || saved.cards || {});
    if (!pc.copies) { return null; }
    var earned = (editing && ownEarned) || saved.earned;
    pc.earned = earned ? (earned[p.slug] || 0) : null;
    pc.photo = (editing && ownPhotos ? ownPhotos : saved.photos || {})[p.slug] || null;
    return pc;
  }

  function playerCardNode(pc) {
    var face = EGE.cardsView.playerCardFace(pc, pc.earned, pc.photo);
    face.setAttribute('role', 'img');
    face.setAttribute('aria-label', pc.player.name + ' Player Card, ' +
      (pc.rank ? pc.rank.name : 'unranked') + ', ' + Math.round(pc.points) + ' fantasy points collected');
    return face;
  }

  /* --- drawing ----------------------------------------------------------- */

  function draw() {
    var player = shown;
    var panel = byId('showcasePanel');
    if (!player || !player.email) { panel.hidden = true; return; }

    var mine = isMine(player);
    if (!mine) { editing = null; }
    var loaded = Boolean(cache[player.email]);
    var ids = editing || savedIds(player);
    /* Cards and Player Cards share the six slots, in the order picked. */
    var items = ids.map(function (id) {
      var pc = slotPlayerCard(id);
      if (pc) { return { pc: pc }; }
      var card = EGE.cards.byId(id);
      return card ? { card: card } : null;
    }).filter(Boolean);

    /* Somebody else's page with nothing up has no panel at all. */
    panel.hidden = !mine && !items.length;
    if (panel.hidden) { return; }

    var note = byId('showcaseNote');
    note.textContent = message || (editing
      ? 'Pick up to ' + SIZE + ' of your cards or Player Cards.'
      : mine && !items.length ? '' : items.length + ' of ' + SIZE);

    var edit = byId('showcaseEdit');
    edit.hidden = !mine || Boolean(editing) || !loaded;

    var holder = byId('showcaseCards');
    holder.innerHTML = '';
    var grid = el('div', 'ege-showcase__grid');

    if (editing) {
      for (var i = 0; i < SIZE; i += 1) { grid.appendChild(editSlot(i)); }
      holder.appendChild(grid);
      holder.appendChild(editActions());
      return;
    }

    if (!items.length) {
      var empty = el('div', 'ege-showcase__empty');
      empty.appendChild(el('p', 'fb-meta', loaded
        ? 'Put your favourite cards here for everybody to see on your page.'
        : 'Loading\u2026'));
      if (loaded) {
        var start = el('button', 'fb-btn fb-btn--primary', 'Pick your cards');
        start.type = 'button';
        start.addEventListener('click', startEditing);
        empty.appendChild(start);
      }
      holder.appendChild(empty);
      return;
    }

    /* Either kind opens up close on a tap: a Player Card with what it
       stands for, a card with who else has it and, on somebody else's
       page, a Trade for it. */
    var viewer = EGE.auth.currentPlayer();
    items.forEach(function (item) {
      if (item.pc) {
        var pc = item.pc;
        var face = EGE.cardsView.playerCardFace(pc, pc.earned, pc.photo);
        EGE.cardsView.pressable(face, pc.player.name + ' Player Card, ' +
          (pc.rank ? pc.rank.name : 'unranked') + ', ' + Math.round(pc.points) + ' fantasy points collected',
          function () { EGE.cardsView.zoomPlayer(pc, { whose: mine ? null : player.first }); });
        grid.appendChild(face);
        return;
      }
      var card = item.card;
      var node = EGE.cardsView.cardEl(card, {});
      EGE.cardsView.pressable(node, EGE.cardsView.describe(card), function () {
        EGE.cardsView.zoom(card, { owner: player.email, tradeWith: viewer && !mine ? player.email : null });
      });
      grid.appendChild(node);
    });
    holder.appendChild(grid);
  }

  function editSlot(at) {
    var id = editing[at];
    var pc = id ? slotPlayerCard(id) : null;
    var card = id && !pc ? EGE.cards.byId(id) : null;
    var slot = el('div', 'ege-showcase__slot');

    if (!card && !pc) {
      var add = el('button', 'ege-showcase__add', '+ Add a card');
      add.type = 'button';
      add.addEventListener('click', function () { pick(at); });
      slot.appendChild(add);
      return slot;
    }

    slot.appendChild(pc ? playerCardNode(pc) : EGE.cardsView.cardEl(card, {}));
    var row = el('div', 'ege-showcase__slotactions');
    var swap = el('button', 'fb-btn fb-btn--sm', 'Replace');
    swap.type = 'button';
    swap.addEventListener('click', function () { pick(at); });
    var drop = el('button', 'fb-btn fb-btn--sm', 'Remove');
    drop.type = 'button';
    drop.addEventListener('click', function () {
      editing.splice(at, 1);
      draw();
    });
    row.appendChild(swap);
    row.appendChild(drop);
    slot.appendChild(row);
    return slot;
  }

  function editActions() {
    var row = el('div', 'fb-row fb-row--wrap ege-showcase__actions');
    var save = el('button', 'fb-btn fb-btn--primary', 'Save the showcase');
    save.type = 'button';
    save.addEventListener('click', function () {
      save.disabled = true;
      EGE.cardStore.setShowcase(editing.slice()).then(function (res) {
        if (!res.ok) {
          message = res.message;
          save.disabled = false;
          draw();
          return;
        }
        editing = null;
        message = '';
        /* Read back, so the Player Cards come with their earnings and photos. */
        delete cache[shown.email];
        render(shown);
      });
    });
    var cancel = el('button', 'fb-btn', 'Cancel');
    cancel.type = 'button';
    cancel.addEventListener('click', function () {
      editing = null;
      message = '';
      draw();
    });
    row.appendChild(save);
    row.appendChild(cancel);
    return row;
  }

  function startEditing() {
    editing = savedIds(shown).slice();
    ownCards = null;
    ownPhotos = null;
    ownEarned = null;
    message = '';
    draw();
  }

  /* --- picking a card ----------------------------------------------------- */

  /* Every card the player owns that is not already up, rarest first. */
  function pick(at) {
    var player = shown;
    var stage = EGE.cardsView.openOverlay(editing[at] ? 'Replace a card' : 'Add a card',
      'ege-rip__stage--picker');
    var panel = el('div', 'fb-panel ege-tradebuilder');
    var body = el('div', 'fb-panel__body');
    body.appendChild(el('p', 'fb-meta', 'Loading your collection\u2026'));
    panel.appendChild(body);
    stage.appendChild(panel);

    Promise.all([EGE.cardStore.collectionFor(player.email), EGE.cardStore.cardPhotos(player.email),
                 EGE.cardStore.playerCardEarnings(player.email)])
    .then(function (all) {
      var got = all[0];
      var photos = all[1] || {};
      if (!editing || shown !== player) { return; }
      body.innerHTML = '';
      var owned = got ? got.owned : {};
      if (got) { ownCards = owned; ownPhotos = photos; ownEarned = all[2]; }
      var cards = Object.keys(owned).map(EGE.cards.byId).filter(function (card) {
        return card && editing.indexOf(card.id) === -1;
      }).sort(EGE.cards.compare);

      function put(id) {
        if (at < editing.length) { editing[at] = id; } else { editing.push(id); }
        EGE.cardsView.closeOverlay();
        draw();
      }

      /* Your Player Cards first, then your cards: either goes in the slot. */
      var pcs = EGE.players.map(function (p) { return EGE.cards.playerCard(p, owned); })
        .filter(function (pc) { return pc.copies > 0 && editing.indexOf(PC + pc.player.slug) === -1; });
      if (pcs.length) {
        body.appendChild(el('h4', 'ege-showcase__pickhead', 'Player Cards'));
        var pgrid = el('div', 'ege-tradegrid ege-tradegrid--tall');
        pcs.forEach(function (pc) {
          var face = EGE.cardsView.playerCardFace(pc, null, photos[pc.player.slug] || null);
          EGE.cardsView.pressable(face, 'Put up ' + pc.player.name + '\u2019s Player Card', function () {
            put(PC + pc.player.slug);
          });
          pgrid.appendChild(face);
        });
        body.appendChild(pgrid);
        body.appendChild(el('h4', 'ege-showcase__pickhead', 'Cards'));
      }

      if (!cards.length) {
        body.appendChild(el('p', 'fb-meta', got
          ? 'Nothing else in your collection to put up. Rip a pack on the Cards tab.'
          : 'Your collection could not be loaded.'));
        return;
      }

      var grid = el('div', 'ege-tradegrid ege-tradegrid--tall');
      cards.forEach(function (card) {
        var node = EGE.cardsView.cardEl(card, { count: owned[card.id] });
        EGE.cardsView.pressable(node, 'Put up ' + EGE.cardsView.describe(card), function () {
          put(card.id);
        });
        grid.appendChild(node);
      });
      body.appendChild(grid);
    });
  }

  /* --- loading ------------------------------------------------------------ */

  function render(player) {
    if (!shown || !player || shown.slug !== player.slug) {
      editing = null;
      message = '';
    }
    shown = player;
    if (!player || !player.email) { draw(); return; }

    draw();
    var hit = cache[player.email];
    if (hit && Date.now() - hit.at < STALE_AFTER) { return; }

    Promise.all([
      EGE.cardStore.showcaseFor(player.email),
      EGE.cardStore.showcasePlayersFor(player.email)
    ]).then(function (both) {
      cache[player.email] = { ids: both[0], players: both[1], at: Date.now() };
      if (shown === player) { draw(); }
    });
  }

  /* After a trade the showcase may have lost a card. */
  function forget() { cache = {}; }

  document.addEventListener('DOMContentLoaded', function () {
    var edit = byId('showcaseEdit');
    if (edit) { edit.addEventListener('click', startEditing); }
  });

  return { render: render, forget: forget };
})();
