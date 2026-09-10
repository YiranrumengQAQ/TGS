/**
 * E2E — IE11 / legacy-engine simulation.
 *
 * Loads the real served index.html with an IE11 user agent and NO fetch
 * (exactly like IE11). Asserts the compat layer + patch keep the visitor
 * on Material 3: modern NB bundle is NOT loaded, no overlay/fab, the
 * .nb-legacy class + ie-fallback.css ARE applied, and the M3 markup is
 * intact.
 *
 * Note: jsdom still PARSES modern JS (IE11's engine would not), so this
 * test proves the patch's *decisions* under a legacy fingerprint — the
 * part this layer owns — not IE11's own JS engine.
 *
 * Requires the static server:  cd /home/user/TGS && python3 -m http.server 8080
 *   node scripts/e2e-legacy.mjs
 */
import { JSDOM, VirtualConsole } from 'jsdom';

const BASE = 'http://localhost:8080/';
const IE11_UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; Trident/7.0; .NET4.0E; rv:11.0) like Gecko';

const results = [];
function check(name, pass, extra = '') {
    results.push({ name, pass });
    console.log(`${pass ? '✓' : '✗'} ${name}${extra ? `  ${extra}` : ''}`);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const virtualConsole = new VirtualConsole();
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
        beforeParse(window) {
            // jsdom's `userAgent` option only rewrites request headers, so
            // force navigator.userAgent to the IE11 fingerprint directly.
            Object.defineProperty(window.navigator, 'userAgent', { value: IE11_UA, configurable: true });
            // IE11 has no fetch — leave it absent (do NOT stub).
            // matchMedia/canvas shims so the M3 page script can at least run in jsdom.
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
                return { canvas: this, fillStyle: '', save: noop, restore: noop, clearRect: noop, fillRect: noop, getImageData: () => ({ data: [] }) };
            };
            // IE11 has no CSS.supports → emulate absence so the compat layer's
            // feature check (not just the UA) also classifies this as legacy.
            delete window.CSS;
        },
    });
} catch (e) {
    console.error('Could not load page:', e.message);
    process.exit(1);
}

const { window } = dom;
const { document } = window;

await new Promise((r) => {
    if (document.readyState === 'complete') return r();
    window.addEventListener('load', r);
    setTimeout(r, 8000);
});
await sleep(1200); // let the (ES5) compat layer + patch finish

const compat = window.__NB_COMPAT__;

// ── compat layer under a legacy fingerprint ──────────────────────────
check('legacy: __NB_COMPAT__ exposed', Boolean(compat));
check('legacy: engine.ie detected', compat?.engine?.ie === true, 'ua=' + (compat?.engine?.ua || '').slice(0, 40));
check('legacy: engine.legacy true', compat?.engine?.legacy === true);
check('legacy: noBundle true', compat?.noBundle === true);

// ── IE mode applied to the page ──────────────────────────────────────
check('legacy: html.nb-legacy class set', document.documentElement.classList.contains('nb-legacy'));
check(
    'legacy: ie-fallback.css injected',
    Boolean(document.querySelector('link[rel="stylesheet"][href*="ie-fallback.css"]')),
);
check('legacy: no NB bundle loaded (__NB_APP_MOUNT__ absent)', typeof window.__NB_APP_MOUNT__ === 'undefined');
check('legacy: no overlay content (.nb-app absent)', !document.querySelector('.nb-app'));
check('legacy: no floating switcher (.nbp-fab absent)', !document.querySelector('.nbp-fab'));
check(
    'legacy: overlay hidden even if present',
    !document.getElementById('__nb_root__') ||
        !document.getElementById('__nb_root__').classList.contains('nbp-overlay--on'),
);

// ── Material 3 underneath is intact ──────────────────────────────────
check('legacy: M3 app-shell present', Boolean(document.querySelector('.app-shell')));
check('legacy: M3 token input present', Boolean(document.getElementById('tokenInput')));
check('legacy: M3 listen button present', Boolean(document.getElementById('btnStart')));
check('legacy: M3 media area present', Boolean(document.getElementById('mediaDisplayArea')));

// host API still answers (but refuses to switch to NB)
const host = window.__NB_HOST__;
check('legacy: host API exposed', typeof host?.getView === 'function');
check('legacy: host.getView() === m3', host?.getView() === 'm3');
host?.setView('nb');
check('legacy: setView(nb) refused on IE', host?.getView() === 'm3');

// no fatal errors from the PATCH/compat layer (M3's own modern JS runs in
// jsdom regardless — IE11's engine limitations are outside this layer)
const realErrors = pageErrors.filter((m) => !/Could not load|ECONN|ERR_|favicon|fetch stub/i.test(m));
check('legacy: no fatal patch-layer errors', realErrors.length === 0, realErrors.slice(0, 3).join(' | '));

const failed = results.filter((r) => !r.pass);
console.log(`\n${failed.length === 0 ? 'LEGACY E2E PASS' : 'LEGACY E2E FAILED'} — ${results.length - failed.length}/${results.length} checks`);
process.exit(failed.length === 0 ? 0 : 1);
