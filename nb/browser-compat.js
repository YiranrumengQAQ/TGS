/**
 * browser-compat.js — invisible per-engine optimizations + IE compat mode.
 *
 * Runs early (loaded by the patch before the Neo-Brutalism bundle, or
 * imported by the bundle). It is 100% ES5 / IE11-safe so it never breaks
 * legacy engines, and it is idempotent — safe to run twice.
 *
 * What it does (none of it is visible to the user):
 *  ┌ engine ─┬────────────────────────────────────────────────────────────┐
 *  │ All    │ preconnect + dns-prefetch to api.telegram.org (saves the  │
 *  │        │  TCP+TLS round-trip before the first getUpdates)           │
 *  │ Blink  │  content-visibility:auto on off-screen cards (in CSS)      │
 *  │ Gecko  │  standard scrollbar-width / scrollbar-color (in CSS)       │
 *  │ WebKit │  viewport-fit=cover + env(safe-area-inset-*) (CSS/meta)    │
 *  │ legacy │  IE11 mode: no modern bundle, M3 fallback CSS, class flag  │
 *  └────────┴────────────────────────────────────────────────────────────┘
 *
 * Public handle: window.__NB_COMPAT__  { engine, noBundle, ric, cancelRic }
 */
(function () {
    'use strict';
    if (window.__NB_COMPAT__) return;

    var doc = document;
    var ua = navigator.userAgent || '';

    // ── engine detection ───────────────────────────────────────────────
    // IE11 UA has "Trident/7.0" (no "MSIE"); older IE has "MSIE".
    var isIE = /Trident\/|MSIE /.test(ua);
    var css = typeof window.CSS !== 'undefined' ? window.CSS : null;
    var hasVars = !!(css && css.supports && css.supports('display', 'grid'));
    var isLegacy = isIE || !hasVars || typeof window.fetch !== 'function';

    var engine = {
        ie: isIE,
        edge: /Edge\//.test(ua) && !/Edg\//.test(ua), // legacy EdgeHTML
        blink: /Chrome\//.test(ua) || /Chromium\//.test(ua),
        gecko: /Firefox\//.test(ua),
        webkit: /Safari\//.test(ua) && !/Chrome\//.test(ua),
        mobile: /Android|iPhone|iPad|iPod/i.test(ua),
        legacy: isLegacy,
        hasVars: hasVars,
        hasRequestIdleCallback: typeof window.requestIdleCallback === 'function',
        hasIntersectionObserver: typeof window.IntersectionObserver === 'function',
        ua: ua,
    };

    // ── shared: connect api.telegram.org early (all engines) ──────────
    function addLink(rel, href, attr) {
        if (doc.querySelector('link[rel="' + rel + '"][href="' + href + '"]')) return;
        var l = doc.createElement('link');
        l.rel = rel;
        l.href = href;
        if (attr) l.setAttribute.call(l, 'crossorigin', '');
        var head = doc.head;
        if (head) head.insertBefore(l, head.firstChild);
    }
    addLink('preconnect', 'https://api.telegram.org', true);
    addLink('dns-prefetch', 'https://api.telegram.org');

    // ── WebKit (Safari/iOS): honor the safe-area (notch / home bar) ───
    if (!isLegacy) {
        addLink('preconnect', 'https://fonts.gstatic.com', true);
        var vp = doc.querySelector('meta[name="viewport"]');
        if (vp && vp.getAttribute('content') && vp.getAttribute('content').indexOf('viewport-fit=') === -1) {
            vp.setAttribute('content', vp.getAttribute('content') + ', viewport-fit=cover');
        }
    }

    // ── legacy (IE / very old): stay on the Material 3 skin ───────────
    if (isLegacy) {
        doc.documentElement.classList.add('nb-legacy');
        var cssEl = doc.createElement('link');
        cssEl.rel = 'stylesheet';
        cssEl.href = (window.__NB_ASSET__ ? window.__NB_ASSET__('nb/ie-fallback.css') : 'nb/ie-fallback.css');
        doc.head.appendChild(cssEl);
    }

    // ── Material 3 memory-leak fix: lottie instances ──────────────────
    // The M3 skin creates one lottie animation per TGS card and the old
    // code never called .destroy() when a card left the DOM → WebGL
    // context + shader leaks. Wrap loadAnimation to track instances and
    // destroy them as soon as their container is removed. (ES5-safe:
    // no WeakMap in IE11, so use a Map-like object keyed by container.)
    if (typeof window.lottie !== 'undefined' && typeof window.lottie.loadAnimation === 'function' && !window.lottie.__nbPatched__) {
        var origLoad = window.lottie.loadAnimation;
        var tracked = {};
        var byIndex = 0;
        window.lottie.loadAnimation = function (params) {
            var anim = origLoad.call(this, params);
            var c = params && params.container;
            if (c && anim && typeof anim.destroy === 'function') {
                tracked['k' + byIndex++] = { c: c, a: anim };
            }
            return anim;
        };
        if (typeof MutationObserver === 'function') {
            var obs = new MutationObserver(function (muts) {
                for (var i = 0; i < muts.length; i++) {
                    var removed = muts[i].removedNodes;
                    for (var j = 0; j < removed.length; j++) {
                        var node = removed[j];
                        if (!node || node.nodeType !== 1) continue;
                        for (var k in tracked) {
                            var t = tracked[k];
                            // destroy when the container itself was removed
                            // (t.c === node) OR an ancestor of it was removed
                            // (node.contains(t.c)) — M3 tears down whole cards.
                            if (t && t.c && (t.c === node || node.contains(t.c))) {
                                try {
                                    t.a.destroy();
                                } catch (_) {}
                                delete tracked[k];
                            }
                        }
                    }
                }
            });
            obs.observe(doc.body, { childList: true, subtree: true });
        }
        window.lottie.__nbPatched__ = true;
    }

    // ── idle-scheduling helper (idle-time history persistence) ────────
    function ric(fn, timeout) {
        if (typeof window.requestIdleCallback === 'function') {
            return window.requestIdleCallback(fn, { timeout: timeout || 2000 });
        }
        var start = Date.now();
        return setTimeout(function () {
            fn({ didTimeout: true, timeRemaining: function () {
                return Math.max(0, 50 - (Date.now() - start));
            } });
        }, 50);
    }
    function cancelRic(id) {
        if (typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(id);
        else clearTimeout(id);
    }

    window.__NB_COMPAT__ = {
        engine: engine,
        noBundle: isLegacy, // legacy engines cannot run the modern bundle
        ric: ric,
        cancelRic: cancelRic,
    };
})();
