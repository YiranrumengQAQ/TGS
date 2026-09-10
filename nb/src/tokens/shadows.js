/**
 * Elevation tokens — HARD OFFSET SHADOWS, the defining trait of Neo-Brutalism.
 *
 * Unlike Material 3's soft blurred shadows, elevation here is a solid,
 * pixel-crisp offset in the "shadow" color (ink in light theme, light-ink
 * in dark theme). Values are geometry only; the final `box-shadow` is
 * composed with var(--nb-color-shadow) inside styles/tokens.css.
 *
 * Interaction contract (used by buttons/cards):
 *   rest    → shadow-2, translate(0,0)
 *   hover   → shadow-3, translate(-1px,-1px)
 *   pressed → shadow-0, translate(offset, offset)  ("slammed into the page")
 */
export const shadows = {
    0: '0 0 0 0',
    1: '3px 3px 0 0',
    2: '4px 4px 0 0',
    3: '6px 6px 0 0',
    4: '8px 8px 0 0',
    5: '10px 10px 0 0',
};
