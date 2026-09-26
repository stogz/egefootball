/* ==========================================================================
   EGE Football — always the latest files
   GitHub Pages sends every file with max-age=600, which lets a browser that
   has been here in the last ten minutes answer from its own copy without
   asking. After a push that meant opening the site and getting yesterday's
   page, or half of it -- a new index.html beside an old app.js -- until a
   reload. js/site-data.js already gets the season files past it; this gets
   everything else past it too.

   Every request for one of the site's own files goes to the server with
   `no-cache`: "check before you use what you have". A file that has not
   changed comes back as a 304 and the browser uses its copy, so this costs a
   quick round trip per file rather than a download. A file that has changed
   comes back new, the first time.

   What this deliberately does not do: keep a copy of anything. There is no
   Cache Storage here and no offline mode, so there is no second cache that
   can go stale -- the only cache is the browser's own, and this only ever
   makes it ask. With no network, a request falls back to whatever the
   browser has, exactly as it would with no worker at all.

   Other sites' files (Supabase, the fonts, the CDN) are left alone.

   Taking it out: registrations outlive the file, so deleting sw.js is not
   enough. Replace its contents with

     self.addEventListener('install', function () { self.skipWaiting(); });
     self.addEventListener('activate', function () {
       self.registration.unregister();
     });

   and every browser drops it on its next visit.
   ========================================================================== */

'use strict';

/* A new version takes over straight away rather than waiting for every tab
   to close. Safe because it holds nothing: the old and new worker behave
   the same apart from whatever the change was. */
self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') { return; }
  if (new URL(request.url).origin !== self.location.origin) { return; }
  /* A request that may only be answered from the cache cannot be sent
     anywhere, and fetch() throws on it when it is not same-origin mode. */
  if (request.cache === 'only-if-cached') { return; }

  event.respondWith(fresh(request).catch(function () {
    /* No network: whatever the browser has, as if this were not here. */
    return fetch(request);
  }));
});

function fresh(request) {
  /* A page load cannot be copied with new options -- a navigation request
     refuses them -- so it is asked for again by address. */
  if (request.mode === 'navigate') {
    return fetch(request.url, { cache: 'no-cache', credentials: 'same-origin' })
      .then(function (response) {
        /* A page answered through a redirect (the site's address without its
           trailing slash, say) has to be handed back as the redirect, or the
           browser refuses the answer outright. */
        return response.redirected ? Response.redirect(response.url, 302) : response;
      });
  }
  return fetch(request, { cache: 'no-cache' });
}
