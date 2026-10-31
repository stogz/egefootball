/* ==========================================================================
   EGE Football — the diamonds page
   Opened from the diamond balance in the nav (Sam, 2026-10-20): where the
   signed-in player's diamonds came from.

   Recent Games is a box a week, newest first, holding every game that week
   that paid them anything: their own game (game-w{week} in diamond_awards)
   and each game one of their Player Cards paid a bonus on (pc-{slug}-w{week}),
   with the week's total. A row opens that game in the player's game log.
   Other Earnings, under it, is everything else that paid them, newest first
   (Sam, 2026-10-20): the holos they have made since merging one started
   paying (card_merges.diamonds), the Library and event sets they have
   completed (the diamonds in each claim's reward), and the cards they have
   sold on the market (each sale's price).

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
  var OTHERS_AT_A_TIME = 10;

  var state = {
    email: null,        /* whose page was last drawn */
    history: null,      /* { awards, merges, sets, eventSets, sales } from EGE.wallet.diamondHistory */
    balance: null,
    shown: WEEKS_AT_A_TIME,
    othersShown: OTHERS_AT_A_TIME,
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
    var hit = EGE.cards.PLAYER_RANKS.map(function (r) { return EGE.cards.playerRank(r.key); })
      .filter(function (r) { return r.bonus && String(note || '').indexOf(r.name + ' ') === 0; })[0];
    return hit ? hit.key : null;
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
      var rank = row.rank ? EGE.cards.playerRank(row.rank) : null;
      var why = el('span', 'ege-dgame__why');
      if (rank) {
        var pip = el('span', 'ege-dgame__pip', '\u25c6');
        pip.style.color = rank.color;
        why.appendChild(pip);
      }
      why.appendChild(document.createTextNode((rank ? rank.name + ' ' : '') + 'Player Card' +
        (rank && rank.bonus ? ' \u00b7 +' + Math.round(rank.bonus * 100) + '%' : '')));
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

  /* --- everything else that paid ------------------------------------------- */

  function rewardDiamonds(reward) {
    return Math.max(0, Number(reward && reward.diamonds) || 0);
  }

  /* A set's name from its key, out of the Library's sets or an event's
     (`event` is its key). */
  function setName(key, event) {
    var set = (event ? EGE.cards.eventSets(event) : EGE.cards.sets()).filter(function (one) {
      return one.key === key;
    })[0];
    return set ? set.name : key;
  }

  function playerByEmail(email) {
    var low = String(email || '').toLowerCase();
    return EGE.players.filter(function (p) { return p.email && p.email.toLowerCase() === low; })[0] || null;
  }

  /* Holos made, sets completed and cards sold, as one list, newest first:
     [{ kind: 'holo' | 'set' | 'sale', at, diamonds, ... }]. */
  function othersFrom(history) {
    var out = [];
    (history.merges || []).forEach(function (m) {
      out.push({ kind: 'holo', at: m.merged_at, diamonds: m.diamonds, card: EGE.cards.byId(m.card_id) });
    });
    (history.sets || []).forEach(function (claim) {
      var paid = rewardDiamonds(claim.reward);
      if (!paid) { return; }
      out.push({ kind: 'set', at: claim.claimed_at, diamonds: paid,
                 name: setName(claim.set_key, false), group: 'Library set' });
    });
    (history.eventSets || []).forEach(function (claim) {
      var paid = rewardDiamonds(claim.reward);
      if (!paid) { return; }
      var whole = claim.set_key === claim.event_key;
      var ev = EGE.cards.eventOf(claim.event_key) || EGE.cards.GOLD_RUSH;
      out.push({ kind: 'set', at: claim.claimed_at, diamonds: paid, gold: true,
                 name: whole ? 'Every ' + ev.name + ' set' : setName(claim.set_key, ev.key),
                 group: ev.name + (whole ? ' reward' : ' set') });
    });
    (history.sales || []).forEach(function (sale) {
      if (!(sale.price > 0)) { return; }
      out.push({ kind: 'sale', at: sale.resolved_at, diamonds: sale.price, card: EGE.cards.byId(sale.card_id),
                 rarity: sale.rarity, buyer: playerByEmail(sale.buyer_email) });
    });
    return out.sort(function (a, b) { return new Date(b.at || 0) - new Date(a.at || 0); });
  }

  function day(at) {
    return at ? new Date(at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
  }

  /* Which game a card is of, in a few words. */
  function cardWhat(card) {
    return card.season + ' \u00b7 ' + (card.event || 'Week ' + card.week) + ' \u00b7 ' +
      (card.kind === 'play' ? 'play' : card.kind === 'reward' ? 'event card' : 'performance');
  }

  function otherRow(item) {
    var row = el('li', 'ege-dother');
    var card = item.card;
    var rarityKey = card ? card.rarity : item.rarity;
    var pip = el('span', 'ege-dother__pip', '\u25c6');
    pip.style.color = item.kind === 'set'
      ? (item.gold ? EGE.cards.rarity('mystic').color : 'var(--fb-accent)')
      : EGE.cards.rarity(rarityKey).color;
    row.appendChild(pip);

    var text = el('span', 'ege-dgame__text');
    var top = el('span', 'ege-dgame__top');
    var bits = [];
    if (item.kind === 'set') {
      top.appendChild(el('span', 'ege-dgame__name', item.name));
      top.appendChild(el('span', 'ege-dgame__score', item.group));
      bits.push('Set completed');
    } else {
      top.appendChild(el('span', 'ege-dgame__name', card ? card.player.name : 'A card no longer out'));
      if (card) { top.appendChild(el('span', 'ege-dgame__score', cardWhat(card))); }
      if (item.kind === 'holo') {
        /* The card merged is a holo when what it made is a Holo II. */
        var two = Boolean(card && card.holo);
        bits.push(two ? 'Holo II made' : 'Holo made');
        if (card) {
          bits.push(EGE.cards.rarity(card.rarity).name +
            (card.eventKey ? ' ' + EGE.cards.eventOf(card.eventKey).name : '') + (card.costume ? ' costume' : ''));
          /* What it paid is a tenth of the holo's points, so those are
             the points it shows. */
          bits.push(points(card.points * EGE.cards.HOLO_OF) + (two ? ' FPTS Holo II' : ' FPTS holo'));
        }
      } else {
        bits.push('Sold on the Market' + (item.buyer ? ' to ' + item.buyer.first : ''));
        bits.push(EGE.cards.rarity(rarityKey).name + (card && card.holo2 ? ' Holo II' : card && card.holo ? ' holo' : ''));
      }
    }
    bits.push(day(item.at));
    text.appendChild(top);
    text.appendChild(el('span', 'ege-dgame__why', bits.filter(Boolean).join(' \u00b7 ')));
    row.appendChild(text);

    var paid = el('span', 'ege-dgame__paid');
    paid.appendChild(gems(item.diamonds, true));
    row.appendChild(paid);
    return row;
  }

  /* "Holos 14 · Sets 32 · Market 40", leaving out what has paid nothing. */
  function othersSplit(items) {
    var sum = { holo: 0, set: 0, sale: 0 };
    items.forEach(function (item) { sum[item.kind] += item.diamonds; });
    return [['Holos', sum.holo], ['Sets', sum.set], ['Market', sum.sale]]
      .filter(function (one) { return one[1] > 0; })
      .map(function (one) { return one[0] + ' ' + one[1]; })
      .join(' \u00b7 ');
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
      byId('diamondsOtherPanel').hidden = true;
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

    var others = othersFrom(state.history);
    byId('diamondsOtherPanel').hidden = !others.length;
    var list = byId('diamondsOthers');
    list.innerHTML = '';
    others.slice(0, state.othersShown).forEach(function (item) { list.appendChild(otherRow(item)); });
    byId('diamondsOtherMeta').textContent = othersSplit(others);
    byId('diamondsOtherMore').hidden = others.length <= state.othersShown;
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
      state.othersShown = OTHERS_AT_A_TIME;
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

  byId('diamondsOtherMore').addEventListener('click', function () {
    state.othersShown += OTHERS_AT_A_TIME;
    draw();
  });

  return {
    render: render
  };
})();
