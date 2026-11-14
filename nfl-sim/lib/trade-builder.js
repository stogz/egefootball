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
   ========================================================================== */

'use strict';

const { valueOf, slotFinder, record, pickId, pickLabel } = require('./trades');
const { onTeam, payroll, starterLevels, needAt, SLOTS } = require('./rosters');
const { capFor, POINTS_PER_UNIT } = require('./value');
const { locked } = require('./draft-plan');
const { recordText } = require('./standings');
const { TEAMS } = require('./teams');

const POS_ORDER = ['QB', 'RB', 'FB', 'WR', 'TE', 'OT', 'IOL', 'EDGE', 'DI', 'LB', 'CB', 'S', 'K', 'P'];

function points(v) { return Math.round(v * POINTS_PER_UNIT); }
function round1(v) { return Math.round(v * 10) / 10; }

/* A player as the builder lists him: no potential, durability or rating
   of any team's (the page is an admin's, but it never needs them). */
function playerRow(p) {
  const row = { id: p.id, name: p.name, pos: p.pos, ovr: p.ovr, age: p.age || null,
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

module.exports = { view, points, POS_ORDER };
