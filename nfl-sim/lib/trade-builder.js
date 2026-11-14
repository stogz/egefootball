/* ==========================================================================
   EGE Football NFL sim — what the admin page's trade builder shows
   Two teams and the deal between them as the NFL Sim tab draws it (Sam,
   2026-11-14): for each team its direction and record, what it needs, its
   cap before and after the deal, and every player and pick it can trade,
   each with what it is worth to the team that has it (what it asks) and to
   the other team (what that team would give). Then, for each team, what it
   gets and gives by its own numbers.

   Values are lib/trades.js valueOf, the numbers every trade is weighed by,
   in points (value.js POINTS_PER_UNIT): the draft chart's, where the first
   pick is 1,000.

   sides: [{ key, players: [id], picks: [pickId] }, { ... }]; a key may be
   blank (no team picked yet). Nothing here changes the league.

   Suggested trades (Sam, 2026-11-14, suggest): with nothing in the deal,
   the best trades the two teams would both take, each built round a
   player one of them wants from the other (lib/trade-finder.js
   packageFor, the finder's rules for what a team gives); with something
   in it, what the team coming out ahead adds so the other takes it too.

   Players on the Market (market): good, older players on losing and
   rebuilding teams, and the teams that would want them most.
   ========================================================================== */

'use strict';

const { valueOf, slotFinder, record, pickId, pickLabel } = require('./trades');
const { onTeam, payroll, starterLevels, needAt, SLOTS } = require('./rosters');
const { capFor, POINTS_PER_UNIT } = require('./value');
const { locked } = require('./draft-plan');
const { recordText } = require('./standings');
const { TEAMS } = require('./teams');
const { offersOf, packageFor, standing, checkWindow } = require('./trade-finder');
const { CURVES } = require('./aging');

const POS_ORDER = ['QB', 'RB', 'FB', 'WR', 'TE', 'OT', 'IOL', 'EDGE', 'DI', 'LB', 'CB', 'S', 'K', 'P'];

function points(v) { return Math.round(v * POINTS_PER_UNIT); }
function round1(v) { return Math.round(v * 10) / 10; }

/* A player as the builder lists him: no potential, durability or rating
   of any team's (the page is an admin's, but it never needs them). */
function playerRow(p) {
  const row = { id: p.id, name: p.name, pos: p.pos, ovr: p.ovr, age: p.age || null, years: null,
                contract: p.contract ? { apy: p.contract.apy, through: p.contract.through } : null };
  if (p.espn) { row.espn = String(p.espn); }
  if (p.collegePhoto) { row.collegePhoto = true; }
  if (p.ege) { row.ege = p.ege; }
  if (p.injury && p.injury.games) { row.out = p.injury.games; }
  return row;
}

/* What a team is short of, worst first: 0 (set) to 1 (a hole) at each
   position it starts somebody (rosters.js needAt), kickers and punters
   left out. */
function needsOf(league, key, levels) {
  const roster = onTeam(league, key);
  return POS_ORDER.filter((pos) => SLOTS[pos] && pos !== 'K' && pos !== 'P')
    .map((pos) => ({ pos, need: Math.round(needAt(league, key, pos, levels, roster) * 100) / 100 }))
    .sort((a, b) => b.need - a.need || POS_ORDER.indexOf(a.pos) - POS_ORDER.indexOf(b.pos));
}

