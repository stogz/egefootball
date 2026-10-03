/* ==========================================================================
   EGE Football — the showcase on a player page
   Up to five cards a player picks out of their collection to show off on
   their own page. Anybody can see it, signed in or not; only the player can
   change it, and only with cards they own. A card traded away comes down on
   its own (supabase/schema.sql prunes it when the trade goes through).

   js/app.js calls render() every time it draws a player page.

   Depends on: data/cards.js, js/cards.js, js/cards-view.js, js/auth.js.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.showcase = (function () {
  'use strict';

  var SIZE = 5;                     /* set_card_showcase holds to the same */
  var STALE_AFTER = 20 * 1000;

  var cache = {};                   /* email -> { ids, at } */
  var shown = null;                 /* the player on screen */
  var editing = null;               /* the ids being arranged, while editing */
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

  /* --- drawing ----------------------------------------------------------- */

  function draw() {
    var player = shown;
    var panel = byId('showcasePanel');
    if (!player || !player.email) { panel.hidden = true; return; }

    var mine = isMine(player);
    if (!mine) { editing = null; }
    var loaded = Boolean(cache[player.email]);
    var ids = editing || savedIds(player);
    var cards = ids.map(EGE.cards.byId).filter(Boolean);

    /* Somebody else's page with nothing up has no panel at all. */
    panel.hidden = !mine && !cards.length;
    if (panel.hidden) { return; }

    var note = byId('showcaseNote');
    note.textContent = message || (editing
      ? 'Pick up to ' + SIZE + ' of your cards.'
      : mine && !cards.length ? '' : cards.length + ' of ' + SIZE);

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

    if (!cards.length) {
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

    cards.forEach(function (card) {
      var node = EGE.cardsView.cardEl(card, {});
      EGE.cardsView.pressable(node, EGE.cardsView.describe(card), function () {
        EGE.cardsView.zoom(card);
      });
      grid.appendChild(node);
    });
    holder.appendChild(grid);
  }

  function editSlot(at) {
    var id = editing[at];
    var card = id ? EGE.cards.byId(id) : null;
    var slot = el('div', 'ege-showcase__slot');

    if (!card) {
      var add = el('button', 'ege-showcase__add', '+ Add a card');
      add.type = 'button';
      add.addEventListener('click', function () { pick(at); });
      slot.appendChild(add);
      return slot;
    }

    slot.appendChild(EGE.cardsView.cardEl(card, {}));
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
      var ids = editing.slice();
      EGE.cardStore.setShowcase(ids).then(function (res) {
        if (!res.ok) {
          message = res.message;
          save.disabled = false;
          draw();
          return;
        }
        cache[shown.email] = { ids: ids, at: Date.now() };
        editing = null;
        message = '';
        draw();
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

    EGE.cardStore.collectionFor(player.email).then(function (got) {
      if (!editing || shown !== player) { return; }
      body.innerHTML = '';
      var owned = got ? got.owned : {};
      var cards = Object.keys(owned).map(EGE.cards.byId).filter(function (card) {
        return card && editing.indexOf(card.id) === -1;
      }).sort(EGE.cards.compare);

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
          if (at < editing.length) { editing[at] = card.id; } else { editing.push(card.id); }
          EGE.cardsView.closeOverlay();
          draw();
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

    EGE.cardStore.showcaseFor(player.email).then(function (ids) {
      cache[player.email] = { ids: ids, at: Date.now() };
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
