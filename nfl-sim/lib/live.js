/* ==========================================================================
   EGE Football NFL sim — Live Mode's feed
   A game the sim has played, snap by snap, the way the live page and the
   Discord bot tell it (Sam, 2026-11-03). Out of the plays a game keeps
   (lib/game.js with `log`, kept a week at a time by lib/season.js):

   - the feed: one entry a snap, in order, each { call, text, more, pre,
     post, tag, d, t, p, w, r, hl, ht, ms }. `call` is what shows first ("Jaykeb Stewart
     pass") and `text` what it came to ("Jaykeb Stewart 22-yd pass to Nico
     Collins"), with `more` under it (the extra point, who got hurt).
     `pre` and `post` are where the ball was before and after: the team
     with it, the yard line from its own goal, down, distance, score
     [home, away], quarter and clock. `d` is what the snap added to each
     player's line, by the player's number in this game, and `t` to each
     team's numbers [home, away]; `p` introduces the players it names for
     the first time ({ n: name, pos, t: team, e: ESPN id, g: which of the
     six, c: a college headshot }). Never the sim's own ids, so nobody can
     read anything private off it, and a player shows up only on the snap
     he first does something, so the feed does not give away who comes in
     later. `w` is the number of whoever the call names, for his face,
     and `r` whose face the result shows instead (the receiver, or the
     defender on a sack, an interception or a fumble);
     `hl` a scoring play's words past the player's name, to show in the
     colour of `ht`, the side that scored; and `ms` when the entry comes
     up, in milliseconds from kickoff (TIMING). Who is on fire the page
     works out from `d` (js/live-heat.js).
     Halftime and the final whistle are entries of their own, and so is
     the wait before every snap (`tag` 'wait': "Snap…", where the ball is,
     and nothing about the play to come).
   - the posts: what the Discord bot says, and when, as plain words and
     numbers for EGE.discordPost.buildLivePosts to dress: the opening
     kickoff, every touchdown, field goal, punt, interception, fumble,
     turnover on downs and safety, any run or catch of 60 yards or more,
     each trip into the red zone and halftime. Not the final: the week's
     own post has the result once the week is out (Sam, 2026-11-09). Each is { at
     (the entry), kind, team (whose post it is), title, lines, face (a
     player's number), score, when }. A play the defense made has the
     defender's face and his line first, and the title still the
     offense's (Sam, 2026-11-03): only a pick-six names the defender.
   ========================================================================== */

'use strict';

const { TEAMS } = require('./teams');

/* A run or a catch this long is a post of its own. */
const BIG_PLAY = 60;

/* What a snap's player lines keep: everything the live box score and the
   posts show. */
const LINE_KEYS = ['passCmp', 'passAtt', 'passYds', 'passTd', 'passInt', 'sacked', 'rushAtt', 'rushYds', 'rushTd', 'rushLong',
                   'targets', 'rec', 'recYds', 'recTd', 'recLong', 'fumLost', 'tackles', 'sacks', 'ints', 'passDef', 'ff',
                   'defTd', 'fgm', 'fga', 'fgLong', 'xpm', 'xpa', 'punts', 'puntYards', 'retTd'];

/* And a team's, for the box score's numbers. */
const TEAM_KEYS = ['plays', 'dropbacks', 'carries', 'yards', 'firstDowns', 'third', 'thirdMade', 'sacks', 'ints',
                   'fumblesLost', 'top', 'penalties', 'penaltyYards'];

const DOWNS = ['', '1st', '2nd', '3rd', '4th'];

function nick(key) { return TEAMS[key] ? TEAMS[key].name.split(' ').slice(-1)[0] : key; }

function clockText(seconds) {
  const t = Math.max(0, Math.round(seconds));
  return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
}

function quarterText(q) { return q > 4 ? (q === 5 ? 'OT' : 'OT' + (q - 4)) : 'Q' + q; }

/* "Q4 9:55, 3rd & GOAL", the way a post's footer has it. */
function whenText(at, kick) {
  const head = quarterText(at.q) + ' ' + clockText(at.c);
  if (kick || !at.dn) { return head; }
  return head + ', ' + DOWNS[at.dn] + ' & ' + (at.yl + at.tg >= 100 ? 'GOAL' : at.tg);
}

function plural(n, word) { return n + ' ' + word + (n === 1 ? '' : 'S'); }