function view(league, sides) {
  const levels = starterLevels(league);
  const slotOf = slotFinder(league);
  const cap = capFor(league.season);
  const keys = sides.map((s) => (s && TEAMS[s.key] ? s.key : ''));
  const both = keys[0] && keys[1] && keys[0] !== keys[1];
  const last = (league.history || []).slice(-1)[0];

  const out = keys.map((key, i) => {
    if (!key) { return null; }
    const side = sides[i];
    const other = both ? keys[1 - i] : null;
    const t = league.teams.find((x) => x.key === key) || {};
    const chosen = new Set(side.players || []);
    const chosenPicks = new Set(side.picks || []);
    const players = onTeam(league, key).map((p) => {
      const item = { kind: 'player', player: p };
      return Object.assign(playerRow(p), {
        /* His season in the league: 1 a rookie, as the Teams pages' box. */
        years: p.entry ? Math.max(1, league.season - p.entry + 1) : null,
        ask: points(valueOf(league, item, key, slotOf, levels, true)),
        worth: other ? points(valueOf(league, item, other, slotOf, levels, false)) : null,
        inDeal: chosen.has(p.id)
      });
    }).sort((a, b) => POS_ORDER.indexOf(a.pos) - POS_ORDER.indexOf(b.pos) || b.ovr - a.ovr || a.name.localeCompare(b.name));
    const picks = league.picks.filter((p) => p.owner === key && !locked(league, p))
      .sort((a, b) => a.year - b.year || a.round - b.round || (a.from === key ? -1 : b.from === key ? 1 : a.from.localeCompare(b.from)))
      .map((p) => {
        const item = { kind: 'pick', pick: p };
        const id = pickId(p);
        return { id, year: p.year, round: p.round, from: p.from, label: pickLabel(p),
                 ask: points(valueOf(league, item, key, slotOf, levels, true)),
                 worth: other ? points(valueOf(league, item, other, slotOf, levels, false)) : null,
                 inDeal: chosenPicks.has(id) };
      });
    const rec = record(league, key);
    return {
      key, mode: t.mode || 'compete', modeSet: Boolean(t.modeSet),
      record: rec ? recordText(rec) : null,
      lastRecord: !rec && last && last.records ? last.records[key] || null : null,
      needs: needsOf(league, key, levels),
      players, picks,
      cap: { cap, payroll: round1(payroll(league, key)) }
    };
  });

  /* The deal itself: each team's money in and out, and what it gets and
     gives by its own numbers. */
  out.forEach((s, i) => {
    if (!s) { return; }
    const o = out[1 - i];
    const sent = s.players.filter((p) => p.inDeal);
    const got = o ? o.players.filter((p) => p.inDeal) : [];
    const pay = (list) => round1(list.reduce((sum, p) => sum + ((p.contract && p.contract.apy) || 0), 0));
    s.cap.out = pay(sent);
    s.cap.in = both ? pay(got) : 0;
    s.cap.after = round1(s.cap.payroll - s.cap.out + s.cap.in);
    s.cap.roomBefore = round1(cap - s.cap.payroll);
    s.cap.roomAfter = round1(cap - s.cap.after);
    s.sends = sent.concat(s.picks.filter((p) => p.inDeal));
    if (both) {
      const gets = o.players.filter((p) => p.inDeal).concat(o.picks.filter((p) => p.inDeal));
      s.gets = gets.reduce((sum, x) => sum + x.worth, 0);
      s.gives = s.sends.reduce((sum, x) => sum + x.ask, 0);
      s.takes = s.gets >= s.gives;
    }
  });

  return { season: league.season, cap, sides: out, ready: Boolean(both && out.some((s) => s.sends.length)) };
}

/* ---------------------------------------------------------- suggested -- */

const IDEAS = 4;
const YOUNG = 26;

function itemsOf(league, side) {
  return (side.players || []).map((id) => ({ kind: 'player', player: league.byId.get(id) })).filter((i) => i.player)
    .concat((side.picks || []).map((id) => ({ kind: 'pick', pick: league.picks.find((p) => pickId(p) === id) })).filter((i) => i.pick));
}

function idOf(a) { return a.kind === 'player' ? a.player.id : pickId(a.pick); }

function sameItem(a, b) { return a.kind === b.kind && idOf(a) === idOf(b); }

/* A suggestion as the builder takes it: both sides in the builder's
   order, and what each team gets and gives by its own numbers, in points. */
