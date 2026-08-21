/*
** nopCommerce font size preference
** Reads/writes user choice from localStorage and applies a CSS class to <html>.
** Storage is permanent (localStorage) – survives browser restarts.
*/
(function () {
    'use strict';

    var STORAGE_KEY = 'nop-font-size';
    var VALID_SIZES  = ['small', 'medium', 'large'];
    var DEFAULT_SIZE = 'medium';

    function applyFontSize(size) {
        if (VALID_SIZES.indexOf(size) === -1) { size = DEFAULT_SIZE; }
        var html = document.documentElement;
        VALID_SIZES.forEach(function (s) { html.classList.remove('font-' + s); });
        html.classList.add('font-' + size);
        // Reflect active state on all picker buttons
        document.querySelectorAll('.font-size-option').forEach(function (btn) {
            btn.classList.toggle('selected', btn.getAttribute('data-size') === size);
            btn.setAttribute('aria-pressed', btn.getAttribute('data-size') === size ? 'true' : 'false');
        });
    }

    function setFontSize(size) {
        try { localStorage.setItem(STORAGE_KEY, size); } catch (e) { /* private mode */ }
        applyFontSize(size);
    }

    // Wire up buttons after DOM is ready
    document.addEventListener('DOMContentLoaded', function () {
        var saved = DEFAULT_SIZE;
        try { saved = localStorage.getItem(STORAGE_KEY) || DEFAULT_SIZE; } catch (e) { }
        // Re-apply so buttons reflect current state
        applyFontSize(saved);

        document.querySelectorAll('.font-size-option').forEach(function (btn) {
            btn.addEventListener('click', function () {
                setFontSize(this.getAttribute('data-size'));
            });
        });
    });

    // Expose globally for any inline use
    window.setFontSizePreference = setFontSize;
})();
