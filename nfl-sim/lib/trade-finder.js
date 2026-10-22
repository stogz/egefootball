/* ==========================================================================
   EGE Football NFL sim — the trade finder
   Sam picks a player on a team page and asks where he would be better off.
   Every other team is looked at for him, and suits him better when, all
   told, it is a better place for him than where he is:

   - its system: his fit in its schemes against his fit now, in stars
     (lib/fit.js);
   - its status: competing, retooling or rebuilding, and its record;
   - his role: starting there when he is not starting here. A team he
     would not start for while he starts now never suits him better, and
     a rebuilding team never does for a player of 29 or more.

   Each team that suits him better and comes out ahead by its own numbers
   (lib/trades.js valueOf, the view every trade is weighed by) offers the
   cheapest package his team takes from what it has to give up -- picks for
   the next three drafts and up to two players -- with both teams under the
   cap. His team can put something of its own in with him, too (Sam,
   2026-10-21): a player or pick that team wants, so that a bigger package
   comes out even. The best of those come back as trades in the trade
   builder's two sides, ready to make or propose, with how each player
   coming in fits his new team's schemes.

   A pick can be shopped the same way (Sam, 2026-10-22, from the Picks on
   a team's page): every other team that comes out ahead by its own numbers
   offers the cheapest package the pick's owner takes for it, the best of
   them for the owner first, and a player who would start for it counts
   for more.

   Refresh asks again: each trade's place is shaken up a little and the
   ones already shown go to the back, so another set comes up.
   ========================================================================== */

'use strict';

const { valueOf, slotFinder, record, describeItem, pickId, pickLabel } = require('./trades');
const { playerFit } = require('./fit');
const { starterLevels, onTeam, byPos, payroll, SLOTS } = require('./rosters');
const { capFor } = require('./value');
const { locked } = require('./draft-plan');
const { DEADLINE_WEEK } = require('./season');
const { recordText } = require('./standings');
const { TEAMS } = require('./teams');
const { seeded } = require('./rng');

const IN_SEASON = ['regular', 'deadline', 'playoffs'];
const SHOWN = 6;
/* How many of his team's own players and picks are tried with him, for
   each team: the ones it values most above what his team does. */
const EXTRAS = 4;
/* How much a team's status is worth to a player, in stars. */
const MODE = { compete: 1, retool: 0.5, rebuild: 0 };

function nick(key) { return TEAMS[key] ? TEAMS[key].name.split(' ').slice(-1)[0] : key; }

function round1(v) { return Math.round(v * 10) / 10; }

function checkWindow(league) {
  if (league.phase === 'playoffs' || (league.phase === 'regular' && league.week > DEADLINE_WEEK)) {
    throw new Error('The trade deadline has passed. Trades open again in the offseason.');
  }
}

/* Whether trades can be made now, and of him. */
function check(league, p) {
  if (!p || p.status !== 'active' || !TEAMS[p.team]) { throw new Error((p ? p.name : 'He') + ' is not on a team.'); }
  checkWindow(league);
  if (p.ege && IN_SEASON.indexOf(league.phase) !== -1) {
    throw new Error('The six can only be traded in the offseason: the website keeps one team a season for them.');
  }
}

/* What a team can put in a trade: its picks for the next three drafts (not
   one an uploaded draft covers) and its players of 62 or better, starters
   too, but none at `pos` (his position, for a team getting him), no kicker
   or punter, never its quarterback or a starter of 85 or more, and never
   one of the six. */
function assetsOf(league, key, pos) {
  const picks = league.picks.filter((pick) => pick.owner === key && pick.year >= league.season &&
    pick.year <= league.season + 2 && !locked(league, pick)).map((pick) => ({ kind: 'pick', pick }));
  const roster = onTeam(league, key);
  const core = (p) => {
    const rank = byPos(roster, p.pos).indexOf(p);
    return rank < (SLOTS[p.pos] || 0) && (p.ovr >= 85 || p.pos === 'QB');
  };
  const players = roster.filter((p) => !p.ege && p.pos !== pos && p.pos !== 'K' && p.pos !== 'P' && p.ovr >= 62 && !core(p) &&
    !(p.injury && p.injury.games >= 4)).map((player) => ({ kind: 'player', player }));
  return picks.concat(players);
}

function payOf(a) { return a.kind === 'player' && a.player.contract ? a.player.contract.apy || 0 : 0; }

