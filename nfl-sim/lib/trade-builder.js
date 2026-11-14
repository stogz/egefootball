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
   ========================================================================== */

'use strict';

const { valueOf, slotFinder, record, pickId, pickLabel } = require('./trades');
const { onTeam, payroll, starterLevels, needAt, SLOTS } = require('./rosters');
const { capFor, POINTS_PER_UNIT } = require('./value');
const { locked } = require('./draft-plan');
const { recordText } = require('./standings');
const { TEAMS } = require('./teams');
const { offersOf, packageFor, standing, checkWindow } = require('./trade-finder');

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
  let found = room > 0 ? packages(league, adds, short, has[short], price, room, offers, 3) : [];
  const close = !found.length;
  if (close) { found = packages(league, adds, short, has[short], price, Infinity, offers, 3); }
  const ideas = found.map((pack) => {
    const gives = { [short]: has[short], [adds]: has[adds].concat(pack.items) };
    const values = { [short]: { gets: v[short].gets + pack.got, gives: v[short].gives },
                     [adds]: { gets: v[adds].gets, gives: v[adds].gives + pack.cost } };
    return idea(keys, gives, values);
  });
  return { kind: 'topUp', adds, close, ideas };
}

module.exports = { view, suggest, points, POS_ORDER };
