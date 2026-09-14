/* ==========================================================================
   EGE Football — auth
   Six known players, six hardcoded emails. A player signs in with their
   email and a password they set themselves the first time; once that
   password exists it cannot be set again, only used.

   Depends on: supabase-js (loaded from CDN in index.html) and
   js/supabase-config.js.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.auth = (function () {
  'use strict';

  var client = null;
  var listeners = [];
  var session = null;

  /* --- setup ------------------------------------------------------------ */

  function configured() {
    var c = EGE.supabaseConfig || {};
    return Boolean(c.url && c.anonKey);
  }

  function available() {
    return configured() && Boolean(window.supabase && window.supabase.createClient);
  }

  /* Why login is unavailable, in words a human can act on. */
  function unavailableReason() {
    if (!configured()) {
      return 'Login is not configured yet — add your Supabase URL and anon key to js/supabase-config.js.';
    }
    if (!window.supabase || !window.supabase.createClient) {
      return 'The Supabase library did not load. Check your connection and refresh.';
    }
    return null;
  }

  function getClient() {
    if (!available()) { return null; }
    if (!client) {
      client = window.supabase.createClient(
        EGE.supabaseConfig.url,
        EGE.supabaseConfig.anonKey
      );
      client.auth.onAuthStateChange(function (_event, newSession) {
        session = newSession;
        emit();
      });
    }
    return client;
  }

  /* --- who is signed in ------------------------------------------------- */

  function currentPlayer() {
    if (!session || !session.user) { return null; }
    var email = (session.user.email || '').toLowerCase();
    return EGE.players.filter(function (p) {
      return p.email && p.email.toLowerCase() === email;
    })[0] || null;
  }

  function onChange(fn) {
    listeners.push(fn);
    fn(currentPlayer());
  }

  function emit() {
    var player = currentPlayer();
    listeners.forEach(function (fn) { fn(player); });
  }

  /* Pick up an existing session on page load. */
  function init() {
    var c = getClient();
    if (!c) { emit(); return; }
    c.auth.getSession().then(function (res) {
      session = res.data ? res.data.session : null;
      emit();
    });
  }

  /* --- sign in / first-time password ------------------------------------ */

  /* Supabase hides whether an email is already registered when email
     confirmation is on: signUp returns a user with an empty identities
     array instead of an error. Both shapes mean "this account exists". */
  function alreadyRegistered(result) {
    if (result.error) {
      return /already registered|already exists/i.test(result.error.message || '');
    }
    var user = result.data && result.data.user;
    return Boolean(user && user.identities && user.identities.length === 0);
  }

  /* One password field does both jobs: sign in if the account exists, set
     the password if it does not. An account that already has a password
     can never have another one set — that path only ever signs in. */
  function submitPassword(email, password) {
    var c = getClient();
    if (!c) { return Promise.resolve({ ok: false, message: unavailableReason() }); }
    if (!password || password.length < 8) {
      return Promise.resolve({ ok: false, message: 'Use at least 8 characters.' });
    }

    return c.auth.signInWithPassword({ email: email, password: password })
      .then(function (res) {
        if (!res.error) { return { ok: true, message: 'Signed in.', created: false }; }

        /* No account yet, or the wrong password — signUp tells us which. */
        return c.auth.signUp({ email: email, password: password }).then(function (signUp) {
          if (alreadyRegistered(signUp)) {
            return { ok: false, message: 'Incorrect password. Your password is already set.' };
          }
          if (signUp.error) {
            return { ok: false, message: signUp.error.message };
          }
          if (!signUp.data.session) {
            return {
              ok: false,
              message: 'Password saved. Confirm the link Supabase emailed you, then sign in.'
            };
          }
          return { ok: true, message: 'Password set. You are signed in.', created: true };
        });
      });
  }

  function signOut() {
    var c = getClient();
    if (!c) { return Promise.resolve(); }
    return c.auth.signOut();
  }

  return {
    init: init,
    available: available,
    unavailableReason: unavailableReason,
    submitPassword: submitPassword,
    signOut: signOut,
    currentPlayer: currentPlayer,
    onChange: onChange
  };
})();