function idea(keys, gives, values) {
  return {
    sides: keys.map((key) => ({
      key,
      players: gives[key].filter((i) => i.kind === 'player').map(idOf),
      picks: gives[key].filter((i) => i.kind === 'pick').map(idOf)
    })),
    values: keys.map((key) => ({ gets: points(values[key].gets), gives: points(values[key].gives) }))
  };
}

/* The cheapest package `buyer` gives for `sending`, and the next ones
   without each piece of it: up to `limit` different packages, cheapest to
   the buyer first. */
function packages(league, buyer, seller, sending, price, worth, offers, limit) {
  const best = packageFor(league, buyer, seller, sending, price, worth, offers);
  if (!best) { return []; }
  const found = [best];
  best.items.forEach((item) => {
    const alt = packageFor(league, buyer, seller, sending, price, worth, offers.filter((x) => !sameItem(x.a, item)));
    if (alt && !found.some((f) => f.items.length === alt.items.length && f.items.every((i) => alt.items.some((j) => sameItem(i, j))))) {
      found.push(alt);
    }
  });
  return found.sort((a, b) => a.cost - b.cost).slice(0, limit);
}

/* With nothing in the deal: for each team, the players on the other one it
   would start and values a tenth or more over his price (not one of the
   six: they move only when Sam puts them in), the six it wants most, each
   with the cheapest package the other team takes for him; the best for
   both teams come back. */
function mutual(league, A, B, levels, slotOf) {
  const found = [];
  [[A, B], [B, A]].forEach(([buyer, seller]) => {
    const roster = onTeam(league, buyer);
    const targets = onTeam(league, seller).filter((p) => !p.ege && p.pos !== 'K' && p.pos !== 'P' && !(p.injury && p.injury.games >= 4))
      .map((p) => {
        const item = { kind: 'player', player: p };
        return { item, p, price: valueOf(league, item, seller, slotOf, levels, true), worth: valueOf(league, item, buyer, slotOf, levels, false) };
      })
      .filter((t) => t.worth >= 20 / POINTS_PER_UNIT && t.worth >= t.price * 1.1 && standing(roster, t.p, true).starts)
      .sort((a, b) => (b.worth - b.price) - (a.worth - a.price)).slice(0, 6);
    targets.forEach((t) => {
      const offers = offersOf(league, buyer, seller, t.p.pos, slotOf, levels);
      packages(league, buyer, seller, [t.item], t.price, t.worth, offers, 1).forEach((pack) => {
        found.push({
          score: (t.worth - pack.cost) / Math.max(1, t.worth) + (pack.got - t.price) / Math.max(1, t.price),
          target: t.p.id,
          gives: { [seller]: [t.item], [buyer]: pack.items },
          values: { [buyer]: { gets: t.worth, gives: pack.cost }, [seller]: { gets: pack.got, gives: t.price } }
        });
      });
    });
  });
  found.sort((a, b) => b.score - a.score);
  /* The best, as many each way as there are. */
  const picked = [];
  const ways = {};
  found.forEach((f) => {
    const way = Object.keys(f.gives).find((k) => f.gives[k].some((i) => idOf(i) === f.target));
    if (picked.length < IDEAS && (ways[way] || 0) < Math.ceil(IDEAS / 2)) { ways[way] = (ways[way] || 0) + 1; picked.push(f); }
  });
  found.forEach((f) => { if (picked.length < IDEAS && picked.indexOf(f) === -1) { picked.push(f); } });
  return picked;
}

/* { kind: 'mutual'|'topUp'|'even', adds (the team that adds), close (no
   deal both take: the nearest), ideas: [...] }, or throws when trades are
   closed. */
