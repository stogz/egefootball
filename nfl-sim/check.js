/* ==========================================================================
   EGE Football NFL sim — the engine against the real 2023 season
   Plays the real 2023 regular season from the Week 1 league (the kickoff
   league in data/, not the saved world) and compares it with what really
   happened:

   - league-wide: points, plays, how often teams threw, completion rate,
     yards a throw and a carry, sacks, interceptions, fumbles, kicking,
     punts, third and fourth downs (data/benchmarks-2023.json);
   - game by game: whether the sim's average margin in each game tracks the
     Vegas line and the real score;
   - the season leaders, to eyeball.

       node nfl-sim/check.js            three runs of the season
       node nfl-sim/check.js --runs 10  more runs, steadier numbers

   And the offseason, in a world of its own from the 2023 kickoff
   (--offseason, --years 3 by default): every draft takes at least four
   full rounds and those picks are all on a 53 when it is over, every
   team is at 53, the league keeps about as many 80s and 90s as it
   started with, contenders spend nearly all of the cap and rebuilding
   teams keep a little room, nobody is far over it, and a player who
   started all season develops faster than the same player on the bench.
   Each check passes or fails, and a failure exits with 1.

       node nfl-sim/check.js --offseason [--years 3]

   Injuries happen inside games but do not carry over to the next week, so
   every game is played by the Week 1 rosters.
   ========================================================================== */

'use strict';

const io = require('./lib/io');
const { index, syncSix } = require('./lib/league');
const { playGame } = require('./lib/game');
const { seeded } = require('./lib/rng');

function arg(name, fallback) {
  const at = process.argv.indexOf('--' + name);
  return at === -1 ? fallback : process.argv[at + 1];
}

function kickoffLeague() {
  const league = io.data('league-2023.json');
  syncSix(league);
  index(league);
  return league;
}

function sideOf(league, key) {
  return { team: league.teams.find((t) => t.key === key), roster: league.byTeam.get(key) };
}

function correlation(xs, ys) {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i += 1) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) * (xs[i] - mx);
    syy += (ys[i] - my) * (ys[i] - my);
  }
  return sxy / Math.sqrt(sxx * syy);
}

