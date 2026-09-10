/* ═════════════════════════════════════════════════════════════════════
   Sticker Hub · NEO-BRUTALISM PATCH  (non-destructive overlay)

   What this file does:
   1. Appends a full-screen overlay root  #__nb_root__  ABOVE the
      Material 3 UI (which stays 100% intact in the DOM).
   2. Lazily loads the React Neo-Brutalism bundle (nb/dist/nb-app.js)
      and mounts it into the overlay via window.__NB_APP_MOUNT__.
   3. Appends a floating "STYLE: M3/NB" switcher (bottom-left) so the
      user can flip between the two skins at any time.
   4. Default view: Neo-Brutalism (per design brief). Overridable via
      localStorage('tg_ui_view_nb') or the ?ui=m3|nb query param.

   To revert to the pure Material 3 UI: delete the two lines that
   reference "nb/nb-patch.css" and "nb/nb-patch.js" at the bottom of
   index.html — nothing else in this page is modified by the patch.
   ═════════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    if (window.__NB_PATCH_LOADED__) return;
    window.__NB_PATCH_LOADED__ = true;

    var VIEW_KEY = 'tg_ui_view_nb';
    var APP_SRC = 'nb/dist/nb-app.js'; // relative → works under any host/prefix

    // ── initial view: ?ui= param > localStorage > default 'nb' ─────────
    var bootView = 'nb';
    try {
        var q = new URLSearchParams(window.location.search).get('ui');
        if (q === 'm3' || q === 'nb') bootView = q;
        else {
            var saved = localStorage.getItem(VIEW_KEY);
            if (saved === 'm3' || saved === 'nb') bootView = saved;
        }
    } catch (_) {}

    var view = bootView;

    // ── webfonts for the NB skin (idempotent) ──────────────────────────
    (function injectFonts() {
        try {
            if (document.querySelector('link[data-nb-fonts]')) return;
            var pre = document.createElement('link');
            pre.rel = 'preconnect';
            pre.href = 'https://fonts.gstatic.com';
            pre.crossOrigin = 'anonymous';
            document.head.appendChild(pre);
            var l = document.createElement('link');
            l.rel = 'stylesheet';
            l.href =
                'https://fonts.googleapis.com/css2?family=Archivo+Black&family=Noto+Sans+SC:wght@400;500;700;900&family=Space+Grotesk:wght@400;500;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap';
            l.setAttribute('data-nb-fonts', 'true');
            document.head.appendChild(l);
        } catch (_) {}
    })();

    // ── overlay root + splash ──────────────────────────────────────────
    var overlay = document.createElement('div');
    overlay.id = '__nb_root__';
    var splash = document.createElement('div');
    splash.className = 'nbp-splash';
    splash.innerHTML =
        '<div class="nbp-splash__box">' +
        '<div class="nbp-splash__spin"></div>' +
        '<div class="nbp-splash__text">Loading Neo-Brutalism…</div>' +
        '<div class="nbp-splash__hint">React · Gumroad-DS 架构 · 旧版 Material 3 保留在底层</div>' +
        '</div>';
    overlay.appendChild(splash);
    document.body.appendChild(overlay);

    // ── host API (consumed by the React app, e.g. the "M3" exit button) ─
    var host = {
        getView: function () {
            return view;
        },
        setView: function (next) {
            if (next !== 'm3' && next !== 'nb') return;
            if (next === view) return;
            view = next;
            try {
                localStorage.setItem(VIEW_KEY, view);
            } catch (_) {}
            syncQuery();
            apply();
        },
        onExit: function () {
            host.setView('m3');
        },
    };
    window.__NB_HOST__ = host;

    function syncQuery() {
        try {
            var url = new URL(window.location.href);
            url.searchParams.set('ui', view);
            window.history.replaceState(null, '', url.toString());
        } catch (_) {}
    }

    // ── lazy app loading (single self-contained IIFE bundle) ──────────
    // nb/dist/nb-app.js is a classic IIFE script that injects its own
    // <style> (all component CSS is compiled into it), so no separate
    // stylesheet is needed.
    var appPromise = null;
    function ensureApp() {
        if (!appPromise) {
            appPromise = new Promise(function (resolve, reject) {
                var s = document.createElement('script');
                s.src = APP_SRC;
                s.async = true;
                s.onload = function () {
                    if (typeof window.__NB_APP_MOUNT__ === 'function') resolve(window.__NB_APP_MOUNT__);
                    else reject(new Error('__NB_APP_MOUNT__ missing'));
                };
                s.onerror = function () {
                    reject(new Error('Failed to load ' + APP_SRC));
                };
                document.head.appendChild(s);
            });
        }
        return appPromise;
    }

    function splashError() {
        splash.classList.add('nbp-splash--error');
        splash.querySelector('.nbp-splash__text').textContent = 'NB 样式加载失败';
        splash.querySelector('.nbp-splash__hint').textContent = '已自动回退到 Material 3 — 请刷新重试';
        setTimeout(function () {
            host.setView('m3');
        }, 1600);
    }

    // ── view application ───────────────────────────────────────────────
    function apply() {
        if (view === 'nb') {
            overlay.classList.add('nbp-overlay--on');
            document.body.classList.add('nbp-hosting');
            ensureApp()
                .then(function (mount) {
                    if (view !== 'nb') return;
                    splash.remove();
                    mount(overlay, host);
                })
                .catch(function (err) {
                    console.error('[NB patch]', err);
                    splashError();
                });
        } else {
            overlay.classList.remove('nbp-overlay--on');
            document.body.classList.remove('nbp-hosting');
        }
        syncFab();
    }

    // ── floating switcher ──────────────────────────────────────────────
    var fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'nbp-fab';
    fab.setAttribute('aria-label', '切换 UI 风格 (Material 3 / Neo-Brutalism)');
    fab.innerHTML =
        '<span class="nbp-fab__label">Style</span><span class="nbp-fab__value" aria-hidden="true">M3</span>';
    document.body.appendChild(fab);
    fab.addEventListener('click', function () {
        host.setView(view === 'nb' ? 'm3' : 'nb');
    });

    function syncFab() {
        fab.dataset.view = view;
        fab.querySelector('.nbp-fab__value').textContent = view === 'nb' ? 'NB' : 'M3';
        fab.title = view === 'nb' ? '点击切回 Material 3' : '点击切换 Neo-Brutalism';
    }

    // boot
    syncQuery();
    apply();

    console.log('%c📦 Sticker Hub · Neo-Brutalism patch 已就绪 (M3 未改动)', 'font-weight:bold');
})();
