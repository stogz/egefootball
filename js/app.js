/* ==========================================================================
   EGE Football — homepage
   Renders the six player cards, routes #{slug} to a player view, and runs
   the player portal.
   Plain script, no build step, no modules — works from file:// and http.
   ========================================================================== */

(function () {
  'use strict';

  var TBD = 'TBD';

  var roster     = document.getElementById('roster');
  var viewHome   = document.getElementById('view-home');
  var viewPlayer = document.getElementById('view-player');
  var loginBtn   = document.getElementById('loginBtn');
  var loginModal = document.getElementById('loginModal');

  /* --- helpers ---------------------------------------------------------- */

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text != null) { node.textContent = text; }
    return node;
  }

  function seasonLabel(year) {
    var s = EGE.seasons.filter(function (x) { return x.year === year; })[0];
    return s ? s.year + ' · ' + s.class + ' · ' + s.level : String(year);
  }

  /* School name with its mark beside it, or a plain TBD while unknown. */
  function schoolLine(player, className) {
    var team = EGE.teamFor(player);
    var line = el('div', 'ege-school' + (className ? ' ' + className : ''));

    if (!team) {
      line.appendChild(el('span', 'ege-school__name', 'School ' + TBD));
      return line;
    }

    var logo = el('img', 'ege-school__logo');
    logo.src = team.logo;
    logo.alt = '';            /* decorative: the name is right beside it */
    logo.loading = 'lazy';
    line.appendChild(logo);
    line.appendChild(el('span', 'ege-school__name', team.school));
    return line;
  }

  /* --- player cards ----------------------------------------------------- */

  function buildCard(player) {
    var team = EGE.teamFor(player);
    var card = el('a', 'ege-card');
    card.href = '#' + player.slug;

    var photo = el('div', 'ege-card__photo');
    var img = el('img');
    img.src = player.headshot;
    img.alt = player.name;
    img.loading = 'lazy';
    photo.appendChild(img);
    if (player.jersey) { photo.appendChild(el('span', 'ege-card__jersey', '#' + player.jersey)); }
    card.appendChild(photo);

    var body = el('div', 'ege-card__body');
    body.appendChild(el('h3', 'ege-card__name', player.name));
    body.appendChild(schoolLine(player));
    body.appendChild(el('p', 'ege-card__league', team ? team.league : ''));

    var tags = el('div', 'fb-row fb-row--wrap');
    if (player.position) {
      tags.appendChild(el('span', 'fb-tag fb-tag--ink', player.position));
    } else {
      tags.appendChild(el('span', 'fb-tag fb-tag--outline', 'POS ' + TBD));
    }
    tags.appendChild(el('span', 'fb-tag fb-tag--gold', EGE.currentSeason));
    body.appendChild(tags);

    body.appendChild(el('span', 'ege-card__go', 'View player →'));
    card.appendChild(body);

    return card;
  }

  function renderRoster() {
    var frag = document.createDocumentFragment();
    EGE.players.forEach(function (player) { frag.appendChild(buildCard(player)); });
    roster.appendChild(frag);
  }

  /* --- player view ------------------------------------------------------ */

  function renderPlayer(player) {
    var team = EGE.teamFor(player);

    document.getElementById('playerStripLabel').textContent = seasonLabel(EGE.currentSeason);

    var photo = document.getElementById('playerPhoto');
    photo.src = player.headshot;
    photo.alt = player.name;

    var school = document.getElementById('playerSchool');
    school.innerHTML = '';
    school.appendChild(schoolLine(player, 'ege-school--lg'));

    document.getElementById('playerName').textContent = player.name;
    document.getElementById('playerSeason').textContent = seasonLabel(EGE.currentSeason);
    document.getElementById('playerPosition').textContent = player.position || TBD;
    document.getElementById('playerSchoolRow').textContent = team ? team.school : TBD;
    document.getElementById('playerLeague').textContent = team ? team.league : TBD;

    var tags = document.getElementById('playerTags');
    tags.innerHTML = '';
    if (player.position) {
      tags.appendChild(el('span', 'fb-tag fb-tag--ink', player.position));
    } else {
      tags.appendChild(el('span', 'fb-tag fb-tag--outline', 'POS ' + TBD));
    }
    tags.appendChild(el('span', 'fb-tag fb-tag--gold', 'Junior Year'));

    document.title = player.name;
  }

  /* --- routing ---------------------------------------------------------- */

  function route() {
    var slug = window.location.hash.replace(/^#/, '');
    var player = slug ? EGE.playerBySlug(slug) : null;

    if (player) {
      renderPlayer(player);
      viewHome.hidden = true;
      viewPlayer.hidden = false;
    } else {
      viewHome.hidden = false;
      viewPlayer.hidden = true;
      document.title = 'EGE Football';
    }
    window.scrollTo(0, 0);
  }

  /* --- portal: shared bits ---------------------------------------------- */

  var panelAuth     = document.getElementById('panelAuth');
  var panelPin      = document.getElementById('panelPin');
  var panelSignedIn = document.getElementById('panelSignedIn');

  var loginPlayer = document.getElementById('loginPlayer');
  var authForm    = document.getElementById('authForm');
  var authSubmit  = document.getElementById('authSubmit');
  var authTabs    = document.getElementById('authTabs');

  /* Writes into one of the modal's message slots. */
  function reporter(id) {
    var node = document.getElementById(id);
    return function (text, isError) {
      node.textContent = text || '';
      node.hidden = !text;
      node.className = 'ege-note' + (isError ? ' ege-note--error' : ' ege-note--ok');
    };
  }

  var sayAuth = reporter('authMessage');
  var sayPin  = reporter('pinMessage');
  var sayNew  = reporter('newPasswordMessage');

  function showPanel(panel) {
    panelAuth.hidden     = panel !== panelAuth;
    panelPin.hidden      = panel !== panelPin;
    panelSignedIn.hidden = panel !== panelSignedIn;
  }

  function selectedPlayer() { return EGE.playerBySlug(loginPlayer.value); }

  function fillPlayerSelect() {
    EGE.players.forEach(function (player) {
      var opt = el('option', null, player.name + (player.email ? '' : ' — no account yet'));
      opt.value = player.slug;
      opt.disabled = !player.email;
      loginPlayer.appendChild(opt);
    });
    var first = EGE.playersWithAccounts()[0];
    if (first) { loginPlayer.value = first.slug; }
  }

  /* --- portal: show/hide password --------------------------------------- */

  /* One handler for every eye button; each names the field it reveals. */
  document.addEventListener('click', function (e) {
    var eye = e.target.closest ? e.target.closest('.ege-eye') : null;
    if (!eye) { return; }

    var field = document.getElementById(eye.getAttribute('data-reveals'));
    var reveal = field.type === 'password';

    field.type = reveal ? 'text' : 'password';
    eye.setAttribute('aria-pressed', String(reveal));
    eye.setAttribute('aria-label', reveal ? 'Hide password' : 'Show password');
  });

  /* --- portal: sign in / first password --------------------------------- */

  var mode = 'signin';
  var confirmField = document.getElementById('confirmField');
  var authPassword = document.getElementById('authPassword');
  var authConfirm  = document.getElementById('authConfirm');

  function setMode(next) {
    mode = next;
    var creating = mode === 'create';

    Array.prototype.forEach.call(authTabs.children, function (tab) {
      var on = tab.getAttribute('data-mode') === mode;
      tab.classList.toggle('is-active', on);
      tab.setAttribute('aria-selected', String(on));
    });

    confirmField.hidden = !creating;
    authConfirm.required = creating;
    authPassword.autocomplete = creating ? 'new-password' : 'current-password';
    document.getElementById('passwordLabel').textContent =
      creating ? 'Choose a password' : 'Password';
    authSubmit.textContent = creating ? 'Create Password' : 'Sign In';
    sayAuth('', false);
  }

  authTabs.addEventListener('click', function (e) {
    var tab = e.target.closest('.fb-seg__opt');
    if (tab) { setMode(tab.getAttribute('data-mode')); }
  });

  authForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var player = selectedPlayer();
    if (!player || !player.email) { sayAuth('That player has no account yet.', true); return; }

    authSubmit.disabled = true;
    sayAuth('Checking…', false);

    var work = mode === 'create'
      ? EGE.auth.createPassword(player.email, authPassword.value, authConfirm.value)
      : EGE.auth.signIn(player.email, authPassword.value);

    work.then(function (res) {
      authSubmit.disabled = false;
      sayAuth(res.message, !res.ok);
      if (res.ok) { authPassword.value = ''; authConfirm.value = ''; }
    });
  });

  /* --- portal: forgotten password --------------------------------------- */

  var pinForm         = document.getElementById('pinForm');
  var pinCode         = document.getElementById('pinCode');
  var pinSubmit       = document.getElementById('pinSubmit');
  var newPasswordForm = document.getElementById('newPasswordForm');

  function requestPin(player, report) {
    report('Sending…', false);
    return EGE.auth.sendPin(player.email).then(function (res) {
      report(res.message, !res.ok);
      return res;
    });
  }

  document.getElementById('forgotBtn').addEventListener('click', function () {
    var player = selectedPlayer();
    if (!player || !player.email) { sayAuth('That player has no account yet.', true); return; }

    document.getElementById('pinWho').textContent =
      'Changing the password for ' + player.name + ' (' + player.email + ').';
    pinCode.value = '';
    sayNew('', false);
    newPasswordForm.hidden = true;
    pinForm.hidden = false;
    showPanel(panelPin);
    requestPin(player, sayPin).then(function () { pinCode.focus(); });
  });

  document.getElementById('pinResend').addEventListener('click', function () {
    requestPin(selectedPlayer(), sayPin);
  });

  pinForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var player = selectedPlayer();

    pinSubmit.disabled = true;
    sayPin('Checking…', false);

    EGE.auth.verifyPin(player.email, pinCode.value).then(function (res) {
      pinSubmit.disabled = false;
      if (!res.ok) { sayPin(res.message, true); return; }
      sayPin('', false);
      pinForm.hidden = true;
      newPasswordForm.hidden = false;
      document.getElementById('newPassword').focus();
    });
  });

  newPasswordForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var submit = document.getElementById('newPasswordSubmit');
    var next = document.getElementById('newPassword').value;
    var again = document.getElementById('newPasswordConfirm').value;

    submit.disabled = true;
    sayNew('Saving…', false);

    EGE.auth.updatePassword(next, again).then(function (res) {
      submit.disabled = false;
      sayNew(res.message, !res.ok);
      if (res.ok) {
        document.getElementById('newPassword').value = '';
        document.getElementById('newPasswordConfirm').value = '';
      }
    });
  });

  document.getElementById('pinBack').addEventListener('click', function () {
    showPanel(panelAuth);
  });

  /* --- portal: session -------------------------------------------------- */

  document.getElementById('logoutBtn').addEventListener('click', function () {
    EGE.auth.signOut();
  });

  function showSignedOutNav() {
    loginBtn.className = 'fb-btn fb-btn--inverse';
    loginBtn.textContent = 'Log In';
    loginBtn.removeAttribute('title');
    loginBtn.setAttribute('aria-label', 'Open the player portal');
  }

  function showSignedInNav(player) {
    loginBtn.className = 'ege-avatarbtn';
    loginBtn.innerHTML = '';
    var img = el('img', 'ege-avatar');
    img.src = player.headshot;
    img.alt = '';
    loginBtn.appendChild(img);
    loginBtn.title = player.name;
    loginBtn.setAttribute('aria-label', 'Open ' + player.name + '’s portal');
  }

  EGE.auth.onChange(function (player) {
    if (player) {
      showSignedInNav(player);
      document.getElementById('signedInName').textContent = player.name;
      var photo = document.getElementById('signedInPhoto');
      photo.src = player.headshot;
      photo.alt = player.name;
      showPanel(panelSignedIn);
    } else {
      showSignedOutNav();
      showPanel(panelAuth);
    }
  });

  /* --- portal: open and close ------------------------------------------- */

  function openLogin() {
    if (!EGE.auth.available()) {
      sayAuth(EGE.auth.unavailableReason(), true);
      authSubmit.disabled = true;
      document.getElementById('forgotBtn').disabled = true;
    }
    loginModal.hidden = false;
    if (!panelAuth.hidden) { authPassword.focus(); }
  }
  function closeLogin() { loginModal.hidden = true; }

  loginBtn.addEventListener('click', openLogin);
  loginModal.addEventListener('click', function (e) {
    if (e.target === loginModal || e.target.hasAttribute('data-close-login')) { closeLogin(); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !loginModal.hidden) { closeLogin(); }
  });

  /* --- go --------------------------------------------------------------- */

  renderRoster();
  fillPlayerSelect();
  setMode('signin');
  route();
  EGE.auth.init();
  window.addEventListener('hashchange', route);
})();
