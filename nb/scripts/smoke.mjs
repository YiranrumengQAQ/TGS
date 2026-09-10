/**
 * SSR smoke test: renders <App/> through Vite's module runner with
 * browser globals stubbed. Catches render-time crashes before shipping.
 *   node scripts/smoke.mjs
 */
import { createServer } from 'vite';
import React from 'react';
import { renderToString } from 'react-dom/server';

// ── browser global stubs (state used during initial render) ──────────
const store = {
    tg_bot_token: btoa(encodeURIComponent('1234567890:ABCdefGHIjklMNOpqrsTUVwxyzSuperSecret_TgSticker_2026')),
    tg_sticker_history_nb: JSON.stringify([
        {
            fileId: 'CAACAgIAAxkAAg',
            type: 'webp',
            originalUrl: 'https://api.telegram.org/file/botX/AQADCAACAgIAAxkAAQ',
            emoji: '👍',
            setName: null,
            fileSize: 12345,
            dimensions: '512×512',
            mimeType: 'image/webp',
            sourceCategory: 'sticker',
            thumbnail: null,
            timestamp: Date.now(),
        },
    ]),
};
globalThis.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => {
        store[k] = String(v);
    },
    removeItem: (k) => {
        delete store[k];
    },
};
globalThis.window = {
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
    location: { search: '', href: 'http://localhost/' },
};
Object.defineProperty(globalThis, 'navigator', {
    value: { clipboard: { writeText: async () => {} } },
    configurable: true,
});

const vite = await createServer({
    root: process.cwd(),
    logLevel: 'error',
    server: { middlewareMode: true },
    appType: 'custom',
    ssr: { noExternal: ['lottie-web'] },
});

const fail = (msg) => {
    console.error('SMOKE FAIL:', msg);
    process.exitCode = 1;
};

try {
    const { default: App } = await vite.ssrLoadModule('/src/App.jsx');
    const html = renderToString(React.createElement(App, { host: { setView() {} } }));
    console.log('RENDER OK · html length:', html.length);

    const checks = [
        ['top bar title', html.includes('Sticker Hub')],
        ['NB stamp', html.includes('NB')],
        ['token field', html.includes('nb-token')],
        ['status badge', html.includes('nb-status')],
        ['media card rendered from history', html.includes('nb-media')],
        ['info grid label', html.includes('WEBP')],
        ['history section', html.includes('nb-history')],
        ['footer', html.includes('NEO-BRUTALISM · REACT')],
        ['start button', html.includes('监听')],
    ];
    let ok = true;
    for (const [name, pass] of checks) {
        console.log(`${pass ? '✓' : '✗'} ${name}`);
        if (!pass) ok = false;
    }
    if (!ok) fail('one or more render checks failed');
    console.log(ok ? 'SMOKE PASS' : 'SMOKE FAILED');
} catch (e) {
    fail(e.stack || String(e));
} finally {
    await vite.close();
}
