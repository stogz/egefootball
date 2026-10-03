/* ==========================================================================
   EGE Football — cards
   A collectible card game that lives beside the simulation rather than in
   it. Nothing here touches a rating, a stat line or a result: a card is a
   picture of something that already happened, and owning one changes
   nothing about anybody's season. A player who never opens a pack is not
   behind anybody at anything.

   Where the cards come from
   -------------------------
   The season files. Every game with a stat line is a PERFORMANCE card, and
   every one of its `bigPlays` is a PLAY card, so publishing a week puts that
   week's cards into the packs and nothing has to be drawn up by hand. A week
   that has not been published is not in any pack.

   A card's id says which game it is, so the database only ever stores ids:

     p:2021:sam-stogsdill:5        Sam's week 5 game in 2021
     h:2021:sam-stogsdill:5:0      the first of that game's big plays

   Correct a stat line and the card corrects with it. Reorder a game's
   `bigPlays` and the play cards swap places, so add new ones at the end.

   Grading
   -------
   The number in a card's top right is its fantasy score, half PPR, the same
   scoring a game is paid on (data/economy.js). A play is scored as the one
   play: a 44 yard receiving touchdown is 4.4 + 6 + 0.5 = 10.9.

   The rarity is graded from that score, but against the position, because
   positions do not score alike. A performance is graded on its fantasy
   points times the position's share -- the number that makes a breakout
   game pay 15 credits whatever the position -- so a tight end's big night
   is as rare as a quarterback's. A play is graded as though every play were
   scored on the ground (yards / 10, +6 a touchdown, +0.5 a catch), so a
   60 yard touchdown pass grades with a 60 yard touchdown catch; a play
   called go-ahead, game-tying or game-winning grades a little higher.

   Pulling
   -------
   Each card in a pack rolls its rarity on PULL_ODDS first, then is drawn
   from the cards of that rarity the pack can hold. The odds are what make
   a rarity hard to pull; how many cards of it exist only decides how many
   different ones there are to find.

   Prices and pack sizes are repeated in supabase/schema.sql
   (open_card_pack), which charges for them. Change both together.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.cards = (function () {
  'use strict';

  /* --- rarities ---------------------------------------------------------- */

  /* Hardest to pull last. `odds` is the chance of each card in a pack
     coming up this rarity, in percent. `performance` and `play` are the
     lowest graded score that reaches it. */
  var RARITIES = [
    { key: 'common',    name: 'Common',    color: '#8b9097', odds: 46,  performance: 0,   play: 0 },
    { key: 'uncommon',  name: 'Uncommon',  color: '#3e9a4b', odds: 26,  performance: 6.5, play: 7.1 },
    { key: 'rare',      name: 'Rare',      color: '#e8812a', odds: 14,  performance: 11,  play: 8.6 },
    { key: 'epic',      name: 'Epic',      color: '#d5392b', odds: 8,   performance: 16,  play: 9.6 },
    { key: 'legendary', name: 'Legendary', color: '#8a4fd8', odds: 4,   performance: 20,  play: 11.1 },
    { key: 'mystic',    name: 'Mystic',    color: '#e0ad25', odds: 1.6, performance: 24,  play: 12.1 },
    { key: 'iconic',    name: 'Iconic',    color: '#ec5fa8', odds: 0.4, performance: 28,  play: 13 }
  ];

  var RANK = {};
  RARITIES.forEach(function (r, i) { RANK[r.key] = i; });

  function rarity(key) { return RARITIES[RANK[key]] || RARITIES[0]; }
  function rankOf(key) { return RANK[key] === undefined ? 0 : RANK[key]; }

  /* --- packs ------------------------------------------------------------- */

  /* `size` cards each. `seasonOnly` keeps a pack to the live season, which
     is what fills up a week at a time. `floor` on the pack is the rarity its
     last card is guaranteed to reach. Prices and sizes are charged by
     open_card_pack in supabase/schema.sql. */
  var PACKS = [
    {
      key: 'base',
      name: 'Base Pack',
      credits: 5,
      size: 3,
      blurb: 'Three cards from any season, any player.'
    },
    {
      key: 'season',
      name: 'Season Pack',
      credits: 6,
      size: 3,
      seasonOnly: true,
      floor: 'uncommon',
      blurb: 'Three cards from the live season only, the last one Uncommon or ' +
             'better. Every week that goes out adds its games to it.'
    },
    {
      key: 'pro',
      name: 'Pro Pack',
      credits: 10,
      size: 5,
      floor: 'rare',
      blurb: 'Five cards from any season, the last one Rare or better.'
    }
  ];

  function pack(key) {
    return PACKS.filter(function (p) { return p.key === key; })[0] || null;
  }

  /* --- scoring a play ---------------------------------------------------- */

  var F = EGE.economy.FANTASY;

  function round2(n) { return Math.round(n * 100) / 100; }

  /* What kind of play a line in `bigPlays` is. The file says it in words --
     '44 yard receiving touchdown', '65 yard BEAST-mode', '55 yard-dot
     (P. Hatch)' -- so this reads the words, and falls back on what the
     player does when the words do not say. A quarterback's dot is a
     completion; a receiver's is a catch. */
  function readPlay(text, position) {
    var t = String(text).toLowerCase();
    var yards = Number((t.match(/(\d+)/) || [0, 0])[1]) || 0;
    var touchdown = /touchdown/.test(t);
    var kind;

    if (/pick-six|interception/.test(t)) { kind = 'interception'; }
    else if (/passing|dot/.test(t) && position === 'QB') { kind = 'pass'; }
    else if (/rushing|\brun\b|beast/.test(t)) { kind = 'rush'; }
    else if (/receiving|reception|catch|dot/.test(t)) { kind = 'catch'; }
    else { kind = position === 'QB' ? 'pass' : position === 'RB' ? 'rush' : 'catch'; }

    var points;
    if (kind === 'interception') { points = F.interceptions; }
    else if (kind === 'pass') { points = yards * F.passingYards + (touchdown ? F.passingTd : 0); }
    else if (kind === 'rush') { points = yards * F.rushingYards + (touchdown ? F.rushingTd : 0); }
    else { points = yards * F.receivingYards + F.receptions + (touchdown ? F.receivingTd : 0); }

    /* Every play on one scale for the rarity: what it would have been worth
       carried or caught. A long pass is as rare a thing as a long catch. */
    var grade = kind === 'interception' ? 0
      : yards * F.rushingYards + (touchdown ? F.rushingTd : 0) +
        (kind === 'catch' ? F.receptions : 0);
    if (/game-winning|walk-off/.test(t)) { grade += 3; }
    else if (/go-ahead|game-tying/.test(t)) { grade += 1.5; }

    return { kind: kind, yards: yards, touchdown: touchdown,
             points: round2(points), grade: round2(grade) };
  }

  /* How a play reads on its card: '44 YD RECEIVING TD'. The file's own words
     go underneath, because '65 yard BEAST-mode' is worth keeping. */
  var KIND_WORD = { pass: 'Passing', rush: 'Rushing', 'catch': 'Receiving', interception: 'Pick-Six' };

  function playHeadline(play) {
    if (play.kind === 'interception') { return 'Pick-Six'; }
    return play.yards + ' YD ' + KIND_WORD[play.kind] + (play.touchdown ? ' TD' : '');
  }

  /* --- scoring a game ---------------------------------------------------- */

  function gradeFor(score, kind) {
    var found = RARITIES[0];
    RARITIES.forEach(function (r) { if (score >= r[kind]) { found = r; } });
    return found.key;
  }

  /* The short line a performance card prints. */
  function statSummary(position, s) {
    var parts = [];
    function n(key) { return typeof s[key] === 'number' ? s[key] : 0; }

    if (position === 'QB') {
      parts.push(n('completions') + '/' + n('attempts'));
      parts.push(n('passingYards') + ' YDS');
      parts.push(n('passingTd') + ' TD');
      if (n('interceptions')) { parts.push(n('interceptions') + ' INT'); }
      if (n('rushingYards') >= 20 || n('rushingTd')) {
        parts.push(n('rushingYards') + ' RUSH' + (n('rushingTd') ? ' ' + n('rushingTd') + ' TD' : ''));
      }
      return parts.join(' · ');
    }

    var rushing = n('carries') > 0;
    var catching = n('receptions') > 0;
    if (position === 'RB' || (rushing && !catching)) {
      parts.push(n('carries') + ' CAR');
      parts.push(n('rushingYards') + ' YDS');
      if (n('rushingTd')) { parts.push(n('rushingTd') + ' TD'); }
      if (catching) { parts.push(n('receptions') + ' REC ' + n('receivingYards') + ' YDS'); }
      if (n('receivingTd')) { parts.push(n('receivingTd') + ' REC TD'); }
      return parts.join(' · ');
    }

    parts.push(n('receptions') + ' REC');
    parts.push(n('receivingYards') + ' YDS');
    if (n('receivingTd')) { parts.push(n('receivingTd') + ' TD'); }
    if (n('rushingYards')) { parts.push(n('rushingYards') + ' RUSH'); }
    if (n('rushingTd')) { parts.push(n('rushingTd') + ' RUSH TD'); }
    return parts.join(' · ');
  }

  function versus(game) {
    return (game.home || game.neutral ? 'vs ' : 'at ') + game.opponent;
  }

  /* --- the catalogue ----------------------------------------------------- */

  /* Every card the season files hold, published or not, keyed by id. A card
     somebody owns is always found here even if its week is pulled back; the
     packs are what keep to published weeks. Built once per load: the season
     files do not change under a page. */
  var catalogue = null;
  var list = [];

  function base(player, game, season) {
    var team = EGE.teamFor(player, season);
    return {
      season: season,
      week: game.week,
      slug: player.slug,
      player: player,
      position: EGE.positionFor(player, season),
      team: team,
      teamKey: EGE.teamKeyFor(player, season),
      opponent: game.opponent,
      versus: versus(game),
      event: game.name || null,
      playoff: Boolean(game.playoff),
      game: game
    };
  }

  function build() {
    catalogue = {};
    list = [];

    EGE.seasonsPlayed().forEach(function (season) {
      EGE.players.forEach(function (player) {
        EGE.gamesFor(player, season).forEach(function (game) {
          if (game.bye || game.injured || !EGE.hasResult(game) || !playedIn(game.stats)) { return; }

          var perf = base(player, game, season);
          var points = EGE.economy.fantasyPoints(game.stats);
          perf.id = 'p:' + season + ':' + player.slug + ':' + game.week;
          perf.kind = 'performance';
          perf.points = points;
          perf.grade = round2(points * EGE.economy.fantasyShareFor(player.position));
          perf.rarity = gradeFor(perf.grade, 'performance');
          perf.headline = perf.versus;
          perf.line = statSummary(player.position, game.stats);
          catalogue[perf.id] = perf;
          list.push(perf);

          (game.bigPlays || []).forEach(function (text, at) {
            var read = readPlay(text, player.position);
            var play = base(player, game, season);
            play.id = 'h:' + season + ':' + player.slug + ':' + game.week + ':' + at;
            play.kind = 'play';
            play.play = read;
            play.text = text;
            play.points = read.points;
            play.grade = read.grade;
            play.rarity = gradeFor(read.grade, 'play');
            play.headline = playHeadline(read);
            play.line = text;
            catalogue[play.id] = play;
            list.push(play);
          });
        });
      });
    });
  }

  /* A stat line of nothing but zeros is a game he was on the roster for and
     never got into -- Isaac's redshirt year is full of them. No card. */
  function playedIn(stats) {
    return Boolean(stats) && Object.keys(stats).some(function (key) {
      return typeof stats[key] === 'number' && stats[key] !== 0;
    });
  }

  function ensure() { if (!catalogue) { build(); } }

  function byId(id) { ensure(); return catalogue[id] || null; }

  function all() { ensure(); return list; }

  /* What a pack can hand out right now: published weeks only. */
  function pullable(packKey) {
    var p = pack(packKey);
    return all().filter(function (card) {
      if (!EGE.isPublished(card.season, card.week)) { return false; }
      if (p && p.seasonOnly && card.season !== EGE.currentSeason) { return false; }
      return true;
    });
  }

  /* Best first: rarity, then score, then newest. */
  function compare(a, b) {
    return rankOf(b.rarity) - rankOf(a.rarity) ||
      b.points - a.points ||
      b.season - a.season || b.week - a.week ||
      (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  }

  /* --- rolling ----------------------------------------------------------- */

  /* A rarity, on the odds, at or above `floor`. */
  function rollRarity(rng, floor) {
    var from = rankOf(floor || 'common');
    var tiers = RARITIES.slice(from);
    var total = tiers.reduce(function (sum, r) { return sum + r.odds; }, 0);
    var at = rng() * total;
    for (var i = 0; i < tiers.length; i += 1) {
      at -= tiers[i].odds;
      if (at < 0) { return tiers[i].key; }
    }
    return tiers[tiers.length - 1].key;
  }

  /* One card from `pool` of the rolled rarity. A rarity the pool has none of
     yet -- early in a season there may be no Iconic anything -- falls to the
     nearest one below it that has something, and only climbs if there is
     nothing below either. Never below `floor` while anything above it
     exists. */
  function drawOne(pool, rng, floor) {
    if (!pool.length) { return null; }
    var wanted = rankOf(rollRarity(rng, floor));
    var low = rankOf(floor || 'common');

    function at(rank) {
      return pool.filter(function (card) { return rankOf(card.rarity) === rank; });
    }

    var order = [];
    for (var r = wanted; r >= low; r -= 1) { order.push(r); }
    for (r = wanted + 1; r < RARITIES.length; r += 1) { order.push(r); }
    for (r = low - 1; r >= 0; r -= 1) { order.push(r); }

    for (var i = 0; i < order.length; i += 1) {
      var tier = at(order[i]);
      if (tier.length) { return tier[Math.floor(rng() * tier.length)]; }
    }
    return null;
  }

  /* What a pack has in it. Decided before it is paid for, so what is charged
     for and what is shown are the same cards. */
  function rollPack(packKey, rng) {
    var p = pack(packKey);
    if (!p) { return []; }
    var random = rng || Math.random;
    var pool = pullable(packKey);
    var out = [];
    for (var i = 0; i < p.size; i += 1) {
      var last = i === p.size - 1;
      var card = drawOne(pool, random, last ? p.floor : null);
      if (card) { out.push(card); }
    }
    return out;
  }

  /* --- the library ------------------------------------------------------- */

  /* Groups of cards to put together. A set is a list of slots, each wanting
     one card, and no card fills two slots of the same set -- so "five Sam
     cards" means five different ones. Owning a duplicate never counts
     twice. Nothing is used up: a card that completes one set still counts
     for every other.

     The reward is one more card (rolled at or above `reward.floor`, from
     `reward.from` when the set names a pool), a few credits, and on the
     harder sets a 1.5x booster. The booster still goes on games under the
     same five-a-season rule as any other, so a full library is never more
     stickers on a season than anybody else can have.

     Credits and the booster are held to 20 and to the 1.5x by
     claim_card_set in supabase/schema.sql. */
  var BOOSTER = 'boost-1-5';

  function slot(label, test) { return { label: label, test: test }; }

  function times(count, label, test) {
    var out = [];
    for (var i = 0; i < count; i += 1) { out.push(slot(label, test)); }
    return out;
  }

  function ofPlayer(slug) { return function (card) { return card.slug === slug; }; }

  function seasonsWithCards() {
    var seen = {};
    all().forEach(function (card) { seen[card.season] = true; });
    return Object.keys(seen).map(Number).sort(function (a, b) { return a - b; });
  }

  function playersIn(season) {
    return EGE.players.filter(function (player) {
      return all().some(function (card) { return card.season === season && card.slug === player.slug; });
    });
  }

  var setsCache = null;

  function sets() {
    if (setsCache) { return setsCache; }
    var out = [];

    out.push({
      key: 'starting-six',
      name: 'The Starting Six',
      blurb: 'A card of each of the six, from any season.',
      slots: EGE.players.map(function (player) {
        return slot(player.name, ofPlayer(player.slug));
      }),
      reward: { floor: 'rare', credits: 3 }
    });

    EGE.players.forEach(function (player) {
      out.push({
        key: 'player-' + player.slug,
        name: player.name,
        blurb: 'Eight different ' + player.first + ' cards.',
        group: 'Players',
        slots: times(8, player.first + ' card', ofPlayer(player.slug)),
        reward: { floor: 'rare', credits: 3, from: ofPlayer(player.slug), fromText: player.first }
      });
    });

    out.push({
      key: 'bloomington-connection',
      name: 'Bloomington Connection',
      blurb: 'Four Isaac and four Paxon cards from their Bloomington years, 2018 and 2019.',
      slots: times(4, 'Isaac, 2018\u201319', function (c) { return c.slug === 'isaac-vitel' && c.season <= 2019; })
        .concat(times(4, 'Paxon, 2018\u201319', function (c) { return c.slug === 'paxon-hatch' && c.season <= 2019; })),
      reward: { floor: 'rare', credits: 3 }
    });

    out.push({
      key: 'buckeye-backfield',
      name: 'Buckeye Backfield',
      blurb: 'Four Sam and four Jaykeb cards from Ohio State, 2020 on.',
      slots: times(4, 'Sam, Ohio State', function (c) { return c.slug === 'sam-stogsdill' && c.season >= 2020; })
        .concat(times(4, 'Jaykeb, Ohio State', function (c) { return c.slug === 'jaykeb-stewart' && c.season >= 2020; })),
      reward: { floor: 'rare', credits: 3 }
    });

    out.push({
      key: 'highlight-reel',
      name: 'Highlight Reel',
      blurb: 'Fifteen different play cards.',
      slots: times(15, 'Play card', function (c) { return c.kind === 'play'; }),
      reward: { floor: 'epic', credits: 5,
                from: function (c) { return c.kind === 'play'; }, fromText: 'a play' }
    });

    out.push({
      key: 'full-spectrum',
      name: 'Full Spectrum',
      blurb: 'One card of every rarity, Common to Iconic.',
      slots: RARITIES.map(function (r) {
        return slot(r.name, function (c) { return c.rarity === r.key; });
      }),
      reward: { floor: 'legendary', credits: 10, booster: BOOSTER }
    });

    seasonsWithCards().forEach(function (season) {
      out.push({
        key: 'season-' + season,
        name: season + ' Season',
        blurb: 'A performance card of every one of the six who played in ' + season + '.',
        group: 'Seasons',
        slots: playersIn(season).map(function (player) {
          return slot(player.first + ', ' + season, function (c) {
            return c.kind === 'performance' && c.season === season && c.slug === player.slug;
          });
        }),
        reward: { floor: 'epic', credits: 5, booster: BOOSTER,
                  from: function (c) { return c.season === season; }, fromText: String(season) }
      });
    });

    out.push({
      key: 'hall-of-fame',
      name: 'Hall of Fame',
      blurb: 'Three different Legendary-or-better cards.',
      slots: times(3, 'Legendary+', function (c) { return rankOf(c.rarity) >= rankOf('legendary'); }),
      reward: { floor: 'mystic', credits: 10, booster: BOOSTER }
    });

    setsCache = out;
    return out;
  }

  /* Which owned card fills which slot. Slots in a set either want the same
     thing or things that cannot overlap, so taking the first card that fits
     each one in turn is as good as any cleverer matching. Best cards are
     offered first, so the set shows off what it is made of. */
  function fill(set, ownedIds) {
    var owned = ownedIds.map(byId).filter(Boolean).sort(compare);
    var used = {};
    var filled = set.slots.map(function (s) {
      var card = owned.filter(function (c) { return !used[c.id] && s.test(c); })[0] || null;
      if (card) { used[card.id] = true; }
      return { slot: s, card: card };
    });
    var have = filled.filter(function (f) { return f.card; }).length;
    return { slots: filled, have: have, need: set.slots.length,
             complete: set.slots.length > 0 && have === set.slots.length };
  }

  /* The card a set pays out with. From every published card, or the set's
     own pool when it names one, at or above its floor. */
  function rollReward(set, rng) {
    var pool = pullable(null);
    if (set.reward.from) {
      var narrowed = pool.filter(set.reward.from);
      if (narrowed.length) { pool = narrowed; }
    }
    return drawOne(pool, rng || Math.random, set.reward.floor);
  }

  /* --- odds, said out loud ------------------------------------------------ */

  /* How many of each rarity exist right now, for the odds table. */
  function counts(cards) {
    var out = {};
    RARITIES.forEach(function (r) { out[r.key] = 0; });
    (cards || all()).forEach(function (c) { out[c.rarity] += 1; });
    return out;
  }

  return {
    RARITIES: RARITIES,
    PACKS: PACKS,
    BOOSTER: BOOSTER,
    rarity: rarity,
    rankOf: rankOf,
    pack: pack,
    readPlay: readPlay,
    statSummary: statSummary,
    all: all,
    byId: byId,
    pullable: pullable,
    compare: compare,
    rollRarity: rollRarity,
    rollPack: rollPack,
    sets: sets,
    fill: fill,
    rollReward: rollReward,
    counts: counts,
    rebuild: function () { catalogue = null; setsCache = null; }
  };
})();
