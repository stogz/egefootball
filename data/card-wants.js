/* ==========================================================================
   EGE Football — the Want List
   What a player is looking for in trades (Sam, 2026-11-06): teams,
   players and single cards. The Trades page shows who has a card on your
   list and which of your cards are on theirs (js/cards-view.js); the
   lists themselves are kept in card_wants (supabase/schema.sql).

   A want is a short string, the way it is stored:

     team:detroit            every card of a team: the six's own while they
                             played for it and their NFL teammates' there
                             (a school or an NFL team, by its key in
                             EGE.teams)
     player:dj-moore         every card of one player, one of the six or an
                             NFL teammate
     card:p:2021:sam-...:5   one card, exactly that one (a holo of it is a
                             card of its own)

   A team or a player can carry a rarity floor, '@epic' on the end: only
   cards that rare or rarer count. An event's reward card never trades, so
   it is never a match.

   Finding who has what: the page asks card_want_holders for the cards of
   the players and seasons a list could reach ('2025:dj-moore', which the
   card ids carry) and the cards it names, then checks every card that
   comes back against the list here. The database cannot tell a card's team
   or rarity from its id, so it hands back a little more than matches and
   this keeps only what does.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.cardWants = (function () {
  'use strict';

  /* The most a list holds; set_card_wants agrees. */
  var MAX = 30;

  var KINDS = ['team', 'player', 'card'];

  /* The floors a team or a player can carry: Uncommon or better and up.
     Common is no floor at all. */
  function floors() {
    return EGE.cards.RARITIES.slice(1).map(function (r) { return r.key; });
  }

  /* --- one want ------------------------------------------------------------ */

  var parsed = {};

  /* { key, kind, value, floor } for a stored want, or null for one this
     page cannot read. */
  function parse(key) {
    var s = String(key || '');
    if (parsed[s] !== undefined) { return parsed[s]; }
    var out = null;
    var m = s.match(/^(team|player|card):(.+)$/);
    if (m) {
      var value = m[2];
      var floor = null;
      if (m[1] !== 'card') {
        var at = value.match(/^(.+)@([a-z]+)$/);
        if (at) { value = at[1]; floor = at[2]; }
        if (floor && floors().indexOf(floor) === -1) { value = null; }
      }
      if (value) { out = { key: s, kind: m[1], value: value, floor: floor }; }
    }
    parsed[s] = out;
    return out;
  }

  function make(kind, value, floor) {
    return kind + ':' + value + (kind !== 'card' && floor ? '@' + floor : '');
  }

  /* What a want is for, without its floor: two wants for one team are one. */
  function target(key) {
    var w = parse(key);
    return w ? w.kind + ':' + w.value : String(key);
  }

  /* Whether `card` is one `want` (parsed) is after. */
  function fits(want, card) {
    if (!want || !card || card.reward) { return false; }
    if (want.kind === 'card') { return card.id === want.value; }
    if (want.floor && EGE.cards.rankOf(card.rarity) < EGE.cards.rankOf(want.floor)) { return false; }
    return want.kind === 'player' ? card.slug === want.value : card.teamKey === want.value;
  }

  /* `keys` are a list's stored wants. */
  function list(keys) {
    return (keys || []).map(parse).filter(Boolean);
  }

  function fitsAny(keys, card) {
    return list(keys).some(function (w) { return fits(w, card); });
  }

  /* The cards out of `owned` ({ card id: copies }) a list is after, rarest
     first. */
  function matching(keys, owned) {
    var wants = list(keys);
    if (!wants.length || !owned) { return []; }
    return Object.keys(owned).filter(function (id) { return owned[id] > 0; }).map(EGE.cards.byId)
      .filter(function (card) { return card && wants.some(function (w) { return fits(w, card); }); })
      .sort(EGE.cards.compare);
  }

  /* --- what to ask the database for ------------------------------------------ */

  /* Every card a team or a player could be on: the six's, and their NFL
     teammates' once those are read. */
  function catalogue() {
    var nfl = EGE.nflCards && EGE.nflCards.loaded() ? EGE.nflCards.list() : [];
    return EGE.cards.all().concat(nfl);
  }

  /* { keys: ['2025:dj-moore'], cards: [card id] } for card_want_holders:
     the season and player of every card a team or a player on the list
     could be, and the cards the list names. */
  function ask(keys) {
    var wants = list(keys);
    var seen = {};
    var out = { keys: [], cards: [] };
    var broad = wants.filter(function (w) { return w.kind !== 'card'; });
    wants.forEach(function (w) { if (w.kind === 'card') { out.cards.push(w.value); } });
    if (broad.length) {
      catalogue().forEach(function (card) {
        var key = card.season + ':' + card.slug;
        if (seen[key]) { return; }
        var hit = broad.some(function (w) {
          return w.kind === 'player' ? card.slug === w.value : card.teamKey === w.value;
        });
        if (hit) { seen[key] = true; out.keys.push(key); }
      });
    }
    return out;
  }

  /* --- the picker's lists ------------------------------------------------------ */

  function teamOf(key) {
    var t = EGE.teams && EGE.teams[key];
    if (!t) { return null; }
    return { key: key, name: t.school, short: t.short || t.school, logo: t.logo || null, ground: t.ground || null,
             white: Boolean(t.whiteMark), nfl: t.tier === 'nfl' };
  }

  /* The teams there are cards of: the NFL teams of the six and their
     teammates, in the NFL cards' order, then the six's schools. */
  function teams() {
    var out = [];
    var seen = {};
    function add(key) {
      if (!key || seen[key]) { return; }
      var t = teamOf(key);
      if (!t) { return; }
      seen[key] = true;
      out.push(t);
    }
    if (EGE.nflCards && EGE.nflCards.loaded()) {
      EGE.nflCards.teams().forEach(function (t) {
        var sim = EGE.nfl && EGE.nfl.teams[t.key];
        add(sim ? sim.site : null);
      });
    }
    var schools = [];
    EGE.cards.all().forEach(function (card) {
      var t = EGE.teams[card.teamKey];
      if (!t) { return; }
      if (t.tier === 'nfl') { add(card.teamKey); } else if (schools.indexOf(card.teamKey) === -1) { schools.push(card.teamKey); }
    });
    Object.keys(EGE.teams).forEach(function (key) { if (schools.indexOf(key) !== -1) { add(key); } });
    return out;
  }

  /* One of the six, or an NFL teammate, by slug: { slug, name, headshot,
     sub, nfl }. */
  function playerOf(slug) {
    var six = EGE.playerBySlug(slug);
    if (six) {
      return { slug: slug, name: six.name, headshot: six.headshot, sub: EGE.positionFor(six) || '', nfl: false };
    }
    var mate = EGE.nflCards && EGE.nflCards.loaded() ? EGE.nflCards.playerOf(slug) : null;
    if (!mate) { return null; }
    var team = EGE.nfl && EGE.nfl.teams[mate.simTeam];
    return { slug: slug, name: mate.name, headshot: mate.headshot, nfl: true,
             sub: [mate.position, team ? team.name.split(' ').pop() : mate.simTeam].filter(Boolean).join(' · ') };
  }

  /* The players to pick from: the six, then the NFL teammates whose name
     has every word of `query` in it, the ones with the most cards first,
     `limit` of them. */
  function players(query, limit) {
    var words = String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
    function named(name) {
      var low = String(name).toLowerCase();
      return words.every(function (w) { return low.indexOf(w) !== -1; });
    }
    var out = EGE.players.filter(function (p) { return named(p.name); }).map(function (p) { return playerOf(p.slug); });
    if (EGE.nflCards && EGE.nflCards.loaded()) {
      var all = EGE.nflCards.players();
      var mates = Object.keys(all).filter(function (slug) { return named(all[slug].name); })
        .map(function (slug) { return { slug: slug, n: EGE.nflCards.cardsOf(slug).length }; })
        .sort(function (a, b) { return b.n - a.n || (a.slug < b.slug ? -1 : 1); })
        .slice(0, limit || 40);
      out = out.concat(mates.map(function (m) { return playerOf(m.slug); }).filter(Boolean));
    }
    return out;
  }

  /* What a want reads as on the page: { name, sub, image, round, card }.
     `card` is the card a single-card want is for, once it can be found. */
  function label(key) {
    var w = parse(key);
    if (!w) { return null; }
    var floor = w.floor ? EGE.cards.rarity(w.floor).name + '+' : '';
    if (w.kind === 'team') {
      var t = teamOf(w.value);
      return { name: t ? (t.nfl ? t.short : t.name) : w.value, sub: floor, image: t ? t.logo : null,
               ground: t ? t.ground : null, white: t ? t.white : false, round: false };
    }
    if (w.kind === 'player') {
      var p = playerOf(w.value);
      return { name: p ? p.name : w.value.replace(/-/g, ' '), sub: floor, image: p ? p.headshot : null,
               round: true, nfl: p ? p.nfl : false };
    }
    var card = EGE.cards.byId(w.value);
    if (!card) { return { name: 'A card', sub: '', image: null, round: true }; }
    return {
      name: card.player.name,
      sub: [card.season, card.week ? 'Wk ' + card.week : '', card.kind === 'play' ? 'Play' : 'Game',
            card.holo2 ? 'Holo II' : card.holo ? 'Holo' : ''].filter(Boolean).join(' · '),
      image: card.player.headshot || null, round: true, card: card
    };
  }

  return {
    MAX: MAX,
    KINDS: KINDS,
    floors: floors,
    parse: parse,
    make: make,
    target: target,
    fits: fits,
    fitsAny: fitsAny,
    matching: matching,
    ask: ask,
    teams: teams,
    players: players,
    playerOf: playerOf,
    label: label
  };
})();
