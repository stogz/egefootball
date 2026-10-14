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

   Grading stops at Mystic. Iconic is only ever a handful of moments picked
   by hand (ICONIC below), whatever anything else scored.

   Pulling
   -------
   Each card in a pack rolls its rarity on PULL_ODDS first, then is drawn
   from the cards of that rarity the pack can hold. The odds are what make
   a rarity hard to pull; how many cards of it exist only decides how many
   different ones there are to find.

   Packs are bought with diamonds, the card game's own money (see
   data/economy.js), never with credits. Prices and pack sizes are repeated
   in supabase/schema.sql (open_card_pack), which charges for them. Change
   both together.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.cards = (function () {
  'use strict';

  /* --- rarities ---------------------------------------------------------- */

  /* Hardest to pull last. `odds` is the chance of each card in a pack
     coming up this rarity, in percent. `performance` and `play` are the
     lowest graded score that reaches it.

     Iconic is not graded at all: it is the few cards in ICONIC below,
     picked by hand, and nothing else reaches it however big the game. */
  var RARITIES = [
    { key: 'common',    name: 'Common',    color: '#8b9097', odds: 47.05, performance: 0,   play: 0 },
    { key: 'uncommon',  name: 'Uncommon',  color: '#3e9a4b', odds: 26,  performance: 6.5, play: 7.1 },
    { key: 'rare',      name: 'Rare',      color: '#e8812a', odds: 14,  performance: 11,  play: 8.6 },
    { key: 'epic',      name: 'Epic',      color: '#d5392b', odds: 8,   performance: 16,  play: 9.6 },
    { key: 'legendary', name: 'Legendary', color: '#8a4fd8', odds: 4,   performance: 20.5, play: 11.2 },
    { key: 'mystic',    name: 'Mystic',    color: '#e0ad25', odds: 0.75, performance: 28.5, play: 13.3 },
    { key: 'iconic',    name: 'Iconic',    color: '#ec5fa8', odds: 0.2, performance: null, play: null }
  ];

  /* The Iconic cards. A moment has to be one of these to be Iconic; every
     other card tops out at Mystic. Add an id here to make another. */
  var ICONIC = [
    'p:2019:sam-stogsdill:9',     /* Sam's five touchdowns against Centennial */
    'p:2020:paxon-hatch:19',      /* Paxon's two touchdowns in the FCS Championship */
    'h:2019:cooper-clark:15:0',    /* Cooper's 80 yard touchdown against Helix */
    'p:2022:jaykeb-stewart:3'     /* Jaykeb Stewart 7TD Masterclass */
  ];

  var RANK = {};
  RARITIES.forEach(function (r, i) { RANK[r.key] = i; });

  function rarity(key) { return RARITIES[RANK[key]] || RARITIES[0]; }
  function rankOf(key) { return RANK[key] === undefined ? 0 : RANK[key]; }

  /* --- packs ------------------------------------------------------------- */

  /* `size` cards each, for `diamonds`. `seasonOnly` keeps a pack to the live
     season, which is what fills up a week at a time. `floor` on the pack is
     the rarity its last card is guaranteed to reach. Prices and sizes are
     charged by open_card_pack in supabase/schema.sql.

     Twice what they were in credits, because a credit buys two diamonds: a
     Base Pack is still five credits for anybody who would rather swap than
     wait for a game to pay. */
  var PACKS = [
    {
      key: 'base',
      name: 'Base Pack',
      diamonds: 10,
      size: 3,
      blurb: 'Three cards from any season, any player.'
    },
    {
      key: 'season',
      name: 'Season Pack',
      diamonds: 12,
      size: 3,
      seasonOnly: true,
      floor: 'uncommon',
      blurb: 'Three cards from the live season only, the last one Uncommon or ' +
             'better. Every week that goes out adds its games to it.'
    },
    {
      key: 'pro',
      name: 'Pro Pack',
      diamonds: 20,
      size: 5,
      floor: 'rare',
      boost: 1.5,
      blurb: 'Five cards from any season, the last one Rare or better, and ' +
             '1.5x the odds of a Legendary, Mystic or Iconic.'
    }
  ];

  /* A Season Pack for every season before the live one: three cards from
     that year only, the last one Uncommon or better. The shop shows them on
     the Season Pack's tile, behind its previous-year arrow, not as packs of
     their own. open_card_pack charges 14 for any year-{season} pack and
     checks every card in it is from that season. */
  var YEAR_PACK_PRICE = 14;
  (EGE.seasonsPlayed ? EGE.seasonsPlayed() : []).filter(function (year) {
    return year < EGE.currentSeason;
  }).forEach(function (year) {
    PACKS.push({
      key: 'year-' + year,
      name: year + ' Season Pack',
      diamonds: YEAR_PACK_PRICE,
      size: 3,
      season: year,
      floor: 'uncommon',
      blurb: 'Three cards from the ' + year + ' season only, the last one ' +
             'Uncommon or better.'
    });
  });

  function pack(key) {
    return PACKS.filter(function (p) { return p.key === key; })[0] || null;
  }

  /* The player on the front of a season's packs and the colours they are
     printed in (Sam's pictures, 2026-10-14): the live Season Pack while it
     is that season, and that year's pack behind the arrows after. `theme`
     is a pack colourway in site.css (.ege-pack--{theme}); `image` a cut-out
     on a clear background in icon/packs/, and `logo` the team's, large
     behind him. A season not here gets a plain pack in the Season Pack's
     own colours. */
  var PACK_COVERS = {
    2021: { player: 'jaykeb-stewart', image: 'icon/packs/2021-jaykeb-stewart.webp',
            logo: 'icon/packs/2021-osu-logo.webp', theme: 'osu' },
    2022: { player: 'paxon-hatch', image: 'icon/packs/2022-paxon-hatch.webp',
            logo: 'icon/packs/2022-unc-logo.webp', theme: 'unc' }
  };

  /* The cover for a pack, or null. */
  function packCover(p) {
    var year = p && (p.season || (p.seasonOnly ? EGE.currentSeason : null));
    return (year && PACK_COVERS[year]) || null;
  }

  /* --- quick selling ------------------------------------------------------ */

  /* What one copy of a card sells back for, in diamonds, by its rarity. An
     Iconic is not on the list: it cannot be quick sold at all. Paid by
     quick_sell_card in supabase/schema.sql, which holds the same numbers.
     Change both together. */
  var QUICK_SELL = { common: 1, uncommon: 1, rare: 2, epic: 2, legendary: 3, mystic: 30 };

  /* Null for a card that cannot be sold. */
  function sellPrice(card) {
    return card && QUICK_SELL[card.rarity] ? QUICK_SELL[card.rarity] : null;
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
    RARITIES.forEach(function (r) {
      if (typeof r[kind] === 'number' && score >= r[kind]) { found = r; }
    });
    return found.key;
  }

  function rarityOf(id, score, kind) {
    return ICONIC.indexOf(id) !== -1 ? 'iconic' : gradeFor(score, kind);
  }

  /* The two numbers a performance card prints big across its picture: the
     yards its stat line leads with -- passing for a quarterback, rushing for
     a back who carried it, receiving for everyone else -- and every
     touchdown. */
  function bigStats(position, s) {
    function n(key) { return typeof s[key] === 'number' ? s[key] : 0; }
    var td = n('passingTd') + n('rushingTd') + n('receivingTd');
    if (position === 'QB') { return { yards: n('passingYards'), td: td }; }
    if (position === 'RB' && n('carries') > 0) { return { yards: n('rushingYards'), td: td }; }
    return { yards: n('receivingYards'), td: td };
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
      return parts.join(' \u00b7 ');
    }

    var rushing = n('carries') > 0;
    var catching = n('receptions') > 0;
    if (position === 'RB' || (rushing && !catching)) {
      parts.push(n('carries') + ' CAR');
      parts.push(n('rushingYards') + ' YDS');
      if (n('rushingTd')) { parts.push(n('rushingTd') + ' TD'); }
      if (catching) { parts.push(n('receptions') + ' REC ' + n('receivingYards') + ' YDS'); }
      if (n('receivingTd')) { parts.push(n('receivingTd') + ' REC TD'); }
      return parts.join(' \u00b7 ');
    }

    parts.push(n('receptions') + ' REC');
    parts.push(n('receivingYards') + ' YDS');
    if (n('receivingTd')) { parts.push(n('receivingTd') + ' TD'); }
    if (n('rushingYards')) { parts.push(n('rushingYards') + ' RUSH'); }
    if (n('rushingTd')) { parts.push(n('rushingTd') + ' RUSH TD'); }
    return parts.join(' \u00b7 ');
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
          perf.rarity = rarityOf(perf.id, perf.grade, 'performance');
          perf.big = bigStats(player.position, game.stats);
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
            play.rarity = rarityOf(play.id, read.grade, 'play');
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
      if (p && p.season && card.season !== p.season) { return false; }
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

  /* A pack with a `boost` multiplies the odds of Legendary and up by it,
     and Common gives up the difference: a Pro Pack's 1.5 makes Iconic
     0.3% a card rather than 0.2%. */
  var BOOSTED_FROM = 'legendary';

  function oddsWith(boost) {
    var odds = RARITIES.map(function (r) {
      return boost && rankOf(r.key) >= rankOf(BOOSTED_FROM) ? r.odds * boost : r.odds;
    });
    if (boost) {
      odds[0] = 100 - odds.slice(1).reduce(function (sum, n) { return sum + n; }, 0);
    }
    return odds;
  }

  /* A rarity, on the odds, at or above `floor` and no higher than
     `ceiling`, with a pack's `boost` if it has one. */
  function rollRarity(rng, floor, ceiling, boost) {
    var from = rankOf(floor || 'common');
    var to = ceiling ? Math.max(rankOf(ceiling), from) : RARITIES.length - 1;
    var odds = oddsWith(boost);
    var total = 0;
    for (var r = from; r <= to; r += 1) { total += odds[r]; }
    var at = rng() * total;
    for (r = from; r <= to; r += 1) {
      at -= odds[r];
      if (at < 0) { return RARITIES[r].key; }
    }
    return RARITIES[to].key;
  }

  /* One card from `pool` of the rolled rarity. A rarity the pool has none of
     yet -- early in a season there may be no Iconic anything -- falls to the
     nearest one below it that has something, and only climbs if there is
     nothing below either. Never below `floor` while anything above it
     exists, and never above `ceiling` while anything at or under it does. */
  function drawOne(pool, rng, floor, ceiling, boost) {
    if (!pool.length) { return null; }
    var wanted = rankOf(rollRarity(rng, floor, ceiling, boost));
    var low = rankOf(floor || 'common');
    var high = ceiling ? Math.max(rankOf(ceiling), low) : RARITIES.length - 1;

    function at(rank) {
      return pool.filter(function (card) { return rankOf(card.rarity) === rank; });
    }

    var order = [];
    for (var r = wanted; r >= low; r -= 1) { order.push(r); }
    for (r = wanted + 1; r <= high; r += 1) { order.push(r); }
    for (r = low - 1; r >= 0; r -= 1) { order.push(r); }
    for (r = high + 1; r < RARITIES.length; r += 1) { order.push(r); }

    for (var i = 0; i < order.length; i += 1) {
      var tier = at(order[i]);
      if (tier.length) { return tier[Math.floor(rng() * tier.length)]; }
    }
    return null;
  }

  /* At most one card in a pack is above Legendary: once a Mystic or an
     Iconic is in it, every card after it rolls Legendary or lower. */
  var PACK_CAP = 'legendary';

  /* Worst first, so a pack reads left to right from its worst card to its
     best. */
  function packOrder(cards) {
    return cards.slice().sort(function (a, b) { return compare(b, a); });
  }

  /* What a pack has in it. Decided before it is paid for, so what is charged
     for and what is shown are the same cards, worst to best. */
  function rollPack(packKey, rng) {
    var p = pack(packKey);
    if (!p) { return []; }
    var random = rng || Math.random;
    var pool = pullable(packKey);
    var out = [];
    var big = false;
    for (var i = 0; i < p.size; i += 1) {
      var last = i === p.size - 1;
      var card = drawOne(pool, random, last ? p.floor : null, big ? PACK_CAP : null, p.boost);
      if (card) {
        out.push(card);
        if (rankOf(card.rarity) > rankOf(PACK_CAP)) { big = true; }
      }
    }
    return packOrder(out);
  }

  /* --- the library ------------------------------------------------------- */

  /* Groups of cards to put together. A set is a list of slots, each wanting
     one card, and no card fills two slots of the same set -- so "five Sam
     cards" means five different ones. Owning a duplicate never counts
     twice. Nothing is used up: a card that completes one set still counts
     for every other.

     The reward is one more card (rolled at or above `reward.floor`, from
     `reward.from` when the set names a pool), a few diamonds, and on the
     harder sets a 1.5x booster. The booster still goes on games under the
     same five-a-season rule as any other, so a full library is never more
     stickers on a season than anybody else can have.

     Diamonds rather than credits, because packs are bought with diamonds
     and a set paying credits would turn them back into credits. They are
     twice what the credits were, the same as the packs. Diamonds and the
     booster are held to 40 and to the 1.5x by claim_card_set in
     supabase/schema.sql. */
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
      name: 'The EGE',
      blurb: 'A card of each of the six, from any season.',
      slots: EGE.players.map(function (player) {
        return slot(player.name, ofPlayer(player.slug));
      }),
      reward: { floor: 'rare', diamonds: 6 }
    });

    EGE.players.forEach(function (player) {
      out.push({
        key: 'player-' + player.slug,
        name: player.name,
        blurb: 'Eight different ' + player.first + ' cards.',
        group: 'Players',
        slots: times(8, player.first + ' card', ofPlayer(player.slug)),
        reward: { floor: 'rare', diamonds: 6, from: ofPlayer(player.slug), fromText: player.first }
      });
    });

    out.push({
      key: 'bloomington-connection',
      name: 'Bloomington Connection',
      blurb: 'Four Isaac and four Paxon cards from their Bloomington years, 2018 and 2019.',
      slots: times(4, 'Isaac, 2018\u201319', function (c) { return c.slug === 'isaac-vitel' && c.season <= 2019; })
        .concat(times(4, 'Paxon, 2018\u201319', function (c) { return c.slug === 'paxon-hatch' && c.season <= 2019; })),
      reward: { floor: 'rare', diamonds: 6 }
    });

    out.push({
      key: 'buckeye-backfield',
      name: 'Buckeye Backfield',
      blurb: 'Four Sam and four Jaykeb cards from Ohio State, 2020 on.',
      slots: times(4, 'Sam, Ohio State', function (c) { return c.slug === 'sam-stogsdill' && c.season >= 2020; })
        .concat(times(4, 'Jaykeb, Ohio State', function (c) { return c.slug === 'jaykeb-stewart' && c.season >= 2020; })),
      reward: { floor: 'rare', diamonds: 6 }
    });

    out.push({
      key: 'highlight-reel',
      name: 'Highlight Reel',
      blurb: 'Fifteen different play cards.',
      slots: times(15, 'Play card', function (c) { return c.kind === 'play'; }),
      reward: { floor: 'epic', diamonds: 10,
                from: function (c) { return c.kind === 'play'; }, fromText: 'a play' }
    });

    out.push({
      key: 'full-spectrum',
      name: 'Collector',
      blurb: 'One card of every rarity, Common to Iconic.',
      slots: RARITIES.map(function (r) {
        return slot(r.name, function (c) { return c.rarity === r.key; });
      }),
      reward: { floor: 'legendary', diamonds: 20, booster: BOOSTER }
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
        reward: { floor: 'epic', diamonds: 10, booster: BOOSTER,
                  from: function (c) { return c.season === season; }, fromText: String(season) }
      });
    });

    out.push({
      key: 'hall-of-fame',
      name: 'Hall of Fame',
      blurb: 'Three different Legendary-or-better cards.',
      slots: times(3, 'Legendary+', function (c) { return rankOf(c.rarity) >= rankOf('legendary'); }),
      reward: { floor: 'mystic', diamonds: 20, booster: BOOSTER }
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

  /* --- player cards -------------------------------------------------------

     Every account has a Player Card for each of the six, for their whole
     career. It is not a card in the binder: it is how much of that player
     the account has collected, and it climbs the same ladder the cards do,
     Common to Iconic.

     What counts is the fantasy points printed on every copy of every one of
     his cards you hold -- a duplicate counts again, which is what a second
     copy is good for now. A card that leaves the collection (sold, traded,
     up for sale on the market) takes its points with it.

     The ladder is written for a receiver and scaled by position, because a
     card does not score alike everywhere: a quarterback's average card is
     about 9.6 points (passing plays score 1 a 25 yards and 4 a touchdown),
     a back's or a receiver's about 13.4 and a tight end's about 11.9, so a
     quarterback's rungs are three quarters of a receiver's and a tight
     end's nine tenths. Sam's own example sets the first rung: 150 points of
     Paxon makes him Uncommon.

     Every game the player plays after that pays the account a bonus on top
     of anything else: the game's diamonds before any booster (the same
     fantasy points times the same position share a game is paid on) times
     the rank's `bonus`, rounded up. Common pays nothing yet. Each game pays
     once, at the rank held when it is first paid, and the games already
     out when an account first has Player Cards are skipped, so ranking up
     later never back-pays a season. pay_player_card_bonuses in
     supabase/schema.sql pays it and holds a game's bonus to 400.

     How hard and how much, for a receiver (the PR that added this has the
     working):

       rank       points   bonus   a 13-credit game   a 14-game season
       Common     1 card    0          0                 0
       Uncommon     150    10%         2                28
       Rare         400    25%         4                56
       Epic         800    50%         7                98
       Legendary   1400    80%        11               154
       Mystic      2200   125%        17               238
       Iconic      3500   300%        39               546

     An account earns about 200 diamonds a season from its own games, and
     random packs bring in about half a point of any one player per diamond
     spent. */
  var PLAYER_RANKS = [
    { key: 'common',    points: 0,    bonus: 0 },
    { key: 'uncommon',  points: 150,  bonus: 0.10 },
    { key: 'rare',      points: 400,  bonus: 0.25 },
    { key: 'epic',      points: 800,  bonus: 0.50 },
    { key: 'legendary', points: 1400, bonus: 0.80 },
    { key: 'mystic',    points: 2200, bonus: 1.25 },
    { key: 'iconic',    points: 3500, bonus: 3.00 }
  ];

  /* How far a position's rungs are from a receiver's. */
  var RANK_SCALE = { QB: 0.75, RB: 1, WR: 1, TE: 0.9 };

  function rankScale(player) {
    var s = RANK_SCALE[player && player.position];
    return typeof s === 'number' ? s : 1;
  }

  /* The ladder for one player, in his own points. */
  function ladderFor(player) {
    var scale = rankScale(player);
    return PLAYER_RANKS.map(function (r) {
      return { key: r.key, name: rarity(r.key).name, color: rarity(r.key).color,
               points: Math.round(r.points * scale), bonus: r.bonus };
    });
  }

  /* Where `owned` ({ card id: quantity }) puts the account on one player's
     ladder. Null rank while there is not a card of him yet. A play that
     lost points (a pick-six) counts as nothing rather than taking any off. */
  function playerCard(player, owned) {
    var ladder = ladderFor(player);
    var points = 0;
    var copies = 0;
    var distinct = 0;
    Object.keys(owned || {}).forEach(function (id) {
      var card = byId(id);
      var n = owned[id] || 0;
      if (!card || card.slug !== player.slug || n <= 0) { return; }
      points += Math.max(0, card.points) * n;
      copies += n;
      distinct += 1;
    });
    points = round2(points);

    var at = -1;
    if (copies > 0) {
      ladder.forEach(function (r, i) { if (points >= r.points) { at = i; } });
    }
    return {
      player: player,
      points: points,
      copies: copies,
      distinct: distinct,
      ladder: ladder,
      rank: at === -1 ? null : ladder[at],
      next: at + 1 < ladder.length ? ladder[at + 1] : null
    };
  }

  /* The bonus one game pays at a rank. */
  function playerBonus(player, stats, season, rankKey) {
    var r = PLAYER_RANKS.filter(function (one) { return one.key === rankKey; })[0];
    if (!r || !r.bonus || !stats) { return 0; }
    var base = EGE.economy.gameCredits(player, stats, season);
    return Math.ceil(Math.round(base * r.bonus * 100) / 100);
  }

  /* Every game this season's Player Cards owe the account holding `owned`,
     keyed pc-{slug}-w{week}. Games at Common go in at 0, so the game is
     settled at the rank held when it was played and a later climb does not
     reopen it. */
  function playerBonusesEarned(owned, season) {
    var year = season || EGE.currentSeason;
    var out = [];
    if (!EGE.economy.paysDiamonds(year)) { return out; }
    EGE.players.forEach(function (player) {
      var pc = playerCard(player, owned);
      EGE.gamesPlayed(player, year).forEach(function (game) {
        if (!game.stats || game.injured || game.bye) { return; }
        var rankKey = pc.rank ? pc.rank.key : null;
        var diamonds = rankKey ? playerBonus(player, game.stats, year, rankKey) : 0;
        out.push({
          key: 'pc-' + player.slug + '-w' + game.week,
          diamonds: diamonds,
          note: (pc.rank ? pc.rank.name : 'No') + ' ' + player.first + ' Player Card, week ' +
                game.week + ' v ' + game.opponent
        });
      });
    });
    return out;
  }

  /* --- the shop's daily cards ----------------------------------------------

     Six cards a day, the same six for everybody: one Legendary and five
     more, each rolled on the pack odds but never past Epic. Bought one at a
     time, and a card bought is gone for everybody until the next day.
     Prices are Sam's, by rarity, and charged by buy_shop_card in
     supabase/schema.sql, which holds the same numbers.

     The page rolls the day's six from a seed made of the date, so whoever
     opens the shop first proposes the same six anybody else would; the
     database keeps the first proposal for the day and everybody reads that
     one back, so a week published halfway through the day does not change
     the shelf. */
  var SHOP_PRICES = { common: 10, uncommon: 12, rare: 15, epic: 20, legendary: 25 };
  var SHOP_SIZE = 6;

  function shopPrice(rarityKey) { return SHOP_PRICES[rarityKey] || null; }

  /* A small seeded generator, so a seed always rolls the same cards. */
  function seeded(seed) {
    var h = 1779033703 ^ String(seed).length;
    for (var i = 0; i < String(seed).length; i += 1) {
      h = Math.imul(h ^ String(seed).charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    var a = h >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* The day's shelf, Legendary first: [{ card, rarity }], no card twice. */
  function rollShop(seed) {
    var rng = seeded('shop:' + seed);
    var pool = pullable(null);
    var out = [];
    var used = {};

    function from(list) {
      var left = list.filter(function (c) { return !used[c.id]; });
      if (!left.length) { return null; }
      var card = left[Math.floor(rng() * left.length)];
      used[card.id] = true;
      return card;
    }

    var top = from(pool.filter(function (c) { return c.rarity === 'legendary'; }));
    if (top) { out.push({ card: top.id, rarity: top.rarity }); }

    var below = RARITIES.filter(function (r) { return SHOP_PRICES[r.key] && r.key !== 'legendary'; });
    var total = below.reduce(function (sum, r) { return sum + r.odds; }, 0);
    var tries = 0;
    while (out.length < SHOP_SIZE && tries < 60) {
      tries += 1;
      var at = rng() * total;
      var pickKey = below[below.length - 1].key;
      for (var i = 0; i < below.length; i += 1) {
        at -= below[i].odds;
        if (at < 0) { pickKey = below[i].key; break; }
      }
      var card = from(pool.filter(function (c) { return c.rarity === pickKey; }));
      if (card) { out.push({ card: card.id, rarity: card.rarity }); }
    }
    return out;
  }

  /* --- the market ----------------------------------------------------------

     Players sell cards to each other for diamonds. A card put up comes out
     of the collection until it sells, is taken down or runs out, and then
     goes to the buyer or back. Three listings a day each, up for a day.
     list_card_for_sale in supabase/schema.sql holds all of it. */
  var MARKET = { perDay: 3, hours: 24, minPrice: 1, maxPrice: 999 };

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
    ICONIC: ICONIC,
    PACKS: PACKS,
    QUICK_SELL: QUICK_SELL,
    packOrder: packOrder,
    BOOSTER: BOOSTER,
    rarity: rarity,
    rankOf: rankOf,
    pack: pack,
    packCover: packCover,
    sellPrice: sellPrice,
    readPlay: readPlay,
    statSummary: statSummary,
    all: all,
    byId: byId,
    pullable: pullable,
    compare: compare,
    rollRarity: rollRarity,
    oddsWith: oddsWith,
    rollPack: rollPack,
    sets: sets,
    fill: fill,
    rollReward: rollReward,
    counts: counts,
    PLAYER_RANKS: PLAYER_RANKS,
    RANK_SCALE: RANK_SCALE,
    ladderFor: ladderFor,
    playerCard: playerCard,
    playerBonus: playerBonus,
    playerBonusesEarned: playerBonusesEarned,
    SHOP_PRICES: SHOP_PRICES,
    SHOP_SIZE: SHOP_SIZE,
    shopPrice: shopPrice,
    rollShop: rollShop,
    MARKET: MARKET,
    rebuild: function () { catalogue = null; setsCache = null; }
  };
})();
