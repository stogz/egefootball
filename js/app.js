/* ==========================================================================
   EGE Football — homepage
   Renders the six player cards, routes #{slug} to a player view, and runs
   the player portal.
   Plain script, no build step, no modules — works from file:// and http.
   ========================================================================== */

(function () {
  'use strict';

  var TBD = 'TBD';

  var roster     = document.getElementById('roster');
  var viewHome   = document.getElementById('view-home');
  var viewShop   = document.getElementById('view-shop');
  var viewPlayer = document.getElementById('view-player');
  var loginBtn   = document.getElementById('loginBtn');
  var loginModal = document.getElementById('loginModal');

  /* --- helpers ---------------------------------------------------------- */

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text != null) { node.textContent = text; }
    return node;
  }

  function seasonLabel(year) {
    var s = EGE.seasons.filter(function (x) { return x.year === year; })[0];
    return s ? s.year + ' · ' + s.class + ' · ' + s.level : String(year);
  }

  /* School name with its mark beside it, or a plain TBD while unknown. */
  function schoolLine(player, className) {
    var team = EGE.teamFor(player);
    var line = el('div', 'ege-school' + (className ? ' ' + className : ''));

    if (!team) {
      line.appendChild(el('span', 'ege-school__name', 'School ' + TBD));
      return line;
    }

    /* Not every school has a mark in icon/ yet. */
    if (team.logo) {
      var logo = el('img', 'ege-school__logo');
      logo.src = team.logo;
      logo.alt = '';          /* decorative: the name is right beside it */
      logo.loading = 'lazy';
      line.appendChild(logo);
    }
    line.appendChild(el('span', 'ege-school__name', team.school));
    return line;
  }

  /* --- player cards ----------------------------------------------------- */

  function buildCard(player) {
    var team = EGE.teamFor(player);
    var card = el('a', 'ege-card');
    card.href = '#' + player.slug;

    var photo = el('div', 'ege-card__photo');
    var img = el('img');
    img.src = player.headshot;
    img.alt = player.name;
    img.loading = 'lazy';
    photo.appendChild(img);
    if (player.jersey) { photo.appendChild(el('span', 'ege-card__jersey', '#' + player.jersey)); }
    card.appendChild(photo);

    var body = el('div', 'ege-card__body');
    body.appendChild(el('h3', 'ege-card__name', player.name));
    body.appendChild(schoolLine(player));
    body.appendChild(el('p', 'ege-card__league', team ? (team.league || 'League ' + TBD) : ''));

    var tags = el('div', 'fb-row fb-row--wrap');
    if (player.position) {
      tags.appendChild(el('span', 'fb-tag fb-tag--ink', player.position));
    } else {
      tags.appendChild(el('span', 'fb-tag fb-tag--outline', 'POS ' + TBD));
    }
    tags.appendChild(el('span', 'fb-tag fb-tag--gold', EGE.currentSeason));

    var overall = EGE.overallFor(player);
    if (overall !== null) {
      tags.appendChild(el('span', 'fb-tag fb-tag--num fb-tag--sage', 'OVR ' + overall));
    }
    body.appendChild(tags);

    body.appendChild(el('span', 'ege-card__go', 'View player →'));
    card.appendChild(body);

    return card;
  }

  function renderRoster() {
    var frag = document.createDocumentFragment();
    EGE.players.forEach(function (player) { frag.appendChild(buildCard(player)); });
    roster.appendChild(frag);
  }

  /* --- player view ------------------------------------------------------ */

  function renderPlayer(player) {
    var team = EGE.teamFor(player);

    document.getElementById('playerStripLabel').textContent = seasonLabel(EGE.currentSeason);

    var photo = document.getElementById('playerPhoto');
    photo.src = player.headshot;
    photo.alt = player.name;

    var school = document.getElementById('playerSchool');
    school.innerHTML = '';
    school.appendChild(schoolLine(player, 'ege-school--lg'));

    document.getElementById('playerName').textContent = player.name;
    document.getElementById('playerSeason').textContent = seasonLabel(EGE.currentSeason);
    document.getElementById('playerPosition').textContent = player.position || TBD;
    document.getElementById('playerSchoolRow').textContent = team ? team.school : TBD;
    document.getElementById('playerLeague').textContent = (team && team.league) || TBD;

    var record = EGE.recordFor(player);
    var played = EGE.gamesPlayed(player).length;
    document.getElementById('playerRecord').textContent = played ? record.text : '\u2014';

    var tags = document.getElementById('playerTags');
    tags.innerHTML = '';
    if (player.position) {
      tags.appendChild(el('span', 'fb-tag fb-tag--ink', player.position));
    } else {
      tags.appendChild(el('span', 'fb-tag fb-tag--outline', 'POS ' + TBD));
    }
    tags.appendChild(el('span', 'fb-tag fb-tag--gold', 'Junior Year'));

    var overall = EGE.overallFor(player);
    var overallBox = document.getElementById('playerOverall');
    overallBox.hidden = overall === null;
    document.getElementById('playerOverallValue').textContent = overall === null ? '' : overall;

    renderSchedule(player);
    renderRatings(player);
  }

  /* --- schedule --------------------------------------------------------- */

  var WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /* Dates are plain calendar days — read them as such so a time zone can
     never shift a Saturday game onto the Friday. */
  function gameDate(game) {
    var parts = String(game.date).split('-');
    var when = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
    return WEEKDAYS[when.getUTCDay()] + ' ' + MONTHS[when.getUTCMonth()] + ' ' + when.getUTCDate();
  }

  /* A head and shoulders in the margin of a scouted game. */
  function scoutMark() {
    var mark = el('span', 'ege-scout');
    mark.title = 'SCOUTS IN ATTENDANCE';
    mark.setAttribute('aria-label', 'Scouts in attendance');
    mark.setAttribute('role', 'img');
    return mark;
  }

  var showScouts = false;

  function scheduleRow(game) {
    var row = el('tr');

    row.appendChild(el('td', 'ege-schedule__week', game.week));
    row.appendChild(el('td', null, gameDate(game)));
    row.appendChild(el('td', 'ege-schedule__time', game.kickoff || '\u2014'));

    var opponent = el('td', 'ege-schedule__opponent');
    opponent.appendChild(el('span', 'ege-schedule__side', game.home ? 'vs' : 'at'));
    opponent.appendChild(el('span', 'fb-name', game.opponent));
    if (game.conference) {
      var mark = el('abbr', 'ege-schedule__conf', '*');
      mark.title = 'Conference game';
      opponent.appendChild(mark);
    }
    if (showScouts && game.scouts) { opponent.appendChild(scoutMark()); }
    row.appendChild(opponent);

    var result = el('td', 'num');
    if (EGE.isFinal(game)) {
      var won = game.result.teamScore > game.result.opponentScore;
      result.appendChild(el('span', 'fb-tag fb-tag--num ' + (won ? 'fb-tag--sage' : 'fb-tag--clay'),
        (won ? 'W ' : 'L ') + game.result.teamScore + '\u2013' + game.result.opponentScore));
    } else {
      result.appendChild(el('span', 'ege-schedule__pending', '\u2014'));
    }
    row.appendChild(result);

    return row;
  }

  function renderSchedule(player) {
    var panel = document.getElementById('schedulePanel');
    var body = document.getElementById('scheduleBody');
    var games = EGE.gamesFor(player);

    showScouts = canSeeScouts(player);

    body.innerHTML = '';
    panel.hidden = false;
    document.getElementById('scheduleTableWrap').hidden = !games.length;
    document.getElementById('scheduleEmpty').hidden = Boolean(games.length);

    if (!games.length) {
      document.getElementById('scheduleNote').textContent = EGE.currentSeason;
      document.getElementById('scheduleLegend').textContent = '';
      return;
    }

    games.forEach(function (game) { body.appendChild(scheduleRow(game)); });

    var played = EGE.gamesPlayed(player).length;
    document.getElementById('scheduleNote').textContent = played
      ? EGE.currentSeason + ' \u00b7 ' + games.length + ' games \u00b7 ' + EGE.recordFor(player).text
      : EGE.currentSeason + ' \u00b7 ' + games.length + ' games \u00b7 none played yet';

    var conference = games.filter(function (game) { return game.conference; }).length;
    var legend = conference ? '* conference game (' + conference + ' of ' + games.length + ')' : '';
    if (showScouts) {
      var scouted = EGE.scoutedGames(player).length;
      legend += (legend ? ' \u00b7 ' : '') + 'Intel: scouts at ' + scouted + ' games this season';
    }
    document.getElementById('scheduleLegend').textContent = legend;
  }

  /* --- ratings ---------------------------------------------------------- */

  var ratingsPanel = document.getElementById('ratingsPanel');

  function buildGroup(group) {
    var box = el('div', 'ege-group');

    var head = el('div', 'ege-group__head');
    head.appendChild(el('span', 'ege-group__label', group.label));
    head.appendChild(el('span', 'ege-group__score', group.rating));
    box.appendChild(head);

    group.attributes.forEach(function (attr) {
      var row = el('div', 'ege-attr');
      row.appendChild(el('span', 'ege-attr__label', attr.label));

      var meter = el('div', 'fb-meter');
      var fill = el('div', 'fb-meter__fill' + (attr.value >= 80 ? '' : ' fb-meter__fill--alt'));
      fill.style.width = Math.max(0, Math.min(100, attr.value)) + '%';
      meter.appendChild(fill);
      row.appendChild(meter);

      row.appendChild(el('span', 'ege-attr__value', attr.value));
      box.appendChild(row);
    });

    return box;
  }

  function renderRatings(player) {
    var ratings = EGE.ratingsFor(player);
    var holder = document.getElementById('ratingsGroups');
    holder.innerHTML = '';

    if (!ratings) { ratingsPanel.hidden = true; return; }

    document.getElementById('ratingsOverall').textContent =
      ratings.overall === null ? '—' : ratings.overall;

    ratings.groups.forEach(function (group) { holder.appendChild(buildGroup(group)); });
    ratingsPanel.hidden = false;
  }

  /* --- shop ------------------------------------------------------------- */

  var sayShop = reporter('shopMessage');
  var shopState = { player: null, credits: 0, inventory: [], built: false };

  /* Scouts are in the schedule data all along; Intel is what lets a player
     see them, and only on their own page, for the season they bought it. */
  function canSeeScouts(player) {
    var signedIn = EGE.auth.currentPlayer();
    if (!signedIn || !player || signedIn.slug !== player.slug) { return false; }
    return EGE.wallet.hasIntel(shopState.inventory);
  }

  function creditTag(credits) {
    return el('span', 'fb-tag fb-tag--num fb-tag--gold', credits + ' cr');
  }

  function targetLabel(key) {
    var found = EGE.ratingGroups
      .reduce(function (all, group) { return all.concat(group.attributes); }, [])
      .filter(function (attr) { return attr.key === key; })[0];
    return found ? found.label : key;
  }

  /* --- the catalogue ----------------------------------------------------- */

  function buildShopItem(item) {
    var card = el('div', 'ege-item');

    var head = el('div', 'ege-item__head');
    head.appendChild(el('h4', 'ege-item__name', EGE.itemName(item, shopState.player)));
    head.appendChild(creditTag(item.credits));
    card.appendChild(head);

    if (item.note) { card.appendChild(el('span', 'fb-tag fb-tag--outline', item.note)); }
    if (item.description) { card.appendChild(el('p', 'ege-item__text', item.description)); }

    var picker = null;
    var allowed = EGE.itemAvailable(item, EGE.currentSeason);
    if (!allowed.ok) {
      card.classList.add('ege-item--locked');
      card.appendChild(el('p', 'ege-item__blocked', allowed.reason));
    }

    var buy = el('button', 'fb-btn fb-btn--primary fb-btn--block',
      allowed.ok ? 'Buy' : 'Unavailable');
    buy.type = 'button';
    buy.disabled = !allowed.ok;
    if (picker) { picker.disabled = !allowed.ok; }
    buy.addEventListener('click', function () {
      buy.disabled = true;
      sayShop('Buying\u2026', false);
      EGE.wallet.buy(shopState.player.email, item, null, shopState.player)
        .then(function (res) {
          buy.disabled = false;
          sayShop(res.message, !res.ok);
          if (res.ok) { refreshShop(); }
        });
    });
    card.appendChild(buy);

    return card;
  }

  function buildShopSection(section) {
    var panel = el('div', 'fb-panel ege-section-gap');

    var head = el('div', 'fb-panel__head');
    head.appendChild(el('h3', null, section.title));
    panel.appendChild(head);

    var body = el('div', 'fb-panel__body fb-stack fb-stack--lg');
    if (section.blurb) { body.appendChild(el('p', 'ege-item__text', section.blurb)); }

    if (section.upgrades) {
      body.appendChild(buildUpgrades());
    } else {
      var grid = el('div', 'ege-items');
      section.items.forEach(function (item) { grid.appendChild(buildShopItem(item)); });
      body.appendChild(grid);
    }

    panel.appendChild(body);
    return panel;
  }

  /* Rating points get a table: every attribute this position is judged on,
     what it is at, and what the next point costs. Buying redraws it, because
     the next point always costs a little more. */
  var upgradesBody = null;

  function upgradeRow(row) {
    var tr = el('tr');

    tr.appendChild(el('td', 'ege-upgrade__group', row.group));
    tr.appendChild(el('td', null, row.label));

    var value = el('td', 'num');
    value.appendChild(el('strong', null, row.value));
    if (row.base !== row.value) {
      var moved = row.value - row.base;
      value.appendChild(el('span', 'ege-upgrade__moved', ' ' + (moved > 0 ? '+' : '') + moved));
    }
    tr.appendChild(value);

    var meter = el('td');
    var bar = el('div', 'fb-meter');
    var fill = el('div', 'fb-meter__fill' + (row.value >= 80 ? '' : ' fb-meter__fill--alt'));
    fill.style.width = Math.max(0, Math.min(100, row.value)) + '%';
    bar.appendChild(fill);
    meter.appendChild(bar);
    tr.appendChild(meter);

    var per = el('td', 'num');
    per.appendChild(el('span', 'ege-upgrade__per', row.pointsPerOverall || '\u2014'));
    tr.appendChild(per);

    var action = el('td', 'num');
    if (row.cost === null) {
      action.appendChild(el('span', 'fb-tag fb-tag--outline', 'Maxed'));
    } else {
      var buy = el('button', 'fb-btn fb-btn--primary ege-upgrade__buy');
      buy.type = 'button';
      buy.textContent = '+1  \u00b7  ' + row.cost + ' cr';
      buy.disabled = shopState.credits < row.cost;
      buy.title = row.label + ' ' + row.value + ' \u2192 ' + (row.value + 1);
      buy.addEventListener('click', function () {
        buy.disabled = true;
        sayShop('Buying\u2026', false);
        EGE.wallet.buyUpgrade(shopState.player.email, shopState.player, row.key)
          .then(function (res) {
            sayShop(res.message, !res.ok);
            refreshShop();
          });
      });
      action.appendChild(buy);
    }
    tr.appendChild(action);

    return tr;
  }

  function buildUpgrades() {
    var wrap = el('div', 'fb-tablewrap');
    var table = el('table', 'fb-table ege-upgrades');

    var head = el('thead');
    var headRow = el('tr');
    ['Group', 'Attribute', 'Rating', '', 'Points per +1 OVR', 'Next point']
      .forEach(function (label, i) {
        headRow.appendChild(el('th', i >= 2 ? 'num' : null, label));
      });
    head.appendChild(headRow);
    table.appendChild(head);

    upgradesBody = el('tbody');
    table.appendChild(upgradesBody);
    wrap.appendChild(table);

    refreshUpgrades();
    return wrap;
  }

  function refreshUpgrades() {
    if (!upgradesBody || !shopState.player) { return; }
    upgradesBody.innerHTML = '';
    EGE.economy.upgradePlan(shopState.player).forEach(function (row) {
      upgradesBody.appendChild(upgradeRow(row));
    });
  }

  /* --- the inventory ----------------------------------------------------- */

  function inventoryCard(row, options) {
    var lapsed = EGE.wallet.lapsed(row);
    var live = row.active && !lapsed;
    var card = el('div', 'ege-item' + (live ? ' ege-item--active' : '') +
      (lapsed ? ' ege-item--locked' : ''));

    var state = lapsed ? 'Expired' : (row.active ? 'In effect' : (row.consumable ? 'Unused' : 'Off'));
    var head = el('div', 'ege-item__head');
    head.appendChild(el('h4', 'ege-item__name', row.item_name));
    head.appendChild(el('span', 'fb-tag fb-tag--num ' +
      (live ? 'fb-tag--sage' : (lapsed ? 'fb-tag--clay' : 'fb-tag--outline')), state));
    card.appendChild(head);

    if (typeof row.season === 'number') {
      card.appendChild(el('p', 'ege-item__text', lapsed
        ? 'Bought for the ' + row.season + ' season, which is over.'
        : 'Good for the ' + row.season + ' season only.'));
    }

    if (row.target) {
      card.appendChild(el('p', 'ege-item__text', 'Applied to ' + targetLabel(row.target) + '.'));
    } else if (row.effects && Object.keys(row.effects).length) {
      card.appendChild(el('p', 'ege-item__text', Object.keys(row.effects).map(function (attr) {
        return targetLabel(attr) + ' ' + (row.effects[attr] > 0 ? '+' : '') + row.effects[attr];
      }).join(', ')));
    }

    var actions = el('div', 'fb-row fb-row--wrap');

    if (row.consumable) {
      var use = el('button', 'fb-btn fb-btn--primary', 'Use');
      use.type = 'button';
      use.title = 'Using it spends it';
      use.addEventListener('click', function () {
        use.disabled = true;
        EGE.wallet.useItem(row).then(function (res) {
          options.report(res.message, !res.ok);
          options.refresh();
        });
      });
      actions.appendChild(use);
    } else if (!lapsed) {
      var toggle = el('button', 'fb-btn', row.active ? 'Turn off' : 'Turn on');
      toggle.type = 'button';
      toggle.addEventListener('click', function () {
        toggle.disabled = true;
        EGE.wallet.setActive(row, !row.active).then(function (res) {
          options.report(res.message, !res.ok);
          options.refresh();
        });
      });
      actions.appendChild(toggle);
    }

    if (options.admin) {
      var remove = el('button', 'fb-btn fb-btn--ghost', 'Remove');
      remove.type = 'button';
      remove.addEventListener('click', function () {
        remove.disabled = true;
        EGE.wallet.removeItem(row).then(function (res) {
          options.report(res.message, !res.ok);
          options.refresh();
        });
      });
      actions.appendChild(remove);
    }

    card.appendChild(actions);
    return card;
  }

  /* Everything a player's purchases add up to, attribute by attribute. */
  function boostSummary(rows) {
    var totals = {};
    rows.forEach(function (row) {
      if (!row.active || EGE.wallet.lapsed(row) || !row.effects) { return; }
      Object.keys(row.effects).forEach(function (attr) {
        totals[attr] = (totals[attr] || 0) + row.effects[attr];
      });
    });
    return totals;
  }

  function buildBoostSummary(totals) {
    var keys = Object.keys(totals).filter(function (key) { return totals[key] !== 0; });
    if (!keys.length) { return null; }

    keys.sort(function (a, b) { return totals[b] - totals[a]; });

    var box = el('div', 'ege-applied');
    box.appendChild(el('span', 'fb-eyebrow', 'Applied to your ratings'));

    var list = el('div', 'fb-row fb-row--wrap');
    keys.forEach(function (key) {
      var up = totals[key] > 0;
      list.appendChild(el('span', 'fb-tag fb-tag--num ' + (up ? 'fb-tag--sage' : 'fb-tag--clay'),
        targetLabel(key) + ' ' + (up ? '+' : '') + totals[key]));
    });
    box.appendChild(list);
    return box;
  }

  function renderInventory() {
    var holder = document.getElementById('inventoryItems');
    var applied = document.getElementById('inventoryApplied');
    holder.innerHTML = '';
    applied.innerHTML = '';

    document.getElementById('shopBalance').textContent = shopState.credits;
    document.getElementById('inventoryEmpty').hidden = shopState.inventory.length > 0;

    var summary = buildBoostSummary(boostSummary(shopState.inventory));
    if (summary) { applied.appendChild(summary); }

    /* Points are summed above, not listed: there will be hundreds. */
    var points = shopState.inventory.filter(function (row) { return row.item_key === 'upgrade'; });
    if (points.length) {
      var spent = points.reduce(function (sum, row) { return sum + (row.credits || 0); }, 0);
      var card = el('div', 'ege-item ege-item--active');
      var head = el('div', 'ege-item__head');
      head.appendChild(el('h4', 'ege-item__name', 'Rating Points'));
      head.appendChild(el('span', 'fb-tag fb-tag--num fb-tag--sage', '\u00d7' + points.length));
      card.appendChild(head);
      card.appendChild(el('p', 'ege-item__text',
        spent + ' credits spent on points so far, all of it in your ratings.'));
      holder.appendChild(card);
    }

    shopState.inventory.forEach(function (row) {
      if (row.item_key === 'upgrade') { return; }
      holder.appendChild(inventoryCard(row, {
        admin: false,
        report: sayShop,
        refresh: refreshShop
      }));
    });
  }

  /* --- admin ------------------------------------------------------------- */

  var sayAdmin = reporter('adminMessage');

  function adminAccount(player, credits, rows) {
    var box = el('div', 'ege-account');

    var head = el('div', 'ege-account__head');
    var who = el('div', 'ege-who');
    var photo = el('img', 'ege-avatar ege-avatar--sm');
    photo.src = player.headshot;
    photo.alt = '';
    who.appendChild(photo);
    who.appendChild(el('span', 'ege-account__name', player.name));
    head.appendChild(who);

    var editor = el('div', 'fb-row');
    var input = el('input', 'fb-input ege-account__credits');
    input.type = 'number';
    input.min = '0';
    input.value = credits;
    input.setAttribute('aria-label', 'Credits for ' + player.name);
    editor.appendChild(input);

    var save = el('button', 'fb-btn fb-btn--primary', 'Save');
    save.type = 'button';
    save.addEventListener('click', function () {
      save.disabled = true;
      EGE.wallet.setCredits(player.email, input.value).then(function (res) {
        save.disabled = false;
        sayAdmin(res.ok ? player.first + ' now has ' + res.credits + ' credits.' : res.message, !res.ok);
        refreshShop();
      });
    });
    editor.appendChild(save);
    head.appendChild(editor);
    box.appendChild(head);

    /* Hand something over without charging for it. */
    var granter = el('div', 'fb-row fb-row--wrap');
    var pick = el('select', 'fb-select');
    EGE.shopItems().forEach(function (entry) {
      var opt = el('option', null, entry.item.name);
      opt.value = entry.item.key;
      pick.appendChild(opt);
    });
    granter.appendChild(pick);

    var give = el('button', 'fb-btn', 'Grant');
    give.type = 'button';
    give.addEventListener('click', function () {
      give.disabled = true;
      EGE.wallet.grant(player.email, EGE.shopItem(pick.value)).then(function (res) {
        give.disabled = false;
        sayAdmin(res.message, !res.ok);
        refreshShop();
      });
    });
    granter.appendChild(give);
    box.appendChild(granter);

    if (!rows.length) {
      box.appendChild(el('p', 'fb-meta', 'Nothing bought.'));
    } else {
      var grid = el('div', 'ege-items');
      rows.forEach(function (row) {
        grid.appendChild(inventoryCard(row, { admin: true, report: sayAdmin, refresh: refreshShop }));
      });
      box.appendChild(grid);
    }

    return box;
  }

  function renderAdmin() {
    var panel = document.getElementById('adminPanel');
    panel.hidden = !EGE.wallet.admin();
    if (panel.hidden) { return Promise.resolve(); }

    return Promise.all([EGE.wallet.allCredits(), EGE.wallet.allInventory()])
      .then(function (both) {
        var credits = both[0];
        var inventory = both[1];
        var holder = document.getElementById('adminAccounts');
        holder.innerHTML = '';

        EGE.playersWithAccounts().forEach(function (player) {
          var row = credits.filter(function (c) { return c.email === player.email; })[0];
          var owned = inventory.filter(function (i) { return i.email === player.email; });
          holder.appendChild(adminAccount(player, row ? row.credits : EGE.shop.startingCredits, owned));
        });
      });
  }

  /* --- loading ----------------------------------------------------------- */

  function refreshShop() {
    var player = shopState.player;
    if (!player) { return Promise.resolve(); }

    return Promise.all([
      EGE.wallet.creditsFor(player.email),
      EGE.wallet.inventoryFor(player.email),
      EGE.wallet.loadBoosts()
    ]).then(function (all) {
      shopState.credits = all[0] === null ? EGE.shop.startingCredits : all[0];
      shopState.inventory = all[1];
      renderInventory();
      refreshUpgrades();
      redrawRatings();
      refreshScoutMarks();
      updateNavCredits(shopState.credits);
      return renderAdmin();
    });
  }

  function buildCatalogue() {
    if (shopState.built) { return; }
    shopState.built = true;

    var earnings = document.getElementById('shopEarnings');
    EGE.shop.earnings.forEach(function (row) {
      var tr = el('tr');
      tr.appendChild(el('td', null, row.label));
      var credits = el('td', 'num');
      credits.appendChild(el('strong', null, '+' + row.credits));
      tr.appendChild(credits);
      earnings.appendChild(tr);
    });

    var sections = document.getElementById('shopSections');
    EGE.shop.sections.forEach(function (section) {
      sections.appendChild(buildShopSection(section));
    });
  }

  function renderShop() {
    var player = EGE.auth.currentPlayer();
    shopState.player = player;

    document.getElementById('shopLocked').hidden = Boolean(player);
    document.getElementById('shopContent').hidden = !player;
    if (!player) { return; }

    sayShop('', false);
    buildCatalogue();
    refreshShop();
  }

  /* Boosts land after a page may already have been drawn — the roster's
     overalls and the open player page both need redrawing. */
  function redrawRatings() {
    roster.innerHTML = '';
    renderRoster();

    var hash = window.location.hash.replace(/^#/, '');
    var player = hash ? EGE.playerBySlug(hash) : null;
    if (player) { renderPlayer(player); }
  }

  /* The inventory arrives after a page may already have been drawn, so redraw
     the schedule if what it shows has changed. */
  function refreshScoutMarks() {
    var hash = window.location.hash.replace(/^#/, '');
    var player = hash ? EGE.playerBySlug(hash) : null;
    if (player && canSeeScouts(player) !== showScouts) { renderSchedule(player); }
  }

  /* --- routing ---------------------------------------------------------- */

  function setNav(active) {
    document.getElementById('navPlayers').classList.toggle('is-active', active === 'players');
    document.getElementById('navShop').classList.toggle('is-active', active === 'shop');
  }

  function show(view) {
    viewHome.hidden   = view !== viewHome;
    viewShop.hidden   = view !== viewShop;
    viewPlayer.hidden = view !== viewPlayer;
  }

  function route() {
    var hash = window.location.hash.replace(/^#/, '');
    var player = hash ? EGE.playerBySlug(hash) : null;

    if (hash === 'shop') {
      renderShop();
      show(viewShop);
      setNav('shop');
      document.title = 'Shop \u2014 EGE Football';
    } else if (player) {
      renderPlayer(player);
      show(viewPlayer);
      setNav('players');
      document.title = player.name;
    } else {
      show(viewHome);
      setNav('players');
      document.title = 'EGE Football';
    }
    window.scrollTo(0, 0);
  }

  /* --- portal: shared bits ---------------------------------------------- */

  var panelAuth     = document.getElementById('panelAuth');
  var panelSignedIn = document.getElementById('panelSignedIn');

  var loginPlayer  = document.getElementById('loginPlayer');
  var authForm     = document.getElementById('authForm');
  var authSubmit   = document.getElementById('authSubmit');
  var authLead     = document.getElementById('authLead');
  var authPassword = document.getElementById('authPassword');
  var authConfirm  = document.getElementById('authConfirm');
  var confirmField = document.getElementById('confirmField');
  var modeSwitch   = document.getElementById('modeSwitch');

  /* Writes into one of the modal's message slots. */
  function reporter(id) {
    var node = document.getElementById(id);
    return function (text, isError) {
      node.textContent = text || '';
      node.hidden = !text;
      node.className = 'ege-note' + (isError ? ' ege-note--error' : ' ege-note--ok');
    };
  }

  var sayAuth = reporter('authMessage');

  function showPanel(panel) {
    panelAuth.hidden     = panel !== panelAuth;
    panelSignedIn.hidden = panel !== panelSignedIn;
  }

  function selectedPlayer() { return EGE.playerBySlug(loginPlayer.value); }

  function fillPlayerSelect() {
    EGE.players.forEach(function (player) {
      var opt = el('option', null, player.name + (player.email ? '' : ' \u2014 no account yet'));
      opt.value = player.slug;
      opt.disabled = !player.email;
      loginPlayer.appendChild(opt);
    });
    var first = EGE.playersWithAccounts()[0];
    if (first) { loginPlayer.value = first.slug; }
  }

  /* --- portal: show/hide password --------------------------------------- */

  /* One handler for every eye button; each names the field it reveals. */
  document.addEventListener('click', function (e) {
    var eye = e.target.closest ? e.target.closest('.ege-eye') : null;
    if (!eye) { return; }

    var field = document.getElementById(eye.getAttribute('data-reveals'));
    var reveal = field.type === 'password';

    field.type = reveal ? 'text' : 'password';
    eye.setAttribute('aria-pressed', String(reveal));
    eye.setAttribute('aria-label', reveal ? 'Hide password' : 'Show password');
  });

  /* --- portal: one password, set once ----------------------------------- */

  var mode = 'signin';

  function setMode(next, lead) {
    mode = next;
    var creating = mode === 'create';

    confirmField.hidden = !creating;
    authConfirm.required = creating;
    authPassword.autocomplete = creating ? 'new-password' : 'current-password';
    document.getElementById('passwordLabel').textContent =
      creating ? 'Choose a password' : 'Password';
    authSubmit.textContent = creating ? 'Set Password' : 'Sign In';
    authLead.textContent = lead || '';
    authLead.hidden = !lead;
  }

  /* The portal asks the account table which form this player needs, so
     nobody has to know whether they have signed in before. */
  function loadAccount() {
    var player = selectedPlayer();
    sayAuth('', false);
    authPassword.value = '';
    authConfirm.value = '';
    modeSwitch.hidden = true;

    if (!player || !player.email) {
      authForm.hidden = true;
      authLead.hidden = false;
      authLead.textContent = 'That player has no account yet.';
      return Promise.resolve();
    }

    authForm.hidden = true;
    authLead.hidden = false;
    authLead.textContent = 'Checking this account\u2026';

    return EGE.auth.accountState(player.email).then(function (state) {
      authForm.hidden = false;

      if (state === 'set') {
        setMode('signin', 'Welcome back, ' + player.first + '.');
      } else if (state === 'unset') {
        setMode('create', player.first + ' has no password yet. Pick one now.');
      } else {
        /* Cannot tell — offer sign-in and a way across. */
        setMode('signin', 'Sign in, or set a password if this is your first time.');
        modeSwitch.hidden = false;
      }
    });
  }

  loginPlayer.addEventListener('change', loadAccount);

  modeSwitch.addEventListener('click', function () {
    var player = selectedPlayer();
    if (mode === 'create') {
      setMode('signin', 'Sign in, or set a password if this is your first time.');
      modeSwitch.textContent = 'First time? Set your password';
    } else {
      setMode('create', 'Setting the first password for ' + player.first + '.');
      modeSwitch.textContent = 'Already have a password? Sign in';
    }
  });

  authForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var player = selectedPlayer();
    if (!player || !player.email) { sayAuth('That player has no account yet.', true); return; }

    authSubmit.disabled = true;
    sayAuth('Checking\u2026', false);

    var work = mode === 'create'
      ? EGE.auth.createPassword(player.email, authPassword.value, authConfirm.value)
      : EGE.auth.signIn(player.email, authPassword.value);

    work.then(function (res) {
      authSubmit.disabled = false;
      sayAuth(res.message, !res.ok);

      /* The table said there was no password but Supabase disagrees, so
         put the player on the form that can actually work. */
      if (res.taken) {
        setMode('signin', 'Welcome back, ' + player.first + '.');
        modeSwitch.hidden = true;
      }
      if (res.ok) { authPassword.value = ''; authConfirm.value = ''; }
    });
  });

  /* --- portal: session -------------------------------------------------- */

  document.getElementById('logoutBtn').addEventListener('click', function () {
    EGE.auth.signOut();
  });

  document.getElementById('shopLoginBtn').addEventListener('click', function () {
    openLogin();
  });

  function showSignedOutNav() {
    loginBtn.className = 'fb-btn fb-btn--inverse';
    loginBtn.textContent = 'Log In';
    loginBtn.removeAttribute('title');
    loginBtn.setAttribute('aria-label', 'Open the player portal');
    document.getElementById('navShop').hidden = true;
    document.getElementById('navCredits').hidden = true;
  }

  function showSignedInNav(player) {
    loginBtn.className = 'ege-avatarbtn';
    loginBtn.innerHTML = '';
    var img = el('img', 'ege-avatar');
    img.src = player.headshot;
    img.alt = '';
    loginBtn.appendChild(img);
    loginBtn.title = player.name;
    loginBtn.setAttribute('aria-label', 'Open ' + player.name + '’s portal');

    document.getElementById('navShop').hidden = false;

    document.getElementById('navCredits').hidden = false;
    updateNavCredits(null);
    EGE.wallet.creditsFor(player.email).then(updateNavCredits);
  }

  /* The nav shows what is really in the account, once Supabase answers. */
  function updateNavCredits(credits) {
    var box = document.getElementById('navCredits');
    var shown = credits === null || credits === undefined ? EGE.shop.startingCredits : credits;
    document.getElementById('navCreditsValue').textContent = shown;
    box.title = shown + ' credits to spend in the shop';
  }

  EGE.auth.onChange(function (player) {
    if (player) {
      /* The wallet loads on sign-in, not on reaching the shop: a player page
         needs the inventory too, to know whether to show the scouts. */
      shopState.player = player;
      EGE.wallet.refreshAdmin(player.email)
        .then(refreshShop)
        .then(route);
      showSignedInNav(player);
      document.getElementById('signedInName').textContent = player.name;
      var photo = document.getElementById('signedInPhoto');
      photo.src = player.headshot;
      photo.alt = player.name;
      showPanel(panelSignedIn);
    } else {
      showSignedOutNav();
      showPanel(panelAuth);
      loadAccount();
      shopState.player = null;
      shopState.inventory = [];
      shopState.credits = EGE.shop.startingCredits;
    }
    route();          /* the shop appears and disappears with the session */
  });

  /* --- portal: open and close ------------------------------------------- */

  function openLogin() {
    if (!EGE.auth.available()) {
      authForm.hidden = false;
      authLead.hidden = true;
      sayAuth(EGE.auth.unavailableReason(), true);
      authSubmit.disabled = true;
    }
    loginModal.hidden = false;
    if (!panelAuth.hidden && !authForm.hidden) { authPassword.focus(); }
  }
  function closeLogin() { loginModal.hidden = true; }

  loginBtn.addEventListener('click', openLogin);
  loginModal.addEventListener('click', function (e) {
    if (e.target === loginModal || e.target.hasAttribute('data-close-login')) { closeLogin(); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !loginModal.hidden) { closeLogin(); }
  });

  /* --- go --------------------------------------------------------------- */

  renderRoster();
  fillPlayerSelect();
  route();
  EGE.auth.init();
  window.addEventListener('hashchange', route);
})();