/* What the buyer could give, each valued by both teams, cheapest to the
   seller first. */
function offersOf(league, buyer, seller, pos, slotOf, levels) {
  return assetsOf(league, buyer, pos).map((a) => ({
    a, toSeller: valueOf(league, a, seller, slotOf, levels, false), fromBuyer: valueOf(league, a, buyer, slotOf, levels, true),
    player: a.kind === 'player' ? 1 : 0, pay: payOf(a)
  })).filter((x) => x.toSeller > 0.3).sort((x, y) => x.toSeller - y.toSeller);
}

/* The cheapest package, by the buyer's own numbers, the seller takes for
   what it sends (him, and whatever it adds): one to four of the buyer's
   `offers`, at most two of them players and none at a position coming the
   other way, with both teams under the cap afterwards (or no further over
   it than they were). */
function packageFor(league, buyer, seller, sending, price, worth, offers) {
  const cap = capFor(league.season);
  const apy = sending.reduce((sum, a) => sum + payOf(a), 0);
  const skip = sending.filter((a) => a.kind === 'player').map((a) => a.player.pos);
  const buyerPay = payroll(league, buyer);
  const sellerPay = payroll(league, seller);
  /* The dozen cheapest and the dozen dearest: the cheap ones for a backup,
     the dear ones for a star. */
  const all = offers.filter((x) => !x.player || skip.indexOf(x.a.player.pos) === -1);
  const assets = all.length <= 24 ? all : all.slice(0, 12).concat(all.slice(-12));
  let best = null;
  const consider = (combo) => {
    let got = 0;
    let cost = 0;
    let players = 0;
    let sent = 0;
    combo.forEach((x) => { got += x.toSeller; cost += x.fromBuyer; players += x.player; sent += x.pay; });
    if (players > 2 || got < price || cost > worth) { return; }
    if (best && (cost > best.cost + 1e-9 || (Math.abs(cost - best.cost) < 1e-9 && combo.length >= best.items.length))) { return; }
    if (buyerPay + apy - sent > Math.max(cap, buyerPay)) { return; }
    if (sellerPay - apy + sent > Math.max(cap, sellerPay)) { return; }
    best = { items: combo.map((x) => x.a), got, cost, buyerRoom: cap - (buyerPay + apy - sent), sellerRoom: cap - (sellerPay - apy + sent) };
  };
  const n = assets.length;
  for (let i = 0; i < n; i += 1) {
    consider([assets[i]]);
    for (let j = i + 1; j < n; j += 1) {
      consider([assets[i], assets[j]]);
      for (let k = j + 1; k < n; k += 1) {
        consider([assets[i], assets[j], assets[k]]);
        for (let m = k + 1; m < n; m += 1) { consider([assets[i], assets[j], assets[k], assets[m]]); }
      }
    }
  }
  return best;
}

/* Where he stands in a team's room: starting (and over whom, on a team
   he would join), or not. */
function standing(roster, p, joining) {
  const slots = SLOTS[p.pos] || 0;
  const room = byPos(roster.filter((x) => x.id !== p.id), p.pos);
  if (!slots) { return { starts: false, over: null }; }
  if (!joining) { return { starts: byPos(roster, p.pos).indexOf(p) < slots, over: null }; }
  const last = room[slots - 1];
  return { starts: !last || p.ovr > last.ovr, over: last && p.ovr > last.ovr ? last : null };
}

/* Which trades to show: the best by score (shaken up on a refresh, the
   ones `seen` before put back), one a team, and as many with something
   added as without when there are enough of both. */
function choose(found, limit, rng, seen) {
  const avoid = new Set(seen || []);
  found.forEach((t) => { t.rank = t.score + (rng ? rng() * 1.5 : 0) - (avoid.has(t.key) ? 3 : 0); });
  found.sort((a, b) => b.rank - a.rank);
  const half = Math.ceil(limit / 2);
  const teams = new Set();
  const kinds = { plain: 0, extra: 0 };
  const picked = [];
  const take = (t) => { teams.add(t.team); picked.push(t); };
  found.forEach((t) => {
    const kind = t.extras.length ? 'extra' : 'plain';
    if (picked.length >= limit || teams.has(t.team) || kinds[kind] >= half) { return; }
    kinds[kind] += 1;
    take(t);
  });
  found.forEach((t) => { if (picked.length < limit && !teams.has(t.team)) { take(t); } });
  return picked.sort((a, b) => b.rank - a.rank);
}