function suggest(league, sides) {
  checkWindow(league);
  const keys = sides.map((s) => (s && TEAMS[s.key] ? s.key : ''));
  if (!keys[0] || !keys[1] || keys[0] === keys[1]) { throw new Error('Pick two teams first.'); }
  const levels = starterLevels(league);
  const slotOf = slotFinder(league);
  const has = { [keys[0]]: itemsOf(league, sides[0]), [keys[1]]: itemsOf(league, sides[1]) };
  if (!has[keys[0]].length && !has[keys[1]].length) {
    return { kind: 'mutual', ideas: mutual(league, keys[0], keys[1], levels, slotOf).map((f) => idea(keys, f.gives, f.values)) };
  }
  /* Each team's view of the deal as it stands. */
  const v = {};
  keys.forEach((key, i) => {
    const other = keys[1 - i];
    v[key] = { gets: has[other].reduce((s, a) => s + valueOf(league, a, key, slotOf, levels, false), 0),
               gives: has[key].reduce((s, a) => s + valueOf(league, a, key, slotOf, levels, true), 0) };
  });
  const short = keys.filter((k) => v[k].gets < v[k].gives).sort((a, b) => (v[b].gives - v[b].gets) - (v[a].gives - v[a].gets))[0];
  if (!short) { return { kind: 'even', ideas: [] }; }
  /* The other team adds: enough that the short one takes it, no more than
     keeps the deal worth it to itself, and nothing already in it. */
  const adds = keys.find((k) => k !== short);
  const offers = offersOf(league, adds, short, null, slotOf, levels).filter((x) => !has[adds].some((a) => sameItem(a, x.a)));
  /* None it would take itself: the cheapest that the short team takes,
     with the adding team short instead, to see how far apart they are. */
  const room = v[adds].gets - v[adds].gives;
  const price = v[short].gives - v[short].gets;
  /* A team selling (rebuilding, or losing: market) is offered picks and
     players of 26 or younger first. */
  const sells = selling(league).some((x) => x.key === short && x.sells);
  const young = sells ? offers.filter((x) => x.a.kind === 'pick' || (x.a.player.age || 30) <= YOUNG) : [];
  const pools = young.length ? [young, offers] : [offers];
  let found = [];
  pools.some((pool) => {
    found = room > 0 ? packages(league, adds, short, has[short], price, room, pool, 3) : [];
    return found.length;
  });
  const close = !found.length;
  if (close) { pools.some((pool) => { found = packages(league, adds, short, has[short], price, Infinity, pool, 3); return found.length; }); }
  const ideas = found.map((pack) => {
    const gives = { [short]: has[short], [adds]: has[adds].concat(pack.items) };
    const values = { [short]: { gets: v[short].gets + pack.got, gives: v[short].gives },
                     [adds]: { gets: v[adds].gets, gives: v[adds].gives + pack.cost } };
    return idea(keys, gives, values);
  });
  return { kind: 'topUp', adds, close, ideas };
}

/* ------------------------------------------------- on the market -- */

/* Players on the Market (Sam, 2026-11-14): the good, older players a
   losing team could trade for younger players and picks. A seller is a
   rebuilding team, or one losing (.400 or worse once it has played four
   games; in the offseason, last season's record). Its players of 80 or
   more who start for it and are at or past their position's peak
   (aging.js CURVES: a back from 26, a quarterback from 33), not one of the
   six, a kicker or a punter or anyone out four weeks or more. Each comes
   with the teams that would want him most: not sellers themselves or
   rebuilding, he would start for them, he is worth a tenth over his price
   to them, and they have a package his team takes that keeps both under
   the cap (trade-finder.js packageFor). Only players somebody can get are
   listed, most wanted first; with `limit`, the first that many, and
   `more` when there may be others. */
const MARKET_OVR = 80;
const BUYERS = 3;

function pctOf(text) {
  const m = /^(\d+)-(\d+)(?:-(\d+))?$/.exec(String(text || ''));
  if (!m) { return null; }
  const w = +m[1];
  const l = +m[2];
  const t = +(m[3] || 0);
  const games = w + l + t;
  return games ? { pct: (w + t / 2) / games, games } : null;
}

