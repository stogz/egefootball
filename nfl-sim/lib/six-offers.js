/* ==========================================================================
   EGE Football NFL sim — the six in free agency
   None of the six signs anywhere on his own (Sam, 2026-10-30). When one's
   contract runs out, or he is cut between seasons, he is a free agent, and
   every team that wants him makes him an offer -- his own team too. The
   offers are kept in league.egeOffers until Sam picks one on the NFL Sim
   tab (or with `sim.js accept`), and the draft waits until each of them
   has signed.

   A team makes an offer when he would start for it, or when it needs his
   position badly enough, and it has the room to pay him. What it offers is
   what the market pays his overall (lib/value.js), more the more it wants
   him and the more it is out to win now, for as long as a player his age
   gets; his own team always offers. While the offers stand, every team
   that made one keeps the money back and his place in its room through
   free agency (offseason.js), so whichever he takes, the team can still
   pay him and has a spot for him; the rest fill their rooms in the draft
   and the free agency after it.
   ========================================================================== */

'use strict';

const { onTeam, room, byPos, needAt, starterLevels, SLOTS, PREMIUM } = require('./rosters');
const { marketPay, capFor, POSITION } = require('./value');
const { fitOf, schemeFor } = require('./schemes');
const { playerFit } = require('./fit');
const { index } = require('./league');
const { seeded } = require('./rng');
const { TEAMS } = require('./teams');
const sixTrades = require('./six-trades');

/* How much a team has to want him to make an offer. */
const WANTS = 0.75;
/* What a team keeps back for its draft class before the draft. */
const DRAFT_RESERVE = 0.05;
const IN_SEASON = ['regular', 'deadline', 'playoffs'];

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function round1(v) { return Math.round(v * 10) / 10; }

/* The first season a deal signed now pays for: the next one once the
   Super Bowl is played, this one from the draft on. */
function firstSeason(league) { return league.phase === 'offseason' ? league.season + 1 : league.season; }

/* What a team stretches its cap by to keep one of its own: restructured
   deals and the like, as re-signing does for a star (rosters.js). */
const STRETCH = 0.08;

function yearsFor(age, rng, mode) {
  const base = age <= 25 ? 4 : age <= 28 ? 3 : age <= 31 ? 2 : 1;
  const longer = mode === 'rebuild' && age <= 27 ? 1 : 0;
  return clamp(base + longer + (rng() < 0.35 ? 1 : 0) - (rng() < 0.3 ? 1 : 0), 1, 5);
}

/* Where he would stand on a team: starting (over whom, if anybody), or
   behind whom. */
function standing(league, p, key) {
  const at = byPos(onTeam(league, key).filter((x) => x !== p), p.pos);
  const slots = SLOTS[p.pos] || 1;
  if (at.length < slots) { return { starts: true, over: null, behind: null }; }
  const weakest = at[slots - 1];
  if (p.ovr > weakest.ovr) { return { starts: true, over: { name: weakest.name, ovr: weakest.ovr }, behind: null }; }
  return { starts: false, over: null, behind: { name: weakest.name, ovr: weakest.ovr } };
}

/* Money a team has offered the six, other than `slug`. */
function setAside(league, but) {
  const out = {};
  Object.keys(league.egeOffers || {}).forEach((slug) => {
    if (slug === but) { return; }
    league.egeOffers[slug].offers.forEach((o) => { out[o.team] = (out[o.team] || 0) + o.apy; });
  });
  return out;
}

/* Every team's offer for one of the six who is a free agent, kept in
   league.egeOffers, his own team's included. `season` is the first one the
   deals pay for (the offseason's own, while it is run). */
function makeOffers(league, p, season) {
  season = season || firstSeason(league);
  const rng = seeded((league.seed || 'ege-nfl') + (league.take ? ':take' + league.take : '') + ':offers:' + season + ':' + p.ege);
  const levels = starterLevels(league);
  const ask = marketPay(p, season);
  const from = p.lastTeam && TEAMS[p.lastTeam] ? p.lastTeam : null;
  const others = setAside(league, p.ege);
  const reserve = IN_SEASON.indexOf(league.phase) === -1 ? DRAFT_RESERVE * capFor(season) : 0;
  const offers = [];
  let keenest = null;
  league.teams.forEach((t) => {
    const own = t.key === from;
    const roster = onTeam(league, t.key).filter((x) => x !== p);
    const where = standing(league, p, t.key);
    const need = needAt(league, t.key, p.pos, levels, roster);
    const fit = fitOf(p, schemeFor(t, p.pos));
    let want = need * (POSITION[p.pos] || 0.8) + (where.starts ? 0.4 : -0.3) + 0.05 * clamp(fit, -4, 4) + rng() * 0.35;
    if (own) { want += 0.3; }
    if (t.mode === 'compete' && where.starts) { want += 0.15; }
    if (t.mode === 'rebuild' && p.age >= 29) { want -= 0.5; }
    const keen = clamp((want - WANTS) / 0.8, 0, 1);
    let apy = ask * (0.9 + 0.25 * keen) * (PREMIUM[t.mode] || 1) * (0.97 + rng() * 0.06);
    const years = yearsFor(p.age || 26, rng, t.mode);
    const space = room(league, t.key) - (others[t.key] || 0) - reserve;
    const offer = () => ({ team: t.key, own, years, apy: round1(apy), through: season + years - 1 });
    if (!keenest || want > keenest.want) { keenest = { want, offer: offer() }; }
    if (!own && want < WANTS) { return; }
    if (own) {
      /* His own team makes room for him, up to a point. */
      apy = Math.min(apy, Math.max(space + STRETCH * capFor(season), ask));
    } else if (apy > space) {
      /* All it has, if that is close enough to what he is worth. */
      if (space < ask * 0.85) { return; }
      apy = space;
    }
    offers.push(offer());
  });
  /* Somebody always wants him: with no offer at all (no team of his own,
     nobody with the room), the team keenest on him makes one. */
  if (!offers.length && keenest) { offers.push(keenest.offer); }
  offers.sort((a, b) => b.apy - a.apy || b.years - a.years);
  league.egeOffers = league.egeOffers || {};
  league.egeOffers[p.ege] = { season, from, offers };
  return league.egeOffers[p.ege];
}

