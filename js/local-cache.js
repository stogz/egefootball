/* ==========================================================================
   EGE Football — big reads kept in this browser
   Supabase's free plan counts every byte the database sends, and most of
   them were the same bytes again: the NFL's rosters (a couple of MB) on
   every page load, every stored week of every season, a week's box scores
   every time it is opened, and the admin's whole NFL sim world each time
   the tab opens. Kept here (IndexedDB) with the stamp they were saved
   under, the page asks Supabase only for the stamp and reads the thing
   itself again only when the stamp has moved.

   get(key) resolves to what was kept, or undefined; set(key, value) and
   remove(key) resolve when done (or not, quietly). Nothing here ever
   fails or holds a page up: no IndexedDB (a private window, a browser that
   refuses it), or one that does not answer within a moment, is the same as
   an empty cache, and the page reads from Supabase as it always did.
   ========================================================================== */

(function () {
  'use strict';

  window.EGE = window.EGE || {};

  var NAME = 'ege-football';
  var STORE = 'kept';
  var WAIT = 2000;

  var opened = null;

  /* Resolves with `fallback` if `promise` has not answered by then. */
  function inTime(promise, fallback) {
    return new Promise(function (resolve) {
      var done = false;
      var timer = window.setTimeout(function () { done = true; resolve(fallback); }, WAIT);
      promise.then(function (value) {
        if (done) { return; }
        window.clearTimeout(timer);
        resolve(value);
      }, function () {
        if (done) { return; }
        window.clearTimeout(timer);
        resolve(fallback);
      });
    });
  }

  function open() {
    if (opened) { return opened; }
    opened = inTime(new Promise(function (resolve) {
      var idb = null;
      try { idb = window.indexedDB; } catch (e) { idb = null; }
      if (!idb) { resolve(null); return; }
      var req;
      try { req = idb.open(NAME, 1); } catch (e) { resolve(null); return; }
      req.onupgradeneeded = function () {
        try { req.result.createObjectStore(STORE); } catch (e) { /* already there */ }
      };
      req.onsuccess = function () {
        var db = req.result;
        /* Another tab with a newer version of this file: step aside. */
        db.onversionchange = function () { db.close(); opened = null; };
        resolve(db);
      };
      req.onerror = function () { resolve(null); };
      req.onblocked = function () { resolve(null); };
    }), null);
    return opened;
  }

  function run(mode, fn, fallback) {
    return open().then(function (db) {
      if (!db) { return fallback; }
      return inTime(new Promise(function (resolve) {
        try {
          var tx = db.transaction(STORE, mode);
          var req = fn(tx.objectStore(STORE));
          if (mode === 'readonly') {
            req.onsuccess = function () { resolve(req.result); };
            req.onerror = function () { resolve(fallback); };
          } else {
            tx.oncomplete = function () { resolve(true); };
            tx.onerror = tx.onabort = function () { resolve(false); };
          }
        } catch (e) {
          resolve(fallback);
        }
      }), fallback);
    });
  }

  function get(key) {
    return run('readonly', function (store) { return store.get(key); }, undefined);
  }

  function set(key, value) {
    return run('readwrite', function (store) { return store.put(value, key); }, false);
  }

  function remove(key) {
    return run('readwrite', function (store) { return store.delete(key); }, false);
  }

  /* Two saved-at stamps the same moment, whichever way they are written:
     Postgres hands back "+00:00" where the page wrote "Z". */
  function sameStamp(a, b) {
    if (!a || !b) { return false; }
    if (a === b) { return true; }
    var x = Date.parse(a);
    var y = Date.parse(b);
    return !isNaN(x) && x === y;
  }

  EGE.localCache = { get: get, set: set, remove: remove, sameStamp: sameStamp };
})();
