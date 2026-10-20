/* ==========================================================================
   EGE Football — the diamonds page
   Opened from the diamond balance in the nav (Sam, 2026-10-20): where the
   signed-in player's diamonds came from.

   Recent Games is a box a week, newest first, holding every game that week
   that paid them anything: their own game (game-w{week} in diamond_awards)
   and each game one of their Player Cards paid a bonus on (pc-{slug}-w{week}),
   with the week's total. A row opens that game in the player's game log.
   Holo Bonuses, under it, is every holo they have made since merging one
   started paying (card_merges.diamonds), newest first.

   Nothing here is worked out again from the season files: it is what the
   ledger says was paid. The season files only put a score, an opponent and a
   booster beside each row.

   Signed-in players only, like the shop. js/app.js routes #diamonds here and
   calls render().

   Depends on: data/cards.js, js/wallet.js, js/auth.js.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.diamondsView = (function () {
  'use strict';

  var WEEKS_AT_A_TIME = 6;

  var state = {
    email: null,        /* whose page was last drawn */
    history: null,      /* { awards, merges } from EGE.wallet.diamondHistory */
    balance: null,
    shown: WEEKS_AT_A_TIME,
    failed: false
  };

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text != null) { node.textContent = text; }
    return node;
  }

  function byId(id) { return document.getElementById(id); }

  /* A diamond count with the diamond after it, the way prices are written. */
  function gems(n, signed) {
    var wrap = el('span', 'ege-price', (signed ? '+' : '') + n);
    var gem = el('span', 'ege-gem');
    gem.setAttribute('role', 'img');
    gem.setAttribute('aria-label', 'diamonds');
    wrap.appendChild(gem);
    return wrap;
  }

  function points(n) {
    var shown = Math.round(n * 10) / 10;
    return (shown < 0 ? '\u2212' : '') + Math.abs(shown).toFixed(1);
  }

  /* --- reading the ledger --------------------------------------------------- */

  /* The rank a Player Card bonus was paid at, out of its note ("Rare Sam
     Player Card, week 4 v ..."), or null for one that does not say. */
  function rankIn(note) {
    var m = /^(Uncommon|Rare|Epic|Legendary|Mystic|Iconic) /.exec(note || '');
    return m ? m[1].toLowerCase() : null;
  }

  /* The ledger's rows as games, a week to a box: [{ season, week, total,
     rows: [{ player, game, own, card, rank }] }], newest week first. A row
     is one game: `own` is what it paid as the account's own game, `card`
     what it paid through their Player Card on that player (at `rank`), so
     their own game with their own Player Card on it is one row with both.
     Their own game first in each box, then the biggest. */
  function weeksFrom(awards, me) {
    var byWeek = {};
    awards.forEach(function (a) {
      var own = /^game-w(\d+)$/.exec(a.award_key);
      var pc = /^pc-([a-z]+(?:-[a-z]+)*)-w(\d+)$/.exec(a.award_key);
      var player = own ? me : pc ? EGE.playerBySlug(pc[1]) : null;
      if (!player || !(a.diamonds > 0)) { return; }
      var week = Number(own ? own[1] : pc[2]);
      var season = Number(a.season);
      var key = season + ':' + week;
      var box = byWeek[key] || (byWeek[key] = { season: season, week: week, total: 0, rows: [], bySlug: {} });
      var row = box.bySlug[player.slug];
      if (!row) {
        row = box.bySlug[player.slug] = {
          player: player, game: EGE.gameInWeek(player, week, season), own: 0, card: 0, rank: null
        };
        box.rows.push(row);
      }
      if (own) { row.own += a.diamonds; } else { row.card += a.diamonds; row.rank = rankIn(a.note); }
      box.total += a.diamonds;
    });
    var out = Object.keys(byWeek).map(function (k) { return byWeek[k]; });
    out.forEach(function (box) {
      box.rows.sort(function (a, b) {
        return (b.own ? 1 : 0) - (a.own ? 1 : 0) || (b.own + b.card) - (a.own + a.card);
      });
    });
    return out.sort(function (a, b) { return b.season - a.season || b.week - a.week; });
  }

  /* What the live season has paid, split the way the rows are. */
  function seasonSplit(awards) {
    var games = 0;
    var cards = 0;
    awards.forEach(function (a) {
      if (Number(a.season) !== EGE.currentSeason || !(a.diamonds > 0)) { return; }
      if (/^game-w\d+$/.test(a.award_key)) { games += a.diamonds; }
      else if (/^pc-.+-w\d+$/.test(a.award_key)) { cards += a.diamonds; }
    });
    return { games: games, cards: cards };
  }

  /* --- drawing ---------------------------------------------------------------- */

  function result(game) {
    if (!game || !EGE.hasResult(game)) { return ''; }
    var r = game.result;
    var mark = r.teamScore > r.opponentScore ? 'W' : r.teamScore < r.opponentScore ? 'L' : 'T';
    return mark + ' ' + r.teamScore + '\u2013' + r.opponentScore + ' ';
  }

  function versus(game) {
    return (game.home || game.neutral ? 'vs ' : 'at ') + game.opponent;
  }

  /* One game: who, the score, why it paid, and what. */
  function gameRow(row, season) {
    var game = row.game;
    var link = el('a', 'ege-dgame');
    link.href = '#' + row.player.slug;
    link.title = 'Open ' + row.player.first + '\u2019s game log at this game';
    link.addEventListener('click', function (e) {
      e.preventDefault();
      EGE.goToGame(row.player.slug, season, game ? game.week : null);
    });

    var face = el('img', 'ege-dgame__face');
    face.src = row.player.headshot;
    face.alt = '';
    face.loading = 'lazy';
    link.appendChild(face);

    var text = el('span', 'ege-dgame__text');
    var top = el('span', 'ege-dgame__top');
    top.appendChild(el('span', 'ege-dgame__name', row.player.name));
    if (game) {
      top.appendChild(el('span', 'ege-dgame__score', result(game) + versus(game)));
    }
    text.appendChild(top);

    /* Why it paid: a line for their own game and a line for their Player
       Card, each with its share when the game paid both. */
    var both = row.own > 0 && row.card > 0;
    if (row.own) {
      var bits = ['Your game'];
      if (game && game.stats) { bits.push(points(EGE.economy.fantasyPoints(game.stats)) + ' FPTS'); }
      var booster = game && EGE.boosterOn ? EGE.boosterOn(row.player, game) : null;
      if (booster) { bits.push(booster.name); }
      if (game && EGE.economy.playoffBoosted(season, game.playoff)) {
        bits.push('Playoff ' + EGE.economy.PLAYOFF_DIAMONDS + 'x');
      }
      var mine = el('span', 'ege-dgame__why', bits.join(' \u00b7 '));
      if (both) { mine.appendChild(document.createTextNode(' \u00b7 ')); mine.appendChild(gems(row.own, true)); }
      text.appendChild(mine);
    }
    if (row.card) {
      var rank = row.rank ? EGE.cards.rarity(row.rank) : null;
      var tier = rank ? EGE.cards.PLAYER_RANKS.filter(function (r) { return r.key === row.rank; })[0] : null;
      var why = el('span', 'ege-dgame__why');
      if (rank) {
        var pip = el('span', 'ege-dgame__pip', '\u25c6');
        pip.style.color = rank.color;
        why.appendChild(pip);
      }
      why.appendChild(document.createTextNode((rank ? rank.name + ' ' : '') + 'Player Card' +
        (tier && tier.bonus ? ' \u00b7 +' + Math.round(tier.bonus * 100) + '%' : '')));
      if (both) { why.appendChild(document.createTextNode(' \u00b7 ')); why.appendChild(gems(row.card, true)); }
      text.appendChild(why);
    }
    if (game && game.name) { text.appendChild(el('span', 'ege-dgame__why', game.name)); }
    link.appendChild(text);

    var paid = el('span', 'ege-dgame__paid');
    paid.appendChild(gems(row.own + row.card, true));
    link.appendChild(paid);
    return link;
  }

  function weekBox(box) {
    var node = el('article', 'ege-dweek');
    var head = el('div', 'ege-dweek__head');
    head.appendChild(el('span', 'ege-dweek__title', 'Week ' + box.week + ' \u00b7 ' + box.season));
    var total = el('span', 'ege-dweek__total');
    total.appendChild(gems(box.total, true));
    head.appendChild(total);
    node.appendChild(head);
    box.rows.forEach(function (row) { node.appendChild(gameRow(row, box.season)); });
    return node;
  }

  function holoRow(merge) {
    var card = EGE.cards.byId(merge.card_id);
    var item = el('li', 'ege-dholo');
    var pip = el('span', 'ege-dholo__pip', '\u25c6');
    if (card) { pip.style.color = EGE.cards.rarity(card.rarity).color; }
    item.appendChild(pip);

    var text = el('span', 'ege-dgame__text');
    var top = el('span', 'ege-dgame__top');
    top.appendChild(el('span', 'ege-dgame__name', card ? card.player.name : 'A card no longer out'));
    if (card) {
      top.appendChild(el('span', 'ege-dgame__score',
        card.season + ' \u00b7 ' + (card.event || 'Week ' + card.week) + ' \u00b7 ' +
        (card.kind === 'play' ? 'play' : 'performance')));
    }
    text.appendChild(top);
    var when = new Date(merge.merged_at);
    text.appendChild(el('span', 'ege-dgame__why',
      (card ? EGE.cards.rarity(card.rarity).name + (card.gold ? ' Gold Rush' : '') + ' holo \u00b7 ' +
        points(card.points) + ' FPTS card \u00b7 ' : '') +
      'made ' + when.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })));
    item.appendChild(text);

    var paid = el('span', 'ege-dgame__paid');
    paid.appendChild(gems(merge.diamonds, true));
    item.appendChild(paid);
    return item;
  }

  function draw() {
    var me = EGE.auth.currentPlayer();
    var games = byId('diamondsGames');
    var empty = byId('diamondsEmpty');
    var more = byId('diamondsMore');
    games.innerHTML = '';

    byId('diamondsBalance').textContent = typeof state.balance === 'number' ? state.balance : '\u2014';

    if (!state.history) {
      byId('diamondsSeason').textContent = '';
      empty.hidden = false;
      empty.textContent = state.failed ? 'Your diamonds could not be loaded. Try again in a moment.' : 'Loading\u2026';
      more.hidden = true;
      byId('diamondsHoloPanel').hidden = true;
      return;
    }

    var split = seasonSplit(state.history.awards);
    byId('diamondsSeason').textContent = split.games || split.cards
      ? EGE.currentSeason + ': ' + split.games + ' from your games \u00b7 ' + split.cards + ' from Player Cards'
      : '';

    var weeks = weeksFrom(state.history.awards, me);
    weeks.slice(0, state.shown).forEach(function (box) { games.appendChild(weekBox(box)); });
    empty.hidden = weeks.length > 0;
    empty.textContent = 'No games have paid you diamonds yet. Every game you play pays them, ' +
      'and so does every game a ranked Player Card is on.';
    more.hidden = weeks.length <= state.shown;

    var merges = state.history.merges || [];
    byId('diamondsHoloPanel').hidden = !merges.length;
    var holos = byId('diamondsHolos');
    holos.innerHTML = '';
    merges.forEach(function (m) { holos.appendChild(holoRow(m)); });
    var holoTotal = merges.reduce(function (sum, m) { return sum + m.diamonds; }, 0);
    byId('diamondsHoloMeta').textContent = holoTotal + ' from ' + merges.length +
      (merges.length === 1 ? ' holo' : ' holos');
  }

  /* Draws the page for whoever is signed in, from the ledger as it is now.
     The weeks already opened with Show more stay open on a redraw of the
     same account's page. */
  function render() {
    var player = EGE.auth.currentPlayer();
    byId('diamondsLocked').hidden = Boolean(player);
    byId('diamondsContent').hidden = !player;
    if (!player) { return; }

    if (state.email !== player.email) {
      state.email = player.email;
      state.history = null;
      state.balance = null;
      state.shown = WEEKS_AT_A_TIME;
    }
    state.failed = false;
    draw();

    var email = player.email;
    Promise.all([
      EGE.wallet.diamondHistory(email),
      EGE.wallet.diamondsFor(email)
    ]).then(function (both) {
      if (state.email !== email) { return; }
      state.failed = !both[0];
      if (both[0]) { state.history = both[0]; }
      if (typeof both[1] === 'number') { state.balance = both[1]; }
      draw();
    });
  }

  byId('diamondsMore').addEventListener('click', function () {
    state.shown += WEEKS_AT_A_TIME;
    draw();
  });

  return {
    render: render
  };
})();
