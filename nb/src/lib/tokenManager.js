/**
 * Bot token storage — same localStorage key & salt as the Material 3 app,
 * so a token typed in either skin is visible to the other.
 */
const KEY = 'tg_bot_token';
const SALT = 'SuperSecret_TgSticker_2026';

export const TokenManager = {
    save(token) {
        try {
            localStorage.setItem(KEY, btoa(encodeURIComponent(token + SALT)));
        } catch (_) {}
    },
    get() {
        let encrypted = null;
        try {
            encrypted = localStorage.getItem(KEY);
        } catch (_) {}
        if (!encrypted) return null;
        try {
            const decrypted = decodeURIComponent(atob(encrypted));
            return decrypted.replace(SALT, '');
        } catch (_) {
            return null;
        }
    },
    clear() {
        try {
            localStorage.removeItem(KEY);
        } catch (_) {}
    },
};
