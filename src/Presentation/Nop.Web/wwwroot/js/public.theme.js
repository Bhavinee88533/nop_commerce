/*
** NopCommerce - Theme Toggle (EPMICMPNOP-299)
** Supports light, dark, and device default (system) modes.
** Preference persisted in localStorage under 'nopTheme'.
*/
(function () {
    'use strict';

    var STORAGE_KEY = 'nopTheme';
    var LIGHT = 'light';
    var DARK = 'dark';
    var SYSTEM = 'system';
    var prefersDarkMedia = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

    function isValidMode(value) {
        return value === LIGHT || value === DARK || value === SYSTEM;
    }

    function getStoredMode() {
        try {
            var stored = localStorage.getItem(STORAGE_KEY);
            return isValidMode(stored) ? stored : SYSTEM;
        } catch (e) {
            return SYSTEM;
        }
    }

    function resolveEffectiveTheme(mode) {
        if (mode === DARK || mode === LIGHT) {
            return mode;
        }

        return prefersDarkMedia && prefersDarkMedia.matches ? DARK : LIGHT;
    }

    function applyThemeMode(mode, persist) {
        var effectiveTheme = resolveEffectiveTheme(mode);

        document.documentElement.setAttribute('data-theme', effectiveTheme);
        document.documentElement.setAttribute('data-theme-mode', mode);

        if (persist) {
            try {
                localStorage.setItem(STORAGE_KEY, mode);
            } catch (e) { }
        }

        updateControl(mode);
        updateButton(effectiveTheme, mode);
    }

    function updateControl(mode) {
        var select = document.getElementById('theme-mode-select');
        if (!select) {
            return;
        }

        if (select.value !== mode) {
            select.value = mode;
        }
    }

    window.nopToggleTheme = function () {
        var currentMode = document.documentElement.getAttribute('data-theme-mode') || SYSTEM;
        var nextMode = currentMode === LIGHT ? DARK : currentMode === DARK ? SYSTEM : LIGHT;
        applyThemeMode(nextMode, true);
    };

    function updateButton(currentTheme, currentMode) {
        var btn = document.getElementById('theme-toggle-btn');
        if (!btn) {
            return;
        }

        var icon = btn.querySelector('.theme-icon');

        if (currentTheme === DARK) {
            if (icon) icon.textContent = '\uD83C\uDF19';   // 🌙
            btn.setAttribute('aria-label', 'Switch to light theme');
        } else {
            if (icon) icon.textContent = '\u2600\uFE0F';   // ☀️
            btn.setAttribute('aria-label', 'Switch to dark theme');
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        var select = document.getElementById('theme-mode-select');
        var storedMode = getStoredMode();

        applyThemeMode(storedMode, false);

        if (select) {
            select.addEventListener('change', function (event) {
                var selectedMode = event && event.target ? event.target.value : SYSTEM;
                applyThemeMode(isValidMode(selectedMode) ? selectedMode : SYSTEM, true);
            });
        }

        if (prefersDarkMedia) {
            var systemChangeHandler = function () {
                if ((document.documentElement.getAttribute('data-theme-mode') || SYSTEM) === SYSTEM) {
                    applyThemeMode(SYSTEM, false);
                }
            };

            if (typeof prefersDarkMedia.addEventListener === 'function') {
                prefersDarkMedia.addEventListener('change', systemChangeHandler);
            } else if (typeof prefersDarkMedia.addListener === 'function') {
                prefersDarkMedia.addListener(systemChangeHandler);
            }
        }
    });
}());
