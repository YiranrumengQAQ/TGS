/**
 * Z-index tokens.
 * NOTE: the NB app renders inside the patch overlay (z 100000), so these
 * values are *local* to the NB surface — they never need to compete with
 * the Material 3 page underneath.
 */
export const zindex = {
    base: 0,
    raise: 10,
    sticky: 100,
    dropdown: 200,
    modal: 300,
    snackbar: 400,
};
