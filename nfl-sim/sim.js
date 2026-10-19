#!/usr/bin/env node
/* ==========================================================================
   EGE Football NFL sim — the command line
   Everything is run from here; nothing here touches the website. The world
   (the league as it stands, the season's games and stats, the trade queue,
   team ratings and reports) lives in the world folder, which is private:
   /mnt/project-files/nfl-sim/world in the project, or NFL_SIM_WORLD, or
   --world DIR.

     node nfl-sim/sim.js status                 where the league is
     node nfl-sim/sim.js week                   play the next week (or playoff round)
     node nfl-sim/sim.js season                 play to the end of the regular season
     node nfl-sim/sim.js playoffs               play the playoffs
     node nfl-sim/sim.js standings
     node nfl-sim/sim.js rankings               team ratings (private)
     node nfl-sim/sim.js team DET               roster, schemes, fit, contracts
     node nfl-sim/sim.js player "Sam Stogsdill"
     node nfl-sim/sim.js matchup DET SEA        Detroit at Seattle, sized up
     node nfl-sim/sim.js offseason              aging, contracts, schemes, trade proposals
     node nfl-sim/sim.js draft [--place cooper-clark=LAC[:2]]
     node nfl-sim/sim.js trades [all]           the queue
     node nfl-sim/sim.js approve 2024-O3
     node nfl-sim/sim.js reject 2024-O3
     node nfl-sim/sim.js trade "DET: Andrew Parr, 2025 R2 / SEA: Kenneth Walker"
     node nfl-sim/sim.js report                 a written report into the world folder
     node nfl-sim/sim.js reset --force          start over from the 2023 kickoff

   The website:
     node nfl-sim/sim.js import-site --through 9   take the site's first weeks as played
     node nfl-sim/sim.js site [--season YEAR]   write the sim's games into stats/YEAR.js
                                                and data/nfl-results.js
     node nfl-sim/sim.js export                 write data/nfl-rosters.json for the
                                                Teams pages (nothing private in it)

   Every command that plays games is seeded from the world's seed and where
   the league is, so the same world always plays out the same way.
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const { worldDir, teamOf } = require('./lib/league');
const run = require('./lib/run');
const site = require('./lib/site');
const season = require('./lib/season');
const { standings, recordText } = require('./lib/standings');
const { rateTeams } = require('./lib/team-ratings');
const { assess, describe } = require('./lib/assess');
const trades = require('./lib/trades');
const { depthChart } = require('./lib/lineup');
const { OFFENSE, DEFENSE, fitOf, schemeFor } = require('./lib/schemes');
const { payroll } = require('./lib/rosters');
const { capFor } = require('./lib/value');
const { TEAMS } = require('./lib/teams');

const args = process.argv.slice(2);
function flag(name) {
  const at = args.indexOf('--' + name);
  if (at === -1) { return null; }
  const v = args[at + 1];
  args.splice(at, v && !/^--/.test(v) ? 2 : 1);
  return v && !/^--/.test(v) ? v : true;
}
const worldArg = flag('world');
const seedArg = flag('seed');
const places = [];
for (let p = flag('place'); p; p = flag('place')) { places.push(p); }
const force = flag('force');
const neutral = flag('neutral');
const gamesArg = flag('games');
const throughArg = flag('through');
const seasonArg = flag('season');
const [command, ...rest] = args;

const out = [];
function say(line) { out.push(line === undefined ? '' : line); }
function done() { process.stdout.write(out.join('\n') + '\n'); }

function nick(key) { return TEAMS[key] ? TEAMS[key].name.split(' ').slice(-1)[0] : key; }

function scoreLine(g) {
  return nick(g.away) + ' ' + g.score[1] + (g.neutral ? ' vs. ' : ' at ') + nick(g.home) + ' ' + g.score[0] + (g.ot ? ' (OT)' : '');
}

/* The six, as they stand. */
function sixLines(league) {
  return run.sixNow(league).map((s) => {
    const line = run.sixLine(s);
    return s.name + ' (' + s.pos + ', ' + s.team + ', ' + s.ovr + ')' + (s.out ? ' [out: ' + s.out.what + ']' : '') +
      (line ? ': ' + line : '');
  });
}

