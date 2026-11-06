/* ==========================================================================
   EGE Football — Game Packs
   A pack of one game's cards for whoever won the most bets on it (Sam,
   2026-11-06). Live Mode's diamond bets (js/live.js) are paid at the final
   whistle by live_settle in supabase/schema.sql, and the same call hands a
   Game Pack to the account with the most winning bets on the game, every
   account tied for the most included. A game with none of the six in it
   has no cards, so it pays no pack.

   The pack is claimed in the Shop once the game's week is published, the
   moment its cards exist: five cards from that game, the six's
   (data/cards.js) and their NFL teammates' (data/nfl-cards.js) --

     - the game's best performance card,
     - its best play card,
     - three more from the game at the standard odds,

   and at least two of the five the six's own, the best two counting
   towards it (Sam picked this, 2026-11-06). A game with only one card of
   the six's has that card twice; a game without a touchdown has a fourth
   random card for its play.

   The page rolls the cards, as it does for every pack, and
   open_game_pack in supabase/schema.sql takes them: five card ids of that
   season and week, the six's only for the six in the game. The cover is
   the two teams' marks overlapping in the middle on a gradient of their
   colours (packArt in js/cards-view.js, .ege-pack--game in site.css).
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.gamePacks = (function () {
  'use strict';

  /* Five cards, at least two of them the six's. open_game_pack holds the
     size too: change both together. */
  var SIZE = 5;
  var SIX_AT_LEAST = 2;
  var SUPER_BOWL_WEEK = 22;

  function team(key) { return (EGE.nfl && EGE.nfl.teams[key]) || { name: String(key || ''), color: '#1d2416' }; }
  function nick(key) { return team(key).name.split(' ').pop(); }

  /* "Cowboys at Texans", or "Chiefs vs. Lions" for the Super Bowl. */
  function title(row) {
    return nick(row.away) + (row.week === SUPER_BOWL_WEEK ? ' vs. ' : ' at ') + nick(row.home);
  }

  /* The six in the game: the server's list from when it went live, or,
     for a game put on before it kept one, whoever of the six was on
     either team that week. */
  function sixOf(row) {
    if (Array.isArray(row.six)) { return row.six; }
    var by = EGE.nflCards ? EGE.nflCards.sixTeams(row.season, row.week) : {};
    return (by[row.home] || []).concat(by[row.away] || []);
  }

  /* Every card of the game: the six's games and plays in it, and their
     teammates' on either side. Nothing before its week is out. */
  function cardsOf(row) {
    if (!row || !EGE.cards || !EGE.isPublished(row.season, row.week)) { return []; }
    var six = sixOf(row);
    var mine = EGE.cards.all().filter(function (c) {
      return c.season === row.season && c.week === row.week && six.indexOf(c.slug) !== -1;
    });
    var mates = EGE.nflCards ? EGE.nflCards.list().filter(function (c) {
      return c.season === row.season && c.week === row.week && (c.simTeam === row.home || c.simTeam === row.away);
    }) : [];
    return mine.concat(mates);
  }

  /* The five cards, worst to best, or [] when the game has too few. */
  function roll(row, rng) {
    var random = rng || Math.random;
    var pool = cardsOf(row);
    if (!pool.length) { return []; }
    var best = pool.slice().sort(EGE.cards.compare);
    var out = [];
    var perf = best.filter(function (c) { return c.kind === 'performance'; })[0];
    var play = best.filter(function (c) { return c.kind === 'play'; })[0];
    if (perf) { out.push(perf); }
    if (play) { out.push(play); }
    var six = pool.filter(function (c) { return !c.nfl; });

    /* One at the standard odds, a card not in the pack yet where there
       is one. */
    function draw(from) {
      var fresh = from.filter(function (c) { return out.indexOf(c) === -1; });
      return EGE.cards.drawFrom(fresh.length ? fresh : from, random);
    }

    while (out.length < SIZE) {
      var left = SIZE - out.length;
      var have = out.filter(function (c) { return !c.nfl; }).length;
      var owed = six.length ? Math.max(0, SIX_AT_LEAST - have) : 0;
      var card = draw(owed >= left ? six : pool);
      if (!card) { break; }
      out.push(card);
    }
    return out.length === SIZE ? EGE.cards.packOrder(out) : [];
  }

  /* A colour a share of the way to white (or, below 0, to black), as hex. */
  function mix(hex, share) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ''));
    var n = m ? parseInt(m[1], 16) : 0x1d2416;
    var to = share < 0 ? 0 : 255;
    var s = Math.abs(share);
    return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(function (v) {
      return Math.round(v + (to - v) * s).toString(16).padStart(2, '0');
    }).join('');
  }

  /* A Game Pack as the Shop draws one: a pack like the others, with the
     two teams for its cover and their colours to print it in. */
  function pack(row) {
    var away = team(row.away);
    var home = team(row.home);
    return {
      key: 'game',
      name: 'Game Pack',
      size: SIZE,
      game: row,
      title: title(row),
      cover: {
        theme: 'game',
        teams: [row.away, row.home],
        colors: { away: away.color, awayHi: mix(away.color, 0.45), home: home.color, homeHi: mix(home.color, 0.45),
                  deep: mix(home.color, -0.55) }
      },
      blurb: 'Five cards from the game, its best performance and best play among them.'
    };
  }

  /* The live game a card_packs row was a Game Pack of: 'game:2027-5-dal-hou'
     is the Cowboys at the Texans, week 5 of 2027. */
  function fromKey(key) {
    var m = /^game:(\d{4})-(\d{1,2})-([a-z]+)-([a-z]+)$/.exec(String(key || ''));
    if (!m) { return null; }
    return { season: Number(m[1]), week: Number(m[2]), away: m[3].toUpperCase(), home: m[4].toUpperCase() };
  }

  return {
    SIZE: SIZE,
    SIX_AT_LEAST: SIX_AT_LEAST,
    title: title,
    sixOf: sixOf,
    cardsOf: cardsOf,
    roll: roll,
    pack: pack,
    fromKey: fromKey
  };
})();
