/* ==========================================================================
   EGE Football NFL sim — sizing up a game
   Before a game: each side's offense against the other's defense, unit by
   unit, the one-on-one matchups that matter most, and what a thousand
   simulated games say about who wins and by how much.
   ========================================================================== */

'use strict';

const { gameDay, skill } = require('./lineup');
const { prepare, playGame } = require('./game');
const { seeded } = require('./rng');
const { TEAMS } = require('./teams');

function nickname(key) {
  const name = (TEAMS[key] && TEAMS[key].name) || key;
  return name.split(' ').slice(-1)[0];
}

function edgeText(diff) {
  const a = Math.abs(diff);
  if (a < 2) { return 'even'; }
  if (a < 5) { return 'slight edge'; }
  if (a < 9) { return 'clear edge'; }
  return 'big edge';
}

function sideOf(league, key) {
  return { team: league.teams.find((t) => t.key === key), roster: league.byTeam.get(key) };
}

/* One offense against one defense, unit by unit. */
function units(off, def, O, D) {
  const o = nickname(off.key);
  const d = nickname(def.key);
  const wrCatch = (O.wrs[0] && O.targets[0].catch.mid + O.targets[1].catch.mid + O.targets[2].catch.mid) / 3;
  const cbCover = (skill(D.cb[0], 'man') + skill(D.cb[0], 'zone') + skill(D.cb[1], 'man') + skill(D.cb[1], 'zone') +
                   skill(D.cb[2], 'man') + skill(D.cb[2], 'zone')) / 6;
  const back = O.rbs[0];
  const runner = (skill(back, 'vision') + skill(back, 'power') + skill(back, 'elusive') + skill(back, 'speed')) / 4;
  const rows = [
    [d + ' pass rush', D.passRush, o + ' protection', O.passBlock],
    [o + ' receivers', wrCatch, d + ' corners', cbCover],
    [o + ' deep passing', O.deepThreat, d + ' safeties', D.range],
    [o + ' tight end and backs underneath', (O.targets[3].catch.short + O.targets.filter((t) => t.slot === 'rb')[0].catch.short) / 2,
      d + ' linebackers in coverage', D.lbCover],
    [o + ' run game', (O.runBlockInside + O.runBlockOutside) / 2 * 0.6 + runner * 0.4, d + ' run defense', (D.runDefInside + D.runDefOutside) / 2]
  ];
  return rows.map(([a, av, b, bv]) => {
    const diff = av - bv;
    return { offense: a, offenseValue: Math.round(av), defense: b, defenseValue: Math.round(bv),
             diff: Math.round(diff), text: a + ' ' + Math.round(av) + ' against ' + b + ' ' + Math.round(bv) + ': ' +
             (Math.abs(diff) < 2 ? 'even' : edgeText(diff) + ' ' + (diff > 0 ? a.split(' ')[0] : b.split(' ')[0])) };
  });
}

/* The one-on-ones: each team's top receivers against the corners who will
   see them, and its quarterback against the other's rush. */
function duels(off, O, D) {
  const out = [];
  for (let i = 0; i < 2; i += 1) {
    const wr = O.wrs[i];
    const cb = D.cb[i];
    if (!wr || !cb || wr.standIn || cb.standIn) { continue; }
    out.push(wr.name + ' (' + wr.ovr + ') against ' + cb.name + ' (' + cb.ovr + ')');
  }
  const rusher = D.edge.slice().sort((a, b) => skill(b, 'rush') - skill(a, 'rush'))[0];
  if (rusher && !rusher.standIn) {
    out.push(O.qb.name + ' (' + O.qb.ovr + ') against ' + rusher.name + "'s rush (" + Math.round(skill(rusher, 'rush')) + ')');
  }
  return out;
}

/* The full assessment of `away` at `home` (or at a neutral site). */
function assess(league, home, away, opts) {
  opts = opts || {};
  const games = opts.games || 1000;
  const H = sideOf(league, home);
  const A = sideOf(league, away);
  const hd = prepare(gameDay(H.team, H.roster));
  const ad = prepare(gameDay(A.team, A.roster));
  const rng = seeded(opts.seed || ('assess:' + home + ':' + away));
  let homeWins = 0;
  let ties = 0;
  let hp = 0;
  let ap = 0;
  const margins = [];
  for (let i = 0; i < games; i += 1) {
    const g = playGame(H, A, rng, { neutral: !!opts.neutral, noInjuries: true, playoff: !!opts.playoff });
    hp += g.score[0];
    ap += g.score[1];
    margins.push(g.score[0] - g.score[1]);
    if (g.score[0] > g.score[1]) { homeWins += 1; } else if (g.score[0] === g.score[1]) { ties += 1; }
  }
  margins.sort((a, b) => a - b);
  return {
    home, away,
    homeWin: (homeWins + ties / 2) / games,
    homePoints: hp / games,
    awayPoints: ap / games,
    spread: (hp - ap) / games,
    middle: margins[Math.floor(games / 2)],
    homeOffense: units(H.team, A.team, hd, ad),
    awayOffense: units(A.team, H.team, ad, hd),
    homeDuels: duels(H.team, hd, ad),
    awayDuels: duels(A.team, ad, hd),
    games
  };
}

function describe(a) {
  const h = nickname(a.home);
  const w = nickname(a.away);
  const fav = a.spread >= 0 ? h : w;
  const lines = [];
  lines.push(w + ' at ' + h);
  lines.push('');
  lines.push('Over ' + a.games + ' simulated games: ' + h + ' ' + a.homePoints.toFixed(1) + ', ' + w + ' ' +
             a.awayPoints.toFixed(1) + '. ' + fav + ' by ' + Math.abs(a.spread).toFixed(1) + '; ' + h + ' win ' +
             Math.round(a.homeWin * 100) + '% of the time.');
  lines.push('');
  lines.push('When ' + h + ' have the ball:');
  a.homeOffense.forEach((u) => lines.push('  ' + u.text));
  a.homeDuels.forEach((d) => lines.push('  ' + d));
  lines.push('');
  lines.push('When ' + w + ' have the ball:');
  a.awayOffense.forEach((u) => lines.push('  ' + u.text));
  a.awayDuels.forEach((d) => lines.push('  ' + d));
  return lines.join('\n');
}

module.exports = { assess, describe, nickname };