/* --------------------------------------------------------------- lines -- */

/* "Jaykeb Stewart (18/26, 254 YDS, 1 TD, 1 INT)" */
function passLine(name, l) {
  return name + ' (' + (l.passCmp || 0) + '/' + (l.passAtt || 0) + ', ' + (l.passYds || 0) + ' YDS' +
    (l.passTd ? ', ' + plural(l.passTd, 'TD') : '') + (l.passInt ? ', ' + plural(l.passInt, 'INT') : '') + ')';
}

/* "Javonte Williams (19 CAR, 154 YDS, 2 TDS)" */
function rushLine(name, l) {
  return name + ' (' + (l.rushAtt || 0) + ' CAR, ' + (l.rushYds || 0) + ' YDS' + (l.rushTd ? ', ' + plural(l.rushTd, 'TD') : '') + ')';
}

/* "Jalen Royals (4 REC, 45 YDS, 1 TD)" */
function recLine(name, l) {
  return name + ' (' + (l.rec || 0) + ' REC, ' + (l.recYds || 0) + ' YDS' + (l.recTd ? ', ' + plural(l.recTd, 'TD') : '') + ')';
}

/* "Justin Tucker (2/2 FG)" */
function kickLine(name, l) { return name + ' (' + (l.fgm || 0) + '/' + (l.fga || 0) + ' FG)'; }

/* A defender's line for the play he made: "Jonathan Allen (2 SCK, 1 FF)". */
function defLine(name, l) {
  const bits = [];
  if (l.tackles) { bits.push(l.tackles + ' TKL'); }
  if (l.sacks) { bits.push(l.sacks + ' SCK'); }
  if (l.ff) { bits.push(l.ff + ' FF'); }
  if (l.passDef) { bits.push(l.passDef + ' PD'); }
  if (l.ints) { bits.push(plural(l.ints, 'INT')); }
  return bits.length ? name + ' (' + bits.join(', ') + ')' : name;
}

/* The red zone: this close to the goal line. */
const RED_ZONE = 20;

/* How long, in milliseconds (Sam, 2026-11-10): every snap, punts too, is
   two seconds of "Snap…", five of the call ("Sam Stogsdill rush…") and
   nine of the whole play ("Sam Stogsdill 13-yd rush"); halftime is two
   minutes, long enough to get a halftime bet in (lib/live-bets.js).
   Nothing waits longer before a new drive or the red zone. `reveal` is
   the call's time, and `slot` a whole snap's. */
const TIMING = { wait: 2000, call: 5000, play: 9000, half: 120000 };
TIMING.reveal = TIMING.call;
TIMING.slot = TIMING.wait + TIMING.call + TIMING.play;

/* Fantasy points, for who a half's top performers are. */
function points(l) {
  return (l.passYds || 0) / 25 + (l.passTd || 0) * 4 - (l.passInt || 0) * 2 + (l.rushYds || 0) / 10 + (l.rushTd || 0) * 6 +
    (l.recYds || 0) / 10 + (l.recTd || 0) * 6 + (l.rec || 0) * 0.5 + (l.fgm || 0) * 3 + (l.xpm || 0) + (l.ints || 0) * 3 +
    (l.sacks || 0) * 2 + (l.defTd || 0) * 6;
}

/* A player's line as one post line, by what he did most. */
function bestLine(name, l) {
  if (l.passAtt) { return passLine(name, l); }
  if (l.fga && !l.rushAtt && !l.rec) { return kickLine(name, l); }
  if ((l.rec || 0) && (l.recYds || 0) >= (l.rushYds || 0)) { return recLine(name, l); }
  if (l.rushAtt) { return rushLine(name, l); }
  if (l.ints || l.sacks) {
    return name + ' (' + [l.tackles ? l.tackles + ' TKL' : '', l.sacks ? l.sacks + ' SCK' : '', l.ints ? plural(l.ints, 'INT') : '']
      .filter(Boolean).join(', ') + ')';
  }
  return name;
}

/* A team's top performers so far: its passer, then up to two more by
   fantasy points who did enough to mention. */