function main() {
  const runs = Number(arg('runs', 3));
  const seed = Number(arg('seed', 2023));
  const league = kickoffLeague();
  const bench = io.data('benchmarks-2023.json');
  const games = bench.games.filter((g) => g.type === 'REG');
  const rng = seeded(seed);

  const t = {};
  const add = (k, n) => { t[k] = (t[k] || 0) + n; };
  const fgBy = { under30: [0, 0], '30-39': [0, 0], '40-49': [0, 0], '50+': [0, 0] };
  const margins = games.map(() => 0);
  const allMargins = [];
  const players = new Map();
  let teamGames = 0;
  let points = 0;
  let injuries = 0;
  const started = Date.now();

  for (let run = 0; run < runs; run += 1) {
    games.forEach((game, i) => {
      const r = playGame(sideOf(league, game.home), sideOf(league, game.away), rng, { neutral: false });
      margins[i] += (r.score[0] - r.score[1]) / runs;
      allMargins.push(r.score[0] - r.score[1]);
      teamGames += 2;
      points += r.score[0] + r.score[1];
      injuries += r.injuries.length;
      r.stats.forEach((s) => Object.keys(s).forEach((k) => add(k, s[k])));
      r.kicks.forEach((k) => {
        const bucket = k.dist < 30 ? 'under30' : k.dist < 40 ? '30-39' : k.dist < 50 ? '40-49' : '50+';
        fgBy[bucket][0] += 1;
        if (k.made) { fgBy[bucket][1] += 1; }
      });
      Object.keys(r.box).forEach((id) => {
        const line = r.box[id];
        let p = players.get(id);
        if (!p) { p = { name: line.name, team: line.team, pos: line.pos }; players.set(id, p); }
        Object.keys(line).forEach((k) => { if (typeof line[k] === 'number') { p[k] = (p[k] || 0) + line[k] / runs; } });
      });
    });
  }

  const per = (n) => n / teamGames;
  const meanMargin = allMargins.reduce((a, b) => a + b, 0) / allMargins.length;
  const sdMargin = Math.sqrt(allMargins.reduce((a, m) => a + (m - meanMargin) * (m - meanMargin), 0) / allMargins.length);
  const sim = {
    pointsPerTeamGame: points / teamGames,
    homeMargin: meanMargin,
    marginSd: sdMargin,
    playsPerTeamGame: per(t.plays),
    dropbackRate: t.dropbacks / (t.plays - t.kneels),
    attemptsPerTeamGame: per(t.attempts),
    completionPct: t.completions / t.attempts,
    yardsPerAttempt: t.passYards / t.attempts,
    passYardsPerTeamGame: per(t.passYards),
    sackRate: t.sacks / (t.attempts + t.sacks),
    intRate: t.ints / t.attempts,
    passTdPerTeamGame: per(t.passTds),
    completions20Plus: t.explosivePass / t.attempts,
    carriesPerTeamGame: per(t.carries),
    yardsPerCarry: t.rushYards / t.carries,
    rushYardsPerTeamGame: per(t.rushYards),
    rushTdPerTeamGame: per(t.rushTds),
    runs10Plus: t.explosiveRun / t.carries,
    scramblesPerTeamGame: per(t.scrambles),
    fumblesLostPerTeamGame: per(t.fumblesLost),
    turnoversPerTeamGame: per(t.ints + t.fumblesLost),
    fgaPerTeamGame: per(t.fga),
    fgPct: t.fgm / t.fga,
    xpPct: t.xpm / t.xpa,
    twoPointTriesPerTeamGame: per(t.twoPa),
    twoPointPct: t.twoPm / t.twoPa,
    puntsPerTeamGame: per(t.punts),
    thirdDownPct: t.thirdMade / t.third,
    fourthDownTriesPerTeamGame: per(t.fourth),
    fourthDownPct: t.fourthMade / t.fourth,
    kickoffTouchbackRate: t.touchbacks / t.kickoffs,
    penaltiesPerTeamGame: per(t.penalties)
  };

  const out = [];
  out.push('2023 regular season, ' + runs + ' run' + (runs === 1 ? '' : 's') + ' (' + games.length * runs + ' games, ' +
           ((Date.now() - started) / 1000).toFixed(1) + 's)\n');
  out.push(pad('', 30) + pad('sim', 9) + pad('2023', 9) + 'off by');
  Object.keys(sim).forEach((k) => {
    const real = bench.league[k];
    const v = sim[k];
    const off = real ? ((v - real) / real) * 100 : 0;
    const flagged = Math.abs(off) > 8 ? '  <--' : '';
    out.push(pad(k, 30) + pad(fmt(v), 9) + pad(fmt(real), 9) + (off >= 0 ? '+' : '') + off.toFixed(1) + '%' + flagged);
  });
  out.push(pad('fgPct by distance', 30) + Object.keys(fgBy).map((b) => b + ' ' + fmt(fgBy[b][1] / fgBy[b][0]) +
           ' (' + fmt(bench.league.fgPctByDistance[b]) + ')').join('  '));
  out.push(pad('injuries per team game', 30) + fmt(injuries / teamGames));

  const lines = games.map((g, i) => ({ sim: margins[i], spread: g.spread, real: g.homeScore - g.awayScore }));
  out.push('');
  out.push('Game by game (home margin):');
  out.push('  sim against the Vegas line  r = ' + correlation(lines.map((l) => l.sim), lines.map((l) => l.spread)).toFixed(3));
  out.push('  sim against the real score  r = ' + correlation(lines.map((l) => l.sim), lines.map((l) => l.real)).toFixed(3));
  out.push('  Vegas against the real score r = ' + correlation(lines.map((l) => l.spread), lines.map((l) => l.real)).toFixed(3));
  const sd = (xs) => { const m = xs.reduce((x, y) => x + y, 0) / xs.length; return Math.sqrt(xs.reduce((x, y) => x + (y - m) * (y - m), 0) / xs.length); };
  out.push('  spread of predicted margins: sim sd ' + sd(lines.map((l) => l.sim)).toFixed(1) + ', Vegas sd ' + sd(lines.map((l) => l.spread)).toFixed(1) +
           ' (the sim\'s includes ' + (sdMargin / Math.sqrt(runs)).toFixed(1) + ' of noise from ' + runs + ' runs)');
  const picks = lines.filter((l) => l.spread !== 0 && l.real !== 0);
  const agree = picks.filter((l) => Math.sign(l.sim) === Math.sign(l.spread)).length;
  const right = picks.filter((l) => Math.sign(l.sim) === Math.sign(l.real)).length;
  out.push('  picks the Vegas favorite ' + agree + ' of ' + picks.length + ', picks the real winner ' + right + ' of ' + picks.length);

  /* Team by team: average margin a game in the sim, by the Vegas lines,
     and for real. */
  const teams = {};
  games.forEach((g, i) => {
    [[g.home, 1], [g.away, -1]].forEach(([key, sign]) => {
      const row = teams[key] || (teams[key] = { sim: 0, vegas: 0, real: 0, n: 0 });
      row.sim += sign * margins[i];
      row.vegas += sign * (g.spread || 0);
      row.real += sign * (g.homeScore - g.awayScore);
      row.n += 1;
    });
  });
  const rows = Object.keys(teams).map((k) => ({ key: k, sim: teams[k].sim / teams[k].n, vegas: teams[k].vegas / teams[k].n, real: teams[k].real / teams[k].n }))
    .sort((a, b) => b.sim - a.sim);
  out.push('');
  out.push('Teams, average margin a game (sim / Vegas / real):');
  for (let i = 0; i < rows.length; i += 4) {
    out.push('  ' + rows.slice(i, i + 4).map((r) => pad(r.key, 4) + pad((r.sim >= 0 ? '+' : '') + r.sim.toFixed(1), 6) +
      pad((r.vegas >= 0 ? '+' : '') + r.vegas.toFixed(1), 6) + pad((r.real >= 0 ? '+' : '') + r.real.toFixed(1), 7)).join(' '));
  }
  out.push('  team-level r: sim/Vegas ' + correlation(rows.map((r) => r.sim), rows.map((r) => r.vegas)).toFixed(3) +
           ', sim/real ' + correlation(rows.map((r) => r.sim), rows.map((r) => r.real)).toFixed(3) +
           ', Vegas/real ' + correlation(rows.map((r) => r.vegas), rows.map((r) => r.real)).toFixed(3));

  const leaders = (key, label, n) => {
    const top = Array.from(players.values()).filter((p) => p[key]).sort((a, b) => b[key] - a[key]).slice(0, n || 6);
    out.push(pad(label, 16) + top.map((p) => p.name + ' (' + p.team + ') ' + Math.round(p[key])).join(', '));
  };
  out.push('');
  out.push('Season leaders (average of the runs):');
  leaders('passYds', 'Passing yards');
  leaders('passTd', 'Passing TDs');
  leaders('passInt', 'Interceptions');
  leaders('rushYds', 'Rushing yards');
  leaders('rushTd', 'Rushing TDs');
  leaders('recYds', 'Receiving yards');
  leaders('rec', 'Receptions');
  leaders('recTd', 'Receiving TDs');
  leaders('targets', 'Targets');
  leaders('sacks', 'Sacks');
  leaders('ints', 'Picks');
  leaders('tackles', 'Tackles');
  process.stdout.write(out.join('\n') + '\n');
}