/* What the seller has to put in with what it sends: its own players and
   picks, `item` left out, each as it values it. */
function ownOf(league, seller, item, slotOf, levels) {
  const same = (a) => (a.kind === 'player' ? item.kind === 'player' && a.player.id === item.player.id
    : item.kind === 'pick' && pickId(a.pick) === pickId(item.pick));
  return assetsOf(league, seller, null).filter((a) => !same(a))
    .map((a) => ({ a, fromSeller: valueOf(league, a, seller, slotOf, levels, true) }));
}

/* Every deal one buyer makes for `item`: alone, then with each of the few
   things of the seller's (`own`) the buyer wants most above what the
   seller does. `price` is what the seller asks for `item`, `worth` what
   it is to the buyer; `pos` the position the buyer gives none at.
   [{ sending, added, gives, gets, pack }] */
function dealsFor(league, buyer, seller, item, price, worth, own, pos, slotOf, levels) {
  const offers = offersOf(league, buyer, seller, pos, slotOf, levels);
  const tries = [[]].concat(own.map((x) => Object.assign({ toBuyer: valueOf(league, x.a, buyer, slotOf, levels, false) }, x))
    .filter((x) => x.toBuyer > 0.3)
    .sort((x, y) => (y.toBuyer - y.fromSeller) - (x.toBuyer - x.fromSeller))
    .slice(0, EXTRAS).map((x) => [x]));
  const out = [];
  tries.forEach((extra) => {
    const sending = [item].concat(extra.map((x) => x.a));
    const gives = price + extra.reduce((sum, x) => sum + x.fromSeller, 0);
    const gets = worth + extra.reduce((sum, x) => sum + x.toBuyer, 0);
    const pack = packageFor(league, buyer, seller, sending, gives, gets, offers);
    if (pack) { out.push({ sending, added: extra.map((x) => x.a), gives, gets, pack }); }
  });
  return out;
}

function idOf(a) { return a.kind === 'player' ? a.player.id : pickId(a.pick); }

/* A deal as the page shows it: what each side gets, each player with his
   stars in the schemes of the team he goes to, and as the trade builder's
   two sides. */
function shown(league, buyer, seller, d) {
  const rec = record(league, buyer.key);
  const fitIn = (i, key) => {
    const f = i.kind === 'player' ? playerFit(league, i.player, key) : null;
    return { text: describeItem(i), fit: f ? { scheme: f.scheme, stars: f.stars } : null };
  };
  const ids = (list, kind) => list.filter((i) => i.kind === kind).map(idOf);
  return {
    key: [buyer.key].concat(d.added.map(idOf)).join(':'),
    team: buyer.key,
    mode: buyer.mode || 'compete',
    record: rec ? recordText(rec) : null,
    room: round1(d.pack.buyerRoom),
    gets: d.pack.items.map(describeItem),
    incoming: d.pack.items.map((i) => fitIn(i, seller)),
    extras: d.added.map((a) => fitIn(a, buyer.key)),
    summary: nick(buyer.key) + ' get ' + d.sending.map(describeItem).join(' and ') + '; ' + nick(seller) + ' get ' +
      d.pack.items.map(describeItem).join(' and ') + '.',
    sides: [{ key: buyer.key, players: ids(d.pack.items, 'player'), picks: ids(d.pack.items, 'pick') },
      { key: seller, players: ids(d.sending, 'player'), picks: ids(d.sending, 'pick') }],
    values: { buyer: { gets: round1(d.gets), gives: round1(d.pack.cost) }, seller: { gets: round1(d.pack.got), gives: round1(d.gives) } }
  };
}

function finish(found, opts, seed) {
  const rng = opts.refresh ? seeded('finder:' + seed + ':' + opts.refresh) : null;
  return choose(found, opts.limit || SHOWN, rng, opts.seen).map((r) => { delete r.score; delete r.rank; return r; });
}

/* Up to `limit` trades for a player, best first:
   { player, team, here, results: [{ key, team, mode, record, fit, starts, over, summary, gets, incoming, extras, sides, room }] }.
   `incoming` is what his team gets, each player with his fit there;
   `extras` what his team puts in with him, each player with his fit on the
   team getting him. `refresh` (1, 2, ...) asks for another set, and `seen`
   is the keys of the trades shown already. */
