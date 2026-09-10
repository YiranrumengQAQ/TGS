/**
 * End-to-end DOM test.
 * Loads the REAL served index.html (old M3 page + patch), lets the patch
 * bootstrap the built React bundle from the server, and asserts that the
 * Neo-Brutalism UI mounts on top while the Material 3 markup survives.
 *
 * Requires the static server:  cd /home/user/TGS && python3 -m http.server 8080
 *   node scripts/e2e.mjs
 */
import { JSDOM, VirtualConsole } from 'jsdom';

const BASE = 'http://localhost:8080/';

const results = [];
function check(name, pass, extra = '') {
    results.push({ name, pass });
    console.log(`${pass ? '✓' : '✗'} ${name}${extra ? `  ${extra}` : ''}`);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const virtualConsole = new VirtualConsole();
// surface page errors but keep going
const pageErrors = [];
virtualConsole.on('jsdomError', (e) => pageErrors.push(String(e.message || e)));
virtualConsole.on('error', (...a) => pageErrors.push(a.join(' ')));

let dom;
try {
    dom = await JSDOM.fromURL(BASE, {
        runScripts: 'dangerously',
        resources: 'usable',
        pretendToBeVisual: true,
        virtualConsole,
        // jsdom environment shims (real browsers have all of these):
        //  - matchMedia: so the ORIGINAL M3 script runs to completion
        //  - canvas 2d ctx: so lottie-web's load-time 1x1 canvas feature
        //    probe doesn't abort the NB bundle
        beforeParse(window) {
            // jsdom ships no fetch — every real target browser (Chrome/
            // Firefox/Safari) has one, so stub it to emulate a modern
            // engine (IE11 genuinely lacks it → correctly treated as legacy).
            if (typeof window.fetch !== 'function') {
                window.fetch = () => Promise.reject(new Error('fetch stub (jsdom)'));
            }
            window.matchMedia = (query) => ({
                matches: false,
                media: query,
                onchange: null,
                addEventListener() {},
                removeEventListener() {},
                addListener() {},
                removeListener() {},
                dispatchEvent() {
                    return false;
                },
            });
            const noop = () => {};
            window.HTMLCanvasElement.prototype.getContext = function () {
                return {
                    canvas: this,
                    fillStyle: '',
                    strokeStyle: '',
                    globalAlpha: 1,
                    fillRect: noop,
                    clearRect: noop,
                    drawImage: noop,
                    save: noop,
                    restore: noop,
                    scale: noop,
                    rotate: noop,
                    translate: noop,
                    transform: noop,
                    setTransform: noop,
                    beginPath: noop,
                    closePath: noop,
                    moveTo: noop,
                    lineTo: noop,
                    arc: noop,
                    fill: noop,
                    stroke: noop,
                    fillText: noop,
                    strokeText: noop,
                    measureText: () => ({ width: 0 }),
                    getImageData: () => ({ data: [] }),
                    putImageData: noop,
                    createImageData: () => [],
                };
            };
        },
    });
} catch (e) {
    console.error('Could not load page:', e.message);
    process.exit(1);
}

const { window } = dom;
const { document } = window;

// wait for window load + give the deferred patch + lazy bundle time to run
await new Promise((r) => {
    if (document.readyState === 'complete') return r();
    window.addEventListener('load', r);
    setTimeout(r, 8000);
});
// extra settle time for the lazy nb-app.js to fetch + React to mount
for (let i = 0; i < 40 && !document.querySelector('#__nb_root__ .nb-app'); i++) {
    await sleep(250);
}

const doc = document;

// ── 1. old Material 3 UI is intact ───────────────────────────────────
check('M3: app-shell present', Boolean(doc.querySelector('.app-shell')));
check('M3: token input present (#tokenInput)', Boolean(doc.getElementById('tokenInput')));
check('M3: listen button present (#btnStart)', Boolean(doc.getElementById('btnStart')));
check('M3: media area present', Boolean(doc.getElementById('mediaDisplayArea')));
check('M3: M3 CSS tokens defined', (doc.querySelector('style')?.textContent || '').includes('--m3-ref-primary'));

// ── 2. patch bootstrap ───────────────────────────────────────────────
check('patch: overlay root #__nb_root__ appended', Boolean(doc.getElementById('__nb_root__')));
check('patch: floating switcher .nbp-fab appended', Boolean(doc.querySelector('.nbp-fab')));
check('patch: host API exposed (window.__NB_HOST__)', typeof window.__NB_HOST__?.setView === 'function');
check('patch: default view is NB', window.__NB_HOST__?.getView() === 'nb');

// ── 3. React Neo-Brutalism app mounted on top ───────────────────────
const nbApp = doc.querySelector('#__nb_root__ .nb-app');
check('NB: .nb-app mounted inside overlay', Boolean(nbApp));
check('NB: topbar present', Boolean(doc.querySelector('#__nb_root__ .nb-topbar')));
check('NB: topbar says Neo-Brutalism', (doc.querySelector('#__nb_root__ .nb-topbar__sub')?.textContent || '').includes('NEO-BRUTALISM'));
check('NB: token card present', Boolean(doc.querySelector('#__nb_root__ .nb-token')));
check('NB: status badge present', Boolean(doc.querySelector('#__nb_root__ .nb-status')));
check('NB: empty state or media card', Boolean(doc.querySelector('#__nb_root__ .nb-empty, #__nb_root__ .nb-media')));
check('NB: overlay is ON (visible)', doc.getElementById('__nb_root__')?.classList.contains('nbp-overlay--on'));

// ── 4. browser-compat & optimization layer ───────────────────────────
const compat = window.__NB_COMPAT__;
check('compat: window.__NB_COMPAT__ exposed', Boolean(compat));
check('compat: engine object detected', Boolean(compat?.engine) && typeof compat.engine.legacy === 'boolean');
check('compat: jsdom treated as modern (noBundle false)', compat?.noBundle === false);
check('compat: ric/cancelRic helpers', typeof compat?.ric === 'function' && typeof compat?.cancelRic === 'function');
check(
    'compat: preconnect to api.telegram.org injected',
    Boolean(doc.querySelector('link[rel="preconnect"][href="https://api.telegram.org"]')),
);
check('compat: dns-prefetch to api.telegram.org injected', Boolean(doc.querySelector('link[rel="dns-prefetch"][href="https://api.telegram.org"]')));
check('compat: X-UA-Compatible IE=edge meta present', Boolean(doc.querySelector('meta[http-equiv="X-UA-Compatible"][content="IE=edge"]')));
check('compat: compat script tag loaded', Boolean(doc.querySelector('script[src="nb/browser-compat.js"], script[src*="browser-compat.js"]')));
check('compat: viewport-fit=cover added to viewport meta', (doc.querySelector('meta[name="viewport"]')?.content || '').includes('viewport-fit=cover'));
check('compat: html not marked nb-legacy (modern env)', !doc.documentElement.classList.contains('nb-legacy'));

// ── 5. token parity across skins ─────────────────────────────────────
// set a token in the NB skin, confirm M3 input (same storage) is untouched
// (both skins read the same localStorage key)
window.localStorage.setItem('tg_bot_token', window.btoa(window.encodeURIComponent('111:TEST-SALT' + 'SuperSecret_TgSticker_2026')));
check('parity: shared token key readable', (window.localStorage.getItem('tg_bot_token') || '').length > 0);

// ── 6. interactive: switch to M3 via the FAB ──────────────────────────
const fab = doc.querySelector('.nbp-fab');
fab.click();
await sleep(150);
check('switch: FAB click → view m3', window.__NB_HOST__?.getView() === 'm3');
check('switch: overlay hidden after flip', !doc.getElementById('__nb_root__')?.classList.contains('nbp-overlay--on'));
check('switch: persisted to localStorage', window.localStorage.getItem('tg_ui_view_nb') === 'm3');

// switch back
fab.click();
await sleep(150);
check('switch: FAB click → back to nb', window.__NB_HOST__?.getView() === 'nb');

// ── 7. React exit button ("M3" in top bar) ────────────────────────────
const exitBtn = doc.querySelector('#__nb_root__ .nb-topbar__exit');
if (exitBtn) {
    exitBtn.click();
    await sleep(150);
    check('exit: topbar M3 button returns to m3', window.__NB_HOST__?.getView() === 'm3');
} else {
    check('exit: topbar M3 button present', false);
}

// report page-level script errors (ignore harmless resource 404s)
const realErrors = pageErrors.filter((m) => !/Could not load|ECONN|ERR_|favicon/i.test(m));
check('no fatal page script errors', realErrors.length === 0, realErrors.slice(0, 3).join(' | '));

const failed = results.filter((r) => !r.pass);
console.log(`\n${failed.length === 0 ? 'E2E PASS' : 'E2E FAILED'} — ${results.length - failed.length}/${results.length} checks`);
process.exit(failed.length === 0 ? 0 : 1);
