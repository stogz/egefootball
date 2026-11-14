/* ==========================================================================
   EGE Football — the draft on a live game
   Who gets a live game's Game Pack (Sam, 2026-11-14; it used to be whoever
   won the most bets on it): the best draft. Four players from either side,
   picked in order before the kickoff, defenders too (Sam, 2026-11-14: a
   gamble that pays off on a good game, scored as the League page's Top
   Performers score one), the top block of the Bets box after Sam's
   concept: four faces in a row, each with its boost on its corner
   and a short name under it ("K. Walker"), and an Update button under
   them. A face opens the list of players, like the anytime touchdown's;
   a player already picked moves to the face picked from, so the order can
   be changed too. Update puts it in, and it can be put in again as often
   as wanted until the kickoff (live_draft_set).

   Each pick counts his fantasy points times his boost: his own, which the
   NFL Sim tab gives everybody expected to score less than a star does
   (nfl-sim/lib/live-bets.js, none for Sam at 30 points a game), plus the
   pick's place in the order's (2.0x, 1.6x, 1.4x and none, the menu's
   `order`), so a 3.0x player taken first is 5.0x; a pick with neither is
   1x. From the kickoff the faces show what each pick has come to so far,
   off the box score as it stands, counting up as each snap adds to it
   (nothing of the end of the game is here before it happens), and
   everybody's draft is out
   (live_draft_board) with where it stands; once the final whistle has
   gone Supabase scores them (live_settle, live_draft_score) and the best
   gets the Game Pack. A test game keeps its draft on this device alone.

   js/live.js puts the block in the Bets box and hands this what it needs
   of the page (create(ctx)).
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.liveDraft = (function () {
  'use strict';

  var PLACES = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];

  /* A defender counts as the League page's Top Performers count him
     (DEF_STATS in js/app.js; nfl-sim/lib/live-bets.js draftPoints). */
  var DEFENDERS = { EDGE: true, DI: true, LB: true, CB: true, S: true };
  var DEF_POINTS = { defTd: 6, ints: 3, ff: 3, sacks: 2, passDef: 1, tackles: 1 };

  /* How long a pick's points take to count up to what they have come to. */
  var COUNT_MS = 900;

  function round2(x) { return Math.round(x * 100) / 100; }

  /* A player's points off a live box score line, as the sim scores them
     (nfl-sim/lib/live-bets.js draftPoints): a defender's on DEF_POINTS,
     anybody else's on the site's fantasy scoring (data/economy.js). */
  function fantasyPoints(line, pos) {
    if (!line) { return 0; }
    if (DEFENDERS[pos]) {
      return Object.keys(DEF_POINTS).reduce(function (sum, k) { return sum + (line[k] || 0) * DEF_POINTS[k]; }, 0);
    }
    return round2((line.passYds || 0) / 25 + (line.passTd || 0) * 4 - (line.passInt || 0) * 2 +
      (line.rushYds || 0) / 10 + (line.rushTd || 0) * 6 + (line.recYds || 0) / 10 + (line.recTd || 0) * 6 +
      (line.rec || 0) * 0.5 - (line.fumLost || 0) * 2);
  }

  /* A pick's boost: the player's own plus his place's, 1x with neither. */
  function boostAt(menu, pick, place) {
    var own = pick && typeof pick.x === 'number' ? pick.x : 0;
    var spot = menu && menu.order && typeof menu.order[place] === 'number' ? menu.order[place] : 0;
    return Math.max(own + spot, 1);
  }

  /* "2x", "2.1x" (Sam's concept, 2026-11-14). */
  function boostText(x) { return String(Math.round(x * 10) / 10) + 'x'; }

  function pointsText(x) { return (Math.round(x * 10) / 10).toFixed(1); }

  /* "K. Walker": the first initial and the rest of the name. */
  function shortName(name) {
    var parts = String(name || '').trim().split(/\s+/);
    if (parts.length < 2) { return parts[0] || ''; }
    return parts[0].charAt(0) + '. ' + parts.slice(1).join(' ');
  }

  /* What a draft comes to: each pick's points (`pts`, by menu id) times
     its boost, each to the hundredth, as live_draft_score adds them up. */
  function score(menu, picks, pts) {
    var byId = {};
    (menu.picks || []).forEach(function (p) { byId[p.id] = p; });
    var total = 0;
    var raw = 0;
    (picks || []).forEach(function (id, i) {
      var got = pts[id] || 0;
      total += round2(got * boostAt(menu, byId[id], i));
      raw += got;
    });
    return { score: round2(total), raw: round2(raw) };
  }

  function create(ctx) {
    var el = ctx.el;
    var state = null;

    function fresh() {
      return { picks: [], saved: null, row: null, slot: null, busy: false, error: null, board: null, asked: false,
               loadedFor: null, shown: {} };
    }

    function game() { return ctx.game(); }

    function menu() {
      var g = game();
      var m = g && g.row && g.row.bets && g.row.bets.draft;
      return m && Array.isArray(m.picks) && m.picks.length ? m : null;
    }

    function size() { var m = menu(); return (m && m.size) || 4; }

    function pickById(id) {
      var m = menu();
      return m ? m.picks.filter(function (p) { return p.id === id; })[0] || null : null;
    }

    function st() {
      var g = game();
      if (!state || state.loadedFor !== (g && g.id)) { state = fresh(); state.loadedFor = g && g.id; }
      return state;
    }

    /* Before the kickoff, while picks can be made and changed: as long as
       the bets before kickoff are open, a kickoff set ahead too. */
    function open() { return Boolean(menu()) && ctx.pregame(); }

    function same(a, b) { return Boolean(a && b) && a.length === b.length && a.every(function (x, i) { return x === b[i]; }); }

    /* --- Supabase ------------------------------------------------------------ */

    /* This player's draft, and everybody's once the game has kicked off.
       `quiet` while the box is being drawn: a test game's is there at
       once, and drawing it again then would draw it twice. */
    function load(quiet) {
      var s = st();
      var g = game();
      if (!g || !menu()) { return Promise.resolve(); }
      if (g.test) {
        var t = ctx.test() || {};
        s.row = t.draft || null;
        s.saved = s.row ? s.row.picks.slice() : null;
        if (!s.picks.length && s.saved) { s.picks = s.saved.slice(); }
        if (ctx.phase() !== 'soon') { s.board = s.row ? [testEntry(s.row)] : []; s.asked = true; }
        if (!quiet) { ctx.redraw(); }
        return Promise.resolve();
      }
      var c = ctx.client();
      var w = ctx.wallet();
      var asks = [];
      asks.push(c && w.email ? c.from('live_drafts').select('picks, score, raw, settled_at')
        .eq('game_id', g.id).eq('email', w.email).maybeSingle() : null);
      asks.push(c && ctx.phase() !== 'soon' ? c.rpc('live_draft_board', { p_id: g.id }) : null);
      if (asks[1]) { s.asked = true; }
      return Promise.all(asks).then(function (got) {
        if (game() !== g || state !== s) { return; }
        if (got[0] && !got[0].error) {
          s.row = got[0].data || null;
          s.saved = s.row ? s.row.picks.slice() : null;
          if (s.saved && (!s.picks.length || !open())) { s.picks = s.saved.slice(); }
        }
        if (got[1] && !got[1].error) { s.board = got[1].data || []; }
        ctx.redraw();
      }, function () { /* nothing to show */ });
    }

    /* From the kickoff, everybody's drafts: asked for once it comes. */
    function sync() {
      var s = st();
      if (!menu() || s.asked || ctx.phase() === 'soon') { return; }
      s.asked = true;
      load(true).then(function () { if (ctx.loaded) { ctx.loaded(); } });
    }

    function testEntry(row) {
      var w = ctx.wallet();
      return { email: w.email || '', picks: row.picks, score: row.score, raw: row.raw, settled: Boolean(row.settled_at),
               pack: false };
    }

    /* Puts the four in, or changes them, before the kickoff. */
    function save() {
      var s = st();
      var g = game();
      if (!open() || s.busy || s.picks.length !== size() || s.picks.some(function (p) { return !p; })) { return; }
      s.error = null;
      if (g.test) {
        var t = ctx.test();
        t.draft = { picks: s.picks.slice(), score: null, raw: null, settled_at: null };
        ctx.saveTest();
        s.row = t.draft;
        s.saved = s.picks.slice();
        ctx.redraw();
        return;
      }
      var c = ctx.client();
      if (!c) { s.error = 'Not connected.'; ctx.redraw(); return; }
      s.busy = true;
      ctx.redraw();
      c.rpc('live_draft_set', { p_game: g.id, p_picks: s.picks.slice() }).then(function (res) {
        if (game() !== g || state !== s) { return; }
        s.busy = false;
        if (res.error) {
          s.error = String(res.error.message || 'That draft did not go in.').replace(/\s*CONTEXT:.*$/, '') +
            (/live_draft_set/.test(res.error.message || '') ? ' Run supabase/schema.sql again first.' : '');
        } else {
          s.row = res.data;
          s.saved = (res.data && res.data.picks || s.picks).slice();
        }
        ctx.redraw();
      }, function () {
        if (game() !== g || state !== s) { return; }
        s.busy = false;
        s.error = 'That draft did not go in.';
        ctx.redraw();
      });
    }

    /* --- scoring as it goes ------------------------------------------------------ */

    /* Every pick's fantasy points so far, by menu id, off the box score as
       it stands; the menu's results once a test game is over. */
    function pointsNow() {
      var m = menu();
      var g = game();
      if (!m) { return {}; }
      if (g.test && ctx.phase() === 'final') {
        var t = ctx.test();
        var res = t && t.bets && t.bets.results && t.bets.results.draft;
        if (res) { return res; }
      }
      var lines = {};
      ctx.totals().box.forEach(function (l) { lines[l.name + '|' + l.team] = l; });
      var out = {};
      m.picks.forEach(function (p) { out[p.id] = fantasyPoints(lines[p.n + '|' + p.t], p.pos); });
      return out;
    }

    /* Whether a draft on the game is still to be scored, once it is over. */
    function due() {
      var s = st();
      if (!menu() || ctx.phase() !== 'final') { return false; }
      if (s.row && !s.row.settled_at) { return true; }
      return (s.board || []).some(function (r) { return !r.settled; });
    }

    /* A test game's draft scored here, from its results. */
    function settleTest() {
      var s = st();
      var t = ctx.test();
      if (!t || !t.draft || t.draft.settled_at) { return; }
      var got = score(menu(), t.draft.picks, (t.bets && t.bets.results && t.bets.results.draft) || {});
      t.draft.score = got.score;
      t.draft.raw = got.raw;
      t.draft.settled_at = new Date().toISOString();
      ctx.saveTest();
      s.row = t.draft;
      s.board = [testEntry(t.draft)];
      ctx.redraw();
    }

    /* --- drawing ------------------------------------------------------------------ */

    function chip(text, className) { return el('span', 'ege-cast__draftx' + (className ? ' ' + className : ''), text); }

    /* Points that go up as the game plays out (Sam, 2026-11-14): drawn at
       what they were last shown at and counted up (or down) to what they
       are now, lit while they climb. `id` keeps them apart. */
    function counted(id, value, className) {
      var s = st();
      var node = el('span', className, pointsText(value));
      var from = s.shown[id];
      s.shown[id] = value;
      if (typeof from !== 'number' || Math.abs(from - value) < 0.05) { return node; }
      var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (still || !window.requestAnimationFrame) { return node; }
      node.textContent = pointsText(from);
      if (value > from) { node.classList.add('is-up'); }
      var start = null;
      function step(now) {
        if (start === null) { start = now; }
        var t = Math.min(1, (now - start) / COUNT_MS);
        var eased = 1 - Math.pow(1 - t, 3);
        node.textContent = pointsText(from + (value - from) * eased);
        if (t < 1) { window.requestAnimationFrame(step); } else { node.classList.remove('is-up'); }
      }
      window.requestAnimationFrame(step);
      return node;
    }

    /* One of the four: the face of whoever is picked there, his boost on
       its corner and his name under it; before the kickoff a button that
       opens the list, an empty circle until somebody is picked. */
    function face(place, can, pts) {
      var s = st();
      var m = menu();
      var p = pickById(s.picks[place]);
      var live = !open();
      var node = el(live ? 'div' : 'button', 'ege-cast__draftpick' + (s.slot === place ? ' is-open' : '') + (p ? '' : ' is-empty'));
      if (!live) {
        node.type = 'button';
        node.disabled = !can || s.busy;
        node.setAttribute('aria-haspopup', 'listbox');
        node.setAttribute('aria-expanded', s.slot === place ? 'true' : 'false');
        node.setAttribute('aria-label', PLACES[place] + ' pick' + (p ? ': ' + p.n : ''));
        /* Tapped again once all four are in, it swaps whoever is there for
           somebody else (Sam, 2026-11-14), until the kickoff. */
        node.addEventListener('click', function () {
          s.slot = s.slot === place ? null : place;
          ctx.redraw();
          var list = s.slot !== null && document.querySelector('.ege-cast__draftlist');
          var row = list && (list.querySelector('.ege-cast__pickrow.is-chosen') || list.querySelector('.ege-cast__pickrow'));
          if (!row) { return; }
          row.focus({ preventScroll: true });
          if (row.classList.contains('is-chosen')) { list.scrollTop = Math.max(0, row.offsetTop - list.clientHeight / 3); }
        });
      }
      var ring = el('span', 'ege-cast__draftface');
      var boost = boostAt(m, p, place);
      if (p) {
        ring.appendChild(ctx.mug(p));
        ctx.paint(node, p.t);
      } else {
        ring.appendChild(el('span', 'ege-cast__draftplus', '+'));
      }
      if (p || boost > 1) { ring.appendChild(chip(boostText(boost))); }
      node.appendChild(ring);
      node.appendChild(el('span', 'ege-cast__draftname', p ? shortName(p.n) : PLACES[place]));
      if (live && p) {
        node.appendChild(counted('p' + place + ':' + p.id, round2((pts[p.id] || 0) * boost), 'ege-cast__draftpts'));
      }
      return node;
    }

    /* The players to pick from, each side's together, its offense and then
       its defense, a player picked in another place marked with it:
       picking him moves him here. */
    function list() {
      var s = st();
      var m = menu();
      var g = game();
      var box = el('div', 'ege-cast__picklist ege-cast__draftlist');
      box.setAttribute('role', 'listbox');
      box.setAttribute('aria-label', PLACES[s.slot] + ' pick');
      [g.row.away, g.row.home].forEach(function (key) {
        var theirs = m.picks.filter(function (p) { return p.t === key; });
        if (!theirs.length) { return; }
        var group = ctx.paint(el('div', 'ege-cast__pickteam'), key);
        group.appendChild(ctx.coin(key, 18));
        group.appendChild(el('span', null, ctx.team(key).name));
        box.appendChild(group);
        var banded = false;
        theirs.forEach(function (p) {
          if (DEFENDERS[p.pos] && !banded) {
            banded = true;
            var band = ctx.paint(el('div', 'ege-cast__pickteam ege-cast__pickteam--def'), key);
            band.appendChild(ctx.coin(key, 18));
            band.appendChild(el('span', null, ctx.nick(key) + ' defense'));
            box.appendChild(band);
          }
          var at = s.picks.indexOf(p.id);
          var here = at === s.slot;
          var row = ctx.paint(el('button', 'ege-cast__pickrow' + (here ? ' is-chosen' : '')), key);
          row.type = 'button';
          row.setAttribute('role', 'option');
          row.setAttribute('aria-selected', here ? 'true' : 'false');
          row.appendChild(ctx.mug(p));
          var name = el('span', 'ege-cast__pickname');
          name.appendChild(el('span', 'ege-cast__pickwho', p.n));
          name.appendChild(el('span', 'ege-cast__pickpos', p.pos + ' · ' + ctx.nick(key)));
          row.appendChild(name);
          var tags = el('span', 'ege-cast__drafttags');
          if (at !== -1 && !here) { tags.appendChild(el('span', 'ege-cast__draftat', PLACES[at])); }
          if (typeof p.x === 'number') { tags.appendChild(el('span', 'ege-cast__x', boostText(p.x))); }
          row.appendChild(tags);
          row.addEventListener('click', function () { choose(s.slot, p.id); });
          box.appendChild(row);
        });
      });
      return box;
    }

    /* `id` picked at `place`; somebody already picked elsewhere swaps
       places with whoever was here. */
    function choose(place, id) {
      var s = st();
      var picks = s.picks.slice();
      while (picks.length < size()) { picks.push(null); }
      var was = picks.indexOf(id);
      if (was !== -1 && was !== place) { picks[was] = picks[place]; }
      picks[place] = id;
      s.picks = picks;
      s.slot = null;
      s.error = null;
      ctx.redraw();
    }

    function avatar(email) {
      var e = String(email || '').toLowerCase();
      var who = (EGE.players || []).filter(function (p) { return p.email && p.email.toLowerCase() === e; })[0] || null;
      return who;
    }

    /* Everybody's draft from the kickoff, best first: as it stands, then
       as Supabase scored it, the Game Pack's winner marked. */
    function standings(pts) {
      var s = st();
      var m = menu();
      var w = ctx.wallet();
      var rows = (s.board || []).map(function (r) {
        var now = r.settled ? { score: Number(r.score), raw: Number(r.raw) } : score(m, r.picks, pts);
        return { email: r.email, score: now.score, raw: now.raw, pack: r.pack };
      });
      var me = String(w.email || '').toLowerCase();
      if (!rows.some(function (r) { return String(r.email).toLowerCase() !== me; })) { return null; }
      rows.sort(function (a, b) { return b.score - a.score || b.raw - a.raw; });
      var box = el('ol', 'ege-cast__draftboard');
      rows.forEach(function (r, i) {
        var who = avatar(r.email);
        var item = el('li', 'ege-cast__draftrank' + (String(r.email).toLowerCase() === me ? ' is-me' : '') + (r.pack ? ' is-pack' : ''));
        item.appendChild(el('span', 'ege-cast__draftno', String(i + 1)));
        if (who && who.headshot) {
          var img = el('img', 'ege-cast__draftav');
          img.src = who.headshot + (EGE.headshotVersion ? '?v=' + EGE.headshotVersion : '');
          img.alt = '';
          img.loading = 'lazy';
          item.appendChild(img);
        }
        item.appendChild(el('span', 'ege-cast__draftwho', who ? who.first : 'Somebody'));
        if (r.pack) { item.appendChild(el('span', 'ege-cast__draftpack', 'Game Pack')); }
        item.appendChild(counted('board:' + r.email, r.score, 'ege-cast__draftscore'));
        box.appendChild(item);
      });
      return box;
    }

    /* The draft's block, the top of the Bets box; null when the game has
       none, or once it has kicked off with nobody's draft to show. */
    function block(can) {
      var s = st();
      var m = menu();
      if (!m) { return null; }
      sync();
      var live = !open();
      if (live && !s.saved && !(s.board || []).length) { return null; }
      if (live) {
        s.slot = null;
        if (s.saved) { s.picks = s.saved.slice(); }
      }
      var pts = live ? pointsNow() : {};
      var node = el('div', 'ege-cast__block ege-cast__block--draft');
      var head = el('div', 'ege-cast__q');
      var words = el('div', 'ege-cast__qwords');
      words.appendChild(el('p', 'ege-cast__qtext', 'Draft'));
      head.appendChild(words);
      if (live && s.saved) {
        var total = s.row && s.row.settled_at && s.row.score !== null ? Number(s.row.score) : score(m, s.saved, pts).score;
        head.appendChild(counted('total', total, 'ege-cast__drafttotal'));
      }
      node.appendChild(head);
      if (s.saved || !live) {
        var picks = el('div', 'ege-cast__draftpicks');
        var row = el('div', 'ege-cast__draftrow');
        row.style.setProperty('--n', String(size()));
        for (var i = 0; i < size(); i += 1) { row.appendChild(face(i, can, pts)); }
        picks.appendChild(row);
        if (!live && s.slot !== null) { picks.appendChild(list()); }
        node.appendChild(picks);
      }
      if (!live) {
        var full = s.picks.length === size() && s.picks.every(Boolean);
        var changed = full && !same(s.picks, s.saved);
        var go = el('button', 'fb-btn ege-cast__draftgo' + (changed ? ' fb-btn--primary' : ''),
          s.busy ? 'Saving…' : s.saved ? 'Update' : 'Draft');
        go.type = 'button';
        go.disabled = !can || s.busy || !changed;
        go.addEventListener('click', save);
        node.appendChild(go);
        if (s.error) { node.appendChild(el('p', 'ege-note ege-note--error ege-cast__sliperror', s.error)); }
      } else {
        var board = standings(pts);
        if (board) { node.appendChild(board); }
      }
      return node;
    }

    /* What the block shows, as a word, so the box is drawn again only once
       it changes. */
    function key() {
      var s = st();
      if (!menu()) { return ''; }
      var g = game();
      return 'd' + (open() ? '+' : '@' + g.at + (g.shown ? 's' : '')) + s.picks.join(',') + '/' + (s.saved || []).join(',') + '/' + (s.slot === null ? '' : s.slot) +
        (s.busy ? '/busy' : '') + (s.error ? '/err' : '') + '/' + (s.board ? s.board.length : '-');
    }

    function picking() { var s = st(); return open() && s.slot !== null; }

    function close() {
      var s = st();
      if (s.slot === null) { return false; }
      s.slot = null;
      return true;
    }

    /* The list shuts on a click anywhere else, or Escape. */
    document.addEventListener('click', function (ev) {
      if (!state || state.slot === null) { return; }
      var t = ev.target;
      if (t && t.closest && t.closest('.ege-cast__draftpicks')) { return; }
      state.slot = null;
      ctx.redraw();
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Escape' || !state || state.slot === null) { return; }
      var place = state.slot;
      state.slot = null;
      ctx.redraw();
      var faces = document.querySelectorAll('.ege-cast__draftpick');
      if (faces[place]) { faces[place].focus(); }
    });

    return {
      reset: function () { state = null; },
      load: load,
      block: block,
      key: key,
      picking: picking,
      close: close,
      due: due,
      settleTest: settleTest,
      has: function () { var s = st(); return Boolean(menu() && s.saved); }
    };
  }

  return { create: create, score: score, boostAt: boostAt, fantasyPoints: fantasyPoints, shortName: shortName };
})();
