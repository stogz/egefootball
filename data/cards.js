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
     lowest graded score that reaches it. `collegePerformance`, where a
     rarity has one, is that bar for a performance in college or the NFL
     instead: a Mystic game is harder to put up there than in high school,
     so the bar is a little lower (Sam, 2026-10-17).

     Iconic is not graded at all: it is the few cards in ICONIC below,
     picked by hand, and nothing else reaches it however big the game. */
  var RARITIES = [
    { key: 'common',    name: 'Common',    color: '#8b9097', odds: 47.4,  performance: 0,   play: 0 },
    { key: 'uncommon',  name: 'Uncommon',  color: '#3e9a4b', odds: 26,  performance: 6.5, play: 7.1 },
    { key: 'rare',      name: 'Rare',      color: '#e8812a', odds: 14,  performance: 11,  play: 8.6 },
    { key: 'epic',      name: 'Epic',      color: '#d5392b', odds: 8,   performance: 16,  play: 9.6 },
    { key: 'legendary', name: 'Legendary', color: '#8a4fd8', odds: 4,   performance: 20.5, play: 11.2 },
    { key: 'mystic',    name: 'Mystic',    color: '#e0ad25', odds: 0.5,  performance: 28.5, play: 13.3,
      collegePerformance: 24 },
    { key: 'iconic',    name: 'Iconic',    color: '#ec5fa8', odds: 0.1,  performance: null, play: null }
  ];

  /* The Iconic cards. A moment has to be one of these to be Iconic; every
     other card tops out at Mystic. Add an id here to make another. */
  var ICONIC = [
    'p:2019:sam-stogsdill:9',     /* Sam's five touchdowns against Centennial */
    'h:2019:cooper-clark:15:0',    /* Cooper's 80 yard touchdown against Helix */
    'p:2022:jaykeb-stewart:3',     /* Jaykeb Stewart 7TD Masterclass */
    'p:2023:isaac-vitel:11'        /* Isaac 600 Air */
  ];

  /* A performance is graded on its fantasy points times the position's
     credit share (data/economy.js), except where a position grades on a
     share of its own here. A tight end's 0.75 made his big nights Mystic
     far more often than anybody else's (Sam, 2026-10-17), so a tight end
     grades on 0.68. Credits still pay on the 0.75. */
  var GRADE_SHARE = { TE: 0.68 };

  function gradeShare(position) {
    return typeof GRADE_SHARE[position] === 'number'
      ? GRADE_SHARE[position] : EGE.economy.fantasyShareFor(position);
  }

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
             '1.5x the odds of a Legendary.'
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

  /* The Gold Rush Pack, sold only while the Gold Rush is on (see the Gold
     Rush, further down). Its own odds rather than the table above:
     Legendary and Mystic come up more often, so the long touchdown runs and
     the two card-art cards can be found in a week, and Iconic is the same.
     open_card_pack charges for it, and only while the event is on. */
  PACKS.push({
    key: 'gold-rush',
    name: 'Gold Rush Pack',
    diamonds: 15,
    size: 4,
    floor: 'rare',
    event: 'gold-rush',
    odds: { common: 41.4, uncommon: 26, rare: 15, epic: 9, legendary: 7, mystic: 1.5, iconic: 0.1 },
    blurb: 'Four Gold Rush cards of Sam, Cooper and every rushing touchdown, the last one ' +
           'Rare or better. Only Gold Rush cards complete the event’s sets.'
  });

  /* The Halloween Pack, sold only while Halloween is on (see Halloween,
     further down): four cards for 18 diamonds (Sam, 2026-10-26), on the Gold
     Rush Pack's odds. A Legendary or better in one can come out in costume
     (HALLOWEEN.costumeOdds). */
  PACKS.push({
    key: 'halloween',
    name: 'Halloween Pack',
    diamonds: 18,
    size: 4,
    floor: 'rare',
    event: 'halloween',
    odds: { common: 41.4, uncommon: 26, rare: 15, epic: 9, legendary: 7, mystic: 1.5, iconic: 0.1 },
    blurb: 'Four Halloween cards, the last one Rare or better.'
  });

  function pack(key) {
    return PACKS.filter(function (p) { return p.key === key; })[0] || null;
  }

  /* The player on the front of a season's packs and the colours they are
     printed in (Sam's pictures, 2026-10-14): the live Season Pack while it
     is that season, and that year's pack behind the arrows after. `theme`
     is a pack colourway in site.css (.ege-pack--{theme}); `image` a cut-out
     on a clear background in icon/packs/, and `logo` the team's, large
     behind him; `zoom` makes him bigger than the usual size (1.2 is 20%
     bigger), his helmet staying where it is, and `drop` moves him down that
     % of the pack, for a helmet that would cover the EGE Football letters. A season not here gets a plain
     pack in the Season Pack's own colours. */
  var PACK_COVERS = {
    2018: { player: 'cooper-clark', image: 'icon/packs/2018-cooper-clark.webp',
            logo: 'icon/packs/2018-carlsbad-logo.webp', theme: 'carlsbad', zoom: 1.44,
            drop: 1.5 },
    2019: { player: 'sam-stogsdill', image: 'icon/packs/2019-sam-stogsdill.webp',
            logo: 'icon/packs/2019-normal-logo.webp', theme: 'ironmen', zoom: 1.2,
            drop: 2 },
    2020: { player: 'andrew-parr', image: 'icon/packs/2020-andrew-parr.webp',
            logo: 'icon/packs/2020-alabama-logo.webp', theme: 'bama', zoom: 1.2 },
    2021: { player: 'jaykeb-stewart', image: 'icon/packs/2021-jaykeb-stewart.webp',
            logo: 'icon/packs/2021-osu-logo.webp', theme: 'osu', zoom: 1.2, drop: 2.5 },
    2022: { player: 'paxon-hatch', image: 'icon/packs/2022-paxon-hatch.webp',
            logo: 'icon/packs/2022-unc-logo.webp', theme: 'unc', zoom: 1.2, drop: 1.5 },
    2023: { player: 'isaac-vitel', image: 'icon/packs/2023-isaac-vitel.webp',
            logo: 'icon/packs/2023-texas-logo.webp', theme: 'texas', zoom: 1.2, drop: 2.5 }
  };

  /* The Gold Rush Pack's cover: gold foil and its name, nobody on it
     (Sam, 2026-10-16). The Halloween Pack's: purple foil with Sam's pumpkin
     big behind its name. */
  var EVENT_COVERS = {
    'gold-rush': { theme: 'goldrush' },
    'halloween': { theme: 'halloween', logo: 'icon/cards/halloween-pumpkin.webp' }
  };

  /* The cover for a pack, or null. */
  function packCover(p) {
    if (p && p.event) { return EVENT_COVERS[p.event] || null; }
    var year = p && (p.season || (p.seasonOnly ? EGE.currentSeason : null));
    return (year && PACK_COVERS[year]) || null;
  }

  /* --- quick selling ------------------------------------------------------ */

  /* What one copy of a card sells back for, in diamonds, by its rarity. An
     Iconic is not on the list: it cannot be quick sold at all. Paid by
     quick_sell_card in supabase/schema.sql, which holds the same numbers.
     Change both together. */
  var QUICK_SELL = { common: 1, uncommon: 1, rare: 2, epic: 2, legendary: 3, mystic: 30 };

  /* Null for a card that cannot be sold. A holo sells for the three cards
     it was made from. */
  function sellPrice(card) {
    if (!card || !QUICK_SELL[card.rarity]) { return null; }
    return QUICK_SELL[card.rarity] * (card.holo ? HOLO_OF : 1);
  }

  /* --- holographic cards ---------------------------------------------------

     Three copies of one card merge into one holographic copy of it, for
     good: the three go, and the holo carries all of their fantasy points
     (three times the card's), so a Player Card loses nothing by it. Its
     rarity and the colour of its frame stay the card's own; the rest of it
     is holo.

     A holo is the card's id with ':holo' on the end -- 'p:2021:sam-
     stogsdill:5:holo' -- so it is owned, traded, shown off, sold and put on
     the market like any other card. Nothing pulls one: merge_holo_card in
     supabase/schema.sql is the only way one is made, and nothing turns one
     back into three.

     Making one pays diamonds (Sam, 2026-10-20): a tenth of the holo's
     fantasy score -- three times the card's -- rounded up, and never less
     than 1, so a 170-point holo pays 17. Most pay 2 to 4; the biggest, Sam's
     65.3-point Iconic (195.9 as a holo), pays 20. There is no cap:
     merge_holo_card pays it with the merge and only turns down more than
     HOLO_BONUS_MAX, which no card comes near, so change the two together. */
  var HOLO_SUFFIX = ':holo';
  var HOLO_OF = 3;
  var HOLO_POINTS_PER_DIAMOND = 10;
  var HOLO_BONUS_MAX = 60;

  function isHoloId(id) { return /:holo$/.test(String(id || '')); }
  function baseIdOf(id) { return isHoloId(id) ? String(id).slice(0, -HOLO_SUFFIX.length) : id; }
  function holoIdOf(id) { return baseIdOf(id) + HOLO_SUFFIX; }

  /* The diamonds merging three copies of `card` into its holo pays. Worked
     in whole hundredths of a point, so a holo of exactly 170 is 17, never
     17.000001 rounded up to 18. */
  function holoBonus(card) {
    if (!card || card.holo) { return 0; }
    var hundredths = Math.round((Number(card.points) || 0) * HOLO_OF * 100);
    return Math.max(1, Math.ceil(hundredths / (HOLO_POINTS_PER_DIAMOND * 100)));
  }

  /* --- the Gold Rush -----------------------------------------------------------

     A limited-time event (Sam, 2026-10-16). It runs seven days from when an
     admin starts it on the admin page; card_events in supabase/schema.sql
     keeps when, so the clock starts the moment it is launched rather than
     when the site is deployed.

     While it is on the shop sells a Gold Rush Pack: Sam's and Cooper's
     cards and every rushing touchdown (Isaac's and Jaykeb's too). Each card
     in one comes out as a Gold Rush card -- the card again, with a gold
     GOLD RUSH sticker under its score -- and is a card of its own: it never
     stacks with the copies the standard packs give. Only Gold Rush cards
     fill the Gold Rush's sets, but a Gold Rush card counts in the Library's
     sets as the card it is (Sam, 2026-10-20). Its id is the card's with
     ':gr' on the end, 'p:2019:sam-stogsdill:18:gr', and its holo ':gr:holo'.

     The pack can also hold one of the two card-art cards (Sam's own photos
     of Sam's week 18 and Cooper's week 11 in 2019, both Mystic, CARD_ART),
     which only ever come out of it ('a:...:gr'). Finishing every set before
     it ends pays the Iconic GOLD RUSH card ('r:gold-rush:gr'), which no
     pack holds: Sam's art of Sam and Cooper's 2019 seasons, printed as he
     drew it (`rewardImage`).

     Gold Rush cards trade, but a copy that has just been traded cannot be
     traded again for 48 hours, so one set of cards cannot be passed round
     to finish everybody's sets. card_trade_locks in supabase/schema.sql
     holds that, and a market sale counts as a trade. */
  var GOLD_RUSH = {
    key: 'gold-rush',
    name: 'Gold Rush',
    days: 7,
    lockHours: 48,
    pack: 'gold-rush',
    tag: ':gr',
    reward: 'r:gold-rush:gr',
    rewardName: 'GOLD RUSH card',
    rewardImage: 'icon/cards/gold-rush-iconic.webp',
    rewardSeason: 2019,
    /* Paid with the GOLD RUSH card, on top of it. */
    bonus: { diamonds: 40, booster: 'boost-2-5' },
    holds: inGoldRush
  };

  /* --- Halloween ---------------------------------------------------------------

     The second limited-time event (Sam, 2026-10-26), run exactly like the
     Gold Rush: an admin starts it for seven days, the shop sells a
     Halloween Pack while it is on (four cards, 18 diamonds), and every card
     in one is a Halloween card -- the card again with a pumpkin sticker on
     it, ':hw' on the end of its id -- that never stacks with any other copy.
     Only Halloween cards fill Halloween's sets; in the Library they count as
     the card they are, like Gold Rush cards.

     The pack holds the cards Halloween's sets ask for: every card from a
     game played in October, and every card that fits the Graveyard or
     U.F.O. sets whenever it was played (`holds`). It can also hold Sam's two
     card-art cards, Paxon's 2025 week 16 and Isaac's 79 yard touchdown pass
     in 2022 week 12 (CARD_ART).

     A Legendary or better pulled from one comes out in costume one time in
     `costumeOdds` (10%, Sam, 2026-10-26): the same card with the player's
     costume headshot (headshot/halloween/) in place of his own, and a card
     of its own again -- ':hc' on the end, 'p:2019:andrew-parr:12:hc' -- so
     it never stacks with the plain Halloween copy, and three of it make a
     holo of their own. Only a Halloween Pack ever gives one.

     A Mystic out of one is one of the card art a little more often than it
     is any other Mystic: `artShare` of the time (55%, Sam, 2026-10-26, who
     wanted the art slightly likelier than the rest).

     Finishing all eight sets (`needs`, Witching Hour and Monster Mash
     added by Sam, 2026-10-26) before it ends pays the Iconic HALLOWEEN card
     ('r:halloween:hw'), Sam's art of Paxon and Cooper in the 2023 Holiday
     Bowl, with 100 diamonds and two 2.5x Boosters.

     Halloween cards trade on the Gold Rush's terms: a copy that changes
     hands waits 48 hours before it can go again. */
  var HALLOWEEN = {
    key: 'halloween',
    name: 'Halloween',
    days: 7,
    lockHours: 48,
    pack: 'halloween',
    tag: ':hw',
    costumeTag: ':hc',
    costumeOdds: 0.10,
    artShare: 0.55,
    costumes: {
      'andrew-parr':    'headshot/halloween/parr-halloween.png',
      'cooper-clark':   'headshot/halloween/clark-halloween.png',
      'paxon-hatch':    'headshot/halloween/hatch-halloween.png',
      'isaac-vitel':    'headshot/halloween/vitel-halloween.png',
      'sam-stogsdill':  'headshot/halloween/stogsdill-halloween.png',
      'jaykeb-stewart': 'headshot/halloween/stewart-halloween.png'
    },
    reward: 'r:halloween:hw',
    rewardName: 'HALLOWEEN card',
    /* Sam's art for the HALLOWEEN card, 750x1050 like the GOLD RUSH card's
       (USC v. UNC, week 19 2023). */
    rewardImage: 'icon/cards/halloween-iconic.webp',
    rewardSeason: 2023,
    bonus: { diamonds: 100, booster: 'boost-2-5', boosters: 2 },
    /* The sets the HALLOWEEN card needs: all eight (Sam, 2026-10-26). */
    needs: ['graveyard', 'card-art', 'trick-or-treat', 'ufo', 'holoween', 'october',
            'witching-hour', 'monster-mash'],
    holds: inHalloween
  };

  var EVENTS = [GOLD_RUSH, HALLOWEEN];

  function eventOf(key) {
    return EVENTS.filter(function (e) { return e.key === key; })[0] || null;
  }

  /* The event a tag on the end of an id belongs to: ':gr', ':hw' or ':hc'. */
  function eventOfTag(tag) {
    return EVENTS.filter(function (e) { return e.tag === tag || e.costumeTag === tag; })[0] || null;
  }

  /* Sam's card art: the card the page draws, with his photo of the game in
     the picture in place of the headshot (Sam, 2026-10-20), so it is a card
     like any other and makes a holo. `photo` is the picture with the helmet
     cut out above it, on a clear background; `rise` is how far the helmet
     stands above the picture, as a % of its width, and it comes up over the
     PERFORMANCE strip and the score. `event` is the pack it comes out of. A
     play's art has the play's place in the game on its id too. */
  var CARD_ART = [
    { id: 'a:2019:sam-stogsdill:18:gr', of: 'p:2019:sam-stogsdill:18', rarity: 'mystic', event: 'gold-rush',
      photo: 'icon/cards/sam-stogsdill-2019-wk18-cut.webp', rise: 7.62 },
    { id: 'a:2019:cooper-clark:11:gr', of: 'p:2019:cooper-clark:11', rarity: 'mystic', event: 'gold-rush',
      photo: 'icon/cards/cooper-clark-2019-wk11-cut.webp', rise: 9.52 },
    { id: 'a:2025:paxon-hatch:16:hw', of: 'p:2025:paxon-hatch:16', rarity: 'mystic', event: 'halloween',
      photo: 'icon/cards/paxon-hatch-2025-wk16-cut.webp', rise: 11.79 },
    { id: 'a:2022:isaac-vitel:12:0:hw', of: 'h:2022:isaac-vitel:12:0', rarity: 'mystic', event: 'halloween',
      photo: 'icon/cards/isaac-vitel-2022-wk12-cut.webp', rise: 9.81 }
  ];

  /* An event's card, holo or not: Gold Rush, Halloween or a costume. */
  var EVENT_ID = /:(gr|hw|hc)(:holo)?$/;
  function isEventId(id) { return EVENT_ID.test(String(id || '')); }
  function eventIdOf(id, key) { return baseIdOf(id) + (eventOf(key) || GOLD_RUSH).tag; }

  /* Whether a card can go in a Gold Rush Pack: Sam or Cooper, or any
     rushing touchdown. */
  function isRushTd(card) {
    return card.kind === 'play' && card.play && card.play.kind === 'rush' && card.play.touchdown;
  }
  function inGoldRush(card) {
    return card.slug === 'sam-stogsdill' || card.slug === 'cooper-clark' || isRushTd(card);
  }

  /* What Halloween's sets look for in a card. A game's numbers are its
     whole stat line, so a play card of a game with a fumble is not a game
     with a fumble: those are performances. */
  function stat(card, key) {
    var s = card.game && card.game.stats;
    return s && typeof s[key] === 'number' ? s[key] : 0;
  }
  function isGame(card) { return card.kind === 'performance' && Boolean(card.game); }
  function octoberGame(card) { return Boolean(card.game) && /^\d{4}-10-/.test(card.game.date || ''); }
  /* October 25 to 31, the week of Halloween. */
  function halloweenWeek(card) { return Boolean(card.game) && /^\d{4}-10-(2[5-9]|3[01])$/.test(card.game.date || ''); }
  /* A passing or receiving touchdown of `yards` or more at that level. */
  function longTd(yards, tier) {
    return function (card) {
      return card.kind === 'play' && card.play && (card.play.kind === 'pass' || card.play.kind === 'catch') &&
        card.play.touchdown && card.play.yards >= yards && EGE.tierFor(card.season, card.player) === tier;
    };
  }

  var GRAVEYARD = [
    { label: 'Isaac pick-six', test: function (c) {
      return c.slug === 'isaac-vitel' && c.kind === 'play' && c.play && c.play.kind === 'interception';
    } },
    { label: 'Game with a fumble', test: function (c) { return isGame(c) && stat(c, 'fumbles') >= 1; } },
    { label: 'Game with 6+ sacks', test: function (c) { return isGame(c) && stat(c, 'sacks') >= 6; } },
    { label: 'Game of 10 or fewer yards', test: function (c) {
      return isGame(c) && stat(c, 'passingYards') + stat(c, 'rushingYards') + stat(c, 'receivingYards') <= 10;
    } },
    { label: 'Game with 3+ interceptions', test: function (c) { return isGame(c) && stat(c, 'interceptions') >= 3; } }
  ];

  var UFO = [
    { label: '50+ yd NFL passing or receiving TD', test: longTd(50, 'nfl') },
    { label: '70+ yd college passing or receiving TD', test: longTd(70, 'college') },
    { label: '200+ receiving yard game', test: function (c) { return isGame(c) && stat(c, 'receivingYards') >= 200; } },
    { label: '400+ passing yard game', test: function (c) { return isGame(c) && stat(c, 'passingYards') >= 400; } }
  ];

  function inHalloween(card) {
    return octoberGame(card) || GRAVEYARD.concat(UFO).some(function (s) { return s.test(card); });
  }

  /* Whether the event is on, from its card_events row ({ starts_at,
     ends_at }). `at` is a time in ms, now if left out. */
  function eventLive(row, at) {
    if (!row || !row.starts_at || !row.ends_at) { return false; }
    var now = typeof at === 'number' ? at : Date.now();
    return now >= new Date(row.starts_at).getTime() && now < new Date(row.ends_at).getTime();
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

    /* A touchdown the file calls game-winning (or walk-off) or game-icing
       says so on its card, under its yardage. The file is the only place
       that knows when in a game a play came; a go-ahead score that was
       given back later reads just like one that held, so only its words
       decide. */
    var clutch = !touchdown ? null
      : /game-winning|walk-off/.test(t) ? 'Game-Winning'
      : /game-icing/.test(t) ? 'Game-Icing' : null;

    return { kind: kind, yards: yards, touchdown: touchdown, clutch: clutch,
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

  /* `tier` is the level the card was played at (EGE.tierFor). */
  function gradeFor(score, kind, tier) {
    var found = RARITIES[0];
    RARITIES.forEach(function (r) {
      var bar = r[kind];
      if (kind === 'performance' && tier !== 'highSchool' &&
          typeof r.collegePerformance === 'number') { bar = r.collegePerformance; }
      if (typeof bar === 'number' && score >= bar) { found = r; }
    });
    return found.key;
  }

  function rarityOf(id, score, kind, tier) {
    return ICONIC.indexOf(id) !== -1 ? 'iconic' : gradeFor(score, kind, tier);
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
    return (game.home || game.neutral ? 'vs. ' : 'at ') + game.opponent;
  }

  /* --- the catalogue ----------------------------------------------------- */

  /* Every card the season files hold, published or not, keyed by id. A card
     somebody owns is always found here even if its week is pulled back; the
     packs are what keep to published weeks. Built once per load: the season
     files do not change under a page. */
  var catalogue = null;
  var list = [];

  /* The team is the one he played the game for: a trade moves him. */
  function base(player, game, season) {
    var team = EGE.teamFor(player, season, game.week);
    return {
      season: season,
      week: game.week,
      slug: player.slug,
      player: player,
      position: EGE.positionFor(player, season),
      team: team,
      teamKey: EGE.teamKeyFor(player, season, game.week),
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
          perf.grade = round2(points * gradeShare(player.position));
          perf.rarity = rarityOf(perf.id, perf.grade, 'performance', EGE.tierFor(season, player));
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
            /* Not in a game it lost, whatever the file says. */
            if (read.clutch && !(game.result.teamScore > game.result.opponentScore)) { read.clutch = null; }
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

  /* An event's Iconic card, paid for finishing its sets: the GOLD RUSH
     card, the HALLOWEEN card. It is not a game, so most of what a card says
     is left blank; the page prints Sam's art for it (`print`), or draws a
     stand-in while there is none yet (`stand`). */
  function rewardCard(ev) {
    return {
      id: ev.reward, kind: 'reward', reward: true, gold: ev === GOLD_RUSH, eventKey: ev.key,
      rarity: 'iconic', print: ev.rewardImage || null, stand: !ev.rewardImage, points: 0,
      season: ev.rewardSeason, week: 0, slug: null,
      player: { name: ev.name, first: ev.name, headshot: '' },
      position: '', team: null, opponent: '', versus: ev.name, event: ev.name,
      headline: 'Every ' + ev.name + ' set', line: 'Finished every ' + ev.name + ' set before it ended.',
      playoff: false, game: null
    };
  }

  /* A holo is its card over again, marked holo, with the three cards'
     points on it; an event's card is its card again, marked with the
     event (and `gold` for the Gold Rush's), a costume card that with the
     costume headshot, and a card-art card that card with Sam's photo and its
     own rarity. Each is made the first time it is asked for. The reward
     cards have no holo. */
  var made = {};

  function byId(id) {
    ensure();
    if (catalogue[id]) { return catalogue[id]; }
    if (made[id] !== undefined) { return made[id]; }
    var card = null;
    var reward = EVENTS.filter(function (e) { return e.reward === id; })[0];
    var tag = (String(id).match(/:(gr|hw|hc)$/) || [''])[0];
    if (isHoloId(id)) {
      var one = byId(baseIdOf(id));
      if (one && !one.reward) {
        card = Object.assign({}, one, {
          id: id, baseId: one.id, holo: true, points: round2(one.points * HOLO_OF)
        });
      }
    } else if (reward) {
      card = rewardCard(reward);
    } else if (tag) {
      var ev = eventOfTag(tag);
      var art = CARD_ART.filter(function (a) { return a.id === id; })[0] || null;
      var plain = catalogue[art ? art.of : String(id).slice(0, -tag.length)];
      if (plain && ev && (!art || art.event === ev.key)) {
        card = Object.assign({}, plain, { id: id, plainId: plain.id, gold: ev === GOLD_RUSH, eventKey: ev.key });
        if (art) { card.art = { photo: art.photo, rise: art.rise }; card.rarity = art.rarity; }
        if (tag === ev.costumeTag) {
          card.costume = (ev.costumes && ev.costumes[plain.slug]) || null;
          if (!card.costume) { card = null; }
        }
      }
    }
    made[id] = card;
    return card;
  }

  function all() { ensure(); return list; }

  /* What a pack can hand out right now: published weeks only. An event's
     pack hands out the event's card of each it holds, and its card art once
     its week is out. */
  function pullable(packKey) {
    var p = pack(packKey);
    var ev = p && p.event ? eventOf(p.event) : null;
    var cards = all().filter(function (card) {
      if (!EGE.isPublished(card.season, card.week)) { return false; }
      if (p && p.seasonOnly && card.season !== EGE.currentSeason) { return false; }
      if (p && p.season && card.season !== p.season) { return false; }
      if (ev && !ev.holds(card)) { return false; }
      return true;
    });
    if (!ev) { return cards; }
    return cards.map(function (card) { return byId(card.id + ev.tag); }).concat(
      CARD_ART.filter(function (a) {
        var of = catalogue[a.of];
        return a.event === ev.key && of && EGE.isPublished(of.season, of.week);
      }).map(function (a) { return byId(a.id); }));
  }

  /* Best first: rarity, then score, then newest. */
  function compare(a, b) {
    return rankOf(b.rarity) - rankOf(a.rarity) ||
      b.points - a.points ||
      b.season - a.season || b.week - a.week ||
      (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  }

  /* --- rolling ----------------------------------------------------------- */

  /* A pack with a `boost` multiplies the odds of a Legendary by it, and
     Common gives up the difference: a Pro Pack's 1.5 makes Legendary 6% a
     card rather than 4%. Mystic and Iconic stay at their own odds (Sam,
     2026-10-15). */
  var BOOSTED = ['legendary'];

  function oddsWith(boost) {
    var odds = RARITIES.map(function (r) {
      return boost && BOOSTED.indexOf(r.key) !== -1 ? r.odds * boost : r.odds;
    });
    if (boost) {
      odds[0] = 100 - odds.slice(1).reduce(function (sum, n) { return sum + n; }, 0);
    }
    return odds;
  }

  /* A pack's odds, rarity by rarity: its own table when it has one (the
     Gold Rush Pack), else the standard odds with its `boost`. */
  function packOdds(p) {
    if (p && p.odds) {
      return RARITIES.map(function (r) { return p.odds[r.key] || 0; });
    }
    return oddsWith(p && p.boost);
  }

  /* A rarity, on the odds, at or above `floor` and no higher than
     `ceiling`. `odds` is a pack's (packOdds), or a `boost` on the standard
     ones, or nothing for the standard ones. */
  function rollRarity(rng, floor, ceiling, odds) {
    var from = rankOf(floor || 'common');
    var to = ceiling ? Math.max(rankOf(ceiling), from) : RARITIES.length - 1;
    odds = Array.isArray(odds) ? odds : oddsWith(odds);
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
  function drawOne(pool, rng, floor, ceiling, odds) {
    if (!pool.length) { return null; }
    var wanted = rankOf(rollRarity(rng, floor, ceiling, odds));
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
     Iconic is in it, every card after it rolls Legendary or lower. And at
     most two in a five-card pack are Legendary or better, one in a smaller
     pack (Sam, 2026-10-15): once that many are in, the rest roll Epic or
     lower. */
  var PACK_CAP = 'legendary';

  function legendaryCap(p) { return p && p.size >= 5 ? 2 : 1; }

  /* Worst first, so a pack reads left to right from its worst card to its
     best. */
  function packOrder(cards) {
    return cards.slice().sort(function (a, b) { return compare(b, a); });
  }

  /* The costume copy of an event's card, or null: never of card art,
     which has no headshot to swap, nor of a card already in costume. */
  function costumeOf(card) {
    var ev = card && eventOf(card.eventKey);
    if (!ev || !ev.costumeTag || card.art || card.costume || card.holo || card.reward) { return null; }
    return byId(card.plainId + ev.costumeTag);
  }

  /* A Mystic from `pool`: one of its card art `share` of the time, any
     other Mystic the rest. */
  function mysticOf(pool, rng, share) {
    var arts = pool.filter(function (c) { return c.rarity === 'mystic' && c.art; });
    var rest = pool.filter(function (c) { return c.rarity === 'mystic' && !c.art; });
    var side = arts.length && (!rest.length || rng() < share) ? arts : rest;
    return side.length ? side[Math.floor(rng() * side.length)] : null;
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
    var legends = 0;
    var cap = legendaryCap(p);
    var odds = packOdds(p);
    var ev = p.event ? eventOf(p.event) : null;
    for (var i = 0; i < p.size; i += 1) {
      var last = i === p.size - 1;
      var ceiling = legends >= cap ? 'epic' : big ? PACK_CAP : null;
      var card = drawOne(pool, random, last ? p.floor : null, ceiling, odds);
      /* A Mystic out of a Halloween Pack is its card art `artShare` of the
         time, and a Legendary or better that isn't art, now and then in
         costume. */
      if (card && ev && ev.artShare && card.rarity === 'mystic') {
        card = mysticOf(pool, random, ev.artShare) || card;
      }
      if (card && ev && ev.costumeOdds && rankOf(card.rarity) >= rankOf(PACK_CAP) && random() < ev.costumeOdds) {
        card = costumeOf(card) || card;
      }
      if (card) {
        out.push(card);
        if (rankOf(card.rarity) >= rankOf(PACK_CAP)) { legends += 1; }
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

  /* The Gold Rush's sets, Sam's list (2026-10-16). Only Gold Rush cards
     fill them (fill). Each is locked in once
     with every card it was made with in the collection (claim_event_set in
     supabase/schema.sql), so a card can go on afterwards; the six locked in
     before the event ends pay the GOLD RUSH card (the final set,
     GOLD_RUSH.reward).

     Locking a set in pays a reward the way a Library set does (Sam,
     2026-10-16): a Gold Rush card at or above `floor`, diamonds, and a
     booster, more for the sets that take more packs to finish -- a 1.5x
     on the middling ones, the gold 2.0x on the two longest, and the 2.5x
     with the GOLD RUSH card (GOLD_RUSH.rewards, GOLD_RUSH.bonus). The
     diamonds and the booster are held in card_events.rewards in
     supabase/schema.sql, which pays them whatever the page says; change
     the two together.

     A career set wants a performance from every season the player has
     cards in and a play from every one he has a play in -- neither back
     has a play card from 2018, so that year is the performance alone. */
  var eventSetsCache = {};

  function playerOf(slug) {
    return EGE.players.filter(function (p) { return p.slug === slug; })[0] || null;
  }

  function careerSet(slug) {
    var player = playerOf(slug);
    var slots = [];
    seasonsWithCards().forEach(function (season) {
      var his = all().filter(function (c) { return c.slug === slug && c.season === season; });
      var perf = his.some(function (c) { return c.kind === 'performance'; });
      var play = his.some(function (c) { return c.kind === 'play'; });
      var label = season + (perf && play ? ' performance & play' : perf ? ' performance' : ' play');
      ['performance', 'play'].forEach(function (kind) {
        if (kind === 'performance' ? !perf : !play) { return; }
        slots.push(slot(label, function (c) { return c.slug === slug && c.season === season && c.kind === kind; }));
      });
    });
    return {
      key: slug,
      name: player.name,
      blurb: 'A play and a performance from every year of ' + player.first + '’s career.',
      event: GOLD_RUSH.key,
      slots: slots
    };
  }

  /* Each set's reward, hardest last. */
  GOLD_RUSH.rewards = {
    'card-art':        { floor: 'rare', diamonds: 8 },
    'sam-stogsdill':   { floor: 'epic', diamonds: 10, booster: 'boost-1-5',
                         from: ofPlayer('sam-stogsdill'), fromText: 'Sam' },
    'triple':          { floor: 'epic', diamonds: 12, booster: 'boost-1-5' },
    'marathon':        { floor: 'legendary', diamonds: 15, booster: 'boost-1-5',
                         from: isRushTd, fromText: 'a rushing TD' },
    'red-zone-rushes': { floor: 'legendary', diamonds: 20, booster: 'boost-2-0' },
    'cooper-clark':    { floor: 'legendary', diamonds: 25, booster: 'boost-2-0',
                         from: ofPlayer('cooper-clark'), fromText: 'Cooper' }
  };

  function goldRushSets() {
    var out = [careerSet('cooper-clark'), careerSet('sam-stogsdill')];

    out.push({
      key: 'marathon',
      name: 'Marathon',
      blurb: 'Three rushing touchdown plays of over 60 yards.',
      event: GOLD_RUSH.key,
      slots: times(3, 'Rushing TD over 60 yards', function (c) { return isRushTd(c) && c.play.yards > 60; })
    });

    out.push({
      key: 'red-zone-rushes',
      name: 'Red-Zone Rushes',
      blurb: 'A rushing touchdown play of Isaac, Jaykeb, Sam and Cooper.',
      event: GOLD_RUSH.key,
      slots: ['isaac-vitel', 'jaykeb-stewart', 'sam-stogsdill', 'cooper-clark'].map(function (slug) {
        return slot(playerOf(slug).first + ' rushing TD', function (c) { return isRushTd(c) && c.slug === slug; });
      })
    });

    out.push({
      key: 'triple',
      name: 'Triple',
      blurb: 'A holo rushing touchdown and a holo Sam or Cooper performance.',
      event: GOLD_RUSH.key,
      slots: [
        slot('Holo rushing TD', function (c) { return c.holo && isRushTd(c); }),
        slot('Holo Sam or Cooper performance', function (c) {
          return c.holo && c.kind === 'performance' && (c.slug === 'sam-stogsdill' || c.slug === 'cooper-clark');
        })
      ]
    });

    out.push({
      key: 'card-art',
      name: 'Card-Art',
      blurb: 'One of the two card-art cards.',
      event: GOLD_RUSH.key,
      slots: [slot('Card art', function (c) { return Boolean(c.art) && !c.reward; })]
    });
    return out;
  }

  /* Halloween's sets: Sam's six (2026-10-26) in his order, then two more,
     Witching Hour and Monster Mash; the HALLOWEEN card needs all eight
     (HALLOWEEN.needs). Card Art wants a card
     the player pulled out of a Halloween Pack themselves (`pulled`): one
     traded for does not count, and claim_event_set checks the player's own
     packs for it.

     The rewards (Sam left them to us): the more packs a set takes, the
     better the card and the bigger the booster; the HALLOWEEN card pays the
     most of anything, 100 diamonds and two 2.5x. Held in card_events.rewards
     in supabase/schema.sql too; change the two together. Simulated at four
     cards a pack, one player alone, every week out: Card Art about 80 packs
     (it cannot be traded for), Graveyard 70, U.F.O. 60, October 20,
     Holoween 120, and Trick or Treat, the hardest, nearer 400 at a 10%
     costume chance, so the whole of it is a trading job. */
  var SIX = ['isaac-vitel', 'paxon-hatch', 'cooper-clark', 'andrew-parr', 'sam-stogsdill', 'jaykeb-stewart'];

  HALLOWEEN.rewards = {
    'card-art':       { floor: 'epic', diamonds: 10 },
    'witching-hour':  { floor: 'epic', diamonds: 12, booster: 'boost-1-5' },
    'monster-mash':   { floor: 'legendary', diamonds: 15, booster: 'boost-1-5' },
    'october':        { floor: 'legendary', diamonds: 20, booster: 'boost-1-5' },
    'graveyard':      { floor: 'legendary', diamonds: 20, booster: 'boost-2-0' },
    'ufo':            { floor: 'legendary', diamonds: 25, booster: 'boost-2-0' },
    'holoween':       { floor: 'legendary', diamonds: 30, booster: 'boost-2-0' },
    'trick-or-treat': { floor: 'mystic', diamonds: 40, booster: 'boost-2-5' }
  };

  function halloweenSets() {
    var epic = rankOf('epic');
    var legendary = rankOf('legendary');
    function first(slug) { return playerOf(slug).first; }
    return [
      { key: 'graveyard', name: 'Graveyard',
        slots: GRAVEYARD.map(function (s) { return slot(s.label, s.test); }) },
      { key: 'card-art', name: 'Card Art', pulled: true,
        slots: [slot('Card art you pulled', function (c) { return Boolean(c.art); })] },
      { key: 'trick-or-treat', name: 'Trick or Treat',
        slots: SIX.map(function (slug) {
          return slot(first(slug) + ' costume', function (c) { return Boolean(c.costume) && c.slug === slug; });
        }) },
      { key: 'ufo', name: 'U.F.O.',
        slots: UFO.map(function (s) { return slot(s.label, s.test); }) },
      { key: 'holoween', name: 'Holoween',
        slots: ['sam-stogsdill', 'cooper-clark', 'paxon-hatch', 'jaykeb-stewart', 'andrew-parr', 'isaac-vitel']
          .map(function (slug) {
            return slot(first(slug) + ' Epic+ holo', function (c) {
              return c.holo && c.slug === slug && rankOf(c.rarity) >= epic;
            });
          }) },
      { key: 'october', name: 'October',
        slots: times(15, 'Epic+ from October', function (c) { return octoberGame(c) && rankOf(c.rarity) >= epic; }) },
      { key: 'witching-hour', name: 'Witching Hour',
        slots: SIX.map(function (slug) {
          return slot(first(slug) + ', Oct 25\u201331', function (c) { return c.slug === slug && halloweenWeek(c); });
        }) },
      { key: 'monster-mash', name: 'Monster Mash',
        slots: SIX.map(function (slug) {
          return slot(first(slug) + ' Legendary+', function (c) { return c.slug === slug && rankOf(c.rarity) >= legendary; });
        }) }
    ].map(function (set) { set.event = HALLOWEEN.key; return set; });
  }

  /* An event's sets, each with its reward. */
  function eventSets(key) {
    var ev = eventOf(key || GOLD_RUSH.key);
    if (!ev) { return []; }
    if (eventSetsCache[ev.key]) { return eventSetsCache[ev.key]; }
    var out = ev === GOLD_RUSH ? goldRushSets() : halloweenSets();
    out.forEach(function (set) { set.reward = ev.rewards[set.key]; });
    eventSetsCache[ev.key] = out;
    return out;
  }

  /* The sets an event's own card needs: `needs`, or every set. */
  function finalSets(key) {
    var ev = eventOf(key);
    var sets = eventSets(key);
    return ev && ev.needs ? sets.filter(function (set) { return ev.needs.indexOf(set.key) !== -1; }) : sets;
  }

  /* Which owned card fills which slot. Slots in a set either want the same
     thing or things that cannot overlap, so taking the first card that fits
     each one in turn is as good as any cleverer matching. Best cards are
     offered first, so the set shows off what it is made of. A holo is its
     card in a set: it counts where the card would, and the two of them
     never fill two slots. An event's set takes that event's cards and
     nothing else, and in Halloween's a costume card is the same card as
     its plain Halloween copy. A Library set takes those too (Sam, 2026-10-20),
     each as the card it is a copy of, so a card and its event copies never
     fill two slots either: the card-art cards count as the game they are
     art of, and the reward cards as Iconics. `pulled` ({ id: true }) is
     what the player has pulled out of the event's packs, for a set that
     wants a card they pulled themselves. */
  function fill(set, ownedIds, pulled) {
    var owned = ownedIds.map(byId).filter(function (c) {
      if (!c) { return false; }
      if (!set.event) { return true; }
      if (c.eventKey !== set.event || c.reward) { return false; }
      return !set.pulled || Boolean(pulled && pulled[c.baseId || c.id]);
    }).sort(compare);
    function same(c) { return set.event === GOLD_RUSH.key ? c.baseId || c.id : c.plainId || c.baseId || c.id; }
    var used = {};
    var filled = set.slots.map(function (s) {
      var card = owned.filter(function (c) { return !used[same(c)] && s.test(c); })[0] || null;
      if (card) { used[same(card)] = true; }
      return { slot: s, card: card };
    });
    var have = filled.filter(function (f) { return f.card; }).length;
    return { slots: filled, have: have, need: set.slots.length,
             complete: set.slots.length > 0 && have === set.slots.length };
  }

  /* The card a set pays out with. From every published card, or the set's
     own pool when it names one, at or above its floor. An event's set pays
     a card of that event's, from what its pack holds, never in costume and
     never Halloween card art, which only a pack gives. */
  function rollReward(set, rng) {
    var ev = set.event ? eventOf(set.event) : null;
    var pool = ev ? pullable(ev.pack) : pullable(null);
    if (ev === HALLOWEEN) { pool = pool.filter(function (c) { return !c.art; }); }
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
     Common to Iconic, and then one rung more that no card ever reaches:
     GOAT.

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
       Iconic      7000   300%        39               546
       GOAT       28000   500%        65               910

     An account earns about 200 diamonds a season from its own games, and
     random packs bring in about half a point of any one player per diamond
     spent.

     Iconic was 3500 until Sam made it twice as hard (2026-10-20) and put
     GOAT above it, four times as hard again as Iconic. GOAT is a Player Card's alone: no play or performance
     card is ever GOAT, so it is not one of the RARITIES and its rung
     carries its own name and colour. */
  var PLAYER_RANKS = [
    { key: 'common',    points: 0,    bonus: 0 },
    { key: 'uncommon',  points: 150,  bonus: 0.10 },
    { key: 'rare',      points: 400,  bonus: 0.25 },
    { key: 'epic',      points: 800,  bonus: 0.50 },
    { key: 'legendary', points: 1400, bonus: 0.80 },
    { key: 'mystic',    points: 2200, bonus: 1.25 },
    { key: 'iconic',    points: 7000, bonus: 3.00 },
    { key: 'goat',      points: 28000, bonus: 5.00, name: 'GOAT', color: '#9aa9ba' }
  ];

  /* A rung's name and colour: its card rarity's, or its own for GOAT. */
  function playerRank(key) {
    var r = PLAYER_RANKS.filter(function (one) { return one.key === key; })[0];
    if (!r) { return null; }
    var card = rarity(key);
    return { key: r.key, name: r.name || card.name, color: r.color || card.color,
             points: r.points, bonus: r.bonus };
  }

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
      var info = playerRank(r.key);
      return { key: r.key, name: info.name, color: info.color,
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
    var seen = {};
    Object.keys(owned || {}).forEach(function (id) {
      var card = byId(id);
      var n = owned[id] || 0;
      if (!card || card.slug !== player.slug || n <= 0) { return; }
      points += Math.max(0, card.points) * n;
      copies += n;
      seen[card.baseId || card.id] = true;
    });
    var distinct = Object.keys(seen).length;
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

  /* The bonus one game pays at a rank. A playoff game pays twice it, the
     same 2x as the game's own diamonds (data/economy.js). */
  function playerBonus(player, stats, season, rankKey, playoff) {
    var r = PLAYER_RANKS.filter(function (one) { return one.key === rankKey; })[0];
    if (!r || !r.bonus || !stats) { return 0; }
    var base = EGE.economy.gameCredits(player, stats, season) *
               EGE.economy.playoffDiamondTimes(season, playoff);
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
        var diamonds = rankKey ? playerBonus(player, game.stats, year, rankKey, game.playoff) : 0;
        out.push({
          key: 'pc-' + player.slug + '-w' + game.week,
          diamonds: diamonds,
          note: (pc.rank ? pc.rank.name : 'No') + ' ' + player.first + ' Player Card, week ' +
                game.week + ' v ' + game.opponent +
                (EGE.economy.playoffBoosted(year, game.playoff) ?
                  ' at the playoff ' + EGE.economy.PLAYOFF_DIAMONDS + 'x' : '')
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

  /* --- the daily spin --------------------------------------------------------

     One free spin a day for every account, on the Shop page. The day turns
     over at 7:00 AM Central (America/Chicago, so it follows daylight
     saving), and the database holds each account to one spin a day.

     The prizes are Sam's (2026-10-15): an Uncommon card at worst, a few
     diamonds, a Rare card or a Base Pack, and two jackpots that are much
     harder to hit, a Legendary card and a Pro Pack. `odds` are percent and
     add up to 100.

     Which prize comes up is rolled by spin_card_wheel in
     supabase/schema.sql, on the same odds, so nobody picks their own. The
     page proposes what every prize would be before the spin -- one card of
     each rarity, a Base Pack's three and a Pro Pack's five, rolled the way
     packs are (rollSpinOffer) -- the same trust a pack's contents run on.
     Odds and the diamonds are repeated there; change both together. */
  var SPIN = {
    diamonds: 5,
    resetHour: 7,
    timeZone: 'America/Chicago',
    prizes: [
      { key: 'uncommon',  name: 'Uncommon card',  short: 'Uncommon', odds: 35 },
      { key: 'diamonds',  name: '5 diamonds',     short: '5 Diamonds', odds: 25 },
      { key: 'rare',      name: 'Rare card',      short: 'Rare', odds: 20 },
      { key: 'base',      name: 'Base Pack',      short: 'Base Pack', odds: 15, pack: 'base' },
      { key: 'pro',       name: 'Pro Pack',       short: 'Pro Pack', odds: 3, pack: 'pro', jackpot: true },
      { key: 'legendary', name: 'Legendary card', short: 'Legendary', odds: 2, jackpot: true }
    ]
  };

  function spinPrize(key) {
    return SPIN.prizes.filter(function (p) { return p.key === key; })[0] || null;
  }

  /* What each prize would be: { uncommon, rare, legendary: card id,
     base: [3 ids], pro: [5 ids] }. Null while there are not cards out to
     fill them. */
  function rollSpinOffer(rng) {
    var random = rng || Math.random;
    var pool = pullable(null);
    function card(key) {
      var c = drawOne(pool, random, key, key);
      return c ? c.id : null;
    }
    function packOf(key) {
      return rollPack(key, random).map(function (c) { return c.id; });
    }
    var offer = {
      uncommon: card('uncommon'), rare: card('rare'), legendary: card('legendary'),
      base: packOf('base'), pro: packOf('pro')
    };
    var full = offer.uncommon && offer.rare && offer.legendary &&
      offer.base.length === pack('base').size && offer.pro.length === pack('pro').size;
    return full ? offer : null;
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
    playerRank: playerRank,
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
    SPIN: SPIN,
    spinPrize: spinPrize,
    rollSpinOffer: rollSpinOffer,
    HOLO_OF: HOLO_OF,
    HOLO_BONUS_MAX: HOLO_BONUS_MAX,
    holoBonus: holoBonus,
    isHoloId: isHoloId,
    baseIdOf: baseIdOf,
    holoIdOf: holoIdOf,
    legendaryCap: legendaryCap,
    packOdds: packOdds,
    GOLD_RUSH: GOLD_RUSH,
    HALLOWEEN: HALLOWEEN,
    EVENTS: EVENTS,
    eventOf: eventOf,
    CARD_ART: CARD_ART,
    isEventId: isEventId,
    eventIdOf: eventIdOf,
    costumeOf: costumeOf,
    isRushTd: isRushTd,
    inGoldRush: inGoldRush,
    inHalloween: inHalloween,
    eventLive: eventLive,
    eventSets: eventSets,
    finalSets: finalSets,
    rebuild: function () { catalogue = null; made = {}; setsCache = null; eventSetsCache = {}; }
  };
})();
