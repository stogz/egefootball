/* ==========================================================================
   EGE Football NFL sim — a week as it was played (an admin's)
   What one week of the sim produced, read from the season's game log
   (games-YEAR.json): every game's score, its leaders, scoring plays and
   injuries, and for games played since 2026-10-21 both teams' numbers and
   the box score too; and the six's lines, the way they played them. The
   NFL Sim tab's week stats and `node nfl-sim/sim.js games` read it. Weeks
   taken in from the site have no box scores and are left out.
   ========================================================================== */

'use strict';

const io = require('./io');
const { fantasyPoints } = require('./boosts');

function logOf(league, season) {
  const name = 'games-' + season + '.json';
  return io.has(league.world, name) ? io.read(league.world, name) : [];
}

/* Every week the sim played itself, newest first: { season, week, label }. */
function played(league) {
  const out = [];
  for (let season = league.season; season >= 2023; season -= 1) {
    const seen = {};
    logOf(league, season).filter((g) => g.season === season && !g.imported && g.score).forEach((g) => {
      if (!seen[g.week]) { seen[g.week] = { season, week: g.week, label: g.round || 'Week ' + g.week }; }
    });
    Object.keys(seen).map(Number).sort((a, b) => b - a).forEach((w) => out.push(seen[w]));
  }
  return out;
}

/* A stat line in words: "21/30, 254 yds, 2 TD, 1 INT · 6 car, 41 yds". */
function lineText(l) {
  if (!l) { return ''; }
  const bits = [];
  const td = (n, what) => (n ? ', ' + n + ' ' + what : '');
  if (l.passAtt) { bits.push((l.passCmp || 0) + '/' + l.passAtt + ', ' + (l.passYds || 0) + ' yds' + td(l.passTd, 'TD') + td(l.passInt, 'INT')); }
  if (l.rushAtt) { bits.push(l.rushAtt + ' car, ' + (l.rushYds || 0) + ' yds' + td(l.rushTd, 'TD')); }
  if (l.targets || l.rec) { bits.push((l.rec || 0) + ' rec, ' + (l.recYds || 0) + ' yds' + td(l.recTd, 'TD') + ' (' + (l.targets || 0) + ' tgt)'); }
  if (l.fumLost) { bits.push(l.fumLost + ' fum'); }
  return bits.join(' · ');
}

/* One week: { season, week, label, six: [...], games: [...] }, the six in
   the site's order. */
function week(league, season, n) {
  const games = logOf(league, season).filter((g) => g.season === season && g.week === n && !g.imported && g.score);
  let order = [];
  try { order = io.site().players.map((p) => p.slug); } catch (err) { order = []; }
  const names = {};
  league.players.forEach((p) => { if (p.ege) { names[p.ege] = p.name; } });
  const six = [];
  games.forEach((g) => Object.keys(g.six || {}).forEach((slug) => {
    const e = g.six[slug];
    const home = e.team === g.home;
    const ours = g.score[home ? 0 : 1];
    const theirs = g.score[home ? 1 : 0];
    six.push({
      slug, name: names[slug] || slug, team: e.team, opponent: home ? g.away : g.home, home, neutral: Boolean(g.neutral),
      result: (ours > theirs ? 'W' : ours < theirs ? 'L' : 'T') + ' ' + ours + '-' + theirs + (g.ot ? ' (OT)' : ''),
      line: e.line || null, text: lineText(e.line), points: e.line ? Math.round(fantasyPoints(e.line) * 10) / 10 : null,
      out: e.out || null, hurt: e.hurt || null, booster: e.booster || null
    });
  }));
  six.sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug));
  return {
    season, week: n, label: games.length && games[0].round ? games[0].round : 'Week ' + n,
    six,
    games: games.map((g) => ({
      home: g.home, away: g.away, score: g.score, ot: Boolean(g.ot), neutral: Boolean(g.neutral),
      passing: g.passing || [], rushing: g.rushing || [], receiving: g.receiving || [],
      scoring: g.scoring || [], injuries: g.injuries || [], teams: g.teams || null, box: g.box || null
    }))
  };
}

module.exports = { played, week, lineText };
