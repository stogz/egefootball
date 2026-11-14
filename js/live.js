/* ==========================================================================
   EGE Football — Live Mode
   A game the NFL sim has played, put out snap by snap for everybody to
   watch at once (Sam, 2026-11-03): #live/{id}, opened from its game on
   the League page. Every snap the same, punts too (Sam, 2026-11-10): two
   seconds of "Snap…", five of what is called ("Sam Stogsdill rush…"),
   then nine of what came of it ("Sam Stogsdill 13-yd rush"); halftime is
   two minutes. A player who gets hot burns: fire licks in from the left
   border of his plays, blue once he is absurdly hot (js/live-heat.js has
   the rules). PLAY LIVE on the NFL Sim tab puts it up here
   waiting, and an admin kicks it off from this page (Sam, 2026-11-04),
   now or at a time set with Schedule beside Kick off (Sam, 2026-11-14):
   the page counts down to it, the bot posts it, and the game starts on
   its own when it comes (live_schedule). An admin can
   pause, end, restart or cancel it from here too, and #live/test plays a
   game on this device alone before it goes live.

   Bets (Sam, 2026-11-04), diamonds only, at least 10 a bet: the spread
   of the bot's first post, a touchdown scorer and three players'
   over/unders until the kickoff, and at halftime a scorer for the rest
   of the game and the spread of the halftime post. They sit under the
   play by play and over the box score, a row a bet, in the teams'
   colours; a pick opens a pop-up for how many diamonds, and tapping a
   bet again changes it or takes it off until its market closes (Sam,
   2026-11-14). The menus and
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

  /* What is left to the kickoff: "4:05", "1:04:05", "2d 01:04:05". */
  function countText(ms) {
    var t = Math.max(0, Math.ceil((ms || 0) / 1000));
    var d = Math.floor(t / 86400);
    var h = Math.floor(t % 86400 / 3600);
    var m = Math.floor(t % 3600 / 60);
    var out = String(m).padStart(h || d ? 2 : 1, '0') + ':' + String(t % 60).padStart(2, '0');
    if (h || d) { out = (d ? String(h).padStart(2, '0') : h) + ':' + out; }
    return (d ? d + 'd ' : '') + out;
  }

  /* When a kickoff is, by this device's own clock and calendar: "7:00 PM"
     today, "Sat 7:00 PM" this week, "Nov 21, 7:00 PM" after. */
  function kickoffText(ms) {
    var at = new Date(ms);
    var time = at.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    var now = new Date();
    var days = Math.round((new Date(at.getFullYear(), at.getMonth(), at.getDate()) -
      new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
    if (days === 0) { return time; }
    if (days > 0 && days < 7) { return at.toLocaleDateString([], { weekday: 'short' }) + ' ' + time; }
    return at.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ', ' + time;
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
    game.kickoff = typeof got.kickoff === 'number' ? got.kickoff : null;
    game.starts = typeof got.starts === 'number' ? got.starts : null;
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

  /* Before the kickoff: waiting for an admin to kick it off, or for the
     time one has set (Sam, 2026-11-14). The bets before kickoff stay open
     until then. */
  function pregame() {
    return Boolean(game.waiting || (typeof game.kickoff === 'number' && !game.paused && clock() < 0));
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
      /* Waiting for the kickoff: ask now and then whether it has come, or
         been set or moved, and leave the page (and a bet being typed)
         alone until it has. The countdown runs on its own (countDown). */
      var pre = pregame();
      var now = (game.waiting ? 'w' : '') + (game.paused ? 'p' : '') + (pre ? 'k' + game.kickoff + ':' : '') +
        game.at + ':' + game.done;
      if (!(pre && was === now)) { draw(); }
      game.drawn = now;
      if (game.waiting) { if (!game.test) { schedule(4000); } return; }
      if (pre) { schedule(Math.min(game.test ? Infinity : 5000, -clock() / (game.speed || 1) + 150)); return; }
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

  /* How hot the player a snap shows the face of is (js/live-heat.js: 1
     orange, 2 blue): once it is out, as it left him; while only its call
     is, as hot as he already was. `heat` is EGE.liveHeat.map's. */
  function heatOf(e, i, heat) {
    if (!e || !e.call) { return 0; }
    var n = e.hidden || e.r === undefined ? e.w : e.r;
    return n === undefined ? 0 : (heat[i] || {})[n] || 0;
  }

  /* A hot player's box burns (Sam, 2026-11-10): fire stretched down the
     left border, its base out of frame, the flames reaching in; blue when
     he is absurdly hot. */
  function burn(box, level) {
    if (!level) { return; }
    var fire = el('img', 'ege-cast__fire');
    fire.src = level > 1 ? 'icon/live/fire-blue.webp' : 'icon/live/fire.webp';
    fire.alt = '';
    fire.setAttribute('aria-hidden', 'true');
    box.classList.add('is-hot');
    box.insertBefore(fire, box.firstChild);
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
      (pregame() ? 'Pregame' : game.paused && state !== 'final' ? 'Paused' : state === 'live' ? 'Live'
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
          /* The countdown (Sam, 2026-11-14), kept going by countDown. */
          var count = el('span', 'ege-cast__time', countText(-clock() / (game.speed || 1)));
          count.setAttribute('data-countdown', '');
          mid.appendChild(count);
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

  /* "at 7:00 PM", "Sat 7:00 PM": when it kicks off, Supabase's word for
     it where there is one (a test game's from its own clock). */
  function kickoffWords() {
    var ms = !game.test && typeof game.starts === 'number' ? game.starts
      : Math.round((Date.now() - clock() / (game.speed || 1)) / 1000) * 1000;
    var text = kickoffText(ms);
    return /^\d/.test(text) ? 'at ' + text : text;
  }

  /* The countdown to a kickoff, a second at a time, without drawing the
     page (or the bets) again. */
  function countDown() {
    if (!game || !game.row || !view || game.waiting || phaseNow() !== 'soon') { return; }
    var text = countText(-clock() / (game.speed || 1));
    Array.prototype.forEach.call(view.querySelectorAll('[data-countdown]'), function (node) {
      if (node.textContent !== text) { node.textContent = text; }
    });
  }

  /* The snap being played: what was called, and once it is out, what came
     of it, with a bar for the time it has left. */
  function drawPlay() {
    var card = el('section', 'fb-panel ege-cast__play');
    var state = phaseNow();
    if (state === 'soon') {
      card.appendChild(el('p', 'ege-cast__call', nick(game.row.away) + (game.row.title.indexOf(' vs. ') !== -1 ? ' vs. ' : ' at ') + nick(game.row.home)));
      card.appendChild(el('p', 'fb-meta ege-cast__when', game.waiting ? 'Waiting for kickoff' : game.paused ? 'Paused'
        : 'Kicks off ' + kickoffWords()));
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
    burn(card, heatOf(e, game.at, EGE.liveHeat.map(game.entries)));
    if (e.tag === 'wait') {
      /* Before the snap: "Snap…" and nothing about it (Sam, 2026-11-10). */
      card.classList.add('is-wait');
      who.appendChild(face(null, e.pre && e.pre.o, {}));
      var hush = el('p', 'ege-cast__call');
      hush.appendChild(document.createTextNode('Snap'));
      hush.appendChild(el('span', 'ege-cast__dots', '…'));
      words.appendChild(hush);
    } else if (e.hidden) {
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
      /* One bar for the whole snap, the same from "Snap…" through the
         call to the end of the play (Sam, 2026-11-10): a snap's slot from
         its wait. Halftime runs to the kickoff. */
      var bar = el('span', 'ege-cast__bar');
      var fill = el('span', 'ege-cast__fill');
      var start = entryMs(game.at);
      var end;
      if (e.tag === 'wait') {
        end = start + game.slot;
      } else if (e.call) {
        var before = game.entries[game.at - 1];
        if (before && before.tag === 'wait') { start = entryMs(game.at - 1); }
        end = start + game.slot;
      } else {
        end = game.next !== null ? game.next : start + game.slot;
      }
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
    var shown = [];
    game.entries.forEach(function (e, i) { if (!e.hidden && e.tag !== 'wait' && i < game.at) { shown.push(i); } });
    var info = people();
    var heat = EGE.liveHeat.map(game.entries);
    var lastQ = null;
    /* Where a quarter starts: under its first snap, the list being newest
       first. */
    function started() {
      if (lastQ !== null) { list.appendChild(el('li', 'ege-cast__break', QUARTERS[lastQ] || 'Overtime')); }
      lastQ = null;
    }
    for (var i = shown.length - 1; i >= 0; i -= 1) {
      var e = game.entries[shown[i]];
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
      burn(item, heatOf(e, shown[i], heat));
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
     has gone. A bet can be changed or taken off for as long as its market
     is open (Sam, 2026-11-14): tap it, or the other pick. */

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

  /* What a winner pays: the stake back and 90% of the rest (Sam's 10%
     tax, 2026-11-06). live_settle does the same sum. */
  function pays(stake, x) { return stake + Math.round((Math.round(stake * x) - stake) * 0.9); }

  /* The bets on offer, each with whether it is open now. */
  function menus() {
    var out = [];
    var pre = game.row && game.row.bets;
    (pre && pre.markets || []).forEach(function (m) { out.push({ m: m, open: pregame() }); });
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

  /* A player's picture in the bets (Sam, 2026-11-04): cut to a circle on
     his team's colour at 60%, no outline, his team's mark at its bottom
     right. The mark in the circle alone where there is no picture of
     him. */
  function mug(p) {
    var box = el('span', 'ege-cast__mug');
    box.style.setProperty('--team', team(p.t).color);
    var round = el('span', 'ege-cast__mugface');
    box.appendChild(round);
    var mine = p.g && EGE.playerBySlug ? EGE.playerBySlug(p.g) : null;
    var src = mine && mine.headshot ? mine.headshot
      : p.e && EGE.espnHeadshot ? EGE.espnHeadshot(p.e, p.c, 192, 140) : null;
    var badge = el('span', 'ege-cast__mugteam');
    badge.appendChild(logo(p.t, 24));
    function bare() {
      box.classList.add('is-mark');
      badge.remove();
      round.appendChild(logo(p.t, 48));
    }
    if (src) {
      var img = el('img', 'ege-cast__mugimg');
      img.src = src;
      img.alt = '';
      img.loading = 'lazy';
      img.addEventListener('error', function () { img.remove(); bare(); });
      round.appendChild(img);
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
      game.test ? null : c.from('live_bets').select('market, pick, stake, x, payout, settled_at').eq('game_id', game.id).eq('email', wallet.email)
    ]).then(function (got) {
      if (game !== mine) { return; }
      wallet.diamonds = got[0];
      if (got[1] && !got[1].error) { game.mine = got[1].data || []; }
      redrawBets();
      settleIfOver();
      loadPack();
    });
  }

  /* Won the most bets on it: its Game Pack (data/game-packs.js), handed
     out as live_settle pays the bets, to open in the Shop. */
  function loadPack() {
    var c = client();
    if (!c || !game || game.test || !wallet.email || phaseNow() !== 'final' || !(game.mine || []).length) { return; }
    var mine = game;
    c.from('game_packs').select('id, opened_at').eq('game_id', game.id).eq('email', wallet.email)
      .order('earned_at', { ascending: false }).limit(1)
      .then(function (res) {
        if (game !== mine || res.error) { return; }
        var row = (res.data || [])[0] || null;
        game.pack = row && !row.opened_at ? row : null;
        redrawBets();
      }, function () { /* none to show */ });
  }

  function walletMoved() {
    if (game.test || typeof wallet.diamonds !== 'number') { return; }
    document.dispatchEvent(new window.CustomEvent('ege:wallet', { detail: { diamonds: wallet.diamonds } }));
  }

  /* The bet on a market that can still be changed: in, and not paid. */
  function heldBet(id) {
    var b = myBet(id);
    return b && !b.settled_at ? b : null;
  }

  /* The most a bet can be: every diamond this player has, and the stake
     already on the market being changed, which comes back. */
  function maxStake() {
    var have = balance();
    if (typeof have !== 'number') { return null; }
    var held = slip ? heldBet(slip.market) : null;
    return Math.max(0, Math.floor(have + (held ? Number(held.stake) : 0)));
  }

  /* This player's bets with the one on `id` swapped for `bet` (or none). */
  function swapBet(id, bet) {
    return (game.mine || []).filter(function (b) { return b.market !== id; }).concat(bet ? [bet] : []);
  }

  function betError(res, fallback) {
    return String((res && res.error && res.error.message) || fallback).replace(/\s*CONTEXT:.*$/, '');
  }

  /* Puts the bet in, or changes the one already on that market: the old
     stake comes back and the new one goes on (live_bet_change). */
  function placeBet(m, pick) {
    var stake = Math.floor(Number(slip.stake));
    var min = minStake();
    var max = maxStake();
    var held = heldBet(m.id);
    slip.error = null;
    if (!(stake >= min)) { slip.error = 'Bet at least ' + min + ' diamonds.'; drawSheet(); return; }
    if (typeof max === 'number' && stake > max) { slip.error = 'Not enough diamonds.'; drawSheet(); return; }
    lastStake = stake;
    if (held && held.pick === pick.id && Number(held.stake) === stake) { closeSlip(); redrawBets(); return; }
    if (game.test) {
      test.mine = swapBet(m.id, { market: m.id, pick: pick.id, stake: stake, x: pick.x, payout: null, settled_at: null });
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
    var args = { p_game: game.id, p_market: m.id, p_pick: pick.id, p_stake: stake };
    c.rpc(held ? 'live_bet_change' : 'live_bet_place', args).then(function (res) {
      if (game !== mine || slip !== was) { return; }
      if (res.error) {
        slip.busy = false;
        slip.error = betError(res, 'That bet did not go in.');
        drawSheet();
        return;
      }
      wallet.diamonds = Number(res.data.diamonds);
      game.mine = swapBet(m.id, res.data.bet);
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

  /* Takes the bet on a market off while it is still open, the stake
     back. */
  function removeBet(m) {
    if (!heldBet(m.id)) { closeSlip(); redrawBets(); return; }
    slip.error = null;
    if (game.test) {
      test.mine = swapBet(m.id, null);
      game.mine = test.mine;
      saveTest();
      closeSlip();
      redrawBets();
      return;
    }
    var c = client();
    if (!c) { slip.error = 'Not connected.'; drawSheet(); return; }
    slip.busy = 'remove';
    drawSheet();
    var mine = game;
    var was = slip;
    c.rpc('live_bet_change', { p_game: game.id, p_market: m.id, p_pick: null, p_stake: null }).then(function (res) {
      if (game !== mine || slip !== was) { return; }
      if (res.error) {
        slip.busy = false;
        slip.error = betError(res, 'That bet did not come off.');
        drawSheet();
        return;
      }
      wallet.diamonds = Number(res.data.diamonds);
      game.mine = swapBet(m.id, null);
      closeSlip();
      walletMoved();
      redrawBets();
    }, function () {
      if (game !== mine || slip !== was) { return; }
      slip.busy = false;
      slip.error = 'That bet did not come off.';
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
      return c.from('live_bets').select('market, pick, stake, x, payout, settled_at').eq('game_id', mine.id).eq('email', wallet.email);
    }).then(function (res) {
      settling = false;
      if (game !== mine || res.error) { return; }
      game.mine = res.data || [];
      var left = game.mine.some(function (b) { return !b.settled_at; });
      if (!left) { loadPack(); }
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

  /* A bet already on the market starts the pop-up at its stake, to be
     changed, switched to this pick, or taken off. */
  function openSlip(m, pick) {
    picker = null;
    var held = heldBet(m.id);
    slip = { market: m.id, pick: pick.id, stake: null, error: null, busy: false, edit: Boolean(held) };
    var max = maxStake();
    var start = held ? Number(held.stake) : lastStake || minStake();
    if (typeof max === 'number' && max >= minStake()) { start = Math.min(start, max); }
    slip.stake = start;
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

    var edit = Boolean(slip.edit && heldBet(m.id));
    var actions = el('div', 'ege-cast__sheetactions' + (edit ? ' ege-cast__sheetactions--edit' : ''));
    if (edit) {
      var off = el('button', 'fb-btn ege-cast__remove', slip.busy === 'remove' ? 'Removing…' : 'Remove');
      off.type = 'button';
      off.disabled = Boolean(slip.busy);
      off.addEventListener('click', function () { removeBet(m); });
      actions.appendChild(off);
    }
    var cancel = el('button', 'fb-btn', 'Cancel');
    cancel.type = 'button';
    cancel.disabled = Boolean(slip.busy);
    cancel.addEventListener('click', function () { closeSlip(); redrawBets(); });
    var go = el('button', 'fb-btn fb-btn--primary ege-cast__go');
    go.type = 'button';
    go.disabled = short || Boolean(slip.busy);
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
      var word = edit ? 'Update' : 'Bet';
      if (slip.busy) { go.textContent = slip.busy === 'remove' ? word : edit ? 'Updating…' : 'Betting…'; }
      else if (ok) { go.appendChild(document.createTextNode(word + ' ')); go.appendChild(gems(n)); } else { go.textContent = word; }
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

  /* --- the bets box -----------------------------------------------------------

     After Sam's template (2026-11-04): each bet a block of its own, its
     question over its buttons. A spread or an over/under is one box split
     in two; the anytime touchdown a button that opens the list of
     players. A pick opens the pop-up; once the bet is in, the pick stays
     filled in its team's colour with what went in, and what it came to
     once the game is over. */

  function settledClass(b) {
    return !b.settled_at ? '' : b.payout > b.stake ? ' is-won' : b.payout === b.stake ? ' is-push' : ' is-lost';
  }

  /* The end of a pick that has a bet on it: what went in and what it
     pays, or what it came to. */
  function betTail(b) {
    var tail = el('span', 'ege-cast__tail');
    var big = el('span', 'ege-cast__tailbig');
    var small = el('span', 'ege-cast__tailsmall');
    if (!b.settled_at) {
      big.appendChild(gems(b.stake));
      small.appendChild(document.createTextNode('Pays '));
      small.appendChild(gems(pays(b.stake, Number(b.x))));
    } else if (b.payout > b.stake) {
      big.appendChild(document.createTextNode('Won '));
      big.appendChild(gems(b.payout));
      small.appendChild(document.createTextNode('Bet '));
      small.appendChild(gems(b.stake));
    } else {
      big.textContent = b.payout === b.stake ? 'Push' : 'Lost';
      small.appendChild(document.createTextNode('Bet '));
      small.appendChild(gems(b.stake));
    }
    tail.appendChild(big);
    tail.appendChild(small);
    return tail;
  }

  function check() {
    var c = el('span', 'ege-cast__check');
    c.setAttribute('aria-hidden', 'true');
    return c;
  }

  /* Two picks in one box, side by side: a spread's teams, or the over and
     the under. */
  function drawSplit(m, can, open) {
    var mine = myBet(m.id);
    var change = Boolean(mine && heldBet(m.id) && can && open);
    var box = el('div', 'ege-cast__split' + (mine ? ' has-bet' : '') + (change ? ' can-change' : ''));
    m.picks.forEach(function (pick) {
      var bet = mine && mine.pick === pick.id ? mine : null;
      var picked = slip && slip.market === m.id && slip.pick === pick.id;
      var b = paint(el('button', 'ege-cast__half' + (bet ? ' is-bet' + settledClass(bet) : '') + (picked ? ' is-picked' : '')),
        pickTeam(m, pick));
      b.type = 'button';
      b.disabled = !can || !open || (Boolean(mine) && !change);
      if (m.kind === 'spread') {
        b.appendChild(coin(pick.t, 26));
        b.appendChild(el('span', 'ege-cast__halfname', nick(pick.t)));
      } else {
        b.appendChild(el('span', 'ege-cast__halfname', pick.id === 'over' ? 'Over' : 'Under'));
      }
      if (bet) {
        b.appendChild(betTail(bet));
      } else if (!mine || change) {
        b.appendChild(el('span', 'ege-cast__odds', times(pick.x)));
      }
      b.addEventListener('click', function () { openSlip(m, pick); });
      box.appendChild(b);
    });
    return box;
  }

  /* The anytime touchdown: a button that opens the list of players, each
     with his picture and team (Sam, 2026-11-04); the player bet on, once
     the bet is in. */
  function drawScorer(m, can, open) {
    var mine = myBet(m.id);
    var chosen = mine ? m.picks.filter(function (p) { return p.id === mine.pick; })[0] : null;
    var change = Boolean(chosen && heldBet(m.id) && can && open);
    var done = null;
    if (chosen) {
      done = paint(el(change ? 'button' : 'div', 'ege-cast__chosen' + settledClass(mine)), chosen.t);
      done.appendChild(mug(chosen));
      var who = el('span', 'ege-cast__halfname');
      who.appendChild(el('span', null, chosen.n));
      who.appendChild(el('span', 'ege-cast__chosenpos', chosen.pos + ' · ' + nick(chosen.t) + ' · ' + times(Number(mine.x))));
      done.appendChild(who);
      done.appendChild(betTail(mine));
      done.appendChild(check());
      if (!change) { return done; }
    }
    /* Not bet on yet, or bet on and still open: the button opens the list,
       and a player picked from it starts or changes the bet. */
    var wrap = el('div', 'ege-cast__picker' + (picker === m.id ? ' is-open' : ''));
    var btn = done || el('button', 'ege-cast__pickbtn');
    btn.type = 'button';
    btn.disabled = !can || !open;
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', picker === m.id ? 'true' : 'false');
    if (!done) { btn.appendChild(el('span', 'ege-cast__pickhint', 'Select a player…')); }
    btn.addEventListener('click', function () {
      picker = picker === m.id ? null : m.id;
      redrawBets();
      var first = picker && (view.querySelector('.ege-cast__pickrow.is-chosen') || view.querySelector('.ege-cast__pickrow'));
      if (first) { first.focus({ preventScroll: true }); }
    });
    wrap.appendChild(btn);
    if (picker !== m.id) { return wrap; }
    var list = el('div', 'ege-cast__picklist');
    list.setAttribute('role', 'listbox');
    list.setAttribute('aria-label', marketTitle(m));
    [game.row.away, game.row.home].forEach(function (key) {
      var theirs = m.picks.filter(function (p) { return p.t === key; });
      if (!theirs.length) { return; }
      var group = paint(el('div', 'ege-cast__pickteam'), key);
      group.appendChild(coin(key, 18));
      group.appendChild(el('span', null, team(key).name));
      list.appendChild(group);
      theirs.forEach(function (p) {
        var row = paint(el('button', 'ege-cast__pickrow' + (chosen && chosen.id === p.id ? ' is-chosen' : '')), key);
        row.type = 'button';
        row.setAttribute('role', 'option');
        if (chosen) { row.setAttribute('aria-selected', chosen.id === p.id ? 'true' : 'false'); }
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

  /* A bet's question, as the template asks it, and the line under it. */
  function question(m) {
    if (m.kind === 'spread') { return m.half ? 'Pick the team to cover the halftime spread' : 'Pick the team to cover the spread'; }
    if (m.kind === 'td') { return m.half ? 'Player to score a touchdown in the 2nd half' : 'Player to score a touchdown'; }
    return propText(m);
  }

  function underQuestion(m) {
    if (m.kind !== 'spread') { return null; }
    var fav = m.picks.filter(function (p) { return p.line < 0; })[0];
    return fav ? nick(fav.t) + ' by ' + (-fav.line) : null;
  }

  function drawBlock(x, can) {
    var m = x.m;
    var block = el('div', 'ege-cast__block ege-cast__block--' + m.kind);
    var head = el('div', 'ege-cast__q');
    if (m.kind === 'prop') { head.appendChild(mug(m.who)); }
    var words = el('div', 'ege-cast__qwords');
    words.appendChild(el('p', 'ege-cast__qtext', question(m)));
    var sub = underQuestion(m);
    if (sub) { words.appendChild(el('p', 'ege-cast__qsub', sub)); }
    head.appendChild(words);
    block.appendChild(head);
    block.appendChild(m.kind === 'td' ? drawScorer(m, can, x.open) : drawSplit(m, can, x.open));
    return block;
  }

  /* A bet whose market is not to be found any more: what it was on, and
     what it came to. */
  function drawStray(b) {
    var block = el('div', 'ege-cast__block');
    var row = el('div', 'ege-cast__chosen' + settledClass(b));
    paint(row, game.row.away);
    row.appendChild(el('span', 'ege-cast__halfname', 'Bet'));
    row.appendChild(betTail(b));
    block.appendChild(row);
    return block;
  }

  function openBets() { return menus().filter(function (x) { return x.open && !myBet(x.m.id); }); }

  var ORDER = { spread: 0, td: 1, prop: 2 };

  /* What the box shows: every bet open now and every one this player has
     a bet on, the halftime ones first, each kind in the template's order. */
  function shownBets() {
    return menus().filter(function (x) { return x.open || myBet(x.m.id); }).sort(function (a, b) {
      return (a.m.half ? 0 : 1) - (b.m.half ? 0 : 1) || (ORDER[a.m.kind] || 0) - (ORDER[b.m.kind] || 0);
    });
  }

  /* What the bets box shows, as a word: drawn again only once it changes,
     so the player list is left alone while it is open. */
  function betsKey() {
    return shownBets().map(function (x) { return x.m.id + (x.open ? '+' : ''); }).join(',') + '|' +
      (game.mine || []).map(function (b) { return b.market + ':' + b.pick + ':' + b.stake + (b.settled_at ? '$' : ''); }).join(',') + '|' + (picker || '') +
      (game.pack ? '|pack' : '');
  }

  /* The bets box, under the play by play and over the box score (Sam,
     2026-11-04). None at all once betting has closed on somebody who never
     bet. */
  function drawBets() {
    if (!game || !game.row) { return null; }
    var open = openBets();
    var shown = shownBets();
    var mine = game.mine || [];
    /* A market that has closed shuts its pop-up and its list, bet on or
       not. */
    var live = menus().filter(function (x) { return x.open; });
    if (slip && !live.some(function (x) { return x.m.id === slip.market; })) { closeSlip(); }
    if (picker && !live.some(function (x) { return x.m.id === picker; })) { picker = null; }
    var strays = mine.filter(function (b) { return !marketOf(b.market); });
    if (!shown.length && !strays.length) { return null; }
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
    /* The most bets won on it: a Game Pack waiting in the Shop. */
    if (game.pack) {
      var claim = el('a', 'ege-cast__gamepack');
      claim.href = '#cards/shop';
      claim.appendChild(el('span', null, 'Game Pack won'));
      claim.appendChild(el('span', 'ege-cast__gamepackgo', 'Open it in the Shop \u203a'));
      box.appendChild(claim);
    }
    shown.forEach(function (x) { box.appendChild(drawBlock(x, can)); });
    strays.forEach(function (b) { box.appendChild(drawStray(b)); });
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
    game.setting = null;
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

  /* A kickoff set ahead (Sam, 2026-11-14), or taken off with `at` null:
     live_schedule, which the bot posts. */
  function setKickoff(id, at) {
    var c = client();
    if (!c) { return Promise.reject(new Error('Not connected to Supabase.')); }
    return c.rpc('live_schedule', { p_id: id, p_at: at === null ? null : new Date(at).toISOString() }).then(function (res) {
      if (res.error) {
        throw new Error(res.error.message + (/live_schedule/.test(res.error.message) ? ' Run supabase/schema.sql again first.' : ''));
      }
      return res.data;
    });
  }

  function scheduleKickoff(at) {
    game.error = null;
    if (at !== null && !(at > Date.now())) { game.error = 'Pick a time later than now.'; draw(); return; }
    if (game.test) { game.setting = null; testAct(at === null ? 'unschedule' : 'schedule', at); return; }
    var mine = game;
    game.setting.busy = true;
    draw();
    setKickoff(game.id, at).then(function () {
      if (game !== mine) { return; }
      game.setting = null;
      tick();
    }, function (err) {
      if (game !== mine) { return; }
      if (game.setting) { game.setting.busy = false; }
      game.error = err.message;
      draw();
    });
  }

  /* "2026-11-14T19:00", the way a datetime-local box has it, from a time
     and back, in this device's own time zone. */
  function localValue(ms) {
    var d = new Date(ms);
    function two(n) { return String(n).padStart(2, '0'); }
    return d.getFullYear() + '-' + two(d.getMonth() + 1) + '-' + two(d.getDate()) + 'T' + two(d.getHours()) + ':' + two(d.getMinutes());
  }

  function fromLocal(value) {
    var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value || '');
    return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]).getTime() : NaN;
  }

  /* Schedule, beside Kick off: a date and time, Set, and Clear once one
     is set. It opens on the time set, or the next half hour. */
  function drawSchedule(bar) {
    var set = typeof game.kickoff === 'number';
    if (!game.setting) {
      var open = el('button', 'fb-btn fb-btn--sm', 'Schedule');
      open.type = 'button';
      open.addEventListener('click', function () {
        confirming = '';
        var at = set ? Math.round((Date.now() - clock() / (game.speed || 1)) / 60000) * 60000
          : Math.ceil((Date.now() + 10 * 60000) / 1800000) * 1800000;
        game.setting = { value: localValue(at) };
        game.error = null;
        draw();
        var box = view && view.querySelector('.ege-cast__when-input');
        if (box) { box.focus(); }
      });
      bar.appendChild(open);
      return;
    }
    var form = el('form', 'ege-cast__schedule');
    var input = el('input', 'fb-input ege-cast__when-input');
    input.type = 'datetime-local';
    input.value = game.setting.value;
    input.min = localValue(Date.now());
    input.setAttribute('aria-label', 'Kickoff');
    input.addEventListener('input', function () { game.setting.value = input.value; });
    form.appendChild(input);
    var go = el('button', 'fb-btn fb-btn--sm fb-btn--primary', game.setting.busy ? 'Setting…' : 'Set');
    go.type = 'submit';
    go.disabled = Boolean(game.setting.busy);
    form.appendChild(go);
    if (set) {
      var clear = el('button', 'fb-btn fb-btn--sm', 'Clear');
      clear.type = 'button';
      clear.disabled = Boolean(game.setting.busy);
      clear.addEventListener('click', function () { scheduleKickoff(null); });
      form.appendChild(clear);
    }
    var shut = el('button', 'fb-btn fb-btn--sm ege-cast__schedule-x', '\u00d7');
    shut.type = 'button';
    shut.setAttribute('aria-label', 'Close');
    shut.addEventListener('click', function () { game.setting = null; game.error = null; draw(); });
    form.appendChild(shut);
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (game.setting.busy) { return; }
      game.setting.value = input.value;
      scheduleKickoff(fromLocal(input.value));
    });
    bar.appendChild(form);
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
    /* Waiting: only an admin's kickoff starts it (Sam, 2026-11-04), now
       or at the time Schedule sets (Sam, 2026-11-14). */
    if (pregame()) {
      btn('Kick off', 'kickoff', game.test ? null : 'Kick off now');
      bar.firstChild.classList.add('fb-btn--primary');
      drawSchedule(bar);
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
    var kickoff = typeof test.kickoff === 'number' ? test.kickoff : null;
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
             at: at, from: from, shown: shown, next: next, entries: list, kickoff: kickoff,
             half: half && ms >= half.opens ? { markets: half.markets, closes: half.closes, open: ms < half.closes && !test.seen } : null };
  }

  function testAct(action, value) {
    var now = Date.now();
    var ms = clock();
    if (action === 'kickoff') { test.at = { ms: 0, real: now }; test.waiting = false; test.paused = false; closeSlip(); }
    /* A kickoff set ahead: `value` is when, by this device's clock. */
    if (action === 'schedule') { test.at = { ms: -(value - now) * test.speed, real: now }; test.waiting = false; test.paused = false; test.kickoff = value; }
    if (action === 'unschedule') { test.waiting = true; test.kickoff = null; }
    if (action !== 'schedule' && action !== 'unschedule' && action !== 'speed') { test.kickoff = null; }
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
    if (action === 'speed') { test.at = { ms: ms, real: now }; test.speed = value; }
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
      ticker = window.setInterval(countDown, 1000);
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
        ticker = window.setInterval(countDown, 1000);
        tick();
      });
  }

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && game && game.row && (game.paused || nextDue() !== null)) { tick(); }
  });

  return { render: render, stop: stop, games: loadGames, gameFor: gameFor, phase: phase, ends: ends,
           control: control, startTest: startTest, columns: COLUMNS, kickoffText: kickoffText };
})();
