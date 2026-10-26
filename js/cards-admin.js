/* ==========================================================================
   EGE Football — the card game, on the admin page
   Who has how many cards, what they have claimed and traded, a demo pack
   to try the openings out on (js/cards-view.js rips it; nothing is paid
   and nothing is kept), and the two resets: Clear library (every card out of a collection, its showcase
   emptied, its open trades cancelled and its goals reset) and Reset goals
   (every Library set claimable again, cards kept). Either for one player or for everybody,
   and only once RESET is typed. Each account's row also counts its Player
   Card photos, with a Remove that takes them all down. And the limited-time
   events, the Gold Rush and Halloween, a row each: Start runs one seven
   days from that moment, End now closes it early.

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

  /* --- the limited-time events ------------------------------------------ */

  function when(iso) {
    return new Date(iso).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric',
                                                     hour: 'numeric', minute: '2-digit' });
  }

  /* A row for each event: its name, where it stands, Start and End now. */
  var eventRows = {};

  function buildEvents() {
    var holder = byId('cardsEvents');
    holder.innerHTML = '';
    EGE.cards.EVENTS.forEach(function (ev) {
      var box = el('div', 'ege-demo');
      box.appendChild(el('h4', 'ege-item__name', ev.name));
      var bar = el('div', 'fb-row fb-row--wrap ege-weekbar');
      var stateLine = el('span', 'fb-meta');
      stateLine.setAttribute('role', 'status');
      var start = el('button', 'fb-btn fb-btn--primary', 'Start ' + ev.days + ' days');
      start.type = 'button';
      start.disabled = true;
      var end = el('button', 'fb-btn', 'End now');
      end.type = 'button';
      end.disabled = true;
      start.addEventListener('click', function () {
        eventAction(ev, start, EGE.cardStore.startEvent,
          'Start ' + ev.name + ' for everybody now? It runs ' + ev.days + ' days from this moment.',
          ev.name + ' is on.');
      });
      end.addEventListener('click', function () {
        eventAction(ev, end, EGE.cardStore.endEvent,
          'End ' + ev.name + ' now? Its pack leaves the shop and its sets close.',
          ev.name + ' is over.');
      });
      bar.appendChild(stateLine);
      bar.appendChild(start);
      bar.appendChild(end);
      box.appendChild(bar);
      holder.appendChild(box);
      eventRows[ev.key] = { state: stateLine, start: start, end: end };
    });
  }

  function drawEvents() {
    return EGE.cardStore.events().then(function (rows) {
      EGE.cards.EVENTS.forEach(function (ev) {
        var row = eventRows[ev.key];
        var e = rows && rows[ev.key];
        if (!e) {
          row.state.textContent = 'The event table could not be read. Run supabase/schema.sql.';
          row.start.disabled = true;
          row.end.disabled = true;
          return;
        }
        var on = EGE.cards.eventLive(e);
        row.state.textContent = on ? 'On until ' + when(e.ends_at) + '.'
          : e.starts_at && new Date(e.starts_at).getTime() > Date.now() ? 'Starts ' + when(e.starts_at) + '.'
          : e.ends_at ? 'Not on. Last ran ' + when(e.starts_at) + ' to ' + when(e.ends_at) + '.'
          : 'Not started yet.';
        row.start.disabled = on;
        row.end.disabled = !on;
      });
    });
  }

  function eventAction(ev, button, action, ask, said) {
    if (!window.confirm(ask)) { return; }
    button.disabled = true;
    action(ev.key).then(function (res) {
      drawEvents().then(function () {
        if (!res.ok) { eventRows[ev.key].state.textContent = res.message; }
        else { note(said); }
      });
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

    buildEvents();

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
    drawEvents();
    return refresh();
  }

  return { render: render };
})();
