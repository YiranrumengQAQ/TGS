/**
 * Badge — small stamped labels (type chips, status tags).
 */
import React from 'react';
import { Icon } from '../../icons';
import './styles.css';

export function Badge({ variant = 'default', size = 'md', icon, className = '', children, ...props }) {
    const cls = ['nb-badge', `nb-badge--${variant}`, size && size !== 'md' ? `nb-badge--${size}` : '', className]
        .filter(Boolean)
        .join(' ');
    return (
        <span className={cls} {...props}>
            {icon && <Icon name={icon} size={size === 'tiny' ? 10 : 12} />}
            {children}
        </span>
    );
}
