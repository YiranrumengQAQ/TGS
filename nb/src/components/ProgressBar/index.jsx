/**
 * ProgressBar — chunky striped progress (ZIP packing etc.).
 */
import React from 'react';
import './styles.css';

export function ProgressBar({ value = 0, label, detail, className = '', ...props }) {
    const v = Math.max(0, Math.min(100, Math.round(value)));
    return (
        <div className={['nb-progress', className].filter(Boolean).join(' ')} role="progressbar" aria-valuenow={v} {...props}>
            {label && <span className="nb-progress__label">{label}</span>}
            <div className="nb-progress__track">
                <div className="nb-progress__fill" style={{ width: `${v}%` }} />
            </div>
            <span className="nb-progress__value">{detail ?? `${v}%`}</span>
        </div>
    );
}
