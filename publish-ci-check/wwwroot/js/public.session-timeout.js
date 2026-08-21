/*
 * Session Timeout Handler
 * - Only loaded for authenticated (non-guest) users  (controlled in _Root.Head.cshtml)
 * - Shows popup once after inactivity, then redirects — never repeats
 * DEMO: SESSION_TIMEOUT_MS = 10s, WARNING_BEFORE_MS = 5s
 * PROD: SESSION_TIMEOUT_MS = 30*60*1000, WARNING_BEFORE_MS = 2*60*1000
 */
(function () {
    'use strict';

    // Inactivity window: users are only signed out after no activity for this duration.
    var SESSION_TIMEOUT_MS = 30 * 60 * 1000;  // 30 minutes
    var WARNING_BEFORE_MS  = 2 * 60 * 1000;   // show popup 2 minutes before expiry
    var EXPIRE_URL = '/session/expire';  // server: SignOutAsync → redirect /login?sessionExpired=true
    var LOGIN_URL  = '/login';

    var idleTimer, warningTimer;
    var $overlay;
    var expired = false;  // guard: ensures popup + redirect fire only ONCE

    function buildModal() {
        var css =
            '#session-timeout-overlay{display:none;position:fixed;top:0;left:0;width:100%;height:100%;' +
            'background:rgba(0,0,0,0.6);z-index:999999;align-items:center;justify-content:center;}' +
            '.sto-box{background:#fff;border-radius:10px;padding:40px 36px;max-width:420px;width:90%;' +
            'text-align:center;box-shadow:0 12px 40px rgba(0,0,0,0.25);animation:stoSlideIn 0.3s ease;}' +
            '@keyframes stoSlideIn{from{transform:translateY(-30px);opacity:0}to{transform:translateY(0);opacity:1}}' +
            '.sto-icon{font-size:52px;margin-bottom:14px;}' +
            '.sto-title{margin:0 0 12px;font-size:22px;color:#222;}' +
            '.sto-msg{color:#555;margin:0 0 26px;line-height:1.65;font-size:15px;}' +
            '#sto-login-btn{display:inline-block;padding:12px 36px;background:#e85d04;color:#fff;' +
            'border-radius:6px;text-decoration:none;font-weight:700;font-size:15px;}' +
            '#sto-login-btn:hover{background:#c94c00;}';

        $('<style>').text(css).appendTo('head');

        $overlay = $(
            '<div id="session-timeout-overlay">' +
            '  <div class="sto-box">' +
            '    <div class="sto-icon">&#9201;</div>' +
            '    <h3 class="sto-title">Session Expired</h3>' +
            '    <p class="sto-msg">Your session has expired.<br>Please log in again to continue.</p>' +
            '    <a id="sto-login-btn" href="' + EXPIRE_URL + '">Login Again</a>' +
            '  </div>' +
            '</div>'
        ).appendTo('body');
    }

    function showPopup() {
        if (expired) return;          // never show twice
        expired = true;               // set flag immediately
        stopTimers();                 // stop ALL timers — no more resets
        $(document).off('mousemove keydown mousedown touchstart scroll click'); // unbind activity
        if ($overlay && $overlay.length) {
            $overlay.css({ display: 'flex', opacity: 0 }).animate({ opacity: 1 }, 280);
        }
    }

    function stopTimers() {
        clearTimeout(idleTimer);
        clearTimeout(warningTimer);
    }

    function resetTimers() {
        if (expired) return;          // don't reset if already expired
        stopTimers();
        warningTimer = setTimeout(showPopup, SESSION_TIMEOUT_MS - WARNING_BEFORE_MS);
        idleTimer    = setTimeout(function () {
            if (!expired) {
                showPopup();
                // Redirect after a short delay so user sees the popup briefly
                setTimeout(function () { window.location.href = EXPIRE_URL; }, 1500);
            }
        }, SESSION_TIMEOUT_MS);
    }

    function init() {
        buildModal();
        $(document).on('mousemove keydown mousedown touchstart scroll click', function () {
            resetTimers();
        });
        resetTimers();
    }

    $(document).ready(init);
}());