function freeSix(league) {
  return league.players.filter((p) => p.ege && p.status === 'fa');
}

/* Fresh offers for every one of the six who is a free agent: the
   offseason's, once the expiring deals are done (the league is in the new
   season by then). Returns who has how many. */
function offerAll(league) {
  delete league.egeOffers;
  return freeSix(league).map((p) => ({ slug: p.ege, name: p.name, from: p.lastTeam || null,
                                        offers: makeOffers(league, p, league.season).offers.length }));
}

/* Offers for any of the six who is a free agent and has none for the
   season (one cut, one not drafted), and none kept for anybody who has
   signed since. */
function fill(league) {
  const free = new Set();
  freeSix(league).forEach((p) => {
    free.add(p.ege);
    const had = (league.egeOffers || {})[p.ege];
    if (!had || had.season !== firstSeason(league)) { makeOffers(league, p); }
  });
  Object.keys(league.egeOffers || {}).forEach((slug) => { if (!free.has(slug)) { drop(league, slug); } });
}

function drop(league, slug) {
  if (!league.egeOffers) { return; }
  delete league.egeOffers[slug];
  if (!Object.keys(league.egeOffers).length) { delete league.egeOffers; }
}

/* Money set aside at each team for the six's offers, and the six each
   team counts in its rooms, for free agency. */
function holds(league) {
  const places = {};
  freeSix(league).forEach((p) => {
    ((league.egeOffers || {})[p.ege] || { offers: [] }).offers.forEach((o) => {
      (places[o.team] = places[o.team] || []).push(p);
    });
  });
  return { setAside: setAside(league), places };
}

/* The six waiting on Sam, with every offer as the page shows it: the
   terms, and where he would stand there now, how he fits its scheme, what
   kind of team it is and how it did last season. */
function waiting(league) {
  const last = (league.history || []).slice(-1)[0];
  return freeSix(league).map((p) => {
    const had = (league.egeOffers || {})[p.ege] || { offers: [], from: p.lastTeam || null };
    return {
      slug: p.ege, id: p.id, name: p.name, pos: p.pos, ovr: p.ovr, age: p.age, archetype: p.archetype || null,
      from: had.from, ask: marketPay(p, firstSeason(league)),
      offers: had.offers.map((o) => {
        const t = league.teams.find((x) => x.key === o.team);
        const fit = playerFit(league, p, o.team);
        return Object.assign({}, o, {
          total: round1(o.apy * o.years),
          role: standing(league, p, o.team),
          fit: fit ? { scheme: fit.scheme, stars: fit.stars } : null,
          mode: (t && t.mode) || 'retool',
          record: last && last.records ? last.records[o.team] || null : null,
          recordSeason: last ? last.season : null,
          room: round1(room(league, o.team) - o.apy)
        });
      })
    };
  });
}

/* The names of the six still to sign, for the draft to wait on. */
function unsigned(league) { return freeSix(league).map((p) => p.name); }

/* He takes `key`'s offer: on its deal from the season it starts, and on
   the site from that season's Week 1 if it is a new team (six-trades.js). */
function accept(league, slug, key) {
  const p = league.byId.get('ege:' + slug);
  if (!p || p.status !== 'fa') { throw new Error((p ? p.name : slug) + ' is not a free agent.'); }
  const had = (league.egeOffers || {})[slug];
  const offer = had && had.offers.find((o) => o.team === key);
  if (!offer) { throw new Error((TEAMS[key] ? 'The ' + TEAMS[key].name + ' have' : 'Nobody has') + ' made ' + p.name + ' an offer.'); }
  const from = had.from;
  p.team = key;
  p.status = 'active';
  p.contract = { through: offer.through, apy: offer.apy };
  delete p.faSince;
  const moved = sixTrades.record(league, p, from, key);
  drop(league, slug);
  index(league);
  const summary = p.name + (key === from ? ' re-signs with the ' : ' signs with the ') + TEAMS[key].name + ': ' + offer.years +
    (offer.years === 1 ? ' year' : ' years') + ', $' + offer.apy + 'M a year.';
  (league.transactions = league.transactions || []).push({ season: league.season, week: league.week, phase: league.phase,
                                                           kind: 'signing', id: p.id, summary });
  return { name: p.name, pos: p.pos, team: key, from, years: offer.years, contract: Object.assign({}, p.contract), moved, summary };
}

module.exports = { makeOffers, offerAll, fill, drop, holds, waiting, unsigned, accept, firstSeason };
