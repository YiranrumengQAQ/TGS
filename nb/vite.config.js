import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Build config for the Neo-Brutalism overlay bundle.
 *
 * - base: '/nb/dist/'  → every asset URL in the built bundle is absolute under /nb/dist/,
 *   so the patch loader (nb/nb-patch.js) can load the single file /nb/dist/nb-app.js
 *   from the root index.html without any bundler at runtime.
 * - inlineDynamicImports → one self-contained script (React + lottie-web + jszip included).
 * - server.base '/'     → `npm run dev` still serves the standalone app at http://localhost:5173/
 */
export default defineConfig({
    plugins: [react()],
    base: '/nb/dist/',
    server: {
        base: '/',
        host: true,
        port: 5173,
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        target: 'es2019',
        rollupOptions: {
            output: {
                // IIFE: one self-contained CLASSIC script (no ESM syntax),
                // loadable via a plain <script> tag — which is exactly how
                // nb/nb-patch.js injects it (and how jsdom executes it).
                // CSS is compiled into the bundle and injected as <style>.
                format: 'iife',
                inlineDynamicImports: true,
                entryFileNames: 'nb-app.js',
            },
        },
    },
});
