/**
 * Download manager — direct port of the M3 app's DownloadManager.
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
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => document.body.removeChild(a), 300);
    },

    formatFileSize(bytes) {
        if (!bytes) return '未知';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(2)} MB`;
    },
};
