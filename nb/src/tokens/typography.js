/**
 * Typography tokens.
 *
 * Neo-Brutalism type system:
 *   - display : ultra-heavy grotesk for headers/labels (stencil-like)
 *   - sans    : workhorse UI face
 *   - mono    : data, ids, tokens, numeric values
 * CJK (中文) falls back to Noto Sans SC / PingFang / YaHei — the app UI is zh-CN.
 */
export const typography = {
    font: {
        display:
            "'Archivo Black', 'Space Grotesk', 'Noto Sans SC', system-ui, -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif",
        sans: "'Space Grotesk', 'Noto Sans SC', system-ui, -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif",
        mono: "'Space Mono', 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
    },
    size: {
        xs: '0.6875rem',
        sm: '0.75rem',
        md: '0.875rem',
        lg: '1rem',
        xl: '1.25rem',
        '2xl': '1.625rem',
        '3xl': '2rem',
    },
    weight: {
        normal: 400,
        medium: 500,
        bold: 700,
        black: 900,
    },
    lineHeight: {
        tight: 1.05,
        snug: 1.3,
        base: 1.55,
    },
    letterSpacing: {
        label: '0.08em',
        title: '0.01em',
        stamp: '0.14em',
    },
};
