/* ==========================================================================
   EGE Football — auth
   Six known players, six hardcoded emails. A player sets their own password
   the first time, then signs in with it. A forgotten password is replaced by
   emailing a six-digit PIN and typing it back into the site.

   Depends on: supabase-js (loaded from CDN in index.html) and
   js/supabase-config.js.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.auth = (function () {
  'use strict';

  var MIN_PASSWORD = 8;

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

  /* Why the portal is unavailable, in words a human can act on. */
  function unavailableReason() {
    if (!configured()) {
      return 'The portal is not configured yet — add your Supabase URL and anon key to js/supabase-config.js.';
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

  function fail(message) { return Promise.resolve({ ok: false, message: message }); }

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

  /* --- signing in ------------------------------------------------------- */

  function signIn(email, password) {
    var c = getClient();
    if (!c) { return fail(unavailableReason()); }

    return c.auth.signInWithPassword({ email: email, password: password })
      .then(function (res) {
        if (res.error) {
          return {
            ok: false,
            message: 'That password is not right. If you have never set one, use First Time.'
          };
        }
        return { ok: true, message: 'Signed in.' };
      });
  }

  /* --- first password --------------------------------------------------- */

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

  /* Sets a password for an account that has never had one. An account that
     already has a password is turned away here — changing one goes through
     the PIN instead. */
  function createPassword(email, password, confirmation) {
    var c = getClient();
    if (!c) { return fail(unavailableReason()); }
    if (!password || password.length < MIN_PASSWORD) {
      return fail('Use at least ' + MIN_PASSWORD + ' characters.');
    }
    if (password !== confirmation) {
      return fail('Those two passwords do not match.');
    }

    return c.auth.signUp({ email: email, password: password }).then(function (res) {
      if (alreadyRegistered(res)) {
        return {
          ok: false,
          message: 'This player already has a password. Sign in, or use Forgot Password.'
        };
      }
      if (res.error) { return { ok: false, message: res.error.message }; }
      if (!res.data.session) {
        return { ok: false, message: 'Password saved. Confirm the email Supabase sent you, then sign in.' };
      }
      return { ok: true, message: 'Password set. You are signed in.' };
    });
  }

  /* --- forgotten password: PIN by email --------------------------------- */

  /* Emails a six-digit code. Supabase sends the code rather than a link when
     the Magic Link email template includes {{ .Token }}. */
  function sendPin(email) {
    var c = getClient();
    if (!c) { return fail(unavailableReason()); }

    return c.auth.signInWithOtp({ email: email, options: { shouldCreateUser: false } })
      .then(function (res) {
        if (res.error) {
          if (/signups not allowed|not found/i.test(res.error.message || '')) {
            return { ok: false, message: 'No account yet for that player — set a first password instead.' };
          }
          return { ok: false, message: res.error.message };
        }
        return { ok: true, message: 'PIN sent to ' + email + '. It expires shortly.' };
      });
  }

  /* Trading the PIN for a session is what authorises the new password. */
  function verifyPin(email, pin) {
    var c = getClient();
    if (!c) { return fail(unavailableReason()); }
    if (!/^\d{6}$/.test((pin || '').trim())) {
      return fail('The PIN is six digits.');
    }

    return c.auth.verifyOtp({ email: email, token: pin.trim(), type: 'email' })
      .then(function (res) {
        if (res.error) {
          return { ok: false, message: 'That PIN is wrong or has expired. Send a new one.' };
        }
        session = res.data.session;
        return { ok: true, message: 'PIN accepted.' };
      });
  }

  /* Sets the password of whoever the current session belongs to — only
     reachable straight after a PIN has been accepted. */
  function updatePassword(password, confirmation) {
    var c = getClient();
    if (!c) { return fail(unavailableReason()); }
    if (!password || password.length < MIN_PASSWORD) {
      return fail('Use at least ' + MIN_PASSWORD + ' characters.');
    }
    if (password !== confirmation) {
      return fail('Those two passwords do not match.');
    }

    return c.auth.updateUser({ password: password }).then(function (res) {
      if (res.error) { return { ok: false, message: res.error.message }; }
      return { ok: true, message: 'Password changed. You are signed in.' };
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
    signIn: signIn,
    createPassword: createPassword,
    sendPin: sendPin,
    verifyPin: verifyPin,
    updatePassword: updatePassword,
    signOut: signOut,
    currentPlayer: currentPlayer,
    onChange: onChange,
    MIN_PASSWORD: MIN_PASSWORD
  };
})();
