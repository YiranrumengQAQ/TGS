/**
 * Download manager — hardened port of the M3 app's DownloadManager.
 *
 * Fixes the two classic "download just doesn't happen" failure modes:
 *  1. blob: URLs revoked too early (the click hasn't been processed yet)
 *     → saveBlob() keeps the object URL alive for 30s after the click.
 *  2. cross-origin URLs ignoring the `download` attribute (browser opens
 *     the file in a new tab instead) → callers can fetch the bytes first
 *     via fetchAsBlob() (Telegram CDN sends CORS: *) and save locally.
 *     fetchAsBlob() also adds per-request timeout + retries so one hung
 *     request can never stall a whole ZIP pack forever.
 */
export const DownloadManager = {
    /** webp → png via canvas (needs CORS-clean URLs; Telegram API is). */
    convertWebpToPng(webpUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                try {
                    resolve(canvas.toDataURL('image/png'));
                } catch (_) {
                    reject(new Error('Canvas 跨域限制'));
                }
            };
            img.onerror = () => reject(new Error('图片加载失败'));
            img.src = webpUrl;
        });
    },

    triggerDownload(url, filename) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || '';
        a.rel = 'noopener';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        // Keep the anchor around long enough for the browser to fully
        // process the click; removing it in the same tick (or 0ms) can
        // abort the download in some engines.
        setTimeout(() => {
            if (a.parentNode) a.parentNode.removeChild(a);
        }, 1000);
    },

    /**
     * Save an in-memory Blob as a download. Creates the object URL,
     * clicks it, and revokes the URL 30s later (long after the browser
     * has captured the data — revoking at 5s or less can kill large
     * downloads that haven't started yet on slow connections).
     */
    saveBlob(blob, filename) {
        if (!(blob instanceof Blob)) {
            throw new Error('saveBlob: 需要一个 Blob');
        }
        const url = URL.createObjectURL(blob);
        try {
            this.triggerDownload(url, filename);
        } finally {
            setTimeout(() => URL.revokeObjectURL(url), 30000);
        }
    },

    /**
     * fetch(url) → Blob with timeout + retries.
     * @param {string} url
     * @param {{ timeoutMs?: number, retries?: number }} [opts]
     * @returns {Promise<Blob>}
     */
    async fetchAsBlob(url, { timeoutMs = 20000, retries = 2 } = {}) {
        let lastErr = null;
        for (let attempt = 0; attempt <= retries; attempt++) {
            if (attempt > 0) {
                // brief backoff between retries
                await new Promise((r) => setTimeout(r, 400 * attempt));
            }
            const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
            const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
            try {
                const resp = await fetch(url, ctrl ? { signal: ctrl.signal } : {});
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                const blob = await resp.blob();
                if (!blob || blob.size === 0) throw new Error('空文件');
                return blob;
            } catch (e) {
                if (e && e.name === 'AbortError') lastErr = new Error('请求超时');
                else lastErr = e;
            } finally {
                if (timer) clearTimeout(timer);
            }
        }
        throw lastErr || new Error('网络请求失败');
    },

    formatFileSize(bytes) {
        if (!bytes) return '未知';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(2)} MB`;
    },
};