function weekReport(league, r) {
  say((r.round ? r.round : 'Week ' + r.week) + ' of ' + league.season + ':');
  r.games.forEach((g) => say('  ' + scoreLine(g)));
  const notable = r.injuries.filter((i) => i.games >= 3 || i.ege);
  if (notable.length) {
    say('Injuries:');
    notable.forEach((i) => say('  ' + i.name + ' (' + i.team + ', ' + i.pos + '): ' + i.what + ', ' + (i.season ? 'out for the season' : i.games + ' weeks')));
  }
  if (r.deadline) { say(''); say('Trade deadline: ' + r.deadline + ' proposals are waiting (node nfl-sim/sim.js trades). Play resumes with the next week, and anything not approved by then expires.'); }
}

function showStandings(league) {
  const t = standings(league.schedule, league.season);
  Object.keys(t.divisions).forEach((d) => say(d.padEnd(10) + t.divisions[d].map((r) => r.key + ' ' + recordText(r)).join('  ')));
  say('Seeds: AFC ' + t.seeds.AFC.join(' ') + ' | NFC ' + t.seeds.NFC.join(' '));
}

function showTrade(t) {
  say(t.id + ' [' + t.status + (t.ege ? ', moves one of the six' : '') + (t.proposedBy === 'Sam' ? ', yours' : '') + ']');
  say('  ' + t.summary);
  t.reasons.forEach((r) => say('  - ' + r));
}

function findPlayer(league, name) {
  const n = name.toLowerCase();
  return league.players.find((p) => p.name.toLowerCase() === n && p.status !== 'retired') ||
    league.players.find((p) => p.name.toLowerCase() === n) ||
    league.players.find((p) => p.name.toLowerCase().indexOf(n) !== -1 && p.status === 'active');
}

