/* ==========================================================================
   EGE Football — the card game, on the admin page
   Who has how many cards, what they have claimed and traded, a demo pack
   to try the openings out on (js/cards-view.js rips it; nothing is paid
   and nothing is kept), and the two resets: Clear library (every card out of a collection, its showcase
   emptied, its open trades cancelled and its goals reset) and Reset goals
   (every Library set claimable again, cards kept). Either for one player or for everybody,
   and only once RESET is typed. Each account's row also counts its Player
   Card photos, with a Remove that takes them all down.

   The resets are database functions that refuse anybody who is not in the
   admins table (supabase/schema.sql), whatever this page lets through.

   js/app.js calls render() when it draws the admin page.

   Depends on: js/cards.js, js/cards-view.js, data/cards.js.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.cardsAdmin = (function () {
  'use strict';

  var wired = false;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text != null) { node.textContent = text; }
    return node;
  }

  function byId(id) { return document.getElementById(id); }

  function note(text) { byId('cardsAdminNote').textContent = text || ''; }

  function same(a, b) { return String(a || '').toLowerCase() === String(b || '').toLowerCase(); }

  function drawTable(all) {
    var body = byId('cardsAdminRows');
    body.innerHTML = '';

    EGE.playersWithAccounts().forEach(function (player) {
      var cards = all.cards.filter(function (r) { return same(r.email, player.email) && r.quantity > 0; });
      var copies = cards.reduce(function (sum, r) { return sum + r.quantity; }, 0);
      var claims = all.claims.filter(function (r) { return same(r.email, player.email); }).length;
      var open = all.trades.filter(function (t) {
        return t.status === 'open' && (same(t.from_email, player.email) || same(t.to_email, player.email));
      }).length;
      var shelf = all.showcases.filter(function (r) { return same(r.email, player.email); })[0];

      var tr = el('tr');
      tr.appendChild(el('td', null, player.name));
      [copies, cards.length, claims + ' / ' + EGE.cards.sets().length, open,
       (shelf ? shelf.cards.length : 0) + ' / 5'].forEach(function (value) {
        tr.appendChild(el('td', 'num', String(value)));
      });

      /* Their Player Card photos, and a button to take them all down. */
      var photos = all.photos ? all.photos.filter(function (r) { return same(r.email, player.email); }).length : null;
      var cell = el('td', 'num ege-cardsadmin__photos');
      cell.appendChild(document.createTextNode(photos === null ? '\u2014' : photos + ' / 6'));
      if (photos) {
        var drop = el('button', 'fb-btn fb-btn--sm', 'Remove');
        drop.type = 'button';
        drop.title = 'Take down every photo ' + player.first + ' has on a Player Card';
        drop.addEventListener('click', function () {
          if (!window.confirm('Take down all of ' + player.name + '\u2019s Player Card photos?')) { return; }
          drop.disabled = true;
          EGE.cardStore.clearCardPhoto(null, player.email).then(function (res) {
            if (!res.ok) { note(res.message); drop.disabled = false; return; }
            refresh().then(function () {
              note('Took down ' + res.count + ' of ' + player.name + '\u2019s Player Card ' +
                   (res.count === 1 ? 'photo.' : 'photos.'));
            });
          });
        });
        cell.appendChild(drop);
      }
      tr.appendChild(cell);
      body.appendChild(tr);
    });
  }

  function refresh() {
    note('Loading\u2026');
    return EGE.cardStore.everything().then(function (all) {
      if (!all) {
        note('The card tables could not be read. Run supabase/schema.sql.');
        return;
      }
      drawTable(all);
      note(all.cards.length ? '' : 'Nobody has any cards yet.');
    });
  }

  function armed() {
    return byId('cardsAdminConfirm').value.trim().toUpperCase() === 'RESET';
  }

  function whoText(email) {
    if (!email) { return 'everybody'; }
    var player = EGE.players.filter(function (p) { return same(p.email, email); })[0];
    return player ? player.name : email;
  }

  function run(button, action, said) {
    var email = byId('cardsAdminWho').value || null;
    button.disabled = true;
    action(email).then(function (res) {
      byId('cardsAdminConfirm').value = '';
      sync();
      if (!res.ok) { note(res.message); return; }
      var done = said(res.count, whoText(email));
      refresh().then(function () { note(done); });
    });
  }

  function sync() {
    var on = armed();
    byId('cardsAdminGoals').disabled = !on;
    byId('cardsAdminClear').disabled = !on;
  }

  function wire() {
    if (wired) { return; }
    wired = true;

    var who = byId('cardsAdminWho');
    who.appendChild(new Option('Everybody', ''));
    EGE.playersWithAccounts().forEach(function (p) { who.appendChild(new Option(p.name, p.email)); });

    byId('cardsAdminConfirm').addEventListener('input', sync);

    var pack = byId('cardsDemoPack');
    EGE.cards.PACKS.forEach(function (p) { pack.appendChild(new Option(p.name, p.key)); });
    byId('cardsDemoRip').addEventListener('click', function () {
      var res = EGE.cardsView.demoPack(pack.value, byId('cardsDemoBest').value || null);
      byId('cardsDemoNote').textContent = res.message || '';
    });

    byId('cardsAdminGoals').addEventListener('click', function () {
      if (!armed()) { return; }
      run(this, EGE.cardStore.resetGoals, function (count, whom) {
        return 'Goals reset for ' + whom + ': ' + count + (count === 1 ? ' claimed set' : ' claimed sets') +
          ' can be claimed again.';
      });
    });

    byId('cardsAdminClear').addEventListener('click', function () {
      if (!armed()) { return; }
      run(this, EGE.cardStore.clearLibrary, function (count, whom) {
        return 'Library cleared for ' + whom + ': ' + count +
          (count === 1 ? ' kind of card' : ' kinds of card') + ' taken out, and the goals reset.';
      });
    });
  }

  function render() {
    wire();
    sync();
    return refresh();
  }

  return { render: render };
})();
