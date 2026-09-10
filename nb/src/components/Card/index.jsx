/**
 * Card — bordered surface with optional brutal header.
 */
import React from 'react';
import { Icon } from '../../icons';
import './styles.css';

export function Card({ as: Tag = 'div', variant = 'raised', className = '', children, ...props }) {
    const cls = ['nb-card', variant && `nb-card--${variant}`, className].filter(Boolean).join(' ');
    return (
        <Tag className={cls} {...props}>
            {children}
        </Tag>
    );
}

export function CardHeader({ icon, title, sub, extra }) {
    return (
        <div className="nb-card__head">
            {icon && (
                <div className="nb-card__head-icon" aria-hidden="true">
                    <Icon name={icon} size={19} strokeWidth={2.2} />
                </div>
            )}
            <div className="nb-card__head-text">
                <div className="nb-card__head-title">{title}</div>
                {sub && <div className="nb-card__head-sub">{sub}</div>}
            </div>
            {extra && <div className="nb-card__head-extra">{extra}</div>}
        </div>
    );
}
