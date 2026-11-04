/* ==========================================================================
   EGE Football — Live Mode
   A game the NFL sim has played, put out snap by snap for everybody to
   watch at once (Sam, 2026-11-03): #live/{id}, opened from its game on
   the League page. A snap every 20 seconds: first what is called
   ("Jaykeb Stewart pass"), then four seconds later what came of it
   ("Jaykeb Stewart 22-yd pass to Nico Collins"), and sixteen seconds
   after that the next; 30 seconds more before a new drive, 15 more
   before its first snap in the red zone, and two minutes more at
   halftime. PLAY LIVE on the NFL Sim tab puts it up here waiting, and an
   admin kicks it off from this page (Sam, 2026-11-04). An admin can
   pause, end, restart or cancel it from here too, and #live/test plays a
   game on this device alone before it goes live.

   Bets (Sam, 2026-11-04), diamonds only, at least 10 a bet: the spread
   of the bot's first post, a touchdown scorer and three players'
   over/unders until the kickoff, and at halftime a scorer for the rest
   of the game and the spread of the halftime post. They sit under the
   play by play and over the box score, a row a bet, in the teams'
   colours; a pick opens a pop-up for how many diamonds. The menus and
   prices are the NFL Sim tab's
   (nfl-sim/lib/live-bets.js); Supabase takes the bets and pays them at
   the final whistle (live_bet_place, live_settle). A test game takes
   them too, on this device alone, without a diamond moving.

   Supabase keeps the time (live_feed in supabase/schema.sql): every
   answer carries its clock, and the page sets its own by it, so a
   refresh, a phone and a laptop all show the same snap, and nothing
   about a snap reaches the page before it is played. The page asks
   again when the next thing is due -- the reveal, or the next snap --
   and keeps what it already has.

   On the page: the score and the clock, the field with the team that
   has the ball as its mark in a circle at the line of scrimmage and the
   first-down line in orange, the snap being played, every snap so far
   (newest first, each with the face of whoever it names) and the box
   score as it stands (js/app.js draws it,
   EGE.leagueBoxScore). The NFL Sim tab puts a game on
   (js/nfl-sim-admin.js); the Discord bot's posts go from Supabase.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.liveView = (function () {
  'use strict';

  var DOWNS = ['', '1st', '2nd', '3rd', '4th'];
  var QUARTERS = ['', '1st Quarter', '2nd Quarter', '3rd Quarter', '4th Quarter'];
  var TAGS = { td: 'Touchdown', fg: 'Field goal', int: 'Interception', fum: 'Fumble', downs: 'Turnover on downs',
               safety: 'Safety', big: 'Big play', punt: 'Punt' };

  var COLUMNS = 'id, season, week, home, away, title, starts_at, slot_ms, reveal_ms, plays, length_ms, paused_at';
  var TEST_KEY = 'ege.liveTest';
  var SPEEDS = [1, 2, 5, 10];

  var view = null;
  var game = null;          /* { id, row, entries, clockAt, paused, at, shown, next, test, ... } */
  var confirming = '';      /* the admin button waiting on a second click */
  var timer = null;
  var ticker = null;
  var games = null;         /* every live game, for the League page */
  var gamesAt = 0;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text != null) { node.textContent = text; }
    return node;
  }

  function client() { return EGE.auth && EGE.auth.supabaseClient ? EGE.auth.supabaseClient() : null; }

  function team(key) { return (EGE.nfl && EGE.nfl.teams[key]) || { name: key, color: '#1d2416' }; }

  function nick(key) { return team(key).name.split(' ').slice(-1)[0]; }

  function logo(key, size, own) {
    var t = team(key);
    var src = own ? EGE.nfl.logo(key) : (EGE.logoFor ? EGE.logoFor(t.name) : null);
    if (!src) { return el('span', 'ege-cast__logo'); }
    var img = el('img', 'ege-cast__logo');
    img.src = src;
    img.alt = '';
    img.width = size;
    img.height = size;
    img.addEventListener('error', function () { img.remove(); });
    return img;
  }

  /* --- the live games, for the League page --------------------------------- */

  /* Every game put on live, newest first; asked again after a minute. */
  function loadGames(force) {
    if (games && !force && Date.now() - gamesAt < 60000) { return games; }
    var c = client();
    gamesAt = Date.now();
    games = !c ? Promise.resolve([]) : c.from('live_games')
      .select(COLUMNS)
      .order('created_at', { ascending: false }).limit(60)
      .then(function (res) { return res.error ? [] : (res.data || []); }, function () { return []; });
    return games;
  }

  function length(row) { return row.length_ms || row.plays * row.slot_ms; }

  /* When it ends; a paused game has not, nor one still waiting for its
     kickoff. */
  function ends(row) { return row.paused_at || !row.starts_at ? Infinity : Date.parse(row.starts_at) + length(row); }

  /* 'soon', 'live' or 'final', by this device's clock (near enough for a
     badge; the page itself goes by Supabase's). */
  function phase(row) {
    var now = Date.now();
    if (!row.starts_at) { return 'soon'; }
    if (row.paused_at) { return Date.parse(row.paused_at) < Date.parse(row.starts_at) ? 'soon' : 'live'; }
    if (now < Date.parse(row.starts_at)) { return 'soon'; }
    return now < ends(row) ? 'live' : 'final';
  }

  /* The live game between two teams that week, or null. */
  function gameFor(rows, season, week, home, away) {
    return (rows || []).filter(function (r) {
      return r.season === season && r.week === week &&
        ((r.home === home && r.away === away) || (r.home === away && r.away === home));
    })[0] || null;
  }

  /* --- the clock ------------------------------------------------------------ */

  /* The game's clock: milliseconds from kickoff (less than nothing before
     it), as the last answer had it and run on by this device's since,
     unless the game is paused. A test game runs on this device alone, at
     the speed picked for it. */
  function clock() {
    if (!game || !game.clockAt) { return -Infinity; }
    if (game.paused) { return game.clockAt.ms; }
    return game.clockAt.ms + (Date.now() - game.clockAt.real) * (game.speed || 1);
  }

  /* When an entry comes up, from kickoff. */
  function entryMs(i) {
    var e = game.entries[i];
    return e && typeof e.ms === 'number' ? e.ms : i * game.slot;
  }

  function clockText(seconds) {
    var t = Math.max(0, Math.round(seconds || 0));
    return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
  }

  function quarterText(q) { return q > 4 ? (q === 5 ? 'OT' : 'OT' + (q - 4)) : 'Q' + q; }

  /* "HOU 22", "CIN 35", "50": a yard line from the side of the field it
     is on. */
  function spotText(at) {
    if (at.yl === 50) { return '50'; }
    var other = at.o === game.row.home ? game.row.away : game.row.home;
    return at.yl < 50 ? at.o + ' ' + at.yl : other + ' ' + (100 - at.yl);
  }

  function downText(at) {
    if (!at || !at.dn || !at.o) { return ''; }
    return DOWNS[at.dn] + ' & ' + (at.yl + at.tg >= 100 ? 'Goal' : at.tg) + ' at ' + spotText(at);
  }

  /* --- asking Supabase ------------------------------------------------------- */

  function fetchFeed() {
    if (game && game.test) { return Promise.resolve(take(testFeed(game.done), 0, 0)); }
    var c = client();
    if (!c || !game) { return Promise.reject(new Error('Not connected.')); }
    var id = game.id;
    var from = game.done;
    var sent = Date.now();
    return c.rpc('live_feed', { p_id: id, p_from: from }).then(function (res) {
      if (!game || game.id !== id) { return null; }
      if (res.error) { throw new Error(res.error.message); }
      if (!res.data) { game.missing = true; return null; }
      return take(res.data, sent, Date.now());
    });
  }

  /* An answer, kept: the game's clock as it was halfway between asking
     and hearing back, and the snaps it brought. */
  function take(got, sent, back) {
    game.waiting = Boolean(got.waiting);
    game.half = got.half || null;
    if (!game.test) {
      game.clockAt = got.waiting ? null : { ms: got.clock, real: Math.round((sent + back) / 2) };
      game.paused = Boolean(got.paused);
    }
    game.slot = got.slot;
    game.reveal = got.reveal;
    game.plays = got.plays;
    game.at = got.at;
    game.shown = got.shown;
    game.next = typeof got.next === 'number' ? got.next : null;
    /* Started again from the kickoff (or earlier than what is here): ask
       for everything over. */
    if (got.from > Math.max(got.at, 0) + 1 || (got.at < 0 && game.done > 0)) {
      game.entries = [];
      game.done = 0;
      game.again = true;
      return got;
    }
    game.entries = game.entries.slice(0, got.from).concat(got.entries || []);
    var last = game.entries[game.entries.length - 1];
    game.done = game.entries.length - (last && last.hidden ? 1 : 0);
    return got;
  }

  /* When the next thing is due, by the game's clock: kickoff, the snap's
     reveal, or the next snap. Null once the game is over. */
  function nextDue() {
    if (game.waiting) { return null; }
    if (game.at < 0) { return 0; }
    var current = game.entries[game.at];
    if (current && current.hidden) { return entryMs(game.at) + game.reveal; }
    if (game.at >= game.plays - 1) { return null; }
    return game.next !== null ? game.next : (game.at + 1) * game.slot;
  }

  function schedule(wait) {
    window.clearTimeout(timer);
    timer = window.setTimeout(tick, Math.max(120, wait));
  }

  function tick() {
    if (!game) { return; }
    var had = game.at + ':' + game.done;
    var was = game.drawn;
    var mine = game;
    fetchFeed().then(function () {
      if (game !== mine) { return; }
      if (game.missing) { drawMissing(); return; }
      if (game.again) { game.again = false; tick(); return; }
      /* Waiting for the kickoff: ask now and then whether it has come,
         and leave the page (and a bet being typed) alone until it has. */
      var now = (game.waiting ? 'w' : '') + (game.paused ? 'p' : '') + game.at + ':' + game.done;
      if (!(game.waiting && was === now)) { draw(); }
      game.drawn = now;
      if (game.waiting) { if (!game.test) { schedule(4000); } return; }
      settleIfOver();
      /* Paused: ask now and then whether it has started again. */
      if (game.paused) { if (!game.test) { schedule(4000); } return; }
      var due = nextDue();
      if (due === null) { return; }
      var wait = (due - clock()) / (game.speed || 1);
      /* The answer came back before the clock turned over: a moment more. */
      var stuck = had === game.at + ':' + game.done;
      schedule(stuck ? Math.max(800, wait + 150) : wait + 150);
    }).catch(function () {
      if (game === mine) { schedule(3000); }
    });
  }

  /* --- drawing --------------------------------------------------------------- */

  /* Everything the shown snaps add up to: each player's line, each team's
     numbers, the scoring plays. */
  function totals() {
    var info = {};
    var lines = {};
    var teams = [{}, {}];
    var scoring = [];
    var before = [0, 0];
    game.entries.forEach(function (e) {
      if (e.hidden) { return; }
      Object.keys(e.p || {}).forEach(function (i) { info[i] = e.p[i]; });
      Object.keys(e.d || {}).forEach(function (i) {
        var l = lines[i] || (lines[i] = {});
        Object.keys(e.d[i]).forEach(function (k) {
          l[k] = /Long$/.test(k) ? Math.max(l[k] || 0, e.d[i][k]) : (l[k] || 0) + e.d[i][k];
        });
      });
      (e.t || []).forEach(function (t, side) {
        Object.keys(t).forEach(function (k) { teams[side][k] = (teams[side][k] || 0) + t[k]; });
      });
      var s = e.post && e.post.s;
      if (s && (s[0] !== before[0] || s[1] !== before[1])) {
        var by = s[0] - before[0] > s[1] - before[1] ? game.row.home : game.row.away;
        scoring.push('Q' + e.post.q + ' ' + clockText(e.post.c) + ' ' + by + ' ' + e.text + ' (' + s[0] + '-' + s[1] + ')');
        before = s.slice();
      }
    });
    var box = Object.keys(lines).filter(function (i) { return info[i]; }).map(function (i) {
      var p = info[i];
      return Object.assign({ name: p.n, pos: p.pos, team: p.t, espn: p.e || null, ege: p.g || null,
                             collegePhoto: Boolean(p.c) }, lines[i]);
    });
    return { box: box, teams: teams, scoring: scoring };
  }

  /* Everybody the snaps so far have named, by number; of the snap being
     called, only whoever the call names. */
  function people() {
    var info = {};
    game.entries.forEach(function (e) {
      Object.keys(e.p || {}).forEach(function (i) { info[i] = e.p[i]; });
    });
    return info;
  }

  /* A player's face cut to a circle on his team's colour (Sam,
     2026-11-03), or the team's mark where there is no picture of him. */
  function face(n, side, info) {
    var p = n === undefined || n === null ? null : info[n];
    var key = p ? p.t : side;
    var box = el('span', 'ege-cast__face');
    box.style.setProperty('--team', team(key).color);
    var mine = p && p.g && EGE.playerBySlug ? EGE.playerBySlug(p.g) : null;
    var src = mine && mine.headshot ? mine.headshot
      : p && p.e && EGE.espnHeadshot ? EGE.espnHeadshot(p.e, p.c, 96, 70) : null;
    function mark() {
      box.classList.add('is-mark');
      if (key) { box.appendChild(logo(key, 28)); }
    }
    if (src) {
      var img = el('img', 'ege-cast__headshot');
      img.src = src;
      img.alt = '';
      img.loading = 'lazy';
      img.addEventListener('error', function () { img.remove(); mark(); });
      box.appendChild(img);
    } else {
      mark();
    }
    return box;
  }

  /* A snap's words, a scoring play's past the player's name in the colour
     of the side that scored (Sam, 2026-11-03). */
  function said(e, className) {
    var line = el('p', className);
    var i = e.hl ? e.text.indexOf(e.hl) : -1;
    if (i < 0) { line.textContent = e.text; return line; }
    line.appendChild(document.createTextNode(e.text.slice(0, i)));
    var hl = el('span', 'ege-cast__hl', e.hl);
    hl.style.color = team(e.ht).color;
    line.appendChild(hl);
    line.appendChild(document.createTextNode(e.text.slice(i + e.hl.length)));
    return line;
  }

  /* Where the ball is as far as anybody may know. */
  function where() {
    var current = game.entries[game.at];
    if (!current) { return null; }
    if (current.hidden) { return current.pre; }
    return current.post || current.pre;
  }

  function scoreNow() {
    var at = where();
    return at && at.s ? at.s : [0, 0];
  }

  function drawMissing() {
    view.innerHTML = '';
    view.appendChild(el('p', 'ege-note ege-cast__note', 'No such game.'));
  }

  function drawHead(at) {
    var row = game.row;
    var head = el('header', 'ege-cast__head');
    var state = phaseNow();
    var kicker = el('p', 'fb-kicker ege-cast__kicker');
    if (state === 'live' && !game.paused) { kicker.appendChild(el('span', 'ege-cast__dot')); }
    kicker.appendChild(document.createTextNode((game.test ? 'Test · ' : '') +
      (game.waiting ? 'Pregame' : game.paused && state !== 'final' ? 'Paused' : state === 'live' ? 'Live'
        : state === 'final' ? 'Final' : 'Kickoff soon')));
    head.appendChild(kicker);

    var board = el('div', 'ege-cast__board');
    var s = scoreNow();
    [[row.away, s[1]], [row.home, s[0]]].forEach(function (side, i) {
      var box = el('div', 'ege-cast__team ege-cast__team--' + (i ? 'home' : 'away'));
      box.style.setProperty('--team', team(side[0]).color);
      box.appendChild(logo(side[0], 54));
      var name = el('div', 'ege-cast__teamname');
      name.appendChild(el('span', 'ege-cast__city', EGE.nfl.city(side[0])));
      name.appendChild(el('span', 'ege-cast__nick', nick(side[0])));
      box.appendChild(name);
      var pts = el('span', 'ege-cast__pts', String(side[1]));
      if (at && at.o === side[0] && state === 'live') { box.classList.add('has-ball'); }
      box.appendChild(pts);
      board.appendChild(box);
      if (!i) {
        var mid = el('div', 'ege-cast__clock');
        if (state === 'soon' && game.waiting) {
          mid.appendChild(el('span', 'ege-cast__time', 'Q1 15:00'));
        } else if (state === 'soon') {
          mid.appendChild(el('span', 'ege-cast__time', clockText(-clock() / 1000 / (game.speed || 1))));
          mid.appendChild(el('span', 'ege-cast__down', 'to kickoff'));
        } else if (state === 'final') {
          var last = game.entries[game.entries.length - 1];
          mid.appendChild(el('span', 'ege-cast__time', last && last.text ? last.text : 'Final'));
        } else if (at) {
          var half = game.entries[game.at] && game.entries[game.at].tag === 'half';
          mid.appendChild(el('span', 'ege-cast__time', half ? 'Half' : quarterText(at.q) + ' ' + clockText(at.c)));
          mid.appendChild(el('span', 'ege-cast__down', half ? '' : downText(at)));
        }
        board.appendChild(mid);
      }
    });
    head.appendChild(board);
    return head;
  }

  function phaseNow() {
    if (game.waiting || game.at < 0) { return 'soon'; }
    var last = game.entries[game.at];
    return game.at >= game.plays - 1 && last && !last.hidden ? 'final' : 'live';
  }

  /* The field, the away side's end zone on the left and the home side's on
     the right: the ball where the snap is, in a circle with the mark of
     the team that has it, and the first-down line in orange. */
  function fieldPct(at, yl) {
    var x = at.o === game.row.home ? 100 - yl : yl;
    return 8.333 + x * 0.83333;
  }

  function fieldX(at, yl) { return 'calc(' + fieldPct(at, yl) + '%)'; }

  function drawField(at) {
    var row = game.row;
    var field = el('div', 'ege-cast__field');
    field.setAttribute('role', 'img');
    var zones = [[row.away, 'left'], [row.home, 'right']];
    zones.forEach(function (z) {
      var zone = el('div', 'ege-cast__zone ege-cast__zone--' + z[1]);
      zone.style.background = team(z[0]).color;
      zone.appendChild(el('span', 'ege-cast__zonename', nick(z[0]).toUpperCase()));
      field.appendChild(zone);
    });
    for (var y = 5; y < 100; y += 5) {
      var line = el('span', 'ege-cast__yard' + (y % 10 ? ' is-five' : ''));
      line.style.left = 'calc(' + (8.333 + y * 0.83333) + '%)';
      field.appendChild(line);
      if (!(y % 10)) {
        var n = y > 50 ? 100 - y : y;
        ['top', 'bottom'].forEach(function (edge) {
          var num = el('span', 'ege-cast__num ege-cast__num--' + edge, String(n));
          num.style.left = 'calc(' + (8.333 + y * 0.83333) + '%)';
          field.appendChild(num);
        });
      }
    }
    var mid = el('span', 'ege-cast__mid');
    mid.appendChild(logo(row.home, 64, false));
    field.appendChild(mid);

    /* Once a snap's result is out, the lines and the ball stay where it
       started, with an arrow to where it ended, until the next snap moves
       them (Sam, 2026-11-03). */
    var cur = game.entries[game.at];
    var played = cur && !cur.hidden && cur.call && cur.pre && cur.pre.o && cur.post && cur.post.o &&
      phaseNow() === 'live' ? cur : null;
    if (played) { at = played.pre; }
    if (at && at.o && phaseNow() !== 'final') {
      if (played) {
        var from = fieldPct(played.pre, played.pre.yl);
        var to = fieldPct(played.post, played.post.yl);
        if (Math.abs(to - from) >= 0.4) {
          var arrow = el('span', 'ege-cast__arrow' + (to < from ? ' is-back' : ''));
          /* Its head (12px past the bar) ends right on the spot. */
          arrow.style.left = to < from ? 'calc(' + to + '% + 12px)' : from + '%';
          arrow.style.width = 'max(0px, calc(' + Math.abs(to - from) + '% - 12px))';
          field.appendChild(arrow);
        }
      }
      var label = nick(at.o) + ' ball' + (at.dn ? ', ' + downText(at) : '');
      field.setAttribute('aria-label', label);
      if (at.dn && at.yl + at.tg < 100) {
        var first = el('span', 'ege-cast__first');
        first.style.left = fieldX(at, at.yl + at.tg);
        field.appendChild(first);
      }
      var los = el('span', 'ege-cast__los');
      los.style.left = fieldX(at, at.yl);
      field.appendChild(los);
      var ball = el('span', 'ege-cast__ball');
      ball.style.left = fieldX(at, at.yl);
      ball.style.setProperty('--team', team(at.o).color);
      ball.appendChild(logo(at.o, 40, true));
      field.appendChild(ball);
    } else {
      field.setAttribute('aria-label', 'The field');
    }
    return field;
  }

  /* The snap being played: what was called, and once it is out, what came
     of it, with a bar for the time it has left. */
  function drawPlay() {
    var card = el('section', 'fb-panel ege-cast__play');
    var state = phaseNow();
    if (state === 'soon') {
      card.appendChild(el('p', 'ege-cast__call', nick(game.row.away) + (game.row.title.indexOf(' vs. ') !== -1 ? ' vs. ' : ' at ') + nick(game.row.home)));
      card.appendChild(el('p', 'fb-meta ege-cast__when', game.waiting ? 'Waiting for kickoff' : game.paused ? 'Paused'
        : 'Kicks off at ' + new Date(Date.now() - clock() / (game.speed || 1)).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })));
      return card;
    }
    var e = game.entries[game.at];
    if (!e) { return card; }
    if (state === 'final') {
      var s = scoreNow();
      var lead = s[0] - s[1];
      card.appendChild(el('span', 'ege-cast__tag', e.text));
      card.appendChild(el('p', 'ege-cast__text', lead
        ? nick(lead > 0 ? game.row.home : game.row.away) + ' win ' + Math.max(s[0], s[1]) + '-' + Math.min(s[0], s[1])
        : 'Tied ' + s[0] + '-' + s[1]));
      return card;
    }
    if (e.tag && TAGS[e.tag] && !e.hidden) {
      card.classList.add('is-' + e.tag);
      card.appendChild(el('span', 'ege-cast__tag', TAGS[e.tag]));
    }
    var who = el('div', 'ege-cast__who');
    var words = el('div', 'ege-cast__words');
    if (e.call) { who.appendChild(face(e.hidden || e.r === undefined ? e.w : e.r, e.pre && e.pre.o, people())); }
    if (e.hidden) {
      var call = el('p', 'ege-cast__call');
      call.appendChild(document.createTextNode(e.call));
      call.appendChild(el('span', 'ege-cast__dots', '…'));
      words.appendChild(call);
    } else {
      if (e.call) { words.appendChild(el('p', 'ege-cast__called', e.call)); }
      words.appendChild(said(e, 'ege-cast__text'));
      (e.more || []).forEach(function (m) { words.appendChild(el('p', 'ege-cast__more', m)); });
    }
    who.appendChild(words);
    card.appendChild(who);
    if (state === 'live') {
      /* The time to the next snap: a snap's 20 seconds until its result is
         out, then however long the wait really is (longer before a new
         drive or the red zone). */
      var bar = el('span', 'ege-cast__bar');
      var fill = el('span', 'ege-cast__fill');
      var start = entryMs(game.at);
      var end = !e.hidden && game.next !== null ? game.next : start + game.slot;
      var gone = Math.min(1, Math.max(0, (clock() - start) / (end - start)));
      fill.style.width = (gone * 100) + '%';
      bar.appendChild(fill);
      card.appendChild(bar);
      if (!game.paused) {
        window.requestAnimationFrame(function () {
          window.requestAnimationFrame(function () {
            fill.style.transition = 'width ' + Math.max(0, (end - clock()) / (game.speed || 1)) + 'ms linear';
            fill.style.width = '100%';
          });
        });
      }
    }
    return card;
  }

  /* Every snap so far, newest first, a line across at each quarter. */
  function drawFeed() {
    var box = el('section', 'fb-panel ege-cast__feed');
    var head = el('div', 'fb-panel__head');
    head.appendChild(el('h3', null, 'Play by play'));
    box.appendChild(head);
    var list = el('ol', 'ege-cast__list');
    var shown = game.entries.filter(function (e, i) { return !e.hidden && i < game.at; });
    var info = people();
    var lastQ = null;
    /* Where a quarter starts: under its first snap, the list being newest
       first. */
    function started() {
      if (lastQ !== null) { list.appendChild(el('li', 'ege-cast__break', QUARTERS[lastQ] || 'Overtime')); }
      lastQ = null;
    }
    for (var i = shown.length - 1; i >= 0; i -= 1) {
      var e = shown[i];
      var q = e.pre && e.pre.q;
      if (e.tag === 'half' || e.tag === 'end') {
        started();
        list.appendChild(el('li', 'ege-cast__break', e.text));
        continue;
      }
      if (lastQ !== null && q !== lastQ) { started(); }
      lastQ = q;
      var item = el('li', 'ege-cast__item' + (e.tag && TAGS[e.tag] ? ' is-' + e.tag : ''));
      item.appendChild(face(e.r !== undefined ? e.r : e.w, e.pre.o, info));
      var body = el('div', 'ege-cast__body');
      var meta = el('div', 'ege-cast__meta');
      meta.appendChild(logo(e.pre.o, 18));
      meta.appendChild(el('span', null, quarterText(e.pre.q) + ' ' + clockText(e.pre.c) + (e.pre.dn ? ' · ' + downText(e.pre) : '')));
      body.appendChild(meta);
      body.appendChild(said(e, 'ege-cast__line'));
      (e.more || []).forEach(function (m) { body.appendChild(el('p', 'ege-cast__more', m)); });
      if (e.tag === 'td' || e.tag === 'fg' || e.tag === 'safety') {
        body.appendChild(el('p', 'ege-cast__score', nick(game.row.away) + ' ' + e.post.s[1] + ', ' + nick(game.row.home) + ' ' + e.post.s[0]));
      }
      item.appendChild(body);
      list.appendChild(item);
    }
    started();
    if (!list.firstChild) { list.appendChild(el('li', 'ege-cast__empty', 'Nothing yet.')); }
    box.appendChild(list);
    return box;
  }

  function drawBox() {
    if (!EGE.leagueBoxScore) { return null; }
    var t = totals();
    if (!t.box.length) { return null; }
    var s = scoreNow();
    var last = game.entries[game.entries.length - 1];
    return EGE.leagueBoxScore({
      home: game.row.home, away: game.row.away, score: s.slice(),
      ot: Boolean(last && last.tag === 'end' && last.post && last.post.q > 4),
      box: t.box, teams: t.teams, scoring: t.scoring, injuries: [], six: []
    }, game.row.season, game.row.week);
  }

  function draw() {
    if (!view || !game || !game.row) { return; }
    var keepFeed = view.querySelector('.ege-cast__list');
    var feedScroll = keepFeed ? keepFeed.scrollTop : 0;
    /* The player list open, or a pick being made: the bets box is left
       where it is, and the rest drawn around it. */
    var keep = view.querySelector('.ege-cast__bets');
    if (!(keep && (picker || keep.contains(document.activeElement)) && keep.getAttribute('data-open') === betsKey())) { keep = null; }
    var at = where();
    Array.prototype.slice.call(view.childNodes).forEach(function (n) { if (n !== keep) { view.removeChild(n); } });
    function put(node) { if (node) { view.insertBefore(node, keep); } }
    put(drawHead(at));
    put(drawControls());
    put(drawField(at));
    var cols = el('div', 'ege-cast__cols');
    var side = el('div', 'ege-cast__side');
    side.appendChild(drawPlay());
    if (phaseNow() !== 'soon') { side.appendChild(drawFeed()); }
    cols.appendChild(side);
    put(cols);
    if (!keep) { put(drawBets()); }
    var box = drawBox();
    if (box) {
      box.classList.add('ege-cast__box');
      view.appendChild(box);
    }
    var list = view.querySelector('.ege-cast__list');
    if (list && feedScroll) { list.scrollTop = feedScroll; }
    document.title = nick(game.row.away) + ' ' + scoreNow()[1] + ', ' + nick(game.row.home) + ' ' + scoreNow()[0];
  }

  /* --- bets -------------------------------------------------------------------

     Diamonds on the game (Sam, 2026-11-04): whatever is open now -- the
     menu before kickoff, the halftime one until the second half kicks off
     -- and every bet this player has on it, paid once the final whistle
     has gone. A bet is final once it is in. */

  var slip = null;          /* the pick a bet is being made on: { market, pick, stake, error, busy } */
  var sheet = null;         /* its pop-up, while it is open */
  var picker = null;        /* the market whose player list is open */
  var lastStake = null;     /* what this player bet last, where the next pop-up starts */
  var wallet = { email: null, diamonds: null, heard: false };
  var settling = false;

  function gems(n) {
    var wrap = el('span', 'ege-price', String(n));
    var gem = el('span', 'ege-gem');
    gem.setAttribute('role', 'img');
    gem.setAttribute('aria-label', 'diamonds');
    wrap.appendChild(gem);
    return wrap;
  }

  function times(x) { return (x % 1 ? String(Math.round(x * 100) / 100) : Number(x).toFixed(1)) + '×'; }

  function pays(stake, x) { return Math.round(stake * x); }

  /* The bets on offer, each with whether it is open now. */
  function menus() {
    var out = [];
    var pre = game.row && game.row.bets;
    (pre && pre.markets || []).forEach(function (m) { out.push({ m: m, open: Boolean(game.waiting) }); });
    (game.half && game.half.markets || []).forEach(function (m) { out.push({ m: m, open: Boolean(game.half.open) }); });
    return out;
  }

  function minStake() { return (game.row && game.row.bets && game.row.bets.min) || 10; }

  function marketOf(id) {
    return menus().map(function (x) { return x.m; }).filter(function (m) { return m.id === id; })[0] || null;
  }

  function myBet(id) { return (game.mine || []).filter(function (b) { return b.market === id; })[0] || null; }

  /* What this player has to bet with: a test game's bets come out of it
     only on this page. */
  function balance() {
    if (typeof wallet.diamonds !== 'number') { return null; }
    if (!game.test) { return wallet.diamonds; }
    return (game.mine || []).reduce(function (n, b) { return n - b.stake + (b.settled_at ? b.payout : 0); }, wallet.diamonds);
  }

  function marketTitle(m) {
    if (m.kind === 'spread') { return m.half ? 'Halftime spread' : 'Spread'; }
    if (m.kind === 'td') { return m.half ? '2nd half touchdown' : 'Anytime touchdown'; }
    return 'Over/under';
  }

  function lineText(n) { return (n > 0 ? '+' : '') + n; }

  /* "Cooper Clark O/U 73.5 rushing yards" (Sam, 2026-11-04). */
  function propText(m) { return m.who.n + ' O/U ' + m.line + ' ' + m.label.toLowerCase(); }

  function pickText(m, pick) {
    if (m.kind === 'spread') { return nick(pick.t) + ' ' + lineText(pick.line); }
    if (m.kind === 'td') { return pick.n; }
    return m.who.n + ' ' + pick.id + ' ' + m.line + ' ' + m.label.toLowerCase();
  }

  /* Who a pick is on: a player, or null for a side of the spread. */
  function pickWho(m, pick) { return m.kind === 'prop' ? m.who : m.kind === 'td' ? pick : null; }

  /* Whose colours a pick is in. */
  function pickTeam(m, pick) { return m.kind === 'prop' ? m.who.t : pick && pick.t; }

  /* A box in a team's colours (Sam, 2026-11-04): the colour itself, and
     a wash of it for what sits on the page. */
  function paint(node, key) {
    var hex = /^#([0-9a-f]{6})$/i.exec(team(key).color || '');
    var n = hex ? parseInt(hex[1], 16) : 0x1d2416;
    node.style.setProperty('--team', team(key).color);
    node.style.setProperty('--team-wash', 'rgba(' + (n >> 16) + ', ' + ((n >> 8) & 255) + ', ' + (n & 255) + ', .13)');
    return node;
  }

  /* A team's mark on a white coin, so it reads on its own colour. */
  function coin(key, size) {
    var c = el('span', 'ege-cast__coin');
    c.appendChild(logo(key, size));
    return c;
  }

  /* A player's picture in the bets (Sam, 2026-11-04): no circle round
     it, his team's mark at its bottom right. The mark alone where there
     is no picture of him. */
  function mug(p) {
    var box = el('span', 'ege-cast__mug');
    var mine = p.g && EGE.playerBySlug ? EGE.playerBySlug(p.g) : null;
    var src = mine && mine.headshot ? mine.headshot
      : p.e && EGE.espnHeadshot ? EGE.espnHeadshot(p.e, p.c, 192, 140) : null;
    var badge = el('span', 'ege-cast__mugteam');
    badge.appendChild(logo(p.t, 24));
    function bare() {
      box.classList.add('is-mark');
      badge.remove();
      box.appendChild(logo(p.t, 48));
    }
    if (src) {
      var img = el('img', 'ege-cast__mugimg');
      img.src = src;
      img.alt = '';
      img.loading = 'lazy';
      img.addEventListener('error', function () { img.remove(); bare(); });
      box.appendChild(img);
      box.appendChild(badge);
    } else {
      bare();
    }
    return box;
  }

  function loadWallet() {
    if (!wallet.heard && EGE.auth && EGE.auth.onChange) {
      wallet.heard = true;
      EGE.auth.onChange(function () { if (game && game.row) { loadWallet(); } });
      return;
    }
    var me = EGE.auth && EGE.auth.currentPlayer ? EGE.auth.currentPlayer() : null;
    wallet.email = me ? me.email : null;
    wallet.diamonds = null;
    var mine = game;
    var c = client();
    if (!wallet.email || !c) { redrawBets(); return; }
    Promise.all([
      EGE.wallet.diamondsFor(wallet.email),
      game.test ? null : c.from('live_bets').select('market, pick, stake, x, payout, settled_at').eq('game_id', game.id)
    ]).then(function (got) {
      if (game !== mine) { return; }
      wallet.diamonds = got[0];
      if (got[1] && !got[1].error) { game.mine = got[1].data || []; }
      redrawBets();
      settleIfOver();
    });
  }

  function walletMoved() {
    if (game.test || typeof wallet.diamonds !== 'number') { return; }
    document.dispatchEvent(new window.CustomEvent('ege:wallet', { detail: { diamonds: wallet.diamonds } }));
  }

  /* The most a bet can be: every diamond this player has. */
  function maxStake() {
    var have = balance();
    return typeof have === 'number' ? Math.max(0, Math.floor(have)) : null;
  }

  function placeBet(m, pick) {
    var stake = Math.floor(Number(slip.stake));
    var min = minStake();
    var have = balance();
    slip.error = null;
    if (!(stake >= min)) { slip.error = 'Bet at least ' + min + ' diamonds.'; drawSheet(); return; }
    if (typeof have === 'number' && stake > have) { slip.error = 'Not enough diamonds.'; drawSheet(); return; }
    lastStake = stake;
    if (game.test) {
      test.mine = (test.mine || []).concat([{ market: m.id, pick: pick.id, stake: stake, x: pick.x, payout: null, settled_at: null }]);
      game.mine = test.mine;
      saveTest();
      closeSlip();
      redrawBets();
      return;
    }
    var c = client();
    if (!c) { slip.error = 'Not connected.'; drawSheet(); return; }
    slip.busy = true;
    drawSheet();
    var mine = game;
    var was = slip;
    c.rpc('live_bet_place', { p_game: game.id, p_market: m.id, p_pick: pick.id, p_stake: stake }).then(function (res) {
      if (game !== mine || slip !== was) { return; }
      if (res.error) {
        slip.busy = false;
        slip.error = String(res.error.message || 'That bet did not go in.').replace(/\s*CONTEXT:.*$/, '');
        drawSheet();
        return;
      }
      wallet.diamonds = Number(res.data.diamonds);
      game.mine = (game.mine || []).concat([res.data.bet]);
      closeSlip();
      walletMoved();
      redrawBets();
    }, function () {
      if (game !== mine || slip !== was) { return; }
      slip.busy = false;
      slip.error = 'That bet did not go in.';
      drawSheet();
    });
  }

  /* The final whistle has gone: the bets paid (Supabase pays them; asking
     is enough), and what they came to brought back. A test game's are
     worked out here, from its results. */
  function settleIfOver(tries) {
    if (!game || phaseNow() !== 'final' || settling) { return; }
    var open = (game.mine || []).filter(function (b) { return !b.settled_at; });
    if (!open.length) { return; }
    if (game.test) {
      var res = (test.bets && test.bets.results) || {};
      open.forEach(function (b) {
        b.payout = (res.push || []).indexOf(b.market) !== -1 ? b.stake
          : (res[b.market] || []).indexOf(b.pick) !== -1 ? pays(b.stake, b.x) : 0;
        b.settled_at = new Date().toISOString();
      });
      saveTest();
      redrawBets();
      return;
    }
    var c = client();
    if (!c) { return; }
    settling = true;
    var mine = game;
    c.rpc('live_settle', { p_id: game.id }).then(function () {
      return c.from('live_bets').select('market, pick, stake, x, payout, settled_at').eq('game_id', mine.id);
    }).then(function (res) {
      settling = false;
      if (game !== mine || res.error) { return; }
      game.mine = res.data || [];
      var left = game.mine.some(function (b) { return !b.settled_at; });
      /* This page's clock ran a moment ahead of Supabase's: again shortly. */
      if (left && (tries || 0) < 6) { window.setTimeout(function () { if (game === mine) { settleIfOver((tries || 0) + 1); } }, 5000); }
      return EGE.wallet.diamondsFor(wallet.email).then(function (n) {
        if (game !== mine) { return; }
        wallet.diamonds = n;
        walletMoved();
        redrawBets();
      });
    }, function () { settling = false; });
  }

  /* --- the bet pop-up: how many diamonds, typed or slid from the least a
     bet can be to every diamond this player has (Sam, 2026-11-04). */

  function openSlip(m, pick) {
    picker = null;
    var max = maxStake();
    var start = lastStake || minStake();
    if (typeof max === 'number' && max >= minStake()) { start = Math.min(start, max); }
    slip = { market: m.id, pick: pick.id, stake: start, error: null, busy: false };
    drawSheet();
    redrawBets();
  }

  function closeSlip() {
    slip = null;
    if (sheet) {
      sheet.remove();
      sheet = null;
      document.removeEventListener('keydown', sheetKey);
      document.documentElement.classList.remove('ege-cast-sheet-open');
    }
  }

  function sheetKey(ev) {
    if (ev.key === 'Escape' && slip && !slip.busy) { closeSlip(); redrawBets(); }
  }

  function drawSheet() {
    if (!slip || !game) { return; }
    var m = marketOf(slip.market);
    var pick = m ? m.picks.filter(function (p) { return p.id === slip.pick; })[0] : null;
    if (!m || !pick) { closeSlip(); return; }
    var fresh = !sheet;
    if (fresh) {
      sheet = el('div', 'fb-backdrop ege-cast__sheetback');
      sheet.addEventListener('click', function (ev) {
        if (ev.target === sheet && slip && !slip.busy) { closeSlip(); redrawBets(); }
      });
      document.addEventListener('keydown', sheetKey);
      document.documentElement.classList.add('ege-cast-sheet-open');
      document.body.appendChild(sheet);
    }
    sheet.innerHTML = '';
    var min = minStake();
    var max = maxStake();
    var short = typeof max === 'number' && max < min;
    var top = typeof max === 'number' ? Math.max(max, min) : Math.max(min, Number(slip.stake) || min);

    var box = paint(el('div', 'fb-modal ege-cast__sheet'), pickTeam(m, pick));
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', marketTitle(m) + ': ' + pickText(m, pick));
    var head = el('div', 'ege-cast__sheethead');
    var who = pickWho(m, pick);
    head.appendChild(who ? mug(who) : coin(pick.t, 40));
    var words = el('div', 'ege-cast__sheetwords');
    words.appendChild(el('span', 'ege-cast__sheetkind', marketTitle(m)));
    words.appendChild(el('span', 'ege-cast__sheetpick', m.kind === 'prop' ? m.who.n : pickText(m, pick)));
    words.appendChild(el('span', 'ege-cast__sheetsub', m.kind === 'prop'
      ? (pick.id === 'over' ? 'Over ' : 'Under ') + m.line + ' ' + m.label.toLowerCase()
      : m.kind === 'td' ? pick.pos + ' · ' + team(pick.t).name : team(pick.t).name));
    head.appendChild(words);
    head.appendChild(el('span', 'ege-cast__x', times(pick.x)));
    var shut = el('button', 'fb-modal__close ege-cast__sheetclose', '×');
    shut.type = 'button';
    shut.setAttribute('aria-label', 'Close');
    shut.addEventListener('click', function () { if (!slip.busy) { closeSlip(); redrawBets(); } });
    head.appendChild(shut);
    box.appendChild(head);

    var body = el('div', 'fb-modal__body ege-cast__sheetbody');
    var amount = el('label', 'ege-cast__amount');
    var input = el('input', 'fb-input ege-cast__stake');
    input.type = 'number';
    input.min = String(min);
    input.max = String(top);
    input.step = '1';
    input.inputMode = 'numeric';
    input.value = String(slip.stake);
    input.disabled = short || slip.busy;
    input.setAttribute('aria-label', 'Diamonds to bet');
    amount.appendChild(input);
    var gem = el('span', 'ege-gem');
    gem.setAttribute('aria-hidden', 'true');
    amount.appendChild(gem);
    body.appendChild(amount);

    var slide = el('input', 'ege-cast__slider');
    slide.type = 'range';
    slide.min = String(min);
    slide.max = String(top);
    slide.step = '1';
    slide.disabled = short || slip.busy || top <= min;
    slide.setAttribute('aria-label', 'Diamonds to bet');
    body.appendChild(slide);
    var ends = el('div', 'ege-cast__sliderends');
    ends.appendChild(gems(min));
    ends.appendChild(gems(top));
    body.appendChild(ends);

    var win = el('p', 'ege-cast__sheetpays');
    body.appendChild(win);
    if (short) { body.appendChild(el('p', 'ege-note ege-note--error ege-cast__sliperror', 'You need at least ' + min + ' diamonds to bet.')); }
    if (slip.error) { body.appendChild(el('p', 'ege-note ege-note--error ege-cast__sliperror', slip.error)); }

    var actions = el('div', 'ege-cast__sheetactions');
    var cancel = el('button', 'fb-btn', 'Cancel');
    cancel.type = 'button';
    cancel.disabled = slip.busy;
    cancel.addEventListener('click', function () { closeSlip(); redrawBets(); });
    var go = el('button', 'fb-btn fb-btn--primary ege-cast__go');
    go.type = 'button';
    go.disabled = short || slip.busy;
    go.addEventListener('click', function () { placeBet(m, pick); });
    actions.appendChild(cancel);
    actions.appendChild(go);
    body.appendChild(actions);
    box.appendChild(body);
    sheet.appendChild(box);

    /* The number and the slider move together; what it pays and the
       button follow. */
    function show(from) {
      var n = Math.floor(Number(slip.stake));
      var ok = n >= min && (typeof max !== 'number' || n <= max);
      if (from !== input) { input.value = String(slip.stake); }
      if (from !== slide) { slide.value = String(Math.min(top, Math.max(min, n || min))); }
      slide.style.setProperty('--fill', (top > min ? (Number(slide.value) - min) / (top - min) * 100 : 100) + '%');
      win.innerHTML = '';
      if (ok) { win.appendChild(document.createTextNode('Pays ')); win.appendChild(gems(pays(n, pick.x))); }
      go.innerHTML = '';
      if (slip.busy) { go.textContent = 'Betting…'; } else if (ok) { go.appendChild(document.createTextNode('Bet ')); go.appendChild(gems(n)); } else { go.textContent = 'Bet'; }
      if (!short && !slip.busy) { go.disabled = !ok; }
    }
    input.addEventListener('input', function () { slip.stake = input.value; show(input); });
    input.addEventListener('change', function () {
      var n = Math.floor(Number(input.value));
      slip.stake = String(Math.min(top, Math.max(min, isFinite(n) ? n : min)));
      show();
    });
    input.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { placeBet(m, pick); } });
    slide.addEventListener('input', function () { slip.stake = slide.value; show(slide); });
    show();
    if (fresh || slip.error) {
      (window.matchMedia && window.matchMedia('(pointer: fine)').matches && !input.disabled ? input : box).focus();
      if (document.activeElement === input) { input.select(); }
    }
    if (!box.hasAttribute('tabindex')) { box.setAttribute('tabindex', '-1'); }
  }

  /* --- the bets box ----------------------------------------------------------- */

  /* A side of the spread, in its team's colours. */
  function drawSide(m, pick, can) {
    var picked = slip && slip.market === m.id && slip.pick === pick.id;
    var b = paint(el('button', 'ege-cast__pick ege-cast__pick--spread' + (picked ? ' is-picked' : '')), pick.t);
    b.type = 'button';
    b.disabled = !can;
    b.appendChild(coin(pick.t, 26));
    b.appendChild(el('span', 'ege-cast__pickname', pickText(m, pick)));
    b.appendChild(el('span', 'ege-cast__x', times(pick.x)));
    b.addEventListener('click', function () { openSlip(m, pick); });
    return b;
  }

  /* The anytime touchdown: one player, out of a list that shows each
     one's picture and team (Sam, 2026-11-04). */
  function drawScorer(m, can) {
    var wrap = el('div', 'ege-cast__picker' + (picker === m.id ? ' is-open' : ''));
    var btn = el('button', 'ege-cast__pickbtn');
    btn.type = 'button';
    btn.disabled = !can;
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', picker === m.id ? 'true' : 'false');
    var faces = el('span', 'ege-cast__pickfaces');
    m.picks.slice().sort(function (a, b) { return a.x - b.x; }).slice(0, 3).forEach(function (p) { faces.appendChild(mug(p)); });
    btn.appendChild(faces);
    btn.appendChild(el('span', 'ege-cast__pickhint', 'Pick a player'));
    btn.addEventListener('click', function () {
      picker = picker === m.id ? null : m.id;
      redrawBets();
      var first = picker && view.querySelector('.ege-cast__pickrow');
      if (first) { first.focus({ preventScroll: true }); }
    });
    wrap.appendChild(btn);
    if (picker !== m.id) { return wrap; }
    var list = el('div', 'ege-cast__picklist');
    list.setAttribute('role', 'listbox');
    list.setAttribute('aria-label', marketTitle(m));
    [game.row.away, game.row.home].forEach(function (key) {
      var mine = m.picks.filter(function (p) { return p.t === key; });
      if (!mine.length) { return; }
      var group = paint(el('div', 'ege-cast__pickteam'), key);
      group.appendChild(coin(key, 18));
      group.appendChild(el('span', null, team(key).name));
      list.appendChild(group);
      mine.forEach(function (p) {
        var row = paint(el('button', 'ege-cast__pickrow'), key);
        row.type = 'button';
        row.setAttribute('role', 'option');
        row.appendChild(mug(p));
        var name = el('span', 'ege-cast__pickname');
        name.appendChild(el('span', 'ege-cast__pickwho', p.n));
        name.appendChild(el('span', 'ege-cast__pickpos', p.pos + ' · ' + nick(key)));
        row.appendChild(name);
        row.appendChild(el('span', 'ege-cast__x', times(p.x)));
        row.addEventListener('click', function () { openSlip(m, p); });
        list.appendChild(row);
      });
    });
    wrap.appendChild(list);
    return wrap;
  }

  /* An over/under: the player's line on his team's colour, the over and
     the under at the end of it. */
  function drawProp(m, can) {
    var row = paint(el('div', 'ege-cast__prop'), m.who.t);
    row.appendChild(mug(m.who));
    row.appendChild(el('p', 'ege-cast__propline', propText(m)));
    var ou = el('div', 'ege-cast__ou');
    m.picks.forEach(function (pick) {
      var picked = slip && slip.market === m.id && slip.pick === pick.id;
      var b = el('button', 'ege-cast__pick ege-cast__pick--prop' + (picked ? ' is-picked' : ''));
      b.type = 'button';
      b.disabled = !can;
      b.appendChild(el('span', 'ege-cast__pickname', pick.id === 'over' ? 'Over' : 'Under'));
      b.appendChild(el('span', 'ege-cast__x', times(pick.x)));
      b.addEventListener('click', function () { openSlip(m, pick); });
      ou.appendChild(b);
    });
    row.appendChild(ou);
    return row;
  }

  function drawMine(list) {
    var box = el('div', 'ege-cast__mine');
    box.appendChild(el('p', 'ege-cast__mkt', 'Your bets'));
    var ul = el('ul', 'ege-cast__minelist');
    list.forEach(function (b) {
      var m = marketOf(b.market);
      var pick = m ? m.picks.filter(function (p) { return p.id === b.pick; })[0] : null;
      var key = m ? pickTeam(m, pick) : null;
      var who = m ? pickWho(m, pick) : null;
      var li = el('li', 'ege-cast__minebet' + (b.settled_at ? (b.payout > b.stake ? ' is-won' : b.payout === b.stake ? ' is-push' : ' is-lost') : ''));
      if (key) { paint(li, key); li.appendChild(who ? mug(who) : coin(key, 22)); } else { li.appendChild(el('span')); }
      var what = el('div', 'ege-cast__minewhat');
      what.appendChild(el('span', 'ege-cast__minepick', m && pick ? pickText(m, pick) : b.pick));
      what.appendChild(el('span', 'fb-meta', (m ? marketTitle(m) : 'Bet') + ' · ' + times(Number(b.x))));
      li.appendChild(what);
      var stake = el('span', 'ege-cast__minestake');
      stake.appendChild(gems(b.stake));
      li.appendChild(stake);
      var how = el('span', 'ege-cast__mineres');
      if (!b.settled_at) {
        how.appendChild(document.createTextNode('Pays '));
        how.appendChild(gems(pays(b.stake, Number(b.x))));
      } else if (b.payout > b.stake) {
        how.appendChild(document.createTextNode('Won '));
        how.appendChild(gems(b.payout));
      } else {
        how.textContent = b.payout === b.stake ? 'Push' : 'Lost';
      }
      li.appendChild(how);
      ul.appendChild(li);
    });
    box.appendChild(ul);
    return box;
  }

  function openBets() { return menus().filter(function (x) { return x.open && !myBet(x.m.id); }); }

  /* What the bets box shows, as a word: drawn again only once it changes,
     so the player list is left alone while it is open. */
  function betsKey() {
    return openBets().map(function (x) { return x.m.id; }).join(',') + '|' + (game.mine || []).length + '|' + (picker || '');
  }

  var ORDER = { spread: 0, td: 1, prop: 2 };

  /* The bets box, under the play by play and over the box score (Sam,
     2026-11-04): each bet open now on its own row -- the spread, the
     anytime touchdown, the over/unders -- then this player's bets. None
     at all once betting has closed on somebody who never bet. */
  function drawBets() {
    if (!game || !game.row) { return null; }
    var open = openBets();
    var mine = game.mine || [];
    if (slip && !open.some(function (x) { return x.m.id === slip.market; })) { closeSlip(); }
    if (picker && !open.some(function (x) { return x.m.id === picker; })) { picker = null; }
    if (!open.length && !mine.length) { return null; }
    var box = el('section', 'fb-panel ege-cast__bets');
    box.setAttribute('data-open', betsKey());
    paint(box, game.row.away);
    box.style.setProperty('--home', team(game.row.home).color);
    var head = el('div', 'fb-panel__head');
    head.appendChild(el('h3', null, 'Bets'));
    var have = balance();
    if (typeof have === 'number') {
      var bal = gems(have);
      bal.classList.add('ege-cast__balance');
      head.appendChild(bal);
    }
    box.appendChild(head);
    var can = Boolean(wallet.email);
    if (open.length && !can) { box.appendChild(el('p', 'fb-meta ege-cast__betnote', 'Log in to bet.')); }
    var rows = {};
    open.slice().sort(function (a, b) { return (ORDER[a.m.kind] || 0) - (ORDER[b.m.kind] || 0); }).forEach(function (x) {
      var m = x.m;
      var row = rows[m.kind];
      if (!row) {
        row = el('div', 'ege-cast__market ege-cast__market--' + m.kind);
        row.appendChild(el('p', 'ege-cast__mkt', marketTitle(m)));
        row.appendChild(el('div', 'ege-cast__marketbody'));
        rows[m.kind] = row;
        box.appendChild(row);
      }
      var body = row.lastChild;
      if (m.kind === 'spread') {
        var sides = el('div', 'ege-cast__picks');
        m.picks.forEach(function (pick) { sides.appendChild(drawSide(m, pick, can)); });
        body.appendChild(sides);
      } else if (m.kind === 'td') {
        body.appendChild(drawScorer(m, can));
      } else {
        body.appendChild(drawProp(m, can));
      }
    });
    if (mine.length) { box.appendChild(drawMine(mine)); }
    return box;
  }

  /* Only the bets box, drawn again in its place. */
  function redrawBets() {
    if (!view || !game || !game.row || !view.querySelector('.ege-cast__cols')) { return; }
    var old = view.querySelector('.ege-cast__bets');
    var fresh = drawBets();
    if (old && fresh) {
      old.parentNode.replaceChild(fresh, old);
    } else if (old) {
      old.remove();
    } else if (fresh) {
      view.insertBefore(fresh, view.querySelector(':scope > .ege-cast__box'));
    }
  }

  /* The player list shuts on a click anywhere else, or Escape. */
  document.addEventListener('click', function (ev) {
    if (!picker || !view) { return; }
    var t = ev.target;
    if (t && t.closest && t.closest('.ege-cast__picker')) { return; }
    picker = null;
    redrawBets();
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Escape' || !picker || slip) { return; }
    picker = null;
    redrawBets();
    var btn = view && view.querySelector('.ege-cast__pickbtn');
    if (btn) { btn.focus(); }
  });

  /* --- an admin's hand on it -------------------------------------------------

     Pause, end, restart or cancel a live game in case something goes
     wrong (Sam, 2026-11-03): live_control, for everybody at once. A test
     game has the same, on this device alone, and a speed. */

  function control(id, action) {
    var c = client();
    if (!c) { return Promise.reject(new Error('Not connected to Supabase.')); }
    if (action === 'kickoff') { closeSlip(); }
    return c.rpc('live_control', { p_id: id, p_action: action, p_delay: 0 }).then(function (res) {
      if (res.error) {
        throw new Error(res.error.message + (/live_control/.test(res.error.message) ? ' Run supabase/schema.sql again first.' : ''));
      }
      return res.data;
    });
  }

  function act(action) {
    game.error = null;
    if (game.test) { testAct(action); return; }
    var mine = game;
    control(game.id, action).then(function () {
      if (game === mine) { tick(); }
    }, function (err) {
      if (game !== mine) { return; }
      game.error = err.message;
      draw();
    });
  }

  function drawControls() {
    var admin = EGE.wallet && EGE.wallet.admin && EGE.wallet.admin();
    if (!game.test && !admin) { return null; }
    var bar = el('div', 'ege-cast__controls');
    var state = phaseNow();
    /* `sure`: what the button says on the second click it waits for. */
    function btn(label, action, sure) {
      var b = el('button', 'fb-btn fb-btn--sm' + (confirming === action ? ' fb-btn--primary' : ''),
        confirming === action ? sure : label);
      b.type = 'button';
      b.addEventListener('click', function () {
        if (sure && confirming !== action) { confirming = action; draw(); return; }
        confirming = '';
        act(action);
      });
      bar.appendChild(b);
    }
    /* Waiting: only an admin's kickoff starts it (Sam, 2026-11-04). */
    if (game.waiting) {
      btn('Kick off', 'kickoff', game.test ? null : 'Kick off now');
      bar.firstChild.classList.add('fb-btn--primary');
      if (!game.test) { btn('Cancel', 'cancel', 'Cancel for good'); }
    } else {
      if (state !== 'final') { btn(game.paused ? 'Resume' : 'Pause', game.paused ? 'resume' : 'pause'); }
      btn('Restart', 'restart', game.test ? null : 'Restart from kickoff');
      if (state !== 'final') { btn('End', 'end', game.test ? null : 'End it now'); }
      if (!game.test) { btn('Cancel', 'cancel', 'Cancel for good'); }
    }
    if (game.test) {
      SPEEDS.forEach(function (n) {
        var b = el('button', 'fb-btn fb-btn--sm' + (game.speed === n ? ' fb-btn--primary' : ''), n + '\u00d7');
        b.type = 'button';
        b.addEventListener('click', function () { testAct('speed', n); });
        bar.appendChild(b);
      });
    }
    if (game.error) { bar.appendChild(el('p', 'ege-note ege-note--error', game.error)); }
    return bar;
  }

  /* --- a test game -------------------------------------------------------------

     An admin's private run of a game before it goes live (Sam,
     2026-11-03): the sim's snaps played on this device alone, the same
     way a live game plays, with nothing written to Supabase, nothing for
     anybody else to see and nothing posted to Discord. Kept for the tab in
     sessionStorage, so a reload carries on where it was. */

  var test = null;          /* { row, entries, at: { ms, real }, speed, paused, waiting, bets, mine } */

  function saveTest() {
    try { window.sessionStorage.setItem(TEST_KEY, JSON.stringify(test)); } catch (err) { /* kept in memory only */ }
  }

  function loadTest() {
    if (test) { return test; }
    try { test = JSON.parse(window.sessionStorage.getItem(TEST_KEY) || 'null'); } catch (err) { test = null; }
    return test;
  }

  /* A test game of `row` ({ season, week, home, away, title }), from the
     plan's entries, with its bets ({ bets, half, results }); it waits for
     its kickoff like a real one. */
  function startTest(row, entries, total, slot, reveal, bets) {
    test = {
      row: Object.assign({}, row, { id: 'test', slot_ms: slot || 20000, reveal_ms: reveal || 4000,
                                    plays: entries.length, length_ms: total, bets: bets ? bets.bets : null }),
      entries: entries, at: { ms: 0, real: Date.now() }, speed: 1, paused: false, waiting: true,
      bets: bets || null, mine: []
    };
    saveTest();
    if (game && game.test) { stop(); }
  }

  function syncTest() {
    game.clockAt = test.waiting ? null : test.at;
    game.speed = test.speed;
    game.paused = test.paused;
    game.waiting = Boolean(test.waiting);
  }

  /* What live_feed would say of the test game now. */
  function testFeed(from) {
    var all = test.entries;
    var row = test.row;
    var ms = clock();
    var at = -1;
    var shown = false;
    var next = null;
    var list = [];
    function when(i) { return typeof all[i].ms === 'number' ? all[i].ms : i * row.slot_ms; }
    from = Math.max(from || 0, 0);
    if (test.waiting) {
      return { clock: null, waiting: true, paused: false, slot: row.slot_ms, reveal: row.reveal_ms, plays: all.length,
               at: -1, from: from, shown: false, next: null, entries: [] };
    }
    var half = test.bets && test.bets.half;
    if (ms >= 0) {
      at = 0;
      for (var i = 1; i < all.length && when(i) <= ms; i += 1) { at = i; }
      var cur = all[at];
      shown = !cur.call || ms - when(at) >= row.reveal_ms || ms >= length(row);
      if (shown && at < all.length - 1) { next = when(at + 1); }
      for (var j = from; j < at; j += 1) { list.push(all[j]); }
      if (from <= at) {
        var hidden = { call: cur.call, pre: cur.pre, hidden: true, ms: when(at) };
        if (cur.w !== undefined) {
          hidden.w = cur.w;
          if (cur.p && cur.p[cur.w]) { hidden.p = {}; hidden.p[cur.w] = cur.p[cur.w]; }
        }
        list.push(shown ? cur : hidden);
      }
    }
    return { clock: ms, paused: test.paused, slot: row.slot_ms, reveal: row.reveal_ms, plays: all.length,
             at: at, from: from, shown: shown, next: next, entries: list,
             half: half && ms >= half.opens ? { markets: half.markets, closes: half.closes, open: ms < half.closes && !test.seen } : null };
  }

  function testAct(action, speed) {
    var now = Date.now();
    var ms = clock();
    if (action === 'kickoff') { test.at = { ms: 0, real: now }; test.waiting = false; test.paused = false; closeSlip(); }
    if (action === 'pause') { test.at = { ms: ms, real: now }; test.paused = true; }
    if (action === 'resume') { test.at = { ms: test.at.ms, real: now }; test.paused = false; }
    /* As live_control has it: a second half once seen takes no more
       halftime bets. */
    if (action === 'restart' || action === 'end') {
      var half = test.bets && test.bets.half;
      if (half && (action === 'end' || ms >= half.closes)) { test.seen = true; }
    }
    if (action === 'restart') { test.at = { ms: -5000, real: now }; test.paused = false; test.waiting = false; }
    if (action === 'end') { test.at = { ms: length(test.row), real: now }; test.paused = false; test.waiting = false; }
    if (action === 'speed') { test.at = { ms: ms, real: now }; test.speed = speed; }
    saveTest();
    syncTest();
    window.clearTimeout(timer);
    tick();
  }

  /* --- the page --------------------------------------------------------------- */

  function stop() {
    window.clearTimeout(timer);
    window.clearInterval(ticker);
    timer = null;
    ticker = null;
    closeSlip();
    picker = null;
    game = null;
  }

  function render(id) {
    view = document.getElementById('liveBody');
    if (!view) { return; }
    if (game && game.id === id) { draw(); return; }
    stop();
    confirming = '';
    document.title = 'Live';
    view.innerHTML = '';
    if (id === 'test') {
      if (!loadTest()) { view.appendChild(el('p', 'ege-note ege-cast__note', 'No test game. Start one from the NFL Sim tab.')); return; }
      game = { id: 'test', test: true, row: test.row, entries: [], done: 0, at: -1, shown: false, next: null,
               mine: test.mine || [] };
      syncTest();
      ticker = window.setInterval(function () {
        if (game && game.row && phaseNow() === 'soon' && !game.waiting) { draw(); }
      }, 1000);
      loadWallet();
      tick();
      return;
    }
    view.appendChild(el('p', 'ege-note ege-cast__note', 'Getting the game…'));
    var c = client();
    if (!c) { view.innerHTML = ''; view.appendChild(el('p', 'ege-note ege-cast__note', 'Live games need the connection to Supabase.')); return; }
    game = { id: id, row: null, entries: [], done: 0, at: -1, shown: false, next: null, mine: [] };
    var mine = game;
    c.from('live_games').select(COLUMNS + ', bets').eq('id', id)
      .maybeSingle().then(function (res) {
        if (game !== mine) { return; }
        if (res.error || !res.data) { drawMissing(); game = null; return; }
        game.row = res.data;
        loadWallet();
        /* An admin watching keeps the Discord posts going, where Supabase
           has no clock to send them. */
        if (EGE.wallet && EGE.wallet.admin() && EGE.nflSimAdmin && EGE.nflSimAdmin.watchLive) {
          EGE.nflSimAdmin.watchLive();
        }
        ticker = window.setInterval(function () {
          if (game && game.row && phaseNow() === 'soon' && !game.waiting) { draw(); }
        }, 1000);
        tick();
      });
  }

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && game && game.row && (game.paused || nextDue() !== null)) { tick(); }
  });

  return { render: render, stop: stop, games: loadGames, gameFor: gameFor, phase: phase, ends: ends,
           control: control, startTest: startTest, columns: COLUMNS };
})();
