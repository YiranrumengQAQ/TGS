/**
 * EmptyState — dashed "drop zone" panel.
 */
import React from 'react';
import { Icon } from '../../icons';
import './styles.css';

export function EmptyState({ icon = 'image', title, desc }) {
    return (
        <div className="nb-empty">
            <div className="nb-empty__icon" aria-hidden="true">
                <Icon name={icon} size={34} strokeWidth={2.2} />
            </div>
            <div className="nb-empty__title">{title}</div>
            {desc && <div className="nb-empty__desc">{desc}</div>}
        </div>
    );
}