function pad(text, n) { text = String(text); return text.length >= n ? text + ' ' : text + ' '.repeat(n - text.length); }
function fmt(v) { return v === undefined || v === null || Number.isNaN(v) ? '-' : Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(3); }

/* ------------------------------------------------------------ offseason -- */

function offseasonChecks() {
  const fs = require('fs');
  const os = require('os');
  const path = require('path');
  const run = require('./lib/run');
  const { MIN_ROUNDS } = require('./lib/draft');
  const { onTeam, payroll, ROSTER, LEFT_OVER, KEEP_ROUNDS } = require('./lib/rosters');
  const { capFor } = require('./lib/value');
  const { develop } = require('./lib/aging');
  const years = Number(arg('years', 3));
  const world = fs.mkdtempSync(path.join(os.tmpdir(), 'nfl-sim-check-'));
  const failures = [];
  const check = (ok, text) => {
    process.stdout.write((ok ? 'PASS  ' : 'FAIL  ') + text + '\n');
    if (!ok) { failures.push(text); }
  };
  const started = Date.now();
  try {
    let league = run.open(world, 'check');
    run.save(league);
    for (let y = 0; y < years; y += 1) {
      league = run.open(world, 'check');
      while (league.phase === 'regular' || league.phase === 'deadline') { run.playOn(league); }
      run.playPlayoffs(league);
      run.offseason(league);
      /* The six in free agency: offers from more than one team, his own
         among them, and he takes the best of them. */
      run.offers(league).forEach((w) => {
        check(w.offers.length >= 2 && (!w.from || w.offers.some((o) => o.own)), league.season + ' ' + w.name + ' in free agency: ' +
          w.offers.length + ' offers (' + w.offers.map((o) => o.team + ' $' + o.apy + 'M').join(', ') + ')');
        run.acceptOffer(league, w.slug, w.offers[0].team);
      });
      const r = run.draft(league, {});
      run.save(league);
      const year = league.season;
      const cap = capFor(year);

      for (let round = 1; round <= MIN_ROUNDS; round += 1) {
        const n = r.draft.filter((d) => d.round === round && !d.undrafted).length;
        check(n >= league.teams.length - 4, year + ' draft round ' + round + ': ' + n + ' picks');
      }
      const early = r.draft.filter((d) => d.round && d.round <= KEEP_ROUNDS && !d.undrafted);
      const kept = early.filter((d) => { const p = league.byId.get(d.id); return p && p.status === 'active' && p.team === d.team; });
      check(kept.length === early.length, year + ' draft rounds 1-' + KEEP_ROUNDS + ': ' + kept.length + ' of ' + early.length +
        ' on their team\'s 53' + (kept.length < early.length ? ' (cut: ' + early.filter((d) => kept.indexOf(d) === -1).slice(0, 5).map((d) => d.n + ' ' + d.name).join(', ') + ')' : ''));
      const sizes = league.teams.map((t) => onTeam(league, t.key).length);
      check(sizes.every((n) => n === ROSTER), year + ' rosters: ' + Math.min.apply(null, sizes) + '-' + Math.max.apply(null, sizes));

      const left = {};
      league.teams.forEach((t) => { (left[t.mode] = left[t.mode] || []).push((cap - payroll(league, t.key)) / cap); });
      const mean = (list) => list.reduce((a, b) => a + b, 0) / list.length;
      Object.keys(left).forEach((mode) => {
        const share = mean(left[mode]);
        const want = LEFT_OVER[mode] === undefined ? LEFT_OVER.retool : LEFT_OVER[mode];
        check(share <= want + 0.04, year + ' ' + mode + ' teams (' + left[mode].length + ') leave ' + (share * 100).toFixed(1) +
          '% of the cap on average (aim ' + (want * 100).toFixed(0) + '%)');
      });
      const active = league.players.filter((p) => p.status === 'active' && !p.ege);
      const n80 = active.filter((p) => p.ovr >= 80).length;
      const n90 = active.filter((p) => p.ovr >= 90).length;
      check(n80 >= 360 && n80 <= 480 && n90 >= 70 && n90 <= 130, year + ' players 80 or better: ' + n80 + ', 90 or better: ' + n90 +
        ' (2023 kickoff: 403 and 90)');
      const over = league.teams.filter((t) => payroll(league, t.key) > cap * 1.03);
      check(!over.length, year + ' teams more than 3% over the cap: ' + (over.map((t) => t.key).join(', ') || 'none'));
    }
  } finally {
    fs.rmSync(world, { recursive: true, force: true });
  }

  /* The same young players, a season starting against a season on the bench. */
  const { seeded } = require('./lib/rng');
  const grow = (share) => {
    const rng = seeded('starts');
    let total = 0;
    for (let i = 0; i < 2000; i += 1) {
      const p = { pos: 'QB', age: 24, ovr: 74, pot: 85, skills: null };
      develop(p, rng, rng.gauss, share);
      total += p.ovr - 74;
    }
    return total / 2000;
  };
  const bench = grow(0);
  const starter = grow(1);
  check(starter > bench + 1, 'a 24-year-old 74/85 grows ' + starter.toFixed(1) + ' a year starting, ' + bench.toFixed(1) + ' on the bench');
  process.stdout.write('\n' + (failures.length ? failures.length + ' failed' : 'All passed') + ' (' +
    ((Date.now() - started) / 1000).toFixed(1) + 's)\n');
  if (failures.length) { process.exitCode = 1; }
}

if (require.main === module) {
  if (process.argv.indexOf('--offseason') !== -1) { offseasonChecks(); } else { main(); }
}