function findTrades(league, id, opts) {
  opts = opts || {};
  const p = league.byId.get(id);
  check(league, p);
  const seller = p.team;
  const levels = starterLevels(league);
  const slotOf = slotFinder(league);
  const item = { kind: 'player', player: p };
  const price = valueOf(league, item, seller, slotOf, levels, true);
  const here = playerFit(league, p, seller);
  const now = standing(onTeam(league, seller), p, false);
  const found = [];
  const from = league.teams.find((t) => t.key === seller);
  const fromRec = record(league, seller);
  const own = ownOf(league, seller, item, slotOf, levels);
  league.teams.forEach((buyer) => {
    if (buyer.key === seller) { return; }
    if (buyer.mode === 'rebuild' && p.age >= 29) { return; }
    const there = playerFit(league, p, buyer.key);
    const then = standing(onTeam(league, buyer.key), p, true);
    if (now.starts && !then.starts) { return; }
    const rec = record(league, buyer.key);
    const system = there && here ? there.stars - here.stars : 0;
    const status = MODE[buyer.mode || 'compete'] - MODE[from.mode || 'compete'] +
      (rec && fromRec ? 1.5 * (rec.pct - fromRec.pct) : 0);
    const role = then.starts && !now.starts ? 1 : 0;
    const suits = system + status + role;
    if (suits <= 0) { return; }
    const worth = valueOf(league, item, buyer.key, slotOf, levels, false);
    dealsFor(league, buyer.key, seller, item, price, worth, own, p.pos, slotOf, levels).forEach((d) => {
      found.push(Object.assign(shown(league, buyer, seller, d), {
        score: suits + (d.gets - d.pack.cost) / Math.max(1, d.gets),
        fit: there ? { scheme: there.scheme, stars: there.stars } : null,
        starts: then.starts,
        over: then.over ? { name: then.over.name, ovr: then.over.ovr } : null
      }));
    });
  });
  return {
    player: { id: p.id, name: p.name, pos: p.pos, ovr: p.ovr, age: p.age, team: seller },
    team: seller,
    here: here ? { scheme: here.scheme, stars: here.stars } : null,
    starts: now.starts,
    looked: league.teams.length - 1,
    results: finish(found, opts, p.id)
  };
}

/* Up to `limit` trades for a pick ('2026-R1-CAR'), best for the team that
   owns it first: { pick, team, results }, each result as findTrades's,
   with no fit or starting job of its own, and `room` the owner's cap
   space after. */
function findPickTrades(league, id, opts) {
  opts = opts || {};
  const pick = league.picks.find((x) => pickId(x) === id);
  if (!pick) { throw new Error('There is no ' + id + ' pick: that draft has been held.'); }
  checkWindow(league);
  if (locked(league, pick)) { throw new Error('The ' + pickLabel(pick) + ' is in the uploaded ' + pick.year + ' draft.'); }
  const seller = pick.owner;
  const levels = starterLevels(league);
  const slotOf = slotFinder(league);
  const item = { kind: 'pick', pick };
  const price = valueOf(league, item, seller, slotOf, levels, true);
  const own = ownOf(league, seller, item, slotOf, levels);
  const roster = onTeam(league, seller);
  const found = [];
  league.teams.forEach((buyer) => {
    if (buyer.key === seller) { return; }
    const worth = valueOf(league, item, buyer.key, slotOf, levels, false);
    dealsFor(league, buyer.key, seller, item, price, worth, own, null, slotOf, levels).forEach((d) => {
      const starters = d.pack.items.filter((i) => i.kind === 'player' && standing(roster, i.player, true).starts).length;
      found.push(Object.assign(shown(league, buyer, seller, d), {
        score: (d.pack.got - d.gives) / Math.max(1, d.gives) + (d.gets - d.pack.cost) / Math.max(1, d.gets) + 0.5 * starters,
        fit: null,
        starts: false,
        over: null,
        room: round1(d.pack.sellerRoom)
      }));
    });
  });
  return {
    pick: { id, year: pick.year, round: pick.round, from: pick.from, owner: seller, label: pickLabel(pick) },
    team: seller,
    looked: league.teams.length - 1,
    results: finish(found, opts, id)
  };
}

module.exports = { findTrades, findPickTrades };