/* Every team with its record (or last season's) and whether it sells. */
function selling(league) {
  const last = (league.history || []).slice(-1)[0];
  const played = league.schedule && league.schedule.some((g) => g.score);
  return league.teams.map((t) => {
    const rec = played ? record(league, t.key) : null;
    const lastRecord = !rec && last && last.records ? last.records[t.key] || null : null;
    const now = rec ? { pct: rec.pct, games: rec.w + rec.l + (rec.t || 0) } : pctOf(lastRecord);
    const losing = Boolean(now && now.games >= 4 && now.pct <= 0.4);
    return { t, key: t.key, mode: t.mode || 'compete', record: rec ? recordText(rec) : null, lastRecord,
             lastSeason: lastRecord ? last.season : null, sells: t.mode === 'rebuild' || losing };
  });
}

function market(league, limit) {
  const levels = starterLevels(league);
  const slotOf = slotFinder(league);
  const teams = selling(league);
  const buyers = teams.filter((x) => !x.sells && x.mode !== 'rebuild');
  const rosters = new Map(league.teams.map((t) => [t.key, onTeam(league, t.key)]));
  /* Everyone who fits, with the teams that would want him, most wanted
     first. */
  const fits = [];
  teams.filter((x) => x.sells).forEach((seller) => {
    const roster = rosters.get(seller.key);
    roster.forEach((p) => {
      const curve = CURVES[p.pos];
      if (p.ege || p.pos === 'K' || p.pos === 'P' || !curve || p.ovr < MARKET_OVR || (p.age || 0) < curve.peak) { return; }
      if (p.injury && p.injury.games >= 4) { return; }
      if (!standing(roster, p, false).starts) { return; }
      const item = { kind: 'player', player: p };
      const price = valueOf(league, item, seller.key, slotOf, levels, true);
      const wants = buyers.map((b) => {
        if (!standing(rosters.get(b.key), p, true).starts) { return null; }
        const worth = valueOf(league, item, b.key, slotOf, levels, false);
        return worth >= 20 / POINTS_PER_UNIT && worth >= price * 1.1 ? { key: b.key, worth, mode: b.mode } : null;
      }).filter(Boolean).sort((a, b) => b.worth - a.worth);
      if (wants.length) { fits.push({ p, item, seller, price, wants }); }
    });
  });
  fits.sort((a, b) => b.wants[0].worth - a.wants[0].worth || b.p.ovr - a.p.ovr);
  /* Then, down the list until `limit` are found, only the teams that can
     make the deal: a package his team takes, under the cap
     (trade-finder.js packageFor, which leaves out players at his
     position itself). */
  const offers = new Map();
  const players = [];
  let looked = 0;
  for (; looked < fits.length && !(limit && players.length >= limit); looked += 1) {
    const { p, item, seller, price, wants } = fits[looked];
    const can = [];
    wants.some((b) => {
      const key = b.key + '|' + seller.key;
      if (!offers.has(key)) { offers.set(key, offersOf(league, b.key, seller.key, null, slotOf, levels)); }
      if (packageFor(league, b.key, seller.key, [item], price, b.worth, offers.get(key), true)) {
        can.push({ key: b.key, worth: points(b.worth), mode: b.mode });
      }
      return can.length >= BUYERS;
    });
    if (!can.length) { continue; }
    players.push(Object.assign(playerRow(p), {
      years: p.entry ? Math.max(1, league.season - p.entry + 1) : null,
      team: seller.key, mode: seller.mode, record: seller.record, lastRecord: seller.lastRecord, lastSeason: seller.lastSeason,
      ask: points(price), buyers: can
    }));
  }
  players.sort((a, b) => b.buyers[0].worth - a.buyers[0].worth || b.ovr - a.ovr);
  return { season: league.season, sellers: teams.filter((x) => x.sells).map((x) => x.key), players, more: looked < fits.length };
}

module.exports = { view, suggest, market, points, POS_ORDER };
