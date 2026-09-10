/**
 * StatusBadge — connection state chip (offline / online / error).
 */
import React from 'react';
import './styles.css';

export function StatusBadge({ state = 'offline', text }) {
    return (
        <span className={`nb-status nb-status--${state}`} role="status">
            <span className="nb-status__dot" aria-hidden="true" />
            <span className="nb-status__text">{text}</span>
        </span>
    );
}
