/**
 * Button — the Neo-Brutalist workhorse.
 * Variants map to semantic color tokens; sizes md/sm/xs.
 * Interaction: hover lifts off the shadow, active "slams" into the page.
 */
import React from 'react';
import { Icon } from '../../icons';
import './styles.css';

const ICON_SIZE = { md: 18, sm: 16, xs: 14 };

export function Button({
    variant = 'primary',
    size = 'md',
    icon,
    iconRight,
    loading = false,
    className = '',
    children,
    disabled,
    type = 'button',
    ...props
}) {
    const cls = ['nb-btn', `nb-btn--${variant}`, `nb-btn--${size}`, loading && 'nb-btn--loading', className]
        .filter(Boolean)
        .join(' ');
    const is = ICON_SIZE[size] || 18;
    return (
        <button type={type} className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
            {loading ? <span className="nb-spinner" aria-hidden="true" /> : icon ? <Icon name={icon} size={is} /> : null}
            {children != null && <span className="nb-btn__label">{children}</span>}
            {iconRight && !loading && <Icon name={iconRight} size={is} />}
        </button>
    );
}

/** Square icon-only button (40 / 32 / 26). */
export function IconButton({
    icon,
    label,
    size = 'md',
    variant = 'outline',
    className = '',
    ...props
}) {
    const cls = ['nb-iconbtn', `nb-iconbtn--${variant}`, `nb-iconbtn--${size}`, className].filter(Boolean).join(' ');
    return (
        <button type="button" className={cls} aria-label={label} title={label} {...props}>
            <Icon name={icon} size={size === 'md' ? 20 : 16} />
        </button>
    );
}
