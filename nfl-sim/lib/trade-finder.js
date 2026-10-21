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
   cap. The best of those come back as trades in the trade builder's two
   sides, ready to make or propose.
   ========================================================================== */

'use strict';

const { valueOf, slotFinder, record, describeItem, pickId } = require('./trades');
const { playerFit } = require('./fit');
const { starterLevels, onTeam, byPos, payroll, SLOTS } = require('./rosters');
const { capFor } = require('./value');
const { locked } = require('./draft-plan');
const { DEADLINE_WEEK } = require('./season');
const { recordText } = require('./standings');
const { TEAMS } = require('./teams');

const IN_SEASON = ['regular', 'deadline', 'playoffs'];
const SHOWN = 6;
/* How much a team's status is worth to a player, in stars. */
const MODE = { compete: 1, retool: 0.5, rebuild: 0 };

function nick(key) { return TEAMS[key] ? TEAMS[key].name.split(' ').slice(-1)[0] : key; }

function round1(v) { return Math.round(v * 10) / 10; }

/* Whether trades can be made now, and of him. */
function check(league, p) {
  if (!p || p.status !== 'active' || !TEAMS[p.team]) { throw new Error((p ? p.name : 'He') + ' is not on a team.'); }
  if (league.phase === 'playoffs' || (league.phase === 'regular' && league.week > DEADLINE_WEEK)) {
    throw new Error('The trade deadline has passed. Trades open again in the offseason.');
  }
  if (p.ege && IN_SEASON.indexOf(league.phase) !== -1) {
    throw new Error('The six can only be traded in the offseason: the website keeps one team a season for them.');
  }
}

/* What a team can give for him: its picks for the next three drafts (not
   one an uploaded draft covers) and its players of 62 or better, starters
   too, but none at his own position, no kicker or punter, never its
   quarterback or a starter of 85 or more, and never one of the six. */
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

/* The cheapest package, by the buyer's own numbers, the seller takes for
   him: one to four assets, at most two of them players, with both teams
   under the cap afterwards (or no further over it than they were). */
function packageFor(league, buyer, seller, p, price, worth, slotOf, levels) {
  const cap = capFor(league.season);
  const apy = (p.contract && p.contract.apy) || 0;
  const buyerPay = payroll(league, buyer);
  const sellerPay = payroll(league, seller);
  /* The dozen cheapest and the dozen dearest: the cheap ones for a backup,
     the dear ones for a star. */
  const all = assetsOf(league, buyer, p.pos).map((a) => ({
    a, toSeller: valueOf(league, a, seller, slotOf, levels, false), fromBuyer: valueOf(league, a, buyer, slotOf, levels, true),
    player: a.kind === 'player' ? 1 : 0, pay: a.kind === 'player' && a.player.contract ? a.player.contract.apy || 0 : 0
  })).filter((x) => x.toSeller > 0.3).sort((x, y) => x.toSeller - y.toSeller);
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
    best = { items: combo.map((x) => x.a), got, cost, buyerRoom: cap - (buyerPay + apy - sent) };
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

/* Up to `limit` trades for a player, best first:
   { player, here, results: [{ team, mode, record, fit, starts, over, summary, gets, sides, room }] }. */
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
    const pack = packageFor(league, buyer.key, seller, p, price, worth, slotOf, levels);
    if (!pack) { return; }
    const score = suits + (worth - pack.cost) / Math.max(1, worth);
    const players = pack.items.filter((i) => i.kind === 'player').map((i) => i.player.id);
    const picks = pack.items.filter((i) => i.kind === 'pick').map((i) => pickId(i.pick));
    found.push({
      score,
      team: buyer.key,
      mode: buyer.mode || 'compete',
      record: rec ? recordText(rec) : null,
      fit: there ? { scheme: there.scheme, stars: there.stars } : null,
      starts: then.starts,
      over: then.over ? { name: then.over.name, ovr: then.over.ovr } : null,
      room: round1(pack.buyerRoom),
      gets: pack.items.map(describeItem),
      summary: nick(buyer.key) + ' get ' + describeItem(item) + '; ' + nick(seller) + ' get ' + pack.items.map(describeItem).join(' and ') + '.',
      sides: [{ key: buyer.key, players, picks }, { key: seller, players: [p.id], picks: [] }],
      values: { buyer: { gets: round1(worth), gives: round1(pack.cost) }, seller: { gets: round1(pack.got), gives: round1(price) } }
    });
  });
  found.sort((a, b) => b.score - a.score);
  return {
    player: { id: p.id, name: p.name, pos: p.pos, ovr: p.ovr, age: p.age, team: seller },
    here: here ? { scheme: here.scheme, stars: here.stars } : null,
    starts: now.starts,
    looked: league.teams.length - 1,
    results: found.slice(0, opts.limit || SHOWN).map((r) => { delete r.score; return r; })
  };
}

module.exports = { findTrades };
