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

    /* Not every school has a mark in icon/ yet. */
    if (team.logo) {
      var logo = el('img', 'ege-school__logo');
      logo.src = team.logo;
      logo.alt = '';          /* decorative: the name is right beside it */
      logo.loading = 'lazy';
      line.appendChild(logo);
    }
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
    body.appendChild(el('p', 'ege-card__league', team ? (team.league || 'League ' + TBD) : ''));

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
    document.getElementById('playerLeague').textContent = (team && team.league) || TBD;

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
  var panelSignedIn = document.getElementById('panelSignedIn');

  var loginPlayer  = document.getElementById('loginPlayer');
  var authForm     = document.getElementById('authForm');
  var authSubmit   = document.getElementById('authSubmit');
  var authLead     = document.getElementById('authLead');
  var authPassword = document.getElementById('authPassword');
  var authConfirm  = document.getElementById('authConfirm');
  var confirmField = document.getElementById('confirmField');
  var modeSwitch   = document.getElementById('modeSwitch');

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

  function showPanel(panel) {
    panelAuth.hidden     = panel !== panelAuth;
    panelSignedIn.hidden = panel !== panelSignedIn;
  }

  function selectedPlayer() { return EGE.playerBySlug(loginPlayer.value); }

  function fillPlayerSelect() {
    EGE.players.forEach(function (player) {
      var opt = el('option', null, player.name + (player.email ? '' : ' \u2014 no account yet'));
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

  /* --- portal: one password, set once ----------------------------------- */

  var mode = 'signin';

  function setMode(next, lead) {
    mode = next;
    var creating = mode === 'create';

    confirmField.hidden = !creating;
    authConfirm.required = creating;
    authPassword.autocomplete = creating ? 'new-password' : 'current-password';
    document.getElementById('passwordLabel').textContent =
      creating ? 'Choose a password' : 'Password';
    authSubmit.textContent = creating ? 'Set Password' : 'Sign In';
    authLead.textContent = lead || '';
    authLead.hidden = !lead;
  }

  /* The portal asks the account table which form this player needs, so
     nobody has to know whether they have signed in before. */
  function loadAccount() {
    var player = selectedPlayer();
    sayAuth('', false);
    authPassword.value = '';
    authConfirm.value = '';
    modeSwitch.hidden = true;

    if (!player || !player.email) {
      authForm.hidden = true;
      authLead.hidden = false;
      authLead.textContent = 'That player has no account yet.';
      return Promise.resolve();
    }

    authForm.hidden = true;
    authLead.hidden = false;
    authLead.textContent = 'Checking this account\u2026';

    return EGE.auth.accountState(player.email).then(function (state) {
      authForm.hidden = false;

      if (state === 'set') {
        setMode('signin', 'Welcome back, ' + player.first + '.');
      } else if (state === 'unset') {
        setMode('create', player.first + ' has no password yet. Pick one now.');
      } else {
        /* Cannot tell — offer sign-in and a way across. */
        setMode('signin', 'Sign in, or set a password if this is your first time.');
        modeSwitch.hidden = false;
      }
    });
  }

  loginPlayer.addEventListener('change', loadAccount);

  modeSwitch.addEventListener('click', function () {
    var player = selectedPlayer();
    if (mode === 'create') {
      setMode('signin', 'Sign in, or set a password if this is your first time.');
      modeSwitch.textContent = 'First time? Set your password';
    } else {
      setMode('create', 'Setting the first password for ' + player.first + '.');
      modeSwitch.textContent = 'Already have a password? Sign in';
    }
  });

  authForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var player = selectedPlayer();
    if (!player || !player.email) { sayAuth('That player has no account yet.', true); return; }

    authSubmit.disabled = true;
    sayAuth('Checking\u2026', false);

    var work = mode === 'create'
      ? EGE.auth.createPassword(player.email, authPassword.value, authConfirm.value)
      : EGE.auth.signIn(player.email, authPassword.value);

    work.then(function (res) {
      authSubmit.disabled = false;
      sayAuth(res.message, !res.ok);

      /* The table said there was no password but Supabase disagrees, so
         put the player on the form that can actually work. */
      if (res.taken) {
        setMode('signin', 'Welcome back, ' + player.first + '.');
        modeSwitch.hidden = true;
      }
      if (res.ok) { authPassword.value = ''; authConfirm.value = ''; }
    });
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
      loadAccount();
    }
  });

  /* --- portal: open and close ------------------------------------------- */

  function openLogin() {
    if (!EGE.auth.available()) {
      authForm.hidden = false;
      authLead.hidden = true;
      sayAuth(EGE.auth.unavailableReason(), true);
      authSubmit.disabled = true;
    }
    loginModal.hidden = false;
    if (!panelAuth.hidden && !authForm.hidden) { authPassword.focus(); }
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
  route();
  EGE.auth.init();
  window.addEventListener('hashchange', route);
})();
