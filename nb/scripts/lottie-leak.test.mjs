/**
 * Unit test — M3 lottie memory-leak fix in browser-compat.js.
 *
 * Proves the wrapped lottie.loadAnimation tracks instances and calls
 * .destroy() when (a) the animation container itself is removed, and
 * (b) an ancestor of the container is removed (M3 tears down whole cards).
 *
 *   node scripts/lottie-leak.test.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const compatSrc = readFileSync(join(here, '..', 'browser-compat.js'), 'utf8');

const results = [];
const check = (name, pass, extra = '') => {
    results.push({ name, pass });
    console.log(`${pass ? '✓' : '✗'} ${name}${extra ? `  ${extra}` : ''}`);
};

const dom = new JSDOM(
    '<body><div id="wrap"><div class="card-a"></div><div class="card-b"></div></div></body>',
    { runScripts: 'dangerously', pretendToBeVisual: true },
);
const { window } = dom;

// fake lottie: loadAnimation returns an anim that records destroy()
const destroyed = [];
window.lottie = {
    loadAnimation(params) {
        const anim = {
            container: params.container,
            destroy() {
                destroyed.push(params.container.className || 'unknown');
            },
        };
        return anim;
    },
};

// run the compat layer (idempotent IIFE) with our fake lottie present
window.eval(compatSrc);

check('lottie wrapper applied (lottie.__nbPatched__)', window.lottie.__nbPatched__ === true);

// (a) create an animation whose container is a card, then remove the card
const cardA = window.document.querySelector('.card-a');
window.lottie.loadAnimation({ container: cardA });
check('anim registered for card-a', destroyed.length === 0);

cardA.remove();
// MutationObserver is async (microtask) — give it a tick
await new Promise((r) => setTimeout(r, 50));
check('destroy called when card (container) removed', destroyed.includes('card-a'), `destroyed=${destroyed.join(',')}`);

// (b) ancestor removal: animation container is a CHILD of card-b, remove card-b
const cardB = window.document.querySelector('.card-b');
const inner = window.document.createElement('div');
inner.className = 'lottie-inner';
cardB.appendChild(inner);
window.lottie.loadAnimation({ container: inner });
cardB.remove();
await new Promise((r) => setTimeout(r, 50));
check('destroy called when ANCESTOR card removed', destroyed.includes('lottie-inner'), `destroyed=${destroyed.join(',')}`);

// (c) unrelated removal must NOT destroy
const cardC = window.document.createElement('div');
cardC.className = 'card-c';
window.document.body.appendChild(cardC);
window.lottie.loadAnimation({ container: cardC });
const unrelated = window.document.createElement('div');
window.document.body.appendChild(unrelated);
unrelated.remove();
await new Promise((r) => setTimeout(r, 50));
check('no destroy for unrelated removal', !destroyed.includes('card-c'), `destroyed=${destroyed.join(',')}`);

const failed = results.filter((r) => !r.pass);
console.log(`\n${failed.length === 0 ? 'LOTTIE-LEAK PASS' : 'LOTTIE-LEAK FAILED'} — ${results.length - failed.length}/${results.length} checks`);
process.exit(failed.length === 0 ? 0 : 1);