function main() {
  if (command === 'reset') { reset(worldDir(worldArg)); done(); return; }
  const league = run.open(worldDir(worldArg), seedArg);

  switch (command) {
    case undefined:
    case 'status': {
      say('World: ' + league.world);
      say('Season ' + league.season + ', ' + league.phase + (league.phase === 'regular' ? ', next up Week ' + league.week : ''));
      const last = (league.history || []).slice(-1)[0];
      if (last) { say('Last champion: ' + (last.champion ? TEAMS[last.champion].name : 'none') + ' (' + last.season + ')'); }
      const pending = trades.loadQueue(league).filter((t) => t.status === 'pending');
      say('Trades waiting for you: ' + pending.length);
      say('');
      sixLines(league).forEach((l) => say(l));
      break;
    }
    case 'week': {
      if (league.phase === 'offseason' || league.phase === 'draft') { say('The season is over: run offseason, then draft.'); break; }
      weekReport(league, run.playNext(league));
      break;
    }
    case 'season': {
      run.playOn(league).forEach((r) => {
        say('Week ' + r.week + ': ' + r.games.map(scoreLine).join(', '));
        if (r.deadline) { say(''); say('Stopped at the trade deadline: ' + r.deadline + ' proposals are waiting. Look at them with "trades", then run "season" again (anything not approved expires).'); }
      });
      if (league.phase === 'playoffs') { say(''); showStandings(league); }
      break;
    }
    case 'playoffs': {
      if (league.phase !== 'playoffs') { say('The playoffs are not on (phase: ' + league.phase + ').'); break; }
      const r = run.playPlayoffs(league);
      r.rounds.forEach((round) => { weekReport(league, round); say(''); });
      say('Champion: ' + TEAMS[r.champion].name);
      break;
    }
    case 'import-site': {
      const through = Number(throughArg);
      if (!through) { say('Usage: import-site --through WEEK'); break; }
      const r = run.importSite(league, through);
      say('Took Weeks ' + r.from + '-' + r.through + ' of ' + league.season + ' from the website: ' + r.games + ' games.');
      if (r.deadline) { say('Trade deadline: ' + r.deadline + ' proposals are waiting (node nfl-sim/sim.js trades).'); }
      say('');
      showStandings(league);
      break;
    }
    case 'site': {
      const year = Number(seasonArg) || league.season;
      const root = path.join(__dirname, '..');
      site.siteFiles(league, year).then((files) => {
        if (!files) { say('The sim has not played any of ' + year + ', so there is nothing to write.'); done(); return; }
        fs.writeFileSync(path.join(root, 'stats', year + '.js'), files.stats);
        fs.writeFileSync(path.join(root, 'data', 'nfl-results.js'), files.results);
        say('Wrote stats/' + year + '.js (the six\'s games from Week ' + files.from + ') and data/nfl-results.js (' +
          files.games + ' games).');
        done();
      }).catch((err) => { process.stderr.write(err.message + '\n'); process.exit(1); });
      return;
    }
    case 'export': {
      const file = path.join(__dirname, '..', 'data', 'nfl-rosters.json');
      const data = site.publicRosters(league);
      fs.writeFileSync(file, JSON.stringify(data) + '\n');
      say('Wrote data/nfl-rosters.json: ' + Object.keys(data.teams).reduce((n, k) => n + data.teams[k].length, 0) + ' players.');
      break;
    }
    case 'standings': showStandings(league); break;
    case 'rankings': {
      const r = rateTeams(league, { rounds: Number(gamesArg) || 4, seed: 'rankings:' + league.season + ':' + league.week });
      season.writeWorld(league, 'ratings-' + league.season + (league.phase === 'regular' ? '-week' + league.week : '-' + league.phase) + '.json', r);
      say('Team ratings (private: never on the site). Overall, points a game against an average team, then units.');
      say('');
      Object.keys(r).sort((a, b) => r[b].margin - r[a].margin).forEach((k, i) => {
        const v = r[k];
        const t = teamOf(league, k);
        t.rating = v.overall;
        say(String(i + 1).padStart(2) + '. ' + k.padEnd(4) + String(v.overall).padStart(3) + '  ' + ((v.margin >= 0 ? '+' : '') + v.margin.toFixed(1)).padStart(6) +
          '  pass ' + v.units.passOffense + ' run ' + v.units.runOffense + ' prot ' + v.units.protection +
          ' | cover ' + v.units.passDefense + ' rush ' + v.units.passRush + ' run D ' + v.units.runDefense +
          '  ' + OFFENSE[t.offense].name + ' / ' + DEFENSE[t.defense].name + ' (' + (t.mode || 'compete') + ')');
      });
      break;
    }
    case 'team': {
      const key = (rest[0] || '').toUpperCase();
      const t = teamOf(league, key);
      if (!t) { say('No team ' + rest[0] + '.'); break; }
      say(TEAMS[key].name + ': ' + OFFENSE[t.offense].name + ' offense, ' + DEFENSE[t.defense].name + ' defense, ' + (t.mode || 'compete') +
        (t.rating ? ', rated ' + t.rating : '') + '. Payroll $' + payroll(league, key).toFixed(1) + 'M of $' + capFor(league.season) + 'M.');
      const d = depthChart(t, league.byTeam.get(key).concat([]));
      Object.keys(d).forEach((pos) => {
        if (!d[pos].length) { return; }
        say(pos.padEnd(5) + d[pos].map((p) => p.name + ' ' + p.ovr + (p.pot > p.ovr ? '/' + p.pot : '') + ' (' + p.age + ', fit ' +
          (fitOf(p, schemeFor(t, pos)) >= 0 ? '+' : '') + fitOf(p, schemeFor(t, pos)).toFixed(1) + ')').join(', '));
      });
      const hurt = league.byTeam.get(key).filter((p) => p.injury);
      if (hurt.length) { say('Out: ' + hurt.map((p) => p.name + ' (' + p.injury.what + ', ' + (p.injury.games >= 20 ? 'season' : p.injury.games + ' wk') + ')').join(', ')); }
      break;
    }
    case 'player': {
      const p = findPlayer(league, rest.join(' '));
      if (!p) { say('No player ' + rest.join(' ') + '.'); break; }
      const drafted = p.draft && p.draft.year ? 'Drafted ' + p.draft.year + ' round ' + p.draft.round + ', pick ' + p.draft.pick + '.' : 'Undrafted.';
      if (p.status === 'retired') {
        say(p.name + ': ' + p.pos + ', retired after the ' + (p.retired - 1) + ' season at ' + (p.age - 1) + ', last rated ' + p.ovr + '. ' + drafted);
        break;
      }
      say(p.name + ': ' + p.pos + ', ' + (p.status === 'fa' ? 'free agent' : p.team) + ', age ' + p.age + ', overall ' + p.ovr +
        (p.pot > p.ovr ? ', potential ' + p.pot : '') + (p.archetype ? ', ' + p.archetype : ''));
      say('Skills: ' + Object.keys(p.skills || {}).map((k) => k + ' ' + p.skills[k]).join(', '));
      say('Durability ' + p.durability + ', longevity ' + p.longevity + '. ' +
        (p.contract && p.status === 'active' ? 'Contract $' + p.contract.apy + 'M a year through ' + p.contract.through + '. ' : '') + drafted);
      if (p.injury) { say('Out: ' + p.injury.what + ', ' + (p.injury.games >= 20 ? 'for the season' : p.injury.games + ' more weeks')); }
      const t = p.team && teamOf(league, p.team);
      if (t) {
        say('Fit: ' + Object.keys(p.pos && ['QB', 'RB', 'WR', 'TE', 'OT', 'IOL'].indexOf(p.pos) !== -1 ? OFFENSE : DEFENSE)
          .map((k) => {
            const scheme = (['QB', 'RB', 'WR', 'TE', 'OT', 'IOL'].indexOf(p.pos) !== -1 ? OFFENSE : DEFENSE)[k];
            return scheme.name + ' ' + (fitOf(p, scheme) >= 0 ? '+' : '') + fitOf(p, scheme).toFixed(1);
          }).join(', '));
      }
      const s = (league.stats || {})[p.id];
      if (s) { say('This season: ' + Object.keys(s).filter((k) => typeof s[k] === 'number').map((k) => k + ' ' + s[k]).join(', ')); }
      break;
    }
    case 'matchup': {
      const away = (rest[0] || '').toUpperCase();
      const home = (rest[1] || '').toUpperCase();
      if (!TEAMS[away] || !TEAMS[home]) { say('Usage: matchup AWAY HOME'); break; }
      say(describe(assess(league, home, away, { neutral: !!neutral, games: Number(gamesArg) || 1000 })));
      break;
    }
    case 'offseason': {
      const r = run.offseason(league);
      say('Into the ' + r.season + ' offseason. ' + (r.champion ? TEAMS[r.champion].name + ' won the Super Bowl.' : ''));
      if (r.the99s.length) { say('99s: ' + r.the99s.join('; ')); }
      say('');
      say('Biggest changes with age:');
      r.bigChanges.forEach((c) => say('  ' + c.name + ' (' + c.pos + ', ' + c.age + '): ' + c.before + ' to ' + c.after + (c.note ? ' (' + c.note + ')' : '')));
      if (r.retired.length) { say('Retired: ' + r.retired.join(', ')); }
      if (r.capCasualties.length) { say('Cap casualties: ' + r.capCasualties.join(', ')); }
      if (r.leftInFreeAgency.length) { say('Hit free agency: ' + r.leftInFreeAgency.join(', ')); }
      if (r.signings.length) { say('Signed: ' + r.signings.join('; ')); }
      if (r.schemes.length) { say(''); say('Coaches and schemes:'); r.schemes.forEach((n) => say('  ' + n)); }
      say('');
      say(r.trades.length + ' pre-draft trade proposals are waiting:');
      r.trades.forEach(showTrade);
      say('');
      say('Approve or reject them, then run "draft" (anything not approved expires).');
      break;
    }
    case 'draft': {
      const place = {};
      places.forEach((p) => { const [slug, where] = String(p).split('='); place[slug] = where; });
      const r = run.draft(league, place);
      say(r.season + ' draft' + (r.expired ? ' (' + r.expired + ' trade proposals expired)' : '') + ':');
      r.draft.filter((d) => (d.round === 1 || d.ege) && !d.undrafted).forEach((d) => say('  ' + d.n + '. ' + d.team + ': ' + d.name + ' (' + d.pos + ', ' + d.ovr + '/' + d.pot + ')' + (d.ege ? '  <- one of the six' : '')));
      r.draft.filter((d) => d.undrafted).forEach((d) => say('  ' + d.name + ' (one of the six) was not drafted' +
        (d.team !== 'FA' ? ': ' + TEAMS[d.team].name + ' had no pick where you placed him, so he signs with them as an undrafted rookie.' : ' and is a free agent.')));
      say('');
      say('Rosters are at 53 and the ' + league.season + ' schedule is set.');
      break;
    }
    case 'trades': {
      const all = rest[0] === 'all';
      const q = trades.loadQueue(league).filter((t) => all || t.status === 'pending');
      if (!q.length) { say(all ? 'No trades yet.' : 'Nothing waiting.'); }
      q.forEach((t) => { showTrade(t); say(''); });
      break;
    }
    case 'approve': {
      const notes = trades.approve(league, rest[0]);
      say('Approved ' + rest[0] + '.');
      notes.forEach((n) => say(n));
      break;
    }
    case 'reject': trades.reject(league, rest[0]); say('Rejected ' + rest[0] + '.'); break;
    case 'trade': {
      const t = trades.proposeOwn(league, rest.join(' '));
      showTrade(t);
      say('');
      say('Queued: approve it with "approve ' + t.id + '".');
      break;
    }
    case 'report': {
      const file = writeReport(league);
      say('Wrote ' + file);
      break;
    }
    default:
      say('Unknown command ' + command + '. Commands: status, week, season, playoffs, standings, rankings, team, player, matchup, offseason, draft, trades, approve, reject, trade, report, reset, import-site, site, export.');
      done();
      return;
  }
  run.save(league);
  done();
}

