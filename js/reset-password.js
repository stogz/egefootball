/* ==========================================================================
   EGE Football — reset-password.html
   Turns the emailed reset link into a session, then sets a new password.
   ========================================================================== */

(function () {
  'use strict';

  var checking  = document.getElementById('checking');
  var form      = document.getElementById('resetForm');
  var blocked   = document.getElementById('resetBlocked');
  var done      = document.getElementById('resetDone');
  var message   = document.getElementById('resetMessage');
  var submit    = document.getElementById('resetSubmit');

  function say(text, isError) {
    message.textContent = text;
    message.hidden = !text;
    message.className = 'ege-note' + (isError ? ' ege-note--error' : ' ege-note--ok');
  }

  function show(section) {
    checking.hidden = true;
    form.hidden    = section !== form;
    blocked.hidden = section !== blocked;
    done.hidden    = section !== done;
  }

  EGE.auth.initRecovery().then(function (res) {
    if (!res.ok) {
      document.getElementById('blockedMessage').textContent = res.message;
      show(blocked);
      return;
    }
    show(form);
    document.getElementById('newPassword').focus();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var password = document.getElementById('newPassword').value;
    var confirm  = document.getElementById('confirmPassword').value;

    if (password !== confirm) { say('Those two passwords do not match.', true); return; }

    submit.disabled = true;
    say('Saving…', false);

    EGE.auth.updatePassword(password).then(function (res) {
      submit.disabled = false;
      if (res.ok) { show(done); return; }
      say(res.message, true);
    });
  });
})();
