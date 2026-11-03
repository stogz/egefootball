/* ==========================================================================
   EGE Football — Live Mode
   A game the NFL sim has played, put out snap by snap for everybody to
   watch at once (Sam, 2026-11-03): #live/{id}, opened from its game on
   the League page. A snap every 20 seconds: first what is called
   ("Jaykeb Stewart pass"), then four seconds later what came of it
   ("Jaykeb Stewart 22-yd pass to Nico Collins"), and sixteen seconds
   after that the next.

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

  var view = null;
  var game = null;          /* { id, row, entries, offset, at, shown, ... } */
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
      .select('id, season, week, home, away, title, starts_at, slot_ms, reveal_ms, plays')
      .order('starts_at', { ascending: false }).limit(60)
      .then(function (res) { return res.error ? [] : (res.data || []); }, function () { return []; });
    return games;
  }

  function ends(row) { return Date.parse(row.starts_at) + row.plays * row.slot_ms; }

  /* 'soon', 'live' or 'final', by this device's clock (near enough for a
     badge; the page itself goes by Supabase's). */
  function phase(row) {
    var now = Date.now();
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

  function now() { return Date.now() + (game ? game.offset : 0); }

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
    var c = client();
    if (!c || !game) { return Promise.reject(new Error('Not connected.')); }
    var id = game.id;
    var from = game.done;
    var sent = Date.now();
    return c.rpc('live_feed', { p_id: id, p_from: from }).then(function (res) {
      if (!game || game.id !== id) { return null; }
      if (res.error) { throw new Error(res.error.message); }
      if (!res.data) { game.missing = true; return null; }
      var got = res.data;
      var back = Date.now();
      game.offset = got.now - Math.round((sent + back) / 2);
      game.starts = got.starts;
      game.slot = got.slot;
      game.reveal = got.reveal;
      game.plays = got.plays;
      game.at = got.at;
      game.shown = got.shown;
      game.entries = game.entries.slice(0, got.from).concat(got.entries || []);
      var last = game.entries[game.entries.length - 1];
      game.done = game.entries.length - (last && last.hidden ? 1 : 0);
      return got;
    });
  }

  /* When the next thing is due: kickoff, the snap's reveal, or the next
     snap. Null once the game is over. */
  function nextDue() {
    if (game.at < 0) { return game.starts; }
    var current = game.entries[game.at];
    if (current && current.hidden) { return game.starts + game.at * game.slot + game.reveal; }
    if (game.at >= game.plays - 1) { return null; }
    return game.starts + (game.at + 1) * game.slot;
  }

  function schedule(wait) {
    window.clearTimeout(timer);
    timer = window.setTimeout(tick, Math.max(120, wait));
  }

  function tick() {
    if (!game) { return; }
    var had = game.at + ':' + game.done;
    fetchFeed().then(function () {
      if (!game) { return; }
      if (game.missing) { drawMissing(); return; }
      draw();
      var due = nextDue();
      if (due === null) { return; }
      /* The answer came back before the clock turned over: a moment more. */
      var stuck = had === game.at + ':' + game.done;
      schedule(stuck ? Math.max(800, due - now() + 150) : due - now() + 150);
    }).catch(function () {
      schedule(3000);
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
    if (state === 'live') { kicker.appendChild(el('span', 'ege-cast__dot')); }
    kicker.appendChild(document.createTextNode(state === 'live' ? 'Live' : state === 'final' ? 'Final' : 'Kickoff soon'));
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
        if (state === 'soon') {
          mid.appendChild(el('span', 'ege-cast__time', clockText((game.starts - now()) / 1000)));
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
    if (game.at < 0) { return 'soon'; }
    var last = game.entries[game.at];
    return game.at >= game.plays - 1 && last && !last.hidden ? 'final' : 'live';
  }

  /* The field, the away side's end zone on the left and the home side's on
     the right: the ball where the snap is, in a circle with the mark of
     the team that has it, and the first-down line in orange. */
  function fieldX(at, yl) {
    var x = at.o === game.row.home ? 100 - yl : yl;
    return 'calc(' + (8.333 + x * 0.83333) + '%)';
  }

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

    if (at && at.o && phaseNow() !== 'final') {
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
      card.appendChild(el('p', 'fb-meta ege-cast__when', 'Kicks off at ' +
        new Date(game.starts - game.offset).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })));
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
    if (e.call) { who.appendChild(face(e.w, e.pre && e.pre.o, people())); }
    if (e.hidden) {
      var call = el('p', 'ege-cast__call');
      call.appendChild(document.createTextNode(e.call));
      call.appendChild(el('span', 'ege-cast__dots', '…'));
      words.appendChild(call);
    } else {
      if (e.call) { words.appendChild(el('p', 'ege-cast__called', e.call)); }
      words.appendChild(el('p', 'ege-cast__text', e.text));
      (e.more || []).forEach(function (m) { words.appendChild(el('p', 'ege-cast__more', m)); });
    }
    who.appendChild(words);
    card.appendChild(who);
    if (state === 'live') {
      var bar = el('span', 'ege-cast__bar');
      var fill = el('span', 'ege-cast__fill');
      var start = game.starts + game.at * game.slot;
      var gone = Math.min(1, Math.max(0, (now() - start) / game.slot));
      fill.style.width = (gone * 100) + '%';
      bar.appendChild(fill);
      card.appendChild(bar);
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          fill.style.transition = 'width ' + Math.max(0, start + game.slot - now()) + 'ms linear';
          fill.style.width = '100%';
        });
      });
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
      item.appendChild(face(e.w, e.pre.o, info));
      var body = el('div', 'ege-cast__body');
      var meta = el('div', 'ege-cast__meta');
      meta.appendChild(logo(e.pre.o, 18));
      meta.appendChild(el('span', null, quarterText(e.pre.q) + ' ' + clockText(e.pre.c) + (e.pre.dn ? ' · ' + downText(e.pre) : '')));
      body.appendChild(meta);
      body.appendChild(el('p', 'ege-cast__line', e.text));
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
    var at = where();
    view.innerHTML = '';
    view.appendChild(drawHead(at));
    view.appendChild(drawField(at));
    var cols = el('div', 'ege-cast__cols');
    var side = el('div', 'ege-cast__side');
    side.appendChild(drawPlay());
    if (phaseNow() !== 'soon') { side.appendChild(drawFeed()); }
    cols.appendChild(side);
    view.appendChild(cols);
    var box = drawBox();
    if (box) {
      box.classList.add('ege-cast__box');
      view.appendChild(box);
    }
    var list = view.querySelector('.ege-cast__list');
    if (list && feedScroll) { list.scrollTop = feedScroll; }
    document.title = nick(game.row.away) + ' ' + scoreNow()[1] + ', ' + nick(game.row.home) + ' ' + scoreNow()[0];
  }

  /* --- the page --------------------------------------------------------------- */

  function stop() {
    window.clearTimeout(timer);
    window.clearInterval(ticker);
    timer = null;
    ticker = null;
    game = null;
  }

  function render(id) {
    view = document.getElementById('liveBody');
    if (!view) { return; }
    if (game && game.id === id) { draw(); return; }
    stop();
    document.title = 'Live';
    view.innerHTML = '';
    view.appendChild(el('p', 'ege-note ege-cast__note', 'Getting the game…'));
    var c = client();
    if (!c) { view.innerHTML = ''; view.appendChild(el('p', 'ege-note ege-cast__note', 'Live games need the connection to Supabase.')); return; }
    game = { id: id, row: null, entries: [], done: 0, offset: 0, at: -1, shown: false };
    var mine = game;
    c.from('live_games').select('id, season, week, home, away, title, starts_at, slot_ms, reveal_ms, plays').eq('id', id)
      .maybeSingle().then(function (res) {
        if (game !== mine) { return; }
        if (res.error || !res.data) { drawMissing(); game = null; return; }
        game.row = res.data;
        /* An admin watching keeps the Discord posts going, where Supabase
           has no clock to send them. */
        if (EGE.wallet && EGE.wallet.admin() && EGE.nflSimAdmin && EGE.nflSimAdmin.watchLive) {
          EGE.nflSimAdmin.watchLive();
        }
        ticker = window.setInterval(function () {
          if (game && game.row && phaseNow() === 'soon') { draw(); }
        }, 1000);
        tick();
      });
  }

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && game && game.row && nextDue() !== null) { tick(); }
  });

  return { render: render, stop: stop, games: loadGames, gameFor: gameFor, phase: phase, ends: ends };
})();
