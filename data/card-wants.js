/* ==========================================================================
   EGE Football — the Want List
   What a player is looking for in trades (Sam, 2026-11-06): NFL teams and
   players. The Trades page shows who has a card on your list and which of
   your cards are on theirs (js/cards-view.js); the lists themselves are
   kept in card_wants (supabase/schema.sql).

   A want is a short string, the way it is stored:

     team:detroit       every NFL teammate card of a team, by its key in
                        EGE.teams; the six's own cards are not in it (Sam,
                        2026-11-06), a player want is how to ask for those
     player:dj-moore    every card of one player, one of the six or an NFL
                        teammate

   Either can carry a rarity floor, '@epic' on the end: only cards that rare
   or rarer count. An event's reward card never trades, so it is never a
   match. (Single cards and the six's schools were on it at first; Sam took
   them off, 2026-11-06.)

   Finding who has what: the page asks card_want_holders for the cards of
   the players and seasons a list could reach ('2025:dj-moore', which the
   card ids carry), then checks every card that comes back against the
   list here. The database cannot tell a card's team or rarity from its id,
   so it hands back a little more than matches and this keeps only what
   does.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.cardWants = (function () {
  'use strict';

  /* The most a list holds; set_card_wants agrees. */
  var MAX = 30;

  var KINDS = ['team', 'player'];

  /* The floors a want can carry: Uncommon or better and up. Common is no
     floor at all. */
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
    var m = s.match(/^(team|player):([^@]+)(?:@([a-z]+))?$/);
    if (m && (!m[3] || floors().indexOf(m[3]) !== -1)) {
      out = { key: s, kind: m[1], value: m[2], floor: m[3] || null };
    }
    parsed[s] = out;
    return out;
  }

  function make(kind, value, floor) {
    return kind + ':' + value + (floor ? '@' + floor : '');
  }

  /* What a want is for, without its floor: two wants for one team are one. */
  function target(key) {
    var w = parse(key);
    return w ? w.kind + ':' + w.value : String(key);
  }

  /* Whether a want is for `card`, rarity aside: a team takes only its NFL
     teammates' cards. */
  function covers(want, card) {
    return want.kind === 'player' ? card.slug === want.value : Boolean(card.nfl) && card.teamKey === want.value;
  }

  /* Whether `card` is one `want` (parsed) is after. */
  function fits(want, card) {
    if (!want || !card || card.reward) { return false; }
    if (want.floor && EGE.cards.rankOf(card.rarity) < EGE.cards.rankOf(want.floor)) { return false; }
    return covers(want, card);
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

  /* Every card a want could be after: the six's, and their NFL teammates'
     once those are read. */
  function catalogue() {
    var nfl = EGE.nflCards && EGE.nflCards.loaded() ? EGE.nflCards.list() : [];
    return EGE.cards.all().concat(nfl);
  }

  /* ['2025:dj-moore', ...] for card_want_holders: the season and player of
     every card the list could be after. */
  function ask(keys) {
    var wants = list(keys);
    var seen = {};
    var out = [];
    if (!wants.length) { return out; }
    catalogue().forEach(function (card) {
      var key = card.season + ':' + card.slug;
      if (seen[key]) { return; }
      var hit = wants.some(function (w) { return covers(w, card); });
      if (hit) { seen[key] = true; out.push(key); }
    });
    return out;
  }

  /* --- the picker's lists ------------------------------------------------------ */

  /* An NFL team by the sim's key ('DET'): its colour and its mark, as the
     live game's pictures use them. */
  function nflTeam(sim) {
    var t = EGE.nfl && EGE.nfl.teams[sim];
    if (!t) { return null; }
    return { sim: sim, key: t.site, name: t.name, short: t.name.split(' ').pop(), color: t.color,
             logo: EGE.logoFor ? EGE.logoFor(t.name, 48) : null };
  }

  /* An NFL team by its key in EGE.teams ('detroit'). */
  function teamOf(key) {
    return EGE.nfl && EGE.nfl.keyForSite ? nflTeam(EGE.nfl.keyForSite(key)) : null;
  }

  /* The NFL teams there are teammate cards of, in the NFL cards' order;
     until those are read, the six's NFL teams. */
  function teams() {
    var out = [];
    var seen = {};
    function add(t) {
      if (!t || seen[t.key]) { return; }
      seen[t.key] = true;
      out.push(t);
    }
    if (EGE.nflCards && EGE.nflCards.loaded()) {
      EGE.nflCards.teams().forEach(function (t) { add(nflTeam(t.key)); });
      return out;
    }
    EGE.cards.all().forEach(function (card) {
      var t = EGE.teams[card.teamKey];
      if (t && t.tier === 'nfl') { add(teamOf(card.teamKey)); }
    });
    return out;
  }

  /* One of the six, or an NFL teammate, by slug: { slug, name, sub, photo,
     team, nfl }. `team` is the NFL team he is on now (nflTeam), for his
     picture; `photo` is null where there is no picture of him. */
  function playerOf(slug) {
    var six = EGE.playerBySlug(slug);
    if (six) {
      var site = EGE.teamKeyFor ? EGE.teamKeyFor(six, EGE.currentSeason) : null;
      var mine = site && EGE.nfl && EGE.nfl.keyForSite ? nflTeam(EGE.nfl.keyForSite(site)) : null;
      return { slug: slug, name: six.name, photo: six.headshot || null, team: mine, nfl: false,
               sub: [EGE.positionFor(six), mine ? mine.short : ''].filter(Boolean).join(' · ') };
    }
    var mate = EGE.nflCards && EGE.nflCards.loaded() ? EGE.nflCards.playerOf(slug) : null;
    if (!mate) { return null; }
    var team = nflTeam(mate.simTeam);
    return { slug: slug, name: mate.name, nfl: true, team: team,
             photo: mate.espn && EGE.espnHeadshot ? EGE.espnHeadshot(mate.espn, mate.collegePhoto, 192, 140) : null,
             sub: [mate.position, team ? team.short : mate.simTeam].filter(Boolean).join(' · ') };
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

  /* What a want reads as on the page: { kind, name, floor, team, photo }:
     a team's mark, or a player's picture on his team. */
  function label(key) {
    var w = parse(key);
    if (!w) { return null; }
    var floor = w.floor ? EGE.cards.rarity(w.floor).name + '+' : '';
    if (w.kind === 'team') {
      var t = teamOf(w.value);
      return { kind: 'team', name: t ? t.short : w.value, floor: floor, team: t, photo: null };
    }
    var p = playerOf(w.value);
    return { kind: 'player', name: p ? p.name : w.value.replace(/-/g, ' '), floor: floor,
             team: p ? p.team : null, photo: p ? p.photo : null };
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
