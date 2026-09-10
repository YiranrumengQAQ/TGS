/**
 * Injects the Neo-Brutalist webfont stack (idempotent).
 * The patch loader calls this too, so the FAB/splash get fonts even
 * before the React bundle arrives.
 */
const FONT_HREF =
    'https://fonts.googleapis.com/css2?family=Archivo+Black&family=Noto+Sans+SC:wght@400;500;700;900&family=Space+Grotesk:wght@400;500;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap';
const MARK = '__nb_fonts__';

export function ensureFonts() {
    if (typeof document === 'undefined') return;
    if (document.querySelector(`link[data-${MARK}]`)) return;
    const pre = document.createElement('link');
    pre.rel = 'preconnect';
    pre.href = 'https://fonts.gstatic.com';
    pre.crossOrigin = 'anonymous';
    document.head.appendChild(pre);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONT_HREF;
    link.setAttribute(`data-${MARK}`, 'true');
    document.head.appendChild(link);
}
