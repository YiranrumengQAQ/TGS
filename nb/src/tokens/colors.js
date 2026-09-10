/**
 * Neo-Brutalism color tokens — RAW palette + SEMANTIC mapping.
 *
 * Architecture follows the Gumroad Foundry design system:
 *   raw palette ──► semantic tokens ──► CSS custom properties (../../styles/tokens.css)
 *
 * Raw values are neutral ("blue-500", "paper", "ink"); semantic tokens
 * ("color-primary", "color-surface", "color-outline") are what components
 * are allowed to consume. Theming (light/dark) is a swap of the semantic
 * layer only — components never see raw palette values.
 */

// ── Raw palette ────────────────────────────────────────────────────────────
export const palette = {
    ink:    '#0A0A0A',
    paper:  '#F2EFE9',
    white:  '#FFFFFF',
    cream:  '#FAF7F0',

    yellow: { 300: '#FFE066', 400: '#FFD312' },
    blue:   { 100: '#DCE6FF', 500: '#2F6BFF', 600: '#1E5AE8' },
    pink:   { 100: '#FFDFF2', 400: '#FF71CE' },
    green:  { 100: '#D3F5E1', 500: '#12B76A', 600: '#0E9F5B' },
    orange: { 100: '#FFE8CC', 500: '#FF8A00' },
    red:    { 100: '#FFDCD7', 500: '#F0381F', 600: '#D92C15' },
    purple: { 100: '#EBDFFF', 500: '#8C52FF' },

    stone: { 400: '#8A8578', 500: '#5F5B52', 600: '#44413A' },
    night: { 600: '#2E2E34', 700: '#232328', 800: '#1A1A1E', 900: '#121214' },
};

// ── Semantic tokens (light) ────────────────────────────────────────────────
const light = {
    'color-primary':            palette.yellow[400],
    'color-on-primary':         palette.ink,
    'color-secondary':          palette.pink[400],
    'color-on-secondary':       palette.ink,
    'color-accent':             palette.blue[500],
    'color-accent-strong':      palette.blue[600],
    'color-accent-soft':        palette.blue[100],
    'color-success':            palette.green[500],
    'color-success-soft':       palette.green[100],
    'color-warning':            palette.orange[500],
    'color-warning-soft':       palette.orange[100],
    'color-danger':             palette.red[500],
    'color-danger-soft':        palette.red[100],

    'color-surface':                 palette.paper,
    'color-on-surface':              palette.ink,
    'color-on-surface-muted':        palette.stone[500],
    'color-surface-container-lowest':palette.white,
    'color-surface-container-low':   palette.cream,
    'color-surface-container':       '#EDE8DC',
    'color-surface-container-high':  '#E4DED0',
    'color-surface-container-highest':'#DBD4C4',

    'color-outline':        palette.ink,
    'color-outline-faint':  'rgba(10, 10, 10, 0.18)',
    'color-checker':        'rgba(10, 10, 10, 0.06)',
    'color-shadow':         palette.ink,
    'color-on-inverse':     '#FFFFFF',
};

// ── Semantic tokens (dark) ─────────────────────────────────────────────────
const dark = {
    'color-primary':            palette.yellow[400],
    'color-on-primary':         palette.ink,
    'color-secondary':          palette.pink[400],
    'color-on-secondary':       palette.ink,
    'color-accent':             '#5B8CFF',
    'color-accent-strong':      '#7AA2FF',
    'color-accent-soft':        '#1D2742',
    'color-success':            '#2BD381',
    'color-success-soft':       '#123426',
    'color-warning':            '#FFA02E',
    'color-warning-soft':       '#3A2A12',
    'color-danger':             '#FF5D47',
    'color-danger-soft':        '#3D1712',

    'color-surface':                 palette.night[900],
    'color-on-surface':              '#F4F1E8',
    'color-on-surface-muted':        '#A39E91',
    'color-surface-container-lowest':palette.night[800],
    'color-surface-container-low':   palette.night[700],
    'color-surface-container':       '#2A2A31',
    'color-surface-container-high':  '#33333B',
    'color-surface-container-highest':'#3D3D47',

    'color-outline':        '#F4F1E8',
    'color-outline-faint':  'rgba(244, 241, 232, 0.22)',
    'color-checker':        'rgba(244, 241, 232, 0.07)',
    // Neo-brutalism dark: hard "light sticker" offset keeps the signature look.
    'color-shadow':         '#F4F1E8',
    'color-on-inverse':     '#121214',
};

export const semantic = { light, dark };
