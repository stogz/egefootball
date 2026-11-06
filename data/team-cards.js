/* ==========================================================================
   EGE Football — Team Cards
   Every NFL card you hold of one team, together (Sam, 2026-11-06): a Team
   Card that climbs as you collect that team's teammates' cards, and once it
   is Uncommon pays diamonds every time the team wins, more the bigger the
   win. It gives a Common performance or a small play a reason to stay in
   the collection rather than be quick sold.

   Which team a card is
   --------------------
   The team the teammate played that game for, the team one of the six was
   on that week (`simTeam` on an NFL card, data/nfl-cards.js). A Pickens
   game from his Steelers days stays a Steelers card after he moves on.

   How it climbs
   -------------
   On the cards held of the team, each copy one, a holo three and a Holo II
   nine (the copies it was made from, so merging never costs a Team Card
   anything). A Common card counts as much as a Mystic: what it rewards is
   keeping cards. The first card makes it, at Common, which pays nothing;
   RANKS has the rest. A team the six have played for that you have no card
   of yet shows grey.

   What it pays
   ------------
   For each win, the rank's `perWin` on a 10-point win, less for a closer
   one and up to twice it for a win by 25 or more:

     perWin x min(margin + 5, 30) / 15, rounded, never under 1

   so an Epic Team Card pays 4 on a field goal, 10 on a 10-point win and 20
   on a blowout, and a playoff win twice that (the same 2x as every playoff
   game's diamonds, data/economy.js). The team's wins come from the NFL
   sim's box scores, every published week of the season, the playoffs too.

   pay_team_card_wins in supabase/schema.sql does the paying: the page says
   what rank each Team Card is (claims, below) and Postgres finds the wins
   in sim_box_scores and works out each one's pay itself, so a win is only
   ever paid for a game the team won. One award a win, tc-{team}-w{week}
   (tc-pit-w5), paid once at the rank held when it is first paid. A win
   while the card was below Uncommon goes in at nothing, and the first time
   an account is paid at all every win already out goes in at nothing (a
   tc-start row), so climbing later never back-pays. RANKS and winPay are
   written out in the SQL as well: change both together.

   Depends on: data/nfl.js, data/cards.js, data/nfl-cards.js, data/games.js.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.teamCards = (function () {
  'use strict';

  /* How hard and how much (the PR that added this has the working). An NFL
     Pack is four cards, and the teams the six have been with longest hold
     about one NFL card in six each, a team they left early one in twenty.
     In a simulated league, one player alone opening NFL Packs (median):
     the busiest team's Team Card is Uncommon after about 14 packs, Rare 35,
     Epic 72, Legendary 130 and Mystic 215; a one-in-eight team's is Epic
     after about 110; a trade or two cuts that a lot. The ladder is the
     six's Player Cards' shape: Iconic three times Mystic, GOAT four times
     Iconic. */
  var RANKS = [
    { key: 'common',    cards: 1,    perWin: 0 },
    { key: 'uncommon',  cards: 10,   perWin: 2 },
    { key: 'rare',      cards: 25,   perWin: 5 },
    { key: 'epic',      cards: 50,   perWin: 10 },
    { key: 'legendary', cards: 90,   perWin: 15 },
    { key: 'mystic',    cards: 150,  perWin: 20 },
    { key: 'iconic',    cards: 450,  perWin: 30 },
    { key: 'goat',      cards: 1800, perWin: 40 }
  ];

  /* A win by MARGIN_AT pays a rank's perWin; the margin counts up to
     MARGIN_TOP, which pays twice it. */
  var MARGIN_AT = 10;
  var MARGIN_TOP = 25;
  var MARGIN_LIFT = 5;

  var HOLO_OF = 3;

  function rankInfo(key) {
    var r = RANKS.filter(function (one) { return one.key === key; })[0];
    if (!r) { return null; }
    var look = EGE.cards.playerRank(key);
    return { key: r.key, name: look.name, color: look.color, cards: r.cards, perWin: r.perWin };
  }

  function ladder() {
    return RANKS.map(function (r) { return rankInfo(r.key); });
  }

  /* --- a team ------------------------------------------------------------- */

  /* What a Team Card prints of its team. */
  function teamOf(key) {
    var t = EGE.nfl && EGE.nfl.teams[key];
    if (!t) { return { key: key, name: key, short: key, city: key, color: '#2f4a2b', accent: '#fbf4e6', logo: null }; }
    return {
      key: key, name: t.name, short: t.name.split(' ').pop(), city: EGE.nfl.city(key),
      league: t.conf + ' ' + t.div, color: t.color, accent: t.accent, logo: EGE.nfl.logo(key), site: t.site
    };
  }

  /* How many copies a card id stands for: one, or the three or nine a holo
     was made from. */
  function copiesOf(card) {
    return card.holo2 ? HOLO_OF * HOLO_OF : card.holo ? HOLO_OF : 1;
  }

  /* Every team the account holds an NFL card of: { DET: { cards, distinct,
     players } }. `cards` counts holos as their copies. */
  function holdings(owned) {
    var out = {};
    Object.keys(owned || {}).forEach(function (id) {
      if (!EGE.nflCards || !EGE.nflCards.isNflId(id)) { return; }
      var card = EGE.cards.byId(id);
      var q = owned[id] || 0;
      if (!card || !card.nfl || !card.simTeam || q <= 0) { return; }
      var h = out[card.simTeam] || (out[card.simTeam] = { cards: 0, seen: {}, who: {} });
      h.cards += q * copiesOf(card);
      h.seen[card.baseId || card.id] = true;
      h.who[card.slug] = true;
    });
    Object.keys(out).forEach(function (key) {
      out[key].distinct = Object.keys(out[key].seen).length;
      out[key].players = Object.keys(out[key].who).length;
      delete out[key].seen;
      delete out[key].who;
    });
    return out;
  }

  /* One team's Team Card for `owned`, shaped as a Player Card is: rank null
     before its first card. */
  function teamCard(key, owned, held) {
    var h = (held || holdings(owned))[key] || { cards: 0, distinct: 0, players: 0 };
    var steps = ladder();
    var at = -1;
    steps.forEach(function (r, i) { if (h.cards >= r.cards) { at = i; } });
    return {
      team: teamOf(key), key: key, isTeam: true,
      cards: h.cards, distinct: h.distinct, players: h.players, ladder: steps,
      rank: at === -1 ? null : steps[at],
      next: at + 1 < steps.length ? steps[at + 1] : null
    };
  }

  /* The teams there are Team Cards of: every team with NFL cards out, in
     the order the NFL Teammates sets have them (EGE.nflCards.teams). */
  function teamKeys() {
    return EGE.nflCards && EGE.nflCards.loaded() ? EGE.nflCards.teams().map(function (t) { return t.key; }) : [];
  }

  /* Every Team Card for `owned`, best first, then the teams with no card
     yet in the sets' order. */
  function teamCards(owned) {
    var held = holdings(owned);
    var keys = teamKeys();
    Object.keys(held).forEach(function (key) { if (keys.indexOf(key) === -1) { keys.push(key); } });
    var order = {};
    keys.forEach(function (key, i) { order[key] = i; });
    function rankAt(tc) { return tc.rank ? RANKS.map(function (r) { return r.key; }).indexOf(tc.rank.key) : -1; }
    return keys.map(function (key) { return teamCard(key, owned, held); }).sort(function (a, b) {
      return rankAt(b) - rankAt(a) || b.cards - a.cards || order[a.key] - order[b.key];
    });
  }

  /* --- wins ------------------------------------------------------------- */

  /* What one win pays at a rank: by `margin` points, `playoff` or not. */
  function winPay(rankKey, margin, playoff, season) {
    var r = rankInfo(rankKey);
    if (!r || !r.perWin || !(margin > 0)) { return 0; }
    var times = EGE.economy ? EGE.economy.playoffDiamondTimes(season, playoff) : 1;
    var counted = Math.min(margin, MARGIN_TOP) + MARGIN_LIFT;
    return Math.max(1, Math.round(r.perWin * counted * times / (MARGIN_AT + MARGIN_LIFT)));
  }

  /* A team's regular season so far, every published week: { wins, losses,
     ties, games: [{ week, margin }] }, a loss's margin below 0. The
     playoffs are the sim's box scores' alone, which Postgres reads when it
     pays; the page counts the regular season. */
  var recordCache = { key: '', map: null };

  function records(season) {
    var year = season || EGE.currentSeason;
    var stamp = year + ':' + ((EGE.publishedWeeks || {})[year] || []).length + ':' +
      (EGE.storedWeeks && EGE.storedWeeks.version ? EGE.storedWeeks.version() : '');
    if (recordCache.key === stamp && recordCache.map) { return recordCache.map; }
    var map = {};
    function side(name, week, us, them) {
      var key = EGE.nfl ? EGE.nfl.keyByName(name) : null;
      if (!key) { return; }
      var r = map[key] || (map[key] = { wins: 0, losses: 0, ties: 0, games: [] });
      if (us > them) { r.wins += 1; } else if (us < them) { r.losses += 1; } else { r.ties += 1; }
      r.games.push({ week: week, margin: us - them });
    }
    (EGE.nflResults ? EGE.nflResults(year) : []).forEach(function (g) {
      if (!g.score) { return; }
      side(g.home, g.week, g.score[0], g.score[1]);
      side(g.away, g.week, g.score[1], g.score[0]);
    });
    recordCache = { key: stamp, map: map };
    return map;
  }

  function record(key, season) {
    return records(season)[key] || { wins: 0, losses: 0, ties: 0, games: [] };
  }

  function recordText(r) {
    return r.wins + '-' + r.losses + (r.ties ? '-' + r.ties : '');
  }

  /* What pay_team_card_wins is told: the rank of every Team Card there
     is, null below Uncommon, so each win is settled at the rank held when
     it is first paid -- nothing while it pays nothing. */
  function claims(owned) {
    return teamCards(owned).map(function (tc) {
      return { team: tc.key, rank: tc.rank && tc.rank.perWin ? tc.rank.key : null };
    });
  }

  /* --- what has been paid ----------------------------------------------- */

  var AWARD = /^tc-([a-z]{2,3})-w(\d{1,2})$/;

  /* An award key's team ('PIT') and week, or null for anything else. */
  function awardOf(key) {
    var m = AWARD.exec(String(key || ''));
    return m ? { team: m[1].toUpperCase(), week: Number(m[2]) } : null;
  }

  /* What each Team Card has paid, every season, out of diamond_awards rows:
     { PIT: diamonds }. */
  function earnedFrom(rows) {
    var out = {};
    (rows || []).forEach(function (row) {
      var a = awardOf(row.award_key);
      if (a) { out[a.team] = (out[a.team] || 0) + (Number(row.diamonds) || 0); }
    });
    return out;
  }

  return {
    RANKS: RANKS,
    MARGIN_AT: MARGIN_AT,
    MARGIN_TOP: MARGIN_TOP,
    rankInfo: rankInfo,
    ladder: ladder,
    teamOf: teamOf,
    holdings: holdings,
    teamCard: teamCard,
    teamCards: teamCards,
    winPay: winPay,
    record: record,
    recordText: recordText,
    claims: claims,
    awardOf: awardOf,
    earnedFrom: earnedFrom
  };
})();
