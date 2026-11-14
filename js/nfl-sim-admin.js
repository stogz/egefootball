/* ==========================================================================
   EGE Football — the NFL sim, on the admin page
   The NFL Sim tab: the same sim as node nfl-sim/sim.js, run in the browser.
   It plays the league a week, a stretch or a phase at a time, holds the
   trades and big free-agent moves that wait for an approval, runs the
   offseason and the draft (with any first rounds uploaded as written), has
   a trade builder, every team's direction to set and every team's roster
   season by season, lists every team's offer for any of the six in free
   agency for an admin to pick from, and hands the site what it needs:

   - the six's games and every other NFL score, as stats/{year}.js and
     data/nfl-results.js to download and commit, the way the Season File
     panel's file is;
   - every team's roster, published to nfl_sim_rosters for the Teams pages
     (js/nfl-rosters.js) after each step.

   The world -- every player, the games, the trade queue, and everything the
   sim knows about how good a team is -- is kept in Supabase, in
   nfl_sim_files, which only an admin can read. Team ratings are never shown
   here or anywhere on the site. So are the save points of the weeks played
   this season (rewind-{season}-{week}.json, lib/rewind.js), which are not
   loaded with the world: one is fetched only to resim or undo its week.

   Before every step the six's boosters on their games (game_boosters) and
   their connections (player_inventory) are read for the sim
   (lib/boosts.js).

   The sim itself is js/nfl-sim.js (built by nfl-sim/build/bundle.js), about
   1.4 MB, loaded the first time the tab is opened. Each step reads the
   world, plays, and writes back only the files it changed; if anything goes
   wrong, nothing is saved and the world is as it was.

   js/app.js calls render() when the tab is opened.

   Depends on: js/auth.js, js/exports.js, js/nfl-rosters.js, data/nfl.js.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.nflSimAdmin = (function () {
  'use strict';

  var FILES = 'nfl_sim_files';
  var ROSTERS = 'nfl_sim_rosters';
  var SEED = 'ege-nfl';
  var WORLD = 'supabase';
  var PUBLISH_KEY = 'ege.nflSim.publishRosters';
  /* Save points, and each week's snaps for Live Mode: kept in Supabase but
     never loaded with the world, each fetched when it is wanted. */
  var SAVE_POINT = /^(rewind|pbp)-/;

  var state = {
    files: null,          /* name -> JSON text, once loaded */
    stamps: {},           /* name -> updated_at when loaded or last saved */
    dirty: {},
    busy: false,
    loading: null,
    last: null,           /* { title, lines } from the last step */
    error: null,
    upload: { text: '', checked: null, showSaved: false },  /* a draft written by hand, before it is kept */
    deal: null,           /* the trade builder's two sides */
    live: null,           /* the six's boosters and connections, read before each step */
    again: '',            /* the week picked to resim or undo */
    rosters: { team: '', season: null },
    week: '',             /* "season:week" picked in the week stats; the last one played when blank */
    liveGames: [],        /* live_games rows, newest first (js/live.js) */
    liveSure: ''          /* 'id:action': the live game control waiting to be clicked again */
  };

  function emptyDeal() { return [{ key: '', players: [], picks: [] }, { key: '', players: [], picks: [] }]; }
  state.deal = emptyDeal();

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text != null) { node.textContent = text; }
    return node;
  }

  function byId(id) { return document.getElementById(id); }

  function client() { return EGE.auth && EGE.auth.supabaseClient ? EGE.auth.supabaseClient() : null; }

  function note(text) {
    var line = byId('nflSimNote');
    if (line) { line.textContent = text || ''; }
  }

  function sim() { return EGE.nflSim; }

  function teamName(key) { return EGE.nfl.teams[key] ? EGE.nfl.teams[key].name : key; }

  function nick(key) { return teamName(key).split(' ').slice(-1)[0]; }

  function publishing() {
    try { return window.localStorage.getItem(PUBLISH_KEY) !== 'off'; } catch (e) { return true; }
  }

  /* --- the sim, loaded once --------------------------------------------- */

  var bundle = null;
  function loadBundle() {
    if (EGE.nflSim) { return Promise.resolve(EGE.nflSim); }
    if (!bundle) {
      bundle = new Promise(function (resolve, reject) {
        var script = document.createElement('script');
        script.src = 'js/nfl-sim.js';
        script.onload = function () {
          if (!EGE.nflSim) { reject(new Error('The NFL sim did not load.')); return; }
          /* Every game a week plays keeps its snaps, for Live Mode. */
          EGE.nflSim.season.keepPlays(true);
          resolve(EGE.nflSim);
        };
        script.onerror = function () {
          bundle = null;
          reject(new Error('The NFL sim did not load. Check the connection and open the tab again.'));
        };
        document.head.appendChild(script);
      });
    }
    return bundle;
  }

  /* --- the world in Supabase ----------------------------------------------

     Each file gzipped and in base64 ("gz:..."), or as it is ("json:...") in
     a browser with no CompressionStream. */

  function canZip() {
    return typeof window.CompressionStream === 'function' && typeof window.DecompressionStream === 'function';
  }

  function toBase64(bytes) {
    var text = '';
    for (var i = 0; i < bytes.length; i += 0x8000) {
      text += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return window.btoa(text);
  }

  function fromBase64(b64) {
    var text = window.atob(b64);
    var bytes = new Uint8Array(text.length);
    for (var i = 0; i < text.length; i += 1) { bytes[i] = text.charCodeAt(i); }
    return bytes;
  }

  function pack(text) {
    if (!canZip()) { return Promise.resolve('json:' + text); }
    var stream = new Blob([text]).stream().pipeThrough(new window.CompressionStream('gzip'));
    return new Response(stream).arrayBuffer().then(function (buf) { return 'gz:' + toBase64(new Uint8Array(buf)); });
  }

  function unpack(body) {
    if (body.indexOf('json:') === 0) { return Promise.resolve(body.slice(5)); }
    if (body.indexOf('gz:') !== 0) { return Promise.resolve(body); }
    if (!canZip()) {
      return Promise.reject(new Error('This browser cannot open the saved world. Use a newer Chrome, Safari or Firefox.'));
    }
    var stream = new Blob([fromBase64(body.slice(3))]).stream().pipeThrough(new window.DecompressionStream('gzip'));
    return new Response(stream).text();
  }

  function schemaHint(message) {
    return message + (/nfl_sim_/.test(message) ? ' Run supabase/schema.sql again first.' : '');
  }

  function loadWorld() {
    var c = client();
    if (!c) { return Promise.reject(new Error('Not connected to Supabase.')); }
    return c.from(FILES).select('name, body, updated_at').not('name', 'like', 'rewind-%').not('name', 'like', 'pbp-%').then(function (res) {
      if (res.error) { throw new Error(schemaHint(res.error.message)); }
      return Promise.all((res.data || []).filter(function (row) { return !SAVE_POINT.test(row.name); }).map(function (row) {
        return unpack(row.body).then(function (text) { return { name: row.name, text: text, at: row.updated_at }; });
      }));
    }).then(function (rows) {
      state.files = {};
      state.stamps = {};
      state.dirty = {};
      rows.forEach(function (row) {
        state.files[row.name] = row.text;
        state.stamps[row.name] = row.at;
      });
    });
  }

  /* Only what changed, and only if nobody has saved the world from
     somewhere else since this page loaded it. Save points go first, one at
     a time (each is the size of the league), and then leave the page's
     memory; the files the step removed go last. */
  function saveWorld() {
    var names = Object.keys(state.dirty);
    if (!names.length) { return Promise.resolve(); }
    var c = client();
    if (!c) { return Promise.reject(new Error('Not connected to Supabase.')); }
    var kept = names.filter(function (name) { return state.files[name] !== undefined; });
    var gone = names.filter(function (name) { return state.files[name] === undefined; });
    var points = kept.filter(function (name) { return SAVE_POINT.test(name); });
    var world = kept.filter(function (name) { return !SAVE_POINT.test(name); });
    var now = new Date().toISOString();
    function row(name) {
      return pack(state.files[name]).then(function (body) { return { name: name, body: body, updated_at: now }; });
    }
    note('Saving…');
    return c.from(FILES).select('name, updated_at').then(function (res) {
      if (res.error) { throw new Error(schemaHint(res.error.message)); }
      var moved = (res.data || []).some(function (r) { return !SAVE_POINT.test(r.name) && state.stamps[r.name] !== r.updated_at; });
      if (moved) {
        throw new Error('The world was saved from another tab or device since this page loaded it. ' +
          'Reload the page and try again; nothing from this step was kept.');
      }
      return points.reduce(function (chain, name) {
        return chain.then(function () { return row(name); }).then(function (r) {
          return c.from(FILES).upsert([r], { onConflict: 'name' });
        }).then(function (res) {
          if (res.error) { throw new Error(schemaHint(res.error.message)); }
        });
      }, Promise.resolve());
    }).then(function () {
      return Promise.all(world.map(row));
    }).then(function (rows) {
      return rows.length ? c.from(FILES).upsert(rows, { onConflict: 'name' }).select('name, updated_at') : { data: [] };
    }).then(function (res) {
      if (res.error) { throw new Error(schemaHint(res.error.message)); }
      (res.data || []).forEach(function (r) { state.stamps[r.name] = r.updated_at; });
      return gone.length ? c.from(FILES).delete().in('name', gone) : { error: null };
    }).then(function (res) {
      if (res.error) { throw new Error(schemaHint(res.error.message)); }
      gone.forEach(function (name) { delete state.stamps[name]; });
      Object.keys(state.files).forEach(function (name) { if (SAVE_POINT.test(name)) { delete state.files[name]; } });
      state.dirty = {};
      note('Saved ' + new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) + '.');
    });
  }

  /* A week's save point, into the page's memory for the step that undoes
     it. */
  function fetchSavePoint(name) {
    var c = client();
    if (!c) { return Promise.reject(new Error('Not connected to Supabase.')); }
    return c.from(FILES).select('name, body').eq('name', name).maybeSingle().then(function (res) {
      if (res.error) { throw new Error(schemaHint(res.error.message)); }
      if (!res.data) { throw new Error('That week’s save point is missing.'); }
      return unpack(res.data.body);
    }).then(function (text) { state.files[name] = text; });
  }

  /* The six's boosters on games still to come and their connections, as
     Supabase has them now. A step does not play without them. */
  function loadLive() {
    var c = client();
    if (!c) { return Promise.reject(new Error('Not connected to Supabase.')); }
    return Promise.all([
      c.from('game_boosters').select('email, season, week, item_key'),
      c.from('player_inventory').select('email, item_key, item_name, target, quantity, active').eq('item_key', 'qb-connection')
    ]).then(function (got) {
      got.forEach(function (res) {
        if (res.error) { throw new Error('Could not read the boosters and connections: ' + res.error.message); }
      });
      state.live = { boosters: got[0].data || [], inventory: got[1].data || [] };
    });
  }

  /* Every team's players as the Teams pages show them, for the season the
     league is in. Nothing private goes in (see publicRosters). */
  function publishRosters(league) {
    var c = client();
    if (!c) { return Promise.reject(new Error('Not connected to Supabase.')); }
    var rosters = sim().site.publicRosters(league);
    return c.from(ROSTERS).upsert({ season: rosters.season, rosters: rosters, saved_at: rosters.savedAt },
      { onConflict: 'season' }).then(function (res) {
      if (res.error) { throw new Error(schemaHint(res.error.message)); }
      EGE.nflRosters.set(rosters.season, rosters);
    });
  }

  /* --- the weeks played, stored for the site ------------------------------

     After every step the weeks the sim has played this season go to
     sim_weeks, the way the site lays them over the season file
     (js/stored-weeks.js), so Publish puts a week out with nothing to commit.
     A week that is out stays as it went out. A week undone goes, or is
     stored empty when the file already has it, so the file's copy cannot
     come back. Only what changed is written. */

  var WEEKS = 'sim_weeks';

  /* JSON with every object's keys in order: what Postgres hands back has
     its own order. */
  function stable(value) {
    return JSON.stringify(value, function (key, v) {
      if (!v || typeof v !== 'object' || Array.isArray(v)) { return v; }
      return Object.keys(v).sort().reduce(function (out, k) { out[k] = v[k]; return out; }, {});
    });
  }

  function sameWeek(had, want) {
    var results = had.results;
    var fixtures = had.fixtures;
    return Boolean(results) &&
      stable(results.games) === stable(want.games) && stable(results.scores) === stable(want.scores) &&
      (want.fixtures ? Boolean(fixtures) && stable(fixtures.games) === stable(want.fixtures) : !fixtures);
  }

  function weekRow(season, week, part, games, scores, at) {
    return { season: season, week: week, part: part, games: games || {}, scores: scores || [], saved_at: at };
  }

  function writeWeeks(season, put, drop) {
    var c = client();
    if (!c) { return Promise.reject(new Error('Not connected to Supabase.')); }
    var first = put.length ? c.from(WEEKS).upsert(put, { onConflict: 'season,week,part' }) : Promise.resolve({ error: null });
    return first.then(function (res) {
      if (res.error) { throw new Error(weekHint(res.error.message)); }
      return Promise.all(['results', 'fixtures'].map(function (part) {
        var weeks = drop.filter(function (d) { return d.part === part; }).map(function (d) { return d.week; });
        return weeks.length ? c.from(WEEKS).delete().eq('season', season).eq('part', part).in('week', weeks) : { error: null };
      }));
    }).then(function (all) {
      all.forEach(function (res) { if (res.error) { throw new Error(weekHint(res.error.message)); } });
    });
  }

  function weekHint(message) {
    return message + (/sim_weeks/.test(message) ? ' Run supabase/schema.sql again first.' : '');
  }

  /* Brings sim_weeks in line with the league's season. Resolves to whether
     anything was written. */
  function syncWeeks(league) {
    var season = league.season;
    var stored = EGE.storedWeeks;
    if (!stored) { return Promise.resolve(false); }
    if (!hasSix(season)) {
      /* Before the draft the schedule kept is last season's. */
      var started = league.phase !== 'draft' && (league.schedule || []).some(function (g) { return g.score; });
      return started ? Promise.reject(new Error('There is no stats/' + season + '.js with the ' + season + ' schedule yet. ' +
        'Download it under Put it on the site and put it in stats/.')) : Promise.resolve(false);
    }
    var made = stored.pristine(function () { return sim().site.weekRows(league, season); });
    return EGE.wallet.loadStoredWeeks().then(function () {
      var have = stored.rows(season);
      var at = new Date().toISOString();
      var put = [];
      var drop = [];
      var played = {};
      var imported = {};
      made.imported.forEach(function (week) { imported[week] = true; });

      made.weeks.forEach(function (w) {
        played[w.week] = true;
        var had = have[w.week] || {};
        if (EGE.isPublished(season, w.week) && (had.results || had.fixtures || stored.filed(season, w.week))) { return; }
        if (sameWeek(had, w)) { return; }
        put.push(weekRow(season, w.week, 'results', w.games, w.scores, at));
        if (w.fixtures) { put.push(weekRow(season, w.week, 'fixtures', w.fixtures, [], at)); } else if (had.fixtures) {
          drop.push({ week: w.week, part: 'fixtures' });
        }
      });

      var gone = {};
      Object.keys(have).concat(stored.filedWeeks(season)).forEach(function (week) { gone[week] = true; });
      Object.keys(gone).map(Number).forEach(function (week) {
        if (played[week] || imported[week] || EGE.isPublished(season, week)) { return; }
        var had = have[week] || {};
        if (stored.filed(season, week) || stored.stamped(season, week)) {
          var empty = { games: {}, scores: [], fixtures: {} };
          if (sameWeek(had, empty)) { return; }
          put.push(weekRow(season, week, 'results', {}, [], at));
          put.push(weekRow(season, week, 'fixtures', {}, [], at));
          return;
        }
        if (had.results) { drop.push({ week: week, part: 'results' }); }
        if (had.fixtures) { drop.push({ week: week, part: 'fixtures' }); }
      });

      if (!put.length && !drop.length) { return false; }
      return writeWeeks(season, put, drop).then(function () {
        return EGE.wallet.loadStoredWeeks();
      }).then(function () {
        if (EGE.adminWeeks) { EGE.adminWeeks.refresh(); }
        return true;
      });
    });
  }

  /* --- the six's trades, stored for the site -----------------------------

     A trade that moves one of the six goes to sim_trades with his new
     team's games from the week he moves (lib/six-trades.js), so his page
     has the new schedule at once. Kept in line with the league after every
     step, before the weeks, which are worked out over the games as traded:
     a trade undone goes. A new one takes any wager off the games it
     replaces, and a booster off a week that is now his bye
     (EGE.wallet.clearTradedStickers). A waiver goes to nobody
     (EGE.storedWeeks.WAIVED) with no games, so every sticker from its week
     on comes off. */

  var TRADES = 'sim_trades';

  function tradeKey(t) { return t.season + '|' + t.slug + '|' + t.week; }

  function toTeam(t) { return t.to || EGE.storedWeeks.WAIVED; }

  function tradeHint(message) {
    return message + (/sim_trades/.test(message) ? ' Run supabase/schema.sql again first.' : '');
  }

  function syncTrades(league) {
    var c = client();
    if (!c || !EGE.storedWeeks) { return Promise.resolve(false); }
    var want = sim().sixTrades.siteTrades(league);
    return EGE.wallet.loadStoredWeeks().then(function () {
      var have = {};
      EGE.storedWeeks.trades().forEach(function (row) { have[tradeKey(row)] = row; });
      var at = new Date().toISOString();
      var put = [];
      var fresh = [];
      want.forEach(function (t) {
        var had = have[tradeKey(t)];
        delete have[tradeKey(t)];
        if (had && had.to_team === toTeam(t) && (had.from_team || null) === t.from && stable(had.games) === stable(t.games)) { return; }
        put.push({ season: t.season, slug: t.slug, week: t.week, from_team: t.from, to_team: toTeam(t), games: t.games, saved_at: at });
        if (!had || had.to_team !== toTeam(t)) { fresh.push(t); }
      });
      var drop = Object.keys(have).map(function (key) { return have[key]; });
      if (!put.length && !drop.length) { return false; }
      var first = put.length ? c.from(TRADES).upsert(put, { onConflict: 'season,slug,week' }) : Promise.resolve({ error: null });
      return first.then(function (res) {
        if (res.error) { throw new Error(tradeHint(res.error.message)); }
        return Promise.all(drop.map(function (row) {
          return c.from(TRADES).delete().eq('season', row.season).eq('slug', row.slug).eq('week', row.week);
        }));
      }).then(function (all) {
        all.forEach(function (res) { if (res.error) { throw new Error(tradeHint(res.error.message)); } });
        return EGE.wallet.loadStoredWeeks();
      }).then(function () {
        return fresh.reduce(function (chain, t) {
          return chain.then(function () {
            return EGE.wallet.clearTradedStickers(EGE.playerBySlug(t.slug), t.season, t.week, t.games);
          });
        }, Promise.resolve());
      }).then(function () { return true; });
    });
  }

  /* --- every game's box score, for the League page ------------------------

     Every week the sim has played goes to sim_box_scores (Sam, 2026-10-30):
     each game's score, both teams' numbers, every line, the scoring and who
     got hurt (lib/site.js boxRows), which everybody reads once the week is
     published. Only the weeks whose digest changed are written, a few at a
     time, since the first time is every week there is. A week undone goes,
     unless it is out. Behind the page rather than in front of it: a step is
     done when it is saved, and a sync asked for while one runs runs again
     after it. */

  var BOXES = 'sim_box_scores';
  var BOX_BATCH = 3;
  var boxing = null;
  var boxAgain = false;

  function boxHint(message) {
    return message + (/sim_box_scores/.test(message) ? ' Run supabase/schema.sql again first.' : '');
  }

  function syncBoxes(league) {
    if (boxing) {
      boxAgain = true;
      return boxing;
    }
    var c = client();
    if (!c || !hasWorld()) { return Promise.resolve(false); }
    function fail(err) {
      boxing = null;
      boxAgain = false;
      state.error = 'The League page’s box scores were not brought up to date: ' + (err.message || err);
      if (!state.busy) { draw(); }
      return false;
    }
    var want;
    var world;
    try {
      world = league || openLeague();
      want = sim().site.boxRows(world);
    } catch (err) {
      return Promise.resolve(fail(err));
    }
    /* Which weeks kept their snaps, for their top plays: a week that did
       is up to date only once its row carries them (PLAYS_MARK). */
    var snaps = c.from(FILES).select('name').like('name', 'pbp-%').then(function (res) {
      var out = {};
      (res.error ? [] : res.data || []).forEach(function (row) { out[row.name] = true; });
      return out;
    }, function () { return {}; });
    boxing = Promise.all([c.from(BOXES).select('season, week, digest'), snaps]).then(function (both) {
      var res = both[0];
      var kept = both[1];
      if (res.error) { throw new Error(boxHint(res.error.message)); }
      var have = {};
      (res.data || []).forEach(function (row) { have[row.season + ':' + row.week] = row; });
      var at = new Date().toISOString();
      var put = want.filter(function (row) {
        var had = have[row.season + ':' + row.week];
        delete have[row.season + ':' + row.week];
        row.snaps = Boolean(kept[sim().season.playsFile(row.season, row.week)]);
        return !had || had.digest !== row.digest + (row.snaps ? PLAYS_MARK : '');
      }).map(function (row) {
        return { season: row.season, week: row.week, games: row.games, digest: row.digest, saved_at: at, snaps: row.snaps };
      });
      var drop = Object.keys(have).map(function (key) { return have[key]; }).filter(function (row) {
        return !EGE.isPublished(row.season, row.week);
      });
      var batches = [];
      for (var i = 0; i < put.length; i += BOX_BATCH) { batches.push(put.slice(i, i + BOX_BATCH)); }
      return batches.reduce(function (chain, batch) {
        return chain.then(function () {
          return Promise.all(batch.map(function (row) { return withPlays(row, world); }));
        }).then(function (rows) {
          return c.from(BOXES).upsert(rows, { onConflict: 'season,week' }).then(function (res) {
            if (res.error) { throw new Error(boxHint(res.error.message)); }
          });
        });
      }, Promise.resolve()).then(function () {
        return Promise.all(drop.map(function (row) {
          return c.from(BOXES).delete().eq('season', row.season).eq('week', row.week);
        }));
      }).then(function (all) {
        all.forEach(function (res) { if (res.error) { throw new Error(boxHint(res.error.message)); } });
        if ((put.length || drop.length) && EGE.boxScores) { EGE.boxScores.forget(); }
        return Boolean(put.length || drop.length);
      });
    }).then(function (done) {
      boxing = null;
      if (boxAgain) {
        boxAgain = false;
        return syncBoxes();
      }
      return done;
    }, fail);
    return boxing;
  }

  /* A week's top plays onto its games (js/top-plays.js), from the snaps
     it kept: its row is then marked as having them. A week whose snaps
     cannot be read goes up without, unmarked, to be tried again. */
  var PLAYS_MARK = ':plays';

  function withPlays(row, league) {
    var snaps = row.snaps;
    delete row.snaps;
    if (!snaps || !EGE.topPlays || !EGE.liveHeat) { return Promise.resolve(row); }
    return fetchPlays(row.season, row.week).then(function (file) {
      row.games.forEach(function (g) {
        var kept = file.games && file.games[sim().season.gameKey(g)];
        if (!kept || !g.box) { return; }
        var entries = sim().liveGame.build(league, { home: g.home, away: g.away }, kept).entries;
        g.plays = EGE.topPlays.pick(entries, EGE.liveHeat.map(entries));
      });
      row.digest += PLAYS_MARK;
      return row;
    }).catch(function () { return row; });
  }

  /* The trades, then the weeks over them; the box scores after, behind,
     whether or not those went. */
  function syncSite(league) {
    var done = syncTrades(league).then(function () { return syncWeeks(league); });
    done.then(function () { syncBoxes(league); }, function () { syncBoxes(league); });
    return done;
  }

  /* The stored weeks not out yet, oldest first, as { season, week }. */
  function waiting() {
    var out = [];
    (EGE.seasonsPlayed ? EGE.seasonsPlayed() : []).forEach(function (season) {
      var rows = EGE.storedWeeks ? EGE.storedWeeks.rows(season) : {};
      Object.keys(rows).map(Number).sort(function (a, b) { return a - b; }).forEach(function (week) {
        var r = rows[week].results;
        if (r && Object.keys(r.games || {}).length && !EGE.isPublished(season, week)) { out.push({ season: season, week: week }); }
      });
    });
    return out;
  }

  /* --- the league -------------------------------------------------------- */

  /* The league as saved, read fresh: what every step starts from. */
  function openLeague() {
    sim().use(state.files, state.dirty, EGE, state.live);
    return sim().run.open(WORLD, SEED);
  }

  function hasWorld() { return Boolean(state.files && state.files['league.json']); }

  /* Runs `fn(league)` and keeps what it did: the league and every file it
     wrote saved, the rosters published. Anything that throws -- the sim
     refusing, or the save -- leaves the world as it was. `first` is a file
     to fetch before it (a save point); `after` runs once it is saved. */
  function step(fn, first, after) {
    if (state.busy) { return Promise.resolve(); }
    state.busy = true;
    state.error = null;
    draw();
    var before = Object.assign({}, state.files);
    return new Promise(function (resolve) { window.setTimeout(resolve, 30); }).then(function () {
      return Promise.all([loadLive(), first ? fetchSavePoint(first) : null]);
    }).then(function () {
      var league = openLeague();
      var had = approvedIds(league);
      var made = fn(league);
      sim().run.save(league);
      var posts = tradePosts(league, had);
      return saveWorld().then(function () {
        state.last = made;
        state.week = '';
        return after ? Promise.resolve().then(after).catch(function () { return null; }) : null;
      }).then(function () {
        return postTrades(posts);
      }).then(function (problem) {
        if (problem) { state.error = problem; }
        /* The step is kept whatever happens to the stored weeks and
           trades, which the next step (or opening the tab) stores again,
           and the rosters, which can be sent again with Update rosters
           now. */
        return syncSite(league).catch(function (err) {
          state.error = 'Saved, but the site was not brought up to date: ' + (err.message || err);
        });
      }).then(function () {
        return publishing() ? publishRosters(league).catch(function (err) {
          state.error = 'Saved, but the Teams pages were not updated: ' + (err.message || err);
        }) : null;
      });
    }).catch(function (err) {
      state.files = before;
      state.dirty = {};
      state.error = err && err.message ? err.message : String(err);
      note('');
    }).then(function () {
      state.busy = false;
      draw();
    });
  }

  /* --- the trades bot ---------------------------------------------------

     Every trade a step puts through -- approved from the queue, made in the
     builder, or made from a team page's trade finder -- goes to the trades
     bot's channel once the world is saved, tweeted by ESPN (Sam,
     2026-11-10: js/media-news.js trade writes it, the Media page draws and
     posts it). Found by what the step approved, so no way of making one is
     missed. A free-agent move is a signing, not a trade, and stays out. */
  function approvedIds(league) {
    return sim().run.queue(league, true).filter(function (t) { return t.status === 'approved'; })
      .map(function (t) { return t.id; });
  }

  function tradeWhen(at) {
    var s = at.season;
    return ({ preseason: s + ' preseason', regular: s + ' Week ' + at.week, deadline: s + ' trade deadline',
              playoffs: s + ' playoffs', offseason: (s + 1) + ' offseason', draft: s + ' offseason' })[at.phase] || String(s);
  }

  /* What one team sends, as the post lists it. The six at the website's
     overall, which is theirs. */
  function tradeItem(league, give, from, numbers) {
    if (give.player) {
      var p = league.byId.get(give.player);
      if (!p) { return { pos: '', name: give.player, ovr: '' }; }
      var six = p.ege && EGE.playerBySlug ? EGE.playerBySlug(p.ege) : null;
      return { pos: p.pos, name: p.name, ovr: six ? EGE.overallFor(six) : p.ovr, six: Boolean(p.ege) };
    }
    var id = /^(\d{4})-R(\d+)-(\w+)$/.exec(give.pick) || [];
    var year = Number(id[1]);
    var round = Number(id[2]);
    return { year: year, round: round, n: numbers[give.pick] || null, from: id[3] !== from ? id[3] : null };
  }

  function tradePosts(league, had) {
    var trades = sim().run.queue(league, true).filter(function (t) {
      return t.status === 'approved' && t.kind !== 'move' && had.indexOf(t.id) === -1;
    });
    if (!trades.length) { return []; }
    /* Each pick's number in its draft, where the order is known. */
    var numbers = {};
    var board = sim().draftPlan.board(league);
    Object.keys(board).forEach(function (key) {
      board[key].forEach(function (p) {
        if (p.n) { numbers[p.year + '-R' + p.round + '-' + p.from] = p.n; }
      });
    });
    return trades.map(function (t) {
      return {
        id: t.id,
        when: tradeWhen(t.approvedAt || league),
        sides: t.teams.map(function (key, i) {
          var other = t.teams[1 - i];
          return { team: key, gets: (t.gives[other] || []).map(function (give) { return tradeItem(league, give, other, numbers); }) };
        })
      };
    });
  }

  /* ESPN's tweets, one after another, so they land in the order the trades
     were made. One that does not land leaves the trade made: what it says
     is why, or null when every one went (or there is no trades webhook to
     send to). */
  function postTrades(trades) {
    if (!trades.length || !EGE.mediaNews || !EGE.mediaView) { return Promise.resolve(null); }
    var tweets = [];
    trades.forEach(function (t) {
      var tweet = EGE.mediaNews.trade(t);
      if (!tweet) { return; }
      tweets.push(Object.assign(tweet, { tag: 'trade:' + t.id }));
      /* Now and then Ian Rapoport says what he makes of it, right after
         (js/media-voices.js). */
      var take = EGE.mediaVoices ? EGE.mediaVoices.trade(t) : null;
      if (take) { tweets.push(Object.assign(take, { tag: 'trade:' + t.id })); }
    });
    return EGE.mediaView.postMany(tweets).then(function (problem) {
      return problem ? 'Traded, but ESPN did not tweet it: ' + problem : null;
    }, function (err) { return 'Traded, but ESPN did not tweet it: ' + (err.message || err); });
  }

  /* --- what a step says it did ------------------------------------------- */

  function scoreLine(g) {
    return nick(g.away) + ' ' + g.score[1] + (g.neutral ? ' vs. ' : ' at ') + nick(g.home) + ' ' + g.score[0] + (g.ot ? ' (OT)' : '');
  }

  function injuryLines(list) {
    return list.filter(function (i) { return i.games >= 3 || i.ege; }).map(function (i) {
      return 'Injury: ' + i.name + ' (' + i.team + ', ' + i.pos + '), ' + i.what + ', ' +
        (i.season ? 'out for the season' : 'out ' + i.games + ' weeks');
    });
  }

  function weekLines(r) {
    var lines = [(r.round || 'Week ' + r.week) + ': ' + r.games.map(scoreLine).join(', ')];
    lines = lines.concat(injuryLines(r.injuries || []));
    (r.boosted || []).forEach(function (b) {
      lines.push('Booster: ' + b.name + ' ' + b.multiplier.toFixed(1) + 'x, ' + b.points + ' FPTS');
    });
    if (r.deadline) { lines.push('The trade deadline is open: ' + r.deadline + ' proposals are waiting below.'); }
    return lines;
  }

  /* --- drawing ----------------------------------------------------------- */

  function button(text, primary, onClick, disabled) {
    var b = el('button', 'fb-btn' + (primary ? ' fb-btn--primary' : ''), text);
    b.type = 'button';
    b.disabled = Boolean(disabled) || state.busy;
    b.addEventListener('click', onClick);
    return b;
  }

  function section(title, blurb) {
    var box = el('div', 'ege-demo ege-sim__part');
    box.appendChild(el('h4', 'ege-item__name', title));
    if (blurb) { box.appendChild(el('p', 'fb-meta', blurb)); }
    return box;
  }

  function row() { return el('div', 'fb-row fb-row--wrap ege-weekbar'); }

  var ROUND_BUTTONS = {
    'Wild Card': 'Wild Card round', Divisional: 'Divisional round',
    'Conference Championship': 'Conference Championships', 'Super Bowl': 'Super Bowl'
  };

  var PHASES = {
    preseason: 'Before kickoff', regular: 'Regular season', deadline: 'Trade deadline',
    playoffs: 'Playoffs', offseason: 'Season over', draft: 'Offseason, before the draft'
  };

  /* The last NFL week out on the site, to take the sim up from. */
  function lastPublished(season) {
    var last = 0;
    for (var week = 1; week <= 18; week += 1) {
      if (EGE.isPublished(season, week)) { last = week; }
    }
    return last;
  }

  function drawStart(body) {
    var part = section('Start the world',
      'The league starts at the 2023 kickoff. Weeks the site has already put out are taken as they were ' +
      'played -- the six’s games from their season file and everybody else’s real scores -- ' +
      'and the sim plays every NFL game from the week after.');
    var r = row();
    var label = el('label', 'ege-field ege-field--inline');
    label.appendChild(el('span', 'fb-eyebrow', 'Take from the site'));
    var pick = el('select', 'fb-select');
    var last = lastPublished(2023);
    for (var week = 0; week <= 18; week += 1) {
      var option = el('option', null, week ? 'Weeks 1–' + week : 'Nothing (sim from Week 1)');
      if (week === 1) { option.textContent = 'Week 1'; }
      option.value = week;
      pick.appendChild(option);
    }
    pick.value = String(last);
    label.appendChild(pick);
    r.appendChild(label);
    r.appendChild(button('Start the world', true, function () {
      var through = Number(pick.value);
      step(function (league) {
        if (!through) { return { title: 'Started at the 2023 kickoff', lines: [] }; }
        var got = sim().run.importSite(league, through);
        var lines = ['Took Weeks ' + got.from + '–' + got.through + ' of ' + league.season + ' from the site: ' + got.games + ' games.'];
        if (got.deadline) { lines.push('The trade deadline is open: ' + got.deadline + ' proposals are waiting below.'); }
        return { title: 'Started the world', lines: lines };
      });
    }));
    part.appendChild(r);
    body.appendChild(part);
  }

  /* What a stored week is called on its button: its round in the playoffs. */
  function weekLabel(league, at) {
    var point = at.season === league.season ? sim().run.savePoints(league).filter(function (p) { return p.week === at.week; })[0] : null;
    return (point ? point.label : 'Week ' + at.week) + (at.season !== league.season ? ' of ' + at.season : '');
  }

  /* Puts a stored week out the way the Weeks tab's Publish does: the week,
     the credits and diamonds it pays, and the Discord posts. Then the
     rosters again, so the players' pop-ups count the week in their season
     lines (publicRosters takes off every week not out yet). */
  function publishStored(at, label) {
    if (state.busy || !EGE.adminWeeks) { return; }
    state.busy = true;
    state.error = null;
    draw();
    EGE.adminWeeks.publish(at.season, at.week).then(function (res) {
      if (res && !res.ok) { state.error = res.message; return; }
      state.last = { title: label + ' is out', lines: res && res.message ? [res.message] : [] };
      return Promise.resolve().then(function () {
        var league = openLeague();
        if (league.season === at.season) { return publishRosters(league); }
      }).catch(function (err) {
        state.last.lines.push('The rosters did not go out again: ' + (err.message || err));
      });
    }, function (err) {
      state.error = err.message || String(err);
    }).then(function () {
      state.busy = false;
      draw();
    });
  }

  function drawPlay(body, league) {
    var part = section('Play');
    var r = row();
    var season = sim().season;
    var phase = league.phase;
    var next = waiting()[0];
    if (next) {
      var nextLabel = weekLabel(league, next);
      /* Not while one of its games is still being played live: the site
         would have the score before the game does. */
      var onAir = liveOn(next.season, next.week);
      r.appendChild(button('Publish ' + nextLabel, true, function () { publishStored(next, nextLabel); }, onAir));
      if (onAir) { part.appendChild(el('p', 'fb-meta', 'Publish once the live game is over.')); }
    }
    if (phase === 'regular' || phase === 'deadline') {
      var deadlineAhead = phase === 'regular' && league.week <= season.DEADLINE_WEEK;
      r.appendChild(button('Play Week ' + league.week, !next, function () {
        step(function (l) { return { title: 'Week ' + l.week, lines: weekLines(sim().run.playNext(l)) }; });
      }));
      r.appendChild(button(deadlineAhead ? 'Play to the trade deadline' : 'Play the rest of the regular season', false, function () {
        step(function (l) {
          var lines = [];
          sim().run.playOn(l).forEach(function (w) { lines = lines.concat(weekLines(w)); });
          if (l.phase === 'playoffs') { lines.push('The regular season is over: the playoffs are next.'); }
          return { title: deadlineAhead ? 'To the trade deadline' : 'The rest of the regular season', lines: lines };
        });
      }));
      if (phase === 'deadline') {
        part.appendChild(el('p', 'fb-meta',
          'The trade deadline is open. Approve or reject the trades below; playing on closes it, and anything not approved expires.'));
      }
    } else if (phase === 'playoffs') {
      var round = season.ROUNDS[league.playoffs.rounds.length];
      r.appendChild(button('Play the ' + (ROUND_BUTTONS[round] || round), !next, function () {
        step(function (l) {
          var got = sim().run.playNext(l);
          var lines = weekLines(got);
          if (l.playoffs.champion) { lines.push('Champion: ' + teamName(l.playoffs.champion) + '.'); }
          return { title: got.round, lines: lines };
        });
      }));
      r.appendChild(button('Play the rest of the playoffs', false, function () {
        step(function (l) {
          var got = sim().run.playPlayoffs(l);
          var lines = [];
          got.rounds.forEach(function (w) { lines = lines.concat(weekLines(w)); });
          lines.push('Champion: ' + teamName(got.champion) + '.');
          return { title: 'The playoffs', lines: lines };
        });
      }));
    } else if (phase === 'offseason') {
      part.appendChild(el('p', 'fb-meta',
        'Aging, retirements, contracts, free agency and coaching changes, then the pre-draft trade proposals.'));
      r.appendChild(button('Run the ' + (league.season + 1) + ' offseason', true, function () {
        step(function (l) {
          var got = sim().run.offseason(l);
          var lines = [];
          if (got.champion) { lines.push(teamName(got.champion) + ' won the Super Bowl.'); }
          if (got.the99s.length) { lines.push('99s: ' + got.the99s.join('; ')); }
          got.bigChanges.forEach(function (c) {
            lines.push(c.name + ' (' + c.pos + ', ' + c.age + '): ' + c.before + ' to ' + c.after + (c.note ? ' (' + c.note + ')' : ''));
          });
          if (got.retired.length) { lines.push('Retired: ' + got.retired.join(', ')); }
          if (got.capCasualties.length) { lines.push('Cap casualties: ' + got.capCasualties.join(', ')); }
          if (got.leftInFreeAgency.length) { lines.push('Hit free agency: ' + got.leftInFreeAgency.join(', ')); }
          if (got.signings.length) { lines.push('Signed: ' + got.signings.join('; ')); }
          got.schemes.forEach(function (n) { lines.push(n); });
          (got.sixOffers || []).forEach(function (f) {
            lines.push(f.name + ' is a free agent: ' + f.offers + (f.offers === 1 ? ' offer' : ' offers') + ' below.');
          });
          if (got.moves.length) { lines.push(got.moves.length + ' big free-agent moves are waiting below.'); }
          lines.push(got.trades.length + ' pre-draft trade proposals are waiting below.');
          return { title: 'The ' + got.season + ' offseason', lines: lines };
        });
      }));
    } else if (phase === 'draft') {
      drawDraft(part, r, league);
    }
    part.appendChild(r);
    drawAgain(part, league);
    body.appendChild(part);
  }

  /* A week played this season, picked to play again on new dice or to go
     back to before it. Weeks after it are undone either way, and so is
     anything changed since; nothing from before a week that is out on the
     site can be. */
  function drawAgain(part, league) {
    var points = sim().run.savePoints(league);
    if (!points.length) { return; }
    var r = row();
    var label = el('label', 'ege-field ege-field--inline');
    var pick = el('select', 'fb-select');
    pick.setAttribute('aria-label', 'Week to resim');
    points.forEach(function (p) {
      var option = el('option', null, p.label + (p.changes ? ' · undoes ' + p.changes + (p.changes === 1 ? ' change' : ' changes') : ''));
      option.value = p.week;
      pick.appendChild(option);
    });
    if (points.some(function (p) { return String(p.week) === state.again; })) { pick.value = state.again; }
    pick.addEventListener('change', function () { state.again = pick.value; });
    label.appendChild(pick);
    r.appendChild(label);
    function file() { return sim().rewind.fileFor(league.season, Number(pick.value)); }
    /* A live game of a week played again, or undone, is not that game any
       more: it comes off. */
    function offAir() { var week = Number(pick.value); return function () { return dropLive(league.season, week); }; }
    r.appendChild(button('Resim', false, function () {
      state.again = pick.value;
      step(function (l) {
        var got = sim().run.resim(l, Number(pick.value));
        return { title: got.undone.label + ' again', lines: weekLines(got.played).concat(undoneLines(got.undone)) };
      }, file(), offAir());
    }));
    r.appendChild(button('Undo', false, function () {
      step(function (l) {
        var got = sim().run.undo(l, Number(pick.value));
        return { title: 'Back to before ' + got.label, lines: undoneLines(got) };
      }, file(), offAir());
    }));
    part.appendChild(r);
  }

  function undoneLines(u) {
    var lines = [];
    if (u.later.length) { lines.push('Undone too: ' + u.later.join(', ') + '.'); }
    if (u.changes) { lines.push('Undone: ' + u.changes + (u.changes === 1 ? ' change' : ' changes') + ' made since.'); }
    return lines;
  }

  /* --- Live Mode ------------------------------------------------------------

     A game of the week just played, put out on the site snap by snap (Sam,
     2026-11-03): js/live.js plays it, a snap every 20 seconds, the same for
     everybody; the bot posts its big plays to Discord as they happen
     (EGE.discordPost.buildLivePosts). Each game can be played again on its
     own first (run.resimGame), as often as wanted, without touching the
     rest of the week. PLAY LIVE builds the feed and the posts from the
     game's snaps (pbp-{season}-{week}.json, lib/live.js), and its bets
     from the league as it stood before the week (the week's save point,
     lib/live-bets.js), hands them all to live_start and opens the game's
     page: the bot says it is on at once, and the game waits there for an
     admin to kick it off (Sam, 2026-11-04), taking bets until then.
     Supabase's own clock sends the posts, or this page does while it is
     open when there is none (live_claim). Publishing the week waits until
     the game is over. A game on can be paused, ended, restarted or
     cancelled (live_control, also on the live page itself), and Test plays
     one on this device alone first, posting nothing (js/live.js). */

  /* A whole snap, and how long its call shows before the play does
     (nfl-sim/lib/live.js TIMING, Sam, 2026-11-10). */
  var LIVE_SLOT = 16000;
  var LIVE_REVEAL = 5000;

  function liveHint(message) {
    return message + (/live_/.test(message) ? ' Run supabase/schema.sql again first.' : '');
  }

  function liveId(season, week, g) { return [season, week, g.away, g.home].join('-').toLowerCase(); }

  function liveEnds(row) { return EGE.liveView.ends(row); }

  function liveRow(id) { return state.liveGames.filter(function (r) { return r.id === id; })[0] || null; }

  /* Whether a game of the week has still to finish live. */
  function liveOn(season, week) {
    var now = Date.now();
    return state.liveGames.some(function (r) { return r.season === season && r.week === week && liveEnds(r) > now; });
  }

  function loadLiveGames() {
    var c = client();
    if (!c) { return Promise.resolve(); }
    return c.from('live_games').select(EGE.liveView.columns)
      .order('created_at', { ascending: false }).limit(40).then(function (res) {
        state.liveGames = res.error ? [] : (res.data || []);
        if (state.liveGames.some(function (r) { return liveEnds(r) + 60000 > Date.now(); })) { keepPosting(); }
      }, function () { state.liveGames = []; });
  }

  /* Takes off every live game of the season from `week` on, or just the
     one game `only`. */
  function dropLive(season, week, only) {
    var c = client();
    var ids = state.liveGames.filter(function (r) {
      return only ? r.id === only : r.season === season && r.week >= week;
    }).map(function (r) { return r.id; });
    if (!c || !ids.length) { return Promise.resolve(); }
    return c.from('live_games').delete().in('id', ids).then(function () { return loadLiveGames(); });
  }

  /* What the bot heads a game with: Week Ten, or the round (Super Bowl
     LXII, AFC Championship). */
  function roman(n) {
    var out = '';
    [[50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']].forEach(function (p) {
      while (n >= p[0]) { out += p[1]; n -= p[0]; }
    });
    return out;
  }

  function liveHeading(season, label, week, home) {
    if (label === 'Super Bowl') { return 'Super Bowl ' + roman(season - 1965); }
    if (label === 'Conference Championship') { return (EGE.nfl.teams[home] || {}).conf + ' Championship'; }
    if (label === 'Divisional') { return 'Divisional Round'; }
    if (label === 'Wild Card') { return 'Wild Card Round'; }
    return 'Week ' + EGE.discordPost.weekWord(week);
  }

  /* The six on either team that week, for the game's Game Packs
     (live_games.six, by slug): a game with none of them in it pays none;
     and for whose booster or wager on that week the game locks while it is
     on (live_games.emails, Sam, 2026-11-09). */
  function sixPlaying(season, week, g) {
    return (EGE.players || []).filter(function (p) {
      var site = EGE.teamKeyFor ? EGE.teamKeyFor(p, season, week) : null;
      var team = site && EGE.teams ? EGE.teams[site] : null;
      var key = team && team.tier === 'nfl' ? EGE.nfl.keyForSite(site) : null;
      return key === g.home || key === g.away;
    });
  }

  /* The home side's projected margin, as the site's lines have it. */
  function liveMargin(season, week, g) {
    var ready = EGE.nflRosters ? EGE.nflRosters.load(season).catch(function () { return null; }) : Promise.resolve();
    return ready.then(function () {
      try {
        return EGE.matchLine(season, week, teamName(g.home), teamName(g.away), g.neutral).margin;
      } catch (err) {
        return null;
      }
    });
  }

  function fetchPlays(season, week) {
    var c = client();
    var name = sim().season.playsFile(season, week);
    return c.from(FILES).select('body').eq('name', name).maybeSingle().then(function (res) {
      if (res.error) { throw new Error(schemaHint(res.error.message)); }
      if (!res.data) { throw new Error('This week was played before games kept their snaps. Resim it first.'); }
      return unpack(res.data.body);
    }).then(function (text) { return JSON.parse(text); });
  }

  /* The game's feed and posts plan, from its kept snaps, and its bets:
     { plan, bets: { bets, half, results } }. `margin` is the site's line
     for it, which the spreads are made from, as the bot's posts make
     theirs. */
  function livePlan(season, week, g, playoff, margin) {
    return fetchPlays(season, week).then(function (file) {
      var kept = file.games[sim().season.gameKey(g)];
      if (!kept) { throw new Error('That game has no snaps kept. Resim it first.'); }
      var league = openLeague();
      var plan = sim().liveGame.build(league, { home: g.home, away: g.away }, kept);
      return liveBets(league, season, week, g, playoff, margin, kept, plan).then(function (bets) {
        return { plan: plan, bets: bets };
      });
    });
  }

  /* What can be bet on it, priced from the league as it stood before the
     week was played: its save point, read here and left out of the
     world's files. */
  function liveBets(league, season, week, g, playoff, margin, kept, plan) {
    var c = client();
    var name = sim().rewind.fileFor(season, week);
    return c.from(FILES).select('body').eq('name', name).maybeSingle().then(function (res) {
      if (res.error || !res.data) { return null; }
      return unpack(res.data.body).then(function (text) { return JSON.parse(text).league; });
    }).then(function (pre) {
      if (pre) { pre.world = league.world; }
      var log = state.files['games-' + season + '.json'];
      return sim().liveBets.build(pre, { season: season, week: week, home: g.home, away: g.away,
                                         neutral: Boolean(g.neutral), playoff: Boolean(playoff),
                                         margin: typeof margin === 'number' ? margin : null },
        kept, plan, log ? JSON.parse(log) : []);
    });
  }

  function liveTitle(g) { return nick(g.away) + (g.neutral ? ' vs. ' : ' at ') + nick(g.home); }

  /* Test: the game played on this device alone, nobody else seeing it and
     nothing posted (Sam, 2026-11-03). */
  function testLive(season, week, g, playoff) {
    if (state.busy) { return; }
    state.busy = true;
    state.error = null;
    draw();
    liveMargin(season, week, g).then(function (margin) {
      return livePlan(season, week, g, playoff, margin);
    }).then(function (got) {
      var plan = got.plan;
      EGE.liveView.startTest({ season: season, week: week, home: g.home, away: g.away, title: liveTitle(g) },
        plan.entries, plan.length, LIVE_SLOT, LIVE_REVEAL, got.bets);
      state.busy = false;
      window.location.hash = '#live/test';
    }).catch(function (err) {
      state.error = err && err.message ? err.message : String(err);
      state.busy = false;
      draw();
    });
  }

  /* PLAY LIVE: the game up on its page, waiting for an admin to kick it
     off there, and the bot's first post out now (Sam, 2026-11-04). */
  function playLive(at, g) {
    if (state.busy) { return; }
    var c = client();
    if (!c) { state.error = 'Not connected to Supabase.'; draw(); return; }
    state.busy = true;
    state.error = null;
    draw();
    var season = at.season;
    var week = at.week;
    var id = liveId(season, week, g);
    var plan;
    var opened = false;
    liveMargin(season, week, g).then(function (margin) {
      return livePlan(season, week, g, at.playoff, margin).then(function (got) { return [got, margin]; });
    }).then(function (got) {
      plan = got[0].plan;
      var posts = EGE.discordPost.buildLivePosts(plan, {
        id: id, season: season, week: week, home: g.home, away: g.away, title: at.heading,
        margin: got[1], start: Date.now(), delay: 0, slot: LIVE_SLOT, reveal: LIVE_REVEAL
      });
      var six = sixPlaying(season, week, g);
      return c.rpc('live_start', {
        p_game: { id: id, season: season, week: week, home: g.home, away: g.away, title: liveTitle(g),
                  slot_ms: LIVE_SLOT, reveal_ms: LIVE_REVEAL, length_ms: plan.length,
                  six: six.map(function (p) { return p.slug; }),
                  emails: six.map(function (p) { return p.email ? String(p.email).toLowerCase() : null; }).filter(Boolean) },
        p_entries: plan.entries,
        p_posts: posts,
        p_bets: got[0].bets
      });
    }).then(function (res) {
      if (res.error) { throw new Error(liveHint(res.error.message)); }
      var mins = Math.round(plan.length / 60000);
      state.last = { title: liveTitle(g) + ' is up, waiting for its kickoff',
                     lines: [plan.entries.filter(function (e) { return e.call; }).length + ' snaps, about ' + mins + ' minutes.'].concat(
                       res.data && res.data.cron ? [] : ['Keep this page open while it plays: it sends the Discord posts.']) };
      opened = true;
      return loadLiveGames();
    }).catch(function (err) {
      state.error = err && err.message ? err.message : String(err);
    }).then(function () {
      state.busy = false;
      if (opened) { window.location.hash = '#live/' + id; } else { draw(); }
    });
  }

  /* Pause, resume, end, restart or cancel a game on (live_control). */
  function controlLive(id, action) {
    if (state.busy) { return; }
    state.liveSure = '';
    state.error = null;
    EGE.liveView.control(id, action).catch(function (err) {
      state.error = err && err.message ? err.message : String(err);
    }).then(function () { return loadLiveGames(); }).then(draw);
  }

  /* The posts that are due, when Supabase has no clock to send them: one
     at a time, in order, while a game is on and this page is open. */
  var posting = null;
  function keepPosting() {
    if (posting) { return; }
    var c = client();
    if (!c) { return; }
    function more() {
      var on = state.liveGames.some(function (r) { return liveEnds(r) + 60000 > Date.now(); });
      if (!on) { posting = null; return; }
      c.rpc('live_claim').then(function (res) {
        if (res.error || !res.data) { return false; }
        return EGE.wallet.postLiveToDiscord(res.data).then(function () { return true; });
      }).catch(function () { return false; }).then(function (sent) {
        posting = window.setTimeout(more, sent ? 1500 : 4000);
      });
    }
    posting = window.setTimeout(more, 0);
  }

  function liveStatus(row) {
    function time(ms) { return new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
    if (!row.starts_at) { return 'Waiting for kickoff'; }
    if (row.paused_at) { return 'Paused'; }
    var start = Date.parse(row.starts_at);
    if (Date.now() < start) { return 'Kicks off ' + time(start); }
    if (Date.now() < liveEnds(row)) { return 'Live · ends about ' + time(liveEnds(row)); }
    return 'Final';
  }

  function drawLive(body, league) {
    var last = sim().rewind.points(league)[0];
    var rows = state.liveGames.filter(function (r) { return r.season === league.season; });
    var at = last && !EGE.isPublished(league.season, last.week) ? last : null;
    if (!at && !rows.some(function (r) { return liveEnds(r) > Date.now(); })) { return; }
    var part = section('Live');
    var list = el('div', 'ege-live-admin');
    var shown = {};

    /* A game's line: its score, the six in it and how it stands live on
       the left; what can be done with it on the right. */
    function line(text, names) {
      var row = el('div', 'ege-live-admin__game');
      var info = el('div', 'ege-live-admin__info');
      info.appendChild(el('span', 'ege-live-admin__score', text));
      if (names) { info.appendChild(el('span', 'fb-meta', names)); }
      var acts = el('div', 'ege-live-admin__acts');
      row.appendChild(info);
      row.appendChild(acts);
      return { row: row, info: info, acts: acts };
    }

    function liveButtons(r, l) {
      shown[r.id] = true;
      l.info.appendChild(el('span', 'fb-meta ege-live-admin__state', liveStatus(r)));
      var open = el('a', 'fb-btn fb-btn--sm', 'Open');
      open.href = '#live/' + r.id;
      l.acts.appendChild(open);
      var on = liveEnds(r) > Date.now();
      /* `sure`: what it says on the second click it waits for. */
      function act(label, action, sure) {
        var key = r.id + ':' + action;
        var asking = state.liveSure === key;
        l.acts.appendChild(button(asking ? sure : label, asking, function () {
          if (sure && !asking) { state.liveSure = key; draw(); } else { controlLive(r.id, action); }
        }));
      }
      /* Waiting, it is kicked off from its own page. */
      if (!r.starts_at) { on = false; }
      if (on) { act(r.paused_at ? 'Resume' : 'Pause', r.paused_at ? 'resume' : 'pause'); }
      if (on) {
        act('Restart', 'restart', 'Restart from kickoff');
        act('End', 'end', 'End it now');
      }
      act('Cancel', 'cancel', 'Cancel for good');
    }

    function gameRows(g, w, names, into) {
      var id = liveId(league.season, at.week, g);
      var l = line(scoreLine(g), names);
      var r = liveRow(id);
      if (r) { liveButtons(r, l); }
      if (!r || liveEnds(r) <= Date.now()) {
        l.acts.appendChild(button('Resim', false, function () {
          step(function (lg) {
            var got = sim().run.resimGame(lg, at.week, g.home, g.away);
            return { title: nick(g.away) + (g.neutral ? ' vs. ' : ' at ') + nick(g.home) + ' again', lines: [scoreLine(got.game)] };
          }, sim().rewind.fileFor(league.season, at.week), function () {
            return r ? dropLive(league.season, at.week, id) : null;
          });
        }));
        var playoff = w.label !== 'Week ' + at.week;
        l.acts.appendChild(button('Test', false, function () { testLive(league.season, at.week, g, playoff); }));
        l.acts.appendChild(button('PLAY LIVE', true, function () {
          playLive({ season: league.season, week: at.week, playoff: playoff,
                     heading: liveHeading(league.season, w.label, at.week, g.home) }, g);
        }));
      }
      into.appendChild(l.row);
      return Boolean(r);
    }

    if (at) {
      var w = sim().weeks.week(league, league.season, at.week);
      var six = {};
      w.six.forEach(function (x) { six[x.team] = (six[x.team] || []).concat(x.name); });
      /* The six's games, then the rest of the week folded away. */
      var more = el('details', 'ege-live-admin__more');
      more.appendChild(el('summary', 'fb-meta', 'Every other game'));
      w.games.forEach(function (g) {
        var names = (six[g.home] || []).concat(six[g.away] || []);
        if (names.length) {
          gameRows(g, w, names.join(', '), list);
        } else if (gameRows(g, w, null, more)) {
          more.open = true;
        }
      });
      if (more.children.length > 1) { list.appendChild(more); }
    }

    /* Anything else still on, from an earlier week. */
    rows.forEach(function (r) {
      if (shown[r.id] || liveEnds(r) <= Date.now()) { return; }
      var l = line(r.title + ' \u00b7 Week ' + r.week, null);
      liveButtons(r, l);
      list.appendChild(l.row);
    });
    part.appendChild(list);
    body.appendChild(part);
  }

  /* --- a week as it was played -------------------------------------------

     For an admin (Sam, 2026-10-21): what one week of the sim produced, the
     week just played unless another is picked, out on the site or not.
     The six's lines first, then every game's score and leaders, each
     opening to both teams' numbers, the box score, the scoring plays and
     who got hurt (lib/weeks.js). Weeks played before the box scores were
     kept open to the scoring and injuries only. */

  function drawWeek(body, league) {
    var weeks = sim().weeks;
    var all = weeks.played(league);
    if (!all.length) { return; }
    var part = section('Week stats');
    var wrap = el('div', 'ege-simweek');
    function paint() {
      wrap.innerHTML = '';
      var at = all.filter(function (w) { return w.season + ':' + w.week === state.week; })[0] || all[0];
      var r = row();
      r.appendChild(select('Week', all.map(function (w) {
        return { value: w.season + ':' + w.week,
                 text: w.label + (w.season !== league.season ? ' of ' + w.season : '') + (EGE.isPublished(w.season, w.week) ? '' : ' \u00b7 not out') };
      }), at.season + ':' + at.week, function (value) {
        state.week = value;
        paint();
      }).box);
      wrap.appendChild(r);
      var w = weeks.week(league, at.season, at.week);
      if (w.six.length) { wrap.appendChild(sixWeek(w)); }
      var games = el('div', 'ege-simweek__games');
      w.games.forEach(function (g) { games.appendChild(gameCard(g, weeks)); });
      wrap.appendChild(games);
    }
    paint();
    part.appendChild(wrap);
    body.appendChild(part);
  }

  function sixWeek(w) {
    var list = el('div', 'ege-simweek__six');
    w.six.forEach(function (x) {
      var item = el('div', 'ege-simweek__sixrow');
      var who = el('span', 'ege-simweek__name');
      who.appendChild(teamMark(x.team, x.name));
      item.appendChild(who);
      item.appendChild(el('span', 'ege-simweek__opp', x.result + (x.home || x.neutral ? ' vs. ' : ' at ') + nick(x.opponent)));
      var line = el('span', 'ege-simweek__line', x.out ? 'Out: ' + x.out : x.text || 'No touches');
      if (x.booster) { line.appendChild(el('span', 'ege-simweek__tag', x.booster.toFixed(1) + 'x')); }
      if (x.hurt) { line.appendChild(el('span', 'ege-simweek__tag is-hurt', x.hurt.what + ' \u00b7 ' + x.hurt.games + ' wk')); }
      item.appendChild(line);
      item.appendChild(el('span', 'ege-simweek__fpts', x.points === null ? '' : x.points + ' FPTS'));
      list.appendChild(item);
    });
    return list;
  }

  /* "62 plays · 38 dropbacks · 24 runs · 380 yds · 3rd 5/12 · 31:20" */
  function teamNumbers(t) {
    var top = t.top || 0;
    return [(t.plays || 0) + ' plays', (t.dropbacks || 0) + ' dropbacks', ((t.plays || 0) - (t.dropbacks || 0)) + ' runs',
      (t.yards || 0) + ' yds', '3rd ' + (t.thirdMade || 0) + '/' + (t.third || 0),
      Math.floor(top / 60) + ':' + String(Math.round(top % 60)).padStart(2, '0')].join(' \u00b7 ');
  }

  function gameCard(g, weeks) {
    var card = el('details', 'ege-simweek__game');
    var top = el('summary', 'ege-simweek__head');
    var score = el('div', 'ege-simweek__score');
    [[g.away, g.score[1]], [g.home, g.score[0]]].forEach(function (side, i) {
      var won = side[1] > g.score[i ? 1 : 0];
      var line = el('div', 'ege-simweek__side' + (won ? ' is-won' : ''));
      line.appendChild(teamMark(side[0]));
      var pts = el('span', 'ege-simweek__pts', String(side[1]));
      if (won && g.ot) { pts.insertBefore(el('span', 'ege-simweek__ot', 'OT'), pts.firstChild); }
      line.appendChild(pts);
      score.appendChild(line);
    });
    top.appendChild(score);
    var leaders = el('dl', 'ege-simweek__leaders');
    [['Pass', g.passing], ['Rush', g.rushing], ['Rec', g.receiving]].forEach(function (l) {
      if (!l[1].length) { return; }
      leaders.appendChild(el('dt', null, l[0]));
      leaders.appendChild(el('dd', null, l[1][0]));
    });
    top.appendChild(leaders);
    card.appendChild(top);

    var more = el('div', 'ege-simweek__more');
    if (g.box) {
      [[g.away, 1], [g.home, 0]].forEach(function (side) {
        var box = el('div', 'ege-simweek__team');
        var title = el('h5', 'ege-sim__movetitle');
        title.appendChild(teamMark(side[0]));
        box.appendChild(title);
        if (g.teams && g.teams[side[1]]) { box.appendChild(el('p', 'fb-meta ege-simweek__totals', teamNumbers(g.teams[side[1]]))); }
        var list = el('ul', 'ege-simweek__lines');
        var lines = g.box.filter(function (l) { return l.team === side[0]; });
        lines.filter(function (l) { return l.passAtt || l.rushAtt || l.targets; }).sort(function (a, b) {
          return ((b.passAtt || 0) - (a.passAtt || 0)) || ((b.rushAtt || 0) + (b.targets || 0) - (a.rushAtt || 0) - (a.targets || 0));
        }).forEach(function (l) {
          var li = el('li', l.ege ? 'is-six' : null);
          li.appendChild(el('span', 'ege-simweek__who', l.name + ' ' + l.pos));
          li.appendChild(document.createTextNode(' ' + weeks.lineText(l)));
          list.appendChild(li);
        });
        var defense = lines.filter(function (l) { return l.sacks || l.ints || l.defTd; }).map(function (l) {
          return l.name + (l.sacks ? ' ' + l.sacks + ' sk' : '') + (l.ints ? ' ' + l.ints + ' INT' : '') + (l.defTd ? ' ' + l.defTd + ' TD' : '');
        });
        if (defense.length) {
          var li = el('li');
          li.appendChild(el('span', 'ege-simweek__who', 'Defense'));
          li.appendChild(document.createTextNode(' ' + defense.join(', ')));
          list.appendChild(li);
        }
        box.appendChild(list);
        more.appendChild(box);
      });
    }
    [['Scoring', g.scoring], ['Hurt', g.injuries]].forEach(function (part) {
      if (!part[1].length) { return; }
      more.appendChild(moveList(part[0], part[1]));
    });
    card.appendChild(more);
    return card;
  }

  /* Any of the six not in the league yet, or in an uploaded draft, can be
     put on a team by hand, in a round if wanted; left alone, he goes where
     the site has him or where his grade takes him. */
  function drawDraft(part, r, league) {
    var inLeague = {};
    /* A free agent too: he is in the league, waiting on his offers. */
    league.players.forEach(function (p) { if (p.ege && (p.status === 'active' || p.status === 'fa')) { inLeague[p.ege] = true; } });
    var kept = sim().draftPlan.saved(league);
    (kept ? kept.picks : []).forEach(function (p) { if (p.ege) { inLeague[p.ege] = true; } });
    var waiting = EGE.players.filter(function (player) { return !inLeague[player.slug]; });
    var picks = {};
    if (waiting.length) {
      part.appendChild(el('p', 'fb-meta',
        'Where the six still in college go, if they are in this draft. Left on the sim’s pick, ' +
        'each goes where the site has him or where his grade takes him.'));
      waiting.forEach(function (player) {
        var line = row();
        line.appendChild(el('span', 'ege-sim__who', player.name));
        var team = el('select', 'fb-select');
        team.setAttribute('aria-label', player.name + '’s team');
        var auto = el('option', null, 'The sim’s pick');
        auto.value = '';
        team.appendChild(auto);
        Object.keys(EGE.nfl.teams).sort(function (a, b) { return teamName(a).localeCompare(teamName(b)); }).forEach(function (key) {
          var option = el('option', null, teamName(key));
          option.value = key;
          team.appendChild(option);
        });
        var round = el('select', 'fb-select');
        round.setAttribute('aria-label', player.name + '’s round');
        var any = el('option', null, 'First pick they have');
        any.value = '';
        round.appendChild(any);
        for (var n = 1; n <= 7; n += 1) {
          var option = el('option', null, 'Round ' + n);
          option.value = String(n);
          round.appendChild(option);
        }
        picks[player.slug] = { team: team, round: round };
        line.appendChild(team);
        line.appendChild(round);
        part.appendChild(line);
      });
    }
    var unsigned = sim().run.offers(league).map(function (w) { return w.name; });
    if (unsigned.length) { part.appendChild(el('p', 'fb-meta', 'Sign ' + unsigned.join(' and ') + ' first.')); }
    r.appendChild(button('Run the ' + league.season + ' draft', true, function () {
      var place = {};
      Object.keys(picks).forEach(function (slug) {
        var key = picks[slug].team.value;
        if (key) { place[slug] = key + (picks[slug].round.value ? ':' + picks[slug].round.value : ''); }
      });
      step(function (l) {
        var got = sim().run.draft(l, place);
        var lines = [];
        if (got.expired) { lines.push(got.expired + ' trade proposals expired.'); }
        if (got.written) { lines.push('Picks 1–' + got.written + ' as uploaded.'); }
        got.draft.filter(function (d) { return d.ege && !d.undrafted; }).forEach(function (d) {
          lines.push(d.n + '. ' + teamName(d.team) + ': ' + d.name + ' (' + d.pos + ', ' + d.ovr + ') — one of the six');
        });
        got.draft.filter(function (d) { return d.undrafted; }).forEach(function (d) {
          lines.push(d.name + ' was not drafted' + (d.team !== 'FA' ? ' and signs with the ' + teamName(d.team) + '.' : ' and is a free agent.'));
        });
        lines.push('Rosters are at 53 and the ' + l.season + ' schedule is set.');
        /* Every round, each opening to its picks. */
        var rounds = [];
        for (var n = 1; n <= 7; n += 1) {
          var picks = got.draft.filter(function (d) { return d.round === n && !d.undrafted; });
          if (!picks.length) { continue; }
          rounds.push({
            title: 'Round ' + n + ' · ' + picks.length + ' picks, ' + ((got.kept || {})[n] || 0) + ' on a 53',
            lines: picks.map(function (d) {
              return d.n + '. ' + teamName(d.team) + ': ' + d.name + ' (' + d.pos + ', ' + d.ovr + ')' + (d.ege ? ' — one of the six' : '');
            })
          });
        }
        return { title: 'The ' + got.season + ' draft', lines: lines, rounds: rounds };
      });
    }, unsigned.length > 0));
  }

  /* --- a draft written by hand -------------------------------------------

     The first rounds of a draft (the mock draft's two, say), pasted or from
     a file, checked against the order and the class, then kept: those picks
     go exactly as written and the sim drafts the rest (nfl-sim/lib/draft-plan.js). */

  function pickTable(picks) {
    var wrap = el('div', 'fb-tablewrap ege-sim__picks');
    var table = el('table', 'fb-table');
    var head = el('tr');
    ['No.', 'Team', 'Player', 'Pos', 'School'].forEach(function (h) { head.appendChild(el('th', null, h)); });
    var thead = el('thead');
    thead.appendChild(head);
    table.appendChild(thead);
    var tbody = el('tbody');
    var round = null;
    picks.forEach(function (p) {
      if (p.round && p.round !== round) {
        round = p.round;
        var split = el('tr', 'ege-sim__round');
        var cell = el('th', null, 'Round ' + round);
        cell.colSpan = 5;
        split.appendChild(cell);
        tbody.appendChild(split);
      }
      var tr = el('tr', p.ege ? 'ege-sim__ege' : null);
      tr.appendChild(el('td', 'num', String(p.n)));
      var where = el('td');
      where.appendChild(teamMark(p.team, nick(p.team) + (p.from && p.from !== p.team ? ' (from ' + nick(p.from) + ')' : '')));
      tr.appendChild(where);
      tr.appendChild(el('td', null, p.name));
      tr.appendChild(el('td', null, p.pos || ''));
      tr.appendChild(el('td', null, p.college || ''));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  }

  /* A team's logo and a name for it (its nickname unless `text` says). */
  function teamMark(key, text) {
    var team = el('span', 'ege-sim__team');
    var logo = EGE.logoFor ? EGE.logoFor(teamName(key)) : null;
    if (logo) {
      var img = el('img', 'ege-sim__logo');
      img.src = logo;
      img.alt = '';
      team.appendChild(img);
    }
    team.appendChild(el('span', null, text || nick(key)));
    return team;
  }

  function checkUpload() {
    try {
      state.upload.checked = sim().draftPlan.check(openLeague(), state.upload.text);
    } catch (err) {
      state.upload.checked = { errors: [err.message || String(err)], picks: [] };
    }
    draw();
  }

  function drawUpload(body, league) {
    var plan = sim().draftPlan;
    var year = plan.ready(league);
    if (!year) { return; }
    var part = section('Upload the ' + year + ' draft');
    var kept = plan.saved(league);
    if (kept) {
      var line = row();
      line.appendChild(el('span', 'ege-sim__who', 'Rounds 1–' + kept.rounds + ' uploaded'));
      line.appendChild(button(state.upload.showSaved ? 'Hide' : 'Show', false, function () {
        state.upload.showSaved = !state.upload.showSaved;
        draw();
      }));
      line.appendChild(button('Remove', false, function () {
        step(function (l) {
          plan.remove(l, year);
          return { title: 'Removed the uploaded ' + year + ' draft', lines: [] };
        });
      }));
      part.appendChild(line);
      if (state.upload.showSaved) { part.appendChild(pickTable(kept.picks)); }
    }

    var preview = el('div', 'ege-sim__preview');
    var input = el('textarea', 'fb-input ege-sim__paste');
    input.rows = 6;
    input.spellcheck = false;
    input.placeholder = '### Round One\n1. :NE: Caleb Williams\n2. :CHI: Jayden Daniels';
    input.setAttribute('aria-label', 'The draft, one pick a line');
    input.value = state.upload.text;
    input.addEventListener('input', function () {
      state.upload.text = input.value;
      state.upload.checked = null;
      if (preview.parentNode) { preview.parentNode.removeChild(preview); }
    });
    part.appendChild(input);

    var file = el('input');
    file.type = 'file';
    file.accept = '.txt,.csv,.tsv,.json,.md,text/plain,text/csv,application/json';
    file.hidden = true;
    file.addEventListener('change', function () {
      var chosen = file.files && file.files[0];
      if (!chosen) { return; }
      chosen.text().then(function (text) {
        state.upload.text = text;
        checkUpload();
      });
    });
    var r = row();
    r.appendChild(file);
    r.appendChild(button('Choose a file', false, function () { file.click(); }));
    r.appendChild(button('Check', !state.upload.checked, function () {
      state.upload.text = input.value;
      checkUpload();
    }));
    part.appendChild(r);

    var checked = state.upload.checked;
    if (checked) {
      if (checked.errors.length) {
        var box = el('div', 'ege-note ege-note--error');
        var list = el('ul', 'ege-sim__errors');
        checked.errors.slice(0, 25).forEach(function (e) { list.appendChild(el('li', null, e)); });
        if (checked.errors.length > 25) { list.appendChild(el('li', null, 'And ' + (checked.errors.length - 25) + ' more.')); }
        box.appendChild(list);
        preview.appendChild(box);
      } else {
        preview.appendChild(pickTable(checked.picks));
        var go = row();
        go.appendChild(button('Use this draft', true, function () {
          var text = state.upload.text;
          var made = null;
          step(function (l) {
            var again = plan.check(l, text);
            plan.save(l, again);
            made = { title: 'Uploaded the ' + again.year + ' draft', lines: ['Rounds 1–' + again.rounds + ', ' + again.picks.length + ' picks.'] };
            return made;
          }).then(function () {
            if (state.last !== made) { return; }
            state.upload = { text: '', checked: null, showSaved: false };
            draw();
          });
        }));
        preview.appendChild(go);
      }
      part.appendChild(preview);
    }
    body.appendChild(part);
  }

  /* --- the six in free agency --------------------------------------------

     None of the six signs anywhere on his own (Sam, 2026-10-30): when one's
     deal runs out, every team that wants him makes an offer, his own team
     too, and Sign takes one (nfl-sim/lib/six-offers.js). Each offer with
     where he would stand there, his fit in its scheme, and what kind of
     team it is. The draft waits until all of them have signed. One waived
     in season (The six in the NFL, below) is here the same way, with every
     team but the one that let him go, for as many weeks as he waits. */

  var MODES = { compete: 'Competing', retool: 'Retooling', rebuild: 'Rebuilding' };

  /* 0-5 stars in halves, as the Teams pages draw an admin's fit. */
  function fitStars(stars, title) {
    var box = el('span', 'ege-fitstars');
    box.title = title + ': ' + stars + ' of 5';
    box.setAttribute('aria-label', box.title);
    box.setAttribute('role', 'img');
    box.appendChild(el('span', 'ege-fitstars__empty', '\u2605\u2605\u2605\u2605\u2605'));
    var full = el('span', 'ege-fitstars__full', '\u2605\u2605\u2605\u2605\u2605');
    full.style.width = (stars / 5 * 100) + '%';
    box.appendChild(full);
    return box;
  }

  function money(m) { return '$' + (m >= 100 ? Math.round(m) : m.toFixed(1)) + 'M'; }

  function roleText(role) {
    if (role.starts) { return role.over ? 'Starts over ' + role.over.name + ' (' + role.over.ovr + ')' : 'Starts'; }
    return 'Behind ' + role.behind.name + ' (' + role.behind.ovr + ')';
  }

  function drawFreeAgency(body, league) {
    var free = sim().run.offers(league);
    if (!free.length) { return; }
    var part = section('Free agency');
    free.forEach(function (w) {
      var box = el('div', 'ege-sim__fa');
      var head = el('div', 'ege-sim__fahead');
      head.appendChild(el('span', 'ege-sim__faname', w.name));
      head.appendChild(el('span', 'fb-meta', [w.pos, w.ovr + ' OVR', 'age ' + w.age].concat(w.from ? [nick(w.from)] : []).join(' \u00b7 ')));
      box.appendChild(head);
      var wrap = el('div', 'fb-tablewrap');
      var table = el('table', 'fb-table ege-sim__offers');
      var thead = el('thead');
      var hr = el('tr');
      ['Team', 'Contract', 'Role', 'Fit', 'Status', ''].forEach(function (h) { hr.appendChild(el('th', null, h)); });
      thead.appendChild(hr);
      table.appendChild(thead);
      var tbody = el('tbody');
      w.offers.forEach(function (o) {
        var tr = el('tr');
        var team = el('td');
        team.appendChild(teamMark(o.team));
        if (o.own) { team.appendChild(el('span', 'ege-sim__fatag', 'His team')); }
        tr.appendChild(team);
        var deal = el('td');
        deal.appendChild(el('span', 'ege-sim__fadeal', o.years + (o.years === 1 ? ' yr' : ' yrs') + ', ' + money(o.apy) + ' a year'));
        deal.appendChild(el('span', 'ege-sim__fatotal', money(o.total) + ' through ' + o.through));
        tr.appendChild(deal);
        tr.appendChild(el('td', null, roleText(o.role)));
        var fit = el('td');
        if (o.fit) {
          var scheme = el('span', 'ege-sim__fafit');
          scheme.appendChild(el('span', null, o.fit.scheme));
          scheme.appendChild(fitStars(o.fit.stars, 'Fit in ' + o.fit.scheme));
          fit.appendChild(scheme);
        }
        tr.appendChild(fit);
        tr.appendChild(el('td', null, (MODES[o.mode] || o.mode) + (o.record ? ' \u00b7 ' + o.record : '')));
        var act = el('td', 'ege-sim__faact');
        act.appendChild(button('Sign', false, function () {
          step(function (l) {
            var got = sim().run.acceptOffer(l, w.slug, o.team);
            return { title: got.name + (got.team === got.from ? ' re-signs with the ' : ' signs with the ') + teamName(got.team),
                     lines: [got.summary] };
          });
        }));
        tr.appendChild(act);
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      wrap.appendChild(table);
      box.appendChild(wrap);
      part.appendChild(box);
    });
    body.appendChild(part);
  }

  function drawTrades(body, league) {
    var queue = sim().run.queue(league);
    var part = section('Trades',
      queue.length ? 'Nothing moves until you approve it. Anything not approved expires when the window closes.'
        : 'Nothing is waiting. Trades are proposed at the deadline after Week 9 and before each draft.');
    queue.forEach(function (t) {
      var box = el('div', 'ege-sim__trade');
      box.appendChild(el('p', 'ege-sim__deal', t.summary));
      var why = el('ul', 'ege-sim__why');
      (t.reasons || []).forEach(function (reason) { why.appendChild(el('li', null, reason)); });
      box.appendChild(why);
      var r = row();
      r.appendChild(el('span', 'fb-meta', t.id + (t.kind === 'move' ? ' · free agency' : '') + (t.ege ? ' · moves one of the six' : '') +
        (t.proposedBy === 'Sam' ? ' · yours' : '')));
      r.appendChild(button('Approve', true, function () {
        step(function (l) {
          var notes = sim().run.approve(l, t.id) || [];
          return { title: 'Approved ' + t.id, lines: [t.summary].concat(notes) };
        });
      }));
      r.appendChild(button('Reject', false, function () {
        step(function (l) { sim().run.reject(l, t.id); return { title: 'Rejected ' + t.id, lines: [t.summary] }; });
      }));
      box.appendChild(r);
      part.appendChild(box);
    });

    part.appendChild(dealBuilder(league));
    body.appendChild(part);
  }

  /* --- the trade builder --------------------------------------------------

     Two teams, each on its colour under its mark, and everything either
     can trade (Sam, 2026-11-14): every player with his headshot and what
     he is worth in points -- to the other team, what it would give for
     him, and to his own, what it asks -- and every pick the same, a click
     putting one in the deal or taking it back out. A player the other team
     values well over his price is picked out in green: one it would want.
     Over each list, what the team needs most and its cap now and after the
     deal; under both, what each gets and gives by its own numbers
     (nfl-sim/lib/trade-builder.js). Each player has his age and his
     season in the league in a box, as on the Teams pages, and the list
     sorts by any heading or the Sort menu, his contract too (Sam,
     2026-11-14). Suggest trades offers deals the two teams would make, or
     what evens up the one in the builder (trade-builder.js suggest), each
     a click from the builder. Make the trade puts it through at once;
     Propose queues it above. */

  var POS_GROUPS = [
    { value: '', text: 'All' }, { value: 'QB', text: 'QB' }, { value: 'RB', text: 'RB', pos: ['RB', 'FB'] },
    { value: 'WR', text: 'WR' }, { value: 'TE', text: 'TE' }, { value: 'OL', text: 'OL', pos: ['OT', 'IOL'] },
    { value: 'DL', text: 'DL', pos: ['EDGE', 'DI'] }, { value: 'LB', text: 'LB' }, { value: 'DB', text: 'DB', pos: ['CB', 'S'] },
    { value: 'KP', text: 'K/P', pos: ['K', 'P'] }
  ];

  /* How each side's list is filtered and sorted: 'pos', 'ovr', 'pay',
     'age', 'years', 'worth' (to the other team) or 'ask' (to his own);
     `up` turns it round (a heading clicked again). */
  state.tb = [{ group: '', sort: 'pos', up: false }, { group: '', sort: 'pos', up: false }];
  /* The last suggestions: { teams: 'DET|CHI', kind, adds, close, ideas, error }. */
  state.ideas = null;

  var SORTS = [['pos', 'Position'], ['ovr', 'Overall'], ['pay', 'Contract'], ['age', 'Age'], ['years', 'Experience'],
    ['worth', 'Their value'], ['ask', 'Own value']];

  function playerText(p) { return p.pos + ' · ' + p.name + ' · ' + p.ovr; }

  function teamKeys() {
    return Object.keys(EGE.nfl.teams).sort(function (a, b) { return teamName(a).localeCompare(teamName(b)); });
  }

  function select(label, options, value, onChange) {
    var box = el('label', 'ege-field');
    box.appendChild(el('span', 'fb-eyebrow', label));
    var pick = el('select', 'fb-select');
    options.forEach(function (o) {
      var option = el('option', null, o.text);
      option.value = o.value;
      pick.appendChild(option);
    });
    pick.value = value;
    pick.disabled = state.busy;
    if (onChange) { pick.addEventListener('change', function () { onChange(pick.value); }); }
    box.appendChild(pick);
    return { box: box, select: pick };
  }

  function points(n) { return Math.round(n).toLocaleString('en-US'); }

  /* One the other team would want: worth a tenth more to it than his own
     team asks, and something to it at all. */
  function wanted(x) { return typeof x.worth === 'number' && x.worth >= 20 && x.worth >= x.ask * 1.1; }

  function initials(name) {
    return String(name || '').split(/\s+/).filter(function (w) { return /^[A-Za-z]/.test(w); })
      .slice(0, 2).map(function (w) { return w.charAt(0).toUpperCase(); }).join('');
  }

  /* A player's face: one of the six's own headshot, ESPN's for everybody
     else that has one, his initials otherwise. */
  function face(p, className) {
    var box = el('span', 'ege-tb__face' + (className ? ' ' + className : ''));
    var six = p.ege && EGE.playerBySlug ? EGE.playerBySlug(p.ege) : null;
    var src = six && six.headshot ? six.headshot
      : p.espn && EGE.espnHeadshot ? EGE.espnHeadshot(p.espn, p.collegePhoto, 96, 70) : null;
    if (src) {
      var img = el('img');
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.addEventListener('error', function () {
        box.innerHTML = '';
        box.textContent = initials(p.name);
      });
      img.src = src;
      box.appendChild(img);
    } else {
      box.textContent = initials(p.name);
    }
    return box;
  }

  function logoImg(key, className) {
    var src = EGE.nfl.logo(key);
    if (!src) { return el('span', className); }
    var img = el('img', className);
    img.src = src;
    img.alt = '';
    return img;
  }

  /* A team's mark on its colour, the one a light ground cannot show. */
  function logoChip(key, className) {
    var box = el('span', 'ege-tb__mark' + (className ? ' ' + className : ''));
    box.style.background = EGE.nfl.teams[key] ? EGE.nfl.teams[key].color : 'var(--fb-ink)';
    box.appendChild(logoImg(key));
    return box;
  }

  /* His season in the league in a box, R for a rookie, as the Teams
     pages draw it. */
  function yearsBox(years) {
    if (!years) { return null; }
    var box = el('abbr', 'ege-room__class ege-tb__years', years === 1 ? 'R' : String(years));
    box.title = years === 1 ? 'Rookie' : EGE.ordinal(years).toLowerCase() + ' season in the NFL';
    return box;
  }

  function contractText(c) {
    if (!c || typeof c.apy !== 'number') { return ''; }
    return money(c.apy) + ' ’' + String(c.through).slice(-2);
  }

  /* A ring for a team's cap: payroll it keeps in its colour, the money
     leaving (orange) or arriving (green), and the room left in sand, with
     the room (or how far over) in the middle. */
  function capRing(cap, kept, moving, kind, color, label) {
    var total = Math.max(cap, kept + moving);
    var a = kept / total * 100;
    var b = (kept + moving) / total * 100;
    var ring = el('div', 'ege-tb__ring');
    var tone = kind === 'in' ? 'var(--ege-tb-in)' : 'var(--fb-accent)';
    ring.style.background = 'conic-gradient(' + color + ' 0 ' + a + '%, ' + tone + ' ' + a + '% ' + b + '%, var(--fb-sand) ' + b + '% 100%)';
    var room = cap - kept - moving;
    var hole = el('div', 'ege-tb__hole' + (room < 0 ? ' is-over' : ''));
    hole.appendChild(el('span', 'ege-tb__holeval', money(Math.abs(room))));
    hole.appendChild(el('span', 'ege-tb__holelabel', room < 0 ? 'Over' : 'Room'));
    ring.appendChild(hole);
    var box = el('figure', 'ege-tb__capfig');
    box.appendChild(ring);
    box.appendChild(el('figcaption', 'ege-tb__caplabel', label));
    box.setAttribute('aria-label', label + ': payroll ' + money(kept + moving) + ' of ' + money(cap) + ', ' +
      (room < 0 ? money(-room) + ' over' : money(room) + ' room'));
    return box;
  }

  function capPanel(s) {
    var c = s.cap;
    var color = EGE.nfl.teams[s.key] ? EGE.nfl.teams[s.key].color : 'var(--fb-ink)';
    var box = el('div', 'ege-tb__cap');
    var rings = el('div', 'ege-tb__rings');
    rings.appendChild(capRing(c.cap, c.payroll - c.out, c.out, 'out', color, 'Now'));
    rings.appendChild(el('span', 'ege-tb__arrow', '→'));
    rings.appendChild(capRing(c.cap, c.payroll - c.out, c.in, 'in', color, 'After'));
    box.appendChild(rings);
    var facts = el('dl', 'ege-tb__capfacts');
    [['Payroll', money(c.payroll) + (c.out || c.in ? ' → ' + money(c.after) : ''), ''],
      ['Cap', money(c.cap), ''],
      ['Out', c.out ? '−' + money(c.out) : '–', 'is-out'],
      ['In', c.in ? '+' + money(c.in) : '–', 'is-in']].forEach(function (f) {
      var cell = el('div', 'ege-tb__capfact ' + f[2]);
      cell.appendChild(el('dt', null, f[0]));
      cell.appendChild(el('dd', null, f[1]));
      facts.appendChild(cell);
    });
    box.appendChild(facts);
    return box;
  }

  /* What the team is short of most: a bar a position, a hole the full
     width. */
  function needsPanel(s) {
    var box = el('div', 'ege-tb__needs');
    box.appendChild(el('span', 'fb-eyebrow', 'Needs'));
    var list = el('ul', 'ege-tb__needlist');
    s.needs.slice(0, 5).forEach(function (n) {
      var li = el('li', 'ege-tb__need' + (n.need >= 0.66 ? ' is-hole' : n.need >= 0.33 ? ' is-want' : ''));
      li.title = n.pos + ': ' + Math.round(n.need * 100) + '%';
      li.appendChild(el('span', 'ege-tb__needpos', n.pos));
      var bar = el('span', 'ege-tb__needbar');
      var fill = el('span', 'ege-tb__needfill');
      fill.style.width = Math.max(3, n.need * 100) + '%';
      bar.appendChild(fill);
      li.appendChild(bar);
      list.appendChild(li);
    });
    box.appendChild(list);
    return box;
  }

  function directionText(s) {
    var record = s.record || (s.lastRecord ? s.lastRecord + ' last year' : '');
    return (MODES[s.mode] || s.mode) + (record ? ' · ' + record : '');
  }

  /* Biggest first (position in the usual order), or the other way round. */
  function sortPlayers(list, sort, up) {
    var pos = sim().tradeBuilder.POS_ORDER;
    var byPos = function (a, b) { return pos.indexOf(a.pos) - pos.indexOf(b.pos) || b.ovr - a.ovr || a.name.localeCompare(b.name); };
    var num = function (p) { return sort === 'pay' ? (p.contract ? p.contract.apy : 0) : p[sort] || 0; };
    var turn = up ? -1 : 1;
    if (sort === 'pos') { return list.slice().sort(function (a, b) { return turn * byPos(a, b); }); }
    return list.slice().sort(function (a, b) { return turn * (num(b) - num(a)) || byPos(a, b); });
  }

  function sameDeal(a, b) {
    var ids = function (side) { return side.key + ':' + side.players.slice().sort().join(',') + ':' + side.picks.slice().sort().join(','); };
    return a.length === b.length && a.every(function (side, i) { return ids(side) === ids(b[i]); });
  }

  function dealBuilder(league) {
    var wrap = el('div', 'ege-tb');
    var scroll = [0, 0];
    function paint() {
      wrap.querySelectorAll('.ege-tb__list').forEach(function (list) { scroll[Number(list.dataset.side)] = list.scrollTop; });
      wrap.innerHTML = '';
      var view;
      try {
        view = sim().tradeBuilder.view(league, state.deal);
      } catch (err) {
        wrap.appendChild(el('p', 'ege-note ege-note--error', err.message || String(err)));
        return;
      }
      var all = view.sides.filter(Boolean);
      var top = Math.max.apply(null, [1].concat(all.map(function (s) {
        return Math.max.apply(null, [0].concat(s.players.map(function (p) { return p.worth || p.ask; })));
      })));
      var grid = el('div', 'ege-tb__sides');
      state.deal.forEach(function (side, i) {
        grid.appendChild(drawSide(side, i, view.sides[i], view.sides[1 - i], top));
      });
      wrap.appendChild(grid);
      var both = view.sides[0] && view.sides[1] && view.sides[0].key !== view.sides[1].key;
      if (both && view.sides.some(function (s) { return s.sends.length; })) { wrap.appendChild(balance(view.sides)); }
      if (both && state.ideas && state.ideas.teams === state.deal[0].key + '|' + state.deal[1].key) { wrap.appendChild(ideasBox(view)); }
      var go = row();
      go.classList.add('ege-tb__go');
      go.appendChild(button('Make the trade', true, function () {
        var sides = state.deal;
        step(function (l) {
          var t = sim().run.proposeOwn(l, sides);
          var notes = sim().run.approve(l, t.id) || [];
          state.deal = emptyDeal();
          return { title: 'Traded', lines: [t.summary].concat(notes) };
        });
      }, !view.ready));
      go.appendChild(button('Propose', false, function () {
        var sides = state.deal;
        step(function (l) {
          var t = sim().run.proposeOwn(l, sides);
          state.deal = emptyDeal();
          return { title: 'Proposed ' + t.id, lines: [t.summary].concat(t.reasons || []) };
        });
      }, !view.ready));
      go.appendChild(button('Suggest trades', false, function () {
        var teams = state.deal[0].key + '|' + state.deal[1].key;
        try {
          state.ideas = Object.assign({ teams: teams }, sim().tradeBuilder.suggest(league, state.deal));
        } catch (err) {
          state.ideas = { teams: teams, ideas: [], error: err.message || String(err) };
        }
        paint();
        var box = wrap.querySelector('.ege-tb__ideas');
        if (box && box.scrollIntoView) { box.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
      }, !both));
      if (state.deal.some(function (side) { return side.players.length || side.picks.length; })) {
        go.appendChild(button('Clear', false, function () {
          state.deal.forEach(function (side) { side.players = []; side.picks = []; });
          paint();
        }));
      }
      wrap.appendChild(go);
      wrap.querySelectorAll('.ege-tb__list').forEach(function (list) { list.scrollTop = scroll[Number(list.dataset.side)] || 0; });
    }

    function toggle(list, id) {
      var at = list.indexOf(id);
      if (at === -1) { list.push(id); } else { list.splice(at, 1); }
      paint();
    }

    function drawSide(side, i, s, other, top) {
      var col = el('section', 'ege-tb__side');
      var color = side.key && EGE.nfl.teams[side.key] ? EGE.nfl.teams[side.key].color : null;
      if (color) { col.style.setProperty('--team', color); }

      /* The band: the team's mark on its colour, and the team picked there. */
      var band = el('div', 'ege-tb__band' + (side.key ? '' : ' is-empty'));
      if (side.key) {
        var mark = el('span', 'ege-tb__bandmark');
        mark.appendChild(logoImg(side.key));
        band.appendChild(mark);
      }
      var words = el('div', 'ege-tb__bandwords');
      var pick = el('select', 'ege-tb__teampick');
      pick.setAttribute('aria-label', i ? 'Second team' : 'First team');
      [{ value: '', text: 'Pick a team' }].concat(teamKeys().map(function (k) { return { value: k, text: teamName(k) }; }))
        .forEach(function (o) {
          var option = el('option', null, o.text);
          option.value = o.value;
          pick.appendChild(option);
        });
      pick.value = side.key;
      pick.disabled = state.busy;
      pick.addEventListener('change', function () {
        state.deal[i] = { key: pick.value, players: [], picks: [] };
        state.ideas = null;
        paint();
      });
      words.appendChild(pick);
      if (s) {
        var meta = el('span', 'ege-tb__bandmeta' + (s.modeSet ? ' is-set' : ''), directionText(s));
        if (s.modeSet) { meta.title = 'Direction set by you'; }
        words.appendChild(meta);
      }
      band.appendChild(words);
      col.appendChild(band);
      if (!s) { return col; }

      var info = el('div', 'ege-tb__info');
      info.appendChild(capPanel(s));
      info.appendChild(needsPanel(s));
      col.appendChild(info);

      /* What it sends: a card a player, a chip a pick. */
      if (s.sends.length) {
        var sends = el('div', 'ege-tb__sends');
        sends.appendChild(el('span', 'fb-eyebrow', 'Sends'));
        var cards = el('div', 'ege-tb__cards');
        s.sends.forEach(function (x) {
          var card = el('button', 'ege-tb__card' + (x.ege ? ' is-six' : ''));
          card.type = 'button';
          card.disabled = state.busy;
          card.setAttribute('aria-label', 'Take ' + (x.name || x.label) + ' out');
          if (x.round) {
            card.classList.add('is-pick');
            card.appendChild(logoChip(x.from, 'ege-tb__cardmark'));
            var pt = el('span', 'ege-tb__cardtext');
            pt.appendChild(el('span', 'ege-tb__cardname', x.year + ' Round ' + x.round));
            pt.appendChild(el('span', 'ege-tb__cardmeta', x.from === s.key ? 'Own' : nick(x.from) + '’'));
            card.appendChild(pt);
          } else {
            card.appendChild(face(x, 'ege-tb__cardface'));
            var tx = el('span', 'ege-tb__cardtext');
            tx.appendChild(el('span', 'ege-tb__cardname', x.name));
            var cm = el('span', 'ege-tb__cardmeta');
            cm.appendChild(el('span', null, [x.pos, x.ovr + ' OVR', x.age ? 'Age ' + x.age : ''].filter(Boolean).join(' · ')));
            var yb = yearsBox(x.years);
            if (yb) { cm.appendChild(yb); }
            if (x.contract) { cm.appendChild(el('span', null, contractText(x.contract))); }
            tx.appendChild(cm);
            card.appendChild(tx);
          }
          if (other) { card.appendChild(el('span', 'ege-tb__cardval', points(x.worth))); }
          card.appendChild(el('span', 'ege-tb__x', '×'));
          card.addEventListener('click', function () { toggle(x.round ? side.picks : side.players, x.id); });
          cards.appendChild(card);
        });
        sends.appendChild(cards);
        col.appendChild(sends);
      }

      /* Every player: a position filter, headings that sort, a row each. */
      var tb = state.tb[i];
      var filters = el('div', 'ege-tb__filters');
      POS_GROUPS.forEach(function (g) {
        var b = el('button', 'ege-tb__filter' + (tb.group === g.value ? ' is-on' : ''), g.text);
        b.type = 'button';
        b.setAttribute('aria-pressed', tb.group === g.value ? 'true' : 'false');
        b.addEventListener('click', function () { tb.group = g.value; paint(); });
        filters.appendChild(b);
      });
      var sortBox = el('label', 'ege-tb__sortpick');
      sortBox.appendChild(el('span', null, 'Sort'));
      var sortSel = el('select', 'fb-select');
      SORTS.filter(function (o) { return other || o[0] !== 'worth'; }).forEach(function (o) {
        var option = el('option', null, o[0] === 'worth' && other ? nick(other.key) + ' value' : o[0] === 'ask' ? nick(s.key) + ' value' : o[1]);
        option.value = o[0];
        sortSel.appendChild(option);
      });
      sortSel.addEventListener('change', function () { tb.sort = sortSel.value; tb.up = false; paint(); });
      sortBox.appendChild(sortSel);
      filters.appendChild(sortBox);
      col.appendChild(filters);

      var group = POS_GROUPS.filter(function (g) { return g.value === tb.group; })[0] || POS_GROUPS[0];
      var players = s.players.filter(function (p) {
        return !group.value || (group.pos || [group.value]).indexOf(p.pos) !== -1;
      });
      if (!other && tb.sort === 'worth') { tb.sort = 'pos'; }
      sortSel.value = tb.sort;
      players = sortPlayers(players, tb.sort, tb.up);

      var table = el('div', 'ege-tb__table' + (other ? '' : ' is-alone'));
      var head = el('div', 'ege-tb__head');
      function heading(content, sort, title, className) {
        var on = tb.sort === sort;
        var h = el('button', 'ege-tb__sort' + (className ? ' ' + className : '') + (on ? ' is-on' + (tb.up ? ' is-up' : '') : ''));
        h.type = 'button';
        h.title = title;
        h.setAttribute('aria-label', title);
        if (typeof content === 'string') { h.textContent = content; } else { h.appendChild(content); }
        h.addEventListener('click', function () {
          if (tb.sort === sort) { tb.up = !tb.up; } else { tb.sort = sort; tb.up = false; }
          paint();
        });
        return h;
      }
      head.appendChild(heading('Player', 'pos', 'Sort by position', 'ege-tb__sort--player'));
      head.appendChild(heading('OVR', 'ovr', 'Sort by overall', 'ege-tb__sort--num'));
      head.appendChild(heading('Pay', 'pay', 'Sort by contract', 'ege-tb__sort--num ege-tb__sort--pay'));
      if (other) {
        head.appendChild(heading(logoChip(other.key, 'ege-tb__headmark'), 'worth', 'What the ' + nick(other.key) + ' would give', 'ege-tb__sort--num'));
      }
      head.appendChild(heading(logoChip(s.key, 'ege-tb__headmark'), 'ask', 'What the ' + nick(s.key) + ' ask', 'ege-tb__sort--num'));
      table.appendChild(head);

      var list = el('div', 'ege-tb__list');
      list.dataset.side = String(i);
      players.forEach(function (p) {
        var want = other && wanted(p);
        var r = el('button', 'ege-tb__row' + (p.inDeal ? ' is-in' : '') + (want ? ' is-want' : '') + (p.ege ? ' is-six' : ''));
        r.type = 'button';
        r.disabled = state.busy;
        r.setAttribute('aria-pressed', p.inDeal ? 'true' : 'false');
        r.appendChild(face(p));
        var text = el('span', 'ege-tb__text');
        text.appendChild(el('span', 'ege-tb__name', p.name));
        var meta = el('span', 'ege-tb__meta');
        meta.appendChild(el('span', 'ege-tb__pos', p.pos));
        if (p.age) {
          var age = el('span', 'ege-tb__age');
          age.appendChild(el('span', 'ege-tb__agelabel', 'Age '));
          age.appendChild(document.createTextNode(String(p.age)));
          meta.appendChild(age);
        }
        var box = yearsBox(p.years);
        if (box) { meta.appendChild(box); }
        if (p.contract) { meta.appendChild(el('span', 'ege-tb__metapay', contractText(p.contract))); }
        if (p.out) { meta.appendChild(el('span', 'ege-tb__out', 'OUT ' + p.out)); }
        text.appendChild(meta);
        r.appendChild(text);
        r.appendChild(el('span', 'ege-tb__ovr', String(p.ovr)));
        var pay = el('span', 'ege-tb__pay');
        if (p.contract && typeof p.contract.apy === 'number') {
          pay.appendChild(el('span', 'ege-tb__payval', money(p.contract.apy)));
          pay.appendChild(el('span', 'ege-tb__paythru', '\u2019' + String(p.contract.through).slice(-2)));
        }
        r.appendChild(pay);
        if (other) {
          var worth = el('span', 'ege-tb__worth');
          worth.appendChild(el('span', 'ege-tb__worthval', points(p.worth)));
          var bar = el('span', 'ege-tb__worthbar');
          var fill = el('span', 'ege-tb__worthfill');
          /* On a square-root scale, so a backup's bar still shows beside a star's. */
          fill.style.width = Math.max(2, Math.min(100, Math.sqrt(p.worth / top) * 100)) + '%';
          bar.appendChild(fill);
          worth.appendChild(bar);
          r.appendChild(worth);
        }
        r.appendChild(el('span', 'ege-tb__ask', points(p.ask)));
        r.addEventListener('click', function () { toggle(side.players, p.id); });
        list.appendChild(r);
      });
      table.appendChild(list);
      col.appendChild(table);

      /* Picks, a row a draft: the next three, then the rest folded. */
      var years = [];
      s.picks.forEach(function (p) { if (years.indexOf(p.year) === -1) { years.push(p.year); } });
      var picksBox = el('div', 'ege-tb__picks');
      picksBox.appendChild(el('span', 'fb-eyebrow', 'Picks'));
      var later = null;
      years.forEach(function (year, n) {
        var line = el('div', 'ege-tb__pickyear');
        line.appendChild(el('span', 'ege-tb__year', String(year)));
        var chips = el('div', 'ege-tb__pickchips');
        s.picks.filter(function (p) { return p.year === year; }).forEach(function (p) {
          var c = el('button', 'ege-tb__pick' + (p.inDeal ? ' is-in' : '') + (other && wanted(p) ? ' is-want' : ''));
          c.type = 'button';
          c.disabled = state.busy;
          c.setAttribute('aria-pressed', p.inDeal ? 'true' : 'false');
          c.title = p.label + ': ' + (other ? points(p.worth) + ' to the ' + nick(other.key) + ', ' : '') + points(p.ask) + ' to the ' + nick(s.key);
          if (p.from !== s.key) { c.appendChild(logoChip(p.from, 'ege-tb__pickmark')); }
          c.appendChild(el('span', 'ege-tb__pickround', 'R' + p.round));
          c.appendChild(el('span', 'ege-tb__pickval', points(other ? p.worth : p.ask)));
          c.addEventListener('click', function () { toggle(side.picks, p.id); });
          chips.appendChild(c);
        });
        line.appendChild(chips);
        if (n < 3) {
          picksBox.appendChild(line);
        } else {
          if (!later) {
            later = el('details', 'ege-tb__later');
            later.appendChild(el('summary', null, 'Later'));
            if (s.picks.some(function (p) { return p.inDeal && p.year >= year; })) { later.open = true; }
            picksBox.appendChild(later);
          }
          later.appendChild(line);
        }
      });
      col.appendChild(picksBox);
      return col;
    }

    /* The suggestions: a card each, what each team gets (with how far
       ahead or short it comes out by its own numbers), and Use, which puts
       it in the builder. The one in the builder now is picked out. */
    function ideasBox(view) {
      var got = state.ideas;
      var box = el('div', 'ege-tb__ideas');
      box.appendChild(el('span', 'fb-eyebrow', got.kind === 'topUp' ? (got.close ? 'Closest' : nick(got.adds) + ' add') : 'Suggested'));
      if (got.error) {
        box.appendChild(el('p', 'ege-note ege-note--error', got.error));
        return box;
      }
      if (!got.ideas.length) {
        box.appendChild(el('p', 'fb-meta', got.kind === 'even' ? 'Both take it already.' : 'Nothing works between these two.'));
        return box;
      }
      var lookup = {};
      view.sides.forEach(function (s) {
        s.players.forEach(function (p) { lookup[p.id] = p; });
        s.picks.forEach(function (p) { lookup[p.id] = p; });
      });
      var cards = el('div', 'ege-tb__ideacards');
      got.ideas.forEach(function (idea) {
        var on = sameDeal(idea.sides, state.deal);
        var card = el('div', 'ege-tb__idea' + (on ? ' is-on' : ''));
        idea.sides.forEach(function (side, i) {
          var from = idea.sides[1 - i];
          var v = idea.values[i];
          var part = el('div', 'ege-tb__ideaside');
          var head = el('div', 'ege-tb__ideahead');
          head.appendChild(logoChip(side.key, 'ege-tb__ideamark'));
          head.appendChild(el('span', 'ege-tb__ideagets', nick(side.key) + ' get'));
          var net = v.gets - v.gives;
          var tag = el('span', 'ege-tb__ideanet' + (net >= 0 ? ' is-up' : ' is-down'), (net >= 0 ? '+' : '\u2212') + points(Math.abs(net)));
          tag.title = 'By their own numbers: get ' + points(v.gets) + ', give ' + points(v.gives);
          head.appendChild(tag);
          part.appendChild(head);
          var list = el('ul', 'ege-tb__idealist');
          from.players.concat(from.picks).forEach(function (id) {
            var x = lookup[id];
            if (!x) { return; }
            var li = el('li', 'ege-tb__ideaitem');
            if (x.round) {
              li.appendChild(logoChip(x.from, 'ege-tb__ideaface'));
              li.appendChild(el('span', 'ege-tb__ideaname', x.year + ' Round ' + x.round));
            } else {
              li.appendChild(face(x, 'ege-tb__ideaface'));
              li.appendChild(el('span', 'ege-tb__ideaname', x.name));
              li.appendChild(el('span', 'ege-tb__ideameta', x.pos + ' ' + x.ovr));
            }
            list.appendChild(li);
          });
          part.appendChild(list);
          card.appendChild(part);
        });
        var use = button(on ? 'In the builder' : 'Use', false, function () {
          state.deal = idea.sides.map(function (side) { return { key: side.key, players: side.players.slice(), picks: side.picks.slice() }; });
          paint();
        }, on);
        use.classList.add('ege-tb__ideause');
        card.appendChild(use);
        cards.appendChild(card);
      });
      box.appendChild(cards);
      return box;
    }

    /* For each team: what it gets and what it gives, by its own numbers,
       on one scale, and whether that is a deal it takes. */
    function balance(sides) {
      var box = el('div', 'ege-tb__balance');
      var most = Math.max(1, sides[0].gets, sides[0].gives, sides[1].gets, sides[1].gives);
      sides.forEach(function (s) {
        var line = el('div', 'ege-tb__bal' + (s.takes ? ' is-yes' : ' is-no'));
        line.appendChild(logoChip(s.key, 'ege-tb__balmark'));
        var bars = el('div', 'ege-tb__balbars');
        [['Gets', s.gets, 'is-gets'], ['Gives', s.gives, 'is-gives']].forEach(function (b) {
          var one = el('div', 'ege-tb__balrow ' + b[2]);
          one.appendChild(el('span', 'ege-tb__ballabel', b[0]));
          var track = el('span', 'ege-tb__baltrack');
          var fill = el('span', 'ege-tb__balfill');
          fill.style.width = (b[1] / most * 100) + '%';
          track.appendChild(fill);
          one.appendChild(track);
          one.appendChild(el('span', 'ege-tb__balval', points(b[1])));
          bars.appendChild(one);
        });
        line.appendChild(bars);
        var gap = s.gives - s.gets;
        line.appendChild(el('span', 'ege-tb__verdict', s.takes ? 'Takes it' : 'Wants ' + points(gap) + ' more'));
        box.appendChild(line);
      });
      return box;
    }

    paint();
    return wrap;
  }

  /* --- team directions -----------------------------------------------------

     Every team competing, retooling or rebuilding, by division in the
     order they stand, each with its record and the age of its twelve best
     players, and the direction as a dropdown (Sam, 2026-11-14): an old
     team off to a bad start set to rebuild trades, signs and cuts as one
     from now on, and keeps it every offseason until set back to Auto, the
     sim's own pick (lib/edits.js setMode). A direction set by hand is
     orange. */

  function modePick(d, onPick) {
    var pick = el('select', 'fb-select ege-sim__mode' + (d.modeSet ? ' is-set' : ''));
    var options = [['compete', 'Competing'], ['retool', 'Retooling'], ['rebuild', 'Rebuilding']];
    if (d.modeSet) { options.push(['auto', 'Auto (' + MODES[d.auto] + ')']); }
    options.forEach(function (o) {
      var option = el('option', null, o[1]);
      option.value = o[0];
      pick.appendChild(option);
    });
    pick.value = d.mode;
    pick.disabled = state.busy;
    pick.addEventListener('change', function () { onPick(pick.value); });
    return pick;
  }

  function drawDirections(body, league) {
    var part = section('Team directions');
    var all = sim().edits.teamDirections(league);
    var byKey = {};
    all.forEach(function (d) { byKey[d.key] = d; });
    var played = league.schedule && league.schedule.some(function (g) { return g.score; });
    var divisions = {};
    if (played) {
      var table = sim().standings.standings(league.schedule, league.season);
      Object.keys(table.divisions).forEach(function (division) {
        divisions[division] = table.divisions[division].map(function (r) { return r.key; });
      });
    } else {
      Object.keys(EGE.nfl.teams).forEach(function (key) {
        var t = EGE.nfl.teams[key];
        (divisions[t.conf + ' ' + t.div] = divisions[t.conf + ' ' + t.div] || []).push(key);
      });
    }
    var grid = el('div', 'ege-sim__dirs');
    Object.keys(divisions).forEach(function (division) {
      var box = el('div', 'ege-sim__dirbox');
      box.appendChild(el('h4', 'ege-nflstand__title', division));
      var list = el('ul', 'ege-sim__dirlist');
      divisions[division].forEach(function (key) {
        var d = byKey[key];
        if (!d) { return; }
        var li = el('li', 'ege-sim__dir');
        li.appendChild(logoChip(key, 'ege-sim__dirmark'));
        li.appendChild(el('span', 'ege-sim__dirname', nick(key)));
        var rec = el('span', 'ege-sim__dirrec' + (d.record ? '' : ' is-last'), d.record || d.lastRecord || '–');
        if (!d.record && d.lastRecord) { rec.title = d.lastSeason + ' record'; }
        li.appendChild(rec);
        var age = el('span', 'ege-sim__dirage', d.age.toFixed(1));
        age.title = 'Average age of the twelve best players';
        li.appendChild(age);
        li.appendChild(modePick(d, function (want) {
          step(function (l) {
            var got = sim().edits.setMode(l, key, want);
            return { title: teamName(key) + ': ' + MODES[got.after] + (got.auto ? ' (auto)' : ''), lines: [] };
          });
        }));
        list.appendChild(li);
      });
      box.appendChild(list);
      grid.appendChild(box);
    });
    part.appendChild(grid);
    body.appendChild(part);
  }

  /* --- rosters by season --------------------------------------------------

     Every team's roster as each season ended (and this one as it stands),
     with who came and who went since the season before (lib/history.js). */

  function drawRosters(body, league) {
    var part = section('Rosters by season');
    var wrap = el('div');
    var history = sim().history;
    var years = history.seasons(league);
    function paint() {
      wrap.innerHTML = '';
      var st = state.rosters;
      if (!st.team) { st.team = teamKeys()[0]; }
      if (years.indexOf(st.season) === -1) { st.season = years[0]; }
      var r = row();
      r.appendChild(select('Team', teamKeys().map(function (k) { return { value: k, text: teamName(k) }; }), st.team, function (key) {
        st.team = key;
        paint();
      }).box);
      r.appendChild(select('Season', years.map(function (y) { return { value: String(y), text: String(y) }; }), String(st.season), function (y) {
        st.season = Number(y);
        paint();
      }).box);
      wrap.appendChild(r);
      var shot = history.rostersIn(league, st.season);
      var team = shot && shot.teams[st.team];
      if (!team) { return; }
      wrap.appendChild(el('p', 'fb-meta', team.players.length + ' players' + (team.record ? ' · ' + team.record : '')));
      var moves = history.changes(league, st.team, st.season);
      if (moves) {
        var lists = el('div', 'ege-sim__moves');
        lists.appendChild(moveList('Arrived', moves.arrived.map(function (a) {
          return playerText(a.player) + (a.from ? ' · from ' + nick(a.from) : a.how === 'draft' ? ' · drafted' : ' · signed');
        })));
        lists.appendChild(moveList('Left', moves.left.map(function (m) {
          return playerText(m.player) + (m.to ? ' · to ' + nick(m.to) : ' · ' + m.how);
        })));
        wrap.appendChild(lists);
      }
      var tableWrap = el('div', 'fb-tablewrap ege-sim__roster');
      var table = el('table', 'fb-table');
      var head = el('tr');
      ['Pos', 'Player', 'Age', 'OVR'].forEach(function (h) { head.appendChild(el('th', null, h)); });
      var thead = el('thead');
      thead.appendChild(head);
      table.appendChild(thead);
      var tbody = el('tbody');
      team.players.forEach(function (p) {
        var tr = el('tr', p.ege ? 'ege-sim__ege' : null);
        tr.appendChild(el('td', null, p.pos));
        tr.appendChild(el('td', null, p.name));
        tr.appendChild(el('td', 'num', p.age ? String(p.age) : ''));
        tr.appendChild(el('td', 'num', String(p.ovr)));
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      tableWrap.appendChild(table);
      wrap.appendChild(tableWrap);
    }
    paint();
    part.appendChild(wrap);
    body.appendChild(part);
  }

  function moveList(title, lines) {
    var box = el('div');
    box.appendChild(el('h5', 'ege-sim__movetitle', title + ' (' + lines.length + ')'));
    var list = el('ul', 'ege-sim__lines');
    lines.forEach(function (line) { list.appendChild(el('li', null, line)); });
    if (!lines.length) { list.appendChild(el('li', null, 'Nobody')); }
    box.appendChild(list);
    return box;
  }

  /* Waive, then Waive {name}? to be sure (Sam, 2026-11-12): off his team
     from the week the league plays next, with offers from every other team
     that wants him in Free agency above, and nothing on his schedule until
     one is signed (nfl-sim/lib/six-offers.js waive). */
  function waiveButton(s) {
    var armed = false;
    var b = button('Waive', false, function () {
      if (!armed) {
        armed = true;
        b.textContent = 'Waive ' + s.name + '?';
        b.classList.add('is-armed');
        return;
      }
      step(function (l) {
        return { title: sim().run.waive(l, s.slug).summary, lines: [] };
      });
    });
    return b;
  }

  function drawSix(body, league) {
    var part = section('The six in the NFL');
    var wrap = el('div', 'fb-tablewrap');
    var table = el('table', 'fb-table ege-sim__six');
    var head = el('tr');
    /* Only in the regular season: between seasons a cut is free agency's. */
    var waiving = league.phase === 'regular' || league.phase === 'deadline';
    ['Player', 'Team', 'OVR', 'In the sim\u2019s games'].concat(waiving ? [''] : []).forEach(function (h) {
      head.appendChild(el('th', null, h));
    });
    var thead = el('thead');
    thead.appendChild(head);
    table.appendChild(thead);
    var tbody = el('tbody');
    var six = sim().run.sixNow(league);
    six.forEach(function (s) {
      var tr = el('tr');
      tr.appendChild(el('td', null, s.name + (s.out ? ' (out: ' + s.out.what + ')' : '')));
      tr.appendChild(el('td', null, s.teamName));
      tr.appendChild(el('td', 'num', String(s.ovr)));
      tr.appendChild(el('td', null, sim().run.sixLine(s) || '–'));
      if (waiving) {
        var act = el('td', 'ege-sim__faact');
        if (s.team !== 'FA') { act.appendChild(waiveButton(s)); }
        tr.appendChild(act);
      }
      tbody.appendChild(tr);
    });
    if (!six.length) {
      var none = el('tr');
      var cell = el('td', null, 'None of the six are in the league yet.');
      cell.colSpan = waiving ? 5 : 4;
      none.appendChild(cell);
      tbody.appendChild(none);
    }
    table.appendChild(tbody);
    wrap.appendChild(table);
    part.appendChild(wrap);
    body.appendChild(part);
  }

  /* The six's archetypes: a name only, since their skills are the
     website's, and kept for the ones still in college until their draft
     (lib/edits.js setSixArchetype). Their pop-ups on the Teams pages set
     the same thing. */
  function drawArchetypes(body, league) {
    var part = section('The six’s archetypes');
    sim().edits.sixArchetypes(league).forEach(function (s) {
      var line = row();
      line.appendChild(el('span', 'ege-sim__who', s.name));
      var pick = el('select', 'fb-select');
      pick.setAttribute('aria-label', s.name + '’s archetype');
      s.archetypes.forEach(function (name) {
        var option = el('option', null, name);
        option.value = name;
        pick.appendChild(option);
      });
      pick.value = s.archetype || '';
      pick.disabled = state.busy;
      pick.addEventListener('change', function () {
        var want = pick.value;
        step(function (l) {
          var got = sim().edits.setSixArchetype(l, s.slug, want);
          return { title: got.name, lines: ['Archetype ' + (got.before || 'none') + ' to ' + got.after + '.'] };
        });
      });
      line.appendChild(pick);
      part.appendChild(line);
    });
    body.appendChild(part);
  }

  /* The seasons the sim has played games of: the ones there is something
     to write to the site for. */
  function playedSeasons() {
    return Object.keys(state.files || {}).map(function (name) {
      var m = /^games-(\d{4})\.json$/.exec(name);
      return m ? Number(m[1]) : null;
    }).filter(Boolean).filter(function (year) {
      return JSON.parse(state.files['games-' + year + '.json']).some(function (g) { return !g.imported && !g.playoff; });
    }).sort();
  }

  /* Whether a season's file has any of the six's games in it. */
  function hasSix(year) {
    var games = (EGE.stats[year] || {}).games || {};
    return Object.keys(games).some(function (slug) { return games[slug].length; });
  }

  /* The season the sim has moved on to, with each of the six's whole
     regular season from the sim's schedule wherever his file has none
     (lib/six-trades.js seasonGames), so the next season's file comes out
     of the download ready to go in stats/ (Sam, 2026-10-30). A season the
     page has no file for gets an empty one first, for the trades to land
     in. */
  function fillSeason(league) {
    var year = league.season;
    var games = EGE.stats[year].games;
    var made = sim().sixTrades.seasonGames(league, year);
    Object.keys(made).forEach(function (slug) {
      if (!(games[slug] || []).length) { games[slug] = made[slug]; }
    });
  }

  /* The season files with the stored weeks written in: what the site
     shows, the way it shows it. A sticker on a week that is out goes into
     the file with it, which is where a published week's sticker lives. */
  function seasonFiles(year) {
    var league = openLeague();
    var current = league.season === year;
    if (current && !EGE.stats[year]) {
      EGE.stats[year] = { season: year, level: 'NFL', games: {} };
      EGE.fillLadder();
    }
    var first = current ? syncSite(league) : Promise.resolve();
    return first.then(function () {
      if (current) { fillSeason(league); }
      return EGE.wallet.loadGameBoosters(year);
    }).then(function () {
      var edits = { season: year, weeks: {} };
      EGE.weeksIn(year).forEach(function (week) {
        if (!EGE.isPublished(year, week)) { return; }
        EGE.gamesInWeek(week, year).forEach(function (entry) {
          var g = entry.game;
          var live = ((EGE.gameBoosters || {})[entry.player.slug] || {})[week];
          if (g.bye || g.booster || !live || live.season !== year) { return; }
          (edits.weeks[week] = edits.weeks[week] || {})[entry.player.slug] = {
            result: g.result, booster: live.item_key, line: live.line === null || live.line === undefined ? null : Number(live.line),
            stats: g.stats, bigPlays: g.bigPlays, overtime: g.overtime, injured: g.injured, injury: g.injury, health: g.health
          };
        });
      });
      return EGE.exports.seasonFile(year, edits);
    }).then(function (stats) {
      /* A season the sim has not played a game of has no scores to write. */
      if (playedSeasons().indexOf(year) === -1) { return { stats: stats, results: null }; }
      var results = (EGE.nflSimResults || {})[year] || null;
      return { stats: stats, results: sim().site.resultsFileText(year, results) };
    }).then(function (files) {
      /* The stickers read for another season go back to the live one's,
         which the schedules draw. */
      if (year === EGE.currentSeason) { return files; }
      return EGE.wallet.loadGameBoosters(EGE.currentSeason).then(function () { return files; });
    });
  }

  /* --- the offseason, start to finish -----------------------------------

     From the Super Bowl until the site rolls over, a list at the top of the
     tab of what is left to do and what is done (Sam, 2026-11-05: "make the
     offseason a little easier for me to run"), and one download with
     every file the season's end puts in the repository. */

  /* The seasons whose files had the six's games in them when the page
     loaded: what is on the site, as opposed to a season this page has
     filled in memory to write its file (fillSeason). */
  var ON_SITE = {};
  Object.keys(EGE.stats || {}).forEach(function (year) {
    var games = EGE.stats[year].games || {};
    if (Object.keys(games).some(function (slug) { return games[slug].length; })) { ON_SITE[year] = true; }
  });

  /* The season the sim has finished and the site has not rolled past, or
     null outside an offseason. */
  function endingSeason(league) {
    if (league.phase === 'offseason') { return league.season; }
    var year = league.season - 1;
    if (league.phase === 'draft') { return year; }
    return EGE.currentSeason <= year ? year : null;
  }

  /* Every attribute bought and not cleared yet: what End of Season's
     Clear the shop rows takes off. */
  function shopRowsLeft() {
    var boosts = EGE.appliedBoosts || {};
    return Object.keys(boosts).some(function (slug) {
      return Object.keys(boosts[slug]).some(function (key) { return boosts[slug][key]; });
    });
  }

  /* The files the end of `year` puts in the repository, as they stand:
     its season file and the NFL scores, the next season's file once the
     draft is done, and while the site is still on `year`, the locked
     ratings and the season's log. [{ path, text }] */
  function offseasonFiles(year) {
    var league = openLeague();
    var next = league.season > year && league.phase !== 'draft' ? league.season : null;
    var out = [];
    var results = null;
    return seasonFiles(year).then(function (files) {
      out.push({ path: 'stats/' + year + '.js', text: files.stats });
      results = files.results;
      return next ? seasonFiles(next) : null;
    }).then(function (files) {
      if (files) {
        out.push({ path: 'stats/' + next + '.js', text: files.stats });
        results = files.results || results;
      }
      if (results) { out.push({ path: 'data/nfl-results.js', text: results }); }
      if (EGE.currentSeason !== year) { return null; }
      return Promise.all([EGE.exports.ratingsFile(year), EGE.exports.seasonLogFile(year)]);
    }).then(function (more) {
      if (more) {
        out.push({ path: 'data/ratings.js', text: more[0] });
        out.push({ path: 'data/logs/season-' + year + '.js', text: more[1] });
      }
      return out;
    });
  }

  function downloadOffseason(year) {
    if (state.busy) { return Promise.resolve(); }
    state.busy = true;
    state.error = null;
    draw();
    return offseasonFiles(year).then(function (files) {
      EGE.exports.download('ege-' + year + '-offseason.zip', EGE.exports.zip(files));
      state.last = { title: 'Downloaded ege-' + year + '-offseason.zip',
                     lines: files.map(function (f) { return f.path; }).concat(['Unzip it and drag its folders onto GitHub’s upload page.']) };
    }).catch(function (err) {
      state.error = err.message || String(err);
    }).then(function () {
      state.busy = false;
      draw();
    });
  }

  function drawOffseason(body, league) {
    var year = endingSeason(league);
    if (!year) { return; }
    var next = year + 1;
    var moved = league.season > year;
    var drafted = moved && league.phase !== 'draft';
    var unsigned = moved ? sim().run.offers(league).map(function (w) { return w.name; }) : [];
    var unpublished = waiting().filter(function (w) { return w.season === year; });
    var rolled = EGE.currentSeason > year;
    var missing = [];
    if (EGE.storedWeeks && EGE.storedWeeks.overFile(year).length) { missing.push('stats/' + year + '.js'); }
    if (!ON_SITE[next]) { missing.push('stats/' + next + '.js'); }
    if (!rolled && !EGE.seasonLocked(year)) { missing.push('data/ratings.js'); }

    var part = section('The ' + next + ' offseason');
    var list = el('ol', 'ege-sim__todo');
    function item(done, text, extra) {
      var li = el('li', done ? 'is-done' : null);
      li.appendChild(el('span', 'ege-sim__todotext', text));
      if (extra) { li.appendChild(extra); }
      list.appendChild(li);
    }
    function link(text, hash) {
      var a = el('a', 'ege-sim__todolink', text);
      a.href = '#' + hash;
      return a;
    }

    item(!unpublished.length, unpublished.length ? 'Publish ' + weekLabel(league, unpublished[0]) : 'Every ' + year + ' week out');
    item(moved, 'Run the ' + next + ' offseason');
    item(moved && !unsigned.length, unsigned.length ? 'Sign ' + unsigned.join(' and ') : 'Free agents signed');
    item(drafted, 'Run the ' + next + ' draft');
    var files = el('span', 'ege-sim__todoact');
    files.appendChild(button('Download all', false, function () { downloadOffseason(year); }));
    if (missing.length && !rolled) { files.appendChild(el('span', 'fb-meta', 'Not on the site yet: ' + missing.join(', '))); }
    item(!missing.length, 'Put the files on GitHub', rolled ? null : files);
    item(rolled || (EGE.seasonLocked(year) && !shopRowsLeft()), 'Clear the shop rows', rolled ? null : link('End of Season', 'admin/season'));
    item(rolled, 'Roll over to ' + next, rolled ? null : link('End of Season', 'admin/season'));
    part.appendChild(list);
    body.appendChild(part);
  }

  /* "Weeks 4–7" */
  function weeksText(weeks) {
    var runs = [];
    weeks.forEach(function (week) {
      var last = runs[runs.length - 1];
      if (last && week === last[1] + 1) { last[1] = week; } else { runs.push([week, week]); }
    });
    return (weeks.length === 1 ? 'Week ' : 'Weeks ') + runs.map(function (run) {
      return run[0] === run[1] ? String(run[0]) : run[0] + '\u2013' + run[1];
    }).join(', ');
  }

  function drawSite(body, league) {
    var part = section('Put it on the site');
    var years = playedSeasons();
    /* And the season the sim has moved on to, from the offseason on. */
    if (years.length && years.indexOf(league.season) === -1) { years.push(league.season); }
    var r = row();
    if (!years.length) {
      part.appendChild(el('p', 'fb-meta', 'The sim has not played a game of its own yet.'));
    } else {
      var label = el('label', 'ege-field ege-field--inline');
      label.appendChild(el('span', 'fb-eyebrow', 'Season'));
      var pick = el('select', 'fb-select');
      years.slice().reverse().forEach(function (year) {
        var option = el('option', null, String(year));
        option.value = year;
        pick.appendChild(option);
      });
      label.appendChild(pick);
      r.appendChild(label);
      r.appendChild(button('Download the season files', false, function () {
        var year = Number(pick.value);
        state.error = null;
        seasonFiles(year).then(function (files) {
          EGE.exports.download(year + '.js', files.stats);
          if (files.results) {
            window.setTimeout(function () { EGE.exports.download('nfl-results.js', files.results); }, 400);
          }
          state.last = files.results
            ? { title: 'Downloaded ' + year + '.js and nfl-results.js',
                lines: ['Put ' + year + '.js in stats/ and nfl-results.js in data/.'] }
            : { title: 'Downloaded ' + year + '.js', lines: ['Put ' + year + '.js in stats/.'] };
          draw();
        }).catch(function (err) {
          state.error = err.message || String(err);
          draw();
        });
      }));
    }
    part.appendChild(r);
    var unfiled = EGE.storedWeeks ? EGE.storedWeeks.overFile(league.season) : [];
    if (unfiled.length) {
      part.appendChild(el('p', 'fb-meta', 'Not in stats/' + league.season + '.js yet: ' + weeksText(unfiled)));
    }

    var pub = row();
    var check = el('label', 'ege-sim__check');
    var box = el('input');
    box.type = 'checkbox';
    box.checked = publishing();
    box.addEventListener('change', function () {
      try { window.localStorage.setItem(PUBLISH_KEY, box.checked ? 'on' : 'off'); } catch (e) { /* kept for this visit only */ }
    });
    check.appendChild(box);
    check.appendChild(el('span', null, 'Update the Teams pages’ rosters after every step'));
    pub.appendChild(check);
    pub.appendChild(button('Update rosters now', false, function () {
      state.busy = true;
      draw();
      publishRosters(openLeague()).then(function () {
        state.last = { title: 'Rosters updated', lines: ['The Teams pages show the ' + league.season + ' rosters as the sim has them now.'] };
      }, function (err) { state.error = err.message || String(err); }).then(function () {
        state.busy = false;
        draw();
      });
    }));
    part.appendChild(pub);
    body.appendChild(part);
  }

  function drawWorld(body) {
    var part = section('The world',
      'Kept in Supabase, where only an admin can read it. A download is a copy to keep or to load back here later.');
    var r = row();
    r.appendChild(button('Download the world', false, function () {
      var copy = { kind: 'ege-nfl-sim-world', savedAt: new Date().toISOString(), files: state.files };
      var blob = new Blob([JSON.stringify(copy)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var link = el('a');
      link.href = url;
      link.download = 'nfl-sim-world-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    }, !hasWorld()));

    var upload = el('input');
    upload.type = 'file';
    upload.accept = 'application/json,.json';
    upload.hidden = true;
    upload.addEventListener('change', function () {
      var file = upload.files && upload.files[0];
      if (!file) { return; }
      file.text().then(function (text) {
        var copy = JSON.parse(text);
        if (!copy || copy.kind !== 'ege-nfl-sim-world' || !copy.files || !copy.files['league.json']) {
          throw new Error('That is not a world downloaded from here.');
        }
        return replaceWorld(copy.files).then(function () {
          state.last = { title: 'Loaded the world', lines: ['From ' + file.name + '.'] };
        });
      }).catch(function (err) { state.error = err.message || String(err); }).then(draw);
    });
    r.appendChild(upload);
    r.appendChild(button('Load a world', false, function () { upload.click(); }));
    part.appendChild(r);

    var over = row();
    var label = el('label', 'ege-field ege-field--inline');
    label.appendChild(el('span', 'fb-eyebrow', 'Type RESET to start over'));
    var confirm = el('input', 'fb-input');
    confirm.type = 'text';
    confirm.autocomplete = 'off';
    confirm.spellcheck = false;
    confirm.placeholder = 'RESET';
    label.appendChild(confirm);
    over.appendChild(label);
    var reset = button('Start over', false, function () {
      if (confirm.value.trim() !== 'RESET') { return; }
      replaceWorld({}).then(function () {
        state.last = { title: 'Started over', lines: ['The world is gone. Start it again above.'] };
      }, function (err) { state.error = err.message || String(err); }).then(draw);
    }, !hasWorld());
    reset.disabled = true;
    confirm.addEventListener('input', function () { reset.disabled = state.busy || confirm.value.trim() !== 'RESET'; });
    over.appendChild(reset);
    part.appendChild(over);
    body.appendChild(part);
  }

  /* The whole world at once: every saved file out, these in. With none,
     the published rosters go too, so the Teams pages fall back to the
     committed ones until the world is started again. */
  function replaceWorld(files) {
    var c = client();
    if (!c) { return Promise.reject(new Error('Not connected to Supabase.')); }
    state.busy = true;
    draw();
    var names = Object.keys(files);
    return c.from(FILES).delete().neq('name', '').then(function (res) {
      if (res.error) { throw new Error(schemaHint(res.error.message)); }
      if (names.length) { return null; }
      return c.from(ROSTERS).delete().gte('season', 0).then(function (gone) {
        if (gone.error) { throw new Error(schemaHint(gone.error.message)); }
      });
    }).then(function () {
      state.files = {};
      state.stamps = {};
      state.dirty = {};
      names.forEach(function (name) {
        state.files[name] = files[name];
        state.dirty[name] = true;
      });
      return saveWorld();
    }).then(function () {
      if (names.length && publishing()) { return publishRosters(openLeague()); }
      return null;
    }).then(function () {
      state.busy = false;
    }, function (err) {
      state.busy = false;
      throw err;
    });
  }

  function drawStatus(body, league) {
    var box = el('div', 'ege-sim__status');
    var phase = PHASES[league.phase] || league.phase;
    var next = league.phase === 'regular' || league.phase === 'deadline' ? ' · Week ' + league.week + ' next' : '';
    box.appendChild(el('p', 'ege-sim__where', league.season + ' · ' + phase + next));
    var pending = sim().run.queue(league).length + sim().run.offers(league).length;
    if (pending) { box.appendChild(el('p', 'fb-meta', pending + ' waiting for your approval.')); }
    var champ = (league.history || []).slice(-1)[0];
    if (champ && champ.champion) { box.appendChild(el('p', 'fb-meta', 'Last champion: ' + teamName(champ.champion) + ' (' + champ.season + ').')); }
    body.appendChild(box);
  }

  function drawLast(body) {
    if (!state.last) { return; }
    var box = el('div', 'ege-sim__last');
    box.appendChild(el('h4', 'ege-item__name', state.last.title));
    if (state.last.lines.length) {
      var list = el('ul', 'ege-sim__lines');
      state.last.lines.forEach(function (line) { list.appendChild(el('li', null, line)); });
      box.appendChild(list);
    }
    (state.last.rounds || []).forEach(function (round, i) {
      var part = el('details', 'ege-sim__round');
      if (!i) { part.open = true; }
      part.appendChild(el('summary', null, round.title));
      var picks = el('ul', 'ege-sim__lines');
      round.lines.forEach(function (line) { picks.appendChild(el('li', null, line)); });
      part.appendChild(picks);
      box.appendChild(part);
    });
    body.appendChild(box);
  }

  function draw() {
    var body = byId('nflSimBody');
    if (!body) { return; }
    body.innerHTML = '';
    if (state.error) { body.appendChild(el('p', 'ege-note ege-note--error', state.error)); }
    if (state.busy) { body.appendChild(el('p', 'ege-note ege-note--ok', 'Working…')); }
    if (!state.files) {
      if (!state.error) { body.appendChild(el('p', 'fb-meta', 'Loading the sim…')); }
      return;
    }
    if (!hasWorld()) {
      drawLast(body);
      drawStart(body);
      return;
    }
    var league;
    try {
      league = openLeague();
    } catch (err) {
      body.appendChild(el('p', 'ege-note ege-note--error', 'The saved world would not open: ' + err.message));
      drawWorld(body);
      return;
    }
    drawStatus(body, league);
    drawOffseason(body, league);
    drawLast(body);
    drawPlay(body, league);
    drawLive(body, league);
    drawFreeAgency(body, league);
    drawWeek(body, league);
    drawUpload(body, league);
    drawTrades(body, league);
    drawDirections(body, league);
    drawRosters(body, league);
    drawSix(body, league);
    drawArchetypes(body, league);
    drawSite(body, league);
    drawWorld(body);
  }

  /* Opening the tab: the sim and the world the first time, then the page
     as it stands. */
  function render() {
    if (state.files || state.busy) { draw(); return; }
    if (state.loading) { state.loading.then(draw); return; }
    draw();
    state.loading = loadBundle().then(loadWorld).then(loadLiveGames).then(function () {
      /* Anything played and not stored yet (a step whose storing failed)
         goes now. */
      return hasWorld() ? syncSite(openLeague()).catch(function (err) {
        state.error = 'The site was not brought up to date: ' + (err.message || err);
      }) : null;
    }).catch(function (err) {
      state.error = err.message || String(err);
    }).then(function () {
      state.loading = null;
      draw();
    });
  }

  /* --- for the Teams pages -----------------------------------------------

     An admin edits an NFL team's roster on the team's own page (js/app.js).
     The sim and the world load the first time it is asked for; peek()
     hands over the league as saved once they are in, and change(fn) runs
     fn on it, saves the world and publishes the season's rosters, the way
     a step here does. Anything that throws before the save keeps nothing.
     useDeal() hands a trade the page's trade finder found to the builder,
     and republish() publishes the season's rosters again as they are. */

  function ready() {
    if (state.files) { return Promise.resolve(); }
    if (!state.loading) {
      /* The connections too, which the Tendencies panel counts. */
      state.loading = loadBundle().then(loadWorld).then(function () {
        return loadLive().catch(function () { return null; });
      }).catch(function (err) {
        state.error = err.message || String(err);
      }).then(function () {
        state.loading = null;
      });
    }
    return state.loading.then(function () {
      if (!state.files) { throw new Error(state.error || 'The NFL sim did not load.'); }
    });
  }

  function loaded() { return Boolean(state.files) && hasWorld(); }

  /* The season's rosters published again from the world as it is, nothing
     changed: how rosters published before the pages read something new
     from them (each team's system and fit, 2026-10-21) catch up. Only for
     the season the world is in. */
  function republish(season) {
    return ready().then(function () {
      if (!hasWorld() || state.busy) { return false; }
      var league = openLeague();
      if (league.season !== season) { return false; }
      return publishRosters(league).then(function () { return true; });
    });
  }

  function peek() { return loaded() ? openLeague() : null; }

  function change(fn) {
    return ready().then(function () {
      if (!hasWorld()) { throw new Error('The NFL sim has not been started.'); }
      if (state.busy) { throw new Error('The NFL sim is busy. Try again in a moment.'); }
      state.busy = true;
      var before = Object.assign({}, state.files);
      var saved = false;
      var league;
      var made;
      var posts;
      var posted;
      return Promise.resolve().then(function () {
        league = openLeague();
        var had = approvedIds(league);
        made = fn(league);
        sim().run.save(league);
        posts = tradePosts(league, had);
        return saveWorld();
      }).then(function () {
        saved = true;
        return postTrades(posts);
      }).then(function (problem) {
        posted = problem;
        /* One of the six traded from his pop-up: his new games go to the
           site with it. */
        return syncTrades(league).catch(function (err) {
          posted = posted || 'Traded, but his new games are not on the site yet: ' + (err.message || err);
        });
      }).then(function () {
        return publishRosters(league);
      }).then(function () {
        state.busy = false;
        if (posted) { throw new Error(posted); }
        return made;
      }).catch(function (err) {
        if (!saved) {
          state.files = before;
          state.dirty = {};
        }
        state.busy = false;
        /* Kept anyway: the page says so rather than offering it again. */
        if (saved && err && typeof err === 'object') { err.saved = true; }
        throw err;
      });
    });
  }

  /* A trade found on a team's page (its trade finder), put in the trade
     builder here: [{ key, players: [id], picks: [id] }, ...]. */
  function useDeal(sides) {
    state.deal = sides.map(function (side) {
      return { key: side.key, players: (side.players || []).slice(), picks: (side.picks || []).slice() };
    });
  }

  /* For the live page: an admin watching keeps the posts going too. */
  function watchLive() { return loadLiveGames(); }

  /* For End of Season: everything the season's end puts in the repository,
     as one download. */
  function downloadAll() {
    return ready().then(function () {
      if (!hasWorld()) { throw new Error('The NFL sim has not been started.'); }
      if (state.busy) { throw new Error('The NFL sim is busy. Try again in a moment.'); }
      var year = endingSeason(openLeague()) || EGE.currentSeason;
      return offseasonFiles(year).then(function (files) {
        EGE.exports.download('ege-' + year + '-offseason.zip', EGE.exports.zip(files));
        return files;
      });
    });
  }

  return { render: render, ready: ready, loaded: loaded, peek: peek, change: change, useDeal: useDeal, republish: republish,
           watchLive: watchLive, downloadAll: downloadAll };
})();
