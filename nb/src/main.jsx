/**
 * Entry — exports mountNBApp() for the patch overlay and self-mounts
 * in standalone mode (nb/index.html → #root).
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { ensureFonts } from './lib/fonts';
// engine-aware optimizations (idempotent — the patch may have run it first)
import '../browser-compat.js';

ensureFonts();

const mounts = new WeakMap();

function mountNBApp(el, host = null) {
    if (!el) return null;
    let entry = mounts.get(el);
    if (!entry) {
        const root = createRoot(el);
        entry = { root, host: null };
        mounts.set(el, entry);
    }
    if (host) entry.host = host;
    entry.root.render(<App host={entry.host} />);
    return entry;
}

// exposed to the vanilla patch loader (nb/nb-patch.js)
window.__NB_APP_MOUNT__ = mountNBApp;

// standalone mode
const standalone = document.getElementById('root');
if (standalone) mountNBApp(standalone, null);
