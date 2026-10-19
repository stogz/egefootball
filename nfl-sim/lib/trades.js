/* ==========================================================================
   EGE Football NFL sim — trades, and Sam's approval
   Twice a year (before the draft, and at the deadline after Week 9) every
   team looks at itself. A buyer -- a contender, or a team retooling -- goes
   after its biggest needs: a player on another team who is a clear upgrade
   and fits its schemes. A seller lets him go if it is rebuilding, if he is
   aging and it is retooling, or if he is not starting for it. The buyer
   offers picks and young backups until the seller comes out ahead by its
   own numbers; if the buyer still comes out ahead by its own, the trade is
   proposed. Nothing moves until Sam approves it.

   Proposals live in the world folder's trades.json with their reasoning;
   ones still waiting when their window closes expire. A trade that moves
   one of the six is marked: the website's transfers have to be updated by
   hand for it.
   ========================================================================== */

'use strict';

const { playerValue, pickValue, POSITION } = require('./value');
const { fitOf, schemeFor, offenseOf, defenseOf } = require('./schemes');
const { starterLevels, needAt, onTeam, byPos, room, SLOTS, trim, addPlayers } = require('./rosters');
const { makeName } = require('./draft');
const { readWorld, writeWorld, DEADLINE_WEEK } = require('./season');
const { standings, recordText } = require('./standings');
const { TEAMS } = require('./teams');
const { index } = require('./league');
const { seeded, hash } = require('./rng');

const OFFENSE_POS = ['QB', 'RB', 'WR', 'TE', 'OT', 'IOL'];
const POS_WORD = { QB: 'quarterback', RB: 'running back', FB: 'fullback', WR: 'receiver', TE: 'tight end', OT: 'tackle',
                   IOL: 'guard or center', EDGE: 'pass rusher', DI: 'defensive tackle', LB: 'linebacker', CB: 'corner',
                   S: 'safety', K: 'kicker', P: 'punter' };