function reset(world) {
  if (!force) { say('This starts the world over from the 2023 kickoff. Run "reset --force" to do it.'); return; }
  const mine = /^(league|trades|games-\d+|stats-\d+|ratings-.+)\.json$/;
  if (fs.existsSync(world)) {
    fs.readdirSync(world).filter((f) => mine.test(f)).forEach((f) => fs.unlinkSync(path.join(world, f)));
    fs.rmSync(path.join(world, 'reports'), { recursive: true, force: true });
  }
  say('The world starts over from the 2023 kickoff.');
}

/* A written report into world/reports: standings, ratings, leaders, the
   six, injuries and trades. */
function writeReport(league) {
  const lines = [];
  const w = (l) => lines.push(l === undefined ? '' : l);
  w('# NFL sim: ' + league.season + ', ' + league.phase + (league.phase === 'regular' ? ' (through Week ' + (league.week - 1) + ')' : ''));
  w();
  w('Private: team ratings are in here. Not for the site.');
  w();
  w('## The six');
  sixLines(league).forEach((l) => w('- ' + l));
  w();
  if (league.schedule && league.schedule.some((g) => g.score)) {
    w('## Standings');
    const t = standings(league.schedule, league.season);
    Object.keys(t.divisions).forEach((d) => w('- **' + d + '**: ' + t.divisions[d].map((r) => r.key + ' ' + recordText(r)).join(', ')));
    w();
  }
  const r = rateTeams(league, { rounds: 3, seed: 'report:' + league.season + ':' + league.week });
  w('## Team ratings');
  w();
  w('| # | Team | Overall | Pts/game vs avg | Pass O | Run O | Coverage | Pass rush | Run D | Schemes | Mode |');
  w('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  Object.keys(r).sort((a, b) => r[b].margin - r[a].margin).forEach((k, i) => {
    const v = r[k];
    const t = teamOf(league, k);
    w('| ' + (i + 1) + ' | ' + TEAMS[k].name + ' | ' + v.overall + ' | ' + (v.margin >= 0 ? '+' : '') + v.margin.toFixed(1) + ' | ' + v.units.passOffense + ' | ' +
      v.units.runOffense + ' | ' + v.units.passDefense + ' | ' + v.units.passRush + ' | ' + v.units.runDefense + ' | ' +
      OFFENSE[t.offense].name + ' / ' + DEFENSE[t.defense].name + ' | ' + (t.mode || 'compete') + ' |');
  });
  w();
  const stats = Object.keys(league.stats || {}).map((id) => Object.assign({ id }, league.stats[id]));
  if (stats.length) {
    w('## Leaders');
    [['passYds', 'Passing yards'], ['passTd', 'Passing TDs'], ['rushYds', 'Rushing yards'], ['recYds', 'Receiving yards'],
      ['rec', 'Receptions'], ['sacks', 'Sacks'], ['ints', 'Interceptions']].forEach(([k, label]) => {
      w('- **' + label + '**: ' + stats.filter((s) => s[k]).sort((a, b) => b[k] - a[k]).slice(0, 5).map((s) => s.name + ' (' + s.team + ') ' + s[k]).join(', '));
    });
    w();
  }
  const hurt = league.players.filter((p) => p.injury && p.status === 'active' && p.ovr >= 80);
  if (hurt.length) {
    w('## Notable injuries');
    hurt.forEach((p) => w('- ' + p.name + ' (' + p.team + ', ' + p.pos + ', ' + p.ovr + '): ' + p.injury.what + ', ' + (p.injury.games >= 20 ? 'season' : p.injury.games + ' weeks')));
    w();
  }
  const q = trades.loadQueue(league).filter((t) => t.season === league.season);
  if (q.length) {
    w('## Trades this season');
    q.forEach((t) => { w('- **' + t.id + '** (' + t.status + '): ' + t.summary); t.reasons.forEach((x) => w('  - ' + x)); });
    w();
  }
  const dir = path.join(league.world, 'reports');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, league.season + '-' + league.phase + (league.phase === 'regular' ? '-week' + league.week : '') + '.md');
  fs.writeFileSync(file, lines.join('\n') + '\n');
  return file;
}

try {
  main();
} catch (err) {
  process.stderr.write(err.message + '\n');
  process.exit(1);
}
