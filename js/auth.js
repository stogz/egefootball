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

  /* --- password reset by email ------------------------------------------ */

  function resetRedirectUrl() {
    var base = (EGE.supabaseConfig && EGE.supabaseConfig.siteUrl) || window.location.origin;
    return base.replace(/\/+$/, '') + '/reset-password.html';
  }

  /* Emails a one-time link to reset-password.html. Supabase does not say
     whether the address has an account, so neither do we. */
  function sendPasswordReset(email) {
    var c = getClient();
    if (!c) { return Promise.resolve({ ok: false, message: unavailableReason() }); }

    return c.auth.resetPasswordForEmail(email, { redirectTo: resetRedirectUrl() })
      .then(function (res) {
        if (res.error) { return { ok: false, message: res.error.message }; }
        return { ok: true, message: 'Reset link sent to ' + email + '. Check your inbox.' };
      });
  }

  /* Anything the link itself reports — an expired or already-used token
     comes back as an error in the URL rather than as a failed call. */
  function errorFromUrl() {
    var hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    var query = new URLSearchParams(window.location.search);
    var described = hash.get('error_description') || query.get('error_description');
    return described ? described.replace(/\+/g, ' ') : null;
  }

  /* Run on reset-password.html: turns the emailed link into a session that
     is allowed to set a new password. supabase-js reads tokens out of the
     URL on its own; a PKCE-style link carries a code to exchange instead. */
  function initRecovery() {
    var c = getClient();
    if (!c) { return Promise.resolve({ ok: false, message: unavailableReason() }); }

    var urlError = errorFromUrl();
    if (urlError) { return Promise.resolve({ ok: false, message: urlError }); }

    return c.auth.getSession().then(function (res) {
      var found = res.data && res.data.session;
      if (found) { session = found; return { ok: true }; }

      var code = new URLSearchParams(window.location.search).get('code');
      if (!code) {
        return {
          ok: false,
          message: 'This link is invalid or has expired. Request a new one from the Log In panel.'
        };
      }
      return c.auth.exchangeCodeForSession(code).then(function (exchanged) {
        if (exchanged.error) { return { ok: false, message: exchanged.error.message }; }
        session = exchanged.data.session;
        return { ok: true };
      });
    });
  }

  /* Sets the password of whoever the current session belongs to. */
  function updatePassword(password) {
    var c = getClient();
    if (!c) { return Promise.resolve({ ok: false, message: unavailableReason() }); }
    if (!password || password.length < 8) {
      return Promise.resolve({ ok: false, message: 'Use at least 8 characters.' });
    }

    return c.auth.updateUser({ password: password }).then(function (res) {
      if (res.error) { return { ok: false, message: res.error.message }; }
      return { ok: true, message: 'Password changed. You can sign in with it now.' };
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
    sendPasswordReset: sendPasswordReset,
    initRecovery: initRecovery,
    updatePassword: updatePassword,
    signOut: signOut,
    currentPlayer: currentPlayer,
    onChange: onChange
  };
})();
