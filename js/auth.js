/* ==========================================================================
   EGE Football — auth
   Six known players, six hardcoded emails. A player sets their own password
   the first time and then signs in with it. Nothing in the site can change a
   password afterwards — that is an admin job, done from the Supabase
   dashboard. No confirmation emails, no reset emails, no email cost.

   Whether an account already has a password is recorded in the
   public.player_accounts table (see supabase/schema.sql) so the portal can
   show the right form before anyone types anything.

   Depends on: supabase-js (loaded from CDN in index.html) and
   js/supabase-config.js.
   ========================================================================== */

window.EGE = window.EGE || {};

EGE.auth = (function () {
  'use strict';

  var MIN_PASSWORD = 8;
  var ACCOUNTS_TABLE = 'player_accounts';

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

  /* --- does this account have a password yet? --------------------------- */

  /* 'set' — sign in. 'unset' — first password, asked for twice.
     'unknown' — the table is missing or unreachable, so the portal offers
     both rather than guessing. */
  function accountState(email) {
    var c = getClient();
    if (!c) { return Promise.resolve('unknown'); }

    return c.from(ACCOUNTS_TABLE)
      .select('password_set')
      .eq('email', email)
      .maybeSingle()
      .then(function (res) {
        if (res.error) { return 'unknown'; }
        return res.data && res.data.password_set ? 'set' : 'unset';
      })
      .catch(function () { return 'unknown'; });
  }

  /* Recorded right after a password is created, by the account that owns it
     — the table's policies allow nothing else. */
  function markPasswordSet(email) {
    var c = getClient();
    if (!c) { return Promise.resolve(); }
    return c.from(ACCOUNTS_TABLE)
      .upsert({ email: email, password_set: true }, { onConflict: 'email' })
      .then(function () {})
      .catch(function () {});
  }

  /* --- signing in ------------------------------------------------------- */

  function signIn(email, password) {
    var c = getClient();
    if (!c) { return fail(unavailableReason()); }

    return c.auth.signInWithPassword({ email: email, password: password })
      .then(function (res) {
        if (res.error) {
          return { ok: false, message: 'That password is not right.' };
        }
        return { ok: true, message: 'Signed in.' };
      });
  }

  /* --- the one and only password -------------------------------------- */

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

  /* Sets the password for an account that has never had one. Once it is set
     it is permanent as far as this site is concerned. */
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
          taken: true,
          message: 'This player already has a password. Sign in with it below.'
        };
      }
      if (res.error) { return { ok: false, message: res.error.message }; }
      if (!res.data.session) {
        return { ok: false, message: 'Password saved, but Supabase did not sign you in. Try signing in.' };
      }
      return markPasswordSet(email).then(function () {
        return { ok: true, message: 'Password set. You are signed in.' };
      });
    });
  }

  function signOut() {
    var c = getClient();
    if (!c) { return Promise.resolve(); }
    return c.auth.signOut();
  }

  return {
    /* The shop needs the same client, rather than a second one holding a
       second copy of the session. */
    supabaseClient: getClient,
    init: init,
    available: available,
    unavailableReason: unavailableReason,
    accountState: accountState,
    signIn: signIn,
    createPassword: createPassword,
    signOut: signOut,
    currentPlayer: currentPlayer,
    onChange: onChange,
    MIN_PASSWORD: MIN_PASSWORD
  };
})();