function nick(key) { return TEAMS[key] ? TEAMS[key].name.split(' ').slice(-1)[0] : key; }
function ordinal(n) { return n + (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'); }
function pickId(p) { return p.year + '-R' + p.round + '-' + p.from; }
function pickLabel(p) {
  return p.year + ' ' + ordinal(p.round) + '-round pick' + (p.from !== p.owner ? ' (' + nick(p.from) + "'s)" : '');
}

function loadQueue(league) { return readWorld(league, 'trades.json', []); }
function saveQueue(league, queue) { writeWorld(league, 'trades.json', queue); }

/* Where each team's picks are expected to fall: worst-rated team first. */
function slotFinder(league) {
  const order = league.teams.slice().sort((a, b) => (a.rating || 75) - (b.rating || 75)).map((t) => t.key);
  return (key) => order.indexOf(key) + 1;
}

function record(league, key) {
  if (!league.schedule || !league.schedule.some((g) => g.score)) { return null; }
  return standings(league.schedule, league.season).records[key];
}

/* What a team gives up and gets, in its own eyes. */
function valueOf(league, item, teamKey, slotOf, levels, giving) {
  const team = league.teams.find((t) => t.key === teamKey);
  if (item.kind === 'pick') {
    const p = item.pick;
    return pickValue(Object.assign({ thisDraft: league.phase === 'draft' }, p), league.season, slotOf, { mode: team.mode });
  }
  const p = item.player;
  let need = 0;
  let fit = 0;
  if (!giving) {
    need = needAt(league, teamKey, p.pos, levels);
    fit = fitOf(p, schemeFor(team, p.pos));
  } else {
    const rank = byPos(onTeam(league, teamKey), p.pos).indexOf(p);
    need = rank !== -1 && rank < (SLOTS[p.pos] || 0) ? 0.3 : 0;
    fit = fitOf(p, schemeFor(team, p.pos));
  }
  return playerValue(p, league.season, { mode: team.mode, need, fit });
}

function describeItem(item) {
  if (item.kind === 'pick') { return pickLabel(item.pick); }
  const p = item.player;
  return p.name + ' (' + p.pos + ', ' + p.ovr + ', age ' + p.age + ')';
}

/* The assets a buyer can offer: its picks for the next three drafts and
   young players who are not starting for it. */
function assetsOf(league, key) {
  const picks = league.picks.filter((p) => p.owner === key && p.year >= league.season && p.year <= league.season + 2)
    .map((pick) => ({ kind: 'pick', pick }));
  const roster = onTeam(league, key);
  const young = roster.filter((p) => !p.ege && p.age <= 25 && byPos(roster, p.pos).indexOf(p) >= (SLOTS[p.pos] || 0) &&
    p.ovr >= 65).map((player) => ({ kind: 'player', player }));
  return picks.concat(young);
}

/* The cheapest package (one, two or three assets, at most one of them a
   player) the seller takes. */
function findPackage(league, buyer, seller, price, budget, slotOf, levels) {
  const assets = assetsOf(league, buyer).map((a) => ({
    a, toSeller: valueOf(league, a, seller, slotOf, levels, false), fromBuyer: valueOf(league, a, buyer, slotOf, levels, true)
  })).filter((x) => x.toSeller > 0.3).sort((x, y) => x.toSeller - y.toSeller);
  let best = null;
  const consider = (combo) => {
    if (combo.filter((x) => x.a.kind === 'player').length > 1) { return; }
    const got = combo.reduce((s, x) => s + x.toSeller, 0);
    const cost = combo.reduce((s, x) => s + x.fromBuyer, 0);
    if (got < price || cost > budget) { return; }
    if (!best || cost < best.cost) { best = { items: combo.map((x) => x.a), got, cost }; }
  };
  const n = Math.min(assets.length, 14);
  for (let i = 0; i < n; i += 1) {
    consider([assets[i]]);
    for (let j = i + 1; j < n; j += 1) {
      consider([assets[i], assets[j]]);
      for (let k = j + 1; k < n; k += 1) { consider([assets[i], assets[j], assets[k]]); }
    }
  }
  return best;
}

/* Every team looks for help; returns the proposals added to the queue. */
function propose(league, window, rng) {
  const levels = starterLevels(league);
  const slotOf = slotFinder(league);
  const candidates = [];
  league.teams.forEach((buyer) => {
    const rec = record(league, buyer.key);
    if (buyer.mode === 'rebuild') { return; }
    if (window === 'deadline' && rec && rec.pct < 0.45) { return; }
    const roster = onTeam(league, buyer.key);
    const wants = Object.keys(SLOTS).filter((pos) => SLOTS[pos] && pos !== 'K' && pos !== 'P')
      .map((pos) => [pos, needAt(league, buyer.key, pos, levels, roster)])
      .filter(([, n]) => n >= 0.35).sort((a, b) => b[1] * (POSITION[b[0]] || 1) - a[1] * (POSITION[a[0]] || 1)).slice(0, 2);
    wants.forEach(([pos, need]) => {
      const current = byPos(roster, pos)[(SLOTS[pos] || 1) - 1];
      const floor = current ? current.ovr : 60;
      league.teams.forEach((seller) => {
        if (seller.key === buyer.key) { return; }
        const srec = record(league, seller.key);
        const sellerRoster = onTeam(league, seller.key);
        byPos(sellerRoster, pos).forEach((p, rank) => {
          if (p.ovr < floor + 4 || (p.injury && p.injury.games >= 4)) { return; }
          /* The website keeps one team a season for the six, so they only
             move in the offseason. */
          if (p.ege && window === 'deadline') { return; }
          const starter = rank < (SLOTS[pos] || 0);
          const why = seller.mode === 'rebuild' ? 'rebuild' : window === 'deadline' && srec && srec.pct <= 0.4 ? 'losing' :
            seller.mode === 'retool' && p.age >= 28 ? 'aging' : !starter && (seller.mode === 'retool' || rank >= (SLOTS[pos] || 0) + 1) ? 'backup' : null;
          if (!why) { return; }
          const fit = fitOf(p, schemeFor(buyer, pos));
          if (fit < -2) { return; }
          if (p.contract && p.contract.apy > room(league, buyer.key)) { return; }
          const item = { kind: 'player', player: p };
          const worth = valueOf(league, item, buyer.key, slotOf, levels, false);
          const price = valueOf(league, item, seller.key, slotOf, levels, true) * 1.05;
          if (worth < 2 || price > worth * 1.6) { return; }
          const pack = findPackage(league, buyer.key, seller.key, price, worth, slotOf, levels);
          if (!pack) { return; }
          candidates.push({ buyer: buyer.key, seller: seller.key, player: p, pack, need, fit, current, why, srec,
                            gain: (worth - pack.cost) + (pack.got - price / 1.05), worth, price: price / 1.05 });
        });
      });
    });
  });

  candidates.sort((a, b) => b.gain - a.gain + (rng() - 0.5) * 2);
  const limit = window === 'deadline' ? 2 + Math.floor(rng() * 4) : 4 + Math.floor(rng() * 5);
  const used = new Set();
  const buyers = new Set();
  const sellers = {};
  const queue = loadQueue(league);
  const made = [];
  candidates.forEach((c) => {
    if (made.length >= limit || buyers.has(c.buyer) || (sellers[c.seller] || 0) >= 2 || used.has(c.player.id)) { return; }
    if (c.pack.items.some((i) => used.has(i.kind === 'pick' ? pickId(i.pick) : i.player.id))) { return; }
    buyers.add(c.buyer);
    sellers[c.seller] = (sellers[c.seller] || 0) + 1;
    used.add(c.player.id);
    c.pack.items.forEach((i) => used.add(i.kind === 'pick' ? pickId(i.pick) : i.player.id));
    const before = queue.filter((t) => t.season === league.season && t.window === window).length;
    const proposal = build(league, c, window, before + made.length + 1);
    made.push(proposal);
  });
  saveQueue(league, queue.concat(made));
  return made;
}

function build(league, c, window, n) {
  const buyer = league.teams.find((t) => t.key === c.buyer);
  const seller = league.teams.find((t) => t.key === c.seller);
  const p = c.player;
  const scheme = OFFENSE_POS.indexOf(p.pos) !== -1 ? offenseOf(buyer).name + ' offense' : defenseOf(buyer).name + ' defense';
  const items = c.pack.items;
  const ege = !!p.ege || items.some((i) => i.kind === 'player' && i.player.ege);
  const sellerWhy = c.why === 'rebuild' ? nick(seller.key) + ' are rebuilding' :
    c.why === 'losing' ? nick(seller.key) + ' are ' + recordText(c.srec) + ' and selling' :
    c.why === 'aging' ? nick(seller.key) + ' are retooling and move a ' + p.age + '-year-old' :
    nick(seller.key) + ' have him behind their starters';
  const signed = (c.fit >= 0 ? '+' : '') + c.fit.toFixed(1);
  const fitText = c.fit >= 1.5 ? 'fits their ' + scheme + ' well (' + signed + ')' :
    c.fit <= -1.5 ? 'fits their ' + scheme + ' poorly (' + signed + ')' : 'is an ordinary fit for their ' + scheme + ' (' + signed + ')';
  const buyerWhy = nick(buyer.key) + ' need a ' + POS_WORD[p.pos] + ': ' + p.name + ' (' + p.ovr +
    (p.archetype ? ', ' + p.archetype.toLowerCase() : '') + ') would start' +
    (c.current ? ' over ' + c.current.name + ' (' + c.current.ovr + ')' : '') + ' and ' + fitText;
  return {
    id: league.season + '-' + (window === 'deadline' ? 'D' : 'O') + n,
    season: league.season, window, status: 'pending', proposedBy: 'AI', ege,
    teams: [c.buyer, c.seller],
    gives: {
      [c.buyer]: items.map((i) => (i.kind === 'pick' ? { pick: pickId(i.pick) } : { player: i.player.id })),
      [c.seller]: [{ player: p.id }]
    },
    summary: nick(c.buyer) + ' get ' + describeItem({ kind: 'player', player: p }) + '; ' + nick(c.seller) + ' get ' +
      items.map(describeItem).join(' and ') + '.',
    reasons: [sellerWhy + ' and get ' + items.map(describeItem).join(' and ') + '.', buyerWhy + '.',
      'By their own numbers ' + nick(c.buyer) + ' value him at ' + c.worth.toFixed(1) + ' and give ' + c.pack.cost.toFixed(1) +
      '; ' + nick(c.seller) + ' value him at ' + c.price.toFixed(1) + ' and get ' + c.pack.got.toFixed(1) + '.'].concat(
      ege ? ['This moves one of the six: the website\'s transfers would need updating by hand.'] : [],
      c.current && c.current.ege ? [c.current.name + ' would lose his starting spot to him.'] : [])
  };
}

/* Closes a window: anything still waiting in it expires. */
function closeWindow(league, window) {
  const queue = loadQueue(league);
  let n = 0;
  queue.forEach((t) => {
    if (t.status === 'pending' && t.season === league.season && (!window || t.window === window)) {
      t.status = 'expired';
      n += 1;
    }
  });
  saveQueue(league, queue);
  return n;
}

function findPick(league, id) { return league.picks.find((p) => pickId(p) === id); }

/* Applies an approved trade. Returns notes for Sam (one of the six moved,
   or why it could not go through). */
function approve(league, id) {
  const queue = loadQueue(league);
  const t = queue.find((x) => x.id === id);
  if (!t) { throw new Error('No trade ' + id + '.'); }
  if (t.status !== 'pending') { throw new Error('Trade ' + id + ' is ' + t.status + '.'); }
  const [a, b] = t.teams;
  const notes = [];
  /* Everything still where it was when the trade was put together? */
  [a, b].forEach((from) => (t.gives[from] || []).forEach((g) => {
    if (g.player) {
      const p = league.byId.get(g.player);
      if (!p || p.team !== from || p.status !== 'active') { throw new Error((p ? p.name : g.player) + ' is no longer with ' + from + '.'); }
    } else {
      const pick = findPick(league, g.pick);
      if (!pick || pick.owner !== from) { throw new Error('The ' + g.pick + ' pick is no longer ' + from + "'s."); }
    }
  }));
  [[a, b], [b, a]].forEach(([from, to]) => (t.gives[from] || []).forEach((g) => {
    if (g.player) {
      const p = league.byId.get(g.player);
      p.team = to;
      if (p.ege) { notes.push(p.name + ' is now with ' + TEAMS[to].name + ': update his transfers on the website for ' + league.season + '.'); }
    } else {
      findPick(league, g.pick).owner = to;
    }
  }));
  t.status = 'approved';
  t.approvedAt = { season: league.season, phase: league.phase, week: league.week };
  saveQueue(league, queue);
  (league.transactions = league.transactions || []).push({ season: league.season, week: league.week, phase: league.phase,
                                                           kind: 'trade', id: t.id, summary: t.summary });
  index(league);
  /* In season a team that took in more players than it sent releases the
     difference, and one that took in fewer signs free agents. Before the
     draft rosters run to 75 and are cut down later anyway. */
  if (league.phase !== 'draft' && league.phase !== 'offseason') {
    const rng = seeded(hash((league.seed || 'ege-nfl') + ':' + t.id));
    const players = (key) => (t.gives[key] || []).filter((g) => g.player).length;
    [[a, b], [b, a]].forEach(([key, other]) => {
      const net = players(other) - players(key);
      trim(league, key, net, rng).forEach((p) => notes.push(nick(key) + ' release ' + p.name + ' (' + p.pos + ', ' + p.ovr + ').'));
      index(league);
      addPlayers(league, key, -net, rng, makeName).forEach((p) => notes.push(nick(key) + ' sign ' + p.name + ' (' + p.pos + ', ' + p.ovr + ').'));
      index(league);
    });
  }
  return notes.filter(Boolean);
}

function reject(league, id) {
  const queue = loadQueue(league);
  const t = queue.find((x) => x.id === id);
  if (!t) { throw new Error('No trade ' + id + '.'); }
  if (t.status !== 'pending') { throw new Error('Trade ' + id + ' is ' + t.status + '.'); }
  t.status = 'rejected';
  saveQueue(league, queue);
}

/* Sam's own trade, written "DET: Andrew Parr, 2024 R2 / SEA: Kenneth
   Walker". Each team's side is what it gives. It is checked against both
   teams' numbers and queued for approval like any other. */
function proposeOwn(league, text) {
  const sides = text.split('/').map((s) => s.trim()).filter(Boolean);
  if (sides.length !== 2) { throw new Error('Write it as "DET: player, 2025 R2 / SEA: player".'); }
  const parsed = sides.map((s) => {
    const m = /^([A-Z]{2,3})\s*:\s*(.+)$/.exec(s);
    if (!m || !TEAMS[m[1]]) { throw new Error('Start each side with a team key, like "DET:".'); }
    const items = m[2].split(',').map((x) => x.trim()).filter(Boolean).map((x) => {
      const pm = /^(\d{4})\s*R(\d)(?:\s*\(([A-Z]{2,3})\))?$/i.exec(x);
      if (pm) {
        const from = pm[3] ? pm[3].toUpperCase() : m[1];
        const pick = league.picks.find((p) => p.year === Number(pm[1]) && p.round === Number(pm[2]) && p.from === from && p.owner === m[1]);
        if (!pick) { throw new Error(m[1] + ' does not own ' + x + '.'); }
        return { kind: 'pick', pick };
      }
      const mine = league.players.filter((pl) => pl.team === m[1] && pl.status === 'active');
      const want = x.toLowerCase();
      let p = mine.find((pl) => pl.name.toLowerCase() === want);
      if (!p) {
        /* "Kenneth Walker III" for Kenneth Walker, "Walker" when he is the only one. */
        const close = mine.filter((pl) => want.indexOf(pl.name.toLowerCase()) === 0 || pl.name.toLowerCase().indexOf(want) !== -1);
        if (close.length === 1) { p = close[0]; }
      }
      if (!p) { throw new Error('No ' + x + ' on ' + m[1] + '.'); }
      return { kind: 'player', player: p };
    });
    return { key: m[1], items };
  });
  const inSeason = ['regular', 'deadline', 'playoffs'].indexOf(league.phase) !== -1;
  if (inSeason && (league.phase === 'playoffs' || (league.phase === 'regular' && league.week > DEADLINE_WEEK))) {
    throw new Error('The trade deadline has passed. Trades open again in the offseason.');
  }
  if (inSeason && parsed.some((side) => side.items.some((i) => i.kind === 'player' && i.player.ege))) {
    throw new Error('The six can only be traded in the offseason: the website keeps one team a season for them.');
  }
  const levels = starterLevels(league);
  const slotOf = slotFinder(league);
  const [A, B] = parsed;
  const view = (team, gets, gives) => {
    const g = gets.reduce((s, i) => s + valueOf(league, i, team, slotOf, levels, false), 0);
    const c = gives.reduce((s, i) => s + valueOf(league, i, team, slotOf, levels, true), 0);
    return { gets: g, gives: c };
  };
  const va = view(A.key, B.items, A.items);
  const vb = view(B.key, A.items, B.items);
  const verdict = (key, v) => nick(key) + ' value what they get at ' + v.gets.toFixed(1) + ' and what they give at ' +
    v.gives.toFixed(1) + (v.gets >= v.gives ? ': they would take it.' : ': they would want more.');
  const queue = loadQueue(league);
  const ege = A.items.concat(B.items).some((i) => i.kind === 'player' && i.player.ege);
  const t = {
    id: league.season + '-S' + (queue.filter((x) => x.proposedBy === 'Sam').length + 1),
    season: league.season, window: league.phase === 'deadline' ? 'deadline' : 'sam', status: 'pending', proposedBy: 'Sam', ege,
    teams: [A.key, B.key],
    gives: {
      [A.key]: A.items.map((i) => (i.kind === 'pick' ? { pick: pickId(i.pick) } : { player: i.player.id })),
      [B.key]: B.items.map((i) => (i.kind === 'pick' ? { pick: pickId(i.pick) } : { player: i.player.id }))
    },
    summary: nick(A.key) + ' get ' + B.items.map(describeItem).join(' and ') + '; ' + nick(B.key) + ' get ' +
      A.items.map(describeItem).join(' and ') + '.',
    reasons: [verdict(A.key, va), verdict(B.key, vb)].concat(ege ? ['This moves one of the six: the website\'s transfers would need updating by hand.'] : [])
  };
  saveQueue(league, queue.concat([t]));
  return t;
}

module.exports = { propose, closeWindow, approve, reject, proposeOwn, loadQueue, pickId, pickLabel };