function topOf(lines, info, team) {
  const mine = Object.keys(lines).filter((i) => info[i].t === team).map((i) => ({ i, l: lines[i], pts: points(lines[i]) }));
  const qb = mine.filter((x) => x.l.passAtt).sort((a, b) => b.l.passAtt - a.l.passAtt)[0];
  const rest = mine.filter((x) => x !== qb && x.pts >= 5).sort((a, b) => b.pts - a.pts).slice(0, qb ? 2 : 3);
  return (qb ? [qb] : []).concat(rest).map((x) => bestLine(info[x.i].n, x.l));
}

/* ---------------------------------------------------------------- feed -- */

/* The feed and the posts for one game: `game` is { home, away } by key,
   `kept` the game's plays as its plays file has them, and `league` the
   world, for each player's ESPN id and which of the six he is. */
function build(league, game, kept) {
  const keys = [game.home, game.away];
  const people = kept.people || {};
  const number = {};
  const info = [];
  const lines = {};
  const entries = [];
  const posts = [];
  let fresh = null;

  /* A player's number in this game, introduced the first time. */
  function num(id) {
    if (id === undefined || id === null || !people[id]) { return undefined; }
    if (number[id] === undefined) {
      const p = people[id];
      const sim = league && league.byId ? league.byId.get(id) : null;
      const row = { n: name(id), pos: p.pos, t: keys[p.side] };
      if (sim && sim.espn) { row.e = String(sim.espn); }
      if (sim && sim.ege) { row.g = sim.ege; }
      if (sim && sim.collegePhoto) { row.c = true; }
      number[id] = info.length;
      info.push(row);
      fresh[number[id]] = row;
    }
    return number[id];
  }
  /* A stand-in the sim plays where a depth chart has nobody left
     (lib/lineup.js) is the team's backup. */
  function name(id) {
    const p = people[id];
    if (!p) { return 'Someone'; }
    return /^standin:/.test(id) ? nick(keys[p.side]) + ' backup ' + p.pos : p.name;
  }
  function line(id) { return lines[number[id]] || {}; }
  /* The line of whoever had the ball, or none for a stand-in, whom the sim
     keeps no line for. */
  function ballLine(id, as) {
    const l = line(id);
    if (!Object.keys(l).length) { return []; }
    const by = as || (l.passAtt ? 'pass' : l.rec ? 'rec' : 'rush');
    return [(by === 'pass' ? passLine : by === 'rec' ? recLine : rushLine)(name(id), l)];
  }

  /* Whose trip into the red zone has been posted, until the ball changes
     hands or the drive ends in a kick or a score. */
  let red = null;
  function state(at, side) {
    return { o: keys[side === undefined ? at.o : side], yl: Math.max(0, Math.min(100, at.yl)), dn: at.dn, tg: at.tg,
             s: at.s.slice(), q: at.q, c: at.c };
  }

  kept.plays.forEach((e, n) => {
    fresh = {};
    const off = e.team === undefined ? e.pre.o : e.team;
    const def = 1 - off;
    const O = nick(keys[off]);
    const D = nick(keys[def]);
    const kick = e.k === 'kick' || e.k === 'free';
    const scored = e.tdBy !== undefined;

    /* Every line the snap added to, first: the post lines below read the
       totals with this snap in them. */
    const d = {};
    Object.keys(e.d).forEach((id) => {
      const i = num(id);
      if (i === undefined) { return; }
      const add = {};
      Object.keys(e.d[id]).forEach((k) => { if (LINE_KEYS.indexOf(k) !== -1 && e.d[id][k]) { add[k] = e.d[id][k]; } });
      if (!Object.keys(add).length) { return; }
      d[i] = add;
      const l = lines[i] || (lines[i] = {});
      Object.keys(add).forEach((k) => { l[k] = /Long$/.test(k) ? Math.max(l[k] || 0, add[k]) : (l[k] || 0) + add[k]; });
    });
    const t = [0, 1].map((side) => {
      const out = {};
      TEAM_KEYS.forEach((k) => {
        const v = (e.sums || [])[side] && e.sums[side][k];
        if (v) { out[k] = k === 'top' ? Math.round(v * 10) / 10 : v; }
      });
      return out;
    });

    let call;
    let text;
    let w;
    /* Whose face the result shows, once it is out, where not the caller's:
       the receiver a pass went to, or the defender who sacked, picked it
       off or forced the fumble (Sam, 2026-11-03). */
    let r;
    /* A scoring play's words past the player who made it ("27-yd rushing
       touchdown"), which the feed shows in the scoring side's colour. */
    let hl = null;
    const more = [];
    let tag = null;
    let post = null;
    const yds = e.yds || 0;
    const pre = kick ? { o: keys[off], yl: e.k === 'free' ? 20 : 35, dn: 0, tg: 0, s: e.pre.s.slice(), q: e.pre.q, c: e.pre.c }
      : state(e.pre);

    if (e.k === 'kick' || e.k === 'free') {
      const K = name(e.kicker);
      const R = name(e.ret);
      w = num(e.kicker);
      num(e.ret);
      call = K + (e.onside ? ' onside kick' : e.k === 'free' ? ' free kick' : ' kickoff');
      if (e.onside) {
        text = K + ' onside kick, recovered by the ' + (e.kept ? O : D);
      } else if (e.tb) {
        text = K + ' kickoff, touchback';
      } else if (scored) {
        hl = yds + '-yd kickoff return touchdown';
        text = R + ' ' + hl;
      } else {
        text = call + ', ' + R + ' ' + yds + '-yd return';
      }
      tag = scored ? 'td' : 'kick';
      if (scored) {
        post = { kind: 'td', team: keys[def], title: text, lines: [R + ' ' + yds + '-yd return'], face: num(e.ret) };
      } else if (e.k === 'kick') {
        post = { kind: 'kick', team: keys[off], title: e.tb ? K + ' kickoff, touchback' : K + ' kickoff, ' + yds + '-yd return',
                 lines: [K + ' Kickoff', e.tb ? 'Touchback' : R + ' ' + yds + '-yd return'], face: num(e.kicker) };
      }
    } else if (e.k === 'punt') {
      const P = name(e.kicker);
      const R = name(e.ret);
      w = num(e.kicker);
      call = P + ' punt';
      if (e.blocked) {
        text = P + ' punt BLOCKED, ' + D + ' ball';
        post = { kind: 'punt', team: keys[def], title: P + ' punt blocked', lines: [P + ' punt blocked'], face: num(e.kicker) };
      } else {
        let after;
        if (e.tb) {
          after = 'touchback';
        } else if (scored) {
          after = null;
        } else if (e.yds === undefined) {
          after = e.fair ? 'fair catch by ' + R : 'downed at the ' + D + ' ' + Math.max(1, 100 - e.pre.yl - e.gross);
        } else {
          after = R + ' ' + yds + '-yd return';
        }
        if (after && /fair catch|return/.test(after)) { num(e.ret); }
        if (scored) { hl = yds + '-yd punt return touchdown'; }
        text = scored ? R + ' ' + hl : P + ' ' + e.gross + '-yd punt, ' + after;
        if (scored) {
          num(e.ret);
          post = { kind: 'td', team: keys[def], title: text, lines: [P + ' ' + e.gross + '-yd punt', R + ' ' + yds + '-yd return'],
                   face: num(e.ret) };
        } else {
          const said = after.charAt(0).toUpperCase() + after.slice(1);
          post = { kind: 'punt', team: keys[off], title: P + ' ' + e.gross + '-yd punt' + (e.yds !== undefined ? ', ' + yds + '-yd return' : ''),
                   lines: [P + ' ' + e.gross + '-yd punt', said], face: num(e.kicker) };
        }
      }
      tag = scored ? 'td' : 'punt';
    } else if (e.k === 'fg') {
      const K = name(e.kicker);
      w = num(e.kicker);
      call = K + ' ' + e.dist + '-yd field goal attempt';
      text = K + ' ' + e.dist + '-yd field goal is ' + (e.made ? 'GOOD' : 'NO GOOD');
      if (e.made) { hl = e.dist + '-yd field goal is GOOD'; }
      tag = 'fg';
      post = { kind: 'fg', team: keys[off], title: K + ' ' + e.dist + '-yd field goal' + (e.made ? '' : ' missed'),
               lines: [kickLine(K, line(e.kicker))], face: num(e.kicker) };
    } else if (e.k === 'kneel') {
      w = num(e.qb);
      call = name(e.qb) + ' kneel';
      text = name(e.qb) + ' kneels';
    } else if (e.k === 'flag') {
      call = 'Flag on the play';
      text = e.flag + ' on the ' + nick(keys[e.on]) + ', ' + e.penalty + ' yds';
    } else if (e.k === 'run') {
      const B = name(e.ball);
      w = num(e.ball);
      call = B + ' rush';
      if (e.flag) {
        text = B + ' ' + yds + '-yd rush, called back for holding on the ' + O + ', ' + e.penalty + ' yds';
      } else if (scored) {
        hl = yds + '-yd rushing touchdown';
        text = B + ' ' + hl;
      } else if (e.safety !== undefined) {
        hl = 'tackled in the end zone, SAFETY';
        text = B + ' ' + hl;
      } else {
        text = yds > 0 ? B + ' ' + yds + '-yd rush' : yds === 0 ? B + ' rush for no gain' : B + ' rush for a ' + -yds + '-yd loss';
      }
      if (!e.flag) {
        if (scored) {
          tag = 'td';
          post = { kind: 'td', team: keys[off], title: text, lines: [rushLine(B, line(e.ball))], face: num(e.ball) };
        } else if (yds >= BIG_PLAY && !e.fum) {
          tag = 'big';
          post = { kind: 'big', team: keys[off], title: B + ' ' + yds + '-yd rush', lines: [rushLine(B, line(e.ball))], face: num(e.ball) };
        }
      }
    } else if (e.k === 'pass') {
      const Q = name(e.qb);
      const R = name(e.to);
      w = num(e.qb);
      call = Q + ' pass';
      if (e.sack !== undefined) {
        r = num(e.sack);
      } else if (e.res === 'i') {
        r = num(e.by);
      } else if (e.to !== undefined && !e.scramble && !e.away) {
        r = num(e.to);
      }
      if (e.sack !== undefined) {
        const S = name(e.sack);
        if (e.safety !== undefined) { hl = 'in the end zone, SAFETY'; }
        text = e.safety !== undefined ? Q + ' sacked by ' + S + ' ' + hl
          : Q + ' sacked by ' + S + ' for a ' + -yds + '-yd loss';
      } else if (e.scramble) {
        if (scored) { hl = yds + '-yd rushing touchdown'; }
        text = scored ? Q + ' ' + hl
          : yds > 0 ? Q + ' ' + yds + '-yd scramble' : Q + ' scrambles for no gain';
        if (scored) {
          tag = 'td';
          post = { kind: 'td', team: keys[off], title: text, lines: [rushLine(Q, line(e.qb))], face: num(e.qb) };
        } else if (yds >= BIG_PLAY) {
          tag = 'big';
          post = { kind: 'big', team: keys[off], title: Q + ' ' + yds + '-yd scramble', lines: [rushLine(Q, line(e.qb))], face: num(e.qb) };
        }
      } else if (e.flag === 'Holding') {
        text = 'Holding on the ' + O + ', ' + e.penalty + ' yds, no play';
      } else if (e.flag === 'Defensive holding') {
        text = 'Defensive holding on the ' + D + ', ' + e.penalty + ' yds, automatic first down';
      } else if (e.away) {
        text = Q + ' throws it out-of-bounds';
      } else if (e.res === 'c') {
        if (scored) { hl = yds + '-yd touchdown pass'; }
        text = scored ? Q + ' ' + hl + ' to ' + R
          : yds > 0 ? Q + ' ' + yds + '-yd pass to ' + R
          : Q + ' pass to ' + R + (yds === 0 ? ' for no gain' : ' for a ' + -yds + '-yd loss');
        if (scored) {
          tag = 'td';
          post = { kind: 'td', team: keys[off], title: R + ' ' + yds + '-yd touchdown catch',
                   lines: [recLine(R, line(e.to))].concat(ballLine(e.qb, 'pass')), face: num(e.to) };
        } else if (yds >= BIG_PLAY && !e.fum) {
          tag = 'big';
          post = { kind: 'big', team: keys[off], title: R + ' ' + yds + '-yd catch',
                   lines: [recLine(R, line(e.to))].concat(ballLine(e.qb, 'pass')), face: num(e.to) };
        }
      } else if (e.res === 'i') {
        const X = name(e.by);
        if (scored) { hl = yds + '-yd return for a touchdown'; }
        text = Q + ' pass INTERCEPTED by ' + X + (scored ? ', ' + hl : e.tb ? ', touchback' : ', ' + yds + '-yd return');
        tag = scored ? 'td' : 'int';
        /* The passer's line, unless he is a stand-in with none. */
        const thrower = ballLine(e.qb, 'pass');
        post = scored
          ? { kind: 'td', team: keys[def], title: X + ' ' + yds + '-yd pick-six',
              lines: [X + ' (' + plural(line(e.by).ints || 1, 'INT') + ', 1 TD)'].concat(thrower), face: num(e.by) }
          : { kind: 'int', team: keys[def], title: Q + ' Interception, ' + (e.tb ? 'touchback' : yds + '-yd return'),
              lines: [X + ' (' + plural(line(e.by).ints || 1, 'INT') + ')'].concat(thrower), face: num(e.by) };
      } else if (e.flag === 'Pass interference') {
        text = Q + ' pass incomplete to ' + R + ', pass interference on the ' + D + ', ' + e.penalty + ' yds';
      } else if (e.miss === 'drop') {
        text = Q + ' pass to ' + R + ', dropped pass';
      } else if (e.miss === 'oob') {
        text = Q + ' pass to ' + R + ', out-of-bounds';
      } else {
        text = Q + ' pass incomplete' + (e.to !== undefined ? ' to ' + R : '') + (e.pd !== undefined ? ', broken up by ' + name(e.pd) : '');
      }
    }

    /* What a turnover adds to the play. */
    if (e.fum !== undefined) {
      text += ', FUMBLE' + (e.ff !== undefined ? ' forced by ' + name(e.ff) : '') + ', recovered by the ' + D;
      tag = 'fum';
      const B = name(e.fum);
      /* Whoever forced it, or else made the tackle. */
      const by = e.ff !== undefined ? e.ff : e.tk;
      if (by !== undefined) { r = num(by); }
      post = { kind: 'fum', team: keys[def], title: B + ' fumble, recovered by the ' + D,
               lines: (by !== undefined ? [defLine(name(by), line(by))] : []).concat(ballLine(e.fum)),
               face: by !== undefined ? num(by) : undefined };
    }
    if (e.downs) {
      text += ', turnover on downs';
      tag = 'downs';
      const B = e.ball !== undefined ? e.ball : e.to !== undefined && e.res === 'c' ? e.to : e.qb;
      const stop = e.sack !== undefined ? e.sack : e.tk !== undefined ? e.tk : e.pd;
      const what = e.sack !== undefined ? name(B) + ' sacked' : e.res === 'x' || e.away ? name(B) + ' incomplete' : name(B) + ' stopped';
      post = { kind: 'downs', team: keys[def], title: what + ' on 4th & ' + (e.pre.yl + e.pre.tg >= 100 ? 'goal' : e.pre.tg),
               lines: (stop !== undefined ? [defLine(name(stop), line(stop))] : [])
                 .concat(ballLine(B, B === e.qb ? 'pass' : e.to === B ? 'rec' : 'rush'), ['Turnover on downs']),
               face: stop !== undefined ? num(stop) : undefined };
    }
    if (e.safety !== undefined && tag !== 'td') {
      tag = 'safety';
      const by = e.sack !== undefined ? e.sack : e.tk;
      const B = e.sack !== undefined ? e.qb : e.ball !== undefined ? e.ball : e.qb;
      post = { kind: 'safety', team: keys[e.safety],
               title: name(B) + (e.sack !== undefined ? ' sacked' : ' tackled') + ' in the end zone, safety',
               lines: (by !== undefined ? [defLine(name(by), line(by))] : []).concat(ballLine(B, line(B).passAtt ? 'pass' : 'rush')),
               face: by !== undefined ? num(by) : undefined };
    }

    /* The try, and anybody hurt. */
    if (e.try) {
      const said = e.try.two ? '2-pt conversion ' + (e.try.good ? 'good' : 'failed') : name(e.try.k) + ' XP ' + (e.try.good ? 'good' : 'missed');
      more.push(said);
      if (post && post.kind === 'td') {
        post.lines.push(e.try.two ? said : name(e.try.k) + ' XP' + (e.try.good ? '' : ' Missed'));
      }
      if (e.try.k !== undefined) { num(e.try.k); }
    }
    (e.hurt || []).forEach((id) => { num(id); more.push(name(id) + ' hurt on the play'); });

    /* Where the snap left the ball. A score is in the end zone, and the
       kick after it is its own snap. */
    let post2 = state(e.post);
    if (scored) { post2 = { o: keys[e.tdBy], yl: 100, dn: 0, tg: 0, s: e.post.s.slice(), q: e.post.q, c: e.post.c }; }
    if (e.safety !== undefined) { post2 = { o: keys[off], yl: 0, dn: 0, tg: 0, s: e.post.s.slice(), q: e.post.q, c: e.post.c }; }
    if (e.k === 'fg' && e.made) { post2.dn = 0; }

    const entry = { call, text, pre, post: post2 };
    if (w !== undefined) { entry.w = w; }
    if (r !== undefined && r !== w) { entry.r = r; }
    if (hl && text.indexOf(hl) !== -1) {
      entry.hl = hl;
      entry.ht = keys[scored ? e.tdBy : e.safety !== undefined ? e.safety : off];
    }
    if (more.length) { entry.more = more; }
    if (tag) { entry.tag = tag; }
    if (Object.keys(d).length) { entry.d = d; }
    if (Object.keys(t[0]).length || Object.keys(t[1]).length) { entry.t = t; }
    if (Object.keys(fresh).length) { entry.p = fresh; }
    entries.push(entry);

    if (post) {
      post.at = entries.length - 1;
      post.score = e.post.s.slice();
      post.when = whenText(e.pre, kick);
      if (post.face === undefined) { delete post.face; }
      posts.push(post);
    }

    /* A trip into the red zone, once a drive, when the drive has a snap
       still to come (not a kickoff after the half or into overtime). */
    const next = kept.plays[n + 1];
    const half = Boolean(next && e.pre.q <= 2 && next.pre.q >= 3);
    const goes = Boolean(next && next.k !== 'kick' && next.k !== 'free');
    if (!post2.dn || post2.o !== red) { red = null; }
    if (post2.dn && post2.yl >= 100 - RED_ZONE && red === null && goes) {
      red = post2.o;
      posts.push({ at: entries.length - 1, kind: 'redzone', team: post2.o, title: nick(post2.o) + ' are in the REDZONE',
                   lines: [], score: e.post.s.slice(), when: whenText(next.pre) });
    }

    /* Halftime, once the second half's kickoff is next. */
    if (half) {
      const s = e.post.s.slice();
      entries.push({ text: 'Halftime', tag: 'half', pre: { o: null, s, q: 2, c: 0 }, post: { o: null, s, q: 2, c: 0 } });
      posts.push({ at: entries.length - 1, kind: 'half', score: s, top: [topOf(lines, info, keys[0]), topOf(lines, info, keys[1])] });
    }
  });

  /* The final whistle. Nothing is posted for it (Sam, 2026-11-09). */
  const last = kept.plays[kept.plays.length - 1];
  const final = last ? last.post.s.slice() : [0, 0];
  const ot = Boolean(last && last.post.q > 4);
  entries.push({ text: ot ? 'Final/OT' : 'Final', tag: 'end', pre: { o: null, s: final, q: last ? last.post.q : 4, c: 0 },
                 post: { o: null, s: final, q: last ? last.post.q : 4, c: 0 } });

  /* When each entry comes up, from kickoff (TIMING): before every snap, a
     wait of its own showing only where the ball is; then the snap, its
     call first and the whole play `reveal` later; halftime for two
     minutes; the final whistle as soon as the last play has had its time.
     The posts move with the entries they belong to. */
  const timed = [];
  const moved = [];
  let ms = 0;
  entries.forEach((entry, i) => {
    if (entry.call) {
      const spot = Object.assign({}, entry.pre, { s: entry.pre.s.slice() });
      timed.push({ tag: 'wait', pre: spot, post: spot, ms });
      ms += TIMING.wait;
    }
    entry.ms = ms;
    moved[i] = timed.length;
    timed.push(entry);
    if (entry.call) { ms += TIMING.call + TIMING.play; }
    if (entry.tag === 'half') { ms += TIMING.half; }
  });
  posts.forEach((post) => { post.at = moved[post.at]; });

  /* The opening kickoff is the only kickoff the bot posts. */
  let opened = false;
  const kept2 = posts.filter((p) => {
    if (p.kind !== 'kick') { return true; }
    if (opened) { return false; }
    opened = true;
    return true;
  });

  return { entries: timed, posts: kept2, score: final, ot, players: info, lines, length: ms };
}

module.exports = { build, whenText, passLine, rushLine, recLine, kickLine, BIG_PLAY, RED_ZONE, TIMING };
