/* ==========================================================================
   EGE Football NFL sim — what the six bring to a game from the website
   Two things the six buy on the site change how their games are played:

   - A booster on a game (1.5x, 2.0x, 2.5x). It does not make him play
     twice as well; it makes a good game likelier. The game is played more
     than once and one version is kept: with a 1.5x the better of two for
     him, with a 2.0x the best of three, and with a 2.5x one of his best
     four of twelve, which locks in a solid to great game without handing
     him his best one every time. Whether any of the six gets hurt is
     settled by the first version, so a booster never keeps anybody
     healthy. Wagers are not boosters and change nothing here.
   - A connection: QB Connection with his quarterback (more targets, a
     little more often caught), or a quarterback's O-Line Connection (fewer
     pressures and sacks). It counts only while that quarterback is the
     one playing. What a level is worth snowballs (strength): next to
     nothing at I and II, noticeable from IV, and at VI a Mahomes and
     Kelce connection where the ball keeps finding him. Past VI it still
     grows, by less each time. lib/game.js uses it.

   A booster is read from the season file once its week is out (where the
   admin wrote it), and from Supabase's game_boosters before that; the
   connections from player_inventory. The Supabase rows come through
   io.live(): the admin page reads them before every step.
   ========================================================================== */

'use strict';

const io = require('./io');

const MULTIPLIERS = { 'boost-1-5': 1.5, 'boost-2-0': 2, 'boost-2-5': 2.5 };

/* How many times a boosted game is played, and how many of his best of
   those the kept one is picked from. */
const TRIES = { 1.5: [2, 1], 2: [3, 1], 2.5: [12, 4] };

/* Fantasy points, as data/economy.js scores them, off a box score line. */
function fantasyPoints(line) {
  if (!line) { return 0; }
  return (line.passYds || 0) / 25 + (line.passTd || 0) * 4 - (line.passInt || 0) * 2 +
    (line.rushYds || 0) / 10 + (line.rushTd || 0) * 6 + (line.recYds || 0) / 10 + (line.recTd || 0) * 6 +
    (line.rec || 0) * 0.5 - (line.fumLost || 0) * 2;
}

/* What a connection level is worth, 0 to 1 at VI and a little past it
   after. Each level is worth about 1.7 times the one before. */
function strength(level) {
  const n = Math.max(0, Math.floor(Number(level) || 0));
  if (n <= 6) { return (Math.exp(0.55 * n) - 1) / (Math.exp(0.55 * 6) - 1); }
  return 1 + 0.25 * (1 - Math.pow(0.6, n - 6));
}

/* A quarterback named the same way however it was typed. */
function nameKey(name) { return String(name || '').toLowerCase().replace(/[^a-z]/g, ''); }

/* Which quarterback an inventory row is with: `target`, or the name after
   the dash in an old row's title (EGE.connectionQuarterback). */
function quarterbackOf(row) {
  if (row.target) { return row.target; }
  const parts = String(row.item_name || '').split(' — ');
  return parts.length > 1 ? parts.slice(1).join(' — ') : null;
}

/* Everything the six have on this season's games and with their
   quarterbacks and lines: { boosters: { slug: { week: 1.5 } },
   links: { playerId: [{ qb: name or null for the line, level, s }] } }. */
function read(league) {
  let site = null;
  try { site = io.site(); } catch (err) { site = null; }
  const live = io.live(league.world) || {};
  const slugOf = {};
  const position = {};
  ((site && site.players) || []).forEach((p) => {
    if (p.email) { slugOf[p.email.toLowerCase()] = p.slug; }
    position[p.slug] = p.position;
  });
  const games = site && site.stats && site.stats[league.season] ? site.stats[league.season].games || {} : {};
  const boosters = {};
  Object.keys(games).forEach((slug) => (games[slug] || []).forEach((g) => {
    if (MULTIPLIERS[g.booster]) { (boosters[slug] = boosters[slug] || {})[g.week] = MULTIPLIERS[g.booster]; }
  }));
  (live.boosters || []).forEach((r) => {
    const slug = slugOf[String(r.email || '').toLowerCase()];
    const week = Number(r.week);
    if (!slug || Number(r.season) !== league.season || !MULTIPLIERS[r.item_key]) { return; }
    const written = (games[slug] || []).filter((g) => g.week === week)[0];
    if (written && written.booster) { return; }
    (boosters[slug] = boosters[slug] || {})[week] = MULTIPLIERS[r.item_key];
  });
  const links = {};
  (live.inventory || []).forEach((r) => {
    const slug = slugOf[String(r.email || '').toLowerCase()];
    if (!slug || r.item_key !== 'qb-connection' || r.active === false) { return; }
    const level = typeof r.quantity === 'number' ? r.quantity : 1;
    const qb = position[slug] === 'QB' ? null : quarterbackOf(r);
    if (position[slug] !== 'QB' && !qb) { return; }
    (links['ege:' + slug] = links['ege:' + slug] || []).push({ qb, key: qb ? nameKey(qb) : null, level, s: strength(level) });
  });
  return { boosters, links };
}

/* The boosters on a game, for the six in it who are healthy going in:
   [{ id, slug, name, multiplier }]. */
function onGame(extras, game, rosters) {
  const out = [];
  rosters.forEach((roster) => roster.forEach((p) => {
    if (!p.ege || (p.injury && p.injury.games > 0)) { return; }
    const m = (extras.boosters[p.ege] || {})[game.week];
    if (m) { out.push({ id: p.id, slug: p.ege, name: p.name, multiplier: m }); }
  }));
  return out;
}

/* Which of the six a version of the game hurt. */
function hurtIn(result) {
  return result.injuries.filter((i) => i.ege).map((i) => i.id).sort().join('|');
}

/* Each version's place for these players, 0 (worst) to 1 (best), on their
   fantasy points, averaged over them. */
function places(versions, boosted) {
  const n = versions.length;
  const total = versions.map(() => 0);
  boosted.forEach((b) => {
    const points = versions.map((v) => fantasyPoints(v.box[b.id]));
    points.forEach((x, i) => {
      const below = points.filter((y) => y < x).length;
      const same = points.filter((y) => y === x).length - 1;
      total[i] += n > 1 ? (below + same / 2) / (n - 1) : 1;
    });
  });
  return total.map((t) => t / boosted.length);
}

/* The version of a boosted game that is kept. `first` is the game as
   played; `again()` plays it once more; `rng` picks among the best. */
function choose(first, again, boosted, rng) {
  const top = Math.max.apply(null, boosted.map((b) => b.multiplier));
  const [tries, best] = TRIES[top] || [1, 1];
  const versions = [first];
  const hurt = hurtIn(first);
  for (let i = 1; i < tries; i += 1) {
    const v = again();
    if (hurtIn(v) === hurt) { versions.push(v); }
  }
  const place = places(versions, boosted);
  const order = versions.map((v, i) => i).sort((a, b) => place[b] - place[a] || a - b);
  const band = Math.max(1, Math.round(best * versions.length / tries));
  return versions[order[Math.floor(rng() * band)]];
}

module.exports = { read, onGame, choose, strength, fantasyPoints, nameKey, MULTIPLIERS, TRIES };
