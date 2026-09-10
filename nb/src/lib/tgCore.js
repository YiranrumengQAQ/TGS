/**
 * Telegram Bot core — direct port of the M3 app's TGBotCore
 * (long-polling getUpdates + file URL resolution + sticker set lookup).
 */
export class TGBotCore {
    constructor(token) {
        this.token = token;
        this.apiBase = `https://api.telegram.org/bot${token}`;
        this.fileApiBase = `https://api.telegram.org/file/bot${token}`;
        this.lastUpdateId = 0;
        this.isPolling = false;
        this.consecutiveErrors = 0;
        this._inflight = null; // AbortController of the latest request
    }

    /** Abort an in-flight request (e.g. when the user stops polling). */
    abort() {
        try {
            this._inflight && this._inflight.abort();
        } catch (_) {}
    }

    async request(method, params = {}, timeoutMs = 25000) {
        const controller = new AbortController();
        this._inflight = controller;
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const url = new URL(`${this.apiBase}/${method}`);
            Object.keys(params).forEach((k) => url.searchParams.append(k, params[k]));
            const resp = await fetch(url, { signal: controller.signal });
            const data = await resp.json();
            if (!data.ok) {
                const err = new Error(`TG API: ${data.description}`);
                err.code = data.error_code;
                err.description = data.description;
                throw err;
            }
            return data.result;
        } finally {
            clearTimeout(timer);
        }
    }

    async getFileUrl(fileId) {
        const file = await this.request('getFile', { file_id: fileId });
        return `${this.fileApiBase}/${file.file_path}`;
    }

    async getStickerSet(setName) {
        if (!setName) return null;
        return this.request('getStickerSet', { name: setName });
    }
}
