/**
 * useTheme — light/dark preference, persisted under its own key so it
 * never collides with the Material 3 app's theme setting.
 */
import { useCallback, useEffect, useState } from 'react';

const KEY = 'tg_sticker_theme_nb';

export function useTheme() {
    const [theme, setTheme] = useState(() => {
        try {
            const saved = localStorage.getItem(KEY);
            if (saved === 'light' || saved === 'dark') return saved;
        } catch (_) {}
        try {
            const mql = typeof window !== 'undefined' && window.matchMedia
                ? window.matchMedia('(prefers-color-scheme: dark)')
                : null;
            return mql && mql.matches ? 'dark' : 'light';
        } catch (_) {
            return 'light';
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(KEY, theme);
        } catch (_) {}
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
    }, []);

    return { theme, toggleTheme };
}
